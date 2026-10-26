// Pending integration gate. Run against Root's approved candidate, one worker.
// This file has not been executed in the static M1 milestone.
import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const prefix = "/#/template-preview/filespace/settings";
const routes = [
  ["Profile", "", "Profile Details"],
  ["Workspace", "/workspace", "Workspace Details"],
  ["Team", "/team", "Workspace Team"],
  ["Billing", "/billing", "Billing Setup"],
  ["Member", "/team/alex-rivera", "Drive Usage"],
] as const;
const faults = new WeakMap<Page, string[]>();
const writes = new WeakMap<Page, string[]>();
const card = (page: Page, title: string) =>
  page
    .locator(".ds-card")
    .filter({ has: page.getByText(title, { exact: true }) })
    .first();
const nav = (page: Page, title: string) =>
  page
    .getByRole("navigation", { name: "Account settings sections" })
    .getByRole("link", { name: title, exact: true });
async function ready(page: Page, suffix = "") {
  await page.goto(`${prefix}${suffix}`);
  await expect(page.locator(".ds-root")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function profileMenu(page: Page, mobile: boolean) {
  if (mobile)
    await page.getByRole("button", { name: "Open application navigation", exact: true }).click();
  await page.getByRole("button", { name: /^Open profile for / }).click();
  await expect(page.getByRole("menu")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  faults.set(page, []);
  writes.set(page, []);
  page.on("pageerror", (error) => faults.get(page)?.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) faults.get(page)?.push(message.text());
  });
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method()))
      writes.get(page)?.push(`${request.method()} ${request.url()}`);
  });
});
test.afterEach(async ({ page }, info) => {
  await info.attach("console-faults", {
    body: JSON.stringify(faults.get(page)),
    contentType: "application/json",
  });
  await info.attach("non-read-requests", {
    body: JSON.stringify(writes.get(page)),
    contentType: "application/json",
  });
  expect(faults.get(page)).toEqual([]);
  expect(writes.get(page)).toEqual([]);
});

