import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  CalendarDays,
  CalendarOff,
  CalendarPlus,
  CarFront,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRoundPlus,
  X,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { DataGrid, DataGridContainer, useDataGrid } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDomainGrid, type DomainColumn } from "./grid-advanced-model-grid";
import {
  CAPACITY_FIRST_MONDAY,
  CAPACITY_SERVICES,
  CAPACITY_TEAMS,
  CAPACITY_TODAY,
  capacityDateLabel,
  capacityDay,
  capacityTotals,
  capacityWindow,
  commitCapacityHistory,
  createCapacitySeed,
  matchesCapacityPerson,
  nextCapacitySlot,
  redoCapacityHistory,
  removeCapacityPeople,
  undoCapacityHistory,
  validateCapacityStore,
  type CapacityDay,
  personSupportsService,
  type CapacityHistory,
  type CapacityPerson,
  type CapacityStore,
} from "./grid-advanced-technician-capacity-data";
import {
  CapacityPanels,
  CapacitySelect,
  type CapacityPanel,
} from "./grid-advanced-technician-capacity-panels";
import "./grid-advanced-technician-capacity.css";

export interface TechnicianCapacityProps {
  /** Optional real loader. Without one this is an immediate, local Bricklane demo. */
  loadCapacity?: (signal: AbortSignal) => Promise<CapacityStore>;
}
const emptyCapacityStore = (): CapacityStore => ({
  people: [],
  bookings: [],
  timeOff: [],
  holidays: {},
});
function freshCapacityBooking(
  store: CapacityStore,
  personId = "",
  day = CAPACITY_TODAY,
): CapacityPanel {
  const person = store.people.find((item) => item.id === personId);
  const service = person
    ? CAPACITY_SERVICES.find((item) => personSupportsService(person, item))!
    : "Maintenance";
  return {
    kind: "booking",
    isNew: true,
    value: {
      id: `booking-${crypto.randomUUID()}`,
      personId,
      day,
      customer: "",
      phone: "",
      vehicle: "",
      plate: "",
      service,
      hours: 1,
      status: "Scheduled",
    },
  };
}
function freshCapacityTimeOff(personIds: string[], day = CAPACITY_TODAY): CapacityPanel {
  return {
    kind: "timeOff",
    isNew: true,
    value: {
      id: `off-${crypto.randomUUID()}`,
      personIds,
      from: day,
      to: day,
      hours: 8,
      reason: "",
    },
  };
}
function dayFigure(value: CapacityDay) {
  return value.kind === "Holiday"
    ? "Hol"
    : value.kind === "Away"
      ? "Off"
      : value.free === 0
        ? ""
        : `${value.free > 0 ? "+" : ""}${value.free}h`;
}
function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}
function dateRange(days: string[]) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
  return `${formatter.format(new Date(`${days[0]}T12:00:00Z`))} to ${formatter.format(new Date(`${days.at(-1)}T12:00:00Z`))}`;
}
function useSmallCapacityViewport() {
  const [small, setSmall] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const change = () => setSmall(query.matches);
    query.addEventListener("change", change);
    change();
    return () => query.removeEventListener("change", change);
  }, []);
  return small;
}

