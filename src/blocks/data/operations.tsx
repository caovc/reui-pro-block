import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  GitBranch,
  GripVertical,
  Play,
  RefreshCw,
  Shield,
  Terminal,
  X,
} from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { AddButton, BlockHeading, Metric, Person, Status } from "./shared";
import { downloadCsv, people } from "./data-utils";
import ChartBlock from "./charts";
import GridBlock from "./grid";

export function OpsBlock({ block }: BlockProps) {
  const cron = block.category === "dev-ops" && block.index === 0;
  const firewall = block.category === "dev-ops" && block.index === 3;
  const deploy = block.category === "dev-ops" && block.index === 2;
  const [tab, setTab] = useState("Overview");
  const [enabled, setEnabled] = useState<Record<number, boolean>>({});
  const [active, setActive] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  const [cronValue, setCronValue] = useState("*/15 * * * *");
  const [testIP, setTestIP] = useState("192.168.1.1");
  const [verdict, setVerdict] = useState("");
  const [rules, setRules] = useState([
    "Block suspicious traffic",
    "Allow trusted office IPs",
    "Rate limit API requests",
    "Challenge unknown bots",
    "Allow health checks",
  ]);
  const [drag, setDrag] = useState<number | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [promoted, setPromoted] = useState(0);
  const jobs = [
    "billing-reconciliation",
    "daily-email-digest",
    "inventory-sync",
    "analytics-rollup",
    "session-cleanup",
    "backup-database",
  ];
  if (deploy)
    return (
      <div className="rounded-xl border bg-background p-6">
        <BlockHeading title="Deployments" description="Manage releases across your environments.">
          <Button size="sm" variant="outline" onClick={() => setFrozen((v) => !v)}>
            <Shield />
            {frozen ? "Unfreeze" : "Freeze deploys"}
          </Button>
          <AddButton
            label="New deployment"
            onClick={() => {
              setRun((r) => r + 1);
              toast.success("Deployment queued");
            }}
          />
        </BlockHeading>
        {frozen && (
          <Alert className="mt-5">
            <Shield />
            <AlertTitle>Deployment freeze is active</AlertTitle>
            <AlertDescription>Promotions are paused until the freeze is lifted.</AlertDescription>
          </Alert>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["Development", "Staging", "Production"].map((e, i) => (
            <Card key={e} className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{e}</CardTitle>
                  <Status value={i === 1 && promoted === 0 ? "Deploying" : "Healthy"} />
                </div>
                <CardDescription className="font-mono text-[10px]">
                  v{3 + i}.{4 + run}.{i + promoted} · main
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <GitBranch className="size-3" />
                    a8f2d3c
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Improve dashboard performance
                  </p>
                </div>
                <div className="flex gap-1">
                  {["Build", "Test", "Scan", "Deploy", "Verify", "Live"].map((s, j) => (
                    <div
                      key={s}
                      title={s}
                      className={`h-2 flex-1 rounded-full ${j < (i === 1 ? 4 : 6) ? "bg-emerald-400" : "bg-muted"}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Deployed by {people[i].split(" ")[0]}</span>
                  <span>{i + 1}m ago</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={frozen || i === 2}
                  onClick={() => {
                    setPromoted((p) => p + 1);
                    toast.success(`Release promoted to ${i === 0 ? "Staging" : "Production"}`);
                  }}
                >
                  Promote
                  <ArrowRight />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Metric title="Canary error rate" value="0.02%" change="−0.04%" />
          <Metric title="P95 latency" value="142 ms" change="−18.2%" />
        </div>
        <div className="mt-5">
          <ChartBlock
            block={{
              ...block,
              group: "chart",
              category: "composed-chart",
              name: "Canary rollout",
              index: 4,
            }}
          />
        </div>
      </div>
    );
  return (
    <div className="rounded-xl border bg-background p-6">
      <BlockHeading
        title={block.name}
        description={
          cron
            ? "Scheduled jobs, execution history, and run health."
            : firewall
              ? "Protect your edge with ordered rules and traffic controls."
              : "System operations and infrastructure activity."
        }
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRun((r) => r + 1);
            toast.success("Console refreshed");
          }}
        >
          <RefreshCw />
          Refresh
        </Button>
        <AddButton
          label={cron ? "New job" : firewall ? "New rule" : "Add new"}
          onClick={() => {
            setActive(0);
          }}
        />
      </BlockHeading>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {(cron
          ? [
              ["Active jobs", "24"],
              ["Success rate", "99.8%"],
              ["Total runs", "12,486"],
              ["Avg. duration", "842ms"],
            ]
          : firewall
            ? [
                ["Requests today", "2.4M"],
                ["Blocked", "18,642"],
                ["Active rules", String(rules.length)],
                ["Threat score", "Low"],
              ]
            : [
                ["Healthy services", "24"],
                ["Uptime", "99.98%"],
                ["Events today", "1,842"],
                ["Open issues", "3"],
              ]
        ).map(([k, v]) => (
          <Metric key={k} title={k} value={v} />
        ))}
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="my-5">
          {(firewall
            ? ["Overview", "IP lists", "Traffic log"]
            : ["Overview", "Run history", "Settings"]
          ).map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {cron ? (
        <div className="overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/25">
                {["Job", "Schedule", "Recent runs", "Last run", "Enabled", ""].map((s, i) => (
                  <TableHead key={i} className="text-[11px]">
                    {s}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j, i) => (
                <TableRow key={j}>
                  <TableCell className="py-4">
                    <button
                      className="flex items-center gap-2 text-xs font-medium hover:underline"
                      onClick={() => setActive(i)}
                    >
                      <Terminal className="size-3.5" />
                      {j}
                    </button>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      job_{1042 + i}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-[10px]">
                    {
                      [
                        "*/15 * * * *",
                        "0 9 * * *",
                        "*/30 * * * *",
                        "0 * * * *",
                        "0 0 * * *",
                        "0 2 * * *",
                      ][i]
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-36 gap-[3px]">
                      {Array.from({ length: 20 }, (_, k) => (
                        <button
                          key={k}
                          onClick={() => {
                            setActive(i);
                          }}
                          title={`Run ${k + 1} · ${(i + k + run) % 17 === 0 ? "Failed" : "Complete"}`}
                          aria-label={`View ${j} run ${k + 1}`}
                          className={`h-5 w-1.5 rounded-sm ${(i + k + run) % 17 === 0 ? "bg-rose-400" : "bg-emerald-400"}`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Status value={i === 3 ? "Failed" : "Complete"} />
                  </TableCell>
                  <TableCell>
                    <Switch
                      aria-label={`Enable ${j}`}
                      checked={enabled[i] ?? true}
                      onCheckedChange={(v) => setEnabled((s) => ({ ...s, [i]: v }))}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={enabled[i] === false}
                      onClick={() => {
                        setRun((r) => r + 1);
                        toast.success(`${j} executed successfully`);
                      }}
                    >
                      <Play />
                      Run now
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : firewall ? (
        <div className="grid gap-5 md:grid-cols-[1fr_280px]">
          <div className="flex flex-col gap-2">
            {rules.map((r, i) => (
              <div
                draggable
                key={r}
                onDragStart={() => setDrag(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (drag === null) return;
                  setRules((rs) => {
                    const next = [...rs];
                    next.splice(i, 0, next.splice(drag, 1)[0]);
                    return next;
                  });
                  setDrag(null);
                }}
                className="flex items-center gap-3 rounded-lg border p-4"
              >
                <GripVertical className="size-4 cursor-grab text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium">{r}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {
                      [
                        "ip.src in $threat_list",
                        "ip.src in $office_ips",
                        "http.requests > 100/min",
                        "bot.score < 30",
                        "http.path = /health",
                      ][i]
                    }
                  </p>
                </div>
                <Badge variant={i === 0 ? "default" : "outline"}>
                  {i === 0 ? "Block" : i === 3 ? "Challenge" : "Allow"}
                </Badge>
                <Switch
                  aria-label={`Enable ${r}`}
                  checked={enabled[i] ?? true}
                  onCheckedChange={(v) => setEnabled((s) => ({ ...s, [i]: v }))}
                />
              </div>
            ))}
          </div>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">Test a request</CardTitle>
              <CardDescription className="text-xs">
                Trace your request through active rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="test-ip">Source IP</FieldLabel>
                  <Input id="test-ip" value={testIP} onChange={(e) => setTestIP(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>Request path</FieldLabel>
                  <Input defaultValue="/api/v1/users" />
                </Field>
              </FieldGroup>
              <Button
                onClick={() => {
                  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(testIP)) {
                    toast.error("Enter a valid IPv4 address");
                    return;
                  }
                  setVerdict(
                    testIP.startsWith("192.")
                      ? "Allowed by office IP rule"
                      : "Challenge: unknown source",
                  );
                }}
              >
                Run test
              </Button>
              {verdict && (
                <Alert>
                  <Shield />
                  <AlertTitle className="text-xs">{verdict}</AlertTitle>
                  <AlertDescription className="text-[10px]">
                    Evaluated {rules.length} rules · 0.4ms
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <ChartBlock
          block={{
            ...block,
            group: "chart",
            category: block.index === 1 ? "bar-chart" : "line-chart",
            name: block.index === 4 ? "Error budget burn" : "Infrastructure activity",
          }}
        />
      )}
      <Sheet open={active !== null} onOpenChange={(v) => !v && setActive(null)}>
        <SheetContent className="overflow-auto">
          <SheetHeader>
            <SheetTitle>
              {cron ? jobs[active ?? 0] : firewall ? "Rule configuration" : "Operation details"}
            </SheetTitle>
            <SheetDescription>Configure and inspect the selected record.</SheetDescription>
          </SheetHeader>
          <FieldGroup className="px-4 py-5">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                defaultValue={
                  cron ? jobs[active ?? 0] : firewall ? "Custom firewall rule" : "New operation"
                }
              />
            </Field>
            <Field>
              <FieldLabel>{cron ? "Cron expression" : "Description"}</FieldLabel>
              <Input value={cronValue} onChange={(e) => setCronValue(e.target.value)} />
            </Field>
            {cron && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs font-medium">Next scheduled runs · UTC</p>
                {["Today, 14:30", "Today, 14:45", "Today, 15:00"].map((t) => (
                  <p key={t} className="mt-2 text-[11px] text-muted-foreground">
                    {t}
                  </p>
                ))}
              </div>
            )}
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea placeholder="Add runbook or configuration notes..." />
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button
              onClick={() => {
                setActive(null);
                toast.success("Configuration saved");
              }}
            >
              Save changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function AgentOpsBlock({ block }: BlockProps) {
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState(
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      title: [
        "Summarize customer feedback",
        "Prepare weekly report",
        "Review security policy",
        "Update project documentation",
        "Analyze support trends",
        "Draft release notes",
        "Classify incoming tickets",
        "Research market changes",
      ][i],
      status: ["Needs approval", "Running", "Failed", "Queued"][i % 4],
      owner: people[i],
      pinned: false,
    })),
  );
  const [active, setActive] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const memory = block.index === 8;
  const approval = block.index === 4;
  const failed = block.index === 6;
  const trace = block.index === 2;
  const [view, setView] = useState("Details");
  function update(id: number, status: string) {
    setItems((s) => s.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success(status === "Complete" ? "Request approved" : `Run ${status.toLowerCase()}`);
  }
  return (
    <div className="rounded-xl border bg-background p-6">
      <BlockHeading
        title={block.name}
        description={
          memory
            ? "Reusable context, facts, and preferences across your agents."
            : "Monitor and manage agent runs across your workspace."
        }
      >
        <Badge variant="outline">
          {items.length} {memory ? "memories" : "runs"}
        </Badge>
        <AddButton
          label={memory ? "Add memory" : "New run"}
          onClick={() => {
            setItems((s) => [
              {
                id: Date.now(),
                title: memory ? "New workspace memory" : "New research task",
                status: "Queued",
                owner: people[0],
                pinned: false,
              },
              ...s,
            ]);
            toast.success(memory ? "Memory created" : "Run queued");
          }}
        />
      </BlockHeading>
      <div className="my-5 grid grid-cols-3 gap-3">
        {[
          ["Needs approval", items.filter((i) => i.status === "Needs approval").length],
          ["Running", items.filter((i) => i.status === "Running").length],
          ["Failed", items.filter((i) => i.status === "Failed").length],
        ].map(([k, v]) => (
          <button
            key={k}
            className="rounded-lg border p-4 text-left"
            onClick={() => setFilter(String(k))}
          >
            <p className="text-[11px] text-muted-foreground">{k}</p>
            <p className="mt-1 text-xl font-semibold">{v}</p>
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap justify-between gap-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            {["All", "Needs approval", "Running", "Failed"].map((t) => (
              <TabsTrigger key={t} value={t}>
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Input
          aria-label="Search agent records"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 max-w-56 text-xs"
        />
      </div>
      {trace ? (
        <div className="grid gap-5 md:grid-cols-[1fr_260px]">
          <div className="flex flex-col gap-3">
            {[
              "Load context",
              "Search knowledge base",
              "Read source documents",
              "Call external API",
              "Write final response",
            ].map((s, i) => (
              <div key={s} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-medium">
                    {i === 3 ? (
                      <X className="size-3.5 text-destructive" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                    {s}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {124 + i * 240}ms
                  </span>
                </div>
                {i === 3 && (
                  <Alert className="mt-3">
                    <AlertTitle className="text-xs">Request timed out</AlertTitle>
                    <AlertDescription className="text-[11px]">
                      The external service did not respond within 30 seconds.
                    </AlertDescription>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => toast.success("Step retried successfully")}
                    >
                      Retry step
                    </Button>
                  </Alert>
                )}
              </div>
            ))}
          </div>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">Run configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Timeout (s)</FieldLabel>
                  <Input type="number" defaultValue={120} />
                </Field>
                <Field>
                  <FieldLabel>Max retries</FieldLabel>
                  <Input type="number" defaultValue={3} />
                </Field>
              </FieldGroup>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => toast.success("Run settings updated")}
              >
                Save settings
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className={memory ? "grid gap-3 md:grid-cols-2" : "flex flex-col gap-2"}>
          {items
            .filter(
              (x) =>
                (filter === "All" || x.status === filter) &&
                x.title.toLowerCase().includes(search.toLowerCase()) &&
                (!failed || x.status === "Failed" || x.status === "Complete"),
            )
            .sort((a, b) => Number(b.pinned) - Number(a.pinned))
            .map((x) => (
              <div
                key={x.id}
                className={`flex gap-3 rounded-lg border p-4 ${memory ? "flex-col" : "flex-wrap items-center"}`}
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <Bot className="size-4" />
                </div>
                <div className="min-w-36 flex-1">
                  <button
                    className="text-left text-xs font-medium hover:underline"
                    onClick={() => setActive(x.id)}
                  >
                    {memory
                      ? [
                          "The team prefers concise updates",
                          "Project launch is scheduled for November",
                          "Design tokens use neutral colors",
                          "Engineering uses two-week sprints",
                        ][x.id % 4]
                      : x.title}
                  </button>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{memory ? "Workspace · Verified source" : `RUN-${2408 + x.id}`}</span>
                    <span>Updated 2m ago</span>
                  </div>
                  {memory && (
                    <div className="mt-3 flex items-center gap-2">
                      <Progress value={92 - x.id * 3} className="h-1" />
                      <span className="text-[9px] text-muted-foreground">
                        {92 - x.id * 3}% confidence
                      </span>
                    </div>
                  )}
                </div>
                {memory ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant={x.pinned ? "secondary" : "outline"}
                      onClick={() =>
                        setItems((s) =>
                          s.map((i) => (i.id === x.id ? { ...i, pinned: !i.pinned } : i)),
                        )
                      }
                    >
                      {x.pinned ? "Unpin" : "Pin"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setItems((s) => s.filter((i) => i.id !== x.id));
                        toast.success("Memory forgotten");
                      }}
                    >
                      Forget
                    </Button>
                  </div>
                ) : (
                  <>
                    <Person name={x.owner} small />
                    <Status value={x.status} />
                    {approval && x.status === "Needs approval" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => update(x.id, "Complete")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setActive(x.id)}>
                          Reject
                        </Button>
                      </div>
                    ) : failed ? (
                      <Button size="sm" variant="outline" onClick={() => update(x.id, "Complete")}>
                        Retry run
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`View ${x.title}`}
                        onClick={() => setActive(x.id)}
                      >
                        <ChevronRight />
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
        </div>
      )}
      <Sheet open={active !== null} onOpenChange={(v) => !v && setActive(null)}>
        <SheetContent className="overflow-auto">
          <SheetHeader>
            <SheetTitle>{items.find((x) => x.id === active)?.title}</SheetTitle>
            <SheetDescription>Review execution details and take action.</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <Tabs value={view} onValueChange={setView}>
              <TabsList>
                {["Details", "Attempts", "Payload"].map((v) => (
                  <TabsTrigger value={v} key={v}>
                    {v}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <pre className="my-5 overflow-auto rounded-lg bg-muted p-4 text-[10px] leading-6">
              {view === "Payload"
                ? JSON.stringify(
                    {
                      task: items.find((x) => x.id === active)?.title,
                      model: "gpt-4.1",
                      timeout: 120,
                      tools: ["search", "read_document"],
                    },
                    null,
                    2,
                  )
                : view === "Attempts"
                  ? "Attempt 1: Connection timeout\nAttempt 2: Rate limited\nNext retry: Available now"
                  : "Owner: Olivia Rhye\nStarted: Oct 22, 10:42 AM\nDuration: 12.4 seconds\nTools called: 4\nRisk level: Standard"}
            </pre>
            {approval && (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="reject-reason">Rejection reason</FieldLabel>
                  <Textarea
                    id="reject-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </Field>
              </FieldGroup>
            )}
          </div>
          <SheetFooter>
            <Button
              disabled={approval && !reason.trim()}
              onClick={() => {
                if (active !== null) update(active, approval ? "Rejected" : "Complete");
                setActive(null);
              }}
            >
              {approval ? "Reject request" : "Retry run"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function AnalyticsBlock({ block }: BlockProps) {
  const [scope, setScope] = useState("All users");
  const [period, setPeriod] = useState("8 weeks");
  const [watch, setWatch] = useState(false);
  const [decision, setDecision] = useState("Ship");
  const [cohort, setCohort] = useState<number | null>(null);
  const funnel = block.index === 2;
  const retention = block.index === 3;
  const experiment = block.index === 6;
  const metric = block.index === 7;
  const stats = funnel
    ? [
        ["Visitors", "42,800"],
        ["Signups", "8,642"],
        ["Activated", "4,280"],
        ["Converted", "1,284"],
      ]
    : [
        ["Monthly active users", "24,842"],
        ["Activation rate", "42.6%"],
        ["Retention", "78.2%"],
        ["Feature adoption", "64.8%"],
      ];
  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-background p-6">
      <BlockHeading
        title={block.name}
        description="Understand product performance and find your next opportunity."
      >
        <Button
          size="sm"
          variant={watch ? "secondary" : "outline"}
          onClick={() => {
            setWatch((v) => !v);
            toast.success(watch ? "Stopped watching" : "Watching this report");
          }}
        >
          <Activity />
          {watch ? "Watching" : "Watch report"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setScope((s) => (s === "All users" ? "Enterprise" : "All users"));
          }}
        >
          {scope}
          <ChevronDown />
        </Button>
      </BlockHeading>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([t, v]) => (
          <Metric title={t} value={v} key={t} change="12.8%" />
        ))}
      </div>
      {experiment ? (
        <>
          <div className="grid gap-4 md:grid-cols-[1fr_300px]">
            <Card className="shadow-none">
              <CardHeader>
                <CardDescription className="text-xs">
                  Experiment · Onboarding flow v2
                </CardDescription>
                <CardTitle className="text-xl">New flow improves activation by 8.4%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Badge variant="secondary">95% confidence</Badge>
                  <Badge variant="outline">24,842 participants</Badge>
                </div>
                <p className="mt-5 text-xs leading-6 text-muted-foreground">
                  The variant consistently outperformed the baseline across device types and
                  acquisition channels. All primary guardrails remain within healthy ranges.
                </p>
                <div className="mt-5 flex gap-2">
                  <Button
                    variant={decision === "Ship" ? "default" : "outline"}
                    onClick={() => {
                      setDecision("Ship");
                      toast.success("Ship decision recorded");
                    }}
                  >
                    Ship variant
                  </Button>
                  <Button
                    variant={decision === "Hold" ? "default" : "outline"}
                    onClick={() => {
                      setDecision("Hold");
                      toast.success("Hold decision recorded");
                    }}
                  >
                    Hold
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">Guardrails</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {["Error rate", "Page load time", "Support tickets", "Revenue per user"].map(
                  (t) => (
                    <div key={t} className="flex justify-between text-xs">
                      <span>{t}</span>
                      <Status value="Healthy" />
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </div>
          <div className="overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Metric", "Control", "Variant", "Lift", "Confidence"].map((t) => (
                    <TableHead key={t} className="text-xs">
                      {t}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  "Activation rate",
                  "Time to first value",
                  "Day 7 retention",
                  "Task completion",
                ].map((t, i) => (
                  <TableRow key={t}>
                    <TableCell className="text-xs font-medium">{t}</TableCell>
                    <TableCell>{[32.4, 4.8, 62.1, 74.2][i]}%</TableCell>
                    <TableCell>{[40.8, 3.2, 68.4, 81.3][i]}%</TableCell>
                    <TableCell>
                      <Badge variant="secondary">+{[8.4, 1.6, 6.3, 7.1][i]}%</Badge>
                    </TableCell>
                    <TableCell>
                      <Progress value={95 - i * 2} className="h-1.5" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : retention ? (
        <>
          <ChartBlock
            block={{
              ...block,
              group: "chart",
              category: "line-chart",
              name: "Retention curve",
              index: 2,
            }}
          />
          <div className="flex justify-between">
            <h3 className="text-xs font-semibold">Cohort retention</h3>
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList className="h-7">
                {["4 weeks", "8 weeks", "16 weeks"].map((p) => (
                  <TabsTrigger key={p} value={p} className="text-[10px]">
                    {p}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Cohort</TableHead>
                  <TableHead className="text-[11px]">Users</TableHead>
                  {Array.from({ length: period === "4 weeks" ? 4 : 8 }, (_, i) => (
                    <TableHead key={i} className="text-center text-[10px]">
                      Week {i}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">Sep {1 + i * 7}</TableCell>
                    <TableCell className="text-xs">{1284 + i * 126}</TableCell>
                    {Array.from({ length: period === "4 weeks" ? 4 : 8 }, (_, j) => {
                      const value = Math.max(18, 100 - j * 8 - i * 3);
                      return (
                        <TableCell key={j} className="p-1">
                          <button
                            className="w-full rounded p-3 text-[10px]"
                            style={{
                              background: `color-mix(in oklch,var(--chart-1) ${value}%,var(--background))`,
                              color: value > 60 ? "white" : "var(--foreground)",
                            }}
                            onClick={() => setCohort(i)}
                          >
                            {value}%
                          </button>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {cohort !== null && (
            <p className="rounded bg-muted p-3 text-xs">
              Cohort Sep {1 + cohort * 7}: {1284 + cohort * 126} users · Retention is above the 65%
              target.
            </p>
          )}
        </>
      ) : funnel ? (
        <>
          <div className="grid gap-4 md:grid-cols-[1fr_280px]">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">Activation funnel</CardTitle>
                <CardDescription className="text-xs">
                  From first visit to paying customer
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {stats.map(([t, v], i) => (
                  <div key={t}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span>{t}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                    <div
                      className="h-10 rounded-lg"
                      style={{
                        width: `${100 - i * 22}%`,
                        background: `var(--chart-${i + 1})`,
                        opacity: 0.8,
                      }}
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {[100, 20.2, 10, 3][i]}% of total ·{" "}
                      {i === 0 ? "Entry point" : `${[0, 79.8, 50.5, 70][i]}% drop-off`}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <ChartBlock
              block={{
                ...block,
                group: "chart",
                category: "pie-chart",
                name: "Segment mix",
                index: 0,
              }}
            />
          </div>
          <GridBlock
            block={{ ...block, group: "data-grid", category: "base", name: "Activation stages" }}
          />
        </>
      ) : (
        <>
          <ChartBlock
            block={{
              ...block,
              group: "chart",
              category: metric ? "line-chart" : "area-chart",
              name: metric ? "Monthly active users trend" : "Product engagement trend",
              index: block.index,
            }}
          />
          <GridBlock
            block={{
              ...block,
              group: "data-grid",
              category: block.index === 1 ? "expansion" : "base",
              name: block.index === 0 ? "Product signal backlog" : block.name,
            }}
          />
        </>
      )}
    </div>
  );
}

export function DashboardBlock({ block }: BlockProps) {
  const inventory = block.category === "inventory";
  const crm = block.category === "crm";
  const ai = block.category === "ai-ops" || block.category === "agents";
  const billing = block.category === "billing";
  const title = block.name;
  const metrics = inventory
    ? [
        ["Total stock value", "$284,960"],
        ["Available units", "12,486"],
        ["Low stock SKUs", "24"],
        ["Pending orders", "18"],
      ]
    : crm
      ? [
          ["Open pipeline", "$842,500"],
          ["Weighted forecast", "$428,200"],
          ["Win rate", "32.4%"],
          ["Deals won", "48"],
        ]
      : billing
        ? [
            ["Monthly revenue", "$128,450"],
            ["Active subscriptions", "1,284"],
            ["Past due", "$8,420"],
            ["Net retention", "112.8%"],
          ]
        : ai
          ? [
              ["Runs today", "1,842"],
              ["Success rate", "98.6%"],
              ["Avg. latency", "1.24s"],
              ["Token spend", "$284.62"],
            ]
          : [
              ["Total orders", "1,842"],
              ["Revenue", "$128,450"],
              ["Upcoming events", "12"],
              ["Fulfillment", "94.2%"],
            ];
  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-background p-6">
      <BlockHeading title={title} description="Your workspace at a glance · October 2026">
        <Button variant="outline" size="sm" onClick={() => toast.success("Dashboard refreshed")}>
          <RefreshCw />
          Refresh
        </Button>
        <Button
          size="sm"
          onClick={() =>
            downloadCsv(
              title,
              metrics.map(([metric, value]) => ({ metric, value })),
            )
          }
        >
          Export report
        </Button>
      </BlockHeading>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map(([t, v]) => (
          <Metric key={t} title={t} value={v} change="12.4%" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <ChartBlock
          block={{
            ...block,
            group: "chart",
            category: inventory ? "area-chart" : ai ? "line-chart" : "composed-chart",
            name: inventory
              ? "Available vs. reserved stock"
              : ai
                ? "Run throughput"
                : "Revenue overview",
            index: 2,
          }}
        />
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">
              {crm
                ? "Pipeline stages"
                : inventory
                  ? "Stock health"
                  : ai
                    ? "Recent incidents"
                    : "Upcoming activity"}
            </CardTitle>
            <CardDescription className="text-xs">Updated just now</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {(crm
              ? ["Qualified", "Proposal", "Negotiation", "Closed won"]
              : inventory
                ? ["In stock", "Low stock", "Out of stock", "Backordered"]
                : ai
                  ? [
                      "Provider failover",
                      "Queue backlog cleared",
                      "Model latency alert",
                      "Daily review complete",
                    ]
                  : ["Team review", "Customer follow-up", "Order fulfillment", "Weekly planning"]
            ).map((s, i) => (
              <div key={s}>
                <div className="flex items-center justify-between text-xs">
                  <span>{s}</span>
                  <span className="text-muted-foreground">
                    {[42, 28, 18, 12][i]}
                    {crm || inventory ? "%" : ""}
                  </span>
                </div>
                <Progress value={[82, 62, 38, 24][i]} className="mt-2 h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <GridBlock
        block={{
          ...block,
          group: "data-grid",
          category: "base",
          name: crm
            ? "Open deals"
            : inventory
              ? "Product inventory"
              : billing
                ? "Invoice ledger"
                : ai
                  ? "Agent run queue"
                  : "Recent orders",
        }}
      />
    </div>
  );
}
