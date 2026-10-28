import { miroClinicSeedDoctors } from "./miro-settings-integration";
import { ClinicSidebar, ClinicWorkspace, useClinicRecords } from "./miro-workspace";
import { Agenda, AppointmentCalendar } from "./miro-calendar";
import { IconTile } from "@/components/reui/icon-tile";
import { DayBreakdown, BookingSheet } from "./miro-detail";
import { useMemo, useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { MiroSettings, MiroSettingsNavigation } from "./miro-settings";
import { MiroNotifications } from "./miro-notifications";
import { useMiroSettingsModel } from "./miro-settings-model";
import type { MiroActivity } from "./miro-settings-data";
import {
  adaptMiroClinicInvoices,
  miroClinicAsOf,
  miroClinicInvoiceDueLabel,
  miroHourLabel,
  miroSavedProfileAvatar,
} from "./miro-settings-integration";
import { CalendarCheck, Gauge, Clock, TriangleAlert } from "lucide-react";
import {
  Shell,
  Heading,
  Panel,
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Bars,
  Area,
  DataTable,
  toast,
} from "./shared";
const doctors = miroClinicSeedDoctors;
type Appointment = {
  patient: string;
  doctor: string;
  procedure: string;
  time: string;
  status: string;
  date?: string;
  end?: string;
};
export default function Miro() {
  const clinicRecords = useClinicRecords();
  const ledger = useMemo(
    () => adaptMiroClinicInvoices(clinicRecords.invoices),
    [clinicRecords.invoices],
  );
  const [activities, setActivities] = useState<MiroActivity[]>([]);
  const settings = useMiroSettingsModel({
    invoices: ledger.invoices,
    activities,
    asOf: miroClinicAsOf,
  });
  const visibleChairs = settings.chairs.filter((chair) => chair.visible);
  const practitionerNames = visibleChairs.map((chair) => chair.name);
  const boardHours = Array.from(
    { length: settings.hours.closes - settings.hours.opens },
    (_, index) => miroHourLabel(settings.hours.opens + index),
  );
  const [clinicCreate, setClinicCreate] = useState(false);
  const [clinicRecord, setClinicRecord] = useState<string | null>(null);
  const [active, setActive] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [create, setCreate] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      patient: "Lena Morris",
      doctor: doctors[0],
      procedure: "General Checkup",
      time: "08:30",
      status: "Completed",
    },
    {
      patient: "Noah Williams",
      doctor: doctors[1],
      procedure: "Scaling",
      time: "09:00",
      status: "In Chair",
    },
    {
      patient: "Amelia James",
      doctor: doctors[2],
      procedure: "Crown Fitting",
      time: "10:15",
      status: "Booked",
    },
    {
      patient: "Oliver Scott",
      doctor: doctors[3],
      procedure: "Composite Filling",
      time: "09:30",
      status: "Arrived",
    },
    {
      patient: "Isla Bennett",
      doctor: doctors[4],
      procedure: "Whitening",
      time: "08:00",
      status: "Completed",
    },
  ]);
  return (
    <Tabs
      value={settings.section}
      onValueChange={settings.setSection}
      orientation="vertical"
      className="contents"
    >
      <Shell
        id="miro"
        brand="Miro"
        topWrapper="div"
        notifications={<MiroNotifications activities={settings.bellActivities} />}
        topbarNotifications={null}
        active={active}
        account={{
          name: settings.profileSaved.fullName,
          organisation: settings.profileSaved.email,
          photo: miroSavedProfileAvatar(settings.profileSaved),
        }}
        setActive={(page) => {
          if (page === "Profile") settings.setSection("profile");
          setActive(page === "Profile" ? "Settings" : page);
          setClinicRecord(null);
        }}
        items={[
          "Dashboard",
          "Appointments",
          "Calendar",
          "Customers",
          "Staff",
          "Payments",
          "Settings",
        ]}
        rail
        top={
          <div className="bt-clinic-header">
            {active === "Settings" ? (
              <h1 className="m-0 text-sm font-medium">Settings</h1>
            ) : (
              <strong>{active === "Dashboard" ? "Clinic Dashboard" : active}</strong>
            )}
            <span>
              {active === "Settings" ? null : ["Customers", "Staff", "Payments"].includes(
                  active,
                ) ? (
                <Button
                  onClick={() => (active === "Staff" ? setCreate(true) : setClinicCreate(true))}
                >
                  {active === "Customers"
                    ? "+ Add Patient"
                    : active === "Staff"
                      ? "+ New visit"
                      : "+ New invoice"}
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => toast.success("Clinic report prepared")}>
                    Export
                  </Button>
                  <Button onClick={() => navigator.clipboard?.writeText(location.href)}>
                    Share
                  </Button>
                </>
              )}
            </span>
          </div>
        }
        aside={
          active === "Settings" ? (
            <MiroSettingsNavigation model={settings} />
          ) : active === "Appointments" ? (
            <Agenda bookings={appointments.slice(5)} onCreate={() => setCreate(true)} />
          ) : ["Customers", "Staff", "Payments"].includes(active) ? (
            <ClinicSidebar active={active} data={clinicRecords} onSelect={setClinicRecord} />
          ) : (
            <>
              <div className="bt-row">
                <strong>Open Time</strong>
                <Clock size={16} />
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Today · 22 Oct</span>
                  <Badge variant="outline">18 slots</Badge>
                </div>
                <strong className="bt-stat-value">
                  27h 30m{" "}
                  <small className="text-xs text-muted-foreground font-normal">
                    still sellable
                  </small>
                </strong>
                <div className="bt-progress mt-2 mb-2">
                  <i style={{ width: "70%" }} />
                </div>
                <small className="text-muted-foreground">Across 5 chairs that ran</small>
              </div>
              <div className="bt-row">
                <span className="text-xs text-muted-foreground">OPEN BY CHAIR</span>
                <Badge variant="outline">5 of 9</Badge>
              </div>
              <strong>⌄ Chairs that ran</strong>
              <div className="bt-chair-list">
                {doctors.map((d, i) => (
                  <div key={d}>
                    <span>{d}</span>
                    <Badge variant="outline">{["6h 45m", "6h", "7h 15m", "3h", "4h 30m"][i]}</Badge>
                  </div>
                ))}
              </div>
              <div className="bt-row">
                <span className="text-xs text-muted-foreground">OPEN SLOTS · 30M+</span>
                <Badge variant="outline">18</Badge>
              </div>
              {doctors.map((d, i) => (
                <button className="bt-open-slot text-left" key={d} onClick={() => setCreate(true)}>
                  {
                    [
                      "8:00 AM to 8:30 AM",
                      "8:00 AM to 9:00 AM",
                      "8:00 AM to 10:15 AM",
                      "8:45 AM to 9:15 AM",
                      "9:00 AM to 9:30 AM",
                    ][i]
                  }
                  <small>{d} · 30m</small>
                </button>
              ))}
              <Button variant="ghost" onClick={() => setActive("Appointments")}>
                Show all 18
              </Button>
              <Button onClick={() => setCreate(true)}>+ Book the first open slot</Button>
              <Button variant="outline" onClick={() => setActive("Calendar")}>
                Open the board on this day
              </Button>
            </>
          )
        }
      >
        {active === "Settings" ? (
          <MiroSettings model={settings} />
        ) : ["Customers", "Staff", "Payments"].includes(active) ? (
          <ClinicWorkspace
            active={active}
            data={clinicRecords}
            billingSummary={settings.invoiceSummary}
            invoiceDueLabel={(id) =>
              miroClinicInvoiceDueLabel(
                ledger.invoices.find((invoice) => invoice.id === id),
                settings.paymentTerms,
                miroClinicAsOf,
              )
            }
            record={clinicRecord}
            onRecord={setClinicRecord}
            onBook={() => setCreate(true)}
            bookings={appointments.slice(5)}
            create={clinicCreate}
            onCreateChange={setClinicCreate}
          />
        ) : (
          <>
            <Heading
              title={active === "Dashboard" ? "Clinic overview" : active}
              action={
                ["Appointments", "Calendar"].includes(active) ? "Book appointment" : undefined
              }
              onAction={() => setCreate(true)}
              date="Today · 22 Oct"
            />
            {active === "Dashboard" ? (
              <>
                <div className="bt-grid-4">
                  {[
                    [
                      "Schedule",
                      "Booked Today",
                      "Appointments",
                      String(16 + appointments.length - 5),
                      "94% (kept)",
                      CalendarCheck,
                    ],
                    ["Capacity", "Chair Load", "Utilisation", "25%", "13h 30m (of 55h)", Gauge],
                    ["Open Time", "Still Sellable", "Unbooked", "27h 30m", "50% (18 slots)", Clock],
                    ["Risk", "Watchlist", "Needs Desk", "2", "1 (unpaid)", TriangleAlert],
                  ].map(([group, title, label, value, note, Icon]) => {
                    const StatIcon = Icon as typeof Clock;
                    return (
                      <Card key={String(title)}>
                        <CardContent>
                          <div className="flex items-center gap-3 mb-5">
                            <IconTile variant="frame" className="bt-stat-tile">
                              <StatIcon />
                            </IconTile>
                            <span>
                              <small className="bt-table-sub">{String(group)}</small>
                              {String(title)}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{String(label)}</p>
                          <div className="bt-stat-line">
                            <strong className="text-xl">{String(value)}</strong>
                            <span className="bt-positive text-xs">{String(note)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="bt-grid-2">
                  <Panel
                    title="Procedure Mix"
                    description="Chair Demand"
                    action={
                      <span className="text-xs text-muted-foreground">
                        ● Completed　● Scheduled
                      </span>
                    }
                  >
                    <Bars
                      multi
                      labels={[
                        "Checkup",
                        "Scaling",
                        "Whitening",
                        "Filling",
                        "Extraction",
                        "Crown",
                        "Braces",
                        "Implant",
                      ]}
                    />
                  </Panel>
                  <Panel
                    title="Patient Volume"
                    description="Appointments and new patients"
                    action={<Badge variant="outline">+12.8%</Badge>}
                  >
                    <Area />
                  </Panel>
                </div>
                <DayBreakdown />
              </>
            ) : active === "Appointments" ? (
              <AppointmentCalendar
                bookings={appointments.slice(5)}
                hours={settings.hours}
                chairs={settings.chairs}
                onCreate={() => setCreate(true)}
              />
            ) : active === "Calendar" ? (
              <>
                <div className="bt-toolbar">
                  <Input
                    placeholder="Search appointments..."
                    aria-label="Search appointments"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Button variant="outline" onClick={() => setActive("Appointments")}>
                    {active === "Calendar" ? "List view" : "Chair board"}
                  </Button>
                </div>
                {active === "Calendar" ? (
                  <Panel
                    title="Chair board"
                    description={`Thursday, 22 October · ${miroHourLabel(settings.hours.opens)}–${miroHourLabel(settings.hours.closes)}`}
                  >
                    <div className="bt-appointment-board">
                      <div>
                        <strong>Time</strong>
                        {boardHours.map((x) => (
                          <span key={x}>{x}</span>
                        ))}
                      </div>
                      {visibleChairs.map((chair) => (
                        <div key={chair.id}>
                          <strong>{chair.name.replace("Dr. ", "")}</strong>
                          {appointments
                            .filter((a) => a.doctor === chair.name)
                            .map((a) => (
                              <button
                                className="bt-appointment-block"
                                key={a.patient}
                                onClick={() => {
                                  setAppointments((x) =>
                                    x.map((p) => (p === a ? { ...p, status: "Arrived" } : p)),
                                  );
                                  toast.success(`${a.patient} checked in`);
                                }}
                              >
                                {a.time}
                                <strong>{a.patient}</strong>
                                {a.procedure}
                                <br />
                                {a.status}
                              </button>
                            ))}
                          <Button variant="outline" size="sm" onClick={() => setCreate(true)}>
                            + Book slot
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Panel>
                ) : (
                  <Panel
                    title="Appointments"
                    description={`${appointments.length} bookings on your schedule`}
                  >
                    <DataTable
                      onReset={() => setQuery("")}
                      query={query}
                      columns={["Patient", "Doctor", "Procedure", "Time", "Status"]}
                      rows={appointments.map((a) => [
                        a.patient,
                        a.doctor,
                        a.procedure,
                        a.time,
                        a.status,
                      ])}
                      onRow={(i) => {
                        setAppointments((x) =>
                          x.map((a, j) =>
                            j === i
                              ? {
                                  ...a,
                                  status:
                                    a.status === "Arrived"
                                      ? "In Chair"
                                      : a.status === "In Chair"
                                        ? "Completed"
                                        : "Arrived",
                                }
                              : a,
                          ),
                        );
                        toast.success("Appointment status updated");
                      }}
                    />
                  </Panel>
                )}
              </>
            ) : null}
          </>
        )}
        <BookingSheet
          open={create}
          onOpenChange={setCreate}
          practitioners={practitionerNames}
          onSave={(v) => {
            setAppointments((x) => [...x, v]);
            setActivities((current) => [
              ...current,
              { id: `booking-activity-${current.length + 1}`, type: "booked" },
            ]);
            toast.success("Booking saved");
          }}
        />
      </Shell>
    </Tabs>
  );
}
