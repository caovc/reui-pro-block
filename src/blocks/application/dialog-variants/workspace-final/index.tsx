import type { BlockProps } from "@/data/types";
import FinanceAccountDialog from "./finance";
import QuickEntryDialog from "./entry";
import ProjectTemplatesDialog from "./templates";
import ConnectionConsentDialog from "./consent";
import DuplicateContactDialog from "./duplicates";
import "../first-run/first-run.css";
import "./final.css";
export default function FinalWorkspaceDialogBlock({ block }: BlockProps) {
  switch (block.id) {
    case "dialog-11":
      return <FinanceAccountDialog />;
    case "dialog-12":
      return <QuickEntryDialog />;
    case "dialog-13":
      return <ProjectTemplatesDialog />;
    case "dialog-14":
      return <ConnectionConsentDialog />;
    case "dialog-16":
      return <DuplicateContactDialog />;
    default:
      throw new Error(`Unsupported final dialog: ${block.id}`);
  }
}
