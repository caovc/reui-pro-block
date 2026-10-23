import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/reui/number-field";
import {
  Frame,
  Facet,
  Toolbar,
  SearchBox,
  Chip,
  Identity,
  Meter,
  Export,
} from "./grid-base-common";
import {
  useGridTable,
  selectionColumn,
  NativeGrid,
  NativeTable,
  NativePager,
  NativeColumns,
  type GridColumn,
} from "./grid-base-engine";
import DispatchGrid from "./grid-dispatch";
import InventoryGrid from "./grid-inventory";
import TreasuryGrid from "./grid-treasury";
import { companies, people } from "./data-utils";
import { toast } from "sonner";
type GenericRecord = {
  id: number;
  name: string;
  detail: string;
  status: string;
  owner: string;
  amount: number;
  progress: number;
  date: string;
  group: string;
};
function config(title: string) {
  if (
    /Customer|Balance|Transaction|Payments|Cash Flow|Invoice|Revenue|P&L|Pro Forma|Billing|Ledger|Subscription|Spend/i.test(
      title,
    )
  )
    return {
      entity: "customer",
      name: "Customer",
      amount: "Balance",
      statuses: ["Paid", "Pending", "Overdue"],
      groups: ["North America", "Europe", "Asia Pacific"],
    };
  if (/Inventory|Stock|Product|Materials/i.test(title))
    return {
      entity: "product",
      name: "Product",
      amount: "Unit price",
      statuses: ["In stock", "Low stock", "Out of stock"],
      groups: ["Electronics", "Accessories", "Home & Living"],
    };
  if (
    /Contact|Team|Member|Patient|Permission|Access|Hierarchy|Invitation/i.test(
      title,
    )
  )
    return {
      entity: "person",
      name: "Member",
      amount: "Activity",
      statuses: ["Active", "Invited", "Inactive"],
      groups: ["Engineering", "Design", "Marketing"],
    };
  if (/Campaign|Lead|Deal|Renewal|Pipeline/i.test(title))
    return {
      entity: "company",
      name: /Campaign/.test(title) ? "Campaign" : "Company",
      amount: /Campaign/.test(title) ? "Spend" : "Deal value",
      statuses: ["Active", "In review", "Paused"],
      groups: ["Enterprise", "Growth", "Startup"],
    };
  if (/Cloud|Service|SLO|Routing|Automation/i.test(title))
    return {
      entity: "service",
      name: "Service",
      amount: "Monthly cost",
      statuses: ["Healthy", "Degraded", "Critical"],
      groups: ["Production", "Staging", "Development"],
    };
  return {
    entity: "task",
    name: /Course/.test(title)
      ? "Course"
      : /Folder/.test(title)
        ? "Folder"
        : "Task",
    amount: /Time/.test(title) ? "Hours" : "Estimate",
    statuses: ["In progress", "In review", "Complete"],
    groups: ["Backlog", "In progress", "Complete"],
  };
}
const products = [
  "Wireless Headphones",
  "Mechanical Keyboard",
  "Studio Display",
  "USB-C Hub",
  "Ergonomic Chair",
  "Desk Lamp",
  "Laptop Stand",
  "Travel Backpack",
  "Smart Watch",
  "Webcam Pro",
  "Portable SSD",
  "Charging Dock",
];
const tasks = [
  "Design system refresh",
  "Implement authentication",
  "Update API documentation",
  "Improve onboarding flow",
  "Accessibility audit",
  "Performance optimization",
  "Review release checklist",
  "Set up monitoring",
  "Database migration",
  "Mobile navigation",
  "Customer feedback review",
  "Security assessment",
];
function initialRows(title: string, count: number) {
  const c = config(title);
  return Array.from({ length: count }, (_, i): GenericRecord => ({
    id: i + 1,
    name:
      c.entity === "person"
        ? people[i % 12]
        : c.entity === "product"
          ? products[i % 12]
          : c.entity === "company" || c.entity === "customer"
            ? companies[i % 12]
            : c.entity === "service"
              ? [
                  "api-gateway",
                  "auth-service",
                  "billing-worker",
                  "event-stream",
                  "cdn-edge",
                  "postgres-main",
                ][i % 6]
              : tasks[i % 12],
    detail:
      c.entity === "person"
        ? `${people[i % 12].split(" ")[0].toLowerCase()}@acme.com`
        : `${c.entity === "product" ? "SKU" : "ID"}-${String(1000 + i).padStart(4, "0")}`,
    status: c.statuses[i % 3],
    owner: people[(i + 2) % 12],
    amount: [
      12450, 8920, 24500, 3280, 15680, 6750, 4210, 18900, 11200, 7480, 5200,
      2240,
    ][i % 12],
    progress: [72, 45, 91, 34, 68, 83, 56, 92, 41, 64, 78, 23][i % 12],
    date: `Oct ${String(12 + (i % 18))}, 2026`,
    group: c.groups[i % 3],
  }));
}
/** Shared solution fallback. Pro Grid routes use their dedicated compositions. */
function GenericGridBlock({ block }: BlockProps) {
  const cfg = config(block.name);
  const [rows, setRows] = useState(() => initialRows(block.name, 24));
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [editRow, setEditRow] = useState<GenericRecord | null>(null);
  const fields = useMemo<GridColumn<GenericRecord>[]>(
    () => [
      selectionColumn<GenericRecord>(),
      {
        id: "name",
        title: cfg.name,
        value: (r) => r.name,
        width: 300,
        cell: (r) => (
          <div>
            <button
              className="font-medium hover:underline"
              onClick={() => setEditRow(r)}
            >
              {r.name}
            </button>
            <div className="text-xs text-muted-foreground">{r.detail}</div>
          </div>
        ),
      },
      {
        id: "status",
        title: "Status",
        value: (r) => r.status,
        cell: (r) => <Chip>{r.status}</Chip>,
      },
      {
        id: "owner",
        title: "Owner",
        value: (r) => r.owner,
        cell: (r) => <Identity name={r.owner} />,
      },
      {
        id: "amount",
        title: cfg.amount,
        value: (r) => r.amount,
        align: "right",
        cell: (r) => (
          <span className="tabular-nums">
            {cfg.entity === "task"
              ? `${Math.round(r.amount / 1000)} hrs`
              : r.amount.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
          </span>
        ),
      },
      {
        id: "progress",
        title: "Progress",
        value: (r) => r.progress,
        cell: (r) => <Meter value={r.progress} />,
      },
      {
        id: "date",
        title: "Updated",
        value: (r) => r.date,
        cell: (r) => r.date,
      },
      {
        id: "_actions",
        width: 42,
        cell: (r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${r.name}`}
              >
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setEditRow(r)}>
                  <Pencil />
                  Edit record
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setRows((current) => current.filter((v) => v.id !== r.id));
                    toast.success("Record deleted");
                  }}
                >
                  <Trash2 />
                  Delete record
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [cfg.name, cfg.amount, cfg.entity],
  );
  const match = useCallback(
    (r: GenericRecord) =>
      `${r.name} ${r.detail} ${r.owner} ${r.group}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!statuses.length || statuses.includes(r.status)),
    [search, statuses],
  );
  const table = useGridTable({
    data: rows,
    fields,
    filter: match,
    pageSize: 7,
  });
  const selected = table.getSelectedRowModel().rows;
  function create() {
    setEditRow({
      ...initialRows(block.name, 1)[0],
      id: Math.max(0, ...rows.map((r) => r.id)) + 1,
      name: "",
      detail: "New record",
      amount: 0,
    });
  }
  function save() {
    if (!editRow?.name.trim()) return;
    setRows((current) =>
      current.some((r) => r.id === editRow.id)
        ? current.map((r) => (r.id === editRow.id ? editRow : r))
        : [editRow, ...current],
    );
    setEditRow(null);
    toast.success("Record saved");
  }
  return (
    <NativeGrid table={table}>
      <Frame
        title={block.name}
        description={`${rows.length} records · Manage and track your ${cfg.entity === "person" ? "team" : cfg.entity + "s"} in one place.`}
        action={
          <>
            <Export
              rows={table.getFilteredRowModel().rows.map((r) => r.original)}
              name={block.name}
            />
            <Button size="sm" onClick={create}>
              Add {cfg.entity}
            </Button>
          </>
        }
      >
        <Toolbar>
          <SearchBox
            value={search}
            onChange={(value) => {
              setSearch(value);
              table.setPageIndex(0);
            }}
            placeholder={`Search ${cfg.entity}s...`}
          />
          <Facet
            label="Status"
            options={cfg.statuses}
            value={statuses}
            onChange={(value) => {
              setStatuses(value);
              table.setPageIndex(0);
            }}
          />
          <div className="flex-1" />
          <NativeColumns table={table} />
        </Toolbar>
        {selected.length > 0 && (
          <div className="flex items-center gap-3 border-b px-3 py-2 text-xs">
            <span>{selected.length} selected</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const ids = new Set(selected.map((r) => r.original.id));
                setRows((current) => current.filter((r) => !ids.has(r.id)));
                table.resetRowSelection();
              }}
            >
              <Trash2 />
              Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => table.resetRowSelection()}
            >
              Clear selection
            </Button>
          </div>
        )}
        <NativeTable />
        <NativePager />
        <Dialog
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editRow && rows.some((r) => r.id === editRow.id)
                  ? "Edit record"
                  : "Add record"}
              </DialogTitle>
              <DialogDescription>
                Update the record details. Changes are saved in this preview.
              </DialogDescription>
            </DialogHeader>
            {editRow && (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="record-name">{cfg.name}</FieldLabel>
                  <Input
                    id="record-name"
                    value={editRow.name}
                    onChange={(e) =>
                      setEditRow({ ...editRow, name: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="record-detail">
                    Reference / email
                  </FieldLabel>
                  <Input
                    id="record-detail"
                    value={editRow.detail}
                    onChange={(e) =>
                      setEditRow({ ...editRow, detail: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="record-value">{cfg.amount}</FieldLabel>
                  <NumberField
                    id="record-value"
                    value={editRow.amount}
                    onValueChange={(value) =>
                      setEditRow({ ...editRow, amount: value ?? 0 })
                    }
                  >
                    <NumberFieldGroup>
                      <NumberFieldInput />
                    </NumberFieldGroup>
                  </NumberField>
                </Field>
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <div className="flex gap-2">
                    {cfg.statuses.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={
                          editRow.status === status ? "default" : "outline"
                        }
                        onClick={() => setEditRow({ ...editRow, status })}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </Field>
              </FieldGroup>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRow(null)}>
                Cancel
              </Button>
              <Button disabled={!editRow?.name.trim()} onClick={save}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Frame>
    </NativeGrid>
  );
}
export default function GridBlock({ block }: BlockProps) {
  if (block.id === "data-grid-drag-drop-3") return <DispatchGrid />;
  if (block.id === "data-grid-editing-2") return <InventoryGrid />;
  if (block.id === "data-grid-expansion-2") return <TreasuryGrid />;
  return <GenericGridBlock block={block} />;
}
