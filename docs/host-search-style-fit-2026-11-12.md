# Host Search content fitting and focus · 12 November 2026

This Bricklane Host correction keeps Search's text, icon and shortcut within the existing 198px Button and returns focus to the opener when Search closes. The actual free Button, Dialog and GlobalCustomizeButton remain in use. The active foundation and style continue to supply the button's geometry, typography, colors and native focus treatment.

## Evidence and scope

The foundation audit confirmed FSA05 on production candidate `http://127.0.0.1:5220` at 1440×1000 in both Radix/Sera and Base/Sera. Search's right edge was 990.921875px and Customize's left edge was 997.921875px: the button boxes retained their intended 7px gap. Search's shortcut extended to 1003.734375px, overflowing Search by 12.8125px and intersecting Customize by 5.8125px. The overlapping shortcut point was owned by Customize in `elementFromPoint`.

The new `tests/host-search-style-native.spec.ts` was run against the unchanged candidate before applying CSS. Both Sera cases failed at the original shortcut-containment assertion with those exact edges. Each saved a pre-assertion bounds JSON, screenshot, error context and failed trace under `/tmp/host-search-style-qa/baseline-5220`. Neither case reached its later interaction checks; no successful baseline interaction claim is made.

The cause is in Host composition: a fixed-width Button contains an icon, a text span and a shortcut. Sera's larger horizontal padding and uppercase, tracked typography leave less content space. The text span previously kept its automatic minimum content size; the shortcut could paint beyond the button. The style's square corners, typography and Button sizing are intentional and are retained.

Candidate 5230 exposed a separate Search focus defect after the geometry and real filtering actions succeeded. Radix/Nova, Vega, Maia, Lyra and Mira all closed Search with Escape but left the search trigger inactive for the original five-second focus assertion. The Host Search button sits outside its controlled Dialog Root and is not a DialogTrigger; the native Radix close path had no trigger reference to restore. Base behavior was not reached in that interrupted run and is not inferred from these Radix observations.

The approved App consumer correction records the pointer opener or the active element before Ctrl+K opens Search, retaining it when Ctrl+K closes or an already-open Search receives another open request. The existing DialogContent `onCloseAutoFocus` restores a connected, visibly laid out target, with the visible Host Search button as fallback. No shared Dialog, Base overlay adapter or native modal behavior is rewritten. The same sixteen cases now also exercise Ctrl+K opening from Customize and closing back to that original control.

## Actual free-component reuse

Search still uses the repository's actual free Button implementation, including its selected Radix or Base primitive. Its existing handler opens the actual free Dialog and native Input. Customize still uses GlobalCustomizeButton and its actual free Button, existing theme store, Select and customizer panel. No duplicate button, search, keyboard, focus or customization engine is introduced.

The CSS is scoped to `.site-header .search-trigger` children. The text takes the remaining flex space, has `min-width: 0`, and truncates with an ellipsis. The icon and shortcut do not shrink. The 198px width, inherited style rules and existing icon-only behavior below 600px are unchanged. No asset, branding, dependency, shared foundation API or source mapping changes are required. Bricklane's original mark and existing licensed artwork remain.

Owned files:

- `src/App.tsx`
- `src/index.css`
- `tests/host-search-style-native.spec.ts`
- `docs/host-search-style-fit-2026-11-12.md`

## Validation checkpoint

Browser plugin not available; repository Playwright uses system `/usr/bin/chromium`. The new checks retain the original 30-second case budget, 5-second action budget, failure traces and zero retries, using one worker and private output outside the repository.

The final complete run on `http://127.0.0.1:5240` passed **16/16 in 2.0m** with exclusive local browser use and `--max-failures=1`. Both foundations passed all eight styles, including actual shortcut-edge Search opening, filtering, Escape return focus, Customize opening/closing, and Ctrl+K return to the original focused control. Application warning/error collectors were empty and framework-overlay assertions passed. The coordinator's candidate also passed its integrated TypeScript and dual production builds; this agent did not independently repeat those builds.

Both final Sera records keep Search at 198×40px with square corners, padding 16px/24px, uppercase text and 1.2px letter spacing. The shortcut's right edge is now 965.921875px inside Search's 990.921875px edge: a 25px inset, a 32px gap to Customize and correct Search hit ownership. The 127.125px natural label is clipped within its 89.3125px text box. Across all sixteen records the shortcut's smallest inset is 9px, with every right-edge hit owned by Search. The aggregate bounds proof is `/tmp/host-search-style-qa/formal-5240-exclusive/host-search-matrix-proof.json`.

