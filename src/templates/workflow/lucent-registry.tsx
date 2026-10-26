import { useState, type ReactNode } from "react";
import { Copy, Eye, MoreHorizontal, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DomainGridSurface,
  useDomainGrid,
  type DomainColumn,
  type ExpandedState,
  type SortingState,
} from "@/blocks/data/grid-advanced-model-grid";
import { NumericField } from "@/blocks/data/grid-advanced-shared";
import { Identity, TabsBar } from "@/blocks/data/grid-base-common";
import {
  FilterBar,
  firstRule,
  matchesRules,
  type FilterRule,
} from "@/blocks/data/grid-filter-controls";
import { DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, Detail, Input, Status } from "./shared";
import { Choice, SideForm } from "./controls";
import type { Repository, useLucentInfrastructureModel } from "./lucent-infrastructure-model";
import "./infrastructure.css";

const severityRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const namespaces = ["Data", "Edge", "Identity", "Payments", "Platform", "Search"];
const completed = (row: Repository) => row.status === "Clean" || row.status === "Quarantined";

export function LucentRegistry({
  model,
}: {
  model: ReturnType<typeof useLucentInfrastructureModel>;
}) {
  const { registry: rows, setRegistry: setRows } = model;
  const [tab, setTab] = useState("All repositories");
  const [rules, setRules] = useState<FilterRule[]>([firstRule("name")]);
  const [expanded, setExpanded] = useState<ExpandedState>({ "api-gateway": true });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
  const [sorting, setSorting] = useState<SortingState>([{ id: "severity", desc: true }]);
  const [hidden, setHidden] = useState<string[]>(["Pushed", "Size", "Last pulled"]);
  const [showTags, setShowTags] = useState(true);
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [completedLast, setCompletedLast] = useState(false);
  const [compact, setCompact] = useState(true);
  const [resizable, setResizable] = useState(true);
  const [movable, setMovable] = useState(true);
  const [draft, setDraft] = useState<Repository | null>(null);
  const [editing, setEditing] = useState(false);
  const [detailId, setDetailId] = useState("");
  const [formError, setFormError] = useState("");
  const allRows = rows.flatMap((row) => [row, ...(row.children ?? [])]);
  const detail = allRows.find((row) => row.id === detailId);
  function edit(row?: Repository) {
    setDraft(
      row
        ? { ...row }
        : {
            id: crypto.randomUUID(),
            name: "",
            status: "Unscanned",
            pusher: "No pusher",
            severity: "Low",
            scan: true,
            namespace: "Data",
            kind: "Service",
            keepLast: 30,
            immutable: true,
          },
    );
    setEditing(!!row);
    setFormError("");
    setDetailId("");
  }
  function update(id: string, change: (row: Repository) => Repository) {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? change(row)
          : {
              ...row,
              children: row.children?.map((tag) => (tag.id === id ? change(tag) : tag)),
            },
      ),
    );
  }
  function remove(row: Repository) {
    setRows((current) =>
      current
        .filter((item) => item.id !== row.id)
        .map((item) => ({
          ...item,
          children: item.children?.filter((tag) => tag.id !== row.id),
        })),
    );
    setDetailId("");
    toast.success(`${row.name} and its tags were removed.`);
  }
  async function copy(row: Repository) {
    const parent = rows.find((item) => item.id === row.parentId);
    const path = `registry.internal/${parent ? `${parent.name}:${row.name}` : row.name}`;
    try {
      await navigator.clipboard.writeText(path);
      toast.success("Repository path copied");
    } catch {
      toast.error("Could not copy the repository path");
    }
  }
  const columns: DomainColumn<Repository>[] = [
    {
      id: "name",
      header: "Repository",
      accessorKey: "name",
      size: 385,
      cell: ({ row }) => (
        <div className={`wf-repository-name ${row.original.parentId ? "wf-repository-tag" : ""}`}>
          {row.getCanExpand() ? (
            <DataGridTableRowExpand row={row} />
          ) : (
            <span className="wf-repository-indent" />
          )}
          <Checkbox
            className="rounded-full"
            aria-label={`Mark ${row.original.name} complete`}
            checked={row.original.status === "Clean"}
            onCheckedChange={(checked) =>
              update(row.original.id, (item) => ({
                ...item,
                previousStatus: checked ? item.status : item.previousStatus,
                status: checked ? "Clean" : (item.previousStatus ?? "Queued"),
                completedAt: checked ? Date.now() : undefined,
              }))
            }
          />
          <button
            className={`wf-text-button ${row.original.status === "Clean" ? "wf-repository-complete" : ""}`}
            onClick={() => setDetailId(row.original.id)}
          >
            {row.original.name}
          </button>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      size: 138,
      cell: ({ row }) => (
        <span className="wf-infra-state">
          <i data-state={row.original.status.toLowerCase().replaceAll(" ", "-")} />
          <Status>{row.original.status}</Status>
        </span>
      ),
    },
    {
      id: "pusher",
      header: "Pusher",
      accessorKey: "pusher",
      size: 160,
      cell: ({ row }) =>
        row.original.pusher === "No pusher" ? (
          <span className="wf-muted">—　No pusher</span>
        ) : (
          <Identity name={row.original.pusher} compact />
        ),
    },
    {
      id: "severity",
      sortFn: (a, b) =>
        a.depth || b.depth
          ? 0
          : severityRank[a.original.severity] - severityRank[b.original.severity],
      header: "Severity",
      accessorFn: (row) => severityRank[row.severity],
      size: 96,
      cell: ({ row }) => <Status>{row.original.severity}</Status>,
    },
    {
      id: "scan",
      header: "Scan on push",
      accessorKey: "scan",
      size: 151,
      cell: ({ row }) =>
        !row.original.parentId && (
          <Switch
            size="sm"
            aria-label={`Scan on push ${row.original.name}`}
            checked={row.original.scan}
            onCheckedChange={(scan) => update(row.original.id, (item) => ({ ...item, scan }))}
          />
        ),
    },
    {
      id: "namespace",
      header: "Namespace",
      accessorKey: "namespace",
      size: 160,
      cell: ({ row }) => (
        <Badge variant="outline" className="font-normal">
          {row.original.namespace}
        </Badge>
      ),
    },
    // The local demo has no push/pull backend. Unavailable telemetry stays explicit.
    { id: "pushed", header: "Pushed", accessorFn: () => "—", size: 110 },
    { id: "size", header: "Size", accessorFn: () => "—", size: 100 },
    { id: "pulled", header: "Last pulled", accessorFn: () => "—", size: 110 },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      size: 58,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Repository actions ${row.original.name}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetailId(row.original.id)}>
              <Eye />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => edit(row.original)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void copy(row.original)}>
              <Copy />
              Copy repository
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => remove(row.original)}>
              <Trash2 />
              Delete repository
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  const filtered = rows.filter(
    (row) =>
      (includeCompleted || !completed(row)) &&
      (tab !== "Active" || (!completed(row) && row.status !== "Unscanned")) &&
      (tab !== "Unscanned" || row.status === "Unscanned") &&
      (matchesRules(row, rules) || row.children?.some((tag) => matchesRules(tag, rules))),
  );
  const ordered = completedLast
    ? [...filtered].sort(
        (a, b) =>
          Number(completed(a)) - Number(completed(b)) ||
          (completed(a) ? (b.completedAt ?? 0) - (a.completedAt ?? 0) : 0),
      )
    : filtered;
  const table = useDomainGrid({
    data: ordered,
    columns,
    pagination,
    onPaginationChange: setPagination,
    sorting,
    onSortingChange: (next) => {
      setSorting(next);
      setCompletedLast(false);
    },
    hidden,
    onHiddenChange: setHidden,
    expanded,
    onExpandedChange: setExpanded,
    getRowId: (row) => row.id,
    getSubRows: (row) =>
      showTags ? row.children?.filter((tag) => includeCompleted || !completed(tag)) : undefined,
  });
  function setting(label: string, checked: boolean, onChange: (value: boolean) => void) {
    return (
      <label className="wf-registry-setting" key={label}>
        <span>{label}</span>
        <Switch size="sm" aria-label={label} checked={checked} onCheckedChange={onChange} />
      </label>
    );
  }
  return (
    <div className="wf-evidence-page wf-registry-page">
      <Frame dense spacing="sm">
        <FrameHeader>
          <div>
            <FrameTitle>Container Registry</FrameTitle>
            <FrameDescription>
              {rows.length} repositories / {showTags ? "showing tags" : "repositories only"}
            </FrameDescription>
          </div>
          <Button size="sm" onClick={() => edit()}>
            <Plus />
            New repository
          </Button>
        </FrameHeader>
        <FramePanel className="p-0">
          <TabsBar
            tabs={["All repositories", "Active", "Unscanned"]}
            counts={{
              "All repositories": rows.length,
              Active: rows.filter((row) => !completed(row) && row.status !== "Unscanned").length,
              Unscanned: rows.filter((row) => row.status === "Unscanned").length,
            }}
            value={tab}
            onChange={(value) => {
              setTab(value);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
          />
          <FilterBar
            fields={[
              { key: "name", label: "Repository" },
              {
                key: "status",
                label: "Status",
                type: "select",
                options: [
                  "Queued",
                  "Scanning",
                  "Needs review",
                  "Unscanned",
                  "Clean",
                  "Quarantined",
                ],
              },
              { key: "pusher", label: "Pusher" },
              {
                key: "severity",
                label: "Severity",
                type: "select",
                options: Object.keys(severityRank),
              },
              { key: "namespace", label: "Namespace", type: "select", options: namespaces },
            ]}
            rules={rules}
            onChange={(value) => {
              setRules(value);
              if (value.some((rule) => rule.values.some(Boolean))) setExpanded(true);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
            clearLabel=""
            className="wf-registry-filters"
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal />
                  Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="wf-registry-settings">
                <h3>Queue</h3>
                <Choice
                  label="Ordering"
                  showLabel
                  value={sorting[0]?.id ?? "name"}
                  items={["severity", "name", "status", "pusher", "namespace"]}
                  onChange={(id) => setSorting([{ id, desc: sorting[0]?.desc ?? false }])}
                />
                <div className="wf-registry-setting">
                  <span>Direction</span>
                  <div className="wf-inline">
                    {[false, true].map((desc) => (
                      <Button
                        key={String(desc)}
                        size="xs"
                        variant={sorting[0]?.desc === desc ? "secondary" : "outline"}
                        aria-pressed={sorting[0]?.desc === desc}
                        onClick={() => setSorting([{ id: sorting[0]?.id ?? "severity", desc }])}
                      >
                        {desc ? "Desc" : "Asc"}
                      </Button>
                    ))}
                  </div>
                </div>
                {setting("Include completed", includeCompleted, (value) => {
                  setIncludeCompleted(value);
                  setPagination({ ...pagination, pageIndex: 0 });
                })}
                {setting("Completed by recency", completedLast, (value) => {
                  setCompletedLast(value);
                  if (value) setSorting([]);
                })}
                {setting("Show tags", showTags, setShowTags)}
                <hr />
                <h3>Table</h3>
                <Choice
                  label="Density"
                  showLabel
                  value={compact ? "Compact" : "Comfortable"}
                  items={["Compact", "Comfortable"]}
                  onChange={(value) => setCompact(value === "Compact")}
                />
                {setting("Resizable columns", resizable, setResizable)}
                {setting("Movable columns", movable, setMovable)}
                <hr />
                <h3>Display properties</h3>
                {columns
                  .filter(
                    (column) =>
                      column.id !== "name" && column.id !== "actions" && column.id !== "scan",
                  )
                  .map((column) => {
                    const label = String(column.header);
                    return setting(label, !hidden.includes(label), (visible) =>
                      setHidden((current) =>
                        visible ? current.filter((item) => item !== label) : [...current, label],
                      ),
                    );
                  })}
              </PopoverContent>
            </Popover>
          </FilterBar>
          <DomainGridSurface
            table={table}
            className={compact ? "wf-registry-grid" : "wf-registry-grid wf-infra-comfortable"}
            layout={{ width: "fixed", columnsResizable: resizable, columnsMovable: movable }}
            paginationControls={{ sizes: [5, 10, 25, 50] }}
          />
        </FramePanel>
      </Frame>
      <SideForm
        open={!!draft}
        onClose={() => setDraft(null)}
        title={editing ? "Edit repository" : "New repository"}
        description={
          editing ? "The name is fixed. Its rules are not." : "Name it and set its policy."
        }
        submit={editing ? "Save changes" : "Create repository"}
        onSubmit={() => {
          if (!draft) return;
          const name = draft.name.trim();
          if (!name) return;
          if (!editing && rows.some((row) => row.name === name)) {
            setFormError("A repository with this name already exists.");
            return;
          }
          if (editing)
            update(draft.id, () => ({
              ...draft,
              name,
              children: draft.children?.map((tag) => ({ ...tag, namespace: draft.namespace })),
            }));
          else setRows((current) => [...current, { ...draft, name }]);
          setRules([{ ...firstRule("name"), values: [name] }]);
          setTab("All repositories");
          setPagination({ ...pagination, pageIndex: 0 });
          setDraft(null);
        }}
      >
        {draft && (
          <>
            {!editing && (
              <Choice
                label="Namespace"
                showLabel
                value={draft.namespace}
                items={namespaces}
                onChange={(namespace) => setDraft({ ...draft, namespace })}
              />
            )}
            <label>
              {editing ? "Repository path" : "Repository name"}
              <div className="wf-repository-input">
                <span>registry.internal/</span>
                <Input
                  aria-label={editing ? "Repository path" : "Repository name"}
                  required
                  readOnly={editing}
                  value={draft.name}
                  onChange={(event) => {
                    setDraft({ ...draft, name: event.target.value });
                    setFormError("");
                  }}
                />
              </div>
            </label>
            {editing && (
              <>
                <small className="wf-muted">
                  A repository cannot be renamed. Create a new one and re-push.
                </small>
                <Choice
                  label="Namespace"
                  showLabel
                  value={draft.namespace}
                  items={namespaces}
                  onChange={(namespace) => setDraft({ ...draft, namespace })}
                />
              </>
            )}
            <Choice
              label="Kind"
              showLabel
              value={draft.kind}
              items={draft.parentId ? ["Tag"] : ["Service", "Worker", "Base image", "Job"]}
              onChange={(kind) => setDraft({ ...draft, kind })}
            />
            <small className="wf-muted">
              {draft.kind === "Service"
                ? "A long-running deployable"
                : draft.kind === "Worker"
                  ? "A background processing workload"
                  : draft.kind === "Job"
                    ? "A finite execution workload"
                    : "A shared image layer"}
            </small>
            <label>
              Keep last
              <NumericField
                label="Keep last"
                min={1}
                max={1000}
                value={draft.keepLast}
                onValueChange={(keepLast) => setDraft({ ...draft, keepLast })}
              />
            </label>
            <small className="wf-muted">
              Older tags are garbage-collected once this count is passed.
            </small>
            <RegistryPolicy
              label="Scan on push"
              description="Every push is scanned before the tag can be pulled."
              checked={draft.scan}
              onChange={(scan) => setDraft({ ...draft, scan })}
            />
            <RegistryPolicy
              label="Immutable tags"
              description="A pushed tag can never be overwritten, only superseded."
              checked={draft.immutable}
              onChange={(immutable) => setDraft({ ...draft, immutable })}
            />
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
          </>
        )}
      </SideForm>
      <Detail
        title={detail?.name ?? "Repository details"}
        open={!!detail}
        onClose={() => setDetailId("")}
      >
        {detail && (
          <div className="wf-repository-detail">
            <div className="wf-inline">
              <Status>{detail.severity}</Status>
              <Badge variant="outline">{detail.namespace}</Badge>
              <Status>{detail.status}</Status>
            </div>
            <h3>Identity</h3>
            <dl>
              <DetailRow label="Path">
                registry.internal/
                {detail.parentId ? `${detail.parentId}:${detail.name}` : detail.name}
              </DetailRow>
              <DetailRow label="Kind">{detail.kind}</DetailRow>
              <DetailRow label="Namespace">{detail.namespace}</DetailRow>
              <DetailRow label="Last pusher">{detail.pusher}</DetailRow>
            </dl>
            <h3>Policy</h3>
            <dl>
              <DetailRow label="Retention">Keep last {detail.keepLast} tags</DetailRow>
              <DetailRow label="Immutable tags">{detail.immutable ? "Yes" : "No"}</DetailRow>
              <DetailRow label="Scan on push">{detail.scan ? "On" : "Off"}</DetailRow>
              <DetailRow label="Visible tags">{detail.children?.length ?? 0}</DetailRow>
            </dl>
            {detail.children?.length ? (
              <>
                <h3>Tags</h3>
                {detail.children.map((tag) => (
                  <div className="wf-registry-setting" key={tag.id}>
                    <button className="wf-text-button" onClick={() => setDetailId(tag.id)}>
                      {tag.name}
                    </button>
                    <Status>{tag.status}</Status>
                  </div>
                ))}
              </>
            ) : null}
            <footer>
              <Button variant="destructive" onClick={() => remove(detail)}>
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
function RegistryPolicy({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="wf-repository-policy">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        aria-label={label}
      />
      <span>
        {label}
        <small>{description}</small>
      </span>
    </label>
  );
}
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
