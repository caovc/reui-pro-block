import { useState } from "react";
export type OperationRule = {
  id: string;
  name: string;
  provider: string;
  category: string;
  scope: string;
  kind: string;
  tokens: number;
  status: string;
  latency: string;
};
const rules: OperationRule[] = [
  {
    id: "ROUTE-324",
    name: "Renewal risk summary",
    provider: "Northstar Claude Pool",
    category: "Long Context",
    scope: "Support",
    kind: "Fallback",
    tokens: 3200000,
    status: "Healthy",
    latency: "2.1s p95",
  },
  {
    id: "ROUTE-323",
    name: "Payment action review",
    provider: "Local Guardrail Runner",
    category: "Safety",
    scope: "Finance",
    kind: "Guardrail",
    tokens: 1300000,
    status: "Blocked",
    latency: "680ms p95",
  },
  {
    id: "ROUTE-322",
    name: "Nightly account summary",
    provider: "Batch Summarizer Fleet",
    category: "Batch",
    scope: "Platform",
    kind: "Batch",
    tokens: 840000,
    status: "Paused",
    latency: "8.4s p95",
  },
  {
    id: "ROUTE-321",
    name: "Invoice variance explainer",
    provider: "VectorEdge Small",
    category: "Finance",
    scope: "Finance",
    kind: "Primary",
    tokens: 1800000,
    status: "Healthy",
    latency: "740ms p95",
  },
  {
    id: "ROUTE-320",
    name: "Support reply drafts",
    provider: "OpenRoute Primary",
    category: "Drafting",
    scope: "Support",
    kind: "Primary",
    tokens: 2400000,
    status: "Healthy",
    latency: "910ms p95",
  },
  {
    id: "ROUTE-319",
    name: "Customer context recall",
    provider: "Embedding Gateway",
    category: "Retrieval",
    scope: "Product",
    kind: "Fallback",
    tokens: 1600000,
    status: "Healthy",
    latency: "260ms p95",
  },
  {
    id: "ROUTE-318",
    name: "Long context fallback",
    provider: "Northstar Claude Pool",
    category: "Long Context",
    scope: "Support",
    kind: "Fallback",
    tokens: 2200000,
    status: "Healthy",
    latency: "1.8s p95",
  },
];
export function useAiOperationsModel() {
  const [records, setRecords] = useState(rules);
  const [step, setStep] = useState(2);
  const [notes, setNotes] = useState("ROUTE-318 shifted 18 percent at 09:20.");
  return { records, setRecords, step, setStep, notes, setNotes };
}
