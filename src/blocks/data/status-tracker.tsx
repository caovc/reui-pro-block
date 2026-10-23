import type { BlockProps } from "@/data/types";
import CronRunHistory from "./cron-run-history";
import ReleaseLanes from "./release-lanes";
import DeployHistory from "./deploy-history";
export default function StatusTrackerBlock({ block }: BlockProps) {
  if (block.id === "chart-38") return <ReleaseLanes />;
  if (block.id === "chart-39") return <DeployHistory />;
  return <CronRunHistory />;
}
