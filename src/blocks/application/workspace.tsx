import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  File,
  Folder,
  Inbox,
  LayoutDashboard,
  PanelLeft,
  Plus,
  Send,
  Settings,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Head,
  Metric,
  More,
  NewItem,
  Person,
  SearchInput,
  SmallTabs,
  Spark,
  Status,
  Team,
  Brand,
  people,
  toast,
} from "./shared";
import { CalendarBlock, BoardBlock, WhiteboardBlock } from "./planning";
import type { BlockProps, BlockMeta } from "@/data/types";
const chartData = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
  revenue: [210, 320, 270, 450, 390, 580, 480, 710, 630, 810, 720, 940][i],
  previous: [140, 240, 210, 320, 290, 380, 340, 510, 440, 590, 520, 680][i],
}));
export function OverviewChart() {
  return (
    <Card className="gap-5 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-sm font-medium">Revenue overview</CardTitle>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-3xl font-semibold tracking-tight">$48,295.00</p>
            <Badge variant="secondary">↗ 18.4%</Badge>
          </div>
        </div>
        <More />
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            revenue: { label: "Revenue", color: "var(--chart-1)" },
            previous: { label: "Previous period", color: "var(--chart-2)" },
          }}
          className="h-[230px] w-full"
        >
          <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={12} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="previous"
              stroke="var(--color-previous)"
              strokeDasharray="4 4"
              fill="none"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              fill="url(#revenue-fill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
