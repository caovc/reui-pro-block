import type { BlockProps } from "@/data/types";
import { InventoryHealth, KpiStrip, KpiTrendCards, OrderMetrics } from "./sparkline-business";
import { WalletBalances, WealthOverview, DistanceTracker } from "./sparkline-finance";
import { CronJobHealth, SloFleetHealth, ConnectionHealth } from "./sparkline-operations";
import SloBudgets from "./sparkline-budgets";

export default function SparklineChartBlock({ block }: BlockProps) {
  switch (block.id) {
    case "chart-1":
      return <InventoryHealth />;
    case "chart-2":
      return <KpiStrip />;
    case "chart-3":
      return <WalletBalances />;
    case "chart-5":
      return <WealthOverview />;
    case "chart-11":
      return <DistanceTracker />;
    case "chart-15":
      return <KpiTrendCards />;
    case "chart-25":
      return <OrderMetrics />;
    case "chart-31":
      return <CronJobHealth />;
    case "chart-41":
      return <SloFleetHealth />;
    case "chart-44":
      return <SloBudgets />;
    case "chart-46":
      return <ConnectionHealth />;
    default:
      return <KpiStrip />;
  }
}
