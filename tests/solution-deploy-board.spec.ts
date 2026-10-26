import { expect, test } from "@playwright/test";

const route = "/#/preview/solutions/dev-ops/solution-dev-ops-7";
const release = (page: import("@playwright/test").Page, id: string) =>
  page.getByRole("button", { name: new RegExp(`^Open ${id},`) });

test("deploy wall keeps twelve independent releases and six desktop columns", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(route);
  const table = page.getByRole("table", { name: "Deploys", exact: true });
  await expect(table.getByRole("columnheader")).toHaveCount(6);
  await expect(page.getByRole("button", { name: /^Open BLD-/ })).toHaveCount(12);
  await expect(release(page, "BLD-2041")).toHaveAttribute("aria-label", /Failed/);
  await expect(release(page, "BLD-2050")).toHaveAttribute("aria-label", /Needs approval/);
  const bounds = await page.locator(".deploy-board-frame").boundingBox();
  expect(bounds?.width).toBe(1288);
  expect(bounds?.x).toBe(76);
  const region = table.locator(".deploy-region > .deploy-flap").first();
  await expect(region).toHaveAttribute("aria-label", "us-east-1");
  expect((await region.boundingBox())!.width).toBeGreaterThan(80);
  expect(
    await region
      .locator(".deploy-flap-label")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
});

test("environment and search compose and the empty action restores both filters", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("combobox", { name: "Environment" }).click();
  await page.getByRole("option", { name: "Production", exact: true }).click();
  await page.getByRole("textbox", { name: "Search the board" }).fill("checkout");
  await expect(page.getByRole("button", { name: /^Open BLD-/ })).toHaveCount(3);
  await page.getByRole("textbox", { name: "Search the board" }).fill("__no_release__");
  await expect(page.getByText("No Matching Deploys", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear Filters", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Open BLD-/ })).toHaveCount(12);
  await expect(page.getByRole("combobox", { name: "Environment" })).toContainText("All envs");
});

test("second approval schedules the same record and Undo restores its waiting approver", async ({
  page,
}) => {
  await page.goto(route);
  const trigger = release(page, "BLD-2050");
  await trigger.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("1 of 2 approved, code owner first")).toBeVisible();
  await sheet.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(sheet.getByText("2 of 2 approved, code owner first")).toBeVisible();
  await expect(sheet.getByText("Scheduled", { exact: true }).first()).toBeVisible();
  await sheet.getByRole("button", { name: "Close", exact: true }).click();
  await expect(trigger).toHaveAttribute("aria-label", /Scheduled/);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(trigger).toHaveAttribute("aria-label", /Needs approval/);
  await trigger.click();
  await expect(sheet.getByText("1 of 2 approved, code owner first")).toBeVisible();
});

test("approved production waits for the real demo window before receiving canary traffic", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-26T14:20:00Z") });
  await page.goto(route);
  await release(page, "BLD-2050").click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "Approve", exact: true }).click();
  await sheet.getByRole("tab", { name: "Rollout", exact: true }).click();
  await expect(sheet.locator(".deploy-lever-slider")).toHaveAttribute("data-disabled", "");
  await expect(sheet.getByText("Target 0%", { exact: true })).toBeVisible();
  await page.clock.runFor(120_000);
  await expect(sheet.locator(".deploy-lever-slider")).not.toHaveAttribute("data-disabled", "");
  await expect(sheet.getByText("Target 5%", { exact: true })).toBeVisible();
});

test("native free Slider supports keyboard and pointer traffic changes", async ({ page }) => {
  await page.goto(route);
  await release(page, "BLD-2048").click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("tab", { name: "Rollout", exact: true }).click();
  const slider = sheet.getByRole("slider", { name: "Canary traffic, BLD-2048 checkout-api" });
  await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuetext", "25% traffic");
  await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuetext", "50% traffic");
  const rail = await sheet.locator('[data-slot="slider-track"]').boundingBox();
  expect(rail).not.toBeNull();
  await page.mouse.click(rail!.x + rail!.width - 2, rail!.y + rail!.height / 2);
  await expect(slider).toHaveAttribute("aria-valuetext", "100% traffic");
  await expect(sheet.getByText("Target 100%", { exact: true })).toBeVisible();
});

for (const width of [1440, 390]) {
  for (const input of ["pointer", "keyboard"] as const) {
    test(`armed zero-traffic request cancels to the native Slider [${width}/${input}]`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.goto(route);
      await release(page, "BLD-2048").click();
      const sheet = page.getByRole("dialog");
      await sheet.getByRole("tab", { name: "Rollout", exact: true }).click();
      const slider = sheet.getByRole("slider");
      await slider.press("Home");
      await expect(slider).toHaveAttribute("aria-valuetext", "5% traffic");
      await expect(page.getByRole("alertdialog")).toHaveCount(0);
      await sheet.getByRole("button", { name: "Arm Rollback", exact: true }).click();
      if (input === "pointer") {
        const track = await sheet.locator('[data-slot="slider-track"]').boundingBox();
        expect(track).not.toBeNull();
        await page.mouse.click(track!.x + 1, track!.y + track!.height / 2);
      } else {
        await slider.press("Home");
      }
      const confirmation = page.getByRole("alertdialog");
      await expect(confirmation).toBeVisible();
      const cancel = confirmation.getByRole("button", { name: "Cancel", exact: true });
      await expect(cancel).toBeFocused();
      if (input === "pointer") await cancel.click();
      else await cancel.press("Enter");
      await expect(confirmation).toHaveCount(0);
      await expect(sheet).toBeVisible();
      await expect(slider).toHaveAttribute("aria-valuetext", "5% traffic");
      await expect(slider).toBeFocused();
      await expect(sheet.getByRole("status")).toHaveText(
        "Rollback cancelled, holding at 5 percent",
      );
    });

    test(`rollback Cancel restores its header opener [${width}/${input}]`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.goto(route);
      await release(page, "BLD-2048").click();
      const sheet = page.getByRole("dialog");
      await sheet.getByRole("tab", { name: "Rollout", exact: true }).click();
      const opener = sheet.getByRole("button", { name: "Roll Back", exact: true });
      if (input === "pointer") await opener.click();
      else {
        await opener.focus();
        await opener.press("Enter");
      }
      const confirmation = page.getByRole("alertdialog");
      const cancel = confirmation.getByRole("button", { name: "Cancel", exact: true });
      await expect(cancel).toBeFocused();
      if (input === "pointer") await cancel.click();
      else await cancel.press("Enter");
      await expect(confirmation).toHaveCount(0);
      await expect(sheet).toBeVisible();
      await expect(sheet.getByRole("slider")).toHaveAttribute("aria-valuetext", "5% traffic");
      await expect(opener).toBeFocused();
    });
  }
}

