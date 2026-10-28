import { demoAvatar } from "@/lib/demo-artwork";
import bricklaneLogo from "@/templates/collaboration/drive-settings-free/bricklane-logo.svg";
import type { DriveChoiceOption } from "@/templates/collaboration/drive-settings-options";

export type VerveAccountSection = "profile" | "preferences" | "notifications";
export type VerveNotificationCategory = "deals" | "mentions" | "reports" | "system";
export type VerveNotificationChannel = "email" | "slack" | "inApp";
export interface VerveProfile {
  fullName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  username: string;
  role: string;
  timezone: string;
  website: string;
  bio: string;
  avatar: string | null;
}
export interface VerveProfilePreferences {
  language: string;
  landingView: string;
  digest: string;
  dailyBriefing: boolean;
}
export interface VerveAccountPreferences {
  workspaceSearch: boolean;
  readReceipts: boolean;
  activityStatus: boolean;
  publicProfile: boolean;
  usageAnalytics: boolean;
}
export interface VerveWorkspace {
  workspaceName: string;
  subdomain: string;
  supportEmail: string;
  accent: string;
  logo: string | null;
}
export interface VerveWorkspacePreferences {
  landingView: string;
  externalSharing: boolean;
  aiDealRecaps: boolean;
}
export interface VerveNotificationRow {
  id: string;
  title: string;
  group: string;
  channels: Record<VerveNotificationChannel, boolean>;
}
export const verveAccountSections = [
  { id: "profile", label: "Profile" },
  { id: "preferences", label: "Preferences" },
  { id: "notifications", label: "Notifications" },
] as const;
export const verveNotificationCategories = [
  { id: "deals", label: "Deals", observed: true },
  { id: "mentions", label: "Mentions", observed: false },
  { id: "reports", label: "Reports", observed: false },
  { id: "system", label: "System", observed: false },
] as const;
export const verveChannels = [
  { id: "email", label: "Email" },
  { id: "slack", label: "Slack" },
  { id: "inApp", label: "In-app" },
] as const;
// Only the selected values were observed publicly. Additional choices below
// are original Bricklane demo data, not claims about the vendor option lists.
export const verveRoleOptions = ["Sales Lead", "Revenue Operations", "Account Manager"] as const;
export const verveLanguageOptions: readonly DriveChoiceOption[] = [
  ["English (US)", "Default workspace language"],
  ["English (UK)", "Bricklane demo alternative"],
  ["Spanish", "Bricklane demo alternative"],
];
export const verveLandingOptions: readonly DriveChoiceOption[] = [
  ["Approvals queue", "Items awaiting a decision"],
  ["Deal board", "Open opportunities by stage"],
  ["Activity feed", "Recent team updates"],
];
export const verveDigestOptions: readonly DriveChoiceOption[] = [
  ["Weekly summary", "A weekly planning recap"],
  ["Daily summary", "A recap at the end of each day"],
  ["No digest", "Read updates in the workspace"],
];
// Named hues were observed; these standard local hex values were not measured
// on the source page and must not be represented as exact vendor colors.
export const verveAccentOptions = [
  { label: "Graphite", value: "#475569" },
  { label: "Cobalt", value: "#3b82f6" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Mint", value: "#10b981" },
  { label: "Orange", value: "#f97316" },
  { label: "Rose", value: "#f43f5e" },
] as const;

export function createVerveProfile(): VerveProfile {
  return {
    fullName: "Ewan Cole",
    email: "ewan@bricklane.test",
    emailVerified: true,
    phone: "+14155550143",
    username: "ewancole",
    role: "Sales Lead",
    timezone: "(GMT-5) New York",
    website: "ewan.bricklane.test",
    bio: "Coordinates customer relationships, pipeline reviews, and revenue operations for the Bricklane team.",
    avatar: demoAvatar("Ewan Cole"),
  };
}
export function createVerveProfilePreferences(): VerveProfilePreferences {
  return {
    language: "English (US)",
    landingView: "Approvals queue",
    digest: "Weekly summary",
    dailyBriefing: true,
  };
}
export function createVerveAccountPreferences(): VerveAccountPreferences {
  return {
    workspaceSearch: false,
    readReceipts: false,
    activityStatus: true,
    publicProfile: true,
    usageAnalytics: false,
  };
}
export function createVerveWorkspace(): VerveWorkspace {
  return {
    workspaceName: "Bricklane Studio",
    subdomain: "studio",
    supportEmail: "support@bricklane.test",
    accent: "Teal",
    logo: bricklaneLogo,
  };
}
export function createVerveWorkspacePreferences(): VerveWorkspacePreferences {
  return { landingView: "Deal board", externalSharing: true, aiDealRecaps: true };
}
function notification(
  id: string,
  title: string,
  group: string,
  email: boolean,
  slack: boolean,
  inApp: boolean,
): VerveNotificationRow {
  return { id, title, group, channels: { email, slack, inApp } };
}
export function createVerveNotifications(): Record<
  VerveNotificationCategory,
  VerveNotificationRow[]
> {
  return {
    deals: [
      notification("assigned", "Deal assigned to you", "Deal activity", true, false, true),
      notification("close-date", "Close date approaching", "Deal activity", true, false, false),
      notification("stage", "Stage changed", "Deal activity", false, false, true),
      notification("mention", "Mentioned on a deal", "Deal activity", true, true, true),
      notification("document", "Document attached", "Deal activity", false, false, false),
      notification("won", "Deal marked won", "Pipeline updates", true, false, true),
      notification("quote", "Quote accepted", "Pipeline updates", true, false, false),
      notification("reassigned", "Deal reassigned to you", "Pipeline updates", false, false, true),
      notification("lost", "Deal marked lost", "Pipeline updates", true, false, false),
    ],
    // Unobserved categories: explicitly labelled original demo schemas in UI.
    mentions: [
      notification("direct", "Direct mention", "Bricklane mention preferences", true, false, true),
      notification(
        "thread",
        "Reply in a followed conversation",
        "Bricklane mention preferences",
        false,
        false,
        true,
      ),
    ],
    reports: [
      notification(
        "ready",
        "Scheduled report ready",
        "Bricklane report preferences",
        true,
        false,
        true,
      ),
      notification(
        "shared",
        "Report shared with you",
        "Bricklane report preferences",
        false,
        false,
        true,
      ),
    ],
    system: [
      notification(
        "workspace",
        "Workspace configuration changed",
        "Bricklane system preferences",
        true,
        false,
        true,
      ),
      notification(
        "maintenance",
        "Planned maintenance notice",
        "Bricklane system preferences",
        true,
        false,
        false,
      ),
    ],
  };
}
