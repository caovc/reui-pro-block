import { useState, type ReactNode, type RefObject } from "react";
// Adaptations of MIT ReUI free c-chart-2/c-chart-13 patterns, backed by the
// existing ChartContainer and Recharts Bar/Area components; no paid geometry.
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  merchMetricLabel,
  merchMoney,
  merchMonthLabel,
  merchPercent,
} from "./grid-advanced-merch-review-state";
import {
  merchQuarters,
  merchRangeSeries,
  readMerchLines,
  reviewCalls,
  reviewDepartments,
  type MerchBook,
  type MerchBrand,
  type MerchDraft,
  type MerchLine,
  type MerchMetric,
  type ReviewCall,
  type ReviewDepartment,
} from "./grid-advanced-merch-review-model";

export function MerchMove({
  lines,
  months,
  month,
  label,
}: {
  lines: MerchLine[];
  months: string[];
  month: string;
  label: string;
}) {
  const values = months.map((period) => ({
    month: period,
    move: readMerchLines(lines, period).monthMoveBps,
  }));
  const measured = values.flatMap((point) => (point.move === null ? [] : [point.move]));
  const low = Math.min(0, ...measured),
    high = Math.max(0, ...measured);
  const current = readMerchLines(lines, month).monthMoveBps;
  return (
    <span
      className="inline-flex items-center gap-2"
      role="img"
      aria-label={`${label}: ${current === null ? "no prior month" : `${current} basis points month over month`}`}
    >
      <ChartContainer
        className="aspect-auto"
        style={{ width: 46, height: 20 }}
        initialDimension={{ width: 46, height: 20 }}
        config={{ move: { label: "Monthly margin move in basis points", color: "var(--chart-2)" } }}
        aria-hidden="true"
      >
        <BarChart
          data={values}
          accessibilityLayer={false}
          margin={{ top: 1, left: 0, right: 0, bottom: 1 }}
        >
          <XAxis dataKey="month" hide />
          <YAxis hide domain={low === high ? [-1, 1] : [low, high]} allowDataOverflow />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Bar dataKey="move" isAnimationActive={false}>
            {values.map((point) => (
              <Cell
                key={point.month}
                fill={(point.move ?? 0) < 0 ? "var(--destructive)" : "var(--chart-2)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <span className="text-xs tabular-nums">
        {current === null ? "—" : `${current > 0 ? "+" : ""}${current} bp`}
      </span>
    </span>
  );
}

export function MerchSpread({ metric, values }: { metric: MerchMetric; values: number[] }) {
  if (!values.length) return <span>—</span>;
  const minimum = Math.min(...values),
    maximum = Math.max(...values);
  const low = Math.min(0, minimum),
    high = Math.max(0, maximum);
  return (
    <div
      role="img"
      aria-label={`${metric.label} visible brand spread: ${merchMetricLabel(metric, minimum)} to ${merchMetricLabel(metric, maximum)}`}
    >
      <span className="text-xs tabular-nums">
        {merchMetricLabel(metric, minimum)} to {merchMetricLabel(metric, maximum)}
      </span>
      <ChartContainer
        className="mt-1 aspect-auto"
        style={{ width: 130, height: 14 }}
        initialDimension={{ width: 130, height: 14 }}
        config={{ range: { label: "Visible brand range", color: "var(--chart-2)" } }}
        aria-hidden="true"
      >
        <BarChart
          layout="vertical"
          data={[{ label: metric.label, range: [minimum, maximum] }]}
          accessibilityLayer={false}
          margin={{ top: 1, left: 0, right: 0, bottom: 1 }}
        >
          <XAxis type="number" hide domain={low === high ? [low - 1, high + 1] : [low, high]} />
          <YAxis type="category" dataKey="label" hide />
          <Bar
            dataKey="range"
            fill="var(--color-range)"
            fillOpacity={0.4}
            isAnimationActive={false}
          />
          <ReferenceLine x={minimum} stroke="var(--chart-2)" strokeWidth={2} />
          <ReferenceLine x={maximum} stroke="var(--chart-2)" strokeWidth={2} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export function MerchChoice({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field className="min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function MerchNumber({
  id,
  label,
  value,
  onChange,
  money = false,
  percent = false,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  money?: boolean;
  percent?: boolean;
}) {
  const divisor = money || percent ? 100 : 1;
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NumberField
        id={id}
        min={0}
        max={percent ? 100 : money ? 10_000_000 : 1_000_000_000}
        step={money ? 0.01 : percent ? 0.1 : 1}
        value={value / divisor}
        onValueChange={(next) => onChange(Math.round((next ?? 0) * divisor))}
        format={money ? { style: "currency", currency: "USD" } : undefined}
      >
        <NumberFieldGroup>
          <NumberFieldInput className="text-start" />
        </NumberFieldGroup>
      </NumberField>
    </Field>
  );
}

export function MerchSummary({ children }: { children: ReactNode }) {
  return <div className="merch-summary">{children}</div>;
}
export function MerchStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

export function MerchRangeBand({
  lines,
  months,
  label,
}: {
  lines: MerchLine[];
  months: string[];
  label: string;
}) {
  const data = merchRangeSeries(lines, months);
  return (
    <div
      role="img"
      aria-label={`${label}. Weekly net sales range by month: ${data.map((point) => `${merchMonthLabel(point.month)} ${point.range ? `${merchMoney(point.range[0])} to ${merchMoney(point.range[1])}` : "no record"}`).join("; ")}`}
    >
      <ChartContainer
        className="merch-range"
        initialDimension={{ width: 150, height: 38 }}
        config={{ range: { label: "Weekly sales range", color: "var(--chart-1)" } }}
        aria-hidden="true"
      >
        <BarChart
          data={data}
          accessibilityLayer={false}
          margin={{ top: 3, right: 0, bottom: 3, left: 0 }}
        >
          <XAxis dataKey="month" hide />
          <YAxis hide domain={[0, "dataMax"]} />
          <Bar dataKey="range" fill="var(--color-range)" radius={2} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
      <p className="text-[10px] font-normal text-muted-foreground">Monthly weekly-sales range</p>
    </div>
  );
}

export function MerchDrivers({
  title,
  lines,
  month,
  months,
  open,
  onClose,
  opener,
  children,
}: {
  title: string;
  lines: MerchLine[];
  month: string;
  months: string[];
  open: boolean;
  onClose: () => void;
  opener: RefObject<HTMLElement | null>;
  children?: ReactNode;
}) {
  const current = readMerchLines(lines, month);
  const waterfall = [
    { name: "Gross", range: [0, current.grossCents], color: "var(--chart-1)" },
    {
      name: "Offers",
      range: [current.grossCents - current.discountCents, current.grossCents],
      color: "var(--chart-3)",
    },
    {
      name: "Returns",
      range: [current.netCents, current.grossCents - current.discountCents],
      color: "var(--chart-4)",
    },
    { name: "Net", range: [0, current.netCents], color: "var(--chart-2)" },
  ];
  const plan = months.map((period) => {
    const reading = readMerchLines(lines, period);
    return {
      month: period,
      actual: reading.observed ? reading.netCents : null,
      plan: reading.observed ? reading.planCents : null,
    };
  });
  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent
        className="merch-detail-sheet overflow-y-auto"
        onCloseAutoFocus={(event) => {
          if (opener.current?.isConnected) {
            event.preventDefault();
            opener.current.focus();
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {merchMonthLabel(month)} · Recorded local trading data
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4 pb-6">
          <MerchSummary>
            <MerchStat label="Net sales" value={merchMoney(current.netCents)} />
            <MerchStat label="Gross margin" value={merchPercent(current.marginBps)} />
            <MerchStat
              label="Stock cover"
              value={current.coverWeeks === null ? "—" : `${current.coverWeeks.toFixed(1)} weeks`}
            />
            <MerchStat label="Sell-through" value={merchPercent(current.sellThroughBps)} />
          </MerchSummary>
          {children}
          <Tabs defaultValue="drivers">
            <TabsList className="w-full">
              <TabsTrigger value="drivers">Sales drivers</TabsTrigger>
              <TabsTrigger value="plan">Plan and quarters</TabsTrigger>
              <TabsTrigger value="offers">Promotions</TabsTrigger>
            </TabsList>
            <TabsContent value="drivers" className="mt-4">
              <Frame>
                <FrameHeader>
                  <FrameTitle>Gross to net bridge</FrameTitle>
                </FrameHeader>
                <FramePanel>
                  <ChartContainer
                    className="h-52 w-full"
                    config={{ range: { label: "Sales bridge", color: "var(--chart-1)" } }}
                  >
                    <BarChart
                      accessibilityLayer
                      data={waterfall}
                      margin={{ left: 0, right: 8, top: 8, bottom: 4 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis
                        width={50}
                        tickFormatter={(value) => `$${Math.round(value / 100000)}k`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Bar dataKey="range" isAnimationActive={false}>
                        {waterfall.map((point) => (
                          <Cell key={point.name} fill={point.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <dt>Promotional discounts</dt>
                    <dd>{merchMoney(current.discountCents)}</dd>
                    <dt>Customer returns</dt>
                    <dd>{merchMoney(current.returnedCents)}</dd>
                    <dt>Direct cost</dt>
                    <dd>{merchMoney(current.costCents)}</dd>
                    <dt>Sales against plan</dt>
                    <dd>{merchMoney(current.planVarianceCents)}</dd>
                  </dl>
                </FramePanel>
              </Frame>
            </TabsContent>
            <TabsContent value="plan" className="mt-4">
              <Frame>
                <FrameHeader>
                  <FrameTitle>Net sales and plan</FrameTitle>
                </FrameHeader>
                <FramePanel>
                  <ChartContainer
                    className="h-52 w-full"
                    config={{
                      actual: { label: "Net sales", color: "var(--chart-1)" },
                      plan: { label: "Plan", color: "var(--chart-2)" },
                    }}
                  >
                    <AreaChart
                      accessibilityLayer
                      data={plan}
                      margin={{ left: 0, right: 8, top: 8, bottom: 4 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickFormatter={(value) => merchMonthLabel(value)}
                        minTickGap={24}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        width={50}
                        tickFormatter={(value) => `$${Math.round(value / 100000)}k`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent formatter={(value) => merchMoney(Number(value))} />
                        }
                      />
                      <Area
                        dataKey="plan"
                        stroke="var(--color-plan)"
                        fill="var(--color-plan)"
                        fillOpacity={0.08}
                        isAnimationActive={false}
                      />
                      <Area
                        dataKey="actual"
                        stroke="var(--color-actual)"
                        fill="var(--color-actual)"
                        fillOpacity={0.2}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {merchQuarters(lines, months).map((quarter) => (
                      <Badge key={quarter.quarter} variant="outline">
                        {quarter.quarter}: {merchPercent(quarter.marginBps)} · {quarter.months} mo
                      </Badge>
                    ))}
                  </div>
                </FramePanel>
              </Frame>
            </TabsContent>
            <TabsContent value="offers" className="mt-4">
              <ul className="grid gap-3">
                {lines.flatMap((line) =>
                  line.promotions
                    .filter((offer) => months.includes(offer.month))
                    .map((offer) => (
                      <li key={offer.id} className="rounded-lg border p-3">
                        <p className="text-sm font-medium">
                          {offer.label} · {line.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {merchMonthLabel(offer.month)} · {merchPercent(offer.discountBps)} offer
                        </p>
                      </li>
                    )),
                )}
              </ul>
              {!lines.some((line) =>
                line.promotions.some((offer) => months.includes(offer.month)),
              ) && (
                <p className="text-sm text-muted-foreground">
                  No promotions recorded in this window.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MerchLineEditor({
  book,
  line,
  month,
  defaultBrandId,
  opener,
  onClose,
  onSave,
}: {
  book: MerchBook;
  line: MerchLine | null;
  month: string;
  defaultBrandId?: string;
  opener: RefObject<HTMLElement | null>;
  onClose: () => void;
  onSave: (draft: MerchDraft) => void;
}) {
  const record = line?.months.find((entry) => entry.month === month);
  const [draft, setDraft] = useState<MerchDraft>(() => ({
    name: line?.name ?? "",
    department: line?.department ?? "Home",
    brandId: line?.brandId ?? defaultBrandId ?? book.brands[0]?.id ?? "",
    targetMarginBps: line?.targetMarginBps ?? 4500,
    call: line?.call ?? "Maintain",
    current: {
      month,
      grossCents: record?.grossCents ?? 1_200_000,
      discountCents: record?.discountCents ?? 0,
      returnedCents: record?.returnedCents ?? 0,
      costCents: record?.costCents ?? 650_000,
      units: record?.units ?? 100,
      returnedUnits: record?.returnedUnits ?? 0,
      closingUnits: record?.closingUnits ?? 120,
      planCents: record?.planCents ?? 1_250_000,
    },
  }));
  const [error, setError] = useState("");
  const moneyFields = [
    ["grossCents", "Gross sales"],
    ["discountCents", "Discounts"],
    ["returnedCents", "Returned sales"],
    ["costCents", "Direct cost"],
    ["planCents", "Sales plan"],
  ] as const;
  const unitFields = [
    ["units", "Units shipped"],
    ["returnedUnits", "Units returned"],
    ["closingUnits", "Closing inventory"],
  ] as const;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="merch-editor"
        onCloseAutoFocus={(event) => {
          if (opener.current?.isConnected) {
            event.preventDefault();
            opener.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{line ? "Edit product line" : "New product line"}</DialogTitle>
          <DialogDescription>
            {merchMonthLabel(month)} only. Other recorded months stay in the local review.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            try {
              onSave(draft);
              onClose();
            } catch (fault) {
              setError((fault as Error).message);
            }
          }}
        >
          <Field>
            <FieldLabel htmlFor="merch-line-name">Product line name</FieldLabel>
            <Input
              id="merch-line-name"
              required
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </Field>
          <div className="merch-fields">
            <MerchChoice
              id="merch-line-department"
              label="Department"
              value={draft.department}
              onChange={(value) => setDraft({ ...draft, department: value as ReviewDepartment })}
              options={reviewDepartments.map((value) => ({ value, label: value }))}
            />
            <MerchChoice
              id="merch-line-brand"
              label="Brand"
              value={draft.brandId}
              onChange={(value) => setDraft({ ...draft, brandId: value })}
              options={book.brands.map((brand) => ({ value: brand.id, label: brand.name }))}
            />
            <MerchChoice
              id="merch-line-call"
              label="Review call"
              value={draft.call}
              onChange={(value) => setDraft({ ...draft, call: value as ReviewCall })}
              options={reviewCalls.map((value) => ({ value, label: value }))}
            />
            <MerchNumber
              id="merch-line-target"
              label="Margin target (%)"
              percent
              value={draft.targetMarginBps}
              onChange={(value) => setDraft({ ...draft, targetMarginBps: value })}
            />
            {moneyFields.map(([key, label]) => (
              <MerchNumber
                key={key}
                id={`merch-line-${key}`}
                label={label}
                money
                value={draft.current[key]}
                onChange={(value) =>
                  setDraft({ ...draft, current: { ...draft.current, [key]: value } })
                }
              />
            ))}
            {unitFields.map(([key, label]) => (
              <MerchNumber
                key={key}
                id={`merch-line-${key}`}
                label={label}
                value={draft.current[key]}
                onChange={(value) =>
                  setDraft({ ...draft, current: { ...draft.current, [key]: value } })
                }
              />
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save product line</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MerchBrandEditor({
  brand,
  opener,
  onClose,
  onSave,
}: {
  brand: MerchBrand | null;
  opener: RefObject<HTMLElement | null>;
  onClose: () => void;
  onSave: (draft: Omit<MerchBrand, "id">) => void;
}) {
  const [draft, setDraft] = useState<Omit<MerchBrand, "id">>({
    name: brand?.name ?? "",
    initials: brand?.initials ?? "",
    targetMarginBps: brand?.targetMarginBps ?? 4500,
    call: brand?.call ?? "Maintain",
  });
  const [error, setError] = useState("");
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="merch-editor sm:max-w-lg"
        onCloseAutoFocus={(event) => {
          if (opener.current?.isConnected) {
            event.preventDefault();
            opener.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{brand ? "Edit brand" : "New brand"}</DialogTitle>
          <DialogDescription>
            Create a brand profile, then add product records to start its review.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            try {
              onSave(draft);
              onClose();
            } catch (fault) {
              setError((fault as Error).message);
            }
          }}
        >
          <Field>
            <FieldLabel htmlFor="merch-brand-name">Brand name</FieldLabel>
            <Input
              id="merch-brand-name"
              required
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="merch-brand-initials">Brand initials</FieldLabel>
            <Input
              id="merch-brand-initials"
              required
              maxLength={3}
              value={draft.initials}
              onChange={(event) => setDraft({ ...draft, initials: event.target.value })}
            />
          </Field>
          <MerchNumber
            id="merch-brand-target"
            label="Margin target (%)"
            percent
            value={draft.targetMarginBps}
            onChange={(value) => setDraft({ ...draft, targetMarginBps: value })}
          />
          <MerchChoice
            id="merch-brand-call"
            label="Review call"
            value={draft.call}
            onChange={(value) => setDraft({ ...draft, call: value as ReviewCall })}
            options={reviewCalls.map((value) => ({ value, label: value }))}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save brand</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
