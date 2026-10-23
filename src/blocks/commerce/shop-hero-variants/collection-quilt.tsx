import { ArrowRight } from "lucide-react";
import { collectionPrice } from "./collection-data";
import { CollectionBrowser, CollectionSaveProvider } from "./collection-dialog";
import { ShopImageCard } from "./image-card";
import { quiltCollections } from "./release-data";
import { ReleaseStatus } from "./release-status";

export function CollectionQuiltHero() {
  return (
    <CollectionSaveProvider>
      <section
        className="grid w-full grid-cols-1 gap-0 bg-background md:grid-cols-2"
        data-shop-hero-variant="8"
        aria-label="Collection quilt"
      >
        {quiltCollections.map((collection) => (
          <CollectionBrowser
            key={collection.id}
            title={collection.name}
            categories={[collection.id]}
          >
            <button
              className="group/quilt relative block min-w-0 text-left outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              aria-label={`Explore ${collection.name}`}
              data-quilt-collection={collection.id}
            >
              <ShopImageCard
                image={collection.image}
                alt={collection.name}
                className="h-[31rem] rounded-none ring-0 [&>img]:rounded-none! sm:h-[34rem] md:h-[32rem]"
              >
                <div className="mb-auto self-start">
                  <ReleaseStatus phase={collection.phase} label={collection.status} onImage />
                </div>
                <div className="transition-transform duration-300 group-hover/quilt:-translate-y-1 motion-reduce:transition-none">
                  <h2 className="text-4xl font-semibold tracking-[-.04em] leading-[1.04] sm:text-5xl">
                    {collection.name}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-white/80">
                      {collection.count} pieces <span className="px-1.5">·</span>
                      {collectionPrice(collection.from)}–{collectionPrice(collection.to)}
                    </p>
                    <span className="flex items-center gap-2 text-sm font-medium">
                      Shop{" "}
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover/quilt:translate-x-1 motion-reduce:transition-none" />
                    </span>
                  </div>
                </div>
              </ShopImageCard>
            </button>
          </CollectionBrowser>
        ))}
      </section>
    </CollectionSaveProvider>
  );
}
