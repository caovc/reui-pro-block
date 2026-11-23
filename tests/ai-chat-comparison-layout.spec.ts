import { test, expect } from "@playwright/test";
import { comparisonEvidence, openComparison } from "./ai-chat-comparison-native-helpers";
test.describe.configure({ timeout: 30000, retries: 0 });
for (const primitive of ["radix", "base"] as const) {
  for (const width of [1440, 390]) {
    test(`${primitive} Nova ${width}: independent Bricklane comparison layout and real visible controls`, async ({
      page,
      baseURL,
    }, info) => {
      const { shell, faults } = await openComparison(page, baseURL, primitive, width);
      await comparisonEvidence(page, info, "01-default");
      await expect(shell.getByText("Bricklane lab", { exact: true })).toBeVisible();
      await expect(shell.getByText("Local playback", { exact: true })).toBeVisible();
      await expect(shell.locator(".comparison-lane")).toHaveText(
        width === 1440 ? ["A", "B"] : ["A"],
      );

      await expect(
        shell.getByRole("textbox", { name: "Prompt both models", exact: true }),
      ).toBeEnabled();
      await expect(shell.locator(".comparison-input-group")).toHaveCSS("opacity", "1");
      const panels = shell.locator('[data-slot="resizable-panel"]');
      if (width === 1440) {
        await expect(panels).toHaveCount(2);
        await expect(shell.getByRole("combobox")).toHaveCount(2);
        const separator = shell.getByRole("separator", {
          name: "Resize model comparison panes",
          exact: true,
        });
        const before = await panels.evaluateAll((nodes) =>
          nodes.map((node) => node.getBoundingClientRect().width),
        );
        const box = await separator.boundingBox();
        if (!box) throw new Error("Real divider has no actual box");
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 8 });
        await page.mouse.up();
        const after = await panels.evaluateAll((nodes) =>
          nodes.map((node) => node.getBoundingClientRect().width),
        );
        expect(after[0] - before[0]).toBeGreaterThan(60);
        expect(before[1] - after[1]).toBeGreaterThan(60);
        const lock = shell.getByRole("button", {
          name: "Lock both transcripts to one scroll position",
          exact: true,
        });
        await expect(lock).toHaveAttribute("aria-pressed", "true");
        await lock.click();
        await expect(lock).toHaveAttribute("aria-pressed", "false");
      } else {
        await expect(panels).toHaveCount(0);
        await expect(shell.getByRole("tabpanel")).toHaveCount(1);
        await expect(shell.getByRole("combobox")).toHaveCount(1);
        await shell.getByRole("tab", { name: "GPT-5.1", exact: true }).click();
        await expect(shell.getByRole("tabpanel", { name: "GPT-5.1", exact: true })).toBeVisible();
      }
      const trigger = shell.getByRole("combobox").first();
      await trigger.click();
      const controls = await shell
        .locator('[role="combobox"]')
        .first()
        .getAttribute("aria-controls");
      expect(controls).toBeTruthy();
      // Modal Radix hides its trigger from the accessibility tree while open.
      // Base keeps a hidden option collection for closed-trigger typeahead.
      const list = page.getByRole("listbox").and(page.locator(`[id="${controls}"]`));
      await expect(list).toBeVisible();
      await expect(page.getByRole("option", { name: /Gemini 3 Pro/ })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(list).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await comparisonEvidence(page, info, "02-native-controls");
      expect(faults).toEqual([]);
    });
  }
}
