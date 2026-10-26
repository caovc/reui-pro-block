import { Alert, AlertAction, AlertDescription } from "@/components/reui/alert";
import { useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDashed,
  Columns3,
  Copy,
  Download,
  Factory as FactoryIcon,
  ListFilter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  TriangleAlert,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid/data-grid";
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { Filters } from "@/components/reui/filters/filters";
import { createFilterQuery } from "@/components/reui/filters/filters-query";
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types";
import {
  Cascader,
  CascaderContent,
  CascaderEmpty,
  CascaderList,
  CascaderStatus,
  CascaderTrigger,
} from "@/components/reui/cascader/cascader";
import {
  CascaderBreadcrumb,
  CascaderInput,
  CascaderNav,
} from "@/components/reui/cascader/cascader-nav";
import { CascaderVirtualItems } from "@/components/reui/cascader/cascader-virtual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDomainGrid, type DomainColumn } from "./grid-advanced-model-grid";
import {
  calls,
  categories,
  createFactories,
  currentQuarter,
  factoryReducer,
  lenses,
  matchesFactoryQuery,
  matchesFactorySearch,
  matchesLens,
  money,
  newFactory,
  owners,
  quarters,
  scoreFactories,
  type BuyCall,
  type Factory,
  type FactoryAction,
  type FactoryScore,
  type Lens,
  type Quarter,
} from "./grid-advanced-factory-scorecard-data";
import {
  BuyMenu,
  FactoryDetails,
  FactoryEditor,
  OtifLane,
  SelectField,
} from "./grid-advanced-factory-scorecard-panels";
import "./grid-advanced-factory-scorecard.css";

const columnGroups = [
  {
    value: "scorecard",
    label: "Scorecard",
    children: [
      { value: "spend", label: "FOB Spend" },
      { value: "otif", label: "OTIF" },
    ],
  },
  {
    value: "performance",
    label: "Performance",
    children: [
      { value: "nextBuy", label: "Next Buy" },
      { value: "defects", label: "Defects" },
      { value: "status", label: "Status" },
    ],
  },
  {
    value: "factory",
    label: "Factory",
    children: [
      { value: "country", label: "Country" },
      { value: "owner", label: "Owner" },
    ],
  },
];
const optionalColumns = columnGroups.flatMap((group) => group.children);
const defaultHidden = ["Defects", "Status", "Country", "Owner"];
const lensIcons: Record<Lens, typeof FactoryIcon> = {
  All: FactoryIcon,
  Climbers: ArrowUp,
  Fallers: ArrowDown,
  New: CircleDashed,
  "Below floor": TriangleAlert,
  "At goal": Check,
};

interface Scope {
  query: FilterQuery;
  search: string;
  lens: Lens;
}
function matchesBase(factory: FactoryScore, scope: Pick<Scope, "query" | "search">) {
  return matchesFactorySearch(factory, scope.search) && matchesFactoryQuery(factory, scope.query);
}
function fieldSchema(records: Factory[]): FilterField[] {
  const choice = (id: string, label: string, options: readonly string[]): FilterField => ({
    id,
    label,
    type: "select",
    options: options.map((value) => ({ value, label: value })),
  });
  return [
    choice("category", "Category", categories),
    choice("country", "Country", [...new Set(records.map((factory) => factory.country))].sort()),
    choice("owner", "Owner", owners),
    choice("status", "Status", ["Active", "Watch", "Paused"]),
    choice("nextBuy", "Next Buy", calls),
    choice("position", "OTIF Position", ["Below floor", "Between floor and goal", "At goal"]),
    { id: "change", label: "Spend Change %", type: "number" },
    { id: "defects", label: "Defects", type: "number" },
  ];
}

function SettingSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Label className="flex cursor-pointer items-center justify-between py-1.5 font-normal">
      <span>{label}</span>
      <Switch aria-label={label} checked={checked} onCheckedChange={onChange} />
    </Label>
  );
}

