# Agent setup: local UI pattern MCP

The pattern service indexes only this `reui-template` checkout. It runs as a
local MCP stdio process; it does not access the ReUI website or install code.
Project-scoped client configurations are included for the agents listed below.

## Requirements and smoke test

Use the repository's supported Node version (Node 24) and install dependencies
with `npm ci`. No MCP SDK or new runtime package is required.

```sh
npm run test:mcp
npm run mcp:ui-patterns
```

The second command waits for MCP messages on stdin/stdout. That is expected for
stdio; normally the agent client starts it automatically. The process is
read-only.

## Agents

### Codex

`.codex/config.toml` registers `bricklane_ui_patterns` for a trusted project.
Start Codex in this repository and run:

```sh
codex mcp list
```

The main `start` workspace also has a project-scoped Codex config pointing into
this local checkout. Codex project settings are loaded only when the project is
trusted.

### Claude Code

`.mcp.json` registers the server at project scope. Claude Code may ask for
approval before connecting. Verify it with:

```sh
claude mcp list
```

Then approve the project server in Claude Code and confirm the five tools are
available. No remote ReUI account or sign-in is involved.

### OpenCode

`opencode.json` registers the local server. Verify the connection with:

```sh
opencode mcp list
```

The parent workspace uses the user's global OpenCode MCP entry, which points
directly to this server by absolute path. Its root `opencode.json` intentionally
has no workspace-relative MCP `cwd`, so opening a nested project cannot redirect
the server to a nonexistent `nested-project/reui-template` directory. This
template's own `opencode.json` is used when opening `reui-template` directly.

### Cursor

`.cursor/mcp.json` registers the server for the repository. Open the project
and verify that `bricklane-ui-patterns` appears as a connected MCP server.

### Other MCP clients and agents

Use the client's local/stdio server setting:

- executable: `node`
- argument from this repository root: `scripts/reui-pattern-mcp/server.mjs`
- working directory: repository root
- optional root override: `REUI_PATTERN_ROOT`

For a client without project-scoped config support, register that command in
its user-level MCP configuration. Keep the path local to the checkout; do not
substitute the hosted ReUI MCP URL.

## Skills across agents

The canonical skill is `.agents/skills/reui-patterns/SKILL.md`. Codex, OpenCode,
and Cursor can discover project skills in `.agents/skills/`. Claude Code uses
the mirror at `.claude/skills/reui-patterns/SKILL.md`. Other agents should
follow this repository's `AGENTS.md` and the canonical skill/tools files.

## Tools and flow

1. `search_library(query, kind, group, category, limit)` discovers local entries.
   Search `kind: "component"` before blocks or templates.
2. `list_catalog(kind)` reports inventory and coverage.
3. `resolve_entry(id, kind, includeSource, maxCharacters)` resolves the exact ID
   and returns its primary local implementation path and excerpt.
4. `read_source(path, startLine, lineCount)` reads additional code.
5. `search_source(query, scope, limit)` finds related local source/evidence.

The MCP tools are read-only; none can write files, run shell commands, make Git
changes, or access HTTP resources.

## What is catalogued, and what is not

The local catalog currently contains **79 block categories, 673 block entries,
and 18 full templates**. The index resolves all catalog entries to existing
source paths, and `tests/reui-pattern-mcp/library.test.mjs` checks that
coverage.

That is path coverage, not complete semantic annotation:

- There are currently no per-block agent manuals and one template manual
  (`atlas`) for 18 templates.
- Names, descriptions, categories, template features, source paths, component
  import hints, and selected local provenance documents support discovery.
- Every scenario has **not** been manually described for purpose, when to use
  or avoid, interaction details, responsive behavior, or loading/empty/error
  states.
- Search is weighted lexical matching, not an embedding/vector search.
- Block/template `sourceCandidates` are canonical existing mapping candidates,
  not a complete transitive dependency bundle.
- Imports are reported as dependency evidence, not proof of full behavioral
  reuse or upstream identity.

Use the current source, `AGENTS.md`, and applicable product requirements as the
authority. Fixtures, demo permissions, and local-only actions do not define
consumer business rules.

## Troubleshooting

- **No MCP tools:** confirm Node 24 is available, run `npm ci`, and check the
  agent's MCP status/list command.
- **Missing catalog entries:** run `npm run test:mcp`; keep block IDs and
  templates synchronized with `src/lib/source-targets.ts`.
- **Wrong source path:** check `src/lib/source-targets.ts`; it is the canonical
  implementation resolver.
- **Need complete imports:** use `read_source` for referenced local files;
  `resolve_entry` intentionally does not claim dependency closure.
