import { getAlertDialogCss } from "./alert-dialog.ts";
import { getCommandCss } from "./command.ts";
import { getFieldCss } from "./field.ts";
import { getIdentityCss } from "./identity.ts";
import { profiles } from "./profiles.ts";
import { styleNotice } from "./notice.ts";
import { getRadioGroupCss } from "./radio-group.ts";
import { sheetPopoverCss } from "./sheet-popover.ts";
import { getSliderCss } from "./slider.ts";
import { getTextEntryCss } from "./text-entry.ts";
import { getToggleControlsCss } from "./toggle-controls.ts";
import { getToggleGroupCss } from "./toggle-group.ts";
import { getTooltipCss } from "./tooltip.ts";

export const UI_STYLES = ["nova", "vega", "maia", "lyra", "mira", "luma", "sera", "rhea"] as const;
export type UiStyle = (typeof UI_STYLES)[number];

const radiusScale = {
  sm: 0.6,
  md: 0.8,
  lg: 1,
  xl: 1.4,
  "2xl": 1.8,
  "3xl": 2.2,
  "4xl": 2.6,
};

const shadows = {
  none: "0 0 #0000",
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
};

type Profile = (typeof profiles)[keyof typeof profiles];
type Radius = Profile["button"]["radius"];
type Declarations = Record<string, string>;

const length = (pixels: number) => (pixels === 0 ? "0" : `${pixels / 16}rem`);
const slot = (name: string) => `[data-slot="${name}"]`;
const utility = (name: string) => `[class~="${name}"]`;
const mix = (token: string, amount: number) =>
  `color-mix(in oklab, var(--${token}) ${amount}%, transparent)`;

function radius(value: Radius): string {
  if (value === "none") return "0";
  if (value === "full") return "9999px";
  if (value === "cap24") return `min(${radius("4xl")}, 24px)`;
  return `calc(var(--radius, 0.625rem) * ${radiusScale[value]})`;
}

function rule(selector: string, declarations: Declarations) {
  const body = Object.entries(declarations)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
  return `${selector} {\n${body}\n}\n`;
}

// Match each original utility separately so a merged caller override remains effective.
function replace(selector: string, original: string, property: string, value: string) {
  return rule(`${selector}${utility(original)}`, { [property]: value });
}

function shadow(selector: string, value: keyof typeof shadows) {
  return rule(selector, {
    "box-shadow": [
      "var(--tw-inset-shadow, 0 0 #0000)",
      "var(--tw-inset-ring-shadow, 0 0 #0000)",
      "var(--tw-ring-offset-shadow, 0 0 #0000)",
      "var(--tw-ring-shadow, 0 0 #0000)",
      shadows[value],
    ].join(", "),
  });
}

const noExplicitShadow = ':not([class^="shadow-"], [class*=" shadow-"])';
const iconPadding = {
  vega: [8, 6, 6, 8],
  maia: [10, 8, 8, 12],
  lyra: [8, 6, 6, 8],
  mira: [6, 6, 6, 8],
  luma: [10, 8, 8, 12],
  sera: [16, 8, 12, 20],
  rhea: [10, 8, 8, 12],
} as const;

const buttonSizes = ["default", "xs", "sm", "lg"] as const;
const originalHeights = ["8", "6", "7", "9"] as const;
const originalPadding = ["2.5", "2", "2.5", "2.5"] as const;
const compactButtonRadii = [
  "rounded-lg",
  "rounded-[min(var(--radius-md),10px)]",
  "rounded-[min(var(--radius-md),12px)]",
  "rounded-lg",
] as const;

