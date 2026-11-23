import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import {
  createSalesTargetStores,
  salesTargetMetrics,
} from "../src/blocks/data/grid-advanced-sales-target-model";
import { salesMoney } from "../src/blocks/data/grid-advanced-sales-target-view-model";

const fixtures = createSalesTargetStores();
const rowOf = (screen: Locator, id: string) => screen.locator(`tbody tr[data-row-id="${id}"]`);
const metricOf = (row: Locator, period: string, metric: string) =>
  row.locator(`[data-sales-period="${period}"][data-sales-metric="${metric}"]`);

async function choose(page: Page, owner: Locator, label: string, value: string) {
  await owner.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}

async function assertTotals(screen: Locator, stores = fixtures, month = "2026-11") {
  for (const period of ["month", "last3", "ytd"] as const) {
    const expected = salesTargetMetrics(stores, month, period);
    const total = rowOf(screen, "sales-grand-total");
    const summary = screen.locator(`[data-summary-period="${period}"]`);
    for (const metric of ["actualCents", "targetCents", "varianceCents"] as const) {
      await expect(metricOf(total, period, metric)).toHaveAttribute(
        "data-value",
        String(expected[metric]),
      );
      await expect(summary.locator(`[data-summary-metric="${metric}"]`)).toHaveText(
        salesMoney(expected[metric]),
      );
    }
    await expect(metricOf(total, period, "attainment")).toHaveAttribute(
      "data-value",
      expected.attainment === null ? "none" : String(expected.attainment),
    );
  }
}

