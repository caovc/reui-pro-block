import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { accountMenu, evidence, healthy, openPublic } from "./strata-account-popup-helpers";
import {
  expectSelectedTabContained,
  expectSelectedTabKeyboardFocus,
  selectedTabGeometry,
  verticalPositions,
} from "./strata-settings-selected-tabs-geometry";

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "general", label: "General" },
  { id: "api-keys", label: "API keys" },
  { id: "security", label: "Security" },
  { id: "billing", label: "Billing" },
] as const;

test.setTimeout(30000);
test.describe.configure({ retries: 0 });
test.use({
  actionTimeout: 5000,
  colorScheme: "light",
  reducedMotion: "no-preference",
  deviceScaleFactor: 1,
});

async function settingsURL(page: Page, entry: URL, preset: string | null, id: string) {
  const query = new URLSearchParams({ preset: preset! });
  if (id !== "general") query.set("tab", id);
  const url = new URL(entry);
  url.hash = `/templates/strata/settings?${query}`;
  await page.goto(url.href);
}

async function enterSelectedTabByKeyboard(
  page: Page,
  list: Locator,
  selected: Locator,
  primitive: "radix" | "base",
  info: TestInfo,
) {
  await page.getByRole("button", { name: "Manage Billing", exact: true }).focus();
  await page.keyboard.press("Tab");
  const entry = await list.evaluate((node) => {
    const active = document.activeElement as HTMLElement | null;
    return {
      activeIsList: active === node,
      active: active
        ? {
            tag: active.tagName,
            role: active.getAttribute("role"),
            slot: active.getAttribute("data-slot"),
            tabIndex: active.tabIndex,
            text: active.textContent?.trim().slice(0, 100),
          }
        : null,
    };
  });
  // The retained diagnostic proves Radix's own tabindex=0 list can be the entry stop.
  // Advance once only from that exact native stop; never skip another focused node.
  const enteredNativeList = primitive === "radix" && entry.activeIsList;
  if (enteredNativeList) {
    await expect(list).toHaveAttribute("data-slot", "tabs-list");
    await expect(list).toHaveAttribute("tabindex", "0");
    await expect(list).toBeFocused();
    await page.keyboard.press("Tab");
  }
  await info.attach("native-keyboard-entry.json", {
    body: JSON.stringify({ primitive, entry, enteredNativeList }, null, 2),
    contentType: "application/json",
  });
  await expect(selected).toBeFocused();
}

