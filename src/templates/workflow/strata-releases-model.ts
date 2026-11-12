import { useMemo, useState } from "react";
import {
  STRATA_INCIDENT_ID,
  STRATA_NOW_MS,
  strataOwner,
  strataService,
  type StrataEnvironment,
  type StrataEnvironmentFilter,
} from "./strata-domain.ts";

export type StrataReleaseStatus = "running" | "succeeded" | "failed" | "rolled-back";
export type StrataReleaseTab = "all" | "live" | "failed" | "rolled-back";
export type StrataBoardTab = "deploys" | "merges";
export type StrataMergeStatus = "merged" | "merging" | "blocked";
export type StrataBoardStatus =
  | "failed"
  | "rolled-back"
  | "deployed"
  | "checks"
  | "rolling"
  | "queued"
  | "approval"
  | "scheduled";

export interface StrataRelease {
  id: string;
  serviceId: string;
  environment: StrataEnvironment;
  region: string;
  version: string;
  previousVersion: string;
  commit: string;
  summary: string;
  authorId: string;
  startedAt: number;
  durationSeconds: number;
  status: StrataReleaseStatus;
  completedStages: number;
  incidentId?: string;
}

export interface StrataBoardDeploy {
  id: string;
  serviceId: string;
  environment: StrataEnvironment;
  region: string;
  version: string;
  previousVersion: string;
  scheduledAt: number;
  status: StrataBoardStatus;
  checksPassed?: number;
  checksTotal?: number;
  rolloutPercent?: number;
  completedAt?: number;
  incidentId?: string;
}

export interface StrataBoardMerge {
  id: string;
  serviceId: string;
  environment: StrataEnvironment;
  region: string;
  version: string;
  pullRequest: number;
  branch: string;
  deployId: string;
  scheduledAt: number | null;
  status: StrataMergeStatus;
  blockedReason?: string;
  incidentId?: string;
}

const minute = 60 * 1000;
const releaseServices = [
  "search-api",
  "checkout-api",
  "payments-api",
  "webhook-worker",
  "ledger-worker",
  "warehouse-sync",
  "email-sender",
  "edge-gateway",
] as const;
const summaries = [
  "Keep search responses close to the reader",
  "Enable the checkout release in each region",
  "Retry payment requests with the original key",
  "Rotate the delivery signing key safely",
  "Warm the ledger balance cache before serving",
  "Checkpoint warehouse batches before transfer",
  "Group transactional mail by delivery region",
  "Preserve routing hints across edge restarts",
];

