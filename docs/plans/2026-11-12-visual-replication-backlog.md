# Visual replication verification backlog · 2026-11-12

This is a representative audit of previously delivered surfaces, not a claim
that the complete block or template catalog has been visually verified. Findings
require newly captured, inspected reference and local screenshots. Original
Bricklane branding, licensed replacement artwork, disclosed local fixture data,
and unavailable backend services are intentional boundaries.

## Confirmed findings and assignments

| ID         | Priority          | Surface and observed difference                                                                                                                     | Owner / status                                                                                                            | Acceptance                                                                                                                                                                    |
| ---------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BLOCK-V01  | P2                | Job Schedule attention cards demote the risk headline and omit remaining work hours; the local hierarchy and card height differ from the reference. | `job_attention_qa`: V01 fixed; 22/22 Nova cases passed across both foundations and widths.                                | Risk is the main heading; real local remaining hours are visible; card actions still open or update the correct job at desktop and phone widths, under both UI foundations.   |
| BLOCK-V02  | P2, fixed locally | Job Schedule lacked the common direct type/state/risk filter entries.                                                                               | `chart55_mobile_fix`: original22 passed; full55 first52/55, then rebuilt5270 targeted3/3; all24 filter images reviewed.   | Real query/search/paging/count/reset behavior, original22 fixtures preserved, six creatable types, global risk counts and honest empty state; exact-SHA CI still required.    |
| BLOCK-V03  | P3, fixed locally | Job Schedule row density, date-column width and button sizing differ.                                                                               | `chart55_mobile_fix`: 5280 corrected-oracle18/18, unchanged22/22 and risk3/3; 28 new images inspected.                    | Matching48/32px outer spacing retained; rows48px, phone dates37px, native scrolling and two-foundation/eight-style toolbar coverage. Exact-SHA CI remains separate.           |
| BLOCK-V04  | P3, fixed locally | Job Schedule phone Add Job frame and columns differed.                                                                                              | `atlas_header_fix`: final5270 first-run18/18 with copy included; all22 matrix images and2 dynamic-state images reviewed.  | Both foundations, all8 phone styles plus Nova desktops; fields, internal scroll, footer, native keyboard and opener focus remain usable.                                      |
| VT-MAN-001 | P2                | Manifest phone Inventory velocity category ticks collided; the first responsive repair left too little tail-label safety space in CI.               | `manifest_axis_qa`: 5260 first-run 10/10 plus both foundations' Inter/Arial fallback probes passed; exact-SHA CI pending. | No tick collisions or clipping; final phone category remains Outerwear with at least 2px real inner clearance; all bars, accessible data and default chart behavior retained. |
| VT-ATL-001 | P2                | Atlas phone date control begins above the viewport and Export extends below its header.                                                             | `atlas_header_fix`: pushed `c96fb36`; 32 cases passed, including all eight phone-header styles.                           | Date/Export stay within the viewport and their own header; fix the local clipping without reproducing the reference's separate horizontal-overflow issue.                     |

Atlas phone Threat Vectors has a much smaller, 0.1953px Beacon/Day0 tick overlap (P3); Manifest's confirmed overlaps reach 20.1987px. The coordinated opt-in repair is verified under both foundations at 390px and 1440px. All nine Atlas categories, both series and their accessible data remain. `manifest_axis_qa` owns the shared chart change; the Atlas consumer was coordinated with `atlas_header_fix`.

`BLOCK-V05` (P2): Working Agreements phone hid the earlier 21 of 26 weeks. The reference retains all 26 weeks in an internally scrollable matrix; the local view stopped keyboard navigation at August 31. `chart55_mobile_fix` restored all weeks, the default five-week viewport and accessible historical scrolling/keyboard navigation. Candidate 5200 passed the complete four-case Nova suite across Base/Radix and desktop/phone after an initial cold-entry failure and a passing focused recheck; the failure evidence is retained. Ten fresh screenshots were inspected. Committed and pushed in `7334f6c`. See `docs/qa/2026-11-12-chart55-mobile-history-fix.md`; full style-matrix, source-export and CI deployment gates are separate.

