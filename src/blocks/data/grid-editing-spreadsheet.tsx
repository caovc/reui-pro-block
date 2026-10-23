import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Columns3,
  Download,
  Filter,
  Flag,
  Plus,
  Redo2,
  RotateCcw,
  Settings2,
  Undo2,
  X,
} from "lucide-react";
import { ContextMenu } from "radix-ui";
import {
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type ColumnVisibilityState,
} from "@tanstack/react-table";
import {
  dataGridFeatures,
  type DataGridFeatures,
  type DataGridCellSelectionSnapshot,
  type DataGridCellsChangeDetails,
  type DataGridCellEditRequest,
} from "@/components/reui/data-grid/data-grid";
import {
  buildDataGridPasteDetails,
  getDataGridActiveRegionGrid,
  invertDataGridCellsChange,
  type DataGridCellSelectionApi,
} from "@/components/reui/data-grid/data-grid-cell-selection";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import {
  DataGridTableFootRow,
  DataGridTableFootRowCell,
} from "@/components/reui/data-grid/data-grid-table";
import type { BlockProps } from "@/data/types";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { downloadCsv } from "./data-utils";
import { toast } from "sonner";
import { FilterBar, firstRule, matchesRules, type FilterRule } from "./grid-filter-controls";
import { StructureGrid } from "./grid-structure-model";
import {
  StructureBadge,
  StructureFrame,
  StructurePerson,
  StructureSearch,
  StructureSelect,
  StructureToolbar,
} from "./grid-structure-ui";

