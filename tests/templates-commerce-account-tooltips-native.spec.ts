import { expect, test, type Locator, type Page } from "@playwright/test";

type Merchant = "surge" | "manifest";
type Surface = "navigation" | "account" | "handle";
const sidebarSelector = '.bt-sidebar[data-slot="sidebar-container"]';
const tooltipSelector = '[data-slot="tooltip-content"]';

function sidebar(page: Page) {
  return page.locator(sidebarSelector);
}

function collapseHandle(page: Page) {
  return sidebar(page).locator(".shell-collapse-handle");
}

async function clearTooltip(page: Page) {
  await page.mouse.move(0, 0);
  await page.keyboard.press("Escape");
  await expect(page.locator(tooltipSelector)).toHaveCount(0);
}

async function keyboardReach(page: Page, target: Locator) {
  if (await target.evaluate((node) => node === node.ownerDocument.activeElement)) {
    // Leave and return through the real Tab sequence, including pointer-focused
    // CollapseHandle. No programmatic focus or tabIndex adjustment is used.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
  } else {
    let reached = false;
    for (let step = 0; step < 32; step++) {
      await page.keyboard.press("Shift+Tab");
      if (await target.evaluate((node) => node === node.ownerDocument.activeElement)) {
        reached = true;
        break;
      }
    }
    expect(
      reached,
      "Target must be reachable in the bounded native Preferences/Sidebar Tab path",
    ).toBe(true);
  }
  await expect(target).toBeFocused();
  expect(await target.evaluate((node) => node.matches(":focus-visible"))).toBe(true);
}

async function startPreferences(page: Page, id: Merchant | "atlas") {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/#/template-preview/${id}/account/preferences?qa=account-tooltips`, {
    waitUntil: "domcontentloaded",
  });
  if (id === "manifest") {
    await page.getByRole("button", { name: "Log in", exact: true }).click();
  }
  await expect(page.locator(".atlas-account-settings")).toBeVisible();
  await expect(page.getByRole("switch", { name: "Show tooltips", exact: true })).toBeChecked();
  await collapseHandle(page).click();
  await expect(collapseHandle(page)).toHaveAttribute("aria-expanded", "false");
}

async function toggleTooltips(page: Page, enabled: boolean) {
  const control = page.getByRole("switch", { name: "Show tooltips", exact: true });
  await control.click();
  await expect(control).toBeChecked({ checked: enabled });
  await expect(control).toBeFocused();
  await expect(collapseHandle(page)).toHaveAttribute("aria-expanded", "false");
}

async function tooltipTarget(page: Page, surface: "navigation" | "account") {
  const surge = (await page.locator(".bt-layout.bt-surge").count()) === 1;
  const manifest = (await page.locator(".bt-layout.bt-manifest").count()) === 1;
  if (surface === "navigation") {
    return {
      target: sidebar(page).getByRole(surge || manifest ? "link" : "button", {
        name: "Dashboard",
        exact: true,
      }),
      label: "Dashboard",
    };
  }
  const target = sidebar(page).locator(
    surge || manifest ? ".surge-account-trigger" : ".bt-account-button",
  );
  const name = await target.getAttribute("aria-label");
  expect(name).toMatch(/^Open account menu for .+/);
  return { target, label: name!.replace(/^Open account menu for /, "") };
}

async function assertNativeTooltip(page: Page, target: Locator, label: string, enabled: boolean) {
  if (enabled) {
    const content = page.locator(tooltipSelector);
    await expect(content).toHaveCount(1);
    await expect(content).toBeVisible();
    await expect(content).toContainText(label);
    const accessibleTooltip = page.getByRole("tooltip", { name: label, exact: true });
    await expect(accessibleTooltip).toHaveCount(1);
    const describedBy = await target.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    await expect(accessibleTooltip).toHaveAttribute("id", describedBy!);
    expect(
      await content.evaluate((node) => node.closest('[data-slot="sidebar-container"]') === null),
    ).toBe(true);
  } else {
    await expect(page.locator(tooltipSelector)).toHaveCount(0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await expect(target).not.toHaveAttribute("aria-describedby", /.+/);
  }
}

async function probeTooltip(page: Page, surface: "navigation" | "account", enabled: boolean) {
  const { target, label } = await tooltipTarget(page, surface);
  await clearTooltip(page);
  await target.hover();
  await assertNativeTooltip(page, target, label, enabled);
  await clearTooltip(page);
  await keyboardReach(page, target);
  await assertNativeTooltip(page, target, label, enabled);
  await clearTooltip(page);
  await expect(target).toBeEnabled();
}

async function probeHandle(page: Page, enabled: boolean) {
  const handle = collapseHandle(page);
  const label = handle.locator(".shell-rail-label");
  await clearTooltip(page);
  await expect(handle).toHaveAttribute("tabindex", "0");
  if (enabled) {
    await expect(handle).toHaveAttribute("title", "Toggle Sidebar");
    await expect(label).toHaveCount(1);
    await expect(label).toHaveText("Expand");
  } else {
    await expect.poll(() => handle.getAttribute("title")).toBeNull();
    await expect(label).toHaveCount(0);
  }
  await handle.hover();
  if (enabled) {
    await expect.poll(() => label.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  }
  await expect(page.locator(tooltipSelector)).toHaveCount(0);
  await clearTooltip(page);
  await keyboardReach(page, handle);
  if (enabled) {
    await expect.poll(() => label.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  } else {
    await expect(label).toHaveCount(0);
    await expect.poll(() => handle.getAttribute("title")).toBeNull();
  }
  // Native title and this aria-hidden span are distinct from Radix Tooltip.
  await expect(page.locator(tooltipSelector)).toHaveCount(0);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(handle).toHaveAttribute("aria-expanded", "false");
}

async function probe(page: Page, surface: Surface, enabled: boolean) {
  if (surface === "handle") await probeHandle(page, enabled);
  else await probeTooltip(page, surface, enabled);
}

for (const id of ["surge", "manifest"] as const) {
  for (const surface of ["navigation", "account", "handle"] as const) {
    test(`${id} Show tooltips naturally disables and restores ${surface}`, async ({ page }) => {
      await startPreferences(page, id);
      await probe(page, surface, true);
      await toggleTooltips(page, false);
      await probe(page, surface, false);
      await toggleTooltips(page, true);
      await probe(page, surface, true);
    });
  }
}

test("Atlas collapsed navigation keeps the default Tooltip contract", async ({ page }) => {
  await startPreferences(page, "atlas");
  await probeTooltip(page, "navigation", true);
});
