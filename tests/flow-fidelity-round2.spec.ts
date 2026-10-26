import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, id: string) {
  await page.goto(`./#/preview/application/flow/${id}`);
  await expect(page.locator(".flow-fidelity-node").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function model(page: Page, value: string) {
  await page.getByRole("combobox", { name: "Model", exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}
async function actions(page: Page, name: string) {
  await page.getByRole("button", { name: "Agent actions", exact: true }).click();
  await page.getByRole("menuitem", { name, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

for (const width of [1440, 390]) {
  for (const id of ["flow-1", "flow-2"]) {
    test(`${id} at ${width} consumes real Frame panels and retains exact node sizes`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, id);
      const nodes = page.locator(".flow-fidelity-node");
      await expect(nodes).toHaveCount(id === "flow-1" ? 5 : 9);
      const metrics = await nodes.first().evaluate((node) => {
        const panel = node.querySelector('[data-slot="frame-panel"]')!;
        const style = getComputedStyle(panel);
        return {
          width: node.clientWidth + 2,
          height: node.clientHeight + 2,
          border: style.borderTopWidth,
          radius: style.borderRadius,
          background: style.backgroundColor,
          visibleShadow:
            style.boxShadow !== "none" &&
            !style.boxShadow
              .split(/,(?![^()]*\))/)
              .every((layer) => /^rgba\([^)]*,\s*0\)/.test(layer.trim())),
          tile: !!panel.querySelector('[data-slot="icon-tile"]'),
          footer: !!panel.querySelector('[data-slot="frame-panel-footer"]'),
        };
      });
      expect(metrics).toMatchObject({
        width: id === "flow-1" ? 240 : 256,
        height: id === "flow-1" ? 83 : 79,
        border: "1px",
        radius: "10px",
        visibleShadow: false,
        tile: true,
        footer: true,
      });
      expect(metrics.background).not.toBe("transparent");
      expect(metrics.background).not.toBe("rgba(0, 0, 0, 0)");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      if (id === "flow-1")
        await expect(nodes.first().locator('[data-slot="badge"]')).toHaveText("Success");
    });
  }
}

test("agent test reports the observed failed fixture immediately without a pause workflow", async ({
  page,
}) => {
  await open(page, "flow-2");
  await page.getByRole("button", { name: "Run test", exact: true }).click();
  await expect(page.getByText("Test failed", { exact: true })).toBeVisible();
  await expect(
    page.getByText("4 passed, 1 failed, 4 skipped, 0 unconnected.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run test", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: /^(Pause|Resume)$/ })).toHaveCount(0);
  await expect(page.locator('[data-flow-node="email"]')).toContainText("Bounced");
  await expect(page.locator(".flow-fidelity-run-skipped")).toHaveCount(4);
});

test("changing models clears all results and toast Undo restores the prior model and its run", async ({
  page,
}) => {
  await open(page, "flow-2");
  await model(page, "Opus 5");
  await expect(page.locator(".flow-fidelity-node-duration")).toHaveText(
    Array(9).fill("No test run yet"),
  );
  await page.getByRole("button", { name: "Run test", exact: true }).click();
  await expect(page.locator('[data-flow-node="model"]')).toContainText("1,768 tokens");
  await expect(page.locator('[data-flow-node="model"]')).toContainText("USD 0.050");
  await model(page, "Haiku 4.5");
  const notice = page
    .locator("[data-sonner-toast]")
    .filter({ hasText: "Claude Haiku 4.5. Last run cleared." });
  await notice.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Model", exact: true })).toContainText("Opus 5");
  await expect(page.locator('[data-flow-node="model"]')).toContainText("1,768 tokens");
});

test("agent menu matches the reference and restoring resets model viewport while keeping the open inspector", async ({
  page,
}) => {
  await open(page, "flow-2");
  await model(page, "Haiku 4.5");
  await page
    .locator('[data-flow-node="query"]')
    .getByRole("button", { name: "Actions for Neon", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "View details", exact: true }).click();
  await page.getByRole("button", { name: "Agent actions", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Clear results",
    "Restore sample",
    "Copy as JSON",
  ]);
  await page.getByRole("menuitem", { name: "Restore sample", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Model", exact: true })).toContainText(
    "Sonnet 5",
  );
  await expect(page.getByRole("complementary")).toBeVisible();
  await expect(page.getByRole("complementary")).toContainText("Neon");
  await expect(page.getByRole("button", { name: "Zoom level 100%", exact: true })).toBeVisible();
});

for (const id of ["flow-1", "flow-2"]) {
  test(`${id} cancelling an edit closes the entire inspector and does not save`, async ({
    page,
  }) => {
    await open(page, id);
    await page.locator(`[data-flow-node="${id === "flow-1" ? "form" : "trigger"}"]`).dblclick();
    if (id === "flow-1") await page.getByRole("button", { name: "Edit step", exact: true }).click();
    await page.getByLabel("Title", { exact: true }).fill("Discarded review title");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(
      page.locator(".flow-fidelity-node").filter({ hasText: "Discarded review title" }),
    ).toHaveCount(0);
  });
}

test("branch editor persists its created step on cancel and saves an incoming Path label", async ({
  page,
}) => {
  await open(page, "flow-2");
  const triage = page.locator('[data-flow-node="model"]');
  await triage.getByRole("button", { name: "Actions for Claude Sonnet 5", exact: true }).click();
  await page.getByRole("menuitem", { name: "Add branch", exact: true }).click();
  await expect(page.getByLabel("Path", { exact: true })).toHaveValue("New path");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".flow-fidelity-node")).toHaveCount(10);
  const created = page.locator(".flow-fidelity-node").filter({ hasText: "New step" });
  await created.getByRole("button", { name: "Actions for New step", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit step", exact: true }).click();
  await page.getByLabel("Path", { exact: true }).fill("Escalated");
  await page.getByRole("button", { name: "Save step", exact: true }).click();
  await expect(page.locator(".react-flow__edge").filter({ hasText: "Escalated" })).toHaveCount(1);
  await expect(page.locator(".flow-fidelity-node-duration")).toHaveText(
    Array(10).fill("No test run yet"),
  );
});

test("saving an agent step clears run results and Undo restores both title and results", async ({
  page,
}) => {
  await open(page, "flow-2");
  const node = page.locator('[data-flow-node="trigger"]');
  await node.dblclick();
  await page.getByLabel("Title", { exact: true }).fill("Stripe review");
  await page.getByRole("button", { name: "Save step", exact: true }).click();
  await expect(node).toContainText("Stripe review");
  await expect(page.locator(".flow-fidelity-node-duration")).toHaveText(
    Array(9).fill("No test run yet"),
  );
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Step updated" });
  await toast.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(node).not.toContainText("Stripe review");
  await expect(node).toContainText("inv_9412");
});

test("clear results leaves editable graph intact and Tidy resets the sample viewport", async ({
  page,
}) => {
  await open(page, "flow-2");
  await actions(page, "Clear results");
  await expect(page.locator(".flow-fidelity-node")).toHaveCount(9);
  await expect(page.locator(".flow-fidelity-node-duration")).toHaveText(
    Array(9).fill("No test run yet"),
  );
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Tidy tree", exact: true }).click();
  await expect(page.getByRole("button", { name: "Zoom level 100%", exact: true })).toBeVisible();
  await expect(page.locator(".react-flow__viewport")).toHaveAttribute(
    "style",
    "transform: translate(272px, 45px) scale(1);",
  );
});

for (const id of ["flow-1", "flow-2"]) {
  test(`${id} phone detail edit cancellation returns to the canvas`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await open(page, id);
    const node = page.locator(`[data-flow-node="${id === "flow-1" ? "form" : "trigger"}"]`);
    if (id === "flow-1") {
      await node.click();
      await page.getByRole("button", { name: "View Form submitted", exact: true }).click();
    } else {
      await node.getByRole("button", { name: "Actions for Stripe", exact: true }).click();
      await page.getByRole("menuitem", { name: "View details", exact: true }).click();
    }
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAttribute("data-slot", "sheet-content");
    await dialog.getByRole("button", { name: "Edit step", exact: true }).click();
    await page.getByLabel("Title", { exact: true }).fill("Discarded phone edit");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(node).not.toContainText("Discarded phone edit");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
}

test("workflow menu offers the observed canvas and selection actions", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "flow-1");
  await page.getByRole("button", { name: "Workflow actions", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Reset layout",
    "Select all steps",
    "Copy as JSON",
  ]);
  await expect(
    page.getByRole("menuitemcheckbox", { name: "Snap to grid", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("menuitem", { name: "Select all steps", exact: true }).click();
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(5);
  await page.getByRole("button", { name: "Workflow actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Copy as JSON", exact: true }).click();
  const graph = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  expect(graph.nodes).toHaveLength(5);
  expect(graph.edges).toHaveLength(4);
});

test("agent trigger cannot be deleted and another step uses the reference confirmation", async ({
  page,
}) => {
  await open(page, "flow-2");
  await page.locator('[data-flow-node="trigger"]').click();
  await expect(page.locator('.react-flow__node[data-id="trigger"]')).toHaveClass(/selected/);
  await page.keyboard.press("Delete");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.locator(".flow-fidelity-node")).toHaveCount(9);
  await page.getByRole("button", { name: "Actions for Stripe", exact: true }).first().click();
  await expect(page.getByRole("menuitem")).toHaveText(["View details", "Edit step", "Add branch"]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Actions for Claude Sonnet 5", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "View details",
    "Edit step",
    "Add branch",
    "Delete",
  ]);
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  const confirmation = page.getByRole("alertdialog", { name: "Delete Step?", exact: true });
  await expect(confirmation).toContainText("Claude Sonnet 5 and 4 connections are removed.");
  await expect(
    confirmation.getByRole("button", { name: "Delete Step", exact: true }),
  ).toHaveAttribute("data-variant", "destructive");
  await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".flow-fidelity-node")).toHaveCount(9);
});
