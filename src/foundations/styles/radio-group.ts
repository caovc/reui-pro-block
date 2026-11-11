// ReUI's free c-radio-group-7 pattern composes Field and the stock shadcn radios.
// Style differences follow shadcn-ui/ui@8ab27715521cbd4f87ae6886cd989cbb678f6de7,
// apps/v4/registry/styles/style-*.css (MIT, see notice.ts).

const roomyStyles = new Set(["vega", "maia", "mira", "luma", "sera", "rhea"]);
const group = '[data-slot="radio-group"]';
const item = '[data-slot="radio-group-item"]';
const indicator = '[data-slot="radio-group-indicator"]';
const icon = `${indicator} > [class~="size-2"]`;
const checked = ':where([data-state="checked"], [data-checked]:not([data-checked="false"]))';
const invalid = '[aria-invalid="true"]';
const fieldFocus = '[class~="group/field-label"]:has(:focus-visible)';
const utility = (name: string) => `[class~="${name}"]`;
const noBackgroundOverride = ':not([class^="bg-"], [class*=" bg-"])';

// A caller can supply an axis utility alongside gap-2, including a responsive one.
function gapCss() {
  const withDefaultGap = `${group}${utility("gap-2")}:not([class*=":gap-"])`;
  return `
  ${withDefaultGap}:not([class^="gap-x-"], [class*=" gap-x-"], [class*=":gap-x-"]) {
    column-gap: 0.75rem;
  }
  ${withDefaultGap}:not([class^="gap-y-"], [class*=" gap-y-"], [class*=":gap-y-"]) {
    row-gap: 0.75rem;
  }
`;
}

const uncheckedFill = `${item}${utility("dark:bg-input/30")}${noBackgroundOverride}:not(${checked})`;
const ordinaryBorder = `${item}${utility("border-input")}:not(:focus-visible, ${invalid})`;
const checkedBorder = `${item}${utility("data-checked:border-primary")}${checked}`;
const invalidCheckedBorder = `${item}${utility("aria-invalid:border-destructive")}${utility("aria-invalid:aria-checked:border-primary")}${invalid}${checked}`;
const darkInvalidCheckedBorder = `.dark ${invalidCheckedBorder}${utility("dark:aria-invalid:border-destructive/50")}`;
const fieldCheckedBorder = `${fieldFocus} ${checkedBorder}${utility("group-has-[:focus-visible]/field-label:data-checked:border-primary")}`;
const fieldUncheckedBorder = `${fieldFocus} ${item}${utility("border-input")}${utility("group-has-[:focus-visible]/field-label:not-data-checked:border-input")}:not(${checked})`;

function filledRadioCss(rhea: boolean) {
  return `
  ${uncheckedFill} {
    background-color: color-mix(in oklab, var(--input) 90%, transparent);
  }
  ${ordinaryBorder}:not(${checked}),
  ${checkedBorder}:not(:focus-visible, ${invalid}),
  ${fieldCheckedBorder}:not(:focus-visible, ${invalid}),
  ${fieldUncheckedBorder}:not(:focus-visible, ${invalid}) {
    border-color: transparent;
  }
  ${fieldCheckedBorder}${utility("focus-visible:border-ring")}:focus-visible:not(${invalid}),
  ${fieldUncheckedBorder}${utility("focus-visible:border-ring")}:focus-visible:not(${invalid}) {
    border-color: var(--ring);
  }
  ${invalidCheckedBorder} {
    border-color: var(--destructive);
  }
  ${darkInvalidCheckedBorder} {
    border-color: color-mix(in oklab, var(--destructive) 50%, transparent);
  }
  .dark ${icon} {
    width: 0.625rem;
    height: 0.625rem;
  }
${rhea ? `  ${item}${utility("rounded-full")} { border-radius: calc(var(--radius, 0.625rem) * 1.8); }\n` : ""}`;
}

function seraCss() {
  const checkedFill = `${item}${utility("data-checked:bg-primary")}${utility("dark:data-checked:bg-primary")}${noBackgroundOverride}${checked}`;
  return `
  :is(${item}, ${indicator})${utility("size-4")} {
    width: 1.125rem;
    height: 1.125rem;
  }
  ${uncheckedFill},
  ${checkedFill} {
    background-color: transparent;
  }
  ${checkedBorder}:not(:focus-visible, ${invalid}),
  ${invalidCheckedBorder},
  ${fieldCheckedBorder}:not(${invalid}) {
    border-color: var(--foreground);
  }
  ${darkInvalidCheckedBorder} {
    border-color: color-mix(in oklab, var(--destructive) 50%, transparent);
  }
  ${item}${utility("data-checked:text-primary-foreground")}${checked}:not([class^="text-"], [class*=" text-"]) {
    color: inherit;
  }
  ${icon}${utility("bg-primary-foreground")} {
    background-color: var(--foreground);
  }
  ${item}${utility("focus-visible:ring-3")}:focus-visible,
  ${item}${utility("aria-invalid:ring-3")}${invalid} {
    --tw-ring-shadow: 0 0 0 calc(2px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, var(--ring));
  }
`;
}

/** Append to the foundation CSS. The stock Base UI and Radix UI controls share these slots. */
export function getRadioGroupCss(style: string): string {
  const name = style.replace(/^(base|radix)-/, "");
  if (!roomyStyles.has(name)) return "";

  const filled = name === "luma" || name === "rhea";
  const sera = name === "sera";
  const focus =
    filled || sera
      ? `  ${item}${utility("focus-visible:ring-ring/50")}:focus-visible:not(${invalid}) {
    --tw-ring-color: color-mix(in oklab, var(--ring) 30%, transparent);
  }\n`
      : "";
  return `@layer utilities {\n${gapCss()}${filled ? filledRadioCss(name === "rhea") : ""}${sera ? seraCss() : ""}${focus}}\n`;
}
