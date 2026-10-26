import { Fragment } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollectionBrowser, CollectionSaveProvider } from "../shop-hero-variants/collection-dialog";
import { collectionPrice } from "../shop-hero-variants/collection-data";
import { ShopImageCard } from "../shop-hero-variants/image-card";
import { CategoryBreadcrumb } from "./breadcrumb";
import { allDepartments, directoryCollections, uniqueCatalogCount } from "./discovery-data";

const featured = directoryCollections[0];

export function FeaturedDepartment() {
  return (
    <CollectionSaveProvider>
      <section
        className="mx-auto w-full max-w-[1440px] bg-background p-4 text-foreground sm:p-8 lg:p-10"
        data-category-card-variant="4"
      >
        <CategoryBreadcrumb current="Departments" />
        <header className="mb-7 mt-6 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[.18em] text-muted-foreground">
              Bricklane Goods · The catalog
            </p>
            <h2 className="text-3xl font-semibold tracking-tight leading-[1.08] sm:text-4xl">
              Good things, all in one place.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Explore a department or take a different route through a considered edit.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="font-medium text-foreground" data-unique-catalog-count>
              {uniqueCatalogCount}
            </strong>{" "}
            unique pieces <span className="px-1.5">·</span>
            <span data-directory-count>{directoryCollections.length}</span> collection paths
          </p>
        </header>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <ShopImageCard
            image={featured.image}
            alt="Original Bricklane featured clothing still life"
            className="h-[30rem] lg:h-[620px]"
          >
            {featured.badge && (
              <div className="mb-auto self-start">
                <Badge variant="outline" className="border-white/40 bg-black/55 text-white">
                  {featured.badge}
                </Badge>
              </div>
            )}
            <p className="text-[10px] uppercase tracking-[.2em] text-white/75">
              Featured department
            </p>
            <h3 className="mt-3 text-4xl font-semibold tracking-tight leading-[1.08] sm:text-5xl">
              {featured.name}
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">{featured.description}</p>
            <p className="mt-4 text-xs text-white/80" data-featured-meta>
              {featured.count} pieces <span className="px-2">·</span> From{" "}
              {collectionPrice(featured.from)}
            </p>
            <CollectionBrowser title={featured.name} categories={featured.categories}>
              <Button className="mt-6 w-fit bg-white text-black hover:bg-white/90">
                Explore clothing <ArrowRight className="size-4" />
              </Button>
            </CollectionBrowser>
          </ShopImageCard>
          <ScrollArea
            className="h-[32rem] w-full rounded-xl border lg:h-[620px]"
            aria-label="Department index"
            role="region"
            data-department-index
          >
            <div className="p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between px-2 text-xs">
                <h3 className="font-medium">Explore the collections</h3>
                <span className="text-muted-foreground">
                  {directoryCollections.length - 1} more paths
                </span>
              </div>
              <ItemGroup className="gap-0!">
                {directoryCollections.slice(1).map((collection, index) => (
                  <Fragment key={collection.id}>
                    {index > 0 && <ItemSeparator className="my-1" />}
                    <CollectionBrowser title={collection.name} categories={collection.categories}>
                      <Item
                        asChild
                        size="sm"
                        className="rounded-lg py-4 text-left hover:bg-muted/60"
                      >
                        <button
                          type="button"
                          aria-label={`Explore ${collection.name}`}
                          data-department-row={collection.id}
                        >
                          <ItemMedia variant="image" className="size-20! rounded-lg">
                            <img src={collection.image} alt="" />
                          </ItemMedia>
                          <ItemContent className="min-w-0 gap-2">
                            <ItemTitle className="leading-5">{collection.name}</ItemTitle>
                            <ItemDescription className="text-[11px]" data-department-meta>
                              {collection.count} pieces <span className="px-1">·</span> From{" "}
                              {collectionPrice(collection.from)}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </ItemActions>
                        </button>
                      </Item>
                    </CollectionBrowser>
                  </Fragment>
                ))}
              </ItemGroup>
            </div>
          </ScrollArea>
        </div>
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <p className="max-w-lg text-xs leading-5 text-muted-foreground">
            Collection paths can overlap. Piece counts describe each edit; the catalog total counts
            every piece once.
          </p>
          <CollectionBrowser title="All Bricklane pieces" categories={allDepartments}>
            <Button variant="outline">
              Browse all {uniqueCatalogCount} pieces <ArrowRight className="size-4" />
            </Button>
          </CollectionBrowser>
        </footer>
      </section>
    </CollectionSaveProvider>
  );
}
