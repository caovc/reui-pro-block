import {
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  GitBranch,
  PlugZap,
  TriangleAlert,
} from "lucide-react";
import { SidebarCollection } from "@/components/reui/sidebar";
import "./flux-sidebar-quick-links.css";

const quickLinks = [
  { label: "Failures", icon: TriangleAlert, color: "text-rose-500" },
  { label: "Connections", icon: PlugZap, color: "text-sky-500" },
  { label: "Routing rules", icon: GitBranch, color: "text-violet-500" },
  { label: "Spend overview", icon: CircleDollarSign, color: "text-emerald-500" },
  { label: "Token audit", icon: ClipboardList, color: "text-amber-500" },
];

export function FluxQuickLinks({ onSelect }: { onSelect: (label: string) => void }) {
  return (
    <div className="wf-flux-quick-links">
      <SidebarCollection
        label="Quick links"
        closeOnSelect={false}
        headerTrailing={<ChevronRight />}
        onSelect={onSelect}
        rows={quickLinks.map(({ label, icon: Icon, color }) => ({
          label,
          icon: <Icon className={color} />,
          href: "#/template-preview/flux",
        }))}
      />
    </div>
  );
}
