import type { FilterNode, FilterQuery } from "@/components/reui/filters/filters-types";

export const queues = ["Billing", "Technical", "Accounts", "Orders"] as const;
export const shifts = ["Early", "Day", "Late"] as const;
export const channels = ["Email", "Chat", "Phone"] as const;
export const rubric = [
  { name: "Resolution", weight: 40 },
  { name: "Tone", weight: 25 },
  { name: "Process", weight: 20 },
  { name: "Communication", weight: 15 },
] as const;

type Focus = (typeof rubric)[number]["name"];
type Channel = (typeof channels)[number];

export interface Review {
  id: string;
  channel: Channel;
  week: number;
  scores: [number, number, number, number];
  critical: boolean;
}

export interface CoachingNote {
  id: string;
  focus: Focus;
  text: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  queue: (typeof queues)[number];
  shift: (typeof shifts)[number];
  started: string;
  goal: number;
  solved: number;
  reopened: number;
  escalated: number;
  replyMinutes: number;
  resolutionMinutes: number;
  slaMet: number;
  surveys: number;
  positive: number;
  reviews: Review[];
  coaching: { focus: Focus; followUp: string } | null;
  notes: CoachingNote[];
}

const agents = [
  "Adrian Serrano",
  "Alina Novak",
  "Brenna Walsh",
  "Caleb Mensah",
  "Daria Ito",
  "Elias Moreno",
  "Farah Larsen",
  "Greta Fischer",
  "Hugo Legrand",
  "Iris Duarte",
  "Jasper Cho",
  "Keira Nwosu",
  "Lena Singh",
  "Milo Foster",
  "Nadine Kim",
  "Omar Bennett",
  "Pia Edwards",
  "Ravi Almeida",
  "Sabrina Lewis",
  "Tariq Haddad",
  "Uma Eriksen",
  "Vera Tan",
  "Zane Brooks",
];

export function reviewScore(review: Review) {
  return Math.round(
    review.scores.reduce((sum, score, index) => sum + score * rubric[index].weight, 0) / 100,
  );
}

