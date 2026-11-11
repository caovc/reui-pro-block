import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  Columns3,
  Download,
  FileText,
  Filter,
  HelpCircle,
  Phone,
  Plus,
  Send,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  functionalUpdate,
  useTable,
  type ColumnDef,
  type ColumnVisibilityState,
  type ExpandedState,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
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
  DataGridTableBase,
  DataGridTableBody,
  DataGridTableBodyRow,
  DataGridTableEmpty,
  DataGridTableHead,
  DataGridTableHeadRow,
  DataGridTableHeadRowCell,
  DataGridTableRenderedRow,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
  DataGridTableViewport,
  renderDataGridTableHeadCellContent,
} from "@/components/reui/data-grid/data-grid-table";
import { Filters } from "@/components/reui/filters/filters";
import { createFilterQuery } from "@/components/reui/filters/filters-query";
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  InvoiceBadge,
  InvoiceBalanceCell,
  InvoiceCustomerCell,
  InvoiceOwnerCell,
  InvoiceSearch,
  InvoiceSelect,
  InvoiceTimeline,
} from "./grid-advanced-invoice-manager-controls";
import {
  InvoiceConfirmation,
  InvoiceDetails,
  InvoiceEditor,
  InvoiceFollowup,
  type Followup,
} from "./grid-advanced-invoice-manager-panels";
import {
  buildInvoiceRows,
  getInvoiceGroup,
  initialInvoices,
  invoiceBalance,
  invoiceCsv,
  invoiceCurrencies,
  invoiceCustomer,
  invoiceCustomers,
  invoiceDate,
  invoiceExpected,
  invoiceInScope,
  invoiceMetrics,
  invoiceMoney,
  invoiceNextStep,
  invoiceOwner,
  invoiceOwners,
  invoiceRowRecord,
  invoiceShift,
  invoiceStatus,
  invoiceStatusBadge,
  invoiceStatusTitles,
  invoiceToday,
  invoiceUsd,
  matchInvoiceFilter,
  type Invoice,
  type InvoiceAction,
  type InvoiceEvent,
  type InvoiceGrouping,
  type InvoiceRow,
  type InvoiceScope,
  type InvoiceWindow,
} from "./grid-advanced-invoice-manager-model";
import "./grid-advanced-invoice-manager.css";

const scopeItems: { value: InvoiceScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "needs", label: "Needs You" },
  { value: "waiting", label: "Waiting" },
  { value: "drafts", label: "Drafts" },
  { value: "closed", label: "Closed" },
];
const groupItems: { value: InvoiceGrouping; label: string }[] = [
  { value: "next", label: "Next Step" },
  { value: "status", label: "Status" },
  { value: "owner", label: "Owner" },
  { value: "customer", label: "Customer" },
  { value: "none", label: "No grouping" },
];
const defaultGroupOrder = ["needs", "waiting", "drafts", "closed"];
const filterFields: FilterField[] = [
  { id: "customer", label: "Customer", type: "text" },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: Object.entries(invoiceStatusTitles).map(([value, label]) => ({ value, label })),
  },
  {
    id: "currency",
    label: "Currency",
    type: "select",
    options: invoiceCurrencies.map((value) => ({ value, label: value })),
  },
  {
    id: "owner",
    label: "Owner",
    type: "select",
    options: invoiceOwners.map(({ id, name }) => ({ value: id, label: name })),
  },
  { id: "balance", label: "Balance (USD)", type: "number" },
];
const metricCopy = {
  needs: { label: "Needs You", note: "Action required on your end", tone: "warning" },
  waiting: { label: "Waiting", note: "Awaiting the customer", tone: "purple" },
  next: { label: "Next 30 Days", note: "From promises and pay habits", tone: "good" },
} as const;
const actionIcons = {
  collect: ShieldAlert,
  call: Phone,
  resend: Send,
  dispute: FileText,
  send: Send,
};
const sortAccessors = {
  customer: (invoice: Invoice) => invoiceCustomer(invoice.customer).name,
  balance: (invoice: Invoice) => invoiceUsd(invoiceBalance(invoice), invoice.currency),
  status: (invoice: Invoice) => invoiceStatusTitles[invoiceStatus(invoice)],
  timeline: (invoice: Invoice) => invoice.issued,
  expected: (invoice: Invoice) => invoiceExpected(invoice).day ?? "",
  step: (invoice: Invoice) => invoiceNextStep(invoice).label,
  owner: (invoice: Invoice) => invoiceOwner(invoice.owner).name,
};
const ledgerColumns: ColumnDef<DataGridFeatures, Invoice>[] = Object.entries(sortAccessors).map(
  ([id, accessorFn]) => ({ id, accessorFn }),
);

