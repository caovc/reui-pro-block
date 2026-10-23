import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  CreditCard,
  HelpCircle,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/reui/badge";
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { cn } from "@/lib/utils";
import {
  CheckLine,
  CheckoutCrumb,
  CheckoutField,
  CheckoutSteps,
  dollars,
  PaymentFields,
  SuccessOrder,
} from "./checkout-shared";
import headphones from "./assets/headphones.jpg";
import bag from "./assets/bag.jpg";
import ceramics from "./assets/detail-grid/ceramics.jpg";
import plant from "./assets/plant.jpg";
import shirt from "./assets/shirt.jpg";
export function AICreditCheckout() {
  const [step, setStep] = useState(1),
    [provider, setProvider] = useState("OpenAI"),
    [pack, setPack] = useState("Builder Pack"),
    [auto, setAuto] = useState(true),
    [usage, setUsage] = useState(true),
    [method, setMethod] = useState("Card"),
    [consent, setConsent] = useState(false),
    [done, setDone] = useState(false),
    [guide, setGuide] = useState(false);
  const plans = [
      { name: "Starter Pack", tokens: "1M", price: 29 },
      { name: "Builder Pack", tokens: "5M", price: 119 },
      { name: "Scale Pack", tokens: "20M", price: 399 },
    ],
    selected = plans.find((p) => p.name === pack)!;
  if (done)
    return (
      <SuccessOrder
        total={selected.price}
        title={`${selected.tokens} ${provider} credits issued`}
        onReset={() => {
          setDone(false);
          setStep(1);
          setConsent(false);
        }}
      />
    );
  return (
    <div className="mx-auto max-w-3xl p-4 py-10 sm:p-10" data-checkout-variant="3">
      <Frame spacing="lg">
        <FrameHeader className="flex-row items-center justify-between gap-3">
          <div>
            <FrameTitle>AI Token Checkout</FrameTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {provider} · {selected.tokens} tokens · {dollars(selected.price)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setGuide(true)}>
            <HelpCircle />
            Guide
          </Button>
        </FrameHeader>
        <FramePanel className="space-y-7 p-5 sm:p-7">
          <CheckoutSteps
            step={step}
            max={step}
            onStep={setStep}
            labels={["Provider", "Tokens", "Pay"]}
          />
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 3) setStep(step + 1);
              else if (consent) setDone(true);
            }}
          >
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold">Provider balance</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose the provider for your prepaid workspace balance.
                  </p>
                </div>
                <RadioGroup
                  value={provider}
                  onValueChange={setProvider}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  {["OpenAI", "Claude", "Gemini", "Mistral"].map((name, i) => (
                    <label
                      key={name}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 has-[[data-state=checked]]:border-foreground"
                    >
                      <IconTile variant="outline" size="lg">
                        {i === 0 ? (
                          <Sparkles />
                        ) : (
                          <span
                            className={cn(
                              "text-lg font-bold",
                              i === 1 && "text-orange-600",
                              i === 2 && "text-blue-500",
                            )}
                          >
                            {name[0]}
                          </span>
                        )}
                      </IconTile>
                      <span className="flex-1 text-sm font-medium">
                        {name}
                        {i === 0 && (
                          <Badge size="sm" variant="secondary" className="ml-2">
                            Default
                          </Badge>
                        )}
                        {i === 2 && (
                          <Badge size="sm" variant="info-light" className="ml-2">
                            Media
                          </Badge>
                        )}
                      </span>
                      <RadioGroupItem value={name} aria-label={name} />
                    </label>
                  ))}
                </RadioGroup>
              </>
            )}
            {step === 2 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold">Token package</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start with the balance that matches your next project.
                  </p>
                </div>
                <RadioGroup value={pack} onValueChange={setPack}>
                  {plans.map((p) => (
                    <label
                      key={p.name}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 has-[[data-state=checked]]:border-foreground"
                    >
                      <RadioGroupItem value={p.name} />
                      <span className="flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {p.name}
                          {p.name === "Builder Pack" && (
                            <Badge variant="secondary" size="sm">
                              Popular
                            </Badge>
                          )}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {p.tokens} tokens · {dollars(p.price / parseInt(p.tokens))} per 1M
                        </span>
                      </span>
                      <strong className="text-lg">{dollars(p.price)}</strong>
                    </label>
                  ))}
                </RadioGroup>
                <div className="divide-y rounded-xl border">
                  {[
                    {
                      name: "Auto top-up",
                      copy: "Recharge when balance falls below 15%.",
                      value: auto,
                      set: setAuto,
                    },
                    {
                      name: "Usage alert",
                      copy: "Notify me when 80% of credits are used.",
                      value: usage,
                      set: setUsage,
                    },
                  ].map((row) => (
                    <Label
                      key={row.name}
                      className="flex cursor-pointer items-center justify-between gap-4 p-4"
                    >
                      <span>
                        <span className="block text-sm font-medium">{row.name}</span>
                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                          {row.copy}
                        </span>
                      </span>
                      <Switch checked={row.value} onCheckedChange={row.set} aria-label={row.name} />
                    </Label>
                  ))}
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <IconTile variant="soft">
                    <Sparkles />
                  </IconTile>
                  <div className="flex-1">
                    <h2 className="font-semibold">
                      {provider} · {pack}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selected.tokens} prepaid tokens
                    </p>
                  </div>
                  <strong>{dollars(selected.price)}</strong>
                </div>
                <dl className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Tokens</dt>
                    <dd className="mt-1 font-medium">{selected.tokens}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Recharge</dt>
                    <dd className="mt-1 font-medium">{auto ? "Automatic" : "Manual"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Due today</dt>
                    <dd className="mt-1 font-medium">{dollars(selected.price)}</dd>
                  </div>
                </dl>
                <CheckoutField
                  label="Billing email"
                  type="email"
                  defaultValue="billing@northstar.studio"
                  required
                />
                <RadioGroup value={method} onValueChange={setMethod}>
                  {["Card", "Wallet", "Invoice"].map((m) => (
                    <label
                      key={m}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm has-[[data-state=checked]]:border-foreground"
                    >
                      <RadioGroupItem value={m} />
                      {m}
                    </label>
                  ))}
                </RadioGroup>
                {method === "Card" ? (
                  <>
                    <CheckoutField label="Name on card" defaultValue="Northstar Studio" required />
                    <CheckoutField
                      label="Card number"
                      defaultValue="4242 4242 4242 4242"
                      required
                      pattern="[0-9 ]{13,23}"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <CheckoutField
                        label="Expiry"
                        defaultValue="08/28"
                        required
                        pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                      />
                      <CheckoutField label="CVC" defaultValue="123" required pattern="[0-9]{3,4}" />
                    </div>
                  </>
                ) : (
                  <Alert variant="info">
                    <AlertDescription>
                      {method === "Wallet"
                        ? "A workspace wallet will fund this demo purchase."
                        : "An invoice will be prepared for your workspace."}
                    </AlertDescription>
                  </Alert>
                )}
                <CheckoutField label="Purchase order" defaultValue="AI-2048" />
                <CheckLine checked={consent} onCheckedChange={setConsent}>
                  I understand these prepaid credits are issued to the selected provider.
                </CheckLine>
              </>
            )}
            <div className="flex items-center justify-between gap-3 border-t pt-5">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft />
                  Previous
                </Button>
              ) : (
                <span className="max-w-56 text-xs text-muted-foreground">
                  Choose AI balance for your workspace.
                </span>
              )}
              <Button type="submit" disabled={step === 3 && !consent}>
                {step === 3 ? "Issue credits" : "Next step"}
                <ArrowRight />
              </Button>
            </div>
          </form>
        </FramePanel>
        <FrameFooter className="flex-row items-center gap-2 text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5" />
          Secure workspace billing
        </FrameFooter>
      </Frame>
      <Dialog open={guide} onOpenChange={setGuide}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prepaid AI credits</DialogTitle>
            <DialogDescription>
              Choose a provider, select a package, then review billing. Credits, automatic top-up
              and alerts are simulated locally. No provider account or payment is connected.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function ExpressCheckout() {
  const [done, setDone] = useState(false),
    [edit, setEdit] = useState(""),
    [contact, setContact] = useState("riley.soto@example.com"),
    [address, setAddress] = useState("218 Ellis St, Oakland, CA 94607"),
    [card, setCard] = useState("Visa ending 1847"),
    [newCard, setNewCard] = useState(false),
    [notice, setNotice] = useState(false);
  if (done) return <SuccessOrder total={136.32} onReset={() => setDone(false)} />;
  return (
    <div className="mx-auto max-w-5xl p-4 py-10 sm:p-10" data-checkout-variant="4">
      <div className="grid overflow-hidden rounded-2xl border md:grid-cols-2">
        <div className="flex min-w-0 flex-col bg-muted/30 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Back to store"
              onClick={() => setNotice(true)}
            >
              <ArrowLeft />
            </Button>
            <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs text-background">
              N
            </span>
            <strong className="text-sm">Northline Goods</strong>
          </div>
          <img
            src={headphones}
            alt="Aero Wireless Headphones"
            className="mx-auto my-10 aspect-square w-52 rounded-xl bg-background object-contain"
          />
          <div className="mb-8 text-center">
            <Badge size="sm" variant="secondary">
              Qty 1
            </Badge>
            <h2 className="mt-4 text-xl font-semibold">Aero Wireless Headphones</h2>
            <p className="mt-2 text-sm text-muted-foreground">Graphite · Personal audio</p>
            <Badge className="mt-3" size="sm" variant="success-light">
              Arrives Thu, May 16
            </Badge>
          </div>
          <dl className="mt-auto space-y-3 text-sm">
            {[
              ["Subtotal", "$118.00"],
              ["Delivery · FedEx 2-day", "$8.00"],
              ["Estimated tax", "$10.32"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd>$136.32</dd>
            </div>
          </dl>
        </div>
        <div className="space-y-6 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Express checkout
          </p>
          <div>
            <h2 className="text-2xl font-semibold">Confirm & pay</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your saved details make this a quick checkout.
            </p>
          </div>
          {notice && (
            <Alert>
              <AlertDescription>Your bag is saved for later.</AlertDescription>
            </Alert>
          )}
          <div className="divide-y rounded-xl border">
            {[
              [Mail, "Contact", contact],
              [MapPin, "Deliver to", address],
              [CreditCard, "Pay with", card],
            ].map(([Icon, label, value]) => {
              const I = Icon as typeof Mail;
              return (
                <div key={String(label)} className="flex items-start gap-3 p-4">
                  <I className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{label as string}</p>
                    <p className="mt-1 break-words text-sm">{value as string}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEdit(String(label))}>
                    Edit
                  </Button>
                </div>
              );
            })}
          </div>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
            }}
          >
            <div className="grid grid-cols-[80px_minmax(0,1fr)] items-end gap-3">
              <CheckoutField
                label="CVV"
                aria-label={`CVV for ${card}`}
                required
                pattern="[0-9]{3,4}"
                inputMode="numeric"
                placeholder="123"
              />
              <Button type="submit" className="h-9">
                Pay $136.32
                <LockKeyhole />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This order will use {card}. Review your details above.
            </p>
            <Collapsible open={newCard} onOpenChange={setNewCard}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between border-t pt-5"
                >
                  Use a different card
                  <ChevronDown className={cn(newCard && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <CheckoutField
                  label="New cardholder"
                  defaultValue="Riley Soto"
                  required={newCard}
                />
                <CheckoutField
                  label="New card number"
                  required={newCard}
                  pattern="[0-9 ]{13,23}"
                  onChange={(e) =>
                    setCard("Visa ending " + e.target.value.replace(/\D/g, "").slice(-4))
                  }
                />
                <CheckoutField
                  label="New card expiry"
                  placeholder="MM/YY"
                  required={newCard}
                  pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                />
              </CollapsibleContent>
            </Collapsible>
          </form>
          <div className="flex flex-wrap gap-3 border-t pt-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              Encrypted checkout
            </span>
            <span>30-day returns</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => setEdit("Order policy")}
            >
              Order policy
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit("")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {edit === "Order policy" ? "Order policy" : `Edit ${edit.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              {edit === "Order policy"
                ? "Return unused items within 30 days. This is an illustrative local shop policy."
                : "Save updated details for this local checkout."}
            </DialogDescription>
          </DialogHeader>
          {edit !== "Order policy" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setEdit("");
              }}
            >
              <CheckoutField
                label={edit}
                type={edit === "Contact" ? "email" : "text"}
                value={edit === "Contact" ? contact : edit === "Deliver to" ? address : card}
                onChange={(e) =>
                  edit === "Contact"
                    ? setContact(e.target.value)
                    : edit === "Deliver to"
                      ? setAddress(e.target.value)
                      : setCard(e.target.value)
                }
                required
              />
              <Button type="submit">Save changes</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function OnePageCheckout() {
  const [done, setDone] = useState(false),
    [billing, setBilling] = useState(true),
    [delivery, setDelivery] = useState("Courier delivery"),
    [notice, setNotice] = useState(false);
  const total = delivery === "Store pickup" ? 293.08 : 302.08;
  if (done) return <SuccessOrder total={total} onReset={() => setDone(false)} />;
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 py-8 sm:p-10" data-checkout-variant="6">
      <CheckoutCrumb onBack={() => setNotice(true)} />
      <h2 className="text-2xl font-semibold">Checkout</h2>
      <p className="text-sm text-muted-foreground">
        Everything you need for a comfortable home, in one checkout.
      </p>
      {notice && (
        <Alert>
          <AlertDescription>Your bag is ready whenever you are.</AlertDescription>
        </Alert>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Frame>
          <FrameHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <FrameTitle>Morrow Home Checkout</FrameTitle>
              <Badge variant="success-light">Ready to ship</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              A few thoughtful additions for the everyday.
            </p>
          </FrameHeader>
          <FramePanel className="space-y-6 p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total due</p>
              <p className="mt-1 text-3xl font-semibold" data-checkout-total>
                {dollars(total)}
              </p>
            </div>
            {[
              {
                name: "Linen Weekender Tote",
                detail: "Natural linen · Qty 1",
                price: 128,
                image: bag,
              },
              {
                name: "Ceramic Table Set",
                detail: "Warm white · Qty 1",
                price: 76,
                image: ceramics,
              },
              { name: "Hinoki Care Duo", detail: "Two-piece set · Qty 2", price: 68, image: plant },
            ].map((p) => (
              <div key={p.name} className="flex gap-4">
                <img
                  src={p.image}
                  alt={p.name}
                  className="size-20 rounded-lg bg-muted object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{p.name}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{p.detail}</p>
                </div>
                <strong className="text-sm">{dollars(p.price)}</strong>
              </div>
            ))}
            <Separator />
            <dl className="space-y-3 text-sm">
              {[
                ["Subtotal", "$272.00"],
                ["Delivery", delivery === "Store pickup" ? "Free" : "$9.00"],
                ["Estimated tax", "$21.08"],
                ["Total", dollars(total)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </FramePanel>
          <FrameFooter className="flex-row items-center gap-2 text-xs text-muted-foreground">
            <LockKeyhole className="size-4" />
            An encrypted receipt follows your order.
          </FrameFooter>
        </Frame>
        <div className="space-y-5 rounded-xl border p-5">
          <div>
            <h3 className="font-semibold">Payment details</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Finish your order with your preferred method.
            </p>
          </div>
          <Button className="w-full" onClick={() => setDone(true)}>
            <Wallet />
            Apple Pay
          </Button>
          <div className="flex items-center gap-3 text-[10px] tracking-widest text-muted-foreground">
            <Separator className="flex-1" />
            OR CARD
            <Separator className="flex-1" />
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
            }}
          >
            <CheckoutField
              label="Email"
              type="email"
              defaultValue="avery.miles@example.com"
              required
            />
            <h4 className="pt-2 text-sm font-medium">Shipping</h4>
            <CheckoutField label="Recipient" defaultValue="Avery Miles" required />
            <CheckoutField label="Address" defaultValue="18 Stillman St" required />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Delivery method</Label>
                <Select value={delivery} onValueChange={setDelivery}>
                  <SelectTrigger aria-label="Delivery method" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Courier delivery">Courier delivery</SelectItem>
                    <SelectItem value="Store pickup">Store pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CheckoutField label="Postal code" defaultValue="94107" required />
            </div>
            <h4 className="pt-2 text-sm font-medium">Card details</h4>
            <div className="flex flex-wrap gap-2">
              {["VISA", "Mastercard", "AMEX", "Discover"].map((s) => (
                <Badge variant="outline" size="sm" key={s}>
                  {s}
                </Badge>
              ))}
            </div>
            <CheckoutField
              label="Card number"
              defaultValue="4242 4242 4242 4242"
              required
              pattern="[0-9 ]{13,23}"
            />
            <div className="grid grid-cols-2 gap-3">
              <CheckoutField
                label="Expiry"
                defaultValue="08/29"
                required
                pattern="(0[1-9]|1[0-2])/[0-9]{2}"
              />
              <CheckoutField label="CVC" defaultValue="184" required pattern="[0-9]{3,4}" />
            </div>
            <CheckLine checked={billing} onCheckedChange={setBilling}>
              Billing matches shipping address
            </CheckLine>
            {!billing && (
              <div className="space-y-4 rounded-lg bg-muted/40 p-3">
                <CheckoutField label="Billing address" required />
                <CheckoutField label="Billing postal code" required />
              </div>
            )}
            <Button type="submit" className="w-full">
              Pay {dollars(total)}
              <LockKeyhole />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
export function SocialCheckout() {
  const [step, setStep] = useState(1),
    [max, setMax] = useState(1),
    [done, setDone] = useState(false),
    [news, setNews] = useState(true),
    [speed, setSpeed] = useState("Express"),
    [method, setMethod] = useState("Card"),
    [auth, setAuth] = useState(""),
    [discount, setDiscount] = useState(10),
    [promo, setPromo] = useState("SAVE10"),
    [invalid, setInvalid] = useState(false);
  const total = 333 + (speed === "Express" ? 12 : 0) + 29.31 - discount;
  if (done)
    return (
      <SuccessOrder
        total={total}
        onReset={() => {
          setDone(false);
          setStep(1);
          setMax(1);
        }}
      />
    );
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 py-10 sm:p-10" data-checkout-variant="7">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button
            variant="link"
            className="mb-2 h-auto p-0 text-muted-foreground"
            onClick={() => setAuth("Your bag")}
          >
            <ArrowLeft />
            Back to cart
          </Button>
          <h2 className="text-3xl font-semibold">Checkout</h2>
          <p className="mt-2 text-sm text-muted-foreground">4 items · {dollars(total)}</p>
        </div>
        <div className="w-full sm:w-96">
          <CheckoutSteps
            step={step}
            max={max}
            onStep={setStep}
            labels={["Customer", "Address", "Delivery", "Payment"]}
            bars
          />
        </div>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_312px]">
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 4) setDone(true);
            else {
              setStep(step + 1);
              setMax(Math.max(max, step + 1));
            }
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">
              {["Customer", "Shipping address", "Delivery method", "Payment"][step - 1]}
            </h3>
            {step === 1 && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setAuth("Email sign-in")}
              >
                Have an account? Sign in
              </Button>
            )}
          </div>
          {step === 1 && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {["Apple", "Google", "X"].map((s) => (
                  <Button key={s} type="button" variant="outline" onClick={() => setAuth(s)}>
                    {s}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-4 text-[10px] tracking-wider text-muted-foreground">
                <Separator className="flex-1" />
                OR CONTINUE WITH EMAIL
                <Separator className="flex-1" />
              </div>
              <CheckoutField
                label="Email"
                type="email"
                defaultValue="morgan.lee@example.com"
                required
              />
              <CheckoutField label="Phone (optional)" type="tel" defaultValue="(415) 555-0148" />
              <CheckLine checked={news} onCheckedChange={setNews}>
                Keep me up to date with news and exclusive offers
              </CheckLine>
            </>
          )}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <CheckoutField label="First name" defaultValue="Morgan" required />
                <CheckoutField label="Last name" defaultValue="Lee" required />
              </div>
              <CheckoutField label="Street address" defaultValue="1428 Valencia St" required />
              <CheckoutField label="Apartment, suite (optional)" />
              <div className="grid grid-cols-2 gap-4">
                <CheckoutField label="City" defaultValue="San Francisco" required />
                <CheckoutField label="Postal code" defaultValue="94110" required />
              </div>
              <CheckoutField label="Country" defaultValue="United States" required />
            </>
          )}
          {step === 3 && (
            <RadioGroup value={speed} onValueChange={setSpeed}>
              {["Standard", "Express", "Pickup"].map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 has-[[data-state=checked]]:border-foreground"
                >
                  <RadioGroupItem value={s} />
                  <span className="flex-1 text-sm">
                    {s}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {s === "Express"
                        ? "Arrives May 14"
                        : s === "Standard"
                          ? "Arrives May 17–19"
                          : "Collect tomorrow"}
                    </span>
                  </span>
                  <span className="text-sm">{s === "Express" ? "$12.00" : "Free"}</span>
                </label>
              ))}
            </RadioGroup>
          )}
          {step === 4 && <PaymentFields method={method} onMethod={setMethod} />}
          <div className="flex items-center justify-between gap-3 border-t pt-5">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft />
                Back
              </Button>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <LockKeyhole className="size-3" />
                Secure checkout
              </span>
            )}
            <Button type="submit">
              {step === 4 ? `Place order · ${dollars(total)}` : "Continue"}
              <ArrowRight />
            </Button>
          </div>
        </form>
        <aside className="space-y-5 lg:border-l lg:pl-7">
          <h3 className="font-semibold">Order summary</h3>
          {[
            {
              name: "Wireless Headphones",
              detail: "Charcoal · Qty 1",
              image: headphones,
              price: 199,
            },
            { name: "Classic Cotton Tee", detail: "White · M · Qty 2", image: shirt, price: 56 },
            { name: "Leather Bifold Wallet", detail: "Tan · Qty 1", image: bag, price: 78 },
          ].map((p) => (
            <div key={p.name} className="flex gap-3">
              <img
                src={p.image}
                alt={p.name}
                className="size-14 rounded-lg bg-muted object-cover"
              />
              <div className="flex-1 text-sm">
                <h4 className="font-medium">{p.name}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{p.detail}</p>
              </div>
              <span className="text-sm">{dollars(p.price)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex gap-2">
            <CheckoutField
              label="Discount code"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
            />
            <Button
              variant="outline"
              className="mt-7"
              onClick={() => {
                const valid = promo.toUpperCase() === "SAVE10";
                setDiscount(valid ? 10 : 0);
                setInvalid(!valid);
              }}
            >
              Apply
            </Button>
          </div>
          {invalid ? (
            <p role="alert" className="text-xs text-destructive">
              Use SAVE10 in this preview.
            </p>
          ) : (
            discount > 0 && <Badge variant="success-light">SAVE10 · $10 off</Badge>
          )}
          <dl className="space-y-3 text-sm">
            {[
              ["Subtotal", "$333.00"],
              ["Shipping", speed === "Express" ? "$12.00" : "Free"],
              ["Tax", "$29.31"],
              ["Discount", `−${dollars(discount)}`],
              ["Total", dollars(total)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className={k === "Total" ? "text-lg font-semibold" : ""}>{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
      <Dialog open={!!auth} onOpenChange={(v) => !v && setAuth("")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {auth === "Your bag" ? "Your bag is saved" : `Continue with ${auth}`}
            </DialogTitle>
            <DialogDescription>
              Authentication is simulated locally. No external account is connected.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setAuth("")}>Continue as Morgan Lee</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
