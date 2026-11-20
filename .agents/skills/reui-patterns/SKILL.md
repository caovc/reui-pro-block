---
name: reui-patterns
description: "Search and adapt the local Bricklane/ReUI component, block, and template library when building or correcting UI patterns in this repository."
---

# Local ReUI pattern workflow

Use this skill for UI work in `reui-template`. The checked-out project is the
only pattern catalog and implementation source for this workflow.

## Before implementing

1. Read the applicable `AGENTS.md` and follow the requirement to inspect and
   actually reuse an existing free ReUI implementation before extending a Pro
   block or template.
2. Search `search_library` with `kind: "component"` first. Check
   `src/components/reui/` and the related local provenance evidence. Do not
   label a shadcn dependency or an import path as an actual ReUI implementation.
3. Search with `kind: "block"` and `kind: "template"` for composition patterns.
   Use `list_catalog` to browse IDs and coverage.
4. Resolve likely matches with `resolve_entry`; inspect source with
   `read_source` and find additional local references with `search_source`.
   Compare no more than three plausible candidates before choosing.
5. Preserve the current source's useful layout and interaction. Replace sample
   data, fake permissions, local-only actions, and placeholder behavior with
   requirements established by the current task.

## Evidence and adaptation

- Current source code and project instructions outrank dated audit documents.
- `sourceCandidates` are verified paths, not a complete dependency closure.
  Follow imports when needed and read every file that the implementation relies
  on.
- A direct import is evidence of a dependency relationship, not proof that the
  consumer reproduces a component's complete behavior.
- `src/components/reui/` identifies the vendored ReUI source area; it does not
  prove that each file is unchanged upstream. Check provenance and preserve
  `src/components/reui/REUI-LICENSE.txt`.
- Do not use hosted ReUI MCP tools, remote registry search, or ReUI website
  content for this local workflow.
- If a needed capability is missing from the free implementation, state the
  exact gap and keep the custom extension narrow.

## Validation and hand-back

Run the checks required by `AGENTS.md`. Report the ReUI components actually
reused, duplicated implementation replaced, and custom parts that remain with
their reason. Treat the search index as a discovery aid; the current source is
the implementation truth.

For MCP installation, supported-agent configuration, catalog coverage, and
search limitations, read [tools.md](./tools.md) and
[`docs/agent-setup.md`](../../../docs/agent-setup.md).
