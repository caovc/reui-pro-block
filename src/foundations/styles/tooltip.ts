// ReUI's free c-tooltip-1 example composes the stock shadcn Tooltip.
// Preset geometry follows shadcn-ui/ui@8ab27715521cbd4f87ae6886cd989cbb678f6de7 (MIT, see notice.ts).
const radii = {
  maia: [1.8, 2.6],
  lyra: [0, 0],
  luma: [1.4, 1],
  sera: [0, 0],
  rhea: [1.4, 1],
} as const;

const tooltip = '[data-slot="tooltip-content"]';
const kbd = `${tooltip} [data-slot="kbd"]`;
const arrowRadius = '[class~="rounded-[2px]"]';
const baseArrow = `${tooltip} > [data-slot="tooltip-arrow"]`;
// Radix renders the arrow SVG in a positioned, rotated span and gives it no slot.
const radixArrow = `${tooltip} > span > svg[class~="rotate-45"]`;

function radius(scale: number) {
  return scale === 0 ? "0" : `calc(var(--radius, 0.625rem) * ${scale})`;
}

// Match the original utility only. A caller can replace the default class or
// override the property with its own unlayered CSS.
function replace(selector: string, utility: string, property: string, value: string) {
  return `:where(${selector}[class~="${utility}"]) { ${property}: ${value}; }\n`;
}

// The site-wide kbd element style otherwise takes precedence over the nested
// shortcut's utilities. Keep that legacy style for Nova and Vega.
const restoreShortcutUtilities = `kbd:where(${kbd}) {
  background: revert-layer;
  border: revert-layer;
  border-radius: revert-layer;
  color: revert-layer;
  font-family: revert-layer;
  font-size: revert-layer;
  padding: revert-layer;
}\n`;

function shortcut(selector: string, utility: string, property: string, value: string) {
  return `kbd${replace(selector, utility, property, value)}`;
}

function arrowShift(left: string, right: string) {
  return (
    `:where(${baseArrow}:is(${left})) { --tw-translate-x: -1.5px; }\n` +
    `:where(${baseArrow}:is(${right})) { --tw-translate-x: 1.5px; }\n`
  );
}

export function getTooltipCss(style: string): string {
  const name = style.replace(/^(base|radix)-/, "");
  const sections = [];

  if (Object.hasOwn(radii, name)) {
    const [popup, key] = radii[name as keyof typeof radii];
    const defaultShortcut = `${tooltip}[class~="**:data-[slot=kbd]:rounded-sm"] [data-slot="kbd"]`;
    sections.push(
      restoreShortcutUtilities,
      replace(tooltip, "rounded-md", "border-radius", radius(popup)),
      shortcut(defaultShortcut, "rounded-sm", "border-radius", radius(key)),
    );
    if (popup === 0) {
      sections.push(
        `:where(${baseArrow}${arrowRadius}, ${radixArrow}${arrowRadius}) { border-radius: 0; }\n`,
      );
    }
  }

  if (name === "maia" || name === "luma" || name === "rhea") {
    sections.push(
      arrowShift(
        '[data-side="left"], [data-side="inline-start"]',
        '[data-side="right"], [data-side="inline-end"]',
      ),
    );
  }
  if (name === "sera") {
    sections.push(arrowShift('[data-side="inline-start"]', '[data-side="inline-end"]'));
  }
  if (name === "luma" || name === "sera") {
    sections.push(
      replace(kbd, "h-5", "height", "1.375rem"),
      replace(kbd, "min-w-5", "min-width", "1.375rem"),
      shortcut(kbd, "px-1", "padding-inline", "0.375rem"),
    );
  }
  if (name === "mira") {
    sections.push(
      restoreShortcutUtilities,
      shortcut(kbd, "text-xs", "font-size", "0.625rem"),
      replace(kbd, "text-xs", "line-height", "1.5"),
    );
  }
  return sections.join("");
}
