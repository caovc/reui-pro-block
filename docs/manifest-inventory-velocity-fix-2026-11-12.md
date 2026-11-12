# Manifest Inventory velocity tick fix (VT-MAN-001 / P2)

Current status: the rebuilt 5260 candidate passed all ten native cases on the first run with the opt-in 16px margin and stronger 2px real inner-gutter assertion. Both foundations also passed same-candidate Inter/Arial fallback probes. The preceding CI run `43205749833` and 8px local results remain separate evidence; a new CI/deployment pass is not claimed here.

Historical 5220 acceptance on both foundations: Radix's five native cases have passing evidence from an initial four passes plus one focused pass; the initial phone-login click timeout before chart entry is retained and is not relabeled as a clean initial suite. Base's corresponding five cases all passed in one run through the real `/base/` entry. Both foundations used the same frozen 8px-margin runtime, unchanged assertion/action/test budgets and failure tracing. The parameterized formal suite collects ten cases.

## Evidence and cause

The 2026-11-12 same-state 390px screenshots were opened and visually reviewed:

- Reference: `/tmp/reui-visual-audit/templates/13-manifest-source-dashboard-full-390.png`.
- Local before: `/tmp/reui-visual-audit/templates/14-manifest-local-dashboard-full-390.png`.

The reference shows four readable category ticks while retaining all seven bars. The local chart forced `XAxis interval={0}`, placing all seven long category labels in a narrow plot and causing collisions. The audit's `tick-rect-measurements.json` records three intersecting label pairs, approximately 20.20px, 7.84px and 10.57px wide (P2). Live reference reporting values differ from local snapshot data; those differences are outside this fix. Bricklane branding and original local artwork are retained.

## Fix and actual free component reuse

