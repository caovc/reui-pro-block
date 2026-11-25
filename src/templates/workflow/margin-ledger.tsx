import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { ArrowDown, ArrowUp, Download, Plus, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline";
import {
  DomainRecordGrid,
  type DomainField,
  type DomainTable,
} from "@/blocks/data/grid-advanced-model-grid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatMarginMoney } from "./margin-currency";
import {
  applyInvoiceAction,
  approveJournal,
  bookSeries,
  buildLedger,
  createInvoice,
  evaluateRules,
  financeCsv,
  invoiceBalance,
  invoiceLane,
  lockPeriod,
  submitJournal,
  type Account,
  type ControlAction,
  type ControlRule,
  type Invoice,
  type InvoiceAction,
  type InvoiceDraft,
  type InvoiceLane,
  type LedgerEntry,
  type MarginBook,
  type MarginPageProps,
} from "./margin-model";

const laneLabels: Record<InvoiceLane, string> = {
  "needs-you": "Needs attention",
  waiting: "Awaiting reply",
  "next-30-days": "Due within 30 days",
  settled: "Settled",
};
const accountLabels: Record<Account, string> = {
  cash: "Cash",
  receivables: "Accounts receivable",
  revenue: "Revenue",
  "direct-cost": "Direct costs",
  operating: "Operating costs",
  equity: "Equity",
};
const actionLabels: Record<ControlAction["kind"], string> = {
  "manual-journal": "Manual journal",
  "invoice-writeoff": "Invoice write-off",
  "data-export": "Data export",
};
const invoiceActions: { value: InvoiceAction["kind"]; label: string }[] = [
  { value: "payment", label: "Record payment" },
  { value: "reminder", label: "Log reminder" },
  { value: "promise", label: "Record payment promise" },
  { value: "dispute", label: "Record dispute" },
  { value: "resolve-dispute", label: "Resolve dispute" },
  { value: "credit", label: "Issue credit note" },
  { value: "writeoff", label: "Write off balance" },
  { value: "note", label: "Add note" },
];
const planOptions = ["Essential", "Studio", "Partner"].map((value) => ({ value, label: value }));
const accountOptions = Object.entries(accountLabels).map(([value, label]) => ({ value, label }));
const controlOptions = Object.entries(actionLabels).map(([value, label]) => ({ value, label }));

function downloadFile(filename: string, value: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field className="min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function MoneyField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NumberField
        id={id}
        value={value / 100}
        onValueChange={(next) => onChange(Math.round((next ?? 0) * 100))}
        min={0}
        max={1_000_000_000}
        step={0.01}
        format={{ style: "currency", currency: "USD" }}
      >
        <NumberFieldGroup>
          <NumberFieldInput className="text-start" />
        </NumberFieldGroup>
      </NumberField>
    </Field>
  );
}

