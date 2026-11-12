# Base overlay shared browser regressions

Production candidate **5270 passed all seven selected browser regressions** on 2026-11-12: four existing Base menu cases, both existing Tempo phone account Escape cases through the Base entry, and one private Base route adaptation of the complete existing Cohort notes/person-identity case. The runner exited 0 in 52.3 seconds, with no retries, skipped cases or unexpected failures.

This supplements the real-source contract suite described in [Base overlay Escape cancellation](2026-11-12-base-overlay-escape-dismiss.md). The coordinator separately reported that the three original targeted Job cases passed on 5270, including the previously failing disabled Select Escape flow. Those three cases and the seven source contracts are separate evidence; they are not included in this report's seven browser results.

## Executed scope

| Original flow                                                           | Cases | Result and preserved behavior                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/base-ui-menus.spec.ts`                                           |     4 | Checked/radio selections close the actual menu and restore their trigger; context-menu edit applies to the clicked flow node; HTTP method selection restores the InputGroup button; mobile workspace menu Escape preserves its Sheet, and the next Escape closes the Sheet and restores navigation focus. |
| Tempo settings/profile in `tests/templates-main-account-escape.spec.ts` |     2 | Both complete original phone flows pass through `/base/`: account overlay closes first, its real trigger regains focus inside the still-open Sheet, then another Escape closes the Sheet and restores the header trigger.                                                                                 |
| Cohort notes and external employee identity                             |     1 | Private route-adapted original full chain passes: real Base primitive assertion; note/save/reset; Manager Combobox Escape closes the popup while the explicit consumer callback preserves the editor Sheet; edit/save; actual dashboard/directory navigation; stable person ID and note isolation.        |

The menus use the original helper with `BASE_UI_PREVIEW_URL=http://127.0.0.1:5270/base/`. Tempo's original `./#` navigation resolves under `PREVIEW_URL=http://127.0.0.1:5270/base/`.

The formal Cohort helper uses the absolute `/#/template-preview/cohort`, which resolves to the Radix entry even when the configured base URL ends in `/base/`. With coordinator approval, the unchanged formal spec was copied to ignored `.qa/foundation-overlay-shared-5270-cohort/cohort-base-route-adapter.spec.ts`. Only the selected helper's navigation changed to `./#/template-preview/cohort`, followed by an additional assertion that the actual html has `data-ui-primitive="base"`. Every original action and assertion remains, including the full navigation/save/identity tail. This is a private Base route-adapted regression; the formal Cohort spec itself has not acquired Base entry support.

## Budgets and artifacts

All seven inherit the original 30-second case timeout and 5-second expect timeout. Execution used one worker, zero retries, the requested 5-second action timeout, system Chromium and the existing `retain-on-failure` trace policy. No forced clicks, simulated focus, manual primitive attributes, application changes or wider budgets were used. Since all seven passed, that trace policy produced no failure trace.

Private evidence is under `/tmp/base-overlay-shared-regressions-2026-11-12/candidate-5270/`:

- `playwright.config.mts`, `list.txt` and `run.log` record the exact seven selected flows and execution.
- `results.json` and `summary.json` record 7 expected, 0 unexpected, 0 flaky and 0 skipped; the run started at 12:58:06.821 UTC. Individual durations were 5.356/5.310/3.092/2.857 seconds for menus, 4.701/6.128 for Tempo and 18.635 for Cohort.
- `prepared-manifest.json` and `cohort-route-adapter.diff` preserve the original/adapted source fingerprints and the exact private route change. Before/after hashes confirm all three formal specs, the repository Playwright config, `overlay-compat.tsx` and the Cohort consumer source remained unchanged during this run.
- The original Tempo tests write six hardcoded screenshot paths. Their earlier files were backed up in `preexisting-tempo-screens/` before execution; all six new files were copied to `fresh-tempo-screens/` with timestamps and hashes in `summary.json`.

## Actual image review and limits

The agent actually viewed all **six fresh Tempo screenshots**, three states for each settings/profile entry: account over Sheet, Sheet with the returned trigger, and the restored page/header trigger. The account footer remains visible in the captured viewport; both later images show the expected single remaining layer and final page. A tooltip is visible in the profile account capture; this was an intermediate screenshot from the original test, which preserves its original animation setting. No new visual defect was inferred from that transient state.

The four passing menu cases and Cohort case did not generate separate screenshots, so their results are native interaction/assertion evidence rather than an additional visual review. Tempo explicitly checks its collected browser warnings/errors; the other selected cases do not have the same console collection contract. These seven cases do not certify every overlay, template page, style, accessibility property, CI shard or deployment.

The runner and its browser processes finished before the coordinator handed the browser window to the next agent. The tracked delivery is this report; the route adapter remains private in ignored `.qa`. Runtime and formal tests were unchanged, and this agent performed no Git write operations.
