import { useMemo, useState } from "react";
import { Check, Copy, Pencil, Plus, Tag, Trash2, TriangleAlert, X } from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerTrigger,
} from "@/components/reui/color-picker";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTable, type ColumnDef, type ColumnFiltersState } from "@tanstack/react-table";
import { dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnFilter } from "@/components/reui/data-grid/data-grid-column-filter";
import { DataGridTableDndRowHandle } from "@/components/reui/data-grid/data-grid-table-dnd-rows";
import { StructureGrid } from "./grid-structure-model";
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
import { toast } from "sonner";
import {
  SavedState,
  StructureBadge,
  StructureFrame,
  StructureMenu,
  StructureMeter,
  StructureSearch,
  StructureSelect,
  StructureToolbar,
} from "./grid-structure-ui";
import SpreadsheetGrid from "./grid-editing-spreadsheet";

const labelColors = [
  "#8b5cf6",
  "#f97316",
  "#f43f5e",
  "#14b8a6",
  "#0ea5e9",
  "#22c55e",
  "#ec4899",
  "#6366f1",
  "#eab308",
  "#64748b",
  "#a855f7",
  "#ef4444",
];
const initialLabels = [
  "Customer impact",
  "Engineering",
  "Release risk",
  "Growth",
  "Documentation",
  "Support",
  "UX polish",
  "Operations",
].map((name, i) => ({ id: i + 1, name, color: labelColors[i] }));
function LabelManager() {
  const [rows, setRows] = useState(initialLabels);
  const [form, setForm] = useState<{
    id: number;
    name: string;
    color: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  function save() {
    if (!form) return;
    if (!form.name.trim()) {
      setError("Enter a label name.");
      return;
    }
    if (!/^#[0-9a-f]{6}$/i.test(form.color)) {
      setError("Use a valid 6-digit hex color.");
      return;
    }
    if (
      rows.some((r) => r.id !== form.id && r.name.toLowerCase() === form.name.trim().toLowerCase())
    ) {
      setError("A label with this name already exists.");
      return;
    }
    setRows((v) =>
      v.some((r) => r.id === form.id)
        ? v.map((r) => (r.id === form.id ? { ...form, name: form.name.trim() } : r))
        : [...v, { ...form, name: form.name.trim() }],
    );
    setForm(null);
    setError("");
  }
  function move(id: number, target: number) {
    setRows((v) => {
      const next = [...v];
      const from = next.findIndex((r) => r.id === id),
        to = next.findIndex((r) => r.id === target);
      if (from < 0 || to < 0) return v;
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  }
  const columns = useMemo<ColumnDef<DataGridFeatures, (typeof initialLabels)[number]>[]>(
    () => [
      {
        id: "drag",
        header: "",
        size: 40,
        enableSorting: false,
        cell: () => <DataGridTableDndRowHandle />,
      },
      {
        accessorKey: "name",
        header: "Label",
        size: 680,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Tag className="size-3.5" fill={row.original.color} stroke={row.original.color} />
            <span>{row.original.name}</span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 90,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={`Edit ${row.original.name}`}
              onClick={() => {
                setForm({ ...row.original });
                setError("");
              }}
            >
              <Pencil />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={`Delete ${row.original.name}`}
              onClick={() => setDeleting(row.original.id)}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );
  const labelTable = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId: (r) => String(r.id),
    manualPagination: true,
  });
  return (
    <section aria-label="Labels" className="mx-auto w-full max-w-[832px] text-sm">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Labels</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Structure and organize project labels.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setForm({
              id: Math.max(0, ...rows.map((r) => r.id)) + 1,
              name: "",
              color: labelColors[0],
            });
            setError("");
          }}
        >
          <Plus />
          Add label
        </Button>
      </header>
      <StructureGrid
        table={labelTable}
        mode="dnd"
        className="[&_thead]:hidden"
        onDragEnd={({ active, over }) => {
          if (over) move(Number(active.id), Number(over.id));
        }}
      />
      {form && (
        <form
          className="mt-3 space-y-3 rounded-lg border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="block text-xs font-medium" htmlFor="label-title">
            Label name
          </label>
          <div className="flex gap-2">
            <ColorPicker
              value={form.color}
              onValueChange={(color) => {
                if (color) setForm({ ...form, color });
              }}
              format="hex"
              swatches={labelColors}
              aria-label="Choose label color"
            >
              <ColorPickerTrigger>
                <Tag className="size-4" style={{ color: form.color }} />
              </ColorPickerTrigger>
              <ColorPickerContent />
            </ColorPicker>
            <Input
              id="label-title"
              autoFocus
              value={form.name}
              placeholder="e.g. Customer impact"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              {rows.some((r) => r.id === form.id) ? "Save label" : "Create label"}
            </Button>
          </div>
        </form>
      )}
      <AlertDialog open={deleting !== null} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete label?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the label from this preview.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setRows((v) => v.filter((r) => r.id !== deleting));
                setDeleting(null);
              }}
            >
              Delete label
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

type Request = {
  id: number;
  name: string;
  owner: string;
  budget: string;
  due: string;
  confidence: string;
  status: string;
  priority: string;
  approved: boolean;
};
const requests: Request[] = [
  {
    id: 2401,
    name: "Website Refresh",
    owner: "Maya Chen",
    budget: "18000",
    due: "14",
    confidence: "78",
    status: "Active",
    priority: "Medium",
    approved: true,
  },
  {
    id: 2418,
    name: "Checkout Audit",
    owner: "Owen Brooks",
    budget: "9200",
    due: "5",
    confidence: "42",
    status: "Blocked",
    priority: "High",
    approved: false,
  },
  {
    id: 2430,
    name: "Brand System",
    owner: "Nina Patel",
    budget: "12500",
    due: "21",
    confidence: "64",
    status: "Draft",
    priority: "Low",
    approved: false,
  },
  {
    id: 2442,
    name: "CRM Automation",
    owner: "Leo Martin",
    budget: "24000",
    due: "8",
    confidence: "86",
    status: "Active",
    priority: "High",
    approved: true,
  },
  {
    id: 2459,
    name: "Data Dashboard",
    owner: "Sara Klein",
    budget: "16000",
    due: "30",
    confidence: "71",
    status: "Active",
    priority: "Medium",
    approved: true,
  },
];
function requestError(r: Request) {
  return !r.name.trim()
    ? "Request name is required."
    : !r.budget.trim() || !Number.isFinite(+r.budget) || +r.budget < 0
      ? "Budget must be zero or more."
      : !r.due.trim() || !Number.isSafeInteger(+r.due) || +r.due < 0
        ? "Due must be a non-negative whole number."
        : !r.confidence.trim() ||
            !Number.isFinite(+r.confidence) ||
            +r.confidence < 0 ||
            +r.confidence > 100
          ? "Confidence must be between 0 and 100."
          : "";
}
function IntakeChoice({
  value,
  options,
  label,
  onChange,
}: {
  value: string;
  options: string[];
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className="h-7 w-auto gap-0 border-0 p-0 shadow-none [&>svg]:hidden"
      >
        <StructureBadge value={value} dot={label.startsWith("Priority")} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function IntakeGrid() {
  const [rows, setRows] = useState(requests),
    [saved, setSaved] = useState(requests),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("All statuses"),
    [priority, setPriority] = useState("All priorities"),
    [active, setActive] = useState<string | null>(null),
    [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const dirty = JSON.stringify(rows) !== JSON.stringify(saved),
    invalid = rows.some((r) => requestError(r));
  function update(id: number, key: keyof Request, value: string | boolean) {
    setRows((v) => v.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }
  function edit(
    row: Request,
    key: "name" | "budget" | "due" | "confidence",
    display: React.ReactNode,
  ) {
    const id = `${row.id}-${key}`;
    return active === id ? (
      <div>
        {key === "name" ? (
          <Input
            aria-label={`Edit ${key} for ${row.name || row.id}`}
            autoFocus
            value={row[key]}
            className="h-8 min-w-40 text-sm"
            onChange={(e) => update(row.id, key, e.target.value)}
            onBlur={() => {
              if (!requestError(row)) setActive(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !requestError(row)) setActive(null);
              if (e.key === "Escape") setActive(null);
            }}
          />
        ) : (
          <NumberField
            value={row[key] === "" ? null : Number(row[key])}
            onValueChange={(value) => update(row.id, key, value === null ? "" : String(value))}
            className="w-28"
          >
            <NumberFieldGroup>
              <NumberFieldInput
                autoFocus
                aria-label={`Edit ${key} for ${row.name || row.id}`}
                onBlur={() => {
                  if (!requestError(row)) setActive(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !requestError(row)) setActive(null);
                  if (e.key === "Escape") setActive(null);
                }}
              />
            </NumberFieldGroup>
          </NumberField>
        )}
        {requestError(row) && (
          <p role="alert" className="mt-1 max-w-48 whitespace-normal text-[10px] text-destructive">
            {requestError(row)}
          </p>
        )}
      </div>
    ) : (
      <button
        className="w-full rounded py-0 text-left hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Edit ${key} for ${row.name || row.id}`}
        onClick={() => setActive(id)}
      >
        {display}
      </button>
    );
  }
  const columns = useMemo<ColumnDef<DataGridFeatures, Request>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Request",
        size: 340,
        cell: ({ row: { original: r } }) =>
          edit(
            r,
            "name",
            <>
              <span className="block font-medium">{r.name}</span>
              <span className="block text-xs text-muted-foreground">
                REQ-{r.id} · {r.owner}
              </span>
            </>,
          ),
      },
      {
        accessorKey: "budget",
        header: "Budget",
        size: 155,
        cell: ({ row: { original: r } }) =>
          edit(
            r,
            "budget",
            <span className="tabular-nums">
              {Number(r.budget).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </span>,
          ),
      },
      {
        accessorKey: "due",
        header: "Due",
        size: 90,
        cell: ({ row: { original: r } }) =>
          edit(
            r,
            "due",
            <span className="flex items-center gap-1">
              {+r.due <= 10 && r.status !== "Draft" && (
                <TriangleAlert className="size-3.5 text-amber-500" />
              )}
              {r.due}d
            </span>,
          ),
      },
      {
        accessorKey: "confidence",
        header: "Confidence",
        size: 190,
        cell: ({ row: { original: r } }) =>
          edit(r, "confidence", <StructureMeter value={+r.confidence} />),
      },
      {
        accessorKey: "status",
        header: "Status",
        filterFn: (row, id, value) =>
          !Array.isArray(value) || !value.length || value.includes(row.getValue(id)),
        size: 140,
        cell: ({ row: { original: r } }) => (
          <IntakeChoice
            label={`Status for ${r.name}`}
            value={r.status}
            onChange={(v) => update(r.id, "status", v)}
            options={["Active", "Blocked", "Draft"]}
          />
        ),
      },
      {
        accessorKey: "priority",
        header: "Priority",
        filterFn: (row, id, value) =>
          !Array.isArray(value) || !value.length || value.includes(row.getValue(id)),
        size: 140,
        cell: ({ row: { original: r } }) => (
          <IntakeChoice
            label={`Priority for ${r.name}`}
            value={r.priority}
            onChange={(v) => update(r.id, "priority", v)}
            options={["High", "Medium", "Low"]}
          />
        ),
      },
      {
        accessorKey: "approved",
        header: "Approved",
        size: 110,
        cell: ({ row: { original: r } }) => (
          <Switch
            size="sm"
            aria-label={`Approve ${r.name}`}
            checked={r.approved}
            onCheckedChange={(v) => update(r.id, "approved", v)}
          />
        ),
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
                label: "Duplicate",
                onClick: () =>
                  setRows((v) => [
                    ...v,
                    {
                      ...r,
                      id: Math.max(...v.map((a) => a.id)) + 1,
                      name: `${r.name} (copy)`,
                    },
                  ]),
              },
              {
                label: "Delete request",
                onClick: () => setRows((v) => v.filter((a) => a.id !== r.id)),
              },
            ]}
          />
        ),
      },
    ],
    [active, rows, saved],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId: (r) => String(r.id),
    manualPagination: true,
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnFilters,
      globalFilter: JSON.stringify([search, status, priority]),
    },
    globalFilterFn: (row) =>
      row.original.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "All statuses" || row.original.status === status) &&
      (priority === "All priorities" || row.original.priority === priority),
  });
  return (
    <StructureFrame
      className="mt-8 [&_h2]:text-base"
      title="Project Intake"
      subtitle="Edit priority, budget, and approval inline."
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const id = Math.max(...rows.map((r) => r.id)) + 1;
            setRows((v) => [
              ...v,
              {
                ...requests[0],
                id,
                name: "New request",
                budget: "0",
                status: "Draft",
                approved: false,
              },
            ]);
            setSearch("");
            setStatus("All statuses");
            setPriority("All priorities");
            setActive(`${id}-name`);
          }}
        >
          <Plus />
          Add request
        </Button>
      }
    >
      <StructureGrid
        table={table}
        toolbar={
          <StructureToolbar>
            <StructureSearch value={search} onChange={setSearch} placeholder="Search requests..." />
            <div className="ml-auto flex gap-2">
              <DataGridColumnFilter
                column={table.getColumn("status")}
                title="Status"
                options={["Active", "Blocked", "Draft"].map((value) => ({
                  label: value,
                  value,
                }))}
              />
              <DataGridColumnFilter
                column={table.getColumn("priority")}
                title="Priority"
                options={["High", "Medium", "Low"].map((value) => ({
                  label: value,
                  value,
                }))}
              />
            </div>
          </StructureToolbar>
        }
      />
      <SavedState
        dirty={dirty}
        invalid={!!invalid}
        onDiscard={() => {
          setRows(saved.map((r) => ({ ...r })));
          setActive(null);
        }}
        onSave={() => {
          setSaved(rows.map((r) => ({ ...r })));
          setActive(null);
          toast.success("Requests saved in this preview");
        }}
      />
    </StructureFrame>
  );
}

