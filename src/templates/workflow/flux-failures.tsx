import { useMemo, type RefObject } from "react";
import {
  useTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import {
  CircleAlert,
  ClipboardCheck,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
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
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecordMenu } from "./flowly-settings-components";
import { Person } from "./controls";
import { FluxFailureBadge } from "./flux-failure-badge";
import {
  emptyFluxFailureFilters,
  fluxFailureAgents,
  type FluxFailureFilters,
  fluxFailureDate,
  filterFluxFailures,
  summarizeFluxFailures,
  fluxFailureMoney,
  type FluxFailure,
} from "./flux-runs-model";
import "./flux-failures.css";

export interface FluxFailureOpen {
  (row: FluxFailure, trigger: HTMLElement): void;
}

function FailureFilter({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          {items.map((item) => (
            <SelectItem value={item} key={item}>
              {item}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function exportFailures(rows: readonly FluxFailure[]) {
  const header = [
    "Run",
    "Task",
    "Status",
    "Agent",
    "Owner",
    "Failed step",
    "Error code",
    "Last attempt",
  ];
  const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const csv = [
    header,
    ...rows.map((row) => [
      row.id,
      row.task,
      row.status,
      row.agent,
      row.owner,
      row.failedStep,
      row.errorCode,
      row.lastAttempt,
    ]),
  ]
    .map((line) => line.map(csvCell).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "flux-failures.csv";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Free ReUI DataGrid owns sorting, column visibility, scrolling and pagination. */
export function FluxFailures({
  rows,
  onOpen,
  onCreate,
  searchRef,
  filters,
  onFiltersChange,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
}: {
  rows: FluxFailure[];
  onOpen: FluxFailureOpen;
  onCreate: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
  filters: FluxFailureFilters;
  onFiltersChange: (next: FluxFailureFilters) => void;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
}) {
  const filtered = useMemo(() => filterFluxFailures(rows, filters), [rows, filters]);
  const summary = useMemo(() => summarizeFluxFailures(rows), [rows]);
  const activeFilters =
    filters.query.trim() ||
    filters.status !== "All Statuses" ||
    filters.error !== "All Errors" ||
    filters.agent !== "All Agents";
  const columns = useMemo<ColumnDef<DataGridFeatures, FluxFailure>[]>(
    () => [
      {
        accessorKey: "task",
        meta: { headerTitle: "Run / task" },
        size: 320,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Run / task" />,
        cell: ({ row }) => (
          <div className="flux-failure-run">
            <button type="button" onClick={(event) => onOpen(row.original, event.currentTarget)}>
              {row.original.task}
            </button>
            <small>
              {row.original.id} <span aria-hidden="true">·</span> {row.original.attempts.length}{" "}
              attempts
            </small>
          </div>
        ),
      },
      {
        accessorKey: "status",
        meta: { headerTitle: "Status" },
        size: 112,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <FluxFailureBadge status={row.original.status} />,
      },
      {
        accessorKey: "agent",
        meta: { headerTitle: "Agent" },
        size: 155,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Agent" />,
        cell: ({ getValue }) => <span>{String(getValue())}</span>,
      },
      {
        accessorKey: "owner",
        meta: { headerTitle: "Owner" },
        size: 178,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Owner" />,
        cell: ({ row }) => (
          <div className="flux-failure-owner">
            <Person name={row.original.owner} />
            <small>{row.original.ownerRole}</small>
          </div>
        ),
      },
      {
        accessorKey: "failedStep",
        meta: { headerTitle: "Failure point" },
        size: 190,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Failure point" />,
        cell: ({ row }) => (
          <div className="flux-failure-step">
            <code>{row.original.failedStep}</code>
            <small>
              {row.original.errorType} · step {row.original.step}/{row.original.totalSteps}
            </small>
          </div>
        ),
      },
      {
        accessorKey: "lastAttempt",
        meta: { headerTitle: "Last attempt" },
        size: 158,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Last attempt" />,
        cell: ({ getValue }) => (
          <time dateTime={String(getValue())}>{fluxFailureDate(String(getValue()))}</time>
        ),
      },
      {
        id: "actions",
        size: 48,
        enableHiding: false,
        cell: ({ row }) => (
          <RecordMenu
            label={`Actions for ${row.original.id}`}
            items={[
              {
                label: "View details",
                onSelect: (trigger) => {
                  if (trigger) onOpen(row.original, trigger);
                },
              },
            ]}
          />
        ),
      },
    ],
    [onOpen],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: filtered,
    columns,
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    state: { pagination, sorting },
    onPaginationChange,
    onSortingChange,
  });
  return (
    <section className="flux-failures-page" aria-labelledby="flux-failures-title">
      <header className="flux-failures-heading">
        <div>
          <p className="flux-failure-eyebrow">Runs / triage</p>
          <h1 id="flux-failures-title">
            Failures <Badge variant="destructive-light">{summary.failed} need review</Badge>
          </h1>
          <p>Inspect failed steps, prepare a payload, and decide what happens next.</p>
        </div>
        <Button onClick={onCreate}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Log failure
        </Button>
      </header>
      <Frame dense className="flux-failure-overview">
        <FramePanel>
          <div className="flux-failure-summary-lead">
            <CircleAlert aria-hidden="true" />
            <div>
              <strong>{summary.active} active records</strong>
              <p>{rows.length} records in this session</p>
            </div>
          </div>
          <dl className="flux-failure-metrics">
            <div>
              <dt>Refund exposure</dt>
              <dd>{fluxFailureMoney(summary.exposureCents)}</dd>
            </div>
            <div>
              <dt>Provider backoff</dt>
              <dd>
                {summary.backoff}
                <small> runs</small>
              </dd>
            </div>
            <div>
              <dt>Assigned owners</dt>
              <dd>{summary.owners}</dd>
            </div>
            <div>
              <dt>Payloads ready</dt>
              <dd>
                {summary.payloadReady}
                <small> / {summary.active}</small>
              </dd>
            </div>
          </dl>
        </FramePanel>
      </Frame>
      <Frame className="flux-failures-table" spacing="sm">
        <FrameHeader className="flux-failures-table-heading">
          <div>
            <FrameTitle>Failure ledger</FrameTitle>
            <FrameDescription>
              Review a run to inspect its error and attempt history.
            </FrameDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportFailures(filtered)}
            disabled={!filtered.length}
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            Export {activeFilters ? "filtered" : "all"}
          </Button>
        </FrameHeader>
        <FramePanel className="flux-failures-grid-panel">
          <DataGrid
            table={table}
            recordCount={filtered.length}
            tableLayout={{
              rowBorder: true,
              headerBorder: true,
              width: "fixed",
              columnsVisibility: true,
            }}
            tableClassNames={{ base: "wf-official-grid" }}
            emptyMessage={
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>
                    {rows.length ? "No matching failures" : "Your failure ledger is clear"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {rows.length
                      ? "Change the filters or clear your search to see more runs."
                      : "Log a failure to start reviewing a run."}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={
                      rows.length ? () => onFiltersChange({ ...emptyFluxFailureFilters }) : onCreate
                    }
                  >
                    {rows.length ? "Clear filters" : "Log failure"}
                  </Button>
                </EmptyContent>
              </Empty>
            }
          >
            <div className="flux-failures-toolbar">
              <InputGroup className="flux-failures-search">
                <InputGroupAddon>
                  <Search aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  ref={searchRef}
                  aria-label="Search failures"
                  placeholder="Search tasks, owners, or error codes"
                  value={filters.query}
                  onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
                />
              </InputGroup>
              <FailureFilter
                label="Filter by run status"
                value={filters.status}
                onChange={(status) => onFiltersChange({ ...filters, status })}
                items={["All Statuses", "Failed", "Retrying", "Dismissed"]}
              />
              <FailureFilter
                label="Filter by error type"
                value={filters.error}
                onChange={(error) => onFiltersChange({ ...filters, error })}
                items={["All Errors", "Payment", "Rate Limit", "Gateway", "Query", "Schema"]}
              />
              <FailureFilter
                label="Filter by agent"
                value={filters.agent}
                onChange={(agent) => onFiltersChange({ ...filters, agent })}
                items={["All Agents", ...fluxFailureAgents]}
              />
              <DataGridColumnVisibility
                table={table}
                trigger={
                  <Button variant="outline" size="icon" aria-label="Choose visible failure columns">
                    <SlidersHorizontal aria-hidden="true" />
                  </Button>
                }
              />
            </div>
            <div className="flux-failures-results" role="status" aria-live="polite">
              <span>
                {filtered.length} of {rows.length} records
              </span>
              {activeFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFiltersChange({ ...emptyFluxFailureFilters })}
                >
                  <X data-icon="inline-start" aria-hidden="true" />
                  Clear filters
                </Button>
              ) : (
                <span>
                  <ClipboardCheck aria-hidden="true" /> Session workspace
                </span>
              )}
            </div>
            <DataGridContainer className="rounded-none border-0">
              <DataGridScrollArea orientation="horizontal">
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
            <DataGridPagination
              sizes={[6, 12, 24]}
              info="{from}–{to} of {count}"
              className="flux-failures-pagination"
            />
          </DataGrid>
        </FramePanel>
      </Frame>
      <p className="flux-failure-session-note">
        Local preview. Edits and retry simulations last until you reload.
      </p>
    </section>
  );
}
