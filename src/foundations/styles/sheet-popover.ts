import type { UiStyle } from "./index.ts";

// ReUI's free c-sheet-1 and c-popover-1 compose the shadcn primitives.
// Style deltas come from apps/v4/registry/styles at shadcn-ui/ui@8ab27715521cbd4f87ae6886cd989cbb678f6de7.
type Style = Exclude<UiStyle, "nova">;
type CssRules = {
  rule: (selector: string, declarations: Record<string, string>) => string;
  radius: (size: "none" | "md" | "2xl" | "3xl") => string;
  shadow: (selector: string, size: "md" | "lg" | "xl" | "2xl") => string;
};

const sheetStyles: Record<
  Style,
  {
    padding: number;
    overlay: number;
    shadow?: "md" | "xl";
    filledClose?: boolean;
    title?: "inherit" | "small" | "uppercase";
  }
> = {
  vega: { padding: 16, overlay: 10, title: "inherit" },
  maia: { padding: 24, overlay: 80 },
  lyra: { padding: 16, overlay: 10, title: "small" },
  mira: { padding: 24, overlay: 80, title: "small" },
  luma: { padding: 24, overlay: 30, shadow: "xl", filledClose: true },
  sera: { padding: 32, overlay: 20, shadow: "md", filledClose: true, title: "uppercase" },
  rhea: { padding: 24, overlay: 30, shadow: "xl", filledClose: true },
};

const popoverStyles: Record<
  Style,
  {
    padding?: number;
    gap?: number;
    radius?: "none" | "md" | "2xl" | "3xl";
    shadow?: "lg" | "2xl";
    title?: "base" | "small" | "uppercase";
  }
> = {
  vega: { padding: 16, gap: 16, radius: "md" },
  maia: { padding: 16, gap: 16, radius: "2xl", shadow: "2xl", title: "base" },
  lyra: { radius: "none", title: "small" },
  mira: { gap: 16, title: "small" },
  luma: { padding: 16, gap: 16, radius: "3xl", shadow: "lg", title: "base" },
  sera: { padding: 16, gap: 16, radius: "none", title: "uppercase" },
  rhea: { padding: 16, gap: 16, radius: "3xl", shadow: "lg", title: "base" },
};

const rem = (pixels: number) => `${pixels / 16}rem`;
const slot = (name: string) => `[data-slot="${name}"]`;
const utility = (name: string) => `[class~="${name}"]`;
const lowSpecificity = (selector: string) => `:where(${selector})`;

function withoutUtilities(...prefixes: string[]) {
  const selectors = prefixes.flatMap((prefix) => [
    `[class^="${prefix}-"]`,
    `[class*=" ${prefix}-"]`,
    `[class*=":${prefix}-"]`,
  ]);
  return `:not(${selectors.join(", ")})`;
}

// Class merging preserves a shorthand when only one axis or edge is overridden.
const paddingSides = {
  top: ["py", "pt"],
  bottom: ["py", "pb"],
  left: ["px", "pl", "ps", "pe"],
  right: ["px", "pr", "ps", "pe"],
} as const;

function paddingCss(rule: CssRules["rule"], selector: string, original: string, size: number) {
  return Object.entries(paddingSides)
    .map(([side, overrides]) =>
      rule(lowSpecificity(`${selector}${utility(original)}${withoutUtilities(...overrides)}`), {
        [`padding-${side}`]: rem(size),
      }),
    )
    .join("");
}

function gapCss(rule: CssRules["rule"], selector: string, original: string, value: string) {
  return (
    rule(lowSpecificity(`${selector}${utility(original)}${withoutUtilities("gap-y")}`), {
      "row-gap": value,
    }) +
    rule(lowSpecificity(`${selector}${utility(original)}${withoutUtilities("gap-x")}`), {
      "column-gap": value,
    })
  );
}

const text = {
  base: { "font-size": rem(16), "line-height": "1.5" },
  small: { "font-size": rem(14), "line-height": "calc(20 / 14)" },
  compact: { "font-size": rem(12), "line-height": "calc(16 / 12)" },
  relaxedCompact: { "font-size": rem(12), "line-height": "1.625" },
  large: { "font-size": rem(18), "line-height": "calc(28 / 18)" },
  inherit: { "font-size": "inherit", "line-height": "inherit" },
};

function fontCss(
  rule: CssRules["rule"],
  selector: string,
  original: string,
  size: keyof typeof text,
) {
  const target = `${selector}${utility(original)}`;
  return (
    rule(lowSpecificity(target), { "font-size": text[size]["font-size"] }) +
    rule(lowSpecificity(`${target}${withoutUtilities("leading")}`), {
      "line-height": text[size]["line-height"],
    })
  );
}

