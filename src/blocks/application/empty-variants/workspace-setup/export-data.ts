import { endOfDay, format, isWithinInterval, startOfDay, startOfQuarter, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";

export const audienceOptions = ["Everyone", "Ops leads", "Finance reviewers", "Client owners"];
export const workspaceOptions = ["All workspaces", "Harbor field", "Market lab", "Support desk"];
export const rangeOptions = ["Last 30 days", "This quarter", "Previous cycle", "Custom window"];
export type ExportFilters = { audience: string; workspace: string; range: string };
export type ActivityRow = {
  name: string;
  audience: string;
  workspace: string;
  activity: string;
  date: Date;
  minutes: number;
};

export function sampleActivity(anchor: Date): ActivityRow[] {
  return [
    {
      name: "Olivia Rhye",
      audience: "Ops leads",
      workspace: "Harbor field",
      activity: "Milestone review",
      date: subDays(anchor, 2),
      minutes: 45,
    },
    {
      name: "Lana Steiner",
      audience: "Finance reviewers",
      workspace: "Harbor field",
      activity: "Billing approval",
      date: subDays(anchor, 9),
      minutes: 30,
    },
    {
      name: "Phoenix Baker",
      audience: "Client owners",
      workspace: "Support desk",
      activity: "Client handoff",
      date: subDays(anchor, 12),
      minutes: 60,
    },
    {
      name: "Ari Lane",
      audience: "Ops leads",
      workspace: "Market lab",
      activity: "Planning session",
      date: subDays(anchor, 45),
      minutes: 50,
    },
    {
      name: "Mila Stone",
      audience: "Finance reviewers",
      workspace: "Support desk",
      activity: "Quarter review",
      date: subDays(anchor, 70),
      minutes: 40,
    },
  ];
}

export function activityForFilters(
  rows: ActivityRow[],
  filters: ExportFilters,
  anchor: Date,
  custom?: DateRange,
) {
  let from = subDays(startOfDay(anchor), 29);
  let to = endOfDay(anchor);
  if (filters.range === "This quarter") from = startOfQuarter(anchor);
  if (filters.range === "Previous cycle") {
    from = subDays(startOfDay(anchor), 59);
    to = endOfDay(subDays(anchor, 30));
  }
  if (filters.range === "Custom window" && custom?.from) {
    from = startOfDay(custom.from);
    to = endOfDay(custom.to ?? custom.from);
  }
  return rows.filter(
    (row) =>
      (filters.audience === "Everyone" || row.audience === filters.audience) &&
      (filters.workspace === "All workspaces" || row.workspace === filters.workspace) &&
      isWithinInterval(row.date, { start: from, end: to }),
  );
}

export function activityCSV(rows: ActivityRow[]) {
  const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [
    ["Name", "Audience", "Workspace", "Activity", "Date", "Minutes"],
    ...rows.map((row) => [
      row.name,
      row.audience,
      row.workspace,
      row.activity,
      format(row.date, "yyyy-MM-dd"),
      row.minutes,
    ]),
  ]
    .map((row) => row.map(quote).join(","))
    .join("\r\n");
}

export function printableBrief(rows: ActivityRow[], filters: ExportFilters) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  const escape = (value: string | number) =>
    String(value).replace(/[&<>"']/g, (character) => entities[character]);
  const bodyRows = rows
    .map(
      (row) => `
    <tr>
      <td>${escape(row.name)}</td>
      <td>${escape(row.activity)}</td>
      <td>${escape(row.workspace)}</td>
      <td>${escape(row.minutes)}</td>
    </tr>
  `,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Local activity brief</title>
  <style>
    body { font: 15px/1.6 system-ui; margin: 40px; color: #202124; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    p { color: #666; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Local activity brief</h1>
  <p>${escape(filters.audience)} · ${escape(filters.workspace)} · ${escape(filters.range)}</p>
  <p>Sample records only. Use your browser Print / Save as PDF to save this brief.</p>
  <table>
    <thead>
      <tr><th>Name</th><th>Activity</th><th>Workspace</th><th>Minutes</th></tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;
}
