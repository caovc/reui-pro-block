/** Actual free REUI c-carousel-9 synchronization, c-carousel-5 Autoplay and c-carousel-11 snap dots.
 * Source URLs and original cache hashes are recorded in docs/review-carousel-refinement.md.
 * Adaptation supplies fictional review content, actual free Avatar/Rating patterns and original illustrations and explicit playback controls.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { Pause, Play, Quote } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Rating } from "@/components/reui/rating";
import { cn } from "@/lib/utils";
import { OwnerAvatar, ReviewComposer, ReviewHeading, ReviewIdentity } from "./review-common";
import { ownerReviews } from "./review-data";

function useReviewCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [playing, setPlaying] = useState(true);
  const autoplay = useRef(Autoplay({ delay: 7000, stopOnInteraction: true }));
  useEffect(() => {
    if (!api) return;
    const select = () => {
      setCurrent(api.selectedScrollSnap());
      setCount(api.scrollSnapList().length);
    };
    const play = () => setPlaying(true);
    const stop = () => setPlaying(false);
    select();
    api.on("select", select);
    api.on("reInit", select);
    api.on("autoplay:play", play);
    api.on("autoplay:stop", stop);
    return () => {
      api.off("select", select);
      api.off("reInit", select);
      api.off("autoplay:play", play);
      api.off("autoplay:stop", stop);
    };
  }, [api]);
  const scrollTo = (index: number) => {
    api?.scrollTo(index);
    if (autoplay.current.isPlaying()) autoplay.current.reset();
  };
  const toggle = () =>
    autoplay.current.isPlaying() ? autoplay.current.stop() : autoplay.current.play();
  return { api, setApi, current, count, playing, autoplay, scrollTo, toggle };
}

function ReviewPlayback({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={playing ? "Pause testimonials" : "Play testimonials"}
      onClick={onToggle}
      className="size-6"
    >
      {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
    </Button>
  );
}

export function AvatarReviewCarousel() {
  const [reviews, setReviews] = useState(() => ownerReviews.slice(0, 5));
  const motion = useReviewCarousel();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const onSelect = useCallback(() => {
    if (!motion.api || !thumbApi) return;
    thumbApi.scrollTo(motion.api.selectedScrollSnap());
  }, [motion.api, thumbApi]);
  useEffect(() => {
    if (!motion.api) return;
    onSelect();
    motion.api.on("select", onSelect);
    motion.api.on("reInit", onSelect);
    return () => {
      motion.api?.off("select", onSelect);
      motion.api?.off("reInit", onSelect);
    };
  }, [motion.api, onSelect]);
  const current = reviews[motion.current] ?? reviews[0];
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-6" data-review-variant="1">
      <ReviewHeading
        title="What customers are saying"
        action={
          <ReviewComposer
            onReview={(review) => {
              setReviews((value) => [review, ...value]);
              motion.api?.scrollTo(0, true);
            }}
          />
        }
      >
        <span className="text-foreground">
          {(1284 + reviews.length - 5).toLocaleString()} verified reviews
        </span>
      </ReviewHeading>
      <Carousel
        setApi={motion.setApi}
        plugins={[motion.autoplay.current]}
        opts={{ loop: true }}
        aria-label="Owner review carousel"
        tabIndex={0}
        data-review-main
      >
        <CarouselContent className="ml-0" aria-live={motion.playing ? "off" : "polite"}>
          {reviews.map((review, index) => (
            <CarouselItem key={review.id} className="pl-0" aria-hidden={motion.current !== index}>
              <Quote
                className="mb-6 size-12 rotate-180 fill-current text-muted-foreground/40"
                strokeWidth={0}
              />
              <blockquote className="space-y-5 text-base leading-7 sm:text-lg">
                {review.paragraphs.map((paragraph, p) => (
                  <p key={p}>{paragraph}</p>
                ))}
              </blockquote>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t pt-6">
        <div data-current-reviewer>
          <ReviewIdentity review={current} verifiedLabel="Verified buyer" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[.18em] text-muted-foreground">
            MORE FROM OWNERS
          </span>
          <Carousel
            setApi={setThumbApi}
            opts={{ containScroll: "keepSnaps", dragFree: true }}
            className="w-40"
            aria-label="Review avatars"
          >
            <CarouselContent className="ml-0 py-1">
              {reviews.map((review, index) => (
                <CarouselItem key={review.id} className="-ml-3 basis-10 pl-0 first:ml-0">
                  <button
                    type="button"
                    aria-label={`Read review ${index + 1} of ${reviews.length} by ${review.author}`}
                    aria-current={motion.current === index ? "true" : undefined}
                    aria-pressed={motion.current === index}
                    onClick={() => {
                      if (motion.api && thumbApi) motion.scrollTo(index);
                    }}
                    className={cn(
                      "block size-10 cursor-pointer rounded-full bg-background p-0.5 outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring",
                      motion.current === index
                        ? "opacity-100 ring-2 ring-foreground"
                        : "opacity-45 hover:opacity-80",
                    )}
                  >
                    <OwnerAvatar review={review} className="size-9" />
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <ReviewPlayback playing={motion.playing} onToggle={motion.toggle} />
        </div>
      </footer>
    </main>
  );
}

export function TestimonialCardsCarousel({ starLed = false }: { starLed?: boolean }) {
  const motion = useReviewCarousel();
  return (
    <main
      className="mx-auto max-w-6xl px-5 py-12 sm:px-8"
      data-review-variant={starLed ? "6" : "5"}
    >
      <ReviewHeading centered title={starLed ? "Trusted by owners" : "Loved by sound obsessives"}>
        {starLed ? "Everyday impressions from " : "Stories from "}
        <span className="font-medium text-foreground">1,284 verified reviews</span> of the Halden
        Wave Pro.
      </ReviewHeading>
      <Carousel
        setApi={motion.setApi}
        plugins={[motion.autoplay.current]}
        opts={{ loop: true, align: "start", slidesToScroll: 1 }}
        aria-label={starLed ? "Star-led testimonials" : "Customer testimonials"}
        tabIndex={0}
        className="mt-12"
        data-review-main
      >
        <CarouselContent className="-ml-6">
          {ownerReviews.map((review) => (
            <CarouselItem
              key={review.id}
              className="flex basis-full pl-6 sm:basis-1/2 lg:basis-1/3"
            >
              <Frame variant="ghost" spacing="xs" className="h-full w-full">
                <FramePanel className="flex h-full flex-col gap-4 p-4 shadow-none">
                  {starLed ? (
                    <Rating rating={review.rating} size="sm" className="gap-0.5" />
                  ) : (
                    <Quote
                      className="size-8 rotate-180 fill-current text-muted-foreground/30"
                      strokeWidth={0}
                    />
                  )}
                  <blockquote className={cn("flex-1 leading-6", starLed ? "text-sm" : "text-base")}>
                    “{review.quote}”
                  </blockquote>
                  <div className={cn(starLed && "border-t pt-4")}>
                    <ReviewIdentity
                      review={review}
                      showRole
                      showRating={!starLed}
                      verified={false}
                    />
                  </div>
                </FramePanel>
              </Frame>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-9 flex items-center justify-center gap-1.5">
          {Array.from({ length: motion.count }).map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to testimonial ${index + 1} of ${motion.count} by ${ownerReviews[index]?.author}`}
              aria-current={motion.current === index ? "true" : undefined}
              aria-pressed={motion.current === index}
              onClick={() => motion.scrollTo(index)}
              className={cn(
                "h-1.5 cursor-pointer rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2",
                motion.current === index ? "w-7 bg-foreground" : "w-1.5 bg-muted-foreground/25",
              )}
            />
          ))}
          <span className="ml-2">
            <ReviewPlayback playing={motion.playing} onToggle={motion.toggle} />
          </span>
        </div>
      </Carousel>
    </main>
  );
}
