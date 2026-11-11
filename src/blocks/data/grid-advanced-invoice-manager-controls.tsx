import { useEffect, useId, useRef, useState } from "react";
import {
  Activity,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  CodeXml,
  Coffee,
  Hotel,
  Mail,
  Paintbrush,
  PanelsTopLeft,
  Search,
  ShoppingBasket,
  TentTree,
  Truck,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/reui/badge";
import { CalendarSelect } from "@/components/reui/calendar-select";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  invoiceBalance,
  invoiceCustomer,
  invoiceDate,
  invoiceDaySpan,
  invoiceMoney,
  invoiceOwner,
  invoiceOwners,
  invoicePaid,
  invoiceStatus,
  invoiceStatusBadge,
  invoiceToday,
  invoiceUsd,
  type Invoice,
  type InvoiceTone,
  type InvoiceWindow,
} from "./grid-advanced-invoice-manager-model";

const badgeTone = {
  danger: "destructive-light",
  warning: "warning-light",
  good: "success-light",
  notice: "outline",
  purple: "info-light",
  neutral: "outline",
} as const;

export function InvoiceBadge({ label, tone }: { label: string; tone: InvoiceTone }) {
  return (
    <Badge variant={badgeTone[tone]} data-invoice-tone={tone} className="invoice-badge">
      {label}
    </Badge>
  );
}

export function InvoiceSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  field = false,
  prefix,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  field?: boolean;
  prefix?: string;
}) {
  const id = useId();
  const current = options.find((option) => option.value === value);
  const select = (
    <Select
      value={value}
      onValueChange={(next) => {
        const selected = options.find((option) => option.value === next);
        if (selected) onChange(selected.value);
      }}
    >
      <SelectTrigger
        id={field ? id : undefined}
        aria-label={label}
        size={field ? "default" : "sm"}
        className={field ? "w-full" : undefined}
      >
        {prefix && <span className="text-muted-foreground">{prefix}</span>}
        <SelectValue>{current?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
  return field ? (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {select}
    </Field>
  ) : (
    select
  );
}

export function InvoiceSearch({
  value,
  onChange,
  mobile,
}: {
  value: string;
  onChange: (value: string) => void;
  mobile: boolean;
}) {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const label = "Search customers, contacts and invoices";
  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (
        (!event.metaKey && !event.ctrlKey) ||
        event.key.toLowerCase() !== "k" ||
        event.defaultPrevented
      )
        return;
      if ((event.target as HTMLElement | null)?.closest('[role="dialog"], [role="alertdialog"]'))
        return;
      event.preventDefault();
      if (mobile) setOpen(true);
      else input.current?.focus();
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [mobile]);

  const search = (
    <InputGroup className="w-full">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        ref={input}
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search invoices, customers…"
      />
      {!mobile && (
        <InputGroupAddon align="inline-end">
          <Kbd>⌘K</Kbd>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
  if (!mobile) return <div className="w-68 min-w-0 max-w-full">{search}</div>;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label={label}>
          <Search />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(18rem,calc(100vw-2rem))]"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          input.current?.focus();
        }}
      >
        {search}
      </PopoverContent>
    </Popover>
  );
}

