// ReUI's free base-nova and radix-nova c-alert-dialog-1 use the shared AlertDialog slots.
// Visual deltas follow apps/v4/registry/styles at shadcn-ui/ui@8ab27715521cbd4f87ae6886cd989cbb678f6de7.
// The style engine includes the upstream MIT notices from notice.ts.

type Profile = {
  overlay?: number;
  blur?: boolean;
  spacing?: 24;
  gap?: 12;
  headerGap?: 4 | 8;
  radius?: string;
  desktopWidth?: number;
  smallWidth?: number;
  mediaSize?: 32 | 64;
  mediaRadius?: string;
  titleSize: 14 | 18;
  description?: "compact" | "editorial";
  softRing?: "light" | "all";
  shadow?: "md" | "xl";
};

const wide = { spacing: 24, desktopWidth: 448, mediaSize: 64, titleSize: 18 } as const;
const editorial = {
  overlay: 30,
  blur: true,
  mediaRadius: "calc(infinity * 1px)",
  shadow: "xl",
} as const;
const extraRound = "calc(var(--radius, 0.625rem) * 2.6)";

const profiles = {
  vega: { ...wide, desktopWidth: 512 },
  maia: {
    ...wide,
    overlay: 80,
    radius: extraRound,
    mediaRadius: "calc(infinity * 1px)",
    softRing: "all",
  },
  lyra: { radius: "0", mediaRadius: "0", titleSize: 14, description: "compact" },
  mira: {
    overlay: 80,
    gap: 12,
    headerGap: 4,
    smallWidth: 256,
    mediaSize: 32,
    titleSize: 14,
    description: "compact",
  },
  luma: { ...wide, ...editorial, radius: extraRound, softRing: "light" },
  sera: {
    ...wide,
    overlay: 20,
    blur: true,
    radius: "0",
    headerGap: 8,
    mediaRadius: "0",
    description: "editorial",
    shadow: "md",
  },
  rhea: {
    ...wide,
    ...editorial,
    radius: `min(${extraRound}, 24px)`,
    softRing: "light",
  },
} satisfies Record<string, Profile>;

const slot = (name: string) => `[data-slot="alert-dialog-${name}"]`;
const utility = (value: string) => `[class~="${value}"]`;
const rem = (pixels: number) => `${pixels / 16}rem`;

const shadows = {
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
};

function rule(selector: string, declarations: Record<string, string>) {
  const body = Object.entries(declarations)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");
  return `:where(${selector}) {\n${body}\n}\n`;
}

function withoutUtilities(...prefixes: string[]) {
  const matches = prefixes.flatMap((prefix) => [
    `[class^="${prefix}-"]`,
    `[class*=" ${prefix}-"]`,
    `[class*=":${prefix}-"]`,
  ]);
  return `:not(${matches.join(", ")})`;
}

// A shorthand may survive class merging when a caller sets one side or axis.
function paddingCss(selector: string, value: string) {
  const edges = {
    top: ["py", "pt", "pbs"],
    bottom: ["py", "pb", "pbe"],
    left: ["px", "pl", "ps", "pe"],
    right: ["px", "pr", "ps", "pe"],
  };
  return Object.entries(edges)
    .map(([edge, overrides]) =>
      rule(`${selector}${utility("p-4")}${withoutUtilities(...overrides)}`, {
        [`padding-${edge}`]: value,
      }),
    )
    .join("");
}

const radiusOverrides = {
  "top-left": [
    "rounded-t",
    "rounded-l",
    "rounded-tl",
    "rounded-s",
    "rounded-e",
    "rounded-ss",
    "rounded-se",
  ],
  "top-right": [
    "rounded-t",
    "rounded-r",
    "rounded-tr",
    "rounded-s",
    "rounded-e",
    "rounded-ss",
    "rounded-se",
  ],
  "bottom-left": [
    "rounded-b",
    "rounded-l",
    "rounded-bl",
    "rounded-s",
    "rounded-e",
    "rounded-es",
    "rounded-ee",
  ],
  "bottom-right": [
    "rounded-b",
    "rounded-r",
    "rounded-br",
    "rounded-s",
    "rounded-e",
    "rounded-es",
    "rounded-ee",
  ],
} as const;

function radiusCss(selector: string, value: string) {
  return Object.entries(radiusOverrides)
    .map(([corner, overrides]) =>
      rule(`${selector}${withoutUtilities(...overrides)}`, {
        [`border-${corner}-radius`]: value,
      }),
    )
    .join("");
}

