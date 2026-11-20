import { readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const here = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(here, "../..");
const sourceExtensions = [".tsx", ".ts", ".css", ".json"];
const componentDirectories = ["src/components/reui", "src/components/ui"];
const mainDocs = [
  "docs/CATALOG.md",
  "docs/REUI-REUSE.md",
  "docs/FIDELITY.md",
  "docs/reui-data-grid-foundation.md",
  "THIRD_PARTY_NOTICES.md",
  "LICENSE",
  "src/components/reui/REUI-LICENSE.txt",
];

function asProjectPath(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function isInside(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

async function walkFiles(root, directory, accept = () => true) {
  const absoluteDirectory = path.resolve(root, directory);
  if (!isInside(root, absoluteDirectory)) return [];

  let entries;
  try {
    entries = await readdir(absoluteDirectory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(absoluteDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(root, asProjectPath(root, absolutePath), accept)));
    } else if (entry.isFile() && accept(absolutePath)) {
      files.push(asProjectPath(root, absolutePath));
    }
  }
  return files.sort();
}

async function loadTypeScriptModule(root, relativePath) {
  const sourcePath = path.resolve(root, relativePath);
  const source = await readFile(sourcePath, "utf8");
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    reportDiagnostics: true,
  });

  const errors = (diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length > 0) {
    const message = errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n"));
    throw new Error(`Unable to load ${relativePath}: ${message.join("\n")}`);
  }

  const encoded = Buffer.from(outputText).toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/[^\p{Letter}\p{Number}_-]+/u)
    .filter((part) => part.length > 1);
}

function unique(values) {
  return [...new Set(values)];
}

function parseImports(source) {
  const imports = [];
  const expression = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\burl\(\s*)["']([^"']+)["']/g;
  for (const match of source.matchAll(expression)) imports.push(match[1]);
  return unique(imports);
}

function componentReferences(source) {
  const references = [];
  for (const specifier of parseImports(source)) {
    const match = specifier.match(/^@\/components\/(reui|ui)\/(.+?)(?:\.[cm]?[jt]sx?)?$/);
    if (match) references.push(`${match[1]}/${match[2]}`);
  }
  return unique(references);
}

async function existingSourcePath(root, relativePath) {
  const base = path.resolve(root, relativePath);
  const candidates = [
    base,
    ...sourceExtensions.map((extension) => `${base}${extension}`),
    ...["index.tsx", "index.ts", "index.css"].map((file) => path.join(base, file)),
  ];

  for (const candidate of candidates) {
    if (!isInside(root, candidate)) continue;
    try {
      if ((await stat(candidate)).isFile()) return asProjectPath(root, candidate);
    } catch {
      // Try the next known source extension.
    }
  }
  return undefined;
}

async function readPrimarySource(root, sourcePath) {
  if (!sourcePath) return undefined;
  try {
    return await readFile(path.resolve(root, sourcePath), "utf8");
  } catch {
    return undefined;
  }
}

async function findEvidenceDocuments(root) {
  const docs = await walkFiles(root, "docs", (file) => /\.(md|json)$/i.test(file));
  const selected = docs.filter((file) => {
    const basename = path.basename(file).toLowerCase();
    return (
      file.startsWith("docs/agent-guides/") ||
      basename.includes("provenance") ||
      basename.includes("reuse") ||
      file === "docs/CATALOG.md" ||
      file === "docs/REUI-REUSE.md"
    );
  });
  return unique([...mainDocs.filter((file) => file !== "LICENSE"), ...selected]).sort();
}

function documentTitle(relativePath, content) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1];
  return heading ?? path.basename(relativePath);
}

async function collectComponentEntries(root) {
  const components = [];
  for (const directory of componentDirectories) {
    const files = await walkFiles(root, directory, (file) => /\.(tsx?|css)$/i.test(file));
    for (const sourcePath of files) {
      const suffix = sourcePath.slice(directory.length + 1).replace(/\.(tsx?|css)$/i, "");
      const normalizedSuffix = suffix.endsWith("/index") ? suffix.slice(0, -6) : suffix;
      const source = await readPrimarySource(root, sourcePath);
      if (!source) continue;

      const family = directory.endsWith("/reui") ? "reui" : "ui";
      const sourceExtension = path.extname(sourcePath);
      const componentId = `${family}/${normalizedSuffix}${sourceExtension === ".css" ? ".css" : ""}`;
      const title = normalizedSuffix
        .split("/")
        .at(-1)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
      components.push({
        id: `component:${componentId}`,
        kind: "component",
        title,
        family,
        sourcePath,
        summary:
          family === "reui"
            ? "Implementação local no diretório de componentes ReUI; confira a proveniência específica e possíveis adaptações."
            : "Componente UI local. Sua presença não significa, por si só, que seja uma implementação ReUI.",
        tags: [family, normalizedSuffix, "component"],
        _searchText: source.slice(0, 80_000),
      });
    }
  }
  return components;
}

