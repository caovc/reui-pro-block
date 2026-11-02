import { expect, test, type Page } from "@playwright/test";
import {
  API_REQUESTS,
  REQUEST_BUCKET_MS,
  REQUEST_NOW,
  TRAFFIC_BUCKETS,
} from "../src/blocks/data/grid-base-api-request-logs-data";

// Independent mouse compatibility coverage for the normal Base9 route.
// Passive native observations below do not change targets, focus, styles or application state.
test.use({ viewport: { width: 1440, height: 1000 }, isMobile: false, hasTouch: false });

const errors = new WeakMap<Page, string[]>();
const chart = (page: Page) => page.getByRole("region", { name: "Request traffic", exact: true });
const readout = (page: Page) => chart(page).locator('[aria-live="polite"]');
const records = (page: Page) => page.locator('[data-slot="data-grid-table"] tbody tr[data-row-id]');
const utcTime = (timestamp: number) => new Date(timestamp).toISOString().slice(11, 16);
const statuses = ["2xx", "4xx", "5xx"] as const;
const buckets = TRAFFIC_BUCKETS.filter(
  (bucket) => bucket.timestamp >= REQUEST_NOW - 24 * 3_600_000 && bucket.timestamp < REQUEST_NOW,
);

function metric(page: Page, label: "Requests" | "Errors" | "Availability") {
  return chart(page)
    .locator("..")
    .getByText(label, { exact: true })
    .locator("..")
    .locator("span.tabular-nums")
    .first();
}

function summary(items: typeof buckets) {
  const total = items.reduce(
    (sum, bucket) => sum + bucket["2xx"] + bucket["4xx"] + bucket["5xx"],
    0,
  );
  const failures = items.reduce((sum, bucket) => sum + bucket["4xx"] + bucket["5xx"], 0);
  const serverErrors = items.reduce((sum, bucket) => sum + bucket["5xx"], 0);
  return {
    Requests: total.toLocaleString("en-US"),
    Errors: `${((failures / total) * 100).toFixed(1)}%`,
    Availability: `${(((total - serverErrors) / total) * 100).toFixed(2)}%`,
  };
}

async function expectMetrics(page: Page, items: typeof buckets) {
  for (const [label, value] of Object.entries(summary(items))) {
    await expect(metric(page, label as "Requests" | "Errors" | "Availability")).toHaveText(value);
  }
}

async function expectIds(page: Page, ids: string[]) {
  await expect(records(page)).toHaveCount(ids.length);
  await expect
    .poll(() =>
      records(page).evaluateAll((rows) => rows.map((row) => row.getAttribute("data-row-id"))),
    )
    .toEqual(ids);
}

async function expectNativeTooltip(page: Page, index: number) {
  const bucket = buckets[index];
  // ChartTooltipContent supplies no role or data-slot. The installed native Recharts
  // TooltipBoundingBox / getTooltipTranslate owns this real wrapper class.
  const tooltip = chart(page).locator(".recharts-tooltip-wrapper");
  await expect(tooltip).toHaveCount(1);
  await expect(tooltip).toBeVisible();
  await expect(
    tooltip.getByText(
      `${utcTime(bucket.timestamp)}–${utcTime(bucket.timestamp + REQUEST_BUCKET_MS)} UTC`,
      { exact: true },
    ),
  ).toBeVisible();
  for (const status of statuses) {
    const row = tooltip.getByText(status, { exact: true }).locator("..");
    await expect(row.locator("span.tabular-nums")).toHaveText(
      bucket[status].toLocaleString("en-GB"),
    );
  }
  await expect(readout(page)).toContainText(
    `${utcTime(bucket.timestamp)} UTC: ${statuses.map((status) => `${status} ${bucket[status]}`).join(", ")}.`,
  );
}

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") messages.push(message.text());
  });
  await page.addInitScript(() => {
    const observations: Record<string, unknown>[] = [];
    const targetIds = new WeakMap<EventTarget, number>();
    let nextTargetId = 1;
    Object.defineProperty(window, "__base9NativeMouseObservations", { value: observations });
    for (const type of ["mousemove", "mousedown", "mouseup"]) {
      window.addEventListener(
        type,
        (event) => {
          if (!(event instanceof MouseEvent) || !(event.target instanceof Element)) return;
          const target = event.target;
          if (!target.closest('[data-slot="request-traffic-chart"]')) return;
          if (!targetIds.has(target)) targetIds.set(target, nextTargetId++);
          const item: Record<string, unknown> = {
            type: event.type,
            isTrusted: event.isTrusted,
            timeStamp: event.timeStamp,
            clientX: event.clientX,
            clientY: event.clientY,
            buttons: event.buttons,
            targetId: targetIds.get(target),
            targetTag: target.tagName,
            targetClass: target.getAttribute("class"),
            targetConnectedAtCapture: target.isConnected,
          };
          observations.push(item);
          queueMicrotask(() => {
            item.targetConnectedAfterDispatch = target.isConnected;
          });
        },
        { capture: true, passive: true },
      );
    }
  });
});

