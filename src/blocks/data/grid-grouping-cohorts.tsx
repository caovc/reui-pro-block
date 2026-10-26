import {
  DataGridTableFootRow,
  DataGridTableFootRowCell,
} from "@/components/reui/data-grid/data-grid-table";
import { Badge } from "@/components/reui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";
import { useState } from "react";
import { DomainGroupedGrid } from "./grid-advanced-group-model";
import { domainTextMatches } from "./grid-advanced-model-grid";
import { Button, Choice, ExportRows, GridFrame, GridSearch } from "./grid-advanced-shared";
import { cn } from "./grid-advanced-utils";

type IntakeArea = "Clinical Fit" | "Coverage Fit" | "Visit Fit";
type Signal = {
  id: string;
  name: string;
  note: string;
  group: IntakeArea;
  answers: number;
  verified: number;
  booked: number;
  arrived: number;
  started: number;
  hold: number;
};
const metricKeys = ["verified", "booked", "arrived", "started", "hold"] as const;
type Metric = (typeof metricKeys)[number];
type Counts = Pick<Signal, "answers" | Metric>;
const metricLabels: Record<Metric, string> = {
  verified: "Verified",
  booked: "Booked",
  arrived: "Arrived",
  started: "Started",
  hold: "Hold",
};
const metricDescriptions: Record<Metric, string> = {
  verified: "Coverage cleared",
  booked: "Consultation booked",
  arrived: "Arrived for consultation",
  started: "Care started",
  hold: "Intake placed on hold",
};

