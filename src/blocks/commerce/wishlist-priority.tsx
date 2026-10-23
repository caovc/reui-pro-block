/** Priority Wishlist: actual free Item media/action anatomy and local priority mutations.
 * Public preview exposes a cycle action rather than drag handles; no drag gesture is invented.
 */
import { useState } from "react";
import { ArrowDownUp, Check, ShoppingBag, Trash2 } from "lucide-react";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { priorityProducts } from "./wishlist-data";
import { useWishlistSession } from "./wishlist-session-context";
import {
  BrowseWishlistItems,
  RestockAlert,
  ShareWishlist,
  WishlistBagButton,
  WishlistEmpty,
  WishlistImage,
  WishlistMoney,
  WishlistNotice,
} from "./wishlist-common";

type Priority = "must" | "later" | "maybe";
const groups: { id: Priority; name: string; description: string; next: Priority }[] = [
  { id: "must", name: "Must Have", description: "Pieces you plan to buy first.", next: "later" },
  {
    id: "later",
    name: "Save For Later",
    description: "Holding off, but still on the radar.",
    next: "maybe",
  },
  { id: "maybe", name: "Maybe", description: "Light interest. Move up when ready.", next: "must" },
];
export function PriorityWishlist() {
  const [items, setItems] = useState(priorityProducts);
  const [browse, setBrowse] = useState(false);
  const { bag, add } = useWishlistSession();
  const total = items.reduce((sum, item) => sum + (item.stock > 0 ? item.price : 0), 0);
  const savings = items.reduce(
    (sum, item) => sum + Math.max(0, (item.previousPrice ?? item.price) - item.price),
    0,
  );
  return (
    <main className="mx-auto max-w-3xl px-5 py-6 sm:px-8 sm:py-10" data-wishlist-variant="5">
      <header className="mb-8">
        <p className="mb-3 text-[11px] uppercase tracking-[.2em] text-muted-foreground">Wishlist</p>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          My Saved Items
        </h1>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <p
            className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground"
            data-wishlist-count
          >
            <span>{items.length} items</span>
            <span>·</span>
            <span data-wishlist-priority-total>
              <WishlistMoney amount={total} /> total
            </span>
            <span>·</span>
            <span className="text-emerald-600">
              <WishlistMoney amount={savings} /> in savings
            </span>
          </p>
          <div className="flex gap-2">
            <WishlistBagButton />
            <ShareWishlist title="My Saved Items" label="Share Wishlist" products={items} />
          </div>
        </div>
      </header>
      <WishlistNotice />
      {groups.map((group) => (
        <section
          key={group.id}
          className="mb-10"
          aria-label={group.name}
          data-wishlist-priority={group.id}
        >
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-lg font-semibold">{group.name}</h2>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </div>
          {items
            .filter((item) => item.priority === group.id)
            .map((item) => (
              <article
                key={item.id}
                data-wishlist-item={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 border-b py-4 last:border-0 sm:flex sm:gap-5"
              >
                <Item className="min-w-0 flex-1 flex-nowrap gap-3 border-0 p-0 sm:gap-5">
                  <ItemMedia>
                    <WishlistImage product={item} className="size-16 rounded-lg sm:size-20" />
                  </ItemMedia>
                  <ItemContent className="min-w-0 gap-1">
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                    <ItemTitle className="text-sm font-semibold sm:text-base">
                      {item.name}
                    </ItemTitle>
                    <p className="flex flex-wrap gap-x-1.5 text-xs text-muted-foreground">
                      <span>{item.finish}</span>
                      <span>·</span>
                      <span>{item.note}</span>
                      {item.previousPrice && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-600">
                            Save <WishlistMoney amount={item.previousPrice - item.price} />
                          </span>
                        </>
                      )}
                    </p>
                  </ItemContent>
                </Item>
                <div className="text-right">
                  <strong>
                    <WishlistMoney amount={item.price} />
                  </strong>
                  {item.previousPrice && (
                    <del className="block text-xs text-muted-foreground">
                      <WishlistMoney amount={item.previousPrice} />
                    </del>
                  )}
                </div>
                <div className="col-span-2 flex flex-wrap items-center justify-end gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Move ${item.name} to ${groups.find((candidate) => candidate.id === group.next)!.name}`}
                    onClick={() =>
                      setItems((current) =>
                        current.map((product) =>
                          product.id === item.id ? { ...product, priority: group.next } : product,
                        ),
                      )
                    }
                  >
                    <ArrowDownUp className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove ${item.name} from wishlist`}
                    onClick={() =>
                      setItems((current) => current.filter((product) => product.id !== item.id))
                    }
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                  {item.stock > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!bag[item.id]}
                      aria-label={`Add ${item.name} to cart`}
                      onClick={() => add([item])}
                    >
                      {bag[item.id] ? <Check /> : <ShoppingBag />}
                      {bag[item.id] ? "Added" : "Add To Cart"}
                    </Button>
                  ) : (
                    <RestockAlert product={item} label="Notify Me" />
                  )}
                </div>
              </article>
            ))}
          {!items.some((item) => item.priority === group.id) && (
            <p className="py-5 text-sm text-muted-foreground">No pieces at this priority.</p>
          )}
        </section>
      ))}
      {!items.length && <WishlistEmpty onBrowse={() => setBrowse(true)} />}
      <BrowseWishlistItems
        trigger={null}
        open={browse}
        onOpenChange={setBrowse}
        savedIds={items.map((item) => item.id)}
        onSave={(product) =>
          setItems((current) =>
            current.some((item) => item.id === product.id)
              ? current
              : [...current, { ...product, priority: "maybe" }],
          )
        }
      />
    </main>
  );
}
