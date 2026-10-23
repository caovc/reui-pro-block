/** Official free REUI c-toggle-group-5 filter composition (MIT, Keenthemes).
 * Source: https://reui.io/r/radix-nova/c-toggle-group-5.json
 * Adaptation controls the original single-choice group to filter original local review data.
 */
import { useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Rating } from "@/components/reui/rating";
import { AllOwnerReviews, OwnerReviewRow, ReviewComposer, ReviewHeading } from "./review-common";
import { ownerReviews, reviewTopics } from "./review-data";

export function TopicFilterReviews() {
  const [reviews, setReviews] = useState(ownerReviews);
  const [topic, setTopic] = useState("All reviews");
  const filtered = useMemo(
    () => reviews.filter((review) => topic === "All reviews" || review.topics.includes(topic)),
    [reviews, topic],
  );
  const count = 1284 + reviews.length - ownerReviews.length;
  return (
    <main className="mx-auto max-w-5xl px-5 py-14 sm:px-6" data-review-variant="2">
      <ReviewHeading
        title="What customers are saying"
        action={
          <ReviewComposer
            onReview={(review) => {
              setReviews((value) => [review, ...value]);
              setTopic("All reviews");
            }}
          />
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Rating rating={4.8} size="sm" showValue />
          <span aria-hidden="true">·</span>
          <span>
            <strong className="font-medium text-foreground">{count.toLocaleString()}</strong>{" "}
            verified reviews
          </span>
        </div>
      </ReviewHeading>
      <ToggleGroup
        type="single"
        value={topic}
        onValueChange={(value) => setTopic(value || "All reviews")}
        variant="outline"
        size="sm"
        aria-label="Review topics"
        className="mb-10 w-full flex-wrap justify-start gap-2"
      >
        {reviewTopics.map((item) => (
          <ToggleGroupItem
            key={item.label}
            value={item.label}
            aria-label={`Filter reviews by ${item.label}`}
            className="gap-1.5 rounded-full px-3 text-xs font-normal data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background"
          >
            {item.label}
            <span className="opacity-60">{item.percent}%</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p role="status" className="sr-only">
        {filtered.length} sample reviews shown for {topic}
      </p>
      <section
        className="grid gap-x-12 gap-y-10 md:grid-cols-2 [&_[data-owner-review]>h2]:text-base [&_[data-owner-review]>p]:text-foreground/80"
        aria-label="Customer reviews"
      >
        {reviews.map((review) => (
          <div key={review.id} hidden={!filtered.includes(review)}>
            <OwnerReviewRow review={review} />
          </div>
        ))}
      </section>
      <footer className="mt-12 flex justify-center">
        <AllOwnerReviews reviews={reviews} label={`View all ${count.toLocaleString()} reviews`} />
      </footer>
    </main>
  );
}
