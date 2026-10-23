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

5. A busy task queue could defer an exiting Radix editor's focus restoration until after the next chip editor had opened, pulling focus back to the old trigger and dismissing the new menu. This was reproduced in both directions with CPU-throttled browser traces. A small guard in the vendored free Filters chip skips restoration only while another open popover owns focus. The existing creation handoff is preserved; Escape still returns to the correct trigger. Two tests control the deferred task queue at the real chip call site and fail on the old source before passing with the fix.

## Verification

- Independent production build of the filtering-only candidate passed.
- Nine native interaction tests passed; two additional regressions for sorting-clear, last-page mutations and keyboard focus passed after the fixes. Independent read-only review reproduced all three original defects and confirmed the fixes in the new production build.
- Eight desktop/mobile captures (1440×1000 and 390×844): no document overflow or page errors; all contain actual official grid renderers.
- Measured desktop geometry: 1216px frames at x112/y48; billing rows 51px, automation rows 50px, Risk rows 64px; Renewal rows 52px with a 540px internal scroll viewport. Native wide tables remain internally scrollable at 390px.

This remains a local demo. Save/dispute/archive/assignment/recovery actions update the displayed domain data; no backend or external billing operation is performed. Basic filters combine with AND; the UI does not expose advanced OR groups.

### Deferred-focus regression verification (2026-10-23)

The original signal multiselect case passed 30 ordinary repetitions but failed 2 of 24 at 4× CPU throttling; the captured focus/portal timeline matched CI's detached option symptom. Two deterministic tests hold the deferred task queue until the next editor opens: both failed against the old source at the new editor's focus assertion. With the small free Filters correction, all 13 filtering cases passed, both direction tests passed 16 repeated executions (including ordinary Escape focus return), and the unchanged original case passed all 24 executions under the same CPU pressure. The isolated production build, owned lint/format checks and an actual 177-file Filtering 4 starter's independent build passed. The starter contains the corrected vendored chip and its original ReUI license. Temporary probes remain under `/tmp/reui-grid-filtering/`; no debug instrumentation is shipped.
