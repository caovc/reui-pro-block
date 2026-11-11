import { useId, useState, type ReactNode, type RefObject } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowUpRight, CalendarDays, Ellipsis, Minus, Plus, ReceiptText } from "lucide-react";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
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
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  InvoiceBadge,
  InvoiceDateField,
  InvoiceSelect,
} from "./grid-advanced-invoice-manager-controls";
import {
  canSaveInvoice,
  invoiceBalance,
  invoiceCurrencies,
  invoiceCustomer,
  invoiceCustomers,
  invoiceDate,
  invoiceDateIsValid,
  invoiceDaySpan,
  invoiceExpected,
  invoiceMoney,
  invoiceNextStep,
  invoiceOwner,
  invoiceOwners,
  invoicePaid,
  invoiceShift,
  invoiceStatus,
  invoiceStatusBadge,
  invoiceStatusTitles,
  invoiceToday,
  invoiceUsd,
  type Invoice,
  type InvoiceAction,
  type InvoiceCurrency,
} from "./grid-advanced-invoice-manager-model";

const paymentMethods = ["Bank transfer", "Card", "Check", "Other"].map((label) => ({
  value: label,
  label,
}));
const customerOptions = invoiceCustomers.map(({ id, name }) => ({ value: id, label: name }));
const ownerOptions = invoiceOwners.map(({ id, name }) => ({ value: id, label: name }));
const currencyOptions = invoiceCurrencies.map((value) => ({ value, label: value }));

function InvoiceAmountField({
  label,
  cents,
  currency,
  onChange,
  max,
}: {
  label: string;
  cents: number;
  currency: InvoiceCurrency;
  onChange: (cents: number) => void;
  max?: number;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NumberField
        id={id}
        value={cents / 100}
        min={0}
        max={max === undefined ? undefined : max / 100}
        step={0.01}
        format={{ style: "currency", currency, minimumFractionDigits: 2 }}
        onValueChange={(amount) => onChange(Math.round((amount ?? 0) * 100))}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement>
            <Minus />
          </NumberFieldDecrement>
          <NumberFieldInput aria-label={label} inputMode="decimal" />
          <NumberFieldIncrement>
            <Plus />
          </NumberFieldIncrement>
        </NumberFieldGroup>
      </NumberField>
    </Field>
  );
}

