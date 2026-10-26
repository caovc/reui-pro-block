import { useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Factory as FactoryIcon,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldIncrement,
  NumberFieldDecrement,
} from "@/components/reui/number-field";
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDomainGrid, type DomainColumn } from "./grid-advanced-model-grid";
import {
  calls,
  categories,
  currentQuarter,
  owners,
  money,
  percent,
  otifPosition,
  quarterRanks,
  quarters,
  type BuyCall,
  type Factory,
  type FactoryScore,
  type Quarter,
} from "./grid-advanced-factory-scorecard-data";

const callColors: Record<BuyCall, string> = {
  Open: "text-blue-700 dark:text-blue-300",
  Grow: "text-emerald-700 dark:text-emerald-300",
  Hold: "text-amber-700 dark:text-amber-300",
  Reduce: "text-orange-700 dark:text-orange-300",
  Exit: "text-destructive",
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={cn("h-8 text-sm", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function NumericField({
  id,
  label,
  value,
  max,
  step = 1,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <NumberField
        id={id}
        value={value}
        min={0}
        max={max}
        step={step}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement aria-label={`Decrease ${label}`} />
          <NumberFieldInput aria-label={label} />
          <NumberFieldIncrement aria-label={`Increase ${label}`} />
        </NumberFieldGroup>
      </NumberField>
    </div>
  );
}

export function BuyMenu({
  factory,
  onChange,
}: {
  factory: FactoryScore;
  onChange: (call: BuyCall) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Next buy for ${factory.name}: ${factory.nextBuy}`}
          className={cn("h-7 gap-1 px-1.5 font-normal", callColors[factory.nextBuy])}
        >
          <Badge
            variant={
              factory.nextBuy === "Grow"
                ? "success-light"
                : factory.nextBuy === "Reduce"
                  ? "warning-light"
                  : factory.nextBuy === "Exit"
                    ? "destructive-light"
                    : "outline"
            }
            className="h-5 font-normal"
          >
            {factory.nextBuy === "Open" && <CircleAlert className="size-3 text-muted-foreground" />}
            {factory.nextBuy}
          </Badge>
          <ChevronDown className="size-3 text-muted-foreground" />
          {factory.nextBuy !== factory.suggested && (
            <CircleAlert
              className="size-3 text-muted-foreground"
              aria-label={`Suggested ${factory.suggested}`}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[190px]">
        <DropdownMenuLabel className="text-xs font-normal">
          Suggested <span className="font-medium">{factory.suggested}</span>
        </DropdownMenuLabel>
        <div className="px-2 pb-2 text-xs text-muted-foreground">
          {factory.current.otif < factory.floor
            ? "Delivery is below the contractual floor."
            : `${factory.reasons.filter((rule) => rule.passed).length} of 9 review checks passed.`}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={factory.nextBuy}
          onValueChange={(value) => onChange(value as BuyCall)}
        >
          {calls.map((call) => (
            <DropdownMenuRadioItem key={call} value={call} className={callColors[call]}>
              {call}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OtifLane({ factory, compare }: { factory: FactoryScore; compare: Quarter }) {
  const below = factory.current.otif < factory.floor;
  const prior = factory.prior?.otif;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="factory-otif-lane"
          aria-label={`${factory.name} OTIF ${percent(factory.current.otif)}, floor ${percent(factory.floor)}`}
        >
          <span className="factory-otif-track" aria-hidden="true">
            <span
              className="factory-otif-peer"
              style={{
                left: `${otifPosition(factory.peerLow)}%`,
                width: `${otifPosition(factory.peerHigh) - otifPosition(factory.peerLow)}%`,
              }}
            />
            <span className="factory-otif-goal" style={{ left: `${otifPosition(95)}%` }} />
            <span
              className="factory-otif-floor"
              style={{ left: `${otifPosition(factory.floor)}%` }}
            />
            {prior !== undefined && (
              <>
                <span
                  className="factory-otif-change"
                  style={{
                    left: `${Math.min(otifPosition(prior), otifPosition(factory.current.otif))}%`,
                    width: `${Math.abs(otifPosition(factory.current.otif) - otifPosition(prior))}%`,
                  }}
                />
                <span className="factory-otif-prior" style={{ left: `${otifPosition(prior)}%` }} />
              </>
            )}
            <span
              className={cn("factory-otif-current", below && "is-below")}
              style={{ left: `${otifPosition(factory.current.otif)}%` }}
            />
          </span>
          <span
            className={cn("w-12 shrink-0 text-right tabular-nums", below && "text-destructive")}
          >
            {percent(factory.current.otif)}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[300px] flex-col items-start gap-2 p-3 text-sm">
        <strong>On Time In Full · {percent(factory.current.otif)}</strong>
        <span>
          {prior === undefined
            ? `New since ${compare}`
            : `${factory.current.otif - prior >= 0 ? "+" : ""}${(factory.current.otif - prior).toFixed(1)} pp vs ${compare} (${percent(prior)})`}
        </span>
        <span>
          {factory.category} peers {percent(factory.peerLow)}–{percent(factory.peerHigh)}
        </span>
        <span>Contract floor {percent(factory.floor)} · Goal 95%</span>
      </TooltipContent>
    </Tooltip>
  );
}

function DetailTable<T extends object>({
  data,
  columns,
  label,
}: {
  data: T[];
  columns: DomainColumn<T>[];
  label: string;
}) {
  const table = useDomainGrid({ data, columns });
  return (
    <div aria-label={label} className="rounded-lg border">
      <DataGrid
        table={table}
        recordCount={data.length}
        tableLayout={{ width: "fixed", rowBorder: true, headerBorder: true }}
        tableClassNames={{ bodyRow: "h-10", headerRow: "h-8" }}
      >
        <DataGridContainer className="rounded-none border-0">
          <DataGridScrollArea orientation="horizontal">
            <DataGridTable />
          </DataGridScrollArea>
        </DataGridContainer>
      </DataGrid>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}

function FactoryNotes({
  factory,
  onSave,
}: {
  factory: Factory;
  onSave: (factory: Factory) => void;
}) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  function saveNote() {
    if (!text.trim()) return;
    const note = {
      id: editing ?? crypto.randomUUID(),
      text: text.trim(),
      author: owners[0],
      date: new Date().toISOString().slice(0, 10),
    };
    onSave({
      ...factory,
      notes: editing
        ? factory.notes.map((item) => (item.id === editing ? note : item))
        : [...factory.notes, note],
    });
    setText("");
    setEditing(null);
  }
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="factory-note">{editing ? "Edit note" : "Add a note"}</Label>
        <Textarea
          id="factory-note"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Record a sourcing decision or follow-up…"
        />
        <div className="flex justify-end gap-2">
          {editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(null);
                setText("");
              }}
            >
              Cancel edit
            </Button>
          )}
          <Button size="sm" disabled={!text.trim()} onClick={saveNote}>
            {editing ? "Save note" : "Add note"}
          </Button>
        </div>
      </div>
      {!factory.notes.length && (
        <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          No notes yet.
        </p>
      )}
      <Timeline value={factory.notes.length}>
        {factory.notes.map((note, index) => (
          <TimelineItem key={note.id} step={index + 1}>
            <TimelineHeader className="flex items-start justify-between gap-2">
              <div>
                <TimelineDate dateTime={note.date}>{note.date}</TimelineDate>
                <TimelineTitle>{note.author}</TimelineTitle>
              </div>
              <div className="flex">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Edit note by ${note.author}`}
                  onClick={() => {
                    setEditing(note.id);
                    setText(note.text);
                  }}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Delete note by ${note.author}`}
                  onClick={() => {
                    onSave({
                      ...factory,
                      notes: factory.notes.filter((item) => item.id !== note.id),
                    });
                    if (editing === note.id) {
                      setEditing(null);
                      setText("");
                    }
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </TimelineHeader>
            <TimelineIndicator />
            <TimelineSeparator />
            <TimelineContent className="whitespace-pre-wrap break-words pt-2">
              {note.text}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </div>
  );
}

export function FactoryDetails({
  factory,
  records,
  compare,
  withinCategory,
  onClose,
  onEdit,
  onSave,
  onCall,
}: {
  factory: FactoryScore;
  records: Factory[];
  compare: Quarter;
  withinCategory: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSave: (factory: Factory) => void;
  onCall: (call: BuyCall) => void;
}) {
  const history = useMemo(
    () =>
      quarters.map((quarter) => ({
        id: quarter,
        quarter,
        metric: factory.quarters[quarter],
        rank: quarterRanks(records, quarter, withinCategory).get(factory.id) ?? null,
      })),
    [factory, records, withinCategory],
  );
  const quarterColumns = useMemo<DomainColumn<(typeof history)[number]>[]>(
    () => [
      { id: "quarter", accessorKey: "quarter", header: "Quarter", size: 110 },
      {
        id: "spend",
        accessorFn: (row) => row.metric?.spend ?? null,
        header: "FOB spend",
        size: 120,
        cell: ({ row }) => (row.original.metric ? money(row.original.metric.spend) : "—"),
      },
      {
        id: "otif",
        accessorFn: (row) => row.metric?.otif ?? null,
        header: "OTIF",
        size: 90,
        cell: ({ row }) => (row.original.metric ? percent(row.original.metric.otif) : "—"),
      },
      { id: "orders", accessorFn: (row) => row.metric?.orders ?? null, header: "Orders", size: 90 },
    ],
    [],
  );
  const rankColumns = useMemo<DomainColumn<(typeof history)[number]>[]>(
    () => [
      { id: "quarter", accessorKey: "quarter", header: "Quarter", size: 130 },
      {
        id: "rank",
        accessorKey: "rank",
        header: "Rank",
        size: 80,
        cell: ({ row }) => (row.original.rank === null ? "Not onboarded" : `#${row.original.rank}`),
      },
      {
        id: "spend",
        accessorFn: (row) => row.metric?.spend ?? null,
        header: "FOB spend",
        size: 130,
        cell: ({ row }) => (row.original.metric ? money(row.original.metric.spend) : "—"),
      },
    ],
    [],
  );
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="factory-scorecard-sheet">
        <SheetHeader className="border-b p-5 pr-12">
          <div className="flex items-center gap-3">
            <IconTile size="sm">
              <FactoryIcon />
            </IconTile>
            <div>
              <SheetTitle>{factory.name}</SheetTitle>
              <SheetDescription>
                {factory.flag} {factory.country} · {factory.category} · {factory.id}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <Tabs defaultValue="Overview" className="min-h-0 flex-1 gap-0">
          <div className="overflow-x-auto border-b px-4">
            <TabsList variant="line" className="h-11 w-max gap-3">
              {["Overview", "Quarters", "Rank Path", "Quality", "Notes"].map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <TabsContent value="Overview" className="space-y-5">
              <div className="grid grid-cols-3 divide-x rounded-lg border bg-muted/20 py-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Rank</p>
                  <strong className="text-xl">#{factory.rank}</strong>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">FOB Spend</p>
                  <strong className="text-xl">{money(factory.current.spend)}</strong>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">OTIF</p>
                  <strong className="text-xl">{percent(factory.current.otif)}</strong>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-medium">Delivery performance</h3>
                <OtifLane factory={factory} compare={compare} />
                <p className="mt-3 text-xs text-muted-foreground">
                  Peer band is the middle 50% of current-quarter {factory.category.toLowerCase()}{" "}
                  factories.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium">Next Buy</h3>
                  <BuyMenu factory={factory} onChange={onCall} />
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Suggested {factory.suggested}. Your call is stored separately from this
                  assessment.
                </p>
                <ul className="space-y-2">
                  {factory.reasons.map((rule) => (
                    <li key={rule.label} className="flex items-center gap-2 text-sm">
                      {rule.passed ? (
                        <Check className="size-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <X className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>
              <dl className="divide-y">
                <Fact label="Owner">{factory.owner}</Fact>
                <Fact label="Status">
                  <Badge variant="outline">{factory.status}</Badge>
                </Fact>
                <Fact label="Working together since">{factory.since}</Fact>
                <Fact label="Last audit">{factory.audit}</Fact>
                <Fact label="Contract OTIF floor">{percent(factory.floor)}</Fact>
              </dl>
            </TabsContent>
            <TabsContent value="Quarters" className="space-y-4">
              <h3 className="font-medium">Eight-quarter history</h3>
              <p className="text-xs text-muted-foreground">
                Unrecorded quarters remain empty. Comparison: {compare}.
              </p>
              <DetailTable
                data={history}
                columns={quarterColumns}
                label="Factory quarterly metrics"
              />
            </TabsContent>
            <TabsContent value="Rank Path" className="space-y-4">
              <h3 className="font-medium">Rank path</h3>
              <p className="text-xs text-muted-foreground">
                Spend ranking within {withinCategory ? factory.category : "all factories"}, computed
                independently for each quarter.
              </p>
              <DetailTable data={history} columns={rankColumns} label="Factory rank path" />
            </TabsContent>
            <TabsContent value="Quality" className="space-y-4">
              <h3 className="font-medium">Quality & inspection history</h3>
              <dl className="divide-y rounded-lg border px-4">
                <Fact label="Current defect rate">{percent(factory.current.defects)}</Fact>
                <Fact label="Purchase orders">{factory.current.orders}</Fact>
                <Fact label="Last audit">{factory.audit}</Fact>
              </dl>
              <Timeline value={8}>
                {history
                  .filter((item) => item.metric)
                  .map((item, index) => (
                    <TimelineItem key={item.id} step={index + 1}>
                      <TimelineIndicator />
                      <TimelineSeparator />
                      <TimelineHeader>
                        <TimelineDate>{item.quarter}</TimelineDate>
                        <TimelineTitle>{percent(item.metric!.defects)} defects</TimelineTitle>
                      </TimelineHeader>
                      <TimelineContent>
                        {item.metric!.orders} orders inspected · {percent(item.metric!.otif)}{" "}
                        delivered on time in full
                      </TimelineContent>
                    </TimelineItem>
                  ))}
              </Timeline>
            </TabsContent>
            <TabsContent value="Notes">
              <FactoryNotes
                factory={records.find((record) => record.id === factory.id) ?? factory}
                onSave={onSave}
              />
            </TabsContent>
          </div>
        </Tabs>
        <div className="flex justify-between border-t p-4">
          <span className="self-center text-xs text-muted-foreground">
            Local demo · changes stay in this preview
          </span>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil />
            Edit Factory
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FactoryDateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [year, month, day] = value.split("-").map(Number);
  const selected = new Date(year, month - 1, day);
  // The scorecard is a fixed 2026 demo; dates after its review day are unavailable.
  const reviewDay = new Date(2026, 9, 15);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-label={label}
            className="h-8 w-full justify-start gap-1.5 px-2.5 font-normal"
          >
            <CalendarDays className="size-3.5 text-muted-foreground" />
            {selected.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0" aria-label={`${label} calendar`}>
          <Calendar
            mode="single"
            required
            selected={selected}
            defaultMonth={selected}
            captionLayout="dropdown"
            startMonth={new Date(2000, 0)}
            endMonth={reviewDay}
            disabled={{ after: reviewDay }}
            autoFocus
            onSelect={(date) => {
              if (!date) return;
              onChange(
                [
                  date.getFullYear(),
                  String(date.getMonth() + 1).padStart(2, "0"),
                  String(date.getDate()).padStart(2, "0"),
                ].join("-"),
              );
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function FactoryEditor({
  factory,
  creating,
  onClose,
  onSave,
}: {
  factory: Factory;
  creating: boolean;
  onClose: () => void;
  onSave: (factory: Factory) => void;
}) {
  const [draft, setDraft] = useState<Factory>(() => structuredClone(factory));
  const [error, setError] = useState("");
  function update<K extends keyof Factory>(key: K, value: Factory[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }
  function metric(key: "spend" | "otif" | "defects" | "orders", value: number) {
    setDraft((previous) => ({
      ...previous,
      quarters: {
        ...previous.quarters,
        [currentQuarter]: { ...previous.quarters[currentQuarter]!, [key]: value },
      },
    }));
  }
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="factory-scorecard-sheet">
        <SheetHeader className="border-b p-5 pr-12">
          <SheetTitle>{creating ? "Add Factory" : "Edit Factory"}</SheetTitle>
          <SheetDescription>
            Identity, sourcing terms and current-quarter measurements.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.name.trim() || !draft.country.trim() || !draft.owner.trim()) {
              setError("Name, country and owner are required.");
              return;
            }
            if (!draft.quarters[currentQuarter]) {
              setError("Current quarter measurements are required.");
              return;
            }
            onSave({ ...draft, name: draft.name.trim(), country: draft.country.trim() });
          }}
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
            {error && (
              <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
                {error}
              </p>
            )}
            <fieldset className="space-y-4">
              <legend className="mb-3 font-semibold">Factory identity</legend>
              <div className="space-y-1.5">
                <Label htmlFor="factory-name">Factory name</Label>
                <Input
                  id="factory-name"
                  required
                  value={draft.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="e.g. Cedar Loom Works"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <SelectField
                    label="Category"
                    value={draft.category}
                    options={categories}
                    onChange={(value) => update("category", value as Factory["category"])}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="factory-country">Country</Label>
                  <Input
                    id="factory-country"
                    value={draft.country}
                    required
                    onChange={(event) => {
                      update("country", event.target.value);
                      update("flag", "🌐");
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Owner</Label>
                  <SelectField
                    label="Owner"
                    value={draft.owner}
                    options={owners}
                    onChange={(value) => update("owner", value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <SelectField
                    label="Status"
                    value={draft.status}
                    options={["Active", "Watch", "Paused"]}
                    onChange={(value) => update("status", value as Factory["status"])}
                  />
                </div>
              </div>
            </fieldset>
            <fieldset className="space-y-4 border-t pt-4">
              <legend className="pr-2 font-semibold">Sourcing terms</legend>
              <div className="grid grid-cols-2 gap-4">
                <FactoryDateField
                  id="factory-since"
                  label="Partner since"
                  value={draft.since}
                  onChange={(value) => update("since", value)}
                />
                <FactoryDateField
                  id="factory-audit"
                  label="Last audit"
                  value={draft.audit}
                  onChange={(value) => update("audit", value)}
                />
              </div>
              <NumericField
                id="factory-floor"
                label="OTIF floor (%)"
                value={draft.floor}
                max={100}
                step={0.1}
                onChange={(value) => update("floor", value)}
              />
              <div className="space-y-1.5">
                <Label>Next Buy</Label>
                <SelectField
                  label="Next Buy"
                  value={draft.nextBuy}
                  options={calls}
                  onChange={(value) => update("nextBuy", value as BuyCall)}
                />
              </div>
            </fieldset>
            <fieldset className="grid grid-cols-2 gap-4 border-t pt-4">
              <legend className="pr-2 font-semibold">{currentQuarter} measurements</legend>
              <NumericField
                id="factory-spend"
                label="FOB Spend ($)"
                value={draft.quarters[currentQuarter]?.spend ?? 0}
                max={1000000000}
                step={1000}
                onChange={(value) => metric("spend", value)}
              />
              <NumericField
                id="factory-otif"
                label="OTIF (%)"
                value={draft.quarters[currentQuarter]?.otif ?? 0}
                max={100}
                step={0.1}
                onChange={(value) => metric("otif", value)}
              />
              <NumericField
                id="factory-defects"
                label="Defects (%)"
                value={draft.quarters[currentQuarter]?.defects ?? 0}
                max={100}
                step={0.1}
                onChange={(value) => metric("defects", value)}
              />
              <NumericField
                id="factory-orders"
                label="Orders"
                value={draft.quarters[currentQuarter]?.orders ?? 0}
                max={1000000}
                onChange={(value) => metric("orders", value)}
              />
            </fieldset>
          </div>
          <div className="flex items-center justify-between border-t p-4">
            <span className="text-xs text-muted-foreground">Local demo data</span>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {creating ? <Plus /> : <Check />}
                {creating ? "Add Factory" : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