function buttonCss(profile: Profile, style: keyof typeof profiles) {
  const { button } = profile;
  // A trigger composed with Button can replace its slot while retaining its button variants.
  const selector = `:is(${slot("button")}, ${utility("group/button")}[data-size][data-variant])`;
  const buttons = buttonSizes
    .map((name, index) => {
      const [height, padding] = button.sizes[index];
      const control = `${selector}[data-size="${name}"]`;
      const icon = `${selector}[data-size="icon${name === "default" ? "" : `-${name}`}"]`;
      const smallIndex = name === "xs" ? 0 : name === "sm" ? 1 : undefined;
      let corner = radius(
        smallIndex === undefined
          ? button.radius
          : (button.smallRadius?.[smallIndex] ?? button.radius),
      );
      if (smallIndex !== undefined && button.radiusCap) {
        corner = `min(${corner}, ${button.radiusCap[smallIndex]}px)`;
      }
      const originalInset = name === "xs" || name === "sm" ? "1.5" : "2";
      const iconInset = length(iconPadding[style][index]);
      return [
        replace(control, `h-${originalHeights[index]}`, "height", length(height)),
        replace(control, `px-${originalPadding[index]}`, "padding-inline", length(padding)),
        replace(
          `${control}:has([data-icon="inline-start"])`,
          `has-data-[icon=inline-start]:pl-${originalInset}`,
          "padding-left",
          iconInset,
        ),
        replace(
          `${control}:has([data-icon="inline-end"])`,
          `has-data-[icon=inline-end]:pr-${originalInset}`,
          "padding-right",
          iconInset,
        ),
        rule(`${icon}${utility(`size-${originalHeights[index]}`)}`, {
          width: length(height),
          height: length(height),
        }),
        replace(control, compactButtonRadii[index], "border-radius", corner),
        replace(icon, compactButtonRadii[index], "border-radius", corner),
      ].join("");
    })
    .join("");

  if (button.typography === "editorial") {
    return (
      buttons +
      rule(
        `${selector}:is(${utility("text-sm")}, ${utility("text-xs")}, ${utility("text-[0.8rem]")})`,
        {
          "font-size": length(12),
          "font-weight": "600",
          "letter-spacing": "0.1em",
          "text-transform": "uppercase",
        },
      )
    );
  }
  if (button.typography === "relaxed") {
    return (
      buttons +
      rule(`${selector}:is(${utility("text-sm")}, ${utility("text-[0.8rem]")})`, {
        "font-size": length(12),
        "line-height": "1.625",
      }) +
      replace(selector, "gap-1.5", "gap", length(4)) +
      replace(`${selector}[data-size="xs"]`, "text-xs", "font-size", length(10))
    );
  }
  if (button.typography === "compact") {
    return (
      buttons +
      rule(`${selector}:is(${utility("text-sm")}, ${utility("text-[0.8rem]")})`, {
        "font-size": length(12),
        "line-height": "1.3333",
      })
    );
  }
  return buttons;
}

function inputCss(profile: Profile) {
  const input = profile.input;
  const selector = slot("input");
  const [height, padding] = input.size;
  const sections = [
    replace(selector, "h-8", "height", length(height)),
    replace(selector, "px-2.5", "padding-inline", length(padding)),
    replace(selector, "rounded-lg", "border-radius", radius(input.radius)),
  ];

  if (input.paddingY !== undefined) {
    sections.push(replace(selector, "py-1", "padding-block", length(input.paddingY)));
  }
  if (input.fill !== undefined) {
    const fill = `${selector}${utility("bg-transparent")}:not(:disabled, [data-disabled])`;
    sections.push(rule(fill, { "background-color": mix("input", input.fill) }));
    if (input.fill === 20) {
      sections.push(rule(`.dark ${fill}`, { "background-color": mix("input", 30) }));
    }
  }
  const border = `${selector}${utility("border-input")}`;
  if (input.transparentBorder) {
    sections.push(
      rule(`${border}:not(:focus-visible, [aria-invalid="true"])`, {
        "border-color": "transparent",
      }),
    );
  }
  if (input.underline) {
    sections.push(
      rule(border, { "border-color": "transparent transparent var(--input)" }),
      rule(`${border}:focus-visible`, { "border-bottom-color": "var(--ring)" }),
      rule(`${border}[aria-invalid="true"]`, { "border-bottom-color": "var(--destructive)" }),
      rule(`${selector}${utility("bg-transparent")}:not(:disabled, [data-disabled])`, {
        "background-color": "transparent",
      }),
      rule(
        `${selector}${utility("focus-visible:ring-3")}:focus-visible, ${selector}${utility("aria-invalid:ring-3")}[aria-invalid="true"]`,
        { "box-shadow": "none" },
      ),
    );
  }
  if (input.shadow) {
    sections.push(shadow(`${selector}${utility("border-input")}${noExplicitShadow}`, input.shadow));
  }
  const typography = `${selector}${utility("text-base")}`;
  if (input.typography === "compact") {
    sections.push(rule(typography, { "font-size": length(12), "line-height": "1.3333" }));
  }
  if (input.typography === "relaxed") {
    sections.push(
      rule(typography, { "font-size": length(14) }),
      `@media (min-width: 48rem) {\n${rule(typography, { "font-size": length(12), "line-height": "1.625" })}}\n`,
    );
  }
  return sections.join("");
}

