/* eslint-disable react/only-export-components */
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  NativeGrid,
  NativePager,
  NativeTable,
  useGridTable,
  type GridColumn,
} from "@/blocks/data/grid-base-engine";
import { Facet, Frame, Identity, Toolbar } from "@/blocks/data/grid-base-common";
import { CalendarSelect } from "@/components/reui/calendar-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  atlasInitialTimeRange,
  atlasTimeDate,
  atlasTimeDateKey,
  atlasTimePeople,
  atlasTimeRangeDays,
  atlasTimeRowMatches,
  atlasTimeRows,
  atlasWorkTypes,
  createAtlasTimeEntries,
  formatAtlasMinutes,
  saveAtlasTimeEntry,
  shiftAtlasTimeDate,
  type AtlasTimeEntry,
  type AtlasTimeFilters,
  type AtlasTimeRange,
  type AtlasTimeRow,
  type AtlasWorkType,
} from "./atlas-timesheets-model";
import { toast } from "./shared";
import "./atlas-timesheets.css";

export function useAtlasTimesheetState() {
  const [entries, setEntries] = useState(createAtlasTimeEntries);
  const [range, setRange] = useState(atlasInitialTimeRange);
  const [filters, setFilters] = useState<AtlasTimeFilters>({
    people: [],
    tracked: [],
    billable: [],
  });
  return { entries, setEntries, range, setRange, filters, setFilters };
}
type AtlasTimesheetState = ReturnType<typeof useAtlasTimesheetState>;
const dateLabel = (date: string) => format(atlasTimeDate(date)!, "MMM d, yyyy");
const rangeLabel = (range: AtlasTimeRange) =>
  `${format(atlasTimeDate(range.from)!, "MMM d")} – ${dateLabel(range.to)}`;

type TimeDialog =
  | { view: "day"; personId: number; date: string }
  | { view: "entry"; entry: AtlasTimeEntry; existing: boolean };

