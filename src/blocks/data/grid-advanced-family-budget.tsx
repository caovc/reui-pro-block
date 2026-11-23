import { useMemo, useRef, useState, type RefObject } from "react";
import { Download, Plus, Trash2, Undo2 } from "lucide-react";
import { Filters, type FilterField, type FilterQuery } from "@/components/reui/filters/filters";
import { createFilterQuery } from "@/components/reui/filters/filters-query";
import { DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadFile } from "@/lib/download";
import { FinanceSelect } from "./grid-advanced-finance-controls";
import { DomainGridSurface, useDomainGrid, type DomainColumn } from "./grid-advanced-model-grid";
import { ReuiTrend } from "./trend-foundation";
import {
  PlanningMonth,
  PlanningNumber,
  PlanningProblem,
  PlanningSearch,
  PlanningSummary,
} from "./grid-advanced-planning-controls";
import {
  matchesPlanningFilter,
  planningMoney,
  planningMonth,
  planningMonths,
} from "./grid-advanced-planning-common";
import {
  familyBudgetSections,
  familyBudgetCsv,
  familyBudgetSectionLabels,
  familyCashFlow,
  familyLineForecast,
  familyNetWorth,
  familySectionTotals,
  initialFamilyBalances,
  initialFamilyBudget,
  saveFamilyBudgetLine,
  setFamilyBalance,
  setFamilyBudgetCell,
  type FamilyBalance,
  type FamilyBudgetCell,
  type FamilyBudgetLine,
  type FamilyBudgetSection,
} from "./grid-advanced-family-budget-model";

interface FamilySnapshot {
  lines: FamilyBudgetLine[];
  balances: FamilyBalance[];
}
interface FamilyRow {
  id: string;
  name: string;
  section: FamilyBudgetSection;
  line?: FamilyBudgetLine;
  children?: FamilyRow[];
}
const filterFields: FilterField[] = [
  { id: "name", label: "Budget line", type: "text" },
  {
    id: "section",
    label: "Section",
    type: "select",
    options: familyBudgetSections.map((value) => ({
      value,
      label: familyBudgetSectionLabels[value],
    })),
  },
  {
    id: "owner",
    label: "Owner",
    type: "select",
    options: ["Joint", "Mira", "Jules"].map((value) => ({ value, label: value })),
  },
  { id: "planned", label: "Monthly plan (USD)", type: "number" },
  { id: "actual", label: "Reported actual (USD)", type: "number" },
];
const sectionColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function matchesFamily(line: FamilyBudgetLine, month: number, search: string, query: FilterQuery) {
  const text =
    `${line.name} ${line.owner} ${familyBudgetSectionLabels[line.section]}`.toLowerCase();
  return (
    text.includes(search.trim().toLowerCase()) &&
    matchesPlanningFilter(
      {
        name: line.name,
        section: line.section,
        owner: line.owner,
        planned: line.planned[month] / 100,
        actual: line.actual[month] === null ? null : line.actual[month]! / 100,
      },
      query,
    )
  );
}

function AddFamilyLine({
  onSave,
  triggerRef,
}: {
  onSave: (line: FamilyBudgetLine) => string | undefined;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("Joint");
  const [section, setSection] = useState<FamilyBudgetSection>("expenses");
  const [plan, setPlan] = useState(0);
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setName("");
          setOwner("Joint");
          setSection("expenses");
          setPlan(0);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button ref={triggerRef} size="sm">
          <Plus data-icon="inline-start" />
          Add budget line
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add budget line</DialogTitle>
          <DialogDescription>
            The monthly plan applies to all twelve months. Actuals start as not reported.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const issue = onSave({
              id: crypto.randomUUID(),
              name,
              owner,
              section,
              planned: Array(12).fill(plan),
              actual: Array(12).fill(null),
            });
            if (issue) setError(issue);
            else setOpen(false);
          }}
        >
          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="family-line-name">Line name</FieldLabel>
              <Input
                id="family-line-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={80}
                aria-invalid={!!error}
              />
            </Field>
            <FinanceSelect
              field
              label="Section"
              value={section}
              options={familyBudgetSections.map((value) => ({
                value,
                label: familyBudgetSectionLabels[value],
              }))}
              onChange={setSection}
            />
            <FinanceSelect
              field
              label="Owner"
              value={owner}
              options={["Joint", "Mira", "Jules"].map((value) => ({ value, label: value }))}
              onChange={setOwner}
            />
            <PlanningNumber
              label="Monthly plan"
              value={plan}
              onCommit={(amount) => setPlan(amount ?? 0)}
              onDraftChange={(amount) => setPlan(amount ?? 0)}
            />
          </FieldGroup>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add line</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function familyRowMembers(row: FamilyRow) {
  return row.line ? [row.line] : row.children!.map((child) => child.line!);
}
function familyRowSum(row: FamilyRow, month: number, cell: FamilyBudgetCell) {
  return familyRowMembers(row).reduce((total, line) => total + (line[cell][month] ?? 0), 0);
}

