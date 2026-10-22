import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Globe,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Head, Person, SmallTabs, Team, toast } from "./shared";
import type { BlockProps } from "@/data/types";
const times = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
];
function TimeSelect({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (s: string) => void;
  label: string;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <Clock />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {times.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
export default function ScheduleBlock({ block }: BlockProps) {
  const n = Number(block.id.split("-").pop());
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 22));
  const [slot, setSlot] = useState("");
  const [duration, setDuration] = useState("30 min");
  const [end, setEnd] = useState("10:00");
  const [start, setStart] = useState("09:00");
  const [booked, setBooked] = useState(false);
  const [filter, setFilter] = useState("All events");
  const [overview, setOverview] = useState(true);
  const [rsvp, setRsvp] = useState("");
  const [selected, setSelected] = useState(["Olivia Rhye"]);
  const format = date?.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const minutes = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  if (n === 2)
    return (
      <div className="flex min-h-[420px] items-center justify-center p-6">
        <Card className="w-full max-w-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Choose your session time</CardTitle>
            <CardDescription>
              Find a time that works best for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <TimeSelect
                label="Start time"
                value={start}
                onChange={setStart}
              />
              <TimeSelect label="End time" value={end} onChange={setEnd} />
            </div>
            <div>
              <p className="mb-3 text-xs text-muted-foreground">
                Quick duration
              </p>
              <SmallTabs
                items={["15 min", "30 min", "45 min", "60 min"]}
                value={duration}
                onChange={(v) => {
                  setDuration(v);
                  const total = minutes(start) + parseInt(v);
                  setEnd(
                    `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`,
                  );
                }}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <span className="text-sm text-muted-foreground">
                Total duration
              </span>
              <span className="text-sm font-semibold">
                {Math.max(0, minutes(end) - minutes(start))} minutes
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={minutes(end) <= minutes(start)}
              onClick={() =>
                toast.success("Session time saved", {
                  description: `${start} – ${end}`,
                })
              }
            >
              Confirm time
              <Check />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  if (n === 7)
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-10">
        <Card className="shadow-none">
          <div className="mx-6 flex h-36 items-center justify-center rounded-lg border bg-muted/60">
            <Video className="size-10 text-muted-foreground" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Live webinar</Badge>
              <Badge variant="secondary">Free event</Badge>
            </div>
            <CardTitle className="mt-3 text-2xl leading-snug">
              Building better products, together.
            </CardTitle>
            <CardDescription>
              A conversation about design, collaboration, and the details that
              matter.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                October 28, 2026
              </span>
              <span className="flex items-center gap-2">
                <Clock className="size-4" />
                10:00 – 11:00 AM PDT
              </span>
              <span className="flex items-center gap-2">
                <Globe className="size-4" />
                Online
              </span>
            </div>
            <Separator />
            <Button
              variant="ghost"
              className="justify-between px-0"
              onClick={() => setOverview(!overview)}
            >
              About this event
              <ChevronDown />
            </Button>
            {overview && (
              <p className="text-sm leading-7 text-muted-foreground">
                Join our product team for a practical session on turning great
                ideas into thoughtful experiences. We’ll share the workflows,
                decisions, and lessons that shape our everyday work. Bring your
                questions — we’d love to hear from you.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Person name="Olivia Rhye" sub="Head of Product, Acme" />
              <Person name="Phoenix Baker" sub="Design Lead, Acme" />
            </div>
            <Separator />
            <p className="text-sm font-medium">Will you be joining us?</p>
            <div className="flex gap-2">
              {["Yes, I’m in", "Maybe", "Skip"].map((t) => (
                <Button
                  key={t}
                  variant={rsvp === t ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setRsvp(t);
                    toast.success("Your RSVP has been recorded");
                  }}
                >
                  {rsvp === t && <Check />}
                  {t}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  if (n === 6)
    return (
      <div className="mx-auto max-w-2xl p-6 md:p-10">
        <Head
          title="Create a schedule"
          description="Bring the right people together at the right time."
          action=""
        />
        <form
          className="mt-7 flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Schedule created");
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="schedule-name">Schedule title</FieldLabel>
              <Input
                id="schedule-name"
                placeholder="e.g. Weekly design sync"
                required
              />
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea placeholder="What will you be working on?" rows={3} />
            </Field>
            <Field>
              <FieldLabel>Team members</FieldLabel>
              <div className="flex flex-col gap-3 rounded-lg border p-4">
                {[
                  "Olivia Rhye",
                  "Phoenix Baker",
                  "Lana Steiner",
                  "Demi Wilkinson",
                ].map((p) => (
                  <div className="flex items-center gap-3" key={p}>
                    <Checkbox
                      id={p}
                      checked={selected.includes(p)}
                      onCheckedChange={(v) =>
                        setSelected(
                          v
                            ? [...selected, p]
                            : selected.filter((n) => n !== p),
                        )
                      }
                    />
                    <label htmlFor={p} className="flex-1">
                      <Person name={p} compact />
                    </label>
                  </div>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Input type="date" defaultValue="2026-10-22" />
              </Field>
              <TimeSelect label="Time" value={start} onChange={setStart} />
            </div>
            <Field>
              <FieldLabel>Attachments (optional)</FieldLabel>
              <Input type="file" />
            </Field>
          </FieldGroup>
          <div className="flex justify-end">
            <Button type="submit">
              Create schedule
              <ArrowRight />
            </Button>
          </div>
        </form>
      </div>
    );
  if (n === 10)
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Set a due date</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose when this task should be completed.
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarDays />
              {format}
              {slot && ` · ${slot}`}
              <ChevronDown />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="mb-3 flex flex-col gap-1">
              {["Today", "Tomorrow", "Next week"].map((t, i) => (
                <Button
                  variant="ghost"
                  size="sm"
                  key={t}
                  className="justify-start"
                  onClick={() => setDate(new Date(2026, 9, 22 + [0, 1, 7][i]))}
                >
                  {t}
                </Button>
              ))}
            </div>
            <Separator />
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              defaultMonth={new Date(2026, 9, 1)}
            />
            <div className="border-t pt-3">
              <TimeSelect
                label="Time"
                value={slot || "09:00"}
                onChange={setSlot}
              />
            </div>
          </PopoverContent>
        </Popover>
        <Button
          size="sm"
          onClick={() =>
            toast.success("Due date saved", {
              description: `${format} ${slot}`,
            })
          }
        >
          Save due date
        </Button>
      </div>
    );
  const agenda = n === 1 || n === 5 || n === 8;
  return (
    <div className="mx-auto max-w-5xl p-5 md:p-9">
      {booked ? (
        <Card className="mx-auto max-w-lg py-10 text-center shadow-none">
          <CardHeader className="items-center">
            <Check className="mb-4 size-12" />
            <CardTitle className="text-2xl">You’re booked!</CardTitle>
            <CardDescription className="mt-2">
              A confirmation has been saved in this demo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{format}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {slot} · {duration} · Google Meet
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => setBooked(false)}
            >
              Book another time
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden py-0 shadow-none">
          <div className="grid lg:grid-cols-[260px_1fr]">
            <aside className="flex flex-col gap-5 border-b bg-muted/20 p-6 lg:border-b-0 lg:border-r">
              <Person name="Alex Morgan" sub="Product & design" />
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {agenda ? block.name : "Let’s find a time to connect"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {agenda
                    ? "A clear view of your day, so you can focus on what matters."
                    : "Book a session to discuss your project, explore ideas, and see how we can help."}
                </p>
              </div>
              <div className="flex flex-col gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Clock className="size-4" />
                  {duration} meeting
                </span>
                <span className="flex items-center gap-2">
                  <Video className="size-4" />
                  Google Meet
                </span>
                <span className="flex items-center gap-2">
                  <Globe className="size-4" />
                  Pacific Time (US & Canada)
                </span>
              </div>
              <SmallTabs
                items={["15 min", "30 min", "60 min"]}
                value={duration}
                onChange={setDuration}
              />
              {n === 3 && (
                <div className="flex flex-col gap-4 border-t pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="recurring">Recurring meeting</label>
                    <Switch id="recurring" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="buffer">Include buffer time</label>
                    <Switch defaultChecked id="buffer" />
                  </div>
                </div>
              )}
            </aside>
            <div className="p-5">
              <h3 className="mb-3 text-sm font-semibold">
                {agenda ? "Your schedule" : "Select a date & time"}
              </h3>
              <div className="grid items-start gap-5 sm:grid-cols-[auto_1fr]">
                <Calendar
                  className="p-0"
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  defaultMonth={new Date(2026, 9, 1)}
                />
                <div className="min-w-0">
                  <h4 className="mb-4 text-xs font-medium">{format}</h4>
                  {agenda ? (
                    <div className="flex flex-col gap-3">
                      {[
                        "Product standup",
                        "Design review",
                        "Customer interview",
                        "Weekly team sync",
                      ]
                        .filter(
                          (_, i) => filter === "All events" || i % 2 === 0,
                        )
                        .map((t, i) => (
                          <button
                            key={t}
                            className="rounded-lg border p-3 text-left"
                            onClick={() =>
                              toast(t, {
                                description: `${format} · ${9 + i * 2}:00`,
                              })
                            }
                          >
                            <p className="text-[10px] text-muted-foreground">
                              {9 + i * 2}:00 – {10 + i * 2}:00
                            </p>
                            <p className="mt-1 text-xs font-medium">{t}</p>
                            <div className="mt-3 flex items-center justify-between">
                              <Badge variant="outline" className="text-[9px]">
                                {i % 2 ? "Design" : "Team"}
                              </Badge>
                              <Team />
                            </div>
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto">
                      {times.map((t) => (
                        <Button
                          variant={slot === t ? "default" : "outline"}
                          size="sm"
                          key={t}
                          onClick={() => setSlot(t)}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {agenda ? (
                <div className="mt-5 border-t pt-4">
                  <SmallTabs
                    items={["All events", "Team", "Design"]}
                    value={filter}
                    onChange={setFilter}
                  />
                  {n === 5 && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {["Present", "Remote", "Time off"].map((t, i) => (
                        <div key={t}>
                          <div className="mb-2 flex justify-between text-xs">
                            <span>{t}</span>
                            <span>{[76, 18, 6][i]}%</span>
                          </div>
                          <Progress value={[76, 18, 6][i]} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                slot && (
                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <span className="text-xs text-muted-foreground">
                      {slot} · {duration}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        setBooked(true);
                        toast.success("Meeting confirmed");
                      }}
                    >
                      Confirm booking
                      <ArrowRight />
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
