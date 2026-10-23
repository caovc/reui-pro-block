import { useState } from "react";

export type Agent = {
  id: string;
  name: string;
  owner: string;
  role: string;
  model: string;
  status: string;
  sessions: number;
  spend: string;
  date: string;
};
const agentRecords: Agent[] = [
  {
    id: "agt_4n9s3e",
    name: "Contract Reviewer",
    owner: "Ines Marchetti",
    role: "Head of Operations",
    model: "Claude Opus 5.5",
    status: "Draft",
    sessions: 0,
    spend: "$0.00",
    date: "Never run",
  },
  {
    id: "agt_7f2k9q",
    name: "Support Triage Agent",
    owner: "Hanna Berg",
    role: "Support Lead",
    model: "Claude Sonnet 5.5",
    status: "Live",
    sessions: 4820,
    spend: "$612.40",
    date: "Oct 6, 2026",
  },
  {
    id: "agt_3m8w1z",
    name: "Lead Qualifier",
    owner: "Omar Haddad",
    role: "Data Engineer",
    model: "GPT-5",
    status: "Live",
    sessions: 2156,
    spend: "$388.90",
    date: "Oct 6, 2026",
  },
  {
    id: "agt_2h7v5k",
    name: "Meeting Summarizer",
    owner: "Nick Bold",
    role: "Workspace Admin",
    model: "Claude Sonnet 5.5",
    status: "Live",
    sessions: 1388,
    spend: "$174.60",
    date: "Oct 6, 2026",
  },
  {
    id: "agt_0p8g2c",
    name: "Data Sync Monitor",
    owner: "Tomas Lindqvist",
    role: "Solutions Engineer",
    model: "Llama 4",
    status: "Error",
    sessions: 1620,
    spend: "$64.90",
    date: "Oct 6, 2026",
  },
  {
    id: "agt_9k4p2r",
    name: "Invoice Reconciler",
    owner: "Lena Wade",
    role: "Finance Ops",
    model: "Claude Opus 5.5",
    status: "Error",
    sessions: 734,
    spend: "$455.20",
    date: "Oct 5, 2026",
  },
  {
    id: "agt_6r2j7m",
    name: "Onboarding Guide",
    owner: "Hanna Berg",
    role: "Support Lead",
    model: "GPT-5",
    status: "Live",
    sessions: 965,
    spend: "$88.10",
    date: "Oct 5, 2026",
  },
  {
    id: "agt_7d3u6f",
    name: "Renewal Forecaster",
    owner: "Omar Haddad",
    role: "Data Engineer",
    model: "Gemini 3 Pro",
    status: "Draft",
    sessions: 12,
    spend: "$3.60",
    date: "Oct 5, 2026",
  },
  {
    id: "agt_5c6t8n",
    name: "Churn Analyst",
    owner: "Ines Marchetti",
    role: "Head of Operations",
    model: "Gemini 3 Pro",
    status: "Live",
    sessions: 412,
    spend: "$96.30",
    date: "Oct 4, 2026",
  },
  {
    id: "agt_3w9a1h",
    name: "Knowledge Base Writer",
    owner: "Hanna Berg",
    role: "Support Lead",
    model: "Claude Sonnet 5.5",
    status: "Live",
    sessions: 342,
    spend: "$57.20",
    date: "Oct 3, 2026",
  },
  {
    id: "agt_8f3s2b",
    name: "Campaign Planner",
    owner: "Nick Bold",
    role: "Workspace Admin",
    model: "GPT-5",
    status: "Paused",
    sessions: 88,
    spend: "$14.40",
    date: "Oct 2, 2026",
  },
  {
    id: "agt_1c2h4d",
    name: "Research Assistant",
    owner: "Lena Wade",
    role: "Finance Ops",
    model: "Gemini 3 Pro",
    status: "Draft",
    sessions: 0,
    spend: "$0.00",
    date: "Never run",
  },
];

export function useFlowlyAgentsModel() {
  return useState(agentRecords);
}

