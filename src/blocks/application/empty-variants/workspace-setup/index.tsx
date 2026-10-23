import type { BlockProps } from "@/data/types";
import SignalsEmpty from "./signals";
import ExportsEmpty from "./exports";
import StorageEmpty from "./storage";
import OrganizationsEmpty from "./organizations";
import "./workspace-setup.css";

export default function WorkspaceSetupEmptyBlock({ block }: BlockProps) {
  switch (block.id) {
    case "empty-state-11":
      return <SignalsEmpty />;
    case "empty-state-12":
      return <ExportsEmpty />;
    case "empty-state-13":
      return <StorageEmpty />;
    case "empty-state-14":
      return <OrganizationsEmpty />;
    default:
      throw new Error(`Unsupported workspace setup empty state: ${block.id}`);
  }
}