test.afterEach(async ({ page }) => {
  const observations = await page.evaluate(() =>
    Reflect.get(window, "__base9NativeMouseObservations"),
  );
  await test.info().attach("base9-native-mouse-event-targets", {
    body: JSON.stringify(observations ?? [], null, 2),
    contentType: "application/json",
  });
  expect(errors.get(page) ?? []).toEqual([]);
});

test("Base9 native mouse keeps axis tooltip and drag selection after the stable-target change", async ({
  page,
}) => {
  await page.goto("/#/preview/data-grid/base/data-grid-base-9");
  await expect(page.locator('[data-slot="data-grid-table"]')).toBeVisible();
  await expect(chart(page)).toBeInViewport();
  const shapes = chart(page)
    .locator(".recharts-bar-rectangles")
    .first()
    .locator("path.recharts-rectangle");
  await expect(shapes).toHaveCount(buckets.length);
  const bars = await shapes.evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }),
  );
  const originIndex = 28;
  const lastIndex = 36;
  const y = bars[originIndex].y + bars[originIndex].height / 2;
  for (const index of [originIndex, 32, 34, lastIndex]) {
    const box = bars[index];
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.x).toBeGreaterThan(0);
    expect(box.x + box.width).toBeLessThan(1440);
  }
  expect(y).toBeGreaterThan(0);
  expect(y).toBeLessThan(1000);
  await test.info().attach("base9-native-mouse-measured-plan", {
    body: JSON.stringify(
      {
        viewport: page.viewportSize(),
        selectedStartUTC: new Date(buckets[originIndex].timestamp).toISOString(),
        selectedExclusiveEndUTC: new Date(
          buckets[lastIndex].timestamp + REQUEST_BUCKET_MS,
        ).toISOString(),
        origin: bars[originIndex],
        endpoint: bars[lastIndex],
        y,
      },
      null,
      2,
    ),
    contentType: "application/json",
  });

  // Mouse hover is intentional in this independent mouse case; the touch cases remain untouched.
  await page.mouse.move(bars[originIndex].x + bars[originIndex].width / 2, y);
  await expectNativeTooltip(page, originIndex);
  await expectMetrics(page, buckets);
  let mouseDown = false;
  try {
    await page.mouse.down();
    mouseDown = true;
    for (const index of [32, 34, lastIndex]) {
      await page.mouse.move(bars[index].x + bars[index].width / 2, y);
      await expectNativeTooltip(page, index);
    }
    await page.mouse.up();
    mouseDown = false;
  } finally {
    if (mouseDown) await page.mouse.up();
  }

  await expect(readout(page)).toContainText("Selected 02:00 to 06:30 UTC.");
  await expectMetrics(page, buckets.slice(originIndex, lastIndex + 1));
  await expect(metric(page, "Requests")).toHaveText("154");
  await expectIds(page, [
    "req-demo-008",
    "req-demo-009",
    "req-demo-010",
    "req-demo-011",
    "req-demo-012",
    "req-demo-013",
  ]);
  const nativeTargets = (await page.evaluate(() =>
    Reflect.get(window, "__base9NativeMouseObservations"),
  )) as {
    type: string;
    isTrusted: boolean;
    targetId: number;
    targetTag: string;
    targetClass: string | null;
    targetConnectedAtCapture: boolean;
    targetConnectedAfterDispatch: boolean;
  }[];
  expect(nativeTargets.some((event) => event.type === "mousedown")).toBe(true);
  expect(nativeTargets.some((event) => event.type === "mouseup")).toBe(true);
  expect(new Set(nativeTargets.map((event) => event.targetId)).size).toBe(1);
  for (const event of nativeTargets) {
    expect(event.isTrusted).toBe(true);
    expect(event.targetTag).toBe("DIV");
    expect(event.targetClass?.split(/\s+/)).toContain("recharts-wrapper");
    expect(event.targetConnectedAtCapture).toBe(true);
    expect(event.targetConnectedAfterDispatch).toBe(true);
  }
  await test.info().attach("base9-native-mouse-selected", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.getByRole("button", { name: "Reset Zoom", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reset Zoom", exact: true })).toHaveCount(0);
  await expect(readout(page)).toContainText("No interval selected.");
  await expect(chart(page).locator(".recharts-reference-area")).toHaveCount(0);
  await expectMetrics(page, buckets);
  await expectIds(
    page,
    API_REQUESTS.filter(
      (request) =>
        request.timestamp >= REQUEST_NOW - 24 * 3_600_000 && request.timestamp < REQUEST_NOW,
    )
      .toSorted((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map((request) => request.id),
  );
});
