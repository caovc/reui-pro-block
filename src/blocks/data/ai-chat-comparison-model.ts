/** Original local comparison fixtures. No model API, remote prompt or paid source.
 * The recorded demo metrics describe these fixtures, not a live model run.
 */
export const COMPARISON_MODELS = [
  {
    id: "opus",
    label: "Claude Opus 5",
    provider: "Anthropic",
    context: "200K",
    latencyMs: 2600,
    inputPrice: 5,
    outputPrice: 25,
    chunk: 20,
    lens: "risk",
  },
  {
    id: "sonnet",
    label: "Claude Sonnet 5",
    provider: "Anthropic",
    context: "200K",
    latencyMs: 1900,
    inputPrice: 3,
    outputPrice: 15,
    chunk: 30,
    lens: "cohorts",
  },
  {
    id: "haiku",
    label: "Claude Haiku 4.5",
    provider: "Anthropic",
    context: "200K",
    latencyMs: 1300,
    inputPrice: 1,
    outputPrice: 5,
    chunk: 42,
    lens: "operations",
  },
  {
    id: "gpt",
    label: "GPT-5.1",
    provider: "OpenAI",
    context: "256K",
    latencyMs: 2500,
    inputPrice: 1.25,
    outputPrice: 10,
    chunk: 24,
    lens: "denominator",
  },
  {
    id: "gemini",
    label: "Gemini 3 Pro",
    provider: "Google",
    context: "1M",
    latencyMs: 2200,
    inputPrice: 2,
    outputPrice: 12,
    chunk: 28,
    lens: "checks",
    limited: true,
  },
  {
    id: "mistral",
    label: "Mistral Large",
    provider: "Mistral",
    context: "128K",
    latencyMs: 1600,
    inputPrice: 2,
    outputPrice: 6,
    chunk: 36,
    lens: "plan",
  },
] as const;
export type ComparisonModelId = (typeof COMPARISON_MODELS)[number]["id"];
export type AnswerSegment =
  | { type: "paragraph"; text: string }
  | { type: "table"; caption: string; columns: string[]; rows: (string | number)[][] }
  | { type: "code"; title: string; language: string; text: string };
