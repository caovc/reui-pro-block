# Visual replication verification backlog · 2026-11-12

This is a representative audit of previously delivered surfaces, not a claim
that the complete block or template catalog has been visually verified. Findings
require newly captured, inspected reference and local screenshots. Original
Bricklane branding, licensed replacement artwork, disclosed local fixture data,
and unavailable backend services are intentional boundaries.

## Confirmed findings and assignments

| ID         | Priority | Surface and observed difference                                                                                                                     | Owner / status                                                                                                   | Acceptance                                                                                                                                                                  |
| ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BLOCK-V01  | P2       | Job Schedule attention cards demote the risk headline and omit remaining work hours; the local hierarchy and card height differ from the reference. | `job_attention_qa`: V01 fixed; 22/22 Nova cases passed across both foundations and widths.                       | Risk is the main heading; real local remaining hours are visible; card actions still open or update the correct job at desktop and phone widths, under both UI foundations. |
| BLOCK-V02  | P2       | Job Schedule exposes common type/task-state filtering through a different generic entry point.                                                      | `chart55_mobile_fix`: static query/Select plan ready; reference option semantics pending.                        | Verify the reference filter controls and restore equivalent discoverability without changing the underlying filtering or losing existing actions.                           |
| BLOCK-V03  | P3       | Job Schedule outer spacing, row density and button sizing differ.                                                                                   | Job Schedule owner: queued visual polish.                                                                        | Compare the actual embedded preview canvas before changing margins; preserve usable row targets and horizontal scrolling.                                                   |
| BLOCK-V04  | P3       | Job Schedule phone Add Job layout and bounds differ.                                                                                                | Job Schedule owner: queued visual polish.                                                                        | Match the observed form structure where appropriate, with all controls reachable and native Escape/focus recovery preserved.                                                |
| VT-MAN-001 | P2       | Manifest phone Inventory velocity renders all category ticks, which collide; the reference omits some ticks to keep labels readable.                | `manifest_axis_qa`: axis fixed; all ten Nova cases passed across both foundations (Radix 4 + focused 1, Base 5). | No tick collisions at 390px; retain every bar, its data and accessible category/value information, desktop labels, and unchanged defaults for other chart consumers.        |
| VT-ATL-001 | P2       | Atlas phone date control begins above the viewport and Export extends below its header.                                                             | `atlas_header_fix`: pushed `c96fb36`; 32 cases passed, including all eight phone-header styles.                  | Date/Export stay within the viewport and their own header; fix the local clipping without reproducing the reference's separate horizontal-overflow issue.                   |

Atlas phone Threat Vectors has a much smaller, 0.1953px Beacon/Day0 tick overlap (P3); Manifest's confirmed overlaps reach 20.1987px. The coordinated opt-in repair is verified under both foundations at 390px and 1440px. All nine Atlas categories, both series and their accessible data remain. `manifest_axis_qa` owns the shared chart change; the Atlas consumer was coordinated with `atlas_header_fix`.

`BLOCK-V05` (P2): Working Agreements phone hid the earlier 21 of 26 weeks. The reference retains all 26 weeks in an internally scrollable matrix; the local view stopped keyboard navigation at August 31. `chart55_mobile_fix` restored all weeks, the default five-week viewport and accessible historical scrolling/keyboard navigation. Candidate 5200 passed the complete four-case Nova suite across Base/Radix and desktop/phone after an initial cold-entry failure and a passing focused recheck; the failure evidence is retained. Ten fresh screenshots were inspected. Committed and pushed in `7334f6c`. See `docs/qa/2026-11-12-chart55-mobile-history-fix.md`; full style-matrix, source-export and CI deployment gates are separate.

Evidence and capture limits are recorded in the corresponding audit reports:

- `docs/qa/2026-11-12-block-visual-audit.md`
- `docs/qa/2026-11-12-template-visual-audit.md`

The Blocks audit now includes both Job Schedule and Working Agreements at desktop and phone widths, including observed overlay/focus and horizontal-scrolling behavior. It does not cover every block.
Manifest and Atlas audit coverage must be read from the template report rather
than extrapolated to their entire applications.

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
- Shared template source viewer: the frozen source batch had two passes and two
  native-action timing failures. A dedicated source-viewer owner is investigating
  main-thread highlighting/rendering. Keep the existing action/test budgets,
  tracing, real clipboard and original ZIP verification; do not relabel this gate
  as passed.
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

| ID        | Priority / state                          | Evidence and owner                                                                                                                                                                                                                                                                                                                                                                |
| --------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FSA-05    | P2, confirmed; fix assigned               | At 1440px in Sera under both foundations, the Host Search shortcut extends 12.8125px beyond its button and overlaps Customize by 5.8125px. The overlapping point hits Customize. Button boxes themselves remain 7px apart. `lucent_current` owns the Host-only fitting repair and a regression across both foundations/eight styles.                                              |
| FSA-06    | P2, confirmed; shared-style investigation | Non-Nova Prospect toolbar buttons retain icon-only widths while their responsive desktop labels are visible. The actual Add Company width changes from Nova's 139.031px to 28–40px in the other profiles; fresh returned-page screenshots show overlapping labels. `atlas_header_fix` owns shared-style root-cause preparation, with the audit owner supplying geometry evidence. |
| EXPORT-01 | P3, queued                                | A preserved real Pulse ZIP installs and passes its original strict build. Its functional browser smoke reaches Chart, Progress and Sheet/focus assertions, but its console gate fails on the browser's `/favicon.ico` 404. Keep this distinct from a fully clean standalone-package smoke.                                                                                        |

The core product interaction/persistence matrix passed 32/32 cases: two real
foundations, eight styles and two independent behaviors. The formal regression
is committed and pushed as `5b6f065`; this result does not close the two visual
findings above or the separate source-viewer performance gate. The audit report
records actual screenshot-review coverage, successful ZIP/default-source
subsets and incomplete Copy/single-file source chains separately.

Pulse Dashboard business milestone: 5220 passed 16/16 Nova cases (Radix 11, Base 5), with actual free ReuiTrend and Progress. The historical preserved ZIP installs and strictly builds; its favicon-only console smoke failure and the separate current source-viewer gate remain open. See `docs/pulse-dashboard-free-primitives-release-2026-11-12.md`.
