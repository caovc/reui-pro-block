import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  useTable,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnSizingState,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import {
  Clock3,
  Columns3,
  Download,
  Ellipsis,
  Funnel,
  ListFilter,
  Search,
  Send,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
  type DataGridTableInstance,
} from "@/components/reui/data-grid/data-grid";
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Filters, type FilterQuery } from "@/components/reui/filters/filters";
import {
  Cascader,
  CascaderContent,
  CascaderEmpty,
  CascaderList,
  CascaderPanel,
  CascaderStatus,
  CascaderTrigger,
} from "@/components/reui/cascader/cascader";
import { CascaderInput, CascaderNav } from "@/components/reui/cascader/cascader-nav";
import { CascaderItems } from "@/components/reui/cascader/cascader-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { downloadCsv } from "./data-utils";
import {
  API_REQUESTS,
  REQUEST_BUCKET_MS,
  REQUEST_NOW,
  TRAFFIC_BUCKETS,
} from "./grid-base-api-request-logs-data";
import {
  createReplayRequest,
  emptyRequestQuery,
  formatRequestTime,
  REQUEST_FILTER_FIELDS,
  requestMatches,
  statusClass,
  summarizeTraffic,
} from "./grid-base-api-request-logs-model";
import { RequestTrafficChart } from "./grid-base-api-request-logs-chart";
import { RequestComposer, RequestDetails } from "./grid-base-api-request-logs-details";
import type {
  ApiRequest,
  ReplayDraft,
  RequestStatusClass,
  RequestTimeRange,
} from "./grid-base-api-request-logs-types";

const STATUS_CLASSES: RequestStatusClass[] = ["2xx", "4xx", "5xx"];
const STATUS_COLOR = { "2xx": "bg-emerald-500", "4xx": "bg-amber-500", "5xx": "bg-red-500" };
const REGION_FLAGS: Record<string, string> = {
  fra1: "🇩🇪",
  iad1: "🇺🇸",
  sin1: "🇸🇬",
  syd1: "🇦🇺",
  yul1: "🇨🇦",
  gru1: "🇧🇷",
};
const OPTIONAL_COLUMNS = [
  "method",
  "host",
  "region",
  "id",
  "client",
  "status",
  "latency",
  "timing",
  "size",
];
const DEFAULT_VISIBILITY: ColumnVisibilityState = {
  host: false,
  id: false,
  client: false,
  size: false,
};
const COLUMN_GROUPS = [
  {
    value: "request",
    label: "Request",
    children: [
      { value: "method", label: "Method" },
      { value: "host", label: "Host" },
      { value: "region", label: "Region" },
      { value: "id", label: "Request ID" },
      { value: "client", label: "Client" },
    ],
  },
  {
    value: "response",
    label: "Response",
    children: [
      { value: "status", label: "Status" },
      { value: "latency", label: "Latency" },
      { value: "timing", label: "Timing" },
      { value: "size", label: "Size" },
    ],
  },
];

function RequestStatus({ status }: { status: number }) {
  const category = statusClass(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 tabular-nums",
        category === "5xx"
          ? "text-red-700 dark:text-red-400"
          : category === "4xx"
            ? "text-amber-700 dark:text-amber-400"
            : "text-emerald-700 dark:text-emerald-400",
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_COLOR[category])} aria-hidden="true" />
      {status}
    </span>
  );
}

function RequestTiming({ request }: { request: ApiRequest }) {
  const total = Math.max(1, request.server + request.transfer);
  return (
    <div
      role="img"
      aria-label={`Server ${request.server} ms, Transfer ${request.transfer} ms`}
      className="flex h-1.5 w-full max-w-16 items-center gap-0.5"
    >
      <span
        className="h-full min-w-0.5 rounded-full bg-muted-foreground/65"
        style={{ flex: request.server / total }}
      />
      <span
        className="h-full min-w-0.5 rounded-full bg-muted-foreground/25"
        style={{ flex: request.transfer / total }}
      />
    </div>
  );
}