function focusCss(profile: Profile) {
  const ring = profile.button.ring;
  if (!ring) return "";
  const [width, opacity] = ring;
  const names = profile.input.underline ? ["button"] : ["button", "input"];
  const focus = names.map(
    (name) => `${slot(name)}${utility("focus-visible:ring-3")}:focus-visible`,
  );
  const invalid = names.map(
    (name) => `${slot(name)}${utility("aria-invalid:ring-3")}[aria-invalid="true"]`,
  );
  return (
    rule([...focus, ...invalid].join(",\n"), {
      "--tw-ring-shadow": `0 0 0 calc(${width}px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, var(--ring))`,
    }) +
    rule(
      focus
        .map((selector) => `${selector}:not([aria-invalid="true"], [data-variant="destructive"])`)
        .join(",\n"),
      {
        "--tw-ring-color": mix("ring", opacity),
      },
    )
  );
}

function frameAndCardCss(profile: Profile, style: UiStyle) {
  const { card } = profile;
  const corner = radius(card.radius);
  const headerCorner = style === "maia" ? radius("xl") : corner;
  const frame = slot("frame");
  const root = slot("card");
  const footer = slot("card-footer");
  const frameCorner = utility("[--frame-radius:var(--radius-xl)]");
  const sections = [
    rule(`${frame}${frameCorner}`, { "--frame-radius": corner }),
    replace(root, "rounded-xl", "border-radius", corner),
    rule(`${root}${utility("[--card-spacing:--spacing(4)]")}`, {
      "--card-spacing": length(card.spacing[0]),
    }),
    rule(`${root}[data-size="sm"]${utility("data-[size=sm]:[--card-spacing:--spacing(3)]")}`, {
      "--card-spacing": length(card.spacing[1]),
    }),
    replace(slot("card-header"), "gap-1", "gap", length(card.headerGap)),
    rule(`${slot("card-header")}${utility("rounded-t-xl")}`, {
      "border-start-start-radius": headerCorner,
      "border-start-end-radius": headerCorner,
    }),
    rule(`${footer}${utility("rounded-b-xl")}`, {
      "border-end-start-radius": headerCorner,
      "border-end-end-radius": headerCorner,
    }),
    rule(`${root}${utility("*:[img:first-child]:rounded-t-xl")} > img:first-child`, {
      "border-start-start-radius": corner,
      "border-start-end-radius": corner,
    }),
    rule(`${root}${utility("*:[img:last-child]:rounded-b-xl")} > img:last-child`, {
      "border-end-start-radius": corner,
      "border-end-end-radius": corner,
    }),
    replace(footer, "bg-muted/50", "background-color", "transparent"),
  ];

  if (style !== "lyra") {
    sections.push(
      replace(footer, "p-(--card-spacing)", "padding-block", "0"),
      rule(`${root}${utility("has-data-[slot=card-footer]:pb-0")}:has(> ${footer})`, {
        "padding-bottom": "var(--card-spacing)",
      }),
    );
  }
  if (card.shadow) {
    sections.push(shadow(`${root}${utility("ring-1")}${noExplicitShadow}`, card.shadow));
  }
  if (style === "luma") {
    // ReUI Frame's own variables keep stacked/dense layouts and consumer spacing adjustments.
    const adjustments = [
      ["gap", "0.75", 4],
      ["px", "0.75", 4],
      ["py", "0.75", 5],
      ["panel-header-gap", undefined, 6],
      ["panel-footer-gap", "1", 6],
      ["panel-py-adjust", undefined, 2],
      ["panel-header-py-adjust", undefined, 4],
      ["panel-footer-py-adjust", undefined, 4],
    ] as const;
    for (const [key, spacing, value] of adjustments) {
      const initial =
        spacing === undefined
          ? key === "panel-header-gap"
            ? "0rem"
            : "0px"
          : `--spacing(${spacing})`;
      const property = `--frame-${key}`;
      sections.push(replace(frame, `[${property}:${initial}]`, property, length(value)));
    }
  }
  return sections.join("");
}

