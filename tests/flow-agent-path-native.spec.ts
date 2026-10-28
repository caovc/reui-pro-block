import { expect, test, type Page } from "@playwright/test";

const PATH_HELP_TEXT = "The caption on the connector above, naming this outcome.";

// Nine seeded steps render fourteen result fragments before a save clears them.
const ORIGINAL_RUN_RESULTS = [
  { id: "trigger", parts: ["inv_9412", "EUR 4,180"], status: "succeeded" },
  { id: "query", parts: ["1 row", "42ms"], status: "succeeded" },
  { id: "model", parts: ["1,842 tokens", "USD 0.031"], status: "succeeded" },
  { id: "guard", parts: ["Branch not taken"], status: "skipped" },
  { id: "plan", parts: ["3 instalments", "EUR 1,393"], status: "succeeded" },
  { id: "dispute", parts: ["Branch not taken"], status: "skipped" },
  { id: "slack", parts: ["Upstream skipped"], status: "skipped" },
  { id: "email", parts: ["Bounced", "Retry queued"], status: "failed" },
  { id: "assign", parts: ["Upstream skipped"], status: "skipped" },
] as const;

async function expectOriginalRunResults(page: Page) {
  await expect(page.locator(".flow-fidelity-node")).toHaveCount(ORIGINAL_RUN_RESULTS.length);
  await expect(page.locator(".flow-fidelity-node-duration")).toHaveText(
    ORIGINAL_RUN_RESULTS.flatMap((result) => [...result.parts]),
  );
  for (const result of ORIGINAL_RUN_RESULTS) {
    const node = page.locator(`[data-flow-node="${result.id}"]`);
    await expect(node.locator(".flow-fidelity-node-duration")).toHaveText([...result.parts]);
    await expect(node.locator(".flow-fidelity-run-state")).toHaveClass(
      `flow-fidelity-run-state flow-fidelity-run-${result.status}`,
    );
  }
}

for (const width of [1440, 390]) {
  test(`agent Path retains native focus, helper Escape, draft cancellation, edge Undo and persistence at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./#/preview/application/flow/flow-2");
    await expect(page.locator("[data-flow-variant]")).toBeVisible();

    const node = page.locator('[data-flow-node="plan"]');
    // These are the native ReactFlow EdgeWrapper test IDs for the actual graph IDs.
    const planEdge = page.getByTestId("rf__edge-model-plan");
    const guardEdge = page.getByTestId("rf__edge-model-guard");
    const disputeEdge = page.getByTestId("rf__edge-model-dispute");
    const durations = page.locator(".flow-fidelity-node-duration");
    const path = page.getByRole("textbox", { name: "Path", exact: true });
    const notice = page.locator("[data-sonner-toast]").filter({ hasText: "Step updated" });

    await expect(node).toBeVisible();
    await expectOriginalRunResults(page);
    await expect(planEdge).toContainText("Promised");
    await expect(guardEdge).toContainText("No reply");
    await expect(disputeEdge).toContainText("Disputed");
    const originalRunResults = await durations.allTextContents();

    await node.dblclick();
    await expect(path).toHaveValue("Promised");
    const field = page.locator('[data-slot="field"]').filter({ has: path });
    const label = field.locator("label", { hasText: /^Path$/ });
    const help = field.getByRole("button", { name: "About the path", exact: true });
    await expect(label).toHaveAttribute("for", (await path.getAttribute("id"))!);
    await label.click();
    await expect(path).toBeFocused();

    // Native Tab order reaches the adjacent help trigger without a focus bridge.
    await path.press("Shift+Tab");
    await expect(help).toBeFocused();
    await expect(page.getByRole("tooltip")).toHaveText(PATH_HELP_TEXT);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await expect(help).toBeFocused();
    await expect(path).toHaveValue("Promised");
    await expect(page.getByRole("button", { name: "Save step", exact: true })).toBeVisible();
    if (width === 390) {
      await expect(page.getByRole("dialog")).toBeVisible();
    }

    await path.fill("Unsaved payment plan");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(path).toHaveCount(0);
    await expect(planEdge).toContainText("Promised");
    await expect(durations).toHaveText(originalRunResults);
    await node.dblclick();
    await expect(path).toHaveValue("Promised");

    await path.fill("Reviewed payment plan");
    await page.getByRole("button", { name: "Save step", exact: true }).click();
    await expect(path).toHaveCount(0);
    await expect(planEdge).toContainText("Reviewed payment plan");
    await expect(node.locator(".flow-fidelity-node-duration")).toHaveText("No test run yet");
    // Use the short-lived native action immediately, without reopening the editor first.
    if (width === 390) {
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await notice.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(planEdge).toContainText("Promised");
    await expect(planEdge).not.toContainText("Reviewed payment plan");
    await expect(guardEdge).toContainText("No reply");
    await expect(disputeEdge).toContainText("Disputed");
    await expect(durations).toHaveText(originalRunResults);
    await expectOriginalRunResults(page);
    await node.dblclick();
    await expect(path).toHaveValue("Promised");

    // A second real save tests persistence independently of the Undo lifetime.
    await path.fill("Approved payment plan");
    await page.getByRole("button", { name: "Save step", exact: true }).click();
    await expect(path).toHaveCount(0);
    await expect(planEdge).toContainText("Approved payment plan");
    await expect(guardEdge).toContainText("No reply");
    await expect(disputeEdge).toContainText("Disputed");
    await expect(durations).toHaveText(Array(9).fill("No test run yet"));
    await page.mouse.move(0, 0);
    await expect(notice).toHaveCount(0);
    await page.getByRole("button", { name: "Edit step", exact: true }).click();
    await expect(path).toHaveValue("Approved payment plan");
    await page
      .getByRole("button", {
        name: width === 390 ? "Close" : "Close step details",
        exact: true,
      })
      .click();
    await expect(path).toHaveCount(0);
    if (width === 390) {
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  });
}
