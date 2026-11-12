# Visual replication verification backlog · 2026-11-12

This is a representative audit of previously delivered surfaces, not a claim
that the complete block or template catalog has been visually verified. Findings
require newly captured, inspected reference and local screenshots. Original
Bricklane branding, licensed replacement artwork, disclosed local fixture data,
and unavailable backend services are intentional boundaries.

## Confirmed findings and assignments

| ID         | Priority | Surface and observed difference                                                                                                                     | Owner / status                                                                                                            | Acceptance                                                                                                                                                                    |
| ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BLOCK-V01  | P2       | Job Schedule attention cards demote the risk headline and omit remaining work hours; the local hierarchy and card height differ from the reference. | `job_attention_qa`: V01 fixed; 22/22 Nova cases passed across both foundations and widths.                                | Risk is the main heading; real local remaining hours are visible; card actions still open or update the correct job at desktop and phone widths, under both UI foundations.   |
| BLOCK-V02  | P2       | Job Schedule exposes common type/task-state filtering through a different generic entry point.                                                      | `chart55_mobile_fix`: reference semantics captured; rebuilt 5260 is running the 55-case native suite.                     | Verify the reference filter controls and restore equivalent discoverability without changing the underlying filtering or losing existing actions.                             |
| BLOCK-V03  | P3       | Job Schedule row density, date-column width and button sizing differ.                                                                               | Job Schedule owner: local density work queued; the outer-spacing finding was withdrawn after image reinspection.          | Preserve the matching 48px/32px outer spacing; compare local Nova row/column/control dimensions while retaining other styles and internal scrolling.                          |
| BLOCK-V04  | P3       | Job Schedule phone Add Job layout and bounds differ.                                                                                                | `atlas_header_fix`: Create-only layout frozen for 5260 eighteen-case native validation.                                   | Match the observed form structure where appropriate, with all controls reachable and native Escape/focus recovery preserved.                                                  |
| VT-MAN-001 | P2       | Manifest phone Inventory velocity category ticks collided; the first responsive repair left too little tail-label safety space in CI.               | `manifest_axis_qa`: 5260 first-run 10/10 plus both foundations' Inter/Arial fallback probes passed; exact-SHA CI pending. | No tick collisions or clipping; final phone category remains Outerwear with at least 2px real inner clearance; all bars, accessible data and default chart behavior retained. |
| VT-ATL-001 | P2       | Atlas phone date control begins above the viewport and Export extends below its header.                                                             | `atlas_header_fix`: pushed `c96fb36`; 32 cases passed, including all eight phone-header styles.                           | Date/Export stay within the viewport and their own header; fix the local clipping without reproducing the reference's separate horizontal-overflow issue.                     |

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
behavior. This adds field height, so 5270 must repeat the eighteen layout and
keyboard cases before the copy task is closed. See
`docs/job-schedule-create-layout-2026-11-12.md`.

## Catalog completeness follow-up

The saved public official catalog contains twenty actual template cards; the
local catalog has eighteen entries. Two explicit missing entries are confirmed,
independently of the total count. The other eighteen names, categories and
normalized public preview URLs match individually; official Dashboard has seven
entries versus five locally, while the other categories match. The private
20-entry mapping is in `/tmp/template-catalog-completeness-2026-11-12/`.
These two missing entries require public preview inspection and
actual free-component implementation, not only copied card labels:

| ID           | Priority | Official entry                                                                             | Status / acceptance                                                                                                                                                 |
| ------------ | -------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEMPLATE-C01 | P2       | [Signal — Product Analytics](https://reui.io/template/signal-analytics), TanStack Start    | Missing from local catalog and implementation; capture its public preview states before assigning an implementation.                                                |
| TEMPLATE-C02 | P2       | [Strata — Observability Dashboard](https://reui.io/template/strata-observability), Next.js | Existing planned/unregistered gap under the [paused Strata plan](2026-11-03-strata-template-plan.md); capture public preview states before resuming implementation. |

This is an identity/presence check, not a visual or functional acceptance of the
other eighteen templates. Reference imagery remains private audit evidence.

## Related release gates

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
  in the evidence record. The Job batch awaits 5270 validation before commit.
  V04 first passed eighteen 5260 layout cases; added copy is now queued for the
  rebuilt layout/keyboard verification, rather than reusing that earlier pass.
- Shared template source viewer: the frozen source batch had two passes and two
  native-action timing failures. Highlighting/worker experiments did not meet
  the original gate and were archived privately; their tracked runtime/test
  changes were restored to main before 5240/5250. This performance task remains
  open. Keep the existing action/test budgets, tracing, real clipboard and
  original ZIP verification; the passing focused Roster case does not close it.
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

| ID        | Priority / state                        | Evidence and owner                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FSA-05    | P2, fixed; 16/16 verified               | At 1440px in Sera under both foundations, the Host Search shortcut extends 12.8125px beyond its button and overlaps Customize by 5.8125px. The overlapping point hits Customize. Button boxes themselves remain 7px apart. `lucent_current` completed the Host fitting repair and entry-focus restoration; all sixteen foundation/style cases passed on 5240 with the original budgets. See `docs/host-search-style-fit-2026-11-12.md`.                                                              |
| FSA-06    | P2, fixed; 32 states verified           | Non-Nova icon rules overrode responsive desktop auto-width. The shared style rule now preserves intrinsic caption hitboxes and mobile square icons; Handover also restores its actual opener. Both foundations × eight styles × two widths passed on 5240: 30 in the full attempt, then two unchanged Base/Rhea cases in a focused run after a click-navigation wait failure. See `docs/responsive-toolbar-style-fix-2026-11-12.md`.                                                                 |
| FSA-07    | P2, fixed locally; exact-SHA CI pending | A focused disabled Base Select option natively prevents Escape's default; an empty adapter callback object incorrectly canceled close. The shared adapter now requires an actual Escape callback before honoring cancellation, preserving explicit callbacks and native event identity. Real-source contracts passed 7/7 after a red baseline; 5270 passed the original Job three-case regression and seven Base menu/nested-overlay cases. See `docs/qa/2026-11-12-base-overlay-escape-dismiss.md`. |
| EXPORT-01 | P3, queued                              | A preserved real Pulse ZIP installs and passes its original strict build. Its functional browser smoke reaches Chart, Progress and Sheet/focus assertions, but its console gate fails on the browser's `/favicon.ico` 404. Keep this distinct from a fully clean standalone-package smoke.                                                                                                                                                                                                           |

The core product interaction/persistence matrix passed 32/32 cases: two real
foundations, eight styles and two independent behaviors. The formal regression
is committed and pushed as `5b6f065`; this result does not close the two visual
findings above or the separate source-viewer performance gate. The audit report
records actual screenshot-review coverage, successful ZIP/default-source
subsets and incomplete Copy/single-file source chains separately.

Pulse Dashboard business milestone: 5220 passed 16/16 Nova cases (Radix 11, Base 5), with actual free ReuiTrend and Progress. The historical preserved ZIP installs and strictly builds; its favicon-only console smoke failure and the separate current source-viewer gate remain open. See `docs/pulse-dashboard-free-primitives-release-2026-11-12.md`.
