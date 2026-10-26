import { useState } from "react";
import { Copy, Eye, MoreHorizontal, Pencil, Plus, Server, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DomainRecordGrid, type DomainField } from "@/blocks/data/grid-advanced-model-grid";
import { Identity, TabsBar } from "@/blocks/data/grid-base-common";
import {
  FilterBar,
  firstRule,
  matchesRules,
  type FilterRule,
} from "@/blocks/data/grid-filter-controls";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Rating } from "@/components/reui/rating";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, Detail, Status } from "./shared";
import { Choice, DateChoice, SideForm } from "./controls";
import type { Host, useLucentInfrastructureModel } from "./lucent-infrastructure-model";
import "./infrastructure.css";

export function LucentHosts({ model }: { model: ReturnType<typeof useLucentInfrastructureModel> }) {
  const { fleet: rows, setFleet: setRows, records } = model;
  const [tab, setTab] = useState("All");
  const [rules, setRules] = useState<FilterRule[]>([firstRule("name")]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selection, setSelection] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Host | null>(null);
  const [detailId, setDetailId] = useState("");
  const detail = rows.find((row) => row.id === detailId);
  function edit(row?: Host) {
    setDraft(
      row
        ? { ...row }
        : {
            id: crypto.randomUUID(),
            name: `ip-10-5-0-${rows.length + 1}`,
            owner: "Elena Varga",
            cluster: records[0]?.name ?? "prod-eu-1",
            window: "Awaiting check-in",
            hardening: 0,
            state: "Pending patch",
            monitoring: true,
            seen: "Awaiting check-in",
            role: "Worker",
            agentVersion: "7.54.2 — current",
            autoApprove: true,
          },
    );
    setEditing(!!row);
    setDetailId("");
  }
  function update(id: string, patch: Partial<Host>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }
  function decommission(row: Host) {
    setRows((current) => current.filter((item) => item.id !== row.id));
    setSelection((current) => current.filter((id) => id !== row.id));
    setDetailId("");
    toast.success(`${row.name} decommissioned`);
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }
  const fields: DomainField<Host>[] = [
    {
      id: "select",
      title: "",
      size: 32,
      value: () => "",
      render: (row) => (
        <Checkbox
          aria-label={`Select host ${row.name}`}
          checked={selection.includes(row.id)}
          onCheckedChange={(checked) =>
            setSelection((current) =>
              checked ? [...current, row.id] : current.filter((id) => id !== row.id),
            )
          }
        />
      ),
    },
    {
      id: "name",
      title: "Host",
      size: 335,
      value: (row) => row.name,
      render: (row) => (
        <div className="wf-host-name">
          <span className="wf-host-icon">
            <Server className="size-4" />
          </span>
          <div>
            <button className="wf-text-button" onClick={() => setDetailId(row.id)}>
              {row.name}
            </button>
            <small className="wf-sub">
              {row.window} · {row.cluster}
            </small>
          </div>
        </div>
      ),
    },
    {
      id: "owner",
      title: "Owner",
      size: 175,
      value: (row) => row.owner,
      render: (row) => (
        <div className="wf-host-owner">
          <Identity
            name={row.owner}
            detail={`${row.owner.toLowerCase().replaceAll(" ", "-")}@bricklane.example`}
          />
        </div>
      ),
    },
    {
      id: "hardening",
      title: "Hardening",
      size: 150,
      value: (row) => row.hardening,
      render: (row) => <Rating rating={row.hardening} showValue size="sm" />,
    },
    {
      id: "state",
      title: "Patch state",
      size: 150,
      value: (row) => row.state,
      render: (row) => (
        <span className="wf-infra-state">
          <i data-state={row.state.toLowerCase().replaceAll(" ", "-")} />
          <Status>{row.state}</Status>
        </span>
      ),
    },
    {
      id: "monitoring",
      title: "Monitoring",
      size: 115,
      value: (row) => row.monitoring,
      render: (row) => (
        <Switch
          size="sm"
          aria-label={`Monitor ${row.name}`}
          checked={row.monitoring}
          onCheckedChange={(monitoring) => update(row.id, { monitoring })}
        />
      ),
    },
    { id: "seen", title: "Last seen", size: 125, value: (row) => row.seen },
    {
      id: "actions",
      title: "",
      size: 58,
      value: () => "",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Host actions ${row.name}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetailId(row.id)}>
              <Eye />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => edit(row)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void copy(row.name)}>
              <Copy />
              Copy hostname
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => decommission(row)}>
              <Trash2 />
              Decommission
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  const enrolment = draft
    ? `bricklane-agent enroll --cluster ${draft.cluster} --role ${(draft.role ?? "Worker").toLowerCase()} --version ${(draft.agentVersion ?? "7.54.2").split(" ")[0]} --token preview-${draft.id.slice(0, 8)}`
    : "";
  return (
    <div className="wf-evidence-page wf-host-page">
      <Frame dense spacing="sm">
        <FrameHeader>
          <div>
            <FrameTitle>Host Fleet</FrameTitle>
            <FrameDescription>
              {rows.length} hosts · {rows.filter((row) => row.state === "Patched").length} patched ·{" "}
              {rows.filter((row) => row.state === "Pending patch").length} pending
            </FrameDescription>
          </div>
          <Button size="sm" onClick={() => edit()}>
            <Plus />
            Add host
          </Button>
        </FrameHeader>
        <FramePanel className="p-0">
          <TabsBar
            tabs={["All", "Patched", "Pending patch", "Drifted", "Offline"]}
            counts={Object.fromEntries(
              ["All", "Patched", "Pending patch", "Drifted", "Offline"].map((state) => [
                state,
                rows.filter((row) => state === "All" || row.state === state).length,
              ]),
            )}
            value={tab}
            onChange={(value) => {
              setTab(value);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
          />
          <FilterBar
            fields={[
              { key: "name", label: "Host" },
              { key: "owner", label: "Owner" },
              {
                key: "cluster",
                label: "Cluster",
                type: "select",
                options: [...new Set(rows.map((row) => row.cluster))],
              },
              {
                key: "state",
                label: "Patch state",
                type: "select",
                options: ["Patched", "Pending patch", "Drifted", "Offline"],
              },
            ]}
            rules={rules}
            onChange={(value) => {
              setRules(value);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
            className="wf-registry-filters"
            clearLabel=""
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRules([firstRule("name")]);
                setTab("All");
                setPagination({ ...pagination, pageIndex: 0 });
              }}
            >
              Clear
            </Button>
          </FilterBar>
          {selection.length > 0 && (
            <div className="wf-infra-toolbar">
              <span>{selection.length} selected</span>
              <Button size="sm" variant="outline" onClick={() => setSelection([])}>
                Clear selection
              </Button>
            </div>
          )}
          <DomainRecordGrid
            data={rows.filter(
              (row) => (tab === "All" || row.state === tab) && matchesRules(row, rules),
            )}
            fields={fields}
            selection={selection}
            onSelectionChange={setSelection}
            pagination={pagination}
            onPaginationChange={setPagination}
            getRowId={(row) => row.id}
            layout={{ width: "fixed" }}
            paginationControls={{ sizes: [5, 10, 20, 50] }}
          />
        </FramePanel>
      </Frame>
      <SideForm
        open={!!draft}
        onClose={() => setDraft(null)}
        title={editing ? (draft?.name ?? "Host details") : "Add host"}
        description={editing ? "Host details" : "Enrol a machine that already exists."}
        className={editing ? "wf-infra-host-form" : ""}
        submit={editing ? "Save changes" : "Add host"}
        onSubmit={() => {
          if (!draft) return;
          if (editing) update(draft.id, draft);
          else
            setRows((current) => [
              ...current,
              { ...draft, lifecycle: draft.autoApprove ? "Active" : "Pending approval" },
            ]);
          setTab("All");
          setRules([{ ...firstRule("name"), values: [draft.name] }]);
          setPagination({ ...pagination, pageIndex: 0 });
          setDraft(null);
        }}
      >
        {draft &&
          (editing ? (
            <div className="wf-host-edit-fields">
              <h3>Delivery</h3>
              <HostChoice
                label="Cluster"
                value={draft.cluster}
                items={[...new Set([draft.cluster, ...records.map((row) => row.name)])]}
                onChange={(cluster) => setDraft({ ...draft, cluster })}
              />
              <div className="wf-host-edit-row">
                <span>Patch window</span>
                <div className="wf-inline">
                  <DateChoice
                    label="Patch window start"
                    value={draft.patchStart ?? "2026-07-28"}
                    onChange={(patchStart) => setDraft({ ...draft, patchStart })}
                  />
                  <span className="wf-muted">to</span>
                  <DateChoice
                    label="Patch window end"
                    value={draft.patchEnd ?? "2026-08-25"}
                    onChange={(patchEnd) => setDraft({ ...draft, patchEnd })}
                  />
                </div>
              </div>
              <HostChoice
                label="Profile"
                value={draft.profile ?? "General purpose"}
                items={["General purpose", "Compute optimised", "Memory optimised"]}
                onChange={(profile) => setDraft({ ...draft, profile })}
              />
              <HostChoice
                label="Provisioned by"
                value={draft.provisionedBy ?? "Golden image"}
                items={["Golden image", "Terraform", "Manual enrolment"]}
                onChange={(provisionedBy) => setDraft({ ...draft, provisionedBy })}
              />
              <HostChoice
                label="Patch priority"
                value={draft.patchPriority ?? "Medium"}
                items={["Low", "Medium", "High", "Critical"]}
                onChange={(patchPriority) => setDraft({ ...draft, patchPriority })}
              />
              <label className="wf-host-edit-row">
                <span>Compliance</span>
                <Switch
                  aria-label="Compliance"
                  checked={draft.compliance ?? true}
                  onCheckedChange={(compliance) => setDraft({ ...draft, compliance })}
                />
              </label>
              <h3>Operations</h3>
              <HostChoice
                label="Group"
                value={draft.group ?? "Compute"}
                items={["Compute", "Data", "Edge", "Platform"]}
                onChange={(group) => setDraft({ ...draft, group })}
              />
              <label className="wf-host-edit-row">
                <span>Monitored</span>
                <Switch
                  aria-label="Monitored"
                  checked={draft.monitoring}
                  onCheckedChange={(monitoring) => setDraft({ ...draft, monitoring })}
                />
              </label>
              <HostChoice
                label="Lifecycle"
                value={draft.lifecycle ?? "Active"}
                items={["Active", "Pending approval", "Maintenance", "Decommissioned"]}
                onChange={(lifecycle) => setDraft({ ...draft, lifecycle })}
              />
              <label className="wf-host-edit-row">
                <span>Pages on-call</span>
                <Switch
                  aria-label="Pages on-call"
                  checked={draft.pagesOnCall ?? false}
                  onCheckedChange={(pagesOnCall) => setDraft({ ...draft, pagesOnCall })}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={() => edit(rows.find((row) => row.id === draft.id))}
              >
                Reset
              </Button>
            </div>
          ) : (
            <>
              <Choice
                showLabel
                label="Cluster"
                value={draft.cluster}
                items={records.map((row) => row.name)}
                onChange={(cluster) => setDraft({ ...draft, cluster })}
              />
              <Choice
                showLabel
                label="Role"
                value={draft.role ?? "Worker"}
                items={["Worker", "Control plane", "Edge"]}
                onChange={(role) => setDraft({ ...draft, role })}
              />
              <Choice
                showLabel
                label="Agent version"
                value={draft.agentVersion ?? "7.54.2 — current"}
                items={["7.54.2 — current", "7.53.1 — previous"]}
                onChange={(agentVersion) => setDraft({ ...draft, agentVersion })}
              />
              <div>
                <strong className="text-sm font-medium">Enrolment command</strong>
                <div className="wf-host-command">
                  <code>{enrolment}</code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Copy enrolment command"
                    onClick={() => void copy(enrolment)}
                  >
                    <Copy />
                  </Button>
                </div>
                <p className="wf-muted text-xs">
                  Run it on the machine as root. The token is single use.
                </p>
              </div>
              <label className="wf-cluster-policy">
                <span>
                  Auto-approve on check-in
                  <small>Off means the host waits in a pending list for a human.</small>
                </span>
                <Switch
                  checked={draft.autoApprove ?? true}
                  onCheckedChange={(autoApprove) => setDraft({ ...draft, autoApprove })}
                />
              </label>
            </>
          ))}
      </SideForm>
      <Detail
        title={detail?.name ?? "Host details"}
        open={!!detail}
        onClose={() => setDetailId("")}
      >
        {detail && (
          <div className="wf-repository-detail">
            <Status>{detail.state}</Status>
            <h3>Identity</h3>
            <dl>
              {[
                ["IP address", detail.name.replace("ip-", "").replaceAll("-", ".")],
                ["Cluster", detail.cluster],
                ["Last seen", detail.seen],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <h3>Ownership</h3>
            <dl>
              <div>
                <dt>Owner</dt>
                <dd>{detail.owner}</dd>
              </div>
              <div>
                <dt>Maintenance</dt>
                <dd>{detail.window}</dd>
              </div>
              <div>
                <dt>Monitoring</dt>
                <dd>{detail.monitoring ? "Reporting" : "Off"}</dd>
              </div>
            </dl>
            <h3>Compliance</h3>
            <dl>
              <div>
                <dt>Hardening</dt>
                <dd>{detail.hardening} / 5</dd>
              </div>
              <div>
                <dt>Lifecycle</dt>
                <dd>{detail.lifecycle ?? "Active"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{detail.role ?? "Worker"}</dd>
              </div>
              <div>
                <dt>Profile</dt>
                <dd>{detail.profile ?? "General purpose"}</dd>
              </div>
              <div>
                <dt>Patch priority</dt>
                <dd>{detail.patchPriority ?? "Medium"}</dd>
              </div>
            </dl>
            <footer>
              <Button variant="destructive" onClick={() => decommission(detail)}>
                Decommission
              </Button>
              <Button onClick={() => edit(detail)}>Edit</Button>
            </footer>
          </div>
        )}
      </Detail>
    </div>
  );
}
function HostChoice({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="wf-host-edit-row">
      <span>{label}</span>
      <Choice label={label} value={value} items={items} onChange={onChange} />
    </div>
  );
}
