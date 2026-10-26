import { useState } from "react";
export type Cluster = {
  id: string;
  code?: string;
  name: string;
  region: string;
  owner: string;
  health: string;
  capacity: number;
  growth: number;
  upgrade: string;
  tier?: string;
  autoUpgrade?: boolean;
  autoscaling?: boolean;
  privateEndpoint?: boolean;
  spotNodes?: boolean;
  nodePool?: string;
};
const clusters: Cluster[] = [
  {
    id: "E1",
    name: "prod-eu-1",
    region: "eu-west",
    owner: "Elena Varga",
    health: "Healthy",
    capacity: 1024,
    growth: 112,
    upgrade: "2026-09-14",
  },
  {
    id: "E2",
    name: "prod-eu-2",
    region: "eu-west",
    owner: "Adam Reyes",
    health: "Degraded",
    capacity: 768,
    growth: 104,
    upgrade: "2026-07-02",
  },
  {
    id: "E3",
    name: "stage-eu-1",
    region: "eu-west",
    owner: "Elena Varga",
    health: "Healthy",
    capacity: 256,
    growth: 118,
    upgrade: "2026-11-21",
  },
  {
    id: "E4",
    name: "stage-eu-2",
    region: "eu-west",
    owner: "Leila Haddad",
    health: "Healthy",
    capacity: 192,
    growth: 109,
    upgrade: "2026-10-08",
  },
  {
    id: "E5",
    name: "canary-eu-1",
    region: "eu-west",
    owner: "Theo Morales",
    health: "At Risk",
    capacity: 128,
    growth: 94,
    upgrade: "2026-06-30",
  },
  {
    id: "E6",
    name: "sandbox-eu-1",
    region: "eu-west",
    owner: "Nia Achebe",
    health: "Healthy",
    capacity: 64,
    growth: 121,
    upgrade: "2026-12-04",
  },
  {
    id: "E7",
    name: "build-eu-1",
    region: "eu-west",
    owner: "Amelia Hart",
    health: "Healthy",
    capacity: 160,
    growth: 107,
    upgrade: "2026-08-19",
  },
  {
    id: "U1",
    name: "prod-us-1",
    region: "us-east",
    owner: "Adam Reyes",
    health: "Healthy",
    capacity: 896,
    growth: 115,
    upgrade: "2026-09-28",
  },
  {
    id: "U2",
    name: "prod-us-2",
    region: "us-east",
    owner: "Elena Varga",
    health: "At Risk",
    capacity: 640,
    growth: 91,
    upgrade: "2026-06-24",
  },
  {
    id: "U3",
    name: "stage-us-1",
    region: "us-east",
    owner: "Leila Haddad",
    health: "Healthy",
    capacity: 224,
    growth: 113,
    upgrade: "2026-11-06",
  },
  {
    id: "U4",
    name: "stage-us-2",
    region: "us-east",
    owner: "Theo Morales",
    health: "Degraded",
    capacity: 176,
    growth: 102,
    upgrade: "2026-07-17",
  },
  {
    id: "U5",
    name: "sandbox-us-1",
    region: "us-east",
    owner: "Nia Achebe",
    health: "Degraded",
    capacity: 48,
    growth: 126,
    upgrade: "2026-12-18",
  },
  {
    id: "U6",
    name: "build-us-1",
    region: "us-east",
    owner: "Amelia Hart",
    health: "Healthy",
    capacity: 144,
    growth: 108,
    upgrade: "2026-10-23",
  },
  {
    id: "A1",
    name: "prod-ap-1",
    region: "ap-south",
    owner: "Leila Haddad",
    health: "Healthy",
    capacity: 512,
    growth: 132,
    upgrade: "2026-09-03",
  },
  {
    id: "A2",
    name: "stage-ap-1",
    region: "ap-south",
    owner: "Amelia Hart",
    health: "Healthy",
    capacity: 160,
    growth: 119,
    upgrade: "2026-11-13",
  },
  {
    id: "A3",
    name: "canary-ap-1",
    region: "ap-south",
    owner: "Theo Morales",
    health: "At Risk",
    capacity: 96,
    growth: 98,
    upgrade: "2026-06-27",
  },
  {
    id: "A4",
    name: "sandbox-ap-1",
    region: "ap-south",
    owner: "Nia Achebe",
    health: "Healthy",
    capacity: 32,
    growth: 124,
    upgrade: "2026-12-11",
  },
  {
    id: "S1",
    name: "prod-sa-1",
    region: "sa-east",
    owner: "Adam Reyes",
    health: "Healthy",
    capacity: 384,
    growth: 117,
    upgrade: "2026-10-02",
  },
  {
    id: "S2",
    name: "stage-sa-1",
    region: "sa-east",
    owner: "Nia Achebe",
    health: "At Risk",
    capacity: 112,
    growth: 88,
    upgrade: "2026-06-22",
  },
  {
    id: "S3",
    name: "sandbox-sa-1",
    region: "sa-east",
    owner: "Amelia Hart",
    health: "Degraded",
    capacity: 40,
    growth: 96,
    upgrade: "2026-12-29",
  },
];
export type Host = {
  id: string;
  name: string;
  owner: string;
  cluster: string;
  window: string;
  hardening: number;
  state: string;
  monitoring: boolean;
  seen: string;
  role?: string;
  agentVersion?: string;
  autoApprove?: boolean;
  patchStart?: string;
  patchEnd?: string;
  profile?: string;
  provisionedBy?: string;
  patchPriority?: string;
  compliance?: boolean;
  group?: string;
  lifecycle?: string;
  pagesOnCall?: boolean;
};
const hostSpecs = [
  ["ip-10-0-1-11", "Elena Varga", "prod-eu-1", "Sun 02:00 UTC", 4.8, "Patched"],
  ["ip-10-0-1-12", "Adam Reyes", "prod-eu-1", "Sun 02:00 UTC", 4.1, "Pending patch"],
  ["ip-10-0-3-14", "Marcus Webb", "prod-eu-2", "Wed 23:00 UTC", 4.9, "Patched"],
  ["ip-10-1-4-21", "Rafael Duarte", "edge-eu-1", "Rolling", 4.4, "Patched"],
  ["ip-10-0-2-31", "Leila Haddad", "prod-eu-1", "Sun 02:00 UTC", 4.6, "Patched"],
  ["ip-10-0-3-15", "Klara Nowak", "prod-eu-2", "Wed 23:00 UTC", 3.8, "Pending patch"],
  ["ip-10-2-5-41", "Sofia Brandt", "build-eu-1", "Nightly 01:00", 4.7, "Patched"],
  ["ip-10-0-2-32", "Theo Morales", "prod-eu-1", "Sun 02:00 UTC", 3.4, "Pending patch"],
  ["ip-10-3-6-51", "Ines Moreau", "prod-us-1", "Sun 06:00 UTC", 4.5, "Patched"],
  ["ip-10-0-2-33", "Nia Achebe", "prod-eu-2", "Wed 23:00 UTC", 2.9, "Drifted"],
  ["ip-10-3-6-52", "Amelia Hart", "prod-us-2", "Sun 06:00 UTC", 3.1, "Drifted"],
  ["ip-10-2-5-42", "Sofia Brandt", "build-eu-1", "Nightly 01:00", 2.8, "Drifted"],
  ["ip-10-4-1-70", "Marcus Webb", "stage-ap-1", "Rolling", 1.8, "Offline"],
  ["ip-10-4-1-71", "Rafael Duarte", "stage-sa-1", "Rolling", 1.6, "Offline"],
];
const hosts: Host[] = hostSpecs.map((row, i) => ({
  id: `HOST-${i + 1}`,
  name: String(row[0]),
  owner: String(row[1]),
  cluster: String(row[2]),
  window: String(row[3]),
  hardening: Number(row[4]),
  state: String(row[5]),
  monitoring: i < 9,
  seen: i < 4 ? "Aug 12, 2026" : i < 7 ? "Aug 11, 2026" : "Aug 10, 2026",
}));
export type Repository = {
  id: string;
  name: string;
  status: string;
  previousStatus?: string;
  completedAt?: number;
  pusher: string;
  severity: string;
  scan: boolean;
  namespace: string;
  kind: string;
  keepLast: number;
  immutable: boolean;
  parentId?: string;
  children?: Repository[];
};
const repositorySpecs = [
  ["payments-api", "Queued", "Adam Reyes", "Critical", "Payments"],
  ["cdn-purge", "Scanning", "Marcus Webb", "Critical", "Edge"],
  ["api-gateway", "Scanning", "Elena Varga", "Critical", "Platform"],
  ["schema-lint", "Queued", "Adam Reyes", "High", "Data"],
  ["recommender", "Scanning", "Marcus Webb", "High", "Search"],
  ["orders-db", "Needs review", "Leila Haddad", "High", "Data"],
  ["log-shipper", "Scanning", "Elena Varga", "High", "Edge"],
  ["identity", "Queued", "Nia Achebe", "High", "Identity"],
  ["gateway-base", "Unscanned", "Elena Varga", "High", "Platform"],
  ["search-indexer", "Unscanned", "Nia Achebe", "Medium", "Search"],
  ["node-runtime", "Needs review", "Leila Haddad", "Medium", "Platform"],
  ["migrate-job", "Queued", "Theo Morales", "Medium", "Data"],
  ["edge-cache", "Unscanned", "Theo Morales", "Medium", "Edge"],
  ["token-signer", "Clean", "Nia Achebe", "Low", "Identity"],
  ["otel-collector", "Unscanned", "Theo Morales", "Low", "Platform"],
  ["cart-worker", "Quarantined", "No pusher", "Low", "Payments"],
];
const repositoryTags: Record<string, string[][]> = {
  "cdn-purge": [
    ["v0.4.6", "Clean", "Marcus Webb", "Critical"],
    ["v0.4.5", "Clean", "Elena Varga", "High"],
    ["v0.3.9", "Scanning", "No pusher", "Medium"],
  ],
  "api-gateway": [
    ["v2.14.0", "Clean", "Elena Varga", "Critical"],
    ["v2.13.4", "Clean", "Adam Reyes", "High"],
    ["v2.13.0", "Scanning", "Leila Haddad", "Critical"],
    ["sha256:9f2c1a", "Scanning", "Elena Varga", "Medium"],
  ],
  recommender: [
    ["v4.2.0", "Clean", "Marcus Webb", "High"],
    ["v4.1.3", "Scanning", "Elena Varga", "High"],
    ["v4.0.9", "Scanning", "Theo Morales", "Medium"],
  ],
};
const repositories: Repository[] = repositorySpecs.map(
  ([name, status, pusher, severity, namespace]) => ({
    id: name,
    name,
    status,
    pusher,
    severity,
    namespace,
    scan: status !== "Unscanned" && status !== "Quarantined",
    kind: "Service",
    keepLast: name === "payments-api" ? 45 : 30,
    immutable: true,
    children: repositoryTags[name]?.map(([tag, tagStatus, tagPusher, tagSeverity]) => ({
      id: `${name}:${tag}`,
      parentId: name,
      name: tag,
      status: tagStatus,
      pusher: tagPusher,
      severity: tagSeverity,
      namespace,
      scan: false,
      kind: "Tag",
      keepLast: 30,
      immutable: true,
    })),
  }),
);
export function useLucentInfrastructureModel() {
  const [records, setRecords] = useState(clusters);
  const [fleet, setFleet] = useState(hosts);
  const [registry, setRegistry] = useState(repositories);
  return { records, setRecords, fleet, setFleet, registry, setRegistry };
}
