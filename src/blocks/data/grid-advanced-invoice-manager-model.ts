import type { FilterNode, FilterRule } from "@/components/reui/filters/filters-types";

export const invoiceToday = "2026-10-29";
export const invoiceCurrencies = ["USD", "EUR", "GBP", "CAD"] as const;
export type InvoiceCurrency = (typeof invoiceCurrencies)[number];
export type InvoiceStage = "open" | "draft" | "disputed" | "collections" | "void";
export type InvoiceStatus = InvoiceStage | "paid" | "partial" | "overdue" | "promised";
export type InvoiceSection = "needs" | "waiting" | "drafts" | "closed";
export type InvoiceScope = "all" | "open" | "overdue" | InvoiceSection;
export type InvoiceGrouping = "next" | "status" | "owner" | "customer" | "none";
export type InvoiceWindow = "month" | "quarter";
export type InvoiceTone = "danger" | "warning" | "good" | "notice" | "purple" | "neutral";
export type InvoiceAction = "collect" | "call" | "resend" | "dispute" | "send";
export type InvoiceEventKind =
  | "sent"
  | "opened"
  | "reminder"
  | "payment"
  | "promise"
  | "note"
  | "collections"
  | "dispute"
  | "receipt";

export interface InvoiceEvent {
  id: string;
  type: InvoiceEventKind;
  day: string;
  note?: string;
  amount?: number;
  promisedFor?: string;
}

export interface Invoice {
  id: string;
  number: string;
  customer: string;
  contact: string;
  owner: string;
  description: string;
  currency: InvoiceCurrency;
  total: number;
  issued: string;
  due: string;
  stage: InvoiceStage;
  automatic: boolean;
  events: InvoiceEvent[];
}

export interface InvoiceCustomer {
  id: string;
  name: string;
  contact: string;
  sector: string;
  tone: InvoiceTone;
  payDelay: number;
}

export const invoiceCustomers: InvoiceCustomer[] = [
  {
    id: "birch",
    name: "Birchway Fitness",
    contact: "Morgan Price",
    sector: "Wellness",
    tone: "danger",
    payDelay: 18,
  },
  {
    id: "dock",
    name: "Dockline Logistics",
    contact: "Lena Park",
    sector: "Logistics",
    tone: "notice",
    payDelay: 11,
  },
  {
    id: "circuit",
    name: "Circuit Coast Electric",
    contact: "Amara Chen",
    sector: "Energy",
    tone: "warning",
    payDelay: 9,
  },
  {
    id: "spire",
    name: "Spireview Labs",
    contact: "Robin West",
    sector: "Technology",
    tone: "purple",
    payDelay: 22,
  },
  {
    id: "orbit",
    name: "Marrow Media",
    contact: "Avery Stone",
    sector: "Media",
    tone: "neutral",
    payDelay: 3,
  },
  {
    id: "cedar",
    name: "Cedarfield Market",
    contact: "Samira Adams",
    sector: "Retail",
    tone: "good",
    payDelay: 5,
  },
  {
    id: "studio",
    name: "Parallel House Studio",
    contact: "Felix Quinn",
    sector: "Design",
    tone: "purple",
    payDelay: 2,
  },
  {
    id: "shore",
    name: "Shorebird Coffee",
    contact: "Talia Vega",
    sector: "Hospitality",
    tone: "warning",
    payDelay: 4,
  },
  {
    id: "camp",
    name: "Wilder Camp Supply",
    contact: "Nolan Hayes",
    sector: "Outdoors",
    tone: "notice",
    payDelay: 1,
  },
  {
    id: "hotel",
    name: "Palmer House Hotels",
    contact: "Renee Duarte",
    sector: "Hospitality",
    tone: "good",
    payDelay: 5,
  },
  {
    id: "mosaic",
    name: "Crownwork Interiors",
    contact: "Jules Bennett",
    sector: "Interiors",
    tone: "danger",
    payDelay: 8,
  },
  {
    id: "dental",
    name: "Marlowe Dental",
    contact: "Alex Silva",
    sector: "Health",
    tone: "notice",
    payDelay: 0,
  },
];

