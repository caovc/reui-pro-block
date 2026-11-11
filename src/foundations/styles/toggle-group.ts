// ReUI's free c-toggle-1 and c-toggle-group-5 compositions use the shared shadcn controls.
// Style values come from apps/v4/registry/styles/style-*.css at
// shadcn-ui/ui@8ab27715521cbd4f87ae6886cd989cbb678f6de7 (MIT, see notice.ts).

type Size = readonly [height: number, padding: number, iconInset: number];
type Sizes = readonly [defaultSize: Size, small: Size, large: Size];
type Corner = "none" | "md" | "2xl" | "3xl" | "4xl";
type Profile = {
  corner: Corner;
  sizes?: Sizes;
  smallCornerCap?: number;
  edgeCorner?: Corner;
  outlineGroupOnly?: boolean;
  connectedPadding?: number;
  connectedIconInset?: number;
  compact?: boolean;
  smallText?: number;
  iconSize?: number;
  smallIconSize?: number;
  transition?: string;
  softRing?: boolean;
  shadow?: boolean;
  editorial?: boolean;
};

const novaSizes: Sizes = [
  [8, 2.5, 2],
  [7, 2.5, 1.5],
  [9, 2.5, 2],
];
const largeSizes: Sizes = [
  [9, 3, 2.5],
  [8, 3, 2],
  [10, 4, 3],
];
const colorTransition =
  "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke";
const profiles: Record<string, Profile> = {
  vega: {
    corner: "md",
    sizes: [
      [9, 2.5, 2],
      [8, 2.5, 1.5],
      [10, 2.5, 2],
    ],
    transition: "color, box-shadow",
    shadow: true,
  },
  maia: {
    corner: "4xl",
    sizes: largeSizes,
    edgeCorner: "3xl",
    outlineGroupOnly: true,
    connectedPadding: 3,
    transition: colorTransition,
  },
  lyra: { corner: "none", compact: true },
  mira: {
    corner: "md",
    sizes: [
      [7, 2, 1.5],
      [6, 2, 1.5],
      [8, 2.5, 2],
    ],
    smallCornerCap: 8,
    compact: true,
    smallText: 10,
    smallIconSize: 3,
  },
  luma: {
    corner: "3xl",
    sizes: largeSizes,
    outlineGroupOnly: true,
    connectedPadding: 3,
    connectedIconInset: 2.5,
    transition: colorTransition,
    softRing: true,
  },
  sera: {
    corner: "none",
    sizes: [
      [10, 6, 4],
      [9, 4, 3],
      [11, 8, 5],
    ],
    outlineGroupOnly: true,
    connectedPadding: 6,
    connectedIconInset: 4,
    compact: true,
    iconSize: 3.5,
    transition: colorTransition,
    softRing: true,
    editorial: true,
  },
  rhea: {
    corner: "2xl",
    outlineGroupOnly: true,
    transition: colorTransition,
    softRing: true,
  },
};

const item = ':where([data-slot="toggle-group-item"])';
const group = ':where([data-slot="toggle-group"])';
const toggle = ':where([data-slot="toggle"], [data-slot="toggle-group-item"])';
const connected = `${group}[data-spacing="0"] ${item}:where([data-spacing="0"])`;
const groupOutline = ':where([data-spacing="0"][data-variant="outline"])';
const smallCorner = "rounded-[min(var(--radius-md),12px)]";
const smallGroupCorner = "data-[size=sm]:rounded-[min(var(--radius-md),10px)]";
const explicitShadow =
  ':is([class~="shadow"], [class^="shadow-"], [class*=" shadow-"], [class*=":shadow-"])';
const spacing = (value: number) => `calc(var(--spacing, 0.25rem) * ${value})`;
const utility = (value: string) => `[class~="${value}"]`;
const cornerScales = { md: 0.8, "2xl": 1.8, "3xl": 2.2, "4xl": 2.6 };
const radius = (corner: Corner) =>
  corner === "none" ? "0" : `calc(var(--radius, 0.625rem) * ${cornerScales[corner]})`;

function rule(selector: string, properties: Record<string, string>) {
  const body = Object.entries(properties)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");
  return `${selector} {\n${body}\n}\n`;
}

function replace(selector: string, previous: string, property: string, value: string) {
  return rule(`${selector}${utility(previous)}`, { [property]: value });
}

