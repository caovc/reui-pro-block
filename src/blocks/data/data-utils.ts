import { toast } from "sonner";
export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replaceAll('"', '""')}"`).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.toLowerCase().replaceAll(" ", "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported");
}
export const people = [
  "Olivia Rhye",
  "Phoenix Baker",
  "Lana Steiner",
  "Demi Wilkinson",
  "Drew Cano",
  "Natali Craig",
  "Andi Lane",
  "Orlando Diggs",
  "Kate Morrison",
  "Alex Morgan",
  "Sophie Moore",
  "James Wilson",
];
export const companies = [
  "Linear",
  "Notion",
  "Figma",
  "Vercel",
  "Stripe",
  "Slack",
  "GitHub",
  "Dropbox",
  "Intercom",
  "Loom",
  "Webflow",
  "Framer",
];