function RequestActions({
  request,
  onOpen,
  onReplay,
}: {
  request: ApiRequest;
  onOpen: (id: string) => void;
  onReplay: (draft: ReplayDraft, original?: ApiRequest) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${request.id}`}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onOpen(request.id)}>View request</DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            onReplay(
              {
                method: request.method,
                host: request.host,
                path: request.path,
                region: request.region,
              },
              request,
            )
          }
        >
          Replay locally
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RequestColumns({ table }: { table: DataGridTableInstance<ApiRequest> }) {
  return (
    <Cascader
      multiple
      items={COLUMN_GROUPS}
      closeOnSelect={false}
      revealSelected={false}
      value={OPTIONAL_COLUMNS.filter((id) => table.getColumn(id)?.getIsVisible())}
      onValueChange={(values) =>
        table.setColumnVisibility(
          Object.fromEntries(OPTIONAL_COLUMNS.map((id) => [id, values.includes(id)])),
        )
      }
      labels={{ panelLabel: "Options", rootLevel: "Columns" }}
    >
      <CascaderTrigger
        showIcon={false}
        aria-label="Columns"
        render={<Button variant="outline" size="sm" className="size-8 p-0 sm:w-auto sm:px-2.5" />}
      >
        <Columns3 />
        <span className="hidden sm:inline">Columns</span>
      </CascaderTrigger>
      <CascaderContent align="end" className="reui-reference w-64">
        <CascaderPanel>
          <CascaderNav>
            <CascaderInput aria-label="Search columns" placeholder="Search columns" />
          </CascaderNav>
          <CascaderEmpty />
          <CascaderList>
            <CascaderItems />
          </CascaderList>
          <CascaderStatus />
        </CascaderPanel>
      </CascaderContent>
    </Cascader>
  );
}

interface RequestAppearance {
  density: string;
  lines: boolean;
  stripes: boolean;
  resizable: boolean;
  movable: boolean;
}
const DEFAULT_APPEARANCE: RequestAppearance = {
  density: "Compact",
  lines: true,
  stripes: false,
  resizable: true,
  movable: false,
};

function RequestSettings({
  appearance,
  onChange,
  table,
}: {
  appearance: RequestAppearance;
  onChange: (next: RequestAppearance) => void;
  table: DataGridTableInstance<ApiRequest>;
}) {
  const id = useId();
  function toggle(key: "lines" | "stripes" | "resizable" | "movable", title: string) {
    return (
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`${id}-${key}`} className="text-sm font-normal">
          {title}
        </Label>
        <Switch
          id={`${id}-${key}`}
          checked={appearance[key]}
          onCheckedChange={(checked) => onChange({ ...appearance, [key]: checked })}
        />
      </div>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon-sm" className="size-8" aria-label="Settings">
          <SlidersHorizontal />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="reui-reference w-72 p-4">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Appearance</p>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${id}-density`} className="text-sm font-normal">
              Density
            </Label>
            <Select
              value={appearance.density}
              onValueChange={(density) => onChange({ ...appearance, density })}
            >
              <SelectTrigger id={`${id}-density`} size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Compact", "Comfortable", "Spacious"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {toggle("lines", "Column lines")}
          {toggle("stripes", "Row stripes")}
          <p className="border-t pt-3 text-xs font-medium text-muted-foreground">Columns</p>
          {toggle("resizable", "Resizable columns")}
          {toggle("movable", "Movable columns")}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              table.resetColumnSizing();
              table.resetColumnOrder();
              table.setColumnVisibility({ ...DEFAULT_VISIBILITY });
            }}
          >
            Reset Columns
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Original API-log demo assembled from the actual MIT ReUI free components.
 * Traffic buckets and retained request details are separate populations. Only
 * time scope is shared; advanced Filters deliberately affect detailed logs. */
