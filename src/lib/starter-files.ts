import type { PreviewTheme } from "@/components/site/preview-theme";

// Original Bricklane mark, embedded so exported previews need no host favicon.
const starterFavicon =
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#242321"/>
  <rect x="6" y="6" width="6" height="20" rx="1.25" fill="#fffaf3"/>
  <rect x="16" y="6" width="10" height="8" rx="1.25" fill="#d57755"/>
  <rect x="16" y="18" width="10" height="8" rx="1.25" fill="#fffaf3"/>
</svg>`);

/** Load the theme first so its Tailwind layer order precedes component styles. */
export const starterMain = `import "./theme.css";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Example from "./Example";

createRoot(document.getElementById("root")!).render(
  <TooltipProvider>
    <Example />
    <Toaster richColors />
  </TooltipProvider>,
);
`;

export const starterViteConfig = `import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["@radix-ui/react-focus-scope", "@radix-ui/react-dismissable-layer"],
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
`;

export function starterHTML(theme: PreviewTheme, dark: boolean) {
  return `<!doctype html>
<html lang="en" data-ui-primitive="${theme.primitive}" data-ui-style="${theme.style}" data-accent="${theme.accent}"${dark ? ' class="dark" style="color-scheme: dark"' : ""}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${starterFavicon}" />
    <title>Component preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}
