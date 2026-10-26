import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const source = new URL("node_modules/@excalidraw/excalidraw/dist/prod/fonts/", root);
const destination = new URL("public/excalidraw/fonts/", root);
await mkdir(fileURLToPath(destination), { recursive: true });
await cp(fileURLToPath(source), fileURLToPath(destination), { recursive: true });
await cp(
  fileURLToPath(new URL("src/blocks/application/assets/excalidraw/", root)),
  fileURLToPath(new URL("public/excalidraw/licenses/", root)),
  { recursive: true },
);
console.log("Excalidraw fonts copied for local hosting.");
