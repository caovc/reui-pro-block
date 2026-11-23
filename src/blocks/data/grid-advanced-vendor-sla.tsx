import { useId, useMemo, useRef, useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  planningCsv,
  planningMoney,
  planningMonth,
  planningMonths,
  planningPercent,
  type PlanningResult,
} from "./grid-advanced-planning-common";
import {
  discardSlaClaim,
  draftSlaClaim,
  initialVendorSla,
  issueSlaCureNotice,
  refreshSlaClaim,
  resolveSlaCureNotice,
  setSlaActual,
  setSlaTarget,
  slaMetricGap,
  slaMonthReview,
  slaReviewDate,
  transitionSlaClaim,
  type SlaClaim,
  type SlaContract,
  type SlaCureNotice,
  type SlaMetric,
  type VendorSlaState,
} from "./grid-advanced-vendor-sla-model";

interface SlaRow {
  id: string;
  name: string;
  metric?: SlaMetric;
  contract?: SlaContract;
  children?: SlaRow[];
}
const gapLabel = (gap: number | null) =>
  gap === null ? "Not reported" : `${gap > 0 ? "+" : ""}${gap} bps`;
const slaFilterFields: FilterField[] = [
  { id: "name", label: "SLA measure", type: "text" },
  {
    id: "area",
    label: "Area",
    type: "select",
    options: [...new Set(initialVendorSla.contracts.map((row) => row.area))].map((value) => ({
      value,
      label: value,
    })),
  },
  {
    id: "vendor",
    label: "Vendor",
    type: "select",
    options: [...new Set(initialVendorSla.contracts.map((row) => row.vendor))].map((value) => ({
      value,
      label: value,
    })),
  },
  {
    id: "site",
    label: "Site",
    type: "select",
    options: initialVendorSla.contracts.map((row) => ({ value: row.site, label: row.site })),
  },
];

