import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  GripVertical,
  Plus,
  Shield,
  Code2,
  Network,
  Globe,
  Layers,
  FileCheck,
  MonitorCog,
  LayoutDashboard,
  ScanSearch,
  ShieldAlert,
  Activity,
  DatabaseZap,
  Braces,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./chrome";
import { Tree, TreeItem, TreeItemLabel } from "@/components/reui/tree";
import { Badge as ReuiBadge } from "@/components/reui/badge";
import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { AccountCard, Segments } from "./primitives";
type ScopeRow = {
  name: string;
  count?: number;
  status?: string;
  children?: ScopeRow[];
};
const security: ScopeRow[] = [
  {
    name: "Endpoints",
    status: "Stable",
    children: [
      { name: "Devices", count: 248 },
      {
        name: "Threats",
        count: 12,
        status: "Review",
        children: [
          { name: "Overview" },
          { name: "Suspicious Activity" },
          { name: "Incidents" },
          { name: "Anomalies" },
        ],
      },
      { name: "Risks", count: 37, status: "High" },
      { name: "Policies", count: 8 },
      { name: "Quarantined", count: 5 },
      { name: "Tasks", count: 7, status: "Active" },
    ],
  },
  {
    name: "Identity & Access",
    status: "Add",
    children: [
      { name: "Users", count: 64 },
      { name: "Service Accounts", count: 12 },
    ],
  },
  {
    name: "Application Security",
    children: [
      { name: "Dependencies", count: 88 },
      { name: "API Scans", count: 6 },
    ],
  },
  {
    name: "Data Protection",
    status: "Review",
    children: [{ name: "Policies", count: 9 }],
  },
];
const assets: ScopeRow[] = [
  {
    name: "Robot Fleet",
    status: "Stable",
    children: [
      { name: "Service Robots", count: 248 },
      { name: "Stations", count: 12 },
      { name: "Device Groups", count: 8 },
    ],
  },
  {
    name: "Infrastructure",
    children: [
      { name: "Gateways", count: 24 },
      { name: "Networks", count: 6 },
    ],
  },
  { name: "Inventory", children: [{ name: "Components", count: 82 }] },
];
const events: ScopeRow[] = [
  {
    name: "Live Events",
    status: "Active",
    children: [
      { name: "Access Requests", count: 6 },
      { name: "Alerts", count: 12 },
      { name: "Mission Events", count: 42 },
    ],
  },
  {
    name: "History",
    children: [
      { name: "Today", count: 128 },
      { name: "Yesterday", count: 204 },
    ],
  },
];
const network: ScopeRow[] = [
  {
    name: "Service Pods",
    status: "Stable",
    children: [
      { name: "Delivery", count: 42 },
      {
        name: "Inspection",
        count: 18,
        status: "Review",
        children: [
          { name: "Overview" },
          { name: "Scheduled" },
          { name: "Findings" },
          { name: "Completed" },
        ],
      },
      { name: "Maintenance", count: 11, status: "2 offline" },
      { name: "Transfer", count: 27 },
      { name: "Patrol", count: 16, status: "Live" },
      { name: "Standby", count: 37, status: "All Ready" },
    ],
  },
  { name: "Stations & Hubs", status: "Add" },
  { name: "Dispatch Queues" },
  { name: "Connectivity Tiers", status: "Manage" },
];
export function ScopeTree({
  scope = "Security",
  query = "",
  networkTree = false,
  fleetTree = false,
  consoleTree = false,
  onSelect,
  showCounts = true,
  showStatus = true,
  onCountChange,
}: {
  scope?: string;
  query?: string;
  networkTree?: boolean;
  fleetTree?: boolean;
  consoleTree?: boolean;
  onSelect: (name: string) => void;
  showCounts?: boolean;
  showStatus?: boolean;
  onCountChange?: (name: string, count: number) => void;
}) {
  const [data, setData] = useState(() => {
    const rows = structuredClone(
      networkTree
        ? network
        : scope === "Assets"
          ? assets
          : scope === "Events"
            ? events
            : security,
    );
    if (fleetTree) {
      rows[0].name = "Fleet";
      rows[0].children![0].name = "Robots";
      rows[0].children![1].name = "Depots";
    }
    if (consoleTree && scope === "Endpoints") {
      rows[0].name = "Endpoint Security";
      const names = [
        "Managed Devices",
        "Threat Detection",
        "Vulnerabilities",
        "Security Policies",
        "Quarantined",
        "Response Tasks",
      ];
      rows[0].children?.forEach((row, i) => {
        row.name = names[i];
      });
    } else if (consoleTree && scope !== "Endpoints") {
      const sections: Record<string, string[]> = {
        Code: ["Repositories", "Dependencies", "Pull Requests", "Code Scans"],
        Network: [
          "Network Segments",
          "Gateways",
          "Connections",
          "Traffic Rules",
        ],
        Perimeter: [
          "Firewalls",
          "Access Points",
          "External Assets",
          "Policies",
        ],
        Platforms: [
          "Cloud Accounts",
          "Kubernetes",
          "Virtual Machines",
          "Services",
        ],
        Compliance: ["Frameworks", "Controls", "Evidence", "Assessments"],
      };
      return (sections[scope] ?? ["Overview", "Draft Scopes"]).map(
        (name, i) => ({
          name,
          count: [24, 12, 8, 6][i],
          children: [{ name: "Overview" }, { name: "Activity" }],
        }),
      );
    }
    return rows;
  });
  const [expanded, setExpanded] = useState([
    "Endpoints",
    "Threats",
    "Fleet",
    "Depots",
    "Service Pods",
    "Inspection",
    "Endpoint Security",
    "Threat Detection",
  ]);
  const [active, setActive] = useState(
    networkTree ? "Scheduled" : "Suspicious Activity",
  );
  const drag = useRef<{ parent: string; name: string } | null>(null);
  const [draft, setDraft] = useState(0);
  function add(name: string) {
    const find = (rows: ScopeRow[]): ScopeRow | undefined => {
      for (const row of rows) {
        if (row.name === name) return row;
        const match = row.children && find(row.children);
        if (match) return match;
      }
    };
    onCountChange?.(name, (find(data)?.count ?? 0) + 1);
    const next = draft + 1;
    setDraft(next);
    const append = (rows: ScopeRow[]): ScopeRow[] =>
      rows.map((r) =>
        r.name === name
          ? {
              ...r,
              count: (r.count ?? 0) + 1,
              children: [...(r.children ?? []), { name: `Draft ${next}` }],
            }
          : { ...r, children: r.children ? append(r.children) : undefined },
      );
    setData((v) => append(v));
    setExpanded((v) => [...v, name]);
  }
  function reorder(parent: string, name: string, direction: number) {
    const update = (rows: ScopeRow[]): ScopeRow[] =>
      rows.map((r) => {
        if (r.name === parent && r.children) {
          const list = [...r.children];
          const i = list.findIndex((v) => v.name === name);
          const j = Math.max(0, Math.min(list.length - 1, i + direction));
          const [item] = list.splice(i, 1);
          list.splice(j, 0, item);
          return { ...r, children: list };
        }
        return { ...r, children: r.children ? update(r.children) : undefined };
      });
    setData((v) => update(v));
  }
  function drop(parent: string, target: string) {
    const item = drag.current;
    if (!item || item.parent !== parent || item.name === target) return;
    const update = (rows: ScopeRow[]): ScopeRow[] =>
      rows.map((r) => {
        if (r.name === parent && r.children) {
          const list = [...r.children];
          const from = list.findIndex((v) => v.name === item.name),
            to = list.findIndex((v) => v.name === target);
          const [moving] = list.splice(from, 1);
          list.splice(to, 0, moving);
          return { ...r, children: list };
        }
        return { ...r, children: r.children ? update(r.children) : undefined };
      });
    setData((v) => update(v));
    drag.current = null;
  }
  const matches = (r: ScopeRow): boolean =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    Boolean(r.children?.some(matches));
  const records = useMemo(() => {
    const result: Record<
      string,
      ScopeRow & { childIds?: string[]; parent: string; level: number }
    > = {};
    function flatten(
      rows: ScopeRow[],
      parent: string,
      level: number,
    ): string[] {
      return rows.filter(matches).map((row) => {
        const id = parent === "__root__" ? row.name : `${parent}/${row.name}`;
        const children = row.children
          ? flatten(row.children, id, level + 1)
          : undefined;
        result[id] = {
          ...row,
          parent: parent.split("/").pop()!,
          level,
          childIds: children ?? (row.count !== undefined ? [] : undefined),
        };
        return id;
      });
    }
    const childIds = flatten(data, "__root__", 0);
    result.__root__ = { name: "Scopes", childIds, parent: "", level: -1 };
    return result;
    // matches only reads the search term and the rows being flattened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, query]);
  const expandedIds = useMemo(
    () =>
      Object.keys(records).filter(
        (id) => query || expanded.includes(records[id].name),
      ),
    [records, query, expanded],
  );
  const tree = useTree<(typeof records)[string]>({
    rootItemId: "__root__",
    state: { expandedItems: expandedIds },
    setExpandedItems: (action) =>
      setExpanded((names) => {
        const ids = Object.keys(records).filter((id) =>
          names.includes(records[id].name),
        );
        const next = typeof action === "function" ? action(ids) : action;
        return next.map((id) => records[id].name);
      }),
    initialState: {
      focusedItem:
        Object.keys(records).find(
          (id) => records[id].name === "Suspicious Activity",
        ) ?? Object.keys(records)[0],
    },
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => item.getItemData().childIds !== undefined,
    onPrimaryAction: (item) => {
      setActive(item.getItemData().name);
      onSelect(item.getItemData().name);
    },
    dataLoader: {
      getItem: (id) => records[id],
      getChildren: (id) => records[id]?.childIds ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });
  useEffect(() => {
    tree.rebuildTree();
  }, [records, tree]);
  const rowIcons = [LayoutDashboard, ScanSearch, ShieldAlert, Activity];
  return (
    <div
      className="shell-scroll p-2"
      role="region"
      aria-label={`${scope} scope tree`}
    >
      <p className="mb-2 px-1 text-[11px] text-muted-foreground">
        {fleetTree
          ? "Operational Scope"
          : networkTree
            ? "Robot Network"
            : `${scope === "Endpoints" ? "Security" : scope} Scope`}
      </p>
      <Tree
        tree={tree}
        indent={20}
        className="shell-reui-scope-tree"
        aria-label={`${scope} scope tree`}
      >
        {tree.getItems().map((item) => {
          const row = item.getItemData();
          const Icon =
            row.level === 0
              ? row.name === "Fleet" || row.name.includes("Endpoint")
                ? MonitorCog
                : row.name === "Application Security"
                  ? Braces
                  : row.name === "Data Protection"
                    ? DatabaseZap
                    : Shield
              : row.level > 1
                ? rowIcons[
                    Math.max(
                      0,
                      [
                        "Overview",
                        "Suspicious Activity",
                        "Incidents",
                        "Anomalies",
                      ].indexOf(row.name),
                    )
                  ]
                : undefined;
          const status =
            fleetTree && row.name === "Depots" ? undefined : row.status;
          const canAdd =
            (row.count !== undefined &&
              !["Risks", "Quarantined", "Tasks"].includes(row.name)) ||
            status === "Add";
          return (
            <TreeItem key={item.getId()} item={item} asChild>
              <div
                onFocus={(e) => {
                  if (e.target === e.currentTarget) item.setFocused();
                }}
                aria-selected={active === row.name}
                data-scope-row={row.name}
                data-scope-parent={row.parent}
                data-active={active === row.name}
                className="shell-scope-item"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  drop(row.parent, row.name);
                }}
              >
                <TreeItemLabel className="shell-scope-label">
                  {row.level === 1 && (
                    <button
                      draggable
                      aria-label={`Reorder ${row.name}`}
                      tabIndex={-1}
                      className="shell-scope-grip"
                      onClick={(e) => e.stopPropagation()}
                      onDragStart={(e) => {
                        drag.current = { parent: row.parent, name: row.name };
                        e.dataTransfer.setData("text/plain", row.name);
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.altKey &&
                          ["ArrowUp", "ArrowDown"].includes(e.key)
                        ) {
                          e.preventDefault();
                          e.stopPropagation();
                          reorder(
                            row.parent,
                            row.name,
                            e.key === "ArrowUp" ? -1 : 1,
                          );
                        }
                      }}
                    >
                      <GripVertical />
                    </button>
                  )}
                  {Icon && <Icon className="shell-scope-node-icon" />}
                  <span className="truncate">{row.name}</span>
                  {showCounts && row.count !== undefined && (
                    <ReuiBadge
                      variant="secondary"
                      size="xs"
                      radius="full"
                      className="shell-scope-count"
                    >
                      {row.count}
                    </ReuiBadge>
                  )}
                  {showStatus && status && status !== "Add" && (
                    <span
                      className={`shell-scope-status ${["Stable", "Active"].includes(status) ? "positive" : status === "High" ? "danger" : ""}`}
                    >
                      {status === "Stable" && <Shield className="size-2.5" />}
                      {status}
                    </span>
                  )}
                  {canAdd && (
                    <button
                      className="shell-scope-add"
                      tabIndex={-1}
                      aria-label={`Add to ${row.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        add(row.name);
                      }}
                    >
                      <Plus />
                    </button>
                  )}
                </TreeItemLabel>
              </div>
            </TreeItem>
          );
        })}
      </Tree>
      {!data.some(matches) && (
        <p className="py-8 text-center text-xs text-muted-foreground">
          No matching scopes.
        </p>
      )}
    </div>
  );
}
export function ScopePanel({
  networkTree = false,
  query = "",
  dynamic = false,
  onSelect,
  showCounts = true,
  showStatus = true,
  onCountChange,
}: {
  networkTree?: boolean;
  query?: string;
  dynamic?: boolean;
  onSelect: (name: string) => void;
  showCounts?: boolean;
  showStatus?: boolean;
  onCountChange?: (name: string, count: number) => void;
}) {
  const [scopes, setScopes] = useState(
    dynamic
      ? ["Endpoints", "Code", "Network", "Perimeter", "Platforms", "Compliance"]
      : ["Security", "Assets", "Events"],
  );
  const [scope, setScope] = useState(dynamic ? "Endpoints" : "Security");
  return (
    <div className="shell-scope-panel flex min-h-0 flex-col border-r">
      <div className="flex items-center gap-1 p-2">
        <div className="min-w-0 flex-1">
          {dynamic ? (
            <div
              className="flex gap-0.5 rounded-lg border bg-muted/50 p-0.5"
              role="tablist"
              aria-label="Scope tabs"
            >
              {scopes.map((name, i) => {
                const Icon = [Shield, Code2, Network, Globe, Layers, FileCheck][
                  i % 6
                ];
                return (
                  <Button
                    key={name}
                    role="tab"
                    aria-label={name}
                    title={name}
                    aria-selected={scope === name}
                    variant={scope === name ? "outline" : "ghost"}
                    size="icon-sm"
                    className="size-6 min-w-0 flex-1"
                    onClick={() => setScope(name)}
                  >
                    <Icon className="size-3.5" />
                  </Button>
                );
              })}
            </div>
          ) : (
            <Segments
              label="Scope tabs"
              items={scopes}
              value={scope}
              onChange={setScope}
            />
          )}
        </div>
        {dynamic && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="size-7"
                aria-label="Manage scopes"
              >
                <Plus />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={scopes.length >= 7}
                  onSelect={() => {
                    const name = `Scope ${scopes.length + 1}`;
                    setScopes((v) => [...v, name]);
                    setScope(name);
                  }}
                >
                  <Plus />
                  Add scope
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={scopes.length >= 7}
                  onSelect={() => {
                    const name = `${scope} copy`;
                    setScopes((v) => [...v, name]);
                    setScope(name);
                  }}
                >
                  <Copy />
                  Duplicate scope
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {scopes.map((name) => (
          <div
            key={name}
            className="min-h-0 flex-1 flex-col"
            style={{ display: name === scope ? "flex" : "none" }}
          >
            <ScopeTree
              scope={name}
              query={query}
              networkTree={networkTree}
              onSelect={onSelect}
              showCounts={showCounts}
              showStatus={showStatus}
              onCountChange={onCountChange}
              consoleTree={dynamic}
            />
          </div>
        ))}
      </div>
      {dynamic && <AccountCard />}
    </div>
  );
}
