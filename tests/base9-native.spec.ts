import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  API_REQUESTS,
  REQUEST_BUCKET_MS,
  REQUEST_NOW,
  TRAFFIC_BUCKETS,
} from "../src/blocks/data/grid-base-api-request-logs-data";

// DRAFT: install as tests/base9-native.spec.ts in the normal application checkout.
// No private harness route, implementation predicate, hash golden or test configuration.
const route = "/#/preview/data-grid/base/data-grid-base-9";
const errors = new WeakMap<Page, string[]>();
const grid = (page: Page) => page.locator('[data-slot="data-grid-table"]');
const records = (page: Page) => grid(page).locator("tbody tr[data-row-id]");
const chart = (page: Page) => page.getByRole("region", { name: "Request traffic", exact: true });

function metric(page: Page, label: "Requests" | "Errors" | "Availability") {
  // The chart's direct parent owns only its traffic summary, class toggles and chart.
  // Each label's parent owns that metric's value and its optional prior-window delta.
  return chart(page)
    .locator("..")
    .getByText(label, { exact: true })
    .locator("..")
    .locator("span.tabular-nums")
    .first();
}

function trafficTotal(hours: number) {
  const start = REQUEST_NOW - hours * 3_600_000;
  return TRAFFIC_BUCKETS.filter(
    (bucket) => bucket.timestamp >= start && bucket.timestamp < REQUEST_NOW,
  ).reduce((total, bucket) => total + bucket["2xx"] + bucket["4xx"] + bucket["5xx"], 0);
}

function recentDetails(hours: number) {
  return API_REQUESTS.filter(
    (request) =>
      request.timestamp >= REQUEST_NOW - hours * 3_600_000 && request.timestamp < REQUEST_NOW,
  ).sort((a, b) => b.timestamp - a.timestamp);
}

async function expectRowIds(page: Page, ids: string[]) {
  await expect(records(page)).toHaveCount(ids.length);
  await expect
    .poll(() =>
      records(page).evaluateAll((rows) => rows.map((row) => row.getAttribute("data-row-id"))),
    )
    .toEqual(ids);
}

async function closeColumns(page: Page) {
  await page.keyboard.press("Escape");
  // Wait for the actual free popup unmount, including its native close-focus lifecycle.
  await expect(page.locator('[data-slot="cascader-content"][aria-label="Options"]')).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Columns", exact: true })).toBeFocused();
}

async function expectNoOuterOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    )
    .toBe(false);
}

async function expectCode(block: Locator, expectedText: string | RegExp) {
  await expect(block).toHaveCount(1);
  await expect(block.locator('[data-slot="code-block-content"]')).toBeVisible();
  await expect(block.locator('[data-slot="code-block-code"]')).toContainText(expectedText);
}

async function attachComputedFont(target: Locator, name: string) {
  const measured = await target.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      fontWeight: style.fontWeight,
      fontLoadingStatus: document.fonts.status,
    };
  });
  await test.info().attach(name, {
    body: JSON.stringify({ expectedFamily: "Inter", measured }, null, 2),
    contentType: "application/json",
  });
}

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") messages.push(`console: ${message.text()}`);
  });
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page) ?? []).toEqual([]);
});

