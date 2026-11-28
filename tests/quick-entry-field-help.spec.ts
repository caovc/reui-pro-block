import { expect, test } from "@playwright/test";

const fields = [
  ["Title", "entry-title-brief", "Name the outcome this entry should achieve."],
  ["Notes", "entry-notes-brief", "Include the context someone needs to take the next step."],
  ["Status", "entry-status", "Choose the stage that reflects the entry's current progress."],
  ["Assignee", "entry-assignee", "Choose who is responsible for the next follow-up."],
  ["Due date", "entry-date", "Choose when this entry should be reviewed or followed up."],
  ["Priority", "entry-priority", "Show the urgency the receiving team should notice first."],
  ["Labels", "entry-labels", "Group this entry with the workstream it belongs to."],
] as const;

for (const primitive of ["radix", "base"] as const) {
  for (const width of [390, 1440]) {
    test(`${primitive} Quick Entry field help preserves native labels and Escape layers at ${width}px`, async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      const preset = new URLSearchParams({
        preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
      });
      await page.goto(
        `${primitive === "base" ? "./base/" : "./"}#/preview/application/dialog/dialog-12?${preset}`,
      );
      await expect(page).toHaveTitle("Quick Create Entry — Preview");
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      const launcher = page.getByRole("button", { name: "Open quick entry", exact: true });
      await launcher.click();
      const dialog = page.getByRole("dialog", { name: "Create entry", exact: true });
      const brief = dialog.getByRole("tab", { name: "Brief", exact: true });
      await brief.click();
      await expect(brief).toHaveAttribute("aria-selected", "true");
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const titleIcon = dialog
        .getByRole("tabpanel", { name: "Brief", exact: true })
        .locator('[data-slot="input-group"] svg');
      const actionIcon = dialog
        .getByRole("button", { name: "Create Brief", exact: true })
        .locator("svg");
      await expect(titleIcon).toHaveClass(/lucide-file-text/);
      await expect(actionIcon).toHaveClass(/lucide-send/);
      for (const icon of [titleIcon, actionIcon]) {
        await expect(icon).toHaveAttribute("aria-hidden", "true");
        const bounds = (await icon.boundingBox())!;
        expect({ width: bounds.width, height: bounds.height }).toEqual({ width: 16, height: 16 });
      }
      const popup = page.locator('[data-slot="tooltip-content"]');
      const draft = () =>
        dialog.locator(fields.map(([, id]) => `[id="${id}"]`).join(",")).evaluateAll((elements) =>
          elements.map((element) => ({
            id: element.id,
            value:
              element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
                ? element.value
                : element.textContent?.trim(),
          })),
        );
      const original = await draft();
      const proof: object[] = [];

      for (const [label, , help] of fields) {
        const trigger = dialog.getByRole("button", { name: `${label} help`, exact: true });
        await expect(trigger).toHaveAttribute("type", "button");
        expect(await trigger.evaluate((element) => !!element.closest("label"))).toBe(false);
        const bounds = (await trigger.boundingBox())!;
        const icon = (await trigger.locator("svg").boundingBox())!;
        expect({ width: bounds.width, height: bounds.height }).toEqual({ width: 16, height: 16 });
        expect({ width: icon.width, height: icon.height }).toEqual({ width: 14, height: 14 });
        await trigger.hover();
        await expect(popup).toBeVisible();
        await expect(popup).toContainText(help);
        await expect(trigger).toHaveAccessibleDescription(help);
        const tip = (await popup.boundingBox())!;
        expect(tip.x).toBeGreaterThanOrEqual(0);
        expect(tip.x + tip.width).toBeLessThanOrEqual(width);
        // Leave through ordinary pointer movement so the native hover corridor
        // can observe movement beyond its initial trigger-exit point.
        const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
        await page.mouse.move(center.x + 24, center.y + 16, { steps: 4 });
        await page.mouse.move(center.x + 64, center.y + 24, { steps: 4 });
        await expect(popup).toBeHidden();
        proof.push({ label, bounds, icon, tooltip: tip });
      }

      await expect(brief).toBeFocused();
      for (const [label, id, help] of fields) {
        const trigger = dialog.getByRole("button", { name: `${label} help`, exact: true });
        for (
          let tab = 0;
          !(await trigger.evaluate((element) => document.activeElement === element)) && tab < 4;
          tab++
        )
          await page.keyboard.press("Tab");
        await expect(trigger).toBeFocused();
        await expect(popup).toBeVisible();
        await expect(popup).toContainText(help);
        await expect(trigger).toHaveAccessibleDescription(help);
        if (label === "Title") {
          // Hold the outgoing animation to prove that focus blur retires the
          // hint's Escape layer without waiting for its visual exit.
          const heldExit = await page.addStyleTag({
            content:
              '[data-slot="tooltip-content"][data-state="closed"] { animation-duration: 60s !important; }',
          });
          await page.keyboard.press("Tab");
          await expect(dialog.locator(`[id="${id}"]`)).toBeFocused();
          await expect(popup).toHaveCount(0);
          await heldExit.evaluate((element) => element.remove());
          await page.keyboard.press("Shift+Tab");
          await expect(trigger).toBeFocused();
          await expect(popup).toBeVisible();
        }
        await page.keyboard.press("Escape");
        await expect(popup).toBeHidden();
        await expect(dialog).toBeVisible();
        await expect(trigger).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(dialog.locator(`[id="${id}"]`)).toBeFocused();
      }

      for (const [label, id] of fields) {
        await dialog.locator(`label[for="${id}"]`).click();
        const control = dialog.locator(`[id="${id}"]`);
        if (id === "entry-title-brief" || id === "entry-notes-brief") {
          await expect(control).toBeFocused();
        } else {
          const picker = page.locator('[data-slot="combobox-content"]');
          await expect(picker).toBeVisible();
          await expect(
            dialog.getByRole("button", { name: `${label} help`, exact: true }),
          ).not.toBeFocused();
          await page.keyboard.press("Escape");
          await expect(picker).toHaveCount(0);
          await expect(dialog).toBeVisible();
          await expect(control).toBeFocused();
        }
      }
      expect(await draft()).toEqual(original);
      await info.attach("field-help-geometry", {
        body: JSON.stringify(proof, null, 2),
        contentType: "application/json",
      });
      await page.screenshot({
        path: info.outputPath("brief-help-fields.png"),
        animations: "disabled",
      });
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(launcher).toBeFocused();
      expect(errors).toEqual([]);
    });
  }
}
