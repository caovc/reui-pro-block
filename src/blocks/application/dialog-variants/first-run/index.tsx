import type { BlockProps } from "@/data/types";
import DurationDialog from "./duration";
import BulkInviteDialog from "./invites";
import CancellationDialog from "./cancellation";
import ChecklistDialog from "./checklist";
import TemplateLibraryDialog from "./library";
import "./first-run.css";

export default function RefinedDialogBlock({ block }: BlockProps) {
  switch (block.id) {
    case "dialog-1":
      return <DurationDialog />;
    case "dialog-2":
      return <BulkInviteDialog />;
    case "dialog-3":
      return <CancellationDialog />;
    case "dialog-4":
      return <ChecklistDialog />;
    case "dialog-5":
      return <TemplateLibraryDialog />;
    default:
      throw new Error(`Unsupported first-run dialog: ${block.id}`);
  }
}