function matchesSlaMeasure(
  metric: SlaMetric,
  contract: SlaContract,
  search: string,
  query: FilterQuery,
) {
  return (
    `${contract.site} ${contract.vendor} ${contract.area} ${metric.name}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()) &&
    matchesPlanningFilter(
      { name: metric.name, site: contract.site, vendor: contract.vendor, area: contract.area },
      query,
    )
  );
}

function MetricHistory({ metric, contract }: { metric: SlaMetric; contract: SlaContract }) {
  const data = useMemo(
    () =>
      planningMonths.map((name, month) => ({
        name,
        actual: metric.actual[month],
        target: metric.targetBps,
      })),
    [metric],
  );
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" aria-label={`History ${contract.site} ${metric.name}`}>
          History
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {contract.site} · {metric.name}
          </SheetTitle>
          <SheetDescription>
            2026 reported measures. The current target applies to the full review year.
          </SheetDescription>
        </SheetHeader>
        <ReuiTrend
          label={`${contract.site} ${metric.name} monthly performance`}
          data={data}
          series={[
            {
              key: "actual",
              label: "Reported actual",
              color: "var(--chart-1)",
              kind: "line",
              curve: "linear",
              dots: true,
            },
            {
              key: "target",
              label: "Target",
              color: "var(--chart-2)",
              kind: "line",
              curve: "linear",
              dashed: true,
            },
          ]}
          format={planningPercent}
          valueFormat={planningPercent}
          legend
          height={260}
        />
        <p className="text-sm">
          Target {metric.direction === "at-least" ? "at least" : "at most"}{" "}
          {planningPercent(metric.targetBps)} · credit rate {planningPercent(metric.creditBps)}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {planningMonths.map((name, month) => (
            <div key={name} className="flex items-center justify-between gap-2 border-b py-2">
              <span>{name}</span>
              <span>
                {metric.actual[month] === null
                  ? "Not reported"
                  : planningPercent(metric.actual[month]!)}
              </span>
              <span className="text-xs text-muted-foreground">
                {gapLabel(slaMetricGap(metric, month))}
              </span>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SlaRecordDialog({
  kind,
  options,
  month,
  onSave,
}: {
  kind: "claim" | "notice";
  options: { value: string; label: string }[];
  month: number;
  onSave: (input: { target: string; note: string; dueDate: string }) => string | undefined;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(options[0]?.value ?? "");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("2026-12-07");
  const [error, setError] = useState<string | null>(null);
  const title = kind === "claim" ? "Draft service claim" : "Record cure notice";
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setTarget(options[0]?.value ?? "");
          setNote("");
          setError(null);
          setDueDate("2026-12-07");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={kind === "claim" ? "default" : "outline"}
          disabled={!options.length}
        >
          <Plus data-icon="inline-start" />
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {planningMonths[month]} 2026 ·{" "}
            {kind === "claim"
              ? "The draft captures the capped allocation for the selected vendor site."
              : "Record the corrective action for a reported SLA breach."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const issue = onSave({ target, note, dueDate });
            if (issue) setError(issue);
            else setOpen(false);
          }}
        >
          <FieldGroup>
            <FinanceSelect
              field
              label={kind === "claim" ? "Vendor site" : "Breached measure"}
              value={target}
              options={options}
              onChange={setTarget}
            />
            {kind === "notice" && (
              <Field>
                <FieldLabel htmlFor={`${id}-date`}>Due date</FieldLabel>
                <Input
                  id={`${id}-date`}
                  type="date"
                  value={dueDate}
                  min={slaReviewDate}
                  required
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor={`${id}-note`}>
                {kind === "claim" ? "Claim note" : "Corrective action"}
              </FieldLabel>
              <Textarea
                id={`${id}-note`}
                value={note}
                required
                maxLength={1000}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
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
            <Button type="submit">{kind === "claim" ? "Create draft" : "Record notice"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function slaRowCredit(row: SlaRow, allocated: ReadonlyMap<string, { credit: number }>): number {
  return row.metric
    ? allocated.get(row.metric.id)!.credit
    : (row.children ?? []).reduce((total, child) => total + slaRowCredit(child, allocated), 0);
}

function SlaReviewGrid({
  state,
  month,
  search,
  query,
  onActual,
  onTarget,
}: {
  state: VendorSlaState;
  month: number;
  search: string;
  query: FilterQuery;
  onActual: (id: string, amount: number | null) => boolean;
  onTarget: (id: string, target: number) => boolean;
}) {
  const review = useMemo(
    () => slaMonthReview({ contracts: state.contracts, metrics: state.metrics }, month),
    [state.contracts, state.metrics, month],
  );
  const allocated = useMemo(
    () =>
      new Map(review.flatMap((site) => site.metrics.map((metric) => [metric.id, metric] as const))),
    [review],
  );
  const data = useMemo<SlaRow[]>(
    () =>
      [...new Set(state.contracts.map((contract) => contract.area))]
        .map((area) => ({
          id: `sla-area-${area}`,
          name: area,
          children: state.contracts
            .filter((contract) => contract.area === area)
            .map((contract) => ({
              id: `sla-site-${contract.id}`,
              name: contract.site,
              contract,
              children: state.metrics
                .filter((metric) => metric.contractId === contract.id)
                .filter((metric) => matchesSlaMeasure(metric, contract, search, query))
                .map((metric) => ({ id: metric.id, name: metric.name, metric, contract })),
            }))
            .filter((contract) => contract.children.length),
        }))
        .filter((area) => area.children.length),
    [state.contracts, state.metrics, search, query],
  );
  const columns = useMemo<DomainColumn<SlaRow>[]>(
    () => [
      {
        id: "name",
        header: "Area / site / measure",
        accessorFn: (row) => row.name,
        size: 290,
        cell: ({ row }) =>
          row.original.metric ? (
            <div className="ps-8">{row.original.name}</div>
          ) : (
            <div className="flex items-center gap-2">
              <DataGridTableRowExpand row={row} />
              <div>
                <strong>{row.original.name}</strong>
                {row.original.contract && (
                  <p className="text-xs text-muted-foreground">
                    {row.original.contract.vendor} · {row.original.contract.activeDays[month]}{" "}
                    active days · fee {planningMoney(row.original.contract.monthlyFee)} · cap{" "}
                    {planningPercent(row.original.contract.capBps)}
                  </p>
                )}
              </div>
            </div>
          ),
      },
      {
        id: "target",
        header: "Target (%)",
        accessorFn: (row) => row.metric?.targetBps ?? 0,
        size: 155,
        cell: ({ row }) =>
          row.original.metric && (
            <PlanningNumber
              dense
              kind="percent"
              label={`Target ${row.original.contract!.site} ${row.original.name}`}
              value={row.original.metric.targetBps}
              onCommit={(amount) => onTarget(row.original.id, amount ?? 0)}
            />
          ),
      },
      {
        id: "actual",
        header: "Actual (%)",
        accessorFn: (row) => row.metric?.actual[month] ?? 0,
        size: 155,
        cell: ({ row }) =>
          row.original.metric && (
            <PlanningNumber
              dense
              nullable
              kind="percent"
              label={`Actual ${row.original.contract!.site} ${row.original.name}`}
              value={row.original.metric.actual[month]}
              onCommit={(amount) => onActual(row.original.id, amount)}
            />
          ),
      },
      {
        id: "gap",
        header: "Gap to target",
        accessorFn: (row) => (row.metric ? (slaMetricGap(row.metric, month) ?? 0) : 0),
        size: 150,
        cell: ({ row }) => {
          if (!row.original.metric) return null;
          const gap = slaMetricGap(row.original.metric, month);
          return (
            <Badge variant={gap !== null && gap < 0 ? "destructive" : "secondary"}>
              {gapLabel(gap)}
            </Badge>
          );
        },
      },
      {
        id: "credit",
        header: "Allocated credit",
        accessorFn: (row) => slaRowCredit(row, allocated),
        size: 155,
        cell: ({ row }) => <strong>{planningMoney(slaRowCredit(row.original, allocated))}</strong>,
      },
      {
        id: "year",
        header: "12-month gap",
        size: 220,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.metric && (
            <ReuiTrend
              compact
              label={`${row.original.contract!.site} ${row.original.name} gap`}
              height={58}
              hideXAxis
              hideYAxis
              grid={false}
              data={planningMonths.map((name, index) => ({
                name,
                gap: slaMetricGap(row.original.metric!, index),
              }))}
              series={[{ key: "gap", label: "Gap", color: "var(--chart-2)", kind: "bar" }]}
              format={gapLabel}
              valueFormat={gapLabel}
            />
          ),
      },
      {
        id: "history",
        header: "",
        size: 105,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.metric && (
            <MetricHistory metric={row.original.metric} contract={row.original.contract!} />
          ),
      },
    ],
    [month, allocated, onActual, onTarget],
  );
  const table = useDomainGrid({ data, columns, getSubRows: (row) => row.children });
  return <DomainGridSurface table={table} scrollArea="horizontal" layout={{ cellBorder: true }} />;
}

function ClaimReviewDialog({
  claim,
  contract,
  onDecision,
}: {
  claim: SlaClaim;
  contract: SlaContract;
  onDecision: (status: "approved" | "rejected", amount: number) => string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(claim.requested);
  const [error, setError] = useState<string | null>(null);
  const columns = useMemo<DomainColumn<SlaClaim["measurements"][number]>[]>(
    () => [
      { id: "name", header: "Reviewed measure", accessorKey: "name", size: 210 },
      {
        id: "actual",
        header: "Actual",
        accessorKey: "actual",
        size: 120,
        cell: ({ row }) => planningPercent(row.original.actual),
      },
      {
        id: "target",
        header: "Target",
        accessorKey: "targetBps",
        size: 120,
        cell: ({ row }) => planningPercent(row.original.targetBps),
      },
      {
        id: "credit",
        header: "Credit",
        accessorKey: "credit",
        size: 130,
        cell: ({ row }) => planningMoney(row.original.credit),
      },
    ],
    [],
  );
  const table = useDomainGrid({
    data: claim.measurements,
    columns,
    getRowId: (row) => row.metricId,
  });
  const decide = (status: "approved" | "rejected") => {
    const issue = onDecision(status, status === "approved" ? amount : 0);
    if (issue) setError(issue);
    else setOpen(false);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setAmount(claim.requested);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {claim.id}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[min(48rem,calc(100vw-2rem))]">
        <DialogHeader>
          <DialogTitle>Service claim {claim.id}</DialogTitle>
          <DialogDescription>
            {contract.site} · {contract.vendor} · {planningMonths[claim.month]} 2026 ·{" "}
            {claim.status}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">{claim.note}</p>
        <p className="font-medium">Requested {planningMoney(claim.requested)}</p>
        <DomainGridSurface table={table} scrollArea="horizontal" />
        {claim.status === "submitted" ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              decide("approved");
            }}
          >
            <FieldGroup>
              <PlanningNumber
                label="Approved credit"
                value={amount}
                max={claim.requested / 100}
                onCommit={(next) => setAmount(next ?? 0)}
                onDraftChange={(next) => setAmount(next ?? 0)}
              />
            </FieldGroup>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => decide("rejected")}>
                Reject claim
              </Button>
              <Button type="submit">Approve credit</Button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground">
            {claim.status === "draft"
              ? "Refresh the calculation if the measures change before submission."
              : `Recorded approval: ${claim.approved === null ? "Not reviewed" : planningMoney(claim.approved)}`}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SlaClaimsGrid({
  state,
  onAction,
  onDiscard,
}: {
  state: VendorSlaState;
  onAction: (
    id: string,
    action: "refresh" | "submitted" | "approved" | "rejected",
    amount?: number,
  ) => string | undefined;
  onDiscard: (id: string) => void;
}) {
  const columns = useMemo<DomainColumn<SlaClaim>[]>(
    () => [
      {
        id: "id",
        header: "Claim",
        accessorKey: "id",
        size: 185,
        cell: ({ row }) => (
          <ClaimReviewDialog
            claim={row.original}
            contract={state.contracts.find((contract) => contract.id === row.original.contractId)!}
            onDecision={(action, amount) => onAction(row.original.id, action, amount)}
          />
        ),
      },
      {
        id: "site",
        header: "Vendor site",
        accessorFn: (claim) =>
          state.contracts.find((contract) => contract.id === claim.contractId)!.site,
        size: 180,
      },
      {
        id: "month",
        header: "Month",
        accessorKey: "month",
        size: 110,
        cell: ({ row }) => planningMonths[row.original.month],
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        size: 125,
        cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
      },
      {
        id: "requested",
        header: "Requested",
        accessorKey: "requested",
        size: 145,
        cell: ({ row }) => planningMoney(row.original.requested),
      },
      {
        id: "approved",
        header: "Approved",
        accessorFn: (claim) => claim.approved ?? 0,
        size: 145,
        cell: ({ row }) =>
          row.original.approved === null ? "Not reviewed" : planningMoney(row.original.approved),
      },
      {
        id: "actions",
        header: "Actions",
        size: 290,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            {row.original.status === "draft" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(row.original.id, "refresh")}
                >
                  Refresh
                </Button>
                <Button size="sm" onClick={() => onAction(row.original.id, "submitted")}>
                  Submit claim
                </Button>
              </>
            )}
            {(row.original.status === "draft" || row.original.status === "rejected") && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Discard ${row.original.id}`}
                onClick={() => onDiscard(row.original.id)}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [state.contracts, onAction, onDiscard],
  );
  const table = useDomainGrid({ data: state.claims, columns });
  return <DomainGridSurface table={table} scrollArea="horizontal" />;
}

