import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";
const route = (id: number) => `./#/preview/application/card/card-${id}`;
for (const width of [1440, 390])
  test(`cards36–43 preserve distinct free-component layouts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (let id = 36; id <= 43; id++) {
      await page.goto(route(id));
      await expect(page.locator(`[data-card-variant="${id}"]`)).toBeVisible();
      await expect(page.locator('[data-slot="frame"]')).not.toHaveCount(0);
      expect(await page.locator("vite-error-overlay").count()).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `card${id} document overflow`,
      ).toBeLessThanOrEqual(width);
    }
    expect(errors).toEqual([]);
  });
test("customer connection confirms disconnect, can cancel, and reconnects locally", async ({
  page,
}) => {
  await page.goto(route(42));
  await expect(page.getByRole("img", { name: "Jenny Klabber", exact: true })).toHaveCSS(
    "width",
    "80px",
  );
  await expect(page.getByRole("img", { name: "Online", exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Verified profile", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Connected", exact: true }).click();
  await page.getByRole("button", { name: "Keep connection", exact: true }).click();
  await expect(page.getByRole("button", { name: "Connected", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Connected", exact: true }).click();
  await page.getByRole("button", { name: "Disconnect locally", exact: true }).click();
  await expect(page.getByRole("button", { name: "Connect", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByRole("button", { name: "Connected", exact: true })).toBeVisible();
});
test("portfolio profile opens real fixture and project detail matches selected project", async ({
  page,
}) => {
  await page.goto(route(43));
  await expect(page.getByRole("img", { name: "Ralph Edwards", exact: true })).toHaveCSS(
    "width",
    "80px",
  );
  await page.getByRole("button", { name: "View Profile", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Sacramento, California");
  await expect(page.getByRole("dialog")).toContainText("Mobile Checkout · UX-384");
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "View Analytics Suite", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Project ID: PX-102");
  await expect(page.getByRole("dialog")).toContainText("No external project service is connected");
});
test("official ScrollArea pans the portfolio horizontally without widening document", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(route(43));
  const verified = await page
    .getByRole("img", { name: "Verified profile", exact: true })
    .boundingBox();
  const profileButton = await page
    .getByRole("button", { name: "View Profile", exact: true })
    .boundingBox();
  expect(verified!.x + verified!.width).toBeLessThanOrEqual(profileButton!.x - 4);
  const viewport = page.locator('[data-slot="scroll-area-viewport"]');
  await viewport.hover();
  await page.mouse.wheel(320, 0);
  await expect.poll(() => viewport.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await expect(
    page.locator('[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
test("portfolio contact keeps a local message draft without sending", async ({ page }) => {
  await page.goto(route(43));
  await page.getByRole("button", { name: "Get in Touch", exact: true }).click();
  await page.getByLabel("Your name", { exact: true }).fill("QA Reviewer");
  await page.getByLabel("Your email", { exact: true }).fill("qa@example.com");
  await page
    .getByLabel("Message", { exact: true })
    .fill("Interested in the analytics interface example.");
  await page.getByRole("button", { name: "Save message locally", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("did not send a message");
  await page.getByRole("button", { name: "Review message draft", exact: true }).click();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("QA Reviewer");
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue(
    "Interested in the analytics interface example.",
  );
});
test("resource and topic titles show distinct local destinations", async ({ page }) => {
  await page.goto(route(39));
  await page.getByRole("button", { name: "Security Center", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("advanced security measures");
  await page.getByRole("button", { name: "Back to cards", exact: true }).click();
  await page.goto(route(41));
  await page.getByRole("button", { name: "Analytics Setup", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Real-time tracking setup");
});
test("read-only metric variants retain company, strip and fitness fixtures", async ({ page }) => {
  await page.goto(route(36));
  await expect(page.getByText("340", { exact: true })).toBeVisible();
  await expect(page.getByText("Emails Sent", { exact: true })).toBeVisible();
  await page.goto(route(37));
  await expect(page.locator('[data-slot="frame-panel"]')).toHaveCount(6);
  await expect(page.getByText("Nov 2018", { exact: true })).toBeVisible();
  await page.goto(route(38));
  await expect(page.getByText("4.93", { exact: true })).toBeVisible();
  await page.goto(route(40));
  await expect(page.locator('[data-slot="frame-panel"]')).toHaveCount(4);
  await expect(page.getByText("bpm", { exact: true })).toBeVisible();
  await expect(page.getByText("Calories Burned", { exact: true })).toBeVisible();
});

test("portfolio source ZIP contains real shared primitives, chart and replacement portraits", async ({
  page,
}) => {
  await page.goto("./#/block/application/card/card-43");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("card-43.zip");
  const files = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const path of [
    "src/blocks/application/card-variants/final-profiles/profiles.tsx",
    "src/blocks/application/card-variants/final-profiles/final-profiles.css",
    "src/components/reui/frame.tsx",
    "src/components/reui/badge.tsx",
    "src/components/ui/scroll-area.tsx",
    "src/components/ui/chart.tsx",
    "src/components/ui/aspect-ratio.tsx",
    "src/components/reui/REUI-LICENSE.txt",
    "src/blocks/application/assets/README.md",
  ])
    expect(files[path], path).toBeDefined();
  for (const person of ["emma-wilson", "james-park", "sarah-chen", "sofia-reyes", "liam-torres"])
    expect(files[`src/blocks/application/assets/schedule-${person}.jpg`]?.length).toBeGreaterThan(
      2000,
    );
});
