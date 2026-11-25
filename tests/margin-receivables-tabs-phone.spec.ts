import { expect, test, type Locator, type Page } from "@playwright/test";

test.describe.configure({ timeout: 30000, retries: 0 });
test.use({ colorScheme: "light", deviceScaleFactor: 1, actionTimeout: 5000, trace: "on" });

async function geometry(list: Locator, status: Locator) {
  const tabs = await list.getByRole("tab").evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        name: node.textContent,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        computedHeight: style.height,
        flex: style.flex,
      };
    }),
  );
  const listBounds = await list.boundingBox();
  const listStyle = await list.evaluate((node) => {
    const style = getComputedStyle(node);
    return { height: style.height, padding: style.padding, flexWrap: style.flexWrap };
  });
  const statusBounds = await status.boundingBox();
  const statusHits = await status.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return Array.from(range.getClientRects()).flatMap((rect) =>
      [0.1, 0.5, 0.9].map((fraction) => {
        const x = rect.left + rect.width * fraction;
        const y = rect.top + rect.height / 2;
        const hit = document.elementFromPoint(x, y);
        return {
          x,
          y,
          belongsToStatus: hit === node || (hit !== null && node.contains(hit)),
          hitRole: hit?.getAttribute("role"),
          hitText: hit?.textContent,
        };
      }),
    );
  });
  return { tabs, listBounds, listStyle, statusBounds, statusHits };
}

async function checkGeometry(page: Page, list: Locator, status: Locator) {
  const measured = await geometry(list, status);
  expect(measured.listBounds).not.toBeNull();
  expect(measured.statusBounds).not.toBeNull();
  const bounds = measured.listBounds!;
  for (const tab of measured.tabs) {
    expect(tab.left, `${tab.name} stays within the tab list`).toBeGreaterThanOrEqual(
      bounds.x - 0.5,
    );
    expect(tab.right, `${tab.name} stays within the tab list`).toBeLessThanOrEqual(
      bounds.x + bounds.width + 0.5,
    );
    expect(tab.top, `${tab.name} stays within the tab list`).toBeGreaterThanOrEqual(bounds.y - 0.5);
    expect(tab.bottom, `${tab.name} stays within the tab list`).toBeLessThanOrEqual(
      bounds.y + bounds.height + 0.5,
    );
  }
  expect(Math.max(...measured.tabs.map((tab) => tab.bottom))).toBeLessThanOrEqual(
    measured.statusBounds!.y,
  );
  expect(measured.statusHits.length).toBeGreaterThan(0);
  expect(measured.statusHits.every((hit) => hit.belongsToStatus)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  return measured;
}

for (const primitive of ["radix", "base"] as const) {
  test(`Margin ${primitive}: wrapped phone invoice tabs keep the save feedback visible`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    const entry = primitive === "base" ? "/base/" : "/";
    const preset = encodeURIComponent(JSON.stringify({ primitive, style: "nova", mode: "light" }));
    await page.goto(`${entry}#/template-preview/margin/cash/receivables?preset=${preset}`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await expect(page.locator("html")).toHaveAttribute("data-ui-style", "nova");
    await expect(page.getByRole("heading", { name: "Receivables", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "New invoice", exact: true }).click();
    const create = page.getByRole("dialog", { name: "Create local invoice", exact: true });
    await create.getByLabel("Customer", { exact: true }).fill("Phone tab geometry");
    await create.getByRole("button", { name: "Create invoice", exact: true }).click();
    await expect(create).toBeHidden();
    await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
    const status = page.getByRole("status");
    await expect(status).toHaveText("Invoice added to these local books.");
    const list = page.getByRole("tablist");
    await list.getByRole("tab", { name: "All invoices", exact: true }).click();
    await status.scrollIntoViewIfNeeded();
    await info.attach("invoice-tabs-before-assertions", {
      body: JSON.stringify(await geometry(list, status), null, 2),
      contentType: "application/json",
    });
    await page.screenshot({ path: info.outputPath("invoice-tabs-phone.png") });
    await checkGeometry(page, list, status);
    for (const name of ["Open", "Needs attention", "Awaiting reply", "Due soon", "All invoices"]) {
      const tab = list.getByRole("tab", { name, exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await checkGeometry(page, list, status);
    }
    await page.getByLabel("Search invoices", { exact: true }).fill("Phone tab geometry");
    await expect(page.getByRole("row", { name: /BL-2013 Phone tab geometry/ })).toContainText(
      "$2,500.00",
    );
    expect(errors).toEqual([]);
  });
}
