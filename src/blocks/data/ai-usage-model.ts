/** Independent demonstration fixtures and graduated pricing; no provider API. */
export const hostedModels = [
  { name: "GPT-5.1 mini", rate: 0.6875, note: "Quick drafts and triage", latency: 310 },
  { name: "GPT-5.1", rate: 3.4375, note: "General reasoning", latency: 540 },
  { name: "Gemini 3 Pro", rate: 4.5, note: "Long documents and files", latency: 620 },
  { name: "Claude Sonnet 5", rate: 6, note: "Agentic runs and code", latency: 480 },
];
export const addons = [
  { name: "Web Search", flat: 30, rate: 0 },
  { name: "Code Interpreter", flat: 45, rate: 0 },
  { name: "Long Context", flat: 0, rate: 0.25 },
  { name: "Priority Lane", flat: 0, rate: 0.4 },
  { name: "Zero Retention", flat: 180, rate: 0 },
];
export const tokenStops = Array.from({ length: 81 }, (_, index) =>
  Number((10 ** (index / 20)).toPrecision(2)),
);
export const usd = (value: number, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
export const tokenLabel = (millions: number) =>
  millions >= 1000 ? `${Number((millions / 1000).toPrecision(3))}B` : `${millions}M`;
export function quoteFor(millions: number, model: number, selected: string[], annual: boolean) {
  const rate = hostedModels[model].rate;
  const raw = millions * rate;
  const billedUnits =
    Math.min(millions, 10) +
    Math.min(Math.max(millions - 10, 0), 90) * 0.9 +
    Math.min(Math.max(millions - 100, 0), 900) * 0.8 +
    Math.max(millions - 1000, 0) * 0.7;
  const extras = addons
    .filter((a) => selected.includes(a.name))
    .map((a) => ({ name: a.name, amount: a.flat + a.rate * millions }));
  const subtotal = billedUnits * rate + extras.reduce((sum, extra) => sum + extra.amount, 0);
  return {
    raw,
    discount: raw - billedUnits * rate,
    extras,
    annualDiscount: annual ? subtotal * 0.12 : 0,
    total: subtotal * (annual ? 0.88 : 1),
    band: millions >= 1000 ? 30 : millions >= 100 ? 20 : millions >= 10 ? 10 : 0,
  };
}