function FamilyMonthGrid({
  lines,
  month,
  search,
  query,
  onEdit,
  onRemove,
}: {
  lines: FamilyBudgetLine[];
  month: number;
  search: string;
  query: FilterQuery;
  onEdit: (id: string, cell: FamilyBudgetCell, amount: number | null) => boolean;
  onRemove: (id: string) => void;
}) {
  const rows = useMemo<FamilyRow[]>(
    () =>
      familyBudgetSections
        .map((section) => ({
          id: `family-section-${section}`,
          name: familyBudgetSectionLabels[section],
          section,
          children: lines
            .filter((line) => line.section === section && matchesFamily(line, month, search, query))
            .map((line) => ({ id: line.id, name: line.name, section, line })),
        }))
        .filter((row) => row.children.length),
    [lines, month, search, query],
  );
  const columns = useMemo<DomainColumn<FamilyRow>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => row.name,
        header: "Budget line",
        size: 260,
        cell: ({ row }) =>
          row.original.line ? (
            <div className="flex min-w-0 flex-col ps-6">
              <span>{row.original.name}</span>
              <span className="text-xs text-muted-foreground">{row.original.line.owner}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <DataGridTableRowExpand row={row} />
              <span
                className="h-5 w-1 rounded-full"
                aria-hidden
                style={{
                  backgroundColor:
                    sectionColors[familyBudgetSections.indexOf(row.original.section)],
                }}
              />
              <strong>{row.original.name}</strong>
              <Badge variant="secondary">{row.original.children!.length}</Badge>
            </div>
          ),
      },
      {
        id: "planned",
        accessorFn: (row) => familyRowSum(row, month, "planned"),
        header: "Plan",
        size: 160,
        cell: ({ row }) =>
          row.original.line ? (
            <PlanningNumber
              dense
              label={`Plan ${row.original.name}`}
              value={row.original.line.planned[month]}
              onCommit={(amount) => onEdit(row.original.id, "planned", amount)}
            />
          ) : (
            <strong>{planningMoney(familyRowSum(row.original, month, "planned"))}</strong>
          ),
      },
      {
        id: "actual",
        accessorFn: (row) => familyRowSum(row, month, "actual"),
        header: "Actual",
        size: 160,
        cell: ({ row }) =>
          row.original.line ? (
            <PlanningNumber
              dense
              nullable
              label={`Actual ${row.original.name}`}
              value={row.original.line.actual[month]}
              onCommit={(amount) => onEdit(row.original.id, "actual", amount)}
            />
          ) : (
            <strong>
              {familyRowMembers(row.original).every((line) => line.actual[month] === null)
                ? "Not reported"
                : planningMoney(familyRowSum(row.original, month, "actual"))}
            </strong>
          ),
      },
      {
        id: "variance",
        accessorFn: (row) =>
          familyRowSum(row, month, "actual") - familyRowSum(row, month, "planned"),
        header: "Actual − plan",
        size: 150,
        cell: ({ row }) =>
          familyRowMembers(row.original).some((line) => line.actual[month] === null)
            ? "—"
            : planningMoney(
                familyRowSum(row.original, month, "actual") -
                  familyRowSum(row.original, month, "planned"),
              ),
      },
      {
        id: "forecast",
        accessorFn: (row) =>
          familyRowMembers(row).reduce((total, line) => total + familyLineForecast(line), 0),
        header: "Year forecast",
        size: 160,
        cell: ({ row }) =>
          planningMoney(
            familyRowMembers(row.original).reduce(
              (total, line) => total + familyLineForecast(line),
              0,
            ),
          ),
      },
      {
        id: "actions",
        header: "",
        size: 56,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) =>
          row.original.line && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${row.original.name}`}
              onClick={() => onRemove(row.original.id)}
            >
              <Trash2 />
            </Button>
          ),
      },
    ],
    [month, onEdit, onRemove],
  );
  const table = useDomainGrid({ data: rows, columns, getSubRows: (row) => row.children });
  return <DomainGridSurface table={table} scrollArea="horizontal" layout={{ cellBorder: true }} />;
}

function FamilyYearGrid({ lines }: { lines: FamilyBudgetLine[] }) {
  const columns = useMemo<DomainColumn<FamilyBudgetLine>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Budget line",
        size: 220,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.name}</span>
            <span className="text-xs text-muted-foreground">
              {familyBudgetSectionLabels[row.original.section]}
            </span>
          </div>
        ),
      },
      ...planningMonths.map((name, month): DomainColumn<FamilyBudgetLine> => ({
        id: `month-${month}`,
        header: name,
        size: 130,
        accessorFn: (line) => line.actual[month] ?? line.planned[month],
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{planningMoney(row.original.actual[month] ?? row.original.planned[month])}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.actual[month] === null ? "Plan forecast" : "Reported actual"}
            </span>
          </div>
        ),
      })),
      {
        id: "annual",
        accessorFn: familyLineForecast,
        header: "Full year",
        size: 150,
        cell: ({ row }) => <strong>{planningMoney(familyLineForecast(row.original))}</strong>,
      },
    ],
    [],
  );
  const table = useDomainGrid({ data: lines, columns });
  return <DomainGridSurface table={table} scrollArea="horizontal" layout={{ cellBorder: true }} />;
}

function FamilyWorthGrid({
  balances,
  onEdit,
}: {
  balances: FamilyBalance[];
  onEdit: (id: string, amount: number) => boolean;
}) {
  const columns = useMemo<DomainColumn<FamilyBalance>[]>(
    () => [
      { id: "name", accessorKey: "name", header: "Account or balance", size: 270 },
      {
        id: "kind",
        accessorKey: "kind",
        header: "Type",
        size: 160,
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.kind === "asset" ? "Asset" : "Liability"}</Badge>
        ),
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: "Current balance",
        size: 190,
        cell: ({ row }) => (
          <PlanningNumber
            dense
            value={row.original.amount}
            label={`Balance ${row.original.name}`}
            onCommit={(amount) => onEdit(row.original.id, amount ?? 0)}
          />
        ),
      },
    ],
    [onEdit],
  );
  const table = useDomainGrid({ data: balances, columns });
  return <DomainGridSurface table={table} scrollArea="horizontal" />;
}

export default function FamilyBudget() {
  const [ledger, setLedger] = useState<FamilySnapshot>(() => ({
    lines: structuredClone(initialFamilyBudget),
    balances: structuredClone(initialFamilyBalances),
  }));
  const [history, setHistory] = useState<FamilySnapshot[]>([]);
  const [month, setMonth] = useState(planningMonth);
  const [view, setView] = useState("month");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [error, setError] = useState<string | null>(null);
  const addTrigger = useRef<HTMLButtonElement>(null);
  const totals = useMemo(() => familySectionTotals(ledger.lines, month), [ledger.lines, month]);
  const cashFlow = useMemo(() => familyCashFlow(ledger.lines), [ledger.lines]);
  const worth = useMemo(() => familyNetWorth(ledger.balances), [ledger.balances]);
  const filtered = useMemo(
    () => ledger.lines.filter((line) => matchesFamily(line, month, search, query)),
    [ledger.lines, month, search, query],
  );
  const save = (next: FamilySnapshot) => {
    setHistory((past) => [...past.slice(-19), ledger]);
    setLedger(next);
    setError(null);
  };
  const edit = (id: string, cell: FamilyBudgetCell, amount: number | null) => {
    const result = setFamilyBudgetCell(ledger.lines, id, month, cell, amount);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    save({ ...ledger, lines: result.value });
    return true;
  };
  const remove = (id: string) => {
    save({ ...ledger, lines: ledger.lines.filter((line) => line.id !== id) });
    requestAnimationFrame(() => addTrigger.current?.focus());
  };
  const income = totals[0].planned;
  const outflow = totals.slice(1).reduce((total, section) => total + section.planned, 0);
  return (
    <section className="reui-reference flex min-w-0 flex-col gap-4" aria-label="Family budget">
      <Frame spacing="sm">
        <FrameHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <FrameTitle role="heading" aria-level={2}>
                Family Budget
              </FrameTitle>
              <FrameDescription>
                Monthly household planning, actuals and balances · USD · 2026
              </FrameDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!history.length}
                onClick={() => {
                  const previous = history.at(-1);
                  if (previous) {
                    setLedger(previous);
                    setHistory((past) => past.slice(0, -1));
                    setError(null);
                  }
                }}
              >
                <Undo2 data-icon="inline-start" />
                Undo
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={view === "worth" ? !ledger.balances.length : !filtered.length}
                onClick={() =>
                  downloadFile(
                    `family-budget-${view}.csv`,
                    familyBudgetCsv(view, month, filtered, ledger.balances),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                <Download data-icon="inline-start" />
                Export CSV
              </Button>
              <AddFamilyLine
                triggerRef={addTrigger}
                onSave={(line) => {
                  const result = saveFamilyBudgetLine(ledger.lines, line);
                  if (!result.ok) return result.error;
                  save({ ...ledger, lines: result.value });
                }}
              />
            </div>
          </div>
        </FrameHeader>
        <FramePanel>
          <PlanningSummary
            items={[
              {
                label: "Planned income",
                value: planningMoney(income),
                detail: `${planningMonths[month]} household income`,
              },
              {
                label: "Planned outflow",
                value: planningMoney(outflow),
                detail: "Bills, expenses, savings and debt payments",
              },
              {
                label: "Planned cash left",
                value: planningMoney(income - outflow),
                detail: "Income less every planned outflow",
              },
              {
                label: "Year cash forecast",
                value: planningMoney(cashFlow.reduce((total, row) => total + row.net, 0)),
                detail: "Actuals where reported; plans for remaining months",
              },
            ]}
          />
        </FramePanel>
        <FramePanel>
          <PlanningProblem message={error} onDismiss={() => setError(null)} />
          <Tabs value={view} onValueChange={setView}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="month">Monthly budget</TabsTrigger>
                <TabsTrigger value="year">Year forecast</TabsTrigger>
                <TabsTrigger value="worth">Net worth</TabsTrigger>
              </TabsList>
              <PlanningMonth value={month} onChange={setMonth} />
            </div>
            {view !== "worth" && (
              <div className="flex flex-wrap items-center gap-3 py-3">
                <PlanningSearch label="Search budget lines" value={search} onChange={setSearch} />
                <Filters
                  fields={filterFields}
                  query={query}
                  onQueryChange={setQuery}
                  variant="advanced"
                  size="sm"
                  showClear
                />
              </div>
            )}
            <TabsContent value="month">
              <p className="mb-3 text-xs text-muted-foreground">
                {filtered.length} of {ledger.lines.length} lines. Blank actuals remain not reported.
                Section subtotals reflect the visible lines.
              </p>
              <FamilyMonthGrid
                lines={ledger.lines}
                month={month}
                search={search}
                query={query}
                onEdit={edit}
                onRemove={remove}
              />
            </TabsContent>
            <TabsContent value="year">
              <p className="mb-3 text-xs text-muted-foreground">
                Reported actuals replace that month’s plan. Unreported months retain their plan.
              </p>
              <FamilyYearGrid lines={filtered} />
            </TabsContent>
            <TabsContent value="worth">
              <div className="flex flex-col gap-4">
                <PlanningSummary
                  items={[
                    {
                      label: "Assets",
                      value: planningMoney(worth.assets),
                      detail: "Current entered account balances",
                    },
                    {
                      label: "Liabilities",
                      value: planningMoney(worth.liabilities),
                      detail: "Outstanding entered debt balances",
                    },
                    {
                      label: "Net worth",
                      value: planningMoney(worth.netWorth),
                      detail: "Assets less liabilities",
                    },
                  ]}
                />
                <p className="text-xs text-muted-foreground">
                  Balances are entered separately from monthly cash flow.
                </p>
                <FamilyWorthGrid
                  balances={ledger.balances}
                  onEdit={(id, amount) => {
                    const result = setFamilyBalance(ledger.balances, id, amount);
                    if (!result.ok) {
                      setError(result.error);
                      return false;
                    }
                    save({ ...ledger, balances: result.value });
                    return true;
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </FramePanel>
        <FramePanel>
          <FrameTitle>Cash flow forecast</FrameTitle>
          <FrameDescription>
            All household lines; income and outflows include savings transfers and debt payments.
          </FrameDescription>
          <ReuiTrend
            label="Household cash flow forecast"
            data={cashFlow.map((row) => ({
              name: planningMonths[row.month],
              income: row.income,
              outflow: row.outflow,
              net: row.net,
            }))}
            series={[
              {
                key: "income",
                label: "Income",
                color: "var(--chart-1)",
                kind: "line",
                curve: "linear",
              },
              {
                key: "outflow",
                label: "Outflow",
                color: "var(--chart-2)",
                kind: "line",
                curve: "linear",
              },
              { key: "net", label: "Cash left", color: "var(--chart-3)", kind: "bar" },
            ]}
            format={planningMoney}
            valueFormat={planningMoney}
            legend
            height={240}
          />
        </FramePanel>
      </Frame>
    </section>
  );
}
