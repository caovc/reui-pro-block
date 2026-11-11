// ReUI's free c-field-1 pattern composes the stock Field and Label components.
// Style deltas follow shadcn-ui/ui@8ab27715521cbd4f87ae6886cd989cbb678f6de7,
// apps/v4/registry/styles/style-*.css (MIT, see notice.ts).

type FieldProfile = {
  roomy?: boolean;
  groupGap?: number;
  legendMargin: number;
  cardPadding: number;
  cardRadius: number;
  ring?: 1 | 2;
  softRing?: boolean;
  mutedHover?: boolean;
  selection?: "neutral-border" | "neutral-fill";
  typography?: "lyra" | "mira" | "sera";
};

const profiles: Record<string, FieldProfile> = {
  vega: { roomy: true, groupGap: 28, legendMargin: 12, cardPadding: 12, cardRadius: 0.8 },
  maia: {
    roomy: true,
    groupGap: 28,
    legendMargin: 12,
    cardPadding: 16,
    cardRadius: 1.4,
    mutedHover: true,
  },
  lyra: { legendMargin: 10, cardPadding: 8, cardRadius: 0, ring: 1, typography: "lyra" },
  mira: {
    groupGap: 16,
    legendMargin: 8,
    cardPadding: 8,
    cardRadius: 0.8,
    ring: 2,
    softRing: true,
    mutedHover: true,
    selection: "neutral-border",
    typography: "mira",
  },
  luma: {
    roomy: true,
    groupGap: 28,
    legendMargin: 12,
    cardPadding: 16,
    cardRadius: 1.8,
    mutedHover: true,
    selection: "neutral-fill",
  },
  sera: {
    roomy: true,
    groupGap: 40,
    legendMargin: 12,
    cardPadding: 16,
    cardRadius: 0,
    ring: 2,
    softRing: true,
    typography: "sera",
  },
  rhea: {
    roomy: true,
    groupGap: 24,
    legendMargin: 12,
    cardPadding: 16,
    cardRadius: 1.8,
    mutedHover: true,
    selection: "neutral-fill",
  },
};

const slot = (name: string) => `[data-slot="${name}"]`;
const utility = (name: string) => `[class~="${name}"]`;
const original = (selector: string, name: string) => `:where(${selector})${utility(name)}`;
const rem = (pixels: number) => `${pixels / 16}rem`;
const mix = (color: string, percent: number) =>
  `color-mix(in oklab, var(--${color}) ${percent}%, transparent)`;

const field = slot("field");
const group = slot("field-group");
const legend = slot("field-legend");
const fieldLabel = `${slot("field-label")}${utility("group/field-label")}`;
const fieldTitle = `${slot("field-label")}:not(${utility("group/field-label")})`;
const label = `:is(${slot("label")}, ${fieldLabel})`;
const fieldChild = `:has(> ${field})`;
const card = `${fieldLabel}${fieldChild}`;
const cardUtility = (name: string) => `${original(fieldLabel, name)}${fieldChild}`;
const focusedCardUtility = (name: string) => `${cardUtility(name)}:has(:focus-visible)`;
const checked = ':has(:where([data-state="checked"], [data-checked]:not([data-checked="false"])))';
const caseUtilities = ["uppercase", "lowercase", "capitalize", "normal-case"].map(utility);

function rule(selector: string, declarations: Record<string, string>) {
  const body = Object.entries(declarations)
    .map(([property, value]) => `    ${property}: ${value};`)
    .join("\n");
  return `  ${selector} {\n${body}\n  }\n`;
}

function withoutUtilities(...prefixes: string[]) {
  const classes = prefixes.flatMap((prefix) => [
    `[class^="${prefix}-"]`,
    `[class*=" ${prefix}-"]`,
    `[class*=":${prefix}-"]`,
  ]);
  return `:where(:not(${classes.join(", ")}))`;
}

function withoutPlainUtility(prefix: string) {
  return `:where(:not([class^="${prefix}-"], [class*=" ${prefix}-"]))`;
}

function gapCss(selector: string, name: string, size: number) {
  const target = original(selector, name);
  return (
    rule(`${target}${withoutUtilities("gap-y")}`, { "row-gap": rem(size) }) +
    rule(`${target}${withoutUtilities("gap-x")}`, { "column-gap": rem(size) })
  );
}

