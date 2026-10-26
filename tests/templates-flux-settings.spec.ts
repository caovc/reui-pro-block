import { readFile } from "node:fs/promises";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const issues = new WeakMap<Page, string[]>();
const widths = [1440, 390] as const;
const webhookActions: Record<string, number[][]> = {
  "1440": [
    [1334, 150, 68, 32],
    [1334, 227, 68, 32],
    [1334, 304, 68, 32],
    [1334, 381, 68, 32],
    [1334, 458, 68, 32],
  ],
  "390": [
    [292, 134, 68, 32],
    [292, 211, 68, 32],
    [292, 288, 68, 32],
    [292, 365, 68, 32],
    [292, 442, 68, 32],
  ],
};
// Fixed official Frame measurements, not derived from the implementation under test.
const referenceFrames: Record<string, number[][]> = {
  "workspace-1440": [
    [273, 73, 1142, 184],
    [273, 277, 1142, 259],
    [273, 556, 1142, 117],
    [273, 693, 1142, 184],
  ],
  "workspace-390": [
    [17, 65, 356, 242.5],
    [17, 327.5, 356, 356],
    [17, 703.5, 356, 135.5],
    [17, 859, 356, 224],
  ],
  // Independently measured PUBLIC Linux Chromium reference, not local product geometry.
  // Provenance and preserved original failure: docs/flux-workspace-linux-reference-release.json.
  "workspace-390-linux": [
    [17, 65, 356, 261],
    [17, 346, 356, 374.5],
    [17, 740.5, 356, 135.5],
    [17, 896, 356, 242.5],
  ],
  "security-1440": [
    [273, 73, 1142, 276.75],
    [273, 369.75, 1142, 276.75],
    [273, 666.5, 1142, 351],
  ],
  "security-390": [
    [17, 65, 356, 316.75],
    [17, 401.75, 356, 316.75],
    [17, 738.5, 356, 371],
  ],
  "api-1440": [[273, 73, 1142, 642]],
  "api-390": [[17, 65, 356, 774]],
  "webhooks-1440": [[273, 73, 1142, 440]],
  "webhooks-390": [[17, 65, 356, 440]],
};
type SettingsView = "Workspace" | "Security" | "API keys" | "Webhooks";

test.beforeEach(async ({ page, context, baseURL }) => {
  if (!baseURL) throw new Error("Flux browser tests require a configured application URL.");
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(baseURL).origin,
  });
  const messages: string[] = [];
  issues.set(page, messages);
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      messages.push(`${message.type()}: ${message.text()}`);
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const messages = issues.get(page) ?? [];
  await testInfo.attach("console-and-page-errors", {
    body: Buffer.from(JSON.stringify(messages, null, 2)),
    contentType: "application/json",
  });
  expect(messages).toEqual([]);
});

async function openFlux(page: Page, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/flux", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".wf-root.wf-agentops")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Agent Operations/ })).toBeVisible();
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
}

async function settings(page: Page, width: number, view: SettingsView, keepSheet = false) {
  const sheet = page.locator('[data-mobile="true"]');
  if (width === 390 && !(await sheet.isVisible()))
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const navigation = width === 390 ? sheet : page.locator(".wf-native-sidebar");
  const child = navigation.getByRole("button", { name: view, exact: true });
  if (!(await child.isVisible()))
    await navigation.getByRole("button", { name: "Settings", exact: true }).click();
  await child.click();
  await expect(page.locator(".flux-settings-page")).toBeVisible();
  if (width === 390) {
    // Reference child links retain the phone Sheet; never repair this by reopening it.
    await expect(sheet).toBeVisible();
    if (!keepSheet) {
      await page.keyboard.press("Escape");
      await expect(sheet).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Open navigation", exact: true }),
      ).toBeFocused();
    }
  }
}

