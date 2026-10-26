import { expect, test } from "@playwright/test";

const route = (entry: number) => `/#/preview/data-grid/grouping/data-grid-grouping-${entry}`;

test("BOM search reveals matching ancestors and still lets the user collapse them", async ({
  page,
}) => {
  await page.goto(route(4));
  await page.getByLabel("Search parts...", { exact: true }).fill("Copper");
  await expect(page.getByText("Copper Winding", { exact: true })).toBeVisible();
  const drive = page.getByRole("row").filter({ hasText: "SYS-100" });
  await drive.getByRole("button", { name: /^Collapse/ }).click();
  await expect(page.getByText("Copper Winding", { exact: true })).toHaveCount(0);
  await drive.getByRole("button", { name: /^Expand/ }).click();
  await expect(page.getByText("Copper Winding", { exact: true })).toBeVisible();
});

test("reporting search reveals a manager chain without locking its expansion", async ({ page }) => {
  await page.goto(route(5));
  await page.getByLabel("Search people...", { exact: true }).fill("Noah");
  await expect(page.getByText("Noah Chen", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Collapse Leo Grant", exact: true }).click();
  await expect(page.getByText("Noah Chen", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Expand Leo Grant", exact: true }).click();
  await expect(page.getByText("Noah Chen", { exact: true })).toBeVisible();
});

test("BOM quantities inherit ancestor multipliers and assemblies roll up once", async ({
  page,
}) => {
  await page.goto(route(4));
  await page.getByRole("radio", { name: "Set tree depth All", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(44);
  const battery = page.getByRole("row").filter({ hasText: "ASM-210" });
  await expect(battery.getByRole("cell").nth(2)).toHaveText("2");
  await expect(battery.getByRole("cell").nth(4)).toContainText("$213.52");
  const cells = page.getByRole("row").filter({ hasText: "PRT-211" });
  await expect(cells.getByRole("cell").nth(2)).toHaveText("80");
  await expect(cells.getByRole("cell").nth(4)).toHaveText("$188.00");
  const spokes = page.getByRole("row").filter({ hasText: "PRT-512" });
  await expect(spokes.getByRole("cell").nth(2)).toHaveText("72");
  await expect(spokes.getByRole("cell").nth(4)).toHaveText("$20.16");
  await expect(page.locator("tfoot")).toContainText("31 lines");
  await expect(page.locator("tfoot")).toContainText("$1,179.31");
});

test("BOM filtered footer uses purchased lines and restores after an empty query", async ({
  page,
}) => {
  await page.goto(route(4));
  const search = page.getByLabel("Search parts...", { exact: true });
  await search.fill("Copper");
  await expect(page.locator("tfoot")).toContainText("1 lines");
  await expect(page.locator("tfoot")).toContainText("$22.20");
  await expect(page.locator("tfoot")).toContainText("28d");
  await expect(page.locator("header")).toContainText("$1,179.31");
  await search.fill("no-matching-component-234");
  await expect(page.locator("tbody")).toContainText("No records match your filters.");
  await expect(page.locator("tfoot")).toContainText("0 lines");
  await expect(page.locator("tfoot")).toContainText("$0.00");
  await search.fill("");
  await expect(page.locator("tfoot")).toContainText("31 lines");
  await expect(page.locator("tfoot")).toContainText("$1,179.31");
});

test("BOM display keeps footer cells aligned and native sorting works", async ({ page }) => {
  await page.goto(route(4));
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supply", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader")).toHaveCount(7);
  await expect(
    page.locator('tfoot td:not([data-slot="data-grid-table-fill-foot-cell"])'),
  ).toHaveCount(7);
  await page.getByRole("radio", { name: "Set tree depth Collapse", exact: true }).click();
  await page.getByRole("button", { name: "Part", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Cockpit");
  await page.getByRole("button", { name: "Part", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Rolling Gear");
});

test("reporting aggregates the actual local roster and filters native selection paths", async ({
  page,
}) => {
  await page.goto(route(5));
  const summary = page.locator("header");
  await expect(summary).toContainText("18");
  await expect(summary).toContainText("2.4");
  const mira = page.getByRole("row").filter({ hasText: "Chief Executive" });
  await expect(mira.getByRole("cell").nth(5)).toHaveText("9");
  await page.getByLabel("Search people...", { exact: true }).fill("Noah");
  await page.getByRole("checkbox", { name: "Select Leo Grant and reports", exact: true }).check();
  await expect(page.getByRole("status")).toContainText("2 people selected");
  await page.getByRole("button", { name: "Clear selection", exact: true }).click();
  await expect(page.getByText("2 people selected", { exact: true })).toHaveCount(0);
});

test("reporting display changes row geometry and visible footer properties", async ({ page }) => {
  await page.goto(route(5));
  await expect(page.locator("tbody tr").first()).toHaveCSS("height", "56px");
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("combobox", { name: "Row density", exact: true }).click();
  await page.getByRole("option", { name: "Compact", exact: true }).click();
  const location = page.getByRole("dialog").getByRole("button", { name: "Location", exact: true });
  await location.click();
  await expect(location).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Escape");
  await expect(page.locator("tbody tr").first()).toHaveCSS("height", "40px");
  await expect(page.getByRole("columnheader")).toHaveCount(8);
  await expect(page.locator("tfoot td")).toHaveCount(8);
});

test("reporting row openings update ancestor counts and profile data stays local", async ({
  page,
}) => {
  await page.goto(route(5));
  await page.getByRole("button", { name: "Actions for Leo Grant", exact: true }).click();
  await page.getByRole("menuitem", { name: "Open a role", exact: true }).click();
  await page.getByRole("textbox", { name: "Role title", exact: true }).fill("Platform engineer");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create opening", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "Chief Executive" }).getByRole("cell").nth(5),
  ).toHaveText("10");
  await page.getByRole("button", { name: "Leo Grant", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Platform engineer");
  await page.getByRole("textbox", { name: "Employee location", exact: true }).fill("Berlin");
  await page.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "VP Engineering" })).toContainText("Berlin");
});

test("moving a filtered reporting line preserves all people and prevents cycles", async ({
  page,
}) => {
  await page.goto(route(5));
  await page.getByLabel("Search people...", { exact: true }).fill("Maya");
  await page.getByRole("checkbox", { name: "Select Leo Grant and reports", exact: true }).check();
  await expect(page.getByRole("status")).toContainText("3 people selected");
  await page.getByRole("button", { name: "Change manager", exact: true }).click();
  await page.getByRole("combobox", { name: "New manager", exact: true }).click();
  await expect(page.getByRole("option", { name: "Maya Patel", exact: true })).toHaveCount(0);
  await expect(page.getByRole("option", { name: "Noah Chen", exact: true })).toHaveCount(0);
  await page.getByRole("option", { name: "Emma Wilson", exact: true }).click();
  await page.getByRole("button", { name: "Move reporting line", exact: true }).click();
  await page.getByLabel("Search people...", { exact: true }).fill("");
  await page.getByRole("radio", { name: "Set tree depth All", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(18);
  const identities = await page
    .locator("tbody tr")
    .evaluateAll((rows) => rows.map((row) => row.getAttribute("data-row-id")));
  expect(new Set(identities).size).toBe(18);
  await expect(page.locator("tfoot")).toContainText("18 people");
  await expect(
    page.getByRole("row").filter({ hasText: "VP Operations" }).getByRole("cell").nth(4),
  ).toContainText("12");
});

test("BOM part menu copies the actual part number", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(route(4));
  await page.getByRole("button", { name: "Actions for PRT-1112", exact: true }).click();
  await expect(page.getByRole("menu")).toHaveCSS("width", "176px");
  await expect(page.getByRole("menu").getByRole("separator")).toHaveCount(1);
  await page.getByRole("menuitem", { name: "Copy number", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("PRT-1112");
  await expect(page.getByText("Part number copied", { exact: true })).toBeVisible();
});

for (const entry of [4, 5]) {
  test(`tree ${entry} keeps real horizontal table scrolling at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route(entry));
    const viewport = page.locator('[data-slot="scroll-area-viewport"]');
    await viewport.hover();
    await page.mouse.wheel(600, 0);
    await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await expect(
      page.getByRole("region", {
        name: entry === 4 ? "Bill Of Materials" : "Reporting Lines",
        exact: true,
      }),
    ).toHaveCSS("width", "294px");
  });
}

test("BOM Display controls part details and the observed compact density", async ({ page }) => {
  await page.goto(route(4));
  await page.getByRole("button", { name: "Display", exact: true }).click();
  const popover = page.getByRole("dialog");
  await expect(popover).toHaveCSS("width", "300px");
  await popover.getByRole("switch", { name: "Part detail", exact: true }).check();
  await page.keyboard.press("Escape");
  const copper = page.getByRole("row").filter({ hasText: "PRT-1112" });
  await expect(copper).toContainText("Class H enamel, 1.2 mm gauge");
  await expect(copper).toContainText("Halden Wire Works");
  await expect(copper).toHaveCSS("height", "56px");
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await popover.getByRole("combobox", { name: "Row density", exact: true }).click();
  await page.getByRole("option", { name: "Compact", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(copper).toHaveCSS("height", "49px");
});

test("BOM supply facets keep the full header and reset the matching footer", async ({ page }) => {
  await page.goto(route(4));
  await page.getByRole("button", { name: "Supply", exact: true }).first().click();
  const stocked = page.getByRole("menuitemcheckbox", { name: "Stocked", exact: true });
  await stocked.click();
  await expect(stocked).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("tfoot")).toContainText("21 lines");
  await expect(page.locator("tfoot")).toContainText("$551.88");
  await expect(page.locator("tfoot")).toContainText("42d");
  await expect(page.locator("header")).toContainText("$1,179.31");
  await page.getByRole("menuitem", { name: "Reset supply", exact: true }).click();
  await expect(page.locator("tfoot")).toContainText("31 lines");
  await expect(page.locator("tfoot")).toContainText("$1,179.31");
});

test("BOM searches raw supplier and description fields while detail is hidden", async ({
  page,
}) => {
  await page.goto(route(4));
  const search = page.getByLabel("Search parts...", { exact: true });
  await search.fill("Halden");
  await expect(page.locator("tfoot")).toContainText("3 lines");
  await expect(page.locator("tfoot")).toContainText("$52.28");
  await expect(page.getByText("Copper Winding", { exact: true })).toBeVisible();
  await expect(page.getByText("Spoke", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("switch", { name: "Part detail", exact: true }).check();
  await page.keyboard.press("Escape");
  await expect(page.locator("tfoot")).toContainText("3 lines");
  await search.fill("enamel");
  await expect(page.locator("tfoot")).toContainText("1 lines");
  await expect(page.locator("tfoot")).toContainText("$22.20");
  await expect(page.getByText("Spoke", { exact: true })).toHaveCount(0);
});

test("reporting Reset filters preserves search while Clear resets both", async ({ page }) => {
  await page.goto(route(5));
  const search = page.getByLabel("Search people...", { exact: true });
  await search.fill("Noah");
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(page.getByRole("menu")).toHaveCSS("width", "208px");
  await page.getByRole("menuitemcheckbox", { name: "Engineering", exact: true }).click();
  await expect(
    page.getByRole("menuitemcheckbox", { name: "Engineering", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("menuitem", { name: "Reset filters", exact: true }).click();
  await expect(search).toHaveValue("Noah");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page.locator("tfoot")).toContainText("18 people");
});