for (const width of [1440, 390]) {
  test.describe(`Drive inline Settings ${width}`, () => {
    test.use({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      deviceScaleFactor: 1,
      colorScheme: "light",
    });
    for (const [name, suffix, title] of routes) {
      test(`${name} deep link, native navigation and bounded viewport`, async ({ page }, info) => {
        await ready(page, suffix);
        await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
        await expect(
          page.getByRole("navigation", { name: "Account settings sections" }).getByRole("link"),
        ).toHaveCount(4);
        for (const link of await page.locator(".ds-navigation a").all())
          await expect(link).toHaveAttribute("href", /settings/);
        const geometry = await page.evaluate(() => {
          const root = document.documentElement;
          const nav = document.querySelector(".ds-navigation")!;
          return {
            document: [root.scrollWidth, root.clientWidth],
            nav: [nav.scrollWidth, nav.clientWidth, nav.scrollHeight, nav.clientHeight],
          };
        });
        expect(geometry.document[0]).toBeLessThanOrEqual(geometry.document[1] + 1);
        expect(geometry.nav[2]).toBeLessThanOrEqual(geometry.nav[3] + 1);
        if (width === 390) expect(geometry.nav[0]).toBeGreaterThan(geometry.nav[1]);
        await page.screenshot({
          path: info.outputPath(`${name.toLowerCase()}-${width}.png`),
          fullPage: true,
        });
      });
    }
    test("Profile saved text persists across SPA, Cancel returns to saved, reload resets", async ({
      page,
    }) => {
      await ready(page);
      const details = card(page, "Profile Details");
      await page.getByLabel("Full Name", { exact: true }).fill("Alex local audit");
      await details.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(page.getByText("Profile saved", { exact: true })).toBeVisible();
      await page.getByLabel("Full Name", { exact: true }).fill("Unsaved");
      await details.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(page.getByLabel("Full Name", { exact: true })).toHaveValue("Alex local audit");
      await nav(page, "Workspace").click();
      await nav(page, "Profile").click();
      await expect(page.getByLabel("Full Name", { exact: true })).toHaveValue("Alex local audit");
      if (width === 390)
        await page
          .getByRole("button", { name: "Open application navigation", exact: true })
          .click();
      await expect(
        page.getByRole("button", { name: "Open profile for Alex local audit", exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(page.getByLabel("Full Name", { exact: true })).toHaveValue("Alex Rivera");
    });
    test("page-local photo survives Cancel, resets across route", async ({ page }) => {
      await ready(page);
      const upload = page.locator(".ds-upload").first();
      await upload.locator('input[type="file"]').setInputFiles({
        name: "bricklane-original-upload.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path fill="#f97316" d="M0 0h8v8H0z"/></svg>',
        ),
      });
      await expect(upload.locator('img[src^="blob:"]')).toBeVisible();
      await card(page, "Profile Details")
        .getByRole("button", { name: "Cancel", exact: true })
        .click();
      await expect(upload.locator('img[src^="blob:"]')).toBeVisible();
      await nav(page, "Workspace").click();
      await nav(page, "Profile").click();
      await expect(page.locator('.ds-upload img[src^="blob:"]')).toHaveCount(0);
    });
    test("Workspace preview reads draft, saved identity survives route", async ({ page }) => {
      await ready(page, "/workspace");
      const details = card(page, "Workspace Details");
      await expect(details.getByRole("button", { name: "Cancel", exact: true })).toHaveCount(0);
      await page.getByLabel("Workspace Name", { exact: true }).fill("Bricklane audit");
      await details.getByRole("button", { name: "Preview brand", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByText("Bricklane audit", { exact: true })).toHaveCount(2);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await details.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(page.getByText("Workspace saved", { exact: true })).toBeVisible();
      await nav(page, "Team").click();
      await nav(page, "Workspace").click();
      await expect(page.getByLabel("Workspace Name", { exact: true })).toHaveValue(
        "Bricklane audit",
      );
      await expect(
        page.getByRole("button", { name: "Bricklane audit", exact: true }),
      ).toBeVisible();
    });
    test("Team filters, native role dialog and real member route", async ({ page }) => {
      await ready(page, "/team");
      await expect(page.getByText("1 - 9 of 9", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Filter by member status", exact: true }).click();
      await page.getByRole("checkbox", { name: /^Active/ }).check();
      await page.keyboard.press("Escape");
      await expect(page.getByText("1 - 6 of 6", { exact: true })).toBeVisible();
      await page.getByRole("textbox", { name: "Search team", exact: true }).fill("Elijah");
      await expect(page.getByText("No members match your filters.", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Clear filters", exact: true }).click();
      await page.getByRole("button", { name: "Open Alex Rivera actions", exact: true }).click();
      await expect(
        page.getByRole("menuitem", { name: "Remove member", exact: true }),
      ).not.toHaveAttribute("data-disabled");
      await page.getByRole("menuitem", { name: "Change role", exact: true }).click();
      await expect(page.getByRole("dialog").getByRole("radio")).toHaveCount(3);
      await page.keyboard.press("Escape");
      await page.getByRole("link", { name: "Alex Rivera", exact: true }).click();
      await expect(page).toHaveURL(/settings\/team\/alex-rivera/);
      await expect(page.getByText("Drive Usage", { exact: true })).toBeVisible();
      await page.getByRole("link", { name: "Back to team", exact: true }).click();
      await expect(page).toHaveURL(/settings\/team$/);
      await page.goBack();
      await expect(page.getByText("Drive Usage", { exact: true })).toBeVisible();
    });
    test("Billing seat exclusive save differs from unsaved Controls reset", async ({ page }) => {
      await ready(page, "/billing");
      await page.getByRole("checkbox", { name: "16 seats", exact: true }).check();
      await page.getByRole("checkbox", { name: "24 seats", exact: true }).check();
      await expect(page.getByRole("checkbox", { name: "16 seats", exact: true })).not.toBeChecked();
      await card(page, "Billing Setup")
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      await expect(page.getByText("Billing updated", { exact: true })).toBeVisible();
      const controls = card(page, "Billing Controls");
      await expect(controls.getByRole("button", { name: "Save changes", exact: true })).toHaveCount(
        0,
      );
      await page.getByLabel("Auto-Add Seats", { exact: true }).check();
      await page.getByLabel("Approval Threshold", { exact: true }).fill("3500");
      await nav(page, "Team").click();
      await nav(page, "Billing").click();
      await expect(page.getByRole("checkbox", { name: "24 seats", exact: true })).toBeChecked();
      await expect(page.getByLabel("Auto-Add Seats", { exact: true })).not.toBeChecked();
      await expect(page.getByLabel("Approval Threshold", { exact: true })).toHaveValue("2500");
    });
    test("Billing reviews are real dialogs; statement is valid local PDF", async ({ page }) => {
      await ready(page, "/billing");
      await page.getByRole("button", { name: /^Review approvals/ }).click();
      await expect(page.getByRole("dialog").locator(".ds-approval")).toHaveCount(3);
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Review invoices", exact: true }).click();
      await expect(page.getByRole("dialog").locator(".ds-invoice")).toHaveCount(5);
      await page.keyboard.press("Escape");
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download statement", exact: true }).click();
      const item = await download;
      expect(item.suggestedFilename()).toBe("statement.pdf");
      const path = await item.path();
      expect(path).toBeTruthy();
      const pdf = await readFile(path!, "ascii");
      expect(pdf.startsWith("%PDF-1.7")).toBe(true);
      expect(pdf).toContain("LOCAL PREVIEW STATEMENT");
      const xref = Number(pdf.match(/startxref\n(\d+)/)?.[1]);
      expect(pdf.slice(xref, xref + 4)).toBe("xref");
      expect(pdf).toContain("/BaseFont /Helvetica");
    });
    test("native menu Escape and mobile route close; Theme keeps menu open", async ({ page }) => {
      await ready(page);
      await profileMenu(page, width === 390);
      await page
        .locator(".ds-theme-option")
        .filter({ has: page.getByRole("radio", { name: "Dark", exact: true }) })
        .click();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(page.getByRole("menu")).toBeVisible();
      await page
        .locator(".ds-theme-option")
        .filter({ has: page.getByRole("radio", { name: "Light", exact: true }) })
        .click();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Open profile for Alex Rivera", exact: true }),
      ).toBeFocused();
      if (width === 390) {
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("button", { name: "Open application navigation", exact: true }),
        ).toBeFocused();
      }
      await profileMenu(page, width === 390);
      await page.getByRole("menuitem", { name: "Workspace", exact: true }).click();
      await expect(page.getByText("Workspace Details", { exact: true })).toBeVisible();
      await expect(page.getByRole("menu")).toHaveCount(0);
      if (width === 390)
        await expect(
          page.getByRole("button", { name: "Open application navigation", exact: true }),
        ).toBeFocused();
    });
  });
}
