import type { BlockProps } from "@/data/types";
import CmsPublishNavbar from "./cms";
import AgentMarketplaceNavbar from "./marketplace";
import RepositoryNavbar from "./repo";
export default function PublishingNavbarBlock({ block }: BlockProps) {
  switch (block.id) {
    case "navbar-7":
      return <CmsPublishNavbar />;
    case "navbar-8":
      return <AgentMarketplaceNavbar />;
    case "navbar-9":
      return <RepositoryNavbar />;
    default:
      throw new Error(`Publishing navbar batch does not implement ${block.id}`);
  }
}
