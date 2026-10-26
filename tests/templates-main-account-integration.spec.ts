import { expect, test, type Page } from "@playwright/test";
const root = "./#/template-preview";
async function navigate(page: Page, kind: string, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`${root}/${kind}`);
  await expect(page.locator(".wf-root")).toBeVisible();
}
async function openNavigation(page: Page, width: number) {
  if (width === 390 && !(await page.locator('[data-mobile="true"][data-state="open"]').count()))
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
}
async function openAccount(page: Page, kind: string, width: number, name = "Sienna Wells") {
  await openNavigation(page, width);
  await page
    .getByRole("button", {
      name: kind === "tempo" ? "Open workspace menu" : `Open profile for ${name}`,
      exact: true,
    })
    .click();
  await expect(page.getByRole("menu")).toBeVisible();
}
for (const kind of ["tempo", "mesh"])
  for (const width of [1440, 390]) {
    test(`${kind} real view, saved identity and actual return focus ${width}`, async ({ page }) => {
      const errors: string[] = [];
      const consoleErrors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (e) => {
        if (e.type() === "error" || e.type() === "warning") consoleErrors.push(e.text());
      });
      await navigate(page, kind, width);
      await openNavigation(page, width);
      await page
        .getByRole("button", { name: kind === "tempo" ? "Tasks" : "Documents", exact: true })
        .click();
      const documentEditor = page.getByRole("textbox", { name: "Rich text document", exact: true });
      const marker = `Private ${width}px settings draft stays in document.`;
      if (kind === "mesh") {
        await documentEditor.click();
        await documentEditor.press("End");
        await page.keyboard.type(marker);
        await expect(documentEditor).toContainText(marker);
      }
      const search = page.getByRole("textbox", { name: "Search tasks", exact: true });
      if (kind === "tempo") await search.fill("Audit");
      await openAccount(page, kind, width);
      if (kind === "mesh") {
        await page.getByRole("menuitem", { name: "Workspace", exact: true }).click();
        await expect(page.getByRole("tab", { name: "Workspace", exact: true })).toHaveAttribute(
          "aria-selected",
          "true",
        );
        await page.getByRole("tab", { name: "Profile", exact: true }).click();
      } else await page.getByRole("menuitem", { name: /^Profile/ }).click();
      await expect(page.locator("[data-mobile=true]")).toHaveCount(
        kind === "tempo" && width === 390 ? 1 : 0,
      );
      await page.getByLabel("Full Name", { exact: true }).fill(`${kind} saved identity`);
      await page.getByLabel("Upload profile photo", { exact: true }).setInputFiles({
        name: "original-brick.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" rx="8" fill="#0d9488"/></svg>',
        ),
      });
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(page.locator("[data-workflow-account]")).toHaveCount(0);
      if (width === 390 && kind === "tempo") {
        await expect(
          page.getByRole("button", { name: "Open workspace menu", exact: true }),
        ).toBeFocused();
        await expect(page.locator('[data-mobile="true"][data-state="open"]')).toHaveCount(1);
        await page.keyboard.press("Escape");
        await expect(page.locator('[data-mobile="true"]')).toHaveCount(0);
      }
      if (kind === "tempo") await expect(search).toHaveValue("Audit");
      else await expect(documentEditor).toContainText(marker);
      if (width === 390)
        await expect(
          page.getByRole("button", { name: "Open navigation", exact: true }),
        ).toBeFocused();
      else
        await expect(
          page.getByRole("button", {
            name:
              kind === "tempo" ? "Open workspace menu" : `Open profile for ${kind} saved identity`,
            exact: true,
          }),
        ).toBeFocused();
      await openAccount(page, kind, width, `${kind} saved identity`);
      await expect(
        page.getByRole("menu").getByText(`${kind} saved identity`, { exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("menu").locator("img").first()).toHaveAttribute(
        "src",
        /^data:image\/svg\+xml;base64,/,
      );
      await page.getByRole("menuitem", { name: /^Profile/ }).click();
      await expect(page.getByLabel("Full Name", { exact: true })).toHaveValue(
        `${kind} saved identity`,
      );
      await page.getByLabel("Full Name", { exact: true }).fill("Cancelled again");
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      if (width === 390 && kind === "tempo") {
        await expect(
          page.getByRole("button", { name: "Open workspace menu", exact: true }),
        ).toBeFocused();
        await expect(page.locator('[data-mobile="true"][data-state="open"]')).toHaveCount(1);
        await page.keyboard.press("Escape");
        await expect(page.locator('[data-mobile="true"]')).toHaveCount(0);
      }
      if (width === 390)
        await expect(
          page.getByRole("button", { name: "Open navigation", exact: true }),
        ).toBeFocused();
      else
        await expect(
          page.getByRole("button", {
            name:
              kind === "tempo" ? "Open workspace menu" : `Open profile for ${kind} saved identity`,
            exact: true,
          }),
        ).toBeFocused();
      if (kind === "tempo") await expect(search).toHaveValue("Audit");
      else await expect(documentEditor).toContainText(marker);
      await page.screenshot({
        path: `/tmp/bricklane-templates-layout/settings-drive-main-proof/${kind}-live-after-save-${width}.png`,
      });
      expect(errors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
    test(`${kind} native menu keyboard theme updates global store ${width}`, async ({ page }) => {
      const issues: string[] = [];
      page.on("pageerror", (error) => issues.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") issues.push(message.text());
      });
      await navigate(page, kind, width);
      await openAccount(page, kind, width);
      await page.keyboard.press("Home");
      await expect(
        page
          .getByRole("menuitem")
          .filter({ hasText: kind === "tempo" ? "Bricklane Studio" : "Profile" })
          .first(),
      ).toBeFocused();
      const light = page.getByRole("menuitemradio", { name: "Light theme", exact: true });
      for (let i = 0; i < 12; i++) {
        if (await light.evaluate((e) => e === document.activeElement)) break;
        const activeName = await page.evaluate(
          () =>
            document.activeElement?.getAttribute("aria-label") ||
            document.activeElement?.textContent,
        );
        await page.keyboard.press("ArrowDown");
        await expect
          .poll(() =>
            page.evaluate(
              () =>
                document.activeElement?.getAttribute("aria-label") ||
                document.activeElement?.textContent,
            ),
          )
          .not.toBe(activeName);
      }
      await expect(light).toBeFocused();
      await page.keyboard.press("ArrowDown");
      const dark = page.getByRole("menuitemradio", { name: "Dark theme", exact: true });
      await expect(dark).toBeFocused();
      await page.keyboard.press("Space");
      await expect(dark).toHaveAttribute("aria-checked", "true");
      await expect(page.locator("html")).toHaveClass(/dark/);
      expect(
        await page.evaluate(
          () => JSON.parse(localStorage.getItem("blocks-preview-theme-v2")!).mode,
        ),
      ).toBe("dark");
      await page.getByRole("menuitemradio", { name: "System theme", exact: true }).click();
      await expect(page.locator("html")).not.toHaveClass(/dark/);
      await expect(
        page.getByRole("menuitemradio", { name: "System theme", exact: true }),
      ).toHaveAttribute("aria-checked", "true");
      await page.getByRole("menu").screenshot({
        path: `/tmp/bricklane-templates-layout/settings-drive-main-proof/${kind}-live-menu-${width}.png`,
      });
      expect(issues).toEqual([]);
    });
  }
