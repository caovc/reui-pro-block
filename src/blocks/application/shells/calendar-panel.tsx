import { useState } from "react";
import { ChevronDown, ChevronRight, Globe, Plus, Share2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { demoAvatar } from "@/lib/demo-artwork";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button, Badge, Face, Separator, toast } from "./chrome";
export const calendarColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
export function EventCreator({
  onCreate,
  wide = false,
}: {
  onCreate: (event: { name: string; time: string }) => void;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [time, setTime] = useState("09:00");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className={wide ? "h-7 w-full justify-start text-xs" : "h-7 text-xs"}>
          <Plus />
          New Event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New event</DialogTitle>
          <DialogDescription>Add an event to your demo agenda.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            onCreate({ name, time });
            setName("");
            setOpen(false);
            toast.success("Event created");
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="shell-event-name">Event title</FieldLabel>
              <Input
                id="shell-event-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team sync"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="shell-event-date">Date</FieldLabel>
                <Input id="shell-event-date" type="date" defaultValue="2026-06-10" />
              </Field>
              <Field>
                <FieldLabel htmlFor="shell-event-time">Time</FieldLabel>
                <Input
                  id="shell-event-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </Field>
            </div>
          </FieldGroup>
          <Button type="submit">Create event</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
/** Existing Pro context composition, using the real free Calendar/Checkbox controls.
 * Tempo adds only an optional consumer presentation and local fixture labels.
 */
export function CalendarContext({
  month = 1,
  day = 24,
  showTitle = false,
  onToggleCalendars,
  variant,
  onShowAll,
}: {
  month?: number;
  day?: number;
  showTitle?: boolean;
  onToggleCalendars?: (enabled: string[]) => void;
  /** Tempo consumes this existing Pro composition; other shell defaults stay intact. */
  variant?: "tempo";
  onShowAll?: () => void;
}) {
  const tempo = variant === "tempo";
  const [date, setDate] = useState<Date | undefined>(new Date(2026, month, day));
  const [accounts, setAccounts] = useState(() =>
    tempo
      ? ["nick@bricklane.example", "nick.personal@bricklane.example"]
      : ["nick@company.io", "nick@gmail.com"],
  );
  const [open, setOpen] = useState(() => [tempo ? "nick@bricklane.example" : "nick@company.io"]);
  const [enabled, setEnabled] = useState(["Work", "Personal", "Meetings", "Family", "Birthdays"]);
  const [events, setEvents] = useState([
    { name: "Weekly Team Standup", time: "9:00 AM to 9:30 AM" },
    {
      name: "Design Review · Component Library v3",
      time: "11:00 AM to 12:00 PM",
    },
    { name: "Coffee with Alex", time: "2:00 PM to 2:30 PM" },
  ]);
  return (
    <div
      className={
        tempo
          ? "shell-calendar-context tempo-context-panel-content flex min-h-0 flex-1 flex-col"
          : "shell-calendar-context flex min-h-0 flex-1 flex-col"
      }
    >
      {showTitle && (
        <div className="flex h-[49px] shrink-0 items-center justify-between border-b px-3">
          <h3 className="text-[13px] font-semibold">Calendars</h3>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Add calendar"
            onClick={() => {
              const name = `Calendar ${enabled.length + 1}`;
              setEnabled([...enabled, name]);
              toast.success(`${name} created`);
            }}
          >
            <Plus />
          </Button>
        </div>
      )}
      <div className={tempo ? "shell-scroll tempo-context-scroll" : "shell-scroll"}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          defaultMonth={new Date(2026, month, 1)}
          labels={
            tempo
              ? {
                  labelNext: () => "Next month",
                  labelPrevious: () => "Previous month",
                }
              : undefined
          }
          modifiers={{
            event: [
              new Date(2026, month, day - 2),
              new Date(2026, month, day),
              new Date(2026, month, day + 1),
              new Date(2026, month, day + 2),
            ],
          }}
          modifiersClassNames={{ event: "shell-calendar-event" }}
          className="w-full rounded-none p-3 [--cell-size:--spacing(8.5)]"
        />
        <Separator />
        <div className={tempo ? "tempo-context-calendars p-3" : "p-3"}>
          <p className="mb-2 text-[10px] uppercase text-muted-foreground">My calendars</p>
          <div className="flex flex-col gap-2">
            {accounts.map((email, i) => {
              const trigger = (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full justify-start px-1 text-[11px] font-normal"
                  aria-label={tempo ? `Toggle ${email}` : undefined}
                  aria-expanded={open.includes(email)}
                  onClick={() =>
                    setOpen(
                      open.includes(email) ? open.filter((v) => v !== email) : [...open, email],
                    )
                  }
                >
                  {open.includes(email) ? <ChevronDown /> : <ChevronRight />}
                  <span className="flex-1 truncate text-left">{email}</span>
                  {!tempo && (
                    <Badge variant="outline" className="h-4 px-1 text-[9px]">
                      {i === 0 ? "3" : "2"}
                    </Badge>
                  )}
                </Button>
              );
              return (
                <div key={email}>
                  {tempo ? (
                    <div className="tempo-context-account-header">
                      {trigger}
                      <Badge variant="outline" className="h-4 px-1 text-[9px]">
                        {i === 0 ? "3" : "2"}
                      </Badge>
                    </div>
                  ) : (
                    trigger
                  )}
                  {open.includes(email) && (
                    <div
                      className={
                        tempo
                          ? "tempo-context-calendar-choices mt-1 flex flex-col gap-3 px-3 py-2"
                          : "mt-1 flex flex-col gap-3 px-3 py-2"
                      }
                    >
                      {(i === 0 ? ["Work", "Personal", "Meetings"] : ["Family", "Birthdays"]).map(
                        (name, j) => (
                          <div className="flex items-center gap-2" key={name}>
                            <span
                              className={
                                tempo
                                  ? "tempo-context-calendar-dot size-1.5 rounded-full"
                                  : "size-1.5 rounded-full"
                              }
                              style={{
                                background:
                                  tempo && i === 0
                                    ? [
                                        "var(--color-indigo-500)",
                                        "var(--color-emerald-500)",
                                        "var(--color-violet-500)",
                                      ][j]
                                    : calendarColors[i * 3 + j],
                              }}
                            />
                            <Checkbox
                              id={`calendar-${email}-${name}`}
                              aria-label={`Toggle ${name}`}
                              checked={enabled.includes(name)}
                              onCheckedChange={(v) => {
                                const next = v
                                  ? [...enabled, name]
                                  : enabled.filter((n) => n !== name);
                                setEnabled(next);
                                onToggleCalendars?.(next);
                              }}
                            />
                            <label
                              className="cursor-pointer text-xs"
                              htmlFor={`calendar-${email}-${name}`}
                            >
                              {name}
                            </label>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 justify-start px-1 text-[11px] font-normal text-muted-foreground"
              onClick={() => {
                const value = tempo
                  ? `nick+${accounts.length}@bricklane.example`
                  : `nick+${accounts.length}@company.io`;
                setAccounts([...accounts, value]);
                setOpen([...open, value]);
                toast.success("Demo calendar account added");
              }}
            >
              <Plus />
              Add account
            </Button>
          </div>
        </div>
        <Separator />
        <div className={tempo ? "tempo-context-agenda p-3" : "p-3"}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] uppercase text-muted-foreground">
              {tempo ? "Today" : "Up next"}
            </p>
            {tempo ? (
              <div className="tempo-context-agenda-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onShowAll) {
                      onShowAll();
                    } else {
                      toast.info(`${events.length} events in your local agenda.`);
                    }
                  }}
                >
                  Show all
                </Button>
                <Badge variant="outline" className="h-4 px-1 text-[9px]">
                  {events.length}
                </Badge>
              </div>
            ) : (
              <Badge variant="outline" className="h-4 px-1 text-[9px]">
                {events.length}
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-5">
            {events.map((event, i) => (
              <button
                className="flex gap-2 text-left"
                key={event.name}
                aria-label={tempo ? `Open ${event.name}` : undefined}
                onClick={() =>
                  toast(event.name, {
                    description: `${event.time} · ${date?.toLocaleDateString("en-US")}`,
                  })
                }
              >
                <span
                  className="w-1 shrink-0 rounded-full"
                  style={{
                    background: tempo
                      ? [
                          "var(--color-indigo-500)",
                          "var(--color-violet-500)",
                          "var(--color-orange-500)",
                        ][i % 3]
                      : calendarColors[(i * 2) % 5],
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{event.name}</span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">{event.time}</span>
                </span>
                {i < 2 && (
                  <span className="flex -space-x-1">
                    {Array.from({ length: i ? 1 : 3 }, (_, j) => {
                      const actor = ["Sarah Chen", "Marcus Lee", "Emily Park"][j];
                      return tempo ? (
                        <Avatar key={j} className="size-5">
                          <AvatarImage src={demoAvatar(actor)} alt={actor} />
                          <AvatarFallback>
                            {actor
                              .split(" ")
                              .map((part) => part[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Face key={j} name={actor} index={j} small />
                      );
                    })}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <Separator />
        <div
          className={
            tempo ? "tempo-context-actions flex flex-col gap-1.5 p-3" : "flex flex-col gap-1.5 p-3"
          }
        >
          <EventCreator wide onCreate={(event) => setEvents([...events, event])} />
          <Button
            variant="outline"
            size="sm"
            className="h-7 justify-start text-xs font-normal text-muted-foreground"
            onClick={() => {
              navigator.clipboard?.writeText(
                `Available on ${date?.toLocaleDateString("en-US")} between 9:00 AM and 5:00 PM`,
              );
              toast.success("Availability copied");
            }}
          >
            <Share2 />
            Share Availability
          </Button>
        </div>
      </div>
      <div
        className={
          tempo
            ? "tempo-context-timezone mt-auto flex items-center gap-2 border-t p-3 text-[10px] leading-4 text-muted-foreground"
            : "mt-auto flex items-center gap-2 border-t p-3 text-[10px] leading-4 text-muted-foreground"
        }
      >
        <Globe className="size-4 shrink-0" />
        {tempo ? (
          <span className="tempo-context-timezone-copy">
            <span>Your timezone</span>
            <span>GMT+5 (+05:00) · Asia/Tashkent</span>
          </span>
        ) : (
          <span>
            Your timezone
            <br />
            ET (−04:00) · America/New_York
          </span>
        )}
      </div>
    </div>
  );
}
