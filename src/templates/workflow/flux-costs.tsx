import { useState } from "react";
import { ArrowDownToLine, Pencil, Plus, Settings2 } from "lucide-react";
import { ReuiTrend } from "@/blocks/data/trend-foundation";
import { downloadCsv } from "@/blocks/data/data-utils";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, Input, Status, Segments, ExportButton } from "./shared";
import { Choice, Person, SideForm } from "./controls";
import { WorkflowGrid, type WorkflowField } from "./grid";
import type { CostRecord, TokenRecord, useFluxCostModel } from "./flux-cost-models";
import "./round3.css";
const providers = [
  "OpenRoute Primary",
  "Northstar Claude Pool",
  "Batch Summarizer Fleet",
  "VectorEdge Small",
  "Local Guardrail Runner",
];
const short = (value: number) =>
  value >= 1000000
    ? `${(value / 1000000).toFixed(1)}M`
    : value >= 1000
      ? `${Math.round(value / 1000)}K`
      : String(value);
const money = (value: number) =>
  value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value.toFixed(2)}`;
export function FluxSpend({ model }: { model: ReturnType<typeof useFluxCostModel> }) {
  const { records: rows, setRecords: setRows } = model;
  const [tab, setTab] = useState("All Activity");
  const [period, setPeriod] = useState("30D");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CostRecord | null>(null);
  function edit(row?: CostRecord) {
    setDraft(
      row
        ? { ...row }
        : {
            id: `BUD-${2300 + rows.length}`,
            name: "",
            provider: providers[0],
            owner: "Mira Stone",
            scope: "Provider",
            state: "Within Budget",
            spend: 0,
            cap: 10000,
            unit: 0,
            tokens: 0,
            updated: "Just now",
          },
    );
    setEditing(!!row);
    setOpen(true);
  }
  const fields: WorkflowField<CostRecord>[] = [
    {
      key: "name",
      title: "Target",
      size: 280,
      render: (row) => (
        <>
          <button className="wf-text-button" onClick={() => edit(row)}>
            {row.name}
          </button>
          <small className="wf-sub">
            {row.id}
            <br />
            {row.provider}
          </small>
        </>
      ),
    },
    { key: "scope", title: "Scope", size: 130, render: (row) => row.scope },
    { key: "owner", title: "Owner", size: 175, render: (row) => <Person name={row.owner} /> },
    {
      key: "spend",
      title: "Spend",
      size: 185,
      render: (row) => (
        <>
          <strong>{money(row.spend)}</strong>
          <small className="wf-sub">
            {Math.round((row.spend / Math.max(1, row.cap)) * 100)}% of {money(row.cap)}
          </small>
        </>
      ),
    },
    { key: "state", title: "State", size: 160, render: (row) => <Status>{row.state}</Status> },
    {
      key: "unit",
      title: "Unit Cost",
      size: 150,
      render: (row) => (
        <>
          ${row.unit.toFixed(2)}/1M<small className="wf-sub">{short(row.tokens)} tokens</small>
        </>
      ),
    },
    { key: "updated", title: "Updated", size: 120, render: (row) => row.updated },
    {
      key: "actions",
      title: "",
      size: 55,
      render: (row) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit cost ${row.name}`}
          onClick={() => edit(row)}
        >
          <Pencil />
        </Button>
      ),
    },
  ];
  const n = period === "7D" ? 7 : period === "90D" ? 30 : 20;
  const data = Array.from({ length: n }, (_, i) => ({
    name: i === n - 1 ? "MTD" : `W${Math.floor(i / (n / 4)) + 1}`,
    actual: 20 + (i / n) * 166 + Math.sin(i * 0.9) * 5,
    budget: 20 + (i / n) * 150,
  }));
  const filtered = rows.filter(
    (row) =>
      (tab === "All Activity" ||
        (tab === "Budget Events" && row.state !== "Within Budget") ||
        (tab === "Providers" && row.scope === "Provider") ||
        (tab === "Prompts" && row.scope === "Prompt")) &&
      `${row.name} ${row.provider}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="wf-evidence-page">
      <div className="wf-page-heading">
        <div>
          <h1>
            Cost Dashboard <Status>82% Cap</Status>
          </h1>
          <p>$186K month to date · 5 routes · 7 budget events</p>
        </div>
        <ExportButton name="cost-dashboard" rows={rows} />
      </div>
      <div className="wf-grid wf-four wf-ops-metrics">
        {[
          ["Monthly Spend", "$186K", "8.4%", "82% of June cap"],
          ["Token Volume", "64.0M", "11.2%", "1.8M requests today"],
          ["Budget Events", "7", "2 new", "3 need owner action"],
          ["Unit Cost", "$4.18/1M", "5.2%", "$4.41 last month"],
        ].map(([label, value, change, note]) => (
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
            </FramePanel>
          </Frame>
        ))}
      </div>
      <div className="wf-grid wf-wide wf-cost-chart-grid">
        <Frame dense spacing="sm">
          <FrameHeader>
            <div>
              <FrameTitle>Spend Pace</FrameTitle>
              <FrameDescription>Actual spend against budget pace</FrameDescription>
            </div>
            <ExportButton name="spend-pace" rows={data} />
          </FrameHeader>
          <FramePanel>
            <div className="wf-inline wf-between">
              <div>
                <p className="wf-muted">MONTH TO DATE</p>
                <strong className="wf-stat-value">$186K</strong>
                <Status>82% Cap</Status>
              </div>
              <Segments items={["7D", "30D", "90D"]} value={period} onChange={setPeriod} />
            </div>
            <ReuiTrend
              label="Spend pace"
              height={270}
              data={data}
              series={[
                {
                  key: "actual",
                  label: "Actual spend",
                  color: "#2862ff",
                  kind: "area",
                  opacity: 0.06,
                },
                { key: "budget", label: "Budget pace", color: "#a3a3a3", dashed: true },
              ]}
              format={(value) => `$${value.toFixed(0)}K`}
              hideYAxis
            />
          </FramePanel>
        </Frame>
        <Frame dense spacing="sm">
          <FrameHeader>
            <div>
              <FrameTitle>Provider Mix</FrameTitle>
              <FrameDescription>Spend share by active route</FrameDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTab("Providers");
                setQuery("");
              }}
            >
              View All
            </Button>
          </FrameHeader>
          <FramePanel>
            <p className="wf-muted">PROVIDER SPEND</p>
            <strong className="wf-stat-value">$186K</strong>
            {providers.map((provider, i) => (
              <button
                key={provider}
                className="wf-cost-provider"
                onClick={() => {
                  setTab("Providers");
                  setQuery(provider);
                }}
              >
                <span>
                  {provider}
                  <small>
                    {
                      [
                        "Routing and fallback",
                        "Assistant reasoning",
                        "Nightly jobs",
                        "Embeddings",
                        "Safety checks",
                      ][i]
                    }
                  </small>
                </span>
                <span>
                  {money([68200, 51400, 31900, 21800, 12700][i])}
                  <Status>
                    {i === 0 ? "Over Budget" : i < 3 ? "Nearing Cap" : "Within Budget"}
                  </Status>
                </span>
              </button>
            ))}
            <p className="wf-muted text-xs">
              OpenRoute is above target; VectorEdge has spare capacity.
            </p>
          </FramePanel>
        </Frame>
      </div>
      <Frame dense spacing="sm">
        <FrameHeader>
          <div>
            <FrameTitle>Cost Activity</FrameTitle>
            <FrameDescription>
              {rows.length} records across spend, routing, and prompt owners.
            </FrameDescription>
          </div>
          <div className="wf-inline">
            <Button size="sm" onClick={() => edit()}>
              Track Cost
            </Button>
            <ExportButton name="cost-activity" rows={filtered} />
          </div>
        </FrameHeader>
        <FramePanel className="p-0">
          <Segments
            items={["All Activity", "Budget Events", "Providers", "Prompts"]}
            value={tab}
            onChange={setTab}
          />
          <div className="wf-refinement-filter">
            <Input
              aria-label="Filter cost activity"
              placeholder="Target contains…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setTab("All Activity");
              }}
            >
              Clear
            </Button>
          </div>
          <WorkflowGrid rows={filtered} fields={fields} pageSize={5} dense layout="fixed" />
        </FramePanel>
      </Frame>
      <SideForm
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit a cost" : "Track a cost"}
        description="New lines are filed under Provider and within budget."
        submit={editing ? "Save cost" : "Track cost"}
        onSubmit={() => {
          if (!draft?.name.trim()) return;
          setRows(
            editing ? rows.map((row) => (row.id === draft.id ? draft : row)) : [...rows, draft],
          );
          setTab("All Activity");
          setQuery(draft.name);
          setOpen(false);
        }}
      >
        {draft && (
          <>
            <label>
              Target
              <Input
                required
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </label>
            <Choice
              showLabel
              label="Provider"
              value={draft.provider}
              items={providers}
              onChange={(provider) => setDraft({ ...draft, provider })}
            />
            <Choice
              showLabel
              label="Owner"
              value={draft.owner}
              items={[
                "Mira Stone",
                "Alex Johnson",
                "Nora Vale",
                "Priya Patel",
                "Leo Grant",
                "Theo Park",
              ]}
              onChange={(owner) => setDraft({ ...draft, owner })}
            />
            <Choice
              showLabel
              label="Scope"
              value={draft.scope}
              items={["Provider", "Prompt", "Budget"]}
              onChange={(scope) => setDraft({ ...draft, scope })}
            />
            <Choice
              showLabel
              label="Budget state"
              value={draft.state}
              items={["Within Budget", "Nearing Cap", "Over Budget", "Pending Invoice"]}
              onChange={(state) => setDraft({ ...draft, state })}
            />
            {(["spend", "cap", "unit", "tokens"] as const).map((key) => (
              <label key={key}>
                {key === "unit" ? "Unit cost" : key[0].toUpperCase() + key.slice(1)}
                <Input
                  type="number"
                  min="0"
                  step={key === "unit" ? 0.01 : 1}
                  value={draft[key]}
                  onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })}
                />
              </label>
            ))}
          </>
        )}
      </SideForm>
    </div>
  );
}
export function FluxTokenAudit({ model }: { model: ReturnType<typeof useFluxCostModel> }) {
  const { ledger: rows, setLedger: setRows } = model;
  const [provider, setProvider] = useState("All providers");
  const [visible, setVisible] = useState(["id", "provider", "prompt", "input", "output", "state"]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TokenRecord | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [review, setReview] = useState("");
  function edit(row?: TokenRecord) {
    setDraft(
      row
        ? { ...row }
        : {
            id: `TOK-7740-${320 + rows.length}`,
            provider: providers[0],
            prompt: "Support Reply Draft",
            input: 0,
            output: 0,
            state: "Pending Invoice",
            cap: 0,
            date: "Oct 23",
          },
    );
    setEditing(!!row);
    setOpen(true);
  }
  const fields: WorkflowField<TokenRecord>[] = [
    {
      key: "select",
      title: "",
      size: 45,
      render: (row) => (
        <Checkbox
          aria-label={`Select usage ${row.id}`}
          checked={selected.includes(row.id)}
          onCheckedChange={(checked) =>
            setSelected(checked ? [...selected, row.id] : selected.filter((id) => id !== row.id))
          }
        />
      ),
    },
    {
      key: "id",
      title: "Usage ID",
      size: 180,
      render: (row) => (
        <>
          <button className="wf-text-button" onClick={() => edit(row)}>
            {row.id}
          </button>
          <small className="wf-sub">{row.date}</small>
        </>
      ),
    },
    {
      key: "provider",
      title: "Provider",
      size: 250,
      render: (row) => (
        <>
          {row.provider}
          <small className="wf-sub">
            PROV-204{providers.indexOf(row.provider) + 1} · Revenue Ops
          </small>
        </>
      ),
    },
    {
      key: "prompt",
      title: "Prompt",
      size: 230,
      render: (row) => (
        <>
          {row.prompt}
          <small className="wf-sub">PRM-482{providers.indexOf(row.provider) + 1}</small>
        </>
      ),
    },
    { key: "input", title: "Input", size: 110, render: (row) => short(row.input) },
    { key: "output", title: "Output", size: 110, render: (row) => short(row.output) },
    {
      key: "state",
      title: "Budget",
      size: 180,
      render: (row) => (
        <>
          <Status>{row.state}</Status>
          <small className="wf-sub">{row.cap}% cap</small>
        </>
      ),
    },
    {
      key: "actions",
      title: "",
      size: 55,
      render: (row) => (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Edit usage ${row.id}`}
          onClick={() => edit(row)}
        >
          <Pencil />
        </Button>
      ),
    },
  ];
  const filtered = rows.filter((row) => provider === "All providers" || row.provider === provider);
  return (
    <div className="wf-evidence-page">
      <div className="wf-page-heading">
        <div>
          <h1>
            Token Audit <Status>Oct 21 to Oct 23</Status>
          </h1>
          <p>
            {rows.length} records ·{" "}
            {short(rows.reduce((sum, row) => sum + row.input + row.output, 0))} tokens · $32,667
            logged · {rows.filter((row) => row.state !== "Within Budget").length} need attention
          </p>
        </div>
        <ExportButton name="token-audit" rows={rows} />
      </div>
      <Frame dense spacing="sm">
        <FrameHeader>
          <div>
            <FrameTitle>Token Ledger</FrameTitle>
            <FrameDescription>{rows.length} rows · Oct 21 to Oct 23</FrameDescription>
          </div>
          <div className="wf-inline">
            <Button size="sm" onClick={() => edit()}>
              <Plus />
              Add Entry
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadCsv("token-ledger", filtered)}
            >
              <ArrowDownToLine />
              Export CSV
            </Button>
          </div>
        </FrameHeader>
        <FramePanel className="p-0">
          <div className="wf-refinement-filter wf-token-filter">
            <div className="wf-inline">
              <Choice
                label="Filter token provider"
                value={provider}
                items={["All providers", ...providers]}
                onChange={setProvider}
              />
              <Button size="sm" variant="ghost" onClick={() => setProvider("All providers")}>
                Clear
              </Button>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings2 />
                  View Settings <Status>{visible.length}</Status>
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <strong>Visible columns</strong>
                {fields
                  .filter((field) => field.title)
                  .map((field) => (
                    <label key={field.key} className="wf-inline mt-3">
                      <Checkbox
                        checked={visible.includes(field.key)}
                        onCheckedChange={(checked) =>
                          setVisible(
                            checked
                              ? [...visible, field.key]
                              : visible.filter((key) => key !== field.key),
                          )
                        }
                      />
                      {field.title}
                    </label>
                  ))}
              </PopoverContent>
            </Popover>
          </div>
          {selected.length > 0 && (
            <div className="wf-token-selected">
              <span>{selected.length} selected</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRows(
                    rows.map((row) =>
                      selected.includes(row.id) ? { ...row, state: "Within Budget" } : row,
                    ),
                  );
                  setSelected([]);
                }}
              >
                Mark reviewed
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                Clear selection
              </Button>
            </div>
          )}
          <WorkflowGrid
            rows={filtered}
            fields={fields.filter((field) => !field.title || visible.includes(field.key))}
            pageSize={5}
            dense
            layout="fixed"
          />
        </FramePanel>
      </Frame>
      <div className="wf-grid wf-three wf-token-review">
        {[
          ["Review Routing", ["Invoice Hold", "Cap Watch", "Batch Limit"]],
          ["Evidence Checks", ["SAFE-0914", "Owner Digest", "Prompt Log"]],
          ["Owner Handoff", ["Mira Review", "Leo Route", "Nora Check"]],
        ].map(([title, items]) => (
          <Frame dense spacing="sm" key={String(title)}>
            <FrameHeader>
              <FrameTitle>{String(title)}</FrameTitle>
            </FrameHeader>
            <FramePanel>
              {(items as string[]).map((item, i) => (
                <div className="wf-cost-review-row" key={item}>
                  <div>
                    <strong>{item}</strong>
                    <p className="wf-muted">
                      {i === 0
                        ? "Review requested by the route owner."
                        : i === 1
                          ? "Routing remains watched."
                          : "Evidence is attached to this usage."}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setReview(item)}>
                    {i === 0 ? "Open" : i === 1 ? "Review" : "Send"}
                  </Button>
                </div>
              ))}
            </FramePanel>
          </Frame>
        ))}
      </div>
      <SideForm
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Usage Entry" : "Add Usage Entry"}
        description="Add a token ledger usage entry."
        submit={editing ? "Save Entry" : "Add Entry"}
        onSubmit={() => {
          if (!draft) return;
          setRows(
            editing ? rows.map((row) => (row.id === draft.id ? draft : row)) : [...rows, draft],
          );
          setProvider(draft.provider);
          setOpen(false);
        }}
      >
        {draft && (
          <>
            <Choice
              showLabel
              label="Provider"
              value={draft.provider}
              items={providers}
              onChange={(provider) => setDraft({ ...draft, provider })}
            />
            <Choice
              showLabel
              label="Prompt"
              value={draft.prompt}
              items={[
                "Support Reply Draft",
                "Renewal Risk Summary",
                "Nightly Account Summary",
                "Context Recall",
                "Payment Action Review",
              ]}
              onChange={(prompt) => setDraft({ ...draft, prompt })}
            />
            <label>
              Input Tokens
              <Input
                required
                type="number"
                min="0"
                value={draft.input}
                onChange={(event) => setDraft({ ...draft, input: Number(event.target.value) })}
              />
            </label>
            <label>
              Output Tokens
              <Input
                required
                type="number"
                min="0"
                value={draft.output}
                onChange={(event) => setDraft({ ...draft, output: Number(event.target.value) })}
              />
            </label>
            <Choice
              showLabel
              label="Budget State"
              value={draft.state}
              items={["Pending Invoice", "Within Budget", "Needs Review", "Over Budget"]}
              onChange={(state) => setDraft({ ...draft, state })}
            />
          </>
        )}
      </SideForm>
      <SideForm
        open={!!review}
        onClose={() => setReview("")}
        title={review}
        description="Usage review"
        submit="Complete review"
        onSubmit={() => {
          setRows(
            rows.map((row) =>
              row.state === "Needs Review" ? { ...row, state: "Within Budget" } : row,
            ),
          );
          setReview("");
        }}
      >
        <p>
          Review the route owner, attached evidence, and current budget state before closing this
          follow-up.
        </p>
      </SideForm>
    </div>
  );
}
