import { createContext, useContext, useState, type ComponentProps } from "react";
import { Clock3, MapPin, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { CalendarDayButton } from "@/components/ui/calendar";
import { CalendarSelect } from "@/components/reui/calendar-select";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import type { BlockProps } from "@/data/types";
import { demoAvatar } from "@/lib/demo-artwork";
import "../reference.css";
import "./schedule-agendas.css";

type Category = "Sprint" | "Standup" | "Review" | "Deadline" | "Workshop";
type AgendaEvent = {
  title: string;
  category: Category;
  time: string;
  people?: string[];
  location?: string;
};
const categoryColors: Record<Category, string> = {
  Sprint: "#8b5cf6",
  Standup: "#f59e0b",
  Review: "#0ea5e9",
  Deadline: "#f43f5e",
  Workshop: "#10b981",
};
const categories = Object.keys(categoryColors) as Category[];
const team = ["Alex Chen", "Priya Singh", "Marcus Webb", "Sofia Reyes", "Liam Torres"];
const statusPeople = [
  "Emma Wilson",
  "Alex Johnson",
  "Zoe Martinez",
  "Lucas Ferreira",
  "Tom Anderson",
  "Sarah Chen",
  "James Park",
  "Nina Patel",
];
const event = (
  title: string,
  category: Category,
  time: string,
  indices?: number[],
): AgendaEvent => ({ title, category, time, people: indices?.map((i) => team[i]) });
// The public preview uses these June 2026 dates, rather than the system date.
const teamEvents: Record<number, AgendaEvent[]> = {
  9: [
    event("Sprint Kickoff", "Sprint", "9am - 10:30am", [0, 1, 2, 3]),
    event("Eng Standup", "Standup", "9:30am - 9:45am", [0, 2, 4]),
    event("Design Review", "Review", "11am - 12pm", [1, 3, 4]),
    event("Product Sync", "Standup", "1pm - 1:15pm", [0, 1]),
    event("Figma Workshop", "Workshop", "2pm - 3:30pm", [0, 2, 3, 4]),
    event("Auth Deadline", "Deadline", "5pm - 5pm", [0, 2]),
  ],
  10: [
    event("Checkout Review", "Review", "2pm - 3pm", [1, 3]),
    event("Daily Standup", "Standup", "9:30am - 9:45am", [0, 1, 2]),
    event("Product Sync", "Standup", "11am - 11:15am", [0, 1]),
    event("Design Critique", "Review", "4pm - 5pm", [1, 3, 4]),
  ],
  11: [
    event("API Deadline", "Deadline", "5pm - 5pm", [0, 2]),
    event("Backend Sync", "Standup", "10am - 10:15am", [0, 2, 4]),
    event("API Review", "Review", "11am - 12pm", [0, 2, 3]),
    event("Dev Workshop", "Workshop", "2pm - 3:30pm", [0, 1, 2]),
  ],
  12: [
    event("Architecture Workshop", "Workshop", "10am - 12:30pm", [0, 1, 2, 3, 4]),
    event("QA Review", "Review", "3pm - 4pm", [1, 3]),
  ],
  13: [
    event("Roadmap Review", "Review", "11am - 12pm", [1, 3, 4]),
    event("Retro", "Sprint", "3pm - 4pm", [0, 1, 2, 3]),
    event("Daily Standup", "Standup", "9:30am - 9:45am", [0, 1, 2]),
  ],
  14: [
    event("Design Standup", "Standup", "9:30am - 9:45am"),
    event("Docs Workshop", "Workshop", "2pm - 3pm"),
    event("Code Review", "Review", "11am - 12pm"),
  ],
  15: [
    event("Frontend Sync", "Standup", "10am - 10:15am"),
    event("UX Review", "Review", "3pm - 4pm"),
    event("Design Workshop", "Workshop", "1pm - 2pm"),
  ],
  16: [
    event("Mobile Release", "Deadline", "6pm - 6pm"),
    event("Release Standup", "Standup", "9:30am - 9:45am"),
    event("QA Review", "Review", "2pm - 3pm"),
  ],
  17: [
    event("TS Migration", "Workshop", "1pm - 3:30pm"),
    event("Tech Sync", "Standup", "10am - 10:15am"),
    event("Migration Deadline", "Deadline", "5pm - 5pm"),
  ],
  18: [
    event("Design Standup", "Standup", "9:30am - 9:45am"),
    event("Perf Review", "Review", "2pm - 3pm"),
    event("Backend Sync", "Standup", "4pm - 4:15pm"),
  ],
  19: [
    event("A11y Review", "Review", "10am - 11:30am"),
    event("Eng Sync", "Standup", "9:30am - 9:45am"),
    event("Security Review", "Review", "2pm - 3pm"),
  ],
  20: [
    event("Sprint Planning", "Sprint", "9am - 11am", [0, 1, 2, 3, 4]),
    event("Backlog Grooming", "Sprint", "2pm - 3pm"),
  ],
};
const appointments: AgendaEvent[] = [
  {
    title: "Mobile QA Handoff",
    category: "Review",
    time: "2:30 pm",
    location: "Remote",
    people: statusPeople.slice(0, 4),
  },
  {
    title: "Quarterly All-Hands",
    category: "Review",
    time: "4:00 pm",
    location: "Main Hall",
    people: statusPeople.slice(4, 6),
  },
  {
    title: "Marketing Campaign Review",
    category: "Review",
    time: "10:30 am",
    location: "Google Meet",
    people: [statusPeople[4], statusPeople[5], statusPeople[6], statusPeople[7]],
  },
  {
    title: "Hiring Panel · Design",
    category: "Review",
    time: "11:00 am",
    location: "Zoom",
    people: [statusPeople[1], statusPeople[2], statusPeople[3], statusPeople[0]],
  },
  {
    title: "Release Sign-off",
    category: "Review",
    time: "3:00 pm",
    location: "Zoom",
    people: [statusPeople[2], statusPeople[3], statusPeople[0], statusPeople[1]],
  },
  {
    title: "UX Research Session",
    category: "Review",
    time: "4:00 pm",
    location: "Lab 2",
    people: [statusPeople[2], statusPeople[3], statusPeople[0], statusPeople[1]],
  },
];
const statusDays = new Set([4, 8, 9, 10, 11, 13, 21, 24, 25, 28]);
const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("");
function Attendees({
  people = [],
  alignment = "end",
}: {
  people?: string[];
  alignment?: "start" | "end";
}) {
  if (!people.length) return null;
  return (
    <AvatarGroup className="sa-avatars -space-x-1.5" aria-label="Attendees">
      {people.slice(0, 3).map((name) => (
        <Avatar key={name} className="sa-avatar" title={name}>
          <AvatarImage src={demoAvatar(name)} alt={name} />
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      ))}
      {people.length > 3 && (
        <Popover>
          <AvatarGroupCount className="sa-more-count">
            <PopoverTrigger asChild>
              <button
                className="sa-more"
                aria-label={`${people.length - 3} more: ${people.slice(3).join(", ")}`}
              >
                +{people.length - 3}
              </button>
            </PopoverTrigger>
          </AvatarGroupCount>
          <PopoverContent className="reui-reference sa-people-popover" align={alignment}>
            <h3>Attendees</h3>
            <div className="sa-people-list">
              {people.map((name) => (
                <div key={name}>
                  <Avatar className="size-6">
                    <AvatarImage src={demoAvatar(name)} alt={name} />
                    <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
                  </Avatar>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </AvatarGroup>
  );
}
const AgendaCalendarContext = createContext({ compact: false });
function AgendaDayButton({
  day,
  modifiers,
  className,
  ...props
}: ComponentProps<typeof CalendarDayButton>) {
  const { compact } = useContext(AgendaCalendarContext);
  const june = day.date.getFullYear() === 2026 && day.date.getMonth() === 5;
  const dots =
    compact && june
      ? [...new Set((teamEvents[day.date.getDate()] || []).map((e) => e.category))].slice(0, 3)
      : [];
  return (
    <CalendarDayButton
      {...props}
      day={day}
      modifiers={modifiers}
      className={`${className || ""} sa-day ${modifiers.selected ? "sa-selected" : ""} ${modifiers.outside ? "sa-outside" : ""}`}
    >
      {day.date.getDate()}
      {compact ? (
        <span className="sa-category-dots" aria-hidden="true">
          {dots.map((category) => (
            <i key={category} style={{ backgroundColor: categoryColors[category] }} />
          ))}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={`sa-status-dot ${june && statusDays.has(day.date.getDate()) ? "sa-has-event" : ""}`}
        />
      )}
    </CalendarDayButton>
  );
}
function AgendaCalendar({
  compact,
  date,
  month,
  setMonth,
  setDate,
}: {
  compact: boolean;
  date: Date;
  month: Date;
  setMonth: (d: Date) => void;
  setDate: (d: Date) => void;
}) {
  // ReUI c-calendar-8's Select/DayPicker adapter owns navigation and options.
  // Native CalendarDayButton owns keyboard focus, rather than another date grid.
  return (
    <AgendaCalendarContext.Provider value={{ compact }}>
      <div className="sa-calendar" data-selected-weekday={date.getDay()}>
        <CalendarSelect
          className="sa-native-calendar"
          mode="single"
          required
          selected={date}
          month={month}
          onMonthChange={setMonth}
          onSelect={(selected) => {
            setDate(selected);
            if (
              selected.getMonth() !== month.getMonth() ||
              selected.getFullYear() !== month.getFullYear()
            )
              setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
          }}
          startMonth={new Date(2016, 0)}
          endMonth={new Date(2036, 11)}
          monthTriggerClassName="sa-month-select"
          yearTriggerClassName="sa-year-select"
          dropdownNavClassName="sa-calendar-dropdowns"
          portalClassName="reui-reference"
          labels={{
            labelPrevious: () => "Previous month",
            labelNext: () => "Next month",
            labelDayButton: (day) =>
              day.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
          }}
          formatters={{
            formatMonthDropdown: (day) => day.toLocaleDateString("en-US", { month: "long" }),
            formatWeekdayName: (day) =>
              day.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
          }}
          classNames={{
            root: "sa-native-calendar",
            months: "sa-native-months",
            month: "sa-native-month",
            nav: "sa-native-nav",
            month_caption: "sa-native-caption",
            button_previous: "sa-calendar-previous",
            button_next: "sa-calendar-next",
            month_grid: "sa-native-grid",
            weekdays: "sa-weekdays",
            weekday: "sa-weekday",
            weeks: "sa-native-weeks",
            week: "sa-native-week",
            day: "sa-day-cell",
            today: "",
            outside: "sa-outside",
          }}
          components={{ DayButton: AgendaDayButton }}
        />
      </div>
    </AgendaCalendarContext.Provider>
  );
}
export default function ScheduleAgendas({ block }: BlockProps) {
  const compact = block.id === "schedule-8";
  const [date, setDate] = useState(new Date(2026, 5, compact ? 9 : 10));
  const [month, setMonth] = useState(new Date(2026, 5, 1));
  const [filter, setFilter] = useState("All");
  const events = compact
    ? date.getFullYear() === 2026 && date.getMonth() === 5
      ? teamEvents[date.getDate()] || []
      : []
    : appointments;
  const visible = events.filter(
    (e) => filter === "All" || (compact ? e.category === filter : filter === "Upcoming"),
  );
  const heading = date.toLocaleDateString(
    "en-US",
    compact
      ? { month: "long", day: "numeric", year: "numeric" }
      : { weekday: "long", month: "long", day: "numeric" },
  );
  return (
    <div className={`reui-reference sa-stage ${compact ? "sa-compact" : "sa-appointments"}`}>
      <Frame className="sa-frame">
        <FramePanel className="sa-panel">
          <div className="sa-calendar-pane">
            <AgendaCalendar
              compact={compact}
              date={date}
              month={month}
              setMonth={setMonth}
              setDate={setDate}
            />
          </div>
          <section className="sa-agenda-pane" aria-label="Agenda">
            <header className="sa-agenda-header">
              <div>
                <h2>{heading}</h2>
                {!compact && (
                  <p>{visible.length ? `${visible.length} events` : "No events found"}</p>
                )}
              </div>
              {compact ? (
                <Button variant="ghost" size="icon" aria-label="Add event">
                  <Plus />
                </Button>
              ) : (
                <div className="sa-status-actions">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger size="sm" aria-label="Event status">
                      <SelectValue>{filter === "All" ? "All events" : filter}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="reui-reference">
                      <SelectGroup>
                        {["All", "Upcoming", "Completed", "Cancelled", "Pending"].map((status) => (
                          <SelectItem key={status} value={status}>
                            {status === "All" ? "All events" : status}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button size="sm">
                    <Plus />
                    Add
                  </Button>
                </div>
              )}
            </header>
            {compact && (
              <div className="sa-filter-grid" aria-label="Event categories">
                {["All", ...categories].map((c) => (
                  <Button
                    key={c}
                    variant={filter === c ? "default" : "outline"}
                    aria-pressed={filter === c}
                    onClick={() => setFilter(c)}
                  >
                    {c !== "All" && (
                      <i
                        aria-hidden="true"
                        style={{ backgroundColor: categoryColors[c as Category] }}
                      />
                    )}
                    {c}
                  </Button>
                ))}
              </div>
            )}
            <ScrollArea type="auto" className="sa-events-scroll">
              <div className="sa-event-list">
                {visible.map((e, i) =>
                  compact ? (
                    <article key={`${date.toDateString()}-${i}`} className="sa-team-event">
                      <i
                        className="sa-event-color"
                        style={{ backgroundColor: categoryColors[e.category] }}
                      />
                      <div className="sa-event-copy">
                        <h3>{e.title}</h3>
                        <p>
                          Jun {date.getDate()}, {e.time}
                        </p>
                      </div>
                      <Attendees people={e.people} />
                    </article>
                  ) : (
                    <article key={e.title} className="sa-appointment-event">
                      <h3>{e.title}</h3>
                      <div className="sa-appointment-meta">
                        <Badge variant="focus-light" size="sm" className="sa-upcoming">
                          Upcoming
                        </Badge>
                        <Attendees people={e.people} alignment="start" />
                        <span>
                          <Clock3 />
                          Jun 10 · {e.time}
                        </span>
                        <span>
                          <MapPin />
                          {e.location}
                        </span>
                      </div>
                    </article>
                  ),
                )}
                {!visible.length && (
                  <div className="sa-empty">
                    <IconTile variant="solid" radius="full" className="sa-empty-icon">
                      <CalendarDays />
                    </IconTile>
                    <div className="sa-empty-copy">
                      <h3>{compact ? "No events scheduled" : "No events found"}</h3>
                      {compact ? (
                        <Button size="sm">Add one</Button>
                      ) : (
                        <p>Nothing scheduled for this day.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </section>
        </FramePanel>
      </Frame>
    </div>
  );
}
