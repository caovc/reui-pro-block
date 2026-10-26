import { useId, useState, type ReactNode } from "react";
import { CalendarOff, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CAPACITY_ROLES,
  CAPACITY_SERVICES,
  CAPACITY_SHIFTS,
  CAPACITY_TEAMS,
  CAPACITY_TODAY,
  addCapacityDays,
  capacityDateLabel,
  capacityDay,
  capacityWindow,
  personSupportsService,
  isCapacityDate,
  saveCapacityBooking,
  saveCapacityPerson,
  saveCapacityTimeOff,
  type CapacityBooking,
  type CapacityPerson,
  type CapacityStore,
  type CapacityTimeOff,
} from "./grid-advanced-technician-capacity-data";

export type CapacityPanel =
  | { kind: "booking"; value: CapacityBooking; isNew: boolean }
  | { kind: "person"; value: CapacityPerson; isNew: boolean }
  | { kind: "timeOff"; value: CapacityTimeOff; isNew: boolean }
  | { kind: "schedule"; personId: string; week: number };

export function CapacitySelect({
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
  options: readonly (string | { value: string; label: string; disabled?: boolean })[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={label} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const item: { value: string; label: string; disabled?: boolean } =
            typeof option === "string" ? { value: option, label: option } : option;
          return (
            <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "tel";
  required?: boolean;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
/** The public workshop uses a shop-day Select, not a browser date input or calendar. */
function CapacityDateField({
  label,
  value,
  onChange,
  holidays,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  holidays?: Record<string, string>;
}) {
  const id = useId();
  const days = Array.from({ length: 30 }, (_, offset) =>
    addCapacityDays(CAPACITY_TODAY, offset),
  ).filter((day) => new Date(`${day}T12:00:00Z`).getUTCDay() !== 0);
  // Keep an existing past/out-of-window booking editable without shifting its ISO day.
  if (isCapacityDate(value) && !days.includes(value)) days.push(value);
  days.sort();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <CapacitySelect
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        placeholder="Choose a day"
        className="w-full"
        options={days.map((day) => ({
          value: day,
          label: `${capacityDateLabel(day, true)}${holidays?.[day] ? ", closed" : ""}`,
          disabled: !!holidays?.[day],
        }))}
      />
    </Field>
  );
}
function HoursField({
  label,
  value,
  onChange,
  max = 8,
  min = 1,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  step?: number;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NumberField
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(next ?? 0)}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement aria-label={`Decrease ${label.toLowerCase()}`} />
          <NumberFieldInput aria-label={label} />
          <NumberFieldIncrement aria-label={`Increase ${label.toLowerCase()}`} />
        </NumberFieldGroup>
      </NumberField>
    </Field>
  );
}

function PanelShell({
  title,
  description,
  children,
  footer,
  onClose,
  onSubmit,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
}) {
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="capacity-sheet gap-0 rounded-[14px] data-[side=right]:inset-y-4 data-[side=right]:right-4 data-[side=right]:h-auto data-[side=right]:w-[calc(100%_-_32px)] data-[side=right]:border-l-0 data-[side=right]:sm:max-w-[576px]">
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit?.();
          }}
        >
          <SheetHeader className="border-b">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <FieldGroup>{children}</FieldGroup>
          </div>
          <SheetFooter className="flex-row items-center justify-end border-t bg-muted/30">
            {footer}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function BookingPanel({
  panel,
  store,
  onClose,
  onCommit,
}: {
  panel: Extract<CapacityPanel, { kind: "booking" }>;
  store: CapacityStore;
  onClose: () => void;
  onCommit: (store: CapacityStore, message: string) => void;
}) {
  const [draft, setDraft] = useState(panel.value);
  const [error, setError] = useState("");
  const change = <K extends keyof CapacityBooking>(key: K, value: CapacityBooking[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setError("");
  };
  const person = store.people.find((item) => item.id === draft.personId);
  const withoutThis = { ...store, bookings: store.bookings.filter((item) => item.id !== draft.id) };
  const preview = person && draft.day ? capacityDay(withoutThis, person, draft.day) : null;
  const afterHours = (preview?.booked ?? 0) + draft.hours;
  const eligible = store.people.filter((item) => personSupportsService(item, draft.service));
  function save() {
    const result = saveCapacityBooking(store, draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCommit(result.store, panel.isNew ? "Service booked" : "Booking updated");
    onClose();
  }
  return (
    <PanelShell
      title={panel.isNew ? "Book Service" : "Edit Booking"}
      description={
        panel.isNew
          ? isCapacityDate(draft.day)
            ? capacityDateLabel(draft.day, true)
            : "Choose a day"
          : `${panel.value.vehicle}, ${panel.value.customer}`
      }
      onClose={onClose}
      onSubmit={save}
      footer={
        <>
          {!panel.isNew && (
            <Button
              type="button"
              variant="ghost"
              className="mr-auto text-destructive"
              onClick={() => {
                onCommit(
                  { ...store, bookings: store.bookings.filter((item) => item.id !== draft.id) },
                  "Booking removed",
                );
                onClose();
              }}
            >
              <Trash2 />
              Remove
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{panel.isNew ? "Book Service" : "Save Changes"}</Button>
        </>
      }
    >
      <TextField
        label="Customer"
        value={draft.customer}
        onChange={(value) => change("customer", value)}
        required
      />
      <TextField
        label="Phone"
        type="tel"
        value={draft.phone}
        onChange={(value) => change("phone", value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Vehicle"
          value={draft.vehicle}
          onChange={(value) => change("vehicle", value)}
          required
        />
        <TextField
          label="Plate"
          value={draft.plate}
          onChange={(value) => change("plate", value)}
          required
        />
      </div>
      <Field>
        <FieldLabel>Service</FieldLabel>
        <CapacitySelect
          label="Service"
          value={draft.service}
          onChange={(value) => {
            change("service", value as CapacityBooking["service"]);
            if (person && !personSupportsService(person, value)) change("personId", "");
          }}
          options={CAPACITY_SERVICES}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <CapacityDateField
          label="Day"
          value={draft.day}
          onChange={(value) => change("day", value)}
          holidays={store.holidays}
        />
        <HoursField
          label="Hours"
          value={draft.hours}
          onChange={(value) => change("hours", value)}
        />
      </div>
      <Field>
        <FieldLabel>Technician</FieldLabel>
        <CapacitySelect
          label="Technician"
          value={draft.personId}
          onChange={(value) => change("personId", value)}
          placeholder="Pick a technician"
          options={eligible.map((item) => {
            const day = draft.day ? capacityDay(withoutThis, item, draft.day) : null;
            return {
              value: item.id,
              label: `${item.name} · ${day?.capacity ? `${Math.max(0, day.free)}h free` : "Away"}`,
            };
          })}
        />
        <FieldDescription>
          Showing who performs this service, with their free hours that day. Off-shift technicians
          remain selectable; assigned work shows as overtime.
        </FieldDescription>
      </Field>
      {!panel.isNew && (
        <Field>
          <FieldLabel>Status</FieldLabel>
          <CapacitySelect
            label="Status"
            value={draft.status}
            onChange={(value) => change("status", value as CapacityBooking["status"])}
            options={["Scheduled", "In Progress", "Done"]}
          />
        </Field>
      )}
      {preview && (
        <div className="rounded-lg border p-3 text-sm">
          <div className="mb-2 flex justify-between">
            <span className="font-medium">Their Day After</span>
            <span className={afterHours > preview.capacity ? "text-destructive" : ""}>
              {preview.capacity ? `${Math.round((afterHours / preview.capacity) * 100)}%` : "—"}
            </span>
          </div>
          <Progress
            value={
              preview.capacity
                ? Math.min(100, (afterHours / preview.capacity) * 100)
                : afterHours > 0
                  ? 100
                  : 0
            }
            aria-valuetext={`${afterHours}h booked of ${preview.capacity}h`}
            className={
              afterHours > preview.capacity
                ? "h-1.5 [&_[data-slot=progress-indicator]]:bg-red-500"
                : "h-1.5"
            }
          />
          <p className="mt-2 text-muted-foreground">
            {afterHours}h of {preview.capacity}h · {preview.booked}h booked, plus {draft.hours}h
          </p>
        </div>
      )}
      {preview && afterHours > preview.capacity && (
        <Alert variant="warning">
          <AlertDescription>
            <p>
              {person?.name} {preview.capacity ? "is over that day" : "is off that day"}.{" "}
              {draft.day} reaches {afterHours}h of {preview.capacity}h. Save anyway and it shows as
              overtime until services move, or pick someone with room.
            </p>
          </AlertDescription>
        </Alert>
      )}
      {error && <FieldError>{error}</FieldError>}
    </PanelShell>
  );
}

function PersonPanel({
  panel,
  store,
  onClose,
  onCommit,
}: {
  panel: Extract<CapacityPanel, { kind: "person" }>;
  store: CapacityStore;
  onClose: () => void;
  onCommit: (store: CapacityStore, message: string) => void;
}) {
  const [draft, setDraft] = useState(panel.value);
  const [error, setError] = useState("");
  const change = <K extends keyof CapacityPerson>(key: K, value: CapacityPerson[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setError("");
  };
  function save() {
    const result = saveCapacityPerson(store, draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCommit(result.store, panel.isNew ? "Technician added" : "Technician updated");
    onClose();
  }
  return (
    <PanelShell
      title={panel.isNew ? "Add Technician" : "Edit Technician"}
      description={panel.isNew ? "Joins the shop with every shift day open." : panel.value.name}
      onClose={onClose}
      onSubmit={save}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{panel.isNew ? "Add Technician" : "Save Changes"}</Button>
        </>
      }
    >
      <TextField
        label="Name"
        value={draft.name}
        onChange={(value) => change("name", value)}
        required
      />
      <Field>
        <FieldLabel>Role</FieldLabel>
        <CapacitySelect
          label="Role"
          value={draft.role}
          onChange={(value) => change("role", value as CapacityPerson["role"])}
          options={CAPACITY_ROLES}
        />
      </Field>
      <Field>
        <FieldLabel>Team</FieldLabel>
        <CapacitySelect
          label="Team"
          value={draft.team}
          onChange={(value) => change("team", value as CapacityPerson["team"])}
          options={CAPACITY_TEAMS}
        />
      </Field>
      <Field>
        <FieldLabel>Shift</FieldLabel>
        <CapacitySelect
          label="Shift"
          value={draft.shift}
          onChange={(value) => change("shift", value as CapacityPerson["shift"])}
          options={Object.keys(CAPACITY_SHIFTS)}
        />
        <FieldDescription>
          8:00 to 16:00 on each shift day; other shop days show as Off.
        </FieldDescription>
      </Field>
      {error && <FieldError>{error}</FieldError>}
    </PanelShell>
  );
}

function TimeOffPanel({
  panel,
  store,
  onClose,
  onCommit,
}: {
  panel: Extract<CapacityPanel, { kind: "timeOff" }>;
  store: CapacityStore;
  onClose: () => void;
  onCommit: (store: CapacityStore, message: string) => void;
}) {
  const [draft, setDraft] = useState(panel.value);
  const [error, setError] = useState("");
  const change = <K extends keyof CapacityTimeOff>(key: K, value: CapacityTimeOff[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setError("");
  };
  const previewStore = {
    ...store,
    timeOff: [...store.timeOff.filter((item) => item.id !== draft.id), draft],
  };
  const affected = store.people
    .filter((person) => draft.personIds.includes(person.id))
    .map((person) => {
      const bookings = store.bookings.filter(
        (item) => item.personId === person.id && draft.from <= item.day && item.day <= draft.to,
      );
      const days = [...new Set(bookings.map((item) => item.day))];
      const overtime = days.reduce(
        (sum, day) =>
          sum +
          Math.max(
            0,
            capacityDay(previewStore, person, day).booked -
              capacityDay(previewStore, person, day).capacity,
          ),
        0,
      );
      return { person, count: bookings.length, overtime };
    })
    .filter((item) => item.count > 0);
  function save() {
    const result = saveCapacityTimeOff(store, draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCommit(result.store, panel.isNew ? "Time off added" : "Time off updated");
    onClose();
  }
  return (
    <PanelShell
      title={panel.isNew ? "Add Time Off" : "Edit Time Off"}
      description="Time off reduces capacity. Booked services stay on the schedule and show as overtime until reassigned."
      onClose={onClose}
      onSubmit={save}
      footer={
        <>
          {!panel.isNew && (
            <Button
              type="button"
              variant="ghost"
              className="mr-auto text-destructive"
              onClick={() => {
                onCommit(
                  { ...store, timeOff: store.timeOff.filter((item) => item.id !== draft.id) },
                  "Time off removed",
                );
                onClose();
              }}
            >
              Remove
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{panel.isNew ? "Add Time Off" : "Save Changes"}</Button>
        </>
      }
    >
      <Field>
        <FieldLabel>Technicians</FieldLabel>
        <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
          {store.people.map((person) => (
            <label key={person.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.personIds.includes(person.id)}
                onCheckedChange={(checked) =>
                  change(
                    "personIds",
                    checked
                      ? [...draft.personIds, person.id]
                      : draft.personIds.filter((id) => id !== person.id),
                  )
                }
              />
              {person.name}
            </label>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <CapacityDateField
          label="From"
          value={draft.from}
          onChange={(value) => change("from", value)}
        />
        <CapacityDateField
          label="Through"
          value={draft.to}
          onChange={(value) => change("to", value)}
        />
      </div>
      <HoursField
        label="Hours per day"
        value={draft.hours}
        onChange={(value) => change("hours", value)}
        max={8}
        min={0.5}
        step={0.5}
      />
      <TextField
        label="Reason"
        value={draft.reason}
        onChange={(value) => change("reason", value)}
        required
      />
      {affected.map(({ person, count, overtime }) => (
        <Alert key={person.id} variant="warning">
          <AlertDescription>
            <p>
              {person.name} has {count} {count === 1 ? "service" : "services"} booked. {overtime}h
              will show as overtime until the work moves to someone with room.
            </p>
          </AlertDescription>
        </Alert>
      ))}
      {error && <FieldError>{error}</FieldError>}
    </PanelShell>
  );
}

export function CapacityPanels({
  panel,
  store,
  onClose,
  onCommit,
  onPanelChange,
}: {
  panel: CapacityPanel;
  store: CapacityStore;
  onClose: () => void;
  onCommit: (store: CapacityStore, message: string) => void;
  onPanelChange: (panel: CapacityPanel) => void;
}) {
  const shared = { store, onClose, onCommit };
  if (panel.kind === "booking")
    return <BookingPanel key={panel.value.id} panel={panel} {...shared} />;
  if (panel.kind === "person")
    return <PersonPanel key={panel.value.id} panel={panel} {...shared} />;
  if (panel.kind === "timeOff")
    return <TimeOffPanel key={panel.value.id} panel={panel} {...shared} />;
  const person = store.people.find((item) => item.id === panel.personId);
  if (!person) return null;
  return (
    <PanelShell
      title={`${person.name}'s Schedule`}
      description={`${person.role} · ${person.team} · ${person.shift}`}
      onClose={onClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onPanelChange({ kind: "person", value: person, isNew: false })}
          >
            Edit Technician
          </Button>
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {capacityWindow(panel.week).map((day) => {
        const value = capacityDay(store, person, day);
        return (
          <section key={day} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">
                {capacityDateLabel(day, true)}
                {day === CAPACITY_TODAY ? ", today" : ""}
              </h3>
              <Badge variant="outline">{value.kind}</Badge>
            </div>
            <p className="my-2 text-xs text-muted-foreground">
              {value.booked}h booked of {value.capacity}h ·{" "}
              {value.holiday || `${Math.max(0, value.free)}h free`}
            </p>
            {value.bookings.map((booking) => (
              <Button
                key={booking.id}
                type="button"
                variant="ghost"
                className="h-auto w-full justify-between py-2 text-left"
                onClick={() => onPanelChange({ kind: "booking", value: booking, isNew: false })}
              >
                <span>
                  {booking.vehicle}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {booking.customer}
                  </span>
                </span>
                <span>{booking.hours}h</span>
              </Button>
            ))}
            {value.timeOff.map((off) => (
              <Button
                key={off.id}
                type="button"
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onPanelChange({ kind: "timeOff", value: off, isNew: false })}
              >
                <CalendarOff />
                {off.reason}
              </Button>
            ))}
          </section>
        );
      })}
    </PanelShell>
  );
}
