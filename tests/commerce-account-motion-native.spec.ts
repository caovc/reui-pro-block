// Private acceptance candidate only; execution and integration belong to Root.
import { expect, test, type Locator, type Page } from "@playwright/test";

// Inherit Root's unchanged 30s/5s budgets and W1R0 execution policy.

type Template = "surge" | "manifest" | "atlas";
const account = (page: Page) => page.locator(".atlas-account-settings");
const reduceSwitch = (page: Page) =>
  account(page).getByRole("switch", { name: /^Reduce animations/ });
const menuTrigger = (page: Page) => page.getByRole("button", { name: "Open menu", exact: true });

async function openPreferences(page: Page, id: Template, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`/#/template-preview/${id}/account/preferences`);
  if (id === "manifest") {
    const auth = page.locator(".bt-auth");
    await expect(auth).toBeVisible();
    await auth.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(auth).toBeHidden();
  }
  await expect(account(page).getByRole("heading", { name: "Account", exact: true })).toBeVisible();
  await expect(reduceSwitch(page)).not.toBeChecked();
}

async function motionSnapshot(surface: Locator) {
  return surface.evaluate((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const seconds = (value: string) =>
      value.split(",").map((entry) => {
        const text = entry.trim();
        return Number.parseFloat(text) / (text.endsWith("ms") ? 1000 : 1);
      });
    return {
      prefersReducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      animationDuration: seconds(style.animationDuration),
      animationDelay: seconds(style.animationDelay),
      transitionDuration: seconds(style.transitionDuration),
      transitionDelay: seconds(style.transitionDelay),
      animationName: style.animationName,
      position: style.position,
      display: style.display,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      bodyContains: document.body.contains(node),
      outsideShell: !node.closest(".bt-layout"),
    };
  });
}

type MotionSnapshot = Awaited<ReturnType<typeof motionSnapshot>>;
function timing(value: MotionSnapshot) {
  return {
    animationDuration: value.animationDuration,
    animationDelay: value.animationDelay,
    transitionDuration: value.transitionDuration,
    transitionDelay: value.transitionDelay,
  };
}

async function capture(surface: Locator, name: string) {
  await expect(surface).toBeVisible();
  await expect
    .poll(() =>
      surface.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.x >= -1 &&
          rect.y >= -1 &&
          rect.right <= innerWidth + 1 &&
          rect.bottom <= innerHeight + 1
        );
      }),
    )
    .toBe(true);
  const value = await motionSnapshot(surface);
  expect(value.bodyContains).toBe(true);
  expect(value.outsideShell).toBe(true);
  await test.info().attach(name, {
    body: JSON.stringify(value, null, 2),
    contentType: "application/json",
  });
  return value;
}

function expectNormal(value: MotionSnapshot) {
  // Observe the real media preference; do not force ordinary motion in reduced environments.
  if (value.prefersReducedMotion) return;
  expect(Math.max(...value.animationDuration, ...value.transitionDuration)).toBeGreaterThan(
    0.00002,
  );
}

function expectReduced(value: MotionSnapshot, original: MotionSnapshot) {
  for (const duration of [...value.animationDuration, ...value.transitionDuration]) {
    expect(duration).toBeCloseTo(0.00001, 8);
  }
  for (const delay of [...value.animationDelay, ...value.transitionDelay]) expect(delay).toBe(0);
  expect(value.animationName).toBe(original.animationName);
  expect(value.position).toBe(original.position);
  expect(value.display).toBe(original.display);
}

async function sheetPhase(page: Page, phase: string) {
  await menuTrigger(page).click();
  const content = page.locator('.bt-layout-mobile[data-slot="sidebar"][data-mobile="true"]');
  const overlay = page.locator('[data-slot="sheet-overlay"][data-state="open"]');
  const result = {
    content: await capture(content, `${phase}-sheet-content`),
    overlay: await capture(overlay, `${phase}-sheet-overlay`),
  };
  expect(result.content.position).toBe("fixed");
  expect(result.overlay.position).toBe("fixed");
  await page.keyboard.press("Escape");
  await expect(content).toBeHidden();
  await expect(overlay).toBeHidden();
  await expect(menuTrigger(page)).toBeFocused();
  return result;
}

