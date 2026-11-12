import { toast } from "sonner";
import { PulseSettings } from "./pulse-settings";
import { useSettingsDraft, initialPulseSettings } from "./settings-model";
import "./pulse-secondary.css";
import { PulseKnowledgeBase } from "./pulse-knowledge";
import { PulseReports } from "./pulse-reports";
import { usePulseReportState } from "./pulse-report-model";
import { PulseDirectory, initialDirectoryRecords } from "./pulse-directory";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/template-progress";
import { ReuiTrend, type TrendSeries } from "@/blocks/data/trend-foundation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Frame,
  FramePanel,
  FrameHeader,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { PulseBoard } from "./pulse-board";
import { PulseCreateTicketFields } from "./pulse-ticket-create";
import { PulseTicketDetail, PulseTicketDetailHeader } from "./pulse-ticket-detail";
import "./pulse-ticket-overlay.css";
import { ReferenceGrid } from "./reference-grid";
import { useEffect, useMemo, useRef, useState, type MouseEventHandler } from "react";
import {
  Plus,
  CheckCircle,
  Clock,
  Smile,
  Inbox,
  Filter,
  MoreHorizontal,
  Bell,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SheetClose } from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Shell, Button, Input, Avatar, ReferenceSheet, Empty } from "./shared";
import {
  applyPulseTicketColumns,
  createInitialPulseTickets,
  createPulseBoardTicket,
  filterPulseTickets,
  pulseTicketCollection,
  pulseTicketColumns,
  removePulseTickets,
  resolvePulseTickets,
  savePulseTicket,
  type PulseTicket as TicketRecord,
} from "./pulse-ticket-model";

// Preserve the twelve positions from the previous local chart as weekly rates.
// The actual free ReUI chart composition supplies responsive axes and tooltips.
const resolutionWeeks = [
  { name: "Mar 24", resolution: 58 },
  { name: "Mar 31", resolution: 57 },
  { name: "Apr 7", resolution: 59.5 },
  { name: "Apr 14", resolution: 60.8 },
  { name: "Apr 21", resolution: 59.8 },
  { name: "Apr 28", resolution: 62.3 },
  { name: "May 5", resolution: 64.2 },
  { name: "May 12", resolution: 63.3 },
  { name: "May 19", resolution: 66.3 },
  { name: "May 26", resolution: 68.3 },
  { name: "Jun 2", resolution: 69 },
  { name: "Jun 9", resolution: 70.7 },
];

const resolutionSeries: TrendSeries[] = [
  {
    key: "resolution",
    label: "First contact resolution",
    color: "var(--ct-green)",
    kind: "area",
    curve: "linear",
    opacity: 0.3,
    dots: true,
  },
];

function formatResolutionRate(value: number) {
  return `${value}%`;
}

