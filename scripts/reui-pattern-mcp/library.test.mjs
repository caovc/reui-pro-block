import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  createLibrary,
  listCatalog,
  readSource,
  resolveEntry,
  searchLibrary,
  searchSource,
} from "./library.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");

test("local index reflects the catalogs and does not fetch remote metadata", async () => {
  const library = await createLibrary({ root });
  const result = await listCatalog(library);

  assert.equal(result.counts.categories, 79);
  assert.equal(result.counts.blocks, 673);
  assert.equal(result.counts.templates, 18);
  assert.ok(result.counts.reuiComponents > 0);
  assert.ok(result.counts.evidenceDocuments > 0);
});

test("all catalog blocks and templates resolve to existing local implementation paths", async () => {
  const library = await createLibrary({ root });
  const index = await library.index();
  const blocks = index.records.filter((entry) => entry.kind === "block");
  const templates = index.records.filter((entry) => entry.kind === "template");

  assert.equal(blocks.length, 673);
  assert.equal(templates.length, 18);
  assert.deepEqual(
    blocks.filter((entry) => !entry.sourcePath).map((entry) => entry.id),
    [],
  );
  assert.deepEqual(
    templates.filter((entry) => !entry.sourcePath).map((entry) => entry.id),
    [],
  );
});

test("search ranks an exact block ID and exposes the canonical implementation mapping", async () => {
  const library = await createLibrary({ root });
  const search = await searchLibrary(library, { query: "app-shell-1", kind: "block" });
  assert.equal(search.results[0].id, "app-shell-1");

  const result = await resolveEntry(library, { id: "app-shell-1", kind: "block" });
  assert.equal(result.kind, "block");
  assert.match(result.sourcePath, /^src\/blocks\/application\/.+\.tsx$/);
  assert.equal(result.source.path, result.sourcePath);
  assert.ok(result.source.totalLines > 100);
  assert.ok(result.importedComponents.some((component) => component.startsWith("reui/")));
  assert.equal(result.sourceCandidatesAreNotDependencyClosure, true);
});

test("template resolution distinguishes its entry point from candidate modules", async () => {
  const library = await createLibrary({ root });
  const result = await resolveEntry(library, { id: "atlas", kind: "template" });

  assert.equal(result.kind, "template");
  assert.equal(result.sourcePath, "src/templates/business/atlas.tsx");
  assert.ok(result.sourceCandidates.includes(result.sourcePath));
  assert.ok(result.guide.endsWith("docs/agent-guides/templates/atlas.md"));
});

test("component resolution labels the local ReUI directory without claiming unchanged upstream source", async () => {
  const library = await createLibrary({ root });
  const result = await resolveEntry(library, {
    id: "component:reui/frame",
    kind: "component",
  });

  assert.equal(result.kind, "component");
  assert.equal(result.family, "reui");
  assert.equal(result.sourcePath, "src/components/reui/frame.tsx");
  assert.match(result.provenanceNote, /alterado ou adaptado/);
  assert.ok(Array.isArray(result.directImporterConsumers));
  assert.ok(result.directImporterConsumers.length > 0);
  assert.match(result.consumerRelationshipNote, /imports diretos/);
});

test("source reading is paginated and rejects paths outside the local source/document areas", async () => {
  const library = await createLibrary({ root });
  const result = await readSource(library, {
    path: "src/components/reui/REUI-LICENSE.txt",
    startLine: 1,
    lineCount: 2,
  });

  assert.equal(result.startLine, 1);
  assert.equal(result.endLine, 2);
  await assert.rejects(
    readSource(library, { path: "../../.env" }),
    /fora do acervo local|áreas de leitura permitidas/,
  );
});

test("source search returns local file paths and line numbers", async () => {
  const library = await createLibrary({ root });
  const result = await searchSource(library, {
    query: "FramePanel",
    scope: "components",
    limit: 5,
  });

  assert.ok(result.results.length > 0);
  assert.ok(result.results[0].matches[0].line > 0);
});

test("stdio server implements MCP initialize, tool listing, and local search", async () => {
  const serverPath = path.join(root, "scripts/reui-pattern-mcp/server.mjs");
  const child = spawn(process.execPath, [serverPath], {
    cwd: root,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });

  child.stdin.write(
    [
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "1" },
        },
      }),
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
      JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "search_library", arguments: { query: "app-shell-1", kind: "block" } },
      }),
    ].join("\n") + "\n",
  );
  child.stdin.end();
  await once(child, "close");

  const messages = output
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  assert.equal(messages.length, 3);
  assert.equal(messages[0].result.protocolVersion, "2025-03-26");
  assert.ok(messages[1].result.tools.some((tool) => tool.name === "resolve_entry"));
  assert.equal(messages[2].result.structuredContent.results[0].id, "app-shell-1");
});