type LedgerCriteria = { text: string; scope: InvoiceScope; query: FilterQuery };
type Ledger = { rows: Invoice[]; version: number; previous?: Invoice[] };
type Panel =
  | { kind: "editor"; invoice: Invoice; adding: boolean }
  | { kind: "action"; invoiceId: string; action: InvoiceAction }
  | { kind: "delete"; ids: string[] };

function matchesInvoice(invoice: Invoice, { text, scope, query }: LedgerCriteria) {
  if (!invoiceInScope(invoice, scope) || matchInvoiceFilter(invoice, query) === false) return false;
  const search = text.trim().toLocaleLowerCase();
  return (
    !search ||
    [
      invoice.number,
      invoice.contact,
      invoice.description,
      invoiceCustomer(invoice.customer).name,
    ].some((value) => value.toLocaleLowerCase().includes(search))
  );
}

function InvoiceOverview({ rows }: { rows: Invoice[] }) {
  const stats = invoiceMetrics(rows);
  return (
    <section aria-label="Receivables overview" className="grid gap-3 px-4 pb-3 md:grid-cols-3">
      {(["needs", "waiting", "next"] as const).map((key) => {
        const metric = stats[key];
        const copy = metricCopy[key];
        return (
          <section
            key={key}
            aria-label={copy.label}
            data-invoice-tone={copy.tone}
            className="invoice-stat min-w-0 rounded-xl border px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex min-w-0 items-center gap-2 font-medium">
                <i aria-hidden="true" className="invoice-dot size-2 shrink-0 rounded-full" />
                {copy.label}
              </h3>
              <InvoiceBadge label={`${metric.count} invoices`} tone={copy.tone} />
            </div>
            <strong className="invoice-tone-text mt-1 block text-xl leading-5 font-semibold tabular-nums">
              {invoiceMoney(metric.value)}
            </strong>
            <p className="mt-0.5 text-xs text-muted-foreground">{copy.note}</p>
          </section>
        );
      })}
    </section>
  );
}

function StatusCell({ invoice }: { invoice: Invoice }) {
  const status = invoiceStatus(invoice);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <InvoiceBadge {...invoiceStatusBadge(invoice)} />
      <span className="truncate text-xs text-muted-foreground">
        {status === "disputed"
          ? "Paused · "
          : status === "paid" || status === "draft" || status === "void"
            ? ""
            : `Due ${invoiceDate(invoice.due)} · `}
        {invoice.number}
      </span>
    </div>
  );
}

function StepCell({
  invoice,
  onAction,
}: {
  invoice: Invoice;
  onAction: (action: InvoiceAction, trigger: HTMLElement) => void;
}) {
  const step = invoiceNextStep(invoice);
  if (!step.action) return <span className="text-muted-foreground">{step.label}</span>;
  const Icon = actionIcons[step.action];
  return (
    <Button
      variant="outline"
      size="sm"
      data-invoice-focus={`step-${invoice.id}`}
      data-invoice-tone={step.tone}
      className="invoice-step max-w-full justify-start"
      onClick={(event) => onAction(step.action!, event.currentTarget)}
    >
      <Icon data-icon="inline-start" />
      <span className="truncate">{step.label}</span>
    </Button>
  );
}

