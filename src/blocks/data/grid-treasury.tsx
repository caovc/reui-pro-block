import { NumericField } from "./grid-advanced-shared";
import {
  DataGridTableFootRow,
  DataGridTableFootRowCell,
} from "@/components/reui/data-grid/data-grid-table";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { DomainGridSurface, useDomainGrid, type DomainColumn } from "./grid-advanced-model-grid";
import "./grid-specialized.css";
import { treasurySeed, type TreasuryLine } from "./grid-treasury-data";

type Mode = "Actuals" | "Plan" | "Variance";
type CashTransaction = { name: string; group: string; month: number; amount: number };
const months = ["Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026"];
const sum = (series: number[], indices: number[]) =>
  indices.reduce((total, index) => total + series[index], 0);
function money(value: number) {
  const amount = Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return value < 0 ? `($${amount})` : `$${amount}`;
}
function values(line: TreasuryLine, mode: Mode) {
  return mode === "Actuals"
    ? line.actual
    : mode === "Plan"
      ? line.plan
      : line.actual.map((value, i) => value - line.plan[i]);
}
function FinancialTooltip({
  label,
  title,
  badge,
  description,
  actual,
  plan,
  children,
}: {
  label: string;
  title: string;
  badge: string;
  description: string;
  actual: number;
  plan: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={7} className="grid-finance-tooltip">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded px-1.5 text-[10px] leading-[18px] text-white",
              title === "Critical" || title === "Spike"
                ? "bg-rose-500"
                : title === "Watch" || title === "Timing"
                  ? "bg-amber-500"
                  : "bg-emerald-500",
            )}
          >
            {title}
          </span>
          <span className="text-sm">{badge}</span>
        </div>
        <p className="mt-2">{description}</p>
        <table>
          <tbody>
            {[
              ["Actual", money(actual)],
              ["Plan", money(plan)],
              ["Variance", money(actual - plan)],
            ].map(([name, value]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TooltipContent>
    </Tooltip>
  );
}
function MatchRing({ line, indices }: { line: TreasuryLine; indices: number[] }) {
  const percent = line.score || 0,
    actual = sum(line.actual, indices),
    plan = sum(line.plan, indices);
  return (
    <FinancialTooltip
      title="Plan Match"
      badge={`${percent}%`}
      label={`Plan match ${percent}%. Actual ${money(actual)} versus plan ${money(plan)} in the visible range.`}
      description={
        percent >= 80
          ? "Tracking closely to plan across the visible months."
          : percent >= 65
            ? "Some visible months are drifting from plan."
            : "Meaningful variance from plan across the visible months."
      }
      actual={actual}
      plan={plan}
    >
      <svg
        viewBox="0 0 20 20"
        className={cn("size-4 -rotate-90", percent < 80 ? "text-amber-500" : "text-emerald-500")}
        aria-hidden="true"
      >
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          opacity=".15"
        />
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray={`${percent * 0.5027} 50.27`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs font-normal text-muted-foreground">{percent}%</span>
    </FinancialTooltip>
  );
}
function LineCallout({ line }: { line: TreasuryLine }) {
  const note = line.note || "",
    title = note.split(".")[0],
    description = note.slice(title.length + 2);
  const month = months.findIndex((value) => note.includes(value)),
    index = month < 0 ? 4 : month;
  const Icon =
    title === "Critical" || title === "Spike"
      ? TriangleAlert
      : title === "Watch" || title === "Timing"
        ? CircleHelp
        : CircleCheck;
  const color =
    title === "Critical" || title === "Spike"
      ? "text-rose-500"
      : title === "Watch" || title === "Timing"
        ? "text-amber-500"
        : title === "Stable"
          ? "text-muted-foreground"
          : "text-emerald-500";
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2 text-xs", color)}>
      <span>
        {(line.badge || 0) > 0 ? "+" : ""}
        {line.badge}%
      </span>
      <FinancialTooltip
        title={title}
        badge={months[index]}
        description={description}
        label={note}
        actual={line.actual[index]}
        plan={line.plan[index]}
      >
        <Icon className="size-3.5" />
      </FinancialTooltip>
    </span>
  );
}

export default function TreasuryGrid() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [mode, setMode] = useState<Mode>("Actuals");
  const [expanded, setExpanded] = useState(["cash", "burn"]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("All Lines");
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 3, 1),
    to: new Date(2026, 7, 31),
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 3, 1));
  const [rangeStarted, setRangeStarted] = useState(false);
  const [pageSize, setPageSize] = useState("5");
  const [pageIndex, setPageIndex] = useState(0);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [transaction, setTransaction] = useState({
    name: "",
    group: "income",
    month: "0",
    amount: "",
  });
  const parents = useMemo(() => {
    const result = treasurySeed.map((parent) => ({
      ...parent,
      actual: [...parent.actual],
      plan: [...parent.plan],
      children: parent.children!.map((child) => ({
        ...child,
        actual: [...child.actual],
        plan: [...child.plan],
      })),
    }));
    for (const tx of transactions) {
      const target = result.find((parent) => parent.id === tx.group)!,
        amount = tx.amount * (tx.group === "expenses" ? -1 : 1);
      target.children.push({
        id: `${tx.group}-tx-${target.children.length}`,
        name: tx.name,
        actual: months.map((_, i) => (i === tx.month ? amount : 0)),
        plan: months.map(() => 0),
        badge: 0,
        note: `Stable. ${months[tx.month]} local transaction added to actuals.`,
      });
      target.actual[tx.month] += amount;
      if (tx.group !== "funding") {
        result[1].actual[tx.month] += amount;
        result[1].children[tx.group === "income" ? 0 : 1].actual[tx.month] += amount;
        result[0].children[1].actual[tx.month] += amount;
      } else result[0].children[2].actual[tx.month] += amount;
      result[0].actual = result[0].actual.map((value, i) => value + (i >= tx.month ? amount : 0));
      result[0].children[0].actual = result[0].children[0].actual.map(
        (value, i) => value + (i > tx.month ? amount : 0),
      );
    }
    return result;
  }, [transactions]);
  const first = range?.from?.getMonth() ?? 3,
    last = (range?.to || range?.from)?.getMonth() ?? 7;
  const indices = months.map((_, i) => i).filter((i) => i >= first - 3 && i <= last - 3);
  const hasFilter = !!query || kind !== "All Lines";
  const summary =
    kind === "Revenue"
      ? { line: parents[2], title: "Revenue Subtotal", subtitle: "Collections" }
      : kind === "Funding" || kind === "Liquidity"
        ? { line: parents[4], title: "Funding Subtotal", subtitle: "Capital Inflows" }
        : { line: parents[1], title: "Net Burn", subtitle: "Operating Movement" };
  function shiftRange(offset: number) {
    if (first + offset < 3 || last + offset > 7) return;
    setRange({ from: new Date(2026, first + offset, 1), to: new Date(2026, last + offset + 1, 0) });
    setCalendarMonth(new Date(2026, first + offset, 1));
  }
  function saveTransaction() {
    const amount = Number(transaction.amount);
    if (!transaction.name.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setTransactions((current) => [
      ...current,
      {
        name: transaction.name.trim(),
        group: transaction.group,
        month: Number(transaction.month),
        amount,
      },
    ]);
    setExpanded((current) => [...new Set([...current, transaction.group])]);
    setQuery("");
    setKind("All Lines");
    setTransactionOpen(false);
    setTransaction({ name: "", group: "income", month: "0", amount: "" });
    toast.success("Transaction added to this preview");
  }
  const modelData = useMemo(
    () =>
      parents.map((parent) => ({
        ...parent,
        children: parent.children.map((child) => ({ ...child, category: parent.category })),
      })),
    [parents],
  );
  const columns = useMemo<DomainColumn<TreasuryLine>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Line Item",
        size: 410,
        enableHiding: false,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <div className="flex items-center gap-2 font-medium">
              <button
                aria-label={`${row.getIsExpanded() ? "Hide" : "Show"} details for ${row.original.name}`}
                aria-expanded={row.getIsExpanded()}
                onClick={() => row.toggleExpanded()}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <ChevronRight
                  className={cn(
                    "size-3.5 shrink-0 text-muted-foreground transition-transform",
                    row.getIsExpanded() && "rotate-90",
                  )}
                />
                {row.original.name}
              </button>
              <MatchRing line={row.original} indices={indices} />
            </div>
          ) : (
            <div className="treasury-child-name flex items-center justify-between gap-4 pl-11 text-muted-foreground">
              <span className="truncate">{row.original.name}</span>
              <LineCallout line={row.original} />
            </div>
          ),
      },
      ...indices.map(
        (index) =>
          ({
            id: `month-${index}`,
            accessorFn: (line: TreasuryLine) => values(line, mode)[index],
            header: months[index],
            size: 160,
            cell: ({ row }) => {
              const line = row.original,
                value = values(line, mode)[index],
                plan = line.plan[index],
                variance = line.actual[index] - plan;
              return (
                <span
                  className={cn(
                    "inline-flex items-center justify-end gap-2 tabular-nums",
                    row.getCanExpand() && "font-medium",
                  )}
                >
                  {money(value)}
                  {mode === "Variance" && plan !== 0 && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-normal",
                        variance > 0
                          ? "text-emerald-500"
                          : variance < 0
                            ? "text-rose-500"
                            : "text-muted-foreground",
                      )}
                    >
                      {variance < 0 ? (
                        <TrendingDown className="size-3" />
                      ) : (
                        <TrendingUp className="size-3" />
                      )}
                      {Math.round(Math.abs(variance / plan) * 100)}%
                    </span>
                  )}
                </span>
              );
            },
            meta: { cellClassName: "text-right", headerClassName: "text-right" },
          }) satisfies DomainColumn<TreasuryLine>,
      ),
      { id: "category", accessorKey: "category", enableHiding: false },
    ],
    [mode, indices.join(",")],
  );
  const table = useDomainGrid({
    data: modelData,
    columns,
    search: query,
    filters: kind === "All Lines" ? [] : [{ id: "category", value: kind }],
    alwaysHidden: ["category"],
    getRowId: (line) => line.id,
    getSubRows: (line) => line.children,
    expanded: Object.fromEntries(expanded.map((id) => [id, true])),
    onExpandedChange: (next) =>
      setExpanded(
        next === true
          ? parents.map((parent) => parent.id)
          : Object.keys(next).filter((id) => next[id]),
      ),
    pagination: { pageIndex, pageSize: Number(pageSize) },
    onPaginationChange: (next) => {
      setPageIndex(next.pageIndex);
      setPageSize(String(next.pageSize));
    },
  });
  const filtered = table
    .getFilteredRowModel()
    .rows.filter((row) => row.depth === 0)
    .map((row) => row.original);
  const visibleParents = table
    .getRowModel()
    .rows.filter((row) => row.depth === 0)
    .map((row) => row.original);
  const allExpanded =
    visibleParents.length > 0 && visibleParents.every((parent) => expanded.includes(parent.id));
  return (
    <TooltipProvider delayDuration={100}>
      <Frame
        dense
        variant="ghost"
        role="region"
        aria-label="Treasury finance data grid"
        className="special-grid special-treasury mx-auto my-12 w-full max-w-[1216px] min-w-0 overflow-hidden rounded-2xl border bg-background text-sm text-foreground"
      >
        <FramePanel className="mx-0! mt-0! mb-0! overflow-hidden rounded-none border-0 p-0">
          <div className="treasury-head flex flex-wrap items-center justify-between gap-3 bg-muted/20">
            <div>
              <h2 className="font-semibold">Treasury Waterfall</h2>
              <p className="text-xs text-muted-foreground">
                {filtered.length} Visible Lines · Closing Cash
              </p>
            </div>
            <Button size="sm" onClick={() => setTransactionOpen(true)}>
              <Plus />
              New Transaction
            </Button>
          </div>
          <div className="treasury-tabs flex items-center justify-between gap-2 rounded-t-xl border-y">
            <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
              <TabsList variant="line">
                {(["Actuals", "Plan", "Variance"] as const).map((value) => (
                  <TabsTrigger value={value} key={value}>
                    {value}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button
              size="sm"
              variant="outline"
              disabled={!visibleParents.length}
              onClick={() =>
                setExpanded((current) =>
                  allExpanded
                    ? current.filter((id) => !visibleParents.some((parent) => parent.id === id))
                    : [...new Set([...current, ...visibleParents.map((parent) => parent.id)])],
                )
              }
            >
              {allExpanded ? "Collapse All" : "Expand All"}
            </Button>
          </div>
          <div className="treasury-toolbar flex flex-wrap items-center border-b">
            <div className="treasury-search relative w-64 min-w-0">
              <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
              <Input
                aria-label="Search line items"
                placeholder="Search Line Items"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger
                aria-label="Filter line type"
                className="treasury-kind h-8 w-[168px] text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All Lines", "Liquidity", "Operating", "Revenue", "Funding"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="treasury-range ml-auto flex max-w-full items-center rounded-lg border">
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-r-none"
                aria-label="Previous Range"
                disabled={first === 3}
                onClick={() => shiftRange(-1)}
              >
                <ChevronLeft />
              </Button>
              <Popover
                open={calendarOpen}
                onOpenChange={(open) => {
                  setCalendarOpen(open);
                  if (open) {
                    setRangeStarted(false);
                    setCalendarMonth(new Date(2026, first, 1));
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Choose treasury month range"
                    className="min-w-0 border-x rounded-none font-normal"
                  >
                    {months[first - 3]} - {months[last - 3]}
                    <CalendarDays className="ml-7 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto max-w-[calc(100vw-1rem)] p-0">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    selected={range}
                    startMonth={new Date(2026, 3, 1)}
                    endMonth={new Date(2026, 7, 1)}
                    disabled={{ before: new Date(2026, 3, 1), after: new Date(2026, 7, 31) }}
                    onSelect={(value) => {
                      if (!rangeStarted && value?.from) {
                        setRange({ from: value.from, to: undefined });
                        setRangeStarted(true);
                      } else {
                        setRange(value);
                        if (value?.from && value?.to) {
                          setCalendarOpen(false);
                          setRangeStarted(false);
                        }
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-l-none"
                aria-label="Next Range"
                disabled={last === 7}
                onClick={() => shiftRange(1)}
              >
                <ChevronRight />
              </Button>
            </div>
            {hasFilter && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setKind("All Lines");
                }}
              >
                <X />
                Clear
              </Button>
            )}
          </div>
          <DomainGridSurface
            table={table}
            paginationControls={{ sizes: [5, 10, 25, 50, 100], className: "treasury-pagination" }}
            className="[&_tbody_tr]:h-[37px] [&_td]:px-3 [&_td]:py-2"
            layout={{ cellBorder: true }}
            footerContent={
              <>
                {[
                  {
                    label: "Treasury Summary",
                    title: "Closing Cash",
                    subtitle: mode === "Variance" ? "Actual Vs Plan" : "End Of Month",
                    line: parents[0],
                  },
                  {
                    label: `${filtered.length} Visible ${filtered.length === 1 ? "Line" : "Lines"}`,
                    ...summary,
                  },
                ].map((item) => (
                  <DataGridTableFootRow key={item.title}>
                    <DataGridTableFootRowCell className="treasury-summary border-t bg-muted/35">
                      <p className="text-xs font-normal leading-4 text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-0.5 font-medium">{item.title}</p>
                    </DataGridTableFootRowCell>
                    {indices.map((index) => (
                      <DataGridTableFootRowCell
                        key={index}
                        className="treasury-summary border-t bg-muted/35 text-right"
                      >
                        <p className="text-xs font-normal leading-4 text-muted-foreground">
                          {item.subtitle}
                        </p>
                        <p className="mt-0.5 font-medium tabular-nums">
                          {money(values(item.line, mode)[index])}
                        </p>
                      </DataGridTableFootRowCell>
                    ))}
                  </DataGridTableFootRow>
                ))}
              </>
            }
          />
          <Dialog open={transactionOpen} onOpenChange={setTransactionOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Transaction</DialogTitle>
                <DialogDescription>
                  Add an actual cash movement. Parent totals and closing cash update automatically
                  in this preview.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <Field>
                  <FieldLabel htmlFor="treasury-name">Description</FieldLabel>
                  <Input
                    id="treasury-name"
                    value={transaction.name}
                    onChange={(event) =>
                      setTransaction((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Line</FieldLabel>
                  <Select
                    value={transaction.group}
                    onValueChange={(value) =>
                      setTransaction((current) => ({ ...current, group: value }))
                    }
                  >
                    <SelectTrigger aria-label="Transaction line" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["income", "expenses", "funding"].map((value) => (
                        <SelectItem key={value} value={value}>
                          {value[0].toUpperCase() + value.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Month</FieldLabel>
                  <Select
                    value={transaction.month}
                    onValueChange={(value) =>
                      setTransaction((current) => ({ ...current, month: value }))
                    }
                  >
                    <SelectTrigger aria-label="Transaction month" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, i) => (
                        <SelectItem key={month} value={String(i)}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="treasury-amount">Amount (USD)</FieldLabel>
                  <NumericField
                    label="Amount (USD)"
                    value={Number(transaction.amount) || 0}
                    min={0.01}
                    step={0.01}
                    onValueChange={(value) =>
                      setTransaction((current) => ({ ...current, amount: String(value) }))
                    }
                  />
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTransactionOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={
                    !transaction.name.trim() ||
                    !Number.isFinite(Number(transaction.amount)) ||
                    Number(transaction.amount) <= 0
                  }
                  onClick={saveTransaction}
                >
                  Add transaction
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </FramePanel>
      </Frame>
    </TooltipProvider>
  );
}
