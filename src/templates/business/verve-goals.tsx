/* Model hooks keep domain edits in the owning template during navigation. */
/* eslint-disable react/only-export-components */
import { useMemo, useState } from "react";
import { Plus, CheckCircle2, MoreHorizontal } from "lucide-react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable, DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { Switch } from "@/components/ui/switch";
import { BusinessGrid } from "./grid";
import { Button, Input, Panel, Period, Tabs, TabsList, TabsTrigger, RecordDialog } from "./shared";
import { Choice, Tone } from "./fidelity";

type Quota = {
  id: string;
  name: string;
  manager: string;
  quota: number;
  starts: number;
  confidence: number;
  status: string;
  risk: string;
  signed: boolean;
};
const quotaSeed: Quota[] = [
  {
    id: "Q4-LG",
    name: "Leo Grant",
    manager: "Mira Stone",
    quota: 190000,
    starts: 28,
    confidence: 82,
    status: "Active",
    risk: "Low",
    signed: true,
  },
  {
    id: "Q4-SQ",
    name: "Sana Qureshi",
    manager: "Mira Stone",
    quota: 190000,
    starts: 28,
    confidence: 79,
    status: "Active",
    risk: "Low",
    signed: true,
  },
  {
    id: "Q4-NV",
    name: "Nora Vale",
    manager: "Mira Stone",
    quota: 140000,
    starts: 8,
    confidence: 64,
    status: "Draft",
    risk: "Medium",
    signed: false,
  },
  {
    id: "Q4-PS",
    name: "Priya Shah",
    manager: "Theo Park",
    quota: 72000,
    starts: 6,
    confidence: 48,
    status: "Draft",
    risk: "High",
    signed: false,
  },
  {
    id: "Q4-MS",
    name: "Mira Stone",
    manager: "Theo Park",
    quota: 140000,
    starts: 28,
    confidence: 55,
    status: "Blocked",
    risk: "High",
    signed: false,
  },
];
export function useVerveQuotaState() {
  const [saved, setSaved] = useState(quotaSeed);
  const [rows, setRows] = useState(quotaSeed);
  return { saved, setSaved, rows, setRows };
}
export function VerveQuotaPlan({ model }: { model: ReturnType<typeof useVerveQuotaState> }) {
  const { saved, setSaved, rows, setRows } = model;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [risk, setRisk] = useState("All risks");
  const changes =
    rows.filter(
      (row) => JSON.stringify(row) !== JSON.stringify(saved.find((item) => item.id === row.id)),
    ).length + saved.filter((row) => !rows.some((item) => item.id === row.id)).length;
  function update(id: string, patch: Partial<Quota>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }
  const shown = rows.filter(
    (row) =>
      (row.name + row.manager).toLowerCase().includes(query.toLowerCase()) &&
      (status === "All statuses" || row.status === status) &&
      (risk === "All risks" || row.risk === risk),
  );
  return (
    <Panel
      className="bt-goal-page bt-quota-plan"
      title="Quota Plan"
      description="Draft next quarter's numbers and sign them off."
      action={
        <Button
          variant="outline"
          onClick={() =>
            setRows((current) => [
              {
                id: `Q4-${Date.now()}`,
                name: "",
                manager: "Mira Stone",
                quota: 0,
                starts: 14,
                confidence: 40,
                status: "Draft",
                risk: "Medium",
                signed: false,
              },
              ...current,
            ])
          }
        >
          <Plus />
          Add rep
        </Button>
      }
    >
      <BusinessGrid
        headers={["Rep", "Quota", "Starts in", "Confidence", "Status", "Risk", "Signed off", ""]}
        toolbar={
          <div className="bt-quota-toolbar">
            <Input
              aria-label="Search reps"
              placeholder="Search reps..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="bt-pills">
              <Choice
                label="Status"
                value={status}
                onChange={setStatus}
                options={["All statuses", "Active", "Draft", "Blocked"]}
              />
              <Choice
                label="Risk"
                value={risk}
                onChange={setRisk}
                options={["All risks", "Low", "Medium", "High"]}
              />
            </div>
          </div>
        }
        rows={shown.map((row) => [
          <span key="rep">
            <Input
              className="bt-inline-input bt-quota-name"
              aria-label={`Rep name ${row.id}`}
              placeholder="Rep name"
              value={row.name}
              onChange={(event) => update(row.id, { name: event.target.value })}
            />
            <small className="bt-table-sub">
              {row.name ? row.id : "New rep"} · {row.manager}
            </small>
          </span>,
          <label key="quota" className="bt-inline-currency">
            $
            <Input
              className="bt-inline-input"
              aria-label={`Quota for ${row.name || "new rep"}`}
              type="number"
              min="0"
              value={row.quota}
              onChange={(event) => update(row.id, { quota: Number(event.target.value) })}
            />
          </label>,
          `${row.starts}d`,
          <span key="confidence" className="bt-confidence">
            <span>
              {Array.from({ length: 5 }, (_, index) => (
                <i
                  key={index}
                  style={{
                    background:
                      index < Math.round(row.confidence / 20)
                        ? row.risk === "Low"
                          ? "var(--bt-green)"
                          : row.risk === "High"
                            ? "var(--bt-red)"
                            : "var(--bt-amber)"
                        : "var(--muted)",
                  }}
                />
              ))}
            </span>
            {row.confidence}%
          </span>,
          <Tone
            key="status"
            tone={row.status === "Active" ? "green" : row.status === "Blocked" ? "red" : "amber"}
          >
            {row.status}
          </Tone>,
          <Tone
            key="risk"
            tone={row.risk === "High" ? "red" : row.risk === "Medium" ? "amber" : "neutral"}
          >
            {row.risk}
          </Tone>,
          <Switch
            key="signed"
            aria-label={`Sign off ${row.name || "new rep"}`}
            checked={row.signed}
            onCheckedChange={(signed) => update(row.id, { signed })}
          />,
          <Button
            variant="ghost"
            size="icon-sm"
            key="delete"
            aria-label={`Remove ${row.name || "new rep"}`}
            onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
          >
            <MoreHorizontal />
          </Button>,
        ])}
      />
      <footer className="bt-save-footer">
        <span role="status">
          <CheckCircle2 size={15} />
          {changes ? `${changes} unsaved change${changes === 1 ? "" : "s"}` : "All changes saved"}
        </span>
        <div className="bt-pills">
          <Button
            variant="outline"
            disabled={!changes}
            onClick={() => setRows(structuredClone(saved))}
          >
            Discard
          </Button>
          <Button
            disabled={!changes || rows.some((row) => !row.name.trim())}
            onClick={() => {
              setSaved(structuredClone(rows));
            }}
          >
            Save changes
          </Button>
        </div>
      </footer>
    </Panel>
  );
}
const sourceRows = [
  ["Inbound", "$1.46M", "47%", "18 deals · $81K avg", "#e7a000"],
  ["Partner", "$775K", "25%", "9 deals · $86K avg", "#00a48e"],
  ["Outbound", "$713K", "23%", "9 deals · $79K avg", "#f16514"],
];
const stageRows = [
  ["New Lead", 9, "#3784ff"],
  ["Qualified", 8, "#9560ef"],
  ["Discovery", 6, "#ef9d00"],
  ["Proposal", 5, "#05b88c"],
  ["Negotiation", 4, "#f7436d"],
  ["Closing", 4, "#17afc3"],
] as const;
export function useVerveLogState() {
  return useState<string[][]>([]);
}
export function VerveQuickStats({ model }: { model: ReturnType<typeof useVerveLogState> }) {
  const [period, setPeriod] = useState("Month");
  const [metric, setMetric] = useState("Deals");
  const [log, setLog] = useState(false);
  const [extra, setExtra] = model;
  const hours = [
    ["Mira Stone", "Sales manager", "6h", "5h 30m", "4h 30m", "6h 30m", "5h", "27h 30m"],
    ["Leo Grant", "Account executive", "7h 30m", "6h 30m", "7h", "6h", "6h 30m", "33h 30m"],
    ["Nora Vale", "Account executive", "6h 30m", "6h", "5h", "5h 30m", "4h", "27h"],
    ["Sana Qureshi", "Account executive", "8h", "7h 30m", "7h", "7h", "6h 30m", "36h"],
  ];
  return (
    <div className="bt-goal-page bt-quick-stats">
      <div className="bt-quick-grid">
        <Panel title="Pipeline by Source" action={<Period value={period} onChange={setPeriod} />}>
          <div className="bt-source-totals">
            <div>
              <small>PIPELINE CREATED</small>
              <strong>
                {period === "Week" ? "$842K" : period === "Year" ? "$11.8M" : "$3.1M"}
              </strong>
            </div>
            <div>
              <small>DEALS</small>
              <strong>{period === "Week" ? 12 : period === "Year" ? 128 : 36}</strong>
            </div>
          </div>
          <div className="bt-source-bar">
            {sourceRows.map(([name, , , , color], index) => (
              <i key={name} style={{ width: `${[47, 25, 23][index]}%`, background: color }} />
            ))}
          </div>
          <div className="bt-source-list">
            {sourceRows.map(([name, value, percent, hint, color]) => (
              <div key={name}>
                <i style={{ background: color }} />
                <span>
                  {name}
                  <small>{hint}</small>
                </span>
                <span>
                  <strong>
                    {period === "Week"
                      ? ["$396K", "$210K", "$194K"][sourceRows.findIndex((row) => row[0] === name)]
                      : value}
                  </strong>
                  <small>{percent}</small>
                </span>
              </div>
            ))}
          </div>
          <p className="bt-source-note">
            The remaining 5% came from sources we don't track separately.
          </p>
        </Panel>
        <Panel
          title="Deals by Stage"
          description="Open deals by pipeline stage"
          action={
            <Choice
              label="Stage metric"
              value={metric}
              onChange={setMetric}
              options={["Deals", "Value"]}
            />
          }
        >
          <div className="bt-stage-list">
            {stageRows.map(([name, count, color], index) => (
              <div key={name}>
                <span
                  style={{
                    background: `color-mix(in srgb, ${color} 25%, var(--background))`,
                    width: `${(count / 9) * 90}%`,
                  }}
                />
                <i style={{ background: color }} />
                <span>{name}</span>
                <strong style={{ color }}>
                  {metric === "Deals" ? count : `$${[1250, 980, 740, 560, 480, 420][index]}K`}
                </strong>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel
        title="Time by Rep"
        description="Weekly hours logged against accounts"
        action={<Button onClick={() => setLog(true)}>New log</Button>}
      >
        <BusinessGrid
          headers={[
            "People",
            "Mon, Jul 13",
            "Tue, Jul 14",
            "Wed, Jul 15",
            "Thu, Jul 16",
            "Fri, Jul 17",
            "Sat, Jul 18",
            "Sun, Jul 19",
            "Total",
          ]}
          rows={[...hours, ...extra].map((row) => [
            <span key="rep">
              <strong>{row[0]}</strong>
              <small className="bt-table-sub">{row[1]}</small>
            </span>,
            ...row.slice(2, 7).map((hour, index) => (
              <span className="bt-time-cell" key={index}>
                {hour}
                <i />
                <small>Client</small>
              </span>
            )),
            "—",
            "—",
            row[7],
          ])}
        />
      </Panel>
      <RecordDialog
        title="New time log"
        open={log}
        onOpenChange={setLog}
        fields={[
          { name: "rep", label: "Rep name", value: "Mira Stone" },
          { name: "account", label: "Account" },
          { name: "hours", label: "Hours", type: "number", value: "1" },
        ]}
        onSave={(value) =>
          setExtra((current) => [
            ...current,
            [value.rep, value.account, `${value.hours}h`, "—", "—", "—", "—", `${value.hours}h`],
          ])
        }
      />
    </div>
  );
}
type Segment = { id: string; name: string; values: number[]; children?: Segment[] };
const segmentSeed: Segment[] = [
  {
    id: "enterprise",
    name: "Enterprise",
    values: [337, 360, 400, 388, 300],
    children: [
      { id: "leo", name: "Leo Grant", values: [165, 192, 204, 178, 142] },
      { id: "sana", name: "Sana Qureshi", values: [172, 168, 196, 210, 158] },
    ],
  },
  {
    id: "midmarket",
    name: "Mid-Market",
    values: [223, 256, 264, 260, 184],
    children: [
      { id: "nora", name: "Nora Vale", values: [108, 132, 126, 141, 96] },
      { id: "mira", name: "Mira Stone", values: [115, 124, 138, 119, 88] },
    ],
  },
  {
    id: "smb",
    name: "SMB",
    values: [52, 68, 61, 72, 44],
    children: [
      { id: "priya", name: "Priya Shah", values: [26, 34, 31, 37, 23] },
      { id: "owen", name: "Owen Clarke", values: [26, 34, 30, 35, 21] },
    ],
  },
];
export function useVerveTargetState() {
  return useState<Segment[]>(segmentSeed);
}
export function VerveAttainment({ model }: { model: ReturnType<typeof useVerveTargetState> }) {
  const [metric, setMetric] = useState("Booked");
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("All Segments");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    enterprise: true,
    midmarket: true,
  });
  const [target, setTarget] = useState(false);
  const [targets, setTargets] = model;
  const data = targets.filter(
    (row) =>
      (segment === "All Segments" || row.name === segment) &&
      (row.name + " " + row.children?.map((child) => child.name).join(" "))
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const columns = useMemo<ColumnDef<DataGridFeatures, Segment>[]>(
    () => [
      {
        id: "name",
        header: "Segment / Rep",
        size: 300,
        cell: ({ row }) => (
          <span className="bt-pills" style={{ paddingLeft: row.depth ? 20 : 0 }}>
            {row.getCanExpand() && <DataGridTableRowExpand row={row} />}
            <span className={row.depth ? "text-muted-foreground" : "font-semibold"}>
              {row.original.name}
            </span>
          </span>
        ),
      },
      ...["Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026"].map((month, index) => ({
        id: month,
        header: month,
        cell: ({ row }: { row: { original: Segment } }) =>
          `$${Math.round(row.original.values[index] * (metric === "Quota" ? 1.2 : metric === "Gap" ? -0.2 : 1) * 1000).toLocaleString()}`,
      })),
    ],
    [metric],
  );
  const table = useTable({
    features: dataGridFeatures,
    data,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.children,
    manualPagination: true,
    state: { expanded },
    onExpandedChange: (updater) =>
      setExpanded((current) => {
        const next = typeof updater === "function" ? updater(current) : updater;
        return next === true ? Object.fromEntries(targets.map((row) => [row.id, true])) : next;
      }),
  });
  return (
    <Panel
      title="Attainment"
      description={`${data.length} Visible Segments · ${metric} vs quota`}
      className="bt-goal-page bt-attainment"
      action={
        <Button onClick={() => setTarget(true)}>
          <Plus />
          New Target
        </Button>
      }
    >
      <div className="bt-attainment-tabs">
        <Tabs value={metric} onValueChange={setMetric}>
          <TabsList variant="line">
            {["Booked", "Quota", "Gap"].map((name) => (
              <TabsTrigger value={name} key={name}>
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          variant="outline"
          onClick={() =>
            setExpanded(
              Object.keys(expanded).length
                ? {}
                : Object.fromEntries(targets.map((row) => [row.id, true])),
            )
          }
        >
          {Object.keys(expanded).length ? "Collapse All" : "Expand All"}
        </Button>
      </div>
      <div className="bt-attainment-filter">
        <Input
          placeholder="Search reps or segments"
          aria-label="Search reps or segments"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Choice
          label="Segment"
          value={segment}
          onChange={setSegment}
          options={["All Segments", ...targets.map((row) => row.name)]}
        />
        <span>Mar 2026 – Jul 2026</span>
      </div>
      <DataGrid
        table={table}
        recordCount={data.length}
        tableLayout={{ rowBorder: true, headerBorder: true, width: "auto" }}
        tableClassNames={{ base: "bt-official-grid", bodyRow: "h-10" }}
      >
        <DataGridScrollArea>
          <DataGridTable />
        </DataGridScrollArea>
      </DataGrid>
      <div className="bt-attainment-totals">
        <span>
          Attainment Summary
          <br />
          <strong>{segment}</strong>
        </span>
        {[0, 1, 2, 3, 4].map((index) => (
          <span key={index}>
            Month Total
            <br />
            <strong>
              ${(data.reduce((sum, row) => sum + row.values[index], 0) * 1000).toLocaleString()}
            </strong>
          </span>
        ))}
      </div>
      <RecordDialog
        title="New Target"
        open={target}
        onOpenChange={setTarget}
        fields={[
          { name: "segment", label: "Segment name" },
          { name: "quota", label: "Monthly quota", type: "number", value: "100000" },
        ]}
        onSave={(value) =>
          setTargets((current) => [
            ...current,
            {
              id: `target-${Date.now()}`,
              name: value.segment,
              values: Array(5).fill(Number(value.quota) / 1000),
            },
          ])
        }
      />
    </Panel>
  );
}
