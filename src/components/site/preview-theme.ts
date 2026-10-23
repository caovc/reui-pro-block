export const accents = {
  neutral: "#262626",
  blue: "#2563eb",
  emerald: "#047857",
  violet: "#7c3aed",
  orange: "#c2410c",
  rose: "#be123c",
} as const;
export const fonts = {
  geist: '"Geist Variable", sans-serif',
  system: "system-ui, sans-serif",
  serif: "Georgia, serif",
  mono: "ui-monospace, monospace",
} as const;
export const themeOptions = {
  base: ["default", "neutral", "zinc", "stone"],
  accent: ["default", ...Object.keys(accents)],
  chart: ["default", "neutral", "theme"],
  font: ["default", ...Object.keys(fonts)],
  heading: ["default", ...Object.keys(fonts)],
  radius: ["default", "0", "0.375", "0.625", "1"],
  mode: ["inherit", "light", "dark", "system"],
} as const;
export type PreviewTheme = {
  base: string;
  accent: string;
  chart: string;
  font: string;
  heading: string;
  radius: string;
  mode: string;
  custom: string;
};
export const defaultTheme: PreviewTheme = {
  base: "default",
  accent: "default",
  chart: "default",
  font: "default",
  heading: "default",
  radius: "default",
  mode: "inherit",
  custom: "",
};
export function normalizeTheme(value: unknown): PreviewTheme {
  const result = { ...defaultTheme };
  if (!value || typeof value !== "object") return result;
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(themeOptions) as (keyof typeof themeOptions)[]) {
    if ((themeOptions[key] as readonly unknown[]).includes(record[key]))
      result[key] = record[key] as string;
  }
  if (typeof record.custom === "string" && /^#[0-9a-f]{6}$/i.test(record.custom))
    result.custom = record.custom;
  // Preserve links created by the previous preview toolbar.
  if (record.accent === "green") result.accent = "emerald";
  return result;
}
export function readTheme(params: URLSearchParams): PreviewTheme {
  try {
    const preset = params.get("preset");
    return normalizeTheme(preset ? JSON.parse(preset) : Object.fromEntries(params));
  } catch {
    return { ...defaultTheme };
  }
}
export const previewThemeStorageKey = "blocks-preview-theme-v2";
export function loadTheme(): PreviewTheme {
  const params = new URLSearchParams(location.hash.split("?")[1]);
  if (params.has("preset")) return readTheme(params);
  try {
    const saved = localStorage.getItem(previewThemeStorageKey);
    if (saved !== null) return normalizeTheme(JSON.parse(saved));
    const legacy = normalizeTheme(
      JSON.parse(localStorage.getItem("blocks-preview-theme-v1") || "null"),
    );
    // v1 persisted blue even when the visitor never opened Customize. Preserve
    // other colors and custom HEX, while removing that implicit blue override.
    if (legacy.accent === "blue" && !legacy.custom) legacy.accent = "default";
    if (legacy.base === "neutral") legacy.base = "default";
    if (legacy.radius === "0.625") legacy.radius = "default";
    return legacy;
  } catch {
    return { ...defaultTheme };
  }
}
export function isThemeDark(theme: PreviewTheme, inherited: boolean, system: boolean) {
  return (
    theme.mode === "dark" ||
    (theme.mode === "inherit" && inherited) ||
    (theme.mode === "system" && system)
  );
}
export function themeCSS(theme: PreviewTheme) {
  const accent = theme.custom || accents[theme.accent as keyof typeof accents];
  const color = accent || "var(--primary)";
  const hue = theme.base === "stone" ? "55" : "286";
  const chroma = theme.base === "neutral" ? "0" : "0.008";
  const palette = (dark: boolean) => `
  --background: oklch(${dark ? ".145" : "1"} ${chroma} ${hue});
  --foreground: oklch(${dark ? ".985" : ".145"} ${chroma} ${hue});
  --card: oklch(${dark ? ".205" : "1"} ${chroma} ${hue});
  --card-foreground: var(--foreground);
  --popover: var(--card);
  --popover-foreground: var(--foreground);
  --muted: oklch(${dark ? ".269" : ".97"} ${chroma} ${hue});
  --muted-foreground: oklch(${dark ? ".708" : ".5"} ${chroma} ${hue});
  --secondary: var(--muted);
  --secondary-foreground: var(--foreground);
  --accent: var(--muted);
  --accent-foreground: var(--foreground);
  --border: oklch(${dark ? ".32" : ".922"} ${chroma} ${hue});
  --input: var(--border);
  --sidebar: var(--muted);
  --sidebar-foreground: var(--foreground);
  --sidebar-border: var(--border);`;
  const chart =
    theme.chart === "default"
      ? ""
      : Array.from(
          { length: 5 },
          (_, i) =>
            `\n  --chart-${i + 1}: ${theme.chart === "neutral" ? `oklch(${0.75 - i * 0.11} 0 0)` : `color-mix(in oklch, ${color} ${100 - i * 16}%, var(--background))`};`,
        ).join("");
  const bodyFont = fonts[theme.font as keyof typeof fonts];
  const headingFont = fonts[theme.heading as keyof typeof fonts];
  return `/* Preview preset — append after your existing theme CSS. */
:root:root {${theme.base === "default" ? "" : palette(false)}
  ${theme.radius === "default" ? "" : `--radius: ${theme.radius}rem;`}
  ${bodyFont ? `--font-sans: ${bodyFont};` : ""}
  ${headingFont ? `--font-heading: ${headingFont};` : ""}
}
:root:root.dark {${theme.base === "default" ? "" : palette(true)}
}
:root:root, :root:root.dark {
  ${
    accent
      ? `--primary: ${accent};
  --primary-foreground: #ffffff;
  --ring: ${accent};
  --sidebar-primary: ${accent};
  --sidebar-primary-foreground: #ffffff;`
      : ""
  }${chart}
}
${
  bodyFont
    ? `:root:root body { font-family: var(--font-sans); }
:root:root .reui-reference { --font-sans: ${bodyFont}; font-family: var(--font-sans); }`
    : ""
}
${
  headingFont
    ? `:root:root .reui-reference { --font-heading: ${headingFont}; }
:root:root :is(h1, h2, h3, h4, h5, h6) { font-family: var(--font-heading); }`
    : ""
}
`;
}
export function applyTheme(theme: PreviewTheme, dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  if (theme.radius === "default") document.documentElement.style.removeProperty("--radius");
  else document.documentElement.style.setProperty("--radius", `${theme.radius}rem`);
  document.documentElement.dataset.accent = theme.accent;
  let style = document.getElementById("preview-preset");
  if (!style) {
    style = document.createElement("style");
    style.id = "preview-preset";
    document.head.append(style);
  }
  style.textContent = themeCSS(theme);
}
