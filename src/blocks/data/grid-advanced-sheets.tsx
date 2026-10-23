import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Send,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DomainGridSurface,
  DomainRecordGrid,
  domainTextMatches,
  useDomainGrid,
  type DomainColumn,
} from "./grid-advanced-model-grid";
import { productKpiRows } from "./grid-advanced-seeds";
import {
  AddRecord,
  Button,
  Checkbox,
  CheckCell,
  Choice,
  DotBadge,
  ExportRows,
  GridFrame,
  GridSearch,
  Input,
  Meter,
  NumericField,
  RowMenu,
  Spark,
  TableOptions,
} from "./grid-advanced-shared";
import { cellClass, cn, money } from "./grid-advanced-utils";
const categories = ["Drinks", "Dairy", "Bakery", "Produce", "Frozen", "Snacks", "Home", "Care"];
const initialMix = {
  target: [14, 12, 6, 10, 10, 16, 18, 14],
  tolerance: [2, 1, 1, 1, 2, 2, 2, 2],
  min: [1, 1, 1, 1, 2, 1, 1, 1],
  cost: [14.4, 21.6, 18.75, 26.5, 32.8, 19.9, 27.4, 36.2],
  value: [42, 31, 14, 26, 23, 37, 38, 34],
  order: [-7, 0, 0, 0, 0, 0, 7, 0],
};
type MixKey = keyof typeof initialMix;
export function StockMix() {
  const [data, setData] = useState(initialMix);
  const [saved, setSaved] = useState(initialMix);
  const [plan, setPlan] = useState("Autumn");
  const [orderTo, setOrderTo] = useState("Target");
  const [staged, setStaged] = useState(false);
  const [stagedOrders, setStagedOrders] = useState<{ name: string; amount: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [costUpdate, setCostUpdate] = useState(false);
  const total = data.value.reduce((a, b) => a + b, 0);
  const shares = data.value.map(
    (v, i) => (v / initialMix.value[i]) * [16.6, 12.6, 5.8, 10.4, 9.2, 14.7, 15.3, 13.6][i],
  );
  const dirty = JSON.stringify(data) !== JSON.stringify(saved);
  const update = (key: MixKey, i: number, value: number) => {
    if (!Number.isFinite(value)) return;
    if (key !== "order") value = Math.max(0, value);
    setData((s) => ({
      ...s,
      [key]: s[key].map((v, n) => (n === i ? value : v)),
    }));
    setSubmitted(false);
  };
  return (
    <GridFrame
      title="Stock Mix"
      description={`Maple Street Market, $250k, orders v${submitted ? "13" : "12"}`}
      actions={
        <>
          <TableOptions
            label="Columns"
            columns={categories}
            hidden={hidden}
            setHidden={setHidden}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-sm"
            disabled={!data.order.some((v) => v !== 0)}
            onClick={() => {
              setStagedOrders(
                data.order.flatMap((amount, i) =>
                  amount ? [{ name: categories[i], amount }] : [],
                ),
              );
              setData((s) => ({
                ...s,
                value: s.value.map((v, i) => Math.max(0, v + s.order[i])),
                order: s.order.map(() => 0),
              }));
              setStaged(true);
              setSubmitted(false);
            }}
          >
            <RefreshCw />
            Stage Orders <DotBadge>{data.order.filter((v) => v !== 0).length}</DotBadge>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-sm"
            disabled={!dirty && !staged}
            onClick={() => {
              setData(saved);
              setStaged(false);
              setStagedOrders([]);
            }}
          >
            <RefreshCw />
            Revert
          </Button>
          <Button
            size="sm"
            className="h-8 text-sm"
            disabled={!staged || submitted}
            onClick={() => {
              setSaved(data);
              setSubmitted(true);
              setStaged(false);
              toast.success("Orders submitted for this preview");
            }}
          >
            <Send />
            {submitted ? "Submitted" : "Submit Orders"}
          </Button>
        </>
      }
    >
      <div className="flex min-w-0 flex-col md:flex-row">
        <aside className="flex shrink-0 flex-wrap gap-4 border-b bg-muted/15 p-3 md:w-56 md:flex-col md:border-r md:border-b-0">
          <label className="space-y-1 text-xs text-muted-foreground">
            Plan
            <Choice
              label="Stock mix plan"
              value={plan}
              onChange={(v) => {
                setPlan(v);
                setData((s) => ({
                  ...s,
                  target: v === "Summer" ? [18, 10, 8, 14, 12, 16, 12, 10] : initialMix.target,
                }));
              }}
              options={["Autumn", "Summer"]}
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Order to
            <Choice
              label="Order to"
              value={orderTo}
              onChange={(v) => {
                setOrderTo(v);
                setData((s) => ({
                  ...s,
                  order: s.target.map((target, i) => {
                    const goal =
                      target +
                      (v === "Minimum" ? -s.tolerance[i] : v === "Maximum" ? s.tolerance[i] : 0);
                    return Math.abs(goal - shares[i]) > s.tolerance[i]
                      ? Math.round((goal - shares[i]) * 2.5)
                      : 0;
                  }),
                }));
              }}
              options={["Target", "Minimum", "Maximum"]}
            />
          </label>
          <div className="space-y-2 text-[13px]">
            <p className="text-xs text-muted-foreground">Stages</p>
            {[
              [
                "On plan",
                String(
                  shares.filter(
                    (v, i) =>
                      (i !== 3 || costUpdate) &&
                      Math.abs(v - data.target[i]) <= data.tolerance[i] / 2,
                  ).length,
                ),
                "good",
              ],
              [
                "Watch",
                String(
                  shares.filter(
                    (v, i) =>
                      (i !== 3 || costUpdate) &&
                      Math.abs(v - data.target[i]) > data.tolerance[i] / 2 &&
                      Math.abs(v - data.target[i]) <= data.tolerance[i],
                  ).length,
                ),
                "warn",
              ],
              [
                "Off plan",
                String(
                  shares.filter(
                    (v, i) =>
                      (i !== 3 || costUpdate) && Math.abs(v - data.target[i]) > data.tolerance[i],
                  ).length,
                ),
                "bad",
              ],
              ["Unpriced", costUpdate ? "0" : "1", "muted"],
              ["On hold", "0", "muted"],
            ].map(([name, n, tone]) => (
              <div key={name} className="flex justify-between gap-6">
                <DotBadge tone={tone as "good"}>{name}</DotBadge>
                <span>{n}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto space-y-1.5">
            <p className="font-medium">Costs</p>
            <p className="text-xs text-muted-foreground">
              {costUpdate ? "8 of 8 updated today" : "7 of 8 updated today"}
            </p>
            <Button
              size="sm"
              className="h-7 w-full text-[13px]"
              onClick={() => {
                setCostUpdate(true);
                setData((s) => ({
                  ...s,
                  cost: s.cost.map((v) => Math.round(v * 1.01 * 100) / 100),
                }));
              }}
            >
              <RefreshCw />
              Update Costs
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full text-[13px]"
              onClick={() =>
                setData((s) => ({
                  ...s,
                  tolerance: s.tolerance.map(() => s.tolerance[selectedCategory]),
                  min: s.min.map(() => s.min[selectedCategory]),
                }))
              }
            >
              Copy to All
            </Button>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <StockModelGrid
            data={data}
            shares={shares}
            hidden={hidden}
            setHidden={setHidden}
            costUpdate={costUpdate}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            update={update}
          />
        </div>
      </div>
      {staged && (
        <div className="border-t bg-blue-500/5 px-3 py-3 text-sm">
          <b>Staged orders · {orderTo}</b>
          <div className="mt-2 flex flex-wrap gap-3">
            {stagedOrders.map((order) => (
              <span key={order.name}>
                {order.name}: {order.amount > 0 ? "+" : ""}
                {order.amount}k
              </span>
            ))}
          </div>
        </div>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
        <span role="status">
          {submitted ? "Orders submitted · " : dirty ? "Unsaved changes · " : ""}
          Budget ${Math.max(0, 250 - total)}k after suggested orders and $130 fees
        </span>
        <ExportRows
          name="stock-mix"
          rows={categories.map((category, i) => ({
            category,
            ...Object.fromEntries(Object.keys(data).map((k) => [k, data[k as MixKey][i]])),
          }))}
        />
      </footer>
    </GridFrame>
  );
}
type MixRecord = { id: "share" | "supplier" | MixKey; name: string; unit: string };
const mixRecords: MixRecord[] = [
  { id: "share", name: "Share %", unit: "Target / actual" },
  { id: "supplier", name: "Supplier", unit: "" },
  ...(
    [
      ["target", "Target", "%"],
      ["tolerance", "Tolerance", "pp"],
      ["min", "Min order", "$k"],
      ["cost", "Case cost", "$"],
      ["value", "Value", "$k"],
      ["order", "Order", "$k"],
    ] as [MixKey, string, string][]
  ).map(([id, name, unit]) => ({ id, name, unit })),
];
function StockModelGrid({
  data,
  shares,
  hidden,
  setHidden,
  costUpdate,
  selectedCategory,
  setSelectedCategory,
  update,
}: {
  data: typeof initialMix;
  shares: number[];
  hidden: string[];
  setHidden: (names: string[]) => void;
  costUpdate: boolean;
  selectedCategory: number;
  setSelectedCategory: (index: number) => void;
  update: (key: MixKey, index: number, value: number) => void;
}) {
  const [suppliers, setSuppliers] = useState([
    "DST",
    "DIR",
    "DIR",
    "WHL",
    "DST",
    "DST",
    "WHL",
    "DST",
  ]);
  const columns = useMemo<DomainColumn<MixRecord>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Aisle order",
        size: 160,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="text-[13px]">
            <b className="font-medium">{row.original.name}</b>
            <span
              className={cn("text-xs text-muted-foreground", row.id === "share" ? "block" : "ml-1")}
            >
              {row.original.unit}
            </span>
          </div>
        ),
      },
      ...categories.map(
        (name, i) =>
          ({
            id: name,
            accessorFn: (record: MixRecord) =>
              record.id === "share"
                ? shares[i]
                : record.id === "supplier"
                  ? suppliers[i]
                  : data[record.id][i],
            header: () => (
              <button
                aria-pressed={selectedCategory === i}
                className="w-full text-center"
                onClick={() => setSelectedCategory(i)}
              >
                {name}
                <span className="block text-xs font-normal text-muted-foreground">
                  {i === 0 || i === 5 ? "Pantry" : i < 5 ? "Fresh" : "Non-food"}
                </span>
              </button>
            ),
            size: 96,
            cell: ({ row }) =>
              row.id === "share" ? (
                <div className="py-1 text-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        aria-label={`${name} share details`}
                        className="w-full overflow-hidden rounded-lg border"
                      >
                        <span className="block bg-muted/20 px-2 py-2 font-medium">
                          {data.target[i].toFixed(1)}
                        </span>
                        <span
                          className={cn(
                            "block border-t px-2 py-2",
                            i === 3 && !costUpdate
                              ? "text-muted-foreground"
                              : Math.abs(shares[i] - data.target[i]) > data.tolerance[i]
                                ? "bg-rose-500/10 text-rose-600"
                                : Math.abs(shares[i] - data.target[i]) > data.tolerance[i] / 2
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-emerald-500/10 text-emerald-600",
                          )}
                        >
                          {shares[i].toFixed(1)}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 space-y-3">
                      <h3 className="text-sm font-medium">{name} mix settings</h3>
                      <label className="block text-xs">
                        Target %
                        <NumericField
                          label={`${name} target share`}
                          value={data.target[i]}
                          onValueChange={(v) => update("target", i, v)}
                          min={0}
                          step={0.1}
                        />
                      </label>
                      <label className="block text-xs">
                        Tolerance pp
                        <NumericField
                          label={`${name} share tolerance`}
                          value={data.tolerance[i]}
                          onValueChange={(v) => update("tolerance", i, v)}
                          min={0}
                          step={0.1}
                        />
                      </label>
                    </PopoverContent>
                  </Popover>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {i === 3 && !costUpdate
                      ? "Unpriced"
                      : `${shares[i] - data.target[i] > 0 ? "+" : ""}${(shares[i] - data.target[i]).toFixed(1)}`}
                  </span>
                </div>
              ) : row.id === "supplier" ? (
                <Choice
                  label={`${name} supplier`}
                  value={suppliers[i]}
                  onChange={(value) =>
                    setSuppliers((current) => current.map((v, n) => (n === i ? value : v)))
                  }
                  options={["DST", "DIR", "WHL"]}
                  className="h-7 min-w-16 border-0 shadow-none"
                />
              ) : (
                <span
                  aria-label={`Edit ${name} ${row.id}`}
                  className={cn(
                    "text-sm tabular-nums",
                    ["target", "tolerance"].includes(row.id) && "text-blue-500",
                  )}
                >
                  {data[row.id as MixKey][i].toFixed(
                    row.id === "cost" ? 2 : ["target", "tolerance"].includes(row.id) ? 1 : 0,
                  )}
                </span>
              ),
            meta: {
              headerTitle: name,
              cellClassName: "text-center",
              cellEdit: {
                control: "text",
                editable: (row) => !["share", "supplier"].includes(row.id),
                parse: (raw, row) => {
                  const value = Number(raw.replace(/[$,%\s]/g, ""));
                  return Number.isFinite(value) && (row.id === "order" || value >= 0)
                    ? value
                    : undefined;
                },
                format: (value) => String(value),
              },
            },
          }) satisfies DomainColumn<MixRecord>,
      ),
      {
        id: "total",
        accessorFn: (record) =>
          record.id === "share"
            ? shares.reduce((a, b) => a + b, 0)
            : record.id === "supplier"
              ? 0
              : data[record.id].reduce((a, b) => a + b, 0),
        header: "Total",
        size: 100,
        cell: ({ row }) =>
          row.id === "share" ? (
            <div className="text-center">
              {data.target.reduce((a, b) => a + b, 0).toFixed(1)}
              <span className="mt-2 block">{shares.reduce((a, b) => a + b, 0).toFixed(1)}</span>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Budget {(100 - shares.reduce((a, b) => a + b, 0)).toFixed(1)}
              </span>
            </div>
          ) : ["target", "value", "order"].includes(row.id) ? (
            <span className="font-medium">{data[row.id as MixKey].reduce((a, b) => a + b, 0)}</span>
          ) : (
            "·"
          ),
        meta: { cellClassName: "text-center" },
      },
    ],
    [data, shares, selectedCategory, costUpdate, suppliers],
  );
  const table = useDomainGrid({
    data: mixRecords,
    columns,
    hidden,
    onHiddenChange: setHidden,
    getRowId: (r) => r.id,
  });
  return (
    <DomainGridSurface
      table={table}
      layout={{
        cellBorder: true,
        cellSelection: true,
        cellSelectionMode: "range",
        cellEditMode: "click",
      }}
      className="[&_tbody_tr]:h-[54px]"
      onCellSelectionChange={(snapshot) => {
        const index = categories.indexOf(snapshot.focused?.columnId || "");
        if (index >= 0) setSelectedCategory(index);
      }}
      onCellsChange={(details) => {
        for (const change of details.changes)
          update(
            change.row.id as MixKey,
            categories.indexOf(change.columnId),
            Number(change.value),
          );
      }}
    />
  );
}
const lineSeed = [
  {
    name: "Revenue Growth",
    group: "GROWTH RATES",
    basis: "Yearly",
    value: 3.5,
    percent: true,
  },
  {
    name: "Expense Growth",
    group: "GROWTH RATES",
    basis: "Yearly",
    value: 2.5,
    percent: true,
  },
  {
    name: "Appreciation Rate",
    group: "GROWTH RATES",
    basis: "Yearly",
    value: 3,
    percent: true,
  },
  { name: "Rental Income", group: "REVENUES", basis: "Monthly", value: 3950 },
  {
    name: "Vacancy",
    group: "REVENUES",
    basis: "% Gross Rent",
    value: 7,
    percent: true,
  },
  { name: "Parking", group: "REVENUES", basis: "Monthly", value: 120 },
  { name: "Other Income", group: "REVENUES", basis: "Monthly", value: 85 },
  { name: "Property Taxes", group: "EXPENSES", basis: "Annual", value: 4680 },
  { name: "Insurance", group: "EXPENSES", basis: "Annual", value: 1380 },
  {
    name: "Property Mgmt",
    group: "EXPENSES",
    basis: "% Eff. Rent",
    value: 8,
    percent: true,
  },
  { name: "Repairs", group: "EXPENSES", basis: "Annual", value: 2650 },
  { name: "Utilities", group: "EXPENSES", basis: "Monthly", value: 185 },
  { name: "Capital Reserves", group: "EXPENSES", basis: "Annual", value: 1200 },
];
export function ProForma() {
  const [lines, setLines] = useState(lineSeed);
  const [price, setPrice] = useState(425000);
  const [down, setDown] = useState(25);
  const [closing, setClosing] = useState(8500);
  const [rate, setRate] = useState(6.5);
  const [term, setTerm] = useState(30);
  const [years, setYears] = useState("10 Years");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [overrides, setOverrides] = useState<Record<string, Record<number, number>>>({});
  const [history, setHistory] = useState<
    {
      lines: typeof lineSeed;
      overrides: Record<string, Record<number, number>>;
      price: number;
      down: number;
      closing: number;
      rate: number;
      term: number;
    }[]
  >([]);
  const [pasteStatus, setPasteStatus] = useState("");
  const remember = () =>
    setHistory((current) =>
      [
        ...current,
        {
          lines: lines.map((line) => ({ ...line })),
          overrides: structuredClone(overrides),
          price,
          down,
          closing,
          rate,
          term,
        },
      ].slice(-40),
    );
  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setLines(previous.lines);
    setOverrides(previous.overrides);
    setPrice(previous.price);
    setDown(previous.down);
    setClosing(previous.closing);
    setRate(previous.rate);
    setTerm(previous.term);
    setHistory((current) => current.slice(0, -1));
    setPasteStatus("Last cell change undone");
  };
  const value = (name: string) => lines.find((l) => l.name === name)?.value || 0;
  const loan = price * (1 - down / 100);
  const cash = Math.max(1, (price * down) / 100 + closing);
  const m = rate / 1200;
  const debt = m > 0 ? (loan * m) / (1 - Math.pow(1 + m, -term * 12)) : loan / (term * 12);
  const remainingPrincipal = (year: number) =>
    m > 0
      ? Math.max(
          0,
          loan * Math.pow(1 + m, year * 12) - (debt * (Math.pow(1 + m, year * 12) - 1)) / m,
        )
      : Math.max(0, loan - debt * year * 12);
  const principal = (year: number) => remainingPrincipal(year) - remainingPrincipal(year + 1);
  const count = years === "5 Years" ? 5 : 10;
  const factor = (name: string, year: number) =>
    Array.from(
      { length: year },
      (_, i) => 1 + (overrides[name]?.[i + 1] ?? value(name)) / 100,
    ).reduce((product, rate) => product * rate, 1);
  function annualValue(line: (typeof lineSeed)[number], year: number): number {
    const overridden = overrides[line.name]?.[year];
    if (overridden !== undefined) return overridden;
    if (line.group === "GROWTH RATES")
      return year === 0 && line.name !== "Appreciation Rate" ? 0 : line.value;
    if (line.name === "Vacancy")
      return (
        (-annualValue(
          lines.find((l) => l.name === "Rental Income")!,
          year,
        ) *
          line.value) /
        100
      );
    if (line.name === "Property Mgmt")
      return (
        ((annualValue(
          lines.find((l) => l.name === "Rental Income")!,
          year,
        ) +
          annualValue(
            lines.find((l) => l.name === "Vacancy")!,
            year,
          )) *
          line.value) /
        100
      );
    return (
      line.value *
      (line.basis === "Monthly" ? 12 : 1) *
      factor(line.group === "REVENUES" ? "Revenue Growth" : "Expense Growth", year)
    );
  }
  const income = (year: number) =>
    lines
      .filter((line) => line.group === "REVENUES")
      .reduce((sum, line) => sum + annualValue(line, year), 0);
  const expenses = (year: number) =>
    lines
      .filter((line) => line.group === "EXPENSES")
      .reduce((sum, line) => sum + annualValue(line, year), 0);
  const noi = (y: number) => income(y) - expenses(y);
  const format = (v: number) => Math.round(v).toLocaleString();
  return (
    <GridFrame
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
          event.preventDefault();
          undo();
        }
      }}
      title="Fourplex Pro Forma"
      description={`Year ${focus + 1} · NOI ${format(noi(focus))} · Cash Flow ${format(noi(focus) - debt * 12)} · Total ROI ${(((noi(focus) - debt * 12 + price * 0.03 + principal(focus)) / cash) * 100).toFixed(1)}%`}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-sm"
            disabled={!history.length}
            onClick={undo}
          >
            Undo
          </Button>
          <Choice
            value={years}
            onChange={setYears}
            options={["5 Years", "10 Years"]}
            label="Forecast period"
          />
          <TableOptions
            columns={["GROWTH RATES", "REVENUES", "EXPENSES"]}
            hidden={collapsed}
            setHidden={setCollapsed}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-sm"
            onClick={() => {
              remember();
              setOverrides({});
              setLines(lineSeed);
              setPrice(425000);
              setDown(25);
              setClosing(8500);
              setRate(6.5);
              setTerm(30);
            }}
          >
            <RefreshCw />
            Reset
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3 border-b px-3 py-1 text-xs">
        {[
          ["Price", price, setPrice],
          ["Down", down, setDown],
          ["Closing", closing, setClosing],
          ["Rate", rate, setRate],
          ["Term", term, setTerm],
        ].map(([label, v, set]) => (
          <label key={String(label)} className="flex items-center gap-1 text-muted-foreground">
            {String(label)}
            <NumericField
              label={String(label)}
              value={Number(v)}
              min={label === "Term" ? 1 : 0}
              max={label === "Down" ? 100 : undefined}
              step={label === "Rate" ? 0.1 : 1}
              className="w-20 [&_[data-slot=number-field-group]]:h-6"
              onValueChange={(value) => {
                remember();
                (set as (value: number) => void)(value);
              }}
            />
            {label === "Down" || label === "Rate" ? "%" : label === "Term" ? "yr" : ""}
          </label>
        ))}
        <span className="ml-auto">
          Loan <b className="text-foreground">${(loan / 1000).toFixed(1)}K</b> · Cash In{" "}
          <b className="text-foreground">${(cash / 1000).toFixed(1)}K</b> · Payment{" "}
          <b className="text-foreground">{format(debt)}/mo</b>
        </span>
      </div>
      <ProFormaModelGrid
        lines={lines}
        overrides={overrides}
        count={count}
        focus={focus}
        setFocus={setFocus}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        annualValue={annualValue}
        income={income}
        expenses={expenses}
        noi={noi}
        debt={debt}
        price={price}
        cash={cash}
        principal={principal}
        format={format}
        onCommit={(changes) => {
          remember();
          let nextLines = lines.map((line) => ({ ...line }));
          const nextOverrides = structuredClone(overrides);
          for (const change of changes) {
            if (change.columnId === "monthly")
              nextLines = nextLines.map((line) =>
                line.name === change.name ? { ...line, value: change.value } : line,
              );
            else {
              const year = Number(change.columnId.slice(5));
              nextOverrides[change.name] = { ...nextOverrides[change.name], [year]: change.value };
            }
          }
          setLines(nextLines);
          setOverrides(nextOverrides);
          setPasteStatus(`${changes.length} cells updated`);
        }}
      />
      <footer className="flex flex-wrap justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
        <span>
          <span className="text-blue-500">Blue figures</span> are inputs. Click a cell to edit or
          paste a range. Ctrl/⌘ + Z to undo.
        </span>
        <span role="status">{pasteStatus || "Click a year to focus it."}</span>
      </footer>
    </GridFrame>
  );
}
type FinanceLine = (typeof lineSeed)[number];
type FinanceRecord = FinanceLine & {
  children?: FinanceRecord[];
  summary?: string;
  computed?: boolean;
};
function ProFormaModelGrid({
  lines,
  overrides,
  count,
  focus,
  setFocus,
  collapsed,
  setCollapsed,
  annualValue,
  income,
  expenses,
  noi,
  debt,
  price,
  cash,
  principal,
  format,
  onCommit,
}: {
  lines: FinanceLine[];
  overrides: Record<string, Record<number, number>>;
  count: number;
  focus: number;
  setFocus: (year: number) => void;
  collapsed: string[];
  setCollapsed: (names: string[]) => void;
  annualValue: (line: FinanceLine, year: number) => number;
  income: (year: number) => number;
  expenses: (year: number) => number;
  noi: (year: number) => number;
  debt: number;
  price: number;
  cash: number;
  principal: (year: number) => number;
  format: (value: number) => string;
  onCommit: (changes: { name: string; columnId: string; value: number }[]) => void;
}) {
  const summaries = ["NOI", "CASH FLOW", "Cash Available", "TOTAL ROI"];
  const data = useMemo<FinanceRecord[]>(
    () => [
      ...["GROWTH RATES", "REVENUES", "EXPENSES"].map((group) => ({
        name: group,
        basis: "",
        group,
        value: 0,
        children: lines
          .filter((line) => line.group === group)
          .flatMap((line) =>
            line.name === "Vacancy"
              ? [line, { name: "Effective Rent", basis: "", group, value: 0, computed: true }]
              : [line],
          ),
      })),
      ...summaries.map((name) => ({ name, basis: "", group: "", value: 0, summary: name })),
    ],
    [lines],
  );
  const annual = (record: FinanceRecord, year: number) =>
    record.children
      ? record.group === "REVENUES"
        ? income(year)
        : record.group === "EXPENSES"
          ? expenses(year)
          : 0
      : record.summary
        ? record.summary === "NOI"
          ? noi(year)
          : record.summary === "CASH FLOW"
            ? noi(year) - debt * 12
            : record.summary === "Cash Available"
              ? noi(year)
              : ((noi(year) - debt * 12 + price * Math.pow(1.03, year) * 0.03 + principal(year)) /
                  cash) *
                100
        : record.computed
          ? annualValue(
              lines.find((line) => line.name === "Rental Income")!,
              year,
            ) +
            annualValue(
              lines.find((line) => line.name === "Vacancy")!,
              year,
            )
          : annualValue(record, year);
  const editable = (row: FinanceRecord) => !row.children && !row.summary && !row.computed;
  const parse = (raw: string) => {
    const cleaned = raw
      .trim()
      .replace(/[$,%\s]/g, "")
      .replace(/^\((.*)\)$/, "-$1");
    const number = Number(cleaned);
    return cleaned && Number.isFinite(number) ? number : undefined;
  };
  const columns = useMemo<DomainColumn<FinanceRecord>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Line item",
        size: 210,
        enableHiding: false,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <button
              data-finance-group={row.original.group}
              aria-label={`${row.getIsExpanded() ? "Collapse" : "Expand"} ${row.original.name}`}
              aria-expanded={row.getIsExpanded()}
              className="flex items-center gap-2 text-xs font-medium"
              onClick={() => row.toggleExpanded()}
            >
              <ChevronRight className={cn("size-3", row.getIsExpanded() && "rotate-90")} />
              {row.original.name}
            </button>
          ) : (
            <span
              data-finance-summary={row.original.summary?.replaceAll(" ", "_")}
              className={cn(
                "text-[13px]",
                !row.original.summary && "pl-3",
                (row.original.summary || row.original.computed) && "font-semibold",
              )}
            >
              {row.original.name}
            </span>
          ),
      },
      {
        id: "basis",
        accessorKey: "basis",
        header: "Basis",
        size: 110,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {row.original.basis}
          </span>
        ),
      },
      {
        id: "monthly",
        accessorFn: (record: FinanceRecord) =>
          record.children || record.summary || record.computed
            ? annual(record, 0) / 12
            : record.value,
        header: "Monthly",
        size: 90,
        cell: ({ row }) =>
          editable(row.original) ? (
            <span aria-label={`Edit ${row.original.name}`} className="text-[13px] text-blue-500">
              {row.original.percent
                ? `${row.original.value.toFixed(1)}%`
                : format(row.original.value)}
              {row.original.basis === "Annual" ? "/yr" : ""}
            </span>
          ) : row.original.children && row.original.group === "GROWTH RATES" ? null : (
            <span className="text-xs font-medium">
              {row.original.summary === "TOTAL ROI" ? "" : format(annual(row.original, 0) / 12)}
            </span>
          ),
        meta: {
          cellClassName: "text-right",
          cellEdit: {
            control: "text",
            editable: (row) => editable(row as FinanceRecord),
            parse: (raw) => {
              const value = parse(raw);
              return value !== undefined && value >= 0 ? value : undefined;
            },
            format: (value) => String(value),
          },
        },
      },
      ...Array.from(
        { length: count },
        (_, year) =>
          ({
            id: `year-${year}`,
            accessorFn: (record: FinanceRecord) => annual(record, year),
            header: () => (
              <button aria-pressed={focus === year} onClick={() => setFocus(year)}>
                Year {year + 1}
              </button>
            ),
            size: 80,
            cell: ({ row }) => {
              const record = row.original;
              const value = annual(record, year);
              return record.children && record.group === "GROWTH RATES" ? null : (
                <span
                  aria-label={editable(record) ? `Edit ${record.name} Year ${year + 1}` : undefined}
                  className={cn(
                    "text-xs tabular-nums",
                    overrides[record.name]?.[year] !== undefined && "text-blue-500",
                    (record.children || record.summary) && "font-medium",
                  )}
                >
                  {record.summary === "TOTAL ROI" || record.group === "GROWTH RATES"
                    ? `${value.toFixed(1)}%`
                    : value < 0
                      ? `(${format(-value)})`
                      : format(value)}
                </span>
              );
            },
            meta: {
              headerTitle: `Year ${year + 1}`,
              cellClassName: cn("text-right", focus === year && "bg-blue-500/5"),
              cellEdit: {
                control: "text",
                editable: (row) => editable(row as FinanceRecord),
                parse: (raw) => parse(raw),
                format: (value) => String(value),
              },
            },
          }) satisfies DomainColumn<FinanceRecord>,
      ),
    ],
    [lines, overrides, count, focus, debt, price, cash],
  );
  const table = useDomainGrid({
    data,
    columns,
    getRowId: (r) => r.name,
    getSubRows: (r) => r.children,
    expanded: Object.fromEntries(
      data.filter((r) => r.children && !collapsed.includes(r.name)).map((r) => [r.name, true]),
    ),
    onExpandedChange: (next) =>
      setCollapsed(
        next === true ? [] : data.filter((r) => r.children && !next[r.name]).map((r) => r.name),
      ),
  });
  return (
    <DomainGridSurface
      table={table}
      layout={{
        cellBorder: true,
        cellSelection: true,
        cellSelectionMode: "range",
        cellEditMode: "click",
        cellEditEnterAdvance: true,
      }}
      className="[&_tbody_tr]:h-7 [&_td]:py-1 [&_tr:has([data-finance-summary=NOI])]:bg-blue-500/10 [&_tr:has([data-finance-summary=NOI])]:text-blue-700 [&_tr:has([data-finance-summary=CASH_FLOW])]:bg-orange-500/10 [&_tr:has([data-finance-group=REVENUES])]:bg-emerald-500/10 [&_tr:has([data-finance-group=EXPENSES])]:bg-amber-500/10"
      onCellsChange={(details) => {
        if (details.changes.length)
          onCommit(
            details.changes.map((change) => ({
              name: change.row.name,
              columnId: change.columnId,
              value: Number(change.value),
            })),
          );
        if (details.rejected.length)
          toast.error(`${details.rejected.length} read-only or invalid cells skipped`);
      }}
    />
  );
}
const retailerNames = [
  "Hedgerow & Fell",
  "Alpenrand Sport",
  "Blue Spruce Mercantile",
  "Basecamp Collective",
  "Tidewater Paddle Co.",
  "Polder Outdoor",
  "Granite Peak Outfitters",
  "Southern Ridge Gear",
  "Aiguille Sports",
  "Sentier Montagne",
];
export function Wholesale() {
  const [rows, setRows] = useState(
    retailerNames.map((name, i) => ({
      id: i + 1,
      name,
      city: [
        "Kendal",
        "Munich",
        "Bozeman",
        "Seattle",
        "Portland",
        "Utrecht",
        "Boulder",
        "Hobart",
        "Chamonix",
        "Annecy",
      ][i],
      decision: i === 0 || i === 7 ? "Declined" : i > 5 || i === 4 ? "In Review" : "Approved",
      limit: [5000, 35000, 20000, 75000, 10000, 30000, 40000, 5000, 15000, 15000][i],
      credit: [52, 90, 83, 91, 74, 84, 81, 44, 70, 72][i],
      checks: [i % 5 !== 0, true, i % 3 === 0, i % 4 === 0],
      doors: [0, 2, 0, 4, 0, 2, 3, 0, 0, 0][i],
    })),
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All decisions");
  const [expanded, setExpanded] = useState<number[]>([7]);
  const [selected, setSelected] = useState<number[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const filtered = rows.filter(
    (r) => domainTextMatches(r, search) && (status === "All decisions" || r.decision === status),
  );
  const update = (id: number, key: "decision" | "checks", v: string | boolean[]) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: v } : r)));
  return (
    <GridFrame
      title="Wholesale Applications"
      description="Credit and door checks before shipping"
      actions={
        <>
          <ExportRows name="wholesale" rows={filtered} />
          <AddRecord
            label="New Application"
            title="Wholesale application"
            fields={[
              { name: "name", label: "Retailer" },
              { name: "city", label: "City" },
            ]}
            onSave={(v) =>
              setRows((rs) => [
                ...rs,
                {
                  ...rs[0],
                  id: rs.length + 1,
                  name: v.name,
                  city: v.city,
                  decision: "In Review",
                  checks: [false, false, false, false],
                  doors: 0,
                },
              ])
            }
          />
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <GridSearch
          value={search}
          onChange={setSearch}
          placeholder="Search retailer, city, buyer..."
        />
        <Choice
          label="Application decision"
          value={status}
          onChange={setStatus}
          options={["All decisions", "In Review", "Approved", "Declined"]}
        />
        <div className="ml-auto">
          <TableOptions
            columns={["Credit", "Resale", "Lease", "Visit", "Fixtures"]}
            hidden={hidden}
            setHidden={setHidden}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-b p-2 md:grid-cols-4">
        {[
          [
            "In Review",
            "3 past 14-day target",
            rows.filter((r) => r.decision === "In Review").length,
          ],
          ["Ships Soon", "None overdue", 4],
          ["Short on Credit", "$37K short in total", rows.filter((r) => r.credit < 85).length],
          ["Blocked", "5 doors failing", rows.filter((r) => r.decision === "Declined").length],
        ].map(([name, desc, n]) => (
          <button
            key={name}
            onClick={() =>
              setStatus(
                name === "In Review"
                  ? "In Review"
                  : name === "Blocked"
                    ? "Declined"
                    : "All decisions",
              )
            }
            className="rounded-lg border bg-muted/10 p-2 text-left"
          >
            <span className="flex justify-between font-medium">
              {name}
              <b className="text-lg">{n}</b>
            </span>
            <span
              className={cn(
                "text-xs",
                name === "Blocked" ? "text-rose-500" : "text-muted-foreground",
              )}
            >
              {desc}
            </span>
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="flex items-center gap-3 border-b bg-blue-500/5 px-3 py-2">
          <span>{selected.length} selected</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setRows((rs) =>
                rs.map((r) => (selected.includes(r.id) ? { ...r, decision: "Approved" } : r)),
              );
              setSelected([]);
            }}
          >
            Approve selected
          </Button>
        </div>
      )}
      <WholesaleModelGrid
        rows={rows}
        search={search}
        status={status}
        expanded={expanded}
        setExpanded={setExpanded}
        selected={selected}
        setSelected={setSelected}
        hidden={hidden}
        setHidden={setHidden}
        update={update}
        remove={(id) => setRows((rs) => rs.filter((r) => r.id !== id))}
      />
    </GridFrame>
  );
}
type WholesaleRetailer = {
  id: number;
  name: string;
  city: string;
  decision: string;
  limit: number;
  credit: number;
  checks: boolean[];
  doors: number;
};
type WholesaleRecord = WholesaleRetailer & {
  nodeId: string;
  parent?: number;
  children?: WholesaleRecord[];
};
function WholesaleModelGrid({
  rows,
  search,
  status,
  expanded,
  setExpanded,
  selected,
  setSelected,
  hidden,
  setHidden,
  update,
  remove,
}: {
  rows: WholesaleRetailer[];
  search: string;
  status: string;
  expanded: number[];
  setExpanded: (ids: number[]) => void;
  selected: number[];
  setSelected: (ids: number[]) => void;
  hidden: string[];
  setHidden: (names: string[]) => void;
  update: (id: number, key: "decision" | "checks", value: string | boolean[]) => void;
  remove: (id: number) => void;
}) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const data = useMemo<WholesaleRecord[]>(
    () =>
      rows.map((r) => ({
        ...r,
        nodeId: String(r.id),
        children: r.doors
          ? Array.from({ length: r.doors }, (_, i) => ({
              ...r,
              nodeId: `${r.id}-door-${i}`,
              parent: r.id,
              name: ["Pearl Street", "Larimer Square", "Old Town", "Market Street"][i],
              doors: 0,
            }))
          : undefined,
      })),
    [rows],
  );
  return (
    <DomainRecordGrid
      data={data}
      pagination={pagination}
      onPaginationChange={setPagination}
      paginationControls={{ noun: "applications" }}
      search={search}
      rowFilter={(r) => status === "All decisions" || r.decision === status}
      getRowId={(r) => r.nodeId}
      getSubRows={(r) => r.children}
      canSelect={(r) => !r.parent}
      expanded={Object.fromEntries(expanded.map((id) => [String(id), true]))}
      onExpandedChange={(next) =>
        setExpanded(
          next === true
            ? rows.filter((r) => r.doors).map((r) => r.id)
            : Object.keys(next)
                .filter((id) => next[id] && !id.includes("-door-"))
                .map(Number),
        )
      }
      selection={selected.map(String)}
      onSelectionChange={(ids) => setSelected(ids.map(Number))}
      hidden={hidden}
      onHiddenChange={setHidden}
      className="[&_tbody_tr]:h-12"
      fields={[
        {
          id: "select",
          title: "",
          value: (r) => r.id,
          size: 40,
          render: (r, _i, row) =>
            !r.parent && (
              <Checkbox
                aria-label={`Select ${r.name}`}
                checked={row.getIsSelected()}
                onCheckedChange={(v) => row.toggleSelected(!!v)}
              />
            ),
        },
        {
          id: "name",
          title: "Retailer",
          value: (r) => r.name,
          size: 245,
          render: (r, i, row) => (
            <div className={cn("flex items-center gap-1", r.parent && "pl-5")}>
              <button
                aria-label={`Expand doors for ${r.name}`}
                aria-expanded={row.getIsExpanded()}
                disabled={!row.getCanExpand()}
                className="disabled:invisible"
                onClick={() => row.toggleExpanded()}
              >
                <ChevronRight className={cn("size-3", row.getIsExpanded() && "rotate-90")} />
              </button>
              <div>
                <b className="font-medium">{r.name}</b>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {!r.parent && ["🇬🇧", "🇩🇪", "🇺🇸", "🇺🇸", "🇺🇸", "🇳🇱"][i % 6]} {r.city}
                  {r.doors ? ` · ${r.doors} doors` : ""}
                </span>
              </div>
            </div>
          ),
        },
        {
          id: "ships",
          title: "Ships",
          value: (r) => r.id,
          size: 90,
          render: (r, i) =>
            r.parent ? (
              <span className="text-xs text-muted-foreground">Door {i + 1}</span>
            ) : (
              <span className={i > 3 ? "text-amber-500" : ""}>
                {i > 3 ? `In ${i - 2} days` : `Oct ${12 + (i % 3)}`}
              </span>
            ),
        },
        {
          id: "decision",
          title: "Decision",
          value: (r) => r.decision,
          size: 116,
          render: (r) =>
            !r.parent ? (
              <Choice
                label={`Decision for ${r.name}`}
                value={r.decision}
                onChange={(v) => update(r.id, "decision", v)}
                options={["Approved", "In Review", "Declined"]}
                className={cn(
                  "h-7 min-w-24 border-0 px-1 text-xs shadow-none",
                  r.decision === "Approved"
                    ? "text-emerald-600"
                    : r.decision === "Declined"
                      ? "text-rose-500"
                      : "text-violet-500",
                )}
              />
            ) : (
              <span className="text-xs text-muted-foreground">
                {r.checks.every(Boolean) ? "Ready for shipment" : "Outstanding checks"}
              </span>
            ),
        },
        {
          id: "limit",
          title: "Limit",
          value: (r) => r.limit,
          size: 105,
          render: (r) =>
            !r.parent && (
              <>
                <span className="font-medium">{money(r.limit)}</span>
                <span className="block text-xs text-muted-foreground">
                  Order {money(r.limit * 0.91)}
                </span>
              </>
            ),
        },
        {
          id: "credit",
          title: "Credit",
          value: (r) => r.credit,
          size: 70,
          render: (r) =>
            !r.parent && <span className={r.credit < 60 ? "text-rose-500" : ""}>{r.credit}</span>,
        },
        ...["Resale", "Lease", "Visit", "Fixtures"].map((name, i) => ({
          id: name,
          title: name,
          size: 70,
          value: (r: WholesaleRecord) => r.checks[i],
          render: (r: WholesaleRecord) =>
            !r.parent && (
              <CheckCell
                label={`${name} checked for ${r.name}`}
                checked={r.checks[i]}
                onChange={() =>
                  update(
                    r.id,
                    "checks",
                    r.checks.map((v, n) => (n === i ? !v : v)),
                  )
                }
              />
            ),
        })),
        {
          id: "readiness",
          title: "Readiness",
          value: (r) => r.checks.filter(Boolean).length,
          size: 120,
          render: (r) =>
            !r.parent && (
              <Meter
                value={(r.checks.filter(Boolean).length / 4) * 100}
                color={r.checks.every(Boolean) ? "bg-emerald-500" : "bg-amber-500"}
              />
            ),
        },
        {
          id: "actions",
          title: "",
          value: (r) => r.id,
          size: 36,
          render: (r) => !r.parent && <RowMenu name={r.name} onDelete={() => remove(r.id)} />,
        },
      ]}
    />
  );
}
const productPhotos = [
  "1550998358-08b4f83dc345",
  "1744814917810-269fbf29ca00",
  "1725829966109-89dff97ad2c5",
  "1547586877-0351a7143cbe",
  "1698732662028-2443c4acd739",
  "1596523027665-9da35ced2388",
  "1624548140129-74786c5f1279",
  "1624548140150-108c3287f551",
  "1608236159447-2d27116777f3",
  "1789110520148-bb52ba37759b",
];
export function ProductKpis() {
  const [rows, setRows] = useState(productKpiRows);
  const [query, setQuery] = useState("");
  const [window, setWindow] = useState("13W");
  const [status, setStatus] = useState("All statuses");
  const [page, setPage] = useState(0);
  const [nativePageSize, setNativePageSize] = useState(10);
  const [hidden, setHidden] = useState<string[]>([]);
  const [guardrail, setGuardrail] = useState("15");
  const factor = window === "4W" ? 4 / 13 : window === "26W" ? 2 : 1;
  return (
    <GridFrame
      title="Product KPIs"
      description={`${window === "13W" ? "13" : window === "4W" ? "4" : "26"} weeks to Oct 11, vs prior ${window === "13W" ? "13" : window === "4W" ? "4" : "26"} weeks`}
      actions={
        <>
          <div className="flex rounded border p-0.5">
            {["4W", "13W", "26W"].map((w) => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                aria-pressed={window === w}
                className={cn(
                  "rounded px-2 py-1 text-[13px]",
                  window === w && "bg-muted font-medium",
                )}
              >
                {w}
              </button>
            ))}
          </div>
          <AddRecord
            label="Add Product"
            title="Add product"
            fields={[{ name: "name", label: "Product name" }]}
            onSave={(v) =>
              setRows((rs) => [
                ...rs,
                {
                  id: rs.length + 1,
                  name: v.name,
                  sku: `NEW-${rs.length + 1}`,
                  revenue: 0,
                  profit: 0,
                  change: 0,
                  status: "No Sales",
                },
              ])
            }
          />
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <GridSearch
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(0);
          }}
          placeholder="Search products..."
        />
        <Choice
          label="KPI status filter"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          options={["All statuses", "On Track", "At Risk", "Off Track", "No Sales", "Returned"]}
        />
        <div className="ml-auto flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-sm">
                <SlidersHorizontal />
                Guardrails
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <label className="text-sm">
                Minimum profit margin %
                <Input
                  aria-label="Minimum profit margin"
                  type="number"
                  value={guardrail}
                  onChange={(e) => setGuardrail(e.target.value)}
                  className="mt-2 h-8"
                />
              </label>
              <p className="mt-2 text-[13px] text-muted-foreground">
                Products below {guardrail}% profit margin are highlighted.
              </p>
            </PopoverContent>
          </Popover>
          <TableOptions
            columns={["Revenue Trend", "Promo Calendar", "Profit"]}
            hidden={hidden}
            setHidden={setHidden}
          />
        </div>
      </div>
      <DomainRecordGrid
        data={rows}
        search={query}
        rowFilter={(r) => status === "All statuses" || r.status === status}
        hidden={hidden}
        onHiddenChange={setHidden}
        pagination={{ pageIndex: page, pageSize: nativePageSize }}
        onPaginationChange={(p) => {
          setPage(p.pageIndex);
          setNativePageSize(p.pageSize);
        }}
        paginationControls
        className="[&_tbody_tr]:h-12"
        fields={[
          {
            id: "name",
            title: "Product",
            value: (r) => r.name,
            size: 290,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <div className="flex items-center gap-2">
                    <img
                      alt=""
                      src={`https://images.unsplash.com/photo-${productPhotos[(r.id - 1) % 10]}?w=96&h=96&fit=crop&q=80`}
                      className="size-7 rounded-md object-cover"
                    />
                    <div>
                      <span className="font-medium">{r.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        ID: {(r.id - 1) % 10 < 6 ? "FW" : "AP"}-{5973 - r.id * 67}
                      </span>
                    </div>
                  </div>
                </>
              );
            },
          },
          {
            id: "revenue",
            title: "Revenue",
            value: (r) => r.revenue * factor,
            size: 150,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  {r.revenue ? (
                    <div className="flex items-center gap-2">
                      <b>${((r.revenue * factor) / 1000).toFixed(1)}K</b>
                      <span
                        className={cn(
                          "text-xs",
                          r.change > 0 ? "text-emerald-500" : "text-rose-500",
                        )}
                      >
                        {r.change > 0 ? "↗ +" : "↘ "}
                        {r.change}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {r.status === "Returned" ? "Returned" : "No sales"}
                    </span>
                  )}
                </>
              );
            },
          },
          {
            id: "trend",
            title: "Revenue Trend",
            value: (r) => r.change,
            size: 160,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  {r.revenue ? (
                    <Spark seed={r.id} color="#26a69a" secondary />
                  ) : (
                    <span className="text-muted-foreground">
                      {r.status === "Returned" ? "Returned" : "No sales"}
                    </span>
                  )}
                </>
              );
            },
          },
          {
            id: "profit",
            title: "Profit",
            value: (r) => r.profit * factor,
            size: 100,
            className: (r) =>
              cn(
                cellClass,
                "text-right font-medium",
                r.revenue && (r.profit / r.revenue) * 100 < Number(guardrail) && "text-rose-500",
              ),
            render: (r, _i, _gridRow) => {
              return (
                <>
                  {r.profit
                    ? `${r.profit < 0 ? "-" : ""}$${((Math.abs(r.profit) * factor) / 1000).toFixed(1)}K`
                    : "No sales"}
                </>
              );
            },
          },
          {
            id: "calendar",
            title: "Promo Calendar",
            value: (r) => r.id,
            size: 230,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <div
                    className="flex gap-px"
                    role="img"
                    aria-label={`Promo calendar for ${r.name}`}
                  >
                    {Array.from({ length: 39 }, (_, i) => (
                      <span
                        key={i}
                        title={`Week ${i + 1}`}
                        className={cn(
                          "h-1.5 w-1",
                          !r.revenue
                            ? "bg-muted"
                            : i % 8 === r.id % 8 || i % 5 === 0
                              ? r.profit < 0
                                ? "bg-rose-400"
                                : "bg-violet-300"
                              : i > 26
                                ? "bg-emerald-300"
                                : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                </>
              );
            },
          },
          {
            id: "status",
            title: "KPI Status",
            value: (r) => r.status,
            size: 190,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <div className="flex justify-between gap-3">
                    <span>{r.status}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.revenue ? (r.status === "Off Track" ? "0/3 met" : "2/3 met") : ""}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-0.5 w-6 rounded",
                          !r.revenue
                            ? "bg-muted"
                            : r.status === "Off Track"
                              ? "bg-rose-500"
                              : i < 2
                                ? "bg-emerald-500"
                                : "bg-amber-500",
                        )}
                      />
                    ))}
                  </div>
                </>
              );
            },
          },
          {
            id: "actions",
            title: "",
            value: (r) => r.id,
            size: 40,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <RowMenu
                    name={r.name}
                    onDelete={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                  />
                </>
              );
            },
          },
        ]}
      />
      <div className="flex justify-end gap-3 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="text-violet-400">■ Promo week</span>
        <span className="text-rose-400">■ Promo at a loss</span>
        <span className="text-emerald-400">■ At target, full price</span>
        <span>This period</span>
        <span>Period before</span>
      </div>
    </GridFrame>
  );
}
const kitchenSeed = [
  "River North Grill",
  "Edgewater Taqueria",
  "Lakeview Grill",
  "Loop Café",
  "Hyde Park Café",
  "Pilsen Taqueria",
  "Avondale Pizzeria",
  "Fulton Market Grill",
  "Wicker Park Grill",
  "Andersonville Café",
  "Logan Square Diner",
  "South Loop Kitchen",
  "Uptown Bistro",
  "West Town Café",
  "Lincoln Park Grill",
  "Ravenswood Kitchen",
  "Bridgeport Grill",
  "Bucktown Café",
];
type Visit = { kitchen: number; day: number; service: string; status: string };
export function ServiceVisits() {
  const [kitchens, setKitchens] = useState(kitchenSeed);
  const [query, setQuery] = useState("");
  const [service, setService] = useState("All Services");
  const [status, setStatus] = useState("All statuses");
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState(0);
  const [nativePageSize, setNativePageSize] = useState(10);
  const [selected, setSelected] = useState<number[]>([]);
  const [visits, setVisits] = useState<Visit[]>(
    Array.from({ length: 45 }, (_, i) => ({
      kitchen: i % 18,
      day: (i * 5 + 8) % 21,
      service: ["Pest", "Cooling", "Grease", "Hood"][i % 4],
      status: ["Booked", "Complete", "Missed", "Due"][i % 4],
    })),
  );
  const [booking, setBooking] = useState<{
    kitchen: number;
    day: number;
  } | null>(null);
  const [bookService, setBookService] = useState("Pest");
  const [bookStatus, setBookStatus] = useState("Booked");
  const filtered = kitchens
    .map((name, i) => ({ name, id: i }))
    .filter(
      (r) =>
        `${r.name} ${["Grace Okoye", "Victor Hale", "Marcus Bell", "Elena Ruiz", "Andre Lewis", "Diana Whitfield"][r.id % 6]}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (status === "All statuses" ||
          visits.some((v) => v.kitchen === r.id && v.status === status)),
    );
  const date = (i: number) => new Date(Date.UTC(2026, 9, 12 + offset + i));
  const fmt = (i: number) =>
    date(i).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return (
    <GridFrame
      title="Service Visits"
      description={`${fmt(0)} to ${fmt(20)} · ${kitchens.length} kitchens`}
      actions={
        <>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous three weeks"
            onClick={() => setOffset((v) => v - 21)}
          >
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-sm" onClick={() => setOffset(0)}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next three weeks"
            onClick={() => setOffset((v) => v + 21)}
          >
            <ChevronRight />
          </Button>
          <AddRecord
            label="Add Kitchen"
            title="Add kitchen"
            fields={[{ name: "name", label: "Kitchen name" }]}
            onSave={(v) => setKitchens((ks) => [...ks, v.name])}
          />
          <Button
            size="sm"
            className="h-8 text-sm"
            onClick={() => setBooking({ kitchen: filtered[0]?.id || 0, day: 0 })}
          >
            <CalendarDays />
            Book Visit
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <GridSearch
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(0);
          }}
          placeholder="Kitchen, manager or crew..."
        />
        <Choice
          label="Service type"
          value={service}
          onChange={setService}
          options={["All Services", "Pest", "Cooling", "Grease", "Hood"]}
        />
        <Choice
          label="Visit status"
          value={status}
          onChange={setStatus}
          options={["All statuses", "Booked", "Complete", "Missed", "Due"]}
        />
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8 text-sm"
          onClick={() => {
            const ids = selected.length ? selected : filtered.map((r) => r.id);
            setVisits((vs) => [
              ...vs,
              ...ids.map((kitchen) => ({
                kitchen,
                day: offset + 10,
                service: service === "All Services" ? "Pest" : service,
                status: "Booked",
              })),
            ]);
            toast.success(`${ids.length} service visits booked`);
          }}
        >
          <CalendarDays />
          Book All{selected.length ? ` (${selected.length})` : ""}
        </Button>
      </div>
      <DomainRecordGrid
        data={kitchens.map((name, id) => ({
          name,
          id,
          manager: [
            "Grace Okoye",
            "Victor Hale",
            "Marcus Bell",
            "Elena Ruiz",
            "Andre Lewis",
            "Diana Whitfield",
          ][id % 6],
        }))}
        search={query}
        rowFilter={(r) =>
          status === "All statuses" || visits.some((v) => v.kitchen === r.id && v.status === status)
        }
        selection={selected.map(String)}
        onSelectionChange={(ids) => setSelected(ids.map(Number))}
        pagination={{ pageIndex: page, pageSize: nativePageSize }}
        onPaginationChange={(p) => {
          setPage(p.pageIndex);
          setNativePageSize(p.pageSize);
        }}
        paginationControls
        className="[&_tbody_tr]:h-12"
        layout={{ cellBorder: true }}
        fields={[
          {
            id: "select",
            title: "",
            value: (r) => r.id,
            size: 40,
            render: (r, _i, row) => (
              <Checkbox
                aria-label={`Select ${r.name}`}
                checked={row.getIsSelected()}
                onCheckedChange={(v) => row.toggleSelected(!!v)}
              />
            ),
          },
          {
            id: "name",
            title: "Kitchen",
            value: (r) => r.name,
            size: 220,
            render: (r) => (
              <div>
                <b className="font-medium">{r.name}</b>
                <span className="mt-0.5 block text-xs text-muted-foreground">{r.manager}</span>
              </div>
            ),
          },
          ...Array.from({ length: 21 }, (_, i) => ({
            id: `day-${i + offset}`,
            title: fmt(i),
            size: 31,
            header: () => (
              <div
                className={cn(
                  "text-center text-xs",
                  [0, 6].includes(date(i).getUTCDay()) && "bg-muted/30",
                )}
              >
                <span>{date(i).getUTCDate()}</span>
                <span className="block text-[11px] font-normal text-muted-foreground">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][date(i).getUTCDay()]}
                </span>
              </div>
            ),
            value: (r: { id: number }) =>
              visits.find((v) => v.kitchen === r.id && v.day === i + offset)?.status || "",
            className: "p-0 text-center",
            render: (r: { id: number; name: string }) => {
              const visit = visits.find(
                (v) =>
                  v.kitchen === r.id &&
                  v.day === i + offset &&
                  (service === "All Services" || v.service === service) &&
                  (status === "All statuses" || v.status === status),
              );
              return (
                <button
                  aria-label={`${visit ? "Edit" : "Book"} visit for ${r.name} on ${fmt(i)}${visit ? `, ${visit.service} ${visit.status}` : ""}`}
                  className={cn(
                    "flex h-12 w-full items-center justify-center hover:bg-muted/40",
                    visit?.status === "Booked"
                      ? "bg-violet-500/10 text-violet-500"
                      : visit?.status === "Complete"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : visit?.status === "Missed"
                          ? "bg-rose-500/10 text-rose-500"
                          : visit
                            ? "bg-amber-500/10 text-amber-500"
                            : "",
                  )}
                  onClick={() => {
                    setBooking({ kitchen: r.id, day: i + offset });
                    setBookService(visit?.service || "Pest");
                    setBookStatus(visit?.status || "Booked");
                  }}
                >
                  {visit?.status === "Complete" ? (
                    <Check className="size-3" />
                  ) : visit?.status === "Missed" ? (
                    <X className="size-3" />
                  ) : visit?.status === "Due" ? (
                    <Clock3 className="size-3" />
                  ) : visit ? (
                    <CalendarDays className="size-3" />
                  ) : null}
                </button>
              );
            },
          })),
          {
            id: "coverage",
            title: "Coverage",
            value: (r) => 50 + (r.id % 4) * 12,
            size: 135,
            render: (r) => (
              <>
                <Meter
                  value={50 + (r.id % 4) * 12}
                  color={r.id % 3 === 0 ? "bg-rose-500" : "bg-amber-500"}
                />
                <span className="mt-1 block text-[11px]">
                  {r.id % 3 ? "Cooling missed" : "Pest due Oct 21"}
                </span>
              </>
            ),
          },
          {
            id: "actions",
            title: "",
            value: (r) => r.id,
            size: 40,
            render: (r) => (
              <RowMenu
                name={r.name}
                onDelete={() => {
                  setKitchens((ks) => ks.map((k, i) => (i === r.id ? `${k} (inactive)` : k)));
                  setVisits((vs) => vs.filter((v) => v.kitchen !== r.id));
                }}
              />
            ),
          },
        ]}
      />
      <Dialog
        open={!!booking}
        onOpenChange={(o) => {
          if (!o) setBooking(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book service visit</DialogTitle>
            <DialogDescription>
              {booking &&
                `${kitchens[booking.kitchen]} · ${new Date(Date.UTC(2026, 9, 12 + booking.day)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Choice
              label="Kitchen"
              value={String(booking?.kitchen || 0)}
              onChange={(v) => setBooking((b) => (b ? { ...b, kitchen: Number(v) } : b))}
              options={kitchens.map((_, i) => String(i))}
              labels={Object.fromEntries(kitchens.map((name, i) => [String(i), name]))}
            />
            <Choice
              label="Visit service"
              value={bookService}
              onChange={setBookService}
              options={["Pest", "Cooling", "Grease", "Hood"]}
            />
            <Choice
              label="Booking status"
              value={bookStatus}
              onChange={setBookStatus}
              options={["Booked", "Complete", "Missed", "Due"]}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBooking(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (booking)
                  setVisits((vs) => [
                    ...vs.filter((v) => v.kitchen !== booking.kitchen || v.day !== booking.day),
                    { ...booking, service: bookService, status: bookStatus },
                  ]);
                setBooking(null);
              }}
            >
              Save visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GridFrame>
  );
}
