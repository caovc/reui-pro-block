import { useMemo, useState, type ReactNode } from "react";
import {
  CircleCheck,
  GripVertical,
  Package,
  RotateCcw,
  Route,
  Store,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  useTable,
  type ColumnDef,
  type ColumnSizingState,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridColumnFilter } from "@/components/reui/data-grid/data-grid-column-filter";
import { StructureGrid } from "./grid-structure-model";
import { StructureFrame } from "./grid-structure-ui";
import { cn } from "@/lib/utils";
import "./grid-specialized.css";

type Field = "wave" | "status" | "dock" | "carrier" | "orders" | "capacity" | "exceptions";
type Wave = {
  id: string;
  name: string;
  status: "Ready" | "At Risk" | "Locked" | "Hold";
  dock: number;
  note: string;
  carrier: string;
  service: string;
  mode: "LTL" | "Parcel" | "Store Transfer" | "Courier";
  orders: number;
  units: number;
  capacity: number;
  exceptions: number;
};
const waves: Wave[] = [
  {
    id: "WAV-4821",
    name: "Priority retail replenishment",
    status: "At Risk",
    dock: 4,
    note: "Carrier check-in pending",
    carrier: "Ryder",
    service: "Same day",
    mode: "LTL",
    orders: 128,
    units: 940,
    capacity: 91,
    exceptions: 5,
  },
  {
    id: "WAV-4822",
    name: "Marketplace express",
    status: "Ready",
    dock: 2,
    note: "Ready to release",
    carrier: "Shippo",
    service: "2 day",
    mode: "Parcel",
    orders: 214,
    units: 512,
    capacity: 76,
    exceptions: 0,
  },
  {
    id: "WAV-4823",
    name: "Store transfer north",
    status: "Locked",
    dock: 7,
    note: "Inventory locked",
    carrier: "Fleet 12",
    service: "Milk run",
    mode: "Store Transfer",
    orders: 56,
    units: 1240,
    capacity: 84,
    exceptions: 1,
  },
  {
    id: "WAV-4824",
    name: "Regional courier pickup",
    status: "Ready",
    dock: 1,
    note: "Courier staged",
    carrier: "Quickline",
    service: "Courier",
    mode: "Courier",
    orders: 88,
    units: 176,
    capacity: 63,
    exceptions: 0,
  },
  {
    id: "WAV-4825",
    name: "Wholesale pallets",
    status: "Hold",
    dock: 5,
    note: "Pallet audit open",
    carrier: "ArcBest",
    service: "Freight",
    mode: "LTL",
    orders: 34,
    units: 2180,
    capacity: 98,
    exceptions: 8,
  },
  {
    id: "WAV-4826",
    name: "Subscription cartons",
    status: "Ready",
    dock: 3,
    note: "Labels printed",
    carrier: "DHL",
    service: "Ground",
    mode: "Parcel",
    orders: 302,
    units: 604,
    capacity: 70,
    exceptions: 0,
  },
  {
    id: "WAV-4827",
    name: "Store transfer south",
    status: "At Risk",
    dock: 6,
    note: "Short pick review",
    carrier: "Fleet 18",
    service: "Milk run",
    mode: "Store Transfer",
    orders: 62,
    units: 1348,
    capacity: 89,
    exceptions: 3,
  },
  {
    id: "WAV-4828",
    name: "Late parcel recovery",
    status: "Ready",
    dock: 2,
    note: "Recovery lane clear",
    carrier: "UPS",
    service: "Air saver",
    mode: "Parcel",
    orders: 119,
    units: 238,
    capacity: 58,
    exceptions: 0,
  },
];
const labels: Record<Field, string> = {
  wave: "Wave",
  status: "Status",
  dock: "Dock",
  carrier: "Carrier",
  orders: "Orders",
  capacity: "Capacity",
  exceptions: "Exceptions",
};
const presets: Record<string, Field[]> = {
  Dispatch: ["wave", "status", "dock", "carrier", "orders", "capacity", "exceptions"],
  Dock: ["dock", "wave", "carrier", "orders", "capacity", "status", "exceptions"],
  Risk: ["status", "exceptions", "wave", "orders", "capacity", "dock", "carrier"],
};
const defaultWidths: Record<Field, number> = {
  wave: 172,
  status: 172,
  dock: 172,
  carrier: 172,
  orders: 172,
  capacity: 172,
  exceptions: 172,
};

