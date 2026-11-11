// The free ReUI c-textarea and c-input-group patterns compose the shared shadcn primitives.
// Style values follow shadcn-ui/ui@8ab27715521cbd4f87ae6886cd989cbb678f6de7
// (apps/v4/registry/styles/style-*.css, MIT; see notice.ts).
import { profiles as foundationProfiles } from "./profiles.ts";

type Radius = "square" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

type TextEntryStyle = {
  textareaRadius: Radius;
  groupRadius: Radius;
  groupHeight: number;
  textareaPadding?: readonly [inline: number, block: number];
  groupBlockRadius?: Radius;
  groupTextareaRadius?: Radius;
  fill?: number;
  darkFill?: number;
  border?: "transparent" | "underline";
  ringWidth?: number;
  softRing?: boolean;
  shadow?: boolean;
  resizeNone?: boolean;
  keepDisabledSurface?: boolean;
  typography?: "compact" | "relaxed";
  addonInline?: number;
  addonPadding?: number;
  addonBlock?: readonly [inline: number, outer: number, alongsideInput: number];
  addonButtonOffset?: number;
  addonKeyOffset?: number;
  addonKeyRadius?: Radius | "compact";
  textareaControlPadding?: number;
  transition?: "shadow" | "surface" | "underline";
};

const profiles: Readonly<Record<string, TextEntryStyle>> = {
  vega: {
    textareaRadius: "md",
    groupRadius: "md",
    groupHeight: 36,
    shadow: true,
    transition: "shadow",
    addonButtonOffset: -4,
  },
  maia: {
    textareaRadius: "xl",
    groupRadius: "4xl",
    groupBlockRadius: "2xl",
    groupTextareaRadius: "xl",
    groupHeight: 36,
    textareaPadding: [12, 12],
    fill: 30,
    resizeNone: true,
    addonInline: 12,
    addonPadding: 8,
    addonBlock: [12, 12, 12],
    addonButtonOffset: -4,
    addonKeyRadius: "4xl",
  },
  lyra: {
    textareaRadius: "square",
    groupRadius: "square",
    groupHeight: 32,
    ringWidth: 1,
    keepDisabledSurface: true,
    typography: "compact",
    addonKeyRadius: "square",
  },
  mira: {
    textareaRadius: "md",
    groupRadius: "md",
    groupHeight: 28,
    textareaPadding: [8, 8],
    fill: 20,
    darkFill: 30,
    resizeNone: true,
    ringWidth: 2,
    softRing: true,
    typography: "relaxed",
    addonBlock: [8, 8, 8],
    addonPadding: 8,
    addonButtonOffset: -4.4,
    addonKeyOffset: -4.4,
    addonKeyRadius: "compact",
  },
  luma: {
    textareaRadius: "2xl",
    groupRadius: "4xl",
    groupBlockRadius: "3xl",
    groupTextareaRadius: "2xl",
    groupHeight: 36,
    textareaPadding: [12, 12],
    fill: 50,
    border: "transparent",
    softRing: true,
    resizeNone: true,
    addonInline: 12,
    addonPadding: 8,
    addonBlock: [12, 12, 14],
    addonButtonOffset: -4,
    addonKeyOffset: -4,
    addonKeyRadius: "3xl",
    textareaControlPadding: 10,
    transition: "surface",
  },
  sera: {
    textareaRadius: "square",
    groupRadius: "square",
    groupHeight: 40,
    textareaPadding: [0, 12],
    fill: 0,
    border: "underline",
    ringWidth: 0,
    resizeNone: true,
    addonInline: 0,
    addonPadding: 8,
    addonBlock: [0, 12, 14],
    addonButtonOffset: -4,
    addonKeyOffset: -4,
    addonKeyRadius: "square",
    textareaControlPadding: 10,
    transition: "underline",
  },
  rhea: {
    textareaRadius: "2xl",
    groupRadius: "2xl",
    groupHeight: 32,
    fill: 50,
    border: "transparent",
    softRing: true,
    resizeNone: true,
    addonKeyRadius: "2xl",
    transition: "shadow",
  },
};

