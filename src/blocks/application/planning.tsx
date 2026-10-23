import GanttTimeline from "./flow-gantt-timeline";
import FlowCanvas from "./flow-gantt-flow";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  GripVertical,
  MessageSquare,
  Minus,
  MousePointer2,
  Plus,
  Square,
  StickyNote,
  Type,
  Upload,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Head, More, NewItem, SearchInput, SmallTabs, Team, people, toast } from "./shared";
import type { BlockProps } from "@/data/types";
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const initialEvents = [
  { id: 1, title: "Product standup", day: 5, time: "09:00", kind: "Team" },
  { id: 2, title: "Design review", day: 8, time: "11:00", kind: "Design" },
  { id: 3, title: "Sprint planning", day: 12, time: "10:00", kind: "Team" },
  {
    id: 4,
    title: "Customer interview",
    day: 15,
    time: "14:00",
    kind: "Research",
  },
  { id: 5, title: "Weekly sync", day: 19, time: "09:30", kind: "Team" },
  {
    id: 6,
    title: "Launch preparation",
    day: 22,
    time: "13:00",
    kind: "Product",
  },
  { id: 7, title: "Team retrospective", day: 26, time: "15:00", kind: "Team" },
];
export function CalendarBlock({ block }: BlockProps) {
  const [month, setMonth] = useState(9);
  const [view, setView] = useState("Month");
  const [events, setEvents] = useState(initialEvents);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(22);
  const [selected, setSelected] = useState("All calendars");
  const [time, setTime] = useState("09:00");
  const monthDate = new Date(2026, month, 1);
  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const start = (monthDate.getDay() + 6) % 7;
  const total = new Date(2026, month + 1, 0).getDate();
  const compact = /Mini/.test(block.name);
  const resource = /Hotel|Shift|Clinic|Lending|Attendance/.test(block.name);
  const resources = /Hotel/.test(block.name)
    ? ["Room 101", "Room 102", "Room 103", "Room 201", "Room 202"]
    : /Clinic/.test(block.name)
      ? ["Chair 1 · Dr. Chen", "Chair 2 · Dr. Ali", "Chair 3 · Dr. Park", "Chair 4 · Dr. Patel"]
      : ["Olivia Rhye", "Phoenix Baker", "Lana Steiner", "Demi Wilkinson"];
  return (
    <div
      className={`mx-auto flex min-h-[580px] flex-col gap-5 p-5 md:p-7 ${compact ? "max-w-xl" : "max-w-7xl"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{block.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">Your time, thoughtfully organized.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus />
              Add event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create event</DialogTitle>
              <DialogDescription>Add a new event to your calendar.</DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                setEvents([...events, { id: Date.now(), title, day, time, kind: "Team" }]);
                setTitle("");
                setOpen(false);
                toast.success("Event created");
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="event-title">Event title</FieldLabel>
                  <Input
                    id="event-title"
                    placeholder="Team sync"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="event-day">Day</FieldLabel>
                    <Input
                      id="event-day"
                      type="number"
                      min={1}
                      max={total}
                      value={day}
                      onChange={(e) => setDay(+e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="event-time">Time</FieldLabel>
                    <Input
                      id="event-time"
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
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setMonth(month - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setMonth(month + 1)}
          >
            <ChevronRight />
          </Button>
          <h3 className="ml-2 text-sm font-medium">{monthLabel}</h3>
          <Button variant="ghost" size="sm" onClick={() => setMonth(9)}>
            Today
          </Button>
        </div>
        {!compact && <SmallTabs items={["Month", "Week", "Day"]} value={view} onChange={setView} />}
      </div>
      {resource ? (
        <div className="overflow-x-auto rounded-lg border">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[160px_repeat(7,1fr)] border-b bg-muted/40">
              <div className="p-3 text-xs text-muted-foreground">Resource</div>
              {days.map((d, i) => (
                <div className="border-l p-3 text-center text-xs" key={d}>
                  {d} {19 + i}
                </div>
              ))}
            </div>
            {resources.map((r, i) => (
              <div
                key={r}
                className="grid min-h-24 grid-cols-[160px_repeat(7,1fr)] border-b last:border-b-0"
              >
                <div className="flex items-center border-r p-3 text-xs font-medium">{r}</div>
                {days.map((d, j) => (
                  <button
                    key={d}
                    className="border-r p-1 text-left last:border-r-0"
                    onClick={() => {
                      setDay(19 + j);
                      setTitle("");
                      setOpen(true);
                    }}
                  >
                    {(j + i) % 3 !== 0 && (
                      <div className="rounded-md border bg-muted p-2 text-[10px] leading-5">
                        <p className="font-medium">
                          {
                            ["Morning shift", "Consultation", "Reserved", "Team review"][
                              (i + j) % 4
                            ]
                          }
                        </p>
                        <p className="text-muted-foreground">
                          {9 + j}:00 – {11 + j}:00
                        </p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : view === "Month" ? (
        <div className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {days.map((d) => (
              <div key={d} className="p-3 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: Math.ceil((total + start) / 7) * 7 }, (_, i) => {
              const d = i - start + 1;
              const valid = d > 0 && d <= total;
              return (
                <div
                  key={i}
                  className={`min-h-24 border-b border-r p-1.5 last:border-r-0 ${!valid ? "bg-muted/20" : ""}`}
                >
                  <button
                    disabled={!valid}
                    onClick={() => {
                      setDay(d);
                      setOpen(true);
                    }}
                    className={`flex size-6 items-center justify-center rounded-full text-xs ${d === 22 ? "bg-foreground text-background" : ""}`}
                  >
                    {valid ? d : ""}
                  </button>
                  {valid &&
                    events
                      .filter(
                        (e) => e.day === d && (selected === "All calendars" || e.kind === selected),
                      )
                      .map((e) => (
                        <button
                          key={e.id}
                          className="mt-1 block w-full truncate rounded border bg-muted/70 px-1.5 py-1 text-left text-[10px]"
                          onClick={() =>
                            toast(e.title, {
                              description: `${monthLabel} ${e.day} · ${e.time}`,
                            })
                          }
                        >
                          <span className="mr-1 text-muted-foreground">{e.time}</span>
                          <span>{e.title}</span>
                        </button>
                      ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <div
            className={`min-w-[500px] ${view === "Week" ? "grid grid-cols-[50px_repeat(7,1fr)]" : "grid grid-cols-[50px_1fr]"}`}
          >
            <div className="border-b p-3 text-xs text-muted-foreground">GMT</div>
            {(view === "Week" ? days : ["Thursday"]).map((d, i) => (
              <div className="border-b border-l p-3 text-center text-xs" key={d}>
                {d} {19 + i}
              </div>
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="contents">
                <div className="h-16 border-b p-2 text-[10px] text-muted-foreground">
                  {i + 9}:00
                </div>
                {(view === "Week" ? days : ["Thursday"]).map((d, j) => (
                  <button
                    key={d}
                    className="border-b border-l p-1 text-left"
                    onClick={() => {
                      setDay(j + 19);
                      setTime(`${i + 9}:00`);
                      setOpen(true);
                    }}
                  >
                    {(i + j) % 7 === 0 && (
                      <div className="rounded-md border bg-muted p-2 text-[10px]">
                        {["Product standup", "Design review", "Client meeting"][j % 3]}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {["All calendars", "Team", "Design", "Research"].map((c) => (
          <Button
            key={c}
            size="sm"
            variant={selected === c ? "secondary" : "ghost"}
            onClick={() => setSelected(c)}
          >
            {c}
          </Button>
        ))}
      </div>
    </div>
  );
}
const baseTasks = [
  {
    id: "1",
    title: "Improve onboarding experience",
    status: "In progress",
    label: "Design",
    person: 0,
  },
  {
    id: "2",
    title: "Fix authentication redirect",
    status: "Backlog",
    label: "Bug",
    person: 1,
  },
  {
    id: "3",
    title: "Design mobile navigation",
    status: "In progress",
    label: "Design",
    person: 2,
  },
  {
    id: "4",
    title: "Update API documentation",
    status: "In review",
    label: "Docs",
    person: 3,
  },
  {
    id: "5",
    title: "Customer feedback analysis",
    status: "Done",
    label: "Research",
    person: 4,
  },
  {
    id: "6",
    title: "Add workspace search",
    status: "Backlog",
    label: "Feature",
    person: 0,
  },
  {
    id: "7",
    title: "Performance improvements",
    status: "In review",
    label: "Engineering",
    person: 2,
  },
];
export function BoardBlock({ block }: BlockProps) {
  const sales = /Sales|Renewal/.test(block.name);
  const recruiting = /Recruit/.test(block.name);
  const cols = sales
    ? ["New leads", "Qualified", "Proposal", "Won"]
    : recruiting
      ? ["Applied", "Screening", "Interview", "Hired"]
      : ["Backlog", "In progress", "In review", "Done"];
  const [tasks, setTasks] = useState(
    baseTasks.map((t) => ({
      ...t,
      status: cols[["Backlog", "In progress", "In review", "Done"].indexOf(t.status)],
    })),
  );
  const [q, setQ] = useState("");
  const [drag, setDrag] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [votes, setVotes] = useState<string[]>([]);
  return (
    <div className="flex min-h-[620px] flex-col gap-5 p-6">
      <Head
        title={block.name}
        description={
          sales
            ? "Move opportunities from first contact to close."
            : "Organize, prioritize, and move work forward."
        }
        action=""
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search tasks…" />
        <div className="flex items-center gap-3">
          <Team />
          <NewItem
            label={sales ? "New deal" : "New task"}
            onCreate={(n) =>
              setTasks([
                ...tasks,
                {
                  id: String(Date.now()),
                  title: n,
                  status: cols[0],
                  label: sales ? "Lead" : "Feature",
                  person: 0,
                },
              ])
            }
          />
        </div>
      </div>
      <div className="grid flex-1 gap-4 overflow-x-auto md:grid-cols-4">
        {cols.map((c, i) => (
          <div
            key={c}
            className="flex min-w-[200px] flex-col gap-3 rounded-xl bg-muted/50 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setTasks(tasks.map((t) => (t.id === drag ? { ...t, status: c } : t)));
              setDrag("");
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-1"
                onClick={() =>
                  setHidden(hidden.includes(c) ? hidden.filter((v) => v !== c) : [...hidden, c])
                }
              >
                <span className="size-2 rounded-full border bg-background" />
                {c}
                <Badge variant="outline">{tasks.filter((t) => t.status === c).length}</Badge>
              </Button>
              <More />
            </div>
            {!hidden.includes(c) &&
              tasks
                .filter((t) => t.status === c && t.title.toLowerCase().includes(q.toLowerCase()))
                .map((t) => (
                  <Card
                    key={t.id}
                    draggable
                    onDragStart={() => setDrag(t.id)}
                    className="cursor-grab gap-3 py-4 shadow-none active:cursor-grabbing"
                  >
                    <CardHeader className="gap-3 px-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">
                          {t.label}
                        </Badge>
                        <More />
                      </div>
                      <CardTitle className="text-sm font-medium leading-6">
                        {sales
                          ? [
                              "Acme enterprise deal",
                              "Pioneer expansion",
                              "Horizon annual renewal",
                              "Northstar platform",
                            ][Number(t.id) % 4]
                          : recruiting
                            ? people[t.person]
                            : t.title}
                      </CardTitle>
                      {sales && <CardDescription>$12,500 · Annual contract</CardDescription>}
                    </CardHeader>
                    <CardContent className="flex items-center justify-between px-4">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-[9px]">
                          {people[t.person]
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <MessageSquare className="size-3" />3
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Oct {23 + i}
                        </span>
                      </div>
                    </CardContent>
                    {/Vote/.test(block.name) && (
                      <div className="px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            setVotes(
                              votes.includes(t.id)
                                ? votes.filter((v) => v !== t.id)
                                : [...votes, t.id],
                            )
                          }
                        >
                          ↑ {votes.includes(t.id) ? 13 : 12} votes
                        </Button>
                      </div>
                    )}
                    <div className="px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-full text-[10px] text-muted-foreground"
                        onClick={() => {
                          setTasks(
                            tasks.map((x) =>
                              x.id === t.id ? { ...x, status: cols[(i + 1) % 4] } : x,
                            ),
                          );
                          toast.success("Task moved");
                        }}
                      >
                        Move to {cols[(i + 1) % 4]}
                        <ArrowRight />
                      </Button>
                    </div>
                  </Card>
                ))}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-muted-foreground"
              onClick={() =>
                setTasks([
                  ...tasks,
                  {
                    id: String(Date.now()),
                    title: "Untitled task",
                    status: c,
                    label: "Feature",
                    person: i,
                  },
                ])
              }
            >
              <Plus />
              Add task
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
export function GanttBlock({ block }: BlockProps) {
  return <GanttTimeline key={block.id} block={block} />;
}
export function FlowBlock({ block }: BlockProps) {
  return <FlowCanvas key={block.id} block={block} />;
}
export function TimelineBlock({ block }: BlockProps) {
  const [filter, setFilter] = useState("All activity");
  const [q, setQ] = useState("");
  const activity = [
    ["Olivia Rhye", "created a new project", "Website redesign", "Just now"],
    ["Phoenix Baker", "completed a milestone", "Design system v2", "35 minutes ago"],
    ["Lana Steiner", "uploaded 3 documents", "Q4 marketing brief", "2 hours ago"],
    ["Demi Wilkinson", "approved the proposal", "Mobile app development", "3 hours ago"],
    ["Drew Cano", "invited a team member", "Acme workspace", "Yesterday"],
  ];
  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <Head title={block.name} description="A complete history of what’s happening." action="" />
      <div className="my-6 flex flex-wrap justify-between gap-3">
        <SmallTabs
          items={["All activity", "Updates", "Comments"]}
          value={filter}
          onChange={setFilter}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search activity…" />
      </div>
      <Card className="shadow-none">
        <CardContent className="pt-6">
          {activity
            .filter((r) => r.join(" ").toLowerCase().includes(q.toLowerCase()))
            .filter((_, i) =>
              filter === "All activity" || filter === "Updates" ? true : i % 2 === 0,
            )
            .map(([n, a, p, time], i) => (
              <div key={n} className="relative flex gap-4 pb-8 last:pb-0">
                {i < activity.length - 1 && (
                  <span className="absolute bottom-0 left-4 top-10 w-px bg-border" />
                )}
                <Avatar className="relative size-8">
                  <AvatarFallback className="text-xs">
                    {n
                      .split(" ")
                      .map((v) => v[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{n}</span>{" "}
                    <span className="text-muted-foreground">{a}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{time}</p>
                  <div className="mt-3 flex items-center justify-between rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{p}</span>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`View ${p}`}
                      onClick={() =>
                        toast(p, {
                          description: "Activity details are up to date.",
                        })
                      }
                    >
                      <ArrowRight />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
export function WhiteboardBlock({ block }: BlockProps) {
  const [notes, setNotes] = useState([
    {
      id: 1,
      text: "Understand the problem\nWho are we building this for?",
      x: 10,
      y: 18,
    },
    {
      id: 2,
      text: "Explore possibilities\nStart with the boldest idea.",
      x: 39,
      y: 39,
    },
    { id: 3, text: "Make it happen\nSmall steps, big impact.", x: 67, y: 17 },
  ]);
  const [tool, setTool] = useState("select");
  const [drag, setDrag] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [selected, setSelected] = useState(1);
  return (
    <div className="flex min-h-[600px] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex items-center gap-3">
          <FileText className="size-4" />
          <span className="text-sm font-semibold">{block.name}</span>
          <Badge variant="outline">Team board</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Team />
          <Button
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(location.href);
              toast.success("Board link copied");
            }}
          >
            Share board
          </Button>
        </div>
      </div>
      <div
        className="relative min-h-[500px] flex-1 overflow-hidden bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[size:18px_18px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const box = e.currentTarget.getBoundingClientRect();
          setNotes(
            notes.map((n) =>
              n.id === drag
                ? {
                    ...n,
                    x: Math.max(0, Math.min(78, ((e.clientX - box.left) / box.width) * 100)),
                    y: Math.max(3, Math.min(72, ((e.clientY - box.top) / box.height) * 100)),
                  }
                : n,
            ),
          );
        }}
      >
        <div className="absolute left-4 top-4 flex flex-col gap-1 rounded-xl border bg-background p-1.5 shadow-sm">
          {[
            ["select", MousePointer2],
            ["note", StickyNote],
            ["text", Type],
            ["shape", Square],
            ["comment", MessageSquare],
          ].map(([t, I]) => {
            const Icon = I as typeof MousePointer2;
            return (
              <Button
                key={String(t)}
                variant={tool === t ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label={`${t} tool`}
                onClick={() => {
                  setTool(String(t));
                  if (t === "note") {
                    setNotes([
                      ...notes,
                      {
                        id: Date.now(),
                        text: "New idea\nClick to edit",
                        x: 30,
                        y: 25,
                      },
                    ]);
                  }
                }}
              >
                <Icon />
              </Button>
            );
          })}
        </div>
        {notes.map((n) => (
          <div
            key={n.id}
            draggable
            onDragStart={() => setDrag(n.id)}
            onClick={() => setSelected(n.id)}
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              transform: `scale(${zoom / 100})`,
            }}
            className={`absolute w-44 cursor-move rounded-sm border bg-background p-5 shadow-md ${selected === n.id ? "ring-2 ring-ring" : ""}`}
          >
            <Textarea
              aria-label="Sticky note"
              value={n.text}
              onChange={(e) =>
                setNotes(notes.map((v) => (v.id === n.id ? { ...v, text: e.target.value } : v)))
              }
              className="min-h-24 resize-none border-0 p-0 text-sm shadow-none focus-visible:ring-0"
            />
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Alex Morgan</span>
              <GripVertical className="size-3" />
            </div>
          </div>
        ))}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-background p-1.5 shadow-sm">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Zoom out"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
          >
            <Minus />
          </Button>
          <span className="w-10 text-center text-xs">{zoom}%</span>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Zoom in"
            onClick={() => setZoom(Math.min(140, zoom + 10))}
          >
            <Plus />
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <Button variant="ghost" size="sm" onClick={() => setZoom(100)}>
            Fit
          </Button>
        </div>
      </div>
    </div>
  );
}
export function EmptyBlock({ block }: BlockProps) {
  const [q, setQ] = useState("");
  const [created, setCreated] = useState(false);
  const [upload, setUpload] = useState(false);
  const search = /Search|Filter/.test(block.name);
  const invite = /Invite|Member|Team/.test(block.name);
  const connect = /Connect|Cloud|Organization/.test(block.name);
  const steps = /Launch|Setup/.test(block.name);
  const title = search
    ? "No results found"
    : invite
      ? "Great work starts with a great team"
      : connect
        ? "Bring your tools together"
        : /Report/.test(block.name)
          ? "Your first insight starts here"
          : /Project/.test(block.name)
            ? "Every great idea starts somewhere"
            : "A fresh start for your workspace";
  return (
    <div className="flex min-h-[540px] flex-col p-6">
      <Head
        title={block.name.replace("Empty ", "")}
        description="A little organization goes a long way."
        action=""
      />
      {search && (
        <div className="mt-5 max-w-sm">
          <SearchInput value={q} onChange={setQ} placeholder="Search your workspace…" />
        </div>
      )}
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 py-16 text-center">
        <div className="relative flex size-16 items-center justify-center rounded-2xl border bg-muted/30">
          <div className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border bg-background">
            <Plus className="size-3" />
          </div>
          {created ? (
            <Check className="size-7" />
          ) : search ? (
            <Search className="size-7 text-muted-foreground" />
          ) : invite ? (
            <MessageSquare className="size-7 text-muted-foreground" />
          ) : connect ? (
            <Workflow className="size-7 text-muted-foreground" />
          ) : (
            <FileText className="size-7 text-muted-foreground" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {created ? "You’re ready to go!" : title}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {created
              ? "Your demo workspace has been updated. Create another item to keep building."
              : search
                ? `We couldn’t find anything ${q ? `matching “${q}”` : "for your search"}. Try a different term or clear your filters.`
                : invite
                  ? "Invite your teammates to collaborate, share ideas, and build something great together."
                  : connect
                    ? "Connect your favorite tools to keep all your work in one place."
                    : "Create your first item to get started. Your team’s best work is still ahead."}
          </p>
        </div>
        {search ? (
          <Button
            variant="outline"
            onClick={() => {
              setQ("");
              toast("Search filters cleared");
            }}
          >
            Clear filters
          </Button>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={() => {
                setCreated(true);
                toast.success(
                  invite
                    ? "Invitation sent"
                    : connect
                      ? "Demo connection created"
                      : "New item created",
                );
              }}
            >
              <Plus />
              {invite
                ? "Invite team members"
                : connect
                  ? "Connect a tool"
                  : "Create your first item"}
            </Button>
            {/Import|Data/.test(block.name) && (
              <Button variant="outline" onClick={() => setUpload(!upload)}>
                <Upload />
                Import data
              </Button>
            )}
          </div>
        )}
        {upload && (
          <div className="w-full rounded-lg border border-dashed p-6">
            <Input
              type="file"
              aria-label="Select a CSV file"
              accept=".csv,.json"
              onChange={() => {
                setCreated(true);
                toast.success("File selected for import");
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">CSV or JSON files up to 10 MB</p>
          </div>
        )}
        {steps && (
          <div className="mt-5 grid gap-3 text-left sm:grid-cols-3">
            {["Create a workspace", "Invite your team", "Launch a project"].map((t, i) => (
              <div className="rounded-lg border p-4" key={t}>
                <span className="text-xs text-muted-foreground">0{i + 1}</span>
                <p className="mt-2 text-xs font-medium">{t}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
