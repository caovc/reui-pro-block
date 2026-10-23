> Migration handoff note (2026-10-22): the native-table implementation described below was frozen as reference evidence and has since been replaced with actual official free ReUI Data Grid and TanStack v9. See `grid-base-columns-refinement.md`, `grid-inventory-native-migration.md`, `grid-editing-structure-refinement.md`, `grid-advanced-grouping-refinement.md`, and `grid-filtering-native-migration.md` for current architecture and validation. The open min-width and duplication semantics below were specifically corrected during migration; do not use the historical test status as a current result.

# Focused grid handoff — frozen 2026-10-22

The three specialized routes remain connected. **All three implementations and their dedicated helpers are now frozen for the other Data Grid session's migration to the official free ReUI DataGrid and TanStack foundation.** No further independent edits are planned. No files were staged or committed.

| Public entry | Implementation |
| --- | --- |
| `data-grid-drag-drop-3` | `src/blocks/data/grid-dispatch.tsx` |
| `data-grid-editing-2` | `src/blocks/data/grid-inventory.tsx` |
| `data-grid-expansion-2` | `src/blocks/data/grid-treasury.tsx` |

Dedicated dependencies: `src/blocks/data/grid-treasury-data.ts` and `src/blocks/data/grid-specialized.css`. Shared `data/index.tsx`, `grid.tsx`, other grid families, package files and global CSS were not changed during this latest refinement. The specialized stylesheet restores only these three sections' reference vertical spacing after the shared `.data-grid-refinement > section` margin reset. Preserve the outer mobile gutters supplied by `data/index.tsx`: 32px Dispatch/Treasury and 48px Inventory, 24px at desktop breakpoints.

## Public evidence

Rendered public previews were inspected with Edge headless at matching 1440×1000 and 390×844 viewports; reference DOM measurements and actual control interactions informed the work. No paid registry source was obtained.

- [Dispatch](https://reui.io/preview/base/data-grid-drag-drop-3?embed=1)
- [Inventory](https://reui.io/preview/base/data-grid-editing-2?embed=1)
- [Treasury](https://reui.io/preview/base/data-grid-expansion-2?embed=1)

## Current implemented state

- **Dispatch:** all three exact preset column orders, eight fixed waves, real native column drag, Alt+Arrow movement, pointer/keyboard resizing, Reset, computed review/exception counts, hover/focus header menus and final empty filler column. Typography and desktop/mobile toolbar geometry were refined from reference measurements.
- **Inventory:** inline pending edit buffer with commit/Escape; price/stock/name validation; exact five category options; status and storefront controls; Save/Discard; search/status filter; add, duplicate and confirmed delete. Invalid input no longer mutates the underlying draft prematurely. New rows start as `New product`. Desktop/mobile header, toolbar and 49px product row geometry were refined.
- **Treasury:** all 20 rendered public parent/child rows, matching Actuals/Plan/Variance values and callouts, five correct category choices, source match scores, matching summaries, Expand/Collapse, original 5/10/25/50/100 page-size choices, two-month date range without the previous extra Apply button, bounded previous/next range, and a functional local transaction dialog. Native title substitutes were replaced with real shadcn Tooltip cards supporting focus/hover/click/Escape. Data resides in the dedicated helper.

## Validation actually completed before freeze

- Scoped TypeScript program over the specialized entries and their imported dependencies: **0 diagnostics**. Scoped Oxlint previously returned no diagnostics for these files.
- Latest targeted browser run passed all three Dispatch preset orders, real drag plus keyboard movement, pointer resize/reset and fixed wave ordering.
- Latest run passed Inventory price negative/cap validation, valid commit/save, fractional stock validation/Escape, category/status choices, storefront/Discard, filtering/search empty state, add, duplicate and delete confirm/cancel.
- Latest run compared all **20 Treasury row texts in each of Actuals, Plan and Variance** with captured public DOM: all matched.
- Earlier desktop/390 checks verified all three pages had 390px document width with contained horizontal table scrolling. Latest style refinements aligned Dispatch table start at desktop y141, Inventory y205 / mobile y293 and Treasury desktop y191. Full latest screenshots were not completed before the migration freeze.

## Open items for migration owner

1. The latest extended test stopped in the Treasury category loop: expected one `Show details for` button but found three. Investigate whether this is stale expansion state/select timing or an actual filtering defect; do not claim that loop passed. The rest of that run (latest tooltip/calendar/transaction and final screenshot loop) did not execute.
2. A final public boundary probe found Dispatch's source resize minimum is **20px**; local currently clamps to **110px**. Reconcile during migration.
3. Public Inventory Duplicate inserts directly after its source, names `Everyday Cotton Tee Copy`, uses SKU `APP-1042-C`, and sets Draft. Local still appends a `(copy)` row and retains its previous duplicate semantics. Public confirmation copy is `Delete product?` / `This removes Everyday Cotton Tee from the working set. Connect your product API to persist changes.` with Cancel/Delete. Local confirmation semantics work but exact wording differs.
4. Re-run real focus tooltips, date-range boundaries, category filter state transitions, final desktop/390 screenshots and DOM measurements after the shared architecture migration. The final few spacing changes were scoped typechecked but not all recaptured.
5. Date range source initially opens current October/November even though sample months are April–August; local opens the visible data window. Decide whether to preserve this reference quirk. New Transaction remains an independently functional local preview addition; the public button appeared inert.

Temporary evidence and scripts (outside source): `/tmp/grid-ref-layout.json`, `/tmp/grid-reference-controls.json`, `/tmp/grid-ref-extra.json`, `/tmp/grid-specialized-final-qa.mjs`, `/tmp/grid-source-boundaries.mjs`, `/tmp/reui-grid-chat-readonly-audit.md`. The latest targeted script prints its passed checks before the reported Treasury failure; it does not represent a completed full suite.
