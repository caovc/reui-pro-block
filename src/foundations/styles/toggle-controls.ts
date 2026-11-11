// ReUI's free c-checkbox-1 and c-switch-1 patterns use the stock shadcn controls.
// Geometry and state styles follow apps/v4/registry/styles/style-*.css at
// shadcn-ui/ui@8ab27715521cbd4f87ae6886cd989cbb678f6de7 (MIT, see notice.ts).

type Size = readonly [
  width: number | string,
  height: number | string,
  thumbWidth: number,
  thumbHeight: number,
];

type ToggleProfile = {
  checkboxRadius?: number;
  checkboxSize?: number;
  checkboxTransition?: boolean;
  ringWidth?: number;
  softRing?: boolean;
  shadow?: boolean;
  surface?: "filled" | "square";
  switchRadius?: string;
  defaultSize?: Size;
  smallSize?: Size;
  thumbTravel?: string;
  thumbInset?: string;
};

const profiles: Record<string, ToggleProfile> = {
  vega: { checkboxTransition: true, shadow: true },
  maia: { checkboxRadius: 6, checkboxTransition: true },
  lyra: { checkboxRadius: 0, ringWidth: 1 },
  mira: {
    checkboxTransition: true,
    ringWidth: 2,
    softRing: true,
    defaultSize: ["28px", "16.6px", 14, 14],
  },
  luma: {
    checkboxRadius: 5,
    checkboxTransition: true,
    softRing: true,
    surface: "filled",
    defaultSize: [44, 20, 24, 16],
    smallSize: [28, 16, 16, 12],
    thumbTravel: "calc(100% - 8px)",
  },
  sera: {
    checkboxRadius: 0,
    checkboxSize: 18,
    checkboxTransition: true,
    ringWidth: 2,
    softRing: true,
    surface: "square",
    switchRadius: "0",
    defaultSize: [33, 18, 14, 14],
    smallSize: [25, 14, 10, 10],
    thumbTravel: "calc(100% + 2px)",
    thumbInset: "1px",
  },
  rhea: {
    checkboxRadius: 5,
    checkboxTransition: true,
    softRing: true,
    surface: "filled",
    switchRadius: "calc(var(--radius, 0.625rem) * 1.8)",
    defaultSize: [32, 20, 16, 16],
    smallSize: [24, 16, 12, 12],
    thumbTravel: "calc(100% - 4px)",
  },
};

const checkbox = '[data-slot="checkbox"]';
const toggle = '[data-slot="switch"]';
const thumb = '[data-slot="switch-thumb"]';
const checked = ':where([data-state="checked"], [data-checked]:not([data-checked="false"]))';
const unchecked =
  ':where([data-state="unchecked"], [data-unchecked]:not([data-unchecked="false"]))';
const invalid = '[aria-invalid="true"]';
const labelFocus = '[class~="group/field-label"]:has(:focus-visible) *';
const noBackgroundOverride = ':not([class^="bg-"], [class*=" bg-"])';
const noShadowOverride = ':not([class^="shadow-"], [class*=" shadow-"])';

const utility = (value: string) => `[class~="${value}"]`;
const inputMix = (percent: number) => `color-mix(in oklab, var(--input) ${percent}%, transparent)`;
const rem = (pixels: number) => `${pixels / 16}rem`;
const length = (size: number | string) => (typeof size === "number" ? rem(size) : size);

function rule(selector: string, declarations: Record<string, string>) {
  const body = Object.entries(declarations)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");
  return `${selector} {\n${body}\n}\n`;
}

function shadowCss(selector: string, shadow: string) {
  return rule(`${selector}${noShadowOverride}`, {
    "--tw-shadow": shadow,
    "box-shadow": [
      "var(--tw-inset-shadow, 0 0 #0000)",
      "var(--tw-inset-ring-shadow, 0 0 #0000)",
      "var(--tw-ring-offset-shadow, 0 0 #0000)",
      "var(--tw-ring-shadow, 0 0 #0000)",
      "var(--tw-shadow)",
    ].join(", "),
  });
}

function ringCss(profile: ToggleProfile) {
  const control = `:is(${checkbox}, ${toggle}):not(${labelFocus}${utility("group-has-[:focus-visible]/field-label:ring-0")})`;
  const focus = `${control}${utility("focus-visible:ring-3")}:focus-visible`;
  return [
    profile.ringWidth
      ? rule(`${focus}, ${control}${utility("aria-invalid:ring-3")}${invalid}`, {
          "--tw-ring-shadow": `0 0 0 calc(${profile.ringWidth}px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, var(--ring))`,
        })
      : "",
    profile.softRing
      ? rule(`${focus}${utility("focus-visible:ring-ring/50")}:not(${invalid})`, {
          "--tw-ring-color": "color-mix(in oklab, var(--ring) 30%, transparent)",
        })
      : "",
  ].join("");
}

