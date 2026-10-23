import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridCellSelection } from "@/components/reui/data-grid/data-grid-cell-selection";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  useTable,
  functionalUpdate,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnSizingState,
  type ColumnVisibilityState,
  type ExpandedState,
  type PaginationState,
  type Row,
  type HeaderContext,
  type CellContext,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
  type DataGridProps,
  type DataGridTableInstance,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
export type DomainColumn<T extends object> = ColumnDef<DataGridFeatures, T>;
export type DomainRow<T extends object> = Row<DataGridFeatures, T>;
export type DomainTable<T extends object> = DataGridTableInstance<T>;
export type { SortingState, ColumnFiltersState, ExpandedState };
export function domainTextMatches(record: object, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  const visit = (value: unknown): boolean =>
    value !== null &&
    value !== undefined &&
    (typeof value === "object"
      ? Object.values(value).some(visit)
      : String(value).toLowerCase().includes(query));
  return Object.values(record).some(visit);
}
export function useDomainGrid<T extends object>({
  data,
  columns,
  search = "",
  filters = [],
  sorting: controlledSorting,
  onSortingChange,
  pagination: controlledPagination,
  onPaginationChange,
  hidden = [],
  alwaysHidden = [],
  onHiddenChange,
  selection,
  onSelectionChange,
  expanded: controlledExpanded,
  onExpandedChange,
  getSubRows,
  getRowId,
  canSelect,
  globalFilterFn,
}: {
  data: T[];
  columns: DomainColumn<T>[];
  search?: string;
  filters?: ColumnFiltersState;
  sorting?: SortingState;
  onSortingChange?: (next: SortingState) => void;
  pagination?: PaginationState;
  onPaginationChange?: (next: PaginationState) => void;
  hidden?: string[];
  alwaysHidden?: string[];
  onHiddenChange?: (next: string[]) => void;
  selection?: string[];
  onSelectionChange?: (ids: string[]) => void;
  expanded?: ExpandedState;
  onExpandedChange?: (next: ExpandedState) => void;
  getSubRows?: (row: T) => T[] | undefined;
  getRowId?: (row: T) => string;
  canSelect?: (row: T) => boolean;
  globalFilterFn?: (row: T, search: string) => boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const latestColumns = useRef(new Map<string, DomainColumn<T>>());
  const renderers = useRef(
    new Map<
      string,
      {
        cell: (context: CellContext<DataGridFeatures, T, unknown>) => ReactNode;
        header: (context: HeaderContext<DataGridFeatures, T, unknown>) => ReactNode;
      }
    >(),
  );
  function cacheColumns(items: readonly DomainColumn<T>[]) {
    for (const column of items) {
      const id = column.id || ("accessorKey" in column ? String(column.accessorKey) : "");
      latestColumns.current.set(id, column);
      if ("columns" in column && column.columns) cacheColumns(column.columns);
    }
  }
  cacheColumns(columns);
  function stableRenderer(id: string) {
    let cached = renderers.current.get(id);
    if (!cached) {
      cached = {
        cell: (context) => {
          const render = latestColumns.current.get(id)?.cell;
          return typeof render === "function"
            ? render(context)
            : (render ?? String(context.getValue() ?? ""));
        },
        header: (context) => {
          const source = latestColumns.current.get(id);
          const render = source?.header;
          return typeof render === "string" ? (
            <DataGridColumnHeader column={context.column} title={render} />
          ) : typeof render === "function" ? (
            render(context)
          ) : (
            render
          );
        },
      };
      renderers.current.set(id, cached);
    }
    return cached;
  }
  // Column render components keep identity while closures update; active controls retain focus.
  const resolvedColumns = useMemo(
    () =>
      columns.map(function resolve(column): DomainColumn<T> {
        return {
          ...column,
          ...("columns" in column && column.columns
            ? { columns: column.columns.map(resolve) }
            : {}),
          filterFn:
            column.filterFn ||
            ((row: DomainRow<T>, id: string, value: unknown) =>
              String(row.getValue(id)) === String(value)),
          header: stableRenderer(
            column.id || ("accessorKey" in column ? String(column.accessorKey) : ""),
          ).header,
          cell: stableRenderer(
            column.id || ("accessorKey" in column ? String(column.accessorKey) : ""),
          ).cell,
          meta: {
            ...column.meta,
            headerTitle:
              column.meta?.headerTitle ||
              (typeof column.header === "string" ? column.header : column.id),
            headerClassName: cn(
              "h-8 text-[13px] font-normal text-muted-foreground",
              column.meta?.headerClassName,
            ),
            cellClassName: cn("py-1.5 text-sm", column.meta?.cellClassName),
          },
        } as DomainColumn<T>;
      }),
    [columns],
  );
  const visibility = useMemo(() => {
    const next = { ...columnVisibility };
    function visit(items: readonly DomainColumn<T>[], parentHidden = false) {
      for (const column of items) {
        const id = column.id || ("accessorKey" in column ? String(column.accessorKey) : "");
        const title =
          column.meta?.headerTitle || (typeof column.header === "string" ? column.header : id);
        const hide = parentHidden || hidden.includes(title) || alwaysHidden.includes(id);
        if ("columns" in column && column.columns) visit(column.columns, hide);
        else if (hide) next[id] = false;
        else if (onHiddenChange) next[id] = true;
      }
    }
    visit(columns);
    return next;
  }, [
    columns,
    columnVisibility,
    hidden.join("\u0000"),
    onHiddenChange,
    alwaysHidden.join("\u0000"),
  ]);
  const selectionState: RowSelectionState = useMemo(
    () =>
      selection
        ? (Object.fromEntries(selection.map((id) => [id, true] as const)) as RowSelectionState)
        : rowSelection,
    [selection?.join("\u0000"), rowSelection],
  );
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const stableSorting = useMemo(
    () => controlledSorting || sorting,
    [JSON.stringify(controlledSorting || sorting)],
  );
  const stablePagination = useMemo(
    () => controlledPagination || { pageIndex: 0, pageSize: Infinity },
    [controlledPagination?.pageIndex, controlledPagination?.pageSize],
  );
  const table: DomainTable<T> = useTable({
    features: dataGridFeatures,
    data: useMemo(() => data.slice(), [data, columns]),
    columns: resolvedColumns,
    getRowId: getRowId || ((row, index) => String("id" in row ? row.id : index)),
    getSubRows,
    enableRowSelection: canSelect ? (row) => canSelect(row.original) : true,
    enableSubRowSelection: true,
    enableExpanding: !!getSubRows,
    paginateExpandedRows: !getSubRows,
    filterFromLeafRows: true,
    globalFilterFn: (row, _id, value) =>
      globalFilterFn
        ? globalFilterFn(row.original, String(value))
        : domainTextMatches(row.original, String(value)),
    state: {
      sorting: stableSorting,
      columnFilters: stableFilters,
      globalFilter: search,
      pagination: stablePagination,
      rowSelection: selectionState,
      columnOrder,
      columnSizing,
      columnVisibility: visibility,
      expanded: controlledExpanded ?? expanded,
    },
    onSortingChange: (updater) => {
      const next = functionalUpdate(updater, controlledSorting || sorting);
      onSortingChange ? onSortingChange(next) : setSorting(next);
    },
    onPaginationChange: (updater) => {
      if (onPaginationChange)
        onPaginationChange(
          functionalUpdate(updater, controlledPagination || { pageIndex: 0, pageSize: Infinity }),
        );
    },
    onRowSelectionChange: (updater) => {
      const next = functionalUpdate(updater, selectionState);
      onSelectionChange
        ? onSelectionChange(Object.keys(next).filter((id) => next[id]))
        : setRowSelection(next);
    },
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: (updater) => {
      const next = functionalUpdate(updater, visibility);
      setColumnVisibility(next);
      if (onHiddenChange)
        onHiddenChange(
          table
            .getAllLeafColumns()
            .filter((c) => next[c.id] === false)
            .map((c) => c.columnDef.meta?.headerTitle || c.id),
        );
    },
    onExpandedChange: (updater) => {
      const next = functionalUpdate(updater, controlledExpanded ?? expanded);
      onExpandedChange ? onExpandedChange(next) : setExpanded(next);
    },
    autoResetPageIndex: false,
    autoResetExpanded: false,
  });
  const pageCount = table.getPageCount();
  useEffect(() => {
    if (
      controlledPagination &&
      onPaginationChange &&
      controlledPagination.pageIndex >= pageCount &&
      controlledPagination.pageIndex > 0
    )
      onPaginationChange({ ...controlledPagination, pageIndex: Math.max(0, pageCount - 1) });
  }, [pageCount, controlledPagination?.pageIndex, controlledPagination?.pageSize]);
  return table;
}
export function DomainGridSurface<T extends object>({
  table,
  children,
  footerContent,
  className,
  layout,
  onCellsChange,
  onCellEditRequest,
  onCellSelectionChange,
  onRowClick,
  paginationControls,
}: {
  table: DomainTable<T>;
  children?: ReactNode;
  footerContent?: ReactNode;
  className?: string;
  layout?: DataGridProps<DataGridFeatures, T>["tableLayout"];
  onCellsChange?: DataGridProps<DataGridFeatures, T>["onCellsChange"];
  onCellEditRequest?: DataGridProps<DataGridFeatures, T>["onCellEditRequest"];
  onCellSelectionChange?: DataGridProps<DataGridFeatures, T>["onCellSelectionChange"];
  onRowClick?: (row: T) => void;
  paginationControls?: boolean | { noun?: string; sizes?: number[]; className?: string };
}) {
  return (
    <DataGrid
      table={table}
      recordCount={table.getFilteredRowModel().rows.length}
      onCellsChange={onCellsChange}
      onCellEditRequest={onCellEditRequest}
      onCellSelectionChange={onCellSelectionChange}
      onRowClick={onRowClick}
      emptyMessage="No records match your filters."
      tableLayout={{
        rowBorder: true,
        headerBorder: true,
        headerBackground: false,
        width: "fixed",
        ...layout,
      }}
      tableClassNames={{
        base: "text-sm",
        bodyRow: "h-[45px]",
        headerRow: "h-8",
      }}
      className={cn("min-w-0 w-full", className)}
    >
      <DataGridContainer className={cn("min-w-0 rounded-none border-0", className)}>
        {children || <DataGridTable footerContent={footerContent} />}
        {layout?.cellSelection && <DataGridCellSelection<T> />}
      </DataGridContainer>
      {paginationControls && (
        <DataGridPagination
          sizes={
            typeof paginationControls === "object"
              ? paginationControls.sizes || [5, 10, 25, 50, 100]
              : [5, 10, 25, 50, 100]
          }
          info={
            typeof paginationControls === "object" && paginationControls.noun
              ? `{from}–{to} of {count} ${paginationControls.noun}`
              : undefined
          }
          className={cn(
            "border-t px-3 py-2 sm:py-2",
            typeof paginationControls === "object" && paginationControls.className,
          )}
        />
      )}
    </DataGrid>
  );
}
export function domainSelectionColumn<T extends object>(name: (row: T) => string): DomainColumn<T> {
  return {
    id: "select",
    size: 42,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all visible records"
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
      />
    ),
    cell: ({ row }) =>
      row.getCanSelect() ? (
        <Checkbox
          aria-label={`Select ${name(row.original)}`}
          checked={row.getIsSomeSelected() ? "indeterminate" : row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        />
      ) : null,
  };
}

export interface DomainField<T extends object> {
  id: string;
  title: string;
  header?: () => ReactNode;
  value: (record: T) => unknown;
  render?: (record: T, index: number, row: DomainRow<T>) => ReactNode;
  size?: number;
  className?: string | ((record: T) => string);
  hidden?: boolean;
}
/** Domain accessors feed TanStack's real sorting/filtering models; JSX stays a cell renderer. */
export function DomainRecordGrid<T extends object>({
  data,
  fields,
  search,
  filters,
  hidden,
  onHiddenChange,
  selection,
  onSelectionChange,
  pagination,
  onPaginationChange,
  getRowId,
  onRowClick,
  getSubRows,
  expanded,
  onExpandedChange,
  canSelect,
  footerContent,
  className,
  layout,
  rowFilter,
  paginationControls,
}: {
  data: T[];
  fields: DomainField<T>[];
  paginationControls?: boolean | { noun?: string; sizes?: number[]; className?: string };
  rowFilter?: (record: T) => boolean;
  search?: string;
  filters?: ColumnFiltersState;
  hidden?: string[];
  onHiddenChange?: (value: string[]) => void;
  selection?: string[];
  onSelectionChange?: (ids: string[]) => void;
  pagination?: PaginationState;
  onPaginationChange?: (value: PaginationState) => void;
  getRowId?: (record: T) => string;
  onRowClick?: (record: T) => void;
  getSubRows?: (record: T) => T[] | undefined;
  expanded?: ExpandedState;
  onExpandedChange?: (value: ExpandedState) => void;
  canSelect?: (record: T) => boolean;
  footerContent?: ReactNode;
  className?: string;
  layout?: DataGridProps<DataGridFeatures, T>["tableLayout"];
}) {
  const columns = useMemo<DomainColumn<T>[]>(
    () =>
      fields.map((field) => ({
        id: field.id,
        accessorFn: field.value,
        header:
          field.header ||
          (field.id === "select"
            ? ({ table }) => (
                <Checkbox
                  aria-label="Select all rows"
                  checked={
                    table.getIsAllPageRowsSelected()
                      ? true
                      : table.getIsSomePageRowsSelected()
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                />
              )
            : field.title),
        size: field.size || 130,
        minSize: 36,
        cell: ({ row }) =>
          field.render ? (
            <div
              className={
                typeof field.className === "function"
                  ? cn("-mx-2 -my-1.5 px-2 py-1.5", field.className(row.original))
                  : undefined
              }
            >
              {field.render(row.original, row.index, row)}
            </div>
          ) : (
            String(row.getValue(field.id) ?? "")
          ),
        meta: { cellClassName: typeof field.className === "string" ? field.className : undefined },
      })),
    [fields],
  );
  const modelColumns = useMemo<DomainColumn<T>[]>(
    () =>
      rowFilter
        ? [...columns, { id: "__facet", accessorFn: rowFilter, enableHiding: false }]
        : columns,
    [columns, rowFilter],
  );
  const table = useDomainGrid({
    data,
    columns: modelColumns,
    search,
    filters: rowFilter ? [...(filters || []), { id: "__facet", value: true }] : filters,
    hidden,
    onHiddenChange,
    alwaysHidden: [
      ...fields.filter((f) => f.hidden).map((f) => f.id),
      ...(rowFilter ? ["__facet"] : []),
    ],
    selection,
    onSelectionChange,
    pagination,
    onPaginationChange,
    getRowId,
    getSubRows,
    expanded,
    onExpandedChange,
    canSelect,
  });
  return (
    <DomainGridSurface
      table={table}
      onRowClick={onRowClick}
      footerContent={footerContent}
      className={className}
      layout={layout}
      paginationControls={paginationControls}
    />
  );
}