const iconSides = [
  ["start", "left", "pl"],
  ["end", "right", "pr"],
] as const;

function iconInsetCss(selector: string, original: number, inset: number, modifier = "") {
  if (original === inset) return "";
  return iconSides
    .map(([position, side, prefix]) => {
      const icon = `[data-icon="inline-${position}"]`;
      const token = `${modifier}has-data-[icon=inline-${position}]:${prefix}-${original}`;
      return replace(`${selector}:has(${icon})`, token, `padding-${side}`, spacing(inset));
    })
    .join("");
}

function inlinePaddingCss(selector: string, original: string, padding: number) {
  // px can survive a one-sided override in cn. Match each side independently so
  // the new profile does not win over the caller's pl/pr or logical padding.
  return iconSides
    .map(([, side, prefix]) => {
      const plain = [prefix, "ps", "pe"].flatMap((name) => [
        `[class^="${name}-"]`,
        `[class*=" ${name}-"]`,
      ]);
      const variants = ["sm", "md", "lg", "xl", "rtl", "ltr"].flatMap((variant) =>
        [prefix, "px", "p", "ps", "pe"].map((name) => `[class*="${variant}:${name}-"]`),
      );
      const guard = `:where(:not(${[...plain, ...variants].join(", ")}))`;
      return replace(`${selector}${guard}`, original, `padding-${side}`, spacing(padding));
    })
    .join("");
}

const sizeNames = ["default", "sm", "lg"] as const;
const defaultMinimums = novaSizes.map(([height]) => utility(`min-w-${height}`)).join(", ");

function dimensionsCss(profile: Profile) {
  const sizes = profile.sizes ?? novaSizes;
  const heightOverride =
    ':where(:not([class*=":h-"], [class*="sm:size-"], [class*="md:size-"], [class*="lg:size-"], [class*="xl:size-"]))';
  const minWidthOverride = ':where(:not([class*=":min-w-"]))';
  return novaSizes
    .map(([height, padding, iconInset], index) => {
      const [nextHeight, nextPadding, nextIconInset] = sizes[index];
      // Standalone Toggle has no data-size. Its default minimum width identifies the
      // size even when a caller replaces the height. Fall back to the default height.
      const size = `${toggle}:where([data-size="${sizeNames[index]}"], :not([data-size])${utility(`min-w-${height}`)}, :not([data-size], ${defaultMinimums})${utility(`h-${height}`)})`;
      return [
        nextHeight === height
          ? ""
          : replace(`${size}${heightOverride}`, `h-${height}`, "height", spacing(nextHeight)),
        nextHeight === height
          ? ""
          : replace(
              `${size}${minWidthOverride}`,
              `min-w-${height}`,
              "min-width",
              spacing(nextHeight),
            ),
        nextPadding === padding ? "" : inlinePaddingCss(size, `px-${padding}`, nextPadding),
        iconInsetCss(size, iconInset, nextIconInset),
      ].join("");
    })
    .join("");
}

function cornersCss(profile: Profile) {
  const corner = radius(profile.corner);
  const small = profile.smallCornerCap ? `min(${corner}, ${profile.smallCornerCap}px)` : corner;
  const groupCorner = profile.outlineGroupOnly ? "0" : corner;
  const groupSmall = profile.outlineGroupOnly ? "0" : small;
  const smallGroup = `${group}[data-size="sm"]`;
  const edges = [
    ["horizontal", "first", "l", "top-left", "bottom-left"],
    ["horizontal", "last", "r", "top-right", "bottom-right"],
    ["vertical", "first", "t", "top-left", "top-right"],
    ["vertical", "last", "b", "bottom-left", "bottom-right"],
  ] as const;
  return [
    replace(toggle, "rounded-lg", "border-radius", corner),
    replace(toggle, smallCorner, "border-radius", small),
    replace(group, "rounded-lg", "border-radius", groupCorner),
    replace(smallGroup, smallGroupCorner, "border-radius", groupSmall),
    profile.outlineGroupOnly
      ? replace(`${group}${groupOutline}`, "rounded-lg", "border-radius", corner) +
        replace(`${smallGroup}${groupOutline}`, smallGroupCorner, "border-radius", corner)
      : "",
    ...edges.map(([orientation, edge, abbreviation, a, b]) => {
      const parent = `${group}:where([data-orientation="${orientation}"])`;
      const token = `group-data-${orientation}/toggle-group:data-[spacing=0]:${edge}:rounded-${abbreviation}-lg`;
      const selector = `${parent} ${item}[data-spacing="0"]${utility(token)}:${edge}-child`;
      const value = radius(profile.edgeCorner ?? profile.corner);
      return rule(selector, { [`border-${a}-radius`]: value, [`border-${b}-radius`]: value });
    }),
  ].join("");
}