test("confirmed rollback locks the real release and Undo restores its previous rollout", async ({
  page,
}) => {
  await page.goto(route);
  await release(page, "BLD-2048").click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "Roll Back", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Roll Back", exact: true })
    .click();
  await expect(sheet.getByRole("button", { name: "Close", exact: true })).toBeFocused();
  await sheet.getByRole("tab", { name: "Rollout", exact: true }).click();
  await expect(sheet.getByText("Target 0%", { exact: true })).toBeVisible();
  await expect(sheet.locator(".deploy-lever-slider")).toHaveAttribute("data-disabled", "");
  await expect(sheet.getByRole("button", { name: "Arm Rollback", exact: true })).toBeDisabled();
  await sheet.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(sheet.locator(".deploy-lever-slider")).not.toHaveAttribute("data-disabled", "");
  await expect(sheet.getByText("Target 5%", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toHaveCount(0);
});

test("failed release Retry restarts checks and Undo restores the failure", async ({ page }) => {
  await page.goto(route);
  await release(page, "BLD-2041").click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "Retry", exact: true }).click();
  await sheet.getByRole("tab", { name: "Checks", exact: true }).click();
  await expect(sheet.getByText(/of 9 passed · attempt 2/)).toBeVisible();
  const undo = sheet.getByRole("button", { name: "Undo", exact: true });
  await undo.focus();
  await expect(undo).toBeFocused();
  await undo.press("Enter");
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toHaveCount(0);
  await expect(sheet.getByRole("button", { name: "Retry", exact: true })).toBeVisible();
  await expect(sheet.getByText("9 of 9 passed · attempt 1", { exact: true })).toBeVisible();
});

test("detail tabs retain native arrow navigation, focus containment and Escape return", async ({
  page,
}) => {
  await page.goto(route);
  const trigger = release(page, "BLD-2048");
  await trigger.click();
  const sheet = page.getByRole("dialog");
  const overview = sheet.getByRole("tab", { name: "Overview", exact: true });
  await overview.focus();
  await overview.press("ArrowRight");
  await expect(sheet.getByRole("tab", { name: "Rollout", exact: true })).toBeFocused();
  await expect(sheet.getByRole("tab", { name: "Rollout", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press("Tab");
    expect(await sheet.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("merge rows open the associated deployment directly with the observed six columns", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("tab", { name: /^Merges/ }).click();
  await expect(page.getByRole("table", { name: "Merges" }).getByRole("columnheader")).toHaveText([
    "Time",
    "Service",
    "Version",
    "Pull request",
    "Deploy",
    "Status",
  ]);
  await page.getByRole("button", { name: /^Open Pull request 746,/ }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: /checkout-api/ })).toBeVisible();
  await expect(sheet.getByText("BLD-2050", { exact: true }).first()).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Approve", exact: true })).toBeVisible();
});

test("TV mode widens the board, hides filters and exits through Escape", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(route);
  const tv = page.getByRole("button", { name: "TV mode", exact: true });
  await tv.click();
  await expect(tv).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("textbox", { name: "Search the board" })).toBeHidden();
  expect((await page.locator(".deploy-board-frame").boundingBox())!.width).toBe(1392);
  await page.keyboard.press("Escape");
  await expect(tv).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("textbox", { name: "Search the board" })).toBeVisible();
});

test("deploy ID copy uses the existing official free clipboard hook", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(route);
  await release(page, "BLD-2041").click();
  await page.getByRole("button", { name: "Copy deploy ID", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("BLD-2041");
  await expect(page.getByRole("button", { name: "Copied deploy ID", exact: true })).toBeVisible();
});

test("phone uses two meaningful columns and keeps Sheet/Tabs inside the viewport", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(route);
  await expect(page.getByRole("table", { name: "Deploys" }).getByRole("columnheader")).toHaveCount(
    2,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: info.outputPath("deploy-board-390.png") });
  await release(page, "BLD-2048").click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("tab", { name: "Rollout", exact: true }).click();
  const bounds = await sheet.boundingBox();
  expect(bounds?.width).toBe(358);
  expect(bounds?.x).toBe(16);
  expect(bounds?.height).toBe(812);
  expect(await sheet.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const tabList = sheet.getByRole("tablist");
  expect(await tabList.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(
    true,
  );
  await page.screenshot({ path: info.outputPath("deploy-rollout-390.png") });
  expect(errors).toEqual([]);
});

test("reduced-motion retains complete flap values without running display animations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  const value = page.locator(".deploy-flap-label").first();
  await expect(value).toBeVisible();
  expect(await value.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  await expect(release(page, "BLD-2041")).toHaveAttribute("aria-label", /ledger-jobs/);
});
