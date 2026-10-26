import type {
  SettingsFieldDefinition,
  SettingsValues,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";

export const settingsGroups = [
  { label: "Workspace", sections: ["general", "members", "billing"] },
  { label: "Automation", sections: ["execution", "ai-models", "integrations"] },
  { label: "Developers", sections: ["webhooks", "audit-log"] },
  { label: "Account", sections: ["profile", "security"] },
] as const;
export type FlowlySettingsSection = (typeof settingsGroups)[number]["sections"][number];
export const settingsTitles: Record<FlowlySettingsSection, string> = {
  general: "General",
  members: "Members",
  billing: "Billing",
  execution: "Execution",
  "ai-models": "AI Models",
  integrations: "Integrations",
  webhooks: "Webhooks",
  "audit-log": "Audit Log",
  profile: "Profile",
  security: "Security",
};
export const settingsHeaderActions: Record<FlowlySettingsSection, string> = {
  general: "Share Workspace",
  members: "Export Members",
  billing: "Download Invoices",
  execution: "Pause All Runs",
  "ai-models": "Test Model",
  integrations: "Add Integration",
  webhooks: "Add Endpoint",
  "audit-log": "Export CSV",
  profile: "Reset Password",
  security: "Sign Out Everywhere",
};
export const settingsSummaries: Record<
  FlowlySettingsSection,
  { title: string; value: string; detail: string }
> = {
  general: {
    title: "Bricklane Labs",
    value: "Pro",
    detail: "app.brick.test/brick-labs. Schedules run on UTC.",
  },
  members: { title: "Seats", value: "6 of 10", detail: "4 seats left on the Pro plan, 1 invited." },
  billing: {
    title: "Next Invoice",
    value: "Oct 31",
    detail: "$249.00 charged to Visa ending 4242.",
  },
  execution: { title: "Run Queue", value: "Running", detail: "38 of 50 run slots busy, 4 queued." },
  "ai-models": {
    title: "Model Budget",
    value: "$40",
    detail: "68% spent. Resets Nov 1, then agents fall back past the cap.",
  },
  integrations: {
    title: "Integrations",
    value: "3 of 4",
    detail: "Google Calendar is not connected yet.",
  },
  webhooks: { title: "Delivery Health", value: "96.1%", detail: "1 endpoint retrying, 1 paused." },
  "audit-log": {
    title: "Audit Trail",
    value: "1,284",
    detail: "Kept for 1 year. Last export on Sep 30.",
  },
  profile: {
    title: "Profile",
    value: "Complete",
    detail: "Name, email, username and timezone are set.",
  },
  security: {
    title: "Security Status",
    value: "Healthy",
    detail: "All checks passed. 2FA enabled, sessions reviewed.",
  },
};
export const timezones = [
  {
    value: "Americas",
    items: ["(GMT-8) San Francisco", "(GMT-6) Chicago", "(GMT-5) New York", "(GMT-3) Sao Paulo"],
  },
  {
    value: "Europe",
    items: ["(GMT+0) London", "(GMT+1) Berlin", "(GMT+1) Amsterdam", "(GMT+2) Helsinki"],
  },
  {
    value: "Asia/Pacific",
    items: ["(GMT+5:30) Bengaluru", "(GMT+8) Singapore", "(GMT+9) Tokyo", "(GMT+11) Sydney"],
  },
];
export const languageOptions = [
  { label: "English", description: "Shared UI language" },
  { label: "German", description: "Localized workspace copy" },
  { label: "French", description: "Regional customer team view" },
];
export const landingOptions = [
  { label: "Dashboard", description: "Runs, spend and what needs you" },
  { label: "Workflows", description: "Jump into the workflows you own" },
  { label: "Agents", description: "Start with your AI agents" },
];
export const formDefaults: Partial<Record<FlowlySettingsSection, SettingsValues>> = {
  general: {
    workspaceName: "Bricklane Labs",
    domain: "brick-labs",
    language: "English",
    timezone: "(GMT+1) Berlin",
    dateFormat: "MM/DD/YYYY",
    snap: false,
    confirmDelete: true,
    compact: true,
  },
  billing: {
    email: "billing@brick.test",
    cycle: "Annual",
    taxId: "US-84-3921048",
    runCap: "250000",
    overage: true,
  },
  execution: {
    timeout: "5 Minutes",
    retry: "Exponential Backoff",
    concurrency: "50 Runs",
    quiet: true,
    weekends: false,
    reentry: false,
  },
  "ai-models": {
    model: "Claude Sonnet 5.5",
    creativity: "Balanced",
    budget: "40",
    approve: true,
    redact: true,
    store: false,
  },
  "audit-log": {
    retention: "1 Year",
    approval: true,
    note: "Exports are reviewed by workspace owners before sharing externally.",
  },
  profile: {
    name: "Nick Bold",
    email: "nick@brick.test",
    username: "nickbold",
    role: "Workspace Admin",
    timezone: "(GMT+1) Berlin",
    landing: "Workflows",
  },
  security: {
    emailSignup: true,
    password: true,
    verification: "Verification Code",
    lifetime: "24 Hours",
    trusted: true,
    revoke: true,
  },
};
export const formFields = {
  generalBasics: [
    {
      id: "workspaceName",
      controlId: "settings-workspace-name",
      label: "Workspace Name",
      description: "Used in shared pages and invites.",
    },
  ],
  generalEditor: [
    {
      id: "snap",
      controlId: "settings-send-enter",
      label: "Snap Steps To Grid",
      description: "Line steps up on the canvas as you drag them.",
      type: "switch",
    },
    {
      id: "confirmDelete",
      controlId: "settings-markdown",
      label: "Confirm Before Delete",
      description: "Ask before a step or an agent is removed.",
      type: "switch",
    },
    {
      id: "compact",
      controlId: "settings-compact-tables",
      label: "Compact Tables",
      description: "Fit more rows in run and agent lists.",
      type: "switch",
    },
  ],
  billingProfile: [
    {
      id: "email",
      controlId: "settings-billing-email",
      label: "Billing Email",
      description: "Finance inbox for invoices and receipts.",
      type: "email",
    },
    {
      id: "cycle",
      controlId: "settings-billing-cycle",
      label: "Billing Cycle",
      description: "Default cadence for subscription charges.",
      options: ["Monthly", "Annual", "Manual Invoice"],
    },
    {
      id: "taxId",
      controlId: "settings-tax-id",
      label: "Tax ID",
      description: "Displayed on generated invoices.",
    },
  ],
  billingAlert: [
    {
      id: "overage",
      controlId: "settings-overage-alert",
      label: "Overage Alert",
      description: "Email owners at 80% and 100% of the cap.",
      type: "switch",
    },
  ],
  executionDefaults: [
    {
      id: "timeout",
      controlId: "settings-step-timeout",
      label: "Step Timeout",
      description: "A step that runs longer fails and follows the retry policy.",
      options: ["30 Seconds", "5 Minutes", "30 Minutes"],
    },
    {
      id: "retry",
      controlId: "settings-retry-policy",
      label: "Retry Policy",
      description: "What happens when a step errors.",
      options: ["Exponential Backoff", "Fixed Interval", "No Retries"],
    },
    {
      id: "concurrency",
      controlId: "settings-concurrency",
      label: "Concurrent Runs",
      description: "Runs past the limit queue until a slot frees up.",
      options: ["10 Runs", "50 Runs", "200 Runs"],
    },
  ],
  executionScheduling: [
    {
      id: "quiet",
      controlId: "settings-quiet-hours",
      label: "Quiet Hours",
      description: "Hold scheduled runs overnight and start them at 8:00.",
      type: "switch",
    },
    {
      id: "weekends",
      controlId: "settings-skip-weekends",
      label: "Skip Weekends",
      description: "Delays and waits pause on Saturday and Sunday.",
      type: "switch",
    },
    {
      id: "reentry",
      controlId: "settings-re-entry",
      label: "Allow Re-Entry",
      description: "A record can go through a workflow again after it finishes.",
      type: "switch",
    },
  ],
  modelDefaults: [
    {
      id: "model",
      controlId: "settings-model",
      label: "Model",
      description: "Agents can override it per step.",
      options: ["Claude Sonnet 5.5", "Claude Opus 5.5", "Claude Haiku 4.5"],
    },
    {
      id: "creativity",
      controlId: "settings-creativity",
      label: "Response Style",
      description: "How much the model varies its answers.",
      options: ["Precise", "Balanced", "Creative"],
    },
  ],
  modelGuardrails: [
    {
      id: "approve",
      controlId: "settings-approve-tools",
      label: "Approve Tool Calls",
      description: "Pause the run for a person before an agent writes data.",
      type: "switch",
    },
    {
      id: "redact",
      controlId: "settings-redact-pii",
      label: "Redact Personal Data",
      description: "Mask emails, phone numbers and card numbers in prompts.",
      type: "switch",
    },
    {
      id: "store",
      controlId: "settings-store-prompts",
      label: "Store Prompts",
      description: "Keep prompts and outputs in run history for debugging.",
      type: "switch",
    },
  ],
  audit: [
    {
      id: "retention",
      controlId: "settings-audit-retention",
      label: "Retention",
      description: "How long audit events remain searchable.",
      options: ["90 Days", "1 Year", "Indefinite"],
    },
    {
      id: "approval",
      controlId: "settings-export-approval",
      label: "Export Approval",
      description: "Require owner approval for CSV exports.",
      type: "switch",
    },
    {
      id: "note",
      controlId: "settings-audit-note",
      label: "Audit Note",
      description: "Optional note attached to compliance exports.",
      type: "textarea",
    },
  ],
  profileIdentity: [
    {
      id: "name",
      controlId: "settings-full-name",
      label: "Full Name",
      description: "Used on assignments and reviews.",
    },
    {
      id: "email",
      controlId: "settings-email",
      label: "Email Address",
      description: "Primary sign-in and alert email.",
      type: "email",
    },
    {
      id: "username",
      controlId: "settings-username",
      label: "Username",
      description: "Used in mentions and shared links.",
      prefix: "@",
    },
  ],
  securitySignin: [
    {
      id: "emailSignup",
      controlId: "settings-email-signup",
      label: "Email Sign-Up",
      description: "Allow new members to register with email.",
      type: "switch",
    },
    {
      id: "password",
      controlId: "settings-password",
      label: "Password Sign-In",
      description: "Keep password login available for returning members.",
      type: "switch",
    },
    {
      id: "verification",
      controlId: "settings-verification",
      label: "Verification Method",
      description: "Primary email verification experience.",
      options: ["Verification Code", "Magic Link", "Passwordless First"],
    },
  ],
  securitySessions: [
    {
      id: "lifetime",
      controlId: "settings-session-duration",
      label: "Session Lifetime",
      description: "Default duration before re-authentication.",
      options: ["8 Hours", "24 Hours", "30 Days"],
    },
    {
      id: "trusted",
      controlId: "settings-trusted-devices",
      label: "Trusted Devices",
      description: "Allow members to remember approved browsers.",
      type: "switch",
    },
    {
      id: "revoke",
      controlId: "settings-revoke-sessions",
      label: "Revoke On Password Change",
      description: "End other sessions after password updates.",
      type: "switch",
    },
  ],
} satisfies Record<string, readonly SettingsFieldDefinition[]>;

export type MemberLevel = "Owner" | "Admin" | "Editor" | "Viewer";
export type MemberStatus = "Active" | "Invited" | "Needs review";
export type MemberArea = "Workflows" | "Agents" | "Billing" | "Integrations";
export type FlowlyMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  level: MemberLevel;
  status: MemberStatus;
  activity: string;
  areas: MemberArea[];
  inviteMessage?: string;
};
export const initialMembers: FlowlyMember[] = [
  {
    id: "hanna",
    name: "Hanna Berg",
    email: "hanna@brick.test",
    role: "Support Lead",
    team: "Support",
    level: "Editor",
    status: "Needs review",
    activity: "Today",
    areas: ["Workflows", "Agents"],
  },
  {
    id: "ines",
    name: "Ines Marchetti",
    email: "ines@brick.test",
    role: "Head of Operations",
    team: "Operations",
    level: "Admin",
    status: "Active",
    activity: "12 min ago",
    areas: ["Workflows", "Agents", "Billing", "Integrations"],
  },
  {
    id: "lena",
    name: "Lena Wade",
    email: "lena@brick.test",
    role: "Finance Ops",
    team: "Finance",
    level: "Viewer",
    status: "Invited",
    activity: "Invited 2 days ago",
    areas: ["Billing"],
  },
  {
    id: "nick",
    name: "Nick Bold",
    email: "nick@brick.test",
    role: "Workspace Admin",
    team: "Platform",
    level: "Owner",
    status: "Active",
    activity: "Active now",
    areas: ["Workflows", "Agents", "Billing", "Integrations"],
  },
  {
    id: "omar",
    name: "Omar Haddad",
    email: "omar@brick.test",
    role: "Data Engineer",
    team: "Data",
    level: "Editor",
    status: "Active",
    activity: "Yesterday",
    areas: ["Workflows"],
  },
  {
    id: "tomas",
    name: "Tomas Lindqvist",
    email: "tomas@brick.test",
    role: "Automation Engineer",
    team: "Engineering",
    level: "Editor",
    status: "Active",
    activity: "2 hours ago",
    areas: ["Workflows", "Integrations"],
  },
];
export type IntegrationUse = "Workflow steps" | "Agent tools" | "Run alerts";
export type FlowlyIntegration = {
  id: string;
  name: string;
  category: string;
  description: string;
  target: string;
  targetLabel: string;
  status: "Connected" | "Live" | "Paused" | "Needs setup";
  calls: string;
  lastSync: string;
  uses: IntegrationUse[];
  alert: boolean;
};
export const initialIntegrations: FlowlyIntegration[] = [
  {
    id: "slack",
    name: "Slack",
    category: "Messaging",
    description: "Post run alerts and approval requests.",
    target: "#ops-alerts",
    targetLabel: "Channel",
    status: "Connected",
    calls: "1,284",
    lastSync: "2 min ago",
    uses: ["Workflow steps", "Run alerts"],
    alert: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "AI model",
    description: "Fallback model for agent steps.",
    target: "brick-agents",
    targetLabel: "Project",
    status: "Connected",
    calls: "482",
    lastSync: "5 min ago",
    uses: ["Agent tools"],
    alert: true,
  },
  {
    id: "n8n",
    name: "n8n",
    category: "Automation",
    description: "Import and sync existing flows.",
    target: "n8n.brick.test",
    targetLabel: "Instance",
    status: "Live",
    calls: "96",
    lastSync: "1 min ago",
    uses: ["Workflow steps"],
    alert: false,
  },
  {
    id: "calendar",
    name: "Google Calendar",
    category: "Calendar",
    description: "Start scheduled runs from calendar events.",
    target: "Shared workspace calendar",
    targetLabel: "Calendar",
    status: "Needs setup",
    calls: "0",
    lastSync: "Not synced",
    uses: ["Workflow steps"],
    alert: true,
  },
];
export const integrationServices = [
  ["Slack", "Messaging", "Channel"],
  ["Microsoft Teams", "Messaging", "Team"],
  ["Gmail", "Email", "Inbox"],
  ["Google Calendar", "Calendar", "Calendar"],
  ["Google Drive", "Files", "Folder"],
  ["Notion", "Docs", "Workspace"],
  ["Linear", "Issues", "Team"],
  ["GitHub", "Code", "Repository"],
  ["Stripe", "Payments", "Account"],
  ["OpenAI", "AI model", "Project"],
  ["Claude", "AI model", "Workspace"],
  ["Gemini", "AI model", "Project"],
  ["n8n", "Automation", "Instance"],
] as const;
export const webhookEvents = [
  ["run.started", "A workflow run begins."],
  ["run.completed", "A run finishes every step."],
  ["run.failed", "A step fails after its retries."],
  ["agent.approval_requested", "An agent waits for a person."],
  ["workflow.published", "A new version goes live."],
] as const;
export type WebhookEvent = (typeof webhookEvents)[number][0];
export type FlowlyWebhook = {
  id: string;
  url: string;
  description: string;
  events: WebhookEvent[];
  status: "Delivering" | "Retrying" | "Paused";
  success: string;
  retry: "24 hours" | "72 hours" | "No retries";
  sign: boolean;
  tests?: number;
};
export const initialWebhooks: FlowlyWebhook[] = [
  {
    id: "runs",
    url: "https://api.brick.test/hooks/runs",
    description: "Run results for the ops dashboard.",
    events: ["run.started", "run.completed", "run.failed"],
    status: "Delivering",
    success: "99.8%",
    retry: "24 hours",
    sign: true,
  },
  {
    id: "approvals",
    url: "https://hooks.acme.test/brick/approvals",
    description: "Approval requests into the support desk.",
    events: ["agent.approval_requested"],
    status: "Retrying",
    success: "92.4%",
    retry: "24 hours",
    sign: true,
  },
  {
    id: "publish",
    url: "https://releases.brick.test/webhooks/publish",
    description: "Posts release notes when a workflow ships.",
    events: ["workflow.published"],
    status: "Paused",
    success: "100%",
    retry: "24 hours",
    sign: true,
  },
];
