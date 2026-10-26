import { Alert, AlertAction, AlertDescription } from "@/components/reui/alert";
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
  functionalUpdate,
  useTable,
  type ColumnDef,
  type ExpandedState,
  type Row,
  type SortingState,
  type ColumnVisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  Columns3,
  Copy,
  Download,
  ListFilter,
  MoreVertical,
  Pencil,
  Plus,
  Redo2,
  Search,
  SlidersHorizontal,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridCellsChangeDetails,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import {
  DataGridTable,
  DataGridTableFootRow,
  DataGridTableFootRowCell,
  DataGridTableRowExpand,
} from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridCellSelection } from "@/components/reui/data-grid/data-grid-cell-selection";
import { Filters } from "@/components/reui/filters/filters";
import { createFilterQuery } from "@/components/reui/filters/filters-query";
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import {
  computeHrMetric,
  createHrKpis,
  defaultMonth,
  defaultThresholds,
  formatHrValue,
  hrGroups,
  hrBookIssue,
  hrMonths,
  hrOwners,
  hrReducer,
  hrRows,
  hrStatus,
  hrSummary,
  hrUnits,
  initialHrStore,
  matchesHrQuery,
  monthLabel,
  newHrKpi,
  parseHrNumber,
  shiftHrMonth,
  type HrAction,
  type HrGroup,
  type HrKpi,
  type HrRow,
  type HrSummary,
  type HrThresholds,
} from "./grid-advanced-hr-data";
import { HrKpiEditor, HrNumber } from "./grid-advanced-hr-panels";
import "./grid-advanced-hr.css";

type NativeHrRow = Row<DataGridFeatures, HrRow>;
function nativeLeaves(rows: NativeHrRow[]): HrRow[] {
  return rows.flatMap((row) =>
    row.original.kind === "kpi" ? [row.original] : nativeLeaves(row.subRows),
  );
}
const viewColumns = [
  ["owner", "Owner"],
  ["unit", "Unit"],
  ["priorYear", "Prior Year"],
  ["priorMonth", "Prior Month"],
  ["variance", "Variance"],
  ["attainment", "Attainment"],
  ["vsPY", "vs PY"],
  ["trend", "Trend"],
];
const schema: FilterField[] = [
  {
    id: "group",
    label: "Group",
    type: "select",
    options: hrGroups.map((value) => ({ value, label: value })),
  },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: ["On Track", "Watch", "Off Track", "Pending"].map((value) => ({
      value,
      label: value,
    })),
  },
  {
    id: "owner",
    label: "Owner",
    type: "select",
    options: hrOwners.map((value) => ({ value, label: value })),
  },
  { id: "vsTarget", label: "vs Target", type: "number" },
  { id: "vsPY", label: "vs PY", type: "number" },
  {
    id: "unit",
    label: "Unit",
    type: "select",
    options: hrUnits.map((value) => ({ value, label: value })),
  },
  {
    id: "direction",
    label: "Direction",
    type: "select",
    options: [
      { value: "higher", label: "Higher is better" },
      { value: "lower", label: "Lower is better" },
    ],
  },
];