export function InvoiceEditor({
  initial,
  rows,
  adding,
  onClose,
  onSave,
  onRestore,
}: {
  initial: Invoice;
  rows: Invoice[];
  adding: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  onRestore: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const id = useId();
  const patch = (value: Partial<Invoice>) => setDraft((current) => ({ ...current, ...value }));
  const allowed = canSaveInvoice(draft, rows);
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className="invoice-editor-sheet gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[480px]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestore();
        }}
      >
        <SheetHeader className="border-b pr-14">
          <SheetTitle>{adding ? "New invoice" : "Edit invoice"}</SheetTitle>
          <SheetDescription>
            {draft.number} ·{" "}
            {adding ? "Create a draft in the local ledger." : "Update invoice details."}
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (allowed)
              onSave({
                ...draft,
                contact: draft.contact.trim(),
                description: draft.description.trim(),
              });
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <FieldGroup className="gap-4">
              <InvoiceSelect
                field
                label="Customer"
                value={draft.customer}
                options={customerOptions}
                onChange={(customer) =>
                  patch({ customer, contact: invoiceCustomer(customer).contact })
                }
              />
              <Field>
                <FieldLabel htmlFor={`${id}-contact`}>Contact</FieldLabel>
                <Input
                  id={`${id}-contact`}
                  required
                  value={draft.contact}
                  maxLength={80}
                  onChange={(event) => patch({ contact: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-description`}>Description</FieldLabel>
                <Input
                  id={`${id}-description`}
                  required
                  value={draft.description}
                  maxLength={120}
                  onChange={(event) => patch({ description: event.target.value })}
                />
              </Field>
              <InvoiceSelect
                field
                label="Owner"
                value={draft.owner}
                options={ownerOptions}
                onChange={(owner) => patch({ owner })}
              />
              <div className="grid grid-cols-2 gap-3">
                {invoicePaid(initial) > 0 ? (
                  <Field>
                    <FieldLabel>Currency</FieldLabel>
                    <span>{draft.currency}</span>
                  </Field>
                ) : (
                  <InvoiceSelect
                    field
                    label="Currency"
                    value={draft.currency}
                    options={currencyOptions}
                    onChange={(currency) => patch({ currency })}
                  />
                )}
                <InvoiceAmountField
                  label="Invoice amount"
                  cents={draft.total}
                  currency={draft.currency}
                  onChange={(total) => patch({ total })}
                />
                <InvoiceDateField
                  label="Issue date"
                  value={draft.issued}
                  max={draft.due}
                  onChange={(issued) => patch({ issued })}
                />
                <InvoiceDateField
                  label="Due date"
                  value={draft.due}
                  min={draft.issued}
                  onChange={(due) => patch({ due })}
                />
              </div>
            </FieldGroup>
          </div>
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!allowed}>
              {adding ? "Create Draft" : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

type Payment = { amount: number; day: string; method: string };

function RecordPayment({
  invoice,
  onRecord,
}: {
  invoice: Invoice;
  onRecord: (payment: Payment) => void;
}) {
  const balance = invoiceBalance(invoice);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(balance);
  const [day, setDay] = useState(invoiceToday);
  const [method, setMethod] = useState(paymentMethods[0]!.value);
  const allowed =
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    amount <= balance &&
    invoiceDateIsValid(day) &&
    day >= invoice.issued &&
    day <= invoiceToday;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setAmount(balance);
          setDay(invoiceToday);
          setMethod(paymentMethods[0]!.value);
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline">Record Payment</Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-[min(21rem,calc(100vw-2rem))]"
        aria-label="Record Payment"
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!allowed) return;
            onRecord({ amount, day, method });
            setOpen(false);
          }}
        >
          <div>
            <h2 className="font-medium">Record Payment</h2>
            <p className="text-xs text-muted-foreground">
              {invoice.number} owes {invoiceMoney(balance, invoice.currency, true)}.
            </p>
          </div>
          <FieldGroup className="gap-3">
            <InvoiceAmountField
              label="Amount received"
              cents={amount}
              currency={invoice.currency}
              max={balance}
              onChange={setAmount}
            />
            <InvoiceDateField
              label="Received on"
              value={day}
              min={invoice.issued}
              max={invoiceToday}
              onChange={setDay}
            />
            <InvoiceSelect
              field
              label="Method"
              value={method}
              options={paymentMethods}
              onChange={setMethod}
            />
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button size="sm" type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={!allowed}>
              Record
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export function InvoiceConfirmation({
  title,
  action,
  description,
  danger,
  onClose,
  onConfirm,
  onRestore,
}: {
  title: string;
  action: string;
  description: ReactNode;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRestore: () => void;
}) {
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestore();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant={danger ? "destructive" : "default"} onClick={onConfirm}>
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type Followup = { note: string; promise: string };

export function InvoiceFollowup({
  kind,
  invoice,
  onClose,
  onSave,
  onRestore,
}: {
  kind: "call" | "dispute";
  invoice: Invoice;
  onClose: () => void;
  onSave: (followup: Followup) => void;
  onRestore: () => void;
}) {
  const id = useId();
  const [note, setNote] = useState("");
  const [promise, setPromise] = useState("");
  const allowed =
    !!note.trim() && (!promise || (invoiceDateIsValid(promise) && promise >= invoiceToday));
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestore();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {kind === "call" ? `Call ${invoice.contact}` : "Review Dispute"}
          </DialogTitle>
          <DialogDescription>
            {kind === "call"
              ? "Record the conversation and an agreed payment date."
              : "Record the outcome before reopening this invoice."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (allowed) onSave({ note: note.trim(), promise });
          }}
        >
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor={id}>
                {kind === "call" ? "Call notes" : "Resolution notes"}
              </FieldLabel>
              <Textarea
                id={id}
                value={note}
                maxLength={400}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
            {kind === "call" && (
              <InvoiceDateField
                label="Promised payment date"
                value={promise}
                min={invoiceToday}
                onChange={setPromise}
              />
            )}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!allowed}>
              {kind === "call" ? "Log Call" : "Resolve Dispute"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentHistoryChart({ invoices }: { invoices: Invoice[] }) {
  const chart = invoices
    .flatMap((invoice) => {
      if (invoiceStatus(invoice) !== "paid") return [];
      const final = invoice.events.filter((event) => event.type === "payment").at(-1);
      return final ? [{ day: final.day, late: invoiceDaySpan(invoice.due, final.day) }] : [];
    })
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-8)
    .map((point) => ({ ...point, label: invoiceDate(point.day) }));

  return (
    <Frame spacing="sm">
      <FrameHeader>
        <FrameTitle>How They Pay</FrameTitle>
        <FrameDescription>Days late, last {chart.length} paid invoices</FrameDescription>
      </FrameHeader>
      <FramePanel>
        {chart.length ? (
          <ChartContainer
            role="img"
            aria-label={`Days late on the last ${chart.length} invoices`}
            config={{ late: { label: "Days late", color: "var(--color-info)" } }}
            className="h-32 w-full"
            initialDimension={{ width: 360, height: 128 }}
          >
            <BarChart data={chart} margin={{ top: 4, right: 4, bottom: 2, left: 2 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={13} />
              <YAxis width={27} tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="late"
                fill="var(--color-late)"
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No settled invoices for this customer.</p>
        )}
      </FramePanel>
    </Frame>
  );
}

const reminderSchedule = [
  { label: "1 Day Late", offset: 1 },
  { label: "1 Week Late", offset: 7 },
  { label: "2 Weeks Late", offset: 14 },
  { label: "Final Notice", offset: 36 },
];

function InvoiceReminders({
  invoice,
  onAutomatic,
}: {
  invoice: Invoice;
  onAutomatic: (automatic: boolean) => void;
}) {
  const sent = invoice.events.filter((event) => event.type === "reminder");
  const available = invoiceBalance(invoice) > 0 && invoice.stage === "open";
  return (
    <Frame spacing="sm">
      <FrameHeader className="flex-row items-center justify-between gap-3">
        <div>
          <FrameTitle>Reminders</FrameTitle>
          <FrameDescription>{sent.length} sent</FrameDescription>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Auto
          <Switch
            checked={invoice.automatic}
            disabled={!available}
            onCheckedChange={onAutomatic}
            aria-label="Automatic reminders"
          />
        </label>
      </FrameHeader>
      <FramePanel>
        <ItemGroup className="gap-1">
          {reminderSchedule.map(({ label, offset }, index) => {
            const reminder = sent[index];
            return (
              <Item role="listitem" key={label} size="xs" className="gap-1 px-0 py-1">
                <ItemContent>
                  <ItemTitle>{label}</ItemTitle>
                  <ItemDescription>
                    {invoiceDate(reminder?.day ?? invoiceShift(invoice.due, offset))}
                  </ItemDescription>
                </ItemContent>
                <InvoiceBadge
                  label={
                    reminder ? "Sent" : invoice.automatic && available ? "Scheduled" : "Paused"
                  }
                  tone={reminder ? "good" : "neutral"}
                />
              </Item>
            );
          })}
        </ItemGroup>
      </FramePanel>
    </Frame>
  );
}

export function InvoiceDetails({
  actionsRef,
  invoice,
  invoices,
  onOpenRelated,
  onClose,
  onEdit,
  onDelete,
  onAction,
  onRecord,
  onAutomatic,
  onRestore,
}: {
  actionsRef: RefObject<HTMLButtonElement | null>;
  invoice: Invoice;
  invoices: Invoice[];
  onOpenRelated: (id: string) => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (trigger: HTMLElement) => void;
  onAction: (action: InvoiceAction, trigger: HTMLElement) => void;
  onRecord: (payment: Payment) => void;
  onAutomatic: (automatic: boolean) => void;
  onRestore: () => void;
}) {
  const customer = invoiceCustomer(invoice.customer);
  const expected = invoiceExpected(invoice);
  const status = invoiceStatusBadge(invoice);
  const next = invoiceNextStep(invoice);
  const matching = invoices
    .filter((item) => item.customer === invoice.customer)
    .toSorted((a, b) => b.issued.localeCompare(a.issued));
  const history = matching.slice(0, 5);
  const totalOpen = matching.reduce(
    (total, item) =>
      total + (item.stage === "draft" ? 0 : invoiceUsd(invoiceBalance(item), item.currency)),
    0,
  );
  const outstanding = invoiceBalance(invoice) > 0 && invoice.stage !== "draft";
  const owner = invoiceOwner(invoice.owner);
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className="invoice-detail-sheet gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[500px]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestore();
        }}
      >
        <SheetHeader className="border-b pr-14">
          <div className="flex min-w-0 items-center gap-3">
            <IconTile
              size="sm"
              variant="soft"
              data-invoice-tone={customer.tone}
              className="invoice-tone-text"
            >
              <ReceiptText />
            </IconTile>
            <div className="min-w-0">
              <SheetTitle className="truncate">{customer.name}</SheetTitle>
              <SheetDescription>
                {invoice.number} · {customer.sector}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 p-4">
            <Frame spacing="sm">
              <FrameHeader className="flex-row items-center justify-between gap-2">
                <FrameTitle>{invoice.number}</FrameTitle>
                <InvoiceBadge {...status} />
              </FrameHeader>
              <FramePanel className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Balance due</p>
                    <strong className="text-xl tabular-nums">
                      {invoiceMoney(invoiceBalance(invoice), invoice.currency)}
                    </strong>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expected</p>
                    <p className="font-medium">
                      {expected.day ? invoiceDate(expected.day) : "No date"}
                    </p>
                    <InvoiceBadge label={expected.label} tone={expected.tone} />
                  </div>
                </div>
                <Separator />
                <p className="text-sm">{invoice.description}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{invoice.contact}</span>
                  <span>{owner.name}</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" /> Due {invoiceDate(invoice.due)}
                  </span>
                </div>
              </FramePanel>
            </Frame>
            <Frame spacing="sm">
              <FrameHeader>
                <FrameTitle>Invoice History</FrameTitle>
                <FrameDescription>Recent invoices for this customer</FrameDescription>
              </FrameHeader>
              <FramePanel>
                <ItemGroup className="gap-1">
                  {history.map((entry) => (
                    <Item
                      role="listitem"
                      key={entry.id}
                      size="xs"
                      variant={entry.id === invoice.id ? "muted" : "default"}
                      className="px-2 py-1.5"
                    >
                      <ItemContent>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="-ml-1 h-auto justify-start px-1"
                          aria-current={entry.id === invoice.id ? "true" : undefined}
                          onClick={() => onOpenRelated(entry.id)}
                        >
                          {entry.number}
                          <ArrowUpRight data-icon="inline-end" />
                        </Button>
                        <ItemDescription>{entry.description}</ItemDescription>
                      </ItemContent>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="tabular-nums">
                          {invoiceMoney(entry.total, entry.currency)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {invoiceStatusTitles[invoiceStatus(entry)]}
                        </span>
                      </div>
                    </Item>
                  ))}
                </ItemGroup>
                <p className="mt-2 flex justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
                  <span>
                    {history.length} of {matching.length} invoices
                  </span>
                  <span>{invoiceMoney(totalOpen)} open</span>
                </p>
              </FramePanel>
            </Frame>
            <PaymentHistoryChart invoices={matching} />
            <InvoiceReminders invoice={invoice} onAutomatic={onAutomatic} />
          </div>
        </div>
        <SheetFooter className="flex-row flex-wrap items-center justify-end gap-2 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                ref={actionsRef}
                variant="outline"
                size="icon-sm"
                aria-label={`More actions for ${invoice.number}`}
                className="mr-auto"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={onEdit}>Edit Invoice</DropdownMenuItem>
                {outstanding && invoice.stage === "open" && (
                  <DropdownMenuItem
                    onSelect={() => {
                      const trigger = actionsRef.current;
                      if (trigger) onAction("resend", trigger);
                    }}
                  >
                    Resend Invoice
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    const trigger = actionsRef.current;
                    if (trigger) onDelete(trigger);
                  }}
                >
                  Delete Invoice
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {outstanding && <RecordPayment key={invoice.id} invoice={invoice} onRecord={onRecord} />}
          {next.action && (
            <Button onClick={(event) => onAction(next.action!, event.currentTarget)}>
              {next.label}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
