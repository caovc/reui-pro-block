# Local UI pattern MCP

Run the server from the repository root with `npm run mcp:ui-patterns`. It is a
read-only stdio MCP server. Client configuration and verification steps for
Codex, Claude Code, OpenCode, Cursor, and other stdio clients are in
[`docs/agent-setup.md`](../../../docs/agent-setup.md).

## MCP tools

- `search_library`: ranked local search for components, blocks, templates, and
  selected guides/provenance documents. Filter with `kind`, `group`, and
  `category`.
- `list_catalog`: category counts, resolved source mapping coverage, and
  hand-authored guide coverage.
- `resolve_entry`: exact local ID, implementation candidates, guide/evidence
  links, and a bounded source excerpt.
- `search_source`: literal search in project source and documentation, returning
  file paths and line numbers.
- `read_source`: read a bounded range from an allowed local file.

Use `search_library` for discovery and then verify a result in source. Search is
weighted lexical matching, not semantic embeddings. `sourceCandidates` lists
existing mappings; it does not promise that all transitive imports are included.

## Current coverage

- Every local block and full-template catalog entry resolves to an existing
  source path under the test suite.
- This validates catalog-to-source navigation, not exhaustive scenario
  annotation or visual/behavioral fidelity.
- Agent-guide coverage is intentionally reported separately. Check the live
  `list_catalog` result; do not claim an unmeasured guide or scenario exists.
- Search returns local metadata and source/evidence paths. It does not establish
  business rules, permissions, or backend behavior.