Evidence and capture limits are recorded in the corresponding audit reports:

- `docs/qa/2026-11-12-block-visual-audit.md`
- `docs/qa/2026-11-12-template-visual-audit.md`

The Blocks audit now includes both Job Schedule and Working Agreements at desktop and phone widths, including observed overlay/focus and horizontal-scrolling behavior. It does not cover every block.
Manifest and Atlas audit coverage must be read from the template report rather
than extrapolated to their entire applications.

`BLOCK-V06` (P3): fresh two-foundation Nova phone images still lacked the
reference's four input placeholders and empty Due Date explanation. The
Create-only consumer now supplies those strings through its existing free
Input/Field composition, preserving dynamic planned-finish text and Edit/Crew
behavior. Final5270 repeated and passed all eighteen layout/keyboard cases
with the added height, and both foundations' real type/start selection updated
the dynamic planned-finish text correctly. All22 fresh matrix images and two
additional dynamic-state images were viewed; this scoped copy task is closed. See
`docs/job-schedule-create-layout-2026-11-12.md`.

## Catalog completeness follow-up

The saved public official catalog contains twenty actual template cards; the
local catalog now has nineteen after the public Strata milestone `2a933fd`.
The original two missing entries are tracked below. The other eighteen names,
categories and normalized public preview URLs previously matched individually;
official Dashboard now has seven entries versus six locally, while the other
categories match. The private
20-entry mapping is in `/tmp/template-catalog-completeness-2026-11-12/`.
These entries require public preview inspection and actual free-component
implementation, not only copied card labels:

