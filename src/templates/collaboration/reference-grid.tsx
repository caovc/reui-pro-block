import { useMemo, type ReactNode } from "react";
import { useTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { useState } from "react";
export type ReferenceColumn<T> = {
  id: string;
  title: string;
  header?: ReactNode;
  render: (row: T) => ReactNode;
  value?: (row: T) => string | number;
  size?: number;
};
export function ReferenceGrid<T extends { id: string }>({
  rows,
  columns,
  onRowClick,
  columnVisibility = {},
}: {
  rows: T[];
  columns: ReferenceColumn<T>[];
  onRowClick?: (row: T) => void;
  columnVisibility?: Record<string, boolean>;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const defs = useMemo<ColumnDef<DataGridFeatures, T>[]>(
    () =>
      columns.map((c) => ({
        id: c.id,
        accessorFn: c.value ?? ((r) => r.id),
        size: c.size,
        header: ({ column }) =>
          c.header ?? (c.title ? <DataGridColumnHeader column={column} title={c.title} /> : null),
        cell: ({ row }) => c.render(row.original),
        enableSorting: !!c.value,
      })),
    [columns],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns: defs,
    getRowId: (r) => r.id,
    manualPagination: true,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
  });
  return (
    <DataGrid
      table={table}
      recordCount={rows.length}
      onRowClick={onRowClick}
      tableLayout={{ rowBorder: true, headerBorder: true, width: "auto" }}
    >
      <div className="ct-table-scroll">
        <DataGridTable />
      </div>
    </DataGrid>
  );
}
