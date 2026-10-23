import { addDays, endOfMonth, nextFriday } from "date-fns";
export const projectTemplates = [
  {
    id: "bug",
    label: "Bug Report",
    description: "Triage defects with owner and severity.",
    name: "Billing Event Cleanup",
    key: "BEC",
    summary: "Audit subscription event mapping before the partner beta opens to billing admins.",
    status: "Planned",
    priority: "High",
  },
  {
    id: "feature",
    label: "Feature Request",
    description: "Shape a request into scoped delivery.",
    name: "Invoice Export Builder",
    key: "IEB",
    summary: "Create a guided export flow for finance teams that need clean invoice bundles.",
    status: "Backlog",
    priority: "Medium",
  },
  {
    id: "chore",
    label: "Chore",
    description: "Track maintenance without extra ceremony.",
    name: "Workspace Cleanup",
    key: "WCL",
    summary: "Remove stale workspace fields and align project defaults before the next release.",
    status: "In Progress",
    priority: "Low",
  },
];
export const projectDateOptions = ["Tomorrow", "Next Friday", "End of month"];
export function resolveProjectDate(value: string, reference: Date) {
  if (value === "Tomorrow") return addDays(reference, 1);
  if (value === "End of month") return endOfMonth(reference);
  return nextFriday(reference);
}
