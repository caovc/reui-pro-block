import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Ellipsis,
  Filter,
  Plus,
  Search,
  ChevronsUpDown,
} from "lucide-react";
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid/data-grid";
import { DataGridTable, getPinningStyles } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { Frame, FrameHeader, FramePanel } from "@/components/reui/frame";
import { Filters } from "@/components/reui/filters/filters";
import type { FilterField } from "@/components/reui/filters/filters-types";
import { createFilterQuery } from "@/components/reui/filters/filters-query";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useDomainGrid,
  type DomainColumn,
  type DomainRow,
  type DomainTable,
  type ExpandedState,
} from "./grid-advanced-model-grid";
import { createStoreFixtures, STORE_MANAGERS, STORE_MARKETS } from "./grid-advanced-store-kpi-data";
import {
  GapBar,
  KpiUpCount,
  MonthMatrix,
  ReturnRate,
  ReturnsHistory,
  ValueBar,
} from "./grid-advanced-store-kpi-charts";
import { StoreForm, StorePicker } from "./grid-advanced-store-kpi-controls";
import {
  filterStores,
  groupStoreRows,
  kpiChange,
  KPI_DEFINITIONS,
  STORE_FORMATS,
  STORE_MONTHS,
  storeMetrics,
  type StoreFormat,
  type StoreGridRow,
  type StoreGrouping,
  type StoreMetrics,
  type StoreRecord,
} from "./grid-advanced-store-kpi-model";
import "./grid-advanced-store-kpi-board.css";

const cash = (value: number | null) =>
  value === null
    ? "No sales"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: value >= 1000000 ? 2 : 0,
      }).format(value);
const integer = (value: number | null) =>
  value === null ? "No sales" : value.toLocaleString("en-US");
const percent = (value: number | null, digits = 1) =>
  value === null ? "No goal" : value.toFixed(digits) + "%";
const signed = (value: number | null, suffix = "%") =>
  value === null ? "No base" : (value > 0 ? "+" : "") + value.toFixed(suffix ? 1 : 0) + suffix;
const options = (values: readonly string[]) => values.map((value) => ({ value, label: value }));
// The observed official single-store search used two real rows plus three
// empty rows. Extending that five-row floor to other short expanded countries
// is an explicit Bricklane demo layout policy, not a universal vendor claim.
const COUNTRY_MIN_ROWS = 5;
type StoreTableCore = Pick<
  DomainTable<StoreGridRow>,
  "getRowModel" | "getCoreRowModel" | "setExpanded"
>;

const FILTER_FIELDS: FilterField[] = [
  {
    id: "market",
    label: "Market",
    type: "select",
    options: STORE_MARKETS.map((market) => ({ value: market.code, label: market.name })),
  },
  { id: "region", label: "Region", type: "select", options: options(["Americas", "EMEA", "APAC"]) },
  { id: "format", label: "Format", type: "select", options: options(STORE_FORMATS) },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: options(["Trading", "Refit", "Pre-opening"]),
  },
  { id: "manager", label: "Manager", type: "select", options: options(STORE_MANAGERS) },
  { id: "pace", label: "Goal Pace %", type: "number" },
  { id: "returns", label: "Return Rate %", type: "number" },
  { id: "up", label: "KPIs Up", type: "number" },
];

function InlineStoreName({
  record,
  onCommit,
  onCancel,
}: {
  record: StoreRecord;
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const cancelled = useRef(false);
  return (
    <Input
      autoFocus
      defaultValue={record.name}
      aria-label={"Name the new " + record.format.toLowerCase() + " store"}
      className="h-7 text-xs"
      onClick={(event) => event.stopPropagation()}
      onBlur={(event) => !cancelled.current && onCommit(event.target.value.trim() || "New Store")}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          cancelled.current = true;
          onCancel();
        }
      }}
    />
  );
}

function Pace({ value }: { value: number | null }) {
  if (value === null) return <span className="store-kpi-empty">No goal</span>;
  return (
    <span
      className={
        "store-kpi-pace " +
        (value >= 100 ? "is-positive" : value >= 95 ? "is-warning" : "is-danger")
      }
    >
      <i aria-hidden="true" />
      {percent(value, 0)}
    </span>
  );
}