function localIsoDate(day: Date) {
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

export function InvoiceDateField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (day: string) => void;
  min?: string;
  max?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const chosen = value ? new Date(`${value}T12:00:00`) : undefined;
  const disabled = (date: Date) => {
    const day = localIsoDate(date);
    return !!(min && day < min) || !!(max && day > max);
  };
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            aria-label={`${label}${value ? ` ${invoiceDate(value)}` : ""}`}
            variant="outline"
            className="justify-start"
          >
            <CalendarDays data-icon="inline-start" />
            {value ? invoiceDate(value) : "Choose date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <CalendarSelect
            mode="single"
            selected={chosen}
            defaultMonth={chosen ?? new Date(`${invoiceToday}T12:00:00`)}
            disabled={disabled}
            onSelect={(day) => {
              if (!day) return;
              onChange(localIsoDate(day));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

export function InvoiceInitials({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <Avatar className={className}>
      <AvatarFallback className="text-[0.68rem]">{initials}</AvatarFallback>
    </Avatar>
  );
}

const customerIcons = {
  Wellness: Activity,
  Logistics: Truck,
  Energy: Zap,
  Technology: CodeXml,
  Media: PanelsTopLeft,
  Retail: ShoppingBasket,
  Design: Paintbrush,
  Hospitality: Coffee,
  Outdoors: TentTree,
  Interiors: Hotel,
} as const;

export function InvoiceCustomerCell({
  invoice,
  openCount,
  onOpen,
}: {
  invoice: Invoice;
  openCount: number;
  onOpen: (trigger: HTMLElement) => void;
}) {
  const customer = invoiceCustomer(invoice.customer);
  const CustomerIcon = customerIcons[customer.sector as keyof typeof customerIcons] ?? Building2;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <IconTile
        size="sm"
        variant="soft"
        data-invoice-tone={customer.tone}
        className="invoice-tone-text shrink-0"
      >
        <CustomerIcon />
      </IconTile>
      <div className="min-w-0 flex-1">
        <Button
          variant="ghost"
          size="xs"
          className="invoice-customer-trigger -ml-1 h-auto max-w-full justify-start px-1 font-medium"
          aria-label={`Open ${invoice.number}, ${customer.name}`}
          data-invoice-focus={`open-${invoice.id}`}
          onClick={(event) => onOpen(event.currentTarget)}
        >
          <span className="truncate">{customer.name}</span>
        </Button>
        <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <InvoiceInitials name={invoice.contact} className="size-4 shrink-0" />
          <span className="truncate">{invoice.contact}</span>
          {openCount > 1 && (
            <Badge size="xs" variant="outline">
              {openCount} open
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function InvoiceBalanceCell({ invoice }: { invoice: Invoice }) {
  const balance = invoiceBalance(invoice);
  return (
    <div className="flex flex-col items-end gap-0.5 whitespace-nowrap">
      <strong className="text-base leading-5 font-semibold tabular-nums">
        {invoiceMoney(balance, invoice.currency)}
      </strong>
      <span className="text-xs text-muted-foreground">
        {invoicePaid(invoice) > 0
          ? `of ${invoiceMoney(invoice.total, invoice.currency)}`
          : invoice.currency === "USD"
            ? "USD"
            : `≈ ${invoiceMoney(invoiceUsd(balance, invoice.currency))}`}
      </span>
    </div>
  );
}

export function InvoiceOwnerCell({
  invoice,
  onAssign,
}: {
  invoice: Invoice;
  onAssign: (owner: string) => void;
}) {
  const owner = invoiceOwner(invoice.owner);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="-ml-1 h-auto max-w-full justify-start gap-2 px-1 text-left"
          aria-label={`${owner.name}, owner of ${invoice.number}`}
        >
          <span className="relative">
            <InvoiceInitials name={owner.name} className="size-8" />
            <i
              aria-hidden="true"
              data-invoice-tone={owner.tone}
              className="invoice-dot absolute right-0 bottom-0 size-2 rounded-full ring-2 ring-background"
            />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium">{owner.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {owner.title}
            </span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-58 flex-col gap-3" aria-label={owner.name}>
        <div className="flex items-center gap-2">
          <InvoiceInitials name={owner.name} className="size-9" />
          <div>
            <strong>{owner.name}</strong>
            <p className="text-xs text-muted-foreground">
              {owner.title} · {owner.availability}
            </p>
          </div>
        </div>
        <OwnerAssignment current={invoice.owner} onChange={onAssign} />
      </PopoverContent>
    </Popover>
  );
}

const timeWindows: Record<InvoiceWindow, { first: string; last: string; labels: string[] }> = {
  month: { first: "2026-10-01", last: "2026-11-01", labels: ["Oct 1", "8", "15", "22"] },
  quarter: { first: "2026-09-01", last: "2026-12-01", labels: ["Sep", "Oct", "Nov"] },
};

const eventLabels = {
  sent: "Sent",
  opened: "Opened",
  reminder: "Reminder",
  payment: "Payment",
  promise: "Promise to pay",
  note: "Contacted",
  collections: "Collections",
  dispute: "Dispute",
  receipt: "Receipt",
} as const;

export function InvoiceTimeline({ invoice, window }: { invoice: Invoice; window: InvoiceWindow }) {
  const range = timeWindows[window];
  const days = invoiceDaySpan(range.first, range.last);
  const fraction = (day: string) =>
    Math.max(0, Math.min(100, (invoiceDaySpan(range.first, day) / days) * 100));
  const status = invoiceStatus(invoice);
  const hasSent = status !== "draft";
  const start = fraction(invoice.issued);
  const end = fraction(
    status === "paid"
      ? (invoice.events.filter((event) => event.type === "payment").at(-1)?.day ?? invoice.due)
      : invoiceToday > invoice.due
        ? invoiceToday
        : invoice.due,
  );
  const marker = fraction(invoice.due);
  const tone = invoiceStatusBadge(invoice).tone;
  const Marker =
    status === "paid"
      ? Check
      : status === "collections" || status === "promised"
        ? CircleDollarSign
        : Mail;
  const issue = hasSent ? `sent ${invoiceDate(invoice.issued)}` : "draft";
  const events = invoice.events.map((event) => eventLabels[event.type]);
  const label = [invoice.number, issue, `due ${invoiceDate(invoice.due)}`, ...events].join(", ");
  return (
    <div className="flex min-w-0 items-start gap-2">
      <div
        role="img"
        aria-label={label}
        title={label}
        data-invoice-tone={tone}
        className="min-w-0 flex-1"
      >
        <div className="invoice-track">
          <div aria-hidden="true" className="invoice-track-divisions">
            {range.labels.map((text, index) => {
              const segmentWidth = 100 / range.labels.length;
              const offset = index * segmentWidth;
              const localStart = Math.max(0, start - offset);
              const localEnd = Math.min(segmentWidth, end - offset);
              return (
                <span key={text}>
                  {hasSent && localEnd > localStart && (
                    <i
                      className="invoice-track-fill"
                      style={{
                        left: `${(localStart / segmentWidth) * 100}%`,
                        width: `${((localEnd - localStart) / segmentWidth) * 100}%`,
                      }}
                    />
                  )}
                </span>
              );
            })}
          </div>
          {hasSent && marker > 0 && marker < 100 && (
            <span aria-hidden="true" className="invoice-track-due" style={{ left: `${marker}%` }} />
          )}
          {invoice.events
            .filter((event) =>
              ["reminder", "payment", "promise", "dispute", "collections"].includes(event.type),
            )
            .map((event) => {
              const point = fraction(event.day);
              return point > 0 && point < 100 ? (
                <i
                  aria-hidden="true"
                  key={event.id}
                  className="invoice-track-event"
                  style={{ left: `${point}%` }}
                />
              ) : null;
            })}
        </div>
        <div
          aria-hidden="true"
          className="mt-1 flex justify-around gap-1 text-[0.69rem] text-muted-foreground"
        >
          {range.labels.map((text) => (
            <span key={text}>{text}</span>
          ))}
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            data-invoice-tone={tone}
            className="invoice-event-icon mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full"
            aria-label={invoiceStatusBadge(invoice).label}
          >
            <Marker className="size-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{invoiceStatusBadge(invoice).label}</TooltipContent>
      </Tooltip>
    </div>
  );
}

const ownerOptions = invoiceOwners.map(({ id, name }) => ({ value: id, label: name }));

function OwnerAssignment({
  current,
  onChange,
}: {
  current: string;
  onChange: (owner: string) => void;
}) {
  return (
    <InvoiceSelect
      label="Assign owner"
      value={current}
      options={ownerOptions}
      onChange={onChange}
    />
  );
}
