import type {
  SettingsFieldDefinition,
  SettingsValues,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import {
  initialSettings,
  settingsFields,
} from "@/blocks/application/dialog-variants/workspace/settings-data";
import { demoAvatar, integrationArtwork, svgImage } from "@/lib/demo-artwork";

export type WorkflowAccountKind = "tempo" | "mesh";
export type WorkflowAccountSection = "profile" | "workspace" | "team" | "billing" | "preferences";
export type WorkflowAccountSnapshot = {
  values: SettingsValues;
  avatar?: string;
  logo?: string;
};

export const workflowAccountDescriptions: Record<
  WorkflowAccountKind,
  Record<WorkflowAccountSection, string>
> = {
  tempo: {
    profile: "Manage your account identity.",
    workspace: "Update brand and sharing defaults.",
    team: "Set member access defaults.",
    billing: "Manage plan and invoice settings.",
    preferences: "Tune your workspace behavior.",
  },
  mesh: {
    profile: "How you appear to teammates.",
    workspace: "Brand, links, channel and sharing.",
    team: "Joining, invites and member roles.",
    billing: "Plan, invoices and AI credits.",
    preferences: "Display, boards, language and summary.",
  },
};

export function createWorkflowAccountSnapshot(kind: WorkflowAccountKind): WorkflowAccountSnapshot {
  if (kind === "tempo") {
    return {
      values: {
        ...initialSettings,
        fullName: "Nick Bold",
        email: "nick@bricklane.example",
        username: "nickbold",
        website: "nick.bricklane.example",
        workspaceName: "Bricklane Studio",
        workspaceURL: "studio",
        supportEmail: "support@bricklane.example",
        inviteDomain: "bricklane.example",
        billingEmail: "billing@bricklane.example",
        legalName: "Bricklane Studio Inc.",
        bio: "Leading launch systems, product operations, and internal tooling across the Bricklane workspace.",
      },
      avatar: demoAvatar("Nick Bold"),
      logo: svgImage(integrationArtwork("BL", "#6366f1")),
    };
  }
  return {
    values: {
      fullName: "Sienna Wells",
      email: "sienna@nimbusfleet.example",
      username: "sienna",
      role: "Head of product design",
      timezone: "UTC",
      website: "nimbusfleet.example/sienna",
      bio: "Leads design for the driver app, Route Planner included, and owns the Launch Map board. Find me in #product-launch.",
      workspaceName: "Nimbus Fleet",
      workspaceURL: "boards",
      chatChannel: "#product-launch",
      landingView: "Home",
      linkSharing: true,
      inviteDomain: "nimbusfleet.example",
      defaultRole: "Member",
      inviteApproval: true,
      memberInvites: true,
      defaultTeam: "Design",
      plan: "Business",
      billingEmail: "billing@nimbusfleet.example",
      legalName: "Nimbus Fleet Inc.",
      taxId: "47-3920518",
      purchaseOrder: "PO-2026-0901",
      aiCredits: "500 credits a month",
      invoiceCadence: "Annual",
      paymentApproval: true,
      theme: "System",
      templatePicker: true,
      language: "English (US)",
      preferencesTimezone: "UTC",
      boardBackground: "Line grid",
      digest: "Weekday mornings",
    },
    avatar: demoAvatar("Sienna Wells"),
    logo: svgImage(integrationArtwork("NF", "#0d9488")),
  };
}

const meshFields: Record<Exclude<WorkflowAccountSection, "profile">, SettingsFieldDefinition[]> = {
  workspace: [
    { id: "workspaceName", label: "Workspace Name" },
    {
      id: "workspaceURL",
      label: "Workspace URL",
      description: "Where shared boards open.",
      suffix: ".nimbusfleet.example",
    },
    { id: "chatChannel", label: "Chat Channel", description: "Where questions and updates post." },
    {
      id: "landingView",
      label: "Default Landing View",
      description: "Choose where teammates start.",
    },
    {
      id: "linkSharing",
      label: "Link Sharing",
      description: "Open to anyone at Nimbus Fleet.",
      type: "switch",
    },
  ],
  team: [
    {
      id: "inviteDomain",
      label: "Approved Domain",
      description: "People on it can ask to join.",
      prefix: "@",
    },
    {
      id: "defaultRole",
      label: "Default Role",
      description: "Applied to new invited members.",
    },
    {
      id: "inviteApproval",
      label: "Join Requests",
      description: "An admin approves who joins.",
      type: "switch",
    },
    {
      id: "memberInvites",
      label: "Member Invites",
      description: "Let members invite teammates.",
      type: "switch",
    },
    {
      id: "defaultTeam",
      label: "Default Team",
      description: "New members join this team.",
    },
  ],
  billing: [
    {
      id: "plan",
      label: "Plan",
      description: "Current billing package.",
    },
    {
      id: "billingEmail",
      label: "Billing Email",
      description: "Receives invoices and receipts.",
      type: "email",
    },
    { id: "legalName", label: "Legal Name", description: "Displayed on receipts." },
    { id: "taxId", label: "Tax ID", description: "Optional business tax reference." },
    { id: "purchaseOrder", label: "Purchase Order", description: "Attached to invoices." },
    {
      id: "aiCredits",
      label: "AI Credits",
      description: "For Ask AI and board AI actions.",
    },
    {
      id: "invoiceCadence",
      label: "Billing Cycle",
      description: "How often the plan is billed.",
    },
    {
      id: "paymentApproval",
      label: "Seat Approval",
      description: "An admin approves added seats.",
      type: "switch",
    },
  ],
  preferences: [
    {
      id: "theme",
      label: "Theme",
      description: "Boards and docs follow it.",
    },
    {
      id: "templatePicker",
      label: "Template Picker",
      description: "Shown on an empty board.",
      type: "switch",
    },
    {
      id: "language",
      label: "Language",
      description: "Sets language and date format.",
    },
    {
      id: "preferencesTimezone",
      label: "Time Zone",
    },
    {
      id: "boardBackground",
      label: "Board Background",
      description: "Shown behind items on Canvas.",
    },
    {
      id: "digest",
      label: "Activity Summary",
      description: "Changes on your boards, by email.",
    },
  ],
};

export function workflowAccountFields(
  kind: WorkflowAccountKind,
  section: Exclude<WorkflowAccountSection, "profile">,
): readonly SettingsFieldDefinition[] {
  const fields = kind === "mesh" ? meshFields[section] : settingsFields[section];
  return fields.map((field) => {
    const choices = workflowAccountOptions(kind, field.id);
    return {
      ...field,
      ...(kind === "tempo" && field.id === "workspaceURL" ? { suffix: ".bricklane.example" } : {}),
      ...(choices.length ? { options: choices.map((option) => option.label) } : {}),
    };
  });
}

export function workflowProfileFields(kind: WorkflowAccountKind) {
  const mesh = kind === "mesh";
  const identity: SettingsFieldDefinition[] = [
    {
      id: "fullName",
      label: "Full Name",
      description: mesh ? "What teammates see in @mentions." : "Used across Bricklane.",
      maxLength: 80,
    },
    {
      id: "email",
      label: "Email Address",
      description: mesh ? "Used for sign-in and your summary." : "Primary sign-in email.",
      type: "email",
    },
    {
      id: "username",
      label: "Username",
      description: mesh ? "Used in your email and links." : "Used in mentions and links.",
      prefix: "@",
      maxLength: 80,
    },
  ];
  const details: SettingsFieldDefinition[] = [
    { id: "role", label: "Role" },
    { id: "timezone", label: "Time zone" },
    { id: "website", label: "Website", prefix: "https://" },
  ];
  const bio: SettingsFieldDefinition = {
    id: "bio",
    label: "Bio",
    description: "Short profile summary.",
    type: "textarea",
    maxLength: 1200,
  };
  return {
    identity,
    details: details.map((field) => {
      const choices = workflowAccountOptions(kind, field.id);
      return choices.length ? { ...field, options: choices.map((option) => option.label) } : field;
    }),
    bio,
  };
}

export type WorkflowAccountOption = { label: string; description: string };
const options = (rows: readonly (readonly [string, string])[]): WorkflowAccountOption[] =>
  rows.map(([label, description]) => ({ label, description }));
const tempoTimezones = options([
  ["(GMT-5) New York", "Eastern team coverage"],
  ["(GMT-8) Los Angeles", "Pacific team coverage"],
  ["(GMT+0) London", "Europe team coverage"],
  ["(GMT+8) Singapore", "APAC team coverage"],
]);
const meshTimezones = options([
  ["UTC", "Matches board and task dates"],
  ["New York (UTC-4)", "US Eastern, daylight time"],
  ["London (UTC+1)", "UK, British Summer Time"],
]);
const sharedOptions = {
  theme: options([
    ["System", "Follow device setting"],
    ["Light", "Bright workspace tone"],
    ["Dark", "Low-light workspace tone"],
  ]),
};
const tempoOptions: Record<string, WorkflowAccountOption[]> = {
  role: options([
    ["Staff Product Lead", "Owns product operations"],
    ["Product Manager", "Drives roadmap execution"],
    ["Design Lead", "Owns system quality"],
  ]),
  timezone: tempoTimezones,
  landingView: options([
    ["Home overview", "Recent activity first"],
    ["Pipeline board", "Jump into execution"],
    ["Priority inbox", "Focus on approvals"],
  ]),
  defaultRole: options([
    ["Member", "Standard workspace access"],
    ["Admin", "Manage team settings"],
    ["Viewer", "Read-only workspace access"],
  ]),
  teamVisibility: options([
    ["Workspace visible", "All teammates can discover profiles"],
    ["Department only", "Limit discovery to groups"],
    ["Private", "Hide directory discovery"],
  ]),
  plan: options([
    ["Business", "Current workspace plan"],
    ["Scale", "Advanced governance"],
    ["Enterprise", "Custom controls"],
  ]),
  spendLimit: options([
    ["$250 monthly", "Alert before $250"],
    ["$500 monthly", "Alert before $500"],
    ["$1,000 monthly", "Alert before $1,000"],
  ]),
  invoiceCadence: options([
    ["Monthly", "Send every month"],
    ["Quarterly", "Bundle by quarter"],
    ["Annual", "One yearly statement"],
  ]),
  theme: sharedOptions.theme,
  language: options([
    ["English (US)", "Default product language"],
    ["English (UK)", "Regional spelling"],
    ["German", "Regional operations"],
  ]),
  preferencesTimezone: tempoTimezones,
  weekStart: options([
    ["Monday", "Operational week start"],
    ["Sunday", "Calendar week start"],
  ]),
  digest: options([
    ["Weekday mornings", "Sent before standup"],
    ["Daily evenings", "Wrap the workday"],
    ["Weekly summary", "Monday planning recap"],
  ]),
};
const meshOptions: Record<string, WorkflowAccountOption[]> = {
  role: options([
    ["Head of product design", "Leads design for Route Planner"],
    ["Product manager", "Owns the Route Planner brief"],
    ["Program manager", "Runs launch tasks and retros"],
  ]),
  timezone: meshTimezones,
  landingView: options([
    ["Home", "Where the workspace opens"],
    ["Templates", "9 boards and 5 docs to start from"],
    ["Canvas", "The Launch Map board"],
    ["Projects", "Q4 launch tasks by stage"],
    ["Documents", "Briefs, notes and plans"],
  ]),
  defaultRole: options([
    ["Member", "Edit boards, docs and tasks"],
    ["Admin", "Manage members and billing"],
    ["Viewer", "View boards and docs only"],
  ]),
  defaultTeam: options([
    ["Design", "Flows, screens and design crits"],
    ["Product", "Briefs, roadmaps and priorities"],
    ["Engineering", "Builds and ships the driver app"],
    ["Research", "Interviews and journey maps"],
    ["Marketing", "Launch plans and messaging"],
  ]),
  plan: options([
    ["Business", "10 seats across 5 teams"],
    ["Starter", "Unlimited boards, team templates"],
    ["Enterprise", "Data residency per region"],
  ]),
  aiCredits: options([
    ["250 credits a month", "Caps use at half the allowance"],
    ["500 credits a month", "50 per seat on Business"],
    ["700 credits a month", "Adds a 200 credit bundle"],
  ]),
  invoiceCadence: options([
    ["Annual", "Card, charged once a year"],
    ["Monthly", "Card, charged each month"],
    ["Annual invoice", "Invoiced yearly, with your PO"],
  ]),
  theme: [sharedOptions.theme[1], sharedOptions.theme[2], sharedOptions.theme[0]],
  language: options([
    ["English (US)", "Dates as Oct 15, 2026"],
    ["English (UK)", "Dates as 15 Oct 2026"],
    ["German", "Dates as 29.09.2026"],
  ]),
  preferencesTimezone: meshTimezones,
  boardBackground: options([
    ["Line grid", "Faint lines that pan and zoom"],
    ["Plain", "No lines behind your items"],
  ]),
  digest: options([
    ["Off", "No summary emails"],
    ["Weekly on Monday", "Mondays, 09:00 in your time zone"],
    ["Weekday mornings", "Weekdays, 09:00 in your time zone"],
  ]),
};
export function workflowAccountOptions(
  kind: WorkflowAccountKind,
  field: string,
): readonly WorkflowAccountOption[] {
  return (kind === "tempo" ? tempoOptions : meshOptions)[field] ?? [];
}