function average(values: readonly number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function percent(part: number, whole: number) {
  return whole ? Math.round((100 * part) / whole) : null;
}

export function makeAgents(): Agent[] {
  const baselines = [
    95, 74, 86, 58, 91, 73, 83, 90, 89, 92, 85, 94, 71, 88, 87, 96, 82, 68, 84, 91, 81, 92, 78,
  ];
  return agents.map((name, index) => {
    const solved = 132 + ((index * 31 + 121) % 147);
    const surveys = 32 + ((index * 13 + 21) % 31);
    const quality = baselines[index];
    const focusIndex = index % rubric.length;
    const reviews: Review[] = Array.from({ length: 12 + (index % 4) }, (_, review) => {
      const scores = rubric.map((_, category) =>
        Math.max(
          32,
          Math.min(
            100,
            quality + ((review * 7 + category * 3) % 9) - 3 - (category === focusIndex ? 6 : 0),
          ),
        ),
      ) as Review["scores"];
      return {
        id: `qa-${index + 1}-${review + 1}`,
        channel: channels[(review + index) % channels.length],
        week: review % 5,
        scores,
        critical: quality < 65 && review === 1,
      };
    });
    return {
      id: `agent-${index + 1}`,
      name,
      email: `${name.toLowerCase().replaceAll(" ", ".")}@support.example`,
      queue: queues[(index + 1) % queues.length],
      shift: shifts[index % shifts.length],
      started: index % 6 === 5 ? "2026-08-17" : "2025-11-03",
      goal: index % 6 === 5 ? 80 : 85,
      solved,
      reopened: Math.round((solved * (index === 3 ? 12 : (index * 3 + 1) % 9)) / 100),
      escalated: 2 + ((index * 5) % 13),
      replyMinutes: index === 3 ? 41 : 8 + ((index * 13 + 1) % 29),
      resolutionMinutes: index === 3 ? 680 : 170 + ((index * 71) % 383),
      slaMet: solved - (2 + ((index * 7) % 23)),
      surveys,
      positive: Math.round((surveys * (quality < 80 ? 74 + (index % 9) : 90 + (index % 8))) / 100),
      reviews,
      coaching:
        index === 1 || index === 5
          ? { focus: rubric[focusIndex].name, followUp: index === 1 ? "2026-10-23" : "2026-10-28" }
          : null,
      notes: [],
    };
  });
}

export function scorecard(agent: Agent) {
  const reviews = agent.reviews.filter((review) => review.week < 4);
  const scores = reviews.map(reviewScore);
  const qa = average(scores);
  const categoryScores = rubric.map((category, index) => ({
    ...category,
    score: average(reviews.map((review) => review.scores[index])),
  }));
  const weakest = categoryScores.reduce((lowest, current) =>
    (current.score ?? Infinity) < (lowest.score ?? Infinity) ? current : lowest,
  );
  const currentWeek = reviews.filter((review) => review.week === 0);
  const band =
    qa === null
      ? "Unscored"
      : qa >= agent.goal + 5
        ? "Exceeds"
        : qa >= agent.goal
          ? "Meets"
          : qa >= agent.goal - 15
            ? "Needs Work"
            : "At Risk";
  return {
    qa,
    band,
    weakest: weakest.name,
    categoryScores,
    critical: reviews.filter((review) => review.critical).length,
    reviewCount: reviews.length,
    currentWeek: average(currentWeek.map(reviewScore)),
    currentCount: currentWeek.length,
    prior: average(agent.reviews.filter((review) => review.week > 0).map(reviewScore)),
    reopen: percent(agent.reopened, agent.solved),
    csat: percent(agent.positive, agent.surveys),
    sla: percent(agent.slaMet, agent.solved),
    suggested: qa !== null && qa < agent.goal && !agent.coaching,
  };
}

export function formatMinutes(minutes: number) {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export type AgentProfile = Pick<Agent, "name" | "email" | "queue" | "shift" | "started" | "goal">;

export function newAgent(profile: AgentProfile): Agent {
  return {
    ...profile,
    id: crypto.randomUUID(),
    solved: 0,
    reopened: 0,
    escalated: 0,
    replyMinutes: 0,
    resolutionMinutes: 0,
    slaMet: 0,
    surveys: 0,
    positive: 0,
    reviews: [],
    coaching: null,
    notes: [],
  };
}

function fieldValue(agent: Agent, field: string) {
  const summary = scorecard(agent);
  const values: Record<string, number | string | null> = {
    name: agent.name,
    queue: agent.queue,
    shift: agent.shift,
    qa: summary.qa,
    csat: summary.csat,
    reopen: summary.reopen,
    sla: summary.sla,
    coaching: agent.coaching ? "In coaching" : "Not in coaching",
  };
  return values[field];
}

function evaluate(agent: Agent, node: FilterNode): boolean | undefined {
  if (node.type === "group") {
    const children = node.rules
      .map((rule) => evaluate(agent, rule))
      .filter((result) => result !== undefined);
    if (children.length === 0) return undefined;
    return node.combinator === "or" ? children.some(Boolean) : children.every(Boolean);
  }
  let matches: boolean;
  const raw = fieldValue(agent, node.path[0]);
  const value = Array.isArray(node.value) ? node.value : [node.value];
  const options = value.map((item) => String(item ?? "").toLowerCase());
  const field = String(raw ?? "").toLowerCase();
  const isEmpty = raw == null || raw === "";
  if (
    node.operator !== "empty" &&
    node.operator !== "not_empty" &&
    (value[0] == null || value[0] === "")
  )
    return undefined;
  switch (node.operator) {
    case "contains":
      matches = field.includes(options[0]);
      break;
    case "not_contains":
      matches = !field.includes(options[0]);
      break;
    case "starts_with":
      matches = field.startsWith(options[0]);
      break;
    case "ends_with":
      matches = field.endsWith(options[0]);
      break;
    case "is":
    case "is_any_of":
      matches = options.includes(field);
      break;
    case "is_not":
    case "is_none_of":
      matches = !options.includes(field);
      break;
    case "empty":
      matches = isEmpty;
      break;
    case "not_empty":
      matches = !isEmpty;
      break;
    case "eq":
      matches = !isEmpty && Number(raw) === Number(value[0]);
      break;
    case "neq":
      matches = !isEmpty && Number(raw) !== Number(value[0]);
      break;
    case "gt":
      matches = !isEmpty && Number(raw) > Number(value[0]);
      break;
    case "gte":
      matches = !isEmpty && Number(raw) >= Number(value[0]);
      break;
    case "lt":
      matches = !isEmpty && Number(raw) < Number(value[0]);
      break;
    case "lte":
      matches = !isEmpty && Number(raw) <= Number(value[0]);
      break;
    case "between":
    case "not_between": {
      if (value[1] == null) return undefined;
      const inside = Number(raw) >= Number(value[0]) && Number(raw) <= Number(value[1]);
      matches = !isEmpty && (node.operator === "between" ? inside : !inside);
      break;
    }
    default:
      return undefined;
  }
  return node.negated ? !matches : matches;
}

export function matchesAgent(agent: Agent, search: string, query: FilterQuery) {
  const term = search.trim().toLowerCase();
  return (
    [agent.name, agent.email, agent.queue].some((value) => value.toLowerCase().includes(term)) &&
    (evaluate(agent, query) ?? true)
  );
}
