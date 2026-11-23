import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

for (const width of [1440, 390]) {
  test(`Flux failures ${width}: filters, editable review, retry history and undo`, async ({
    page,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") faults.push(message.text());
    });
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/#/template-preview/flux/runs/failures");
    await expect(page).toHaveTitle("Bricklane — Blocks & Templates");
    await expect(page).toHaveURL(/#\/template-preview\/flux\/runs\/failures$/);
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
    const screen = page.locator(".flux-failures-page");
    await expect(screen.getByRole("heading", { level: 1, name: /^Failures/ })).toBeVisible();
    await page.screenshot({ path: info.outputPath(`flux-failures-initial-${width}.png`) });
    await screen.getByRole("button", { name: "Go to next page", exact: true }).click();
    await expect(screen.getByText("7–8 of 8", { exact: true })).toBeVisible();
    await screen.getByRole("button", { name: "Go to previous page", exact: true }).click();
    await expect(screen.getByText("1–6 of 8", { exact: true })).toBeVisible();
    await screen
      .getByRole("button", { name: "Choose visible failure columns", exact: true })
      .click();
    await page.getByRole("menuitemcheckbox", { name: "Owner", exact: true }).click();
    await expect(screen.getByRole("columnheader", { name: "Owner", exact: true })).toHaveCount(0);
    await page.getByRole("menuitemcheckbox", { name: "Owner", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(screen.getByRole("columnheader", { name: "Owner", exact: true })).toBeVisible();
    const runSort = screen.getByRole("button", { name: "Run / task", exact: true });
    await runSort.click();
    await expect(screen.locator("tbody .flux-failure-run button").first()).toHaveText(
      "Deliver the weekly account summary to demo subscribers",
    );
    await runSort.click();
    await expect(screen.locator("tbody .flux-failure-run button").first()).toHaveText(
      "Validate the imported contact batch for Alder Studio",
    );
    await runSort.click();
    await expect(screen.locator("tbody .flux-failure-run button").first()).toHaveText(
      "Review the duplicate renewal refund for Northstar Labs",
    );
    await screen.getByRole("textbox", { name: "Search failures" }).fill("CEDAR");
    await screen.getByRole("combobox", { name: "Filter by error type" }).click();
    await page.getByRole("option", { name: "Gateway", exact: true }).click();
    await screen.getByRole("combobox", { name: "Filter by agent" }).click();
    await page.getByRole("option", { name: "Invoice Reconciler", exact: true }).click();
    await expect(screen.getByText("1 of 8 records", { exact: true })).toBeVisible();
    await expect(
      screen.getByRole("button", {
        name: "Match outstanding invoices for Cedar Works",
        exact: true,
      }),
    ).toBeVisible();
    const pendingExport = page.waitForEvent("download");
    await screen.getByRole("button", { name: "Export filtered", exact: true }).click();
    const csvDownload = await pendingExport;
    const csvPath = info.outputPath("filtered-failures.csv");
    await csvDownload.saveAs(csvPath);
    expect(await csvDownload.failure()).toBeNull();
    expect(csvDownload.suggestedFilename()).toBe("flux-failures.csv");
    const csv = await readFile(csvPath, "utf8");
    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).toContain('"Run","Task","Status","Agent","Owner"');
    expect(csv).toContain('"LOCAL-RUN-2106","Match outstanding invoices for Cedar Works"');
    await screen.getByRole("textbox", { name: "Search failures" }).fill("no matching record");
    await expect(screen.getByText("No matching failures", { exact: true })).toBeVisible();
    await screen.getByRole("button", { name: "Clear filters", exact: true }).first().click();
    await expect(screen.getByText("8 of 8 records", { exact: true })).toBeVisible();
    await screen
      .getByRole("button", {
        name: "Review the duplicate renewal refund for Northstar Labs",
        exact: true,
      })
      .click();
    const review = page.getByRole("dialog", { name: "Run review", exact: true });
    await expect(review).toBeVisible();
    await page.screenshot({ path: info.outputPath(`flux-failure-review-${width}.png`) });
    await review.getByRole("tab", { name: "Attempts", exact: true }).click();
    await expect(review.locator('[data-slot="timeline-item"]')).toHaveCount(3);
    await review.getByRole("tab", { name: "Payload", exact: true }).click();
    await review.getByRole("textbox", { name: "JSON object", exact: true }).fill("[]");
    await review.getByRole("button", { name: "Save payload", exact: true }).click();
    await expect(
      review.getByText("Enter a JSON object, or leave the payload empty.", { exact: true }),
    ).toBeVisible();
    await expect(review.getByRole("button", { name: "Retry run", exact: true })).toBeDisabled();
    await review
      .getByRole("textbox", { name: "JSON object", exact: true })
      .fill('{"account":"northstar-labs","reviewed":true}');
    await review.getByRole("button", { name: "Save payload", exact: true }).click();
    await expect(review.getByRole("button", { name: "Save payload", exact: true })).toBeDisabled();
    await review.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(async () => JSON.parse(await page.evaluate(() => navigator.clipboard.readText())))
      .toEqual({ account: "northstar-labs", reviewed: true });
    await review.getByRole("tab", { name: "Details", exact: true }).click();
    await review
      .getByRole("textbox", { name: "Task", exact: true })
      .fill("Reviewed Northstar renewal refund");
    await review
      .getByRole("textbox", { name: "Triage notes", exact: true })
      .fill("Checked the existing renewal request.");
    await review.getByRole("button", { name: "Save details", exact: true }).click();
    await expect(
      review.locator(".flux-failure-identity").getByRole("heading", { level: 2 }),
    ).toHaveText("Reviewed Northstar renewal refund");
    await review.getByRole("button", { name: "Retry run", exact: true }).click();
    await expect(review.locator(".flux-failure-identity [data-slot=badge]")).toHaveText("Retrying");
    await review.getByRole("tab", { name: "Attempts", exact: true }).click();
    await expect(review.locator('[data-slot="timeline-item"]')).toHaveCount(4);
    await expect(review.locator(".flux-failure-identity [data-slot=badge]")).toHaveText("Failed");
    await expect(review.locator('[data-slot="timeline-item"]').last()).toContainText(
      "Manual retry",
    );
    await expect(review.locator('[data-slot="timeline-item"]').last()).toContainText(
      "409 refund_conflict",
    );
    await page.screenshot({ path: info.outputPath(`flux-failure-attempts-${width}.png`) });
    await review.getByRole("button", { name: "Dismiss", exact: true }).click();
    await expect(review.locator(".flux-failure-identity [data-slot=badge]")).toHaveText(
      "Dismissed",
    );
    await review
      .getByRole("alert")
      .filter({ hasText: "Run dismissed" })
      .getByRole("button", { name: "Undo", exact: true })
      .click();
    await expect(review.locator(".flux-failure-identity [data-slot=badge]")).toHaveText("Failed");
    await review.getByRole("button", { name: "Delete LOCAL-RUN-2108", exact: true }).click();
    await expect(review).toHaveCount(0);
    await expect(screen.getByRole("textbox", { name: "Search failures" })).toBeFocused();
    await expect(screen.getByText("7 of 7 records", { exact: true })).toBeVisible();
    await page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Failure removed" })
      .getByRole("button", { name: "Undo", exact: true })
      .click();
    await expect(
      screen.getByRole("button", { name: "Reviewed Northstar renewal refund", exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({ path: info.outputPath(`flux-failures-${width}.png`) });
    expect(faults).toEqual([]);
  });

  test(`Flux failures ${width}: create validation, distinct route and browser history`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto("/#/template-preview/flux/runs/failures?opaque=a%2Fb+z");
    const screen = page.locator(".flux-failures-page");
    await screen.getByRole("textbox", { name: "Search failures" }).fill("no match");
    await screen.getByRole("button", { name: "Log failure", exact: true }).click();
    const form = page.getByRole("dialog", { name: "Log a failure", exact: true });
    await form.getByRole("button", { name: "Log failure", exact: true }).click();
    await expect(form.getByRole("textbox", { name: "Task", exact: true })).toBeFocused();
    await expect(form.getByText("Enter a value.", { exact: true })).toHaveCount(3);
    await form
      .getByRole("textbox", { name: "Task", exact: true })
      .fill("Review an imported local invoice");
    await form
      .getByRole("textbox", { name: "Error message", exact: true })
      .fill("The invoice fixture could not be read.");
    await form.getByRole("textbox", { name: "Failed step", exact: true }).fill("invoices.read");
    await form.getByRole("button", { name: "Log failure", exact: true }).click();
    await expect(form).toHaveCount(0);
    await expect(
      screen.getByRole("button", { name: "Review an imported local invoice", exact: true }),
    ).toBeVisible();
    await expect(screen.getByText("9 of 9 records", { exact: true })).toBeVisible();
    if (width === 390)
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await page
      .locator(".wf-native-navigation")
      .getByRole("button", { name: "All runs", exact: true })
      .click();
    await expect(page).toHaveURL(/\/runs\/all-runs\?opaque=a%2Fb\+z$/);
    await expect(page.locator(".wf-run-tree")).toBeVisible();
    await page.goBack();
    await expect(screen).toBeVisible();
    await expect(
      screen.getByRole("button", { name: "Review an imported local invoice", exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/runs\/failures\?opaque=a%2Fb\+z$/);
  });
}

test("Flux failures: wrapped template mount reaches the same working implementation", async ({
  page,
}) => {
  await page.goto("/#/templates/flux/runs/failures");
  await expect(page.locator(".flux-failures-page")).toBeVisible();
  await expect(page.getByRole("button", { name: "Log failure", exact: true })).toBeVisible();
});
