import { test, expect } from "@playwright/test";
import { openComparison, comparisonEvidence } from "./ai-chat-comparison-native-helpers";
test.describe.configure({ timeout: 30000, retries: 0 });
// Nova's four independent-layout cases are separate; this is the remaining seven styles.
for (const primitive of ["base", "radix"] as const)
  for (const style of ["vega", "maia", "lyra", "mira", "luma", "sera", "rhea"])
    for (const width of [1440, 390]) {
      test(`${primitive} ${style} ${width}: comparison surfaces and real model menu retain selected identity`, async ({
        page,
        baseURL,
      }, info) => {
        const { shell, faults } = await openComparison(page, baseURL, primitive, width, style);
        await expect(shell.locator(".comparison-input-group")).toHaveCSS("opacity", "1");
        await expect(
          shell.getByRole("textbox", { name: "Prompt both models", exact: true }),
        ).toBeEnabled();
        const panes = shell.locator(".comparison-pane");
        await expect(panes).toHaveCount(width === 390 ? 1 : 2);
        const headers = await shell.locator(".comparison-pane-header").evaluateAll((nodes) =>
          nodes
            .map((header) => {
              const r = header.getBoundingClientRect();
              return [...header.querySelectorAll("button")]
                .filter((node) => node.getClientRects().length)
                .map((node) => {
                  const b = node.getBoundingClientRect();
                  return {
                    left: b.left,
                    right: b.right,
                    top: b.top,
                    bottom: b.bottom,
                    header: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
                  };
                });
            })
            .flat(),
        );
        for (const button of headers) {
          expect(button.left).toBeGreaterThanOrEqual(button.header.left);
          expect(button.right).toBeLessThanOrEqual(button.header.right);
          expect(button.top).toBeGreaterThanOrEqual(button.header.top);
          expect(button.bottom).toBeLessThanOrEqual(button.header.bottom);
        }
        const trigger = shell.getByRole("combobox").first();
        await trigger.click();
        const id = await shell.locator('[role="combobox"]').first().getAttribute("aria-controls");
        expect(id).toBeTruthy();
        const popup = page.getByRole("listbox").and(page.locator(`[id="${id}"]`));
        await expect(popup).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(popup).toHaveCount(0);
        await expect(trigger).toBeFocused();
        if (width === 390) {
          await shell.getByRole("tab", { name: "GPT-5.1", exact: true }).click();
          await expect(shell.getByRole("tabpanel", { name: "GPT-5.1", exact: true })).toBeVisible();
        }
        await comparisonEvidence(page, info, "style-" + style);
        expect(faults).toEqual([]);
      });
    }
