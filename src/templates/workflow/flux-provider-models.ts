import { useState } from "react";
export type ProviderConnection = {
  id: string;
  name: string;
  status: string;
  metric: string;
  route: string;
  purpose: string;
  endpoint: string;
  owner: string;
  role: string;
  enabled: boolean;
  priority: number;
  credential: boolean;
};
const providerSeed: ProviderConnection[] = [
  {
    id: "PROV-2041",
    name: "OpenRoute Primary",
    status: "Connected",
    metric: "420ms p95",
    route: "ROUTE-318",
    purpose: "Primary low-latency route",
    endpoint: "https://api.openroute.example/v1",
    owner: "Mira Stone",
    role: "Primary",
    enabled: true,
    priority: 1,
    credential: true,
  },
  {
    id: "PROV-2042",
    name: "Northstar Claude Pool",
    status: "Degraded",
    metric: "12s p95 review",
    route: "ROUTE-319",
    purpose: "Fallback for long context",
    endpoint: "https://northstar.example/v1",
    owner: "Leo Grant",
    role: "Fallback",
    enabled: true,
    priority: 2,
    credential: true,
  },
  {
    id: "PROV-2043",
    name: "VectorEdge Small",
    status: "Connected",
    metric: "180ms p95",
    route: "ROUTE-320",
    purpose: "Cost saver for triage",
    endpoint: "https://vectoredge.example/v1",
    owner: "Leo Grant",
    role: "Fallback",
    enabled: true,
    priority: 3,
    credential: true,
  },
  {
    id: "PROV-2044",
    name: "Local Guardrail Runner",
    status: "Missing Key",
    metric: "6h safety SLA",
    route: "SAFE-0914",
    purpose: "Safety gate before tools",
    endpoint: "https://guardrail.example/v1",
    owner: "Nora Vale",
    role: "Guardrail",
    enabled: false,
    priority: 4,
    credential: false,
  },
  {
    id: "PROV-2045",
    name: "Batch Summarizer Fleet",
    status: "Paused",
    metric: "$11.40 per 1M tokens",
    route: "BUD-2210",
    purpose: "Batch fallback lane",
    endpoint: "https://batch.example/v1",
    owner: "Theo Park",
    role: "Fallback",
    enabled: false,
    priority: 5,
    credential: true,
  },
  {
    id: "PROV-2046",
    name: "Atlas Vision Proxy",
    status: "Connected",
    metric: "910ms p95",
    route: "ROUTE-452",
    purpose: "Vision overflow route",
    endpoint: "https://vision.example/v1",
    owner: "Mira Stone",
    role: "Primary",
    enabled: true,
    priority: 6,
    credential: true,
  },
  {
    id: "PROV-2047",
    name: "Embedding Gateway",
    status: "Degraded",
    metric: "260ms p95",
    route: "ROUTE-487",
    purpose: "Context recall fallback",
    endpoint: "https://embedding.example/v1",
    owner: "Leo Grant",
    role: "Fallback",
    enabled: true,
    priority: 7,
    credential: true,
  },
  {
    id: "PROV-2048",
    name: "Canary Replay Pool",
    status: "Missing Key",
    metric: "4h eval SLA",
    route: "SAFE-1042",
    purpose: "Redteam replay before rollout",
    endpoint: "https://canary.example/v1",
    owner: "Nora Vale",
    role: "Guardrail",
    enabled: false,
    priority: 8,
    credential: false,
  },
];
export type RoutingRule = {
  id: string;
  name: string;
  description: string;
  risk: string;
  fallback: string;
  note: string;
  providerFallback: boolean;
  longContext: boolean;
  safety: boolean;
  lowCost: boolean;
};
const routeSeed: RoutingRule[] = [
  {
    id: "ROUTE-318",
    name: "Support Reply Drafts",
    description: "1.8M requests/day use VectorEdge fallback.",
    risk: "Low",
    fallback: "VectorEdge Small",
    note: "Mira Stone allows low risk cost routing.",
    providerFallback: true,
    longContext: false,
    safety: false,
    lowCost: true,
  },
  {
    id: "ROUTE-319",
    name: "Renewal Risk Summaries",
    description: "Northstar handles 22M to 64M token days.",
    risk: "Medium",
    fallback: "Northstar Claude Pool",
    note: "Leo Grant reviews latency drift weekly.",
    providerFallback: true,
    longContext: true,
    safety: false,
    lowCost: false,
  },
  {
    id: "SAFE-0914",
    name: "Invoice Variance Explainers",
    description: "Nora Vale requires review inside 6 hours.",
    risk: "High",
    fallback: "Local Guardrail Runner",
    note: "SAFE-0914 keeps finance copy gated.",
    providerFallback: true,
    longContext: true,
    safety: true,
    lowCost: false,
  },
  {
    id: "SAFE-1042",
    name: "Payment Action Drafts",
    description: "Elijah Morgan blocks unsafe fallback edits.",
    risk: "Restricted",
    fallback: "No fallback",
    note: "A Restricted route needs somewhere to fall back to.",
    providerFallback: false,
    longContext: false,
    safety: false,
    lowCost: false,
  },
];
export function useFluxProviderModel() {
  const [providers, setProviders] = useState(providerSeed);
  const [routes, setRoutes] = useState(routeSeed);
  const [active, setActive] = useState(true);
  return { providers, setProviders, routes, setRoutes, active, setActive };
}
