import path from "node:path";
import { existsSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { createServer, defineConfig, normalizePath, type Plugin, type ViteDevServer } from "vite";

const src = normalizePath(path.resolve(import.meta.dirname, "src"));
const sharedUi = `${src}/components/ui/`;
const baseUi = `${src}/foundations/base/ui/`;

function resolveModule(candidate: string) {
  return [candidate, `${candidate}.ts`, `${candidate}.tsx`].find(
    (file) => /\.tsx?$/.test(file) && existsSync(file),
  );
}

function useBaseUi(): Plugin {
  return {
    name: "bricklane-base-ui",
    enforce: "pre",
    resolveId(source, importer) {
      if (source.includes("?") || source.startsWith("\0")) return;

      let file: string;
      if (source.startsWith("@/")) file = `${src}/${source.slice(2)}`;
      else if (path.isAbsolute(source)) file = normalizePath(source);
      else if (importer && source.startsWith(".")) {
        file = normalizePath(path.resolve(path.dirname(importer), source));
      } else return;

      if (file.startsWith(sharedUi)) {
        return resolveModule(`${baseUi}${file.slice(sharedUi.length)}`);
      }
      if (file.startsWith(baseUi) && !resolveModule(file)) {
        return resolveModule(`${sharedUi}${file.slice(baseUi.length)}`);
      }
    },
  };
}

function serveBaseUi(): Plugin {
  let baseServer: ViteDevServer | undefined;
  return {
    name: "bricklane-serve-base-ui",
    async configureServer(server) {
      const base = await createServer({
        mode: "base-ui",
        configFile: server.config.configFile,
        server: {
          middlewareMode: true,
          ws: server.httpServer ? { server: server.httpServer } : false,
        },
      });
      baseServer = base;
      server.middlewares.use((request, response, next) => {
        if (request.url === "/base" || request.url?.startsWith("/base/")) {
          base.middlewares(request, response, next);
        } else next();
      });
    },
    async closeBundle() {
      const base = baseServer;
      baseServer = undefined;
      await base?.close();
    },
  };
}

export default defineConfig(({ command, mode, isPreview }) => {
  const useBase = mode === "base-ui";
  const dev = command === "serve" && !isPreview;
  return {
    base: useBase && dev ? "/base/" : "./",
    cacheDir: useBase ? "node_modules/.vite-base" : undefined,
    plugins: [useBase ? useBaseUi() : dev && serveBaseUi(), react(), tailwindcss()],
    build: useBase ? { outDir: "dist/base" } : undefined,
    worker: { format: "es" },
    resolve: {
      dedupe: ["@radix-ui/react-focus-scope", "@radix-ui/react-dismissable-layer"],
      alias: { "@": src },
    },
  };
});
