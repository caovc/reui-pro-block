/* eslint-disable react/only-export-components -- Fixture hydration is the public initializer for this detail view. */
import type { ReactNode } from "react";
import {
  Bot,
  Clock,
  FileText,
  Layers,
  MapPin,
  Route,
  RefreshCw,
  Trash2,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Item, ItemContent, ItemGroup } from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { MiniAvatar } from "./flow-gantt-avatars";
import type { Bar, Resource } from "./flow-gantt-timeline-data";
import "./flow-gantt-details.css";

export interface GanttDetailMetadata {
  address?: string;
  note?: string;
  jobType?: string;
  resourceRole?: string;
  status?: string;
  company?: string;
  stage?: string;
  priority?: string;
  load?: number;
  collaborators?: string[];
  description?: string;
  actor?: string;
  kind?: "Agent" | "Tool" | "Approval";
  slack?: string;
  sequence?: string;
  tokens?: string;
  cost?: string;
  owner?: string;
  alert?: { title: string; description: string; variant: "destructive" | "default" };
  tools?: { name: string; duration: string; status: string }[];
}
type DetailedBar = Bar & { details?: GanttDetailMetadata; collaborators?: string[] };
// Read-only fixture metadata transcribed from public preview UI, not Pro source.
// Hydrate once at initialization; later edits and duplicate spreads retain actual instance fields.
const detailFixtures: Record<number, Record<string, GanttDetailMetadata>> = {
  "1": {
    "job-0": {
      jobType: "Install",
      resourceRole: "HVAC Lead",
      address: "418 Wells St",
      note: "Two rooftop units, crane booked.",
    },
    "job-1": {
      jobType: "Repair",
      resourceRole: "HVAC Lead",
      address: "77 Vine Ave",
      note: "",
    },
    "job-2": {
      jobType: "Inspection",
      resourceRole: "HVAC Lead",
      address: "12 Rowan Ct",
      note: "",
    },
    "job-3": {
      jobType: "Repair",
      resourceRole: "HVAC Lead",
      address: "9 Cedar Rd",
      note: "",
    },
    "job-4": {
      jobType: "Repair",
      resourceRole: "Electrical",
      address: "233 Mill St",
      note: "",
    },
    "job-5": {
      jobType: "Emergency",
      resourceRole: "Electrical",
      address: "88 Halsey",
      note: "Squeezed in over the bakery call.",
    },
    "job-6": {
      jobType: "Install",
      resourceRole: "Electrical",
      address: "6 Ridgeway",
      note: "Customer confirmed window.",
      status: "Confirmed",
    },
    "job-7": {
      jobType: "Inspection",
      resourceRole: "Electrical",
      address: "51 Ash St",
      note: "",
    },
    "job-8": {
      jobType: "Repair",
      resourceRole: "Plumbing",
      address: "18 Bank St",
      note: "",
    },
    "job-9": {
      jobType: "Repair",
      resourceRole: "Plumbing",
      address: "204 Elm St",
      note: "",
    },
    "job-10": {
      jobType: "Install",
      resourceRole: "Plumbing",
      address: "88 Quarry Rd",
      note: "",
    },
    "job-11": {
      jobType: "Inspection",
      resourceRole: "Plumbing",
      address: "3 Bay View",
      note: "",
    },
    "job-12": {
      jobType: "Install",
      resourceRole: "HVAC",
      address: "140 Alder",
      note: "",
    },
    "job-13": {
      jobType: "Repair",
      resourceRole: "HVAC",
      address: "62 Hill Rd",
      note: "",
    },
    "job-14": {
      jobType: "Inspection",
      resourceRole: "HVAC",
      address: "1 Stonebridge",
      note: "",
    },
    "job-15": {
      jobType: "Emergency",
      resourceRole: "Electrical",
      address: "500 Grant Ave",
      note: "No power to the east wing.",
    },
    "job-16": {
      jobType: "Repair",
      resourceRole: "Electrical",
      address: "31 Bramble",
      note: "",
    },
    "job-17": {
      jobType: "Inspection",
      resourceRole: "Electrical",
      address: "24 Olive Ct",
      note: "",
    },
    "job-18": {
      jobType: "Repair",
      resourceRole: "Appliance",
      address: "70 Sunset Blvd",
      note: "",
    },
    "job-19": {
      jobType: "Install",
      resourceRole: "Appliance",
      address: "15 Pine Way",
      note: "",
    },
    "job-20": {
      jobType: "Repair",
      resourceRole: "Appliance",
      address: "5 Ivy Ln",
      note: "",
    },
    "job-21": {
      jobType: "Inspection",
      resourceRole: "Appliance",
      address: "31 Dunmore",
      note: "",
    },
    "job-22": {
      jobType: "Repair",
      resourceRole: "Appliance",
      address: "8 Ferry Rd",
      note: "",
    },
    "job-23": {
      jobType: "Inspection",
      resourceRole: "Appliance",
      address: "2 Northgate",
      note: "",
    },
    "job-24": {
      jobType: "Inspection",
      resourceRole: "Apprentice",
      address: "44 Willow",
      note: "",
    },
    "job-25": {
      jobType: "Repair",
      resourceRole: "Apprentice",
      address: "19 Ambrose",
      note: "",
    },
  },
  "2": {
    "intake-0": {
      description: "Reads the ticket and picks a refund path.",
      status: "Succeeded",
      actor: "Refund Resolver",
      kind: "Agent",
      slack: "0m of slack",
      tokens: "4.2k tokens",
      cost: "$0.021",
      note: "",
      tools: [
        {
          name: "orders.lookup",
          duration: "320ms",
          status: "Succeeded",
        },
        {
          name: "kb.search",
          duration: "410ms",
          status: "Succeeded",
        },
      ],
    },
    "policy-1": {
      description: "Scores the request against the refund policy.",
      status: "Succeeded",
      actor: "policies.refunds.check",
      kind: "Tool",
      slack: "0m of slack",
      tokens: "1.8k tokens",
      cost: "$0.009",
      note: "",
      tools: [
        {
          name: "policies.refunds.check",
          duration: "280ms",
          status: "Succeeded",
        },
      ],
    },
    "approval-2": {
      description: "A human signs off before money moves.",
      status: "Succeeded",
      actor: "Finance Approvals",
      kind: "Approval",
      slack: "0m of slack",
      tokens: "0 tokens",
      cost: "$0.000",
      owner: "Nora Vale",
      note: "Re-routed to the Ops Desk and signed off.",
      tools: [],
    },
    "approval-3": {
      description: "A human signs off before money moves.",
      status: "Failed",
      actor: "Finance Approvals",
      kind: "Approval",
      slack: "0m of slack",
      tokens: "0 tokens",
      cost: "$0.000",
      owner: "Nora Vale",
      alert: {
        title: "Approval expired",
        description:
          "Finance did not respond inside the 45 minute window, so the request was re-routed to the Ops Desk.",
        variant: "destructive",
      },
      note: "First request expired unanswered.",
      tools: [],
    },
    "capture-4": {
      description: "Captures the partial refund on the original card.",
      status: "Failed",
      actor: "payments.refunds.create",
      kind: "Tool",
      slack: "0m of slack",
      tokens: "900 tokens",
      cost: "$0.004",
      sequence: "Attempt 3 of 3",
      alert: {
        title: "Retry budget spent",
        description: "Attempt 3 of 3 failed. The stage needs a new payment method.",
        variant: "destructive",
      },
      note: "Three attempts in flight at once.",
      tools: [
        {
          name: "payments.refunds.create",
          duration: "30.0s",
          status: "Failed",
        },
        {
          name: "stripe.charges.list",
          duration: "640ms",
          status: "Succeeded",
        },
      ],
    },
    "capture-5": {
      description: "Captures the partial refund on the original card.",
      status: "Failed",
      actor: "payments.refunds.create",
      kind: "Tool",
      slack: "0m of slack",
      tokens: "900 tokens",
      cost: "$0.004",
      sequence: "Attempt 2 of 3",
      alert: {
        title: "Card declined",
        description: "Same issuer response. The backoff is shorter than the timeout.",
        variant: "destructive",
      },
      note: "Fired before attempt 1 timed out.",
      tools: [
        {
          name: "payments.refunds.create",
          duration: "30.0s",
          status: "Failed",
        },
      ],
    },
    "capture-6": {
      description: "Captures the partial refund on the original card.",
      status: "Failed",
      actor: "payments.refunds.create",
      kind: "Tool",
      slack: "0m of slack",
      tokens: "900 tokens",
      cost: "$0.004",
      sequence: "Attempt 1 of 3",
      alert: {
        title: "Card declined",
        description: "The issuer returned 402 card_declined on the original method.",
        variant: "destructive",
      },
      note: "",
      tools: [
        {
          name: "payments.refunds.create",
          duration: "30.0s",
          status: "Failed",
        },
      ],
    },
    "notify-7": {
      description: "Writes and sends the resolution email.",
      status: "Queued",
      actor: "Outreach Composer",
      kind: "Agent",
      slack: "Blocked behind a failure",
      tokens: "2.6k tokens",
      cost: "$0.013",
      note: "",
      tools: [
        {
          name: "sendgrid.mail.draft",
          duration: "510ms",
          status: "Succeeded",
        },
      ],
    },
    "fetch-8": {
      description: "Pulls the day's signed contracts from the archive.",
      status: "Succeeded",
      actor: "files.archive",
      kind: "Tool",
      slack: "30m of slack",
      tokens: "600 tokens",
      cost: "$0.003",
      note: "",
      tools: [
        {
          name: "files.archive",
          duration: "1.4s",
          status: "Succeeded",
        },
      ],
    },
    "parse-9": {
      description: "Splits the batch across three workers.",
      status: "Running",
      actor: "Contract Summarizer",
      kind: "Agent",
      slack: "30m of slack",
      tokens: "26.1k tokens",
      cost: "$0.131",
      sequence: "Shard 3 of 3",
      note: "The long tail shard holds the whole batch open.",
      tools: [
        {
          name: "postgres.query",
          duration: "1.2s",
          status: "Succeeded",
        },
      ],
    },
    "parse-10": {
      description: "Splits the batch across three workers.",
      status: "Succeeded",
      actor: "Contract Summarizer",
      kind: "Agent",
      slack: "30m of slack",
      tokens: "24.8k tokens",
      cost: "$0.124",
      sequence: "Shard 2 of 3",
      note: "",
      tools: [
        {
          name: "postgres.query",
          duration: "910ms",
          status: "Succeeded",
        },
      ],
    },
    "parse-11": {
      description: "Splits the batch across three workers.",
      status: "Succeeded",
      actor: "Contract Summarizer",
      kind: "Agent",
      slack: "30m of slack",
      tokens: "21.4k tokens",
      cost: "$0.107",
      sequence: "Shard 1 of 3",
      note: "",
      tools: [
        {
          name: "postgres.query",
          duration: "880ms",
          status: "Succeeded",
        },
      ],
    },
    "summarize-12": {
      description: "Writes one abstract per contract.",
      status: "Queued",
      actor: "Contract Summarizer",
      kind: "Agent",
      slack: "30m of slack",
      tokens: "18.4k tokens",
      cost: "$0.092",
      note: "",
      tools: [
        {
          name: "kb.search",
          duration: "430ms",
          status: "Succeeded",
        },
      ],
    },
    "risk-13": {
      description: "Safety reads every flagged clause.",
      status: "Queued",
      actor: "Safety Review",
      kind: "Approval",
      slack: "30m of slack",
      tokens: "0 tokens",
      cost: "$0.000",
      owner: "Leo Grant",
      note: "",
      tools: [],
    },
    "snapshot-14": {
      description: "Freezes a read copy before anything is rewritten.",
      status: "Succeeded",
      actor: "postgres.query",
      kind: "Tool",
      slack: "6h of slack",
      tokens: "300 tokens",
      cost: "$0.002",
      note: "",
      tools: [
        {
          name: "postgres.query",
          duration: "2.1s",
          status: "Succeeded",
        },
      ],
    },
    "dedupe-15": {
      description: "Merges duplicate accounts and backfills fields.",
      status: "Succeeded",
      actor: "Data Steward",
      kind: "Agent",
      slack: "6h of slack",
      tokens: "48.6k tokens",
      cost: "$0.243",
      note: "",
      tools: [
        {
          name: "crm.contacts.read",
          duration: "620ms",
          status: "Succeeded",
        },
        {
          name: "crm.contacts.update",
          duration: "740ms",
          status: "Succeeded",
        },
      ],
    },
    "purge-16": {
      description: "Deletes records past retention, inside the audited window.",
      status: "Waiting",
      actor: "db.purge",
      kind: "Tool",
      slack: "Fixed window",
      tokens: "0 tokens",
      cost: "$0.000",
      alert: {
        title: "Audited Window",
        description: "Fixed slot. The playbook still lands by 20:00.",
        variant: "default",
      },
      note: "Audited deletion window. The slot is fixed.",
      tools: [
        {
          name: "db.purge",
          duration: "4.8s",
          status: "Succeeded",
        },
      ],
    },
    "reindex-17": {
      description: "Rebuilds the vector index over what survived.",
      status: "Queued",
      actor: "embeddings.rebuild",
      kind: "Tool",
      slack: "3h of slack",
      tokens: "12.2k tokens",
      cost: "$0.061",
      note: "",
      tools: [
        {
          name: "embeddings.rebuild",
          duration: "6.1s",
          status: "Succeeded",
        },
      ],
    },
  },
  "3": {
    "booking-0": {
      priority: "High",
      company: "Northwind Retail",
      stage: "Discovery",
      status: "Confirmed",
      load: 60,
      collaborators: ["Sana Qureshi", "Nora Vale"],
      note: "Walkthrough of the guest checkout drop-off before the redesign starts.",
    },
    "booking-1": {
      priority: "Medium",
      company: "Internal",
      stage: "Design",
      status: "Confirmed",
      load: 30,
      collaborators: ["Nora Vale"],
      note: "Token pass and component parity ahead of the studio wide rollout.",
    },
    "booking-2": {
      priority: "High",
      company: "Kestrel Health",
      stage: "Design",
      status: "Confirmed",
      load: 70,
      collaborators: ["Mira Stone", "Theo Park"],
      note: "Three screen signup rebuild, pending clinical copy review.",
    },
    "booking-3": {
      priority: "High",
      company: "Kestrel Health",
      stage: "Build",
      status: "At Risk",
      load: 70,
      collaborators: ["Leo Grant", "Alex Johnson"],
      note: "Blocked on the payments vendor sandbox; escalated to the account lead.",
    },
    "booking-4": {
      priority: "Low",
      company: "Northwind Retail",
      stage: "Launch",
      status: "Tentative",
      load: 20,
      collaborators: ["Mira Stone"],
      note: "Post launch metrics readout, booked over an already full week.",
    },
    "booking-5": {
      priority: "Medium",
      company: "Northwind Retail",
      stage: "Launch",
      status: "Confirmed",
      load: 50,
      collaborators: ["Alex Johnson", "Priya Patel", "Theo Park"],
      note: "Staged rollout behind a flag, two regions per day.",
    },
    "booking-6": {
      priority: "Low",
      company: "Meridian Logistics",
      stage: "Build",
      status: "Tentative",
      load: 30,
      collaborators: ["Priya Patel"],
      note: "Scoped but unsigned; holding the slot until the contract lands.",
    },
    "booking-7": {
      priority: "Medium",
      company: "Meridian Logistics",
      stage: "Build",
      status: "Confirmed",
      load: 80,
      collaborators: ["Leo Grant"],
      note: "Nightly reconciliation job plus the backfill for the last two quarters.",
    },
    "booking-8": {
      priority: "Low",
      company: "Internal",
      stage: "Build",
      status: "Delivered",
      load: 60,
      collaborators: [],
      note: "Edge cache hit rate moved from 71 to 94 percent. Signed off.",
    },
    "booking-9": {
      priority: "High",
      company: "Northwind Retail",
      stage: "Discovery",
      status: "Confirmed",
      load: 60,
      collaborators: ["Devin Okoye", "Mira Stone"],
      note: "Twelve interviews across three tiers, then a willingness to pay model.",
    },
    "booking-10": {
      priority: "Medium",
      company: "Kestrel Health",
      stage: "Discovery",
      status: "Tentative",
      load: 50,
      collaborators: ["Sana Qureshi"],
      note: "Waiting on the anonymised export before the model can be fitted.",
    },
  },
};

