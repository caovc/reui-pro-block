const additionalAccents = {
  fuchsia: {
    light: "oklch(0.518 0.253 323.949)",
    dark: "oklch(0.452 0.211 324.591)",
    foreground: "oklch(0.977 0.017 320.058)",
  },
  green: {
    light: "oklch(0.527 0.154 150.069)",
    dark: "oklch(0.448 0.119 151.328)",
    foreground: "oklch(0.982 0.018 155.826)",
  },
  lime: {
    light: "oklch(0.841 0.238 128.85)",
    dark: "oklch(0.768 0.233 130.85)",
    foreground: "oklch(0.405 0.101 131.063)",
  },
  purple: {
    light: "oklch(0.496 0.265 301.924)",
    dark: "oklch(0.438 0.218 303.724)",
    foreground: "oklch(0.977 0.014 308.299)",
  },
  sky: {
    light: "oklch(0.5 0.134 242.749)",
    dark: "oklch(0.443 0.11 240.79)",
    foreground: "oklch(0.977 0.013 236.62)",
  },
  yellow: {
    light: "oklch(0.852 0.199 91.936)",
    dark: "oklch(0.795 0.184 86.047)",
    foreground: "oklch(0.421 0.095 57.708)",
  },
} as const;

export const accents = {
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
  fuchsia: additionalAccents.fuchsia.light,
  green: additionalAccents.green.light,
  lime: additionalAccents.lime.light,
  purple: additionalAccents.purple.light,
  sky: additionalAccents.sky.light,
  yellow: additionalAccents.yellow.light,
} as const;
export const fonts = {
  inter: '"Inter", Arial, sans-serif',
  geist: '"Geist Variable", sans-serif',
  system: "system-ui, sans-serif",
  serif: "Georgia, serif",
  mono: "ui-monospace, monospace",
} as const;
export const themeOptions = {
  base: ["default", "neutral", "zinc", "stone", "gray", "slate"],
  accent: ["default", ...Object.keys(accents)],
  chart: ["default", "neutral", "theme", "colorful"],
  font: ["default", ...Object.keys(fonts)],
  heading: ["default", ...Object.keys(fonts)],
  radius: ["default", "0", "0.375", "0.625", "1"],
  mode: ["inherit", "light", "dark", "system"],
  menu: ["default", "solid", "outline"],
  menuAccent: ["default", "subtle", "bold"],
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
  menu: string;
  menuAccent: string;
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
  menu: "default",
  menuAccent: "default",
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
    const legacyValue = JSON.parse(localStorage.getItem("blocks-preview-theme-v1") || "null");
    // The v1 toolbar used green as an Emerald alias. New presets have a real Green palette.
    if (legacyValue?.accent === "green") legacyValue.accent = "emerald";
    const legacy = normalizeTheme(legacyValue);
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
  const additionalAccent = theme.custom
    ? undefined
    : additionalAccents[theme.accent as keyof typeof additionalAccents];
  const accent = theme.custom || accents[theme.accent as keyof typeof accents];
  const accentForeground = additionalAccent?.foreground || "#ffffff";
  const color = accent || "var(--primary)";
  const hue =
    theme.base === "stone"
      ? "55"
      : theme.base === "slate"
        ? "258"
        : theme.base === "gray"
          ? "264"
          : "286";
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
            `\n  --chart-${i + 1}: ${theme.chart === "neutral" ? `oklch(${0.75 - i * 0.11} 0 0)` : theme.chart === "colorful" ? ["#2563eb", "#7c3aed", "#047857", "#c2410c", "#be123c"][i] : `color-mix(in oklch, ${color} ${100 - i * 16}%, var(--background))`};`,
        ).join("");
  const bodyFont = fonts[theme.font as keyof typeof fonts];
  const headingFont = fonts[theme.heading as keyof typeof fonts];
  const surfaces =
    ":root:root :is(.reui-reference, .template-surface, .template-surface > :first-child)";
  const menuTargets =
    ":root:root :is(.sidebar-link.active, .sidebar-block-link.active, [data-sidebar=menu-button][data-active=true])";
  const accentTokens = accent
    ? `--primary: ${accent}; --primary-foreground: ${accentForeground}; --ring: ${accent}; --sidebar-primary: ${accent}; --sidebar-primary-foreground: ${accentForeground};`
    : "";
  const menuTokens =
    theme.menuAccent === "default"
      ? ""
      : `--sidebar-accent: ${theme.menuAccent === "bold" ? "var(--primary)" : "color-mix(in oklch, var(--primary) 10%, var(--background))"}; --sidebar-accent-foreground: ${theme.menuAccent === "bold" ? "var(--primary-foreground)" : "var(--foreground)"};`;
  return `/* Bricklane global theme — append after your existing theme CSS. */
:root:root {${theme.base === "default" ? "" : palette(false)}
  ${theme.radius === "default" ? "" : `--radius: ${theme.radius}rem;`}
  ${bodyFont ? `--font-sans: ${bodyFont};` : ""}
  ${headingFont ? `--font-heading: ${headingFont};` : ""}
}
:root:root.dark {${theme.base === "default" ? "" : palette(true)}
}
:root:root, :root:root.dark {
  ${accentTokens}${chart}${menuTokens}
}
${accent || chart || menuTokens ? `${surfaces} { ${accentTokens}${chart}${menuTokens} }` : ""}
${
  accent
    ? `:root:root .template-surface .ct-limelight { --lime: ${accent}; }
:root:root .template-surface .ct-lime-cta { --primary-foreground: ${accentForeground}; color: var(--primary-foreground); }`
    : ""
}
${theme.base !== "default" ? `:root:root .template-surface .ct-limelight { --lime-bg: var(--background); --lime-panel: var(--card); --lime-text: var(--foreground); --lime-border: var(--border); --lime-muted: var(--muted-foreground); }` : ""}${
    additionalAccent
      ? `\n:root:root.dark, :root:root.dark :is(.reui-reference, .template-surface, .template-surface > :first-child) { --primary: ${additionalAccent.dark}; --ring: ${additionalAccent.dark}; --sidebar-primary: ${additionalAccent.dark}; }
:root:root.dark .template-surface .ct-limelight { --lime: ${additionalAccent.dark}; }`
      : ""
  }
${theme.menuAccent !== "default" ? `${menuTargets} { background: var(--sidebar-accent); color: var(--sidebar-accent-foreground); }` : ""}
${theme.menu === "solid" ? `${menuTargets} { background: var(--primary); color: var(--primary-foreground); }` : theme.menu === "outline" ? `${menuTargets} { background: transparent; color: var(--foreground); box-shadow: inset 0 0 0 1px var(--border); }` : ""}
${
  bodyFont
    ? `:root:root body { font-family: var(--font-sans); }
${surfaces} { --font-sans: ${bodyFont}; font-family: var(--font-sans); }
:root:root :is([data-slot=popover-content], [data-slot=select-content], [data-slot=dialog-content], [data-slot=sheet-content]) { --font-sans: ${bodyFont}; font-family: var(--font-sans); }`
    : ""
}
${
  headingFont
    ? `${surfaces} { --font-heading: ${headingFont}; }
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
