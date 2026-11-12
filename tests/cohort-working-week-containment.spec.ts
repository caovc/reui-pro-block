// Additive regression for COHORT-SET-01. Preserve the original two complete flows separately.
import {
  expect as baseExpect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { assertStyleProof, cohortStyles, type CohortStyle } from "./cohort-style-proof.helpers";

const expect = baseExpect.configure({ timeout: 5000 });

test.describe.configure({ retries: 0, timeout: 30000 });
test.use({ viewport: { width: 390, height: 844 }, actionTimeout: 5000, trace: "on" });

type Primitive = "radix" | "base";
type Style = CohortStyle;
const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
const working = (page: Page) => page.getByRole("region", { name: "Working week", exact: true });

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
  await expect(working(page)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return url;
}

async function geometry(group: Locator) {
  return group.evaluate((element) => {
    const box = (node: Element) => {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    const ancestors = [];
    let ancestor = element.parentElement;
    while (ancestor) {
      const rect = ancestor.getBoundingClientRect();
      const computed = getComputedStyle(ancestor);
      ancestors.push({
        slot: ancestor.getAttribute("data-slot"),
        className: ancestor.className,
        box: box(ancestor),
        clipBox: {
          x: rect.x + ancestor.clientLeft,
          y: rect.y + ancestor.clientTop,
          right: rect.x + ancestor.clientLeft + ancestor.clientWidth,
          bottom: rect.y + ancestor.clientTop + ancestor.clientHeight,
        },
        clipsX: /^(auto|scroll|hidden|clip)$/.test(computed.overflowX),
        clipsY: /^(auto|scroll|hidden|clip)$/.test(computed.overflowY),
        overflowX: computed.overflowX,
        overflowY: computed.overflowY,
        clientWidth: ancestor.clientWidth,
        scrollWidth: ancestor.scrollWidth,
        scrollLeft: ancestor.scrollLeft,
      });
      ancestor = ancestor.parentElement;
    }
    const groupStyle = getComputedStyle(element);
    return {
      group: box(element),
      groupStyle: {
        maxWidth: groupStyle.maxWidth,
        flexWrap: groupStyle.flexWrap,
        columnGap: groupStyle.columnGap,
        rowGap: groupStyle.rowGap,
      },
      viewport: { x: 0, y: 0, right: innerWidth, bottom: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      ancestors,
      items: [...element.querySelectorAll<HTMLButtonElement>("button")].map((button) => {
        const rect = button.getBoundingClientRect();
        const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        const hit = document.elementFromPoint(center.x, center.y);
        const range = document.createRange();
        range.selectNodeContents(button);
        const text = range.getBoundingClientRect();
        const computed = getComputedStyle(button);
        return {
          label: button.getAttribute("aria-label"),
          slot: button.getAttribute("data-slot"),
          size: button.getAttribute("data-size"),
          spacing: button.getAttribute("data-spacing"),
          pressed: button.getAttribute("aria-pressed"),
          tabIndex: button.getAttribute("tabindex"),
          box: box(button),
          textBox: { x: text.x, y: text.y, right: text.right, bottom: text.bottom },
          center,
          centerHitsSelf: hit !== null && (hit === button || button.contains(hit)),
          hit: hit?.outerHTML.slice(0, 600) ?? null,
          focusVisible: button.matches(":focus-visible"),
          visual: {
            boxShadow: computed.boxShadow,
            outlineStyle: computed.outlineStyle,
            outlineWidth: computed.outlineWidth,
            outlineColor: computed.outlineColor,
            borderColor: computed.borderColor,
          },
        };
      }),
    };
  });
}

type Geometry = Awaited<ReturnType<typeof geometry>>;
function expectReachable(actual: Geometry) {
  expect(actual.items.map((item) => item.label)).toEqual(weekdays);
  expect(actual.documentWidth).toBeLessThanOrEqual(actual.viewport.right);
  const tolerance = 0.75;
  for (const item of actual.items) {
    expect(item.slot).toBe("toggle-group-item");
    expect(item.size).toBe("sm");
    expect(item.spacing).toBe("2");
    expect(item.box.width).toBeGreaterThan(0);
    expect(item.box.height).toBeGreaterThan(0);
    const boundaries = [
      { name: "viewport", bounds: actual.viewport, clipsX: true, clipsY: true },
      { name: "group", bounds: actual.group, clipsX: true, clipsY: true },
      ...actual.ancestors.map((ancestor) => ({
        name: ancestor.slot ?? ancestor.className,
        bounds: ancestor.clipBox,
        clipsX: ancestor.clipsX,
        clipsY: ancestor.clipsY,
      })),
    ];
    for (const { name, bounds, clipsX, clipsY } of boundaries) {
      // Check the entire button against every actual clipping ancestor, not just its center.
      if (clipsX) {
        expect(item.box.x, `${item.label}: ${name} left`).toBeGreaterThanOrEqual(
          bounds.x - tolerance,
        );
        expect(item.box.right, `${item.label}: ${name} right`).toBeLessThanOrEqual(
          bounds.right + tolerance,
        );
      }
      if (clipsY) {
        expect(item.box.y, `${item.label}: ${name} top`).toBeGreaterThanOrEqual(
          bounds.y - tolerance,
        );
        expect(item.box.bottom, `${item.label}: ${name} bottom`).toBeLessThanOrEqual(
          bounds.bottom + tolerance,
        );
      }
    }
    expect(item.textBox.x, `${item.label} text left`).toBeGreaterThanOrEqual(
      item.box.x - tolerance,
    );
    expect(item.textBox.right, `${item.label} text right`).toBeLessThanOrEqual(
      item.box.right + tolerance,
    );
    expect(item.centerHitsSelf, `${item.label} actual center hits the native button`).toBe(true);
  }
  for (let i = 0; i < actual.items.length; i++) {
    for (let j = i + 1; j < actual.items.length; j++) {
      const a = actual.items[i].box;
      const b = actual.items[j].box;
      const overlapX = Math.min(a.right, b.right) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
      expect(
        overlapX > tolerance && overlapY > tolerance,
        `${actual.items[i].label} and ${actual.items[j].label} do not overlap`,
      ).toBe(false);
    }
  }
}

async function attach(info: TestInfo, name: string, actual: unknown) {
  await info.attach(name, {
    body: JSON.stringify(actual, null, 2),
    contentType: "application/json",
  });
}

async function focusedDay(
  group: Locator,
  name: string,
  selection: string[],
  baseline: Geometry,
  info: TestInfo,
) {
  const target = group.getByRole("button", { name, exact: true });
  await expect(target).toBeFocused();
  await expect(target).toHaveAttribute("tabindex", "0");
  await expect.poll(() => target.evaluate((button) => button.matches(":focus-visible"))).toBe(true);
  const before = baseline.items.find((item) => item.label === name)!.visual;
  await expect
    .poll(() =>
      target.evaluate((button, previous) => {
        const visual = getComputedStyle(button);
        const shadowChanged =
          visual.boxShadow !== "none" && visual.boxShadow !== previous.boxShadow;
        const outlineChanged =
          visual.outlineStyle !== "none" &&
          parseFloat(visual.outlineWidth) > 0 &&
          (visual.outlineStyle !== previous.outlineStyle ||
            visual.outlineWidth !== previous.outlineWidth ||
            visual.outlineColor !== previous.outlineColor);
        return button.matches(":focus-visible") && (shadowChanged || outlineChanged);
      }, before),
    )
    .toBe(true);
  const actual = await geometry(group);
  await attach(info, `keyboard-${name.toLowerCase()}`, actual);
  expectReachable(actual);
  expect(actual.items.map((item) => item.tabIndex)).toEqual(
    weekdays.map((day) => (day === name ? "0" : "-1")),
  );
  expect(actual.items.map((item) => item.pressed)).toEqual(selection);
  const focused = actual.items.find((item) => item.label === name)!;
  expect(focused.focusVisible).toBe(true);
  const visual = focused.visual;
  expect(
    visual.boxShadow !== "none" ||
      (visual.outlineStyle !== "none" && parseFloat(visual.outlineWidth) > 0),
    `${name} paints a keyboard focus indicator`,
  ).toBe(true);
}

for (const primitive of ["radix", "base"] as const) {
  for (const style of cohortStyles) {
    test(`Cohort Working days all seven phone controls stay reachable ${primitive} ${style}`, async ({
      page,
      baseURL,
    }, info) => {
      if (!baseURL) throw new Error("Set PREVIEW_URL to the exact frozen production candidate.");
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(`pageerror: ${error.message}`));
      page.on("console", (message) => {
        if (["warning", "error"].includes(message.type()))
          faults.push(`${message.type()}: ${message.text()}`);
      });
      const evidence: unknown[] = [];
      try {
        const entry = await openOrganisation(page, baseURL, primitive, style);
        const group = working(page).getByRole("group", { name: "Working days", exact: true });
        await expect(group).toHaveAttribute("data-slot", "toggle-group");
        await expect(group).toHaveAttribute("data-variant", "outline");
        await expect(group).toHaveAttribute("data-size", "sm");
        await expect(group).toHaveAttribute("data-spacing", "2");
        await expect(group.getByRole("button")).toHaveCount(7);
        await group.scrollIntoViewIfNeeded();
        await assertStyleProof(page, group, primitive, style, info);
        const initial = await geometry(group);
        evidence.push({ phase: "initial", entry, actual: initial });
        await attach(info, "initial-seven-controls", initial);
        await working(page).screenshot({ path: info.outputPath("working-week-initial.png") });
        expectReachable(initial);
        const initialSelection = ["true", "true", "true", "true", "true", "false", "false"];
        expect(initial.items.map((item) => item.pressed)).toEqual(initialSelection);
        for (const name of weekdays) {
          const button = group.getByRole("button", { name, exact: true });
          const wasPressed = await button.getAttribute("aria-pressed");
          const rect = await button.boundingBox();
          expect(rect).not.toBeNull();
          // Native pointer at the button's actual center; no force or synthetic click.
          await button.click({ position: { x: rect!.width / 2, y: rect!.height / 2 } });
          await expect(button).toHaveAttribute(
            "aria-pressed",
            wasPressed === "true" ? "false" : "true",
          );
          await expect(button).toBeFocused();
          await button.click({ position: { x: rect!.width / 2, y: rect!.height / 2 } });
          await expect(button).toHaveAttribute("aria-pressed", wasPressed!);
          evidence.push({ phase: "pointer-restored", name, actual: await geometry(group) });
        }
        await expect(working(page).getByRole("status")).toHaveText("All changes saved");
        await group.getByRole("button", { name: "Monday", exact: true }).click();
        const selection = (await geometry(group)).items.map((item) => item.pressed!);
        await page.keyboard.press("ArrowRight");
        await focusedDay(group, "Tuesday", selection, initial, info);
        await page.keyboard.press("Home");
        await focusedDay(group, "Monday", selection, initial, info);
        for (const name of weekdays.slice(1)) {
          await page.keyboard.press("ArrowRight");
          await focusedDay(group, name, selection, initial, info);
        }
        await working(page).screenshot({
          path: info.outputPath("working-week-sunday-keyboard.png"),
        });
        await page.keyboard.press("Space");
        await expect(group.getByRole("button", { name: "Sunday", exact: true })).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await page.keyboard.press("Space");
        await expect(group.getByRole("button", { name: "Sunday", exact: true })).toHaveAttribute(
          "aria-pressed",
          "false",
        );
        await page.keyboard.press("Home");
        await focusedDay(group, "Monday", selection, initial, info);
        await page.keyboard.press("End");
        await focusedDay(group, "Sunday", selection, initial, info);
        await page.keyboard.press("ArrowLeft");
        await focusedDay(group, "Saturday", selection, initial, info);
        await working(page).getByRole("button", { name: "Discard", exact: true }).click();
        await expect(working(page).getByRole("status")).toHaveText("All changes saved");
        expect((await geometry(group)).items.map((item) => item.pressed)).toEqual(initialSelection);
        await expect(page.locator("vite-error-overlay")).toHaveCount(0);
        expect(faults).toEqual([]);
      } finally {
        await attach(info, "pointer-evidence", evidence);
        await attach(info, "runtime-faults", faults);
      }
    });
  }
}
