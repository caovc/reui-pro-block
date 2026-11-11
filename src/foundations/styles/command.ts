// The free ReUI c-command-5 example uses the same shadcn Command in both libraries.
// The style values come from the shadcn command and input-group registries (MIT, see notice.ts).
type Radius = "none" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
type CommandStyle = {
  radius?: Radius;
  item: readonly [inlineRadius: Radius, dialogRadius: Radius, inline: number, block: number];
  input: readonly [radius: Radius, height: number, fill: number, addon: number];
  heading?: readonly [inline: number, block: number];
  separator?: readonly [inline: number, block: number];
  compact?: "lyra" | "mira";
  smallIcons?: boolean;
  mediumItem?: boolean;
  minimumItemHeight?: boolean;
  groupPadding?: number;
};

const styles: Readonly<Record<string, CommandStyle>> = {
  maia: {
    radius: "4xl",
    item: ["lg", "2xl", 12, 8],
    input: ["4xl", 36, 30, 12],
    heading: [12, 8],
    separator: [0, 4],
  },
  lyra: {
    radius: "none",
    item: ["none", "none", 8, 8],
    input: ["none", 32, 30, 8],
    compact: "lyra",
    groupPadding: 0,
  },
  mira: {
    item: ["md", "md", 10, 6],
    input: ["md", 32, 20, 8],
    heading: [10, 6],
    separator: [-4, 4],
    compact: "mira",
    smallIcons: true,
    minimumItemHeight: true,
  },
  luma: {
    radius: "4xl",
    item: ["2xl", "3xl", 12, 8],
    input: ["4xl", 36, 50, 12],
    heading: [12, 8],
    separator: [0, 6],
    groupPadding: 6,
    mediumItem: true,
  },
  sera: {
    radius: "none",
    item: ["none", "none", 12, 8],
    input: ["none", 40, 0, 0],
    heading: [12, 8],
    separator: [-6, 6],
    groupPadding: 6,
    smallIcons: true,
  },
  rhea: {
    radius: "3xl",
    item: ["xl", "2xl", 8, 6],
    input: ["2xl", 32, 50, 8],
    separator: [0, 4],
    minimumItemHeight: true,
  },
};

const slot = (name: string) => `[data-slot="${name}"]`;
const rem = (pixels: number) => (pixels === 0 ? "0" : `${pixels / 16}rem`);
const radiusScale = { md: 0.8, lg: 1, xl: 1.4, "2xl": 1.8, "3xl": 2.2, "4xl": 2.6 };
const radius = (name: Radius) =>
  name === "none" ? "0" : `calc(var(--radius, 0.625rem) * ${radiusScale[name]})`;
const mix = (token: string, amount: number) =>
  `color-mix(in oklab, var(--${token}) ${amount}%, transparent)`;
const item = slot("command-item");
const heading = `${slot("command-group")} [cmdk-group-heading]`;
const wrapper = slot("command-input-wrapper");
const inputGroup = `${wrapper} > ${slot("input-group")}`;

function rule(selector: string, declarations: Record<string, string>) {
  const body = Object.entries(declarations)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");
  return `:where(${selector}) {\n${body}\n}\n`;
}

export function getCommandCss(name: string) {
  if (name === "vega") {
    return rule(`${item}[data-selected="true"] svg`, { color: "var(--foreground)" });
  }
  const style = styles[name];
  if (!style) return "";

  const [itemRadius, dialogRadius, itemInline, itemBlock] = style.item;
  const [inputRadius, inputHeight, inputFill, addonPadding] = style.input;
  const sections = [
    rule(item, { "--command-item-dialog-radius": radius(dialogRadius) }),
    rule(`${item}[class~="rounded-sm"]`, { "border-radius": radius(itemRadius) }),
    rule(`${item}[class~="px-2"]`, { "padding-inline": rem(itemInline) }),
    rule(`${item}[class~="py-1.5"]`, { "padding-block": rem(itemBlock) }),
    rule(inputGroup, {
      "--command-input-height": rem(inputHeight),
      "--command-input-radius": radius(inputRadius),
      "--command-addon-padding": rem(addonPadding),
      "background-color": inputFill ? mix("input", inputFill) : "transparent",
    }),
  ];

  if (style.radius) {
    sections.push(
      rule(`${slot("command")}, [data-command-dialog]`, {
        "--command-radius": radius(style.radius),
      }),
    );
  }
  if (style.heading) {
    const [inline, block] = style.heading;
    sections.push(rule(heading, { "padding-inline": rem(inline), "padding-block": rem(block) }));
  }
  if (style.separator) {
    const [inline, block] = style.separator;
    sections.push(
      rule(slot("command-separator"), {
        "margin-inline": rem(inline),
        "margin-block": rem(block),
        "background-color": mix("border", 50),
      }),
    );
  }
  if (style.groupPadding !== undefined) {
    sections.push(
      rule(`${slot("command-group")}[class~="p-1"]`, { padding: rem(style.groupPadding) }),
    );
  }
  if (style.mediumItem) sections.push(rule(item, { "font-weight": "500" }));
  if (style.minimumItemHeight) sections.push(rule(item, { "min-height": rem(28) }));
  if (style.smallIcons) {
    sections.push(
      rule(item, { "--command-icon-size": rem(14) }),
      rule(`${inputGroup} ${slot("input-group-addon")} > svg`, { width: rem(14), height: rem(14) }),
    );
  }
  if (style.compact) {
    const selectors = ["command-input", "command-empty", "command-item"]
      .map((key) => `${slot(key)}[class~="text-sm"]`)
      .join(", ");
    sections.push(
      rule(selectors, {
        "font-size": rem(12),
        "line-height": style.compact === "lyra" ? rem(16) : "1.625",
      }),
    );
  }
  if (name === "maia" || name === "mira") {
    sections.push(rule(inputGroup, { "border-color": "var(--input)" }));
  }
  if (name === "luma" || name === "rhea") {
    sections.push(rule(inputGroup, { "border-color": "transparent" }));
  }
  if (name === "mira") {
    sections.push(
      rule(`.dark ${inputGroup}`, { "background-color": mix("input", 30) }),
      rule(`${slot("command-shortcut")}[class~="text-xs"]`, {
        "font-size": rem(10),
        "line-height": "1.5",
      }),
    );
  }
  if (name === "lyra") {
    sections.push(
      rule(`${slot("command")}[class~="p-1"], ${wrapper}`, { padding: "0" }),
      rule(wrapper, { "border-bottom": "1px solid var(--border)" }),
      rule(inputGroup, { "border-style": "none" }),
      rule(heading, { "font-weight": "400" }),
      rule(slot("command-list"), { "scroll-padding-block": "0" }),
    );
  }
  if (name === "sera") {
    sections.push(
      rule(`${slot("command")}[class~="p-1"]`, { padding: "0" }),
      rule(wrapper, { "padding-bottom": rem(4) }),
      rule(inputGroup, {
        "border-color": "transparent",
        "border-bottom-color": "var(--input)",
        "padding-inline": rem(12),
      }),
      rule(slot("command-input"), { "padding-inline": rem(8) }),
      rule(heading, {
        "font-weight": "600",
        "letter-spacing": "0.05em",
        "text-transform": "uppercase",
      }),
    );
  }
  return sections.join("");
}