type Plan = {
  id: number;
  name: string;
  audience: string;
  price: string;
  seats: string;
  trial: string;
  visibility: string;
  featured: boolean;
};
const plans: Plan[] = [
  {
    id: 1,
    name: "Free",
    audience: "Individuals",
    price: "0",
    seats: "1",
    trial: "No trial",
    visibility: "Public",
    featured: false,
  },
  {
    id: 2,
    name: "Starter",
    audience: "Individuals",
    price: "12",
    seats: "3",
    trial: "14-day",
    visibility: "Public",
    featured: false,
  },
  {
    id: 3,
    name: "Pro",
    audience: "Teams",
    price: "29",
    seats: "10",
    trial: "14-day",
    visibility: "Public",
    featured: true,
  },
  {
    id: 4,
    name: "Business",
    audience: "Teams",
    price: "79",
    seats: "25",
    trial: "30-day",
    visibility: "Public",
    featured: false,
  },
  {
    id: 5,
    name: "Enterprise",
    audience: "Companies",
    price: "299",
    seats: "100",
    trial: "30-day",
    visibility: "Private",
    featured: false,
  },
];
function PlansGrid() {
  const [rows, setRows] = useState(plans),
    [draft, setDraft] = useState<Plan | null>(null),
    [isNew, setIsNew] = useState(false),
    [visibility, setVisibility] = useState("All visibility");
  const error = draft
    ? !draft.name.trim()
      ? "Plan name is required."
      : !draft.price.trim() || !Number.isFinite(+draft.price) || +draft.price < 0
        ? "Price must be zero or more."
        : !draft.seats.trim() || !Number.isSafeInteger(+draft.seats) || +draft.seats < 1
          ? "Seats must be a positive whole number."
          : ""
    : "";
  function start(row: Plan, newRow = false) {
    setDraft({ ...row });
    setIsNew(newRow);
  }
  function save() {
    if (!draft || error) return;
    setRows((v) => (isNew ? [...v, draft] : v.map((r) => (r.id === draft.id ? draft : r))));
    setDraft(null);
    toast.success("Plan saved in this preview");
  }
  const data = useMemo(() => [...rows, ...(isNew && draft ? [draft] : [])], [rows, isNew, draft]);
  const columns = useMemo<ColumnDef<DataGridFeatures, Plan>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Plan",
        size: 230,
        cell: ({ row: { original: source } }) => {
          const r = draft?.id === source.id ? draft : source;
          return draft?.id === r.id ? (
            <Input
              aria-label="Plan name"
              className="h-8 w-36"
              value={r.name}
              onChange={(e) => setDraft({ ...r, name: e.target.value })}
            />
          ) : (
            <>
              <span className="block font-medium">{r.name}</span>
              <span className="block text-xs text-muted-foreground">
                plan_{r.name.toLowerCase()}
              </span>
            </>
          );
        },
      },
      ...(["audience", "price", "seats", "trial", "visibility", "featured"] as const).map(
        (key): ColumnDef<DataGridFeatures, Plan> => ({
          accessorKey: key,
          header: {
            audience: "Audience",
            price: "Price",
            seats: "Seats",
            trial: "Trial",
            visibility: "Visibility",
            featured: "Featured",
          }[key],
          size: key === "audience" ? 220 : 120,
          cell: ({ row: { original: source } }) => {
            const r = draft?.id === source.id ? draft : source;
            const editing = draft?.id === r.id;
            if (editing) {
              if (key === "featured")
                return (
                  <Switch
                    aria-label="Featured plan"
                    checked={r.featured}
                    onCheckedChange={(v) => setDraft({ ...r, featured: v })}
                  />
                );
              if (key === "price" || key === "seats")
                return (
                  <NumberField
                    value={r[key] === "" ? null : Number(r[key])}
                    onValueChange={(value) =>
                      setDraft({
                        ...r,
                        [key]: value === null ? "" : String(value),
                      })
                    }
                    className="w-24"
                  >
                    <NumberFieldGroup>
                      <NumberFieldInput
                        aria-label={key === "price" ? "Monthly price" : "Plan seats"}
                      />
                    </NumberFieldGroup>
                  </NumberField>
                );
              return (
                <StructureSelect
                  label={
                    key === "trial"
                      ? "Trial length"
                      : key === "audience"
                        ? "Plan audience"
                        : "Plan visibility"
                  }
                  value={r[key]}
                  onChange={(v) => setDraft({ ...r, [key]: v })}
                  options={
                    key === "audience"
                      ? ["Individuals", "Teams", "Companies"]
                      : key === "trial"
                        ? ["No trial", "7-day", "14-day", "30-day"]
                        : ["Public", "Private"]
                  }
                />
              );
            }
            if (key === "audience" || key === "visibility")
              return <StructureBadge value={String(r[key])} dot={key === "audience"} />;
            if (key === "featured")
              return r.featured ? (
                <StructureBadge value="Featured" />
              ) : (
                <span className="text-muted-foreground">Off</span>
              );
            if (key === "price")
              return (
                <span>
                  ${r.price}
                  <span className="text-xs text-muted-foreground"> /mo</span>
                </span>
              );
            return String(r[key]);
          },
        }),
      ),
      {
        id: "actions",
        header: "",
        size: 140,
        cell: ({ row: { original: r } }) => (
          <div className="flex gap-1">
            {draft?.id === r.id ? (
              <>
                <Button aria-label="Save plan" size="icon-xs" disabled={!!error} onClick={save}>
                  <Check />
                </Button>
                <Button
                  aria-label="Cancel plan edit"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => setDraft(null)}
                >
                  <X />
                </Button>
              </>
            ) : (
              <>
                <Button
                  aria-label={`Edit ${r.name}`}
                  disabled={!!draft}
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => start(r)}
                >
                  <Pencil />
                </Button>
                <Button
                  aria-label={`Duplicate ${r.name}`}
                  disabled={!!draft}
                  size="icon-xs"
                  variant="ghost"
                  onClick={() =>
                    start(
                      {
                        ...r,
                        id: Math.max(...rows.map((p) => p.id)) + 1,
                        name: `${r.name} copy`,
                      },
                      true,
                    )
                  }
                >
                  <Copy />
                </Button>
                <Button
                  aria-label={`Delete ${r.name}`}
                  disabled={!!draft}
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => setRows((v) => v.filter((p) => p.id !== r.id))}
                >
                  <Trash2 />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [draft, error, isNew, rows],
  );
  const table = useTable({
    features: dataGridFeatures,
    data,
    columns,
    getRowId: (r) => String(r.id),
    manualPagination: true,
    state: { globalFilter: visibility },
    globalFilterFn: (row) =>
      visibility === "All visibility" || row.original.visibility === visibility,
  });
  return (
    <StructureFrame
      className="mt-8"
      title="Plans"
      subtitle="Edit one plan at a time."
      actions={
        <>
          <StructureSelect
            label="Plan visibility filter"
            value={visibility}
            onChange={setVisibility}
            options={["All visibility", "Public", "Private"]}
          />
          <Button
            size="sm"
            disabled={!!draft}
            onClick={() => {
              const p = {
                ...plans[0],
                id: Math.max(...rows.map((r) => r.id)) + 1,
                name: "",
                price: "0",
              };
              start(p, true);
            }}
          >
            <Plus />
            Add plan
          </Button>
        </>
      }
    >
      <StructureGrid
        table={table}
        gridProps={{
          getRowStatus: (r) => (draft?.id === r.id ? "dirty" : undefined),
        }}
      />
      {draft && error && (
        <p role="alert" className="border-t px-4 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <footer className="border-t bg-muted/15 px-4 py-3 text-xs text-muted-foreground">
        {rows.length} plans · {rows.filter((r) => r.visibility === "Public").length} public{" "}
        {draft && (
          <span className="ml-3">
            Editing {draft.name || "new plan"} — save or cancel to edit another plan.
          </span>
        )}
      </footer>
    </StructureFrame>
  );
}
export default function EditingGrid({ block }: BlockProps) {
  if (block.id === "data-grid-editing-1") return <LabelManager />;
  if (block.id === "data-grid-editing-3") return <IntakeGrid />;
  if (block.id === "data-grid-editing-4") return <PlansGrid />;
  return <SpreadsheetGrid block={block} />;
}
