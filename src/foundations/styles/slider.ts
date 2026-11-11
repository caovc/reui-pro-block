// ReUI's free c-slider-1 uses the stock Slider in both registries. Style values
// follow apps/v4/registry/styles/style-*.css in shadcn-ui/ui at
// 8ab27715521cbd4f87ae6886cd989cbb678f6de7 (MIT, see notice.ts).

type SliderProfile = {
  trackSize?: number;
  trackInputOpacity?: 50 | 90;
  radiusScale?: number;
  thumbSize?: readonly [width: number, height: number];
  thumbBorder?: "primary" | "none";
  thumbFill?: "primary";
  shadow?: "sm" | "md";
  ring: number;
  activeRing?: number;
  ringOpacity: 30 | 50;
  idleRing?: boolean;
  transition?: string;
  duration?: string;
};

const colorTransition = [
  "color",
  "background-color",
  "border-color",
  "outline-color",
  "text-decoration-color",
  "fill",
  "stroke",
  "--tw-gradient-from",
  "--tw-gradient-via",
  "--tw-gradient-to",
].join(", ");

const profiles: Record<string, SliderProfile> = {
  vega: {
    trackSize: 6,
    thumbSize: [16, 16],
    thumbBorder: "primary",
    shadow: "sm",
    ring: 4,
    ringOpacity: 50,
  },
  maia: {
    trackSize: 12,
    radiusScale: 2.6,
    thumbSize: [16, 16],
    thumbBorder: "primary",
    shadow: "sm",
    ring: 4,
    ringOpacity: 50,
    transition: colorTransition,
  },
  lyra: { radiusScale: 0, ring: 1, activeRing: 1, ringOpacity: 50 },
  mira: { radiusScale: 0.8, ring: 2, activeRing: 2, ringOpacity: 30 },
  luma: {
    trackSize: 8,
    trackInputOpacity: 90,
    thumbSize: [24, 16],
    thumbBorder: "none",
    shadow: "md",
    ring: 4,
    ringOpacity: 30,
    idleRing: true,
    transition: "color, box-shadow, background-color",
  },
  sera: {
    trackSize: 2,
    trackInputOpacity: 50,
    radiusScale: 0,
    thumbBorder: "none",
    thumbFill: "primary",
    ring: 2,
    ringOpacity: 30,
    transition: colorTransition,
  },
  rhea: {
    trackInputOpacity: 90,
    radiusScale: 1.8,
    thumbSize: [16, 16],
    thumbBorder: "none",
    shadow: "md",
    ring: 4,
    ringOpacity: 30,
    idleRing: true,
    duration: "200ms",
  },
};

const track = ':where([data-slot="slider-track"])';
const thumb = ':where([data-slot="slider-thumb"])';
const horizontal = ':where([data-orientation="horizontal"], [data-horizontal])';
const vertical = ':where([data-orientation="vertical"], [data-vertical])';
const utility = (value: string) => `[class~="${value}"]`;
const length = (pixels: number) => `${pixels / 16}rem`;
const mix = (token: string, opacity: number) =>
  `color-mix(in oklab, var(--${token}) ${opacity}%, transparent)`;

const shadows = {
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
};
const boxShadow = [
  "var(--tw-inset-shadow, 0 0 #0000)",
  "var(--tw-inset-ring-shadow, 0 0 #0000)",
  "var(--tw-ring-offset-shadow, 0 0 #0000)",
  "var(--tw-ring-shadow, 0 0 #0000)",
  "var(--tw-shadow, 0 0 #0000)",
].join(", ");

function rule(selector: string, declarations: Record<string, string>) {
  const body = Object.entries(declarations)
    .map(([property, value]) => `    ${property}: ${value};`)
    .join("\n");
  return `  ${selector} {\n${body}\n  }\n`;
}

