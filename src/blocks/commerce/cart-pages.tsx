import { useState } from "react";
import { ArrowLeft, Check, Heart, MapPin, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  CartCheckout,
  CartEmpty,
  CartTotals,
  CartTrust,
  PaymentMarks,
  PromoField,
  Quantity,
  cartPhotos as photo,
  money,
  useCart,
} from "./cart-shared";
import type { CartItem } from "./cart-shared";
const fashion: CartItem[] = [
  {
    id: "coat",
    name: "Atelier Wool Coat",
    category: "Outerwear",
    price: 285,
    qty: 1,
    detail: "Camel · Size M",
    image: photo.jacket,
  },
  {
    id: "bomber",
    name: "Studio Bomber Jacket",
    category: "Outerwear",
    price: 248,
    qty: 1,
    detail: "Olive · Size M",
    image: photo.jacket,
  },
  {
    id: "headphones",
    name: "Aurora Wireless Headphones",
    category: "Electronics",
    price: 168,
    qty: 1,
    detail: "Matte Black · One size",
    image: photo.headphones,
    stock: 3,
  },
];
export function SaveForLaterCart() {
  const cart = useCart(fashion),
    [saved, setSaved] = useState<CartItem[]>([]),
    [discount, setDiscount] = useState(25),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(false);
  const tax = Math.round(Math.max(0, cart.subtotal - discount) * 0.0875 * 100) / 100,
    total = Math.max(0, cart.subtotal - discount + tax);
  return (
    <div className="mx-auto max-w-6xl space-y-7 p-4 py-12 sm:p-10 lg:py-20" data-cart-variant="1">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">
          Shopping Cart{" "}
          <span className="text-sm font-normal text-muted-foreground">({cart.count} items)</span>
        </h2>
        <Button variant="outline" size="sm" onClick={() => setNotice(!notice)}>
          <ArrowLeft />
          Continue shopping
        </Button>
      </div>
      {notice && (
        <Alert>
          <AlertDescription>Your selection stays in this cart while you browse.</AlertDescription>
        </Alert>
      )}
      <p className="flex items-center gap-2 text-sm">
        <Truck className="size-4" />
        {cart.subtotal >= 150 ? "Free shipping unlocked" : "Free shipping on orders over $150"}
      </p>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 divide-y">
          {cart.items.map((item) => (
            <div key={item.id} className="relative flex gap-4 py-6 first:pt-0">
              <img
                src={item.image}
                alt={item.name}
                className="size-24 shrink-0 rounded-lg bg-muted object-cover"
              />
              <div className="min-w-0 flex-1 pr-6">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.category}
                </p>
                <h3 className="mt-1 font-medium">{item.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                <p className="mt-2 text-xs text-success">
                  {item.stock ? "Only 3 left in stock" : "In stock"} · Arrives May 17–19
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <Quantity item={item} onChange={(v) => cart.update(item.id, v)} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSaved((prev) => [...prev, item]);
                      cart.remove(item.id);
                    }}
                  >
                    <Heart />
                    Save for later
                  </Button>
                  <strong className="text-sm">{money(item.price * item.qty)}</strong>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-0 right-0"
                aria-label={`Remove ${item.name}`}
                onClick={() => cart.remove(item.id)}
              >
                <X />
              </Button>
            </div>
          ))}
          {!cart.items.length && <CartEmpty onReset={() => cart.setItems(fashion)} />}{" "}
          {!!saved.length && (
            <div className="space-y-4 pt-6">
              <h3 className="font-semibold">Saved for later ({saved.length})</h3>
              {saved.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                  <img src={item.image} alt="" className="size-12 rounded object-cover" />
                  <p className="min-w-0 flex-1 text-sm">{item.name}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      cart.setItems((prev) => [...prev, item]);
                      setSaved((prev) => prev.filter((i) => i.id !== item.id));
                    }}
                  >
                    Move to cart
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <aside className="space-y-6 lg:border-l lg:pl-7">
          <h3 className="font-semibold">Order summary</h3>
          <PromoField
            code=""
            applied={discount ? "Code applied at checkout · $25 off" : undefined}
            onApply={(code) => {
              const valid = code.toUpperCase() === "WELCOME25";
              setDiscount(valid ? 25 : 0);
              setError(valid ? "" : "Use WELCOME25 for $25 off.");
            }}
            error={error}
            onRemove={() => setDiscount(0)}
          />
          <CartTotals
            rows={[
              [`Subtotal (${cart.count} items)`, money(cart.subtotal)],
              ["Shipping", "Free"],
              ["Estimated tax", money(tax)],
              ["Discount", `−${money(discount)}`],
            ]}
            total={total}
          />
          <CartCheckout total={total} disabled={!cart.items.length} />
          <PaymentMarks />
          <p className="text-center text-xs text-muted-foreground">
            Payment is completed after review.
          </p>
        </aside>
      </div>
      <CartTrust />
    </div>
  );
}
const beauty: CartItem[] = [
  {
    id: "serum",
    name: "Glow Renewal Serum",
    description: "A daily brightening serum for a fresh, balanced finish.",
    price: 24,
    qty: 2,
    detail: "30 ml",
    image: photo.plant,
  },
  {
    id: "cream",
    name: "Calm Recovery Cream",
    description: "A gentle layer of comfort for your evening routine.",
    price: 32,
    qty: 1,
    detail: "50 ml",
    image: photo.lamp,
  },
  {
    id: "mask",
    name: "Ritual Clay Mask",
    description: "A weekly reset with a soft, mineral-rich texture.",
    price: 18,
    qty: 1,
    detail: "100 ml",
    image: photo.plant,
  },
  {
    id: "salve",
    name: "Velvet Lip Salve",
    description: "Everyday hydration in a pocket-sized companion.",
    price: 14,
    qty: 1,
    detail: "10 ml",
    image: photo.lamp,
  },
];
export function DeliverySummaryCart() {
  const cart = useCart(beauty),
    [discount, setDiscount] = useState(15),
    [error, setError] = useState(""),
    [destination, setDestination] = useState("Brooklyn, New York"),
    [edit, setEdit] = useState(false);
  const amount = Math.max(0, cart.subtotal + 12 - discount),
    tax = Math.round(amount * 0.08 * 100) / 100,
    total = amount + tax;
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 py-10 sm:p-10" data-cart-variant="2">
      <header>
        <p className="text-xs tracking-[.2em] text-muted-foreground">YOUR BAG</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">Shopping Cart</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {cart.count} items · Delivery by 9 PM today
        </p>
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="divide-y">
          {cart.items.map((item) => (
            <article key={item.id} className="flex gap-4 py-6 first:pt-0">
              <img
                src={item.image}
                alt={item.name}
                className="size-24 shrink-0 rounded-xl bg-muted object-cover sm:size-28"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  <strong className="text-sm">{money(item.price * item.qty)}</strong>
                </div>
                <p className="mt-2 max-w-72 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="secondary">{item.detail}</Badge>
                  <span className="text-xs text-muted-foreground">{money(item.price)} each</span>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => cart.remove(item.id)}
                  >
                    <X />
                  </Button>
                  <Quantity item={item} onChange={(v) => cart.update(item.id, v)} />
                </div>
              </div>
            </article>
          ))}
          {!cart.items.length && <CartEmpty onReset={() => cart.setItems(beauty)} />}
        </div>
        <Frame>
          <FrameHeader className="flex-row justify-between">
            <FrameTitle>Order summary</FrameTitle>
            <Badge size="sm" variant="secondary">
              Estimated
            </Badge>
          </FrameHeader>
          <FramePanel className="space-y-5 p-5">
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Truck className="mt-1 size-4" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Pace Courier · $12.00</p>
                <p className="mt-1 text-xs text-muted-foreground">{destination}</p>
              </div>
              <Button variant="link" className="h-auto p-0 text-xs" onClick={() => setEdit(true)}>
                Change
              </Button>
            </div>
            <CartTotals
              rows={[
                [`Items (${cart.count})`, money(cart.subtotal)],
                ["Delivery", "$12.00"],
                ["Discount", `−${money(discount)}`],
                ["Amount", money(amount)],
                ["Estimated tax", money(tax)],
              ]}
              total={total}
            />
            <PromoField
              code="STUDIO15"
              applied={discount ? "STUDIO15 · $15 off" : undefined}
              error={error}
              onRemove={() => setDiscount(0)}
              onApply={(code) => {
                const valid = code.toUpperCase() === "STUDIO15";
                setDiscount(valid ? 15 : 0);
                setError(valid ? "" : "Use STUDIO15 for $15 off.");
              }}
            />
            <CartCheckout
              total={total}
              label={`Secure checkout · ${money(total)}`}
              disabled={!cart.items.length}
            />
          </FramePanel>
          <FrameFooter>
            <CartTrust />
          </FrameFooter>
        </Frame>
      </div>
      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delivery destination</DialogTitle>
            <DialogDescription>
              Update the delivery city shown in this demo order.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setEdit(false);
            }}
          >
            <Label htmlFor="cart-delivery-city">City and region</Label>
            <Input
              id="cart-delivery-city"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
            <Button type="submit">Save destination</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
