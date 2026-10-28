import type { miroInvoiceSummary } from "./miro-settings-model";
import { miroClinicDoctors, miroClinicSeedDoctors } from "./miro-settings-integration";
/* Clinic domain state is shared with the sidebar and records workspace. */
/* eslint-disable react/only-export-components */
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Download, CalendarDays, GripVertical } from "lucide-react";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
} from "@/components/reui/kanban";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { MiniTrend } from "@/blocks/data/sparkline-primitives";
import { IconTile } from "@/components/reui/icon-tile";
import { Users, Stethoscope, ReceiptText, Clock } from "lucide-react";
import { demoAvatar } from "@/lib/demo-artwork";
import { BusinessGrid } from "./grid";
import { Button, Input, Panel, RecordDialog, exportCsv } from "./shared";
import { Choice, Tone } from "./fidelity";

type Patient = {
  id: string;
  name: string;
  phone: string;
  email: string;
  doctor: string;
  stage: string;
  bookings: number;
  unpaid: number;
};
const doctors = miroClinicSeedDoctors;
const names = [
  ["Ifeoma Okafor", "2041"],
  ["Samir Haddad", "2088"],
  ["Elsa Lindqvist", "2113"],
  ["Mateo Santos", "2156"],
  ["Laila Abadi", "2190"],
  ["Gregory Whitfield", "2204"],
  ["Wei Ling Tan", "2231"],
  ["Chiara Novello", "2277"],
  ["Declan Brennan", "2290"],
  ["Yuki Nakamura", "2312"],
  ["Kwame Osei", "2326"],
  ["Irina Petrova", "2334"],
  ["Nadia Rahman", "2347"],
  ["Bruno Silva", "2355"],
  ["Marta Kowalski", "2368"],
  ["Dawit Bekele", "2371"],
  ["Camille Fontaine", "2389"],
  ["Lea Moreau", "2394"],
  ["Diego Ibarra", "2402"],
  ["Henrik Olsen", "2417"],
  ["Priya Chowdhury", "2425"],
];
const patientSeed: Patient[] = names.map(([name, number], index) => ({
  id: `PT-${number}`,
  name,
  phone: `+1 (555) 0${number.slice(-3)}`,
  email: `${name[0].toLowerCase()}.${name.split(" ").at(-1)?.toLowerCase()}@example.com`,
  doctor: doctors[index % 5],
  stage: index === 2 || index === 4 ? "In Chair" : "Active",
  bookings: 3 + (index % 11),
  unpaid: [5, 11, 16].includes(index) ? 1 : 0,
}));
type Invoice = {
  id: string;
  patient: string;
  doctor: string;
  amount: number;
  date: string;
  status: string;
};
const invoiceSeed: Invoice[] = [
  {
    id: "INV-20261023-6",
    patient: "Declan Brennan",
    doctor: doctors[4],
    amount: 350,
    date: "Oct 23",
    status: "Paid",
  },
  {
    id: "INV-20261023-5",
    patient: "Wei Ling Tan",
    doctor: doctors[4],
    amount: 120,
    date: "Oct 23",
    status: "Paid",
  },
  {
    id: "INV-20261023-4",
    patient: "Gregory Whitfield",
    doctor: doctors[1],
    amount: 850,
    date: "Oct 23",
    status: "Open",
  },
  {
    id: "INV-20261023-3",
    patient: "Mateo Santos",
    doctor: doctors[1],
    amount: 850,
    date: "Oct 23",
    status: "Paid",
  },
  {
    id: "INV-20261023-2",
    patient: "Samir Haddad",
    doctor: doctors[0],
    amount: 120,
    date: "Oct 23",
    status: "Paid",
  },
  {
    id: "INV-20261023-1",
    patient: "Ifeoma Okafor",
    doctor: doctors[0],
    amount: 90,
    date: "Oct 23",
    status: "Paid",
  },
  {
    id: "INV-20261022-5",
    patient: "Bruno Silva",
    doctor: doctors[3],
    amount: 950,
    date: "Oct 22",
    status: "Paid",
  },
  {
    id: "INV-20261022-4",
    patient: "Nadia Rahman",
    doctor: doctors[4],
    amount: 90,
    date: "Oct 22",
    status: "Paid",
  },
  {
    id: "INV-20261022-3",
    patient: "Irina Petrova",
    doctor: doctors[2],
    amount: 180,
    date: "Oct 22",
    status: "Open",
  },
  {
    id: "INV-20261022-2",
    patient: "Kwame Osei",
    doctor: doctors[1],
    amount: 120,
    date: "Oct 22",
    status: "Paid",
  },
];
const ledgerSeed = [
  ...invoiceSeed,
  ...Array.from({ length: 77 }, (_, index) => ({
    id: `INV-DEMO-${3000 + index}`,
    patient: patientSeed[index % patientSeed.length].name,
    doctor: doctors[index % doctors.length],
    amount: index === 0 ? 850 : index === 76 ? 360 : 250,
    date: `Oct ${21 - (index % 20)}`,
    status: index === 0 ? "Open" : "Paid",
  })),
];
export function useClinicRecords() {
  const [patients, setPatients] = useState(patientSeed);
  const [invoices, setInvoices] = useState(ledgerSeed);
  const [visits, setVisits] = useState(initialBoard);
  return { patients, setPatients, invoices, setInvoices, visits, setVisits };
}
type ClinicRecords = {
  patients: Patient[];
  setPatients: Dispatch<SetStateAction<Patient[]>>;
  invoices: Invoice[];
  setInvoices: Dispatch<SetStateAction<Invoice[]>>;
  visits: Record<string, Visit[]>;
  setVisits: Dispatch<SetStateAction<Record<string, Visit[]>>>;
};
export function ClinicSidebar({
  active,
  data,
  onSelect,
}: {
  active: string;
  data: ClinicRecords;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  if (active === "Customers")
    return (
      <>
        <strong>Directory</strong>
        <Input
          aria-label="Search patient directory"
          placeholder="Search patients..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {["IN CHAIR", "ACTIVE"].map((group) => (
          <section className="bt-patient-nav" key={group}>
            <h3>{group}</h3>
            {data.patients
              .filter(
                (patient) =>
                  (patient.stage === "In Chair") === (group === "IN CHAIR") &&
                  patient.name.toLowerCase().includes(query.toLowerCase()),
              )
              .map((patient) => (
                <button key={patient.id} onClick={() => onSelect(patient.id)}>
                  <img src={demoAvatar(patient.name)} alt="" />
                  <span>
                    {patient.name}
                    <small>{patient.id} · General Checkup</small>
                  </span>
                </button>
              ))}
          </section>
        ))}
        <small className="text-muted-foreground">{data.patients.length} patients · 3 unpaid</small>
      </>
    );
  if (active === "Staff")
    return (
      <>
        <strong>Load</strong>
        <div className="bt-patient-nav">
          <h3>ON THE FLOOR</h3>
          {doctors.map((doctor, index) => (
            <div className="bt-clinic-load" key={doctor}>
              <strong>{doctor}</strong>
              <span>{["3h 30m", "3h 45m", "2h 15m", "2h", "2h 30m"][index]}</span>
              <small>{[5, 3, 4, 2, 3][index]} today · 1 tomorrow</small>
            </div>
          ))}
          <h3>NOT SCHEDULED</h3>
          {["Dr. Ines Duarte", "Dr. Jonas Falk", "Dr. Noah Weber", "Dr. Priya Raman"].map(
            (doctor, index) => (
              <div className="bt-clinic-load" key={doctor}>
                <strong>{doctor}</strong>
                <small>
                  {["Prosthodontics", "Implantology", "Periodontics", "Pediatrics"][index]} · not on
                  the floor
                </small>
              </div>
            ),
          )}
        </div>
        <small>5 of 9 on the floor · 14h booked</small>
      </>
    );
  return (
    <>
      <strong>Activity</strong>
      <div className="bt-patient-nav bt-invoice-nav">
        {data.invoices.map((invoice) => (
          <button key={invoice.id} onClick={() => onSelect(invoice.id)}>
            <span>
              <small>{invoice.date.toUpperCase()}</small>
              <strong>{invoice.id}</strong>
              {invoice.patient} · ${invoice.amount}
              <small>{invoice.doctor}</small>
              <Tone tone={invoice.status === "Paid" ? "green" : "amber"}>{invoice.status}</Tone>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
type Visit = {
  id: string;
  patient: string;
  procedure: string;
  time: string;
  status: string;
  room: string;
};
const visitSeed = [
  [
    ["Ifeoma Okafor", "General Checkup", "8:30 AM", "Done", "Op 1 · 30m"],
    ["Samir Haddad", "Scaling", "9:30 AM", "Done", "Op 1 · 45m"],
    ["Elsa Lindqvist", "Crown Fitting", "11:00 AM", "In Chair", "Op 1 · 1h"],
    ["Wei Ling Tan", "Composite Filling", "2:15 PM", "Booked", "Op 1 · 45m"],
    ["Chiara Novello", "General Checkup", "4:00 PM", "Booked", "Op 1 · 30m"],
  ],
  [
    ["Mateo Santos", "Root Canal", "9:00 AM", "Done", "Op 3 · 1h 30m"],
    ["Gregory Whitfield", "Root Canal", "10:45 AM", "Unpaid", "Op 3 · 1h 30m"],
    ["Declan Brennan", "Composite Filling", "3:00 PM", "Booked", "Op 3 · 45m"],
  ],
  [
    ["Laila Abadi", "Braces Adjustment", "10:15 AM", "In Chair", "Op 4 · 30m"],
    ["Chiara Novello", "Braces Adjustment", "10:45 AM", "Booked", "Op 4 · 30m"],
    ["Ifeoma Okafor", "Implant Review", "2:00 PM", "Booked", "Op 4 · 45m"],
    ["Mateo Santos", "Braces Adjustment", "4:30 PM", "Done", "Op 4 · 30m"],
  ],
  [
    ["Samir Haddad", "Extraction", "2:00 PM", "Booked", "Theatre · 1h"],
    ["Elsa Lindqvist", "Extraction", "3:30 PM", "Booked", "Theatre · 1h"],
  ],
  [
    ["Wei Ling Tan", "Scaling", "8:00 AM", "Done", "Op 2 · 45m"],
    ["Declan Brennan", "Whitening", "9:15 AM", "Done", "Op 2 · 1h"],
    ["Laila Abadi", "Scaling", "12:30 PM", "In Chair", "Op 2 · 45m"],
  ],
];
const initialBoard = Object.fromEntries(
  doctors.map((doctor, index) => [
    doctor,
    visitSeed[index].map(([patient, procedure, time, status, room], i) => ({
      id: `visit-${index}-${i}`,
      patient,
      procedure,
      time,
      status,
      room,
    })),
  ]),
) as Record<string, Visit[]>;
type ClinicBooking = {
  patient: string;
  doctor: string;
  procedure: string;
  time: string;
  status: string;
};
function StaffBoard({
  onBook,
  data,
  bookings,
}: {
  onBook: () => void;
  data: ClinicRecords;
  bookings: ClinicBooking[];
}) {
  const board = data.visits;
  const setBoard = data.setVisits;
  useEffect(() => {
    if (!bookings.length) return;
    setBoard((current) => {
      let changed = false;
      const next = { ...current };
      for (const booking of bookings) {
        const id = `booked-${booking.patient}-${booking.time}`;
        if (
          Object.values(current)
            .flat()
            .some((visit) => visit.id === id)
        )
          continue;
        const doctor = miroClinicDoctors.includes(booking.doctor) ? booking.doctor : doctors[0];
        next[doctor] = [
          ...(next[doctor] ?? []),
          {
            id,
            patient: booking.patient,
            procedure: booking.procedure,
            time: booking.time,
            status: booking.status,
            room: "New visit · 30m",
          },
        ];
        changed = true;
      }
      return changed ? next : current;
    });
  }, [bookings, setBoard]);
  const [selected, setSelected] = useState<{ doctor: string; visit: Visit } | null>(null);
  const [status, setStatus] = useState("Booked");
  return (
    <div className="bt-clinic-staff">
      <Kanban value={board} onValueChange={setBoard} getItemValue={(item) => item.id}>
        <KanbanBoard className="bt-clinic-staff-board">
          {Object.keys(board).map((doctor) => (
            <KanbanColumn value={doctor} key={doctor} className="bt-clinic-staff-column">
              <header>
                <img src={demoAvatar(doctor)} alt="" />
                <strong>{doctor}</strong>
                <Tone tone="neutral">{board[doctor].length}</Tone>
              </header>
              <KanbanColumnContent value={doctor}>
                {board[doctor].map((visit) => (
                  <KanbanItem
                    key={visit.id}
                    value={visit.id}
                    className={`bt-staff-visit bt-visit-${visit.status.toLowerCase().replaceAll(" ", "-")}`}
                  >
                    <div className="bt-pills">
                      <small>{dataPatientId(visit.patient)}</small>
                      <Tone
                        tone={
                          visit.status === "Done"
                            ? "green"
                            : visit.status === "In Chair"
                              ? "violet"
                              : "blue"
                        }
                      >
                        {visit.status}
                      </Tone>
                      <KanbanItemHandle aria-label={`Move visit ${visit.id}`}>
                        <GripVertical size={13} />
                      </KanbanItemHandle>
                    </div>
                    <button
                      onClick={() => {
                        setSelected({ doctor, visit });
                        setStatus(visit.status);
                      }}
                    >
                      <strong>{visit.procedure}</strong>
                      <small>{visit.room}</small>
                      <span className="bt-staff-patient-time">
                        <span>
                          <img src={demoAvatar(visit.patient)} alt="" />
                          {visit.patient}
                        </span>
                        <b>
                          <Clock size={12} />
                          {visit.time}
                        </b>
                      </span>
                    </button>
                  </KanbanItem>
                ))}
              </KanbanColumnContent>
              <Button variant="ghost" onClick={onBook}>
                + Add visit
              </Button>
            </KanbanColumn>
          ))}
        </KanbanBoard>
      </Kanban>
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="bt-floating-sheet">
          <SheetHeader>
            <SheetTitle>{selected?.visit.patient}</SheetTitle>
            <SheetDescription>
              {selected?.visit.procedure} · {selected?.doctor}
            </SheetDescription>
          </SheetHeader>
          <form
            className="bt-form mt-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (selected)
                setBoard((current) => ({
                  ...current,
                  [selected.doctor]: current[selected.doctor].map((visit) =>
                    visit.id === selected.visit.id ? { ...visit, status } : visit,
                  ),
                }));
              setSelected(null);
            }}
          >
            <label>
              Visit status
              <Choice
                label="Visit status"
                value={status}
                onChange={setStatus}
                options={["Booked", "Arrived", "In Chair", "Done", "Unpaid", "Cancelled"]}
              />
            </label>
            <p>
              {selected?.visit.time} · {selected?.visit.room}
            </p>
            <SheetFooter>
              <Button variant="outline" type="button" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button type="submit">Save visit</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
function dataPatientId(name: string) {
  return patientSeed.find((patient) => patient.name === name)?.id ?? "New patient";
}
export function ClinicWorkspace({
  billingSummary,
  invoiceDueLabel,
  active,
  data,
  record,
  onRecord,
  onBook,
  create,
  onCreateChange,
  bookings,
}: {
  active: string;
  billingSummary?: ReturnType<typeof miroInvoiceSummary>;
  invoiceDueLabel?: (id: string) => string;
  data: ClinicRecords;
  record: string | null;
  onRecord: (id: string | null) => void;
  onBook: () => void;
  create: boolean;
  onCreateChange: (open: boolean) => void;
  bookings: ClinicBooking[];
}) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All stages");
  const setCreate = onCreateChange;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", phone: "" });
  const selected = data.patients.find((patient) => patient.id === record);
  const invoice = data.invoices.find((item) => item.id === record);
  const patients = data.patients
    .filter(
      (patient) =>
        (patient.name + patient.email).toLowerCase().includes(query.toLowerCase()) &&
        (stage === "All stages" || patient.stage === stage),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  if (active === "Staff") return <StaffBoard onBook={onBook} data={data} bookings={bookings} />;
  return (
    <div className="bt-clinic-workspace">
      {active === "Customers" ? (
        <div className="bt-clinic-metrics">
          {[
            ["Patients", "on the books", data.patients.length, 100, Users],
            ["Upcoming", "appointments still ahead", 140, 100, CalendarDays],
            ["In Chair", "with a clinician now", 2, 10, Stethoscope],
            ["Unpaid", "finished, not settled", 3, 14, ReceiptText],
          ].map(([name, detail, value, percent, Icon], index) => {
            const MetricIcon = Icon as typeof Users;
            return (
              <div key={String(name)}>
                <div className="bt-clinic-metric-label">
                  <IconTile variant="frame">
                    <MetricIcon />
                  </IconTile>
                  <span>
                    <strong>{String(name)}</strong>
                    <small>{String(detail)}</small>
                  </span>
                  <Tone tone={index === 3 ? "amber" : index % 2 ? "green" : "violet"}>
                    ↗ {String(percent)}%
                  </Tone>
                </div>
                <div className="bt-clinic-metric-value">
                  <b>{String(value)}</b>
                  <MiniTrend
                    label={`${name} trend`}
                    values={[48, 25, 14, 5, 9, 6, 7, 5, 5, 4, 5]}
                    color={["#c9afff", "#8ce2c5", "#c9afff", "#f5d787"][index]}
                    height={44}
                    bars
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bt-treatment-billed">
          <div>
            <IconTile variant="frame">
              <ReceiptText />
            </IconTile>
            <span>
              <strong>
                Treatment billed <Tone>Up to date</Tone>
              </strong>
              <small>OUTSTANDING BALANCE</small>
              <b>
                $
                {data.invoices
                  .filter((item) => item.status === "Open")
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toLocaleString()}
              </b>
              <p>
                {data.invoices.length} invoices raised against completed treatment,{" "}
                {billingSummary?.pastDueCount
                  ? `${billingSummary.pastDueCount} past due.`
                  : "none past due."}
              </p>
            </span>
          </div>
          <dl>
            <div>
              <dt>CURRENT</dt>
              <dd>
                $
                {(billingSummary
                  ? billingSummary.outstanding - billingSummary.pastDue
                  : data.invoices
                      .filter((item) => item.status === "Open")
                      .reduce((sum, item) => sum + item.amount, 0)
                ).toLocaleString()}
              </dd>
              <small>
                {billingSummary
                  ? billingSummary.outstandingCount - billingSummary.pastDueCount
                  : data.invoices.filter((item) => item.status === "Open").length}{" "}
                invoices
              </small>
            </div>
            <div>
              <dt>OVERDUE</dt>
              <dd>${(billingSummary?.pastDue ?? 0).toLocaleString()}</dd>
              <small>{billingSummary?.pastDueCount ?? 0} invoices</small>
            </div>
            <div>
              <dt>COLLECTED</dt>
              <dd>
                $
                {data.invoices
                  .filter((item) => item.status === "Paid")
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toLocaleString()}
              </dd>
              <small>
                {data.invoices.filter((item) => item.status === "Paid").length} invoices
              </small>
            </div>
          </dl>
        </div>
      )}
      <Panel
        title={active === "Customers" ? "Patients" : "Invoice Ledger"}
        description={
          active === "Customers"
            ? `${data.patients.length} patients · 3 with unpaid visits`
            : `${data.invoices.length} invoices · patient treatment ledger`
        }
        className="bt-clinic-records"
        action={
          <Button
            variant="outline"
            onClick={() =>
              exportCsv(
                active.toLowerCase(),
                active === "Customers"
                  ? [
                      ["Patient", "Email", "Phone", "Practitioner"],
                      ...data.patients.map((patient) => [
                        patient.name,
                        patient.email,
                        patient.phone,
                        patient.doctor,
                      ]),
                    ]
                  : [
                      ["Invoice", "Patient", "Amount", "Status"],
                      ...data.invoices.map((item) => [
                        item.id,
                        item.patient,
                        String(item.amount),
                        item.status,
                      ]),
                    ],
              )
            }
          >
            <Download />
            Export
          </Button>
        }
      >
        <BusinessGrid
          selectable
          settings
          pageSize={10}
          toolbar={
            <div className="bt-clinic-filter">
              <span>Name contains</span>
              <Input
                aria-label="Search clinic records"
                placeholder={active === "Customers" ? "Search patients..." : "Search invoices..."}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {active === "Customers" && (
                <Choice
                  label="Patient stage"
                  value={stage}
                  onChange={setStage}
                  options={["All stages", "Active", "In Chair"]}
                />
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setStage("All stages");
                }}
              >
                Clear
              </Button>
            </div>
          }
          headers={
            active === "Customers"
              ? ["Patient", "Contact", "Practitioner", "Stage", "Bookings"]
              : ["Patient", "Invoice", "Clinician", "Amount", "Due", "Status"]
          }
          rows={
            active === "Customers"
              ? patients.map((patient) => [
                  <button
                    key="patient"
                    className="bt-clinic-person"
                    onClick={() => {
                      onRecord(patient.id);
                      setEditing(false);
                    }}
                  >
                    <img src={demoAvatar(patient.name)} alt="" />
                    <span>
                      {patient.name}
                      <small>{patient.id}</small>
                    </span>
                  </button>,
                  <span key="contact">
                    {patient.phone}
                    <small className="bt-table-sub">{patient.email}</small>
                  </span>,
                  patient.doctor,
                  <Tone key="stage" tone={patient.stage === "In Chair" ? "violet" : "green"}>
                    {patient.stage}
                  </Tone>,
                  <span key="bookings">
                    {patient.bookings} upcoming
                    {patient.unpaid > 0 && (
                      <small className="bt-table-sub bt-negative">{patient.unpaid} unpaid</small>
                    )}
                  </span>,
                ])
              : data.invoices
                  .filter((item) =>
                    (item.id + item.patient).toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((item) => [
                    <button className="text-left" key="patient" onClick={() => onRecord(item.id)}>
                      {item.patient}
                      <small className="bt-table-sub">{dataPatientId(item.patient)}</small>
                    </button>,
                    <span key="invoice">
                      {item.id}
                      <small className="bt-table-sub">{item.date}</small>
                    </span>,
                    item.doctor,
                    `$${item.amount}`,
                    item.status === "Paid"
                      ? "Settled"
                      : (invoiceDueLabel?.(item.id) ?? "Due in 29d"),
                    <Tone key="status" tone={item.status === "Paid" ? "green" : "amber"}>
                      {item.status}
                    </Tone>,
                  ])
          }
        />
      </Panel>
      <RecordDialog
        title={active === "Customers" ? "Add patient" : "New invoice"}
        open={create}
        onOpenChange={setCreate}
        fields={
          active === "Customers"
            ? [
                { name: "name", label: "Full name" },
                { name: "email", label: "Email address", type: "email" },
                { name: "phone", label: "Phone number" },
              ]
            : [
                { name: "patient", label: "Patient name" },
                { name: "amount", label: "Amount", type: "number" },
              ]
        }
        onSave={(value) => {
          if (active === "Customers")
            data.setPatients((current) => [
              ...current,
              {
                id: `PT-${2500 + current.length}`,
                name: value.name,
                email: value.email,
                phone: value.phone,
                doctor: doctors[0],
                stage: "Active",
                bookings: 0,
                unpaid: 0,
              },
            ]);
          else
            data.setInvoices((current) => [
              {
                id: `INV-DEMO-${current.length + 1}`,
                patient: value.patient,
                doctor: doctors[0],
                amount: Number(value.amount),
                date: "Oct 23",
                status: "Open",
              },
              ...current,
            ]);
        }}
      />
      <Sheet
        open={!!selected || !!invoice}
        onOpenChange={(open) => {
          if (!open) {
            onRecord(null);
            setEditing(false);
          }
        }}
      >
        <SheetContent className="bt-floating-sheet bt-patient-detail">
          <SheetHeader>
            <SheetTitle>{selected?.name ?? invoice?.id}</SheetTitle>
            <SheetDescription>
              {selected
                ? `${selected.id} · Patient profile`
                : `${invoice?.patient} · ${invoice?.date}`}
            </SheetDescription>
          </SheetHeader>
          {selected ? (
            <>
              <div className="bt-patient-profile">
                <img src={demoAvatar(selected.name)} alt="" />
                <span>
                  <strong>{selected.name}</strong>
                  <Tone tone="green">{selected.stage}</Tone>
                </span>
              </div>
              {editing ? (
                <form
                  className="bt-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    data.setPatients((current) =>
                      current.map((patient) =>
                        patient.id === selected.id ? { ...patient, ...draft } : patient,
                      ),
                    );
                    setEditing(false);
                  }}
                >
                  <label>
                    Full name
                    <Input
                      value={draft.name}
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    />
                  </label>
                  <label>
                    Email address
                    <Input
                      type="email"
                      value={draft.email}
                      onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                    />
                  </label>
                  <label>
                    Phone number
                    <Input
                      value={draft.phone}
                      onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                    />
                  </label>
                  <SheetFooter>
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save patient</Button>
                  </SheetFooter>
                </form>
              ) : (
                <>
                  <dl className="bt-clinic-details">
                    <dt>Email</dt>
                    <dd>{selected.email}</dd>
                    <dt>Phone</dt>
                    <dd>{selected.phone}</dd>
                    <dt>Practitioner</dt>
                    <dd>{selected.doctor}</dd>
                    <dt>Upcoming</dt>
                    <dd>{selected.bookings} appointments</dd>
                    <dt>Unpaid</dt>
                    <dd>{selected.unpaid} visits</dd>
                  </dl>
                  <SheetFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDraft({
                          name: selected.name,
                          email: selected.email,
                          phone: selected.phone,
                        });
                        setEditing(true);
                      }}
                    >
                      Edit patient
                    </Button>
                    <Button
                      onClick={() => {
                        onRecord(null);
                        onBook();
                      }}
                    >
                      <CalendarDays />
                      Book visit
                    </Button>
                  </SheetFooter>
                </>
              )}
            </>
          ) : (
            invoice && (
              <>
                <dl className="bt-clinic-details">
                  <dt>Patient</dt>
                  <dd>{invoice.patient}</dd>
                  <dt>Practitioner</dt>
                  <dd>{invoice.doctor}</dd>
                  <dt>Amount</dt>
                  <dd>${invoice.amount}</dd>
                  <dt>Status</dt>
                  <dd>{invoice.status}</dd>
                </dl>
                <SheetFooter>
                  <Button variant="outline" onClick={() => onRecord(null)}>
                    Close
                  </Button>
                  <Button
                    disabled={invoice.status === "Paid"}
                    onClick={() =>
                      data.setInvoices((current) =>
                        current.map((item) =>
                          item.id === invoice.id ? { ...item, status: "Paid" } : item,
                        ),
                      )
                    }
                  >
                    Record payment
                  </Button>
                </SheetFooter>
              </>
            )
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
