import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

async function open(page: import("@playwright/test").Page) {
  await page.goto("./#/preview/application/dialog/dialog-9");
  await page.getByRole("button", { name: "Open project form", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Create Project", exact: true })).toBeVisible();
}
for (const width of [1440, 390]) {
  test(`project retains real modal protection and all four portal destinations at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await open(page);
    const outer = page.locator('[data-dialog-entry="9"]');
    await expect(page.locator('[data-slot="dialog-overlay"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.style.pointerEvents)).toBe("none");
    for (const field of ["status", "priority", "members", "labels"]) {
      await page.locator(`#workspace-project-${field}`).click();
      const popup = page.locator('[data-slot="combobox-content"]');
      await expect(popup).toBeVisible();
      await expect
        .poll(() =>
          popup.evaluate((node) => {
            const bounds = node.getBoundingClientRect();
            const outer = node.closest('[data-dialog-entry="9"]')!.getBoundingClientRect();
            return (
              bounds.top >= outer.top &&
              bounds.bottom <= outer.bottom &&
              bounds.left >= outer.left &&
              bounds.right <= outer.right
            );
          }),
        )
        .toBe(true);
      expect(await popup.evaluate((node) => !!node.closest('[data-dialog-entry="9"]'))).toBe(true);
      await page.locator(`#workspace-project-${field}`).click();
      await expect(popup).toHaveCount(0);
    }
    await page.getByLabel("Project name", { exact: true }).focus();
    for (let index = 0; index < 20; index++) {
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(() => !!document.activeElement?.closest('[data-dialog-entry="9"]')),
      ).toBe(true);
    }
    const box = await outer.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await outer.getByRole("button", { name: "Close", exact: true }).click();
    await expect(outer).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Open project form", exact: true }),
    ).toBeFocused();
  });
}

test("status and priority support actual keyboard selection and submenu Escape stays inside project", async ({
  page,
}) => {
  await open(page);
  await page.locator("#workspace-project-status").click();
  await page.getByPlaceholder("Change status").fill("Paused");
  await page.getByPlaceholder("Change status").press("Enter");
  await expect(page.locator("#workspace-project-status")).toContainText("Paused");
  await page.locator("#workspace-project-priority").click();
  await page.getByPlaceholder("Change priority").fill("Urgent");
  await page.getByPlaceholder("Change priority").press("Enter");
  await expect(page.locator("#workspace-project-priority")).toContainText("Urgent");
  await page.locator("#workspace-project-status").click();
  await page.getByPlaceholder("Change status").press("Escape");
  await expect(page.locator('[data-slot="combobox-content"]')).toHaveCount(0);
  await expect(page.locator('[data-dialog-entry="9"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-dialog-entry="9"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open project form", exact: true })).toBeFocused();
});

test("multi-member and label clear paths still gate creation and retain typed values", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.getByLabel("Project name", { exact: true }).fill("QA modal project");
  await page.getByLabel("Key", { exact: true }).fill("qa-modal");
  await expect(page.getByLabel("Key", { exact: true })).toHaveValue("QA-MODAL");
  await page.locator("#workspace-project-members").click();
  await page.getByPlaceholder("Select members").fill("No assigned users");
  await page.getByRole("option", { name: "No assigned users", exact: true }).click();
  await page.locator("#workspace-project-members").click();
  await expect(page.getByRole("button", { name: "Create project", exact: true })).toBeDisabled();
  await page.locator("#workspace-project-members").click();
  await page.getByPlaceholder("Select members").fill("Nora");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.getByRole("option", { name: /Nora Chen/ }).click();
  await page.locator("#workspace-project-members").click();
  await page.locator("#workspace-project-labels").click();
  await page.getByPlaceholder("Select labels").fill("No label");
  await page.getByRole("option", { name: "No label", exact: true }).click();
  await page.locator("#workspace-project-labels").click();
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("QA modal project · QA-MODAL");
  await expect(page.getByRole("alert")).toContainText("1 owners · No labels");
});

test("cover upload retains the real File under modal containment", async ({ page }) => {
  await open(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "qa-modal-cover.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="navy"/></svg>',
    ),
  });
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("qa-modal-cover.svg");
});

test("actual project ZIP preserves native Dialog and official Portal destination consumers", async ({
  page,
}) => {
  await page.goto("./#/block/application/dialog/dialog-9");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const files = unzipSync(new Uint8Array(await readFile((await (await pending).path())!)));
  const project = strFromU8(files["src/blocks/application/dialog-variants/workspace/project.tsx"]);
  expect(project).not.toContain("modal={false}");
  expect(project).toContain("portalContainer={surface}");
  for (const field of ["status", "priority", "members", "labels"]) {
    expect(
      strFromU8(files[`src/blocks/application/dialog-variants/workspace/free/${field}-picker.tsx`]),
    ).toContain("portalContainer={portalContainer}");
  }
  expect(strFromU8(files["src/components/ui/combobox.tsx"])).toContain(
    "<ComboboxPrimitive.Portal container={portalContainer}>",
  );
});
