import { useState } from "react";
import { firstRule, type FilterRule } from "@/blocks/data/grid-filter-controls";
import type { ExpandedState } from "@/blocks/data/grid-advanced-model-grid";

export type AgentReport = {
  id: string;
  agent: string;
  queue: string;
  team: string;
  lead: string;
  status: string;
  priority: string;
  july: number;
  august: number;
  delta: string;
  breaches: string;
  coached: string;
  note?: [string, string];
};
export const agentReports: AgentReport[] = [
  {
    id: "sarah",
    agent: "Sarah Chen",
    queue: "Onboarding",
    team: "Tier 1",
    lead: "Mira Stone",
    status: "Improving",
    priority: "Low",
    july: 91.2,
    august: 93.5,
    delta: "+2.3",
    breaches: "7/108",
    coached: "None",
    note: [
      "Best month since joining",
      "Resolution improved while Sarah handled a larger queue. Review the workflow changes with Tier 1 and share the practices that helped.",
    ],
  },
  {
    id: "david",
    agent: "David Kim",
    queue: "Technical",
    team: "Technical",
    lead: "Leo Grant",
    status: "Uneven",
    priority: "Medium",
    july: 94,
    august: 93.1,
    delta: "Uneven",
    breaches: "7/102",
    coached: "Aug 02",
    note: [
      "Two bad weeks inside a good month",
      "The monthly average conceals two weaker weeks. Check the shifts covering Tier 2 and discuss coverage before changing individual targets.",
    ],
  },
  {
    id: "priya",
    agent: "Priya Patel",
    queue: "Billing",
    team: "Billing",
    lead: "Mira Stone",
    status: "Slipping",
    priority: "High",
    july: 93.8,
    august: 89.6,
    delta: "-4.2",
    breaches: "10/96",
    coached: "Aug 06",
    note: [
      "Refund approvals are the whole gap",
      "Most breaches waited for another refund approval. Review the approval handoff with Billing so process delays are addressed alongside the scorecard.",
    ],
  },
  {
    id: "diego",
    agent: "Diego Ramos",
    queue: "Onboarding",
    team: "Tier 1",
    lead: "Sarah Chen",
    status: "Improving",
    priority: "Low",
    july: 88.4,
    august: 91.1,
    delta: "+2.7",
    breaches: "8/90",
    coached: "None",
  },
  {
    id: "sana",
    agent: "Sana Qureshi",
    queue: "Technical",
    team: "Technical",
    lead: "Leo Grant",
    status: "Improving",
    priority: "Low",
    july: 90.6,
    august: 91.7,
    delta: "+1.1",
    breaches: "8/96",
    coached: "None",
  },
  {
    id: "michael",
    agent: "Michael Rodriguez",
    queue: "Onboarding",
    team: "Onboarding",
    lead: "Sarah Chen",
    status: "Slipping",
    priority: "High",
    july: 91.9,
    august: 87.8,
    delta: "-4.1",
    breaches: "11/90",
    coached: "Aug 11",
    note: [
      "Migration windows are eating the month",
      "Breaches align with migration shifts. Schedule queue coverage separately from migration work, then review whether response times recover.",
    ],
  },
  {
    id: "jamal",
    agent: "Jamal Reid",
    queue: "Account",
    team: "Tier 2",
    lead: "Leo Grant",
    status: "Slipping",
    priority: "Critical",
    july: 87.1,
    august: 84.6,
    delta: "-2.5",
    breaches: "12/78",
    coached: "Jul 28",
  },
  {
    id: "leo",
    agent: "Leo Grant",
    queue: "Technical",
    team: "Tier 2",
    lead: "Mira Stone",
    status: "Steady",
    priority: "None",
    july: 93.4,
    august: 93.9,
    delta: "+0.5",
    breaches: "4/66",
    coached: "None",
  },
  {
    id: "peter",
    agent: "Peter Novak",
    queue: "Billing",
    team: "Quality",
    lead: "Mira Stone",
    status: "Steady",
    priority: "None",
    july: 94.6,
    august: 94.8,
    delta: "+0.2",
    breaches: "3/58",
    coached: "None",
  },
  {
    id: "nora",
    agent: "Nora Vale",
    queue: "Account",
    team: "Knowledge Base",
    lead: "Peter Novak",
    status: "Uneven",
    priority: "Medium",
    july: 92.8,
    august: 90.4,
    delta: "Uneven",
    breaches: "5/52",
    coached: "Jul 30",
  },
];

export function usePulseReportState() {
  const [coaching, setCoaching] = useState(false);
  const [rules, setRules] = useState<FilterRule[]>([firstRule("agent")]);
  const [expanded, setExpanded] = useState<ExpandedState>({
    sarah: true,
    david: true,
    priya: true,
    michael: true,
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
  return {
    coaching,
    setCoaching,
    rules,
    setRules,
    expanded,
    setExpanded,
    pagination,
    setPagination,
  };
}
export type PulseReportState = ReturnType<typeof usePulseReportState>;
