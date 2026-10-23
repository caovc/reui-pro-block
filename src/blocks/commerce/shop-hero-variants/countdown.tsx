import { useEffect, useState } from "react";
import { ArrowRight, Boxes, Check, Gift, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Badge } from "@/components/reui/badge";
import { Rating } from "@/components/reui/rating";
import { CouponCopyButton } from "../coupon-variants/copy";
import { shopArtwork } from "./artwork";
import { ShopImageCard } from "./image-card";
import { ShopCartDialog, ShopCollectionDialog } from "./shared";
import { useShopCart } from "./use-shop-cart";

// The official free registry has no countdown primitive. The public Pro brief
// describes fixed text; this local extension derives a live clock from one deadline.
function DealCountdown() {
  const [deadline] = useState(() => Date.now() + (2 * 24 * 60 + 8 * 60 + 30) * 60_000);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.floor((deadline - now) / 1000));
  const parts = [
    [Math.floor(seconds / 86400), "Days"],
    [Math.floor((seconds % 86400) / 3600), "Hours"],
    [Math.floor((seconds % 3600) / 60), "Minutes"],
  ] as const;
  return (
    <div className="flex flex-wrap items-center gap-3" data-deal-countdown>
      <span className="text-xs text-white/70">Ends in</span>
      <div
        className="flex items-center gap-2"
        role="timer"
        aria-label={`Offer ends in ${parts[0][0]} days ${parts[1][0]} hours ${parts[2][0]} minutes`}
      >
        {parts.map(([value, label], index) => (
          <div key={label} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden className="text-white/40">
                :
              </span>
            )}
            <span className="flex min-w-12 flex-col rounded-md border border-white/20 bg-white/10 px-2 py-1.5 text-center backdrop-blur-sm">
              <strong
                className="font-mono text-lg tabular-nums leading-none"
                data-countdown-unit={label}
              >
                {String(value).padStart(2, "0")}
              </strong>
              <span className="mt-1 text-[9px] uppercase tracking-wider text-white/65">
                {label}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CountdownDealHero() {
  const cart = useShopCart();
  return (
    <section
      className="mx-auto w-full max-w-[1380px] bg-background p-4 text-foreground sm:p-7"
      data-shop-hero-variant="3"
      aria-label="Weekly deals"
    >
      <ShopImageCard
        image={shopArtwork("daypack")}
        alt="Original Bricklane travel pack campaign"
        className="h-auto min-h-[38rem] rounded-xl sm:min-h-[33rem]"
      >
        <div className="absolute inset-0 -z-0 bg-linear-to-r from-black/65 via-black/30 to-transparent" />
        <div className="relative flex h-full max-w-xl flex-col items-start">
          <Badge variant="success" radius="full" size="lg">
            <span className="size-1.5 rounded-full bg-white" />
            Live now
          </Badge>
          <p className="mt-5 text-xs font-medium uppercase tracking-[.2em] text-white/75">
            The weekly edit · Limited time
          </p>
          <h2 className="mt-3 text-5xl font-semibold tracking-[-.05em] leading-[1.04] sm:text-7xl">
            Good finds.
            <br />
            Up to 40% Off.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/80">
            Your next everyday favorite, at a price worth a second look. Thoughtful pieces, while
            they last.
          </p>
          <div className="my-6">
            <DealCountdown />
          </div>
          <div className="flex flex-wrap gap-3">
            <ShopCollectionDialog title="The weekly sale" cart={cart}>
              <Button className="bg-white text-black hover:bg-white/90">
                Shop the sale <ArrowRight className="size-4" />
              </Button>
            </ShopCollectionDialog>
            <ShopCollectionDialog title="All offers" cart={cart}>
              <Button
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                View all offers
              </Button>
            </ShopCollectionDialog>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-2 text-xs text-white/75">
            <Rating
              rating={5}
              size="sm"
              className="[&_[data-slot=rating-star-empty]]:size-3 [&_[data-slot=rating-star-filled]]:size-3"
              aria-label="Rated 5 out of 5"
            />
            <span>2,400+ happy customers</span>
            <Check className="size-3" />
          </div>
        </div>
      </ShopImageCard>
      <div className="mt-4 grid gap-3 md:grid-cols-3" data-deal-promos>
        <Item variant="outline" className="items-start gap-3 p-5" data-deal-promo="shipping">
          <ItemMedia variant="icon" className="mt-1">
            <Truck className="size-5" />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>Shipping is on us</ItemTitle>
            <ItemDescription>Free standard shipping on orders over $75.</ItemDescription>
            <ShopCollectionDialog title="Free shipping favorites" cart={cart}>
              <Button variant="link" className="mt-2 h-auto justify-start p-0 text-xs">
                Find your favorites <ArrowRight className="size-3" />
              </Button>
            </ShopCollectionDialog>
          </ItemContent>
        </Item>
        <Item variant="outline" className="items-start gap-3 p-5" data-deal-promo="bundle">
          <ItemMedia variant="icon" className="mt-1">
            <Boxes className="size-5" />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>Better together</ItemTitle>
            <ItemDescription>Build your everyday kit with considered essentials.</ItemDescription>
            <ShopCollectionDialog title="Build your bundle" cart={cart}>
              <Button variant="link" className="mt-2 h-auto justify-start p-0 text-xs">
                Explore bundles <ArrowRight className="size-3" />
              </Button>
            </ShopCollectionDialog>
          </ItemContent>
        </Item>
        <Item variant="outline" className="items-start gap-3 p-5" data-deal-promo="welcome">
          <ItemMedia variant="icon" className="mt-1">
            <Gift className="size-5" />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>Your first order, 10% less</ItemTitle>
            <ItemDescription>
              Use{" "}
              <code id="shop-welcome-code" className="font-mono font-medium text-foreground">
                WELCOME10
              </code>{" "}
              at checkout.
            </ItemDescription>
            <div className="mt-2">
              <CouponCopyButton
                code="WELCOME10"
                codeId="shop-welcome-code"
                label="Copy offer code"
              />
            </div>
          </ItemContent>
        </Item>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <p role="status">
          {cart.message || "Sample offer timer resets when this preview reloads."}
        </p>
        <ShopCartDialog cart={cart} />
      </div>
    </section>
  );
}
