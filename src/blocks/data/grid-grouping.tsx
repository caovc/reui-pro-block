import type { BlockProps } from "@/data/types";
import Roadmap from "./grid-grouping-roadmap";
import Revenue from "./grid-grouping-revenue";
import Cohorts from "./grid-grouping-cohorts";
import MaterialsTree from "./grid-grouping-materials";
import ReportingTree from "./grid-grouping-reporting";
import EditorialDesk from "./grid-grouping-editorial";
import DeliveryStages from "./grid-grouping-delivery";

export default function GroupingGrid({ block }: BlockProps) {
  switch (block.id) {
    case "data-grid-grouping-1":
      return <Roadmap />;
    case "data-grid-grouping-2":
      return <Revenue />;
    case "data-grid-grouping-3":
      return <Cohorts />;
    case "data-grid-grouping-4":
      return <MaterialsTree />;
    case "data-grid-grouping-5":
      return <ReportingTree />;
    case "data-grid-grouping-6":
      return <EditorialDesk />;
    default:
      return <DeliveryStages />;
  }
}
