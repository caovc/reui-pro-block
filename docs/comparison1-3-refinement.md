# Comparison1–3: specifications, model pair and editor picks

## Reference scope

The official [six-entry Comparison index](https://reui.io/blocks/ecommerce/comparison) and all six public Markdown briefs were read before implementation. This batch implements only [Spec Comparison Table](https://reui.io/blocks/ecommerce/comparison/comparison-1), [Two-Product Compare](https://reui.io/blocks/ecommerce/comparison/comparison-2) and [Buying Guide Picks](https://reui.io/blocks/ecommerce/comparison/comparison-3). Ranked Scorecards4, Alternatives5 and Builder6 remain queued. No paid registry source, original screenshots, avatars or extracted reference SVG are included.

All three original desktop/mobile/expanded rendered comparisons remain pending. The public brief supplies structure and behavior, rather than evidence of matching pixels. The root uses the documented max-w-6xl container. Phone breakpoints, spacing and art composition remain provisional.

## Actual free ReUI implementation reuse

- Spec Table uses the installed actual ReUI DataGrid/DataGridTable/DataGridScrollArea and the c-data-grid-16 pinning feature/state plus c-data-grid-20 controlled visibility API. The spec column is pinned through the table implementation. Native column visibility removes all six product columns and Reset restores them without resetting cart state. No hand-written sticky/hidden table engine remains.
- Both selection cards use the existing official Select composition. The comparison table retains c-table-16's vertical-spec Table/Header/Body/Row/Cell structure, extended with grouped, typed domain values and winner flags. Numeric direction is explicit: lower price/weight/charging time, higher battery/rating; equal or identical models do not receive false wins.
- Decimal ratings actually import the free ReUI Rating used by c-rating-2. Tooltip1 provides the real trigger/content and keyboard behavior. Frame3 supplies native stacked panels; existing Item2 media/content/checklist anatomy supplies the editor-pick feature list. There are no painted replacement stars or custom tooltip state.
- The optional local cart uses the actual ReUI NumberField1 group/decrement/input/increment implementation, Frame panels and installed Item/ScrollArea/Alert/Badge components. Root replaced its duplicate native Dialog content/header/footer composition with the repository's existing actual c-dialog-3/c-dialog-6 DialogSurface and its real CSS. DialogTrigger/Close keep native Radix modal focus, Escape and return behavior. The domain adapter uses entry0 solely as an internal noncatalog cart surface.

Raw free-example sources were inspected from the official registry; current cached source bodies have these SHA256 hashes:

| Free source                                                            | Raw source SHA256                                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [c-data-grid-16](https://reui.io/r/radix-nova/c-data-grid-16.json)     | `c72827c7a45e30ea05da664ef35080887e16894e543193b3400b06316374b337` |
| [c-data-grid-20](https://reui.io/r/radix-nova/c-data-grid-20.json)     | `0b960e799c71d8076cfbaa2130f63b744747e0c4548adaa0b6de95852c828dd0` |
| [c-rating-2](https://reui.io/r/radix-nova/c-rating-2.json)             | `e693da0b547fe111dabfd39b0eb16602cfbbefffad88d17fb98eecb0bac4183e` |
| [c-tooltip-1](https://reui.io/r/radix-nova/c-tooltip-1.json)           | `04f2f00fc8ab0cc2531b654421f975954161f0f35a2f24ea0b6fc96802705244` |
| [c-number-field-1](https://reui.io/r/radix-nova/c-number-field-1.json) | `c99acd93b81ab073554bab97f22ffa6d4320751dcf7bd5dec71fc74d081dbdd9` |
| [c-table-16](https://reui.io/r/radix-nova/c-table-16.json)             | `925cdccf1933d77340d0e0840ed68b12d0cd19c72cee5a173f8f0fccbb4385d7` |
| [c-frame-3](https://reui.io/r/radix-nova/c-frame-3.json)               | `9d980e90c16f6f48a1bcfd9060203ab97d8cb7a0a7bee24b00ef6e012d3f15ef` |

The existing DialogSurface retains its own official source URLs/MIT comments; the actual free implementations retain REUI-LICENSE.txt and project third-party notices in complete downloads. No existing UI primitive, dependency or other session's generic promotions renderer was changed.

## Original domain content and specific custom gaps

The six Bricklane Audio names, prices, ratings, thirteen specifications, feature groups, and pitches are fictional. Existing locally authored wishlistArtwork('headphones') supplies the drawings and six colorways. Original Bricklane identity replaces upstream branding; no product recommendation or actual commerce integration is implied.

The free examples do not supply the complete product-selection/winner model, grouped product/spec data, per-variant layout or quantity/subtotal domain state. These are explicit custom composition. Quantities are bounded1–5 and subtotals are calculated from the selected fictional records; remove/clear/empty states work locally. The original public briefs describe console-only cart handlers; this actual local cart is a documented functional extension, and cannot place an order.

## Corrected implementation issues

The first owner screenshot exposed Frame panels whose content was taller than the painted179px panel: the four spec chips existed in the DOM but were clipped. Native fit/content-height contracts replace conflicting h-full/flex-1 consumer sizing. Persistent desktop/390 checks now assert every chip lies inside its real FramePanel. The original screenshot and initial21-case result remain historical evidence, not proof that those pixels were correct.

Two model images use contain with a centered scale of the original drawing's generous canvas, preserving the headphone geometry. Root aligns the documented max-w-6xl bound and reuses the actual free DialogSurface rather than retaining the duplicate modal anatomy. Source regression checks require the real cart, free DialogSurface/CSS, Rating/NumberField and license bytes in each actual starter.

## Validation and remaining work

Root's clean52b3787 candidate plus the exact independent payload passed strict TypeScript/Vite,63/63 Comparison/all six Category/source production checks, full format/tooling3/lint. After the actual-free Dialog migration and cumulative templateM2 integration, strict build and38/38 Comparison/Nav12–13/CSV/source checks passed. Final max-width and source-dependency assertions passed with 23/23 production checks. All three actual 200-file UI downloads independently passed strict TypeScript/Vite builds. Six desktop/390 starter flows passed, including wheel/pinning, swap/reset, contained chips, native quantity controls, exact subtotals and Dialog Escape/focus return. A separate six-case check waited for native animations to finish and confirmed the starter and site dialog widths, header/footer padding and border match. Root visually inspected the actual phone buying guide and its settled cart. Detailed logs and measurements are recorded in the integration release.

Preview/source hooks cover exact one-based1–3, mapping spec-table/two-product/buying-guide ahead of comparison-variants/index. Other Comparison entries and prior Shop/Category implementations remain separate. Viewing, copying, single-file download and complete-project export must continue to refer to the actual leaves. A local test or push does not establish CI/Pages deployment; those statuses are tracked separately.