All sixteen final screenshots were actually inspected, including Radix/Sera and Base/Sera. The Host labels, shortcuts and neighboring Customize controls fit while retaining each style's appearance. Some screenshots captured the product iframe's initial loading skeleton; those images support Host-header claims only and are not product-readiness evidence. A passing Mira diagnostic trace also retained actual Search-dialog and Customize-panel frames and focus assertions under `/tmp/host-search-style-qa/mira-diagnostic-5240`.

The flow under test is: Prospect Database Host with the chosen foundation/style → label, icon and shortcut fit inside Search → click the shortcut's actual right edge → Search dialog and working filtered results → Escape and return focus → real Customize panel opens and closes with return focus → Ctrl+K opens and closes Search while preserving the original focused control.

The sixteen-case matrix covers two foundations × Nova, Vega, Maia, Lyra, Mira, Luma, Sera and Rhea at 1440×1000. Each case records rendered bounds and shortcut hit ownership, requires the shortcut and label to remain within Search, exercises actual Search/Customizer behavior, and checks framework-overlay and application-console health. Sera additionally retains its square corners, uppercase typography and letter spacing. Ellipsized label text remains in the accessible name; its unclipped DOM Range is diagnostic, while actual containment checks use the clipped label box and real shortcut hit target.

| Check                             | Checkpoint result                                                                                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Old production Sera baseline      | Both cases failed at the original 12.8125px shortcut overflow; evidence retained.                                                                                                                                                    |
| Scoped formatting/lint            | Passed scoped oxfmt, oxlint and diff whitespace checks.                                                                                                                                                                              |
| New production matrix             | Passed 16/16 on 5240 in 2.0m, two foundations × eight styles, original budgets and zero retries. Earlier failed/interrupted runs remain listed below.                                                                                |
| Interaction/focus and rendered QA | All sixteen actual Search/Customizer/pointer/Escape/Ctrl+K flows passed. All sixteen final Host screenshots and final Sera bounds for both libraries were inspected. Product iframe readiness is not inferred from Host screenshots. |
| Release                           | This agent performs no Git writes. Commit, push, CI and deployment remain coordinator-owned.                                                                                                                                         |

This checkpoint does not establish phone/tablet coverage or the longer Templates search label, and does not claim that other product consumers have received a matching correction. The separate Foundation audit and its specification remain untouched.

The first 5230 matrix attempt was interrupted after seven test-oracle failures, one interrupted case and eight not run. Its background `getByRole(Customize)` query ran while Search correctly hid the background from the accessibility tree; this was not a product defect. The coordinator-approved correction reads only that background attribute through its stable Host CSS selector, preserving its expected value and every actual interaction/focus assertion. Evidence remains under `/tmp/host-search-style-qa/formal-5230`.

The corrected-oracle 5230 attempt then retained five real Radix focus failures, one interrupted case and ten not run, under `/tmp/host-search-style-qa/formal-5230-oracle-fixed`. Neither run is presented as a complete or passing matrix. No case/action budget, retry count, geometry assertion or focus assertion was weakened.

The initial 5240 pilot stopped with one failed and fifteen not run because the test compared the whole Style control's `StyleNova` label-plus-value text with `Nova`. The approved correction reads the actual `.theme-row-value` descendant and keeps the exact expected selected style. This is a test-oracle correction, with no runtime or budget change; its evidence remains under `/tmp/host-search-style-qa/formal-5240`.

The next 5240 run retained four passes, one Radix/Mira Customize click timeout, and eleven not run under `/tmp/host-search-style-qa/formal-5240-value-fixed`. The failed click had already passed Search closing and return focus; its original five-second log stopped while waiting for visible/enabled/stable state. The trace showed no residual body pointer barrier or application console errors, but it did not establish the timeout's cause. A single coordinator-authorized same-candidate, same-source, same-budget Mira diagnostic then passed in 8.0s with a retained passing trace, followed by the complete 16/16 run above. The earlier timeout remains reported; passing later checks is not used to invent a root cause or erase it. No runtime or specification changed between that timeout, diagnostic and final run.

Runtime, specification and document are now frozen for coordinator integration. The final complete matrix evidence is retained separately from all earlier failed or interrupted runs.
