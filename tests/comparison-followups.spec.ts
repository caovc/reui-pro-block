import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

async function open(page: Page, n: number) {
  await page.goto(`./#/preview/ecommerce/comparison/comparison-${n}`);
  await expect(page.locator(`[data-comparison-variant="${n}"]`)).toBeVisible();
}
async function cart(page: Page) {
  await page.getByRole("button", { name: /^Cart with/ }).click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Your cart", exact: true }),
  ).toBeVisible();
}
async function select(page: Page, name: string) {
  await page.getByRole("button", { name: `Compare ${name}`, exact: true }).click();
}

test("ranked cards sort by independent overall scores and count actual dimension leaders", async ({
  page,
}) => {
  await open(page, 4);
  await expect(page.locator('[data-score-page="0"] [data-scorecard]')).toHaveCount(3);
  const first = page.locator('[data-scorecard="reference"]');
  await expect(first.locator("[data-overall-score]")).toHaveText("9.5");
  await expect(first.getByText("Top pick", { exact: true })).toBeVisible();
  await expect(first.locator("[data-dimension-wins]")).toHaveText("1 win");
  await expect(first.locator('[data-score-dimension][data-best="true"]')).toHaveCount(1);
  await expect(
    first.locator('[data-score-dimension="sound"] [role="progressbar"]'),
  ).toHaveAttribute("aria-valuenow", "9.8");
  await expect(page.locator('[data-scorecard="studio"] [data-dimension-wins]')).toHaveText("1 win");
  await expect(page.locator('[data-scorecard="field"] [data-dimension-wins]')).toHaveText("0 wins");
  await expect(page.getByRole("progressbar")).toHaveCount(18);
});