export function hydrateGanttDetailFixtures(
  variant: number,
  data: { rows: Resource[]; bars: Bar[] },
): { rows: Resource[]; bars: Bar[] } {
  const fixtures = detailFixtures[variant];
  if (!fixtures) return data;
  const roles = new Map<string, string>();
  const bars = data.bars.map((bar): DetailedBar => {
    const details = fixtures[bar.id];
    if (!details) return bar;
    if (details.resourceRole) roles.set(bar.row, details.resourceRole);
    return {
      ...bar,
      details,
      ...(details.address !== undefined ? { address: details.address } : {}),
      ...(details.note !== undefined ? { note: details.note } : {}),
      ...(details.jobType !== undefined ? { jobType: details.jobType } : {}),
      ...(details.status !== undefined ? { status: details.status } : {}),
      ...(details.company !== undefined ? { company: details.company } : {}),
      ...(details.stage !== undefined ? { stage: details.stage } : {}),
      ...(details.priority !== undefined ? { priority: details.priority } : {}),
      ...(details.load !== undefined ? { load: details.load } : {}),
      ...(details.collaborators !== undefined ? { collaborators: [...details.collaborators] } : {}),
    };
  });
  return {
    rows: data.rows.map((row) => (roles.has(row.id) ? { ...row, role: roles.get(row.id) } : row)),
    bars,
  };
}

