import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

// Regression proposal only: run after the one-prop forwarding change is integrated.
// Existing free Tabs/Radix owns orientation, roving focus and automatic activation.
// These tests do not change activation mode or install any keyboard/focus handler.
const settingsSections = [
  "My Profile",
  "Hours",
  "Chairs",
  "Procedures",
  "Billing",
  "Notifications",
];

// Native entry helpers retained from templates-miro-settings-native.spec.ts.
async function openMiro(page: Page, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/miro");
  await expect(page.locator(".bt-miro.bt-layout")).toBeVisible();
}

async function navigation(page: Page) {
  if ((page.viewportSize()?.width ?? 1440) >= 768) return page.locator(".bt-layout-rail");
  const drawer = page.locator(".bt-layout-mobile");
  if (!(await drawer.isVisible())) {
    await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
  }
  await expect(drawer).toBeVisible();
  return drawer;
}

async function navigate(page: Page, name: string) {
  const menu = await navigation(page);
  await menu.getByRole("button", { name, exact: true }).click();
  if ((page.viewportSize()?.width ?? 1440) < 768) {
    // Ordinary Miro navigation retains the native Sheet until the user dismisses it.
    await expect(page.locator(".bt-layout-mobile")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".bt-layout-mobile")).toBeHidden();
    await expect(page.getByRole("button", { name: "Toggle Sidebar", exact: true })).toBeFocused();
  }
}

// Same actual entry and ready locator as navbar-first-run.spec.ts open(page, 1).
async function openProjectNavbar(page: Page) {
  await page.goto("./#/preview/application/navbar/navbar-1");
  await expect(page.locator('[data-navbar-entry="1"]')).toBeVisible();
}

async function readIndicator(tab: Locator) {
  // Read-only computed-style/geometry observation; never invokes DOM focus or mutates state.
  return tab.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const visible = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const clippingAncestors: {
      tag: string;
      className: string;
      overflowX: string;
      overflowY: string;
      left: number;
      top: number;
      right: number;
      bottom: number;
    }[] = [];
    let opacityProduct = Number(style.opacity);
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const ancestorStyle = getComputedStyle(ancestor);
      opacityProduct *= Number(ancestorStyle.opacity);
      const box = ancestor.getBoundingClientRect();
      const clipsX = /^(auto|scroll|hidden|clip)$/.test(ancestorStyle.overflowX);
      const clipsY = /^(auto|scroll|hidden|clip)$/.test(ancestorStyle.overflowY);
      if (clipsX || clipsY) {
        const bounds = {
          left: box.left + ancestor.clientLeft,
          top: box.top + ancestor.clientTop,
          right: box.left + ancestor.clientLeft + ancestor.clientWidth,
          bottom: box.top + ancestor.clientTop + ancestor.clientHeight,
        };
        if (clipsX) {
          visible.left = Math.max(visible.left, bounds.left);
          visible.right = Math.min(visible.right, bounds.right);
        }
        if (clipsY) {
          visible.top = Math.max(visible.top, bounds.top);
          visible.bottom = Math.min(visible.bottom, bounds.bottom);
        }
        clippingAncestors.push({
          tag: ancestor.tagName,
          className: ancestor.className,
          overflowX: ancestorStyle.overflowX,
          overflowY: ancestorStyle.overflowY,
          ...bounds,
        });
      }
    }
    const opaque = (color: string) =>
      color !== "transparent" && !/(?:,\s*0(?:\.0+)?\s*\)|\/\s*0(?:\.0+)?\s*\))$/.test(color);
    const shadowColors = style.boxShadow.match(/(?:rgba?|oklch|oklab|color)\([^)]*\)/g) ?? [];
    const shadowGeometry = style.boxShadow.replace(/(?:rgba?|oklch|oklab|color)\([^)]*\)/g, "");
    const visibleOutline =
      !["none", "hidden"].includes(style.outlineStyle) &&
      parseFloat(style.outlineWidth) > 0 &&
      opaque(style.outlineColor);
    const visibleShadow =
      style.boxShadow !== "none" &&
      shadowColors.some(opaque) &&
      [...shadowGeometry.matchAll(/(-?[\d.]+)px/g)].some((match) => Number(match[1]) > 0);
    return {
      focusVisible: element.matches(":focus-visible"),
      outlineWidth: style.outlineWidth,
      outlineStyle: style.outlineStyle,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      boxShadow: style.boxShadow,
      visibleOutline,
      visibleShadow,
      opacityProduct,
      bounds: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      },
      viewportBounds: { width: innerWidth, height: innerHeight },
      visibleBounds: visible,
      clippingAncestors,
    };
  });
}