export type ScheduledTask = {
  id: number;
  name: string;
  prompt: string;
  repeat: string;
  time: string;
  status: string;
  next: string;
};
const scheduledRecords: ScheduledTask[] = [
  {
    id: 1,
    name: "Rate limit review",
    prompt: "Review rate limit changes and summarize findings.",
    repeat: "Daily",
    time: "Afternoon",
    status: "Active",
    next: "Tomorrow at 3:00 PM",
  },
  {
    id: 2,
    name: "Churn by plan tier",
    prompt: "Summarize churn by plan tier.",
    repeat: "Weekly",
    time: "Morning",
    status: "Active",
    next: "October 30 at 9:00 AM",
  },
  {
    id: 3,
    name: "Weekly billing digest",
    prompt: "Create a weekly billing digest.",
    repeat: "Weekly",
    time: "Morning",
    status: "Paused",
    next: "",
  },
  {
    id: 4,
    name: "Audit log export limits",
    prompt: "Review audit log export limits.",
    repeat: "Monthly",
    time: "Morning",
    status: "Active",
    next: "November 22 at 9:00 AM",
  },
  {
    id: 5,
    name: "Admin 3.4 release watch",
    prompt: "Watch the Admin 3.4 release.",
    repeat: "Daily",
    time: "Morning",
    status: "Completed",
    next: "",
  },
];

export function useEchoScheduledModel() {
  return useState(scheduledRecords);
}

export type FeatureFlag = {
  id: string;
  name: string;
  provider: string;
  scope: string;
  owner: string;
  team: string;
  readiness: number;
  stage: string;
  enabled: boolean;
  updated: string;
  kind?: string;
  approval?: boolean;
};
const flagRecords: FeatureFlag[] = [
  {
    id: "PROV-2041",
    name: "Risk summary prompt canary",
    provider: "OpenRoute Primary",
    scope: "Canary 10%",
    owner: "Mira Stone",
    team: "Product",
    readiness: 4.8,
    stage: "Staged",
    enabled: true,
    updated: "Oct 23, 2026",
  },
  {
    id: "PROV-2042",
    name: "Provider fallback router",
    provider: "Northstar Claude Pool",
    scope: "Enterprise tier",
    owner: "Leo Grant",
    team: "Engineering",
    readiness: 4.7,
    stage: "Live",
    enabled: true,
    updated: "Oct 23, 2026",
  },
  {
    id: "PROV-2043",
    name: "Payment action guardrail",
    provider: "Local Guardrail Runner",
    scope: "Safety holdout",
    owner: "Nora Vale",
    team: "Safety",
    readiness: 4.3,
    stage: "Review",
    enabled: false,
    updated: "Oct 22, 2026",
  },
  {
    id: "PROV-2044",
    name: "VectorEdge low-cost mode",
    provider: "VectorEdge Small",
    scope: "Finance review",
    owner: "Priya Patel",
    team: "Finance",
    readiness: 3.9,
    stage: "Paused",
    enabled: false,
    updated: "Oct 21, 2026",
  },
  {
    id: "PROV-2045",
    name: "Long context summarizer",
    provider: "Batch Summarizer Fleet",
    scope: "Internal beta",
    owner: "Theo Park",
    team: "Reliability",
    readiness: 4.5,
    stage: "Staged",
    enabled: true,
    updated: "Oct 21, 2026",
  },
  {
    id: "PROV-2046",
    name: "Agent handoff composer",
    provider: "OpenRoute Primary",
    scope: "Internal QA",
    owner: "Alex Johnson",
    team: "Engineering",
    readiness: 4.2,
    stage: "Review",
    enabled: false,
    updated: "Oct 20, 2026",
  },
  {
    id: "PROV-2047",
    name: "Batch invoice explainer",
    provider: "Northstar Claude Pool",
    scope: "Enterprise billing",
    owner: "Elijah Morgan",
    team: "Finance",
    readiness: 3.8,
    stage: "Paused",
    enabled: false,
    updated: "Oct 20, 2026",
  },
  {
    id: "PROV-2048",
    name: "Sensitive data redact pass",
    provider: "Local Guardrail Runner",
    scope: "All safety paths",
    owner: "Sana Qureshi",
    team: "Safety",
    readiness: 4.9,
    stage: "Live",
    enabled: true,
    updated: "Oct 19, 2026",
  },
  {
    id: "PROV-2049",
    name: "Retrieval reranker v2",
    provider: "VectorEdge Small",
    scope: "Canary 25%",
    owner: "Kenji Tan",
    team: "Platform",
    readiness: 4.4,
    stage: "Staged",
    enabled: true,
    updated: "Oct 19, 2026",
  },
  {
    id: "PROV-2050",
    name: "Route idle chats local",
    provider: "Local Guardrail Runner",
    scope: "Internal traffic",
    owner: "Theo Park",
    team: "Reliability",
    readiness: 4.4,
    stage: "Live",
    enabled: true,
    updated: "Oct 18, 2026",
  },
  {
    id: "PROV-2051",
    name: "High cost provider cap",
    provider: "OpenRoute Primary",
    scope: "Spend control",
    owner: "Priya Patel",
    team: "Finance",
    readiness: 4.6,
    stage: "Live",
    enabled: true,
    updated: "Oct 18, 2026",
  },
  {
    id: "PROV-2052",
    name: "Refund evidence routing",
    provider: "Northstar Claude Pool",
    scope: "Refund flows",
    owner: "Maya Perez",
    team: "Operations",
    readiness: 4.6,
    stage: "Live",
    enabled: true,
    updated: "Oct 17, 2026",
  },
  {
    id: "PROV-2053",
    name: "Tool call budget monitor",
    provider: "OpenRoute Primary",
    scope: "Canary 10%",
    owner: "Noa Kim",
    team: "Reliability",
    readiness: 4.1,
    stage: "Staged",
    enabled: true,
    updated: "Oct 17, 2026",
  },
];

