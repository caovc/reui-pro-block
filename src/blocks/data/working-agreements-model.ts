export const agreementAreas = [
  { id: "review", label: "Code Review", color: "#237c73" },
  { id: "release", label: "Releases", color: "#2ba99e" },
  { id: "reliability", label: "Reliability", color: "#44cdbd" },
  { id: "knowledge", label: "Knowledge", color: "#79e5d8" },
] as const;

export type AgreementArea = (typeof agreementAreas)[number]["id"];
export type AgreementOutcome =
  | "missed"
  | "partly"
  | "kept"
  | "done"
  | "paused"
  | "unadopted"
  | "on-track"
  | "behind";

export const agreementOutcomes = {
  missed: { name: "Missed", detail: "Missed", fill: "bg-teal-100 dark:bg-teal-950" },
  partly: { name: "Partly", detail: "Partly Kept", fill: "bg-teal-300 dark:bg-teal-800" },
  kept: { name: "Kept", detail: "Kept", fill: "bg-teal-400 dark:bg-teal-600" },
  done: { name: "All Done", detail: "All Done", fill: "bg-teal-700 dark:bg-teal-400" },
  paused: {
    name: "Paused",
    detail: "Paused",
    fill: "bg-[repeating-linear-gradient(135deg,var(--color-border)_0_2px,transparent_2px_4px)]",
  },
  unadopted: { name: "Not Adopted", detail: "Not Adopted", fill: "bg-muted" },
  "on-track": {
    name: "On Track",
    detail: "On Track",
    fill: "border border-teal-700 bg-teal-400 dark:border-teal-300 dark:bg-teal-600",
  },
  behind: {
    name: "Behind",
    detail: "Behind",
    fill: "border border-dashed border-teal-700 bg-teal-200 dark:border-teal-300 dark:bg-teal-900",
  },
} satisfies Record<AgreementOutcome, { name: string; detail: string; fill: string }>;

export const agreementTeams = [
  { id: "payments", label: "Payments", initials: "PP", count: 14 },
  { id: "platform", label: "Platform", initials: "OH", count: 16 },
  { id: "data", label: "Data", initials: "SR", count: 15 },
  { id: "search", label: "Search", initials: "AJ", count: 0 },
] as const;

export type AgreementTeam = (typeof agreementTeams)[number]["id"];

type Agreement = {
  id: string;
  area: AgreementArea;
  name: string;
  target: number;
  unit: string;
  thisWeek: readonly [done: number, due: number];
  started?: number;
  frozen?: number;
};

const agreements: readonly Agreement[] = [
  {
    id: "review-day",
    area: "review",
    name: "Reviews within a day",
    target: 90,
    unit: "PRs",
    thisWeek: [7, 9],
  },
  {
    id: "small-prs",
    area: "review",
    name: "Small pull requests",
    target: 80,
    unit: "PRs",
    thisWeek: [7, 8],
  },
  {
    id: "test-fix",
    area: "review",
    name: "Tests with every fix",
    target: 90,
    unit: "fixes",
    thisWeek: [3, 3],
  },
  {
    id: "ledger",
    area: "review",
    name: "Two ledger approvals",
    target: 100,
    unit: "PRs",
    thisWeek: [2, 2],
  },
  {
    id: "stale-flags",
    area: "release",
    name: "Stale flags removed",
    target: 80,
    unit: "flags",
    thisWeek: [0, 1],
    started: 18,
  },
  {
    id: "green-main",
    area: "release",
    name: "Main stays green",
    target: 80,
    unit: "builds",
    thisWeek: [6, 6],
  },
  {
    id: "deploy-notes",
    area: "release",
    name: "Notes on each deploy",
    target: 100,
    unit: "deploys",
    thisWeek: [4, 4],
    frozen: 21,
  },
  {
    id: "rollback",
    area: "release",
    name: "Tested rollback step",
    target: 90,
    unit: "deploys",
    thisWeek: [3, 4],
    frozen: 21,
  },
  {
    id: "action-items",
    area: "reliability",
    name: "Action items on time",
    target: 80,
    unit: "actions",
    thisWeek: [5, 6],
  },
  {
    id: "pager",
    area: "reliability",
    name: "Pages answered fast",
    target: 95,
    unit: "pages",
    thisWeek: [4, 4],
  },
  {
    id: "handoff",
    area: "reliability",
    name: "On-call handoffs",
    target: 100,
    unit: "handoffs",
    thisWeek: [3, 3],
  },
  {
    id: "change-docs",
    area: "knowledge",
    name: "Docs with the change",
    target: 85,
    unit: "PRs",
    thisWeek: [2, 3],
  },
  {
    id: "decisions",
    area: "knowledge",
    name: "Decisions recorded",
    target: 100,
    unit: "changes",
    thisWeek: [0, 1],
    started: 20,
  },
  {
    id: "help-asks",
    area: "knowledge",
    name: "Help asks answered",
    target: 80,
    unit: "questions",
    thisWeek: [4, 5],
  },
  {
    id: "publish-slo",
    area: "reliability",
    name: "SLO notes published",
    target: 90,
    unit: "services",
    thisWeek: [2, 3],
  },
  {
    id: "owners",
    area: "knowledge",
    name: "Owners kept up to date",
    target: 90,
    unit: "services",
    thisWeek: [5, 5],
  },
];