function Feedback({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return children ? (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-md border px-3 py-2 text-sm ${error ? "border-destructive/40 text-destructive" : "bg-muted/40"}`}
    >
      {children}
    </p>
  ) : null;
}

function tableFrame<T extends object>(title: string, description: string, actions?: ReactNode) {
  return (content: ReactNode, table: DomainTable<T>) => (
    <Frame className="min-w-0">
      <FrameHeader className="flex-wrap gap-3">
        <div className="min-w-0">
          <FrameTitle>{title}</FrameTitle>
          <FrameDescription>{description}</FrameDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <DataGridColumnVisibility
            table={table}
            trigger={
              <Button variant="outline" size="sm">
                <SlidersHorizontal /> Columns
              </Button>
            }
          />
        </div>
      </FrameHeader>
      {content}
    </Frame>
  );
}

function InvoiceCreate({
  book,
  open,
  onOpenChange,
  onCreate,
}: {
  book: MarginBook;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onCreate: (draft: InvoiceDraft) => void;
}) {
  const [plan, setPlan] = useState("Studio");
  const [amount, setAmount] = useState(250_000);
  const [cost, setCost] = useState(70_000);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      onCreate({
        customer: String(data.get("customer") ?? ""),
        plan: plan as InvoiceDraft["plan"],
        issuedOn: book.asOf,
        dueOn: String(data.get("due") ?? ""),
        netCents: amount,
        costCents: cost,
      });
      setError("");
      onOpenChange(false);
    } catch (fault) {
      setError((fault as Error).message);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create local invoice</DialogTitle>
          <DialogDescription>
            Issued on {book.asOf}. This updates these local books.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Field>
            <FieldLabel htmlFor="margin-new-customer">Customer</FieldLabel>
            <Input id="margin-new-customer" name="customer" required />
          </Field>
          <SelectField
            id="margin-new-plan"
            label="Plan"
            value={plan}
            onChange={setPlan}
            options={planOptions}
          />
          <div className="margin-field-grid">
            <MoneyField
              id="margin-new-amount"
              label="Invoice amount"
              value={amount}
              onChange={setAmount}
            />
            <MoneyField
              id="margin-new-cost"
              label="Direct delivery cost"
              value={cost}
              onChange={setCost}
            />
          </div>
          <Field>
            <FieldLabel htmlFor="margin-new-due">Due date</FieldLabel>
            <Input
              id="margin-new-due"
              name="due"
              type="date"
              defaultValue="2026-12-04"
              min={book.asOf}
              required
            />
          </Field>
          <Feedback error>{error}</Feedback>
          <Button type="submit">Create invoice</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetail({
  book,
  invoice,
  opener,
  onClose,
  onChange,
}: {
  book: MarginBook;
  invoice: Invoice | undefined;
  opener: RefObject<HTMLElement | null>;
  onClose: () => void;
  onChange: (book: MarginBook) => void;
}) {
  const [action, setAction] = useState<InvoiceAction["kind"]>("payment");
  const [amount, setAmount] = useState(10_000);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoice) return;
    const data = new FormData(event.currentTarget);
    try {
      onChange(
        applyInvoiceAction(book, invoice.id, {
          kind: action,
          date: book.asOf,
          note: String(data.get("note") ?? ""),
          amountCents: ["payment", "credit", "writeoff"].includes(action) ? amount : undefined,
          promisedOn: String(data.get("promise") ?? "") || undefined,
        }),
      );
      setError("");
      setMessage("Activity recorded in the local books.");
    } catch (fault) {
      setError((fault as Error).message);
      setMessage("");
    }
  }
  return (
    <Dialog open={Boolean(invoice)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"
        onCloseAutoFocus={(event) => {
          if (opener.current?.isConnected) {
            event.preventDefault();
            opener.current.focus();
          }
        }}
      >
        {invoice && (
          <>
            <DialogHeader>
              <DialogTitle>
                {invoice.id} · {invoice.customer}
              </DialogTitle>
              <DialogDescription>
                Due {invoice.dueOn} · {formatMarginMoney(invoiceBalance(invoice))} outstanding
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="grid gap-4">
              <SelectField
                id="margin-invoice-action"
                label="Collection action"
                value={action}
                onChange={(next) => {
                  setAction(next as InvoiceAction["kind"]);
                  setError("");
                  setMessage("");
                }}
                options={invoiceActions}
              />
              {["payment", "credit", "writeoff"].includes(action) && (
                <MoneyField
                  id="margin-action-amount"
                  label="Amount"
                  value={amount}
                  onChange={setAmount}
                />
              )}
              {action === "promise" && (
                <Field>
                  <FieldLabel htmlFor="margin-promise">Promised payment date</FieldLabel>
                  <Input id="margin-promise" name="promise" type="date" min={book.asOf} required />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="margin-collection-note">Activity note</FieldLabel>
                <Textarea
                  id="margin-collection-note"
                  name="note"
                  required
                  placeholder="Record the next step or payment reference"
                />
              </Field>
              <Feedback error>{error}</Feedback>
              <Feedback>{message}</Feedback>
              <Button type="submit">Record activity</Button>
            </form>
            <div className="border-t pt-4">
              <h3 className="mb-4 font-medium">Invoice history</h3>
              {invoice.activities.length ? (
                <Timeline defaultValue={invoice.activities.length}>
                  {invoice.activities.map((item, index) => (
                    <TimelineItem key={index} step={index + 1}>
                      <TimelineHeader>
                        <TimelineSeparator />
                        <TimelineDate>{item.date}</TimelineDate>
                        <TimelineTitle>
                          {invoiceActions.find((entry) => entry.value === item.kind)?.label}
                        </TimelineTitle>
                        <TimelineIndicator />
                      </TimelineHeader>
                      <TimelineContent>
                        {item.note}
                        {["payment", "credit", "writeoff"].includes(item.kind) && item.amountCents
                          ? ` · ${formatMarginMoney(item.amountCents)}`
                          : ""}
                        {item.promisedOn ? ` · Promised ${item.promisedOn}` : ""}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              ) : (
                <p className="text-sm text-muted-foreground">No collection activity recorded.</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MarginReceivables({ book, onBookChange: setBook }: MarginPageProps) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
  const [period, setPeriod] = useState("2026-11");
  const [plan, setPlan] = useState("all");
  const [lane, setLane] = useState("open");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const opener = useRef<HTMLElement | null>(null);
  const filtered = book.invoices.filter(
    (invoice) =>
      (period === "all" || invoice.issuedOn.startsWith(period)) &&
      (plan === "all" || invoice.plan === plan) &&
      (lane === "all" ||
        (lane === "open"
          ? invoiceBalance(invoice) > 0
          : invoiceLane(invoice, book.asOf) === lane)) &&
      `${invoice.id} ${invoice.customer} ${invoice.plan}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const fields: DomainField<Invoice>[] = [
    { id: "invoice", title: "Invoice", value: (invoice) => invoice.id, size: 120, hideable: false },
    { id: "customer", title: "Customer", value: (invoice) => invoice.customer, size: 200 },
    { id: "plan", title: "Plan", value: (invoice) => invoice.plan, size: 110 },
    { id: "due", title: "Due", value: (invoice) => invoice.dueOn, size: 120 },
    {
      id: "outstanding",
      title: "Outstanding",
      value: invoiceBalance,
      render: (invoice) => (
        <span className="margin-number">{formatMarginMoney(invoiceBalance(invoice))}</span>
      ),
      size: 145,
    },
    {
      id: "status",
      title: "Next step",
      value: (invoice) => invoiceLane(invoice, book.asOf),
      render: (invoice) => (
        <Badge
          variant={invoiceLane(invoice, book.asOf) === "needs-you" ? "warning-light" : "secondary"}
        >
          {laneLabels[invoiceLane(invoice, book.asOf)]}
        </Badge>
      ),
      size: 170,
    },
    {
      id: "actions",
      title: "Activity",
      value: (invoice) => invoice.id,
      hideable: false,
      size: 110,
      render: (invoice) => (
        <Button
          size="sm"
          variant="outline"
          aria-label={`View ${invoice.id}`}
          onClick={(event) => {
            opener.current = event.currentTarget;
            setSelected(invoice.id);
          }}
        >
          View
        </Button>
      ),
    },
  ];
  function exportInvoices() {
    downloadFile(
      "ledger-studio-invoices.csv",
      financeCsv(
        ["Invoice", "Customer", "Plan", "Due", "Net USD", "Open USD", "Next step"],
        filtered.map((invoice) => [
          invoice.id,
          invoice.customer,
          invoice.plan,
          invoice.dueOn,
          invoice.netCents / 100,
          invoiceBalance(invoice) / 100,
          laneLabels[invoiceLane(invoice, book.asOf)],
        ]),
      ),
    );
  }
  return (
    <>
      <div className="margin-field-grid">
        <Field>
          <FieldLabel htmlFor="margin-invoice-search">Search invoices</FieldLabel>
          <Input
            id="margin-invoice-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Customer or invoice number"
          />
        </Field>
        <SelectField
          id="margin-invoice-period"
          label="Invoice period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "all", label: "All periods" },
            ...bookSeries(book).map((row) => ({ value: row.month, label: row.month })),
          ]}
        />
        <SelectField
          id="margin-invoice-plan"
          label="Invoice plan"
          value={plan}
          onChange={setPlan}
          options={[{ value: "all", label: "All plans" }, ...planOptions]}
        />
      </div>
      <Tabs value={lane} onValueChange={setLane}>
        <TabsList className="h-auto w-full flex-wrap justify-start">
          <TabsTrigger className="h-auto" value="open">
            Open
          </TabsTrigger>
          <TabsTrigger className="h-auto" value="needs-you">
            Needs attention
          </TabsTrigger>
          <TabsTrigger className="h-auto" value="waiting">
            Awaiting reply
          </TabsTrigger>
          <TabsTrigger className="h-auto" value="next-30-days">
            Due soon
          </TabsTrigger>
          <TabsTrigger className="h-auto" value="all">
            All invoices
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Feedback>{message}</Feedback>
      <DomainRecordGrid
        data={filtered}
        fields={fields}
        pagination={pagination}
        onPaginationChange={setPagination}
        getRowId={(invoice) => invoice.id}
        scrollArea="horizontal"
        paginationControls={{ noun: "invoices", sizes: [5, 10, 25] }}
        renderFrame={tableFrame<Invoice>(
          "Collection worklist",
          `${filtered.length} invoices · ${formatMarginMoney(filtered.reduce((total, invoice) => total + invoiceBalance(invoice), 0))} outstanding`,
          <>
            <Button variant="outline" size="sm" onClick={exportInvoices}>
              <Download /> Export invoices
            </Button>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus /> New invoice
            </Button>
          </>,
        )}
      />
      <InvoiceCreate
        book={book}
        open={creating}
        onOpenChange={setCreating}
        onCreate={(draft) => {
          setBook(createInvoice(book, draft));
          setMessage("Invoice added to these local books.");
        }}
      />
      <InvoiceDetail
        key={selected}
        book={book}
        invoice={book.invoices.find((invoice) => invoice.id === selected)}
        opener={opener}
        onClose={() => setSelected(null)}
        onChange={setBook}
      />
    </>
  );
}