function WaveCell({ field, wave }: { field: Field; wave: Wave }): ReactNode {
  if (field === "wave")
    return (
      <div>
        <p className="font-medium">{wave.id}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{wave.name}</p>
      </div>
    );
  if (field === "status")
    return (
      <Badge
        variant="outline"
        className={cn(
          "rounded-md px-1.5 py-0 font-normal",
          wave.status === "Ready"
            ? "text-emerald-700 dark:text-emerald-400"
            : wave.status === "Locked"
              ? "text-violet-700 dark:text-violet-400"
              : wave.status === "Hold"
                ? "text-red-700 dark:text-red-400"
                : "text-amber-700 dark:text-amber-400",
        )}
      >
        {wave.status}
      </Badge>
    );
  if (field === "dock")
    return (
      <div>
        <p>Dock {wave.dock}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{wave.note}</p>
      </div>
    );
  if (field === "carrier") {
    const Icon =
      wave.mode === "LTL"
        ? Truck
        : wave.mode === "Store Transfer"
          ? Store
          : wave.mode === "Courier"
            ? Route
            : Package;
    return (
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border bg-muted/40 shadow-sm">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p>{wave.carrier}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {wave.service} · {wave.mode}
          </p>
        </div>
      </div>
    );
  }
  if (field === "orders")
    return (
      <div>
        <p className="tabular-nums">
          {wave.orders} <span className="text-xs text-muted-foreground">orders</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{wave.units.toLocaleString()} units</p>
      </div>
    );
  if (field === "capacity")
    return (
      <div className="w-20">
        <p className="mb-1.5 tabular-nums">{wave.capacity}%</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            style={{ width: `${wave.capacity}%` }}
            className={cn(
              "h-full rounded-full",
              wave.capacity > 95
                ? "bg-red-500"
                : wave.capacity > 85
                  ? "bg-amber-500"
                  : "bg-emerald-500",
            )}
          />
        </div>
      </div>
    );
  return (
    <span
      className={cn(
        "flex items-center gap-1.5",
        wave.exceptions
          ? "text-amber-800 dark:text-amber-400"
          : "text-emerald-800 dark:text-emerald-400",
      )}
    >
      {wave.exceptions ? (
        <TriangleAlert className="size-3.5" />
      ) : (
        <CircleCheck className="size-3.5" />
      )}
      {wave.exceptions ? `${wave.exceptions} open` : "Clear"}
    </span>
  );
}