// Numeric fixtures transcribed from the public rendered preview, never paid source.
const orthopedic: Signal[] = [
  {
    id: "Q1",
    name: "Needs care this week",
    note: "Acute pain and mobility limits",
    group: "Clinical Fit",
    answers: 642,
    verified: 548,
    booked: 392,
    arrived: 328,
    started: 284,
    hold: 39,
  },
  {
    id: "Q2",
    name: "Imaging is ready",
    note: "X-ray or MRI attached",
    group: "Clinical Fit",
    answers: 639,
    verified: 512,
    booked: 376,
    arrived: 310,
    started: 268,
    hold: 56,
  },
  {
    id: "Q4",
    name: "Plan matches network",
    note: "Payer accepted at main campus",
    group: "Coverage Fit",
    answers: 640,
    verified: 502,
    booked: 354,
    arrived: 279,
    started: 240,
    hold: 68,
  },
  {
    id: "Q3",
    name: "Prior auth status",
    note: "Authorization known at intake",
    group: "Coverage Fit",
    answers: 631,
    verified: 476,
    booked: 318,
    arrived: 246,
    started: 209,
    hold: 92,
  },
  {
    id: "Q6",
    name: "Morning slot works",
    note: "Preferred window before noon",
    group: "Visit Fit",
    answers: 622,
    verified: 465,
    booked: 331,
    arrived: 274,
    started: 235,
    hold: 51,
  },
  {
    id: "Q5",
    name: "Travel under 40 miles",
    note: "Patient can reach first slot",
    group: "Visit Fit",
    answers: 618,
    verified: 421,
    booked: 288,
    arrived: 236,
    started: 203,
    hold: 77,
  },
  {
    id: "Q7",
    name: "Caregiver available",
    note: "Ride and recovery support confirmed",
    group: "Visit Fit",
    answers: 604,
    verified: 398,
    booked: 281,
    arrived: 231,
    started: 196,
    hold: 83,
  },
  {
    id: "Q8",
    name: "Language need set",
    note: "Interpreter requirement captured",
    group: "Visit Fit",
    answers: 589,
    verified: 438,
    booked: 302,
    arrived: 252,
    started: 214,
    hold: 46,
  },
];
const cardiology: Signal[] = [
  {
    id: "Q1",
    name: "Symptoms under review",
    note: "Chest pain or rhythm concern",
    group: "Clinical Fit",
    answers: 524,
    verified: 451,
    booked: 337,
    arrived: 291,
    started: 244,
    hold: 31,
  },
  {
    id: "Q2",
    name: "Referral order exists",
    note: "Provider order received",
    group: "Clinical Fit",
    answers: 521,
    verified: 438,
    booked: 315,
    arrived: 262,
    started: 226,
    hold: 48,
  },
  {
    id: "Q3",
    name: "Benefits verified",
    note: "Eligibility matched before booking",
    group: "Coverage Fit",
    answers: 518,
    verified: 426,
    booked: 302,
    arrived: 250,
    started: 212,
    hold: 64,
  },
  {
    id: "Q4",
    name: "Cost share accepted",
    note: "Copay estimate acknowledged",
    group: "Coverage Fit",
    answers: 512,
    verified: 374,
    booked: 252,
    arrived: 203,
    started: 171,
    hold: 82,
  },
  {
    id: "Q5",
    name: "Device data ready",
    note: "Wearable or monitor export shared",
    group: "Visit Fit",
    answers: 506,
    verified: 385,
    booked: 271,
    arrived: 224,
    started: 188,
    hold: 59,
  },
  {
    id: "Q6",
    name: "48-hour slot fit",
    note: "Fast-track appointment accepted",
    group: "Visit Fit",
    answers: 498,
    verified: 352,
    booked: 284,
    arrived: 240,
    started: 199,
    hold: 45,
  },
  {
    id: "Q7",
    name: "Transport confirmed",
    note: "Ride option recorded",
    group: "Visit Fit",
    answers: 487,
    verified: 319,
    booked: 214,
    arrived: 174,
    started: 139,
    hold: 76,
  },
];
const groupDescriptions: Record<string, string> = {
  "Clinical Fit": "Need, referral, and record readiness",
  "Coverage Fit": "Plan match and prior authorization",
  "Visit Fit": "Slot, travel, caregiver, and language fit",
  "Strong booking": "55%+ booked",
  "Moderate booking": "35 to 54% booked",
  "Low booking": "Under 35% booked",
  "High hold risk": "14%+ held",
  "Watch list": "10 to 13% held",
  "Low hold risk": "Under 10% held",
};
function percent(counts: Counts, metric: Metric) {
  return counts.answers ? Math.round((counts[metric] / counts.answers) * 100) : 0;
}
function sumSignals(rows: Signal[]): Counts {
  return rows.reduce<Counts>(
    (total, row) => ({
      answers: total.answers + row.answers,
      verified: total.verified + row.verified,
      booked: total.booked + row.booked,
      arrived: total.arrived + row.arrived,
      started: total.started + row.started,
      hold: total.hold + row.hold,
    }),
    { answers: 0, verified: 0, booked: 0, arrived: 0, started: 0, hold: 0 },
  );
}
function heatClass(metric: Metric, rate: number) {
  if (metric === "hold") {
    return rate >= 14
      ? "bg-red-200 text-red-600 dark:bg-red-950 dark:text-red-200"
      : rate >= 10
        ? "bg-red-100 text-red-600 dark:bg-red-950/70 dark:text-red-200"
        : "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-200";
  }
  return cn(
    "text-emerald-800 dark:text-emerald-100",
    rate >= 65
      ? "bg-emerald-300 dark:bg-emerald-800"
      : rate >= 55
        ? "bg-emerald-200 dark:bg-emerald-900"
        : rate >= 35
          ? "bg-emerald-100 dark:bg-emerald-950"
          : "bg-emerald-50 dark:bg-emerald-950/60",
  );
}
function HeatCell({
  counts,
  metric,
  name,
  cohort,
}: {
  counts: Counts;
  metric: Metric;
  name: string;
  cohort: Counts;
}) {
  const rate = percent(counts, metric);
  const cohortRate = percent(cohort, metric);
  const delta = rate - cohortRate;
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          tabIndex={0}
          aria-label={`${name}, ${metricLabels[metric]}: ${counts[metric].toLocaleString()} of ${counts.answers.toLocaleString()} answers, ${rate}%`}
          data-cohort-heat={metric}
          className={cn(
            "absolute inset-0 flex cursor-help items-center justify-between gap-2 px-2.5 text-xs font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            heatClass(metric, rate),
          )}
        >
          <span>{counts[metric].toLocaleString()}</span>
          <span className="opacity-80">{rate}%</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 space-y-3 p-3" side="top" align="center">
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{metricDescriptions[metric]}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{metricLabels[metric]}</span>
          <strong className="text-xl tabular-nums">{rate}%</strong>
        </div>
        <div className="flex justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            {counts[metric].toLocaleString()} of {counts.answers.toLocaleString()} answers
          </span>
          <span className="font-medium tabular-nums">
            {delta > 0 ? "+" : ""}
            {delta} pts
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-muted">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-foreground/70"
            style={{ width: `${rate}%` }}
          />
          <span
            className="absolute -top-1 h-4 w-px bg-foreground"
            style={{ left: `${cohortRate}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">Cohort average {cohortRate}%</p>
      </HoverCardContent>
    </HoverCard>
  );
}

export default function Cohorts() {
  const [tab, setTab] = useState("Intake area");
  const [cohort, setCohort] = useState("Orthopedic Recall");
  const [risk, setRisk] = useState("All hold risk");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState(true);
  const [collapsed, setCollapsed] = useState<string[]>(["Visit Fit"]);
  const records = cohort === "Orthopedic Recall" ? orthopedic : cardiology;
  const matchesRisk = (row: Signal) =>
    risk === "All hold risk" || percent(row, "hold") >= (risk === "Hold over 14%" ? 14 : 10);
  const filtered = records.filter((row) => domainTextMatches(row, query) && matchesRisk(row));
  const cohortTotal = sumSignals(records);
  const total = sumSignals(filtered);
  const groupNames =
    tab === "Intake area"
      ? ["Clinical Fit", "Coverage Fit", "Visit Fit"]
      : tab === "Booking strength"
        ? ["Strong booking", "Moderate booking", "Low booking"]
        : ["High hold risk", "Watch list", "Low hold risk"];
  function groupFor(row: Signal) {
    if (tab === "Intake area") return row.group;
    if (tab === "Booking strength") {
      const rate = percent(row, "booked");
      return rate >= 55 ? "Strong booking" : rate >= 35 ? "Moderate booking" : "Low booking";
    }
    const rate = percent(row, "hold");
    return rate >= 14 ? "High hold risk" : rate >= 10 ? "Watch list" : "Low hold risk";
  }
  const groups = groupNames
    .map((name) => ({
      id: name,
      title: name,
      description: groupDescriptions[name],
      children: records.filter((row) => groupFor(row) === name),
    }))
    .filter((group) => group.children.length > 0);
  return (
    <GridFrame
      className="mt-8 max-sm:mt-12 max-sm:w-[calc(100%-72px)] [&_header]:min-h-16 [&_header]:border-b-0 [&_header]:py-3 [&_header_p]:text-sm [&_header_p]:leading-5 max-sm:[&_header>div:first-child]:w-full max-sm:[&_header>div:first-child]:min-w-0"
      title="Access Cohort"
      description={
        cohort === "Orthopedic Recall"
          ? "AI intake for joint replacement consults"
          : "Referral triage for high-intent heart care"
      }
      summary={
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            Answers <Badge variant="secondary">{total.answers.toLocaleString()}</Badge>
          </span>
          <span className="flex items-center gap-2 border-l pl-3">
            Hold Risk <Badge variant="destructive-light">{total.hold.toLocaleString()}</Badge>
          </span>
          <span className="hidden border-l pl-3 sm:inline">Exported 24 Jun 2026</span>
        </div>
      }
      actions={<ExportRows name="access-cohort" rows={filtered} />}
    >
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value);
          setCollapsed([]);
        }}
        className="gap-0"
      >
        <div className="overflow-x-auto border-y px-4">
          <TabsList variant="line" aria-label="Group intake signals" className="h-10! gap-5 p-0">
            {["Intake area", "Booking strength", "Hold risk"].map((name) => (
              <TabsTrigger
                key={name}
                value={name}
                className="h-10! rounded-none px-0 text-sm after:bottom-0! focus-visible:-outline-offset-1 focus-visible:ring-inset"
              >
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2 max-sm:[&>[data-slot=select-trigger]]:w-full max-sm:[&>div:has(input)]:basis-full sm:[&>div:has(input)]:max-w-52">
        <Choice
          label="Patient cohort"
          value={cohort}
          onChange={setCohort}
          options={["Orthopedic Recall", "Cardiology Priority"]}
          className="w-44"
        />
        <Choice
          label="Hold risk filter"
          value={risk}
          onChange={setRisk}
          options={["All hold risk", "Hold over 10%", "Hold over 14%"]}
          className="w-40"
        />
        <GridSearch value={query} onChange={setQuery} placeholder="Search signals" />
        <div className="flex items-center gap-2 max-sm:w-full max-sm:pt-1 sm:ml-auto">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            Notes{" "}
            <Switch checked={notes} onCheckedChange={setNotes} aria-label="Show signal notes" />
          </label>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setCollapsed(collapsed.length ? [] : groups.map((group) => group.id))}
          >
            {collapsed.length ? "Expand" : "Collapse"}
          </Button>
        </div>
      </div>
      <DomainGroupedGrid
        groups={groups}
        getId={(row) => row.id}
        search={query}
        filter={matchesRisk}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        className={cn(
          "[&_td]:border-r [&_td:last-child]:border-r-0 [&_th]:border-r [&_th:last-child]:border-r-0 [&_tbody_tr]:h-11 [&_tbody_td]:p-0 [&_thead_th]:h-8 [&_thead_th]:py-0 [&_thead_th:first-child]:px-4 [&_thead_th:not(:first-child)>div]:justify-end [&_tr[data-row-id^='group:']_td:first-child]:px-4 [&_tr[data-row-id^='group:']_td:first-child>button]:w-full [&_tr[data-row-id^='group:']_td:first-child>button]:min-w-0",
          notes ? "[&_tr:has([data-cohort-signal])]:h-14" : "[&_tr:has([data-cohort-signal])]:h-10",
        )}
        renderGroup={(group) => (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <Activity className="size-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0 font-semibold">{group.title}</span>
            <span className="min-w-0 flex-1 truncate text-xs font-normal text-muted-foreground max-sm:hidden">
              {group.description}
            </span>
            <Badge variant="outline" size="sm">
              {group.children.filter((row) => filtered.includes(row)).length}
            </Badge>
          </span>
        )}
        groupValue={(group, key) => {
          const counts = sumSignals(group.children.filter((row) => filtered.includes(row)));
          return key === "answers" ? (
            <span className="block px-2.5 text-right text-sm font-medium tabular-nums">
              {counts.answers.toLocaleString()}
            </span>
          ) : metricKeys.includes(key as Metric) ? (
            <HeatCell
              counts={counts}
              metric={key as Metric}
              name={group.title}
              cohort={cohortTotal}
            />
          ) : null;
        }}
        fields={[
          {
            id: "name",
            title: "Intake Signal",
            value: (row) => row.name,
            size: 310,
            render: (row) => (
              <div
                data-cohort-signal={row.id}
                className="flex min-w-0 items-center gap-3 px-4 py-1 pl-12"
              >
                <Badge variant="outline" size="sm">
                  {row.id}
                </Badge>
                <div className="min-w-0">
                  <span className="block truncate font-medium">{row.name}</span>
                  {notes && (
                    <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                      {row.note}
                    </span>
                  )}
                </div>
              </div>
            ),
          },
          {
            id: "answers",
            title: "Answers",
            value: (row) => row.answers,
            size: 134,
            className: "relative text-right tabular-nums",
            render: (row) => <span className="block px-2.5">{row.answers.toLocaleString()}</span>,
          },
          ...metricKeys.map((metric) => ({
            id: metric,
            title: metricLabels[metric],
            value: (row: Signal) => row[metric],
            size: 152,
            className: "relative p-0",
            render: (row: Signal) => (
              <HeatCell counts={row} metric={metric} name={row.name} cohort={cohortTotal} />
            ),
          })),
        ]}
        footer={
          <DataGridTableFootRow>
            <DataGridTableFootRowCell className="px-2!">
              Visible Signals{" "}
              <Badge variant="outline" size="sm" className="ml-1">
                {filtered.length}
              </Badge>
            </DataGridTableFootRowCell>
            <DataGridTableFootRowCell className="px-2.5! text-right tabular-nums">
              {total.answers.toLocaleString()}
            </DataGridTableFootRowCell>
            {metricKeys.map((metric) => (
              <DataGridTableFootRowCell
                key={metric}
                className={cn(
                  "px-2.5! text-right tabular-nums",
                  metric === "hold" && "text-red-600 dark:text-red-300",
                )}
              >
                {total[metric].toLocaleString()} / {percent(total, metric)}%
              </DataGridTableFootRowCell>
            ))}
          </DataGridTableFootRow>
        }
      />
    </GridFrame>
  );
}