function itemCss(profile: Profile) {
  const { item } = profile;
  const selector = slot("item");
  return (
    replace(selector, "rounded-lg", "border-radius", radius(item.radius)) +
    ["default", "sm", "xs"]
      .map((name, index) => {
        const root = `${selector}[data-size="${name}"]`;
        const [x, y, gap] = item.sizes[index];
        const compact = name === "xs";
        return (
          replace(root, compact ? "px-2.5" : "px-3", "padding-inline", length(x)) +
          replace(
            compact ? `${root}:not(${slot("dropdown-menu-content")} *)` : root,
            compact ? "py-2" : "py-2.5",
            "padding-block",
            length(y),
          ) +
          replace(root, compact ? "gap-2" : "gap-2.5", "gap", length(gap))
        );
      })
      .join("")
  );
}

function menuCss(profile: Profile, style: UiStyle) {
  const { menu } = profile;
  const [x, y, gap] = menu.row;
  const content = slot("dropdown-menu-content");
  const subContent = slot("dropdown-menu-sub-content");
  const regular = ["dropdown-menu-item", "dropdown-menu-sub-trigger"].map(slot).join(", ");
  const checkable = ["dropdown-menu-checkbox-item", "dropdown-menu-radio-item"]
    .map(slot)
    .join(", ");
  const row = `:is(${regular}, ${checkable})`;
  const sections = [
    replace(`:is(${content}, ${subContent})`, "rounded-lg", "border-radius", radius(menu.radius)),
    replace(`:is(${content}, ${subContent})`, "p-1", "padding", length(menu.padding)),
    replace(content, "min-w-32", "min-width", length(menu.minWidth)),
    shadow(`${content}${utility("shadow-md")}`, menu.shadow),
    shadow(`${subContent}${utility("shadow-lg")}`, menu.shadow),
    replace(row, "gap-1.5", "gap", length(gap)),
    replace(row, "rounded-md", "border-radius", radius(menu.rowRadius)),
    replace(`:is(${regular})`, "px-1.5", "padding-inline", length(x)),
    replace(`:is(${checkable})`, "pl-1.5", "padding-inline-start", length(x)),
    replace(`:is(${regular})`, "py-1", "padding-block", length(y)),
    replace(`:is(${checkable})`, "py-1", "padding-block", length(menu.checkPaddingY ?? y)),
    rule(`${row}[data-inset]:not([data-inset="false"])${utility("data-inset:pl-7")}`, {
      "padding-inline-start": length(menu.inset),
    }),
  ];
  const defaultText = `${row}${utility("text-sm")}`;
  if (menu.minRowHeight) {
    sections.push(rule(`${row}${utility("py-1")}`, { "min-height": length(menu.minRowHeight) }));
  }
  if (menu.smallText)
    sections.push(
      rule(defaultText, {
        "font-size": length(12),
        "line-height": style === "mira" ? "1.625" : "1.3333",
      }),
    );
  if (menu.mediumWeight) sections.push(rule(defaultText, { "font-weight": "500" }));
  if (style === "sera")
    sections.push(rule(defaultText, { "text-transform": "uppercase", "letter-spacing": "0.05em" }));
  return sections.join("");
}

