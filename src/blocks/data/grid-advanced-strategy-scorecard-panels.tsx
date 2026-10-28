import { useId, useState, type FormEvent } from "react";
import { Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  MONTHS,
  OWNERS,
  SCORE_STATUS_LABELS,
  createEmptyActuals,
  type Kpi,
  type KpiDirection,
  type ScorecardState,
  type ScoreStatus,
  type ValueUnit,
} from "./grid-advanced-strategy-scorecard-data";
import {
  computeScorecard,
  formatValue,
  validateKpi,
} from "./grid-advanced-strategy-scorecard-model";

// Bricklane original consumer composition. Retain existing ReUI MIT and font OFL
// notices in source/downloads. No upstream fixture data, flags or avatar media.
// Native free Sheet/Dialog/Tabs/Field/Select/NumberField and Chart own interactions.

const actualChartConfig = {
  actual: { label: "Actual", color: "var(--ss14-actual-line, var(--primary))" },
} satisfies ChartConfig;

function StatusBadge({ status }: { status: ScoreStatus }) {
  return (
    <Badge
      variant={status === "off-track" ? "destructive" : "secondary"}
      className="ss14-detail-status"
      data-status={status}
    >
      {SCORE_STATUS_LABELS[status]}
    </Badge>
  );
}

function scoreText(score: number | null): string {
  return score === null ? "–" : `${Math.round(score)}%`;
}

function changeText(change: number | null): string {
  return change === null ? "–" : `${change > 0 ? "+" : ""}${Math.round(change)} pts`;
}

export type ScorecardDetailsProps = {
  state: ScorecardState;
  monthIndex: number;
  kpiId: string | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (kpi: Kpi) => void;
  onRemove: (id: string) => void;
};

