import componentsConfig from "../../components.json" with { type: "json" };
import { getUiRegistryStyle, type UiFoundation } from "./ui-foundation.ts";

const basePrefix = "/src/foundations/base/ui/";
const uiPrefix = "/src/components/ui/";

/** Resolve build-specific components to the same paths used by their consumers. */
export function selectFoundationSources(
  raw: Readonly<Record<string, string>>,
  foundation: UiFoundation,
) {
  const sources = Object.fromEntries(
    Object.entries(raw).filter(([path]) => !path.startsWith(basePrefix)),
  );
  if (foundation.primitive === "base") {
    for (const [path, content] of Object.entries(raw)) {
      if (path.startsWith(basePrefix)) {
        sources[`${uiPrefix}${path.slice(basePrefix.length)}`] = content;
      }
    }
  }
  return sources;
}

export function getFoundationComponentsConfig(foundation: UiFoundation) {
  return {
    ...componentsConfig,
    style: getUiRegistryStyle(foundation),
    tailwind: { ...componentsConfig.tailwind, css: "src/theme.css" },
  };
}
