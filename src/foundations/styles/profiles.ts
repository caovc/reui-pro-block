// Visual measurements from shadcn's style-*.css and ReUI's free Frame registry.
// The upstream revisions and the adaptation boundaries are documented in README.md.

type Size = readonly [height: number, paddingX: number];
type Spacing = readonly [paddingX: number, paddingY: number, gap: number];
type Radius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full" | "cap24";
type Shadow = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

type StyleProfile = {
  button: {
    sizes: readonly [standard: Size, xs: Size, sm: Size, lg: Size];
    radius: Radius;
    smallRadius?: readonly [xs: Radius, sm: Radius];
    radiusCap?: readonly [xs: number, sm: number];
    typography?: "compact" | "relaxed" | "editorial";
    ring?: readonly [width: number, opacity: number];
  };
  input: {
    size: Size;
    radius: Radius;
    paddingY?: number;
    fill?: number;
    transparentBorder?: boolean;
    underline?: boolean;
    shadow?: Shadow;
    typography?: "compact" | "relaxed";
  };
  card: {
    radius: Radius;
    spacing: readonly [standard: number, small: number];
    headerGap: number;
    shadow?: Shadow;
  };
  item: {
    radius: Radius;
    sizes: readonly [standard: Spacing, small: Spacing, extraSmall: Spacing];
  };
  menu: {
    radius: Radius;
    padding: number;
    minWidth: number;
    shadow: Shadow;
    rowRadius: Radius;
    row: Spacing;
    inset: number;
    checkPaddingY?: number;
    minRowHeight?: number;
    smallText?: boolean;
    mediumWeight?: boolean;
  };
  dialog: {
    radius: Radius;
    padding: number;
    maxWidth: number;
    headerGap: number;
    overlay: number;
    blur: number;
    closeInset: number;
    shadow?: Shadow;
  };
  tabs: {
    height: number;
    radius: Radius;
    padding: number;
    triggerRadius: Radius;
    trigger: Spacing;
    vertical?: { radius: Radius; padding: number; triggerRadius: Radius; trigger: Spacing };
  };
  alert: { radius: Radius };
};

const compactItems = [
  [12, 10, 10],
  [12, 10, 10],
  [10, 8, 8],
] as const;

const spaciousItems = [
  [16, 14, 14],
  [14, 12, 14],
  [12, 10, 10],
] as const;

const tallButtons = [
  [36, 12],
  [24, 10],
  [32, 12],
  [40, 16],
] as const;

export const profiles: Record<
  "vega" | "maia" | "lyra" | "mira" | "luma" | "sera" | "rhea",
  StyleProfile