`BusinessBars` has an optional `responsiveAxis` prop, enabled explicitly by Manifest and Atlas Threat Vectors. This path composes the existing `ChartContainer → BarChart → Bar/Cell` and `ChartTooltip → ChartTooltipContent` implementations, following the official free [ReUI c-chart-2](https://reui.io/r/radix-nova/c-chart-2.json) / [c-chart-3](https://reui.io/r/radix-nova/c-chart-3.json) composition already adapted elsewhere in the repository. It continues to render the actual free `ReuiStripePattern` extraction. The local helper itself is not an official ReUI component; the retained upstream MIT notice is in `src/components/reui/REUI-LICENSE.txt`.

Recharts natively measures and filters tick labels using `interval="preserveEnd"` and `minTickGap={8}`. `ResponsiveContainer` is provided once by `ChartContainer`. The chart keeps its existing dimensions, seven data rows and bars, striped colors, numeric values, tooltip semantics, and native accessibility layer. Every Manifest bar has an accessible category/value name; hidden axis ticks remain available through hover and keyboard tooltip navigation. No viewport-specific category list or custom chart geometry is introduced.

The default `responsiveAxis={false}` retains the previous `ResponsiveContainer` and native tooltip path with `interval={0}` for Surge and all other consumers without the explicit prop. No new source module, route, dependency or global UI implementation was added.

The visual audit subsequently confirmed a related density issue in Atlas Threat Vectors (`37-atlas-source-home-charts-settled-390.png` / `38-atlas-local-home-charts-settled-390.png`, also opened and reviewed). Only Beacon/Day0 geometrically intersect, by 0.1953px; the other labels are close but do not intersect. This related sub-case is tracked under VT-MAN-001. The shared opt-in supports that consumer's nine categories and both existing series, retaining all 18 bars with accessible category/Blocked/Watched values. The Atlas owner applies the consumer opt-in in `atlas.tsx`; that work is coordinated separately and does not change the default of the shared `Bars` wrapper.

Candidate rendering also exposed a small end-label boundary issue: at 390px, Manifest's Outerwear tick extended 2.30px beyond the chart container into the card's internal padding. It remained visible and did not overflow the page. The opt-in chart now reserves a 16px right margin for the final tick; the default path keeps its original zero margin. The initial 4px attempt was insufficient and the subsequent 8px margin passed locally but failed CI, as recorded below. This does not change the data, font, tick-selection policy or outer chart dimensions. The final CI follow-up section describes the pending candidate.

## Validation status

The focused native suite contains ten tests: each foundation has Manifest at 390×844 and 1440×1000, Atlas at both widths, and Surge's unchanged default path at 390px. `describe` groups identify Radix and Base, and an explicit entry prefix navigates to `/#/template-preview/...` or `/base/#/template-preview/...`; absolute root paths do not swallow Base's entry. It checks non-overlapping ticks, complete desktop labels, retained data and accessible bar names, every category's keyboard/pointer tooltip, bars within the chart, absence of page overflow and application runtime faults, and preservation of the plot/SVG dimensions. Manifest retains its existing 320px/369.5px plot heights; Atlas retains 218px at both widths. The action timeout is 5 seconds, the test timeout remains 30 seconds, retries remain zero, and failure tracing remains enabled. Ten-case collection, scoped formatting and lint passed before Base browser execution.

Browser plugin not available; validation used installed system Chromium (`/usr/bin/chromium`) through Playwright and a temporary configuration inheriting the repository configuration. The initially requested bundled Chromium executable was absent, so that first attempt failed before opening a business page. Its artifacts remain in `/tmp/manifest-axis-qa-2026-11-12` and are not business-test results.

The first system-Chromium run found a test locator error: installed Recharts 3.10.1 places tick labels in a separate `recharts-xAxis-tick-labels` layer, so the old descendant selector returned no labels. The selector was corrected from captured trace DOM, keeping the geometry and data assertions. Those rejected-run traces remain in `/tmp/manifest-axis-qa-system-2026-11-12`. Earlier notes referred to the dependency's `^3.8.0` range as its version; both the lockfile and installed package resolve to 3.10.1.

The corrected suite ran against `http://127.0.0.1:5200`, using one worker. Results before the extra 4px margin:

| Case          | Result                                                                                                                                                | Evidence                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Manifest 390  | Failed the strict end-label boundary assertion by 1.30px beyond its 1px tolerance; four readable ticks, seven bars and original SVG height rendered.  | `manifest-inventory-velocit-732ff-d-all-seven-accessible-bars/first-failure.png` and `trace.zip` |
| Manifest 1440 | Passed complete seven labels, seven accessible bars, every keyboard/pointer tooltip and SVG/plot size equality.                                       | `manifest-inventory-velocit-398c6-d-all-seven-accessible-bars/manifest-velocity-1440.png`        |
| Atlas 390     | Passed readable ticks, all nine categories in both series, 18 bounded bars and every keyboard/pointer tooltip; SVG and plot both retain 218px height. | `manifest-inventory-velocit-256b2-e-categories-in-both-series/atlas-threat-vectors-390.png`      |
| Atlas 1440    | Passed complete nine labels, all 18 bounded bars and readouts, and original SVG/plot dimensions.                                                      | `manifest-inventory-velocit-676b8-e-categories-in-both-series/atlas-threat-vectors-1440.png`     |
| Surge 390     | Passed the existing seven ticks and native tooltip without the optional chart container.                                                              | Passed native regression case.                                                                   |

All paths in that table are relative to `/tmp/manifest-axis-qa-pass-2026-11-12`. The four passing cases had no browser console warning/error or pageerror. This is not a complete acceptance pass: the Manifest phone failure prompted the 4px margin, and both consumers at both widths will be checked again against the parent's next frozen candidate. A later font-probe runner stopped before the dashboard because its login precondition was not ready; it provides no application evidence and closed its browser in `finally`.

The reviewer actually opened the current-round desktop/phone reference and pre-fix images: Manifest pairs `05/06` and `13/14`, and Atlas pairs `15/16` and `37/38` under `/tmp/reui-visual-audit/templates`. These confirm the prior collisions and the deliberate Bricklane branding, local fixture values and original substitute artwork. No reference screenshot or paid media is imported into the application or downloadable project.

Scoped `oxlint`, `oxfmt --check`, `git diff --check`, and five-case Playwright test collection passed after the test corrections.

### 5210 candidate: 4px margin insufficient

The rebuilt `http://127.0.0.1:5210` candidate was tested with the same five-case suite, one worker, system Chromium and unchanged budgets/tracing. Manifest desktop, Atlas at both widths and Surge passed again, including all required keyboard/pointer readouts and runtime checks. Manifest 390px still failed the original end-label boundary assertion: Outerwear's right edge remained 359.296875px against the container's right edge of 357px. The trace confirms the 4px margin was included: the final bar moved from SVG x281.4171/width39 to x277.9429/width38, while Recharts' `preserveEnd` still placed the last tick against the same chart viewBox edge. The 4px change therefore does not complete acceptance.

Artifacts are in `/tmp/manifest-axis-final-5210-2026-11-12`, using the same case-directory names as the table above. The reviewer opened all four current-run images: Manifest's 390px failure viewport and 1440px chart, and both Atlas chart screenshots. There are no visible tick collisions; every bar is retained. The single boundary failure remains explicit and is not reclassified as a pass. The browser runner finished and the window was released immediately to root for the next owner.

### Native margin derivation and next candidate

Read-only inspection of installed Recharts 3.10.1 explains the unchanged label position. `getTicksEnd` in `node_modules/recharts/es6/cartesian/getTicks.js` computes the last label's excess as `coordinate + measuredWidth / 2 - end`, then shifts it to `end - measuredWidth / 2` when positive. `selectAxisViewBox` in `state/selectors/selectChartOffsetInternal.js` supplies the entire SVG width; `selectXAxisRange` in `axisSelectors.js` separately subtracts plot margin and axis padding. Changing the margin does not change the boundary used by `getTicksEnd`.

For the actual 5210 Manifest phone state, the container starts at x33 and has width W=324, so its right edge is 357. Seven category bands and margin m give a natural last-category anchor `c = (324 - m) × 6.5 / 7`. With m=4, c=297.142857, but the captured text/tspan x is 295.984375. The last-label clamp therefore implies a Recharts measured width of `2 × (324 - 295.984375) = 56.03125px`. The actual failed DOM right edge of 359.296875 gives an effective extent to the right of the SVG text anchor of `359.296875 - 33 - 295.984375 = 30.3125px`. Mirroring that extent would give an equivalent width of 60.625px, but that is not a directly measured bounding-box width: SVG glyph bounds can be asymmetric around the anchor. Final 5220 DOM measurements below report the actual Outerwear bounding-box width as 60.1484375px. These figures describe this Chromium viewport after the test awaited `document.fonts.ready`, not every browser or font state.

Avoiding the native clamp requires `c + 56.03125 / 2 ≤ 324`, equivalent to m≥5.247596. Fully containing the actual glyphs also requires `c + 30.3125 ≤ 324`, equivalent to m≥7.721154. An integer margin of 7 would predict right x357.669643: within the test's existing 1px rounding tolerance, but still outside the actual container. The smallest integer satisfying complete containment is 8. It predicts anchor x293.428571 within the SVG and right x356.741071 in the viewport, approximately 0.259px inside the container. The only subsequent implementation change is therefore the opt-in right margin from 4 to 8; zero remains the default.

This calculation supported the next candidate but did not itself establish a rendered pass. No browser was opened during this source/trace analysis. The actual 5220 run follows; browser/font/viewport states outside the measured cases remain unverified.

### 5220 Radix rendered acceptance

The frozen `http://127.0.0.1:5220` candidate was tested using `.qa/onboarding.playwright.config.ts`, system Chromium, one worker, 30-second tests, 5-second actions, zero retries and the repository's failure tracing. JSON reporting was added to preserve the existing geometry and runtime-fault attachments; no source or test change was made between the initial and focused runs.

- Initial complete suite: four passed; Manifest 390px failed at its native Log in click after 5 seconds, before entering the dashboard. The original trace and screenshot remain in `/tmp/manifest-axis-final-5220-2026-11-12/manifest-inventory-velocit-732ff-d-all-seven-accessible-bars/`.
- Immediate focused Manifest 390px run: passed in 16.774 seconds with the same candidate and budgets, including login, all geometry assertions, all seven keyboard/pointer tooltips and zero runtime faults. Artifacts are in `/tmp/manifest-axis-focused-5220-2026-11-12/manifest-inventory-velocit-732ff-d-all-seven-accessible-bars/`.
- Reports: `/tmp/manifest-axis-final-5220-results.json` and `/tmp/manifest-axis-focused-5220-results.json`. The decoded six result records, including the retained initial login failure, are in `/tmp/manifest-axis-5220-geometry-summary.json`.

| Verified case     | Visible ticks / retained bars | Minimum actual tick gap    | Plot and SVG dimensions                                           |
| ----------------- | ----------------------------- | -------------------------- | ----------------------------------------------------------------- |
| Manifest 390      | 4 / 7                         | 8.96318px                  | Both 324×320px                                                    |
| Manifest 1440     | 7 / 7                         | 34.22989px                 | Plot 712.65625×369.5px; SVG 713×370px, each difference within 1px |
| Atlas 390         | 6 / 18                        | 6.33768px                  | Both 324×218px                                                    |
| Atlas 1440        | 9 / 18                        | 21.36029px                 | Both 526×218px                                                    |
| Surge 390 default | 7 / 7                         | Existing default unchanged | Existing native tooltip path passed                               |

Manifest's phone Outerwear rectangle is x296.592621 to x356.741058, width 60.1484375px. The chart's right edge is 357px, so the final label is approximately 0.258942px inside the container, matching the predicted right edge. All seven Manifest category/value readouts and all nine Atlas categories in both series remain available by native arrow-key and pointer tooltip navigation. The passing cases had empty console warning/error and pageerror attachments, meaningful intended page content, no framework overlay, and no document-width overflow. The Atlas container position was recorded before pointer navigation and its later SVG/plot position after hover-driven scrolling; the width/height comparison is unaffected by that vertical scroll.

The reviewer opened all four final images: the focused `manifest-velocity-390.png`, plus `manifest-velocity-1440.png`, `atlas-threat-vectors-390.png` and `atlas-threat-vectors-1440.png` from the initial run's corresponding case directories. They were compared with the same-width private reference/before evidence already listed above. Both phone axes are readable, desktop retains every label, and the original Bricklane fixture artwork/brand and plot dimensions are preserved. The differing Atlas phone tick selection is native label avoidance; every underlying category and bar remains present.

The Radix five-case scope has passing evidence across the initial and focused runs. The initial login-action timing failure remains a disclosed limitation; this record does not claim a clean first suite or all-viewports/all-browsers verification. All browser sessions were closed and the reserved window released before document work. No paid reference media was added, and root coordinates the final Git milestone with Atlas's explicit consumer opt-in.

### 5220 Base rendered acceptance and handoff

After the explicit foundation parameterization collected ten tests, Base's named five-case group was run against the same frozen 5220 build. The helper used `/base/#/template-preview/manifest` and `/base/#/template-preview/surge`; Atlas used `/base/#/template-preview/atlas`. The tests assert those actual URLs. The Base run passed all five tests on its first execution in 54.833 seconds, using one worker, the unchanged 30-second test and 5-second action budgets, zero retries and retained failure tracing.

| Base case     | Result / duration | Actual geometry                                                                                                               |
| ------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Manifest 390  | Passed, 8.397s    | Four ticks, seven bars, minimum tick gap 8.96318px; Outerwear right 356.741058 inside right edge 357; SVG/plot both 324×320px |
| Manifest 1440 | Passed, 12.109s   | All seven ticks and bars, minimum gap34.22989px; SVG/plot dimension differences under 1px                                     |
| Surge 390     | Passed, 3.095s    | Original seven-tick/default tooltip path retained                                                                             |
| Atlas 390     | Passed, 14.860s   | Six ticks, all eighteen bars and nine category readouts, minimum gap6.33768px; SVG/plot both 324×218px                        |
| Atlas 1440    | Passed, 13.813s   | All nine ticks and eighteen bars, minimum gap21.36029px; SVG/plot both 526×218px                                              |

Every Base category/series keyboard and pointer tooltip assertion passed, and all five runtime-fault attachments are empty arrays. The actual measured tick rectangles and dimensions match the Radix cases. The reviewer opened all four Base chart screenshots and compared them with the same-width Radix and private reference evidence; no visible tick collision, clipped end label, lost bar or changed chart height was found. Branding, local fixture values and original artwork remain deliberate boundaries.

Base artifacts:

- JSON report: `/tmp/manifest-axis-base-5220-results.json`.
- Decoded geometry/runtime summary: `/tmp/manifest-axis-base-5220-geometry-summary.json`.
- Manifest phone: `/tmp/manifest-axis-base-5220-2026-11-12/manifest-inventory-velocit-afa1b-d-all-seven-accessible-bars/manifest-velocity-390.png`.
- Manifest desktop: `/tmp/manifest-axis-base-5220-2026-11-12/manifest-inventory-velocit-50f13-d-all-seven-accessible-bars/manifest-velocity-1440.png`.
- Atlas phone: `/tmp/manifest-axis-base-5220-2026-11-12/manifest-inventory-velocit-a8952-e-categories-in-both-series/atlas-threat-vectors-390.png`.
- Atlas desktop: `/tmp/manifest-axis-base-5220-2026-11-12/manifest-inventory-velocit-6ad5f-e-categories-in-both-series/atlas-threat-vectors-1440.png`.

The runtime files `charts.tsx` and `manifest-dashboard.tsx` stayed frozen throughout both foundation runs. Subsequent formal test changes only parameterized the foundation entry and kept the same assertions; scoped formatting, lint, diff checks and ten-case collection passed. The browser was closed and its window released immediately after Base execution. The four owned files are ready for root's coordinated Git milestone together with `atlas.tsx`'s explicit chart consumer opt-in. Other browser/viewports, dark mode and broader source/export gates remain outside this focused acceptance; root tracks those separately.

## CI end-label follow-up: 16px margin candidate

The user supplied the actual shard-3 failure from CI run `43205749833`: both Radix and Base Manifest 390px cases failed the unchanged `tick.right <= box.x + box.width + 1` assertion with expected≤358 and actual 358.4285583496094. The label therefore exceeded the actual container right edge 357 by 1.428558px. The prior local right 356.741058 had only 0.258942px clearance. No CI trace or screenshot could be retrieved through the current artifact redirect path; the CI's exact text anchor, computed font and glyph rectangle have not been observed. Its two reported failures are not replaced by the local passing evidence.

### Font measurement evidence and limits

The installed and locked Recharts version is 3.10.1. `getTicksEnd` uses `getStringSize` from `DOMUtils.js`, which appends a hidden measurement span directly to `document.body` and caches widths. The axis passes font size and letter spacing, but does not pass the SVG tick's computed font family or weight. The cache key also does not track completed font loading. In this application, the body inherits Geist Variable from the host, while `src/templates/reference.css` preserves Inter, Arial, sans-serif on `.template-surface`. A measurement at the body and a glyph rendered inside the template therefore do not share a guaranteed font-metrics contract. This is an evidenced weakness in the native measurement boundary; it does not establish the exact unobserved CI font.

A short read-only browser probe used the original 5250 candidate at 390×844, waited for `document.fonts.ready`, inspected the default Inter axis, then temporarily applied Arial only to the axis and resized back to 390px to exercise the native layout. The probe closed its browser in `finally`. Both resulting screenshots were opened and inspected.

| 5250 probe                        | Measured result                                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Body and hidden span              | Geist Variable; 12px Outerwear span width 58.21875px                                                                               |
| Default SVG tick                  | Inter at 12px, weight 400; actual glyph bbox width 60.1484375px; anchor 293.428571; right 356.741058; inner clearance 0.258942px   |
| Temporary Arial fallback SVG tick | Arial at 12px, weight 400; bbox width 56.03125px; unchanged native anchor 293.428571; right 354.444183; inner clearance 2.555817px |
| Data and runtime                  | Seven bars retained, no tick collisions or page overflow, no console warning/error or pageerror                                    |

Canvas was used only as an additional diagnostic in that probe. With the computed Inter font, its advance was 59.666016px while its actual right glyph bound was 60.148438px, matching the SVG glyph extent rather than the advance. The Geist diagnostic advance was 58.212418px; the Arial diagnostic advance was 56.021484px. Recharts' installed `getTicksEnd` path does not use Canvas, and a Canvas advance is not treated as an actual SVG bounding box. Probe evidence is `/tmp/manifest-axis-5250-font-probe/evidence.json`, with inspected `inter.png` and `arial-fallback.png` in the same directory. Auxiliary Pillow/FreeType font-file measurements agreed on the family differences but are not browser or CI measurements.

### Product gutter and minimal native change

The product constraint is a fully retained Outerwear tick with at least 2px of actual empty space before the chart's right edge. All pre-existing bounds, collision, bar-count, data, accessible-name, keyboard and pointer assertions remain. The dedicated phone case additionally checks that its final tick is still Outerwear and that `finalTick.right <= container.right - 2`. The original `+1` assertion is unchanged; no budget, retry, trace, font, category or value is changed.

For the observed 324px plot and seven categories, the unclamped final anchor with margin m is `(324 - m) × 13 / 14`. At the old m=8 this is 293.428571. If the unobserved CI anchor remained at that native coordinate, the reported CI right 358.428558 with container x33 implies an effective rightward extent of approximately 31.999987px. This is a conditional inference, not a measured CI anchor or font. Under that observed-bound estimate, mere containment needs m≥9.53845, while the 2px product gutter needs m≥11.69229. Margin 10 would leave only 0.428585px clearance; the smallest integer meeting the 2px target is 12, predicting right 354.714273 and clearance 2.285727px for that CI extent.

Twelve pixels is the mathematical minimum for that single observed-bound estimate, not the adopted product margin. Its 0.285727px surplus over the new 2px assertion would repeat the earlier fragile fit to one environment. The implementation instead uses the normal 1rem spacing step, 16px, to allow additional font and browser glyph variation. Under the same explicit CI-anchor assumption, m=16 gives anchor 286, predicted right 350.999987 and actual inner clearance 6.000013px: approximately 4px beyond the 2px product requirement. The locally measured Inter and Arial extents predict clearances 7.6875px and 9.984375px respectively. These are predictions pending the rebuilt candidate; the exact CI metrics remain unobserved.

Only the opt-in native `BarChart` right margin changes from 8 to 16. The default remains 0, the template's Inter styling remains intact, and Atlas retains all nine categories and both series. The actual free `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, Recharts composition and MIT-attributed `ReuiStripePattern` stay in use. No custom tick renderer, global measurement override, vendor patch or canvas-based layout replaces them.

The 16px runtime and stronger dedicated phone assertion were frozen for root's combined 5260 build after ten-case static collection and scoped formatting/lint/diff checks passed. The native and font-probe results on that rebuilt candidate follow. This record makes no new CI-pass, merge, push or deployment claim.

### 5260 final native and fallback acceptance

Root reported successful full TypeScript checks and both production builds, with the frozen runtime inventory at `/tmp/reui-5260-runtime.sha256` matching the candidate served at `http://127.0.0.1:5260`. After the explicit browser-window handoff, the formal owned suite ran once against both real entries, `/#/` and `/base/#/`, using system Chromium, one worker and the unchanged 30-second test/5-second action budgets, zero retries and retained failure tracing. All ten cases passed on that first run in 122.492 seconds; there were no reruns or skipped cases.

The passing assertions include the original tick bounds and collision checks, complete desktop labels, seven Manifest bars, eighteen Atlas bars with all nine categories in both series, every required accessible name and keyboard/pointer tooltip, original plot/SVG dimensions, document-width bounds and Surge's unchanged default tooltip path. Both Manifest phone cases additionally retain the final Outerwear tick and pass the stronger actual 2px inner-gutter requirement. All ten runtime-fault attachments are empty arrays.

| Surface and width, both foundations | Visible ticks / bars | Minimum actual tick gap | Final-label inner clearance | Retained plot dimensions                                           |
| ----------------------------------- | -------------------- | ----------------------- | --------------------------- | ------------------------------------------------------------------ |
| Manifest 390px                      | 4 / 7                | 7.820313px              | 7.6875px                    | 324×320px, SVG matches                                             |
| Manifest 1440px                     | 7 / 7                | 33.087067px             | 35.129456px                 | 712.65625×369.5px, SVG 713×370px within the original 1px tolerance |
| Atlas 390px                         | 5 / 18               | 38.835068px             | 18.337677px                 | 324×218px, SVG matches                                             |
| Atlas 1440px                        | 9 / 18               | 20.471313px             | 29.559937px                 | 526×218px, SVG matches                                             |

Atlas's phone tick selection remains native `preserveEnd` filtering; its five currently visible ticks do not remove any of its nine categories, eighteen bars or tooltip readouts. The reviewer opened all eight native chart screenshots from this exact run, covering both widths under both foundations. They show readable labels, retained data, desktop full labels and unchanged chart height. No reference media was added to the application or export.

After the native runner ended, one browser sequentially probed the same 5260 artifact under each foundation with its default Inter axis and a temporary Arial fallback axis. A 391→390 viewport change exercised native layout after the fallback style; all measurement occurred after fonts were ready. Each of the four states retained all seven named nonzero bars and the final Outerwear tick, passed every visible tick's original bounds, non-overlap and actual 2px end-gutter checks, and had no page overflow or runtime warning/error. The temporary override existed only inside the probe's browser page.

| Foundation | Probe font     | Minimum actual tick gap | Actual end-label inner clearance |
| ---------- | -------------- | ----------------------- | -------------------------------- |
| Radix      | Inter          | 7.820313px              | 7.6875px                         |
| Radix      | Arial fallback | 9.632813px              | 9.984375px                       |
| Base       | Inter          | 7.820313px              | 7.6875px                         |
| Base       | Arial fallback | 9.632813px              | 9.984375px                       |

The probe's browser was closed in `finally`; the formal runner had already closed before the probe began. Root was told immediately when the sole browser window was released. All four fallback-probe screenshots were subsequently opened and inspected, alongside their actual font and geometry JSON. The runtime and test hashes remained frozen throughout; only this document was updated with results.

Evidence paths:

- Complete native report: `/tmp/manifest-axis-final-5260-results.json`.
- Decoded native geometry/runtime attachments: `/tmp/manifest-axis-final-5260-geometry-summary.json`.
- Radix screenshots under `/tmp/manifest-axis-final-5260-2026-11-12/`: Manifest phone `manifest-inventory-velocit-458a1-d-all-seven-accessible-bars/manifest-velocity-390.png`, desktop `manifest-inventory-velocit-43379-d-all-seven-accessible-bars/manifest-velocity-1440.png`; Atlas phone `manifest-inventory-velocit-362cd-e-categories-in-both-series/atlas-threat-vectors-390.png`, desktop `manifest-inventory-velocit-782ca-e-categories-in-both-series/atlas-threat-vectors-1440.png`.
- Base screenshots under the same root: Manifest phone `manifest-inventory-velocit-afa1b-d-all-seven-accessible-bars/manifest-velocity-390.png`, desktop `manifest-inventory-velocit-50f13-d-all-seven-accessible-bars/manifest-velocity-1440.png`; Atlas phone `manifest-inventory-velocit-a8952-e-categories-in-both-series/atlas-threat-vectors-390.png`, desktop `manifest-inventory-velocit-6ad5f-e-categories-in-both-series/atlas-threat-vectors-1440.png`.
- Same-artifact font probe: `/tmp/manifest-axis-5260-font-probe/evidence.json`, plus inspected `radix-inter.png`, `radix-arial-fallback.png`, `base-inter.png` and `base-arial-fallback.png` in that directory. The diagnostic runner is `/tmp/manifest-axis-5260-font-probe.mjs`.

This is a focused local acceptance pass on the rebuilt production artifact. It provides a wider actual glyph margin than the preceding 8px fit and preserves all previous behavioral checks. The exact earlier CI font/anchor is still unobserved, and root must track the new CI result and deployment separately. No working files outside the owned chart/test/document scope were changed for this follow-up, and no Git write was performed by the reviewer.
