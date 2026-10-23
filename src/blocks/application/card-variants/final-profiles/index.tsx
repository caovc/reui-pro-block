import type { BlockProps } from "@/data/types";
import {
  OutreachCounters,
  CompanySnapshot,
  ProfileStatStrip,
  FitnessStats,
} from "./metrics";
import { ResourceHub, TopicShortcuts } from "./resources";
import { CustomerProfile, ContributorPortfolio } from "./profiles";
export default function FinalProfiles({ block }: BlockProps) {
  switch (block.id) {
    case "card-36":
      return <OutreachCounters />;
    case "card-37":
      return <CompanySnapshot />;
    case "card-38":
      return <ProfileStatStrip />;
    case "card-39":
      return <ResourceHub />;
    case "card-40":
      return <FitnessStats />;
    case "card-41":
      return <TopicShortcuts />;
    case "card-42":
      return <CustomerProfile />;
    case "card-43":
      return <ContributorPortfolio />;
    default:
      return null;
  }
}
