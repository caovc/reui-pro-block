import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  functionalUpdate,
  useTable,
  type ColumnDef,
  type ColumnVisibilityState,
  type ExpandedState,
  type Row,
} from "@tanstack/react-table";
import {
  ArrowDownToLine,
  Ellipsis,
  ListFilter,
  MessageSquare,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
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
import type { FilterField, FilterNode, FilterQuery } from "@/components/reui/filters/filters-types";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Kbd } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { downloadCsv } from "./data-utils";
import {
  createPnlLines,
  pnlMonths,
  pnlSections,
  pnlYear,
  type PnlCompareBase,
  type PnlConfidence,
  type PnlLine,
  type PnlProjection,
  type PnlRow,
  type PnlSectionId,
} from "./grid-advanced-retail-pnl-outlook-data";
import {
  applyPnlWrites,
  computePnl,
  formatPnlPercent,
  parsePnlAmount,
  pnlVariance,
} from "./grid-advanced-retail-pnl-outlook-model";
import {
  PnlAmount,
  PnlChartLegend,
  PnlConfidenceCell,
  PnlMonthChartCell,
  PnlOutlookChart,
  PnlSectionMark,
  PnlVarianceCell,
  PnlVarianceGauge,
} from "./grid-advanced-retail-pnl-outlook-cells";
import {
  PnlAddLineDialog,
  PnlLineSheet,
  PnlVariancePopover,
  PnlViewMenu,
  type PnlOptionalColumn,
} from "./grid-advanced-retail-pnl-outlook-panels";
import "@/blocks/reference.css";
import "./grid-advanced-retail-pnl-outlook.css";

type LinePatch = Partial<Pick<PnlLine, "name" | "owner" | "section">>;
type LineDraft = Pick<PnlLine, "name" | "owner" | "section">;
interface BookState {
  lines: PnlLine[];
  sequence: number;
  feedback: { id: number; error: boolean; message: string } | null;
}
type BookAction =
  | { type: "write"; details: DataGridCellsChangeDetails<PnlRow> }
  | { type: "confidence"; id: string; value: PnlConfidence }
  | { type: "update"; id: string; patch: LinePatch }
  | { type: "remove"; id: string }
  | { type: "note"; id: string; noteId: string; text: string; createdAt: string }
  | { type: "add"; id: string; line: LineDraft }
  | { type: "reset" };

const initialBook = (): BookState => ({ lines: createPnlLines(), sequence: 0, feedback: null });
const initialExpanded: ExpandedState = {
  "section-revenue": true,
  "section-cogs": true,
  "section-fulfilment": true,
};
const initialColumns: Record<PnlOptionalColumn, boolean> = {
  budget: false,
  prior: false,
  variance: false,
  confidence: true,
  owner: false,
};

function withFeedback(
  state: BookState,
  lines: PnlLine[],
  message: string,
  error = false,
): BookState {
  const id = state.sequence + 1;
  return { lines, sequence: id, feedback: { id, error, message } };
}

/** One raw book reducer; native edits and local panels cannot diverge. */
function bookReducer(state: BookState, action: BookAction): BookState {
  if (action.type === "reset") return initialBook();
  if (action.type === "write") {
    const result = applyPnlWrites(state.lines, action.details.changes);
    const rejected = result.rejected + action.details.rejected.length;
    if (rejected) {
      return withFeedback(
        state,
        result.lines,
        `${rejected} values rejected. Closed months and calculated rows are read-only; forecast amounts must be finite numbers.`,
        true,
      );
    }
    return result.lines === state.lines
      ? state
      : withFeedback(state, result.lines, "Forecast updated in this local demo.");
  }
  if (action.type === "add") {
    const name = action.line.name.trim();
    const owner = action.line.owner.trim();
    if (!name || !owner || !pnlSections.some((section) => section.id === action.line.section))
      return state;
    const zeros = () => pnlMonths.map(() => 0);
    const line: PnlLine = {
      id: action.id,
      name,
      section: action.line.section,
      owner,
      confidence: "medium",
      budget: zeros(),
      actual: zeros(),
      forecast: zeros(),
      prior: zeros(),
      notes: [],
    };
    return withFeedback(state, [...state.lines, line], "Line added to this local statement.");
  }
  const current = state.lines.find((line) => line.id === action.id);
  if (!current) return state;
  if (action.type === "remove") {
    return withFeedback(
      state,
      state.lines.filter((line) => line.id !== action.id),
      "Line removed from this local statement.",
    );
  }
  let next: PnlLine;
  if (action.type === "confidence") {
    if (!["high", "medium", "low"].includes(action.value)) return state;
    if (current.confidence === action.value) return state;
    next = { ...current, confidence: action.value };
  } else if (action.type === "note") {
    const text = action.text.trim();
    if (!text) return state;
    next = {
      ...current,
      notes: [
        ...current.notes,
        { id: action.noteId, text, author: current.owner, createdAt: action.createdAt },
      ],
    };
  } else {
    const name = action.patch.name?.trim() ?? current.name;
    const owner = action.patch.owner?.trim() ?? current.owner;
    const section = action.patch.section ?? current.section;
    if (!name || !owner || !pnlSections.some((item) => item.id === section)) return state;
    next = { ...current, name, owner, section };
  }
  return withFeedback(
    state,
    state.lines.map((line) => (line.id === next.id ? next : line)),
    action.type === "note" ? "Note added in this local demo." : "Line updated in this local demo.",
  );
}