export interface GanttDetailsProps {
  variant: 1 | 2 | 3;
  bar: Bar;
  resource?: Resource;
  resources: Resource[];
  bars: Bar[];
  onEdit: () => void;
  onRerun: () => void;
  onDuplicate: () => void;
  onCancelBooking: () => void;
}

const duration = (minutes: number) => {
  const hours = Math.floor(minutes / 60),
    remainder = Math.round(minutes % 60);
  return (
    [hours ? `${hours}h` : "", remainder ? `${remainder}m` : ""].filter(Boolean).join(" ") || "0m"
  );
};
const clock = (minutes: number, twelveHour = false) => {
  const hour = Math.floor(minutes / 60),
    minute = String(Math.round(minutes % 60)).padStart(2, "0");
  return twelveHour
    ? `${hour % 12 || 12}:${minute} ${hour >= 12 ? "pm" : "am"}`
    : `${String(hour).padStart(2, "0")}:${minute}`;
};
const august = (offset: number) =>
  new Date(Date.UTC(2026, 7, 1 + offset)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
const dotColor = (status: string) =>
  status === "Failed"
    ? "#f43f5e"
    : status === "Running"
      ? "#0ea5e9"
      : status === "Succeeded"
        ? "#10b981"
        : status === "Waiting"
          ? "#f59e0b"
          : "#a1a1aa";

function DetailRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="fg-details-row">
      <span className="fg-details-row-icon">{icon}</span>
      <div className="fg-details-row-content">{children}</div>
    </div>
  );
}
function Secondary({ children }: { children: ReactNode }) {
  return <span className="fg-details-secondary">{children}</span>;
}
function Dot() {
  return <span className="fg-details-separator-dot" aria-hidden />;
}
function ExecutionStatus({ status }: { status: string }) {
  return (
    <Badge variant="outline" radius="full" className="fg-details-execution-status">
      <span className="fg-details-status-dot" style={{ background: dotColor(status) }} />
      {status}
    </Badge>
  );
}
function BookingField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fg-details-booking-field">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

