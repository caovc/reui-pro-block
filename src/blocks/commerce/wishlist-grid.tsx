import { useWishlistSession } from "./wishlist-session-context";
/** Actual free REUI c-tabs-7 counted line-tab composition with c-item-4 media anatomy.
 * Sources: https://reui.io/r/radix-nova/c-tabs-7.json and c-item-4.json (MIT, Keenthemes).
 * Original Tabs/Badge own tab state/semantics; Item supplies each media/content card.
 */
import { useState } from "react";
import { Check, Flame, Heart, PackageCheck, ShoppingBag, Tag, TrendingDown, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { cn } from "@/lib/utils";
import { savedEssentials, savedStudio } from "./wishlist-data";
import type { WishlistProduct, WishlistSignal } from "./wishlist-data";
import {
  BrowseWishlistItems,
  RestockAlert,
  ShareWishlist,
  WishlistBagButton,
  WishlistBreadcrumb,
  WishlistEmpty,
  WishlistImage,
  WishlistMoney,
  WishlistNotice,
  WishlistPrice,
  WishlistSignalBadge,
  WishlistStats,
} from "./wishlist-common";

export function WishlistProductCard({
  product,
  onRemove,
  move = false,
  collection = false,
}: {
  product: WishlistProduct;
  onRemove: () => void;
  move?: boolean;
  collection?: boolean;
}) {
  const { bag, add } = useWishlistSession();
  const added = !!bag[product.id];
  return (
    <Item
      className="group relative flex-col items-stretch gap-3 border-0 p-0"
      data-wishlist-item={product.id}
    >
      <ItemMedia
        className={cn(
          "relative w-full overflow-hidden rounded-lg bg-muted",
          move || collection ? "aspect-square" : "aspect-[4/5]",
        )}
      >
        <WishlistImage
          product={product}
          className={cn(product.stock === 0 && "opacity-60 grayscale")}
        />
        {!collection && (
          <div className="absolute left-3 top-3">
            <WishlistSignalBadge product={product} move={move} />
          </div>
        )}
        <Button
          variant="secondary"
          size="icon-sm"
          className="absolute right-3 top-3 size-6 bg-background/80 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Remove ${product.name} from ${collection ? "collection" : "wishlist"}`}
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </ItemMedia>
      <ItemContent className="gap-1.5">
        <p className={cn("text-xs text-muted-foreground", move && "uppercase tracking-wide")}>
          {move || collection ? product.brand : product.category}
        </p>
        <ItemTitle className="text-sm font-semibold">{product.name}</ItemTitle>
        <div className="flex flex-wrap items-baseline gap-2">
          <WishlistPrice product={product} decimals={move} />
          {!move && product.previousPrice && product.previousPrice > product.price && (
            <span className="text-xs text-emerald-600">
              Save <WishlistMoney amount={product.previousPrice - product.price} />
            </span>
          )}
        </div>
        {!collection && (
          <p className="min-h-4 text-xs leading-5 text-muted-foreground">
            {product.stock === 0
              ? move
                ? product.note
                : "Currently unavailable"
              : product.signal === "low" && !move
                ? `Only ${product.stock} left`
                : product.note}
          </p>
        )}
      </ItemContent>
      {product.stock > 0 ? (
        <Button
          size="sm"
          variant={move ? "default" : "outline"}
          disabled={added}
          aria-label={`${move ? "Move" : "Add"} ${product.name} to cart`}
          className="w-full"
          onClick={() => {
            add([product]);
            if (move) onRemove();
          }}
        >
          {added ? <Check /> : <ShoppingBag />}
          {added ? "Added To Cart" : move ? "Move To Cart" : "Add To Cart"}
        </Button>
      ) : (
        <RestockAlert product={product} label="Notify When Restocked" className="w-full" />
      )}
    </Item>
  );
}

type Filter = "all" | WishlistSignal;
const statusFilters = [
  { value: "all" as const, label: "All", icon: Heart },
  { value: "restock" as const, label: "Back In Stock", icon: PackageCheck },
  { value: "drop" as const, label: "Price Drop", icon: TrendingDown },
  { value: "low" as const, label: "Low Stock", icon: Flame },
  { value: "sale" as const, label: "Sale", icon: Tag },
];
export function WishlistGrid({ move = false }: { move?: boolean }) {
  const [items, setItems] = useState(move ? savedStudio : savedEssentials),
    [tab, setTab] = useState<Filter>("all"),
    [browseOpen, setBrowseOpen] = useState(false);
  const { bag, add } = useWishlistSession();
  const available = items.filter((product) => product.stock > 0 && !bag[product.id]);
  const filters = move
    ? statusFilters
    : [
        statusFilters[0],
        { ...statusFilters[2], label: "Price Drops" },
        statusFilters[1],
        { ...statusFilters[3], label: "Almost Gone" },
      ];
  const count = (value: Filter) =>
    value === "all" ? items.length : items.filter((product) => product.signal === value).length;
  const active = tab === "all" || count(tab) > 0 ? tab : "all";
  const remove = (id: string) =>
    setItems((current) => current.filter((product) => product.id !== id));
  const save = (product: WishlistProduct) =>
    setItems((current) =>
      current.some((p) => p.id === product.id) ? current : [...current, product],
    );
  return (
    <main
      className={cn(
        "mx-auto px-4 py-6 sm:py-10",
        move ? "max-w-7xl sm:px-16" : "max-w-6xl sm:px-8",
      )}
      data-wishlist-variant={move ? "3" : "2"}
    >
      {!move && <WishlistBreadcrumb onShop={() => setBrowseOpen(true)} />}
      <header className="mb-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1
              className={cn(
                "text-2xl font-semibold leading-tight tracking-tight",
                !move && "sm:text-[28px]",
              )}
            >
              {move ? "Wishlist" : "Saved For Later"}
            </h1>
            {move ? (
              <span className="text-sm text-muted-foreground" data-wishlist-count>
                {items.length} saved
              </span>
            ) : (
              <Badge variant="default" size="default" radius="full" data-wishlist-count>
                {items.length}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <WishlistBagButton />
            <ShareWishlist
              products={items}
              label={move ? "Share" : "Share List"}
              title={move ? "Wishlist" : "Saved For Later"}
            />
            <Button
              size="sm"
              disabled={!available.length}
              onClick={() => {
                add(available);
                if (move) {
                  setItems((current) =>
                    current.filter((product) => !available.some((p) => p.id === product.id)),
                  );
                  setTab("all");
                }
              }}
            >
              <ShoppingBag />
              {move ? (
                <>
                  Move All To Cart
                  <Badge variant="secondary" size="sm">
                    {available.length}
                  </Badge>
                </>
              ) : (
                <>Add {available.length} To Cart</>
              )}
            </Button>
          </div>
        </div>
        {!move && <WishlistStats products={items} />}
      </header>
      <WishlistNotice />
      <Tabs value={active} onValueChange={(value) => setTab(value as Filter)}>
        <div className="mb-5 min-w-0 overflow-x-auto border-b pb-1">
          <TabsList
            variant="line"
            className="w-full min-w-max"
            aria-label="Wishlist status filters"
          >
            {filters
              .filter((filter) => filter.value === "all" || count(filter.value) > 0)
              .map((filter) => {
                const Icon = filter.icon;
                return (
                  <TabsTrigger
                    key={filter.value}
                    value={filter.value}
                    aria-label={`${filter.label}, ${count(filter.value)} ${count(filter.value) === 1 ? "item" : "items"}`}
                    className="gap-2 px-4 font-normal sm:px-6"
                  >
                    {move && <Icon className="size-3.5" />}
                    {filter.label}
                    <Badge variant="secondary" size="sm">
                      {count(filter.value)}
                    </Badge>
                  </TabsTrigger>
                );
              })}
          </TabsList>
        </div>
        {filters.map((filter) => (
          <TabsContent key={filter.value} value={filter.value}>
            <section
              className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4"
              aria-label="Saved products"
            >
              {items
                .filter((product) => filter.value === "all" || product.signal === filter.value)
                .map((product) => (
                  <WishlistProductCard
                    key={product.id}
                    product={product}
                    move={move}
                    onRemove={() => remove(product.id)}
                  />
                ))}
            </section>
          </TabsContent>
        ))}
      </Tabs>
      {!items.length && <WishlistEmpty onBrowse={() => setBrowseOpen(true)} />}
      <BrowseWishlistItems
        savedIds={items.map((item) => item.id)}
        onSave={save}
        trigger={null}
        open={browseOpen}
        onOpenChange={setBrowseOpen}
      />
    </main>
  );
}
