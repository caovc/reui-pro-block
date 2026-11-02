import { useId, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownUp,
  ChartNoAxesCombined,
  ChartNoAxesColumn,
  CheckCheck,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Columns3,
  Layers,
  MessageSquare,
  Pencil,
  RotateCcw,
  SlidersHorizontal,
  Target,
  Trash2,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
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
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  PnlConfidenceCell,
  PnlOutlookChart,
  PnlSectionMark,
  PnlVarianceCell,
} from "./grid-advanced-retail-pnl-outlook-cells";
import {
  pnlMonths,
  pnlSections,
  pnlYear,
  type PnlCompareBase,
  type PnlConfidence,
  type PnlLine,
  type PnlRow,
  type PnlSectionId,
} from "./grid-advanced-retail-pnl-outlook-data";
import { formatPnlCompact, formatPnlNumber } from "./grid-advanced-retail-pnl-outlook-model";
import "@/blocks/reference.css";

export type PnlOptionalColumn = "budget" | "prior" | "variance" | "confidence" | "owner";

type PnlLinePatch = Partial<Pick<PnlLine, "name" | "owner" | "section">>;
type PnlLineDraft = Pick<PnlLine, "name" | "owner" | "section">;

export function PnlVariancePopover({
  compare,
  tolerance,
  flagMonths,
  onCompare,
  onTolerance,
  onFlagMonths,
  stats,
  onReset,
}: {
  compare: PnlCompareBase;
  tolerance: number;
  flagMonths: boolean;
  onCompare: (value: PnlCompareBase) => void;
  onTolerance: (value: number) => void;
  onFlagMonths: (value: boolean) => void;
  stats: { adverse: number; favourable: number; inLine: number };
  onReset: () => void;
}) {
  const thresholdId = useId();
  const flagId = useId();
  const isDefault = compare === "budget" && tolerance === 5 && flagMonths;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Variance">
          <SlidersHorizontal />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-label="Variance"
        className="reui-reference rpo-variance-popover w-80 max-w-[calc(100vw-2rem)] gap-3 p-2.5"
      >
        <PopoverHeader className="gap-0.5">
          <PopoverTitle role="heading" aria-level={2}>
            Variance
          </PopoverTitle>
          <PopoverDescription>What every flag reads against.</PopoverDescription>
        </PopoverHeader>
        <ButtonGroup aria-label="Compare against" className="w-full">
          <Button
            type="button"
            variant="outline"
            aria-pressed={compare === "budget"}
            className="flex-1 aria-pressed:bg-muted"
            onClick={() => onCompare("budget")}
          >
            vs Budget
          </Button>
          <Button
            type="button"
            variant="outline"
            aria-pressed={compare === "prior"}
            className="flex-1 aria-pressed:bg-muted"
            onClick={() => onCompare("prior")}
          >
            vs Prior Year
          </Button>
        </ButtonGroup>
        <Field className="gap-2">
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor={thresholdId} className="font-normal">
              Flag Beyond
            </FieldLabel>
            <output className="text-sm font-medium tabular-nums">{tolerance}%, $15K or more</output>
          </div>
          {/* The reference confirms 5%; the 0–20 keyboard range is local demo policy. */}
          <Slider
            id={thresholdId}
            aria-label="Flag Beyond"
            aria-valuetext={`${tolerance} percent, $15K or more`}
            min={0}
            max={20}
            step={1}
            value={[tolerance]}
            onValueChange={([value]) => {
              if (value !== undefined) onTolerance(value);
            }}
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CircleAlert aria-hidden="true" className="size-3 text-destructive" />
              {stats.adverse} adverse
            </span>
            <span className="inline-flex items-center gap-1">
              <CircleCheck
                aria-hidden="true"
                className="size-3 text-emerald-600 dark:text-emerald-400"
              />
              {stats.favourable} favourable
            </span>
            <span className="inline-flex items-center gap-1">
              <CircleDashed aria-hidden="true" className="size-3" />
              {stats.inLine} in line
            </span>
          </div>
        </Field>
        <Separator />
        <Field orientation="horizontal" className="justify-between gap-3">
          <FieldLabel htmlFor={flagId} className="font-normal">
            Flag Month Cells
          </FieldLabel>
          <Switch id={flagId} checked={flagMonths} onCheckedChange={onFlagMonths} />
        </Field>
        <Button
          type="button"
          variant="outline"
          className="h-7 w-full"
          disabled={isDefault}
          onClick={onReset}
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </PopoverContent>
    </Popover>
  );
}