type SheetRow = { id: number; [key: string]: string | number | boolean };
type Field = {
  key: string;
  title: string;
  kind: "text" | "number" | "status" | "date" | "person" | "currency";
  options?: string[];
  letter?: string;
};
const taskTitles = [
  "Freeze the release branch and cut rc.1",
  "Run the full regression suite against staging",
  "Publish the migration guide for the v3 ingest API",
  "Load test the ingest pipeline at three times peak",
  "Rotate signing keys and refresh CI secrets",
  "Draft the changelog and the in-app release note",
  "Verify proration on annual plan upgrades",
  "Update the status page components and runbook links",
  "Localize onboarding strings for German and Japanese",
  "Dry run the rollback procedure end to end",
  "Collect SOC 2 evidence for the new subprocessor",
  "Schedule the customer webinar and send invites",
  "Enable the flag for the five percent canary",
  "Archive the deprecated v2 dashboards",
  "Cut rc.2 with the ingest hotfix",
  "Drain the legacy queue before the cutover window",
  "Verify blue green routing weights in staging",
  "Rehearse the database migration on a restored snapshot",
  "Raise the connection pool ceiling for launch traffic",
  "Pin the CDN cache rules for the new asset paths",
  "Add a synthetic check for the checkout callback",
  "Rotate the staging service account keys",
];
const taskStatuses = [
  "Shipped",
  "In progress",
  "In review",
  "Blocked",
  "Ready",
  "In progress",
  "Ready",
  "Backlog",
  "In progress",
  "Ready",
  "In review",
  "Backlog",
  "Ready",
];
const taskOwners = [
  "Leo",
  "Theo, Ivo",
  "Nora",
  "Leo, Theo",
  "Ivo",
  "Mira, Nora",
  "Priya",
  "",
  "Sana",
  "Leo, Theo, Ivo",
  "Sana",
  "Mira",
  "Theo",
];
const taskFields: Field[] = [
  { key: "task", title: "Task", kind: "text" },
  {
    key: "status",
    title: "Status",
    kind: "status",
    options: ["Backlog", "Ready", "In progress", "In review", "Blocked", "Shipped"],
  },
  { key: "assignee", title: "Assignees", kind: "person" },
  { key: "due", title: "Due", kind: "date" },
  {
    key: "priority",
    title: "Priority",
    kind: "status",
    options: ["Low", "Normal", "High", "Critical"],
  },
  { key: "points", title: "Points", kind: "number" },
];
const stockFields: Field[] = [
  { key: "sku", title: "SKU", kind: "text", letter: "A" },
  { key: "item", title: "Item", kind: "text", letter: "B" },
  { key: "buyer", title: "Buyer", kind: "person", letter: "C" },
  {
    key: "warehouse",
    title: "Warehouse",
    kind: "status",
    options: ["Columbus", "Joliet", "Dallas", "Savannah", "Reno"],
    letter: "D",
  },
  {
    key: "status",
    title: "Status",
    kind: "status",
    options: ["Covered", "Review", "Approved", "Ordered", "Hold"],
    letter: "E",
  },
  { key: "onhand", title: "On Hand", kind: "number", letter: "F" },
  { key: "reorder", title: "Reorder Point", kind: "number", letter: "G" },
  { key: "quantity", title: "Order Qty", kind: "number", letter: "H" },
  { key: "cost", title: "Unit Cost", kind: "currency", letter: "I" },
  { key: "value", title: "Order Value", kind: "currency", letter: "J" },
];
const stockNames = [
  ["LUB-CL-AE", "Chain lube aerosol, 11 oz"],
  ["ELC-FCC-10", "Fuse class CC, 10 A"],
  ["CHN-SP40-18", "Sprocket 40B, 18 teeth"],
  ["FST-HB-M8X40-ZN", "Hex bolt M8 × 40, zinc plated"],
  ["FST-SC-M6X20", "Socket cap screw M6 × 20, black oxide"],
  ["BRG-6206-2RS", "Ball bearing 6206, sealed"],
  ["BRG-6206-2RS", "Ball bearing 6206, sealed"],
  ["BLT-TB8M-800", "Timing belt 8M-800, 20 mm"],
  ["ELC-MCB3P-32", "Miniature breaker 3P, 32 A"],
  ["FLT-AP-2020-M13", "Panel air filter 20×20 in, MERV 13"],
];
function seedRows(stock: boolean): SheetRow[] {
  const seeded = Array.from({ length: stock ? 285 : 60 }, (_, i): SheetRow =>
    stock
      ? {
          id: i + 1,
          sku: stockNames[i % 10][0],
          item: stockNames[i % 10][1],
          buyer: [
            "Leo Grant",
            "Nora Vale",
            "Mira Stone",
            "Leo Grant",
            "Leo Grant",
            "Mira Stone",
            "Mira Stone",
            "Mira Stone",
            "Nora Vale",
            "Sana Qureshi",
          ][i % 10],
          warehouse: [
            "Columbus",
            "Joliet",
            "Columbus",
            "Columbus",
            "Dallas",
            "Joliet",
            "Dallas",
            "Joliet",
            "Savannah",
            "Reno",
          ][i % 10],
          status:
            i % 11 === 7
              ? "Hold"
              : i % 11 === 10
                ? "Ordered"
                : i > 12 && i % 4 === 0
                  ? "Review"
                  : "Covered",
          onhand: [52, 156, 53, 2469, 2559, 84, 120, 95, 57, 76][i % 10],
          reorder: 100,
          quantity: i < 10 ? 0 : 25 + (i % 20),
          cost: 12.5 + (i % 20),
          value: i < 10 ? 0 : (25 + (i % 20)) * (12.5 + (i % 20)),
        }
      : {
          id: i + 1,
          task:
            taskTitles[i % taskTitles.length] +
            (i >= taskTitles.length ? ` · Phase ${Math.floor(i / taskTitles.length) + 1}` : ""),
          status: taskStatuses[i % 13],
          assignee: taskOwners[i % 13],
          due:
            i % 22 === 7
              ? ""
              : `2026-09-${String([8, 15, 17, 11, 18, 19, 16, 0, 22, 23, 20, 24, 25, 9, 16, 22, 17, 18, 11, 19, 24, 9][i % 22]).padStart(2, "0")}`,
          priority: [
            "Critical",
            "Critical",
            "High",
            "Critical",
            "High",
            "Normal",
            "High",
            "Low",
            "Normal",
            "Critical",
            "High",
            "Normal",
            "Critical",
          ][i % 13],
          points: [2, 8, 5, 13, 3, 3, 5, 2, 8, 8, 5, 3, 2][i % 13],
        },
  );
  if (!stock) {
    const shipped = [0, 13, 18, 21, 30, 38, 46, 55],
      blocked = [3, 24, 41, 53];
    seeded.forEach((r, i) => {
      if (shipped.includes(i)) r.status = "Shipped";
      else if (blocked.includes(i)) r.status = "Blocked";
      else if (r.status === "Shipped" || r.status === "Blocked") r.status = "Ready";
    });
    const tail = seeded.filter((r, i) => i >= 22 && r.status !== "Shipped");
    let remaining =
      218 -
      seeded
        .filter((r, i) => i < 22 && r.status !== "Shipped")
        .reduce((a, r) => a + Number(r.points), 0);
    tail.forEach((r, i) => {
      r.points = Math.max(1, Math.floor(remaining / (tail.length - i)));
      remaining -= Number(r.points);
    });
  } else {
    seeded.forEach((r, i) => {
      if (i >= 10) r.onhand = i < 73 ? 20 + (i % 70) : 200 + (i % 500);
      if (i >= 10 && i < 42) r.status = "Review";
      else if (i >= 42 && i < 74) {
        r.status = "Approved";
        r.quantity = 50;
        r.cost = 18.625;
      } else if (i >= 10 && r.status === "Review") r.status = "Covered";
      r.value = Number(r.quantity) * Number(r.cost);
    });
  }
  return seeded;
}

