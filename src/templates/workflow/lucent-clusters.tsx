import { useState } from "react";
import {
  Copy,
  Eye,
  Globe,
  MoreHorizontal,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  DomainRecordGrid,
  type DomainField,
  type ExpandedState,
} from "@/blocks/data/grid-advanced-model-grid";
import { DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import { Identity } from "@/blocks/data/grid-base-common";
import { SyncScopeOptions } from "@/blocks/application/dialog-variants/workspace-final/free/scope-options";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, Detail, Input, Status, ExportButton } from "./shared";
import { Choice, DateChoice, SideForm } from "./controls";
import type { Cluster, useLucentInfrastructureModel } from "./lucent-infrastructure-model";
import "./infrastructure.css";
type Region = Cluster & { children?: Region[]; group?: boolean };
const regions = ["eu-west", "us-east", "ap-south", "sa-east"];
const descriptions = [
  "Primary region, carries production traffic",
  "Second production region and failover target",
  "Regional read replicas and edge workloads",
  "Newest region, still being built out",
];
const dateLabel = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
export function LucentClusters({
  model,
}: {
  model: ReturnType<typeof useLucentInfrastructureModel>;
}) {
  const { records: rows, setRecords: setRows } = model;
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<ExpandedState>({ "eu-west": true });
  const [health, setHealth] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [draft, setDraft] = useState<Cluster | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [detailId, setDetailId] = useState("");
  const [pool, setPool] = useState("");
  const detail = rows.find((row) => row.id === detailId);
  function edit(row?: Cluster) {
    setDraft(
      row
        ? { ...row }
        : {
            id: `CL-${crypto.randomUUID().slice(0, 6)}`,
            name: "",
            region: "eu-west",
            owner: "Elena Varga",
            health: "Healthy",
            capacity: 128,
            growth: 100,
            upgrade: "2026-11-01",
          },
    );
    setPool(row ? "" : "Balanced");
    setDetailId("");
    setEditing(!!row);
    setOpen(true);
  }
  const filtered = rows.filter(
    (row) =>
      `${row.name} ${row.owner}`.toLowerCase().includes(query.toLowerCase()) &&
      (!health.length || health.includes(row.health)),
  );
  const grouped: Region[] = regions
    .map((region, index) => {
      const children = filtered.filter((row) => row.region === region);
      return {
        id: region,
        name: region,
        region,
        owner: descriptions[index],
        health: "",
        capacity: children.reduce((sum, row) => sum + row.capacity, 0),
        growth: [109, 106, 125, 109][index],
        upgrade: children.map((row) => row.upgrade).sort()[0] ?? "2026-06-30",
        children,
        group: true,
      };
    })
    .filter((row) => row.children?.length);
  const fields: DomainField<Region>[] = [
    {
      id: "name",
      title: "Cluster",
      size: 260,
      value: (row) => row.name,
      render: (row, _i, tableRow) => (
        <div className="wf-cluster-name">
          {row.group ? (
            <>
              <DataGridTableRowExpand row={tableRow} />
              <Globe className="size-3.5" />
              <strong>{row.name}</strong>
              <Status>{row.children?.length}</Status>
            </>
          ) : (
            <>
              <span className="wf-cluster-code" data-code={row.code ?? row.id}>
                {row.code ?? row.id}
              </span>
              <button className="wf-text-button" onClick={() => edit(row)}>
                {row.name}
              </button>
            </>
          )}
        </div>
      ),
    },
    {
      id: "owner",
      title: "Owner",
      size: 206,
      value: (row) => row.owner,
      render: (row) =>
        row.group ? (
          <span className="wf-region-description">{row.owner}</span>
        ) : (
          <Identity name={row.owner} compact />
        ),
    },
    {
      id: "health",
      title: "Health",
      size: 130,
      value: (row) => row.health,
      render: (row) => (row.group ? null : <Status>{row.health}</Status>),
    },
    {
      id: "capacity",
      title: "Capacity",
      className: "text-right",
      size: 163,
      value: (row) => row.capacity,
      render: (row) => (
        <span className={row.group ? "font-medium" : ""}>{row.capacity.toLocaleString()} vCPU</span>
      ),
    },
    {
      id: "growth",
      title: "Growth",
      className: "text-right",
      size: 130,
      value: (row) => row.growth,
      render: (row) => (
        <span
          className={`wf-inline wf-cluster-growth ${row.growth < 100 ? "text-destructive" : "text-emerald-600"}`}
        >
          {row.growth < 100 ? (
            <TrendingDown className="size-3.5" />
          ) : (
            <TrendingUp className="size-3.5" />
          )}{" "}
          {row.growth}%
        </span>
      ),
    },
    {
      id: "upgrade",
      title: "Next upgrade",
      className: "text-right",
      size: 200,
      value: (row) => row.upgrade,
      render: (row) =>
        row.group ? (
          <span>
            <small className="wf-muted">Next　</small>
            {dateLabel(row.upgrade)}
          </span>
        ) : (
          <span className="wf-cluster-date-picker">
            <DateChoice
              value={row.upgrade}
              label={`Next upgrade ${row.name}`}
              onChange={(upgrade) => {
                if (upgrade)
                  setRows((current) =>
                    current.map((item) => (item.id === row.id ? { ...item, upgrade } : item)),
                  );
              }}
            />
          </span>
        ),
    },
    {
      id: "actions",
      title: "",
      size: 61,
      value: () => "",
      render: (row) =>
        row.group ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Cluster actions ${row.name}`}>
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
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(row.name);
                    toast.success("Cluster name copied");
                  } catch {
                    toast.error("Could not copy the cluster name");
                  }
                }}
              >
                <Copy />
                Copy name
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    },
  ];
  const total = rows.reduce((sum, row) => sum + row.capacity, 0);
  return (
    <div className="wf-evidence-page wf-cluster-page">
      <Frame dense spacing="sm">
        <FrameHeader>
          <div>
            <FrameTitle>Capacity by Region</FrameTitle>
            <FrameDescription>vCPU, growth, and upgrade windows per region.</FrameDescription>
          </div>
          <div className="wf-inline">
            <small>Total capacity</small>
            <Status>{(total / 1000).toFixed(1)}K vCPU</Status>
            <small>Fleet growth</small>
            <Status>110%</Status>
            <small>At-risk capacity</small>
            <Status>
              {rows
                .filter((row) => row.health === "At Risk")
                .reduce((sum, row) => sum + row.capacity, 0)
                .toLocaleString()}{" "}
              vCPU
            </Status>
            <Button size="sm" onClick={() => edit()}>
              <Plus />
              Create cluster
            </Button>
            <ExportButton name="cluster-capacity" rows={rows} />
          </div>
        </FrameHeader>
        <FramePanel className="p-0">
          <div className="wf-infra-toolbar">
            <Input
              aria-label="Search clusters"
              placeholder="Search clusters…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="wf-inline">
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline">
                    Health
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  {["Healthy", "Degraded", "At Risk"].map((value) => (
                    <label key={value} className="wf-inline mb-3">
                      <Checkbox
                        checked={health.includes(value)}
                        onCheckedChange={(checked) => {
                          setHealth(
                            checked ? [...health, value] : health.filter((item) => item !== value),
                          );
                          setExpanded(true);
                        }}
                      />
                      {value}
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline">
                    <SlidersHorizontal />
                    Display
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  {fields
                    .filter((field) => field.title && field.id !== "name")
                    .map((field) => (
                      <label key={field.id} className="wf-inline mb-3">
                        <Checkbox
                          checked={!hidden.includes(field.id)}
                          onCheckedChange={(checked) =>
                            setHidden(
                              checked
                                ? hidden.filter((item) => item !== field.id)
                                : [...hidden, field.id],
                            )
                          }
                        />
                        {field.title}
                      </label>
                    ))}
                </PopoverContent>
              </Popover>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpanded(expanded === true ? {} : true)}
              >
                {expanded === true ? "Collapse all" : "Expand all"}
              </Button>
            </div>
          </div>
          <DomainRecordGrid
            data={grouped}
            fields={fields.map((field) => ({
              ...field,
              header: () => (
                <span className={field.className === "text-right" ? "block text-right" : undefined}>
                  {field.title}
                </span>
              ),
            }))}
            getRowId={(row) => row.id}
            getSubRows={(row) => row.children}
            expanded={query ? true : expanded}
            onExpandedChange={setExpanded}
            hidden={hidden}
            onHiddenChange={setHidden}
            pagination={{ pageIndex: 0, pageSize: 100 }}
            footerContent={
              <tr className="wf-cluster-total-row">
                {fields
                  .filter((field) => !hidden.includes(field.id))
                  .map((field) => (
                    <td
                      key={field.id}
                      className={field.className === "text-right" ? "text-right" : undefined}
                    >
                      {field.id === "name" ? (
                        <strong>
                          All Regions <Status>{rows.length}</Status>
                        </strong>
                      ) : field.id === "capacity" ? (
                        <strong>{total.toLocaleString()} vCPU</strong>
                      ) : field.id === "growth" ? (
                        <span className="text-emerald-600">↗ 110%</span>
                      ) : null}
                    </td>
                  ))}
              </tr>
            }
            layout={{ width: "fixed", rowBorder: true }}
          />
        </FramePanel>
      </Frame>
      <SideForm
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Cluster" : "New Cluster"}
        description={
          editing
            ? "Change this cluster’s name, region, tier and node pool."
            : "Provision a cluster and attach its first node pool."
        }
        submit={editing ? "Save changes" : "Create cluster"}
        onSubmit={() => {
          if (!draft?.name.trim()) return;
          const prefix =
            { "eu-west": "E", "us-east": "U", "ap-south": "A", "sa-east": "S" }[draft.region] ??
            "CL";
          const nextCode =
            Math.max(
              0,
              ...rows.map((row) => {
                const code = row.code ?? row.id;
                return code.startsWith(prefix) ? Number(code.slice(prefix.length)) || 0 : 0;
              }),
            ) + 1;
          const record = {
            ...draft,
            code: editing ? draft.code : `${prefix}${nextCode}`,
            name: draft.name.trim(),
            capacity: pool ? (pool === "Balanced" ? 128 : 256) : draft.capacity,
            nodePool: pool || draft.nodePool,
          };
          setRows((current) =>
            editing
              ? current.map((row) => (row.id === draft.id ? record : row))
              : [...current, record],
          );
          setQuery(draft.name);
          setExpanded(true);
          setOpen(false);
        }}
      >
        {draft && (
          <>
            <label>
              Name
              <Input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </label>
            <small className="wf-muted">Lowercase, used as the cluster handle.</small>
            <Choice
              showLabel
              label="Region"
              value={draft.region}
              items={regions}
              onChange={(region) => setDraft({ ...draft, region })}
            />
            <small className="wf-muted">Where the cluster is provisioned.</small>
            <Choice
              showLabel
              label="Tier"
              value={draft.tier ?? (draft.name.startsWith("prod") ? "Production" : "Staging")}
              items={["Production", "Staging", "Development"]}
              onChange={(tier) => setDraft({ ...draft, tier })}
            />
            <small className="wf-muted">Drives the change-approval path.</small>
            {(
              [
                [
                  "autoUpgrade",
                  "Auto Upgrade",
                  "Take patch releases inside the maintenance window.",
                ],
                [
                  "autoscaling",
                  "Autoscaling",
                  "Add and remove nodes as scheduling pressure changes.",
                ],
                [
                  "privateEndpoint",
                  "Private Endpoint",
                  "Keep the API server off the public internet.",
                ],
                [
                  "spotNodes",
                  "Spot Nodes",
                  "Use pre-emptible capacity where workloads tolerate it.",
                ],
              ] as const
            ).map(([key, label, description]) => (
              <label className="wf-cluster-policy" key={key}>
                <span>
                  {label}
                  <small>{description}</small>
                </span>
                <Switch
                  size="sm"
                  aria-label={label}
                  checked={draft[key] ?? key !== "spotNodes"}
                  onCheckedChange={(checked) => setDraft({ ...draft, [key]: checked })}
                />
              </label>
            ))}
            <div>
              <strong className="text-sm font-medium">Node Pool</strong>
              <p className="wf-muted text-xs">Choose the shape of the first pool.</p>
            </div>
            <p className="wf-cluster-projection">
              {editing
                ? `Now ${draft.capacity.toLocaleString()} vCPU — pick a pool to rescale`
                : `Adds ${pool === "Compute-optimised" ? 256 : 128} vCPU`}{" "}
              — {draft.region}{" "}
              {rows
                .filter((row) => row.region === draft.region)
                .reduce((sum, row) => sum + row.capacity, 0)
                .toLocaleString()}{" "}
              vCPU →{" "}
              {(
                rows
                  .filter((row) => row.region === draft.region)
                  .reduce((sum, row) => sum + row.capacity, 0) -
                (editing && rows.find((row) => row.id === draft.id)?.region === draft.region
                  ? (rows.find((row) => row.id === draft.id)?.capacity ?? 0)
                  : 0) +
                (pool ? (pool === "Balanced" ? 128 : 256) : draft.capacity)
              ).toLocaleString()}{" "}
              vCPU, fleet {total.toLocaleString()} vCPU →{" "}
              {(
                total -
                (editing ? (rows.find((row) => row.id === draft.id)?.capacity ?? 0) : 0) +
                (pool ? (pool === "Balanced" ? 128 : 256) : draft.capacity)
              ).toLocaleString()}{" "}
              vCPU
            </p>
            <SyncScopeOptions
              value={pool}
              onChange={setPool}
              options={[
                { id: "Balanced", title: "Balanced", description: "8 nodes at 16 vCPU each." },
                {
                  id: "Compute-optimised",
                  title: "Compute-optimised",
                  description: "4 nodes at 64 vCPU each.",
                },
              ]}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => edit(editing ? rows.find((row) => row.id === draft.id) : undefined)}
            >
              Reset
            </Button>
          </>
        )}
      </SideForm>
      <Detail
        title={detail?.name ?? "Cluster details"}
        open={!!detail}
        onClose={() => setDetailId("")}
      >
        {detail && (
          <div className="wf-repository-detail">
            <div className="wf-inline">
              <Status>
                {detail.tier ?? (detail.name.startsWith("prod") ? "Production" : "Staging")}
              </Status>
              <Status>{detail.health}</Status>
            </div>
            <h3>Capacity</h3>
            <dl>
              {[
                ["vCPU", `${detail.capacity.toLocaleString()} vCPU`],
                ["Share of fleet", `${Math.round((detail.capacity / total) * 100)}%`],
                ["Growth", `${detail.growth}%`],
                ["Next upgrade", dateLabel(detail.upgrade)],
                ["Cluster ID", `cls-${detail.name}`],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <h3>Owner</h3>
            <Identity name={detail.owner} compact />
            <footer>
              <Button
                variant="destructive"
                onClick={() => {
                  setRows((current) => current.filter((row) => row.id !== detail.id));
                  setDetailId("");
                }}
              >
                Delete
              </Button>
              <Button onClick={() => edit(detail)}>Edit</Button>
            </footer>
          </div>
        )}
      </Detail>
    </div>
  );
}
