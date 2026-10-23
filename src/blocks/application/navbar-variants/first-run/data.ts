export const projectTabs = [
  { value: "overview", label: "Overview" },
  { value: "tasks", label: "Tasks", count: 24 },
  { value: "files", label: "Files" },
  { value: "activity", label: "Activity" },
  { value: "settings", label: "Settings" },
] as const;
export const collaborators = [
  "Maya Stone",
  "Leo Grant",
  "Nora Chen",
  "Eli Morgan",
  "Ava Reed",
  "Noah Brooks",
  "Mila Hayes",
  "Liam Park",
  "Sofia Lane",
  "Owen Cole",
  "Isla Quinn",
  "Theo Blake",
];
export const workspaceRecords = [
  { name: "Design system", status: "Active", date: "2026-10-20" },
  { name: "Mobile application", status: "Active", date: "2026-10-22" },
  { name: "Website refresh", status: "Archived", date: "2026-09-12" },
];
export const filterOptions = ["All", "Active", "Archived"] as const;
export const sortOptions = ["Date", "Name", "Status"] as const;
