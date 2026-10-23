import type { BlockProps } from "@/data/types";
import ApprovalRunConsole from "./agent-activity-approval";
import LiveRunFeed from "./agent-activity-feed";
import ResearchTimeline from "./agent-activity-research";
import McpCallAudit from "./agent-activity-audit";
import RunOutcomeReport from "./agent-activity-outcome";

export default function AgentActivityVariants({ block }: BlockProps) {
  switch (block.id) {
    case "agent-activity-2":
      return <LiveRunFeed />;
    case "agent-activity-3":
      return <ResearchTimeline />;
    case "agent-activity-4":
      return <McpCallAudit />;
    case "agent-activity-5":
      return <RunOutcomeReport />;
    default:
      return <ApprovalRunConsole />;
  }
}
