import { useMemo, useState } from "react";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  File,
  Flag,
  Folder,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  useTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridTableDndRowHandle } from "@/components/reui/data-grid/data-grid-table-dnd-rows";
import { DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { StructureGrid } from "./grid-structure-model";
import { cn } from "@/lib/utils";
import { downloadCsv } from "./data-utils";
import {
  StructureBadge,
  StructureFrame,
  StructureMenu,
  StructurePerson,
} from "./grid-structure-ui";
const owners = [
  "Leo Grant",
  "Sana Qureshi",
  "Alex Johnson",
  "David Kim",
  "Mira Stone",
  "Nora Vale",
  "Theo Park",
  "Ravi Menon",
];
const backlog = [
  ["Realtime presence", "Feature", "Collaboration", "Sprint 18", "Jul 08", "In Progress", 8],
  ["SSO enforcement", "Security", "Identity", "Sprint 18", "Jul 10", "In Review", 5],
  ["Webhook retries", "Improvement", "Platform", "Sprint 18", "Jul 09", "Ready", 2],
  ["Audit log export", "Improvement", "Compliance", "Sprint 19", "Jul 12", "Blocked", 3],
  ["Billing usage meters", "Feature", "Revenue", "Sprint 19", "Jul 16", "Planned", 13],
  ["Search relevance", "Research", "Search", "Discovery", "Jul 18", "Planned", 8],
  ["Mobile offline mode", "Feature", "Mobile", "Sprint 20", "Jul 22", "Planned", 13],
  ["Token rotation", "Security", "Security", "Sprint 20", "Jul 24", "Planned", 5],
].map((r, i) => ({
  id: i + 1,
  name: String(r[0]),
  type: String(r[1]),
  team: String(r[2]),
  cycle: String(r[3]),
  due: String(r[4]),
  status: String(r[5]),
  effort: Number(r[6]),
  owner: owners[i],
}));
const rules = [
  [
    "Urgent escalation",
    "High priority tickets",
    "Priority",
    "Priority is Urgent",
    "Assign to Tier 2",
    148,
    true,
  ],
  [
    "Enterprise VIP",
    "Top tier accounts",
    "Account",
    "Plan is Enterprise",
    "Route to Success",
    92,
    true,
  ],
  [
    "Billing topics",
    "Payments and invoices",
    "Topic",
    "Topic is Billing",
    "Add label Billing",
    311,
    true,
  ],
  [
    "After hours",
    "Outside business hours",
    "Schedule",
    "Time is off hours",
    "Notify on-call",
    44,
    true,
  ],
  [
    "Bulk senders",
    "Automated mailers",
    "Sender",
    "Domain is noreply",
    "Skip assignment",
    620,
    false,
  ],
  ["Low signal", "Likely spam", "Risk", "Score below 20", "Move to spam", 38, false],
  [
    "Refund requests",
    "Money back asks",
    "Finance",
    "Topic is Refund",
    "Escalate Finance",
    27,
    true,
  ],
].map((r, i) => ({
  id: i + 1,
  name: String(r[0]),
  detail: String(r[1]),
  scope: String(r[2]),
  when: String(r[3]),
  then: String(r[4]),
  matches: Number(r[5]),
  enabled: Boolean(r[6]),
}));
type RankRecord = { id: number; name: string } & Partial<
  (typeof backlog)[number] & (typeof rules)[number]
>;
function RankedGrid({ routing }: { routing: boolean }) {
  const [tasks, setTasks] = useState(backlog),
    [rows, setRows] = useState(rules);
  function reorder(id: number, target: number) {
    if (id === target) return;
    if (routing)
      setRows((v) => {
        const next = [...v];
        next.splice(
          next.findIndex((r) => r.id === target),
          0,
          next.splice(
            next.findIndex((r) => r.id === id),
            1,
          )[0],
        );
        return next;
      });
    else
      setTasks((v) => {
        const next = [...v];
        next.splice(
          next.findIndex((r) => r.id === target),
          0,
          next.splice(
            next.findIndex((r) => r.id === id),
            1,
          )[0],
        );
        return next;
      });
  }
  function actions(id: number) {
    const source = routing ? rows : tasks;
    return [
      { label: "Move to top", onClick: () => reorder(id, source[0].id) },
      {
        label: "Move to bottom",
        onClick: () => reorder(id, source[source.length - 1].id),
      },
      {
        label: routing ? "Remove rule" : "Remove task",
        onClick: () =>
          routing
            ? setRows((v) => v.filter((r) => r.id !== id))
            : setTasks((v) => v.filter((r) => r.id !== id)),
      },
    ];
  }
  const data = useMemo<RankRecord[]>(() => (routing ? rows : tasks), [routing, rows, tasks]);
  const columns = useMemo<ColumnDef<DataGridFeatures, RankRecord>[]>(
    () => [
      {
        id: "drag",
        header: "",
        size: 40,
        cell: () => <DataGridTableDndRowHandle />,
      },
      {
        id: "rank",
        header: "#",
        size: 55,
        cell: ({ row }) => (
          <span className="flex items-center gap-1">
            {!routing && row.index === 0 && <Flag className="size-3" />}
            {row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: routing ? "Rule" : "Task",
        size: 300,
        cell: ({ row: { original: r } }) => {
          const Icon =
            r.type === "Security"
              ? ShieldCheck
              : r.type === "Feature"
                ? Sparkles
                : routing
                  ? Zap
                  : Wrench;
          return (
            <div className={cn("flex items-center gap-3", routing && !r.enabled && "opacity-40")}>
              <span className="rounded-md bg-muted/50 p-1.5">
                <Icon className="size-3.5" />
              </span>
              <div>
                <span className="block font-medium">{r.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {routing ? r.detail : `PLT-${2040 + r.id} · ${r.type}`}
                </span>
              </div>
            </div>
          );
        },
      },
      ...(routing
        ? ([
            {
              accessorKey: "scope",
              header: "Scope",
              size: 120,
              cell: ({ row: { original: r } }) => <StructureBadge value={r.scope!} />,
            },
            {
              accessorKey: "when",
              header: "When",
              size: 210,
              cell: ({ row: { original: r } }) => (
                <span className={cn(!r.enabled && "opacity-40")}>{r.when}</span>
              ),
            },
            {
              accessorKey: "then",
              header: "Then",
              size: 210,
              cell: ({ row: { original: r } }) => (
                <span className={cn("flex items-center gap-1.5", !r.enabled && "opacity-40")}>
                  <Zap className="size-3" />
                  {r.then}
                </span>
              ),
            },
            {
              accessorKey: "matches",
              header: "Matches",
              size: 110,
              cell: ({ row: { original: r } }) => (
                <span>
                  {r.matches}
                  <span className="ml-1 text-xs text-muted-foreground">7d</span>
                </span>
              ),
            },
            {
              accessorKey: "enabled",
              header: "Enabled",
              size: 100,
              cell: ({ row: { original: r } }) => (
                <Switch
                  size="sm"
                  checked={!!r.enabled}
                  aria-label={`Enable ${r.name}`}
                  onCheckedChange={(v) =>
                    setRows((a) => a.map((b) => (b.id === r.id ? { ...b, enabled: v } : b)))
                  }
                />
              ),
            },
          ] as ColumnDef<DataGridFeatures, RankRecord>[])
        : ([
            {
              accessorKey: "owner",
              header: "Owner",
              size: 180,
              cell: ({ row: { original: r } }) => <StructurePerson name={r.owner!} />,
            },
            { accessorKey: "team", header: "Team", size: 170 },
            { accessorKey: "cycle", header: "Cycle", size: 140 },
            { accessorKey: "due", header: "Due", size: 110 },
            {
              accessorKey: "status",
              header: "Status",
              size: 130,
              cell: ({ row: { original: r } }) => <StructureBadge value={r.status!} />,
            },
            {
              accessorKey: "effort",
              header: "Effort",
              size: 95,
              cell: ({ row: { original: r } }) => (
                <span>
                  {r.effort}
                  <span className="ml-1 text-xs text-muted-foreground">pts</span>
                </span>
              ),
            },
          ] as ColumnDef<DataGridFeatures, RankRecord>[])),
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <StructureMenu
            label={`Actions for ${row.original.name}`}
            items={actions(row.original.id)}
          />
        ),
      },
    ],
    [routing, rows, tasks],
  );
  const table = useTable({
    features: dataGridFeatures,
    data,
    columns,
    getRowId: (r) => String(r.id),
    manualPagination: true,
  });
  return (
    <StructureFrame
      title={routing ? "Routing Rules" : "Sprint Backlog"}
      subtitle={
        routing
          ? `First match wins · ${rows.filter((r) => r.enabled).length} active · ${rows.reduce((a, r) => a + r.matches, 0).toLocaleString()} matches`
          : `Drag to prioritize · ${tasks.length} items`
      }
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setTasks(backlog);
            setRows(rules);
          }}
        >
          <RotateCcw />
          Reset order
        </Button>
      }
    >
      <StructureGrid
        table={table}
        mode="dnd"
        onDragEnd={({ active, over }) => {
          if (over) reorder(Number(active.id), Number(over.id));
        }}
      />
    </StructureFrame>
  );
}