const radiusScale = { md: 0.8, lg: 1, xl: 1.4, "2xl": 1.8, "3xl": 2.2, "4xl": 2.6 };
const radius = (name: Radius) =>
  name === "square" ? "0" : `calc(var(--radius, 0.625rem) * ${radiusScale[name]})`;
const rem = (pixels: number) => (pixels === 0 ? "0" : `${pixels / 16}rem`);
const fill = (percent: number) =>
  percent ? `color-mix(in oklab, var(--input) ${percent}%, transparent)` : "transparent";
const slot = (name: string) => `:where([data-slot="${name}"])`;
const utility = (name: string) => `[class~="${name}"]`;
const textarea = slot("textarea");
const group = slot("input-group");
const addon = slot("input-group-addon");
const control = slot("input-group-control");
const groupedInput = `${group} > :where(input)${control}`;
const groupedTextarea = `${group} > :where(textarea)${control}`;
const textareas = `:is(${textarea}, ${groupedTextarea})`;
const focused = ':has([data-slot="input-group-control"]:focus-visible)';
const invalid = ':has([data-slot][aria-invalid="true"])';
const inCombobox = '[data-slot="combobox-content"] *';
const blockAddon = ':has(> [data-align="block-start"], > [data-align="block-end"])';
const directTextarea = ":has(> textarea)";
const disabledGroup = ":has(:disabled)";
const dark = ":is(.dark *)";
const groupFocus = "has-[[data-slot=input-group-control]:focus-visible]";
const groupInvalid = "has-[[data-slot][aria-invalid=true]]";

function rule(selector: string, declarations: Readonly<Record<string, string>>) {
  const body = Object.entries(declarations)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");
  return `${selector} {\n${body}\n}\n`;
}

function replace(selector: string, original: string, property: string, value: string) {
  return rule(`${selector}${utility(original)}`, { [property]: value });
}

function noUtilityPrefix(...prefixes: string[]) {
  const selectors = prefixes.flatMap((prefix) => [
    `[class^="${prefix}"]`,
    `[class*=" ${prefix}"]`,
    `[class*=":${prefix}"]`,
  ]);
  return `:where(:not(${selectors.join(", ")}))`;
}

const noPlainUtilityPrefix = (prefix: string) =>
  `:where(:not([class^="${prefix}"], [class*=" ${prefix}"]))`;

function padding(selector: string, original: string, axis: "inline" | "block", pixels: number) {
  const directions = axis === "inline" ? ["pl-", "pr-", "ps-", "pe-"] : ["pt-", "pb-"];
  return replace(
    `${selector}${noUtilityPrefix(...directions)}:where(:not([class*=":${original.slice(0, 3)}"]))`,
    original,
    `padding-${axis}`,
    rem(pixels),
  );
}

function ringCss(profile: TextEntryStyle) {
  const groupTarget = `${group}:where(:not(${inCombobox}:focus-within))`;
  const textareaFocus = `${textarea}${utility("focus-visible:ring-3")}:focus-visible`;
  const groupFocused = `${groupTarget}${utility(`${groupFocus}:ring-3`)}${focused}`;
  const selectors = [
    textareaFocus,
    `${textarea}${utility("aria-invalid:ring-3")}[aria-invalid="true"]`,
    groupFocused,
    `${groupTarget}${utility(`${groupInvalid}:ring-3`)}${invalid}`,
  ];
  const width = profile.ringWidth;
  return [
    width !== undefined
      ? rule(selectors.join(",\n"), {
          "--tw-ring-shadow":
            width === 0
              ? "0 0 #0000"
              : `0 0 0 calc(${width}px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, var(--ring))`,
        })
      : "",
    profile.softRing
      ? rule(
          `${textareaFocus}${utility("focus-visible:ring-ring/50")}:not([aria-invalid="true"]),\n` +
            `${groupFocused}${utility(`${groupFocus}:ring-ring/50`)}:not(${invalid})`,
          { "--tw-ring-color": "color-mix(in oklab, var(--ring) 30%, transparent)" },
        )
      : "",
  ].join("");
}

