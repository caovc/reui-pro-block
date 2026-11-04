import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Box,
  Clock3,
  Download,
  Ellipsis,
  Info,
  ListFilter,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  DomainGridSurface,
  domainSelectionColumn,
  useDomainGrid,
  type DomainColumn,
} from "@/blocks/data/grid-advanced-model-grid";
import { matchesRules } from "@/blocks/data/grid-filter-controls";
import {
  Filters,
  FilterOperatorPopover,
  createFilterQuery,
  createFilterRule,
  flattenFilterRules,
  useFilterActions,
  useFilterChipAutoOpen,
  useFilterChipFocused,
  useFilterFocusEmpty,
  useFilterFocusStore,
  useFilterState,
  type FilterField,
  type FilterQuery,
  type FilterRule,
} from "@/components/reui/filters/filters";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { demoAvatar } from "@/lib/demo-artwork";
import { Progress } from "../workflow/free/flowly-progress";
import type { CatalogProduct } from "./catalog-data";
import { exportCsv, toast } from "./shared";
import {
  deriveSurgeCustomerGroups,
  deriveSurgeReorderRows,
  surgePlanningPolicy,
  type SurgeCustomerGroup,
  type SurgeOperationsModel,
  type SurgeProduct,
  type SurgeReorderRow,
} from "./surge-operations-model";
import "./surge-operations.css";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function Hint({ children, description }: { children: ReactNode; description: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="reui-reference">{description}</TooltipContent>
    </Tooltip>
  );
}

