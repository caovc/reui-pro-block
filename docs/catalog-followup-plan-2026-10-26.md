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

## Public catalog refresh and fidelity candidate — 2026-11-02

### Complete public metadata comparison

The new public audit supersedes the earlier 2026-10-28 reference snapshot for
current metadata only. Between 11:57:06 and 11:59:11 Asia/Shanghai on 2026-11-02,
83 public text responses returned HTTP 200. The sitemap and full public metadata
each list 672 unique block IDs. All 79 public category Markdown pages produce the
same complete 672-ID set, and each page's declared count matches its parsed IDs.
The category sets also match the public blocks page and sitemap. No paid source,
paid screenshots or original preview assets were accessed for this comparison.

The local catalog contains every official ID, with all 672 short display titles
and group/category assignments matching. Its 673 entries span 79 categories and
7 groups, alongside 18 templates. The only extra local entry is retained legacy
`solution-dev-ops-7` (Deploy Board); the audit does not establish its removal date
or the availability of its old individual URL. The [public audit summary](public-catalog-audit-2026-11-02.md)
and [response evidence](public-catalog-audit-2026-11-02.json) provide exact URLs,
fetch times, SHA-256 values and set comparisons. Raw responses remain outside the
repository. Metadata agreement is not evidence that all local previews have
matching pixels, interactions or server features.

### Actual free-component fidelity corrections

The shared Tabs component now forwards its existing orientation prop directly to
the native Radix Root. Native orientation and keyboard behavior remain with that
primitive. Advanced 3 and Advanced 4 reuse the actual free ReUI `c-tabs-7`
composition with Badge. Their business models, filters, sorting, pagination,
exports and actions remain intact. Advanced 1 retains its original layout and
does not acquire tabs. Retail 15 and Store 16 retain their existing independent
imports and routes. The existing source collector already includes the changed
implementation files, so no new source-target mapping is required.

App Shell 2 reuses the existing compact SearchForm; App Shell 18 reuses Progress.
Mesh distinguishes document refresh from canvas state, and Pricing uses the
actual ReUI Badge composition. These are real free-component compositions and
existing support primitives, not newly named ReUI APIs. Original Bricklane
branding and substitute preview media, MIT notices and font OFL records remain
in the source and exports. Domain-specific state and demo policies remain custom
because UI primitives do not supply those application rules. Rich-text foundation
work is outside this candidate and has not been built or delivered here.

### Scoped evidence and preserved first failures

The original Tabs orientation check failed once. After forwarding the native
orientation prop, all 3 necessary cases passed: Miro vertical tabs on desktop and
phone, and the horizontal navbar case. The original failure remains a separate
record. The affected site suite passed all 64 cases.

Preparation review found that the archive-based environment omitted the normal
postinstall asset copy. The initial 64-case site run had passed. A normal
postinstall supplied those assets without changing any of the 1,141 source files.
The resulting original strict build passed, and the combined Mesh checks passed
all 14 cases. This environment repair is not counted as a product-source change.
The source/export suite passed 14 cases and the Pricing suite passed 2 cases,
using real source selection, rendered bytes, clipboard and downloaded content.

Seven actual downloaded projects each passed their original strict build; their
native suites passed 27 cases in total. The received entries, configuration and
member bytes were preserved rather than repaired for acceptance. App Shell 18's
standalone case uses its actual exported theme and counts as 1 case; Emerald
light/dark customizer coverage remains site-only. A separate additional Mesh font
case passed with an actual HTTP 200 font response, its recorded body SHA-256, and
real Text/loaded checks. It did not substitute a mocked font response or inject a
replacement document. These received-project results are separate from site
source-view and customizer checks.

### Original CI result and pending next release

Commit `3294dc9c9a82c9250493333ad7b0632bd02b09c8` was committed and pushed. Its
original full CI run 41383410664 finished after 40.9 minutes with 1,951 passed and
2 failed out of 1,953 cases; Pages was skipped. This failed run remains the
original result and is not overwritten by later scoped checks.

In the Store source case, all 6 individual file byte assertions succeeded before
the aggregate case exhausted its total deadline. In the other failing case, the
ZIP action's asynchronous loader mounted after the original 5-second assertion
window. These recorded causes concern test readiness and aggregate timing; they
do not turn the original failures into passes.