export function ScorecardDetails({
  state,
  monthIndex,
  kpiId,
  onOpenChange,
  onEdit,
  onRemove,
}: ScorecardDetailsProps) {
  const item = computeScorecard(state, monthIndex).kpis.find(({ kpi }) => kpi.id === kpiId);
  const objective = state.objectives.find((entry) => entry.id === item?.kpi.objectiveId);
  const perspective = state.perspectives.find((entry) => entry.id === objective?.perspectiveId);
  const month = MONTHS[monthIndex];
  // Original demo display rule: stop this chart at the selected month. The raw
  // Months table keeps all nine periods; upstream other-month behavior is unverified.
  const chartData =
    item?.history.slice(0, monthIndex + 1).map((entry) => ({
      ...entry,
      month: MONTHS[entry.monthIndex]?.shortLabel ?? "",
    })) ?? [];

  return (
    <Sheet open={Boolean(item)} onOpenChange={onOpenChange}>
      {item && (
        <SheetContent className="ss14-details gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
          <SheetHeader className="border-b pr-12">
            <div className="flex flex-wrap items-center gap-2">
              <SheetTitle>{item.kpi.title}</SheetTitle>
              <StatusBadge status={item.status} />
            </div>
            <SheetDescription>
              {perspective?.title}, {objective?.title}
            </SheetDescription>
          </SheetHeader>
          <Tabs key={item.kpi.id} defaultValue="overview" className="min-h-0 flex-1 gap-0">
            <div className="shrink-0 overflow-x-auto px-4 py-2">
              <TabsList variant="line" aria-label="KPI details">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="markets">Markets</TabsTrigger>
                <TabsTrigger value="months">Months</TabsTrigger>
              </TabsList>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <TabsContent value="overview" className="ss14-overview space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <Card size="sm">
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Actual, {month?.shortLabel}</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {formatValue(item.actual, item.kpi.unit)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Target {formatValue(item.kpi.target, item.kpi.unit)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card size="sm">
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Progress</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {scoreText(item.score)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {SCORE_STATUS_LABELS[item.status]}
                      </p>
                    </CardContent>
                  </Card>
                  <Card size="sm">
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Change</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {changeText(item.change)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {monthIndex > 0
                          ? `Since ${MONTHS[monthIndex - 1]?.shortLabel}`
                          : "No earlier month"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <section aria-label="Actual history">
                  <h3 className="font-medium">This Year</h3>
                  <p className="text-xs text-muted-foreground">
                    Actuals to {month?.label}, against the target
                  </p>
                  <ChartContainer
                    config={actualChartConfig}
                    className="ss14-actual-chart mt-3 h-52 w-full aspect-auto"
                    aria-label={`${item.kpi.title} monthly actuals, target ${formatValue(item.kpi.target, item.kpi.unit)}`}
                  >
                    <LineChart
                      accessibilityLayer
                      data={chartData}
                      margin={{ top: 12, right: 12, bottom: 4, left: 4 }}
                    >
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis
                        width={64}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatValue(Number(value), item.kpi.unit)}
                      />
                      <ReferenceLine
                        y={item.kpi.target}
                        ifOverflow="extendDomain"
                        stroke="var(--ss14-target-line, var(--muted-foreground))"
                        strokeDasharray="4 3"
                        label={{ value: "Target", position: "insideTopRight", fontSize: 11 }}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value) => (
                              <span className="tabular-nums">
                                {formatValue(Number(value), item.kpi.unit)}
                              </span>
                            )}
                          />
                        }
                      />
                      <Line
                        dataKey="actual"
                        type="linear"
                        stroke="var(--color-actual)"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </section>
                <section aria-label="KPI definition">
                  <h3 className="font-medium">Definition</h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {item.kpi.description || "How the KPI scores."}
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                    <dt className="text-muted-foreground">Owner</dt>
                    <dd className="flex items-center gap-2">
                      {item.owner && (
                        <Avatar size="sm" aria-hidden="true">
                          <AvatarFallback
                            className="text-white"
                            style={{ backgroundColor: item.owner.color }}
                          >
                            {item.owner.initials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {item.owner?.name ?? "Unassigned"}
                    </dd>
                    <dt className="text-muted-foreground">Weight</dt>
                    <dd>
                      {item.kpi.weight}% of {objective?.title}
                    </dd>
                    <dt className="text-muted-foreground">Baseline</dt>
                    <dd>{formatValue(item.kpi.baseline, item.kpi.unit)}</dd>
                    <dt className="text-muted-foreground">Year End Target</dt>
                    <dd>{formatValue(item.kpi.target, item.kpi.unit)}</dd>
                    <dt className="text-muted-foreground">Direction</dt>
                    <dd>
                      {item.kpi.direction === "higher" ? "Higher is better" : "Lower is better"}
                    </dd>
                  </dl>
                </section>
              </TabsContent>
              <TabsContent value="markets" className="ss14-markets space-y-3">
                <p className="text-sm text-muted-foreground">
                  Company actuals are sales-weighted: US 30%; the remaining market weights are
                  original Bricklane demo assumptions. Raw values use the KPI unit.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Market</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Sales weight</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...item.markets]
                      .sort((left, right) => {
                        if (left.score === null) return right.score === null ? 0 : 1;
                        if (right.score === null) return -1;
                        return left.score - right.score;
                      })
                      .map((entry) => (
                        <TableRow key={entry.market.code}>
                          <TableCell>
                            <span className="font-medium">{entry.market.code}</span>
                            <span className="ml-2 text-muted-foreground">{entry.market.name}</span>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatValue(entry.actual, item.kpi.unit)}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {entry.market.salesWeight}%
                          </TableCell>
                          <TableCell>
                            <span className="mr-2 tabular-nums">{scoreText(entry.score)}</span>
                            <StatusBadge status={entry.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="months" className="ss14-months space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sales-weighted actuals by month. A missing market leaves that company month
                  unscored; zero is a recorded value.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item.history.map((entry) => (
                      <TableRow
                        key={entry.monthIndex}
                        aria-current={entry.monthIndex === monthIndex ? "date" : undefined}
                      >
                        <TableCell>{MONTHS[entry.monthIndex]?.label}</TableCell>
                        <TableCell className="tabular-nums">
                          {formatValue(entry.actual, item.kpi.unit)}
                        </TableCell>
                        <TableCell className="tabular-nums">{scoreText(entry.score)}</TableCell>
                        <TableCell className="tabular-nums">{changeText(entry.change)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </div>
          </Tabs>
          <SheetFooter className="flex-row justify-between border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onEdit(item.kpi);
              }}
            >
              Edit KPI
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onRemove(item.kpi.id);
                onOpenChange(false);
              }}
            >
              Remove KPI
            </Button>
          </SheetFooter>
        </SheetContent>
      )}
    </Sheet>
  );
}

const unitOptions: { value: ValueUnit; label: string }[] = [
  { value: "number", label: "Number" },
  { value: "currency-million", label: "USD millions" },
  { value: "currency", label: "USD" },
  { value: "percent", label: "Percent" },
  { value: "days", label: "Days" },
  { value: "hours", label: "Hours" },
  { value: "minutes", label: "Minutes" },
  { value: "ratio", label: "Ratio" },
  { value: "kg", label: "Kilograms" },
];

function NumericDefinitionField({
  id,
  label,
  value,
  onChange,
  min,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NumberField id={id} value={value} onValueChange={onChange} min={min} step={0.1}>
        <NumberFieldGroup>
          <NumberFieldDecrement aria-label={`Decrease ${label.toLowerCase()}`} />
          <NumberFieldInput aria-label={label} />
          <NumberFieldIncrement aria-label={`Increase ${label.toLowerCase()}`} />
        </NumberFieldGroup>
      </NumberField>
    </Field>
  );
}

export type ScorecardKpiEditorProps = {
  state: ScorecardState;
  initial: Kpi | null;
  objectiveId: string;
  onSave: (kpi: Kpi) => void;
  onCancel: () => void;
};

export function ScorecardKpiEditor({
  state,
  initial,
  objectiveId,
  onSave,
  onCancel,
}: ScorecardKpiEditorProps) {
  const id = useId();
  const [draft, setDraft] = useState<Kpi>(() =>
    initial
      ? structuredClone(initial)
      : {
          id: `kpi-${crypto.randomUUID()}`,
          title: "",
          description: "",
          objectiveId,
          ownerId: OWNERS[0]?.id ?? "",
          unit: "number",
          direction: "higher",
          weight: 0,
          baseline: 0,
          target: 1,
          actuals: createEmptyActuals(null),
        },
  );
  const [weight, setWeight] = useState<number | null>(initial?.weight ?? 0);
  const [baseline, setBaseline] = useState<number | null>(initial?.baseline ?? 0);
  const [target, setTarget] = useState<number | null>(initial?.target ?? 1);
  const [error, setError] = useState<string | null>(null);
  const change = <Key extends keyof Kpi>(key: Key, value: Kpi[Key]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError("Enter a KPI name.");
      return;
    }
    if (
      weight === null ||
      baseline === null ||
      target === null ||
      ![weight, baseline, target].every(Number.isFinite)
    ) {
      setError("Weight, baseline and target must each contain a finite number.");
      return;
    }
    const next: Kpi = { ...draft, title: draft.title.trim(), weight, baseline, target };
    try {
      validateKpi(state, next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review the KPI definition.");
      return;
    }
    setError(null);
    onSave(next);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="ss14-kpi-editor flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit KPI" : "Add KPI"}</DialogTitle>
          <DialogDescription>
            Define an original Bricklane KPI. New KPIs start with nine empty months in every market.
          </DialogDescription>
        </DialogHeader>
        <form
          id={`${id}-form`}
          onSubmit={save}
          noValidate
          className="min-h-0 flex-1 overflow-y-auto px-1 py-1"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
              <Input
                id={`${id}-name`}
                value={draft.title}
                onChange={(event) => change("title", event.target.value)}
                required
                autoComplete="off"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-description`}>Description</FieldLabel>
              <Textarea
                id={`${id}-description`}
                value={draft.description}
                onChange={(event) => change("description", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-objective`}>Objective</FieldLabel>
              <Select
                value={draft.objectiveId}
                onValueChange={(value) => change("objectiveId", value)}
              >
                <SelectTrigger id={`${id}-objective`} className="w-full">
                  <SelectValue placeholder="Select objective" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {state.objectives.map((objective) => (
                      <SelectItem key={objective.id} value={objective.id}>
                        {objective.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-owner`}>Owner</FieldLabel>
              <Select value={draft.ownerId} onValueChange={(value) => change("ownerId", value)}>
                <SelectTrigger id={`${id}-owner`} className="w-full">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {OWNERS.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-unit`}>Unit</FieldLabel>
              <Select
                value={draft.unit}
                onValueChange={(value) => change("unit", value as ValueUnit)}
              >
                <SelectTrigger id={`${id}-unit`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                USD millions uses 1.88 for $1.88M; percent uses 64.2 for 64.2%. Changing the unit
                relabels existing raw values and does not convert them.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-direction`}>Direction</FieldLabel>
              <Select
                value={draft.direction}
                onValueChange={(value) => change("direction", value as KpiDirection)}
              >
                <SelectTrigger id={`${id}-direction`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="higher">Higher is better</SelectItem>
                    <SelectItem value="lower">Lower is better</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <NumericDefinitionField
              id={`${id}-weight`}
              label="Weight (%)"
              value={weight}
              onChange={setWeight}
              min={0}
            />
            <NumericDefinitionField
              id={`${id}-baseline`}
              label="Baseline"
              value={baseline}
              onChange={setBaseline}
            />
            <NumericDefinitionField
              id={`${id}-target`}
              label="Target"
              value={target}
              onChange={setTarget}
            />
            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" form={`${id}-form`}>
            Save KPI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
