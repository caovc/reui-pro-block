import { expect, test, type Page } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

async function selectRunView(page: Page, width: number, view: string) {
  if (width === 390) {
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "AgentOps navigation", exact: true });
    const runs = drawer.getByRole("button", { name: "Runs", exact: true });
    if ((await runs.getAttribute("aria-expanded")) === "false") await runs.click();
    await drawer.getByRole("button", { name: view, exact: true }).click();
    await expect(drawer).toHaveCount(0);
  } else {
    await page
      .locator(".wf-native-navigation")
      .getByRole("button", { name: view, exact: true })
      .click();
  }
}

for (const width of [1440, 390]) {
  test(`Flux Run Queue ${width}: real grouping, intersecting filters, CSV and row action Undo`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto("/#/template-preview/flux/runs/all-runs");
    await expect(page).toHaveTitle("Bricklane — Blocks & Templates");
    const screen = page.locator(".flux-queue-page");
    await expect(
      screen.getByRole("heading", { level: 1, name: "Run Queue", exact: true }),
    ).toBeVisible();
    await expect(screen.locator(".flux-queue-run-cell button")).toHaveCount(12);
    await expect(screen.locator(".flux-queue-group-cell")).toHaveCount(5);
    await page.screenshot({ path: info.outputPath(`queue-initial-${width}.png`) });
    await screen.getByRole("button", { name: "Collapse all", exact: true }).click();
    await expect(screen.locator(".flux-queue-run-cell button")).toHaveCount(0);
    const invoiceGroup = screen
      .locator("tbody tr")
      .filter({ has: page.locator('[data-queue-group="Invoice Reconciler"]') });
    await invoiceGroup.getByRole("button", { name: "Expand row", exact: true }).click();
    await expect(screen.locator(".flux-queue-run-cell button")).toHaveCount(3);
    await screen.getByRole("button", { name: "Expand all", exact: true }).click();
    await expect(screen.locator(".flux-queue-run-cell button")).toHaveCount(12);
    const grouping = screen.getByLabel("Group queue runs", { exact: true });
    await grouping.getByText("Status", { exact: true }).click();
    await expect(screen.locator(".flux-queue-group-cell")).toHaveCount(6);
    await grouping.getByText("None", { exact: true }).click();
    await expect(screen.locator(".flux-queue-group-cell")).toHaveCount(0);
    await expect(screen.locator(".flux-queue-run-cell button")).toHaveCount(12);
    await grouping.getByText("Agent", { exact: true }).click();
    await screen.getByRole("textbox", { name: "Search queue", exact: true }).fill("CONTRACT");
    await screen.getByRole("combobox", { name: "Filter queue by status", exact: true }).click();
    await page.getByRole("option", { name: "Failed", exact: true }).click();
    await screen.getByRole("checkbox", { name: "Needs attention", exact: true }).check();
    await expect(screen.locator(".flux-queue-footer")).toContainText("1 of 12 runs");
    await expect(
      screen.getByRole("button", { name: "Verify the Finch contract attachments", exact: true }),
    ).toBeVisible();
    const pending = page.waitForEvent("download");
    await screen.getByRole("button", { name: "Export filtered", exact: true }).click();
    const download = await pending;
    const artifact = info.outputPath("queue-filtered.csv");
    await download.saveAs(artifact);
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe("flux-run-queue.csv");
    const csv = await readFile(artifact, "utf8");
    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).toContain('"LOCAL-QUEUE-3105","Verify the Finch contract attachments"');
    await screen
      .getByRole("textbox", { name: "Search queue", exact: true })
      .fill("no matching queue record");
    await expect(screen.getByText("No matching runs", { exact: true })).toBeVisible();
    await screen.getByRole("button", { name: "Clear filters", exact: true }).first().click();
    await expect(screen.locator(".flux-queue-run-cell button")).toHaveCount(12);
    const task = page.getByRole("button", {
      name: "Prepare the Arbor weekly invoice digest",
      exact: true,
    });
    const row = screen.getByRole("row").filter({ has: task });
    await row.getByRole("button", { name: "Actions for LOCAL-QUEUE-3101", exact: true }).click();
    await page.getByRole("menuitem", { name: "Hold run", exact: true }).click();
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(row.getByRole("cell", { name: "Held", exact: true })).toBeVisible();
    await page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Run held" })
      .getByRole("button", { name: "Undo", exact: true })
      .click();
    await expect(row.getByRole("cell", { name: "Queued", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
    await writeFile(info.outputPath("console.json"), JSON.stringify({ errors }, null, 2));
    expect(errors).toEqual([]);
  });

  test(`Flux Run Queue ${width}: native inspector, explicit save, attention and cancelled simulation Undo`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/#/template-preview/flux/runs/all-runs");
    const opener = page.getByRole("button", { name: "Actions for LOCAL-QUEUE-3101", exact: true });
    await opener.press("Enter");
    await page.getByRole("menuitem", { name: "Review run", exact: true }).press("Enter");
    const review = page.getByRole("dialog", { name: "Queue run", exact: true });
    await expect(review).toBeVisible();
    const identity = review.locator(".flux-queue-identity");
    const status = identity.locator("> div [data-slot=badge]");
    await review.getByRole("tab", { name: "Activity", exact: true }).click();
    await expect(review.locator('[data-slot="timeline-item"]')).toHaveCount(1);
    await review.getByRole("tab", { name: "Details", exact: true }).click();
    await review
      .getByRole("textbox", { name: "Task", exact: true })
      .fill("Prepared Arbor weekly invoice digest");
    await review
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill("Confirmed the preview batch details.");
    await expect(review.getByRole("button", { name: "Start run", exact: true })).toBeDisabled();
    await review.getByRole("button", { name: "Save details", exact: true }).click();
    await expect(identity.getByRole("heading", { level: 2 })).toHaveText(
      "Prepared Arbor weekly invoice digest",
    );
    await review
      .getByRole("alert")
      .filter({ hasText: "Run details saved" })
      .getByRole("button", { name: "Undo", exact: true })
      .click();
    await expect(identity.getByRole("heading", { level: 2 })).toHaveText(
      "Prepare the Arbor weekly invoice digest",
    );
    await review.getByRole("checkbox", { name: "Needs attention", exact: true }).check();
    await review
      .getByRole("textbox", { name: "Review reason", exact: true })
      .fill("Check the authored handover before starting.");
    await review.getByRole("button", { name: "Save details", exact: true }).click();
    await review.getByRole("tab", { name: "Overview", exact: true }).click();
    await review.getByRole("button", { name: "Copy run ID", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("LOCAL-QUEUE-3101");
    await expect(
      review.getByRole("alert").filter({ hasText: "Check the authored handover" }),
    ).toBeVisible();
    await review.getByRole("button", { name: "Mark reviewed", exact: true }).click();
    await expect(
      review.getByRole("alert").filter({ hasText: "Check the authored handover" }),
    ).toHaveCount(0);
    await review
      .getByRole("alert")
      .filter({ hasText: "Attention cleared" })
      .getByRole("button", { name: "Undo", exact: true })
      .click();
    await expect(
      review.getByRole("alert").filter({ hasText: "Check the authored handover" }),
    ).toBeVisible();
    await review.getByRole("button", { name: "Mark reviewed", exact: true }).click();
    await review.getByRole("button", { name: "Start run", exact: true }).click();
    await expect(status).toHaveText("Running");
    await review.getByRole("button", { name: "Cancel run", exact: true }).click();
    await expect(status).toHaveText("Cancelled");
    await review
      .getByRole("alert")
      .filter({ hasText: "Run cancelled" })
      .getByRole("button", { name: "Undo", exact: true })
      .click();
    await expect(status).toHaveText("Succeeded");
    await review.getByRole("tab", { name: "Activity", exact: true }).click();
    await expect(review.locator('[data-slot="timeline-item"]').last()).toContainText("Succeeded");
    await page.screenshot({ path: info.outputPath(`queue-review-${width}.png`) });
    await page.keyboard.press("Escape");
    await expect(review).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(errors).toEqual([]);
  });

  test(`Flux Run Queue ${width}: create validation, retained tree and opaque browser history`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto("/#/template-preview/flux/runs/all-runs?opaque=a%2Fb+z");
    const screen = page.locator(".flux-queue-page");
    await screen
      .getByRole("textbox", { name: "Search queue", exact: true })
      .fill("nothing matches");
    await screen.getByRole("button", { name: "Queue a run", exact: true }).click();
    const form = page.getByRole("dialog", { name: "Queue a run", exact: true });
    await form.getByRole("button", { name: "Add to queue", exact: true }).click();
    await expect(form.getByRole("textbox", { name: "Task", exact: true })).toBeFocused();
    await form
      .getByRole("textbox", { name: "Task", exact: true })
      .fill("Queue a local handover check");
    await form.getByRole("checkbox", { name: "Needs attention", exact: true }).check();
    await form.getByRole("button", { name: "Add to queue", exact: true }).click();
    await expect(form.getByRole("textbox", { name: "Review reason", exact: true })).toBeFocused();
    await expect(form.getByText("Explain what needs review.", { exact: true })).toBeVisible();
    await form
      .getByRole("textbox", { name: "Review reason", exact: true })
      .fill("The owner needs to confirm this local handover.");
    await form.getByRole("button", { name: "Add to queue", exact: true }).click();
    await expect(form).toHaveCount(0);
    await expect(
      screen.getByRole("button", { name: "Queue a local handover check", exact: true }),
    ).toBeVisible();
    await expect(screen.locator(".flux-queue-footer")).toContainText("13 of 13 runs");
    await selectRunView(page, width, "Run tree");
    await expect(page).toHaveURL(/\/runs\?opaque=a%2Fb\+z$/);
    await expect(page.locator(".wf-run-tree")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/runs\/all-runs\?opaque=a%2Fb\+z$/);
    await expect(screen.locator(".flux-queue-footer")).toContainText("13 of 13 runs");
    await selectRunView(page, width, "Failures");
    await expect(page.locator(".flux-failures-page")).toBeVisible();
    await page.goBack();
    await expect(
      screen.getByRole("button", { name: "Queue a local handover check", exact: true }),
    ).toBeVisible();
    await page.goForward();
    await expect(page.locator(".flux-failures-page")).toBeVisible();
  });
}

test("Flux Run Queue: wrapped all-runs mount and retained tree are separate rendered pages", async ({
  page,
}) => {
  await page.goto("/#/templates/flux/runs/all-runs");
  await expect(page.locator(".flux-queue-page")).toBeVisible();
  await expect(page.locator(".wf-run-tree")).toHaveCount(0);
  await page.goto("/#/templates/flux/runs");
  await expect(page.locator(".wf-run-tree")).toBeVisible();
  await expect(page.locator(".flux-queue-page")).toHaveCount(0);
});