function spacingCss(profile: FieldProfile) {
  const groupDefault = `${group}:not(${utility("*:data-[slot=field-group]:gap-4")} > ${group})`;
  const plainFieldSet = `${slot("field-set")}:not(:has(> ${slot("checkbox-group")}, > ${slot("radio-group")}))`;
  return [
    rule(original(legend, "mb-1.5"), { "margin-bottom": rem(profile.legendMargin) }),
    profile.groupGap ? gapCss(groupDefault, "gap-5", profile.groupGap) : "",
    profile.roomy ? gapCss(plainFieldSet, "gap-4", 24) : "",
    profile.roomy ? gapCss(field, "gap-2", 12) : "",
    profile.roomy ? gapCss(slot("field-content"), "gap-0.5", 4) : "",
  ].join("");
}

const paddingSides = {
  top: ["p", "py", "pt"],
  bottom: ["p", "py", "pb"],
  left: ["p", "px", "pl", "ps", "pe"],
  right: ["p", "px", "pr", "ps", "pe"],
} as const;

function cardCss(profile: FieldProfile) {
  const padding = Object.entries(paddingSides)
    .map(([side, overrides]) =>
      rule(
        `${original(card, "*:data-[slot=field]:p-2.5")} > ${field}${withoutUtilities(...overrides)}`,
        {
          [`padding-${side}`]: rem(profile.cardPadding),
        },
      ),
    )
    .join("");
  return [
    rule(cardUtility("has-[>[data-slot=field]]:rounded-lg"), {
      "border-radius": profile.cardRadius
        ? `calc(var(--radius, 0.625rem) * ${profile.cardRadius})`
        : "0",
    }),
    padding,
    profile.mutedHover
      ? rule(
          `${cardUtility("has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50")}:hover:not(:has(:disabled, [data-disabled]))`,
          {
            "background-color": mix("input", 40),
          },
        )
      : "",
    profile.ring
      ? rule(focusedCardUtility("has-[>[data-slot=field]]:has-[:focus-visible]:ring-3"), {
          "--tw-ring-shadow": `0 0 0 calc(${profile.ring}px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, var(--ring))`,
        })
      : "",
    profile.softRing
      ? rule(focusedCardUtility("has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50"), {
          "--tw-ring-color": mix("ring", 30),
        })
      : "",
  ].join("");
}

function selectionCss(profile: FieldProfile) {
  const selected = `${fieldLabel}${checked}`;
  const border = profile.selection
    ? rule(
        `${original(`${selected}:not(:has(:focus-visible))`, "has-data-checked:border-primary/30")}${withoutPlainUtility("border")},\n  ` +
          `.dark ${original(`${selected}:not(:has(:focus-visible))`, "dark:has-data-checked:border-primary/20")}${withoutPlainUtility("border")}`,
        { "border-color": "var(--border)" },
      )
    : "";
  const fill =
    profile.selection === "neutral-fill"
      ? rule(
          `${original(`${selected}:not(:hover)`, "has-data-checked:bg-primary/5")}${withoutPlainUtility("bg")},\n  ` +
            `.dark ${original(`${selected}:not(:hover)`, "dark:has-data-checked:bg-primary/10")}${withoutPlainUtility("bg")}`,
          { "background-color": mix("input", 30) },
        )
      : "";
  if (profile.typography !== "sera") return border + fill;

  const focusBorder = "has-[>[data-slot=field]]:has-[:focus-visible]:border-ring";
  return [
    border,
    fill,
    rule(`${focusedCardUtility(focusBorder)}:not(${checked})${withoutPlainUtility("border")}`, {
      "border-color": "var(--border)",
    }),
    rule(
      `${focusedCardUtility(focusBorder)}${checked}${utility("has-data-checked:border-primary/30")}`,
      {
        "border-color": mix("primary", 30),
      },
    ),
    rule(
      `.dark ${focusedCardUtility(focusBorder)}${checked}${utility("dark:has-data-checked:border-primary/20")}`,
      {
        "border-color": mix("primary", 20),
      },
    ),
  ].join("");
}