export const invoiceOwners = [
  { id: "inez", name: "Inez Hart", title: "Finance Lead", availability: "Online", tone: "good" },
  { id: "ren", name: "Ren Alvarez", title: "AR Specialist", availability: "Away", tone: "warning" },
  { id: "noor", name: "Noor Malik", title: "AR Specialist", availability: "Online", tone: "good" },
  {
    id: "eli",
    name: "Eli Warren",
    title: "Account Manager",
    availability: "Offline",
    tone: "neutral",
  },
] as const;

export const sectionTitles: Record<InvoiceSection, string> = {
  needs: "Needs You",
  waiting: "Waiting",
  drafts: "Drafts",
  closed: "Closed",
};
export const sectionDescriptions: Record<InvoiceSection, string> = {
  needs: "Calls, exceptions and collection handoffs",
  waiting: "Promises and automatic reminders are in motion",
  drafts: "Ready for review before sending",
  closed: "Payments settled or invoices voided",
};
export const sectionTones: Record<InvoiceSection, InvoiceTone> = {
  needs: "warning",
  waiting: "purple",
  drafts: "notice",
  closed: "good",
};
export const invoiceStatusTitles: Record<InvoiceStatus, string> = {
  open: "Open",
  draft: "Draft",
  disputed: "Disputed",
  collections: "In Collections",
  void: "Void",
  paid: "Paid",
  partial: "Part Paid",
  overdue: "Overdue",
  promised: "Promised",
};

