import { useCallback, useState } from "react";

export const STRATA_API_SCOPES = ["events:write", "metrics:write", "logs:write"] as const;
export type StrataApiScope = (typeof STRATA_API_SCOPES)[number];
export interface StrataApiKey {
  id: string;
  name: string;
  provider: string;
  purpose: string;
  token: string;
  dailyCalls: number;
  enabled: boolean;
  scopes: StrataApiScope[];
}
export type StrataApiKeyDraft = Pick<StrataApiKey, "name" | "purpose" | "enabled" | "scopes">;

const observedNames = [
  ["AI Summarizer", "Gemini", "Alert noise grouping and root-cause hints", 4100],
  ["Alert Notifier", "Slack", "Firing alerts posted to #alerts", 13000],
  ["Auth Log Stream", "Supabase", "Session events streamed into Logs", 15000],
  ["Billing Metrics", "Stripe", "Invoice and renewal counters", 25000],
  ["Bridge Webhooks", "Zoom", "Incident bridge start and end events", 11300],
  ["Call Quality", "Zoom", "Bridge audio and video quality metrics", 5600],
  ["Checkout Webhooks", "Stripe", "Payment callbacks for checkout-api", 10000],
  ["Database Metrics", "Neon", "Query latency and connection pool usage", 9500],
  ["DB Replication", "Neon", "Cross-region read replica lag", 22100],
  ["Deploy Reviews", "Loom", "Release walkthroughs and feedback", 2900],
] as const;
const independentNames = [
  "Edge Telemetry",
  "Error Digest",
  "Event Archive",
  "Gateway Metrics",
  "Host Inventory",
  "Incident Notes",
  "Job Heartbeats",
  "Ledger Events",
  "Log Forwarder",
  "Monitor Checks",
  "On-call Events",
  "Payments Audit",
  "Queue Metrics",
  "Release Notes",
  "Search Telemetry",
  "Service Catalog",
  "Status Updates",
  "Trace Intake",
  "Usage Summary",
  "Warehouse Events",
  "Workspace Audit",
];

/** Only the first ten source rows were observed; the remaining 21 are original fixtures. */
export function createStrataApiKeys(): StrataApiKey[] {
  return [
    ...observedNames,
    ...independentNames.map(
      (name, index) =>
        [name, "Bricklane", "Local telemetry integration", 1800 + index * 173] as const,
    ),
  ].map(([name, provider, purpose, dailyCalls], index) => ({
    id: `integration-${index + 1}`,
    name,
    provider,
    purpose,
    token: `bl_demo_not_a_secret_${String(index + 1).padStart(2, "0")}_bricklane`,
    dailyCalls,
    enabled: index < 10 ? [4, 6, 8].includes(index) : index % 3 === 0,
    scopes: [STRATA_API_SCOPES[index % STRATA_API_SCOPES.length]],
  }));
}

export function apiKeyEnabled(key: StrataApiKey, paused: boolean) {
  return !paused && key.enabled;
}
export function updateStrataApiKey(
  keys: readonly StrataApiKey[],
  id: string,
  draft: StrataApiKeyDraft,
) {
  if (!keys.some((key) => key.id === id))
    return { ok: false as const, error: "This integration no longer exists." };
  if (!draft.name.trim()) return { ok: false as const, error: "Enter an integration name." };
  if (!draft.scopes.length || draft.scopes.some((scope) => !STRATA_API_SCOPES.includes(scope)))
    return { ok: false as const, error: "Choose at least one supported scope." };
  return {
    ok: true as const,
    keys: keys.map((key) =>
      key.id === id
        ? {
            ...key,
            ...draft,
            name: draft.name.trim(),
            purpose: draft.purpose.trim(),
            scopes: [...new Set(draft.scopes)],
          }
        : key,
    ),
  };
}

export function useStrataSettingsApiModel() {
  const [keys, setKeys] = useState(createStrataApiKeys);
  const [paused, setPaused] = useState(false);
  const setEnabled = useCallback(
    (id: string, enabled: boolean) =>
      setKeys((current) => current.map((key) => (key.id === id ? { ...key, enabled } : key))),
    [],
  );
  const updateKey = useCallback(
    (id: string, draft: StrataApiKeyDraft) => {
      const result = updateStrataApiKey(keys, id, draft);
      if (result.ok) setKeys(result.keys);
      return result;
    },
    [keys],
  );
  return { keys, paused, setPaused, setEnabled, updateKey };
}
