import assert from "node:assert/strict";
import { test } from "node:test";
import { assembleBlockFiles } from "../src/lib/source-files.ts";
import {
  getFoundationComponentsConfig,
  selectFoundationSources,
} from "../src/lib/ui-foundation-source.ts";

const block = { id: "app-shell-1", group: "application", category: "app-shell" };
const radix = { primitive: "radix", style: "nova" };
const base = { primitive: "base", style: "maia" };
const baseTooltip = 'export { TooltipProvider } from "./provider";\n';
const baseProvider = 'export { Provider as TooltipProvider } from "./shared.ts";\n';
const baseShared = "export const Provider = () => null;\n";
const styleCss = ':root[data-ui-style="maia"] { --radius: 1rem; }\n';

const raw = Object.freeze({
  "/src/index.css": ":root { color-scheme: light; }\n.brand { color: red; }\n",
  "/src/blocks/application/index.tsx": 'export { default } from "./shells/standard";\n',
  "/src/blocks/application/shells/standard.tsx":
    'import "@/components/ui/button";\nexport default null;\n',
  "/src/components/ui/button.tsx": 'export const primitive = "radix";\n',
  "/src/components/ui/tooltip.tsx": 'export { TooltipProvider } from "radix-ui";\n',
  "/src/components/ui/sonner.tsx": 'export { Toaster } from "sonner";\n',
  "/src/foundations/base/ui/button.tsx": 'export const primitive = "base";\n',
  "/src/foundations/base/ui/tooltip.tsx": baseTooltip,
  "/src/foundations/base/ui/provider/index.ts": baseProvider,
  "/src/foundations/base/ui/provider/shared.ts": baseShared,
});

test("block closure follows the selected foundation's providers and helper imports", () => {
  const baseFiles = assembleBlockFiles(block, selectFoundationSources(raw, base), styleCss);
  const radixFiles = assembleBlockFiles(block, selectFoundationSources(raw, radix));

  assert.equal(
    baseFiles["src/components/ui/button.tsx"],
    raw["/src/foundations/base/ui/button.tsx"],
  );
  assert.equal(baseFiles["src/components/ui/tooltip.tsx"], baseTooltip);
  assert.equal(baseFiles["src/components/ui/provider/index.ts"], baseProvider);
  assert.equal(baseFiles["src/components/ui/provider/shared.ts"], baseShared);
  assert.equal(baseFiles["src/components/ui/sonner.tsx"], raw["/src/components/ui/sonner.tsx"]);
  assert.equal(baseFiles["src/theme.css"], `:root { color-scheme: light; }\n${styleCss}`);

  assert.equal(radixFiles["src/components/ui/button.tsx"], raw["/src/components/ui/button.tsx"]);
  assert.equal(radixFiles["src/components/ui/tooltip.tsx"], raw["/src/components/ui/tooltip.tsx"]);
  assert.equal(radixFiles["src/components/ui/provider/shared.ts"], undefined);
  assert.ok(!Object.keys(baseFiles).some((path) => path.startsWith("src/foundations/base/ui/")));
});

test("starter registry configuration matches the chosen foundation and exported theme entry", () => {
  for (const [foundation, style] of [
    [base, "base-maia"],
    [radix, "radix-nova"],
  ]) {
    const config = getFoundationComponentsConfig(foundation);
    assert.equal(config.style, style);
    assert.equal(config.tailwind.css, "src/theme.css");
    assert.equal(config.aliases.ui, "@/components/ui");
    assert.equal(config.registries["@reui"], "https://reui.io/r/{style}/{name}.json");
  }
});
