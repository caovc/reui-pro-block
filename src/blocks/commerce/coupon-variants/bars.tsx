import { useId, useState } from "react";
import { Truck, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia } from "@/components/ui/item";
import { cn } from "@/lib/utils";
import { CouponCopyButton } from "./copy";

/** Actual c-item-2 media/content/actions anatomy, adapted to a full-width announcement. */
export function CouponAnnouncement({ dark = false }: { dark?: boolean }) {
  const [visible, setVisible] = useState(true);
  const id = useId();
  const code = dark ? "WEEKEND20" : "FREESHIP50";
  const Icon = dark ? Zap : Truck;
  return (
    <main className="w-full" data-coupon-variant={dark ? "6" : "5"}>
      {visible ? (
        <Item
          className={cn(
            "flex-nowrap gap-3 rounded-none border-x-0 border-y px-4 py-3 sm:px-8",
            dark
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-muted/20",
          )}
          role="region"
          aria-label={dark ? "Weekend sale promotion" : "Free shipping promotion"}
        >
          <ItemMedia variant="icon">
            <Icon className={cn("size-4", !dark && "text-success")} />
          </ItemMedia>
          <ItemContent>
            <ItemDescription
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-5",
                dark ? "text-primary-foreground" : "text-foreground",
              )}
            >
              <span>
                {dark
                  ? "20% off sitewide this weekend, ends Sunday at midnight"
                  : "Always free shipping on orders over $50"}
              </span>
              <code
                id={id}
                className={cn(
                  "select-all rounded-md border border-dashed px-2 font-mono text-xs font-semibold tracking-[.15em]",
                  dark ? "border-primary-foreground/35 bg-primary-foreground/5" : "bg-background",
                )}
              >
                {code}
              </code>
            </ItemDescription>
          </ItemContent>
          <ItemActions className="gap-3">
            <CouponCopyButton code={code} codeId={id} label="Copy code" light />
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(dark && "text-primary-foreground/70 hover:text-primary-foreground")}
              aria-label="Dismiss promotion"
              onClick={() => setVisible(false)}
            >
              <X />
            </Button>
          </ItemActions>
        </Item>
      ) : (
        <div className="flex flex-col items-center gap-3 px-4 py-12">
          <p className="text-sm text-muted-foreground" role="status">
            Promo bar dismissed.
          </p>
          <Button variant="outline" size="sm" onClick={() => setVisible(true)}>
            Show again
          </Button>
        </div>
      )}
    </main>
  );
}