test("official Carousel arrows and keyboard page three rankings with hidden-page controls inert", async ({
  page,
}) => {
  await open(page, 4);
  await expect(page.getByRole("button", { name: "Previous slide" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next slide" })).toBeEnabled();
  await page.getByRole("button", { name: "Next slide" }).click();
  await expect(page.locator("[data-ranked-page]")).toHaveText("Ranks 4–6 of 6");
  await expect(
    page.getByRole("button", { name: "Add Arc Travel to cart", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Add Reference X to cart", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('[data-scorecard="arc"] [data-dimension-wins]')).toHaveText("2 wins");
  await expect(page.locator('[data-score-page="0"]').locator("..")).toHaveJSProperty("inert", true);
  await page.getByRole("button", { name: "Previous slide", exact: true }).click();
  await expect(page.locator("[data-ranked-page]")).toHaveText("Ranks 1–3 of 6");
  await page.getByRole("region", { name: "Ranked headphone scorecards" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("[data-ranked-page]")).toHaveText("Ranks 4–6 of 6");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("[data-ranked-page]")).toHaveText("Ranks 1–3 of 6");
});

test("official Carousel pointer drag changes ranking page without a custom scroll handler", async ({
  page,
}) => {
  await open(page, 4);
  await expect(page.getByRole("button", { name: "Next slide" })).toBeEnabled();
  const image = page.locator('[data-scorecard="studio"] img');
  const box = (await image.boundingBox())!;
  const viewport = page.locator('[data-slot="carousel-content"]');
  await expect
    .poll(() => viewport.evaluate((el) => Math.round(el.getBoundingClientRect().x)))
    .toBeGreaterThan(0);
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  const viewportWidth = (await viewport.boundingBox())!.width;
  await page.mouse.move(
    Math.max(24, box.x + box.width * 0.8 - viewportWidth * 0.65),
    box.y + box.height / 2,
    { steps: 18 },
  );
  await page.mouse.up();
  await expect(page.locator("[data-ranked-page]")).toHaveText("Ranks 4–6 of 6");
});

test("methodology is a real accessible free DialogSurface and makes fictional scoring explicit", async ({
  page,
}) => {
  await open(page, 4);
  const trigger = page.getByRole("button", { name: "How we score", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog")).toContainText(
    "No listening sessions or laboratory tests were performed",
  );
  await expect(page.getByRole("dialog")).toContainText("not an average");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("ranked page changes retain the actual cart and NumberField totals", async ({ page }) => {
  await open(page, 4);
  await page.getByRole("button", { name: "Add Reference X to cart", exact: true }).click();
  await page.getByRole("button", { name: "Next slide" }).click();
  await page.getByRole("button", { name: "Add Pocket Lite to cart", exact: true }).click();
  await cart(page);
  await expect(page.locator("[data-comparison-cart-total]")).toHaveText("$528");
  await page.getByRole("button", { name: "Increase Pocket Lite quantity", exact: true }).click();
  await expect(page.locator("[data-comparison-cart-total]")).toHaveText("$627");
});

test("alternatives start with one focal model, three rivals and signed real price differences", async ({
  page,
}) => {
  await open(page, 5);
  await expect(page.locator("[data-focused-model]")).toHaveAttribute("data-focused-model", "field");
  await expect(page.locator("[data-alternative]")).toHaveCount(3);
  await expect(page.locator('[data-alternative="sora"] [data-price-delta]')).toHaveText("−$70");
  await expect(page.locator('[data-alternative="studio"] [data-price-delta]')).toHaveText("+$150");
  await expect(page.locator('[data-alternative="arc"] [data-price-delta]')).toHaveText("+$50");
  await expect(page.locator("[data-focused-model] [data-alternative-feature]")).toHaveCount(4);
});

test("Switch moves the actual rival into focus and recomputes the remaining three cards", async ({
  page,
}) => {
  await open(page, 5);
  await page.getByRole("button", { name: "Switch focus to Studio Max", exact: true }).click();
  await expect(page.locator("[data-focused-model]")).toHaveAttribute(
    "data-focused-model",
    "studio",
  );
  await expect(page.locator("[data-focused-price]")).toHaveText("$349");
  await expect(page.locator('[data-alternative="studio"]')).toHaveCount(0);
  await expect(page.locator('[data-alternative="field"] [data-price-delta]')).toHaveText("−$150");
  await expect(
    page.locator('[data-focused-model] [data-alternative-feature="foldable"]'),
  ).toHaveAttribute("data-included", "false");
  await page.getByRole("button", { name: "Switch focus to Sora One", exact: true }).click();
  await expect(
    page.locator('[data-focused-model] [data-alternative-feature="hires"]'),
  ).toHaveAttribute("data-included", "false");
  await expect(page.locator('[data-alternative="studio"] [data-price-delta]')).toHaveText("+$220");
  await page.getByRole("button", { name: "Reset focus", exact: true }).click();
  await expect(page.locator("[data-focused-model]")).toHaveAttribute("data-focused-model", "field");
});

test("focal model cart records survive repeated switches and reset", async ({ page }) => {
  await open(page, 5);
  await page.getByRole("button", { name: "Add Field Pro to cart", exact: true }).click();
  await page.getByRole("button", { name: "Switch focus to Sora One", exact: true }).click();
  await page.getByRole("button", { name: "Add Sora One to cart", exact: true }).click();
  await page.getByRole("button", { name: "Reset focus", exact: true }).click();
  await cart(page);
  await expect(page.locator("[data-comparison-cart-item]")).toHaveCount(2);
  await expect(page.locator("[data-comparison-cart-total]")).toHaveText("$328");
});

test("builder initializes six native controlled compare toggles and two of four slots", async ({
  page,
}) => {
  await open(page, 6);
  await expect(page.locator("[data-builder-catalog]")).toHaveCount(6);
  await expect(page.locator("[data-builder-count]")).toHaveText("2 / 4 selected");
  await expect(page.locator("[data-builder-slot]")).toHaveCount(2);
  await expect(page.locator("[data-builder-empty-slot]")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Compare Field Pro", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-builder-spec-label]")).toHaveCount(13);
  for (const [spec, id] of [
    ["price", "field"],
    ["weight", "field"],
    ["charging", "field"],
    ["battery", "studio"],
    ["rating", "studio"],
  ])
    await expect(page.locator(`[data-spec="${spec}"][data-winner="${id}"]`)).toHaveCount(1);
  await expect(page.locator('[data-spec="codec"][data-winner]')).toHaveCount(0);
});

test("four-slot cap disables only unselected native Toggles and removal releases capacity", async ({
  page,
}) => {
  await open(page, 6);
  await select(page, "Sora One");
  await select(page, "Arc Travel");
  await expect(page.locator("[data-builder-count]")).toHaveText("4 / 4 selected");
  await expect(page.locator("[data-builder-empty-slot]")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Compare Pocket Lite", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Compare Field Pro", exact: true })).toBeEnabled();
  await select(page, "Field Pro");
  await expect(
    page.getByRole("button", { name: "Compare Pocket Lite", exact: true }),
  ).toBeEnabled();
  await select(page, "Pocket Lite");
  await expect(page.locator('[data-builder-slot="pocket"]')).toHaveCount(1);
  await expect(page.locator('[data-spec="price"][data-winner="pocket"]')).toHaveCount(1);
  await expect(page.locator('[data-spec="battery"][data-winner="arc"]')).toHaveCount(1);
});

test("Clear all empties live slots; one selected model has no false winners; tied charging stays unranked", async ({
  page,
}) => {
  await open(page, 6);
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(page.locator("[data-builder-count]")).toHaveText("0 / 4 selected");
  await expect(page.getByRole("heading", { name: "A fresh shortlist", exact: true })).toBeVisible();
  await expect(page.locator("[data-builder-empty-slot]")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Clear all", exact: true })).toHaveCount(0);
  await select(page, "Sora One");
  await expect(page.locator("[data-winner]")).toHaveCount(0);
  await select(page, "Studio Max");
  await expect(page.locator('[data-spec="charging"][data-winner]')).toHaveCount(0);
  await expect(page.locator('[data-spec="price"][data-winner="sora"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Remove Sora One from comparison", exact: true }).click();
  await expect(page.getByRole("button", { name: "Compare Sora One", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.locator("[data-winner]")).toHaveCount(0);
});

test("builder clearing the comparison preserves actual cart records", async ({ page }) => {
  await open(page, 6);
  await page.getByRole("button", { name: "Add Field Pro to cart", exact: true }).click();
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await cart(page);
  await expect(page.locator("[data-comparison-cart-total]")).toHaveText("$199");
});

test("builder native DataGrid pins labels during actual tablet horizontal wheel scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await open(page, 6);
  const viewport = page.locator('[data-builder-panel] [data-slot="scroll-area-viewport"]');
  const label = page.locator('[data-builder-spec-label="battery"]').locator("..");
  const left = (await label.boundingBox())!.x;
  await viewport.scrollIntoViewIfNeeded();
  await viewport.hover();
  await page.mouse.wheel(500, 0);
  await expect.poll(() => viewport.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100);
  expect((await label.boundingBox())!.x).toBeCloseTo(left, 0);
  expect(await label.evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
});

for (const n of [4, 5, 6])
  for (const width of [1440, 390]) {
    test(`Comparison ${n} fits ${width}px, original media and visible Frame content`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await open(page, n);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      if (n === 4) {
        const cards = await page
          .locator('[data-score-page="0"] [data-scorecard]')
          .evaluateAll((elements) =>
            elements.map((el) => {
              const r = el.getBoundingClientRect();
              return { x: r.x, y: r.y, width: r.width, height: r.height };
            }),
          );
        for (const card of cards) expect(card.height).toBeCloseTo(421, 0);
        expect(cards[0].x).toBeCloseTo(width === 390 ? 20 : 180, 0);
        expect(cards[0].y).toBeCloseTo(width === 390 ? 188 : 136, 0);
        expect(cards[0].width).toBeCloseTo(width === 390 ? 350 : 346.664, 0);
        if (width === 390)
          for (let index = 1; index < cards.length; index++)
            expect(cards[index].y - cards[index - 1].y).toBeCloseTo(437, 0);
        else expect(cards[1].y).toBeCloseTo(cards[0].y, 0);
        for (const image of await page.locator('[data-score-page="0"] img').all()) {
          const r = (await image.boundingBox())!;
          expect(r.width).toBeCloseTo(80, 0);
          expect(r.height).toBeCloseTo(80, 0);
        }
        await expect(page.getByRole("button", { name: /Go to rankings page/ })).toHaveCount(0);
        expect(
          await page.locator("[data-top-pick]").evaluate((el) => getComputedStyle(el).transform),
        ).not.toBe("none");
        expect(
          await page.locator("[data-top-pick]").evaluate((el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            const text = range.getBoundingClientRect(),
              panel = el.parentElement!.getBoundingClientRect();
            return (
              text.top >= panel.top &&
              text.bottom <= panel.bottom &&
              text.left >= panel.left &&
              text.right <= panel.right
            );
          }),
        ).toBe(true);
      }
      if (n === 5) {
        const hero = (await page.locator("[data-focused-model]").boundingBox())!;
        expect(hero.width).toBeCloseTo(width === 390 ? 358 : 657.227, 0);
        expect(hero.y).toBeCloseTo(width === 390 ? 168 : 160, 0);
        expect(hero.height).toBeCloseTo(width === 390 ? 677.797 : 909.93, 0);
        const image = (await page.locator("[data-focused-image]").boundingBox())!;
        expect(image.width / image.height).toBeCloseTo(1.25, 2);
        for (const rival of await page.locator("[data-alternative]").all()) {
          const r = (await rival.boundingBox())!;
          expect(r.height).toBeCloseTo(306, 0);
          expect(r.width).toBeCloseTo(width === 390 ? 358 : 410.773, 0);
          await expect(rival.locator("[data-alternative-feature]")).toHaveCount(4);
        }
      }
      if (n === 6) {
        const cards = await page.locator("[data-builder-catalog]").evaluateAll((elements) =>
          elements.map((el) => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          }),
        );
        for (const card of cards) {
          expect(card.width).toBeCloseTo(width === 390 ? 358 : 352, 0);
          expect(card.height).toBeCloseTo(width === 390 ? 490 : 484, 0);
        }
        expect(cards[0].y).toBeCloseTo(width === 390 ? 184 : 132, 0);
        if (width === 390)
          for (let index = 1; index < cards.length; index++)
            expect(cards[index].y - cards[index - 1].y).toBeCloseTo(502, 0);
        else {
          expect(cards[2].y).toBeCloseTo(cards[0].y, 0);
          expect(cards[3].y - cards[0].y).toBeCloseTo(500, 0);
        }
      }
      expect(
        await page.locator(".isolated-preview img").evaluateAll(async (images) => {
          await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
          return images.every(
            (image) =>
              (image as HTMLImageElement).src.startsWith("data:image/svg+xml,") &&
              (image as HTMLImageElement).naturalWidth > 0,
          );
        }),
      ).toBe(true);
      expect(
        await page
          .locator('[data-slot="frame-panel"] > *:not([data-top-pick])')
          .evaluateAll((elements) =>
            elements.every((el) => {
              const rect = el.getBoundingClientRect(),
                panel = el.parentElement!.getBoundingClientRect();
              return rect.top >= panel.top && rect.bottom <= panel.bottom + 1;
            }),
          ),
      ).toBe(true);
      expect(errors).toEqual([]);
    });
  }

for (const [n, module, component] of [
  [4, "ranked-scorecards", "RankedScorecards"],
  [5, "alternatives-switcher", "AlternativesSwitcher"],
  [6, "compare-builder", "CompareBuilder"],
] as const) {
  test(`Comparison ${n} source default, clipboard, file and actual starter ZIP match`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/block/ecommerce/comparison/comparison-${n}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog"),
      source = dialog.locator(".source-code");
    const filename = `src/blocks/commerce/comparison-variants/followups/${module}.tsx`;
    await expect(dialog.getByRole("combobox", { name: "Source file" })).toHaveText(filename);
    await expect(source).toContainText(`function ${component}`);
    const expected = await readFile(filename, "utf8");
    await source.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    const filePromise = page.waitForEvent("download");
    await source.getByRole("button", { name: "Download source file", exact: true }).click();
    expect(await readFile((await (await filePromise).path())!, "utf8")).toBe(expected);
    const zipPromise = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
    const entries = unzipSync(new Uint8Array(await readFile((await (await zipPromise).path())!)));
    expect(new TextDecoder().decode(entries[filename])).toBe(expected);
    for (const path of [
      "src/blocks/commerce/comparison-variants/cart.tsx",
      "src/blocks/application/dialog-variants/first-run/free/dialog-surface.tsx",
      "src/blocks/application/dialog-variants/first-run/first-run.css",
      "src/blocks/commerce/wishlist-artwork.ts",
      "src/components/reui/rating.tsx",
      "src/components/reui/frame.tsx",
      "src/components/reui/REUI-LICENSE.txt",
      "src/blocks/commerce/comparison-variants/followups/visual-followups.css",
    ]) {
      expect(entries[path]).toBeDefined();
      expect(new TextDecoder().decode(entries[path])).toBe(await readFile(path, "utf8"));
    }
    if (n === 4) {
      expect(entries["src/components/ui/carousel.tsx"]).toBeDefined();
      expect(entries["src/components/ui/progress.tsx"]).toBeDefined();
    }
    if (n === 6) {
      expect(entries["src/components/reui/data-grid/data-grid-table.tsx"]).toBeDefined();
      expect(entries["src/components/ui/toggle.tsx"]).toBeDefined();
    }
  });
}

test("390px reflows the same native DataGrid nodes into four static slots and thirteen vertically stacked specs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page, 6);
  const viewport = page.locator('[data-builder-panel] [data-slot="scroll-area-viewport"]');
  expect(
    await viewport.evaluate((el) => ({
      width: el.clientWidth,
      scroll: el.scrollWidth,
      left: el.scrollLeft,
    })),
  ).toEqual({ width: 356, scroll: 356, left: 0 });
  const header = page.locator("[data-builder-panel] thead tr");
  const slots = header.locator("[data-builder-slot], [data-builder-empty-slot]");
  await expect(slots).toHaveCount(4);
  const boxes = await slots.evaluateAll((elements) =>
    elements.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }),
  );
  for (const box of boxes) {
    expect(box.width).toBeCloseTo(324, 0);
    expect(box.height).toBeCloseTo(194, 0);
  }
  for (let index = 1; index < boxes.length; index++) {
    expect(boxes[index].x).toBeCloseTo(boxes[0].x, 0);
    expect(boxes[index].y).toBeGreaterThanOrEqual(
      boxes[index - 1].y + boxes[index - 1].height + 11,
    );
  }
  for (const label of await page.locator("[data-builder-spec-label]").all()) {
    const cell = label.locator("..");
    expect(await cell.evaluate((el) => getComputedStyle(el).position)).toBe("static");
    const cells = await cell
      .locator("..")
      .locator('td:not([data-slot="data-grid-table-fill-body-cell"])')
      .evaluateAll((elements) =>
        elements.map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        }),
      );
    expect(cells).toHaveLength(5);
    for (let index = 1; index < cells.length; index++) {
      expect(cells[index].x).toBeCloseTo(cells[0].x, 0);
      expect(cells[index].y).toBeGreaterThanOrEqual(cells[index - 1].y + cells[index - 1].height);
    }
  }
  await page.getByRole("button", { name: "About Battery life", exact: true }).focus();
  await expect(page.getByRole("tooltip")).toContainText("Longer battery life");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.getByRole("button", { name: "Remove Field Pro from comparison", exact: true }).click();
  await expect(page.locator("[data-builder-slot]")).toHaveCount(1);
  await expect(page.locator("[data-winner]")).toHaveCount(0);
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(page.locator("[data-builder-empty-slot]")).toHaveCount(4);
  await expect(page.locator("[data-builder-spec-label]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "A fresh shortlist", exact: true })).toBeVisible();
  await select(page, "Sora One");
  await select(page, "Arc Travel");
  await expect(page.locator("[data-builder-spec-label]")).toHaveCount(13);
  await expect(page.locator('[data-spec="battery"][data-winner="arc"]')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("alternative reordering follows the fixed candidate list and Details opens actual local free DialogSurface", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page, 5);
  await page.getByRole("button", { name: "Switch focus to Studio Max", exact: true }).click();
  await page.getByRole("button", { name: "Switch focus to Arc Travel", exact: true }).click();
  expect(
    await page
      .locator("[data-alternative]")
      .evaluateAll((elements) => elements.map((el) => el.getAttribute("data-alternative"))),
  ).toEqual(["field", "sora", "studio"]);
  const trigger = page.getByRole("button", { name: "View Field Pro sample details", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog")).toContainText("Independent local specifications");
  await expect(page.getByRole("dialog").locator("[data-spec]")).toHaveCount(13);
  await expect(
    page.getByRole("button", { name: "Back to alternatives", exact: true }),
  ).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