function GroupHeading({
  row,
  columns,
}: {
  row: Row<DataGridFeatures, InvoiceRow>;
  columns: number;
}) {
  if ("invoice" in row.original) return null;
  const group = row.original;
  const expanded = row.getIsExpanded();
  return (
    <DataGridTableBodyRow row={row}>
      <td className="invoice-group px-3 py-1" data-invoice-tone={group.tone}>
        <Button
          variant="outline"
          size="icon-xs"
          aria-label={`${expanded ? "Collapse" : "Expand"} ${group.title}`}
          aria-expanded={expanded}
          onClick={() => row.toggleExpanded()}
        >
          <ChevronDown className={expanded ? undefined : "-rotate-90"} />
        </Button>
      </td>
      <td colSpan={columns - 1} className="invoice-group px-2 py-1" data-invoice-tone={group.tone}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 items-center gap-2 font-medium">
            <i aria-hidden="true" className="invoice-dot size-2 rounded-full" />
            {group.title}
          </span>
          {group.description && (
            <span className="truncate text-xs text-muted-foreground">{group.description}</span>
          )}
        </div>
      </td>
    </DataGridTableBodyRow>
  );
}

const confirmations = {
  collect: {
    title: "Hand to Collections?",
    action: "Hand to Collections",
    message: "Record a collections handoff and stop automatic reminders for this invoice.",
    danger: true,
  },
  resend: {
    title: "Resend invoice?",
    action: "Resend Invoice",
    message: "Record another send in the local invoice timeline.",
    danger: false,
  },
  send: {
    title: "Review and send?",
    action: "Send Invoice",
    message: "Move this draft into the open ledger and record its send date.",
    danger: false,
  },
} as const;