The Store correction preserves all original file, clipboard and ZIP assertions,
splitting the six-file serial chain into six independent flows and waiting for
real controls through ordinary user actions. The original six-file aggregate
case is no longer executed. No timeout, retry or forced interaction was added.
All 11 necessary source cases passed on the original 329 product input with
3 workers, and all 7 Store cases passed on the combined fidelity candidate with
3 workers. The new fidelity source suite also passed 14 cases with 3 workers.
Its seven freshly downloaded archives have exactly the same member names and
raw member bytes as the accepted original projects; archive timestamps may differ.
The next release SHA, exact-head full CI and actual Pages deployment are also
pending. The publishing session must record their actual outcomes before claiming this
candidate is live. The [local acceptance record](fidelity-navigation-tabs-release-2026-11-02.json)
records the scoped evidence and its limits. No full-suite or
successful-deployment result is inferred from the scoped passes above.

### Remaining fidelity queue

The rich-text foundation and Commerce notification DataGrid migration remain
separate private candidates. The editor first run recorded 31 passes and two
failures: a duplicate native link overlay and a test selecting a hidden subtitle.
Those failures remain open for their own correction and acceptance. Advanced
tracked edits, collaboration presence and the AI review workflow still need
closer implementation work. None of these queued changes is certified by this
release.

## Merchant notification DataGrid and focus correction — 2026-11-02

Surge and Manifest now compose the actual free ReUI DataGrid, DataGridScrollArea
and DataGridTable using the installed TanStack v9 API. This replaces the manual
notification table and fixed mobile widths. A stable consumer wrapper supplies
the measured 20px group spacing. Existing Sidebar child defaults and native Tabs
retain their original behavior through the corrected consumer selectors.

The first enhanced run exposed four real centering failures (9.9453125px left
offset). A consumer-only margin correction fixed alignment. The next run exposed
four focus failures after successful Checkbox updates: a changing model callback
regenerated cell component types. Stabilizing that original functional action
preserves the native element and focus; the shared free primitives are unchanged.
Both first failures remain preserved. Four necessary enhanced cases then passed
without changed deadlines or retry settings. Tables measure 324px at phone width,
20px group spacing and at most 0.0078125px Checkbox content-center error.

Initial Source 8 passed; four unchanged CSS flows are retained and final necessary
Source 6 passed for the notification/model changes and fresh original projects.
The resulting two downloaded projects each passed their original strict build;
Surge 17 and Manifest 14 native cases passed, followed by exact original-member
and dist integrity checks. Entries and configuration were not repaired. These
runs use physical clones of normally installed dependencies, not fresh installs.

The [dated acceptance record](commerce-notification-datagrid-release-2026-11-02.json)
separates site/source checks, actual original projects, original failures and
publication status. Official Surge geometry supports the comparison; Manifest
shares the tested consumer contract and has no independent official pixel-match
claim. Editor and Account improvements remain separate candidates. The new
commit, complete CI and Pages deployment are pending at this record's creation.

## Native readiness follow-up after full CI 59bb9cc — 2026-11-02

The original full run 41390836649 completed with 1,981 passed and three failed
out of 1,984 tests in 54.4 minutes. Pages was skipped. The earlier seven Store
source corrections and all fourteen new fidelity source cases passed; this run
exposed different old cases. Its decoded complete log and exact original
95,679,271-byte artifact (684 files, three traces) remain preserved.

AI Chat source verification reached its five-second default assertion before
the real lazy-loaded source picker existed. Its original 120-second budget and
three serial source flows remain; real picker open/Escape readiness now precedes
all original byte assertions. The Store short-rail case similarly asserted the
board before the lazy route was interactive. A real empty-search input click now
precedes its unchanged board and geometry assertions.

The long Store sort/rail case completed its order, market and expansion checks,
then started the final none-state assertion around 29.664 seconds of a 30-second
budget. It is split into an independent complete sorting cycle and a descending
rail/expansion scenario that naturally establishes its own state. All original
assertions remain; the old serial aggregate is no longer executed. The original
four-case file now has five cases, with unchanged 30/5-second limits.

On the unchanged 4490ce2 production source and dist, necessary Store 5 and AI Chat
Source 4 passed separately with three workers and zero retries. No combined
nine-case or complete CI success is inferred. There are no product, dependency,
source-collector or configuration changes. The [dated test-only acceptance record](ci-native-readiness-release-2026-11-02.json)
preserves the exact evidence and pending publication gates. A new commit, full CI
and actual Pages deployment still need their own confirmed outcomes.

发布前补充：已核对 `4490ce2` 的 CI `41394076588` 与 Pages deployment `7485767968` 均成功，部署于上海时间 2026-11-02 14:27:53。本次测试修正的新提交仍须独立通过 CI 后才算部署完成。