const apparel: CartItem[] = [
  {
    id: "blouse",
    name: "Atelier Tulle Blouse",
    price: 48,
    qty: 2,
    detail: "Onyx · Size M",
    image: photo.shirt,
  },
  {
    id: "crossbody",
    name: "Atelier Quilted Crossbody",
    price: 138,
    qty: 1,
    detail: "Sage · One size",
    image: photo.bag,
  },
  {
    id: "mules",
    name: "Heritage Suede Mules",
    price: 168,
    qty: 1,
    detail: "Ivory · Size 8",
    image: photo.shoes,
  },
];
export function DataTableCart() {
  const cart = useCart(apparel),
    tax = Math.round(cart.subtotal * 0.08 * 100) / 100;
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 py-10 sm:p-12" data-cart-variant="3">
      <div className="flex flex-wrap justify-between gap-4">
        <h2 className="text-2xl font-semibold">
          Shopping Cart{" "}
          <span className="text-sm font-normal text-muted-foreground">{cart.count} items</span>
        </h2>
        <Button variant="ghost" onClick={() => cart.setItems(apparel)}>
          <ArrowLeft />
          Continue shopping
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-52">Product details</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead className="text-right">Total price</TableHead>
            <TableHead>
              <span className="sr-only">Remove</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cart.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="py-5">
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-16 rounded-lg bg-muted object-cover"
                  />
                  <div className="text-wrap">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{money(item.price)}</TableCell>
              <TableCell>
                <Quantity item={item} onChange={(v) => cart.update(item.id, v)} />
              </TableCell>
              <TableCell className="text-right font-semibold">
                {money(item.price * item.qty)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => cart.remove(item.id)}
                >
                  <X />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!cart.items.length && <CartEmpty onReset={() => cart.setItems(apparel)} />}
      <aside className="ml-auto max-w-md space-y-6 rounded-xl bg-muted/25 p-6">
        <h3 className="font-semibold">Order summary</h3>
        <CartTotals
          rows={[
            [`Subtotal (${cart.count} items)`, money(cart.subtotal)],
            ["Shipping", "Free"],
            ["Estimated tax", money(tax)],
          ]}
          total={cart.subtotal + tax}
        />
        <p className="flex items-center gap-2 text-xs text-success">
          <Check className="size-4" />
          You saved $20.00 on shipping
        </p>
        <CartCheckout total={cart.subtotal + tax} disabled={!cart.items.length} />
      </aside>
    </div>
  );
}
const tech: CartItem[] = [
  {
    id: "camera",
    name: "Lumen Compact Camera",
    price: 99.89,
    qty: 1,
    detail: "Red",
    image: photo.headphones,
  },
  {
    id: "controller",
    name: "Helix Pro Controller",
    price: 49.99,
    qty: 1,
    detail: "Yellow",
    image: photo.lamp,
  },
  {
    id: "velar",
    name: "Velar Wireless Headphones",
    price: 71.69,
    qty: 1,
    detail: "Dark blue",
    image: photo.headphones,
  },
];
export function PickupOptionCart() {
  const cart = useCart(tech),
    [modes, setModes] = useState<Record<string, string>>({
      camera: "Delivery",
      controller: "Delivery",
      velar: "Pickup",
    }),
    [promotion, setPromotion] = useState(true),
    [notice, setNotice] = useState(false);
  const deliveryItems = cart.items.filter((i) => modes[i.id] === "Delivery").length,
    pickupItems = cart.items.length - deliveryItems,
    fee = cart.items.some((i) => i.id === "camera" && modes[i.id] === "Delivery") ? 15 : 0,
    discount = promotion ? Math.round(cart.subtotal * 0.15 * 100) / 100 : 0,
    tax = Math.round(Math.max(0, cart.subtotal - discount + fee) * 0.07 * 100) / 100,
    total = Math.max(0, cart.subtotal + fee - discount + tax);
  return (
    <div className="mx-auto max-w-6xl space-y-7 p-4 py-8 sm:p-10" data-cart-variant="4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => setNotice(true)}>Shop</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cart</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <h2 className="flex items-center gap-3 text-2xl font-semibold">
          Shopping Cart<Badge variant="secondary">{cart.count}</Badge>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {deliveryItems} ready Feb 1 · {pickupItems} ready today
        </p>
      </div>
      {notice && (
        <Alert>
          <AlertDescription>Your catalog selection is saved in this cart.</AlertDescription>
        </Alert>
      )}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="divide-y">
          {cart.items.map((item) => (
            <article key={item.id} className="relative flex gap-4 py-6 first:pt-0">
              <img
                src={item.image}
                alt={item.name}
                className="size-20 shrink-0 rounded-xl bg-muted object-contain sm:size-28"
              />
              <div className="min-w-0 flex-1 pr-7">
                <h3 className="font-medium">{item.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                <RadioGroup
                  value={modes[item.id]}
                  onValueChange={(v) => setModes((prev) => ({ ...prev, [item.id]: v }))}
                  className="mt-4 grid gap-2 sm:grid-cols-2"
                >
                  {["Delivery", "Pickup"].map((m) => (
                    <label
                      key={m}
                      className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 has-[[data-state=checked]]:border-foreground"
                    >
                      <RadioGroupItem
                        value={m}
                        aria-label={`${m} for ${item.name}`}
                        className="mt-0.5"
                      />
                      <span className="text-xs font-medium">
                        {m}
                        <span className="mt-1 block font-normal text-muted-foreground">
                          {m === "Pickup"
                            ? "Today · Free"
                            : `Feb 1 · ${item.id === "camera" ? "$15.00" : "Free"}`}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <Quantity item={item} onChange={(v) => cart.update(item.id, v)} />
                  <strong>{money(item.price * item.qty)}</strong>
                </div>
              </div>
              <Button
                className="absolute top-0 right-0"
                size="icon-sm"
                variant="ghost"
                aria-label={`Remove ${item.name}`}
                onClick={() => cart.remove(item.id)}
              >
                <X />
              </Button>
            </article>
          ))}
          {!cart.items.length && <CartEmpty onReset={() => cart.setItems(tech)} />}
        </div>
        <aside className="space-y-6 rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Order total</p>
          <p className="text-3xl font-semibold" data-cart-total>
            {money(total)}
          </p>
          {promotion && <Badge variant="success-light">You saved {money(discount)}</Badge>}
          <dl className="space-y-3 text-sm">
            {[
              ["Subtotal", money(cart.subtotal)],
              [`Delivery (${deliveryItems} items)`, money(fee)],
              [`Pickup (${pickupItems} items)`, "Free"],
              ["Promo · 15%", `−${money(discount)}`],
              ["Tax · 7%", money(tax)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <Separator />
          {promotion ? (
            <div className="flex items-center justify-between">
              <Badge variant="secondary">HAPPY2026</Badge>
              <Button size="sm" variant="ghost" onClick={() => setPromotion(false)}>
                Remove discount
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setPromotion(true)}>
              Apply HAPPY2026
            </Button>
          )}
          <CartCheckout total={total} disabled={!cart.items.length} label="Checkout securely" />
        </aside>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <Button variant="ghost" onClick={() => setNotice(true)}>
          <ArrowLeft />
          Back to catalog
        </Button>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="size-4" />
          Free pickup at your local store
        </p>
      </div>
    </div>
  );
}
const electronics: CartItem[] = [
  {
    id: "atlas",
    name: "Atlas Compact Studio Headphones",
    price: 249.99,
    qty: 1,
    detail: "Midnight Black",
    image: photo.headphones,
  },
  {
    id: "watch",
    name: "Trail Beacon GPS Field Watch",
    price: 329.99,
    qty: 1,
    detail: "Carbon Grey",
    image: photo.headphones,
  },
  {
    id: "speaker",
    name: "Pulse Field Bluetooth Speaker",
    price: 109.99,
    qty: 1,
    detail: "Deep Slate",
    image: photo.lamp,
  },
  {
    id: "earbuds",
    name: "Helix Air Sport Wireless Earbuds",
    price: 179.99,
    qty: 2,
    detail: "Cobalt",
    image: photo.headphones,
  },
];
export function PaymentMethodCart() {
  const cart = useCart(electronics),
    [method, setMethod] = useState("PayPal"),
    [discount, setDiscount] = useState(0),
    [error, setError] = useState("");
  const tax = Math.round(Math.max(0, cart.subtotal - discount) * 0.08407 * 100) / 100,
    total = Math.max(0, cart.subtotal - discount + 19.99 + tax);
  return (
    <div className="mx-auto max-w-6xl p-4 py-8 sm:p-8" data-cart-variant="5">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-xl border">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
            <div>
              <h2 className="text-xl font-semibold">Shopping Cart</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {cart.count} items in review · ORD-48291
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => cart.setItems(electronics)}>
              Continue shopping
            </Button>
          </header>
          <div className="flex justify-between bg-muted/25 px-5 py-3 text-xs text-muted-foreground">
            <span>Product</span>
            <span>Quantity / Price</span>
          </div>
          <div className="divide-y px-5">
            {cart.items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-4 py-5">
                <img
                  src={item.image}
                  alt={item.name}
                  className="size-16 rounded-lg bg-muted object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium">{item.name}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0 text-xs text-muted-foreground"
                    onClick={() => cart.remove(item.id)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="flex w-full items-center justify-between gap-4 pl-20 sm:w-auto sm:flex-col sm:items-end sm:pl-0">
                  <Quantity item={item} onChange={(v) => cart.update(item.id, v)} />
                  <strong className="text-sm">{money(item.price * item.qty)}</strong>
                </div>
              </div>
            ))}
            {!cart.items.length && <CartEmpty onReset={() => cart.setItems(electronics)} />}
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border p-4">
            <PromoField
              code=""
              error={error}
              applied={discount ? "STUDIO50 · $50 off" : undefined}
              onRemove={() => setDiscount(0)}
              onApply={(code) => {
                const valid = code.toUpperCase() === "STUDIO50";
                setDiscount(valid ? 50 : 0);
                setError(valid ? "" : "Use STUDIO50 for $50 off.");
              }}
            />
          </div>
          <div className="space-y-5 rounded-xl border p-5">
            <h3 className="font-semibold">Order summary</h3>
            <CartTotals
              rows={[
                [`Subtotal (${cart.count} items)`, money(cart.subtotal)],
                ["Discount", `−${money(discount)}`],
                ["Delivery", "$19.99"],
                ["Estimated tax", money(tax)],
              ]}
              total={total}
            />
            <p className="text-right text-xs text-muted-foreground">USD</p>
          </div>
          <div className="space-y-4 rounded-xl border p-5">
            <h3 className="font-semibold">Payment method</h3>
            <RadioGroup value={method} onValueChange={setMethod} className="grid grid-cols-2">
              {["PayPal", "Stripe", "Apple Pay", "Bitcoin"].map((m) => (
                <label
                  key={m}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-xs has-[[data-state=checked]]:border-foreground"
                >
                  <RadioGroupItem value={m} />
                  {m}
                </label>
              ))}
            </RadioGroup>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {method === "PayPal"
                ? "Review this order with your PayPal account."
                : method === "Stripe"
                  ? "Pay securely using your preferred debit or credit card."
                  : method === "Apple Pay"
                    ? "Use your saved Apple Pay details for a quick checkout."
                    : "A Bitcoin payment request will be prepared for review."}{" "}
              This demo keeps all actions local.
            </p>
            <CartCheckout
              total={total}
              disabled={!cart.items.length}
              method={method}
              label="Checkout"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
