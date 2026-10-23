import type { BlockProps } from "@/data/types";
import ApiDeveloperNavbar from "./api";
import DesignSystemNavbar from "./design";

export default function DeveloperNavbarBlock({ block }: BlockProps) {
  switch (block.id) {
    case "navbar-10":
      return <ApiDeveloperNavbar />;
    case "navbar-11":
      return <DesignSystemNavbar />;
    default:
      throw new Error(`Developer navbar batch does not implement ${block.id}`);
  }
}
