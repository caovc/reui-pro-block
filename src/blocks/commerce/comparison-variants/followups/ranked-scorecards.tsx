import { useEffect, useState } from "react";
import { Award, CircleHelp, Trophy } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Dialog, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DialogSurface } from "../../../application/dialog-variants/first-run/free/dialog-surface";
import { ComparisonCartAction } from "../cart";
import { compareMoney } from "../data";
import { ComparisonLayout, ComparisonRating } from "../shared";
import { bestDimensionScores, rankedProducts, scoreDimensions } from "./score-data";

function ScoringMethodology() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CircleHelp data-icon="inline-start" />
          How we score
        </Button>
      </DialogTrigger>
      <DialogSurface
        id={0}
        title="About these demo scores"
        description="An illustrative scoring system, not a real headphone test."
        footer={
          <DialogClose asChild>
            <Button>Back to rankings</Button>
          </DialogClose>
        }
      >
        <div className="flex flex-col gap-4 text-sm leading-6">
          <p>
            Every product, rating and score in this preview is fictional. No listening sessions or
            laboratory tests were performed.
          </p>
          <p>
            The overall score is an independently stored editorial value out of ten. It determines
            the ranking; it is not an average of the five dimension bars.
          </p>
          <p>
            A highlighted bar marks the highest score for that dimension across all six models. The
            wins badge counts those dimension leads. A high overall score does not guarantee the
            most dimension wins.
          </p>
          <p>
            Use the arrows, page dots, left/right keys or a horizontal drag to browse two pages of
            three models. Cart changes stay local.
          </p>
        </div>
      </DialogSurface>
    </Dialog>
  );
}

/** Actual REUI c-carousel-1 native navigation plus c-carousel-11 setApi/select/dots. */
export function RankedScorecards() {
  const [api, setApi] = useState<CarouselApi>();
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (!api) return;
    const sync = () => setPage(api.selectedScrollSnap());
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);
  const pages = [rankedProducts.slice(0, 3), rankedProducts.slice(3, 6)];
  return (
    <ComparisonLayout
      variant={4}
      title="The shortlist, scored."
      description="Six fictional models. Five dimensions. Find the balance that sounds right for you."
      actions={<ScoringMethodology />}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <Award className="size-4" />
          Illustrative scores · Out of 10
        </span>
        <span aria-live="polite" data-ranked-page>
          Ranks {page * 3 + 1}–{page * 3 + 3} of 6
        </span>
      </div>
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: false }}
        tabIndex={0}
        aria-label="Ranked headphone scorecards"
        className="w-full"
      >
        <CarouselContent>
          {pages.map((products, pageIndex) => (
            <CarouselItem
              key={pageIndex}
              inert={page !== pageIndex}
              aria-hidden={page !== pageIndex}
            >
              <div className="grid items-stretch gap-4 md:grid-cols-3" data-score-page={pageIndex}>
                {products.map(({ product, overall, dimensions, rank, wins }) => (
                  <Frame key={product.id} stacked spacing="sm" data-scorecard={product.id}>
                    <FramePanel fit>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" size="sm">
                          #{rank}
                        </Badge>
                        {rank === 1 && (
                          <Badge variant="default" size="sm">
                            <Trophy />
                            Top pick
                          </Badge>
                        )}
                      </div>
                      <img
                        src={product.image}
                        alt={`${product.name} original headphone illustration`}
                        className="my-3 h-40 w-full rounded-lg object-contain"
                      />
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-col gap-2">
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          <ComparisonRating product={product} />
                        </div>
                        <div className="text-right">
                          <strong className="text-3xl tracking-tight" data-overall-score>
                            {overall.toFixed(1)}
                          </strong>
                          <p className="text-[10px] text-muted-foreground">overall / 10</p>
                        </div>
                      </div>
                    </FramePanel>
                    <FramePanel>
                      <div className="flex flex-col gap-4">
                        {scoreDimensions.map(({ id, label }) => {
                          const best = dimensions[id] === bestDimensionScores[id];
                          return (
                            <div
                              key={id}
                              className="flex flex-col gap-1.5"
                              data-score-dimension={id}
                              data-best={best}
                            >
                              <div className="flex items-center justify-between gap-1 text-xs">
                                <span>{label}</span>
                                <span className="flex items-center gap-1 font-medium">
                                  {best && (
                                    <Trophy
                                      className="size-3 text-success"
                                      aria-label="Best in class"
                                    />
                                  )}
                                  {dimensions[id].toFixed(1)}
                                </span>
                              </div>
                              {/* Actual free c-progress-8 indicator slot customization, no painted substitute bar. */}
                              <Progress
                                value={dimensions[id] * 10}
                                aria-label={`${product.name} ${label}`}
                                className={cn(
                                  "h-1.5",
                                  best && "**:data-[slot=progress-indicator]:bg-success",
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </FramePanel>
                    <FramePanel fit>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <strong>{compareMoney(product.price)}</strong>
                        <Badge
                          variant={wins ? "success-light" : "secondary"}
                          size="sm"
                          data-dimension-wins
                        >
                          {wins} {wins === 1 ? "win" : "wins"}
                        </Badge>
                      </div>
                      <ComparisonCartAction id={product.id} />
                    </FramePanel>
                  </Frame>
                ))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-5 flex items-center justify-center gap-3">
          <CarouselPrevious className="static inset-auto my-0" />
          <div className="flex items-center gap-2">
            {pages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to rankings page ${index + 1}`}
                aria-current={page === index ? "page" : undefined}
                className={cn(
                  "h-2 rounded-full bg-primary transition-all focus-visible:outline-2 focus-visible:outline-offset-4",
                  page === index ? "w-5" : "w-2 opacity-30 hover:opacity-60",
                )}
              />
            ))}
          </div>
          <CarouselNext className="static inset-auto my-0" />
        </div>
      </Carousel>
    </ComparisonLayout>
  );
}
