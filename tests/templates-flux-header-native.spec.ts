import { expect, test, type Page } from "@playwright/test";

// Private, unexecuted regression proposal for the final integrated production build.
// Reference boxes come from the retained public reference audit, not this candidate.
const issues = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  issues.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(message.text());
  });
});

test.afterEach(async ({ page }, info) => {
  const errors = issues.get(page) ?? [];
  await info.attach("console-and-page-errors", {
    body: Buffer.from(JSON.stringify(errors, null, 2)),
    contentType: "application/json",
  });
  expect(errors).toEqual([]);
});

async function openFlux(page: Page, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/flux");
  await expect(page.getByRole("heading", { name: /Agent Operations/ })).toBeVisible();
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

async function navigate(page: Page, width: number, view: "Workspace" | "Security" | "Overview") {
  const sheet = page.locator('[data-mobile="true"]');
  if (width === 390 && !(await sheet.isVisible()))
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const sidebar = width === 390 ? sheet : page.locator(".wf-native-sidebar");
  const destination = sidebar.getByRole("button", { name: view, exact: true });
  if (view !== "Overview" && !(await destination.isVisible()))
    await sidebar.getByRole("button", { name: "Settings", exact: true }).click();
  await destination.click();
  if (view === "Overview") {
    await expect(page.getByRole("heading", { name: /Agent Operations/ })).toBeVisible();
    if (width === 390) await expect(sheet).toHaveCount(0);
  } else {
    await expect(page.locator(".flux-settings-page")).toBeVisible();
    if (width === 390) {
      await expect(sheet).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(sheet).toHaveCount(0);
    }
  }
}

for (const width of [1440, 390]) {
  test(`Flux Settings native SystemMonitor charts, collapse and focus at ${width}`, async ({
    page,
  }, info) => {
    await openFlux(page, width);
    await navigate(page, width, "Workspace");
    const trigger = page.getByRole("button", { name: "System Status", exact: true });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const monitor = page.getByRole("dialog", { name: "System Monitor", exact: true });
    await expect(monitor).toBeVisible();
    await expect
      .poll(async () => {
        const box = await monitor.boundingBox();
        return box && [box.x, box.y, box.width, box.height];
      })
      .toEqual(width === 390 ? [53, 49, 320, 423] : [1095, 57, 320, 423]);
    for (const metric of ["CPU", "GPU", "Memory", "Network"])
      await expect(monitor.getByLabel(`${metric} usage trend`, { exact: true })).toBeVisible();
    await expect(monitor.locator("svg.recharts-surface")).toHaveCount(4);
    await expect(monitor.getByText("Execution trace", { exact: true })).toHaveCount(0);
    const memory = monitor.getByRole("progressbar");
    await expect(memory).toHaveCount(6);
    await expect(
      monitor.getByRole("progressbar", { name: "Refund Triage memory", exact: true }),
    ).toBeVisible();
    const collapse = monitor.getByRole("button", { name: "Per-Agent Memory", exact: true });
    await collapse.click();
    await expect(collapse).toHaveAttribute("aria-expanded", "false");
    await expect(memory).toHaveCount(0);
    await collapse.click();
    await expect(collapse).toHaveAttribute("aria-expanded", "true");
    await expect(memory).toHaveCount(6);
    await page.screenshot({ path: info.outputPath(`monitor-${width}.png`) });
    await page.keyboard.press("Escape");
    await expect(monitor).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test(`Flux Settings native Profile tabs, save boundary and route persistence at ${width}`, async ({
    page,
  }, info) => {
    await openFlux(page, width);
    await navigate(page, width, "Workspace");
    const originalTrigger = page.getByRole("button", {
      name: "Profile settings for Nick Bold",
      exact: true,
    });
    await originalTrigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.locator(".workspace-settings-shell.wf-flux-profile-dialog");
    await expect(dialog).toBeVisible();
    await expect
      .poll(async () => {
        const box = await dialog.boundingBox();
        return box && [box.width, box.height];
      })
      .toEqual(width === 390 ? [366, 742.71875] : [960, 768]);
    await expect(dialog.getByRole("textbox", { name: "Full Name", exact: true })).toHaveValue(
      "Nick Bold",
    );
    await expect(dialog.getByRole("textbox", { name: /^Email Address\b/ })).toHaveValue(
      "nick@bricklane.example",
    );
    await expect(dialog.getByRole("combobox", { name: "Role", exact: true })).toHaveText("Owner");
    for (const tab of ["Workspace", "Team", "Billing", "Preferences", "Profile"]) {
      await dialog.getByRole("tab", { name: tab, exact: true }).click();
      await expect(dialog.getByRole("heading", { name: tab, exact: true })).toBeVisible();
    }
    const fullName = dialog.getByRole("textbox", { name: "Full Name", exact: true });
    await fullName.fill("");
    await expect(dialog.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
    await fullName.fill("Unsaved header name");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(originalTrigger).toBeVisible();
    await expect(originalTrigger).toBeFocused();
    await originalTrigger.click();
    await expect(fullName).toHaveValue("Unsaved header name");
    await fullName.fill("Nick Rivera");
    await dialog.getByRole("tab", { name: "Billing", exact: true }).click();
    const billingEmail = dialog.getByRole("textbox", { name: "Billing Email", exact: true });
    await billingEmail.fill("invalid-email");
    await expect(dialog.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
    await billingEmail.fill("billing+header@bricklane.example");
    await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const savedTrigger = page.getByRole("button", {
      name: "Profile settings for Nick Rivera",
      exact: true,
    });
    await expect(savedTrigger).toBeVisible();
    await expect(savedTrigger).toBeFocused();
    await navigate(page, width, "Security");
    await expect(savedTrigger).toBeVisible();
    await navigate(page, width, "Overview");
    await navigate(page, width, "Workspace");
    await savedTrigger.click();
    await expect(fullName).toHaveValue("Nick Rivera");
    await dialog.getByRole("tab", { name: "Billing", exact: true }).click();
    await expect(billingEmail).toHaveValue("billing+header@bricklane.example");
    await page.screenshot({ path: info.outputPath(`profile-${width}.png`) });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(savedTrigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}

for (const shell of [7, 8]) {
  test(`SystemMonitor default app-shell-${shell} retains four agents, native keyboard and trigger`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/#/preview/application/app-shell/app-shell-${shell}`);
    if (shell === 8)
      await page.getByRole("button", { name: "Orders section", exact: true }).click();
    const trigger = page.getByRole("button", { name: "System monitor", exact: true });
    await expect(trigger).toContainText("System");
    await expect(trigger).toContainText("Normal");
    await trigger.focus();
    await page.keyboard.press("Space");
    const monitor = page.locator('[data-slot="popover-content"]');
    await expect(
      monitor.getByRole("heading", { name: "System Monitor", exact: true }),
    ).toBeVisible();
    await expect(monitor.getByText("Ingest Worker", { exact: true })).toBeVisible();
    await expect(monitor.getByText("Transform Pipeline", { exact: true })).toBeVisible();
    await expect(monitor.getByText("Query Engine", { exact: true })).toBeVisible();
    await expect(monitor.getByText("Export Service", { exact: true })).toBeVisible();
    await expect(monitor.getByText("Refund Triage", { exact: true })).toHaveCount(0);
    await expect(monitor.locator("svg > polyline")).toHaveCount(4);
    await monitor.getByRole("button", { name: "Per-Agent Memory", exact: true }).click();
    await expect(monitor.getByText("Ingest Worker", { exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(monitor).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
