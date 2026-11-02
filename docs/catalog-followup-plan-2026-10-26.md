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

## Drive native settings and pricing — 2026-10-27

The [Drive integration receipt](drive-settings-free-integration-release.json) records the
Filespace/Filebox settings, member, Billing and Pricing milestone. Existing actual free ReUI
Frame, DataGrid, PhoneInput, AlertAction, Combobox19 Avatar/Chip and Checkbox9 Field-card
compositions now replace the corresponding consumer approximations. The only shared avatar
adapter extension supplies optional label contents while retaining default behavior. Nine
phone-support packages have complete MIT notices; no existing locked dependency changes.

The exact v5 strict build,47 original interaction cases, natural five-page1440/390 comparison,
700px Team boundary and additional native label/keyboard/Chip/focus checks passed. Visual
acceptance retains explicit2px description,1px checkbox and5px native pagination differences.
It is not a pixel-perfect claim. The original Source2 only covered a selected layout file;
actual defaultDrive.tsx plus13 supporting choices per template receive separate28-module
view/Copy/single-file/real-ZIP byte checks.

Each downloaded project has220 members,1101 checked local-import targets, complete licensing
and original generated theme/scaffolds. Root independently verifies211 raw sources, eight
explicit generated scaffolds and one original BricklaneSVG's complete XML tree; only that
named inline-SVG formatting difference is accepted. Both unmodified actual strict builds and
four desktop/phone exported-runtime contexts pass. Dependency trees are matched physical
copies of normally installed842 packages, not claimed as fresh installs. Actual exports have
no conditional Excalidraw postinstall and no script is suppressed.

Three test URL fixtures now use the existing Playwright baseURL rather than private6350 or
mandatory PREVIEW_URL; business/geometry/waits/timeout assertions remain. The independent
Linux Pricing desktop/phone gate passed once in4.751s with1worker/0retries and original30s
timeout (run40380933471). Root coordinates the scoped normal-hook release. Full main CI and
Pages remain separate publication gates. Header Help/Notifications and future Flux Profile
slots are independent planned follow-ups; current frozen source/download evidence is preserved.

## CI readiness recovery — 2026-10-28

The [recovery receipt](ci-readiness-recovery-2026-10-28.json) records the original
358cbfb run:1681 passed, four failed, Pages skipped. The failure traces distinguish
native closing/focus transitions from incorrect menu results. Drive and Factory
fixtures now wait for their real native focus boundaries before the original keyboard
actions. The Carousel drag starts on the visible third card so the existing gesture
crosses its snap midpoint. All original result assertions and timeouts remain.

Both block-source Suspense fallbacks now reuse the existing Skeleton with visible
loading status. The Dispatch source helper waits for the actual named source region
before checking its implementation leaf. Two deliberately gated module requests verify
loading, real source, closing and restored focus at desktop and phone widths. Existing
Copy, single-file and actual-ZIP checks retain exact source-byte assertions.

A separate clean five-path recovery candidate passed the strict build, full formatting,
lint and tooling checks, then13 targeted browser cases once with one worker, zero
retries and the original30-second budget. Templates overflow checks passed at1440/390;
a fresh native Edge check also confirmed the currently deployed phone tab container
has equal40px client/scroll heights and Home/End preserves pageY while revealing the
selected tab horizontally. This last observation belongs to the existing9c deployment.

Root publishes this recovery before unrelated UI follow-ups. Complete three-worker CI
and an actual successful Pages deployment remain required before the newer Mesh,
Flux, Prospect and Drive milestones are described as live.

## Profile and Pricing free-component follow-up — 2026-10-28

The [follow-up receipt](profile-pricing-free-followup-2026-10-28.json) records two
small composition corrections. Flux supplies icon labels through the existing native
avatar upload slots and adds the actual free Tooltip to the existing Public Details
title slot. Omitted slots retain the default dialog behavior. Pricing4/5 preserve the
real free success Badge background color by using background-image for their Pro
gradients; gradient values, shadows and layout remain.