## 2026-11-02 Document editor foundation V5

This milestone actually reuses the installed free ReUI Frame and ColorPicker, with native Tiptap task/history/link integration where the free registry has no complete editor engine. Document now has the bounded scrolling page, grouped toolbar, edit/view, clear, counts and shortcuts. Supporting source targets keep editor.tsx as default. Contract/Assistant existing controls and Mesh compact behavior remain.

The first owner matrix was31pass/2fail, followed by two necessary passes after a hidden-subtitle fixture correction and the real duplicate-link-bubble fix. Combined V4 Source4 passed, but the actual unmodified Document export then passed strict build and4cases while its Undo case failed: fast typing/heading/alignment shared one native history group. V5 changes only two deliberate block-format callback boundaries using closeHistory before and after; native300ms and the original spec remain unchanged. No received project was repaired.

Final V5 combined strict build passed, as did supporting-source view/copy/single download and two fresh ZIPs (necessary Source3 under3workers). Actual Document414members and Mesh307members passed original postinstall/strict builds, then Document5 and Mesh13 native checks; real200/loaded Mesh font1 is separate. Every original archive/member, entry/package/config, dist and generated-public byte was rechecked, and owned received previews closed in finally. Original failure evidence is retained. No final combined33 or finalfullSource4 pass is inferred.

The [editor foundation record](editor-foundation-release-2026-11-02.json) lists exact evidence and remaining advanced3/4/5/Wiki/default-body gaps. Base449 complete CI and exact Pages are successful; base300 test-only run41406253214 was still running at this preflight. This new Editor commit must pass its own CI before deployment is claimed.

## 2026-11-02 AppShell1 collapsed menu

The shared Navigation abstraction now forwards the existing free SidebarNavigation optional menuClassName; only AppShell1 supplies min-w-48 to match the observed192px child menu. Other consumers keep undefined and native defaults. No shared primitive is rebuilt and existing source mapping already includes both consumers.

The first combined interaction run was6pass/2fail: both Shell cases passed (192px plus unchanged128px compatibility, Inter14/20, selection, keyboard, Escape and focus), while two first-touch Grid cases failed. Grid is excluded from this Shell-only commit. Source3 passed under3workers with actual view/copy/file for both consumers and a fresh original Shell1 ZIP. The actual Shell closure matches the final clean tree and contains no changed Grid touch module.

Final Shell-only strict build passed. The actual414-member starter passed original postinstall/strict build and the unchanged single Shell1 native case with trace observation. Every original member/entry/package/config/dist/public byte was protected, the owned received preview stopped in finally, and root viewed an unmodified open-menu trace frame. Shell2 compatibility remains site-only. See [the dated record](appshell-collapsed-menu-release-2026-11-02.json) for hashes, bounded SVG serialization and CI/Pages limits.

## 2026-11-02 CI300 Store native readiness and independent close scenarios

The complete300b437 run41406253214 finished1993pass/2fail in55.3minutes; Pages was skipped. Earlier AIchat/Store sorting/shortRail corrections passed. The complete original94,742,905-byte diagnostics artifact and decoded job log were retained; both original traces were examined.

The free-chart first count assertion ran while the route still showed its skeleton. The later recorded board had all five sliders. One natural empty Search stores click now establishes actual desktop UI readiness before the original21 matchers; phone and all budgets are unchanged. The Actions/Edit aggregate completed all its focus assertions, then reached geometry with only69.881ms left. It now consists of independent Cancel/reopen and fresh Escape/geometry scenarios, preserving all23 original statements/11 matchers; the old aggregate is no longer executed (5→6 cases). No product focus fix or unique CPU cause is claimed.

Three changed native scenarios passed together under3workers with original30s/5s/retries0. All1143 product sources and658 dist files were exact; no runtime, dependency, source mapping or ReUI free-component modification was made. The owned baseline preview was stopped. The [dated CI correction record](ci-store-native-readiness-release-2026-11-02.json) preserves precise evidence, assertion mapping and limits. New exact-commit CI and Pages remain separate gates; live449 was the last confirmed deployment.

## 2026-11-02 Base9 native touch stable target

The first touch probe stalled on an intermediate readout. A window-only passive observer initially did not see later touch events, which was insufficient to claim browser non-delivery. The continuous v2 input contract removes only per-move sampling while preserving every final range/metrics/IDs/cancel assertion; the original product still failed at Reset Zoom after the whole gesture. C2 touch-coordinate handling then passed only6of8 combined cases: first/reverse still failed, while cancel and existing native/Shell cases passed. All original evidence remains.