test("Surge Sheet content and overlay use true motion policy and recover natural false", async ({
  page,
}) => {
  await openPreferences(page, "surge", 390);
  const normal = await sheetPhase(page, "false-default");
  expectNormal(normal.content);
  expectNormal(normal.overlay);
  await reduceSwitch(page).check();
  const reduced = await sheetPhase(page, "true");
  expectReduced(reduced.content, normal.content);
  expectReduced(reduced.overlay, normal.overlay);
  await reduceSwitch(page).uncheck();
  const restored = await sheetPhase(page, "false-restored");
  expect(timing(restored.content)).toEqual(timing(normal.content));
  expect(timing(restored.overlay)).toEqual(timing(normal.overlay));
});

async function accountTab(page: Page, label: "Profile" | "Preferences") {
  await account(page).getByRole("tab", { name: label, exact: true }).click();
}

async function timezonePhase(page: Page, phase: string, selection?: string) {
  const input = account(page).getByRole("combobox", { name: "Time zone", exact: true });
  await input.click();
  await input.press("ArrowDown");
  const popup = page.locator('[data-slot="combobox-content"]');
  await expect(popup).toHaveAttribute("data-open", "");
  await expect(popup).not.toHaveAttribute("data-starting-style", "");
  const value = await capture(popup, `${phase}-timezone`);
  const anchor = await input.boundingBox();
  expect(anchor).not.toBeNull();
  if (!anchor) throw new Error("Visible timezone input has no bounds");
  expect(value.rect.x).toBeLessThan(anchor.x + anchor.width);
  expect(value.rect.x + value.rect.width).toBeGreaterThan(anchor.x);
  expect(
    Math.min(
      Math.abs(value.rect.y - anchor.y - anchor.height),
      Math.abs(value.rect.y + value.rect.height - anchor.y),
    ),
  ).toBeLessThanOrEqual(24);
  if (selection) {
    await popup.getByRole("option", { name: selection, exact: true }).click();
    await expect(popup).toBeHidden();
    await expect(input).toHaveValue(selection);
    await expect(input).toBeFocused();
    await input.press("ArrowDown");
    await expect(popup).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(popup).toBeHidden();
  await expect(input).toBeFocused();
  return value;
}

test("Manifest native BaseUI timezone remains anchored, selectable and focus-safe under motion policy", async ({
  page,
}) => {
  await openPreferences(page, "manifest", 1440);
  await accountTab(page, "Profile");
  const normal = await timezonePhase(page, "false-default", "(GMT+0) London");
  expectNormal(normal);
  await accountTab(page, "Preferences");
  await reduceSwitch(page).check();
  await accountTab(page, "Profile");
  const reduced = await timezonePhase(page, "true", "(GMT+9) Tokyo");
  expectReduced(reduced, normal);
  await accountTab(page, "Preferences");
  await reduceSwitch(page).uncheck();
  await accountTab(page, "Profile");
  const restored = await timezonePhase(page, "false-restored");
  expect(timing(restored)).toEqual(timing(normal));
});

test("Atlas without MotionPolicyProvider retains natural portalled Sheet timings", async ({
  page,
}) => {
  await openPreferences(page, "atlas", 390);
  const normal = await sheetPhase(page, "atlas-false-default");
  expectNormal(normal.content);
  expectNormal(normal.overlay);
  // Atlas retains its existing Shell preference; it does not opt into Commerce's context.
  await reduceSwitch(page).check();
  const unchanged = await sheetPhase(page, "atlas-true-no-provider");
  expect(timing(unchanged.content)).toEqual(timing(normal.content));
  expect(timing(unchanged.overlay)).toEqual(timing(normal.overlay));
});
