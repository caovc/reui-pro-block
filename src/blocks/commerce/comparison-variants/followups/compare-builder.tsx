import { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Toggle } from "@/components/ui/toggle";
import { ComparisonCartAction } from "../cart";
import {
  comparisonProducts,
  comparisonRows,
  compareMoney,
  productById,
  type ComparisonProduct,
  type ComparisonProductId,
  type ComparisonRow,
  type ComparisonSpec,
} from "../data";
import { ComparisonLayout, ComparisonRating, ComparisonValue, SpecLabel } from "../shared";

const maxCompared = 4;
function isWinner(spec: ComparisonSpec, product: ComparisonProduct, selected: ComparisonProduct[]) {
  if (selected.length < 2 || !spec.better) return false;
  const values: (string | number | boolean)[] = selected.map((model) => model[spec.id]);
  if (
    !values.every((value): value is number => typeof value === "number") ||
    new Set(values).size === 1
  )
    return false;
  const best = spec.better === "higher" ? Math.max(...values) : Math.min(...values);
  return product[spec.id] === best;
}

/** Actual c-data-grid-16 pinning handles the live four-slot spec panel. */
function BuilderSpecPanel({
  ids,
  remove,
}: {
  ids: ComparisonProductId[];
  remove: (id: ComparisonProductId) => void;
}) {
  const columns = useMemo<ColumnDef<DataGridFeatures, ComparisonRow>[]>(() => {
    const selected = ids.map((id) => productById[id]);
    return [
      {
        id: "spec",
        accessorKey: "id",
        size: 160,
        minSize: 160,
        enableResizing: false,
        header: () => (
          <div className="flex flex-col gap-2 py-2">
            <span>Live comparison</span>
            <span className="text-xs font-normal text-muted-foreground">
              13 specifications · Up to 4 models
            </span>
          </div>
        ),
        cell: ({ row }) =>
          row.original.spec ? (
            <div data-builder-spec-label={row.original.spec.id}>
              <SpecLabel spec={row.original.spec} />
            </div>
          ) : (
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              data-builder-spec-group
            >
              {row.original.group}
            </p>
          ),
        meta: {
          headerClassName:
            "h-auto! p-4! align-top! whitespace-normal! bg-background! [&>div]:w-full",
          cellClassName: "p-4! whitespace-normal! bg-background!",
        },
      },
      ...Array.from({ length: maxCompared }, (_, index) => {
        const product = selected[index];
        return {
          id: `slot-${index}`,
          accessorFn: () => product?.id || "empty",
          size: 188,
          minSize: 188,
          enableResizing: false,
          header: () =>
            product ? (
              <div className="flex w-full flex-col gap-3" data-builder-slot={product.id}>
                <div className="flex items-center justify-between gap-1">
                  <Badge variant="outline" size="sm">
                    Slot {index + 1}
                  </Badge>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => remove(product.id)}
                    aria-label={`Remove ${product.name} from comparison`}
                  >
                    <X />
                  </Button>
                </div>
                <img
                  src={product.image}
                  alt={`${product.name} original headphone illustration`}
                  className="h-28 w-full rounded-lg object-contain"
                />
                <h3 className="text-sm font-semibold">{product.name}</h3>
                <ComparisonCartAction id={product.id} compact />
              </div>
            ) : (
              <div
                className="flex min-h-52 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-3 text-center"
                data-builder-empty-slot={index}
              >
                <Plus className="size-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Choose another model
                  <br />
                  Slot {index + 1}
                </span>
              </div>
            ),
          cell: ({ row }) =>
            row.original.spec && product ? (
              <ComparisonValue
                product={product}
                spec={row.original.spec}
                winner={isWinner(row.original.spec, product, selected)}
              />
            ) : (
              <span aria-hidden="true">—</span>
            ),
          meta: {
            headerClassName: "h-auto! p-3! align-top! whitespace-normal! [&>div]:w-full",
            cellClassName: "p-4! whitespace-normal!",
          },
        } satisfies ColumnDef<DataGridFeatures, ComparisonRow>;
      }),
    ];
  }, [ids, remove]);
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: comparisonRows,
    getRowId: (row) => row.id,
    initialState: {
      columnPinning: { start: ["spec"], end: [] },
      pagination: { pageIndex: 0, pageSize: 1000 },
    },
  });
  return (
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
      tableClassNames={{ bodyRow: "has-[[data-builder-spec-group]]:bg-muted/50" }}
    >
      <DataGridContainer className="rounded-xl border">
        <DataGridScrollArea orientation="horizontal" data-builder-panel>
          <DataGridTable />
        </DataGridScrollArea>
      </DataGridContainer>
    </DataGrid>
  );
}

export function CompareBuilder() {
  const [ids, setIds] = useState<ComparisonProductId[]>(["field", "studio"]);
  const remove = (id: ComparisonProductId) =>
    setIds((current) => current.filter((value) => value !== id));
  return (
    <ComparisonLayout
      variant={6}
      title="Build your own comparison."
      description="Pick up to four models, then put every detail side by side. Your shortlist, your call."
      actions={
        <Button variant="outline" disabled={!ids.length} onClick={() => setIds([])}>
          Clear all
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">The six-model collection</h3>
        <Badge variant={ids.length === maxCompared ? "default" : "secondary"} data-builder-count>
          {ids.length} / 4 selected
        </Badge>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {comparisonProducts.map((product) => {
          const pressed = ids.includes(product.id);
          return (
            <Frame key={product.id} spacing="sm" data-builder-catalog={product.id}>
              <FramePanel fit>
                <img
                  src={product.image}
                  alt={`${product.name} original headphone illustration`}
                  className="mb-3 h-32 w-full rounded-lg object-contain"
                />
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold">{product.name}</h4>
                  <strong className="text-sm">{compareMoney(product.price)}</strong>
                </div>
                <ComparisonRating product={product} />
                {/* Actual free c-toggle-10 controlled state, icon and label swap. */}
                <Toggle
                  variant="outline"
                  className="mt-3 w-full"
                  aria-label={`Compare ${product.name}`}
                  pressed={pressed}
                  disabled={!pressed && ids.length === maxCompared}
                  onPressedChange={(next) =>
                    next
                      ? setIds((current) =>
                          current.length < maxCompared && !current.includes(product.id)
                            ? [...current, product.id]
                            : current,
                        )
                      : remove(product.id)
                  }
                >
                  {pressed ? <Check /> : <Plus />}
                  {pressed ? "Comparing" : "Compare"}
                </Toggle>
              </FramePanel>
            </Frame>
          );
        })}
      </div>
      <p className="mb-4 text-xs text-muted-foreground" aria-live="polite">
        {ids.length === maxCompared
          ? "All four slots are filled. Remove a model to compare another."
          : ids.length
            ? `${maxCompared - ids.length} open slots. Numeric leaders are highlighted when two or more models are selected.`
            : "Your comparison is empty. Choose a model above to get started."}
      </p>
      {!ids.length && (
        <Empty className="mb-4 border bg-muted/40">
          <EmptyHeader>
            <EmptyTitle role="heading" aria-level={3}>
              A fresh shortlist
            </EmptyTitle>
            <EmptyDescription>
              Select Compare on any model. All four slots are ready.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <BuilderSpecPanel ids={ids} remove={remove} />
      <p className="mt-3 text-[11px] text-muted-foreground">
        Swipe or scroll the spec panel sideways. Lower price, weight and charging time lead; higher
        battery life and rating lead. Text and feature availability are not ranked.
      </p>
    </ComparisonLayout>
  );
}
