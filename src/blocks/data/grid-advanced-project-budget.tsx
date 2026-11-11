import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Box,
  ChartNoAxesColumnIncreasing,
  CircleDollarSign,
  Code2,
  Columns3,
  Ellipsis,
  LayoutGrid,
  Lightbulb,
  List,
  Plus,
  Rows3,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Bar, BarChart, Cell } from "recharts";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/reui/badge";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import {
  DataGridTableFootRow,
  DataGridTableFootRowCell,
  DataGridTableRowExpand,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  FinanceConfirmation,
  FinanceSchedule,
  FinanceSearch,
  FinanceSelect,
  type FinanceTone,
} from "./grid-advanced-finance-controls";
import {
  DomainGridSurface,
  useDomainGrid,
  type DomainColumn,
  type ExpandedState,
} from "./grid-advanced-model-grid";
import {
  BudgetEditor,
  BudgetForecast,
  BudgetLineSheet,
  type BudgetDetailTab,
} from "./grid-advanced-project-budget-panels";
import {
  daysBetween,
  financeAmount,
  financeDate,
  percentage,
  budgetLaunch,
  budgetOf,
  budgetReserve,
  budgetStart,
  budgetSummary,
  budgetToday,
  buildBudgetRows,
  emptyBudgetLine,
  forecastOf,
  initialBudgetLines,
  isBudgetLate,
  matchesBudget,
  varianceOf,
  type BudgetGroupBy,
  type BudgetLine,
  type BudgetRow,
  type BudgetView,
  type BudgetWorkstream,
} from "./grid-advanced-project-budget-model";
import "./grid-advanced-finance.css";

function notifyFinance(message: string, undo: () => void, id: string) {
  toast.success(message, { id, action: { label: "Undo", onClick: undo } });
}

const workstreamIcons: Record<BudgetWorkstream, LucideIcon> = {
  Discovery: Lightbulb,
  Design: LayoutGrid,
  Build: Code2,
  Integrations: Box,
  "Data Migration": Rows3,
  Launch: Truck,
};
const projectMonths = ["Aug", "Oct", "Dec", "Feb"];
const groups: { value: BudgetGroupBy; label: string }[] = [
  { value: "workstream", label: "Workstream" },
  { value: "vendor", label: "Vendor" },
  { value: "person", label: "Owner" },
  { value: "none", label: "No grouping" },
];
const views: { value: BudgetView; label: string; tone?: FinanceTone }[] = [
  { value: "all", label: "All" },
  { value: "over", label: "Over Budget", tone: "destructive" },
  { value: "under", label: "Under Budget", tone: "success" },
  { value: "late", label: "Late", tone: "warning" },
];
const workstreamExpansion: ExpandedState = {
  "group-workstream-Design": true,
  "group-workstream-Build": true,
  "group-workstream-Integrations": true,
  "group-workstream-Data Migration": true,
};
const percentOfProject = (value: string) =>
  percentage(daysBetween(budgetStart, value), daysBetween(budgetStart, budgetLaunch));