for (const library of ["radix", "base"] as const) {
  const entry = library === "base" ? "./base/" : "./";
  const preset = new URLSearchParams({
    preset: JSON.stringify({
      primitive: library,
      style: library === "base" ? "sera" : "nova",
      mode: "light",
    }),
  });
  const preview = `${entry}#/preview/data-grid/advanced/data-grid-advanced-21?${preset}`;

  for (const width of [1440, 390]) {
    test(`${library} Sales to Target ${width}: native groups, period totals, pinning, filters and CSV`, async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) errors.push(message.text());
      });
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.goto(preview);
      const screen = page.locator(".st-page");
      await expect(
        screen.getByRole("heading", { level: 1, name: "Sales to Target", exact: true }),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", library);
      await expect(screen.locator(".st-store-name")).toHaveCount(12);
      await expect(screen.locator("[data-sales-region]")).toHaveCount(4);
      await expect(screen.locator("thead tr")).toHaveCount(2);
      await assertTotals(screen);
      if (width === 390) {
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        const lines = await screen.locator("[data-summary-metric]").evaluateAll((values) =>
          values.map((value) => {
            const range = document.createRange();
            range.selectNodeContents(value);
            return range.getClientRects().length;
          }),
        );
        expect(lines).toEqual(Array<number>(12).fill(1));
      }
      const north = rowOf(screen, "sales-region-North");
      await expect(metricOf(north, "month", "actualCents")).toHaveAttribute(
        "data-value",
        String(salesTargetMetrics(fixtures.slice(0, 3), "2026-11", "month").actualCents),
      );
      const total = rowOf(screen, "sales-grand-total");
      await expect(total).toHaveAttribute("data-row-pinned", "top");
      await expect(screen.locator("tbody tr").first()).toHaveAttribute(
        "data-row-id",
        "sales-grand-total",
      );
      const monthActualHeader = screen.locator('th[data-col-id="month-actualCents"]');
      await monthActualHeader.getByRole("button", { name: "Actual", exact: true }).click();
      await page.getByRole("menuitem", { name: "Pin to left", exact: true }).click();
      const monthActualCell = total.locator("td").filter({
        has: page.locator('[data-sales-period="month"][data-sales-metric="actualCents"]'),
      });
      await expect(monthActualCell).toHaveAttribute("data-pinned", "start");
      const headerFit = await monthActualHeader.evaluate((node) => {
        const cell = node.getBoundingClientRect();
        return {
          cell: { x: cell.x, right: cell.right, width: cell.width },
          controls: [...node.querySelectorAll("button")].map((button) => {
            const box = button.getBoundingClientRect();
            return {
              name: button.getAttribute("aria-label") ?? button.textContent,
              x: box.x,
              right: box.right,
              width: box.width,
            };
          }),
        };
      });
      for (const control of headerFit.controls) {
        expect(control.x).toBeGreaterThanOrEqual(headerFit.cell.x);
        expect(control.right).toBeLessThanOrEqual(headerFit.cell.right);
      }
      await writeFile(info.outputPath("header-fit.json"), JSON.stringify(headerFit, null, 2));
      await monthActualHeader
        .getByRole("button", { name: "Unpin Actual column", exact: true })
        .click();
      await expect(monthActualCell).not.toHaveAttribute("data-pinned", "start");
      await expect(
        monthActualHeader.getByRole("button", { name: "Actual", exact: true }),
      ).toBeFocused();
      await total.scrollIntoViewIfNeeded();
      const viewport = screen.locator('.st-scroll-area [data-slot="scroll-area-viewport"]');
      await viewport.hover();
      const totalBox = await total.locator("td").first().boundingBox();
      await page.mouse.wheel(400, 350);
      await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(30);
      await expect.poll(() => viewport.evaluate((node) => node.scrollLeft)).toBeGreaterThan(30);
      await expect
        .poll(async () => (await total.locator("td").first().boundingBox())?.y)
        .toBe(totalBox!.y);
      await expect
        .poll(async () => (await total.locator("td").first().boundingBox())?.x)
        .toBe(totalBox!.x);
      const pinnedLabel = total.locator(".st-region-cell strong");
      await expect
        .poll(() =>
          pinnedLabel.evaluate((node) => {
            const box = node.getBoundingClientRect();
            const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
            return hit === node || Boolean(hit && node.contains(hit));
          }),
        )
        .toBe(true);
      const pinning = {
        before: totalBox,
        after: await total.locator("td").first().boundingBox(),
        scroll: await viewport.evaluate((node) => ({ x: node.scrollLeft, y: node.scrollTop })),
      };
      await screen.getByRole("button", { name: "Collapse regions", exact: true }).click();
      await expect(screen.locator(".st-store-name")).toHaveCount(0);
      await north.getByRole("button", { name: "Expand row", exact: true }).click();
      await expect(screen.locator(".st-store-name")).toHaveCount(3);
      await screen.getByRole("button", { name: "Expand regions", exact: true }).click();
      await expect(screen.locator(".st-store-name")).toHaveCount(12);
      await choose(page, screen, "Selected month", "Jan 2026");
      await assertTotals(screen, fixtures, "2026-01");
      await expect(
        screen.getByRole("button", { name: "Previous month", exact: true }),
      ).toBeDisabled();
      await expect(screen.getByText("Nov 2025 – Jan 2026", { exact: true })).toBeVisible();
      await screen.getByRole("button", { name: "Report Nov 2026", exact: true }).click();
      await assertTotals(screen);
      const west = screen
        .getByRole("group", { name: "Region quick filter", exact: true })
        .getByRole("button", { name: "West", exact: true });
      await west.click();
      await expect(west).toHaveAttribute("aria-pressed", "true");
      await expect(screen.locator(".st-store-name")).toHaveCount(3);
      const filter = screen.getByRole("button", { name: /^Filters(?: \(\d+\))?$/ });
      await filter.click();
      const panel = page.getByRole("dialog", { name: "Advanced filter", exact: true });
      await panel.getByRole("button", { name: "Add filter", exact: true }).click();
      await page.getByRole("option", { name: "Monthly pace", exact: true }).click();
      await page.getByRole("option", { name: "is", exact: true }).click();
      const noTarget = page.getByRole("option", { name: "No target", exact: true });
      await noTarget.click();
      await expect(noTarget).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(panel).toHaveCount(0);
      await expect(filter).toBeFocused();
      await expect(screen.locator(".st-store-name")).toHaveCount(1);
      await expect(
        screen.getByRole("button", { name: "Stonegate Mall", exact: true }),
      ).toBeVisible();
      await assertTotals(screen, [fixtures[11]]);
      await expect(metricOf(rowOf(screen, fixtures[11].id), "month", "attainment")).toHaveText(
        "No target",
      );
      const pending = page.waitForEvent("download");
      await screen.getByRole("button", { name: "Export CSV", exact: true }).click();
      const download = await pending;
      expect(download.suggestedFilename()).toBe("sales-to-target-2026-11.csv");
      const path = info.outputPath("filtered-sales.csv");
      await download.saveAs(path);
      const csv = await readFile(path, "utf8");
      expect(csv.split("\r\n")).toHaveLength(4);
      expect(csv).toContain('"Stonegate Mall","West","Outlet"');
      expect(csv).toContain('"Month","2026-11","2026-11"');
      await screen.getByRole("textbox", { name: "Search stores", exact: true }).fill("Juniper");
      await expect(screen.getByText("No stores match", { exact: true })).toBeVisible();
      await assertTotals(screen, []);
      await screen.getByRole("button", { name: "Clear filters", exact: true }).click();
      await expect(screen.locator(".st-store-name")).toHaveCount(12);
      await screen.getByRole("button", { name: "Columns", exact: true }).click();
      await page.getByRole("menuitemcheckbox", { name: "Month strip", exact: true }).click();
      await expect(screen.locator(".st-month-strip")).toHaveCount(0);
      await page.keyboard.press("Escape");
      await screen.getByRole("button", { name: "Columns", exact: true }).click();
      await page.getByRole("menuitemcheckbox", { name: "Month strip", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(screen.locator(".st-month-strip")).toHaveCount(17);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await page.screenshot({ path: info.outputPath("sales-grid.png") });
      await writeFile(info.outputPath("probe.json"), JSON.stringify({ pinning, errors }, null, 2));
      expect(errors).toEqual([]);
    });

    test(`${library} Sales to Target ${width}: monthly saves update store, region, grand totals, strips and modal Undo`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.goto(preview);
      const screen = page.locator(".st-page");
      const store = fixtures[0];
      const row = rowOf(screen, store.id);
      const opener = row.locator(".st-store-name");
      await opener.press("Enter");
      const editor = page.getByRole("dialog", { name: "Store sales", exact: true });
      await expect(editor).toBeVisible();
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      for (const label of ["Actual sales", "Sales target"]) {
        const fit = await editor.getByLabel(label, { exact: true }).evaluate((node) => {
          const input = node as HTMLInputElement;
          const style = getComputedStyle(input);
          const context = document.createElement("canvas").getContext("2d")!;
          context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          return {
            value: input.value,
            text: context.measureText(input.value).width,
            available:
              input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
          };
        });
        expect(fit.available, `${label}: ${fit.value} must fit fully`).toBeGreaterThanOrEqual(
          fit.text,
        );
      }
      await expect(
        editor.getByRole("button", { name: "Save changes", exact: true }),
      ).toBeDisabled();
      const fact = store.facts.find((item) => item.month === "2026-11")!;
      const actual = fact.actualCents + 12345;
      const target = fact.targetCents + 54321;
      await editor.getByLabel("Actual sales", { exact: true }).fill((actual / 100).toFixed(2));
      await editor.getByLabel("Sales target", { exact: true }).fill((target / 100).toFixed(2));
      await editor.getByLabel("Sales target", { exact: true }).press("Tab");
      await editor.getByRole("button", { name: "Save changes", exact: true }).click();
      const modified = fixtures.map((item) =>
        item.id === store.id
          ? {
              ...item,
              facts: item.facts.map((value) =>
                value.month === "2026-11"
                  ? { ...value, actualCents: actual, targetCents: target }
                  : value,
              ),
            }
          : item,
      );
      await assertTotals(screen, modified);
      for (const period of ["month", "last3", "ytd"] as const) {
        await expect(metricOf(row, period, "actualCents")).toHaveAttribute(
          "data-value",
          String(salesTargetMetrics([modified[0]], "2026-11", period).actualCents),
        );
        await expect(
          metricOf(rowOf(screen, "sales-region-North"), period, "targetCents"),
        ).toHaveAttribute(
          "data-value",
          String(salesTargetMetrics(modified.slice(0, 3), "2026-11", period).targetCents),
        );
      }
      await expect(row.locator(".st-month-strip")).toContainText(
        `Nov: actual ${salesMoney(actual)}, target ${salesMoney(target)}`,
      );
      const saved = editor.getByRole("alert").filter({ hasText: "Sales plan saved." });
      await expect(saved).toBeVisible();
      await saved.getByRole("button", { name: "Undo", exact: true }).click();
      await assertTotals(screen);
      await expect(metricOf(row, "month", "actualCents")).toHaveAttribute(
        "data-value",
        String(fact.actualCents),
      );
      await editor.getByRole("textbox", { name: "Store manager", exact: true }).fill("Avery Chen");
      await editor.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(row).toContainText("Avery Chen");
      await page.screenshot({ path: info.outputPath("sales-editor.png") });
      await page.keyboard.press("Escape");
      await expect(editor).toHaveCount(0);
      await expect(opener).toBeFocused();
      await screen
        .getByRole("alert")
        .filter({ hasText: "Sales plan saved." })
        .getByRole("button", { name: "Undo", exact: true })
        .click();
      await expect(row).toContainText(store.manager);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    });

    test(`${library} Sales to Target ${width}: create validation, native row actions and January trailing history`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.goto(preview);
      const screen = page.locator(".st-page");
      const add = screen.getByRole("button", { name: "Add store", exact: true });
      await add.press("Enter");
      const form = page.getByRole("dialog", { name: "Add store", exact: true });
      await form.getByRole("button", { name: "Create store", exact: true }).click();
      await expect(form.getByRole("textbox", { name: "Store name", exact: true })).toBeFocused();
      await form.getByRole("textbox", { name: "Store name", exact: true }).fill("Juniper Lane");
      await form.getByRole("button", { name: "Create store", exact: true }).click();
      await expect(form.getByRole("textbox", { name: "Store manager", exact: true })).toBeFocused();
      await form.getByRole("textbox", { name: "Store manager", exact: true }).fill("Avery Chen");
      await form.getByRole("button", { name: "Create store", exact: true }).click();
      await expect(form.getByRole("alert")).toContainText("This store already exists.");
      await form
        .getByRole("textbox", { name: "Store name", exact: true })
        .fill("Birchfield Pop-up");
      await form.getByLabel("Actual sales", { exact: true }).fill("1200.25");
      await form.getByLabel("Sales target", { exact: true }).fill("1500.00");
      await form.getByLabel("Sales target", { exact: true }).press("Tab");
      await form.getByRole("button", { name: "Create store", exact: true }).click();
      await expect(form).toHaveCount(0);
      await expect(add).toBeFocused();
      await expect(screen.locator(".st-store-name")).toHaveCount(13);
      const row = rowOf(screen, "target-store-13");
      await expect(metricOf(row, "month", "actualCents")).toHaveAttribute("data-value", "120025");
      const actions = row.getByRole("button", {
        name: "Actions for Birchfield Pop-up",
        exact: true,
      });
      await actions.press("Enter");
      await page.getByRole("menuitem", { name: "Edit store sales", exact: true }).press("Enter");
      const editor = page.getByRole("dialog", { name: "Store sales", exact: true });
      await expect(editor).toBeVisible();
      await choose(page, editor, "Reporting month", "Nov 2025");
      await editor.getByLabel("Actual sales", { exact: true }).fill("200.00");
      await editor.getByLabel("Sales target", { exact: true }).fill("250.00");
      await editor.getByLabel("Sales target", { exact: true }).press("Tab");
      await editor.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(metricOf(row, "month", "actualCents")).toHaveAttribute("data-value", "120025");
      await page.keyboard.press("Escape");
      await expect(editor).toHaveCount(0);
      await expect(actions).toBeFocused();
      await choose(page, screen, "Selected month", "Jan 2026");
      await expect(metricOf(row, "month", "actualCents")).toHaveAttribute("data-value", "0");
      await expect(metricOf(row, "last3", "actualCents")).toHaveAttribute("data-value", "20000");
      await expect(metricOf(row, "last3", "targetCents")).toHaveAttribute("data-value", "25000");
      await expect(metricOf(row, "ytd", "targetCents")).toHaveAttribute("data-value", "0");
      await screen
        .getByRole("alert")
        .filter({ hasText: "Sales plan saved." })
        .getByRole("button", { name: "Undo", exact: true })
        .click();
      await expect(metricOf(row, "last3", "actualCents")).toHaveAttribute("data-value", "0");
      await expect(screen.locator(".st-store-name")).toHaveCount(13);
      await assertTotals(
        screen,
        [
          ...fixtures,
          {
            ...fixtures[0],
            id: "target-store-13",
            facts: fixtures[0].facts.map((fact) => ({
              month: fact.month,
              actualCents: fact.month === "2026-11" ? 120025 : 0,
              targetCents: fact.month === "2026-11" ? 150000 : 0,
            })),
          },
        ],
        "2026-01",
      );
    });
  }

  test(`${library} Sales to Target 320: monthly Actual pin and unpin fit a narrow phone`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(preview);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", library);
    const screen = page.locator(".st-page");
    await expect(screen.locator(".st-store-name")).toHaveCount(12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );

    const header = screen.locator('th[data-col-id="month-actualCents"]');
    await header.getByRole("button", { name: "Actual", exact: true }).click();
    await page.getByRole("menuitem", { name: "Pin to left", exact: true }).click();
    await expect(header).toHaveAttribute("data-pinned", "start");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await header.scrollIntoViewIfNeeded();
    const viewport = screen.locator('.st-scroll-area [data-slot="scroll-area-viewport"]');
    const gridBox = (await viewport.boundingBox())!;
    const actualBox = (await header.boundingBox())!;
    expect(actualBox.x).toBeGreaterThanOrEqual(gridBox.x);
    expect(actualBox.x + actualBox.width).toBeLessThanOrEqual(gridBox.x + gridBox.width);

    await header.getByRole("button", { name: "Unpin Actual column", exact: true }).click();
    await expect(header).not.toHaveAttribute("data-pinned", "start");
    await expect(header.getByRole("button", { name: "Actual", exact: true })).toBeFocused();
  });
}
