/** Independent demo records derived from public labels/outcomes, never Pro source. */
export type RunStatus =
  | "Succeeded"
  | "Failed"
  | "Timed Out"
  | "Skipped"
  | "Running"
  | "Waiting"
  | "Rolled back";
export const trackerColors = {
  Succeeded: "var(--color-emerald-400)",
  Failed: "var(--color-red-500)",
  "Timed Out": "var(--color-yellow-500)",
  Skipped: "var(--color-violet-300)",
  Running: "var(--foreground)",
  Waiting: "var(--color-amber-500)",
  "Rolled back": "var(--color-red-500)",
};
export type CronRun = { status: RunStatus; seconds: number; at: string; number: number };
export const cronSeeds = [
  {
    name: "Import bank settlement files",
    command: "settlements:import --banks=all",
    seconds: 252,
    interval: 60,
    age: 50,
    pattern: "SSSSSSSSSSSSSSSSFFFF",
    paused: false,
  },
  {
    name: "Drain webhook retry queue",
    command: "retries:drain --max=5000",
    seconds: 52,
    interval: 5,
    age: 5,
    pattern: "SSSSSSSSSSSSSSSSSSFF",
    paused: false,
  },
  {
    name: "Rebuild merchant search index",
    command: "reindex merchants --shards=12",
    seconds: 3600,
    interval: 1440,
    age: 650,
    pattern: "SSSSSSSSSSSSSSSSSSTT",
    paused: false,
  },
  {
    name: "Expire stale payout holds",
    command: "holds:expire --older-than=72h",
    seconds: 18,
    interval: 15,
    age: 5,
    pattern: "SSSSSSSSSKSSSSSSSSSS",
    paused: false,
  },
  {
    name: "Retry failed payouts",
    command: "payouts:retry --max-attempts=3",
    seconds: 106,
    interval: 30,
    age: 20,
    pattern: "SSSSSSSSFSSSSSSSSSSS",
    paused: false,
  },
  {
    name: "Rotate webhook signing keys",
    command: "keys:rotate --grace=48h",
    seconds: 42,
    interval: 10080,
    age: 1440,
    pattern: "SSSSSSSSSSSSSSSSSSSS",
    paused: false,
  },
  {
    name: "Compact ledger partitions",
    command: "partitions:compact --keep=90d",
    seconds: 2848,
    interval: 10080,
    age: 12960,
    pattern: "SSSSSSSSSSSSSSSSSSSS",
    paused: true,
  },
];
export const cronJobs = cronSeeds.map((job, j) => ({
  ...job,
  runs: [...job.pattern].map((letter, i): CronRun => ({
    status:
      letter === "F"
        ? "Failed"
        : letter === "T"
          ? "Timed Out"
          : letter === "K"
            ? "Skipped"
            : "Succeeded",
    seconds:
      letter === "K"
        ? 0
        : letter === "T"
          ? 3600
          : j === 0 && i >= 13 && i <= 15
            ? [490, 508, 543][i - 13]
            : i === 19
              ? job.seconds
              : Math.min(
                  j === 2 ? 3500 : Infinity,
                  Math.round(job.seconds * (0.7 + ((i * 7 + j * 3) % 11) / 25)),
                ),
    at: new Date(
      Date.UTC(2026, 8, 29, 14, 20) - (job.age + (19 - i) * job.interval) * 60000,
    ).toISOString(),
    number: i + 1,
  })),
}));
export function duration(seconds: number) {
  if (seconds >= 3600)
    return `${Math.floor(seconds / 3600)}h ${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}m`;
  if (seconds >= 60)
    return `${Math.floor(seconds / 60)}m ${String(Math.floor(seconds % 60)).padStart(2, "0")}s`;
  return `${Math.round(seconds)}s`;
}
export function successRate(runs: CronRun[]) {
  const eligible = runs.filter((r) => r.status !== "Skipped");
  return eligible.length
    ? (eligible.filter((r) => r.status === "Succeeded").length / eligible.length) * 100
    : 100;
}
export function p95(runs: CronRun[]) {
  const sorted = runs
    .filter((r) => r.status !== "Skipped")
    .map((r) => r.seconds)
    .sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? 0;
}
export const services = [
  "payments-api",
  "ledger-worker",
  "webhook-dispatcher",
  "fraud-scorer",
  "payouts-scheduler",
  "reconciliation",
  "search-indexer",
  "notifications",
];
export const versions: Record<string, string[]> = {
  "payments-api": ["v2.41.0", "v2.40.2"],
  "ledger-worker": ["v1.18.4", "v1.18.3"],
  "webhook-dispatcher": ["v1.27.0", "v1.26.2"],
  "fraud-scorer": ["v3.9.0", "v3.8.2"],
  "payouts-scheduler": ["v4.12.1", "v4.12.0"],
  reconciliation: ["v2.7.1", "v2.7.0"],
  "search-indexer": ["v2.3.2", "v2.3.0"],
  notifications: ["v3.5.0", "v3.4.0"],
};
export type Environment = "Staging" | "Sandbox" | "Production";
export type Strategy = "Canary" | "Rolling" | "Blue-green";
export type DeployRun = {
  id: number;
  service: string;
  version: string;
  environment: Environment;
  strategy: Strategy;
  progress: number;
  status: RunStatus;
  hold: boolean;
  failureAt?: number;
  at: string;
  actor: string;
};
export const deploySeeds: DeployRun[] = [
  {
    id: 4128,
    service: "fraud-scorer",
    version: "v3.9.0",
    environment: "Production",
    strategy: "Canary",
    progress: 4.2,
    status: "Running",
    hold: true,
    at: "Sep 29, 14:12",
    actor: "Kenji Tan",
  },
  {
    id: 4127,
    service: "payments-api",
    version: "v2.41.0",
    environment: "Production",
    strategy: "Rolling",
    progress: 6,
    status: "Succeeded",
    hold: false,
    at: "Sep 29, 13:51",
    actor: "Maya Brooks",
  },
  {
    id: 4125,
    service: "reconciliation",
    version: "v2.7.1",
    environment: "Production",
    strategy: "Canary",
    progress: 3.6,
    status: "Rolled back",
    hold: false,
    at: "Sep 29, 10:38",
    actor: "Sofia Romero",
  },
  {
    id: 4124,
    service: "ledger-worker",
    version: "v1.18.4",
    environment: "Staging",
    strategy: "Rolling",
    progress: 3.5,
    status: "Failed",
    hold: false,
    at: "Sep 29, 10:02",
    actor: "Omar Haddad",
  },
  {
    id: 4112,
    service: "notifications",
    version: "v3.5.0",
    environment: "Staging",
    strategy: "Rolling",
    progress: 1.7,
    status: "Failed",
    hold: false,
    at: "Sep 28, 21:05",
    actor: "Maya Brooks",
  },
  {
    id: 4108,
    service: "search-indexer",
    version: "v2.3.0",
    environment: "Production",
    strategy: "Blue-green",
    progress: 6,
    status: "Succeeded",
    hold: false,
    at: "Sep 28, 18:07",
    actor: "Omar Haddad",
  },
];
export function stageNames(strategy: Strategy) {
  return strategy === "Canary"
    ? ["Build", "Test", "Canary 10%", "Canary 25%", "Canary 50%", "Rollout"]
    : strategy === "Rolling"
      ? ["Build", "Test", "Package", "Wave 1", "Wave 2", "Verify"]
      : ["Build", "Test", "Provision", "Warm up", "Switch", "Verify"];
}
export function tickDeploy(run: DeployRun): DeployRun {
  if (run.status !== "Running") return run;
  const progress = Math.min(6, run.progress + 0.2);
  if (run.failureAt !== undefined && progress >= run.failureAt)
    return { ...run, progress: run.failureAt, status: "Failed" };
  if (run.hold && progress >= 5) return { ...run, progress: 5, status: "Waiting" };
  return { ...run, progress, status: progress >= 6 ? "Succeeded" : "Running" };
}