function borderCss(profile: TextEntryStyle) {
  if (!profile.border) return "";
  const groupTarget = `${group}:where(:not(${inCombobox}:focus-within))`;
  const normal =
    `${textarea}${utility("border-input")}:not(:focus-visible, [aria-invalid="true"]),\n` +
    `${groupTarget}${utility("border-input")}:not(${focused}, ${invalid})`;
  if (profile.border === "transparent") return rule(normal, { "border-color": "transparent" });

  const underline = (selector: string, token: string, color: string) =>
    rule(
      `${selector}${utility(token)}${noUtilityPrefix("border-b-", "border-t-", "border-l-", "border-r-")}`,
      {
        "border-color": `transparent transparent ${color}`,
      },
    );
  return [
    underline(textarea, "border-input", "var(--input)"),
    underline(`${textarea}:focus-visible`, "focus-visible:border-ring", "var(--ring)"),
    underline(
      `${textarea}[aria-invalid="true"]`,
      "aria-invalid:border-destructive",
      "var(--destructive)",
    ),
    underline(
      `${dark}${textarea}[aria-invalid="true"]`,
      "dark:aria-invalid:border-destructive/50",
      "color-mix(in oklab, var(--destructive) 50%, transparent)",
    ),
    underline(groupTarget, "border-input", "var(--input)"),
    underline(`${groupTarget}${focused}`, `${groupFocus}:border-ring`, "var(--ring)"),
    underline(
      `${groupTarget}${invalid}`,
      `${groupInvalid}:border-destructive`,
      "var(--destructive)",
    ),
    underline(
      `${dark}${groupTarget}${invalid}`,
      `${groupInvalid}:border-destructive`,
      "color-mix(in oklab, var(--destructive) 50%, transparent)",
    ),
  ].join("");
}

function surfaceCss(profile: TextEntryStyle) {
  const groupBackground = `${group}${noPlainUtilityPrefix("bg-")}`;
  const darkFill = profile.darkFill ?? profile.fill ?? 30;
  return [
    profile.fill === undefined
      ? ""
      : replace(textarea, "bg-transparent", "background-color", fill(profile.fill)) +
        replace(groupBackground, "dark:bg-input/30", "background-color", fill(profile.fill)) +
        replace(`${dark}${textarea}`, "dark:bg-input/30", "background-color", fill(darkFill)) +
        replace(
          `${dark}${groupBackground}`,
          "dark:bg-input/30",
          "background-color",
          fill(darkFill),
        ),
    profile.keepDisabledSurface
      ? ""
      : replace(
          `${textarea}:disabled`,
          "disabled:bg-input/50",
          "background-color",
          fill(profile.fill ?? 0),
        ) +
        replace(
          `${dark}${textarea}:disabled`,
          "dark:disabled:bg-input/80",
          "background-color",
          fill(darkFill),
        ) +
        replace(
          `${group}${disabledGroup}`,
          "has-disabled:bg-input/50",
          "background-color",
          fill(profile.fill ?? 0),
        ) +
        replace(
          `${dark}${group}${disabledGroup}`,
          "dark:has-disabled:bg-input/80",
          "background-color",
          fill(darkFill),
        ) +
        replace(`${group}${disabledGroup}`, "has-disabled:opacity-50", "opacity", "1"),
  ].join("");
}

