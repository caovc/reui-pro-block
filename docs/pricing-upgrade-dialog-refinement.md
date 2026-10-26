# Pricing 7 — Upgrade Plan Dialog

Independent Bricklane implementation of the [public block](https://reui.io/blocks/marketing/pricing/pricing-7), inspected through its [rendered preview](https://reui.io/preview/base/pricing-7). No paid source, reference screenshots, original site artwork, extracted SVG, or avatars enter the shipped implementation. Existing free-component MIT notices and Inter OFL attribution remain intact.

Entry: `UpgradePlanPricing()` in `src/blocks/commerce/pricing-upgrade-dialog.tsx`, with no props. The underlying Empty entry uses `data-pricing-variant="7"`; the portalled dialog uses `data-pricing-upgrade-dialog="7"`. Parent integration owns pricing index 6 and source-target updates. This scope changes only the TSX, CSS, this document, and its test. Pricing 1–3 and every existing shared file remain frozen.

## Reference and component audit before implementation

The flow under test is: pricing-7 preview → initially open Team / Yearly → choose each plan and billing period → verify rail, details, exclusions, savings and billed total → dismiss and reopen through the Empty trigger with selection retained.

The free registry was inspected before implementation. Sources are public `https://reui.io/r/radix-nova/{name}.json`. The existing stock UI dependency files are identified honestly as stock dependencies; their names alone are not claimed as ReUI reuse. Actual reuse consists of the complete free ReUI example compositions below plus installed ReUI Badge and IconTile implementations.

| Official free implementation | Local reuse and actual invocation                                                                                                                                                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `c-dialog-3`                 | Header / description / scrolling body / sticky footer / trigger and native dismissal composition in `UpgradePlanPricing`; existing Dialog supplies portal, trap, Escape, outside dismissal and focus return.                                                         |
| `c-radio-group-17`           | Mapped pricing plans, controlled RadioGroup, uniquely associated labels and RadioGroupItem values in `PlanRail`. Its Field content is composed with the official Item example below to match the public plan cards. No custom radio keyboard or selection mechanism. |
| `c-item-1`, `c-icon-tile-10` | Outline Item + title / description / actions and ItemMedia + elevated IconTile composition in every plan rail row. The actual installed `src/components/reui/icon-tile.tsx` renders the nested elevated tile.                                                        |
| `c-empty-1`                  | Empty / Header / Media / Title / Description / Content / Button composition for the closed view. The optional public example's decorative IconPlaceholder is omitted; an installed IconTile and licensed Lucide icon are used.                                       |
| `c-tabs-1`                   | Controlled Tabs, TabsList, two TabsTrigger and two TabsContent instances for billing. Actual official dependency handles selection, keyboard navigation and panel visibility.                                                                                        |
| `c-scroll-area-1`            | Actual ScrollArea viewport, track and thumb for dialog body, plan rail and details; native overflow and dragging remain intact.                                                                                                                                      |
| `c-separator-1`              | Actual Separator between price and included features in `PlanDetails`.                                                                                                                                                                                               |
| ReUI `badge`, `icon-tile`    | Installed complete ReUI implementations, directly imported from `@/components/reui/*`. `success-light` is used for the billing discount; `outline` for Most Popular.                                                                                                 |

Registry file content SHA-256, computed from each extracted free example before adaptation:

| Name                          | SHA-256                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| c-dialog-3                    | `1e911f83ba74e72675d7eaa122878179858a2003113f8cc7fc90c9d1b9493ac6` |
| c-radio-group-17              | `5527034e589baaa9b50bf104519c6048c7e307c616c7396a22287dce8b9bacff` |
| c-item-1                      | `367c868a7142cb062ce76b48c60462f6f8e8df19f737794092eaeb9c2cdac20a` |
| c-icon-tile-10                | `9ab43e6688ba5c6f019e728937fe937d710d2b32f7f0259c8131179f25b9799c` |
| c-empty-1                     | `b8ed7036aa1499dc7ae48721102e882826e4d44e85d9ffd9a9b24967de92fe59` |
| c-tabs-1                      | `cbfe3e727aeae0df0cbf65a7358070b64457d6cb6850e65a3b128ad5fc07044e` |
| c-scroll-area-1               | `0921355232aab04ee7d20b79364f12048b79b66076c5529d8793bf41c0f2e6ce` |
| c-separator-1                 | `786fba5114107d61c1c7062b9e6e09326dbd283fbb2f741e9fe7b1360eb53406` |
| icon-tile full implementation | `83f4253dfef982d5a372c63c3cc744e06fc45c75f48c7aaa72b2a3e3b009e3ac` |

Additional basic dialog, radio tooltip and alternate Empty examples were inspected but are not claimed as reused.

## Observed reference states

Fresh headless Chromium contexts, Inter loaded, desktop 1440 × 1100 and mobile 390 × 844. Public DOM, accessibility state, computed styles and screenshots were used; no Pro implementation source was accessed.

| Plan           | Monthly / month | Yearly / month | Yearly total | Displayed annual saving | Included + excluded rows | CTA           |
| -------------- | --------------: | -------------: | -----------: | ----------------------: | -----------------------: | ------------- |
| Basic          |             $18 |            $15 |         $180 |                     $36 |                   11 + 2 | Start Trial   |
| Team (initial) |             $54 |            $45 |         $540 |                    $108 |                   12 + 2 | Start Trial   |
| Enterprise     |            $168 |           $140 |       $1,680 |                    $336 |                   11 + 0 | Contact Sales |

The reference keeps the annual-saving sentence when Monthly is selected. This behavior is preserved. Initial billing is Yearly, with “2 Months Free.” All three rail prices change together. The footer uses the selected plan and either the monthly amount or twelve times the yearly monthly rate.

Close, Escape, and clicking the overlay dismiss the dialog. View Plans restores it with both selections retained. Focus initially lands on the dialog; dismissal returns it to View Plans. Plan radios support arrow-key navigation. Public CTA anchors target `#`; clicking leaves the dialog and displayed state unchanged. Local placeholders call preventDefault and scroll to the top, preserving the gallery's hash route. No checkout, success modal or confirmation is invented.

## Geometry and visual findings

| Element                       | Public reference                                                   | Local after correction                                                |
| ----------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Desktop dialog                | x240, y236.5, 960 × 627                                            | Same measured rect across all six states                              |
| Mobile dialog                 | x16, y70, 358 × 704                                                | Same measured rect across all six states                              |
| Dialog corner                 | 14px                                                               | 14px                                                                  |
| Desktop body / footer         | 483px / 65px                                                       | 483px / 65px                                                          |
| Mobile body / footer          | 528px / 97px                                                       | 528px / 97px; header and footer stay fixed during real scroll         |
| Desktop rail / details widths | 320px / 640px                                                      | 320px / 640px                                                         |
| Billing list                  | 226.9375 × 32px                                                    | Same desktop measured size; mobile client width 227, height 32        |
| Typography                    | Inter; 18px heading, 36px price, 14px body, 12px rail descriptions | Same scope and sizes, including the portalled dialog and closed Empty |

Initial layout, grayscale, selected rail fill, green discount badge, outline Most Popular badge, separators, feature columns, corners and footer spacing were compared in paired screenshots. A remaining rail placement difference is approximately 1px on desktop. Closed-state card glyph differs slightly from the reference; installed licensed Lucide icons are used throughout.

The free library provides the controls but no complete upgrade-plan content model or automatically stable plan-details layout. Independent plan data, responsive grid, feature columns, and normal-flow grid sizing stack fill those gaps. Inactive plan panels still contribute natural size, while `inert`, `aria-hidden` and `visibility:hidden` prevent interaction and accessibility duplication. No hardcoded 627px dialog height is used.

The installed Radix ScrollArea does not expose the public Base preview's overflow-edge CSS variables. A scroll-event adapter supplies only the top/bottom mask flags; all scrolling remains the free component's viewport and thumb. The mobile flex child needed `min-height:0` plus a flex viewport so its actual client height is 528px rather than the full 968px content height. Native auto visibility and scoped vertical-track dimensions preserve the real scrollbar.

## Billing Tabs overflow audit

At both sizes the 32px filled TabsList originally had `scrollHeight=33`, caused by the stock line-variant transparent `::after` positioned 5px below each trigger. This instance uses the filled variant, so its unnecessary pseudo element is disabled locally. No global scrollbar hiding or shared Tabs changes are made. Native Tabs behavior, trigger focus rings, borders and active styling remain.

After correction, TabsList clientWidth/scrollWidth are both 227 and clientHeight/scrollHeight both 32. Billing outer client/scroll dimensions also match: desktop 640 × 48, mobile 358 × 48. Both axes are `overflow:visible`; neither needs a scrollbar. The genuine mobile dialog viewport is 358 × 528 with 968px content height and scrolls to the last row, retaining its visible native track and stationary footer. There is no horizontal content overflow at either tested width. Since this two-tab list fits both tested widths, no horizontal scroll mechanism is needed; narrower widths are not asserted.

## Validation and artifacts

Browser plugin not available. The frontend-testing-debugging skill's regular Playwright path was used, as expressly required for this parallel scope. Candidate is a clean archive of committed HEAD `368dd9f6c1189e1a8eadfbfc4bfd8f390eebc573` with only these implementation files and a temporary candidate-only pricing index-6 dispatcher. URL: `http://127.0.0.1:5391/#/preview/marketing/pricing/pricing-7`. No shared router was changed.

Checks performed:

- Page title and intended preview identity, meaningful rendered content, no framework overlay and no page errors.
- All six plan/billing combinations at desktop and mobile; actual selected radio, main and rail prices, savings, included/excluded row counts and billed totals.
- Stable dialog bounds across all choices; stable mobile footer bounds and last feature reachable through actual ScrollArea scrolling.
- CTA remains a real `href="#"` anchor and leaves local route, visible plan and dialog unchanged.
- Close, Escape, overlay, Empty trigger and Enter reopen; state persistence and restored trigger focus.
- Radio ArrowDown / ArrowUp with key held until native focus/selection occurs, then key released; focus remains trapped across nine Tab presses; inactive sizing panels are inert and hidden from accessibility.
- Both-size filled Tabs overflow and pseudo-element regression assertions.
- Scoped TypeScript check through candidate-local `tsconfig.upgrade.json`; build-info output goes to candidate `.cache`, not shared node_modules.

Commands: `npm run format -- <the four owned files>`, `npm run format:check -- <the four owned files>`, `npm run lint -- <owned TSX and spec>`, scoped candidate `npx tsc --noEmit -p tsconfig.upgrade.json`, and `PREVIEW_URL=http://127.0.0.1:5391 npm run test -- tests/pricing-upgrade-dialog.spec.ts --workers=1 --output=/tmp/bricklane-pricing-upgrade/tests`.

Reference evidence and temporary downloaded free examples are outside the repository at `/tmp/bricklane-pricing-upgrade/`: canonical `reference-stable-1440.png` / `reference-stable-390.png`, all six `reference-{plan}-{billing}.png`, `reference-closed.png`, computed layout JSON, and reference interaction JSON. Final local screenshots: `local-final-1440.png`, `local-final-390.png`, `local-final-390-scrolled.png`, `local-final-closed.png`. `final-tabs.json` records dimensions and overflow; the mobile transformed bounding rect in that probe was captured during entry animation, so stable bounds are asserted separately after the animation reaches its final geometry. Earlier `local-*` probes predate corrections and are not final evidence.

Final scoped results: **3 Playwright tests passed (7.6s)**; candidate scoped TypeScript check passed; oxfmt check passed for all four owned files; oxlint passed for the owned TSX and test.

Final production build, source export bundle, integrated tests and deployment are deliberately left to the parent coordinator under the shared resource policy. No Git write or publication was performed by this agent.

Remaining limits: Chromium at the two stated sizes only; no Safari/Firefox, intermediate-width or dark-theme fidelity claim. Animation timing follows the installed Radix twin, not the public Base runtime. Very fast synthetic keydown+keyup in one tick can run before Radix's deferred roving-focus selection; tests preserve the actual held-key sequence rather than adding a custom keyboard implementation. Resize-at-scroll-end mask refresh is not independently verified. These are not claims of a complete source-identical reproduction.
