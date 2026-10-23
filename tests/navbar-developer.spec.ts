import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

for (const width of [1440, 390]) {
  test(`API service and complete free request bar work within ${width}px`, async ({ page }) => {
    await page.clock.install();
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./#/preview/application/navbar/navbar-10");
    await page.getByRole("button", { name: "Select API service", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Stripe", exact: true }).click();
    await expect(page.getByLabel("API endpoint path", { exact: true })).toHaveValue(
      "/v1/customers",
    );
    await page.getByRole("button", { name: "HTTP method: GET", exact: true }).click();
    await expect(page.getByRole("menuitem")).toHaveCount(5);
    await page.getByRole("menuitem", { name: "POST", exact: true }).click();
    await page.getByLabel("API endpoint path", { exact: true }).fill("/v1/customers/demo");
    await page.getByRole("button", { name: "Send request", exact: true }).click();
    await expect(page.getByRole("button", { name: "Send request", exact: true })).toBeDisabled();
    await page.clock.fastForward(650);
    await expect(page.getByLabel("Local API response", { exact: true })).toContainText(
      "201 · Demo",
    );
    await expect(page.getByLabel("Response JSON", { exact: true })).toContainText(
      '"service": "stripe"',
    );
    await expect(page.getByLabel("Local API response", { exact: true })).toContainText(
      "POST /v1/customers/demo",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const bar = await page
      .getByRole("form", { name: "Local API request", exact: true })
      .boundingBox();
    expect(bar!.x).toBeGreaterThanOrEqual(0);
    expect(bar!.x + bar!.width).toBeLessThanOrEqual(width);
  });

  test(`design system tabs, radio sources and account theme remain usable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./#/preview/application/navbar/navbar-11");
    await page.getByRole("tab", { name: "Patterns", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Tokens", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("output")).toContainText("Design section: Tokens");
    await page.getByRole("button", { name: "Sync source", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Cursor", exact: true }).click();
    await expect(page.getByRole("button", { name: "Sync source", exact: true })).toContainText(
      "Cursor",
    );
    await expect(page.locator("output")).toContainText("Sync source: Cursor");
    await expect(page.locator('[data-slot="alert"]')).toContainText(
      "No remote files were synchronized",
    );
    await page.getByRole("button", { name: "Account menu", exact: true }).click();
    await page.getByRole("tab", { name: "Dark", exact: true }).click();
    await expect(page.locator('[data-navbar-entry="11"]')).toHaveClass(/dark/);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Account menu", exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}

test("service and HTTP method menus retain native keyboard focus and all five operations", async ({
  page,
}) => {
  await page.goto("./#/preview/application/navbar/navbar-10");
  const service = page.getByRole("button", { name: "Select API service", exact: true });
  await service.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", { name: "OpenAI", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", { name: "Stripe", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", { name: "Supabase", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(service).toBeFocused();
  await expect(service).toContainText("Supabase");
  await expect(page.getByLabel("API endpoint path", { exact: true })).toHaveValue(
    "/rest/v1/projects",
  );
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    const trigger = page.getByRole("button", { name: /^HTTP method:/ });
    await trigger.click();
    await page.getByRole("menuitem", { name: method, exact: true }).click();
    await expect(trigger).toHaveAccessibleName(`HTTP method: ${method}`);
    await expect(trigger).toBeFocused();
  }
});

test("request validation blocks invalid external paths and Enter submits a captured local fixture", async ({
  page,
}) => {
  await page.clock.install();
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (/api\.(openai|stripe)\.com|supabase\.(co|com)/.test(request.url()))
      externalRequests.push(request.url());
  });
  await page.goto("./#/preview/application/navbar/navbar-10");
  const path = page.getByLabel("API endpoint path", { exact: true });
  await path.fill("https://api.stripe.com/v1/customers");
  await path.press("Enter");
  await expect(page.locator('[data-slot="alert"]')).toContainText("Use a relative API path");
  await expect(page.getByLabel("Local API response", { exact: true })).toHaveCount(0);
  await path.fill("/v1/models/original");
  await path.press("Enter");
  await path.fill("/v1/models/changed");
  await page.clock.fastForward(650);
  await expect(page.getByLabel("Local API response", { exact: true })).toContainText(
    "GET /v1/models/original",
  );
  await expect(page.getByLabel("Local API response", { exact: true })).toContainText(
    "No request was sent to OpenAI",
  );
  expect(externalRequests).toEqual([]);
});

test("connect service uses the actual modal dialog and returns focus to its trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/preview/application/navbar/navbar-10");
  const trigger = page.getByRole("button", { name: "Select API service", exact: true });
  await trigger.click();
  await page.getByRole("menuitem", { name: "Connect service", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Connect a service", exact: true });
  await expect(dialog).toContainText("credentials are never requested or stored");
  await expect(page.locator('[data-slot="dialog-overlay"]')).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("sync source menu uses native radio keyboard selection and restores focus", async ({
  page,
}) => {
  await page.goto("./#/preview/application/navbar/navbar-11");
  const trigger = page.getByRole("button", { name: "Sync source", exact: true });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", { name: "shadcn", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("menuitemradio", { name: "Paper", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("Paper");
  await trigger.click();
  await expect(page.getByRole("menuitemradio", { name: "Paper", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

for (const [id, module] of [
  [10, "api"],
  [11, "design"],
] as const) {
  test(`Navbar ${id} source defaults, copies and downloads its actual leaf`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/block/application/navbar/navbar-${id}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const filename = `src/blocks/application/navbar-variants/developer/${module}.tsx`;
    await expect(page.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      filename,
    );
    const raw = await readFile(filename, "utf8");
    const code = page.getByRole("dialog").locator(".source-code");
    await code.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(raw);
    const pending = page.waitForEvent("download");
    await code.getByRole("button", { name: "Download source file", exact: true }).click();
    expect(await readFile((await (await pending).path())!, "utf8")).toBe(raw);
  });
}

test("real starter ZIP includes both developer leaves and actual free source adapters", async ({
  page,
}) => {
  await page.goto("./#/block/application/navbar/navbar-10");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const files = unzipSync(new Uint8Array(await readFile((await (await pending).path())!)));
  for (const module of [
    "api",
    "design",
    "free/request-bar",
    "free/service-picker",
    "free/sections",
    "free/sync-picker",
  ]) {
    const filename = `src/blocks/application/navbar-variants/developer/${module}.tsx`;
    expect(strFromU8(files[filename])).toBe(await readFile(filename, "utf8"));
  }
  expect(
    strFromU8(files["src/blocks/application/navbar-variants/developer/free/request-bar.tsx"]),
  ).toContain("c-input-group-36");
  expect(files["src/components/ui/input-group.tsx"]).toBeDefined();
  expect(files["src/components/reui/badge.tsx"]).toBeDefined();
});
