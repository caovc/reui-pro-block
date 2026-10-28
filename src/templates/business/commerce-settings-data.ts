export type CommerceSettingsSection =
  | "team"
  | "payments"
  | "notifications"
  | "billing"
  | "locations"
  | "suppliers";
export type CommerceLocation = {
  id: number;
  name: string;
  type: string;
  address: string;
  active: boolean;
};
export type CommerceSupplier = {
  id: number;
  name: string;
  email: string;
  active: boolean;
};
export type CommerceStockRecord = {
  id: number;
  sku: string;
  locationId: number | null;
  supplierId: number | null;
};
export type CommerceMember = {
  id: number;
  name: string;
  email: string;
  role: string;
  teams: string[];
  status: "Active" | "Invited" | "Suspended" | "Deactivated";
  auth: string;
  secondFactor: string;
  lastActive: string;
};
export type CommerceInvite = { email: string; role: string };
export type CommerceProvider = {
  id: string;
  name: string;
  description: string;
  connected: boolean;
};
export type CommerceNotificationTab = "orders" | "inventory" | "customers" | "system";
export type CommerceNotificationChannel = "email" | "sms" | "inApp";
export type CommerceNotification = {
  id: string;
  title: string;
  group: string;
  tab: CommerceNotificationTab;
  channels: Record<CommerceNotificationChannel, boolean>;
};
export type CommerceInvoice = { id: string; date: string; amount: number; status: "Paid" };

export const commerceLocationTypes = ["Warehouse", "Retail store", "Fulfillment center"];
export const commerceMemberRoles = [
  "Owner",
  "Admin",
  "Member",
  "Contributor",
  "Reviewer",
  "Guest",
  "Billing",
];
export const commerceNotificationTabs: { id: CommerceNotificationTab; label: string }[] = [
  { id: "orders", label: "Orders" },
  { id: "inventory", label: "Inventory" },
  { id: "customers", label: "Customers" },
  { id: "system", label: "System" },
];
export const commerceNotificationChannels: { id: CommerceNotificationChannel; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "inApp", label: "In-app" },
];