function typographyCss(name: NonNullable<FieldProfile["typography"]>) {
  const sera = name === "sera";
  const compact = name !== "sera";
  const peerLabel = `:where(:is(${slot("checkbox")}, ${slot("radio-group-item")}, ${slot("switch")})${utility("peer")} ~ ${label})`;
  const normalLabel = original(label, "text-sm");
  const defaultCase = `:where(:not(${caseUtilities.join(", ")}))`;
  const titleSize = original(fieldTitle, "text-sm");
  const labelSize = `${original(legend, "data-[variant=label]:text-sm")}[data-variant="label"]`;
  const legendSize = `${original(legend, "data-[variant=legend]:text-base")}[data-variant="legend"]`;
  const smallText = { "font-size": "0.75rem", "line-height": "1.333333" };
  const relaxedText = { "font-size": "0.75rem", "line-height": "1.625" };
  const smallParts = ["field-description", "field-separator", "field-error"];
  return [
    rule(labelSize, name === "mira" ? relaxedText : smallText),
    rule(legendSize, sera ? smallText : { "font-size": "0.875rem", "line-height": "1.428571" }),
    rule(normalLabel, { "font-size": "0.75rem" }),
    rule(original(slot("label"), "leading-none"), {
      "line-height": name === "lyra" ? "1" : sera ? "1.333333" : "1.625",
    }),
    rule(titleSize, { "font-size": "0.75rem" }),
    rule(`${titleSize}${withoutUtilities("leading")}`, {
      "line-height": sera ? "1.333333" : "1.625",
    }),
    name === "lyra"
      ? rule(`${original(label, "font-medium")}, ${original(fieldTitle, "font-medium")}`, {
          "font-weight": "inherit",
        })
      : "",
    compact
      ? smallParts
          .map((part) => rule(original(slot(part), "text-sm"), { "font-size": "0.75rem" }))
          .join("") +
        rule(
          `${original(slot("field-separator"), "text-sm")}${withoutUtilities("leading")},\n  ${original(slot("field-error"), "text-sm")}${withoutUtilities("leading")}`,
          {
            "line-height": name === "mira" ? "1.625" : "1.333333",
          },
        )
      : "",
    sera
      ? rule(
          `${original(legend, "font-medium")}, ${original(label, "font-medium")}, ${original(fieldTitle, "font-medium")}`,
          { "font-weight": "600" },
        )
      : "",
    sera
      ? rule(
          `${original(legend, "font-medium")}${defaultCase}, ${normalLabel}${defaultCase}, ${titleSize}${defaultCase}`,
          { "text-transform": "uppercase" },
        )
      : "",
    sera
      ? rule(`${normalLabel}${withoutUtilities("tracking")}`, { "letter-spacing": "0.025em" })
      : "",
    sera ? rule(original(fieldLabel, "leading-snug"), { "line-height": "1.625" }) : "",
    sera
      ? rule(`${peerLabel}${utility("text-sm")}${defaultCase}`, {
          "font-size": "0.875rem",
          "text-transform": "none",
        })
      : "",
    sera ? rule(`${peerLabel}${utility("font-medium")}`, { "font-weight": "400" }) : "",
    sera
      ? rule(`${peerLabel}${utility("text-sm")}${withoutUtilities("tracking")}`, {
          "letter-spacing": "normal",
        })
      : "",
    sera
      ? rule(`${original(slot("field-description"), "text-sm")}${defaultCase}`, {
          "text-transform": "none",
        })
      : "",
    sera
      ? rule(`${original(slot("field-description"), "text-sm")}${withoutUtilities("tracking")}`, {
          "letter-spacing": "normal",
        })
      : "",
  ].join("");
}

/** Append to the foundation CSS after the default theme. */
export function getFieldCss(style: string): string {
  const name = style.replace(/^(base|radix)-/, "");
  if (!Object.hasOwn(profiles, name)) return "";
  const profile = profiles[name];
  const css = [spacingCss(profile), cardCss(profile), selectionCss(profile)];
  if (profile.typography) css.push(typographyCss(profile.typography));
  return `@layer utilities {\n${css.join("")}}\n`;
}