// Shared geometry from the official shadcn Select variants for both libraries.
const selectStyles = {
  vega: { height: [36, 32], trigger: "md", popup: "md", item: "sm", padding: [8, 6], gap: 8 },
  maia: { height: [36, 32], trigger: "4xl", popup: "2xl", item: "xl", padding: [12, 8], gap: 10 },
  lyra: { height: [32, 28], trigger: "none", popup: "none", item: "none", padding: [8, 8], gap: 8 },
  mira: { height: [28, 24], trigger: "md", popup: "lg", item: "md", padding: [8, 4], gap: 8 },
  luma: { height: [36, 32], trigger: "3xl", popup: "3xl", item: "2xl", padding: [12, 8], gap: 10 },
  sera: {
    height: [40, 36],
    trigger: "none",
    popup: "none",
    item: "none",
    padding: [12, 8],
    gap: 10,
  },
  rhea: { height: [32, 28], trigger: "2xl", popup: "2xl", item: "xl", padding: [8, 6], gap: 8 },
} as const;

function selectCss(style: keyof typeof selectStyles) {
  const selected = selectStyles[style];
  const trigger = `${slot("select-trigger")}:where(:not(.theme-setting-row))`;
  const popup = slot("select-content");
  const item = slot("select-item");
  const [widthPadding, heightPadding] = selected.padding;
  const compact = style === "lyra" || style === "mira";
  const sections = [
    replace(
      `${trigger}[data-size="default"]`,
      "data-[size=default]:h-8",
      "height",
      length(selected.height[0]),
    ),
    replace(
      `${trigger}[data-size="sm"]`,
      "data-[size=sm]:h-7",
      "height",
      length(selected.height[1]),
    ),
    replace(trigger, "rounded-lg", "border-radius", radius(selected.trigger)),
    replace(
      trigger,
      "data-[size=sm]:rounded-[min(var(--radius-md),10px)]",
      "border-radius",
      radius(selected.trigger),
    ),
    replace(popup, "rounded-lg", "border-radius", radius(selected.popup)),
    replace(item, "rounded-md", "border-radius", radius(selected.item)),
    replace(item, "pl-1.5", "padding-inline-start", length(widthPadding)),
    replace(item, "py-1", "padding-block", length(heightPadding)),
    replace(item, "gap-1.5", "gap", length(selected.gap)),
  ];

  if (compact)
    sections.push(
      rule(`:is(${trigger}, ${item})${utility("text-sm")}`, {
        "font-size": length(12),
        "line-height": style === "mira" ? "1.625" : "1.3333",
      }),
    );
  if (style === "mira") sections.push(replace(popup, "min-w-36", "min-width", length(128)));
  if (style === "mira" || style === "rhea")
    sections.push(
      rule(`${item}${utility("py-1")}`, {
        "min-height": length(28),
      }),
    );
  if (style === "maia" || style === "luma" || style === "rhea") {
    sections.push(shadow(`${popup}${utility("shadow-md")}`, style === "maia" ? "2xl" : "lg"));
  }
  if (style === "sera")
    sections.push(
      replace(trigger, "pl-2.5", "padding-inline-start", "0"),
      replace(trigger, "pr-2", "padding-inline-end", "0"),
      rule(`${trigger}${utility("border-input")}:not(:focus-visible, [aria-invalid="true"])`, {
        "border-color": "transparent transparent var(--input)",
      }),
    );
  return sections.join("");
}