for (const primitive of ["radix", "base"] as const) {
  for (const source of ["direct route", "account shortcut"] as const) {
    for (const target of tabs) {
      test(`${primitive} 390 ${source}: selected ${target.label} fully visible, hit-owned and keyboard outlined`, async ({
        page,
        baseURL,
      }, info) => {
        const initial = await openPublic(page, baseURL, primitive, 390);
        const beforeNavigation = await verticalPositions(page);
        if (source === "direct route") {
          await settingsURL(page, initial.entry, initial.preset, target.id);
        } else {
          const { menu } = await accountMenu(page, primitive, 390);
          await menu.getByRole("menuitem", { name: target.label, exact: true }).click();
          await expect(menu).toBeHidden();
          await expect(page.locator('.strata-sidebar[data-mobile="true"]')).toBeHidden();
        }
        await expect(page).toHaveTitle("Strata — Bricklane Templates");
        await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
        await expect(page.locator("html")).toHaveAttribute("data-ui-style", "nova");
        await expect(page).toHaveURL((url) => {
          const [route, query] = url.hash.split("?");
          const parameters = new URLSearchParams(query);
          return (
            url.pathname === initial.entry.pathname &&
            route === "#/templates/strata/settings" &&
            parameters.get("preset") === initial.preset &&
            parameters.get("tab") === (target.id === "general" ? null : target.id)
          );
        });
        await page.evaluate(() => document.fonts.ready);
        const list = page.getByRole("tablist", { name: "Settings sections", exact: true });
        await expect(list).toHaveAttribute("data-slot", "tabs-list");
        if (primitive === "radix")
          await expect(list).toHaveAttribute("aria-orientation", "horizontal");
        else expect(await list.getAttribute("aria-orientation")).toBeNull();
        await expect(list).toHaveAttribute("data-orientation", "horizontal");
        await expect(list).toHaveCSS("flex-direction", "row");
        const row = await list.getByRole("tab").evaluateAll((nodes) =>
          nodes.map((node) => {
            const rect = node.getBoundingClientRect();
            return { top: rect.top, bottom: rect.bottom, height: rect.height };
          }),
        );
        expect(row).toHaveLength(5);
        for (const rect of row) {
          expect(Math.abs(rect.top - row[0].top)).toBeLessThanOrEqual(0.75);
          expect(Math.abs(rect.bottom - row[0].bottom)).toBeLessThanOrEqual(0.75);
          expect(rect.height).toBeGreaterThan(0);
        }
        const tab = list.getByRole("tab", { name: target.label, exact: true });
        await expect(tab).toHaveAttribute("aria-selected", "true");
        await expect(list.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
        await expect(page.getByRole("tabpanel", { name: target.label, exact: true })).toBeVisible();

        // Measure and save before any action can auto-scroll the selected tab into view.
        const selected = await selectedTabGeometry(tab);
        await evidence(page, info, "selected-before-focus-or-pointer", { geometry: selected });
        expectSelectedTabContained(selected);
        expect(await verticalPositions(page)).toEqual(beforeNavigation);

        // Use the measured center rather than locator.click auto-scrolling the control.
        const point = selected.points[1];
        await page.mouse.click(point.x, point.y);
        await expect(tab).toBeFocused();
        await expect(tab).toHaveAttribute("aria-selected", "true");
        const beforeKeyboard = await verticalPositions(page);
        await enterSelectedTabByKeyboard(page, list, tab, primitive, info);
        const focused = await selectedTabGeometry(tab);
        await evidence(page, info, "selected-native-keyboard-focus", { geometry: focused });
        expectSelectedTabKeyboardFocus(focused);
        expect(await verticalPositions(page)).toEqual(beforeKeyboard);
        await healthy(page, initial.faults);
      });
    }
  }

  test(`${primitive} 390 native keys reveal all five selected tabs without moving vertical scrollports`, async ({
    page,
    baseURL,
  }, info) => {
    const initial = await openPublic(page, baseURL, primitive, 390);
    await settingsURL(page, initial.entry, initial.preset, "profile");
    await page.evaluate(() => document.fonts.ready);
    const list = page.getByRole("tablist", { name: "Settings sections", exact: true });
    await expect(list).toBeVisible();
    await enterSelectedTabByKeyboard(
      page,
      list,
      list.getByRole("tab", { name: "Profile", exact: true }),
      primitive,
      info,
    );
    const before = await verticalPositions(page);
    const steps = [
      { key: "ArrowRight", label: "General" },
      { key: "ArrowRight", label: "API keys" },
      { key: "ArrowRight", label: "Security" },
      { key: "ArrowRight", label: "Billing" },
      { key: "Home", label: "Profile" },
      { key: "End", label: "Billing" },
      { key: "ArrowLeft", label: "Security" },
    ];
    const states = [];
    for (const step of steps) {
      await page.keyboard.press(step.key);
      const tab = list.getByRole("tab", { name: step.label, exact: true });
      await expect(tab).toBeFocused();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel", { name: step.label, exact: true })).toBeVisible();
      const geometry = await selectedTabGeometry(tab);
      expectSelectedTabKeyboardFocus(geometry);
      expect(await verticalPositions(page)).toEqual(before);
      states.push({ ...step, geometry });
    }
    await evidence(page, info, "native-keyboard-five-tab-sequence", { states });
    await healthy(page, initial.faults);
  });
}
