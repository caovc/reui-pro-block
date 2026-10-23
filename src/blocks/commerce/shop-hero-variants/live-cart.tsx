import { ArrowRight, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Badge } from "@/components/reui/badge";
import { demoAvatar } from "@/lib/demo-artwork";
import { cn } from "@/lib/utils";
import { shopArtwork } from "./artwork";
import { shopMoney, shopProducts, type ShopProduct } from "./data";
import { ShopCartDialog, ShopCollectionDialog } from "./shared";
import { useShopCart, type ShopCart } from "./use-shop-cart";

function LiveCartTile({
  product,
  cart,
  featured = false,
}: {
  product: ShopProduct;
  cart: ShopCart;
  featured?: boolean;
}) {
  return (
    <article
      className={cn("group min-w-0", featured && "col-span-2 row-span-2 sm:col-span-1")}
      data-shop-product={product.id}
    >
      <ShopCollectionDialog title={product.name} cart={cart}>
        <button
          className={cn(
            "relative block w-full overflow-hidden rounded-xl bg-muted text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
            featured
              ? "aspect-[.63] sm:h-[calc(100%-4.5rem)] sm:min-h-[31rem] sm:aspect-auto"
              : "aspect-[1.05]",
          )}
          aria-label={`Shop ${product.name}`}
        >
          <img
            src={shopArtwork(product.artwork)}
            alt={product.name}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          />
          {product.status && (
            <Badge
              variant={product.previous ? "destructive" : "success"}
              size="xl"
              className="absolute start-3 top-3"
            >
              {product.status}
            </Badge>
          )}
        </button>
      </ShopCollectionDialog>
      <Item className="flex-nowrap items-center gap-1 px-0 py-3">
        <ItemContent className="min-w-0 gap-1">
          <ItemTitle className="text-xs sm:text-sm">{product.name}</ItemTitle>
          <ItemDescription className="flex flex-wrap gap-x-1.5 gap-y-1 text-xs">
            <span>{product.detail}</span>
            <span aria-hidden>·</span>
            <span className="font-medium text-foreground">{shopMoney(product.price)}</span>
            {product.previous && <del>{shopMoney(product.previous)}</del>}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 px-2"
            aria-label={`Add ${product.name} to cart`}
            onClick={() => cart.add(product)}
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </ItemActions>
      </Item>
    </article>
  );
}

export function LiveCartHero() {
  const cart = useShopCart();
  return (
    <section
      className="mx-auto w-full max-w-[1380px] bg-background px-5 py-7 text-foreground sm:px-8 lg:px-10"
      data-shop-hero-variant="1"
      aria-labelledby="live-shop-heading"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5 text-xs">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[.24em]">
            Bricklane Goods
          </span>
          <span className="text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <span className="text-muted-foreground">Carry-on, considered</span>
        </p>
        <div className="flex items-center gap-4">
          <p className="hidden text-muted-foreground lg:block">
            Free 60-day returns <span className="px-1.5">·</span> 3-year repair{" "}
            <span className="px-1.5">·</span> Ships in 24h
          </p>
          <ShopCartDialog cart={cart} />
        </div>
      </header>
      <div className="grid min-w-0 gap-10 py-8 sm:py-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-9">
        <div className="flex min-w-0 flex-col items-start lg:py-1">
          <Badge variant="success-light" size="lg">
            Collection 03 · Spring 2026
          </Badge>
          <h2
            id="live-shop-heading"
            className="mt-6 max-w-[10ch] text-4xl font-semibold tracking-[-.045em] leading-[1.04] sm:text-5xl xl:text-[clamp(3rem,4.6vw,4.8rem)]"
          >
            Made for the trips you actually take.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
            Carry-on essentials built in two small workshops we visit by name. Pieces meant to
            outlast the trips, the seasons, the trends.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <ShopCollectionDialog title="The Spring 2026 Edit" cart={cart}>
              <Button className="bg-emerald-700 text-white hover:bg-emerald-800">
                Shop The Edit <ArrowRight className="size-4" />
              </Button>
            </ShopCollectionDialog>
            <ShopCollectionDialog title="All Bricklane Goods pieces" cart={cart}>
              <Button variant="outline">Shop All</Button>
            </ShopCollectionDialog>
          </div>
          <Item className="mt-8 w-fit gap-3 p-0 sm:mt-10">
            <Avatar className="size-10">
              <AvatarImage src={demoAvatar("Milo Reed")} alt="Milo Reed" />
              <AvatarFallback>MR</AvatarFallback>
            </Avatar>
            <ItemContent>
              <ItemTitle>Milo Reed</ItemTitle>
              <ItemDescription className="text-xs">
                Founder <span className="px-1">·</span> Curator of this edit
              </ItemDescription>
            </ItemContent>
          </Item>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-2 sm:grid-rows-2 sm:gap-x-5">
          {shopProducts.map((product, index) => (
            <LiveCartTile key={product.id} product={product} cart={cart} featured={index === 0} />
          ))}
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-x-5 gap-y-4 border-t pt-5 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Browse
          </span>
          {["Daypacks", "Weekenders", "Totes", "Travel Packs", "The Edit"].map((category) => (
            <ShopCollectionDialog key={category} title={category} cart={cart}>
              <button className="underline-offset-4 hover:underline">{category}</button>
            </ShopCollectionDialog>
          ))}
        </div>
        <ShopCollectionDialog title="Spring 2026 Lookbook" cart={cart}>
          <button className="flex items-center gap-2 underline-offset-4 hover:underline">
            View the Spring lookbook <ArrowRight className="size-3.5" />
          </button>
        </ShopCollectionDialog>
      </footer>
      <p className="sr-only" role="status">
        {cart.message}
      </p>
    </section>
  );
}
