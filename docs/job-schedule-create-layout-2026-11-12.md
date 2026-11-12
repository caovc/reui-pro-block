# Job Schedule mobile Add Job layout · 12 November 2026

BLOCK-V04 corrects the phone Create Job frame and field arrangement while retaining the existing free Sheet, Field, Input, Select, Calendar/Popover and Button implementations. The form data, six job types, local schedule creation and native focus restoration are unchanged.

The final production **5270 layout matrix passed 18/18** on 12 November 2026 with the Create-only placeholder and helper-copy repair included. All 22 fresh matrix screenshots were actually opened and reviewed. Two additional native-state observations confirmed the dynamic Due Date explanation in both foundations, and their two screenshots were also opened. V04-P3-01 is complete for this delivery.

The earlier 5260 eighteen-case pass and twenty-two reviewed screenshots remain historical evidence of the inset/column repair and the initial copy difference. They are not used as the result for 5270. The current pass verifies the added helper-text height against the unchanged layout, scrolling, keyboard and footer assertions; it is not a claim of complete form visual parity.

## Accepted reference and boundary

The current audit's 390×844 screenshots were both opened and inspected before this change:

- `/tmp/reui-visual-audit/blocks/06-job-reference-phone-add.png`
- `/tmp/reui-visual-audit/blocks/07-job-local-phone-add.png`

The accepted public Base/Nova reference has a floating Add Job panel with approximately 16px outside spacing, 358px width and rounded corners. Client and Phone occupy separate rows, as do Job Type and Lead. The old local panel filled the whole 390×844 viewport and placed each pair side by side. The original audit already verified Enter opening, Escape closing and return focus; this is a layout correction, not a claim that the old focus behavior was broken.

This batch uses the captured reference evidence. It makes no new remote-business, desktop-reference or eight-style reference-fidelity claim. Bricklane's original brand and existing local/licensed materials remain; no original avatar, screenshot or extracted artwork is loaded or distributed by the implementation.

## Actual composition and changes

The real SheetContent is owned by the Job Schedule consumer, not by the shared free Sheet. The forms module exports the Create-only mobile layout classes. The consumer adds those classes only for `panel.kind === "new"`: 16px insets, viewport minus 32px dimensions, 14px corners and clipped outside overflow. The existing header/footer retain their fixed flex sizing and the existing FieldGroup remains the internal scroll container.

The two grids in JobProfileForm use one column below the existing `sm` breakpoint only when there is no existing job; desktop creation keeps its original two-column layout. Edit Job keeps its previous grid classes. Job details, crew-day, make-up/slide and hold panels retain their existing SheetContent classes and shared form composition. V04 does not change shared Sheet, style generator, Host, Prospect or other overlay code.

Actual free-component reuse remains the existing Sheet/Header/Title/Description/Footer, Field/FieldGroup, Button, Input, native Select and Calendar/Popover. The change supplies consumer layout classes and reuses the existing keyboard, focus and scrolling behavior. No separate overlay, focus engine or responsive form implementation is introduced.

The model-driven job-type list retains the original `Bath Remodel` text and value. V02's model, direct filters, grid and source-target work remain separately owned. The main-file changes assigned to V04 are exactly the exported-class import and conditional SheetContent class composition; they do not replace the rest of that concurrently prepared consumer.

## Final production validation — candidate 5270

The coordinator built 5270 with forms SHA256 `70610e5fecc95bf297faf0464527731cad32d16e07ebc9b069825161fa2dbefb`. The eighteen-case spec remained `d84569645bf7b5dfb58b6c38e777cb860802e8c9e60c841dc3124be603022de2`, including the exact preview-title oracle and every original layout, keyboard, focus, warning and error assertion. No timeout or retry changed: 30s per case, 5s per action, zero retries, retained failure traces, one worker, system `/usr/bin/chromium`.

The run started at **2026-11-12 12:59:58.675 UTC** and finished with **18 passed, 0 failed/skipped/flaky, 156.045s total**. Both production entries returned 200. `/tmp/reui-5270-runtime.sha256` matched before and after verification. No runtime edit, compile, dependency installation or Git write occurred during this browser window. All runners and browsers have closed and the coordinated window has been returned.

