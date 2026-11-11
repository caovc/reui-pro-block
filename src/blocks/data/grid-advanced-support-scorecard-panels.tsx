import { useId, useState, type FormEvent } from "react";
import { Ellipsis } from "lucide-react";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { demoAvatar } from "@/lib/demo-artwork";
import {
  channels,
  formatMinutes,
  percent,
  queues,
  reviewScore,
  rubric,
  scorecard,
  shifts,
  type Agent,
  type AgentProfile,
  type CoachingNote,
} from "./grid-advanced-support-scorecard-model";

export function ScoreAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
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

export function ScoreSelect<T extends string>({
  label,
  value,
  items,
  onChange,
  id,
}: {
  label: string;
  value: T;
  items: readonly T[];
  onChange: (value: T) => void;
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={(value) => onChange(value as T)}>
      <SelectTrigger aria-label={label} id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function ScorecardBreakdown({ agent }: { agent: Agent }) {
  const facts = scorecard(agent);
  const fast = Math.floor(
    agent.solved * Math.min(0.83, (0.61 * 240) / Math.max(1, agent.resolutionMinutes)),
  );
  const moderate = Math.min(agent.solved - fast, Math.floor(agent.solved * 0.3));
  return (
    <div className="grid max-w-4xl grid-cols-3 gap-4 bg-muted/25 p-4">
      <ScorePanel title="QA" description={`Goal ${agent.goal}`}>
        <ScoreFacts
          rows={[
            ["This week", facts.currentWeek ?? "—"],
            ["Prior 4 weeks", facts.prior ?? "—"],
            ["Reviews", facts.reviewCount],
            ["Critical fails", facts.critical],
          ]}
        />
      </ScorePanel>
      <ScorePanel title="Tickets" description="Of solved">
        <ScoreFacts
          rows={[
            ["Escalated", `${agent.escalated} · ${percent(agent.escalated, agent.solved) ?? 0}%`],
            ["Solved under 4h", fast],
            ["Solved in 4h to 8h", moderate],
            ["Solved after 8h", agent.solved - fast - moderate],
          ]}
        />
      </ScorePanel>
      <ScorePanel title="Rubric" description="Weight">
        <ScoreFacts
          rows={facts.categoryScores.map((category) => [
            category.name === facts.weakest ? `${category.name} · weakest` : category.name,
            `${category.score ?? "—"} · ${category.weight}%`,
          ])}
        />
      </ScorePanel>
    </div>
  );
}

function ScorePanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
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

function ScoreFacts({ rows }: { rows: Array<[string, number | string]> }) {
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AgentEditor({
  agent,
  agents,
  onClose,
  onSave,
  restoreFocus,
}: {
  agent: Agent | null;
  agents: Agent[];
  onClose: () => void;
  onSave: (profile: AgentProfile) => void;
  restoreFocus: () => void;
}) {
  const id = useId();
  const [queue, setQueue] = useState<Agent["queue"]>(agent?.queue ?? "Billing");
  const [shift, setShift] = useState<Agent["shift"]>(agent?.shift ?? "Day");
  const [goal, setGoal] = useState(agent?.goal ?? 80);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();
    if (!name) {
      setError("Enter the agent’s full name.");
      return;
    }
    if (agents.some((other) => other.id !== agent?.id && other.email.toLowerCase() === email)) {
      setError("An agent with this work email already exists.");
      return;
    }
    onSave({ name, email, queue, shift, started: String(data.get("started")), goal });
  }
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full gap-0 sm:max-w-[480px]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
      >
        <SheetHeader className="border-b pr-12">
          <SheetTitle>{agent ? "Edit Agent" : "Add Agent"}</SheetTitle>
          <SheetDescription>Reviews and surveys match by work email.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <FieldGroup className="min-h-0 flex-1 gap-4 overflow-auto p-4">
            <Field>
              <FieldLabel htmlFor={`${id}-name`}>Full Name</FieldLabel>
              <Input
                id={`${id}-name`}
                name="name"
                defaultValue={agent?.name}
                placeholder="Full name"
                required
                maxLength={70}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-email`}>Work Email</FieldLabel>
              <Input
                id={`${id}-email`}
                name="email"
                type="email"
                defaultValue={agent?.email}
                placeholder="agent@support.example"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor={`${id}-queue`}>Queue</FieldLabel>
                <ScoreSelect
                  id={`${id}-queue`}
                  label="Queue"
                  value={queue}
                  items={queues}
                  onChange={setQueue}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-shift`}>Shift</FieldLabel>
                <ScoreSelect
                  id={`${id}-shift`}
                  label="Shift"
                  value={shift}
                  items={shifts}
                  onChange={setShift}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor={`${id}-started`}>Start Date</FieldLabel>
              <Input
                id={`${id}-started`}
                name="started"
                type="date"
                defaultValue={agent?.started ?? "2026-10-21"}
                required
              />
              <FieldDescription>Agents ramp for their first 90 days.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-goal`}>QA Goal</FieldLabel>
              <NumberField
                id={`${id}-goal`}
                value={goal}
                min={0}
                max={100}
                onValueChange={(value) => value !== null && setGoal(value)}
              >
                <NumberFieldGroup>
                  <NumberFieldDecrement aria-label="Decrease QA goal" />
                  <NumberFieldInput aria-label="QA Goal" />
                  <NumberFieldIncrement aria-label="Increase QA goal" />
                </NumberFieldGroup>
              </NumberField>
              <FieldDescription>85 tenured, 80 while ramping.</FieldDescription>
            </Field>
            {error && (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            )}
          </FieldGroup>
          <SheetFooter className="flex-row justify-end border-t bg-muted/30">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{agent ? "Save Changes" : "Add Agent"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function AgentDetails({
  agent,
  initialTab,
  onClose,
  restoreFocus,
  onEdit,
  onDelete,
  onCoaching,
  onNote,
}: {
  agent: Agent;
  initialTab: "overview" | "coaching";
  onClose: () => void;
  restoreFocus: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCoaching: (coaching: Agent["coaching"]) => void;
  onNote: (note: CoachingNote) => void;
}) {
  const id = useId();
  const facts = scorecard(agent);
  const [tab, setTab] = useState<string>(initialTab);
  const [period, setPeriod] = useState<"Last 4 weeks" | "This week">("Last 4 weeks");
  const [focus, setFocus] = useState(agent.coaching?.focus ?? facts.weakest);
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState(agent.coaching?.followUp ?? "2026-10-29");
  const byChannel = channels.map((channel) => {
    const reviewScores = agent.reviews
      .filter(
        (review) =>
          review.channel === channel &&
          (period === "This week" ? review.week === 0 : review.week < 4),
      )
      .map(reviewScore);
    return {
      channel,
      count: reviewScores.length,
      score: reviewScores.length
        ? Math.round(reviewScores.reduce((sum, value) => sum + value, 0) / reviewScores.length)
        : null,
    };
  });
  const weakestChannel = byChannel
    .filter((channel) => channel.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];
  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.trim()) return;
    onNote({ id: crypto.randomUUID(), focus, text: note.trim() });
    setNote("");
  }
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full gap-0 sm:max-w-[480px]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
      >
        <SheetHeader className="relative border-b pr-20">
          <div className="flex items-center gap-3">
            <ScoreAvatar name={agent.name} className="size-10" />
            <div className="min-w-0">
              <SheetTitle>{agent.name}</SheetTitle>
              <SheetDescription>
                {agent.queue} queue · {agent.shift} shift
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
                <DropdownMenuItem onSelect={onEdit}>Edit Agent</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  Delete Agent
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SheetHeader>
        <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
          <div className="shrink-0 border-b px-4">
            <TabsList variant="line">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews <span>{agent.reviews.length}</span>
              </TabsTrigger>
              <TabsTrigger value="coaching">
                Coaching <span>{agent.notes.length}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="min-h-0 space-y-3 overflow-auto p-4">
            <ScorePanel title="Scorecard" description="The last four weeks">
              <ScoreFacts
                rows={[
                  ["QA", facts.qa === null ? "Unscored" : `${facts.qa} · ${facts.band}`],
                  ["Goal", agent.goal],
                  ["Critical fails", facts.critical],
                  ["CSAT", facts.csat === null ? "—" : `${facts.csat}%`],
                  ["First reply · target 30m", formatMinutes(agent.replyMinutes)],
                  ["Resolution · target 8h", formatMinutes(agent.resolutionMinutes)],
                  ["SLA met", facts.sla === null ? "—" : `${facts.sla}%`],
                  ["Reopened", facts.reopen === null ? "—" : `${facts.reopen}%`],
                  ["Escalations", agent.escalated],
                ]}
              />
            </ScorePanel>
            <ScorePanel title="QA by Channel" description="Where the points are lost">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {weakestChannel
                    ? `${weakestChannel.channel} is the weakest channel`
                    : "No reviews in this period"}
                </p>
                <ScoreSelect
                  label="Period"
                  value={period}
                  items={["Last 4 weeks", "This week"]}
                  onChange={setPeriod}
                />
              </div>
              <ScoreFacts
                rows={byChannel.map((channel) => [
                  channel.channel,
                  `${channel.score ?? "—"} · ${channel.count} reviews`,
                ])}
              />
            </ScorePanel>
          </TabsContent>
          <TabsContent value="reviews" className="min-h-0 overflow-auto p-4">
            <ScorePanel title="Reviews" description="Rubric scores by ticket channel">
              {agent.reviews.length ? (
                <ul className="divide-y">
                  {agent.reviews.map((review) => (
                    <li
                      key={review.id}
                      className="flex items-center justify-between gap-2 py-2 text-xs"
                    >
                      <span className="capitalize">
                        {review.channel} · {review.id}
                      </span>
                      <div className="flex items-center gap-2">
                        {review.critical && (
                          <Badge variant="destructive-light">Critical fail</Badge>
                        )}
                        <Badge variant="outline">{reviewScore(review)}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No reviews yet.</p>
              )}
            </ScorePanel>
          </TabsContent>
          <TabsContent value="coaching" className="min-h-0 space-y-3 overflow-auto p-4">
            <ScorePanel
              title={agent.coaching ? "Coaching Plan" : "Start Coaching"}
              description={
                agent.coaching
                  ? `Follow-up: ${agent.coaching.followUp}`
                  : `Suggested focus: ${facts.weakest}`
              }
            >
              <FieldGroup className="gap-3">
                <Field>
                  <FieldLabel htmlFor={`${id}-focus`}>Focus</FieldLabel>
                  <ScoreSelect
                    id={`${id}-focus`}
                    label="Focus"
                    value={focus}
                    items={rubric.map((category) => category.name)}
                    onChange={setFocus}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${id}-followup`}>Follow-up</FieldLabel>
                  <Input
                    id={`${id}-followup`}
                    type="date"
                    value={followUp}
                    onChange={(event) => setFollowUp(event.target.value)}
                  />
                </Field>
                <Button disabled={!followUp} onClick={() => onCoaching({ focus, followUp })}>
                  {agent.coaching ? "Update Plan" : "Start Coaching"}
                </Button>
              </FieldGroup>
            </ScorePanel>
            <ScorePanel title="Log a Note" description="Kept on file, with or without a plan">
              <form onSubmit={saveNote}>
                <FieldGroup className="gap-3">
                  <Field>
                    <FieldLabel htmlFor={`${id}-note`}>Session Note</FieldLabel>
                    <Textarea
                      id={`${id}-note`}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="What you went through and what changes next."
                      required
                    />
                  </Field>
                  <Button type="submit" disabled={!note.trim()}>
                    Add Note
                  </Button>
                </FieldGroup>
              </form>
            </ScorePanel>
            <ScorePanel title="Notes" description="Session notes land here">
              {agent.notes.length ? (
                <ul className="divide-y">
                  {agent.notes.map((entry) => (
                    <li key={entry.id} className="py-2">
                      <p className="text-xs font-medium">{entry.focus}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{entry.text}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No notes yet.</p>
              )}
            </ScorePanel>
          </TabsContent>
        </Tabs>
        <SheetFooter className="flex-row flex-wrap items-center justify-end border-t bg-muted/30">
          {agent.coaching && (
            <Button variant="outline" onClick={() => onCoaching(null)}>
              End Coaching
            </Button>
          )}
          <Button variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button onClick={() => setTab("coaching")}>Log Note</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
