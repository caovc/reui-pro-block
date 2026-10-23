export type TemplateCategory = "E-commerce" | "SaaS" | "Dashboard" | "Landing";
export interface TemplateMeta {
  id: string;
  name: string;
  category: TemplateCategory;
  subtitle: string;
  description: string;
  reference: string;
  family: "workflow" | "business" | "collaboration";
  features: string[];
}
export const templates: TemplateMeta[] = [
  {
    id: "mesh",
    name: "Mesh",
    category: "SaaS",
    subtitle: "Visual collaboration workspace",
    description: "A shared canvas for ideas, documents, project boards, and your next launch.",
    reference: "https://mesh-whiteboard.reui.io/",
    family: "workflow",
    features: ["Whiteboard", "Documents", "Project board"],
  },
  {
    id: "flowly",
    name: "Flowly",
    category: "Dashboard",
    subtitle: "Workflow automation",
    description: "Build connected workflows, manage AI agents, and follow every automation run.",
    reference: "https://flowly-app.reui.io/",
    family: "workflow",
    features: ["Workflow canvas", "AI agents", "Run dashboard"],
  },
  {
    id: "echo",
    name: "Echo",
    category: "SaaS",
    subtitle: "AI chat workspace",
    description: "A focused place for conversations, project context, and reusable artifacts.",
    reference: "https://echo-chat.reui.io/",
    family: "workflow",
    features: ["Conversations", "Projects", "Artifacts"],
  },
  {
    id: "verve",
    name: "Verve",
    category: "SaaS",
    subtitle: "Sales CRM",
    description: "Follow your pipeline from first contact through deals, companies, and revenue.",
    reference: "https://verve-crm.reui.io/",
    family: "business",
    features: ["Deal pipeline", "Contacts", "Reports"],
  },
  {
    id: "limelight",
    name: "Limelight",
    category: "Landing",
    subtitle: "SaaS marketing site",
    description:
      "A dark product landing page with a live console, product tour, pricing, and contact.",
    reference: "https://limelight-landing.reui.io/",
    family: "collaboration",
    features: ["Product tour", "Pricing", "Contact"],
  },
  {
    id: "manifest",
    name: "Manifest",
    category: "E-commerce",
    subtitle: "Commerce administration",
    description:
      "Keep orders, products, customers, and inventory together in a commerce workspace.",
    reference: "https://manifest-commerce.reui.io/",
    family: "business",
    features: ["Orders", "Catalog", "Inventory"],
  },
  {
    id: "lucent",
    name: "Lucent",
    category: "Dashboard",
    subtitle: "DevOps console",
    description:
      "Track releases, deployments, incidents, and the health of your delivery pipeline.",
    reference: "https://lucent-devops.reui.io/",
    family: "workflow",
    features: ["Deployments", "Incidents", "Release board"],
  },
  {
    id: "overture",
    name: "Overture",
    category: "Landing",
    subtitle: "Product waitlist",
    description:
      "A pre-launch invitation framed by a wall of product screens and a working signup flow.",
    reference: "https://overture-waitlist.reui.io/",
    family: "collaboration",
    features: ["Waitlist", "Product wallpaper", "Email signup"],
  },
  {
    id: "atlas",
    name: "Atlas",
    category: "Dashboard",
    subtitle: "Admin dashboard",
    description:
      "Manage users, products, access, billing, and business reporting from one dashboard.",
    reference: "https://atlas-admin.reui.io/",
    family: "business",
    features: ["Overview", "Users", "Billing"],
  },
  {
    id: "tempo",
    name: "Tempo",
    category: "Dashboard",
    subtitle: "Task management",
    description:
      "Plan work across a task board, timeline, and calendar with a shared project context.",
    reference: "https://tempo-tasks.reui.io/",
    family: "workflow",
    features: ["Kanban", "Timeline", "Calendar"],
  },
  {
    id: "miro",
    name: "Miro",
    category: "SaaS",
    subtitle: "Dental practice management",
    description:
      "A clinic workspace for appointments, patient records, treatment, and the daily diary.",
    reference: "https://miro-clinic.reui.io/",
    family: "business",
    features: ["Chair board", "Patients", "Appointments"],
  },
  {
    id: "cohort",
    name: "Cohort",
    category: "SaaS",
    subtitle: "People management",
    description: "Bring people, leave, hiring, and approvals into a single HR workspace.",
    reference: "https://cohort-hr.reui.io/",
    family: "business",
    features: ["Directory", "Time off", "Hiring"],
  },
  {
    id: "filespace",
    name: "Filespace",
    category: "SaaS",
    subtitle: "Cloud storage",
    description: "Browse folders, organize shared files, and find the documents that matter.",
    reference: "https://filespace-drive.reui.io/",
    family: "collaboration",
    features: ["Files", "Favorites", "Sharing"],
  },
  {
    id: "roster",
    name: "Roster",
    category: "SaaS",
    subtitle: "People operations",
    description: "A people-first workspace for your team directory, leave calendar, and approvals.",
    reference: "https://roster-hr.reui.io/",
    family: "collaboration",
    features: ["Calendar", "People", "Time off"],
  },
  {
    id: "pulse",
    name: "Pulse",
    category: "SaaS",
    subtitle: "Help desk",
    description: "Keep support moving with a ticket queue, service metrics, and customer context.",
    reference: "https://pulse-helpdesk.reui.io/",
    family: "collaboration",
    features: ["Tickets", "Support analytics", "Contacts"],
  },
  {
    id: "surge",
    name: "Surge",
    category: "E-commerce",
    subtitle: "Commerce workspace",
    description:
      "Monitor store performance and manage products, orders, and customer relationships.",
    reference: "https://surge-commerce.reui.io/",
    family: "business",
    features: ["Orders", "Products", "Analytics"],
  },
  {
    id: "filebox",
    name: "Filebox",
    category: "SaaS",
    subtitle: "Shared cloud drive",
    description:
      "A file explorer with folders, upload, sharing, and a dedicated account experience.",
    reference: "https://filebox-drive.reui.io/",
    family: "collaboration",
    features: ["Explorer", "Uploads", "Account"],
  },
  {
    id: "flux",
    name: "Flux",
    category: "Dashboard",
    subtitle: "AI agent operations",
    description: "Inspect agent runs, review approvals, and understand model usage and cost.",
    reference: "https://flux-agentops.reui.io/",
    family: "workflow",
    features: ["Run queue", "Approvals", "Usage"],
  },
];
export const templateCategories = [
  "All Templates",
  "E-commerce",
  "SaaS",
  "Dashboard",
  "Landing",
] as const;
