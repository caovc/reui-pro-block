import { useId, useState } from "react";
import { ArrowRight, Check, Clock3, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Separator } from "@/components/ui/separator";
import { wishlistArtwork } from "../wishlist-artwork";
import { CouponCopyButton } from "./copy";
import { couponMoney, type CouponCampaign } from "./data";

/** Actual official free c-item-2 media/content/actions anatomy for the coupon panel. */
export function CouponCodePanel({ code }: { code: string }) {
  const id = useId();
  return (
    <Item variant="outline" className="flex-nowrap gap-3 border-dashed bg-muted/20 px-3 py-2.5">
      <ItemContent className="gap-0.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Promo code
        </p>
        <code
          id={id}
          className="select-all font-mono text-xl font-semibold leading-tight tracking-[.15em] sm:text-2xl"
        >
          {code}
        </code>
      </ItemContent>
      <ItemActions>
        <CouponCopyButton code={code} codeId={id} />
      </ItemActions>
    </Item>
  );
}

export function CouponTermsList({ terms }: { terms: string[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm leading-5 text-muted-foreground">
      {terms.map((term) => (
        <li key={term} className="flex items-start gap-2">
          <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
          <span>{term}</span>
        </li>
      ))}
    </ul>
  );
}

export function CouponExpiry({ text, minimum }: { text: string; minimum?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="flex items-center gap-1.5">
        <Clock3 className="size-3.5 text-muted-foreground" />
        {text}
      </span>
      {minimum !== undefined && (
        <>
          <span className="text-muted-foreground/50">·</span>
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Min spend</span>
            {couponMoney(minimum)}
          </span>
        </>
      )}
    </div>
  );
}

export function CouponTermsDialog({ campaign }: { campaign: CouponCampaign }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-muted-foreground">
          Full terms
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Offer terms · {campaign.code}</DialogTitle>
          <DialogDescription>{campaign.heading}</DialogDescription>
        </DialogHeader>
        <CouponTermsList terms={campaign.terms} />
        {campaign.expiry && (
          <CouponExpiry text={campaign.expiry} minimum={campaign.minimum || undefined} />
        )}
        <p className="text-xs text-muted-foreground">
          These sample campaign dates are preserved from the public design. This independent local
          demo does not redeem a live promotion.
        </p>
        <CouponCodePanel code={campaign.code} />
      </DialogContent>
    </Dialog>
  );
}

const sampleProducts = [
  { id: "linen", name: "Linen Field Shirt", price: 80, art: "shirt" as const, tone: "#b7b09b" },
  { id: "tote", name: "Everyday Canvas Tote", price: 45, art: "bag" as const, tone: "#bca680" },
  {
    id: "card",
    name: "Slim Leather Card Holder",
    price: 35,
    art: "wallet" as const,
    tone: "#886252",
  },
];

/** Domain-only local shop preview: free Item + NumberField + Alert implement UI mechanics. */
export function CouponShopPreview({ campaign }: { campaign: CouponCampaign }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const subtotal = sampleProducts.reduce(
    (sum, product) => sum + product.price * (quantities[product.id] ?? 0),
    0,
  );
  const eligible = subtotal > 0 && subtotal >= campaign.minimum;
  const savings = eligible ? (subtotal * campaign.percentage) / 100 : 0;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          {campaign.action}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{campaign.action}</DialogTitle>
          <DialogDescription>
            Explore this local collection and preview the savings with {campaign.code}. No order is
            placed.
          </DialogDescription>
        </DialogHeader>
        <Badge variant="secondary" className="self-start">
          {campaign.percentage}% off eligible items
        </Badge>
        <div className="flex flex-col gap-4">
          {sampleProducts.map((product) => (
            <Item key={product.id} className="flex-nowrap border-0 p-0">
              <ItemMedia>
                <img
                  src={wishlistArtwork(product.art, product.tone)}
                  alt={product.name}
                  className="size-14 rounded-md object-cover"
                />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle>{product.name}</ItemTitle>
                <p className="text-sm text-muted-foreground">{couponMoney(product.price)}</p>
              </ItemContent>
              <ItemActions>
                <NumberField
                  value={quantities[product.id] ?? 0}
                  min={0}
                  max={5}
                  onValueChange={(value) =>
                    setQuantities((current) => ({ ...current, [product.id]: value ?? 0 }))
                  }
                  size="sm"
                >
                  <NumberFieldGroup className="w-28">
                    <NumberFieldDecrement aria-label={`Decrease ${product.name}`} />
                    <NumberFieldInput aria-label={`Quantity for ${product.name}`} />
                    <NumberFieldIncrement aria-label={`Increase ${product.name}`} />
                  </NumberFieldGroup>
                </NumberField>
              </ItemActions>
            </Item>
          ))}
        </div>
        <Separator />
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd data-coupon-subtotal>{couponMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-success">
            <dt>{campaign.code} savings</dt>
            <dd data-coupon-savings>−{couponMoney(savings)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd data-coupon-total>{couponMoney(subtotal - savings)}</dd>
          </div>
        </dl>
        {subtotal > 0 && !eligible && (
          <Alert variant="warning">
            <AlertDescription>
              Add {couponMoney(campaign.minimum - subtotal)} more to meet this offer's minimum
              spend.
            </AlertDescription>
          </Alert>
        )}
        {eligible && (
          <Alert variant="success">
            <AlertDescription>{campaign.code} is applied to this local preview.</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
