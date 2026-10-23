import type { FeatureFlag, useFluxFlagsModel } from "./workflow-models";
import { useState } from "react";
import { Flag, Plus } from "lucide-react";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Switch } from "@/components/ui/switch";
import { Button, Input, Status, Segments, ExportButton } from "./shared";
import { Choice, Person, SideForm } from "./controls";
import { WorkflowGrid, type WorkflowField } from "./grid";
import "./refinement.css";
export function FluxFlags({ records }: { records: ReturnType<typeof useFluxFlagsModel> }) {
  const [rows, setRows] = records;
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<FeatureFlag | null>(null);
  const [open, setOpen] = useState(false);
  const fields: WorkflowField<FeatureFlag>[] = [
    {
      key: "name",
      title: "Flag",
      size: 360,
      render: (row) => (
        <>
          <button
            className="wf-text-button"
            onClick={() => {
              setDraft({ ...row });
              setOpen(true);
            }}
          >
            {row.name}
          </button>
          <small className="wf-sub">
            {row.id} {row.provider}
          </small>
          <small className="wf-sub">{row.scope}</small>
        </>
      ),
    },
    {
      key: "owner",
      title: "Owner",
      size: 220,
      render: (row) => (
        <>
          <Person name={row.owner} />
          <small className="wf-sub wf-person-sub">{row.team}</small>
        </>
      ),
    },
    {
      key: "readiness",
      title: "Readiness",
      size: 110,
      render: (row) => <span>★ {row.readiness.toFixed(1)}</span>,
    },
    { key: "stage", title: "Stage", size: 110, render: (row) => <Status>{row.stage}</Status> },
    {
      key: "enabled",
      title: "Enabled",
      size: 100,
      render: (row) => (
        <Switch
          aria-label={`Enable ${row.name}`}
          checked={row.enabled}
          onCheckedChange={(enabled) =>
            setRows(rows.map((item) => (item.id === row.id ? { ...item, enabled } : item)))
          }
        />
      ),
    },
    {
      key: "updated",
      title: "Last updated",
      size: 160,
      render: (row) => (
        <>
          {row.updated}
          <small className="wf-sub">This week</small>
        </>
      ),
    },
  ];
  const filtered = rows.filter(
    (row) =>
      (tab === "All" || row.stage === tab) && row.name.toLowerCase().includes(query.toLowerCase()),
  );
  function newFlag() {
    setDraft({
      id: `PROV-${2041 + rows.length}`,
      name: "",
      provider: "OpenRoute Primary",
      scope: "Internal beta",
      owner: "Nick Bold",
      team: "Operations",
      readiness: 0,
      stage: "Staged",
      enabled: false,
      updated: "Oct 23, 2026",
    });
    setOpen(true);
  }
  return (
    <div className="wf-flags-refined">
      <div className="wf-page-heading">
        <div>
          <h1>Feature Flags</h1>
          <p>
            {rows.length} in the registry　{rows.filter((r) => r.enabled).length} switched on　
            {rows.filter((r) => r.stage === "Review").length} need approval
          </p>
        </div>
        <ExportButton name="feature-flags" rows={rows} />
      </div>
      <Frame dense spacing="sm">
        <FrameHeader>
          <FrameTitle className="wf-inline">
            <Flag className="size-4" />
            AI Feature Flags <span className="wf-muted">{rows.length} flags</span>
          </FrameTitle>
          <Button size="sm" onClick={newFlag}>
            <Plus />
            New Flag
          </Button>
        </FrameHeader>
        <FramePanel className="p-0">
          <Segments
            items={["All", "Live", "Staged", "Review", "Paused"]}
            value={tab}
            onChange={setTab}
          />
          <div className="wf-refinement-filter">
            <Input
              aria-label="Filter feature flags"
              placeholder="Flag contains…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setTab("All");
              }}
            >
              Clear
            </Button>
          </div>
          <WorkflowGrid rows={filtered} fields={fields} pageSize={5} />
        </FramePanel>
      </Frame>
      <div className="wf-page-heading wf-related-heading">
        <div>
          <h2>Related Operations</h2>
          <p>Follow-up lanes linked to this flag registry.</p>
        </div>
        <Button size="sm" variant="outline" onClick={newFlag}>
          <Plus />
          New Action
        </Button>
      </div>
      <div className="wf-grid wf-four">
        {[
          ["Management", "Prompt work.", [0, 5, 6]],
          ["Review Lane", "Approval and safety backlog.", [2, 7, 11]],
          ["Rollout Watch", "Traffic changes in motion.", [1, 8, 9]],
          ["Cost Guard", "Provider and spend exposure.", [3, 4, 10]],
        ].map(([title, description, indices]) => (
          <Frame dense spacing="sm" key={String(title)}>
            <FrameHeader>
              <FrameTitle>{String(title)}</FrameTitle>
              <p className="wf-muted">{String(description)}</p>
            </FrameHeader>
            <FramePanel>
              {(indices as number[]).map((i) => (
                <button
                  className="wf-flag-related"
                  key={i}
                  onClick={() => {
                    setDraft({ ...rows[i] });
                    setOpen(true);
                  }}
                >
                  <strong>{rows[i].name}</strong>
                  <small>
                    {rows[i].owner} · {rows[i].scope}
                  </small>
                  <Status>{rows[i].stage}</Status>
                </button>
              ))}
            </FramePanel>
          </Frame>
        ))}
      </div>
      <SideForm
        open={open}
        onClose={() => setOpen(false)}
        title={rows.some((row) => row.id === draft?.id) ? "Edit Flag" : "New Flag"}
        description="Control the rollout and ownership of this feature."
        submit={rows.some((row) => row.id === draft?.id) ? "Save Flag" : "Create"}
        onSubmit={() => {
          if (!draft?.name.trim()) return;
          setRows(
            rows.some((row) => row.id === draft.id)
              ? rows.map((row) => (row.id === draft.id ? draft : row))
              : [...rows, draft],
          );
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
              label="Kind"
              value={draft.kind ?? "Prompt"}
              items={["Prompt", "Routing", "Guardrail", "Cost control"]}
              onChange={(kind) => setDraft({ ...draft, kind })}
            />
            <Choice
              label="Provider"
              value={draft.provider}
              items={[
                "OpenRoute Primary",
                "Northstar Claude Pool",
                "Local Guardrail Runner",
                "VectorEdge Small",
                "Batch Summarizer Fleet",
              ]}
              onChange={(provider) => setDraft({ ...draft, provider })}
            />
            <h3>Rollout</h3>
            <label>
              Segment
              <Input
                value={draft.scope}
                onChange={(event) => setDraft({ ...draft, scope: event.target.value })}
              />
            </label>
            <Choice
              label="Owner"
              value={draft.owner}
              items={[
                "Nick Bold",
                "Mira Stone",
                "Leo Grant",
                "Nora Vale",
                "Priya Patel",
                "Theo Park",
              ]}
              onChange={(owner) => setDraft({ ...draft, owner })}
            />
            <Choice
              label="Stage"
              value={draft.stage}
              items={["Live", "Staged", "Review", "Paused"]}
              onChange={(stage) => setDraft({ ...draft, stage })}
            />
            <label className="wf-inline wf-between">
              Enabled
              <Switch
                checked={draft.enabled}
                onCheckedChange={(enabled) => setDraft({ ...draft, enabled })}
              />
            </label>
            <label className="wf-inline wf-between">
              Approval
              <Switch
                checked={draft.approval ?? false}
                onCheckedChange={(approval) => setDraft({ ...draft, approval })}
              />
            </label>
            <Button type="button" variant="outline" onClick={newFlag}>
              Reset
            </Button>
          </>
        )}
      </SideForm>
    </div>
  );
}
