import { useState } from "react";
export type CostRecord = {
  id: string;
  name: string;
  provider: string;
  owner: string;
  scope: string;
  state: string;
  spend: number;
  cap: number;
  unit: number;
  tokens: number;
  updated: string;
};
const costs: CostRecord[] = [
  {
    id: "PROV-2041",
    name: "OpenRoute Primary",
    provider: "OpenRoute Primary",
    owner: "Mira Stone",
    scope: "Provider",
    state: "Over Budget",
    spend: 68200,
    cap: 65000,
    unit: 6.82,
    tokens: 18600000,
    updated: "8 min ago",
  },
  {
    id: "PRM-4821",
    name: "Support Reply Draft",
    provider: "OpenRoute Primary",
    owner: "Alex Johnson",
    scope: "Prompt",
    state: "Over Budget",
    spend: 42800,
    cap: 40000,
    unit: 7.12,
    tokens: 18600000,
    updated: "12 min ago",
  },
  {
    id: "BUD-2210",
    name: "Northstar Claude Pool",
    provider: "Northstar Claude Pool",
    owner: "Nora Vale",
    scope: "Provider",
    state: "Nearing Cap",
    spend: 51400,
    cap: 60000,
    unit: 9.75,
    tokens: 12900000,
    updated: "18 min ago",
  },
  {
    id: "PRM-4926",
    name: "Renewal Risk Summary",
    provider: "Northstar Claude Pool",
    owner: "Priya Patel",
    scope: "Prompt",
    state: "Nearing Cap",
    spend: 34200,
    cap: 39000,
    unit: 8.88,
    tokens: 12900000,
    updated: "24 min ago",
  },
  {
    id: "TOK-7740",
    name: "VectorEdge Small",
    provider: "VectorEdge Small",
    owner: "Leo Grant",
    scope: "Provider",
    state: "Within Budget",
    spend: 21800,
    cap: 40000,
    unit: 0.42,
    tokens: 22400000,
    updated: "31 min ago",
  },
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `BUD-${2230 + i}`,
    name: [
      "Nightly Account Summary",
      "Local Guardrail Runner",
      "Payment Action Review",
      "Batch Summarizer Fleet",
      "Context Recall",
    ][i % 5],
    provider: [
      "Batch Summarizer Fleet",
      "Local Guardrail Runner",
      "Northstar Claude Pool",
      "Batch Summarizer Fleet",
      "VectorEdge Small",
    ][i % 5],
    owner: ["Theo Park", "Nora Vale", "Mira Stone", "Priya Patel", "Leo Grant"][i % 5],
    scope: i < 5 ? "Provider" : i < 12 ? "Prompt" : "Budget",
    state: i < 7 ? "Nearing Cap" : "Within Budget",
    spend: 12700 - i * 470,
    cap: 16000 + i * 500,
    unit: Number((1.18 + i * 0.14).toFixed(2)),
    tokens: 3400000 + i * 230000,
    updated: `${i + 1} hr ago`,
  })),
];
export type TokenRecord = {
  id: string;
  provider: string;
  prompt: string;
  input: number;
  output: number;
  state: string;
  cap: number;
  date: string;
};
const tokens: TokenRecord[] = [
  {
    id: "TOK-7740-0317",
    provider: "Northstar Claude Pool",
    prompt: "Renewal Risk Summary",
    input: 11200000,
    output: 3600000,
    state: "Pending Invoice",
    cap: 82,
    date: "Oct 23",
  },
  {
    id: "TOK-7740-0312",
    provider: "Northstar Claude Pool",
    prompt: "Renewal Risk Summary",
    input: 3600000,
    output: 1100000,
    state: "Pending Invoice",
    cap: 76,
    date: "Oct 22",
  },
  {
    id: "TOK-7740-0318",
    provider: "OpenRoute Primary",
    prompt: "Support Reply Draft",
    input: 1800000,
    output: 620000,
    state: "Within Budget",
    cap: 64,
    date: "Oct 23",
  },
  {
    id: "TOK-7740-0309",
    provider: "OpenRoute Primary",
    prompt: "Support Reply Draft",
    input: 980000,
    output: 410000,
    state: "Within Budget",
    cap: 49,
    date: "Oct 21",
  },
  {
    id: "TOK-7740-0314",
    provider: "Batch Summarizer Fleet",
    prompt: "Nightly Account Summary",
    input: 5400000,
    output: 840000,
    state: "Within Budget",
    cap: 58,
    date: "Oct 23",
  },
  {
    id: "TOK-7740-0315",
    provider: "VectorEdge Small",
    prompt: "Context Recall",
    input: 2400000,
    output: 540000,
    state: "Within Budget",
    cap: 55,
    date: "Oct 23",
  },
  {
    id: "TOK-7740-0316",
    provider: "Local Guardrail Runner",
    prompt: "Payment Action Review",
    input: 1900000,
    output: 410000,
    state: "Needs Review",
    cap: 91,
    date: "Oct 23",
  },
  {
    id: "TOK-7740-0319",
    provider: "Northstar Claude Pool",
    prompt: "Renewal Risk Summary",
    input: 640000,
    output: 260000,
    state: "Pending Invoice",
    cap: 86,
    date: "Oct 23",
  },
];
export function useFluxCostModel() {
  const [records, setRecords] = useState(costs);
  const [ledger, setLedger] = useState(tokens);
  return { records, setRecords, ledger, setLedger };
}
