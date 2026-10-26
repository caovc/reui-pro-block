import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { CollectionBrowser, CollectionSaveProvider } from "../shop-hero-variants/collection-dialog";
import { collectionPrice } from "../shop-hero-variants/collection-data";
import { ShopImageCard } from "../shop-hero-variants/image-card";
import { CategoryBreadcrumb } from "./breadcrumb";
import { allDepartments, collectionGuides, uniqueCatalogCount } from "./discovery-data";

/** Actual c-item-2 media/content/actions composition with existing c-card-8 image and real child routes. */
export function CollectionGuides() {
  return (
    <CollectionSaveProvider>
      <section
        className="mx-auto w-full max-w-[1280px] bg-background p-4 text-foreground sm:p-8 lg:p-10"
        data-category-card-variant="5"
      >
        <CategoryBreadcrumb current="Collection Guides" />
        <header className="mb-8 mt-6 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[.18em] text-muted-foreground">
              Bricklane Goods · A little direction
            </p>
            <h2 className="text-3xl font-semibold tracking-tight leading-[1.08] sm:text-4xl">
              The collection guides
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 line-clamp-none text-muted-foreground">
              Not sure where to start? A few thoughtful routes through the things that make a good
              everyday.
            </p>
          </div>
          <CollectionBrowser title="All Bricklane pieces" categories={allDepartments}>
            <Button variant="outline">
              Browse collections <ArrowRight className="size-4" />
            </Button>
          </CollectionBrowser>
        </header>
        <ItemGroup className="gap-0! divide-y">
          {collectionGuides.map((guide, index) => (
            <Item
              key={guide.id}
              className="items-stretch gap-6 rounded-none border-0 px-0 py-7 first:pt-0 last:pb-0 md:flex-nowrap"
              data-guide={guide.id}
            >
              <ShopImageCard
                image={guide.image}
                alt={`${guide.name} original still life`}
                className="h-64 w-full shrink-0 md:h-60 md:w-72 lg:w-80"
              >
                <div className="mb-auto self-start">
                  <Badge variant="outline" className="border-white/40 bg-black/55 text-white">
                    {guide.badge}
                  </Badge>
                </div>
                <CollectionBrowser title={guide.name} categories={guide.categories}>
                  <Button
                    size="sm"
                    className="w-fit bg-white text-black hover:bg-white/90"
                    aria-label={`View guide ${guide.name}`}
                  >
                    View guide <ArrowUpRight className="size-3.5" />
                  </Button>
                </CollectionBrowser>
              </ShopImageCard>
              <ItemContent className="min-w-0 justify-center gap-4 py-1">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Guide 0{index + 1}
                </p>
                <ItemTitle className="text-xl font-semibold leading-[1.12] sm:text-2xl">
                  <h3>{guide.name}</h3>
                </ItemTitle>
                <ItemDescription className="max-w-xl text-sm leading-6 line-clamp-none">
                  {guide.description}
                </ItemDescription>
                <p className="text-xs text-muted-foreground" data-guide-meta>
                  {guide.count} pieces <span className="px-2">·</span> Start from{" "}
                  <span className="font-medium text-foreground">{collectionPrice(guide.from)}</span>
                </p>
                <div
                  className="flex flex-wrap items-center gap-x-2 gap-y-1"
                  aria-label={`${guide.name} departments`}
                >
                  {guide.checklist.map((category, categoryIndex) => (
                    <span key={category.id} className="inline-flex items-center gap-2">
                      {categoryIndex > 0 && (
                        <span className="text-muted-foreground" aria-hidden="true">
                          ·
                        </span>
                      )}
                      <CollectionBrowser title={category.name} categories={[category.id]}>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-xs underline-offset-4"
                          aria-label={`${guide.name}: shop ${category.name}`}
                        >
                          {category.name}
                        </Button>
                      </CollectionBrowser>
                    </span>
                  ))}
                </div>
              </ItemContent>
              <ItemActions className="hidden self-center lg:flex">
                <ArrowRight className="size-5 text-muted-foreground" aria-hidden="true" />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
        <p className="mt-8 border-t pt-5 text-xs leading-5 text-muted-foreground">
          {uniqueCatalogCount} original sample pieces. Guide budgets show the lowest actual piece
          price, with no minimum order or bundle purchase.
        </p>
      </section>
    </CollectionSaveProvider>
  );
}