export type ComparisonAnswer = {
  segments: AnswerSegment[];
  tokensOut: number;
  latencyMs: number;
  cost: number;
};
export type ComparisonTurn = {
  id: number;
  prompt: string;
  time: string;
  modelId: ComparisonModelId;
  answer: ComparisonAnswer;
  revealed: number;
  revision: number;
  status: "pending" | "streaming" | "complete" | "stopped" | "limited";
  rating: "up" | "down" | null;
  preferred: boolean;
  contextFiles: string[];
};
export const COMPARISON_CONTEXT = { name: "retention-aug.csv", detail: "12,840 rows" };
export const COMPARISON_SEED = [
  {
    prompt:
      "attached retention-aug.csv, 12840 rows. team churn reads 3.8% in august vs 2.4 in july. check the denominator before we dig",
    time: "10:52",
  },
  {
    prompt:
      "what is driving it? rank the drivers, not just the headline. the review is on thursday",
    time: "10:56",
  },
];
export function comparisonModel(id: ComparisonModelId) {
  return COMPARISON_MODELS.find((model) => model.id === id)!;
}
export function segmentText(segment: AnswerSegment): string {
  if (segment.type === "table")
    return [segment.columns, ...segment.rows].map((row) => row.join("\t")).join("\n");
  if (segment.type === "code") return `\`\`\`${segment.language}\n${segment.text}\n\`\`\``;
  return segment.text;
}
export function comparisonAnswerText(answer: ComparisonAnswer): string {
  return answer.segments.map(segmentText).join("\n\n");
}
const paragraph = (text: string): AnswerSegment => ({ type: "paragraph", text });
const cohortRows = [
  ["Renewal discount", 8, 5],
  ["Seat threshold", 5, 9],
  ["Missing integration", 3, 14],
  ["No signal", 2, 21],
];
const changeRows = [
  ["Seat threshold", 1, 5, 4],
  ["Renewal discount", 5, 8, 3],
  ["Missing integration", 1, 3, 2],
  ["No signal", 1, 2, 1],
];
export function makeComparisonAnswer(
  prompt: string,
  id: ComparisonModelId,
  revision = 0,
): ComparisonAnswer {
  const model = comparisonModel(id);
  const ranking = /rank|driver|breakdown|table|sql|query|compare|plan/i.test(prompt);
  const primary = model.lens === "cohorts" || model.lens === "operations" || model.lens === "risk";
  let segments: AnswerSegment[];
  if (ranking && primary) {
    segments = [
      paragraph(
        revision % 2
          ? "Start with the renewal cohort, then check whether the seat rule is creating avoidable cancellations. Here is the same evidence ordered for a review."
          : "Ranked by share of the eighteen August team cancellations.",
      ),
      {
        type: "table",
        caption: "August team cancellations by driver",
        columns: ["Driver", "Accounts", "Median days"],
        rows: cohortRows.map((row) => [...row]),
      },
      paragraph(
        "The eight renewal accounts joined on a spring discount and left around the first standard invoice. Five smaller teams dropped below the seat threshold. Two of the three integration accounts had open support conversations before they cancelled.",
      ),
      {
        type: "code",
        title: "retention-cohorts.sql",
        language: "sql",
        text: "select\n  case\n    when offer = 'SPRING_TEAM' then 'renewal_discount'\n    when seats < 5 then 'seat_threshold'\n    when exit_note ilike '%integration%' then 'integration'\n    else 'no_signal'\n  end as driver,\n  count(*) as accounts,\n  round(avg(days_since_change), 1) as days\nfrom retention_aug\nwhere plan = 'team'\n  and cancelled_at >= date '2026-08-01'\ngroup by 1\norder by accounts desc;",
      },
      paragraph(
        "Run this against the same account-level export. The renewal cohort is the largest actionable group; ask the account owner to review it before Thursday.",
      ),
    ];
  } else if (ranking) {
    segments = [
      paragraph(
        revision % 2
          ? "A second pass keeps the July baseline explicit. Prioritize the increase, then validate whether each cancelled account belongs in the team cohort."
          : "The largest raw group is not the largest change. Compare August with the eight July cancellations before choosing an intervention.",
      ),
      {
        type: "table",
        caption: "Team cancellations compared with July",
        columns: ["Driver", "July", "August", "Change"],
        rows: changeRows.map((row) => [...row]),
      },
      paragraph(
        "Seat-threshold cancellations account for four of the ten additional exits. All five August accounts reduced seats before leaving. The renewal group adds three, while integration issues add two. Treat the one unexplained extra exit as a research question.",
      ),
      paragraph(
        "One caution: fourteen rows have no plan label. Reconcile them with the account owner before the presentation. If any belong to the team plan, both the numerator and the driver ranking need to change.",
      ),
      paragraph(
        "For Thursday, show the account definition next to the trend, separate the renewal wave from the packaging issue, and give each follow-up a named owner.",
      ),
    ];
  } else if (primary) {
    segments = [
      paragraph(
        "At the account level, eighteen cancellations from 480 team accounts active on August 1 give 3.75 percent, which rounds to the reported 3.8 percent.",
      ),
      paragraph(
        "Check one detail before Thursday: two exported rows are workspaces under an account that cancelled once. At the customer level the result is sixteen of 480, or 3.33 percent. July has no duplicate customers, so its 2.4 percent stands.",
      ),
      paragraph(
        revision % 2
          ? "The revised recommendation is to label both definitions, then use one consistently for the comparison."
          : "Keep the account definition on the slide so the next comparison uses the same denominator.",
      ),
    ];
  } else {
    segments = [
      paragraph(
        "The headline is correct for the start-of-month definition, but the dashboard uses a different denominator.",
      ),
      paragraph(
        "The file uses 480 accounts active on August 1: eighteen of 480 is 3.75 percent. The dashboard uses the monthly average of 492, producing 3.66 percent. Both can be useful, but they answer different questions.",
      ),
      paragraph(
        revision % 2
          ? "For this revised draft, reconcile the fourteen unlabelled rows first and only then publish the comparison."
          : "Fourteen rows have no plan label. Resolve those before presenting a precise team-plan trend; otherwise the result looks more certain than the underlying data.",
      ),
    ];
  }
  if (model.lens === "risk")
    segments.push(
      paragraph(
        "Risk check: validate duplicate accounts and the missing plan labels before assigning a cause to the entire increase.",
      ),
    );
  if (model.lens === "operations")
    segments.push(
      paragraph(
        "Next actions: review the renewal list, offer the smaller-team plan, and triage the three integration accounts with support.",
      ),
    );
  if (model.lens === "checks")
    segments.push(
      paragraph(
        "Validation checks: compare unique account IDs, confirm date boundaries, and reconcile the account count with the billing snapshot.",
      ),
    );
  if (model.lens === "plan")
    segments.push(
      paragraph(
        "Suggested review order: agree on the definition, verify the driver counts, then assign one owner to each follow-up.",
      ),
    );
  const text = segments.map(segmentText).join("\n\n");
  const tokensOut = Math.ceil(text.length / 4);
  return {
    segments,
    tokensOut,
    latencyMs: model.latencyMs + (ranking ? 650 : 0) + revision * 120,
    cost: (1350 * model.inputPrice + tokensOut * model.outputPrice) / 1_000_000,
  };
}
export function createComparisonTurn(
  id: number,
  prompt: string,
  modelId: ComparisonModelId,
  revision = 0,
  contextFiles = [COMPARISON_CONTEXT.name],
  time = "Now",
): ComparisonTurn {
  return {
    id,
    prompt,
    time,
    modelId,
    answer: makeComparisonAnswer(prompt, modelId, revision),
    revision,
    revealed: 0,
    status: "pending",
    rating: null,
    preferred: false,
    contextFiles,
  };
}
export function seedComparisonTurns(modelId: ComparisonModelId): ComparisonTurn[] {
  return COMPARISON_SEED.map<ComparisonTurn>((seed, index) => {
    const turn = createComparisonTurn(
      index + 1,
      seed.prompt,
      modelId,
      0,
      [COMPARISON_CONTEXT.name],
      seed.time,
    );
    return index === 0
      ? {
          ...turn,
          revealed: comparisonAnswerText(turn.answer).length,
          status: "complete",
          preferred: modelId === "sonnet",
        }
      : turn;
  });
}
export function sortComparisonRows(
  rows: (string | number)[][],
  column: number,
  descending: boolean,
) {
  return rows
    .map((row) => [...row])
    .sort((a, b) => {
      const left = a[column];
      const right = b[column];
      const value =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return descending ? -value : value;
    });
}
export function comparisonTranscript(turns: ComparisonTurn[], label: string): string {
  return [
    `# ${label}`,
    "Original local demo transcript; recorded fixture metrics.",
    ...turns.map(
      (turn) =>
        `## ${turn.time}\n\nUser: ${turn.prompt}\n\n${comparisonModel(turn.modelId).label}:\n${comparisonAnswerText(turn.answer).slice(0, turn.revealed)}\n\nStatus: ${turn.status}${turn.preferred ? " · Preferred" : ""}\nContext: ${turn.contextFiles.join(", ") || "None"}`,
    ),
  ].join("\n\n");
}

/** Project recorded fixture metrics onto the actual visible local partial answer. */
export function comparisonTurnMetrics(turn: ComparisonTurn | undefined) {
  if (!turn) return { latency: 0, rate: 0, cost: 0, tokens: 0 };
  const ratio = Math.max(0, Math.min(1, turn.revealed / comparisonAnswerText(turn.answer).length));
  return {
    latency: (turn.answer.latencyMs / 1000) * ratio,
    rate: turn.revealed ? Math.round(turn.answer.tokensOut / (turn.answer.latencyMs / 1000)) : 0,
    cost: turn.answer.cost * ratio,
    tokens: Math.ceil(turn.answer.tokensOut * ratio),
  };
}
