# Data Grid: official free ReUI composition

2026-10-23. Covers all **48** Data Grid catalog entries: Base 8, Advanced 9, Columns 5, Drag/Drop 4, Editing 6, Expansion 3, Filtering 4, Grouping 7 and Virtualization 2.

## Architecture corrected

The first reconstruction used shadcn/native tables and separate array filtering, sorting, paging, drag and range state. That architecture did not satisfy the project requirement. It has been replaced with real official free ReUI Data Grid composition over **TanStack Table v9** (`@tanstack/react-table` 9.3.1), including the old generic solution fallback.

| Responsibility | Actual implementation |
| --- | --- |
| Models | Original domain records + `ColumnDef` + `useTable({features:dataGridFeatures,...})`; native filtered/sorted/paginated/expanded/selected/pinned models and column APIs |
| Tables | Official `DataGridTable`; grouped domain bands compose official table primitives over actual model rows |
| Dragging | Official `DataGridTableDnd` / `DataGridTableDndRows` and handles; real column order or domain row order updates |
| Long feeds | Official `DataGridTableVirtual`, asynchronous mock batches and real row models; custom window/spacer implementation removed |
| Spreadsheet | Official `DataGridCellSelection`, `meta.cellEdit`, clipboard changes, fill/range protocols and inverse changes for undo |
| Filters and columns | Official `Filters` / Cascader / editors / chip menus, `DataGridColumnFilter`, `DataGridColumnHeader` and `DataGridColumnVisibility` |
| Pagination | Official `DataGridPagination` in the same DataGrid provider as the actual table; unpaged grids disable pagination over their complete data |
| Other primitives | Official Frame, Badge, Rating, NumberField, ColorPicker, IconTile and Cascader used for their real behavior |

No paid Pro source was fetched. Official free source, license, registry provenance and installation adapters are recorded in `reui-data-grid-foundation.md` and `reui-data-grid-provenance.json`. The architecture is not established merely by installing a dependency or adding a wrapper: browser checks require the official table viewport and rendered native model rows on every route.

## Review-driven repairs

- Filtering combines domain conditions with the real table models. Sorting clears correctly; shrinking results clamp the page index; matching pinned rows persist across pages while filters can hide them.
- Stable column renderers retain current callbacks without remounting an open workflow menu or losing keyboard focus after a switch update.
- Inventory Duplicate inserts after its source, uses `Name Copy` / `SKU-C`, and starts as Draft. Invalid edits, Escape, Save/Discard and whole-unit stock validation remain functional.
- Dispatch uses the public 20px minimum column width, removes an extra filter strip, and places its facet in the official header menu. Header 32px, row 51px, frame heights 562.5px desktop / 678.5px at 390px match the captured public layout.
- Treasury keeps Actuals/Plan/Variance independent, derives visible families and summaries from the native models, uses official pagination and numeric entry, and preserves the captured public data. Table height 503px, footer 102px and mobile table width 1000px are calibrated at the composition layer.
- Legacy hand-built table/resize/pagination/range helpers are removed or replaced. Shared solution fallback uses the same real ReUI/TanStack foundation.

## What remains custom and why

The free library supplies interaction primitives, not each Pro block's domain schema, fixtures, business cells or backend. Custom code therefore defines campaign/risk/finance/task schemas, local save and batch operations, domain filters/calculations, grouping bands, chart markers and reference asset placement. The Risk queue also needs a small pin-state projection because the native boolean `keepPinnedRows` cannot express “persist across pages, hide when filtered out” by itself.

All actions are local preview state. Some offscreen records, chart series, secondary copy and portraits are independent reconstructions; product photographs still use public remote URLs. Public merged campaign-channel cells are repeated labels. Full parity for every hidden menu, server integration and alternate design preset is not claimed.

## Verification

The release candidate is assembled from the reviewed Git state plus only the Grid changes, so other chats' unfinished files are excluded. The coordinator runs a production build, the complete Grid interaction suite, desktop/mobile route inspection and actual downloaded ZIP builds before publishing. Per-family evidence and limitations are in:

- `grid-base-columns-refinement.md`
- `grid-inventory-native-migration.md`
- `grid-editing-structure-refinement.md`
- `grid-advanced-grouping-refinement.md`
- `grid-filtering-native-migration.md`

Temporary screenshots, traces and logs are under `/tmp/reui-grid-filtering/`; these are local evidence paths, not distributable project assets.

### Release verification result

- Production candidate based on reviewed Git state plus the exact 36 Grid source modules: `npm run build` passed. Source files were hash-compared with the working Grid scope before staging; no mismatches.
- **93 Grid interaction cases passed.** In the last broad run, 90 passed and three timed out under concurrent workstation load; all three then passed in a single-worker targeted rerun with longer wait thresholds for host latency (4.5s, 3.3s, 2.9s). No product code or assertions were weakened for that rerun. Two additional shared demo cases passed.
- **48 routes × 2 widths = 96 checks passed** at 1440px and 390px. Every route had official table/viewport slots and actual model rows, no page errors, no document overflow and no substitute plain table.
- Real UI source downloads for Filtering 1 and Editing 5 contained 152 files each, including native ReUI sources, embedded fonts/assets, TanStack v9 and the ReUI license. Both downloaded projects independently passed `npm run build`. The published export's Node typings are necessary for official development guards.
- Final layout measurements: Dispatch frame 562.5/678.5px (desktop/mobile), header 32px and rows 51px; Inventory frame 465/569px with table top 205/293px and rows 49px; Treasury frame 688/854px, table height 503px, footer 102px, mobile table width 1000px. These close the specific review differences recorded during migration.

Upstream `use no memo` bundler warnings remain informational: this project does not enable React Compiler; the official source directives are preserved in source. Unpaged grids intentionally disable pagination while retaining their full original datasets and other native models.
