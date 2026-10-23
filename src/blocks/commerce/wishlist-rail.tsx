/** Collection Rail: official free square AvatarGroup cover stacks, Item actions and real collection state. */
import { useState } from "react";
import { ChevronRight, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemTitle } from "@/components/ui/item";
import { cn } from "@/lib/utils";
import { collectionRail, type WishlistCollection, type WishlistProduct } from "./wishlist-data";
import { CollectionCoverStack, NewWishlistCollection } from "./wishlist-collection-controls";
import {
  BrowseWishlistItems,
  ShareWishlist,
  WishlistBagButton,
  WishlistBreadcrumb,
  WishlistEmpty,
  WishlistMoney,
  WishlistNotice,
} from "./wishlist-common";
import { WishlistProductCard } from "./wishlist-grid";
import { useWishlistSession } from "./wishlist-session-context";

export function CollectionRailWishlist() {
  const [collections, setCollections] = useState(collectionRail);
  const [activeId, setActiveId] = useState(collectionRail[0].id);
  const [browse, setBrowse] = useState(false);
  const active = collections.find((collection) => collection.id === activeId) ?? collections[0];
  const { bag, add } = useWishlistSession();
  const available = active.products.filter((product) => product.stock > 0 && !bag[product.id]);
  const total = active.products.reduce((sum, product) => sum + product.price, 0);
  const create = (collection: WishlistCollection) => {
    setCollections((current) => [...current, collection]);
    setActiveId(collection.id);
  };
  const updateProducts = (update: (products: WishlistProduct[]) => WishlistProduct[]) =>
    setCollections((current) =>
      current.map((collection) =>
        collection.id === active.id
          ? {
              ...collection,
              products: update(collection.products),
              updated: "Updated just now",
              daysAgo: 0,
            }
          : collection,
      ),
    );
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10" data-wishlist-variant="6">
      <WishlistBreadcrumb page="Collections" onShop={() => setBrowse(true)} />
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]">
            My Collections
          </h1>
          <p className="mt-2 text-sm text-muted-foreground" data-wishlist-count>
            {collections.length} collections ·{" "}
            {collections.reduce((sum, collection) => sum + collection.products.length, 0)} saved
            items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WishlistBagButton />
          <NewWishlistCollection
            onCreate={create}
            trigger={
              <Button variant="outline" size="sm">
                <Plus />
                New Collection
              </Button>
            }
          />
        </div>
      </header>
      <WishlistNotice />
      <div className="grid min-w-0 gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10">
        <nav className="space-y-2" aria-label="Saved collections">
          {collections.map((collection) => (
            <Item
              key={collection.id}
              className={cn(
                "p-0 transition-colors",
                collection.id === active.id ? "border-foreground bg-muted/30" : "border-border",
              )}
              data-wishlist-rail={collection.id}
            >
              <button
                type="button"
                className="flex min-w-0 w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Open ${collection.name}`}
                aria-current={collection.id === active.id ? "true" : undefined}
                onClick={() => setActiveId(collection.id)}
              >
                <CollectionCoverStack collection={collection} />
                <ItemContent className="min-w-0 gap-1">
                  <ItemTitle className="truncate text-sm font-semibold">
                    {collection.name}
                  </ItemTitle>
                  <p className="text-xs text-muted-foreground">
                    {collection.products.length} items ·{" "}
                    <WishlistMoney
                      amount={collection.products.reduce((sum, product) => sum + product.price, 0)}
                    />
                  </p>
                </ItemContent>
                <ChevronRight className="ml-auto size-4 shrink-0" />
              </button>
            </Item>
          ))}
        </nav>
        <section
          className="min-w-0"
          aria-label="Active collection"
          data-wishlist-active-collection={active.id}
        >
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-xl font-semibold">{active.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{active.description}</p>
              <p className="mt-1 text-xs text-muted-foreground" data-wishlist-collection-total>
                {active.products.length} {active.products.length === 1 ? "item" : "items"} ·{" "}
                <strong className="text-foreground">
                  <WishlistMoney amount={total} />
                </strong>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ShareWishlist title={active.name} products={active.products} label="Share" />
              <Button size="sm" disabled={!available.length} onClick={() => add(available)}>
                <ShoppingBag />
                Add {available.length} To Cart
              </Button>
            </div>
          </header>
          {active.products.length ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {active.products.map((product) => (
                <WishlistProductCard
                  key={product.id}
                  product={product}
                  collection
                  onRemove={() =>
                    updateProducts((products) => products.filter((item) => item.id !== product.id))
                  }
                />
              ))}
            </div>
          ) : (
            <WishlistEmpty onBrowse={() => setBrowse(true)} />
          )}
        </section>
      </div>
      <BrowseWishlistItems
        trigger={null}
        open={browse}
        onOpenChange={setBrowse}
        savedIds={active.products.map((product) => product.id)}
        onSave={(product) =>
          updateProducts((products) =>
            products.some((item) => item.id === product.id) ? products : [...products, product],
          )
        }
      />
    </main>
  );
}