function CapacityDayHeader({ day, store }: { day: string; store: CapacityStore }) {
  const { table } = useDataGrid<CapacityPerson>();
  const people = table.getFilteredRowModel().rows.map((row) => row.original);
  const totals = capacityTotals(store, people, [day]);
  const holiday = store.holidays[day];
  const overbooked = totals.booked > totals.capacity;
  const percent = totals.utilization ?? (overbooked ? 100 : 0);
  const loadDescription =
    holiday ||
    (totals.utilization === null
      ? `${totals.booked}h booked, no scheduled capacity`
      : `team ${percent}% booked`);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn("capacity-day-header", day === CAPACITY_TODAY && "bg-muted/70")}
          aria-label={`${capacityDateLabel(day, true)}${day === CAPACITY_TODAY ? ", today" : ""}, ${loadDescription}`}
        >
          <span>{capacityDateLabel(day)}</span>
          {holiday ? (
            <span className="text-xs font-normal text-muted-foreground">Closed</span>
          ) : (
            <Progress
              value={Math.min(100, percent)}
              aria-valuetext={`${totals.booked}h booked of ${totals.capacity}h`}
              className={cn(
                "h-1.5",
                overbooked
                  ? "[&_[data-slot=progress-indicator]]:bg-red-500"
                  : percent >= 85
                    ? "[&_[data-slot=progress-indicator]]:bg-emerald-500"
                    : "[&_[data-slot=progress-indicator]]:bg-neutral-400",
              )}
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {holiday || `${totals.booked}h booked of ${totals.capacity}h · ${totals.free}h free`}
      </TooltipContent>
    </Tooltip>
  );
}
function CapacityDayCell({
  person,
  day,
  store,
  kindFilter,
  onPanel,
  onCommit,
}: {
  person: CapacityPerson;
  day: string;
  store: CapacityStore;
  kindFilter: string;
  onPanel: (panel: CapacityPanel) => void;
  onCommit: (store: CapacityStore, message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const value = capacityDay(store, person, day);
  function showPanel(panel: CapacityPanel) {
    setOpen(false);
    onPanel(panel);
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          type="button"
          className={cn(
            "capacity-day-button",
            `capacity-day-${value.kind}`,
            kindFilter !== "All Days" && value.kind !== kindFilter && "opacity-35",
          )}
          aria-label={`${person.name}, ${capacityDateLabel(day, true)}, ${value.kind}, ${value.booked}h of ${value.capacity}h booked`}
        >
          {dayFigure(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="capacity-day-popover w-[352px] max-w-[calc(100vw_-_24px)] p-2.5 text-sm"
        align="center"
      >
        <div className="mb-3">
          <h3 className="font-medium">{person.name}</h3>
          <p className="text-xs text-muted-foreground">
            {capacityDateLabel(day, true)}
            {day === CAPACITY_TODAY ? ", today" : ""}
          </p>
        </div>
        <Badge
          variant={
            value.kind === "Overtime"
              ? "destructive-light"
              : value.kind === "Holiday"
                ? "warning-light"
                : value.kind === "Away"
                  ? "outline"
                  : "success-light"
          }
          className="mb-3"
        >
          {value.kind}
        </Badge>
        <dl className="mb-3 grid grid-cols-3 gap-2 border-b pb-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Shift</dt>
            <dd className="mt-1">
              {value.holiday ? "Closed" : value.capacity ? "8:00 to 16:00" : "Off"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Booked</dt>
            <dd className="mt-1">{value.booked}h</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Free</dt>
            <dd className="mt-1">{Math.max(0, value.free)}h</dd>
          </div>
        </dl>
        {value.holiday && <p className="mb-3 text-xs text-muted-foreground">{value.holiday}</p>}
        <div className="space-y-1">
          {value.bookings.map((booking) => (
            <Button
              key={booking.id}
              variant="ghost"
              className="h-auto w-full justify-start gap-2 px-1 py-2 text-left"
              onClick={() => showPanel({ kind: "booking", value: booking, isNew: false })}
            >
              <CarFront className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate">{booking.vehicle}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {booking.status}
                  </Badge>
                </span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {booking.plate}, {booking.customer}
                </span>
              </span>
              <span className="text-xs font-normal">{booking.hours}h</span>
            </Button>
          ))}
        </div>
        {value.timeOff.map((off) => (
          <div
            key={off.id}
            className="mt-2 flex items-center justify-between gap-1 rounded-lg border p-2"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-auto min-w-0 justify-start px-1"
              onClick={() => showPanel({ kind: "timeOff", value: off, isNew: false })}
            >
              <CalendarOff className="size-3.5" />
              <span className="truncate">{off.reason}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${off.reason}`}
              onClick={() => {
                onCommit(
                  { ...store, timeOff: store.timeOff.filter((item) => item.id !== off.id) },
                  "Time off removed",
                );
                setOpen(false);
              }}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        {!value.bookings.length && !value.timeOff.length && !value.holiday && (
          <p className="mb-3 text-xs text-muted-foreground">
            {value.capacity ? "No services booked." : "Not a shift day."}
          </p>
        )}
        <Button
          variant="outline"
          className="mt-3 w-full"
          disabled={!!value.holiday}
          onClick={() => showPanel(freshCapacityBooking(store, person.id, day))}
        >
          <CalendarPlus />
          Book Service
        </Button>
      </PopoverContent>
    </Popover>
  );
}
function CapacityUtilization({
  store,
  person,
  days,
}: {
  store: CapacityStore;
  person: CapacityPerson;
  days: string[];
}) {
  const totals = capacityTotals(store, [person], days);
  const percent = totals.utilization;
  return (
    <div className="flex items-center gap-3">
      <span
        role="img"
        aria-label={
          percent === null
            ? `${totals.booked}h booked, no scheduled capacity`
            : `${percent}% utilized`
        }
        className="capacity-utilization-ring"
        style={{
          background: `conic-gradient(${totals.booked > totals.capacity ? "var(--color-red-500)" : percent !== null && percent >= 85 ? "var(--color-emerald-500)" : "var(--color-neutral-400)"} ${Math.min(100, percent ?? (totals.booked > 0 ? 100 : 0))}%, var(--muted) 0)`,
        }}
      />
      <span className="flex flex-col gap-0.5 tabular-nums">
        <span className="block text-sm leading-none">{percent === null ? "—" : `${percent}%`}</span>
        <span className="block whitespace-nowrap text-xs leading-none text-muted-foreground">
          {totals.booked}h of {totals.capacity}h
        </span>
      </span>
    </div>
  );
}

export default function TechnicianCapacity({ loadCapacity }: TechnicianCapacityProps = {}) {
  const [history, setHistory] = useState<CapacityHistory>(() => ({
    present: loadCapacity ? emptyCapacityStore() : createCapacitySeed(),
    past: [],
    future: [],
  }));
  const store = history.present;
  const [week, setWeek] = useState(0);
  const days = useMemo(() => capacityWindow(week), [week]);
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("All Teams");
  const [service, setService] = useState("All Services");
  const [kind, setKind] = useState("All Days");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);
  const [density, setDensity] = useState("Compact");
  const [columnLines, setColumnLines] = useState(true);
  const [stripes, setStripes] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [panel, setPanel] = useState<CapacityPanel | null>(null);
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(!!loadCapacity);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const small = useSmallCapacityViewport();
  useEffect(() => {
    if (!loadCapacity) return;
    const abort = new AbortController();
    Promise.resolve()
      .then(() => {
        if (abort.signal.aborted) return null;
        setIsLoading(true);
        setLoadError("");
        return loadCapacity(abort.signal);
      })
      .then((result) => {
        if (abort.signal.aborted || !result) return;
        const invalid = validateCapacityStore(result);
        if (invalid) throw new Error(invalid);
        setHistory({ present: result, past: [], future: [] });
        setSelection([]);
      })
      .catch((error: unknown) => {
        if (!abort.signal.aborted)
          setLoadError(error instanceof Error ? error.message : "Capacity could not be loaded.");
      })
      .finally(() => {
        if (!abort.signal.aborted) setIsLoading(false);
      });
    return () => abort.abort();
  }, [loadCapacity, retry]);
  function commit(next: CapacityStore, message: string) {
    setHistory((previous) => commitCapacityHistory(previous, next));
    setNotice(message);
    setSelection((ids) => ids.filter((id) => next.people.some((person) => person.id === id)));
  }
  function undo() {
    setHistory(undoCapacityHistory);
    setNotice("Change undone");
  }
  function redo() {
    setHistory(redoCapacityHistory);
    setNotice("Change redone");
  }
  function clearFilters() {
    setQuery("");
    setTeam("All Teams");
    setService("All Services");
    setKind("All Days");
    setPagination((value) => ({ ...value, pageIndex: 0 }));
  }
  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== "z")
      return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, [contenteditable=true]")) return;
    event.preventDefault();
    if (event.shiftKey) redo();
    else undo();
  }
  const data = useMemo(() => [...store.people], [store]);
  const columns = useMemo<DomainColumn<CapacityPerson>[]>(
    () => [
      {
        id: "select",
        size: 49,
        minSize: 49,
        maxSize: 49,
        enableSorting: false,
        enableHiding: false,
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        meta: { headerClassName: "px-4", cellClassName: "px-4" },
      },
      {
        id: "technician",
        accessorFn: (person) => person.name,
        size: small ? 150 : 280,
        minSize: small ? 150 : 280,
        enableHiding: false,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Technician" />,
        cell: ({ row }) => {
          const person = row.original;
          const slot = nextCapacitySlot(store, person);
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar className="hidden size-8 shrink-0 border sm:flex">
                <AvatarFallback className="text-sm font-normal text-muted-foreground">
                  {initials(person.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <Button
                  variant="link"
                  className="h-auto max-w-full justify-start truncate border-0 p-0 text-sm leading-none font-medium text-foreground"
                  onClick={() => setPanel({ kind: "schedule", personId: person.id, week })}
                >
                  {person.name}
                </Button>
                <p className="w-full truncate text-xs leading-none text-muted-foreground">
                  {person.role}
                  <span className="mx-1 text-border">•</span>
                  <span className="text-foreground">
                    {slot
                      ? `${slot.day === CAPACITY_TODAY ? "Today" : capacityDateLabel(slot.day)}, ${slot.hours}h`
                      : "No open shifts"}
                  </span>
                </p>
              </div>
            </div>
          );
        },
        meta: {
          headerTitle: "Technician",
          headerClassName: "text-sm font-medium",
          cellClassName: "px-2",
        },
      },
      ...days.map((day): DomainColumn<CapacityPerson> => ({
        id: `day-${day}`,
        accessorFn: (person) => capacityDay(store, person, day).booked,
        size: 60,
        minSize: 60,
        maxSize: 60,
        enableSorting: false,
        enableHiding: false,
        header: () => <CapacityDayHeader day={day} store={store} />,
        cell: ({ row }) => (
          <CapacityDayCell
            person={row.original}
            day={day}
            store={store}
            kindFilter={kind}
            onPanel={setPanel}
            onCommit={commit}
          />
        ),
        meta: {
          headerTitle: capacityDateLabel(day),
          headerClassName: "p-0",
          cellClassName: "relative p-0",
        },
      })),
      {
        id: "utilization",
        accessorFn: (person) => capacityTotals(store, [person], days).utilization,
        size: 120,
        minSize: 120,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Utilization" />,
        cell: ({ row }) => <CapacityUtilization store={store} person={row.original} days={days} />,
        meta: {
          headerTitle: "Utilization",
          headerClassName: "text-sm font-medium",
          cellClassName: "px-2",
        },
      },
      {
        id: "actions",
        size: 45,
        minSize: 45,
        maxSize: 45,
        enableSorting: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${row.original.name}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Plan</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setPanel(freshCapacityBooking(store, row.id))}>
                <CalendarPlus />
                Book Service
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setPanel(freshCapacityTimeOff([row.id]))}>
                <CalendarOff />
                Add Time Off
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Technician</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => setPanel({ kind: "schedule", personId: row.id, week })}
              >
                <CalendarDays />
                View Schedule
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setPanel({ kind: "person", value: row.original, isNew: false })}
              >
                <Pencil />
                Edit Technician
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setRemoveIds([row.id])}
              >
                <Trash2 />
                Remove Technician
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        meta: { cellClassName: "px-2 text-center" },
      },
    ],
    [store, days, kind, small, week],
  );
  const filter = JSON.stringify({ query, team, service, kind });
  const table = useDomainGrid({
    data,
    columns,
    search: filter,
    globalFilterFn: (person, value) =>
      matchesCapacityPerson(store, person, JSON.parse(value), days),
    selection,
    onSelectionChange: setSelection,
    pagination,
    onPaginationChange: setPagination,
    getRowId: (person) => person.id,
  });
  useEffect(() => {
    table.setColumnPinning({ start: ["select", "technician"], end: [] });
  }, [table]);
  const selectedPeople = store.people.filter((person) => selection.includes(person.id));
  const freeAhead = capacityTotals(
    store,
    selectedPeople,
    days.filter((day) => day >= CAPACITY_TODAY),
  ).free;
  const hasFilters =
    !!query || team !== "All Teams" || service !== "All Services" || kind !== "All Days";
  return (
    <Frame
      dense
      className={cn(
        "technician-capacity mx-auto w-full min-w-0 max-w-[1216px] text-sm",
        density === "Comfortable" && "capacity-comfortable",
      )}
      role="region"
      aria-label="Technician Capacity"
      aria-busy={isLoading}
      onKeyDown={onKeyDown}
    >
      <FrameHeader className="capacity-frame-header">
        <div>
          <FrameTitle>Technician Capacity</FrameTitle>
          <FrameDescription className="mt-px text-xs leading-4">
            {dateRange(days)}
            <span className="mx-2">·</span>
            {store.people.length} technicians<span className="mx-2">·</span>
            {new Set(store.people.map((person) => person.team)).size} teams
          </FrameDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonGroup>
            <Button
              variant="outline"
              size="icon-sm"
              className="size-8"
              aria-label="Earlier week"
              onClick={() => setWeek((value) => value - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setWeek(0)}
              disabled={week === 0}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="size-8"
              aria-label="Later week"
              onClick={() => setWeek((value) => value + 1)}
            >
              <ChevronRight />
            </Button>
          </ButtonGroup>
          <Button
            variant="outline"
            aria-label="Add Technician"
            disabled={isLoading || !!loadError}
            onClick={() =>
              setPanel({
                kind: "person",
                isNew: true,
                value: {
                  id: `tech-${crypto.randomUUID()}`,
                  name: "",
                  role: "Mechanic",
                  team: "Mechanical",
                  shift: "Mon to Fri",
                },
              })
            }
          >
            <UserRoundPlus />
            <span className="hidden sm:inline">Add Technician</span>
          </Button>
          <Button
            aria-label="Book Service"
            disabled={isLoading || !!loadError || !store.people.length}
            onClick={() => setPanel(freshCapacityBooking(store))}
          >
            <CalendarPlus />
            <span className="hidden sm:inline">Book Service</span>
          </Button>
        </div>
      </FrameHeader>
      <FramePanel className="capacity-frame-panel p-0">
        {loadError ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>Capacity could not be loaded</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
              <AlertAction>
                <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
                  Retry
                </Button>
              </AlertAction>
            </Alert>
          </div>
        ) : (
          <DataGrid
            table={table}
            recordCount={table.getFilteredRowModel().rows.length}
            isLoading={isLoading}
            loadingMode="skeleton"
            loadingMessage="Loading technician capacity…"
            emptyMessage={
              <div className="space-y-2 py-8 text-center">
                <p className="font-medium">
                  {store.people.length ? "Nobody Matches" : "No Technicians Yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {store.people.length
                    ? "Change the team, the service or the days, or clear the search."
                    : "Add a technician to start planning workshop capacity."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={
                    store.people.length
                      ? clearFilters
                      : () =>
                          setPanel({
                            kind: "person",
                            isNew: true,
                            value: {
                              id: `tech-${crypto.randomUUID()}`,
                              name: "",
                              role: "Mechanic",
                              team: "Mechanical",
                              shift: "Mon to Fri",
                            },
                          })
                  }
                >
                  {store.people.length ? "Clear" : "Add Technician"}
                </Button>
              </div>
            }
            tableLayout={{
              dense: true,
              cellBorder: columnLines,
              rowBorder: true,
              headerBorder: true,
              headerBackground: false,
              stripped: stripes,
              width: "fixed",
              columnsPinnable: true,
            }}
            className="min-w-0"
            tableClassNames={{
              base: "capacity-grid",
              headerRow: "h-14",
              bodyRow: density === "Comfortable" ? "h-[49px]" : "h-[45px]",
            }}
          >
            <div className="capacity-toolbar">
              {selectedPeople.length ? (
                <>
                  <div className="mr-auto text-sm">
                    <span className="font-medium">
                      {selectedPeople.length}{" "}
                      {selectedPeople.length === 1 ? "technician" : "technicians"} selected
                    </span>
                    <span className="ml-3 text-muted-foreground">{freeAhead}h free ahead</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPanel(freshCapacityTimeOff(selection))}
                  >
                    <CalendarOff />
                    Time Off
                  </Button>
                  <Button variant="outline" onClick={() => setRemoveIds(selection)}>
                    <Trash2 />
                    Remove
                  </Button>
                  <Button variant="ghost" onClick={() => setSelection([])}>
                    Clear
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className={cn(
                      "capacity-search",
                      (searchOpen || query) && "capacity-search-open",
                    )}
                  >
                    <Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
                    <Input
                      ref={searchInput}
                      aria-label="Search technicians, customers, cars and plates"
                      value={query}
                      onChange={(event) => changeFilter(setQuery, event.target.value)}
                      placeholder="Technician, customer or car..."
                      className="h-8 pl-8"
                    />
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="capacity-search-toggle size-8"
                      aria-label="Search technicians, customers, cars and plates"
                      onClick={() => setSearchOpen(true)}
                    >
                      <Search />
                    </Button>
                  </div>
                  <CapacitySelect
                    label="Team"
                    value={team}
                    onChange={(value) => changeFilter(setTeam, value)}
                    options={["All Teams", ...CAPACITY_TEAMS]}
                    className="w-36"
                  />
                  <CapacitySelect
                    label="Service"
                    value={service}
                    onChange={(value) => changeFilter(setService, value)}
                    options={["All Services", ...CAPACITY_SERVICES]}
                    className="w-40"
                  />
                  <CapacitySelect
                    label="Days"
                    value={kind}
                    onChange={(value) => changeFilter(setKind, value)}
                    options={["All Days", "Booked", "Available", "Overtime", "Away", "Holiday"]}
                    className="w-40"
                  />
                  {hasFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Clear search and filters"
                      onClick={clearFilters}
                    >
                      <X />
                      Clear
                    </Button>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Settings"
                        className="ml-auto size-8"
                      >
                        <SlidersHorizontal />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-2.5 text-sm">
                      <FieldGroup className="gap-3">
                        <p className="text-xs font-medium text-muted-foreground">Appearance</p>
                        <Field orientation="horizontal">
                          <FieldLabel>Density</FieldLabel>
                          <CapacitySelect
                            label="Density"
                            value={density}
                            onChange={setDensity}
                            options={["Compact", "Comfortable"]}
                            className="w-32"
                          />
                        </Field>
                        <Field orientation="horizontal">
                          <FieldLabel htmlFor="capacity-column-lines">Column lines</FieldLabel>
                          <Switch
                            id="capacity-column-lines"
                            checked={columnLines}
                            onCheckedChange={setColumnLines}
                          />
                        </Field>
                        <Field orientation="horizontal">
                          <FieldLabel htmlFor="capacity-row-stripes">Row stripes</FieldLabel>
                          <Switch
                            id="capacity-row-stripes"
                            checked={stripes}
                            onCheckedChange={setStripes}
                          />
                        </Field>
                      </FieldGroup>
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
            <DataGridContainer className="min-w-0 rounded-none border-0">
              <DataGridScrollArea orientation="horizontal">
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
            <DataGridPagination
              sizes={[10, 25, 50]}
              info="{from} - {to} of {count} technicians"
              className="capacity-pagination border-t px-4"
            />
          </DataGrid>
        )}
      </FramePanel>
      {notice && (
        <div
          className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs"
          role="status"
          aria-live="polite"
        >
          <span>{notice}</span>
          <Button variant="link" size="sm" disabled={!history.past.length} onClick={undo}>
            Undo
          </Button>
          {history.future.length > 0 && (
            <Button variant="link" size="sm" onClick={redo}>
              Redo
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss update"
            onClick={() => setNotice("")}
          >
            <X />
          </Button>
        </div>
      )}
      <p className="sr-only">
        Bricklane local workshop demo. Changes remain in this session. Keyboard: Tab to controls,
        Enter or Space to open a day, Escape to close, Control or Command Z to undo outside form
        fields.
      </p>
      {panel && (
        <CapacityPanels
          panel={panel}
          store={store}
          onClose={() => setPanel(null)}
          onCommit={commit}
          onPanelChange={setPanel}
        />
      )}
      <AlertDialog
        open={removeIds.length > 0}
        onOpenChange={(open) => {
          if (!open) setRemoveIds([]);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove{" "}
              {removeIds.length === 1
                ? store.people.find((person) => person.id === removeIds[0])?.name
                : `${removeIds.length} technicians`}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Their bookings and time off leave this local schedule too. You can undo this change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                commit(removeCapacityPeople(store, removeIds), "Technicians removed");
                setRemoveIds([]);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <span className="sr-only">Demo week starts {CAPACITY_FIRST_MONDAY}.</span>
    </Frame>
  );
}
