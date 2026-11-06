import { writeFile } from "node:fs/promises";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

// Parent runs W1/R0/max-failures=1. Keep the repository's 30s/5s budgets.
test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light", actionTimeout: 5000 });

const root = "#/template-preview/manifest";
const query = "?qa=manifest-auth&raw=a%20b&raw=a+b&flag";
const faults = new WeakMap<Page, string[]>();
const auth = (page: Page) => page.locator(".manifest-auth");

function near(actual: number, expected: number, label: string) {
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(0.75);
}

async function box(target: Locator) {
  const rect = await target.boundingBox();
  expect(rect).not.toBeNull();
  return rect!;
}

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
  expect(await page.evaluate(() => document.fonts.status)).toBe("loaded");
  expect(
    await page.evaluate(
      () =>
        document.getAnimations().filter((item) => item.playState === "running" || item.pending)
          .length,
    ),
  ).toBe(0);
}

async function evidence(page: Page, info: TestInfo, name: string) {
  const snapshot = await page.evaluate(() => ({
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    document: {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollY,
    },
    fonts: document.fonts.status,
    active: {
      tag: document.activeElement?.tagName,
      id: document.activeElement?.id,
      name: document.activeElement?.getAttribute("name"),
    },
    slots: [
      ...document.querySelectorAll<HTMLElement>(".manifest-auth [data-slot], .manifest-auth form"),
    ].map((node) => {
      const rect = node.getBoundingClientRect();
      const css = getComputedStyle(node);
      return {
        tag: node.tagName,
        slot: node.getAttribute("data-slot"),
        name: node.getAttribute("name"),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        padding: css.padding,
        gap: css.gap,
        font: css.font,
        nativeInput:
          node instanceof HTMLInputElement
            ? {
                type: node.type,
                required: node.required,
                valid: node.validity.valid,
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

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  faults.set(page, messages);
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()))
      messages.push(`${message.type()}: ${message.text()}`);
  });
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && !["GET", "HEAD"].includes(request.method())) {
      messages.push(`Unexpected HTTP write: ${request.method()} ${request.url()}`);
    }
  });
});

test.afterEach(async ({ page }, info) => {
  const messages = faults.get(page) ?? [];
  if (!page.isClosed() && (info.status !== info.expectedStatus || messages.length > 0)) {
    await evidence(page, info, "first-failure");
  }
  await info.attach("runtime-faults", {
    body: JSON.stringify(messages, null, 2),
    contentType: "application/json",
  });
  expect(messages).toEqual([]);
});

async function open(page: Page, width: number, path = "") {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`/${root}${path}${query}`);
  await expect(
    auth(page).getByRole("heading", { name: "Log in to your account", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".bt-layout")).toHaveCount(0);
  await expect(page.locator(".commerce-account-settings")).toHaveCount(0);
  await settled(page);
}

async function remainsLoggedOut(page: Page) {
  await expect(auth(page)).toBeVisible();
  await expect(page.locator(".bt-layout")).toHaveCount(0);
}