function typographyCss(profile: TextEntryStyle) {
  if (!profile.typography) return "";
  const compact = profile.typography === "compact";
  const text = { "font-size": rem(12), "line-height": compact ? "1.3333" : "1.625" };
  return [
    rule(
      `:is(${textareas}, ${groupedInput})${utility("text-base")}`,
      compact ? text : { "font-size": rem(14) },
    ),
    `@media (min-width: 48rem) {\n${rule(`:is(${textareas}, ${groupedInput})${utility("md:text-sm")}`, text)}}\n`,
    rule(`${addon}${utility("text-sm")}`, text),
    compact ? "" : replace(addon, "gap-2", "gap", rem(4)),
  ].join("");
}

function addonCss(profile: TextEntryStyle) {
  const start = `${addon}:where([data-align="inline-start"])`;
  const end = `${addon}:where([data-align="inline-end"])`;
  const top = `${addon}:where([data-align="block-start"])`;
  const bottom = `${addon}:where([data-align="block-end"])`;
  const groupWithInput = `${group}:has(> input)`;
  const block = profile.addonBlock;
  const key = profile.addonKeyRadius;
  return [
    profile.addonInline === undefined
      ? ""
      : replace(start, "pl-2", "padding-left", rem(profile.addonInline)) +
        replace(end, "pr-2", "padding-right", rem(profile.addonInline)),
    profile.addonButtonOffset === undefined
      ? ""
      : replace(
          `${start}:where(:has(> button))`,
          "has-[>button]:ml-[-0.3rem]",
          "margin-left",
          rem(profile.addonButtonOffset),
        ) +
        replace(
          `${end}:where(:has(> button))`,
          "has-[>button]:mr-[-0.3rem]",
          "margin-right",
          rem(profile.addonButtonOffset),
        ),
    profile.addonKeyOffset === undefined
      ? ""
      : replace(
          `${start}:where(:has(> kbd))`,
          "has-[>kbd]:ml-[-0.15rem]",
          "margin-left",
          rem(profile.addonKeyOffset),
        ) +
        replace(
          `${end}:where(:has(> kbd))`,
          "has-[>kbd]:mr-[-0.15rem]",
          "margin-right",
          rem(profile.addonKeyOffset),
        ),
    block
      ? [
          padding(top, "px-2.5", "inline", block[0]),
          padding(bottom, "px-2.5", "inline", block[0]),
          replace(top, "pt-2", "padding-top", rem(block[1])),
          replace(bottom, "pb-2", "padding-bottom", rem(block[1])),
          replace(
            `${groupWithInput} > ${top}`,
            "group-has-[>input]/input-group:pt-2",
            "padding-top",
            rem(block[2]),
          ),
          replace(
            `${groupWithInput} > ${bottom}`,
            "group-has-[>input]/input-group:pb-2",
            "padding-bottom",
            rem(block[2]),
          ),
          replace(`${top}:where(.border-b)`, "[.border-b]:pb-2", "padding-bottom", rem(block[2])),
          replace(`${bottom}:where(.border-t)`, "[.border-t]:pt-2", "padding-top", rem(block[2])),
        ].join("")
      : "",
    profile.addonPadding === undefined
      ? ""
      : [
          padding(
            `${addon}:where([data-align^="inline-"])`,
            "py-1.5",
            "block",
            profile.addonPadding,
          ),
          replace(
            `${top}:where(:not(.border-b))${noPlainUtilityPrefix("pb-")}`,
            "py-1.5",
            "padding-bottom",
            rem(profile.addonPadding),
          ),
          replace(
            `${bottom}:where(:not(.border-t))${noPlainUtilityPrefix("pt-")}`,
            "py-1.5",
            "padding-top",
            rem(profile.addonPadding),
          ),
        ].join(""),
    key
      ? rule(`${addon}${utility("[&>kbd]:rounded-[calc(var(--radius)-5px)]")} > :where(kbd)`, {
          "border-radius":
            key === "compact" ? "calc(var(--radius, 0.625rem) * 0.6 - 2px)" : radius(key),
          ...(profile.keepDisabledSurface
            ? {}
            : {
                "background-color": "color-mix(in oklab, var(--muted-foreground) 10%, transparent)",
                "padding-inline": rem(key === "compact" ? 4 : 6),
              }),
          ...(key === "compact" ? { "font-size": rem(10) } : {}),
        })
      : "",
  ].join("");
}

