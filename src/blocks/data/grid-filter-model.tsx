import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  functionalUpdate,
  useTable,
  type ColumnDef,
  type Row,
  type ReactTable,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import {
  DataGridTable,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { matchesRules, type FilterRule } from "./grid-filter-controls";
import { cn } from "@/lib/utils";

export type FilterGridRow<T extends object> = Row<DataGridFeatures, T>;
export type FilterGridColumn<T extends object> = {
  id: string;
  key?: keyof T;
  width?: number;
  cell: (record: T, row: FilterGridRow<T>) => ReactNode;
  className?: string;
};
export function useFilteringTable<T extends { id: number }>({
  rows,
  columns,
  rules,
  filter,
  selected = [],
  onSelection,
  sort,
  onSort,
  page = 0,
  onPage,
  pageSize = 1000,
  onPageSize,
  hidden = [],
  onHidden,
  pinned = [],
  onPinned,
}: {
  rows: T[];
  columns: FilterGridColumn<T>[];
  rules: FilterRule[];
  filter?: (record: T) => boolean;
  selected?: number[];
  onSelection?: (v: number[]) => void;
  sort: { key: string; asc: boolean };
  onSort: (v: { key: string; asc: boolean }) => void;
  page?: number;
  onPage?: (v: number) => void;
  pageSize?: number;
  onPageSize?: (v: number) => void;
  hidden?: string[];
  onHidden?: (v: string[]) => void;
  pinned?: number[];
  onPinned?: (v: number[]) => void;
}) {
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const schema = JSON.stringify(
    columns.map((c) => [c.id, c.key, c.width, c.className]),
  );
  // Keep the renderer function identity stable while its current block actions
  // are read from a ref. Data updates must not remount an open cell menu.
  const defs = useMemo<ColumnDef<DataGridFeatures, T>[]>(
    () =>
      columns.map((c) => ({
        id: c.id,
        accessorFn: (record) =>
          c.key
            ? record[c.key]
            : c.id.startsWith("_")
              ? ""
              : (record as Record<string, unknown>)[c.id],
        size: c.width ?? 140,
        minSize: c.id.startsWith("_") ? 36 : 80,
        header: ({ column }) =>
          c.id === "_select" ? (
            <DataGridTableRowSelectAll />
          ) : c.id.startsWith("_") ? null : (
            <DataGridColumnHeader column={column} title={c.id} visibility />
          ),
        cell: ({ row }) =>
          columnsRef.current
            .find((current) => current.id === c.id)!
            .cell(row.original, row),
        enableSorting: !c.id.startsWith("_"),
        enableHiding: !c.id.startsWith("_") && c.id !== "Account",
        enableGlobalFilter: !c.id.startsWith("_"),
        meta: { headerTitle: c.id, cellClassName: c.className },
      })),
    [schema],
  );
  const rowSelection: RowSelectionState = Object.fromEntries(
    selected.map((id) => [String(id), true as const]),
  );
  // ReUI/TanStack exposes a boolean keepPinnedRows policy: false also hides
  // off-page pins; true also keeps filtered-out pins. Project pin state through
  // the same query predicate so matching pins persist across pages only.
  const activePinned = pinned.filter((id) => {
    const record = rows.find((r) => r.id === id);
    return record && matchesRules(record, rules) && (!filter || filter(record));
  });
  const hiddenPinned = pinned.filter((id) => !activePinned.includes(id));
  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns: defs,
    getRowId: (r) => String(r.id),
    state: {
      globalFilter: { rules, filter },
      sorting: sort.key ? [{ id: sort.key, desc: !sort.asc }] : [],
      pagination: { pageIndex: page, pageSize },
      rowSelection,
      columnVisibility: Object.fromEntries(hidden.map((id) => [id, false])),
      rowPinning: { top: activePinned.map(String), bottom: [] },
    },
    onSortingChange: (updater) => {
      const next = functionalUpdate(updater, [
        { id: sort.key, desc: !sort.asc },
      ]);
      onSort(
        next[0]
          ? { key: next[0].id, asc: !next[0].desc }
          : { key: "", asc: true },
      );
      onPage?.(0);
    },
    onPaginationChange: (updater) => {
      const next = functionalUpdate(updater, { pageIndex: page, pageSize });
      onPage?.(next.pageIndex);
      onPageSize?.(next.pageSize);
    },
    onRowSelectionChange: (updater) =>
      onSelection?.(
        Object.keys(functionalUpdate(updater, rowSelection)).map(Number),
      ),
    onColumnVisibilityChange: (updater) => {
      const next = functionalUpdate(
        updater,
        Object.fromEntries(hidden.map((id) => [id, false])),
      );
      onHidden?.(Object.keys(next).filter((id) => next[id] === false));
    },
    onRowPinningChange: (updater) =>
      onPinned?.([
        ...hiddenPinned,
        ...(
          functionalUpdate(updater, {
            top: activePinned.map(String),
            bottom: [],
          }).top ?? []
        ).map(Number),
      ]),
    getColumnCanGlobalFilter: () => true,
    globalFilterFn: (row, _id, value) =>
      matchesRules(row.original, value.rules) &&
      (!value.filter || value.filter(row.original)),
    columnResizeMode: "onChange",
    keepPinnedRows: true,
    autoResetPageIndex: false,
  });
  const lastPage = Math.max(0, table.getPageCount() - 1);
  useEffect(() => {
    if (page > lastPage) onPage?.(lastPage);
  }, [page, lastPage, onPage]);
  return table;
}
export function FilterGrid<T extends object>({
  table,
  children,
  loading = false,
  compact = true,
  resizable = false,
  movable = true,
  className,
  emptyMessage,
}: {
  table: ReactTable<DataGridFeatures, T>;
  children: ReactNode;
  loading?: boolean;
  compact?: boolean;
  resizable?: boolean;
  movable?: boolean;
  className?: string;
  emptyMessage?: string;
}) {
  return (
    <DataGrid
      table={table}
      recordCount={table.getFilteredRowModel().rows.length}
      isLoading={loading}
      loadingMode="skeleton"
      emptyMessage={emptyMessage}
      tableLayout={{
        dense: compact,
        rowBorder: true,
        headerSticky: true,
        columnsResizable: resizable,
        columnsResizeMode: "onChange",
        columnsVisibility: true,
        columnsMovable: movable,
        columnsPinnable: true,
        rowsPinnable: true,
        width: resizable ? "fixed" : "auto",
      }}
      tableClassNames={{
        base: cn(
          "text-sm [&_th]:h-8 [&_th]:px-3 [&_td]:px-3 [&_td]:py-1.5",
          className,
        ),
        headerRow: "h-8",
      }}
    >
      {children}
    </DataGrid>
  );
}
export function FilterTable() {
  return (
    <DataGridContainer className="rounded-none border-0">
      <DataGridScrollArea orientation="both">
        <DataGridTable />
      </DataGridScrollArea>
    </DataGridContainer>
  );
}
export function FilterPager() {
  return (
    <DataGridPagination
      sizes={[5, 7, 10, 20]}
      info="{from} - {to} of {count}"
      previousPageLabel="Go to previous page"
      nextPageLabel="Go to next page"
      className="flex-wrap gap-3 px-3 py-2"
    />
  );
}
