import { useState } from "react";
import {
  Activity,
  Database,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button, Input, Status, ExportButton } from "./shared";
import { Choice, SideForm } from "./controls";
import type { ProviderConnection, useFluxProviderModel } from "./flux-provider-models";
import "./round3.css";
export function FluxConnections({ model }: { model: ReturnType<typeof useFluxProviderModel> }) {
  const { providers: rows, setProviders: setRows } = model;
  const [draft, setDraft] = useState<ProviderConnection | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [credential, setCredential] = useState("");
  const [tested, setTested] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  function update(value: ProviderConnection) {
    setRows(rows.map((row) => (row.id === value.id ? value : row)));
    setSaved(false);
  }
  function edit(row?: ProviderConnection) {
    setDraft(
      row
        ? { ...row }
        : {
            id: `PROV-${2041 + rows.length}`,
            name: "",
            status: "Missing Key",
            metric: "Not tested",
            route: "ROUTE-318",
            purpose: "",
            endpoint: "",
            owner: "Mira Stone",
            role: "Fallback",
            enabled: false,
            priority: rows.length + 1,
            credential: false,
          },
    );
    setCredential("");
    setEditing(!!row);
    setOpen(true);
  }
  const ready = rows.filter((row) => row.credential).length;
  return (
    <div className="wf-evidence-page">
      <div className="wf-page-heading">
        <div>
          <h1>Provider Connections</h1>
          <p>
            {rows.length} providers · {ready} ready ·{" "}
            {rows.filter((row) => row.role === "Fallback").length} on fallback ·{" "}
            <span className="text-destructive">{rows.length - ready} missing a key</span>
          </p>
        </div>
        <ExportButton name="provider-connections" rows={rows} />
      </div>
      <Frame dense spacing="sm" className="wf-provider-toolbar">
        <FrameHeader>
          <div>
            <FrameTitle>Provider Settings</FrameTitle>
            <FrameDescription>ROUTE-318 priority, fallback, and endpoint health</FrameDescription>
          </div>
          <div className="wf-inline">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setTested(
                  Object.fromEntries(
                    rows.map((row) => [
                      row.id,
                      row.credential ? "Endpoint ready" : "Missing credential",
                    ]),
                  ),
                )
              }
            >
              <RotateCcw />
              Test All
            </Button>
            <Button size="sm" variant="outline" onClick={() => edit()}>
              <Plus />
              Add
            </Button>
            <ExportButton name="provider-settings" rows={rows} />
            <Button size="sm" onClick={() => setSaved(true)}>
              <Save />
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </FrameHeader>
      </Frame>
      <div className="wf-grid wf-two wf-provider-metrics">
        <Frame dense spacing="sm">
          <FramePanel>
            <div className="wf-inline">
              <IconTile variant="frame">
                <Activity />
              </IconTile>
              <div>
                <strong>Ready Providers</strong>
                <p className="wf-muted">Connected or degraded endpoints</p>
              </div>
            </div>
            <strong className="wf-stat-value">
              {ready} / {rows.length}
            </strong>
            <small className="wf-muted">Needs key　{rows.length - ready} providers</small>
          </FramePanel>
        </Frame>
        <Frame dense spacing="sm">
          <FramePanel>
            <div className="wf-inline">
              <IconTile variant="frame">
                <ShieldCheck />
              </IconTile>
              <div>
                <strong>Guarded Fallbacks</strong>
                <p className="wf-muted">Safety routes with fallback owners</p>
              </div>
            </div>
            <strong className="wf-stat-value">4</strong>
            <small className="wf-muted">Open gaps　2 routes</small>
          </FramePanel>
        </Frame>
      </div>
      <Frame dense spacing="sm">
        <FramePanel className="p-0">
          {[...rows]
            .sort((a, b) => a.priority - b.priority)
            .map((row) => (
              <div key={row.id} className="wf-provider-row">
                <IconTile variant="frame">
                  <Database />
                </IconTile>
                <div className="wf-provider-copy">
                  <div className="wf-inline">
                    <strong>{row.name}</strong>
                    <Status>
                      {!row.credential
                        ? "Missing Key"
                        : row.enabled
                          ? row.status === "Paused"
                            ? "Connected"
                            : row.status
                          : "Paused"}
                    </Status>
                    <Status>{row.metric}</Status>
                  </div>
                  <p>
                    {row.id} / {row.route} / {row.purpose}
                  </p>
                  {tested[row.id] && <small role="status">Last test: {tested[row.id]}</small>}
                </div>
                <div className="wf-inline wf-provider-actions">
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Test ${row.name}`}
                    onClick={() =>
                      setTested({
                        ...tested,
                        [row.id]: row.credential ? "Endpoint ready" : "Missing credential",
                      })
                    }
                  >
                    <RotateCcw />
                    Test
                  </Button>
                  <Choice
                    label={`Priority ${row.name}`}
                    value={`P${row.priority}`}
                    items={rows.map((_, i) => `P${i + 1}`)}
                    onChange={(value) => {
                      const priority = Number(value.slice(1));
                      setRows(
                        rows.map((item) =>
                          item.id === row.id
                            ? { ...item, priority }
                            : item.priority === priority
                              ? { ...item, priority: row.priority }
                              : item,
                        ),
                      );
                      setSaved(false);
                    }}
                  />
                  {row.credential ? (
                    <Switch
                      aria-label={`Enable provider ${row.name}`}
                      checked={row.enabled}
                      onCheckedChange={(enabled) => update({ ...row, enabled })}
                    />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Connect ${row.name}`}
                      onClick={() => edit(row)}
                    >
                      Connect
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon-sm" variant="ghost" aria-label={`Actions ${row.name}`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => edit(row)}>
                        Edit connection
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setRows(rows.filter((item) => item.id !== row.id));
                          setSaved(false);
                        }}
                      >
                        Delete connection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
        </FramePanel>
      </Frame>
      <SideForm
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit connection" : "Add a connection"}
        description="New connections start missing key and last in priority."
        submit={editing ? "Save connection" : "Add connection"}
        onSubmit={() => {
          if (!draft?.name.trim() || !draft.endpoint.trim()) return;
          const connection = {
            ...draft,
            credential: draft.credential || !!credential.trim(),
            enabled: draft.credential || !!credential.trim(),
            status: draft.credential || credential.trim() ? "Connected" : "Missing Key",
          };
          setRows(
            editing
              ? rows.map((row) => (row.id === draft.id ? connection : row))
              : [...rows, connection],
          );
          setSaved(false);
          setOpen(false);
          setCredential("");
        }}
      >
        {draft && (
          <>
            <label>
              Provider
              <Input
                required
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </label>
            <label>
              Endpoint
              <Input
                required
                type="url"
                value={draft.endpoint}
                onChange={(event) => setDraft({ ...draft, endpoint: event.target.value })}
                placeholder="https://provider.example/v1"
              />
            </label>
            <label>
              Route
              <Input
                value={draft.route}
                onChange={(event) => setDraft({ ...draft, route: event.target.value })}
              />
            </label>
            <label>
              Route purpose
              <Input
                value={draft.purpose}
                onChange={(event) => setDraft({ ...draft, purpose: event.target.value })}
              />
            </label>
            <Choice
              showLabel
              label="Fallback role"
              value={draft.role}
              items={["Primary", "Fallback", "Guardrail"]}
              onChange={(role) => setDraft({ ...draft, role })}
            />
            <Choice
              showLabel
              label="Owner"
              value={draft.owner}
              items={["Mira Stone", "Leo Grant", "Nora Vale", "Theo Park"]}
              onChange={(owner) => setDraft({ ...draft, owner })}
            />
            <label>
              Credential
              <Input
                type="password"
                autoComplete="off"
                placeholder={draft.credential ? "Credential configured" : "Enter credential"}
                value={credential}
                onChange={(event) => setCredential(event.target.value)}
              />
            </label>
            <p className="wf-muted">Status　{draft.credential ? "Connected" : "Missing Key"}</p>
          </>
        )}
      </SideForm>
    </div>
  );
}
