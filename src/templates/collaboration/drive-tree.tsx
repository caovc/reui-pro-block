import { useEffect, useMemo, useState } from "react";
import { Folder } from "lucide-react";
import { useTree } from "@headless-tree/react";
import { syncDataLoaderFeature, hotkeysCoreFeature } from "@headless-tree/core";
import { Tree, TreeItem, TreeItemLabel } from "@/components/reui/tree";
import "./drive-tree.css";
import { baseNodes, type FolderNode } from "./drive-tree-data";
export function DriveFolderTree({
  view,
  onNavigate,
  folders = [],
}: {
  view: string;
  onNavigate: (name: string) => void;
  folders?: { name: string; parent: string }[];
}) {
  const nodes = useMemo(() => {
    const records = Object.fromEntries(
      Object.entries(baseNodes).map(([id, row]) => [
        id,
        { ...row, children: row.children ? [...row.children] : undefined },
      ]),
    );
    for (const folder of folders) {
      if (records[folder.name]) continue;
      records[folder.name] = { name: folder.name, children: undefined };
      const parent = records[folder.parent] || records["My Drive"];
      parent.children = [...(parent.children || []), folder.name];
    }
    return records;
  }, [folders]);
  const [expanded, setExpanded] = useState(["My Drive", "Client Deliverables"]);
  const tree = useTree<FolderNode>({
    rootItemId: "root",
    state: { expandedItems: expanded },
    setExpandedItems: setExpanded,
    initialState: { focusedItem: "My Drive" },
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => item.getItemData().children !== undefined,
    onPrimaryAction: (item) => onNavigate(item.getId()),
    dataLoader: { getItem: (id) => nodes[id], getChildren: (id) => nodes[id].children || [] },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });
  useEffect(() => {
    tree.rebuildTree();
  }, [nodes, tree]);
  return (
    <Tree tree={tree} indent={16} className="ct-free-drive-tree" aria-label="Drive folders">
      {tree.getItems().map((item) => (
        <TreeItem item={item} key={item.getId()} asChild>
          <button
            aria-label={item.getItemData().name}
            aria-current={view === item.getId() ? "page" : undefined}
          >
            <TreeItemLabel>
              <Folder size={16} />
              <span>{item.getItemData().name}</span>
            </TreeItemLabel>
          </button>
        </TreeItem>
      ))}
    </Tree>
  );
}
