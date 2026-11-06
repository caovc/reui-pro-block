import { miroClinicSeedDoctors } from "./miro-settings-integration";
import { ClinicSidebar, ClinicWorkspace, useClinicRecords } from "./miro-workspace";
import { Agenda, AppointmentCalendar } from "./miro-calendar";
import { IconTile } from "@/components/reui/icon-tile";
import { DayBreakdown, BookingSheet } from "./miro-detail";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useEventCalendarSelector } from "@/components/reui/event-calendar/event-calendar";
import { format, subDays } from "date-fns";
import { MiroChairBoard } from "./miro-chair-board";
import { useMiroChairCalendar } from "./miro-chair-calendar";
import { miroChairStatuses } from "./miro-chair-board-model";
import { MiroCalendarSidebar, MiroDashboardSidebar, MiroSidebarAccount } from "./miro-shell-chrome";
import { useMiroRoute } from "./miro-route";
import { MiroSettings, MiroSettingsNavigation } from "./miro-settings";
import { MiroNotifications } from "./miro-notifications";
import { useMiroSettingsModel } from "./miro-settings-model";
import { miroAlertTypes, type MiroActivity } from "./miro-settings-data";
import {
  adaptMiroClinicInvoices,
  miroClinicAsOf,
  miroClinicInvoiceDueLabel,
  miroSavedProfileAvatar,
} from "./miro-settings-integration";
import {
  CalendarCheck,
  Gauge,
  Clock,
  TriangleAlert,
  Download,
  Share2,
  Printer,
  Plus,
} from "lucide-react";
import { Shell, Heading, Button, Badge, Bars, Area, DataTable, exportCsv, toast } from "./shared";
import "./miro-layout.css";

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
  const [clinicCreate, setClinicCreate] = useState(false);
  const [clinicRecord, setClinicRecord] = useState<string | null>(null);
  const [page, setPage] = useState("Dashboard");
  const routing = useMiroRoute();
  const active = routing.page ?? page;
  const setActive = (next: string) => {
    setPage(next);
    routing.navigate(next);
  };
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
  const [boardStatuses, setBoardStatuses] = useState<readonly string[]>(miroChairStatuses);
  const chairCalendar = useMiroChairCalendar({
    appointments,
    chairs: settings.chairs,
    hours: settings.hours,
    query,
    statuses: boardStatuses,
    onCreate: () => setCreate(true),
  });
  const boardDate = useEventCalendarSelector((state) => state.date, { calendar: chairCalendar });
  const boardView = useEventCalendarSelector((state) => state.view, { calendar: chairCalendar });
  const boardRange = useEventCalendarSelector((state) => state.activeRange, {
    calendar: chairCalendar,
    isEqual: (previous, next) =>
      previous.start.getTime() === next.start.getTime() &&
      previous.end.getTime() === next.end.getTime(),
  });
  const boardTitle =
    boardView === "week"
      ? `${format(boardRange.start, "MMMM d")} - ${format(subDays(boardRange.end, 1), "d, yyyy")}`
      : format(boardDate, "MMMM yyyy");
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
        pageHref={routing.href}
        miroSidebarAccount={
          <MiroSidebarAccount
            account={{
              name: settings.profileSaved.fullName,
              organisation: settings.profileSaved.email,
              photo: miroSavedProfileAvatar(settings.profileSaved),
            }}
            onProfile={() => {
              settings.setSection("profile");
              setActive("Settings");
            }}
            onNotifications={() => {
              settings.setSection("notifications");
              setActive("Settings");
            }}
            onBilling={() => {
              settings.setSection("billing");
              setActive("Settings");
            }}
          />
        }
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
          "Calendar",
          "Appointments",
          "Customers",
          "Staff",
          "Payments",
          "Settings",
        ]}
        rail
        top={
          <div className="bt-clinic-header">
            {active === "Settings" ? (
              <h1 className="miro-layout-heading">Settings</h1>
            ) : active === "Calendar" ? (
              <h1 className="miro-layout-heading">
                <span className="miro-layout-month-long">{boardTitle}</span>
                <span className="miro-layout-month-short">{format(boardDate, "MMM yyyy")}</span>
              </h1>
            ) : (
              <h1 className="miro-layout-heading">
                {active === "Dashboard" ? "Clinic Dashboard" : active}
              </h1>
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
              ) : active === "Calendar" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Print the day sheet"
                    onClick={() => window.print()}
                  >
                    <Printer />
                    <span className="miro-header-action-label">Print</span>
                  </Button>
                  <Button size="sm" aria-label="New booking" onClick={() => setCreate(true)}>
                    <Plus />
                    <span className="miro-header-action-label">New Booking</span>
                  </Button>
                </>
              ) : active === "Appointments" ? (
                <Button size="sm" onClick={() => setCreate(true)}>
                  <Plus />
                  New Appointment
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Export the day sheet"
                    onClick={() =>
                      exportCsv("clinic-day-sheet", [
                        ["Patient", "Practitioner", "Procedure", "Date", "Start", "End", "Status"],
                        ...appointments.map((booking) => [
                          booking.patient,
                          booking.doctor,
                          booking.procedure,
                          booking.date ?? miroClinicAsOf,
                          booking.time,
                          booking.end ?? "",
                          booking.status,
                        ]),
                      ])
                    }
                  >
                    <Download />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    aria-label="Share the dashboard"
                    onClick={() => navigator.clipboard?.writeText(location.href)}
                  >
                    <Share2 />
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
          ) : active === "Calendar" ? (
            <MiroCalendarSidebar
              calendar={chairCalendar}
              chairs={settings.chairs}
              appointments={appointments}
              onCreate={() => setCreate(true)}
              onChairChange={settings.updateChair}
            />
          ) : (
            <MiroDashboardSidebar
              chairs={settings.chairs}
              onCreate={() => setCreate(true)}
              onShowAll={() => setActive("Appointments")}
              onOpenBoard={() => setActive("Calendar")}
            />
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
                  <Card className="miro-chart-card">
                    <CardContent>
                      <div className="miro-chart-heading">
                        <div>
                          <h2>Procedure Mix</h2>
                          <p>Chair Demand</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ● Completed　● Scheduled
                        </span>
                      </div>
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
                    </CardContent>
                  </Card>
                  <Card className="miro-chart-card">
                    <CardContent>
                      <div className="miro-chart-heading">
                        <div>
                          <h2>Patient Volume</h2>
                          <p>Appointments and new patients</p>
                        </div>
                        <Badge variant="outline">+12.8%</Badge>
                      </div>
                      <Area />
                    </CardContent>
                  </Card>
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
              <div className="miro-board-page">
                <Tabs defaultValue="calendar" orientation="horizontal" className="miro-board-tabs">
                  <TabsList variant="line">
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="history">Log History</TabsTrigger>
                  </TabsList>
                  <TabsContent value="calendar">
                    <MiroChairBoard
                      calendar={chairCalendar}
                      appointments={appointments}
                      chairs={settings.chairs}
                      query={query}
                      onQueryChange={setQuery}
                      statuses={boardStatuses}
                      onStatusesChange={setBoardStatuses}
                      onChairChange={settings.updateChair}
                      onCreate={() => setCreate(true)}
                      onCheckIn={(booking, index) => {
                        setAppointments((current) =>
                          current.map((item, position) =>
                            position === index ? { ...item, status: "Arrived" } : item,
                          ),
                        );
                        toast.success(`${booking.patient} checked in`);
                      }}
                    />
                  </TabsContent>
                  <TabsContent value="history">
                    <div className="miro-board-history">
                      <DataTable
                        columns={["Activity"]}
                        rows={activities.map((activity) => [
                          miroAlertTypes.find((item) => item.id === activity.type)?.label ??
                            "Clinic activity",
                        ])}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
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
