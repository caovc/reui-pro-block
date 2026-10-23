import { zipSync, strToU8 } from "fflate";
import type { BlockMeta } from "@/data/types";
import { blockFiles } from "./source";
const assets = import.meta.glob(
  "/src/blocks/**/assets/**/*.{jpg,jpeg,png,webp,svg,woff,woff2}",
  { query: "?url", import: "default", eager: true },
) as Record<string, string>;
const packageManifest = import.meta.glob("/package.json", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
export async function downloadBundle(block: BlockMeta) {
  const files = blockFiles(block);
  const payload: Record<string, Uint8Array> = {};
  for (const [path, content] of Object.entries(files))
    payload[path === `${block.id}.tsx` ? "src/Example.tsx" : path] =
      strToU8(content);
  const commerce = ["marketing", "ecommerce"].includes(block.group);
  const application = block.group === "application";
  const referenceFont = files["src/blocks/reference.css"] !== undefined;
  await Promise.all(
    Object.entries(assets)
      .filter(
        ([path]) =>
          (commerce && path.includes("/commerce/")) ||
          (application && path.includes("/application/")) ||
          (referenceFont && path.startsWith("/src/blocks/assets/")),
      )
      .map(async ([path, url]) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not include asset ${path}`);
        payload[path.slice(1)] = new Uint8Array(await response.arrayBuffer());
      }),
  );
  const original = JSON.parse(packageManifest["/package.json"]);
  payload["package.json"] = strToU8(
    JSON.stringify(
      {
        name: `${block.id}-example`,
        version: "1.0.0",
        private: true,
        type: "module",
        scripts: {
          dev: "vite",
          build: "tsc --noEmit && vite build",
          preview: "vite preview",
        },
        dependencies: original.dependencies,
        devDependencies: {
          vite: original.devDependencies.vite,
          "@vitejs/plugin-react":
            original.devDependencies["@vitejs/plugin-react"],
          "@types/node": original.devDependencies["@types/node"],
          typescript: original.devDependencies.typescript,
          "@types/react": original.devDependencies["@types/react"],
          "@types/react-dom": original.devDependencies["@types/react-dom"],
        },
      },
      null,
      2,
    ),
  );
  payload["index.html"] = strToU8(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Block preview</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
  );
  payload["src/main.tsx"] = strToU8(
    "import { createRoot } from 'react-dom/client'\nimport Example from './Example'\nimport { TooltipProvider } from '@/components/ui/tooltip'\nimport { Toaster } from '@/components/ui/sonner'\nimport './theme.css'\ncreateRoot(document.getElementById('root')!).render(<TooltipProvider><Example/><Toaster richColors/></TooltipProvider>)\n",
  );
  payload["vite.config.ts"] = strToU8(
    "import path from 'node:path'\nimport { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\nexport default defineConfig({plugins:[react(),tailwindcss()],resolve:{alias:{'@':path.resolve(import.meta.dirname,'./src')}}})\n",
  );
  payload["tsconfig.json"] = strToU8(
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          types: ["vite/client", "node"],
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          paths: { "@/*": ["./src/*"] },
        },
        include: ["src"],
      },
      null,
      2,
    ),
  );
  payload["README.md"] = strToU8(
    `# ${block.name}\n\nIndependent composition using official free REUI and shadcn/ui components. Reference: ${block.reference}\n\nRequires Node.js 24+. Run npm install, then npm run dev. All demo actions are local. Replace the sample data and connect your own backend.\n\nThe entry is src/Example.tsx. Family modules are shared compositions; this bundle includes their transitive local dependencies.\n\nMIT open source code. Official REUI free portions Copyright (c) 2025 Keenthemes Inc; shadcn/ui portions Copyright (c) 2023 shadcn. Preserve repository and bundled component notices when redistributing. Images are free Unsplash demo photos; see https://unsplash.com/license.\n`,
  );
  // Preserve the MIT notice for the actual official REUI free implementations.
  const reuiNotices = import.meta.glob("/src/components/reui/*.{md,txt}", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;
  for (const [path, content] of Object.entries(reuiNotices))
    payload[path.slice(1)] = strToU8(content);
  // These providers are required by main even when a particular family does not import them.
  const providerRaw = import.meta.glob(
    "/src/components/ui/{tooltip,sonner}.tsx",
    { query: "?raw", import: "default", eager: true },
  ) as Record<string, string>;
  for (const [path, content] of Object.entries(providerRaw))
    payload[path.slice(1)] = strToU8(content);
  const notices = import.meta.glob(["/LICENSE", "/THIRD_PARTY_NOTICES.md"], {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;
  for (const [path, content] of Object.entries(notices))
    payload[path.slice(1)] = strToU8(content);
  const imageNotes = import.meta.glob("/src/blocks/**/assets/**/*.{md,txt}", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;
  for (const [path, content] of Object.entries(imageNotes))
    if (
      (commerce && path.includes("/commerce/")) ||
      (application && path.includes("/application/")) ||
      (referenceFont && path.startsWith("/src/blocks/assets/"))
    )
      payload[path.slice(1)] = strToU8(content);
  const bytes = zipSync(payload);
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes).buffer], { type: "application/zip" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${block.id}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
