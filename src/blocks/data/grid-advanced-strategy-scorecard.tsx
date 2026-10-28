"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  functionalUpdate,
  useTable,
  type ColumnDef,
  type ColumnVisibilityState,
  type ExpandedState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  Columns3,
  Download,
  EllipsisVertical,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridCellsChangeDetails,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridCellSelection } from "@/components/reui/data-grid/data-grid-cell-selection";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import {
  DataGridTable,
  DataGridTableFootRow,
  DataGridTableFootRowCell,
  DataGridTableRowExpand,
} from "@/components/reui/data-grid/data-grid-table";
import { Filters, type FilterField, type FilterQuery } from "@/components/reui/filters/filters";
import { Frame, FrameDescription, FrameHeader, FrameTitle } from "@/components/reui/frame";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Slider } from "@/components/ui/slider";
import {
  DEFAULT_MONTH_INDEX,
  MONTHS,
  OWNERS,
  createInitialScorecard,
  type Kpi,
  type ScorecardRow,
  type ScorecardState,
  type ScoreStatus,
} from "./grid-advanced-strategy-scorecard-data";
import {
  addKpi,
  buildScorecardRows,
  computeScorecard,
  formatDelta,
  formatValue,
  matchesScorecardQuery,
  parseActual,
  removeKpi,
  updateKpi,
  writeCompanyActual,
  writeKpiWeight,
} from "./grid-advanced-strategy-scorecard-model";
import {
  ScorecardChangeCell,
  ScorecardPerspectiveRail,
  ScorecardProgressCell,
  type ScorecardCellStatus,
} from "./grid-advanced-strategy-scorecard-cells";
import { ScorecardDetails, ScorecardKpiEditor } from "./grid-advanced-strategy-scorecard-panels";
import "./grid-advanced-strategy-scorecard.css";

// This is an independent Bricklane composition of the existing MIT ReUI free
// DataGrid, Filters, Frame and input primitives. The market observations and
// aggregation rules belong to the original demo contract in the data module.
// Public reference: https://reui.io/blocks/data-grid/advanced/data-grid-advanced-14

const cellStatus: Record<ScoreStatus, ScorecardCellStatus> = {
  "on-track": "track",
  watch: "watch",
  "off-track": "off",
  "not-scored": "unscored",
};
const statusLabels: Record<ScoreStatus, string> = {
  "on-track": "On Track",
  watch: "Watch",
  "off-track": "Off Track",
  "not-scored": "Not scored",
};
const emptyQuery = (): FilterQuery => ({
  id: "strategy-query",
  type: "group",
  combinator: "and",
  rules: [],
});

type History = { past: ScorecardState[]; present: ScorecardState; future: ScorecardState[] };
type Editor = { initial: Kpi | null; objectiveId: string };

function useCompactScorecard() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return compact;
}

function numberText(value: number | null): string {
  return value === null ? "–" : `${Math.round(value)}%`;
}

