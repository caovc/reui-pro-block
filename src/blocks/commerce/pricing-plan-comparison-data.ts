export const comparisonPlans = [
  { id: "free", name: "Free", price: 0, action: "Start Free" },
  { id: "pro", name: "Pro", price: 28, action: "Get Pro" },
  { id: "team", name: "Team", price: 40, action: "Get Team", from: true },
  { id: "unlimited", name: "Unlimited", price: 750, action: "Contact Us", from: true },
] as const;

export type ComparisonPlan = (typeof comparisonPlans)[number]["id"];
export type ComparisonValue = string | boolean | { allowance: string; rate: string };
type ComparisonRow = {
  label: string;
  hint?: string;
  values?: readonly [ComparisonValue, ComparisonValue, ComparisonValue, ComparisonValue];
  indent?: boolean;
  groupEnd?: boolean;
};

type ComparisonSection = {
  id: "collection" | "retention" | "reporting" | "access";
  title: string;
  description: string;
  rows: readonly ComparisonRow[];
};

// Publicly displayed plan facts. No billing-period state: the reference prices
// are monthly amounts billed yearly, with a two-seat starting price for Team.
export const comparisonSections: readonly ComparisonSection[] = [
  {
    id: "collection",
    title: "Collection",
    description: "Events in, from any source.",
    rows: [
      {
        label: "Monthly events",
        hint: "A tracked action counts once, however many properties it carries.",
        values: [
          "50,000",
          { allowance: "2 million", rate: "$0.30 per 10,000" },
          { allowance: "10 million", rate: "$0.22 per 10,000" },
          "Custom volume",
        ],
      },
      {
        label: "Past the allowance",
        hint: "Extra events are counted at the metered rate, billed next month.",
        values: ["Events pause", "Billed next month", "Billed next month", "Set by contract"],
      },
      {
        label: "Connected sources",
        hint: "A site, a mobile app and a server key each count as one source.",
        values: ["2", "10", "50", "Unlimited"],
      },
      {
        label: "Schema validation",
        hint: "Events that break a property type are quarantined, not thrown away.",
        values: ["Off", "Warn", "Warn or block", "Warn or block"],
      },
      { label: "Volume controls" },
      {
        label: "Per source caps",
        hint: "Cap one noisy source so it cannot spend the whole allowance.",
        values: [false, true, true, true],
        indent: true,
      },
      {
        label: "Sampling rules",
        hint: "Keep a fixed share of a high volume event and drop the rest.",
        values: [false, false, true, true],
        indent: true,
        groupEnd: true,
      },
      {
        label: "Historic backfill",
        hint: "Imported events keep their original timestamps, so old trends stay true.",
        values: ["None", "12 months", "36 months", "Full history"],
      },
      {
        label: "Data freshness",
        hint: "How long an event waits before a chart is allowed to count it.",
        values: ["1 hour", "5 minutes", "1 minute", "Live"],
      },
    ],
  },
  {
    id: "retention",
    title: "Retention",
    description: "How far back you can look.",
    rows: [
      {
        label: "Event retention",
        hint: "Past this window raw events leave the charts and move to archive.",
        values: ["30 days", "12 months", "36 months", "Unlimited"],
      },
      { label: "Retention by record" },
      {
        label: "Daily summaries",
        hint: "Rolled up counts outlive the raw events, so long trends survive.",
        values: ["90 days", "3 years", "7 years", "Unlimited"],
        indent: true,
      },
      {
        label: "User profiles",
        hint: "A profile is kept for this long after that person's last event.",
        values: ["60 days", "18 months", "5 years", "Unlimited"],
        indent: true,
      },
      {
        label: "Cold archive",
        hint: "Archived events stay readable, but a query on them takes minutes.",
        values: ["60 days", "24 months", "7 years", "Unlimited"],
        indent: true,
        groupEnd: true,
      },
      {
        label: "Archive restore",
        hint: "Restored events rejoin the live window for the rest of the month.",
        values: [
          "25,000",
          { allowance: "2 million", rate: "$5 per million" },
          { allowance: "20 million", rate: "$3 per million" },
          "Custom volume",
        ],
      },
      {
        label: "Retention holds",
        hint: "Freeze one segment past its window while an audit is open.",
        values: ["None", "1 hold", "25 holds", "Unlimited"],
      },
    ],
  },
  {
    id: "reporting",
    title: "Reporting",
    description: "Dashboards, alerts and answers.",
    rows: [
      {
        label: "Saved dashboards",
        hint: "One dashboard holds any number of charts on a single date range.",
        values: ["3", "50", "500", "Unlimited"],
      },
      {
        label: "Scheduled reports",
        hint: "A send counts once, however many addresses are on the list.",
        values: ["1 a week", "25 a week", "250 a week", "Unlimited"],
      },
      {
        label: "Funnel steps",
        hint: "The number of ordered steps a single funnel can compare at once.",
        values: ["3", "10", "25", "Unlimited"],
      },
      {
        label: "Alert checks",
        hint: "How often a saved metric is tested against its threshold.",
        values: ["Daily", "Hourly", "Every 15 minutes", "Every minute"],
      },
      {
        label: "Embedded charts",
        hint: "Serve a live chart inside your own app behind a signed link.",
        values: [false, false, true, true],
      },
    ],
  },
  {
    id: "access",
    title: "Team and Access",
    description: "Seats, access and billing.",
    rows: [
      {
        label: "Team seats",
        hint: "The starting price covers 2 seats; each seat after that bills at the same rate.",
        values: ["1", "1", { allowance: "2 to 20", rate: "$20 per seat" }, "Unlimited"],
      },
      {
        label: "Single sign-on",
        hint: "Seats are created the first time somebody signs in.",
        values: [false, false, true, true],
      },
      {
        label: "Data residency",
        hint: "Events are stored and queried only in the region you pick.",
        values: ["US", "US or EU", "US, EU or AU", "Your choice"],
      },
      {
        label: "Support reply time",
        hint: "Counted in business hours from your first message, not the last.",
        values: ["Community", "2 days", "1 day", "4 hours"],
      },
      {
        label: "Uptime target",
        hint: "Measured monthly; a miss earns credit on the next invoice.",
        values: [false, "99.5%", "99.9%", "99.99%"],
      },
      { label: "Billing" },
      {
        label: "Invoice billing",
        hint: "Pay yearly by invoice instead of card.",
        values: [false, false, true, true],
        indent: true,
      },
      {
        label: "Price lock",
        hint: "Your rate cannot change while the lock runs.",
        values: [false, "12 months", "24 months", "Contract term"],
        indent: true,
        groupEnd: true,
      },
    ],
  },
];
