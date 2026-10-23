import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

async function open(page: Page, id: number) {
  await page.goto(`./#/preview/chart/bar-chart/chart-${id}`);
  await expect(page.locator('[data-reui-chart="c-chart-1"]')).toBeVisible();
}

test("signed budget native coordinates preserve negative values, forecast and pointer range exports", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, 42);
  const plot = page.getByRole("img", {
    name: "Ledger write success daily budget remaining",
    exact: true,
  });
  await expect(plot.getByRole("button")).toHaveCount(36);
  const positive = plot.getByRole("button", { name: "Day 1: 100% remaining", exact: true });
  const negative = plot.getByRole("button", { name: "Day 29: -42% remaining", exact: true });
  const positiveY = await positive.locator("circle").first().getAttribute("cy");
  const negativeY = await negative.locator("circle").first().getAttribute("cy");
  expect(Number(negativeY)).toBeGreaterThan(Number(positiveY));
  const start = await plot
    .getByRole("button", { name: "Day 27: -39% remaining", exact: true })
    .boundingBox();
  const end = await negative.boundingBox();
  await page.mouse.move(start!.x + start!.width / 2, start!.y + 5);
  await page.mouse.down();
  await page.mouse.move(end!.x + end!.width / 2, end!.y + 5, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByText("Days 27–29 · 4.0% budget spent", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Forecast", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(plot.getByRole("button")).toHaveCount(29);
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export CSV", exact: true }).click();
  const csv = await readFile((await (await download).path())!, "utf8");
  expect(csv.trim().split("\n")).toHaveLength(30);
  expect(csv).toContain("-42");
  expect(errors).toEqual([]);
});

test("native logarithmic hourly plot preserves public sub-pace floor and rate keyboard readout", async ({
  page,
}) => {
  await open(page, 43);
  const plot = page.getByRole("img", {
    name: "Log scale burn rates for the last 72 hours",
    exact: true,
  });
  await expect(plot.getByRole("button")).toHaveCount(72);
  const first = plot.getByRole("button", { name: "Hour 1: 0.30 times burn", exact: true });
  const second = plot.getByRole("button", { name: "Hour 2: 0.44 times burn", exact: true });
  const firstY = Number(await first.locator("circle").first().getAttribute("cy"));
  const secondY = Number(await second.locator("circle").first().getAttribute("cy"));
  expect(firstY).toBeCloseTo(secondY, 4);
  const spikeY = Number(
    await plot
      .getByRole("button", { name: "Hour 18: 4.40 times burn", exact: true })
      .locator("circle")
      .first()
      .getAttribute("cy"),
  );
  expect(firstY).toBeGreaterThan(spikeY + 1);
  const lastY = Number(
    await plot
      .getByRole("button", { name: "Hour 72: 18.00 times burn", exact: true })
      .locator("circle")
      .first()
      .getAttribute("cy"),
  );
  expect(spikeY).toBeGreaterThan(lastY);
  await expect(page.locator('[data-reui-chart="c-chart-12"]')).toHaveCount(5);
  const app = page.getByRole("application", {
    name: "Hourly burn rate. Arrow keys move by hour.",
    exact: true,
  });
  await app.focus();
  await page.keyboard.press("ArrowRight");
  await expect(plot.getByLabel("0.30×", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "24h", exact: true }).click();
  await expect(
    page
      .getByRole("img", { name: "Log scale burn rates for the last 24 hours", exact: true })
      .getByRole("button"),
  ).toHaveCount(24);
});

test("both native burn charts keep markers, labels and controls inside a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const id of [42, 43]) {
    await open(page, id);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    const svg = page.locator("[data-burn-scale] .recharts-surface");
    await expect(svg).toBeVisible();
    const box = await svg.boundingBox();
    expect(box!.width).toBeGreaterThan(300);
    const text = await svg.locator("text").allTextContents();
    expect(text.join(" ")).toContain(id === 42 ? "Warn 25%" : "Page 14.4×");
  }
});

test("downloaded burn starter includes actual free native plot dependency and theme-first entry", async ({
  page,
}, testInfo) => {
  await page.goto("./#/block/chart/bar-chart/chart-42");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const file = await download;
  await file.saveAs(testInfo.outputPath("burn-starter.zip"));
  const zip = unzipSync(new Uint8Array(await readFile((await file.path())!)));
  const filename = "src/blocks/data/bar-burn-plots.tsx";
  expect(strFromU8(zip[filename])).toBe(await readFile(filename, "utf8"));
  expect(strFromU8(zip["src/main.tsx"]).trimStart()).toMatch(/^import ["']\.\/theme\.css["'];/);
});