type DriveNode = {
  id: number;
  name: string;
  parent: number | null;
  folder: boolean;
  size: number;
  owner: string;
  modified: string;
};
const top: DriveNode[] = [
  {
    id: 1,
    name: "Product Design",
    parent: null,
    folder: true,
    size: 0,
    owner: "Mira Stone",
    modified: "Jul 23, 2026",
  },
  {
    id: 2,
    name: "Design System",
    parent: 1,
    folder: true,
    size: 0,
    owner: "Mira Stone",
    modified: "Jul 22, 2026",
  },
  {
    id: 3,
    name: "Marketing Site",
    parent: 1,
    folder: true,
    size: 0,
    owner: "Sana Qureshi",
    modified: "Jul 23, 2026",
  },
  {
    id: 4,
    name: "Design Review.pdf",
    parent: 1,
    folder: false,
    size: 2.35,
    owner: "Mira Stone",
    modified: "Jul 17, 2026",
  },
  ...["Engineering", "Brand Assets", "Finance", "Operations"].map((name, i) => ({
    id: 5 + i,
    name,
    parent: null,
    folder: true,
    size: 0,
    owner: owners[i + 3],
    modified: "Jul 23, 2026",
  })),
  {
    id: 9,
    name: "Company Handbook.pdf",
    parent: null,
    folder: false,
    size: 5.5,
    owner: "Leo Grant",
    modified: "Jul 12, 2026",
  },
];
const driveSeed: DriveNode[] = [
  ...top,
  ...Array.from({ length: 38 }, (_, i) => ({
    id: 10 + i,
    name: [
      "Tokens.json",
      "Component Library.fig",
      "Release Notes.md",
      "Campaign Brief.pdf",
      "Brand Guidelines.pdf",
      "Budget Forecast.xlsx",
      "Team Roadmap.csv",
      "Architecture.png",
    ][i % 8].replace(".", ` ${Math.floor(i / 8) + 1}.`),
    parent: [
      2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7,
      7, 7, 7, 8, 8, 8, 8,
    ][i],
    folder: false,
    size: Math.round((i * 15.7 + 1.36) * 100) / 100,
    owner: owners[i % 8],
    modified: "Jul 22, 2026",
  })),
];
const folderTargets: Record<number, number> = {
  2: 9.68,
  3: 188.07,
  5: 7.37,
  6: 763.2,
  7: 10.5,
  8: 83.1,
};
for (const [parent, target] of Object.entries(folderTargets)) {
  const children = driveSeed.filter((r) => r.parent === Number(parent) && !r.folder);
  const total = children.reduce((a, r) => a + r.size, 0);
  let assigned = 0;
  children.forEach((r, i) => {
    r.size =
      i === children.length - 1
        ? Math.round((target - assigned) * 100) / 100
        : Math.round((r.size / total) * target * 100) / 100;
    assigned += r.size;
  });
}
type DriveTreeNode = DriveNode & { children: DriveTreeNode[] };
function DriveGrid() {
  const [nodes, setNodes] = useState(driveSeed),
    [expanded, setExpanded] = useState<number[]>([1]),
    [rowSelection, setRowSelection] = useState<RowSelectionState>({}),
    [sorting, setSorting] = useState<SortingState>([]);
  function descendants(id: number): number[] {
    return nodes.filter((r) => r.parent === id).flatMap((r) => [r.id, ...descendants(r.id)]);
  }
  function size(id: number): number {
    const n = nodes.find((r) => r.id === id);
    return n?.folder
      ? nodes.filter((r) => r.parent === id).reduce((a, r) => a + size(r.id), 0)
      : (n?.size ?? 0);
  }
  const checked = Object.keys(rowSelection)
    .filter((id) => rowSelection[id])
    .map(Number);
  const tree = useMemo(() => {
    function nest(parent: number | null): DriveTreeNode[] {
      return nodes.filter((r) => r.parent === parent).map((r) => ({ ...r, children: nest(r.id) }));
    }
    return nest(null);
  }, [nodes]);
  function drop(id: number, target: number, inside: boolean) {
    if (id === target || descendants(id).includes(target)) {
      return;
    }
    const targetNode = nodes.find((r) => r.id === target);
    if (!targetNode) return;
    setNodes((v) => {
      const source = v.find((r) => r.id === id);
      if (!source) return v;
      const next = v.filter((r) => r.id !== id);
      const index = next.findIndex((r) => r.id === target);
      next.splice(inside ? index + 1 : index, 0, {
        ...source,
        parent: inside && targetNode.folder ? target : targetNode.parent,
      });
      return next;
    });
    if (inside) setExpanded((v) => [...new Set([...v, target])]);
    setSorting([]);
  }
  function remove(ids: number[]) {
    const all = new Set(ids.flatMap((id) => [id, ...descendants(id)]));
    setNodes((v) => v.filter((r) => !all.has(r.id)));
    setRowSelection((v) =>
      Object.fromEntries(Object.entries(v).filter(([i]) => !all.has(Number(i)))),
    );
  }
  const columns = useMemo<ColumnDef<DataGridFeatures, DriveTreeNode>[]>(
    () => [
      {
        id: "drag",
        header: "",
        size: 40,
        cell: () => <DataGridTableDndRowHandle disabled={sorting.length > 0} />,
      },
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all drive items"
            checked={
              table.getIsAllRowsSelected()
                ? true
                : table.getIsSomeRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)}
          />
        ),
        size: 40,
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.name}`}
            checked={row.getIsSelected() ? true : row.getIsSomeSelected() ? "indeterminate" : false}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
          />
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Name" />,
        size: 400,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <DataGridTableRowExpand row={row} />
            {row.original.folder ? (
              <Folder className="size-4" />
            ) : (
              <File className="size-4 text-muted-foreground" />
            )}
            <span className={row.original.folder ? "font-medium" : ""}>{row.original.name}</span>
          </div>
        ),
      },
      {
        id: "type",
        accessorFn: (r) => (r.folder ? "Folder" : r.name.split(".").pop()!.toUpperCase()),
        header: ({ column }) => <DataGridColumnHeader column={column} title="Type" />,
        size: 110,
        cell: ({ getValue }) => <StructureBadge value={String(getValue())} />,
      },
      {
        id: "size",
        accessorFn: (r) => size(r.id),
        header: ({ column }) => <DataGridColumnHeader column={column} title="Size" />,
        size: 130,
        cell: ({ row }) => (
          <>
            <span className="block tabular-nums">
              {size(row.original.id).toLocaleString("en-US", {
                maximumFractionDigits: 1,
              })}{" "}
              MB
            </span>
            {row.original.folder && (
              <span className="block text-xs text-muted-foreground">
                {descendants(row.original.id).length} items
              </span>
            )}
          </>
        ),
      },
      {
        accessorKey: "owner",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Owner" />,
        size: 190,
        cell: ({ row }) => <StructurePerson name={row.original.owner} />,
      },
      {
        accessorKey: "modified",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Modified" />,
        size: 150,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row: { original: r } }) => (
          <StructureMenu
            label={`Actions for ${r.name}`}
            items={[
              ...(r.parent !== null
                ? [
                    {
                      label: "Move to root",
                      onClick: () =>
                        setNodes((v) => v.map((n) => (n.id === r.id ? { ...n, parent: null } : n))),
                    },
                  ]
                : []),
              {
                label: "Download item details",
                onClick: () => downloadCsv(r.name, [r]),
              },
              { label: "Delete", onClick: () => remove([r.id]) },
            ]}
          />
        ),
      },
    ],
    [nodes, rowSelection, sorting],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: tree,
    columns,
    getRowId: (r) => String(r.id),
    getSubRows: (r) => r.children,
    autoResetExpanded: false,
    manualPagination: true,
    enableSubRowSelection: true,
    state: {
      expanded: Object.fromEntries(expanded.map((id) => [String(id), true])),
      rowSelection,
      sorting,
    },
    onRowSelectionChange: (updater) =>
      setRowSelection((previous) => {
        const next = {
          ...(typeof updater === "function" ? updater(previous) : updater),
        };
        function normalize(list: DriveTreeNode[]): boolean {
          return list
            .map((node) => {
              if (!node.children.length) return !!next[String(node.id)];
              const all = normalize(node.children);
              if (all) next[String(node.id)] = true;
              else delete next[String(node.id)];
              return all;
            })
            .every(Boolean);
        }
        normalize(tree);
        return next;
      }),
    onSortingChange: setSorting,
    onExpandedChange: (updater) =>
      setExpanded((v) => {
        const previous = Object.fromEntries(v.map((id) => [String(id), true]));
        const next = typeof updater === "function" ? updater(previous) : updater;
        return next === true
          ? nodes.filter((r) => r.folder).map((r) => r.id)
          : Object.keys(next)
              .filter((id) => next[id])
              .map(Number);
      }),
  });
  return (
    <StructureFrame
      title="Shared Drive"
      subtitle={
        <span>
          Northwind Workspace · {nodes.length} items{" "}
          <span className="ml-2">
            Used{" "}
            <b className="ml-1 text-foreground">
              {(nodes.filter((r) => !r.folder).reduce((a, r) => a + r.size, 0) / 1024).toFixed(2)}{" "}
              GB
            </b>
          </span>
        </span>
      }
      actions={
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpanded(nodes.filter((r) => r.folder).map((r) => r.id))}
          >
            <ChevronsUpDown />
            Expand all
          </Button>
          <Button size="sm" variant="outline" onClick={() => setExpanded([])}>
            <ChevronsDownUp />
            Collapse all
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setNodes(driveSeed);
              setExpanded([1]);
              setRowSelection({});
              setSorting([]);
            }}
          >
            <RotateCcw />
            Reset
          </Button>
        </>
      }
    >
      {checked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-y bg-muted/30 px-4 py-2 text-xs">
          <span>{checked.length} selected</span>
          <Button
            size="xs"
            variant="outline"
            onClick={() =>
              downloadCsv(
                "Selected drive items",
                nodes.filter((r) => checked.includes(r.id)),
              )
            }
          >
            Download list
          </Button>
          <Button size="xs" variant="destructive" onClick={() => remove(checked)}>
            Delete
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setRowSelection({})}>
            Clear selection
          </Button>
        </div>
      )}
      <StructureGrid
        table={table}
        mode="dnd"
        recordCount={nodes.length}
        onDragEnd={(event) => {
          if (!event.over || sorting.length) return;
          const target = nodes.find((r) => r.id === Number(event.over!.id));
          drop(
            Number(event.active.id),
            Number(event.over.id),
            !!target?.folder && event.delta.x >= 0,
          );
        }}
      />
    </StructureFrame>
  );
}
export default function DragDropGrid({ block }: BlockProps) {
  return block.id === "data-grid-drag-drop-4" ? (
    <DriveGrid />
  ) : (
    <RankedGrid routing={block.id === "data-grid-drag-drop-2"} />
  );
}
