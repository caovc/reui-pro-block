import { useId, useState, type ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { CalendarDays, Minus, Pencil, Plus } from "lucide-react";
import { Alert, AlertAction, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FinanceSelect } from "./grid-advanced-finance-controls";
import {
  financeAmount,
  financeDate,
  daysBetween,
  shiftFinanceDate,
  percentage,
  budgetOf,
  budgetPeople,
  budgetState,
  budgetToday,
  budgetVendors,
  budgetWorkstreams,
  canSaveBudgetLine,
  forecastOf,
  varianceOf,
  type BudgetBasis,
  type BudgetDecision,
  type BudgetLine,
} from "./grid-advanced-project-budget-model";

const optionsFor = <T extends string>(values: readonly T[]) =>
  values.map((value) => ({ value, label: value }));

const basisOptions: { value: BudgetBasis; label: string }[] = [
  { value: "hours", label: "Hours" },
  { value: "months", label: "Months" },
  { value: "fixed", label: "Fixed fee" },
];

export function BudgetNumber({
  label,
  value,
  onChange,
  help,
  currency,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  help?: string;
  currency?: boolean;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NumberField
        id={id}
        value={value}
        min={0}
        onValueChange={(next) => onChange(next ?? 0)}
        format={currency ? { style: "currency", currency: "USD" } : undefined}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement aria-label={`Decrease ${label}`}>
            <Minus />
          </NumberFieldDecrement>
          <NumberFieldInput aria-label={label} />
          <NumberFieldIncrement aria-label={`Increase ${label}`}>
            <Plus />
          </NumberFieldIncrement>
        </NumberFieldGroup>
      </NumberField>
      {help && <FieldDescription>{help}</FieldDescription>}
    </Field>
  );
}

export function BudgetEditor({
  initial,
  adding,
  onClose,
  onSave,
  restoreFocus,
}: {
  initial: BudgetLine;
  adding: boolean;
  onClose: () => void;
  onSave: (line: BudgetLine) => void;
  restoreFocus: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const id = useId();
  const update = (patch: Partial<BudgetLine>) => setDraft((line) => ({ ...line, ...patch }));
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className="w-full gap-0 sm:max-w-[480px]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
      >
        <SheetHeader className="border-b pr-14">
          <SheetTitle>{adding ? "Add Line" : "Edit Line"}</SheetTitle>
          <SheetDescription>
            Set the scope, basis and schedule for this project cost.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSaveBudgetLine(draft)) onSave({ ...draft, name: draft.name.trim() });
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor={`${id}-line`}>Line name</FieldLabel>
                <Input
                  id={`${id}-line`}
                  value={draft.name}
                  onChange={(event) => update({ name: event.target.value })}
                  required
                  maxLength={80}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <FinanceSelect
                  field
                  value={draft.workstream}
                  options={optionsFor(budgetWorkstreams)}
                  label="Workstream"
                  onChange={(workstream) => update({ workstream })}
                  className="w-full"
                />
                <FinanceSelect
                  field
                  value={draft.vendor}
                  options={optionsFor(budgetVendors)}
                  label="Vendor"
                  onChange={(vendor) => update({ vendor })}
                  className="w-full"
                />
                <FinanceSelect
                  field
                  value={draft.person}
                  options={optionsFor(budgetPeople)}
                  label="Owner"
                  onChange={(person) => update({ person })}
                  className="w-full"
                />
                <FinanceSelect
                  field
                  value={draft.basis}
                  options={basisOptions}
                  label="Basis"
                  onChange={(basis) =>
                    update({
                      basis,
                      quantity: basis === "fixed" ? 1 : draft.quantity,
                      remaining:
                        basis === "fixed" ? Math.max(0, draft.rate - draft.actual) : draft.quantity,
                    })
                  }
                  className="w-full"
                />
                {draft.basis !== "fixed" && (
                  <BudgetNumber
                    label={draft.basis === "hours" ? "Planned hours" : "Planned months"}
                    value={draft.quantity}
                    onChange={(quantity) => update({ quantity })}
                  />
                )}
                <BudgetNumber
                  label={draft.basis === "fixed" ? "Fixed fee" : "Unit rate"}
                  value={draft.rate}
                  onChange={(rate) => update({ rate })}
                  currency
                />
                <BudgetNumber
                  label="Actual spend"
                  value={draft.actual}
                  onChange={(actual) => update({ actual })}
                  currency
                />
                <BudgetNumber
                  label={draft.basis === "fixed" ? "Remaining spend" : "Remaining units"}
                  value={draft.remaining}
                  onChange={(remaining) => update({ remaining })}
                  currency={draft.basis === "fixed"}
                />
                {draft.basis === "months" && (
                  <BudgetNumber
                    label="Setup fee"
                    value={draft.setup}
                    onChange={(setup) => update({ setup })}
                    currency
                  />
                )}
                <Field>
                  <FieldLabel htmlFor={`${id}-start`}>Start date</FieldLabel>
                  <Input
                    id={`${id}-start`}
                    type="date"
                    value={draft.start}
                    required
                    onChange={(event) => update({ start: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${id}-finish`}>Planned finish</FieldLabel>
                  <Input
                    id={`${id}-finish`}
                    type="date"
                    min={draft.start}
                    value={draft.finish}
                    required
                    onChange={(event) =>
                      update({ finish: event.target.value, forecastFinish: event.target.value })
                    }
                  />
                </Field>
              </div>
            </FieldGroup>
          </div>
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSaveBudgetLine(draft)}>
              {adding ? "Add Line" : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function BudgetForecast({
  line,
  open,
  onOpenChange,
  onSave,
}: {
  line: BudgetLine;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (line: BudgetLine) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="xs"
          variant="ghost"
          className="-ml-2 justify-start px-2 font-normal tabular-nums"
          aria-label={`Update forecast for ${line.name}, now ${financeAmount(forecastOf(line))}`}
        >
          {financeAmount(forecastOf(line))}
          <Pencil data-icon="inline-end" className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-label="Update Forecast"
        align="end"
        className="w-[min(20rem,calc(100vw-2rem))]"
      >
        {open && (
          <BudgetForecastForm line={line} onSave={onSave} onClose={() => onOpenChange(false)} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function BudgetForecastForm({
  line,
  onSave,
  onClose,
}: {
  line: BudgetLine;
  onSave: (line: BudgetLine) => void;
  onClose: () => void;
}) {
  const [remaining, setRemaining] = useState(line.remaining);
  const [reason, setReason] = useState("");
  const id = useId();
  const forecast = { ...line, remaining };
  const label =
    line.basis === "hours" ? "Hours Left" : line.basis === "months" ? "Months Left" : "Spend Left";
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const note = reason.trim();
        if (!note || remaining === line.remaining) return;
        onSave({ ...forecast, notes: [...line.notes, note] });
        onClose();
      }}
    >
      <div>
        <h2 className="font-medium">Update Forecast</h2>
        <p className="text-xs text-muted-foreground">{line.name}</p>
      </div>
      <FieldGroup className="gap-3">
        <BudgetNumber
          label={label}
          value={remaining}
          onChange={setRemaining}
          currency={line.basis === "fixed"}
          help={`${financeAmount(line.actual)} already billed`}
        />
        <Field>
          <FieldLabel htmlFor={`${id}-reason`}>Reason</FieldLabel>
          <Textarea
            id={`${id}-reason`}
            placeholder="What changed"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={400}
          />
        </Field>
      </FieldGroup>
      <div className="flex justify-between border-t pt-2 text-xs">
        <span>
          Forecast <strong>{financeAmount(forecastOf(forecast))}</strong>
        </span>
        <span>
          Over/Under <strong>{financeAmount(varianceOf(forecast))}</strong>
        </span>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!reason.trim() || remaining === line.remaining}>
          Apply
        </Button>
      </div>
    </form>
  );
}

const decisions: { value: BudgetDecision; label: string }[] = [
  { value: "cover", label: "Cover from contingency" },
  { value: "adjust", label: "Adjust forecast" },
  { value: "hold", label: "Hold for review" },
];

function BudgetDecisionForm({
  line,
  available,
  onDecision,
}: {
  line: BudgetLine;
  available: number;
  onDecision: (line: BudgetLine) => void;
}) {
  const [decision, setDecision] = useState<BudgetDecision>(line.decision ?? "hold");
  const [remaining, setRemaining] = useState(line.remaining);
  const [reason, setReason] = useState("");
  const id = useId();
  const overrun = Math.max(0, -varianceOf(line));
  const canCover = overrun > 0 && overrun <= available;
  const canSave = !!reason.trim() && (decision !== "cover" || canCover);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        onDecision({
          ...line,
          decision,
          remaining: decision === "adjust" ? remaining : line.remaining,
          notes: [
            ...line.notes,
            `${decisions.find((item) => item.value === decision)?.label}: ${reason.trim()}`,
          ],
        });
      }}
    >
      <FieldGroup className="gap-4">
        <FinanceSelect
          field
          label="Decision"
          options={decisions}
          value={decision}
          onChange={setDecision}
          className="w-full"
        />
        {decision === "cover" && (
          <p className="text-sm text-muted-foreground">
            {financeAmount(available)} of contingency available.{" "}
            {canCover
              ? `${financeAmount(overrun)} will be assigned to this line.`
              : "This line cannot be covered by the available reserve."}
          </p>
        )}
        {decision === "adjust" && (
          <BudgetNumber
            label="Remaining forecast"
            value={remaining}
            onChange={setRemaining}
            currency={line.basis === "fixed"}
          />
        )}
        <Field>
          <FieldLabel htmlFor={`${id}-decision-note`}>Decision note</FieldLabel>
          <Textarea
            id={`${id}-decision-note`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={400}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" className="self-end" disabled={!canSave}>
        Save Decision
      </Button>
    </form>
  );
}

const budgetChartConfig = {
  planned: { label: "Planned", color: "var(--color-info)" },
  actual: { label: "Actual", color: "var(--color-success)" },
  forecast: { label: "Forecast", color: "var(--color-focus)" },
};

function BudgetSpendChart({ line }: { line: BudgetLine }) {
  const interval = Math.max(7, daysBetween(line.start, line.forecastFinish));
  const spentAt = Math.max(0, Math.min(1, daysBetween(line.start, budgetToday) / interval));
  const days = Array.from({ length: 8 }, (_, index) => {
    const part = index / 7;
    const afterToday = Math.max(0, part - spentAt);
    return {
      date: financeDate(shiftFinanceDate(line.start, Math.round(interval * part))),
      planned: Math.round(budgetOf(line) * part),
      actual: part <= spentAt ? Math.round(line.actual * (spentAt ? part / spentAt : 0)) : null,
      forecast:
        part >= spentAt
          ? Math.round(
              line.actual +
                ((forecastOf(line) - line.actual) * afterToday) / Math.max(0.01, 1 - spentAt),
            )
          : null,
    };
  });
  return (
    <Frame spacing="sm">
      <FrameHeader>
        <FrameTitle>Budget vs Forecast</FrameTitle>
        <FrameDescription>Planned, actual and forecast to date</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <ChartContainer
          className="h-40 w-full"
          initialDimension={{ width: 360, height: 160 }}
          config={budgetChartConfig}
          role="img"
          aria-label={`${line.name}: planned, actual and forecast spend`}
        >
          <LineChart data={days} margin={{ top: 8, right: 8, left: 2, bottom: 2 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={18} />
            <YAxis
              width={36}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ReferenceLine
              y={budgetOf(line)}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="4 4"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              dataKey="planned"
              type="monotone"
              stroke="var(--color-planned)"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="actual"
              type="monotone"
              stroke="var(--color-actual)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="forecast"
              type="monotone"
              stroke="var(--color-forecast)"
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </FramePanel>
    </Frame>
  );
}

export type BudgetDetailTab = "overview" | "decision" | "activity";

export function BudgetLineSheet({
  line,
  tab,
  available,
  related,
  actions,
  onTabChange,
  onClose,
  onSelect,
  onDecision,
  restoreFocus,
}: {
  line: BudgetLine;
  tab: BudgetDetailTab;
  available: number;
  related: BudgetLine[];
  actions: ReactNode;
  onTabChange: (tab: BudgetDetailTab) => void;
  onClose: () => void;
  onSelect: (line: BudgetLine) => void;
  onDecision: (line: BudgetLine) => void;
  restoreFocus: () => void;
}) {
  const spent = percentage(line.actual, budgetOf(line));
  const variance = varianceOf(line);
  const state = budgetState(line);
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className="w-full gap-0 sm:max-w-[480px]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
      >
        <SheetHeader className="border-b pr-14">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <SheetTitle className="truncate">{line.name}</SheetTitle>
            {actions}
          </div>
          <SheetDescription>
            {line.workstream}, {line.vendor}
          </SheetDescription>
        </SheetHeader>
        <Tabs
          className="min-h-0 flex-1 gap-0"
          value={tab}
          onValueChange={(value) => {
            if (value === "overview" || value === "decision" || value === "activity")
              onTabChange(value);
          }}
        >
          <TabsList className="mx-4 mt-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="decision">Decision</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">
            <Frame spacing="sm">
              <FrameHeader className="flex-row items-center justify-between">
                <FrameTitle>Spend</FrameTitle>
                <Badge
                  variant={
                    state === "Late"
                      ? "warning-light"
                      : state === "Done"
                        ? "success-light"
                        : "outline"
                  }
                >
                  {state}
                </Badge>
              </FrameHeader>
              <FramePanel className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-lg">{financeAmount(line.actual)}</strong>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="size-3" /> Finish {financeDate(line.forecastFinish)}
                  </span>
                </div>
                <Progress value={Math.min(100, spent)} aria-label="Budget spent" />
                <p className="text-xs text-muted-foreground">
                  {spent}% of {financeAmount(budgetOf(line))} spent
                </p>
              </FramePanel>
            </Frame>
            <BudgetSpendChart line={line} />
            {variance !== 0 && (
              <Alert variant={variance < 0 ? "destructive" : "success"}>
                <AlertDescription>
                  Forecast is {financeAmount(Math.abs(variance))} {variance < 0 ? "over" : "under"}{" "}
                  budget.
                </AlertDescription>
                <AlertAction>
                  <Button variant="outline" size="xs" onClick={() => onTabChange("decision")}>
                    Decide
                  </Button>
                </AlertAction>
              </Alert>
            )}
            {!!related.length && (
              <Frame spacing="sm">
                <FrameHeader>
                  <FrameTitle>Same Vendor</FrameTitle>
                  <FrameDescription>{related.length} other lines</FrameDescription>
                </FrameHeader>
                <FramePanel className="flex flex-col gap-1">
                  {related.map((other) => (
                    <Button
                      key={other.id}
                      variant="ghost"
                      size="sm"
                      className="justify-between"
                      onClick={() => onSelect(other)}
                    >
                      <span className="truncate">{other.name}</span>
                      <span className="shrink-0 tabular-nums">
                        {financeAmount(forecastOf(other))}
                      </span>
                    </Button>
                  ))}
                </FramePanel>
              </Frame>
            )}
          </TabsContent>
          <TabsContent value="decision" className="min-h-0 overflow-y-auto p-4">
            <BudgetDecisionForm
              key={line.id}
              line={line}
              available={available}
              onDecision={onDecision}
            />
          </TabsContent>
          <TabsContent value="activity" className="min-h-0 overflow-y-auto p-4">
            {line.notes.length ? (
              <ul className="flex flex-col gap-2">
                {line.notes.map((note, index) => (
                  <li key={index} className="rounded-md border p-3">
                    {note}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No activity yet</EmptyTitle>
                  <EmptyDescription>
                    Forecast updates and decisions will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </TabsContent>
        </Tabs>
        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {tab !== "decision" && <Button onClick={() => onTabChange("decision")}>Decide</Button>}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