function JournalCreate({
  book,
  open,
  onOpenChange,
  onSubmit,
  opener,
}: {
  book: MarginBook;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSubmit: (book: MarginBook) => void;
  opener: RefObject<HTMLButtonElement | null>;
}) {
  const [debit, setDebit] = useState<Account>("cash");
  const [credit, setCredit] = useState<Account>("equity");
  const [amount, setAmount] = useState(2_500_000);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      if (debit === credit) throw new Error("Choose two different accounts.");
      onSubmit(
        submitJournal(book, {
          date: String(data.get("date") ?? ""),
          memo: String(data.get("memo") ?? ""),
          lines: [
            { account: debit, debitCents: amount, creditCents: 0 },
            { account: credit, debitCents: 0, creditCents: amount },
          ],
        }),
      );
      setError("");
      onOpenChange(false);
    } catch (fault) {
      setError((fault as Error).message);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={(event) => {
          const trigger = opener.current;
          if (trigger?.isConnected) {
            event.preventDefault();
            trigger.focus({ preventScroll: true });
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>New balanced journal</DialogTitle>
          <DialogDescription>
            The local approval rules determine whether this posts or waits for review.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <Field>
            <FieldLabel htmlFor="margin-journal-memo">Description</FieldLabel>
            <Input id="margin-journal-memo" name="memo" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="margin-journal-date">Posting date</FieldLabel>
            <Input
              id="margin-journal-date"
              name="date"
              type="date"
              defaultValue={book.asOf}
              max={book.asOf}
              required
            />
          </Field>
          <div className="margin-field-grid">
            <SelectField
              id="margin-journal-debit"
              label="Debit account"
              value={debit}
              onChange={(value) => setDebit(value as Account)}
              options={accountOptions}
            />
            <SelectField
              id="margin-journal-credit"
              label="Credit account"
              value={credit}
              onChange={(value) => setCredit(value as Account)}
              options={accountOptions}
            />
          </div>
          <MoneyField
            id="margin-journal-amount"
            label="Balanced amount"
            value={amount}
            onChange={setAmount}
          />
          <Feedback error>{error}</Feedback>
          <Button type="submit">Submit journal</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MarginTransactions({ book, onBookChange: setBook }: MarginPageProps) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [period, setPeriod] = useState("2026-11");
  const [account, setAccount] = useState("all");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const journalTrigger = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const rows = buildLedger(book).filter(
    (entry) =>
      (period === "all" || entry.date.startsWith(period)) &&
      (account === "all" || entry.account === account) &&
      `${entry.memo} ${entry.source} ${entry.account}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const fields: DomainField<LedgerEntry>[] = [
    { id: "date", title: "Date", value: (entry) => entry.date, size: 120 },
    { id: "source", title: "Reference", value: (entry) => entry.source, size: 130 },
    { id: "memo", title: "Description", value: (entry) => entry.memo, size: 235 },
    { id: "account", title: "Account", value: (entry) => accountLabels[entry.account], size: 170 },
    {
      id: "debit",
      title: "Debit",
      value: (entry) => entry.debitCents,
      render: (entry) => formatMarginMoney(entry.debitCents),
      size: 140,
    },
    {
      id: "credit",
      title: "Credit",
      value: (entry) => entry.creditCents,
      render: (entry) => formatMarginMoney(entry.creditCents),
      size: 140,
    },
  ];
  function mutate(operation: () => MarginBook, success: string) {
    try {
      setBook(operation());
      setError("");
      setMessage(success);
    } catch (fault) {
      setError((fault as Error).message);
      setMessage("");
    }
  }
  return (
    <>
      <div className="margin-field-grid">
        <Field>
          <FieldLabel htmlFor="margin-ledger-search">Search transactions</FieldLabel>
          <Input
            id="margin-ledger-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Description or reference"
          />
        </Field>
        <SelectField
          id="margin-ledger-period"
          label="Ledger period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "all", label: "All periods" },
            ...bookSeries(book).map((row) => ({ value: row.month, label: row.month })),
          ]}
        />
        <SelectField
          id="margin-ledger-account"
          label="Ledger account"
          value={account}
          onChange={setAccount}
          options={[{ value: "all", label: "All accounts" }, ...accountOptions]}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm">
        <span>
          Books locked through <strong>{book.lockedThrough}</strong>
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={book.lockedThrough === "2026-10"}
          onClick={() =>
            mutate(
              () => lockPeriod(book, "2026-10"),
              "October is now locked against new financial postings.",
            )
          }
        >
          {book.lockedThrough === "2026-10" ? "October locked" : "Lock October"}
        </Button>
      </div>
      <Feedback error>{error}</Feedback>
      <Feedback>{message}</Feedback>
      <DomainRecordGrid
        data={rows}
        fields={fields}
        pagination={pagination}
        onPaginationChange={setPagination}
        getRowId={(entry) => entry.id}
        scrollArea="horizontal"
        paginationControls={{ noun: "postings", sizes: [10, 25, 50] }}
        renderFrame={tableFrame<LedgerEntry>(
          "Posted ledger",
          `${rows.length} double-entry postings match this view`,
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadFile(
                  "ledger-studio-transactions.csv",
                  financeCsv(
                    ["Date", "Reference", "Description", "Account", "Debit USD", "Credit USD"],
                    rows.map((entry) => [
                      entry.date,
                      entry.source,
                      entry.memo,
                      accountLabels[entry.account],
                      entry.debitCents / 100,
                      entry.creditCents / 100,
                    ]),
                  ),
                )
              }
            >
              <Download /> Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadFile(
                  "ledger-studio-transactions.json",
                  JSON.stringify(rows, null, 2),
                  "application/json",
                )
              }
            >
              Export JSON
            </Button>
            <Button ref={journalTrigger} size="sm" onClick={() => setCreating(true)}>
              <Plus /> New journal
            </Button>
          </>,
        )}
      />
      {book.journals.some((journal) => journal.status !== "posted") && (
        <Frame>
          <FrameHeader>
            <FrameTitle>Journal review</FrameTitle>
            <FrameDescription>Held entries do not affect posted balances.</FrameDescription>
          </FrameHeader>
          <FramePanel className="grid gap-3">
            {book.journals
              .filter((journal) => journal.status !== "posted")
              .map((journal) => (
                <div
                  key={journal.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {journal.id} · {journal.memo}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatMarginMoney(
                        journal.lines.reduce((total, line) => total + line.debitCents, 0),
                      )}{" "}
                      ·{" "}
                      {journal.status === "review"
                        ? "Awaiting finance review"
                        : "Blocked by local policy"}
                    </p>
                  </div>
                  {journal.status === "review" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        mutate(
                          () => approveJournal(book, journal.id),
                          `${journal.id} approved and posted locally.`,
                        )
                      }
                    >
                      Approve {journal.id}
                    </Button>
                  )}
                </div>
              ))}
          </FramePanel>
        </Frame>
      )}
      <JournalCreate
        book={book}
        open={creating}
        onOpenChange={setCreating}
        opener={journalTrigger}
        onSubmit={(next) => {
          setBook(next);
          const last = next.journals.at(-1)!;
          setMessage(
            `${last.id} ${last.status === "posted" ? "posted" : last.status === "review" ? "is awaiting review" : "was blocked"}.`,
          );
          setError("");
        }}
      />
    </>
  );
}

type RuleLog = {
  id: string;
  kind: ControlAction["kind"];
  amountCents: number;
  result: ReturnType<typeof evaluateRules>;
};

function RuleEditor({
  rule,
  open,
  onClose,
  onSave,
}: {
  rule: ControlRule | undefined;
  open: boolean;
  onClose: () => void;
  onSave: (rule: Omit<ControlRule, "id">) => void;
}) {
  const [kind, setKind] = useState(rule?.kind ?? "manual-journal");
  const [verdict, setVerdict] = useState(rule?.verdict ?? "review");
  const [amount, setAmount] = useState(rule?.aboveCents ?? 2_000_000);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") ?? "").trim();
    if (!name) {
      setError("Enter a rule name.");
      return;
    }
    onSave({ name, enabled: rule?.enabled ?? true, kind, aboveCents: amount, verdict });
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit approval rule" : "New approval rule"}</DialogTitle>
          <DialogDescription>
            Rules run in order. The first matching rule decides the local verdict.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <Field>
            <FieldLabel htmlFor="margin-rule-name">Rule name</FieldLabel>
            <Input id="margin-rule-name" name="name" defaultValue={rule?.name} required />
          </Field>
          <SelectField
            id="margin-rule-kind"
            label="Action type"
            value={kind}
            onChange={(next) => setKind(next as ControlRule["kind"])}
            options={[{ value: "any", label: "Any action" }, ...controlOptions]}
          />
          <MoneyField
            id="margin-rule-threshold"
            label="Match amounts greater than"
            value={amount}
            onChange={setAmount}
          />
          <SelectField
            id="margin-rule-verdict"
            label="Verdict"
            value={verdict}
            onChange={(next) => setVerdict(next as ControlRule["verdict"])}
            options={[
              { value: "review", label: "Hold for review" },
              { value: "block", label: "Block action" },
              { value: "allow", label: "Allow action" },
            ]}
          />
          <Feedback error>{error}</Feedback>
          <Button type="submit">Save rule</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MarginControls({ book, onBookChange: setBook }: MarginPageProps) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
  const [kind, setKind] = useState<ControlAction["kind"]>("manual-journal");
  const [amount, setAmount] = useState(2_500_000);
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<RuleLog | null>(null);
  const [logs, setLogs] = useState<RuleLog[]>([]);
  const [filter, setFilter] = useState("all");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const nextId = useRef(1);
  const ruleId = useRef(
    Math.max(
      0,
      ...book.rules.map((rule) => Number(rule.id.match(/^local-rule-(\d+)$/)?.[1]) || 0),
    ) + 1,
  );
  const traceOpener = useRef<HTMLElement | null>(null);
  const addLog = useCallback(
    (action: ControlAction) => {
      try {
        const result = evaluateRules(book.rules, action);
        const id = `Sample ${nextId.current++}`;
        setLogs((before) => [{ id, ...action, result }, ...before].slice(0, 30));
        setError("");
      } catch (fault) {
        setError((fault as Error).message);
      }
    },
    [book.rules],
  );
  useEffect(() => {
    if (!running) return;
    const samples: ControlAction[] = [
      { kind: "manual-journal", amountCents: 2_500_000 },
      { kind: "data-export", amountCents: 0 },
      { kind: "invoice-writeoff", amountCents: 180_000 },
      { kind: "manual-journal", amountCents: 450_000 },
    ];
    const timer = setInterval(() => addLog(samples[(nextId.current - 1) % samples.length]), 2500);
    return () => clearInterval(timer);
  }, [running, addLog]);
  function moveRule(id: string, delta: number) {
    const rules = [...book.rules];
    const from = rules.findIndex((rule) => rule.id === id);
    const to = from + delta;
    if (to < 0 || to >= rules.length) return;
    [rules[from], rules[to]] = [rules[to], rules[from]];
    setBook({ ...book, rules });
  }
  const visible = logs.filter((log) => filter === "all" || log.result.verdict !== "allow");
  const fields: DomainField<RuleLog>[] = [
    { id: "sample", title: "Sample", value: (log) => log.id, size: 120 },
    { id: "kind", title: "Action", value: (log) => actionLabels[log.kind], size: 175 },
    {
      id: "amount",
      title: "Amount",
      value: (log) => log.amountCents,
      render: (log) => formatMarginMoney(log.amountCents),
      size: 150,
    },
    {
      id: "verdict",
      title: "Verdict",
      value: (log) => log.result.verdict,
      render: (log) => (
        <Badge variant={log.result.verdict === "allow" ? "success-light" : "warning-light"}>
          {log.result.verdict}
        </Badge>
      ),
      size: 120,
    },
    {
      id: "trace",
      title: "Decision trace",
      value: (log) => log.id,
      hideable: false,
      size: 150,
      render: (log) => (
        <Button
          size="sm"
          variant="outline"
          aria-label={`Inspect ${log.id}`}
          onClick={(event) => {
            traceOpener.current = event.currentTarget;
            setSelected(log);
          }}
        >
          Inspect
        </Button>
      ),
    },
  ];
  return (
    <>
      <Frame>
        <FrameHeader>
          <div>
            <FrameTitle>Approval policy</FrameTitle>
            <FrameDescription>
              Reorder, edit or pause rules before running a sample action.
            </FrameDescription>
          </div>
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus /> New rule
          </Button>
        </FrameHeader>
        <FramePanel className="grid gap-4">
          {book.rules.length ? (
            book.rules.map((rule, index) => (
              <div
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {index + 1}. {rule.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {rule.kind === "any" ? "Any action" : actionLabels[rule.kind]} above{" "}
                    {formatMarginMoney(rule.aboveCents)} → {rule.verdict}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Switch
                    aria-label={`Enable ${rule.name}`}
                    checked={rule.enabled}
                    onCheckedChange={(enabled) =>
                      setBook({
                        ...book,
                        rules: book.rules.map((item) =>
                          item.id === rule.id ? { ...item, enabled } : item,
                        ),
                      })
                    }
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Move ${rule.name} up`}
                    disabled={index === 0}
                    onClick={() => moveRule(rule.id, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Move ${rule.name} down`}
                    disabled={index === book.rules.length - 1}
                    onClick={() => moveRule(rule.id, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(rule.id)}>
                    Edit {index + 1}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Delete ${rule.name}`}
                    onClick={() =>
                      setBook({ ...book, rules: book.rules.filter((item) => item.id !== rule.id) })
                    }
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No rules configured. Sample actions will be allowed.
            </p>
          )}
        </FramePanel>
      </Frame>
      <Frame>
        <FrameHeader>
          <FrameTitle>Test an action</FrameTitle>
          <FrameDescription>
            Evaluate a local sample without posting any financial transaction.
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              addLog({ kind, amountCents: amount });
            }}
          >
            <div className="margin-field-grid">
              <SelectField
                id="margin-test-kind"
                label="Test action type"
                value={kind}
                onChange={(next) => setKind(next as ControlAction["kind"])}
                options={controlOptions}
              />
              <MoneyField
                id="margin-test-amount"
                label="Test action amount"
                value={amount}
                onChange={setAmount}
              />
            </div>
            <Feedback error>{error}</Feedback>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Test action</Button>
              <Button type="button" variant="outline" onClick={() => setRunning(!running)}>
                {running ? "Pause demo feed" : "Start demo feed"}
              </Button>
            </div>
          </form>
        </FramePanel>
      </Frame>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All actions</TabsTrigger>
          <TabsTrigger value="flagged">Flagged actions</TabsTrigger>
        </TabsList>
      </Tabs>
      <DomainRecordGrid
        data={visible}
        fields={fields}
        pagination={pagination}
        onPaginationChange={setPagination}
        getRowId={(log) => log.id}
        scrollArea="horizontal"
        paginationControls={{ noun: "actions", sizes: [5, 10, 25] }}
        renderFrame={tableFrame<RuleLog>(
          "Decision log",
          `${visible.length} local samples · ${running ? "One sample every 2.5 seconds" : "Feed paused"}`,
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadFile(
                  "ledger-studio-control-log.csv",
                  financeCsv(
                    ["Sample", "Action", "Amount USD", "Verdict", "Rule"],
                    visible.map((log) => [
                      log.id,
                      actionLabels[log.kind],
                      log.amountCents / 100,
                      log.result.verdict,
                      log.result.ruleId ?? "Default allow",
                    ]),
                  ),
                )
              }
            >
              <Download /> Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadFile(
                  "ledger-studio-control-log.json",
                  JSON.stringify(visible, null, 2),
                  "application/json",
                )
              }
            >
              Export JSON
            </Button>
          </>,
        )}
      />
      {editing && (
        <RuleEditor
          key={editing}
          rule={book.rules.find((rule) => rule.id === editing)}
          open
          onClose={() => setEditing(null)}
          onSave={(rule) =>
            setBook({
              ...book,
              rules:
                editing === "new"
                  ? [...book.rules, { ...rule, id: `local-rule-${ruleId.current++}` }]
                  : book.rules.map((item) =>
                      item.id === editing ? { ...rule, id: item.id } : item,
                    ),
            })
          }
        />
      )}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
          onCloseAutoFocus={(event) => {
            if (traceOpener.current?.isConnected) {
              event.preventDefault();
              traceOpener.current.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{selected?.id} decision trace</DialogTitle>
            <DialogDescription>
              {selected &&
                `${actionLabels[selected.kind]} · ${formatMarginMoney(selected.amountCents)} · ${selected.result.verdict}`}
            </DialogDescription>
          </DialogHeader>
          <ol className="grid gap-3">
            {selected?.result.trace.map((step, index) => (
              <li key={step.ruleId} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {index + 1}. {step.name}
                </p>
                <p className="mt-1 text-muted-foreground">{step.reason}</p>
              </li>
            ))}
          </ol>
          {selected?.result.verdict === "allow" && !selected.result.ruleId && (
            <p className="text-sm">No rule matched. The default decision allows this sample.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