function SlaNoticesGrid({
  state,
  onResolve,
}: {
  state: VendorSlaState;
  onResolve: (id: string) => void;
}) {
  const columns = useMemo<DomainColumn<SlaCureNotice>[]>(
    () => [
      { id: "id", header: "Cure notice", accessorKey: "id", size: 180 },
      {
        id: "metric",
        header: "Site / measure",
        size: 270,
        accessorFn: (notice) => state.metrics.find((metric) => metric.id === notice.metricId)!.name,
        cell: ({ row }) => {
          const metric = state.metrics.find((candidate) => candidate.id === row.original.metricId)!;
          const contract = state.contracts.find((candidate) => candidate.id === metric.contractId)!;
          return (
            <div className="flex flex-col">
              <span>{contract.site}</span>
              <span className="text-xs text-muted-foreground">
                {metric.name} · {planningMonths[row.original.month]}
              </span>
            </div>
          );
        },
      },
      { id: "dueDate", header: "Due date", accessorKey: "dueDate", size: 140 },
      {
        id: "note",
        header: "Corrective action",
        accessorKey: "note",
        size: 300,
        cell: ({ row }) => <span className="whitespace-normal">{row.original.note}</span>,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        size: 130,
        cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
      },
      {
        id: "action",
        header: "",
        size: 170,
        enableSorting: false,
        cell: ({ row }) => {
          const metric = state.metrics.find((candidate) => candidate.id === row.original.metricId)!;
          const gap = slaMetricGap(metric, row.original.month);
          return (
            <Button
              size="sm"
              variant="outline"
              disabled={row.original.status !== "open" || gap === null || gap < 0}
              onClick={() => onResolve(row.original.id)}
            >
              Resolve notice
            </Button>
          );
        },
      },
    ],
    [state.metrics, state.contracts, onResolve],
  );
  const table = useDomainGrid({ data: state.notices, columns });
  return <DomainGridSurface table={table} scrollArea="horizontal" />;
}

