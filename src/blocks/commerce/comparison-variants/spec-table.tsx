import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useTable, type ColumnDef, type ColumnVisibilityState } from "@tanstack/react-table";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { comparisonProducts, comparisonRows, compareMoney, type ComparisonRow } from "./data";
import { ComparisonCartAction } from "./cart";
import { ComparisonLayout, ComparisonRating, ComparisonValue, SpecLabel } from "./shared";

/** Actual official c-data-grid-16 pinning and c-data-grid-20 visibility APIs; no manual sticky table. */
export function SpecComparisonTable() {
  const [visibility, setVisibility] = useState<ColumnVisibilityState>({});
  const count = comparisonProducts.filter((product) => visibility[product.id] !== false).length;
  const columns = useMemo<ColumnDef<DataGridFeatures, ComparisonRow>[]>(
    () => [
      {
        id: "spec",
        accessorKey: "id",
        size: 156,
        minSize: 156,
        enableHiding: false,
        enableResizing: false,
        header: () => (
          <div className="space-y-3 py-2">
            <p className="font-medium">The details</p>
            <p className="text-xs font-normal leading-5 text-muted-foreground">
              Line up the essentials. Scroll to see every model.
            </p>
          </div>
        ),
        cell: ({ row }) =>
          row.original.spec ? (
            <div data-spec-label={row.original.spec.id}>
              <SpecLabel spec={row.original.spec} />
            </div>
          ) : (
            <p
              className="py-1 text-[10px] font-semibold uppercase tracking-widest"
              data-spec-group={row.original.group}
            >
              {row.original.group}
            </p>
          ),
        meta: {
          headerClassName:
            "h-auto! align-top! whitespace-normal! p-4! bg-background! [&>div]:w-full",
          cellClassName: "whitespace-normal! p-4! bg-background!",
        },
      },
      ...comparisonProducts.map(
        (product) =>
          ({
            id: product.id,
            accessorFn: () => product.id,
            size: 208,
            minSize: 208,
            enableHiding: true,
            enableResizing: false,
            header: ({ column }) => (
              <div className="flex w-full flex-col gap-3" data-compared-product={product.id}>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" size="sm">
                    Bricklane Audio
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove ${product.name} from comparison`}
                    onClick={() => column.toggleVisibility(false)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
                <img
                  src={product.image}
                  alt={`${product.name} original headphone illustration`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-sm font-semibold">{product.name}</h3>
                  <p className="mt-1 text-[10px] font-normal leading-4 text-muted-foreground">
                    {product.tagline}
                  </p>
                </div>
                <ComparisonRating product={product} />
                <p className="text-lg font-semibold">{compareMoney(product.price)}</p>
                <ComparisonCartAction id={product.id} compact />
              </div>
            ),
            cell: ({ row }) =>
              row.original.spec ? (
                <ComparisonValue product={product} spec={row.original.spec} />
              ) : (
                <span aria-hidden="true">&nbsp;</span>
              ),
            meta: {
              headerClassName: "h-auto! align-top! whitespace-normal! p-4! [&>div]:w-full",
              cellClassName: "whitespace-normal! p-4!",
            },
          }) satisfies ColumnDef<DataGridFeatures, ComparisonRow>,
      ),
    ],
    [],
  );
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: comparisonRows,
    getRowId: (row) => row.id,
    state: { columnVisibility: visibility },
    onColumnVisibilityChange: setVisibility,
    initialState: {
      columnPinning: { start: ["spec"], end: [] },
      pagination: { pageIndex: 0, pageSize: 1000 },
    },
  });
  return (
    <ComparisonLayout
      variant={1}
      title="Compare the details"
      description="Six sample models, side by side. Keep the ones that interest you and look a little closer."
      actions={
        <Button variant="outline" onClick={() => setVisibility({})}>
          Reset comparison
        </Button>
      }
    >
      <p
        className="mb-3 text-xs text-muted-foreground"
        aria-live="polite"
        data-comparison-active-count
      >
        {count} of {comparisonProducts.length} models in this comparison
      </p>
      {count ? (
        <DataGrid
          table={table}
          recordCount={comparisonRows.length}
          tableLayout={{
            columnsPinnable: true,
            columnsResizable: true,
            cellBorder: true,
            rowBorder: true,
            width: "fixed",
            headerBackground: false,
          }}
          tableClassNames={{ bodyRow: "has-[[data-spec-group]]:bg-muted/50" }}
        >
          <DataGridContainer className="rounded-xl border">
            <DataGridScrollArea orientation="horizontal">
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
        </DataGrid>
      ) : (
        <Empty className="min-h-72 bg-muted">
          <EmptyHeader>
            <EmptyTitle role="heading" aria-level={3}>
              No models in this comparison
            </EmptyTitle>
            <EmptyDescription>
              Restore the full shortlist to start comparing again. Your cart is kept.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setVisibility({})}>Restore all models</Button>
          </EmptyContent>
        </Empty>
      )}
    </ComparisonLayout>
  );
}
