import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, id: string) {
  const family = id.split("-")[0];
  await page.goto(`./#/preview/application/${family}/${id}`);
  await expect(page.locator(`[data-${family}-variant]`)).toBeVisible();
}

async function choose(page: Page, label: string, value: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.locator(`[role="option"][data-value="${value}"]`).click();
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("lead flow uses engine dragging, undo and dirty-aware updates", async ({ page }) => {
  await open(page, "flow-1");
  const node = page.locator('[data-flow-node="condition"]');
  await page.evaluate(() => document.fonts.ready);
  const start = (await node.boundingBox())!;
  await page.mouse.move(start.x + 100, start.y + 24);
  await page.mouse.down();
  await page.mouse.move(start.x + 148, start.y + 48, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => (await node.boundingBox())!.x).toBeGreaterThan(start.x + 40);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(async () => Math.abs((await node.boundingBox())!.x - start.x)).toBeLessThan(2);
  await node.click();
  await page.getByRole("button", { name: "Edit Plan is Enterprise", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Enterprise customer");
  await page.getByRole("button", { name: "Save step", exact: true }).click();
  await expect(node).toContainText("Enterprise customer");
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(page.getByRole("button", { name: "Update", exact: true })).toBeDisabled();
});

test("agent flow changes its actual model and replays the test results", async ({ page }) => {
  await open(page, "flow-2");
  await choose(page, "Model", "Opus 5");
  await expect(page.locator('[data-flow-node="model"]')).toContainText("Claude Opus 5");
  await page.getByRole("button", { name: "Run test", exact: true }).click();
  await expect(page.getByText("Test failed", { exact: true })).toBeVisible();
  await expect(
    page.getByText("4 passed, 1 failed, 4 skipped, 0 unconnected.", { exact: true }),
  ).toBeVisible();
  await page.locator('[data-flow-node="guard"]').dblclick();
  await page.getByLabel("Title", { exact: true }).fill("Outbound guardrail");
  await page.getByRole("button", { name: "Save step", exact: true }).click();
  await expect(page.locator('[data-flow-node="guard"]')).toContainText("Outbound guardrail");
});

test("pipeline failure requires retry and publication approval before completing", async ({
  page,
}) => {
  await open(page, "flow-3");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  const task = page.locator('[data-flow-node="reconcile"]');
  await expect(task).toContainText("Duplicate charge id");
  await page.getByRole("button", { name: "Run options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Retry failed task", exact: true }).click();
  await expect(task).toContainText("Reconciled");
  await expect(page.getByTitle("Waiting", { exact: true })).toHaveText("1");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByText("Run completed", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-flow-node="publish"]')).toContainText("Approved");
});

test("growth map changes the period, relinks a metric and saves its value", async ({ page }) => {
  await open(page, "flow-4");
  await page.getByRole("button", { name: "6 weeks", exact: true }).click();
  await expect(page.getByText("22,408", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Links", exact: true }).click();
  await choose(page, "Relink incoming checkout-north", "rate");
  await expect(page.getByText("Not measured", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  await page.getByLabel("Past 6 weeks value", { exact: true }).fill("24000");
  await page.getByRole("button", { name: "Save metric", exact: true }).click();
  await expect(page.getByText("24,000", { exact: true })).toBeVisible();
});

test("project gantt persists task edits and uses the official scale and tree controls", async ({
  page,
}) => {
  await open(page, "gantt-1");
  await page.locator('[data-slot="gantt-bar"][aria-label^="Login redirect,"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Title", { exact: true }).fill("Login callback");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator('[data-resource-row="login"]')).toContainText("Login callback");
  await page.locator('[data-slot="gantt-scale-switcher"]').click();
  await page.getByRole("menuitem", { name: "Week", exact: true }).click();
  await page.getByRole("button", { name: "Bug Tracking", exact: true }).click();
  await expect(page.locator('[data-resource-row="login"]')).toHaveCount(0);
});

test("dispatch gantt books the selected technician and navigates date windows", async ({
  page,
}) => {
  await open(page, "gantt-2");
  await page.getByRole("button", { name: "Book Job", exact: true }).click();
  await page.getByLabel("Customer", { exact: true }).fill("QA visit");
  await choose(page, "Technician", "mira");
  await choose(page, "Start", "720");
  await choose(page, "End", "750");
  await page.getByRole("dialog").getByRole("button", { name: "Book Job", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator('[data-slot="gantt-bar"]').filter({ hasText: "QA visit" })).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("[data-gantt-bar]")).toHaveCount(0);
  await expect(
    page.locator('[data-slot="gantt-row-group"][data-gantt-row-id="north"]'),
  ).toContainText("0 jobs");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.locator('[data-slot="gantt-bar"]').filter({ hasText: "QA visit" })).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "Today", exact: true }).click();
  const today = await page.evaluate(() =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date()),
  );
  await expect(page.locator('[data-slot="gantt-title"]')).toContainText(today);
});

test("playbook gantt retains previous attempts when rerunning a failed stage", async ({ page }) => {
  await open(page, "gantt-3");
  const attempts = page.locator("[data-gantt-bar]").filter({ hasText: "Capture Refund" });
  await expect(attempts.first()).toBeVisible();
  const count = await attempts.count();
  expect(count).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Actions for Capture Refund", exact: true }).click();
  await page.getByRole("menuitem", { name: "Re-run Stage", exact: true }).click();
  await expect(attempts).toHaveCount(count + 1);
});

test("resource gantt rejects capacity conflicts and saves a valid booking", async ({ page }) => {
  await open(page, "gantt-4");
  await page.getByRole("button", { name: "New Booking", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("QA allocation");
  await choose(page, "Assignee", "mira");
  await page.getByLabel("Start", { exact: true }).fill("2026-08-03");
  await page.getByLabel("Last Day", { exact: true }).fill("2026-08-05");
  await page.getByLabel("Load", { exact: true }).fill("80");
  await page.getByRole("button", { name: "Book", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Over capacity" })).toBeVisible();
  await page.getByLabel("Load", { exact: true }).fill("20");
  await page.getByRole("button", { name: "Book", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.locator('[data-slot="gantt-bar"]').filter({ hasText: "QA allocation" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByRole("checkbox", { name: /Platform/ }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-resource-row="mira"]')).toHaveCount(0);
});

test("box selection retains its delete action and fit includes a moved node", async ({ page }) => {
  await open(page, "flow-1");
  const node = page.locator(".react-flow__node").first();
  await page.getByRole("button", { name: "Select", exact: true }).click();
  const selected = (await node.boundingBox())!;
  await page.mouse.move(selected.x - 12, selected.y - 12);
  await page.mouse.down();
  await page.mouse.move(selected.x + selected.width + 12, selected.y + selected.height + 12, {
    steps: 15,
  });
  await page.mouse.up();
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(1);
  await page.keyboard.press("Delete");
  const confirmation = page.getByRole("dialog", { name: "Delete this step?", exact: true });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(5);

  await open(page, "flow-1");
  await page.getByRole("button", { name: /Zoom level/ }).click();
  await page.getByRole("menuitem", { name: "50%", exact: true }).click();
  const before = (await node.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(1330, before.y + before.height / 2, { steps: 20 });
  await page.mouse.up();
  await page.getByRole("button", { name: /Zoom level/ }).click();
  await page.getByRole("menuitem", { name: "Fit to view", exact: true }).click();
  await expect
    .poll(async () => {
      const [box, canvas] = await Promise.all([
        node.boundingBox(),
        page.locator(".react-flow").boundingBox(),
      ]);
      return !!box && !!canvas && box.x >= canvas.x && box.x + box.width <= canvas.x + canvas.width;
    })
    .toBe(true);
});

test("cancelling another task's form cannot change assignees during a native drag", async ({
  page,
}) => {
  await open(page, "gantt-1");
  const row = page.locator('[data-slot="gantt-row-group"][data-gantt-row-id="access"]');
  const assignees = () =>
    row
      .locator(".fg-row-avatars img")
      .evaluateAll((images) => images.map((image) => image.getAttribute("alt")));
  await expect(row).toBeVisible();
  const original = await assignees();
  expect(original).toEqual(["TL"]);
  await page.getByRole("button", { name: "Actions for Login redirect", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit Task", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Edit Task", exact: true });
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(editor).toBeHidden();
  await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
  const bar = page.locator('[data-slot="gantt-bar"][aria-label^="Access rules,"]');
  const label = await bar.getAttribute("aria-label");
  const box = (await bar.boundingBox())!;
  await page.mouse.move(box.x + 100, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + 164, box.y + 10, { steps: 15 });
  await expect(bar).toHaveAttribute("data-dragging", "true");
  await expect.poll(assignees).toEqual(original);
  await page.mouse.up();
  await expect(bar).not.toHaveAttribute("aria-label", label!);
  await expect.poll(assignees).toEqual(original);
});

test("copied project task links reopen and select their target through the official engine", async ({
  page,
  context,
}) => {
  const id = "gantt-1",
    title = "Login redirect";
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, id);
  await page.locator(`[data-slot="gantt-bar"][aria-label^="${title},"]`).click({ button: "right" });
  await page.getByRole("menuitem", { name: "Copy Task Link", exact: true }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(link).hash).toContain(`/preview/application/gantt/${id}`);
  await page.goto(link);
  await expect(page.locator('[data-slot="gantt-view"]')).toBeVisible();
  await expect(page.locator(`[data-slot="gantt-bar"][aria-label^="${title},"]`)).toHaveAttribute(
    "data-selected",
    "true",
  );
});

for (const [id, nodeId, zoom] of [
  ["flow-3", "reconcile", 75],
  ["flow-4", "north", 50],
] as const) {
  test(`${id} phone selects a node before opening its fullscreen sheet with an inset editor`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await open(page, id);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: `Zoom level ${zoom}%`, exact: true }),
    ).toBeVisible();
    await page.locator(`[data-flow-node="${nodeId}"]`).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .locator(".react-flow__node-toolbar")
      .getByRole("button", { name: /^Open / })
      .click();
    const editor = page.getByRole("dialog");
    await expect(editor).toBeVisible();
    await expect(editor).toHaveAttribute("data-slot", "sheet-content");
    expect(await editor.boundingBox()).toMatchObject({ x: 0, y: 0, width: 390, height: 900 });
    expect(await editor.locator(".fg-inspector").boundingBox()).toMatchObject({
      x: 17,
      y: 16,
      width: 357,
      height: 868,
    });
    await page.keyboard.press("Escape");
    await expect(editor).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: `Zoom level ${zoom}%`, exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
}

for (const [id, title, detail, field, close] of [
  ["gantt-2", "Marlow Gym", "88 Quarry Rd", "Customer", "Close"],
  ["gantt-3", "Parse Batch", "26.1k tokens", "Title", "Close"],
  ["gantt-4", "Design System", "Nora Vale", "Title", "Discard"],
] as const) {
  test(`${id} phone opens read-only details before editing and closes safely`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await open(page, id);
    const bar = page.locator('[data-slot="gantt-bar"]').filter({ hasText: title }).first();
    await bar.click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toHaveAttribute("data-slot", "sheet-content");
    await expect(sheet.getByText(detail, { exact: true }).last()).toBeVisible();
    await expect
      .poll(async () => {
        const box = await sheet.boundingBox();
        return (
          box &&
          Object.fromEntries(Object.entries(box).map(([key, value]) => [key, Math.round(value)]))
        );
      })
      .toEqual({ x: 16, y: 16, width: 358, height: 868 });
    await expect(sheet.getByRole("textbox")).toHaveCount(0);
    await sheet.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(page.getByLabel(field, { exact: true })).toHaveValue(title);
    await page.getByLabel(field, { exact: true }).fill("Unsaved change");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: close, exact: true })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(bar).toContainText(title);
    await expect(
      page.locator('[data-slot="gantt-bar"]').filter({ hasText: "Unsaved change" }),
    ).toHaveCount(0);
  });
}

test("booking duplication starts after the original and preserves its assignment and notes", async ({
  page,
}) => {
  await open(page, "gantt-4");
  await page.locator('[data-slot="gantt-bar"]').filter({ hasText: "Design System" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const copy = page.locator('[data-slot="gantt-bar"]').filter({ hasText: "Design System Copy" });
  // The engine exposes the exclusive end; the booking detail shows the inclusive last day.
  await expect(copy).toHaveAttribute("aria-label", /Aug 13.*Aug 18/);
  await expect(copy.locator('img[alt="Nora Vale"]')).toHaveCount(1);
  await copy.click();
  const details = page.getByRole("dialog");
  await expect(details).toContainText("Aug 17");
  await expect(details.getByText("30% of the week", { exact: true })).toBeVisible();
  await expect(
    details.getByText("Token pass and component parity ahead of the studio wide rollout.", {
      exact: true,
    }),
  ).toBeVisible();
});

test("unscheduling preserves the task and its row editor can schedule it again", async ({
  page,
}) => {
  await open(page, "gantt-1");
  const bar = page.locator('[data-slot="gantt-bar"][aria-label^="Login redirect,"]');
  await bar.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Unschedule", exact: true }).click();
  await expect(bar).toHaveCount(0);
  await expect(page.locator('[data-resource-row="login"]')).toContainText("Login redirect");
  await page.getByRole("button", { name: "Actions for Login redirect", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit Task", exact: true }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Login redirect");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(bar).toHaveCount(1);
});

test("a cleared playbook stage can run again without losing its definition", async ({ page }) => {
  await open(page, "gantt-3");
  const attempts = page.locator('[data-slot="gantt-bar"]').filter({ hasText: "Capture Refund" });
  await expect(attempts.first()).toBeVisible();
  const actions = page.getByRole("button", { name: "Actions for Capture Refund", exact: true });
  await actions.click();
  await page.getByRole("menuitem", { name: "Clear Stage", exact: true }).click();
  await expect(attempts).toHaveCount(0);
  await actions.click();
  await page.getByRole("menuitem", { name: "Re-run Stage", exact: true }).click();
  await expect(attempts).toHaveCount(1);
  await actions.click();
  await page.getByRole("menuitem", { name: "Open Stage", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Capture Refund");
});