type TransitionProof = {
  key: string;
  selected: string;
  tabId: string;
  panelId: string;
  panelAccessible: boolean;
  tabState: {
    role: string | null;
    selected: string | null;
    tabIndex: string | null;
    state: string | null;
  };
  peers: { id: string; selected: string | null; tabIndex: string | null }[];
  panelState: { role: string | null; labelledBy: string | null; state: string | null };
  screenshot?: string;
  indicator?: Awaited<ReturnType<typeof readIndicator>>;
};

async function settledTab(
  page: Page,
  list: Locator,
  name: string,
  options: { panelAccessible: boolean; panelScope: Locator },
): Promise<TransitionProof> {
  const tab = list.getByRole("tab", { name, exact: true });
  await expect(tab).toBeFocused();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(tab).toHaveAttribute("data-state", "active");
  await expect(tab).toHaveAttribute("tabindex", "0");
  await expect(list.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
  await expect(list.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
  await expect(list.locator('[role="tab"][aria-selected="false"]')).toHaveCount(
    (await list.getByRole("tab").count()) - 1,
  );
  await expect(list.locator('[role="tab"][aria-selected="false"][tabindex="-1"]')).toHaveCount(
    (await list.getByRole("tab").count()) - 1,
  );

  const tabId = await tab.getAttribute("id");
  const panelId = await tab.getAttribute("aria-controls");
  expect(tabId).toMatch(/\S+/);
  expect(panelId).toMatch(/\S+/);
  await expect(page.locator(`[id=${JSON.stringify(tabId)}]`)).toHaveCount(1);
  const panel = options.panelScope.locator(`[id=${JSON.stringify(panelId)}]`);
  await expect(panel).toHaveCount(1);
  await expect(page.locator(`[id=${JSON.stringify(panelId)}]`)).toHaveCount(1);
  await expect(panel).toHaveAttribute("role", "tabpanel");
  await expect(panel).toHaveAttribute("aria-labelledby", tabId!);
  await expect(panel).toHaveAttribute("data-state", "active");
  if (options.panelAccessible) {
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAccessibleName(name);
  } else {
    // The real modal Sheet intentionally hides background main from accessibility.
    // Validate the existing live DOM linkage without removing aria-hidden or inert.
    await expect(panel).toHaveAttribute("aria-label", name);
  }
  return {
    key: "click",
    selected: name,
    tabId: tabId!,
    panelId: panelId!,
    panelAccessible: options.panelAccessible,
    tabState: {
      role: await tab.getAttribute("role"),
      selected: await tab.getAttribute("aria-selected"),
      tabIndex: await tab.getAttribute("tabindex"),
      state: await tab.getAttribute("data-state"),
    },
    peers: await list.getByRole("tab").evaluateAll((tabs) =>
      tabs.map((item) => ({
        id: item.id,
        selected: item.getAttribute("aria-selected"),
        tabIndex: item.getAttribute("tabindex"),
      })),
    ),
    panelState: {
      role: await panel.getAttribute("role"),
      labelledBy: await panel.getAttribute("aria-labelledby"),
      state: await panel.getAttribute("data-state"),
    },
  };
}

async function keyboardTransition(
  page: Page,
  list: Locator,
  key: string,
  name: string,
  options: { panelAccessible: boolean; panelScope: Locator },
  info: TestInfo,
  index: number,
) {
  await page.keyboard.press(key);
  const proof = await settledTab(page, list, name, options);
  const tab = list.getByRole("tab", { name, exact: true });
  await expect(tab).toBeVisible();
  await expect.poll(() => tab.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  const indicator = await readIndicator(tab);
  expect(indicator.focusVisible).toBe(true);
  expect(indicator.visibleOutline || indicator.visibleShadow).toBe(true);
  expect(indicator.opacityProduct).toBeGreaterThan(0);
  expect(indicator.bounds.width).toBeGreaterThan(0);
  expect(indicator.bounds.height).toBeGreaterThan(0);
  expect(indicator.bounds.left).toBeGreaterThanOrEqual(indicator.visibleBounds.left - 0.5);
  expect(indicator.bounds.top).toBeGreaterThanOrEqual(indicator.visibleBounds.top - 0.5);
  expect(indicator.bounds.right).toBeLessThanOrEqual(indicator.visibleBounds.right + 0.5);
  expect(indicator.bounds.bottom).toBeLessThanOrEqual(indicator.visibleBounds.bottom + 0.5);
  const screenshot = info.outputPath(`${index}-${key}-${name.replaceAll(" ", "-")}.png`);
  await page.screenshot({ path: screenshot });
  return { ...proof, key, indicator, screenshot };
}

async function saveProof(
  info: TestInfo,
  proof: TransitionProof[],
  errors: string[],
  browserVersion: string,
) {
  const sourceSHA256: Record<string, string> = {};
  for (const filename of [
    "src/components/ui/tabs.tsx",
    "src/templates/business/miro.tsx",
    "src/templates/business/miro-settings.tsx",
    "src/blocks/application/navbar-variants/first-run/free/project-tabs.tsx",
  ]) {
    sourceSHA256[filename] = createHash("sha256")
      .update(await readFile(join(process.cwd(), filename)))
      .digest("hex");
  }
  await writeFile(
    info.outputPath("native-tabs-transitions.json"),
    JSON.stringify(
      {
        browser: info.project.use.browserName ?? "chromium",
        browserVersion,
        testTimeout: info.timeout,
        configuredRetries: info.project.retries,
        retryAttempt: info.retry,
        sourceSHA256,
        proof,
        errors,
        visualReview:
          "Computed indicator and clipping checks are automated; root must inspect screenshots.",
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}

for (const width of [1440, 390]) {
  test(`Miro ${width} vertical native tabs preserve ARIA, roving focus and panel linkage`, async ({
    page,
    browser,
  }, info) => {
    const proof: TransitionProof[] = [];
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await openMiro(page, width);
      await navigate(page, "Settings");
      const scope = width < 768 ? await navigation(page) : page.locator(".bt-sidebar");
      const list = scope.getByRole("tablist", { name: "Configuration sections", exact: true });
      await expect(list).toBeVisible();
      await expect(list).toHaveAttribute("role", "tablist");
      await expect(list).toHaveAttribute("aria-orientation", "vertical");
      await expect(list.getByRole("tab")).toHaveText(settingsSections);
      const options = { panelAccessible: width >= 768, panelScope: page.locator(".miro-settings") };
      await list.getByRole("tab", { name: "My Profile", exact: true }).click();
      proof.push(await settledTab(page, list, "My Profile", options));
      for (const [key, selected] of [
        ["ArrowDown", "Hours"],
        ["ArrowDown", "Chairs"],
        ["ArrowDown", "Procedures"],
        ["ArrowDown", "Billing"],
        ["ArrowDown", "Notifications"],
        ["ArrowUp", "Billing"],
        ["Home", "My Profile"],
        ["End", "Notifications"],
        ["ArrowDown", "My Profile"],
        ["ArrowUp", "Notifications"],
      ]) {
        proof.push(
          await keyboardTransition(page, list, key, selected, options, info, proof.length),
        );
      }
      if (width < 768) {
        await expect(page.locator(".bt-layout-mobile")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.locator(".bt-layout-mobile")).toBeHidden();
        await expect(
          page.getByRole("button", { name: "Toggle Sidebar", exact: true }),
        ).toBeFocused();
      }
      const finalPanel = page.getByRole("tabpanel", { name: "Notifications", exact: true });
      await expect(finalPanel).toBeVisible();
      await expect(finalPanel).toHaveAttribute("id", proof.at(-1)!.panelId);
      expect(errors).toEqual([]);
    } finally {
      await saveProof(info, proof, errors, browser.version());
    }
  });
}

test("navbar1 default horizontal free ProjectTabs keeps native Right and Left behavior", async ({
  page,
  browser,
}, info) => {
  const proof: TransitionProof[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openProjectNavbar(page);
    const scope = page.locator('[data-navbar-entry="1"]');
    const list = scope.locator(".navbar-project-tablist");
    await expect(list).toBeVisible();
    await expect(list).toHaveAttribute("role", "tablist");
    await expect(list).toHaveAttribute("aria-orientation", "horizontal");
    await expect(list.getByRole("tab")).toHaveText([
      "Overview",
      /^Tasks\s*24$/,
      "Files",
      "Activity",
      "Settings",
    ]);
    const options = { panelAccessible: true, panelScope: scope };
    await list.getByRole("tab", { name: "Overview", exact: true }).click();
    proof.push(await settledTab(page, list, "Overview", options));
    proof.push(await keyboardTransition(page, list, "ArrowRight", "Tasks 24", options, info, 1));
    await expect(page.getByLabel("Tasks demo content", { exact: true })).toBeVisible();
    proof.push(await keyboardTransition(page, list, "ArrowLeft", "Overview", options, info, 2));
    await expect(page.getByLabel("Overview demo content", { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await saveProof(info, proof, errors, browser.version());
  }
});
