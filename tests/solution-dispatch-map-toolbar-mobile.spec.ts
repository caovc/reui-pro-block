import { expect, test } from "@playwright/test";

test.use({ launchOptions: { args: ["--enable-unsafe-swiftshader"] } });

const localStyle = {
  version: 8,
  name: "Bricklane mobile toolbar test style",
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#f4f4f5" } }],
};

for (const primitive of ["radix", "base"] as const) {
  test(`${primitive} Sera keeps mobile dispatch controls reachable and resizes the real map`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("https://tiles.openfreemap.org/styles/*", (route) =>
      route.fulfill({ json: localStyle }),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    const preset = new URLSearchParams({
      preset: JSON.stringify({ primitive, style: "sera", mode: "light" }),
    });
    await page.goto(
      `${primitive === "base" ? "./base/" : "./"}#/preview/solutions/map/solution-map-1?${preset}`,
    );
    await expect(page).toHaveTitle("Dispatch Map — Preview");
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await expect(page.locator("html")).toHaveAttribute("data-ui-style", "sera");
    await page.getByRole("button", { name: "Pause simulation", exact: true }).click();
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const toolbar = page.locator(".dm-toolbar");
    const stage = page.locator(".dm-map-stage");
    const canvas = page.locator(".dm-map-canvas canvas");
    const create = page.getByRole("button", { name: "New delivery", exact: true });

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(page.locator('.dm-map[data-map-state="ready"]')).toBeVisible();
      const header = (await toolbar.boundingBox())!;
      expect(header.height).toBeGreaterThan(65);
      const controls = await toolbar
        .locator('button:visible, [role="combobox"]:visible')
        .evaluateAll((elements) =>
          elements.map((element) => {
            const bounds = element.getBoundingClientRect();
            return {
              name: element.getAttribute("aria-label") ?? element.textContent?.trim(),
              x: bounds.x,
              y: bounds.y,
              right: bounds.right,
              bottom: bounds.bottom,
              hit: element.contains(
                document.elementFromPoint(
                  bounds.x + bounds.width / 2,
                  bounds.y + bounds.height / 2,
                ),
              ),
            };
          }),
        );
      expect(controls.length).toBeGreaterThanOrEqual(6);
      for (const control of controls) {
        expect(control.x, control.name).toBeGreaterThanOrEqual(0);
        expect(control.right, control.name).toBeLessThanOrEqual(width);
        expect(control.y, control.name).toBeGreaterThanOrEqual(header.y);
        expect(control.bottom, control.name).toBeLessThanOrEqual(header.y + header.height);
        expect(control.hit, control.name).toBe(true);
      }
      await expect(create.locator(":scope > span")).toBeHidden();
      const icon = (await create.locator(":scope > svg").boundingBox())!;
      const button = (await create.boundingBox())!;
      expect(icon.width).toBeGreaterThan(0);
      expect(icon.x).toBeGreaterThanOrEqual(button.x);
      expect(icon.x + icon.width).toBeLessThanOrEqual(button.x + button.width);

      await page.getByRole("tab", { name: "List", exact: true }).click();
      await expect(page.getByRole("textbox", { name: "Search fleet", exact: true })).toBeVisible();
      await page.getByRole("tab", { name: "Map", exact: true }).click();
      await expect(stage).toBeVisible();
      await expect
        .poll(async () => {
          const mapBounds = (await stage.boundingBox())!;
          const canvasBounds = (await canvas.boundingBox())!;
          return Math.max(
            Math.abs(canvasBounds.width - mapBounds.width),
            Math.abs(canvasBounds.height - mapBounds.height),
          );
        })
        .toBeLessThanOrEqual(1);
      const mapBounds = (await stage.boundingBox())!;
      expect(mapBounds.y).toBeCloseTo(header.y + header.height);
      expect(mapBounds.width).toBe(width);
      expect(mapBounds.y + mapBounds.height).toBeCloseTo(844);

      for (const method of ["Cancel", "Escape"]) {
        await create.click();
        const dialog = page.getByRole("dialog", { name: "New delivery", exact: true });
        await expect(dialog).toBeVisible();
        if (method === "Cancel")
          await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
        else await dialog.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(create).toBeFocused();
      }
      await info.attach(`toolbar-${width}-geometry`, {
        body: JSON.stringify({ header, controls, button, icon, mapBounds }, null, 2),
        contentType: "application/json",
      });
      await page.screenshot({
        path: info.outputPath(`toolbar-${width}.png`),
        animations: "disabled",
      });
    }
    expect(errors).toEqual([]);
  });
}
