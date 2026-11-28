import { expect, test, type Locator } from "@playwright/test";

test.use({ launchOptions: { args: ["--enable-unsafe-swiftshader"] } });

const donutSelector = '[data-reui-chart="c-chart-20 c-chart-21 c-chart-22"]';
const localStyle = {
  version: 8,
  name: "Bricklane chart-mounting test style",
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#f4f4f5" } }],
};

async function expectDonut(container: Locator) {
  const chart = container.getByRole("img", {
    name: "44 of 82 deliveries completed",
    exact: true,
  });
  await expect(chart).toBeVisible();
  await expect(chart.locator("path.recharts-sector")).toHaveCount(3);
  await expect
    .poll(() =>
      chart.evaluate((element) => {
        const bounds = element.querySelector("svg.recharts-surface")?.getBoundingClientRect();
        return { width: bounds?.width, height: bounds?.height };
      }),
    )
    .toEqual({ width: 128, height: 128 });
}

for (const primitive of ["radix", "base"] as const) {
  test(`${primitive} mounts only visible Dispatch donuts and retains the desktop route panel`, async ({
    page,
  }, info) => {
    const warnings: string[] = [];
    const errors: string[] = [];
    page.on("console", (message) => {
      if (
        message.type() === "warning" &&
        /The width\(0\) and height\(0\) of chart/.test(message.text())
      )
        warnings.push(message.text());
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    // Local tiles isolate chart mounting from external street-map availability.
    await page.route("https://tiles.openfreemap.org/styles/*", (route) =>
      route.fulfill({ json: localStyle }),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    const preset = new URLSearchParams({
      preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
    });
    await page.goto(
      `${primitive === "base" ? "./base/" : "./"}#/preview/solutions/map/solution-map-1?${preset}`,
    );
    await expect(page).toHaveTitle("Dispatch Map — Preview");
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await expect(page.locator(".dm-root")).toBeVisible();
    await page.getByRole("button", { name: "Pause simulation", exact: true }).click();
    const charts = page.locator(donutSelector);
    const desktop = page.locator(".dm-desktop-panel");
    const map = page.getByRole("tab", { name: "Map", exact: true });
    const list = page.getByRole("tab", { name: "List", exact: true });

    for (const width of [390, 767]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(desktop).toBeHidden();
      await expect(charts).toHaveCount(0);
      const launcher = page.getByRole("button", { name: "Open fleet panel", exact: true });
      await launcher.click();
      const sheet = page.getByRole("dialog", { name: "Fleet panel", exact: true });
      await expectDonut(sheet);
      await expect(charts).toHaveCount(1);
      if (width === 390) {
        await page.mouse.move(width - 8, 8);
        await page.screenshot({ path: info.outputPath("phone-fleet.png"), animations: "disabled" });
      }
      await sheet.press("Escape");
      await expect(sheet).toHaveCount(0);
      await expect(launcher).toBeFocused();
      await expect(charts).toHaveCount(0);
    }

    await page.setViewportSize({ width: 768, height: 844 });
    await expectDonut(desktop);
    await expect(charts).toHaveCount(1);
    await list.click();
    await expect(list).toBeFocused();
    await expect(charts).toHaveCount(0);
    await map.click();
    await expectDonut(desktop);
    await expect(charts).toHaveCount(1);
    await page.screenshot({ path: info.outputPath("desktop-fleet.png"), animations: "disabled" });

    await page.setViewportSize({ width: 1440, height: 700 });
    await page.getByRole("button", { name: "Search dispatch", exact: true }).click();
    const command = page.getByRole("dialog", { name: "Search dispatch", exact: true });
    const search = command.getByPlaceholder("Search vans, drivers, stops…");
    await search.fill("V18 Sana");
    await expect(command.locator('[cmdk-item][data-value^="vehicle V18 "]')).toHaveAttribute(
      "data-selected",
      "true",
    );
    await search.press("Enter");
    await expect(command).toBeHidden();
    const route = desktop.getByLabel("V18 route panel", { exact: true });
    const stops = route.getByRole("radiogroup", { name: "Route stops", exact: true });
    await stops.locator("label.dm-stop-choice").nth(4).click();
    await route
      .getByRole("button", { name: "More stop actions", exact: true })
      .scrollIntoViewIfNeeded();
    const original = await route.elementHandle();
    const scrollTop = await route.evaluate((element) => element.scrollTop);
    expect(scrollTop).toBeGreaterThan(0);
    await list.click();
    await map.click();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(desktop).toBeHidden();
    await page.setViewportSize({ width: 1440, height: 700 });
    await expect(route).toBeVisible();
    expect(await route.evaluate((element, previous) => element === previous, original)).toBe(true);
    expect(await route.evaluate((element) => element.scrollTop)).toBe(scrollTop);
    await expect(stops.getByRole("radio").nth(4)).toBeChecked();
    await expect(route.locator(".dm-stop-details strong").first()).toHaveText("Firstlight Office");
    expect(warnings).toEqual([]);
    expect(errors).toEqual([]);
  });
}