function TimeRangeControl({
  value,
  onChange,
}: {
  value: AtlasTimeRange;
  onChange: (range: AtlasTimeRange) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const days = atlasTimeRangeDays(draft);
  const from = atlasTimeDate(draft.from);
  const to = atlasTimeDate(draft.to);
  const shift = (direction: number) => {
    const offset = atlasTimeRangeDays(value).length * direction;
    onChange({
      from: shiftAtlasTimeDate(value.from, offset),
      to: shiftAtlasTimeDate(value.to, offset),
    });
  };
  return (
    <div className="atlas-time-range">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Previous time period"
        onClick={() => shift(-1)}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setDraft(value);
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label={`Choose timesheet dates: ${rangeLabel(value)}`}
          >
            <CalendarDays aria-hidden="true" />
            <span>{rangeLabel(value)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="reui-reference atlas-time-range-popover"
          aria-label="Timesheet date range"
        >
          <CalendarSelect
            mode="range"
            selected={{ from: from ?? undefined, to: to ?? undefined }}
            onSelect={(range) =>
              setDraft({
                from: range?.from ? atlasTimeDateKey(range.from) : "",
                to: range?.to ? atlasTimeDateKey(range.to) : "",
              })
            }
            defaultMonth={atlasTimeDate(value.from)!}
            startMonth={new Date(2020, 0, 1)}
            endMonth={new Date(2035, 11, 31)}
            weekStartsOn={1}
          />
          <FieldGroup className="atlas-time-range-fields">
            <Field>
              <FieldLabel htmlFor={`${id}-from`}>Start date</FieldLabel>
              <Input
                id={`${id}-from`}
                type="date"
                value={draft.from}
                onChange={(event) => setDraft({ ...draft, from: event.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-to`}>End date</FieldLabel>
              <Input
                id={`${id}-to`}
                type="date"
                value={draft.to}
                onChange={(event) => setDraft({ ...draft, to: event.target.value })}
              />
            </Field>
          </FieldGroup>
          <p className="atlas-time-hint" role="status">
            {days.length
              ? `${days.length} days selected`
              : "Choose an ordered date range of up to 31 days."}
          </p>
          <div className="atlas-time-range-actions">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!days.length}
              onClick={() => {
                onChange(draft);
                setOpen(false);
              }}
            >
              Apply dates
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Next time period"
        onClick={() => shift(1)}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}

function TimeEntryEditor({
  entry,
  existing,
  onSave,
  onCancel,
}: {
  entry: AtlasTimeEntry;
  existing: boolean;
  onSave: (entry: AtlasTimeEntry) => string | null;
  onCancel: () => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(entry);
  const [hours, setHours] = useState(String(entry.minutes / 60));
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="atlas-time-entry-form"
      onSubmit={(event) => {
        event.preventDefault();
        const value = Number(hours);
        if (!hours.trim() || !Number.isFinite(value)) {
          setError("Enter a valid duration.");
          return;
        }
        setError(onSave({ ...draft, minutes: Math.round(value * 60) }));
      }}
    >
      <FieldGroup className="atlas-time-entry-fields">
        <Field className="atlas-time-entry-person">
          <FieldLabel htmlFor={`${id}-person`}>Team member</FieldLabel>
          <Select
            value={String(draft.personId)}
            onValueChange={(value) => setDraft({ ...draft, personId: Number(value) })}
          >
            <SelectTrigger id={`${id}-person`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="reui-reference">
              <SelectGroup>
                {atlasTimePeople.map((person) => (
                  <SelectItem key={person.id} value={String(person.id)}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-date`}>Entry date</FieldLabel>
          <Input
            id={`${id}-date`}
            type="date"
            required
            autoFocus
            value={draft.date}
            onChange={(event) => setDraft({ ...draft, date: event.target.value })}
          />
        </Field>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor={`${id}-hours`}>Hours</FieldLabel>
          <Input
            id={`${id}-hours`}
            type="number"
            required
            min="0.25"
            max="24"
            step="0.25"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-duration-hint${error ? ` ${id}-error` : ""}`}
          />
          <FieldDescription id={`${id}-duration-hint`}>Use 0.25 for 15 minutes.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-work`}>Work type</FieldLabel>
          <Select
            value={draft.workType}
            onValueChange={(value) => setDraft({ ...draft, workType: value as AtlasWorkType })}
          >
            <SelectTrigger id={`${id}-work`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="reui-reference">
              <SelectGroup>
                {atlasWorkTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field orientation="horizontal" className="atlas-time-entry-billable">
          <Checkbox
            id={`${id}-billable`}
            checked={draft.billable}
            onCheckedChange={(value) => setDraft({ ...draft, billable: value === true })}
          />
          <FieldLabel htmlFor={`${id}-billable`}>Billable time</FieldLabel>
        </Field>
        <Field className="atlas-time-entry-note">
          <FieldLabel htmlFor={`${id}-note`}>Note</FieldLabel>
          <Textarea
            id={`${id}-note`}
            value={draft.note}
            maxLength={500}
            onChange={(event) => setDraft({ ...draft, note: event.target.value })}
            placeholder="What did you work on?"
          />
        </Field>
      </FieldGroup>
      {error && (
        <p id={`${id}-error`} className="atlas-time-error" role="alert">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{existing ? "Save changes" : "Save entry"}</Button>
      </DialogFooter>
    </form>
  );
}

export function AtlasTimesheets({
  model,
  onViewEntry,
}: {
  model: AtlasTimesheetState;
  onViewEntry: () => void;
}) {
  const [dialog, setDialog] = useState<TimeDialog | null>(null);
  const newEntry = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const dates = useMemo(() => atlasTimeRangeDays(model.range), [model.range]);
  const rows = useMemo(
    () => atlasTimeRows(model.entries, model.range, model.filters.billable),
    [model.entries, model.range, model.filters.billable],
  );
  const match = useCallback(
    (row: AtlasTimeRow) => atlasTimeRowMatches(row, model.filters),
    [model.filters],
  );
  const openEntry = (personId: number, date: string) =>
    setDialog({
      view: "entry",
      existing: false,
      entry: {
        id: crypto.randomUUID(),
        personId,
        date,
        minutes: 60,
        workType: "Client",
        billable: true,
        note: "",
      },
    });
  const fields = useMemo<GridColumn<AtlasTimeRow>[]>(
    () => [
      {
        id: "People",
        value: (row) => row.name,
        width: 220,
        hideable: false,
        cell: (row) => <Identity name={row.name} detail={row.role} photo={false} />,
      },
      ...dates.map((date) => ({
        id: date,
        title: format(atlasTimeDate(date)!, "EEE, MMM d"),
        value: (row: AtlasTimeRow) => row.days.find((day) => day.date === date)!.minutes,
        width: 150,
        hideable: false,
        cell: (row: AtlasTimeRow) => {
          const day = row.days.find((value) => value.date === date)!;
          return (
            <Button
              variant="ghost"
              size="sm"
              className="atlas-time-day"
              aria-label={`Time for ${row.name}, ${dateLabel(date)}: ${formatAtlasMinutes(day.minutes)}`}
              onClick={(event) => {
                opener.current = event.currentTarget;
                setDialog({ view: "day", personId: row.id, date });
              }}
            >
              <strong>{day.minutes ? formatAtlasMinutes(day.minutes) : "—"}</strong>
              <Progress
                value={Math.min(100, (day.minutes / 480) * 100)}
                aria-label={`${row.name}, ${dateLabel(date)} tracked time`}
                aria-valuetext={`${formatAtlasMinutes(day.minutes)} tracked`}
              />
              <small>{day.workTypes.join(" + ") || "No time logged"}</small>
            </Button>
          );
        },
      })),
      {
        id: "Total",
        value: (row) => row.minutes,
        width: 170,
        hideable: false,
        cell: (row) => (
          <div className="atlas-time-total">
            <strong>{formatAtlasMinutes(row.minutes)}</strong>
            <small>{formatAtlasMinutes(row.billableMinutes)} billable</small>
            <span>
              {row.targetMinutes
                ? `${Math.round((row.minutes / row.targetMinutes) * 100)}% of target`
                : "No target for this range"}
            </span>
          </div>
        ),
      },
    ],
    [dates],
  );
  const table = useGridTable({ data: rows, fields, filter: match });
  const visible = table.getFilteredRowModel().rows.map((row) => row.original);
  const tracked = visible.reduce((sum, row) => sum + row.minutes, 0);
  const billable = visible.reduce((sum, row) => sum + row.billableMinutes, 0);
  const changeRange = (range: AtlasTimeRange) => {
    model.setRange(range);
    table.setPageIndex(0);
  };
  const changeFilter = (key: keyof AtlasTimeFilters, values: string[]) => {
    model.setFilters((old) => ({ ...old, [key]: values }));
    table.setPageIndex(0);
  };
  const showEntry = (entry: AtlasTimeEntry) => {
    const date = atlasTimeDate(entry.date)!;
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const from = atlasTimeDateKey(date);
    model.setRange({ from, to: shiftAtlasTimeDate(from, 6) });
    model.setFilters({
      people: [atlasTimePeople.find((person) => person.id === entry.personId)!.name],
      tracked: [],
      billable: [],
    });
    table.setPageIndex(0);
    onViewEntry();
  };
  const save = (entry: AtlasTimeEntry) => {
    const result = saveAtlasTimeEntry(model.entries, entry);
    if (result.error) return result.error;
    model.setEntries(result.entries);
    setDialog(null);
    toast.success(
      dialog?.view === "entry" && dialog.existing ? "Time entry updated" : "Time entry added",
      {
        description: `${atlasTimePeople.find((person) => person.id === entry.personId)!.name} · ${dateLabel(entry.date)}`,
        action: { label: "View entry", onClick: () => showEntry(entry) },
      },
    );
    return null;
  };
  const dayEntries =
    dialog?.view === "day"
      ? model.entries.filter(
          (entry) => entry.personId === dialog.personId && entry.date === dialog.date,
        )
      : [];
  const dayPerson =
    dialog?.view === "day" ? atlasTimePeople.find((person) => person.id === dialog.personId) : null;
  const hasFilters = Object.values(model.filters).some((values) => values.length > 0);
  return (
    <section className="atlas-timesheets" aria-label="Timesheets">
      <NativeGrid table={table} emptyMessage="No people match these time filters.">
        <Frame
          title="Timesheets"
          description="Review tracked and billable time across your team."
          action={
            <Button
              ref={newEntry}
              size="sm"
              onClick={(event) => {
                opener.current = event.currentTarget;
                openEntry(1, model.range.from);
              }}
            >
              <Plus aria-hidden="true" />
              New entry
            </Button>
          }
        >
          <Toolbar>
            <Facet
              label="People"
              options={atlasTimePeople.map((person) => person.name)}
              value={model.filters.people}
              onChange={(values) => changeFilter("people", values)}
            />
            <Facet
              label="Tracked time"
              options={["Less than 20 hours", "20–40 hours", "More than 40 hours"]}
              value={model.filters.tracked}
              onChange={(values) => changeFilter("tracked", values)}
            />
            <Facet
              label="Billable status"
              options={["Billable", "Non-billable"]}
              value={model.filters.billable}
              onChange={(values) => changeFilter("billable", values)}
            />
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  model.setFilters({ people: [], tracked: [], billable: [] });
                  table.setPageIndex(0);
                }}
              >
                Clear filters
              </Button>
            )}
            <TimeRangeControl value={model.range} onChange={changeRange} />
          </Toolbar>
          <div className="atlas-time-summary" role="status" aria-live="polite">
            <span>{visible.length} people</span>
            <strong>{formatAtlasMinutes(tracked)} tracked</strong>
            <span>{formatAtlasMinutes(billable)} billable</span>
          </div>
          <NativeTable />
          <NativePager noun="people" />
        </Frame>
      </NativeGrid>
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent
          className="reui-reference atlas-time-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = opener.current;
            (target?.isConnected && target.getClientRects().length
              ? target
              : newEntry.current
            )?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {dialog?.view === "entry"
                ? dialog.existing
                  ? "Edit time entry"
                  : "New time entry"
                : "Daily time entries"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.view === "day"
                ? `${dayPerson?.name} · ${dateLabel(dialog.date)}`
                : "Record time for a team member. Changes update the timesheet totals."}
            </DialogDescription>
          </DialogHeader>
          {dialog?.view === "entry" ? (
            <TimeEntryEditor
              key={dialog.entry.id}
              entry={dialog.entry}
              existing={dialog.existing}
              onSave={save}
              onCancel={() => setDialog(null)}
            />
          ) : (
            dialog?.view === "day" && (
              <div className="atlas-time-day-detail">
                {dayEntries.length ? (
                  <ul>
                    {dayEntries.map((entry) => (
                      <li key={entry.id}>
                        <div>
                          <strong>{formatAtlasMinutes(entry.minutes)}</strong>
                          <span>
                            {entry.workType} · {entry.billable ? "Billable" : "Non-billable"}
                          </span>
                          {entry.note && <p>{entry.note}</p>}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Edit ${formatAtlasMinutes(entry.minutes)} entry for ${dayPerson?.name}`}
                          onClick={() =>
                            setDialog({ view: "entry", entry: { ...entry }, existing: true })
                          }
                        >
                          Edit
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="atlas-time-hint">No time has been recorded for this day.</p>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialog(null)}>
                    Close
                  </Button>
                  <Button onClick={() => openEntry(dialog.personId, dialog.date)}>Add entry</Button>
                </DialogFooter>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
