export const trendColors = {
  purple: "#7561e9",
  teal: "#319d8f",
  blue: "#3b91cf",
  orange: "#e78324",
  pink: "#e14f78",
  gray: "#9ca3af",
};
export const short = (v: number) =>
  Math.abs(v) >= 1e9
    ? `${(v / 1e9).toFixed(2)}B`
    : Math.abs(v) >= 1e6
      ? `${(v / 1e6).toFixed(2)}M`
      : Math.abs(v) >= 1e3
        ? `${(v / 1e3).toFixed(1)}K`
        : Math.round(v).toLocaleString();
export const money = (v: number) =>
  `${v < 0 ? "-" : ""}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const usd = (v: number) => `${v < 0 ? "-" : ""}$${short(Math.abs(v))}`;
export const currencyAxis = (v: number) =>
  v === 0
    ? "0"
    : `${v < 0 ? "-" : ""}$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Math.abs(v))}`;
export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
export const change = (value: number, prior: number) => (prior ? (value / prior - 1) * 100 : 0);
export function dates(count: number, end = "2025-10-16", trading = false) {
  const result: string[] = [];
  const day = new Date(`${end}T12:00:00Z`);
  while (result.length < count) {
    if (!trading || ![0, 6].includes(day.getUTCDay()))
      result.unshift(
        day.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      );
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return result;
}
export function running(values: number[]) {
  let total = 0;
  return values.map((value) => (total += value));
}
