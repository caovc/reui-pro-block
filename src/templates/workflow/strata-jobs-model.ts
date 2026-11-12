import { useCallback, useRef, useState } from "react";
import {
  STRATA_NOW_MS,
  STRATA_OWNERS,
  STRATA_SERVICES,
  type StrataEnvironment,
} from "./strata-domain.ts";
import { nextStrataRuns } from "./strata-cron.ts";

export type StrataJobOutcome = "Succeeded" | "Failed" | "Timed Out";
export type StrataJobHealth = "Healthy" | "Failing" | "Paused";
export interface StrataJob {
  id: string;
  name: string;
  command: string;
  cron: string;
  timeZone: "UTC";
  serviceId: string;
  cluster: string;
  environment: StrataEnvironment;
  ownerId: string;
  enabled: boolean;
  createdAt: number;
  pausedAt?: number;
}
export interface StrataJobRun {
  id: string;
  jobId: string;
  at: number;
  durationSeconds: number;
  outcome: StrataJobOutcome;
}
export type StrataJobDraft = Omit<StrataJob, "id" | "createdAt" | "pausedAt">;
export type StrataJobErrors = Partial<Record<keyof StrataJobDraft, string>>;
export type StrataJobResult = { ok: true; job: StrataJob } | { ok: false; errors: StrataJobErrors };

const jobDefinitions: readonly [string, string, string, string][] = [
  ["Drain webhook retry queue", "retries:drain --max=5000", "*/5 * * * *", "webhook-worker"],
  ["Import bank settlement files", "settlements:import --banks=all", "30 * * * *", "ledger-worker"],
  [
    "Rebuild merchant search index",
    "reindex merchants --shards=12",
    "30 3 * * *",
    "search-indexer",
  ],
  ["Send failed charge alerts", "alerts:failed-charges --batch=500", "*/5 * * * *", "email-sender"],
  ["Sync FX reference rates", "fx:sync --source=central-banks", "*/10 * * * *", "payments-api"],
  ["Expire stale payout holds", "holds:expire --older-than=72h", "*/15 * * * *", "ledger-worker"],
  ["Warm merchant search cache", "cache:warm merchants", "*/20 * * * *", "search-indexer"],
  ["Purge expired idempotency keys", "idempotency:purge --ttl=24h", "25 * * * *", "payments-api"],
  ["Retry failed payouts", "payouts:retry --max-attempts=3", "*/30 * * * *", "ledger-worker"],
  ["Refresh fraud model features", "features:refresh --model=fs-v7", "0 * * * *", "checkout-api"],
  ["Refresh edge route manifests", "routes:refresh", "0 4 * * *", "edge-gateway"],
  ["Compact telemetry buffers", "telemetry:compact", "0 */2 * * *", "otel-collector"],
  ["Reconcile merchant ledgers", "ledger:reconcile", "15 2 * * *", "ledger-worker"],
  ["Publish status aggregates", "status:aggregate", "0 6 * * *", "status-renderer"],
  ["Archive delivered messages", "messages:archive", "10 */3 * * *", "email-sender"],
  ["Check sandbox credentials", "credentials:check", "0 */4 * * *", "sandbox-api"],
  ["Sweep abandoned checkouts", "checkout:sweep", "45 1 * * *", "checkout-api"],
  ["Prepare payment summaries", "payments:summarize", "0 */6 * * *", "payments-api"],
  ["Refresh search synonyms", "synonyms:refresh", "20 */4 * * *", "search-api"],
  ["Verify warehouse partitions", "warehouse:verify", "0 2 * * *", "warehouse-sync"],
  ["Audit webhook signatures", "webhooks:audit", "0 6 * * 1-5", "webhook-worker"],
  ["Rebuild availability history", "availability:rebuild", "0 5 * * *", "status-renderer"],
  ["Clean expired telemetry", "telemetry:expire", "0 1 * * *", "otel-collector"],
  ["Snapshot analytics catalog", "catalog:snapshot", "0 4 * * *", "warehouse-sync"],
  ["Refresh account search facets", "facets:refresh", "0 */8 * * *", "search-api"],
  ["Generate operations digest", "digest:generate", "0 8 * * 1-5", "email-sender"],
  ["Validate payment reconciliation", "reconciliation:validate", "0 7 * * *", "payments-api"],
  ["Load test fraud scorer", "fraud:load-test", "0 10 * * 1", "checkout-api"],
  ["Reindex archived merchants", "archive:reindex", "0 2 1 * *", "search-indexer"],
  ["Backfill warehouse checksums", "checksums:backfill", "0 3 * * 0", "warehouse-sync"],
  ["Replay sandbox deliveries", "deliveries:replay", "0 12 * * 1-5", "sandbox-api"],
  ["Benchmark gateway regions", "gateway:benchmark", "0 9 * * 6", "edge-gateway"],
];