function dialogCss(profile: Profile, style: UiStyle) {
  const { dialog } = profile;
  const content = slot("dialog-content");
  const footer = slot("dialog-footer");
  const overlay = slot("dialog-overlay");
  const close = slot("dialog-close");
  const sections = [
    replace(content, "rounded-xl", "border-radius", radius(dialog.radius)),
    replace(content, "p-4", "padding", length(dialog.padding)),
    replace(content, "gap-4", "gap", length(dialog.padding)),
    replace(slot("dialog-header"), "gap-2", "gap", length(dialog.headerGap)),
    replace(overlay, "bg-black/10", "background-color", `rgb(0 0 0 / ${dialog.overlay / 100})`),
    `@supports (backdrop-filter: blur(0)) {\n${replace(overlay, "supports-backdrop-filter:backdrop-blur-xs", "backdrop-filter", `blur(${dialog.blur}px)`)}}\n`,
    replace(close, "top-2", "top", length(dialog.closeInset)),
    replace(close, "right-2", "right", length(dialog.closeInset)),
    replace(footer, "-mx-4", "margin-inline", "0"),
    replace(footer, "-mb-4", "margin-bottom", "0"),
    replace(footer, "p-4", "padding", "0"),
    replace(footer, "border-t", "border-top-width", "0"),
    replace(footer, "bg-muted/50", "background-color", "transparent"),
    `@media (min-width: 40rem) {\n${replace(content, "sm:max-w-sm", "max-width", length(dialog.maxWidth))}}\n`,
  ];
  if (dialog.shadow) {
    sections.push(shadow(`${content}${utility("ring-1")}${noExplicitShadow}`, dialog.shadow));
  }
  const title = `${slot("dialog-title")}${utility("text-base")}`;
  if (style === "sera") {
    sections.push(rule(title, { "font-size": length(18), "font-weight": "600" }));
  }
  if (style === "mira" || style === "lyra") {
    sections.push(rule(title, { "font-size": length(14) }));
  }
  return sections.join("");
}

function tabsCss(profile: Profile) {
  const { tabs } = profile;
  const list = slot("tabs-list");
  const trigger = slot("tabs-trigger");
  const roundedList = `${list}:not([data-variant="line"])`;
  const vertical = `:is(${list}[data-orientation="vertical"], ${slot("tabs")}[data-orientation="vertical"] ${list})`;
  const tabPadding = (selector: string, spacing: typeof tabs.trigger) => {
    const [x, y, gap] = spacing;
    return (
      replace(selector, "px-1.5", "padding-inline", length(x)) +
      replace(selector, "py-0.5", "padding-block", length(y)) +
      replace(selector, "gap-1.5", "gap", length(gap))
    );
  };
  const horizontal = `${list}:not([data-orientation="vertical"], ${slot("tabs")}[data-orientation="vertical"] *)`;
  return (
    replace(horizontal, "h-8", "height", length(tabs.height)) +
    replace(roundedList, "rounded-lg", "border-radius", radius(tabs.radius)) +
    replace(list, "p-[3px]", "padding", length(tabs.padding)) +
    replace(trigger, "rounded-md", "border-radius", radius(tabs.triggerRadius)) +
    tabPadding(trigger, tabs.trigger) +
    (tabs.vertical
      ? replace(
          `${vertical}:not([data-variant="line"])`,
          "rounded-lg",
          "border-radius",
          radius(tabs.vertical.radius),
        ) +
        replace(vertical, "p-[3px]", "padding", length(tabs.vertical.padding)) +
        replace(
          `${vertical} ${trigger}`,
          "rounded-md",
          "border-radius",
          radius(tabs.vertical.triggerRadius),
        ) +
        tabPadding(`${vertical} ${trigger}`, tabs.vertical.trigger)
      : "")
  );
}

