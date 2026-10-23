import type { BlockProps } from "@/data/types";
import { AvatarReviewCarousel, TestimonialCardsCarousel } from "./review-carousels";

/** Individually audited carousel entries; list/filter review entries follow separately. */
export function ReviewCarousels({ block }: BlockProps) {
  switch (block.index) {
    case 0:
      return <AvatarReviewCarousel />;
    case 4:
      return <TestimonialCardsCarousel />;
    case 5:
      return <TestimonialCardsCarousel starLed />;
    default:
      throw new Error(`ReviewCarousels does not own ${block.id}`);
  }
}
