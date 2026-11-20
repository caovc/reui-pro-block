# Bricklane local UI pattern MCP

This read-only MCP server searches the checked-out `reui-template` source. It does
not access the ReUI website, download registry items, install packages, or modify
the repository.

## Start

From the repository root:

```sh
npm run mcp:ui-patterns
```

The server uses MCP over stdio and requires the repository's installed
TypeScript dependency. Its root defaults to the repository containing this
script. Set `REUI_PATTERN_ROOT` only when intentionally pointing it at another
checkout with the same layout.

## Tools

- `search_library`: searches block, template, component, and selected local
  provenance/documentation records.
- `list_catalog`: reports local catalog categories and counts.
- `resolve_entry`: resolves a block, template, category, or component ID to
  verified local paths and a bounded excerpt of the main source.
- `search_source`: searches source/docs and returns matching paths and lines.
- `read_source`: reads a bounded line range from an allowed local source or
  documentation path.

Block and template source paths are resolved through the project's
`src/lib/source-targets.ts`, the same mapping used by the source preview. The
returned candidate list is not claimed to be a complete dependency closure.
Use `read_source` to inspect additional files.

## Configure an MCP client

Configure the client to launch Node with the absolute path to
`scripts/reui-pattern-mcp/server.mjs`. For example, an OpenCode configuration
can use:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "bricklane-ui-patterns": {
        "type": "local",
        "command": ["node", "/absolute/path/to/reui-template/scripts/reui-pattern-mcp/server.mjs"],
        "cwd": "/absolute/path/to/reui-template"
      }
    }
  }
}
```

If the MCP client starts the process from another working directory, set
`REUI_PATTERN_ROOT` to this repository's absolute path in the client's MCP
environment configuration.

## Provenance and use

Files under `src/components/reui/` are identified as belonging to the local
ReUI source area. That location alone does not assert that a file is unchanged
upstream; inspect the relevant local provenance record and preserve the
ReUI MIT notice. Files under `src/components/ui/` are not labeled as ReUI
implementations merely because they are dependencies of ReUI examples.

Blocks and templates are local compositions. Their sample records, permissions,
and local-only actions are reference material, not product or backend contracts.
The server returns local paths and source evidence so the consuming agent can
verify the current implementation.
