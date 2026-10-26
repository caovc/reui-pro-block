/** Static preparation only: initial schema from the settled Drive reference audit.
 * No routing, saves, mutations, requests or UI is wired by this module.
 * Reference identity/media is replaced with Bricklane demo identity at integration.
 */
export const driveSettingsSections = ["profile", "workspace", "team", "billing"] as const;
export type DriveSettingsSection = (typeof driveSettingsSections)[number];
export const driveSettingsTitles: Record<DriveSettingsSection, string> = {
  profile: "Profile",
  workspace: "Workspace",
  team: "Team",
  billing: "Billing",
};
export const driveSettingsReferenceRoutes: Record<DriveSettingsSection, string> = {
  profile: "/settings",
  workspace: "/settings/workspace",
  team: "/settings/team",
  billing: "/settings/billing",
};
export type DriveProfileDetails = {
  fullName: string;
  email: string;
  phone: string;
  username: string;
  role: string;
  timezone: string;
  website: string;
  bio: string;
};
export type DriveProfilePreferences = {
  language: string;
  landingView: string;
  digest: string;
  dailyBriefing: boolean;
};
export type DriveWorkspaceDetails = {
  workspaceName: string;
  subdomain: string;
  supportEmail: string;
};
export type DriveWorkspacePreferences = {
  landingView: string;
  externalSharing: boolean;
  aiProjectRecaps: boolean;
};
export type DriveMemberAccess = "Member" | "Admin" | "Owner";
export type DriveMemberStatus = "Active" | "Invited" | "Limited" | "Suspended";
export type DriveSettingsMember = {
  id: string;
  name: string;
  email: string;
  access: DriveMemberAccess;
  role: string;
  department: string;
  status: DriveMemberStatus;
  note?: string;
};
export type DriveBillingSetup = {
  plan: string;
  billingOwner: string;
  approverIds: string[];
  invoiceEmail: string;
  costCenter: string;
  /** Checkbox-styled cards represent one exclusive seat choice; source initially checks none. */
  seatSelection: 16 | 24 | 40 | null;
};
export type DriveBillingControls = {
  autoAddSeats: boolean;
  purchaseOrderRequired: boolean;
  approvalThreshold: string;
  reminders: string;
};
export const driveProfileInitial: DriveProfileDetails = {
  fullName: "Alex Rivera",
  email: "alex.rivera@brick.test",
  phone: "+17185550188",
  username: "alexrivera",
  role: "Workspace Owner",
  timezone: "(GMT-5) New York",
  website: "brick.test",
  bio: "Runs the studio's shared drive: retention, sharing defaults, and who can reach what.",
};
export const driveProfilePreferencesInitial: DriveProfilePreferences = {
  language: "English (US)",
  landingView: "Favourites",
  digest: "Weekly summary",
  dailyBriefing: true,
};
export const driveWorkspaceInitial: DriveWorkspaceDetails = {
  workspaceName: "Bricklane",
  subdomain: "app",
  supportEmail: "support@brick.test",
};
export const driveWorkspacePreferencesInitial: DriveWorkspacePreferences = {
  landingView: "Recent",
  externalSharing: true,
  aiProjectRecaps: true,
};
export const driveMembersInitial: readonly DriveSettingsMember[] = [
  {
    id: "alex-rivera",
    name: "Alex Rivera",
    email: "alex.rivera@brick.test",
    access: "Owner",
    role: "Workspace Owner",
    department: "Studio Leadership",
    status: "Active",
  },
  {
    id: "elijah-morgan",
    name: "Elijah Morgan",
    email: "elijah.morgan@brick.test",
    access: "Member",
    role: "Client Partner",
    department: "Client Delivery",
    status: "Suspended",
  },
  {
    id: "kenji-tan",
    name: "Kenji Tan",
    email: "kenji.tan@brick.test",
    access: "Member",
    role: "Design Systems",
    department: "Platform Design",
    status: "Limited",
  },
  {
    id: "leo-grant",
    name: "Leo Grant",
    email: "leo.grant@brick.test",
    access: "Member",
    role: "Motion Lead",
    department: "Motion Design",
    status: "Active",
  },
  {
    id: "mira-stone",
    name: "Mira Stone",
    email: "mira.stone@brick.test",
    access: "Admin",
    role: "People Operations",
    department: "Studio Operations",
    status: "Active",
  },
  {
    id: "nora-vale",
    name: "Nora Vale",
    email: "nora.vale@brick.test",
    access: "Admin",
    role: "Creative Director",
    department: "Design Studio",
    status: "Active",
  },
  {
    id: "priya-patel",
    name: "Priya Patel",
    email: "priya.patel@brick.test",
    access: "Admin",
    role: "Studio Operations",
    department: "Finance Operations",
    status: "Invited",
  },
  {
    id: "sana-qureshi",
    name: "Sana Qureshi",
    email: "sana.qureshi@brick.test",
    access: "Member",
    role: "Producer",
    department: "Client Delivery",
    status: "Active",
  },
  {
    id: "theo-park",
    name: "Theo Park",
    email: "theo.park@brick.test",
    access: "Member",
    role: "Brand Designer",
    department: "Brand Design",
    status: "Active",
  },
];
export const driveMemberPageSizes = [5, 10, 25, 50, 100] as const;
export const driveBillingInitial: DriveBillingSetup = {
  plan: "Free",
  billingOwner: "finance@brick.test",
  approverIds: ["alex-rivera", "elijah-morgan", "kenji-tan"],
  invoiceEmail: "ap@brick.test",
  costCenter: "Studio Operations",
  seatSelection: null,
};
export const driveBillingControlsInitial: DriveBillingControls = {
  autoAddSeats: false,
  purchaseOrderRequired: true,
  approvalThreshold: "2500",
  reminders: "Weekly summary",
};
