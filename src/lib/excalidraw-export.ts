const setup = import.meta.glob("/scripts/copy-excalidraw-assets.mjs", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const notices = import.meta.glob("/src/blocks/application/assets/excalidraw/*.{txt,md}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** Keep the downloaded project's font hosting identical to the production preview. */
export function excalidrawExportFiles(files: Record<string, string>): Record<string, string> {
  const usesEngine = Object.values(files).some((source) =>
    /from\s+["']@excalidraw\/excalidraw/.test(source),
  );
  if (!usesEngine) return {};
  return Object.fromEntries([
    ["scripts/copy-excalidraw-assets.mjs", setup["/scripts/copy-excalidraw-assets.mjs"]],
    ...Object.entries(notices).map(([path, content]) => [path.slice(1), content]),
  ]);
}
