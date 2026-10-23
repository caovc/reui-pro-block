import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Layers,
  ShieldCheck,
  Sparkles,
  Zap,
  Globe2,
  Terminal,
  Bell,
  Search,
  CalendarDays,
  MessageSquare,
  Rocket,
  Star,
  CircleDot,
  FileCode2,
} from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

import { cn } from "@/lib/utils";
import { photos, Brand } from "./shared";

function JoinForm({ label = "Join the waitlist" }: { label?: string }) {
  const [joined, setJoined] = useState(false);
  return joined ? (
    <p
      className="flex items-center justify-center gap-2 rounded-lg border bg-background/10 px-5 py-3 text-sm"
      role="status"
    >
      <CheckCircle2 className="size-4" />
      You’re on the list. We’ll keep you in the loop.
    </p>
  ) : (
    <form
      className="flex max-w-md gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setJoined(true);
      }}
    >
      <Input aria-label="Work email address" required type="email" placeholder="Your work email" />
      <Button type="submit">
        {label}
        <ArrowRight data-icon="inline-end" />
      </Button>
    </form>
  );
}
function BuilderFaces() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {["AM", "JC", "TB", "SR", "EL"].map((t) => (
          <span
            key={t}
            className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-medium text-foreground"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="text-xs">
        <div className="mb-1 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className="size-2.5 fill-current" />
          ))}
        </div>
        <span className="opacity-65">Built with a thoughtful community</span>
      </div>
    </div>
  );
}
export function DemoConsole({
  initial = "Overview",
  kind = "revenue",
}: {
  initial?: string;
  kind?: string;
}) {
  const [view, setView] = useState(initial),
    [range, setRange] = useState("Week"),
    [selected, setSelected] = useState<string | null>(null);
  const views = ["Overview", "Activity", "People", "Security"];
  return (
    <div className="overflow-hidden rounded-xl border bg-background text-foreground shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <Brand label="ACME" />
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Search console"
            onClick={() =>
              setSelected("Search projects, teammates, and activity in this demo console.")
            }
          >
            <Search />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Console notifications"
            onClick={() => setSelected("You’re all caught up. Your workspace is running smoothly.")}
          >
            <Bell />
          </Button>
          <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[9px]">
            AM
          </span>
        </div>
      </div>
      <div className="flex">
        <div className="hidden w-36 shrink-0 flex-col gap-1 border-r p-3 sm:flex">
          <p className="mb-3 text-[10px] text-muted-foreground">WORKSPACE</p>
          {views.map((t, j) => (
            <Button
              variant={view === t ? "secondary" : "ghost"}
              size="sm"
              className="justify-start text-xs"
              key={t}
              onClick={() => setView(t)}
            >
              {j === 0 ? (
                <Layers data-icon="inline-start" />
              ) : j === 1 ? (
                <Zap data-icon="inline-start" />
              ) : j === 2 ? (
                <CircleDot data-icon="inline-start" />
              ) : (
                <ShieldCheck data-icon="inline-start" />
              )}
              {t}
            </Button>
          ))}
          <div className="mt-10 rounded-md border p-2.5 text-[10px] leading-4 text-muted-foreground">
            Everything in one place.
            <div className="mt-2 flex h-1 gap-0.5">
              <span className="w-2/3 rounded bg-foreground" />
              <span className="flex-1 rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">
                {view === "Overview"
                  ? kind === "security"
                    ? "Security overview"
                    : kind === "people"
                      ? "People & coverage"
                      : "Workspace overview"
                  : view}
              </h3>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                A clear view of what matters.
              </p>
            </div>
            <ToggleGroup
              type="single"
              value={range}
              onValueChange={(v) => v && setRange(v)}
              size="sm"
            >
              <ToggleGroupItem value="Week" className="text-[10px]">
                Week
              </ToggleGroupItem>
              <ToggleGroupItem value="Month" className="text-[10px]">
                Month
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(view === "Security" || kind === "security"
              ? [
                  ["Protected", "98.8%"],
                  ["Active alerts", "03"],
                  ["Resolved", "128"],
                ]
              : view === "People" || kind === "people"
                ? [
                    ["Team members", "48"],
                    ["Active now", "32"],
                    ["Coverage", "96%"],
                  ]
                : [
                    ["Revenue", range === "Week" ? "$24,800" : "$98,450"],
                    ["Active users", "2,840"],
                    ["Growth", "+18.6%"],
                  ]
            ).map(([a, b]) => (
              <div className="rounded-lg border p-3" key={a}>
                <p className="text-[9px] text-muted-foreground">{a}</p>
                <p className="mt-2 text-base font-semibold tracking-tight">{b}</p>
                <p className="mt-1 text-[9px] text-emerald-600">↗ 12.8% vs previous</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border p-3">
            <div className="mb-4 flex justify-between text-[10px]">
              <span className="font-medium">
                {view === "Activity" ? "Activity over time" : "Performance over time"}
              </span>
              <span className="text-muted-foreground">Current period</span>
            </div>
            <div className="flex h-28 items-end gap-1.5 border-b pb-1">
              {[28, 35, 32, 48, 41, 55, 47, 64, 58, 75, 61, 82, 71, 88, 78, 95, 81, 92].map(
                (n, j) => (
                  <button
                    title={`Period ${j + 1}: ${n}`}
                    aria-label={`Period ${j + 1}, ${n} events`}
                    key={j}
                    onClick={() => setSelected(`Period ${j + 1}: ${n} events recorded.`)}
                    style={{ height: `${range === "Week" ? n : 100 - n / 2}%` }}
                    className="min-w-0 flex-1 rounded-t-sm bg-primary/70 transition-all hover:bg-primary focus:bg-primary"
                  />
                ),
              )}
            </div>
            <div className="mt-2 flex justify-between text-[9px] text-muted-foreground">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
          <div className="mt-3 rounded-lg border">
            <div className="border-b px-3 py-2 text-[10px] font-medium">Recent activity</div>
            {["Design system update", "New workspace created", "Production deployment"].map(
              (t, j) => (
                <button
                  onClick={() =>
                    setSelected(`${t}: completed successfully. Updated ${j + 1} hours ago.`)
                  }
                  className="flex w-full items-center gap-2 border-b px-3 py-2 text-left text-[10px] last:border-0 hover:bg-muted/50"
                  key={t}
                >
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="flex-1">{t}</span>
                  <Badge variant="secondary" className="text-[8px]">
                    Complete
                  </Badge>
                  <ChevronRight className="size-3 text-muted-foreground" />
                </button>
              ),
            )}
          </div>
          {selected && (
            <div
              className="mt-3 flex items-center justify-between rounded-md bg-muted p-2 text-[10px]"
              role="status"
            >
              {selected}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelected(null)}
                aria-label="Dismiss console message"
              >
                ×
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function ActionDialog({
  open,
  onOpenChange,
  title = "Start your next chapter",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{done ? "You’re ready to get started." : title}</DialogTitle>
        </DialogHeader>
        {done ? (
          <>
            <p className="text-sm leading-6 text-muted-foreground">
              Your demo request is saved in this preview. Explore the blocks and copy the source to
              make it yours.
            </p>
            <Button onClick={() => onOpenChange(false)}>Keep exploring</Button>
          </>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="action-name">Your name</FieldLabel>
                <Input required id="action-name" placeholder="Alex Morgan" />
              </Field>
              <Field>
                <FieldLabel htmlFor="action-email">Work email</FieldLabel>
                <Input id="action-email" type="email" required placeholder="alex@company.com" />
              </Field>
            </FieldGroup>
            <Button type="submit">
              Continue
              <ArrowRight data-icon="inline-end" />
            </Button>
            <p className="text-xs text-muted-foreground">A local demo. No email will be sent.</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function Hero({ block }: BlockProps) {
  const i = block.index,
    [open, setOpen] = useState(false),
    [feature, setFeature] = useState("Overview"),
    [code, setCode] = useState(
      'import { createWorkspace } from "@acme/sdk";\n\nconst workspace = await createWorkspace({\n  name: "Something worth building",\n  theme: "considered",\n});\n\nawait workspace.deploy();',
    ),
    [copied, setCopied] = useState(false);
  const dark = [0, 2, 4].includes(i),
    center = [8, 9, 11, 12, 14].includes(i),
    email = [6, 7].includes(i),
    full = [8, 11, 13, 14].includes(i),
    noArt = i === 12;
  const headings = [
    "Clarity for every\nAI interaction.",
    "Your next big thing.\nA better foundation.",
    "Build with purpose.\nShip with confidence.",
    "A little more clarity.\nA lot more possibility.",
    "All your tools.\nOne considered space.",
    "Security that stays\none step ahead.",
    "Make room for\nwhat comes next.",
    "The next chapter\nstarts with you.",
    "A clear path from\nidea to product.",
    "From a thought\nto something real.",
    "Good ideas deserve\na better starting point.",
    "Everything you need.\nNothing in your way.",
    "Built by people\nwho care about craft.",
    "A considered foundation.\nAn extraordinary product.",
    "Less setup.\nMore possibility.",
    "Built to ship.\nMade to be yours.",
  ];
  const copy = (
    <div className={cn("flex flex-col gap-6", center && "items-center text-center")}>
      <Badge variant="outline" className={cn("self-start", center && "self-center")}>
        {i === 15 ? "A considered starting point" : "Your ideas. A better foundation."}
        <ChevronRight data-icon="inline-end" />
      </Badge>
      <h1 className="whitespace-pre-line text-4xl font-semibold leading-[1.06] tracking-[-.045em] sm:text-5xl">
        {headings[i]}
      </h1>
      <p className="max-w-lg text-sm leading-7 text-muted-foreground">
        Thoughtful components and complete product surfaces. Bring your vision, make it yours, and
        spend your time on what makes it different.
      </p>
      {email ? (
        <JoinForm />
      ) : i === 9 ? (
        <div className="w-full max-w-xl overflow-hidden rounded-xl border bg-background text-left text-foreground shadow-sm">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
            <span className="flex items-center gap-2 font-mono text-xs">
              <FileCode2 className="size-3" />
              script.ts
            </span>
            <div className="flex gap-2">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Copy script"
                onClick={async () => {
                  await navigator.clipboard.writeText(code);
                  setCopied(true);
                }}
              >
                {copied ? <Check /> : <Copy />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setCode(
                    'import { createWorkspace } from "@acme/sdk";\n\n// Your next idea starts here.\n',
                  )
                }
              >
                Reset
              </Button>
            </div>
          </div>
          <Textarea
            aria-label="Editable example script"
            className="min-h-52 rounded-none border-0 font-mono text-xs leading-6 shadow-none"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => setOpen(true)}>
            Start building
            <ArrowRight data-icon="inline-end" />
          </Button>
          {i !== 0 && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => setFeature(feature === "Overview" ? "Activity" : "Overview")}
            >
              Explore the details
            </Button>
          )}
        </div>
      )}
      {i === 15 && (
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-xs">
          {[
            "Responsive by default",
            "Accessible controls",
            "Editable source",
            "Theme-ready",
            "React + TypeScript",
            "Made to be adapted",
          ].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <Check className="size-3.5 text-emerald-500" />
              {t}
            </span>
          ))}
        </div>
      )}
      {[1, 9, 12].includes(i) && <BuilderFaces />}
      {[3, 10].includes(i) && (
        <ToggleGroup
          type="single"
          value={feature}
          onValueChange={(v) => v && setFeature(v)}
          className="flex-wrap justify-start"
        >
          {["Overview", "People", "Security"].map((f) => (
            <ToggleGroupItem value={f} key={f}>
              {f}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </div>
  );
  const art =
    i === 4 || i === 2 ? (
      <div className="grid min-h-96 grid-cols-3 content-center gap-4 p-8 [perspective:800px]">
        {[
          Layers,
          Code2,
          Globe2,
          ShieldCheck,
          Sparkles,
          Zap,
          Terminal,
          CalendarDays,
          MessageSquare,
        ].map((Icon, j) => (
          <button
            className="flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border bg-background/10 text-foreground shadow-sm transition-transform hover:-translate-y-2"
            key={j}
            onClick={() => setFeature(`Integration ${j + 1} connected`)}
          >
            <Icon className="size-7" />
            <span className="text-[10px] text-muted-foreground">
              {
                [
                  "Registry",
                  "Code",
                  "Deploy",
                  "Security",
                  "AI",
                  "Automation",
                  "CLI",
                  "Schedule",
                  "Team",
                ][j]
              }
            </span>
          </button>
        ))}
        <p className="col-span-3 text-center text-xs text-muted-foreground">
          {feature === "Overview" ? "Your workflow, connected." : feature}
        </p>
      </div>
    ) : i === 0 ? (
      <div className="flex min-h-96 flex-col justify-center rounded-xl border bg-muted/10 p-7">
        <div className="flex justify-between text-xs">
          <span>MODEL USAGE</span>
          <Badge variant="outline">Live</Badge>
        </div>
        <div className="mt-8 flex h-52 items-end gap-4">
          {[28, 42, 35, 65, 48, 90, 60].map((n, j) => (
            <button
              title={`${n}k tokens`}
              onClick={() => setFeature(`${n}k tokens · period ${j + 1}`)}
              key={j}
              className="relative flex-1 rounded-t-md bg-emerald-400/70 transition hover:bg-emerald-300"
              style={{ height: `${n}%` }}
            >
              {j === 5 && (
                <Badge className="absolute -top-8 left-1/2 -translate-x-1/2" variant="secondary">
                  Peak +42%
                </Badge>
              )}
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          {feature === "Overview" ? "6.4M tokens processed this week" : feature}
        </p>
      </div>
    ) : (
      <div
        className={cn(
          "relative rounded-2xl bg-muted p-4 sm:p-7",
          [1, 3, 5, 6, 8, 11, 13].includes(i) && "bg-cover bg-center",
        )}
        style={
          [1, 3, 5, 6, 8, 11, 13].includes(i)
            ? { backgroundImage: `url(${i === 5 ? photos.architecture : photos.coast})` }
            : undefined
        }
      >
        <DemoConsole
          key={feature}
          initial={
            ["Overview", "Activity", "People", "Security"].includes(feature) ? feature : "Overview"
          }
          kind={i === 5 ? "security" : i === 3 || i === 6 ? "people" : "revenue"}
        />
      </div>
    );
  return (
    <section className={cn("w-full p-6 sm:p-10", dark && "dark bg-background text-foreground")}>
      <div
        className={cn(
          "mx-auto max-w-6xl",
          center ? "flex flex-col gap-10" : "grid items-center gap-10 lg:grid-cols-2",
          full && "lg:grid-cols-1",
        )}
      >
        <div
          className={cn(
            i === 6 && "lg:order-2",
            i === 13 && "grid items-end gap-8 md:grid-cols-[1.3fr_1fr]",
          )}
        >
          {copy}
        </div>
        {!noArt && i !== 9 && art}
        {i === 14 && (
          <div className="grid border-t md:grid-cols-3">
            {[
              { icon: Layers, t: "A consistent foundation" },
              { icon: Zap, t: "Less setup, more momentum" },
              { icon: ShieldCheck, t: "Ready for the real world" },
            ].map((f) => (
              <button
                key={f.t}
                onClick={() => setFeature(f.t)}
                className="flex items-center gap-3 border-b px-5 py-6 text-left text-sm md:border-r"
              >
                <f.icon className="size-5" />
                {f.t}
                <ArrowUpRight className="ml-auto size-4" />
              </button>
            ))}
          </div>
        )}
      </div>
      <ActionDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}

export function CTA({ block }: BlockProps) {
  const i = block.index,
    [open, setOpen] = useState(false);
  const dark = [5, 7, 8, 11, 13, 15, 16].includes(i),
    split = [1, 6, 7, 10, 11, 12, 14, 15].includes(i),
    email = [0, 2, 13].includes(i);
  const titles = [
    "A little inspiration, once a week.",
    "Your next chapter starts here.",
    "Build something worth using.",
    "Good work starts with a better foundation.",
    "Make room for what’s next.",
    "From a good idea to a great product.",
    "A little clarity. A lot of momentum.",
    "A world of possibilities. One place to start.",
    "The next frontier is yours.",
    "From design to something real.",
    "Made for teams who care.",
    "A better starting point. A bigger possibility.",
    "Your tools, working together.",
    "Good things are on the way.",
    "Less friction. More forward.",
    "Let’s build something worth talking about.",
    "A little more care makes all the difference.",
  ];
  const button = (
    <div className="flex flex-wrap justify-center gap-3">
      <Button size="lg" onClick={() => setOpen(true)}>
        {i === 15
          ? "Contact us"
          : i === 6
            ? "Book a conversation"
            : i === 9
              ? "Open the handoff"
              : "Get started"}
        <ArrowRight data-icon="inline-end" />
      </Button>
      {[1, 3, 7, 9, 11, 15].includes(i) && (
        <Button size="lg" variant="outline" onClick={() => setOpen(true)}>
          {i === 15 ? "Book a call" : i === 9 ? "View the design" : "Explore the details"}
        </Button>
      )}
    </div>
  );
  return (
    <section className="w-full p-5 sm:p-9">
      <div
        className={cn(
          "relative mx-auto max-w-6xl overflow-hidden rounded-2xl border bg-muted/30 p-7 sm:p-12",
          dark && "dark bg-background text-foreground",
          i === 4 && "bg-gradient-to-br from-sky-500/10 via-background to-indigo-500/15",
          i === 10 && "bg-emerald-600/10",
          i === 14 && "bg-emerald-500/10",
        )}
      >
        <div
          className={cn(
            "relative grid items-center gap-10",
            split ? "lg:grid-cols-[1.2fr_1fr]" : "mx-auto max-w-2xl text-center",
          )}
        >
          <div className={cn("flex flex-col gap-6", !split && "items-center")}>
            {i === 16 && (
              <div className="flex size-12 items-center justify-center rounded-xl border bg-muted">
                <Layers className="size-6" />
              </div>
            )}
            {![4, 5, 15].includes(i) && (
              <Badge variant="outline" className="self-start">
                {i === 13
                  ? "A note from the studio"
                  : i === 12
                    ? "Everything, connected"
                    : "A thoughtful place to start"}
              </Badge>
            )}
            <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {titles[i]}
            </h2>
            {i !== 4 && (
              <p className="max-w-lg text-sm leading-7 text-muted-foreground">
                {i === 0
                  ? "Ideas, useful things, and a closer look at how good work gets made. No noise. Just something worth opening."
                  : "Thoughtful components, complete layouts, and room for your own ideas. Spend less time setting up and more time making something that matters."}
              </p>
            )}
            {email ? <JoinForm label={i === 13 ? "Join" : "Subscribe"} /> : button}
            {i === 0 || i === 9 ? (
              <BuilderFaces />
            ) : i === 16 ? (
              <div className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs">
                <Star className="size-3 fill-current" />
                4.9 / 5 from 248 thoughtful builders
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {i === 14
                  ? "Simple to start. Built to grow with you."
                  : "A clear foundation. Made to be yours."}
              </p>
            )}
          </div>
          {split && (
            <div>
              {i === 6 ? (
                <DemoConsole />
              ) : [7, 8, 11].includes(i) ? (
                <div className="relative mx-auto flex aspect-square max-w-xs items-center justify-center overflow-hidden rounded-full border border-foreground/10 bg-gradient-to-br from-sky-600/30 via-foreground/5 to-background shadow-[inset_-30px_-20px_60px_rgba(0,0,0,.5)]">
                  <Globe2 className="size-44 text-foreground/30" />
                  <span className="absolute bottom-9 text-[9px] tracking-[.3em] text-muted-foreground">
                    A WORLD OF POSSIBILITY
                  </span>
                </div>
              ) : i === 10 ? (
                <img
                  src={photos.architecture}
                  className="h-72 w-full rounded-xl object-cover"
                  alt="A new perspective"
                />
              ) : i === 12 ? (
                <div className="grid grid-cols-3 gap-4">
                  {[Code2, Layers, Zap, ShieldCheck, CalendarDays, Sparkles].map((Icon, j) => (
                    <div
                      className="flex aspect-square items-center justify-center rounded-xl border bg-background shadow-sm"
                      key={j}
                    >
                      <Icon className="size-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {[
                    "A consistent foundation",
                    "Thoughtful details, already considered",
                    "Room to make it your own",
                    ...(i === 14 ? ["Ready for what comes next"] : []),
                  ].map((s, j) => (
                    <div
                      key={s}
                      className="flex items-center gap-4 rounded-xl border bg-background/50 p-4"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-muted">
                        <Check className="size-4" />
                      </span>
                      <span className="text-sm">{s}</span>
                      <span className="ml-auto text-xs text-muted-foreground">0{j + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {[6, 10, 12].includes(i) && (
          <div className="mt-10 flex flex-wrap justify-center gap-8 border-t pt-6 text-sm font-semibold tracking-tight text-muted-foreground">
            {["Acme", "Layers", "Sisyphus", "Quotient", "Circooles"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        )}
      </div>
      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title={
          i === 15
            ? "Let’s talk about your project"
            : i === 6
              ? "Book a conversation"
              : "Your next chapter starts here"
        }
      />
    </section>
  );
}

export function HowItWorks({ block }: BlockProps) {
  const i = block.index,
    [step, setStep] = useState("0"),
    [open, setOpen] = useState(false);
  const steps = [
    {
      title: "Choose your foundation",
      text: "Start with a complete, considered surface. Find the one that fits the way your product works.",
      icon: Layers,
    },
    {
      title: "Make it your own",
      text: "Bring your content, your data, and your point of view. The details are yours to shape.",
      icon: Code2,
    },
    {
      title: "Connect the pieces",
      text: "Use shared tokens and components to keep every part of your product feeling like one.",
      icon: Zap,
    },
    {
      title: "Ship with confidence",
      text: "Responsive layouts and accessible controls, ready for the people who will use them.",
      icon: Rocket,
    },
    {
      title: "Keep making it better",
      text: "A foundation that grows with your product. Add, adapt, and refine as you learn.",
      icon: Sparkles,
    },
  ];
  const shown = steps.slice(0, i === 1 ? 4 : i === 2 ? 5 : i === 3 ? 4 : 3);
  return (
    <section className="mx-auto max-w-6xl p-6 sm:p-10">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">A clear path forward.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            From a good idea to something people can use.
          </p>
        </div>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Start building
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
      {i >= 3 ? (
        <div className={cn("grid gap-7", i === 4 && "md:grid-cols-[1fr_1.7fr]")}>
          <ToggleGroup
            type="single"
            value={step}
            onValueChange={(v) => v && setStep(v)}
            className={cn("items-stretch justify-start", i === 4 ? "flex-col" : "flex-wrap")}
          >
            {shown.map((s, j) => (
              <ToggleGroupItem
                value={String(j)}
                key={s.title}
                className="h-auto flex-1 justify-start gap-3 p-4 text-left"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border text-xs">
                  0{j + 1}
                </span>
                <span>
                  <span className="block text-sm font-medium">{s.title}</span>
                  {i === 4 && (
                    <span className="mt-2 block text-xs font-normal leading-5 text-muted-foreground">
                      {s.text}
                    </span>
                  )}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="rounded-xl bg-muted p-4 sm:p-7">
            <DemoConsole
              key={step}
              initial={["Overview", "People", "Activity", "Security"][Number(step)]}
            />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-px overflow-hidden rounded-xl border bg-border",
            i === 1
              ? "sm:grid-cols-2 lg:grid-cols-4"
              : i === 2
                ? "md:grid-cols-5"
                : "md:grid-cols-3",
          )}
        >
          {shown.map((s, j) => (
            <div
              key={s.title}
              className={cn("flex flex-col gap-5 bg-background p-6", i === 2 && "bg-emerald-500/5")}
            >
              <div
                className={cn(
                  "flex h-24 items-center justify-center rounded-lg border bg-muted/30",
                  i === 0 && "h-12 self-start border-0 bg-transparent",
                )}
              >
                <s.icon
                  className={cn("size-9", i === 0 && "size-6", i === 2 && "text-emerald-600")}
                />
              </div>
              <span className="text-xs text-muted-foreground">STEP 0{j + 1}</span>
              <h3 className="text-sm font-semibold">{s.title}</h3>
              <p className="text-xs leading-6 text-muted-foreground">{s.text}</p>
              {i === 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-auto"
                  onClick={() => setOpen(true)}
                >
                  Take a closer look
                  <ChevronRight data-icon="inline-end" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      <ActionDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}
