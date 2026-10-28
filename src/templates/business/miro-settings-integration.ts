import { demoAvatar } from "@/lib/demo-artwork";
import {
  initialMiroChairs,
  type MiroChair,
  type MiroInvoiceForSettings,
  type MiroProfile,
} from "./miro-settings-data";

/** One original ordered identity list; existing seed index relationships stay intact. */
export const miroClinicDoctors = initialMiroChairs.map((chair) => chair.name);
export const miroClinicSeedDoctors = miroClinicDoctors.slice(0, 5);
export type MiroCalendarChairs = readonly Pick<MiroChair, "name" | "visible" | "color">[];
export type MiroCalendarHours = { opens: number; closes: number };

/** Newly explicit local demo period. Old display labels did not encode this year. */
export const miroClinicLedgerPeriod = { year: 2026, month: 10 } as const;
export const miroClinicAsOf = "2026-10-22";

type ClinicInvoiceInput = { id: string; amount: number; date: string; status: string };
function validDate(year: number, month: number, day: number) {
  const value = new Date(Date.UTC(year, month - 1, day));
  return value.getUTCFullYear() === year &&
    value.getUTCMonth() === month - 1 &&
    value.getUTCDate() === day
    ? value.toISOString().slice(0, 10)
    : "";
}
export function adaptMiroClinicInvoices(
  records: readonly ClinicInvoiceInput[],
  period: { year: number; month: number } = miroClinicLedgerPeriod,
) {
  let undated = 0;
  const invoices: MiroInvoiceForSettings[] = records.map((record) => {
    const encodedDate = /^INV-(\d{4})(\d{2})(\d{2})-/.exec(record.id);
    const octoberLabel = /^Oct (\d{1,2})$/.exec(record.date);
    const issuedAt = encodedDate
      ? validDate(Number(encodedDate[1]), Number(encodedDate[2]), Number(encodedDate[3]))
      : octoberLabel && period.month === 10
        ? validDate(period.year, period.month, Number(octoberLabel[1]))
        : "";
    if (!issuedAt) undated += 1;
    return {
      id: record.id,
      amount: record.amount,
      issuedAt,
      status: record.status === "Paid" ? "paid" : record.status === "Void" ? "void" : "open",
    };
  });
  return { invoices, undated, period };
}
export function miroSavedProfileAvatar(profile: MiroProfile) {
  return profile.avatar === "default" ? demoAvatar(profile.fullName) : profile.avatar || undefined;
}
export const miroHourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
export function miroClinicInvoiceDueLabel(
  invoice: MiroInvoiceForSettings | undefined,
  terms: number,
  asOf: string,
) {
  if (invoice?.status === "paid") return "Settled";
  if (invoice?.status === "void") return "Void";
  const issued = invoice && Date.parse(`${invoice.issuedAt}T00:00:00Z`);
  const today = Date.parse(`${asOf}T00:00:00Z`);
  if (typeof issued !== "number" || !Number.isFinite(issued) || !Number.isFinite(today))
    return "Due date unavailable";
  const days = Math.round((issued + terms * 86_400_000 - today) / 86_400_000);
  return days < 0 ? `Overdue ${-days}d` : days === 0 ? "Due today" : `Due in ${days}d`;
}