const blank = (value: unknown) => value === null || value === undefined || value === "";

/** Filters owns the query UI; only these domain fields need an evaluator. */
function evaluateQuery(row: PnlRow, node: FilterNode): boolean | undefined {
  if (node.type === "group") {
    const values = node.rules
      .map((child) => evaluateQuery(row, child))
      .filter((value) => value !== undefined);
    if (!values.length) return undefined;
    return node.combinator === "and" ? values.every(Boolean) : values.some(Boolean);
  }
  const fields: Record<string, unknown> = {
    section: row.section,
    status: row.variance.status,
    variance: row.variance.percent,
    owner: row.owner,
    confidence: row.confidence,
  };
  if (!node.operator || !(node.path[0] in fields)) return undefined;
  const value = fields[node.path[0]];
  const values = Array.isArray(node.value) ? node.value : [node.value];
  const noValue = node.operator === "empty" || node.operator === "not_empty";
  const range = node.operator === "between" || node.operator === "not_between";
  const many = node.operator === "is_any_of" || node.operator === "is_none_of";
  if (!noValue && (!values.length || values.some(blank))) return undefined;
  if (range ? values.length !== 2 : !noValue && !many && values.length !== 1) return undefined;
  const numeric = ["eq", "neq", "gt", "gte", "lt", "lte", "between", "not_between"].includes(
    node.operator,
  );
  if (numeric && values.some((item) => !Number.isFinite(Number(item)))) return undefined;
  if (range && Number(values[0]) > Number(values[1])) return undefined;
  const text = String(value ?? "").toLowerCase();
  const expected = values.map((item) => String(item).toLowerCase());
  let result: boolean;
  switch (node.operator) {
    case "empty":
      result = blank(value);
      break;
    case "not_empty":
      result = !blank(value);
      break;
    case "is":
    case "is_any_of":
      result = expected.includes(text);
      break;
    case "is_not":
    case "is_none_of":
      result = !expected.includes(text);
      break;
    case "eq":
      result = !blank(value) && Number(value) === Number(values[0]);
      break;
    case "neq":
      result = !blank(value) && Number(value) !== Number(values[0]);
      break;
    case "gt":
      result = !blank(value) && Number(value) > Number(values[0]);
      break;
    case "gte":
      result = !blank(value) && Number(value) >= Number(values[0]);
      break;
    case "lt":
      result = !blank(value) && Number(value) < Number(values[0]);
      break;
    case "lte":
      result = !blank(value) && Number(value) <= Number(values[0]);
      break;
    case "between":
      result =
        !blank(value) && Number(value) >= Number(values[0]) && Number(value) <= Number(values[1]);
      break;
    case "not_between":
      result =
        !blank(value) &&
        !(Number(value) >= Number(values[0]) && Number(value) <= Number(values[1]));
      break;
    default:
      return undefined;
  }
  return node.negated ? !result : result;
}

interface Scope {
  query: FilterQuery;
  search: string;
}
function matchesScope(row: PnlRow, scope: Scope) {
  const match = evaluateQuery(row, scope.query);
  const search = scope.search.trim().toLowerCase();
  if (!search && match === undefined) return true;
  if (row.kind !== "line") return false;
  const section = pnlSections.find((item) => item.id === row.section)?.name ?? "";
  return [row.name, row.owner, section].join(" ").toLowerCase().includes(search) && (match ?? true);
}

interface PnlGridContextValue {
  projection: PnlProjection;
  baselines: Record<PnlCompareBase, Map<string, number>>;
  chartRow: PnlRow;
  compare: PnlCompareBase;
  compareLabel: string;
  tolerance: number;
  flagMonths: boolean;
  showChart: boolean;
  selectedMonth: number | null;
  onCompare: (value: PnlCompareBase) => void;
  onChartRow: (id: string) => void;
  onMonth: (index: number) => void;
  onDetail: (id: string) => void;
  onConfidence: (id: string, value: PnlConfidence) => void;
  onAdd: (section: PnlSectionId | null) => void;
}
const PnlGridContext = createContext<PnlGridContextValue | null>(null);
function usePnlGrid() {
  const context = useContext(PnlGridContext);
  if (!context) throw new Error("Retail P&L cells require their native grid context.");
  return context;
}