function ResolutionChart() {
  return (
    <div className="pulse-resolution-chart">
      <ReuiTrend
        label="First contact resolution by week"
        data={resolutionWeeks}
        series={resolutionSeries}
        domain={[40, 80]}
        format={formatResolutionRate}
        height={350}
      />
    </div>
  );
}
export default function Pulse() {
  const initialArticle =
    new URLSearchParams(location.hash.split("?")[1] || "").get("article") || "";
  const [view, setView] = useState(initialArticle ? "Knowledge Base" : "Dashboard");
  const reportModel = usePulseReportState();
  const settingsModel = useSettingsDraft(initialPulseSettings);
  const [contactRecords, setContactRecords] = useState(() => initialDirectoryRecords(false));
  const [memberRecords, setMemberRecords] = useState(() => initialDirectoryRecords(true));
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState(createInitialPulseTickets);
  const [filter, setFilter] = useState("All");
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [create, setCreate] = useState(false);
  const [selected, setSelected] = useState<TicketRecord | null>(null);
  const [editing, setEditing] = useState<TicketRecord | null>(null);
  const ticketSheetOpener = useRef<(() => HTMLButtonElement | undefined) | null>(null);
  const ticketRowOpeners = useRef(new Map<string, HTMLButtonElement>());
  const ticketSearch = useRef<HTMLInputElement>(null);
  const newBoardTicket = useRef<HTMLButtonElement>(null);
  const [article, setArticle] = useState(initialArticle);
  useEffect(() => {
    const openLinkedArticle = () => {
      const linkedArticle = new URLSearchParams(location.hash.split("?")[1] || "").get("article");
      if (linkedArticle) {
        setArticle(linkedArticle);
        setView("Knowledge Base");
      }
    };
    window.addEventListener("hashchange", openLinkedArticle);
    return () => window.removeEventListener("hashchange", openLinkedArticle);
  }, []);
  const [page, setPage] = useState(1);
  const [layout, setLayout] = useState("Board");
  const [priority, setPriority] = useState("All");
  const collection = pulseTicketCollection(tickets, view === "Dashboard");
  const filtered = filterPulseTickets(
    collection,
    query,
    filter,
    view === "Tickets" ? priority : "All",
  );
  const selectedInScope = selectedTickets.filter((id) =>
    filtered.some((ticket) => ticket.id === id),
  );
  const boardColumns = useMemo(
    () => pulseTicketColumns(tickets, query, filter, priority),
    [tickets, query, filter, priority],
  );
  const creatingBoardTicket = create && !editing && view === "Tickets";
  const detailTicket = create ? null : selected;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 5)));

  function openTicket(ticket: TicketRecord, opener?: HTMLButtonElement) {
    // Opening the Sheet can remount grid cells. Resolve the row's live button on close.
    ticketSheetOpener.current = () => opener ?? ticketRowOpeners.current.get(ticket.id);
    setSelected(ticket);
  }

  const openNewTicket: MouseEventHandler<HTMLButtonElement> = (event) => {
    const opener = event.currentTarget;
    ticketSheetOpener.current = () => opener;
    setCreate(true);
  };

  function restoreTicketFocus(event: Event) {
    const opener = ticketSheetOpener.current?.();
    ticketSheetOpener.current = null;
    if (opener?.isConnected) {
      event.preventDefault();
      opener.focus({ preventScroll: true });
    } else {
      const fallback = ticketSearch.current ?? newBoardTicket.current;
      if (fallback) {
        event.preventDefault();
        fallback.focus();
      }
    }
  }

  const table = (
    <Frame>
      <FrameHeader>
        <div className="ct-between">
          <div>
            <FrameTitle>{view === "Dashboard" ? "Escalation Queue" : "All tickets"}</FrameTitle>
            <FrameDescription>
              {filtered.length} of {collection.length}{" "}
              {view === "Dashboard" ? "open escalations" : "tickets"}
            </FrameDescription>
          </div>
          <Button onClick={openNewTicket}>
            <Plus />
            {view === "Dashboard" ? "New escalation" : "New ticket"}
          </Button>
        </div>
      </FrameHeader>
      <FramePanel>
        <div className="ct-toolbar mb-4">
          <Input
            placeholder="Search tickets…"
            aria-label="Search tickets"
            ref={ticketSearch}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
              setSelectedTickets([]);
            }}
          />
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v);
              setPage(1);
              setSelectedTickets([]);
            }}
          >
            <SelectTrigger aria-label="Filter ticket queue">
              <Filter />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(view === "Dashboard"
                ? ["All", "Blocked", "At Risk", "Delayed", "On Time"]
                : [
                    ...new Set([
                      "All",
                      "Technical",
                      "Billing",
                      "Onboarding",
                      "Account",
                      "Blocked",
                      "At Risk",
                      "Delayed",
                      "On Time",
                      ...collection.map((ticket) => ticket.stage),
                    ]),
                  ]
              ).map((v) => (
                <SelectItem key={v} value={v}>
                  {v === "All" ? "Status" : v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ct-grow" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal />
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["customer", "stage", "due", "queue", "value", "sla"].map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={visibleColumns[key] !== false}
                  onCheckedChange={(value) => setVisibleColumns((c) => ({ ...c, [key]: value }))}
                >
                  {key === "value" ? "Account value" : key[0].toUpperCase() + key.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                disabled={!selectedInScope.length}
                onClick={() => {
                  setTickets((t) => removePulseTickets(t, selectedInScope));
                  setSelectedTickets([]);
                }}
              >
                Delete selected
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!selectedInScope.length}
                onClick={() => {
                  setTickets((t) => resolvePulseTickets(t, selectedInScope));
                  setSelectedTickets([]);
                }}
              >
                Mark resolved
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ReferenceGrid
          columnVisibility={visibleColumns}
          rows={filtered.slice((currentPage - 1) * 5, currentPage * 5)}
          onRowClick={openTicket}
          columns={[
            {
              id: "selection",
              title: "",
              header: (
                <Checkbox
                  aria-label="Select all escalations"
                  checked={selectedInScope.length === filtered.length && filtered.length > 0}
                  onCheckedChange={(value) =>
                    setSelectedTickets(value ? filtered.map((t) => t.id) : [])
                  }
                />
              ),
              render: (t) => (
                <Checkbox
                  aria-label={"Select " + t.id}
                  checked={selectedTickets.includes(t.id)}
                  onClick={(event) => event.stopPropagation()}
                  onCheckedChange={(value) =>
                    setSelectedTickets((s) =>
                      value ? [...s, t.id] : s.filter((id) => id !== t.id),
                    )
                  }
                />
              ),
            },
            {
              id: "ticket",
              title: "Ticket",
              value: (t) => t.id,
              render: (t) => (
                <>
                  <b>{t.id}</b>
                  <small className="block ct-muted mt-1">
                    {t.id === "TCK-4863" ? "Phone" : "Email"} · {t.agent}
                  </small>
                </>
              ),
            },
            {
              id: "customer",
              title: "Customer",
              value: (t) => t.customer,
              render: (t) => (
                <span className="ct-person">
                  <Avatar name={t.customer} />
                  <span>
                    {t.customer}
                    <small>{t.email}</small>
                  </span>
                </span>
              ),
            },
            {
              id: "stage",
              title: "Stage",
              value: (t) => t.stage,
              render: (t) => (
                <>
                  {t.stage}
                  <Progress
                    className="pulse-stage-progress"
                    aria-label={`${t.id} stage indicator`}
                    aria-valuetext={t.stage}
                    value={t.stage === "Escalated" ? 50 : 35}
                  />
                </>
              ),
            },
            { id: "due", title: "Due", value: (t) => t.due, render: (t) => t.due },
            {
              id: "queue",
              title: "Queue",
              value: (t) => t.queue,
              render: (t) => <Badge variant="outline">{t.queue}</Badge>,
            },
            {
              id: "value",
              title: "Account value",
              value: (t) => t.value,
              render: (t) => t.value,
            },
            {
              id: "sla",
              title: "SLA",
              value: (t) => t.sla,
              render: (t) => (
                <Badge
                  variant={
                    t.sla === "Blocked"
                      ? "destructive-light"
                      : t.sla === "On Time"
                        ? "success-light"
                        : "warning-light"
                  }
                >
                  {t.sla}
                </Badge>
              ),
            },
            {
              id: "actions",
              title: "",
              render: (t) => (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={"Open " + t.id}
                  ref={(button) => {
                    if (button) ticketRowOpeners.current.set(t.id, button);
                    else ticketRowOpeners.current.delete(t.id);
                  }}
                >
                  <MoreHorizontal />
                </Button>
              ),
            },
          ]}
        />
        {!filtered.length && (
          <Empty
            reset={() => {
              setFilter("All");
              setQuery("");
            }}
          />
        )}
        <div className="ct-between mt-4 text-xs ct-muted">
          <span>
            {filtered.length ? (currentPage - 1) * 5 + 1 : 0} –{" "}
            {Math.min(currentPage * 5, filtered.length)} of {filtered.length}
          </span>
          <div className="ct-toolbar">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage * 5 >= filtered.length}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
  return (
    <Shell
      kind="pulse"
      view={view}
      setView={(v) => {
        setView(v);
        setQuery("");
        setFilter("All");
        setPage(1);
        setSelectedTickets([]);
      }}
      query={query}
      setQuery={setQuery}
    >
      {view === "Dashboard" ? (
        <>
          <div className="ct-heading">
            <p>Queue health, SLA risk and today's escalations.</p>
            <span className="ct-subtle">● Updated just now</span>
          </div>
          <div className="ct-stats">
            {[
              ["Unresolved", "24", "-8.3%", "New, Open, Pending and On hold.", "Unassigned: 6"],
              [
                "Overdue",
                "6",
                "-12.5%",
                "Past their first response target.",
                "Breaching within 1h: 2",
              ],
              [
                "Solved today",
                "38",
                "+14.2%",
                "18 resolved on first contact.",
                "Median handle time: 1h 12m",
              ],
              ["CSAT", "94.2%", "+2.4%", "From 118 of 402 surveys sent.", "Response rate: 29%"],
            ].map((s, i) => {
              const Icon = [Inbox, Clock, CheckCircle, Smile][i];
              return (
                <Frame spacing="sm" key={s[0]}>
                  <FrameHeader>
                    <div className="ct-between">
                      <FrameTitle>{s[0]}</FrameTitle>
                      <Icon size={16} className="ct-muted" />
                    </div>
                  </FrameHeader>
                  <FramePanel>
                    <div className="ct-stat-value">
                      <strong>{s[1]}</strong>
                      <Badge variant={i < 2 ? "destructive-light" : "success-light"}>{s[2]}</Badge>
                    </div>
                    <div className="ct-stat-note">
                      {s[3]}
                      <br />
                      {s[4]}
                    </div>
                  </FramePanel>
                </Frame>
              );
            })}
          </div>
          <div className="ct-two ct-section">
            <Frame>
              <FrameHeader>
                <div className="ct-between">
                  <div>
                    <FrameTitle>Queue Load</FrameTitle>
                    <FrameDescription>Open tickets by queue</FrameDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setView("Tickets")}>
                    View All
                  </Button>
                </div>
              </FrameHeader>
              <FramePanel>
                <span className="ct-subtle">OPEN TICKETS</span>
                <div className="ct-between">
                  <strong className="text-2xl">24</strong>
                  <Badge variant="outline">4 Queues</Badge>
                </div>
                <div className="ct-queue-bar">
                  {[37, 29, 21, 13].map((n, i) => (
                    <span
                      key={n}
                      style={{
                        width: n + "%",
                        background: [
                          "var(--ct-purple)",
                          "var(--ct-blue)",
                          "var(--ct-orange)",
                          "var(--ct-green)",
                        ][i],
                      }}
                    />
                  ))}
                </div>
                <div className="ct-queue-stack">
                  {[
                    ["Technical", "Product faults and outages", "9", "Over SLA"],
                    ["Billing", "Invoices, refunds and plans", "7", "Nearing SLA"],
                    ["Onboarding", "Setup and migration help", "5", "Nearing SLA"],
                    ["Account", "Access, seats and security", "3", "Within SLA"],
                  ].map((q, i) => (
                    <button
                      type="button"
                      className="ct-queue-row"
                      key={q[0]}
                      onClick={() => {
                        setView("Tickets");
                        setFilter(q[0]);
                      }}
                    >
                      <span
                        className="ct-queue-dot"
                        style={{
                          background: [
                            "var(--ct-purple)",
                            "var(--ct-blue)",
                            "var(--ct-orange)",
                            "var(--ct-green)",
                          ][i],
                        }}
                      />
                      <span className="text-left">
                        {q[0]}
                        <small>{q[1]}</small>
                      </span>
                      <b>{q[2]}</b>
                      <Badge
                        variant={
                          i === 0
                            ? "destructive-light"
                            : i === 3
                              ? "success-light"
                              : "warning-light"
                        }
                      >
                        {q[3]}
                      </Badge>
                    </button>
                  ))}
                </div>
                <p className="ct-subtle mt-4">Technical is past SLA; Account has spare capacity.</p>
              </FramePanel>
            </Frame>
            <Frame>
              <FrameHeader>
                <div className="ct-between">
                  <div>
                    <FrameTitle>First Contact Resolution</FrameTitle>
                    <FrameDescription>Weekly rate tracked against target</FrameDescription>
                  </div>
                  <span className="ct-chart-legend">First contact resolution</span>
                </div>
              </FrameHeader>
              <FramePanel>
                <ResolutionChart />
              </FramePanel>
              <div className="ct-panel-foot ct-toolbar">
                <Bell size={16} />
                First contact resolution drop <Badge variant="outline">Armed</Badge>
                <span>Fires below 55% · 2 day window</span>
              </div>
            </Frame>
          </div>
          {table}
        </>
      ) : view === "Tickets" ? (
        <>
          <div className="ct-heading">
            <p>Every open ticket, by stage.</p>
            <div className="ct-toolbar">
              <Button
                variant="outline"
                onClick={() => setLayout(layout === "List" ? "Board" : "List")}
              >
                {layout === "List" ? "Board view" : "List view"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter />
                    {priority === "All" ? "Filters" : priority}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Priority</DropdownMenuLabel>
                  {["All", "Urgent", "High", "Normal", "Low"].map((value) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => {
                        setPriority(value);
                        setPage(1);
                      }}
                    >
                      {value === "All" ? (
                        "All priorities"
                      ) : (
                        <Badge variant="outline">{value}</Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {layout === "Board" && (
                <Button ref={newBoardTicket} onClick={openNewTicket}>
                  <Plus />
                  New ticket
                </Button>
              )}
            </div>
          </div>
          {layout === "Board" ? (
            <PulseBoard
              columns={boardColumns}
              onColumnsChange={(columns) =>
                setTickets((current) =>
                  applyPulseTicketColumns(
                    current,
                    columns,
                    filtered.map((ticket) => ticket.id),
                  ),
                )
              }
              onCreate={openNewTicket}
              onOpen={openTicket}
            />
          ) : (
            table
          )}
        </>
      ) : view === "Contacts" || view === "Team" ? (
        <PulseDirectory
          key={view}
          team={view === "Team"}
          query={query}
          setQuery={setQuery}
          rows={view === "Team" ? memberRecords : contactRecords}
          setRows={view === "Team" ? setMemberRecords : setContactRecords}
        />
      ) : view === "Knowledge Base" ? (
        <PulseKnowledgeBase query={query} articleId={article} setArticleId={setArticle} />
      ) : view === "Reports" ? (
        <PulseReports model={reportModel} />
      ) : (
        <PulseSettings model={settingsModel} />
      )}
      <ReferenceSheet
        header={detailTicket ? <PulseTicketDetailHeader ticketId={detailTicket.id} /> : undefined}
        closeButton={
          detailTicket ? (
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute"
                aria-label="Close ticket detail"
              >
                <X className="size-3.5" aria-hidden="true" />
              </Button>
            </SheetClose>
          ) : undefined
        }
        title={
          create
            ? editing
              ? editing.escalation
                ? "Edit escalation"
                : "Edit ticket"
              : creatingBoardTicket
                ? "New ticket"
                : "New escalation"
            : selected?.subject || "Ticket"
        }
        width={create ? 512 : 480}
        open={create || !!selected}
        onCloseAutoFocus={restoreTicketFocus}
        onClose={() => {
          setCreate(false);
          setEditing(null);
          setSelected(null);
        }}
        footer={
          create ? (
            <>
              <Button
                variant="outline"
                className={creatingBoardTicket ? undefined : "flex-1"}
                onClick={() => {
                  setCreate(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className={creatingBoardTicket ? undefined : "flex-1"}
                type="submit"
                form={creatingBoardTicket ? "pulse-new-ticket-form" : "ct-escalation-form"}
              >
                {creatingBoardTicket
                  ? "Create ticket"
                  : editing
                    ? "Save changes"
                    : "Raise escalation"}
              </Button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="More ticket actions">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(selected);
                      setSelected(null);
                      setCreate(true);
                    }}
                  >
                    Edit ticket
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={() => {
                  setTickets((current) =>
                    removePulseTickets(current, selected ? [selected.id] : []),
                  );
                  setSelected(null);
                }}
              >
                Delete
              </Button>
              <Button
                onClick={() => {
                  if (selected)
                    toast("Reply started", {
                      description: `${selected.id} · ${selected.requester ? `${selected.requester} at ` : ""}${selected.customer}`,
                    });
                }}
              >
                Reply
              </Button>
            </>
          )
        }
      >
        {creatingBoardTicket ? (
          <PulseCreateTicketFields
            formId="pulse-new-ticket-form"
            agents={[...new Set(tickets.map((ticket) => ticket.agent))]}
            onSubmit={(values) => {
              setTickets(
                (current) =>
                  savePulseTicket(
                    current,
                    createPulseBoardTicket(current, values),
                    undefined,
                    false,
                  ).tickets,
              );
              setCreate(false);
              setEditing(null);
              setSelectedTickets([]);
              setPage(1);
            }}
          />
        ) : create ? (
          <form
            key={editing?.id || "new"}
            id="ct-escalation-form"
            className="ct-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const ticket: TicketRecord = {
                id: String(f.get("key")),
                customer: String(f.get("customer")),
                email: editing?.email || "",
                agent: String(f.get("agent")),
                stage: editing && !editing.escalation ? editing.stage : "Escalated",
                due: editing?.due || "Today",
                queue: String(f.get("queue")),
                value: editing?.value || "—",
                sla: String(f.get("sla")),
                subject: String(f.get("subject")),
              };
              const result = savePulseTicket(tickets, ticket, editing?.id, view === "Dashboard");
              if (result.error) {
                const key = e.currentTarget.elements.namedItem("key");
                if (key instanceof HTMLInputElement) {
                  key.setCustomValidity(result.error);
                  key.reportValidity();
                }
                return;
              }
              setTickets(result.tickets);
              setSelectedTickets([]);
              setCreate(false);
              setEditing(null);
              setPage(1);
            }}
          >
            <div className="ct-field-pair">
              <label>
                Ticket key
                <Input
                  name="key"
                  placeholder="TCK-4821"
                  defaultValue={editing?.id}
                  onChange={(event) => event.currentTarget.setCustomValidity("")}
                  required
                />
              </label>
              <label>
                SLA state
                <Select name="sla" defaultValue={editing?.sla} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Blocked", "At Risk", "Delayed", "On Time"].map((v) => (
                      <SelectItem value={v} key={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <label>
              Requester
              <Input
                name="customer"
                defaultValue={editing?.customer}
                placeholder="Atlas Freight"
                required
              />
            </label>
            <div className="ct-field-pair">
              <label>
                Queue
                <Select name="queue" defaultValue={editing?.queue} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a queue" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Technical", "Billing", "Onboarding", "Account"].map((v) => (
                      <SelectItem value={v} key={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label>
                Handling
                <Select name="handling" defaultValue={editing ? "Manual" : undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a level" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Manual", "Automated", "Priority"].map((v) => (
                      <SelectItem value={v} key={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <label>
              Assignee
              <Input
                name="agent"
                defaultValue={editing?.agent}
                placeholder="Priya Patel"
                required
              />
            </label>
            <label>
              What is blocking it
              <Textarea
                name="subject"
                defaultValue={editing?.subject}
                placeholder="Invoice total disputed after the plan change"
                required
              />
            </label>
          </form>
        ) : selected ? (
          <PulseTicketDetail ticket={selected} />
        ) : null}
      </ReferenceSheet>
    </Shell>
  );
}
