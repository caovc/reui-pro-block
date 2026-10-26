import { Alert, AlertAction, AlertDescription } from "@/components/reui/alert";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  useTable,
  type ColumnDef,
  type ColumnPinningState,
  type ColumnVisibilityState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDownLeft,
  ArrowRight,
  Columns3,
  Download,
  Ellipsis,
  Filter,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import {
  DataGridTable,
  DataGridTableFootRow,
  DataGridTableFootRowCell,
} from "@/components/reui/data-grid/data-grid-table";
import { Filters, createFilterQuery, type FilterField } from "@/components/reui/filters/filters";
import {
  Cascader,
  CascaderContent,
  CascaderList,
  CascaderPanel,
  CascaderTrigger,
} from "@/components/reui/cascader/cascader";
import { CascaderItems } from "@/components/reui/cascader/cascader-item";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel, FieldSeparator } from "@/components/ui/field";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { downloadCsv } from "./data-utils";
import {
  createFreightBook,
  freightShippers,
  freightTerminals,
  type FreightBook,
  type FreightLane,
  type FreightTerminal,
} from "./grid-advanced-freight-data";
import {
  freightBand,
  freightBookIssue,
  freightBands,
  freightFigures,
  freightFigureText,
  freightLaneMatches,
  freightMatrix,
  freightMoney,
  freightTotals,
  type FreightBand,
  type FreightCriteria,
} from "./grid-advanced-freight-math";
import { FreightPanels, type FreightPanel } from "./grid-advanced-freight-panels";
import "./grid-advanced-freight.css";

const rawLaneColumns: ColumnDef<DataGridFeatures, FreightLane>[] = [
  { id: "route", accessorKey: "origin", enableGlobalFilter: true },
];
const destinationNodes = ["Atlantic", "Central", "East"].map((region) => ({
  value: `region-${region}`,
  label: region,
  children: freightTerminals
    .filter((terminal) => terminal.region === region)
    .map((terminal) => ({ value: terminal.id, label: terminal.city })),
}));
const filterFields: FilterField[] = [
  {
    id: "origin",
    label: "Origin",
    type: "select",
    options: freightTerminals.map((terminal) => ({ value: terminal.id, label: terminal.city })),
  },
  {
    id: "destination",
    label: "Destination",
    type: "select",
    options: freightTerminals.map((terminal) => ({ value: terminal.id, label: terminal.city })),
  },
  {
    id: "customs",
    label: "Customs",
    type: "select",
    options: ["Domestic", "EU", "Customs"].map((value) => ({ value, label: value })),
  },
  {
    id: "equipment",
    label: "Equipment",
    type: "select",
    options: ["Curtainsider", "Reefer", "Flatbed"].map((value) => ({ value, label: value })),
  },
  {
    id: "contract",
    label: "Contract",
    type: "select",
    options: ["Contract", "Spot"].map((value) => ({ value, label: value })),
  },
  {
    id: "shipper",
    label: "Shipper",
    type: "select",
    options: freightShippers.map((value) => ({ value, label: value })),
  },
  { id: "loads", label: "Weekly Loads", type: "number" },
  { id: "margin", label: "Margin %", type: "number" },
];
const terminalById = new Map(freightTerminals.map((terminal) => [terminal.id, terminal]));
const marginText = (margin: number | null) => (margin === null ? "—" : `${margin.toFixed(1)}%`);

