import { CohortSettings, useCohortSettingsState, cohortSettingsPages } from "./cohort-settings";
import { CohortPeople, useCohortPeopleState } from "./cohort-people";
import { CohortHiring, useCohortHiringState, resetCohortHiring } from "./cohort-hiring";
import CohortCalendar from "./cohort-calendar";
import CohortApprovals, { useCohortApprovalsState, resetCohortApprovals } from "./cohort-approvals";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tone } from "./fidelity";
import { useState } from "react";
import { Users, UserRoundPlus, UserRoundMinus, CalendarDays } from "lucide-react";
import {
  Shell,
  Heading,
  Panel,
  Button,
  Badge,
  Period,
  Spark,
  Area,
  DataTable,
  RecordDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  toast,
} from "./shared";
import { Auth } from "./auth";
type Request = {
  name: string;
  type: string;
  person: string;
  waiting: string;
  status: string;
};
const originalRequests: Request[] = [
  {
    name: "Promotion to Staff Engineer",
    type: "Compensation",
    person: "Amara Okafor",
    waiting: "13d",
    status: "Pending",
  },
  {
    name: "Onsite support visit: £2,310",
    type: "Expense",
    person: "Grace Adeyemi",
    waiting: "8d",
    status: "Pending",
  },
  {
    name: "Client dinner: £1,420",
    type: "Expense",
    person: "Elena Petrova",
    waiting: "7d",
    status: "Pending",
  },
  {
    name: "5 days unpaid leave",
    type: "Leave",
    person: "Rafael Costa",
    waiting: "6d",
    status: "Pending",
  },
  {
    name: "Offer sign-off: Senior Engineer",
    type: "Offer",
    person: "Amara Okafor",
    waiting: "6d",
    status: "Pending",
  },
];
export default function Cohort() {
  const hiringState = useCohortHiringState();
  const approvalsState = useCohortApprovalsState();
  const [logged, setLogged] = useState(false);
  const [active, setActive] = useState("Dashboard");
  const [period, setPeriod] = useState("Year");
  const peopleState = useCohortPeopleState();
  const [requests, setRequests] = useState(originalRequests);
  const settingsState = useCohortSettingsState();
  const [create, setCreate] = useState(false);
  const [event, setEvent] = useState("");
  const [selected, setSelected] = useState<Request | null>(null);
  const [extraEvents, setExtraEvents] = useState<string[]>([]);
  if (!logged) return <Auth id="cohort" onLogin={() => setLogged(true)} />;
  const calendar = <CohortCalendar onEvent={setEvent} extraEvents={extraEvents} />;
  return (
    <Shell
      id="cohort"
      brand="Cohort"
      account={{
        name: settingsState.saved.profile.fields.name,
        organisation: settingsState.saved.company.fields.name,
        photo: settingsState.saved.profile.fields.photo,
      }}
      active={active}
      setActive={(x) => {
        setActive(x === "Settings" ? "Organisation" : x === "Directory" ? "People" : x);
      }}
      items={["Dashboard", "Approvals", "People", "Hiring", "Time", "Settings"]}
      navGroups={{ Settings: cohortSettingsPages, People: ["Directory"] }}
      top={
        <span>
          ⌂ People –{" "}
          {cohortSettingsPages.includes(active)
            ? `Settings – ${active}`
            : active === "People"
              ? "Directory"
              : active}
        </span>
      }
      footer={
        <div className="bt-info">
          <strong>Headcount plan</strong>Approved headcount for FY26. Resets when the plan is
          re-baselined.
          <div className="bt-progress mt-3 mb-2">
            <i style={{ width: "92%" }} />
          </div>
          <span>92% Filled　　8% Open</span>
        </div>
      }
    >
      {cohortSettingsPages.includes(active) ? (
        <CohortSettings
          page={active}
          onPage={setActive}
          model={settingsState}
          onClearPeople={peopleState.reset}
          onClearHiring={() => resetCohortHiring(hiringState)}
          onClearApprovals={() => resetCohortApprovals(approvalsState)}
          onClearNotes={() =>
            peopleState.setPeople((rows) => rows.map((p) => ({ ...p, notes: "" })))
          }
          onClearLeave={() => setExtraEvents([])}
        />
      ) : (
        <>
          {active === "People" ? (
            <div className="bt-cohort-people-heading">
              <h1>People</h1>
              <Button size="sm" onClick={() => setCreate(true)}>
                <UserRoundPlus size={14} />
                Add person
              </Button>
            </div>
          ) : (
            <Heading
              title={active === "Dashboard" ? "" : active}
              date="Jul 1, 2026 - Jul 30, 2026"
              action={
                active === "People" ? "Add person" : active === "Time" ? "Add event" : undefined
              }
              onAction={() => setCreate(true)}
            />
          )}
          {active === "Dashboard" ? (
            <>
              <Panel
                title="Workforce overview"
                description="Headcount, hiring pressure and absence in one pass."
                action={<Period value={period} onChange={setPeriod} />}
              >
                <div className="bt-cohort-summary">
                  {[
                    ["Headcount", String(198 + peopleState.people.length - 21), "+3", Users],
                    ["Open roles", "5", "+2", UserRoundPlus],
                    ["Voluntary attrition", "12.8%", "+0.9", UserRoundMinus],
                    ["Absence rate", "1%", "-0.6", CalendarDays],
                  ].map(([label, value, change, Icon], i) => {
                    const MetricIcon = Icon as typeof Users;
                    return (
                      <div key={String(label)}>
                        <div className="bt-pills mb-3">
                          <MetricIcon size={15} />
                          <span>{String(label)}</span>
                        </div>
                        <div className="bt-stat-line">
                          <div>
                            <strong className="text-2xl">{String(value)}</strong>
                            <br />
                            <Badge variant={i === 2 ? "destructive-light" : "success-light"}>
                              {String(change)}
                            </Badge>
                          </div>
                          <Spark index={i} color={i === 3 ? "var(--bt-red)" : "var(--bt-green)"} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="bt-row mt-4">
                  <span className="text-xs text-muted-foreground">
                    28 hires, 25 exits, now 198.
                  </span>
                  <Button variant="link" size="sm" onClick={() => setActive("People")}>
                    View the directory →
                  </Button>
                </div>
              </Panel>
              <div className="bt-grid-wide">
                {calendar}
                <div className="bt-stack">
                  <Panel
                    title="H2 review cycle"
                    description="Where reviews stand."
                    action={
                      <Button variant="outline" size="sm" onClick={() => setActive("People")}>
                        All teams　⌄
                      </Button>
                    }
                  >
                    <div className="flex justify-between text-muted-foreground">
                      <span>Reviews complete</span>
                      <strong>8 / 25</strong>
                    </div>
                    <div className="bt-progress mt-2">
                      <i style={{ width: "32%" }} />
                    </div>
                    <div className="bt-review-stats">
                      {[
                        ["9", "Not started"],
                        ["4", "Self review"],
                        ["4", "Manager review"],
                      ].map(([n, label]) => (
                        <div key={label}>
                          <strong className="bt-positive">{n}</strong>
                          {label}
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                      Cycle closes in <strong>32 days</strong>
                    </p>
                  </Panel>
                  <Panel title="Headcount" description="Starters against leavers.">
                    <strong className="bt-stat-value">
                      {period === "Week" ? "195" : period === "Month" ? "197" : "198"}
                    </strong>
                    <p className="text-muted-foreground">
                      <span className="bt-positive">↗ +3</span> net over 12M
                    </p>
                    <Area mono />
                  </Panel>
                </div>
              </div>
              <Panel
                title="Awaiting your action"
                description={`${requests.filter((r) => r.status === "Pending").length} waiting, 2 urgent, oldest 13d`}
                action={
                  <Button variant="outline" size="sm" onClick={() => setActive("Approvals")}>
                    All requests
                  </Button>
                }
              >
                <DataTable
                  columns={["Request", "Type", "Requested by", "Waiting", "Status"]}
                  rows={requests.map((r) => [r.name, r.type, r.person, r.waiting, r.status])}
                  onRow={(i) => setSelected(requests[i])}
                />
              </Panel>
            </>
          ) : active === "People" ? (
            <CohortPeople
              model={peopleState}
              organisation={settingsState.saved.company.fields.name}
              create={create}
              onCreateChange={setCreate}
              departmentOptions={settingsState.saved.departments.rows?.map((r) => r.name)}
              locationOptions={settingsState.saved.locations.rows?.map((r) => r.name)}
              employmentOptions={settingsState.saved.employment.rows?.map((r) => r.name)}
            />
          ) : active === "Approvals" ? (
            <CohortApprovals model={approvalsState} />
          ) : active === "Time" ? (
            calendar
          ) : (
            <CohortHiring model={hiringState} />
          )}
        </>
      )}
      <RecordDialog
        title={active === "People" ? "Add person" : "Add event"}
        open={create && active !== "People"}
        onOpenChange={setCreate}
        fields={
          active === "People"
            ? [
                { name: "name", label: "Full name" },
                { name: "department", label: "Department", value: "Engineering" },
                { name: "role", label: "Job title" },
                { name: "location", label: "Location", value: "London" },
              ]
            : [
                { name: "name", label: "Event title" },
                { name: "date", label: "Date", type: "date", value: "2026-07-24" },
              ]
        }
        onSave={(v) => {
          setExtraEvents((x) => [...x, v.name]);
          toast.success("Record added");
        }}
      />
      <Sheet open={!!event} onOpenChange={(v) => !v && setEvent("")}>
        <SheetContent className="bt-floating-sheet bt-event-sheet">
          <SheetHeader>
            <SheetTitle>{event}</SheetTitle>
            <SheetDescription>
              <Tone tone="neutral">All day</Tone>
            </SheetDescription>
          </SheetHeader>
          <div className="bt-event-details">
            <p>
              <CalendarDays size={16} />
              <span>
                Friday 10 July<small>All day</small>
              </span>
            </p>
            <p>
              <span className="bt-leave-dot" />
              Time off
            </p>
            <p>
              <CalendarDays size={16} />1 working day
            </p>
            <p>
              <span className="bt-avatar">AR</span>
              <span>
                {event.split(":")[0]}
                <small>Marketing Manager, Marketing, reports to Isabel Ferreira</small>
              </span>
            </p>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setEvent("")}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              {selected?.type} request from {selected?.person}
            </DialogDescription>
          </DialogHeader>
          <p>
            Waiting {selected?.waiting} · {selected?.status}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setRequests((x) =>
                  x.map((r) => (r === selected ? { ...r, status: "Declined" } : r)),
                );
                setSelected(null);
                toast("Request declined");
              }}
            >
              Decline
            </Button>
            <Button
              onClick={() => {
                setRequests((x) =>
                  x.map((r) => (r === selected ? { ...r, status: "Approved" } : r)),
                );
                setSelected(null);
                toast.success("Request approved");
              }}
            >
              Approve request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
