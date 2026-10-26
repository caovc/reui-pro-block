/** Independently authored Bricklane fixtures. No upstream Pro records or media. */
export type DeployEnvironment = "Production" | "Staging" | "Sandbox";
export type DeployPhase =
  | "Failed"
  | "Rolled back"
  | "Deployed"
  | "Rolling out"
  | "Checks"
  | "Queued"
  | "Needs approval"
  | "Scheduled";

export interface DeployApproval {
  name: string;
  role: "Code owner" | "Release manager";
  approvedAt: number | null;
}

export interface DeployLogEntry {
  at: number;
  text: string;
  tone: "normal" | "success" | "warning" | "error";
}

export interface DeploymentRecord {
  id: string;
  service: string;
  version: string;
  previousVersion: string;
  environment: DeployEnvironment;
  region: string;
  country: string;
  phase: DeployPhase;
  windowAt: number;
  changedAt: number;
  completedAt: number | null;
  author: string;
  commit: string;
  checks: number;
  approvals: DeployApproval[];
  target: number;
  actual: number;
  errorRate: number;
  errorLimit: number;
  failedAnalyses: number;
  lastAnalysisAt: number;
  manualUntil: number;
  attempts: number;
  fault: "none" | "canary";
  failure: string | null;
  pullRequests: number[];
  log: DeployLogEntry[];
}

export interface DeployMerge {
  id: number;
  deployId: string;
  title: string;
  author: string;
  branch: string;
  mergedAt: number;
  state: "Merged" | "Merging" | "Blocked";
}

export const DEPLOY_REFERENCE = Date.UTC(2026, 9, 26, 14, 20);
export const TRAFFIC_LEVELS = [0, 5, 25, 50, 100] as const;
export const DEPLOY_REGIONS = {
  "us-east-1": "United States",
  "eu-west-1": "Ireland",
  "ap-southeast-1": "Singapore",
} as const;

type Seed = [
  service: string,
  version: string,
  previousVersion: string,
  environment: DeployEnvironment,
  region: keyof typeof DEPLOY_REGIONS,
  phase: DeployPhase,
  minutes: number,
];

const fixtures: Seed[] = [
  ["ledger-jobs", "v1.8.6", "v1.8.5", "Staging", "us-east-1", "Failed", -258],
  ["settlement-engine", "v2.6.1", "v2.6.0", "Production", "eu-west-1", "Rolled back", -220],
  ["checkout-api", "v4.12.0", "v4.11.8", "Production", "us-east-1", "Deployed", -20],
  ["event-relay", "v1.16.0", "v1.15.3", "Sandbox", "us-east-1", "Rolling out", -4],
  ["catalog-search", "v3.4.2", "v3.4.1", "Staging", "us-east-1", "Checks", -3],
  ["inbox-delivery", "v2.9.0", "v2.8.7", "Staging", "us-east-1", "Checks", -2],
  ["risk-evaluator", "v2.7.0", "v2.6.2", "Production", "us-east-1", "Rolling out", 0],
  ["checkout-api", "v4.12.0", "v4.11.8", "Production", "ap-southeast-1", "Rolling out", 0],
  ["event-relay", "v1.16.0", "v1.15.3", "Production", "us-east-1", "Queued", 20],
  ["checkout-api", "v4.12.0", "v4.11.8", "Production", "eu-west-1", "Needs approval", 20],
  ["catalog-search", "v3.4.2", "v3.4.1", "Production", "ap-southeast-1", "Scheduled", 40],
  ["event-relay", "v1.16.0", "v1.15.3", "Production", "eu-west-1", "Scheduled", 40],
];

