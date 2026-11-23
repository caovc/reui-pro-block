import assert from "node:assert/strict";
import { globSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import ts from "typescript";
import { assembleBlockFiles } from "../src/lib/source-files.ts";
import { selectFoundationSources } from "../src/lib/ui-foundation-source.ts";
import { defaultTheme, themeCSS } from "../src/components/site/preview-theme.ts";
import { UI_STYLES } from "../src/foundations/styles/index.ts";

const root = new URL("../", import.meta.url);
const rootPath = fileURLToPath(root);
const require = createRequire(root);
const reactModules = new Map(
  ["react", "react/jsx-runtime"].map((specifier) => [
    specifier,
    pathToFileURL(require.resolve(specifier)).href,
  ]),
);
const storeURL = new URL("src/components/site/global-theme-store.ts", root).href;
const raw = Object.fromEntries(
  globSync("src/**/*.{ts,tsx,css}", { cwd: rootPath }).map((path) => [
    `/${path}`,
    readFileSync(new URL(path, root), "utf8"),
  ]),
);
const catalog = JSON.parse(readFileSync(new URL("src/data/catalog.json", root), "utf8"));
const blocks = catalog.flatMap(({ blocks }) => blocks);
const targets = ["app-shell-18", "data-grid-base-1", "pricing-1"].map((id) => {
  const block = blocks.find((candidate) => candidate.id === id);
  assert.ok(block, id);
  return block;
});

test("clean block entries seed the real theme store in both foundations and all styles", async (t) => {
  const saved = Object.fromEntries(
    ["window", "location", "localStorage", "sessionStorage", "matchMedia"].map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ]),
  );
  t.after(() => {
    for (const [name, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const storage = new Map();
  globalThis.location = { hash: "", href: "http://localhost/", origin: "http://localhost" };
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.sessionStorage = globalThis.localStorage;
  globalThis.window = { addEventListener() {} };
  window.parent = window;
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });

  // Run each generated entry's real module initialization and real store. The
  // family component stays unmounted; native product rendering is a separate gate.
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (context.parentURL?.startsWith("data:") && reactModules.has(specifier)) {
        return nextResolve(reactModules.get(specifier), context);
      }
      if (/^@\/blocks\/(application|data|commerce)$/.test(specifier)) {
        return nextResolve("data:text/javascript,export default function Block() {}", context);
      }
      if (specifier.startsWith("@/")) {
        return nextResolve(new URL(`src/${specifier.slice(2)}.ts`, root).href, context);
      }
      if (context.parentURL === storeURL && specifier === "./preview-theme") {
        return nextResolve(new URL("src/components/site/preview-theme.ts", root).href, context);
      }
      return nextResolve(specifier, context);
    },
  });
  t.after(() => hooks.deregister());
  const { getCurrentPreviewTheme, toggleGlobalTheme } = await import(storeURL);

  for (const primitive of ["radix", "base"]) {
    for (const style of UI_STYLES) {
      for (const block of targets) {
        for (const dark of [false, true]) {
          storage.clear();
          const theme = { ...defaultTheme, primitive, style, mode: "inherit", accent: "violet" };
          const files = assembleBlockFiles(
            block,
            selectFoundationSources(raw, theme),
            themeCSS(theme),
            { theme, dark },
          );
          for (const path of [
            "src/components/site/global-theme-store.ts",
            "src/components/site/preview-theme.ts",
            "src/lib/ui-foundation.ts",
            "src/foundations/styles/index.ts",
          ]) {
            assert.equal(
              files[path],
              raw[`/${path}`],
              `${primitive}/${style}/${block.id}: ${path}`,
            );
          }
          const source = files[`${block.id}.tsx`];
          const { outputText } = ts.transpileModule(source, {
            fileName: "Example.tsx",
            compilerOptions: {
              target: ts.ScriptTarget.ES2022,
              module: ts.ModuleKind.ESNext,
              jsx: ts.JsxEmit.ReactJSX,
            },
          });
          await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
          const actual = getCurrentPreviewTheme();
          // getCurrentPreviewTheme reports the actual build's primitive, which
          // Node has not built. The selected native source is checked separately.
          assert.deepEqual({ ...actual, primitive }, theme);
          assert.equal(storage.size, 0, "the exported preset must not replace recipient storage");
          toggleGlobalTheme();
          assert.equal(getCurrentPreviewTheme().mode, dark ? "light" : "dark");
          const buttonPath =
            primitive === "base"
              ? "/src/foundations/base/ui/button.tsx"
              : "/src/components/ui/button.tsx";
          assert.equal(files["src/components/ui/button.tsx"], raw[buttonPath]);
        }
      }
    }
  }
});
