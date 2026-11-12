// Additive regression for COHORT-SET-02. Keep the original complete Cohort flows unchanged.
import {
  test,
  expect as baseExpect,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import type { CohortStyle } from "./cohort-style-proof.helpers";

type Primitive = "radix" | "base";
type Style = Extract<CohortStyle, "nova" | "sera">;
type Bounds = { x: number; y: number; right: number; bottom: number };
type Geometry = Awaited<ReturnType<typeof measure>>;

const expect = baseExpect.configure({ timeout: 5000 });
const tolerance = 0.75;
const initialDays = [true, true, true, true, true, false, false];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const working = (page: Page) => page.getByRole("region", { name: "Working week", exact: true });
const footer = (page: Page) => working(page).locator(':scope > [data-slot="frame-panel-footer"]');
const group = (page: Page) =>
  working(page).getByRole("group", { name: "Working days", exact: true });

test.describe.configure({ timeout: 30000, retries: 0 });
test.use({
  viewport: { width: 390, height: 844 },
  actionTimeout: 5000,
  navigationTimeout: 30000,
  trace: "on",
});

async function attach(info: TestInfo, name: string, value: unknown) {
  await info.attach(name, {
    body: JSON.stringify(value, null, 2),
    contentType: "application/json",
  });
}

async function openOrganisation(page: Page, baseURL: string, primitive: Primitive, style: Style) {
  const root = new URL("./", baseURL);
  if (root.pathname.endsWith("/base/")) root.pathname = root.pathname.slice(0, -5);
  const entry = new URL(primitive === "base" ? "base/" : "./", root);
  const query = new URLSearchParams({
    preset: JSON.stringify({ primitive, style, mode: "light" }),
  });
  const url = `${entry.href}#/template-preview/cohort?${query}`;
  await page.goto(url);
  await expect(page).toHaveURL(url);
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".bt-cohort")).toBeVisible();
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "Cohort", exact: true });
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name: "Settings", exact: true }).click();
  await menu.getByRole("button", { name: "Organisation", exact: true }).click();
  await expect(menu.getByRole("button", { name: "Organisation", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  await expect(working(page)).toHaveAttribute("data-slot", "frame");
  await expect(working(page)).toHaveAttribute("data-setting-section", "working");
  await expect(footer(page)).toHaveCount(1);
  await expect(group(page)).toHaveAttribute("data-slot", "toggle-group");
  await expect(group(page).getByRole("button")).toHaveCount(7);
  await page.evaluate(() => document.fonts.ready);
}

async function selection(page: Page) {
  return Promise.all(
    weekdays.map(
      async (name) =>
        (await group(page)
          .getByRole("button", { name, exact: true })
          .getAttribute("aria-pressed")) === "true",
    ),
  );
}

async function measure(page: Page) {
  return footer(page).evaluate((element) => {
    const box = (node: Element) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const rect = (r: DOMRect) => ({
      x: r.x,
      y: r.y,
      right: r.right,
      bottom: r.bottom,
      width: r.width,
      height: r.height,
    });
    const visual = (node: Element) => {
      const s = getComputedStyle(node);
      return {
        display: s.display,
        flexDirection: s.flexDirection,
        flexWrap: s.flexWrap,
        flexShrink: s.flexShrink,
        gap: s.gap,
        minWidth: s.minWidth,
        maxWidth: s.maxWidth,
        fontSize: s.fontSize,
        fontFamily: s.fontFamily,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        textTransform: s.textTransform,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        height: s.height,
        borderRadius: s.borderRadius,
        pointerEvents: s.pointerEvents,
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        boxShadow: s.boxShadow,
        overflowX: s.overflowX,
        overflowY: s.overflowY,
      };
    };
    const textRanges = (node: Node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0).map(rect);
    };
    const hit = (node: Node, r: Bounds & { width: number; height: number }) => {
      const center = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      const actual = document.elementFromPoint(center.x, center.y);
      return {
        center,
        hitsSelf: actual !== null && (actual === node || node.contains(actual)),
        target: actual
          ? {
              tag: actual.tagName,
              slot: actual.getAttribute("data-slot"),
              role: actual.getAttribute("role"),
            }
          : null,
      };
    };
    const status = element.querySelector(':scope > [role="status"]');
    const actions = element.querySelector(":scope > div");
    if (!status || !actions) throw new Error("Actual FrameFooter/status/actions anatomy changed");
    const ancestors = [];
    for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
      const s = getComputedStyle(ancestor);
      const r = ancestor.getBoundingClientRect();
      ancestors.push({
        slot: ancestor.getAttribute("data-slot"),
        tag: ancestor.tagName,
        box: box(ancestor),
        clipBox: {
          x: r.x + ancestor.clientLeft,
          y: r.y + ancestor.clientTop,
          right: r.x + ancestor.clientLeft + ancestor.clientWidth,
          bottom: r.y + ancestor.clientTop + ancestor.clientHeight,
        },
        clipsX: /^(auto|scroll|hidden|clip)$/.test(s.overflowX),
        clipsY: /^(auto|scroll|hidden|clip)$/.test(s.overflowY),
        overflowX: s.overflowX,
        overflowY: s.overflowY,
      });
    }
    const s = getComputedStyle(element);
    const f = element.getBoundingClientRect();
    const statusRanges = textRanges(status);
    const stylesheet = document.getElementById("preview-preset");
    const matchedButtonRules: { selector: string; declarations: string }[] = [];
    const first = actions.querySelector("button");
    const visit = (rules: CSSRuleList) => {
      for (const rule of rules) {
        if (
          rule instanceof CSSStyleRule &&
          rule.selectorText.includes('data-slot="button"') &&
          first?.matches(rule.selectorText)
        )
          matchedButtonRules.push({
            selector: rule.selectorText,
            declarations: rule.style.cssText,
          });
        if ("cssRules" in rule) visit((rule as CSSGroupingRule).cssRules);
      }
    };
    if (stylesheet instanceof HTMLStyleElement && stylesheet.sheet)
      visit(stylesheet.sheet.cssRules);
    return {
      measuredAtUTC: new Date().toISOString(),
      url: location.href,
      title: document.title,
      primitive: document.documentElement.dataset.uiPrimitive,
      style: document.documentElement.dataset.uiStyle,
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      viewport: { x: 0, y: 0, right: innerWidth, bottom: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      footer: box(element),
      footerStyle: visual(element),
      contentBox: {
        x: f.x + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft),
        y: f.y + parseFloat(s.borderTopWidth) + parseFloat(s.paddingTop),
        right: f.right - parseFloat(s.borderRightWidth) - parseFloat(s.paddingRight),
        bottom: f.bottom - parseFloat(s.borderBottomWidth) - parseFloat(s.paddingBottom),
      },
      actions: box(actions),
      actionsStyle: visual(actions),
      ancestors,
      status: {
        text: status.textContent,
        box: box(status),
        ranges: statusRanges,
        rangeHits: statusRanges.map((r) => hit(status, r)),
        visual: visual(status),
      },
      buttons: [...actions.querySelectorAll("button")].map((button) => ({
        label: button.textContent!.trim(),
        tag: button.tagName,
        slot: button.getAttribute("data-slot"),
        variant: button.getAttribute("data-variant"),
        size: button.getAttribute("data-size"),
        disabled: button.disabled,
        ariaDisabled: button.getAttribute("aria-disabled"),
        box: box(button),
        ranges: textRanges(button),
        centerHit: hit(button, box(button)),
        focused: document.activeElement === button,
        focusVisible: button.matches(":focus-visible"),
        visual: visual(button),
      })),
      presetProof: {
        connected: stylesheet?.isConnected === true,
        matchedButtonRules,
        styleMarkers: [
          ...(stylesheet?.textContent ?? "").matchAll(
            /\/\* Bricklane: ([a-z]+) component style \*\//g,
          ),
        ].map((m) => m[1]),
      },
    };
  });
}

