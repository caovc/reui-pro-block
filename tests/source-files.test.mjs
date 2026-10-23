import assert from "node:assert/strict";
import { globSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { assembleBlockFiles } from "../src/lib/source-files.ts";

const catalog = JSON.parse(readFileSync("src/data/catalog.json", "utf8"));
const raw = Object.fromEntries(
  globSync("src/**/*.{ts,tsx,css}").map((path) => [`/${path}`, readFileSync(path, "utf8")]),
);

test("every catalog block opens a reachable, complete implementation instead of a usage stub", () => {
  for (const category of catalog) {
    for (const block of category.blocks) {
      const files = assembleBlockFiles(block, raw);
      const main = Object.keys(files)[0];
      assert.match(main, /^src\/blocks\/.+\.tsx$/, block.id);
      assert.doesNotMatch(main, /\/index\.tsx$/, block.id);
      assert.equal(files[main], raw[`/${main}`], `${block.id}: original implementation content`);
      assert.ok(files[main].length > 1000, `${block.id}: implementation must not be a router stub`);
      assert.ok(files[`${block.id}.tsx`].includes("export default function Example"));
      assert.ok(files["src/theme.css"]);
    }
  }
});

test("representative blocks expose their actual variant module and retain supporting files", () => {
  const cases = {
    "app-shell-1": "application/shells/standard",
    "app-shell-33": "application/shells/fleet-center",
    "auth-20": "application/auth-centered",
    "chart-42": "data/bar-slo-sync",
    "ai-chat-9": "data/branching-chat",
    "checkout-3": "commerce/checkout-specialized",
  };
  for (const [id, module] of Object.entries(cases)) {
    const block = catalog.flatMap((category) => category.blocks).find((block) => block.id === id);
    assert.ok(block, id);
    const files = assembleBlockFiles(block, raw);
    assert.equal(Object.keys(files)[0], `src/blocks/${module}.tsx`);
    assert.ok(Object.keys(files).some((path) => path.startsWith("src/components/")));
  }
});
