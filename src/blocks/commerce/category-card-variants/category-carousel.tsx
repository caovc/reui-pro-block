import { useEffect, useState } from "react";
import { Badge } from "@/components/reui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { CollectionSaveProvider } from "../shop-hero-variants/collection-dialog";
import { CategoryCollectionCard } from "./collection-card";
import { categoryCollections } from "./data";

const pages = [categoryCollections.slice(0, 4), categoryCollections.slice(4, 8)];

/** Actual c-carousel-1 full-page slides + c-carousel-11 API/selection listener; four cards per page. */
export function CategoryCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (!api) return;
    const select = () => setPage(api.selectedScrollSnap());
    select();
    api.on("select", select);
    api.on("reInit", select);
    return () => {
      api.off("select", select);
      api.off("reInit", select);
    };
  }, [api]);
  return (
    <CollectionSaveProvider>
      <section
        className="mx-auto w-full max-w-[1440px] bg-background p-4 text-foreground sm:p-8 lg:p-10"
        data-category-card-variant="3"
        data-category-page={page + 1}
      >
        <Carousel
          setApi={setApi}
          opts={{ align: "start", watchDrag: true }}
          aria-label="Collection pages"
          tabIndex={0}
          className="w-full"
        >
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[.18em] text-muted-foreground">
                Bricklane Goods · Discover
              </p>
              <h2 className="text-3xl font-semibold tracking-tight leading-[1.08] sm:text-4xl">
                Filter by collections
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                A considered place for every part of your day. Browse a chapter and make it your
                own.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" aria-live="polite" data-category-page-counter>
                {page + 1} / {pages.length}
              </Badge>
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </header>
          <CarouselContent>
            {pages.map((collections, index) => (
              <CarouselItem
                key={index}
                aria-label={`Collection page ${index + 1}`}
                inert={page !== index}
                aria-hidden={page !== index}
              >
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {collections.map((collection) => (
                    <CategoryCollectionCard
                      key={collection.id}
                      collection={collection}
                      variant="tinted"
                    />
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>
    </CollectionSaveProvider>
  );
}