const taskRows = [
  ["Website redesign", "Design", "In progress", "Olivia Rhye", "Oct 28, 2026"],
  ["Mobile app launch", "Development", "In review", "Phoenix Baker", "Oct 30, 2026"],
  ["Q4 marketing campaign", "Marketing", "In progress", "Lana Steiner", "Nov 2, 2026"],
  ["Customer research", "Research", "Completed", "Demi Wilkinson", "Oct 22, 2026"],
  ["Design system update", "Design", "In progress", "Drew Cano", "Nov 5, 2026"],
];
export function WorkTable({ block }: { block: BlockMeta }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All projects");
  const [selected, setSelected] = useState<string[]>([]);
  const [extra, setExtra] = useState<string[]>([]);
  const [ascending, setAscending] = useState(true);
  const rows = [
    ...taskRows,
    ...extra.map((n) => [n, "Design", "In progress", "Alex Morgan", "Nov 8, 2026"]),
  ]
    .filter((r) => r.join(" ").toLowerCase().includes(q.toLowerCase()))
    .filter((r) => tab === "All projects" || r[2] === tab)
    .sort((a, b) => (ascending ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0])));
  return (
    <Card className="gap-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b py-4">
        <div>
          <CardTitle className="text-base">
            {block.category === "dashboard" ? block.name : "Projects"}{" "}
            <Badge variant="secondary" className="ml-2">
              {rows.length}
            </Badge>
          </CardTitle>
          <CardDescription className="mt-1">Keep track of your team’s work.</CardDescription>
        </div>
        <NewItem onCreate={(n) => setExtra([...extra, n])} />
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <SmallTabs
            items={["All projects", "In progress", "Completed"]}
            value={tab}
            onChange={setTab}
          />
          <SearchInput value={q} onChange={setQ} placeholder="Search projects…" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    aria-label="Select all projects"
                    checked={rows.length > 0 && selected.length === rows.length}
                    onCheckedChange={(v) => setSelected(v ? rows.map((r) => r[0]) : [])}
                  />
                </TableHead>
                <TableHead>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="-ml-3"
                    onClick={() => setAscending(!ascending)}
                  >
                    Project name <ChevronDown />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Team lead</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r[0]}>
                  <TableCell className="pl-4">
                    <Checkbox
                      aria-label={`Select ${r[0]}`}
                      checked={selected.includes(r[0])}
                      onCheckedChange={(v) =>
                        setSelected(v ? [...selected, r[0]] : selected.filter((n) => n !== r[0]))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg border">
                        <Folder className="size-4" />
                      </span>
                      <div>
                        <p className="font-medium">{r[0]}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{r[1]}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Status>{r[2]}</Status>
                  </TableCell>
                  <TableCell>
                    <Person name={r[3]} compact />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r[4]}</TableCell>
                  <TableCell>
                    <More />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {rows.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">No projects found.</div>
        )}
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <span>
            {selected.length} of {rows.length} selected
          </span>
          <span>Showing {rows.length} projects</span>
        </div>
      </CardContent>
    </Card>
  );
}
export function DashboardBlock({ block }: BlockProps) {
  const [period, setPeriod] = useState("Last 30 days");
  const metricNames = /Security/.test(block.name)
    ? ["Total requests", "Blocked threats", "Avg. latency", "Uptime"]
    : /Workforce|Coverage/.test(block.name)
      ? ["Team members", "Scheduled hours", "Coverage rate", "Open shifts"]
      : /Calls/.test(block.name)
        ? ["Total calls", "Successful calls", "Avg. duration", "Cost per call"]
        : /Payout/.test(block.name)
          ? ["Total royalties", "Pending payouts", "Active creators", "Paid this month"]
          : ["Total revenue", "Orders", "Customers", "Conversion rate"];
  return (
    <div className="flex min-h-[650px] flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{block.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, Alex. Here’s what’s happening today.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarDays />
              {period}
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              {["Last 7 days", "Last 30 days", "Last 90 days", "This year"].map((p) => (
                <DropdownMenuItem key={p} onSelect={() => setPeriod(p)}>
                  {p}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricNames.map((t, i) => (
          <Metric
            key={t}
            title={t}
            value={["$48,295", "2,420", "1,210", "4.28%"][i]}
            change={["18.4%", "12.8%", "8.2%", "2.1%"][i]}
            index={i}
          />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <OverviewChart />
        <Card className="shadow-none">
          <CardHeader className="flex flex-row justify-between">
            <div>
              <CardTitle className="text-sm">Recent activity</CardTitle>
              <CardDescription className="mt-1 text-xs">Your team, at a glance</CardDescription>
            </div>
            <More />
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {people.slice(0, 4).map((p, i) => (
              <div key={p}>
                <Person
                  name={p}
                  sub={
                    [
                      "Created a new project",
                      "Completed design review",
                      "Updated marketing brief",
                      "Invited 2 team members",
                    ][i]
                  }
                />
                <p className="ml-11 mt-1 text-[10px] text-muted-foreground">{i + 1}h ago</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <WorkTable block={block} />
    </div>
  );
}
export function NavBlock({ block }: BlockProps) {
  const [tab, setTab] = useState("Overview");
  const [search, setSearch] = useState("");
  const [published, setPublished] = useState(false);
  return (
    <div className="flex min-h-[300px] flex-col bg-muted/20">
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b bg-background px-6 py-4">
        <div className="flex items-center gap-5">
          <Brand />
          <Separator orientation="vertical" className="h-5" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {block.name.includes("Repo") ? "acme / web-app" : "Acme Workspace"}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {["Acme Workspace", "Personal workspace", "Create workspace"].map((w) => (
                  <DropdownMenuItem key={w} onSelect={() => toast(`Switched to ${w}`)}>
                    {w}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          {/Search|Developer|Marketplace/.test(block.name) && (
            <div className="hidden md:block">
              <SearchInput value={search} onChange={setSearch} placeholder="Search workspace…" />
            </div>
          )}
          <Team />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Notifications"
            onClick={() =>
              toast("You’re all caught up", {
                description: "No new notifications.",
              })
            }
          >
            <Bell />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setPublished(!published);
              toast.success(published ? "Draft saved" : "Changes published");
            }}
          >
            {/Editor|Publish|Workflow/.test(block.name)
              ? published
                ? "Published"
                : "Publish"
              : "Share"}
          </Button>
          <Avatar className="size-8">
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
        </div>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-background px-6 py-3">
        <div className="flex gap-2">
          {["Overview", "Projects", "Activity", "Settings"].map((t) => (
            <Button
              variant={tab === t ? "secondary" : "ghost"}
              size="sm"
              key={t}
              onClick={() => setTab(t)}
            >
              {t}
            </Button>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-current" />
          All changes saved
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        {search ? `Searching for “${search}”` : `${tab} workspace`}
      </div>
    </div>
  );
}
export function ShellBlock({ block }: BlockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [section, setSection] = useState("Overview");
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [mail, setMail] = useState(0);
  const isMail = /Mail|Inbox/.test(block.name);
  const isChat = /Chat|Assistant/.test(block.name);
  const isCalendar = /Calendar|Scheduling/.test(block.name);
  const dark = /Presence|Favorites|Fleet Center/.test(block.name);
  const top = Number(block.id.split("-").pop()) === 30;
  const nav = [
    ["Overview", LayoutDashboard],
    ["Projects", Folder],
    ["Tasks", Check],
    ["Calendar", CalendarDays],
    ["Inbox", Inbox],
    ["Team members", Users],
    ["Reports", File],
    ["Settings", Settings],
  ] as const;
  return (
    <div className="flex min-h-[680px] bg-muted/20">
      {!top && (
        <aside
          className={`${collapsed ? "w-16" : "w-[210px]"} ${dark ? "dark bg-foreground text-background" : "bg-background"} hidden shrink-0 flex-col border-r p-3 transition-[width] sm:flex`}
        >
          <div className="flex items-center justify-between px-2 py-3">
            <Brand small={collapsed} />
            {!collapsed && <ChevronDown className="size-3" />}
          </div>
          {!collapsed && (
            <div className="mt-4">
              <SearchInput value={q} onChange={setQ} placeholder="Search…" />
            </div>
          )}
          <div className="mt-6 flex flex-col gap-1">
            {nav
              .filter(([t]) => t.toLowerCase().includes(q.toLowerCase()))
              .map(([t, Icon]) => (
                <Button
                  key={t}
                  title={t}
                  variant={section === t ? "secondary" : "ghost"}
                  size="sm"
                  className={collapsed ? "justify-center px-0" : "justify-start"}
                  onClick={() => setSection(t)}
                >
                  <Icon />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{t}</span>
                      {t === "Inbox" && <Badge variant="outline">4</Badge>}
                    </>
                  )}
                </Button>
              ))}
          </div>
          {!collapsed && (
            <>
              <p className="mb-2 mt-7 px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                Favorites
              </p>
              {["Website redesign", "Mobile app", "Brand guidelines"].map((n, i) => (
                <Button
                  size="sm"
                  variant="ghost"
                  className="justify-start"
                  key={n}
                  onClick={() => {
                    setSection(n);
                  }}
                >
                  <span className="size-2 rounded-sm border bg-muted" />
                  {n}
                  {i === 0 && <Star className="ml-auto" />}
                </Button>
              ))}
            </>
          )}
          <div className="mt-auto flex flex-col gap-3 pt-8">
            {!collapsed && (
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between text-xs">
                  <span>Pro workspace</span>
                  <Zap className="size-3" />
                </div>
                <p className="mb-3 mt-2 text-[10px] text-muted-foreground">8 of 12 team members</p>
                <Progress value={66} />
              </div>
            )}
            <Button
              variant="ghost"
              className={collapsed ? "px-0" : "justify-start"}
              onClick={() =>
                toast("Account menu", {
                  description: "Signed in as Alex Morgan",
                })
              }
            >
              <Avatar className="size-7">
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left">
                    <p className="text-xs">Alex Morgan</p>
                    <p className="text-[10px] text-muted-foreground">alex@acme.com</p>
                  </div>
                  <ChevronDown />
                </>
              )}
            </Button>
          </div>
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle navigation"
              onClick={() => setCollapsed(!collapsed)}
            >
              <PanelLeft />
            </Button>
            <Separator orientation="vertical" className="h-4" />
            {top && <Brand />}
            <span className="hidden text-xs text-muted-foreground md:inline">Workspace</span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-sm">{section}</span>
          </div>
          <div className="flex items-center gap-2">
            <Team />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Notifications"
              onClick={() =>
                toast("Notifications", {
                  description: "Your workspace is up to date.",
                })
              }
            >
              <Bell />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(location.href);
                toast.success("Workspace link copied");
              }}
            >
              Share
              <ArrowUpRight />
            </Button>
          </div>
        </header>
        {top && (
          <div className="flex flex-wrap gap-1 border-b bg-background px-5 py-3">
            {nav.map(([t, Icon]) => (
              <Button
                size="sm"
                variant={section === t ? "secondary" : "ghost"}
                key={t}
                onClick={() => setSection(t)}
              >
                <Icon />
                {t}
              </Button>
            ))}
          </div>
        )}
        {isMail ? (
          <div className="grid flex-1 md:grid-cols-[300px_1fr]">
            <div className="border-r bg-background p-4">
              <SearchInput value={q} onChange={setQ} placeholder="Search inbox…" />
              <div className="mt-4 flex flex-col gap-1">
                {[
                  "Design review tomorrow",
                  "Welcome to the team",
                  "Q4 planning session",
                  "Your weekly digest",
                  "New comment on your project",
                ]
                  .filter((t) => t.toLowerCase().includes(q.toLowerCase()))
                  .map((t, i) => (
                    <button
                      key={t}
                      onClick={() => setMail(i)}
                      className={`rounded-lg p-3 text-left ${mail === i ? "bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{people[i]}</span>
                        <span className="text-[10px] text-muted-foreground">10:{20 + i}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium">{t}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        Hey team, just a quick update on our progress…
                      </p>
                    </button>
                  ))}
              </div>
            </div>
            <div className="flex flex-col gap-6 bg-background p-7">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {
                    [
                      "Design review tomorrow",
                      "Welcome to the team",
                      "Q4 planning session",
                      "Your weekly digest",
                      "New comment on your project",
                    ][mail]
                  }
                </h2>
                <More />
              </div>
              <Person name={people[mail]} sub="to me, design@acme.com" />
              <Separator />
              <div className="text-sm leading-7">
                <p>Hey Alex,</p>
                <p className="mt-4">
                  Hope you’re having a great week! I wanted to share a quick update and get your
                  thoughts on the latest designs.
                </p>
                <p className="mt-4">
                  We’ve made good progress on the new direction. Let’s review together and make sure
                  we’re aligned before moving forward.
                </p>
                <p className="mt-4">Looking forward to hearing what you think.</p>
              </div>
              <Button
                variant="outline"
                className="mt-auto self-start"
                onClick={() => toast("Reply composer opened")}
              >
                Reply
                <ArrowRight />
              </Button>
            </div>
          </div>
        ) : isChat ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
            <div className="flex size-10 items-center justify-center rounded-xl border bg-background">
              <Sparkles className="size-5" />
            </div>
            <h2 className="text-center text-2xl font-semibold tracking-tight">
              What should we work on?
            </h2>
            <div className="w-full max-w-xl">
              {messages.map((m, i) => (
                <div key={i} className="mb-3 rounded-lg bg-background p-4 text-sm">
                  <p className="font-medium">You</p>
                  <p className="mt-2">{m}</p>
                  <p className="mt-4 border-t pt-3 text-muted-foreground">
                    I can help with that. In this demo, your message is saved locally in this
                    conversation.
                  </p>
                </div>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (message.trim()) {
                    setMessages([...messages, message]);
                    setMessage("");
                  }
                }}
                className="rounded-xl border bg-background p-3 shadow-sm"
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask anything or describe a task…"
                  className="border-0 shadow-none"
                />
                <div className="mt-3 flex justify-between">
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => toast("Attachment selected")}
                  >
                    <Plus />
                  </Button>
                  <Button size="icon-sm" type="submit" aria-label="Send message">
                    <Send />
                  </Button>
                </div>
              </form>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["Write a brief", "Summarize activity", "Plan my week"].map((t) => (
                  <Button size="sm" variant="outline" key={t} onClick={() => setMessage(t)}>
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : isCalendar ? (
          <CalendarBlock block={{ ...block, category: "event-calendar" }} />
        ) : /Whiteboard/.test(block.name) ? (
          <WhiteboardBlock block={block} />
        ) : section === "Tasks" ? (
          <BoardBlock block={{ ...block, category: "kanban-board" }} />
        ) : (
          <div className="flex flex-1 flex-col gap-6 p-6">
            <Head
              title={
                /Fleet|Security|Mission|Protection|Observability/.test(block.name)
                  ? block.name
                  : section === "Overview"
                    ? "Workspace overview"
                    : section
              }
              description="A clear view of everything that matters."
              action=""
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {["Active projects", "Tasks completed", "Team members"].map((t, i) => (
                <Metric key={t} title={t} value={["24", "148", "12"][i]} index={i} />
              ))}
            </div>
            <WorkTable block={block} />
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div className="min-h-24 rounded-lg border border-dashed bg-background/50" />
              <div className="min-h-24 rounded-lg border border-dashed bg-background/50" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export function StatsBlock({ block }: BlockProps) {
  const [period, setPeriod] = useState("Monthly");
  const quota = /Usage|Quota|Capacity|Progress|Compliance|Allocation/.test(block.name);
  const wallet = /Wallet/.test(block.name);
  return (
    <div className="mx-auto flex min-h-[360px] max-w-6xl flex-col justify-center gap-6 p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{block.name}</h2>
        <SmallTabs items={["Weekly", "Monthly", "Yearly"]} value={period} onChange={setPeriod} />
      </div>
      {quota ? (
        <div className="grid gap-5 md:grid-cols-3">
          {["API requests", "Storage capacity", "Active seats"].map((t, i) => (
            <Card key={t} className="shadow-none">
              <CardHeader className="flex flex-row justify-between">
                <CardTitle className="text-sm font-medium">{t}</CardTitle>
                <More />
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-end justify-between">
                  <p className="text-3xl font-semibold">
                    {[72, 48, 86][i]}
                    <span className="text-sm font-normal text-muted-foreground">%</span>
                  </p>
                  <Badge variant="outline">
                    {[7200, 48, 86][i]} / {[10000, 100, 100][i]}
                  </Badge>
                </div>
                <Progress value={[72, 48, 86][i]} />
                <p className="mt-3 text-xs text-muted-foreground">Resets on November 1, 2026</p>
              </CardContent>
              <CardFooter>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => toast("Usage report opened")}
                >
                  View usage
                  <ArrowUpRight />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : wallet ? (
        <Card className="max-w-xl shadow-none">
          <CardHeader>
            <CardDescription>Available balance</CardDescription>
            <CardTitle className="text-4xl">
              $24,580.00 <span className="text-sm font-normal text-muted-foreground">USD</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6">
            <div className="rounded-lg bg-muted p-4">
              <ArrowDownLeft className="mb-2 size-4" />
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="mt-1 text-lg font-semibold">$8,420.00</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <ArrowUpRight className="mb-2 size-4" />
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="mt-1 text-lg font-semibold">$3,280.00</p>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button className="flex-1" onClick={() => toast("Transfer selected")}>
              Send money
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => toast("Transaction history opened")}
            >
              View transactions
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Total revenue", "Active subscribers", "New customers", "Growth rate"].map((t, i) => (
            <Metric
              key={t}
              title={t}
              value={["$48,295", "2,420", "1,210", "18.4%"][i]}
              index={i + block.index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export function ListBlock({ block }: BlockProps) {
  const [q, setQ] = useState("");
  const [followed, setFollowed] = useState<string[]>([]);
  const crypto = /Crypto|Wallet|Movers/.test(block.name);
  const directory = /Integration|Capability/.test(block.name);
  const rows = crypto
    ? ["Bitcoin", "Ethereum", "Solana", "Chainlink", "Avalanche"]
    : directory
      ? ["Slack", "Linear", "Notion", "GitHub", "Figma"]
      : [
          "Apex Ventures",
          "Horizon Capital",
          "Sequoia Growth",
          "Pioneer Partners",
          "Northstar Fund",
        ];
  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{block.name}</CardTitle>
            <CardDescription className="mt-1">
              {crypto
                ? "Market prices and recent portfolio activity."
                : directory
                  ? "Connect the tools you use every day."
                  : "Your latest updates, all in one place."}
            </CardDescription>
          </div>
          <More />
        </CardHeader>
        <CardContent>
          <SearchInput value={q} onChange={setQ} placeholder="Search items…" />
          <div className="mt-4 divide-y">
            {rows
              .filter((n) => n.toLowerCase().includes(q.toLowerCase()))
              .map((n, i) => (
                <div key={n} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="rounded-xl">
                      <AvatarFallback className="rounded-xl">{n.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{n}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {crypto
                          ? ["BTC", "ETH", "SOL", "LINK", "AVAX"][i]
                          : directory
                            ? "Productivity & collaboration"
                            : `${i + 2} transactions this month`}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <Spark index={i} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {directory ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setFollowed((v) =>
                              v.includes(n) ? v.filter((x) => x !== n) : [...v, n],
                            )
                          }
                        >
                          {followed.includes(n) ? "Connected" : "Connect"}
                        </Button>
                      ) : (
                        `$${[68420.5, 2840.2, 142.8, 12.62, 28.4][i].toLocaleString()}`
                      )}
                    </p>
                    {!directory && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        +{[2.48, 1.32, 4.81, 0.92, 3.25][i]}%
                      </p>
                    )}
                  </div>
                  {!directory && <More />}
                </div>
              ))}
          </div>
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
          <Button
            variant="link"
            size="sm"
            onClick={() => toast("You’re viewing all available records")}
          >
            View all activity
            <ArrowRight />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