function panelCss(profile: Profile) {
  const panel = slot("content");
  const spacing = profile.spacing ?? profile.gap;
  const rules = [];
  if (spacing) {
    rules.push(
      rule(`${panel}${utility("gap-4")}${withoutUtilities("gap-y")}`, { "row-gap": rem(spacing) }),
      rule(`${panel}${utility("gap-4")}${withoutUtilities("gap-x")}`, {
        "column-gap": rem(spacing),
      }),
    );
  }
  if (profile.spacing) rules.push(paddingCss(panel, rem(profile.spacing)));
  if (profile.radius) {
    rules.push(radiusCss(`${panel}${utility("rounded-xl")}`, profile.radius));
  }
  if (profile.desktopWidth) {
    rules.push(
      `@media (width >= 40rem) {\n${rule(
        `${panel}[data-size="default"]${utility("data-[size=default]:sm:max-w-sm")}`,
        { "max-width": rem(profile.desktopWidth) },
      )}}\n`,
    );
  }
  if (profile.smallWidth) {
    rules.push(
      rule(`${panel}[data-size="sm"]${utility("data-[size=sm]:max-w-xs")}`, {
        "max-width": rem(profile.smallWidth),
      }),
    );
  }
  if (profile.softRing) {
    const ring = `${panel}${utility("ring-foreground/10")}`;
    const color = (opacity: number) =>
      `color-mix(in oklab, var(--foreground) ${opacity}%, transparent)`;
    rules.push(rule(ring, { "--tw-ring-color": color(5) }));
    if (profile.softRing === "light") {
      rules.push(rule(`.dark ${ring}`, { "--tw-ring-color": color(10) }));
    }
  }
  if (profile.shadow) {
    // The native ring utility composes box-shadow from this variable.
    rules.push(
      `@layer components {\n${rule(panel, { "--tw-shadow": shadows[profile.shadow] })}}\n`,
    );
  }
  return rules.join("");
}

function textCss(profile: Profile) {
  const title = slot("title");
  const description = `${slot("description")}${utility("text-sm")}`;
  const titleUtility = `${title}${utility("text-base")}`;
  return [
    rule(titleUtility, { "font-size": rem(profile.titleSize) }),
    rule(`${titleUtility}${withoutUtilities("leading")}`, {
      "line-height": rem(profile.titleSize === 18 ? 28 : 20),
    }),
    profile.description === "compact"
      ? rule(description, { "font-size": rem(12) }) +
        rule(`${description}${withoutUtilities("leading")}`, { "line-height": "1.625" })
      : "",
    profile.description === "editorial"
      ? rule(`${title}${utility("font-medium")}`, { "font-weight": "600" }) +
        rule(`${description}${withoutUtilities("leading")}`, { "line-height": "1.625" }) +
        `@layer components {\n${rule(title, {
          "text-transform": "uppercase",
          "letter-spacing": "0.05em",
        })}${rule(slot("description"), { "margin-top": rem(2) })}}\n`
      : "",
  ].join("");
}

function headerCss(profile: Profile) {
  const header = slot("header");
  const media = slot("media");
  const rules = [];
  if (profile.headerGap) {
    rules.push(
      rule(`${header}${utility("gap-1.5")}${withoutUtilities("gap-y")}`, {
        "row-gap": rem(profile.headerGap),
      }),
      rule(`${header}:not(:has(${media}))${utility("gap-1.5")}${withoutUtilities("gap-x")}`, {
        "column-gap": rem(profile.headerGap),
      }),
    );
  }
  if (profile.mediaSize === 64) {
    rules.push(
      rule(
        `${header}:has(${media})${utility("has-data-[slot=alert-dialog-media]:gap-x-4")}:not([class^="gap-x-"], [class*=" gap-x-"])`,
        {
          "column-gap": rem(24),
        },
      ),
    );
  }
  if (profile.mediaRadius) {
    rules.push(radiusCss(`${media}${utility("rounded-md")}`, profile.mediaRadius));
  }
  if (profile.mediaSize) {
    const size = rem(profile.mediaSize);
    const icon = rem(profile.mediaSize === 64 ? 32 : 16);
    rules.push(
      rule(`${media}${utility("size-10")}${withoutUtilities("w")}`, { width: size }),
      rule(`${media}${utility("size-10")}${withoutUtilities("h")}`, { height: size }),
      rule(
        `${media}${utility("*:[svg:not([class*='size-'])]:size-6")} > svg:not([class*="size-"])`,
        { width: icon, height: icon },
      ),
    );
  }
  return rules.join("");
}

function footerCss() {
  const footer = slot("footer");
  return [
    paddingCss(footer, "0"),
    rule(
      `${footer}${utility("-mx-4")}${withoutUtilities("ml", "mr", "ms", "me", "-ml", "-mr", "-ms", "-me")}`,
      {
        "margin-inline": "0",
      },
    ),
    rule(`${footer}${utility("-mb-4")}${withoutUtilities("my", "mbe", "-my", "-mbe")}`, {
      "margin-bottom": "0",
    }),
    rule(`${footer}${utility("rounded-b-xl")}`, {
      "border-bottom-left-radius": "0",
      "border-bottom-right-radius": "0",
    }),
    rule(`${footer}${utility("border-t")}`, { "border-top-width": "0" }),
    rule(`${footer}${utility("bg-muted/50")}`, { "background-color": "transparent" }),
  ].join("");
}

export function getAlertDialogCss(style: string): string {
  const name = style.replace(/^(base|radix)-/, "");
  if (!Object.hasOwn(profiles, name)) return "";
  const profile: Profile = profiles[name as keyof typeof profiles];
  const overlay = slot("overlay");
  return [
    profile.overlay
      ? rule(`${overlay}${utility("bg-black/10")}`, {
          "background-color": `rgb(0 0 0 / ${profile.overlay}%)`,
        })
      : "",
    profile.blur
      ? `@supports (backdrop-filter: blur(0)) {\n${rule(
          `${overlay}${utility("supports-backdrop-filter:backdrop-blur-xs")}`,
          { "backdrop-filter": "blur(8px)" },
        )}}\n`
      : "",
    panelCss(profile),
    headerCss(profile),
    textCss(profile),
    footerCss(),
  ].join("");
}