Original Profile2 and controlled-settings2 regressions passed. New native Info/ARIA,
two-step Escape, real file chooser, original local avatar preview and Remove checks
passed on desktop and phone. The phone fixture waits for a real scrollend after its
Username click, because passive event evidence established that the pending trusted
ancestor scroll otherwise closes the native Tooltip. The component and SDK remain.
Both meaningful native cases are retained as permanent regressions.

Flux source viewing, Copy, single files and the actual305-member project match the
changed files. Its unmodified downloaded entry passed a normal postinstall, strict
build,1123 local and582 bare import checks, then desktop/phone runtime cases. The
normal postinstall generated246 additional assets; the original305 members remained
exact. Matching dependency trees were physical copies of normally installed packages.
Pricing passed four computed-style/artwork/containment cases and two actual CSS
view/Copy/file/ZIP cases. Successful computed body attachments were not persisted by
the list reporter; the passing assertions and eight reviewed PNGs are the evidence.

These local gates do not establish a deployment. The current healthy recovery CI
continues unchanged; this follow-up queues a separate complete CI and Pages gate.
Remaining official phone-popup, hover and independent SVG bounds are explicit limits.

## Source readiness observation follow-up — 2026-10-28

The [follow-up receipt](ci-source-readiness-followup-2026-10-28.json) preserves the
original b15 full CI:1686 passed, one new phone source-loading test exhausted its
30-second total budget, and Pages was skipped. Its trace shows all loading, source,
Close and hidden assertions passed; final focus observation started after28.037s.
It provides no resolved unfocused element and does not establish a product focus bug.

Only the new desktop/phone cases now await independent read-only assertions together
within two already established lifecycle phases. All28 matcher expressions and their
parameters are independently AST-identical; the original four cases are byte-exact.
Module release, native region readiness, Close, hidden and focus remain sequential.
The original30s/5s budgets, real module gate and complete source-byte checks remain.

A clean953 candidate passed a normal postinstall, strict build, full format check and
lint, then all six original source/export and new loading cases once with one worker
and zero retries. This local result does not establish the next complete CI or Pages.

## Public catalog drift — 2026-10-28

