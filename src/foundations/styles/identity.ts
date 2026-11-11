// ReUI's free c-avatar-16 pairs the stock Avatar with the extended ReUI Badge.
// Only the stock identity defaults below follow shadcn's style-*.css at
// shadcn-ui/ui@8ab27715521cbd4f87ae6886cd989cbb678f6de7 (MIT, see notice.ts).

const badge = ':where([data-slot="badge"][data-variant][class~="group/badge"])';
const avatarCount = ':where([data-slot="avatar-group-count"])';
const utility = (name: string) => `[class~="${name}"]`;
const variant = (name: string) => `${badge}:where([data-variant="${name}"])`;
const dark = ":is(.dark *)";

function rule(selector: string, declarations: Record<string, string>) {
  const body = Object.entries(declarations)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");
  return `${selector} {\n${body}\n}\n`;
}

function layer(name: "components" | "utilities", content: string) {
  return content ? `@layer ${name} {\n${content}}\n` : "";
}

function replace(selector: string, token: string, declarations: Record<string, string>) {
  return rule(`${selector}${utility(token)}`, declarations);
}

function withoutPrefixes(...prefixes: string[]) {
  const classes = prefixes.flatMap((prefix) => [`[class^="${prefix}"]`, `[class*=" ${prefix}"]`]);
  return `:where(:not(${classes.join(", ")}))`;
}

function withoutModifiers(...prefixes: string[]) {
  return `:where(:not(${prefixes.map((prefix) => `[class*=":${prefix}"]`).join(", ")}))`;
}

function badgeRadius(value: string) {
  const corners = withoutPrefixes(
    "rounded-t",
    "rounded-b",
    "rounded-l",
    "rounded-r",
    "rounded-s",
    "rounded-e",
  );
  return replace(`${badge}${corners}${withoutModifiers("rounded-")}`, "rounded-4xl", {
    "border-radius": value,
  });
}

function outlineFill(light: number, night = light) {
  const fill = (opacity: number) => `color-mix(in oklab, var(--input) ${opacity}%, transparent)`;
  // Outline has no stock background utility. An explicit caller utility can
  // therefore win over the style default in the components layer.
  const outline = variant("outline");
  return layer(
    "components",
    rule(outline, { "background-color": fill(light) }) +
      (night === light ? "" : rule(`${outline}${dark}`, { "background-color": fill(night) })),
  );
}

function countTypography(lineHeight: string) {
  return replace(avatarCount, "text-sm", {
    "font-size": "var(--text-xs, 0.75rem)",
    "line-height": `var(--tw-leading, ${lineHeight})`,
  });
}

function compactBadgeText() {
  return replace(badge, "text-xs", {
    "font-size": "0.625rem",
    "line-height": "var(--tw-leading, inherit)",
  });
}

function seraGeometry() {
  const horizontal = withoutModifiers("p-", "px-", "ps-", "pe-");
  const start = withoutPrefixes("ps-", "pl-", "pr-") + horizontal;
  const end = withoutPrefixes("pe-", "pr-", "pl-") + horizontal;
  const vertical = withoutPrefixes("pt-", "pb-") + withoutModifiers("p-", "py-", "pt-", "pb-");
  const border = withoutPrefixes(
    "border-x-",
    "border-y-",
    "border-s-",
    "border-e-",
    "border-t-",
    "border-b-",
    "border-l-",
    "border-r-",
  );
  return [
    replace(`${badge}${withoutModifiers("h-", "size-")}`, "h-5", {
      height: "auto",
    }),
    replace(`${badge}${withoutModifiers("gap-")}`, "gap-1", { gap: "0.375rem" }),
    badgeRadius("0"),
    replace(`${badge}${border}`, "border", { "border-width": "0" }),
    replace(`${badge}${start}`, "px-2", { "padding-inline-start": "0" }),
    replace(`${badge}${end}`, "px-2", { "padding-inline-end": "0" }),
    replace(`${badge}${vertical}`, "py-0.5", { "padding-block": "0" }),
    replace(
      `${badge}${start}:where(${utility("px-2")}):has([data-icon="inline-start"])`,
      "has-data-[icon=inline-start]:pl-1.5",
      { "padding-left": "0" },
    ),
    replace(
      `${badge}${end}:where(${utility("px-2")}):has([data-icon="inline-end"])`,
      "has-data-[icon=inline-end]:pr-1.5",
      { "padding-right": "0" },
    ),
    compactBadgeText(),
    replace(badge, "font-medium", { "font-weight": "var(--font-weight-semibold, 600)" }),
    replace(badge, "transition-all", {
      "transition-property":
        "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to",
    }),
  ].join("");
}