function checkboxCss(profile: ToggleProfile) {
  const background = `${checkbox}${utility("dark:bg-input/30")}${noBackgroundOverride}:not(${checked})`;
  return [
    profile.checkboxRadius !== undefined
      ? rule(`${checkbox}${utility("rounded-[4px]")}`, {
          "border-radius": `${profile.checkboxRadius}px`,
        })
      : "",
    profile.checkboxSize
      ? rule(`${checkbox}${utility("size-4")}`, {
          width: rem(profile.checkboxSize),
          height: rem(profile.checkboxSize),
        })
      : "",
    profile.checkboxTransition
      ? rule(`${checkbox}${utility("transition-colors")}`, { "transition-property": "box-shadow" })
      : "",
    profile.surface
      ? rule(background, {
          "background-color": profile.surface === "filled" ? inputMix(90) : "transparent",
        })
      : "",
    profile.surface === "filled"
      ? rule(
          `${checkbox}${utility("border-input")}:not(${checked}, ${invalid}, :focus-visible),\n` +
            `${labelFocus}${checkbox}${utility("group-has-[:focus-visible]/field-label:not-data-checked:border-input")}:not(${checked}, ${invalid})`,
          { "border-color": "transparent" },
        )
      : "",
  ].join("");
}

function switchSizeCss(size: "default" | "sm", dimensions: Size, profile: ToggleProfile) {
  const [width, height, thumbWidth, thumbHeight] = dimensions;
  const control = `${toggle}[data-size="${size}"]`;
  const sizeUtility = `data-[size=${size}]`;
  const thumbSizeUtility = `group-data-[size=${size}]/switch`;
  const slider = `${control} > ${thumb}`;
  return [
    rule(`${control}${utility(`${sizeUtility}:w-[${size === "default" ? 32 : 24}px]`)}`, {
      width: length(width),
    }),
    rule(`${control}${utility(`${sizeUtility}:h-[${size === "default" ? 18.4 : 14}px]`)}`, {
      height: length(height),
    }),
    rule(`${slider}${utility(`${thumbSizeUtility}:size-${size === "default" ? 4 : 3}`)}`, {
      width: rem(thumbWidth),
      height: rem(thumbHeight),
    }),
    profile.thumbTravel
      ? rule(
          `${slider}${utility(`${thumbSizeUtility}:data-checked:translate-x-[calc(100%-2px)]`)}${checked}`,
          { "--tw-translate-x": profile.thumbTravel },
        )
      : "",
    profile.thumbInset
      ? rule(
          `${slider}${utility(`${thumbSizeUtility}:data-unchecked:translate-x-0`)}${unchecked}`,
          {
            "--tw-translate-x": profile.thumbInset,
          },
        )
      : "",
  ].join("");
}

function switchSurfaceCss(surface: NonNullable<ToggleProfile["surface"]>) {
  const offBorder = surface === "filled" ? "transparent" : inputMix(50);
  const filled = surface === "filled";
  const border = `${toggle}${utility("border-transparent")}:not(${invalid}, :focus-visible)`;
  const labelBorder = `${labelFocus}${toggle}${utility("group-has-[:focus-visible]/field-label:border-transparent")}:not(${invalid})`;
  const slider = `${toggle} > ${thumb}`;
  return [
    rule(`${border}${checked}, ${labelBorder}${checked}`, { "border-color": "var(--primary)" }),
    rule(`${border}${unchecked}, ${labelBorder}${unchecked}`, { "border-color": offBorder }),
    rule(`${toggle}${utility("dark:data-unchecked:bg-input/80")}${unchecked}`, {
      "background-color": filled ? inputMix(90) : "var(--input)",
    }),
    filled ? rule(`${toggle}${utility("border")}`, { "border-width": "2px" }) : "",
    filled
      ? shadowCss(slider, "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)") +
        rule(`${slider}${utility("bg-background")}:not(.dark *)`, {
          "background-clip": "padding-box",
        })
      : "",
  ].join("");
}

/** Append with the other foundation styles so custom component CSS can override the utilities. */
export function getToggleControlsCss(style: string): string {
  const name = style.replace(/^(base|radix)-/, "");
  if (!Object.hasOwn(profiles, name)) return "";
  const profile = profiles[name];
  const content = [
    checkboxCss(profile),
    ringCss(profile),
    profile.shadow ? shadowCss(`:is(${checkbox}, ${toggle})`, "0 1px 2px 0 rgb(0 0 0 / 0.05)") : "",
    profile.switchRadius
      ? rule(`${toggle}${utility("rounded-full")}, ${thumb}${utility("rounded-full")}`, {
          "border-radius": profile.switchRadius,
        })
      : "",
    profile.defaultSize ? switchSizeCss("default", profile.defaultSize, profile) : "",
    profile.smallSize ? switchSizeCss("sm", profile.smallSize, profile) : "",
    profile.surface ? switchSurfaceCss(profile.surface) : "",
  ].join("");
  return `@layer utilities {\n${content}}\n`;
}
