/** Wishlist Boards: original collection data, native free counted Tabs and Frame media surfaces. */
import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { wishlistBoards, type WishlistCollection, type WishlistProduct } from "./wishlist-data";
import {
  CollectionCover,
  DeleteWishlistCollection,
  NewWishlistCollection,
} from "./wishlist-collection-controls";
import {
  BrowseWishlistItems,
  ShareWishlist,
  WishlistBagButton,
  WishlistEmpty,
  WishlistNotice,
} from "./wishlist-common";
import { WishlistProductCard } from "./wishlist-grid";

export function WishlistBoards() {
  const [collections, setCollections] = useState(wishlistBoards);
  const [tab, setTab] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = collections.find((collection) => collection.id === activeId);
  const [browse, setBrowse] = useState(false);
  const filters = [
    { value: "all", name: "All Collections", count: collections.length },
    {
      value: "recent",
      name: "Recently Updated",
      count: collections.filter((collection) => collection.daysAgo <= 3).length,
    },
    {
      value: "shared",
      name: "Shared",
      count: collections.filter((collection) => collection.shared).length,
    },
  ];
  const updateProducts = (id: string, update: (products: WishlistProduct[]) => WishlistProduct[]) =>
    setCollections((current) =>
      current.map((collection) =>
        collection.id === id
          ? {
              ...collection,
              products: update(collection.products),
              updated: "Updated just now",
              daysAgo: 0,
            }
          : collection,
      ),
    );
  const create = (collection: WishlistCollection) => {
    setCollections((current) => [...current, collection]);
    setTab("all");
    setActiveId(collection.id);
  };
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-16 sm:py-10" data-wishlist-variant="4">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">
            Wishlist Collections
          </h1>
          <p className="text-sm text-muted-foreground" data-wishlist-count>
            {collections.reduce((sum, collection) => sum + collection.products.length, 0)} items
            across {collections.length} collections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WishlistBagButton />
          <NewWishlistCollection onCreate={create} />
        </div>
      </header>
      <WishlistNotice />
      <Tabs value={tab} onValueChange={setTab}>
        <div className="mb-6 overflow-x-auto">
          <TabsList variant="line" className="w-full min-w-max" aria-label="Collection filters">
            {filters.map((filter) => (
              <TabsTrigger
                key={filter.value}
                value={filter.value}
                aria-label={`${filter.name}, ${filter.count} collections`}
                className="gap-2 px-4 font-normal"
              >
                <span>{filter.name}</span>
                <Badge variant="secondary" size="sm">
                  {filter.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {filters.map((filter) => (
          <TabsContent key={filter.value} value={filter.value}>
            <section
              className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3"
              aria-label="Wishlist collections"
            >
              {collections
                .filter(
                  (collection) =>
                    filter.value === "all" ||
                    (filter.value === "recent" ? collection.daysAgo <= 3 : collection.shared),
                )
                .map((collection) => (
                  <article
                    key={collection.id}
                    className="group relative"
                    data-wishlist-collection={collection.id}
                  >
                    <button
                      type="button"
                      className="block w-full cursor-pointer rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Open ${collection.name}`}
                      onClick={() => setActiveId(collection.id)}
                    >
                      <CollectionCover collection={collection} />
                      <h2 className="mt-3 font-semibold">{collection.name}</h2>
                    </button>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                      <span>{collection.products.length} items</span>
                      <span>·</span>
                      <span>{collection.updated}</span>
                      {collection.shared && (
                        <>
                          <span>·</span>
                          <Users className="size-3" />
                          <span>Shared</span>
                        </>
                      )}
                    </p>
                    <div className="absolute right-3 top-3 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100">
                      <ShareWishlist
                        title={collection.name}
                        products={collection.products}
                        label="Share"
                      />
                      <DeleteWishlistCollection
                        collection={collection}
                        onDelete={() =>
                          setCollections((current) =>
                            current.filter((item) => item.id !== collection.id),
                          )
                        }
                      />
                    </div>
                  </article>
                ))}
              <NewWishlistCollection
                onCreate={create}
                trigger={
                  <Button
                    variant="outline"
                    className="aspect-square h-auto flex-col gap-3 border-dashed font-normal text-muted-foreground"
                  >
                    <Plus className="size-5" />
                    New Collection
                  </Button>
                }
              />
            </section>
          </TabsContent>
        ))}
      </Tabs>
      <Dialog
        open={!!active}
        onOpenChange={(open) => {
          if (!open) setActiveId(null);
        }}
      >
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.name}</DialogTitle>
                <DialogDescription>
                  {active.description} · {active.products.length} saved items
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                <ShareWishlist title={active.name} products={active.products} />
                <BrowseWishlistItems
                  open={browse}
                  onOpenChange={setBrowse}
                  savedIds={active.products.map((product) => product.id)}
                  onSave={(product) =>
                    updateProducts(active.id, (current) =>
                      current.some((item) => item.id === product.id)
                        ? current
                        : [...current, product],
                    )
                  }
                  trigger={
                    <Button size="sm" variant="outline">
                      <Plus />
                      Add items
                    </Button>
                  }
                />
              </div>
              {active.products.length ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {active.products.map((product) => (
                    <WishlistProductCard
                      key={product.id}
                      product={product}
                      collection
                      onRemove={() =>
                        updateProducts(active.id, (current) =>
                          current.filter((item) => item.id !== product.id),
                        )
                      }
                    />
                  ))}
                </div>
              ) : (
                <WishlistEmpty onBrowse={() => setBrowse(true)} />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
