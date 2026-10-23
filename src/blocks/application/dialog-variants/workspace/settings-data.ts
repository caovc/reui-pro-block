import { Building2, CreditCard, SlidersHorizontal, UserRound, Users } from "lucide-react";

export type SettingDefinition = {
  id: string;
  label: string;
  description?: string;
  initial: string | boolean;
  type?: "text" | "email" | "switch";
  prefix?: string;
  suffix?: string;
  options?: string[];
};
export const settingsSections = [
  {
    id: "profile",
    title: "Profile",
    description: "Manage your account identity.",
    icon: UserRound,
  },
  {
    id: "workspace",
    title: "Workspace",
    description: "Update brand and sharing defaults.",
    icon: Building2,
  },
  { id: "team", title: "Team", description: "Set member access defaults.", icon: Users },
  {
    id: "billing",
    title: "Billing",
    description: "Manage plan and invoice settings.",
    icon: CreditCard,
  },
  {
    id: "preferences",
    title: "Preferences",
    description: "Tune your workspace behavior.",
    icon: SlidersHorizontal,
  },
] as const;
export type SettingsSection = (typeof settingsSections)[number]["id"];
export const timezones = [
  "(GMT-5) New York",
  "(GMT-8) Los Angeles",
  "(GMT+0) London",
  "(GMT+8) Singapore",
];
export const settingsFields: Record<Exclude<SettingsSection, "profile">, SettingDefinition[]> = {
  workspace: [
    { id: "workspaceName", label: "Workspace Name", initial: "Atlas" },
    {
      id: "workspaceURL",
      label: "Workspace URL",
      description: "Link for teammates and clients.",
      initial: "hq",
      suffix: ".atlashq.app",
    },
    {
      id: "supportEmail",
      label: "Support Email",
      description: "Shown on help surfaces.",
      initial: "support@example.com",
      type: "email",
    },
    {
      id: "landingView",
      label: "Default Landing View",
      description: "Choose where teammates start.",
      initial: "Pipeline board",
      options: ["Home overview", "Pipeline board", "Priority inbox"],
    },
    {
      id: "externalSharing",
      label: "External Sharing",
      description: "Create client-safe links.",
      initial: true,
      type: "switch",
    },
  ],
  team: [
    {
      id: "inviteDomain",
      label: "Invite Domain",
      description: "Approved email domain.",
      initial: "atlashq.app",
      prefix: "@",
    },
    {
      id: "defaultRole",
      label: "Default Role",
      description: "Applied to new invited members.",
      initial: "Member",
      options: ["Member", "Contributor", "Reviewer", "Admin"],
    },
    {
      id: "inviteApproval",
      label: "Invite Approvals",
      description: "Require owner review.",
      initial: true,
      type: "switch",
    },
    {
      id: "memberInvites",
      label: "Member Invites",
      description: "Let members invite teammates.",
      initial: false,
      type: "switch",
    },
    {
      id: "teamVisibility",
      label: "Team Visibility",
      description: "Control profile discovery.",
      initial: "Workspace visible",
      options: ["Workspace visible", "Department only", "Private"],
    },
  ],
  billing: [
    {
      id: "plan",
      label: "Plan",
      description: "Current billing package.",
      initial: "Business",
      options: ["Business", "Scale", "Enterprise"],
    },
    {
      id: "billingEmail",
      label: "Billing Email",
      description: "Receives invoices.",
      initial: "billing@example.com",
      type: "email",
    },
    {
      id: "legalName",
      label: "Legal Name",
      description: "Displayed on receipts.",
      initial: "Atlas HQ Inc.",
    },
    {
      id: "taxId",
      label: "Tax ID",
      description: "Optional business tax reference.",
      initial: "US-DEMO-1847291",
    },
    {
      id: "purchaseOrder",
      label: "Purchase Order",
      description: "Attached to invoices.",
      initial: "PO-2026-0412",
    },
    {
      id: "spendLimit",
      label: "Spend Limit",
      description: "Alert before the threshold.",
      initial: "$500 monthly",
      options: ["$250 monthly", "$500 monthly", "$1,000 monthly"],
    },
    {
      id: "invoiceCadence",
      label: "Invoice Cadence",
      description: "Choose statement timing.",
      initial: "Monthly",
      options: ["Monthly", "Quarterly", "Annual"],
    },
    {
      id: "paymentApproval",
      label: "Payment Approval",
      description: "Review plan changes.",
      initial: true,
      type: "switch",
    },
  ],
  preferences: [
    {
      id: "theme",
      label: "Theme",
      description: "Choose the interface tone.",
      initial: "System",
      options: ["System", "Light", "Dark"],
    },
    {
      id: "smoothCursor",
      label: "Smooth Cursor",
      description: "Softer pointer motion.",
      initial: true,
      type: "switch",
    },
    {
      id: "language",
      label: "Language",
      description: "Set product language.",
      initial: "English (US)",
      options: ["English (US)", "English (UK)", "German"],
    },
    {
      id: "preferencesTimezone",
      label: "Time Zone",
      initial: "(GMT-5) New York",
      options: timezones,
    },
    {
      id: "weekStart",
      label: "First Day Of Week",
      description: "Controls calendar layout.",
      initial: "Monday",
      options: ["Monday", "Sunday"],
    },
    {
      id: "digest",
      label: "Digest Cadence",
      description: "Pick summary timing.",
      initial: "Weekly summary",
      options: ["Weekday mornings", "Daily evenings", "Weekly summary"],
    },
  ],
};
export const profileInitial = {
  fullName: "Ava Chen",
  email: "ava@atlashq.app",
  username: "avachen",
  role: "Staff Product Lead",
  timezone: "(GMT-5) New York",
  website: "ava.atlashq.app",
  bio: "Leading launch systems, product operations, and internal tooling across the Atlas workspace.",
};
export const initialSettings: Record<string, string | boolean> = {
  ...profileInitial,
  ...Object.fromEntries(
    Object.values(settingsFields)
      .flat()
      .map((field) => [field.id, field.initial]),
  ),
};