async function evidence(page: Page, testInfo: TestInfo, name: string) {
  if (name.endsWith("-initial")) {
    const phone = page.viewportSize()!.width === 390;
    const key = `${name.replace(/-initial$/, "")}-${phone ? 390 : 1440}`;
    const frames = await page
      .locator('.flux-settings-page [data-slot="frame"]')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return [box.x, box.y, box.width, box.height];
        }),
      );
    const referenceKey =
      key === "workspace-390" && process.platform === "linux" ? "workspace-390-linux" : key;
    const expected = referenceFrames[referenceKey];
    expect(expected, `fixed reference for ${key}`).toBeDefined();
    expect(frames).toHaveLength(expected.length);
    for (let index = 0; index < expected.length; index++)
      for (let dimension = 0; dimension < 4; dimension++)
        expect(
          frames[index][dimension],
          `${key} Frame ${index} dimension ${dimension}`,
        ).toBeCloseTo(expected[index][dimension], 0);
    if (name === "webhooks-initial") {
      const actions = await page
        .locator('.flux-endpoint-item [data-slot="item-actions"]')
        .evaluateAll((elements) =>
          elements.map((element) => {
            const box = element.getBoundingClientRect();
            return [box.x, box.y, box.width, box.height];
          }),
        );
      const expectedActions = webhookActions[phone ? "390" : "1440"];
      expect(actions).toHaveLength(expectedActions.length);
      for (let index = 0; index < expectedActions.length; index++)
        for (let dimension = 0; dimension < 4; dimension++)
          expect(
            actions[index][dimension],
            `Webhook ${index} actions dimension ${dimension}`,
          ).toBeCloseTo(expectedActions[index][dimension], 0);
    }
    if (name === "api-initial") {
      const rowHeights = await page
        .locator(".flux-api-grid tbody tr")
        .evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().height));
      expect(rowHeights).toEqual([51, 51, 51, 51, 51, 51, 51, 51, 51, 50]);
      await expect(page.locator('.flux-api-grid [data-slot="frame-panel-footer"]')).toHaveCount(1);
    }
  }
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), animations: "disabled" });
  const geometry = await page.locator(".flux-settings-page").evaluate((root) => {
    const elements = [
      root,
      ...root.querySelectorAll(
        '[data-slot="frame"],[data-slot="field"],[data-slot="item"],[data-slot="select-trigger"],[data-slot="scroll-area-viewport"],[data-slot="data-grid-pagination"]',
      ),
    ];
    return elements.map((element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        slot: element.getAttribute("data-slot"),
        rect: [box.x, box.y, box.width, box.height],
        client: [element.clientWidth, element.clientHeight],
        scroll: [element.scrollWidth, element.scrollHeight],
        font: [style.fontFamily, style.fontSize, style.lineHeight],
        overflow: [style.overflowX, style.overflowY],
      };
    });
  });
  await testInfo.attach(`${name}-geometry`, {
    body: Buffer.from(JSON.stringify(geometry, null, 2)),
    contentType: "application/json",
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
}

async function exportRows(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export integrations", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("api-integrations.json");
  const path = await download.path();
  expect(path).not.toBeNull();
  return JSON.parse(await readFile(path!, "utf8")) as {
    integrations: number;
    enabled: number;
    dailyCalls: number;
    rows: {
      name: string;
      provider: string;
      purpose: string;
      dailyCalls: number;
      enabled: boolean;
    }[];
  };
}

for (const width of widths) {
  test(`Flux Workspace reference defaults, information actions and route reset ${width}`, async ({
    page,
  }, testInfo) => {
    await openFlux(page, width);
    await settings(page, width, "Workspace");
    const region = page.locator(".flux-settings-page");
    await expect(region.getByRole("switch")).toHaveCount(4);
    for (const name of [
      "Retry a failed step once",
      "Halt the workspace on a spend spike",
      "Keep full run traces",
      "Redact secrets in traces",
    ])
      await expect(region.getByRole("switch", { name, exact: true })).toBeChecked();
    await expect(region.getByText("claude-sonnet-5", { exact: true })).toBeVisible();
    await expect(region.getByText("24 runs", { exact: true })).toBeVisible();
    await expect(region.getByText("90s", { exact: true })).toBeVisible();
    await expect(region.getByRole("button", { name: /Save|Cancel/ })).toHaveCount(0);
    await evidence(page, testInfo, "workspace-initial");
    await region.getByRole("button", { name: "Change model", exact: true }).click();
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: "Default model" }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await region.getByRole("switch", { name: "Retry a failed step once", exact: true }).click();
    await expect(
      region.getByRole("switch", { name: "Retry a failed step once", exact: true }),
    ).not.toBeChecked();
    await settings(page, width, "Security");
    await settings(page, width, "Workspace");
    await expect(
      region.getByRole("switch", { name: "Retry a failed step once", exact: true }),
    ).toBeChecked();
  });

  test(`Flux Security real Pro fields, popup focus and route reset ${width}`, async ({
    page,
  }, testInfo) => {
    await openFlux(page, width);
    await settings(page, width, "Security");
    const region = page.locator(".flux-settings-page");
    const twoFactor = region.getByRole("switch", {
      name: "Enforce two-factor authentication",
      exact: true,
    });
    const timeout = region.getByRole("combobox", { name: "Session timeout", exact: true });
    await expect(twoFactor).not.toBeChecked();
    await expect(
      region.getByRole("switch", { name: "Single active session", exact: true }),
    ).not.toBeChecked();
    await expect(
      region.getByRole("switch", { name: "Password authentication", exact: true }),
    ).toBeChecked();
    await expect(
      region.getByRole("switch", { name: "Magic link login", exact: true }),
    ).toBeChecked();
    await expect(timeout).toHaveText("4 hours");
    await expect(region.getByRole("switch")).toHaveCount(4);
    await expect(region.getByRole("button", { name: /Save|Cancel/ })).toHaveCount(0);
    await evidence(page, testInfo, "security-initial");
    await timeout.click();
    await expect(page.getByRole("option")).toHaveText([
      "30 minutes",
      "1 hour",
      "4 hours",
      "24 hours",
      "Never",
    ]);
    await page.getByRole("option", { name: "1 hour", exact: true }).click();
    await expect(timeout).toHaveText("1 hour");
    await timeout.click();
    await page.getByRole("listbox").press("Escape");
    await expect(timeout).toBeFocused();
    await twoFactor.click();
    await expect(twoFactor).toBeChecked();
    await evidence(page, testInfo, "security-edited");
    await settings(page, width, "Workspace");
    await settings(page, width, "Security");
    await expect(twoFactor).not.toBeChecked();
    await expect(timeout).toHaveText("4 hours");
  });

  test(`Flux API keys actual 31-record selection, global sorting, paging, copy and JSON ${width}`, async ({
    page,
  }, testInfo) => {
    await openFlux(page, width);
    await settings(page, width, "API keys");
    const region = page.locator(".flux-api-grid");
    const rows = region.locator("tbody tr");
    const footer = region.locator('[data-slot="data-grid-pagination"]');
    await expect(rows).toHaveCount(10);
    await expect(footer).toContainText("1 - 10 of 31");
    await evidence(page, testInfo, "api-initial");
    await rows.first().getByRole("checkbox").click();
    await expect(rows.first().getByRole("checkbox")).toBeChecked();
    const initialExport = await exportRows(page);
    expect(initialExport.integrations).toBe(31);
    expect(initialExport.rows).toHaveLength(31);
    expect(initialExport.enabled).toBe(initialExport.rows.filter((row) => row.enabled).length);
    expect(initialExport.dailyCalls).toBe(
      initialExport.rows.reduce((sum, row) => sum + row.dailyCalls, 0),
    );
    for (const row of initialExport.rows)
      expect(Object.keys(row).sort()).toEqual([
        "dailyCalls",
        "enabled",
        "name",
        "provider",
        "purpose",
      ]);
    await rows.first().getByRole("button", { name: "Copy API key", exact: true }).click();
    await expect(
      rows.first().getByRole("button", { name: "API key copied", exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "bk_demo_access_audit_001",
    );

    const sort = region.getByRole("button", { name: "Daily Calls", exact: true });
    await sort.click();
    await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
    await expect(rows.first().locator("td").nth(3)).toHaveText(
      Math.min(...initialExport.rows.map((row) => row.dailyCalls)).toLocaleString("en-US"),
    );
    await sort.click();
    await page.getByRole("menuitem", { name: "Desc", exact: true }).click();
    await expect(rows.first().locator("td").nth(3)).toHaveText(
      Math.max(...initialExport.rows.map((row) => row.dailyCalls)).toLocaleString("en-US"),
    );
    await footer.getByRole("button", { name: /Go to page 2/i }).click();
    await expect(footer).toContainText("11 - 20 of 31");
    await footer.getByRole("combobox", { name: "Rows per page", exact: true }).click();
    await expect(page.getByRole("option")).toHaveText(["5", "10", "25", "50", "100"]);
    await page.getByRole("option", { name: "25", exact: true }).click();
    await expect(rows).toHaveCount(25);
    await expect(footer).toContainText("1 - 25 of 31");

    const pause = region.getByRole("switch", { name: "Pause all integrations", exact: true });
    await pause.click();
    await expect(pause).toBeChecked();
    const paused = await exportRows(page);
    expect(paused.enabled).toBe(0);
    expect(paused.rows.every((row) => !row.enabled)).toBe(true);
    await pause.click();
    const enabled = await exportRows(page);
    expect(enabled.enabled).toBe(31);
    expect(enabled.rows.every((row) => row.enabled)).toBe(true);
    await rows.first().getByRole("switch").click();
    expect((await exportRows(page)).enabled).toBe(30);
    await evidence(page, testInfo, "api-edited");
    if (width === 390) {
      const viewport = region.locator('[data-slot="scroll-area-viewport"]').first();
      const dimensions = await viewport.evaluate((element) => ({
        client: element.clientWidth,
        scroll: element.scrollWidth,
      }));
      expect(dimensions.scroll).toBeGreaterThan(dimensions.client);
      expect(dimensions.scroll).toBeGreaterThanOrEqual(980);
      await region
        .getByRole("button", { name: /^Edit / })
        .first()
        .focus();
      await page.keyboard.press("Enter");
      await expect(
        page.locator("[data-sonner-toast]").filter({ hasText: "Edit integration" }),
      ).toBeVisible();
      expect(await viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    }
  });

  test(`Flux Webhooks real toggles, local notices, removal and route reset ${width}`, async ({
    page,
  }, testInfo) => {
    await openFlux(page, width);
    await settings(page, width, "Webhooks");
    const region = page.locator(".flux-settings-page");
    const actions = region.getByRole("button", { name: /^Open actions for / });
    await expect(actions).toHaveCount(5);
    await evidence(page, testInfo, "webhooks-initial");
    const first = region.locator('[data-slot="item"]').filter({ hasText: "Run Lifecycle" });
    await first.getByRole("switch").click();
    await expect(first.getByRole("switch")).not.toBeChecked();
    await expect(first.getByText("Paused", { exact: true })).toBeVisible();
    await first
      .getByRole("button", { name: "Copy endpoint URL for Run Lifecycle", exact: true })
      .click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "https://events.bricklane.example/webhooks/runs",
    );
    for (const [label, notice] of [
      ["Manage endpoint", "Endpoint settings"],
      ["View deliveries", "Delivery history"],
      ["Rotate secret", "Preview secret rotated"],
    ]) {
      const trigger = first.getByRole("button", {
        name: "Open actions for Run Lifecycle",
        exact: true,
      });
      await trigger.click();
      await expect(page.getByRole("menuitem")).toHaveText([
        "Manage endpoint",
        "View deliveries",
        "Rotate secret",
        "Remove endpoint",
      ]);
      await page.getByRole("menuitem", { name: label, exact: true }).click();
      await expect(page.locator("[data-sonner-toast]").filter({ hasText: notice })).toBeVisible();
      await expect(page.getByRole("menu")).toHaveCount(0);
    }
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: "preview signing secret version 2" }),
    ).toBeVisible();
    await first
      .getByRole("button", { name: "Open actions for Run Lifecycle", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Remove endpoint", exact: true }).click();
    await expect(actions).toHaveCount(4);
    await expect(first).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await region.getByRole("button", { name: "Add Endpoint", exact: true }).click();
    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "Add a destination URL and subscribed events." }),
    ).toBeVisible();
    await expect(actions).toHaveCount(4);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await evidence(page, testInfo, "webhooks-removed");
    await settings(page, width, "Security");
    await settings(page, width, "Webhooks");
    await expect(actions).toHaveCount(5);
    await expect(first.getByRole("switch")).toBeChecked();
  });
}