function MetricHeader() {
  const ui = usePnlGrid();
  return (
    <Select value={ui.chartRow.id} onValueChange={ui.onChartRow}>
      <SelectTrigger
        size="sm"
        aria-label="Chart metric"
        className="h-7 w-full border-0 bg-transparent px-3 text-xs font-semibold shadow-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="reui-reference">
        {[...ui.projection.rows, ui.projection.profit].map((row) => (
          <SelectItem key={row.id} value={row.id}>
            {row.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function ComparisonHeader() {
  const ui = usePnlGrid();
  return (
    <Select value={ui.compare} onValueChange={(value) => ui.onCompare(value as PnlCompareBase)}>
      <SelectTrigger
        size="sm"
        aria-label="Comparison baseline"
        className="h-7 w-full border-0 bg-transparent px-2 text-xs font-semibold shadow-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="reui-reference">
        <SelectItem value="budget">vs Budget</SelectItem>
        <SelectItem value="prior">vs Prior Year</SelectItem>
      </SelectContent>
    </Select>
  );
}
function LegendHeader() {
  const ui = usePnlGrid();
  return ui.showChart ? (
    <PnlChartLegend name={ui.chartRow.name} compareLabel={ui.compareLabel} />
  ) : null;
}
function MonthChartHeader({ monthIndex }: { monthIndex: number }) {
  const ui = usePnlGrid();
  return ui.showChart ? (
    <PnlMonthChartCell
      row={ui.chartRow}
      monthIndex={monthIndex}
      compareLabel={ui.compareLabel}
      selected={ui.selectedMonth === monthIndex}
      onSelect={ui.onMonth}
    />
  ) : null;
}
function OutlookHeader() {
  const ui = usePnlGrid();
  return ui.showChart ? <PnlOutlookChart row={ui.chartRow} compareLabel={ui.compareLabel} /> : null;
}
function VarianceHeader() {
  const ui = usePnlGrid();
  return ui.showChart ? (
    <PnlVarianceGauge row={ui.chartRow} compareLabel={ui.compareLabel} />
  ) : null;
}

function NameCell({ row }: { row: Row<DataGridFeatures, PnlRow> }) {
  const ui = usePnlGrid();
  const record = row.original;
  if (record.kind === "line") {
    return (
      <div className="rpo-line-cell rpo-line-name" data-rpo-row-kind="line">
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-w-0 flex-1 justify-start truncate px-0 py-1 text-left text-xs font-normal"
          aria-label={`View ${record.name}`}
          onClick={() => ui.onDetail(record.lineId!)}
        >
          <span className="truncate">{record.name}</span>
        </Button>
        {record.notesCount > 0 && (
          <span className="rpo-note-count">
            <MessageSquare aria-hidden className="size-3" />
            {record.notesCount}
            <span className="sr-only"> notes</span>
          </span>
        )}
      </div>
    );
  }
  if (record.kind === "margin") {
    return (
      <div
        className="rpo-margin-row"
        data-rpo-row-kind="margin"
        data-selected={ui.chartRow.id === record.id}
      >
        <Button
          type="button"
          variant="ghost"
          className="rpo-line-name h-auto max-w-full justify-start px-0 py-0 text-left text-xs font-semibold uppercase"
          aria-label={`Chart ${record.name}`}
          onClick={() => ui.onChartRow(record.id)}
        >
          {record.name}
        </Button>
        <span className="rpo-line-meta">
          {formatPnlPercent(record.marginPercent)} of net revenue
        </span>
      </div>
    );
  }
  return (
    <div
      className="rpo-section-row"
      data-rpo-row-kind="section"
      data-selected={ui.chartRow.id === record.id}
    >
      <PnlSectionMark section={record.section!} />
      <div className="min-w-0 grow">
        <Button
          type="button"
          variant="ghost"
          className="rpo-line-name block h-auto max-w-full truncate px-0 py-0 text-left text-xs font-semibold"
          aria-label={`Chart ${record.name}`}
          onClick={() => ui.onChartRow(record.id)}
        >
          {record.name}
        </Button>
        <span className="rpo-line-meta">
          {row.subRows.length} {row.subRows.length === 1 ? "line" : "lines"}{" "}
          <span aria-hidden>·</span> {record.owner}
        </span>
      </div>
      <DataGridTableRowExpand row={row} indent={0} />
    </div>
  );
}

function AmountCell({ record, monthIndex }: { record: PnlRow; monthIndex: number }) {
  const ui = usePnlGrid();
  const direction = pnlSections.find((section) => section.id === record.section)?.read ?? "higher";
  const variance = pnlVariance(
    record.values[monthIndex],
    record.baseline[monthIndex],
    direction,
    ui.tolerance,
  );
  const strong = record.kind !== "line";
  const flagged = ui.flagMonths && variance.status !== "in-line";
  return (
    <div className="rpo-row-amount" data-variance-status={flagged ? variance.status : undefined}>
      <span className="relative inline-flex items-center justify-end gap-1">
        <PnlAmount
          value={record.values[monthIndex]}
          strong={strong}
          forecast={!strong && pnlMonths[monthIndex].forecast}
        />
        {!strong && flagged && (
          <span
            aria-hidden
            className={cn(
              "size-1 shrink-0 rounded-full",
              variance.status === "adverse" ? "bg-destructive" : "bg-emerald-500",
            )}
          />
        )}
      </span>
      {strong ? (
        <PnlVarianceCell variance={variance} compact />
      ) : (
        flagged && (
          <span className="sr-only">
            {formatPnlPercent(variance.percent)} vs {ui.compareLabel}, {variance.status}
          </span>
        )
      )}
    </div>
  );
}
function MonthCell({
  row,
  column,
}: {
  row: Row<DataGridFeatures, PnlRow>;
  column: { id: string };
}) {
  return <AmountCell record={row.original} monthIndex={Number(column.id.slice(6))} />;
}
function OutlookCell({ row }: { row: Row<DataGridFeatures, PnlRow> }) {
  const record = row.original;
  return (
    <div className="rpo-row-amount">
      <PnlAmount value={record.outlook} strong={record.kind !== "line"} />
      {record.kind !== "line" && (
        <span className="rpo-line-meta">{formatPnlPercent(record.closedShare, 0)} closed</span>
      )}
    </div>
  );
}
function VarianceCell({ row }: { row: Row<DataGridFeatures, PnlRow> }) {
  return (
    <PnlVarianceCell variance={row.original.variance} showDelta={row.original.kind !== "line"} />
  );
}
function ConfidenceCell({ row }: { row: Row<DataGridFeatures, PnlRow> }) {
  const ui = usePnlGrid();
  const record = row.original;
  return record.kind === "line" ? (
    <PnlConfidenceCell
      value={record.confidence!}
      label={`${record.name} forecast confidence`}
      onChange={(value) => ui.onConfidence(record.lineId!, value)}
    />
  ) : record.lowCount > 0 ? (
    <span className="rpo-line-meta">{record.lowCount} low confidence</span>
  ) : null;
}
function ActionsCell({ row }: { row: Row<DataGridFeatures, PnlRow> }) {
  const ui = usePnlGrid();
  const record = row.original;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={`Actions for ${record.name}`}
        >
          <Ellipsis aria-hidden className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="reui-reference">
        {record.kind === "line" ? (
          <DropdownMenuItem onSelect={() => ui.onDetail(record.lineId!)}>
            Line Details
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => ui.onChartRow(record.id)}>
            Use in Chart
          </DropdownMenuItem>
        )}
        {record.kind === "section" && (
          <DropdownMenuItem onSelect={() => row.toggleExpanded()}>
            {row.getIsExpanded() ? "Collapse Section" : "Expand Section"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => ui.onAdd(record.section ?? null)}>
          <Plus aria-hidden />
          Add Line
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function makeColumns(
  mobile: boolean,
  baselines: Record<PnlCompareBase, Map<string, number>>,
): ColumnDef<DataGridFeatures, PnlRow>[] {
  const name: ColumnDef<DataGridFeatures, PnlRow> = {
    id: "name",
    accessorFn: (row) => row.name,
    header: "Line",
    cell: NameCell,
    size: mobile ? 130 : 271,
    minSize: 130,
    enableCellSelection: false,
    meta: {
      headerTitle: "Line",
      headerClassName: "rpo-month-head",
      cellClassName: "px-3 py-0",
      fillWidth: true,
    },
  };
  const quarters = [1, 2, 3, 4].map((quarter): ColumnDef<DataGridFeatures, PnlRow> => ({
    id: `quarter-${quarter}`,
    header: QuarterHeader,
    meta: { headerClassName: "rpo-quarter-head" },
    columns: [
      ...pnlMonths
        .filter((month) => month.quarter === quarter)
        .map((month): ColumnDef<DataGridFeatures, PnlRow> => ({
          id: `chart-${month.id}`,
          header: NativeMonthChartHeader,
          meta: { headerClassName: "rpo-chart-row p-0" },
          columns: [
            {
              id: month.id,
              accessorFn: (row) => row.values[month.index],
              header: MonthLabel,
              cell: MonthCell,
              size: 52,
              minSize: 52,
              maxSize: 52,
              meta: {
                headerTitle: month.name,
                headerClassName: "rpo-month-head text-right",
                cellClassName: "px-1.5 py-0 text-right text-xs tabular-nums",
                cellEdit: {
                  editable: (row) => month.forecast && row.kind === "line",
                  control: "text",
                  parse: parsePnlAmount,
                  format: (value) => String(value ?? ""),
                },
              },
            },
          ],
        })),
      {
        id: `quarter-chart-${quarter}`,
        header: EmptyHeader,
        meta: { headerClassName: "rpo-chart-row" },
        columns: [
          {
            id: `quarter-total-${quarter}`,
            accessorFn: (row) =>
              row.values
                .slice((quarter - 1) * 3, quarter * 3)
                .reduce((total, value) => total + value, 0),
            header: QuarterTotalLabel,
            size: 72,
            cell: PlainAmountCell,
            meta: {
              headerClassName: "rpo-month-head text-right",
              cellClassName: "px-2 py-0 text-right text-xs",
            },
          },
        ],
      },
    ],
  }));
  return [
    {
      id: "metric-control",
      header: MetricHeader,
      meta: { headerClassName: "rpo-quarter-head p-0" },
      columns: [
        {
          id: "metric-legend",
          header: LegendHeader,
          meta: { headerClassName: "rpo-chart-row p-0" },
          columns: [name],
        },
      ],
    },
    ...quarters,
    {
      id: "comparison-control",
      header: ComparisonHeader,
      meta: { headerClassName: "rpo-quarter-head p-0" },
      columns: [
        {
          id: "outlook-chart",
          header: OutlookHeader,
          meta: { headerClassName: "rpo-chart-row p-0" },
          columns: [
            {
              id: "outlook",
              accessorFn: (row) => row.outlook,
              header: "Outlook",
              cell: OutlookCell,
              size: 92,
              meta: {
                headerClassName: "rpo-month-head text-right",
                cellClassName: "px-2 py-0 text-right text-xs",
              },
            },
          ],
        },
        {
          id: "comparison-gauge",
          header: VarianceHeader,
          meta: { headerClassName: "rpo-chart-row p-0" },
          columns: [
            {
              id: "comparison",
              accessorFn: (row) => row.variance.percent,
              header: ComparisonLabel,
              cell: VarianceCell,
              size: 90,
              meta: {
                headerClassName: "rpo-month-head text-right",
                cellClassName: "px-2 py-0 text-right text-xs",
              },
            },
            {
              id: "confidence",
              accessorFn: (row) => row.confidence,
              header: "Confidence",
              cell: ConfidenceCell,
              size: 100,
              enableCellSelection: false,
              meta: { headerClassName: "rpo-month-head", cellClassName: "px-2 py-0 text-xs" },
            },
          ],
        },
        ...(["budget", "prior", "variance", "owner"] as const).map(
          (id): ColumnDef<DataGridFeatures, PnlRow> => ({
            id: `${id}-chart`,
            header: EmptyHeader,
            meta: { headerClassName: "rpo-chart-row" },
            columns: [
              {
                id,
                accessorFn: (row) =>
                  id === "owner"
                    ? row.owner
                    : id === "variance"
                      ? row.variance.delta
                      : (baselines[id].get(row.id) ?? 0),
                header:
                  id === "budget"
                    ? "Budget"
                    : id === "prior"
                      ? "Prior Year"
                      : id === "variance"
                        ? "Variance"
                        : "Owner",
                cell: OptionalCell,
                size: id === "owner" ? 140 : 92,
                enableCellSelection: id !== "owner",
                meta: { headerClassName: "rpo-month-head", cellClassName: "px-2 py-0 text-xs" },
              },
            ],
          }),
        ),
      ],
    },
    {
      id: "actions",
      header: ActionsHeader,
      cell: ActionsCell,
      size: 37,
      minSize: 37,
      maxSize: 37,
      enableCellSelection: false,
      meta: { headerClassName: "p-0", cellClassName: "px-1 py-0" },
    },
    {
      id: "scope",
      accessorFn: () => true,
      enableHiding: false,
      enableCellSelection: false,
      filterFn: (row, _id, value: Scope) => matchesScope(row.original, value),
    },
  ];
}

function ComparisonLabel() {
  const ui = usePnlGrid();
  return <>vs {ui.compareLabel}</>;
}
function OptionalCell({
  row,
  column,
  getValue,
}: {
  row: Row<DataGridFeatures, PnlRow>;
  column: { id: string };
  getValue: () => unknown;
}) {
  return column.id === "owner" ? (
    <span className="rpo-line-meta">{row.original.owner}</span>
  ) : (
    <PnlAmount value={Number(getValue())} strong={row.original.kind !== "line"} />
  );
}
function EmptyHeader() {
  return null;
}
function ActionsHeader() {
  return <span className="sr-only">Actions</span>;
}
function QuarterHeader({ column }: { column: { id: string } }) {
  const quarter = Number(column.id.split("-").at(-1));
  return (
    <div className="flex items-center justify-center gap-2 text-xs">
      <span>
        Q{quarter} {pnlYear}
      </span>
      <Badge
        variant="secondary"
        className={cn("px-1 py-0 text-[10px]", quarter === 4 && "text-primary")}
      >
        {quarter === 4 ? "Forecast" : "Closed"}
      </Badge>
    </div>
  );
}
function NativeMonthChartHeader({ column }: { column: { id: string } }) {
  return <MonthChartHeader monthIndex={Number(column.id.slice("chart-month-".length))} />;
}
function MonthLabel({ column }: { column: { id: string } }) {
  const month = pnlMonths[Number(column.id.slice(6))];
  return (
    <span>
      {month.short}
      <span className="sr-only">, {month.forecast ? "forecast" : "closed"}</span>
    </span>
  );
}
function QuarterTotalLabel({ column }: { column: { id: string } }) {
  return <>Q{column.id.split("-").at(-1)} Total</>;
}
function PlainAmountCell({
  row,
  getValue,
}: {
  row: Row<DataGridFeatures, PnlRow>;
  getValue: () => unknown;
}) {
  return <PnlAmount value={Number(getValue())} strong={row.original.kind !== "line"} />;
}

function ProfitCell({ columnId }: { columnId: string }): ReactNode {
  const ui = usePnlGrid();
  const profit = ui.projection.profit;
  if (columnId === "name")
    return (
      <div className="rpo-margin-row">
        <strong className="uppercase">{profit.name}</strong>
        <span className="rpo-line-meta">
          {formatPnlPercent(profit.marginPercent)} of net revenue
        </span>
      </div>
    );
  if (columnId.startsWith("month-"))
    return <AmountCell record={profit} monthIndex={Number(columnId.slice(6))} />;
  if (columnId.startsWith("quarter-total-")) {
    const quarter = Number(columnId.split("-").at(-1));
    return (
      <PnlAmount
        value={profit.values
          .slice((quarter - 1) * 3, quarter * 3)
          .reduce((total, value) => total + value, 0)}
        strong
      />
    );
  }
  if (columnId === "outlook")
    return (
      <div className="rpo-row-amount">
        <PnlAmount value={profit.outlook} strong />
        <span className="rpo-line-meta">{formatPnlPercent(profit.closedShare, 0)} closed</span>
      </div>
    );
  if (columnId === "comparison") return <PnlVarianceCell variance={profit.variance} showDelta />;
  if (columnId === "variance") return <PnlAmount value={profit.variance.delta} strong />;
  if (columnId === "budget" || columnId === "prior")
    return <PnlAmount value={ui.baselines[columnId].get(profit.id) ?? 0} strong />;
  return null;
}

export default function RetailPnlOutlook() {
  const [book, dispatch] = useReducer(bookReducer, undefined, initialBook);
  const [compare, setCompare] = useState<PnlCompareBase>("budget");
  const [tolerance, setTolerance] = useState(5);
  const [flagMonths, setFlagMonths] = useState(true);
  const [showChart, setShowChart] = useState(true);
  const [showQuarters, setShowQuarters] = useState(false);
  const [optionalColumns, setOptionalColumns] = useState(initialColumns);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded);
  const [chartId, setChartId] = useState("section-revenue");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addSection, setAddSection] = useState<PnlSectionId | null>(null);
  const mobile = useIsMobile(640);
  const announced = useRef(0);
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (
        event.key !== "/" ||
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const target = event.target;
      const ownsKeyboard =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest(
            "input, textarea, select, [role=dialog], [role=menu], [role=listbox], [role=tree], [role=combobox], [role=gridcell], [role=slider], [data-slot=data-grid]",
          ));
      const openPopup = document.querySelector(
        '[role="dialog"], [role="menu"], [role="listbox"], [role="tree"], [data-slot="popover-content"][data-state="open"]',
      );
      if (ownsKeyboard || openPopup) return;
      event.preventDefault();
      searchInput.current?.focus();
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);
  useEffect(() => {
    if (!book.feedback || announced.current === book.feedback.id) return;
    announced.current = book.feedback.id;
    if (book.feedback.error)
      toast.error("Some cells kept their value", { description: book.feedback.message });
    else toast.success(book.feedback.message);
  }, [book.feedback]);
  const budget = useMemo(
    () => computePnl(book.lines, "budget", tolerance),
    [book.lines, tolerance],
  );
  const prior = useMemo(() => computePnl(book.lines, "prior", tolerance), [book.lines, tolerance]);
  const projection = compare === "budget" ? budget : prior;
  const baselines = useMemo(
    () => ({
      budget: new Map(
        [...budget.flatRows, budget.profit].map((row) => [row.id, row.baselineTotal]),
      ),
      prior: new Map([...prior.flatRows, prior.profit].map((row) => [row.id, row.baselineTotal])),
    }),
    [budget, prior],
  );
  const chartRow =
    [...projection.rows, projection.profit].find((row) => row.id === chartId) ?? projection.rows[0];
  const compareLabel = compare === "budget" ? "Budget" : "Prior Year";
  const columns = useMemo(() => makeColumns(mobile, baselines), [mobile, baselines]);
  const visibility = useMemo<ColumnVisibilityState>(
    () => ({
      scope: false,
      ...optionalColumns,
      ...Object.fromEntries(
        [1, 2, 3, 4].map((quarter) => [`quarter-total-${quarter}`, showQuarters]),
      ),
    }),
    [optionalColumns, showQuarters],
  );
  const scope = useMemo(() => [{ id: "scope", value: { search, query } }], [search, query]);
  // The shared useDomainGrid adapter has no pinning option. This is the same actual
  // native v9/dataGridFeatures path used by existing HR/Freight consumers, not a fork.
  const table = useTable({
    features: dataGridFeatures,
    data: projection.rows,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.children,
    defaultColumn: { enableSorting: false, enableResizing: false, minSize: 0 },
    state: {
      expanded,
      columnVisibility: visibility,
      columnFilters: scope,
      columnPinning: { start: ["name"], end: [] },
    },
    onExpandedChange: (updater) => setExpanded((current) => functionalUpdate(updater, current)),
    enableExpanding: true,
    enableRowSelection: false,
    filterFromLeafRows: true,
    manualPagination: true,
    autoResetExpanded: false,
  });
  const orderedColumns = [
    ...table.getStartVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getEndVisibleLeafColumns(),
  ];
  const selectedLine = book.lines.find((line) => line.id === selectedLineId) ?? null;
  const selectedRow = projection.flatRows.find((row) => row.lineId === selectedLineId) ?? null;
  const leafRows = projection.flatRows.filter((row) => row.kind === "line");
  const stats = {
    adverse: leafRows.filter((row) => row.variance.status === "adverse").length,
    favourable: leafRows.filter((row) => row.variance.status === "favourable").length,
    inLine: leafRows.filter((row) => row.variance.status === "in-line").length,
  };
  const fields = useMemo<FilterField[]>(
    () => [
      {
        id: "section",
        label: "Section",
        type: "select",
        options: pnlSections.map((section) => ({ value: section.id, label: section.name })),
      },
      {
        id: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "adverse", label: "Adverse" },
          { value: "favourable", label: "Favourable" },
          { value: "in-line", label: "In Line" },
        ],
      },
      { id: "variance", label: "Variance %", type: "number" },
      {
        id: "owner",
        label: "Owner",
        type: "select",
        options: [...new Set(book.lines.map((line) => line.owner))]
          .sort()
          .map((owner) => ({ value: owner, label: owner })),
      },
      {
        id: "confidence",
        label: "Confidence",
        type: "select",
        options: [
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
        ],
      },
    ],
    [book.lines],
  );
  const exportRows = [...projection.flatRows, projection.profit].map(
    (row): Record<string, unknown> => ({
      Line: row.name,
      Kind: row.kind,
      Section: row.section
        ? pnlSections.find((section) => section.id === row.section)?.name
        : "Statement margin",
      ...Object.fromEntries(
        pnlMonths.map((month) => [`${month.short} ${pnlYear} K`, row.values[month.index]]),
      ),
      "Outlook K": row.outlook,
      [`${compareLabel} K`]: row.baselineTotal,
      "Variance K": row.variance.delta,
      "Variance %": row.variance.percent,
      Status: row.variance.status,
      Owner: row.owner,
      Confidence: row.confidence ?? "",
    }),
  );
  function openAdd(section: PnlSectionId | null) {
    setAddSection(section);
    setAddOpen(true);
  }
  function resetStatement() {
    dispatch({ type: "reset" });
    announced.current = 0;
    setCompare("budget");
    setTolerance(5);
    setFlagMonths(true);
    setShowChart(true);
    setShowQuarters(false);
    setOptionalColumns(initialColumns);
    setSearch("");
    setQuery(createFilterQuery());
    setExpanded(initialExpanded);
    setChartId("section-revenue");
    setSelectedMonth(null);
    setSelectedLineId(null);
    setAddOpen(false);
  }
  const context: PnlGridContextValue = {
    projection,
    baselines,
    chartRow,
    compare,
    compareLabel,
    tolerance,
    flagMonths,
    showChart,
    selectedMonth,
    onCompare: setCompare,
    onChartRow: setChartId,
    onMonth: (index) => setSelectedMonth((current) => (current === index ? null : index)),
    onDetail: setSelectedLineId,
    onConfidence: (id, value) => dispatch({ type: "confidence", id, value }),
    onAdd: openAdd,
  };
  return (
    <PnlGridContext.Provider value={context}>
      <div className="rpo-page">
        <Frame
          dense
          className="reui-reference rpo-frame mx-auto w-full max-w-[1216px]"
          data-chart-band={showChart ? "on" : "off"}
        >
          <FrameHeader className="rpo-toolbar flex-row">
            <div className="rpo-toolbar-title">
              <FrameTitle className="[text-box:trim-both_cap_alphabetic]">
                P&amp;L Outlook
              </FrameTitle>
              <FrameDescription>
                <p>FY {pnlYear} in $ thousands, closed through September</p>
              </FrameDescription>
            </div>
            <ButtonGroup className="rpo-toolbar-actions" aria-label="Statement tools">
              <InputGroup className="rpo-search h-8">
                <InputGroupAddon>
                  <Search aria-hidden className="size-3.5" />
                </InputGroupAddon>
                <InputGroupInput
                  ref={searchInput}
                  value={search}
                  aria-label="Search lines"
                  placeholder="Search lines"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    if (event.target.value.trim()) setExpanded(true);
                  }}
                />
                {!search && (
                  <InputGroupAddon align="inline-end">
                    <Kbd>/</Kbd>
                  </InputGroupAddon>
                )}
                {search && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton aria-label="Clear line search" onClick={() => setSearch("")}>
                      <X aria-hidden className="size-3.5" />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>
              <Filters
                fields={fields}
                query={query}
                onQueryChange={(next) => {
                  setQuery(next);
                  if (next.rules.length) setExpanded(true);
                }}
                variant="advanced"
                advancedAlign="end"
                showClear
                menuClassName="reui-reference"
                fieldPickerClassName="reui-reference"
                trigger={
                  <Button type="button" variant="ghost" size="icon" aria-label="Filter">
                    <ListFilter aria-hidden />
                  </Button>
                }
              />
              <PnlVariancePopover
                compare={compare}
                tolerance={tolerance}
                flagMonths={flagMonths}
                onCompare={setCompare}
                onTolerance={setTolerance}
                onFlagMonths={setFlagMonths}
                stats={stats}
                onReset={() => {
                  setCompare("budget");
                  setTolerance(5);
                  setFlagMonths(true);
                }}
              />
              <PnlViewMenu
                showChart={showChart}
                showQuarters={showQuarters}
                columns={optionalColumns}
                onShowChart={setShowChart}
                onShowQuarters={setShowQuarters}
                onColumnChange={(id, visible) =>
                  setOptionalColumns((current) => ({ ...current, [id]: visible }))
                }
                onExpandAll={() => setExpanded(true)}
                onCollapseAll={() => setExpanded({})}
                onReset={resetStatement}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Export"
                onClick={() => downloadCsv("bricklane-retail-pnl-outlook", exportRows)}
              >
                <ArrowDownToLine aria-hidden />
              </Button>
            </ButtonGroup>
          </FrameHeader>
          <FramePanel className="p-0">
            <DataGrid
              table={table}
              recordCount={projection.flatRows.length}
              onCellsChange={(details) => dispatch({ type: "write", details })}
              emptyMessage={
                <div className="space-y-2 py-10 text-center">
                  <p className="font-medium">No matching lines</p>
                  <p className="text-sm text-muted-foreground">
                    Try another line, owner or filter.
                  </p>
                  <Button
                    type="button"
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
                cellEditEnterAdvance: false,
              }}
              tableClassNames={{
                base: "rpo-table",
                header: "rpo-table-head",
                bodyRow: "rpo-body-row",
                footer: "rpo-profit-footer",
                edgeCell: "",
              }}
              className="rpo-grid"
            >
              <DataGridContainer className="min-w-0 rounded-none border-0">
                <DataGridScrollArea orientation="both" className="rpo-scroll">
                  <DataGridTable
                    footerContent={
                      <DataGridTableFootRow>
                        {orderedColumns.map((column) => (
                          <DataGridTableFootRowCell
                            key={column.id}
                            className={cn(
                              "rpo-profit-row px-1.5 py-0 text-right text-xs",
                              column.id === "name" && "px-3 text-left",
                            )}
                          >
                            <ProfitCell columnId={column.id} />
                          </DataGridTableFootRowCell>
                        ))}
                      </DataGridTableFootRow>
                    }
                  />
                </DataGridScrollArea>
                <DataGridCellSelection<PnlRow> />
              </DataGridContainer>
            </DataGrid>
            <FrameFooter className="rpo-legend-footer flex-row">
              <span className="[text-box:trim-both_cap_alphabetic]">
                <span className="rpo-forecast-label">Blue months</span> are forecast and take edits.
              </span>
              <span className="rpo-legend-statuses">
                <span className="rpo-legend-status">
                  <span aria-hidden className="rpo-legend-triangle rpo-legend-adverse" />
                  <span className="[text-box:trim-both_cap_alphabetic]">
                    Adverse beyond {tolerance}% and $15K
                  </span>
                </span>
                <span className="rpo-legend-status">
                  <span aria-hidden className="rpo-legend-triangle rpo-legend-favourable" />
                  <span className="[text-box:trim-both_cap_alphabetic]">Favourable</span>
                </span>
                <span className="[text-box:trim-both_cap_alphabetic]">vs {compareLabel}</span>
              </span>
            </FrameFooter>
          </FramePanel>
        </Frame>
      </div>
      <PnlLineSheet
        line={selectedLine}
        row={selectedRow}
        compare={compare}
        open={Boolean(selectedLine)}
        onOpenChange={(open) => {
          if (!open) setSelectedLineId(null);
        }}
        onConfidence={(id, value) => dispatch({ type: "confidence", id, value })}
        onUpdateLine={(id, patch) => dispatch({ type: "update", id, patch })}
        onRemoveLine={(id) => {
          dispatch({ type: "remove", id });
          setSelectedLineId(null);
        }}
        onAddNote={(id, text) =>
          dispatch({
            type: "note",
            id,
            text,
            noteId: `rpo-note-${crypto.randomUUID()}`,
            createdAt: new Date().toISOString(),
          })
        }
      />
      <PnlAddLineDialog
        section={addSection}
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(line) => {
          dispatch({ type: "add", line, id: `rpo-line-${crypto.randomUUID()}` });
          setExpanded((current) =>
            current === true ? true : { ...current, [`section-${line.section}`]: true },
          );
        }}
      />
    </PnlGridContext.Provider>
  );
}
