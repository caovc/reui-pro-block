# Filtering grids: official free ReUI migration

2026-10-22. All four filtering blocks now render original sample datasets through `useTable({features:dataGridFeatures,...})`, real `ColumnDef` definitions and the free `DataGridTable`/`DataGridScrollArea`/`DataGridPagination` implementations. No prefiltered, presorted or sliced display arrays are passed to a pretend manual table.

## Actual free component composition

- `Filters` and its official Cascader, condition picker, typed value editors, multiselect, chip action menus and focus handling replace the hand-built filter builder. The adapter maps domain fields and the basic flat AND query to the records' predicate. The library supplies the filter interface; evaluating a block's domain records remains a block responsibility.
- `DataGridColumnHeader` supplies actual sorting, clearing, moving and pinning menus. `DataGridColumnVisibility` reads/writes the same table's visibility state; native resize handles update TanStack sizing.
- `DataGridTableRowSelectAll` and row selection APIs drive selection and local batch edits. Table row pinning drives the Risk queue.
- Free `Frame`, `Badge`, `Rating` and `IconTile` replace duplicated wrappers and rating-star rendering. Portraits and integration badges now use the locally authored `demoAvatar` and `integrationArtwork` helpers; no upstream preview media is included.
- The previous unused `LayoutHead` resize/drag implementation and custom pagination implementation are no longer used.

## Interaction corrections found during independent review

1. Sorting could not be cleared because the controlled adapter ignored an empty sorting array. Empty sorting now restores raw dataset order.
2. Pausing the last two Live workflows on the last page could leave the page index beyond the new last page, displaying an empty table and `6 - 5 of 5`. The adapter clamps the current index when the real filtered model shrinks.
3. Recreating column cell functions on each data change remounted an open workflow menu and sent keyboard focus to the document body. Stable schema-based definitions read current block renderers from a ref, so mutations keep the switch and menu mounted without capturing stale actions.
4. `keepPinnedRows:false` also removes off-page pins, while `true` also keeps filtered-out pins. The Risk queue projects its remembered pin ids through its query predicate and uses the official `true` policy: matching pinned rows persist across pages, filtered-out pins disappear and return when cleared. This small state-policy adapter fills a limitation of the upstream boolean option; it does not replace row rendering or pagination.

## Verification

- Independent production build of the filtering-only candidate passed.
- Nine native interaction tests passed; two additional regressions for sorting-clear, last-page mutations and keyboard focus passed after the fixes. Independent read-only review reproduced all three original defects and confirmed the fixes in the new production build.
- Eight desktop/mobile captures (1440×1000 and 390×844): no document overflow or page errors; all contain actual official grid renderers.
- Measured desktop geometry: 1216px frames at x112/y48; billing rows 51px, automation rows 50px, Risk rows 64px; Renewal rows 52px with a 540px internal scroll viewport. Native wide tables remain internally scrollable at 390px.

This remains a local demo. Save/dispute/archive/assignment/recovery actions update the displayed domain data; no backend or external billing operation is performed. Basic filters combine with AND; the UI does not expose advanced OR groups.
