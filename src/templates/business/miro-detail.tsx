import { useTable, type ColumnDef } from "@tanstack/react-table";
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable, DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { useMemo, useState } from "react";
import { ChevronsDownUp } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button, Input, Panel, Tabs, TabsList, TabsTrigger } from "./shared";
import { Choice, Tone } from "./fidelity";
const doctors = [
  "Dr. Amara Chen",
  "Dr. Ravi Menon",
  "Dr. Elena Novak",
  "Dr. Tomas Reyes",
  "Dr. Hana Sato",
];
const groups = [
  {
    name: doctors[0],
    specialty: "Restorative",
    counts: [5, 2, 0, 1, 2, 0],
    children: [
      ["General Checkup", "30m", [2, 1, 0, 0, 1, 0]],
      ["Scaling", "45m", [1, 0, 0, 0, 1, 0]],
      ["Composite Filling", "45m", [1, 1, 0, 0, 0, 0]],
      ["Crown Fitting", "60m", [1, 0, 0, 1, 0, 0]],
    ],
  },
  {
    name: doctors[2],
    specialty: "Orthodontics",
    counts: [4, 2, 1, 0, 0, 1],
    children: [
      ["Braces Adjustment", "30m", [3, 1, 1, 0, 0, 1]],
      ["Implant Review", "45m", [1, 1, 0, 0, 0, 0]],
    ],
  },
  {
    name: doctors[4],
    specialty: "Hygiene",
    counts: [3, 0, 1, 0, 2, 0],
    children: [
      ["Scaling", "45m", [2, 0, 1, 0, 1, 0]],
      ["Whitening", "60m", [1, 0, 0, 0, 1, 0]],
    ],
  },
];
type Bucket = {
  id: string;
  name: string;
  detail: string;
  duration?: string;
  counts: number[];
  children?: Bucket[];
};
export function DayBreakdown() {
  const [group, setGroup] = useState("By chair");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Everything");
  const [notes, setNotes] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "0": true,
    "1": true,
    "2": true,
  });
  const data = useMemo<Bucket[]>(
    () =>
      groups
        .map((g, i) => ({
          id: String(i),
          name: group === "By chair" ? g.name : group === "By room" ? `Op ${i + 1}` : g.specialty,
          detail: g.specialty,
          counts: g.counts,
          children: g.children
            .filter(
              (c) =>
                filter === "Everything" ||
                (c[2] as number[])[
                  ["", "Booked", "Arrived", "In Chair", "Completed", "Cancelled"].indexOf(filter)
                ] > 0,
            )
            .map(([name, duration, counts], j) => ({
              id: i + "-" + j,
              name: String(name),
              detail: String(duration).replace("m", " minutes in the chair"),
              duration: String(duration),
              counts: counts as number[],
            })),
        }))
        .filter((g) =>
          (g.name + " " + g.detail + " " + g.children.map((c) => c.name).join(" "))
            .toLowerCase()
            .includes(q.toLowerCase()),
        ),
    [group, q, filter],
  );
  const columns = useMemo<ColumnDef<DataGridFeatures, Bucket>[]>(
    () => [
      {
        id: "name",
        header: "Bucket",
        size: 360,
        cell: ({ row }) => (
          <span className="bt-pills" style={{ paddingLeft: row.depth ? 16 : 0 }}>
            {row.getCanExpand() ? (
              <DataGridTableRowExpand row={row} />
            ) : (
              <Tone tone="neutral">{row.original.duration}</Tone>
            )}
            <span>
              {row.original.name}
              {(notes || !row.depth) && (
                <small className="bt-table-sub">{row.original.detail}</small>
              )}
            </span>
            {row.getCanExpand() && <Tone tone="neutral">{row.original.children?.length}</Tone>}
          </span>
        ),
      },
      ...["Bookings", "Booked", "Arrived", "In Chair", "Completed", "Cancelled"].map(
        (title, i) => ({
          id: title,
          header: title,
          size: 110,
          cell: ({ row }: { row: { original: Bucket } }) => {
            const v = row.original.counts[i],
              p = Math.round((v / row.original.counts[0]) * 100);
            return (
              <span
                className="bt-grid-heat"
                style={
                  i
                    ? {
                        background: `color-mix(in srgb, ${["", "var(--bt-green)", "#10bfa0", "#7e67f7", "#22bf9a", "#efbc45"][i]} ${v ? Math.round(p * 0.65) + 12 : 5}%, var(--background))`,
                      }
                    : undefined
                }
              >
                {v}
                {i > 0 && <small>{p}%</small>}
              </span>
            );
          },
        }),
      ),
    ],
    [notes],
  );
  const table = useTable({
    features: dataGridFeatures,
    data,
    columns,
    getRowId: (r) => r.id,
    getSubRows: (r) => r.children,
    manualPagination: true,
    state: { expanded },
    onExpandedChange: (updater) =>
      setExpanded((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return next === true ? { "0": true, "1": true, "2": true } : next;
      }),
  });
  return (
    <Panel
      title="Day Breakdown"
      description="Every booking on the sheet, against the state it is in."
      className="bt-day-breakdown"
      action={
        <div className="bt-pills">
          Bookings <Tone tone="neutral">17</Tone> Needs desk <Tone tone="amber">2</Tone>
        </div>
      }
    >
      <Tabs value={group} onValueChange={setGroup}>
        <TabsList variant="line">
          {["By chair", "By procedure", "By room"].map((x) => (
            <TabsTrigger value={x} key={x}>
              {x}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="bt-toolbar">
        <Choice
          label="Booking filter"
          value={filter}
          onChange={setFilter}
          options={["Everything", "Booked", "Arrived", "In Chair", "Completed", "Cancelled"]}
        />
        <Input
          placeholder="Search buckets"
          aria-label="Search buckets"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="bt-pills ml-auto">
          <Switch checked={notes} onCheckedChange={setNotes} />
          Notes
        </label>
        <Button
          variant="ghost"
          onClick={() =>
            setExpanded(
              Object.values(expanded).some(Boolean) ? {} : { "0": true, "1": true, "2": true },
            )
          }
        >
          <ChevronsDownUp />
          {Object.values(expanded).some(Boolean) ? "Collapse" : "Expand"}
        </Button>
      </div>
      <DataGrid
        table={table}
        recordCount={11}
        tableLayout={{ width: "auto", rowBorder: true, headerBorder: true }}
        tableClassNames={{ base: "bt-heat-grid", bodyRow: "h-[53px]" }}
      >
        <DataGridScrollArea>
          <DataGridTable />
        </DataGridScrollArea>
      </DataGrid>
    </Panel>
  );
}
export function BookingSheet({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (v: {
    patient: string;
    doctor: string;
    procedure: string;
    time: string;
    end: string;
    date: string;
    status: string;
  }) => void;
}) {
  const [date, setDate] = useState("2026-10-22");
  const [patient, setPatient] = useState("");
  const [procedure, setProcedure] = useState("General Checkup");
  const [doctor, setDoctor] = useState(doctors[0]);
  const [start, setStart] = useState("08:00 AM");
  const [end, setEnd] = useState("08:30 AM");
  const [status, setStatus] = useState("Booked");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bt-floating-sheet">
        <SheetHeader>
          <SheetTitle>New Booking</SheetTitle>
          <SheetDescription className="sr-only">Book a chair for a patient.</SheetDescription>
        </SheetHeader>
        <form
          className="bt-sheet-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ patient, doctor, procedure, time: start, end, date, status });
            onOpenChange(false);
          }}
        >
          <div className="bt-form">
            <label>
              Patient
              <Choice
                label="Patient"
                placeholder="Search patients..."
                value={patient}
                onChange={setPatient}
                options={[
                  "Harriet Pemberton",
                  "Katherine Chen",
                  "Camila Rosenthal",
                  "Amara Mitchell",
                  "Oliver Lindqvist",
                  "Lena Morris",
                ]}
              />
            </label>
            <label>
              Procedure
              <Choice
                label="Procedure"
                value={procedure}
                onChange={setProcedure}
                options={[
                  "General Checkup",
                  "Scaling",
                  "Composite Filling",
                  "Crown Fitting",
                  "Braces Adjustment",
                  "Implant Review",
                  "Whitening",
                ]}
              />
            </label>
            <label>
              Practitioner
              <Choice label="Practitioner" value={doctor} onChange={setDoctor} options={doctors} />
            </label>
            <label>
              Date
              <Input
                aria-label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <div className="bt-grid-2">
              <label>
                Start
                <Choice
                  label="Start"
                  value={start}
                  onChange={setStart}
                  options={["08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM"]}
                />
              </label>
              <label>
                End
                <Choice
                  label="End"
                  value={end}
                  onChange={setEnd}
                  options={["08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM"]}
                />
              </label>
            </div>
            <label>
              Status
              <Choice
                label="Status"
                value={status}
                onChange={setStatus}
                options={["Booked", "Arrived", "In Chair", "Completed", "Cancelled"]}
              />
            </label>
            <label>
              Room
              <Input placeholder="Op 1" />
            </label>
            <label>
              Note
              <Textarea placeholder="Note for the chairside team" rows={3} />
            </label>
          </div>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!patient}>
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