Both Nova desktop cases retained the right-aligned `928/0/512/1000` frame and two-column field pairs. Every phone measured `16/16/358/812`, 14px corners and root width 390px, with the single-column pairs unchanged. All original Nova Tab/Cancel/Enter/Escape/opener-focus assertions passed. The other fourteen cases retained their focused Due Date/inner-scroll/footer/Escape assertions; this does not imply a complete Tab traversal in every style.

The added description increased required content in the larger styles while preserving the fixed header/footer and internal scroller. The fresh per-style measurements were identical across the two foundations:

| Style | Field-group height / content (px) | Result                                                       |
| ----- | --------------------------------- | ------------------------------------------------------------ |
| Nova  | 668 / 668                         | Fields and helper fit                                        |
| Vega  | 664 / 740                         | Due Date focus scrolls within field viewport; footer visible |
| Maia  | 628 / 740                         | Due Date focus scrolls within field viewport; footer visible |
| Lyra  | 673 / 673                         | Fields and helper fit                                        |
| Mira  | 641 / 641                         | Fields and helper fit                                        |
| Luma  | 628 / 740                         | Due Date focus scrolls within field viewport; footer visible |
| Sera  | 583 / 774                         | Due Date focus scrolls within field viewport; footer visible |
| Rhea  | 632 / 708                         | Due Date focus scrolls within field viewport; footer visible |

All twenty-two fresh matrix screenshots were individually opened: the initial and keyboard-reached footer in each of four Nova cases, plus every fourteen other-style phone screenshot. The two foundations' Nova initial/footer images visibly show all four placeholders and `Left empty, it matches the planned finish`, with the footer and focus ring contained in the sheet. Larger styles' initial screenshots show only the upper part of their scrolling form, so helper visibility in those initial images is not inferred from the file count; their retained focused-control bounds and footer assertions passed. No root overflow or browser page/console warning/error was reported.

Evidence root: `/tmp/job-create-layout-qa/candidate-5270/`.

- `results.json`: the complete fresh eighteen-case pass.
- `native/`: all twenty-two PNGs and eighteen `create-layout.json` / `create-style-bounds.json` attachments.
- `geometry-summary.json`: exact geometry plus all case JSON and screenshot paths/hashes.
- `actually-viewed-screenshots.json`: the twenty-two matrix screenshots actually opened for this review.
- `dynamic-description/observations.json` and the two `*-dynamic-description.png` images: supplemental native-state observations, separate from the eighteen test cases.

The final matrix command was:

```sh
PREVIEW_URL=http://127.0.0.1:5270 npm exec playwright test -- tests/job-schedule-create-layout-native.spec.ts --config=/tmp/job-create-layout-qa/candidate-5270/playwright.config.mts --workers=1 --max-failures=1
```

After the formal runner exited, a sequential native UI observation in each foundation's Nova phone preview opened Add Job with Enter, read the four placeholder attributes and initial descriptions, selected `Bath Remodel` through the real Select, and chose `Wednesday, October 28` through the existing Calendar. Due Date remained unselected (`Pick a day`) and the explanation updated to **`Defaults to Tue, Nov 10.`** in both foundations. The screenshots were actually viewed. Native Escape then closed the Sheet and restored the Add Job opener, with no recorded faults. These are two supplemental observations, not two additional permanent test cases or a job-submission claim; no mirror copy test was added to the repository.

## Historical production validation — candidate 5260

Browser plugin was not available. Rendered validation used repository Playwright with system `/usr/bin/chromium`, one worker, the original 30-second case and 5-second action budgets, zero retries and retained failure traces. The coordinator built candidate 5260; this QA handoff performed no build, dependency installation, runtime edit or Git write. Both `/` and `/base/` returned 200, and `/tmp/reui-5260-runtime.sha256` verified without differences before and after the run.

The flow under test is: Job Schedule → focus Add Job and Enter → correct Create frame and field rows → native Tab reaches every field, Cancel and Add Job while the fields scroll internally → Cancel or Escape → return focus to the original Add Job button. Existing original tests continue to exercise actual scheduled-job submission.

The independent layout specification has eighteen cases: two foundations × desktop/phone Nova (four full layout and keyboard cases), plus two foundations × the other seven styles at 390×844 (fourteen focused frame/column/inner-scroll bounds cases). The four Nova cases actually press Tab through Phone, Street, Town, Job Type, Lead, Start, Due Date, Cancel and Add Job, checking focused-control bounds at every step. Shift+Tab and Enter activate Cancel; reopening and Escape also restore the original Add Job opener. The other fourteen cases focus Due Date, verify that it lies within the internal field viewport, verify Cancel/Add Job are visible, and close with native Escape and return focus. They do not repeat the complete Tab sequence. This is a consumer-layout matrix, not a full business regression for every style.

