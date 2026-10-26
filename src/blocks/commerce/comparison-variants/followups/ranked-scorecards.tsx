import { useEffect, useState } from "react";
import { CircleHelp } from "lucide-react";
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
import "./visual-followups.css";

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
        description="An independent local extension. The reference link has no methodology target."
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
            A dark breakdown bar marks the highest score for that dimension across all six models.
            The wins badge counts those dimension leads. A high overall score does not guarantee the
            most dimension wins.
          </p>
          <p>
            Use the arrows, left/right keys or a horizontal drag to browse two pages of three
            models. Cart changes stay local.
          </p>
        </div>
      </DialogSurface>
    </Dialog>
  );
}

/** Actual free c-carousel-1 navigation and c-carousel-11 API selection subscription.
 * The rendered reference has arrows and a fraction, rather than dot controls.
 */
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
      eyebrow=""
      title="Ranked by overall score"
      description="Five dimensions, six fictional models. Compare scores out of ten at a glance."
      actions={<ScoringMethodology />}
    >
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: false }}
        tabIndex={0}
        aria-label="Ranked headphone scorecards"
        className="w-full"
      >
        <div className="comparison-ranked-controls">
          <span className="sr-only" aria-live="polite" data-ranked-page>
            Ranks {page * 3 + 1}–{page * 3 + 3} of 6
          </span>
          <span className="text-xs text-muted-foreground" aria-hidden="true">
            {page + 1} / 2
          </span>
          <CarouselPrevious className="static inset-auto my-0" />
          <CarouselNext className="static inset-auto my-0" />
        </div>
        <CarouselContent>
          {pages.map((products, pageIndex) => (
            <CarouselItem
              key={pageIndex}
              inert={page !== pageIndex}
              aria-hidden={page !== pageIndex}
            >
              <div
                className="grid items-stretch gap-4 p-1 md:grid-cols-3 md:gap-5"
                data-score-page={pageIndex}
              >
                {products.map(({ product, overall, dimensions, rank, wins }) => (
                  <Frame
                    key={product.id}
                    dense
                    spacing="lg"
                    className="comparison-ranked-card"
                    data-scorecard={product.id}
                  >
                    <FramePanel className="comparison-ranked-card-body">
                      {rank === 1 && (
                        <Badge variant="warning" className="comparison-top-pick" data-top-pick>
                          Top pick
                        </Badge>
                      )}
                      <div className="flex h-20 shrink-0 items-center gap-3">
                        <img
                          src={product.image}
                          alt={`${product.name} original headphone illustration`}
                          className="size-20 shrink-0 rounded-lg object-contain"
                        />
                        <div className="flex min-w-0 flex-col gap-1">
                          <h3 className="text-base font-semibold leading-6">{product.name}</h3>
                          <p className="text-xs leading-4 text-muted-foreground">
                            Over-ear headphones
                          </p>
                          <ComparisonRating product={product} />
                        </div>
                      </div>
                      <div className="mt-5 flex h-5 shrink-0 items-center justify-between">
                        <strong className="text-sm font-semibold">#{rank}</strong>
                        <Badge
                          variant="secondary"
                          size="xs"
                          className="text-xs"
                          data-dimension-wins
                        >
                          {wins} {wins === 1 ? "win" : "wins"}
                        </Badge>
                      </div>
                      <div className="mt-2 flex h-[30px] shrink-0 items-baseline gap-1">
                        <strong
                          className="text-3xl font-semibold leading-[30px] tracking-tight"
                          data-overall-score
                        >
                          {overall.toFixed(1)}
                        </strong>
                        <span className="text-xs text-muted-foreground">/ 10</span>
                      </div>
                      <Progress
                        value={overall * 10}
                        aria-valuemin={0}
                        aria-valuemax={10}
                        aria-valuenow={overall}
                        aria-valuetext={`${overall.toFixed(1)} out of 10`}
                        aria-label={`${product.name} overall score`}
                        className="mt-[9px] h-2 shrink-0"
                        data-overall-meter
                      />
                      <div className="mt-5 flex shrink-0 flex-col gap-3">
                        {scoreDimensions.map(({ id, label }) => {
                          const best = dimensions[id] === bestDimensionScores[id];
                          return (
                            <div
                              key={id}
                              className={cn(
                                "comparison-dimension-row",
                                best && "font-semibold text-foreground",
                              )}
                              data-score-dimension={id}
                              data-best={best}
                            >
                              <span>{label}</span>
                              {/* Actual c-progress-8 indicator-slot composition; no replacement meter. */}
                              <Progress
                                value={dimensions[id] * 10}
                                aria-valuemin={0}
                                aria-valuemax={10}
                                aria-valuenow={dimensions[id]}
                                aria-valuetext={`${dimensions[id].toFixed(1)} out of 10`}
                                aria-label={`${product.name} ${label}`}
                                className={cn(
                                  "h-1.5 **:data-[slot=progress-indicator]:bg-muted-foreground/35",
                                  best && "**:data-[slot=progress-indicator]:bg-primary",
                                )}
                              />
                              <span className="text-right tabular-nums">
                                {dimensions[id].toFixed(1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-7 flex h-7 shrink-0 items-center justify-between gap-3">
                        <strong className="text-lg font-semibold leading-7">
                          {compareMoney(product.price)}
                        </strong>
                        <div className="w-32">
                          <ComparisonCartAction id={product.id} compact />
                        </div>
                      </div>
                    </FramePanel>
                  </Frame>
                ))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </ComparisonLayout>
  );
}
