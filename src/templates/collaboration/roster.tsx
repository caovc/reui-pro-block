import { RosterSettings } from "./roster-settings";
import { rosterSettingsTabs, useRosterSettingsState } from "./roster-settings-model";
import { RosterImport } from "./roster-import";
import { useRosterImportState } from "./roster-import-model";
import { RosterApprovals } from "./roster-approvals";
import { useRosterApprovalsState } from "./roster-approvals-model";
import { MiniTrend } from "@/blocks/data/sparkline-primitives";
import { RosterHiring, useRosterHiringState } from "./roster-hiring";
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
} from "@/components/reui/frame";
import { RosterDirectory } from "./roster-directory";
import { rosterPersonNames } from "./roster-directory-data";
import { RosterCalendar } from "./roster-calendar";
import { useState } from "react";
import { Plus, CalendarDays, Users, UserPlus, UserMinus, ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Shell,
  Button,
  Input,
  Avatar,
  Modal,
  ReferenceSheet,
  Export,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./shared";
const initialPeople = [
  ["Aisha Rahman", "Marketing", "Marketing Manager", "London", "Full-time"],
  ["Amara Okafor", "Engineering", "Staff Engineer", "London", "Full-time"],
  ["Bruno Duarte", "People", "People Partner", "London", "Full-time"],
  ["Daniel Reyes", "Engineering", "Senior Engineer", "Madrid", "Full-time"],
  ["Ingrid Larsen", "Design", "Product Designer", "Copenhagen", "Full-time"],
  ["Hannah Weber", "Product", "Product Manager", "Berlin", "Full-time"],
  ["Joon-ho Park", "Engineering", "Software Engineer", "Seoul", "Full-time"],
  ["Marco Bianchi", "Sales", "Account Executive", "Milan", "Full-time"],
  ["Priya Nair", "Customer Success", "Customer Success Lead", "London", "Full-time"],
  ["Abena Mensah", "People", "People Operations", "Accra", "Full-time"],
];
const baseEvents: Record<number, string> = {
  11: "Aisha Rahman: annual leave",
  14: "Ingrid Larsen: annual leave",
  21: "Weekly leads sync",
  22: "Screening: Senior Engineer",
  23: "Weekly 1:1",
  24: "Panel: Support Engineer",
  28: "Abena Mensah: parental leave",
  29: "H2 calibration: Engineering",
  30: "Priya Nair: annual leave",
  35: "First day: Joon-ho Park",
  36: "Assessment debrief",
  37: "Screening: Product Manager",
};
export default function Roster() {
  const [view, setView] = useState("Dashboard");
  const settingsState = useRosterSettingsState();
  const hiringState = useRosterHiringState();
  const [initialHiring] = useState(() => structuredClone(hiringState.columns));
  const importState = useRosterImportState(rosterPersonNames);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("Year");
  const [people, setPeople] = useState(initialPeople);
  const approvalState = useRosterApprovalsState();
  const pending = approvalState.requests.filter((r) => r.decision === "Pending");
  const [modal, setModal] = useState("");
  const [detail, setDetail] = useState<string[] | null>(null);
  const [events, setEvents] = useState(baseEvents);
  const [eventDay, setEventDay] = useState(0);
  function changeView(next: string) {
    if (rosterSettingsTabs.includes(next)) settingsState.setTab(next);
    setView(next);
  }
  function saveApprovalFlows(flows: Record<string, string>) {
    approvalState.setRequests((requests) =>
      requests.map((request) => ({
        ...request,
        approver: flows[request.type] || request.approver,
      })),
    );
  }
  const canClear = {
    people: people.length !== initialPeople.length || importState.applied.length > 0,
    approvals: approvalState.requests.some((request) => request.decision !== "Pending"),
    hiring:
      JSON.stringify(hiringState.columns) !== JSON.stringify(initialHiring) ||
      hiringState.scheduled.length > 0,
    notes: false,
    leave: false,
    timesheets: false,
  };
  function clearChanges(key: string) {
    if (key === "people") {
      setPeople(initialPeople);
      importState.setApplied([]);
      importState.setResult(null);
    } else if (key === "approvals") {
      approvalState.setRequests((requests) =>
        requests.map((request) => ({ ...request, decision: "Pending" })),
      );
    } else if (key === "hiring") {
      hiringState.setColumns(structuredClone(initialHiring));
      hiringState.setScheduled([]);
    }
  }
  const monthName = "Jul 1, 2026 - Jul 30, 2026";
  const calendar = (
    <RosterCalendar
      events={events}
      onOpen={setModal}
      onCreate={(day) => {
        setEventDay(day);
        setModal("New event");
      }}
    />
  );
  const approvals = (
    <Frame>
      <FrameHeader>
        <div className="ct-between">
          <div>
            <FrameTitle>Awaiting your action</FrameTitle>
            <FrameDescription>
              {pending.length} waiting, oldest {pending[0]?.waiting || 0}d
            </FrameDescription>
          </div>
          <Button variant="outline" onClick={() => setView("Approvals")}>
            All requests
          </Button>
        </div>
      </FrameHeader>
      <FramePanel>
        <div className="ct-table-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                {["Request", "Type", "Requested by", "Waiting", ""].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending
                .filter((r) =>
                  Object.values(r).join(" ").toLowerCase().includes(query.toLowerCase()),
                )
                .slice(0, 5)
                .map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <b>{r.title}</b>
                      <small className="block ct-muted mt-1">{r.description}</small>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="ct-person">
                        <Avatar name={r.requester} />
                        {r.requester}
                      </span>
                    </TableCell>
                    <TableCell>{r.waiting}d</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          approvalState.decide(r.id, "Approved");
                          toast.success("Request approved");
                        }}
                      >
                        <Check />
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        {pending.length === 0 && <p className="ct-muted py-4">All requests have a decision.</p>}
      </FramePanel>
    </Frame>
  );
  return (
    <Shell
      kind="roster"
      view={view}
      setView={changeView}
      query={query}
      setQuery={setQuery}
      rosterIdentity={{ ...settingsState.profile.saved, company: settingsState.company.saved.name }}
      extra={
        view === "Dashboard" ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setView("Time")}>
              <CalendarDays />
              {monthName}
            </Button>
            <Export
              rows={[["Name", "Department", "Role", "Location", "Type"], ...people]}
              name="roster-people"
            />
          </>
        ) : undefined
      }
    >
      {view === "Dashboard" ? (
        <>
          <Frame className="ct-section">
            <FrameHeader>
              <div className="ct-between">
                <div>
                  <FrameTitle>Workforce overview</FrameTitle>
                  <FrameDescription>
                    Headcount, hiring pressure and absence in one pass.
                  </FrameDescription>
                </div>
                <div className="ct-segment">
                  {["Week", "Month", "Year"].map((p) => (
                    <Button
                      size="sm"
                      variant={period === p ? "outline" : "ghost"}
                      key={p}
                      onClick={() => setPeriod(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            </FrameHeader>
            <FramePanel>
              <div className="ct-roster-stats">
                {[
                  [
                    "Headcount",
                    period === "Year" ? "198" : period === "Month" ? "196" : "195",
                    "+3",
                  ],
                  ["Open roles", "5", "+2"],
                  ["Voluntary attrition", "12.8%", "+0.9"],
                  ["Absence rate", "1.5%", "-0.6"],
                ].map((s, i) => {
                  const Icon = [Users, UserPlus, UserMinus, CalendarDays][i];
                  return (
                    <div className="ct-roster-stat" key={s[0]}>
                      <span>
                        <Icon size={14} />
                        {s[0]}
                      </span>
                      <div>
                        <span>
                          <strong>{s[1]}</strong>
                          <br />
                          <Badge variant={i === 3 ? "destructive-light" : "success-light"}>
                            ↗ {s[2]}
                          </Badge>
                        </span>
                        <MiniTrend
                          label={s[0] + " trend"}
                          values={
                            [
                              [52, 48, 45, 35, 43, 52, 47, 52, 57, 62],
                              [38, 40, 58, 70, 65, 47, 35, 42, 61, 45],
                              [45, 43, 51, 58, 62, 65, 58, 51, 55, 48],
                              [54, 48, 57, 42, 46, 41, 40, 47, 48, 43],
                            ][i]
                          }
                          color={i === 3 ? "#ef4444" : "var(--ct-green)"}
                          height={60}
                          domain={[20, 75]}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </FramePanel>
            <div className="ct-panel-foot ct-between">
              <span>28 hires, 25 exits, now 198.</span>
              <Button size="sm" variant="ghost" onClick={() => setView("People")}>
                View the directory
                <ArrowRight />
              </Button>
            </div>
          </Frame>
          <div className="ct-roster-columns ct-section">
            {calendar}
            <div className="ct-roster-side">
              <Frame>
                <FrameHeader>
                  <div className="ct-between">
                    <div>
                      <FrameTitle>H2 review cycle</FrameTitle>
                      <FrameDescription>Where reviews stand.</FrameDescription>
                    </div>
                    <Select defaultValue="All teams">
                      <SelectTrigger aria-label="Review team">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["All teams", "Engineering", "People", "Sales"].map((t) => (
                          <SelectItem value={t} key={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </FrameHeader>
                <FramePanel>
                  <div className="ct-between">
                    <span className="ct-muted">Reviews complete</span>
                    <b>9 / 21</b>
                  </div>
                  <div className="ct-progress">
                    <span style={{ width: "43%" }} />
                  </div>
                  <div className="ct-review-stages">
                    {["Not started", "Self review", "Manager review"].map((s) => (
                      <div key={s}>
                        <b>4</b>
                        {s}
                      </div>
                    ))}
                  </div>
                  <p className="text-center ct-subtle">
                    Cycle closes in <b>32 days</b>
                  </p>
                </FramePanel>
              </Frame>
              <Frame>
                <FrameHeader>
                  <FrameTitle>Headcount</FrameTitle>
                  <FrameDescription>Starters against leavers.</FrameDescription>
                </FrameHeader>
                <FramePanel>
                  <strong className="text-3xl">198</strong>
                  <p className="ct-subtle">↗ +3 net over 12M</p>
                  <svg
                    viewBox="0 0 336 180"
                    className="ct-roster-headcount"
                    aria-label="Headcount trend"
                  >
                    <defs>
                      <linearGradient id="roster-chart" x1="0" y1="0" x2="0" y2="1">
                        <stop stopColor="#777" stopOpacity=".7" />
                        <stop offset="1" stopColor="#777" stopOpacity=".03" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 62 C12 50 18 43 28 50 S48 77 60 76 S82 85 92 90 S112 130 124 128 S146 87 156 88 S178 56 188 62 S210 84 220 74 S242 30 252 36 S274 58 284 48 S310 32 336 22 V180H0Z"
                      fill="url(#roster-chart)"
                    />
                    <path
                      d="M0 62 C12 50 18 43 28 50 S48 77 60 76 S82 85 92 90 S112 130 124 128 S146 87 156 88 S178 56 188 62 S210 84 220 74 S242 30 252 36 S274 58 284 48 S310 32 336 22"
                      fill="none"
                      stroke="#555"
                      strokeWidth="2"
                    />
                    {[
                      [0, 62],
                      [28, 50],
                      [60, 76],
                      [92, 90],
                      [124, 128],
                      [156, 88],
                      [188, 62],
                      [220, 74],
                      [252, 36],
                      [284, 48],
                      [312, 32],
                      [336, 22],
                    ].map(([x, y]) => (
                      <circle
                        key={x}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#666"
                        stroke="white"
                        strokeWidth="1.5"
                      />
                    ))}
                  </svg>
                </FramePanel>
              </Frame>
            </div>
          </div>
          {approvals}
        </>
      ) : view === "People" ? (
        <>
          <div className="ct-heading">
            <h1>People</h1>
            <Button onClick={() => setModal("Add person")}>
              <Plus />
              Add person
            </Button>
          </div>
          <RosterDirectory
            imports={importState.applied}
            extras={people}
            query={query}
            setQuery={setQuery}
            onOpen={setDetail}
          />
        </>
      ) : view === "Import" ? (
        <RosterImport model={importState} onPeople={() => setView("People")} />
      ) : view === "Approvals" ? (
        <RosterApprovals model={approvalState} />
      ) : view === "Time" ? (
        <>
          <div className="ct-heading">
            <div>
              <h1>Team calendar</h1>
              <p>Leave, interviews and everything in between.</p>
            </div>
          </div>
          {calendar}
        </>
      ) : view === "Hiring" ? (
        <RosterHiring query={query} state={hiringState} />
      ) : (
        <RosterSettings
          model={settingsState}
          onTabChange={changeView}
          onFlowsSave={saveApprovalFlows}
          onClear={clearChanges}
          canClear={canClear}
        />
      )}
      <ReferenceSheet
        title={modal}
        open={!!modal && !["Add person", "Add candidate", "New event"].includes(modal)}
        onClose={() => setModal("")}
        footer={
          <Button variant="outline" className="ml-auto" onClick={() => setModal("")}>
            Close
          </Button>
        }
      >
        <section className="ct-detail-section">
          <Badge variant="secondary">All day</Badge>
          <h3 className="mt-6">{modal.includes("Ingrid") ? "13 Jul - 14 Jul" : "July 2026"}</h3>
          <p>All day · {modal.includes("Ingrid") ? "2 calendar days" : "1 calendar day"}</p>
        </section>
        <section className="ct-detail-section">
          <h3>{modal.includes("leave") ? "Time off" : "Team event"}</h3>
          <p>{modal.includes("Ingrid") ? "2 working days" : "Scheduled on the team calendar"}</p>
        </section>
        <section className="ct-detail-section">
          <div className="ct-person">
            <Avatar name={modal.split(":")[0]} />
            <div>
              <b>{modal.split(":")[0]}</b>
              <p className="ct-muted text-xs">
                {modal.includes("Ingrid")
                  ? "Finance Manager, Finance, reports to Isabel Ferreira"
                  : "Roster UK"}
              </p>
            </div>
          </div>
        </section>
      </ReferenceSheet>
      <Modal
        title={modal}
        open={!!modal && ["Add person", "Add candidate", "New event"].includes(modal)}
        onClose={() => setModal("")}
      >
        <form
          className="ct-form"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const name = String(data.get("name") || "");
            if (modal === "Add person" || modal === "Add candidate")
              setPeople((p) => [
                [
                  name,
                  String(data.get("department") || "Engineering"),
                  modal === "Add candidate" ? "Candidate" : "New team member",
                  "London",
                  "Full-time",
                ],
                ...p,
              ]);
            else if (modal === "New event") setEvents((e) => ({ ...e, [eventDay]: name }));
            toast.success(modal === "New event" ? "Event added" : "Saved to workspace");
            setModal("");
          }}
        >
          {modal === "Add person" || modal === "Add candidate" || modal === "New event" ? (
            <>
              <label>
                {modal === "New event" ? "Event title" : "Full name"}
                <Input name="name" required autoFocus />
              </label>
              <label>
                {modal === "New event" ? "Notes" : "Department"}
                <Input
                  name="department"
                  defaultValue={modal === "New event" ? "" : "Engineering"}
                />
              </label>
              <Button type="submit">
                {modal === "New event" ? "Create event" : "Add to workspace"}
              </Button>
            </>
          ) : (
            <>
              <p>{modal}</p>
              <p className="ct-muted">July 2026 · Team calendar</p>
              <Textarea aria-label="Event notes" placeholder="Add a note…" />
              <Button type="submit">Save note</Button>
            </>
          )}
        </form>
      </Modal>
      <Modal title={detail?.[0] || "Person"} open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <div className="ct-person">
              <Avatar name={detail[0]} />
              <div>
                <b>{detail[2]}</b>
                <p className="ct-muted">
                  {detail[1]} · {detail[3]}
                </p>
              </div>
            </div>
            <p>Employment: {detail[4]}</p>
            <p>Manager: Bruno Duarte</p>
            <Button
              onClick={() => {
                toast.success("Profile review completed");
                setDetail(null);
              }}
            >
              Mark reviewed
            </Button>
          </>
        )}
      </Modal>
    </Shell>
  );
}
