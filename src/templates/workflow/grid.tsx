import { useMemo, type ReactNode } from "react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable, DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
export type WorkflowField<T> = {
  key: string;
  title: string;
  size?: number;
  value?: (row: T) => unknown;
  render: (row: T) => ReactNode;
  sortable?: boolean;
};
export function WorkflowGrid<T extends { id: string }>({
  rows,
  fields,
  pageSize = 10,
  layout = "auto",
  dense = false,
  expandedContent,
  defaultExpanded = true,
  preservePage = false,
}: {
  rows: T[];
  fields: WorkflowField<T>[];
  pageSize?: number;
  layout?: "auto" | "fixed";
  dense?: boolean;
  expandedContent?: (row: T) => ReactNode;
  defaultExpanded?: boolean;
  preservePage?: boolean;
}) {
  const columns = useMemo<ColumnDef<DataGridFeatures, T>[]>(
    () =>
      fields.map((field, index) => ({
        id: field.key,
        accessorFn: field.value ?? ((r) => (r as Record<string, unknown>)[field.key]),
        size: field.size ?? 150,
        header: ({ column }) =>
          field.title ? <DataGridColumnHeader column={column} title={field.title} /> : null,
        cell: ({ row }) =>
          index === 0 && expandedContent ? (
            <div className="flex items-center gap-2">
              <DataGridTableRowExpand row={row} />
              {field.render(row.original)}
            </div>
          ) : (
            field.render(row.original)
          ),
        enableSorting: field.sortable !== false && !!field.title,
        meta: {
          headerTitle: field.title,
          ...(index === 0 && expandedContent
            ? { expandedContent: (row: T) => expandedContent(row) }
            : {}),
        },
      })),
    [fields, expandedContent],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId: (r) => r.id,
    getRowCanExpand: expandedContent ? () => true : undefined,
    autoResetPageIndex: !preservePage,
    initialState: {
      pagination: { pageIndex: 0, pageSize },
      expanded: expandedContent && defaultExpanded ? true : {},
    },
  });
  return (
    <DataGrid
      table={table}
      recordCount={rows.length}
      tableLayout={{ rowBorder: true, width: layout, dense }}
      tableClassNames={{
        base: "wf-official-grid",
        headerRow: dense ? "h-8" : "h-10",
        bodyRow: "h-16",
      }}
    >
      <DataGridContainer className="rounded-none border-0">
        <DataGridScrollArea orientation="horizontal">
          <DataGridTable />
        </DataGridScrollArea>
      </DataGridContainer>
      <DataGridPagination
        className="flex-wrap gap-2 border-t p-3"
        sizes={[5, 6, 10, 20]}
        info="{from} - {to} of {count}"
      />
    </DataGrid>
  );
}
