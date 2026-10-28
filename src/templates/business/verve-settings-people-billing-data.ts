/** Original Bricklane CRM fixtures. No preview identities, invoice amounts or assets. */
export const verveMemberRoles = [
  "Admin",
  "Sales Manager",
  "Account Executive",
  "Sales Development",
  "RevOps",
  "Finance",
  "Support",
] as const;
export const verveMemberBilling = [
  "Active",
  "Pending invoice",
  "Manual review",
  "Past due",
] as const;
export const verveMemberAuthentication = ["SSO", "Two-factor", "Passwordless", "Password"] as const;
export type VerveMemberRole = (typeof verveMemberRoles)[number];
export type VerveMemberBilling = (typeof verveMemberBilling)[number];
export type VerveMemberAuthentication = (typeof verveMemberAuthentication)[number];
export interface VerveSettingsMember {
  id: string;
  name: string;
  username: string;
  email: string;
  role: VerveMemberRole;
  billing: VerveMemberBilling;
  authentication: VerveMemberAuthentication;
  joined: string;
}
export const verveSettingsMembers: readonly VerveSettingsMember[] = [
  {
    id: "crm-member-1",
    name: "Ava Mercer",
    username: "ava.mercer",
    email: "ava.mercer@crm.bricklane.example",
    role: "Admin",
    billing: "Active",
    authentication: "Two-factor",
    joined: "2025-02-12",
  },
  {
    id: "crm-member-2",
    name: "Emil Rao",
    username: "emil.rao",
    email: "emil.rao@crm.bricklane.example",
    role: "Support",
    billing: "Past due",
    authentication: "Password",
    joined: "2026-04-09",
  },
  {
    id: "crm-member-3",
    name: "Inez Wells",
    username: "inez.wells",
    email: "inez.wells@crm.bricklane.example",
    role: "Account Executive",
    billing: "Active",
    authentication: "SSO",
    joined: "2025-04-16",
  },
  {
    id: "crm-member-4",
    name: "Jonas Chen",
    username: "jonas.chen",
    email: "jonas.chen@crm.bricklane.example",
    role: "Sales Manager",
    billing: "Active",
    authentication: "SSO",
    joined: "2025-03-07",
  },
  {
    id: "crm-member-5",
    name: "Leila Santos",
    username: "leila.santos",
    email: "leila.santos@crm.bricklane.example",
    role: "Account Executive",
    billing: "Active",
    authentication: "Two-factor",
    joined: "2025-05-21",
  },
  {
    id: "crm-member-6",
    name: "Malik Hughes",
    username: "malik.hughes",
    email: "malik.hughes@crm.bricklane.example",
    role: "Finance",
    billing: "Active",
    authentication: "SSO",
    joined: "2025-07-04",
  },
  {
    id: "crm-member-7",
    name: "Nora Bennett",
    username: "nora.bennett",
    email: "nora.bennett@crm.bricklane.example",
    role: "Sales Development",
    billing: "Pending invoice",
    authentication: "Password",
    joined: "2026-08-18",
  },
  {
    id: "crm-member-8",
    name: "Omar Lind",
    username: "omar.lind",
    email: "omar.lind@crm.bricklane.example",
    role: "Account Executive",
    billing: "Active",
    authentication: "Two-factor",
    joined: "2025-10-14",
  },
  {
    id: "crm-member-9",
    name: "Thea Sato",
    username: "thea.sato",
    email: "thea.sato@crm.bricklane.example",
    role: "Support",
    billing: "Manual review",
    authentication: "SSO",
    joined: "2026-01-23",
  },
];
export const verveBillingRegions = [
  "London, United Kingdom",
  "Dublin, Ireland",
  "Toronto, Canada",
  "Austin, United States",
] as const;
export interface VerveBillingDetails {
  contact: string;
  legalEntity: string;
  region: string;
}
export const verveBillingInitial: VerveBillingDetails = {
  contact: "billing@crm.bricklane.example",
  legalEntity: "Bricklane Studio Ltd",
  region: "London, United Kingdom",
};
export const verveBillingPlan = {
  name: "Verve Growth",
  unitPrice: 39,
  seats: 14,
  renewal: "2026-10-30",
  owner: "Ava Mercer",
  contacts: 146820,
  credits: 1630,
} as const;
export interface VerveBillingInvoice {
  id: string;
  period: string;
  issued: string;
  amount: number;
  status: "Paid" | "Credited";
}
export const verveBillingInvoices: readonly VerveBillingInvoice[] = [
  { id: "BL-CRM-202609", period: "Sep 2026", issued: "2026-09-04", amount: 0, status: "Credited" },
  { id: "BL-CRM-202608", period: "Aug 2026", issued: "2026-08-04", amount: 351, status: "Paid" },
  { id: "BL-CRM-202607", period: "Jul 2026", issued: "2026-07-04", amount: 273, status: "Paid" },
  { id: "BL-CRM-202606", period: "Jun 2026", issued: "2026-06-04", amount: 273, status: "Paid" },
  { id: "BL-CRM-202605", period: "May 2026", issued: "2026-05-04", amount: 273, status: "Paid" },
  { id: "BL-CRM-202604", period: "Apr 2026", issued: "2026-04-04", amount: 195, status: "Paid" },
];
export const verveSettingsDate = "2026-10-22";
export const verveMemberDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
export const verveMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

export const verveInvoiceDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
