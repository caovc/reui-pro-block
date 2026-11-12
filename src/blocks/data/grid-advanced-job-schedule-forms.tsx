import { useId, useState, type FormEvent, type ReactNode } from "react";
import { CalendarDays, Plus, Trash2, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  SCHEDULE_TODAY,
  calendarDate,
  calendarKey,
  crew,
  crewConflicts,
  dayStates,
  isWorkday,
  jobDate,
  jobName,
  jobProgress,
  jobTypes,
  plannedFinish,
  slidePlan,
  slideReasons,
  type Assignment,
  type CrewConflict,
  type CrewDay,
  type DayState,
  type Job,
  type JobProfile,
  type JobType,
} from "./grid-advanced-job-schedule-model";

type Option = string | { value: string; label: string };
const crewOptions = crew.map(({ id, name }) => ({ value: id, label: name }));

// Only the new-job consumer uses the reference's inset phone frame.
export const createJobSheetClassName =
  "max-sm:data-[side=right]:inset-4 max-sm:data-[side=right]:h-[calc(100dvh-2rem)] max-sm:data-[side=right]:w-[calc(100%-2rem)] max-sm:overflow-hidden max-sm:rounded-[14px]";

export function JobSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={label} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => {
            const item = typeof option === "string" ? { value: option, label: option } : option;
            return (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function JobDateField({
  label,
  value,
  onChange,
  description,
  inline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  inline?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const selected = value ? calendarDate(value) : undefined;
  const calendar = (
    <Calendar
      mode="single"
      selected={selected}
      defaultMonth={selected ?? calendarDate(SCHEDULE_TODAY)}
      today={calendarDate(SCHEDULE_TODAY)}
      disabled={{ dayOfWeek: [0, 6] }}
      onSelect={(date) => {
        if (!date) return;
        onChange(calendarKey(date));
        setOpen(false);
      }}
    />
  );
  return (
    <Field>
      {inline ? (
        <FieldLabel id={id}>{label}</FieldLabel>
      ) : (
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
      )}
      {inline ? (
        <div role="group" aria-labelledby={id} className="max-w-full self-start rounded-lg border">
          {calendar}
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              aria-label={label}
              type="button"
              variant="outline"
              className="justify-start"
            >
              <CalendarDays data-icon="inline-start" />
              {value ? jobDate(value, true) : "Pick a day"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto max-w-[calc(100vw-32px)] p-0">
            {calendar}
          </PopoverContent>
        </Popover>
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

function JobNumber({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min: number;
  max: number;
  step?: number;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NumberField id={id} value={value} min={min} max={max} step={step} onValueChange={onChange}>
        <NumberFieldGroup>
          <NumberFieldDecrement aria-label={`Decrease ${label.toLowerCase()}`} />
          <NumberFieldInput aria-label={label} />
          <NumberFieldIncrement aria-label={`Increase ${label.toLowerCase()}`} />
        </NumberFieldGroup>
      </NumberField>
    </Field>
  );
}

function JobForm({
  title,
  description,
  submitLabel,
  children,
  error,
  onCancel,
  onSubmit,
  disabled,
}: {
  title: string;
  description: string;
  submitLabel: string;
  children: ReactNode;
  error?: string;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <SheetHeader className="shrink-0 border-b pr-12">
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </SheetHeader>
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <FieldGroup className="min-h-0 flex-1 gap-4 overflow-auto p-4">
          {children}
          {error && <FieldError role="alert">{error}</FieldError>}
        </FieldGroup>
        <SheetFooter className="shrink-0 flex-row justify-end border-t bg-muted/30">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={disabled}>
            {submitLabel}
          </Button>
        </SheetFooter>
      </form>
    </>
  );
}

function TextField({
  label,
  name,
  value,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  value?: string;
  type?: "text" | "tel";
  placeholder?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={name}
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        required={required}
      />
    </Field>
  );
}

export function JobProfileForm({
  job,
  onSave,
  onCancel,
}: {
  job?: Job;
  onSave: (profile: JobProfile) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [type, setType] = useState<JobType | "">(job?.type ?? "");
  const [lead, setLead] = useState(job?.lead ?? "");
  const [start, setStart] = useState(job?.start ?? "");
  const [due, setDue] = useState(job?.due ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const client = String(data.get("client") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const street = String(data.get("street") ?? "").trim();
    const town = String(data.get("town") ?? "").trim();
    if (!client || !street || !town || !type || !lead || !isWorkday(start)) {
      setError("Enter the client, address, job type, lead, and a start workday.");
      return;
    }
    if (due && (!isWorkday(due) || due < start)) {
      setError("Choose a due workday on or after the start date.");
      return;
    }
    onSave({
      client,
      phone,
      street,
      town,
      type,
      lead,
      start,
      due: due || plannedFinish(type, start),
    });
  }

  return (
    <JobForm
      title={job ? "Edit Job" : "Add Job"}
      description={job ? jobName(job) : "Crew days are planned from the job type."}
      submitLabel={job ? "Save Changes" : "Add Job"}
      onSubmit={submit}
      onCancel={onCancel}
      error={error}
    >
      <div className={job ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3 sm:grid-cols-2"}>
        <TextField
          label="Client"
          name="client"
          value={job?.client}
          placeholder={job ? undefined : "Full name"}
          required
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          value={job?.phone}
          placeholder={job ? undefined : "(312) 555-0100"}
        />
      </div>
      <TextField
        label="Street"
        name="street"
        value={job?.street}
        placeholder={job ? undefined : "House number and street"}
        required
      />
      <TextField
        label="Town"
        name="town"
        value={job?.town}
        placeholder={job ? undefined : "Town"}
        required
      />
      <div className={job ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3 sm:grid-cols-2"}>
        {!job && (
          <Field>
            <FieldLabel htmlFor={`${id}-type`}>Job Type</FieldLabel>
            <JobSelect
              id={`${id}-type`}
              label="Job Type"
              value={type}
              onChange={(value) => setType(value as JobType)}
              options={jobTypes}
              placeholder="Pick a type"
              className="w-full"
            />
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor={`${id}-lead`}>Lead</FieldLabel>
          <JobSelect
            id={`${id}-lead`}
            label="Lead"
            value={lead}
            onChange={setLead}
            options={crewOptions}
            placeholder="Pick a lead"
            className="w-full"
          />
        </Field>
      </div>
      {!job && (
        <JobDateField
          label="Start"
          value={start}
          onChange={setStart}
          description="Planned from the job type."
        />
      )}
      <JobDateField
        label="Due Date"
        value={due}
        onChange={setDue}
        description={
          job
            ? undefined
            : type && start
              ? `Defaults to ${jobDate(plannedFinish(type, start), true)}.`
              : "Left empty, it matches the planned finish"
        }
      />
    </JobForm>
  );
}

function Conflicts({ conflicts }: { conflicts: CrewConflict[] }) {
  if (!conflicts.length) return null;
  return (
    <Alert variant="warning" role="alert">
      <TriangleAlert />
      <AlertTitle>Crew booked twice</AlertTitle>
      <AlertDescription>
        <ul className="flex list-disc flex-col gap-1 pl-4">
          {conflicts.map(({ date, member, otherJob }) => (
            <li key={`${date}:${member}:${otherJob}`}>
              {member} is also at {otherJob} on {jobDate(date)}.
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

export function CrewDayForm({
  job,
  date,
  jobs,
  onSave,
  onRemove,
  onCancel,
}: {
  job: Job;
  date: string;
  jobs: readonly Job[];
  onSave: (day: CrewDay, previous: string | null) => boolean;
  onRemove: (date: string) => void;
  onCancel: () => void;
}) {
  const original = job.days.find((day) => day.date === date);
  const [workday, setWorkday] = useState(date);
  const [state, setState] = useState<DayState>(
    original?.state ?? (date < SCHEDULE_TODAY ? "Done" : "Planned"),
  );
  const [reason, setReason] = useState(original?.reason ?? "");
  const [tasks, setTasks] = useState<Assignment[]>(
    () => original?.tasks ?? [{ id: crypto.randomUUID(), crewId: job.lead, task: "", hours: 8 }],
  );
  const [error, setError] = useState("");
  const id = useId();
  const title = original
    ? "Edit Crew Day"
    : date < SCHEDULE_TODAY
      ? "Log Crew Day"
      : "Add Crew Day";
  const draft: CrewDay = {
    date: workday,
    state,
    tasks,
    ...(state === "Lost" ? { reason: reason.trim(), madeUp: original?.madeUp } : {}),
  };
  const conflicts = crewConflicts(job.id, [draft], jobs);

  function patchTask(id: string, patch: Partial<Assignment>) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isWorkday(workday)) {
      setError("Choose a workday.");
      return;
    }
    if (state === "Lost" && !reason.trim()) {
      setError("Enter the reason this crew day was lost.");
      return;
    }
    if (
      tasks.some(
        (task) =>
          !task.task.trim() ||
          !task.crewId ||
          !Number.isFinite(task.hours) ||
          task.hours < 0.5 ||
          task.hours > 16,
      )
    ) {
      setError("Every task needs a description, crew member and 0.5 to 16 hours.");
      return;
    }
    if (
      !onSave(
        { ...draft, tasks: tasks.map((task) => ({ ...task, task: task.task.trim() })) },
        original?.date ?? null,
      )
    ) {
      setError("This job already has a crew day on the selected date.");
    }
  }

  return (
    <JobForm
      title={title}
      description={jobName(job)}
      submitLabel={original ? "Save Crew Day" : title}
      onSubmit={submit}
      onCancel={onCancel}
      error={error}
    >
      <JobDateField label="Workday" value={workday} onChange={setWorkday} inline />
      <Field>
        <FieldLabel htmlFor={`${id}-state`}>State</FieldLabel>
        <JobSelect
          id={`${id}-state`}
          label="State"
          value={state}
          onChange={(value) => setState(value as DayState)}
          options={dayStates}
          className="w-full"
        />
      </Field>
      {state === "Lost" && (
        <Field>
          <FieldLabel htmlFor={`${id}-reason`}>Reason</FieldLabel>
          <Input
            id={`${id}-reason`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
          />
        </Field>
      )}
      {tasks.map((task, index) => (
        <fieldset key={task.id} className="rounded-lg border p-3">
          <legend className="px-1 text-xs text-muted-foreground">Task {index + 1}</legend>
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor={`${id}-${task.id}-name`}>Task</FieldLabel>
              <Input
                id={`${id}-${task.id}-name`}
                value={task.task}
                onChange={(event) => patchTask(task.id, { task: event.target.value })}
                required
              />
            </Field>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(100px,0.55fr)] gap-3">
              <Field>
                <FieldLabel htmlFor={`${id}-${task.id}-crew`}>Crew member</FieldLabel>
                <JobSelect
                  id={`${id}-${task.id}-crew`}
                  label="Crew member"
                  value={task.crewId}
                  onChange={(crewId) => patchTask(task.id, { crewId })}
                  options={crewOptions}
                  className="w-full"
                />
              </Field>
              <JobNumber
                label="Hours"
                value={task.hours || null}
                min={0.5}
                max={16}
                step={0.5}
                onChange={(value) => patchTask(task.id, { hours: value ?? 0 })}
              />
            </div>
            {tasks.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() =>
                  setTasks((current) => current.filter((entry) => entry.id !== task.id))
                }
              >
                <Trash2 data-icon="inline-start" />
                Remove task {index + 1}
              </Button>
            )}
          </FieldGroup>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setTasks((current) => [
              ...current,
              { id: crypto.randomUUID(), crewId: job.lead, task: "", hours: 8 },
            ])
          }
        >
          <Plus data-icon="inline-start" />
          Add Task
        </Button>
        {original && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(original.date)}>
            <Trash2 data-icon="inline-start" />
            Remove Crew Day
          </Button>
        )}
      </div>
      <Conflicts conflicts={conflicts} />
    </JobForm>
  );
}

export function SlideForm({
  job,
  jobs,
  makeUpDate,
  onSave,
  onCancel,
}: {
  job: Job;
  jobs: readonly Job[];
  makeUpDate?: string;
  onSave: (days: CrewDay[], detail: string) => void;
  onCancel: () => void;
}) {
  const initial = job.days.find(
    (day) => day.state === "Planned" && day.date >= SCHEDULE_TODAY,
  )?.date;
  const [from, setFrom] = useState(initial ?? SCHEDULE_TODAY);
  const [offset, setOffset] = useState<number | null>(1);
  const [reason, setReason] = useState(makeUpDate ? "Rain or weather" : "");
  const id = useId();
  const plan = slidePlan(job, from, offset ?? 0, jobs, makeUpDate);
  const original = jobProgress(job);
  const updated = plan.days ? jobProgress({ ...job, days: plan.days }) : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!plan.days || !reason || !offset) return;
    onSave(
      plan.days,
      `${offset > 0 ? "+" : ""}${offset} workdays from ${jobDate(from)} · ${reason}`,
    );
  }

  return (
    <JobForm
      title="Slide Schedule"
      description={jobName(job)}
      submitLabel="Slide"
      onSubmit={submit}
      onCancel={onCancel}
      disabled={!plan.days || !reason}
      error={plan.error}
    >
      <JobDateField label="From" value={from} onChange={setFrom} />
      <JobNumber label="Workdays" value={offset} onChange={setOffset} min={-30} max={30} />
      <FieldDescription>Below 0 pulls the work in.</FieldDescription>
      <Field>
        <FieldLabel htmlFor={`${id}-reason`}>Reason</FieldLabel>
        <JobSelect
          id={`${id}-reason`}
          label="Reason"
          value={reason}
          onChange={setReason}
          options={slideReasons}
          placeholder="Pick a reason"
          className="w-full"
        />
      </Field>
      {updated && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <p className="text-sm font-medium">What moves</p>
          <p className="text-sm text-muted-foreground">
            {plan.moved} {plan.moved === 1 ? "crew day" : "crew days"} · Finish{" "}
            {jobDate(original.finish)} to {jobDate(updated.finish)}
          </p>
          {updated.late > 0 && (
            <Badge variant="destructive-light" className="self-start">
              {updated.late} workdays past due
            </Badge>
          )}
        </div>
      )}
      <Conflicts conflicts={plan.conflicts} />
    </JobForm>
  );
}

export function HoldForm({
  job,
  onSave,
  onCancel,
}: {
  job: Job;
  onSave: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const id = useId();
  return (
    <JobForm
      title="Hold Job"
      description={jobName(job)}
      submitLabel="Put on Hold"
      onCancel={onCancel}
      disabled={!reason.trim()}
      onSubmit={(event) => {
        event.preventDefault();
        if (reason.trim()) onSave(reason.trim());
      }}
    >
      <Field>
        <FieldLabel htmlFor={id}>Reason</FieldLabel>
        <Textarea
          id={id}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
        />
      </Field>
    </JobForm>
  );
}
