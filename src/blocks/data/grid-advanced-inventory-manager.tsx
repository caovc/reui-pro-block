import { useMemo, useRef, useState } from "react";
import { Download, Ellipsis, PackagePlus, Undo2 } from "lucide-react";
import { Filters, type FilterField, type FilterQuery } from "@/components/reui/filters/filters";
import { createFilterQuery } from "@/components/reui/filters/filters-query";
import { DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadFile } from "@/lib/download";
import {
  DomainGridSurface,
  domainSelectionColumn,
  useDomainGrid,
  type DomainColumn,
} from "./grid-advanced-model-grid";
import { ReuiTrend } from "./trend-foundation";
import {
  PlanningMonth,
  PlanningNumber,
  PlanningProblem,
  PlanningSearch,
  PlanningSummary,
} from "./grid-advanced-planning-controls";
import {
  matchesPlanningFilter,
  planningCsv,
  planningMoney,
  planningMonth,
  planningMonths,
  type PlanningResult,
} from "./grid-advanced-planning-common";
import {
  createInventoryDrafts,
  initialInventoryPlanning,
  inventoryCommittedSpend,
  inventoryOrderTotal,
  inventoryReorderPlan,
  inventoryStockSeries,
  setInventoryPlanningCell,
  transitionInventoryOrder,
  type InventoryCell,
  type InventoryPlanningProduct,
  type InventoryPlanningState,
  type InventoryPurchaseOrder,
} from "./grid-advanced-inventory-manager-model";

type ReorderRow = ReturnType<typeof inventoryReorderPlan>[number] & { id: string };
interface StockRow {
  id: string;
  name: string;
  product?: InventoryPlanningProduct;
  children?: StockRow[];
}
const inventoryFields: FilterField[] = [
  { id: "name", label: "Product", type: "text" },
  { id: "sku", label: "SKU", type: "text" },
  {
    id: "department",
    label: "Department",
    type: "select",
    options: [
      ...new Set(initialInventoryPlanning.products.map((product) => product.department)),
    ].map((value) => ({ value, label: value })),
  },
  {
    id: "supplier",
    label: "Supplier",
    type: "select",
    options: [...new Set(initialInventoryPlanning.products.map((product) => product.supplier))].map(
      (value) => ({ value, label: value }),
    ),
  },
];

