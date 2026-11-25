import { useState, type FormEvent, type ReactNode } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadFile } from "@/lib/download";
import { formatMarginMoney, marginInputCents } from "./margin-currency";
import {
  acquisitionModel,
  allocateCashPlan,
  bookSeries,
  decideBudget,
  financeCsv,
  forecastMonths,
  initialAcquisition,
  initialProjectBudget,
  monthSummary,
  type MarginPageProps,
} from "./margin-model";

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
function monthName(month: string) {
  return monthFormatter.format(new Date(`${month}-01T00:00:00Z`));
}

function downloadTable(name: string, headings: string[], rows: (string | number)[][]) {
  downloadFile(`margin-${name}.csv`, financeCsv(headings, rows), "text/csv");
}

function DollarField({ name, label, cents }: { name: string; label: string; cents: number }) {
  return (
    <Field>
      <FieldLabel htmlFor={`margin-${name}`}>{label}</FieldLabel>
      <Input
        id={`margin-${name}`}
        name={name}
        type="number"
        min={0}
        required
        step="0.01"
        defaultValue={cents / 100}
      />
    </Field>
  );
}

function NumericField({
  name,
  label,
  value,
  min,
  max,
  step = 1,
}: {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`margin-${name}`}>{label}</FieldLabel>
      <Input
        id={`margin-${name}`}
        name={name}
        type="number"
        min={min}
        max={max}
        required
        step={step}
        defaultValue={value}
      />
    </Field>
  );
}

function FinanceMetric({
  name,
  value,
  context,
}: {
  name: string;
  value: string;
  context?: string;
}) {
  return (
    <Frame spacing="sm">
      <FrameHeader>
        <FrameTitle>{name}</FrameTitle>
      </FrameHeader>
      <FramePanel>
        <p className="margin-number text-2xl font-semibold">{value}</p>
        {context && <p className="mt-1 text-xs text-muted-foreground">{context}</p>}
      </FramePanel>
    </Frame>
  );
}

