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

The subsequent [HR period-selector record](grid-hr-native-select-release.json) documents replacement of the period DropdownMenu approximation with the actual free Select. The grouped header now measures 28 + 32px, with pointer/keyboard month changes and YTD sums verified on desktop and phone. The record keeps the remaining 1px trigger-position difference explicit. The subsequent [Freight footer and legend record](grid-freight-native-footer-release.json) replaces the manual button strip with the actual free multiple ToggleGroup, preserves the mobile Select and native OR filtering, and extends the existing scrollbar state for natural footer sizing. Original five business checks and the corrected new case pass; final source/download equivalence, actual exported build and desktop/phone checks are closed.

Catalog coverage is 669 blocks in 79 categories, alongside the 18 audited template IDs. Existing blocks retain their unresolved fidelity ledgers; matching counts does not certify every visual state. Remaining differences in the new grid leaves, including phone summary dots, pagination spacing and some chart/text colors, continue as separate refinements.

Evidence snapshots remain outside the repository: the Blocks diff/canonical/fetch receipts and the separate Templates18 canonical receipt. Raw reference HTML, paid screenshots and extracted original artwork are not distributed.

The [669-entry deployment receipt](ci-pages-669-native-controls-release.json) records successful full CI (1617 checks) and Pages deployment for commit `9d3a47c`, followed by live catalog, Map preview, pause control and actual source-default verification. Later milestones require their own CI and Pages result before they are described as live.

## Mesh and Flux native integration — local verification, 2026-10-27

The private release candidate uses the published `9c80801` baseline plus34 frozen implementation,
regression and audit files. This is a native engine/component migration; it adds no catalog IDs,
packages or export-engine changes. The [integration receipt](mesh-flux-native-integration-release.json)
keeps the exact payload proof, actual free-component reuse and remaining gates separate from
publication. This is the precommit local verification scope; the release commit, full Linux CI and Pages outcome are tracked separately by Root.

Mesh now composes the existing Whiteboard/Excalidraw and RichEditor/Tiptap engines, with actual
free ReUI NumberField, ColorPicker, Scrollspy, Frame and Sidebar implementations. It removes
the duplicated SVG gesture/history surface and reuses the real free `c-message-7` assistant
composition. ResizeObserver supplies the missing domain rule for actual workspace width and
AI/pane coexistence; native Sheet, selection/history and SDK actions remain authoritative.
Flux Settings composes the actual SystemMonitor and the complete existing native profile form,
including the free field, Select, Tabs, file-upload and ReUI Badge/IconTile primitives. Its latest
consumer-only Field gap and native Select border corrections preserve default callers and
focus/invalid styling. Original Bricklane artwork and required MIT/OFL/SDK attribution remain.

The final-v2 strict main completed with exit0 in21.87s and654 immutable dist files. The previously
verified Mesh responsive3 are carried only because all32 unaffected files, including Mesh, are
byte-identical; their original8.3s pass is not relabelled as a new run. Exact-final Profile2 passed
once in7.697s with native focus/invalid and four-state settled visual acceptance. The remaining
Info/Tooltip, upload-icon and native-component differences stay explicit in the receipt.

New same-build Source2 passed naturally. Both actual projects contain305 members:297 source
files match candidate bytes, and8 generated scaffolds have separate AST/content checks. The
projects share302 byte-identical members; only Example, package name and README are project
specific. Root independently checked1126 local-import edges per project with none missing,
current consumer CSS and licensing closure. The first checker assumed the wrong Example path;
only that read-only expectation was corrected, and its failure remains recorded.

The unmodified downloaded strict builds passed once:Mesh8.77s andFlux8.55s. Each ran its normal
postinstall and retained all305 original archive files. Matching dependency trees were physical copies of a
previously normally installed709-package tree with verified package/lock graphs, not fresh
installs. Both actual builds have475-file immutable outputs. Representative actual Mesh3 passed
once in6.1s, retaining all original assertions and adding real phone Rectangle/Undo/Redo history;
only four entry-navigation literals target the exported homepage. Actual Flux Profile2 passed
once in7.045s with original form/save/focus/phone-overflow assertions. The original305 archive
members, original Examples and joint654/Mesh475/Flux475 immutable files remain exact after
runtime. A postvalidation audit-document update is outside the source/ZIP closure and changes
no product source. The local scope is ready for Root's serial normal-hook release; the resulting
commit's complete Linux CI and Pages must still be verified independently.

