import type { BlockProps } from "@/data/types";
import AdminCommandNavbar from "./admin";
import WorkflowEditorNavbar from "./workflow";
import AnalyticsToolbarNavbar from "./analytics";
export default function ToolbarNavbarBlock({ block }: BlockProps) {
  switch (block.id) {
    case "navbar-4":
      return <AdminCommandNavbar />;
    case "navbar-5":
      return <WorkflowEditorNavbar />;
    case "navbar-6":
      return <AnalyticsToolbarNavbar />;
    default:
      throw new Error(`Toolbar navbar batch does not implement ${block.id}`);
  }
}
