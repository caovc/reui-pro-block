import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  LockKeyhole,
  Truck,
  ShieldCheck,
  Trash2,
  Plus,
  Minus,
  Package,
  Download,
  Printer,
  Heart,
  ShoppingBag,
  Mail,
  Bell,
} from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { products, Money, SectionHeading, Brand } from "./shared";

interface CreditSummary {
  provider: string;
  tokens: number;
  rate: number;
  auto: boolean;
  alert: boolean;
}
function Summary({
  subtotal = 236,
  discount = 0,
  creditDetails,
  children,
}: {
  subtotal?: number;
  discount?: number;
  creditDetails?: CreditSummary;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <h3 className="font-medium">Order summary</h3>
      {creditDetails ? (
        <>
          <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
            <span className="flex size-11 items-center justify-center rounded-lg border bg-background text-sm font-semibold">
              {creditDetails.provider.slice(0, 2)}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">{creditDetails.provider} credit pack</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {creditDetails.tokens}M tokens · ${creditDetails.rate} per 1M
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <span className="flex items-center justify-between">
              Credit delivery<Badge variant="secondary">Instant</Badge>
            </span>
            <span className="flex items-center justify-between">
              Auto top-up<span>{creditDetails.auto ? "Enabled" : "Off"}</span>
            </span>
            <span className="flex items-center justify-between">
              Usage alerts<span>{creditDetails.alert ? "Enabled" : "Off"}</span>
            </span>
          </div>
        </>
      ) : (
        products.slice(0, 2).map((p, i) => (
          <div className="flex gap-3" key={p.name}>
            <img className="size-14 rounded-md bg-muted object-cover" src={p.image} alt={p.name} />
            <div className="flex-1 text-sm">
              <p className="font-medium">{p.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.color} / {i === 0 ? "M" : "One size"} · Qty 1
              </p>
            </div>
            <span className="text-sm">
              <Money value={p.price} />
            </span>
          </div>
        ))
      )}
      <Separator />
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <Money value={subtotal} />
        </div>
        {!creditDetails && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>Free</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount</span>
            <span>
              −<Money value={discount} />
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <Money value={subtotal * 0.08} />
        </div>
      </div>
      <Separator />
      <div className="flex justify-between font-semibold">
        <span>
          Total <span className="text-xs font-normal text-muted-foreground">USD</span>
        </span>
        <Money value={subtotal * 1.08 - discount} />
      </div>
      {children}
    </div>
  );
}

export function Checkout({ block }: BlockProps) {
  const i = block.index,
    credit = i === 2,
    onePage = i === 5,
    express = i === 3;
  const [step, setStep] = useState(express || onePage ? 2 : 0),
    [complete, setComplete] = useState(false),
    [promo, setPromo] = useState(""),
    [discount, setDiscount] = useState(0),
    [message, setMessage] = useState(""),
    [method, setMethod] = useState("card"),
    [pack, setPack] = useState("1"),
    [email, setEmail] = useState(""),
    [edit, setEdit] = useState(false),
    [provider, setProvider] = useState("OpenAI"),
    [autoTopup, setAutoTopup] = useState(false),
    [usageAlert, setUsageAlert] = useState(true),
    [newCard, setNewCard] = useState(false),
    [cardNumber, setCardNumber] = useState(""),
    [expiry, setExpiry] = useState("");
  const steps = credit
    ? ["Credits", "Billing", "Payment", "Review"]
    : ["Account", "Shipping", "Payment", "Review"];
  const providerRates: Record<string, number> = {
    OpenAI: 25,
    Anthropic: 30,
    Google: 18,
    Mistral: 12,
  };
  const subtotal = credit ? Number(pack) * providerRates[provider] : 187;
  const apply = () => {
    setDiscount(promo.toUpperCase() === "WELCOME20" ? subtotal * 0.2 : 0);
    setMessage(
      promo.toUpperCase() === "WELCOME20"
        ? "WELCOME20 applied — 20% off."
        : "Try WELCOME20 for 20% off.",
    );
  };
  if (complete)
    return (
      <div className="mx-auto flex min-h-[580px] max-w-xl flex-col items-center justify-center gap-5 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <CheckCircle2 className="size-8 text-emerald-600" />
        </div>
        <Badge variant="secondary">Order #FM-10248</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">You're all set.</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {credit
            ? "Your credits are ready to use."
            : "Thanks for your order. We’re getting your everyday essentials ready."}{" "}
          Your local demo confirmation is ready{email ? ` for ${email}` : ""}. No real order or
          payment was created.
        </p>
        <Button
          onClick={() => {
            setComplete(false);
            setStep(express || onePage ? 2 : 0);
          }}
        >
          Start a new order
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    );
  return (
    <div className="mx-auto max-w-5xl p-5 sm:p-10">
      <div className="mb-8 flex items-center justify-between">
        <Brand />
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5" />
          Secure checkout
        </span>
      </div>
      <SectionHeading
        title={
          credit
            ? "Top up your AI credits"
            : express
              ? "A few details, then it’s yours."
              : "Complete your order"
        }
        description={
          credit ? "One balance. All your favorite models." : "Thoughtfully made. Almost yours."
        }
      />
      {!onePage && !express && (
        <div className="mb-8 flex items-center gap-3">
          {steps.map((s, j) => (
            <div className="flex min-w-0 flex-1 items-center gap-2" key={s}>
              <button
                type="button"
                onClick={() => j < step && setStep(j)}
                disabled={j > step}
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  j <= step && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {j < step ? <Check className="size-3" /> : j + 1}
              </button>
              <span
                className={cn("hidden text-xs sm:block", j !== step && "text-muted-foreground")}
              >
                {s}
              </span>
              {j < 3 && <div className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-8 md:grid-cols-[1.15fr_1fr]">
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 3 || onePage || express) setComplete(true);
            else setStep(step + 1);
          }}
        >
          {step === 0 && credit ? (
            <FieldGroup>
              <Field>
                <FieldLabel>Choose a model provider</FieldLabel>
                <ToggleGroup
                  type="single"
                  value={provider}
                  onValueChange={(v) => v && setProvider(v)}
                  variant="outline"
                  className="grid grid-cols-2"
                >
                  {Object.entries(providerRates).map(([name, rate]) => (
                    <ToggleGroupItem
                      key={name}
                      value={name}
                      className="h-auto justify-between gap-2 p-4"
                    >
                      <span>{name}</span>
                      <span className="text-[10px] text-muted-foreground">${rate} / 1M</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel>Choose your credit pack</FieldLabel>
                <Select value={pack} onValueChange={setPack}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {["1", "5", "10", "25"].map((n) => (
                        <SelectItem value={n} key={n}>
                          {n}M tokens · ${Number(n) * providerRates[provider]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <p className="text-xs text-muted-foreground">
                Illustrative demo pricing. These are not live provider rates.
              </p>
              <Separator />
              <Field orientation="horizontal">
                <Switch id="auto-topup" checked={autoTopup} onCheckedChange={setAutoTopup} />
                <div>
                  <FieldLabel htmlFor="auto-topup">Auto top-up</FieldLabel>
                  <FieldDescription>
                    Add credits when your balance falls below $10.
                  </FieldDescription>
                </div>
              </Field>
              {autoTopup && (
                <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                  Your selected {Number(pack)}M token pack will be added automatically when the demo
                  balance drops below $10. You can turn this off at any time.
                </div>
              )}
              <Field orientation="horizontal">
                <Switch id="usage-alert" checked={usageAlert} onCheckedChange={setUsageAlert} />
                <div>
                  <FieldLabel htmlFor="usage-alert">Usage alerts</FieldLabel>
                  <FieldDescription>Get a notification at 80% of your balance.</FieldDescription>
                </div>
              </Field>
            </FieldGroup>
          ) : step === 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" type="button" onClick={() => setStep(1)}>
                  Continue as guest
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setEmail("demo@example.com");
                    setStep(1);
                  }}
                >
                  {i === 6 ? "Continue with Google" : "Use demo account"}
                </Button>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Separator className="flex-1" />
                or continue with email
                <Separator className="flex-1" />
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="checkout-email">Email address</FieldLabel>
                  <Input
                    id="checkout-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="checkout-password">Password</FieldLabel>
                  <Input
                    id="checkout-password"
                    type="password"
                    minLength={6}
                    required
                    placeholder="Create a password"
                  />
                </Field>
                <Field orientation="horizontal">
                  <Checkbox id="account-check" />
                  <FieldLabel htmlFor="account-check">Send me product news and updates</FieldLabel>
                </Field>
              </FieldGroup>
            </>
          ) : null}
          {step === 1 && (
            <FieldGroup>
              <h3 className="text-base font-medium">
                {credit ? "Billing details" : "Shipping address"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="checkout-first">First name</FieldLabel>
                  <Input id="checkout-first" required placeholder="Alex" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="checkout-last">Last name</FieldLabel>
                  <Input id="checkout-last" required placeholder="Morgan" />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="checkout-address">Street address</FieldLabel>
                <Input id="checkout-address" required placeholder="123 Market Street" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="checkout-city">City</FieldLabel>
                  <Input id="checkout-city" required placeholder="San Francisco" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="checkout-zip">Postal code</FieldLabel>
                  <Input id="checkout-zip" required placeholder="94103" />
                </Field>
              </div>
              <Field>
                <FieldLabel>Country</FieldLabel>
                <Select defaultValue="us">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          )}
          {(step === 2 || onePage) && (
            <FieldGroup>
              {express && (
                <div className="rounded-lg border p-4 text-sm">
                  <div className="mb-2 flex justify-between">
                    <span className="font-medium">Saved details</span>
                    <Button variant="ghost" size="sm" type="button" onClick={() => setEdit(!edit)}>
                      {edit ? "Done" : "Edit"}
                    </Button>
                  </div>
                  {edit ? (
                    <Input
                      aria-label="Edit shipping address"
                      defaultValue="123 Market St, San Francisco, CA 94103"
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      Alex Morgan · 123 Market St
                      <br />
                      San Francisco, CA 94103
                    </p>
                  )}
                </div>
              )}
              {onePage && (
                <Field>
                  <FieldLabel htmlFor="onepage-email">Email address</FieldLabel>
                  <Input
                    required
                    type="email"
                    id="onepage-email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
              )}
              <h3 className="font-medium">Payment method</h3>
              <ToggleGroup
                type="single"
                variant="outline"
                value={method}
                onValueChange={(v) => v && setMethod(v)}
                className="justify-start"
              >
                {["card", "wallet", ...(credit ? ["invoice"] : [])].map((x) => (
                  <ToggleGroupItem value={x} key={x}>
                    {x === "card" ? <CreditCard className="size-4" /> : null}
                    {x[0].toUpperCase() + x.slice(1)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {method === "card" ? (
                <>
                  {express && (
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <CreditCard className="size-4" />
                          Visa ending in 4242
                        </span>
                        <Badge variant="secondary">Saved card</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Expires 12/28 · Alex Morgan
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setNewCard(!newCard)}
                      >
                        {newCard ? "Use saved card" : "Use a different card"}
                      </Button>
                    </div>
                  )}
                  {(!express || newCard) && (
                    <>
                      <Field>
                        <FieldLabel htmlFor="checkout-card">Card number</FieldLabel>
                        <Input
                          id="checkout-card"
                          required
                          inputMode="numeric"
                          pattern="[0-9 ]{16,23}"
                          value={cardNumber}
                          onChange={(e) =>
                            setCardNumber(
                              e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 19)
                                .replace(/(.{4})/g, "$1 ")
                                .trim(),
                            )
                          }
                          placeholder="4242 4242 4242 4242"
                          maxLength={23}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="checkout-expiry">Expiry date</FieldLabel>
                        <Input
                          id="checkout-expiry"
                          required
                          placeholder="MM / YY"
                          pattern="[0-9]{2} ?/? ?[0-9]{2}"
                          value={expiry}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setExpiry(
                              value.length > 2 ? value.slice(0, 2) + " / " + value.slice(2) : value,
                            );
                          }}
                          maxLength={7}
                        />
                      </Field>
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="checkout-cvv">Security code</FieldLabel>
                      <Input
                        id="checkout-cvv"
                        required
                        inputMode="numeric"
                        pattern="[0-9]{3,4}"
                        maxLength={4}
                        placeholder="123"
                      />
                    </Field>
                  </div>
                  <Field orientation="horizontal">
                    <Checkbox id="same-billing" defaultChecked />
                    <FieldLabel htmlFor="same-billing">
                      Billing address is the same as shipping
                    </FieldLabel>
                  </Field>
                </>
              ) : (
                <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  {method === "wallet"
                    ? "This demo uses a local wallet confirmation. Continue to confirm your order."
                    : "Your demo invoice will be generated when you confirm this order."}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Demo checkout. No real payment is processed.
              </p>
            </FieldGroup>
          )}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-medium">Review your order</h3>
              {["Your details are saved", "Shipping is free", "Payment method is confirmed"].map(
                (t) => (
                  <div key={t} className="flex items-center gap-3 rounded-lg border p-4 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    {t}
                  </div>
                ),
              )}
              <p className="text-xs leading-5 text-muted-foreground">
                By placing this demo order, you confirm the details above. No real payment will be
                taken.
              </p>
            </div>
          )}
          <Button type="submit" size="lg">
            {step === 3 || onePage || express
              ? `Place demo order · $${(subtotal * 1.08 - discount).toFixed(2)}`
              : "Continue"}
            <ArrowRight data-icon="inline-end" />
          </Button>
          {step > 0 && !onePage && !express && (
            <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
        </form>
        <aside className="flex flex-col gap-4 self-start md:sticky md:top-6">
          <Summary
            subtotal={subtotal}
            discount={discount}
            creditDetails={
              credit
                ? {
                    provider,
                    tokens: Number(pack),
                    rate: providerRates[provider],
                    auto: autoTopup,
                    alert: usageAlert,
                  }
                : undefined
            }
          >
            <div className="flex gap-2">
              <Input
                aria-label="Discount code"
                placeholder="Discount code"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
              />
              <Button variant="outline" onClick={apply}>
                Apply
              </Button>
            </div>
            {message && (
              <p className="text-xs text-muted-foreground" role="status">
                {message}
              </p>
            )}
          </Summary>
          <div className="flex justify-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" />
              Secure payment
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="size-3.5" />
              {credit ? "Instant credits" : "Free shipping"}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ShoppingCart({ block }: BlockProps) {
  const i = block.index;
  const [items, setItems] = useState(
      products.slice(0, 3).map((p, j) => ({ ...p, qty: j === 0 ? 2 : 1, saved: false })),
    ),
    [delivery, setDelivery] = useState("delivery"),
    [code, setCode] = useState(""),
    [applied, setApplied] = useState(false),
    [checkout, setCheckout] = useState(false);
  const subtotal = items.filter((p) => !p.saved).reduce((s, p) => s + p.price * p.qty, 0);
  const change = (name: string, delta: number) =>
    setItems(
      items.map((p) =>
        p.name === name ? { ...p, qty: Math.max(1, Math.min(9, p.qty + delta)) } : p,
      ),
    );
  const remove = (name: string) => setItems(items.filter((p) => p.name !== name));
  const body = (
    <div className="flex flex-col gap-6">
      <div className="divide-y">
        {items.map((p) => (
          <div className="flex gap-4 py-5" key={p.name}>
            <img src={p.image} alt={p.name} className="size-20 rounded-lg bg-muted object-cover" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex justify-between gap-3">
                <h3 className="text-sm font-medium">{p.name}</h3>
                <span className="text-sm font-medium">
                  <Money value={p.price * p.qty} />
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {p.color} / {p.category === "Clothing" ? "Medium" : "One size"}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-7 items-center rounded-md border">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Decrease ${p.name}`}
                    onClick={() => change(p.name, -1)}
                  >
                    <Minus />
                  </Button>
                  <span className="w-5 text-center text-xs">{p.qty}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Increase ${p.name}`}
                    onClick={() => change(p.name, 1)}
                  >
                    <Plus />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(p.name)}
                  aria-label={`Remove ${p.name}`}
                >
                  <Trash2 />
                </Button>
                {i === 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() =>
                      setItems(
                        items.map((x) => (x.name === p.name ? { ...x, saved: !x.saved } : x)),
                      )
                    }
                  >
                    {p.saved ? "Move to bag" : "Save for later"}
                  </Button>
                )}
                {p.saved && <Badge variant="secondary">Saved</Badge>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12">
          <ShoppingBag className="size-8 text-muted-foreground" />
          <p>Your bag is empty</p>
          <Button
            variant="outline"
            onClick={() =>
              setItems(products.slice(0, 3).map((p) => ({ ...p, qty: 1, saved: false })))
            }
          >
            Restore demo items
          </Button>
        </div>
      )}
      {i === 3 && (
        <ToggleGroup
          type="single"
          variant="outline"
          value={delivery}
          onValueChange={(v) => v && setDelivery(v)}
        >
          <ToggleGroupItem value="delivery">Ship to me</ToggleGroupItem>
          <ToggleGroupItem value="pickup">Pick up in store</ToggleGroupItem>
        </ToggleGroup>
      )}
      <div className="rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground">
        <Truck className="mb-2 size-4" />
        {delivery === "pickup"
          ? "Ready for pickup tomorrow at our Market Street studio."
          : "Your order qualifies for free shipping. Estimated delivery: 3–5 business days."}
      </div>
    </div>
  );
  const totals = (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <h3 className="font-medium">Order summary</h3>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <Money value={subtotal} />
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Delivery</span>
        <span>Free</span>
      </div>
      {applied && (
        <div className="flex justify-between text-sm text-emerald-600">
          <span>WELCOME20</span>
          <span>
            −<Money value={subtotal * 0.2} />
          </span>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="Promo code"
          aria-label="Cart promo code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button variant="outline" onClick={() => setApplied(code.toUpperCase() === "WELCOME20")}>
          Apply
        </Button>
      </div>
      <span className="text-xs text-muted-foreground">Use WELCOME20 for 20% off.</span>
      <Separator />
      <div className="flex justify-between font-semibold">
        <span>Estimated total</span>
        <Money value={subtotal * (applied ? 0.8 : 1)} />
      </div>
      <Button disabled={subtotal === 0} onClick={() => setCheckout(true)}>
        Checkout
        <ArrowRight data-icon="inline-end" />
      </Button>
      {i === 4 && (
        <div className="flex gap-2">
          <Badge variant="outline">VISA</Badge>
          <Badge variant="outline">Mastercard</Badge>
          <Badge variant="outline">PayPal</Badge>
        </div>
      )}
      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <LockKeyhole className="size-3" />
        Secure checkout
      </p>
    </div>
  );
  if (checkout) return <Checkout block={{ ...block, index: 5, category: "checkout" }} />;
  if (i >= 5)
    return (
      <div className="flex min-h-[480px] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-5">
          <ShoppingBag className="size-10" />
          <h2 className="text-xl font-semibold">Your favorites, ready to go.</h2>
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            Take a look at what’s in your bag before you head out.
          </p>
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <ShoppingBag data-icon="inline-start" />
                Open shopping bag<Badge variant="secondary">{items.length}</Badge>
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-auto sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Shopping bag ({items.length})</SheetTitle>
              </SheetHeader>
              <div className="p-5">
                {body}
                <div className="mt-5">{totals}</div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-10">
      <SectionHeading
        title="Your shopping bag"
        description={`${items.filter((p) => !p.saved).length} considered essentials.`}
      />
      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
        {body}
        <aside>{totals}</aside>
      </div>
    </div>
  );
}

export function Wishlist({ block }: BlockProps) {
  const [items, setItems] = useState(products.slice(0, 6)),
    [selected, setSelected] = useState<string[]>([]),
    [cart, setCart] = useState<string[]>([]),
    [notified, setNotified] = useState<string[]>([]),
    [board, setBoard] = useState("All items");
  const i = block.index;
  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-10">
      <SectionHeading
        title={i === 3 ? "Your collections" : "Saved for a little later"}
        description={`${items.length} things you love. Keep them close.`}
        action={
          cart.length > 0 ? (
            <Badge variant="secondary">{cart.length} added to bag</Badge>
          ) : undefined
        }
      />
      {i === 3 && (
        <ToggleGroup
          type="single"
          value={board}
          onValueChange={(v) => v && setBoard(v)}
          className="mb-6 justify-start"
        >
          {["All items", "Everyday", "For the home"].map((t) => (
            <ToggleGroupItem value={t} key={t}>
              {t}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {i === 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Checkbox
            aria-label="Select all wishlist items"
            checked={selected.length === items.length && items.length > 0}
            onCheckedChange={(v) => setSelected(v ? items.map((p) => p.name) : [])}
          />
          <span className="text-sm">{selected.length} selected</span>
          <Button
            size="sm"
            variant="outline"
            disabled={!selected.length}
            onClick={() => {
              setCart([...new Set([...cart, ...selected])]);
              setSelected([]);
            }}
          >
            Move selected to bag
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!selected.length}
            onClick={() => {
              setItems(items.filter((p) => !selected.includes(p.name)));
              setSelected([]);
            }}
          >
            Remove selected
          </Button>
        </div>
      )}
      <div className={cn("grid grid-cols-2 gap-5", i === 5 ? "lg:grid-cols-4" : "md:grid-cols-3")}>
        {items
          .filter(
            (p) =>
              board === "All items" ||
              (board === "For the home" ? p.category === "Home" : p.category !== "Home"),
          )
          .map((p, j) => (
            <article className="relative flex flex-col gap-3" key={p.name}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                <img src={p.image} alt={p.name} className="size-full object-cover" />
                {i === 0 && (
                  <Checkbox
                    className="absolute left-3 top-3 bg-background"
                    aria-label={`Select ${p.name}`}
                    checked={selected.includes(p.name)}
                    onCheckedChange={(v) =>
                      setSelected(v ? [...selected, p.name] : selected.filter((x) => x !== p.name))
                    }
                  />
                )}
                <Button
                  className="absolute right-3 top-3"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Remove ${p.name} from wishlist`}
                  onClick={() => setItems(items.filter((x) => x.name !== p.name))}
                >
                  <Heart className="fill-current" />
                </Button>
                {i === 4 && (
                  <Badge variant="secondary" className="absolute bottom-3 left-3">
                    Priority {j + 1}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">{p.name}</h3>
                <span className="text-sm">
                  <Money value={p.price} />
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {p.color} · {j === 2 && i === 1 ? "Currently out of stock" : "In stock"}
              </p>
              <Button
                variant={cart.includes(p.name) ? "secondary" : "outline"}
                size="sm"
                onClick={() =>
                  j === 2 && i === 1
                    ? setNotified([...notified, p.name])
                    : setCart([...new Set([...cart, p.name])])
                }
              >
                {j === 2 && i === 1 ? (
                  <Bell data-icon="inline-start" />
                ) : (
                  <ShoppingBag data-icon="inline-start" />
                )}
                {j === 2 && i === 1
                  ? notified.includes(p.name)
                    ? "Restock alert on"
                    : "Notify when available"
                  : cart.includes(p.name)
                    ? "Added to bag"
                    : "Move to bag"}
              </Button>
            </article>
          ))}
      </div>
      {items.length === 0 && (
        <div className="py-20 text-center text-sm text-muted-foreground">
          Your wishlist is ready for a fresh start.
        </div>
      )}
    </div>
  );
}

function downloadReceipt() {
  const blob = new Blob(
    [
      "FORMA / ORDER FM-10248\n\nEveryday Cotton Tee  $38.00\nStudio Wireless  $149.00\nShipping  Free\nTax  $14.96\nTOTAL PAID  $201.96\n\nThank you for your order.",
    ],
    { type: "text/plain" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "forma-receipt-FM-10248.txt";
  link.click();
  URL.revokeObjectURL(url);
}
export function Receipt({ block }: BlockProps) {
  const i = block.index,
    [status, setStatus] = useState(""),
    [review, setReview] = useState(""),
    [rating, setRating] = useState("5");
  const slip = i === 2;
  return (
    <div className={cn("mx-auto max-w-4xl p-6 sm:p-10", slip && "max-w-md font-mono")}>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <Brand />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Download receipt"
            onClick={downloadReceipt}
          >
            <Download />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Print receipt"
            onClick={() => window.print()}
          >
            <Printer />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Prepare receipt email"
            onClick={() =>
              setStatus("Receipt ready. Download the file to attach it to your email.")
            }
          >
            <Mail />
          </Button>
        </div>
      </div>
      <div
        className={cn("rounded-xl border bg-card p-6 sm:p-8", slip && "rounded-none border-dashed")}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">ORDER #FM-10248</p>
            <h2 className="mt-2 text-xl font-semibold">
              {i === 3
                ? "Delivered. Enjoy your essentials."
                : slip
                  ? "ORDER RECEIPT"
                  : "Thanks for your order."}
            </h2>
          </div>
          {!slip && (
            <Badge variant="secondary">
              <CheckCircle2 data-icon="inline-start" />
              {i === 3 ? "Delivered" : "Paid"}
            </Badge>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">October 22, 2026 · Visa ending in 4242</p>
        <Separator className="my-6" />
        {i === 1 && (
          <div className="mb-7 grid grid-cols-5 gap-2">
            {["Placed", "Confirmed", "Packed", "Shipped", "Delivered"].map((s, j) => (
              <div className="flex flex-col items-center gap-2 text-center" key={s}>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border",
                    j < 3 && "bg-primary text-primary-foreground",
                  )}
                >
                  {j < 3 ? <Check className="size-3" /> : <Package className="size-3" />}
                </span>
                <span className="text-[10px] text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-5">
          {products.slice(0, 2).map((p) => (
            <div className="flex items-start gap-4" key={p.name}>
              {!slip && (
                <img
                  src={p.image}
                  alt={p.name}
                  className="size-16 rounded-md bg-muted object-cover"
                />
              )}
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.color} · Qty 1</span>
                {i === 3 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Write review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Review {p.name}</DialogTitle>
                        </DialogHeader>
                        <form
                          className="flex flex-col gap-4"
                          onSubmit={(e) => {
                            e.preventDefault();
                            setStatus("Thank you. Your demo review has been saved.");
                          }}
                        >
                          <ToggleGroup
                            type="single"
                            value={rating}
                            onValueChange={(v) => v && setRating(v)}
                          >
                            {["1", "2", "3", "4", "5"].map((n) => (
                              <ToggleGroupItem key={n} value={n}>
                                {n} ★
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                          <Textarea
                            aria-label="Your review"
                            placeholder="How has it been?"
                            required
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                          />
                          <Button type="submit">Submit review</Button>
                          {status && (
                            <p className="text-xs text-muted-foreground" role="status">
                              {status}
                            </p>
                          )}
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatus(`${p.name} added to your bag.`)}
                    >
                      Buy again
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setStatus(`Return request started for ${p.name}. Demo request saved.`)
                      }
                    >
                      Return item
                    </Button>
                  </div>
                )}
              </div>
              <span className="text-sm">
                <Money value={p.price} />
              </span>
            </div>
          ))}
        </div>
        <Separator className="my-6" />
        <div className="ml-auto flex max-w-xs flex-col gap-3 text-sm">
          {[
            ["Subtotal", "$187.00"],
            ["Shipping", "Free"],
            ["Tax", "$14.96"],
          ].map(([a, b]) => (
            <div className="flex justify-between" key={a}>
              <span className="text-muted-foreground">{a}</span>
              <span>{b}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-3 font-semibold">
            <span>Total paid</span>
            <span>$201.96</span>
          </div>
        </div>
        {!slip && (
          <>
            <Separator className="my-6" />
            <div className="grid gap-5 text-xs sm:grid-cols-3">
              <div>
                <p className="mb-2 font-medium">Ship to</p>
                <p className="leading-5 text-muted-foreground">
                  Alex Morgan
                  <br />
                  123 Market Street
                  <br />
                  San Francisco, CA 94103
                </p>
              </div>
              <div>
                <p className="mb-2 font-medium">Payment</p>
                <p className="leading-5 text-muted-foreground">
                  Visa •••• 4242
                  <br />
                  Paid on October 22, 2026
                </p>
              </div>
              <div>
                <p className="mb-2 font-medium">Estimated arrival</p>
                <p className="leading-5 text-muted-foreground">
                  October 26–28, 2026
                  <br />
                  Free standard shipping
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      {i === 5 && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => setStatus("Tracking: your order is being prepared for shipment.")}
          >
            <Truck data-icon="inline-start" />
            Track order
          </Button>
          <Button variant="outline" onClick={downloadReceipt}>
            Download invoice
          </Button>
        </div>
      )}
      {status && (
        <p className="mt-4 text-center text-sm text-muted-foreground" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
