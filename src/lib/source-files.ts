import type { BlockMeta } from "@/data/types";
import type { PreviewTheme } from "@/components/site/preview-theme";
import { blockImplementationCandidates, implementationFirst } from "./source-targets.ts";

export function assembleBlockFiles(
  block: BlockMeta,
  raw: Readonly<Record<string, string>>,
  customizationCss?: string,
  exportedTheme?: { theme: PreviewTheme; dark: boolean },
) {
  const family =
    block.group === "application"
      ? "application"
      : ["marketing", "ecommerce"].includes(block.group)
        ? "commerce"
        : "data";
  const component = `${family === "application" ? "Application" : family === "commerce" ? "Commerce" : "Data"}Block`;
  const themeImports = exportedTheme
    ? `import { useLayoutEffect } from 'react';
import { setInheritedPreviewTheme, useGlobalTheme } from '@/components/site/global-theme-store';
import { applyTheme } from '@/components/site/preview-theme';
`
    : "";
  const themeSetup = exportedTheme
    ? `const exportedTheme = ${JSON.stringify(exportedTheme.theme, null, 2)} as const;
setInheritedPreviewTheme(exportedTheme, ${exportedTheme.dark});

`
    : "";
  const themeEffect = exportedTheme
    ? `  const { theme, dark } = useGlobalTheme();
  useLayoutEffect(() => applyTheme(theme, dark), [theme, dark]);
`
    : "";
  const entry = `${themeImports}import ${component} from '@/blocks/${family}';

// Independent implementation. Local demo data; connect your own backend.
const block = ${JSON.stringify(block, null, 2)};

${themeSetup}export default function Example() {
${themeEffect}  return <${component} block={block} />;
}
`;
  const result: Record<string, string> = { [`${block.id}.tsx`]: entry };
  const seen = new Set<string>();
  function visit(path: string) {
    const resolved = [
      path,
      path + ".tsx",
      path + ".ts",
      path + "/index.tsx",
      path + "/index.ts",
    ].find((p) => raw[p] !== undefined);
    if (!resolved || seen.has(resolved)) return;
    seen.add(resolved);
    result[resolved.replace("/src/", "src/")] = raw[resolved];
    for (const match of raw[resolved].matchAll(
      /(?:from\s*|import\s*(?:\(\s*)?)['"]([^'"]+)['"]/g,
    )) {
      const imported = match[1].split("?")[0];
      if (imported.startsWith("@/")) visit("/src/" + imported.slice(2));
      if (imported.startsWith(".")) {
        const parts = (resolved.slice(0, resolved.lastIndexOf("/")) + "/" + imported).split("/");
        const normalized: string[] = [];
        for (const part of parts) {
          if (part === "..") normalized.pop();
          else if (part !== ".") normalized.push(part);
        }
        visit(normalized.join("/"));
      }
    }
  }
  visit(`/src/blocks/${family}/index.tsx`);
  // Resolve the starter's providers through the selected foundation as well.
  visit("/src/components/ui/tooltip");
  visit("/src/components/ui/sonner");
  if (exportedTheme) {
    visit("/src/components/site/global-theme-store.ts");
    visit("/src/components/site/preview-theme.ts");
  }
  // Keep the shared body, focus and interaction rules too. Stopping at the
  // html rule omitted the preview's 14px baseline from standalone downloads.
  // Site-specific chrome begins at .brand, after these shared element rules.
  const sharedTheme = (raw["/src/index.css"] ?? "").split(/\n\.brand\s*\{/)[0];
  result["src/theme.css"] = customizationCss ? `${sharedTheme}\n${customizationCss}` : sharedTheme;
  result["src/styles/shadcn.css"] = raw["/src/styles/shadcn.css"] ?? "";
  return implementationFirst(result, blockImplementationCandidates(block));
}
