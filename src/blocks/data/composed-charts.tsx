import type { BlockProps } from "@/data/types";
import { SalesVsGoal, OperatingMargin } from "./sales-margin-composed";
import { LiquidityFlows, CashflowTrend } from "./treasury-composed";
import CanaryRollback from "./canary-composed";
export default function ComposedChartBlock({ block }: BlockProps) {
  switch (block.id) {
    case "chart-19":
      return <LiquidityFlows />;
    case "chart-20":
      return <SalesVsGoal />;
    case "chart-21":
      return <CashflowTrend />;
    case "chart-36":
      return <OperatingMargin />;
    case "chart-37":
      return <CanaryRollback />;
    default:
      return <SalesVsGoal />;
  }
}