export default function VendorSlaScorecard() {
  const [ledger, setLedger] = useState(() => structuredClone(initialVendorSla));
  const [history, setHistory] = useState<VendorSlaState[]>([]);
  const [month, setMonth] = useState(planningMonth);
  const [view, setView] = useState("review");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef({ claim: 1, notice: 1 });
  const undoTrigger = useRef<HTMLButtonElement>(null);
  const review = useMemo(
    () => slaMonthReview({ contracts: ledger.contracts, metrics: ledger.metrics }, month),
    [ledger.contracts, ledger.metrics, month],
  );
  const measures = review.flatMap((site) => site.metrics);
  const breached = measures.filter((measure) => measure.breached);
  const reported = measures.filter((measure) => measure.actual !== null);
  const credits = review.reduce((total, site) => total + site.credit, 0);
  const trends = useMemo(
    () =>
      planningMonths.map((name, index) => ({
        name,
        credits: slaMonthReview(
          { contracts: ledger.contracts, metrics: ledger.metrics },
          index,
        ).reduce((sum, site) => sum + site.credit, 0),
      })),
    [ledger.contracts, ledger.metrics],
  );
  const save = (result: PlanningResult<VendorSlaState>) => {
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setHistory((past) => [...past.slice(-19), ledger]);
    setLedger(result.value);
    setError(null);
    return true;
  };
  const commitClaims = (result: PlanningResult<SlaClaim[]>) =>
    result.ok ? save({ ok: true, value: { ...ledger, claims: result.value } }) : save(result);
  const claimAction = (
    id: string,
    action: "refresh" | "submitted" | "approved" | "rejected",
    amount?: number,
  ) => {
    const result =
      action === "refresh"
        ? refreshSlaClaim(ledger, id)
        : transitionSlaClaim(ledger, id, action, amount);
    if (!result.ok) {
      setError(result.error);
      return result.error;
    }
    commitClaims(result);
  };
  return (
    <section
      className="reui-reference flex min-w-0 flex-col gap-4"
      aria-label="Vendor SLA scorecard"
    >
      <Frame spacing="sm">
        <FrameHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <FrameTitle role="heading" aria-level={2}>
                Vendor SLA Scorecard
              </FrameTitle>
              <FrameDescription>
                Monthly outsourced-fulfilment review, local claims and cure notices · 2026
              </FrameDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                ref={undoTrigger}
                variant="outline"
                size="sm"
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
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadFile(
                    "vendor-sla-review.csv",
                    planningCsv(
                      review.flatMap((site) =>
                        site.metrics
                          .filter((row) =>
                            matchesSlaMeasure(row.metric, site.contract, search, query),
                          )
                          .map((row) => ({
                            Area: site.contract.area,
                            Site: site.contract.site,
                            Vendor: site.contract.vendor,
                            Month: planningMonths[month],
                            Measure: row.metric.name,
                            Target: planningPercent(row.metric.targetBps),
                            Actual:
                              row.actual === null ? "Not reported" : planningPercent(row.actual),
                            GapBps: row.gap ?? "Not reported",
                            CreditUSD: row.credit / 100,
                          })),
                      ),
                    ),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                <Download data-icon="inline-start" />
                Export visible review
              </Button>
            </div>
          </div>
        </FrameHeader>
        <FramePanel>
          <PlanningSummary
            items={[
              {
                label: "Reported measures",
                value: `${reported.length} / ${measures.length}`,
                detail: `All vendor sites · ${planningMonths[month]}`,
              },
              {
                label: "SLA breaches",
                value: String(breached.length),
                detail: "Unreported measures are not treated as compliant",
              },
              {
                label: "Eligible service credit",
                value: planningMoney(credits),
                detail: "Active-day pro rata and one shared cap per site",
              },
              {
                label: "Approved claims",
                value: planningMoney(
                  ledger.claims.reduce((sum, claim) => sum + (claim.approved ?? 0), 0),
                ),
                detail: "All recorded months; reviewed claim snapshots",
              },
            ]}
          />
        </FramePanel>
        <FramePanel>
          <PlanningProblem message={error} onDismiss={() => setError(null)} />
          <Tabs value={view} onValueChange={setView}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="review">SLA review</TabsTrigger>
                <TabsTrigger value="claims">Claims</TabsTrigger>
                <TabsTrigger value="notices">Cure notices</TabsTrigger>
              </TabsList>
              <PlanningMonth value={month} onChange={setMonth} />
            </div>
            <div className="flex flex-wrap items-center gap-3 py-3">
              <SlaRecordDialog
                kind="claim"
                month={month}
                options={review
                  .filter((site) => site.credit > 0)
                  .map((site) => ({
                    value: site.contract.id,
                    label: `${site.contract.site} · ${planningMoney(site.credit)}`,
                  }))}
                onSave={({ target, note }) => {
                  const result = draftSlaClaim(ledger, {
                    id: `CLAIM-2026-${sequence.current.claim}`,
                    contractId: target,
                    month,
                    note,
                  });
                  if (!result.ok) return result.error;
                  commitClaims(result);
                  sequence.current.claim += 1;
                }}
              />
              <SlaRecordDialog
                kind="notice"
                month={month}
                options={breached.map((row) => ({
                  value: row.id,
                  label: `${ledger.contracts.find((contract) => contract.id === row.metric.contractId)!.site} · ${row.metric.name}`,
                }))}
                onSave={({ target, note, dueDate }) => {
                  const result = issueSlaCureNotice(ledger, {
                    id: `CURE-2026-${sequence.current.notice}`,
                    metricId: target,
                    month,
                    note,
                    dueDate,
                  });
                  if (!result.ok) return result.error;
                  save({ ok: true, value: { ...ledger, notices: result.value } });
                  sequence.current.notice += 1;
                }}
              />
            </div>
            <TabsContent value="review">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <PlanningSearch label="Search SLA measures" value={search} onChange={setSearch} />
                  <Filters
                    fields={slaFilterFields}
                    query={query}
                    onQueryChange={setQuery}
                    variant="advanced"
                    size="sm"
                    showClear
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Targets apply to the full year. Negative gaps miss the SLA. Each site’s total
                  credit is capped once, then allocated across its eligible breaches.
                </p>
                <SlaReviewGrid
                  state={ledger}
                  month={month}
                  search={search}
                  query={query}
                  onActual={(id, amount) => {
                    const result = setSlaActual(ledger.metrics, id, month, amount);
                    return result.ok
                      ? save({ ok: true, value: { ...ledger, metrics: result.value } })
                      : save(result);
                  }}
                  onTarget={(id, target) => {
                    const result = setSlaTarget(ledger.metrics, id, target);
                    return result.ok
                      ? save({ ok: true, value: { ...ledger, metrics: result.value } })
                      : save(result);
                  }}
                />
              </div>
            </TabsContent>
            <TabsContent value="claims">
              <p className="mb-3 text-xs text-muted-foreground">
                All claim months. Refresh changed drafts before submission. Submitted claims keep
                their reviewed measures and requested amount.
              </p>
              <SlaClaimsGrid
                state={ledger}
                onAction={claimAction}
                onDiscard={(id) => {
                  if (commitClaims(discardSlaClaim(ledger, id)))
                    requestAnimationFrame(() => undoTrigger.current?.focus());
                }}
              />
            </TabsContent>
            <TabsContent value="notices">
              <p className="mb-3 text-xs text-muted-foreground">
                All notice months. Record a recovered measure at or above its required performance
                before resolving its notice.
              </p>
              <SlaNoticesGrid
                state={ledger}
                onResolve={(id) => {
                  const result = resolveSlaCureNotice(ledger, id);
                  if (result.ok) save({ ok: true, value: { ...ledger, notices: result.value } });
                  else save(result);
                }}
              />
            </TabsContent>
          </Tabs>
        </FramePanel>
        <FramePanel>
          <FrameTitle>Recorded service credit trend</FrameTitle>
          <FrameDescription>
            All vendor sites. Unreported months have no eligible credits.
          </FrameDescription>
          <ReuiTrend
            label="Vendor service credits by month"
            data={trends}
            series={[
              {
                key: "credits",
                label: "Eligible service credit",
                color: "var(--chart-1)",
                kind: "line",
                curve: "linear",
                dots: true,
              },
            ]}
            format={planningMoney}
            valueFormat={planningMoney}
            height={240}
          />
        </FramePanel>
      </Frame>
    </section>
  );
}
