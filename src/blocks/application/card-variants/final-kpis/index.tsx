import type { BlockProps } from "@/data/types";
import { LogisticsKpis, AudienceReach, InventoryCounters } from "./tiles";
import { ComplianceStrip, PeriodTrends, DealInvoiceTiles } from "./static";
export default function FinalKpis({ block }: BlockProps) {
  switch (block.id) {
    case "card-30":
      return <LogisticsKpis />;
    case "card-31":
      return <AudienceReach />;
    case "card-32":
      return <ComplianceStrip />;
    case "card-33":
      return <InventoryCounters />;
    case "card-34":
      return <PeriodTrends />;
    case "card-35":
      return <DealInvoiceTiles />;
    default:
      return null;
  }
}
