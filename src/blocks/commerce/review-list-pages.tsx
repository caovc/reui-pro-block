import type { BlockProps } from "@/data/types";
import { TopicFilterReviews } from "./review-topic-filter";
import { RatingSummaryReviews } from "./review-summary";
import { PullQuoteReviews } from "./review-highlights";

export function ReviewLists({ block }: BlockProps) {
  switch (block.index) {
    case 1:
      return <TopicFilterReviews />;
    case 2:
      return <RatingSummaryReviews />;
    case 3:
      return <PullQuoteReviews />;
    default:
      throw new Error(`ReviewLists does not own ${block.id}`);
  }
}
