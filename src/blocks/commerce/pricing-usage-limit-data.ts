export type UsagePeriod = "monthly" | "yearly";
export type UsagePlanId = "basic" | "team" | "enterprise";
export type UsageFeature =
  | "bookings"
  | "seats"
  | "calendars"
  | "pages"
  | "email"
  | "buffers"
  | "texts"
  | "routing"
  | "payments"
  | "saml"
  | "audit"
  | "support";

export const usageFeatureGroups: readonly {
  name: string;
  rows: readonly { key: UsageFeature; label: string }[];
}[] = [
  {
    name: "Limits",
    rows: [
      { key: "bookings", label: "Bookings per month" },
      { key: "seats", label: "Member seats" },
      { key: "calendars", label: "Connected calendars" },
      { key: "pages", label: "Booking pages" },
    ],
  },
  {
    name: "Scheduling",
    rows: [
      { key: "email", label: "Email reminders" },
      { key: "buffers", label: "Buffers between meetings" },
      { key: "texts", label: "Text message reminders" },
      { key: "routing", label: "Round robin routing" },
      { key: "payments", label: "Payments at booking" },
    ],
  },
  {
    name: "Security and Support",
    rows: [
      { key: "saml", label: "SAML single sign-on" },
      { key: "audit", label: "Audit log export" },
      { key: "support", label: "Support" },
    ],
  },
];

export type UsagePlan = {
  id: UsagePlanId;
  name: string;
  description: string;
  yearlyRate: number;
  monthlyRate: number;
  action: string;
  includes: string;
  highlights: readonly UsageFeature[];
  features: Record<UsageFeature, string | boolean>;
};

// Cards, selected-column table, radio prices and footer all read this model.
// Values are public preview facts; there is no billing or inventory backend.
export const usagePlans: readonly UsagePlan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "For individuals",
    yearlyRate: 10,
    monthlyRate: 12,
    action: "Start Trial",
    includes: "Includes",
    highlights: ["bookings", "seats", "calendars", "pages", "email"],
    features: {
      bookings: "500",
      seats: "1",
      calendars: "3",
      pages: "5",
      email: true,
      buffers: true,
      texts: false,
      routing: false,
      payments: false,
      saml: false,
      audit: false,
      support: "Email",
    },
  },
  {
    id: "team",
    name: "Team",
    description: "For growing teams",
    yearlyRate: 30,
    monthlyRate: 36,
    action: "Start Trial",
    includes: "Everything in Basic, plus",
    highlights: ["bookings", "seats", "calendars", "routing", "texts"],
    features: {
      bookings: "2,500",
      seats: "10",
      calendars: "30",
      pages: "Unlimited",
      email: true,
      buffers: true,
      texts: true,
      routing: true,
      payments: true,
      saml: false,
      audit: false,
      support: "Priority chat",
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For companies",
    yearlyRate: 80,
    monthlyRate: 96,
    action: "Contact Sales",
    includes: "Everything in Team, plus",
    highlights: ["bookings", "seats", "saml", "audit", "support"],
    features: {
      bookings: "Unlimited",
      seats: "50",
      calendars: "Unlimited",
      pages: "Unlimited",
      email: true,
      buffers: true,
      texts: true,
      routing: true,
      payments: true,
      saml: true,
      audit: true,
      support: "Named success manager",
    },
  },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function usageRate(plan: UsagePlan, period: UsagePeriod) {
  return period === "yearly" ? plan.yearlyRate : plan.monthlyRate;
}

export function usageMoney(value: number) {
  return currency.format(value);
}

export function usageInvoice(plan: UsagePlan, period: UsagePeriod) {
  const total = usageRate(plan, period) * (period === "yearly" ? 12 : 1);
  return `${usageMoney(total)} billed ${period}`;
}

export function usageHighlight(plan: UsagePlan, key: UsageFeature) {
  const value = plan.features[key];
  if (key === "bookings") return `${value} bookings per month`;
  if (key === "seats") return `${value} member ${value === "1" ? "seat" : "seats"}`;
  if (key === "calendars") return `${value} connected calendars`;
  if (key === "pages") return `${value} booking pages`;
  if (key === "support") return String(value);
  return usageFeatureGroups.flatMap((group) => group.rows).find((row) => row.key === key)!.label;
}
