import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

test.use({ launchOptions: { args: ["--enable-unsafe-swiftshader"] } });

const localStyle = {
  version: 8,
  name: "Bricklane selection-state test style",
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#f4f4f5" } }],
};

// This isolates UI selection from external street tiles. It is not map visual evidence.
async function openRoute(page: Page, primitive: "radix" | "base", width: number, style: string) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
  await page.route("https://tiles.openfreemap.org/styles/*", (route) =>
    route.fulfill({ json: localStyle }),
  );
  const preset = new URLSearchParams({
    preset: JSON.stringify({ primitive, style, mode: "light" }),
  });
  await page.goto(
    `${primitive === "base" ? "./base/" : "./"}#/preview/solutions/map/solution-map-1?${preset}`,
  );
  await expect(page).toHaveTitle("Dispatch Map — Preview");
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
  await expect(page.locator(".dm-root")).toBeVisible();
  await page.getByRole("button", { name: "Pause simulation", exact: true }).click();
  await page.getByRole("button", { name: "Search dispatch", exact: true }).click();
  const searchDialog = page.getByRole("dialog", { name: "Search dispatch", exact: true });
  const search = searchDialog.getByPlaceholder("Search vans, drivers, stops…");
  await search.fill("V18 Sana");
  const option = searchDialog.locator('[cmdk-item][data-value^="vehicle V18 "]');
  await expect(option).toContainText("Sana Noor");
  await expect(option).toHaveAttribute("data-selected", "true");
  await search.press("Enter");
  await expect(searchDialog).toBeHidden();
  if (width < 768) {
    const sheet = page.getByRole("dialog", { name: "Fleet panel", exact: true });
    await expect(sheet).toBeVisible();
    await sheet.evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
    return sheet.getByLabel("V18 route panel", { exact: true });
  }
  return page.getByLabel("V18 route panel", { exact: true });
}

async function readPaint(radio: Locator, surface: "stop" | "candidate") {
  return radio.evaluate((element, kind) => {
    const card = element.closest("label")!;
    const visible = kind === "stop" ? card.querySelector(":scope > span:not(.sr-only)")! : card;
    const paint = getComputedStyle(visible);
    const context = new OffscreenCanvas(1, 1).getContext("2d")!;
    const normalize = (value: string) => {
      context.fillStyle = value.trim();
      return String(context.fillStyle);
    };
    return {
      label: card.textContent?.trim(),
      checked: element.getAttribute("aria-checked"),
      dataState: element.getAttribute("data-state"),
      dataChecked: element.hasAttribute("data-checked"),
      background: normalize(paint.backgroundColor),
      border: normalize(paint.borderTopColor),
      expectedBackground: normalize(
        paint.getPropertyValue(kind === "stop" ? "--primary" : "--muted"),
      ),
      expectedBorder: normalize(paint.getPropertyValue(kind === "stop" ? "--primary" : "--ring")),
      outlineWidth: paint.outlineWidth,
      outlineStyle: paint.outlineStyle,
    };
  }, surface);
}

async function recordPaint(
  page: Page,
  radio: Locator,
  surface: "stop" | "candidate",
  phase: string,
  info: TestInfo,
) {
  const paint = await readPaint(radio, surface);
  await info.attach(`${surface}-${phase}-paint`, {
    body: JSON.stringify(paint, null, 2),
    contentType: "application/json",
  });
  await page.screenshot({
    path: info.outputPath(`${surface}-${phase}.png`),
    animations: "disabled",
  });
  return paint;
}

export function registerDispatchSelectionCases(
  primitive: "radix" | "base",
  width = 1440,
  style = "nova",
) {
  test(`${primitive} ${style} ${width}px route stops visibly follow pointer and keyboard selection`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const panel = await openRoute(page, primitive, width, style);
    const stops = panel.getByRole("radiogroup", { name: "Route stops", exact: true });
    const radios = stops.getByRole("radio");
    await expect(radios).toHaveCount(9);
    await stops.locator("label.dm-stop-choice").nth(3).click();
    await expect(radios.nth(3)).toBeChecked();
    await expect(panel.locator(".dm-stop-details strong").first()).toHaveText("Olive Pharmacy");
    const pointer = await recordPaint(page, radios.nth(3), "stop", "pointer", info);
    await radios.nth(3).press("ArrowDown");
    await expect(radios.nth(4)).toBeFocused();
    await radios.nth(4).press("Space");
    await expect(radios.nth(4)).toBeChecked();
    await expect(radios.nth(3)).not.toBeChecked();
    await expect(panel.locator(".dm-stop-details strong").first()).toHaveText("Firstlight Office");
    const keyboard = await recordPaint(page, radios.nth(4), "stop", "keyboard", info);
    for (const paint of [pointer, keyboard]) {
      expect(paint.checked).toBe("true");
      expect(paint.background).toBe(paint.expectedBackground);
      expect(paint.border).toBe(paint.expectedBorder);
    }
    expect(keyboard.outlineWidth).toBe("3px");
    expect(keyboard.outlineStyle).toBe("solid");
    expect(errors).toEqual([]);
  });

  test(`${primitive} ${style} ${width}px candidate cards visibly follow initial, pointer and keyboard selection`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const panel = await openRoute(page, primitive, width, style);
    const stops = panel.getByRole("radiogroup", { name: "Route stops", exact: true });
    await stops.locator("label.dm-stop-choice").nth(3).click();
    await expect(stops.getByRole("radio").nth(3)).toBeChecked();
    await panel.getByRole("button", { name: "More stop actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Reassign", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Reassign delivery", exact: true });
    const group = dialog.getByRole("radiogroup", { name: "Candidate vehicles", exact: true });
    const eligible = group.getByRole("radio", { disabled: false });
    expect(await eligible.count()).toBeGreaterThan(1);
    await expect(eligible.first()).toBeChecked();
    const initial = await recordPaint(page, eligible.first(), "candidate", "initial", info);
    await eligible.nth(1).locator("..").click();
    await expect(eligible.nth(1)).toBeChecked();
    await expect(eligible.first()).not.toBeChecked();
    const pointer = await recordPaint(page, eligible.nth(1), "candidate", "pointer", info);
    await eligible.nth(1).press("ArrowUp");
    await expect(eligible.first()).toBeFocused();
    await eligible.first().press("Space");
    await expect(eligible.first()).toBeChecked();
    await expect(eligible.nth(1)).not.toBeChecked();
    const keyboard = await recordPaint(page, eligible.first(), "candidate", "keyboard", info);
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
    for (const paint of [initial, pointer, keyboard]) {
      expect(paint.checked).toBe("true");
      expect(paint.background).toBe(paint.expectedBackground);
      expect(paint.border).toBe(paint.expectedBorder);
    }
    expect(errors).toEqual([]);
  });
}

for (const primitive of ["radix", "base"] as const) registerDispatchSelectionCases(primitive);
