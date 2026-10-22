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
  base: ["neutral", "zinc", "stone"],
  accent: Object.keys(accents),
  chart: ["default", "neutral", "theme"],
  font: Object.keys(fonts),
  heading: Object.keys(fonts),
  radius: ["0", "0.375", "0.625", "1"],
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
  base: "neutral",
  accent: "blue",
  chart: "default",
  font: "geist",
  heading: "geist",
  radius: "0.625",
  mode: "inherit",
  custom: "",
};
export function normalizeTheme(value: unknown): PreviewTheme {
  const result = { ...defaultTheme };
  if (!value || typeof value !== "object") return result;
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(
    themeOptions,
  ) as (keyof typeof themeOptions)[]) {
    if ((themeOptions[key] as readonly unknown[]).includes(record[key]))
      result[key] = record[key] as string;
  }
  if (
    typeof record.custom === "string" &&
    /^#[0-9a-f]{6}$/i.test(record.custom)
  )
    result.custom = record.custom;
  // Preserve links created by the previous preview toolbar.
  if (record.accent === "green") result.accent = "emerald";
  return result;
}
export function readTheme(params: URLSearchParams): PreviewTheme {
  try {
    const preset = params.get("preset");
    return normalizeTheme(
      preset ? JSON.parse(preset) : Object.fromEntries(params),
    );
  } catch {
    return { ...defaultTheme };
  }
}
export function loadTheme(): PreviewTheme {
  const params = new URLSearchParams(location.hash.split("?")[1]);
  if (params.has("preset")) return readTheme(params);
  try {
    return normalizeTheme(
      JSON.parse(localStorage.getItem("blocks-preview-theme-v1") || "null"),
    );
  } catch {
    return { ...defaultTheme };
  }
}
export function isThemeDark(
  theme: PreviewTheme,
  inherited: boolean,
  system: boolean,
) {
  return (
    theme.mode === "dark" ||
    (theme.mode === "inherit" && inherited) ||
    (theme.mode === "system" && system)
  );
}
export function themeCSS(theme: PreviewTheme) {
  const color = theme.custom || accents[theme.accent as keyof typeof accents];
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
  return `/* Preview preset — append after your existing theme CSS. */
:root:root {${palette(false)}
  --radius: ${theme.radius}rem;
  --font-sans: ${fonts[theme.font as keyof typeof fonts]};
  --font-heading: ${fonts[theme.heading as keyof typeof fonts]};
}
:root:root.dark {${palette(true)}
}
:root:root, :root:root.dark {
  --primary: ${color};
  --primary-foreground: #ffffff;
  --ring: ${color};
  --sidebar-primary: ${color};
  --sidebar-primary-foreground: #ffffff;${chart}
}
body { font-family: var(--font-sans); }
h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }
`;
}
export function applyTheme(theme: PreviewTheme, dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  document.documentElement.style.setProperty("--radius", `${theme.radius}rem`);
  document.documentElement.dataset.accent = theme.accent;
  let style = document.getElementById("preview-preset");
  if (!style) {
    style = document.createElement("style");
    style.id = "preview-preset";
    document.head.append(style);
  }
  style.textContent = themeCSS(theme);
}
