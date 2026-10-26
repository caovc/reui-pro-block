import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnSizingState,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import {
  Building2,
  ChevronDown,
  Columns3,
  Ellipsis,
  Filter,
  ArrowLeftRight,
  ListPlus,
  Plus,
  Search,
  Settings2,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Alert, AlertAction, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import {
  Cascader,
  CascaderContent,
  CascaderList,
  CascaderTrigger,
} from "@/components/reui/cascader/cascader";
import { CascaderItems } from "@/components/reui/cascader/cascader-item";
import { CascaderBreadcrumb, CascaderInput } from "@/components/reui/cascader/cascader-nav";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
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
import { IconTile } from "@/components/reui/icon-tile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  createProspectSeed,
  initialProspectLists,
  prospectFunding,
  prospectIndustries,
  prospectOwners,
  prospectStatuses,
  type Prospect,
  type ProspectIntent,
} from "./grid-advanced-prospect-database-data";
import {
  prospectBookReducer,
  prospectGrowth,
  prospectIntent,
  prospectIntentSummary,
  prospectMatchesQuery,
  prospectMatchesSearch,
  type ProspectBook,
  type ProspectCommand,
} from "./grid-advanced-prospect-database-model";
import {
  ProspectCreateList,
  ProspectDetails,
  ProspectEditor,
  ProspectHandover,
  ProspectHeadcount,
  ProspectListItems,
  ProspectOwnerAvatar,
  ProspectOwnerMenu,
  ProspectStatusMenu,
} from "./grid-advanced-prospect-database-panels";
import "./grid-advanced-prospect-database.css";

const defaultVisibility: ColumnVisibilityState = {
  hq: false,
  funding: false,
  revenue: false,
  founded: false,
  lastActivity: false,
};
const columnGroups = [
  {
    value: "firmographics",
    label: "Firmographics",
    children: [
      { value: "industry", label: "Industry" },
      { value: "hq", label: "HQ" },
      { value: "employees", label: "Size" },
      { value: "funding", label: "Funding" },
      { value: "revenue", label: "Revenue" },
      { value: "founded", label: "Founded" },
    ],
  },
  {
    value: "signals",
    label: "Buying Signals",
    children: [
      { value: "growth", label: "Growth" },
      { value: "intent", label: "Intent" },
    ],
  },
  {
    value: "outreach",
    label: "Outreach",
    children: [
      { value: "contacts", label: "Contacts" },
      { value: "status", label: "Status" },
      { value: "owner", label: "Owner" },
      { value: "lastActivity", label: "Last Activity" },
    ],
  },
];
const intentLabels = { high: "High", medium: "Medium", low: "Low" };
const intentRanges = { high: "score 70 and up", medium: "score 40 to 69", low: "score under 40" };
type ProspectGlobalFilter = { search: string; query: FilterQuery; mine: boolean };
type Props = { loadCompanies?: (signal: AbortSignal) => Promise<Prospect[]> };

function IntentMeter({ record }: { record: Prospect }) {
  const tier = prospectIntent(record.intent);
  return (
    <div className={`prospect-intent-meter prospect-intent-${tier}`}>
      <ChartContainer
        config={{ score: { label: "Intent", color: "currentColor" } }}
        className="prospect-intent-ring"
        initialDimension={{ width: 15, height: 15 }}
        aria-hidden="true"
      >
        <RadialBarChart
          accessibilityLayer={false}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          data={[{ score: record.intent, fill: "var(--color-score)" }]}
          innerRadius="65%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          barSize={2.5}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="score"
            background={{ fill: "var(--color-muted)" }}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ChartContainer>
      <span className="font-medium tabular-nums text-foreground">{record.intent}</span>
      <span className="text-muted-foreground">{intentLabels[tier]}</span>
    </div>
  );
}

