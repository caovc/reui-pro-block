# Limelight native controls migration

Limelight's period, billing and tour selectors now use the actual free ReUI ToggleGroup and Tabs compositions. Mobile navigation exposes its expanded state and controlled navigation ID; the landing theme button exposes its pressed state. The migration retains the existing Console values, prices, cue content, Contact flow and Overture entry.

The isolated **5300** production candidate verifies the migration and Trial dismissal fix in a bounded matrix: Nova **8/8**; the original non-Nova phone batch **12 passed / 1 timed out / 1 not run**, followed by a separate pass for the previously unrun Base/Rhea case. Thus **21 of the 22 new native cases passed across batches**; Base/Sera remains unresolved. The four older Radix regressions passed, and the added real-Base Limelight regression passed after an approved native Accordion oracle correction. These are separate batches, not one fully green matrix. The earlier 5290 Trial focus failure and both candidates' original failures remain preserved.

## Actual free implementation

Before editing, both public foundation registries were read over HTTPS with normal TLS verification:

- [Radix c-toggle-group-5](https://reui.io/r/radix-nova/c-toggle-group-5.json) and [Base c-toggle-group-5](https://reui.io/r/base-nova/c-toggle-group-5.json) provide the real single-choice ToggleGroup/Item composition. The local Base adapter translates the shared single-string API into Base's array API.
- [Radix c-tabs-7](https://reui.io/r/radix-nova/c-tabs-7.json) and [Base c-tabs-7](https://reui.io/r/base-nova/c-tabs-7.json) provide the real Tabs/List/Trigger/Content composition. The two current free example responses have identical content. The project's actual foundation-specific primitives own selection, keyboard navigation and panel association.

The original responses and hashes remain private under `/tmp/marketing-template-static-audit-2026-11-12/free-registry/`. Existing MIT notices remain in the source/download closure; no premium source was fetched or copied.

Week/Month/Year and Monthly/Yearly use controlled groups. Consumers ignore an empty selection so reactivating the selected item does not clear a required choice. Selected CSS reads real Radix `data-state="on"` or Base `data-pressed`. The four cues use vertical native Tabs with one actual panel per cue and native `data-state="active"` styling. The old selector-specific handwritten `active` classes were removed. The independent Console sidebar remains outside this migration.

Only local consumer CSS adapts the branded segment, billing and tour layout. The existing menu class controls visibility, Scrollspy retains `history={false}`, and native controls retain their own focus/keyboard implementations. No shared UI, other template, dependency, source-target mapping or runtime leaf was changed.

## Trial focus finding and consumer fix

The failing 5290 Radix/Vega/390 case completed period selection and metrics, tab keyboard/panel checks, theme Space toggling in both directions, navigation selection, Yearly pricing, Trial opening and both field fills. One Escape removed the dialog; the exact opener remained unfocused throughout the original five-second assertion. This is a product failure rather than a timeout-budget or test-role error. Its screenshot and retained trace are preserved in the private candidate evidence directory.

The fix records the actual pricing button's `event.currentTarget`. Limelight passes the existing Modal `onCloseAutoFocus` callback and restores that connected opener with `focus({ preventScroll: true })`. The shared Modal/Dialog implementations are unchanged. The submit path explicitly clears this ref before its existing close-and-scroll-Home actions, so this consumer callback does not restore the Pricing opener after submission. The complete submit-to-Home flow was preserved statically and was not executed in this bounded dismissal matrix. The four Nova tour cases also open the real Starter Trial, fill both fields and require one Escape to close it and return focus to that exact opener. These four cases and thirteen completed non-Nova phone cases passed the exact opener focus assertion on 5300. All fourteen non-Nova focus assertions remain; the Base/Sera case did not reach Trial.

## Native regression scope

`tests/limelight-native-controls.spec.ts` enumerates **22** independent cases. Its relative-entry helper handles configured root or Base baseURLs and asserts the actual html primitive/style.

| Cases | Scope                                                         | Behaviors                                                                                                                                                                                                                                                                                                                |
| ----- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 8     | Both foundations, Nova, 1440×1000 and 390×844                 | Required period/billing selection, reactivation, arrow/Space input, exact Month/Year metrics, all prices, independent state; four tab/panel links and headings, ArrowUp/Home focus; navigation state, local theme, host hash. The post-finding version additionally checks Trial dismissal focus in all four tour cases. |
| 14    | Both foundations, Vega/Maia/Lyra/Mira/Luma/Sera/Rhea, 390×844 | Real Month state/metrics, selected tour and ArrowUp panel/focus, visible theme Space toggling/restoration, menu/controls linkage and Pricing selection, Yearly Starter pricing, Trial native open state, both inputs and Escape-to-opener focus.                                                                         |

Cases keep the repository's 30-second timeout, five-second action/expect budgets, one worker, no retries and retained failure traces. Screenshots are viewport captures with native-state/computed JSON evidence. Enumeration and static checks alone are not browser passes.

The two older Limelight cases in `templates-collaboration-refinement.spec.ts` and `template-interactions.spec.ts` select the precise native item role for the document's actual foundation: Radix radio/aria-checked or Base button/aria-pressed. Existing metric, price-note, route, scrolling and FAQ assertions remain. The two Overture waitlist cases are unchanged.

The collaboration-refinement case uses a relative entry and can run under a Base baseURL. The template-interactions helper retains its original absolute root entry, so it does not independently prove Base behavior. The executed four-case batch used the root Radix entry. The additional Base Limelight case used `PREVIEW_URL=http://127.0.0.1:5300/base/` and its unchanged relative `./#/` navigation. Its retained initial trace confirms the real `/base/` URL and `html[data-ui-primitive="base"]`. No Base Overture regression is claimed.

## 5290 execution and preserved oracle corrections

The coordinator built both production foundations with complete TypeScript, formatting/lint and 202 tooling tests passing. This agent ran only the assigned native browser batches from `/tmp/reui-5290-source`, against preview port 5290, using the isolated manifest. Test-only corrections did not change the runtime snapshot digest `52249a511933315bfe9d9bfa27cc39261f260442dcaea62ac7fe9c94e33f010e`.

| Version / batch                  | Actual result                  | Evidence and interpretation                                                                                                                                                      |
| -------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial Nova, test `892cbf08…`   | 0 passed, 1 failed, 7 not run  | Wrong parent role oracle: actual Radix parent is `radiogroup`, with checked `radio` children. Preserved original trace/DOM/image.                                                |
| Nova oracle v2, test `5a868749…` | 3 passed, 1 failed, 4 not run  | Wrong phone theme visibility oracle. The existing later, more specific mobile CSS makes the theme button visible. No runtime change.                                             |
| Nova oracle v3, test `de0baf77…` | **8 passed**, 58.2 seconds     | Both exact oracle corrections applied with coordinator approval. All original behavior/state assertions remain; phone theme also requires native Space toggling and restoration. |
| Non-Nova phone v3, same test     | 0 passed, 1 failed, 13 not run | Real Radix/Vega Trial dismissal focus failure, 17.3-second case. Stopped immediately; focus assertion and original budget retained.                                              |
| Four older related regressions   | Not run                        | Deferred until the Trial fix has a fresh production candidate.                                                                                                                   |

The parent-role correction is precise: Radix `radiogroup`, Base `group`, at all four group locators. The phone-theme correction follows the full CSS cascade: the earlier `display:none` is overridden by the pre-existing `.ct-lime-header .ct-lime-theme { display: inline-flex }` under max-width 540px. It changes the tests to verify the visible control's actual state and keyboard behavior. Neither correction hides controls or changes the runtime to fit a test.

All failed test versions, logs, JSON, traces, screenshots, exact diffs and manifests remain under `/tmp/marketing-template-static-audit-2026-11-12/candidate-5290/`. The extra runner message about stopping after one maximum failure is not a second product defect. All fourteen final 5290 Nova screenshots and the four Vega-case screenshots were individually viewed. The two earlier oracle-failure images were also viewed; the six other intermediate v2 screenshots were not included in that visual review.

## 5300 execution and remaining deadline

The coordinator's isolated snapshot is `/tmp/reui-5300-source`, based on `c6363f0ba91669d63382af86d1b951b2b3da9d2c` plus the six declared marketing overrides. Both foundations received full TypeScript, production builds, global formatting/lint and 202/202 tooling checks before browser execution. The actual runtime digest over 1,226 source files is `ff156967e0b0cd88db00d25bca0b3558b6c6681739b2914c5d5d6bea26c250d5`. Limelight runtime SHA is `95690bdd…`; new native spec SHA is `2a56bd2d…`. No runtime change or rebuild occurred during these browser batches.

| Batch                                  | Actual result                                          | Scope/version                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nova                                   | **8/8 passed**, 63.8 seconds                           | New native spec, both foundations, both widths; includes four Trial dismissal focus checks.                                                         |
| Original non-Nova phone                | **12 passed / 1 timed out / 1 not run**, 145.9 seconds | All seven Radix styles and Base Vega/Maia/Lyra/Mira/Luma completed. Base Sera reached the whole-case deadline; Base Rhea was not run in this batch. |
| Older Radix regressions                | **4/4 passed**, 18.6 seconds                           | Two Limelight and two Overture cases, original root entry; collaboration-refinement test SHA `e805a0eb…`.                                           |
| Added Base Limelight, initial oracle   | **0/1 passed**, 16.0 seconds                           | Functional FAQ opening succeeded; the old selector incorrectly required Radix `data-state="open"`.                                                  |
| Added Base Limelight, corrected oracle | **1/1 passed**, 10.3 seconds                           | Test-only correction SHA `8a4a0dd3…`; all original metric/route/pricing/text assertions remain, plus trigger expanded and panel visible checks.     |
| Previously unrun Base Rhea             | **1/1 passed**, 11.1 seconds                           | Original native case unchanged, separate supplement; no Sera retry.                                                                                 |

The additional Base regression exposed a third precise test oracle issue. The actual free Base Accordion panel uses `data-open` with no `data-state`. Its real trigger reported `aria-expanded="true"`, and the retained screenshot shows the expected trial content. The coordinator approved only this case's native selector branch: Base `[data-open]`, Radix `[data-state="open"]`, with the original `14 day trial` assertion retained. Only this test file was copied into the isolated snapshot; the runtime digest remained unchanged. The original failure is preserved. The older Radix batch was not rerun after this test-only correction, so it does not claim execution of the newly added Radix expanded/visible assertions.

Base/Sera's unresolved case is **not a confirmed focus bug**. Its successful Month `data-pressed` check took 20.044 seconds in the test trace despite the unchanged five-second configured expect budget. The lower Frame.expect took about 8.593 seconds without error; its end-to-after-snapshot timestamp gap was about 11.8 seconds, while reported snapshot collection itself took 631.6 ms. These observations identify delayed native/trace completion without establishing its cause. The next focus check had only 22.5 ms before the whole 30-second case deadline cancelled it.

That case completed real Month selection/metrics and the third cue's selected state, visible panel and ID association, then sent one ArrowUp. It did not complete the following focus check, any explicit `evidence()`/screenshot, navigation/theme flow, billing interaction or Trial flow. The existing 12 complete cases took 7.0–14.4 seconds each. This evidence does not justify calling the problem a multi-flow test-design overload or asserting a browser/CPU/font/network cause. The test, every behavior assertion, original budgets, zero retries and tracing remain unchanged; Sera was not retried. Its full trace/timeline and the original **12/1/1** batch remain available.

## Actual visual and style evidence

All **59 named 5300 screenshots** were individually viewed: 18 Nova; 36 from the twelve complete original non-Nova cases; one Sera deadline failure; three Base/Rhea supplement; one initial Base FAQ oracle failure. Twelve additional Playwright cached end-state PNGs were also individually viewed, for **71 PNG files reviewed**, each listed with SHA-256 in the private `actual-screenshot-review.json`. The cached images do not add cases or independent validation.

The successful captures show readable selected tour content, all six open mobile navigation links, filled Trial fields and its primary CTA within the recorded viewport. The popup menu overlays part of the hero in its open state. Some tour screenshots capture mostly the tab stack; content below the viewport is not visually certified. Native DOM assertions establish the executed panel and interaction contracts. No additional confirmed clipping defect was found in the reviewed control surfaces.

The styles visibly affect the actual free controls and overlays. Recorded computed values from the thirteen completed non-Nova Trial captures agree between the two foundations wherever both completed:

| Style | Trial radius | Input height / font size / radius | Observed surface                                                                                           |
| ----- | ------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Vega  | 14px         | 36px / 16px / 8px                 | Compact rounded controls.                                                                                  |
| Maia  | 26px         | 36px / 16px / 26px                | Rounded tour and pill-like fields.                                                                         |
| Lyra  | 0px          | 32px / 12px / 0px                 | Square compact fields and popup.                                                                           |
| Mira  | 14px         | 28px / 14px / 8px                 | Smaller field/control height.                                                                              |
| Luma  | 26px         | 36px / 16px / 22px                | Large rounded popup and fields.                                                                            |
| Sera  | 0px          | 40px / 16px / 0px                 | Uppercase native controls/tour labels and underlined fields; these complete overlay values are Radix only. |
| Rhea  | 24px         | 32px / 16px / 18px                | Rounded popup with shorter fields.                                                                         |

Consumer CSS intentionally retains the Console period's 10px label size; Sera still computes uppercase text transformation there. This table is evidence of actual computed behavior, not a claim that all styles must change every consumer property. Base/Sera's failure screenshot confirms the styled third cue renders, but does not provide a completed Base/Sera Trial measurement.

All results, short case JSON, decoded native-state evidence, exact test-only diff/version manifest, individual image hashes and the timeout analysis are private under `/tmp/marketing-template-static-audit-2026-11-12/candidate-5300/`. Browser runners were closed and the exclusive window was explicitly returned to the coordinator before offline review.

## Static checks and preserved boundaries

Scoped formatting/checking, lint, syntax parsing and test enumeration are recorded in the private migration evidence. The 5300 integrated build and bounded browser results are recorded above; the Base/Sera deadline remains open. No Git operation or production build was performed by this agent.

Before the focus finding, exact source-node comparisons confirmed Overture, Wallpaper, Contact and Trial unchanged. The new focus fix intentionally changes only Limelight's Trial consumer and its pricing opener. Overture, Wallpaper and Contact remain unchanged. The static code closure still has the same local file sets as before the migration: 228 Radix files and 233 Base files, with zero added or removed paths. These are static closure measurements, not actual ZIP counts or SourceDialog performance results.

Overture's 75 original wallpaper illustrations, seeded original portraits, Bricklane mark, GitHub attribution, Archivo OFL license and wallpaper reduced-motion rule remain. Native email validation, local waitlist confirmation/counter, chart fixtures and the existing free chart implementation remain.

Current official same-state visual parity, non-Nova desktop geometry, full Contact/submission flows, other template/style combinations and actual source/clipboard/file/ZIP output remain outside this bounded native-control validation. The Base/Sera phone workflow remains incomplete. No full-template, complete sixteen-combination phone, single-run all-green or later-candidate pass is claimed.

## Subsequent controlled Sera diagnostic

After the original5300 case deadline, a separate diagnostic directly imported
the same frozen original test body and ran only Base/Sera once. It retained the
30s case,5s action/expect contracts, one worker, zero retries and failure-trace
policy. Lightweight Node event-loop/CPU and browser long-task observations were
added; no click/expect wrapper, delay or runtime change was made.

That diagnostic passed in8.0s, including the previously unreached real Trial
fields, Escape and exact opener focus. Its three new images were actually
viewed. Node loop maximum was105.6ms; the longest observed browser task was390ms.
The earlier20s stall did not recur, but its cause remains unknown. Successful
trace retention discarded this diagnostic's trace as configured; do not claim a
success trace exists. This is separate instrumented evidence, not a corrected
single-run22/22 result or proof of a runtime fix for the timeout. Evidence lives
under `/tmp/sera-5300-diagnostic-20261112/`.
