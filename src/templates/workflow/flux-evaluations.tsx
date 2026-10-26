import { useState } from "react";
import { CircleAlert, Pencil, Plus, Trash2 } from "lucide-react";
import { ReuiTrend } from "@/blocks/data/trend-foundation";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button, Input, Status, ExportButton } from "./shared";
import { Choice, SideForm } from "./controls";
import { WorkflowGrid, type WorkflowField } from "./grid";
import type { Evaluation, useFluxEvidenceModel } from "./flux-evidence-models";
import "./round3.css";
const trend = [
  95.1, 95.3, 95.7, 95.2, 95.5, 95.3, 95.6, 96.2, 96.5, 96.3, 96.7, 96.4, 96.8, 96.6, 96.9, 96.5,
  96.7, 96.4, 96.8, 96.6, 96.9, 96.5, 93.8, 93.5, 94, 94.3, 94.5, 94.7, 94.8, 95,
];
export function FluxEvaluations({ model }: { model: ReturnType<typeof useFluxEvidenceModel> }) {
  const { evaluations: rows, setEvaluations: setRows } = model;
  const [query, setQuery] = useState("");
  const [regressions, setRegressions] = useState(false);
  const [draft, setDraft] = useState<Evaluation | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  function edit(row?: Evaluation) {
    setDraft(
      row
        ? { ...row }
        : {
            id: `EVAL-${2241 + rows.length}`,
            name: "",
            suite: "Refund Flows",
            agent: "Refund Resolver",
            status: "Passing",
            impact: "None",
            baseline: 8,
            current: 8,
            runs: 12,
            failures: 0,
            reviewer: "Jonas Reed",
            firstFailed: "None",
            finding: "",
            description: "",
          },
    );
    setEditing(!!row);
    setOpen(true);
  }
  const fields: WorkflowField<Evaluation>[] = [
    {
      key: "name",
      title: "Case",
      size: 300,
      render: (row) => (
        <div>
          <button className="wf-text-button" onClick={() => edit(row)}>
            {row.name}
          </button>
          <small className="wf-sub">{row.id}</small>
        </div>
      ),
    },
    { key: "suite", title: "Suite", size: 150, render: (row) => row.suite },
    { key: "agent", title: "Agent", size: 160, render: (row) => row.agent },
    { key: "status", title: "Status", size: 115, render: (row) => <Status>{row.status}</Status> },
    { key: "impact", title: "Impact", size: 110, render: (row) => <Status>{row.impact}</Status> },
    { key: "baseline", title: "v2.0.3", size: 90, render: (row) => row.baseline.toFixed(1) },
    {
      key: "current",
      title: "v2.1.0",
      size: 90,
      render: (row) => <strong>{row.current.toFixed(1)}</strong>,
    },
    {
      key: "delta",
      title: "Delta",
      size: 95,
      value: (row) => row.current - row.baseline,
      render: (row) => (
        <Status>
          {row.status === "Flaky"
            ? "Flaky"
            : `${row.current >= row.baseline ? "+" : ""}${(row.current - row.baseline).toFixed(1)}`}
        </Status>
      ),
    },
    {
      key: "failures",
      title: "Failures",
      size: 100,
      render: (row) => `${row.failures}/${row.runs}`,
    },
    { key: "firstFailed", title: "First Failed", size: 115, render: (row) => row.firstFailed },
    { key: "reviewer", title: "Reviewer", size: 160, render: (row) => row.reviewer },
    {
      key: "actions",
      title: "",
      size: 85,
      render: (row) => (
        <div className="wf-inline">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Edit ${row.name}`}
            onClick={() => edit(row)}
          >
            <Pencil />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Delete ${row.name}`}
            onClick={() => setRows(rows.filter((item) => item.id !== row.id))}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];
  const filtered = rows.filter(
    (row) =>
      row.name.toLowerCase().includes(query.toLowerCase()) &&
      (!regressions || row.status === "Regressed"),
  );
  return (
    <div className="wf-evidence-page">
      <div className="wf-page-heading">
        <div>
          <h1>Evaluation Report</h1>
          <p>Nightly evals · generated Oct 23, 02:14</p>
        </div>
        <ExportButton name="evaluation-report" rows={rows} />
      </div>
      <div className="wf-grid wf-wide wf-evaluation-charts">
        <Frame dense spacing="sm">
          <FrameHeader>
            <FrameTitle>Pass Rate Trend</FrameTitle>
            <span className="wf-muted">v2.0.3 to v2.1.0</span>
          </FrameHeader>
          <FramePanel>
            <p className="wf-muted">Pass rate (Sep 24 to Oct 23)</p>
            <div className="wf-inline">
              <strong className="text-xl">94.6%</strong>
              <small className="text-destructive">↘ -0.1 pts</small>
            </div>
            <ReuiTrend
              label="Evaluation pass rate"
              height={256}
              hideYAxis
              domain={[92.5, 98]}
              data={trend.map((value, i) => ({
                name: i < 7 ? `Sep ${24 + i}` : `Oct ${String(i - 6).padStart(2, "0")}`,
                value,
              }))}
              series={[
                {
                  key: "value",
                  label: "Pass rate",
                  color: "#9861ff",
                  kind: "area",
                  curve: "linear",
                  dots: true,
                  opacity: 0.04,
                },
              ]}
              format={(value) => `${value.toFixed(1)}%`}
            />
          </FramePanel>
        </Frame>
        <Frame dense spacing="sm">
          <FrameHeader>
            <FrameTitle>Suite Results</FrameTitle>
            <span className="wf-muted">Reviewed by Noa Kim</span>
          </FrameHeader>
          <FramePanel>
            <div className="wf-evaluation-totals">
              {[
                ["212", "Passed"],
                ["5", "Suites"],
                ["1", "Regress"],
              ].map(([value, label]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <p>{label}</p>
                </div>
              ))}
            </div>
            <div className="wf-suite-list">
              {[
                ["Outreach Tone", "-4.8", "38/42", 90],
                ["Refund Flows", "+2.1", "46/48", 96],
                ["Data Hygiene", "+0.9", "52/54", 96],
              ].map(([name, delta, score, percent], i) => (
                <button
                  key={name}
                  onClick={() =>
                    setQuery(
                      String(
                        name === "Outreach Tone"
                          ? "Dunning"
                          : name === "Refund Flows"
                            ? "Refund"
                            : "Order",
                      ),
                    )
                  }
                >
                  <span>
                    {name}
                    <small>
                      {delta}　{score}
                    </small>
                  </span>
                  <div className="wf-progress">
                    <i
                      style={{
                        width: `${percent}%`,
                        background: i ? "var(--wf-green)" : "var(--destructive)",
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </FramePanel>
          <footer className="wf-evidence-footer">212 of 224 cases passed on Oct 23</footer>
        </Frame>
      </div>
      <Frame dense spacing="sm">
        <FrameHeader>
          <div>
            <FrameTitle>Case Results</FrameTitle>
            <FrameDescription>v2.1.0 against v2.0.3 · 224 cases nightly</FrameDescription>
          </div>
          <div className="wf-inline">
            <label className="wf-inline">
              Regressions Only
              <Switch
                checked={regressions}
                onCheckedChange={setRegressions}
                aria-label="Regressions Only"
              />
            </label>
            <Button size="sm" onClick={() => edit()}>
              <Plus />
              New case
            </Button>
          </div>
        </FrameHeader>
        <FramePanel className="p-0">
          <div className="wf-refinement-filter">
            <Input
              aria-label="Filter evaluation cases"
              placeholder="Case contains…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setRegressions(false);
              }}
            >
              Clear
            </Button>
          </div>
          <WorkflowGrid
            layout="fixed"
            dense
            rows={filtered}
            fields={fields}
            pageSize={5}
            expandedContent={(row) =>
              row.finding ? (
                <Alert
                  className="wf-case-finding"
                  variant={row.status === "Regressed" ? "destructive" : "default"}
                >
                  <CircleAlert />
                  <AlertTitle>{row.finding}</AlertTitle>
                  <AlertDescription>{row.description}</AlertDescription>
                </Alert>
              ) : null
            }
          />
        </FramePanel>
      </Frame>
      <SideForm
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit case" : "Add a case"}
        description="The case joins its suite in tonight's run."
        submit={editing ? "Save case" : "Add case"}
        onSubmit={() => {
          if (!draft?.name.trim()) return;
          setRows(
            editing ? rows.map((row) => (row.id === draft.id ? draft : row)) : [...rows, draft],
          );
          setQuery(draft.name);
          setOpen(false);
        }}
      >
        {draft && (
          <>
            <label>
              Name
              <Input
                required
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </label>
            <Choice
              label="Suite"
              value={draft.suite}
              items={[
                "Refund Flows",
                "Outreach Tone",
                "Data Hygiene",
                "Invoice Matching",
                "Lead Enrichment",
              ]}
              onChange={(suite) => setDraft({ ...draft, suite })}
            />
            <Choice
              label="Status"
              value={draft.status}
              items={["Passing", "Regressed", "Improved", "Flaky"]}
              onChange={(status) => setDraft({ ...draft, status })}
            />
            <Choice
              label="Impact"
              value={draft.impact}
              items={["None", "Medium", "High", "Critical"]}
              onChange={(impact) => setDraft({ ...draft, impact })}
            />
            <Choice
              label="Reviewer"
              value={draft.reviewer}
              items={[
                "Jonas Reed",
                "Noa Kim",
                "Maya Perez",
                "Emil Novak",
                "Lara Chen",
                "Pavel Singh",
              ]}
              onChange={(reviewer) => setDraft({ ...draft, reviewer })}
            />
            {(["baseline", "current", "runs"] as const).map((key) => (
              <label key={key}>
                {key === "runs" ? "Nightly runs" : key === "baseline" ? "Baseline" : "Current"}
                <Input
                  type="number"
                  min="0"
                  step={key === "runs" ? 1 : 0.1}
                  value={draft[key]}
                  onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })}
                />
              </label>
            ))}
            <label>
              Finding title
              <Input
                value={draft.finding}
                onChange={(event) => setDraft({ ...draft, finding: event.target.value })}
              />
            </label>
            <label>
              Finding description
              <Textarea
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </label>
          </>
        )}
      </SideForm>
    </div>
  );
}