export default function ProspectDatabase({ loadCompanies }: Props = {}) {
  const isMobile = useIsMobile();
  const [book, dispatch] = useReducer(prospectBookReducer, undefined, (): ProspectBook => ({
    companies: loadCompanies ? [] : createProspectSeed(),
    lists: structuredClone(initialProspectLists),
    past: [],
  }));
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [mine, setMine] = useState(false);
  const [tier, setTier] = useState<ProspectIntent | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "company", desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>(defaultVisibility);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [density, setDensity] = useState("Compact");
  const [columnLines, setColumnLines] = useState(false);
  const [rowStripes, setRowStripes] = useState(false);
  const [resizable, setResizable] = useState(true);
  const [movable, setMovable] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ record: Prospect | null } | null>(null);
  const [handover, setHandover] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [newListIds, setNewListIds] = useState<string[] | null>(null);
  const [loadPhase, setLoadPhase] = useState<"loading" | "ready" | "error">(
    loadCompanies ? "loading" : "ready",
  );
  const [loadAttempt, setLoadAttempt] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const addCompanyRef = useRef<HTMLButtonElement>(null);
  const detailsOpener = useRef<HTMLElement | null>(null);
  const restoreDetailsFocus = useRef(false);
  const editorOpener = useRef<HTMLElement | null>(null);
  const restoreEditorFocus = useRef(false);
  const restoreAccountFocus = useCallback((opener: HTMLElement | null) => {
    for (const candidate of [opener, searchRef.current, addCompanyRef.current]) {
      if (
        !candidate?.isConnected ||
        candidate.getClientRects().length === 0 ||
        candidate.matches(":disabled, [aria-disabled='true']") ||
        candidate.closest("[inert]")
      ) {
        continue;
      }
      const style = getComputedStyle(candidate);
      if (style.visibility === "hidden" || style.visibility === "collapse") continue;
      candidate.focus({ preventScroll: true });
      if (document.activeElement === candidate) return;
    }
  }, []);
  const openEditor = useCallback((record: Prospect | null, opener?: HTMLElement) => {
    editorOpener.current = opener ?? detailsOpener.current;
    restoreEditorFocus.current = false;
    setEditor({ record });
  }, []);
  const openDetails = useCallback((id: string, opener?: HTMLElement) => {
    if (opener) detailsOpener.current = opener;
    restoreDetailsFocus.current = false;
    setDetailsId(id);
  }, []);
  const undo = useCallback(() => {
    dispatch({ type: "undo" });
    toast.dismiss("prospect-change");
  }, []);
  const commit = useCallback(
    (command: ProspectCommand, message: string) => {
      dispatch(command);
      toast.success(message, { id: "prospect-change", action: { label: "Undo", onClick: undo } });
    },
    [undo],
  );

  useEffect(() => {
    if (!loadCompanies) return;
    const controller = new AbortController();
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return null;
        setLoadPhase("loading");
        return loadCompanies(controller.signal);
      })
      .then((companies) => {
        if (controller.signal.aborted || companies === null) return;
        if (new Set(companies.map((company) => company.id)).size !== companies.length)
          throw new Error("Duplicate company IDs");
        dispatch({ type: "load", companies });
        setLoadPhase("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadPhase("error");
      });
    return () => controller.abort();
  }, [loadCompanies, loadAttempt]);

  const rowActions = useCallback(
    (record: Prospect) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${record.name}`}
            onClick={(event) => {
              detailsOpener.current = event.currentTarget;
            }}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Company</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => openDetails(record.id)}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openEditor(record)}>Edit</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Save to list</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56">
                <ProspectListItems
                  ids={[record.id]}
                  records={book.companies}
                  lists={book.lists}
                  onCommand={commit}
                  onCreate={() => setNewListIds([record.id])}
                />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteIds([record.id])}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [book.companies, book.lists, commit, openDetails, openEditor],
  );

  const columns = useMemo<ColumnDef<DataGridFeatures, Prospect>[]>(() => {
    const header = (
      id: string,
      title: string,
      accessor: (record: Prospect) => unknown,
      size: number,
    ): ColumnDef<DataGridFeatures, Prospect> => ({
      id,
      accessorFn: accessor,
      size,
      minSize: 72,
      header: ({ column }) => <DataGridColumnHeader column={column} title={title} />,
      meta: {
        headerTitle: title,
        headerClassName: "h-8 px-2 py-0 pl-3",
        cellClassName: "px-3 py-0",
      },
    });
    return [
      {
        id: "select",
        size: 49,
        minSize: 49,
        maxSize: 49,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        header: () => (
          <div className="flex justify-center">
            <DataGridTableRowSelectAll />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <DataGridTableRowSelect row={row} />
          </div>
        ),
        meta: { headerClassName: "h-8 p-0 text-center", cellClassName: "px-0 text-center" },
      },
      {
        ...header("company", "Company", (record) => record.name, isMobile ? 192 : 312),
        enableHiding: false,
        minSize: 160,
        meta: {
          headerTitle: "Company",
          headerClassName: "h-8 px-2 py-0",
          cellClassName: "px-2 py-0",
        },
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2">
            <IconTile size="xs" className="text-muted-foreground">
              <Building2 />
            </IconTile>
            <button
              className="min-w-0 truncate text-left font-medium hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Open ${row.original.name}`}
              onClick={(event) => openDetails(row.original.id, event.currentTarget)}
            >
              {row.original.name}
            </button>
          </div>
        ),
      },
      {
        ...header("industry", "Industry", (record) => record.industry, 124),
        cell: ({ row }) => <span className="text-foreground">{row.original.industry}</span>,
      },
      {
        ...header("growth", "Growth", prospectGrowth, 120),
        cell: ({ row }) => {
          const growth = prospectGrowth(row.original);
          return (
            <div className="flex items-center gap-2">
              <ProspectHeadcount record={row.original} />
              <span className="tabular-nums text-muted-foreground">
                {growth === null ? "—" : `${growth > 0 ? "+" : ""}${growth}%`}
              </span>
            </div>
          );
        },
      },
      {
        ...header("employees", "Size", (record) => record.employees, 80),
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground">
            {row.original.employees.toLocaleString()}
          </span>
        ),
      },
      {
        ...header("intent", "Intent", (record) => record.intent, 132),
        filterFn: (row, _id, value) => prospectIntent(row.original.intent) === value,
        cell: ({ row }) => <IntentMeter record={row.original} />,
      },
      {
        ...header("contacts", "Contacts", (record) => record.contacts, 108),
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground">{row.original.contacts}</span>
        ),
      },
      {
        ...header("status", "Status", (record) => record.status, 132),
        cell: ({ row }) => (
          <ProspectStatusMenu
            record={row.original}
            onChange={(status) => {
              if (status !== row.original.status)
                commit(
                  { type: "patch", ids: [row.original.id], patch: { status } },
                  `${row.original.name}: ${status}`,
                );
            }}
          />
        ),
      },
      {
        ...header(
          "owner",
          "Owner",
          (record) => prospectOwners.find((owner) => owner.id === record.ownerId)?.name ?? "",
          116,
        ),
        cell: ({ row }) => (
          <ProspectOwnerMenu
            record={row.original}
            onChange={(ownerId) => {
              if (ownerId !== row.original.ownerId)
                commit(
                  { type: "patch", ids: [row.original.id], patch: { ownerId } },
                  `${row.original.name} reassigned`,
                );
            }}
          />
        ),
      },
      {
        ...header("hq", "HQ", (record) => `${record.city}, ${record.country}`, 180),
        cell: ({ row }) => (
          <span className="truncate text-muted-foreground">
            {row.original.city}, {row.original.country}
          </span>
        ),
      },
      { ...header("funding", "Funding", (record) => record.funding, 120) },
      {
        ...header("revenue", "Revenue", (record) => record.revenue, 120),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              notation: "compact",
            }).format(row.original.revenue)}
          </span>
        ),
      },
      { ...header("founded", "Founded", (record) => record.founded, 100) },
      { ...header("lastActivity", "Last Activity", (record) => record.lastActivity, 140) },
      {
        id: "actions",
        size: 41,
        minSize: 41,
        maxSize: 41,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => rowActions(row.original),
        meta: { headerClassName: "p-0", cellClassName: "p-0 text-center" },
      },
    ];
  }, [isMobile, commit, rowActions, openDetails]);

  const globalFilter = useMemo<ProspectGlobalFilter>(
    () => ({ search, query, mine }),
    [search, query, mine],
  );
  const columnFilters = useMemo<ColumnFiltersState>(
    () => (tier ? [{ id: "intent", value: tier }] : []),
    [tier],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: book.companies,
    columns,
    getRowId: (record) => record.id,
    globalFilterFn: (row, _columnId, value: ProspectGlobalFilter) =>
      (!value.mine || row.original.ownerId === "mara") &&
      prospectMatchesSearch(row.original, value.search) &&
      prospectMatchesQuery(row.original, value.query),
    state: {
      sorting,
      pagination,
      rowSelection,
      columnVisibility,
      columnOrder,
      columnSizing,
      columnFilters,
      globalFilter,
    },
    initialState: { columnPinning: { start: ["select", "company"], end: [] } },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    autoResetPageIndex: true,
  });
  const filteredCount = table.getFilteredRowModel().rows.length;
  const selected = table.getSelectedRowModel().rows.map((row) => row.original);
  // Native faceting excludes this column's own intent filter, retaining search,
  // the query tree and My Accounts as the summary denominator.
  const summaryRecords = table
    .getColumn("intent")!
    .getFacetedRowModel()
    .rows.map((row) => row.original);
  const summaries = prospectIntentSummary(summaryRecords);
  const visibleColumnIds = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() && column.getIsVisible())
    .map((column) => column.id);
  const details = book.companies.find((record) => record.id === detailsId);
  const hasFilters = !!(search.trim() || mine || tier || query.rules.length);

  useEffect(() => {
    if (isMobile && searchOpen) searchRef.current?.focus();
  }, [isMobile, searchOpen]);

  const fields = useMemo<FilterField[]>(
    () => [
      {
        id: "industry",
        label: "Industry",
        type: "select",
        options: prospectIndustries.map((value) => ({ value, label: value })),
      },
      {
        id: "country",
        label: "Country",
        type: "select",
        options: [...new Set(book.companies.map((record) => record.country))]
          .filter(Boolean)
          .sort()
          .map((value) => ({ value, label: value })),
      },
      { id: "hqCity", label: "HQ City", type: "text" },
      { id: "size", label: "Size", description: "Employees today", type: "number" },
      { id: "growth", label: "Growth", type: "number" },
      {
        id: "funding",
        label: "Funding",
        type: "select",
        options: prospectFunding.map((value) => ({ value, label: value })),
      },
      { id: "intent", label: "Intent", type: "number" },
      {
        id: "status",
        label: "Status",
        type: "select",
        options: prospectStatuses.map((value) => ({ value, label: value })),
      },
      {
        id: "owner",
        label: "Owner",
        type: "select",
        options: prospectOwners.map((owner) => ({ value: owner.id, label: owner.name })),
      },
      {
        id: "list",
        label: "List",
        type: "multiselect",
        options: book.lists.map((list) => ({ value: list.id, label: list.name })),
      },
      { id: "contacts", label: "Contacts", type: "number" },
    ],
    [book.companies, book.lists],
  );

  function clearFilters() {
    setSearch("");
    setQuery(createFilterQuery());
    setMine(false);
    setTier("");
  }
  function resetColumns() {
    setColumnVisibility(defaultVisibility);
    setColumnOrder([]);
    setColumnSizing({});
    table.resetColumnPinning();
  }
  function handleUndoKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (
      (event.metaKey || event.ctrlKey) &&
      event.key.toLocaleLowerCase() === "z" &&
      !event.shiftKey &&
      !target.closest("input,textarea,[contenteditable=true],[role=dialog]")
    ) {
      event.preventDefault();
      undo();
    }
  }

  return (
    <section className="prospect-database" aria-label="Prospect database" onKeyDown={handleUndoKey}>
      <Frame dense className="prospect-database-frame">
        <FrameHeader className="prospect-database-header">
          <div className="flex min-w-0 flex-col gap-px">
            <FrameTitle>Prospects</FrameTitle>
            <FrameDescription className="truncate">
              Companies that fit your customer profile
            </FrameDescription>
          </div>
          <div className="ml-auto flex shrink-0 gap-2 max-sm:gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="sm:w-auto sm:gap-1.5 sm:px-2.5"
              aria-label="Hand Over"
              onClick={() => setHandover(true)}
            >
              <ArrowLeftRight />
              <span className="hidden sm:inline">Hand Over</span>
            </Button>
            <Button
              ref={addCompanyRef}
              size="icon"
              className="sm:w-auto sm:gap-1.5 sm:px-2.5"
              aria-label="Add Company"
              onClick={(event) => openEditor(null, event.currentTarget)}
            >
              <Plus />
              <span className="hidden sm:inline">Add Company</span>
            </Button>
          </div>
        </FrameHeader>
        <div className="prospect-intents-viewport">
          <ToggleGroup
            type="single"
            value={tier}
            onValueChange={(value) => setTier(value as ProspectIntent | "")}
            className="prospect-intents"
            aria-label="Filter by account intent"
          >
            {summaries.map((summary) => (
              <ToggleGroupItem
                key={summary.tier}
                value={summary.tier}
                className={`prospect-intent-card prospect-intent-${summary.tier}`}
                aria-label={`${intentLabels[summary.tier]} intent, ${intentRanges[summary.tier]}: ${summary.count} of ${summaryRecords.length}, ${summary.unassigned} unassigned`}
              >
                <div className="flex items-center justify-between text-xs">
                  <Badge
                    variant={
                      summary.tier === "high"
                        ? "success-light"
                        : summary.tier === "medium"
                          ? "warning-light"
                          : "destructive-light"
                    }
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {intentLabels[summary.tier]} Intent
                  </Badge>
                  <span className="text-muted-foreground">
                    {summary.unassigned ? `${summary.unassigned} unassigned` : "All assigned"}
                  </span>
                </div>
                <div className="prospect-summary-metrics">
                  <strong className="prospect-summary-count text-xl font-semibold tracking-tight tabular-nums">
                    {summary.count}
                  </strong>
                  <span className="prospect-summary-dots" aria-hidden="true">
                    {summaryRecords.map((record, index) => (
                      <span key={record.id} data-filled={index < summary.count} />
                    ))}
                  </span>
                  <span className="prospect-summary-share text-xs tabular-nums text-muted-foreground">
                    {summary.share}%
                  </span>
                </div>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <FramePanel className="prospect-database-panel">
          <DataGrid
            table={table}
            recordCount={filteredCount}
            isLoading={loadPhase === "loading"}
            loadingMode="skeleton"
            tableLayout={{
              width: "fixed",
              rowBorder: true,
              headerBorder: true,
              headerBackground: false,
              cellBorder: columnLines,
              stripped: rowStripes,
              columnsPinnable: true,
              columnsResizable: resizable,
              columnsMovable: movable,
            }}
            tableClassNames={{
              base: "text-sm",
              headerRow: "h-8 [&>th]:h-8 [&>th]:py-0 [&>th[data-pinned]]:bg-background",
              bodyRow: density === "Compact" ? "h-[41px]" : "h-[49px]",
            }}
            emptyMessage={
              <Empty className="border-0 py-14">
                <EmptyHeader>
                  <EmptyTitle>No Matching Companies</EmptyTitle>
                  <EmptyDescription>
                    Try a different search or clear the current filters.
                  </EmptyDescription>
                </EmptyHeader>
                {hasFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </Empty>
            }
          >
            <div className="prospect-database-toolbar">
              {selected.length ? (
                <>
                  <span role="status" className="text-sm">
                    {selected.length} {selected.length === 1 ? "company" : "companies"} selected
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ListPlus />
                        <span className="hidden sm:inline">Save to List</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <ProspectListItems
                        ids={selected.map((record) => record.id)}
                        records={book.companies}
                        lists={book.lists}
                        onCommand={commit}
                        onCreate={() => setNewListIds(selected.map((record) => record.id))}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Delete selected companies"
                    onClick={() => setDeleteIds(selected.map((record) => record.id))}
                  >
                    <Trash2 />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
                    Clear
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="sm:hidden"
                    variant="outline"
                    size="icon"
                    aria-label="Search companies"
                    aria-expanded={searchOpen}
                    onClick={() => setSearchOpen((open) => !open)}
                  >
                    <Search />
                  </Button>
                  <div className={cn("prospect-search", isMobile && !searchOpen && "hidden")}>
                    <InputGroup className="h-8">
                      <InputGroupAddon>
                        <Search />
                      </InputGroupAddon>
                      <InputGroupInput
                        ref={searchRef}
                        aria-label="Search companies"
                        placeholder="Search companies..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                      {search && (
                        <InputGroupAddon align="inline-end">
                          <button aria-label="Clear company search" onClick={() => setSearch("")}>
                            <X className="size-3.5" />
                          </button>
                        </InputGroupAddon>
                      )}
                    </InputGroup>
                  </div>
                  <Filters
                    fields={fields}
                    query={query}
                    onQueryChange={setQuery}
                    variant="advanced"
                    advancedMode="popover"
                    className="w-auto flex-none"
                    menuClassName="w-[512px] max-w-[calc(100vw-10px)]"
                    trigger={
                      <Button variant="outline" aria-label="Filter">
                        <Filter />
                        <span className="hidden sm:inline">Filter</span>
                      </Button>
                    }
                  />
                  <Button
                    variant={mine ? "secondary" : "outline"}
                    size="icon"
                    className="sm:w-auto sm:gap-1.5 sm:px-2.5"
                    aria-label="My Accounts"
                    aria-pressed={mine}
                    onClick={() => setMine((value) => !value)}
                  >
                    <ProspectOwnerAvatar ownerId="mara" />
                    <span className="hidden sm:inline">My Accounts</span>
                  </Button>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear
                    </Button>
                  )}
                </>
              )}
              <div className="flex-1" />
              {book.past.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Undo last account change"
                  onClick={undo}
                >
                  <Undo2 />
                </Button>
              )}
              <Cascader
                items={columnGroups}
                multiple
                closeOnSelect={false}
                value={visibleColumnIds}
                onValueChange={(values) => {
                  const visible = new Set(values);
                  setColumnVisibility(
                    Object.fromEntries(
                      table
                        .getAllLeafColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => [column.id, visible.has(column.id)]),
                    ),
                  );
                }}
                labels={{ panelLabel: "Company columns" }}
              >
                <CascaderTrigger
                  aria-label="Columns"
                  showIcon={false}
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      className="sm:w-auto sm:gap-1.5 sm:px-2.5"
                    />
                  }
                >
                  <Columns3 />
                  <span className="hidden sm:inline">Columns</span>
                  <ChevronDown className="hidden size-3 sm:block" />
                </CascaderTrigger>
                <CascaderContent align="end" className="w-64">
                  <CascaderInput placeholder="Search columns..." />
                  <CascaderBreadcrumb />
                  <CascaderList>
                    <CascaderItems />
                  </CascaderList>
                </CascaderContent>
              </Cascader>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Settings">
                    <Settings2 />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0">
                  <FieldGroup className="gap-0">
                    <p className="px-3 pt-3 pb-1 text-xs text-muted-foreground">Appearance</p>
                    <Field orientation="horizontal" className="px-3 py-1">
                      <FieldLabel>Density</FieldLabel>
                      <Select value={density} onValueChange={setDensity}>
                        <SelectTrigger aria-label="Density" className="h-7 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Compact">Compact</SelectItem>
                          <SelectItem value="Comfortable">Comfortable</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field orientation="horizontal" className="px-3 py-1.5">
                      <FieldLabel htmlFor="prospect-column-lines">Column lines</FieldLabel>
                      <Switch
                        id="prospect-column-lines"
                        size="sm"
                        checked={columnLines}
                        onCheckedChange={setColumnLines}
                      />
                    </Field>
                    <Field orientation="horizontal" className="px-3 py-1.5">
                      <FieldLabel htmlFor="prospect-row-stripes">Row stripes</FieldLabel>
                      <Switch
                        id="prospect-row-stripes"
                        size="sm"
                        checked={rowStripes}
                        onCheckedChange={setRowStripes}
                      />
                    </Field>
                    <FieldSeparator className="my-2" />
                    <p className="px-3 pb-1 text-xs text-muted-foreground">Columns</p>
                    <Field orientation="horizontal" className="px-3 py-1.5">
                      <FieldLabel htmlFor="prospect-resizable">Resizable columns</FieldLabel>
                      <Switch
                        id="prospect-resizable"
                        size="sm"
                        checked={resizable}
                        onCheckedChange={setResizable}
                      />
                    </Field>
                    <Field orientation="horizontal" className="px-3 py-1.5">
                      <FieldLabel htmlFor="prospect-movable">Movable columns</FieldLabel>
                      <Switch
                        id="prospect-movable"
                        size="sm"
                        checked={movable}
                        onCheckedChange={setMovable}
                      />
                    </Field>
                    <div className="px-3 pt-1 pb-3">
                      <Button variant="outline" size="sm" className="w-full" onClick={resetColumns}>
                        Reset Columns
                      </Button>
                    </div>
                  </FieldGroup>
                </PopoverContent>
              </Popover>
            </div>
            {loadPhase === "error" && (
              <Alert variant="destructive" className="m-4 w-auto">
                <AlertDescription>
                  Could not load companies. Your current data has been kept.
                </AlertDescription>
                <AlertAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLoadAttempt((value) => value + 1)}
                  >
                    Retry
                  </Button>
                </AlertAction>
              </Alert>
            )}
            <DataGridContainer className="rounded-none border-x-0">
              <DataGridScrollArea orientation="horizontal">
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
            <FrameFooter>
              <DataGridPagination
                sizes={[10, 25, 50]}
                info="{from} - {to} of {count} companies"
                className="prospect-database-pagination"
              />
            </FrameFooter>
          </DataGrid>
        </FramePanel>
      </Frame>
      {details && (
        <ProspectDetails
          record={details}
          records={book.companies}
          lists={book.lists}
          onClose={() => {
            restoreDetailsFocus.current = true;
            setDetailsId(null);
          }}
          onCloseAutoFocus={(event) => {
            if (!restoreDetailsFocus.current) return;
            event.preventDefault();
            restoreDetailsFocus.current = false;
            restoreAccountFocus(detailsOpener.current);
          }}
          onEdit={() => {
            setDetailsId(null);
            openEditor(details);
          }}
          onCommand={commit}
          onCreateList={() => {
            setDetailsId(null);
            setNewListIds([details.id]);
          }}
        />
      )}
      {editor && (
        <ProspectEditor
          key={editor.record?.id ?? "new"}
          record={editor.record}
          records={book.companies}
          onClose={() => {
            restoreEditorFocus.current = true;
            setEditor(null);
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (!restoreEditorFocus.current) return;
            restoreEditorFocus.current = false;
            restoreAccountFocus(editorOpener.current);
          }}
          onSave={(record) => {
            commit({ type: "upsert", record }, editor.record ? "Company updated" : "Company added");
            restoreEditorFocus.current = true;
            setEditor(null);
          }}
          onDelete={(record) => {
            setEditor(null);
            setDeleteIds([record.id]);
          }}
        />
      )}
      {handover && (
        <ProspectHandover
          records={book.companies}
          onClose={() => setHandover(false)}
          onCommit={(from, to, count) => {
            commit({ type: "handover", from, to }, `${count} accounts handed over`);
            setHandover(false);
          }}
        />
      )}
      {newListIds && (
        <ProspectCreateList
          lists={book.lists}
          onClose={() => setNewListIds(null)}
          onCreate={(list) => {
            commit({ type: "create-list", list, companyIds: newListIds }, `Created ${list.name}`);
            setNewListIds(null);
          }}
        />
      )}
      <AlertDialog
        open={!!deleteIds}
        onOpenChange={(open) => {
          if (!open) setDeleteIds(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteIds?.length === 1
                ? `Delete ${book.companies.find((record) => record.id === deleteIds[0])?.name ?? "company"}?`
                : `Delete ${deleteIds?.length ?? 0} companies?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              The accounts, their contacts, signals and list memberships leave this local book. You
              can undo immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteIds) {
                  commit({ type: "remove", ids: deleteIds }, "Companies deleted");
                  setRowSelection({});
                  setDeleteIds(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
