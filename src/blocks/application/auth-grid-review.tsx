import { useEffect, useRef, useState, type CSSProperties } from "react";
import Autoplay from "embla-carousel-autoplay";
import { Boxes, Command, Layers, Orbit, Sparkles, Zap } from "lucide-react";
import { IconTile } from "@/components/reui/icon-tile";
import { Rating } from "@/components/reui/rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { demoAvatar } from "@/lib/demo-artwork";
import "./auth-grid-review.css";

const stories = [
  {
    name: "Mila Stone",
    team: "Orbit",
    quote: "A shared language helps our team move from a good idea to a useful product.",
  },
  {
    name: "Theo Vale",
    team: "Fieldwork",
    quote: "The small details add up to a calmer, more consistent working day.",
  },
  {
    name: "Ari Lane",
    team: "Northline",
    quote: "We can focus on what our customers need and keep the interface feeling familiar.",
  },
  {
    name: "Nora Reed",
    team: "Common Ground",
    quote: "One dependable starting point gives everyone more room to think through the details.",
  },
  {
    name: "Leo Park",
    team: "Daylight",
    quote:
      "Our designers and developers can work together without losing the little things that matter.",
  },
  {
    name: "Eva Brooks",
    team: "Plainview",
    quote: "A familiar foundation makes each new workflow easier to learn and simpler to improve.",
  },
];

const tileIcons = [Command, Orbit, Layers, Boxes, Zap, Sparkles];

/** Actual official free c-carousel-5 Autoplay and c-carousel-11 selected-snap pattern. */
export function RotatingCustomerPanel() {
  const [api, setApi] = useState<CarouselApi>();
  const [active, setActive] = useState(0);
  const [autoplay] = useState(() =>
    Autoplay({ delay: 6500, playOnInit: false, stopOnInteraction: true, stopOnMouseEnter: true }),
  );
  const manual = useRef(false);
  useEffect(() => {
    if (!api) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const selected = () => setActive(api.selectedScrollSnap());
    const playback = () => {
      if (reduce.matches || manual.current || document.hidden) autoplay.stop();
      else autoplay.play();
    };
    api.on("select", selected);
    reduce.addEventListener("change", playback);
    document.addEventListener("visibilitychange", playback);
    playback();
    return () => {
      api.off("select", selected);
      reduce.removeEventListener("change", playback);
      document.removeEventListener("visibilitychange", playback);
      autoplay.stop();
    };
  }, [api, autoplay]);
  const stop = () => {
    manual.current = true;
    autoplay.stop();
  };
  return (
    <aside className="auth-grid-review">
      <div className="auth-grid-tiles" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => {
          const Icon = tileIcons[index % tileIcons.length];
          return (
            <IconTile
              key={index}
              variant="outline"
              size="xl"
              style={
                {
                  "--tile-left": `${[8, 28, 51, 76, 91, 3, 87, 10, 33, 58, 80, 95, 4, 23, 48, 71, 91, 44][index]}%`,
                  "--tile-top": `${[8, 3, 10, 5, 22, 30, 43, 67, 82, 73, 89, 66, 91, 48, 94, 39, 3, 4][index]}%`,
                  "--tile-rotation": `${index % 2 ? 12 : -10}deg`,
                  "--tile-delay": `${-Math.floor(index / 4) * 4}s`,
                } as CSSProperties
              }
            >
              <Icon />
            </IconTile>
          );
        })}
      </div>
      <div className="auth-grid-story">
        <Rating rating={5} role="img" aria-label="5 out of 5 stars" />
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "start" }}
          plugins={[autoplay]}
          aria-label="Team stories"
          tabIndex={0}
          onPointerDown={stop}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") stop();
          }}
          onFocusCapture={stop}
        >
          <CarouselContent className="ml-0">
            {stories.map((story, index) => (
              <CarouselItem
                key={story.name}
                className="pl-0"
                aria-label={`Team story ${index + 1}`}
              >
                <figure aria-hidden={active !== index}>
                  <blockquote>{story.quote}</blockquote>
                  <figcaption>
                    <Avatar>
                      <AvatarImage src={demoAvatar(story.name)} alt="" />
                      <AvatarFallback>
                        {story.name
                          .split(" ")
                          .map((name) => name[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <strong>{story.name}</strong>
                    <span>Co-founder, {story.team}</span>
                  </figcaption>
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="auth-grid-story-controls" aria-label="Choose a team story">
            {stories.map((story, index) => (
              <Button
                key={story.name}
                variant="ghost"
                size="icon-sm"
                aria-label={`Show team story ${index + 1}`}
                aria-pressed={active === index}
                onClick={() => {
                  stop();
                  api?.scrollTo(index);
                }}
              >
                <span />
              </Button>
            ))}
          </div>
        </Carousel>
      </div>
    </aside>
  );
}