Preserve the original Mesh React185 defect and its native transaction-loop correction, the
corrected17e original36/2 gate and two fixture-only follow-ups, the Flux original14/5 gate,
and the later joint7/1 real mobile native-Undo defect. Earlier affected5/Profile2 interaction
passes did not certify the subsequently measured visual state. Do not overwrite those failures
or reuse62650 source packages as if they contain the final CSS. Remaining real structure gaps
are the upload action-icon slot and Public Details Info/Tooltip slot, including the8.75px phone
residual. No artificial spacer/control or claim of pixel-perfect reproduction is introduced.

## Prospect Grid22 mobile controls and CI mirrors — scoped follow-up, 2026-10-27

The [mobile controls release record](grid-prospect-mobile-controls-release.json) isolates five
consumer hunks in the actual Prospect Database leaf. The existing free Button icon-size API now
supplies four 32px phone controls; responsive classes restore the measured desktop boxes, and
the existing free CascaderTrigger continues rendering the real Button with its combobox role.
The phone header gap is 6px. Data, reducers, event handlers, native focus, imports, source targets,
shared components, dependencies and licensing remain unchanged. This corrects the previous
hidden-label/default-padding approximation; it adds no bespoke interaction engine or artwork.

The exact f755 owner candidate passed one original strict main build in 21.868s and five original
business/focus cases once. Owner 1440/390 geometry and keyboard observations retain the known
desktop widths and earlier phone toolbar-placement differences. These checks do not certify all
visual states. The same immutable 654-file production output supplied source view, actual Copy,
single-file download and the real 304-member ZIP; source phase and later clipboard grant are
recorded separately. Raw supporting sources, two licenses and generated theme are exact, with
2357 module references plus five CSS references and no missing local edges. Root explicitly waived
duplicate exported-project install/strict/runtime for this class-only scope; none is claimed as a
new pass. The prior baseline or static closure is not relabelled as fresh execution.

A separate workflow-only infrastructure adjustment conditionally writes the existing ephemeral
Ubuntu runner mirror list with the official HTTPS archive at priority1 and security at priority2,
before the original Playwright `--with-deps` command. It preserves the Ubuntu source/signing
configuration, full test command, workers/timeouts/retries and serial Pages queue. Root's actual
f755 observation shows slow Azure apt fallback, not a completed suite result. Local verification
covers YAML, Bash syntax and exact TAB/LF output; real Linux effectiveness remains pending.

The previous 9c baseline completed all1620 CI checks in24.8m and deployed successfully. Root
also verified live Freight native margin filtering (873 deep-loss loads, 1376 after adding Thin)
and the actual source default leaf. Those are distinct 9c evidence. At this precommit handoff,
f755's format/tooling/lint/build were green but its browser installation and complete CI/Pages
were pending. Root coordinates normal-hook commit/push for this narrow four-path release and
checks that resulting commit's Linux CI and Pages separately; push alone is not deployment.

## Flux Workspace Linux reference correction — 2026-10-27

The original `1e578ed` full CI completed 1650 passing checks and one failed phone Workspace
Frame assertion; Pages was skipped. The independent Linux diagnostic run40373334023 then
opened the actual public Workspace URL and the local build with identical 390×844 viewports.
Both initial and naturally settled samples have the same four Frame rectangles and title line
counts. Actual CDP glyph fonts are custom Inter-Regular, and the public/local Inter WOFF2
bytes share the same SHA256. This rules out a late-font change in those observations. The
original Mac reference has different natural wrapping on this platform.

The [reference correction receipt](flux-workspace-linux-reference-release.json) preserves the
original failure, both diagnostic attempts and their raw artifact hashes. The test adds explicit
Linux phone constants transcribed from the independently measured public page; the existing
Mac values, desktop and other-view references, business assertions, waits and precision remain.
Product source, free ReUI component implementations, source targets, exports and media are
unchanged. A known 4px action-control width difference remains documented separately.

The original Workspace desktop/phone cases passed once on Linux in7.127s, with1worker,0retries
and the original30s timeout (run40374879935). The earlier anchored CLI selector found0tests;
that discovery failure is preserved separately and is not a browser-test result.
Root alone coordinates the normal-hook scoped commit and push; the new complete three-worker
CI and Pages must succeed before the Mesh, Flux and Prospect follow-ups are described as live.
