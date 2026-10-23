import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const failures = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  failures.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(({ page }) => expect(failures.get(page)).toEqual([]));
const open = (page: Page, id: number) => page.goto(`./#/preview/chart/status-tracker/chart-${id}`);

test("Cron window/filter/sort recompute actual capsules, summary and exported rows", async ({
  page,
}) => {
  await open(page, 34);
  const list = page.getByRole("list", { name: "Cron jobs", exact: true });
  await expect(list.getByRole("listitem")).toHaveCount(7);
  await expect(list.getByRole("button")).toHaveCount(140);
  await expect(page.getByText("93.5%", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Show jobs", exact: true }).click();
  await page.getByRole("option", { name: "Failing", exact: true }).click();
  await expect(list.getByRole("listitem")).toHaveCount(3);
  await page.getByRole("button", { name: "Display options", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Last 10 Runs", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByText("88.6%", { exact: true })).toBeVisible();
  await expect(page.getByText(/22.9 pts/)).toBeVisible();
  await expect(list.getByRole("button")).toHaveCount(30);
  await page.getByRole("button", { name: "Display options", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Name", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(list.getByRole("listitem").first()).toContainText("Drain webhook retry queue");
  const capsule = list.getByRole("button", {
    name: "Import bank settlement files, run 15, Succeeded, 8m 28s",
    exact: true,
  });
  await capsule.focus();
  await expect(page.locator('[data-slot="hover-card-content"]')).toContainText("Duration 8m 28s");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export CSV", exact: true }).click();
  const csv = await readFile((await (await download).path())!, "utf8");
  expect(csv.trim().split("\n")).toHaveLength(31);
  expect(csv.split("\n")[1]).toContain("Drain webhook retry queue");
  expect(csv).toContain('"Timed Out"');
});

test("Release canary waits for explicit confirmation then updates the production version matrix", async ({
  page,
}) => {
  await page.clock.install();
  await open(page, 38);
  const production = page.locator('[data-environment="Production"]');
  await expect(production).toContainText("fraud-scorer");
  await page.clock.runFor(3000);
  await expect(production.getByText("Waiting", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Services", exact: true }).click();
  await expect(
    page
      .getByRole("list", { name: "Production versions", exact: true })
      .getByText("v3.8.2", { exact: true }),
  ).toBeVisible();
  await production.getByRole("button", { name: "Promote", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("Promote Canary?");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(production.getByText("Waiting", { exact: true })).toBeVisible();
  await production.getByRole("button", { name: "Promote", exact: true }).click();
  await dialog.getByRole("button", { name: "Promote", exact: true }).click();
  await page.clock.runFor(3500);
  await expect(production.getByText("Succeeded", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("list", { name: "Production versions", exact: true })
      .getByText("v3.9.0", { exact: true }),
  ).toBeVisible();
});

test("environment freeze Undo and cross-lane promotion enforce real gates", async ({ page }) => {
  await page.clock.install();
  await open(page, 38);
  const connector = page.getByRole("button", { name: /^Promote Staging to Sandbox,/ });
  await page.getByRole("button", { name: "Staging actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Freeze deploys", exact: true }).click();
  await expect(connector).toBeDisabled();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(connector).toBeEnabled();
  await connector.click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("Promote to Sandbox?");
  await expect(dialog).toContainText("webhook-dispatcher");
  await dialog.getByRole("button", { name: "Promote", exact: true }).click();
  const sandbox = page.locator('[data-environment="Sandbox"]');
  await expect(sandbox).toContainText("webhook-dispatcher");
  await page.clock.runFor(16500);
  await expect(sandbox.getByText("Succeeded", { exact: true })).toBeVisible();
  await expect(connector).toBeDisabled();
});

test("Deploy form creates a held canary and filtered JSON reflects the waiting state", async ({
  page,
}) => {
  await page.clock.install();
  await open(page, 39);
  await page.getByRole("button", { name: "New deploy", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: "Canary", exact: true }).click();
  await dialog.getByRole("switch", { name: "Hold for Promote", exact: true }).check();
  await dialog.getByRole("button", { name: "Deploy", exact: true }).click();
  const list = page.getByRole("list", { name: "Deploy history", exact: true });
  await expect(list.getByRole("listitem")).toHaveCount(3);
  const created = page.locator('[data-deploy-id="4129"]');
  await expect(created).toContainText("search-indexer");
  await page.clock.runFor(15000);
  await expect(created.getByText("Waiting", { exact: true })).toBeVisible();
  await page.clock.runFor(5000);
  await expect(created.getByText("Waiting", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export JSON", exact: true }).click();
  const rows = JSON.parse(await readFile((await (await download).path())!, "utf8"));
  expect(rows).toHaveLength(3);
  expect(rows[0]).toMatchObject({
    id: "DEP-4129",
    service: "search-indexer",
    environment: "Staging",
    status: "Waiting",
    completedStages: 5,
    held: true,
  });
});

test("known demo failure stops its stage and tooltip exposes the failed Test", async ({ page }) => {
  await page.clock.install();
  await open(page, 39);
  await page.getByRole("button", { name: "New deploy", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox", { name: "Service", exact: true }).click();
  await page.getByRole("option", { name: "notifications", exact: true }).click();
  await dialog.getByRole("button", { name: "Deploy", exact: true }).click();
  await page.clock.runFor(5500);
  const created = page.locator('[data-deploy-id="4129"]');
  await expect(created.getByText("Failed", { exact: true })).toBeVisible();
  const meter = created.getByRole("button", {
    name: "Failed at Test, 1 of 6 stages passed",
    exact: true,
  });
  await meter.hover();
  await page.clock.runFor(500);
  await expect(page.locator('[data-slot="hover-card-content"]')).toContainText("Test");
  expect(
    Number(
      await created
        .getByRole("progressbar", { name: "Test: Failed", exact: true })
        .getAttribute("aria-valuenow"),
    ),
  ).toBeCloseTo(60);
});

test("all three 390px layouts preserve visible status geometry without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 850 });
  for (const [id, title] of [
    [34, "Run History"],
    [38, "Environments"],
    [39, "Deploy History"],
  ] as const) {
    await open(page, id);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `chart-${id}`,
    ).toBe(true);
    if (id === 34)
      await expect(
        page.getByRole("list", { name: "Cron jobs", exact: true }).getByRole("button"),
      ).toHaveCount(140);
    else await expect(page.getByRole("progressbar").first()).toBeVisible();
  }
});
