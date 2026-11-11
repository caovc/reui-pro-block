import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  Columns3,
  Download,
  Ellipsis,
  Filter,
  ListChecks,
  Plus,
  Search,
  Settings2,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import {
  DataGridTable,
  DataGridTableRowExpand,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import { Filters } from "@/components/reui/filters/filters";
import { createFilterQuery } from "@/components/reui/filters/filters-query";
import type { FilterField } from "@/components/reui/filters/filters-types";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { downloadCsv } from "./data-utils";
import { ReuiScoreRings } from "./reui-free-chart-primitives";
import {
  AgentDetails,
  AgentEditor,
  ScoreAvatar,
  ScorecardBreakdown,
} from "./grid-advanced-support-scorecard-panels";
import {
  formatMinutes,
  makeAgents,
  matchesAgent,
  newAgent,
  queues,
  scorecard,
  shifts,
  type Agent,
  type AgentProfile,
} from "./grid-advanced-support-scorecard-model";

const fields: FilterField[] = [
  { id: "name", label: "Agent", type: "text" },
  {
    id: "queue",
    label: "Queue",
    type: "select",
    options: queues.map((value) => ({ value, label: value })),
  },
  {
    id: "shift",
    label: "Shift",
    type: "select",
    options: shifts.map((value) => ({ value, label: value })),
  },
  { id: "qa", label: "QA", type: "number" },
  { id: "csat", label: "CSAT", type: "number" },
  { id: "reopen", label: "Reopen", type: "number" },
  { id: "sla", label: "SLA", type: "number" },
  {
    id: "coaching",
    label: "Coaching",
    type: "select",
    options: ["In coaching", "Not in coaching"].map((value) => ({ value, label: value })),
  },
];

function QaRing({ agent }: { agent: Agent }) {
  const { qa, band } = scorecard(agent);
  if (qa === null) return <span className="text-muted-foreground">—</span>;
  const color =
    band === "Exceeds"
      ? "text-emerald-600 dark:text-emerald-400"
      : band === "Meets"
        ? "text-blue-600 dark:text-blue-400"
        : band === "Needs Work"
          ? "text-amber-500 dark:text-amber-300"
          : "text-destructive";
  const difference = qa - agent.goal;
  return (
    <ReuiScoreRings
      values={[{ score: qa, color: "currentColor" }]}
      label={`QA ${qa}, ${band}, ${Math.abs(difference)} ${difference >= 0 ? "over" : "under"} the goal of ${agent.goal}`}
      size={24}
      className={color}
    >
      <span className="text-[10px] font-semibold text-foreground">{qa}</span>
    </ReuiScoreRings>
  );
}

function CustomerSatisfaction({ agent }: { agent: Agent }) {
  const csat = scorecard(agent).csat;
  if (csat === null) return <span className="text-muted-foreground">—</span>;
  const color = csat >= 90 ? "bg-emerald-500" : csat >= 80 ? "bg-blue-500" : "bg-amber-500";
  return (
    <div
      aria-label={`${csat}%, ${agent.positive} of ${agent.surveys} surveys positive`}
      role="img"
      className="min-w-24"
    >
      <div aria-hidden="true" className="flex justify-between gap-2 text-xs">
        <span>
          {agent.positive}
          <span className="text-muted-foreground">/{agent.surveys}</span>
        </span>
        <span>{csat}%</span>
      </div>
      <div
        aria-hidden="true"
        className="mt-1 grid gap-px"
        style={{ gridTemplateColumns: "repeat(32,minmax(0,1fr))" } as CSSProperties}
      >
        {Array.from({ length: 32 }, (_, index) => (
          <span
            key={index}
            className={cn("h-1", index < Math.round((csat * 32) / 100) ? color : "bg-muted")}
          />
        ))}
      </div>
    </div>
  );
}

function column(
  id: string,
  title: string,
  accessor: (agent: Agent) => unknown,
  size: number,
): ColumnDef<DataGridFeatures, Agent> {
  return {
    id,
    accessorFn: accessor,
    size,
    header: ({ column }) => <DataGridColumnHeader column={column} title={title} />,
    meta: {
      headerTitle: title,
      headerClassName: "h-8 px-3 py-0 text-xs",
      cellClassName: "px-3 py-0",
    },
  };
}

export default function SupportScorecard() {
  "use no memo";
  const settingsId = useId();
  const isMobile = useIsMobile();
  const [book, setBook] = useState(() => ({ agents: makeAgents(), prior: [] as Agent[][] }));
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState(createFilterQuery);
  const [details, setDetails] = useState<{ id: string; tab: "overview" | "coaching" } | null>(null);
  const [edit, setEdit] = useState<{ agent: Agent | null } | null>(null);
  const [remove, setRemove] = useState<readonly string[] | null>(null);
  const [compact, setCompact] = useState(true);
  const [columnLines, setColumnLines] = useState(true);
  const [stripes, setStripes] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  function restoreFocus() {
    const opener = triggerRef.current;
    if (opener?.isConnected && opener.getClientRects().length > 0) opener.focus();
    else addRef.current?.focus();
  }

  function undo() {
    setBook((current) => {
      const prior = current.prior.at(-1);
      return prior ? { agents: prior, prior: current.prior.slice(0, -1) } : current;
    });
    toast.dismiss("support-scorecard-change");
  }

  function commit(change: (agents: Agent[]) => Agent[], message: string) {
    setBook((current) => ({
      agents: change(current.agents),
      prior: [...current.prior.slice(-19), current.agents],
    }));
    toast.success(message, {
      id: "support-scorecard-change",
      action: { label: "Undo", onClick: undo },
    });
  }

  function updateAgent(id: string, patch: Partial<Agent>, message: string) {
    commit(
      (agents) => agents.map((agent) => (agent.id === id ? { ...agent, ...patch } : agent)),
      message,
    );
  }

  const openAgent = useCallback(
    (id: string, opener: HTMLElement | null, tab: "overview" | "coaching" = "overview") => {
      if (opener) triggerRef.current = opener;
      setDetails({ id, tab });
    },
    [],
  );

  function saveAgent(profile: AgentProfile) {
    if (edit?.agent) {
      updateAgent(edit.agent.id, profile, "Agent updated");
    } else {
      const added = newAgent(profile);
      commit((agents) => [...agents, added], "Agent added");
      setSearch(added.name);
      setQuery(createFilterQuery());
    }
    setEdit(null);
  }

  function deleteAgents() {
    if (!remove?.length) return;
    const ids = new Set(remove);
    commit(
      (agents) => agents.filter((agent) => !ids.has(agent.id)),
      `${ids.size} ${ids.size === 1 ? "agent" : "agents"} deleted`,
    );
    table.resetRowSelection();
    setRemove(null);
  }

  const rows = useMemo(
    () => book.agents.filter((agent) => matchesAgent(agent, search, query)),
    [book.agents, search, query],
  );
  // Stable render functions keep the originating cell button mounted while a sheet is open.
  const columns = useMemo<ColumnDef<DataGridFeatures, Agent>[]>(
    () => [
      {
        id: "select",
        size: 48,
        enableSorting: false,
        enableHiding: false,
        header: () => (
          <div className="flex justify-center">
            <DataGridTableRowSelectAll />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <DataGridTableRowSelect row={row} />
          </div>
        ),
        meta: { headerClassName: "h-8 p-0", cellClassName: "p-0" },
      },
      {
        ...column("agent", "Agent", (agent) => agent.name, isMobile ? 168 : 208),
        enableHiding: false,
        meta: {
          headerTitle: "Agent",
          headerClassName: "h-8 px-2 py-0",
          cellClassName: "px-1 py-0",
          expandedContent: (agent) => <ScorecardBreakdown agent={agent as Agent} />,
        },
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-1.5">
            <DataGridTableRowExpand row={row} />
            <ScoreAvatar name={row.original.name} className="size-5" />
            <button
              type="button"
              className="min-w-0 truncate text-left font-medium hover:underline focus-visible:outline-ring"
              aria-label={`Open ${row.original.name}`}
              onClick={(event) => openAgent(row.original.id, event.currentTarget)}
            >
              {row.original.name}
            </button>
          </div>
        ),
      },
      {
        ...column("qa", "QA", (agent) => scorecard(agent).qa ?? -1, 60),
        cell: ({ row }) => <QaRing agent={row.original} />,
      },
      {
        ...column("reopen", "Reopen", (agent) => scorecard(agent).reopen ?? -1, 137),
        cell: ({ row }) => {
          const { reopen } = scorecard(row.original);
          return reopen === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="whitespace-nowrap tabular-nums">
              {reopen}%{" "}
              <span className="text-xs text-muted-foreground">of {row.original.solved}</span>
              {reopen >= 11 && (
                <span
                  className="ml-1 inline-block size-1.5 rounded-full bg-destructive"
                  aria-label="High reopen rate"
                />
              )}
            </span>
          );
        },
      },
      {
        ...column("csat", "CSAT", (agent) => scorecard(agent).csat ?? -1, 204),
        cell: ({ row }) => <CustomerSatisfaction agent={row.original} />,
      },
      {
        ...column("reply", "First Reply", (agent) => agent.replyMinutes, 132),
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatMinutes(row.original.replyMinutes)}
            {row.original.replyMinutes > 30 && (
              <span
                className="ml-1 inline-block size-1.5 rounded-full bg-destructive"
                aria-label="Above target"
              />
            )}
          </span>
        ),
      },
      {
        ...column("resolution", "Resolution", (agent) => agent.resolutionMinutes, 132),
        cell: ({ row }) => {
          const minutes = row.original.resolutionMinutes;
          if (!minutes) return <span className="text-muted-foreground">—</span>;
          return (
            <Badge
              variant={
                minutes <= 240
                  ? "success-light"
                  : minutes <= 480
                    ? "info-light"
                    : minutes <= 600
                      ? "warning-light"
                      : "destructive-light"
              }
            >
              {formatMinutes(minutes)}
            </Badge>
          );
        },
      },
      {
        ...column("sla", "SLA", (agent) => scorecard(agent).sla ?? -1, 92),
        cell: ({ row }) => {
          const { sla } = scorecard(row.original);
          return sla === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="tabular-nums">
              {sla}%
              {sla < 92 && (
                <span
                  className="ml-1 inline-block size-1.5 rounded-full bg-amber-500"
                  aria-label="Below SLA target"
                />
              )}
            </span>
          );
        },
      },
      {
        ...column(
          "coaching",
          "Coaching",
          (agent) => (agent.coaching ? 2 : scorecard(agent).suggested ? 1 : 0),
          137,
        ),
        cell: ({ row }) => {
          const agent = row.original;
          if (agent.coaching)
            return (
              <span className="whitespace-nowrap text-xs" title={agent.coaching.focus}>
                {new Date(`${agent.coaching.followUp}T12:00:00`).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            );
          if (scorecard(agent).suggested)
            return (
              <Button
                variant="outline"
                size="xs"
                onClick={(event) => openAgent(agent.id, event.currentTarget, "coaching")}
              >
                <ListChecks />
                Suggest
              </Button>
            );
          return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5" />
              On track
            </span>
          );
        },
      },
      {
        id: "actions",
        size: 41,
        enableSorting: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Actions for ${row.original.name}`}
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                }}
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => openAgent(row.original.id, null)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setEdit({ agent: row.original })}>
                  Edit Agent
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => openAgent(row.original.id, null, "coaching")}>
                  Coaching
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setRemove([row.original.id])}
                >
                  Delete Agent
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        meta: { headerClassName: "h-8 p-0", cellClassName: "p-0 text-center" },
      },
    ],
    [isMobile, openAgent],
  );

  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId: (agent) => agent.id,
    getRowCanExpand: () => true,
    enableExpanding: true,
    initialState: {
      sorting: [{ id: "agent", desc: false }],
      pagination: { pageIndex: 0, pageSize: 10 },
      columnPinning: { start: ["select", "agent"], end: [] },
    },
    autoResetPageIndex: true,
    autoResetExpanded: false,
  });
  const selected = table.getSelectedRowModel().rows.map((row) => row.original.id);
  const agent = book.agents.find((entry) => entry.id === details?.id);
  function clear() {
    setSearch("");
    setQuery(createFilterQuery());
  }
  function exportAgents() {
    downloadCsv(
      "support-scorecard",
      table.getSortedRowModel().rows.map(({ original }) => {
        const score = scorecard(original);
        return {
          Agent: original.name,
          Queue: original.queue,
          QA: score.qa ?? "",
          Reopen: score.reopen ?? "",
          CSAT: score.csat ?? "",
          "First Reply": formatMinutes(original.replyMinutes),
          Resolution: formatMinutes(original.resolutionMinutes),
          SLA: score.sla ?? "",
        };
      }),
    );
  }
  return (
    <section aria-label="Support scorecard" className="mx-auto w-full min-w-0 max-w-[1216px]">
      <h1 className="sr-only">Support Scorecard</h1>
      <Frame dense className="overflow-hidden text-sm">
        <FrameHeader className="flex-row items-center justify-between gap-2">
          <div className="min-w-0">
            <FrameTitle>Support Scorecard</FrameTitle>
            <FrameDescription className="max-w-60 text-xs sm:max-w-none">
              Tier 1 support, the four weeks from Sep 28
            </FrameDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Export CSV"
              className="sm:w-auto sm:px-2.5"
              onClick={exportAgents}
              disabled={!rows.length}
            >
              <Download />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              ref={addRef}
              size="icon"
              aria-label="Add Agent"
              className="sm:w-auto sm:px-2.5"
              onClick={(event) => {
                triggerRef.current = event.currentTarget;
                setEdit({ agent: null });
              }}
            >
              <Plus />
              <span className="hidden sm:inline">Add Agent</span>
            </Button>
          </div>
        </FrameHeader>
        <FramePanel className="p-0">
          <DataGrid
            table={table}
            recordCount={rows.length}
            tableLayout={{
              dense: true,
              width: "fixed",
              cellBorder: columnLines,
              stripped: stripes,
              headerBorder: true,
              columnsPinnable: true,
            }}
            tableClassNames={{
              base: "min-w-[1080px] text-sm",
              headerRow: "h-8",
              bodyRow: compact ? "h-[37px]" : "h-12",
            }}
            emptyMessage={
              <Empty className="border-0 py-10">
                <EmptyHeader>
                  <EmptyTitle>No matching agents</EmptyTitle>
                  <EmptyDescription>Try another search or clear the filters.</EmptyDescription>
                </EmptyHeader>
                <Button variant="outline" size="sm" onClick={clear}>
                  Clear Filters
                </Button>
              </Empty>
            }
          >
            <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 sm:px-4">
              {selected.length ? (
                <>
                  <span role="status">{selected.length} selected</span>
                  <Button variant="outline" size="sm" onClick={() => setRemove(selected)}>
                    <Trash2 />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Clear selection"
                    onClick={() => table.resetRowSelection()}
                  >
                    <X />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="sm:hidden"
                    aria-label={showSearch ? "Hide search" : "Show search"}
                    onClick={() => setShowSearch(!showSearch)}
                  >
                    <Search />
                  </Button>
                  <InputGroup
                    className={cn("w-full sm:flex sm:w-64", showSearch ? "order-last" : "hidden")}
                  >
                    <InputGroupAddon>
                      <Search />
                    </InputGroupAddon>
                    <InputGroupInput
                      ref={searchRef}
                      aria-label="Search agents"
                      placeholder="Search agents..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </InputGroup>
                  <Filters
                    fields={fields}
                    query={query}
                    onQueryChange={setQuery}
                    variant="advanced"
                    advancedMode="popover"
                    className="w-auto flex-none"
                    menuClassName="w-[512px] max-w-[calc(100vw-16px)]"
                    trigger={
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Filter"
                        className="sm:w-auto sm:px-2.5"
                      >
                        <Filter />
                        <span className="hidden sm:inline">Filter</span>
                      </Button>
                    }
                  />
                </>
              )}
              <div className="flex-1" />
              {book.prior.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Undo last agent change"
                  onClick={undo}
                >
                  <Undo2 />
                </Button>
              )}
              <DataGridColumnVisibility
                table={table}
                trigger={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Columns"
                    className="sm:w-auto sm:px-2.5"
                  >
                    <Columns3 />
                    <span className="hidden sm:inline">Columns</span>
                  </Button>
                }
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Settings">
                    <Settings2 />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-60">
                  <FieldGroup className="gap-3">
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor={`${settingsId}-compact`}>Compact rows</FieldLabel>
                      <Switch
                        id={`${settingsId}-compact`}
                        checked={compact}
                        onCheckedChange={setCompact}
                      />
                    </Field>
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor={`${settingsId}-columns`}>Column lines</FieldLabel>
                      <Switch
                        id={`${settingsId}-columns`}
                        checked={columnLines}
                        onCheckedChange={setColumnLines}
                      />
                    </Field>
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor={`${settingsId}-stripes`}>Row stripes</FieldLabel>
                      <Switch
                        id={`${settingsId}-stripes`}
                        checked={stripes}
                        onCheckedChange={setStripes}
                      />
                    </Field>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.resetColumnVisibility()}
                    >
                      Reset Columns
                    </Button>
                  </FieldGroup>
                </PopoverContent>
              </Popover>
            </div>
            <DataGridContainer className="rounded-none border-0">
              <DataGridScrollArea orientation="horizontal">
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
            <div className="border-t px-4 py-2">
              <DataGridPagination info="{from} - {to} of {count} agents" sizes={[10, 20, 50]} />
            </div>
          </DataGrid>
        </FramePanel>
      </Frame>
      {agent && details && !edit && !remove && (
        <AgentDetails
          key={`${agent.id}-${details.tab}`}
          agent={agent}
          initialTab={details.tab}
          restoreFocus={restoreFocus}
          onClose={() => setDetails(null)}
          onEdit={() => setEdit({ agent })}
          onDelete={() => {
            setDetails(null);
            setRemove([agent.id]);
          }}
          onCoaching={(coaching) =>
            updateAgent(agent.id, { coaching }, coaching ? "Coaching plan saved" : "Coaching ended")
          }
          onNote={(note) =>
            updateAgent(agent.id, { notes: [...agent.notes, note] }, "Coaching note added")
          }
        />
      )}
      {edit && (
        <AgentEditor
          key={edit.agent?.id ?? "new"}
          agent={edit.agent}
          agents={book.agents}
          onClose={() => setEdit(null)}
          restoreFocus={restoreFocus}
          onSave={saveAgent}
        />
      )}
      <AlertDialog open={remove !== null} onOpenChange={(open) => !open && setRemove(null)}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {remove?.length === 1 ? "agent" : "agents"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove the selected agents from this scorecard. You can undo the change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAgents}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