function FactoryActions({
  factory,
  onDetails,
  onEdit,
  onDelete,
  onCall,
}: {
  factory: FactoryScore;
  onDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCall: (value: BuyCall) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${factory.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[170px]">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Factory
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={onDetails}>
          <FactoryIcon />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil />
          Edit Factory
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            try {
              await navigator.clipboard.writeText(factory.id);
              toast.success("Factory ID copied");
            } catch {
              toast.error("Clipboard unavailable", { description: factory.id });
            }
          }}
        >
          <Copy />
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Set Next Buy</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={factory.nextBuy}
              onValueChange={(value) => onCall(value as BuyCall)}
            >
              {calls.map((call) => (
                <DropdownMenuRadioItem key={call} value={call}>
                  {call}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 />
          Delete Factory
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface FactoryScorecardProps {
  /** Optional real async data adapter. Its failures leave the last valid rows intact. */
  loadFactories?: (signal: AbortSignal) => Promise<Factory[]>;
}

export default function FactoryScorecard({ loadFactories }: FactoryScorecardProps = {}) {
  const mobile = useIsMobile(640);
  const [store, dispatch] = useReducer(factoryReducer, undefined, () => ({
    records: createFactories(),
    undo: [],
  }));
  const [compare, setCompare] = useState<Quarter>("Q2 2026");
  const [withinCategory, setWithinCategory] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [lens, setLens] = useState<Lens>("All");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([{ id: "spend", desc: true }]);
  const [hidden, setHidden] = useState(defaultHidden);
  const [selection, setSelection] = useState<string[]>([]);
  const [comfortable, setComfortable] = useState(false);
  const [lines, setLines] = useState(true);
  const [stripes, setStripes] = useState(false);
  const [resizable, setResizable] = useState(true);
  const [movable, setMovable] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Factory | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Factory | null>(null);
  const [loading, setLoading] = useState(!!loadFactories);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!loadFactories) return;
    const controller = new AbortController();
    void Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return null;
        setLoading(true);
        setLoadError("");
        return loadFactories(controller.signal);
      })
      .then((records) => {
        if (!controller.signal.aborted && records) {
          dispatch({ type: "load", records });
          setSelection([]);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setLoadError(
            error instanceof Error ? error.message : "The factory scorecard could not be loaded.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadFactories, reload]);

  const data = useMemo(
    () => scoreFactories(store.records, compare, withinCategory),
    [store.records, compare, withinCategory],
  );
  const schema = useMemo(() => fieldSchema(store.records), [store.records]);
  const scope = useMemo<Scope>(() => ({ query, search, lens }), [query, search, lens]);
  const lensCounts = Object.fromEntries(
    lenses.map((item) => [
      item,
      data.filter((factory) => matchesBase(factory, scope) && matchesLens(factory, item)).length,
    ]),
  ) as Record<Lens, number>;
  const maxSpend = Math.max(1, ...data.map((factory) => factory.current.spend));
  const details = data.find((factory) => factory.id === detailsId);

  function mutate(action: FactoryAction, message: string, description?: string) {
    dispatch(action);
    toast.success(message, {
      id: "factory-scorecard-change",
      description,
      action: { label: "Undo", onClick: undo },
    });
  }
  function undo() {
    dispatch({ type: "undo" });
    toast.dismiss("factory-scorecard-change");
  }
  function setCall(factory: Factory, value: BuyCall) {
    mutate({ type: "call", id: factory.id, value }, "Next buy set", `${factory.name}: ${value}`);
  }
  function clearFilters() {
    setSearch("");
    setQuery(createFilterQuery());
    setLens("All");
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }
  function resetPage() {
    setPagination((previous) =>
      previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 },
    );
  }
  function changeLens(value: Lens) {
    setLens(value);
    resetPage();
  }
  function changeQuery(value: FilterQuery) {
    setQuery(value);
    resetPage();
  }
  function changeSearch(value: string) {
    setSearch(value);
    resetPage();
  }
  function openEditor(factory: Factory, isNew = false) {
    setDetailsId(null);
    setCreating(isNew);
    setEditing(factory);
  }

  const columns = useMemo<DomainColumn<FactoryScore>[]>(() => {
    const meta = {
      headerClassName: "h-8 px-3 text-sm font-medium",
      cellClassName: "px-3 py-0 text-sm",
    };
    const header =
      (title: string): DomainColumn<FactoryScore>["header"] =>
      ({ column }) => (
        <DataGridColumnHeader column={column} title={title} className="text-sm font-normal" />
      );
    return [
      {
        id: "select",
        size: 49,
        enableHiding: false,
        enableResizing: false,
        enableSorting: false,
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        meta: { headerClassName: "h-8 px-4", cellClassName: "px-4 py-0" },
      },
      {
        id: "rank",
        accessorKey: "rank",
        header: header("Rank"),
        size: 104,
        enableHiding: false,
        meta,
        cell: ({ row }) => (
          <div className="flex items-center gap-3 tabular-nums">
            <strong className="font-medium">#{row.original.rank}</strong>
            {row.original.movement === null ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CircleDashed className="size-3" />
                New
              </span>
            ) : row.original.movement === 0 ? (
              <span className="text-muted-foreground">–</span>
            ) : (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  row.original.movement > 0 ? "text-emerald-600" : "text-destructive",
                )}
              >
                {row.original.movement > 0 ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
                {Math.abs(row.original.movement)}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "name",
        accessorKey: "name",
        header: header("Factory"),
        size: 220,
        minSize: 150,
        enableHiding: false,
        meta,
        cell: ({ row }) => (
          <Button
            variant="link"
            className="h-auto max-w-full justify-start truncate p-0 text-sm font-medium text-foreground"
            aria-label={`Open ${row.original.name}`}
            onClick={() => setDetailsId(row.original.id)}
          >
            <span className="sm:hidden" aria-hidden="true">
              {row.original.flag}
            </span>
            {row.original.name}
          </Button>
        ),
      },
      {
        id: "spend",
        accessorFn: (factory) => factory.current.spend,
        header: header("FOB Spend"),
        size: 160,
        meta: { ...meta, headerTitle: "FOB Spend" },
        cell: ({ row }) => (
          <div
            className="flex items-center gap-3 tabular-nums"
            title={
              row.original.prior
                ? `${compare}: ${money(row.original.prior.spend)} · ${row.original.change!.toFixed(1)}% · ${money(row.original.current.spend - row.original.prior.spend)}`
                : `No shipment at ${compare}`
            }
          >
            <span className="flex h-1.5 w-20 shrink-0 items-center">
              <span
                className="h-full rounded-l-full bg-foreground"
                style={{ width: `${(row.original.current.spend / maxSpend) * 100}%` }}
              />
            </span>
            <span className="text-xs text-muted-foreground">
              {money(row.original.current.spend)}
            </span>
          </div>
        ),
      },
      {
        id: "otif",
        accessorFn: (factory) => factory.current.otif,
        header: ({ column }) => (
          <div className="flex items-center gap-3">
            <div className="factory-otif-axis" aria-label="OTIF shared scale 80 to 100 percent">
              {[80, 85, 90, 95, 100].map((value) => (
                <span
                  key={value}
                  style={{ left: `${(value - 80) * 5}%` }}
                  className={value === 95 ? "text-foreground" : undefined}
                >
                  {value === 95 ? "Goal 95" : value}
                </span>
              ))}
            </div>
            <DataGridColumnHeader column={column} title="OTIF" className="text-sm font-normal" />
          </div>
        ),
        size: mobile ? 320 : 493,
        minSize: 320,
        meta: {
          ...meta,
          headerTitle: "OTIF",
          headerClassName: "h-8 px-7 text-sm font-medium",
          cellClassName: "px-7 py-0",
        },
        cell: ({ row }) => <OtifLane factory={row.original} compare={compare} />,
      },
      {
        id: "nextBuy",
        accessorKey: "nextBuy",
        header: header("Next Buy"),
        size: 128,
        meta: { ...meta, headerTitle: "Next Buy" },
        cell: ({ row }) => (
          <BuyMenu factory={row.original} onChange={(call) => setCall(row.original, call)} />
        ),
      },
      {
        id: "defects",
        accessorFn: (factory) => factory.current.defects,
        header: header("Defects"),
        size: 100,
        meta: { ...meta, headerTitle: "Defects" },
        cell: ({ row }) => `${row.original.current.defects.toFixed(2)}%`,
      },
      {
        id: "status",
        accessorKey: "status",
        header: header("Status"),
        size: 110,
        meta: { ...meta, headerTitle: "Status" },
      },
      {
        id: "country",
        accessorKey: "country",
        header: header("Country"),
        size: 140,
        meta: { ...meta, headerTitle: "Country" },
        cell: ({ row }) => `${row.original.flag} ${row.original.country}`,
      },
      {
        id: "owner",
        accessorKey: "owner",
        header: header("Owner"),
        size: 140,
        meta: { ...meta, headerTitle: "Owner" },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        size: 60,
        enableHiding: false,
        enableSorting: false,
        enableResizing: false,
        meta: { headerClassName: "h-8", cellClassName: "py-0 text-center" },
        cell: ({ row }) => (
          <FactoryActions
            factory={row.original}
            onDetails={() => setDetailsId(row.original.id)}
            onEdit={() => openEditor(row.original)}
            onDelete={() => setDeleting(row.original)}
            onCall={(call) => setCall(row.original, call)}
          />
        ),
      },
      {
        id: "scope",
        accessorFn: () => true,
        enableHiding: false,
        enableSorting: false,
        filterFn: (row, _id, value: Scope) =>
          matchesBase(row.original, value) && matchesLens(row.original, value.lens),
      },
    ];
  }, [compare, maxSpend, mobile]);

  const table = useDomainGrid({
    data,
    columns,
    filters: [{ id: "scope", value: scope }],
    sorting,
    onSortingChange: setSorting,
    pagination,
    onPaginationChange: setPagination,
    hidden,
    onHiddenChange: setHidden,
    alwaysHidden: ["scope"],
    selection,
    onSelectionChange: setSelection,
    getRowId: (factory) => factory.id,
  });
  const count = table.getFilteredRowModel().rows.length;

  function exportCsv() {
    const rows = table
      .getSortedRowModel()
      .rows.filter((row) => !selection.length || selection.includes(row.id));
    const csv = [
      [
        "Factory ID",
        "Factory",
        "Category",
        "Country",
        "Owner",
        "Rank",
        "FOB Spend",
        "OTIF",
        "Next Buy",
        "Suggested",
      ],
      ...rows.map(({ original: factory }) => [
        factory.id,
        factory.name,
        factory.category,
        factory.country,
        factory.owner,
        factory.rank,
        factory.current.spend,
        factory.current.otif,
        factory.nextBuy,
        factory.suggested,
      ]),
    ]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bricklane-factory-scorecard.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} factories exported`);
  }

  const settings: ReactNode = (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Settings">
          <Settings2 />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3 p-3 text-sm">
        <div>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Scorecard</h3>
          <div className="flex items-center justify-between gap-3">
            <Label className="font-normal">Rank Within</Label>
            <SelectField
              label="Rank Within"
              value={withinCategory ? "Category" : "All factories"}
              options={["All factories", "Category"]}
              onChange={(value) => setWithinCategory(value === "Category")}
              className="w-36"
            />
          </div>
        </div>
        <div className="border-t pt-3">
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Appearance</h3>
          <div className="mb-1 flex items-center justify-between gap-3">
            <Label className="font-normal">Density</Label>
            <SelectField
              label="Density"
              value={comfortable ? "Comfortable" : "Compact"}
              options={["Compact", "Comfortable"]}
              onChange={(value) => setComfortable(value === "Comfortable")}
              className="w-36"
            />
          </div>
          <SettingSwitch label="Column Lines" checked={lines} onChange={setLines} />
          <SettingSwitch label="Row Stripes" checked={stripes} onChange={setStripes} />
        </div>
        <div className="border-t pt-3">
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Columns</h3>
          <SettingSwitch label="Resizable Columns" checked={resizable} onChange={setResizable} />
          <SettingSwitch label="Movable Columns" checked={movable} onChange={setMovable} />
          <Button
            size="sm"
            variant="outline"
            className="mt-2 w-full"
            onClick={() => {
              table.resetColumnSizing();
              table.resetColumnOrder();
              setHidden(defaultHidden);
            }}
          >
            Reset Columns
          </Button>
        </div>
        {loadFactories && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={() => setReload((value) => value + 1)}
          >
            Refresh data
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );

  return (
    <Frame
      dense
      className={cn(
        "factory-scorecard mx-auto w-full min-w-0 max-w-[1216px] text-sm",
        comfortable && "factory-comfortable",
      )}
      aria-label="Factory Scorecard data grid"
    >
      <FrameHeader className="factory-scorecard-heading flex-row flex-wrap items-center justify-between gap-3 px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <FrameTitle>
            <h2>Factory Scorecard</h2>
          </FrameTitle>
          <span className="hidden text-muted-foreground/40 sm:inline" aria-hidden="true">
            •
          </span>
          <FrameDescription className="hidden text-xs sm:block">
            {currentQuarter}, ranked by FOB spend
          </FrameDescription>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 font-normal">
                <CalendarDays />
                vs {compare}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Compare quarter</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={compare}
                onValueChange={(value) => setCompare(value as Quarter)}
              >
                {quarters
                  .slice(0, -1)
                  .toReversed()
                  .map((quarter) => (
                    <DropdownMenuRadioItem key={quarter} value={quarter}>
                      {quarter}
                      {quarter === "Q3 2025" && (
                        <span className="ml-auto text-[10px] text-muted-foreground">last year</span>
                      )}
                    </DropdownMenuRadioItem>
                  ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="icon-sm" variant="outline" aria-label="Export" onClick={exportCsv}>
            <Download />
          </Button>
          <Button
            size="sm"
            className="h-8"
            onClick={() => openEditor(newFactory(`BL-${crypto.randomUUID().slice(0, 8)}`), true)}
          >
            <Plus />
            <span className="hidden sm:inline">Add Factory</span>
            <span className="sr-only sm:hidden">Add Factory</span>
          </Button>
        </div>
      </FrameHeader>
      <FramePanel className="overflow-hidden p-0 shadow-none">
        <DataGrid
          table={table}
          recordCount={count}
          isLoading={loading}
          loadingMessage="Loading factory scorecard…"
          emptyMessage={
            <div className="space-y-2 py-10">
              <FactoryIcon className="mx-auto mb-3 size-7 text-muted-foreground" />
              <h3 className="font-medium">No Matching Factories</h3>
              <p className="text-sm text-muted-foreground">Try another search, lens or filter.</p>
              <Button size="sm" variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          }
          tableLayout={{
            width: "fixed",
            rowBorder: true,
            headerBorder: true,
            headerBackground: false,
            cellBorder: lines,
            stripped: stripes,
            columnsResizable: resizable,
            columnsResizeMode: "onChange",
            columnsMovable: movable,
            columnsVisibility: true,
          }}
          tableClassNames={{
            base: "text-sm",
            headerRow: "h-8",
            bodyRow: comfortable ? "h-[49px]" : "h-[41px]",
          }}
        >
          <div className="factory-scorecard-toolbar flex min-h-12 items-center gap-2 border-b px-2 py-2">
            <div className="hidden items-center gap-1 lg:flex">
              {lenses.map((item) => {
                const Icon = lensIcons[item];
                return (
                  <Button
                    key={item}
                    size="sm"
                    variant={lens === item ? "secondary" : "ghost"}
                    aria-pressed={lens === item}
                    className="h-8 gap-1.5 px-2 font-normal"
                    onClick={() => changeLens(item)}
                  >
                    <Icon
                      className={cn(
                        item === "Climbers" || item === "At goal"
                          ? "text-emerald-600"
                          : item === "Fallers" || item === "Below floor"
                            ? "text-destructive"
                            : "text-muted-foreground",
                      )}
                    />
                    <span className="tabular-nums text-foreground">{lensCounts[item]}</span>
                    <span className={lens !== item ? "text-muted-foreground" : undefined}>
                      {item}
                    </span>
                  </Button>
                );
              })}
            </div>
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={`Scorecard lens, ${lens} ${lensCounts[lens]}`}
                    className="h-8 w-40 justify-between font-normal"
                  >
                    {lensCounts[lens]} {lens}
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup
                    value={lens}
                    onValueChange={(value) => changeLens(value as Lens)}
                  >
                    {lenses.map((item) => (
                      <DropdownMenuRadioItem key={item} value={item}>
                        {lensCounts[item]} {item}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={searchOpen ? "Close search" : "Search factories"}
                onClick={() => setSearchOpen((value) => !value)}
              >
                {searchOpen ? <X /> : <Search />}
              </Button>
              <Filters
                fields={schema}
                query={query}
                onQueryChange={changeQuery}
                variant="advanced"
                advancedMode="popover"
                advancedAlign="end"
                showClear
                trigger={
                  <Button size="icon-sm" variant="ghost" aria-label="Filter">
                    <ListFilter />
                  </Button>
                }
              />
              <Cascader
                items={columnGroups}
                multiple
                value={optionalColumns
                  .filter((column) => table.getColumn(column.value)?.getIsVisible())
                  .map((column) => column.value)}
                onValueChange={(values) =>
                  setHidden(
                    optionalColumns
                      .filter((column) => !values.includes(column.value))
                      .map((column) => column.label),
                  )
                }
                closeOnSelect={false}
                labels={{ panelLabel: "Factory columns", rootLevel: "Columns" }}
              >
                <CascaderTrigger
                  showIcon={false}
                  aria-label="Columns"
                  render={<Button variant="ghost" size="icon-sm" />}
                >
                  <Columns3 />
                </CascaderTrigger>
                <CascaderContent align="end" className="w-64">
                  <CascaderNav>
                    <CascaderInput />
                  </CascaderNav>
                  <CascaderBreadcrumb />
                  <CascaderList>
                    <CascaderVirtualItems />
                  </CascaderList>
                  <CascaderEmpty />
                  <CascaderStatus />
                </CascaderContent>
              </Cascader>
              {settings}
            </div>
          </div>
          {searchOpen && (
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <Input
                autoFocus
                aria-label="Search factory records"
                className="h-8"
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="Search factories, owners, countries…"
              />
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Clear search"
                onClick={() => changeSearch("")}
              >
                <X />
              </Button>
            </div>
          )}
          {!!selection.length && (
            <div
              role="status"
              className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2 text-xs"
            >
              <strong>{selection.length} factories selected</strong>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => setSelection([])}
              >
                Clear selection
              </Button>
              <Button size="sm" variant="ghost" className="ml-auto h-6 text-xs" onClick={exportCsv}>
                Export selected
              </Button>
            </div>
          )}
          {loadError && (
            <Alert variant="destructive" className="m-4 w-auto">
              <AlertDescription>{loadError}</AlertDescription>
              <AlertAction>
                <Button size="sm" variant="outline" onClick={() => setReload((value) => value + 1)}>
                  Retry
                </Button>
              </AlertAction>
            </Alert>
          )}
          <DataGridContainer className="min-w-0 rounded-none border-0">
            <DataGridScrollArea orientation="horizontal">
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
          <FrameFooter className="factory-scorecard-footer">
            <DataGridPagination
              sizes={[10, 25, 50]}
              info="{from} - {to} of {count} factories"
              className="factory-scorecard-pager"
            />
          </FrameFooter>
        </DataGrid>
      </FramePanel>
      {store.undo.length > 0 && (
        <div className="flex justify-end px-3 py-1">
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={undo}>
            <Undo2 />
            Undo last change
          </Button>
        </div>
      )}
      {details && (
        <FactoryDetails
          key={details.id}
          factory={details}
          records={store.records}
          compare={compare}
          withinCategory={withinCategory}
          onClose={() => setDetailsId(null)}
          onEdit={() => openEditor(details)}
          onSave={(factory) => mutate({ type: "put", factory }, "Notes updated")}
          onCall={(call) => setCall(details, call)}
        />
      )}
      {editing && (
        <FactoryEditor
          key={editing.id}
          factory={editing}
          creating={creating}
          onClose={() => setEditing(null)}
          onSave={(factory) => {
            mutate(
              { type: "put", factory },
              creating ? "Factory added" : "Factory updated",
              factory.name,
            );
            setEditing(null);
          }}
        />
      )}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the factory and its quarterly measurements from this local demo. Undo can
              restore them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) {
                  mutate({ type: "delete", id: deleting.id }, "Factory deleted", deleting.name);
                  setSelection((ids) => ids.filter((id) => id !== deleting.id));
                  if (detailsId === deleting.id) setDetailsId(null);
                  setDeleting(null);
                }
              }}
            >
              Delete Factory
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Frame>
  );
}
