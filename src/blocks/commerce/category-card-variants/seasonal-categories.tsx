import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { CollectionBrowser, CollectionSaveProvider } from "../shop-hero-variants/collection-dialog";
import { collectionPrice } from "../shop-hero-variants/collection-data";
import { ShopImageCard } from "../shop-hero-variants/image-card";
import { CategoryBreadcrumb } from "./breadcrumb";
import { allDepartments, seasonalDepartments } from "./discovery-data";

/** Existing actual c-card-8 image/zoom/fade; missing full-card resting/reveal domain treatment extends it. */
export function SeasonalCategories() {
  return (
    <CollectionSaveProvider>
      <section
        className="mx-auto w-full max-w-[1440px] bg-background p-4 text-foreground sm:p-8 lg:p-10"
        data-category-card-variant="6"
      >
        <header className="mx-auto mb-8 max-w-xl space-y-4 text-center">
          <CategoryBreadcrumb current="Seasonal Edit" />
          <h2 className="text-3xl font-semibold tracking-tight leading-[1.08] sm:text-4xl">
            A season of possibilities
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Curated seasonal shopping. Easy layers, useful companions and a little room for good
            things.
          </p>
          <CollectionBrowser title="The complete seasonal edit" categories={allDepartments}>
            <Button variant="link" className="h-auto p-0 text-xs">
              Explore the seasonal edit <ArrowRight className="size-3.5" />
            </Button>
          </CollectionBrowser>
        </header>
        <div className="grid gap-5 md:grid-cols-2">
          {seasonalDepartments.map((collection) => (
            <div
              key={collection.id}
              className="group/seasonal relative"
              data-seasonal-category={collection.id}
            >
              <ShopImageCard
                image={collection.image}
                alt={`${collection.name} original seasonal still life`}
                className="h-[25rem] sm:h-[27rem] md:h-[26rem]"
              >
                <div
                  className="absolute inset-x-6 bottom-6 hidden items-end justify-between gap-4 transition-opacity duration-300 group-hover/seasonal:opacity-0 group-focus-within/seasonal:opacity-0 motion-reduce:transition-none md:flex"
                  aria-hidden="true"
                  data-seasonal-resting
                >
                  <p className="text-2xl font-semibold leading-tight">{collection.name}</p>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-white/40 bg-black/20 text-white"
                  >
                    {collection.label}
                  </Badge>
                </div>
                <div
                  className="absolute inset-0 flex flex-col justify-end bg-black/70 p-6 opacity-100 transition-opacity duration-300 motion-reduce:transition-none md:opacity-0 md:group-hover/seasonal:opacity-100 md:group-focus-within/seasonal:opacity-100 sm:p-8"
                  data-seasonal-detail
                >
                  <p className="text-[10px] uppercase tracking-[.2em] text-white/65">
                    Collection · {collection.label}
                  </p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-tight leading-[1.08] sm:text-4xl">
                    {collection.name}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">
                    {collection.description}
                  </p>
                  <p className="mt-4 text-xs text-white/75" data-seasonal-meta>
                    {collection.count} pieces <span className="px-2">·</span> From{" "}
                    {collectionPrice(collection.from)}
                  </p>
                  <CollectionBrowser title={collection.name} categories={collection.categories}>
                    <Button
                      className="mt-6 w-fit bg-white text-black hover:bg-white/90"
                      aria-label={`Shop seasonal ${collection.name}`}
                    >
                      Shop collection <ArrowRight className="size-4" />
                    </Button>
                  </CollectionBrowser>
                </div>
              </ShopImageCard>
            </div>
          ))}
        </div>
      </section>
    </CollectionSaveProvider>
  );
}