/** Independent generated run records keep cards, table and plots consistent. */
export function createStrataJobsFixture() {
  const jobs: StrataJob[] = jobDefinitions.map(([name, command, cron, serviceId], index) => {
    const service = STRATA_SERVICES.find((item) => item.id === serviceId)!;
    return {
      id: `job-${index + 1}`,
      name,
      command,
      cron,
      timeZone: "UTC",
      serviceId,
      cluster: service.cluster,
      environment: service.environment,
      ownerId: service.ownerId,
      enabled: index < 27,
      createdAt: STRATA_NOW_MS - 90 * 86400000,
      ...(index >= 27 ? { pausedAt: STRATA_NOW_MS - 7 * 86400000 } : {}),
    };
  });
  const runs: StrataJobRun[] = [];
  const latestAges = [5, 30, 630, 5, 10, 15, 20, 35, 30, 60];
  const ageFor = (index: number) => latestAges[index] ?? 20 + index * 3;
  for (let index = 0; index < 956; index++) {
    const jobIndex = index % 27;
    const minimum = ageFor(jobIndex) + 1;
    const age = minimum + ((index * 37) % (1379 - minimum));
    runs.push({
      id: `run-ok-${index}`,
      jobId: jobs[jobIndex].id,
      at: STRATA_NOW_MS - age * 60000,
      durationSeconds: 1,
      outcome: "Succeeded",
    });
  }
  for (let index = 3; index < 27; index++) {
    runs.push({
      id: `run-latest-${index}`,
      jobId: jobs[index].id,
      at: STRATA_NOW_MS - ageFor(index) * 60000,
      durationSeconds: [12, 11, 20, 38, 115, 117, 348][(index - 3) % 7],
      outcome: "Succeeded",
    });
  }
  const explicitSeconds = runs.slice(956).reduce((sum, run) => sum + run.durationSeconds, 0);
  const remainingSeconds = 51180 - explicitSeconds;
  for (let index = 0; index < 956; index++)
    runs[index].durationSeconds =
      Math.floor(remainingSeconds / 956) + (index < remainingSeconds % 956 ? 1 : 0);
  const failures: [number, number, number, StrataJobOutcome][] = [
    [0, 5, 52, "Failed"],
    [0, 120, 168, "Failed"],
    [1, 30, 252, "Failed"],
    [1, 120, 240, "Failed"],
    [1, 480, 180, "Failed"],
    [1, 360, 120, "Failed"],
    [2, 630, 3600, "Timed Out"],
    [3, 240, 200, "Failed"],
    [4, 360, 1200, "Timed Out"],
  ];
  failures.forEach(([jobIndex, age, seconds, outcome], index) =>
    runs.push({
      id: `run-fault-${index}`,
      jobId: jobs[jobIndex].id,
      at: STRATA_NOW_MS - age * 60000,
      durationSeconds: seconds,
      outcome,
    }),
  );
  jobs.slice(27).forEach((job) => {
    for (let index = 0; index < 20; index++)
      runs.push({
        id: `${job.id}-history-${index}`,
        jobId: job.id,
        at: STRATA_NOW_MS - (7 * 24 + index) * 3600000,
        durationSeconds: 32 + index,
        outcome: "Succeeded",
      });
  });
  for (let index = 0; index < 128; index++) {
    runs.push({
      id: `run-prior-${index}`,
      jobId: jobs[index % 27].id,
      at: STRATA_NOW_MS - 86400000 - (index * 11 + 1) * 60000,
      durationSeconds: 475 + (index < 42 ? 1 : 0),
      outcome: "Succeeded",
    });
  }
  return { jobs, runs };
}

export function strataJobHistory(jobId: string, runs: readonly StrataJobRun[], count = 20) {
  return runs
    .filter((run) => run.jobId === jobId)
    .sort((a, b) => b.at - a.at)
    .slice(0, count);
}

export function strataJobHealth(job: StrataJob, runs: readonly StrataJobRun[]): StrataJobHealth {
  if (!job.enabled) return "Paused";
  const latest = strataJobHistory(job.id, runs, 1)[0];
  return latest && latest.outcome !== "Succeeded" ? "Failing" : "Healthy";
}

