import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = new URL("../", import.meta.url);
const readSource = (path) => readFile(new URL(path, root), "utf8");

test("template source resolves the selected UI foundation and exports the copied theme", async (t) => {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(root),
    resolve: { alias: { "@": fileURLToPath(new URL("src", root)) } },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, watch: null, ws: false },
  });
  t.after(() => server.close());

  const [{ templateFiles }, { templates }, { defaultTheme, themeCSS }] = await Promise.all([
    server.ssrLoadModule("/src/templates/source.ts"),
    server.ssrLoadModule("/src/templates/catalog.ts"),
    server.ssrLoadModule("/src/components/site/preview-theme.ts"),
  ]);
  const template = templates.find(({ id }) => id === "filebox");
  assert.ok(template);

  for (const [primitive, style] of [
    ["radix", "nova"],
    ["base", "lyra"],
  ]) {
    const theme = { ...defaultTheme, primitive, style, accent: "emerald", mode: "dark" };
    const files = templateFiles(template, theme);
    const expectedButton =
      primitive === "base" ? "src/foundations/base/ui/button.tsx" : "src/components/ui/button.tsx";

    assert.equal(Object.keys(files)[0], "src/templates/collaboration/drive.tsx");
    assert.equal(files["src/components/ui/button.tsx"], await readSource(expectedButton));
    assert.ok(
      !Object.keys(files).some((path) => /^src\/foundations\/base\/ui\/.*\.tsx?$/.test(path)),
    );
    assert.ok(files["src/foundations/styles/index.ts"]);
    assert.ok(files["src/components/reui/REUI-LICENSE.txt"]);
    assert.ok(files["src/blocks/assets/Inter-LICENSE.txt"]);

    const components = JSON.parse(files["components.json"]);
    assert.equal(components.style, `${primitive}-${style}`);
    assert.equal(components.tailwind.css, "src/theme.css");
    assert.equal(components.aliases.ui, "@/components/ui");
    assert.ok(files["src/theme.css"].endsWith(themeCSS(theme)));
    assert.match(files["src/theme.css"], /--primary: #047857/);
    assert.match(files["index.html"], new RegExp(`data-ui-primitive="${primitive}"`));
    assert.match(files["index.html"], new RegExp(`data-ui-style="${style}"`));
    assert.match(files["index.html"], /data-accent="emerald"/);
    assert.match(files["index.html"], /class="dark"/);
    const manifest = JSON.parse(files["package.json"]);
    const mode = primitive === "base" ? " --mode base-ui" : "";
    assert.equal(manifest.scripts.build, `tsc --noEmit && vite build${mode}`);
    assert.ok(manifest.dependencies[primitive === "base" ? "@base-ui/react" : "radix-ui"]);
  }
});
