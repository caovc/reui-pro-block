import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Circle, Pencil, Plus, RotateCcw } from "lucide-react";
import { ReuiTrend } from "@/blocks/data/trend-foundation";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import {
  Timeline,
  TimelineItem,
  TimelineIndicator,
  TimelineSeparator,
  TimelineTitle,
  TimelineContent,
} from "@/components/reui/timeline";
import { Button, Input, Status, ExportButton } from "./shared";
import { Choice, Person, SideForm } from "./controls";
import { WorkflowGrid, type WorkflowField } from "./grid";
import type { OperationRule, useAiOperationsModel } from "./ai-operations-model";
import "./round3.css";
const providers = [
  "OpenRoute Primary",
  "Northstar Claude Pool",
  "VectorEdge Small",
  "Local Guardrail Runner",
  "Batch Summarizer Fleet",
  "Embedding Gateway",
];
export function AiOperations({
  model,
  variant = "flux",
}: {
  model: ReturnType<typeof useAiOperationsModel>;
  variant?: "flux" | "tempo";
}) {
  const { records: rows, setRecords: setRows, step, setStep, notes, setNotes } = model;
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("Last 30 Days");
  const [refreshed, setRefreshed] = useState(false);
  const [draft, setDraft] = useState<OperationRule | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const time = variant === "flux" ? "20:00" : "09:45";
  function edit(row?: OperationRule) {
    setDraft(
      row
        ? { ...row }
        : {
            id: `ROUTE-${325 + rows.length}`,
            name: "",
            provider: providers[0],
            category: "",
            kind: "Fallback",
            scope: "Support",
            status: "Paused",
            tokens: 0,
            latency: "Not sampled",
          },
    );
    setEditing(!!row);
    setOpen(true);
  }
  const fields: WorkflowField<OperationRule>[] = [
    {
      key: "id",
      title: "Reference",
      size: 165,
      render: (row) => (
        <>
          <button className="wf-text-button" onClick={() => edit(row)}>
            {row.id}
          </button>
          <small className="wf-sub">{variant === "flux" ? "Oct 23, 2026" : "Jun 10, 2026"}</small>
        </>
      ),
    },
    {
      key: "name",
      title: "Rule",
      size: 370,
      render: (row) => (
        <>
          <button className="wf-text-button" onClick={() => edit(row)}>
            {row.name}
          </button>
          <small className="wf-sub">
            {row.provider} / {row.category}
          </small>
        </>
      ),
    },
    {
      key: "scope",
      title: "Scope",
      size: 160,
      render: (row) => (
        <>
          {row.scope}
          <small className="wf-sub">{row.latency}</small>
        </>
      ),
    },
    { key: "kind", title: "Kind", size: 120, render: (row) => <Status>{row.kind}</Status> },
    {
      key: "tokens",
      title: "Tokens",
      size: 120,
      render: (row) =>
        row.tokens >= 1000000
          ? `${(row.tokens / 1000000).toFixed(1)}M`
          : `${Math.round(row.tokens / 1000)}K`,
    },
    { key: "status", title: "Status", size: 120, render: (row) => <Status>{row.status}</Status> },
    {
      key: "actions",
      title: "",
      size: 80,
      render: (row) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit rule ${row.id}`}
          onClick={() => edit(row)}
        >
          <Pencil />
        </Button>
      ),
    },
  ];
  const count = period === "Last 7 Days" ? 7 : 30;
  const chart = Array.from({ length: count }, (_, i) => ({
    name:
      variant === "flux"
        ? i < 7
          ? `Sep ${24 + i}`
          : `Oct ${i - 6}`
        : i < 19
          ? `May ${13 + i}`
          : `Jun ${i - 18}`,
    input: 112 + i * 3 + Math.sin(i * 0.35) * 9,
    output: 48 + i * 1.2 + Math.sin(i * 0.32) * 4,
    blocked: 9 + i * 0.2 + Math.sin(i * 0.45) * 1.5,
  }));
  return (
    <div className="wf-evidence-page wf-ai-operations">
      <div className="wf-page-heading">
        <div>
          <h1>AI Operations</h1>
          {variant === "flux" && (
            <p>
              4 providers, {rows.length} routing rules, updated {refreshed ? "just now" : time}
            </p>
          )}
        </div>
        <div className="wf-inline">
          <Choice
            label="AI operations period"
            value={period}
            onChange={setPeriod}
            items={["Last 7 Days", "Last 30 Days"]}
          />
          <Button size="sm" variant="outline" onClick={() => setRefreshed(true)}>
            <RotateCcw />
            {refreshed ? "Refreshed" : "Refresh"}
          </Button>
          <ExportButton name="ai-operations" rows={rows} />
        </div>
      </div>
      <div className="wf-grid wf-three wf-ops-metrics">
        {[
          [
            "Provider Health",
            "99.94%",
            "+0.41%",
            `4 providers healthy at ${time}.`,
            "Failover ready: 2 pools",
          ],
          [
            "Token Volume",
            "48.2M",
            "+12.6%",
            "Support Reply Draft used 2.4M today.",
            "Daily budget: 61%",
          ],
          [
            "Safety Drift",
            "3 policies",
            "-18.0%",
            "PII Redaction review due by 14:00.",
            "Review SLA: 6h",
          ],
        ].map(([label, value, change, note, sub]) => (
          <Frame dense spacing="sm" key={label}>
            <FrameHeader>
              <FrameTitle>{label}</FrameTitle>
            </FrameHeader>
            <FramePanel>
              <div className="wf-inline">
                <strong className="wf-stat-value">{value}</strong>
                <Status>{change}</Status>
              </div>
              <p>{note}</p>
              <p>{sub}</p>
            </FramePanel>
          </Frame>
        ))}
      </div>
      <div className="wf-grid wf-ops-activity">
        <Frame dense spacing="sm">
          <FrameHeader>
            <div>
              <FrameTitle>Provider Failover</FrameTitle>
              <FrameDescription>3 failover checks, 1 blocked</FrameDescription>
            </div>
          </FrameHeader>
          <FramePanel>
            <Timeline value={step} onValueChange={setStep}>
              {[
                ["Primary Provider", "Leo Grant", "Platform engineer"],
                ["Fallback Routing", "Mira Stone", "AI product operator"],
                ["Guardrail Runner", "Nora Vale", "Safety reviewer"],
              ].map(([label, name, role], i) => (
                <TimelineItem step={i + 1} key={label}>
                  <TimelineSeparator />
                  <TimelineIndicator>{i === 0 ? <Check /> : <Circle />}</TimelineIndicator>
                  <TimelineTitle>{label}</TimelineTitle>
                  <TimelineContent>
                    <Button
                      variant="outline"
                      className="wf-ops-owner"
                      onClick={() => setStep(step === i + 1 ? 0 : i + 1)}
                    >
                      <Person name={name} />
                      <span>/ {role}</span>
                      {step === i + 1 ? <ChevronDown /> : <ChevronRight />}
                    </Button>
                    {step === i + 1 && (
                      <div className="wf-ops-note">
                        <div className="wf-inline">
                          <Status>Medium</Status>
                          <Status>Watching</Status>
                        </div>
                        <strong>
                          {i === 1
                            ? "Long context summaries rerouted"
                            : i === 0
                              ? "Primary endpoint checked"
                              : "Safety review pending"}
                        </strong>
                        <p>{notes}</p>
                        <Button size="sm" variant="ghost" onClick={() => setNoteOpen(true)}>
                          Review check <Pencil />
                        </Button>
                      </div>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </FramePanel>
        </Frame>
        <Frame dense spacing="sm">
          <FrameHeader>
            <div>
              <FrameTitle>Token Activity</FrameTitle>
              <FrameDescription>Input, output, and blocked calls</FrameDescription>
            </div>
            <Choice
              label="Token activity period"
              value={period}
              onChange={setPeriod}
              items={["Last 7 Days", "Last 30 Days"]}
            />
          </FrameHeader>
          <FramePanel>
            <ReuiTrend
              label="Token activity"
              height={385}
              data={chart}
              series={[
                { key: "input", label: "Input", color: "#2862ff", curve: "monotone" },
                { key: "output", label: "Output", color: "#ff7500", curve: "monotone" },
                { key: "blocked", label: "Blocked", color: "#53627a", curve: "monotone" },
              ]}
              domain={[0, 220]}
              legend
            />
          </FramePanel>
        </Frame>
      </div>
      <Frame dense spacing="sm">
        <FrameHeader>
          <div>
            <FrameTitle>Routing Rules</FrameTitle>
            <FrameDescription>
              {rows.length} rules, {rows.filter((row) => row.status === "Blocked").length} at risk,
              p95 refreshed {time}.
            </FrameDescription>
          </div>
          <div className="wf-inline">
            <Button size="sm" onClick={() => edit()}>
              <Plus />
              {variant === "flux" ? "Add Rule" : "New rule"}
            </Button>
            <ExportButton name="operation-rules" rows={rows} />
          </div>
        </FrameHeader>
        <FramePanel className="p-0">
          <div className="wf-refinement-filter">
            <Input
              aria-label="Filter operation rules"
              placeholder="Reference contains…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button size="sm" variant="outline" onClick={() => setQuery("")}>
              Clear
            </Button>
          </div>
          <WorkflowGrid
            rows={rows.filter((row) =>
              `${row.id} ${row.name}`.toLowerCase().includes(query.toLowerCase()),
            )}
            fields={fields}
            pageSize={5}
            layout="fixed"
            dense
          />
        </FramePanel>
      </Frame>
      <SideForm
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit a rule" : "Add a rule"}
        description="New rules start paused until an operator resumes them."
        submit={editing ? "Save rule" : "Add rule"}
        onSubmit={() => {
          if (!draft?.name.trim() || !draft.id.trim()) return;
          setRows(
            editing ? rows.map((row) => (row.id === draft.id ? draft : row)) : [...rows, draft],
          );
          setQuery(draft.id);
          setOpen(false);
        }}
      >
        {draft && (
          <>
            <label>
              Rule
              <Input
                required
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </label>
            <label>
              Reference
              <Input
                required
                value={draft.id}
                onChange={(event) => setDraft({ ...draft, id: event.target.value })}
              />
            </label>
            <Choice
              showLabel
              label="Provider"
              value={draft.provider}
              items={providers}
              onChange={(provider) => setDraft({ ...draft, provider })}
            />
            <label>
              Category
              <Input
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
              />
            </label>
            <Choice
              showLabel
              label="Kind"
              value={draft.kind}
              items={["Primary", "Fallback", "Guardrail", "Batch"]}
              onChange={(kind) => setDraft({ ...draft, kind })}
            />
            <Choice
              showLabel
              label="Scope"
              value={draft.scope}
              items={["Support", "Finance", "Platform", "Product"]}
              onChange={(scope) => setDraft({ ...draft, scope })}
            />
            <Choice
              showLabel
              label="Status"
              value={draft.status}
              items={["Paused", "Healthy", "Blocked"]}
              onChange={(status) => setDraft({ ...draft, status })}
            />
            <label>
              Daily tokens
              <Input
                type="number"
                min="0"
                value={draft.tokens}
                onChange={(event) => setDraft({ ...draft, tokens: Number(event.target.value) })}
              />
            </label>
            <p className="wf-muted">What this rule is budgeted to move in a day.</p>
          </>
        )}
      </SideForm>
      <SideForm
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Failover check"
        description="Review the latest routing observation."
        submit="Save check"
        onSubmit={() => setNoteOpen(false)}
      >
        <label>
          Observation
          <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </SideForm>
    </div>
  );
}