export function strataJobsMetrics(
  jobs: readonly StrataJob[],
  runs: readonly StrataJobRun[],
  now = STRATA_NOW_MS,
) {
  const ids = new Set(jobs.map((job) => job.id));
  const recent = runs.filter(
    (run) => ids.has(run.jobId) && run.at > now - 86400000 && run.at <= now,
  );
  const failed = recent.filter((run) => run.outcome !== "Succeeded");
  const priorSeconds = runs
    .filter((run) => ids.has(run.jobId) && run.at > now - 2 * 86400000 && run.at <= now - 86400000)
    .reduce((sum, run) => sum + run.durationSeconds, 0);
  const outcomes = ["Succeeded", "Timed Out", "Failed"] as const;
  const hours = Array.from({ length: 24 }, (_, index) => {
    const start = now - (24 - index) * 3600000;
    const bucket = recent.filter((run) => run.at >= start && run.at < start + 3600000);
    return {
      label: new Date(start).toISOString().slice(11, 16),
      segments: outcomes.map((outcome) =>
        bucket
          .filter((run) => run.outcome === outcome)
          .reduce((sum, run) => sum + run.durationSeconds / 60, 0),
      ),
      successRate: bucket.length
        ? (bucket.filter((run) => run.outcome === "Succeeded").length / bucket.length) * 100
        : null,
    };
  });
  const upcoming = jobs
    .filter((job) => job.enabled)
    .flatMap((job) =>
      nextStrataRuns(job.cron, now, 128)
        .filter((at) => at <= now + 3600000)
        .map((at) => ({ job, at })),
    )
    .sort((a, b) => a.at - b.at || a.job.id.localeCompare(b.job.id));
  const failuresByJob = jobs
    .map((job) => ({ job, count: failed.filter((run) => run.jobId === job.id).length }))
    .filter((item) => item.count)
    .sort((a, b) => b.count - a.count);
  return {
    active: jobs.filter((job) => job.enabled).length,
    healthy: jobs.filter((job) => strataJobHealth(job, runs) === "Healthy").length,
    failing: jobs.filter((job) => strataJobHealth(job, runs) === "Failing").length,
    paused: jobs.filter((job) => !job.enabled).length,
    runs: recent.length,
    succeeded: recent.filter((run) => run.outcome === "Succeeded").length,
    failed: failed.filter((run) => run.outcome === "Failed").length,
    timedOut: failed.filter((run) => run.outcome === "Timed Out").length,
    successRate: recent.length ? ((recent.length - failed.length) / recent.length) * 100 : null,
    failedJobs: failuresByJob.length,
    worst: failuresByJob[0],
    hours,
    hoursInSlo: hours.filter((hour) => hour.successRate !== null && hour.successRate >= 99.5)
      .length,
    measuredHours: hours.filter((hour) => hour.successRate !== null).length,
    priorSeconds,
    secondsByOutcome: outcomes.map((outcome) =>
      recent
        .filter((run) => run.outcome === outcome)
        .reduce((sum, run) => sum + run.durationSeconds, 0),
    ),
    upcoming,
  };
}

export function validateStrataJob(draft: StrataJobDraft): StrataJobErrors {
  const errors: StrataJobErrors = {};
  if (!draft.name.trim()) errors.name = "Enter a job name.";
  if (!draft.command.trim()) errors.command = "Enter a command to schedule.";
  if (!STRATA_SERVICES.some((service) => service.id === draft.serviceId))
    errors.serviceId = "Choose an available service.";
  if (!STRATA_OWNERS.some((owner) => owner.id === draft.ownerId))
    errors.ownerId = "Choose an available owner.";
  if (!draft.cluster.trim()) errors.cluster = "Choose a cluster.";
  if (draft.timeZone !== "UTC")
    errors.timeZone = "This local scenario currently evaluates schedules in UTC.";
  if (!["Production", "Staging", "Sandbox"].includes(draft.environment))
    errors.environment = "Choose an available environment.";
  try {
    if (!nextStrataRuns(draft.cron, STRATA_NOW_MS, 3).length)
      errors.cron = "This schedule never fires in the next eight years. Choose a possible date.";
  } catch (error) {
    errors.cron = error instanceof Error ? error.message : "Enter a valid cron expression.";
  }
  return errors;
}

export function useStrataJobsModel() {
  const [state, setState] = useState(createStrataJobsFixture);
  const nextId = useRef(33);
  const createJob = useCallback((draft: StrataJobDraft): StrataJobResult => {
    const errors = validateStrataJob(draft);
    if (Object.keys(errors).length) return { ok: false, errors };
    const job: StrataJob = {
      ...draft,
      name: draft.name.trim(),
      command: draft.command.trim(),
      cron: draft.cron.trim(),
      id: `job-${nextId.current++}`,
      createdAt: STRATA_NOW_MS,
      ...(!draft.enabled ? { pausedAt: STRATA_NOW_MS } : {}),
    };
    setState((current) => ({ ...current, jobs: [job, ...current.jobs] }));
    return { ok: true, job };
  }, []);
  const setEnabled = useCallback((id: string, enabled: boolean) => {
    setState((current) => ({
      ...current,
      jobs: current.jobs.map((job) =>
        job.id === id ? { ...job, enabled, pausedAt: enabled ? undefined : STRATA_NOW_MS } : job,
      ),
    }));
  }, []);
  return { ...state, createJob, setEnabled };
}

export type StrataJobsModel = ReturnType<typeof useStrataJobsModel>;
