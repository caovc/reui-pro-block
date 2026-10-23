export type Resource = {
  id: string;
  name: string;
  parent?: string;
  group?: boolean;
  depth?: number;
  role?: string;
  status?: string;
  due?: string;
  assignees?: string[];
  capacity?: number;
  meta?: string;
  load?: number;
  slack?: string;
};
export type Bar = {
  id: string;
  row: string;
  title: string;
  start: number;
  end: number;
  progress: number;
  status: string;
  color: string;
  load?: number;
  company?: string;
  stage?: string;
  priority?: string;
  dependency?: string;
  dependencies?: string[];
  locked?: boolean;
  note?: string;
  address?: string;
  jobType?: string;
  day?: number;
  collaborators?: string[];
  unscheduled?: boolean;
};
export const colors = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#2dd4bf",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#ec4899",
  "#fb923c",
];
const r = (id: string, name: string, parent?: string, extra: Partial<Resource> = {}): Resource => ({
  id,
  name,
  parent,
  ...extra,
});
const b = (
  id: string,
  row: string,
  title: string,
  start: number,
  end: number,
  extra: Partial<Bar> = {},
): Bar => ({
  id,
  row,
  title,
  start,
  end,
  progress: 0,
  status: "To Do",
  color: colors[0],
  ...extra,
});
export function ganttSeed(v: number): { rows: Resource[]; bars: Bar[] } {
  if (v === 0) {
    const rows = [
      r("bugs", "Bug Tracking", undefined, { group: true }),
      r("login", "Login redirect", "bugs", {
        status: "Done",
        due: "Jul 14",
        assignees: ["IM", "TL"],
      }),
      r("access", "Access rules", "bugs", {
        status: "In Progress",
        due: "Jul 19",
        assignees: ["TL"],
      }),
      r("mobile", "Mobile crash", "bugs", {
        group: true,
        depth: 1,
        status: "In Progress",
        assignees: ["IM", "TL", "HB"],
      }),
      r("ios", "iOS audit", "mobile", {
        status: "In Progress",
        due: "Jul 20",
        assignees: ["HB"],
        depth: 2,
      }),
      r("android", "Android audit", "mobile", {
        status: "To Do",
        due: "Jul 25",
        depth: 2,
      }),
      r("button", "Button truncation", "bugs", {
        status: "In Review",
        due: "Jul 14",
        assignees: ["DC"],
      }),
      r("offline", "Offline sync", "bugs", {
        status: "To Do",
        due: "Jul 27",
        assignees: ["TL", "HB"],
      }),
      r("api", "API key rotation", "bugs", {
        status: "Done",
        due: "Jul 14",
        assignees: ["HB"],
      }),
      r("session", "Session replay", "bugs", { status: "To Do" }),
      r("release", "Release 2.4", undefined, { group: true }),
      r("export", "Data export", "release", {
        status: "In Progress",
        due: "Jul 22",
        assignees: ["DC", "IM"],
      }),
      r("validation", "Form validation", "release", {
        status: "To Do",
        due: "Jul 27",
        assignees: ["IM"],
      }),
      r("nav", "Nav focus", "release", {
        status: "To Do",
        due: "Jul 28",
        assignees: [],
      }),
      r("perf", "Perf audit", "release", {
        status: "In Review",
        due: "Jul 22",
        assignees: ["TL"],
      }),
      r("changelog", "Changelog", "release", { status: "To Do", due: "Aug 4" }),
      r("notes", "Release notes", "release", { status: "To Do" }),
    ];
    const bars = [
      b("login", "login", "Login redirect", 10, 14, {
        progress: 100,
        status: "Done",
      }),
      b("access", "access", "Access rules", 14, 19, {
        progress: 45,
        status: "In Progress",
        color: colors[1],
        dependency: "login",
      }),
      b("ios", "ios", "iOS audit", 16, 20, {
        progress: 60,
        status: "In Progress",
        color: colors[2],
      }),
      b("android", "android", "Android audit", 20, 25, {
        dependency: "ios",
        color: colors[3],
      }),
      b("button", "button", "Button truncation", 12, 14, {
        progress: 70,
        status: "In Review",
        color: colors[4],
      }),
      b("offline", "offline", "Offline sync", 21, 27, {
        progress: 20,
        color: colors[5],
      }),
      b("api", "api", "API key rotation", 11, 14, {
        progress: 100,
        status: "Done",
        color: colors[6],
      }),
      b("export", "export", "Data export", 18, 22, {
        progress: 55,
        status: "In Progress",
      }),
      b("validation", "validation", "Form validation", 22, 27, {
        progress: 10,
        dependency: "export",
        color: colors[7],
      }),
      b("nav", "nav", "Nav focus", 24, 28, { color: colors[8] }),
      b("perf", "perf", "Perf audit", 19, 22, {
        progress: 50,
        status: "In Review",
        color: colors[6],
        locked: true,
      }),
      b("changelog", "changelog", "Changelog", 31, 35, {
        dependency: "perf",
        color: colors[1],
      }),
    ];
    return { rows, bars };
  }
  if (v === 1) {
    const rows = [
      r("north", "North Crew", undefined, { group: true, meta: "Zone 1" }),
      r("mira", "Mira Stone", "north", {
        role: "HVAC Lead",
        meta: "8am to 5pm",
      }),
      r("alex", "Alex Johnson", "north", { meta: "8am to 5pm" }),
      r("sarah", "Sarah Chen", "north", {
        role: "Plumbing",
        meta: "8am to 5pm",
      }),
      r("south", "South Crew", undefined, { group: true, meta: "Zone 4" }),
      r("leo", "Leo Grant", "south", { role: "HVAC", meta: "9am to 6pm" }),
      r("sofia", "Sofia Romero", "south", {
        role: "Electrical",
        meta: "8am to 5pm",
      }),
      r("theo", "Theo Park", "south", { meta: "8am to 5pm" }),
      r("jonas", "Jonas Beck", "south", {
        role: "Apprentice",
        meta: "10am to 3pm",
      }),
    ];
    const jobs: [string, string, number, number, number, number][] = [
      ["mira", "Harbor Dental", 480, 600, 0, 100],
      ["mira", "Lakeside Deli", 600, 690, 4, 100],
      ["mira", "Rowan Apartments", 780, 900, 2, 0],
      ["mira", "Cedar Clinic", 900, 1020, 4, 0],
      ["alex", "Fenwick Bakery", 510, 600, 4, 100],
      ["alex", "Halsey Court", 540, 630, 6, 100],
      ["alex", "Ridgeway School", 600, 720, 0, 75],
      ["alex", "Ash Street Lofts", 810, 960, 2, 0],
      ["sarah", "Copper Kettle", 480, 570, 4, 100],
      ["sarah", "Nia Okafor", 570, 660, 4, 100],
      ["sarah", "Marlow Gym", 660, 750, 0, 33],
      ["sarah", "Bay View Hotel", 840, 1020, 2, 0],
      ["leo", "Alder Offices", 540, 660, 0, 100],
      ["leo", "Priya Raman", 660, 780, 4, 25],
      ["leo", "Stonebridge Mall", 870, 990, 2, 0],
      ["sofia", "Grant Medical", 480, 660, 6, 100],
      ["sofia", "Bramble Cafe", 720, 840, 4, 0],
      ["sofia", "Olive Court", 840, 930, 2, 0],
      ["theo", "Sunset Laundry", 510, 570, 4, 100],
      ["theo", "Kwan Residence", 600, 690, 0, 100],
      ["theo", "Ivy Lane Cafe", 630, 690, 4, 100],
      ["theo", "Dunmore Court", 660, 750, 2, 33],
      ["theo", "Ferry Road Diner", 780, 870, 4, 0],
      ["theo", "Northgate Flats", 900, 1020, 2, 0],
      ["jonas", "Willow Terrace", 600, 720, 2, 75],
      ["jonas", "Ambrose Hardware", 780, 900, 4, 0],
    ];
    return {
      rows,
      bars: jobs.map(([row, title, start, end, c, progress], i) =>
        b(`job-${i}`, row, title, start, end, {
          color: colors[c],
          progress,
          status: progress === 100 ? "Complete" : progress ? "In progress" : "Scheduled",
          jobType: c === 0 ? "Install" : c === 4 ? "Repair" : c === 6 ? "Emergency" : "Inspection",
          day: 0,
          address: "418 Wells St",
          note: "",
        }),
      ),
    };
  }
  if (v === 2) {
    const rows = [
      r("refund", "Refund Escalation", undefined, {
        group: true,
        meta: "PB-31",
        status: "Failed",
        slack: "0m",
      }),
      r("intake", "Intake & Classify", "refund", {
        status: "Succeeded",
        slack: "0m",
      }),
      r("policy", "Policy Check", "refund", {
        status: "Succeeded",
        slack: "0m",
      }),
      r("approval", "Finance Approval", "refund", {
        status: "Succeeded",
        slack: "0m",
        meta: "Gate",
      }),
      r("capture", "Capture Refund", "refund", {
        status: "Failed",
        slack: "0m",
      }),
      r("notify", "Notify Customer", "refund", {
        status: "Queued",
        slack: "Blocked",
      }),
      r("contract", "Contract Ingest", undefined, {
        group: true,
        meta: "PB-44",
        status: "Running",
        slack: "30m",
      }),
      r("fetch", "Fetch Documents", "contract", {
        status: "Succeeded",
        slack: "30m",
      }),
      r("parse", "Parse Batch", "contract", {
        status: "Running",
        slack: "30m",
      }),
      r("summarize", "Summarize", "contract", {
        status: "Queued",
        slack: "30m",
      }),
      r("risk", "Risk Review", "contract", {
        status: "Queued",
        slack: "30m",
        meta: "Gate",
      }),
      r("sweep", "Data Steward Sweep", undefined, {
        group: true,
        meta: "PB-19",
        status: "Waiting",
        slack: "3h",
      }),
      r("snapshot", "Snapshot", "sweep", { status: "Succeeded", slack: "6h" }),
      r("dedupe", "Dedupe & Enrich", "sweep", {
        status: "Succeeded",
        slack: "6h",
      }),
      r("purge", "Purge Stale", "sweep", { status: "Waiting", slack: "Fixed" }),
      r("reindex", "Reindex", "sweep", { status: "Queued", slack: "3h" }),
      r("evaluation", "Nightly Evaluation", undefined, {
        group: true,
        meta: "PB-52",
        status: "Succeeded",
        slack: "3h 15m",
      }),
    ];
    const specs: [string, number, number, string, string?, string?][] = [
      ["intake", 480, 520, "Succeeded"],
      ["policy", 520, 540, "Succeeded", "intake"],
      ["approval", 585, 630, "Succeeded", "policy"],
      ["approval", 540, 585, "Failed", "policy"],
      ["capture", 650, 680, "Failed", "approval"],
      ["capture", 640, 670, "Failed", "approval"],
      ["capture", 630, 660, "Failed", "approval"],
      ["notify", 680, 720, "Queued", "capture"],
      ["fetch", 540, 570, "Succeeded"],
      ["parse", 570, 695, "Running", "fetch", "Shard 3 of 3"],
      ["parse", 570, 650, "Succeeded", "fetch"],
      ["parse", 570, 630, "Succeeded", "fetch"],
      ["summarize", 695, 750, "Queued", "parse"],
      ["risk", 750, 810, "Queued", "summarize"],
      ["snapshot", 450, 495, "Succeeded"],
      ["dedupe", 495, 660, "Succeeded", "snapshot"],
      ["purge", 840, 930, "Waiting", "dedupe"],
      ["reindex", 930, 1020, "Queued", "purge"],
    ];
    return {
      rows,
      bars: specs.map(([row, start, end, status, dependency, note], i) =>
        b(`${row}-${i}`, row, rows.find((r) => r.id === row)!.name, start, end, {
          status,
          dependency: dependency
            ? `${dependency}-${specs.findIndex((s) => s[0] === dependency)}`
            : undefined,
          progress:
            status === "Succeeded"
              ? 100
              : status === "Running"
                ? 88
                : status === "Failed"
                  ? 100
                  : 0,
          color:
            status === "Failed"
              ? "#f43f5e"
              : status === "Running"
                ? "#0ea5e9"
                : status === "Succeeded"
                  ? "#10b981"
                  : status === "Waiting"
                    ? "#f59e0b"
                    : "#a1a1aa",
          locked: row === "purge",
          note,
        }),
      ),
    };
  }
  const rows = [
    r("experience", "Experience", undefined, {
      group: true,
      meta: "Lead Mira Stone",
      load: 220,
      capacity: 280,
    }),
    r("mira", "Mira Stone", "experience", {
      role: "Design Lead",
      load: 60,
      capacity: 100,
    }),
    r("nora", "Nora Vale", "experience", {
      role: "Product Designer",
      load: 70,
      capacity: 100,
    }),
    r("theo", "Theo Park", "experience", {
      role: "Frontend Engineer",
      load: 90,
      capacity: 80,
    }),
    r("platform", "Platform", undefined, {
      group: true,
      meta: "Lead Leo Grant",
      load: 190,
      capacity: 260,
    }),
    r("leo", "Leo Grant", "platform", {
      role: "Staff Engineer",
      load: 50,
      capacity: 100,
    }),
    r("alex", "Alex Johnson", "platform", {
      role: "Backend Engineer",
      load: 80,
      capacity: 100,
    }),
    r("priya", "Priya Patel", "platform", {
      role: "Platform Engineer",
      load: 60,
      capacity: 60,
    }),
    r("insights", "Insights", undefined, {
      group: true,
      meta: "Lead Sana Qureshi",
      load: 110,
      capacity: 180,
    }),
    r("sana", "Sana Qureshi", "insights", {
      role: "Research Lead",
      load: 60,
      capacity: 100,
    }),
    r("devin", "Devin Okoye", "insights", {
      role: "Data Analyst",
      load: 50,
      capacity: 80,
    }),
  ];
  const specs: [string, string, number, number, string, string, string, number, number][] = [
    ["mira", "Checkout Audit", 2, 7, "Northwind Retail", "Discovery", "High", 60, 1],
    ["mira", "Design System", 7, 12, "Internal", "Design", "Medium", 40, 1],
    ["nora", "Onboarding Flow", 3, 10, "Kestrel Health", "Design", "High", 70, 0],
    ["theo", "Billing Rewrite", 2, 13, "Kestrel Health", "Build", "High", 70, 6],
    ["theo", "Launch Review", 10, 14, "Northwind Retail", "Launch", "Low", 20, 4],
    ["leo", "Search Rollout", 5, 12, "Northwind Retail", "Launch", "Medium", 50, 4],
    ["leo", "Event Pipeline", 12, 17, "Meridian Logistics", "Build", "Low", 40, 5],
    ["alex", "Ledger Sync", 2, 9, "Meridian Logistics", "Build", "Medium", 80, 5],
    ["priya", "Cache Tuning", 3, 6, "Internal", "Build", "Low", 60, 4],
    ["sana", "Pricing Study", 4, 12, "Northwind Retail", "Discovery", "High", 60, 1],
    ["devin", "Churn Model", 6, 14, "Kestrel Health", "Discovery", "Medium", 50, 1],
  ];
  return {
    rows,
    bars: specs.map(([row, title, start, end, company, stage, priority, load, c], i) =>
      b(`booking-${i}`, row, title, start, end, {
        company,
        stage,
        priority,
        load,
        color: title === "Cache Tuning" ? "#a1a1aa" : colors[c],
        status:
          title === "Cache Tuning"
            ? "Complete"
            : ["Launch Review", "Event Pipeline", "Churn Model"].includes(title)
              ? "Tentative"
              : "Confirmed",
      }),
    ),
  };
}