type HistoryEntry = {
  before: SheetRow[];
  after: SheetRow[];
  details?: DataGridCellsChangeDetails<SheetRow>;
};
export default function SpreadsheetGrid({ block }: BlockProps) {
  const stock = block.id === "data-grid-editing-6";
  const [rows, setRows] = useState(() => seedRows(stock)),
    [history, setHistory] = useState<HistoryEntry[]>([]),
    [future, setFuture] = useState<HistoryEntry[]>([]),
    [fields, setFields] = useState(stock ? stockFields : taskFields),
    [search, setSearch] = useState(""),
    [rules, setRules] = useState<FilterRule[]>([firstRule("task")]),
    [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]),
    [visibility, setVisibility] = useState<ColumnVisibilityState>(
      stock ? { reorder: false, quantity: false, cost: false } : {},
    ),
    [sorting, setSorting] = useState<SortingState>([]),
    [rowSelection, setRowSelection] = useState<RowSelectionState>({}),
    [filterOpen, setFilterOpen] = useState(false),
    [loaded, setLoaded] = useState(25),
    [loading, setLoading] = useState(false),
    [snapshot, setSnapshot] = useState<DataGridCellSelectionSnapshot | null>(null),
    [editing, setEditing] = useState<{
      request: DataGridCellEditRequest<SheetRow>;
      value: string;
    } | null>(null),
    [detail, setDetail] = useState<SheetRow | null>(null),
    [compact, setCompact] = useState(false),
    [gridLines, setGridLines] = useState(true),
    [newField, setNewField] = useState(""),
    [fieldKind, setFieldKind] = useState("Text");
  const api = useRef<DataGridCellSelectionApi | null>(null),
    pending = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function applyBatch(current: SheetRow[], details: DataGridCellsChangeDetails<SheetRow>) {
    return current.map((row) => {
      const changes = details.changes.filter((c) => c.rowId === String(row.id));
      if (!changes.length) return row;
      const next = { ...row };
      for (const c of changes) next[c.columnId] = c.value as string | number | boolean;
      if (stock) next.value = Number(next.quantity) * Number(next.cost);
      return next;
    });
  }
  function commit(next: SheetRow[], details?: DataGridCellsChangeDetails<SheetRow>) {
    setHistory((v) => [...v.slice(-49), { before: rows, after: next, details }]);
    setFuture([]);
    setRows(next);
  }
  function onCellsChange(details: DataGridCellsChangeDetails<SheetRow>) {
    if (details.rejected.length)
      toast.error(
        `${details.rejected.length} cell values rejected. Check allowed choices, non-negative numbers and YYYY-MM-DD dates.`,
      );
    if (details.changes.length) commit(applyBatch(rows, details), details);
  }
  function undo() {
    const entry = history.at(-1);
    if (!entry) return;
    setRows((current) =>
      entry.details ? applyBatch(current, invertDataGridCellsChange(entry.details!)) : entry.before,
    );
    setHistory((v) => v.slice(0, -1));
    setFuture((v) => [entry, ...v]);
    setEditing(null);
  }
  function redo() {
    const entry = future[0];
    if (!entry) return;
    setRows((current) => (entry.details ? applyBatch(current, entry.details!) : entry.after));
    setFuture((v) => v.slice(1));
    setHistory((v) => [...v, entry]);
    setEditing(null);
  }
  function parse(raw: string, field: Field): string | number | undefined {
    if (field.key === "value") return undefined;
    if (field.kind === "number" || field.kind === "currency") {
      if (
        !raw.trim() ||
        !Number.isFinite(+raw) ||
        +raw < 0 ||
        (field.kind === "number" && !Number.isInteger(+raw))
      )
        return undefined;
      return +raw;
    }
    if (field.kind === "date" && raw && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
    if (field.options && !field.options.includes(raw)) return undefined;
    return raw;
  }
  function writeValue(row: SheetRow, key: string, value: string) {
    const field = fields.find((f) => f.key === key);
    if (!field) return;
    const parsed = parse(value, field);
    if (parsed === undefined) {
      toast.error("Invalid cell value");
      return;
    }
    onCellsChange({
      source: "edit",
      changes: [
        {
          rowId: String(row.id),
          columnId: key,
          row,
          previousValue: row[key],
          value: parsed,
        },
      ],
      rejected: [],
    });
    setEditing(null);
    requestAnimationFrame(() => api.current?.focusCell(String(row.id), key));
  }
  function requestEdit(request: DataGridCellEditRequest<SheetRow>) {
    setEditing({
      request,
      value: request.initialText ?? String(request.previousValue ?? ""),
    });
  }
  function fillDown() {
    const grid = getDataGridActiveRegionGrid(table);
    if (!grid?.length) return;
    const result = buildDataGridPasteDetails(table, [grid[0]]);
    if (result) onCellsChange({ ...result.details, source: "fill" });
  }
  function addRow() {
    const id = Math.max(...rows.map((r) => r.id)) + 1;
    const row: SheetRow = {
      ...seedRows(stock)[0],
      id,
      ...(stock
        ? { sku: `NEW-${id}`, item: "New stock line", quantity: 0, value: 0 }
        : {
            task: "New task",
            status: "Backlog",
            assignee: "",
            due: "",
            points: 1,
          }),
    };
    commit([row, ...rows]);
    setSearch("");
    setRules([firstRule("task")]);
    setColumnFilters([]);
    requestAnimationFrame(() =>
      api.current?.focusCell(String(id), stock ? "sku" : "task", {
        edit: true,
      }),
    );
  }
  function renderValue(row: SheetRow, field: Field) {
    const value = String(row[field.key] ?? "");
    const active =
      editing?.request.rowId === String(row.id) && editing.request.columnId === field.key;
    if (active && editing) {
      if (field.options)
        return (
          <Select
            open
            value={editing.value}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
            onValueChange={(value) => writeValue(row, field.key, value)}
          >
            <SelectTrigger className="h-7 text-xs" aria-label={`Edit ${field.title}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      if (field.kind === "number" || field.kind === "currency")
        return (
          <NumberField
            value={editing.value === "" ? null : Number(editing.value)}
            onValueChange={(value) =>
              setEditing({
                ...editing,
                value: value === null ? "" : String(value),
              })
            }
            className="w-28"
          >
            <NumberFieldGroup>
              <NumberFieldInput
                autoFocus
                aria-label={`Edit ${field.title}`}
                onBlur={() => writeValue(row, field.key, editing.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    writeValue(row, field.key, editing.value);
                  }
                  if (e.key === "Escape") setEditing(null);
                }}
              />
            </NumberFieldGroup>
          </NumberField>
        );
      return (
        <Input
          autoFocus
          aria-label={`Edit ${field.title}`}
          className="h-7 text-sm"
          type={field.kind === "date" ? "date" : "text"}
          value={editing.value}
          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
          onBlur={() => writeValue(row, field.key, editing.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              writeValue(row, field.key, editing.value);
            }
            if (e.key === "Escape") setEditing(null);
          }}
        />
      );
    }
    if (field.kind === "status")
      return field.key === "priority" ? (
        <span className="flex items-center gap-2">
          <Flag
            className={cn(
              "size-3.5",
              value === "Critical"
                ? "text-rose-500"
                : value === "High"
                  ? "text-amber-500"
                  : value === "Normal"
                    ? "text-violet-500"
                    : "text-muted-foreground",
            )}
          />
          {value}
        </span>
      ) : (
        <StructureBadge value={value} dot={field.key === "status"} />
      );
    if (field.kind === "person")
      return value ? (
        <div className="flex flex-wrap gap-1">
          {value.split(", ").map((name) =>
            stock ? (
              <StructurePerson key={name} name={name} />
            ) : (
              <span
                key={name}
                className="flex items-center gap-1 rounded border px-1 py-0.5 text-xs"
              >
                <span className="flex size-3.5 items-center justify-center rounded-full bg-muted text-[8px]">
                  {name[0]}
                </span>
                {name}
                <button
                  aria-label={`Remove ${name} from task ${row.id}`}
                  onClick={() =>
                    writeValue(
                      row,
                      field.key,
                      value
                        .split(", ")
                        .filter((n) => n !== name)
                        .join(", "),
                    )
                  }
                >
                  <X className="size-2.5 text-muted-foreground" />
                </button>
              </span>
            ),
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Unassigned</span>
      );
    if (field.kind === "date")
      return (
        <span className={value === "2026-09-11" ? "text-rose-500" : ""}>
          {value
            ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "No date"}
        </span>
      );
    if (field.kind === "currency")
      return (
        <span className="tabular-nums">
          {Number(value).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </span>
      );
    if (field.key === "task")
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            className="rounded-full"
            aria-label={`Complete ${value}`}
            checked={row.status === "Shipped"}
            onCheckedChange={(v) => writeValue(row, "status", v ? "Shipped" : "Ready")}
          />
          <span
            className={cn(
              "truncate",
              row.status === "Shipped" && "text-muted-foreground line-through",
            )}
          >
            {value}
          </span>
        </div>
      );
    return (
      <span className="truncate tabular-nums">
        {value}
        {field.key === "points" && <span className="text-xs text-muted-foreground">pt</span>}
      </span>
    );
  }
  const columns = useMemo<ColumnDef<DataGridFeatures, SheetRow>[]>(
    () => [
      ...(stock
        ? ([
            {
              id: "select",
              header: ({ table }) => (
                <Checkbox
                  aria-label="Select all filtered stock lines"
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
              enableCellSelection: false,
              enableSorting: false,
              cell: ({ row }) => (
                <Checkbox
                  aria-label={`Select stock line ${row.original.id}`}
                  checked={row.getIsSelected()}
                  onCheckedChange={(v) => row.toggleSelected(!!v)}
                />
              ),
            },
            {
              id: "index",
              header: "",
              size: 44,
              enableCellSelection: false,
              enableSorting: false,
              cell: ({ row }) => row.index + 1,
            },
          ] as ColumnDef<DataGridFeatures, SheetRow>[])
        : []),
      ...fields.map((field): ColumnDef<DataGridFeatures, SheetRow> => ({
        id: field.key,
        accessorFn: (row) => row[field.key],
        size: stock
          ? ((
              {
                sku: 165,
                item: 235,
                buyer: 150,
                warehouse: 155,
                status: 110,
                onhand: 140,
                value: 135,
              } as Record<string, number>
            )[field.key] ?? 145)
          : ((
              {
                task: 426,
                status: 140,
                assignee: 270,
                due: 122,
                priority: 125,
                points: 110,
              } as Record<string, number>
            )[field.key] ?? 145),
        minSize: 80,
        header: ({ column }) => (
          <div className="space-y-1 py-1">
            <div className="flex items-center gap-1">
              {stock && <span className="rounded bg-muted px-1 text-xs">{field.letter}</span>}
              <DataGridColumnHeader column={column} title={field.title} />
            </div>
            {stock && filterOpen && (
              <Input
                aria-label={`Filter ${field.title}`}
                className="h-7 text-xs"
                placeholder={`Filter ${field.title.toLowerCase()}...`}
                value={String(column.getFilterValue() ?? "")}
                onChange={(e) => column.setFilterValue(e.target.value)}
              />
            )}
          </div>
        ),
        filterFn: (row, id, value) =>
          String(row.getValue(id) ?? "")
            .toLowerCase()
            .includes(String(value).toLowerCase()),
        meta: {
          headerTitle: field.title,
          cellClassName: field.kind === "number" || field.kind === "currency" ? "tabular-nums" : "",
          cellEdit: {
            editable: field.key !== "value",
            parse: (raw) => parse(raw, field),
            format: (value) => String(value ?? ""),
            clearValue: field.kind === "number" || field.kind === "currency" ? 0 : "",
            ...(field.kind === "text" ? { control: "text" as const } : {}),
          },
        },
        cell: ({ row }) => (
          <ContextMenu.Root>
            <ContextMenu.Trigger asChild>
              <div className="flex min-h-7 items-center">{renderValue(row.original, field)}</div>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
              <ContextMenu.Content className="z-50 min-w-44 rounded-lg border bg-popover p-1 text-sm shadow-md">
                {[
                  {
                    title: "Edit cell",
                    action: () => api.current?.focusCell(row.id, field.key, { edit: true }),
                  },
                  { title: "Fill range down", action: fillDown },
                  {
                    title: "Open details",
                    action: () => setDetail(row.original),
                  },
                  {
                    title: "Duplicate row",
                    action: () =>
                      commit([
                        ...rows,
                        {
                          ...row.original,
                          id: Math.max(...rows.map((r) => r.id)) + 1,
                        },
                      ]),
                  },
                  {
                    title: "Delete row",
                    action: () => commit(rows.filter((r) => r.id !== row.original.id)),
                  },
                ].map((item) => (
                  <ContextMenu.Item
                    key={item.title}
                    className="cursor-default rounded px-2 py-1.5 outline-none focus:bg-accent"
                    onSelect={item.action}
                  >
                    {item.title}
                  </ContextMenu.Item>
                ))}
              </ContextMenu.Content>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        ),
      })),
    ],
    [stock, fields, filterOpen, editing, rows],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId: (r) => String(r.id),
    manualPagination: stock,
    state: {
      pagination: { pageIndex: 0, pageSize: loaded },
      columnVisibility: visibility,
      columnFilters,
      sorting,
      rowSelection,
      globalFilter: JSON.stringify([search, rules]),
    },
    onColumnVisibilityChange: setVisibility,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row) =>
      Object.values(row.original).join(" ").toLowerCase().includes(search.toLowerCase()) &&
      (stock || matchesRules(row.original, rules)),
  });
  const filtered = table.getFilteredRowModel().rows.map((r) => r.original),
    selected = table.getSelectedRowModel().rows.map((r) => r.original),
    visibleFields = fields.filter((f) => table.getColumn(f.key)?.getIsVisible()),
    bound = snapshot?.activeBound;
  function fetchMore() {
    if (stock || pending.current || loaded >= filtered.length) return;
    pending.current = true;
    setLoading(true);
    timer.current = setTimeout(() => {
      setLoaded((v) => Math.min(filtered.length, v + 25));
      pending.current = false;
      setLoading(false);
    }, 150);
  }
  function setCheckedStatus(value: string) {
    if (value === "Set status") return;
    onCellsChange({
      source: "edit",
      changes: selected.map((row) => ({
        rowId: String(row.id),
        columnId: "status",
        row,
        previousValue: row.status,
        value,
      })),
      rejected: [],
    });
  }
  function exportTsv() {
    const source = selected.length ? selected : filtered;
    const text = [
      visibleFields.map((f) => f.title).join("\t"),
      ...source.map((r) =>
        visibleFields.map((f) => String(r[f.key] ?? "").replace(/[\t\n]/g, " ")).join("\t"),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/tab-separated-values" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "reorder-plan.tsv";
    link.click();
    URL.revokeObjectURL(url);
  }
  function keyboard(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey)) return;
    if (event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? redo() : undo();
    }
    if (event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
    }
  }
  const footer = stock ? (
    <DataGridTableFootRow>
      {table.getVisibleLeafColumns().map((column) => {
        const field = fields.find((f) => f.key === column.id);
        return (
          <DataGridTableFootRowCell key={column.id} className="text-right text-xs">
            {field?.key === "sku" ? (
              `${filtered.length} lines`
            ) : field && (field.kind === "number" || field.kind === "currency") ? (
              <>
                <span className="mr-1 text-muted-foreground">Sum</span>
                {field.kind === "currency"
                  ? filtered
                      .reduce((a, r) => a + Number(r[field.key] || 0), 0)
                      .toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      })
                  : filtered.reduce((a, r) => a + Number(r[field.key] || 0), 0).toLocaleString()}
              </>
            ) : null}
          </DataGridTableFootRowCell>
        );
      })}
    </DataGridTableFootRow>
  ) : undefined;
  return (
    <div onKeyDownCapture={keyboard} data-structure-sheet className="min-w-0">
      <StructureFrame
        title={stock ? "Reorder Plan" : "Launch Runbook"}
        subtitle={
          stock ? (
            <>
              <span className="text-rose-500">
                {rows.filter((r) => +r.onhand < +r.reorder).length} below reorder point
              </span>{" "}
              · {rows.filter((r) => r.status === "Review").length} to review · $
              {(
                rows
                  .filter((r) => r.status === "Approved")
                  .reduce((a, r) => a + Number(r.value), 0) / 1000
              ).toFixed(1)}
              K approved to order
            </>
          ) : (
            <>
              {rows.filter((r) => r.status === "Shipped").length} of {rows.length} done ·{" "}
              {rows.filter((r) => r.status !== "Shipped").reduce((a, r) => a + Number(r.points), 0)}{" "}
              points open ·{" "}
              <span className="text-rose-500">
                {rows.filter((r) => r.status === "Blocked").length} blocked
              </span>{" "}
              · 11 days to launch
            </>
          )
        }
        actions={
          stock ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                commit(seedRows(true));
                setVisibility({ reorder: false, quantity: false, cost: false });
                setColumnFilters([]);
                setSearch("");
              }}
            >
              <RotateCcw />
              Reset View
            </Button>
          ) : (
            <Button size="sm" onClick={addRow}>
              <Plus />
              New Task
            </Button>
          )
        }
      >
        <StructureToolbar>
          {stock ? (
            <StructureSearch
              value={search}
              onChange={setSearch}
              placeholder="Search SKU, item or buyer"
            />
          ) : (
            <FilterBar
              className="flex-1 p-0"
              clearLabel=""
              rules={rules}
              onChange={setRules}
              fields={fields.map((f) => ({
                key: f.key,
                label: f.title,
                type:
                  f.kind === "number" || f.kind === "currency"
                    ? "number"
                    : f.kind === "date"
                      ? "date"
                      : f.options
                        ? "select"
                        : "text",
                options: f.options,
              }))}
            />
          )}
          <div className="ml-auto flex flex-wrap items-center gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={!history.length}
              aria-label="Undo last edit"
              onClick={undo}
            >
              <Undo2 />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={!future.length}
              aria-label="Redo last edit"
              onClick={redo}
            >
              <Redo2 />
            </Button>
            {stock && (
              <Button
                size="sm"
                variant="outline"
                aria-pressed={filterOpen}
                onClick={() => setFilterOpen((v) => !v)}
              >
                <Filter />
                Filters
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline">
                  <Columns3 />
                  Columns {visibleFields.length}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end">
                {fields.map((f) => (
                  <label key={f.key} className="flex items-center justify-between gap-3 text-xs">
                    {f.title}
                    <Checkbox
                      aria-label={`Show ${f.title} column`}
                      checked={table.getColumn(f.key)?.getIsVisible()}
                      onCheckedChange={(v) => table.getColumn(f.key)?.toggleVisibility(!!v)}
                    />
                  </label>
                ))}
                {!stock && (
                  <div className="space-y-2 border-t pt-2">
                    <Input
                      aria-label="New column name"
                      placeholder="New column name"
                      value={newField}
                      onChange={(e) => setNewField(e.target.value)}
                    />
                    <StructureSelect
                      label="New column type"
                      value={fieldKind}
                      onChange={setFieldKind}
                      options={["Text", "Number", "Date"]}
                    />
                    <Button
                      size="sm"
                      disabled={!newField.trim()}
                      onClick={() => {
                        setFields((f) => [
                          ...f,
                          {
                            key: `custom_${f.length}`,
                            title: newField.trim(),
                            kind: fieldKind.toLowerCase() as Field["kind"],
                          },
                        ]);
                        setNewField("");
                      }}
                    >
                      <Plus />
                      Add column
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings2 />
                  Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end">
                <label className="flex items-center justify-between text-xs">
                  Compact rows
                  <Checkbox checked={compact} onCheckedChange={(v) => setCompact(!!v)} />
                </label>
                <label className="flex items-center justify-between text-xs">
                  Cell borders
                  <Checkbox checked={gridLines} onCheckedChange={(v) => setGridLines(!!v)} />
                </label>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={!bound || bound.minRowIndex === bound.maxRowIndex}
                  onClick={fillDown}
                >
                  Fill selected range down
                </Button>
              </PopoverContent>
            </Popover>
            {stock && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon-sm" variant="outline" aria-label="Export reorder plan">
                    <Download />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-44">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      downloadCsv("Reorder plan", selected.length ? selected : filtered)
                    }
                  >
                    Export CSV
                  </Button>
                  <Button variant="ghost" size="sm" onClick={exportTsv}>
                    Export TSV
                  </Button>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </StructureToolbar>
        {stock && selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b bg-muted/30 px-3 py-2 text-xs">
            <span>{selected.length} selected</span>
            <StructureSelect
              label="Bulk stock status"
              value="Set status"
              options={["Set status", "Covered", "Review", "Approved", "Ordered", "Hold"]}
              onChange={setCheckedStatus}
            />
            <Button size="xs" variant="ghost" onClick={() => table.resetRowSelection()}>
              Clear
            </Button>
          </div>
        )}
        <StructureGrid
          table={table}
          mode="virtual"
          height={550}
          recordCount={filtered.length}
          hasMore={!stock && loaded < filtered.length}
          onFetchMore={stock ? undefined : fetchMore}
          isFetchingMore={loading}
          footerContent={footer}
          cellApi={api}
          gridProps={{
            onCellsChange,
            onCellEditRequest: requestEdit,
            onCellSelectionChange: setSnapshot,
            onRowCreate: addRow,
            tableLayout: {
              cellSelection: true,
              cellFillHandle: true,
              cellFillHandleVariant: "square",
              cellEditMode: "dblclick",
              cellBorder: gridLines,
              columnsResizable: true,
              columnsVisibility: true,
              headerSticky: true,
              dense: compact,
            },
            tableClassNames: { bodyRow: compact ? "h-8" : "h-10" },
          }}
        />
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
          <span>
            {stock
              ? snapshot?.visibleCellCount
                ? `${snapshot.visibleCellCount} cells selected · Double-click or Enter to edit`
                : "Select a cell to inspect it"
              : `${table.getRowModel().rows.length} of ${filtered.length} tasks`}
          </span>
          <span>
            {stock ? "Shift-click for a range · ⌘/Ctrl Z to undo" : "1 overdue · 27 due this week"}
          </span>
        </footer>
      </StructureFrame>
      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {detail ? String(detail[stock ? "item" : "task"]) : "Row details"}
            </SheetTitle>
            <SheetDescription>Edit this record in the spreadsheet.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 p-4">
            {detail &&
              fields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground">{f.title}</label>
                  <p className="mt-1 text-sm">{String(detail[f.key] ?? "—")}</p>
                </div>
              ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
