import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CalendarClock, Ellipsis, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import {
  Timeline,
  TimelineContent,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { demoAvatar } from "@/lib/demo-artwork";
import { JobDateField } from "./grid-advanced-job-schedule-forms";
import {
  crew,
  crewMember,
  jobDate,
  jobName,
  jobProgress,
  taskHours,
  type Job,
  type JobStatus,
} from "./grid-advanced-job-schedule-model";

export type JobTab = "overview" | "crew" | "materials" | "history";

export function JobAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <Avatar className={className}>
      <AvatarImage src={demoAvatar(name)} alt="" />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const variants = {
    "On Track": "primary-light",
    "On Hold": "warning-light",
    "Not Started": "outline",
    Complete: "success-light",
    Late: "destructive-light",
  } as const;
  return (
    <Badge size="sm" variant={variants[status]}>
      {status}
    </Badge>
  );
}

function DetailFrame({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Frame spacing="sm" dense>
      <FrameHeader>
        <FrameTitle>{title}</FrameTitle>
        {description && <FrameDescription className="text-xs">{description}</FrameDescription>}
      </FrameHeader>
      <FramePanel className="p-3">{children}</FramePanel>
    </Frame>
  );
}

function FactList({ facts }: { facts: readonly (readonly [string, ReactNode])[] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 text-sm">
      {facts.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function JobAtGlance({ job }: { job: Job }) {
  const { worked, left, next, finish } = jobProgress(job);
  return (
    <div className="grid max-w-[58rem] grid-cols-3 gap-3 bg-muted/30 p-3">
      <DetailFrame title="Client">
        <FactList
          facts={[
            ["Name", job.client],
            ["Address", `${job.street}, ${job.town}`],
          ]}
        />
      </DetailFrame>
      <DetailFrame title="Crew">
        <FactList
          facts={[
            ["Lead", crewMember(job.lead)?.name ?? "—"],
            ["Worked", `${worked}h`],
            ["Left", `${left}h`],
          ]}
        />
      </DetailFrame>
      <DetailFrame title="Schedule">
        <FactList
          facts={[
            ["Next day", next ? jobDate(next.date) : "—"],
            ["Finish", jobDate(finish)],
            ["Due", jobDate(job.due)],
          ]}
        />
      </DetailFrame>
    </div>
  );
}

interface DetailsProps {
  job: Job;
  tab: JobTab;
  onTab: (tab: JobTab) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCrewDay: (date?: string) => void;
  onSlide: () => void;
  onHold: () => void;
  onNotes: (notes: string) => void;
  onMaterial: (id: string, patch: { received?: boolean; arrives?: string }) => void;
  onInspection: (id: string, completed: boolean) => void;
}

export function JobDetails({
  job,
  tab,
  onTab,
  onEdit,
  onDelete,
  onCrewDay,
  onSlide,
  onHold,
  onNotes,
  onMaterial,
  onInspection,
}: DetailsProps) {
  const { status, worked, left, finish, late, next } = jobProgress(job);
  const workedPercent = worked + left > 0 ? Math.round((100 * worked) / (worked + left)) : 0;
  const received = job.materials.filter((material) => material.received).length;
  const orderTotal = job.materials.reduce((total, material) => total + material.cost, 0);
  const people = crew.flatMap((member) => {
    const hours = job.days
      .filter((day) => day.state !== "Lost")
      .reduce(
        (result, day) => {
          const assigned = day.tasks
            .filter((task) => task.crewId === member.id)
            .reduce((sum, task) => sum + task.hours, 0);
          return {
            total: result.total + assigned,
            done: result.done + (day.state === "Done" ? assigned : 0),
          };
        },
        { total: 0, done: 0 },
      );
    return hours.total ? [{ ...member, ...hours }] : [];
  });
  return (
    <>
      <SheetHeader className="relative shrink-0 border-b pr-20">
        <div className="flex min-w-0 items-center gap-3">
          <JobAvatar name={job.client} className="size-10 shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <SheetTitle>{jobName(job)}</SheetTitle>
              <JobStatusBadge status={status} />
            </div>
            <SheetDescription>
              {job.type} for {job.client}
            </SheetDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="More actions"
              className="absolute top-3 right-11"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={onHold}>
                {job.hold ? "Resume Job" : "Hold Job"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onEdit}>Edit Job</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                Delete Job
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SheetHeader>
      <Tabs
        value={tab}
        onValueChange={(value) => onTab(value as JobTab)}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="shrink-0 overflow-x-auto border-b px-3">
          <TabsList variant="line" aria-label="Job details">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="crew">
              Crew Days <span>{job.days.length}</span>
            </TabsTrigger>
            <TabsTrigger value="materials">
              Materials <span>{job.materials.length}</span>
            </TabsTrigger>
            <TabsTrigger value="history">
              History <span>{job.history.length}</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="min-h-0 overflow-auto">
          <div className="flex flex-col gap-3 p-4">
            {(job.hold || (status === "Late" && late > 0)) && (
              <Alert variant={job.hold ? "warning" : "destructive"}>
                <AlertTriangle />
                <AlertTitle>{job.hold || `${late} workdays past due`}</AlertTitle>
                <AlertDescription>
                  {job.days.filter((day) => day.state === "Planned").length} crew days remain
                  planned.
                </AlertDescription>
              </Alert>
            )}
            <DetailFrame title="Progress" description="Crew hours worked against the plan">
              <div className="mb-3 flex items-center gap-2">
                <Progress aria-label="Crew hours worked" value={workedPercent} />
                <span className="tabular-nums">{workedPercent}%</span>
              </div>
              <FactList
                facts={[
                  ["Worked", `${worked}h`],
                  ["Left", `${left}h`],
                  ["Start", jobDate(job.start, true)],
                  ["Finish", jobDate(finish, true)],
                  ["Due", jobDate(job.due, true)],
                  [
                    "Next crew day",
                    next ? `${jobDate(next.date, true)} · ${next.tasks[0]?.task ?? ""}` : "—",
                  ],
                ]}
              />
            </DetailFrame>
            <DetailFrame title="Client" description="Who to call and where the crew goes">
              <FactList
                facts={[
                  ["Name", job.client],
                  [
                    "Phone",
                    job.phone ? (
                      <a
                        className="hover:underline"
                        key="client-phone"
                        href={`tel:${job.phone.replace(/[^+\d]/g, "")}`}
                      >
                        {job.phone}
                      </a>
                    ) : (
                      "—"
                    ),
                  ],
                  ["Address", `${job.street}, ${job.town}`],
                ]}
              />
            </DetailFrame>
            <DetailFrame title="Site Notes" description="Read by the crew before the first day">
              <JobNotes key={job.id} notes={job.notes} onSave={onNotes} />
            </DetailFrame>
            <DetailFrame
              title="Inspections"
              description={
                job.inspections.length
                  ? "Planned inspections and sign-offs"
                  : "No inspection scheduled"
              }
            >
              {job.inspections.length ? (
                <ItemGroup>
                  {job.inspections.map((inspection) => (
                    <Item key={inspection.id} size="xs">
                      <ItemContent>
                        <ItemTitle>{inspection.name}</ItemTitle>
                        <ItemDescription>{jobDate(inspection.date, true)}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`${inspection.completed ? "Reopen" : "Complete"} ${inspection.name}`}
                          onClick={() => onInspection(inspection.id, !inspection.completed)}
                        >
                          {inspection.completed ? "Signed off" : "Sign Off"}
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No inspection is on this job’s schedule.
                </p>
              )}
            </DetailFrame>
          </div>
        </TabsContent>
        <TabsContent value="crew" className="min-h-0 overflow-auto">
          <div className="flex flex-col gap-3 p-4">
            <DetailFrame
              title="Crew"
              description={`${people.length} people · ${worked + left}h planned`}
            >
              {people.length ? (
                <ItemGroup>
                  {people.map((person) => (
                    <Item key={person.id} size="xs">
                      <ItemMedia>
                        <JobAvatar name={person.name} className="size-7" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{person.name}</ItemTitle>
                        <ItemDescription>
                          {person.role} · {person.done}h of {person.total}h
                        </ItemDescription>
                        <Progress
                          aria-label={`${person.name}, ${person.done}h of ${person.total}h worked`}
                          value={(100 * person.done) / person.total}
                        />
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>
              ) : (
                <p className="text-sm text-muted-foreground">No crew days are assigned.</p>
              )}
            </DetailFrame>
            <DetailFrame title="Crew Days" description={`${job.days.length} days`}>
              <ItemGroup>
                {job.days.map((day) => (
                  <Item key={day.date} size="xs" variant="outline" asChild>
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => onCrewDay(day.date)}
                      aria-label={`Edit ${jobDate(day.date, true)}, ${day.state}`}
                    >
                      <ItemContent>
                        <ItemTitle>{jobDate(day.date, true)}</ItemTitle>
                        <ItemDescription>
                          {day.state === "Lost"
                            ? day.reason
                            : day.tasks
                                .map(
                                  (task) =>
                                    `${task.task}, ${crewMember(task.crewId)?.name ?? task.crewId}`,
                                )
                                .join("; ")}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Badge variant={day.state === "Lost" ? "destructive-light" : "outline"}>
                          {taskHours(day)}h
                        </Badge>
                      </ItemActions>
                    </button>
                  </Item>
                ))}
              </ItemGroup>
            </DetailFrame>
          </div>
        </TabsContent>
        <TabsContent value="materials" className="min-h-0 overflow-auto">
          <div className="p-4">
            <DetailFrame
              title="Materials"
              description={`${received} of ${job.materials.length} delivered · ${orderTotal.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} ordered`}
            >
              {job.materials.length ? (
                <ItemGroup>
                  {job.materials.map((material) => (
                    <Item key={material.id} size="xs" variant="outline">
                      <ItemContent>
                        <ItemTitle>{material.name}</ItemTitle>
                        <ItemDescription>
                          {material.supplier}, {material.order}
                        </ItemDescription>
                        <p className="text-xs text-muted-foreground">
                          {material.arrives
                            ? `Arrives ${jobDate(material.arrives)}`
                            : "No delivery date"}{" "}
                          · Needed {jobDate(material.needed)}
                        </p>
                        {!material.arrives && (
                          <JobDateField
                            label={`Delivery date for ${material.name}`}
                            value=""
                            onChange={(arrives) => onMaterial(material.id, { arrives })}
                          />
                        )}
                      </ItemContent>
                      <ItemActions>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`${material.received ? "Mark unreceived" : "Mark received"}: ${material.name}`}
                          onClick={() => onMaterial(material.id, { received: !material.received })}
                        >
                          {material.received ? "Delivered" : "Received"}
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              ) : (
                <p className="text-sm text-muted-foreground">No materials are on order.</p>
              )}
            </DetailFrame>
          </div>
        </TabsContent>
        <TabsContent value="history" className="min-h-0 overflow-auto">
          <div className="p-4">
            <DetailFrame title="History" description="Changes to this job’s schedule">
              <Timeline value={job.history.length}>
                {job.history.map((event, index) => (
                  <TimelineItem key={event.id} step={index + 1}>
                    <TimelineIndicator />
                    <TimelineSeparator />
                    <TimelineTitle>{event.title}</TimelineTitle>
                    <TimelineContent>{event.detail}</TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </DetailFrame>
          </div>
        </TabsContent>
      </Tabs>
      <SheetFooter className="shrink-0 flex-row flex-wrap justify-end border-t bg-muted/30">
        <Button variant="outline" onClick={onSlide}>
          <CalendarClock data-icon="inline-start" />
          Slide
        </Button>
        <Button onClick={() => onCrewDay()}>
          <Plus data-icon="inline-start" />
          Add Crew Day
        </Button>
      </SheetFooter>
    </>
  );
}

function JobNotes({ notes, onSave }: { notes: string; onSave: (notes: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const id = useId();
  const editButton = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const interacted = useRef(false);
  const editing = draft !== null;

  useEffect(() => {
    if (!interacted.current) return;
    const target = editing ? input.current : editButton.current;
    target?.focus({ preventScroll: true });
  }, [editing]);

  if (draft === null) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {notes || "No notes yet: gate code, parking, pets."}
        </p>
        <Button
          ref={editButton}
          variant="outline"
          size="sm"
          onClick={() => {
            interacted.current = true;
            setDraft(notes);
          }}
        >
          {notes ? "Edit Notes" : "Add Notes"}
        </Button>
      </div>
    );
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft.trim());
        setDraft(null);
      }}
    >
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor={id}>Notes</FieldLabel>
          <Textarea
            ref={input}
            id={id}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" type="button" size="sm" onClick={() => setDraft(null)}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save Notes
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