function laggingMarket(row: ScorecardRow) {
  return row.markets.reduce<ScorecardRow["markets"][number] | null>(
    (lowest, market) =>
      market.score !== null && (lowest === null || market.score < lowest.score!) ? market : lowest,
    null,
  );
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  // Spreadsheet-safe text export. Numeric observations remain numbers.
  const safe = typeof value === "number" || !/^[=+@\-\t\r]/.test(text) ? text : `'${text}`;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function StrategyScorecard() {
  const compact = useCompactScorecard();
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    present: createInitialScorecard(),
    future: [],
  }));
  const state = history.present;
  const [monthIndex, setMonthIndex] = useState(DEFAULT_MONTH_INDEX);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(emptyQuery);
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [visibility, setVisibility] = useState<ColumnVisibilityState>({});
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const scorecard = useMemo(() => computeScorecard(state, monthIndex), [state, monthIndex]);
  const data = useMemo(
    () => buildScorecardRows(state, monthIndex, compact),
    [state, monthIndex, compact],
  );
  const nativeExpanded = useMemo(
    () =>
      expanded === true || !compact
        ? expanded
        : {
            ...Object.fromEntries(state.perspectives.map((item) => [item.id, true])),
            ...expanded,
          },
    [expanded, compact, state.perspectives],
  );
  const month = MONTHS[monthIndex];
  const previousMonth = monthIndex > 0 ? MONTHS[monthIndex - 1].shortLabel : "baseline";

  const commit = useCallback((write: (current: ScorecardState) => ScorecardState) => {
    setHistory((current) => {
      const next = write(current.present);
      if (next === current.present) return current;
      return { past: [...current.past.slice(-49), current.present], present: next, future: [] };
    });
  }, []);
  const undo = useCallback(
    () =>
      setHistory((current) => {
        const last = current.past.at(-1);
        return last
          ? {
              past: current.past.slice(0, -1),
              present: last,
              future: [current.present, ...current.future],
            }
          : current;
      }),
    [],
  );
  const redo = useCallback(
    () =>
      setHistory((current) => {
        const next = current.future[0];
        return next
          ? {
              past: [...current.past, current.present],
              present: next,
              future: current.future.slice(1),
            }
          : current;
      }),
    [],
  );

  const fields = useMemo<FilterField[]>(
    () => [
      {
        id: "perspective",
        label: "Perspective",
        type: "select",
        options: state.perspectives.map((item) => ({ value: item.id, label: item.title })),
      },
      {
        id: "status",
        label: "Status",
        type: "select",
        options: Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
      },
      {
        id: "owner",
        label: "Owner",
        type: "select",
        options: OWNERS.map((item) => ({ value: item.id, label: item.name })),
      },
      { id: "progress", label: "Progress", type: "number" },
      {
        id: "direction",
        label: "Direction",
        type: "select",
        options: [
          { value: "higher", label: "Higher is better" },
          { value: "lower", label: "Lower is better" },
        ],
      },
    ],
    [state.perspectives],
  );

  const columns = useMemo<ColumnDef<DataGridFeatures, ScorecardRow>[]>(() => {
    const metric = (
      id: "baseline" | "value" | "target" | "toGo",
      title: string,
      width: number,
    ): ColumnDef<DataGridFeatures, ScorecardRow> => ({
      id,
      header: title,
      accessorFn: (row) => row[id],
      size: width,
      minSize: width,
      enableResizing: false,
      meta: {
        headerTitle: title,
        headerClassName: "ss14-number-heading",
        cellClassName: `ss14-number-cell ${id === "value" ? "ss14-input-cell" : ""} ${id === "baseline" ? "ss14-baseline-cell" : ""}`,
        ...(id === "value"
          ? {
              cellEdit: {
                editable: (row: ScorecardRow) => row.kind === "kpi",
                control: "text" as const,
                parse: (text: string, row: ScorecardRow) => {
                  const parsed = parseActual(text, row.unit ?? undefined);
                  return parsed.ok ? parsed.value : undefined;
                },
                format: (value: unknown) => (value === null ? "" : String(value)),
                clearValue: null,
              },
            }
          : {}),
      },
      cell: ({ row }) =>
        row.original.kind === "kpi" && row.original.unit
          ? formatValue(row.original[id], row.original.unit)
          : null,
    });
    return [
      {
        id: "perspective",
        header: "Perspective",
        accessorFn: (row) => row.perspectiveTitle,
        size: 168,
        minSize: 168,
        enableHiding: false,
        enableResizing: false,
        meta: { cellClassName: "ss14-rail-cell" },
        cell: ({ row, table: native }) => {
          const rows = native
            .getRowModel()
            .rows.filter((item) => item.original.perspectiveId === row.original.perspectiveId);
          if (rows[0]?.id !== row.id) return null;
          const perspective = scorecard.perspectives.find(
            (item) => item.perspective.id === row.original.perspectiveId,
          );
          if (!perspective) return null;
          const objectives = native
            .getPreFilteredRowModel()
            .flatRows.filter(
              (item) =>
                item.original.kind === "objective" &&
                item.original.perspectiveId === row.original.perspectiveId,
            );
          const collapsed = objectives.every((item) => !item.getIsExpanded());
          return (
            <ScorecardPerspectiveRail
              title={perspective.perspective.title}
              score={perspective.score}
              status={cellStatus[perspective.status]}
              weight={perspective.perspective.weight}
              kpiCount={perspective.counts.total}
              offTrackCount={perspective.counts.offTrack}
              description={perspective.perspective.description}
              rowCount={rows.length}
              collapsed={collapsed}
              onToggle={() =>
                native.setExpanded((current) => {
                  const next: Record<string, boolean> =
                    current === true
                      ? Object.fromEntries(
                          native
                            .getPreFilteredRowModel()
                            .flatRows.filter((item) => item.getCanExpand())
                            .map((item) => [item.id, true]),
                        )
                      : { ...current };
                  for (const objective of objectives) next[objective.id] = collapsed;
                  return next;
                })
              }
            />
          );
        },
      },
      {
        id: "title",
        header: "Objective and KPI",
        accessorFn: (row) => row.title,
        size: compact ? 160 : 294,
        minSize: compact ? 160 : 294,
        enableHiding: false,
        enableResizing: false,
        meta: { cellClassName: "ss14-title-cell" },
        cell: ({ row }) => {
          const item = row.original;
          const Direction = item.direction === "lower" ? ArrowDown : ArrowUp;
          return (
            <div className="ss14-tree-label" data-kind={item.kind}>
              <DataGridTableRowExpand row={row} indent={compact ? 8 : 6} />
              {item.kind === "kpi" ? (
                <button
                  type="button"
                  className="ss14-kpi-link"
                  onClick={() => setDetailsId(item.kpiId)}
                >
                  {item.title}
                </button>
              ) : (
                <span className="ss14-group-title">{item.title}</span>
              )}
              {item.kind === "kpi" ? (
                <Direction
                  className="ss14-direction"
                  aria-label={item.direction === "lower" ? "Lower is better" : "Higher is better"}
                />
              ) : (
                <span className="ss14-group-count">{item.kpiCount}</span>
              )}
              {item.kind === "objective" && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="ss14-add-in-group"
                  aria-label={`Add KPI to ${item.title}`}
                  onClick={() => setEditor({ initial: null, objectiveId: item.objectiveId! })}
                >
                  <Plus />
                </Button>
              )}
            </div>
          );
        },
      },
      {
        id: "owner",
        header: "Owner",
        accessorFn: (row) => row.owner?.name ?? "",
        size: 96,
        minSize: 96,
        enableResizing: false,
        cell: ({ row }) =>
          row.original.kind === "kpi" ? (
            <Select
              value={row.original.owner?.id ?? "unassigned"}
              onValueChange={(ownerId) =>
                commit((current) =>
                  updateKpi(current, row.original.kpiId!, {
                    ownerId: ownerId === "unassigned" ? "" : ownerId,
                  }),
                )
              }
            >
              <SelectTrigger
                className="ss14-owner-trigger"
                aria-label={`Owner for ${row.original.title}`}
              >
                <SelectValue>
                  <Avatar className="ss14-owner-avatar" aria-hidden="true">
                    <AvatarFallback
                      className="ss14-owner-initials"
                      style={{
                        backgroundColor: row.original.owner?.color ?? "var(--muted)",
                        color: row.original.owner ? "white" : "var(--muted-foreground)",
                      }}
                    >
                      {row.original.owner?.initials ?? "–"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{row.original.owner?.name.split(" ")[0] ?? "–"}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {OWNERS.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null,
      },
      {
        id: "weight",
        header: "Weight",
        accessorFn: (row) => row.weight,
        size: 60,
        minSize: 60,
        enableResizing: false,
        meta: {
          headerClassName: "ss14-number-heading",
          cellClassName: "ss14-number-cell ss14-input-cell",
          cellEdit: {
            editable: (row) => row.kind === "kpi",
            control: "text",
            parse: (text) => {
              const parsed = parseActual(text.replace(/%$/, ""));
              return parsed.ok && parsed.value !== null && parsed.value >= 0 && parsed.value <= 100
                ? parsed.value
                : undefined;
            },
            format: (value) => String(value ?? ""),
            clearValue: 0,
          },
        },
        cell: ({ row }) =>
          row.original.kind === "kpi" ? (
            <span data-weight-warning={row.original.weightWarning || undefined}>
              {row.original.weight}%
            </span>
          ) : null,
      },
      metric("baseline", "Baseline", 72),
      metric("value", "Value", 76),
      metric("target", "Target", 72),
      metric("toGo", "To Go", 72),
      {
        id: "change",
        header: "Change",
        accessorFn: (row) => row.change,
        size: 96,
        minSize: 96,
        enableResizing: false,
        meta: { cellClassName: "ss14-change-td" },
        cell: ({ row }) =>
          row.original.kind === "kpi" ? (
            <ScorecardChangeCell
              values={row.original.months.slice(0, monthIndex + 1).map((item) => item.change)}
              change={row.original.change}
              label={`${row.original.title}, monthly progress change`}
            />
          ) : null,
      },
      {
        id: "lagging",
        header: "Lagging Market",
        accessorFn: (row) => laggingMarket(row)?.score ?? null,
        size: 108,
        minSize: 108,
        enableResizing: false,
        cell: ({ row }) => {
          if (row.original.kind !== "kpi") return null;
          const market = laggingMarket(row.original);
          return market ? (
            <button
              type="button"
              className="ss14-market-cell"
              onClick={() => setDetailsId(row.original.kpiId)}
              aria-label={`${market.market.name}, ${numberText(market.score)}, view ${row.original.title} details`}
            >
              <span>{market.market.code}</span>
              <ScorecardProgressCell score={market.score} status={cellStatus[market.status]} />
            </button>
          ) : (
            <span className="ss14-muted">–</span>
          );
        },
      },
      {
        id: "progress",
        header: "Progress",
        accessorFn: (row) => row.score,
        size: 72,
        minSize: 72,
        enableHiding: false,
        enableResizing: false,
        meta: {
          headerClassName: "ss14-number-heading",
          cellClassName: "ss14-number-cell ss14-progress-td",
        },
        cell: ({ row }) => (
          <ScorecardProgressCell
            score={row.original.score}
            status={cellStatus[row.original.status]}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        size: 28,
        minSize: 28,
        enableHiding: false,
        enableSorting: false,
        enableResizing: false,
        meta: { cellClassName: "ss14-actions-cell" },
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-xs"
                variant="ghost"
                className="ss14-row-menu"
                aria-label={`Actions for ${row.original.title}`}
              >
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{row.original.title}</DropdownMenuLabel>
              {row.original.kind === "kpi" ? (
                <>
                  <DropdownMenuItem onSelect={() => setDetailsId(row.original.kpiId)}>
                    View KPI
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      setEditor({
                        initial: state.kpis.find((item) => item.id === row.original.kpiId)!,
                        objectiveId: row.original.objectiveId!,
                      })
                    }
                  >
                    Edit KPI
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => commit((current) => removeKpi(current, row.original.kpiId!))}
                  >
                    Remove KPI
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={() => row.toggleExpanded()}>
                  {row.getIsExpanded() ? "Collapse" : "Expand"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      {
        id: "scope",
        header: "",
        enableHiding: false,
        enableSorting: false,
        accessorFn: (row) => row.searchText,
        filterFn: (row, _id, raw) => {
          const scope = raw as { search: string; query: FilterQuery };
          return (
            (!scope.search.trim() ||
              row.original.searchText.toLowerCase().includes(scope.search.trim().toLowerCase())) &&
            matchesScorecardQuery(row.original, scope.query)
          );
        },
      },
    ];
  }, [compact, commit, monthIndex, scorecard, state.kpis]);

  const nativeFilters = useMemo(() => [{ id: "scope", value: { search, query } }], [search, query]);
  const nativeVisibility = useMemo(
    () => ({ ...visibility, scope: false, perspective: !compact }),
    [visibility, compact],
  );
  const table = useTable({
    features: dataGridFeatures,
    data,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => (row.children.length ? row.children : undefined),
    enableExpanding: true,
    enableRowSelection: false,
    filterFromLeafRows: true,
    paginateExpandedRows: false,
    autoResetPageIndex: false,
    autoResetExpanded: false,
    state: {
      expanded: nativeExpanded,
      sorting,
      columnFilters: nativeFilters,
      columnVisibility: nativeVisibility,
      columnPinning: { start: compact ? ["title"] : ["perspective"], end: [] },
      pagination: { pageIndex: 0, pageSize: Infinity },
    },
    onExpandedChange: (updater) => setExpanded(functionalUpdate(updater, nativeExpanded)),
    onSortingChange: setSorting,
    onColumnVisibilityChange: (updater) =>
      setVisibility(functionalUpdate(updater, nativeVisibility)),
  });

  function onCellsChange(details: DataGridCellsChangeDetails<ScorecardRow>) {
    commit((current) =>
      details.changes.reduce((next, change) => {
        if (change.row.kind !== "kpi" || !change.row.kpiId) return next;
        if (
          change.columnId === "value" &&
          (change.value === null ||
            (typeof change.value === "number" && Number.isFinite(change.value)))
        )
          return writeCompanyActual(next, change.row.kpiId, monthIndex, change.value);
        if (
          change.columnId === "weight" &&
          typeof change.value === "number" &&
          Number.isFinite(change.value) &&
          change.value >= 0 &&
          change.value <= 100
        )
          return writeKpiWeight(next, change.row.kpiId, change.value);
        return next;
      }, current),
    );
    if (details.rejected.length)
      toast.error(
        `${details.rejected.length} cells rejected. Enter a number, or leave Value blank.`,
      );
  }

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("input,textarea,[contenteditable=true]")) return;
    if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    }
    if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      searchRef.current?.focus();
    }
  }

  function exportCsv() {
    const leaves = table
      .getFilteredRowModel()
      .flatRows.filter((row) => row.original.kind === "kpi");
    const rows = [
      [
        "Perspective",
        "Objective",
        "KPI",
        "Month",
        "Owner",
        "Weight",
        "Baseline",
        "Value",
        "Target",
        "To Go",
        "Change (pts)",
        "Progress (%)",
        "Status",
      ],
      ...leaves.map(({ original: row }) => [
        row.perspectiveTitle,
        row.objectiveTitle,
        row.title,
        month.label,
        row.owner?.name,
        row.weight,
        row.baseline,
        row.value,
        row.target,
        row.toGo,
        row.change,
        row.score,
        statusLabels[row.status],
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bricklane-strategy-scorecard-${month.id}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const ownerCount = new Set(state.kpis.map((item) => item.ownerId).filter(Boolean)).size;
  const weakestMarket = scorecard.companyMarkets.reduce<ScorecardRow["markets"][number] | null>(
    (lowest, market) =>
      market.score !== null && (lowest === null || market.score < lowest.score!) ? market : lowest,
    null,
  );
  const visibleRows = table.getRowModel().rows.length;
  const fillerHeight = Math.max(0, (compact ? 546 : 584) - visibleRows * 28);
  const footer = (
    <DataGridTableFootRow>
      {table.getVisibleLeafColumns().map((column) => {
        let content;
        switch (column.id) {
          case "perspective":
            content = (
              <>
                <strong>COMPANY SCORE</strong>
                <span>{month.label}</span>
              </>
            );
            break;
          case "title":
            content = (
              <>
                <strong>
                  {compact
                    ? "COMPANY SCORE"
                    : `${scorecard.counts.onTrack} of ${scorecard.counts.scored} KPIs on track`}
                </strong>
                <span>{state.objectives.length} objectives</span>
              </>
            );
            break;
          case "owner":
            content = (
              <>
                <strong>{ownerCount}</strong>
                <span>owners</span>
              </>
            );
            break;
          case "weight":
            content = (
              <>
                <strong>{scorecard.perspectiveWeightTotal}%</strong>
                <span>total</span>
              </>
            );
            break;
          case "baseline":
            content = (
              <>
                <strong className="ss14-track">{scorecard.counts.onTrack}</strong>
                <span>on track</span>
              </>
            );
            break;
          case "value":
            content = (
              <>
                <strong className="ss14-watch">{scorecard.counts.watch}</strong>
                <span>on watch</span>
              </>
            );
            break;
          case "target":
            content = (
              <>
                <strong className="ss14-off">{scorecard.counts.offTrack}</strong>
                <span>off track</span>
              </>
            );
            break;
          case "toGo":
            content = (
              <>
                <strong>{scorecard.counts.notScored}</strong>
                <span>no actual</span>
              </>
            );
            break;
          case "change":
            content = (
              <>
                <strong>
                  <ScorecardChangeCell
                    values={scorecard.company.history
                      .slice(0, monthIndex + 1)
                      .map((item) => item.change)}
                    change={scorecard.company.change}
                    label="Company monthly progress change"
                  />
                </strong>
                <span>pts since {previousMonth}</span>
              </>
            );
            break;
          case "lagging":
            content = (
              <>
                <strong className="ss14-footer-market">
                  <span>{weakestMarket?.market.code ?? "–"}</span>
                  <ScorecardProgressCell
                    score={weakestMarket?.score ?? null}
                    status={weakestMarket ? cellStatus[weakestMarket.status] : "unscored"}
                  />
                </strong>
                <span>
                  {scorecard.offTrackMarkets} of {scorecard.companyMarkets.length} behind
                </span>
              </>
            );
            break;
          case "progress":
            content = (
              <>
                <ScorecardProgressCell
                  score={scorecard.company.score}
                  status={cellStatus[scorecard.company.status]}
                />
                <span>{statusLabels[scorecard.company.status]}</span>
              </>
            );
            break;
          default:
            content = null;
        }
        return (
          <DataGridTableFootRowCell
            key={column.id}
            className={`ss14-footer-cell ${["perspective", "title"].includes(column.id) ? "ss14-footer-title" : ""}`}
          >
            {content}
          </DataGridTableFootRowCell>
        );
      })}
    </DataGridTableFootRow>
  );

  return (
    <div className="ss14-root" onKeyDown={keyboard} data-compact={compact || undefined}>
      <DataGrid
        table={table}
        recordCount={scorecard.counts.total}
        onCellsChange={onCellsChange}
        appendRow={
          visibleRows ? (
            <tr
              data-row-id="filler"
              className="ss14-filler-row"
              aria-hidden="true"
              style={{ height: fillerHeight }}
            >
              <td colSpan={table.getVisibleLeafColumns().length + 1} />
            </tr>
          ) : undefined
        }
        emptyMessage="No KPIs match your search and filters."
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
          cellEditMode: "click",
          cellEditEnterAdvance: true,
        }}
        tableClassNames={{
          base: "ss14-table",
          headerRow: "ss14-header-row",
          bodyRow: "ss14-body-row",
          footer: "ss14-footer",
          headerSticky: "ss14-sticky-header",
        }}
      >
        <Frame dense className="ss14-frame">
          <FrameHeader className="ss14-toolbar">
            <div className="ss14-heading">
              <FrameTitle>Strategy Scorecard</FrameTitle>
              <FrameDescription>{month.label}, baseline to year end target</FrameDescription>
            </div>
            <div className="ss14-controls">
              <div className="ss14-search">
                <Search aria-hidden="true" />
                <Input
                  ref={searchRef}
                  aria-label="Search KPIs"
                  placeholder="Search KPIs"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <kbd aria-hidden="true">/</kbd>
              </div>
              <Select
                value={String(monthIndex)}
                onValueChange={(value) => setMonthIndex(Number(value))}
              >
                <SelectTrigger size="sm" aria-label="Month" className="ss14-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((item) => (
                    <SelectItem key={item.id} value={String(item.index)}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Filters
                fields={fields}
                query={query}
                onQueryChange={setQuery}
                variant="advanced"
                size="sm"
                advancedAlign="end"
                trigger={
                  <Button variant="outline" size="icon-sm" aria-label="Filter">
                    <Filter />
                  </Button>
                }
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon-sm" aria-label="Scoring">
                    <SlidersHorizontal />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="ss14-scoring-popover">
                  <h3 className="font-medium">Scoring</h3>
                  <p className="text-xs text-muted-foreground">
                    Progress points from baseline to target
                  </p>
                  <div className="ss14-threshold">
                    <Label>On Track {state.thresholds.onTrack}%</Label>
                    <Slider
                      aria-label="On Track threshold"
                      value={[state.thresholds.onTrack]}
                      min={state.thresholds.watch}
                      max={100}
                      onValueChange={([onTrack]) =>
                        commit((current) => ({
                          ...current,
                          thresholds: { ...current.thresholds, onTrack },
                        }))
                      }
                    />
                  </div>
                  <div className="ss14-threshold">
                    <Label>Watch {state.thresholds.watch}%</Label>
                    <Slider
                      aria-label="Watch threshold"
                      value={[state.thresholds.watch]}
                      min={0}
                      max={state.thresholds.onTrack}
                      onValueChange={([watch]) =>
                        commit((current) => ({
                          ...current,
                          thresholds: { ...current.thresholds, watch },
                        }))
                      }
                    />
                  </div>
                  {state.perspectives.map((perspective) => (
                    <div key={perspective.id} className="ss14-scoring-weight">
                      <Label htmlFor={`ss14-${perspective.id}`}>{perspective.title}</Label>
                      <NumberField
                        id={`ss14-${perspective.id}`}
                        size="sm"
                        min={0}
                        max={100}
                        value={perspective.weight}
                        onValueChange={(value) => {
                          if (value !== null)
                            commit((current) => ({
                              ...current,
                              perspectives: current.perspectives.map((item) =>
                                item.id === perspective.id ? { ...item, weight: value } : item,
                              ),
                            }));
                        }}
                      >
                        <NumberFieldGroup>
                          <NumberFieldInput aria-label={`${perspective.title} weight`} />
                        </NumberFieldGroup>
                      </NumberField>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      JSON.stringify({
                        perspectives: state.perspectives,
                        thresholds: state.thresholds,
                      }) ===
                      JSON.stringify({
                        perspectives: createInitialScorecard().perspectives,
                        thresholds: createInitialScorecard().thresholds,
                      })
                    }
                    onClick={() =>
                      commit((current) => {
                        const defaults = createInitialScorecard();
                        return {
                          ...current,
                          perspectives: defaults.perspectives,
                          thresholds: defaults.thresholds,
                        };
                      })
                    }
                  >
                    Reset scoring
                  </Button>
                </PopoverContent>
              </Popover>
              <DataGridColumnVisibility
                table={table}
                trigger={
                  <Button variant="outline" size="icon-sm" aria-label="View">
                    <Columns3 />
                  </Button>
                }
              >
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Objectives</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => table.toggleAllRowsExpanded(true)}>
                  Expand all
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    if (compact)
                      table.setExpanded(Object.fromEntries(data.map((row) => [row.id, true])));
                    else table.toggleAllRowsExpanded(false);
                  }}
                >
                  Collapse all
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={!history.past.length} onSelect={undo}>
                  <Undo2 />
                  Undo
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!history.future.length} onSelect={redo}>
                  Redo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    commit(() => createInitialScorecard());
                    setSearch("");
                    setQuery(emptyQuery());
                    setExpanded(true);
                    setSorting([]);
                  }}
                >
                  Reset scorecard
                </DropdownMenuItem>
              </DataGridColumnVisibility>
              <Button variant="outline" size="icon-sm" aria-label="Export CSV" onClick={exportCsv}>
                <Download />
              </Button>
              <Button
                size="sm"
                onClick={() => setEditor({ initial: null, objectiveId: state.objectives[0].id })}
                aria-label="Add KPI"
              >
                <Plus />
                <span className="ss14-add-label">Add KPI</span>
              </Button>
            </div>
          </FrameHeader>
          <div className="ss14-summary" aria-label="Company score summary">
            <div>
              <span>Company Score</span>
              <p>
                <strong data-status={cellStatus[scorecard.company.status]}>
                  {numberText(scorecard.company.score)}
                </strong>
                <small>
                  {statusLabels[scorecard.company.status]}, {formatDelta(scorecard.company.change)}{" "}
                  since {previousMonth}
                </small>
              </p>
            </div>
            <div>
              <span>KPIs On Track</span>
              <p>
                <strong>{scorecard.counts.onTrack}</strong>
                <small>of {scorecard.counts.scored} scored</small>
              </p>
            </div>
            <div>
              <span>Weakest Perspective</span>
              <p>
                <strong>{numberText(scorecard.weakestPerspective?.score ?? null)}</strong>
                <small>
                  {scorecard.weakestPerspective?.perspective.title ?? "Not scored"},{" "}
                  {scorecard.weakestPerspective?.counts.offTrack ?? 0} off track
                </small>
              </p>
            </div>
            <div>
              <span>KPI Status</span>
              <p className="ss14-status-counts">
                <span>
                  <i className="ss14-track-dot" />
                  <strong>{scorecard.counts.onTrack}</strong>
                  <small>On Track</small>
                </span>
                <span>
                  <i className="ss14-watch-dot" />
                  <strong>{scorecard.counts.watch}</strong>
                  <small>Watch</small>
                </span>
                <span>
                  <i className="ss14-off-dot" />
                  <strong>{scorecard.counts.offTrack}</strong>
                  <small>Off Track</small>
                </span>
              </p>
            </div>
          </div>
          <DataGridContainer className="ss14-grid-container">
            <DataGridScrollArea orientation="both" className="ss14-scroll-area">
              <DataGridTable footerContent={footer} />
            </DataGridScrollArea>
            <DataGridCellSelection<ScorecardRow> />
          </DataGridContainer>
          <div className="ss14-help">
            <p>
              <span>Blue figures</span> are inputs. Click one to edit, paste a range, Ctrl Z to
              undo.
            </p>
            <div>
              <span>
                <i className="ss14-track-dot" />
                On Track {state.thresholds.onTrack}% or more
              </span>
              <span>
                <i className="ss14-watch-dot" />
                Watch {state.thresholds.watch}% or more
              </span>
              <span>
                <i className="ss14-off-dot" />
                Off Track under {state.thresholds.watch}%
              </span>
            </div>
          </div>
        </Frame>
      </DataGrid>
      <ScorecardDetails
        state={state}
        monthIndex={monthIndex}
        kpiId={detailsId}
        onOpenChange={(open) => {
          if (!open) setDetailsId(null);
        }}
        onEdit={(kpi) => setEditor({ initial: kpi, objectiveId: kpi.objectiveId })}
        onRemove={(id) => {
          commit((current) => removeKpi(current, id));
          setDetailsId(null);
        }}
      />
      {editor && (
        <ScorecardKpiEditor
          key={editor.initial?.id ?? `new-${editor.objectiveId}`}
          state={state}
          initial={editor.initial}
          objectiveId={editor.objectiveId}
          onSave={(kpi) => {
            commit((current) =>
              editor.initial ? updateKpi(current, kpi.id, kpi) : addKpi(current, kpi),
            );
            if (!editor.initial || editor.initial.objectiveId !== kpi.objectiveId) {
              table.getRow(kpi.objectiveId).toggleExpanded(true);
              const objective = state.objectives.find((item) => item.id === kpi.objectiveId);
              if (compact && objective) table.getRow(objective.perspectiveId).toggleExpanded(true);
            }
            setEditor(null);
          }}
          onCancel={() => setEditor(null)}
        />
      )}
    </div>
  );
}

export default StrategyScorecard;
