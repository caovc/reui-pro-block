import type { BlockMeta } from "@/data/types";
import { blockImplementationCandidates, implementationFirst } from "./source-targets.ts";

export function assembleBlockFiles(block: BlockMeta, raw: Record<string, string>) {
  const family =
    block.group === "application"
      ? "application"
      : ["marketing", "ecommerce"].includes(block.group)
        ? "commerce"
        : "data";
  const entry = `import ${family === "application" ? "Application" : family === "commerce" ? "Commerce" : "Data"}Block from '@/blocks/${family}'\n\n// Independent implementation. Local demo data; connect your own backend.\nconst block = ${JSON.stringify(block, null, 2)}\n\nexport default function Example() {\n  return <${family === "application" ? "Application" : family === "commerce" ? "Commerce" : "Data"}Block block={block} />\n}\n`;
  const result: Record<string, string> = { [`${block.id}.tsx`]: entry };
  const seen = new Set<string>();
  function visit(path: string) {
    const resolved = [path, path + ".tsx", path + ".ts", path + "/index.tsx"].find(
      (p) => raw[p] !== undefined,
    );
    if (!resolved || seen.has(resolved)) return;
    seen.add(resolved);
    result[resolved.replace("/src/", "src/")] = raw[resolved];
    for (const match of raw[resolved].matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
      const imported = match[1];
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
  // Keep the shared body, focus and interaction rules too. Stopping at the
  // html rule omitted the preview's 14px baseline from standalone downloads.
  // Site-specific chrome begins at .brand, after these shared element rules.
  result["src/theme.css"] = (raw["/src/index.css"] ?? "").split(/\n\.brand\s*\{/)[0];
  result["src/styles/shadcn.css"] = raw["/src/styles/shadcn.css"] ?? "";
  return implementationFirst(result, blockImplementationCandidates(block));
}
