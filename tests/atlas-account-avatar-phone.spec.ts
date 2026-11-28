import { expect, test } from "@playwright/test";

test.use({
  colorScheme: "light",
  actionTimeout: 5000,
  launchOptions: { args: ["--blink-settings=defaultFontSize=32"] },
});

for (const primitive of ["radix", "base"] as const) {
  test(`Atlas ${primitive}: enlarged-text profile photo actions fit and remove can be cancelled`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    const entry = primitive === "base" ? "/base/" : "/";
    const preset = encodeURIComponent(JSON.stringify({ primitive, style: "sera", mode: "light" }));
    await page.goto(`${entry}#/template-preview/atlas/account/profile?preset=${preset}`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await expect(page.locator("html")).toHaveAttribute("data-ui-style", "sera");
    await expect(page.locator("html")).toHaveCSS("font-size", "32px");
    const profile = page.getByRole("region", { name: "Profile details", exact: true });
    const row = profile.locator(".aas-photo-row");
    await page.evaluate(() => document.fonts.ready);
    await row.scrollIntoViewIfNeeded();
    const geometry = await row.evaluate((node) => {
      const box = (element: Element) => {
        const { left, right, top, bottom } = element.getBoundingClientRect();
        return { left, right, top, bottom };
      };
      return {
        width: document.documentElement.scrollWidth,
        row: box(node),
        card: box(node.closest('[role="region"]')!),
        buttons: Array.from(node.querySelectorAll("button")).map((button) => {
          const rect = button.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(button);
          return {
            name: button.textContent?.trim(),
            box: box(button),
            text: Array.from(range.getClientRects()).map(({ left, right, top, bottom }) => ({
              left,
              right,
              top,
              bottom,
            })),
            hits: [rect.left + 2, rect.left + rect.width / 2, rect.right - 2].map((x) => {
              const target = document.elementFromPoint(x, rect.top + rect.height / 2);
              return target === button || (target !== null && button.contains(target));
            }),
          };
        }),
      };
    });
    await info.attach("profile-photo-action-bounds", {
      body: JSON.stringify(geometry),
      contentType: "application/json",
    });
    await page.screenshot({ path: info.outputPath("profile-photo-actions.png") });
    expect(geometry.width).toBeLessThanOrEqual(390);
    expect(geometry.buttons.map((button) => button.name)).toEqual(["Upload", "Remove"]);
    for (const button of geometry.buttons) {
      for (const container of [geometry.row, geometry.card]) {
        expect(button.box.left, `${button.name} left edge`).toBeGreaterThanOrEqual(container.left);
        expect(button.box.right, `${button.name} right edge`).toBeLessThanOrEqual(container.right);
        expect(button.box.top, `${button.name} top edge`).toBeGreaterThanOrEqual(container.top);
        expect(button.box.bottom, `${button.name} bottom edge`).toBeLessThanOrEqual(
          container.bottom,
        );
      }
      expect(button.hits, `${button.name} target is unobscured`).toEqual([true, true, true]);
      for (const text of button.text) {
        expect(text.left).toBeGreaterThanOrEqual(button.box.left);
        expect(text.right).toBeLessThanOrEqual(button.box.right);
        expect(text.top).toBeGreaterThanOrEqual(button.box.top);
        expect(text.bottom).toBeLessThanOrEqual(button.box.bottom);
      }
    }
    const image = profile.getByRole("img", { name: "Avatar", exact: true });
    const original = await image.getAttribute("src");
    await row.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(image).toHaveCount(0);
    await expect(row.getByRole("button", { name: "Remove", exact: true })).toBeDisabled();
    await profile.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(image).toHaveAttribute("src", original!);
    await expect(profile.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
    expect(errors).toEqual([]);
  });
}
