import { writeFile } from "node:fs/promises";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

// Local migration acceptance, not an original-site geometry oracle.
// Parent runs with --workers=1 --retries=0 --max-failures=1.
test.describe.configure({ retries: 0, timeout: 30000 });
test.use({ deviceScaleFactor: 1, colorScheme: "light", actionTimeout: 5000 });

const rawQuery = "?qa=filebox-auth&raw=a%20b&raw=a+b&flag";
const mount = (id: "filebox" | "filespace") => `#/template-preview/${id}`;
const auth = (page: Page) => page.locator(".ct-filebox-auth");
const signIn = (page: Page) => page.getByRole("button", { name: "Sign in", exact: true });
const faults = new WeakMap<Page, string[]>();

// Same read-only settling protocol as the existing Manifest native auth suite.
async function settled(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.getAnimations().filter((item) => item.playState === "running" || item.pending)
            .length,
      ),
    )
    .toBe(0);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

async function expectHash(page: Page, expected: string) {
  await expect(page).toHaveURL((url) => url.hash === expected);
}

async function evidence(page: Page, info: TestInfo, name: string) {
  const snapshot = await page.evaluate(() => ({
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    document: {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    },
    fonts: document.fonts.status,
    active: { tag: document.activeElement?.tagName, id: document.activeElement?.id },
    controls: [
      ...document.querySelectorAll<HTMLElement>(".ct-drive-login input, .ct-drive-login button"),
    ].map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        tag: node.tagName,
        id: node.id,
        label: node.getAttribute("aria-label"),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        validity:
          node instanceof HTMLInputElement
            ? {
                required: node.required,
                valueMissing: node.validity.valueMissing,
                typeMismatch: node.validity.typeMismatch,
              }
            : null,
      };
    }),
  }));
  const path = info.outputPath(`${name}.json`);
  await writeFile(path, JSON.stringify({ ...snapshot, faults: faults.get(page) ?? [] }, null, 2));
  await info.attach(name, { path, contentType: "application/json" });
  await page.screenshot({ path: info.outputPath(`${name}.png`), animations: "allow" });
}

async function boundedControls(page: Page, surface: Locator) {
  await settled(page);
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    width,
  );
  for (const control of await surface.locator("input, button").all()) {
    await expect(control).toBeInViewport({ ratio: 1 });
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 0.75);
  }
}

async function invalidSubmit(page: Page, input: Locator, reason: "valueMissing" | "typeMismatch") {
  await signIn(page).click();
  expect(
    await input.evaluate((node, key) => (node as HTMLInputElement).validity[key], reason),
  ).toBe(true);
  await expect(input).toBeFocused();
  await expect(page.locator(".ct-drive-window")).toHaveCount(0);
}

async function application(page: Page, width: number, name: "Drive" | "Settings") {
  if (width === 390) {
    await page.getByRole("button", { name: "Open application navigation", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Bricklane Drive applications", exact: true });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name, exact: true }).click();
    await expect(drawer).toBeHidden();
  } else {
    await page.getByRole("button", { name, exact: true }).click();
  }
}

async function signOut(page: Page, width: number) {
  if (width === 390)
    await page.getByRole("button", { name: "Open application navigation", exact: true }).click();
  await page.getByRole("button", { name: "Open profile for Alex Rivera", exact: true }).click();
  await page
    .getByRole("menu")
    .getByRole("menuitem", { name: /^Sign Out/ })
    .click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(signIn(page)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  faults.set(page, messages);
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()))
      messages.push(`${message.type()}: ${message.text()}`);
  });
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && !["GET", "HEAD", "OPTIONS"].includes(request.method()))
      messages.push(`Unexpected HTTP write: ${request.method()} ${request.url()}`);
  });
});

test.afterEach(async ({ page }, info) => {
  const messages = faults.get(page) ?? [];
  if (!page.isClosed() && (info.status !== info.expectedStatus || messages.length > 0))
    await evidence(page, info, "first-failure");
  await info.attach("runtime-faults", {
    body: JSON.stringify(messages, null, 2),
    contentType: "application/json",
  });
  expect(messages).toEqual([]);
});