export default function InvoiceManager() {
  const mobile = useIsMobile();
  const [ledger, setLedger] = useState<Ledger>(() => ({ rows: initialInvoices(), version: 0 }));
  const [scope, setScope] = useState<InvoiceScope>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [grouping, setGrouping] = useState<InvoiceGrouping>("next");
  const [timelineWindow, setTimelineWindow] = useState<InvoiceWindow>("quarter");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [visibility, setVisibility] = useState<ColumnVisibilityState>({});
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [detailId, setDetailId] = useState<string>();
  const [panel, setPanel] = useState<Panel>();
  const sequence = useRef(0);
  const gridRoot = useRef<HTMLElement>(null);
  const detailActions = useRef<HTMLButtonElement>(null);
  const detailOrigin = useRef<HTMLElement | null>(null);
  const panelOrigin = useRef<HTMLElement | null>(null);
  const newInvoiceButton = useRef<HTMLButtonElement>(null);
  const detail = ledger.rows.find((invoice) => invoice.id === detailId);
  const panelInvoice =
    panel?.kind === "action"
      ? ledger.rows.find((invoice) => invoice.id === panel.invoiceId)
      : undefined;

  function resetPage() {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }

  const commit = useCallback((transform: (rows: Invoice[]) => Invoice[], message: string) => {
    const version = ++sequence.current;
    setLedger((current) => ({ rows: transform(current.rows), previous: current.rows, version }));
    toast.success(message, {
      id: "invoice-manager-write",
      action: {
        label: "Undo",
        onClick: () =>
          setLedger((current) =>
            current.version === version && current.previous
              ? { rows: current.previous, version: 0 }
              : current,
          ),
      },
    });
  }, []);

  const changeInvoice = useCallback(
    (id: string, transform: (invoice: Invoice) => Invoice, message: string) => {
      commit(
        (rows) => rows.map((invoice) => (invoice.id === id ? transform(invoice) : invoice)),
        message,
      );
    },
    [commit],
  );

  function append(invoice: Invoice, events: Omit<InvoiceEvent, "id">[]) {
    const entries = events.map((event) => ({
      ...event,
      id: `${invoice.id}-event-${++sequence.current}`,
    }));
    return [...invoice.events, ...entries].toSorted((a, b) => a.day.localeCompare(b.day));
  }

  const openDetails = useCallback((invoice: Invoice, trigger: HTMLElement) => {
    detailOrigin.current = trigger;
    setDetailId(invoice.id);
  }, []);

  function currentTrigger(original: HTMLElement | null) {
    if (original?.isConnected) return original;
    // A ledger mutation can move a row to a different group and remount its buttons.
    const key = original?.dataset.invoiceFocus;
    return key
      ? gridRoot.current?.querySelector<HTMLElement>(`[data-invoice-focus="${CSS.escape(key)}"]`)
      : undefined;
  }

  function restoreDetailFocus() {
    const origin = detailOrigin.current;
    if (origin) (currentTrigger(origin) ?? newInvoiceButton.current)?.focus();
  }

  function restorePanelFocus() {
    // Base UI can invoke close focus while React is still committing changed rows.
    requestAnimationFrame(() => {
      (
        currentTrigger(panelOrigin.current) ??
        detailActions.current ??
        currentTrigger(detailOrigin.current) ??
        newInvoiceButton.current
      )?.focus();
    });
  }

  const openAction = useCallback(
    (invoice: Invoice, action: InvoiceAction, trigger: HTMLElement) => {
      panelOrigin.current = trigger;
      setPanel({ kind: "action", invoiceId: invoice.id, action });
    },
    [],
  );

  function editInvoice(invoice: Invoice) {
    panelOrigin.current = detailOrigin.current;
    detailOrigin.current = null;
    setDetailId(undefined);
    setPanel({ kind: "editor", invoice, adding: false });
  }

  function addInvoice(trigger: HTMLElement) {
    const number = Math.max(
      2080,
      ...ledger.rows.map((invoice) => Number(invoice.number.slice(4)) + 1),
    );
    panelOrigin.current = trigger;
    setPanel({
      kind: "editor",
      adding: true,
      invoice: {
        id: `invoice-local-${++sequence.current}`,
        number: `INV-${number}`,
        customer: invoiceCustomers[0]!.id,
        contact: invoiceCustomers[0]!.contact,
        owner: invoiceOwners[0]!.id,
        description: "",
        currency: "USD",
        total: 0,
        issued: invoiceToday,
        due: invoiceShift(invoiceToday, 30),
        stage: "draft",
        automatic: true,
        events: [],
      },
    });
  }

  function saveInvoice(invoice: Invoice) {
    const adding = panel?.kind === "editor" && panel.adding;
    commit(
      (rows) =>
        adding ? [...rows, invoice] : rows.map((item) => (item.id === invoice.id ? invoice : item)),
      adding ? "Draft created" : "Invoice saved",
    );
    if (adding) {
      setSearch(invoice.number);
      setScope("all");
      setQuery(createFilterQuery());
      setExpanded(true);
      resetPage();
    }
    setPanel(undefined);
  }

  function requestDelete(ids: string[], trigger: HTMLElement) {
    panelOrigin.current = trigger;
    setPanel({ kind: "delete", ids });
  }

  function deleteInvoices(ids: string[]) {
    const removed = new Set(ids);
    commit(
      (rows) => rows.filter((invoice) => !removed.has(invoice.id)),
      ids.length === 1 ? "Invoice deleted" : `${ids.length} invoices deleted`,
    );
    setSelection((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => !removed.has(id))),
    );
    if (detailId && removed.has(detailId)) setDetailId(undefined);
    setPanel(undefined);
  }

  function applyAction(invoice: Invoice, action: "collect" | "resend" | "send") {
    const day = invoiceToday;
    const events = append(invoice, [{ type: action === "collect" ? "collections" : "sent", day }]);
    if (action === "collect")
      changeInvoice(
        invoice.id,
        (current) => ({ ...current, stage: "collections", automatic: false, events }),
        "Collections handoff recorded",
      );
    else if (action === "send")
      changeInvoice(
        invoice.id,
        (current) => ({
          ...current,
          stage: "open",
          issued: day,
          due: current.due < day ? invoiceShift(day, 30) : current.due,
          events,
        }),
        "Invoice sent in this demo",
      );
    else
      changeInvoice(invoice.id, (current) => ({ ...current, events }), "Invoice resend recorded");
    setPanel(undefined);
  }

  function logFollowup(invoice: Invoice, action: "call" | "dispute", followup: Followup) {
    const day = invoiceToday;
    const events = append(invoice, [
      { type: "note", day, note: followup.note },
      ...(followup.promise
        ? [{ type: "promise" as const, day, promisedFor: followup.promise, note: followup.note }]
        : []),
    ]);
    changeInvoice(
      invoice.id,
      (current) => ({ ...current, stage: action === "dispute" ? "open" : current.stage, events }),
      action === "dispute" ? "Dispute resolved" : "Call recorded",
    );
    setPanel(undefined);
  }

  function recordPayment(invoice: Invoice, amount: number, day: string, method: string) {
    if (amount <= 0 || amount > invoiceBalance(invoice)) return;
    const settled = amount === invoiceBalance(invoice);
    const events = append(invoice, [
      { type: "payment", day, amount, note: method },
      ...(settled ? [{ type: "receipt" as const, day }] : []),
    ]);
    changeInvoice(
      invoice.id,
      (current) => ({ ...current, automatic: settled ? false : current.automatic, events }),
      "Payment recorded",
    );
    if (settled) requestAnimationFrame(() => detailActions.current?.focus());
  }

  const criteria = useMemo(() => ({ text: search, scope, query }), [search, scope, query]);
  const ledgerTable = useTable({
    features: dataGridFeatures,
    columns: ledgerColumns,
    data: ledger.rows,
    getRowId: (invoice) => invoice.id,
    manualPagination: true,
    state: { globalFilter: criteria, sorting },
    globalFilterFn: (row, _column, value) => matchesInvoice(row.original, value as LedgerCriteria),
  });
  const nativeMatches = ledgerTable.getSortedRowModel().rows;
  const visible = useMemo(() => {
    const records = nativeMatches.map((row) => row.original);
    if (grouping === "none") return records;
    if (grouping === "next") {
      return records.toSorted(
        (a, b) =>
          defaultGroupOrder.indexOf(invoiceNextStep(a).section) -
          defaultGroupOrder.indexOf(invoiceNextStep(b).section),
      );
    }
    return records.toSorted((a, b) =>
      getInvoiceGroup(a, grouping).title.localeCompare(getInvoiceGroup(b, grouping).title),
    );
  }, [nativeMatches, grouping]);
  const pageIndex = Math.min(
    pagination.pageIndex,
    Math.max(0, Math.ceil(visible.length / pagination.pageSize) - 1),
  );
  const pageRows = useMemo(() => {
    const from = pageIndex * pagination.pageSize;
    return buildInvoiceRows(visible.slice(from, from + pagination.pageSize), grouping);
  }, [visible, pageIndex, pagination.pageSize, grouping]);
  const openCounts = useMemo(() => {
    const result = new Map<string, number>();
    for (const row of ledger.rows) {
      if (invoiceInScope(row, "open"))
        result.set(row.customer, (result.get(row.customer) ?? 0) + 1);
    }
    return result;
  }, [ledger.rows]);
  const selectedRows = visible.filter((invoice) => selection[invoice.id]);
  const scopes = useMemo(
    () =>
      scopeItems.map(({ value, label }) => ({
        value,
        label: `${label} ${ledger.rows.filter((invoice) => invoiceInScope(invoice, value)).length}`,
      })),
    [ledger.rows],
  );

  function exportInvoices(records: Invoice[]) {
    if (!records.length) return;
    const url = URL.createObjectURL(
      new Blob([invoiceCsv(records)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "invoice-manager.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    toast.success("Invoices exported", { description: `${records.length} invoices saved as CSV.` });
  }

  // Keep the native cell controls mounted while a panel or toolbar menu changes state.
  const columns = useMemo<ColumnDef<DataGridFeatures, InvoiceRow>[]>(
    () => [
      {
        id: "select",
        size: 48,
        minSize: 44,
        enableHiding: false,
        enableSorting: false,
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
      },
      {
        id: "customer",
        size: 210,
        enableHiding: false,
        accessorFn: (row) => invoiceRowRecord(row)?.customer,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Customer" />,
        meta: { headerTitle: "Customer" },
        cell: ({ row }) => {
          const invoice = invoiceRowRecord(row.original);
          return (
            invoice && (
              <InvoiceCustomerCell
                invoice={invoice}
                openCount={openCounts.get(invoice.customer) ?? 0}
                onOpen={(trigger) => openDetails(invoice, trigger)}
              />
            )
          );
        },
      },
      {
        id: "balance",
        size: 98,
        accessorFn: (row) => invoiceRowRecord(row)?.total,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Balance" className="justify-end" />
        ),
        meta: { headerTitle: "Balance", cellClassName: "text-right" },
        cell: ({ row }) => {
          const invoice = invoiceRowRecord(row.original);
          return invoice && <InvoiceBalanceCell invoice={invoice} />;
        },
      },
      {
        id: "status",
        size: 156,
        accessorFn: (row) => invoiceRowRecord(row)?.stage,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />,
        meta: { headerTitle: "Status" },
        cell: ({ row }) => {
          const invoice = invoiceRowRecord(row.original);
          return invoice && <StatusCell invoice={invoice} />;
        },
      },
      {
        id: "timeline",
        size: 244,
        accessorFn: (row) => invoiceRowRecord(row)?.issued,
        meta: { headerTitle: "Timeline" },
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <DataGridColumnHeader column={column} title="Timeline" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-xs" aria-label="How to read the timeline">
                  <HelpCircle />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Tracks issue, due date, reminders and payments in the selected window.
              </TooltipContent>
            </Tooltip>
          </div>
        ),
        cell: ({ row }) => {
          const invoice = invoiceRowRecord(row.original);
          return invoice && <InvoiceTimeline invoice={invoice} window={timelineWindow} />;
        },
      },
      {
        id: "expected",
        size: 104,
        accessorFn: (row) => invoiceRowRecord(row)?.due,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Expected" />,
        meta: { headerTitle: "Expected" },
        cell: ({ row }) => {
          const invoice = invoiceRowRecord(row.original);
          if (!invoice) return null;
          const expected = invoiceExpected(invoice);
          return (
            <div className="flex flex-col gap-1 whitespace-nowrap">
              <span>
                {expected.day
                  ? invoiceDate(expected.day)
                  : invoice.stage === "disputed"
                    ? "On hold"
                    : "No date"}
              </span>
              <InvoiceBadge label={expected.label} tone={expected.tone} />
            </div>
          );
        },
      },
      {
        id: "step",
        size: 190,
        accessorFn: (row) => invoiceRowRecord(row)?.stage,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Next Step" />,
        meta: { headerTitle: "Next Step" },
        cell: ({ row }) => {
          const invoice = invoiceRowRecord(row.original);
          return (
            invoice && (
              <StepCell
                invoice={invoice}
                onAction={(action, trigger) => openAction(invoice, action, trigger)}
              />
            )
          );
        },
      },
      {
        id: "owner",
        size: 164,
        accessorFn: (row) => invoiceRowRecord(row)?.owner,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Owner" />,
        meta: { headerTitle: "Owner" },
        cell: ({ row }) => {
          const invoice = invoiceRowRecord(row.original);
          return (
            invoice && (
              <InvoiceOwnerCell
                invoice={invoice}
                onAssign={(owner) =>
                  changeInvoice(invoice.id, (current) => ({ ...current, owner }), "Owner updated")
                }
              />
            )
          );
        },
      },
    ],
    [changeInvoice, openAction, openCounts, openDetails, timelineWindow],
  );

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: pageRows,
    getRowId: (row) => row.id,
    getSubRows: (row) => ("children" in row ? row.children : undefined),
    enableRowSelection: (row) => "invoice" in row.original,
    enableSubRowSelection: true,
    enableExpanding: true,
    manualPagination: true,
    rowCount: visible.length,
    manualSorting: true,
    state: {
      pagination: { pageIndex, pageSize: pagination.pageSize },
      sorting,
      expanded,
      columnVisibility: visibility,
      rowSelection: selection,
    },
    onPaginationChange: (update) =>
      setPagination(functionalUpdate(update, { pageIndex, pageSize: pagination.pageSize })),
    onSortingChange: (update) => {
      setSorting((current) => functionalUpdate(update, current));
      resetPage();
    },
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setVisibility,
    onRowSelectionChange: setSelection,
    autoResetPageIndex: false,
    autoResetExpanded: false,
  });

  let panelContent: ReactNode;
  if (panel?.kind === "editor")
    panelContent = (
      <InvoiceEditor
        key={panel.invoice.id}
        initial={panel.invoice}
        rows={ledger.rows}
        adding={panel.adding}
        onClose={() => setPanel(undefined)}
        onRestore={restorePanelFocus}
        onSave={saveInvoice}
      />
    );
  if (panel?.kind === "delete")
    panelContent = (
      <InvoiceConfirmation
        title={panel.ids.length === 1 ? "Delete invoice?" : "Delete selected invoices?"}
        action={panel.ids.length === 1 ? "Delete Invoice" : "Delete Invoices"}
        description="The invoice and its activity will be removed from this local ledger."
        danger
        onClose={() => setPanel(undefined)}
        onRestore={restorePanelFocus}
        onConfirm={() => deleteInvoices(panel.ids)}
      />
    );
  if (panel?.kind === "action" && panelInvoice) {
    const action = panel.action;
    if (action === "call" || action === "dispute") {
      panelContent = (
        <InvoiceFollowup
          kind={action}
          invoice={panelInvoice}
          onClose={() => setPanel(undefined)}
          onRestore={restorePanelFocus}
          onSave={(followup) => logFollowup(panelInvoice, action, followup)}
        />
      );
    } else {
      const copy = confirmations[action];
      panelContent = (
        <InvoiceConfirmation
          title={copy.title}
          action={copy.action}
          description={`${panelInvoice.number} · ${invoiceMoney(invoiceBalance(panelInvoice), panelInvoice.currency)}. ${copy.message}`}
          danger={copy.danger}
          onClose={() => setPanel(undefined)}
          onRestore={restorePanelFocus}
          onConfirm={() => applyAction(panelInvoice, action)}
        />
      );
    }
  }

  return (
    <TooltipProvider>
      <section
        ref={gridRoot}
        aria-label="Invoice manager"
        className="invoice-manager mx-auto w-full max-w-[1248px] px-4 py-8 sm:py-12"
      >
        <h1 className="sr-only">Invoice manager</h1>
        <Frame dense className="min-w-0">
          <FrameHeader className="flex-row items-center justify-between gap-3 px-4 py-2">
            <div className="min-w-0">
              <FrameTitle>Invoices</FrameTitle>
              <FrameDescription className="max-w-48 text-xs sm:max-w-none">
                What customers owe, when they’ll pay and what to do next
              </FrameDescription>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                ref={newInvoiceButton}
                size="icon-sm"
                variant="ghost"
                aria-label="New invoice"
                onClick={(event) => addInvoice(event.currentTarget)}
              >
                <Plus />
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-label="Export"
                disabled={!visible.length}
                onClick={() => exportInvoices(visible)}
              >
                <Download data-icon="inline-start" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </FrameHeader>
          <InvoiceOverview rows={ledger.rows} />
          <DataGrid
            table={table}
            recordCount={visible.length}
            emptyMessage={
              <Empty className="invoice-empty min-h-40">
                <EmptyHeader>
                  <EmptyTitle>No invoices found</EmptyTitle>
                  <EmptyDescription>
                    Try another search or clear the current filters.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            }
            tableLayout={{
              width: "fixed",
              cellBorder: true,
              rowBorder: true,
              headerBorder: true,
              headerSticky: true,
              headerBackground: false,
              columnsVisibility: true,
            }}
            tableClassNames={{ base: "text-sm", bodyRow: "invoice-row", headerRow: "h-8" }}
            className="w-full min-w-0"
          >
            <FramePanel className="p-0">
              <div className="invoice-toolbar flex flex-wrap items-center gap-2 border-b px-4 py-2">
                <div className="invoice-toolbar-section flex min-w-0 items-center gap-2">
                  <InvoiceSelect
                    label="Show invoices"
                    value={scope}
                    options={scopes}
                    onChange={(next) => {
                      setScope(next);
                      setExpanded(true);
                      resetPage();
                    }}
                  />
                  <InvoiceSearch
                    value={search}
                    mobile={mobile}
                    onChange={(value) => {
                      setSearch(value);
                      setExpanded(true);
                      resetPage();
                    }}
                  />
                </div>
                <div className="hidden min-w-0 flex-1 md:block" />
                <div className="invoice-toolbar-section flex min-w-0 items-center gap-2">
                  <Filters
                    fields={filterFields}
                    variant="advanced"
                    advancedMode="popover"
                    advancedAlign={mobile ? "start" : "end"}
                    size="sm"
                    query={query}
                    onQueryChange={(next) => {
                      setQuery(next);
                      setExpanded(true);
                      resetPage();
                    }}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Filter data-icon="inline-start" />
                        Filter
                      </Button>
                    }
                  />
                  <InvoiceSelect
                    label="Group rows by"
                    value={grouping}
                    options={groupItems}
                    prefix="Group"
                    onChange={(next) => {
                      setGrouping(next);
                      setExpanded(true);
                      resetPage();
                    }}
                  />
                </div>
                <div className="invoice-toolbar-section flex min-w-0 items-center gap-2">
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    spacing={0}
                    value={timelineWindow}
                    aria-label="Timeline window"
                    onValueChange={(value) => {
                      if (value === "month" || value === "quarter") setTimelineWindow(value);
                    }}
                  >
                    <ToggleGroupItem value="month">Month</ToggleGroupItem>
                    <ToggleGroupItem value="quarter">Quarter</ToggleGroupItem>
                  </ToggleGroup>
                  <DataGridColumnVisibility
                    table={table}
                    trigger={
                      <Button variant="outline" size="icon-sm" aria-label="Columns">
                        <Columns3 />
                      </Button>
                    }
                  />
                </div>
                {!!selectedRows.length && (
                  <div className="flex w-full flex-wrap items-center gap-2 border-t pt-2 text-xs">
                    <span className="mr-auto">{selectedRows.length} selected</span>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => exportInvoices(selectedRows)}
                    >
                      <Download data-icon="inline-start" />
                      Export selected
                    </Button>
                    <Button
                      variant="destructive"
                      size="xs"
                      onClick={(event) =>
                        requestDelete(
                          selectedRows.map((invoice) => invoice.id),
                          event.currentTarget,
                        )
                      }
                    >
                      <Trash2 data-icon="inline-start" />
                      Delete selected
                    </Button>
                  </div>
                )}
              </div>
              <DataGridContainer className="min-w-0 rounded-none border-0">
                <DataGridScrollArea orientation="horizontal">
                  <DataGridTableViewport>
                    <DataGridTableBase>
                      <DataGridTableHead>
                        {table.getHeaderGroups().map((group) => (
                          <DataGridTableHeadRow key={group.id} rowId={group.id}>
                            {group.headers.map((header) => (
                              <DataGridTableHeadRowCell header={header} key={header.id}>
                                {renderDataGridTableHeadCellContent(header)}
                              </DataGridTableHeadRowCell>
                            ))}
                          </DataGridTableHeadRow>
                        ))}
                      </DataGridTableHead>
                      <DataGridTableBody>
                        {table
                          .getRowModel()
                          .rows.map((row) =>
                            "invoice" in row.original ? (
                              <DataGridTableRenderedRow row={row} key={row.id} />
                            ) : (
                              <GroupHeading
                                key={row.id}
                                row={row}
                                columns={table.getVisibleLeafColumns().length}
                              />
                            ),
                          )}
                        {!visible.length && <DataGridTableEmpty />}
                      </DataGridTableBody>
                    </DataGridTableBase>
                  </DataGridTableViewport>
                </DataGridScrollArea>
              </DataGridContainer>
              <DataGridPagination
                sizes={[10, 20, 50, 100]}
                more
                info="Showing {from} to {to} of {count} invoices"
                className="invoice-pagination flex-wrap border-t px-4 py-2"
              />
            </FramePanel>
          </DataGrid>
        </Frame>
      </section>
      {detail && (
        <InvoiceDetails
          actionsRef={detailActions}
          invoice={detail}
          invoices={ledger.rows}
          onOpenRelated={setDetailId}
          onClose={() => setDetailId(undefined)}
          onRestore={restoreDetailFocus}
          onEdit={() => editInvoice(detail)}
          onDelete={(trigger) => requestDelete([detail.id], trigger)}
          onAction={(action, trigger) => openAction(detail, action, trigger)}
          onRecord={({ amount, day, method }) => recordPayment(detail, amount, day, method)}
          onAutomatic={(automatic) =>
            changeInvoice(
              detail.id,
              (current) => ({ ...current, automatic }),
              automatic ? "Automatic reminders on" : "Automatic reminders paused",
            )
          }
        />
      )}
      {panelContent}
    </TooltipProvider>
  );
}