export function createCommerceLocations(): CommerceLocation[] {
  return [
    {
      id: 101,
      name: "Canal Street Shop",
      type: "Retail store",
      address: "18 Canal Street, Portland, ME",
      active: true,
    },
    {
      id: 102,
      name: "Meadow Dispatch",
      type: "Fulfillment center",
      address: "42 Meadow Road, Richmond, VA",
      active: true,
    },
    {
      id: 103,
      name: "North Workshop",
      type: "Warehouse",
      address: "7 Foundry Lane, Madison, WI",
      active: true,
    },
  ];
}
export function createCommerceSuppliers(): CommerceSupplier[] {
  return [
    { id: 201, name: "Birch Workshop", email: "orders@birch.example", active: true },
    { id: 202, name: "Clayline Goods", email: "stock@clayline.example", active: true },
    { id: 203, name: "Fieldnote Supply", email: "hello@fieldnote.example", active: true },
    { id: 204, name: "Oakbound Trading", email: "supply@oakbound.example", active: true },
  ];
}
/** Original settings-local sample relationships; not the merchant product/inventory model. */
export function createCommerceStockRecords(): CommerceStockRecord[] {
  return Array.from({ length: 24 }, (_, index) => ({
    id: index + 1,
    sku: `BL-STOCK-${String(index + 1).padStart(3, "0")}`,
    locationId: 101 + (index % 3),
    supplierId: 201 + (index % 4),
  }));
}
export function createCommerceMembers(): CommerceMember[] {
  const people = [
    ["Ada Reeves", "Member", "Engineering", "Deactivated", "Password", "No 2FA", "82 days ago"],
    [
      "Ben Ortiz",
      "Member",
      "Engineering,IT/Security",
      "Active",
      "Microsoft Entra ID",
      "Security key",
      "Yesterday",
    ],
    ["Clara Finch", "Member", "Marketing", "Invited", "Password", "No 2FA", "Invite sent"],
    ["Devon Lake", "Guest", "Design", "Suspended", "Google Workspace", "SMS", "12 days ago"],
    [
      "Eli Mercer",
      "Admin",
      "Engineering,IT/Security",
      "Active",
      "Microsoft Entra ID",
      "Authenticator",
      "21 min ago",
    ],
    ["Farah Quinn", "Member", "Sales", "Active", "Password", "SMS", "Yesterday"],
    ["Grace Rowan", "Owner", "Product,IT/Security", "Active", "Okta", "Passkey", "4 min ago"],
    [
      "Hugo Ames",
      "Member",
      "Design,Product",
      "Active",
      "Google Workspace",
      "Authenticator",
      "2 hours ago",
    ],
    ["Iris Bell", "Member", "Product", "Invited", "Password", "No 2FA", "Expires in 3 days"],
    [
      "Jules Hale",
      "Billing",
      "Finance",
      "Active",
      "Google Workspace",
      "Authenticator",
      "2 days ago",
    ],
    ["Keira Shaw", "Member", "Operations", "Active", "Password", "Authenticator", "Today"],
    ["Luca Reed", "Member", "Support", "Active", "Google Workspace", "Passkey", "Yesterday"],
  ];
  return people.map(([name, role, teams, status, auth, secondFactor, lastActive], index) => ({
    id: index + 1,
    name,
    email: `${name.toLowerCase().replaceAll(" ", ".")}@bricklane.example`,
    role,
    teams: teams.split(","),
    status: status as CommerceMember["status"],
    auth,
    secondFactor,
    lastActive,
  }));
}
export function createCommerceProviders(): CommerceProvider[] {
  return [
    {
      id: "apple",
      name: "Apple Pay",
      description: "One-tap wallet checkout for customers on Apple devices.",
      connected: false,
    },
    {
      id: "bank",
      name: "Bank transfer",
      description: "Accept manual bank transfers, reconciled on receipt.",
      connected: true,
    },
    {
      id: "cash",
      name: "Cash on delivery",
      description: "Collect payment in person when the order is delivered.",
      connected: false,
    },
    {
      id: "google",
      name: "Google Pay",
      description: "Fast wallet checkout across Android and Chrome.",
      connected: false,
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Let customers check out with a PayPal balance or linked cards.",
      connected: true,
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Accept cards, wallets, and local methods with unified payouts.",
      connected: true,
    },
  ];
}
export function createCommerceNotifications(): CommerceNotification[] {
  const orders: [string, string, string, boolean, boolean, boolean][] = [
    ["new-order", "New order placed", "Order lifecycle", true, true, true],
    ["payment", "Payment received", "Order lifecycle", true, false, true],
    ["fulfilled", "Order fulfilled or shipped", "Order lifecycle", true, true, false],
    ["cancelled", "Order cancelled", "Order lifecycle", true, false, true],
    ["refund", "Refund requested", "Payments & disputes", true, false, true],
    ["chargeback", "Chargeback received", "Payments & disputes", true, false, true],
  ];
  const original: [string, string, string, CommerceNotificationTab][] = [
    ["low-stock", "Stock falls below its reorder level", "Local inventory demo", "inventory"],
    ["stock-arrived", "Stock received at a location", "Local inventory demo", "inventory"],
    ["customer-created", "Customer profile created", "Local customer demo", "customers"],
    ["customer-request", "Customer privacy request", "Local customer demo", "customers"],
    ["member-joined", "Team member joins the store", "Local system demo", "system"],
    ["export-ready", "Data export is ready", "Local system demo", "system"],
  ];
  return [
    ...orders.map(([id, title, group, email, sms, inApp]) => ({
      id,
      title,
      group,
      tab: "orders" as const,
      channels: { email, sms, inApp },
    })),
    ...original.map(([id, title, group, tab]) => ({
      id,
      title,
      group,
      tab,
      channels: { email: true, sms: false, inApp: true },
    })),
  ];
}
export const commerceInvoices: CommerceInvoice[] = [
  { id: "BL-DEMO-2026-10", date: "Oct 1, 2026", amount: 59, status: "Paid" },
  { id: "BL-DEMO-2026-09", date: "Sep 1, 2026", amount: 59, status: "Paid" },
  { id: "BL-DEMO-2026-08", date: "Aug 1, 2026", amount: 59, status: "Paid" },
  { id: "BL-DEMO-2026-07", date: "Jul 1, 2026", amount: 39, status: "Paid" },
];

export const commerceSettingsLabels: Record<CommerceSettingsSection, string> = {
  team: "Team",
  payments: "Payments",
  notifications: "Notifications",
  billing: "Billing",
  locations: "Locations",
  suppliers: "Suppliers",
};