test("Base9 native Filters scope details, columns stay native, and keyboard time selection scopes traffic", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(route);
  await expect(grid(page)).toBeVisible();
  await expect(metric(page, "Requests")).toHaveText(trafficTotal(24).toLocaleString("en-US"));
  await attachComputedFont(metric(page, "Requests"), "base9-desktop-metric-font");
  await expect(records(page)).toHaveCount(10);
  const aggregateBefore = {
    Requests: await metric(page, "Requests").innerText(),
    Errors: await metric(page, "Errors").innerText(),
    Availability: await metric(page, "Availability").innerText(),
  };

  await page.getByRole("button", { name: "Filter", exact: true }).click();
  const filters = page.getByRole("dialog", { name: "Advanced filter", exact: true });
  await filters.getByRole("button", { name: "Add filter", exact: true }).click();
  await page.getByRole("option", { name: /^Status Code\b/ }).click();
  await page.getByRole("option", { name: "equals", exact: true }).click();
  // The native operator popup remains a dismissable layer during its exit animation.
  // Wait for its DOM to unmount before Escape is sent to the parent filter panel.
  await expect(
    page.locator('[data-slot="popover-content"]:has([role="listbox"][aria-label="Status Code"])'),
  ).toHaveCount(0);
  const statusValue = filters.getByRole("textbox", { name: "Status Code", exact: true });
  await statusValue.fill("503");
  await statusValue.press("Enter");
  await expect(statusValue).toHaveValue("503");
  await page.keyboard.press("Escape");
  await expect(
    page.locator('[data-slot="popover-content"][aria-label="Advanced filter"]'),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Filter", exact: true })).toBeFocused();

  const filtered = recentDetails(24).filter((request) => request.status === 503);
  expect(filtered.length).toBeGreaterThan(0);
  expect(filtered.length).toBeLessThan(10);
  await expectRowIds(
    page,
    filtered.map((request) => request.id),
  );
  for (const label of ["Requests", "Errors", "Availability"] as const) {
    await expect(metric(page, label)).toHaveText(aggregateBefore[label]);
  }

  const columns = page.getByRole("combobox", { name: "Columns", exact: true });
  await page.keyboard.press("Tab");
  await expect(page.getByRole("combobox", { name: "Time range", exact: true })).toBeFocused();
  // Use a real open/close interaction to establish the trigger's native return focus.
  // The test does not assume how many conditional toolbar controls precede Columns.
  await columns.click();
  await expect(page.getByRole("dialog", { name: "Options", exact: true })).toBeVisible();
  await closeColumns(page);
  await expect(columns).toBeFocused();
  await page.keyboard.press("Enter");
  const popup = page.getByRole("dialog", { name: "Options", exact: true });
  await popup.getByRole("option", { name: /^Response\b/ }).click();
  const latency = popup.getByRole("option", { name: /^Latency\b/ });
  await expect(latency).toHaveAttribute("aria-selected", "true");
  await latency.click();
  await expect(latency).toHaveAttribute("aria-selected", "false");
  await closeColumns(page);
  await expect(grid(page).getByRole("columnheader", { name: "Latency", exact: true })).toHaveCount(
    0,
  );

  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("combobox", { name: "Time range", exact: true }).click();
  await page.getByRole("option", { name: "Last 6 hours", exact: true }).click();
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Time range", exact: true })).toBeFocused();
  const sixHours = recentDetails(6);
  expect(sixHours.length).toBeGreaterThan(1);
  expect(sixHours.length).toBeLessThan(10);
  await expectRowIds(
    page,
    sixHours.map((request) => request.id),
  );
  await expect(metric(page, "Requests")).toHaveText(trafficTotal(6).toLocaleString("en-US"));

  // Reach the visible chart through the actual toolbar tab order.
  for (let step = 0; step < 7; step++) {
    if (await chart(page).evaluate((node) => document.activeElement === node)) break;
    await page.keyboard.press("Tab");
  }
  await expect(chart(page)).toBeFocused();
  // Clear a possible pointer hover's active bucket before establishing the keyboard edge.
  await page.keyboard.press("Escape");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");
  const lastBucket = TRAFFIC_BUCKETS.find(
    (bucket) => bucket.timestamp === REQUEST_NOW - REQUEST_BUCKET_MS,
  );
  expect(lastBucket).toBeDefined();
  if (!lastBucket) throw new Error("The original feed must contain the latest half-hour bucket.");
  await expect(metric(page, "Requests")).toHaveText(
    (lastBucket["2xx"] + lastBucket["4xx"] + lastBucket["5xx"]).toLocaleString("en-US"),
  );
  await expectRowIds(
    page,
    sixHours
      .filter((request) => request.timestamp >= lastBucket.timestamp)
      .map((request) => request.id),
  );
  await expect(page.getByRole("button", { name: "Reset Zoom", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Reset Zoom", exact: true })).toHaveCount(0);
  await expectRowIds(
    page,
    sixHours.map((request) => request.id),
  );
  await expect(metric(page, "Requests")).toHaveText(trafficTotal(6).toLocaleString("en-US"));
  await expect(page.getByRole("combobox", { name: "Time range", exact: true })).toHaveText(
    "Last 6 hours",
  );
});

test("Base9 POST details preserve raw fields and CodeBlock, and one local Replay adds exactly one record", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const outgoing: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" || new URL(request.url()).hostname.endsWith(".bricklane.test"))
      outgoing.push(`${request.method()} ${request.url()}`);
  });
  await page.goto(route);
  await expect(grid(page)).toBeVisible();
  const original = recentDetails(24).find((request) => request.method === "POST");
  expect(original).toBeDefined();
  if (!original) throw new Error("A non-GET detail with an original body is required.");
  expect(original.requestBody).not.toBe("");
  const initialTraffic = trafficTotal(24);
  const initialDetails = recentDetails(24).length;
  const row = grid(page).locator(`tr[data-row-id="${original.id}"]`);
  const opener = row.getByRole("button", {
    name: `View ${original.method} ${original.host}${original.path}`,
    exact: true,
  });
  await opener.click();
  const title = `${original.method} ${original.path.split("?")[0]}`;
  const sheet = page.getByRole("dialog", { name: title, exact: true });
  await expect(sheet).toBeVisible();
  await attachComputedFont(
    sheet.getByRole("heading", { name: title, exact: true }),
    "base9-sheet-title-font",
  );
  await expect(sheet.getByText(original.id, { exact: true })).toBeVisible();
  await sheet.getByRole("tab", { name: "Request", exact: true }).click();
  const requestCode = sheet
    .locator('[data-slot="code-block"]')
    .filter({ has: page.getByText("request.json", { exact: true }) });
  await expectCode(requestCode, original.requestBody);
  const curl = sheet
    .locator('[data-slot="code-block"]')
    .filter({ has: page.getByText("request.sh", { exact: true }) });
  await expectCode(curl, "curl -X POST");
  await sheet.getByRole("tab", { name: "Response", exact: true }).click();
  const responseCode = sheet
    .locator('[data-slot="code-block"]')
    .filter({ has: page.getByText("body.json", { exact: true }) });
  await expectCode(responseCode, original.id);
  await expectCode(responseCode, /"accepted":\s*true/);

  await sheet.getByRole("button", { name: "Edit & Replay", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Replay Request", exact: true });
  await expect(editor.getByRole("combobox", { name: "Method", exact: true })).toHaveText("POST");
  await expect(editor.getByRole("combobox", { name: "Host", exact: true })).toHaveText(
    original.host,
  );
  await expect(editor.getByRole("textbox", { name: "Path", exact: true })).toHaveValue(
    original.path,
  );
  await expect(editor.getByRole("combobox", { name: "Region", exact: true })).toContainText(
    original.region,
  );
  await editor.getByRole("button", { name: "Back", exact: true }).click();
  await expect(sheet.getByRole("button", { name: "Edit & Replay", exact: true })).toBeFocused();
  await sheet.getByRole("button", { name: "Replay", exact: true }).click();
  await sheet.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator('[data-slot="sheet-content"]')).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(grid(page).locator('tr[data-row-id^="req-local-replay-"]')).toHaveCount(1);
  await expect(metric(page, "Requests")).toHaveText((initialTraffic + 1).toLocaleString("en-US"));
  await expect(
    page.getByText(`1 - 10 of ${initialDetails + 1} requests`, { exact: true }),
  ).toBeVisible();
  const replayRow = grid(page).locator('tr[data-row-id^="req-local-replay-"]');
  await replayRow.getByRole("button", { name: /^View POST / }).click();
  const replaySheet = page.getByRole("dialog", { name: title, exact: true });
  await replaySheet.getByRole("tab", { name: "Response", exact: true }).click();
  await expectCode(
    replaySheet.locator('[data-slot="code-block"]').filter({ hasText: "body.json" }),
    /"localDemo":\s*true/,
  );
  await expectCode(
    replaySheet.locator('[data-slot="code-block"]').filter({ hasText: "body.json" }),
    original.id,
  );
  await replaySheet.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator('[data-slot="sheet-content"]')).toHaveCount(0);
  await expect(grid(page).locator('tr[data-row-id^="req-local-replay-"]')).toHaveCount(1);
  expect(outgoing).toEqual([]);
});