function scoreEntry(entry, queryTokens, normalizedQuery) {
  const id = normalizeText(entry.id);
  const title = normalizeText(entry.title);
  const summary = normalizeText(entry.summary);
  const tags = normalizeText((entry.tags ?? []).join(" "));
  const category = normalizeText(`${entry.category ?? ""} ${entry.group ?? ""}`);
  const sourcePath = normalizeText(entry.sourcePath);
  const body = normalizeText(entry._searchText);
  let score = 0;

  if (normalizedQuery && id === normalizedQuery) score += 100;
  if (normalizedQuery && title === normalizedQuery) score += 80;
  if (normalizedQuery && (id.includes(normalizedQuery) || title.includes(normalizedQuery))) {
    score += 25;
  }

  for (const token of queryTokens) {
    if (id.includes(token)) score += 18;
    if (title.includes(token)) score += 12;
    if (tags.includes(token)) score += 7;
    if (category.includes(token)) score += 5;
    if (summary.includes(token)) score += 4;
    if (sourcePath.includes(token)) score += 3;
    if (body.includes(token)) score += 0.5;
  }
  return score;
}

function publicEntry(entry) {
  const { _searchText, ...result } = entry;
  return result;
}

function matchesKind(entry, kind) {
  return !kind || kind === "all" || entry.kind === kind;
}

function templateGuidePath(root, id) {
  return path.join(root, "docs", "agent-guides", "templates", `${id}.md`);
}

async function loadLibrary(root) {
  const rootPath = path.resolve(root);
  const [catalogText, sourceTargets, templateCatalog, componentEntries, evidencePaths] =
    await Promise.all([
      readFile(path.join(rootPath, "src/data/catalog.json"), "utf8"),
      loadTypeScriptModule(rootPath, "src/lib/source-targets.ts"),
      loadTypeScriptModule(rootPath, "src/templates/catalog.ts"),
      collectComponentEntries(rootPath),
      findEvidenceDocuments(rootPath),
    ]);

  const categories = JSON.parse(catalogText);
  const blocks = categories.flatMap((category) =>
    category.blocks.map((block) => ({
      ...block,
      kind: "block",
      categoryLabel: category.name,
      sourceCandidates: sourceTargets.blockImplementationCandidates(block),
    })),
  );
  const templates = templateCatalog.templates.map((template) => ({
    ...template,
    kind: "template",
    sourceCandidates: sourceTargets.templateImplementationTargets(template),
  }));

  const records = [];
  for (const block of blocks) {
    const existingCandidates = [];
    for (const candidate of block.sourceCandidates) {
      const existing = await existingSourcePath(rootPath, candidate);
      if (existing) existingCandidates.push(existing);
    }
    const sourcePath = existingCandidates[0];
    const source = await readPrimarySource(rootPath, sourcePath);
    const importedComponents = source ? componentReferences(source) : [];
    records.push({
      id: block.id,
      kind: "block",
      title: block.name,
      summary: block.description ?? "",
      group: block.group,
      category: block.category,
      categoryLabel: block.categoryLabel,
      reference: block.reference,
      sourcePath,
      sourceCandidates: existingCandidates,
      importedComponents,
      tags: [block.group, block.category, block.categoryLabel, ...importedComponents],
      _searchText: `${block.id} ${block.name} ${block.description ?? ""} ${sourcePath ?? ""} ${importedComponents.join(" ")}`,
    });
  }

  for (const template of templates) {
    const existingCandidates = [];
    for (const candidate of template.sourceCandidates) {
      const existing = await existingSourcePath(rootPath, candidate);
      if (existing) existingCandidates.push(existing);
    }
    const sourcePath = existingCandidates[0];
    const source = await readPrimarySource(rootPath, sourcePath);
    const importedComponents = source ? componentReferences(source) : [];
    let guide;
    try {
      await stat(templateGuidePath(rootPath, template.id));
      guide = asProjectPath(rootPath, templateGuidePath(rootPath, template.id));
    } catch {
      guide = undefined;
    }

    records.push({
      id: template.id,
      kind: "template",
      title: template.name,
      summary: `${template.subtitle}. ${template.description}`,
      group: template.family,
      category: template.category,
      features: template.features,
      reference: template.reference,
      sourcePath,
      sourceCandidates: existingCandidates,
      guide,
      importedComponents,
      tags: [template.family, template.category, ...template.features, ...importedComponents],
      _searchText: `${template.id} ${template.name} ${template.description} ${template.features.join(" ")} ${sourcePath ?? ""} ${importedComponents.join(" ")}`,
    });
  }

  for (const component of componentEntries) records.push(component);

  for (const sourcePath of evidencePaths) {
    const content = await readPrimarySource(rootPath, sourcePath);
    if (!content) continue;
    const title = documentTitle(sourcePath, content);
    records.push({
      id: `evidence:${sourcePath}`,
      kind: "evidence",
      title,
      summary: `Documento local de referência ou proveniência: ${sourcePath}. Verifique data e escopo no próprio documento.`,
      sourcePath,
      tags: ["documentation", "provenance", "reuse", "guide"],
      _searchText: content,
    });
  }

  return { root: rootPath, categories, blocks, templates, records, sourceTargets };
}