function FinancialTrend({
  title,
  data,
  primary,
  secondary,
}: {
  title: string;
  data: { month: string; first: number; second?: number }[];
  primary: string;
  secondary?: string;
}) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>{title}</FrameTitle>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-[#5876ae]" />
            {primary}
          </span>
          {secondary && (
            <span className="flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full bg-[#468d79]" />
              {secondary}
            </span>
          )}
        </div>
      </FrameHeader>
      <FramePanel>
        <ChartContainer
          className="h-64 w-full"
          config={{
            first: { label: primary, color: "#5876ae" },
            second: { label: secondary, color: "#468d79" },
          }}
        >
          <LineChart
            data={data}
            accessibilityLayer
            margin={{ top: 12, right: 12, left: 4, bottom: 6 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickFormatter={monthName} tickLine={false} axisLine={false} />
            <YAxis
              width={57}
              tickFormatter={(cents: number) => `$${(cents / 100_000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span>
                      {name === "first" ? primary : secondary} {formatMarginMoney(Number(value))}
                    </span>
                  )}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="first"
              stroke="var(--color-first)"
              strokeWidth={3}
              isAnimationActive={false}
            />
            {secondary && (
              <Line
                type="monotone"
                dataKey="second"
                stroke="var(--color-second)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ChartContainer>
      </FramePanel>
    </Frame>
  );
}

function FinanceTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: { key: string; values: ReactNode[] }[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((label) => (
            <TableHead key={label}>{label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ key, values }) => (
          <TableRow key={key}>
            {values.map((value, index) => (
              <TableCell key={headers[index]} className="margin-number">
                {value}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function MarginDashboard({ book }: MarginPageProps) {
  const [month, setMonth] = useState("2026-11");
  const [plan, setPlan] = useState("all");
  const months = bookSeries(book).map((row) => row.month);
  const selectedBook =
    plan === "all"
      ? book
      : { ...book, invoices: book.invoices.filter((invoice) => invoice.plan === plan) };
  const totals = monthSummary(selectedBook, month);
  const companyTotals = plan === "all" ? totals : monthSummary(book, month);
  const series = months.map((period) => monthSummary(selectedBook, period));
  const invoices = selectedBook.invoices.filter((invoice) => invoice.issuedOn.startsWith(month));
  const percent = (value: number | null) => (value === null ? "—" : `${(value / 100).toFixed(1)}%`);
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger aria-label="Activity month">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((period) => (
              <SelectItem key={period} value={period}>
                {monthName(period)} {period.slice(0, 4)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger aria-label="Invoice plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            {["Essential", "Studio", "Partner"].map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() =>
            downloadTable(
              "invoices",
              ["Invoice", "Customer", "Plan", "Issued", "Due", "Net cents"],
              invoices.map((invoice) => [
                invoice.id,
                invoice.customer,
                invoice.plan,
                invoice.issuedOn,
                invoice.dueOn,
                invoice.netCents,
              ]),
            )
          }
        >
          Export invoices CSV
        </Button>
      </div>
      <div className="margin-tiles">
        <FinanceMetric
          name="Net revenue"
          value={formatMarginMoney(totals.netRevenueCents)}
          context={`${totals.invoiceCount} invoices issued`}
        />
        <FinanceMetric name="Gross margin" value={percent(totals.grossMarginBps)} />
        <FinanceMetric
          name="Cash runway"
          value={
            companyTotals.cashRunwayMonths === null
              ? "—"
              : `${companyTotals.cashRunwayMonths.toFixed(1)} months`
          }
          context={
            companyTotals.cashRunwayMonths === null
              ? "Company cash inflows cover this month's outflows"
              : "Company-wide"
          }
        />
        <FinanceMetric name="On-time collections" value={percent(totals.onTimeCollectionBps)} />
      </div>
      <div className="margin-split">
        <FinancialTrend
          title="Monthly performance"
          primary="Net revenue"
          secondary="Gross profit"
          data={series.map((row) => ({
            month: row.month,
            first: row.netRevenueCents,
            second: row.grossProfitCents,
          }))}
        />
        <Frame>
          <FrameHeader>
            <FrameTitle>{monthName(month)} invoices</FrameTitle>
          </FrameHeader>
          <FramePanel>
            {invoices.length ? (
              <FinanceTable
                headers={["Customer", "Plan", "Net"]}
                rows={invoices.map((row) => ({
                  key: row.id,
                  values: [row.customer, row.plan, formatMarginMoney(row.netCents)],
                }))}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No invoices for this plan and month.</p>
            )}
          </FramePanel>
        </Frame>
      </div>
    </>
  );
}

function percentToBps(value: FormDataEntryValue | null) {
  const amount = Number(value);
  if (value === null || value === "" || !Number.isFinite(amount))
    throw new Error("Enter a valid percentage.");
  return Math.round(amount * 100);
}

export function MarginProfitLoss({ book }: MarginPageProps) {
  const actuals = bookSeries(book);
  const latest = actuals.at(-1)!;
  const [assumptions, setAssumptions] = useState(() => ({
    startMonth: "2026-12",
    months: 4,
    revenueCents: latest.netRevenueCents,
    growthBps: 240,
    costRateBps: 4400,
    operatingCents: latest.operatingCents,
  }));
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const planned = forecastMonths(assumptions).map((row) => {
    const revenueCents = adjustments[row.month] ?? row.revenueCents;
    const directCostCents = Math.round((revenueCents * assumptions.costRateBps) / 10000);
    return {
      ...row,
      revenueCents,
      directCostCents,
      profitCents: revenueCents - directCostCents - row.operatingCents,
    };
  });
  const columns = ["Month", "Net revenue", "Direct cost", "Operating expenses", "Operating profit"];
  function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    try {
      const next = {
        ...assumptions,
        months: Number(fields.get("forecast-periods")),
        revenueCents: marginInputCents(fields.get("forecast-start")),
        growthBps: percentToBps(fields.get("forecast-growth")),
        costRateBps: percentToBps(fields.get("forecast-cost")),
        operatingCents: marginInputCents(fields.get("forecast-expenses")),
      };
      forecastMonths(next);
      setAssumptions(next);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Check the forecast inputs.");
    }
  }
  return (
    <>
      <FinancialTrend
        title="Operating results and forecast"
        primary="Net revenue"
        secondary="Operating profit"
        data={[
          ...actuals.map((row) => ({
            month: row.month,
            first: row.netRevenueCents,
            second: row.operatingProfitCents,
          })),
          ...planned.map((row) => ({
            month: row.month,
            first: row.revenueCents,
            second: row.profitCents,
          })),
        ]}
      />
      <Frame>
        <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <FrameTitle>Profit and loss</FrameTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadTable(
                "profit-loss",
                [
                  "Type",
                  "Month",
                  "Revenue cents",
                  "Direct cost cents",
                  "Operating cents",
                  "Profit cents",
                ],
                [
                  ...actuals.map((row) => [
                    "Actual",
                    row.month,
                    row.netRevenueCents,
                    row.directCostCents,
                    row.operatingCents,
                    row.operatingProfitCents,
                  ]),
                  ...planned.map((row) => [
                    "Forecast",
                    row.month,
                    row.revenueCents,
                    row.directCostCents,
                    row.operatingCents,
                    row.profitCents,
                  ]),
                ],
              )
            }
          >
            Export P&L CSV
          </Button>
        </FrameHeader>
        <FramePanel>
          <p className="mb-2 text-sm font-medium">Actuals</p>
          <FinanceTable
            headers={columns}
            rows={actuals.map((row) => ({
              key: row.month,
              values: [
                row.month,
                ...[
                  row.netRevenueCents,
                  row.directCostCents,
                  row.operatingCents,
                  row.operatingProfitCents,
                ].map(formatMarginMoney),
              ],
            }))}
          />
        </FramePanel>
        <FramePanel>
          <p className="mb-2 text-sm font-medium">Forecast</p>
          <FinanceTable
            headers={columns}
            rows={planned.map((row) => ({
              key: row.month,
              values: [
                row.month,
                <Input
                  type="number"
                  min={0}
                  max={1_000_000_000}
                  step="0.01"
                  aria-label={`Forecast revenue for ${row.month}`}
                  className="w-32"
                  value={row.revenueCents / 100}
                  onChange={(event) => {
                    const value = event.currentTarget.valueAsNumber;
                    if (Number.isFinite(value) && value >= 0 && value <= 1_000_000_000)
                      setAdjustments((current) => ({
                        ...current,
                        [row.month]: Math.round(value * 100),
                      }));
                  }}
                />,
                ...[row.directCostCents, row.operatingCents, row.profitCents].map(
                  formatMarginMoney,
                ),
              ],
            }))}
          />
        </FramePanel>
      </Frame>
      <Frame>
        <FrameHeader>
          <FrameTitle>Forecast assumptions</FrameTitle>
        </FrameHeader>
        <FramePanel>
          <form className="margin-field-grid" onSubmit={update}>
            <DollarField
              name="forecast-start"
              label="Starting revenue"
              cents={assumptions.revenueCents}
            />
            <NumericField
              name="forecast-periods"
              label="Months to forecast"
              value={assumptions.months}
              min={1}
              max={12}
            />
            <NumericField
              name="forecast-growth"
              label="Monthly growth (%)"
              value={assumptions.growthBps / 100}
              min={-100}
              max={100}
              step={0.01}
            />
            <NumericField
              name="forecast-cost"
              label="Direct costs (% of revenue)"
              value={assumptions.costRateBps / 100}
              min={0}
              max={100}
              step={0.01}
            />
            <DollarField
              name="forecast-expenses"
              label="Monthly operating expenses"
              cents={assumptions.operatingCents}
            />
            <div className="col-span-full space-y-2">
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit">Recalculate forecast</Button>
            </div>
          </form>
        </FramePanel>
      </Frame>
    </>
  );
}

export function MarginBudgets() {
  const [project, setProject] = useState(initialProjectBudget);
  const [error, setError] = useState("");
  const overrun = Math.max(0, project.spentCents + project.committedCents - project.budgetCents);
  const entries = [
    ["Working budget", project.budgetCents],
    ["Spent", project.spentCents],
    ["Delivery commitment", project.committedCents],
    ["Contingency", project.contingencyCents],
  ] as const;
  function decide(decision: Parameters<typeof decideBudget>[1], value?: FormDataEntryValue | null) {
    try {
      setProject(
        decideBudget(project, decision, value === undefined ? undefined : marginInputCents(value)),
      );
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Budget could not be changed.");
    }
  }
  return (
    <>
      <div className="margin-tiles">
        {entries.map(([name, cents]) => (
          <FinanceMetric key={name} name={name} value={formatMarginMoney(cents)} />
        ))}
      </div>
      <Frame>
        <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <FrameTitle>{project.name}</FrameTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              downloadTable(
                "budget",
                ["Item", "Cents"],
                entries.map(([label, value]) => [label, value]),
              )
            }
          >
            Export budget CSV
          </Button>
        </FrameHeader>
        <FramePanel className="space-y-4">
          <p role="status">{project.decision}</p>
          <p className="margin-number text-sm">
            Forecast overrun <strong>{formatMarginMoney(overrun)}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!overrun} onClick={() => decide("contingency")}>
              Use contingency
            </Button>
            <Button variant="outline" disabled={!overrun} onClick={() => decide("vendor-hold")}>
              Hold vendor to plan
            </Button>
          </div>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              decide("reforecast", new FormData(event.currentTarget).get("commitment"));
            }}
          >
            <DollarField
              key={project.committedCents}
              name="commitment"
              label="Remaining delivery commitment"
              cents={project.committedCents}
            />
            <Button type="submit">Save new forecast</Button>
          </form>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </FramePanel>
      </Frame>
    </>
  );
}

export function MarginScenarios() {
  const [inputs, setInputs] = useState(initialAcquisition);
  const [error, setError] = useState("");
  const result = acquisitionModel(inputs);
  function evaluate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const fields = new FormData(event.currentTarget);
      const next = {
        priceCents: marginInputCents(fields.get("purchase-price")),
        annualIncomeCents: marginInputCents(fields.get("income")),
        termYears: Number(fields.get("loan-term")),
        horizonYears: Number(fields.get("holding-period")),
        annualRateBps: percentToBps(fields.get("interest")),
        downPaymentBps: percentToBps(fields.get("down-payment")),
        appreciationBps: percentToBps(fields.get("appreciation")),
        saleCostBps: percentToBps(fields.get("sale-cost")),
      };
      acquisitionModel(next);
      setInputs(next);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Check the acquisition inputs.");
    }
  }
  return (
    <>
      <div className="margin-tiles">
        <FinanceMetric
          name="Monthly debt service"
          value={formatMarginMoney(result.monthlyPaymentCents)}
        />
        <FinanceMetric
          name="Net gain"
          value={formatMarginMoney(result.netGainCents)}
          context={`${inputs.horizonYears}-year hold`}
        />
        <FinanceMetric
          name="Total return on equity"
          value={`${(result.totalRoiBps / 100).toFixed(1)}%`}
        />
      </div>
      <Frame>
        <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <FrameTitle>Acquisition assumptions</FrameTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadTable(
                  "scenario",
                  ["Result", "Value"],
                  Object.entries(result).map(([name, value]) => [name, value]),
                )
              }
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadFile(
                  "margin-scenario.json",
                  JSON.stringify({ inputs, result }, null, 2),
                  "application/json",
                )
              }
            >
              Export JSON
            </Button>
          </div>
        </FrameHeader>
        <FramePanel>
          <form className="margin-field-grid" onSubmit={evaluate}>
            <DollarField name="purchase-price" label="Purchase price" cents={inputs.priceCents} />
            <DollarField
              name="income"
              label="Annual operating income"
              cents={inputs.annualIncomeCents}
            />
            <NumericField
              name="down-payment"
              label="Down payment (%)"
              value={inputs.downPaymentBps / 100}
              min={0.01}
              max={100}
              step={0.01}
            />
            <NumericField
              name="interest"
              label="Annual interest (%)"
              value={inputs.annualRateBps / 100}
              min={0}
              max={35}
              step={0.01}
            />
            <NumericField
              name="loan-term"
              label="Loan term (years)"
              value={inputs.termYears}
              min={1}
              max={30}
            />
            <NumericField
              name="holding-period"
              label="Hold (years)"
              value={inputs.horizonYears}
              min={5}
              max={20}
            />
            <NumericField
              name="appreciation"
              label="Annual appreciation (%)"
              value={inputs.appreciationBps / 100}
              min={-50}
              max={50}
              step={0.01}
            />
            <NumericField
              name="sale-cost"
              label="Exit cost (%)"
              value={inputs.saleCostBps / 100}
              min={0}
              max={100}
              step={0.01}
            />
            <div className="col-span-full space-y-2">
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit">Recalculate scenario</Button>
            </div>
          </form>
        </FramePanel>
      </Frame>
    </>
  );
}

const cashWeights = [
  { name: "Essential", weight: 46 },
  { name: "Studio", weight: 34 },
  { name: "Partner", weight: 20 },
];

export function MarginCashFlow({ book }: MarginPageProps) {
  const actuals = bookSeries(book);
  const latest = actuals.at(-1)!;
  const [target, setTarget] = useState(latest.cashInCents);
  const [error, setError] = useState("");
  const allocated = allocateCashPlan(
    target,
    cashWeights.map(({ weight }) => weight),
  );
  return (
    <>
      <div className="margin-tiles">
        <FinanceMetric name="Opening cash" value={formatMarginMoney(latest.openingCashCents)} />
        <FinanceMetric name="Net cash movement" value={formatMarginMoney(latest.netCashCents)} />
        <FinanceMetric name="Closing cash" value={formatMarginMoney(latest.closingCashCents)} />
      </div>
      <FinancialTrend
        title="Cash balances and movement"
        primary="Closing cash"
        secondary="Net movement"
        data={actuals.map((point) => ({
          month: point.month,
          first: point.closingCashCents,
          second: point.netCashCents,
        }))}
      />
      <Frame>
        <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <FrameTitle>Customer cash collections plan</FrameTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              downloadTable(
                "cash-plan",
                ["Plan", "Weight", "Allocated cents"],
                cashWeights.map(({ name, weight }, index) => [name, weight, allocated[index]]),
              )
            }
          >
            Export cash plan CSV
          </Button>
        </FrameHeader>
        <FramePanel>
          <form
            className="mb-4 flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              try {
                const next = marginInputCents(new FormData(event.currentTarget).get("collections"));
                allocateCashPlan(
                  next,
                  cashWeights.map(({ weight }) => weight),
                );
                setTarget(next);
                setError("");
              } catch (cause) {
                setError(
                  cause instanceof Error ? cause.message : "Check the planned collections amount.",
                );
              }
            }}
          >
            <DollarField name="collections" label="Target collections" cents={target} />
            <Button type="submit">Share across plans</Button>
          </form>
          {error && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <FinanceTable
            headers={["Plan", "Allocation weight", "Planned collections"]}
            rows={cashWeights.map(({ name, weight }, index) => ({
              key: name,
              values: [name, `${weight}%`, formatMarginMoney(allocated[index])],
            }))}
          />
          <p className="mt-3 text-sm">
            Total plan <strong>{formatMarginMoney(target)}</strong>
          </p>
        </FramePanel>
      </Frame>
    </>
  );
}