> = {
  vega: {
    button: {
      sizes: [
        [36, 10],
        [24, 8],
        [32, 10],
        [40, 10],
      ],
      radius: "md",
      radiusCap: [8, 10],
    },
    input: { size: [36, 10], radius: "md", shadow: "xs" },
    card: { radius: "xl", spacing: [24, 16], headerGap: 4, shadow: "xs" },
    item: { radius: "md", sizes: [[16, 14, 14], compactItems[1], compactItems[2]] },
    menu: {
      radius: "md",
      padding: 4,
      minWidth: 128,
      shadow: "md",
      rowRadius: "sm",
      row: [8, 6, 8],
      inset: 32,
    },
    dialog: {
      radius: "xl",
      padding: 24,
      maxWidth: 448,
      headerGap: 8,
      overlay: 10,
      blur: 4,
      closeInset: 16,
    },
    tabs: { height: 36, radius: "lg", padding: 3, triggerRadius: "md", trigger: [8, 4, 6] },
    alert: { radius: "lg" },
  },
  maia: {
    button: { sizes: tallButtons, radius: "4xl" },
    input: { size: [36, 12], radius: "4xl", fill: 30 },
    card: { radius: "2xl", spacing: [24, 16], headerGap: 8 },
    item: { radius: "2xl", sizes: spaciousItems },
    menu: {
      radius: "2xl",
      padding: 4,
      minWidth: 192,
      shadow: "2xl",
      rowRadius: "xl",
      row: [12, 8, 10],
      inset: 38,
    },
    dialog: {
      radius: "4xl",
      padding: 24,
      maxWidth: 448,
      headerGap: 8,
      overlay: 80,
      blur: 4,
      closeInset: 16,
    },
    tabs: {
      height: 36,
      radius: "4xl",
      padding: 3,
      triggerRadius: "xl",
      trigger: [8, 4, 6],
      vertical: { radius: "2xl", padding: 3, triggerRadius: "xl", trigger: [10, 6, 6] },
    },
    alert: { radius: "lg" },
  },
  lyra: {
    button: {
      sizes: [
        [32, 10],
        [24, 8],
        [28, 10],
        [36, 10],
      ],
      radius: "none",
      typography: "compact",
      ring: [1, 50],
    },
    input: { size: [32, 10], radius: "none", typography: "compact" },
    card: { radius: "none", spacing: [16, 12], headerGap: 4 },
    item: { radius: "none", sizes: compactItems },
    menu: {
      radius: "none",
      padding: 0,
      minWidth: 128,
      shadow: "md",
      rowRadius: "none",
      row: [8, 8, 8],
      inset: 28,
      smallText: true,
    },
    dialog: {
      radius: "none",
      padding: 16,
      maxWidth: 384,
      headerGap: 4,
      overlay: 10,
      blur: 4,
      closeInset: 8,
    },
    tabs: {
      height: 32,
      radius: "none",
      padding: 3,
      triggerRadius: "none",
      trigger: [6, 2, 6],
      vertical: { radius: "none", padding: 3, triggerRadius: "none", trigger: [6, 5, 6] },
    },
    alert: { radius: "none" },
  },
  mira: {
    button: {
      sizes: [
        [28, 8],
        [20, 8],
        [24, 8],
        [32, 10],
      ],
      radius: "md",
      smallRadius: ["sm", "md"],
      typography: "relaxed",
      ring: [2, 30],
    },
    input: { size: [28, 8], radius: "md", paddingY: 2, fill: 20, typography: "relaxed" },
    card: { radius: "lg", spacing: [16, 12], headerGap: 4 },
    item: { radius: "md", sizes: [compactItems[0], compactItems[1], [10, 8, 10]] },
    menu: {
      radius: "lg",
      padding: 4,
      minWidth: 128,
      shadow: "md",
      rowRadius: "md",
      row: [8, 4, 8],
      inset: 30,
      checkPaddingY: 6,
      minRowHeight: 28,
      smallText: true,
    },
    dialog: {
      radius: "xl",
      padding: 16,
      maxWidth: 384,
      headerGap: 4,
      overlay: 80,
      blur: 4,
      closeInset: 8,
    },
    tabs: {
      height: 32,
      radius: "lg",
      padding: 3,
      triggerRadius: "md",
      trigger: [6, 2, 6],
      vertical: { radius: "lg", padding: 3, triggerRadius: "md", trigger: [6, 5, 6] },
    },
    alert: { radius: "lg" },
  },
  luma: {
    button: { sizes: tallButtons, radius: "4xl", ring: [3, 30] },
    input: { size: [36, 12], radius: "3xl", fill: 50, transparentBorder: true },
    card: { radius: "4xl", spacing: [24, 16], headerGap: 6, shadow: "md" },
    item: { radius: "2xl", sizes: spaciousItems },
    menu: {
      radius: "3xl",
      padding: 6,
      minWidth: 192,
      shadow: "lg",
      rowRadius: "2xl",
      row: [12, 8, 10],
      inset: 38,
      mediumWeight: true,
    },
    dialog: {
      radius: "4xl",
      padding: 24,
      maxWidth: 448,
      headerGap: 6,
      overlay: 30,
      blur: 8,
      closeInset: 16,
      shadow: "xl",
    },
    tabs: {
      height: 36,
      radius: "full",
      padding: 4,
      triggerRadius: "full",
      trigger: [12, 4, 8],
      vertical: { radius: "2xl", padding: 4, triggerRadius: "2xl", trigger: [12, 6, 8] },
    },
    alert: { radius: "2xl" },
  },
  sera: {
    button: {
      sizes: [
        [40, 24],
        [28, 12],
        [36, 16],
        [44, 32],
      ],
      radius: "none",
      typography: "editorial",
      ring: [2, 30],
    },
    input: { size: [40, 0], radius: "none", underline: true },
    card: { radius: "none", spacing: [32, 20], headerGap: 6, shadow: "sm" },
    item: { radius: "none", sizes: spaciousItems },
    menu: {
      radius: "none",
      padding: 6,
      minWidth: 192,
      shadow: "md",
      rowRadius: "none",
      row: [12, 8, 10],
      inset: 38,
      smallText: true,
      mediumWeight: true,
    },
    dialog: {
      radius: "none",
      padding: 24,
      maxWidth: 448,
      headerGap: 8,
      overlay: 20,
      blur: 8,
      closeInset: 20,
      shadow: "md",
    },
    tabs: {
      height: 40,
      radius: "none",
      padding: 4,
      triggerRadius: "none",
      trigger: [16, 6, 8],
      vertical: { radius: "none", padding: 4, triggerRadius: "none", trigger: [16, 8, 8] },
    },
    alert: { radius: "none" },
  },
  rhea: {
    button: {
      sizes: [
        [32, 12],
        [24, 10],
        [28, 12],
        [36, 16],
      ],
      radius: "2xl",
      ring: [3, 30],
    },
    input: { size: [32, 10], radius: "2xl", fill: 50, transparentBorder: true },
    card: { radius: "cap24", spacing: [20, 16], headerGap: 6, shadow: "sm" },
    item: { radius: "2xl", sizes: [spaciousItems[0], spaciousItems[1], compactItems[2]] },
    menu: {
      radius: "2xl",
      padding: 4,
      minWidth: 128,
      shadow: "lg",
      rowRadius: "xl",
      row: [8, 6, 8],
      inset: 28,
      minRowHeight: 28,
    },
    dialog: {
      radius: "cap24",
      padding: 24,
      maxWidth: 448,
      headerGap: 6,
      overlay: 30,
      blur: 8,
      closeInset: 16,
      shadow: "xl",
    },
    tabs: {
      height: 32,
      radius: "2xl",
      padding: 3,
      triggerRadius: "2xl",
      trigger: [6, 2, 6],
      vertical: { radius: "2xl", padding: 4, triggerRadius: "2xl", trigger: [12, 2, 6] },
    },
    alert: { radius: "2xl" },
  },
};