function ReorderQueue({
  products,
  catalog,
  onOpenProduct,
}: {
  products: SurgeProduct[];
  catalog?: CatalogProduct[];
  onOpenProduct: (product: SurgeProduct) => void;
}) {
  const rows = useMemo(() => deriveSurgeReorderRows(products, catalog), [products, catalog]);
  const [search, setSearch] = useState("");
  const [urgency, setUrgency] = useState("All urgency");
  const [supplier, setSupplier] = useState("All suppliers");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 6 });
  const [sorting, setSorting] = useState([{ id: "deficit", desc: true }]);
  const low = rows.filter((row) => row.urgency === "Low stock").length;
  const out = rows.length - low;
  const suppliers = [...new Set(rows.map((row) => row.supplier))].sort();
  const columns = useMemo<DomainColumn<SurgeReorderRow>[]>(
    () => [
      domainSelectionColumn((row) => row.product.sku),
      {
        id: "product",
        accessorFn: (row) => `${row.product.name} ${row.product.sku}`,
        header: "Product",
        size: 260,
        cell: ({ row }) => (
          <div className="surge-reorder-product">
            <img src={row.original.product.image} alt="" />
            <div>
              <Button
                variant="link"
                className="surge-product-link"
                onClick={() => onOpenProduct(row.original.product)}
              >
                {row.original.product.name}
              </Button>
              <span className="surge-product-meta">
                {row.original.product.sku}
                <span aria-hidden="true">·</span>
                <Badge
                  size="sm"
                  variant={
                    row.original.urgency === "Out of stock" ? "destructive-light" : "warning-light"
                  }
                >
                  {row.original.urgency}
                </Badge>
              </span>
            </div>
          </div>
        ),
      },
      { id: "available", accessorKey: "available", header: "Available", size: 110 },
      {
        id: "reorderPoint",
        accessorKey: "reorderPoint",
        header: "Reorder point",
        size: 125,
        cell: ({ row }) => (
          <Hint description={`Planning threshold: ${surgePlanningPolicy.reorderPoint} units.`}>
            <Button
              variant="ghost"
              className="surge-number-hint"
              aria-label={`Reorder point for ${row.original.product.sku}: ${row.original.reorderPoint}`}
            >
              {row.original.reorderPoint}
            </Button>
          </Hint>
        ),
      },
      {
        id: "deficit",
        accessorKey: "deficit",
        header: "Deficit",
        size: 100,
        cell: ({ row }) => (
          <Hint description={`${row.original.deficit} units below the planning reorder point.`}>
            <Button
              variant="ghost"
              className="surge-number-hint surge-urgency-warning"
              aria-label={`Deficit hint, ${row.original.deficit} units below reorder point`}
            >
              <AlertTriangle />
              {row.original.deficit}
            </Button>
          </Hint>
        ),
      },
      {
        id: "suggestedOrder",
        accessorKey: "suggestedOrder",
        header: "Suggested PO",
        size: 130,
        cell: ({ row }) => (
          <Hint description="Suggested quantity covers twice the deficit, rounded up to a multiple of ten. No purchase order has been placed.">
            <Button
              variant="ghost"
              className="surge-number-hint"
              aria-label={`Suggested order for ${row.original.product.sku}: ${row.original.suggestedOrder} units`}
            >
              <Badge variant="secondary" size="sm">
                <Box />
                {row.original.suggestedOrder}
              </Badge>
            </Button>
          </Hint>
        ),
      },
      {
        id: "supplier",
        accessorKey: "supplier",
        header: "Supplier",
        size: 190,
        cell: ({ row }) => (
          <div className="surge-supplier-cell">
            <span>{row.original.supplier}</span>
            <small>Lead time unavailable</small>
          </div>
        ),
      },
      {
        id: "daysOfCover",
        accessorKey: "daysOfCover",
        header: "Days of cover",
        size: 140,
        cell: ({ row }) => (
          <Hint
            description={`Planning estimate at ${surgePlanningPolicy.unitsPerDay} units per day. Actual sales velocity is not recorded.`}
          >
            <Button
              variant="ghost"
              className={`surge-number-hint${row.original.daysOfCover < 7 ? " surge-urgency-warning" : ""}`}
              aria-label={`Estimated days of cover for ${row.original.product.sku}: ${row.original.daysOfCover}`}
            >
              {row.original.daysOfCover < 7 && <Clock3 />}
              {row.original.daysOfCover} days
            </Button>
          </Hint>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 42,
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Open actions for ${row.original.product.sku}`}
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="reui-reference" align="end">
              <DropdownMenuItem onSelect={() => onOpenProduct(row.original.product)}>
                View product
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportReorder([row.original])}>
                Export SKU
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      { id: "urgency", accessorKey: "urgency", header: "Urgency" },
    ],
    [onOpenProduct],
  );
  const table = useDomainGrid({
    data: rows,
    columns,
    search,
    globalFilterFn: (row, value) =>
      `${row.product.name} ${row.product.sku}`.toLowerCase().includes(value.trim().toLowerCase()),
    filters: [
      ...(urgency === "All urgency" ? [] : [{ id: "urgency", value: urgency }]),
      ...(supplier === "All suppliers" ? [] : [{ id: "supplier", value: supplier }]),
    ],
    alwaysHidden: ["urgency"],
    pagination,
    onPaginationChange: setPagination,
    sorting,
    onSortingChange: setSorting,
    getRowId: (row) => row.id,
  });
  const filtered = table.getFilteredRowModel().rows;
  const selected = filtered.filter((row) => row.getIsSelected());
  function resetPage() {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }
  return (
    <section className="surge-operations surge-reorder-page">
      <header className="surge-operations-heading">
        <h1>Reorder queue</h1>
        <Badge variant="secondary" size="sm">
          {rows.length} SKUs
        </Badge>
      </header>
      <Frame
        dense
        className="surge-operations-frame surge-reorder-summary"
        role="region"
        aria-label="Reorder urgency"
      >
        <FrameHeader>
          <FrameTitle>Reorder urgency</FrameTitle>
          <FrameDescription>What to restock first</FrameDescription>
        </FrameHeader>
        <FramePanel fit>
          <div className="surge-risk-value">
            <span>At-risk inventory value</span>
            <div>
              <strong>
                {money.format(rows.reduce((total, row) => total + row.atRiskValue, 0))}
              </strong>
              <Hint description="Estimated from current selling prices and the units below each reorder point.">
                <Button variant="ghost" size="icon-xs" aria-label="About at-risk inventory value">
                  <Info />
                </Button>
              </Hint>
            </div>
          </div>
          <div className="surge-urgency-chart">
            <div>
              <strong>{rows.length}</strong>
              <span>SKUs needing action</span>
            </div>
            <Progress
              value={low}
              max={Math.max(1, rows.length)}
              aria-label="Reorder urgency"
              aria-valuetext={`${low} low stock, ${out} out of stock`}
              className="surge-urgency-progress"
              data-empty={rows.length === 0}
            />
            <div className="surge-urgency-legend">
              <span>
                <i />
                Low stock: <strong>{low}</strong>
              </span>
              <span>
                <i />
                Out of stock: <strong>{out}</strong>
              </span>
            </div>
          </div>
        </FramePanel>
      </Frame>
      <Frame
        dense
        className="surge-operations-frame surge-reorder-table"
        role="region"
        aria-label="Reorder queue"
      >
        <FrameHeader>
          <div>
            <FrameTitle>Reorder queue</FrameTitle>
            <FrameDescription>{filtered.length} SKUs below reorder point</FrameDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              exportReorder((selected.length ? selected : filtered).map((row) => row.original))
            }
          >
            <Download />
            Export
          </Button>
        </FrameHeader>
        <FramePanel fit>
          <div className="surge-reorder-toolbar">
            <InputGroup className="surge-reorder-search">
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search reorder queue"
                placeholder="Search SKU or product..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPage();
                }}
              />
            </InputGroup>
            <Select
              value={urgency}
              onValueChange={(value) => {
                setUrgency(value);
                resetPage();
              }}
            >
              <SelectTrigger aria-label="Urgency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="reui-reference">
                {["All urgency", "Out of stock", "Low stock"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={supplier}
              onValueChange={(value) => {
                setSupplier(value);
                resetPage();
              }}
            >
              <SelectTrigger aria-label="Supplier">
                <SelectValue>{supplier === "All suppliers" ? "Supplier" : supplier}</SelectValue>
              </SelectTrigger>
              <SelectContent className="reui-reference">
                <SelectItem value="All suppliers">All suppliers</SelectItem>
                {suppliers.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DomainGridSurface
            table={table}
            className="surge-operations-grid surge-reorder-grid"
            layout={{ rowBorder: true, headerBorder: true, headerBackground: false }}
            scrollArea="horizontal"
            paginationControls={{ sizes: [6, 12, 24, 48] }}
          />
        </FramePanel>
      </Frame>
    </section>
  );
}

function exportReorder(rows: SurgeReorderRow[]) {
  exportCsv("reorder-queue", [
    [
      "Product",
      "SKU",
      "Available",
      "Reorder point",
      "Deficit",
      "Suggested PO",
      "Supplier",
      "Estimated days of cover",
    ],
    ...rows.map((row) => [
      row.product.name,
      row.product.sku,
      String(row.available),
      String(row.reorderPoint),
      String(row.deficit),
      String(row.suggestedOrder),
      row.supplier,
      String(row.daysOfCover),
    ]),
  ]);
}

const groupSearchField: FilterField = {
  id: "search",
  label: "Search",
  icon: <Users />,
  type: "text",
  placeholder: "Name, description...",
  operators: [
    "contains",
    "does not contain",
    "is",
    "is not",
    "starts with",
    "ends with",
    "is empty",
    "is not empty",
  ].map((value) => ({
    value,
    label: value,
    arity: value.includes("empty") ? ("none" as const) : ("one" as const),
  })),
};
function initialGroupQuery() {
  return createFilterQuery([
    createFilterRule({ id: "group-search", path: ["search"], operator: "contains", value: "" }),
  ]);
}

/** Supported Filters renderChip extension: reuse its operator popover, query
 * actions and roving root while keeping the observed text editor inline. */
function GroupSearchChip({ rule }: { rule: FilterRule }) {
  const actions = useFilterActions();
  const focus = useFilterFocusStore();
  const autoOpen = useFilterChipAutoOpen(rule.id);
  const input = useRef<HTMLInputElement>(null);
  const focused = useFilterChipFocused(rule.id);
  const emptyFocus = useFilterFocusEmpty();
  const state = useFilterState();
  const index = flattenFilterRules(state.query).findIndex((entry) => entry.id === rule.id);
  // Consume the free operator picker's existing handoff at its inline editor.
  // All arrow, remove, menu and Escape behavior remains owned by Filters.
  useEffect(() => {
    if (autoOpen !== "value" || !input.current) return;
    input.current.focus();
    focus.set({ id: rule.id, segment: "value", autoOpen: false });
  }, [autoOpen, focus, rule.id]);
  return (
    <ButtonGroup
      data-slot="filter-chip"
      data-rule-id={rule.id}
      data-index={index}
      aria-label="Search filter"
      tabIndex={focused || (emptyFocus && index === 0) ? 0 : -1}
      className="surge-group-search-chip"
      onFocusCapture={() => {
        if (!focused) focus.set({ id: rule.id, segment: null, autoOpen: false });
      }}
    >
      <ButtonGroupText>
        <Users />
        Search
      </ButtonGroupText>
      <FilterOperatorPopover
        rule={rule}
        field={groupSearchField}
        trigger={
          <ButtonGroupText asChild>
            <button type="button">{rule.operator || "Select condition"}</button>
          </ButtonGroupText>
        }
      />
      {rule.operator && !rule.operator.includes("empty") && (
        <Input
          ref={input}
          aria-label="Name, description..."
          placeholder="Name, description..."
          value={String(rule.value ?? "")}
          onChange={(event) => actions.updateRule(rule.id, { value: event.target.value })}
        />
      )}
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Remove Search filter"
        onClick={() => actions.removeNode(rule.id)}
      >
        <X />
      </Button>
    </ButtonGroup>
  );
}

function matchesGroup(group: SurgeCustomerGroup, query: FilterQuery) {
  return matchesRules(
    { search: `${group.name} ${group.description}` },
    flattenFilterRules(query).map((rule) => ({
      id: rule.id,
      field: rule.path[0],
      operator: rule.operator,
      values: rule.value === undefined ? [] : [String(rule.value)],
      negated: rule.negated,
    })),
  );
}

function GroupMembers({ group }: { group: SurgeCustomerGroup }) {
  return (
    <div className="surge-group-members">
      <AvatarGroup>
        {group.members.slice(0, 4).map((member) => (
          <Avatar key={member.key} size="sm">
            <AvatarImage src={demoAvatar(member.name)} alt={member.name} />
            <AvatarFallback>
              {member.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>
      <span>{group.memberCount}</span>
    </div>
  );
}

function CustomerGroups({
  customers,
  model,
}: {
  customers: string[][];
  model: SurgeOperationsModel;
}) {
  const groups = useMemo(
    () => deriveSurgeCustomerGroups(model.groups, customers),
    [model.groups, customers],
  );
  const [query, setQuery] = useState<FilterQuery>(initialGroupQuery);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([{ id: "members", desc: true }]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const fieldId = useId();
  const columns = useMemo<DomainColumn<SurgeCustomerGroup>[]>(
    () => [
      domainSelectionColumn((group) => group.name),
      {
        id: "group",
        accessorFn: (group) => group.name,
        header: "Group",
        size: 250,
        cell: ({ row }) => (
          <div className="surge-group-name">
            <span className="surge-group-symbol">
              <Users />
            </span>
            <div>
              <strong>{row.original.name}</strong>
              <small>{row.original.description || "No description"}</small>
            </div>
          </div>
        ),
      },
      {
        id: "members",
        accessorFn: (group) => group.memberCount,
        header: "Members",
        size: 160,
        cell: ({ row }) => <GroupMembers group={row.original} />,
      },
      {
        id: "share",
        accessorKey: "share",
        header: "Share",
        size: 140,
        cell: ({ row }) => (
          <span>
            {row.original.share}%<span className="text-muted-foreground"> of customers</span>
          </span>
        ),
      },
      { id: "orders", accessorKey: "orders", header: "Orders", size: 95 },
      {
        id: "spent",
        accessorKey: "spent",
        header: "Total spent",
        size: 130,
        cell: ({ row }) => (
          <strong className="font-medium">{money.format(row.original.spent)}</strong>
        ),
      },
      {
        id: "lastOrder",
        accessorFn: () => "",
        header: "Last order",
        size: 130,
        cell: () => (
          <Hint description="No order date recorded.">
            <span tabIndex={0} className="surge-missing-value" aria-label="No order date recorded">
              —
            </span>
          </Hint>
        ),
      },
      {
        id: "created",
        accessorFn: (group) => group.createdAt || "",
        header: "Created",
        size: 130,
        cell: ({ row }) =>
          row.original.createdAt ? (
            <span className="text-muted-foreground">
              {date.format(new Date(row.original.createdAt))}
            </span>
          ) : (
            <Hint description="No creation date recorded.">
              <span
                tabIndex={0}
                className="surge-missing-value"
                aria-label="No creation date recorded"
              >
                —
              </span>
            </Hint>
          ),
      },
      {
        id: "actions",
        header: "",
        size: 42,
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${row.original.name}`}
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="reui-reference" align="end">
              <DropdownMenuItem
                onSelect={() =>
                  exportCsv(`${row.original.name}-members`, [
                    ["Name", "Email", "Orders", "Total spent"],
                    ...row.original.members.map((member) => [
                      member.name,
                      member.email,
                      String(member.orders),
                      money.format(member.spent),
                    ]),
                  ])
                }
              >
                Export members
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );
  const filtered = useMemo(
    () => groups.filter((group) => matchesGroup(group, query)),
    [groups, query],
  );
  const table = useDomainGrid({
    data: filtered,
    columns,
    pagination,
    onPaginationChange: setPagination,
    sorting,
    onSortingChange: setSorting,
    getRowId: (group) => group.id,
  });
  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) {
      setName("");
      setDescription("");
      setError("");
    }
  }
  return (
    <section className="surge-operations surge-groups-page">
      <header className="surge-operations-heading">
        <h1>Customer groups</h1>
        <Badge variant="secondary" size="sm">
          {groups.length} groups
        </Badge>
        <Sheet open={open} onOpenChange={changeOpen}>
          <SheetTrigger asChild>
            <Button className="surge-new-group-trigger">
              <Plus />
              New group
            </Button>
          </SheetTrigger>
          <SheetContent className="reui-reference surge-group-sheet">
            <form
              className="surge-group-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                const result = model.addGroup(name, description);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                changeOpen(false);
                toast.success("Customer group created");
              }}
            >
              <SheetHeader>
                <SheetTitle>New group</SheetTitle>
                <SheetDescription>
                  Groups segment customers for pricing, promotions, and campaigns.
                </SheetDescription>
              </SheetHeader>
              <div className="surge-group-fields">
                <Field data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor={`${fieldId}-name`}>Name</FieldLabel>
                  <Input
                    id={`${fieldId}-name`}
                    name="name"
                    placeholder="e.g. VIP"
                    autoFocus
                    value={name}
                    maxLength={80}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${fieldId}-error` : undefined}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError("");
                    }}
                  />
                  {error && (
                    <FieldError id={`${fieldId}-error`} role="alert">
                      {error}
                    </FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${fieldId}-description`}>Description</FieldLabel>
                  <Textarea
                    id={`${fieldId}-description`}
                    name="description"
                    placeholder="What defines this segment?"
                    value={description}
                    maxLength={500}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </Field>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit">Create group</Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </header>
      <Frame
        dense
        className="surge-operations-frame surge-groups-frame"
        role="region"
        aria-label="Customer groups"
      >
        <FramePanel fit>
          <Filters
            fields={[groupSearchField]}
            query={query}
            onQueryChange={(next) => {
              setQuery(next);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            }}
            renderChip={(rule) => <GroupSearchChip rule={rule} />}
            size="sm"
            showClear
            menuClassName="reui-reference"
            fieldPickerClassName="reui-reference"
            trigger={
              <Button variant="outline" size="sm" className="surge-groups-filter-trigger">
                <ListFilter />
                Filters
              </Button>
            }
            className="surge-groups-filters"
          />
          <DomainGridSurface
            table={table}
            className="surge-operations-grid surge-groups-grid"
            scrollArea="horizontal"
            paginationControls={{ sizes: [10, 25, 50] }}
          />
        </FramePanel>
      </Frame>
    </section>
  );
}

export function SurgeOperations({
  page,
  products,
  customers,
  catalog,
  model,
  onOpenProduct,
}: {
  page: "Reorder queue" | "Groups";
  products: SurgeProduct[];
  customers: string[][];
  catalog?: CatalogProduct[];
  model: SurgeOperationsModel;
  onOpenProduct: (product: SurgeProduct) => void;
}) {
  return (
    <TooltipProvider>
      {page === "Reorder queue" ? (
        <ReorderQueue products={products} catalog={catalog} onOpenProduct={onOpenProduct} />
      ) : (
        <CustomerGroups customers={customers} model={model} />
      )}
    </TooltipProvider>
  );
}
