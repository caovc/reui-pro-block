import { useState } from "react";
import { Layers, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Button, Input, Status, ExportButton } from "./shared";
import { Choice, Person, SideForm } from "./controls";
import { WorkflowGrid, type WorkflowField } from "./grid";
import type { MemoryEntry, useFluxEvidenceModel } from "./flux-evidence-models";
import "./round3.css";
const scopes = ["customer-facts", "billing-policies", "product-catalog", "support-runbooks"];
export function FluxMemory({ model }: { model: ReturnType<typeof useFluxEvidenceModel> }) {
  const { memories: rows, setMemories: setRows } = model;
  const [scope, setScope] = useState("All scopes");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<MemoryEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  function edit(row?: MemoryEntry) {
    setDraft(
      row
        ? { ...row }
        : {
            id: `MEM-${7500 + rows.length}`,
            fact: "",
            kind: "Preference",
            scope: "customer-facts",
            state: "Needs review",
            agent: "Refund Resolver",
            owner: "Maya Perez",
            confidence: 72,
            source: "Manual entry",
            reads: 0,
            updated: "Just now",
            pinned: false,
          },
    );
    setEditing(!!row);
    setOpen(true);
  }
  const fields: WorkflowField<MemoryEntry>[] = [
    {
      key: "pinned",
      title: "",
      size: 42,
      render: (row) => (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`${row.pinned ? "Unpin" : "Pin"} ${row.fact}`}
          aria-pressed={row.pinned}
          onClick={() =>
            setRows(
              rows.map((item) => (item.id === row.id ? { ...item, pinned: !item.pinned } : item)),
            )
          }
        >
          <Pin className={row.pinned ? "fill-current" : "text-muted-foreground"} />
        </Button>
      ),
    },
    {
      key: "fact",
      title: "Entry",
      size: 300,
      render: (row) => (
        <>
          <button className="wf-text-button" onClick={() => edit(row)} title={row.fact}>
            {row.fact}
          </button>
          <small className="wf-sub">
            {row.id} · {row.agent}
          </small>
        </>
      ),
    },
    { key: "kind", title: "Kind", size: 130, render: (row) => <Status>{row.kind}</Status> },
    {
      key: "scope",
      title: "Scope",
      size: 170,
      render: (row) => <span className="wf-muted">{row.scope}</span>,
    },
    {
      key: "confidence",
      title: "Confidence",
      size: 150,
      render: (row) => (
        <div className="wf-inline">
          <div className="wf-progress">
            <i style={{ width: `${row.confidence}%`, background: "var(--wf-green)" }} />
          </div>
          <small className="wf-muted">{row.confidence}%</small>
        </div>
      ),
    },
    { key: "state", title: "Review", size: 130, render: (row) => <Status>{row.state}</Status> },
    { key: "owner", title: "Owner", size: 200, render: (row) => <Person name={row.owner} /> },
    {
      key: "source",
      title: "Source",
      size: 175,
      render: (row) => (
        <>
          {row.source}
          <small className="wf-sub">{row.reads} reads</small>
        </>
      ),
    },
    { key: "updated", title: "Updated", size: 110, render: (row) => row.updated },
    {
      key: "actions",
      title: "",
      size: 50,
      render: (row) => (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Delete ${row.fact}`}
          onClick={() => setRows(rows.filter((item) => item.id !== row.id))}
        >
          <Trash2 />
        </Button>
      ),
    },
  ];
  const trusted = rows.filter((row) => row.state === "Trusted").length;
  const pinned = rows.filter((row) => row.pinned).length;
  const stale = rows.filter((row) => row.state === "Stale").length;
  const filtered = rows.filter(
    (row) =>
      (scope === "All scopes" || row.scope === scope) &&
      row.fact.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="wf-evidence-page wf-memory-page">
      <div className="wf-page-heading">
        <div>
          <h1>Agent Memory</h1>
          <p>
            {rows.length} entries · {trusted} trusted ·{" "}
            <span className="text-destructive">{stale} stale</span>
          </p>
        </div>
        <ExportButton name="agent-memory" rows={rows} />
      </div>
      <Frame dense spacing="sm">
        <FrameHeader>
          <div>
            <FrameTitle>Memory Manager</FrameTitle>
            <FrameDescription>
              {rows.length} entries · {rows.length - trusted} to review
            </FrameDescription>
          </div>
          <Button size="sm" onClick={() => edit()}>
            <Plus />
            New Entry
          </Button>
        </FrameHeader>
        <FramePanel className="p-0">
          <div className="wf-memory-stats">
            {[
              ["Indexed", rows.length, "4 scopes active"],
              ["Trusted", trusted, `${pinned} pinned entries`],
              ["Review", rows.length - trusted, `${stale} stale entries`],
              [
                "Confidence",
                `${Math.round(rows.reduce((total, row) => total + row.confidence, 0) / Math.max(1, rows.length))}%`,
                "Average retrieval score",
              ],
            ].map(([label, value, note]) => (
              <div key={label}>
                <p>{label}</p>
                <strong>{value}</strong>
                <p>{note}</p>
              </div>
            ))}
          </div>
          <div className="wf-memory-workspace">
            <aside>
              <div className="wf-inline wf-between">
                <strong>Scopes</strong>
                <Status>4 scopes</Status>
              </div>
              <p className="wf-muted">{rows.length} entries | 4 scopes</p>
              <button
                className={scope === "All scopes" ? "active" : ""}
                onClick={() => setScope("All scopes")}
              >
                <Layers />
                <span>
                  All scopes<small>{rows.length} entries indexed | 90 days</small>
                </span>
                <Status>{rows.length}</Status>
              </button>
              <p className="wf-muted">Memory scopes</p>
              {scopes.map((name, i) => (
                <button
                  key={name}
                  className={scope === name ? "active" : ""}
                  onClick={() => setScope(name)}
                >
                  <Layers />
                  <span>
                    {name}
                    <small>
                      {
                        [
                          "Acme and Globex preferences | 60 days",
                          "Refund rules above 500 USD | 120 days",
                          "No entries stored yet | 30 days",
                          "Refund escalation steps | 90 days",
                        ][i]
                      }
                    </small>
                  </span>
                  <Status>{rows.filter((row) => row.scope === name).length}</Status>
                </button>
              ))}
            </aside>
            <div className="wf-memory-grid">
              <div className="wf-refinement-filter">
                <Input
                  aria-label="Filter memory entries"
                  placeholder="Entry contains…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRows(rows.map((row) => ({ ...row, pinned: false })))}
                >
                  <PinOff />
                  Unpin all <small>{pinned} pinned</small>
                </Button>
              </div>
              <WorkflowGrid rows={filtered} fields={fields} pageSize={10} />
            </div>
          </div>
        </FramePanel>
      </Frame>
      <SideForm
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit entry" : "Write an entry"}
        description="Draft facts land in customer-facts for review."
        submit={editing ? "Save entry" : "Add entry"}
        onSubmit={() => {
          if (!draft?.fact.trim()) return;
          setRows(
            editing ? rows.map((row) => (row.id === draft.id ? draft : row)) : [...rows, draft],
          );
          setScope("All scopes");
          setQuery(draft.fact);
          setOpen(false);
        }}
      >
        {draft && (
          <>
            <label>
              Fact
              <Input
                required
                value={draft.fact}
                onChange={(event) => setDraft({ ...draft, fact: event.target.value })}
              />
            </label>
            <Choice
              showLabel
              label="Kind"
              value={draft.kind}
              items={["Preference", "Policy", "Procedure", "Constraint"]}
              onChange={(kind) => setDraft({ ...draft, kind })}
            />
            <Choice
              showLabel
              label="Scope"
              value={draft.scope}
              items={scopes}
              onChange={(scope) => setDraft({ ...draft, scope })}
            />
            <Choice
              showLabel
              label="State"
              value={draft.state}
              items={["Needs review", "Trusted", "Stale"]}
              onChange={(state) => setDraft({ ...draft, state })}
            />
            <Choice
              showLabel
              label="Agent"
              value={draft.agent}
              items={[
                "Refund Resolver",
                "Invoice Reconciler",
                "Data Steward",
                "Outreach Composer",
                "Lead Enricher",
                "Contract Summarizer",
              ]}
              onChange={(agent) => setDraft({ ...draft, agent })}
            />
            <Choice
              showLabel
              label="Owner"
              value={draft.owner}
              items={["Maya Perez", "Noa Kim", "Emil Novak", "Jonas Reed"]}
              onChange={(owner) => setDraft({ ...draft, owner })}
            />
            <label>
              Confidence
              <Input
                type="number"
                min="0"
                max="100"
                value={draft.confidence}
                onChange={(event) => setDraft({ ...draft, confidence: Number(event.target.value) })}
              />
            </label>
          </>
        )}
      </SideForm>
    </div>
  );
}