export async function createLibrary(options = {}) {
  const root = path.resolve(options.root ?? process.env.REUI_PATTERN_ROOT ?? defaultRoot);
  let cached;
  return {
    root,
    async index() {
      cached ??= await loadLibrary(root);
      return cached;
    },
    async refresh() {
      cached = await loadLibrary(root);
      return cached;
    },
  };
}

export async function searchLibrary(library, input) {
  const index = await library.index();
  const query = String(input.query ?? "").trim();
  if (!query) throw new Error("Informe query com o que deseja encontrar.");

  const kind = input.kind ?? "all";
  const queryTokens = tokenize(query);
  const normalizedQuery = normalizeText(query);
  const limit = Math.max(1, Math.min(20, Number(input.limit) || 8));
  const results = index.records
    .filter((entry) => matchesKind(entry, kind))
    .filter((entry) => !input.group || entry.group === input.group)
    .filter((entry) => !input.category || entry.category === input.category)
    .map((entry) => ({ entry, score: scoreEntry(entry, queryTokens, normalizedQuery) }))
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.entry.kind.localeCompare(right.entry.kind) ||
        left.entry.title.localeCompare(right.entry.title),
    )
    .slice(0, limit)
    .map(({ entry, score }) => ({
      ...publicEntry(entry),
      score: Math.round(score * 10) / 10,
    }));

  return { query, count: results.length, results };
}

export async function listCatalog(library, input = {}) {
  const index = await library.index();
  const kind = input.kind ?? "all";
  const categories = index.categories.map((category) => ({
    id: category.id,
    name: category.name,
    group: category.group,
    count: category.blocks.length,
  }));

  return {
    counts: {
      categories: categories.length,
      blocks: index.blocks.length,
      templates: index.templates.length,
      reuiComponents: index.records.filter(
        (entry) => entry.kind === "component" && entry.family === "reui",
      ).length,
      uiComponents: index.records.filter(
        (entry) => entry.kind === "component" && entry.family === "ui",
      ).length,
      evidenceDocuments: index.records.filter((entry) => entry.kind === "evidence").length,
    },
    ...(kind === "all" || kind === "category" || kind === "block" ? { categories } : {}),
    ...(kind === "all" || kind === "template"
      ? {
          templates: index.templates.map((template) => ({
            id: template.id,
            name: template.name,
            family: template.family,
            category: template.category,
            features: template.features,
          })),
        }
      : {}),
    componentFamilies:
      kind === "all" || kind === "component"
        ? [
            {
              id: "reui",
              count: index.records.filter(
                (entry) => entry.kind === "component" && entry.family === "reui",
              ).length,
              note: "Fonte vendorizada local; a origem/adaptação de cada arquivo pode exigir evidência documental.",
            },
            {
              id: "ui",
              count: index.records.filter(
                (entry) => entry.kind === "component" && entry.family === "ui",
              ).length,
              note: "Componentes UI locais; não os classifique automaticamente como implementações ReUI.",
            },
          ]
        : undefined,
  };
}