test("Flux phone child links retain Sheet, inline breadcrumb and Escape focus", async ({
  page,
}) => {
  await openFlux(page, 390);
  for (const view of ["Workspace", "Security", "API keys", "Webhooks"] as const) {
    await settings(page, 390, view, true);
    await expect(page.locator('[data-mobile="true"]')).toBeVisible();
    await expect(page.locator(".wf-header")).toContainText("Settings");
    await expect(page.locator(".wf-header")).toContainText(view);
  }
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-mobile="true"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toBeFocused();
});

for (const width of widths) {
  test(`Flux actual Customize fonts reach Security popup without losing control state ${width}`, async ({
    page,
    context,
  }, testInfo) => {
    await openFlux(page, width);
    await settings(page, width, "Security");
    const timeout = page.getByRole("combobox", { name: "Session timeout", exact: true });
    await timeout.click();
    await page.getByRole("option", { name: "1 hour", exact: true }).click();

    const customizer = await context.newPage();
    const messages = issues.get(page)!;
    customizer.on("pageerror", (error) => messages.push(`customizer pageerror: ${error.message}`));
    customizer.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning")
        messages.push(`customizer ${message.type()}: ${message.text()}`);
    });
    await customizer.goto("/#/block/application/app-shell/app-shell-1", {
      waitUntil: "networkidle",
    });
    await customizer.getByRole("button", { name: "Customize", exact: true }).click();

    for (const font of ["Default", "Serif", "Mono", "Reset"] as const) {
      if (font === "Reset")
        await customizer.getByRole("button", { name: "Reset", exact: true }).click();
      else if (font !== "Default") {
        await customizer.getByRole("combobox", { name: "Body font", exact: true }).click();
        await customizer.getByRole("option", { name: font, exact: true }).click();
      }
      const expected =
        font === "Serif"
          ? "Georgia, serif"
          : font === "Mono"
            ? "ui-monospace, monospace"
            : /^Inter,/;
      await expect(timeout).toHaveCSS("font-family", expected);
      await expect(timeout).toHaveText("1 hour");
      await timeout.click();
      await expect(page.getByRole("listbox")).toHaveCSS("font-family", expected);
      await page.screenshot({
        path: testInfo.outputPath(`security-popup-${font}.png`),
        animations: "disabled",
      });
      await page.getByRole("listbox").press("Escape");
      await expect(timeout).toBeFocused();
      await expect(timeout).toHaveText("1 hour");
    }

    await settings(page, width, "API keys");
    await page.getByRole("button", { name: "Integration", exact: true }).click();
    await expect(page.getByRole("menu")).toHaveCSS("font-family", /^Inter,/);
    await page.getByRole("menuitem", { name: "Columns", exact: true }).hover();
    const visibility = page.getByRole("menuitemcheckbox", { name: "API Key", exact: true });
    await expect(visibility).toBeChecked();
    await visibility.click();
    await expect(visibility).not.toBeChecked();
    await visibility.click();
    await expect(visibility).toBeChecked();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await customizer.close();
  });
}