/** Independent demo releases: no reference accounts, portraits or source records. */
export function createStrataReleasesFixture() {
  const serviceIndexes = [0, 1, 2, 3, 4, 2, 2, 2, 2, 0, 5, 6, 7, 1, 3, 4, 5, 6, 7, 2, 0, 1, 3];
  const ages = [
    8, 20, 110, 128, 258, 280, 329, 395, 491, 529, 605, 680, 745, 830, 925, 1040, 1135, 1260, 1390,
    1515, 1680, 1810, 1950,
  ];
  const versions = ["1.14.0", "3.5.0", "2.8.1", "1.27.0", "1.18.4", "2.3.2", "2.14.0", "2.7.1"];
  const previous = ["1.13.2", "3.4.2", "2.8.0", "1.26.2", "1.18.3", "2.3.1", "2.13.0", "2.7.0"];
  const history: StrataRelease[] = serviceIndexes.map((serviceIndex, index) => {
    const serviceId = releaseServices[serviceIndex];
    const status: StrataReleaseStatus =
      index === 0
        ? "running"
        : [4, 18].includes(index)
          ? "failed"
          : [11, 21].includes(index)
            ? "rolled-back"
            : "succeeded";
    const environment: StrataEnvironment = [3, 4, 18, 22].includes(index)
      ? "Staging"
      : [5, 6, 7, 8, 14, 17].includes(index)
        ? "Sandbox"
        : "Production";
    return {
      id: `DEP-${2292 - index}`,
      serviceId,
      environment,
      region: environment === "Production" && index % 2 ? "eu-central-1" : "us-east-1",
      version: versions[serviceIndex],
      previousVersion: previous[serviceIndex],
      commit: (0xa43b910 + serviceIndex * 0x1a35d + (index > 5 ? index * 0x101 : 0)).toString(16),
      summary: summaries[serviceIndex],
      authorId: strataService(serviceId)!.ownerId,
      startedAt: STRATA_NOW_MS - ages[index] * minute,
      durationSeconds: [440, 332, 626, 297, 374, 273, 1664, 265][index % 8],
      status,
      completedStages: status === "running" ? 4 : status === "failed" ? 3 : 6,
      ...(serviceId === "checkout-api" ? { incidentId: STRATA_INCIDENT_ID } : {}),
    };
  });
  type BoardSeed = [string, string, StrataEnvironment, string, number, StrataBoardStatus, number?];
  const boardSeeds: BoardSeed[] = [
    ["warehouse-sync", "1.18.4", "Staging", "us-east-1", -258, "failed"],
    ["edge-gateway", "2.7.1", "Production", "eu-central-1", -220, "rolled-back"],
    ["ledger-worker", "2.41.0", "Production", "us-east-1", -20, "deployed"],
    ["webhook-worker", "1.27.0", "Sandbox", "us-east-1", -4, "checks", 6],
    ["search-indexer", "2.3.3", "Staging", "us-east-1", -3, "checks", 4],
    ["email-sender", "2.14.0", "Staging", "us-east-1", -2, "checks", 2],
    ["checkout-api", "3.5.0", "Production", "us-east-1", 0, "rolling", 5],
    ["ledger-worker", "2.41.0", "Production", "ap-southeast-1", 0, "rolling", 5],
    ["webhook-worker", "1.27.0", "Production", "us-east-1", 0, "queued"],
    ["ledger-worker", "2.41.0", "Production", "eu-central-1", 20, "approval"],
    ["search-indexer", "2.3.1", "Production", "ap-southeast-1", 40, "scheduled"],
    ["webhook-worker", "1.27.0", "Production", "eu-central-1", 40, "scheduled"],
  ];
  const previousBoardVersions = [
    "1.18.3",
    "2.7.0",
    "2.40.3",
    "1.26.2",
    "2.3.2",
    "2.13.0",
    "3.4.2",
    "2.40.3",
    "1.26.2",
    "2.40.3",
    "2.2.9",
    "1.26.2",
  ];
  const boardIds = [4124, 4125, 4127, 4131, 4134, 4132, 4128, 4129, 4133, 4130, 4135, 4136];
  const board: StrataBoardDeploy[] = boardSeeds.map(
    ([serviceId, version, environment, region, offset, status, progress], index) => ({
      id: `DEP-${boardIds[index]}`,
      serviceId,
      version,
      previousVersion: previousBoardVersions[index],
      environment,
      region,
      scheduledAt: STRATA_NOW_MS + offset * minute,
      status,
      ...(status === "checks" ? { checksPassed: progress, checksTotal: 9 } : {}),
      ...(status === "rolling" ? { rolloutPercent: progress } : {}),
      ...(status === "deployed" ? { completedAt: STRATA_NOW_MS - 6 * minute } : {}),
      ...(serviceId === "checkout-api" ? { incidentId: STRATA_INCIDENT_ID } : {}),
    }),
  );
  type MergeSeed = [string, string, number, string, string, number | null, StrataMergeStatus];
  const mergeSeeds: MergeSeed[] = [
    ["ledger-worker", "2.41.0", 2841, "balance-timeout", "DEP-4130", -40, "merged"],
    ["checkout-api", "3.5.0", 1187, "checkout-token", "DEP-4128", -34, "merged"],
    ["webhook-worker", "1.27.0", 964, "rotated-key", "DEP-4133", -26, "merged"],
    ["search-indexer", "2.3.3", 745, "index-cap", "DEP-4134", -15, "merged"],
    ["email-sender", "2.14.0", 388, "mail-batches", "DEP-4132", -9, "merged"],
    ["payments-api", "2.8.2", 1097, "payment-retry", "DEP-4137", 10, "merging"],
    ["warehouse-sync", "1.18.5", 458, "warehouse-limit", "DEP-4124", null, "blocked"],
  ];
  const merges: StrataBoardMerge[] = mergeSeeds.map(
    ([serviceId, version, pullRequest, branch, deployId, offset, status]) => {
      const service = strataService(serviceId)!;
      const target = board.find((row) => row.id === deployId);
      return {
        id: `PR-${pullRequest}`,
        serviceId,
        version,
        pullRequest,
        branch: `${service.ownerId}/${branch}`,
        deployId,
        scheduledAt: offset === null ? null : STRATA_NOW_MS + offset * minute,
        environment: target?.environment ?? service.environment,
        region: target?.region ?? service.cluster,
        status,
        ...(status === "blocked"
          ? { blockedReason: "Two warehouse validation checks must pass before scheduling." }
          : {}),
        ...(serviceId === "checkout-api" ? { incidentId: STRATA_INCIDENT_ID } : {}),
      };
    },
  );
  return { history, board, merges };
}

export function strataReleaseTime(timestamp: number) {
  return new Date(timestamp).toISOString().slice(11, 16);
}

export function strataReleaseAge(timestamp: number, now = STRATA_NOW_MS) {
  const elapsed = Math.max(0, Math.floor((now - timestamp) / minute));
  return elapsed < 60
    ? `${elapsed}m ago`
    : elapsed < 1440
      ? `${Math.floor(elapsed / 60)}h ago`
      : `${Math.floor(elapsed / 1440)}d ago`;
}

export function strataReleaseDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function nextStrataDeployWindow(now = STRATA_NOW_MS) {
  const cadence = 20 * minute;
  return (Math.floor(now / cadence) + 1) * cadence;
}