function inventoryMatches(product: InventoryPlanningProduct, search: string, query: FilterQuery) {
  return (
    `${product.sku} ${product.name} ${product.department} ${product.supplier}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()) &&
    matchesPlanningFilter(
      {
        name: product.name,
        sku: product.sku,
        department: product.department,
        supplier: product.supplier,
      },
      query,
    )
  );
}

function InventoryStockGrid({
  products,
  month,
  onEdit,
}: {
  products: InventoryPlanningProduct[];
  month: number;
  onEdit: (id: string, cell: InventoryCell, amount: number | null) => boolean;
}) {
  const data = useMemo<StockRow[]>(
    () =>
      [...new Set(products.map((product) => product.department))].map((department) => ({
        id: `department-${department}`,
        name: department,
        children: products
          .filter((product) => product.department === department)
          .map((product) => ({ id: product.id, name: product.name, product })),
      })),
    [products],
  );
  const columns = useMemo<DomainColumn<StockRow>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => row.name,
        header: "Product / department",
        size: 270,
        cell: ({ row }) =>
          row.original.product ? (
            <div className="flex flex-col ps-6">
              <span>{row.original.name}</span>
              <span className="text-xs text-muted-foreground">
                {row.original.product.sku} · {row.original.product.supplier}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <DataGridTableRowExpand row={row} />
              <strong>{row.original.name}</strong>
              <Badge variant="secondary">{row.original.children!.length}</Badge>
            </div>
          ),
      },
      ...(["receipts", "sales", "counts", "unitCost"] as const).map(
        (cell): DomainColumn<StockRow> => ({
          id: cell,
          header: {
            receipts: "Receipts",
            sales: "Sales",
            counts: "Physical count",
            unitCost: "Unit cost",
          }[cell],
          size: 165,
          accessorFn: (row) => row.product?.[cell][month] ?? 0,
          cell: ({ row }) =>
            row.original.product ? (
              <PlanningNumber
                dense
                nullable={cell === "counts"}
                kind={cell === "unitCost" ? "money" : "count"}
                label={`${{ receipts: "Receipts", sales: "Sales", counts: "Count", unitCost: "Unit cost" }[cell]} ${row.original.name}`}
                value={row.original.product[cell][month]}
                onCommit={(amount) => onEdit(row.original.id, cell, amount)}
              />
            ) : null,
        }),
      ),
      {
        id: "closing",
        header: "Closing units",
        size: 140,
        accessorFn: (row) =>
          row.product
            ? inventoryStockSeries(row.product)[month].closing
            : row.children!.reduce(
                (sum, child) => sum + inventoryStockSeries(child.product!)[month].closing,
                0,
              ),
        cell: ({ getValue }) => <strong>{Number(getValue()).toLocaleString()}</strong>,
      },
      {
        id: "value",
        header: "Stock value",
        size: 150,
        accessorFn: (row) =>
          row.product
            ? inventoryStockSeries(row.product)[month].value
            : row.children!.reduce(
                (sum, child) => sum + inventoryStockSeries(child.product!)[month].value,
                0,
              ),
        cell: ({ getValue }) => planningMoney(Number(getValue())),
      },
    ],
    [month, onEdit],
  );
  const table = useDomainGrid({ data, columns, getSubRows: (row) => row.children });
  return <DomainGridSurface table={table} scrollArea="horizontal" layout={{ cellBorder: true }} />;
}

function InventoryReorderGrid({
  rows,
  selection,
  onSelection,
}: {
  rows: ReorderRow[];
  selection: string[];
  onSelection: (ids: string[]) => void;
}) {
  const columns = useMemo<DomainColumn<ReorderRow>[]>(
    () => [
      domainSelectionColumn<ReorderRow>((row) => row.product.name),
      {
        id: "name",
        header: "Product",
        size: 240,
        accessorFn: (row) => row.product.name,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.product.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.product.sku}</span>
          </div>
        ),
      },
      { id: "supplier", header: "Supplier", size: 190, accessorFn: (row) => row.product.supplier },
      { id: "closing", header: "On hand", size: 115, accessorKey: "closing" },
      { id: "target", header: "Target stock", size: 130, accessorKey: "target" },
      { id: "incoming", header: "Open orders", size: 130, accessorKey: "incoming" },
      { id: "quantity", header: "Suggested units", size: 150, accessorKey: "quantity" },
      {
        id: "cost",
        header: "Draft cost",
        size: 150,
        accessorKey: "cost",
        cell: ({ row }) => planningMoney(row.original.cost),
      },
    ],
    [],
  );
  const table = useDomainGrid({
    data: rows,
    columns,
    selection,
    onSelectionChange: onSelection,
    canSelect: (row) => row.quantity > 0,
  });
  return <DomainGridSurface table={table} scrollArea="horizontal" />;
}

function PurchaseOrderDetails({
  order,
  products,
}: {
  order: InventoryPurchaseOrder;
  products: InventoryPlanningProduct[];
}) {
  const lines = useMemo(
    () =>
      order.lines.map((line) => ({
        id: line.productId,
        name: products.find((product) => product.id === line.productId)?.name ?? "Product removed",
        quantity: line.quantity,
        unitCost: line.unitCost,
        total: line.quantity * line.unitCost,
      })),
    [order.lines, products],
  );
  const columns = useMemo<DomainColumn<(typeof lines)[number]>[]>(
    () => [
      { id: "name", header: "Product", accessorKey: "name", size: 220 },
      { id: "quantity", header: "Units", accessorKey: "quantity", size: 100 },
      {
        id: "unitCost",
        header: "Unit cost",
        accessorKey: "unitCost",
        size: 135,
        cell: ({ row }) => planningMoney(row.original.unitCost),
      },
      {
        id: "total",
        header: "Line cost",
        accessorKey: "total",
        size: 135,
        cell: ({ row }) => planningMoney(row.original.total),
      },
    ],
    [],
  );
  const table = useDomainGrid({ data: lines, columns });
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          {order.id}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Purchase order {order.id}</SheetTitle>
          <SheetDescription>
            {order.supplier} · {planningMonths[order.month]} 2026 · prices captured when drafted
          </SheetDescription>
        </SheetHeader>
        <Badge variant="secondary">{order.status}</Badge>
        <DomainGridSurface table={table} scrollArea="horizontal" />
        <p className="font-medium">Order total {planningMoney(inventoryOrderTotal(order))}</p>
        <Button
          variant="outline"
          onClick={() =>
            downloadFile(
              `${order.id}.csv`,
              planningCsv(
                lines.map((line) => ({
                  Product: line.name,
                  Units: line.quantity,
                  UnitCost: line.unitCost / 100,
                  Total: line.total / 100,
                })),
              ),
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download data-icon="inline-start" />
          Download purchase order
        </Button>
      </SheetContent>
    </Sheet>
  );
}

function InventoryOrdersGrid({
  state,
  onTransition,
}: {
  state: InventoryPlanningState;
  onTransition: (id: string, status: "sent" | "received" | "cancelled") => void;
}) {
  const columns = useMemo<DomainColumn<InventoryPurchaseOrder>[]>(
    () => [
      {
        id: "id",
        header: "Purchase order",
        accessorKey: "id",
        size: 220,
        cell: ({ row }) => <PurchaseOrderDetails order={row.original} products={state.products} />,
      },
      { id: "supplier", header: "Supplier", accessorKey: "supplier", size: 200 },
      {
        id: "month",
        header: "Budget month",
        accessorKey: "month",
        size: 130,
        cell: ({ row }) => `${planningMonths[row.original.month]} 2026`,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        size: 130,
        cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
      },
      {
        id: "total",
        header: "Order value",
        accessorFn: inventoryOrderTotal,
        size: 145,
        cell: ({ row }) => planningMoney(inventoryOrderTotal(row.original)),
      },
      {
        id: "actions",
        header: "",
        size: 65,
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.original.id}`}>
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={row.original.status !== "draft"}
                  onSelect={() => onTransition(row.original.id, "sent")}
                >
                  Mark as sent
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={row.original.status !== "sent"}
                  onSelect={() => onTransition(row.original.id, "received")}
                >
                  Receive stock
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={
                    row.original.status === "received" || row.original.status === "cancelled"
                  }
                  onSelect={() => onTransition(row.original.id, "cancelled")}
                >
                  Cancel order
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [state.products, onTransition],
  );
  const table = useDomainGrid({ data: state.orders, columns });
  return <DomainGridSurface table={table} scrollArea="horizontal" />;
}

