export type FolderNode = { name: string; children?: string[] };
export const baseNodes: Record<string, FolderNode> = {
  root: { name: "Drive", children: ["My Drive"] },
  "My Drive": {
    name: "My Drive",
    children: [
      "Client Deliverables",
      "Brand Library",
      "Spring Campaign",
      "Studio Operations",
      "Product Design",
      "Samples",
    ],
  },
  "Client Deliverables": {
    name: "Client Deliverables",
    children: ["Northwind Rebrand", "Harbor Coffee"],
  },
  "Northwind Rebrand": { name: "Northwind Rebrand" },
  "Harbor Coffee": { name: "Harbor Coffee" },
  "Brand Library": { name: "Brand Library", children: [] },
  "Spring Campaign": { name: "Spring Campaign", children: [] },
  "Studio Operations": { name: "Studio Operations" },
  "Product Design": { name: "Product Design", children: [] },
  Samples: { name: "Samples" },
};
/** Read-only references to the existing tree namespace; no parallel folder model. */
export function getDriveTreeFolders() {
  return Object.entries(baseNodes)
    .filter(([id]) => id !== "root" && id !== "My Drive")
    .map(([id, node]) => ({ id, name: node.name }));
}
