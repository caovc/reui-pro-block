import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function open(page: Page, id: number) {
  await page.goto(`./#/preview/ai-agents/ai-usage/ai-usage-${id}`);
  await expect(page.locator('[data-slot="frame"]').first()).toBeVisible();
}
const observed = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  observed.set(page, errors);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 950 });
});
test.afterEach(async ({ page }) => expect(observed.get(page)).toEqual([]));

test("planner graduated quote, annual reduction, nonlinear ruler and reset reflect actual state", async ({
  page,
}) => {
  await open(page, 1);
  await expect(page.locator("p[aria-live]").filter({ hasText: "$1,207" })).toBeVisible();
  await page.getByRole("switch", { name: "Annual commit", exact: true }).check();
  await expect(page.locator("p[aria-live]").filter({ hasText: "$1,062" })).toBeVisible();
  await page.getByRole("radio", { name: "GPT-5.1 mini", exact: true }).check();
  await expect(page.locator("p[aria-live]").filter({ hasText: "$188" })).toBeVisible();
  const slider = page.getByRole("slider", { name: "Tokens per month", exact: true });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuetext", "1,000,000 tokens");
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Reset plan", exact: true }).click();
  await expect(page.locator("p[aria-live]").filter({ hasText: "$1,207" })).toBeVisible();
  await page.getByRole("button", { name: "Save Plan", exact: true }).click();
  await expect(page.getByRole("button", { name: "Plan saved", exact: true })).toBeVisible();
});

test("spend dimensions preserve workspace total while token ranking changes and inspector answers locally", async ({
  page,
}) => {
  await open(page, 2);
  await page.getByRole("button", { name: /^Teams 4 Engineering/ }).click();
  await expect(page.getByRole("heading", { name: "Engineering", exact: true })).toBeVisible();
  await expect(page.getByText("98% of $600 cap, projected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Models 5 Claude/ }).click();
  await page.getByRole("radio", { name: "Tokens", exact: true }).click();
  const items = page.getByLabel("Models items", { exact: true });
  await expect(items.getByRole("button").first()).toContainText("GPT-5.1 mini");
  await page.getByRole("button", { name: "Where to save?", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("cache repeated prompts");
  const slider = page.getByRole("slider", { name: "Claude Sonnet 5 spend by day", exact: true });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "1");
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export CSV", exact: true }).click();
  const csv = await readFile((await (await download).path())!, "utf8");
  const rows = csv.trim().split("\n");
  expect(rows).toHaveLength(6);
  expect(csv).toContain("382");
  expect(csv).toContain("Claude Sonnet 5");
});

test("edge hardware lid, part inspector, watt cap, deployment and offline gate work", async ({
  page,
}) => {
  await open(page, 3);
  await page.getByRole("button", { name: "Close lid", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open lid", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open lid", exact: true }).click();
  await page
    .getByRole("group", { name: "Bricklane edge inference box, lid open", exact: true })
    .getByRole("button", { name: "Memory", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("16 GB unified memory");
  await page.keyboard.press("Escape");
  await page.getByRole("combobox", { name: "Power budget", exact: true }).click();
  await page.getByRole("option", { name: "15 W", exact: true }).click();
  await page.getByRole("tab", { name: "Power", exact: true }).click();
  await expect(page.getByText("12 W of a 15 W cap", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Deploy", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Deploy model", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Receipt Reader");
  await page.getByRole("combobox", { name: "Node", exact: true }).click();
  await page.getByRole("option", { name: "ams-core-01", exact: true }).click();
  await expect(page.getByRole("button", { name: "Deploy", exact: true })).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("Node is offline");
  await page.getByRole("combobox", { name: "Node", exact: true }).click();
  await page.getByRole("option", { name: "lis-alv-01", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Power budget", exact: true })).toHaveText(
    "15 W",
  );
  await expect(page.getByRole("tabpanel")).toContainText("Receipt Reader");
});

test("local model memory overflow blocks apply, fit and discard restore states, config downloads draft", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, 4);
  await page.getByRole("radio", { name: "BF16", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Doesn't fit on GPUs");
  await expect(page.getByRole("button", { name: "Apply", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Fit to GPUs", exact: true }).click();
  await expect(page.getByRole("button", { name: "Apply", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(page.getByRole("button", { name: "Apply", exact: true })).toBeDisabled();
  const slider = page.getByRole("slider", { name: "Parallel requests", exact: true });
  await expect(slider).not.toHaveAttribute("aria-valuetext", /.+/);
  await slider.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveAttribute("aria-valuenow", "7");
  await page.getByRole("button", { name: "Copy Config", exact: true }).click();
  const copied = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  expect(copied.models[0].parallel).toBe(7);
  await page.getByRole("button", { name: "Server actions", exact: true }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Download Config", exact: true }).click();
  expect(JSON.parse(await readFile((await (await dl).path())!, "utf8"))).toEqual(copied);
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByRole("button", { name: "No pending changes", exact: true })).toBeVisible();
});

test("all four dedicated usage surfaces fit a narrow viewport with working native controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const id of [1, 2, 3, 4]) {
    await open(page, id);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await expect(page.locator('[data-slot="frame-panel"]').first()).toBeVisible();
  }
});
