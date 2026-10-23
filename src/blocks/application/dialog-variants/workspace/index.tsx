import type { BlockProps } from "@/data/types";
import ConnectAppDialog from "./apps";
import SupportHubDialog from "./support-hub";
import CollaboratorInviteDialog from "./invites";
import ProjectCoverDialog from "./project";
import AccountSettingsDialog from "./settings";
import "../first-run/first-run.css";
import "./workspace.css";

export default function WorkspaceDialogBlock({ block }: BlockProps) {
  switch (block.id) {
    case "dialog-6":
      return <ConnectAppDialog />;
    case "dialog-7":
      return <SupportHubDialog />;
    case "dialog-8":
      return <CollaboratorInviteDialog />;
    case "dialog-9":
      return <ProjectCoverDialog />;
    case "dialog-10":
      return <AccountSettingsDialog />;
    default:
      throw new Error(`Unsupported workspace dialog: ${block.id}`);
  }
}
