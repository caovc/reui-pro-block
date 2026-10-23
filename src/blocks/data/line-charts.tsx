import type { BlockProps } from "@/data/types";
import { BalanceTracker, FloorMonitor } from "./balance-floor-lines";
import { MetricSwitcher, RevenueTrend, SalesVsTraffic } from "./commerce-lines";
import SocialEngagement from "./social-lines";
export default function LineChartBlock({ block }: BlockProps) {
  switch (block.id) {
    case "chart-4":
      return <BalanceTracker />;
    case "chart-6":
      return <MetricSwitcher />;
    case "chart-22":
      return <RevenueTrend />;
    case "chart-23":
      return <SocialEngagement />;
    case "chart-24":
      return <SalesVsTraffic />;
    case "chart-26":
      return <FloorMonitor />;
    default:
      return <RevenueTrend />;
  }
}