export default function DispatchGrid() {
  const [order, setOrder] = useState<Field[]>(presets.Dispatch);
  const [widths, setWidths] = useState<ColumnSizingState>(defaultWidths);
  const [sorting, setSorting] = useState<SortingState>([]),
    [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [announcement, setAnnouncement] = useState("");
  const active = Object.keys(presets).find((key) =>
    presets[key].every((field, i) => order[i] === field),
  );
  function move(field: Field, target: Field) {
    setOrder((current) => {
      const next = [...current];
      next.splice(next.indexOf(field), 1);
      next.splice(current.indexOf(target), 0, field);
      return next;
    });
    setAnnouncement(`${labels[field]} moved to position ${order.indexOf(target) + 1}`);
  }
  function shift(field: Field, offset: number) {
    const target = order[order.indexOf(field) + offset];
    if (target) move(field, target);
  }
  const reviewCount = waves.filter((w) => w.status === "At Risk" || w.status === "Hold").length;
  const columns = useMemo<ColumnDef<DataGridFeatures, Wave>[]>(
    () =>
      presets.Dispatch.map((field) => ({
        id: field,
        accessorFn: (wave) => (field === "wave" ? wave.id : wave[field]),
        size: defaultWidths[field],
        minSize: 20,
        maxSize: 360,
        meta: {
          headerClassName: "overflow-hidden",
          cellClassName: "overflow-hidden",
        },
        header: ({ column }) => (
          <div
            onKeyDown={(event) => {
              if (event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
                event.preventDefault();
                shift(field, event.key === "ArrowLeft" ? -1 : 1);
              }
            }}
          >
            <DataGridColumnHeader
              column={column}
              title={labels[field]}
              filter={
                field === "status" ? (
                  <DataGridColumnFilter
                    column={column}
                    title="Status"
                    options={["Ready", "At Risk", "Locked", "Hold"].map((value) => ({
                      label: value,
                      value,
                    }))}
                  />
                ) : undefined
              }
            />
          </div>
        ),
        filterFn: (row, id, value) =>
          !Array.isArray(value) || !value.length || value.includes(String(row.getValue(id))),
        cell: ({ row }) => <WaveCell field={field} wave={row.original} />,
      })),
    [order],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: waves,
    columns,
    getRowId: (wave) => wave.id,
    manualPagination: true,
    state: { columnOrder: order, columnSizing: widths, sorting, columnFilters },
    onColumnOrderChange: (updater) =>
      setOrder(
        (previous) =>
          (typeof updater === "function" ? updater(previous) : updater).filter(
            (id) => id in labels,
          ) as Field[],
      ),
    onColumnSizingChange: setWidths,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
  });
  return (
    <StructureFrame
      title="Dispatch Layout"
      subtitle={`Role review sequence · 7 fields · ${waves.length} waves`}
      className="special-grid special-dispatch my-12 [&>[data-slot=frame-panel]]:py-0! [&_[data-slot=frame-panel-header]]:px-3 [&_[data-slot=frame-panel-header]]:py-1.5 [&_[data-slot=frame-panel-description]]:mt-0 max-sm:[&_.dispatch-review]:pb-2!"
      actions={
        <>
          {Object.keys(presets).map((key) => (
            <Button
              key={key}
              variant={active === key ? "secondary" : "outline"}
              size="sm"
              aria-pressed={active === key}
              onClick={() => {
                setOrder([...presets[key]]);
                setAnnouncement(`${key} column layout applied`);
              }}
            >
              {key}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOrder([...presets.Dispatch]);
              setWidths(defaultWidths);
              setAnnouncement("Default layout restored");
            }}
          >
            <RotateCcw />
            Reset
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-y dispatch-review px-3 py-2 text-xs">
        <span className="font-medium">Review Order</span>
        <ol className="flex flex-wrap gap-1" aria-label="Column review order">
          {order.map((field, i) => (
            <li key={field} className="rounded-full border px-2 py-0.5">
              <span className="mr-1 text-foreground">{i + 1}</span>
              <span className="text-muted-foreground">{labels[field]}</span>
            </li>
          ))}
        </ol>
      </div>
      <StructureGrid
        table={table}
        mode="columns-dnd"
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id)
            move(String(active.id) as Field, String(over.id) as Field);
        }}
        gridProps={{
          tableLayout: {
            dense: true,
            columnsDraggable: true,
            columnsResizable: true,
            columnsMovable: true,
            cellBorder: true,
          },
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-[6.5px] text-xs text-muted-foreground">
        <span>
          {reviewCount} waves need review, {waves.reduce((sum, wave) => sum + wave.exceptions, 0)}{" "}
          exceptions open
        </span>
        <span className="flex items-center gap-1.5">
          <GripVertical className="size-3" />
          Column order drives handoff sequence
        </span>
      </div>
      <p className="sr-only" role="status">
        {announcement}
      </p>
    </StructureFrame>
  );
}
