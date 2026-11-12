import { createHash } from "node:crypto";
import { expect as baseExpect, type Locator, type Page, type TestInfo } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 5000 });

export const cohortStyles = [
  "nova",
  "vega",
  "maia",
  "lyra",
  "mira",
  "luma",
  "sera",
  "rhea",
] as const;
export type CohortStyle = (typeof cohortStyles)[number];

// Runtime contracts for the actual outline/sm/spacing=2 composition, not official page geometry.
// Source: toggle-group.ts profiles/dimensions/corners/typography; Nova toggleVariants and index.css.
// Normal public preset uses default 16px root, 0.25rem spacing and 0.625rem base radius.
const profiles = {
  nova: { height: 28, padding: 10, font: 12.8, radius: 8, weight: "500", uppercase: false },
  vega: { height: 32, padding: 10, font: 14, radius: 8, weight: "500", uppercase: false },
  maia: { height: 32, padding: 12, font: 14, radius: 26, weight: "500", uppercase: false },
  lyra: { height: 28, padding: 10, font: 12, radius: 0, weight: "500", uppercase: false },
  mira: { height: 24, padding: 8, font: 10, radius: 8, weight: "500", uppercase: false },
  luma: { height: 32, padding: 12, font: 14, radius: 22, weight: "500", uppercase: false },
  sera: { height: 36, padding: 16, font: 12, radius: 0, weight: "600", uppercase: true },
  rhea: { height: 28, padding: 10, font: 14, radius: 18, weight: "500", uppercase: false },
} as const;

export async function assertStyleProof(
  page: Page,
  group: Locator,
  primitive: "radix" | "base",
  style: CohortStyle,
  info: TestInfo,
) {
  const actual = await group.evaluate((element) => {
    const sheetElement = document.getElementById("preview-preset");
    const cssText = sheetElement?.textContent ?? "";
    const styleSheet = sheetElement instanceof HTMLStyleElement ? sheetElement.sheet : null;
    const first = element.querySelector("button");
    const matchedToggleRules: { selector: string; declarations: string }[] = [];
    let ruleCount = 0;
    const visit = (rules: CSSRuleList) => {
      for (const rule of rules) {
        ruleCount++;
        if (
          rule instanceof CSSStyleRule &&
          rule.selectorText.includes('data-slot="toggle-group-item"')
        ) {
          if (first?.matches(rule.selectorText))
            matchedToggleRules.push({
              selector: rule.selectorText,
              declarations: rule.style.cssText,
            });
        }
        if ("cssRules" in rule) visit((rule as CSSGroupingRule).cssRules);
      }
    };
    if (styleSheet) visit(styleSheet.cssRules);
    return {
      url: location.href,
      preset: JSON.parse(new URLSearchParams(location.hash.split("?")[1]).get("preset") ?? "null"),
      primitive: document.documentElement.dataset.uiPrimitive,
      style: document.documentElement.dataset.uiStyle,
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      cssText,
      connectedSheet: sheetElement?.isConnected === true && styleSheet !== null,
      ruleCount,
      styleMarkers: [...cssText.matchAll(/\/\* Bricklane: ([a-z]+) component style \*\//g)].map(
        (match) => match[1],
      ),
      matchedToggleRules,
      items: [...element.querySelectorAll<HTMLButtonElement>("button")].map((button) => {
        const computed = getComputedStyle(button);
        return {
          label: button.getAttribute("aria-label"),
          actualHeight: button.getBoundingClientRect().height,
          height: parseFloat(computed.height),
          paddingLeft: parseFloat(computed.paddingLeft),
          paddingRight: parseFloat(computed.paddingRight),
          fontSize: parseFloat(computed.fontSize),
          fontWeight: computed.fontWeight,
          radius: parseFloat(computed.borderTopLeftRadius),
          textTransform: computed.textTransform,
          letterSpacing: computed.letterSpacing,
        };
      }),
    };
  });
  const { cssText, ...record } = actual;
  await info.attach("actual-style-profile-proof", {
    body: JSON.stringify(
      {
        ...record,
        cssBytes: Buffer.byteLength(cssText),
        cssSha256: createHash("sha256").update(cssText).digest("hex"),
        expected: profiles[style],
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  expect(actual.preset).toEqual({ primitive, style, mode: "light" });
  expect(new URL(actual.url).pathname.endsWith("/base/")).toBe(primitive === "base");
  expect(actual.primitive).toBe(primitive);
  expect(actual.style).toBe(style);
  expect(actual.rootFontSize).toBe("16px");
  expect(actual.connectedSheet, "normal public preset installed a real connected stylesheet").toBe(
    true,
  );
  expect(actual.ruleCount).toBeGreaterThan(0);
  if (style === "nova") {
    expect(actual.styleMarkers).toEqual([]);
    expect(actual.matchedToggleRules).toEqual([]);
  } else {
    expect(actual.styleMarkers).toEqual([style]);
    expect(
      actual.matchedToggleRules.length,
      "actual style rules match the rendered free ToggleGroup item",
    ).toBeGreaterThan(0);
  }
  expect(actual.items).toHaveLength(7);
  const profile = profiles[style];
  for (const item of actual.items) {
    for (const [property, value] of [
      ["actualHeight", profile.height],
      ["height", profile.height],
      ["paddingLeft", profile.padding],
      ["paddingRight", profile.padding],
      ["fontSize", profile.font],
      ["radius", profile.radius],
    ] as const) {
      expect(
        Math.abs(item[property] - value),
        `${style} ${item.label}: actual ${property}`,
      ).toBeLessThanOrEqual(0.25);
    }
    expect(item.fontWeight, `${style} ${item.label}: actual font weight`).toBe(profile.weight);
    expect(item.textTransform, `${style} ${item.label}: actual case`).toBe(
      profile.uppercase ? "uppercase" : "none",
    );
    if (style === "sera") expect(parseFloat(item.letterSpacing)).toBeCloseTo(1.2, 2);
  }
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
}