export function summarizeStrataReleases(rows: readonly StrataRelease[]) {
  return {
    all: rows.length,
    live: rows.filter((row) => row.status === "running").length,
    failed: rows.filter((row) => row.status === "failed").length,
    "rolled-back": rows.filter((row) => row.status === "rolled-back").length,
  };
}

function matchesQuery(row: StrataRelease | StrataBoardDeploy | StrataBoardMerge, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    row.id,
    row.serviceId,
    strataService(row.serviceId)?.name,
    row.version,
    row.environment,
    row.region,
    row.status,
    ...("commit" in row ? [row.commit, row.summary, strataOwner(row.authorId)?.name] : []),
    ...("pullRequest" in row
      ? [row.pullRequest, `#${row.pullRequest}`, row.branch, row.deployId, row.blockedReason]
      : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

export function selectStrataReleases(
  rows: readonly StrataRelease[],
  {
    environment = "all",
    tab = "all",
    query = "",
  }: {
    environment?: StrataEnvironmentFilter;
    tab?: StrataReleaseTab;
    query?: string;
  } = {},
) {
  return rows.filter(
    (row) =>
      (environment === "all" || row.environment === environment) &&
      (tab === "all" || row.status === (tab === "live" ? "running" : tab)) &&
      matchesQuery(row, query),
  );
}

export function selectStrataBoard(
  rows: readonly StrataBoardDeploy[],
  {
    environment = "all",
    boardEnvironment = "all",
    query = "",
  }: {
    environment?: StrataEnvironmentFilter;
    boardEnvironment?: StrataEnvironmentFilter;
    query?: string;
  } = {},
) {
  return rows.filter(
    (row) =>
      (environment === "all" || row.environment === environment) &&
      (boardEnvironment === "all" || row.environment === boardEnvironment) &&
      matchesQuery(row, query),
  );
}

export function selectStrataMerges(
  rows: readonly StrataBoardMerge[],
  {
    environment = "all",
    boardEnvironment = "all",
    query = "",
  }: {
    environment?: StrataEnvironmentFilter;
    boardEnvironment?: StrataEnvironmentFilter;
    query?: string;
  } = {},
) {
  return rows.filter(
    (row) =>
      (environment === "all" || row.environment === environment) &&
      (boardEnvironment === "all" || row.environment === boardEnvironment) &&
      matchesQuery(row, query),
  );
}

export function summarizeStrataMerges(rows: readonly StrataBoardMerge[]) {
  return {
    all: rows.length,
    merged: rows.filter((row) => row.status === "merged").length,
    merging: rows.filter((row) => row.status === "merging").length,
    blocked: rows.filter((row) => row.status === "blocked").length,
  };
}

export function strataBoardStatusLabel(row: StrataBoardDeploy, now = STRATA_NOW_MS) {
  switch (row.status) {
    case "failed":
      return "Failed";
    case "rolled-back":
      return "Rolled back";
    case "deployed":
      return `Deployed ${strataReleaseTime(row.completedAt!)}`;
    case "checks":
      return `Checks ${row.checksPassed}/${row.checksTotal}`;
    case "rolling":
      return `Rolling out ${row.rolloutPercent}%`;
    case "queued":
      return `Queued ${strataReleaseTime(nextStrataDeployWindow(now))}`;
    case "approval":
      return "Needs approval";
    case "scheduled":
      return "Scheduled";
  }
}

export function useStrataReleasesModel() {
  const [fixture] = useState(createStrataReleasesFixture);
  const [historyTab, setHistoryTab] = useState<StrataReleaseTab>("all");
  const [historyQuery, setHistoryQuery] = useState("");
  const [boardQuery, setBoardQuery] = useState("");
  const [boardTab, setBoardTab] = useState<StrataBoardTab>("deploys");
  const [boardEnvironment, setBoardEnvironment] = useState<StrataEnvironmentFilter>("all");
  const [muted, setMuted] = useState(true);
  const [tvMode, setTvMode] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [historySorting, setHistorySorting] = useState([{ id: "started", desc: true }]);
  const serviceCount = useMemo(
    () => new Set(fixture.history.map((row) => row.serviceId)).size,
    [fixture],
  );
  return {
    ...fixture,
    serviceCount,
    clockMs: STRATA_NOW_MS,
    nextWindow: nextStrataDeployWindow(),
    historyTab,
    setHistoryTab,
    historyQuery,
    setHistoryQuery,
    boardQuery,
    setBoardQuery,
    boardTab,
    setBoardTab,
    boardEnvironment,
    setBoardEnvironment,
    muted,
    setMuted,
    tvMode,
    setTvMode,
    selection,
    setSelection,
    pagination,
    setPagination,
    historySorting,
    setHistorySorting,
  };
}

export type StrataReleasesModel = ReturnType<typeof useStrataReleasesModel>;
