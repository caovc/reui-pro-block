import type { UiStyle } from "./index.ts";

// The free ReUI registry ships the same NumberField for both libraries.
// Only group and stepper corners, stepper padding, and a few icons differ
// from Nova. The input and the three group heights are shared.
// https://reui.io/components/number-field
type Radius = "none" | "md" | "2xl" | "3xl" | "4xl";
type SizeSteps = readonly [small: number, standard: number, large: number];
type NumberFieldProfile = {
  corner: Radius;
  padding?: SizeSteps;
  icons?: SizeSteps;
};

const roomier = [8, 10, 12] as const;
const profiles: Readonly<Record<Exclude<UiStyle, "nova">, NumberFieldProfile>> = {
  vega: { corner: "md", padding: roomier },
  maia: { corner: "4xl", padding: roomier },
  lyra: { corner: "none" },
  mira: { corner: "md", padding: [6, 6, 8], icons: [12, 14, 14] },
  luma: { corner: "3xl", padding: roomier },
  sera: { corner: "none", padding: [12, 14, 16], icons: [14, 14, 14] },
  rhea: { corner: "2xl" },
};

const nova = [
  { size: "sm", padding: 6, icon: 14 },
  { size: "default", padding: 8, icon: 16 },
  { size: "lg", padding: 10, icon: 16 },
] as const;

const group = '[data-slot="number-field-group"]';
const decrement = '[data-slot="number-field-decrement"]';
const increment = '[data-slot="number-field-increment"]';
const stepper = `:is(${decrement}, ${increment})`;
const utility = (name: string) => `[class~="${name}"]`;

export function getNumberFieldCss(
  style: Exclude<UiStyle, "nova">,
  {
    rule,
    radius,
    length,
  }: {
    rule: (selector: string, declarations: Record<string, string>) => string;
    radius: (corner: Radius) => string;
    length: (pixels: number) => string;
  },
) {
  const profile = profiles[style];
  const corner = radius(profile.corner);
  const rules = [
    rule(`${group}${utility("rounded-lg")}`, { "border-radius": corner }),
    rule(`${decrement}${utility("rounded-s-lg")}`, {
      "border-start-start-radius": corner,
      "border-end-start-radius": corner,
    }),
    rule(`${increment}${utility("rounded-e-lg")}`, {
      "border-start-end-radius": corner,
      "border-end-end-radius": corner,
    }),
  ];

  // Match the original utility at each size so a caller's overrides still win.
  for (const [index, defaults] of nova.entries()) {
    const selector = `${stepper}[data-size="${defaults.size}"]`;
    const padding = profile.padding?.[index];
    const icon = profile.icons?.[index];
    if (padding !== undefined && padding !== defaults.padding) {
      rules.push(
        rule(`${selector}${utility(`px-${defaults.padding / 4}`)}`, {
          "padding-inline": length(padding),
        }),
      );
    }
    if (icon !== undefined && icon !== defaults.icon) {
      const iconUtility = utility(`[&_svg:not([class*='size-'])]:size-${defaults.icon / 4}`);
      rules.push(
        rule(`${selector}${iconUtility} svg:not([class*="size-"])`, {
          width: length(icon),
          height: length(icon),
        }),
      );
    }
  }
  return rules.join("");
}