function sheetCss(style: Style, { rule, shadow }: CssRules) {
  const profile = sheetStyles[style];
  const content = slot("sheet-content");
  const header = slot("sheet-header");
  const footer = slot("sheet-footer");
  const overlay = slot("sheet-overlay");
  const close = `${content} > ${slot("sheet-close")}[data-variant="ghost"]`;
  const title = slot("sheet-title");
  const description = slot("sheet-description");
  const compact = style === "lyra" || style === "mira";
  const sections = [];

  if (style !== "vega") sections.push(gapCss(rule, content, "gap-4", "normal"));
  if (style !== "lyra") {
    sections.push(
      gapCss(rule, header, "gap-0.5", rem(6)),
      rule(lowSpecificity(`${close}${utility("top-3")}`), { top: rem(16) }),
      rule(lowSpecificity(`${close}${utility("right-3")}`), { right: rem(16) }),
    );
  }
  if (profile.padding !== 16) {
    sections.push(
      paddingCss(rule, header, "p-4", profile.padding),
      paddingCss(rule, footer, "p-4", profile.padding),
    );
  }
  if (profile.overlay !== 10) {
    sections.push(
      rule(lowSpecificity(`${overlay}${utility("bg-black/10")}`), {
        "background-color": `rgb(0 0 0 / ${profile.overlay}%)`,
      }),
    );
  }
  if (profile.shadow) {
    sections.push(shadow(lowSpecificity(`${content}${utility("shadow-lg")}`), profile.shadow));
  }
  if (profile.filledClose) {
    const backdrop = lowSpecificity(
      `${overlay}${utility("supports-backdrop-filter:backdrop-blur-xs")}`,
    );
    sections.push(
      `@supports (backdrop-filter: blur(0)) {\n${rule(backdrop, { "backdrop-filter": "blur(8px)" })}}\n`,
      // These properties have no Nova utility. Let authored utilities override them.
      `@layer utilities {\n${rule(lowSpecificity(close), { "background-color": "var(--secondary)" })}}\n`,
    );
  }
  if (compact) {
    sections.push(
      fontCss(rule, content, "text-sm", "relaxedCompact"),
      fontCss(rule, description, "text-sm", "relaxedCompact"),
    );
  }
  if (profile.title) {
    sections.push(
      fontCss(rule, title, "text-base", profile.title === "uppercase" ? "large" : profile.title),
    );
  }
  if (style === "sera") {
    sections.push(
      rule(lowSpecificity(`${title}${utility("font-medium")}`), { "font-weight": "600" }),
      `@layer utilities {\n${rule(lowSpecificity(title), {
        "text-transform": "uppercase",
        "letter-spacing": "0.05em",
      })}${rule(lowSpecificity(description), {
        "margin-top": rem(2),
      })}}\n`,
      rule(lowSpecificity(`${description}${utility("text-sm")}${withoutUtilities("leading")}`), {
        "line-height": "1.625",
      }),
    );
  }
  return sections.join("");
}

function popoverCss(style: Style, { rule, radius, shadow }: CssRules) {
  const profile = popoverStyles[style];
  const content = slot("popover-content");
  const header = slot("popover-header");
  const title = slot("popover-title");
  const description = slot("popover-description");
  const sections = [gapCss(rule, header, "gap-0.5", rem(4))];
  if (profile.gap) sections.push(gapCss(rule, content, "gap-2.5", rem(profile.gap)));
  if (profile.padding) sections.push(paddingCss(rule, content, "p-2.5", profile.padding));
  if (profile.radius) {
    sections.push(
      rule(lowSpecificity(`${content}${utility("rounded-lg")}`), {
        "border-radius": radius(profile.radius),
      }),
    );
  }
  if (profile.shadow) {
    const ring = `${content}${utility("ring-foreground/10")}`;
    sections.push(
      shadow(lowSpecificity(`${content}${utility("shadow-md")}`), profile.shadow),
      rule(lowSpecificity(ring), {
        "--tw-ring-color": "color-mix(in oklab, var(--foreground) 5%, transparent)",
      }),
    );
    if (style === "luma" || style === "rhea") {
      sections.push(
        rule(lowSpecificity(`.dark ${ring}`), {
          "--tw-ring-color": "color-mix(in oklab, var(--foreground) 10%, transparent)",
        }),
      );
    }
  }
  if (style === "lyra" || style === "mira") {
    sections.push(
      fontCss(rule, content, "text-sm", "compact"),
      fontCss(rule, header, "text-sm", "compact"),
    );
  }

  // Popover title and description inherit size in Nova. Preset additions belong
  // below utilities so a caller can still set its own typography or spacing.
  const inherited = [];
  if (profile.title) {
    inherited.push(
      rule(
        lowSpecificity(title),
        profile.title === "uppercase"
          ? { ...text.compact, "text-transform": "uppercase" }
          : text[profile.title],
      ),
    );
  }
  if (style === "lyra") {
    inherited.push(rule(lowSpecificity(description), text.relaxedCompact));
  }
  if (style === "sera") {
    sections.push(
      rule(lowSpecificity(`${title}${utility("font-medium")}`), { "font-weight": "600" }),
    );
    inherited.push(
      rule(lowSpecificity(description), {
        ...text.small,
        "line-height": "1.625",
        "margin-top": rem(2),
      }),
    );
  }
  if (inherited.length) sections.push(`@layer utilities {\n${inherited.join("")}}\n`);
  return sections.join("");
}

export function sheetPopoverCss(style: Style, rules: CssRules) {
  return sheetCss(style, rules) + popoverCss(style, rules);
}