function CountryRail({
  native,
  table,
  metrics,
  totalSales,
}: {
  native: DomainRow<StoreGridRow>;
  table: StoreTableCore;
  metrics: StoreMetrics;
  totalSales: number | null;
}) {
  const market = native.original.market;
  const visible = table.getRowModel().rows;
  const first = visible.findIndex((row) => row.original.market === market);
  if (first < 0 || visible[first].id !== native.id) return null;
  const following = visible.slice(first).findIndex((row) => row.original.market !== market);
  const count = following < 0 ? visible.length - first : following;
  const roots = table.getCoreRowModel().rows;
  const formats = roots.filter((row) => row.original.market === market);
  const expanded = formats.some((row) => row.getIsExpanded());
  const share =
    totalSales && metrics.values.sales ? (metrics.values.sales / totalSales) * 100 : null;
  return (
    <div
      className="store-kpi-country-rail"
      style={{ height: Math.max(count, expanded ? COUNTRY_MIN_ROWS : 1) * 36 }}
    >
      <div className="store-kpi-country-title">
        <strong>{native.original.marketName}</strong>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={(expanded ? "Collapse " : "Expand ") + native.original.marketName}
          aria-expanded={expanded}
          onClick={(event) => {
            event.stopPropagation();
            const next = Object.fromEntries(roots.map((row) => [row.id, row.getIsExpanded()]));
            for (const row of formats) next[row.id] = !expanded;
            table.setExpanded(next);
          }}
        >
          {expanded ? <span aria-hidden="true">−</span> : <ChevronsUpDown />}
        </Button>
      </div>
      {expanded && (
        <div className="store-kpi-country-summary">
          <div
            className={
              "store-kpi-country-pace " +
              (metrics.pace !== null && metrics.pace >= 100 ? "is-positive" : "is-warning")
            }
          >
            <strong>{percent(metrics.pace, 0)}</strong>
            <span>goal pace</span>
          </div>
          <dl>
            <dt>Sales Share</dt>
            <dd>{share === null ? "No sales" : percent(share, 0)}</dd>
            <dt>Goal</dt>
            <dd>
              {metrics.annualGoalCents === null ? "No goal" : cash(metrics.annualGoalCents / 100)}
            </dd>
            <dt>Net Sales</dt>
            <dd>{cash(metrics.values.sales)}</dd>
            <dt>Orders</dt>
            <dd>{integer(metrics.values.orders)}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}

function MetricHeader({
  title,
  value,
  delta,
  series,
  month,
  onMonthChange,
  color,
  sliderLabel,
}: {
  title: string;
  value: string;
  delta?: string;
  series: (number | null)[];
  month: number;
  onMonthChange: (month: number) => void;
  color: string;
  sliderLabel: string;
}) {
  return (
    <div className="store-kpi-metric-header">
      <div className="store-kpi-metric-caption">
        <span style={{ background: color }} />
        {title}
      </div>
      <div className="store-kpi-metric-value">
        <strong>{value}</strong>
        {delta && <small>{delta}</small>}
      </div>
      <MonthMatrix
        values={series}
        month={month}
        onMonthChange={onMonthChange}
        color={color}
        label={sliderLabel}
        valueText={value}
      />
    </div>
  );
}

export default function StoreKpiBoard() {
  const [stores, setStores] = useState(createStoreFixtures);
  const [month, setMonth] = useState(11);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(() => createFilterQuery());
  const [grouping, setGrouping] = useState<StoreGrouping>("store");
  const [expanded, setExpanded] = useState<ExpandedState>(() => ({
    "US:Flagship": true,
    "US:Standard": true,
    "US:Outlet": true,
  }));
  const [inlineId, setInlineId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    original: StoreRecord | null;
    market?: string;
    format?: StoreFormat;
    opener?: HTMLElement | null;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const addStoreButton = useRef<HTMLButtonElement>(null);
  const actionOrigin = useRef<HTMLElement | null>(null);
  const detailOrigin = useRef<HTMLElement | null>(null);
  const detailToEdit = useRef(false);
  const menuToForm = useRef(false);
  const mobile = useIsMobile();
  const scope = useMemo(
    () => filterStores(stores, search, query, month),
    [stores, search, query, month],
  );
  const rows = useMemo(() => groupStoreRows(scope, grouping), [scope, grouping]);
  const total = useMemo(() => storeMetrics(scope, month), [scope, month]);
  const marketTotals = useMemo(
    () =>
      new Map<string, StoreMetrics>(
        STORE_MARKETS.map((market) => [
          market.code,
          storeMetrics(
            scope.filter((store) => store.market === market.code),
            month,
          ),
        ]),
      ),
    [scope, month],
  );
  const timeline = useMemo(
    () => STORE_MONTHS.map((_, index) => storeMetrics(scope, index)),
    [scope],
  );
  const metricsById = useMemo(() => {
    const result = new Map<string, StoreMetrics>();
    const visit = (list: StoreGridRow[]) =>
      list.forEach((row) => {
        result.set(row.id, storeMetrics(row.records, month));
        if (row.subRows) visit(row.subRows);
      });
    visit(rows);
    return result;
  }, [rows, month]);
  const selected = stores.find((store) => store.id === selectedId) ?? null;
  const inlineRecord = stores.find((store) => store.id === inlineId);

  function saveStore(record: StoreRecord) {
    setStores((current) =>
      current.some((store) => store.id === record.id)
        ? current.map((store) => (store.id === record.id ? record : store))
        : [...current, record],
    );
    setForm(null);
    setAnnouncement(record.name + " saved.");
  }

  const startInline = useCallback((row: StoreGridRow) => {
    const market = STORE_MARKETS.find((entry) => entry.code === row.market)!;
    const record: StoreRecord = {
      id: "bricklane-store-" + crypto.randomUUID(),
      name: "New Store",
      market: market.code,
      marketName: market.name,
      region: market.region,
      format: row.format ?? "Standard",
      status: "Pre-opening",
      manager: STORE_MANAGERS[0],
      opened: null,
      annualGoalCents: null,
      facts: [],
    };
    setStores((current) => {
      const position = current.findIndex(
        (store) => store.market === market.code && store.format === record.format,
      );
      return position < 0
        ? [...current, record]
        : [...current.slice(0, position), record, ...current.slice(position)];
    });
    setExpanded((current) => ({ ...(current === true ? {} : current), [row.id]: true }));
    setInlineId(record.id);
    setAnnouncement("New Store joins " + market.name + " under " + record.format + ".");
  }, []);

  const inlineEditor = useCallback((record: StoreRecord) => {
    return (
      <InlineStoreName
        record={record}
        onCommit={(name) => {
          setStores((current) =>
            current.map((store) => (store.id === record.id ? { ...store, name } : store)),
          );
          setInlineId(null);
        }}
        onCancel={() => {
          setInlineId(null);
          setStores((current) => current.filter((store) => store.id !== record.id));
          setAnnouncement("Store creation cancelled.");
        }}
      />
    );
  }, []);

  function exportRecords(records: StoreRecord[]) {
    const quote = (value: unknown) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
    const data = [
      ["Store", "Market", "Format", "Month", "Net Sales USD", "Orders", "Return Rate %"],
      ...records.map((store) => {
        const metric = storeMetrics([store], month);
        return [
          store.name,
          store.marketName,
          store.format,
          STORE_MONTHS[month].label,
          metric.values.sales,
          metric.values.orders,
          metric.values.returnRate,
        ];
      }),
    ];
    const url = URL.createObjectURL(
      new Blob([data.map((row) => row.map(quote).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "bricklane-store-kpis-" + STORE_MONTHS[month].key + ".csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const columns = useMemo<DomainColumn<StoreGridRow>[]>(() => {
    const getMetric = (row: StoreGridRow) => metricsById.get(row.id)!;
    const siblingMaximum = (
      row: StoreGridRow,
      native: DomainRow<StoreGridRow>,
      metric: "sales" | "orders",
    ) => {
      const siblings =
        native.getParentRow()?.subRows.map((item) => item.original) ??
        rows.filter((item) => !row.market || item.market === row.market);
      return Math.max(1, ...siblings.map((item) => getMetric(item).values[metric] ?? 0));
    };
    const valueFor = (row: StoreGridRow, id: string) => {
      const metric = getMetric(row);
      if (id === "pace") return metric.pace;
      if (id === "gap") return metric.gap;
      if (id === "salesDelta") return metric.salesDelta;
      if (id === "ordersDelta") return metric.ordersDelta;
      if (id === "up") return metric.up;
      if (id === "upDelta") return metric.upDelta;
      if (id === "orders") return metric.values.orders;
      if (id === "returnRate" || id === "returnsChart") return metric.values.returnRate;
      return metric.values.sales;
    };
    const leaf = (
      id: string,
      title: string,
      render: (
        row: StoreGridRow,
        native: DomainRow<StoreGridRow>,
        table: StoreTableCore,
      ) => ReactNode,
      size = 82,
      accessor?: (row: StoreGridRow) => unknown,
    ): DomainColumn<StoreGridRow> => ({
      id,
      header: title,
      accessorFn: accessor ?? ((row) => valueFor(row, id)),
      size,
      minSize: size,
      // Native sorting keeps market segments contiguous for the pinned summary rail.
      sortFn: (left, right, columnId) => {
        if (
          left.original.kind === "format" &&
          right.original.kind === "format" &&
          left.original.market !== right.original.market
        ) {
          return String(left.original.market).localeCompare(String(right.original.market));
        }
        const a = left.getValue(columnId);
        const b = right.getValue(columnId);
        if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1;
        if (b === null || b === undefined) return -1;
        return typeof a === "number" && typeof b === "number"
          ? a - b
          : String(a).localeCompare(String(b));
      },
      meta: {
        headerTitle: title,
        headerClassName: "!h-8 !px-2 !text-xs",
        cellClassName: "!h-9 !py-0 !px-2 !text-xs",
      },
      cell: ({ row, table }) => render(row.original, row, table),
    });
    return [
      {
        id: "identity",
        header: () => (
          <div className="store-kpi-split">
            <span>Split by</span>
            <StorePicker
              label="Split by"
              value={grouping}
              options={options(["store", "market", "region"]).map((entry) => ({
                ...entry,
                label: entry.label[0].toUpperCase() + entry.label.slice(1),
              }))}
              onChange={(value) => setGrouping(value as StoreGrouping)}
            />
          </div>
        ),
        enableHiding: false,
        columns: [
          {
            ...leaf(
              "country",
              "Country",
              (row, native, nativeTable) =>
                row.market && marketTotals.has(row.market) ? (
                  <CountryRail
                    native={native}
                    table={nativeTable}
                    metrics={marketTotals.get(row.market)!}
                    totalSales={total.values.sales}
                  />
                ) : null,
              166,
            ),
            meta: {
              headerTitle: "Country",
              headerClassName: "!h-8 !px-4 !text-xs",
              cellClassName: "store-kpi-country-cell !h-9 !p-0 !text-xs",
            },
            enableSorting: false,
            enableHiding: false,
          },
          {
            ...leaf(
              "name",
              grouping === "store" ? "Store" : grouping === "market" ? "Market" : "Region",
              (row, native) =>
                row.kind === "format" ? (
                  <div className="store-kpi-format">
                    <strong>{row.label}</strong>
                    <span>{row.records.length}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={"Add " + row.format + " store in " + row.marketName}
                      onClick={(event) => {
                        event.stopPropagation();
                        startInline(row);
                      }}
                    >
                      <Plus />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="ml-auto"
                      aria-label={native.getIsExpanded() ? "Collapse row" : "Expand row"}
                      aria-expanded={native.getIsExpanded()}
                      onClick={(event) => {
                        event.stopPropagation();
                        native.toggleExpanded();
                      }}
                    >
                      {native.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
                    </Button>
                  </div>
                ) : row.kind === "store" ? (
                  inlineId === row.id ? (
                    inlineEditor(row.records[0])
                  ) : (
                    <button
                      type="button"
                      className="store-kpi-name"
                      onClick={(event) => {
                        detailOrigin.current = event.currentTarget;
                        detailToEdit.current = false;
                        setSelectedId(row.id);
                      }}
                    >
                      <span>{row.label}</span>
                      {row.records[0].status !== "Trading" && (
                        <Badge variant="outline">{row.records[0].status}</Badge>
                      )}
                    </button>
                  )
                ) : (
                  <span>
                    {row.label}
                    <small className="ml-2 text-muted-foreground">
                      {row.records.length} stores
                    </small>
                  </span>
                ),
              178,
              (row) => row.label,
            ),
            enableHiding: false,
          },
        ],
      },
      {
        id: "goalGroup",
        header: () => (
          <MetricHeader
            title="Goal"
            value={percent(total.pace, 0)}
            series={timeline.map((point) => point.pace)}
            month={month}
            onMonthChange={setMonth}
            color="#de29ed"
            sliderLabel="Goal pace month"
          />
        ),
        meta: { headerTitle: "Goal" },
        columns: [
          leaf("pace", "Pace", (row) => <Pace value={getMetric(row).pace} />),
          leaf("gap", "vs Goal", (row) => <GapBar value={getMetric(row).gap} />),
        ],
      },
      {
        id: "salesGroup",
        header: () => (
          <MetricHeader
            title="Net Sales"
            value={cash(total.values.sales)}
            delta={signed(total.salesDelta)}
            series={timeline.map((point) => point.values.sales)}
            month={month}
            onMonthChange={setMonth}
            color="#ff9800"
            sliderLabel="Net Sales month"
          />
        ),
        meta: { headerTitle: "Net Sales" },
        columns: [
          leaf("sales", STORE_MONTHS[month].shortLabel, (row, native) => (
            <ValueBar
              value={getMetric(row).values.sales}
              maximum={siblingMaximum(row, native, "sales")}
              label={cash(getMetric(row).values.sales)}
            />
          )),
          leaf("salesDelta", "vs LY", (row) => (
            <GapBar
              value={getMetric(row).salesDelta}
              label="versus last year"
              emptyLabel="No base"
            />
          )),
        ],
      },
      {
        id: "ordersGroup",
        header: () => (
          <MetricHeader
            title="Orders"
            value={integer(total.values.orders)}
            delta={signed(total.ordersDelta)}
            series={timeline.map((point) => point.values.orders)}
            month={month}
            onMonthChange={setMonth}
            color="#3b82f6"
            sliderLabel="Orders month"
          />
        ),
        meta: { headerTitle: "Orders" },
        columns: [
          leaf("orders", STORE_MONTHS[month].shortLabel, (row, native) => (
            <ValueBar
              value={getMetric(row).values.orders}
              maximum={siblingMaximum(row, native, "orders")}
              label={integer(getMetric(row).values.orders)}
            />
          )),
          leaf("ordersDelta", "vs LY", (row) => (
            <GapBar
              value={getMetric(row).ordersDelta}
              label="versus last year"
              emptyLabel="No base"
            />
          )),
        ],
      },
      {
        id: "upGroup",
        header: () => (
          <MetricHeader
            title="KPIs Up"
            value={total.up === null ? "No sales" : total.up + " of 7"}
            delta={signed(total.upDelta, "")}
            series={timeline.map((point) => point.up)}
            month={month}
            onMonthChange={setMonth}
            color="#00c16a"
            sliderLabel="KPIs up month"
          />
        ),
        meta: { headerTitle: "KPIs Up" },
        columns: [
          leaf("up", STORE_MONTHS[month].shortLabel, (row) => (
            <KpiUpCount value={getMetric(row).up} />
          )),
          leaf("upDelta", "vs " + (month ? STORE_MONTHS[month - 1].shortLabel : "Oct"), (row) => (
            <GapBar
              value={getMetric(row).upDelta}
              label="versus previous month"
              emptyLabel="No base"
              suffix=""
              digits={0}
            />
          )),
        ],
      },
      {
        id: "returnsGroup",
        header: () => (
          <MetricHeader
            title="Return Rate"
            value={total.values.returnRate === null ? "No sales" : percent(total.values.returnRate)}
            delta={signed(
              total.values.returnRate !== null && total.previousYear.returnRate !== null
                ? total.values.returnRate - total.previousYear.returnRate
                : null,
              " pts",
            )}
            series={timeline.map((point) => point.values.returnRate)}
            month={month}
            onMonthChange={setMonth}
            color="#ff2556"
            sliderLabel="Return Rate month"
          />
        ),
        meta: { headerTitle: "Return Rate" },
        columns: [
          leaf("returnsChart", "6 Months", (row) => (
            <ReturnsHistory values={getMetric(row).returnHistory} />
          )),
          leaf("returnRate", "Rate", (row) => (
            <ReturnRate value={getMetric(row).values.returnRate} />
          )),
        ],
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        size: 36,
        minSize: 36,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={"Actions for " + row.original.label}
                onPointerDown={(event) => {
                  actionOrigin.current = event.currentTarget;
                }}
                onFocus={(event) => {
                  actionOrigin.current = event.currentTarget;
                }}
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onCloseAutoFocus={(event) => {
                if (menuToForm.current) {
                  event.preventDefault();
                  menuToForm.current = false;
                }
              }}
            >
              <DropdownMenuItem
                onSelect={() => {
                  menuToForm.current = true;
                  if (row.original.kind === "store")
                    setForm({ original: row.original.records[0], opener: actionOrigin.current });
                  else
                    setForm({
                      original: null,
                      market: row.original.market,
                      format: row.original.format,
                      opener: actionOrigin.current,
                    });
                }}
              >
                {row.original.kind === "store" ? "Edit Store" : "Add Store"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
  }, [
    metricsById,
    rows,
    marketTotals,
    total,
    timeline,
    grouping,
    month,
    inlineId,
    startInline,
    inlineEditor,
  ]);

  const table = useDomainGrid({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.subRows,
    expanded,
    onExpandedChange: setExpanded,
    alwaysHidden: mobile || grouping !== "store" ? ["country"] : [],
  });
  useEffect(() => {
    table.setColumnPinning({
      start: mobile || grouping !== "store" ? ["name"] : ["country", "name"],
      end: [],
    });
  }, [table, mobile, grouping]);
  const visibleRows = table.getRowModel().rows;
  const visibleStores = visibleRows.filter((row) => row.original.kind === "store");
  const detailIndex = visibleStores.findIndex((row) => row.id === selectedId);
  const countrySegments = new Map<string, { count: number; expanded: boolean; lastId: string }>();
  for (const row of visibleRows) {
    const market = row.original.market;
    if (!market) continue;
    const segment = countrySegments.get(market) ?? { count: 0, expanded: false, lastId: "" };
    segment.count += 1;
    segment.expanded ||= row.original.kind === "format" && row.getIsExpanded();
    segment.lastId = row.id;
    countrySegments.set(market, segment);
  }
  function countryRowAfter(row: DomainRow<StoreGridRow>) {
    const segment = row.original.market ? countrySegments.get(row.original.market) : undefined;
    if (
      !table.getColumn("country")?.getIsVisible() ||
      !segment?.expanded ||
      segment.lastId !== row.id
    )
      return null;
    const columns = [
      ...table.getStartVisibleLeafColumns(),
      ...table.getCenterVisibleLeafColumns(),
      ...table.getEndVisibleLeafColumns(),
    ];
    return Array.from({ length: Math.max(0, COUNTRY_MIN_ROWS - segment.count) }, (_, index) => (
      <TableRow
        key={row.id + ":padding:" + index}
        aria-hidden="true"
        data-store-kpi-padding={row.original.market}
      >
        {columns.map((column) => (
          <TableCell
            key={column.id}
            className="store-kpi-padding-cell"
            style={getPinningStyles(column)}
          />
        ))}
      </TableRow>
    ));
  }

  const footerValues: Record<string, ReactNode> = {
    country: "Total " + scope.length + " stores",
    name: mobile || grouping !== "store" ? "Total " + scope.length + " stores" : "",
    pace: <Pace value={total.pace} />,
    gap: <GapBar value={total.gap} />,
    sales: (
      <ValueBar
        value={total.values.sales}
        maximum={total.values.sales ?? 1}
        label={cash(total.values.sales)}
      />
    ),
    salesDelta: <GapBar value={total.salesDelta} label="versus last year" emptyLabel="No base" />,
    orders: (
      <ValueBar
        value={total.values.orders}
        maximum={total.values.orders ?? 1}
        label={integer(total.values.orders)}
      />
    ),
    ordersDelta: <GapBar value={total.ordersDelta} label="versus last year" emptyLabel="No base" />,
    up: <KpiUpCount value={total.up} />,
    upDelta: "",
    returnsChart: <ReturnsHistory values={total.returnHistory} />,
    returnRate: <ReturnRate value={total.values.returnRate} />,
    actions: "",
  };
  const footer = (
    <tr>
      {table.getVisibleLeafColumns().map((column) => (
        <td
          key={column.id}
          style={{
            width: column.getSize(),
            position: column.getIsPinned() ? "sticky" : undefined,
            insetInlineStart:
              column.getIsPinned() === "start" ? column.getStart("start") : undefined,
          }}
        >
          {footerValues[column.id]}
        </td>
      ))}
    </tr>
  );
  const appendRow =
    inlineRecord && !scope.some((store) => store.id === inlineRecord.id) ? (
      <tr className="store-kpi-pending">
        <td colSpan={table.getVisibleLeafColumns().length}>
          <div>
            {inlineEditor(inlineRecord)}
            <span>New store is outside the current filter.</span>
          </div>
        </td>
      </tr>
    ) : undefined;

  return (
    <section className="store-kpi-board reui-reference" aria-label="Store sales KPIs">
      <DataGrid
        table={table}
        recordCount={scope.length}
        appendRow={appendRow}
        tableLayout={{
          width: "fixed",
          rowBorder: true,
          cellBorder: true,
          headerSticky: true,
          headerBackground: false,
          columnsPinnable: true,
        }}
        tableClassNames={{
          bodyRow: "h-9",
          headerRow: "store-kpi-header-row",
          base: "store-kpi-table",
        }}
      >
        <Frame className="store-kpi-frame">
          <FrameHeader className="store-kpi-toolbar">
            <div>
              <h1>Store KPIs</h1>
              <p>
                {STORE_MONTHS[month].label} vs {STORE_MONTHS[month].previousLabel}
                <span> · {scope.length} stores</span>
                <span className="store-kpi-market-count">
                  {" "}
                  · {new Set(scope.map((store) => store.market)).size} markets
                </span>
              </p>
            </div>
            <div className="store-kpi-tools">
              <div className="store-kpi-search">
                <Search />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search stores"
                  placeholder="Search stores"
                />
              </div>
              <Filters
                fields={FILTER_FIELDS}
                query={query}
                onQueryChange={setQuery}
                variant="advanced"
                advancedMode="popover"
                size="sm"
                trigger={
                  <Button variant="outline" size="icon-sm" aria-label="Filter">
                    <Filter />
                  </Button>
                }
              />
              <DataGridColumnVisibility
                table={table}
                trigger={
                  <Button variant="outline" size="icon-sm" aria-label="Columns">
                    <Columns3 />
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Export"
                onClick={() => exportRecords(scope)}
              >
                <Download />
              </Button>
              <div className="store-kpi-month-picker">
                <StorePicker
                  label="Month"
                  value={String(month)}
                  options={STORE_MONTHS.map((entry, index) => ({
                    value: String(index),
                    label: entry.label,
                  })).reverse()}
                  onChange={(value) => setMonth(Number(value))}
                />
              </div>
              <Button
                ref={addStoreButton}
                size="sm"
                onClick={(event) => setForm({ original: null, opener: event.currentTarget })}
                aria-label="Add Store"
              >
                <Plus />
                <span>Add Store</span>
              </Button>
            </div>
          </FrameHeader>
          <FramePanel className="store-kpi-grid-panel">
            <DataGridContainer className="rounded-none border-0">
              <DataGridScrollArea orientation="both" className="store-kpi-scroll">
                <DataGridTable<StoreGridRow> footerContent={footer} rowAfter={countryRowAfter} />
              </DataGridScrollArea>
            </DataGridContainer>
          </FramePanel>
        </Frame>
      </DataGrid>
      <span className="sr-only" role="status">
        {announcement}
      </span>
      {form && (
        <StoreForm
          original={form.original}
          initialMarket={form.market}
          initialFormat={form.format}
          onCancel={() => setForm(null)}
          onSave={saveStore}
          onReturnFocus={() => {
            (form.opener?.isConnected ? form.opener : addStoreButton.current)?.focus();
          }}
        />
      )}
      {selected && (
        <StoreDetails
          record={selected}
          month={month}
          position={detailIndex}
          visibleCount={visibleStores.length}
          onPrevious={() => detailIndex > 0 && setSelectedId(visibleStores[detailIndex - 1].id)}
          onNext={() =>
            detailIndex >= 0 &&
            detailIndex < visibleStores.length - 1 &&
            setSelectedId(visibleStores[detailIndex + 1].id)
          }
          onExport={() => exportRecords([selected])}
          onClose={() => setSelectedId(null)}
          onReturnFocus={() => {
            if (detailToEdit.current) {
              detailToEdit.current = false;
              return;
            }
            (detailOrigin.current?.isConnected
              ? detailOrigin.current
              : addStoreButton.current
            )?.focus();
          }}
          onEdit={() => {
            detailToEdit.current = true;
            setSelectedId(null);
            setForm({ original: selected, opener: detailOrigin.current });
          }}
        />
      )}
    </section>
  );
}

function StoreDetails({
  record,
  month,
  position,
  visibleCount,
  onPrevious,
  onNext,
  onExport,
  onClose,
  onEdit,
  onReturnFocus,
}: {
  record: StoreRecord;
  month: number;
  position: number;
  visibleCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onExport: () => void;
  onClose: () => void;
  onEdit: () => void;
  onReturnFocus: () => void;
}) {
  const metric = storeMetrics([record], month);
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onReturnFocus();
        }}
      >
        <SheetHeader>
          <SheetTitle>{record.name}</SheetTitle>
          <SheetDescription>
            {record.marketName} · {record.format} · {record.manager}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <div className="store-kpi-detail-actions">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous store"
              onClick={onPrevious}
              disabled={position <= 0}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next store"
              onClick={onNext}
              disabled={position < 0 || position >= visibleCount - 1}
            >
              <ChevronRight />
            </Button>
            <span>
              {position >= 0
                ? position + 1 + " of " + visibleCount + " stores in view"
                : "Outside current view"}
            </span>
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Export store CSV"
              onClick={onExport}
            >
              <Download />
            </Button>
          </div>
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="kpis">KPIs</TabsTrigger>
              <TabsTrigger value="returns">Returns</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <Frame>
                <FrameHeader>Goal Pace</FrameHeader>
                <FramePanel>
                  <Pace value={metric.pace} />
                  <p className="text-xs text-muted-foreground">
                    FY26 to the end of {STORE_MONTHS[month].label}
                  </p>
                  <dl className="store-kpi-details">
                    <dt>FY26 goal</dt>
                    <dd>
                      {metric.annualGoalCents === null
                        ? "No goal"
                        : cash(metric.annualGoalCents / 100)}
                    </dd>
                    <dt>Goal to date</dt>
                    <dd>
                      {metric.goalToDateCents === null
                        ? "No goal"
                        : cash(metric.goalToDateCents / 100)}
                    </dd>
                    <dt>Sales to date</dt>
                    <dd>
                      {metric.salesToDateCents ? cash(metric.salesToDateCents / 100) : "No sales"}
                    </dd>
                    <dt>
                      {metric.goalToDateCents !== null &&
                      metric.salesToDateCents >= metric.goalToDateCents
                        ? "Ahead by"
                        : "Behind by"}
                    </dt>
                    <dd>
                      {metric.goalToDateCents === null
                        ? "No goal"
                        : cash(Math.abs(metric.salesToDateCents - metric.goalToDateCents) / 100)}
                    </dd>
                    <dt>Status</dt>
                    <dd>{record.status}</dd>
                    <dt>Opened</dt>
                    <dd>{record.opened ?? "Not open yet"}</dd>
                  </dl>
                </FramePanel>
              </Frame>
            </TabsContent>
            <TabsContent value="kpis">
              <Frame>
                <FrameHeader>KPIs for {STORE_MONTHS[month].label}</FrameHeader>
                <FramePanel>
                  <dl className="store-kpi-details">
                    {KPI_DEFINITIONS.map((definition) => {
                      const value = metric.values[definition.id];
                      const change = kpiChange(definition.id, metric.values, metric.previousYear);
                      return (
                        <div key={definition.id}>
                          <dt>{definition.label}</dt>
                          <dd>
                            {value === null
                              ? "No sales"
                              : definition.unit === "currency"
                                ? cash(value)
                                : definition.unit === "percent"
                                  ? percent(value)
                                  : definition.unit === "integer"
                                    ? integer(value)
                                    : value.toFixed(2)}
                            <small>
                              {signed(change.delta, definition.unit === "percent" ? " pts" : "%")} ·{" "}
                              {change.status}
                            </small>
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </FramePanel>
              </Frame>
            </TabsContent>
            <TabsContent value="returns">
              <Frame>
                <FrameHeader>Units sold and returned</FrameHeader>
                <FramePanel>
                  <Table aria-label="Units sold and returned by month" className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Units</TableHead>
                        <TableHead>Returned</TableHead>
                        <TableHead>Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {record.facts
                        .filter((fact) => fact.month <= STORE_MONTHS[month].key)
                        .slice()
                        .sort((a, b) => b.month.localeCompare(a.month))
                        .map((fact) => (
                          <TableRow key={fact.month}>
                            <TableCell>
                              {new Intl.DateTimeFormat("en-US", {
                                month: "short",
                                year: "numeric",
                                timeZone: "UTC",
                              }).format(new Date(fact.month + "-01T00:00:00Z"))}
                            </TableCell>
                            <TableCell>{integer(fact.units)}</TableCell>
                            <TableCell>{integer(fact.returnedUnits)}</TableCell>
                            <TableCell>
                              {fact.units
                                ? percent((fact.returnedUnits / fact.units) * 100)
                                : "No sales"}
                            </TableCell>
                          </TableRow>
                        ))}
                      {!record.facts.length && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-muted-foreground">
                            No returns yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </FramePanel>
              </Frame>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
