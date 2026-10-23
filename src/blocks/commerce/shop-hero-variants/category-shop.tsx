import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { CollectionBrowser, CollectionSaveProvider } from "./collection-dialog";
import { collectionCategories, collectionProducts, productsForCategories } from "./collection-data";

/**
 * Actual official free c-card-9 and c-item-4 compositions, MIT, Keenthemes.
 * https://reui.io/r/radix-nova/c-card-9.json
 * https://reui.io/r/radix-nova/c-item-4.json
 * Retains full-image CardContent and Item asChild navigation, with local category data.
 */
export function CategoryShopHero() {
  return (
    <CollectionSaveProvider>
      <section
        className="mx-auto w-full max-w-[1380px] bg-background px-5 py-10 text-foreground sm:px-8 sm:py-14"
        data-shop-hero-variant="4"
        aria-labelledby="category-shop-heading"
      >
        <header className="mb-9 flex flex-col items-start gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-muted-foreground">
              Bricklane Goods · The considered collection
            </p>
            <h2
              id="category-shop-heading"
              className="mt-4 text-4xl font-semibold tracking-[-.045em] leading-[1.06] sm:text-5xl"
            >
              Good things, by category.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              Pieces for the way you dress, the places you go and the spaces you call home. Find
              your everyday essentials.
            </p>
          </div>
          <CollectionBrowser
            title="All Bricklane pieces"
            categories={collectionCategories.map((category) => category.id)}
          >
            <Button variant="link" className="h-auto shrink-0 p-0 text-xs">
              See all {collectionProducts.length} pieces <ArrowRight className="size-4" />
            </Button>
          </CollectionBrowser>
        </header>
        <div
          className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4"
          data-category-shop-grid
        >
          {collectionCategories.map((category) => (
            <CollectionBrowser key={category.id} title={category.name} categories={[category.id]}>
              <Item asChild className="block min-w-0 rounded-none border-0 p-0">
                <button
                  className="group/category min-w-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
                  aria-label={`Shop ${category.name}`}
                  data-shop-category={category.id}
                >
                  <Card className="w-full rounded-none bg-transparent p-0 ring-0">
                    <CardContent className="flex flex-col gap-3 p-0">
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="size-full object-cover transition-transform duration-500 group-hover/category:scale-105 motion-reduce:transition-none"
                        />
                      </div>
                      <div className="flex flex-nowrap items-center gap-2">
                        <ItemContent className="min-w-0 gap-1">
                          <ItemTitle className="text-sm">{category.name}</ItemTitle>
                          <ItemDescription className="text-xs">
                            {productsForCategories([category.id]).length} styles
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <ArrowRight className="size-4 transition-transform group-hover/category:translate-x-1 motion-reduce:transition-none" />
                        </ItemActions>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              </Item>
            </CollectionBrowser>
          ))}
        </div>
      </section>
    </CollectionSaveProvider>
  );
}
