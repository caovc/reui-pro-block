import { expect, test, type Locator, type Page } from "@playwright/test";

async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 48; step++) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((node) => node === document.activeElement)) return;
  }
  await expect(target).toBeFocused();
}

for (const primitive of ["radix", "base"] as const) {
  test(`Strata Logs ${primitive}: zero buckets retain tracks and truthful UTC tooltips`, async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("A built preview must be bound");
    const root = new URL("./", baseURL);
    if (root.pathname.endsWith("/base/")) root.pathname = root.pathname.slice(0, -5);
    const entry = new URL(primitive === "base" ? "base/" : "./", root);
    entry.hash = `/templates/strata/logs?${new URLSearchParams({
      preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
    })}`;
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(entry.href);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    const frame = page.locator(".strata-log-volume");
    const chart = frame.locator(".strata-log-chart");
    await expect(frame).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const tracks = chart.locator(".recharts-bar-background-rectangle");
    await expect(tracks).toHaveCount(29);
    const surface = chart.locator('svg.recharts-surface[role="application"]');
    await tabTo(page, surface);
    await expect(surface).toBeFocused();
    const tooltip = chart.locator(".recharts-tooltip-wrapper");
    const expected = `${new Date("2026-10-15T12:00:00.000Z").toLocaleString("en-US", { timeZone: "UTC" })} UTC`;
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(expected);
    await expect(tooltip.locator("span.font-mono")).toHaveText(["0", "0", "0"]);
    await expect(tooltip).toBeInViewport({ ratio: 1 });
    await page.keyboard.press("Enter");
    await expect(tooltip).not.toBeVisible();
    await page.keyboard.press("Tab");
    const levels = frame.getByRole(primitive === "radix" ? "toolbar" : "group", {
      name: "Event levels",
      exact: true,
    });
    for (const level of ["Info", "Warn", "Error"])
      await levels.getByRole("button", { name: new RegExp(`^${level},`) }).click();
    await expect(frame.locator(".strata-log-total strong")).toHaveText("0");
    await expect(tracks).toHaveCount(29);
    await expect(chart.locator(".recharts-bar-rectangle path")).toHaveCount(0);
    await tracks.first().hover();
    await expect(tooltip).toContainText(expected);
    await expect(tooltip.locator("span.font-mono")).toHaveText(["0", "0", "0"]);
    await expect(tooltip).toBeInViewport({ ratio: 1 });
    expect(faults).toEqual([]);
  });
}
