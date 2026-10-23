import { useMemo } from "react";
import { advancedBrandAssets } from "./grid-advanced-brand-assets";
import { Checkbox, DotBadge, RowMenu, Spark } from "./grid-advanced-shared";
import { cn } from "./grid-advanced-utils";
import { campaignPerformanceRows } from "./grid-advanced-seeds";
import {
  useDomainGrid,
  DomainGridSurface,
  type DomainColumn,
  type SortingState,
} from "./grid-advanced-model-grid";
import { DataGridTableDnd } from "@/components/reui/data-grid/data-grid-table-dnd";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
type Campaign = (typeof campaignPerformanceRows)[number];
type ColumnKey = "name" | "status" | "spend" | "conversions" | "trend" | "cpa" | "roas" | "buyers";
const initialOrder: ColumnKey[] = [
  "name",
  "status",
  "spend",
  "conversions",
  "trend",
  "cpa",
  "roas",
  "buyers",
];
const labels: Record<ColumnKey, string> = {
  name: "Campaign",
  status: "Status",
  spend: "Spend",
  conversions: "Conversions",
  trend: "Trend",
  cpa: "CPA",
  roas: "ROAS",
  buyers: "New Buyers",
};
const initialWidths: Record<ColumnKey, number> = {
  name: 300,
  status: 88,
  spend: 120,
  conversions: 120,
  trend: 110,
  cpa: 110,
  roas: 140,
  buyers: 144,
};
export default function PerformanceCampaignTable({
  rows,
  targets = false,
  target = "",
  selected,
  setSelected,
  hidden,
  setHidden,
  compact,
  columnLines,
  stripes,
  resizable,
  movable,
  sort,
  setSort,
  query,
  status,
  channel,
  filterName,
  tab,
  page,
  pageSize,
  onPaginationChange,
  onDuplicate,
  onDelete,
}: {
  rows: Campaign[];
  targets?: boolean;
  target?: string;
  selected: number[];
  setSelected: (ids: number[]) => void;
  hidden: string[];
  setHidden: (hidden: string[]) => void;
  compact: boolean;
  columnLines: boolean;
  stripes: boolean;
  resizable: boolean;
  movable: boolean;
  sort: { key: keyof Campaign; asc: boolean };
  setSort: (next: { key: keyof Campaign; asc: boolean }) => void;
  query: string;
  status: string;
  channel: string;
  filterName: string;
  tab: string;
  page: number;
  pageSize: number;
  onPaginationChange: (page: { pageIndex: number; pageSize: number }) => void;
  onDuplicate: (row: Campaign) => void;
  onDelete: (row: Campaign) => void;
}) {
  function cell(row: Campaign, key: ColumnKey) {
    switch (key) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border text-sm font-semibold">
              <img
                alt=""
                className={cn(
                  "size-5 object-contain",
                  ["apple", "x"].includes(
                    [
                      "apple",
                      "apple",
                      "google",
                      "spotify",
                      "youtube",
                      "spotify",
                      "x",
                      "apple",
                      "apple",
                      "google",
                    ][(row.id - 1) % 10],
                  ) && "dark:invert",
                )}
                src={
                  advancedBrandAssets[
                    [
                      "apple",
                      "apple",
                      "google",
                      "spotify",
                      "youtube",
                      "spotify",
                      "x",
                      "apple",
                      "apple",
                      "google",
                    ][(row.id - 1) % 10]
                  ]
                }
              />
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium" title={row.name}>
                {row.name}
              </div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {row.country} · {row.segment}
              </div>
            </div>
          </div>
        );
      case "status":
        return (
          <DotBadge
            tone={row.status === "Live" ? "good" : row.status === "Limited" ? "warn" : "muted"}
          >
            {row.status}
          </DotBadge>
        );
      case "spend":
        return (
          <div className="text-right tabular-nums">
            <span className="font-medium">
              $
              {(row.spend / 1000).toLocaleString("en-US", {
                maximumFractionDigits: 1,
              })}
              K
            </span>
            <span
              className="mt-0.5 block truncate text-xs text-muted-foreground"
              title={row.budgetLabel}
            >
              {row.budgetLabel}
            </span>
          </div>
        );
      case "conversions":
        return (
          <div className="text-right tabular-nums">
            {row.conversions.toLocaleString()}
            <span
              className={cn(
                "mt-0.5 block text-xs",
                row.conversionChange.startsWith("-") ? "text-rose-500" : "text-emerald-500",
              )}
            >
              {row.conversionChange}
            </span>
          </div>
        );
      case "trend":
        return <Spark seed={row.id} />;
      case "cpa":
        return (
          <div className="text-right tabular-nums">
            ${row.cpa.toFixed(2)}
            <span
              className={cn(
                "mt-0.5 block text-xs",
                row.cpaChange.startsWith("-") ? "text-emerald-500" : "text-rose-500",
              )}
            >
              {row.cpaChange}
            </span>
          </div>
        );
      case "roas":
        return (
          <div className="flex items-center gap-2">
            <div className="relative h-1.5 w-14 shrink-0 rounded bg-muted">
              <span
                className="absolute h-1.5 rounded bg-blue-500"
                style={{ width: `${Math.min(100, (row.roas / 14) * 100)}%` }}
              />
              <span className="absolute -top-1 left-1/3 h-3.5 w-px bg-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">{row.roas.toFixed(1)}x</span>
          </div>
        );
      case "buyers":
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-14 shrink-0 overflow-hidden rounded bg-muted">
              <span
                className="block h-full rounded bg-blue-500"
                style={{ width: `${row.buyers}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{row.buyers}%</span>
          </div>
        );
    }
  }

  const columns = useMemo<DomainColumn<Campaign>[]>(
    () => [
      {
        id: "select",
        size: 42,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all campaigns"
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.name} ${row.original.id}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
      },
      ...(targets
        ? [
            {
              id: "channel",
              accessorKey: "channel",
              header: "Channel",
              size: 100,
              cell: ({ row }) => (
                <DotBadge
                  tone={
                    row.original.channel === "Search"
                      ? "blue"
                      : row.original.channel === "Shopping"
                        ? "warn"
                        : "violet"
                  }
                >
                  {row.original.channel}
                </DotBadge>
              ),
            } satisfies DomainColumn<Campaign>,
            {
              id: "name",
              accessorKey: "name",
              header: "Campaign",
              size: 300,
              enableHiding: false,
              cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
            } satisfies DomainColumn<Campaign>,
            {
              id: "roasGroup",
              meta: { headerTitle: "ROAS" },
              header: () => (
                <span>
                  ROAS <span className="text-xs font-normal">↑ Higher is better</span>
                </span>
              ),
              columns: [
                {
                  id: "roasTarget",
                  accessorFn: (r: Campaign) => Number(target || r.roasTarget),
                  header: "Target",
                  size: 100,
                  cell: ({ row }) => (
                    <span className="text-muted-foreground">
                      {Number(target || row.original.roasTarget)}x
                    </span>
                  ),
                },
                {
                  id: "roas",
                  accessorKey: "roas",
                  header: "Actual",
                  size: 110,
                  cell: ({ row }) => (
                    <span
                      className={cn(
                        "block rounded px-2 py-1 font-medium",
                        row.original.roas >= Number(target || row.original.roasTarget)
                          ? "bg-emerald-500/10"
                          : "bg-rose-500/10",
                      )}
                    >
                      {row.original.roas.toFixed(2)}x
                    </span>
                  ),
                },
                {
                  id: "roasDelta",
                  accessorFn: (r: Campaign) => (r.roas / Number(target || r.roasTarget) - 1) * 100,
                  header: "vs Target",
                  size: 130,
                  cell: ({ row }) => (
                    <TargetDelta
                      value={
                        (row.original.roas / Number(target || row.original.roasTarget) - 1) * 100
                      }
                    />
                  ),
                },
              ],
            } satisfies DomainColumn<Campaign>,
            {
              id: "cpaGroup",
              meta: { headerTitle: "CPA" },
              header: () => (
                <span>
                  CPA <span className="text-xs font-normal">↓ Lower is better</span>
                </span>
              ),
              columns: [
                {
                  id: "cpaTarget",
                  accessorKey: "cpaTarget",
                  header: "Target",
                  size: 100,
                  cell: ({ row }) => (
                    <span className="text-muted-foreground">${row.original.cpaTarget}</span>
                  ),
                },
                {
                  id: "cpa",
                  accessorKey: "cpa",
                  header: "Actual",
                  size: 110,
                  cell: ({ row }) => (
                    <span
                      className={cn(
                        "block rounded px-2 py-1",
                        row.original.cpa <= row.original.cpaTarget
                          ? "bg-emerald-500/10"
                          : "bg-rose-500/10",
                      )}
                    >
                      ${row.original.cpa.toFixed(2)}
                    </span>
                  ),
                },
                {
                  id: "cpaDelta",
                  accessorFn: (r: Campaign) => (r.cpa / r.cpaTarget - 1) * 100,
                  header: "vs Target",
                  size: 130,
                  cell: ({ row }) => (
                    <TargetDelta
                      inverse
                      value={(row.original.cpa / row.original.cpaTarget - 1) * 100}
                    />
                  ),
                },
              ],
            } satisfies DomainColumn<Campaign>,
          ]
        : initialOrder.map(
            (key) =>
              ({
                id: key,
                accessorFn: (row: Campaign) => (key === "trend" ? row.spend : row[key]),
                header: labels[key],
                size: initialWidths[key],
                minSize: 72,
                maxSize: 520,
                enableHiding: key !== "name",
                cell: ({ row }) => cell(row.original, key),
                meta: {
                  headerClassName: `reui-col-${key}`,
                  cellClassName: key === "name" ? "max-w-0 truncate" : "",
                },
              }) satisfies DomainColumn<Campaign>,
          )),
      ...(targets
        ? ([
            { id: "status", accessorKey: "status", enableHiding: false },
            { id: "spend", accessorKey: "spend", enableHiding: false },
          ] as DomainColumn<Campaign>[])
        : []),
      {
        id: "actions",
        size: 42,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        cell: ({ row }) => (
          <RowMenu
            name={row.original.name}
            onDuplicate={() => onDuplicate(row.original)}
            onDelete={() => {
              setSelected(selected.filter((id) => id !== row.original.id));
              onDelete(row.original);
            }}
          />
        ),
      },
      {
        id: "channelFilter",
        accessorKey: "channel",
        header: "Channel",
        enableHiding: false,
        filterFn: (row, _id, value) => row.original.channel === value,
      },
      {
        id: "segment",
        accessorKey: "segment",
        header: "Segment",
        enableHiding: false,
        filterFn: (row, _id, value) => row.original.segment === value,
      },
      {
        id: "nameFilter",
        accessorKey: "name",
        header: "Name filter",
        enableHiding: false,
        filterFn: (row, _id, value) =>
          row.original.name.toLowerCase().includes(String(value).toLowerCase()),
      },
    ],
    [rows, selected, targets, target],
  );
  const filters = [
    ...(status !== "All statuses" ? [{ id: "status", value: status }] : []),
    ...(channel !== "All channels" ? [{ id: "channelFilter", value: channel }] : []),
    ...(tab !== "All" ? [{ id: "segment", value: tab }] : []),
    ...(filterName ? [{ id: "nameFilter", value: filterName }] : []),
  ];
  const sorting: SortingState =
    sort.key === "id" ? [] : [{ id: String(sort.key), desc: !sort.asc }];
  const table = useDomainGrid({
    data: rows,
    columns,
    search: query,
    filters,
    sorting,
    onSortingChange: (next) => {
      const value = next[0];
      setSort(
        value ? { key: value.id as keyof Campaign, asc: !value.desc } : { key: "id", asc: true },
      );
    },
    pagination: { pageIndex: page, pageSize },
    onPaginationChange,
    hidden,
    onHiddenChange: setHidden,
    alwaysHidden: [
      "channelFilter",
      "segment",
      "nameFilter",
      ...(targets ? ["status", "spend"] : []),
    ],
    selection: selected.map(String),
    onSelectionChange: (ids) => setSelected(ids.map(Number)),
    getRowId: (row) => String(row.id),
  });
  return (
    <DomainGridSurface
      table={table}
      paginationControls={{ noun: "campaigns", sizes: [10, 25, 50] }}
      layout={{
        dense: compact,
        cellBorder: columnLines,
        stripped: stripes,
        columnsResizable: resizable,
        columnsResizeMode: "onChange",
        columnsMovable: movable,
        columnsDraggable: movable,
      }}
      className="[&_tbody_tr]:h-[51px]"
    >
      {movable ? (
        <DataGridTableDnd
          handleDragEnd={({ active, over }) => {
            if (!over || active.id === over.id) return;
            const order = table.state.columnOrder.length
              ? [...table.state.columnOrder]
              : table.getAllLeafColumns().map((column) => column.id);
            const from = order.indexOf(String(active.id));
            const to = order.indexOf(String(over.id));
            if (from < 0 || to < 0) return;
            order.splice(to, 0, order.splice(from, 1)[0]);
            table.setColumnOrder(order);
          }}
        />
      ) : (
        <DataGridTable />
      )}
    </DomainGridSurface>
  );
}

function TargetDelta({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const good = inverse ? value <= 0 : value >= 0;
  return (
    <div className="flex items-center gap-2">
      <span className={cn("text-xs tabular-nums", good ? "text-emerald-500" : "text-rose-500")}>
        {value >= 0 ? "+" : ""}
        {value.toFixed(1)}%
      </span>
      <span className="relative h-1.5 w-14 rounded bg-muted">
        <span
          className={cn("absolute top-0 h-1.5 rounded", good ? "bg-emerald-500" : "bg-rose-500")}
          style={{ width: `${Math.min(100, Math.abs(value))}%` }}
        />
      </span>
    </div>
  );
}