for (const width of [1440, 390]) {
  test(`Base Filebox reset keyboard focus and masked return ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(`/base/${mount("filebox")}${rawQuery}`);
    await expect(page).toHaveTitle("Bricklane — Blocks & Templates");
    const surface = auth(page);
    const password = surface.getByLabel("Password", { exact: true });
    await surface.getByRole("button", { name: "Show password", exact: true }).click();
    await expect(password).toHaveAttribute("type", "text");
    const forgot = surface.getByRole("button", { name: "Forgot password?", exact: true });
    await forgot.focus();
    await page.keyboard.press("Enter");
    const email = surface.getByRole("textbox", { name: "Email", exact: true });
    await expect(email).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(email).toBeFocused();
    await expect(surface.getByRole("status")).toHaveCount(0);
    await email.fill("alex.rivera@bricklane.example");
    await page.keyboard.press("Enter");
    await expect(surface.getByRole("status")).toHaveText(
      "Reset link prepared for this local demo.",
    );
    await expect(surface.getByRole("status")).toBeFocused();
    await boundedControls(page, surface);
    await evidence(page, info, "base-reset-success-focus");
    await page.keyboard.press("Tab");
    await expect(
      surface.getByRole("button", { name: "Back to sign in", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(forgot).toBeFocused();
    await expect(password).toHaveAttribute("type", "password");
    await expectHash(page, `${mount("filebox")}${rawQuery}`);
  });

  test(`Filebox free auth native validation, password, reset and bounded controls ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(`/${mount("filebox")}${rawQuery}`);
    const surface = auth(page);
    await expect(surface.locator('[data-slot="card-title"]')).toHaveText("Welcome back");
    await expect(surface.locator('[data-slot="card-title"]')).toBeVisible();
    await expect(surface.locator('[data-slot="card"]')).toHaveCount(1);
    await expect(surface.locator('[data-slot="card-header"]')).toHaveCount(1);
    await expect(surface.locator('[data-slot="card-content"]')).toHaveCount(1);
    const fields = surface.locator('[data-slot="field-group"]');
    await expect(fields).toHaveCount(1);
    await expect(fields.locator(':scope > [data-slot="field"]')).toHaveCount(2);
    await expect(fields.locator('[data-slot="input-group"]')).toHaveCount(1);
    await expect(
      fields.locator('[data-slot="input-group-addon"][data-align="inline-end"]'),
    ).toHaveCount(1);
    await expect(surface.locator(".ct-password, .ct-login-divider")).toHaveCount(0);
    await boundedControls(page, surface);
    await evidence(page, info, "local-auth-controls");

    const email = surface.getByRole("textbox", { name: "Email or username", exact: true });
    const password = surface.getByLabel("Password", { exact: true });
    await expect(email).toHaveValue("alex.rivera@bricklane.example");
    await expect(email).toHaveAttribute("autocomplete", "username");
    await expect(password).toHaveAttribute("autocomplete", "current-password");
    await expect(email).toHaveAttribute("required", "");
    await expect(password).toHaveAttribute("required", "");
    await email.fill("");
    await invalidSubmit(page, email, "valueMissing");
    await email.fill("not-an-email");
    await invalidSubmit(page, email, "typeMismatch");
    await email.fill("alex.rivera@bricklane.example");
    await password.fill("");
    await invalidSubmit(page, password, "valueMissing");
    await expectHash(page, `${mount("filebox")}${rawQuery}`);
    await password.fill("Local password value 42");
    await surface.getByRole("button", { name: "Show password", exact: true }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("Local password value 42");
    await expect(
      surface.getByRole("button", { name: "Hide password", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await surface.getByRole("button", { name: "Hide password", exact: true }).click();
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveValue("Local password value 42");

    await surface.getByRole("button", { name: "Show password", exact: true }).click();
    await expect(password).toHaveAttribute("type", "text");
    const forgot = surface.getByRole("button", { name: "Forgot password?", exact: true });
    await forgot.focus();
    await page.keyboard.press("Enter");
    await expect(surface.locator('[data-slot="card-title"]')).toHaveText("Reset your password");
    await expect(surface.locator('[data-slot="card-title"]')).toBeVisible();
    const resetEmail = surface.getByRole("textbox", { name: "Email", exact: true });
    const send = surface.getByRole("button", { name: "Send reset link", exact: true });
    await expect(resetEmail).toBeFocused();
    await expect(resetEmail).toHaveAttribute("autocomplete", "email");
    await boundedControls(page, surface);
    await evidence(page, info, "local-reset-input-focus");
    await send.click();
    expect(
      await resetEmail.evaluate((node) => (node as HTMLInputElement).validity.valueMissing),
    ).toBe(true);
    await expect(resetEmail).toBeFocused();
    await expect(surface.getByRole("status")).toHaveCount(0);
    await resetEmail.fill("invalid-email");
    await send.click();
    expect(
      await resetEmail.evaluate((node) => (node as HTMLInputElement).validity.typeMismatch),
    ).toBe(true);
    await expect(surface.getByRole("status")).toHaveCount(0);
    await resetEmail.fill("alex.rivera@bricklane.example");
    await send.click();
    await expect(surface.getByRole("status")).toHaveText(
      "Reset link prepared for this local demo.",
    );
    await expect(surface.getByRole("status")).toBeFocused();
    await evidence(page, info, "local-reset-success-focus");
    await expect(page.locator(".ct-drive-window")).toHaveCount(0);
    await page.keyboard.press("Tab");
    await expect(
      surface.getByRole("button", { name: "Back to sign in", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(forgot).toBeFocused();
    await expect(email).toHaveValue("alex.rivera@bricklane.example");
    await expect(password).toHaveValue("password");
    await expect(password).toHaveAttribute("type", "password");
    await expect(
      surface.getByRole("button", { name: "Show password", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");

    // A cancelled reset follows the same native return path without submitting.
    await page.keyboard.press("Enter");
    await expect(resetEmail).toBeFocused();
    await expect(resetEmail).toHaveValue("");
    await page.keyboard.press("Tab");
    await expect(send).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      surface.getByRole("button", { name: "Back to sign in", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(forgot).toBeFocused();
    await expect(surface.getByRole("status")).toHaveCount(0);
    await boundedControls(page, surface);
    await signIn(page).click();
    await expect(auth(page)).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /Name/ })).toBeVisible();
    await expect(
      page.locator(".ct-drive-header").getByText("My Drive", { exact: true }),
    ).toBeVisible();
    await expectHash(page, `${mount("filebox")}${rawQuery}`);
  });

  test(`Filebox initial settings gate retains raw query and saved model across native navigation ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const initial = `${mount("filebox")}/settings${rawQuery}`;
    await page.goto(`/${initial}`);
    await expect(auth(page)).toBeVisible();
    await expect(page.locator(".ds-root")).toHaveCount(0);
    await expectHash(page, initial);
    await signIn(page).click();
    await expect(auth(page)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Account Settings", exact: true }),
    ).toBeVisible();
    await expectHash(page, initial);
    const fullName = page.getByLabel("Full Name", { exact: true });
    await fullName.fill("Filebox saved local name");
    await page
      .locator(".ds-card")
      .filter({ has: page.getByText("Profile Details", { exact: true }) })
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(page.getByText("Profile saved", { exact: true })).toBeVisible();
    const navigation = page.getByRole("navigation", { name: "Account settings sections" });
    await navigation.getByRole("link", { name: "Workspace", exact: true }).click();
    await expectHash(page, `${mount("filebox")}/settings/workspace${rawQuery}`);
    await navigation.getByRole("link", { name: "Profile", exact: true }).click();
    await expect(fullName).toHaveValue("Filebox saved local name");
    await application(page, width, "Drive");
    await expect(page.getByRole("columnheader", { name: /Name/ })).toBeVisible();
    await expectHash(page, `${mount("filebox")}/drive${rawQuery}`);
    await application(page, width, "Settings");
    await expectHash(page, initial);
    await expect(fullName).toHaveValue("Filebox saved local name");
    await expect(auth(page)).toHaveCount(0);
  });

  test(`Filespace retains its original login after sign out and native reset ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(`/${mount("filespace")}${rawQuery}`);
    await expect(page.getByRole("columnheader", { name: /Name/ })).toBeVisible();
    await expect(page.locator(".ct-drive-login")).toHaveCount(0);
    await signOut(page, width);
    await expectHash(page, `${mount("filespace")}/login${rawQuery}`);
    await expect(auth(page)).toHaveCount(0);
    const legacy = page.locator(".ct-drive-login");
    await expect(legacy.locator(".ct-password")).toHaveCount(1);
    await expect(legacy.locator('[data-slot="field"], [data-slot="input-group"]')).toHaveCount(0);
    const password = legacy.getByLabel("Password", { exact: true });
    await password.fill("");
    await invalidSubmit(page, password, "valueMissing");
    await password.fill("Filespace original password");
    await legacy.getByRole("button", { name: "Show password", exact: true }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("Filespace original password");
    await legacy.getByRole("button", { name: "Hide password", exact: true }).click();
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveValue("Filespace original password");
    await legacy.getByRole("button", { name: "Forgot password?", exact: true }).click();
    await legacy.locator('input[name="email"]').fill("alex.rivera@bricklane.example");
    await legacy.getByRole("button", { name: "Send reset link", exact: true }).click();
    await expect(legacy.getByRole("status")).toHaveText("Reset link prepared for this local demo.");
    await legacy.getByRole("button", { name: "Back to sign in", exact: true }).click();
    await expect(password).toHaveValue("password");
    await signIn(page).click();
    await expect(page.getByRole("columnheader", { name: /Name/ })).toBeVisible();
    await expectHash(page, `${mount("filespace")}${rawQuery}`);
    await expect(auth(page)).toHaveCount(0);
  });
}