for (const width of [1440, 390]) {
  test(`Manifest Auth reference slots, geometry and native local login ${width}`, async ({
    page,
  }, info) => {
    await open(page, width);
    const surface = auth(page);
    const card = surface.locator('[data-slot="card"]');
    const header = card.locator(':scope > [data-slot="card-header"]');
    const content = card.locator(':scope > [data-slot="card-content"]');
    const form = content.locator("form");
    const fields = form.locator('[data-slot="field-group"]');
    await expect(card).toHaveCount(1);
    await expect(header).toHaveCount(1);
    await expect(content).toHaveCount(1);
    await expect(fields).toHaveCount(1);
    await expect(fields.locator(':scope > [data-slot="field"]')).toHaveCount(2);
    await expect(fields.locator('[data-slot="input-group"]')).toHaveCount(1);
    await expect(fields.locator('[data-slot="input-group-control"][name="password"]')).toHaveCount(
      1,
    );
    const email = surface.getByRole("textbox", { name: "Email address", exact: true });
    const password = surface.getByLabel("Password", { exact: true });
    await expect(email).toBeFocused();
    await expect(email).toHaveValue("nick@bricklane.demo");
    await expect(password).toHaveValue("password");
    await expect(password).toHaveAttribute("type", "password");
    await expect(email).toHaveAttribute("required", "");
    await expect(password).toHaveAttribute("required", "");
    const rect = await box(card);
    near(rect.width, width === 1440 ? 416 : 358, "Original Card width");
    near(rect.height, width === 1440 ? 660 : 688, "Original natural Card height");
    near(rect.x, width === 1440 ? 512 : 16, "Original centered Card x");
    near(rect.y, width === 1440 ? 170 : 78, "Original centered Card y");
    near((await box(header)).height, width === 1440 ? 138 : 134, "Original Header height");
    near((await box(content)).height, width === 1440 ? 522 : 554, "Original Content height");
    near((await box(form)).height, 218.5, "Original Form height");
    near(
      (await box(content.locator('[data-slot="alert"]'))).height,
      67.5,
      "Original demo Alert height",
    );
    const google = surface.getByRole("button", { name: "Google", exact: true });
    const apple = surface.getByRole("button", { name: "Apple", exact: true });
    const passkey = surface.getByRole("button", { name: "Sign in with a passkey", exact: true });
    const login = surface.getByRole("button", { name: "Log in", exact: true });
    for (const control of [google, apple, passkey, login])
      near((await box(control)).height, 32, "Original auth button height");
    const googleBox = await box(google);
    const appleBox = await box(apple);
    if (width === 1440) {
      near(googleBox.y, appleBox.y, "Desktop providers share a row");
      near(appleBox.x - googleBox.x - googleBox.width, 12, "Desktop provider gap");
    } else {
      near(googleBox.x, appleBox.x, "Phone providers share a column");
      near(googleBox.width, 310, "Phone provider width");
      near(appleBox.width, 310, "Phone second provider width");
      near(appleBox.y - googleBox.y - googleBox.height, 12, "Phone provider gap");
    }
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await evidence(page, info, "initial-auth-layout");

    await email.fill("");
    await login.click();
    expect(await email.evaluate((node) => (node as HTMLInputElement).validity.valueMissing)).toBe(
      true,
    );
    await remainsLoggedOut(page);
    await email.fill("invalid-email");
    await login.click();
    expect(await email.evaluate((node) => (node as HTMLInputElement).validity.typeMismatch)).toBe(
      true,
    );
    await remainsLoggedOut(page);
    await email.fill("nick@bricklane.demo");
    await password.fill("");
    await login.click();
    expect(
      await password.evaluate((node) => (node as HTMLInputElement).validity.valueMissing),
    ).toBe(true);
    await remainsLoggedOut(page);
    await password.fill("   ");
    await login.click();
    await expect(surface.locator(".bt-login-error")).toHaveText("Enter your password.");
    await remainsLoggedOut(page);
    await password.fill("password");
    await surface.getByRole("button", { name: "Show password", exact: true }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("password");
    await surface.getByRole("button", { name: "Hide password", exact: true }).click();
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveValue("password");
    const remember = surface.getByRole("checkbox", { name: "Remember me", exact: true });
    await expect(remember).not.toBeChecked();
    await remember.check();
    await expect(remember).toBeChecked();
    const forgot = surface.getByRole("link", { name: "Forgot your password?", exact: true });
    await expect(forgot).toHaveAttribute("href", "/forgot-password");
    await forgot.click();
    await expect(
      surface.getByRole("heading", { name: "Reset your password", exact: true }),
    ).toBeVisible();
    await expect(surface.getByLabel("Password", { exact: true })).toHaveCount(0);
    await surface.getByRole("button", { name: "Back to log in", exact: true }).click();
    await forgot.click();
    await surface.getByRole("button", { name: "Send reset link", exact: true }).click();
    await expect(
      surface.getByRole("heading", { name: "Log in to your account", exact: true }),
    ).toBeVisible();
    await remainsLoggedOut(page);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(`${root}${query}`);
    await login.click();
    await expect(surface).toHaveCount(0);
    const dashboard = page.getByRole("region", { name: "Store dashboard", exact: true });
    await expect(dashboard).toBeVisible();
    const metrics = dashboard.locator('.manifest-dashboard-metric[data-slot="frame"]');
    await expect(metrics).toHaveCount(4);
    await settled(page);
    for (const metric of await metrics.all())
      near((await box(metric)).height, 148, "Original Manifest metric Frame height after login");
  });

  test(`Manifest Auth first account deep link retains duplicate raw query ${width}`, async ({
    page,
  }) => {
    const path = "/account/profile";
    await open(page, width, path);
    expect(await page.evaluate(() => location.hash)).toBe(`${root}${path}${query}`);
    await expect(
      auth(page).getByRole("textbox", { name: "Email address", exact: true }),
    ).toBeFocused();
    await auth(page).getByRole("button", { name: "Log in", exact: true }).click();
    const account = page.locator(".commerce-account-settings");
    await expect(auth(page)).toHaveCount(0);
    await expect(account.getByRole("tab", { name: "Profile", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(account.getByRole("tabpanel", { name: "Profile", exact: true })).toBeVisible();
    await expect(
      account.getByRole("region", { name: "Profile details", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "Store dashboard", exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => location.hash)).toBe(`${root}${path}${query}`);
  });
}
