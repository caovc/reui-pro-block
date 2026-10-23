import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription } from "@/components/ui/item";
import { Badge } from "@/components/reui/badge";
import { Rating } from "@/components/reui/rating";
import { ShopImageCard } from "./image-card";
import { CollectionBrowser, CollectionSaveProvider } from "./collection-dialog";
import { collectionPrice, collectionStories, productsForCategories } from "./collection-data";

export function DualCollectionHero() {
  return (
    <CollectionSaveProvider>
      <section
        className="mx-auto grid w-full max-w-[1500px] gap-4 bg-background p-4 text-foreground sm:p-6 md:grid-cols-2"
        data-shop-hero-variant="5"
        aria-label="Two considered collections"
      >
        {collectionStories.map((story) => {
          const products = productsForCategories(story.categories);
          const price = Math.min(...products.map((product) => product.price));
          return (
            <ShopImageCard
              key={story.id}
              image={story.image}
              alt={story.imageAlt}
              className="h-[39rem] rounded-xl sm:h-[43rem]"
            >
              <Badge
                variant="secondary"
                className="mb-auto self-start border-white/20 bg-black/55 text-white backdrop-blur-sm"
                radius="full"
              >
                {story.badge}
              </Badge>
              <div data-collection-story={story.id}>
                <p className="text-[10px] font-medium uppercase tracking-[.18em] text-white/75">
                  {story.eyebrow}
                </p>
                <h2 className="mt-3 max-w-[11ch] text-4xl font-semibold tracking-[-.04em] leading-[1.04] sm:text-5xl">
                  {story.title}
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">{story.description}</p>
                <Item className="mt-5 flex-nowrap gap-3 p-0 text-white">
                  <Rating
                    rating={story.rating}
                    size="sm"
                    aria-label={`Rated ${story.rating} out of 5`}
                    className="[&_[data-slot=rating-star-empty]]:size-3.5 [&_[data-slot=rating-star-filled]]:size-3.5"
                  />
                  <ItemContent>
                    <ItemDescription className="text-xs text-white/80">
                      {story.rating.toFixed(1)} · {story.reviews} reviews
                    </ItemDescription>
                  </ItemContent>
                </Item>
                <p className="mt-4 text-sm text-white/75">
                  From{" "}
                  <span className="text-xl font-semibold text-white">{collectionPrice(price)}</span>
                </p>
                <CollectionBrowser title={story.title} categories={story.categories}>
                  <Button className="mt-6 bg-white text-black hover:bg-white/90">
                    {story.cta} <ArrowRight className="size-4" />
                  </Button>
                </CollectionBrowser>
                <CollectionBrowser title={story.title} categories={story.categories}>
                  <Button
                    variant="link"
                    className="mt-3 flex h-auto max-w-full whitespace-normal p-0 text-left text-xs text-white/75 hover:text-white"
                  >
                    {products.length} pieces in the collection{" "}
                    <ArrowRight className="size-3.5 shrink-0" />
                  </Button>
                </CollectionBrowser>
              </div>
            </ShopImageCard>
          );
        })}
      </section>
    </CollectionSaveProvider>
  );
}
