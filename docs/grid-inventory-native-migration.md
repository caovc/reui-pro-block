# Inventory grid: official free ReUI migration

2026-10-22. Entry: `data-grid-editing-2`. Implementation: `src/blocks/data/grid-inventory.tsx`. Test: `tests/grid-inventory-native.spec.ts`.

The existing fine-grained Product Inventory UI now uses the actual official free ReUI Data Grid and TanStack React Table v9.3.1. Its five initial products, SKU secondary text, low-stock warning, inline validation, editable draft, Save/Discard bar, category/status selectors, storefront switches, duplicate/new/delete flows are retained.

## Actual composition and state ownership

- `InventoryGrid → useTable({ features: dataGridFeatures, data: rows, columns, ... })`: seven real `ColumnDef<DataGridFeatures, Product>` definitions. Price and stock accessors return numbers, so native sorting compares numeric values.
- The complete domain dataset is passed unchanged as `data`. Search and the controlled status facet become a `globalFilter` callback evaluated by `globalFilterFn` in the native filtered row model. No manual filtering, sorting, or slicing produces the rendered rows.
- `DataGrid → DataGridContainer → DataGridScrollArea → DataGridTable` renders the actual table. `DataGridColumnHeader` drives native ascending/descending/reset sorting. `manualPagination: true` intentionally disables pagination for this small editable inventory, matching the reference's full list; it does not accompany any pre-sliced page or manufactured count. A duplicate sixth record remains visible and editable.
- The actual free `Frame`/`FrameHeader`/`FrameTitle`/`FrameDescription`/`FramePanel`/`FrameFooter` components supply the frame. Status badges use free ReUI `Badge`.
- The status facet uses the shared `Facet` adapter, which composes official `Filters`/`FilterValuePopover` and a controlled query.
- Price and stock editors use official `NumberField`, `NumberFieldGroup`, and `NumberFieldInput`. Domain validation remains local: price must be present, finite, nonnegative and at most $100,000; stock must be a nonnegative integer. The grid deliberately permits a numeric invalid draft so the cell can explain the problem before committing.

Column definitions are stable. Separate named cell components consume an inventory editing context, keeping an active input mounted while the draft changes. Multi-digit and decimal typing preserves focus and selection. Enter and valid blur commit; Escape cancels. The custom draft and saved snapshots implement inventory-specific transactions, which are outside a generic grid's domain. New/duplicate/delete/storefront/category/status changes participate in the same Save/Discard state.

## Evidence and verification

- Scoped TypeScript check: no diagnostics in `grid-inventory.tsx` or the Base/Columns modules.
- Production build passed in `/tmp/reui-grid-base-snapshot`, using the baseline App and current inventory/vendor files. The current route wrapper was copied so desktop y80 placement and mobile padding match the integrated grid route. Unrelated unfinished chart integration was excluded from this independent snapshot.
- `PREVIEW_URL=http://127.0.0.1:5196 npx playwright test tests/grid-inventory-native.spec.ts --output=/tmp/reui-grid-inventory-native-complete-qa --workers=2`: **7 passed (4.7s)**.
- Tests cover actual registry DOM slots, numeric invalid drafts and Escape, continuous decimal typing, commit/Save/Discard, native filter and numeric sort results, more than five records, duplicate/new/delete, whole-stock validation, storefront toggle, inline category/status selections, restoring a confirmed deletion, and 390px internal scrolling with no document overflow or browser exceptions.
- Current production screenshot `/tmp/reui-grid-base-ref/local-inventory.png` was inspected beside the pre-migration integrated screenshot `/tmp/reui-grid-filtering/final-data-grid-editing-2-1440.png`. The 1088px frame, 80px top offset, 49px rows, nested toolbar and dirty footer remain. Native sort indicators and official Filters facet are visible changes. Current public preview reacquisition at `https://reui.io/preview/base/data-grid-editing-2?embed=1` failed with `ERR_CONNECTION_CLOSED`; no new claim is made about unobserved official interactive states.

This preview stores saved changes in component memory. Backend persistence remains outside its scope. Vendor components were not changed for this migration.

Final integration also removes the 3px header-to-panel offset: table top 205px desktop / 293px at 390px, frame height 465px / 569px. See `grid-official-migration.md` for the complete release verification.