Direct passive listeners proved the SVG touch target detached after its initial state update; every trusted later move/end still reached that old path, while connected pointer events continued. C3 uses one scoped BarChart drawing-hit policy to keep the existing HTML wrapper as target, retaining actual free c-chart-2/StripePattern/native axis and Tooltip composition. Public Recharts coordinate/axis hooks supply actual touch origins and final points; package/lock and existing mouse/keyboard paths remain. This is product input routing, not a test-injected style or replacement chart.

C3 strict build passed, as did all four necessary site cases (touch3/mouse1) and source/copy/file plus actual ZIP2. The unmodified329-member downloaded starter passed its original strict build and seven native cases (existing3/touch3/mouse1). Original entry/package/config/assets/members/dist/public were protected and the owned preview closed in finally. Root viewed desktop and phone native screenshots. The [dated record](grid-base9-touch-release-2026-11-02.json) lists hashes, the corrected input contract, minimum-version static-only limit and untested gesture boundaries. New exact-commit full CI and Pages remain pending gates.

发布前补充：已独立核对编辑器 `129c17d` 的完整 CI `41407711199` 全部2006项通过（53.7分钟），Pages deployment `7488438633` 精确同SHA于2026-11-02 17:19:35上海时间成功。`eb7fe96` 测试修正CI仍在运行；本次图表提交的CI与部署尚待发布后单独核对。

## 2026-11-02 Merchant Account shared free components

Surge and Manifest reuse the existing project Atlas Account view/model, official free ReUI Frame/upload/PhoneInput/Timezone compositions, existing shadcn/Radix Field/Tabs and project settings rows. Existing Sidebar/native menus keep keyboard, focus and portal behavior. Commerce-specific state and routing join these controls; scoped presentation removes the square-avatar override and supplies the outlined Remove/X without changing Atlas defaults.

The first site matrix was 53 passed and 3 failed out of 56. Native traces identified BaseUI temporary transition cleanup and smooth-root-scroll tooltip dismissal. True-only transition classes and an app-scoped root-scroll rule fixed these product issues with unchanged assertions/budgets; five necessary cases passed. V2 Source14 passed. V3 strict build, Avatar4 and necessary Source4 passed; the latter includes two new Atlas file/copy/download flows and two final original ZIPs. Full Source16 discovery is not a full16 execution claim.

Both actual untouched original projects passed their strict builds. The first native run was33 passed/1 failed (Surge17, Manifest16/1); the single failure compared unequal BaseUI mount phases. A QA-only real data-open/non-starting readiness guard preserved all original timing/geometry/focus/selection assertions. Site Motion3 and the necessary original Manifest1 then passed, giving incremental coverage of34 distinct scenarios without a full34 or full17 Manifest rerun. These include the empty standalone mount, Profile upload/Save/Cancel, theme/default-view/Auth, legacy Settings/notifications, motion and navigation Tooltip. Entry/package/config/source were not repaired. Original ZIP/member/dist/public integrity and licenses were checked; owned previews closed in finally. Dependencies were physical normal-install clones. Root viewed genuine desktop/phone traces and photo-row screenshots.

The [dated Account record](commerce-account-release-2026-11-02.json) preserves counts, hashes and limits. Four preferences (dateFormat, firstDay, autoSaveDrafts, richTextEditing) still lack downstream consumption. Backend authentication, reload persistence and all-template motion are not claimed. The preceding 0b57980 full CI2017 and exact Pages7490288667 succeeded at 2026-11-02T10:57:01Z; Account requires its own post-push CI/deployment. The overall catalog/editor fidelity goal remains active.

## 2026-11-02 Account full CI source/layout follow-up

The complete9133dd1 run41439292595 finished2089 passed/4 failed out of2093 in59.5minutes. All76 new Account cases passed, but Pages was skipped. The full decoded log and exact107,873,316-byte original artifact (780members/four traces) remain preserved.

The Retail six-file aggregate finished the first five complete lifecycles and reached the final clipboard poll around29.673s, leaving only a fraction of the original30s. Recorded clipboard data matches the final panels implementation; its final download was not reached. Six independent file cases retain every original per-file assertion; the old shared30s aggregate is no longer run. The original ZIP case also required a source region before its actual download was ready. It now reuses the existing native picker/Escape readiness and real download purpose, keeping every ZIP/license/source oracle and the two region/default checks after the actual archive is saved. No exact ready instant or unique CPU explanation is claimed.