function typographyCss(profile: Profile) {
  const normal = profile.compact ? 12 : 14;
  const small = profile.smallText ?? normal;
  const text = (size: number) => ({
    "font-size": `${size / 16}rem`,
    "line-height": size === 14 ? "1.428571" : "1.333333",
  });
  const svg = " svg:not([class*='size-'])";
  const icon = (token: string, size: number) =>
    rule(`${toggle}${utility(`[&_svg:not([class*='size-'])]:size-${token}`)}${svg}`, {
      width: spacing(size),
      height: spacing(size),
    });
  return [
    profile.compact ? rule(`${toggle}${utility("text-sm")}`, text(normal)) : "",
    rule(`${toggle}${utility("text-[0.8rem]")}`, text(small)),
    profile.iconSize ? icon("4", profile.iconSize) : "",
    profile.smallIconSize !== 3.5
      ? icon("3.5", profile.smallIconSize ?? profile.iconSize ?? 4)
      : "",
    profile.editorial
      ? replace(toggle, "gap-1", "gap", spacing(1.5)) +
        replace(toggle, "font-medium", "font-weight", "600") +
        rule(
          `${toggle}:where(:not(.lowercase, .capitalize, .normal-case, [class*=":lowercase"], [class*=":capitalize"], [class*=":normal-case"]))`,
          {
            "text-transform": "uppercase",
          },
        ) +
        rule(
          `${toggle}:where(:not([class^="tracking-"], [class*=" tracking-"], [class*=":tracking-"]))`,
          {
            "letter-spacing": "0.1em",
          },
        ) +
        rule(
          `:where([data-slot="toggle-group-item"]:is([aria-pressed="true"], [data-state="on"], [data-pressed]))`,
          {
            color: "var(--foreground)",
          },
        )
      : "",
  ].join("");
}

function shadowCss(selector: string) {
  return rule(`${selector}:where(:not(${explicitShadow}))`, {
    "--tw-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "box-shadow": [
      "var(--tw-inset-shadow, 0 0 #0000)",
      "var(--tw-inset-ring-shadow, 0 0 #0000)",
      "var(--tw-ring-offset-shadow, 0 0 #0000)",
      "var(--tw-ring-shadow, 0 0 #0000)",
      "var(--tw-shadow)",
    ].join(", "),
  });
}

/** Translate non-Nova styles onto the default utilities retained by cn in both foundations. */
export function getToggleGroupCss(style: string): string {
  const name = style.replace(/^(base|radix)-/, "");
  if (!Object.hasOwn(profiles, name)) return "";
  const profile = profiles[name];
  const groupSpacing = "group-data-[spacing=0]/toggle-group:";
  const css = [
    dimensionsCss(profile),
    cornersCss(profile),
    typographyCss(profile),
    profile.connectedPadding
      ? inlinePaddingCss(connected, `${groupSpacing}px-2`, profile.connectedPadding)
      : "",
    profile.connectedIconInset
      ? iconInsetCss(connected, 1.5, profile.connectedIconInset, groupSpacing)
      : "",
    profile.transition
      ? replace(toggle, "transition-all", "transition-property", profile.transition)
      : "",
    profile.softRing
      ? rule(
          `${toggle}${utility("focus-visible:ring-ring/50")}:focus-visible:not([aria-invalid="true"])`,
          {
            "--tw-ring-color": "color-mix(in oklab, var(--ring) 30%, transparent)",
          },
        )
      : "",
    profile.shadow
      ? shadowCss(
          `${toggle}${utility("border-input")}:where(:not([data-slot="toggle-group-item"][data-spacing="0"]))`,
        ) + shadowCss(`${group}${groupOutline}`)
      : "",
  ].join("");
  return `@layer utilities {\n${css}}\n`;
}
