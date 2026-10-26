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
import "./visual-followups.css";

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
        size: 176,
        minSize: 176,
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
          size: 201.5,
          minSize: 201.5,
          enableResizing: false,
          header: () =>
            product ? (
              <div className="comparison-builder-slot" data-builder-slot={product.id}>
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
                  className="rounded-lg"
                />
                <h3 className="text-sm font-semibold">{product.name}</h3>
                <ComparisonCartAction id={product.id} compact />
              </div>
            ) : (
              <div
                className="flex h-[194px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-3 text-center"
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
            !row.original.spec ? (
              <span aria-hidden="true" />
            ) : product ? (
              <ComparisonValue
                product={product}
                spec={row.original.spec}
                winner={isWinner(row.original.spec, product, selected)}
              />
            ) : (
              <span aria-hidden="true">—</span>
            ),
          meta: {
            headerClassName: "h-auto! p-0! align-top! whitespace-normal! [&>div]:w-full",
            cellClassName: "p-4! whitespace-normal!",
          },
        } satisfies ColumnDef<DataGridFeatures, ComparisonRow>;
      }),
    ];
  }, [ids, remove]);
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: ids.length ? comparisonRows : [],
    getRowId: (row) => row.id,
    initialState: {
      columnPinning: { start: ["spec"], end: [] },
      pagination: { pageIndex: 0, pageSize: 1000 },
    },
  });
  return (
    <DataGrid
      emptyMessage={
        <Empty>
          <EmptyHeader>
            <EmptyTitle role="heading" aria-level={3}>
              A fresh shortlist
            </EmptyTitle>
            <EmptyDescription>
              Select Compare on any model. All four slots are ready.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
      table={table}
      recordCount={ids.length ? comparisonRows.length : 0}
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
      <DataGridContainer className="max-w-[984px] rounded-xl border">
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
      eyebrow=""
      title="Build your comparison"
      description="Pick up to four models, then put every detail side by side. Your shortlist, your call."
      headerActions={
        <>
          <Badge variant={ids.length === maxCompared ? "default" : "secondary"} data-builder-count>
            {ids.length} / 4 selected
          </Badge>
          {ids.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setIds([])}>
              Clear all
            </Button>
          )}
        </>
      }
    >
      <div>
        <h3 className="sr-only">The six-model collection</h3>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {comparisonProducts.map((product) => {
            const pressed = ids.includes(product.id);
            return (
              <Frame
                key={product.id}
                dense
                spacing="sm"
                className="comparison-builder-catalog-card"
                data-builder-catalog={product.id}
              >
                <FramePanel className="comparison-builder-catalog-panel">
                  <img
                    src={product.image}
                    alt={`${product.name} original headphone illustration`}
                    className="rounded-lg"
                  />
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <h4 className="text-base font-semibold leading-6">{product.name}</h4>
                    {pressed && (
                      <Badge variant="secondary" size="sm">
                        Added
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-4 text-muted-foreground">
                    Over-ear headphones
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-lg font-semibold leading-7">
                      {compareMoney(product.price)}
                    </strong>
                    <ComparisonRating product={product} />
                  </div>
                  {/* Actual free c-toggle-10 controlled state, icon and label swap. */}
                  <Toggle
                    variant="outline"
                    className="mt-auto w-full"
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
                    {pressed ? "Added" : "Compare"}
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
        <BuilderSpecPanel ids={ids} remove={remove} />
        <p className="mt-3 text-[11px] text-muted-foreground">
          <span className="hidden sm:inline">Scroll the spec panel sideways when needed. </span>
          Lower price, weight and charging time lead; higher battery life and rating lead. Text and
          feature availability are not ranked. These thirteen fictional specifications extend the
          original eight-field preview.
        </p>
      </div>
    </ComparisonLayout>
  );
}
