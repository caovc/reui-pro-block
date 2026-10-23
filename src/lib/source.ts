import type { BlockMeta } from "@/data/types";
import { assembleBlockFiles } from "./source-files";
const raw = import.meta.glob(
  [
    "/src/blocks/**/*.{ts,tsx,css}",
    "/src/components/ui/*.{ts,tsx}",
    "/src/components/brand-mark.tsx",
    "/src/components/icons/*.{ts,tsx}",
    "/src/components/reui/**/*.{ts,tsx,css}",
    "/src/hooks/*.{ts,tsx}",
    "/src/lib/{utils,download,demo-artwork}.ts",
    "/src/data/types.ts",
    "/src/index.css",
    "/src/styles/shadcn.css",
  ],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;
export function blockFiles(block: BlockMeta) {
  return assembleBlockFiles(block, raw);
}
export { downloadFile } from "./download";