The previous phone test's exact 390px Add Job width expectation is corrected to the intended 358px and strengthened with the 16px left position, allowing the existing native entrance animation to settle within the unchanged assertion budget. Its other grid, creation, calendar, focus and business assertions remain.

| Check                                     | Result                                                                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accepted original/local screenshots       | Both actually inspected; V04 inset/column difference confirmed.                                                                                            |
| First 5260 attempt, 12:39:35 UTC          | 0 passed, 1 failed, 17 not run. The preview-title oracle was wrong; layout and keyboard steps had not run. Original trace and result JSON retained.        |
| Corrected production matrix, 12:40:34 UTC | **18 passed, 0 failed/skipped/flaky, 112.393s total.** Only the title oracle changed; every layout, keyboard, focus, warning and error assertion remained. |
| Fresh screenshot review                   | All **22** PNGs actually opened: initial and keyboard-reached footer in each of four Nova cases, plus all fourteen other-style phone screenshots.          |
| Scoped checks                             | Scoped oxfmt/check, oxlint and diff whitespace checks passed.                                                                                              |
| Existing creation and related Job checks  | Separately coordinated V02/business suite; this eighteen-case run does not submit a real job or claim its result.                                          |
| Source/download                           | No source-target edit in this QA handoff; the existing forms dependency remains in the starter closure. No new archive build/run claim.                    |
| Release                                   | All eighteen-case browsers closed and the coordinated window was returned. Root owns commit, push, CI and deployment.                                      |

All sixteen phone cases measured `x=16`, `y=16`, `width=358`, `height=812`, `right=374`, `bottom=828`, with 14px top-left radius and root width exactly 390px. Client/Phone and Job Type/Lead occupy separate rows with matching horizontal positions and widths. Both Nova desktop cases measured `x=928`, `y=0`, `width=512`, `height=1000` at 1440×1000, retaining their two-column pairs and root width 1440px.

The two foundations produced the same initial phone field-group height/content measurements per style:

| Style | Field-group height / content (px) | Initial overflow behavior         |
| ----- | --------------------------------- | --------------------------------- |
| Nova  | 668 / 668                         | `overflow-y:auto`; all fields fit |
| Vega  | 664 / 707                         | Internal scroll needed            |
| Maia  | 628 / 707                         | Internal scroll needed            |
| Lyra  | 673 / 673                         | `overflow-y:auto`; all fields fit |
| Mira  | 641 / 641                         | `overflow-y:auto`; all fields fit |
| Luma  | 628 / 707                         | Internal scroll needed            |
| Sera  | 583 / 741                         | Internal scroll needed            |
| Rhea  | 632 / 675                         | Internal scroll needed            |

Larger styles' initial images intentionally show only the top portion of the internally scrolling form. Their Due Date focus assertions confirm the focused control is brought inside the field viewport, while the fixed footer remains visible. The saved JSON records the initial geometry, not a fabricated post-focus scroll position. No root horizontal overflow or browser page/console warning/error was reported by these cases.

## Evidence and title-oracle correction

The first attempt used the standalone `#/preview/...` route but asserted a title containing `Bricklane`. Its actual title was `Job Schedule — Preview`, as set by `src/components/site/block-preview.tsx`. Root authorized changing only that assertion to the exact preview title. The initial failure is a test oracle error, not a V04 product finding. No timeout, retry, native action or geometry threshold changed.

Evidence root: `/tmp/job-create-layout-qa/candidate-5260/`.

- `results.json` and `native/job-schedule-create-layout-76a36-ative-keyboard-reachability/{trace.zip,error-context.md}` preserve the initial one-failure/seventeen-unrun attempt.
- `title-oracle-fixed-results.json` records the complete eighteen-case pass. All fresh screenshots and per-case `create-layout.json` / `create-style-bounds.json` attachments are under `title-oracle-fixed/`.
- `geometry-summary.json` indexes all eighteen geometry attachments and all twenty-two PNG paths/hashes.
- `actually-viewed-screenshots.json` records the twenty-two screenshot files actually opened for this review. The count is not inferred solely from file generation.

