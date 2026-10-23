import type { BlockProps } from "@/data/types";
import DataImportEmpty from "./data-import";
import SearchEmpty from "./search";
import ProjectEmpty from "./project";
import ReportsEmpty from "./reports";
import BriefEmpty from "./brief";
import "./first-run/first-run.css";

export default function RefinedEmptyBlock({ block }: BlockProps) {
  switch (block.id) {
    case "empty-state-1":
      return <DataImportEmpty />;
    case "empty-state-2":
      return <SearchEmpty />;
    case "empty-state-3":
      return <ProjectEmpty />;
    case "empty-state-4":
      return <ReportsEmpty />;
    case "empty-state-5":
      return <BriefEmpty />;
    default:
      throw new Error(`Unsupported refined empty state: ${block.id}`);
  }
}
