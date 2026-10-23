import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Badge } from "@/components/reui/badge";
import { shopArtwork } from "./artwork";
import { shopMoney, shopProducts, type ShopProduct } from "./data";
import { ShopImageCard } from "./image-card";
import { ShopCartDialog, ShopCollectionDialog } from "./shared";
import { useShopCart, type ShopCart } from "./use-shop-cart";

function BentoProduct({ product, cart }: { product: ShopProduct; cart: ShopCart }) {
  const [added, setAdded] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timeout.current), []);
  return (
    <article
      className="group relative min-w-0 overflow-hidden rounded-xl bg-muted"
      data-bento-product={product.id}
    >
      <ShopCollectionDialog title={product.name} cart={cart}>
        <button
          className="block aspect-[1.05] w-full text-left focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
          aria-label={`Shop ${product.name}`}
        >
          <img
            src={shopArtwork(product.artwork)}
            alt={product.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          />
        </button>
      </ShopCollectionDialog>
      {product.status && (
        <Badge
          variant={product.previous ? "destructive" : "success"}
          className="pointer-events-none absolute start-3 top-3"
        >
          {product.status}
        </Badge>
      )}
      <Item className="pointer-events-none absolute inset-x-0 bottom-0 flex-nowrap rounded-none border-0 bg-linear-to-t from-black/80 via-black/50 to-transparent px-3 pb-3 pt-10 text-white">
        <ItemContent className="min-w-0 gap-1">
          <ItemTitle className="text-xs sm:text-sm">{product.name}</ItemTitle>
          <ItemDescription className="flex flex-wrap gap-2 text-xs text-white/80">
            <span className="font-medium text-white">{shopMoney(product.price)}</span>
            {product.previous && <del>{shopMoney(product.previous)}</del>}
          </ItemDescription>
        </ItemContent>
        <Button
          className="pointer-events-auto size-8 shrink-0 rounded-full bg-white text-black hover:bg-white/90"
          size="icon-sm"
          aria-label={added ? `${product.name} added to cart` : `Add ${product.name} to cart`}
          onClick={() => {
            cart.add(product);
            setAdded(true);
            clearTimeout(timeout.current);
            timeout.current = setTimeout(() => setAdded(false), 1600);
          }}
        >
          {added ? <Check className="size-4" /> : <Plus className="size-4" />}
        </Button>
      </Item>
    </article>
  );
}

export function BentoShopHero() {
  const cart = useShopCart();
  return (
    <section
      className="mx-auto w-full max-w-[1380px] bg-background p-4 text-foreground sm:p-7"
      data-shop-hero-variant="2"
      aria-label="Bento shop collection"
    >
      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4" data-shop-bento>
        <ShopImageCard
          image={shopArtwork("weekender")}
          alt="Original Bricklane weekender still life"
          className="col-span-2 h-[32rem] rounded-xl sm:h-[38rem] lg:row-span-2 lg:h-auto"
        >
          <Badge variant="secondary" className="mb-auto bg-white/15 text-white">
            Spring 2026 · Collection 03
          </Badge>
          <p className="mb-3 text-xs uppercase tracking-[.16em] text-white/75">
            Made for everyday adventure
          </p>
          <h2 className="max-w-[10ch] text-4xl font-semibold tracking-[-.04em] leading-[1.03] sm:text-5xl">
            A little less ordinary.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">
            Considered essentials for the days that take you somewhere. Meet the new season, one
            good piece at a time.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ShopCollectionDialog title="The Spring Edit" cart={cart}>
              <Button className="bg-white text-black hover:bg-white/90">
                Shop The Edit <ArrowRight className="size-4" />
              </Button>
            </ShopCollectionDialog>
            <ShopCollectionDialog title="All collections" cart={cart}>
              <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                Explore collections <ArrowRight className="size-4" />
              </Button>
            </ShopCollectionDialog>
          </div>
        </ShopImageCard>
        {shopProducts.map((product) => (
          <BentoProduct key={product.id} product={product} cart={cart} />
        ))}
        <div
          className="flex min-h-56 flex-col items-start justify-between rounded-xl bg-foreground p-5 text-background sm:p-6"
          data-shop-sale-tile
        >
          <Badge
            variant="secondary"
            className="border-background/25 bg-transparent text-background"
          >
            The archive sale
          </Badge>
          <div className="py-6">
            <p className="text-xs uppercase tracking-widest text-background/60">
              Good pieces. Better prices.
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight leading-none">
              Up to 40% Off
            </h3>
          </div>
          <ShopCollectionDialog title="Archive sale" cart={cart}>
            <Button variant="link" className="h-auto p-0 text-background">
              Shop the sale <ArrowRight className="size-4" />
            </Button>
          </ShopCollectionDialog>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <p role="status">{cart.message || "Small-batch pieces, thoughtfully made."}</p>
        <ShopCartDialog cart={cart} />
      </div>
    </section>
  );
}
