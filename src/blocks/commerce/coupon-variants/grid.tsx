/** Official free c-frame-1 header/panel/footer + c-toggle-group-5 controlled filter composition. */
import { useState } from "react";
import { Clock3, ShoppingBag, TicketPercent } from "lucide-react";
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CouponCopyButton } from "./copy";
import { couponMoney, couponOffers, type CouponOffer } from "./data";

function OfferCard({ offer }: { offer: CouponOffer }) {
  return (
    <Frame spacing="xs" className="min-w-0" data-coupon-offer={offer.code}>
      <FrameHeader className="py-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {offer.category}
        </p>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-3 p-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold leading-tight tracking-tight">{offer.value}</h2>
            {offer.badge && (
              <Badge variant={offer.badge.variant} className="font-normal">
                {offer.badge.label}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{offer.subtitle}</p>
        </div>
        <p className="min-h-10 text-sm leading-5">{offer.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="size-3.5 text-muted-foreground" />
            {offer.minimum ? (
              <>
                <span className="text-muted-foreground">Min spend</span>
                {couponMoney(offer.minimum)}
              </>
            ) : (
              "No minimum"
            )}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="flex items-center gap-1.5">
            <Clock3 className="size-3.5 text-muted-foreground" />
            {offer.expiry}
          </span>
        </div>
      </FramePanel>
      <FrameFooter className="flex flex-row items-center justify-between gap-2 py-2">
        <code
          id={`coupon-${offer.code}`}
          className="select-all font-mono text-sm font-semibold tracking-[.14em]"
        >
          {offer.code}
        </code>
        <CouponCopyButton code={offer.code} codeId={`coupon-${offer.code}`} />
      </FrameFooter>
    </Frame>
  );
}

export function CouponGrid() {
  const [filter, setFilter] = useState("All offers");
  const visible = couponOffers.filter(
    (offer) => filter === "All offers" || offer.category === filter,
  );
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10" data-coupon-variant="2">
      <header className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <TicketPercent className="size-3.5" />
          Promotions
        </p>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          Available offers
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Browse current promotions and copy any code straight to your clipboard.
          </p>
          <p className="text-sm text-muted-foreground" data-coupon-count>
            <strong className="text-base text-foreground">{visible.length}</strong>
            {filter !== "All offers" && " of 6"} offers
          </p>
        </div>
      </header>
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(value) => {
          if (value) setFilter(value);
        }}
        variant="outline"
        spacing={2}
        className="mb-6 w-full flex-wrap justify-start"
        aria-label="Offer category filters"
      >
        {["All offers", ...couponOffers.map((offer) => offer.category)].map((category) => (
          <ToggleGroupItem
            key={category}
            value={category}
            className="rounded-full px-3.5 font-normal aria-pressed:bg-primary aria-pressed:text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {category}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <section
        className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3"
        aria-label="Available coupon offers"
      >
        {visible.map((offer) => (
          <OfferCard key={offer.code} offer={offer} />
        ))}
      </section>
    </main>
  );
}
