import type { BlockProps } from "@/data/types";
import {
  InstalledIntegration,
  CryptoQuote,
  JobRecommendation,
  ApplicationSummary,
} from "./records";
import {
  ShortcutLauncher,
  SourceLinks,
  HelpGuides,
  ProjectDeadlines,
  LinkedMetrics,
} from "./tiles";
import { UpsellPromo, MonitoringPromo } from "./promos";
import { AccountBalances, SharedKpis, KpiAreaCards } from "./metrics";
export default function ExtendedCards({ block }: BlockProps) {
  switch (block.id) {
    case "card-16":
      return <InstalledIntegration />;
    case "card-17":
      return <ShortcutLauncher />;
    case "card-18":
      return <SourceLinks />;
    case "card-19":
      return <CryptoQuote />;
    case "card-20":
      return <HelpGuides />;
    case "card-21":
      return <ProjectDeadlines />;
    case "card-22":
      return <UpsellPromo />;
    case "card-23":
      return <MonitoringPromo />;
    case "card-24":
      return <JobRecommendation />;
    case "card-25":
      return <AccountBalances />;
    case "card-26":
      return <LinkedMetrics />;
    case "card-27":
      return <ApplicationSummary />;
    case "card-28":
      return <SharedKpis />;
    case "card-29":
      return <KpiAreaCards />;
    default:
      return null;
  }
}
