// Independent local demo identity. The existing Pro dialog owns its complete form.
export const fluxProfileSeed: Readonly<Record<string, string | boolean>> = {
  fullName: "Nick Bold",
  email: "nick@bricklane.example",
  username: "nickbold",
  role: "Owner",
  timezone: "(GMT-5) New York",
  website: "bricklane.example/nick",
  bio: "Coordinates run health, approvals, provider routing and spend for Atlas.",
  workspaceName: "Atlas",
  supportEmail: "support@bricklane.example",
  billingEmail: "billing@bricklane.example",
  inviteDomain: "bricklane.example",
};

import { useState } from "react";
import type {
  SettingsValue,
  SettingsValues,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";

export type FluxWorkspaceSettings = {
  retryOnce: boolean;
  haltOnSpendSpike: boolean;
  keepTraces: boolean;
  redactSecrets: boolean;
};
export type FluxIntegration = {
  id: string;
  name: string;
  provider: string;
  purpose: string;
  apiKey: string;
  dailyCalls: number;
  enabled: boolean;
};
export type FluxEndpoint = {
  id: string;
  name: string;
  url: string;
  icon: "bot" | "list" | "retry" | "wallet" | "shield";
  enabled: boolean;
  delivery: "Delivering" | "Retrying";
  health: readonly { level: "healthy" | "warning" | "critical"; message: string }[];
  secretVersion: number;
  signingSecret: string;
  lastDelivery: string;
};
const integrationSeed: readonly Omit<FluxIntegration, "id" | "apiKey">[] = [
  {
    name: "Access Audit",
    provider: "Supabase",
    purpose: "Role changes and access review logs",
    dailyCalls: 5800,
    enabled: false,
  },
  {
    name: "Approval Dispatch",
    provider: "Slack",
    purpose: "Routes pending approvals to their reviewers",
    dailyCalls: 8900,
    enabled: true,
  },
  {
    name: "Budget Top-up",
    provider: "Stripe",
    purpose: "Adjusts a provider budget ceiling",
    dailyCalls: 10000,
    enabled: true,
  },
  {
    name: "Cost Anomaly Watch",
    provider: "Stripe",
    purpose: "Cost spikes and recovery alerts",
    dailyCalls: 12850,
    enabled: false,
  },
  {
    name: "Deploy Monitor",
    provider: "n8n",
    purpose: "Build status and rollout tracking",
    dailyCalls: 16200,
    enabled: true,
  },
  {
    name: "Draft Model",
    provider: "Gemini",
    purpose: "First pass before the primary model",
    dailyCalls: 8200,
    enabled: false,
  },
  {
    name: "Escalation Room",
    provider: "Discord",
    purpose: "Human handoff for refused runs",
    dailyCalls: 6400,
    enabled: false,
  },
  {
    name: "Eval Recordings",
    provider: "Loom",
    purpose: "Captures attached to evaluation failures",
    dailyCalls: 14500,
    enabled: false,
  },
  {
    name: "Incident Bot",
    provider: "Discord",
    purpose: "Incident threads and status summaries",
    dailyCalls: 3200,
    enabled: true,
  },
  {
    name: "Incident Notifier",
    provider: "Slack",
    purpose: "High-priority workspace alerts",
    dailyCalls: 9600,
    enabled: false,
  },
  {
    name: "Knowledge Index",
    provider: "Notion",
    purpose: "Reference material for workspace agents",
    dailyCalls: 7800,
    enabled: true,
  },
  {
    name: "Ledger Export",
    provider: "Supabase",
    purpose: "Period summaries for the operations ledger",
    dailyCalls: 4200,
    enabled: true,
  },
  {
    name: "Model Router",
    provider: "OpenAI",
    purpose: "Primary model routing for new runs",
    dailyCalls: 18400,
    enabled: true,
  },
  {
    name: "Operator Directory",
    provider: "Notion",
    purpose: "Maps operators to review teams",
    dailyCalls: 2700,
    enabled: false,
  },
  {
    name: "Policy Sync",
    provider: "GitHub",
    purpose: "Publishes reviewed execution policies",
    dailyCalls: 5100,
    enabled: true,
  },
  {
    name: "Queue Enricher",
    provider: "n8n",
    purpose: "Adds context before a run enters review",
    dailyCalls: 11300,
    enabled: true,
  },
  {
    name: "Release Notes",
    provider: "Linear",
    purpose: "Delivery notes linked to completed work",
    dailyCalls: 3800,
    enabled: false,
  },
  {
    name: "Retry Planner",
    provider: "Gemini",
    purpose: "Plans bounded retries for transient errors",
    dailyCalls: 9200,
    enabled: true,
  },
  {
    name: "Review Inbox",
    provider: "Slack",
    purpose: "Summaries of pending human decisions",
    dailyCalls: 6100,
    enabled: true,
  },
  {
    name: "Run Archive",
    provider: "Supabase",
    purpose: "Retains local run references",
    dailyCalls: 13750,
    enabled: false,
  },
  {
    name: "Run Events",
    provider: "n8n",
    purpose: "Routes run lifecycle events",
    dailyCalls: 15600,
    enabled: true,
  },
  {
    name: "Safety Check",
    provider: "OpenAI",
    purpose: "Checks tool arguments against policy",
    dailyCalls: 12100,
    enabled: true,
  },
  {
    name: "Session Tracker",
    provider: "Supabase",
    purpose: "Operator session summaries",
    dailyCalls: 1900,
    enabled: false,
  },
  {
    name: "Spend Ledger",
    provider: "Stripe",
    purpose: "Daily workspace spend summaries",
    dailyCalls: 8700,
    enabled: true,
  },
  {
    name: "Status Digest",
    provider: "Resend",
    purpose: "Scheduled operations digests",
    dailyCalls: 4500,
    enabled: true,
  },
  {
    name: "Task Capture",
    provider: "Linear",
    purpose: "Connects follow-up work to run evidence",
    dailyCalls: 7300,
    enabled: false,
  },
  {
    name: "Template Search",
    provider: "Notion",
    purpose: "Finds reusable workflow references",
    dailyCalls: 6800,
    enabled: true,
  },
  {
    name: "Token Audit",
    provider: "OpenAI",
    purpose: "Usage records for model review",
    dailyCalls: 14900,
    enabled: true,
  },
  {
    name: "Trace Export",
    provider: "Supabase",
    purpose: "Run trace metadata for local analysis",
    dailyCalls: 5600,
    enabled: false,
  },
  {
    name: "Usage Reader",
    provider: "Gemini",
    purpose: "Daily model usage totals",
    dailyCalls: 10800,
    enabled: true,
  },
  {
    name: "Workspace Sync",
    provider: "GitHub",
    purpose: "Workspace configuration references",
    dailyCalls: 3900,
    enabled: true,
  },
];
export const fluxOperators = [
  { name: "Nick Bold", role: "Owner" },
  { name: "Ava Chen", role: "Operator" },
  { name: "Mira Stone", role: "Operator" },
  { name: "Leah Brooks", role: "Viewer" },
] as const;
function initialIntegrations(): FluxIntegration[] {
  return integrationSeed.map((row, index) => ({
    ...row,
    id: `integration-${index + 1}`,
    apiKey: `bk_demo_${row.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_")}_${String(index + 1).padStart(3, "0")}`,
  }));
}
function initialEndpoints(): FluxEndpoint[] {
  return [
    {
      id: "runs",
      name: "Run Lifecycle",
      url: "https://events.bricklane.example/webhooks/runs",
      icon: "bot",
      enabled: true,
      delivery: "Delivering",
      health: [
        { level: "healthy", message: "Run Lifecycle is delivering subscribed events normally." },
      ],
      secretVersion: 1,
      signingSecret: "bk_demo_hook_runs_v1",
      lastDelivery: "2m ago",
    },
    {
      id: "approvals",
      name: "Approval Queue",
      url: "https://ingest.bricklane.example/webhooks/approvals",
      icon: "list",
      enabled: true,
      delivery: "Delivering",
      health: [
        {
          level: "warning",
          message: "Signing secret was rotated 28d ago. Consider refreshing it soon.",
        },
      ],
      secretVersion: 1,
      signingSecret: "bk_demo_hook_approvals_v1",
      lastDelivery: "5m ago",
    },
    {
      id: "retries",
      name: "Retry Orchestrator",
      url: "https://ops.bricklane.example/webhooks/retries",
      icon: "retry",
      enabled: true,
      delivery: "Retrying",
      health: [
        {
          level: "critical",
          message: "Retry Orchestrator has deliveries waiting for retry review.",
        },
        { level: "warning", message: "Signing secret rotation is due within 5 days." },
      ],
      secretVersion: 1,
      signingSecret: "bk_demo_hook_retries_v1",
      lastDelivery: "12m ago",
    },
    {
      id: "spend",
      name: "Token Ledger Sync",
      url: "https://ledger.bricklane.example/webhooks/spend",
      icon: "wallet",
      enabled: false,
      delivery: "Delivering",
      health: [
        { level: "warning", message: "Token Ledger Sync is paused and not receiving new events." },
      ],
      secretVersion: 1,
      signingSecret: "bk_demo_hook_spend_v1",
      lastDelivery: "32m ago",
    },
    {
      id: "incidents",
      name: "Incident Intake",
      url: "https://risk.bricklane.example/webhooks/incidents",
      icon: "shield",
      enabled: true,
      delivery: "Delivering",
      health: [
        {
          level: "warning",
          message: "Last delivery landed 47m ago. Check if that delay is expected.",
        },
      ],
      secretVersion: 1,
      signingSecret: "bk_demo_hook_incidents_v1",
      lastDelivery: "47m ago",
    },
  ];
}
export function useFluxSettingsModel() {
  const [workspace, setWorkspace] = useState<FluxWorkspaceSettings>({
    retryOnce: true,
    haltOnSpendSpike: true,
    keepTraces: true,
    redactSecrets: true,
  });
  const [security, setSecurity] = useState<SettingsValues>({
    twoFactor: false,
    sessionTimeout: "4 hours",
    singleSession: false,
    passwordLogin: true,
    magicLink: true,
  });
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [endpoints, setEndpoints] = useState(initialEndpoints);
  const setWorkspaceValue = (key: keyof FluxWorkspaceSettings, enabled: boolean) =>
    setWorkspace((current) => ({ ...current, [key]: enabled }));
  const setSecurityValue = (key: string, value: SettingsValue) =>
    setSecurity((current) => ({ ...current, [key]: value }));
  const setIntegrationEnabled = (id: string, enabled: boolean) =>
    setIntegrations((current) => current.map((row) => (row.id === id ? { ...row, enabled } : row)));
  const pauseAll = (paused: boolean) =>
    setIntegrations((current) => current.map((row) => ({ ...row, enabled: !paused })));
  const setEndpointEnabled = (id: string, enabled: boolean) =>
    setEndpoints((current) => current.map((row) => (row.id === id ? { ...row, enabled } : row)));
  const removeEndpoint = (id: string) =>
    setEndpoints((current) => current.filter((row) => row.id !== id));
  const rotateEndpoint = (id: string) => {
    const current = endpoints.find((row) => row.id === id);
    if (!current) return;
    const secretVersion = current.secretVersion + 1;
    const signingSecret = `bk_demo_hook_${id}_${crypto.randomUUID()}`;
    setEndpoints((rows) =>
      rows.map((row) => (row.id === id ? { ...row, secretVersion, signingSecret } : row)),
    );
    return { secretVersion, signingSecret };
  };
  return {
    workspace,
    security,
    integrations,
    endpoints,
    setWorkspaceValue,
    setSecurityValue,
    setIntegrationEnabled,
    pauseAll,
    setEndpointEnabled,
    removeEndpoint,
    rotateEndpoint,
  };
}
export type FluxSettingsModel = ReturnType<typeof useFluxSettingsModel>;