export function useFluxFlagsModel() {
  return useState(flagRecords);
}

export type Segment = {
  id: string;
  name: string;
  owner: string;
  invites: number;
  reports: number;
  retained: number;
  risk: string;
  updated: string;
  cohort?: string;
  created?: number;
  dropoff?: number;
};
const segmentRecords: Segment[] = [
  {
    id: "SEG-307",
    name: "Trial workspaces over 20 seats",
    owner: "Mira Stone",
    invites: 1046,
    reports: 721,
    retained: 318,
    risk: "Low",
    updated: "Oct 23, 2026",
  },
  {
    id: "SEG-308",
    name: "Self-serve product teams",
    owner: "Leo Grant",
    invites: 812,
    reports: 564,
    retained: 246,
    risk: "Medium",
    updated: "Oct 22, 2026",
  },
  {
    id: "SEG-309",
    name: "Enterprise pilot accounts",
    owner: "Nora Vale",
    invites: 504,
    reports: 332,
    retained: 184,
    risk: "Low",
    updated: "Oct 21, 2026",
  },
  {
    id: "SEG-310",
    name: "Partner-led onboarding",
    owner: "Priya Patel",
    invites: 380,
    reports: 246,
    retained: 152,
    risk: "Medium",
    updated: "Oct 21, 2026",
  },
  {
    id: "SEG-311",
    name: "Early access cohort",
    owner: "Theo Park",
    invites: 196,
    reports: 132,
    retained: 76,
    risk: "High",
    updated: "Oct 20, 2026",
  },
];

export function useTempoReportsModel() {
  return useState(segmentRecords);
}

export const lucentServices = [
  {
    name: "Slack",
    description: "Releases, on-call alerts, and approvals in your channels.",
    connected: true,
  },
  {
    name: "Stripe",
    description: "Payment API incidents and failed webhook retries routed to on-call.",
    connected: false,
  },
  { name: "Supabase", description: "DB and auth events for live dashboards.", connected: true },
  {
    name: "Automation",
    description: "Automation runs: successes and failures in one place.",
    connected: true,
  },
  {
    name: "Zoom",
    description: "Incident bridges opened automatically when a Critical incident is declared.",
    connected: false,
  },
  { name: "Loom", description: "Async walkthroughs and feedback in one queue.", connected: true },
  {
    name: "Discord",
    description: "Status updates pushed to your community server while an incident is open.",
    connected: false,
  },
  { name: "Gemini", description: "AI for documents and content workflows.", connected: false },
  {
    name: "Spotify",
    description: "Now-playing status shared to the team's release-day channel.",
    connected: false,
  },
];

export function useLucentSecurityModel() {
  const [policies, setPolicies] = useState<Record<string, boolean>>({
    password: true,
    magic: true,
  });
  const [timeout, setTimeoutValue] = useState("4 hours");
  return { policies, setPolicies, timeout, setTimeoutValue };
}
export function useLucentIntegrationsModel() {
  const [connections, setConnections] = useState(
    Object.fromEntries(lucentServices.map((service) => [service.name, service.connected])),
  );
  const [webhooks, setWebhooks] = useState<{ name: string; url: string }[]>([]);
  return { connections, setConnections, webhooks, setWebhooks };
}
