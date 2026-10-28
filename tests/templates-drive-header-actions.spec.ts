// Static test-only draft. These decisions are Bricklane-local extensions;
// upstream mutation outcomes and callback-error behavior are not claimed.
import { readFile } from "node:fs/promises";
import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  colorScheme: "light",
});

const faults = new WeakMap<Page, string[]>();
const writes = new WeakMap<Page, string[]>();

async function openNotifications(page: Page) {
  const trigger = page.getByRole("button", { name: "Notifications", exact: true });
  const sheet = page.getByRole("dialog", { name: "Notifications", exact: true });
  await expect(sheet).toHaveCount(0);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(sheet).toBeVisible();
  await expect
    .poll(() => sheet.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
  return sheet;
}

async function expectDecided(
  access: Locator,
  device: Locator,
  accessStatus: string,
  deviceStatus: string,
) {
  await expect(access.getByRole("status")).toHaveText(accessStatus);
  await expect(access.getByRole("button", { name: "Grant", exact: true })).toHaveCount(0);
  await expect(access.getByRole("button", { name: "Deny", exact: true })).toHaveCount(0);
  await expect(device.getByRole("status")).toHaveText(deviceStatus);
  await expect(device.getByRole("button", { name: "Revoke", exact: true })).toHaveCount(0);
  await expect(device.getByRole("button", { name: "This was me", exact: true })).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  faults.set(page, []);
  writes.set(page, []);
  page.on("pageerror", (error) => faults.get(page)!.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      faults.get(page)!.push(message.text());
    }
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (!["GET", "HEAD"].includes(request.method())) {
      writes.get(page)!.push(`${request.method()} ${request.url()}`);
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
});

test.afterEach(async ({ page }) => {
  expect(faults.get(page)).toEqual([]);
  expect(writes.get(page)).toEqual([]);
});

for (const decision of [
  {
    access: "Grant",
    accessStatus: "Edit access granted in this demo.",
    device: "Revoke",
    deviceStatus: "Demo session revoked.",
    checkDownload: true,
  },
  {
    access: "Deny",
    accessStatus: "Access request denied in this demo.",
    device: "This was me",
    deviceStatus: "Demo device marked as recognized.",
    checkDownload: false,
  },
] as const) {
  test(`Filespace local ${decision.access}/${decision.device} decisions persist across native close`, async ({
    page,
  }) => {
    await page.goto("/#/template-preview/filespace");
    const trigger = page.getByRole("button", { name: "Notifications", exact: true });
    await expect(trigger).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    let sheet = await openNotifications(page);
    let access = sheet.locator('[data-notification="access-request"]');
    let device = sheet.locator('[data-notification="new-device"]');
    await expect(access.getByRole("button", { name: "Grant", exact: true })).toBeVisible();
    await expect(access.getByRole("button", { name: "Deny", exact: true })).toBeVisible();
    await access.getByRole("button", { name: decision.access, exact: true }).click();
    await expect(access.getByRole("status")).toHaveText(decision.accessStatus);
    await expect(access.getByRole("button", { name: "Grant", exact: true })).toHaveCount(0);
    await expect(access.getByRole("button", { name: "Deny", exact: true })).toHaveCount(0);
    await expect(access.getByLabel("Unread notification", { exact: true })).toHaveCount(0);
    await expect(sheet.getByLabel("3 unread notifications", { exact: true })).toBeVisible();

    await expect(device.getByRole("button", { name: "Revoke", exact: true })).toBeVisible();
    await expect(device.getByRole("button", { name: "This was me", exact: true })).toBeVisible();
    await device.getByRole("button", { name: decision.device, exact: true }).click();
    await expectDecided(access, device, decision.accessStatus, decision.deviceStatus);
    await expect(sheet.getByLabel("3 unread notifications", { exact: true })).toBeVisible();

    if (decision.checkDownload) {
      const attachment = sheet.locator('[data-notification="file-attachment"]');
      const pending = page.waitForEvent("download");
      await attachment.getByRole("button", { name: "Download sample", exact: true }).click();
      const download = await pending;
      expect(download.suggestedFilename()).toBe("bricklane-sample-agreement.pdf");
      expect(await download.failure()).toBeNull();
      const path = await download.path();
      expect(path).toBeTruthy();
      const bytes = await readFile(path!);
      expect(bytes.subarray(0, 9).toString("ascii")).toBe("%PDF-1.7\n");
      expect(bytes.subarray(-5).toString("ascii")).toBe("%%EOF");
      const pdf = bytes.toString("ascii");
      expect(pdf).toContain("Bricklane - original demonstration agreement");
      expect(pdf).toContain("This document demonstrates a local file download.");
      expect(pdf).toContain("It creates no contract, payment, or remote account change.");
      const startxref = pdf.match(/startxref\n(\d+)\n%%EOF$/);
      expect(startxref).not.toBeNull();
      const xref = Number(startxref![1]);
      expect(Number.isSafeInteger(xref)).toBe(true);
      expect(xref).toBeGreaterThan(0);
      expect(xref).toBeLessThan(bytes.length);
      expect(bytes.subarray(xref, xref + 4).toString("ascii")).toBe("xref");
      const xrefHeader = pdf.slice(xref).match(/^xref\n0 (\d+)\n0000000000 65535 f \n/);
      expect(xrefHeader).not.toBeNull();
      const offsets = [...pdf.matchAll(/^(\d{10}) 00000 n $/gm)];
      expect(offsets).toHaveLength(Number(xrefHeader![1]) - 1);
      for (const [index, match] of offsets.entries()) {
        const offset = Number(match[1]);
        expect(bytes.subarray(offset).toString("ascii")).toMatch(
          new RegExp(`^${index + 1} 0 obj\\n`),
        );
      }
      await expect(attachment.getByRole("status")).toHaveText(
        "Original demo PDF prepared for download.",
      );
    }

    await sheet.getByRole("button", { name: "Dismiss notifications", exact: true }).click();
    await expect(sheet).toHaveCount(0);
    await expect(trigger).toBeFocused();
    sheet = await openNotifications(page);
    access = sheet.locator('[data-notification="access-request"]');
    device = sheet.locator('[data-notification="new-device"]');
    await expectDecided(access, device, decision.accessStatus, decision.deviceStatus);
    await expect(sheet.getByLabel("3 unread notifications", { exact: true })).toBeVisible();
    if (decision.checkDownload) {
      await expect(
        sheet.locator('[data-notification="file-attachment"]').getByRole("status"),
      ).toHaveText("Original demo PDF prepared for download.");
    }
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
