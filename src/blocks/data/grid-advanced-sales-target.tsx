import { useCallback, useMemo, useRef, useState } from "react";
import {
  useTable,
  type ColumnDef,
  type ExpandedState,
  type SortingState,
  type ColumnVisibilityState,
  type ColumnPinningState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Ellipsis,
  ListFilter,
  MapPin,
  Plus,
  Search,
  Undo2,
} from "lucide-react";
import { Alert, AlertAction, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable, DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { Filters } from "@/components/reui/filters/filters";
import { createFilterQuery } from "@/components/reui/filters/filters-query";
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { downloadFile } from "@/lib/download";
import { useIsMobile } from "@/hooks/use-mobile";
import { FinanceSelect } from "./grid-advanced-finance-controls";
import { SalesAttainment, SalesMonthChart } from "./grid-advanced-sales-target-cells";
import { SalesTargetEditor } from "./grid-advanced-sales-target-panels";
import {
  createSalesTargetStores,
  filterSalesTargetStores,
  INITIAL_TARGET_MONTH,
  salesTargetMetrics,
  saveSalesTargetStore,
  TARGET_FORMATS,
  TARGET_MONTHS,
  TARGET_REGIONS,
  type SalesTargetStore,
} from "./grid-advanced-sales-target-model";
import {
  salesMoney,
  salesPercent,
  createSalesTargetRows,
  emptySalesTargetStore,
  matchesSalesTargetQuery,
  SALES_PACES,
  SALES_PERIODS,
  salesPeriodLabel,
  salesTargetCsv,
  type SalesTargetRow,
} from "./grid-advanced-sales-target-view-model";
import "./grid-advanced-sales-target.css";

const queryOperators = [
  { value: "is", label: "is", inverse: "is_not" },
  { value: "is_not", label: "is not", inverse: "is" },
  { value: "is_any_of", label: "is any of", arity: "many" as const, inverse: "is_none_of" },
  { value: "is_none_of", label: "is none of", arity: "many" as const, inverse: "is_any_of" },
];
const filterFields: FilterField[] = [
  {
    id: "region",
    label: "Region",
    type: "select",
    options: TARGET_REGIONS.map((value) => ({ value, label: value })),
    operators: queryOperators,
  },
  {
    id: "format",
    label: "Store format",
    type: "select",
    options: TARGET_FORMATS.map((value) => ({ value, label: value })),
    operators: queryOperators,
  },
  {
    id: "pace",
    label: "Monthly pace",
    type: "select",
    options: SALES_PACES.slice(1).map((value) => ({ value, label: value })),
    operators: queryOperators,
  },
];
const reportingMonths = TARGET_MONTHS.filter((item) => item.year === 2026);

type Book = { stores: SalesTargetStore[]; previous: SalesTargetStore[] | null; message: string };

export default function SalesTarget() {
  const narrowViewport = useIsMobile(370);
  const mobileViewport = useIsMobile();
  const storeWidth = narrowViewport ? 120 : mobileViewport ? 168 : 260;
  const [book, setBook] = useState<Book>(() => ({
    stores: createSalesTargetStores(),
    previous: null,
    message: "",
  }));
  const [month, setMonth] = useState(INITIAL_TARGET_MONTH);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [visibility, setVisibility] = useState<ColumnVisibilityState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    start: ["store"],
    end: [],
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newStore, setNewStore] = useState<SalesTargetStore | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const serial = useRef(13);
  const searchInput = useRef<HTMLInputElement>(null);
  const selected = book.stores.find((store) => store.id === selectedId) ?? null;
  const year = Number(month.slice(0, 4));
  const monthIndex = reportingMonths.findIndex((item) => item.key === month);
  const visible = useMemo(
    () =>
      filterSalesTargetStores(
        book.stores,
        month,
        search,
        region === "all" ? [] : [region],
        [],
        "All stores",
      ).filter((store) => matchesSalesTargetQuery(store, month, query) !== false),
    [book.stores, month, search, region, query],
  );
  const rows = useMemo(() => createSalesTargetRows(visible, month), [visible, month]);
  const openStore = useCallback((store: SalesTargetStore, trigger: HTMLElement) => {
    opener.current = trigger;
    setSelectedId(store.id);
  }, []);
  const clearFilters = () => {
    setSearch("");
    setRegion("all");
    setQuery(createFilterQuery());
    setExpanded(true);
  };
  const undo = () =>
    setBook((current) =>
      current.previous
        ? { stores: current.previous, previous: null, message: "Previous sales plan restored." }
        : current,
    );
  const notice = book.previous ? { message: book.message, onUndo: undo } : null;
  const save = (store: SalesTargetStore) => {
    const result = saveSalesTargetStore(book.stores, store);
    if (result.error) return result.error;
    setBook({
      stores: result.stores,
      previous: book.stores,
      message: newStore ? "Store added." : "Sales plan saved.",
    });
    if (newStore) {
      serial.current += 1;
      setNewStore(null);
      clearFilters();
    }
    setExpanded(true);
    return null;
  };
  const columns = useMemo<ColumnDef<DataGridFeatures, SalesTargetRow>[]>(
    () => [
      {
        id: "store",
        accessorFn: (row) => row.label,
        size: storeWidth,
        minSize: storeWidth,
        enableHiding: false,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Store / region" />,
        meta: { headerTitle: "Store / region" },
        cell: ({ row }) => {
          const node = row.original;
          if (node.kind === "store") {
            const store = node.stores[0];
            return (
              <div className="st-store-cell">
                <DataGridTableRowExpand row={row} />
                <div>
                  <Button
                    variant="link"
                    size="sm"
                    className="st-store-name"
                    title={store.name}
                    onClick={(event) => openStore(store, event.currentTarget)}
                  >
                    {store.name}
                  </Button>
                  <small>
                    {store.format} · {store.manager}
                  </small>
                </div>
              </div>
            );
          }
          return (
            <div
              className="st-region-cell"
              data-sales-region={node.kind === "region" ? node.label : undefined}
            >
              {node.kind === "region" ? (
                <DataGridTableRowExpand row={row} />
              ) : (
                <MapPin aria-hidden="true" />
              )}
              <strong>{node.label}</strong>
              <Badge variant="secondary" size="xs">
                {node.stores.length}
              </Badge>
            </div>
          );
        },
      },
      ...SALES_PERIODS.map((period): ColumnDef<DataGridFeatures, SalesTargetRow> => ({
        id: period.id,
        header: period.label,
        meta: { headerClassName: "st-period-header", headerTitle: period.label },
        columns: (["actualCents", "targetCents", "varianceCents", "attainment"] as const).map(
          (metric) => {
            const title =
              metric === "actualCents"
                ? "Actual"
                : metric === "targetCents"
                  ? "Target"
                  : metric === "varianceCents"
                    ? "Variance"
                    : "% to target";
            return {
              id: `${period.id}-${metric}`,
              accessorFn: (row) => row.metrics[period.id][metric],
              size: metric === "attainment" ? 200 : 168,
              minSize: metric === "attainment" ? 200 : 168,
              header: ({ column }) => <DataGridColumnHeader column={column} title={title} />,
              meta: {
                headerTitle: `${period.label}: ${title}`,
                headerClassName: "text-right",
                cellClassName: "st-metric-cell",
              },
              cell: ({ row }) => {
                const metrics = row.original.metrics[period.id];
                return (
                  <span
                    data-sales-period={period.id}
                    data-sales-metric={metric}
                    data-value={metrics[metric] ?? "none"}
                    data-negative={
                      (metric === "varianceCents" && metrics.varianceCents < 0) || undefined
                    }
                  >
                    {metric === "attainment" ? (
                      <SalesAttainment metrics={metrics} />
                    ) : (
                      salesMoney(metrics[metric])
                    )}
                  </span>
                );
              },
            };
          },
        ),
      })),
      {
        id: "months",
        header: `${year} month strip`,
        size: 224,
        enableSorting: false,
        meta: { headerTitle: "Month strip" },
        cell: ({ row }) => (
          <SalesMonthChart stores={row.original.stores} year={year} month={month} small />
        ),
      },
      {
        id: "actions",
        size: 60,
        minSize: 60,
        enableHiding: false,
        enableSorting: false,
        header: () => null,
        cell: ({ row }) =>
          row.original.kind === "store" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onFocus={(event) => {
                    opener.current = event.currentTarget;
                  }}
                  aria-label={`Actions for ${row.original.label}`}
                >
                  <Ellipsis aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    if (opener.current) openStore(row.original.stores[0], opener.current);
                  }}
                >
                  Edit store sales
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null,
      },
    ],
    [openStore, year, month, storeWidth],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.children,
    state: {
      expanded,
      sorting,
      columnVisibility: visibility,
      rowPinning: { top: ["sales-grand-total"], bottom: [] },
      columnPinning,
    },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibility,
    onColumnPinningChange: setColumnPinning,
    enableExpanding: true,
    enableRowSelection: false,
    enableRowPinning: (row) => row.original.kind === "total",
    manualPagination: true,
    autoResetExpanded: false,
    autoResetPageIndex: false,
  });
  return (
    <section aria-label="Sales to Target" className="st-page">
      <header className="st-heading">
        <div>
          <h1>Sales to Target</h1>
          <p>Store performance, one month at a time. USD · local demo data.</p>
        </div>
        <Button
          onClick={(event) => {
            opener.current = event.currentTarget;
            setNewStore(emptySalesTargetStore(`target-store-${serial.current}`));
          }}
        >
          <Plus aria-hidden="true" data-icon="inline-start" />
          Add store
        </Button>
      </header>
      <Frame className="st-calendar">
        <FrameHeader className="st-calendar-header">
          <div>
            <FrameTitle>Reporting window</FrameTitle>
            <FrameDescription>Every period ends in the selected month.</FrameDescription>
          </div>
          <div className="st-month-controls">
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Previous month"
              disabled={monthIndex === 0}
              onClick={() => setMonth(reportingMonths[monthIndex - 1].key)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <FinanceSelect
              label="Selected month"
              value={month}
              options={reportingMonths.map((item) => ({ value: item.key, label: item.label }))}
              onChange={setMonth}
            />
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Next month"
              disabled={monthIndex === reportingMonths.length - 1}
              onClick={() => setMonth(reportingMonths[monthIndex + 1].key)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </FrameHeader>
        <FramePanel>
          <div className="st-month-navigation" role="group" aria-label={`${year} reporting months`}>
            {TARGET_MONTHS.filter((item) => item.year === year).map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={item.key === month ? "secondary" : "ghost"}
                aria-pressed={item.key === month}
                aria-label={`Report ${item.label}`}
                onClick={() => setMonth(item.key)}
              >
                {item.shortLabel}
              </Button>
            ))}
          </div>
        </FramePanel>
      </Frame>
      <div className="st-period-cards">
        {SALES_PERIODS.map((period) => {
          const metrics = salesTargetMetrics(visible, month, period.id);
          return (
            <Frame key={period.id}>
              <FrameHeader>
                <FrameTitle>{period.label}</FrameTitle>
                <FrameDescription>{salesPeriodLabel(month, period.id)}</FrameDescription>
              </FrameHeader>
              <FramePanel>
                <dl data-summary-period={period.id}>
                  <div>
                    <dt>Actual</dt>
                    <dd data-summary-metric="actualCents">{salesMoney(metrics.actualCents)}</dd>
                  </div>
                  <div>
                    <dt>Target</dt>
                    <dd data-summary-metric="targetCents">{salesMoney(metrics.targetCents)}</dd>
                  </div>
                  <div>
                    <dt>Variance</dt>
                    <dd data-summary-metric="varianceCents">{salesMoney(metrics.varianceCents)}</dd>
                  </div>
                  <div>
                    <dt>To target</dt>
                    <dd data-summary-metric="attainment">{salesPercent(metrics.attainment)}</dd>
                  </div>
                </dl>
              </FramePanel>
            </Frame>
          );
        })}
      </div>
      <Frame>
        <FrameHeader className="st-chart-header">
          <div>
            <FrameTitle>{year} sales rhythm</FrameTitle>
            <FrameDescription>Actual and target for the filtered stores.</FrameDescription>
          </div>
          <div className="st-chart-legend">
            <span>Actual</span>
            <span>Target</span>
          </div>
        </FrameHeader>
        <FramePanel>
          <SalesMonthChart stores={visible} year={year} month={month} />
        </FramePanel>
      </Frame>
      {notice && (
        <Alert variant="success">
          <AlertDescription>{notice.message}</AlertDescription>
          <AlertAction>
            <Button size="xs" variant="outline" onClick={undo}>
              <Undo2 aria-hidden="true" />
              Undo
            </Button>
          </AlertAction>
        </Alert>
      )}
      <DataGrid
        table={table}
        recordCount={visible.length}
        tableLayout={{
          width: "fixed",
          dense: true,
          headerSticky: true,
          headerBorder: true,
          rowBorder: true,
          cellBorder: false,
          headerBackground: true,
          columnsPinnable: true,
          rowsPinnable: true,
        }}
        tableClassNames={{ base: "st-table", bodyRow: "st-body-row", rowPinned: "st-total-row" }}
        className="st-grid"
      >
        <Frame dense>
          <FrameHeader className="st-grid-header">
            <div>
              <FrameTitle>Store plans</FrameTitle>
              <FrameDescription>
                {visible.length} of {book.stores.length} stores · totals follow your filters
              </FrameDescription>
            </div>
            <div className="st-grid-tools">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadFile(
                    `sales-to-target-${month}.csv`,
                    salesTargetCsv(visible, month),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                <Download aria-hidden="true" data-icon="inline-start" />
                Export CSV
              </Button>
              <DataGridColumnVisibility
                table={table}
                trigger={
                  <Button size="sm" variant="outline">
                    <Columns3 aria-hidden="true" data-icon="inline-start" />
                    Columns
                  </Button>
                }
              />
            </div>
          </FrameHeader>
          <div className="st-filter-bar">
            <InputGroup className="st-search">
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                ref={searchInput}
                aria-label="Search stores"
                placeholder="Search stores or managers"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setExpanded(true);
                }}
              />
            </InputGroup>
            <Filters
              fields={filterFields}
              query={query}
              onQueryChange={(next) => {
                setQuery(next);
                setExpanded(true);
              }}
              variant="advanced"
              advancedAlign="start"
              showClear
              trigger={
                <Button variant="outline" size="sm">
                  <ListFilter aria-hidden="true" data-icon="inline-start" />
                  Filters{query.rules.length ? ` (${query.rules.length})` : ""}
                </Button>
              }
            />
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              Clear filters
            </Button>
            <div className="st-expansion-tools">
              <Button size="sm" variant="ghost" onClick={() => table.toggleAllRowsExpanded(false)}>
                Collapse regions
              </Button>
              <Button size="sm" variant="ghost" onClick={() => table.toggleAllRowsExpanded(true)}>
                Expand regions
              </Button>
            </div>
          </div>
          <div className="st-region-rail" role="group" aria-label="Region quick filter">
            {["all", ...TARGET_REGIONS].map((value) => (
              <Button
                key={value}
                size="sm"
                variant={value === region ? "secondary" : "ghost"}
                aria-pressed={value === region}
                onClick={() => {
                  setRegion(value);
                  setExpanded(true);
                }}
              >
                {value === "all" ? "All regions" : value}
              </Button>
            ))}
          </div>
          {!visible.length && (
            <div className="st-empty">
              <h2>No stores match</h2>
              <p>Adjust the search or filters to see a plan.</p>
              <Button variant="outline" onClick={clearFilters}>
                Show all stores
              </Button>
            </div>
          )}
          <FramePanel className="p-0">
            <DataGridContainer className="rounded-none border-0">
              <DataGridScrollArea orientation="both" className="st-scroll-area">
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
          </FramePanel>
          <FrameFooter className="st-grid-footer">
            <p>
              Region totals include matching stores. Percentages use total actual ÷ total target.
            </p>
            <span>All amounts in USD</span>
          </FrameFooter>
        </Frame>
      </DataGrid>
      {(selected || newStore) && (
        <SalesTargetEditor
          key={newStore?.id ?? selected!.id}
          store={newStore ?? selected!}
          selectedMonth={month}
          adding={Boolean(newStore)}
          onSave={save}
          onClose={() => {
            setSelectedId(null);
            setNewStore(null);
          }}
          restoreFocus={() =>
            (opener.current?.isConnected ? opener.current : searchInput.current)?.focus()
          }
          notice={notice}
        />
      )}
    </section>
  );
}