The successful command was:

```sh
PREVIEW_URL=http://127.0.0.1:5260 npm exec playwright test -- tests/job-schedule-create-layout-native.spec.ts --config=/tmp/job-create-layout-qa/candidate-5260/title-oracle-fixed.playwright.config.mts --workers=1 --max-failures=1
```

Verified source/test SHA256:

| File                                                   | SHA256                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `src/blocks/data/grid-advanced-job-schedule-forms.tsx` | `282bd7e06e5236e1ff2d25f384dbffa93f76903bb4e3c38d69c8c836fa07448e` |
| `src/blocks/data/grid-advanced-job-schedule.tsx`       | `824dceaf05eda104fb851cb65f2aa464475941d61d0336e01ec5ce3799e475b7` |
| `tests/job-schedule-create-layout-native.spec.ts`      | `d84569645bf7b5dfb58b6c38e777cb860802e8c9e60c841dc3124be603022de2` |

## V04-P3-01: default empty-form copy — completed on 5270

The captured public reference `06-job-reference-phone-add.png` visibly supplies `Full name`, `(312) 555-0100`, `House number and street`, and `Town` placeholders. It also shows `Left empty, it matches the planned finish` below Due Date. Fresh 5260 Nova phone screenshots in both foundations still show blank Client/Phone/Street/Town inputs and no default Due Date helper. This is a confirmed visible copy difference; the existing labels and the tested keyboard path remain available.

Root authorized implementing **V04-P3-01** after the 5260 review. The existing local TextField now accepts an optional placeholder and passes it directly to the existing Input. Only Create (`!job`) supplies the four reference strings; Edit and other callers continue to pass no placeholder. The existing JobDateField/FieldDescription composition now supplies `Left empty, it matches the planned finish` for the initial Create form. Once type and start are selected, the existing `Defaults to <date>.` explanation remains. Edit retains no description from this change.

The explanation matches the unchanged submission rule `due: due || plannedFinish(type, start)`. No dates, required fields, save behavior, Select/Calendar implementation, assets or shared primitive are changed. Scoped oxfmt/check, oxlint and diff whitespace checks pass. The fresh 5270 eighteen-case pass, all twenty-two matrix screenshot views and the two dynamic-state observations close this follow-up for delivery. They do not establish complete form visual fidelity outside the stated scope.

Verified forms SHA256: `70610e5fecc95bf297faf0464527731cad32d16e07ebc9b069825161fa2dbefb`. The eighteen-case spec remains `d84569645bf7b5dfb58b6c38e777cb860802e8c9e60c841dc3124be603022de2`; no low-impact mirror test or relaxed assertion was added. The main consumer remains `824dceaf05eda104fb851cb65f2aa464475941d61d0336e01ec5ce3799e475b7`. The earlier source hashes in the historical section identify 5260, not this new forms revision.

Concrete historical 5260 evidence of the original copy difference:

- `title-oracle-fixed/job-schedule-create-layout-1dd95-ative-keyboard-reachability/create-radix-390.png`
- `title-oracle-fixed/job-schedule-create-layout-ba7f1-ative-keyboard-reachability/create-base-390.png`
- Both corresponding `create-footer-*-390.png` screenshots show the final reachable Add Job focus state and the missing default Due Date explanation.

## Ownership and limits

The original V04 implementation comprises `src/blocks/data/grid-advanced-job-schedule-forms.tsx`, the approved Create-only import/SheetContent hunks in `src/blocks/data/grid-advanced-job-schedule.tsx`, the intended phone geometry assertion hunk in `tests/grid-advanced-job-schedule.spec.ts`, the new layout spec and this document. Other main-file changes remain V02-owned. The 5260 QA handoff corrected only the new spec's title oracle and documented its result; the subsequent authorized copy repair changed only the forms leaf. Runtime stayed frozen during both browser windows. The candidate's separate shared Base Escape repair is owned and validated by the coordinator's other tasks, not claimed as a V04 implementation.

This run covers light-mode system Chromium at the stated widths, native field reachability and dismissal, consumer frame/columns/scrolling, and the visible screenshots. It does not establish all-style desktop fidelity, all-style full keyboard sequences, actual submission/save, every Select/Calendar interaction, other browsers or complete accessibility conformance. ReUI free-component reuse and Bricklane's original brand remain as described above.