Two legacy Commerce mobile layout checks still expected Close1, while the intentional merchant header uses the existing native no-close API. Their expected count is updated only for Surge/Manifest, with positive56px/Search and absent-brand guards. Miro and all other local layout, navigation, focus, Escape and scrollbar checks remain. Official General navigation was observed to keep the drawer open; local closing behavior is retained and not claimed as identical.

All necessary9 cases passed together with3workers and zero retries against the unchanged1149-source/657-dist production build. No runtime, source mapping, dependency, helper or configuration change is included. The [dated record](ci-account-source-layout-release-2026-11-02.json) preserves exact evidence and the original failures. Complete new CI and exact Pages deployment are separate post-push gates; the last confirmed live commit remains0b57980. Wiki/Retail focus and other template migrations remain pending, and the full goal stays active.

## Wiki table controls — 2026-11-02

Implemented the dedicated four-control Wiki table toolbar using the actual free Checkbox/Field composition and existing ButtonGroup/DropdownMenu, backed by native Tiptap table commands, selection and history. Corrected initial toolbar placement and portalled menu anchor lifetime with native public APIs. Final desktop/phone necessary5 and Source2 pass; the original 415-member download passes strict build plus 11 necessary native cases without entry/config repair. Original 58 oracles remain; this is not a full old-suite rerun.

The [release evidence](editor-wiki-table-release-2026-11-02.json) records component provenance, exact source/QA hashes, preserved Account and CI corrections, reference limitations, historical compatibility scope, and remaining advanced editor/gutter work. Commit, push, full CI and Pages must be confirmed separately.

## Cohort SettingsRow reuse — 2026-11-02

Replaced duplicate Cohort row composition with the existing project SettingsRow built from Field primitives. Preserved the local model, 17 compound callers and 20 other declarations, scoped desktop/phone styles, all Wiki/Account/CI changes and implementation source defaults. Site native2 and Source3 pass; the actual 284-member download passes normal installation, original strict build and native2 with unchanged input members/dist and both preview ports closed.

This is a reuse and behavior-preservation milestone. Official Organisation inspection found fiscal-day combobox and weekday ToggleGroup with roving focus differences still requiring actual free-component migration; no full official interaction or visual identity is claimed. See [Cohort evidence](cohort-settings-row-release-2026-11-02.json). Publication and Pages remain separate gates.

## Retail Sheet focus — 2026-11-03

Retained the actual free Sheet and its native lifecycle. The two consumers now remember real View/Actions trigger elements and restore Search after actual removal. Original Months/Notes2 and new native focus2 pass incrementally; Source3 and the actual330-member original project strict/native4 pass with unchanged entry/config/members/dist/public and received preview closed. Original failure evidence remains; no old assertion or budget was weakened. [Release evidence](retail-sheet-focus-release-2026-11-03.json) records provenance, exact hashes, local-demo reference limits and pending publication gates.

## Cohort free controls — 2026-11-03

Replaced numeric day and separate weekday buttons with actual c-select-1/c-toggle-group-5 compositions using unchanged shared primitives. Native group semantics, roving focus, Space activation, save/discard and global mobile width checks pass. Day1..28 follows three actual month-end observations; existing29..31 remain visible without mutation, with static/VM coverage stated separately. Final site2/Source3 and original284-member strict/native2 pass. V2 toolbar-role failures remain; V3 corrects the consumer role with unchanged QA. [Controls evidence](cohort-controls-release-2026-11-03.json) records hashes/provenance and the separate64/66px Sidebar and mobile drawer-navigation work.

## Cohort Sidebar layout and navigation — 2026-11-03

Corrected actual collapsed sidebar/inset66→64 and preserved the official mobile drawer/focused link after content-ready navigation; Escape closes it and restores the trigger. The existing ReUI SidebarNavigation closeOnSelect API is forwarded with defaulttrue, and only Cohort primary navigation opts out. Native site10 includes one Atlas default-close regression; new shared.tsx view/copy/single-file and realZIP2 pass. The untouched284-member download passes original strict/native9, with input/config/dist/ZIP exact and both previews stopped. Old business and width/scroll assertions remain, with real keyboard navigation replacing programmatic focus. [Release evidence](cohort-sidebar-layout-release-2026-11-03.json) records the Timesheets observation correction, exact hashes and remaining settings/tab and other-template fidelity work.

## Pulse/Roster SettingsRow reuse — 2026-11-03

