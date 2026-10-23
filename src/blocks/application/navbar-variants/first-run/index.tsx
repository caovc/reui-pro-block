import type { BlockProps } from "@/data/types";
import ProjectWorkspaceNavbar from "./project";
import TeamPresenceNavbar from "./presence";
import PlatformNavbar from "./platform";

export default function RefinedNavbarBlock({ block }: BlockProps) {
  switch (block.id) {
    case "navbar-1":
      return <ProjectWorkspaceNavbar />;
    case "navbar-2":
      return <TeamPresenceNavbar />;
    case "navbar-3":
      return <PlatformNavbar />;
    default:
      throw new Error(`Navbar first-run does not implement ${block.id}`);
  }
}
