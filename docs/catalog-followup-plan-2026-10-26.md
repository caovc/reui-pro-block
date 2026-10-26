# Official catalog follow-up — 2026-10-26

The implemented catalog now represents all 669 stable IDs in the audited 79 public categories. At the beginning of this audit, the local snapshot contained 662 IDs in 78 categories. Read-only comparison fetched all 79 public category pages and verified the seven additional detail pages with matching canonical URLs and HTTP 200. No old ID was removed, renamed or moved. The audit establishes coverage, rather than publication dates or pixel-identical fidelity.

The separate template audit verified18 local/public template IDs, names, category memberships and live preview URLs, with no additions or removals. Dynamic list ordering is not a new template.

## Implementation record

All seven entries below have dedicated implementations and actual implementation source defaults. Deploy Board was committed separately; the remaining six share the 669-entry release verification. Their IDs remain explicit: `data-grid-advanced-22` is retained, and IDs 14–21 are not invented. Source/download checks, actual exported-project builds and remaining visual differences are recorded in [the release receipt](catalog-six-blocks-669-release.json). CI and Pages deployment remain separate release gates.

| Stable ID             | Official name/reference                                                                     | Implementation and verification                                                          |
| --------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| data-grid-advanced-10 | [Technician Capacity](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-10)      | Dedicated free ReUI domain leaf; the five-block native interaction suite passes 45 tests |
| data-grid-advanced-11 | [Factory Scorecard](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-11)        | Dedicated free ReUI domain leaf; the five-block native interaction suite passes 45 tests |
| data-grid-advanced-12 | [Freight & Cargo Services](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-12) | Dedicated free ReUI domain leaf; the five-block native interaction suite passes 45 tests |
| data-grid-advanced-13 | [HR Scorecard](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-13)             | Dedicated free ReUI domain leaf; the five-block native interaction suite passes 45 tests |
| data-grid-advanced-22 | [Prospect Database](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-22)        | Dedicated free ReUI domain leaf; the five-block native interaction suite passes 45 tests |
| solution-dev-ops-7    | [Deploy Board](https://reui.io/blocks/solutions/dev-ops/solution-dev-ops-7)                 | Dedicated solution leaf; see the verification record below                               |
| solution-map-1        | [Dispatch Map](https://reui.io/blocks/solutions/map/solution-map-1)                         | Dedicated solution leaf; see the verification record below                               |

Deploy Board uses the published free-component implementation from commit `6aaaeba`; its 16 production checks passed. Dispatch Map composes actual free ReUI controls around MapLibre GL 6.16.0, with an independently authored fleet model and vehicle artwork. Its 18 production checks passed after fixing native focus restoration and the detail-tab viewport. The merged six-block candidate also passes the original strict main build, 91 tooling/model tests, the fixed 669/79 catalog snapshot, real source UI checks, six actual export builds and 15 original exported-runtime checks.

## Required sequence

1. Locate the actual official free ReUI components and examples, and inspect existing project implementations before building a leaf. Record unavailable domain/engine capabilities and the concrete reason for custom code.
2. Compare the same public entry, viewport1440/390, theme, DPR and interaction state. Record the three largest actual layout/font/portal differences first. Keep loading, empty, error, disabled, expanded, hover and keyboard/focus states in the plan.
3. Implement independent leaves with readable source, local original Bricklane artwork or clearly licensed alternatives. Keep required free-source MIT, font OFL and media attribution in both the site and exported projects.
4. Add explicit catalog IDs and the new `solutions/map` category only when their actual implementations and source routes are ready. Add precise `src/lib/source-targets.ts` defaults and supporting file closure together. Do not expose a generic placeholder as a completed block.
5. Verify real state changes and desktop/phone rendering, then source view/copy/single-file/project download byte equivalence, correct asset/dependency/license closure and a representative actual-project strict build. Keep distinct Example payload checks when a shared source graph justifies avoiding repeated cold compilation.
6. Root alone serially stages scoped frozen changes, runs required format/lint/checks, commits and pushes. Check CI and Pages independently; a push or catalog count is not a fidelity/deployment claim.

## Scope and coordination

The five Advanced implementations and two Solutions implementations were developed in parallel using separate leaves. Shared DataGrid adapters, Tabs, Sidebar, global CSS and export collectors retain assigned writers. Root integrated the catalog and source hooks narrowly, installed MapLibre normally against the current dependency baseline and coordinated all Git writes. Subsequent visual refinements keep their own evidence and frozen deltas. The completed native-layout milestone for Advanced 10, 11, 13 and 22 replaces consumer approximations with free FrameFooter, InputGroup and ButtonGroup compositions; [its release record](grid-native-layout-refinement-release.json) preserves the 45 production checks, five actual export builds, ten exported-runtime checks and remaining same-state visual differences.

The subsequent [HR period-selector record](grid-hr-native-select-release.json) documents replacement of the period DropdownMenu approximation with the actual free Select. The grouped header now measures 28 + 32px, with pointer/keyboard month changes and YTD sums verified on desktop and phone. The record keeps the remaining 1px trigger-position difference explicit. Freight & Cargo Services retains its separate footer/legend refinement task.

Catalog coverage is 669 blocks in 79 categories, alongside the 18 audited template IDs. Existing blocks retain their unresolved fidelity ledgers; matching counts does not certify every visual state. Remaining differences in the new grid leaves, including phone summary dots, pagination spacing and some chart/text colors, continue as separate refinements.

Evidence snapshots remain outside the repository: the Blocks diff/canonical/fetch receipts and the separate Templates18 canonical receipt. Raw reference HTML, paid screenshots and extracted original artwork are not distributed.
