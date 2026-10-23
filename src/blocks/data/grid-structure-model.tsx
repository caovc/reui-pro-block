import type { ReactNode } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  DataGrid,
  DataGridContainer,
  type DataGridFeatures,
  type DataGridProps,
  type DataGridTableInstance,
} from "@/components/reui/data-grid/data-grid";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridTableDnd } from "@/components/reui/data-grid/data-grid-table-dnd";
import { DataGridTableDndRows } from "@/components/reui/data-grid/data-grid-table-dnd-rows";
import { DataGridTableVirtual } from "@/components/reui/data-grid/data-grid-table-virtual";
import {
  DataGridCellSelection,
  type DataGridCellSelectionApi,
} from "@/components/reui/data-grid/data-grid-cell-selection";
import type { RefObject } from "react";
import { cn } from "@/lib/utils";

/** The caller owns a real TanStack v9 table; this only composes official renderers. */
export function StructureGrid<T extends object>({
  table,
  recordCount,
  mode = "table",
  height = 550,
  onDragEnd,
  onFetchMore,
  hasMore,
  isFetchingMore,
  renderHeader = true,
  children,
  toolbar,
  footerContent,
  cellApi,
  gridProps,
  className,
}: {
  table: DataGridTableInstance<T>;
  recordCount?: number;
  mode?: "table" | "dnd" | "columns-dnd" | "virtual";
  height?: number;
  onDragEnd?: (event: DragEndEvent) => void;
  onFetchMore?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  renderHeader?: boolean;
  children?: ReactNode;
  toolbar?: ReactNode;
  footerContent?: ReactNode;
  cellApi?: RefObject<DataGridCellSelectionApi | null>;
  gridProps?: Omit<DataGridProps<DataGridFeatures, T>, "table" | "recordCount" | "children">;
  className?: string;
}) {
  const tableLayout = {
    width: "fixed" as const,
    rowBorder: true,
    headerBorder: true,
    headerBackground: false,
    ...gridProps?.tableLayout,
  };
  const renderer =
    mode === "virtual" ? (
      <DataGridTableVirtual<T>
        height={height}
        estimateSize={tableLayout.dense ? 40 : 52}
        overscan={5}
        onFetchMore={onFetchMore}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        renderHeader={renderHeader}
        footerContent={footerContent}
      />
    ) : mode === "columns-dnd" ? (
      <DataGridTableDnd<T>
        handleDragEnd={(event) => onDragEnd?.(event)}
        footerContent={footerContent}
      />
    ) : mode === "dnd" ? (
      <DataGridTableDndRows<T>
        dataIds={table.getRowModel().rows.map((r) => r.id)}
        handleDragEnd={(event) => onDragEnd?.(event)}
        footerContent={footerContent}
      />
    ) : (
      <DataGridTable<T> renderHeader={renderHeader} footerContent={footerContent} />
    );
  return (
    <DataGrid
      table={table}
      recordCount={recordCount ?? table.getFilteredRowModel().rows.length}
      {...gridProps}
      tableLayout={tableLayout}
      tableClassNames={{
        bodyRow: "h-[51px]",
        headerRow: "h-8",
        ...gridProps?.tableClassNames,
      }}
    >
      {toolbar}
      <DataGridContainer
        className={cn(
          "structure-official-grid [&_th]:font-normal [&_th]:text-muted-foreground [&_td]:text-sm",
          className,
        )}
      >
        {mode === "virtual" ? (
          renderer
        ) : (
          <DataGridScrollArea className="max-h-[720px]">{renderer}</DataGridScrollArea>
        )}
        {tableLayout.cellSelection && <DataGridCellSelection<T> apiRef={cellApi} />}
      </DataGridContainer>
      {children}
    </DataGrid>
  );
}
