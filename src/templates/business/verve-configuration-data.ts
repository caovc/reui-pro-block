import type { DriveSettingsMember } from "@/templates/collaboration/drive-settings-data";
import type { FluxEndpoint } from "@/templates/workflow/flux-settings-model";

export type VerveConfigurationSection = "integrations" | "api-keys" | "webhooks";
export interface VerveIntegration {
  id: string;
  name: string;
  description: string;
  icon:
    | "chat"
    | "payments"
    | "database"
    | "workflow"
    | "video"
    | "recording"
    | "community"
    | "ai"
    | "music";
  connected: boolean;
}
export type VerveKeyStack = "Next.js" | "React SPA" | "Node API" | "Python" | "Go" | "Webhooks";
export interface VerveApiKey {
  id: string;
  name: string;
  kind: "publishable" | "secret" | "restricted";
  status: "Active" | "Rotating" | "Restricted" | "Revoked";
  owners: string[];
  environment: string;
  stack: VerveKeyStack;
  value: string;
  lastUsed: string;
  version: number;
  scopes: string[];
  expiration: string;
}
export interface VerveKeyDraft {
  name: string;
  stack: VerveKeyStack;
  environment: string;
  expiration: string;
  owners: string[];
  scopes: string[];
}
export interface VerveEndpoint extends FluxEndpoint {
  events: string[];
}
export interface VerveEndpointDraft {
  name: string;
  hostPath: string;
  events: string[];
  signingSecret: string;
  enabled: boolean;
}
// Local original access owners, never copied source avatars or identities.
export const verveKeyOwners: DriveSettingsMember[] = [
  {
    id: "elena",
    name: "Elena Park",
    email: "elena@bricklane.test",
    access: "Admin",
    role: "Operations lead",
    department: "Revenue",
    status: "Active",
  },
  {
    id: "milo",
    name: "Milo Reed",
    email: "milo@bricklane.test",
    access: "Member",
    role: "Account manager",
    department: "Sales",
    status: "Active",
  },
  {
    id: "nadia",
    name: "Nadia Stone",
    email: "nadia@bricklane.test",
    access: "Member",
    role: "Analyst",
    department: "Revenue",
    status: "Active",
  },
];
export const verveKeyScopes = [
  "Read deals",
  "Write deals",
  "Read contacts",
  "Write contacts",
  "Read quotes",
  "Verify webhooks",
] as const;
export const verveWebhookEvents = [
  "deal.stage_changed",
  "deal.won",
  "deal.lost",
  "contact.created",
  "contact.updated",
  "quote.accepted",
  "quote.declined",
  "quote.expired",
  "approval.decided",
  "approval.requested",
] as const;
export const verveKeyStacks: VerveKeyStack[] = [
  "Next.js",
  "React SPA",
  "Node API",
  "Python",
  "Go",
  "Webhooks",
];
export const verveKeyEnvironments = [
  ["Production", "Live keys with customer traffic."],
  ["Staging", "Pre-release integration testing."],
  ["Development", "Local development and preview builds."],
] as const;
export const verveKeyExpirations = ["30 days", "90 days", "180 days", "No expiration"];
export const verveStackDescriptions: Record<VerveKeyStack, string> = {
  "Next.js": "App Router, route handlers, and server actions.",
  "React SPA": "Client applications and browser bundles.",
  "Node API": "Server routes and background services.",
  Python: "Data jobs and automation workers.",
  Go: "Go services and background workers.",
  Webhooks: "Verify incoming webhook requests.",
};
export function createVerveIntegrations(): VerveIntegration[] {
  return [
    {
      id: "slack",
      name: "Slack",
      description: "Deal alerts, approvals, and hand-offs in your channels.",
      icon: "chat",
      connected: true,
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Invoices, renewals, and payouts synced to each account.",
      icon: "payments",
      connected: false,
    },
    {
      id: "supabase",
      name: "Supabase",
      description: "Account and contact events for live dashboards.",
      icon: "database",
      connected: true,
    },
    {
      id: "n8n",
      name: "n8n",
      description: "Lead routing runs: successes and failures in one place.",
      icon: "workflow",
      connected: true,
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "Call recordings, attendance, and follow-ups synced.",
      icon: "video",
      connected: false,
    },
    {
      id: "loom",
      name: "Loom",
      description: "Async demo walkthroughs and deal recaps in one queue.",
      icon: "recording",
      connected: true,
    },
    {
      id: "discord",
      name: "Discord",
      description: "Partner community signals routed to internal channels.",
      icon: "community",
      connected: false,
    },
    {
      id: "gemini",
      name: "Gemini",
      description: "AI for outreach drafts and proposal workflows.",
      icon: "ai",
      connected: false,
    },
    {
      id: "spotify",
      name: "Spotify",
      description: "Focus playlists for the floor during outreach blocks.",
      icon: "music",
      connected: false,
    },
  ];
}
export function createVerveApiKeys(): VerveApiKey[] {
  const base = {
    environment: "Production",
    scopes: ["Read deals", "Read contacts"],
    expiration: "90 days",
    version: 1,
  };
  return [
    {
      ...base,
      id: "publishable",
      name: "Browser publishable key",
      kind: "publishable",
      status: "Active",
      owners: ["elena"],
      stack: "Next.js",
      value: "bk_demo_publishable_bricklane_01",
      lastUsed: "4m ago",
    },
    {
      ...base,
      id: "server",
      name: "Server default",
      kind: "secret",
      status: "Active",
      owners: ["milo"],
      stack: "Node API",
      value: "bk_demo_secret_server_bricklane_02",
      lastUsed: "11m ago",
    },
    {
      ...base,
      id: "pipeline",
      name: "Pipeline sync worker",
      kind: "secret",
      status: "Rotating",
      owners: ["nadia"],
      stack: "Python",
      value: "bk_demo_secret_worker_bricklane_03",
      lastUsed: "22m ago",
    },
    {
      ...base,
      id: "verifier",
      name: "Webhook verifier",
      kind: "restricted",
      status: "Restricted",
      owners: ["elena"],
      stack: "Webhooks",
      value: "bk_demo_restricted_verifier_04",
      lastUsed: "2h ago",
    },
  ];
}
export function createVerveKeyDraft(): VerveKeyDraft {
  return {
    name: "",
    stack: "Next.js",
    environment: "Production",
    expiration: "90 days",
    owners: ["elena", "milo"],
    scopes: ["Read deals", "Read contacts"],
  };
}
export function createVerveEndpoints(): VerveEndpoint[] {
  const common = {
    secretVersion: 1,
    signingSecret: "bk_demo_webhook_signing_v1",
    events: ["deal.stage_changed"],
  };
  return [
    {
      ...common,
      id: "pipeline",
      name: "Pipeline Sync",
      url: "https://studio.bricklane.test/webhooks/pipeline",
      icon: "bot",
      enabled: true,
      delivery: "Delivering",
      health: [
        { level: "healthy", message: "Pipeline Sync is delivering subscribed events normally." },
      ],
      lastDelivery: "2m ago",
    },
    {
      ...common,
      id: "contacts",
      name: "Contact Ledger",
      url: "https://studio.bricklane.test/webhooks/contacts",
      icon: "list",
      enabled: true,
      delivery: "Delivering",
      health: [
        {
          level: "warning",
          message: "Signing secret was rotated 28d ago. Consider refreshing it soon.",
        },
      ],
      lastDelivery: "4m ago",
    },
    {
      ...common,
      id: "quotes",
      name: "Quote Orchestrator",
      url: "https://studio.bricklane.test/webhooks/quotes",
      icon: "retry",
      enabled: true,
      delivery: "Retrying",
      health: [
        {
          level: "critical",
          message: "Quote Orchestrator has deliveries waiting for retry review.",
        },
        { level: "warning", message: "Signing secret rotation is due within 5 days." },
      ],
      lastDelivery: "8m ago",
    },
    {
      ...common,
      id: "approvals",
      name: "Approval Reconciliation",
      url: "https://studio.bricklane.test/webhooks/approvals",
      icon: "wallet",
      enabled: false,
      delivery: "Delivering",
      health: [
        {
          level: "warning",
          message: "Approval Reconciliation is paused and not receiving new events.",
        },
      ],
      lastDelivery: "1h ago",
    },
    {
      ...common,
      id: "escalations",
      name: "Escalation Intake",
      url: "https://studio.bricklane.test/webhooks/escalations",
      icon: "shield",
      enabled: true,
      delivery: "Delivering",
      health: [
        {
          level: "warning",
          message: "Last delivery landed 47m ago. Check if that delay is expected.",
        },
      ],
      lastDelivery: "47m ago",
    },
  ];
}
export function createVerveEndpointDraft(): VerveEndpointDraft {
  return {
    name: "",
    hostPath: "",
    events: [],
    signingSecret: "bk_demo_webhook_new_endpoint",
    enabled: true,
  };
}