function expectBounds(rect: Bounds, bounds: Bounds, label: string) {
  expect.soft(rect.x, `${label} left`).toBeGreaterThanOrEqual(bounds.x - tolerance);
  expect.soft(rect.right, `${label} right`).toBeLessThanOrEqual(bounds.right + tolerance);
  expect.soft(rect.y, `${label} top`).toBeGreaterThanOrEqual(bounds.y - tolerance);
  expect.soft(rect.bottom, `${label} bottom`).toBeLessThanOrEqual(bounds.bottom + tolerance);
}

function overlap(a: Bounds, b: Bounds) {
  return (
    Math.min(a.right, b.right) - Math.max(a.x, b.x) > tolerance &&
    Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > tolerance
  );
}

function assertGeometry(actual: Geometry, dirty: boolean, primitive: Primitive, style: Style) {
  expect(actual.primitive).toBe(primitive);
  expect(actual.style).toBe(style);
  expect(actual.rootFontSize).toBe("16px");
  expect(actual.presetProof.connected).toBe(true);
  expect(actual.presetProof.styleMarkers).toEqual(style === "sera" ? ["sera"] : []);
  if (style === "sera") expect(actual.presetProof.matchedButtonRules.length).toBeGreaterThan(0);
  expect(actual.status.text).toBe(dirty ? "Unsaved changes" : "All changes saved");
  expect(actual.buttons.map((b) => b.label)).toEqual(["Discard", "Save changes"]);
  expect(actual.buttons.map((b) => b.disabled)).toEqual([!dirty, !dirty]);
  expect.soft(actual.documentWidth).toBeLessThanOrEqual(actual.viewport.right);
  expectBounds(actual.status.box, actual.contentBox, "status/actual footer content");
  expectBounds(actual.actions, actual.contentBox, "actions/actual footer content");
  expect.soft(actual.status.ranges.length).toBeGreaterThan(0);
  for (const [index, hit] of actual.status.rangeHits.entries())
    expect
      .soft(hit.hitsSelf, `status text fragment ${index} has no covering element at its center`)
      .toBe(true);
  const parts = [
    { name: "status", box: actual.status.box },
    ...actual.status.ranges.map((r, i) => ({ name: `status text fragment ${i}`, box: r })),
  ];
  for (const [i, b] of actual.buttons.entries()) {
    expect(b.tag).toBe("BUTTON");
    expect(b.slot).toBe("button");
    expect(b.size).toBe("default");
    expect(b.variant).toBe(i === 0 ? "outline" : "default");
    expect.soft(b.box.width).toBeGreaterThan(0);
    expect.soft(b.box.height).toBeGreaterThan(0);
    expectBounds(b.box, actual.actions, `${b.label}/actions`);
    expectBounds(b.box, actual.contentBox, `${b.label}/footer content`);
    for (const [j, range] of b.ranges.entries())
      expectBounds(range, b.box, `${b.label} text ${j}/button`);
    if (dirty) expect.soft(b.centerHit.hitsSelf, `${b.label} enabled center hit`).toBe(true);
    // Disabled free Buttons legitimately use pointer-events:none. Record their hit result,
    // but do not pretend a disabled target should accept a pointer or keyboard activation.
    parts.push(
      { name: b.label, box: b.box },
      ...b.ranges.map((r, j) => ({ name: `${b.label} text ${j}`, box: r })),
    );
    for (const range of actual.status.ranges)
      expect
        .soft(overlap(range, b.box), `status text does not paint beneath ${b.label}`)
        .toBe(false);
    if (style === "sera") {
      expect(b.visual.fontSize).toBe("12px");
      expect(b.visual.fontWeight).toBe("600");
      expect(b.visual.textTransform).toBe("uppercase");
      expect(parseFloat(b.visual.letterSpacing)).toBeCloseTo(1.2, 2);
      expect(b.visual.paddingLeft).toBe("24px");
      expect(b.visual.paddingRight).toBe("24px");
      expect(b.visual.borderRadius).toBe("0px");
    }
  }
  for (const [i, range] of actual.status.ranges.entries())
    expectBounds(range, actual.status.box, `status text ${i}/status box`);
  expect
    .soft(
      overlap(actual.buttons[0].box, actual.buttons[1].box),
      "two native buttons do not overlap",
    )
    .toBe(false);
  expect
    .soft(overlap(actual.status.box, actual.actions), "status box and actions do not overlap")
    .toBe(false);
  for (const part of parts) {
    expectBounds(part.box, actual.viewport, `${part.name}/viewport`);
    for (const ancestor of actual.ancestors) {
      const bounds = ancestor.clipBox;
      const label = `${part.name}/${ancestor.slot ?? ancestor.tag}`;
      if (ancestor.clipsX) {
        expect
          .soft(part.box.x, `${label} clipped left`)
          .toBeGreaterThanOrEqual(bounds.x - tolerance);
        expect
          .soft(part.box.right, `${label} clipped right`)
          .toBeLessThanOrEqual(bounds.right + tolerance);
      }
      if (ancestor.clipsY) {
        expect
          .soft(part.box.y, `${label} clipped top`)
          .toBeGreaterThanOrEqual(bounds.y - tolerance);
        expect
          .soft(part.box.bottom, `${label} clipped bottom`)
          .toBeLessThanOrEqual(bounds.bottom + tolerance);
      }
    }
  }
}