export default function InventoryManager() {
  const [ledger, setLedger] = useState(() => structuredClone(initialInventoryPlanning));
  const [history, setHistory] = useState<InventoryPlanningState[]>([]);
  const [month, setMonth] = useState(planningMonth);
  const [view, setView] = useState("stock");
  const [coverage, setCoverage] = useState(30);
  const [budget, setBudget] = useState(400_000);
  const [selection, setSelection] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(1);
  const ordersTab = useRef<HTMLButtonElement>(null);
  const filtered = useMemo(
    () => ledger.products.filter((product) => inventoryMatches(product, search, query)),
    [ledger.products, search, query],
  );
  const reorder = useMemo(
    () =>
      inventoryReorderPlan(ledger.products, ledger.orders, month, coverage).map((row) => ({
        ...row,
        id: row.product.id,
      })),
    [ledger, month, coverage],
  );
  const visibleReorder = reorder.filter((row) => filtered.some((product) => product.id === row.id));
  const selected = visibleReorder.filter((row) => selection.includes(row.id) && row.quantity > 0);
  const selectedCost = selected.reduce((sum, row) => sum + row.cost, 0);
  const remaining = budget - inventoryCommittedSpend(ledger.orders, month);
  const snapshot = useMemo(
    () => ledger.products.map((product) => inventoryStockSeries(product)[month]),
    [ledger.products, month],
  );
  const counted = snapshot.filter((row) => row.counted !== null);
  const trends = useMemo(
    () =>
      planningMonths.map((name, index) => {
        const rows = ledger.products.map((product) => inventoryStockSeries(product)[index]);
        return {
          name,
          receipts: rows.reduce((sum, row) => sum + row.receipts, 0),
          sales: rows.reduce((sum, row) => sum + row.sales, 0),
          closing: rows.reduce((sum, row) => sum + row.closing, 0),
        };
      }),
    [ledger.products],
  );
  const save = (result: PlanningResult<InventoryPlanningState>) => {
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setHistory((past) => [...past.slice(-19), ledger]);
    setLedger(result.value);
    const eligible = new Set(
      inventoryReorderPlan(result.value.products, result.value.orders, month, coverage)
        .filter((row) => row.quantity > 0)
        .map((row) => row.product.id),
    );
    setSelection((current) => current.filter((id) => eligible.has(id)));
    setError(null);
    return true;
  };
  return (
    <section className="reui-reference flex min-w-0 flex-col gap-4" aria-label="Inventory manager">
      <Frame spacing="sm">
        <FrameHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <FrameTitle role="heading" aria-level={2}>
                Inventory Manager
              </FrameTitle>
              <FrameDescription>
                Stock movements, physical counts and purchase planning · USD · 2026
              </FrameDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!history.length}
                onClick={() => {
                  const previous = history.at(-1);
                  if (previous) {
                    setLedger(previous);
                    setHistory((past) => past.slice(0, -1));
                    setError(null);
                    setSelection([]);
                  }
                }}
              >
                <Undo2 data-icon="inline-start" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadFile(
                    "inventory-stock.csv",
                    planningCsv(
                      filtered.map((product) => {
                        const stock = inventoryStockSeries(product)[month];
                        return {
                          SKU: product.sku,
                          Product: product.name,
                          Department: product.department,
                          Month: planningMonths[month],
                          Receipts: stock.receipts,
                          Sales: stock.sales,
                          Count: stock.counted ?? "Not counted",
                          Closing: stock.closing,
                          Value: stock.value / 100,
                        };
                      }),
                    ),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                <Download data-icon="inline-start" />
                Export stock
              </Button>
            </div>
          </div>
        </FrameHeader>
        <FramePanel>
          <PlanningSummary
            items={[
              {
                label: "Units on hand",
                value: snapshot.reduce((sum, row) => sum + row.closing, 0).toLocaleString(),
                detail: `All ${ledger.products.length} products at the end of ${planningMonths[month]}`,
              },
              {
                label: "Stock value",
                value: planningMoney(snapshot.reduce((sum, row) => sum + row.value, 0)),
                detail: "Closing units at the selected month’s unit cost",
              },
              {
                label: "Count adjustment",
                value: counted.length
                  ? `${counted.reduce((sum, row) => sum + row.adjustment, 0)} units`
                  : "Not counted",
                detail: `${counted.length} of ${ledger.products.length} products physically counted`,
              },
              {
                label: "Purchase budget left",
                value: planningMoney(remaining),
                detail: "Cancelled orders release budget; received orders remain spent",
              },
            ]}
          />
        </FramePanel>
        <FramePanel>
          <PlanningProblem message={error} onDismiss={() => setError(null)} />
          <Tabs value={view} onValueChange={setView}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="stock">Stock ledger</TabsTrigger>
                <TabsTrigger value="reorder">Reorder planner</TabsTrigger>
                <TabsTrigger ref={ordersTab} value="orders">
                  Purchase orders
                </TabsTrigger>
              </TabsList>
              <PlanningMonth
                value={month}
                onChange={(next) => {
                  setMonth(next);
                  setSelection([]);
                }}
              />
            </div>
            {view !== "orders" && (
              <div className="flex flex-wrap items-center gap-3 py-3">
                <PlanningSearch
                  label="Search inventory products"
                  value={search}
                  onChange={(next) => {
                    setSearch(next);
                    setSelection([]);
                  }}
                />
                <Filters
                  fields={inventoryFields}
                  query={query}
                  onQueryChange={(next) => {
                    setQuery(next);
                    setSelection([]);
                  }}
                  variant="advanced"
                  size="sm"
                  showClear
                />
              </div>
            )}
            <TabsContent value="stock">
              <p className="mb-3 text-xs text-muted-foreground">
                Edit recorded movements, count or cost. Counts reconcile closing stock and carry
                forward to the next month.
              </p>
              <InventoryStockGrid
                products={filtered}
                month={month}
                onEdit={(id, cell, amount) => {
                  const result = setInventoryPlanningCell(ledger.products, id, month, cell, amount);
                  return result.ok
                    ? save({ ok: true, value: { ...ledger, products: result.value } })
                    : save(result);
                }}
              />
            </TabsContent>
            <TabsContent value="reorder">
              <div className="flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <PlanningNumber
                    kind="count"
                    label="Coverage days"
                    value={coverage}
                    max={180}
                    onCommit={(next) => {
                      if (next === null || next < 1) {
                        setError("Choose coverage from 1 to 180 days.");
                        return false;
                      }
                      setCoverage(next);
                      setSelection([]);
                      return true;
                    }}
                  />
                  <PlanningNumber
                    label="Purchase budget"
                    value={budget}
                    onCommit={(next) => {
                      setBudget(next ?? 0);
                      return true;
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Demand uses sales recorded in the selected month. Target stock covers lead time
                  plus coverage days, with safety stock. Open orders reduce the suggested quantity.
                </p>
                <InventoryReorderGrid
                  rows={visibleReorder}
                  selection={selection}
                  onSelection={setSelection}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">
                    {selected.length} selected · {planningMoney(selectedCost)} ·{" "}
                    {planningMoney(remaining)} budget left
                  </p>
                  <Button
                    disabled={!selected.length || selectedCost > remaining}
                    onClick={() => {
                      const result = createInventoryDrafts(ledger, {
                        idPrefix: `PO-${2026}-${sequence.current}`,
                        month,
                        coverageDays: coverage,
                        budget,
                        selected: selected.map((row) => row.id),
                      });
                      if (save(result)) {
                        sequence.current += 1;
                        setSelection([]);
                        setView("orders");
                        requestAnimationFrame(() => ordersTab.current?.focus());
                      }
                    }}
                  >
                    <PackagePlus data-icon="inline-start" />
                    Create purchase order drafts
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="orders">
              <p className="my-3 text-xs text-muted-foreground">
                Drafts reserve budget. Mark an order as sent before recording a receipt. Receiving
                applies its quantities once to the selected budget month.
              </p>
              <InventoryOrdersGrid
                state={ledger}
                onTransition={(id, status) => {
                  save(transitionInventoryOrder(ledger, id, status));
                }}
              />
            </TabsContent>
          </Tabs>
        </FramePanel>
        <FramePanel>
          <FrameTitle>Recorded stock flow</FrameTitle>
          <FrameDescription>
            All products. Months without posted movements show zero receipts and sales.
          </FrameDescription>
          <ReuiTrend
            label="Warehouse stock movements"
            data={trends}
            series={[
              { key: "receipts", label: "Receipts", color: "var(--chart-1)", kind: "bar" },
              { key: "sales", label: "Sales", color: "var(--chart-2)", kind: "bar" },
              {
                key: "closing",
                label: "Closing units",
                color: "var(--chart-3)",
                kind: "line",
                curve: "linear",
              },
            ]}
            legend
            height={240}
          />
        </FramePanel>
      </Frame>
    </section>
  );
}