function groupedInputCss(name: keyof typeof foundationProfiles) {
  const input = foundationProfiles[name].input;
  const [height, inset] = input.size;
  const inlinePadding =
    name === "sera"
      ? ["start", "end"]
          .map((side) => {
            const align = `inline-${side}`;
            const property = side === "start" ? "left" : "right";
            const groupVariant = `has-[>[data-align=${align}]]:[&>input]:p${property[0]}-1.5`;
            const selector = `${group}${utility(groupVariant)}:has(> [data-align="${align}"]) > input${control}`;
            return replace(
              `${selector}${noUtilityPrefix("pl-", "pr-", "ps-", "pe-")}`,
              "px-2.5",
              `padding-${property}`,
              rem(8),
            );
          })
          .join("")
      : "";
  return [
    replace(groupedInput, "h-8", "height", rem(height)),
    padding(groupedInput, "px-2.5", "inline", inset),
    input.paddingY === undefined ? "" : padding(groupedInput, "py-1", "block", input.paddingY),
    inlinePadding,
  ].join("");
}

const transitions = {
  shadow: "color, box-shadow",
  surface: "color, box-shadow, background-color",
  underline: "color, border-color",
};

/** Adds the non-Nova style for the existing native Textarea and InputGroup slots. */
export function getTextEntryCss(style: string): string {
  const name = style.replace(/^(base|radix)-/, "");
  if (!Object.hasOwn(profiles, name)) return "";
  const profile = profiles[name];
  const shadow = profile.shadow
    ? rule(`:is(${textarea}, ${group})${utility("border-input")}${noUtilityPrefix("shadow-")}`, {
        "--tw-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "box-shadow":
          "var(--tw-inset-shadow, 0 0 #0000), var(--tw-inset-ring-shadow, 0 0 #0000), var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)",
      })
    : "";
  const body = [
    replace(textarea, "rounded-lg", "border-radius", radius(profile.textareaRadius)),
    replace(group, "rounded-lg", "border-radius", radius(profile.groupRadius)),
    profile.groupBlockRadius
      ? replace(
          `${group}:where(${blockAddon})`,
          "rounded-lg",
          "border-radius",
          radius(profile.groupBlockRadius),
        )
      : "",
    profile.groupTextareaRadius
      ? replace(
          `${group}:where(${directTextarea})`,
          "rounded-lg",
          "border-radius",
          radius(profile.groupTextareaRadius),
        )
      : "",
    replace(
      `${group}:where(:not(${blockAddon}, ${directTextarea}, ${inCombobox}))`,
      "h-8",
      "height",
      rem(profile.groupHeight),
    ),
    groupedInputCss(name as keyof typeof foundationProfiles),
    profile.textareaPadding
      ? padding(textareas, "px-2.5", "inline", profile.textareaPadding[0]) +
        padding(textarea, "py-2", "block", profile.textareaPadding[1])
      : "",
    profile.textareaControlPadding
      ? padding(groupedTextarea, "py-2", "block", profile.textareaControlPadding)
      : "",
    profile.resizeNone
      ? replace(`${textarea}${noUtilityPrefix("resize")}`, "field-sizing-content", "resize", "none")
      : "",
    surfaceCss(profile),
    borderCss(profile),
    ringCss(profile),
    typographyCss(profile),
    addonCss(profile),
    profile.transition
      ? replace(
          `:is(${textareas}, ${group})`,
          "transition-colors",
          "transition-property",
          transitions[profile.transition],
        )
      : "",
    name === "rhea"
      ? replace(
          `:is(${textareas}, ${group})${noUtilityPrefix("duration-")}`,
          "transition-colors",
          "transition-duration",
          "200ms",
        )
      : "",
    shadow,
  ].join("");
  return `@layer utilities {\n${body}}\n`;
}
