/** Static review quote grid composed with actual official free c-item-5 Avatar/Item identity,
 * Rating, and the shared validated local review composer; no invented carousel behavior.
 * Official sources: https://reui.io/r/radix-nova/c-item-5.json and rating.json (MIT, Keenthemes).
 */
import { useState } from "react";
import { Quote } from "lucide-react";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Rating } from "@/components/reui/rating";
import { AllOwnerReviews, OwnerAvatar, ReviewComposer, ReviewHeading } from "./review-common";
import { ownerReviews } from "./review-data";
import type { OwnerReview } from "./review-data";

const highlights: Record<string, string> = {
  mira: "A shared workspace can be a lively place to finish a first draft. These make it easier to settle into a session without losing the small details in a recording. The comfortable fit is what keeps them in my work bag.",
  theo: "Moving between a desktop, tablet and phone has become pleasantly ordinary. Pairing is straightforward and the controls feel familiar by the second day. I appreciate useful details that accompany the working day without asking for extra attention.",
  leon: "The predictable battery has made these my regular travel pair. I charge at the end of the week and spend less time looking for a cable between research sessions. The cups fold neatly into the case when it is time to move on.",
  jules:
    "A long listening session is a useful test of comfort. The gentle fit works with my glasses, the padding stays comfortable and the controls are easy to find. They have become the pair I reach for during an afternoon of editing.",
  ines: "The replaceable cushions and practical folding case feel like thoughtful choices. The everyday surfaces are easy to keep clean, and the finish has handled being moved between rooms. They feel useful without turning every small task into a production.",
  priya:
    "Quiet recordings keep their sense of space at a sensible volume. I can follow the texture of a string passage without turning everything up. That balanced, unhurried presentation matters more to me than an impressive first few seconds.",
};

function HighlightIdentity({ review }: { review: OwnerReview }) {
  return (
    <Item className="gap-3 border-0 p-0" size="sm">
      <ItemMedia className="self-center!">
        <OwnerAvatar review={review} />
      </ItemMedia>
      <ItemContent className="gap-1">
        <ItemTitle className="text-sm font-semibold">{review.author}</ItemTitle>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Rating rating={review.rating} size="sm" showValue className="gap-0.5" />
          <span aria-hidden="true">·</span>
          <span>{review.date}</span>
        </div>
      </ItemContent>
    </Item>
  );
}

export function PullQuoteReviews() {
  const [reviews, setReviews] = useState(ownerReviews);
  const count = 1284 + reviews.length - ownerReviews.length;
  return (
    <main className="mx-auto max-w-6xl px-5 py-14 sm:px-6" data-review-variant="4">
      <ReviewHeading
        title="Customer highlights"
        action={<ReviewComposer onReview={(review) => setReviews((value) => [review, ...value])} />}
      >
        Verified buyers in their own words.
      </ReviewHeading>
      <section
        className="grid gap-x-12 gap-y-12 pt-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Customer highlights"
      >
        {reviews.map((review) => (
          <article
            key={review.id}
            className="flex min-w-0 flex-col"
            data-owner-highlight={review.id}
          >
            <Quote
              className="mb-4 size-9 rotate-180 fill-current text-muted-foreground/30"
              strokeWidth={0}
            />
            <blockquote className="min-h-28 flex-1 text-sm leading-6">
              {highlights[review.id] ?? review.paragraphs[0]}
            </blockquote>
            <footer className="mt-8">
              <HighlightIdentity review={review} />
            </footer>
          </article>
        ))}
      </section>
      <footer className="mt-12 flex justify-center">
        <AllOwnerReviews reviews={reviews} label={`Read all ${count.toLocaleString()} reviews`} />
      </footer>
    </main>
  );
}
