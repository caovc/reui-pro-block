import { useEffect, useMemo, useState } from "react";
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
  const [narrow, setNarrow] = useState(() => window.matchMedia("(max-width: 639px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const count = comparisonProducts.filter((product) => visibility[product.id] !== false).length;
  const columns = useMemo<ColumnDef<DataGridFeatures, ComparisonRow>[]>(
    () => [
      {
        id: "spec",
        accessorKey: "id",
        size: narrow ? 192 : 224,
        minSize: narrow ? 192 : 224,
        enableHiding: false,
        enableResizing: false,
        header: () => <span className="sr-only">Product</span>,
        cell: ({ row }) =>
          row.original.spec ? (
            <div data-spec-label={row.original.spec.id}>
              <SpecLabel spec={row.original.spec} />
            </div>
          ) : (
            <p className="text-xs font-medium leading-4" data-spec-group={row.original.group}>
              {row.original.group}
            </p>
          ),
        meta: {
          headerClassName:
            "h-[390.5px]! align-top! whitespace-normal! p-4! bg-background! [&>div]:w-full",
          cellClassName: "whitespace-normal! px-4! py-2! bg-background! text-sm! leading-5!",
        },
      },
      ...comparisonProducts.map(
        (product) =>
          ({
            id: product.id,
            accessorFn: () => product.id,
            size: 256,
            minSize: 256,
            enableHiding: true,
            enableResizing: false,
            header: ({ column }) => (
              <div
                className="relative flex h-[357.5px] w-full flex-col justify-between gap-3"
                data-compared-product={product.id}
              >
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-0 top-0"
                  aria-label={`Remove ${product.name} from comparison`}
                  onClick={() => column.toggleVisibility(false)}
                >
                  <X className="size-3.5" />
                </Button>
                <img
                  src={product.image}
                  alt={`${product.name} original headphone illustration`}
                  className="size-40 shrink-0 self-center object-contain"
                />
                <div>
                  <h3 className="text-sm font-semibold">{product.name}</h3>
                  <p className="mt-1 text-xs font-normal leading-4 text-muted-foreground">
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
              headerClassName: "h-[390.5px]! align-top! whitespace-normal! p-4! [&>div]:w-full",
              cellClassName: "whitespace-normal! px-4! py-2!",
            },
          }) satisfies ColumnDef<DataGridFeatures, ComparisonRow>,
      ),
    ],
    [narrow],
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
      description="Find your next pair, side by side."
      actions={
        <>
          <p
            className={
              count === comparisonProducts.length
                ? "text-xs leading-4 text-muted-foreground"
                : "sr-only"
            }
            aria-live="polite"
            data-comparison-active-count
          >
            {count} of {comparisonProducts.length} models in this comparison
          </p>
          {count < comparisonProducts.length && (
            <Button variant="outline" onClick={() => setVisibility({})}>
              Reset comparison
            </Button>
          )}
        </>
      }
    >
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
          tableClassNames={{
            bodyRow:
              "has-[[data-spec-group]]:bg-muted/50 [&:has([data-spec-group])>td]:bg-muted/50! [&:has([data-spec-group])>td]:text-xs! [&:has([data-spec-group])>td]:leading-4!",
          }}
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
