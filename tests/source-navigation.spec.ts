import { expect, test } from "@playwright/test";

for (const width of [1280, 390]) {
  test(`next block starts at the top on its first frame and opens actual source at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 720 });
    await page.goto("./#/block/application/dialog/dialog-1");
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const source = page.getByRole("dialog");
    await expect(source.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      "src/blocks/application/dialog-variants/first-run/duration.tsx",
    );
    await source.getByRole("button", { name: "Close", exact: true }).click();
    await expect(source).toHaveCount(0);

    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
    ).toBe("smooth");
    const next = page.locator(".block-pagination").getByRole("link", { name: "Bulk Email Invite" });
    await next.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(100);
    await page.evaluate(() => {
      const observed = window as Window & { nextRouteLanding?: Promise<{ x: number; y: number }> };
      observed.nextRouteLanding = new Promise((resolve) => {
        window.addEventListener(
          "hashchange",
          () => requestAnimationFrame(() => resolve({ x: scrollX, y: scrollY })),
          { once: true },
        );
      });
    });
    await next.click();
    const landing = await page.evaluate(
      () =>
        (window as Window & { nextRouteLanding?: Promise<{ x: number; y: number }> })
          .nextRouteLanding,
    );
    expect(landing).toEqual({ x: 0, y: 0 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bulk Email Invite");
    await page.getByRole("button", { name: "View code", exact: true }).click();
    await expect(source.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      "src/blocks/application/dialog-variants/first-run/invites.tsx",
    );
  });
}
