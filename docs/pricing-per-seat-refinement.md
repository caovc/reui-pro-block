# Pricing 3 — Per-Seat Pricing refinement

Scope: `pricing-per-seat.tsx`, `pricing-per-seat.css`, its focused Playwright spec, and this record. Public reference checked on 26 October 2026: [Pricing 3 brief](https://reui.io/blocks/marketing/pricing/pricing-3) and its [independent Base preview](https://reui.io/preview/base/pricing-3). This is Bricklane's independent implementation; no official identity or endorsement is implied.

## Reference findings before implementation

The old generic index-2 implementation did not reproduce this block. It used different plan names, monthly/yearly controls, five arbitrary seat counts, and invented purchase/confirmation dialogs. The actual preview has a quote, Solo/Startup/Growth/Enterprise tabs, Free/Pro/Ultimate plans, thirteen aligned comparison rows, two disabled owned-plan buttons, a refunds link, and mobile plan cards. `PerSeatPricing` implements that separate structure. Shared routing and source selection are left to the coordinating parent; they were not changed in this scope.

The default is Startup. All four desktop and mobile tab states were actually clicked and recorded. Every paid total is its selected rate times its selected seat count; original list prices always use the Solo rate times that count.

| Team       | Seats on paid plans | Pro rate / total / list | Ultimate rate / total / list |
| ---------- | ------------------- | ----------------------- | ---------------------------- |
| Solo       | 1                   | $28 / $28 / no strike   | $48 / $48 / no strike        |
| Startup    | 5                   | $26 / $130 / $140       | $45 / $225 / $240            |
| Growth     | 15                  | $24 / $360 / $420       | $42 / $630 / $720            |
| Enterprise | 40                  | $22 / $880 / $1,120     | $39 / $1,560 / $1,920        |

Free stays at $0, one seat, and unchanged limits. Shared workspaces and seat management are unavailable on Solo for every plan; they become included on paid plans with more than one seat. Pro's “Included in your package” and Ultimate's “Current Package” stay disabled at every team size. The selected seat model drives totals, per-seat captions, the Analyst seats row, and teammate entitlements together.

Desktop feature help was actually hovered for all thirteen rows. It provides the observed explanatory text, including non-seat-counting viewers, event properties, retention archive, integration sources, report templates, dashboard date range, threshold checks, replay, teammate gating, warehouse cadence, SSO seat creation, and business-hour support timing. Local tests cover mouse and keyboard help, portalled Inter inheritance, and the actual owned/price/feature states.

Fernhill, Start Free, all seven feature-row document links, and 30-day refunds are literal hash placeholders in the observed preview. All ten desktop links were clicked; no checkout, dialog, toast, or purchase state was produced. The reference's hash scrolling can animate. Local anchors explicitly prevent hash-route replacement and scroll to the top, keeping the gallery route intact. No payment or confirmation screen was invented. Mobile document links use the observed inline arrow treatment.

A fresh reference keyboard probe found that ArrowRight **selects** the next team immediately; Enter keeps it selected. This supersedes the free overview's older Base keyboard note. The implementation keeps the installed Tabs primitive's automatic activation rather than forcing a custom manual mechanism.

## Actual free ReUI reuse, inspected before implementation

The following complete free examples were downloaded, read, and used as the composition basis. They explicitly depend on stock primitives; this record does not relabel those stock files as bespoke ReUI primitives.

| Official free source                                                                   | Local implementation and actual use                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [c-tabs-1](https://reui.io/r/radix-nova/c-tabs-1.json)                                 | `ui/tabs.tsx` Tabs → TabsList/Trigger → TabsContent composition, controlled by `TeamChooser`. Real native selection, ARIA relationships, roving focus, and keyboard activation are used. Both desktop and mobile presentations share the same team state. |
| [c-card-1](https://reui.io/r/radix-nova/c-card-1.json) and c-tabs-1's Card composition | Existing `ui/card.tsx` Card/Header/Title/Description/Content anatomy is rendered for all mobile plans; Card/Content contain the desktop comparison. Existing ring, surface, inset spacing and semantic slots are retained and configured.                 |
| [c-table-1](https://reui.io/r/radix-nova/c-table-1.json)                               | Existing `ui/table.tsx` Table/Header/Body/Row/Head/Cell map the actual plan and feature data. No substitute div grid, table library, or hand-rolled scrolling primitive replaces it.                                                                      |
| [Badge](https://reui.io/r/radix-nova/badge.json)                                       | Actual official `components/reui/badge.tsx`, used for success Best Value, outline counts, and secondary numeric/period values. Official CVA owns colors, shape, sizing, focus and disabled treatment.                                                     |
| [c-avatar-1](https://reui.io/r/radix-nova/c-avatar-1.json)                             | Existing Avatar → AvatarImage + AvatarFallback composition displays the endorsement's original local `demoAvatar("Nora Vale")` illustration and NV fallback. The free example's photograph is not copied.                                                 |
| [c-tooltip-1](https://reui.io/r/radix-nova/c-tooltip-1.json)                           | Existing TooltipProvider → Tooltip/Trigger asChild Button → TooltipContent, with real hover/focus/dismissal behavior. Portal content explicitly receives `reui-reference` and a block-specific width class.                                               |
| [c-separator-1](https://reui.io/r/radix-nova/c-separator-1.json)                       | Existing Separator separates mobile purchase content from the feature list.                                                                                                                                                                               |

The inspected official samples do not supply a free per-seat pricing block, a rate catalog, owned-plan gating, thirteen entitlements, or the Pro-specific desktop/mobile arrangement. Those remain independent instance data and responsive composition around the actual available free components. The plan selector is not rebuilt from click handlers on generic elements. The tooltip mechanism is not rebuilt with custom hover state. The official Badge source is actually rendered; it is not replaced by a renamed stock Badge.

Original retrieved free-source content SHA-256 values (before repository formatting):

| Source        | SHA-256                                                            |
| ------------- | ------------------------------------------------------------------ |
| badge         | `c534319459b74f4f11bbf8ddcd7aedba98631789aa6d7ffa8a7978ba91760b93` |
| c-tabs-1      | `cbfe3e727aeae0df0cbf65a7358070b64457d6cb6850e65a3b128ad5fc07044e` |
| c-card-1      | `8bea860b37b3645c4f469ec45920e27e7546868532e4acb3ec9ae8bbafb97f8d` |
| c-table-1     | `5117b83fa8d0ea79d653c0ae5759adc04b5642caebccff7aec2469aa2a72dc35` |
| c-avatar-1    | `0e06aa37979dcdfd69585a18d40e322d1b9ee973f3adb898042e9f273749ffb7` |
| c-tooltip-1   | `04f2f00fc8ab0cc2531b654421f975954161f0f35a2f24ea0b6fc96802705244` |
| c-separator-1 | `786fba5114107d61c1c7062b9e6e09326dbd283fbb2f741e9fe7b1360eb53406` |

The installed shared components, tokens, MIT notices and Inter OFL files were not modified. No original avatar, paid screenshot, decorative graphic, extracted SVG, ReUI/KeenThemes logo, or vendor wordmark was loaded or distributed by the new component. Reference screenshots exist only as temporary audit evidence outside the repository. Full-family archive cleanup and source-target wiring are separate coordinated concerns, not certified merely by this module's imports.

## Measured visual comparison

The reference and independent local implementation were inspected side by side with `view_image`, at 1280×1100 and 390×844. Both desktop initial full-page images are 1280×1419; mobile full-page images are 390×2718. Measured initial geometry:

| Element                                                | Reference and local                                             |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| Desktop quote                                          | x345.78125/y100, 588.421875×66; Inter 24px/33px, weight 600     |
| Desktop author group                                   | x527.515625/y190, 224.953125×40; original local avatar at 40×40 |
| Desktop main Card                                      | x96/y294, 1088×977; 14px radius                                 |
| Desktop team tabs                                      | x112/y362, 258.265625×32; 10px outer and 8px trigger radii      |
| Desktop table titles / descriptions / prices / buttons | rows at y294 / y354 / y413 / y474                               |
| Mobile Free Card                                       | x16/y378.5, 358×713.75                                          |
| Mobile Pro Card                                        | x16/y1116.25, 358×714.75                                        |
| Mobile Ultimate Card                                   | x16/y1855, 358×714.75                                           |

The visual pass corrected first-row table geometry, a missing first-column divider, the comparison-header bottom rule, mobile balanced quote wrapping, table value alignment, and explicit native active-tab styling. Copy, hierarchy, neutral surface/primary colors, green inclusions/Badge, font sizes/weights/line breaks, spacing, row structure, border/radius, icon metaphor, disabled controls, and mobile continuation were checked. No visible copy was added above the reference's quote. The entire quote text remains the public sample; the avatar is intentionally original.

Material intentional differences: the endorsement avatar is a Bricklane-generated illustration; installed Radix and reference Base twins can differ in popup arrow geometry, animation, focus rings, and subpixel glyph rendering. Reference-native hash-scroll easing is not reproduced. Dark mode, other ReUI style twins, every intermediate width, and a real checkout/backend are outside this check. No synthetic fidelity percentage or exhaustive pixel-identity claim is made.

## Candidate and checks

A read-only `git archive` of committed HEAD `3f7d0246c3d7bea010b6b0994db7565f5b763ec0` was expanded under `/tmp/bricklane-pricing-per-seat/candidate`. Only this component/CSS were overlaid and the **candidate-only** pricing dispatcher was patched for index 2. TypeScript cache paths in the candidate were moved to its own `.cache` to avoid symlinked node_modules cache contention. The actual workspace dispatcher, shared files, package, and Git index were not changed.

Browser plugin was not available; headless Playwright was used as explicitly required for this parallel task. Initial local checks were on the isolated port 5381. A first test run caught a closing-tooltip animation node in an overly broad locator; the locator now targets open native tooltip state without removing any behavior assertion. All three focused tests then passed, and actual reference keyboard behavior was subsequently used to correct activation mode. Final isolated `npm run build` passed, including TypeScript and Vite (Vite 2.55 seconds; the type-check competed with other isolated builds). The three focused tests then passed on the static production preview at `http://127.0.0.1:5382` in 7.5 seconds. These cover the corrected Startup default and automatic ArrowRight selection, all four desktop/mobile price matrices, original/list prices, both disabled owned states, seat-dependent features, two real tooltip triggers, all ten desktop placeholder links, route retention, no dialogs or page errors, embedded original avatar loading, mobile document links and horizontal containment. Format/check and scoped oxlint passed. No full-catalog or parent release gate is claimed by these page-specific checks.

Evidence and scripts: `/tmp/bricklane-pricing-per-seat/`, including original free registry files, reference state images/JSON, `reference-final.json`, computed rectangles, paired `reference-1280.png` / `local-fresh-1280.png` and `reference-390.png` / `local-fresh-390.png`, and build/test logs. No report screenshots are added to the distributable repository. Publication is coordinated by the primary agent; this subagent did not stage, commit, push, or claim a deployed preview.