const currencyRates: Record<InvoiceCurrency, number> = { USD: 1, EUR: 1.08, GBP: 1.26, CAD: 0.73 };
const formatters = new Map<string, Intl.NumberFormat>();
export function invoiceMoney(cents: number, currency: InvoiceCurrency = "USD", exact = false) {
  const key = `${currency}-${exact}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: exact ? 2 : 0,
      maximumFractionDigits: exact ? 2 : 0,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(cents / 100);
}
export const invoiceUsd = (cents: number, currency: InvoiceCurrency) =>
  Math.round(cents * currencyRates[currency]);

export const invoiceDate = (day: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(day),
  );

export function invoiceShift(day: string, days: number) {
  const date = new Date(day);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export const invoiceDaySpan = (first: string, last: string) =>
  Math.round((Date.parse(last) - Date.parse(first)) / 86_400_000);

export const invoiceCustomer = (id: string) => invoiceCustomers.find((item) => item.id === id)!;
export const invoiceOwner = (id: string) => invoiceOwners.find((item) => item.id === id)!;

export function invoicePaid(invoice: Invoice) {
  return invoice.events.reduce(
    (sum, event) => (event.type === "payment" ? sum + (event.amount ?? 0) : sum),
    0,
  );
}

export function invoiceBalance(invoice: Invoice) {
  return invoice.stage === "void" ? 0 : Math.max(0, invoice.total - invoicePaid(invoice));
}

function latestOf(invoice: Invoice, kind: InvoiceEventKind) {
  return invoice.events.filter((event) => event.type === kind).at(-1);
}

function futurePromise(invoice: Invoice) {
  const day = latestOf(invoice, "promise")?.promisedFor;
  return day && day >= invoiceToday ? day : undefined;
}

export function invoiceStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.stage === "void" || invoice.stage === "draft") return invoice.stage;
  if (invoiceBalance(invoice) === 0) return "paid";
  if (invoice.stage !== "open") return invoice.stage;
  if (futurePromise(invoice)) return "promised";
  if (invoicePaid(invoice) > 0) return "partial";
  return invoice.due < invoiceToday ? "overdue" : "open";
}

export type InvoiceStep = {
  section: InvoiceSection;
  label: string;
  tone: InvoiceTone;
  action?: InvoiceAction;
};

export function invoiceNextStep(invoice: Invoice): InvoiceStep {
  const status = invoiceStatus(invoice);
  const late = invoiceDaySpan(invoice.due, invoiceToday);
  if (status === "paid") return { section: "closed", label: "Receipt Sent", tone: "good" };
  if (status === "void") return { section: "closed", label: "No follow-up", tone: "neutral" };
  if (status === "draft")
    return { section: "drafts", label: "Review and Send", tone: "notice", action: "send" };
  if (status === "collections")
    return { section: "waiting", label: "Agency following up", tone: "danger" };
  if (status === "disputed")
    return { section: "needs", label: "Review Dispute", tone: "purple", action: "dispute" };
  const promise = futurePromise(invoice);
  if (promise)
    return { section: "waiting", label: `Wait for ${invoiceDate(promise)}`, tone: "good" };
  const reminders = invoice.events.filter((event) => event.type === "reminder");
  if (late >= 45 && reminders.length >= 3) {
    return { section: "needs", label: "Hand to Collections", tone: "danger", action: "collect" };
  }
  const lastContact = latestOf(invoice, "note");
  if (late >= 20 && (!lastContact || invoiceDaySpan(lastContact.day, invoiceToday) >= 7)) {
    return { section: "needs", label: `Call ${invoice.contact}`, tone: "warning", action: "call" };
  }
  const lastSent = latestOf(invoice, "sent");
  if (!latestOf(invoice, "opened") && lastSent && invoiceDaySpan(lastSent.day, invoiceToday) >= 7) {
    return { section: "needs", label: "Resend Invoice", tone: "notice", action: "resend" };
  }
  const reminder = invoice.automatic
    ? `Reminder ${invoiceDate(invoiceShift(invoice.due, late > 0 ? late + 1 : -1))}`
    : "Reminders paused";
  return { section: "waiting", label: reminder, tone: "neutral" };
}

export function invoiceExpected(invoice: Invoice) {
  const status = invoiceStatus(invoice);
  if (status === "paid") {
    return { day: latestOf(invoice, "payment")?.day, label: "Paid", tone: "good" as const };
  }
  const promise = futurePromise(invoice);
  if (promise) return { day: promise, label: "Promised", tone: "good" as const };
  if (status === "disputed") return { label: "Until settled", tone: "purple" as const };
  if (status === "draft" || status === "void") return { label: "—", tone: "neutral" as const };
  if (status === "collections" || invoiceDaySpan(invoice.due, invoiceToday) > 18) {
    return { label: "At risk", tone: "danger" as const };
  }
  const estimate = invoiceShift(invoice.due, invoiceCustomer(invoice.customer).payDelay);
  return estimate < invoiceToday
    ? { day: invoiceShift(invoiceToday, 4), label: "Might slip", tone: "warning" as const }
    : {
        day: estimate,
        label: status === "overdue" ? "Might slip" : "On track",
        tone: status === "overdue" ? ("warning" as const) : ("good" as const),
      };
}

export function invoiceStatusBadge(invoice: Invoice): { label: string; tone: InvoiceTone } {
  const status = invoiceStatus(invoice);
  const late = invoiceDaySpan(invoice.due, invoiceToday);
  if (status === "paid") return { label: "Paid", tone: "good" };
  if (status === "draft" || status === "void")
    return { label: invoiceStatusTitles[status], tone: "neutral" };
  if (status === "disputed" || status === "collections") {
    return {
      label: invoiceStatusTitles[status],
      tone: status === "disputed" ? "purple" : "danger",
    };
  }
  if (late > 0) return { label: `${late}d late`, tone: late >= 30 ? "danger" : "warning" };
  if (!late) return { label: "Due today", tone: "warning" };
  return { label: `Due in ${-late}d`, tone: "notice" };
}

type Seed = {
  customer: string;
  number: number;
  total: number;
  due: string;
  owner: string;
  currency?: InvoiceCurrency;
  stage?: InvoiceStage;
  opened?: boolean;
  reminders?: number;
  paid?: number;
  promise?: string;
  contact?: string;
  description: string;
};

const openingInvoices: Seed[] = [
  {
    customer: "birch",
    number: 2046,
    total: 4585,
    due: "2026-07-24",
    owner: "inez",
    reminders: 4,
    description: "Class booking refresh",
  },
  {
    customer: "birch",
    number: 2052,
    total: 6200,
    due: "2026-08-19",
    owner: "inez",
    reminders: 3,
    contact: "Mila James",
    description: "Member portal integration",
  },
  {
    customer: "dock",
    number: 2059,
    total: 16250,
    due: "2026-08-25",
    owner: "inez",
    currency: "EUR",
    reminders: 2,
    description: "Freight reporting build",
  },
  {
    customer: "circuit",
    number: 2061,
    total: 7350,
    due: "2026-09-30",
    owner: "ren",
    reminders: 1,
    description: "Field crew onboarding",
  },
  {
    customer: "spire",
    number: 2068,
    total: 8975,
    due: "2026-10-04",
    owner: "eli",
    stage: "disputed",
    description: "Research service extension",
  },
  {
    customer: "orbit",
    number: 2071,
    total: 7100,
    due: "2026-11-01",
    owner: "eli",
    opened: false,
    description: "Studio retainer, October",
  },
  {
    customer: "cedar",
    number: 2062,
    total: 4880,
    due: "2026-09-22",
    owner: "noor",
    promise: "2026-10-31",
    reminders: 2,
    description: "Inventory display refresh",
  },
  {
    customer: "studio",
    number: 2069,
    total: 11500,
    paid: 6700,
    due: "2026-10-14",
    owner: "noor",
    promise: "2026-11-03",
    description: "Lobby concept system",
  },
  {
    customer: "studio",
    number: 2075,
    total: 3620,
    due: "2026-11-15",
    owner: "noor",
    contact: "Val Ruiz",
    description: "Retainer and revisions",
  },
  {
    customer: "shore",
    number: 2076,
    total: 2240,
    due: "2026-11-10",
    owner: "ren",
    description: "Holiday menu artwork",
  },
  {
    customer: "dock",
    number: 2072,
    total: 5420,
    currency: "EUR",
    due: "2026-11-09",
    owner: "inez",
    description: "Dashboard maintenance",
  },
  {
    customer: "circuit",
    number: 2073,
    total: 2635,
    due: "2026-11-13",
    owner: "ren",
    description: "Work order imports",
  },
  {
    customer: "camp",
    number: 2074,
    total: 4675,
    currency: "CAD",
    due: "2026-11-14",
    owner: "eli",
    description: "Returns onboarding",
  },
  {
    customer: "hotel",
    number: 2077,
    total: 4520,
    due: "2026-11-18",
    owner: "ren",
    description: "Guest guide refresh",
  },
  {
    customer: "camp",
    number: 2078,
    total: 1950,
    due: "2026-11-29",
    owner: "eli",
    stage: "draft",
    description: "Seasonal catalog draft",
  },
  {
    customer: "studio",
    number: 2079,
    total: 3100,
    due: "2026-11-29",
    owner: "noor",
    stage: "draft",
    description: "Wayfinding draft",
  },
  {
    customer: "dental",
    number: 2065,
    total: 3240,
    due: "2026-10-14",
    owner: "noor",
    paid: 3240,
    description: "Appointment reminder update",
  },
  {
    customer: "shore",
    number: 2043,
    total: 2900,
    due: "2026-09-14",
    owner: "eli",
    paid: 2900,
    description: "Fall storefront materials",
  },
  {
    customer: "mosaic",
    number: 2066,
    total: 2575,
    currency: "GBP",
    due: "2026-10-18",
    owner: "inez",
    paid: 2575,
    description: "Design review and procurement",
  },
  {
    customer: "orbit",
    number: 2067,
    total: 5650,
    due: "2026-10-09",
    owner: "eli",
    paid: 5650,
    description: "September retainer",
  },
];

function seededInvoice(seed: Seed): Invoice {
  const id = `invoice-${seed.number}`;
  const stage = seed.stage ?? "open";
  const issued = invoiceShift(seed.due, -30);
  const events: InvoiceEvent[] = [];
  function add(type: InvoiceEventKind, day: string, details?: Partial<InvoiceEvent>) {
    events.push({ id: `${id}-${events.length}`, type, day, ...details });
  }
  if (stage !== "draft") {
    add("sent", issued);
    if (seed.opened !== false) add("opened", invoiceShift(issued, 3));
    for (let index = 0; index < (seed.reminders ?? 0); index++) {
      add("reminder", invoiceShift(seed.due, [1, 7, 14, 36][index]!));
    }
    if (stage === "disputed")
      add("dispute", invoiceShift(seed.due, 3), { note: "Customer requested a scope review." });
    if (seed.paid) {
      const paymentDay =
        seed.paid >= seed.total ? invoiceShift(seed.due, 2) : invoiceShift(seed.due, -3);
      add("payment", paymentDay, { amount: seed.paid * 100, note: "Bank transfer" });
      if (seed.paid >= seed.total) add("receipt", paymentDay);
    }
    if (seed.promise)
      add("promise", invoiceToday, {
        promisedFor: seed.promise,
        note: "Customer confirmed the next transfer.",
      });
  }
  return {
    id,
    number: `INV-${seed.number}`,
    customer: seed.customer,
    contact: seed.contact ?? invoiceCustomer(seed.customer).contact,
    description: seed.description,
    owner: seed.owner,
    currency: seed.currency ?? "USD",
    total: seed.total * 100,
    issued,
    due: seed.due,
    automatic: stage === "open",
    stage,
    events: events.toSorted((a, b) => a.day.localeCompare(b.day)),
  };
}

export function initialInvoices(): Invoice[] {
  const closed = Array.from({ length: 128 }, (_, index) => {
    const customer = invoiceCustomers[index % invoiceCustomers.length]!;
    const amount = 850 + ((index * 387) % 13730);
    return seededInvoice({
      customer: customer.id,
      number: 2019 - index,
      total: amount,
      paid: amount,
      due: invoiceShift("2026-10-01", -index * 2),
      owner: invoiceOwners[index % invoiceOwners.length]!.id,
      currency: invoiceCurrencies[index % invoiceCurrencies.length],
      description: [
        "Monthly operations",
        "Implementation milestone",
        "Support retainer",
        "Design services",
      ][index % 4]!,
    });
  });
  return [...openingInvoices.map(seededInvoice), ...closed];
}

export function invoiceInScope(invoice: Invoice, scope: InvoiceScope) {
  if (scope === "all") return true;
  if (scope === "open") return invoiceBalance(invoice) > 0 && invoice.stage !== "draft";
  if (scope === "overdue")
    return invoiceBalance(invoice) > 0 && invoice.due < invoiceToday && invoice.stage === "open";
  return invoiceNextStep(invoice).section === scope;
}

export function invoiceMetrics(invoices: readonly Invoice[]) {
  const sum = (rows: Invoice[]) => ({
    count: rows.length,
    value: rows.reduce((total, item) => total + invoiceUsd(invoiceBalance(item), item.currency), 0),
  });
  return {
    needs: sum(invoices.filter((item) => invoiceNextStep(item).section === "needs")),
    waiting: sum(invoices.filter((item) => invoiceNextStep(item).section === "waiting")),
    next: sum(
      invoices.filter((item) => {
        const expected = invoiceExpected(item).day;
        return (
          invoiceBalance(item) > 0 &&
          !!expected &&
          invoiceDaySpan(invoiceToday, expected) >= 0 &&
          invoiceDaySpan(invoiceToday, expected) <= 30
        );
      }),
    ),
  };
}

function applyFilterRule(invoice: Invoice, node: FilterRule): boolean | undefined {
  const values: Record<string, string | number> = {
    status: invoiceStatus(invoice),
    owner: invoice.owner,
    currency: invoice.currency,
    customer: invoiceCustomer(invoice.customer).name.toLocaleLowerCase(),
    balance: invoiceUsd(invoiceBalance(invoice), invoice.currency) / 100,
  };
  const value = values[node.path.at(-1) ?? ""];
  if (value === undefined || !node.operator) return undefined;
  if (node.operator === "empty") return false;
  if (node.operator === "not_empty") return true;
  const input = node.value;
  if (input === undefined || input === null || input === "") return undefined;
  const term = String(input).toLocaleLowerCase();
  let result: boolean | undefined;
  switch (node.operator) {
    case "eq":
    case "is":
      result = String(value).toLocaleLowerCase() === term;
      break;
    case "neq":
    case "is_not":
      result = String(value).toLocaleLowerCase() !== term;
      break;
    case "is_any_of":
    case "is_none_of":
      if (Array.isArray(input) && input.length) {
        const included = input.some(
          (option) => String(option).toLocaleLowerCase() === String(value).toLocaleLowerCase(),
        );
        result = node.operator === "is_any_of" ? included : !included;
      }
      break;
    case "contains":
      result = String(value).toLocaleLowerCase().includes(term);
      break;
    case "not_contains":
      result = !String(value).toLocaleLowerCase().includes(term);
      break;
    case "starts_with":
      result = String(value).toLocaleLowerCase().startsWith(term);
      break;
    case "ends_with":
      result = String(value).toLocaleLowerCase().endsWith(term);
      break;
    case "gt":
      result = Number(value) > Number(input);
      break;
    case "gte":
      result = Number(value) >= Number(input);
      break;
    case "lt":
      result = Number(value) < Number(input);
      break;
    case "lte":
      result = Number(value) <= Number(input);
      break;
    case "between":
    case "not_between":
      if (Array.isArray(input) && input.length === 2) {
        const inside = Number(value) >= Number(input[0]) && Number(value) <= Number(input[1]);
        result = node.operator === "between" ? inside : !inside;
      }
      break;
  }
  return node.negated && result !== undefined ? !result : result;
}

export function matchInvoiceFilter(invoice: Invoice, query: FilterNode): boolean | undefined {
  if (query.type === "rule") return applyFilterRule(invoice, query);
  const results = query.rules
    .map((node) => matchInvoiceFilter(invoice, node))
    .filter((value) => value !== undefined);
  if (!results.length) return undefined;
  return query.combinator === "and" ? results.every(Boolean) : results.some(Boolean);
}

export type InvoiceRecordRow = { id: string; invoice: Invoice };
export type InvoiceGroupRow = {
  id: string;
  title: string;
  description?: string;
  tone: InvoiceTone;
  children: InvoiceRecordRow[];
};
export type InvoiceRow = InvoiceRecordRow | InvoiceGroupRow;
export const invoiceRowRecord = (row: InvoiceRow) => ("invoice" in row ? row.invoice : undefined);

export function getInvoiceGroup(invoice: Invoice, grouping: InvoiceGrouping) {
  if (grouping === "next") {
    const key = invoiceNextStep(invoice).section;
    return {
      key,
      title: sectionTitles[key],
      description: sectionDescriptions[key],
      tone: sectionTones[key],
    };
  }
  if (grouping === "owner")
    return { key: invoice.owner, title: invoiceOwner(invoice.owner).name, tone: "notice" as const };
  if (grouping === "customer")
    return {
      key: invoice.customer,
      title: invoiceCustomer(invoice.customer).name,
      tone: "notice" as const,
    };
  const key = invoiceStatus(invoice);
  return { key, title: invoiceStatusTitles[key], tone: invoiceStatusBadge(invoice).tone };
}

export function buildInvoiceRows(invoices: Invoice[], grouping: InvoiceGrouping): InvoiceRow[] {
  const records = invoices.map((invoice) => ({ id: invoice.id, invoice }));
  if (grouping === "none") return records;
  const groups = new Map<string, InvoiceGroupRow>();
  for (const record of records) {
    const { key, ...group } = getInvoiceGroup(record.invoice, grouping);
    const id = `group-${grouping}-${key}`;
    const existing = groups.get(id);
    if (existing) existing.children.push(record);
    else groups.set(id, { id, ...group, children: [record] });
  }
  return [...groups.values()];
}

export function invoiceDateIsValid(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const parsed = new Date(day);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day;
}

export function canSaveInvoice(invoice: Invoice, rows: readonly Invoice[]) {
  return (
    !!invoice.contact.trim() &&
    !!invoice.description.trim() &&
    Number.isSafeInteger(invoice.total) &&
    invoice.total > 0 &&
    invoice.total >= invoicePaid(invoice) &&
    invoiceDateIsValid(invoice.issued) &&
    invoiceDateIsValid(invoice.due) &&
    invoice.issued <= invoice.due &&
    invoiceCustomers.some((item) => item.id === invoice.customer) &&
    invoiceOwners.some((item) => item.id === invoice.owner) &&
    invoiceCurrencies.includes(invoice.currency) &&
    !rows.some((item) => item.id !== invoice.id && item.number === invoice.number)
  );
}

export function invoiceCsv(invoices: Invoice[]) {
  const csvCell = (value: string | number) => {
    const text = String(value);
    const safe = /^[=+\-@\t\r\n]/.test(text) && typeof value !== "number" ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const lines = [
    [
      "Invoice",
      "Customer",
      "Contact",
      "Owner",
      "Currency",
      "Balance",
      "Status",
      "Due",
      "Expected",
      "Next step",
    ],
    ...invoices.map((invoice) => [
      invoice.number,
      invoiceCustomer(invoice.customer).name,
      invoice.contact,
      invoiceOwner(invoice.owner).name,
      invoice.currency,
      (invoiceBalance(invoice) / 100).toFixed(2),
      invoiceStatusTitles[invoiceStatus(invoice)],
      invoice.due,
      invoiceExpected(invoice).day ?? "",
      invoiceNextStep(invoice).label,
    ]),
  ];
  return lines.map((line) => line.map(csvCell).join(",")).join("\r\n");
}
