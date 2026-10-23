import type { Segment, useTempoReportsModel } from "./workflow-models";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ReuiDonut } from "@/blocks/data/reui-free-chart-primitives";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Button, Input, Status, ExportButton } from "./shared";
import { WorkflowGrid, type WorkflowField } from "./grid";
import { Choice, Person, SideForm } from "./controls";
import "./refinement.css";
export function TempoReports({ records }: { records: ReturnType<typeof useTempoReportsModel> }) {
  const [rows, setRows] = records;
  const [active, setActive] = useState<number | null>(null);
  const [filter, setFilter] = useState("All Segments");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Segment>(rows[0]);
  const [editing, setEditing] = useState(false);
  const fields: WorkflowField<Segment>[] = [
    {
      key: "name",
      title: "Segment",
      size: 300,
      render: (row) => (
        <>
          <button
            className="wf-text-button"
            onClick={() => {
              setDraft({ ...row });
              setEditing(true);
              setOpen(true);
            }}
          >
            {row.name}
          </button>
          <small className="wf-sub">{row.id} – May activation cohort</small>
        </>
      ),
    },
    { key: "owner", title: "Owner", size: 190, render: (row) => <Person name={row.owner} /> },
    { key: "invites", title: "Invites", size: 120, render: (row) => row.invites.toLocaleString() },
    {
      key: "reports",
      title: "Saved Reports",
      size: 140,
      render: (row) => row.reports.toLocaleString(),
    },
    {
      key: "retained",
      title: "W4 Retained",
      size: 135,
      render: (row) => row.retained.toLocaleString(),
    },
    { key: "risk", title: "Risk", size: 110, render: (row) => <Status>{row.risk}</Status> },
    { key: "updated", title: "Updated", size: 150, render: (row) => row.updated },
  ];
  return (
    <div className="wf-tempo-reports">
      <div className="wf-grid wf-wide">
        <Frame dense spacing="sm">
          <FrameHeader>
            <FrameTitle>Activation Funnel</FrameTitle>
            <span className="wf-muted">Last 30 days</span>
          </FrameHeader>
          <FramePanel>
            <div className="wf-funnel-metrics">
              {[
                ["Account Created", "3,572", "14%"],
                ["Invite Sent", "2,638", "19%"],
                ["Saved Report", "1,788", "11%"],
                ["Week Four Retained", "1,014", "6%"],
              ].map(([label, value, change]) => (
                <div key={label}>
                  <p>{label}</p>
                  <strong>{value}</strong>
                  <Status>{change}</Status>
                </div>
              ))}
            </div>
            <div className="wf-funnel-stages">
              {[88, 74, 62, 48, 35].map((height, i) => (
                <div key={i}>
                  <div style={{ height: `${height}%` }}>
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <small>W{i + 2}</small>
                </div>
              ))}
            </div>
          </FramePanel>
        </Frame>
        <Frame dense spacing="sm">
          <FrameHeader>
            <FrameTitle>Segment Mix</FrameTitle>
            <ExportButton name="segment-mix" rows={rows} />
          </FrameHeader>
          <FramePanel>
            <p className="wf-muted">Activated Workspaces</p>
            <strong className="wf-stat-value">
              {rows.reduce((sum, row) => sum + row.retained, 0).toLocaleString()}
            </strong>
            <ReuiDonut
              label="Retained workspace segment mix"
              rows={rows.map((row, i) => ({
                name: row.name,
                value: row.retained,
                color: [
                  "var(--chart-1)",
                  "var(--chart-2)",
                  "var(--chart-3)",
                  "var(--chart-4)",
                  "var(--chart-5)",
                ][i % 5],
              }))}
              active={active}
              onActive={setActive}
              onSelect={(index) => setFilter(rows[index].name)}
              innerRadius={58}
              outerRadius={96}
              pattern={[1]}
              center={
                <text textAnchor="middle" className="fill-foreground text-xl font-semibold">
                  {active === null ? "976" : rows[active]?.retained}
                </text>
              }
            />
            <p className="wf-muted">Mix reflects retained workspaces in the active cohort.</p>
          </FramePanel>
        </Frame>
      </div>
      <Frame dense spacing="sm" className="wf-segment-table">
        <FrameHeader>
          <div>
            <FrameTitle>Stage Breakdown</FrameTitle>
            <p className="wf-muted">Segment cohorts by invite, report, and retained usage.</p>
          </div>
          <div className="wf-inline">
            <Choice
              label="Filter segments"
              value={filter}
              onChange={setFilter}
              items={["All Segments", ...rows.map((row) => row.name)]}
            />
            <ExportButton name="stage-breakdown" rows={rows} />
            <Button
              size="sm"
              onClick={() => {
                setDraft({
                  id: `SEG-${307 + rows.length}`,
                  name: "",
                  owner: "Nick Bold",
                  invites: 0,
                  reports: 0,
                  retained: 0,
                  risk: "Low",
                  updated: "Oct 23, 2026",
                });
                setEditing(false);
                setOpen(true);
              }}
            >
              <Plus />
              New segment
            </Button>
          </div>
        </FrameHeader>
        <FramePanel className="p-0">
          <WorkflowGrid
            rows={rows.filter((row) => filter === "All Segments" || row.name === filter)}
            fields={fields}
            pageSize={5}
          />
        </FramePanel>
      </Frame>
      <SideForm
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit segment" : "Create segment"}
        description="Track invite, report and retention progress for a cohort."
        submit={editing ? "Save segment" : "Create segment"}
        onSubmit={() => {
          if (!draft.name.trim()) return;
          setRows(
            editing ? rows.map((row) => (row.id === draft.id ? draft : row)) : [...rows, draft],
          );
          setFilter(draft.name);
          setOpen(false);
        }}
      >
        <label>
          Segment name
          <Input
            required
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
        </label>
        <label>
          Cohort
          <Input
            value={draft.cohort ?? "May activation cohort"}
            onChange={(event) => setDraft({ ...draft, cohort: event.target.value })}
          />
        </label>
        <label>
          Account created
          <Input
            type="number"
            min="0"
            value={draft.created ?? 0}
            onChange={(event) => setDraft({ ...draft, created: Number(event.target.value) })}
          />
        </label>
        <Choice
          label="Owner"
          value={draft.owner}
          items={["Nick Bold", "Mira Stone", "Leo Grant", "Nora Vale", "Priya Patel", "Theo Park"]}
          onChange={(owner) => setDraft({ ...draft, owner })}
        />
        <Choice
          label="Risk"
          value={draft.risk}
          items={["Low", "Medium", "High"]}
          onChange={(risk) => setDraft({ ...draft, risk })}
        />
        <label>
          Drop-off %
          <Input
            type="number"
            min="0"
            max="100"
            value={draft.dropoff ?? 0}
            onChange={(event) => setDraft({ ...draft, dropoff: Number(event.target.value) })}
          />
        </label>
        {(["invites", "reports", "retained"] as const).map((key) => (
          <label key={key}>
            {key === "invites" ? "Invites" : key === "reports" ? "Saved reports" : "W4 retained"}
            <Input
              type="number"
              min="0"
              value={draft[key]}
              onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })}
            />
          </label>
        ))}
      </SideForm>
    </div>
  );
}