function findComponent(index, id) {
  const normalized = id.replace(/^component:/, "");
  return index.records.find(
    (entry) =>
      entry.kind === "component" &&
      (entry.id === `component:${normalized}` ||
        entry.sourcePath === `src/components/${normalized}.tsx` ||
        entry.sourcePath === `src/components/${normalized}.ts`),
  );
}

function importedComponentConsumers(index, component) {
  const componentPath = component.sourcePath.match(
    /^src\/components\/(reui|ui)\/(.+?)\.(?:tsx?|css)$/,
  );
  if (!componentPath) return [];
  let componentKey = `${componentPath[1]}/${componentPath[2]}`;
  if (componentKey.endsWith("/index")) componentKey = componentKey.slice(0, -6);

  return index.records
    .filter(
      (entry) =>
        ["block", "template"].includes(entry.kind) &&
        (entry.importedComponents ?? []).includes(componentKey),
    )
    .map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      title: entry.title,
      sourcePath: entry.sourcePath,
      relationship: "direct import in the selected implementation source",
    }));
}

async function findPrimarySource(root, candidates) {
  const resolved = [];
  for (const candidate of candidates ?? []) {
    const existing = await existingSourcePath(root, candidate);
    if (existing) resolved.push(existing);
  }
  return { primary: resolved[0], candidates: unique(resolved) };
}

async function readSourceSnippet(root, sourcePath, maxCharacters) {
  const content = await readPrimarySource(root, sourcePath);
  if (content === undefined) return undefined;
  const lines = content.split("\n");
  const selected = [];
  let characters = 0;
  let lastLine = 0;
  for (const [index, line] of lines.entries()) {
    const lineLength = line.length + 1;
    if (characters + lineLength > maxCharacters && selected.length > 0) break;
    selected.push(`${index + 1}: ${line}`);
    characters += lineLength;
    lastLine = index + 1;
  }
  return {
    path: sourcePath,
    startLine: 1,
    endLine: lastLine,
    totalLines: lines.length,
    truncated: lastLine < lines.length,
    content: selected.join("\n"),
  };
}

