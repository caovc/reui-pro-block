import { useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  Copy,
  Download,
  Flame,
  PackageCheck,
  Share2,
  ShoppingBag,
  TrendingDown,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldIncrement,
  NumberFieldDecrement,
} from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { savedStudio } from "./wishlist-data";
import type { WishlistProduct } from "./wishlist-data";
import { wishlistArtwork } from "./wishlist-artwork";
import { WishlistContext, useWishlistSession } from "./wishlist-session-context";
import type { BagLine } from "./wishlist-session-context";
import { saveWishlistJson } from "./wishlist-export";

/** Domain-only local bag/alerts; quantity editing remains the actual free REUI NumberField. */
export function WishlistSession({ children }: { children: ReactNode }) {
  const [bag, setBag] = useState<Record<string, BagLine>>({});
  const [alerts, setAlerts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const add = (products: WishlistProduct[]) => {
    const additions = products.filter(
      (product, index) =>
        product.stock > 0 &&
        !bag[product.id] &&
        products.findIndex((p) => p.id === product.id) === index,
    );
    setBag((current) => ({
      ...current,
      ...Object.fromEntries(additions.map((product) => [product.id, { product, quantity: 1 }])),
    }));
    setNotice(
      additions.length
        ? `${additions.length} ${additions.length === 1 ? "item added" : "items added"} to your local bag.`
        : "These available items are already in your local bag.",
    );
    return additions.length;
  };
  const updateQuantity = (id: string, quantity: number) =>
    setBag((current) => {
      if (!current[id]) return current;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return {
        ...current,
        [id]: { ...current[id], quantity: Math.min(quantity, current[id].product.stock) },
      };
    });
  const notify = (id: string, email: string) =>
    setAlerts((current) => {
      const next = { ...current };
      if (email) next[id] = email;
      else delete next[id];
      return next;
    });
  const lines = Object.values(bag);
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return (
    <WishlistContext.Provider
      value={{
        bag,
        alerts,
        notice,
        add,
        updateQuantity,
        notify,
        clearNotice: () => setNotice(null),
        showBag: () => setBagOpen(true),
      }}
    >
      {children}
      <Dialog open={bagOpen} onOpenChange={setBagOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Your local bag</DialogTitle>
            <DialogDescription>
              Saved items added during this preview. No order has been placed.
            </DialogDescription>
          </DialogHeader>
          {lines.length ? (
            <div className="space-y-5">
              {lines.map(({ product, quantity }) => (
                <Item key={product.id} className="flex-wrap p-0" size="sm">
                  <ItemMedia>
                    <WishlistImage product={product} className="size-14 rounded-md" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{product.name}</ItemTitle>
                    <p className="text-xs text-muted-foreground">
                      <WishlistMoney amount={product.price} /> each
                    </p>
                  </ItemContent>
                  <div className="flex items-center gap-2">
                    <NumberField
                      value={quantity}
                      onValueChange={(value) => updateQuantity(product.id, value ?? 1)}
                      min={1}
                      max={product.stock}
                      size="sm"
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement
                          aria-label={`Decrease quantity for ${product.name}`}
                        />
                        <NumberFieldInput
                          aria-label={`Quantity for ${product.name}`}
                          className="w-10"
                        />
                        <NumberFieldIncrement
                          aria-label={`Increase quantity for ${product.name}`}
                        />
                      </NumberFieldGroup>
                    </NumberField>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${product.name} from bag`}
                      onClick={() => updateQuantity(product.id, 0)}
                    >
                      <X />
                    </Button>
                  </div>
                </Item>
              ))}
              <div className="flex justify-between border-t pt-4 font-semibold">
                <span>Subtotal</span>
                <span data-wishlist-bag-total>
                  <WishlistMoney amount={subtotal} />
                </span>
              </div>
            </div>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">Your bag is empty.</p>
          )}
        </DialogContent>
      </Dialog>
    </WishlistContext.Provider>
  );
}
export function WishlistMoney({
  amount,
  decimals = false,
}: {
  amount: number;
  decimals?: boolean;
}) {
  return (
    <>
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: decimals ? 2 : 0,
        maximumFractionDigits: decimals ? 2 : 0,
      }).format(amount)}
    </>
  );
}
export function WishlistImage({
  product,
  className,
}: {
  product: WishlistProduct;
  className?: string;
}) {
  return (
    <img
      src={wishlistArtwork(product.art, product.tone)}
      alt={product.name}
      className={cn("size-full object-cover", className)}
    />
  );
}
export function WishlistBagButton() {
  const { bag, showBag } = useWishlistSession();
  const count = Object.values(bag).reduce((sum, line) => sum + line.quantity, 0);
  return count > 0 ? (
    <Button variant="outline" size="sm" onClick={showBag}>
      <ShoppingBag />
      Bag · {count} {count === 1 ? "item" : "items"}
    </Button>
  ) : null;
}
export function WishlistNotice() {
  const { notice, clearNotice, showBag } = useWishlistSession();
  return notice ? (
    <Alert variant="success" className="mb-6">
      <Check />
      <AlertTitle>Wishlist updated</AlertTitle>
      <AlertDescription>
        {notice}
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="outline" onClick={showBag}>
            View bag
          </Button>
          <Button size="sm" variant="ghost" onClick={clearNotice}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  ) : null;
}
/** Actual official free c-breadcrumb-1 structure; Shop opens the available local product browser. */
export function WishlistBreadcrumb({
  page = "Wishlist",
  onShop,
}: {
  page?: string;
  onShop?: () => void;
}) {
  return (
    <Breadcrumb className="mb-2 sm:mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <button type="button" onClick={onShop} className="cursor-pointer">
              Shop
            </button>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
export function WishlistStats({ products }: { products: WishlistProduct[] }) {
  const drops = products.filter((p) => p.signal === "drop").length;
  const restock = products.filter((p) => p.signal === "restock").length;
  const low = products.filter((p) => p.signal === "low").length;
  const savings = products.reduce(
    (sum, p) => sum + Math.max(0, (p.previousPrice ?? p.price) - p.price),
    0,
  );
  return (
    <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
      {drops > 0 && (
        <>
          <span>
            {drops} price {drops === 1 ? "drop" : "drops"}
          </span>
          <span>·</span>
        </>
      )}
      {restock > 0 && (
        <>
          <span>{restock} back in stock</span>
          <span>·</span>
        </>
      )}
      {low > 0 && (
        <>
          <span>{low} almost gone</span>
          <span>·</span>
        </>
      )}
      <span className="text-emerald-600">
        Total savings <WishlistMoney amount={savings} />
      </span>
    </div>
  );
}
export function WishlistSignalBadge({
  product,
  move = false,
}: {
  product: WishlistProduct;
  move?: boolean;
}) {
  const signal = product.stock === 0 ? "unavailable" : product.signal;
  if (!signal) return null;
  const config = {
    drop: {
      variant: "success-light" as const,
      icon: TrendingDown,
      label: move
        ? `${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((product.previousPrice ?? product.price) - product.price)} Off`
        : "Price Drop",
    },
    restock: { variant: "info-light" as const, icon: PackageCheck, label: "Back In Stock" },
    low: {
      variant: "warning-light" as const,
      icon: Flame,
      label: move ? `Only ${product.stock} Left` : "Almost Gone",
    },
    sale: { variant: "destructive-light" as const, icon: TrendingDown, label: "Sale" },
    unavailable: {
      variant: "secondary" as const,
      icon: Bell,
      label: move ? "Out Of Stock" : "Unavailable",
    },
  }[signal];
  const Icon = config.icon;
  return (
    <Badge
      variant={config.variant}
      size="default"
      radius="full"
      className={cn(
        "font-normal",
        move && "rounded-md",
        signal === "restock" && "border-violet-200 bg-violet-50 text-violet-700",
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}
export function WishlistPrice({
  product,
  decimals = false,
  oldFirst = false,
}: {
  product: WishlistProduct;
  decimals?: boolean;
  oldFirst?: boolean;
}) {
  const old =
    product.previousPrice && product.previousPrice > product.price ? (
      <del className="text-xs font-normal text-muted-foreground">
        <WishlistMoney amount={product.previousPrice} decimals={decimals} />
      </del>
    ) : null;
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      {oldFirst && old}
      <strong className="font-semibold">
        <WishlistMoney amount={product.price} decimals={decimals} />
      </strong>
      {!oldFirst && old}
    </div>
  );
}
export function RestockAlert({
  product,
  label = "Notify Me",
  className,
}: {
  product: WishlistProduct;
  label?: string;
  className?: string;
}) {
  const { alerts, notify } = useWishlistSession();
  const [open, setOpen] = useState(false),
    [email, setEmail] = useState(""),
    [saved, setSaved] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
          onClick={() => {
            setEmail(alerts[product.id] ?? "");
            setSaved(false);
          }}
        >
          <Bell />
          {alerts[product.id] ? "Alert Saved" : label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restock alert</DialogTitle>
          <DialogDescription>
            {product.name} is currently unavailable. Save an email reminder in this local preview.
          </DialogDescription>
        </DialogHeader>
        {saved ? (
          <div className="space-y-4">
            <Alert variant="success">
              <Check />
              <AlertTitle>Reminder saved locally</AlertTitle>
              <AlertDescription>
                {email} will be shown as subscribed in this demo. No email is sent.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              notify(product.id, email);
              setSaved(true);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={`restock-${product.id}`}>Email address</Label>
              <Input
                id={`restock-${product.id}`}
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Save restock alert
            </Button>
            {alerts[product.id] && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  notify(product.id, "");
                  setOpen(false);
                }}
              >
                Turn off alert
              </Button>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
export function ShareWishlist({
  products,
  title = "Saved For Later",
  label = "Share List",
}: {
  products: WishlistProduct[];
  title?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const link = typeof window === "undefined" ? "" : window.location.href;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => setCopied(false)}>
          <Share2 />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {title}</DialogTitle>
          <DialogDescription>
            Copy this preview link or download the current {products.length}-item list.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wishlist-preview-link">Preview link</Label>
            <Input id="wishlist-preview-link" value={link} readOnly />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              <Copy />
              {copied ? "Link copied" : "Copy link"}
            </Button>
            <Button onClick={() => saveWishlistJson(title, products)}>
              <Download />
              Download list
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The link opens this demo; the downloaded file includes your current local items.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function BrowseWishlistItems({
  savedIds,
  onSave,
  trigger,
  open,
  onOpenChange,
}: {
  savedIds: string[];
  onSave: (product: WishlistProduct) => void;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="ghost" size="sm">
              Continue Shopping
              <ArrowRight />
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Discover more pieces</DialogTitle>
          <DialogDescription>
            Original product illustrations and local saved-item actions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-5">
          {savedStudio.map((product) => (
            <Item key={product.id} className="flex-col items-stretch gap-3 border-0 p-0">
              <ItemMedia className="size-auto w-full">
                <WishlistImage product={product} className="aspect-square w-full rounded-md" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-sm">{product.name}</ItemTitle>
                <WishlistPrice product={product} />
              </ItemContent>
              <Button
                size="sm"
                variant="outline"
                disabled={savedIds.includes(product.id)}
                onClick={() => onSave(product)}
              >
                {savedIds.includes(product.id) ? "Saved" : "Save item"}
              </Button>
            </Item>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Actual free c-empty-1 composition, adapted to local wishlist recovery. */
export function WishlistEmpty({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <Empty className="py-16">
      <EmptyHeader>
        <EmptyTitle>Nothing saved here yet</EmptyTitle>
        <EmptyDescription>Your wishlist is ready for something new.</EmptyDescription>
      </EmptyHeader>
      {onBrowse && (
        <EmptyContent>
          <Button onClick={onBrowse}>Discover more pieces</Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
