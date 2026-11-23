import { useState } from "react";
import {
  createMerchBook,
  type MerchBook,
  type MerchMetric,
} from "./grid-advanced-merch-review-model";
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
export const merchMoney = (cents: number) => currency.format(cents / 100);
export const merchPercent = (bps: number | null) =>
  bps === null ? "—" : `${(bps / 100).toFixed(1)}%`;
export const merchMonthLabel = (month: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00Z`),
  );
export function merchMetricLabel(metric: MerchMetric, value: number | null) {
  return value === null
    ? "—"
    : metric.unit === "money"
      ? merchMoney(value)
      : metric.unit === "rate"
        ? merchPercent(value)
        : metric.unit === "weeks"
          ? `${value.toFixed(1)} wk`
          : new Intl.NumberFormat("en-US").format(value);
}

export function useMerchBook() {
  const [book, setBook] = useState(createMerchBook);
  const [history, setHistory] = useState<MerchBook[]>([]);
  const [message, setMessage] = useState("");
  function commit(next: MerchBook, summary: string) {
    setHistory((previous) => [...previous.slice(-19), book]);
    setBook(next);
    setMessage(summary);
  }
  function undo() {
    const prior = history.at(-1);
    if (prior) {
      setBook(prior);
      setHistory(history.slice(0, -1));
      setMessage("Restored the previous local review.");
    }
  }
  return { book, commit, undo, message, canUndo: history.length > 0 };
}
