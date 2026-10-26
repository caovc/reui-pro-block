import type { BlockProps } from "@/data/types";
import MarketingMegaNavbar from "./marketing";
import EditorActionNavbar from "./editor";

export default function FinalNavbarBlock({ block }: BlockProps) {
  switch (block.id) {
    case "navbar-12":
      return <MarketingMegaNavbar />;
    case "navbar-13":
      return <EditorActionNavbar />;
    default:
      throw new Error(`Final navbar batch does not implement ${block.id}`);
  }
}
