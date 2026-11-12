import { useState } from "react";
import { STRATA_NOW_MS } from "./strata-domain.ts";

export type StrataBillingInterval = "monthly" | "yearly";
export const STRATA_BILLING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "One team watching a few services",
    monthlyCents: 4900,
    seats: 5,
    monitors: 10,
    apiCalls: 100000,
    storageGb: 10,
  },
  {
    id: "growth",
    name: "Growth",
    description: "Several teams sharing on-call",
    monthlyCents: 19900,
    seats: 25,
    monitors: 50,
    apiCalls: 1000000,
    storageGb: 100,
  },
  {
    id: "scale",
    name: "Scale",
    description: "Many services and audit needs",
    monthlyCents: 59900,
    seats: 100,
    monitors: 200,
    apiCalls: 5000000,
    storageGb: 500,
  },
] as const;
export type StrataBillingPlan = (typeof STRATA_BILLING_PLANS)[number];
export interface StrataBillingInvoice {
  id: string;
  status: "Open" | "Paid" | "Void";
  date: string;
  description: string;
  cents: number;
}
export const STRATA_BILLING_INVOICES: readonly StrataBillingInvoice[] = [
  {
    id: "BL-20431",
    status: "Open",
    date: "2026-10-31",
    description: "Log backfill import, one time",
    cents: 16238,
  },
  {
    id: "BL-20418",
    status: "Paid",
    date: "2026-10-01",
    description: "Growth, monthly",
    cents: 21542,
  },
  {
    id: "BL-20397",
    status: "Paid",
    date: "2026-09-01",
    description: "Growth, monthly",
    cents: 21542,
  },
  {
    id: "BL-20384",
    status: "Paid",
    date: "2026-08-12",
    description: "Upgrade to Growth, prorated",
    cents: 10475,
  },
  {
    id: "BL-20371",
    status: "Paid",
    date: "2026-08-01",
    description: "Starter, monthly",
    cents: 5304,
  },
  {
    id: "BL-20358",
    status: "Void",
    date: "2026-07-01",
    description: "Starter, monthly, reissued",
    cents: 5304,
  },
];
export function strataPlanQuote(planId: string, interval: StrataBillingInterval) {
  const plan = STRATA_BILLING_PLANS.find((item) => item.id === planId);
  if (!plan) throw new Error("Choose a local plan.");
  return {
    plan,
    interval,
    cents: plan.monthlyCents * (interval === "yearly" ? 10 : 1),
    monthlyEquivalentCents:
      interval === "yearly" ? Math.round((plan.monthlyCents * 10) / 1200) * 100 : plan.monthlyCents,
    freeMonths: interval === "yearly" ? 2 : 0,
    taxIncluded: false as const,
  };
}
export function strataBillingUsage() {
  return [
    { label: "Seats", used: 18, limit: 25, unit: "" },
    { label: "Monitors", used: 41, limit: 50, unit: "" },
    { label: "API Calls", used: 773500, limit: 1000000, unit: "" },
    { label: "Log Storage", used: 38.2, limit: 100, unit: "GB" },
  ].map((row) => ({ ...row, percent: (row.used / row.limit) * 100 }));
}
export function strataBillingUsageCsv() {
  return (
    "Metric,Used,Limit,Unit\r\n" +
    strataBillingUsage()
      .map((row) => `${row.label},${row.used},${row.limit},${row.unit}`)
      .join("\r\n") +
    "\r\n"
  );
}
export function formatStrataBillingMoney(cents: number, whole = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}
export function strataInvoicePdf(invoice: StrataBillingInvoice): string {
  const escape = (value: string) =>
    value
      .replace(/[^\x20-\x7e]/g, "?")
      .replaceAll("\\", "\\\\")
      .replaceAll("(", "\\(")
      .replaceAll(")", "\\)");
  const lines = [
    "Bricklane - local invoice preview",
    invoice.id,
    `Status: ${invoice.status}`,
    `Date: ${invoice.date}`,
    invoice.description,
    `Amount: ${formatStrataBillingMoney(invoice.cents)}`,
    "Demo billing record. This document is not a payment receipt.",
  ];
  const content = `BT /F1 16 Tf 50 780 Td ${lines.map((line, index) => `${index ? "0 -26 Td " : ""}(${escape(line)}) Tj`).join("\n")} ET\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const start = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return pdf;
}

export function useStrataSettingsBillingModel() {
  const [interval, setInterval] = useState<StrataBillingInterval>("monthly");
  const [savedQuotes, setSavedQuotes] = useState<ReturnType<typeof strataPlanQuote>[]>([]);
  const saveQuote = (planId: string) => {
    const quote = strataPlanQuote(planId, interval);
    setSavedQuotes((current) => [...current, quote]);
    return quote;
  };
  return {
    interval,
    setInterval,
    savedQuotes,
    saveQuote,
    invoices: STRATA_BILLING_INVOICES,
    usage: strataBillingUsage(),
    currentPlan: STRATA_BILLING_PLANS[1],
    renewal: "2026-11-01T00:00:00.000Z",
    daysToRenewal: Math.floor((Date.parse("2026-11-01T00:00:00.000Z") - STRATA_NOW_MS) / 86400000),
  };
}
