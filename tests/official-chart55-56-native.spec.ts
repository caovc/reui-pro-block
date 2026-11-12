import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const agreementsRoute = "#/preview/chart/status-tracker/chart-55";
const mapRoute = "#/preview/chart/composed-chart/chart-56";

test.setTimeout(30_000);
test.describe.configure({ retries: 0 });
test.use({ actionTimeout: 5_000, viewport: { width: 1440, height: 960 } });

for (const primitive of ["radix", "base"] as const) {
  test.describe(primitive, () => {
    const entry = primitive === "base" ? "./base/" : "./";

    test("Working Agreements changes the current week, target, and team view", async ({ page }) => {
      await page.goto(entry + agreementsRoute);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      const matrix = page.getByRole("table", { name: "Payments working agreements by week" });
      await expect(matrix.locator("[data-agreement-row]")).toHaveCount(14);
      await page.setViewportSize({ width: 940, height: 960 });
      await expect(matrix.getByRole("columnheader", { name: /Week of/ })).toHaveCount(26);
      await expect
        .poll(() => matrix.evaluate((node) => node.scrollWidth <= node.parentElement!.clientWidth))
        .toBe(true);
      await page.setViewportSize({ width: 1440, height: 960 });
      const team = page.getByRole("combobox", { name: "Team", exact: true });
      await expect(team).toContainText("Payments");
      await expect(team).not.toContainText("14");
      const currentWeek = matrix.getByRole("button", {
        name: /Reviews within a day, week of Sep 28/,
      });
      const previousWeek = matrix.getByRole("button", {
        name: /Reviews within a day, week of Sep 21/,
      });
      await currentWeek.press("ArrowLeft");
      await expect(previousWeek).toBeFocused();
      await previousWeek.press("Enter");
      const previousCard = page.getByRole("dialog", {
        name: "Reviews within a day, week of Sep 21",
      });
      await expect(previousCard).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(previousCard).toBeHidden();
      await expect(previousWeek).toBeFocused();
      await currentWeek.click();
      const weekCard = page.getByRole("dialog", { name: "Reviews within a day, week of Sep 28" });
      await expect(weekCard.getByText("7 of 9 PRs so far")).toBeVisible();
      await weekCard.getByRole("button", { name: "Pause Week", exact: true }).click();
      await expect(weekCard.getByRole("button", { name: "Resume Week" })).toBeVisible();
      await page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "Week paused" })
        .getByRole("button", { name: "Undo", exact: true })
        .click();
      await expect(currentWeek).toHaveAttribute("aria-expanded", "false");
      await currentWeek.click();
      await expect(weekCard.getByRole("button", { name: "Pause Week", exact: true })).toBeVisible();
      await weekCard.getByRole("button", { name: "Edit Target" }).click();
      const target = page.getByRole("dialog", { name: "Edit Target" });
      await expect(weekCard).toBeHidden();
      await expect(target.getByRole("textbox", { name: "Weekly target (%)" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(target).toBeHidden();
      await expect(currentWeek).toBeFocused();
      await currentWeek.press("Enter");
      await weekCard.getByRole("button", { name: "Edit Target" }).press("Enter");
      await target.getByRole("button", { name: "Lower the target" }).click();
      await expect(target.getByRole("img", { name: /finished weeks kept at 89%/ })).toBeVisible();
      await target.getByRole("button", { name: "Save Target" }).click();
      await expect(target).toHaveCount(0);
      await expect(currentWeek).toHaveAccessibleName(/89% target/);
      await expect(currentWeek).toBeFocused();

      await page.getByRole("button", { name: "View options" }).click();
      await page.getByRole("menuitemradio", { name: /Reliability/ }).click();
      await expect(matrix.locator("[data-agreement-row]")).toHaveCount(3);
      await team.click();
      await page.getByRole("option", { name: /Search/ }).click();
      await expect(page.getByText("No working agreements yet")).toBeVisible();
      await page.getByRole("button", { name: "Adopt Starter Set" }).click();
      const searchMatrix = page.getByRole("table", { name: "Search working agreements by week" });
      await expect(searchMatrix.locator("[data-agreement-row]")).toHaveCount(4);
      await page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "Starter agreements added" })
        .getByRole("button", { name: "Undo", exact: true })
        .click();
      await expect(page.getByText("No working agreements yet")).toBeVisible();
    });

    test("Revenue Map filters, locks a region, exports that view, and resets", async ({ page }) => {
      await page.goto(entry + mapRoute);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      const map = page.getByRole("group", { name: /Revenue by region/ });
      await expect(map.getByRole("button")).toHaveCount(13);
      await expect(page.getByText("All 13 Regions", { exact: true })).toBeVisible();
      const total = await page.locator("[data-revenue-total]").innerText();
      const north = map.getByRole("button", { name: /North America:/ });
      await north.press("Enter");
      await expect(north).toHaveAttribute("aria-pressed", "true");
      const hotspots = page.getByRole("region", { name: "Hot Spots" });
      await expect(hotspots.getByRole("button", { name: /North America/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await page.keyboard.press("Escape");
      await expect(north).toHaveAttribute("aria-pressed", "false");

      const segment = page.getByRole("combobox", { name: "Segment" });
      await segment.press("ArrowDown");
      await expect(page.getByRole("listbox")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("listbox")).toBeHidden();
      await expect(segment).toBeFocused();
      await segment.click();
      await page.getByRole("option", { name: "Enterprise", exact: true }).click();
      await page.getByRole("combobox", { name: "Period" }).click();
      await page.getByRole("option", { name: "Q2 2026", exact: true }).click();
      await expect(map).toHaveAccessibleName(/Enterprise, Q2 2026/);
      await expect(page.locator("[data-revenue-total]")).not.toHaveText(total);
      await expect(page.getByText("Jun 2026 revenue", { exact: true })).toBeVisible();

      await page.getByRole("button", { name: "More actions" }).click();
      const pending = page.waitForEvent("download");
      await page.getByRole("menuitem", { name: "Download CSV" }).click();
      const download = await pending;
      expect(download.suggestedFilename()).toBe("revenue-map.csv");
      const file = await download.path();
      expect(file).toBeTruthy();
      const csv = await readFile(file!, "utf8");
      expect(csv.split("\n")).toHaveLength(14);
      expect(csv).toContain('"North America","Enterprise","Q2 2026"');

      await page.getByRole("button", { name: "More actions" }).click();
      await page.getByRole("menuitem", { name: "Reset View" }).click();
      await expect(map).toHaveAccessibleName(/All Segments, Q3 2026/);
      await expect(page.locator("[data-revenue-total]")).toHaveText(total);
    });

    test.describe("390px touch preview", () => {
      test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

      test("Working Agreements shows five recent weeks and keeps all history reachable", async ({
        page,
      }) => {
        await page.goto(entry + agreementsRoute);
        const matrix = page.getByRole("table", { name: "Payments working agreements by week" });
        const review = matrix.getByRole("row").filter({
          has: page.getByRole("rowheader", { name: /Reviews within a day/ }),
        });
        await expect(matrix.getByRole("columnheader", { name: /Week of/ })).toHaveCount(26);
        await expect(review.getByRole("button")).toHaveCount(26);
        await expect
          .poll(() =>
            review.evaluate((row) => {
              const container = row.closest<HTMLElement>('[data-slot="table-container"]')!;
              const label = row.querySelector<HTMLElement>('[scope="row"]')!;
              const right = container.getBoundingClientRect().right;
              const left = label.getBoundingClientRect().right;
              return Array.from(row.querySelectorAll<HTMLButtonElement>("[data-agreement-week]"))
                .filter((button) => {
                  const box = button.getBoundingClientRect();
                  return box.left >= left - 0.5 && box.right <= right + 0.5;
                })
                .map((button) => Number(button.dataset.agreementWeek));
            }),
          )
          .toEqual([21, 22, 23, 24, 25]);
        const container = matrix.locator("..");
        await expect
          .poll(() => container.evaluate((node) => node.scrollWidth > node.clientWidth))
          .toBe(true);
        const currentWeek = review.getByRole("button", { name: /week of Sep 28/ });
        await currentWeek.tap();
        const currentCard = page.getByRole("dialog", {
          name: "Reviews within a day, week of Sep 28",
        });
        await expect(currentCard).toBeVisible();
        await expect(currentCard.getByText("7 of 9 PRs so far")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(currentCard).toBeHidden();
        await expect(currentWeek).toBeFocused();
        for (let step = 0; step < 5; step++) await page.keyboard.press("ArrowLeft");
        const augustWeek = review.getByRole("button", { name: /week of Aug 24/ });
        await expect(augustWeek).toBeFocused();
        await expect
          .poll(() =>
            augustWeek.evaluate((button) => {
              const viewport = button.closest<HTMLElement>('[data-slot="table-container"]')!;
              const label = button.closest("tr")!.querySelector<HTMLElement>('[scope="row"]')!;
              const box = button.getBoundingClientRect();
              return (
                box.left >= label.getBoundingClientRect().right - 0.5 &&
                box.right <= viewport.getBoundingClientRect().right + 0.5
              );
            }),
          )
          .toBe(true);
        await augustWeek.press("Enter");
        const augustCard = page.getByRole("dialog", {
          name: "Reviews within a day, week of Aug 24",
        });
        await expect(augustCard.getByText("Week of Aug 24 to Aug 30")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(augustCard).toBeHidden();
        await expect(augustWeek).toBeFocused();

        await container.evaluate((node) => {
          node.scrollLeft = 0;
        });
        const firstWeek = review.getByRole("button", { name: /week of Apr 6:/ });
        await firstWeek.tap();
        const firstCard = page.getByRole("dialog", {
          name: "Reviews within a day, week of Apr 6",
        });
        await expect(firstCard.getByText("Week of Apr 6 to Apr 12")).toBeVisible();
        await expect(firstCard.getByRole("button", { name: "Edit Target" })).toHaveCount(0);
        await page.keyboard.press("Escape");
        await expect(firstCard).toBeHidden();
        await expect(firstWeek).toBeFocused();
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
          .toBeLessThanOrEqual(390);
      });

      test("Revenue Map stacks the mobile sections and shares selection with its hotspot list", async ({
        page,
      }) => {
        await page.goto(entry + mapRoute);
        const map = page.getByRole("group", { name: /Revenue by region/ });
        const spots = page.getByRole("region", { name: "Hot Spots" });
        const accounts = page.getByRole("region", { name: "Revenue per Account" });
        await spots.getByRole("button", { name: /Western Europe/ }).tap();
        await expect(map.getByRole("button", { name: /Western Europe:/ })).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        const [summaryBox, mapBox, spotsBox, accountsBox] = await Promise.all([
          page.locator("[data-revenue-total]").boundingBox(),
          map.boundingBox(),
          spots.boundingBox(),
          accounts.boundingBox(),
        ]);
        expect(summaryBox!.y).toBeLessThan(mapBox!.y);
        expect(mapBox!.y).toBeLessThan(spotsBox!.y);
        expect(spotsBox!.y).toBeLessThan(accountsBox!.y);
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
          .toBeLessThanOrEqual(390);
      });
    });
  });
}
