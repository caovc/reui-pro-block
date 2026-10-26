import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, History, Plus, RotateCcw, Truck } from "lucide-react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { Badge } from "@/components/reui/badge";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  freightDemoDistance,
  freightShippers,
  freightTerminals,
  type FreightBook,
  type FreightLane,
} from "./grid-advanced-freight-data";
import {
  freightApplyRates,
  freightBand,
  freightFigures,
  freightMoney,
  freightPreview,
  freightTotals,
  freightSaveLane,
  freightCloseLane,
} from "./grid-advanced-freight-math";

export type FreightPanel =
  | { kind: "editor"; laneId?: string; origin?: string; destination?: string }
  | { kind: "lane"; origin: string; destination: string }
  | { kind: "terminal"; terminalId: string; tab?: string }
  | { kind: "reprice"; laneIds: string[]; label: string }
  | null;
type PanelProps = {
  panel: FreightPanel;
  book: FreightBook;
  onClose: () => void;
  onPanel: (panel: FreightPanel) => void;
  onCommit: (book: FreightBook, label: string) => void;
  onExport: (lanes: FreightLane[]) => void;
  onReturnFocus: (event: Event) => void;
};
// Only event handlers request a wall-clock timestamp.
function eventTimestamp() {
  return new Date().toISOString();
}
const terminalName = (id: string) =>
  freightTerminals.find((terminal) => terminal.id === id)?.city || id;
