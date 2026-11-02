import { expect, test, type CDPSession, type Page } from "@playwright/test";
import {
  API_REQUESTS,
  REQUEST_BUCKET_MS,
  REQUEST_NOW,
  TRAFFIC_BUCKETS,
} from "../src/blocks/data/grid-base-api-request-logs-data";

// Native Chromium touch input on the actual preview route. This test does not seed a mouse hover,
// call the implementation's event handlers, inject focus, or use its filtering predicates as an oracle.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const runtimeErrors = new WeakMap<Page, string[]>();
const route = "/#/preview/data-grid/base/data-grid-base-9";
const windowStart = REQUEST_NOW - 24 * 3_600_000;
const visibleBuckets = TRAFFIC_BUCKETS.filter(
  (bucket) => bucket.timestamp >= windowStart && bucket.timestamp < REQUEST_NOW,
);
const chart = (page: Page) => page.getByRole("region", { name: "Request traffic", exact: true });
const readout = (page: Page) => chart(page).locator('[aria-live="polite"]');
const records = (page: Page) => page.locator('[data-slot="data-grid-table"] tbody tr[data-row-id]');
const utcTime = (timestamp: number) => new Date(timestamp).toISOString().slice(11, 16);

function metric(page: Page, label: "Requests" | "Errors" | "Availability") {
  return chart(page)
    .locator("..")
    .getByText(label, { exact: true })
    .locator("..")
    .locator("span.tabular-nums")
    .first();
}

async function expectRange(page: Page, firstIndex: number, lastIndex: number) {
  const first = Math.min(firstIndex, lastIndex);
  const last = Math.max(firstIndex, lastIndex);
  const start = visibleBuckets[first].timestamp;
  const end = visibleBuckets[last].timestamp + REQUEST_BUCKET_MS;
  const included = visibleBuckets.slice(first, last + 1);
  const total = included.reduce(
    (sum, bucket) => sum + bucket["2xx"] + bucket["4xx"] + bucket["5xx"],
    0,
  );
  const failures = included.reduce((sum, bucket) => sum + bucket["4xx"] + bucket["5xx"], 0);
  const serverErrors = included.reduce((sum, bucket) => sum + bucket["5xx"], 0);
  const ids = API_REQUESTS.filter(
    (request) => request.timestamp >= start && request.timestamp < end,
  )
    .toSorted((a, b) => b.timestamp - a.timestamp)
    .map((request) => request.id);
  expect(ids.length).toBeGreaterThan(0);
  expect(ids.length).toBeLessThanOrEqual(10);
  await expect(page.getByRole("button", { name: "Reset Zoom", exact: true })).toBeVisible();
  await expect(readout(page)).toContainText(`Selected ${utcTime(start)} to ${utcTime(end)} UTC.`);
  await expect(metric(page, "Requests")).toHaveText(total.toLocaleString("en-US"));
  await expect(metric(page, "Errors")).toHaveText(`${((failures / total) * 100).toFixed(1)}%`);
  await expect(metric(page, "Availability")).toHaveText(
    `${(((total - serverErrors) / total) * 100).toFixed(2)}%`,
  );
  await expect(records(page)).toHaveCount(ids.length);
  await expect
    .poll(() =>
      records(page).evaluateAll((rows) => rows.map((row) => row.getAttribute("data-row-id"))),
    )
    .toEqual(ids);
}

async function barCoordinates(page: Page) {
  // The actual first Bar series is 2xx, which has a nonzero bar for every original bucket.
  // Positions come from rendered SVG bounds, not a hard-coded chart width, margin or time scale.
  const bars = chart(page)
    .locator(".recharts-bar-rectangles")
    .first()
    .locator("path.recharts-rectangle");
  await expect(bars).toHaveCount(visibleBuckets.length);
  const bounds = await bars.evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }),
  );
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  for (const box of bounds) {
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport!.width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport!.height);
  }
  return bounds;
}

async function nativeDrag(
  page: Page,
  cdp: CDPSession,
  bars: Awaited<ReturnType<typeof barCoordinates>>,
  first: number,
  moves: number[],
  end: "touchEnd" | "touchCancel" = "touchEnd",
) {
  const origin = bars[first];
  const y = origin.y + origin.height / 2;
  const point = (index: number) => ({ x: bars[index].x + bars[index].width / 2, y, id: 1 });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point(first)] });
  let active = true;
  try {
    for (const index of moves) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [point(index)],
      });
    }
    if (end === "touchCancel") {
      await expect(chart(page).locator(".recharts-reference-area")).toHaveCount(1);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: end, touchPoints: [] });
    active = false;
  } finally {
    if (active)
      await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  }
}

async function openFreshPhone(page: Page) {
  await page.goto(route);
  await expect(page.locator('[data-slot="data-grid-table"]')).toBeVisible();
  await expect(chart(page)).toBeInViewport();
  await expect(readout(page)).toContainText(`${visibleBuckets.length} time intervals.`);
  await expect(readout(page)).toContainText("No interval selected.");
  await expect(page.getByRole("button", { name: "Reset Zoom", exact: true })).toHaveCount(0);
  await expect(chart(page)).toHaveCSS("touch-action", "pan-y");
  return barCoordinates(page);
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? []).toEqual([]);
});

test("Base9 first phone touch drag uses the actual origin without prior hover", async ({
  page,
}) => {
  const bars = await openFreshPhone(page);
  const cdp = await page.context().newCDPSession(page);
  try {
    // 02:00 -> 06:00 UTC buckets, producing the exclusive selection end 06:30.
    // The first move exceeds native touch slop and subsequent moves observe actual UI updates.
    await nativeDrag(page, cdp, bars, 28, [32, 34, 36]);
    await expectRange(page, 28, 36);
    await test.info().attach("base9-first-phone-touch", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  } finally {
    await cdp.detach();
  }
});

test("Base9 reverse and subsequent phone touch drags use their own origins", async ({ page }) => {
  const bars = await openFreshPhone(page);
  const cdp = await page.context().newCDPSession(page);
  try {
    await nativeDrag(page, cdp, bars, 36, [32, 30, 28]);
    await expectRange(page, 36, 28);
    // Do not Reset Zoom or clear the preceding active bucket before this new gesture.
    await nativeDrag(page, cdp, bars, 18, [22, 24]);
    await expectRange(page, 18, 24);
  } finally {
    await cdp.detach();
  }
});

test("Base9 native touch cancellation discards the draft without committing a range", async ({
  page,
}) => {
  const bars = await openFreshPhone(page);
  const cdp = await page.context().newCDPSession(page);
  const fullTotal = visibleBuckets.reduce(
    (sum, bucket) => sum + bucket["2xx"] + bucket["4xx"] + bucket["5xx"],
    0,
  );
  try {
    await nativeDrag(page, cdp, bars, 28, [32, 34], "touchCancel");
    await expect(page.getByRole("button", { name: "Reset Zoom", exact: true })).toHaveCount(0);
    await expect(readout(page)).toContainText("No interval selected.");
    await expect(chart(page).locator(".recharts-reference-area")).toHaveCount(0);
    await expect(metric(page, "Requests")).toHaveText(fullTotal.toLocaleString("en-US"));
    await expect(records(page)).toHaveCount(10);
    await nativeDrag(page, cdp, bars, 28, [32, 34, 36]);
    await expectRange(page, 28, 36);
  } finally {
    await cdp.detach();
  }
});