function seraVariants() {
  const primary = variant("default");
  const secondary = variant("secondary");
  const outline = variant("outline");
  const destructive = variant("destructive");
  const ghost = variant("ghost");
  const foregroundHover = "color-mix(in oklab, var(--foreground) 70%, transparent)";
  const transparent = { "background-color": "transparent" };
  const hover = [
    replace(`a${primary}:hover`, "[a]:hover:bg-primary/80", transparent),
    replace(`a${primary}:hover`, "text-primary-foreground", { color: foregroundHover }),
    replace(`a${secondary}:hover`, "[a]:hover:bg-secondary/80", transparent),
    replace(`a${secondary}:hover`, "text-secondary-foreground", { color: "var(--foreground)" }),
    replace(`a${outline}:hover`, "[a]:hover:bg-muted", transparent),
    replace(`a${outline}:hover`, "[a]:hover:text-muted-foreground", { color: foregroundHover }),
    replace(`a${destructive}:hover`, "[a]:hover:bg-destructive/20", transparent),
    replace(`a${destructive}:hover`, "text-destructive", {
      color: "color-mix(in oklab, var(--destructive) 70%, transparent)",
    }),
    replace(`${ghost}:hover`, "hover:bg-muted", transparent),
    replace(`${ghost}${dark}:hover`, "dark:hover:bg-muted/50", transparent),
    replace(`${ghost}:hover`, "hover:text-muted-foreground", { color: "var(--foreground)" }),
  ].join("");
  return [
    replace(primary, "bg-primary", transparent),
    replace(primary, "text-primary-foreground", { color: "var(--foreground)" }),
    replace(secondary, "bg-secondary", transparent),
    replace(secondary, "text-secondary-foreground", { color: "var(--muted-foreground)" }),
    replace(destructive, "bg-destructive/10", transparent),
    replace(`${destructive}${dark}`, "dark:bg-destructive/20", transparent),
    replace(variant("link"), "text-primary", { color: "var(--foreground)" }),
    `@media (hover: hover) {\n${hover}}\n`,
  ].join("");
}

const badgeRadii: Record<string, string> = {
  lyra: "0",
  mira: "calc(infinity * 1px)",
  luma: "calc(var(--radius, 0.625rem) * 2.2)",
  rhea: "calc(var(--radius, 0.625rem) * 1.8)",
};

/** Adjust the existing Avatar and stock Badge utilities for the selected style. */
export function getIdentityCss(style: string): string {
  const name = style.replace(/^(base|radix)-/, "");
  if (name === "maia") return outlineFill(30);
  if (name === "sera") {
    return (
      layer(
        "components",
        rule(badge, { "text-transform": "uppercase", "letter-spacing": "0.1em" }) +
          rule(variant("ghost"), { color: "var(--muted-foreground)" }),
      ) + layer("utilities", seraGeometry() + seraVariants())
    );
  }
  if (!Object.hasOwn(badgeRadii, name)) return "";
  const radius = badgeRadius(badgeRadii[name]);
  if (name === "lyra") return layer("utilities", radius + countTypography("1.333333"));
  if (name === "mira") {
    const icon = `${badge}${utility("[&>svg]:size-3!")} > svg${withoutPrefixes("size-", "w-", "h-")}`;
    return (
      outlineFill(20, 30) +
      layer(
        "utilities",
        radius +
          countTypography("1.625") +
          compactBadgeText() +
          rule(icon, { width: "0.625rem !important", height: "0.625rem !important" }),
      )
    );
  }
  return layer("utilities", radius);
}