test("Base9 phone uses the native Columns popup and real table scroll to reach Actions without outer overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await expect(grid(page)).toBeVisible();
  await expectNoOuterOverflow(page);
  await page.getByRole("combobox", { name: "Columns", exact: true }).click();
  const popup = page.getByRole("dialog", { name: "Options", exact: true });
  await popup.getByRole("option", { name: /^Request\b/ }).click();
  const host = popup.getByRole("option", { name: /^Host\b/ });
  await expect(host).toHaveAttribute("aria-selected", "false");
  await host.click();
  await expect(host).toHaveAttribute("aria-selected", "true");
  await closeColumns(page);
  await expect(grid(page).getByRole("columnheader", { name: "Host", exact: true })).toHaveCount(1);

  const viewport = page.locator(
    '[data-slot="scroll-area-viewport"]:has([data-slot="data-grid-table"])',
  );
  await expect(viewport).toHaveCount(1);
  await expect
    .poll(() => viewport.evaluate((node) => node.scrollWidth > node.clientWidth))
    .toBe(true);
  const wheelBox = await viewport.boundingBox();
  expect(wheelBox).not.toBeNull();
  if (!wheelBox) throw new Error("The real table viewport must accept a native horizontal wheel.");
  await page.mouse.move(
    wheelBox.x + wheelBox.width / 2,
    wheelBox.y + Math.min(wheelBox.height / 2, 180),
  );
  await page.mouse.wheel(await viewport.evaluate((node) => node.scrollWidth), 0);
  await expect.poll(() => viewport.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  const actions = records(page)
    .first()
    .getByRole("button", { name: /^Actions for req-demo-/ });
  await expect(actions).toBeInViewport();
  const scrollBox = await viewport.boundingBox();
  const buttonBox = await actions.boundingBox();
  expect(scrollBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  if (!scrollBox || !buttonBox)
    throw new Error("The actual scroll viewport and action must render.");
  const centerX = buttonBox.x + buttonBox.width / 2;
  expect(centerX).toBeGreaterThanOrEqual(scrollBox.x);
  expect(centerX).toBeLessThanOrEqual(scrollBox.x + scrollBox.width);
  await actions.click();
  await expect(page.getByRole("menuitem", { name: "View request", exact: true })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Replay locally", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="dropdown-menu-content"]')).toHaveCount(0);
  await expect(actions).toBeFocused();
  await expectNoOuterOverflow(page);
});