function LaneHeat({
  origin,
  destination,
  outbound,
  backhaul,
  mode,
  onOpen,
}: {
  origin: FreightTerminal;
  destination: FreightTerminal;
  outbound?: FreightLane;
  backhaul?: FreightLane;
  mode: "loads" | "profit";
  onOpen: () => void;
}) {
  if (origin.id === destination.id)
    return (
      <div className="freight-diagonal">
        <span className="sr-only">{origin.city}, same terminal</span>
      </div>
    );
  const band = outbound ? freightBand(freightFigures(outbound).margin) : null;
  return (
    <button
      type="button"
      data-destination={destination.id}
      data-band={band || "none"}
      className={cn("freight-heat", (outbound || backhaul) && "freight-has-lane")}
      aria-label={`${origin.city} to ${destination.city}, ${outbound ? `${band || "unpriced"} margin, ${freightFigureText(outbound, mode)}` : "no lane"}${backhaul ? `, backhaul ${freightFigureText(backhaul, mode)}` : ", no backhaul"}`}
      onClick={onOpen}
    >
      <span className="freight-headhaul">{freightFigureText(outbound, mode)}</span>
      <span className="freight-backhaul">{freightFigureText(backhaul, mode)}</span>
    </button>
  );
}
function TerminalActions({
  terminal,
  lanes,
  onPanel,
  onExport,
}: {
  terminal: FreightTerminal;
  lanes: FreightLane[];
  onPanel: (panel: FreightPanel, opener?: HTMLElement | null) => void;
  onExport: (lanes: FreightLane[]) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openingPanel = useRef(false);
  const openPanel = (panel: FreightPanel) => {
    openingPanel.current = true;
    onPanel(panel, triggerRef.current);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          ref={triggerRef}
          aria-label={`Actions for ${terminal.city}`}
          className="size-7"
        >
          <Ellipsis className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44"
        onCloseAutoFocus={(event) => {
          if (openingPanel.current) {
            event.preventDefault();
            openingPanel.current = false;
          }
        }}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Outbound Lanes</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => openPanel({ kind: "editor", origin: terminal.id })}>
            Add Route
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!lanes.length}
            onSelect={() =>
              openPanel({
                kind: "reprice",
                laneIds: lanes.map((lane) => lane.id),
                label: `Outbound lanes from ${terminal.city}`,
              })
            }
          >
            Reprice Lanes
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onExport(lanes)}>Export CSV</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Terminal</DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() => openPanel({ kind: "terminal", terminalId: terminal.id })}
          >
            View Terminal
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              openPanel({ kind: "terminal", terminalId: terminal.id, tab: "balance" })
            }
          >
            Lane Balance
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              openPanel({ kind: "terminal", terminalId: terminal.id, tab: "history" })
            }
          >
            Rate History
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function IconHint({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export type FreightCargoProps = { loadNetwork?: (signal: AbortSignal) => Promise<FreightBook> };

export default function FreightCargo({ loadNetwork }: FreightCargoProps = {}) {
  const [book, setBook] = useState<FreightBook>(() =>
    loadNetwork ? { lanes: [], history: [] } : createFreightBook(),
  );
  const [loading, setLoading] = useState(!!loadNetwork);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [undoBooks, setUndoBooks] = useState<FreightBook[]>([]);
  const [query, setQuery] = useState(createFilterQuery);
  const [search, setSearch] = useState("");
  const [band, setBand] = useState<FreightBand | "All Margins">("All Margins");
  const [mode, setMode] = useState<"loads" | "profit">("loads");
  const [panel, setPanel] = useState<FreightPanel>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const panelOpener = useRef<HTMLElement | null>(null);
  const returnFocus = useRef(false);
  const openPanel = useCallback((next: FreightPanel, opener?: HTMLElement | null) => {
    if (next) {
      const target = opener || document.activeElement;
      if (target instanceof HTMLElement && gridRef.current?.contains(target))
        panelOpener.current = target;
    }
    returnFocus.current = next === null;
    setPanel(next);
  }, []);
  const restorePanelFocus = useCallback((event: Event) => {
    event.preventDefault();
    if (!returnFocus.current) return;
    const target = panelOpener.current;
    if (target?.isConnected) target.focus();
    else
      gridRef.current?.querySelector<HTMLButtonElement>('button[aria-label="Add Route"]')?.focus();
  }, []);
  const [roomy, setRoomy] = useState(false);
  const [columnLines, setColumnLines] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [visibility, setVisibility] = useState<ColumnVisibilityState>({});
  const [pinning, setPinning] = useState<ColumnPinningState>({
    start: ["select", "origin"],
    end: [],
  });
  useEffect(() => {
    if (!loadNetwork) return;
    const controller = new AbortController();
    let cancelled = false;
    void Promise.resolve()
      .then(() => {
        if (cancelled || controller.signal.aborted) return null;
        setLoading(true);
        setLoadError(null);
        openPanel(null);
        return loadNetwork(controller.signal);
      })
      .then((next) => {
        if (cancelled || controller.signal.aborted) return;
        if (!next) throw new Error("The network response is not a freight book.");
        const issue = freightBookIssue(next, freightTerminals);
        if (issue) throw new Error(issue);
        setBook(next);
        setUndoBooks([]);
        setSelection({});
      })
      .catch((issue: unknown) => {
        if (!cancelled && !controller.signal.aborted)
          setLoadError(issue instanceof Error ? issue.message : "Could not load this network.");
      })
      .finally(() => {
        if (!cancelled && !controller.signal.aborted) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [loadNetwork, reload, openPanel]);
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const criteria = useMemo<FreightCriteria>(
    () => ({ text: search, query, band }),
    [search, query, band],
  );
  // The complete directed lane records enter the native filtering model.
  // The second model below renders the terminal pivot, not a replacement query engine.
  const laneTable = useTable({
    features: dataGridFeatures,
    columns: rawLaneColumns,
    data: book.lanes,
    getRowId: (lane) => lane.id,
    manualPagination: true,
    state: { globalFilter: criteria },
    globalFilterFn: (row, _column, value) =>
      freightLaneMatches(row.original, value as FreightCriteria, freightTerminals),
  });
  const nativeLaneRows = laneTable.getFilteredRowModel().rows;
  const matchingLanes = useMemo(() => nativeLaneRows.map((row) => row.original), [nativeLaneRows]);
  const filteredPivot = useMemo(() => freightMatrix(matchingLanes), [matchingLanes]);
  const activeLanes = useMemo(() => book.lanes.filter((lane) => lane.active), [book.lanes]);
  const allPivot = useMemo(() => freightMatrix(activeLanes), [activeLanes]);
  const totals = useMemo(() => freightTotals(matchingLanes), [matchingLanes]);
  const selectedIds = Object.keys(selection);
  const selectedLanes = activeLanes.filter((lane) => selection[lane.origin]);
  const selectedTotals = freightTotals(selectedLanes);
  const isFiltered = search.trim() !== "" || query.rules.length > 0 || band !== "All Margins";
  const exportLanes = useCallback((lanes: FreightLane[]) => {
    downloadCsv(
      "bricklane-freight-lanes",
      lanes.map((lane) => ({
        Origin: terminalById.get(lane.origin)?.city || lane.origin,
        Destination: terminalById.get(lane.destination)?.city || lane.destination,
        Shipper: lane.shipper,
        Equipment: lane.equipment,
        Contract: lane.contract,
        "Loads/week": lane.loads,
        "Distance km (demo)": lane.distanceKm,
        "Rate EUR/km": (lane.rateCents / 100).toFixed(2),
        "Cost EUR/km": (lane.costCents / 100).toFixed(2),
        "Profit EUR/week": (freightFigures(lane).profitCents / 100).toFixed(2),
        "Margin %": freightFigures(lane).margin?.toFixed(1) ?? "",
      })),
    );
  }, []);
  const columns = useMemo<ColumnDef<DataGridFeatures, FreightTerminal>[]>(
    () => [
      {
        id: "select",
        size: 49,
        enableSorting: false,
        enableHiding: false,
        enableGlobalFilter: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all origins"
            disabled={loading}
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.city}`}
            disabled={loading}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(!!checked)}
          />
        ),
        meta: { headerClassName: "pl-4 pr-2", cellClassName: "pl-4 pr-2" },
      },
      {
        id: "origin",
        accessorKey: "city",
        size: mobile ? 116 : 288,
        minSize: mobile ? 116 : 288,
        enableSorting: false,
        enableHiding: false,
        enableGlobalFilter: true,
        header: () => (
          <span className="flex items-center justify-between gap-1 font-normal">
            <span>
              From <MapPin className="inline size-3 text-muted-foreground" />
            </span>
            <span>
              To <ArrowRight className="inline size-3 text-muted-foreground" />
            </span>
          </span>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <MapPin aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <button
                type="button"
                className="block max-w-full truncate text-left font-medium leading-4 hover:underline"
                onClick={() => openPanel({ kind: "terminal", terminalId: row.id })}
              >
                {row.original.city}
                <span className="sr-only">, {row.original.country}</span>
              </button>
              <p className="freight-origin-detail truncate text-xs leading-4 text-muted-foreground">
                {row.original.id}
                <span className="hidden sm:inline">
                  {" "}
                  · {allPivot.outbound.get(row.id)?.length || 0} lanes
                </span>
              </p>
            </div>
          </div>
        ),
        meta: { headerTitle: "From", headerClassName: "px-2 font-normal", cellClassName: "px-2" },
      },
      ...freightTerminals.map((destination): ColumnDef<DataGridFeatures, FreightTerminal> => ({
        id: `to-${destination.id}`,
        size: 64,
        enableSorting: false,
        enableGlobalFilter: false,
        header: () => <span aria-label={`To ${destination.city}`}>{destination.id}</span>,
        cell: ({ row }) => (
          <LaneHeat
            origin={row.original}
            destination={destination}
            outbound={allPivot.byPair.get(`${row.id}-${destination.id}`)}
            backhaul={allPivot.byPair.get(`${destination.id}-${row.id}`)}
            mode={mode}
            onOpen={() => openPanel({ kind: "lane", origin: row.id, destination: destination.id })}
          />
        ),
        meta: {
          headerTitle: destination.city,
          headerClassName: "px-0 text-center font-normal",
          cellClassName: "p-0",
        },
      })),
      {
        id: "out",
        size: 64,
        accessorFn: (terminal) => {
          const summary = freightTotals(filteredPivot.outbound.get(terminal.id) || []);
          return mode === "loads" ? summary.loads : summary.profitCents;
        },
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Out"
            column={column}
            className="text-sm leading-5 font-normal"
          />
        ),
        enableHiding: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const summary = freightTotals(filteredPivot.outbound.get(row.id) || []);
          return (
            <span className="tabular-nums">
              {mode === "loads"
                ? summary.loads.toLocaleString("en-GB")
                : freightMoney(summary.profitCents, true)}
            </span>
          );
        },
        meta: {
          headerTitle: "Out",
          headerClassName: "px-2",
          cellClassName: "px-1 text-center bg-muted/40 font-medium",
        },
      },
      {
        id: "actions",
        size: 45,
        enableSorting: false,
        enableGlobalFilter: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <TerminalActions
            terminal={row.original}
            lanes={allPivot.outbound.get(row.id) || []}
            onPanel={openPanel}
            onExport={exportLanes}
          />
        ),
        meta: { cellClassName: "px-1 text-center", headerClassName: "px-1" },
      },
    ],
    [allPivot, filteredPivot, mode, mobile, exportLanes, loading, openPanel],
  );
  const matrixTable = useTable({
    features: dataGridFeatures,
    columns,
    data: freightTerminals,
    getRowId: (terminal) => terminal.id,
    manualPagination: true,
    state: {
      sorting,
      rowSelection: selection,
      columnVisibility: visibility,
      columnPinning: pinning,
      globalFilter: filteredPivot.outbound,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setSelection,
    onColumnVisibilityChange: setVisibility,
    onColumnPinningChange: setPinning,
    globalFilterFn: (row) => filteredPivot.outbound.has(row.id),
    autoResetPageIndex: false,
    enableColumnResizing: false,
  });
  const visibleDestinations = freightTerminals
    .filter((terminal) => matrixTable.getColumn(`to-${terminal.id}`)?.getIsVisible())
    .map((terminal) => terminal.id);
  const resetQuery = () => {
    setSearch("");
    setQuery(createFilterQuery());
    setBand("All Margins");
  };
  const clearVisibility = () => matrixTable.setColumnVisibility({});
  function commit(next: FreightBook, label: string) {
    setUndoBooks((previous) => [...previous.slice(-19), book]);
    setBook(next);
    toast.success(label, { description: "Saved in this local demo." });
  }
  function undo() {
    const previous = undoBooks.at(-1);
    if (!previous) return;
    setBook(previous);
    setUndoBooks((items) => items.slice(0, -1));
    toast("Last network change undone");
  }
  const searchControl = (
    <InputGroup className="h-8 w-56 bg-background">
      <InputGroupAddon>
        <Search className="size-4" />
      </InputGroupAddon>
      <InputGroupInput
        aria-label="Search terminals and shippers"
        placeholder="Terminal or shipper..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {search && (
        <InputGroupAddon align="inline-end">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => setSearch("")}
          >
            <X />
          </Button>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
  const footer = (
    <DataGridTableFootRow>
      {matrixTable.getVisibleLeafColumns().map((column) => (
        <DataGridTableFootRowCell
          key={column.id}
          className={cn(
            "h-[26px] px-1 py-0 text-center text-xs font-normal bg-background",
            column.id === "origin" && "sticky start-[49px] z-30 text-left px-2",
            column.id === "select" && "sticky start-0 z-30 pl-4",
          )}
        >
          {column.id === "origin" ? (
            <span className="whitespace-nowrap">
              <ArrowDownLeft className="inline size-3" /> Inbound
            </span>
          ) : column.id.startsWith("to-") ? (
            (() => {
              const summary = freightTotals(filteredPivot.inbound.get(column.id.slice(3)) || []);
              return mode === "loads"
                ? summary.loads || "—"
                : freightMoney(summary.profitCents, true);
            })()
          ) : column.id === "out" ? (
            mode === "loads" ? (
              totals.loads.toLocaleString("en-GB")
            ) : (
              freightMoney(totals.profitCents, true)
            )
          ) : null}
        </DataGridTableFootRowCell>
      ))}
    </DataGridTableFootRow>
  );
  return (
    <Frame
      dense
      ref={gridRef}
      className="freight-grid mx-auto w-full min-w-0 max-w-[1216px] text-sm"
      role="region"
      aria-label="Freight & Cargo Services"
      data-density={roomy ? "comfortable" : "compact"}
    >
      {loadError && (
        <Alert variant="destructive" className="m-4 w-auto">
          <AlertDescription>{loadError}</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => setReload((value) => value + 1)}>
              Retry network
            </Button>
          </AlertAction>
        </Alert>
      )}
      <FrameHeader className="flex-row items-center justify-between gap-3 px-4 py-2">
        <div className="min-w-0">
          <FrameTitle>Freight &amp; Cargo Services</FrameTitle>
          <FrameDescription className="mt-px text-xs">
            4 weeks to Oct 16 <span className="mx-1 text-muted-foreground/40">•</span> 12 terminals{" "}
            <span className="mx-1 text-muted-foreground/40">•</span> {activeLanes.length} lanes
          </FrameDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {undoBooks.length > 0 && (
            <IconHint label="Undo last change">
              <Button
                aria-label="Undo last change"
                disabled={loading}
                variant="outline"
                size="icon-sm"
                className="h-8 w-8"
                onClick={undo}
              >
                <Undo2 />
              </Button>
            </IconHint>
          )}
          <Button
            size="sm"
            aria-label="Add Route"
            disabled={loading}
            className="size-8 p-0 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5"
            onClick={() => openPanel({ kind: "editor" })}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add Route</span>
          </Button>
        </div>
      </FrameHeader>
      <FramePanel className="min-w-0 p-0! shadow-none">
        <div className="flex min-h-12 min-w-0 items-center gap-2 border-b px-4 py-2">
          {selectedIds.length ? (
            <>
              <div
                role="status"
                className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 text-xs"
              >
                <span className="font-medium">
                  {selectedIds.length} origin{selectedIds.length === 1 ? "" : "s"} selected
                </span>
                <span className="text-muted-foreground">
                  {selectedTotals.lanes} lanes · {freightMoney(selectedTotals.profitCents, true)}{" "}
                  profit per week
                </span>
              </div>
              <IconHint label="Export selected origins">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Export selected origins"
                  onClick={() => exportLanes(selectedLanes)}
                >
                  <Download />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </IconHint>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openPanel({
                    kind: "reprice",
                    laneIds: selectedLanes.map((lane) => lane.id),
                    label: `Outbound lanes from ${selectedIds.length} selected origin${selectedIds.length === 1 ? "" : "s"}`,
                  })
                }
              >
                <RotateCcw />
                <span className="hidden sm:inline">Reprice</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => matrixTable.setRowSelection({})}>
                Clear
              </Button>
            </>
          ) : (
            <>
              <div className="hidden sm:block">{searchControl}</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Search terminals and shippers"
                    className="size-8 sm:hidden"
                  >
                    <Search />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-2">
                  {searchControl}
                </PopoverContent>
              </Popover>
              <Filters
                fields={filterFields}
                query={query}
                onQueryChange={setQuery}
                variant="advanced"
                advancedMode="popover"
                size="sm"
                trigger={
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="Filter"
                    className="size-8 p-0 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5"
                  >
                    <Filter className="size-4" />
                    <span className="hidden sm:inline">Filter</span>
                  </Button>
                }
              />
              {isFiltered && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Clear filters"
                  onClick={resetQuery}
                >
                  <X />
                </Button>
              )}
              <div className="flex-1" />
              <ToggleGroup
                type="single"
                variant="outline"
                value={mode}
                onValueChange={(value) => value && setMode(value as "loads" | "profit")}
                className="gap-0"
              >
                <ToggleGroupItem value="loads" className="h-8 px-2 text-sm">
                  Loads
                </ToggleGroupItem>
                <ToggleGroupItem value="profit" className="h-8 px-2 text-sm">
                  Profit
                </ToggleGroupItem>
              </ToggleGroup>
              <Cascader
                items={destinationNodes}
                multiple
                cascade
                mode="tree"
                value={visibleDestinations}
                onValueChange={(values) => {
                  const wanted = new Set(values);
                  matrixTable.setColumnVisibility((current) => ({
                    ...current,
                    ...Object.fromEntries(
                      freightTerminals.map((terminal) => [
                        `to-${terminal.id}`,
                        wanted.has(terminal.id),
                      ]),
                    ),
                  }));
                }}
                closeOnSelect={false}
                defaultExpanded={destinationNodes.map((node) => node.value)}
              >
                <CascaderTrigger
                  aria-label="Destination columns"
                  showIcon={false}
                  className="size-8! min-w-8 p-0"
                  render={<Button size="icon-sm" variant="outline" />}
                >
                  <Columns3 className="size-4" />
                </CascaderTrigger>
                <CascaderContent align="end" className="w-64">
                  <CascaderPanel>
                    <CascaderList maxHeight={420}>
                      <CascaderItems />
                    </CascaderList>
                  </CascaderPanel>
                </CascaderContent>
              </Cascader>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon-sm" className="size-8" aria-label="Settings">
                    <Settings className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 space-y-3 p-3.5">
                  <p className="text-xs font-medium">Appearance</p>
                  <Field orientation="horizontal" className="items-center justify-between gap-3">
                    <FieldLabel>Density</FieldLabel>
                    <Select
                      value={roomy ? "comfortable" : "compact"}
                      onValueChange={(value) => setRoomy(value === "comfortable")}
                    >
                      <SelectTrigger aria-label="Density" className="h-7 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field orientation="horizontal" className="items-center justify-between">
                    <FieldLabel htmlFor="freight-column-lines">Column lines</FieldLabel>
                    <Switch
                      id="freight-column-lines"
                      checked={columnLines}
                      onCheckedChange={setColumnLines}
                    />
                  </Field>
                  <FieldSeparator />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={visibleDestinations.length === freightTerminals.length}
                    onClick={clearVisibility}
                  >
                    Show All Columns
                  </Button>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
        <DataGrid
          table={matrixTable}
          recordCount={matrixTable.getFilteredRowModel().rows.length}
          isLoading={loading}
          loadingMode="spinner"
          emptyMessage="No lanes match this search or filter."
          tableLayout={{
            width: "fixed",
            dense: true,
            cellBorder: columnLines,
            rowBorder: true,
            headerBorder: true,
            headerBackground: false,
            columnsPinnable: true,
            // Reuse the official fixed-width/filler lane while resize handles
            // are disabled on the table. Hidden columns keep native pin offsets.
            columnsResizable: true,
          }}
          tableClassNames={{
            base: "text-sm",
            headerRow: "h-8",
            bodyRow: roomy ? "h-[49px]" : "h-[41px]",
            footer: "bg-background",
            edgeCell: "",
          }}
        >
          <DataGridContainer className="min-w-0 rounded-none border-x-0 border-t-0 border-b">
            <DataGridScrollArea orientation="horizontal">
              <DataGridTable footerContent={footer} />
            </DataGridScrollArea>
          </DataGridContainer>
        </DataGrid>
        <FrameFooter className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-medium">{isFiltered ? "In view" : "Network"}</span>
            <span className="text-muted-foreground">
              {totals.loads.toLocaleString("en-GB")} loads{" "}
              <span className="text-muted-foreground/40">•</span> {marginText(totals.margin)} margin{" "}
              <span className="text-muted-foreground/40">•</span>
            </span>
            <span>{totals.losing} losing</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="freight-legend-backhaul" />
              Backhaul
            </span>
            <div className="hidden sm:flex items-center overflow-hidden rounded-lg border">
              {freightBands.map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  aria-pressed={band === value}
                  className="h-7 gap-1.5 rounded-none border-r px-2 text-xs last:border-r-0"
                  onClick={() => setBand(band === value ? "All Margins" : value)}
                >
                  <span className="freight-band-dot" data-band={value} />
                  {value}
                </Button>
              ))}
            </div>
            <Select
              value={band}
              onValueChange={(value) => setBand(value as FreightBand | "All Margins")}
            >
              <SelectTrigger aria-label="Margin band" className="h-8 w-36 sm:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All Margins", ...freightBands].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FrameFooter>
      </FramePanel>
      <FreightPanels
        panel={panel}
        book={book}
        onClose={() => openPanel(null)}
        onPanel={openPanel}
        onCommit={commit}
        onReturnFocus={restorePanelFocus}
        onExport={exportLanes}
      />
    </Frame>
  );
}
