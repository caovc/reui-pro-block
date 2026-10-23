import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productsForCategories } from "./collection-data";
import { CollectionBrowser, CollectionSaveProvider } from "./collection-dialog";
import { ShopImageCard } from "./image-card";
import { DropReminder } from "./drop-reminder";
import { dropCollections } from "./release-data";
import { ReleaseStatus } from "./release-status";

/** Actual official c-tabs-9 controlled API and distinct TabsContent compositions. */
export function CollectionSwitcherHero() {
  const [active, setActive] = useState(dropCollections[0].id);
  const [reminder, setReminder] = useState<string | null>(null);
  const live = dropCollections.filter((collection) => collection.phase !== "upcoming").length;
  return (
    <CollectionSaveProvider>
      <section
        className="mx-auto w-full max-w-[1440px] bg-background p-4 text-foreground sm:p-7"
        data-shop-hero-variant="7"
        data-active-collection={active}
        aria-label="Collection switcher"
      >
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">
              Bricklane Goods · Current chapters
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight leading-tight sm:text-3xl">
              Find your collection.
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {live} live <span className="px-1.5">/</span>
            {dropCollections.length - live} upcoming
          </p>
        </header>
        <Tabs value={active} onValueChange={setActive} className="gap-4">
          <TabsList
            className="grid h-auto! w-full shrink-0 grid-cols-3 gap-2 bg-transparent p-0"
            aria-label="Shop collections"
          >
            {dropCollections.map((collection, index) => (
              <TabsTrigger
                key={collection.id}
                value={collection.id}
                className="relative h-auto min-w-0 flex-col items-start gap-2 whitespace-normal rounded-lg border border-border p-2.5 text-left data-active:bg-muted/60 sm:flex-row sm:items-center sm:gap-3 sm:p-3"
              >
                <img
                  src={collection.image}
                  alt=""
                  className="size-9 shrink-0 rounded object-cover sm:size-12"
                />
                <span className="absolute end-2 top-2 font-mono text-[9px] text-muted-foreground sm:end-3 sm:top-3">
                  0{index + 1}
                </span>
                <ItemContent className="w-full min-w-0 gap-1">
                  <span className="text-[10px] font-medium leading-4 sm:text-sm">
                    {collection.name}
                  </span>
                  <span className="flex flex-wrap items-center gap-1 text-[9px] text-muted-foreground sm:text-xs">
                    <ReleaseStatus
                      phase={collection.phase}
                      label={`${productsForCategories(collection.categories).length} pieces`}
                    />
                  </span>
                </ItemContent>
              </TabsTrigger>
            ))}
          </TabsList>
          {dropCollections.map((collection) => {
            const count = productsForCategories(collection.categories).length;
            return (
              <TabsContent key={collection.id} value={collection.id} className="mt-0 min-w-0">
                <ShopImageCard
                  image={collection.image}
                  alt={`${collection.name} original still life`}
                  className="h-auto rounded-xl [&>div:last-child]:min-h-[36rem] sm:[&>div:last-child]:min-h-[35rem]"
                >
                  <div className="mb-auto self-start">
                    <ReleaseStatus phase={collection.phase} label={collection.status} onImage />
                  </div>
                  <div className="mt-16 max-w-xl">
                    <p className="text-[10px] uppercase tracking-[.2em] text-white/80">
                      {collection.eyebrow}
                    </p>
                    <h3 className="mt-3 text-4xl font-semibold tracking-[-.04em] leading-[1.04] sm:text-6xl">
                      {collection.title}
                    </h3>
                    <p className="mt-4 max-w-md text-sm leading-6 text-white/80">
                      {collection.description}
                    </p>
                    <Item className="mt-4 p-0 text-white">
                      <ItemContent>
                        <ItemTitle className="text-xs font-normal text-white/75">
                          {count} pieces in this collection
                        </ItemTitle>
                        <ItemDescription className="text-xs text-white/65">
                          Small runs. Considered details.
                        </ItemDescription>
                      </ItemContent>
                    </Item>
                    <div className="mt-6 flex flex-wrap items-start gap-4">
                      {collection.phase === "upcoming" ? (
                        <DropReminder email={reminder} onSave={setReminder} />
                      ) : (
                        <CollectionBrowser
                          title={collection.name}
                          categories={collection.categories}
                        >
                          <Button className="bg-white text-black hover:bg-white/90">
                            Shop this collection <ArrowRight className="size-4" />
                          </Button>
                        </CollectionBrowser>
                      )}
                      <CollectionBrowser title={collection.name} categories={collection.categories}>
                        <Button variant="link" className="h-8 p-0 text-xs text-white">
                          Preview all {count} pieces <ArrowRight className="size-3.5" />
                        </Button>
                      </CollectionBrowser>
                    </div>
                  </div>
                </ShopImageCard>
              </TabsContent>
            );
          })}
        </Tabs>
      </section>
    </CollectionSaveProvider>
  );
}
