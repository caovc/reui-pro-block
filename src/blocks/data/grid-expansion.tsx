import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { useMemo, useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Rating } from "@/components/reui/rating";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { StructureGrid } from "./grid-structure-model";
import { cn } from "@/lib/utils";
import { FilterBar, firstRule, matchesRules, type FilterRule } from "./grid-filter-controls";
import {
  StructureBadge,
  StructureFrame,
  StructureMenu,
  StructurePerson,
  StructureSearch,
  StructureSelect,
  StructureToolbar,
} from "./grid-structure-ui";

type Task = {
  id: number;
  name: string;
  status: string;
  owner: string;
  priority: string;
  project: string;
  children: { id: number; name: string; done: boolean; owner: string }[];
};
const taskNames = [
  "Finalize licensed registry handshake for private installs",
  "Wire project health badges into the launch command center",
  "Design empty states for expiring team seat invitations",
  "Add audit trail hooks to task status change events",
  "Review tenant permissions before launch",
  "Set up usage alerts for workspace owners",
  "Verify customer import validation",
  "Document the release approval policy",
  "Improve billing retries for annual subscriptions",
  "Run the checkout accessibility audit",
  "Review API rate limit responses",
  "Publish the new onboarding checklist",
  "Update service ownership metadata",
  "Validate webhook signature rotation",
  "Measure dashboard rendering performance",
  "Prepare customer support launch notes",
];
const taskSeed: Task[] = taskNames.map((name, i) => ({
  id: i + 1,
  name,
  status: ["In Progress", "In Progress", "Todo", "Review", "Backlog"][i % 5],
  owner: ["Maya Perez", "Pavel Singh", "Noa Kim", "Emil Novak", "Jonas Reed"][i % 5],
  priority: i < 2 ? "Urgent" : "High",
  project: ["Registry API", "Launch Analytics", "Workspace Access", "Task Delivery"][i % 4],
  children: (i === 0
    ? [
        "Lock the signed entitlement payload shape",
        "Validate private install signature rotation",
        "Add replay guard for expired install links",
        "Document the fallback flow for invalid claims",
        "Audit session invalidation when workspace roles change",
      ]
    : ["Review requirements", "Validate implementation", "Complete acceptance checks"]
  ).map((name, j) => ({
    id: 1000 + i * 10 + j,
    name,
    done: i === 0 && j < 2,
    owner: ["Maya Perez", "Jonas Reed", "Emil Novak"][j % 3],
  })),
}));
type TaskNode = Omit<Task, "children"> & {
  children: TaskNode[];
  child: boolean;
  parentId?: number;
  done?: boolean;
};
function SubtaskGrid() {
  const [rows, setRows] = useState(taskSeed),
    [expanded, setExpanded] = useState<number[]>([1]),
    [rules, setRules] = useState<FilterRule[]>([firstRule("name")]),
    [tab, setTab] = useState("All tasks"),
    [page, setPage] = useState(0),
    [size, setSize] = useState(5),
    [subtasks, setSubtasks] = useState(true),
    [newName, setNewName] = useState(""),
    [sorting, setSorting] = useState<SortingState>([]);
  const active = rows.filter((r) => r.status !== "Backlog" && r.status !== "Done");
  function toggle(id: number, childId?: number) {
    setRows((v) =>
      v.map((r) =>
        r.id !== id
          ? r
          : childId
            ? (() => {
                const children = r.children.map((c) =>
                  c.id === childId ? { ...c, done: !c.done } : c,
                );
                return {
                  ...r,
                  children,
                  status: children.every((c) => c.done) ? "Done" : "In Progress",
                };
              })()
            : {
                ...r,
                status: r.status === "Done" ? "In Progress" : "Done",
                children: r.children.map((c) => ({
                  ...c,
                  done: r.status !== "Done",
                })),
              },
      ),
    );
  }
  const data = useMemo<TaskNode[]>(
    () =>
      rows.map((r) => ({
        ...r,
        child: false,
        children: r.children.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.done ? "Done" : "In Progress",
          owner: c.owner,
          priority: r.priority,
          project: r.project,
          children: [],
          child: true,
          parentId: r.id,
          done: c.done,
        })),
      })),
    [rows],
  );
  const columns = useMemo<ColumnDef<DataGridFeatures, TaskNode>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Task",
        size: 570,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-2">
              <DataGridTableRowExpand row={row} />
              <Checkbox
                className="rounded-full"
                aria-label={`Complete ${r.name}`}
                checked={
                  r.status === "Done"
                    ? true
                    : !r.child && r.children.some((c) => c.done)
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={() =>
                  toggle(r.child ? r.parentId! : r.id, r.child ? r.id : undefined)
                }
              />
              <span
                className={cn(
                  r.child ? "text-sm" : "font-medium",
                  r.status === "Done" && "text-muted-foreground line-through",
                )}
              >
                {r.name}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />,
        size: 145,
        cell: ({ row }) => <StructureBadge value={row.original.status} dot />,
      },
      {
        accessorKey: "owner",
        header: "Assignee",
        size: 180,
        cell: ({ row }) => <StructurePerson name={row.original.owner} />,
      },
      {
        accessorKey: "priority",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Priority" />,
        size: 120,
        cell: ({ row }) => <StructureBadge value={row.original.priority} />,
      },
      {
        accessorKey: "project",
        header: "Project",
        size: 180,
        cell: ({ row }) => <StructureBadge value={row.original.project} />,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row: { original: r } }) => (
          <StructureMenu
            label={`Actions for ${r.name}`}
            items={
              r.child
                ? [
                    {
                      label: "Remove sub-task",
                      onClick: () =>
                        setRows((v) =>
                          v.map((a) =>
                            a.id === r.parentId
                              ? {
                                  ...a,
                                  children: a.children.filter((b) => b.id !== r.id),
                                }
                              : a,
                          ),
                        ),
                    },
                  ]
                : [
                    {
                      label: "Mark complete",
                      onClick: () => {
                        if (r.status !== "Done") toggle(r.id);
                      },
                    },
                    {
                      label: "Delete task",
                      onClick: () => setRows((v) => v.filter((a) => a.id !== r.id)),
                    },
                  ]
            }
          />
        ),
      },
    ],
    [rows],
  );
  const table = useTable({
    features: dataGridFeatures,
    data,
    columns,
    getRowId: (r) => String(r.id),
    getSubRows: (r) => (subtasks ? r.children : undefined),
    autoResetExpanded: false,
    paginateExpandedRows: false,
    filterFromLeafRows: true,
    state: {
      expanded: Object.fromEntries(expanded.map((id) => [String(id), true])),
      pagination: { pageIndex: page, pageSize: size },
      sorting,
      globalFilter: JSON.stringify([rules, tab]),
    },
    onSortingChange: setSorting,
    onExpandedChange: (updater) =>
      setExpanded((v) => {
        const value =
          typeof updater === "function"
            ? updater(Object.fromEntries(v.map((id) => [String(id), true])))
            : updater;
        return value === true
          ? rows.map((r) => r.id)
          : Object.keys(value)
              .filter((k) => value[k])
              .map(Number);
      }),
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater({ pageIndex: page, pageSize: size }) : updater;
      setPage(next.pageIndex);
      setSize(next.pageSize);
    },
    globalFilterFn: (row) =>
      matchesRules({ ...row.original }, rules) &&
      (tab === "All tasks" ||
        (tab === "Active" && row.original.status !== "Backlog" && row.original.status !== "Done") ||
        (tab === "Backlog" && row.original.status === "Backlog")),
  });
  const filtered = table.getFilteredRowModel().rows;
  return (
    <StructureFrame
      title="Task Delivery"
      subtitle={`${rows.length} tasks / Sub-tasks ${subtasks ? "on" : "off"}`}
      actions={
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm">
              <Plus />
              New task
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end">
            <label htmlFor="new-delivery-task" className="text-xs font-medium">
              Task title
            </label>
            <Input
              id="new-delivery-task"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="What needs to be done?"
            />
            <Button
              size="sm"
              disabled={!newName.trim()}
              onClick={() => {
                setRows((v) => [
                  {
                    id: Math.max(...v.map((r) => r.id)) + 1,
                    name: newName.trim(),
                    status: "Todo",
                    owner: "Maya Perez",
                    priority: "Medium",
                    project: "Task Delivery",
                    children: [],
                  },
                  ...v,
                ]);
                setNewName("");
                setPage(0);
                setTab("All tasks");
                setRules([firstRule("name")]);
              }}
            >
              Create task
            </Button>
          </PopoverContent>
        </Popover>
      }
    >
      <div className="flex gap-5 border-t px-4">
        {["All tasks", "Active", "Backlog"].map((t) => (
          <button
            key={t}
            aria-pressed={tab === t}
            className={cn(
              "border-b-2 border-transparent py-3 text-xs text-muted-foreground",
              tab === t && "border-foreground text-foreground",
            )}
            onClick={() => {
              setTab(t);
              setPage(0);
            }}
          >
            {t}
            <span className="ml-2 rounded bg-muted px-1.5 text-[10px]">
              {t === "All tasks"
                ? rows.length
                : t === "Active"
                  ? active.length
                  : rows.filter((r) => r.status === "Backlog").length}
            </span>
          </button>
        ))}
      </div>
      <FilterBar
        className="border-y"
        fields={[
          { key: "name", label: "Task" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["Todo", "In Progress", "Review", "Backlog", "Done"],
          },
          {
            key: "priority",
            label: "Priority",
            type: "select",
            options: ["Urgent", "High", "Medium"],
          },
          {
            key: "owner",
            label: "Assignee",
            type: "select",
            options: ["Maya Perez", "Pavel Singh", "Noa Kim", "Emil Novak", "Jonas Reed"],
          },
          {
            key: "project",
            label: "Project",
            type: "select",
            options: ["Registry API", "Launch Analytics", "Workspace Access", "Task Delivery"],
          },
        ]}
        rules={rules}
        onChange={(v) => {
          setRules(v);
          setPage(0);
        }}
        clearLabel=""
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button className="ml-auto" size="sm" variant="outline">
              <Settings2 />
              Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end">
            <label className="flex items-center justify-between text-xs">
              Show sub-tasks
              <Checkbox checked={subtasks} onCheckedChange={(v) => setSubtasks(!!v)} />
            </label>
            <Button size="xs" variant="outline" onClick={() => setExpanded(rows.map((r) => r.id))}>
              Expand all tasks
            </Button>
            <Button size="xs" variant="outline" onClick={() => setExpanded([])}>
              Collapse all tasks
            </Button>
          </PopoverContent>
        </Popover>
      </FilterBar>
      <StructureGrid table={table} recordCount={filtered.length}>
        <DataGridPagination
          more
          sizes={[5, 10, 20]}
          info="{from}–{to} of {count}"
          className="border-t bg-muted/10 px-3 py-2 sm:py-2"
        />
      </StructureGrid>
    </StructureFrame>
  );
}
function Ring({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 20 20"
        className={cn(
          "size-4 -rotate-90",
          value >= 80 ? "text-emerald-500" : value >= 50 ? "text-amber-500" : "text-rose-500",
        )}
      >
        <circle
          cx="10"
          cy="10"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".12"
          strokeWidth="2"
        />
        <circle
          cx="10"
          cy="10"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={`${value * 0.44} 44`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs tabular-nums">{value}%</span>
    </span>
  );
}
type Review = {
  id: number;
  name: string;
  service: string;
  owner: string;
  role: string;
  status: string;
  risk: string;
  done: number;
  total: number;
  readiness: number;
  checks: {
    title: string;
    status: string;
    owner: string;
    rating: number;
    coverage: number;
  }[];
};
const releaseNames = [
  "Split EU checkout traffic",
  "Roll out regional webhook retries",
  "Rotate auth signing keys",
  "Activate instant refunds",
  "Gate partner retries by tenant policy",
  "Migrate read replicas to the new region",
  "Release customer usage alerts",
  "Roll out identity provider updates",
  "Update the billing retry schedule",
  "Enable the new webhook event format",
  "Publish the launch approval checklist",
];
const releaseSeed: Review[] = releaseNames.map((name, i) => ({
  id: 8421 - i * 7,
  name,
  service: ["Checkout", "Webhooks", "Authentication", "Checkout", "Webhooks"][i % 5],
  owner: ["Maya Patel", "Omar Haddad", "Jonah Lee", "Nina Santos", "Omar Haddad"][i % 5],
  role: [
    "Release lead",
    "Integrations owner",
    "Platform reviewer",
    "Billing reviewer",
    "Integrations owner",
  ][i % 5],
  status: i % 5 === 1 || i % 5 === 2 ? "Blocked" : "Needs approval",
  risk: i < 2 ? "Critical" : "High",
  done: [3, 2, 2, 1, 2][i % 5],
  readiness: [40, 40, 50, 25, 40][i % 5],
  total: [5, 5, 4, 4, 5][i % 5],
  checks: [
    "Replica lag watch",
    "PSP fallback ready",
    "Rollback sign-off",
    "Canary metrics review",
    "Customer communications",
  ].map((title, j) => ({
    title,
    status: ["Flagged", "Open", "Done", "Open", "Done"][j],
    owner: ["Jonah Lee", "Nina Santos", "Maya Patel", "Omar Haddad", "Maya Patel"][j],
    rating: [2.4, 3.1, 4.8, 4.2, 3.8][j],
    coverage: [42, 58, 96, 78, 66][j],
  })),
}));
function ReleaseGrid() {
  const [rows, setRows] = useState(releaseSeed),
    [expanded, setExpanded] = useState<number[]>([8421]),
    [search, setSearch] = useState(""),
    [service, setService] = useState("All services"),
    [status, setStatus] = useState("All statuses"),
    [checks, setChecks] = useState(true),
    [page, setPage] = useState(0),
    [size, setSize] = useState(5),
    [newName, setNewName] = useState("");
  function action(id: number, status: string) {
    setRows((v) =>
      v.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              done: status === "Approved" ? r.total : r.done,
              readiness: status === "Approved" ? 100 : r.readiness,
            }
          : r,
      ),
    );
  }
  function checkCard(r: Review, c: Review["checks"][number], j: number) {
    return (
      <div key={c.title} className="min-w-[230px] flex-1 rounded-lg border bg-background p-3">
        <button
          aria-label={`Toggle ${c.title} for ${r.name}`}
          onClick={() =>
            setRows((v) =>
              v.map((a) =>
                a.id === r.id
                  ? {
                      ...a,
                      checks: a.checks.map((b, k) =>
                        k === j
                          ? {
                              ...b,
                              status: b.status === "Done" ? "Open" : "Done",
                            }
                          : b,
                      ),
                    }
                  : a,
              ),
            )
          }
        >
          <StructureBadge value={c.status} dot />
        </button>
        <h3 className="mt-2 text-xs font-medium">{c.title}</h3>
        <div className="mt-2">
          <StructurePerson
            name={c.owner}
            detail={c.status === "Done" ? "Done Apr 17" : "Due Apr 18"}
          />
        </div>
        <div className="mt-5 flex items-center justify-between">
          <Rating
            rating={c.rating}
            showValue
            size="sm"
            className="gap-0.5"
            starClassName="size-3 text-amber-400"
          />
          <Ring value={c.coverage} />
        </div>
      </div>
    );
  }
  function checklist(r: Review) {
    return (
      <div className="bg-muted/10 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs">
          <b className="font-medium">Checklist</b>
          <span className="text-muted-foreground">
            · 3 of {r.checks.length} items · {r.checks.filter((c) => c.status !== "Done").length}{" "}
            open
          </span>
          {r.checks.length > 3 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground underline-offset-2 hover:underline">
                  +{r.checks.length - 3} more
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(90vw,560px)]">
                {r.checks.slice(3).map((c, j) => checkCard(r, c, j + 3))}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex max-w-[1080px] gap-3 overflow-x-auto pb-1">
          {r.checks.slice(0, 3).map((c, j) => checkCard(r, c, j))}
        </div>
      </div>
    );
  }
  const columns = useMemo<ColumnDef<DataGridFeatures, Review>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Request",
        size: 440,
        meta: { expandedContent: (r) => (checks ? checklist(r) : null) },
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-2">
              <DataGridTableRowExpand row={row} />
              <div>
                <span className="block font-medium">{r.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  REL-{r.id} · {r.service} · Production
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "owner",
        header: "Owner",
        size: 220,
        cell: ({ row }) => <StructurePerson name={row.original.owner} detail={row.original.role} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 170,
        cell: ({ row }) => <StructureBadge value={row.original.status} dot />,
      },
      {
        accessorKey: "risk",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Risk" />,
        size: 140,
        cell: ({ row }) => <StructureBadge value={row.original.risk} />,
      },
      {
        accessorKey: "done",
        header: "Approvals",
        size: 140,
        cell: ({ row: { original: r } }) => (
          <>
            {r.done}/{r.total}
            <span className="block text-xs text-muted-foreground">{r.total - r.done} pending</span>
          </>
        ),
      },
      {
        accessorKey: "readiness",
        header: "Readiness",
        size: 150,
        cell: ({ row }) => <Ring value={row.original.readiness} />,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row: { original: r } }) => (
          <StructureMenu
            label={`Actions for ${r.name}`}
            items={[
              {
                label: "Approve release",
                onClick: () => action(r.id, "Approved"),
              },
              {
                label: "Escalate review",
                onClick: () => action(r.id, "Escalated"),
              },
              {
                label: "Delete review",
                onClick: () => setRows((v) => v.filter((a) => a.id !== r.id)),
              },
            ]}
          />
        ),
      },
    ],
    [rows, checks],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId: (r) => String(r.id),
    getRowCanExpand: () => checks,
    autoResetExpanded: false,
    state: {
      expanded: Object.fromEntries(expanded.map((id) => [String(id), true])),
      pagination: { pageIndex: page, pageSize: size },
      globalFilter: JSON.stringify([search, service, status]),
    },
    onExpandedChange: (updater) =>
      setExpanded((v) => {
        const value =
          typeof updater === "function"
            ? updater(Object.fromEntries(v.map((id) => [String(id), true])))
            : updater;
        return value === true
          ? rows.map((r) => r.id)
          : Object.keys(value)
              .filter((k) => value[k])
              .map(Number);
      }),
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater({ pageIndex: page, pageSize: size }) : updater;
      setPage(next.pageIndex);
      setSize(next.pageSize);
    },
    globalFilterFn: (row) =>
      row.original.name.toLowerCase().includes(search.toLowerCase()) &&
      (service === "All services" || row.original.service === service) &&
      (status === "All statuses" || row.original.status === status),
  });
  const filtered = table.getFilteredRowModel().rows;
  return (
    <StructureFrame
      title="Release Reviews"
      subtitle="Upcoming windows, blockers, and checks."
      actions={
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm">
              <Plus />
              New review
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end">
            <label htmlFor="release-name" className="text-xs font-medium">
              Release title
            </label>
            <Input id="release-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button
              size="sm"
              disabled={!newName.trim()}
              onClick={() => {
                setRows((v) => [
                  {
                    ...releaseSeed[0],
                    id: Math.max(...v.map((r) => r.id)) + 1,
                    name: newName.trim(),
                    done: 0,
                    status: "Needs approval",
                  },
                  ...v,
                ]);
                setNewName("");
                setPage(0);
              }}
            >
              Create review
            </Button>
          </PopoverContent>
        </Popover>
      }
    >
      <StructureToolbar>
        <StructureSearch
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Search releases..."
        />
        <StructureSelect
          label="Service filter"
          value={service}
          onChange={(v) => {
            setService(v);
            setPage(0);
          }}
          options={["All services", "Checkout", "Webhooks", "Authentication"]}
        />
        <StructureSelect
          label="Review status filter"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          options={["All statuses", "Needs approval", "Blocked", "Approved", "Escalated"]}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button className="ml-auto" size="sm" variant="outline">
              <Settings2 />
              View Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end">
            <label className="flex items-center justify-between text-xs">
              Show checklist cards
              <Checkbox checked={checks} onCheckedChange={(v) => setChecks(!!v)} />
            </label>
            <Button size="xs" variant="outline" onClick={() => setExpanded(rows.map((r) => r.id))}>
              Expand all reviews
            </Button>
          </PopoverContent>
        </Popover>
      </StructureToolbar>
      <StructureGrid table={table} recordCount={filtered.length}>
        <DataGridPagination
          more
          sizes={[5, 10, 20]}
          info="{from}–{to} of {count}"
          className="border-t bg-muted/10 px-3 py-2 sm:py-2"
        />
      </StructureGrid>
    </StructureFrame>
  );
}
export default function ExpansionGrid({ block }: BlockProps) {
  return block.id === "data-grid-expansion-3" ? <ReleaseGrid /> : <SubtaskGrid />;
}