export function ApiRequestLogs() {
  const [requests, setRequests] = useState(API_REQUESTS);
  const [traffic, setTraffic] = useState(TRAFFIC_BUCKETS);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(emptyRequestQuery);
  const [hours, setHours] = useState("24");
  const [selection, setSelection] = useState<RequestTimeRange | null>(null);
  const [classes, setClasses] = useState<RequestStatusClass[]>(STATUS_CLASSES);
  const [sorting, setSorting] = useState<SortingState>([{ id: "timestamp", desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    ...DEFAULT_VISIBILITY,
  });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const range = useMemo(
    () => ({ start: REQUEST_NOW - Number(hours) * 3_600_000, end: REQUEST_NOW }),
    [hours],
  );
  const activeRange = selection ?? range;
  const criteria = useMemo(
    () => ({ search, query, range: activeRange, classes }),
    [search, query, activeRange, classes],
  );
  const summary = useMemo(() => summarizeTraffic(traffic, activeRange), [traffic, activeRange]);
  const fullSummary = useMemo(() => summarizeTraffic(traffic, range), [traffic, range]);
  const previousSummary = useMemo(
    () =>
      summarizeTraffic(traffic, {
        start: range.start - (range.end - range.start),
        end: range.start,
      }),
    [traffic, range],
  );
  const replay = useCallback((draft: ReplayDraft, original?: ApiRequest) => {
    const created = createReplayRequest(draft, original);
    setRequests((current) => [created, ...current]);
    setTraffic((current) =>
      current.map((bucket) =>
        created.timestamp >= bucket.timestamp &&
        created.timestamp < bucket.timestamp + REQUEST_BUCKET_MS
          ? { ...bucket, [statusClass(created.status)]: bucket[statusClass(created.status)] + 1 }
          : bucket,
      ),
    );
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    toast.success("Local demo request added", {
      description: "No network request was sent. Active filters still apply.",
    });
  }, []);
  const columns = useMemo<ColumnDef<DataGridFeatures, ApiRequest>[]>(() => {
    function field(
      id: keyof ApiRequest | "timing" | "url",
      title: string,
      width: number,
    ): ColumnDef<DataGridFeatures, ApiRequest> {
      return {
        id,
        accessorFn: (request) =>
          id === "timing"
            ? request.server
            : id === "url"
              ? `${request.host}${request.path}`
              : request[id],
        size: width,
        minSize: width,
        header: ({ column }) => <DataGridColumnHeader column={column} title={title} />,
        meta: {
          headerTitle: title,
          cellClassName: "px-3 py-2 text-sm",
          headerClassName: "px-3 text-sm font-normal",
        },
        cell: ({ row }) => {
          const request = row.original;
          if (id === "timestamp")
            return <span className="tabular-nums">{formatRequestTime(request.timestamp)}</span>;
          if (id === "status") return <RequestStatus status={request.status} />;
          if (id === "url")
            return (
              <button
                type="button"
                className="block max-w-full truncate text-left hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                onClick={() => setSelectedId(request.id)}
                aria-label={`View ${request.method} ${request.host}${request.path}`}
              >
                <span className="text-muted-foreground">{request.host}</span>
                {request.path}
              </button>
            );
          if (id === "latency") return <span className="tabular-nums">{request.latency} ms</span>;
          if (id === "region")
            return (
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-base leading-4" aria-hidden="true">
                  {REGION_FLAGS[request.region]}
                </span>
                <span className="shrink-0">{request.region}</span>
                <span
                  className="min-w-0 truncate text-xs text-muted-foreground"
                  title={request.regionName}
                >
                  {request.regionName.split(",")[0]}
                </span>
              </span>
            );
          if (id === "timing") return <RequestTiming request={request} />;
          if (id === "size")
            return <span className="tabular-nums">{(request.size / 1024).toFixed(1)} KB</span>;
          return <span className="block truncate">{String(request[id])}</span>;
        },
      };
    }
    return [
      {
        id: "_select",
        size: 49,
        minSize: 49,
        maxSize: 49,
        enableHiding: false,
        enableSorting: false,
        enableResizing: false,
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
      },
      { ...field("timestamp", "Time", 148), enableHiding: false },
      field("status", "Status", 84),
      field("method", "Method", 84),
      {
        ...field("url", "URL", 240),
        enableHiding: false,
        meta: {
          headerTitle: "URL",
          cellClassName: "px-3 py-2 text-sm",
          headerClassName: "px-3 text-sm font-normal",
          fillWidth: true,
        },
      },
      field("host", "Host", 180),
      field("id", "Request ID", 240),
      field("client", "Client", 160),
      field("latency", "Latency", 96),
      field("region", "Region", 144),
      field("timing", "Timing", 104),
      field("size", "Size", 96),
      {
        id: "_actions",
        size: 41,
        minSize: 41,
        maxSize: 41,
        enableHiding: false,
        enableSorting: false,
        enableResizing: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <RequestActions request={row.original} onOpen={setSelectedId} onReplay={replay} />
        ),
        meta: { cellClassName: "p-1" },
      },
    ];
  }, [replay]);
  const table = useTable({
    features: dataGridFeatures,
    data: requests,
    columns,
    getRowId: (request) => request.id,
    state: {
      globalFilter: criteria,
      sorting,
      pagination,
      rowSelection,
      columnVisibility,
      columnSizing,
      columnOrder,
    },
    globalFilterFn: (row, _columnId, value) => requestMatches(row.original, value),
    getColumnCanGlobalFilter: () => true,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    enableRowSelection: true,
    autoResetPageIndex: false,
    columnResizeMode: "onChange",
  });
  const matching = table.getSortedRowModel().rows.map((row) => row.original);
  const count = table.getFilteredRowModel().rows.length;
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (
        event.key !== "/" ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.defaultPrevented
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input,textarea,select,[contenteditable=true],[role=dialog]")
      )
        return;
      event.preventDefault();
      if (searchRef.current && searchRef.current.getClientRects().length) searchRef.current.focus();
      else setSearchOpen(true);
    }
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  function resetPage() {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }
  function changeSearch(value: string) {
    setSearch(value);
    resetPage();
  }
  function changeSelection(next: RequestTimeRange | null) {
    setSelection(next);
    resetPage();
  }
  function exportRequests() {
    const selected = table.getFilteredSelectedRowModel().rows;
    const exported = selected.length ? selected.map((row) => row.original) : matching;
    downloadCsv(
      "API requests",
      exported.map((request) => ({
        id: request.id,
        timestamp: new Date(request.timestamp).toISOString(),
        method: request.method,
        host: request.host,
        path: request.path,
        status: request.status,
        latency_ms: request.latency,
        region: request.region,
        size_bytes: request.size,
      })),
    );
  }
  const hasCriteria = Boolean(search || query.rules.length || selection || classes.length !== 3);
  const delta = previousSummary.total ? (summary.total / previousSummary.total - 1) * 100 : null;
  return (
    <DataGrid
      table={table}
      recordCount={count}
      emptyMessage="No requests match your filters."
      tableLayout={{
        dense: appearance.density === "Compact",
        width: "fixed",
        cellBorder: appearance.lines,
        stripped: appearance.stripes,
        rowBorder: true,
        columnsResizable: appearance.resizable,
        columnsResizeMode: "onChange",
        columnsMovable: appearance.movable,
        columnsVisibility: true,
      }}
      tableClassNames={{
        base: "min-w-[990px] text-sm [&_th]:h-8 [&_th]:px-3 [&_td]:px-3",
        headerRow: "h-8",
        bodyRow:
          appearance.density === "Compact"
            ? "h-[41px]"
            : appearance.density === "Spacious"
              ? "h-16"
              : "h-12",
      }}
    >
      <Frame dense className="reui-reference mx-auto w-full max-w-[76rem] rounded-[14px]">
        <FrameHeader className="flex-row items-center justify-between gap-3 px-4 py-2">
          <div className="min-w-0">
            <FrameTitle>API Requests</FrameTitle>
            <FrameDescription className="truncate">
              3 hosts across 6 edge regions, in UTC
            </FrameDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0 sm:w-auto sm:px-2.5"
              aria-label="Export CSV"
              onClick={exportRequests}
              disabled={!count}
            >
              <Download />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              size="sm"
              className="size-8 p-0 sm:w-auto sm:px-2.5"
              aria-label="Send Request"
              onClick={() => setComposerOpen(true)}
            >
              <Send />
              <span className="hidden sm:inline">Send Request</span>
            </Button>
          </div>
        </FrameHeader>
        <FramePanel className="min-w-0 p-0 shadow-none">
          <div className="flex min-w-0 items-center gap-1.5 border-b px-4 py-2 sm:gap-2">
            <div className="relative hidden w-64 shrink sm:block">
              <Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                aria-label="Search requests by path, host, ID or region"
                placeholder="Search requests…"
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                className="h-8 pr-7 pl-8"
              />
              <kbd
                aria-hidden="true"
                className="pointer-events-none absolute top-1.5 right-2 rounded bg-muted px-1 text-xs text-muted-foreground"
              >
                /
              </kbd>
            </div>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="size-8 shrink-0 sm:hidden"
                  aria-label="Search requests"
                >
                  <Search />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="reui-reference w-72 p-2">
                <Input
                  aria-label="Search requests by path, host, ID or region"
                  placeholder="Search requests…"
                  value={search}
                  onChange={(event) => changeSearch(event.target.value)}
                  className="h-8"
                />
              </PopoverContent>
            </Popover>
            <Filters
              fields={REQUEST_FILTER_FIELDS}
              query={query}
              onQueryChange={(next) => {
                setQuery(next);
                resetPage();
              }}
              variant="advanced"
              advancedMode="popover"
              advancedAlign="start"
              reorderable
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="size-8 p-0 sm:w-auto sm:px-2.5"
                  aria-label="Filter"
                >
                  <Funnel />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              }
            />
            <Select
              value={hours}
              onValueChange={(value) => {
                setHours(value);
                setSelection(null);
                resetPage();
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label="Time range"
                className="h-8 w-auto min-w-0 shrink-0 sm:w-40"
              >
                <Clock3 className="size-4 shrink-0 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  ["6", "Last 6 hours"],
                  ["24", "Last 24 hours"],
                  ["72", "Last 3 days"],
                ].map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasCriteria && (
              <Button
                variant="outline"
                size="sm"
                className="hidden h-8 sm:inline-flex"
                onClick={() => {
                  setSearch("");
                  setQuery(emptyRequestQuery());
                  setSelection(null);
                  setClasses(STATUS_CLASSES);
                  resetPage();
                }}
              >
                <ListFilter />
                Clear
              </Button>
            )}
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <RequestColumns table={table} />
              <RequestSettings appearance={appearance} onChange={setAppearance} table={table} />
            </div>
          </div>
          <div className="px-4 pt-1 pb-2 sm:pt-3">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-1 sm:mb-1">
              <div
                className="flex w-full flex-wrap gap-x-8 sm:w-auto"
                aria-live="polite"
                aria-atomic="true"
              >
                <div>
                  <div className="text-xs text-muted-foreground">Requests</div>
                  <div className="flex items-baseline gap-2 leading-6">
                    <span className="text-lg leading-6 font-semibold tabular-nums">
                      {summary.total.toLocaleString("en-US")}
                    </span>
                    {!selection && delta !== null && (
                      <span className="text-xs text-muted-foreground">
                        {delta >= 0 ? "+" : ""}
                        {delta.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                  <div className="flex items-baseline gap-2 leading-6">
                    <span className="text-lg leading-6 font-semibold tabular-nums">
                      {summary.total ? `${summary.errors.toFixed(1)}%` : "—"}
                    </span>
                    {!selection && previousSummary.total > 0 && (
                      <span
                        className={cn(
                          "text-xs",
                          summary.errors > previousSummary.errors
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {summary.errors >= previousSummary.errors ? "+" : ""}
                        {(summary.errors - previousSummary.errors).toFixed(1)} pts
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Availability</div>
                  <div className="flex items-baseline gap-2 leading-6">
                    <span className="text-lg leading-6 font-semibold tabular-nums">
                      {summary.total ? `${summary.availability.toFixed(2)}%` : "—"}
                    </span>
                    {!selection && previousSummary.total > 0 && (
                      <span
                        className={cn(
                          "text-xs",
                          summary.availability < previousSummary.availability
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {summary.availability >= previousSummary.availability ? "+" : ""}
                        {(summary.availability - previousSummary.availability).toFixed(2)} pts
                      </span>
                    )}
                  </div>
                </div>
                {!selection && (
                  <span className="self-end pb-0.5 text-xs leading-5 text-muted-foreground">
                    vs prior {hours === "72" ? "3 days" : `${hours} hours`}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {selection && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    aria-label="Reset Zoom"
                    onClick={() => changeSelection(null)}
                  >
                    <X />
                    Reset Zoom
                  </Button>
                )}
                <ToggleGroup
                  type="multiple"
                  value={classes}
                  spacing={0}
                  size="sm"
                  variant="outline"
                  aria-label="Response status classes"
                  className="bg-muted/40"
                  onValueChange={(values) => {
                    if (!values.length) return;
                    setClasses(STATUS_CLASSES.filter((category) => values.includes(category)));
                    resetPage();
                  }}
                >
                  {STATUS_CLASSES.map((category) => (
                    <ToggleGroupItem
                      key={category}
                      value={category}
                      aria-label={`${category} responses`}
                      className={cn(
                        "h-7 gap-1.5 px-2 text-xs font-normal tabular-nums",
                        !classes.includes(category) && "opacity-40",
                      )}
                    >
                      <span
                        className={cn("size-1.5 rounded-full", STATUS_COLOR[category])}
                        aria-hidden="true"
                      />
                      {category}
                      <span>{fullSummary.counts[category]}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
            {selection && (
              <p className="mb-1 text-xs text-muted-foreground">
                {formatRequestTime(selection.start)} – {formatRequestTime(selection.end)} UTC
              </p>
            )}
            <RequestTrafficChart
              buckets={traffic}
              range={range}
              selection={selection}
              classes={classes}
              onSelectionChange={changeSelection}
            />
          </div>
          <DataGridContainer className="rounded-none border-x-0 border-b-0">
            <DataGridScrollArea orientation="horizontal">
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
          <DataGridPagination
            sizes={[10, 20, 50]}
            info={`{from} - {to} of {count} request${count === 1 ? "" : "s"}`}
            className="border-t px-4 py-2 sm:py-2"
          />
        </FramePanel>
      </Frame>
      <RequestDetails
        request={requests.find((request) => request.id === selectedId) ?? null}
        requests={matching}
        history={requests}
        onRequestChange={(request) => setSelectedId(request?.id ?? null)}
        onReplay={replay}
      />
      <RequestComposer open={composerOpen} onOpenChange={setComposerOpen} onSend={replay} />
    </DataGrid>
  );
}
