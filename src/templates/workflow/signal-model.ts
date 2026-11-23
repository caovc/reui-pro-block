export const signalPages = [
  ["overview", "Overview"],
  ["funnels", "Funnels"],
  ["retention", "Retention"],
  ["metrics", "Metrics"],
  ["features", "Feature adoption"],
  ["sources", "Data sources"],
  ["goals", "Goals"],
  ["roadmap", "Roadmap"],
  ["accounts", "Accounts"],
  ["settings", "Settings"],
] as const;

export type SignalPage = (typeof signalPages)[number][0];

export const sourceFixtures = [
  { id: "web", name: "Web events", healthy: true, scope: "Product" },
  { id: "search", name: "Search ads", healthy: true, scope: "Acquisition" },
  { id: "social", name: "Social ads", healthy: false, scope: "Acquisition" },
];

const campaignFixtures = [
  { name: "Workspace discovery", source: "search", visits: 1552 },
  { name: "Autumn launch", source: "social", visits: 1141 },
  { name: "Team trials", source: "social", visits: 865 },
];

export function campaignStatus(sources: typeof sourceFixtures) {
  const health = new Map(sources.map((source) => [source.id, source.healthy]));
  return campaignFixtures.map((campaign) => ({
    ...campaign,
    syncing: health.get(campaign.source) === true,
  }));
}

export const initialFunnel = [
  { name: "Visited", value: 4810 },
  { name: "Created account", value: 1142 },
  { name: "Started a workspace", value: 645 },
  { name: "Invited a teammate", value: 289 },
];

export function validFunnel(values: number[]) {
  return values.every(
    (value, index) =>
      Number.isSafeInteger(value) && value >= 0 && (index === 0 || value <= values[index - 1]),
  );
}

export const retentionWeeks = [4, 8, 12, 16] as const;

export const retentionCohorts = [
  { name: "June", start: 312, loss: 29, note: "First workspace tours" },
  { name: "July", start: 408, loss: 24, note: "Introduced grouped invites" },
  { name: "August", start: 467, loss: 22, note: "Added starter projects" },
];

export function retentionSeries(cohort: (typeof retentionCohorts)[number], weeks: number) {
  return Array.from({ length: weeks }, (_, index) => ({
    name: `W${index + 1}`,
    value: Math.round(cohort.start * (1 - ((cohort.loss / 100) * Math.log2(index + 1)) / 4)),
  }));
}

export const featureSeries = [
  { name: "Projects", value: 412 },
  { name: "Mentions", value: 268 },
  { name: "Templates", value: 223 },
  { name: "Saved views", value: 161 },
];

export const metricSeries = [
  { name: "Apr", value: 428 },
  { name: "May", value: 501 },
  { name: "Jun", value: 493 },
  { name: "Jul", value: 598 },
  { name: "Aug", value: 676 },
  { name: "Sep", value: 721 },
];

export const memberSeries = [
  { name: "Apr", value: 885 },
  { name: "May", value: 984 },
  { name: "Jun", value: 1141 },
  { name: "Jul", value: 1196 },
  { name: "Aug", value: 1334 },
  { name: "Sep", value: 1413 },
];

export function signalCsv(series: { name: string; value: number }[], label: string) {
  const quote = (input: string) => `"${input.replaceAll('"', '""')}"`;
  return [
    `Period,${quote(label)}`,
    ...series.map(({ name, value }) => `${quote(name)},${value}`),
  ].join("\r\n");
}

const goalGroups = [
  {
    name: "Acquisition",
    objectives: ["Qualified traffic", "Lead conversion"],
    metrics: [
      "Site visits",
      "Trial starts",
      "Organic leads",
      "Partner leads",
      "Referral visits",
      "Qualified signups",
      "Campaign reach",
      "Email clicks",
      "Landing conversion",
      "Demo requests",
    ],
  },
  {
    name: "Activation",
    objectives: ["Successful setup", "Early discovery"],
    metrics: [
      "Completed profiles",
      "Workspaces created",
      "Invitations sent",
      "Invitations accepted",
      "First projects",
      "Published views",
      "Connected sources",
      "Dashboard exports",
      "Setup completion",
      "First-week activity",
    ],
  },
  {
    name: "Retention",
    objectives: ["Sustained use", "Returning teams"],
    metrics: [
      "Active accounts",
      "Renewals",
      "Returning teams",
      "Weekly sessions",
      "Monthly sessions",
      "Shared reports",
      "Saved dashboards",
      "Returning admins",
      "Reactivated teams",
      "Ongoing projects",
    ],
  },
];

export const initialGoals = goalGroups.map(({ name, metrics, objectives }, group) => ({
  name,
  objectives,
  metrics: metrics.map((metric, index) => ({
    name: metric,
    objective: objectives[index < 5 ? 0 : 1],
    owner: ["rina", "avi", "lea"][(group + index) % 3],
    change: ((index % 5) - 1) * 7 + group,
    weight: 10,
    actual: 135 + group * 83 + index * 19,
    target: 175 + group * 86 + index * 14,
  })),
}));

export function weightedProgress(
  metrics: Pick<(typeof initialGoals)[number]["metrics"][number], "weight" | "actual" | "target">[],
) {
  const weight = metrics.reduce((total, metric) => total + metric.weight, 0);
  const normalized = metrics.reduce(
    (total, metric) => total + (metric.actual / metric.target) * metric.weight,
    0,
  );
  return { weight, progress: weight ? Math.round((normalized / weight) * 100) : 0 };
}

export function canLinkSignal(
  edges: { source: string; target: string }[],
  from: string,
  to: string,
) {
  if (
    !from ||
    !to ||
    from === to ||
    edges.some((edge) => edge.source === from && edge.target === to)
  )
    return false;
  const pending = [to];
  const visited = new Set<string>();
  while (pending.length) {
    const point = pending.pop()!;
    if (point === from) return false;
    if (visited.has(point)) continue;
    visited.add(point);
    pending.push(...edges.filter(({ source }) => source === point).map(({ target }) => target));
  }
  return true;
}

export const initialTeam = [
  { id: "rina", name: "Rina Park", role: "Lead" },
  { id: "avi", name: "Avi Singh", role: "Analyst" },
  { id: "lea", name: "Lea Chen", role: "Analyst" },
];

export const initialAccounts = [
  { id: "north", name: "Northstar Goods", owner: "rina", open: 5 },
  { id: "harbor", name: "Harbor Studio", owner: "rina", open: 3 },
  { id: "path", name: "Pathline Labs", owner: "avi", open: 6 },
  { id: "birch", name: "Birch Research", owner: "lea", open: 1 },
];

export function accountHandover(
  accounts: typeof initialAccounts,
  team: typeof initialTeam,
  from: string,
) {
  const loads = new Map(team.map((member) => [member.id, 0]));
  for (const account of accounts)
    loads.set(account.owner, (loads.get(account.owner) ?? 0) + account.open);
  return team
    .filter((member) => member.id !== from)
    .toSorted((left, right) => loads.get(left.id)! - loads.get(right.id)!)[0];
}

export function overlapsSignalReview(start: Date, end: Date, review: { start: Date; end: Date }) {
  return start < review.end && end > review.start;
}

export const initialSignalEdges = [
  { id: "visits-setup", source: "visits", target: "setup" },
  { id: "setup-adoption", source: "setup", target: "adoption" },
];
