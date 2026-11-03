import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import {
  Plus,
  ShieldCheck,
  ChevronRight,
  MoreHorizontal,
  TriangleAlert,
  Trash2,
  CreditCard,
  CircleCheck,
  Landmark,
  Send,
  ShieldAlert,
  Clock,
  Info,
  Check,
  X,
  UserRoundCheck,
  LockKeyhole,
  Zap,
} from "lucide-react";
import { Button, Input, Panel, Status, ExportButton } from "./shared";
import { WorkflowGrid, type WorkflowField } from "./grid";
import { Choice, Person } from "./controls";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { IconTile } from "@/components/reui/icon-tile";
import { Frame, FrameHeader, FrameTitle, FramePanel } from "@/components/reui/frame";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Item, ItemContent, ItemTitle, ItemMedia, ItemDescription } from "@/components/ui/item";
import { Badge } from "@/components/reui/badge";
import {
  Timeline,
  TimelineItem,
  TimelineHeader,
  TimelineTitle,
  TimelineIndicator,
  TimelineSeparator,
  TimelineContent,
} from "@/components/reui/timeline";
import { toast } from "sonner";
import "./flux-approvals.css";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
type Request = {
  id: string;
  agent: string;
  tool: string;
  action: string;
  risk: string;
  status: string;
  age: string;
  sla: string;
  reviewer: string;
  amount?: string;
  order?: string;
};
const requests: Request[] = [
  {
    id: "APR-7421",
    agent: "Refund Resolver",
    tool: "stripe.refunds.create",
    action: "Issue $1,240 refund on ORD-99214",
    risk: "High",
    status: "Pending",
    age: "5h 8m",
    sla: "Breached 1h 8m",
    reviewer: "Maya Perez",
    amount: "$1,240.00",
    order: "ORD-99214",
  },
  {
    id: "APR-7415",
    agent: "Contract Summarizer",
    tool: "kb.search",
    action: "Share renewal summary with Globex",
    risk: "Low",
    status: "Approved",
    age: "1h 42m",
    sla: "Decided",
    reviewer: "Maya Perez",
  },
  {
    id: "APR-7429",
    agent: "Outreach Composer",
    tool: "sendgrid.mail.send",
    action: "Send bulk email to 2,480 EU customers",
    risk: "High",
    status: "Pending",
    age: "24m",
    sla: "36m left",
    reviewer: "Jonas Reed",
  },
  {
    id: "APR-7412",
    agent: "Refund Resolver",
    tool: "stripe.refunds.create",
    action: "Issue $2,150 refund on ORD-99102",
    risk: "High",
    status: "Rejected",
    age: "1h 58m",
    sla: "Decided",
    reviewer: "Jonas Reed",
    amount: "$2,150.00",
    order: "ORD-99102",
  },
  {
    id: "APR-7427",
    agent: "Data Steward",
    tool: "postgres.query",
    action: "Purge 1,290 stale lead records",
    risk: "High",
    status: "Pending",
    age: "31m",
    sla: "54m left",
    reviewer: "Jonas Reed",
  },
  {
    id: "APR-7428",
    agent: "Lead Enricher",
    tool: "postgres.query",
    action: "Backfill titles on 312 leads",
    risk: "Medium",
    status: "Pending",
    age: "46m",
    sla: "1h 36m left",
    reviewer: "Maya Perez",
  },
  {
    id: "APR-7430",
    agent: "Support Router",
    tool: "zendesk.tickets.update",
    action: "Reassign 42 escalated support tickets",
    risk: "Medium",
    status: "Pending",
    age: "18m",
    sla: "3h 42m left",
    reviewer: "Maya Perez",
  },
  {
    id: "APR-7431",
    agent: "Contract Reader",
    tool: "kb.search",
    action: "Publish the updated contract summary",
    risk: "Low",
    status: "Pending",
    age: "12m",
    sla: "3h 48m left",
    reviewer: "Maya Perez",
  },
];
function ApprovalSummaryInfo({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground -me-1.5 size-6 shrink-0 rounded-4xl [&_svg]:size-3"
          aria-label={`What ${title} shows`}
        >
          <Info />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

function keepApprovalRoute(event: MouseEvent<HTMLAnchorElement>) {
  // Keep informational anchors from replacing the hash-based preview route.
  event.preventDefault();
}

export function ApprovalInbox() {
  const [rows, setRows] = useState(requests);
  const [selected, setSelected] = useState<Request | null>(null);
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All risk tiers");
  const [status, setStatus] = useState("All statuses");
  const [overSla, setOverSla] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [focusedCoverage, setFocusedCoverage] = useState<string | null>(null);
  const pending = rows.filter((r) => r.status === "Pending").length;
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (r.action + " " + r.agent + " " + r.id).toLowerCase().includes(query.toLowerCase()) &&
          (risk === "All risk tiers" || r.risk === risk) &&
          (status === "All statuses" || r.status === status) &&
          (!overSla || r.sla.startsWith("Breached")),
      ),
    [rows, query, risk, status, overSla],
  );
  const fields: WorkflowField<Request>[] = [
    {
      key: "agent",
      title: "Agent",
      size: 180,
      render: (r) => (
        <button onClick={() => setSelected(r)} className="wf-text-button">
          <strong>{r.agent}</strong>
          <code className="wf-sub">{r.tool}</code>
        </button>
      ),
    },
    {
      key: "action",
      title: "Request",
      size: 270,
      render: (r) => (
        <button className="wf-text-button" onClick={() => setSelected(r)}>
          {r.action}
          <small className="wf-sub">
            {r.id}　{r.age}
          </small>
        </button>
      ),
    },
    { key: "risk", title: "Risk", size: 75, render: (r) => <Status>{r.risk}</Status> },
    {
      key: "sla",
      title: "SLA",
      size: 160,
      render: (r) => (
        <>
          <span className={r.sla.startsWith("Breached") ? "wf-danger" : ""}>{r.sla}</span>
          <small className="wf-sub">
            {r.sla === "Decided"
              ? "No live SLA"
              : r.sla.startsWith("Breached")
                ? "Past the 4h review SLA"
                : r.sla.includes("36m") || r.sla.includes("54m")
                  ? "Due within the hour"
                  : "Within 4h target"}
          </small>
        </>
      ),
    },
    { key: "status", title: "Status", size: 100, render: (r) => <Status>{r.status}</Status> },
    {
      key: "actions",
      title: "",
      size: 40,
      render: (r) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Review ${r.id}`}
          onClick={() => setSelected(r)}
        >
          <MoreHorizontal />
        </Button>
      ),
    },
  ];
  function decide(status: string) {
    if (!selected) return;
    setRows(rows.map((r) => (r.id === selected.id ? { ...selected, status, sla: "Decided" } : r)));
    setSelected(null);
  }
  return (
    <>
      <div className="wf-page-heading">
        <div>
          <h1>
            Approval Inbox <span className="wf-live">● Live</span>
          </h1>
          <p>
            {rows.length} requests　<span className="wf-amber-text">{pending} pending</span>　
            <span className="wf-danger">
              {rows.filter((r) => r.sla.startsWith("Breached")).length} over SLA
            </span>
          </p>
        </div>
        <div className="wf-inline">
          <ExportButton name="approvals" rows={rows} />
          <Button
            variant="outline"
            onClick={() => setSelected(rows.find((r) => r.status === "Pending") || null)}
          >
            <ShieldCheck />
            Review Next
          </Button>
          <Button
            onClick={() =>
              setSelected({
                id: `APR-${7432 + rows.length - 8}`,
                agent: "Refund Resolver",
                tool: "stripe.refunds.create",
                action: "",
                risk: "Medium",
                status: "Pending",
                age: "Just now",
                sla: "4h left",
                reviewer: "Maya Perez",
              })
            }
          >
            <Plus />
            New Request
          </Button>
        </div>
      </div>
      <div className="wf-grid wf-four wf-approval-kpis">
        {[
          ["Pending", pending, "3%", "Awaiting a decision"],
          [
            "Over SLA",
            rows.filter((r) => r.sla.startsWith("Breached")).length,
            "4%",
            "Past the 4h target",
          ],
          [
            "Approved Today",
            14 + rows.filter((r) => r.status === "Approved").length - 1,
            "9%",
            "Cleared since midnight",
          ],
          ["Median Decision", "1h 22m", "11%", "From request to decision"],
        ].map(([title, n, percent, sub]) => (
          <Panel key={String(title)} title={String(title)}>
            <strong className="wf-stat-value">{n}</strong>
            <span className="wf-change">↗ {percent}</span>
            <p className="wf-sub">{sub}</p>
          </Panel>
        ))}
      </div>
      <div className="wf-approval-layout wf-flux-approval-layout">
        <Panel
          title="Approval Queue"
          description={`${filtered.length} requests in this view`}
          className="wf-edge-table"
          action={
            <div className="wf-inline">
              <Button
                variant={overSla ? "secondary" : "outline"}
                size="sm"
                onClick={() => setOverSla(!overSla)}
              >
                <TriangleAlert />
                Over SLA
              </Button>
              <ExportButton name="approval-queue" rows={filtered} />
            </div>
          }
        >
          <div className="wf-table-controls">
            <Input
              aria-label="Search approvals"
              placeholder="Search requests…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Choice
              label="Risk filter"
              value={risk}
              onChange={setRisk}
              items={["All risk tiers", "High", "Medium", "Low"]}
            />
            <Choice
              label="Status filter"
              value={status}
              onChange={setStatus}
              items={["All statuses", "Pending", "Approved", "Rejected"]}
            />
          </div>
          <WorkflowGrid rows={filtered} fields={fields} pageSize={6} />
        </Panel>
        <div className="wf-approval-summary-grid grid min-w-0 grid-cols-1 items-stretch gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
          <Frame
            dense
            spacing="sm"
            className="wf-approval-summary h-full w-full min-w-0 text-base leading-6"
          >
            <FrameHeader className="flex-row items-center justify-between gap-3">
              <FrameTitle>Recent Decisions</FrameTitle>
              <ApprovalSummaryInfo title="Recent Decisions">
                The last requests to get a decision, newest first, with who made it and how long
                ago.
              </ApprovalSummaryInfo>
            </FrameHeader>
            <FramePanel className="flex flex-col">
              <Timeline value={0}>
                {[
                  ["APR-7415", "Renewal summary", "Approved", "Maya Perez", "1h ago"],
                  ["APR-7412", "$2,150 refund", "Rejected", "Jonas Reed", "1h 30m ago"],
                  ["APR-7409", "$42 credit", "Approved", "Maya Perez", "2h ago"],
                  ["APR-7404", "Lead purge held", "Rejected", "Jonas Reed", "2h 40m ago"],
                ].map(([id, name, status, owner, time], index) => (
                  <TimelineItem key={id} step={index + 1} className="last:pb-0">
                    <TimelineHeader>
                      <TimelineSeparator className="bg-border group-data-[orientation=vertical]/timeline:h-[calc(100%-1.25rem-0.5rem)] group-data-[orientation=vertical]/timeline:translate-y-5" />
                      <div className="flex flex-wrap items-center gap-2">
                        <TimelineTitle className="font-semibold">
                          <a
                            href="#/template-preview/flux"
                            onClick={keepApprovalRoute}
                            className="text-muted-foreground hover:text-primary me-1.5 font-medium tabular-nums underline-offset-2 transition-colors hover:underline"
                          >
                            {id}
                          </a>
                          <span>{name}</span>
                        </TimelineTitle>
                        <Badge
                          variant={status === "Approved" ? "success-light" : "destructive-light"}
                          className="rounded-4xl"
                        >
                          {status}
                        </Badge>
                      </div>
                      <TimelineIndicator
                        className={`flex size-5 items-center justify-center border-none ${
                          status === "Approved"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {status === "Approved" ? (
                          <Check className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                      </TimelineIndicator>
                    </TimelineHeader>
                    <TimelineContent className="mt-1.5">
                      <div className="wf-approval-owner text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
                        <Person name={owner} />
                        <span className="bg-input size-1 shrink-0 rounded-full" />
                        <span className="truncate">{time}</span>
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </FramePanel>
          </Frame>
          <Frame
            dense
            spacing="sm"
            className="wf-approval-summary h-full w-full min-w-0 text-base leading-6"
          >
            <FrameHeader className="flex-row items-center justify-between gap-3">
              <FrameTitle>Approval Policy</FrameTitle>
              <ApprovalSummaryInfo title="Approval Policy">
                The rules that decide whether a request needs a human at all, and which one.
              </ApprovalSummaryInfo>
            </FrameHeader>
            <FramePanel className="flex flex-col gap-4">
              {[
                {
                  title: "Auto-Approve Threshold",
                  description: "Low-risk actions run without a human reviewer.",
                  icon: CircleCheck,
                  color: "bg-emerald-600",
                },
                {
                  title: "Finance Second Approval",
                  description: "Refunds over $500 need a finance sign-off.",
                  icon: Landmark,
                  color: "bg-indigo-600",
                },
                {
                  title: "Bulk Send Cap",
                  description: "Sends above 2,000 recipients need review.",
                  icon: Send,
                  color: "bg-amber-600",
                },
                {
                  title: "Irreversible Action Hold",
                  description: "Deletes and purges pause for a human.",
                  icon: ShieldAlert,
                  color: "bg-rose-600",
                },
                {
                  title: "Review SLA",
                  description: "Every request gets a decision within 4 hours.",
                  icon: Clock,
                  color: "bg-sky-600",
                },
              ].map(({ title, description, icon: Icon, color }) => (
                <div className="flex items-start gap-2.5" key={title}>
                  <IconTile
                    variant="elevated"
                    className={`flex text-white [--icon-tile-radius:10px] ${color}`}
                    aria-hidden="true"
                  >
                    <Icon />
                  </IconTile>
                  <div className="min-w-0">
                    <a
                      href="#/template-preview/flux"
                      onClick={keepApprovalRoute}
                      className="text-foreground hover:text-primary text-sm leading-tight font-medium"
                    >
                      {title}
                    </a>
                    <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </FramePanel>
          </Frame>
          <Frame
            dense
            spacing="sm"
            className="wf-approval-summary h-full w-full min-w-0 text-base leading-6"
          >
            <FrameHeader className="flex-row items-center justify-between gap-3">
              <FrameTitle>Review Coverage</FrameTitle>
              <ApprovalSummaryInfo title="Review Coverage">
                Who is on each policy rule. Pick one to focus the queue on what it gates; a rule
                reading Unattended has nobody on it by design.
              </ApprovalSummaryInfo>
            </FrameHeader>
            <FramePanel className="grid grid-cols-2 content-start gap-2">
              {[
                {
                  title: "Ops Lead",
                  owner: "Maya Perez",
                  description: "Breached high-risk",
                  icon: UserRoundCheck,
                },
                {
                  title: "Finance Desk",
                  owner: "Finance",
                  description: "Refunds over $500",
                  icon: Landmark,
                },
                {
                  title: "Privacy Review",
                  owner: "Consent",
                  description: "EU bulk sends",
                  icon: LockKeyhole,
                },
                {
                  title: "Safety Review",
                  owner: "Jonas Reed",
                  description: "Destructive actions",
                  icon: ShieldCheck,
                },
                {
                  title: "Auto-Approve",
                  owner: "Unattended",
                  description: "Low-risk actions",
                  icon: Zap,
                },
                {
                  title: "SLA Escalation",
                  owner: "On-call",
                  description: "Past the 4h target",
                  icon: Clock,
                },
              ].map(({ title, owner, description, icon: Icon }) => (
                <Item
                  key={title}
                  asChild
                  variant="outline"
                  className={`flex h-full cursor-pointer flex-col items-stretch justify-between gap-4 rounded-2xl p-3 text-left hover:border-primary/30 ${
                    focusedCoverage === title ? "border-primary/40 bg-muted" : ""
                  }`}
                >
                  <button
                    type="button"
                    aria-label={`Focus ${title} coverage`}
                    aria-pressed={focusedCoverage === title}
                    onClick={() => {
                      setFocusedCoverage(title);
                      toast("Coverage focused", { description: `${title}: ${description}.` });
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <ItemContent className="min-w-0 gap-1">
                        <ItemTitle className="text-muted-foreground max-w-full truncate text-xs font-medium">
                          {title}
                        </ItemTitle>
                        <span className="text-foreground text-sm leading-tight font-medium">
                          {owner}
                        </span>
                      </ItemContent>
                      <ItemMedia className="mt-0.5 [&_svg]:size-4 [&_svg]:text-muted-foreground">
                        <Icon aria-hidden="true" />
                      </ItemMedia>
                    </div>
                    <ItemDescription className="text-xs leading-tight">
                      {description}
                    </ItemDescription>
                  </button>
                </Item>
              ))}
            </FramePanel>
          </Frame>
        </div>
      </div>
      <Sheet
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) setSelected(null);
        }}
      >
        <SheetContent
          className="wf-sheet wf-approval-sheet"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          {selected && (
            <>
              <div className="wf-sheet-heading">
                <IconTile className="wf-review-icon">
                  <CreditCard />
                </IconTile>
                <SheetTitle>{selected.action || "New request"}</SheetTitle>
                <SheetDescription>
                  {selected.agent} · {selected.id}
                </SheetDescription>
                <div className="wf-inline">
                  <Status>{selected.risk} risk</Status>
                  <Status>{selected.status}</Status>
                </div>
              </div>
              <div className="wf-form-fields">
                {selected.sla.startsWith("Breached") && (
                  <>
                    <div className="wf-review-alert">
                      <strong>SLA breached</strong>
                      <p>Requested at 04:52, now past the 4h review SLA.</p>
                    </div>
                    <div className="wf-review-alert amber">
                      <strong>Above the $500 finance threshold</strong>
                      <p>Refunds over $500 need a finance second approval.</p>
                    </div>
                  </>
                )}
                <section>
                  <h3>Payload</h3>
                  <div className="wf-payload">
                    <span>
                      {selected.amount ? "Amount" : "Action"}
                      <strong>{selected.amount || selected.action}</strong>
                    </span>
                    <span>
                      Order<strong>{selected.order || "—"}</strong>
                    </span>
                    <span>
                      Customer<strong>Acme Corp</strong>
                    </span>
                    <span>
                      SLA<strong>{selected.sla}</strong>
                    </span>
                  </div>
                </section>
                <h3>Request</h3>
                <label className="wf-review-field">
                  Action
                  <Input
                    required
                    value={selected.action}
                    onChange={(e) => setSelected({ ...selected, action: e.target.value })}
                  />
                </label>
                {(["agent", "tool", "risk", "status", "reviewer"] as const).map((key) => (
                  <label className="wf-review-field" key={key}>
                    {key[0].toUpperCase() + key.slice(1)}
                    <Choice
                      label={key}
                      value={selected[key]}
                      onChange={(v) => setSelected({ ...selected, [key]: v })}
                      items={
                        key === "agent"
                          ? Array.from(new Set(requests.map((r) => r.agent)))
                          : key === "tool"
                            ? Array.from(new Set(requests.map((r) => r.tool)))
                            : key === "risk"
                              ? ["High", "Medium", "Low"]
                              : key === "status"
                                ? ["Pending", "Approved", "Rejected"]
                                : ["Maya Perez", "Jonas Reed"]
                      }
                    />
                  </label>
                ))}
                <section>
                  <h3>Reported</h3>
                  <div className="wf-payload">
                    <span>
                      Request<strong>{selected.id}</strong>
                    </span>
                    <span>
                      Requested<strong>04:52</strong>
                    </span>
                    <span>
                      Age<strong>{selected.age}</strong>
                    </span>
                    <span>
                      Role<strong>Operations lead</strong>
                    </span>
                  </div>
                </section>
              </div>
              <footer className="wf-review-footer">
                <Button
                  variant="ghost"
                  className="wf-danger"
                  onClick={() => setDeleteId(selected.id)}
                >
                  <Trash2 />
                  Delete
                </Button>
                <Button variant="outline" onClick={() => decide("Rejected")}>
                  Reject
                </Button>
                <Button
                  disabled={!selected.action.trim()}
                  onClick={() => {
                    if (rows.some((r) => r.id === selected.id)) decide("Approved");
                    else {
                      setRows([selected, ...rows]);
                      setSelected(null);
                    }
                  }}
                >
                  {rows.some((r) => r.id === selected.id) ? "Approve" : "Create request"}
                  <ChevronRight />
                </Button>
              </footer>
            </>
          )}
        </SheetContent>
      </Sheet>
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => {
          if (!v) setDeleteId("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete request?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the request from this local approval queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setRows(rows.filter((r) => r.id !== deleteId));
                setSelected(null);
                setDeleteId("");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