function HrIndex({ value, thresholds }: { value: number | null; thresholds: HrThresholds }) {
  return (
    <span
      className="hr-score-index tabular-nums"
      data-status={hrStatus(value, thresholds)}
      aria-label={
        value === null ? "Pending" : `${Math.round(value)}, ${hrStatus(value, thresholds)}`
      }
    >
      {value === null ? "—" : Math.round(value)}
    </span>
  );
}
function HrTrend({ row, month }: { row: HrRow; month: string }) {
  const maximum = Math.max(1, ...row.trend.flatMap((value) => value ?? []));
  const points = row.trend.map((value, index) => ({
    month: shiftHrMonth(month, index - 11),
    value,
  }));
  return (
    <ChartContainer
      config={{ value: { label: row.label, color: "currentColor" } }}
      className="hr-trend"
      initialDimension={{ width: 48, height: 18 }}
      data-status={row.status}
      role="img"
      aria-label={`12 month trend for ${row.label}: ${row.trend.map((value) => (value === null ? "unreported" : value)).join(", ")}`}
    >
      <BarChart
        accessibilityLayer={false}
        data={points}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        barCategoryGap={2}
      >
        <XAxis hide dataKey="month" />
        <YAxis hide domain={[0, maximum]} />
        <Bar dataKey="value" barSize={2} fill="var(--color-value)" isAnimationActive={false}>
          {points.map((point) => {
            const priorYear = point.month.slice(0, 4) !== month.slice(0, 4);
            return (
              <Cell
                key={point.month}
                fill={priorYear ? "var(--muted-foreground)" : "var(--color-value)"}
                fillOpacity={priorYear ? 0.4 : 1}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
function HrInlineChoice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        className="w-full gap-1 border-0 bg-transparent p-0 text-xs font-normal shadow-none data-[size=sm]:h-6 [&>svg]:size-3"
        aria-label={`${label}: ${value}`}
        data-cell-interactive=""
      >
        <SelectValue className="truncate" />
      </SelectTrigger>
      <SelectContent className="max-h-80 w-48">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export interface HRScorecardProps {
  loadKpis?: (signal: AbortSignal) => Promise<HrKpi[]>;
}
export default function HRScorecard({ loadKpis }: HRScorecardProps = {}) {
  const [store, dispatch] = useReducer(hrReducer, undefined, initialHrStore);
  const [month, setMonth] = useState(defaultMonth);
  const [ytd, setYtd] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [visibility, setVisibility] = useState<ColumnVisibilityState>({ scope: false });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editor, setEditor] = useState<{ kpi: HrKpi; creating: boolean } | null>(null);
  const [removing, setRemoving] = useState<HrKpi | null>(null);
  const [loading, setLoading] = useState(!!loadKpis);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [thresholdError, setThresholdError] = useState("");
  const mobile = useIsMobile(640);
  const searchRef = useRef<HTMLInputElement>(null);
  const data = useMemo(
    () => hrRows(store.records, month, ytd, store.thresholds),
    [store.records, month, ytd, store.thresholds],
  );
  const wholeSummary = hrSummary(data);
  const turnover = store.records.find((kpi) => kpi.id === "HR-106");
  const turnoverMetric = turnover ? computeHrMetric(turnover, month, ytd, store.thresholds) : null;

  useEffect(() => {
    if (!loadKpis) return;
    const controller = new AbortController();
    void Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return null;
        setLoading(true);
        setError("");
        return loadKpis(controller.signal);
      })
      .then((records) => {
        if (records && !controller.signal.aborted) {
          const issue = hrBookIssue(records);
          if (issue) throw new Error(issue);
          dispatch({ type: "load", records });
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error ? reason.message : "HR measurements could not be loaded.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadKpis, retry]);

  const undo = useCallback(() => {
    dispatch({ type: "undo" });
    toast.dismiss("hr-scorecard-change");
  }, []);
  const commit = useCallback(
    (action: HrAction, message: string) => {
      dispatch(action);
      toast.success(message, {
        id: "hr-scorecard-change",
        action: { label: "Undo", onClick: undo },
      });
    },
    [undo],
  );
  const addKpi = useCallback(
    (group?: HrGroup) => {
      const kpi = newHrKpi(`HR-${crypto.randomUUID().slice(0, 8)}`, group);
      kpi.series = { [month]: { target: 0, actual: null } };
      setEditor({ kpi, creating: true });
    },
    [month],
  );
  const resetKpi = useCallback(
    (kpi: HrKpi) => {
      const original = createHrKpis().find((item) => item.id === kpi.id);
      if (original) commit({ type: "put", kpi: original }, "KPI reset");
    },
    [commit],
  );
  const copyRows = useCallback((rows: HrRow[]) => {
    const content = [
      ["KPI", "Unit", "Target", "Actual", "vs Target"],
      ...rows.map((row) => [
        row.label,
        row.unit,
        row.target ?? "",
        row.actual ?? "",
        row.vsTarget === null ? "" : Math.round(row.vsTarget),
      ]),
    ]
      .map((row) => row.join("\t"))
      .join("\n");
    void navigator.clipboard
      .writeText(content)
      .then(() => toast.success("KPI values copied"))
      .catch(() => toast.error("Clipboard unavailable"));
  }, []);
  function changeThreshold(key: keyof HrThresholds, value: number | null) {
    if (value === null) return;
    const next = { ...store.thresholds, [key]: value };
    if (next.watch > next.onTrack || next.hrStaff < 1) {
      setThresholdError("On Track must be at least Watch, and HR staff must be at least 1.");
      return;
    }
    setThresholdError("");
    dispatch({ type: "thresholds", value: next });
  }

  const periodMenu = useMemo(
    () => (
      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger
          size="sm"
          aria-label="Scorecard month"
          className="mx-auto w-auto gap-1 border-0 bg-transparent p-0 text-xs font-semibold shadow-none data-[size=sm]:h-6 [&>svg]:opacity-40 hover:[&>svg]:opacity-100"
        >
          <SelectValue>{ytd ? `Jan → ${monthLabel(month)}` : monthLabel(month)}</SelectValue>
        </SelectTrigger>
        <SelectContent className="w-36">
          <SelectGroup>
            {hrMonths.map((value) => (
              <SelectItem key={value} value={value}>
                {monthLabel(value)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    ),
    [month, ytd],
  );

  const columns = useMemo<ColumnDef<DataGridFeatures, HrRow>[]>(() => {
    const meta = {
      headerClassName: "h-[30px] px-2 py-0 text-xs font-medium",
      cellClassName: "h-7 px-2 py-0 text-xs",
    };
    const groupMeta = {
      ...meta,
      headerClassName: "h-7 px-2 py-0 text-xs font-medium",
    };
    const aggregate = (row: NativeHrRow, field: "vsPY" | "vsTarget") => {
      const summary = hrSummary(nativeLeaves(row.subRows));
      return field === "vsPY" ? summary.priorIndex : summary.index;
    };
    const numeric = (
      id: "priorYear" | "priorMonth" | "target" | "actual" | "variance" | "attainment",
      title: string,
      size: number,
    ): ColumnDef<DataGridFeatures, HrRow> => ({
      id,
      accessorKey: id,
      header: title,
      size,
      enableSorting: false,
      meta: {
        ...meta,
        headerTitle: title,
        cellClassName: `${meta.cellClassName} text-right tabular-nums`,
        ...(["target", "actual"].includes(id)
          ? {
              cellEdit: {
                control: "text" as const,
                editable: (row: HrRow) => !ytd && row.kind === "kpi",
                parse: parseHrNumber,
                format: (value: unknown) => (value === null ? "" : String(value)),
                clearValue: null,
              },
            }
          : {}),
      },
      cell: ({ row }) =>
        row.original.kind === "group" ? null : (
          <span
            className={cn(
              ["target", "actual"].includes(id) && !ytd && "text-blue-600 dark:text-blue-400",
            )}
            title={ytd && ["target", "actual"].includes(id) ? "Month only editing" : undefined}
          >
            {id === "variance" && row.original.variance !== null && row.original.variance > 0
              ? "+"
              : ""}
            {formatHrValue(row.original[id], row.original.unit, id === "attainment")}
          </span>
        ),
    });
    return [
      {
        id: "expand",
        header: "",
        size: 28,
        enableHiding: false,
        enableResizing: false,
        enableSorting: false,
        meta: { ...meta, cellClassName: "h-7 p-0 text-center", headerClassName: "h-[30px] p-0" },
        cell: ({ row }) =>
          row.original.kind === "group" ? (
            <span data-cell-interactive="">
              <DataGridTableRowExpand row={row} indent={0} />
            </span>
          ) : null,
      },
      {
        id: "label",
        accessorKey: "label",
        header: "KPI",
        size: mobile ? 160 : 229,
        enableHiding: false,
        enableResizing: false,
        enableSorting: false,
        meta,
        cell: ({ row }) =>
          row.original.kind === "group" ? (
            <div className="flex items-center gap-1.5">
              <strong className="text-xs font-medium uppercase">{row.original.label}</strong>
              <span className="text-[11px] text-muted-foreground">
                {nativeLeaves(row.subRows).length} KPIs
              </span>
              <Button
                size="icon-sm"
                variant="ghost"
                className="size-5"
                aria-label={`Add KPI to ${row.original.group}`}
                data-cell-interactive=""
                onClick={() => addKpi(row.original.group)}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          ) : (
            <button
              className="flex w-full items-center gap-1 overflow-hidden pl-2 text-left"
              type="button"
              data-cell-interactive=""
              title={row.original.kpi?.description}
              onClick={() => setEditor({ kpi: row.original.kpi!, creating: false })}
            >
              <span className="truncate">{row.original.label}</span>
              {row.original.direction === "lower" ? (
                <ArrowDown className="size-3 shrink-0 text-muted-foreground/50" />
              ) : (
                <ArrowUp className="size-3 shrink-0 text-muted-foreground/50" />
              )}
            </button>
          ),
      },
      {
        id: "owner",
        accessorKey: "owner",
        header: "Owner",
        size: 96,
        enableSorting: false,
        meta,
        cell: ({ row }) =>
          row.original.kpi ? (
            <HrInlineChoice
              label={`Owner of ${row.original.label}`}
              value={row.original.owner}
              options={hrOwners}
              onChange={(value) =>
                commit(
                  { type: "put", kpi: { ...row.original.kpi!, owner: value } },
                  "Owner updated",
                )
              }
            />
          ) : null,
      },
      {
        id: "unit",
        accessorKey: "unit",
        header: "Unit",
        size: 84,
        enableSorting: false,
        meta,
        cell: ({ row }) =>
          row.original.kpi ? (
            <HrInlineChoice
              label={`Unit of ${row.original.label}`}
              value={row.original.unit}
              options={hrUnits}
              onChange={(value) =>
                commit(
                  { type: "put", kpi: { ...row.original.kpi!, unit: value as HrKpi["unit"] } },
                  "Unit updated",
                )
              }
            />
          ) : null,
      },
      {
        id: "period",
        header: () => periodMenu,
        meta: {
          ...groupMeta,
          headerClassName: "h-7 px-0 py-0 text-xs font-medium",
        },
        columns: [
          numeric("priorYear", "Prior Year", 76),
          numeric("priorMonth", "Prior Month", 88),
          numeric("target", "Target", 76),
          numeric("actual", "Actual", 76),
          numeric("variance", "Variance", 76),
          numeric("attainment", "Attainment", 84),
        ],
      },
      {
        id: "score",
        header: () => <span className="block truncate text-center font-semibold">Score</span>,
        meta: groupMeta,
        columns: (["vsPY", "vsTarget"] as const).map((id) => ({
          id,
          accessorKey: id,
          header: id === "vsPY" ? "vs PY" : "vs Target",
          size: id === "vsPY" ? 60 : 72,
          enableSorting: false,
          enableHiding: id === "vsPY",
          meta: { ...meta, cellClassName: "h-7 px-2 py-0 text-xs" },
          cell: ({ row }: { row: NativeHrRow }) => (
            <HrIndex
              value={row.original.kind === "group" ? aggregate(row, id) : row.original[id]}
              thresholds={store.thresholds}
            />
          ),
        })),
      },
      {
        id: "trend",
        header: "12 Month Trend",
        size: 141,
        enableSorting: false,
        meta,
        cell: ({ row }) =>
          row.original.kind === "group" ? (
            <span className="block text-center text-muted-foreground">
              {hrSummary(nativeLeaves(row.subRows)).onTrack}/{nativeLeaves(row.subRows).length}
            </span>
          ) : (
            <HrTrend row={row.original} month={month} />
          ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        size: 28,
        enableHiding: false,
        enableSorting: false,
        enableResizing: false,
        meta: { ...meta, cellClassName: "h-7 p-0 text-center" },
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-6"
                aria-label={`Actions for ${row.original.label}`}
                data-cell-interactive=""
              >
                <MoreVertical className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {row.original.kind === "group" ? (
                <>
                  <DropdownMenuItem onSelect={() => addKpi(row.original.group)}>
                    <Plus />
                    Add KPI
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => row.toggleExpanded()}>
                    {row.getIsExpanded() ? "Collapse" : "Expand"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => copyRows(nativeLeaves(row.subRows))}>
                    <Copy />
                    Copy Values
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    onSelect={() => setEditor({ kpi: row.original.kpi!, creating: false })}
                  >
                    <Pencil />
                    Edit KPI
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      commit(
                        {
                          type: "put",
                          kpi: {
                            ...structuredClone(row.original.kpi!),
                            id: `HR-${crypto.randomUUID().slice(0, 8)}`,
                            label: `${row.original.label} (copy)`,
                          },
                        },
                        "KPI duplicated",
                      )
                    }
                  >
                    <Copy />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => copyRows([row.original])}>
                    Copy Values
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!createHrKpis().some((item) => item.id === row.id)}
                    onSelect={() => resetKpi(row.original.kpi!)}
                  >
                    Reset KPI
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setRemoving(row.original.kpi!)}
                  >
                    <Trash2 />
                    Remove KPI
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      {
        id: "scope",
        accessorFn: () => true,
        enableSorting: false,
        enableHiding: false,
        filterFn: (row, _id, value: { search: string; query: FilterQuery }) =>
          row.original.kind === "kpi" &&
          [row.original.label, row.original.owner, row.original.group]
            .join(" ")
            .toLowerCase()
            .includes(value.search.trim().toLowerCase()) &&
          matchesHrQuery(row.original, value.query),
      },
    ];
  }, [mobile, month, ytd, store.thresholds, periodMenu, addKpi, commit, copyRows, resetKpi]);
  const nativeFilters = useMemo(() => [{ id: "scope", value: { search, query } }], [search, query]);
  const table = useTable({
    features: dataGridFeatures,
    data,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.children,
    state: {
      expanded,
      columnVisibility: visibility,
      columnPinning: { start: ["expand", "label"], end: [] },
      sorting,
      columnFilters: nativeFilters,
    },
    onExpandedChange: (updater) => setExpanded((previous) => functionalUpdate(updater, previous)),
    onColumnVisibilityChange: (updater) =>
      setVisibility((previous) => ({ ...functionalUpdate(updater, previous), scope: false })),
    onSortingChange: (updater) => setSorting((previous) => functionalUpdate(updater, previous)),
    enableExpanding: true,
    filterFromLeafRows: true,
    manualPagination: true,
    autoResetExpanded: false,
    enableRowSelection: false,
  });
  const filteredLeaves = nativeLeaves(table.getFilteredRowModel().rows);
  const filteredSummary = hrSummary(filteredLeaves);
  const orderedColumns = [
    ...table.getStartVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getEndVisibleLeafColumns(),
  ];

  function onCellsChange(details: DataGridCellsChangeDetails<HrRow>) {
    if (ytd) {
      toast.error("Switch to Month to edit measurements");
      return;
    }
    const changes = details.changes.flatMap((change) =>
      change.row.kind === "kpi" &&
      ["target", "actual"].includes(change.columnId) &&
      (change.value === null ||
        (typeof change.value === "number" && Number.isFinite(change.value) && change.value >= 0))
        ? [
            {
              id: change.rowId,
              month,
              field: change.columnId as "target" | "actual",
              value: change.value as number | null,
            },
          ]
        : [],
    );
    if (changes.length) dispatch({ type: "write", changes });
    if (details.rejected.length)
      toast.error(`${details.rejected.length} values rejected. Use non-negative numbers or blank.`);
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (
      (event.metaKey || event.ctrlKey) &&
      !event.altKey &&
      event.key.toLowerCase() === "z" &&
      !(event.target as HTMLElement).closest("input,textarea,[contenteditable=true]")
    ) {
      event.preventDefault();
      if (event.shiftKey) dispatch({ type: "redo" });
      else undo();
    }
    if (
      event.key === "/" &&
      !(event.target as HTMLElement).closest("input,textarea,[contenteditable=true]")
    ) {
      event.preventDefault();
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }
  function exportCsv() {
    const content = [
      ["KPI", "Group", "Owner", "Unit", "Target", "Actual", "vs Target"],
      ...filteredLeaves.map((row) => [
        row.label,
        row.group,
        row.owner,
        row.unit,
        row.target ?? "",
        row.actual ?? "",
        row.vsTarget === null ? "" : Math.round(row.vsTarget),
      ]),
    ]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bricklane-hr-${month}${ytd ? "-ytd" : ""}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  function summaryContent(id: string, summary: HrSummary) {
    if (id === "label")
      return (
        <span className="whitespace-nowrap">
          ALL KPIS{" "}
          <span className="font-normal text-muted-foreground">
            {summary.onTrack} of {summary.count} on track
          </span>
        </span>
      );
    if (id === "vsPY" || id === "vsTarget")
      return (
        <HrIndex
          value={id === "vsPY" ? summary.priorIndex : summary.index}
          thresholds={store.thresholds}
        />
      );
    if (id === "trend")
      return (
        <span className="block text-center">
          {summary.onTrack}/{summary.count}
        </span>
      );
    return null;
  }

  const viewMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <InputGroupButton size="icon-sm" variant="outline" aria-label="View">
          <Columns3 />
        </InputGroupButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Columns</DropdownMenuLabel>
        {viewColumns.map(([id, label]) => {
          const column = table.getColumn(id);
          if (!column) return null;
          return (
            <DropdownMenuCheckboxItem
              key={id}
              checked={column.getIsVisible()}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) => column.toggleVisibility(checked)}
            >
              {label}
            </DropdownMenuCheckboxItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setExpanded(true)}>Expand All</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setExpanded({})}>Collapse All</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            commit({ type: "reset" }, "Scorecard reset");
            setVisibility({ scope: false });
            setExpanded(true);
            setSearch("");
            setQuery(createFilterQuery());
          }}
        >
          Reset Scorecard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const thresholdMenu = (
    <Popover>
      <PopoverTrigger asChild>
        <InputGroupButton size="icon-sm" variant="outline" aria-label="Thresholds">
          <SlidersHorizontal />
        </InputGroupButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4 p-4 text-sm">
        <h3 className="font-semibold">Score thresholds</h3>
        <div className="grid grid-cols-2 gap-3">
          <HrNumber
            label="On Track ≥"
            value={store.thresholds.onTrack}
            max={200}
            onChange={(value) => changeThreshold("onTrack", value)}
          />
          <HrNumber
            label="Watch ≥"
            value={store.thresholds.watch}
            max={200}
            onChange={(value) => changeThreshold("watch", value)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Index 100 means level with the target. Scores respect each KPI’s direction.
        </p>
        <div className="border-t pt-4">
          <h3 className="mb-3 font-medium">Workforce baseline</h3>
          <div className="grid grid-cols-2 gap-3">
            <HrNumber
              label="Headcount"
              value={store.thresholds.headcount}
              onChange={(value) => changeThreshold("headcount", value)}
            />
            <HrNumber
              label="HR staff"
              value={store.thresholds.hrStaff}
              min={1}
              onChange={(value) => changeThreshold("hrStaff", value)}
            />
          </div>
        </div>
        {thresholdError && (
          <p role="alert" className="text-xs text-destructive">
            {thresholdError}
          </p>
        )}
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={JSON.stringify(store.thresholds) === JSON.stringify(defaultThresholds)}
          onClick={() => {
            setThresholdError("");
            dispatch({ type: "thresholds", value: { ...defaultThresholds } });
          }}
        >
          Reset Thresholds
        </Button>
      </PopoverContent>
    </Popover>
  );

  return (
    <Frame
      dense
      className="hr-scorecard mx-auto w-full min-w-0 max-w-[1216px] text-sm"
      aria-label="HR Scorecard data grid"
      onKeyDownCapture={keyboard}
    >
      <FrameHeader className="hr-scorecard-heading flex-row flex-wrap items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-2">
          <FrameTitle>
            <h2>HR Scorecard</h2>
          </FrameTitle>
          <span className="hidden text-muted-foreground/40 sm:inline">•</span>
          <FrameDescription className="hidden text-xs sm:block">
            {ytd ? `Jan → ${monthLabel(month)}` : monthLabel(month)}, vs{" "}
            {ytd ? Number(month.slice(0, 4)) - 1 : monthLabel(shiftHrMonth(month, -12))}
          </FrameDescription>
        </div>
        <div className="hr-scorecard-actions">
          <ButtonGroup className="hr-scorecard-tools" aria-label="Search and scorecard tools">
            <InputGroup className="hr-scorecard-search">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                ref={searchRef}
                aria-label="Search KPIs"
                aria-keyshortcuts="/"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setExpanded(true);
                }}
                placeholder="Search KPIs"
              />
              <InputGroupAddon align="inline-end">
                <Kbd aria-hidden="true">/</Kbd>
              </InputGroupAddon>
            </InputGroup>
            <Filters
              fields={schema}
              query={query}
              onQueryChange={(value) => {
                setQuery(value);
                setExpanded(true);
              }}
              variant="advanced"
              advancedMode="popover"
              advancedAlign="end"
              showClear
              trigger={
                <InputGroupButton size="icon-sm" variant="outline" aria-label="Filter">
                  <ListFilter />
                </InputGroupButton>
              }
            />
            {thresholdMenu}
            {viewMenu}
            <InputGroupButton
              size="icon-sm"
              variant="outline"
              aria-label="Export CSV"
              onClick={exportCsv}
            >
              <Download />
            </InputGroupButton>
          </ButtonGroup>
          <div className="hr-scorecard-period-actions">
            <ToggleGroup
              spacing={0}
              type="single"
              variant="outline"
              value={ytd ? "YTD" : "Month"}
              onValueChange={(value) => {
                if (value) setYtd(value === "YTD");
              }}
              aria-label="Scorecard period"
            >
              <ToggleGroupItem value="Month" className="h-8 px-2 text-sm">
                Month
              </ToggleGroupItem>
              <ToggleGroupItem value="YTD" className="h-8 px-2 text-sm">
                YTD
              </ToggleGroupItem>
            </ToggleGroup>
            <Button size="sm" className="h-8" aria-label="Add KPI" onClick={() => addKpi()}>
              <Plus />
              <span className="hidden sm:inline">Add KPI</span>
            </Button>
          </div>
        </div>
      </FrameHeader>
      <FramePanel className="overflow-hidden p-0 shadow-none">
        <div className="hr-scorecard-summary" aria-label="Whole scorecard summary">
          <div>
            <span>Index vs Target</span>
            <p>
              <strong>{wholeSummary.index === null ? "—" : Math.round(wholeSummary.index)}</strong>
              <small>
                {wholeSummary.onTrack} of {wholeSummary.count} on track
              </small>
            </p>
          </div>
          <div>
            <span>Voluntary Attrition</span>
            <p>
              <strong>{formatHrValue(turnoverMetric?.actual ?? null, "Percent")}</strong>
              <small>Target {formatHrValue(turnoverMetric?.target ?? null, "Percent")}</small>
            </p>
          </div>
          <div>
            <span>Headcount, {monthLabel(month).split(" ")[0]}</span>
            <p>
              <strong>{store.thresholds.headcount.toLocaleString()}</strong>
              <small>
                {Math.round(store.thresholds.headcount / store.thresholds.hrStaff)} per HR FTE
              </small>
            </p>
          </div>
          <div>
            <span>KPI Status</span>
            <p className="flex-wrap">
              <Badge
                variant="outline"
                className="gap-1.5 border-0 px-0 font-normal text-muted-foreground"
              >
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <b className="text-base font-semibold text-foreground">{wholeSummary.onTrack}</b> On
                Track
              </Badge>
              <Badge
                variant="outline"
                className="gap-1.5 border-0 px-0 font-normal text-muted-foreground"
              >
                <span className="size-1.5 rounded-full bg-amber-500" />
                <b className="text-base font-semibold text-foreground">{wholeSummary.watch}</b>{" "}
                Watch
              </Badge>
              <Badge
                variant="outline"
                className="gap-1.5 border-0 px-0 font-normal text-muted-foreground"
              >
                <span className="size-1.5 rounded-full bg-destructive" />
                <b className="text-base font-semibold text-foreground">
                  {wholeSummary.offTrack}
                </b>{" "}
                Off Track
              </Badge>
              {wholeSummary.pending > 0 && (
                <Badge variant="outline">{wholeSummary.pending} Pending</Badge>
              )}
            </p>
          </div>
        </div>
        {error && (
          <Alert variant="destructive" className="m-4 w-auto">
            <AlertDescription>{error}</AlertDescription>
            <AlertAction>
              <Button size="sm" variant="outline" onClick={() => setRetry((value) => value + 1)}>
                Retry
              </Button>
            </AlertAction>
          </Alert>
        )}
        <DataGrid
          table={table}
          recordCount={filteredLeaves.length}
          isLoading={loading}
          onCellsChange={onCellsChange}
          tableLayout={{
            dense: true,
            width: "fixed",
            cellBorder: true,
            rowBorder: true,
            headerBorder: true,
            headerBackground: true,
            footerBackground: true,
            headerSticky: true,
            columnsPinnable: true,
            columnsResizable: true,
            cellSelection: true,
            cellEditMode: "dblclick",
            cellEditEnterAdvance: true,
          }}
          tableClassNames={{
            base: "text-xs",
            bodyRow: "h-7",
            footer: "hr-scorecard-footer",
          }}
          emptyMessage={
            <div className="space-y-2 py-8">
              <h3 className="font-medium">No Matching KPIs</h3>
              <p>Try another name, owner or filter.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setQuery(createFilterQuery());
                }}
              >
                Clear Filters
              </Button>
            </div>
          }
        >
          <DataGridContainer className="min-w-0 rounded-none border-0">
            <DataGridScrollArea orientation="both" className="hr-scorecard-scroll">
              <DataGridTable
                footerContent={
                  <DataGridTableFootRow>
                    {orderedColumns.map((column) => (
                      <DataGridTableFootRowCell
                        key={column.id}
                        className={cn(
                          "h-7 px-2 py-0 text-xs",
                          column.id === "expand" && "hr-footer-expand",
                          column.id === "label" && "hr-footer-label",
                        )}
                      >
                        {summaryContent(column.id, filteredSummary)}
                      </DataGridTableFootRowCell>
                    ))}
                  </DataGridTableFootRow>
                }
              />
            </DataGridScrollArea>
            <DataGridCellSelection />
          </DataGridContainer>
        </DataGrid>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
          <span>
            <span className="text-blue-600">Blue figures</span> are inputs. Double-click to edit,
            paste a range, Ctrl Z to undo.{ytd && " Month only editing."}
          </span>
          <span>
            Index 100 is level. On track from {store.thresholds.onTrack}, watch from{" "}
            {store.thresholds.watch}.
          </span>
        </div>
        {(store.history.length > 0 || store.future.length > 0) && (
          <div className="flex items-center justify-end gap-2 border-t px-3 py-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              disabled={!store.history.length}
              onClick={undo}
            >
              <Undo2 />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              disabled={!store.future.length}
              onClick={() => dispatch({ type: "redo" })}
            >
              <Redo2 />
              Redo
            </Button>
          </div>
        )}
        {loadKpis && (
          <div className="flex justify-end border-t px-3 py-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => setRetry((value) => value + 1)}
            >
              Refresh measurements
            </Button>
          </div>
        )}
      </FramePanel>
      {editor && (
        <HrKpiEditor
          key={editor.kpi.id}
          kpi={editor.kpi}
          month={month}
          creating={editor.creating}
          onClose={() => setEditor(null)}
          onSave={(kpi) => {
            commit({ type: "put", kpi }, editor.creating ? "KPI added" : "KPI updated");
            setEditor(null);
            setExpanded(true);
          }}
        />
      )}
      <AlertDialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes its definition and monthly measurements from this local scorecard. Undo
              can restore it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removing) commit({ type: "remove", id: removing.id }, "KPI removed");
                setRemoving(null);
              }}
            >
              Remove KPI
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Frame>
  );
}
