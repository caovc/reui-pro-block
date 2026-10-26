import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ launchOptions: { args: ["--enable-unsafe-swiftshader"] } });
const route = "./#/preview/solutions/map/solution-map-1";
// A network-independent style for engine/state tests. This is not street-map visual evidence.
const localStyle = {
  version: 8,
  name: "Bricklane test style",
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#f4f4f5" } }],
};
async function settleSheet(sheet: Locator) {
  await expect(sheet).toBeVisible();
  await sheet.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
}
async function open(page: Page, width = 1440, style: object = localStyle) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.route("https://tiles.openfreemap.org/styles/*", (request) =>
    request.fulfill({ json: style }),
  );
  await page.goto(route);
  await expect(page.locator(".dm-root")).toBeVisible();
  await page.getByRole("button", { name: "Pause simulation", exact: true }).click();
}
async function selectVan(page: Page, id: string, driver: string) {
  await page.getByRole("button", { name: "Search dispatch", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Search dispatch", exact: true });
  const search = dialog.getByPlaceholder("Search vans, drivers, stops…");
  await search.fill(`${id} ${driver}`);
  await expect(search).toHaveValue(`${id} ${driver}`);
  const vehicle = dialog.locator(`[cmdk-item][data-value^="vehicle ${id} "]`);
  await expect(vehicle).toHaveCount(1);
  await expect(vehicle).toContainText(driver);
  await expect(vehicle).toHaveAttribute("data-selected", "true");
  await expect(dialog.getByRole("option").first()).toHaveAttribute(
    "data-value",
    (await vehicle.getAttribute("data-value"))!,
  );
  await search.press("Enter");
  await expect(dialog).toBeHidden();
}

for (const width of [1440, 390]) {
  test(`dispatch toolbar, fleet and native List fit ${width}px`, async ({ page }, info) => {
    await open(page, width);
    const toolbar = page.locator(".dm-toolbar");
    expect((await toolbar.boundingBox())!.height).toBe(65);
    if (width === 1440) {
      const bounds = (await page.locator(".dm-desktop-panel").boundingBox())!;
      expect(bounds.x).toBe(16);
      expect(bounds.y).toBe(81);
      expect(bounds.width).toBe(352);
    } else {
      await expect(page.locator(".dm-desktop-panel")).toBeHidden();
      const launcher = page.getByRole("button", { name: "Open fleet panel", exact: true });
      await launcher.click();
      const panel = page.getByRole("dialog", { name: "Fleet panel", exact: true });
      await settleSheet(panel);
      const bounds = (await panel.boundingBox())!;
      expect(bounds.x).toBe(0);
      expect(bounds.width).toBe(358);
      expect(bounds.height).toBe(844);
      await panel.press("Escape");
      await expect(panel).toBeHidden();
      await expect(launcher).toBeFocused();
    }
    await page.getByRole("tab", { name: "List", exact: true }).click();
    const search = page.getByRole("textbox", { name: "Search fleet", exact: true });
    await search.fill("No van matches this query");
    await expect(page.getByText("No vehicles found", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Clear filters", exact: true }).click();
    await expect(page.getByRole("button", { name: "Select V01", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath(`dispatch-list-${width}.png`),
      animations: "disabled",
    });
  });

  test(`dispatch selection opens a real five-section vehicle sheet at ${width}px`, async ({
    page,
  }, info) => {
    await open(page, width);
    await page.getByRole("tab", { name: "List", exact: true }).click();
    const trigger = page.getByRole("button", { name: "Select V03", exact: true });
    await trigger.click();
    const sheet = page.getByRole("dialog", { name: "V03", exact: true });
    await settleSheet(sheet);
    await expect(sheet.getByRole("heading", { name: "V03", exact: true })).toBeVisible();
    await expect(sheet).toHaveAccessibleDescription("Van details · BL 412");
    const bounds = (await sheet.boundingBox())!;
    expect(bounds.width).toBe(width === 390 ? 358 : 576);
    expect(bounds.y).toBe(16);
    expect(bounds.height).toBe(width === 390 ? 812 : 968);
    const list = sheet.getByRole("tablist", { name: "Van detail sections", exact: true });
    const viewport = sheet.locator(".dm-detail-tabs-viewport");
    expect(await viewport.evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
    await list.getByRole("tab", { name: "Overview", exact: true }).focus();
    await list.getByRole("tab", { name: "Overview", exact: true }).press("End");
    await expect(list.getByRole("tab", { name: "Activity", exact: true })).toBeFocused();
    await expect(list.getByRole("tab", { name: "Activity", exact: true })).toHaveAttribute(
      "data-state",
      "active",
    );
    if (width === 390) {
      expect(await viewport.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
      await expect.poll(() => viewport.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    }
    await sheet.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath(`dispatch-sheet-closed-${width}.png`),
      animations: "disabled",
    });
  });
}

test("real MapLibre initializes GeoJSON, accessible markers, camera and layer controls with a local style", async ({
  page,
}) => {
  await open(page);
  await expect(page.locator('.dm-map[data-map-state="ready"]')).toBeVisible();
  const marker = page.getByRole("button", { name: /^V18, Breakdown/ });
  await marker.click();
  await expect(marker).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("V18 route panel", { exact: true })).toBeVisible();
  await expect(page.locator(".dm-map-canvas canvas")).toBeVisible();
  await page.getByRole("button", { name: "Fit fleet", exact: true }).click();
  await page.getByRole("button", { name: "Layers and legend", exact: true }).click();
  await page.getByLabel("Route lines", { exact: true }).uncheck();
  await expect(page.getByLabel("Route lines", { exact: true })).not.toBeChecked();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Layers and legend", exact: true })).toBeFocused();
  await expect(page.locator(".dm-map-attribution")).toContainText("OpenStreetMap");
});

test("a real style error offers Retry and recovers through the actual SDK", async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/styles/*", (request) =>
    request.fulfill({ status: 503, body: "Controlled street-style outage" }),
  );
  await page.goto(route);
  await expect(page.getByText("Map unavailable", { exact: true })).toBeVisible();
  await page.unroute("https://tiles.openfreemap.org/styles/*");
  await page.route("https://tiles.openfreemap.org/styles/*", (request) =>
    request.fulfill({ json: localStyle }),
  );
  await page.getByRole("button", { name: "Retry map", exact: true }).click();
  await expect(page.locator('.dm-map[data-map-state="ready"]')).toBeVisible();
});

test("a genuine WebGL initialization failure keeps the native fleet List usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).startsWith("webgl")) throw new Error("Controlled WebGL unavailable");
      return Reflect.apply(original, this, args);
    } as typeof original;
  });
  await page.goto(route);
  await expect(page.getByText("Map unavailable", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open vehicle list", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Search fleet", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select V01", exact: true })).toBeVisible();
});

test("reassignment changes a shared route and Undo restores it through the real form", async ({
  page,
}) => {
  await open(page);
  await selectVan(page, "V18", "Sana");
  const panel = page.getByLabel("V18 route panel", { exact: true });
  const stops = panel.getByRole("radiogroup", { name: "Route stops", exact: true });
  await expect(stops.getByRole("radio")).toHaveCount(9);
  await stops.locator("label.dm-stop-choice").nth(3).click();
  await expect(stops.getByRole("radio").nth(3)).toBeChecked();
  await panel.getByRole("button", { name: "More stop actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Reassign", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Reassign delivery", exact: true });
  await expect(dialog).toBeVisible();
  const candidate = dialog.getByRole("radio").first();
  await expect(candidate).toBeEnabled();
  await candidate.check();
  await dialog.getByRole("button", { name: "Reassign delivery", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(stops.getByRole("radio")).toHaveCount(8);
  await page.getByRole("button", { name: "Undo last change", exact: true }).click();
  await expect(stops.getByRole("radio")).toHaveCount(9);
});

test("controls use the actual Select and Slider, save locally and reset a dirty draft", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("tab", { name: "List", exact: true }).click();
  await page.getByRole("button", { name: "Select V03", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "V03", exact: true });
  await settleSheet(sheet);
  await expect(sheet.getByRole("heading", { name: "V03", exact: true })).toBeVisible();
  await expect(sheet).toHaveAccessibleDescription("Van details · BL 412");
  await sheet.getByRole("tab", { name: "Controls", exact: true }).click();
  const save = sheet.getByRole("button", { name: "Save changes", exact: true });
  await expect(save).toBeDisabled();
  await sheet.getByRole("combobox", { name: "Drive mode", exact: true }).click();
  await page.getByRole("option", { name: "Eco", exact: true }).click();
  await expect(save).toBeEnabled();
  await sheet.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(save).toBeDisabled();
  await sheet.getByRole("slider", { name: "Speed limit", exact: true }).focus();
  await sheet.getByRole("slider", { name: "Speed limit", exact: true }).press("ArrowLeft");
  await expect(save).toBeEnabled();
  await save.click();
  await expect(save).toBeDisabled();
  await sheet.press("Escape");
  await page.getByRole("button", { name: "Undo last change", exact: true }).click();
});

test("create delivery keeps its actual fields and reports a real local submission", async ({
  page,
}) => {
  await open(page, 390);
  await page.getByRole("button", { name: "New delivery", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New delivery", exact: true });
  await dialog.getByLabel("Customer", { exact: true }).fill("Bricklane QA delivery");
  await dialog.getByLabel("Address", { exact: true }).fill("152 Pine Street, Seattle");
  await dialog.getByRole("combobox", { name: "Assign vehicle", exact: true }).click();
  await page.getByRole("option", { name: /V02 · Milo Reed/ }).click();
  await dialog.getByRole("button", { name: "Create delivery", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "Search dispatch", exact: true }).click();
  const command = page.getByRole("dialog", { name: "Search dispatch", exact: true });
  await command.getByPlaceholder("Search vans, drivers, stops…").fill("Bricklane QA delivery");
  await expect(command.getByRole("option")).toHaveCount(1);
  await expect(command.getByRole("option")).toContainText("V02");
});

test("controlled dispatch overlays return focus after Escape, Cancel and a real Save", async ({
  page,
}) => {
  await open(page);
  const search = page.getByRole("button", { name: "Search dispatch", exact: true });
  await search.click();
  const command = page.getByRole("dialog", { name: "Search dispatch", exact: true });
  await command.getByPlaceholder("Search vans, drivers, stops…").press("Escape");
  await expect(command).toBeHidden();
  await expect(search).toBeFocused();

  const create = page.getByRole("button", { name: "New delivery", exact: true });
  await create.click();
  let action = page.getByRole("dialog", { name: "New delivery", exact: true });
  await action.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(action).toBeHidden();
  await expect(create).toBeFocused();
  await create.click();
  action = page.getByRole("dialog", { name: "New delivery", exact: true });
  await action.press("Escape");
  await expect(action).toBeHidden();
  await expect(create).toBeFocused();
  await create.click();
  action = page.getByRole("dialog", { name: "New delivery", exact: true });
  await action.getByLabel("Customer", { exact: true }).fill("Focus-return delivery");
  await action.getByLabel("Address", { exact: true }).fill("152 Pine Street, Seattle");
  await action.getByRole("combobox", { name: "Assign vehicle", exact: true }).click();
  await page.getByRole("option", { name: /V02 · Milo Reed/ }).click();
  await action.getByRole("button", { name: "Create delivery", exact: true }).click();
  await expect(action).toBeHidden();
  await expect(create).toBeFocused();
});

test("nested vehicle dialogs restore their opener and retirement uses a live fallback", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("tab", { name: "List", exact: true }).click();
  await page.getByRole("button", { name: "Select V02", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "V02", exact: true });
  await settleSheet(sheet);
  await sheet.getByRole("tab", { name: "Vehicle", exact: true }).click();
  const edit = sheet.getByRole("button", { name: "Edit van", exact: true });
  await edit.click();
  const editor = page.getByRole("dialog", { name: "Edit V02", exact: true });
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(editor).toBeHidden();
  await expect(edit).toBeFocused();

  const message = sheet.getByRole("button", { name: "Message", exact: true });
  await message.click();
  const note = page.getByRole("dialog", { name: "Message driver", exact: true });
  await note.getByLabel("Message", { exact: true }).fill("Local focus regression note");
  await note.getByRole("button", { name: "Record message", exact: true }).click();
  await expect(note).toBeHidden();
  await expect(message).toBeFocused();

  const retire = sheet.getByRole("button", { name: "Retire van", exact: true });
  await retire.click();
  const confirm = page.getByRole("alertdialog", { name: "Retire V02?", exact: true });
  await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(confirm).toBeHidden();
  await expect(retire).toBeFocused();
  await retire.click();
  await confirm.getByRole("button", { name: "Retire van", exact: true }).click();
  await expect(confirm).toBeHidden();
  await expect(retire).toBeDisabled();
  await expect(sheet.getByRole("heading", { name: "V02", exact: true })).toBeFocused();
  await sheet.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: "Search dispatch", exact: true })).toBeFocused();
});

test("phone command selection leaves native focus in the destination Fleet sheet", async ({
  page,
}) => {
  await open(page, 390);
  await selectVan(page, "V18", "Sana");
  const fleet = page.getByRole("dialog", { name: "Fleet panel", exact: true });
  await settleSheet(fleet);
  await expect
    .poll(() => fleet.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
  await fleet.press("Escape");
  await expect(fleet).toBeHidden();
  await expect(page.getByRole("button", { name: "Search dispatch", exact: true })).toBeFocused();
});

test("native map attribution has the complete credits without a duplicate fallback row", async ({
  page,
}) => {
  await open(page, 1440, {
    ...localStyle,
    sources: {
      credits: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        attribution:
          '<a href="https://openfreemap.org/">OpenFreeMap</a> · <a href="https://openmaptiles.org/">© OpenMapTiles</a> · Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    layers: [...localStyle.layers, { id: "credits", type: "line", source: "credits" }],
  });
  await expect(page.locator('.dm-map[data-map-state="ready"]')).toBeVisible();
  const native = page.locator(".maplibregl-ctrl-attrib-inner");
  await expect(native.getByRole("link", { name: "OpenFreeMap", exact: true })).toBeVisible();
  await expect(native.getByRole("link", { name: "© OpenMapTiles", exact: true })).toBeVisible();
  await expect(native.getByRole("link", { name: "OpenStreetMap", exact: true })).toBeVisible();
  await expect(page.locator(".dm-map-attribution")).toBeHidden();
});