export function createDeployRecords(): DeploymentRecord[] {
  return fixtures.map(
    ([service, version, previousVersion, environment, region, phase, minutes], i) => {
      const windowAt = DEPLOY_REFERENCE + minutes * 60_000;
      const approvalPending = phase === "Needs approval";
      return {
        id: `BLD-${2041 + i}`,
        service,
        version,
        previousVersion,
        environment,
        region,
        country: DEPLOY_REGIONS[region],
        phase,
        windowAt,
        changedAt:
          phase === "Checks" ? DEPLOY_REFERENCE - (i === 4 ? 7 : 3) * 10_000 : DEPLOY_REFERENCE,
        completedAt: phase === "Deployed" ? DEPLOY_REFERENCE - 6 * 60_000 : null,
        author: ["Elin Hart", "Rory Chen", "Noa Walsh", "Ari Flores"][i % 4],
        commit: ["c7a3f10", "8b24e6d", "a92f5c1", "6e17b84"][i % 4],
        checks: phase === "Checks" ? (i === 4 ? 7 : 3) : 9,
        approvals:
          environment === "Production"
            ? [
                { name: "Rory Chen", role: "Code owner", approvedAt: DEPLOY_REFERENCE - 240_000 },
                {
                  name: "Elin Hart",
                  role: "Release manager",
                  approvedAt: approvalPending ? null : DEPLOY_REFERENCE - 180_000,
                },
              ]
            : [],
        target:
          phase === "Rolling out"
            ? environment === "Sandbox"
              ? 25
              : 5
            : phase === "Deployed"
              ? 100
              : 0,
        actual:
          phase === "Rolling out"
            ? environment === "Sandbox"
              ? 22
              : 5
            : phase === "Deployed"
              ? 100
              : 0,
        errorRate: 0.03,
        errorLimit: 0.5,
        failedAnalyses: 0,
        lastAnalysisAt: DEPLOY_REFERENCE,
        manualUntil: 0,
        attempts: 1,
        fault: service === "risk-evaluator" ? "canary" : "none",
        failure:
          phase === "Failed"
            ? "Container exceeded its memory limit during startup"
            : phase === "Rolled back"
              ? "Error budget exceeded during canary analysis"
              : null,
        pullRequests: [732 + i * 7, 729 + i * 7],
        log: [
          { at: windowAt, text: `${version} prepared for ${environment}`, tone: "normal" },
          {
            at: DEPLOY_REFERENCE,
            text:
              phase === "Failed"
                ? "Container terminated: memory limit exceeded"
                : `Release ${phase.toLowerCase()}`,
            tone: phase === "Failed" ? "error" : phase === "Rolled back" ? "warning" : "normal",
          },
        ],
      };
    },
  );
}

export const DEPLOY_MERGES: DeployMerge[] = [
  {
    id: 746,
    deployId: "BLD-2050",
    title: "Keep idempotency keys across retries",
    author: "Noa Walsh",
    branch: "noa/idempotency",
    mergedAt: DEPLOY_REFERENCE - 40 * 60_000,
    state: "Merged",
  },
  {
    id: 752,
    deployId: "BLD-2047",
    title: "Bound risk feature lookups",
    author: "Rory Chen",
    branch: "rory/feature-cache",
    mergedAt: DEPLOY_REFERENCE - 32 * 60_000,
    state: "Merged",
  },
  {
    id: 767,
    deployId: "BLD-2049",
    title: "Deduplicate outgoing events",
    author: "Ari Flores",
    branch: "ari/dedupe",
    mergedAt: DEPLOY_REFERENCE - 24 * 60_000,
    state: "Merged",
  },
  {
    id: 773,
    deployId: "BLD-2045",
    title: "Warm the catalog index in batches",
    author: "Elin Hart",
    branch: "elin/warm-index",
    mergedAt: DEPLOY_REFERENCE - 15 * 60_000,
    state: "Merged",
  },
  {
    id: 786,
    deployId: "BLD-2046",
    title: "Drain inbox partitions before shutdown",
    author: "Noa Walsh",
    branch: "noa/drain",
    mergedAt: DEPLOY_REFERENCE - 9 * 60_000,
    state: "Merged",
  },
  {
    id: 791,
    deployId: "BLD-2051",
    title: "Ship index schema version four",
    author: "Ari Flores",
    branch: "ari/schema-four",
    mergedAt: DEPLOY_REFERENCE + 10 * 60_000,
    state: "Merging",
  },
  {
    id: 798,
    deployId: "BLD-2041",
    title: "Reserve memory for ledger compaction",
    author: "Rory Chen",
    branch: "rory/compaction",
    mergedAt: DEPLOY_REFERENCE + 20 * 60_000,
    state: "Blocked",
  },
];

export const DEPLOY_CHECKS = [
  ["Build", "46s"],
  ["Unit tests", "54s"],
  ["Lint and types", "19s"],
  ["Contract tests", "37s"],
  ["Security scan", "28s"],
  ["Image push", "15s"],
  ["Migrations", "13s"],
  ["Smoke tests", "23s"],
  ["Change record", "5s"],
] as const;
