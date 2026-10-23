import type { BlockProps } from "@/data/types";
import UsagePlanner from "./ai-usage-planner";
import SpendMap from "./ai-usage-spend-map";
import EdgeNodes from "./ai-usage-edge-nodes";
import LocalModels from "./ai-usage-local-models";
export default function AiUsageVariants({ block }: BlockProps) {
  switch (block.id) {
    case "ai-usage-2":
      return <SpendMap />;
    case "ai-usage-3":
      return <EdgeNodes />;
    case "ai-usage-4":
      return <LocalModels />;
    default:
      return <UsagePlanner />;
  }
}
