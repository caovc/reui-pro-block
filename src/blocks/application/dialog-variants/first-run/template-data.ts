import {
  BriefcaseBusiness,
  Headphones,
  LayoutGrid,
  Link2,
  Rocket,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

export const templateCategories = [
  {
    id: "all",
    name: "All templates",
    description: "Every starter flow",
    icon: LayoutGrid,
    tone: "info",
  },
  {
    id: "launch",
    name: "Launch ops",
    description: "Releases and rollouts",
    icon: Rocket,
    tone: "destructive",
  },
  {
    id: "delivery",
    name: "Client delivery",
    description: "Projects and approvals",
    icon: BriefcaseBusiness,
    tone: "warning",
  },
  {
    id: "revenue",
    name: "Revenue rhythm",
    description: "Pipeline and forecasting",
    icon: TrendingUp,
    tone: "success",
  },
  {
    id: "research",
    name: "Research loops",
    description: "Interviews and synthesis",
    icon: Search,
    tone: "info",
  },
  {
    id: "people",
    name: "People programs",
    description: "Hiring and onboarding",
    icon: Users,
    tone: "warning",
  },
  {
    id: "support",
    name: "Support systems",
    description: "Queues and handoffs",
    icon: Headphones,
    tone: "info",
  },
  {
    id: "partners",
    name: "Partner motion",
    description: "Enablement and co-sell",
    icon: Link2,
    tone: "info",
  },
];
export const templateRecords = [
  {
    id: "release",
    category: "launch",
    name: "Release radar",
    description:
      "Track launch readiness, blockers, and final sign-off across one weekly control room.",
    team: "Product teams",
    tags: ["Launch", "Weekly", "Approvals"],
  },
  {
    id: "client",
    category: "delivery",
    name: "Client pulse board",
    description: "Keep active engagements aligned with milestones, owners, and risk check-ins.",
    team: "Service teams",
    tags: ["Delivery", "Milestones", "Risk"],
  },
  {
    id: "forecast",
    category: "revenue",
    name: "Forecast bridge",
    description:
      "Review commit movement, late-stage changes, and coverage gaps before the number locks.",
    team: "Revenue leaders",
    tags: ["Forecast", "Pipeline", "Exec"],
  },
  {
    id: "interview",
    category: "research",
    name: "Interview signal hub",
    description:
      "Collect interview notes, confidence markers, and synthesis themes in one review lane.",
    team: "Research squads",
    tags: ["Research", "Notes", "Themes"],
  },
  {
    id: "first30",
    category: "people",
    name: "First 30 plan",
    description: "Guide new hires through setup, shadowing, and early outcome checkpoints.",
    team: "People teams",
    tags: ["Onboarding", "Tasks", "Manager"],
  },
  {
    id: "escalation",
    category: "support",
    name: "Escalation watch",
    description:
      "Surface hot customer issues, next actions, and cross-functional handoffs in one place.",
    team: "Support leads",
    tags: ["Support", "Urgent", "Handoff"],
  },
  {
    id: "partner",
    category: "partners",
    name: "Partner sprint room",
    description:
      "Coordinate shared launches, enablement tasks, and materials reviews with external partners.",
    team: "Partnership teams",
    tags: ["Partners", "Assets", "Review"],
  },
];
export type StarterTemplate = (typeof templateRecords)[number];