function typographyCss(style: UiStyle) {
  const compact = style === "mira" || style === "lyra";
  if (compact) {
    return (
      rule(
        ["card", "item", "item-title", "item-description", "dialog-content", "tabs-trigger"]
          .map((name) => `${slot(name)}${utility("text-sm")}`)
          .join(",\n"),
        { "font-size": length(12), "line-height": style === "mira" ? "1.625" : "1.3333" },
      ) + replace(slot("card-title"), "text-base", "font-size", length(14))
    );
  }
  if (style === "sera") {
    return (
      rule(`${slot("card-title")}${utility("text-base")}`, {
        "font-size": length(18),
        "font-weight": "600",
        "letter-spacing": "0.05em",
        "text-transform": "uppercase",
      }) +
      rule(`${slot("tabs-trigger")}${utility("text-sm")}`, {
        "font-size": length(12),
        "font-weight": "600",
        "letter-spacing": "0.05em",
        "text-transform": "uppercase",
      })
    );
  }
  return "";
}

const progressStyles = {
  vega: { height: 6, corner: "full" },
  maia: { height: 12, corner: "4xl" },
  lyra: { height: 4, corner: "none" },
  mira: { height: 4, corner: "md" },
  luma: { height: 12, corner: "full" },
  sera: { height: 2, corner: "none" },
  rhea: { height: 8, corner: "2xl" },
} as const;

function progressCss(style: keyof typeof progressStyles) {
  const { height, corner } = progressStyles[style];
  // The shared controls render the track on the root, and ReUI's labeled pattern uses a child track.
  const track = `:is(${slot("progress")}, ${slot("progress-track")})`;
  const label = `${slot("progress-label")}${utility("text-sm")}`;
  const value = `${slot("progress-value")}${utility("text-sm")}`;
  let typography = "";
  if (style === "lyra" || style === "mira") {
    typography = rule(`${label}, ${value}`, {
      "font-size": length(12),
      "line-height": style === "lyra" ? "1.3333" : "1.625",
    });
  }
  if (style === "lyra") typography += replace(label, "font-medium", "font-weight", "400");
  if (style === "sera") {
    typography = rule(label, { "font-size": length(12), "line-height": "1.3333" });
    typography += rule(`${label}${utility("font-medium")}`, {
      "font-weight": "600",
      "letter-spacing": "0.05em",
      "text-transform": "uppercase",
    });
  }
  return (
    replace(track, "h-1", "height", length(height)) +
    replace(track, "rounded-full", "border-radius", radius(corner)) +
    typography
  );
}

/** Append after the shared theme CSS. The same sheet works for preview portals and ZIPs. */
export function getUiStyleCss(value?: string | null): string {
  const style = value?.replace(/^(base|radix)-/, "");
  if (!style || !Object.hasOwn(profiles, style)) return "";
  const name = style as keyof typeof profiles;
  const profile = profiles[name];
  return [
    styleNotice,
    `/* Bricklane: ${name} component style */\n`,
    buttonCss(profile, name),
    inputCss(profile),
    getTextEntryCss(name),
    getFieldCss(name),
    focusCss(profile),
    frameAndCardCss(profile, name),
    itemCss(profile),
    menuCss(profile, name),
    selectCss(name),
    getToggleControlsCss(name),
    getToggleGroupCss(name),
    getRadioGroupCss(name),
    getSliderCss(name),
    dialogCss(profile, name),
    getCommandCss(name),
    getAlertDialogCss(name),
    sheetPopoverCss(name, { rule, radius, shadow }),
    getTooltipCss(name),
    tabsCss(profile),
    progressCss(name),
    getIdentityCss(name),
    typographyCss(name),
    replace(slot("alert"), "rounded-lg", "border-radius", radius(profile.alert.radius)),
  ].join("");
}
