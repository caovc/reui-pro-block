import {
  test,
  expect as baseExpect,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

type Primitive = "radix" | "base";
type Style = "sera";
type Section = "departments" | "locations";
type Bounds = { x: number; y: number; right: number; bottom: number };
type Geometry = Awaited<ReturnType<typeof measure>>;
const expect = baseExpect.configure({ timeout: 5000 });
const tolerance = 0.75;
const titles = { departments: "Departments", locations: "Locations" } as const;
const seeds = { departments: "Engineering", locations: "London" } as const;
const initialRows = {
  departments: [
    "Engineering",
    "Product",
    "Design",
    "Sales",
    "Marketing",
    "Customer Success",
    "People",
    "Finance",
  ],
  locations: ["London", "Lisbon", "Berlin"],
} as const;
const frame = (page: Page, section: Section) =>
  page.getByRole("region", { name: titles[section], exact: true });
const footer = (page: Page, section: Section) =>
  frame(page, section).locator(':scope > [data-slot="frame-panel-footer"]');

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

async function closeMenu(page: Page) {
  const menu = page.getByRole("dialog", { name: "Cohort", exact: true });
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
}

async function openOrganisation(page: Page, baseURL: string, primitive: Primitive) {
  const root = new URL("./", baseURL);
  if (root.pathname.endsWith("/base/")) root.pathname = root.pathname.slice(0, -5);
  const entry = new URL(primitive === "base" ? "base/" : "./", root);
  const query = new URLSearchParams({
    preset: JSON.stringify({ primitive, style: "sera", mode: "light" }),
  });
  const url = `${entry.href}#/template-preview/cohort?${query}`;
  await page.goto(url);
  await expect(page).toHaveURL(url);
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", "sera");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".bt-cohort")).toBeVisible();
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "Cohort", exact: true });
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name: "Settings", exact: true }).click();
  await menu.getByRole("button", { name: "Organisation", exact: true }).click();
  await closeMenu(page);
  await page.evaluate(() => document.fonts.ready);
}

// Follow actual DOM Tab order from the edited cell; never assign document.activeElement.
async function tabToDiscard(page: Page, discard: Locator, info: TestInfo, phase: string) {
  for (let index = 0; index < 24; index++) {
    await page.keyboard.press("Tab");
    if (await discard.evaluate((node) => node === document.activeElement)) {
      await keyboardFocus(page, discard, info, phase);
      return;
    }
  }
  throw new Error("Native Tab did not reach the enabled footer Discard within one list traversal");
}

async function measure(page: Page, section: Section) {
  return footer(page, section).evaluate((element) => {
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
  for (const width of [320, 390] as const) {
    for (const section of ["departments", "locations"] as const) {
      test(`Cohort list footer full text and native state ${primitive} sera ${width}px ${section}`, async ({
        page,
        context,
        baseURL,
      }, info) => {
        if (!baseURL) throw new Error("Configure a preview baseURL for the settings flow");
        await page.setViewportSize({ width, height: 844 });
        const faults: string[] = [];
        const blocked: { method: string; pathname: string }[] = [];
        const samples: { phase: string; actual: Geometry }[] = [];
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
          await footer(page, section).scrollIntoViewIfNeeded();
          const actual = await measure(page, section);
          const value = { phase, actual };
          samples.push(value);
          await attach(info, phase, value);
          if (screenshot) await page.screenshot({ path: info.outputPath(`${phase}.png`) });
          return actual;
        };
        try {
          await openOrganisation(page, baseURL, primitive);
          const current = frame(page, section);
          await expect(current).toHaveAttribute("data-slot", "frame");
          await expect(current).toHaveAttribute("data-setting-section", section);
          await expect(footer(page, section)).toHaveCount(1);
          await expect(current.getByRole("status")).toHaveText("All changes saved");
          await expect(current.locator(".bt-setting-cell")).toHaveText([...initialRows[section]]);
          const seed = seeds[section];
          const changed = `${seed} Operations`;
          await expect(current.getByRole("button", { name: seed, exact: true })).toBeVisible();
          const clean = await sample("clean", true);
          await current.getByRole("button", { name: seed, exact: true }).click();
          const input = current.getByRole("textbox", {
            name: `${titles[section]} name`,
            exact: true,
          });
          await expect(input).toBeFocused();
          await input.fill(changed);
          await expect(input).toHaveValue(changed);
          await expect(current.getByRole("status")).toHaveText("Unsaved changes");
          const dirty = await sample("dirty", true);
          // Preserve both actual states before reporting original geometry failures.
          assertGeometry(clean, false, primitive, "sera");
          assertGeometry(dirty, true, primitive, "sera");
          const discard = current.getByRole("button", { name: "Discard", exact: true });
          const save = current.getByRole("button", { name: "Save changes", exact: true });
          await tabToDiscard(page, discard, info, "keyboard-discard");
          await page.keyboard.press("Enter");
          await expect(input).toHaveValue(seed);
          await expect(current.getByRole("status")).toHaveText("All changes saved");
          assertGeometry(await sample("discard-restored"), false, primitive, "sera");
          await page.keyboard.press("Tab");
          const disabledFocused = await footer(page, section).evaluate((element) =>
            [...element.querySelectorAll("button")].some(
              (button) => button === document.activeElement,
            ),
          );
          expect(disabledFocused).toBe(false);
          await input.fill(changed);
          await expect(current.getByRole("status")).toHaveText("Unsaved changes");
          await tabToDiscard(page, discard, info, "second-keyboard-discard");
          await page.keyboard.press("Tab");
          await keyboardFocus(page, save, info, "keyboard-save");
          await page.keyboard.press("Shift+Tab");
          await keyboardFocus(page, discard, info, "keyboard-reverse-discard");
          await page.keyboard.press("Tab");
          await keyboardFocus(page, save, info, "keyboard-return-save");
          await page.keyboard.press("Enter");
          await expect(input).toHaveValue(changed);
          await expect(current.getByRole("status")).toHaveText("All changes saved");
          assertGeometry(await sample("saved"), false, primitive, "sera");
          await page.getByRole("button", { name: "Open menu", exact: true }).click();
          const menu = page.getByRole("dialog", { name: "Cohort", exact: true });
          await menu.getByRole("button", { name: "Policies", exact: true }).click();
          await menu.getByRole("button", { name: "Organisation", exact: true }).click();
          await closeMenu(page);
          await expect(current.getByRole("button", { name: changed, exact: true })).toBeVisible();
          await expect(current.getByRole("button", { name: seed, exact: true })).toHaveCount(0);
          await expect(current.locator(".bt-setting-cell")).toHaveText([
            changed,
            ...initialRows[section].slice(1),
          ]);
          await expect(current.getByRole("status")).toHaveText("All changes saved");
          assertGeometry(await sample("saved-after-route-return", true), false, primitive, "sera");
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
}
