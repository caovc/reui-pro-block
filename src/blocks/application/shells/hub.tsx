import { useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  MessageSquare,
  Plus,
  Users,
} from "lucide-react";
import {
  Button,
  Badge,
  CollapseHandle,
  CreateItemDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Face,
  Input,
  Notifications,
  PlaceholderCanvas,
  ReuiMark,
  SearchPalette,
  WorkspaceMenu,
  toast,
} from "./chrome";
import { CalendarContext, EventCreator, calendarColors } from "./calendar-panel";
const agenda = [
  ["Today", "Morning Standup", "9:00 AM to 9:15 AM", "Meeting", "Zoom · Room A", 3],
  ["Today", "Sprint Planning", "10:00 AM to 11:00 AM", "Meeting", "Conf Room B", 2],
  ["Today", "Lunch with Sarah", "12:30 PM to 1:30 PM", "Personal", "The Coffee House, 3rd Ave", 1],
  ["Today", "Code Review Session", "3:00 PM to 4:00 PM", "Meeting", "", 2],
  ["Tomorrow", "Client Presentation", "9:30 AM to 10:30 AM", "Meeting", "Google Meet", 2],
  ["Tomorrow", "Design Sync", "2:00 PM to 2:45 PM", "Meeting", "", 2],
  ["This week", "Team Retrospective", "11:00 AM to 12:00 PM", "Meeting", "Conf Room A", 3],
  ["This week", "1:1 with Manager", "4:00 PM to 4:30 PM", "Meeting", "Zoom", 1],
] as const;
const initialContacts = [
  {
    name: "Sarah Chen",
    role: "Design Lead",
    group: "Design",
    status: "online",
  },
  {
    name: "Aisha Patel",
    role: "UX Researcher",
    group: "Design",
    status: "online",
  },
  {
    name: "Luna Martinez",
    role: "QA Engineer",
    group: "Engineering",
    status: "away",
  },
  {
    name: "Marcus Rivera",
    role: "Frontend Engineer",
    group: "Engineering",
    status: "online",
  },
  {
    name: "James Park",
    role: "Backend Engineer",
    group: "Engineering",
    status: "offline",
  },
  {
    name: "Tom Bradley",
    role: "DevOps Engineer",
    group: "Engineering",
    status: "online",
  },
  {
    name: "Emily Watson",
    role: "Product Manager",
    group: "Management",
    status: "away",
  },
  {
    name: "David Kim",
    role: "Engineering Manager",
    group: "Management",
    status: "offline",
  },
];
function SchedulePanel() {
  const [meetingsOnly, setMeetingsOnly] = useState(false);
  const [extra, setExtra] = useState<{ name: string; time: string }[]>([]);
  return (
    <>
      <div className="flex h-[49px] shrink-0 items-center justify-between border-b px-3">
        <h3 className="text-xs font-semibold">Schedule</h3>
        <Button
          variant={meetingsOnly ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label="Filter schedule"
          onClick={() => setMeetingsOnly(!meetingsOnly)}
        >
          <Filter />
        </Button>
      </div>
      <div className="shell-scroll">
        {["Today", "Tomorrow", "This week"].map((group) => (
          <section key={group} className="border-b p-3">
            <p className="mb-3 text-[10px] uppercase text-muted-foreground">{group}</p>
            <div className="flex flex-col gap-2">
              {agenda
                .filter((a) => a[0] === group && (!meetingsOnly || a[3] === "Meeting"))
                .map((event, i) => (
                  <button
                    key={event[1]}
                    className="flex flex-col gap-2 rounded-lg border p-3 text-left shadow-xs"
                    onClick={() => toast(event[1], { description: event[2] })}
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: calendarColors[i % 5] }}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">
                        {event[1]}
                      </span>
                      <Badge variant="outline" className="h-4 rounded px-1 text-[9px]">
                        {event[3]}
                      </Badge>
                    </span>
                    <span className="text-[10px] text-muted-foreground">{event[2]}</span>
                    {event[4] && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="size-3" />
                        {event[4]}
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      <span className="flex [&>*+*]:-ml-1">
                        {Array.from({ length: event[5] }, (_, j) => (
                          <Face key={j} small index={j} />
                        ))}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {event[5]} attendees
                      </span>
                    </span>
                  </button>
                ))}
              {group === "Today" &&
                extra.map((e) => (
                  <button
                    className="rounded-lg border p-3 text-left"
                    key={e.name}
                    onClick={() => toast(e.name)}
                  >
                    <p className="text-xs font-medium">{e.name}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{e.time}</p>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>
      <div className="border-t p-3">
        <EventCreator wide onCreate={(event) => setExtra([...extra, event])} />
      </div>
    </>
  );
}
function ContactsPanel() {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState(initialContacts);
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex h-[49px] shrink-0 items-center justify-between border-b px-3">
        <h3 className="text-xs font-semibold">Contacts</h3>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Add contact"
          onClick={() => setOpen(true)}
        >
          <Plus />
        </Button>
      </div>
      <div className="border-b p-3">
        <Input
          aria-label="Search contacts"
          placeholder="Search contacts…"
          className="h-7 text-xs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="shell-scroll">
        {["Design", "Engineering", "Management"].map((group) => (
          <section className="px-4 py-4" key={group}>
            <p className="mb-4 text-[10px] uppercase text-muted-foreground">{group}</p>
            <div className="flex flex-col gap-5">
              {contacts
                .filter(
                  (c) =>
                    c.group === group &&
                    `${c.name} ${c.role}`.toLowerCase().includes(query.toLowerCase()),
                )
                .map((person, i) => (
                  <div className="flex items-center gap-2" key={person.name}>
                    <Face
                      name={person.name}
                      index={i}
                      presence={person.status as "online" | "away" | "offline"}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{person.name}</p>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">
                        {person.role}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-5 text-muted-foreground"
                      aria-label={`Message ${person.name}`}
                      onClick={() =>
                        toast(`Message ${person.name}`, {
                          description: "Direct messaging selected in this demo.",
                        })
                      }
                    >
                      <MessageSquare />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-5 text-muted-foreground"
                      aria-label={`Schedule meeting with ${person.name}`}
                      onClick={() =>
                        toast(`Schedule with ${person.name}`, {
                          description: "Meeting invitation selected.",
                        })
                      }
                    >
                      <CalendarDays />
                    </Button>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
      <footer className="flex items-center justify-between border-t px-3 py-3 text-[10px]">
        <span>{contacts.length} contacts</span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[var(--chart-2)]" />
          {contacts.filter((c) => c.status === "online").length} online
        </span>
      </footer>
      <CreateItemDialog
        open={open}
        onOpenChange={setOpen}
        title="Add contact"
        onCreate={(name) => {
          setContacts([
            ...contacts,
            {
              name,
              role: "Team member",
              group: "Engineering",
              status: "online",
            },
          ]);
          toast.success("Contact added");
        }}
      />
    </>
  );
}
export default function CalendarHub() {
  const [panel, setPanel] = useState("Calendars");
  const [hidden, setHidden] = useState(false);
  const [period, setPeriod] = useState(5);
  const [view, setView] = useState("Week");
  const [enabled, setEnabled] = useState(["Work", "Personal", "Meetings", "Family", "Birthdays"]);
  const month = new Date(2026, period, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const sections = [
    ["Calendars", CalendarDays],
    ["Schedule", Clock],
    ["Contacts", Users],
    ["Notifications", Bell],
  ] as const;
  return (
    <div className="shell-reference" data-shell-variant="5" data-panel-hidden={hidden}>
      <nav className="shell-icon-rail">
        <ReuiMark />
        <div className="mt-5 flex flex-col gap-1.5">
          {sections.map(([name, Icon]) => (
            <Button
              size="icon-sm"
              variant={panel === name ? "secondary" : "ghost"}
              aria-label={name}
              key={name}
              onClick={() => {
                setPanel(name);
                setHidden(false);
              }}
            >
              <Icon />
            </Button>
          ))}
          <SearchPalette iconOnly onSelect={setPanel} />
        </div>
        <div className="mt-auto">
          <WorkspaceMenu collapsed user />
        </div>
      </nav>
      {!hidden && (
        <aside className="shell-secondary">
          {panel === "Calendars" ? (
            <CalendarContext
              key={period}
              month={period}
              day={10}
              showTitle
              onToggleCalendars={setEnabled}
            />
          ) : panel === "Schedule" ? (
            <SchedulePanel />
          ) : panel === "Contacts" ? (
            <ContactsPanel />
          ) : (
            <Notifications feed />
          )}
          <CollapseHandle collapsed={hidden} onToggle={() => setHidden(!hidden)} />
        </aside>
      )}
      <main className={`shell-content-frame ${!hidden ? "max-md:hidden" : ""}`}>
        <header className="shell-header border-b">
          <div className="flex items-center gap-3">
            {hidden && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Show calendars panel"
                onClick={() => setHidden(false)}
              >
                <CalendarDays />
              </Button>
            )}
            <h1 className="text-lg font-semibold">{month}</h1>
            <span className="flex [&>*+*]:-ml-1">
              {enabled.map((name, i) => (
                <span
                  key={name}
                  className="size-2.5 rounded-full border border-background"
                  style={{ background: calendarColors[i % 5] }}
                />
              ))}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous period"
              onClick={() => setPeriod(period - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next period"
              onClick={() => setPeriod(period + 1)}
            >
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPeriod(5)}
            >
              Today
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  aria-label={`Calendar view: ${view}`}
                >
                  {view}
                  <ChevronRight />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {["Day", "Week", "Month", "Year"].map((v) => (
                    <DropdownMenuItem key={v} onSelect={() => setView(v)}>
                      {v}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <EventCreator onCreate={(event) => toast.success(`${event.name} added to ${month}`)} />
          </div>
        </header>
        <PlaceholderCanvas solid />
      </main>
    </div>
  );
}