Removed duplicate Row markup in favour of the existing Field-based project Row, with two optional presentation classes and three consumer CSS bridges. Defaults match144 actual SSR combinations;133 direct JSX call sites were inventoried, not all browser-tested. SourceTargets append only the helper/CSS for Pulse/Roster, retaining every default. Site11/source7 and two real228-member original projects normal-install/strict/native5 pass; all original inputs/dist and protected workingCSS remain exact and all own previews stop. The source helper change is type-only real collaboration support with identical emittedJS/runtime assertions. [Release evidence](collaboration-settings-row-release-2026-11-03.json) records measured compatibility versus remaining official Label/id, seven-weekday and fine layout work; no full18-template fidelity claim.

## Pulse seven weekday options — 2026-11-03

Expanded only the existing Select option list to Monday through Sunday. At1440/390, native keyboard End/Escape, selection, save, Dashboard→Settings navigation and draft Reset pass; original name/color/geometry assertions remain. Affected native5 and source2 pass; the actual228-member original project normal-install/strict/native5 passes with entry/config/raw members/dist/public/ZIP exact and previews closed. Models, shared Select/Row/API/CSS and SourceTargets remain unchanged. [Release evidence](pulse-seven-weekdays-release-2026-11-03.json) separates this small correction from remaining semantic/typography work, Lucent Item reuse and the active full-template goal.

## Editor Link dialog CI correction — 2026-11-03

Cohort2f full CI passed2115 and failed one existing editor test because a global Remove link selector matched both native bubble and Link dialog. The test now waits for the real dialog before its existing bubble-absence assertions, clicks that dialog’s Remove action and checks closure. Every old assertion remains; no product code, budget, retry, forced focus or fixed sleep was added. The necessary single case passes on exact63a frozen runtime without a rebuild, with preview closed. [Evidence](ci-editor-link-dialog-release-2026-11-03.json) retains the original log/trace and separates this local QA correction from pending full CI/Pages.

## Lucent Security free Item composition — 2026-11-03

Replaced duplicate setting rows with actual Item/Content/Title/Description/Actions, native Frame and7real Separators across10rows. Preserved every control/model callback and Integrations; only Lucent gains the actual source module as a secondary Code option. Corrected the measured16px/15px page offset through Security heading/root utilities, with no new CSS/API/spacer. Candidate row/slot/control, Frame and Separator rectangles match stored1440/390reference; exact measurement scope and unverified header computed fields remain explicit. The first native1P2F was retained; a single real-focus assertion after Radix asynchronous End navigation made final2pass while unchanged old1 stayed incrementally covered. Source2 and actual308-member normal-install/original-postinstall/strict/native3pass, all raw/entry/config/dist474/public246/ZIP exact and previews closed. [Evidence](lucent-security-item-release-2026-11-03.json) preserves limitations, timeout five-choice follow-up and the ongoing full-template goal.

## Lucent five timeout options — 2026-11-03

Changed only the existing option literal to30minutes/1hour/4hours/24hours/Never, retaining default4hours, the same free Select/Item composition and all models/callbacks/CSS/SourceTargets. Both viewport cases preserve the old24-hour selection/navigation block and all geometry/Switch/overflow/fault assertions, add actual30minutes/Never selection and route-retained value, and wait for real native focus after Home/End. Native2/source2 and the fresh308-member normal-install/original-postinstall/strict/native2 pass with raw/entry/pkg/config/public246/dist475/ZIP exact and previews closed. [Evidence](lucent-timeout-options-release-2026-11-03.json) separates this values-only correction from real expiry, reload persistence, untested transient HMR8-hour behavior and the ongoing full-template fidelity work.

## Catalog reconciliation — 2026-11-03

The live [official template catalog](https://reui.io/templates) lists 19 entries while the local catalog has 18. The omitted Strata template was added on 2026-10-29 according to its [official detail page](https://reui.io/template/strata-observability); this is a coverage gap discovered today, not a claim that the upstream release happened today. The [Strata implementation plan](plans/2026-11-03-strata-template-plan.md) is pending implementation. Do not increase the local implemented count or add an empty preview to imply coverage.

Continue the existing detail work alongside this addition. Fresh Flux reference shows that its five Approval Policy rows are informational icon/link rows rather than switches; the earlier Field/Switch migration candidate is unadopted. Review Coverage buttons require their own observed interaction. Pulse native Label/control association needs direct for/control and click evidence before a consumer change. Neither finding authorizes a broad shared-row or protectedCSS rewrite.
