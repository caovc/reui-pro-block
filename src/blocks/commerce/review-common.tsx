import { useState } from "react";
import type { ReactNode } from "react";
import { Check, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Rating } from "@/components/reui/rating";
import { cn } from "@/lib/utils";
import { demoAvatar } from "@/lib/demo-artwork";
import type { OwnerReview } from "./review-data";

/** Actual free c-avatar-1/2/3 Image+Fallback composition with original local demoAvatar artwork. */
export function OwnerAvatar({ review, className }: { review: OwnerReview; className?: string }) {
  return (
    <Avatar className={cn("size-8 shrink-0", className)}>
      <AvatarImage src={review.avatar || demoAvatar(review.author)} alt={review.author} />
      <AvatarFallback>
        {review.author
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </AvatarFallback>
    </Avatar>
  );
}

export function ReviewIdentity({
  review,
  showRole = false,
  showRating = true,
  verified = true,
  verifiedLabel = "Verified",
}: {
  review: OwnerReview;
  showRole?: boolean;
  showRating?: boolean;
  verified?: boolean;
  verifiedLabel?: string;
}) {
  return (
    <Item className="border-0 p-0" size="sm">
      <ItemMedia className="self-center!">
        <OwnerAvatar review={review} />
      </ItemMedia>
      <ItemContent className="min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <ItemTitle className="text-sm font-semibold">{review.author}</ItemTitle>
          {verified && (
            <Badge variant="success-light" size="xs">
              {verifiedLabel}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {showRole && <span>{review.role}</span>}
          {showRating && (
            <Rating rating={review.rating} showValue={!showRole} size="sm" className="gap-0.5" />
          )}
          {!showRole && (
            <>
              <span>·</span>
              <span>{review.finish}</span>
              <span>·</span>
              <span>{review.date}</span>
            </>
          )}
        </div>
      </ItemContent>
    </Item>
  );
}

export function ReviewHeading({
  title,
  children,
  action,
  centered = false,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  centered?: boolean;
}) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-wrap items-end justify-between gap-5",
        centered && "flex-col items-center text-center",
      )}
    >
      <div>
        <p className="mb-2 text-[10px] tracking-[.24em] text-muted-foreground">REVIEWS</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {children && <div className="mt-3 text-sm text-muted-foreground">{children}</div>}
      </div>
      {action}
    </header>
  );
}

export function ReviewComposer({
  onReview,
  className,
  label = "Write a review",
}: {
  onReview: (review: OwnerReview) => void;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => {
          setSaved(false);
          setOpen(true);
        }}
      >
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{saved ? "Your review is saved" : "Write a review"}</DialogTitle>
            <DialogDescription>
              {saved
                ? "Your feedback is now visible in this local preview."
                : "Share your experience with the Halden Wave Pro."}
            </DialogDescription>
          </DialogHeader>
          {saved ? (
            <div className="space-y-5">
              <Alert variant="success">
                <Check />
                <AlertTitle>Thank you, {author}</AlertTitle>
                <AlertDescription>
                  Your review was added locally. No external submission was made.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                onReview({
                  id: `local-${Date.now()}`,
                  author,
                  avatar: demoAvatar(author),
                  role: "Owner",
                  date: "Just now",
                  daysAgo: 0,
                  finish: "Onyx · LDAC",
                  rating,
                  title,
                  paragraphs: [text],
                  quote: text,
                  topics: ["Your reviews"],
                  helpful: 0,
                });
                setSaved(true);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="owner-review-name">Your name</Label>
                <Input
                  id="owner-review-name"
                  required
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-review-rating">Your rating</Label>
                <Rating
                  id="owner-review-rating"
                  aria-label="Your rating"
                  rating={rating}
                  onRatingChange={setRating}
                  editable
                  showValue
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-review-title">Review title</Label>
                <Input
                  id="owner-review-title"
                  required
                  minLength={3}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-review-text">Your review</Label>
                <Textarea
                  id="owner-review-text"
                  required
                  minLength={12}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Save review
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function HelpfulReview({
  review,
  compact = false,
}: {
  review: OwnerReview;
  compact?: boolean;
}) {
  const [helpful, setHelpful] = useState(false);
  const count = review.helpful + Number(helpful);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto px-0 text-xs font-normal text-muted-foreground"
      aria-label={`Mark review by ${review.author} as helpful`}
      aria-pressed={helpful}
      onClick={() => setHelpful((value) => !value)}
    >
      <ThumbsUp className={cn("size-3.5", helpful && "fill-current")} />
      {compact ? `Helpful (${count})` : `${count} found this helpful`}
    </Button>
  );
}

export function OwnerReviewRow({
  review,
  compactHelpful = false,
}: {
  review: OwnerReview;
  compactHelpful?: boolean;
}) {
  return (
    <article className="space-y-4" data-owner-review={review.id}>
      <ReviewIdentity review={review} />
      <h2 className="text-sm font-semibold">“{review.title}”</h2>
      <p className="text-sm leading-6 text-muted-foreground">{review.paragraphs[0]}</p>
      <HelpfulReview review={review} compact={compactHelpful} />
    </article>
  );
}

export function AllOwnerReviews({
  reviews,
  label = "Read all 1,284 reviews",
}: {
  reviews: OwnerReview[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Owner reviews</DialogTitle>
            <DialogDescription>
              Showing {reviews.length} original sample reviews in this independent preview.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 divide-y">
            {reviews.map((review) => (
              <div key={review.id} className="pt-5">
                <OwnerReviewRow review={review} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
