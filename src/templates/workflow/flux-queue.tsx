import { useMemo, type RefObject } from "react";
import {
  useTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  type ExpandedState,
} from "@tanstack/react-table";
import { Download, Layers3, Play, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable, DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { downloadFile } from "@/lib/download";
import { Progress } from "./free/flowly-progress";
import { CheckOption, RecordMenu } from "./flowly-settings-components";
import { Person } from "./controls";
import { FluxQueueStatusBadge, FluxQueuePriorityBadge } from "./flux-queue-badge";
import {
  emptyFluxQueueFilters,
  filterFluxQueue,
  groupFluxQueue,
  nextFluxQueueRun,
  summarizeFluxQueue,
  fluxQueueStatuses,
  fluxQueueDate,
  fluxQueueUpdatedAt,
  fluxQueueCsv,
  type FluxQueueFilters,
  type FluxQueueGrouping,
  type FluxQueueNode,
  type FluxQueueRun,
  type FluxQueueOperation,
  type FluxQueueStatus,
} from "./flux-queue-model";
import "./flux-queue.css";

export interface FluxQueueOpen {
  (row: FluxQueueRun, trigger: HTMLElement): void;
}

export function FluxQueue({
  rows,
  filters,
  onFiltersChange,
  grouping,
  onGroupingChange,
  expanded,
  onExpandedChange,
  sorting,
  onSortingChange,
  onOpen,
  onOperation,
  onCreate,
  onStartNext,
  searchRef,
}: {
  rows: FluxQueueRun[];
  filters: FluxQueueFilters;
  onFiltersChange: (filters: FluxQueueFilters) => void;
  grouping: FluxQueueGrouping;
  onGroupingChange: (grouping: FluxQueueGrouping) => void;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onOpen: FluxQueueOpen;
  onOperation: (row: FluxQueueRun, operation: FluxQueueOperation) => void;
  onCreate: () => void;
  onStartNext: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const filtered = useMemo(() => filterFluxQueue(rows, filters), [rows, filters]);
  const nodes = useMemo(() => groupFluxQueue(filtered, grouping), [filtered, grouping]);
  const summary = useMemo(() => summarizeFluxQueue(rows), [rows]);
  const next = useMemo(() => nextFluxQueueRun(filtered), [filtered]);
  const hasFilters = Boolean(
    filters.query.trim() || filters.status !== "All statuses" || filters.attentionOnly,
  );
  const columns = useMemo<ColumnDef<DataGridFeatures, FluxQueueNode>[]>(
    () => [
      {
        id: "task",
        accessorFn: (node) => node.label,
        size: 360,
        enableHiding: false,
        meta: { headerTitle: "Run / task" },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Run / task" />,
        cell: ({ row }) =>
          row.original.kind === "group" ? (
            <div className="flux-queue-group-cell" data-queue-group={row.original.label}>
              <DataGridTableRowExpand row={row} />
              <strong>{row.original.label}</strong>
              <Badge variant="secondary">{row.original.children.length}</Badge>
            </div>
          ) : (
            <div className="flux-queue-run-cell">
              <DataGridTableRowExpand row={row} />
              <div>
                <button
                  type="button"
                  onClick={(event) => {
                    if (row.original.kind === "run") onOpen(row.original.run, event.currentTarget);
                  }}
                >
                  {row.original.run.task}
                </button>
                <div className="flux-queue-run-meta">
                  <small>{row.original.id}</small>
                  <span className="flux-queue-compact-status">
                    <FluxQueueStatusBadge status={row.original.run.status} />
                  </span>
                  <FluxQueuePriorityBadge priority={row.original.run.priority} />
                  {row.original.run.attention ? (
                    <Badge variant="warning-light">Needs attention</Badge>
                  ) : null}
                </div>
              </div>
            </div>
          ),
      },
      {
        id: "agent",
        accessorFn: (node) => (node.kind === "run" ? node.run.agent : ""),
        size: 160,
        meta: { headerTitle: "Agent" },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Agent" />,
        cell: ({ row }) => (row.original.kind === "run" ? row.original.run.agent : null),
      },
      {
        id: "status",
        accessorFn: (node) => (node.kind === "run" ? node.run.status : ""),
        size: 118,
        meta: { headerTitle: "Status" },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />,
        cell: ({ row }) =>
          row.original.kind === "run" ? (
            <FluxQueueStatusBadge status={row.original.run.status} />
          ) : null,
      },
      {
        id: "owner",
        accessorFn: (node) => (node.kind === "run" ? node.run.owner : ""),
        size: 160,
        meta: { headerTitle: "Owner" },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Owner" />,
        cell: ({ row }) =>
          row.original.kind === "run" ? <Person name={row.original.run.owner} /> : null,
      },
      {
        id: "steps",
        accessorFn: (node) =>
          node.kind === "run" ? node.run.completedSteps / node.run.totalSteps : 0,
        size: 140,
        meta: { headerTitle: "Steps" },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Steps" />,
        cell: ({ row }) =>
          row.original.kind === "run" ? (
            <div className="flux-queue-step-cell">
              <Progress
                aria-label={`Step progress for ${row.original.id}`}
                value={(row.original.run.completedSteps / row.original.run.totalSteps) * 100}
              />
              <small>
                {row.original.run.completedSteps} / {row.original.run.totalSteps} steps
              </small>
            </div>
          ) : null,
      },
      {
        id: "updated",
        accessorFn: (node) => (node.kind === "run" ? fluxQueueUpdatedAt(node.run) : ""),
        size: 170,
        meta: { headerTitle: "Updated" },
        header: ({ column }) => <DataGridColumnHeader column={column} title="Updated" />,
        cell: ({ row }) =>
          row.original.kind === "run" ? (
            <time dateTime={fluxQueueUpdatedAt(row.original.run)}>
              {fluxQueueDate(fluxQueueUpdatedAt(row.original.run))}
            </time>
          ) : null,
      },
      {
        id: "actions",
        size: 48,
        enableHiding: false,
        cell: ({ row }) => {
          if (row.original.kind !== "run") return null;
          const run = row.original.run;
          return (
            <RecordMenu
              label={`Actions for ${run.id}`}
              items={[
                {
                  label: "Review run",
                  onSelect: (trigger) => {
                    if (trigger) onOpen(run, trigger);
                  },
                },
                ...(run.status === "Queued"
                  ? [
                      {
                        label: "Start run",
                        disabled: run.attention,
                        onSelect: () => onOperation(run, "start"),
                      },
                      { label: "Hold run", onSelect: () => onOperation(run, "hold") },
                    ]
                  : []),
                ...(["Held", "Succeeded", "Failed", "Cancelled"].includes(run.status)
                  ? [
                      {
                        label: run.status === "Held" ? "Return to queue" : "Queue again",
                        onSelect: () => onOperation(run, "requeue"),
                      },
                    ]
                  : []),
                {
                  label: run.attention ? "Mark reviewed" : "Flag for review",
                  onSelect: () => onOperation(run, run.attention ? "review" : "flag"),
                  separator: true,
                },
                ...(["Queued", "Running", "Held"].includes(run.status)
                  ? [
                      {
                        label: "Cancel run",
                        destructive: true,
                        onSelect: () => onOperation(run, "cancel"),
                      },
                    ]
                  : []),
              ]}
            />
          );
        },
      },
    ],
    [onOpen, onOperation],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: nodes,
    columns,
    manualPagination: true,
    autoResetExpanded: false,
    getRowId: (node) => node.id,
    getSubRows: (node) => (node.kind === "group" ? node.children : undefined),
    state: { expanded, sorting },
    onExpandedChange,
    onSortingChange,
  });
  return (
    <section className="flux-queue-page" aria-labelledby="flux-queue-title">
      <header className="flux-queue-heading">
        <div>
          <p className="flux-queue-eyebrow">Runs / all runs</p>
          <h1 id="flux-queue-title">Run Queue</h1>
          <p>Group work, review attention flags, and move the next run forward.</p>
        </div>
        <Button onClick={onCreate}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Queue a run
        </Button>
      </header>
      <Frame dense>
        <FramePanel className="flux-queue-overview">
          <div className="flux-queue-overview-title">
            <Layers3 aria-hidden="true" />
            <div>
              <strong>{summary.total} runs in this workspace</strong>
              <p>Changes stay in this tab. Starting a run uses a short local simulation.</p>
            </div>
          </div>
          <dl className="flux-queue-metrics">
            <div>
              <dt>Queued</dt>
              <dd>{summary.queued}</dd>
            </div>
            <div>
              <dt>Running</dt>
              <dd>{summary.running}</dd>
            </div>
            <div>
              <dt>Succeeded</dt>
              <dd>{summary.succeeded}</dd>
            </div>
            <div>
              <dt>Needs attention</dt>
              <dd>{summary.attention}</dd>
            </div>
          </dl>
        </FramePanel>
      </Frame>
      <Frame spacing="sm" className="flux-queue-table">
        <FrameHeader className="flux-queue-table-heading">
          <div>
            <FrameTitle>Queue workspace</FrameTitle>
            <FrameDescription>
              Expand a group or review a run to see its details and history.
            </FrameDescription>
          </div>
          <div className="flux-queue-heading-actions">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadFile("flux-run-queue.csv", fluxQueueCsv(filtered), "text/csv;charset=utf-8")
              }
              disabled={!filtered.length}
            >
              <Download data-icon="inline-start" aria-hidden="true" />
              Export {hasFilters ? "filtered" : "all"}
            </Button>
            <Button size="sm" onClick={onStartNext} disabled={!next}>
              <Play data-icon="inline-start" aria-hidden="true" />
              Start next
            </Button>
          </div>
        </FrameHeader>
        <FramePanel className="flux-queue-grid-panel">
          <DataGrid
            table={table}
            recordCount={filtered.length}
            tableLayout={{
              rowBorder: true,
              headerBorder: true,
              width: "fixed",
              columnsVisibility: true,
            }}
            emptyMessage={
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No matching runs</EmptyTitle>
                  <EmptyDescription>
                    Adjust the status, search or attention filter to find more work.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFiltersChange({ ...emptyFluxQueueFilters })}
                  >
                    Clear filters
                  </Button>
                </EmptyContent>
              </Empty>
            }
          >
            <div className="flux-queue-toolbar">
              <InputGroup className="flux-queue-search">
                <InputGroupAddon>
                  <Search aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  ref={searchRef}
                  aria-label="Search queue"
                  value={filters.query}
                  placeholder="Search tasks, agents, owners or IDs"
                  onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
                />
              </InputGroup>
              <Select
                value={filters.status}
                onValueChange={(status) => {
                  if (
                    status === "All statuses" ||
                    fluxQueueStatuses.includes(status as FluxQueueStatus)
                  )
                    onFiltersChange({ ...filters, status: status as FluxQueueFilters["status"] });
                }}
              >
                <SelectTrigger aria-label="Filter queue by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {["All statuses", ...fluxQueueStatuses].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <CheckOption
                id="flux-queue-attention-only"
                label="Needs attention"
                checked={filters.attentionOnly}
                onChange={(attentionOnly) => onFiltersChange({ ...filters, attentionOnly })}
              />
              <DataGridColumnVisibility
                table={table}
                trigger={
                  <Button variant="outline" size="icon" aria-label="Choose visible queue columns">
                    <SlidersHorizontal aria-hidden="true" />
                  </Button>
                }
              />
            </div>
            <div className="flux-queue-group-toolbar">
              <span>Group by</span>
              <ToggleGroup
                type="single"
                value={grouping}
                onValueChange={(next) => {
                  if (["agent", "status", "none"].includes(next))
                    onGroupingChange(next as FluxQueueGrouping);
                }}
                variant="outline"
                size="sm"
                spacing={0}
                aria-label="Group queue runs"
              >
                <ToggleGroupItem value="agent">Agent</ToggleGroupItem>
                <ToggleGroupItem value="status">Status</ToggleGroupItem>
                <ToggleGroupItem value="none">None</ToggleGroupItem>
              </ToggleGroup>
              {grouping !== "none" ? (
                <div className="flux-queue-expand-actions">
                  <Button variant="ghost" size="sm" onClick={() => onExpandedChange(true)}>
                    Expand all
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onExpandedChange({})}>
                    Collapse all
                  </Button>
                </div>
              ) : null}
              {hasFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFiltersChange({ ...emptyFluxQueueFilters })}
                >
                  <X data-icon="inline-start" aria-hidden="true" />
                  Clear filters
                </Button>
              ) : null}
            </div>
            <DataGridContainer className="rounded-none border-0">
              <DataGridScrollArea orientation="horizontal">
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
            <div className="flux-queue-footer" role="status">
              <span>
                {filtered.length} of {rows.length} runs
                {grouping !== "none" ? ` · ${nodes.length} groups` : ""}
              </span>
              <span>
                {next ? `Next eligible: ${next.task}` : "No eligible queued run in this view"}
              </span>
            </div>
          </DataGrid>
        </FramePanel>
      </Frame>
    </section>
  );
}
