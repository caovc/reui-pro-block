import { expect, test } from "@playwright/test";

for (const primitive of ["radix", "base"] as const) {
  test(`${primitive} Quick Entry Brief keeps paired phone properties and Labels visible`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    const entry = primitive === "base" ? "/base/" : "/";
    const preset = encodeURIComponent(JSON.stringify({ primitive, style: "nova", mode: "light" }));
    await page.goto(`${entry}#/preview/application/dialog/dialog-12?preset=${preset}`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    const launcher = page.getByRole("button", { name: "Open quick entry", exact: true });
    await launcher.click();
    const dialog = page.getByRole("dialog", { name: "Create entry", exact: true });
    await dialog.getByRole("tab", { name: "Brief", exact: true }).click();
    await expect(dialog.getByRole("tab", { name: "Brief", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.evaluate(() => document.fonts.ready);
    const layout = await dialog.evaluate((node) => {
      const box = (element: Element) => {
        const { left, right, top, bottom } = element.getBoundingClientRect();
        return { left, right, top, bottom };
      };
      const body = node.querySelector(".final-entry-body")!;
      return {
        dialog: box(node),
        body: box(body),
        overflow: body.scrollWidth > body.clientWidth,
        fields: ["status", "assignee", "date", "priority", "labels"].map((id) =>
          box(node.querySelector(`#entry-${id}`)!),
        ),
      };
    });
    await info.attach("brief-phone-properties", {
      body: JSON.stringify(layout),
      contentType: "application/json",
    });
    await page.screenshot({ path: info.outputPath("brief-phone.png") });
    const [status, assignee, date, priority, labels] = layout.fields;
    expect(Math.abs(status.top - assignee.top)).toBeLessThan(1);
    expect(status.right).toBeLessThan(assignee.left);
    expect(Math.abs(date.top - priority.top)).toBeLessThan(1);
    expect(date.right).toBeLessThan(priority.left);
    expect(labels.bottom).toBeLessThanOrEqual(layout.body.bottom);
    expect(layout.overflow).toBe(false);
    for (const field of layout.fields) {
      expect(field.left).toBeGreaterThanOrEqual(layout.body.left);
      expect(field.right).toBeLessThanOrEqual(layout.body.right);
    }
    const labelsPicker = dialog.locator("#entry-labels");
    await labelsPicker.click();
    await expect(page.getByPlaceholder("Select labels", { exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(labelsPicker).toBeFocused();
    await dialog.getByRole("button", { name: "Create Brief", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText(/Brief: Partner beta readiness decision/)).toBeVisible();
    expect(errors).toEqual([]);
  });
}

for (const primitive of ["radix", "base"] as const) {
  test(`${primitive} Quick Entry preserves the full assignee at 375px in Maia`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 375, height: 844 });
    const entry = primitive === "base" ? "/base/" : "/";
    const preset = encodeURIComponent(JSON.stringify({ primitive, style: "maia", mode: "light" }));
    await page.goto(`${entry}#/preview/application/dialog/dialog-12?preset=${preset}`);
    await page.getByRole("button", { name: "Open quick entry", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Create entry", exact: true });
    await dialog.getByRole("tab", { name: "Brief", exact: true }).click();
    await page.evaluate(() => document.fonts.ready);
    const trigger = dialog.locator("#entry-assignee");
    await trigger.scrollIntoViewIfNeeded();
    const text = await trigger.locator(".truncate").evaluate((span) => {
      const range = document.createRange();
      range.selectNodeContents(span);
      const label = range.getBoundingClientRect();
      const visible = span.getBoundingClientRect();
      return {
        left: label.left,
        right: label.right,
        visibleLeft: visible.left,
        visibleRight: visible.right,
      };
    });
    await info.attach("narrow-assignee-text", {
      body: JSON.stringify(text),
      contentType: "application/json",
    });
    expect(text.left).toBeGreaterThanOrEqual(text.visibleLeft - 0.5);
    expect(text.right).toBeLessThanOrEqual(text.visibleRight + 0.5);
    await trigger.click();
    await expect(page.getByPlaceholder("Select assignee", { exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });
}
