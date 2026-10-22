import {
  BrandLogoGrid,
  FeatureHighlights,
  IntegrationConnector,
  NumberedSetup,
  NoticeCards,
  QuickLinkTiles,
  PartnerShowcase,
} from "./tiles";
import {
  InvestorProfile,
  DetailFacts,
  ApplicantRecord,
  DeliveryTracking,
  MeetingCards,
} from "./records";
import { KpiReports, ServiceStatus, ReportUpdates } from "./reports";
import type { BlockProps } from "@/data/types";
export default function RefinedCards({ block }: BlockProps) {
  switch (block.id) {
    case "card-1":
      return <BrandLogoGrid />;
    case "card-2":
      return <FeatureHighlights />;
    case "card-3":
      return <InvestorProfile />;
    case "card-4":
      return <KpiReports />;
    case "card-5":
      return <IntegrationConnector />;
    case "card-6":
      return <NumberedSetup />;
    case "card-7":
      return <DetailFacts />;
    case "card-8":
      return <ServiceStatus />;
    case "card-9":
      return <ApplicantRecord />;
    case "card-10":
      return <ReportUpdates />;
    case "card-11":
      return <NoticeCards />;
    case "card-12":
      return <QuickLinkTiles />;
    case "card-13":
      return <PartnerShowcase />;
    case "card-14":
      return <DeliveryTracking />;
    case "card-15":
      return <MeetingCards />;
    default:
      return null;
  }
}
