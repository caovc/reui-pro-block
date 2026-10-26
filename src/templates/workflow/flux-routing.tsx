import { useState } from "react";
import { Plus, RotateCcw, Save } from "lucide-react";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Switch } from "@/components/ui/switch";
import { Button, Input, Status, ExportButton } from "./shared";
import { Choice, SideForm } from "./controls";
import type { RoutingRule, useFluxProviderModel } from "./flux-provider-models";
import "./round3.css";
const controls = [
  { key: "providerFallback", label: "Provider fallback", note: "Move traffic after 12s p95." },
  { key: "longContext", label: "Long context", note: "Allow 64M token peak days." },
  { key: "safety", label: "Safety review", note: "Route SAFE-0914 before send." },
  { key: "lowCost", label: "Low cost mode", note: "Prefer sub $0.18 per MTok." },
] as const;
export function FluxRouting({ model }: { model: ReturnType<typeof useFluxProviderModel> }) {
  const { routes: rows, setRoutes: setRows, providers, active, setActive } = model;
  const [saved, setSaved] = useState(false);
  const [checkpoint, setCheckpoint] = useState(rows);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RoutingRule>({
    id: "",
    name: "",
    description: "",
    risk: "Low",
    fallback: "No fallback",
    note: "",
    providerFallback: false,
    longContext: false,
    safety: false,
    lowCost: false,
  });
  const [invalid, setInvalid] = useState(false);
  function update(row: RoutingRule) {
    setRows(rows.map((item) => (item.id === row.id ? row : item)));
    setSaved(false);
  }
  return (
    <div className="wf-evidence-page">
      <div className="wf-page-heading">
        <div>
          <h1 className="wf-inline">
            Routing Rules <Status>{active ? "Active" : "Paused"}</Status>
          </h1>
          <p>
            {rows.length} routes ·{" "}
            {rows.filter((row) => row.risk === "High" || row.risk === "Restricted").length} with
            locked controls ·{" "}
            <span className="text-destructive">
              {rows.filter((row) => row.risk === "Restricted").length} restricted
            </span>
          </p>
        </div>
        <ExportButton name="routing-rules" rows={rows} />
      </div>
      <Frame dense spacing="sm">
        <FrameHeader>
          <div>
            <FrameTitle>Routing Rules</FrameTitle>
            <FrameDescription>ROUTE-318 · {rows.length} risk tiers</FrameDescription>
          </div>
          <div className="wf-inline">
            <label className="wf-inline">
              Active
              <Switch
                aria-label="Routing active"
                checked={active}
                onCheckedChange={(value) => {
                  setActive(value);
                  setSaved(false);
                }}
              />
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDraft({
                  id: `ROUTE-${500 + rows.length}`,
                  name: "",
                  description: "",
                  risk: "Low",
                  fallback: "No fallback",
                  note: "",
                  providerFallback: false,
                  longContext: false,
                  safety: false,
                  lowCost: false,
                });
                setOpen(true);
              }}
            >
              <Plus />
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRows(checkpoint);
                setSaved(false);
                setInvalid(false);
              }}
            >
              <RotateCcw />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const missing = rows.some(
                  (row) => row.risk === "Restricted" && row.fallback === "No fallback",
                );
                setInvalid(missing);
                if (!missing) {
                  setCheckpoint(rows);
                  setSaved(true);
                }
              }}
            >
              <Save />
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </FrameHeader>
        <FramePanel className="wf-routing-cards">
          <div className="wf-grid wf-routing-grid">
            {rows.map((row) => (
              <section key={row.id} className="wf-route-card">
                <div className="wf-inline wf-between">
                  <div>
                    <strong>{row.name}</strong>
                    <p className="wf-muted">{row.description}</p>
                  </div>
                  <Status>{row.risk}</Status>
                </div>
                <div className="wf-route-policies">
                  {controls.map((control) => {
                    const locked =
                      row.risk === "Restricted" ||
                      (row.risk === "High" && control.key === "safety");
                    return (
                      <label key={control.key}>
                        <span>
                          {control.label}
                          <small>
                            {locked && (control.key === "safety" || control.key === "lowCost")
                              ? "Permission denied by Elijah Morgan."
                              : control.note}
                          </small>
                        </span>
                        <Switch
                          aria-label={`${control.label} ${row.name}`}
                          disabled={locked}
                          checked={row[control.key]}
                          onCheckedChange={(value) => update({ ...row, [control.key]: value })}
                        />
                      </label>
                    );
                  })}
                </div>
                <label className="wf-route-fallback">
                  <span>Fallback priority</span>
                  <Choice
                    label={`Fallback priority ${row.name}`}
                    value={row.fallback}
                    items={["No fallback", ...providers.map((provider) => provider.name)]}
                    onChange={(fallback) => update({ ...row, fallback })}
                  />
                </label>
                <p
                  className={
                    row.risk === "Restricted" && row.fallback === "No fallback"
                      ? "text-destructive"
                      : "wf-muted"
                  }
                >
                  {row.note}
                </p>
              </section>
            ))}
          </div>
          {invalid && (
            <p role="alert" className="text-destructive">
              Choose a fallback for every Restricted route before saving.
            </p>
          )}
        </FramePanel>
      </Frame>
      <SideForm
        open={open}
        onClose={() => setOpen(false)}
        title="Add a rule"
        description="New routes start with every policy control off."
        submit="Add rule"
        onSubmit={() => {
          if (!draft.name.trim() || !draft.id.trim()) return;
          setRows([...rows, draft]);
          setSaved(false);
          setOpen(false);
        }}
      >
        <label>
          Route
          <Input
            required
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
        </label>
        <label>
          Route ID
          <Input
            required
            value={draft.id}
            onChange={(event) => setDraft({ ...draft, id: event.target.value })}
          />
        </label>
        <label>
          Description
          <Input
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
        </label>
        <Choice
          showLabel
          label="Risk tier"
          value={draft.risk}
          items={["Low", "Medium", "High", "Restricted"]}
          onChange={(risk) => setDraft({ ...draft, risk })}
        />
        <p className="wf-muted">Every control stays with the operator at this tier.</p>
        <Choice
          showLabel
          label="Fallback priority"
          value={draft.fallback}
          items={["No fallback", ...providers.map((provider) => provider.name)]}
          onChange={(fallback) => setDraft({ ...draft, fallback })}
        />
        <label>
          Fallback note
          <Input
            value={draft.note}
            onChange={(event) => setDraft({ ...draft, note: event.target.value })}
          />
        </label>
      </SideForm>
    </div>
  );
}