export async function resolveEntry(library, input) {
  const index = await library.index();
  const id = String(input.id ?? "").trim();
  if (!id) throw new Error("Informe o id da entrada local.");

  const requestedKind = input.kind ?? "auto";
  let record;
  let candidates = [];

  if (requestedKind === "auto" || requestedKind === "block") {
    const block = index.blocks.find((entry) => entry.id === id);
    if (block) {
      record = index.records.find((entry) => entry.kind === "block" && entry.id === id);
      candidates = block.sourceCandidates;
    }
  }

  if (!record && (requestedKind === "auto" || requestedKind === "template")) {
    const template = index.templates.find((entry) => entry.id === id);
    if (template) {
      record = index.records.find((entry) => entry.kind === "template" && entry.id === id);
      candidates = template.sourceCandidates;
    }
  }

  if (!record && (requestedKind === "auto" || requestedKind === "component")) {
    record = findComponent(index, id);
    if (record) candidates = [record.sourcePath];
  }

  if (!record && (requestedKind === "auto" || requestedKind === "category")) {
    const category = index.categories.find((entry) => entry.id === id);
    if (category) {
      return {
        id: category.id,
        kind: "category",
        title: category.name,
        group: category.group,
        count: category.blocks.length,
        entries: category.blocks.map((block) => ({
          id: block.id,
          name: block.name,
          description: block.description,
          reference: block.reference,
        })),
      };
    }
  }

  if (!record) throw new Error(`Não encontrei "${id}" no catálogo local.`);

  const sourceResolution = await findPrimarySource(index.root, candidates);
  const maxCharacters = Math.max(1_000, Math.min(40_000, Number(input.maxCharacters) || 18_000));
  const source =
    input.includeSource === false || !sourceResolution.primary
      ? undefined
      : await readSourceSnippet(index.root, sourceResolution.primary, maxCharacters);
  const evidenceTokens = tokenize(`${record.id} ${record.title} ${record.category ?? ""}`);
  const evidenceDocuments = index.records
    .filter((entry) => entry.kind === "evidence")
    .map((entry) => ({ entry, score: scoreEntry(entry, evidenceTokens, "") }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map(({ entry }) => ({ path: entry.sourcePath, title: entry.title }));
  const directImporterConsumers =
    record.kind === "component" ? importedComponentConsumers(index, record) : undefined;

  return {
    ...publicEntry(record),
    sourcePath: sourceResolution.primary,
    sourceCandidates: sourceResolution.candidates,
    sourceCandidatesAreNotDependencyClosure: true,
    importedComponents: record.importedComponents ?? [],
    provenanceNote:
      record.kind === "component" && record.family === "reui"
        ? "O arquivo está em src/components/reui. Consulte a licença e as evidências locais para saber se ele foi alterado ou adaptado."
        : record.kind === "component"
          ? "A localização em src/components/ui não prova origem ReUI; verifique o código e os avisos."
          : "Blocos e templates são composições locais. Imports apontam dependências, mas não provam por si só equivalência ou reutilização funcional.",
    ...(directImporterConsumers
      ? {
          directImporterConsumers,
          consumerRelationshipNote:
            "A lista registra imports diretos da implementação principal; valide no código e na documentação antes de afirmar reutilização funcional.",
        }
      : {}),
    evidenceDocuments,
    ...(source ? { source } : {}),
  };
}

function normalizeAllowedPath(root, requestedPath) {
  const inputPath = String(requestedPath ?? "").trim();
  if (!inputPath || path.isAbsolute(inputPath)) {
    throw new Error("Informe um caminho relativo dentro do acervo local.");
  }
  const absolutePath = path.resolve(root, inputPath);
  if (!isInside(root, absolutePath))
    throw new Error("O caminho solicitado está fora do acervo local.");
  const normalized = asProjectPath(root, absolutePath);
  const allowed =
    normalized.startsWith("src/") ||
    normalized.startsWith("docs/") ||
    ["LICENSE", "THIRD_PARTY_NOTICES.md", "components.json", "README.md"].includes(normalized);
  if (!allowed) throw new Error("Esse caminho não pertence às áreas de leitura permitidas.");
  return { absolutePath, normalized };
}

export async function readSource(library, input) {
  const { absolutePath, normalized } = normalizeAllowedPath(library.root, input.path);
  const [realRoot, realTarget] = await Promise.all([
    realpath(library.root),
    realpath(absolutePath),
  ]);
  if (!isInside(realRoot, realTarget)) {
    throw new Error("O caminho real do arquivo está fora do acervo local.");
  }
  const content = await readFile(realTarget, "utf8");
  const lines = content.split("\n");
  const startLine = Math.max(1, Number(input.startLine) || 1);
  const lineCount = Math.max(1, Math.min(300, Number(input.lineCount) || 200));
  const selected = lines.slice(startLine - 1, startLine - 1 + lineCount);
  return {
    path: normalized,
    startLine,
    endLine: Math.min(lines.length, startLine - 1 + selected.length),
    totalLines: lines.length,
    hasMore: startLine - 1 + selected.length < lines.length,
    content: selected.map((line, index) => `${startLine + index}: ${line}`).join("\n"),
  };
}

function searchRoots(scope) {
  const scopes = {
    all: ["src", "docs"],
    blocks: ["src/blocks"],
    templates: ["src/templates"],
    components: ["src/components"],
    docs: ["docs"],
  };
  const roots = scopes[scope];
  if (!roots) throw new Error(`Escopo inválido. Use: ${Object.keys(scopes).join(", ")}.`);
  return roots;
}

export async function searchSource(library, input) {
  const query = String(input.query ?? "").trim();
  const terms = tokenize(query);
  if (terms.length === 0) throw new Error("Informe termos para buscar no código local.");

  const allowedExtensions = /\.(tsx?|css|md|json)$/i;
  const files = [];
  for (const directory of searchRoots(input.scope ?? "all")) {
    files.push(
      ...(await walkFiles(library.root, directory, (file) => allowedExtensions.test(file))),
    );
  }

  const results = [];
  const maxFiles = Math.max(1, Math.min(30, Number(input.limit) || 12));
  const maxMatches = 4;
  for (const relativePath of unique(files)) {
    if (results.length >= maxFiles) break;
    const absolutePath = path.resolve(library.root, relativePath);
    const fileStat = await stat(absolutePath);
    if (fileStat.size > 1_000_000) continue;
    const content = await readFile(absolutePath, "utf8");
    const lines = content.split("\n");
    const matches = [];
    for (const [index, line] of lines.entries()) {
      const normalizedLine = normalizeText(line);
      if (!terms.every((term) => normalizedLine.includes(term))) continue;
      matches.push({ line: index + 1, text: line.trim().slice(0, 500) });
      if (matches.length >= maxMatches) break;
    }
    if (matches.length > 0) results.push({ path: relativePath, matches });
  }

  return { query, scope: input.scope ?? "all", count: results.length, results };
}
