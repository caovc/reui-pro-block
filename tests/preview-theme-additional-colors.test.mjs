import assert from "node:assert/strict";
import { test } from "node:test";
import {
  accents,
  defaultTheme,
  loadTheme,
  normalizeTheme,
  previewThemeStorageKey,
  readTheme,
  themeCSS,
  themeOptions,
} from "../src/components/site/preview-theme.ts";
import { additionalThemeColors } from "./fixtures/additional-theme-colors.ts";

function withBrowserInput(entries, hash, check) {
  const descriptors = Object.fromEntries(
    ["localStorage", "location"].map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ]),
  );
  const values = new Map(Object.entries(entries));
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (key) => values.get(key) ?? null },
  });
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { hash },
  });
  try {
    check();
  } finally {
    for (const [name, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
}

test("the twelve existing palette contracts retain their values", () => {
  const original = {
    neutral: "#262626",
    blue: "#2563eb",
    emerald: "#047857",
    violet: "#7c3aed",
    orange: "#c2410c",
    rose: "#be123c",
    red: "#dc2626",
    amber: "#b45309",
    teal: "#0f766e",
    cyan: "#0e7490",
    indigo: "#4f46e5",
    pink: "#be185d",
  };
  for (const [key, value] of Object.entries(original)) assert.equal(accents[key], value);
});

for (const expected of additionalThemeColors) {
  test(`${expected.label} survives normalization and preset input`, () => {
    assert.ok(themeOptions.accent.includes(expected.key));
    assert.equal(normalizeTheme({ accent: expected.key }).accent, expected.key);
    assert.equal(
      readTheme(new URLSearchParams({ preset: JSON.stringify({ accent: expected.key }) })).accent,
      expected.key,
    );
  });

  test(`${expected.label} exports measured light, dark and template foreground values`, () => {
    const css = themeCSS({ ...defaultTheme, accent: expected.key });
    assert.ok(css.includes(`--primary: ${expected.light};`));
    assert.ok(css.includes(`--primary-foreground: ${expected.foreground};`));
    assert.ok(css.includes(`--primary: ${expected.dark};`));
    assert.ok(
      css.includes(
        `.ct-lime-cta { --primary-foreground: ${expected.foreground}; color: var(--primary-foreground); }`,
      ),
    );
    assert.ok(
      css.includes(`:root:root.dark .template-surface .ct-limelight { --lime: ${expected.dark}; }`),
    );
  });

  test(`a custom HEX overrides ${expected.label} in both mode branches`, () => {
    const css = themeCSS({ ...defaultTheme, accent: expected.key, custom: "#13a57b" });
    assert.ok(css.includes("--primary: #13a57b;"));
    assert.ok(css.includes(".ct-lime-cta { --primary-foreground: #ffffff;"));
    assert.ok(!css.includes(`--primary: ${expected.dark};`));
    assert.ok(!css.includes(":root:root.dark .template-surface .ct-limelight"));
  });
}

test("v2 Green remains Green while the historical v1 alias still means Emerald", () => {
  withBrowserInput(
    { "blocks-preview-theme-v1": JSON.stringify({ accent: "green" }) },
    "#/block/application/app-shell/app-shell-1",
    () => assert.equal(loadTheme().accent, "emerald"),
  );
  withBrowserInput(
    {
      "blocks-preview-theme-v1": JSON.stringify({ accent: "green" }),
      [previewThemeStorageKey]: JSON.stringify({ accent: "green" }),
    },
    "#/block/application/app-shell/app-shell-1",
    () => assert.equal(loadTheme().accent, "green"),
  );
});

test("an explicit new Green preset takes precedence over legacy storage", () => {
  const params = new URLSearchParams({ preset: JSON.stringify({ accent: "green" }) });
  withBrowserInput(
    { "blocks-preview-theme-v1": JSON.stringify({ accent: "green" }) },
    `#/block/application/app-shell/app-shell-1?${params}`,
    () => assert.equal(loadTheme().accent, "green"),
  );
});