const optionalColumns: {
  id: PnlOptionalColumn;
  label: string;
  icon: typeof Target;
}[] = [
  { id: "budget", label: "Budget", icon: Target },
  { id: "prior", label: "Prior Year", icon: ChartNoAxesCombined },
  { id: "variance", label: "Variance", icon: ArrowDownUp },
  { id: "confidence", label: "Confidence", icon: CheckCheck },
  { id: "owner", label: "Owner", icon: UserRound },
];

export function PnlViewMenu({
  showChart,
  showQuarters,
  columns,
  onShowChart,
  onShowQuarters,
  onColumnChange,
  onExpandAll,
  onCollapseAll,
  onReset,
}: {
  showChart: boolean;
  showQuarters: boolean;
  columns: Readonly<Record<PnlOptionalColumn, boolean>>;
  onShowChart: (value: boolean) => void;
  onShowQuarters: (value: boolean) => void;
  onColumnChange: (column: PnlOptionalColumn, visible: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onReset: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="View">
          <Columns3 />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="reui-reference rpo-view-menu w-52"
        aria-label="View"
      >
        <DropdownMenuGroup aria-label="Layout">
          <DropdownMenuLabel>Layout</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={showChart}
            onCheckedChange={(value) => onShowChart(value === true)}
          >
            <ChartNoAxesColumn />
            Chart Band
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showQuarters}
            onCheckedChange={(value) => onShowQuarters(value === true)}
          >
            <Layers />
            Quarter Totals
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup aria-label="Columns">
          <DropdownMenuLabel>Columns</DropdownMenuLabel>
          {optionalColumns.map(({ id, label, icon: Icon }) => (
            <DropdownMenuCheckboxItem
              key={id}
              checked={columns[id]}
              onCheckedChange={(value) => onColumnChange(id, value === true)}
            >
              <Icon />
              {label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup aria-label="Sections">
          <DropdownMenuLabel>Sections</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onExpandAll}>
            <ChevronsUpDown />
            Expand All
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onCollapseAll}>
            <ChevronsDownUp />
            Collapse All
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onReset}>
          <RotateCcw />
          Reset Statement
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PnlSectionSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: PnlSectionId;
  onChange: (value: PnlSectionId) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const section = pnlSections.find((item) => item.id === next);
        if (section) onChange(section.id);
      }}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="reui-reference">
        {pnlSections.map((section) => (
          <SelectItem key={section.id} value={section.id}>
            <PnlSectionMark section={section.id} />
            {section.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Exact edit/add form layouts were not observed; these fields complete the local demo.
function PnlLineFields({
  draft,
  onChange,
}: {
  draft: PnlLineDraft;
  onChange: (value: PnlLineDraft) => void;
}) {
  const nameId = useId();
  const ownerId = useId();
  const sectionId = useId();

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={nameId}>Line Name</FieldLabel>
        <Input
          id={nameId}
          required
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={ownerId}>Owner</FieldLabel>
        <Input
          id={ownerId}
          required
          value={draft.owner}
          onChange={(event) => onChange({ ...draft, owner: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={sectionId}>Section</FieldLabel>
        <PnlSectionSelect
          id={sectionId}
          value={draft.section}
          onChange={(section) => onChange({ ...draft, section })}
        />
      </Field>
    </FieldGroup>
  );
}

function PnlDetail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Item className="flex-nowrap rounded-none border-0 p-0">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-right">{children}</dd>
    </Item>
  );
}

function PnlLineSheetBody({
  line,
  row,
  compare,
  onOpenChange,
  onConfidence,
  onUpdateLine,
  onRemoveLine,
  onAddNote,
}: {
  line: PnlLine;
  row: PnlRow;
  compare: PnlCompareBase;
  onOpenChange: (open: boolean) => void;
  onConfidence: (id: string, value: PnlConfidence) => void;
  onUpdateLine: (id: string, patch: PnlLinePatch) => void;
  onRemoveLine: (id: string) => void;
  onAddNote: (id: string, text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PnlLineDraft>({
    name: line.name,
    owner: line.owner,
    section: line.section,
  });
  const [note, setNote] = useState("");
  const [tab, setTab] = useState("overview");
  const formId = useId();
  const noteId = useId();
  const section = pnlSections.find((item) => item.id === line.section)!;
  const compareLabel = compare === "budget" ? "Budget" : "Prior Year";
  const budget = line.budget.reduce((total, value) => total + value, 0);
  const prior = line.prior.reduce((total, value) => total + value, 0);
  const canSave = Boolean(draft.name.trim() && draft.owner.trim());
  const status =
    row.variance.status === "in-line"
      ? "In Line"
      : row.variance.status === "adverse"
        ? "Adverse"
        : "Favourable";

  function beginEdit() {
    setDraft({ name: line.name, owner: line.owner, section: line.section });
    setEditing(true);
  }

  function cancelEdit() {
    setDraft({ name: line.name, owner: line.owner, section: line.section });
    setEditing(false);
  }

  function saveLine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    onUpdateLine(line.id, { ...draft, name: draft.name.trim(), owner: draft.owner.trim() });
    setEditing(false);
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = note.trim();
    if (!text) return;
    onAddNote(line.id, text);
    setNote("");
  }

  return (
    <>
      <SheetHeader className="gap-2 px-6 pt-6 pb-4 pr-12">
        <SheetTitle>{line.name}</SheetTitle>
        <SheetDescription className="sr-only">
          FY {pnlYear} outlook, monthly amounts and notes. Amounts are in $ thousands.
        </SheetDescription>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            <PnlSectionMark section={line.section} />
            {section.name}
          </Badge>
          <Badge
            variant={
              row.variance.status === "adverse"
                ? "destructive-light"
                : row.variance.status === "favourable"
                  ? "success-light"
                  : "secondary"
            }
          >
            {status}
          </Badge>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-foreground"
            >
              {line.owner
                .split(/\s+/)
                .filter(Boolean)
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            {line.owner}
          </span>
        </div>
      </SheetHeader>
      {editing ? (
        <form id={formId} className="min-h-0 flex-1 overflow-y-auto px-6 py-4" onSubmit={saveLine}>
          <h3 className="mb-4 font-medium">Edit Line</h3>
          <PnlLineFields draft={draft} onChange={setDraft} />
        </form>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
          <TabsList
            variant="line"
            aria-label="Line details"
            className="h-10 w-full shrink-0 justify-start gap-4 border-b px-6 py-0"
          >
            <TabsTrigger
              value="overview"
              className="flex-none px-0 group-data-horizontal/tabs:after:bottom-0"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="months"
              className="flex-none px-0 group-data-horizontal/tabs:after:bottom-0"
            >
              Months
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex-none gap-1.5 px-0 group-data-horizontal/tabs:after:bottom-0"
            >
              Notes
              <span className="text-xs text-muted-foreground">{line.notes.length}</span>
            </TabsTrigger>
          </TabsList>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <TabsContent value="overview" className="space-y-5 px-6 py-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Outlook</div>
                  <div className="text-lg font-semibold tabular-nums">
                    ${formatPnlCompact(row.outlook)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${formatPnlCompact(row.closed)} closed
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">vs {compareLabel}</div>
                  <PnlVarianceCell variance={row.variance} showDelta />
                </div>
                <Field className="col-span-2 gap-1 sm:col-span-1">
                  <FieldLabel className="text-xs font-normal text-muted-foreground">
                    Confidence
                  </FieldLabel>
                  <PnlConfidenceCell
                    value={line.confidence}
                    onChange={(value) => onConfidence(line.id, value)}
                    label="Forecast confidence"
                  />
                  <FieldDescription className="text-xs">Of the open months</FieldDescription>
                </Field>
              </div>
              <Frame spacing="sm">
                <FrameHeader>
                  <FrameTitle>Full Year Outlook</FrameTitle>
                  <FrameDescription>Outlook against {compareLabel.toLowerCase()}</FrameDescription>
                </FrameHeader>
                <FramePanel>
                  <div className="h-28">
                    <PnlOutlookChart row={row} compareLabel={compareLabel} />
                  </div>
                  <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {compareLabel} ${formatPnlCompact(row.baselineTotal)}
                    </span>
                    <span>Outlook ${formatPnlCompact(row.outlook)}</span>
                  </div>
                </FramePanel>
              </Frame>
              <Frame spacing="sm">
                <FrameHeader>
                  <FrameTitle>Details</FrameTitle>
                  <FrameDescription>Who owns the line and its plan.</FrameDescription>
                </FrameHeader>
                <FramePanel>
                  <dl className="space-y-3 text-sm">
                    <PnlDetail label="Owner">{line.owner}</PnlDetail>
                    <PnlDetail label="Section">{section.name}</PnlDetail>
                    <PnlDetail label="Reads">
                      {section.read === "higher" ? "Higher is better" : "Lower is better"}
                    </PnlDetail>
                    <PnlDetail label="Budget">${formatPnlCompact(budget)}</PnlDetail>
                    <PnlDetail label="Prior Year">${formatPnlCompact(prior)}</PnlDetail>
                    <PnlDetail label="Section Scope">{section.scope}</PnlDetail>
                  </dl>
                </FramePanel>
              </Frame>
            </TabsContent>
            {/* These tab/form layouts are original local-demo completions; reference exact layout was not observed. */}
            <TabsContent value="months" className="space-y-4 px-6 py-5">
              <p className="text-xs text-muted-foreground">
                FY {pnlYear} · amounts in $ thousands. Edit blue forecast months in the statement.
              </p>
              <div className="space-y-1">
                {pnlMonths.map((month) => (
                  <Item key={month.id} size="sm" className="rounded-lg px-2 py-2">
                    <ItemContent>
                      <ItemTitle>{month.name}</ItemTitle>
                      <ItemDescription>{month.forecast ? "Forecast" : "Closed"}</ItemDescription>
                    </ItemContent>
                    <span
                      className={
                        month.forecast
                          ? "font-medium text-blue-600 tabular-nums dark:text-blue-400"
                          : "font-medium tabular-nums"
                      }
                    >
                      {formatPnlNumber(row.values[month.index] ?? 0)}
                    </span>
                    <span className="w-24 text-right text-xs text-muted-foreground tabular-nums">
                      {compareLabel} {formatPnlNumber(row.baseline[month.index] ?? 0)}
                    </span>
                  </Item>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="notes" className="space-y-5 px-6 py-5">
              <div className="space-y-3">
                {line.notes.length ? (
                  line.notes.map((entry) => (
                    <Item key={entry.id} variant="outline" className="items-start">
                      <ItemContent>
                        <ItemTitle>{entry.author}</ItemTitle>
                        <p className="whitespace-pre-wrap break-words text-sm">{entry.text}</p>
                        <ItemDescription>{entry.createdAt}</ItemDescription>
                      </ItemContent>
                    </Item>
                  ))
                ) : (
                  <Item variant="muted">
                    <MessageSquare className="size-4 text-muted-foreground" />
                    <ItemContent>
                      <ItemTitle>No notes yet</ItemTitle>
                      <ItemDescription>Add context for this line's forecast.</ItemDescription>
                    </ItemContent>
                  </Item>
                )}
              </div>
              <form onSubmit={addNote} className="space-y-3">
                <Field>
                  <FieldLabel htmlFor={noteId}>Add Note</FieldLabel>
                  <Textarea
                    id={noteId}
                    required
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="What changed in the outlook?"
                    rows={3}
                  />
                </Field>
                <Button type="submit" variant="outline" disabled={!note.trim()}>
                  Add Note
                </Button>
              </form>
            </TabsContent>
          </div>
        </Tabs>
      )}
      <SheetFooter className="mt-0 shrink-0 flex-row justify-between border-t px-6 py-4">
        {editing ? (
          <>
            <Button type="button" variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button type="submit" form={formId} disabled={!canSave}>
              Save Changes
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={beginEdit}>
              <Pencil />
              Edit Line
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="text-destructive">
                  <Trash2 />
                  Remove Line
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="reui-reference rpo-remove-line-dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove {line.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the line and its notes from this local statement. Other lines
                    remain unchanged.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      onRemoveLine(line.id);
                      onOpenChange(false);
                    }}
                  >
                    Remove Line
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </SheetFooter>
    </>
  );
}

export function PnlLineSheet({
  line,
  row,
  compare,
  open,
  onOpenChange,
  onConfidence,
  onUpdateLine,
  onRemoveLine,
  onAddNote,
}: {
  line: PnlLine | null;
  row: PnlRow | null;
  compare: PnlCompareBase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfidence: (id: string, value: PnlConfidence) => void;
  onUpdateLine: (id: string, patch: PnlLinePatch) => void;
  onRemoveLine: (id: string) => void;
  onAddNote: (id: string, text: string) => void;
}) {
  return (
    <Sheet open={open && Boolean(line && row)} onOpenChange={onOpenChange}>
      <SheetContent className="reui-reference rpo-line-sheet gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[480px]">
        {line && row && (
          <PnlLineSheetBody
            key={line.id}
            line={line}
            row={row}
            compare={compare}
            onOpenChange={onOpenChange}
            onConfidence={onConfidence}
            onUpdateLine={onUpdateLine}
            onRemoveLine={onRemoveLine}
            onAddNote={onAddNote}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PnlAddLineForm({
  section,
  onOpenChange,
  onAdd,
}: {
  section: PnlSectionId;
  onOpenChange: (open: boolean) => void;
  onAdd: (value: PnlLineDraft) => void;
}) {
  const [draft, setDraft] = useState<PnlLineDraft>({ name: "", owner: "", section });
  const canAdd = Boolean(draft.name.trim() && draft.owner.trim());

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAdd) return;
    // Parent creates zero-valued month arrays; this form never invents historical amounts.
    onAdd({ ...draft, name: draft.name.trim(), owner: draft.owner.trim() });
    onOpenChange(false);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PnlLineFields draft={draft} onChange={setDraft} />
      <FieldDescription>
        New lines start at zero. Add forecast amounts in the statement.
      </FieldDescription>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canAdd}>
          Add Line
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PnlAddLineDialog({
  section,
  open,
  onOpenChange,
  onAdd,
}: {
  section: PnlSectionId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (value: PnlLineDraft) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="reui-reference rpo-add-line-dialog">
        <DialogHeader>
          <DialogTitle>Add Line</DialogTitle>
          <DialogDescription>Add a line to this local P&amp;L statement.</DialogDescription>
        </DialogHeader>
        <PnlAddLineForm
          key={section ?? "revenue"}
          section={section ?? "revenue"}
          onOpenChange={onOpenChange}
          onAdd={onAdd}
        />
      </DialogContent>
    </Dialog>
  );
}