| ID           | Priority | Official entry                                                                             | Status / acceptance                                                                                                                                                        |
| ------------ | -------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEMPLATE-C01 | P2       | [Signal — Product Analytics](https://reui.io/template/signal-analytics), TanStack Start    | Missing from local catalog and implementation; capture its public preview states before assigning an implementation.                                                       |
| TEMPLATE-C02 | P2       | [Strata — Observability Dashboard](https://reui.io/template/strata-observability), Next.js | Public implementation registered and pushed in `2a933fd`; independent route, interaction, source and style acceptance remains explicitly scoped in the integration report. |

This is an identity/presence check, not a visual or functional acceptance of the
other eighteen templates. Reference imagery remains private audit evidence.

Strata now composes thirteen observed product routes plus the observed sign-in
and sign-up destinations. Root owns the public shell/contract. The independent
modules, local workspace/account behavior and public entry are implemented;
completed rendered scopes and outstanding acceptance are recorded in
`docs/qa/2026-11-12-strata-public-integration.md`. Registration does not establish
complete visual or functional acceptance. Signal remains the only missing entry;
its confirmed preview host is still outside the currently enforced allowlist.

Job V03's first18-case attempt had2 passes and16 failures from two confirmed
new-test oracle errors: desktop fluid columns versus phone nominal widths, and
the visible-text accessor on a style element. Evidence is retained. The corrected
spec passed18/18, followed by unchanged original22/22 and risk/complex3/3 on5280;
runtime stayed frozen throughout. See
`docs/qa/2026-11-12-job-schedule-density-fix.md` for exact boundaries.

## Related release gates

- `STRATA-SET-02` (P2, fixed and locally verified): after the Radix390 Account
  Security shortcut, the selected Security tab is clipped at the right edge of
  the horizontal tablist; only its icon and initial letter remain visible.
  The same Base flow reveals the complete selected tab. The26 original cases
  passed routing/selection/sidebar assertions but did not require full selected
  tab visibility. The consumer now reveals the selected tab and fixes focus
  geometry before its color transition. Independent5461 passed all22 original
  reviewed v3 cases across both foundations/five direct and shortcut tabs/native
  keyboard paths;42 images and22 complete traces were inspected. The old red,
  real Radix list-entry diagnostic and first paint failure remain preserved.
  Scope and test-oracle evidence:
  `docs/qa/2026-11-12-strata-selected-settings-tabs.md`. Original evidence:
  `/tmp/strata-public-parent-remaining26-native-5450-20261112/native-results/public-parent-native-v3-ra-8b839-ic-mount-and-settings-query/account-security.png`.

- `COHORT-SET-01` (P2, fixed and locally verified): the true Base5422
  Working group row is362.1875px wide at x34, ending396.1875px, while its clipping
  FramePanel ends373px with overflow hidden. The original phone trace visibly
  clips Sunday. Both original Base desktop/phone behavior cases passed, but
  they never asserted containment or hit ownership for all seven days. The
  consumer now constrains and wraps the existing group. Independent5460 passed
  all16 phone cases across both foundations/eight styles and the original two
  Base flows;36 screenshots were inspected. The new old5422 red also proved
  Sunday's full box exceeded its clipping edge8.1875px while all centers hit.
  See `docs/qa/2026-11-12-cohort-working-week-containment.md` for permanent
  coverage and scope. Official visual equivalence is not established. Preserve the original
  trace and its two behavioral passes separately from this defect. Evidence:
  `/tmp/cohort-genuine-base-5422-native-20261112-200530/trace-frames/phone-working-saturday-hover.jpeg`.

- `COHORT-SET-02` (P2, fixed and locally verified): both Sera 390 foundations
  compressed status to 27.40625px; original live text Ranges overlapped Discard
  by 9.0625px (`changes`) and 10.375px (`Unsaved`). Both first-red results and
  their native behavior passes remain preserved. The existing mobile footer
  and action group now wrap. Independent 5462 passed all six unchanged new
  cases across both foundations/Sera 390+320/Nova 390;18 images and six complete
  traces were inspected. The permanent six-case extraction preserves every
  helper/test body and passed its two-case adapter, with six further images
  and two traces inspected. Those two overlap the six; they are not eight
  distinct cases. Saved success toasts remain visible over part of the lower
  disabled action area; all status-fragment centers now hit the status.
  Other section footers/styles, desktop and official exact Sera layout remain
  outside this gate. See `docs/qa/2026-11-12-cohort-settings-footer.md`.

- `STRATA-SHELL-01` (P2, fixed and locally verified): the old5421 phone
  account popup overflowed to right455px, clipping its email and Theme controls.
  The consumer now opens above its trigger on phones with8px collision padding,
  retaining desktop right placement. Candidate5422 passed the four-context
  additive Nova gate and the same four extracted permanent regressions; the
  permanent run retained full traces and all eight new images were inspected.
  A separate first-run48-case matrix passed both foundations/eight styles for
  desktop Theme, phone Workspace and phone Account; all96 images were inspected.
  Full popup/email/control bounds, actual center/icon hits, pointer Theme changes,
  native keyboard selection, Escape and opener focus passed in their stated
  flows. The overlapping Nova contexts are not additional distinct coverage;
  other Strata routes and complete-template acceptance remain separate.
  Candidate5421 red evidence is unchanged. Scope:
  `docs/qa/2026-11-12-strata-public-integration.md`; final matrix:
  `/tmp/strata-shell-style-matrix-v3-native-5422-20261112/handoff.md`.

- `STRATA-GEN-01` (P2, local functionality gap; reference behavior unverified):
  seven visible General preferences currently update only React form state:
  date format, first day of week, auto refresh, Markdown, timestamp display,
  reduced motion and tooltips. Calendar still fixes Monday/UTC; timestamp
  renderers, tooltip consumers and motion policy do not read these choices.
  Theme has a real global-theme path, and Landing page is used by the local
  auth continuation. `foundation_style_audit` owns the exact call-path audit;
  next verify the public anonymous reference's corresponding behavior and
  implement applicable frontend effects through existing free components.
  A changed selection alone must not be reported as a completed preference.
  A fresh anonymous reference probe subsequently selected Sunday, navigated
  through the real sidebar to Calendar, and returned to Settings. The reference
  still showed Monday19–Sunday25, and its selection had reset to Monday on
  return; four screenshots were inspected with no attempted write or runtime
  fault. This preference has no observed cross-page effect in that source
  flow. Treat it as an observed demo limitation rather than inventing a global
  Sunday requirement; the other six preferences remain individually unverified.

- Exact-SHA release status at22:17 UTC: current pushed main is
  `a0e1d3c7183e0d31d6c6fd8fa9eb38095b1c9769`; run `43314161973`
  has a successful build and all four browser shards still running. No deployment
  success is claimed for that SHA. The last confirmed successful Pages release
  remains `cb0dd5df45be89b0f192972522cd0939fbd8ff0e`, deployment `7746519113`
  at18:48:17Z. Earlier `c2efdbf` success remains historical; later push/build
  success does not establish a deployed preview. Public Strata was registered
  and pushed in `2a933fd`; its local scoped acceptance is recorded above.
- `STRATA-CAL-01` (P2, fixed; scoped public gate passed): the consumer now
  uses the observed07:00–20:00 time range and09:00 scroll target. Public5422
  passed all12 first-run Nova interaction cases across both foundations and
  desktop/phone widths; all24 images and12 full traces were inspected. Desktop
  scroll105/card y296 matches the reference; phone scroll116/card y325 includes
  the real36px public toolbar. The original5382 run remains8 passed/4 failed,
  including the duplicate Unpin locator errors. Bare desktop's actual68/final
  max69 and card y297 remain an unexplained separate1px follow-up; the public
  pass does not identify that cause. Seven other styles and complete Calendar
  acceptance remain separate. Scope:
  `docs/qa/2026-11-12-strata-public-integration.md`; exact geometry and old limits:
  `/tmp/strata-calendar-5422-native-20261112-bo9txfil/review-report.md`.
- `EXPORT-01` scoped fresh-package gate completed on the unchanged5390
  Radix/Nova Pulse export: native download, all258 member CRC/SHA checks,
  eight license/notice files, strict333-byte inline favicon including final LF,
  normal fresh install, original strict build and built-artifact smoke passed.
  Original archive and members were unchanged. Other libraries/styles/templates
  remain outside this result.
- `EXPORT-02` (P3, fixed; scoped native ZIP gates passed): the template
  collector now reads SVG bytes from actual raw modules. Radix/Nova Pulse5400's
  native original ZIP passed all258 members/249 repository-byte comparisons,
  closure/license checks and strict333-byte Drive SVG/favicon assertions. Its
  other257 members exactly match the prior5390 package whose fresh install,
  strict build and artifact smoke passed; those phases were not repeated on5400.
  True Base/Nova Filebox5452 separately passed its complete original native flow,
  all263 ZIP members/254 repository-byte comparisons and the actual333-byte Drive
  SVG including final LF. No standalone install/build was run for that Base ZIP.
  Historical319-byte/skip results are unchanged; the5452 pass does not validate
  the newer5453 Source picker or every foundation/style/template. Scope:
  `docs/qa/2026-11-12-template-svg-source-fidelity.md`; Base proof:
  `/tmp/filebox-base-5452-native-20261112-GFrjnt/final-handoff.md`.
- `EXPORT-02b` (P3, fixed; scoped original-package gate passed): the block
  collector now takes SVG bytes from actual raw modules, preserving the existing
  binary fallback. Candidate5430's real Radix/Nova Fleet Center/AppShell33 starter
  passed native download, all442 member CRC/SHA checks,433 repository-byte
  comparisons,21 SVGs,31 assets,24 license/notice records and strict333-byte
  inline favicon. Normal install, the unmodified strict build and the independent
  5441 built-artifact smoke passed; two smoke images were inspected. Original ZIP,
  members and built files remained unchanged. This is one block starter; Base,
  other styles/families and complete Source/Clipboard/single-file flows remain
  separate. Historical encoder-probe evidence is retained. Scope:
  `docs/qa/2026-11-12-block-svg-source-fidelity.md`; final original-package report:
  `/tmp/export02b-fresh-5430-20261112-je6v_eu0/final-original-project-handoff.md`.

- Fresh exact-SHA verification at14:00 UTC: `d127fb1` run `43218584940`
  completed build, all four browser shards and Pages successfully. Its successful
  deployment is7738573232. This closes that run's earlier chart/Lucent CI gate;
  the older failed runs below remain historical evidence. `7579c5f` run
  `43224303995` has successful build/browser1 with browsers2/3/4 still running;
  docs-only `72f69a3` run `43229592153` is pending. These later runs have not
  deployed and require fresh status checks.

- CI regression: the user supplied the sole failing test from Filebox run
  `43191814435` (665 other cases passed). `templates-source-round3.spec.ts`
  still expected the old three-file Roster order after Calendar became a
  promoted implementation. The fixture now asserts all four files while
  retaining the original Approvals DOM, real clipboard and ZIP-byte checks.
  Focused UI verification passed 1/1 in 13.4s, and all four members of its real
  original ZIP match disk bytes. See
  `docs/ci-roster-source-order-fixture-fix-2026-11-12.md`. The new exact-SHA
  Actions run and deployment still require verification. Detailed log downloads
  remain blocked by the current runtime policy; API metadata remains available.
- The subsequent exact-SHA run `43205749833` (`e8c18f3`) completed with build
  and browser shards 1/2/4 successful, shard 3 failed and deployment skipped.
  The user supplied the actual log: 686 passed and three failed. Lucent Services
  phone navigation did not unmount after Escape following Pin to top
  (`lucent-service-navigation.spec.ts:136`). Both foundations' Manifest phone
  tick bounds exceeded the existing 358px limit at 358.428558px
  (`manifest-inventory-velocity-native.spec.ts:143`). On rebuilt 5260, the
  chart fix passed all ten original cases plus four foundation/font probes;
  the Services test now proves native menu dismissal and trigger focus before
  the unchanged Escape assertion, and all four foundation/width cases passed.
  Original assertions and budgets remain; exact-SHA CI is still required.
  At 12:25 UTC, Host fix `c1c769c` had successful build/browser 1, failed
  browser 3 and running browsers 2/4 in `43211491500`; the responsive-button
  fix `994208f` remained queued in `43214196674`. Both still contain the
  unchanged 8px chart rule and pre-readiness Services test. This new candidate
  must complete its own CI; no new deployment is claimed.
- Job candidate 5250 completed the original/new first round with 33 passes and
  six failures. One original Base case proved an actionable stale toast could
  intercept Add Crew Day inside the next Sheet; the consumer now dismisses that
  notification on panel entry while preserving Undo. Other new-test failures
  concern inconsistent text accessors and an overlong multi-flow case; the
  initial Base menu-readiness hypothesis was later superseded by FSA-07 below.
  On 5260, the old 22 all passed and the full batch reached 52/55; a targeted
  recheck passed two of three, while the Base risk menu still failed Escape.
  Native event capture proved the shared cancellation bug. All failures remain
  in the evidence record. Rebuilt5270 then passed the original three-case Job
  regression, seven Base menu/nested-overlay cases, and all eighteen final
  layout cases with the added copy. This is staged acceptance with explicit
  source boundaries, not a claim of a full55/55 rerun on5270.
- Shared template source viewer (P2, bounded milestone fixed and locally
  verified): actual free CodeBlock/highlighter worker and `c-combobox-21` passed
  candidate 5458's original critical 3 and phone 4 flows, plus private core 26,
  natural cache 4 and genuine transport fault 2. Original raw/real Clipboard/file/ZIP
  checks and budgets remain. Four permanent focus cases are registered; their
  overlapping direct extraction 2 passed. Historical failures remain preserved.
  All-style/stable-matrix and exact-SHA CI/Pages acceptance are separate; the
  exported Base app's NewFolder Escape-focus smoke remains open. Scope:
  `docs/qa/2026-11-12-source-worker-cache-focus.md`.
- Every fix needs scoped rendered validation and an independent, reviewable Git
  milestone. Commit, push, Actions success and Pages deployment are separate
  states. Reference screenshots remain private audit evidence outside the
  application and downloadable source projects.

## Foundation and style verification

The user's follow-up makes real Base UI / Radix UI support and all eight styles
a priority: Nova, Vega, Maia, Lyra, Mira, Luma, Sera and Rhea. The dedicated
`foundation_style_audit` owner is reviewing primitive resolution, rendered
controls and overlays, settings persistence across navigation, and exported
project configuration. A selection label or a `data-ui-style` attribute alone
does not establish support. Representative coverage and any confirmed gaps will
be recorded in `docs/qa/2026-11-12-foundation-style-audit.md`.

Individual fix validations below are scoped to the styles they actually run;
two-foundation Nova coverage must not be described as a complete 16-combination
foundation/style audit.

### Findings from the foundation/style review

| ID        | Priority / state                             | Evidence and owner                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FSA-05    | P2, fixed; 16/16 verified                    | At 1440px in Sera under both foundations, the Host Search shortcut extends 12.8125px beyond its button and overlaps Customize by 5.8125px. The overlapping point hits Customize. Button boxes themselves remain 7px apart. `lucent_current` completed the Host fitting repair and entry-focus restoration; all sixteen foundation/style cases passed on 5240 with the original budgets. See `docs/host-search-style-fit-2026-11-12.md`.                                                              |
| FSA-06    | P2, fixed; 32 states verified                | Non-Nova icon rules overrode responsive desktop auto-width. The shared style rule now preserves intrinsic caption hitboxes and mobile square icons; Handover also restores its actual opener. Both foundations × eight styles × two widths passed on 5240: 30 in the full attempt, then two unchanged Base/Rhea cases in a focused run after a click-navigation wait failure. See `docs/responsive-toolbar-style-fix-2026-11-12.md`.                                                                 |
| FSA-07    | P2, fixed locally; exact-SHA CI pending      | A focused disabled Base Select option natively prevents Escape's default; an empty adapter callback object incorrectly canceled close. The shared adapter now requires an actual Escape callback before honoring cancellation, preserving explicit callbacks and native event identity. Real-source contracts passed 7/7 after a red baseline; 5270 passed the original Job three-case regression and seven Base menu/nested-overlay cases. See `docs/qa/2026-11-12-base-overlay-escape-dismiss.md`. |
| EXPORT-01 | P3, generator repaired; fresh ZIP smoke open | A preserved real Pulse ZIP installs/builds but its console smoke fails on `/favicon.ico`404. Shared starter HTML now embeds the original Bricklane SVG favicon as a data URI; the decoded bytes match public/favicon.svg and theme attributes remain. The historical ZIP and failed smoke are untouched. Verify a newly downloaded, unmodified ZIP in its own browser window before closing this gate.                                                                                               |

The core product interaction/persistence matrix passed 32/32 cases: two real
foundations, eight styles and two independent behaviors. The formal regression
is committed and pushed as `5b6f065`; this result does not close the two visual
findings above or the separate source-viewer performance gate. The audit report
records actual screenshot-review coverage, successful ZIP/default-source
subsets and incomplete Copy/single-file source chains separately.

`FSA-08` (P2): on5290 Radix/Vega phone, the real Limelight Trial Dialog closed
after Escape but did not restore its connected pricing opener. The consumer now
captures that real button and uses the existing Modal close-focus callback;
submission clears that reference and retains the original return to Home. Shared
Dialog/Modal code is unchanged. On fresh5300, Nova8/8 and twelve non-Nova phone
cases passed. Base/Sera's case expired after an anomalously slow successful
attribute check, before its Trial flow; this does not prove a Tabs focus bug or a
Sera Trial pass. Base/Rhea and original regressions are separately in progress.
Preserve the failed trace and remaining scope instead of claiming a complete
single-run matrix.

The subsequent original Base/Rhea case passed, as did all five scoped existing
regressions (four Radix, one Base after correcting its real native accordion
state locator). A separate diagnostic directly imported the unchanged Base/Sera
case with lightweight timing observations and passed its complete Trial focus
flow in8.0s. Its three images were viewed. This verifies that bounded flow in a
separate run; the original deadline and its unknown cause remain recorded.

Strata initial private integration found `SCV-01` (P2): the three Logs Frame
headers inherited a column direction, shifting the event table roughly90px
below the reference. The leaf CSS now preserves actual desktop title/action
rows and phone wrapping, using the correct free Frame description slot. A
separate phone sidebar width precedence issue produced292.5px instead of the
observed240px. Both repairs await the fresh5321 rendered check. Cross-review of
four local images also recorded five P3 differences in private
`/tmp/strata-core-5320-visual-review.md`; these are not a full-template verdict.

Pulse Dashboard business milestone: 5220 passed 16/16 Nova cases (Radix 11, Base 5), with actual free ReuiTrend and Progress. The historical preserved ZIP installs and strictly builds; its favicon-only console smoke failure and the separate current source-viewer gate remain open. See `docs/pulse-dashboard-free-primitives-release-2026-11-12.md`.

The first favicon generator check compared trimmed XML, which did not establish
exact byte equality: candidate5300 embeds332 bytes while public/favicon.svg has333,
including its final LF. Independent export review found this difference. The
generator now retains that LF and the strict check compares the entire decoded
string without normalization. Candidate5300 stays immutable; its actual ZIP gate
must not be called byte-identical. A later candidate and fresh ZIP still require
native download, original strict build and console smoke verification.

- `COHORT-SET-03` (P2, scoped correction locally verified; exact-SHA CI pending):
  main4d's broad mobile footer rule made the original phone Profile footer76px,
  violating the existing48px contract in Actions43320050985/browser1 and the
  unchanged frozen5458 first local red. Restricting the two selectors to the
  actual Working week section preserves all five declarations and the free
  Frame/Button/ToggleGroup. Frozen5466's unchanged original phone case passed
  once at354×48px. Its original permanent Working week footer six produced
  four passes/two Base failures only at the final status hit, where a normally
  exiting native sheet-overlay still covered the background after the dialog
  had become aria-hidden. Both traces later show the overlay unmounted without
  another interaction. A private test-only correction waits for zero actual
  sheet overlays after each existing Escape/hidden check using the original5s
  budget; all hit/Range/bounds/keyboard/30s/R0/fulltrace assertions remain.
  Corrected footer six passed their first native invocation on the same5466
  runtime, exit0 at23:33:27.600705Z,49.177s wall, without rebuild/phone repeat.
  All30 status hits/12overlay asserts/18viewedPNG/6complete auditedtraces passed;
  both full before/after2453source/1430artifact/1632sharedRuntime/12HTTP guards
  passed. Initial4/2 and the phone pass remain separate. Savedtoast still covers
  part of lower disabled actions; other Sera section footers remain outside
  the correction and visibly retain compressed status/320px Locations actions.
  See `docs/qa/2026-11-12-cohort-settings-footer.md` and
  `/tmp/cohort-footer-readiness-5466-six-native-20261112-attempt-01/`.

- `COHORT-SET-04` (P2, visual follow-up open): Sera Locations/Departments
  footers still compress saved-status text; the 320px Locations actions extend
  right in the reviewed 5466 footer screenshots. These sections are outside
  the Working week selector correction and have no dedicated measured gate yet.
  Preserve Profile's original 48px Nova contract when reviewing them. Evidence:
  `/tmp/cohort-footer-readiness-5466-six-native-20261112-attempt-01/`.
- `FILEBOX-FOCUS-01` (P2, exported-app smoke open): the unchanged original
  Base package installed and strictly built, but its first own-dist smoke failed
  New Folder opener focus after Escape. Login, popup and removal passed; Create
  was not reached and the actual focus destination was not captured. The
  original 263 members remain unchanged. Consumer/native-focus investigation
  is queued; this does not change Source viewer acceptance. Evidence:
  `/tmp/filebox-base-original-fresh-smoke-5465-native-20261112-p8z2nv7k/`.