A fresh read of all79 public category lists found672 unique block URLs, against669
local entries. Four additions are now planned: [API Request Logs](https://reui.io/blocks/data-grid/base/data-grid-base-9),
[Strategy Scorecard](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-14),
[Retail P&L Outlook](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-15), and
[Store KPI Board](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-16).
Each direct detail returned an entry-specific title and canonical URL. Implement them
from actual free ReUI DataGrid, Filters, Chart and native editing/dialog capabilities
after a separate reference and interaction audit; these new entries are not implemented
or added to the local count by this documentation update.

The existing solution-dev-ops-7 is no longer listed. Its direct URL returns a generic
Blocks title without an entry canonical, so its withdrawal, rename or fallback status
remains unknown; retain the existing implementation pending clarification from public
evidence. Category sets and all18 template reference URLs still match. Current Advanced
IDs are1–16 and22; the unobserved17–21 are not inferred as additional entries.

## Native fixture preconditions — 2026-10-28

The [native-readiness receipt](ci-native-preconditions-followup-2026-10-28.json)
preserves the953 complete run:1687 passed, two failed, Pages skipped. All original
recovery cases and both pending-source cases passed in that run. The remaining
failures were different native prerequisites, identified from the original traces.

Flow's Detail helper closed, but its diagonal exit crossed Category and opened that
separate helper. A horizontal waypoint now avoids unrelated help controls before
the original final pointer move and unchanged zero-tooltip assertion. In the phone
Profile trace, Username was already visible and the unique viewport remained at0;
there was no scroll to end. The fixture now distinguishes no movement from a real
scroll. Real movement still requires trusted native scrollend at the current final
position; all subsequent keyboard, ARIA, Escape and avatar assertions remain.

The clean db candidate has1059 runtime/build inputs byte-identical to the prior
strict build and reuses its immutable654 assets. Normal postinstall, full formatting
and lint passed, then the five affected hover/phone cases passed once in9.534s, with
one worker, zero retries and the original budgets. The local phone actually scrolled
0→174 with one trusted native end, preserving the moving branch. The new no-movement
Linux branch awaits complete CI; the original Linux trace establishes that condition.
No product, SDK, font, workflow or timeout changed. Commit/push and successful Pages
deployment remain distinct gates; the currently running parent CI is not canceled.

## Drive Header, Flow Path and AppShell18 — 2026-10-28

The [scoped release receipt](drive-flow-appshell-followup-2026-10-28.json) records
three completed local implementation gates. Drive now uses the actual free Item,
Sheet, DropdownMenu and ButtonGroup composition for help and notifications. Real
file-ID links preserve settings origins, unavailable records and preview focus
through close and browser history. Both templates expose their actual Drive source
and eleven support files consistently through view, Copy and download.

Fresh final Source2 passed for both templates. Their actual226-member downloads
retained every original byte, passed the received strict build, then passed the
matching Filespace6 and Filebox4 native cases. Filebox keeps its real demo sign-in
lifecycle. Dependency trees were physical copies of matching normally installed
packages; these gates do not claim fresh installs.

Flow's Path editor replaces its raw field and obsolete help fallback with the
actual free Field/Input/Tooltip composition. Save, draft cancellation, run clearing
and Undo remain with the graph domain. Both changed sources passed real viewing,
clipboard and download checks; the actual412-member project passed normal
postinstall, strict compilation and three native business cases.

AppShell18 reuses the existing AccountMenu frame and native radio menu. The existing
shared theme store follows Dark, Light and System while menus and phone navigation
are closed. The source collector now includes its two real shared theme modules.
The actual project passed strict compilation, complete declared dependency closure
and five theme/export cases, including exact separately downloaded theme CSS.

The receipt preserves initial fixture failures and their necessary corrections as
separate runs. It documents remaining reference typography, artwork, prose and
transition limits. This milestone does not claim complete CI or Pages success;
commit, push and actual preview deployment are checked separately. The four new
official DataGrid additions remain separate reference and implementation work.

## API Request Logs and additional theme colors — 2026-10-28

Base9 now has an independent API Request Logs implementation built from the actual
free ReUI DataGrid, Filters, Cascader, Frame, CodeBlock and chart primitives. Its
real source target and six implementation files drive preview, Copy, single-file
download and the runnable project download. The catalog increases from669 to670
only for this implemented entry. Strategy Scorecard, Retail P&L Outlook and Store
KPI Board remain separately tracked; unobserved Advanced17–21 are not inferred.

The shared theme generator adds the six observed Fuchsia, Green, Lime, Purple, Sky
and Yellow choices. Existing theme storage, menus and controls remain in use. New
Green survives v2 storage while legacy v1 Green retains its Emerald migration.
Lime and Yellow use their actual deep foreground colors, including Limelight CTA;
dark Limelight follows the same preset value. The previous12 presets produce
byte-identical CSS across468 existing combinations.

The [release receipt](api-request-logs-theme-colors-2026-10-28.json) records clean
strict compilation, real source/export checks, original fixture failures and the
necessary native readiness corrections separately. Original local demo data and
local replay replace external requests; no paid artwork or original brand marks
are distributed. Main CI, push and actual Pages deployment remain distinct gates.

The preceding Drive/Flow/AppShell milestone is confirmed live: full CI40665812192
passed1707 cases and Pages deployment7382503795 succeeded for a25cfdc. Root also
verified the actual mobile Help link and exact source bytes in the live browser;
see the [deployment recovery receipt](ci-pages-recovery-2026-10-28.json).

## Strategy Scorecard and Atlas account settings — 2026-10-28

Strategy Scorecard is now implemented through the actual free DataGrid, native
editing, Filters, column visibility, NumberField and chart components. Original
local KPI data and weighted domain rules support editable values, real invalid
paste rejection, Undo, hierarchy, market/month details and KPI CRUD. The actual
free column-visibility menu gains only an optional children slot; its existing
provider, column mapping and default behavior remain. The public-style rail uses
the original cell composition, with a consumer stacking fix for native pinned TDs.

Atlas replaces its reachable generic three-input Settings page with distinct
Profile, Security and Preferences compositions. Actual SettingsRow/SettingsFields,
free Frame/Field/AvatarUpload, Breadcrumb and the existing Sidebar engine supply
the UI. Saved identity, native tab links, Back/Forward, validation, avatar cancel,
color preference and Sidebar side are connected to the existing template state.
The sidebar's right-side rail and caption face inward; no overflow is clipped.

Both independently checked surfaces are integrated into one clean candidate.
View/Copy/single-file and actual project exports use the real implementation files.
The [Strategy audit](strategy-scorecard-integration-2026-10-28.md),
[Atlas audit](atlas-account-settings-integration-2026-10-28.md) and
[joint release receipt](strategy-atlas-release-2026-10-28.json) preserve exact local
gates, original failures, reference limits and the remaining native editor audit.
Their local checks do not imply complete CI or deployment.

The local catalog increases670→671 for the actual Strategy entry. It retains all79
categories and the unlisted legacy DevOps7 implementation. Retail P&L Outlook and
Store KPI Board remain separate pending additions; Advanced17–21 are not inferred.
The full [checklist](CATALOG.md) is refreshed from the actual local catalog.

The preceding4728958 milestone is confirmed deployed: original full CI1741passed
in32.4m, Pages deployment7385256413 succeeded at2026-10-28T12:25:37Z. Root separately
verified the live module, catalog670, new Green synchronization, exact32806-byte
Base9 source and real request details. Future Template settings work remains private.

### 2026-10-28 Strategy14 + Atlas 最终本地门槛

共享实际免费 DataGrid 的早期图表动画误取消编辑问题已完成结构/锚点判断修正。原 strict、必要 native4、实际网站 Source2、两个原始收到项目的独立构建均通过；Atlas原入口8项、Strategy原入口13项首次全绿。首次失败与未覆盖取消路径保留在本批审计，手机0.75px残差不伪报通过。当前可达目录671条/79类/7组及18模板；Advanced15/16仍是单独私有待整合项。发布应遵循正常hooks commit→push→全CI→真实Pages成功，分别记录。

## Retail15, Store16 and template actions — local milestone, 2026-11-02

The candidate catalog contains 673 local blocks across 79 categories and 7 groups,
plus 18 template workspaces. Retail P&L Outlook (`data-grid-advanced-15`) and Store
KPI Board (`data-grid-advanced-16`) have dedicated runtime leaves, actual source
routes and runnable project exports. The dated 2026-10-28 reference audit recorded
672 official IDs; the extra local entry is the retained legacy DevOps7. This is
not a fresh official-catalog audit, a pixel-identical completion claim or proof of
live deployment. Advanced17–21 remain uninferred.

### Actual free-component reuse and corrected duplication

Retail15 composes the installed free ReUI DataGrid provider/table/scroll area and
cell-selection behavior, Filters/FiltersQuery, Frame, Badge and IconTile. Its
native header/footer uses the existing ButtonGroup, InputGroup and Kbd support
components; the slash shortcut respects editable fields and open native portals.
The P&L cell chart uses ChartContainer and Recharts, rather than a separate chart
engine. This replaces consumer padding and header/footer approximations while
retaining the real table selection and editing behavior.

Store16 uses the same actual DataGrid, Frame, Filters/FiltersQuery and native
column-visibility controls. Its monthly matrix and signed gap adapt free ReUI
`c-chart-4` dotted-bar and `c-chart-12` horizontal-bar compositions: ChartContainer
and Recharts own real scales and mark positions. Return history uses native
ComposedChart, Bar and Scatter. Existing Slider and Progress are the shadcn support
primitives used with these free compositions, not new ReUI APIs. The implementation
replaces manual positive-width progress bars, standalone SVG matrix/gap plots and
CSS-positioned return ticks. Native chart wrappers now supply their actual width
and height; container presence alone is not accepted as a rendered chart.

Surge/Manifest finance and provider forms reuse the existing official free
`c-dialog-3`/`c-dialog-6` DialogSurface composition, real Field/Select controls,
Frame and Badge. Plan selection/save/reset, cancellation reason and confirmation,
resume, stored method/contact validation and provider add/connect/disconnect now
change local state instead of stopping at action notifications. Cancel/resume
captures the intent at dialog opening so its closing footer cannot turn into the
opposite action during the exit animation. `SettingsRow` and `SettingsFields` are
existing project compositions around actual fields, not official free components
with invented names.

Verve member actions, CSV import, plan/seat management and calendar connection
reuse actual free DataGrid, Frame, NumberField, Alert/Badge, native Sheet and
AlertDialog, and the existing free useFileUpload hook. The importer previews the
actual parsed rows before validating and committing the batch. Profile UI retains
the existing actual avatar-upload and phone-input implementation and attribution.
Member actions replace action-only notifications with view/edit/delete state;
invite usernames receive a validated unique suffix when domains share a local part.

### Deliberate domain extensions

Free UI primitives do not define the retailer's P&L forecast/accounting rules,
store KPI aggregation, CSV grammar or membership/plan policies. Those remain
independent local TypeScript models. Quantized matrix dots, return tick shapes,
null/zero handling and a signed plotted-gap cap are explicit demo display rules
on native Recharts scales; raw data and labels retain their original meaning.
The short-country five-row floor is an explicit Bricklane policy inferred from
one observed reference state, not a universal vendor rule. The shared optional
DataGrid `rowAfter` composition supplies blank presentation rows without changing
record identities, counts, exports or the virtual/DnD paths. Member uniqueness,
last-admin protection, atomic CSV validation, plan seat rules, payment-provider
fixtures and calendar drafts likewise require domain state absent from a generic
component library. No payment gateway, calendar OAuth, email delivery or server
session is supplied by these demos.

### Current local evidence and retained failures

The first restored site's original 91-case run passed 90 and failed 1: Store's
matrix had zero rendered SVGs because the recovery missed a later successful
chart-wrapper CSS migration. The initial intermediate-stage two-file identity
claim was withdrawn. A fresh V2 candidate restores the historical final CSS and
its explanatory board comment; exactly those two source files differ and the
other 1139 sources remain byte-identical. The new original strict site build
passed. All six affected Store cases then passed once with the original rendered
SVG/mark checks, 30-second tests and 5-second assertions. This is an affected-six
result, not a relabelled fresh all-91 pass.

The same V2 site passed 99 source/download cases: 91 per-file template flows plus
four whole-template ZIP cases, and two source/export cases for each new block.
They use real native selection, full rendered bytes, actual clipboard and actual
received single files/ZIPs. Block export configuration now includes
`allowImportingTsExtensions: true` and `noEmit: true` while retaining strict
checking and the original `tsc --noEmit && vite build` script.

Each actual received Retail15/Store16 project contains 329 original members. Both
unmodified downloaded projects passed their original strict build and all six
representative native cases. Original ZIP bytes, member bytes, Example, config
and built outputs remained intact after validation. Runtime dependencies were
physical copies of a normally installed matching tree, not fresh npm installs.
The Store standalone tests adapt only the actual exported homepage/title; they
do not replace the received entry or weaken the source assertions. Each Block
export retains its actual six development dependencies, distinct from Template
exports' full development dependency set. Required MIT/OFL and third-party
notices and local original Bricklane media stay in the received projects.

The four actual Template ZIPs were then checked independently: all four original
strict builds passed; Surge17, Manifest14, Miro6 and Verve25 native cases passed
once, 62 in total. Source/clipboard/archive checks and these original-project
runs remain separate results. Every original ZIP, member, entry/config and
rebuilt dist remained unchanged. The original template entries do not contain
the site's customizer, so the four site-customizer-font cases remain site-only.
No received project was repaired for acceptance.

The private validator first rejected six existing licensed Unsplash substitute
portraits under an over-narrow media assumption, then misread inline SVG
`url(%23n)` payload as a package. Both failed attempts remain preserved. The
corrected validator checks only the six exact attributed portrait filenames and
consumes quoted CSS data URLs as whole values while continuing to reject actual
missing references. All four actual projects passed these corrected checks.

The clean release identifies 1953 browser cases in207 files, excluding private
received-entry variants and unrelated shared WIP. This record is created before
normal-hook commit/push. Exact-head full CI and actual Pages deployment require
separate verification; this paragraph does not claim they are already successful.
See [current acceptance record](catalog-actions-673-release-2026-11-02.json).