const monthDay = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const monthName = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const dayOfMonth = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" });
export const agreementWeeks = Array.from({ length: 26 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 3, 6 + index * 7));
  const endDate = new Date(Date.UTC(2026, 3, 12 + index * 7));
  return {
    index,
    label: monthDay.format(date),
    endLabel: monthDay.format(endDate),
    month: monthName.format(date),
    day: dayOfMonth.format(date),
    current: index === 25,
  };
});

export type AgreementOverride = { target?: number; paused?: boolean };
export type AgreementOverrides = Record<string, AgreementOverride | undefined>;

export const agreementOverrideKey = (team: AgreementTeam, agreement: string) =>
  `${team}:${agreement}`;

function counted(outcome: AgreementOutcome) {
  return outcome !== "paused" && outcome !== "unadopted";
}

function kept(outcome: AgreementOutcome) {
  return outcome === "kept" || outcome === "done";
}

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function outcomeOf(
  due: number,
  done: number,
  target: number,
  paused: boolean,
  current: boolean,
): AgreementOutcome {
  if (paused) return "paused";
  if (!due) return "unadopted";
  const share = (100 * done) / due;
  if (current) return share >= target ? "on-track" : "behind";
  if (done === due) return "done";
  if (share >= target) return "kept";
  if (share >= target * 0.75) return "partly";
  return "missed";
}

function agreementFact(agreement: Agreement, index: number, teamIndex: number, weekIndex: number) {
  if (weekIndex < (agreement.started ?? 0)) return { done: 0, due: 0 };
  if (weekIndex === 25 && teamIndex === 0) {
    return { done: agreement.thisWeek[0], due: agreement.thisWeek[1] };
  }
  const wave = (index * 43 + weekIndex * 19 + weekIndex * weekIndex * 7 + teamIndex * 23) % 100;
  const due = 5 + ((index * 7 + weekIndex * 3 + teamIndex) % 10);
  const offset = wave < 16 ? -24 : wave < 38 ? -8 : wave < 80 ? 11 : 35;
  const done = Math.min(due, Math.max(0, Math.round((due * (agreement.target + offset)) / 100)));
  return { done, due };
}

export function agreementRows(
  team: AgreementTeam,
  overrides: AgreementOverrides,
  starter: boolean,
) {
  const teamIndex = agreementTeams.findIndex((entry) => entry.id === team);
  const available =
    team === "search"
      ? starter
        ? [agreements[0], agreements[6], agreements[10], agreements[11]]
        : []
      : agreements.slice(0, agreementTeams[teamIndex].count);
  return available.map((agreement) => {
    const index = agreements.indexOf(agreement);
    const override = overrides[agreementOverrideKey(team, agreement.id)];
    const target = override?.target ?? agreement.target;
    const weeks = agreementWeeks.map((week) => {
      const fact = agreementFact(agreement, index, teamIndex, week.index);
      const paused = week.index === agreement.frozen || (week.current && !!override?.paused);
      return {
        ...week,
        ...fact,
        outcome: outcomeOf(fact.due, fact.done, target, paused, week.current),
        share: percentage(fact.done, fact.due),
      };
    });
    const finished = weeks.filter((week) => !week.current && counted(week.outcome));
    const done = finished.filter((week) => kept(week.outcome)).length;
    const latest = finished.slice(-4);
    const preceding = finished.slice(-8, -4);
    const recentDone = latest.filter((week) => kept(week.outcome)).length;
    const priorDone = preceding.filter((week) => kept(week.outcome)).length;
    const streakStop = [...finished].reverse().findIndex((week) => !kept(week.outcome));
    const streak = streakStop === -1 ? finished.length : streakStop;
    const slipping =
      preceding.length > 0 && recentDone / latest.length < priorDone / preceding.length;
    return {
      ...agreement,
      target,
      weeks,
      done,
      finished: finished.length,
      percentage: percentage(done, finished.length),
      streak,
      recentDone,
      recentCount: latest.length,
      slipping,
    };
  });
}

export type AgreementRow = ReturnType<typeof agreementRows>[number];
export type AgreementWeek = AgreementRow["weeks"][number];

export function agreementScore(rows: readonly AgreementRow[]) {
  const areaScores = agreementAreas.map((area) => {
    const related = rows.filter((row) => row.area === area.id);
    const done = related.reduce((sum, row) => sum + row.done, 0);
    const finished = related.reduce((sum, row) => sum + row.finished, 0);
    return { ...area, done, finished, score: percentage(done, finished) };
  });
  const thisWeek = rows.map((row) => row.weeks[25]).filter((week) => counted(week.outcome));
  const onTrack = thisWeek.filter((week) => week.outcome === "on-track").length;
  const weeks = agreementWeeks
    .filter((week) => !week.current)
    .map((week) => {
      const outcomes = rows.map((row) => row.weeks[week.index].outcome).filter(counted);
      const done = outcomes.filter(kept).length;
      return {
        week: week.label,
        done,
        counted: outcomes.length,
        score: percentage(done, outcomes.length),
      };
    });
  function windowScore(history: typeof weeks) {
    return percentage(
      history.reduce((sum, week) => sum + week.done, 0),
      history.reduce((sum, week) => sum + week.counted, 0),
    );
  }
  return {
    areaScores,
    weeks,
    activeCount: thisWeek.length,
    onTrack,
    progress: percentage(onTrack, thisWeek.length),
    total: windowScore(weeks),
    recent: windowScore(weeks.slice(-4)),
    previous: windowScore(weeks.slice(-8, -4)),
  };
}
