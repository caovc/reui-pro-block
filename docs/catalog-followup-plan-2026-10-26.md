# Official catalog follow-up — 2026-10-26

The current public Blocks catalog has669 stable IDs in79 categories. The implemented local catalog snapshot contains662 IDs in78 categories. Read-only comparison fetched all79 public category pages and verified all seven additional detail pages with matching canonical URLs and HTTP200. No old ID was removed, renamed or moved. This records a current coverage difference; it does not establish when any block was published.

The separate template audit verified18 local/public template IDs, names, category memberships and live preview URLs, with no additions or removals. Dynamic list ordering is not a new template.

## Implementation queue

All seven entries below are pending. Their IDs must remain explicit; `data-grid-advanced-22` must not be renumbered and IDs14–21 must not be invented. Existing releases continue independently.

| Stable ID             | Official name/reference                                                                     | Owner and next step                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| data-grid-advanced-10 | [Technician Capacity](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-10)      | Data Grid owner: free-component and public-state audit, then an independent domain leaf     |
| data-grid-advanced-11 | [Factory Scorecard](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-11)        | Data Grid owner: free-component and public-state audit, then an independent domain leaf     |
| data-grid-advanced-12 | [Freight & Cargo Services](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-12) | Data Grid owner: free-component and public-state audit, then an independent domain leaf     |
| data-grid-advanced-13 | [HR Scorecard](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-13)             | Data Grid owner: free-component and public-state audit, then an independent domain leaf     |
| data-grid-advanced-22 | [Prospect Database](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-22)        | Data Grid owner: free-component and public-state audit, then an independent domain leaf     |
| solution-dev-ops-7    | [Deploy Board](https://reui.io/blocks/solutions/dev-ops/solution-dev-ops-7)                 | Solutions follow-up: free-component and public-state audit, then an independent domain leaf |
| solution-map-1        | [Dispatch Map](https://reui.io/blocks/solutions/map/solution-map-1)                         | Solutions follow-up: free-component and public-state audit, then an independent domain leaf |

## Required sequence

1. Locate the actual official free ReUI components and examples, and inspect existing project implementations before building a leaf. Record unavailable domain/engine capabilities and the concrete reason for custom code.
2. Compare the same public entry, viewport1440/390, theme, DPR and interaction state. Record the three largest actual layout/font/portal differences first. Keep loading, empty, error, disabled, expanded, hover and keyboard/focus states in the plan.
3. Implement independent leaves with readable source, local original Bricklane artwork or clearly licensed alternatives. Keep required free-source MIT, font OFL and media attribution in both the site and exported projects.
4. Add explicit catalog IDs and the new `solutions/map` category only when their actual implementations and source routes are ready. Add precise `src/lib/source-targets.ts` defaults and supporting file closure together. Do not expose a generic placeholder as a completed block.
5. Verify real state changes and desktop/phone rendering, then source view/copy/single-file/project download byte equivalence, correct asset/dependency/license closure and a representative actual-project strict build. Keep distinct Example payload checks when a shared source graph justifies avoiding repeated cold compilation.
6. Root alone serially stages scoped frozen changes, runs required format/lint/checks, commits and pushes. Check CI and Pages independently; a push or catalog count is not a fidelity/deployment claim.

## Scope and coordination

The5Advanced audits and the2Solutions audits may proceed in parallel using separate leaves. Existing shared DataGrid adapters, Tabs, Sidebar, global CSS and export collectors retain their assigned single writers. No new dependency, shared primitive change, catalog mutation or cold build is part of the initial read-only audit.

After this queue is delivered, expected catalog coverage is669 blocks/79 categories and18 templates, subject to another final public-ID comparison. Existing blocks still retain their own unresolved fidelity ledgers; matching counts does not certify every visual state.

Evidence snapshots remain outside the repository: the Blocks diff/canonical/fetch receipts and the separate Templates18 canonical receipt. Raw reference HTML, paid screenshots and extracted original artwork are not distributed.
