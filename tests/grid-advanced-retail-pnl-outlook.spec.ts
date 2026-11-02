import { expect, test, type Locator } from "@playwright/test";

// Native forecast editing, comparison, scrolling and pinning contracts.
const route = "/#/preview/data-grid/advanced/data-grid-advanced-15";

async function amount(cell: Locator) {
  const text = await cell.innerText();
  const match = text.match(/\(?-?\d[\d,]*(?:\.\d+)?\)?/);
  if (!match) throw new Error(`No displayed amount in ${text}`);
  const value = Number(match[0].replaceAll(",", "").replace(/[()]/g, ""));
  return match[0].startsWith("(") ? -value : value;
}

test("Retail outlook native forecast commit updates the whole statement and rejects closed or invalid cells", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(route);
  const frame = page.locator(".rpo-frame");
  await expect(frame.getByText("P&L Outlook", { exact: true })).toBeVisible();
  const table = frame.locator("table");
  await expect(table).toHaveCount(1);
  await expect(table.locator("thead tr")).toHaveCount(3);
  const line = table.locator('tbody tr[data-row-id="rpo-line-01"]');
  const october = line.locator('td[data-col-id="month-9"]');
  const totals = [
    table.locator('tbody tr[data-row-id="section-revenue"]'),
    table.locator('tbody tr[data-row-id="gross-margin"]'),
    table.locator('tbody tr[data-row-id="contribution"]'),
  ];
  // Contribution is below the initial viewport; read its real DOM, then use the
  // native viewport to bring the forecast editor into view through dblclick.
  const before = await Promise.all(
    totals.map(async (row) => ({
      month: await amount(row.locator('td[data-col-id="month-9"]')),
      annual: await amount(row.locator('td[data-col-id="outlook"]')),
    })),
  );
  const foot = table.locator("tfoot tr");
  await expect(foot).toHaveCount(1);
  await expect(foot).toContainText("Operating Profit");
  // The default leaf order is Line, twelve months, Outlook, comparison,
  // Confidence, Actions. Optional columns remain off in this fresh page.
  const beforeProfit = {
    month: await amount(foot.locator("td").nth(10)),
    annual: await amount(foot.locator("td").nth(13)),
  };
  const previous = await amount(october);
  await october.dblclick();
  const editor = page.getByRole("textbox", { name: "October", exact: true });
  await expect(editor).toBeVisible();
  await editor.fill(String(previous + 75));
  await editor.press("Enter");
  await expect(editor).toHaveCount(0);
  await expect.poll(() => amount(october)).toBe(previous + 75);
  for (let index = 0; index < totals.length; index++) {
    await expect
      .poll(() => amount(totals[index].locator('td[data-col-id="month-9"]')))
      .toBe(before[index].month + 75);
    await expect
      .poll(() => amount(totals[index].locator('td[data-col-id="outlook"]')))
      .toBe(before[index].annual + 75);
  }
  await expect.poll(() => amount(foot.locator("td").nth(10))).toBe(beforeProfit.month + 75);
  await expect.poll(() => amount(foot.locator("td").nth(13))).toBe(beforeProfit.annual + 75);
  await october.dblclick();
  await editor.fill("abc");
  await editor.press("Enter");
  await expect(editor).toHaveCount(0);
  await expect.poll(() => amount(october)).toBe(previous + 75);
  await expect(page.getByText("Some cells kept their value", { exact: true })).toBeVisible();
  await line.locator('td[data-col-id="month-0"]').dblclick();
  await expect(page.getByRole("textbox", { name: "January", exact: true })).toHaveCount(0);
  const search = frame.getByRole("textbox", { name: "Search lines", exact: true });
  await search.fill("Online storefront");
  await expect(line).toBeVisible();
  await expect(table.locator('tbody tr[data-row-id="rpo-line-02"]')).toHaveCount(0);
  await expect
    .poll(() => amount(totals[0].locator('td[data-col-id="outlook"]')))
    .toBe(before[0].annual + 75);
  await expect.poll(() => amount(foot.locator("td").nth(13))).toBe(beforeProfit.annual + 75);
});

for (const width of [1440, 390]) {
  test(`Retail outlook single native table, real menus and horizontal scroll at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto(route);
    const frame = page.locator(".rpo-frame");
    await expect(frame.getByText("P&L Outlook", { exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await expect(frame.locator("table")).toHaveCount(1);
    await expect(frame.locator("thead tr:visible")).toHaveCount(3);
    const variance = frame.getByRole("button", { name: "Variance", exact: true });
    await variance.click();
    const popup = page.getByRole("dialog", { name: "Variance", exact: true });
    await expect(popup).toBeVisible();
    await expect(popup.getByRole("slider", { name: "Flag Beyond", exact: true })).toHaveAttribute(
      "aria-valuenow",
      "5",
    );
    await popup.getByRole("button", { name: "vs Prior Year", exact: true }).click();
    await expect(popup.getByRole("button", { name: "vs Prior Year", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await popup.press("Escape");
    await expect(popup).toHaveCount(0);
    await expect(variance).toBeFocused();
    const view = frame.getByRole("button", { name: "View", exact: true });
    await view.click();
    const menu = page.getByRole("menu");
    await expect(
      menu.getByRole("menuitemcheckbox", { name: "Variance", exact: true }),
    ).not.toBeChecked();
    await menu.getByRole("menuitemcheckbox", { name: "Variance", exact: true }).click();
    await expect(
      frame.locator("thead tr:visible").last().getByText("Variance", { exact: true }),
    ).toBeVisible();
    await expect(
      frame.locator("thead tr:visible").last().getByText("vs Prior Year", { exact: true }),
    ).toBeVisible();
    await view.click();
    await menu.getByRole("menuitemcheckbox", { name: "Variance", exact: true }).click();
    await expect(
      frame.locator("thead tr:visible").last().getByText("Variance", { exact: true }),
    ).toHaveCount(0);
    await view.click();
    await expect(
      menu.getByRole("menuitemcheckbox", { name: "Chart Band", exact: true }),
    ).toBeChecked();
    await menu.getByRole("menuitemcheckbox", { name: "Chart Band", exact: true }).click();
    await expect(frame.locator("thead tr:visible")).toHaveCount(2);
    await view.click();
    await menu.getByRole("menuitemcheckbox", { name: "Chart Band", exact: true }).click();
    await expect(frame.locator("thead tr:visible")).toHaveCount(3);
    if (width === 390) {
      const viewport = frame.locator('.rpo-scroll [data-slot="scroll-area-viewport"]');
      const pinned = frame.locator('tbody tr[data-row-id="rpo-line-01"] td[data-col-id="name"]');
      const left = await pinned.boundingBox();
      expect(left).not.toBeNull();
      await viewport.hover();
      await page.mouse.wheel(800, 0);
      await expect.poll(() => viewport.evaluate((node) => node.scrollLeft)).toBeGreaterThan(100);
      await expect.poll(async () => (await pinned.boundingBox())?.x).toBe(left!.x);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
      ).toBe(false);
    }
    await page.screenshot({ path: info.outputPath(`retail-outlook-${width}.png`) });
  });
}
