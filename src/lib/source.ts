import type { BlockMeta } from "@/data/types";
import { getCurrentPreviewTheme } from "@/components/site/global-theme-store";
import { defaultTheme, themeCSS, type PreviewTheme } from "@/components/site/preview-theme";
import { assembleBlockFiles } from "./source-files";
import type { UiFoundation } from "./ui-foundation";
import { getFoundationComponentsConfig, selectFoundationSources } from "./ui-foundation-source";
const raw = import.meta.glob(
  [
    "/src/blocks/**/*.{ts,tsx,css}",
    "/src/components/ui/**/*.{ts,tsx,css}",
    "/src/foundations/base/ui/**/*.{ts,tsx,css}",
    "/src/foundations/styles/**/*.{ts,tsx,css}",
    "/src/components/brand-mark.tsx",
    "/src/components/site/{global-theme-store,preview-theme}.ts",
    "/src/components/icons/*.{ts,tsx}",
    "/src/components/reui/**/*.{ts,tsx,css}",
    "/src/hooks/*.{ts,tsx}",
    "/src/lib/{utils,download,demo-artwork,maplibre-runtime,ui-foundation}.ts",
    "/src/data/types.ts",
    "/src/index.css",
    "/src/styles/shadcn.css",
  ],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;
export function blockFiles(
  block: BlockMeta,
  selection: UiFoundation | PreviewTheme = getCurrentPreviewTheme(),
) {
  const theme = { ...defaultTheme, ...selection };
  const files = assembleBlockFiles(block, selectFoundationSources(raw, theme), themeCSS(theme));
  files["components.json"] = JSON.stringify(getFoundationComponentsConfig(theme), null, 2) + "\n";
  return files;
}
export { downloadFile } from "./download";