function geometryCss(profile: SliderProfile) {
  const { trackSize, trackInputOpacity, radiusScale, thumbSize } = profile;
  const sections: string[] = [];
  if (trackSize !== undefined) {
    sections.push(
      rule(`${track}${utility("data-horizontal:h-1")}${horizontal}`, { height: length(trackSize) }),
      rule(`${track}${utility("data-vertical:w-1")}${vertical}`, { width: length(trackSize) }),
    );
  }
  if (trackInputOpacity !== undefined) {
    sections.push(
      rule(`${track}${utility("bg-muted")}`, {
        "background-color": mix("input", trackInputOpacity),
      }),
    );
  }
  if (radiusScale !== undefined) {
    sections.push(
      rule(`${track}${utility("rounded-full")}, ${thumb}${utility("rounded-full")}`, {
        "border-radius": radiusScale === 0 ? "0" : `calc(var(--radius, 0.625rem) * ${radiusScale})`,
      }),
    );
  }
  if (thumbSize) {
    const [width, height] = thumbSize;
    const size = `${thumb}${utility("size-3")}`;
    sections.push(rule(size, { width: length(width), height: length(height) }));
    if (width !== height) {
      sections.push(rule(`${size}${vertical}`, { width: length(height), height: length(width) }));
    }
  }
  return sections.join("");
}

function ringShadow(width: number, color: string) {
  if (width === 0) return "0 0 #0000";
  return `0 0 0 calc(${width}px + var(--tw-ring-offset-width, 0px)) ${color}`;
}

function thumbCss(profile: SliderProfile) {
  const sections: string[] = [];
  const surface = `${thumb}${utility("ring-ring/50")}`;
  const color = mix("ring", profile.ringOpacity);
  const idleRing = profile.idleRing ? ringShadow(1, "rgb(0 0 0 / 0.1)") : ringShadow(0, color);
  if (profile.thumbBorder === "primary") {
    sections.push(rule(`${thumb}${utility("border-ring")}`, { "border-color": "var(--primary)" }));
  } else if (profile.thumbBorder === "none") {
    sections.push(rule(`${thumb}${utility("border")}`, { "border-style": "none" }));
  }
  if (profile.thumbFill) {
    sections.push(rule(`${thumb}${utility("bg-white")}`, { "background-color": "var(--primary)" }));
  }
  if (profile.shadow) {
    sections.push(
      rule(surface, { "--tw-shadow": shadows[profile.shadow], "box-shadow": boxShadow }),
    );
  }
  if (profile.idleRing) {
    sections.push(
      rule(surface, { "--tw-ring-shadow": idleRing, "box-shadow": boxShadow }),
      rule(`${thumb}${utility("bg-white")}:where(:not(.dark *))`, {
        "background-clip": "padding-box",
      }),
    );
  }
  if (profile.transition || profile.duration) {
    const transition: Record<string, string> = {};
    if (profile.transition) transition["transition-property"] = profile.transition;
    if (profile.duration) transition["transition-duration"] = profile.duration;
    sections.push(rule(`${thumb}${utility("transition-[color,box-shadow]")}`, transition));
  }

  const focusRing = ringShadow(profile.ring, color);
  const activeRing = profile.activeRing ? ringShadow(profile.activeRing, color) : idleRing;
  const hover = `${thumb}${utility("hover:ring-3")}:hover`;
  // Radix focuses the visible thumb. Base UI focuses the input inside it.
  const focus = `${thumb}${utility("focus-visible:ring-3")}:is(:focus-visible, :has(> :where(input[type="range"]):focus-visible))`;
  sections.push(
    rule(`${thumb}${utility("active:ring-3")}:active`, {
      "--tw-ring-shadow": activeRing,
      "box-shadow": boxShadow,
    }),
    `  @media (hover: hover) {\n${rule(hover, { "--tw-ring-shadow": focusRing, "box-shadow": boxShadow })}  }\n`,
    rule(focus, { "--tw-ring-shadow": focusRing, "box-shadow": boxShadow }),
  );
  return sections.join("");
}

export function getSliderCss(style: string): string {
  const name = style.replace(/^(base|radix)-/, "");
  if (!Object.hasOwn(profiles, name)) return "";
  const profile = profiles[name];
  // Match the default utilities at their specificity. A caller's descendant
  // utility or unlayered component CSS can still style the same slots.
  return `@layer utilities {\n${geometryCss(profile)}${thumbCss(profile)}}\n`;
}