async function keyboardFocus(page: Page, button: Locator, info: TestInfo, name: string) {
  await expect(button).toBeFocused();
  const value = await button.evaluate((node) => {
    const s = getComputedStyle(node);
    return {
      label: node.textContent!.trim(),
      focusVisible: node.matches(":focus-visible"),
      boxShadow: s.boxShadow,
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
    };
  });
  await attach(info, name, value);
  expect(value.focusVisible).toBe(true);
  expect(
    value.boxShadow !== "none" ||
      (value.outlineStyle !== "none" && parseFloat(value.outlineWidth) > 0),
  ).toBe(true);
}

for (const primitive of ["radix", "base"] as const) {
  for (const { style, width } of [
    { style: "sera", width: 390 },
    { style: "sera", width: 320 },
    { style: "nova", width: 390 },
  ] as const) {
    test(`Cohort footer full text and native actions ${primitive} ${style} ${width}px`, async ({
      page,
      context,
      baseURL,
    }, info) => {
      if (!baseURL) throw new Error("Bind the exact immutable production preview before running.");
      await page.setViewportSize({ width, height: 844 });
      const faults: string[] = [];
      const blocked: { method: string; pathname: string }[] = [];
      const samples: { phase: string; selection: boolean[]; actual: Geometry }[] = [];
      const origin = new URL(baseURL).origin;
      page.on("pageerror", (error) => faults.push(`pageerror: ${error.message}`));
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type()))
          faults.push(`${message.type()}: ${message.text()}`);
      });
      await context.route("**/*", (route) => {
        const request = route.request();
        if (
          !["GET", "HEAD"].includes(request.method()) ||
          (request.isNavigationRequest() && new URL(request.url()).origin !== origin)
        ) {
          blocked.push({ method: request.method(), pathname: new URL(request.url()).pathname });
          return route.abort("blockedbyclient");
        }
        return route.continue();
      });
      await context.routeWebSocket("**/*", (socket) => socket.close());
      const sample = async (phase: string, screenshot = false) => {
        await footer(page).scrollIntoViewIfNeeded();
        const actual = await measure(page);
        const value = { phase, selection: await selection(page), actual };
        samples.push(value);
        await attach(info, phase, value);
        if (screenshot) await page.screenshot({ path: info.outputPath(`${phase}.png`) });
        return actual;
      };
      try {
        await openOrganisation(page, baseURL, primitive, style);
        await expect(working(page).getByRole("status")).toHaveText("All changes saved");
        expect(await selection(page)).toEqual(initialDays);
        const clean = await sample("clean", true);
        await group(page).getByRole("button", { name: "Monday", exact: true }).click();
        await expect(working(page).getByRole("status")).toHaveText("Unsaved changes");
        const dirtyDays = [false, true, true, true, true, false, false];
        expect(await selection(page)).toEqual(dirtyDays);
        const dirty = await sample("dirty", true);
        // Preserve both native clean/dirty measurements before reporting baseline geometry failures.
        // These soft geometry assertions still make the original baseline case genuinely fail.
        assertGeometry(clean, false, primitive, style);
        assertGeometry(dirty, true, primitive, style);
        await page.keyboard.press("End");
        await expect(
          group(page).getByRole("button", { name: "Sunday", exact: true }),
        ).toBeFocused();
        expect(await selection(page)).toEqual(dirtyDays);
        await page.keyboard.press("Tab");
        const discard = working(page).getByRole("button", { name: "Discard", exact: true });
        const save = working(page).getByRole("button", { name: "Save changes", exact: true });
        await keyboardFocus(page, discard, info, "keyboard-discard");
        await page.keyboard.press("Enter");
        await expect(working(page).getByRole("status")).toHaveText("All changes saved");
        expect(await selection(page)).toEqual(initialDays);
        assertGeometry(await sample("discard-restored"), false, primitive, style);
        await page.keyboard.press("Tab");
        const cleanTabExit = await footer(page).evaluate((element) => ({
          activeTag: document.activeElement?.tagName,
          activeSlot: document.activeElement?.getAttribute("data-slot"),
          anyDisabledFooterActionFocused: [...element.querySelectorAll("button")].some(
            (button) => button === document.activeElement,
          ),
        }));
        await attach(info, "clean-disabled-actions-skipped-by-native-tab", cleanTabExit);
        expect(cleanTabExit.anyDisabledFooterActionFocused).toBe(false);
        await group(page).getByRole("button", { name: "Monday", exact: true }).click();
        await expect(working(page).getByRole("status")).toHaveText("Unsaved changes");
        await page.keyboard.press("End");
        await expect(
          group(page).getByRole("button", { name: "Sunday", exact: true }),
        ).toBeFocused();
        await page.keyboard.press("Tab");
        await keyboardFocus(page, discard, info, "second-keyboard-discard");
        await page.keyboard.press("Tab");
        await keyboardFocus(page, save, info, "keyboard-save");
        await page.keyboard.press("Shift+Tab");
        await keyboardFocus(page, discard, info, "keyboard-reverse-discard");
        await page.keyboard.press("Tab");
        await keyboardFocus(page, save, info, "keyboard-return-save");
        expect(await selection(page)).toEqual(dirtyDays);
        await page.keyboard.press("Enter");
        await expect(working(page).getByRole("status")).toHaveText("All changes saved");
        expect(await selection(page)).toEqual(dirtyDays);
        assertGeometry(await sample("saved"), false, primitive, style);
        await page.getByRole("button", { name: "Open menu", exact: true }).click();
        const menu = page.getByRole("dialog", { name: "Cohort", exact: true });
        await expect(menu.getByRole("button", { name: "Policies", exact: true })).toBeVisible();
        await menu.getByRole("button", { name: "Policies", exact: true }).click();
        await menu.getByRole("button", { name: "Organisation", exact: true }).click();
        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
        await expect(working(page).getByRole("status")).toHaveText("All changes saved");
        expect(await selection(page)).toEqual(dirtyDays);
        assertGeometry(await sample("saved-after-route-return", true), false, primitive, style);
        await expect(page.locator("vite-error-overlay")).toHaveCount(0);
        expect(blocked).toEqual([]);
        expect(faults).toEqual([]);
      } finally {
        await attach(info, "all-live-footer-measurements", samples);
        await attach(info, "runtime-faults", faults);
        await attach(info, "blocked-requests", blocked);
      }
    });
  }
}
