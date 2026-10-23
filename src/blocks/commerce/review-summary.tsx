/** Actual free REUI c-rating-6 review-summary composition (MIT, Keenthemes).
 * Source: https://reui.io/r/radix-nova/c-rating-6.json
 * Retains real Rating + Separator + distribution.map(Progress) structure;
 * adapts alignment, data/counts and bar color to the independently observed public review layout.
 */
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Rating } from "@/components/reui/rating";
import { Badge } from "@/components/reui/badge";
import { OwnerReviewRow, ReviewComposer, ReviewHeading } from "./review-common";
import { ownerReviews } from "./review-data";

const originalDistribution = [
  { stars: 5, count: 1052 },
  { stars: 4, count: 158 },
  { stars: 3, count: 47 },
  { stars: 2, count: 18 },
  { stars: 1, count: 9 },
];
const mentions = [
  { label: "Sound Quality", count: 482 },
  { label: "Noise Cancel", count: 401 },
  { label: "Comfort", count: 367 },
  { label: "Battery Life", count: 312 },
  { label: "Build", count: 198 },
  { label: "Companion App", count: 156 },
];
type ReviewSort = "recent" | "highest" | "lowest" | "helpful";

export function RatingSummaryReviews() {
  const [reviews, setReviews] = useState(ownerReviews);
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [visibleCount, setVisibleCount] = useState(3);
  const added = reviews.filter((review) => review.id.startsWith("local-"));
  const total = 1284 + added.length;
  const rating = (1284 * 4.8 + added.reduce((sum, review) => sum + review.rating, 0)) / total;
  const distribution = originalDistribution.map((row) => {
    const count = row.count + added.filter((review) => review.rating === row.stars).length;
    return { ...row, count, percentage: (count / total) * 100 };
  });
  const sorted = [...reviews].sort((a, b) => {
    if (sort === "highest") return b.rating - a.rating || a.daysAgo - b.daysAgo;
    if (sort === "lowest") return a.rating - b.rating || a.daysAgo - b.daysAgo;
    if (sort === "helpful") return b.helpful - a.helpful || a.daysAgo - b.daysAgo;
    return a.daysAgo - b.daysAgo;
  });
  return (
    <main className="mx-auto max-w-6xl px-5 py-14 sm:px-6" data-review-variant="3">
      <ReviewHeading title="Customer reviews" />
      <div className="grid items-start gap-10 md:grid-cols-[288px_minmax(0,1fr)] md:gap-12">
        <Frame variant="ghost" spacing="xs">
          <FramePanel className="space-y-4 p-4 shadow-none">
            <div className="space-y-2" data-rating-summary>
              <div className="flex items-baseline gap-2">
                <strong className="text-5xl font-semibold tracking-tight" data-review-average>
                  {rating.toFixed(1)}
                </strong>
                <span className="text-sm text-muted-foreground">out of 5</span>
              </div>
              <Rating rating={rating} size="sm" />
              <p className="text-sm text-muted-foreground">
                Based on{" "}
                <strong className="font-medium text-foreground" data-review-count>
                  {total.toLocaleString()}
                </strong>{" "}
                verified reviews
              </p>
            </div>
            <Separator />
            <div className="space-y-1.5" aria-label="Review rating distribution">
              {distribution.map((row) => (
                <div
                  key={row.stars}
                  className="flex items-center gap-3 text-sm"
                  data-star-count={row.stars}
                >
                  <span className="w-5 shrink-0 text-xs text-muted-foreground">{row.stars}★</span>
                  <Progress
                    value={row.percentage}
                    aria-label={`${row.stars}-star reviews`}
                    className="h-1.5 flex-1 **:data-[slot=progress-indicator]:bg-foreground"
                  />
                  <span
                    className="w-11 text-right text-xs text-muted-foreground"
                    data-distribution-count
                  >
                    {row.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="font-medium text-foreground">94%</strong> of customers would
              recommend
            </p>
            <div>
              <h2 className="mb-3 text-xs tracking-[.18em] text-muted-foreground">TOP MENTIONS</h2>
              <div className="flex flex-wrap gap-1.5">
                {mentions.map((mention) => (
                  <Badge
                    key={mention.label}
                    variant="outline"
                    size="default"
                    radius="full"
                    className="h-6 px-3 font-normal"
                  >
                    {mention.label}
                    <span className="ml-1.5 text-muted-foreground">{mention.count}</span>
                  </Badge>
                ))}
              </div>
            </div>
            <ReviewComposer
              className="w-full bg-foreground text-background hover:bg-foreground/90 hover:text-background"
              onReview={(review) => {
                setReviews((value) => [review, ...value]);
                setSort("recent");
                setVisibleCount(3);
              }}
            />
          </FramePanel>
        </Frame>
        <section aria-label="Recent customer reviews" className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Recent reviews</h2>
            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value as ReviewSort);
                setVisibleCount(3);
              }}
            >
              <SelectTrigger aria-label="Sort reviews" size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
                <SelectItem value="highest">Highest Rated</SelectItem>
                <SelectItem value="lowest">Lowest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-6 divide-y [&_[data-owner-review]>h2]:text-base [&_[data-owner-review]>p]:text-foreground/80">
            {sorted.slice(0, visibleCount).map((review, index) => (
              <div key={review.id} className={index ? "pt-6" : undefined}>
                <OwnerReviewRow review={review} compactHelpful />
              </div>
            ))}
          </div>
          <footer className="mt-10 flex justify-center">
            {visibleCount < sorted.length ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((value) => value + 3)}
              >
                Show more reviews
              </Button>
            ) : (
              <p role="status" className="text-xs text-muted-foreground">
                All {sorted.length} sample reviews shown
              </p>
            )}
          </footer>
        </section>
      </div>
    </main>
  );
}