export default function GanttDetails({
  variant,
  bar: value,
  resource,
  resources,
  bars,
  onEdit,
  onRerun,
  onDuplicate,
  onCancelBooking,
}: GanttDetailsProps) {
  const bar = value as DetailedBar;
  const detail = bar.details ?? detailFixtures[variant]?.[bar.id] ?? {};
  const person = resource ?? resources.find((row) => row.id === bar.row);
  const dependencyIds = bar.dependencies ?? (bar.dependency ? [bar.dependency] : []);
  const dependencies = dependencyIds
    .map((id) => bars.find((item) => item.id === id)?.title)
    .filter(Boolean);
  const note = bar.note ?? "";
  const collaborators = bar.collaborators ?? detail.collaborators ?? [];
  const peak =
    variant === 3
      ? Math.max(
          0,
          ...Array.from({ length: Math.max(0, Math.ceil(bar.end - bar.start)) }, (_, index) =>
            bars
              .filter(
                (item) =>
                  item.row === bar.row &&
                  item.start < bar.start + index + 1 &&
                  item.end > bar.start + index,
              )
              .reduce((sum, item) => sum + (item.load ?? 0), 0),
          ),
        )
      : 0;
  const over = Math.max(0, peak - (person?.capacity ?? 100));
  const booking = variant === 3;
  const description = booking
    ? (bar.company ?? "Internal")
    : variant === 1
      ? "Job details."
      : (detail.description ?? `${bar.title} execution details.`);
  return (
    <SheetContent
      onOpenAutoFocus={(event) => event.preventDefault()}
      showCloseButton={false}
      className={`fg-details fg-details-${booking ? "booking" : variant === 1 ? "job" : "execution"}`}
    >
      <div className="fg-details-header">
        {booking ? (
          <div className="fg-details-booking-heading">
            <div className="fg-details-title-line">
              <SheetTitle>{bar.title}</SheetTitle>
              <Badge
                variant={
                  bar.priority === "High"
                    ? "destructive-light"
                    : bar.priority === "Low"
                      ? "success-light"
                      : "warning-light"
                }
              >
                {bar.priority ?? "Medium"}
              </Badge>
            </div>
            <SheetDescription>{description}</SheetDescription>
          </div>
        ) : (
          <>
            <SheetTitle>{bar.title}</SheetTitle>
            <SheetDescription className="sr-only">{description}</SheetDescription>
            {variant === 2 ? (
              <ExecutionStatus status={bar.status} />
            ) : bar.status === "Confirmed" ? (
              <Badge variant="outline">Confirmed</Badge>
            ) : null}
            <div className="fg-details-spacer" />
          </>
        )}
        <SheetClose asChild>
          <Button variant="ghost" size="icon-sm" className="fg-details-close" aria-label="Close">
            <X />
            <span className="sr-only">Close</span>
          </Button>
        </SheetClose>
      </div>
      <div className="fg-details-scroll">
        <ScrollArea className="h-full">
          <div
            className={`fg-details-content ${booking ? "fg-details-booking-content" : variant === 2 ? "fg-details-execution-content" : ""}`}
          >
            {variant === 1 ? (
              <>
                <DetailRow icon={<Clock />}>
                  <span className="fg-details-number">
                    {clock(bar.start, true)} to {clock(bar.end, true)}
                  </span>
                  <Secondary>{duration(bar.end - bar.start)}</Secondary>
                </DetailRow>
                <DetailRow icon={<Wrench />}>
                  <span className="fg-details-job-dot" style={{ background: bar.color }} />
                  {bar.jobType ?? "Repair"}
                </DetailRow>
                <DetailRow icon={<Users />}>
                  <span className="fg-details-person">
                    <MiniAvatar name={person?.name ?? "Unassigned"} />
                    {person?.name ?? "Unassigned"}
                  </span>
                  {person?.role && (
                    <>
                      <Dot />
                      <Secondary>{person.role}</Secondary>
                    </>
                  )}
                </DetailRow>
                {bar.address && <DetailRow icon={<MapPin />}>{bar.address}</DetailRow>}
                {note && <DetailRow icon={<FileText />}>{note}</DetailRow>}
              </>
            ) : variant === 2 ? (
              <>
                <p className="fg-details-description">{description}</p>
                <div className="fg-details-fields">
                  <DetailRow icon={<Clock />}>
                    <span className="fg-details-number">
                      {clock(bar.start)} to {clock(bar.end)}
                    </span>
                    <Secondary>{duration(bar.end - bar.start)}</Secondary>
                  </DetailRow>
                  <DetailRow
                    icon={
                      detail.kind === "Agent" ? (
                        <Bot />
                      ) : detail.kind === "Approval" ? (
                        <Users />
                      ) : (
                        <Wrench />
                      )
                    }
                  >
                    <span>{detail.actor ?? person?.name ?? bar.title}</span>
                    <Dot />
                    <Secondary>{detail.kind ?? "Agent"}</Secondary>
                  </DetailRow>
                  <DetailRow icon={<Route />}>
                    <span>
                      {dependencies.length
                        ? `Waits for ${dependencies.join(", ")}`
                        : "Trigger stage"}
                    </span>
                    <Dot />
                    <Secondary>
                      {bar.locked
                        ? "Fixed window"
                        : (detail.slack ?? `${person?.slack ?? "0m"} of slack`)}
                    </Secondary>
                  </DetailRow>
                  {detail.owner && (
                    <DetailRow icon={<Users />}>
                      <span className="fg-details-person">
                        <MiniAvatar name={detail.owner} />
                        {detail.owner}
                      </span>
                      <Dot />
                      <Secondary>{detail.actor}</Secondary>
                    </DetailRow>
                  )}
                  {detail.sequence && <DetailRow icon={<Layers />}>{detail.sequence}</DetailRow>}
                  <DetailRow icon={<Zap />}>
                    <span className="fg-details-number">{detail.tokens ?? "0 tokens"}</span>
                    <Dot />
                    <Secondary>{detail.cost ?? "$0.000"}</Secondary>
                  </DetailRow>
                  {note && <DetailRow icon={<FileText />}>{note}</DetailRow>}
                </div>
                {detail.alert && (
                  <Alert variant={detail.alert.variant} className="fg-details-alert">
                    <AlertTitle>{detail.alert.title}</AlertTitle>
                    <AlertDescription>{detail.alert.description}</AlertDescription>
                  </Alert>
                )}
                {!!detail.tools?.length && (
                  <div className="fg-details-tools">
                    <p>Tool Calls</p>
                    <ItemGroup>
                      {detail.tools.map((tool, index) => (
                        <Item
                          variant="outline"
                          size="xs"
                          key={`${tool.name}-${index}`}
                          className="fg-details-tool"
                        >
                          <ItemContent>
                            <code>{tool.name}</code>
                          </ItemContent>
                          <Secondary>{tool.duration}</Secondary>
                          <Badge
                            size="default"
                            radius="full"
                            variant={
                              tool.status === "Failed" ? "destructive-light" : "success-light"
                            }
                          >
                            {tool.status}
                          </Badge>
                        </Item>
                      ))}
                    </ItemGroup>
                  </div>
                )}
              </>
            ) : (
              <>
                {over > 0 && (
                  <Alert variant="destructive" className="fg-details-capacity-alert">
                    <AlertTitle>Over Capacity</AlertTitle>
                    <AlertDescription>
                      {person?.name ?? "This resource"} is {over}% over this window.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="fg-details-booking-fields">
                  <BookingField label="Assignee">
                    <span className="fg-details-person">
                      <MiniAvatar name={person?.name ?? "Unassigned"} />
                      {person?.name ?? "Unassigned"}
                    </span>
                  </BookingField>
                  <BookingField label="Window">
                    {august(bar.start)} to {august(bar.end - 1)}
                  </BookingField>
                  <BookingField label="Workstream">{bar.stage ?? "Design"}</BookingField>
                  <BookingField label="Stage">
                    {bar.status === "To Do" ? "Tentative" : bar.status}
                  </BookingField>
                  <BookingField label="Load">{bar.load ?? 0}% of the week</BookingField>
                  <BookingField label="Collaborators">
                    {collaborators.join(", ") || "None"}
                  </BookingField>
                </div>
                {note && <p className="fg-details-booking-note">{note}</p>}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="fg-details-footer">
        {variant === 2 ? (
          <Button variant="outline" onClick={onRerun}>
            <RefreshCw />
            Re-run
          </Button>
        ) : (
          <Button variant="outline" size={booking ? "sm" : "default"} onClick={onCancelBooking}>
            <Trash2 />
            {booking ? "Cancel" : "Cancel Job"}
          </Button>
        )}
        <div className="fg-details-spacer" />
        {booking && (
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            Duplicate
          </Button>
        )}
        <Button size={booking ? "sm" : "default"} onClick={onEdit}>
          Edit
        </Button>
      </div>
    </SheetContent>
  );
}