function BudgetHealthTile({
  title,
  amount,
  secondary,
  progress,
  caption,
  tone,
  icon: Icon,
  series,
}: {
  title: string;
  amount: number;
  secondary: string;
  progress: number;
  caption: string;
  tone: FinanceTone;
  icon: LucideIcon;
  series: number[];
}) {
  return (
    <article
      className="finance-tile w-72 shrink-0 rounded-xl border px-3 py-2.5 md:w-auto md:min-w-0"
      data-tone={tone}
      aria-label={`${title}: ${financeAmount(amount)}, ${secondary}, ${progress}% ${caption}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <IconTile size="sm" variant="soft" className="finance-tone mt-0.5">
          <Icon />
        </IconTile>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{title}</div>
          <div className="text-base leading-5 font-semibold tabular-nums">
            {financeAmount(amount)}
          </div>
          <div className="truncate text-xs text-muted-foreground">{secondary}</div>
        </div>
        <ChartContainer
          config={{ value: { color: "var(--finance-tone)" } }}
          className="mt-0.5 hidden h-8 w-14 shrink-0 lg:flex max-md:flex"
          initialDimension={{ width: 56, height: 32 }}
          aria-hidden="true"
        >
          <BarChart
            accessibilityLayer={false}
            data={series.map((value) => ({ value }))}
            barCategoryGap={1}
          >
            <Bar dataKey="value" fill="var(--color-value)" isAnimationActive={false} radius={2}>
              {series.map((_, index) => (
                <Cell key={index} opacity={index === series.length - 1 ? 1 : 0.34} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
      <Progress
        aria-label={title}
        value={Math.min(100, progress)}
        className="finance-meter mt-3 h-1.5"
      />
      <p className="mt-2 truncate text-xs text-muted-foreground">
        <span className="finance-tone font-medium tabular-nums">{progress}%</span> {caption}
      </p>
    </article>
  );
}

function BudgetHealth({ lines }: { lines: BudgetLine[] }) {
  const totals = budgetSummary(lines);
  const available = budgetReserve - totals.committed;
  const spare = available - totals.atRisk;
  const series = (values: number[]) => values.filter((value) => value > 0).slice(0, 10);
  return (
    <section
      aria-label="Budget health"
      className="flex min-w-0 gap-3 overflow-x-auto pb-3 md:grid md:grid-cols-4 md:px-4"
    >
      <BudgetHealthTile
        title="Total Budget"
        amount={totals.budget}
        secondary={`${financeAmount(available)} contingency`}
        progress={percentage(totals.actual, totals.budget)}
        caption="of budget spent"
        tone="focus"
        icon={Box}
        series={series(lines.map(budgetOf))}
      />
      <BudgetHealthTile
        title="Actual Spend"
        amount={totals.actual}
        secondary={`Billed as of ${financeDate(budgetToday)}`}
        progress={percentage(totals.actual, totals.forecast)}
        caption="of the forecast billed"
        tone="success"
        icon={CircleDollarSign}
        series={series(lines.map((line) => line.actual))}
      />
      <BudgetHealthTile
        title="Forecast"
        amount={totals.forecast}
        secondary={`${financeAmount(Math.abs(totals.forecast - totals.budget))} ${totals.forecast > totals.budget ? "over" : "under"} budget`}
        progress={percentOfProject(budgetToday)}
        caption={`of time to launch gone, ${financeDate(budgetLaunch)}`}
        tone="info"
        icon={ChartNoAxesColumnIncreasing}
        series={series(lines.map(forecastOf))}
      />
      <BudgetHealthTile
        title="At Risk"
        amount={totals.atRisk}
        secondary={`${totals.over} of ${lines.length} lines over`}
        progress={percentage(totals.atRisk + totals.committed, budgetReserve)}
        caption={`of contingency, ${financeAmount(Math.abs(spare))} ${spare < 0 ? "short" : "spare"}`}
        tone="destructive"
        icon={AlertTriangle}
        series={series(lines.map((line) => Math.max(0, -varianceOf(line))))}
      />
    </section>
  );
}

function rowTotals(record: BudgetRow) {
  return budgetSummary(record.kind === "group" ? record.lines : [record.line]);
}

function rowSchedule(record: BudgetRow) {
  const lines = record.kind === "group" ? record.lines : [record.line];
  const start = lines.map((line) => line.start).sort()[0]!;
  const finish = lines
    .map((line) => line.forecastFinish)
    .sort()
    .at(-1)!;
  const late = lines.some(isBudgetLate);
  const complete = lines.every((line) => line.remaining === 0);
  const endOfActual = budgetToday < finish ? budgetToday : finish;
  const tone = late ? "destructive" : complete ? "success" : "warning";
  return (
    <FinanceSchedule
      label={`${financeDate(start)} to ${financeDate(finish)}, ${complete ? "done" : late ? "late" : start > budgetToday ? "not started" : "in progress"}`}
      start={percentOfProject(start)}
      end={percentOfProject(finish)}
      elapsed={percentOfProject(endOfActual)}
      marker={percentOfProject(budgetToday)}
      tone={tone}
      late={late}
    />
  );
}

function BasisCell({ line }: { line: BudgetLine }) {
  const setup = line.setup ? ` + ${financeAmount(line.setup)}` : "";
  const description =
    line.basis === "fixed"
      ? `${financeAmount(line.rate)} fixed`
      : `${line.quantity} ${line.basis === "hours" ? "h" : "mo"} × ${financeAmount(line.rate)}${setup}`;
  return <span className="whitespace-nowrap text-muted-foreground">{description}</span>;
}

function Variance({ value }: { value: number }) {
  if (!value)
    return (
      <span className="text-muted-foreground" aria-label="On budget">
        $0
      </span>
    );
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        value < 0 ? "text-destructive" : "text-success-foreground",
      )}
      aria-label={`${financeAmount(Math.abs(value))} ${value < 0 ? "over" : "under"} budget`}
    >
      {value < 0 ? "−" : "+"}
      {financeAmount(Math.abs(value))}
    </span>
  );
}

type BudgetBook = { lines: BudgetLine[]; version: number; previous?: BudgetLine[] };

export default function ProjectBudget() {
  const isMobile = useIsMobile();
  const [book, setBook] = useState<BudgetBook>(() => ({ lines: initialBudgetLines(), version: 0 }));
  const lines = book.lines;
  const [search, setSearch] = useState("");
  const [view, setView] = useState<BudgetView>("all");
  const [group, setGroup] = useState<BudgetGroupBy>("workstream");
  const [density, setDensity] = useState<"compact" | "comfortable">("compact");
  const [expanded, setExpanded] = useState<ExpandedState>(workstreamExpansion);
  const [selection, setSelection] = useState<string[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState(["Owner", "Vendor"]);
  const [detailId, setDetailId] = useState<string>();
  const [detailTab, setDetailTab] = useState<BudgetDetailTab>("overview");
  const [editor, setEditor] = useState<{ line: BudgetLine; adding: boolean }>();
  const [forecastId, setForecastId] = useState<string>();
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const serial = useRef(0);
  const origin = useRef<HTMLElement | null>(null);
  const addButton = useRef<HTMLButtonElement | null>(null);

  const filtered = useMemo(
    () => lines.filter((line) => matchesBudget(line, search, view)),
    [lines, search, view],
  );
  const rows = useMemo(() => buildBudgetRows(filtered, group), [filtered, group]);
  const totals = useMemo(() => budgetSummary(filtered), [filtered]);
  const currentDetail = lines.find((line) => line.id === detailId);
  const selectedIds = selection.filter((id) => lines.some((line) => line.id === id));

  function commit(write: (current: BudgetLine[]) => BudgetLine[], message: string) {
    const version = ++serial.current;
    setBook((current) => ({ lines: write(current.lines), previous: current.lines, version }));
    notifyFinance(
      message,
      () =>
        setBook((current) =>
          current.version === version && current.previous
            ? { lines: current.previous, version: 0 }
            : current,
        ),
      "project-budget",
    );
  }

  function writeLine(line: BudgetLine, message: string) {
    commit(
      (current) =>
        current.some((item) => item.id === line.id)
          ? current.map((item) => {
              if (item.id !== line.id) return item;
              if (line.decision === "cover" && varianceOf(item) !== varianceOf(line))
                return { ...line, decision: undefined };
              return line;
            })
          : [...current, line],
      message,
    );
    if (group !== "none" && expanded !== true)
      setExpanded({ ...expanded, [`group-${group}-${line[group]}`]: true });
  }

  function rememberFocus() {
    if (document.activeElement instanceof HTMLElement) origin.current = document.activeElement;
  }

  function restoreFocus() {
    const target = origin.current?.isConnected ? origin.current : addButton.current;
    target?.focus();
  }

  function openLine(line: BudgetLine, tab: BudgetDetailTab = "overview") {
    if (!currentDetail) rememberFocus();
    setDetailId(line.id);
    setDetailTab(tab);
  }

  function editLine(line: BudgetLine) {
    if (!currentDetail) rememberFocus();
    setDetailId(undefined);
    setEditor({ line, adding: false });
  }

  function addLine(workstream: BudgetWorkstream = "Build") {
    rememberFocus();
    setEditor({ line: emptyBudgetLine(`new-${++serial.current}`, workstream), adding: true });
  }

  function deleteLines() {
    const remove = new Set(deleteIds);
    if (detailId && remove.has(detailId)) setDetailId(undefined);
    setSelection((current) => current.filter((id) => !remove.has(id)));
    commit(
      (current) => current.filter((line) => !remove.has(line.id)),
      remove.size === 1 ? "Budget line deleted" : `${remove.size} budget lines deleted`,
    );
    setDeleteIds([]);
  }

  function changeGroup(next: BudgetGroupBy) {
    setGroup(next);
    setExpanded(next === "workstream" ? workstreamExpansion : true);
  }

  function changeView(next: BudgetView) {
    setView(next);
    if (next !== "all") setExpanded(true);
    else if (!search && group === "workstream") setExpanded(workstreamExpansion);
  }

  function changeSearch(value: string) {
    setSearch(value);
    if (value.trim()) setExpanded(true);
    else if (view === "all" && group === "workstream") setExpanded(workstreamExpansion);
  }

  function lineActions(line: BudgetLine, inSheet = false) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={inSheet ? "More actions" : `Actions for ${line.name}`}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => openLine(line)}>View Line</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openLine(line, "activity")}>
              View Activity
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editLine(line)}>Edit Line</DropdownMenuItem>
            {line.remaining > 0 && (
              <DropdownMenuItem
                onSelect={() => {
                  if (inSheet) setDetailId(undefined);
                  setForecastId(line.id);
                }}
              >
                Update Forecast
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => openLine(line, "decision")}>
              {varianceOf(line) < 0 ? "Cover Overrun" : "Make Decision"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteIds([line.id])}>
              Delete Line
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const columns: DomainColumn<BudgetRow>[] = [
    {
      id: "select",
      size: 48,
      enableHiding: false,
      enableSorting: false,
      header: () => <DataGridTableRowSelectAll />,
      cell: ({ row }) => <DataGridTableRowSelect row={row} />,
    },
    {
      id: "line",
      header: "Line",
      size: isMobile ? 160 : 224,
      enableHiding: false,
      enableSorting: false,
      accessorFn: (record) => (record.kind === "group" ? record.label : record.line.name),
      cell: ({ row }) => {
        const record = row.original;
        if (record.kind === "group") {
          const Icon = workstreamIcons[record.label as BudgetWorkstream] ?? Box;
          return (
            <div className="flex min-w-0 items-center gap-1" role="group" aria-label={record.label}>
              <DataGridTableRowExpand row={row} />
              <IconTile size="xs">
                <Icon />
              </IconTile>
              <span className="truncate font-medium">{record.label}</span>
              <span className="text-muted-foreground">{record.lines.length}</span>
            </div>
          );
        }
        const line = record.line;
        const Icon = workstreamIcons[line.workstream];
        return (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 max-w-full justify-start gap-1.5 px-1.5 font-normal",
              row.depth > 0 && "ml-5 max-w-[calc(100%-1.25rem)]",
            )}
            aria-label={line.name}
            onClick={() => openLine(line)}
          >
            <IconTile size="xs">
              <Icon />
            </IconTile>
            <span className="truncate">{line.name}</span>
          </Button>
        );
      },
    },
    {
      id: "basis",
      header: "Basis",
      size: 168,
      enableSorting: false,
      accessorFn: (record) => (record.kind === "line" ? record.line.basis : ""),
      cell: ({ row }) => row.original.kind === "line" && <BasisCell line={row.original.line} />,
    },
    {
      id: "schedule",
      size: 216,
      enableSorting: false,
      accessorFn: (record) => (record.kind === "line" ? record.line.start : record.label),
      header: () => (
        <div
          className="flex w-full justify-between text-xs font-normal text-muted-foreground"
          aria-label="Schedule"
        >
          {projectMonths.map((month) => (
            <span key={month}>{month}</span>
          ))}
        </div>
      ),
      meta: { headerTitle: "Schedule" },
      cell: ({ row }) => rowSchedule(row.original),
    },
    {
      id: "budget",
      header: "Budget",
      size: 96,
      accessorFn: (record) => rowTotals(record).budget,
      cell: ({ getValue, row }) => (
        <span className={cn("tabular-nums", row.original.kind === "group" && "font-medium")}>
          {financeAmount(Number(getValue()))}
        </span>
      ),
    },
    {
      id: "actual",
      header: "Actual",
      size: 96,
      accessorFn: (record) => rowTotals(record).actual,
      cell: ({ getValue, row }) => (
        <span className={cn("tabular-nums", row.original.kind === "group" && "font-medium")}>
          {financeAmount(Number(getValue()))}
        </span>
      ),
    },
    {
      id: "spent",
      header: "Spent",
      size: 88,
      accessorFn: (record) => percentage(rowTotals(record).actual, rowTotals(record).budget),
      cell: ({ getValue, row }) => {
        const value = Number(getValue());
        if (!value) return <Badge variant="outline">n/a</Badge>;
        const record = row.original;
        const budget = rowTotals(record);
        const variant =
          budget.forecast > budget.budget
            ? "destructive-light"
            : value > 80
              ? "success-light"
              : "warning-light";
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="xs"
                variant="ghost"
                className="-ml-1 p-1"
                aria-label={`${record.kind === "line" ? record.line.name : record.label}: ${value}% of budget spent`}
              >
                <Badge variant={variant}>{value}%</Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {financeAmount(budget.actual)} of {financeAmount(budget.budget)} billed
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: "forecast",
      header: "Forecast",
      size: 110,
      accessorFn: (record) => rowTotals(record).forecast,
      cell: ({ row, getValue }) => {
        const record = row.original;
        return record.kind === "line" && record.line.remaining > 0 ? (
          <BudgetForecast
            key={`${record.id}-${record.line.remaining}`}
            line={record.line}
            open={forecastId === record.line.id}
            onOpenChange={(open) => setForecastId(open ? record.line.id : undefined)}
            onSave={(line) => writeLine(line, "Forecast updated")}
          />
        ) : (
          <span className="tabular-nums">{financeAmount(Number(getValue()))}</span>
        );
      },
    },
    {
      id: "variance",
      header: "Over/Under",
      size: 126,
      accessorFn: (record) => rowTotals(record).budget - rowTotals(record).forecast,
      meta: { cellClassName: "text-right" },
      cell: ({ getValue }) => <Variance value={Number(getValue())} />,
    },
    {
      id: "owner",
      header: "Owner",
      size: 142,
      accessorFn: (record) => (record.kind === "line" ? record.line.person : ""),
      cell: ({ row }) =>
        row.original.kind === "line" && (
          <div className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarFallback className="text-[9px]">
                {row.original.line.person
                  .split(" ")
                  .map((name) => name[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{row.original.line.person}</span>
          </div>
        ),
    },
    {
      id: "vendor",
      header: "Vendor",
      size: 145,
      accessorFn: (record) => (record.kind === "line" ? record.line.vendor : ""),
    },
    {
      id: "actions",
      size: 44,
      enableHiding: false,
      enableSorting: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const record = row.original;
        if (record.kind === "line") return lineActions(record.line);
        const workstream = record.lines[0]!.workstream;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label={`Actions for ${record.label}`}>
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => addLine(workstream)}>Add Line</DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteIds(record.lines.map((line) => line.id))}
                >
                  Delete Lines
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  const table = useDomainGrid({
    data: rows,
    columns,
    hidden: hiddenColumns,
    onHiddenChange: setHiddenColumns,
    expanded,
    onExpandedChange: setExpanded,
    selection,
    onSelectionChange: setSelection,
    getSubRows: (record) => (record.kind === "group" ? record.children : undefined),
  });
  const footer = (
    <DataGridTableFootRow>
      {table.getVisibleLeafColumns().map((column) => (
        <DataGridTableFootRowCell
          key={column.id}
          className="h-10 whitespace-nowrap bg-muted tabular-nums"
        >
          {column.id === "line" ? (
            "Total"
          ) : column.id === "budget" ? (
            financeAmount(totals.budget)
          ) : column.id === "actual" ? (
            financeAmount(totals.actual)
          ) : column.id === "spent" ? (
            <Badge variant="outline">{percentage(totals.actual, totals.budget)}%</Badge>
          ) : column.id === "forecast" ? (
            financeAmount(totals.forecast)
          ) : column.id === "variance" ? (
            <Variance value={totals.budget - totals.forecast} />
          ) : null}
        </DataGridTableFootRowCell>
      ))}
    </DataGridTableFootRow>
  );

  return (
    <TooltipProvider>
      <section
        aria-label="Project budget"
        className="finance-grid mx-auto w-full max-w-[1216px] px-4 py-8 lg:px-0 lg:py-12"
        data-project-budget
      >
        <h1 className="sr-only">Project budget</h1>
        <DomainGridSurface
          table={table}
          footerContent={footer}
          scrollArea="both"
          layout={{
            cellBorder: true,
            headerSticky: true,
            footerBackground: true,
            dense: density === "compact",
            columnsVisibility: true,
          }}
          renderFrame={(content) => (
            <Frame dense className="min-w-0">
              <FrameHeader className="flex-row items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <FrameTitle>Project Budget</FrameTitle>
                  <FrameDescription>Fulfillment portal rollout</FrameDescription>
                </div>
                <Button
                  ref={addButton}
                  size="sm"
                  aria-label="Add Line"
                  onClick={() => addLine()}
                  className="shrink-0"
                >
                  <Plus data-icon="inline-start" />
                  <span className="hidden sm:inline">Add Line</span>
                </Button>
              </FrameHeader>
              <BudgetHealth lines={lines} />
              <FramePanel className="p-0">
                <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={view}
                    onValueChange={(value) => {
                      const selected = views.find((item) => item.value === value);
                      if (selected) changeView(selected.value);
                    }}
                    className="hidden gap-2 md:flex"
                    aria-label="Show lines"
                  >
                    {views.map(({ value, label, tone }) => (
                      <ToggleGroupItem
                        key={value}
                        value={value}
                        size="sm"
                        data-tone={tone}
                        className="h-7"
                      >
                        {tone && (
                          <span aria-hidden="true" className="finance-dot size-2 rounded-full" />
                        )}
                        {label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <FinanceSelect
                    label="Group lines by"
                    value={group}
                    options={groups}
                    onChange={changeGroup}
                  />
                  <div className="ml-auto w-auto min-w-0 sm:w-56">
                    <FinanceSearch
                      label="Search lines, vendors and people"
                      placeholder="Line, vendor or person..."
                      value={search}
                      onChange={changeSearch}
                    />
                  </div>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={density}
                    onValueChange={(value) => {
                      if (value === "compact" || value === "comfortable") setDensity(value);
                    }}
                    aria-label="Row density"
                    className="gap-1"
                  >
                    <ToggleGroupItem
                      size="sm"
                      value="compact"
                      aria-label="Compact rows"
                      className="size-7 px-0"
                    >
                      <List />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      size="sm"
                      value="comfortable"
                      aria-label="Comfortable rows"
                      className="size-7 px-0"
                    >
                      <Rows3 />
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <DataGridColumnVisibility
                    table={table}
                    trigger={
                      <Button variant="outline" size="xs" aria-label="Columns">
                        <Columns3 data-icon="inline-start" />
                        <span className="hidden sm:inline">Columns</span>
                      </Button>
                    }
                  />
                  <div className="w-full md:hidden">
                    <FinanceSelect
                      label="Show lines"
                      value={view}
                      options={views}
                      onChange={changeView}
                      className="w-full"
                    />
                  </div>
                  {!!selectedIds.length && (
                    <div className="flex w-full items-center justify-between gap-2 border-t pt-2 text-xs">
                      <span>{selectedIds.length} selected</span>
                      <Button
                        variant="destructive"
                        size="xs"
                        onClick={() => setDeleteIds(selectedIds)}
                      >
                        Delete selected
                      </Button>
                    </div>
                  )}
                </div>
                <div data-budget-density={density}>{content}</div>
              </FramePanel>
            </Frame>
          )}
        />
      </section>
      {currentDetail && (
        <BudgetLineSheet
          line={currentDetail}
          tab={detailTab}
          available={
            budgetReserve -
            budgetSummary(lines.filter((line) => line.id !== currentDetail.id)).committed
          }
          related={lines.filter(
            (line) => line.id !== currentDetail.id && line.vendor === currentDetail.vendor,
          )}
          actions={lineActions(currentDetail, true)}
          onTabChange={setDetailTab}
          onClose={() => setDetailId(undefined)}
          onSelect={(line) => openLine(line)}
          onDecision={(line) => {
            writeLine(line, "Budget decision saved");
            setDetailTab("activity");
          }}
          restoreFocus={restoreFocus}
        />
      )}
      {editor && (
        <BudgetEditor
          key={editor.line.id}
          initial={editor.line}
          adding={editor.adding}
          onClose={() => setEditor(undefined)}
          onSave={(line) => {
            writeLine(line, editor.adding ? "Budget line added" : "Budget line saved");
            setEditor(undefined);
          }}
          restoreFocus={restoreFocus}
        />
      )}
      {!!deleteIds.length && (
        <FinanceConfirmation
          title={deleteIds.length === 1 ? "Delete line?" : "Delete selected lines?"}
          description="This removes the line and its forecast from the budget totals."
          action={deleteIds.length === 1 ? "Delete Line" : "Delete Lines"}
          danger
          onCancel={() => setDeleteIds([])}
          onConfirm={deleteLines}
        />
      )}
    </TooltipProvider>
  );
}
