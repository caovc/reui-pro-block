#!/usr/bin/env node

import readline from "node:readline";
import {
  createLibrary,
  listCatalog,
  readSource,
  resolveEntry,
  searchLibrary,
  searchSource,
} from "./library.mjs";

const serverInfo = { name: "bricklane-local-ui-patterns", version: "1.0.0" };
const library = await createLibrary();

const tools = [
  {
    name: "search_library",
    description:
      "Busca padrões apenas no acervo local: blocos, templates, componentes e documentação de proveniência. Não consulta o site ReUI.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Tarefa, padrão, componente ou termo de busca." },
        kind: {
          type: "string",
          enum: ["all", "block", "template", "component", "evidence"],
        },
        group: { type: "string", description: "Grupo exato do catálogo de blocos." },
        category: { type: "string", description: "Categoria exata de bloco ou template." },
        limit: { type: "integer", minimum: 1, maximum: 20 },
      },
      required: ["query"],
    },
  },
  {
    name: "list_catalog",
    description:
      "Lista contagens e categorias presentes nos catálogos locais de blocos, templates e componentes.",
    inputSchema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["all", "category", "block", "template", "component"],
        },
      },
    },
  },
  {
    name: "resolve_entry",
    description:
      "Resolve um ID local e devolve metadados, caminho principal, candidatos existentes, evidências e um trecho do código. Os candidatos não são o fechamento completo de dependências.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID de bloco/template/categoria ou component:reui/<nome>.",
        },
        kind: {
          type: "string",
          enum: ["auto", "block", "template", "category", "component"],
        },
        includeSource: {
          type: "boolean",
          description: "Inclui o trecho da implementação principal.",
        },
        maxCharacters: { type: "integer", minimum: 1000, maximum: 40000 },
      },
      required: ["id"],
    },
  },
  {
    name: "search_source",
    description:
      "Busca textual no código, guias e documentação local permitida; retorna caminhos e linhas para inspeção.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        scope: { type: "string", enum: ["all", "blocks", "templates", "components", "docs"] },
        limit: { type: "integer", minimum: 1, maximum: 30 },
      },
      required: ["query"],
    },
  },
  {
    name: "read_source",
    description:
      "Lê linhas de um arquivo dentro de src/ ou docs/ do acervo local, ou avisos de licença na raiz.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho relativo no projeto local." },
        startLine: { type: "integer", minimum: 1 },
        lineCount: { type: "integer", minimum: 1, maximum: 300 },
      },
      required: ["path"],
    },
  },
];

const toolHandlers = {
  search_library: (args) => searchLibrary(library, args),
  list_catalog: (args) => listCatalog(library, args),
  resolve_entry: (args) => resolveEntry(library, args),
  search_source: (args) => searchSource(library, args),
  read_source: (args) => readSource(library, args),
};

const supportedProtocolVersions = new Set(["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"]);

function respond(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function respondError(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } })}\n`);
}

async function handleMessage(message) {
  const id = message.id;
  const method = message.method;
  const params = message.params ?? {};

  if (method === "notifications/initialized" || method === "notifications/cancelled") return;
  if (method === "ping") return respond(id, {});

  if (method === "initialize") {
    const requested = params.protocolVersion;
    const protocolVersion = supportedProtocolVersions.has(requested) ? requested : "2025-06-18";
    return respond(id, {
      protocolVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo,
      instructions:
        "Acervo estritamente local do reui-template. Use search_library, list_catalog, resolve_entry, search_source e read_source. Não há busca web nem ferramentas de escrita.",
    });
  }

  if (method === "tools/list") return respond(id, { tools });

  if (method === "tools/call") {
    const handler = toolHandlers[params.name];
    if (!handler) {
      return respond(id, {
        isError: true,
        content: [{ type: "text", text: `Ferramenta desconhecida: ${params.name}` }],
      });
    }
    try {
      const result = await handler(params.arguments ?? {});
      return respond(id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      });
    } catch (error) {
      return respond(id, {
        isError: true,
        content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
      });
    }
  }

  if (id !== undefined) {
    return respondError(id, -32601, `Método não suportado: ${method}`);
  }
}

const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of input) {
  if (!line.trim()) continue;
  try {
    await handleMessage(JSON.parse(line));
  } catch (error) {
    try {
      const message = JSON.parse(line);
      respondError(
        message.id ?? null,
        -32700,
        error instanceof Error ? error.message : String(error),
      );
    } catch {
      respondError(null, -32700, "JSON-RPC parse error");
    }
  }
}
