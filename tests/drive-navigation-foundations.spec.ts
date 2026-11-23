import { test, expect, type Page, type Locator } from "@playwright/test";

type Primitive = "base" | "radix";
test.use({ colorScheme: "light", deviceScaleFactor: 1, actionTimeout: 5000 });
const faults = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  faults.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }, info) => {
  await info.attach("runtime-faults", {
    body: JSON.stringify(faults.get(page)),
    contentType: "application/json",
  });
  expect(faults.get(page)).toEqual([]);
});
async function open(
  page: Page,
  baseURL: string | undefined,
  primitive: Primitive,
  style: string,
  id: string,
  width: number,
) {
  if (!baseURL) throw new Error("Bound origin required");
  const root = new URL(primitive === "base" ? "base/" : "./", baseURL);
  const preset = new URLSearchParams({
    preset: JSON.stringify({ primitive, style, mode: "light" }),
  });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`${root}#/template-preview/${id}?${preset}`);
  if (id === "filebox") await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("columnheader", { name: /Name/ })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
  await page.evaluate(() => document.fonts.ready);
}
async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 80; step++) {
    if (await target.evaluate((node) => node === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(target).toBeFocused();
}
for (const primitive of ["radix", "base"] as const) {
  test(`${primitive} sera filespace1440: Space keyup and native modified activations retain navigation`, async ({
    page,
    baseURL,
  }, info) => {
    await open(page, baseURL, primitive, "sera", "filespace", 1440);
    const root = page.locator(".ct-drive-sidebar");
    const recent = root.getByRole("button", { name: "Recent", exact: true });
    const favourites = root.getByRole("button", { name: "Favourites", exact: true });
    const bin = root.getByRole("button", { name: "Bin", exact: true });
    for (const target of [recent, favourites, bin]) {
      await expect(target).toHaveAttribute("role", "button");
      await expect(target).toHaveAttribute("data-size", "default");
      await expect(target).toHaveAttribute(
        "data-variant",
        target === favourites ? "secondary" : "ghost",
      );
    }
    await tabTo(page, recent);
    const before = page.url();
    await page.keyboard.down("Space");
    await expect(page).toHaveURL(before);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.keyboard.up("Space");
    await expect(page).toHaveURL(/\/filespace\/recent(?:\?|$)/);
    await expect(recent).toBeFocused();
    await expect(recent).toHaveAttribute("aria-current", "page");
    await expect(recent).toHaveAttribute("data-variant", "secondary");
    let popupPending = page.context().waitForEvent("page");
    await favourites.click({ modifiers: ["Control"] });
    let popup = await popupPending;
    try {
      await expect(popup).toHaveURL(/\/filespace\/starred(?:\?|$)/);
      await expect(page).toHaveURL(/\/filespace\/recent(?:\?|$)/);
    } finally {
      await popup.close();
    }
    await tabTo(page, bin);
    popupPending = page.context().waitForEvent("page");
    await page.keyboard.press("Control+Space");
    popup = await popupPending;
    try {
      await expect(popup).toHaveURL(/\/filespace\/bin(?:\?|$)/);
      await expect(page).toHaveURL(/\/filespace\/recent(?:\?|$)/);
    } finally {
      await popup.close();
    }
    await expect(bin).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(favourites).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/filespace\/starred(?:\?|$)/);
    await expect(favourites).toBeFocused();
    await expect(favourites).toHaveAttribute("aria-current", "page");
    popupPending = page.context().waitForEvent("page");
    await recent.click({ button: "middle" });
    popup = await popupPending;
    try {
      await expect(popup).toHaveURL(/\/filespace\/recent(?:\?|$)/);
      await expect(page).toHaveURL(/\/filespace\/starred(?:\?|$)/);
    } finally {
      await popup.close();
    }
    await root.screenshot({ path: info.outputPath("modified-keyboard-sidebar.png") });
  });
}