const marginText = (value: number | null) => (value === null ? "—" : `${value.toFixed(1)}%`);

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  );
}
function LaneCloseConfirmation({
  lane,
  onCloseLane,
}: {
  lane?: FreightLane;
  onCloseLane: () => void;
}) {
  if (!lane) return null;
  return (
    <AlertDialogContent className="max-w-80!">
      <AlertDialogHeader>
        <AlertDialogTitle>
          Close {terminalName(lane.origin)} to {terminalName(lane.destination)}?
        </AlertDialogTitle>
        <AlertDialogDescription>
          Its {lane.loads} loads per week and {freightMoney(freightFigures(lane).profitCents, true)}{" "}
          weekly profit leave the network totals. You can undo it straight after.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Keep Lane</AlertDialogCancel>
        <AlertDialogAction onClick={onCloseLane}>Close Lane</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
function Numeric({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  currency = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  currency?: boolean;
}) {
  return (
    <NumberField
      value={value}
      onValueChange={(next) => onChange(next ?? 0)}
      min={min}
      max={max}
      step={step}
      format={
        currency
          ? {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          : undefined
      }
    >
      <NumberFieldGroup>
        <NumberFieldDecrement aria-label={`Decrease ${label}`} />
        <NumberFieldInput aria-label={label} />
        <NumberFieldIncrement aria-label={`Increase ${label}`} />
      </NumberFieldGroup>
    </NumberField>
  );
}
function Pick({
  label,
  value,
  values,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  values: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue placeholder="Pick a terminal" />
      </SelectTrigger>
      <SelectContent>
        {values.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function LaneEditor({
  panel,
  book,
  onClose,
  onCommit,
  onReturnFocus,
}: PanelProps & { panel: Extract<FreightPanel, { kind: "editor" }> }) {
  const original = book.lanes.find((lane) => lane.id === panel.laneId);
  const [draft, setDraft] = useState<FreightLane>(() => {
    if (original) return original;
    const origin = freightTerminals.find((terminal) => terminal.id === panel.origin);
    const destination = freightTerminals.find((terminal) => terminal.id === panel.destination);
    return {
      id: `lane-${crypto.randomUUID()}`,
      origin: panel.origin || "",
      destination: panel.destination || "",
      shipper: freightShippers[0],
      equipment: "Curtainsider",
      contract: "Contract",
      customs: [panel.origin, panel.destination].some((id) => id === "BRS" || id === "BSL")
        ? "Customs"
        : origin?.country === destination?.country
          ? "Domestic"
          : "EU",
      loads: 10,
      distanceKm: origin && destination ? freightDemoDistance(origin, destination) : 0,
      rateCents: 160,
      costCents: 145,
      active: true,
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const patch = <K extends keyof FreightLane>(key: K, value: FreightLane[K]) =>
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === "origin" || key === "destination") {
        const origin = freightTerminals.find((terminal) => terminal.id === next.origin);
        const destination = freightTerminals.find((terminal) => terminal.id === next.destination);
        next.distanceKm = origin && destination ? freightDemoDistance(origin, destination) : 0;
        next.customs = [next.origin, next.destination].some((id) => id === "BRS" || id === "BSL")
          ? "Customs"
          : origin?.country === destination?.country
            ? "Domestic"
            : "EU";
      }
      return next;
    });
  const figures = freightFigures(draft);
  const terminalOptions = freightTerminals.map((terminal) => ({
    value: terminal.id,
    label: `${terminal.city}, ${terminal.country}`,
  }));
  function submit() {
    try {
      onCommit(
        freightSaveLane(book, draft, freightTerminals, eventTimestamp()),
        original ? "Lane updated" : "Route added",
      );
      onClose();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Check the lane details.");
    }
  }
  return (
    <AlertDialog open={closing} onOpenChange={setClosing}>
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          onCloseAutoFocus={onReturnFocus}
          className="freight-panel inset-y-4! right-4! h-[calc(100%-2rem)]! w-[calc(100%-2rem)]! gap-0 overflow-hidden rounded-xl sm:max-w-xl!"
        >
          <SheetHeader className="border-b p-5">
            <SheetTitle>{original ? "Edit Lane" : "Add Route"}</SheetTitle>
            <SheetDescription>
              {original
                ? `${terminalName(original.origin)} to ${terminalName(original.destination)}`
                : "A new lane, priced per loaded km."}
            </SheetDescription>
          </SheetHeader>
          <form
            className="min-h-0 flex-1 overflow-y-auto p-5"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            id="freight-lane-form"
          >
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Origin</FieldLabel>
                  <Pick
                    label="Origin"
                    value={draft.origin}
                    values={terminalOptions}
                    onChange={(value) => patch("origin", value)}
                    disabled={!!original}
                  />
                </Field>
                <Field>
                  <FieldLabel>Destination</FieldLabel>
                  <Pick
                    label="Destination"
                    value={draft.destination}
                    values={terminalOptions}
                    onChange={(value) => patch("destination", value)}
                    disabled={!!original}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>Shipper</FieldLabel>
                <Pick
                  label="Shipper"
                  value={draft.shipper}
                  values={freightShippers.map((shipper) => ({ value: shipper, label: shipper }))}
                  onChange={(value) => patch("shipper", value)}
                />
              </Field>
              <Field>
                <FieldLabel>Equipment</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={draft.equipment}
                  onValueChange={(value) =>
                    value && patch("equipment", value as FreightLane["equipment"])
                  }
                  className="w-full"
                >
                  {["Curtainsider", "Reefer", "Flatbed"].map((value) => (
                    <ToggleGroupItem key={value} value={value} className="flex-1">
                      {value}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel>Contract</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={draft.contract}
                  onValueChange={(value) =>
                    value && patch("contract", value as FreightLane["contract"])
                  }
                  className="max-w-80 gap-0"
                >
                  <ToggleGroupItem value="Contract" className="flex-1">
                    Contract
                  </ToggleGroupItem>
                  <ToggleGroupItem value="Spot" className="flex-1">
                    Spot
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Loads per Week</FieldLabel>
                  <Numeric
                    label="Loads per Week"
                    value={draft.loads}
                    min={1}
                    max={200}
                    onChange={(value) => patch("loads", value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Rate per km (€)</FieldLabel>
                  <Numeric
                    label="Rate per km"
                    currency
                    value={draft.rateCents / 100}
                    min={0.3}
                    max={6}
                    step={0.05}
                    onChange={(value) => patch("rateCents", Math.round(value * 100))}
                  />
                </Field>
                <Field>
                  <FieldLabel>Cost per km (€)</FieldLabel>
                  <Numeric
                    label="Cost per km"
                    currency
                    value={draft.costCents / 100}
                    min={0.3}
                    max={6}
                    step={0.05}
                    onChange={(value) => patch("costCents", Math.round(value * 100))}
                  />
                </Field>
              </div>
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <p className="font-medium">Lane Economics</p>
                {draft.origin && draft.destination && draft.origin !== draft.destination ? (
                  <>
                    <p className="flex items-center justify-between gap-2 text-sm">
                      <span>
                        {terminalName(draft.origin)} to {terminalName(draft.destination)}
                      </span>
                      <Badge variant="outline">{freightBand(figures.margin)}</Badge>
                    </p>
                    <dl className="grid grid-cols-2 gap-4">
                      <Metric label="Distance">
                        {draft.distanceKm.toLocaleString("en-GB")} km
                      </Metric>
                      <Metric label="Revenue per load">
                        {freightMoney(draft.distanceKm * draft.rateCents)}
                      </Metric>
                      <Metric label="Margin">
                        {marginText(figures.margin)}
                        {original && (
                          <span className="text-xs text-muted-foreground">
                            {" "}
                            (was {marginText(freightFigures(original).margin)})
                          </span>
                        )}
                      </Metric>
                      <Metric label="Profit per week">
                        {freightMoney(figures.profitCents, true)}
                        {original && (
                          <span className="text-xs text-muted-foreground">
                            {" "}
                            (was {freightMoney(freightFigures(original).profitCents, true)})
                          </span>
                        )}
                      </Metric>
                    </dl>
                    <FieldDescription>
                      Demo distance: {draft.distanceKm.toLocaleString("en-GB")} km estimate. Figures
                      update as you price this route.
                    </FieldDescription>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm">Pick origin, destination and rates</p>
                    <FieldDescription>
                      The margin and weekly profit show here as you fill the form.
                    </FieldDescription>
                  </div>
                )}
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </FieldGroup>
          </form>
          <SheetFooter className="flex-row justify-end border-t p-4">
            {original && (
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="mr-auto text-destructive">
                  Close Lane
                </Button>
              </AlertDialogTrigger>
            )}
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form="freight-lane-form">
              {original ? "Save Changes" : "Add Route"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <LaneCloseConfirmation
        lane={original}
        onCloseLane={() => {
          if (!original) return;
          onCommit(freightCloseLane(book, original.id, eventTimestamp()), "Lane closed");
          onClose();
        }}
      />
    </AlertDialog>
  );
}

function RepricePanel({
  panel,
  book,
  onClose,
  onCommit,
  onReturnFocus,
}: PanelProps & { panel: Extract<FreightPanel, { kind: "reprice" }> }) {
  const [percent, setPercent] = useState(5);
  const [losingOnly, setLosingOnly] = useState(true);
  const [reason, setReason] = useState("General rate increase");
  const [error, setError] = useState<string | null>(null);
  const plan = { laneIds: panel.laneIds, percent, losingOnly, reason };
  let preview: ReturnType<typeof freightPreview> | null = null;
  let previewIssue: string | null = null;
  try {
    preview = freightPreview(book, plan);
  } catch (issue) {
    previewIssue = issue instanceof Error ? issue.message : "Check the proposed rates.";
  }
  function onApplyRates() {
    try {
      const next = freightApplyRates(book, plan, eventTimestamp());
      onCommit(next, `${preview?.changes.length || 0} lane rates updated`);
      onClose();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Check the proposed rates.");
    }
  }
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        onCloseAutoFocus={onReturnFocus}
        className="freight-panel inset-y-4! right-4! h-[calc(100%-2rem)]! w-[calc(100%-2rem)]! gap-0 overflow-hidden rounded-xl sm:max-w-xl!"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Reprice Lanes</SheetTitle>
          <SheetDescription>{panel.label}</SheetDescription>
        </SheetHeader>
        <FieldGroup className="min-h-0 flex-1 overflow-y-auto p-5">
          <Field>
            <FieldLabel>Rate Change %</FieldLabel>
            <div className="max-w-48">
              <Numeric
                label="Rate Change %"
                value={percent}
                min={-20}
                max={30}
                step={0.5}
                onChange={setPercent}
              />
            </div>
            <FieldDescription>On the rate per km, to the nearest cent.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Apply To</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              value={losingOnly ? "losing" : "all"}
              onValueChange={(value) => value && setLosingOnly(value === "losing")}
              className="max-w-80 gap-0"
            >
              <ToggleGroupItem value="losing" className="flex-1">
                Losing Lanes
              </ToggleGroupItem>
              <ToggleGroupItem value="all" className="flex-1">
                All Lanes
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="freight-rate-reason">Reason</FieldLabel>
            <Input
              id="freight-rate-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
          {preview && (
            <div className="overflow-hidden rounded-xl border bg-muted/20" aria-live="polite">
              <div className="px-3 pt-2 pb-1.5">
                <p className="font-medium">Before and After</p>
                <p className="text-xs text-muted-foreground">
                  {preview.changes.length} lane{preview.changes.length === 1 ? "" : "s"} of{" "}
                  {preview.before.lanes} change
                </p>
              </div>
              <dl className="space-y-2 rounded-xl border-t bg-background p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                  <dt className="text-muted-foreground">Profit per week</dt>
                  <dd className="tabular-nums">
                    {freightMoney(preview.before.profitCents, true)}{" "}
                    <ArrowRight className="inline size-3" />{" "}
                    {freightMoney(preview.after.profitCents, true)}{" "}
                    <span className="text-muted-foreground">
                      ({preview.after.profitCents >= preview.before.profitCents ? "+" : ""}
                      {freightMoney(preview.after.profitCents - preview.before.profitCents, true)})
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Margin</dt>
                  <dd className="tabular-nums">
                    {marginText(preview.before.margin)} to {marginText(preview.after.margin)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Losing lanes</dt>
                  <dd className="tabular-nums">
                    {preview.before.losing} to {preview.after.losing}
                  </dd>
                </div>
              </dl>
            </div>
          )}
          {(error || previewIssue) && (
            <p role="alert" className="text-destructive">
              {error || previewIssue}
            </p>
          )}
        </FieldGroup>
        <SheetFooter className="flex-row justify-end border-t bg-muted/30 px-5 py-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onApplyRates} disabled={!preview?.changes.length}>
            Apply Rates
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function LaneDialog({
  panel,
  book,
  onClose,
  onPanel,
  onCommit,
  onReturnFocus,
}: PanelProps & { panel: Extract<FreightPanel, { kind: "lane" }> }) {
  const lane = book.lanes.find(
    (item) => item.active && item.origin === panel.origin && item.destination === panel.destination,
  );
  const reverse = book.lanes.find(
    (item) => item.active && item.origin === panel.destination && item.destination === panel.origin,
  );
  const [closing, setClosing] = useState(false);
  const figures = lane && freightFigures(lane);
  return (
    <AlertDialog open={closing} onOpenChange={setClosing}>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent onCloseAutoFocus={onReturnFocus} className="freight-panel sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {terminalName(panel.origin)}
              <ArrowRight className="size-4" />
              {terminalName(panel.destination)}
            </DialogTitle>
            <DialogDescription>Weekly average over the 4 weeks to Oct 16.</DialogDescription>
          </DialogHeader>
          {lane && figures ? (
            <>
              <Badge variant="outline" className="w-fit">
                {freightBand(figures.margin)}
              </Badge>
              <dl className="grid grid-cols-2 gap-4">
                <Metric label="Loads per week">{lane.loads}</Metric>
                <Metric label="Rate / cost per km">
                  €{(lane.rateCents / 100).toFixed(2)} / €{(lane.costCents / 100).toFixed(2)}
                </Metric>
                <Metric label="Margin">{marginText(figures.margin)}</Metric>
                <Metric label="Profit per week">{freightMoney(figures.profitCents, true)}</Metric>
                <Metric label="Backhaul">
                  {reverse ? `${reverse.loads} loads` : "No backhaul"}
                </Metric>
                <Metric label="Empty km per week">
                  {(
                    Math.max(0, lane.loads - (reverse?.loads || 0)) * lane.distanceKm
                  ).toLocaleString("en-GB")}
                </Metric>
              </dl>
              <DialogFooter>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive">
                    Close Lane
                  </Button>
                </AlertDialogTrigger>
                <Button onClick={() => onPanel({ kind: "editor", laneId: lane.id })}>
                  Edit Lane
                </Button>
              </DialogFooter>
            </>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Truck />
                </EmptyMedia>
                <EmptyTitle>No outbound lane</EmptyTitle>
                <EmptyDescription>
                  {reverse
                    ? `The reverse route carries ${reverse.loads} loads. Open this direction to price its headhaul.`
                    : "These terminals do not currently have an active lane."}
                </EmptyDescription>
              </EmptyHeader>
              <Button
                onClick={() =>
                  onPanel({ kind: "editor", origin: panel.origin, destination: panel.destination })
                }
              >
                <Plus />
                Add Route
              </Button>
            </Empty>
          )}
        </DialogContent>
      </Dialog>
      <LaneCloseConfirmation
        lane={lane}
        onCloseLane={() => {
          if (!lane) return;
          onCommit(freightCloseLane(book, lane.id, eventTimestamp()), "Lane closed");
          onClose();
        }}
      />
    </AlertDialog>
  );
}

function TerminalLaneGrid({
  lanes,
  direction,
  onPanel,
}: {
  lanes: FreightLane[];
  direction: "outbound" | "inbound";
  onPanel: (panel: FreightPanel) => void;
}) {
  const columns = useMemo<ColumnDef<DataGridFeatures, FreightLane>[]>(
    () => [
      {
        id: "terminal",
        accessorFn: (lane) =>
          terminalName(direction === "outbound" ? lane.destination : lane.origin),
        size: 180,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={direction === "outbound" ? "To" : "From"} />
        ),
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left hover:underline"
            onClick={() =>
              onPanel({
                kind: "lane",
                origin: row.original.origin,
                destination: row.original.destination,
              })
            }
          >
            <span className="block text-xs text-muted-foreground">
              {direction === "outbound" ? row.original.destination : row.original.origin}
            </span>
            {terminalName(
              direction === "outbound" ? row.original.destination : row.original.origin,
            )}
          </button>
        ),
      },
      {
        id: "loads",
        accessorKey: "loads",
        size: 64,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Loads" />,
        cell: ({ row }) => row.original.loads,
      },
      {
        id: "margin",
        accessorFn: (lane) => freightFigures(lane).margin,
        size: 92,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Margin" />,
        cell: ({ row }) => {
          const margin = freightFigures(row.original).margin;
          return (
            <span
              className={
                margin !== null && margin < 0
                  ? "text-destructive"
                  : "text-emerald-600 dark:text-emerald-400"
              }
            >
              {marginText(margin)}
              <span className="block text-xs text-muted-foreground">{freightBand(margin)}</span>
            </span>
          );
        },
      },
      {
        id: "profit",
        accessorFn: (lane) => freightFigures(lane).profitCents,
        size: 90,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Profit" />,
        cell: ({ row }) => freightMoney(freightFigures(row.original).profitCents, true),
      },
    ],
    [direction, onPanel],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: lanes,
    columns,
    getRowId: (lane) => lane.id,
    manualPagination: true,
    initialState: { sorting: [{ id: "margin", desc: false }] },
  });
  return (
    <DataGrid
      table={table}
      recordCount={lanes.length}
      emptyMessage="No active lanes in this direction."
      tableLayout={{ dense: true, width: "fixed", rowBorder: true, headerBorder: true }}
      tableClassNames={{ bodyRow: "h-12", headerRow: "h-8", base: "min-w-[426px] text-sm" }}
    >
      <DataGridContainer>
        <DataGridScrollArea orientation="horizontal">
          <DataGridTable />
        </DataGridScrollArea>
      </DataGridContainer>
    </DataGrid>
  );
}

function TerminalPanel({
  panel,
  book,
  onClose,
  onPanel,
  onExport,
  onReturnFocus,
}: PanelProps & { panel: Extract<FreightPanel, { kind: "terminal" }> }) {
  const terminal = freightTerminals.find((item) => item.id === panel.terminalId)!;
  const outbound = useMemo(
    () => book.lanes.filter((lane) => lane.active && lane.origin === terminal.id),
    [book.lanes, terminal.id],
  );
  const inbound = useMemo(
    () => book.lanes.filter((lane) => lane.active && lane.destination === terminal.id),
    [book.lanes, terminal.id],
  );
  const [tab, setTab] = useState(panel.tab || "outbound");
  const outgoing = freightTotals(outbound);
  const incoming = freightTotals(inbound);
  const events = book.history
    .filter((event) =>
      book.lanes.some(
        (lane) =>
          lane.id === event.laneId &&
          (lane.origin === terminal.id || lane.destination === terminal.id),
      ),
    )
    .toSorted((first, second) => second.at.localeCompare(first.at));
  const totals = tab === "inbound" ? incoming : outgoing;
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        onCloseAutoFocus={onReturnFocus}
        className="freight-panel inset-y-4! right-4! h-[calc(100%-2rem)]! w-[calc(100%-2rem)]! gap-0 rounded-xl sm:max-w-xl! overflow-hidden"
      >
        <SheetHeader className="border-b p-5">
          <SheetTitle>
            {terminal.city}, {terminal.country}
          </SheetTitle>
          <SheetDescription>
            {terminal.id} · {terminal.region} region, managed by {terminal.manager}
          </SheetDescription>
        </SheetHeader>
        <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="overflow-x-auto border-b p-3">
            <TabsList className="min-w-max w-full">
              <TabsTrigger value="outbound">Outbound {outbound.length}</TabsTrigger>
              <TabsTrigger value="inbound">Inbound {inbound.length}</TabsTrigger>
              <TabsTrigger value="balance">Balance</TabsTrigger>
              <TabsTrigger value="history">History {events.length}</TabsTrigger>
            </TabsList>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {(["outbound", "inbound"] as const).map((direction) => (
              <TabsContent key={direction} value={direction} className="space-y-5">
                <div>
                  <h3 className="font-medium">
                    Weekly {direction === "outbound" ? "Outbound" : "Inbound"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Lanes {direction === "outbound" ? "departing" : "arriving at"} this terminal
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <Metric label="Loads">{totals.loads}</Metric>
                  <Metric label="Profit">{freightMoney(totals.profitCents, true)}</Metric>
                  <Metric label="Margin">{marginText(totals.margin)}</Metric>
                  <Metric label="Losing lanes">{totals.losing}</Metric>
                </dl>
                <TerminalLaneGrid
                  lanes={direction === "inbound" ? inbound : outbound}
                  direction={direction}
                  onPanel={onPanel}
                />
              </TabsContent>
            ))}
            <TabsContent value="balance">
              <dl className="grid grid-cols-2 gap-5">
                <Metric label="Outbound loads">{outgoing.loads}</Metric>
                <Metric label="Inbound loads">{incoming.loads}</Metric>
                <Metric label="Load imbalance">{outgoing.loads - incoming.loads}</Metric>
                <Metric label="Weekly profit">
                  {freightMoney(outgoing.profitCents + incoming.profitCents, true)}
                </Metric>
              </dl>
            </TabsContent>
            <TabsContent value="history">
              <Timeline defaultValue={events.length}>
                {events.map((event, index) => (
                  <TimelineItem key={event.id} step={index + 1}>
                    <TimelineSeparator />
                    <TimelineIndicator>
                      <History className="size-3" />
                    </TimelineIndicator>
                    <TimelineHeader>
                      <TimelineDate>
                        {new Date(event.at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </TimelineDate>
                      <TimelineTitle>
                        {event.kind} · {event.laneId}
                      </TimelineTitle>
                    </TimelineHeader>
                    <TimelineContent>
                      <p className="text-sm">
                        {event.previousRateCents === null
                          ? "Opening rate"
                          : `€${(event.previousRateCents / 100).toFixed(2)} →`}{" "}
                        €{(event.rateCents / 100).toFixed(2)} / km
                      </p>
                      <p className="text-xs text-muted-foreground">{event.reason}</p>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </TabsContent>
          </div>
        </Tabs>
        <SheetFooter className="flex-row justify-end border-t p-4">
          <Button variant="outline" onClick={() => onExport(outbound)}>
            Export
          </Button>
          <Button
            variant="outline"
            disabled={!outbound.length}
            onClick={() =>
              onPanel({
                kind: "reprice",
                laneIds: outbound.map((lane) => lane.id),
                label: `Outbound lanes from ${terminal.city}`,
              })
            }
          >
            <RotateCcw />
            Reprice
          </Button>
          <Button onClick={() => onPanel({ kind: "editor", origin: terminal.id })}>
            <Plus />
            Add Route
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
export function FreightPanels(props: PanelProps) {
  if (!props.panel) return null;
  switch (props.panel.kind) {
    case "editor":
      return (
        <LaneEditor
          key={props.panel.laneId || `${props.panel.origin}-${props.panel.destination}`}
          {...props}
          panel={props.panel}
        />
      );
    case "lane":
      return (
        <LaneDialog
          key={`${props.panel.origin}-${props.panel.destination}`}
          {...props}
          panel={props.panel}
        />
      );
    case "terminal":
      return (
        <TerminalPanel
          key={`${props.panel.terminalId}-${props.panel.tab}`}
          {...props}
          panel={props.panel}
        />
      );
    case "reprice":
      return <RepricePanel key={props.panel.laneIds.join(",")} {...props} panel={props.panel} />;
  }
}
