/** Actual official free REUI pattern composition (MIT, Keenthemes).
 * c-carousel-9: synchronized main/thumbnail CarouselApis with select/reInit listeners.
 * c-carousel-5: embla-carousel-autoplay plugin. c-carousel-11: snap-driven dot navigation.
 * Sources: https://reui.io/r/radix-nova/c-carousel-{9,5,11}.json
 * Adaptations retain this project's product assets, accessible labels and review pause controls.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Autoplay from "embla-carousel-autoplay";
import { Pause, Play } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { Rating } from "@/components/reui/rating";
import { cn } from "@/lib/utils";

export function FreeProductGallery({
  name,
  images,
  vertical = false,
  lookInside = false,
  aspect = "aspect-square",
  style,
}: {
  name: string;
  images: string[];
  vertical?: boolean;
  lookInside?: boolean;
  aspect?: string;
  style?: CSSProperties;
}) {
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi || !thumbApi) return;
      mainApi.scrollTo(index);
    },
    [mainApi, thumbApi],
  );
  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return;
    const index = mainApi.selectedScrollSnap();
    setSelectedIndex(index);
    thumbApi.scrollTo(index);
  }, [mainApi, thumbApi]);
  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on("select", onSelect);
    mainApi.on("reInit", onSelect);
    return () => {
      mainApi.off("select", onSelect);
      mainApi.off("reInit", onSelect);
    };
  }, [mainApi, onSelect]);
  const captions = ["Cover", "Foreword", "Chapter 1", "Workbook", "Audiobook"];
  return (
    <div
      data-free-product-gallery
      className={cn(
        "min-w-0",
        vertical &&
          "grid grid-cols-[48px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-4",
      )}
    >
      <Carousel
        setApi={setMainApi}
        opts={{ loop: false }}
        className={cn(
          "min-w-0 overflow-hidden rounded-lg bg-muted",
          vertical && "col-start-2 row-start-1",
        )}
        aria-label={`${name} image gallery`}
        tabIndex={0}
      >
        <CarouselContent className="ml-0">
          {images.map((src, index) => (
            <CarouselItem
              key={`${src}-${index}`}
              className="pl-0"
              aria-hidden={selectedIndex !== index}
            >
              <div className={cn("overflow-hidden", aspect)}>
                <img
                  data-gallery-image={selectedIndex === index ? "" : undefined}
                  src={src}
                  alt={`${name} — view ${index + 1}`}
                  className="size-full object-cover"
                  style={{
                    objectPosition: `${20 + index * 15}% center`,
                    transform:
                      index > 0 ? `scale(${1 + index * 0.06})` : undefined,
                    ...style,
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div
        className={cn(
          "min-w-0 mt-3",
          vertical && "col-start-1 row-start-1 mt-0",
        )}
      >
        {lookInside && (
          <div className="mb-2 flex justify-between text-[10px] tracking-[.16em] text-muted-foreground">
            <span>LOOK INSIDE</span>
            <output>
              {String(selectedIndex + 1).padStart(2, "0")} /{" "}
              {String(images.length).padStart(2, "0")}
            </output>
          </div>
        )}
        <Carousel
          setApi={setThumbApi}
          orientation={vertical ? "vertical" : "horizontal"}
          opts={{ containScroll: "keepSnaps", dragFree: true }}
          aria-label={`${name} thumbnails`}
        >
          <CarouselContent
            className={cn(
              "-ml-2 py-1",
              vertical && "ml-0 -mt-2 h-70 flex-col py-0 sm:h-90",
            )}
          >
            {images.map((src, index) => (
              <CarouselItem
                key={`${src}-${index}`}
                className={cn(
                  "basis-1/5 pl-2",
                  images.length === 6 && "basis-1/6",
                  vertical && "basis-1/5 pl-0 pt-2",
                )}
              >
                <button
                  type="button"
                  aria-label={
                    lookInside
                      ? `Show ${captions[index]} preview`
                      : `Show image ${index + 1} of ${images.length}`
                  }
                  aria-pressed={selectedIndex === index}
                  onClick={() => onThumbClick(index)}
                  className={cn(
                    "aspect-square w-full cursor-pointer overflow-hidden rounded-md border-2 bg-muted outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring",
                    selectedIndex === index
                      ? "border-primary opacity-100"
                      : "border-transparent opacity-50 hover:opacity-80",
                  )}
                >
                  <img
                    src={src}
                    alt=""
                    className="size-full object-cover"
                    style={{ objectPosition: `${25 + index * 12}% center` }}
                  />
                </button>
                {lookInside && (
                  <p className="mt-1 truncate text-center text-[8px] tracking-wide text-muted-foreground sm:text-[10px]">
                    {captions[index]?.toUpperCase()}
                  </p>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}

interface CarouselReview {
  name: string;
  title?: string;
  text: string;
  date?: string;
  rating?: number;
}
export function FreeReviewCarousel({
  reviews,
  segments = false,
}: {
  reviews: CarouselReview[];
  segments?: boolean;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [playing, setPlaying] = useState(true);
  const plugin = useRef(
    Autoplay({
      delay: 6500,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
    }),
  );
  // The real Autoplay plugin, rather than an independent setInterval, owns timing and drag interruption.
  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
      setCount(api.scrollSnapList().length);
    };
    const onPlay = () => setPlaying(true);
    const onStop = () => setPlaying(false);
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    api.on("autoplay:play", onPlay);
    api.on("autoplay:stop", onStop);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
      api.off("autoplay:play", onPlay);
      api.off("autoplay:stop", onStop);
    };
  }, [api]);
  const select = (index: number) => {
    plugin.current.stop();
    api?.scrollTo(index);
  };
  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true }}
      plugins={[plugin.current]}
      aria-label="Featured reviews"
      className="min-w-0"
      data-free-review-carousel
    >
      <CarouselContent className="ml-0" aria-live={playing ? "off" : "polite"}>
        {reviews.map((review, index) => (
          <CarouselItem
            key={review.name}
            className="pl-0"
            aria-hidden={current !== index}
          >
            <div className="mb-4 flex items-center gap-2">
              <Rating rating={review.rating ?? 4.7} size="sm" showValue />
              <Badge variant="success-light" size="xs">
                Verified
              </Badge>
            </div>
            {review.title && (
              <h3 className="mb-3 text-base font-semibold">{review.title}</h3>
            )}
            <blockquote
              className={cn(
                "leading-7",
                segments ? "text-lg font-medium sm:text-xl" : "text-sm",
              )}
            >
              {review.text}
            </blockquote>
            <p className="mt-5 text-xs">
              <strong>{review.name}</strong>
              <span className="ml-2 text-muted-foreground">
                · {review.date ?? "1 week ago"}
              </span>
            </p>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-5 flex items-center gap-1.5">
        {Array.from({ length: count }).map((_, index) => (
          <button
            type="button"
            key={reviews[index]?.name ?? index}
            aria-label={`Go to review ${index + 1} of ${reviews.length}: ${reviews[index]?.name}`}
            aria-pressed={current === index}
            onClick={() => select(index)}
            className={cn(
              "h-1.5 cursor-pointer rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2",
              segments ? "flex-1" : "w-1.5",
              current === index ? "bg-primary" : "bg-muted-foreground/25",
              current === index && !segments && "w-5",
            )}
          />
        ))}
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={playing ? "Pause reviews" : "Play reviews"}
          className="ml-2 size-6"
          onClick={() =>
            playing ? plugin.current.stop() : plugin.current.play()
          }
        >
          {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
        </Button>
      </div>
    </Carousel>
  );
}

/** c-carousel-11 snap state with the original Carousel controls; callers supply domain tiles. */
export function FreeProductRail({
  children,
  title,
  previousLabel,
  nextLabel,
  showCount = false,
  itemClassName = "basis-full sm:basis-1/2 lg:basis-1/4",
  slidesToScroll = "auto",
}: {
  children: ReactNode[];
  title: ReactNode;
  previousLabel: string;
  nextLabel: string;
  showCount?: boolean;
  itemClassName?: string;
  slidesToScroll?: number | "auto";
}) {
  const [api, setApi] = useState<CarouselApi>(),
    [current, setCurrent] = useState(0),
    [count, setCount] = useState(0);
  useEffect(() => {
    if (!api) return;
    const select = () => {
      setCurrent(api.selectedScrollSnap());
      setCount(api.scrollSnapList().length);
    };
    select();
    api.on("select", select);
    api.on("reInit", select);
    return () => {
      api.off("select", select);
      api.off("reInit", select);
    };
  }, [api]);
  return (
    <Carousel
      setApi={setApi}
      opts={{ align: "start", slidesToScroll }}
      aria-label={typeof title === "string" ? title : "Related products"}
      data-free-product-rail
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {showCount && (
            <Badge variant="secondary" aria-live="polite">
              {current + 1} / {count || 1}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <RailPrevious label={previousLabel} />
          <RailNext label={nextLabel} />
        </div>
      </div>
      <CarouselContent className="-ml-4 pb-1">
        {children.map((child, index) => (
          <CarouselItem key={index} className={cn("pl-4", itemClassName)}>
            {child}
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
import {
  CarouselNext as RailNextControl,
  CarouselPrevious as RailPreviousControl,
} from "@/components/ui/carousel";
function RailPrevious({ label }: { label: string }) {
  return (
    <RailPreviousControl
      className="static inset-auto m-0 translate-none"
      aria-label={label}
    />
  );
}
function RailNext({ label }: { label: string }) {
  return (
    <RailNextControl
      className="static inset-auto m-0 translate-none"
      aria-label={label}
    />
  );
}

/** Free c-carousel-8 inset controls + c-carousel-11 dots, with product-specific photographs. */
export function FreeCardImageCarousel({
  images,
}: {
  images: { src: string; alt: string }[];
}) {
  const [api, setApi] = useState<CarouselApi>(),
    [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);
  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true }}
      className="relative overflow-hidden rounded-lg bg-muted"
      aria-label="Ribbed tank set photos"
    >
      <CarouselContent className="ml-0">
        {images.map((image, index) => (
          <CarouselItem
            className="pl-0"
            key={image.alt}
            aria-hidden={current !== index}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="h-[360px] w-full object-cover md:h-[440px]"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <RailPreviousControl
        variant="secondary"
        className="left-2"
        aria-label="Previous slide"
      />
      <RailNextControl
        variant="secondary"
        className="right-2"
        aria-label="Next slide"
      />
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {images.map((image, index) => (
          <button
            type="button"
            key={image.alt}
            aria-label={`Go to product photo ${index + 1}`}
            aria-pressed={current === index}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "size-1.5 cursor-pointer rounded-full",
              current === index ? "bg-primary" : "bg-background/80",
            )}
          />
        ))}
      </div>
    </Carousel>
  );
}
