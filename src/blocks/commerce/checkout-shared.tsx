/** Checkout domain composition. Free REUI owns step navigation, framing, badges and alerts;
 * order calculations, address selection and validation are local domain behavior. */
import { useId, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import jacket from "./assets/jacket.jpg";
import shirt from "./assets/shirt.jpg";
export const dollars = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
export function CheckoutField({
  label,
  ...props
}: ComponentProps<typeof Input> & { label: string }) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} className="h-9" {...props} />
    </Field>
  );
}
export function CheckLine({
  children,
  checked,
  onCheckedChange,
}: {
  children: ReactNode;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm leading-5">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5"
      />
      <span>{children}</span>
    </label>
  );
}
export function CheckoutCrumb({ onBack }: { onBack: () => void }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <button onClick={onBack}>Store</button>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <button onClick={onBack}>Bag</button>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Checkout</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
export function CheckoutSteps({
  step,
  onStep,
  labels = ["Customer", "Delivery", "Payment", "Review"],
  bars = false,
  max = 4,
}: {
  step: number;
  onStep: (v: number) => void;
  labels?: string[];
  bars?: boolean;
  max?: number;
}) {
  return (
    <Stepper
      value={step}
      onValueChange={onStep}
      indicators={{ completed: <Check className="size-3.5" /> }}
    >
      <StepperNav className={cn("items-center", bars && "gap-2")}>
        {labels.map((label, i) => (
          <StepperItem
            key={label}
            step={i + 1}
            completed={step > i + 1}
            disabled={i + 1 > max}
            className={cn("flex-1 last:flex-none", bars && "last:flex-1")}
          >
            <StepperTrigger
              type="button"
              className={cn(
                "flex-col gap-2 py-2 sm:flex-row",
                bars && "w-full flex-col items-start gap-2 rounded-none sm:flex-col sm:items-start",
              )}
            >
              {bars ? (
                <span
                  className={cn(
                    "h-1 w-full rounded-full bg-muted",
                    step >= i + 1 && "bg-foreground",
                  )}
                />
              ) : (
                <StepperIndicator className="size-7 data-[state=active]:outline-2 data-[state=active]:outline-offset-3 data-[state=active]:outline-dotted data-[state=active]:outline-border">
                  {i + 1}
                </StepperIndicator>
              )}
              <StepperTitle className="text-xs sm:text-sm">{label}</StepperTitle>
            </StepperTrigger>
            {!bars && i < labels.length - 1 && <StepperSeparator className="mx-2 sm:mx-5" />}
          </StepperItem>
        ))}
      </StepperNav>
    </Stepper>
  );
}
export function TrustStrip() {
  return (
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 border-t pt-6 text-xs text-muted-foreground">
      {[
        [LockKeyhole, "Secure checkout"],
        [ShieldCheck, "14-day returns"],
        [Truck, "Free shipping over $150"],
      ].map(([Icon, text]) => {
        const I = Icon as typeof Truck;
        return (
          <span key={String(text)} className="flex items-center gap-2">
            <I className="size-4" />
            {text as string}
          </span>
        );
      })}
    </div>
  );
}
export function SuccessOrder({
  total,
  onReset,
  title = "Your order is confirmed",
}: {
  total: number;
  onReset: () => void;
  title?: string;
}) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <Alert variant="success">
        <Check />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          Order #DEMO-2048 · {dollars(total)}. This local preview has recorded your selection. No
          payment was processed.
        </AlertDescription>
      </Alert>
      <Button className="mt-6 w-full" variant="outline" onClick={onReset}>
        Start a new order
      </Button>
    </div>
  );
}
export function PaymentFields({
  method,
  onMethod,
}: {
  method: string;
  onMethod: (s: string) => void;
}) {
  return (
    <div className="space-y-5">
      <RadioGroup value={method} onValueChange={onMethod} className="grid grid-cols-3">
        {["Card", "PayPal", "Apple Pay"].map((m) => (
          <label
            key={m}
            className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-xs has-[[data-state=checked]]:border-foreground"
          >
            <RadioGroupItem value={m} />
            <span>{m}</span>
          </label>
        ))}
      </RadioGroup>
      {method === "Card" ? (
        <>
          <CheckoutField
            label="Name on card"
            defaultValue="Morgan Lee"
            required
            autoComplete="cc-name"
          />
          <CheckoutField
            label="Card number"
            defaultValue="4242 4242 4242 4242"
            required
            inputMode="numeric"
            pattern="[0-9 ]{13,23}"
            autoComplete="cc-number"
          />
          <div className="grid grid-cols-2 gap-4">
            <CheckoutField
              label="Expiry"
              defaultValue="08/28"
              required
              pattern="(0[1-9]|1[0-2])/[0-9]{2}"
              autoComplete="cc-exp"
            />
            <CheckoutField
              label="CVC"
              defaultValue="123"
              required
              inputMode="numeric"
              pattern="[0-9]{3,4}"
              autoComplete="cc-csc"
            />
          </div>
          <SaveCard />
        </>
      ) : (
        <Alert variant="info">
          <CreditCard />
          <AlertTitle>{method} selected</AlertTitle>
          <AlertDescription>
            Continue to review your order. Payment authorization is simulated in this preview.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
function SaveCard() {
  const [save, setSave] = useState(true);
  return (
    <CheckLine checked={save} onCheckedChange={setSave}>
      Save this card for my next order
    </CheckLine>
  );
}
interface CheckoutItem {
  name: string;
  price: number;
  image: string;
  detail: string;
}
const defaultItems: CheckoutItem[] = [
  { name: "Leather Biker Jacket", price: 248, image: jacket, detail: "Black · M · Qty 1" },
  { name: "Ribbed Tank Set", price: 86, image: shirt, detail: "Chalk · S · Qty 1" },
];
export function FourStepCheckout({ variant }: { variant: 1 | 2 | 5 }) {
  const [step, setStep] = useState(1),
    [completed, setCompleted] = useState(1),
    [items, setItems] = useState(defaultItems),
    [promo, setPromo] = useState("SPRING15"),
    [discount, setDiscount] = useState(variant === 2 ? 0 : 18),
    [promoError, setPromoError] = useState(""),
    [speed, setSpeed] = useState("Express"),
    [address, setAddress] = useState("Home"),
    [method, setMethod] = useState("Card"),
    [confirm, setConfirm] = useState(false),
    [done, setDone] = useState(false),
    [account, setAccount] = useState(false),
    [newsletter, setNewsletter] = useState(false),
    [notice, setNotice] = useState(""),
    [editAddress, setEditAddress] = useState(false);
  const [contact, setContact] = useState({
    first: "Morgan",
    last: "Lee",
    email: "morgan.lee@example.com",
    phone: "(415) 555-0148",
    country: "United States",
  });
  const [street, setStreet] = useState("1428 Valencia St"),
    [city, setCity] = useState("San Francisco"),
    [zip, setZip] = useState("94110");
  const subtotal = items.reduce((sum, item) => sum + item.price, 0),
    delivery = speed === "Express" ? 12 : 0,
    tax = Math.round(Math.max(0, subtotal * 0.09065868 - discount * 0.08777778) * 100) / 100,
    total = Math.max(0, subtotal + delivery + tax - discount);
  const advance = () => {
    setStep((s) => Math.min(s + 1, 4));
    setCompleted((c) => Math.max(c, Math.min(step + 1, 4)));
  };
  const apply = () => {
    if (promo.trim().toUpperCase() === "SPRING15") {
      setDiscount(18);
      setPromoError("");
    } else {
      setDiscount(0);
      setPromoError("Use SPRING15 for $18 off this demo order.");
    }
  };
  const title = ["Customer details", "Delivery details", "Payment details", "Review your order"][
    step - 1
  ];
  const back = () => setNotice("Your bag is saved. Continue checkout whenever you are ready.");
  if (done)
    return (
      <SuccessOrder
        total={total}
        onReset={() => {
          setDone(false);
          setStep(1);
          setCompleted(1);
          setConfirm(false);
        }}
      />
    );
  const summary = (
    <div className="space-y-5">
      {items.map((item) => (
        <div className="flex items-start gap-3" key={item.name}>
          <img
            src={item.image}
            alt={item.name}
            className="size-16 shrink-0 rounded-lg bg-muted object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{item.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
            <p className="mt-2 text-sm font-semibold">
              {dollars(item.price)}{" "}
              {item.price === 86 && (
                <del className="ml-1 text-xs font-normal text-muted-foreground">$118.00</del>
              )}
            </p>
          </div>
          <Button
            type="button"
            size={variant === 2 ? "sm" : "icon-sm"}
            variant="ghost"
            aria-label={`Remove ${item.name}`}
            onClick={() => setItems((prev) => prev.filter((p) => p.name !== item.name))}
          >
            {variant === 2 ? "Remove" : <X />}
          </Button>
        </div>
      ))}
      {!items.length && <p className="text-sm text-muted-foreground">Your bag is empty.</p>}
      <Separator />
      <div className="space-y-2">
        <InputGroup className="h-10">
          <InputGroupAddon>
            <Tag />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Promo code"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton onClick={apply}>Apply</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {promoError ? (
          <p role="alert" className="text-xs text-destructive">
            {promoError}
          </p>
        ) : (
          discount > 0 && (
            <div className="flex items-center justify-between text-xs text-success">
              <span>SPRING15 applied</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDiscount(0);
                  setPromo("");
                }}
              >
                Remove discount
              </Button>
            </div>
          )
        )}
      </div>
      <dl className="space-y-3 text-sm">
        {[
          ["Subtotal", dollars(subtotal)],
          ["Delivery", delivery ? dollars(delivery) : "Free"],
          ["Estimated tax", dollars(tax)],
          ...(discount ? [["Discount", `−${dollars(discount)}`]] : []),
        ].map(([key, value]) => (
          <div key={key} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{key}</dt>
            <dd className={key === "Discount" ? "text-success" : ""}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
  const totalView = (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between text-sm font-medium">
        <span>Total</span>
        <strong className="text-xl tabular-nums" data-checkout-total>
          {dollars(total)}
        </strong>
      </div>
      {variant !== 2 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{variant === 1 ? "Charged after review" : "Shipping to " + address}</span>
          <Badge size="sm" variant={step === 4 ? "success-light" : "secondary"}>
            {step === 4 ? "Ready to place" : `Step ${step} of 4`}
          </Badge>
        </div>
      )}
    </div>
  );
  return (
    <div
      className={cn(
        "mx-auto max-w-6xl space-y-8 p-4 py-8 sm:p-8 lg:p-12",
        variant === 2 && "max-w-5xl",
      )}
      data-checkout-variant={variant}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {variant === 2 ? (
          <h2 className="text-2xl font-semibold">Checkout</h2>
        ) : (
          <CheckoutCrumb onBack={back} />
        )}
        <Button variant={variant === 5 ? "ghost" : "outline"} size="sm" onClick={back}>
          <ArrowLeft />
          Continue shopping
        </Button>
      </div>
      {variant !== 2 && (
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Checkout</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A few details, then your next favorites are on their way.
          </p>
        </div>
      )}
      {notice && (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      <CheckoutSteps step={step} max={completed} onStep={setStep} />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <div className="min-w-0 space-y-6">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {
                [
                  "Use the contact details you would like on your receipt.",
                  "Choose where and how your order should arrive.",
                  "Choose a secure way to pay.",
                  "Check your details before placing this order.",
                ][step - 1]
              }
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 4) advance();
              else if (confirm && items.length) setDone(true);
            }}
            className="space-y-6"
          >
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(
                    [
                      ["first", "First name"],
                      ["last", "Last name"],
                      ["email", "Email"],
                      ["phone", "Phone"],
                    ] as const
                  ).map(([key, label]) => (
                    <CheckoutField
                      key={key}
                      label={label}
                      type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                      value={contact[key]}
                      onChange={(e) => setContact((c) => ({ ...c, [key]: e.target.value }))}
                      required
                    />
                  ))}
                  <Field>
                    <FieldLabel>Country</FieldLabel>
                    <Select
                      value={contact.country}
                      onValueChange={(v) => setContact((c) => ({ ...c, country: v }))}
                    >
                      <SelectTrigger className="h-9 w-full" aria-label="Country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["United States", "Canada", "United Kingdom", "Australia"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                {variant === 2 ? (
                  <CheckLine checked={account} onCheckedChange={setAccount}>
                    <strong className="font-medium">Create an account</strong>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Keep track of orders and check out faster next time.
                    </span>
                  </CheckLine>
                ) : (
                  <>
                    <Separator />
                    <h4 className="font-medium">Account options</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-4 rounded-xl border p-4">
                        <h4 className="text-sm font-medium">Returning customer</h4>
                        <CheckoutField
                          label="Account email"
                          type="email"
                          defaultValue="morgan.lee@example.com"
                        />
                        <CheckoutField
                          label="Password"
                          type="password"
                          autoComplete="current-password"
                        />
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-xs"
                          onClick={() =>
                            setNotice(
                              "Password reset instructions are ready for your account email in this local demo.",
                            )
                          }
                        >
                          Reset password
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            setNotice(
                              "Signed in locally as Morgan Lee. Your checkout details are saved.",
                            )
                          }
                        >
                          Sign in
                        </Button>
                      </div>
                      <div className="space-y-4 rounded-xl border p-4">
                        <CheckLine checked={account} onCheckedChange={setAccount}>
                          Create an account after checkout
                        </CheckLine>
                        <CheckoutField
                          label="New password"
                          type="password"
                          minLength={8}
                          required={account}
                        />
                        <CheckLine checked={newsletter} onCheckedChange={setNewsletter}>
                          Send me collection updates
                        </CheckLine>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setAccount(true);
                            setNotice("Account will be created when you finish your order.");
                          }}
                        >
                          Create account
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                {account && variant === 2 && (
                  <CheckoutField label="New password" type="password" minLength={8} required />
                )}
              </>
            )}
            {step === 2 && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Saved addresses</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditAddress(true)}
                  >
                    Manage addresses
                  </Button>
                </div>
                <RadioGroup value={address} onValueChange={setAddress} className="gap-3">
                  {["Home", "Studio"].map((a) => (
                    <label
                      key={a}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 has-[[data-state=checked]]:border-foreground"
                    >
                      <RadioGroupItem value={a} className="mt-1" />
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                          {a}
                          {a === "Home" && (
                            <Badge size="sm" variant="secondary">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p>
                          {contact.first} {contact.last}
                        </p>
                        <p className="text-muted-foreground">
                          {a === "Home"
                            ? `${street}, ${city}, CA ${zip}`
                            : "88 Bryant St, Suite 4B, San Francisco, CA 94105"}
                        </p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
                <h4 className="text-sm font-medium">Delivery speed</h4>
                <RadioGroup value={speed} onValueChange={setSpeed}>
                  {[
                    ["Standard", "Carbon-neutral · May 17–19", "Free"],
                    ["Express", "Priority delivery · May 14", "$12.00"],
                    ["Pickup", "Partner store · Tomorrow", "Free"],
                  ].map(([name, copy, price]) => (
                    <label
                      key={name}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 has-[[data-state=checked]]:border-foreground"
                    >
                      <RadioGroupItem value={name} />
                      <span className="flex-1 text-sm">
                        <strong className="font-medium">{name}</strong>
                        <span className="mt-1 block text-xs text-muted-foreground">{copy}</span>
                      </span>
                      <span className="text-sm">{price}</span>
                    </label>
                  ))}
                </RadioGroup>
              </>
            )}
            {step === 3 && <PaymentFields method={method} onMethod={setMethod} />}
            {step === 4 && (
              <>
                <div className="divide-y rounded-xl border">
                  {[
                    [1, "Customer", `${contact.first} ${contact.last} · ${contact.email}`, Check],
                    [
                      2,
                      "Delivery",
                      `${address} · ${speed} · ${address === "Home" ? street : "88 Bryant St"}`,
                      MapPin,
                    ],
                    [3, "Payment", method === "Card" ? "Visa ending in 4242" : method, CreditCard],
                  ].map(([n, label, detail, Icon]) => {
                    const I = Icon as typeof Check;
                    return (
                      <Button
                        key={String(label)}
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start rounded-none p-4"
                        onClick={() => setStep(Number(n))}
                      >
                        <I className="size-4 shrink-0" />
                        <span className="min-w-0 flex-1 text-left">
                          <strong className="block text-sm font-medium">{label as string}</strong>
                          <span className="mt-1 block truncate text-xs text-muted-foreground">
                            {detail as string}
                          </span>
                        </span>
                        <ArrowRight />
                      </Button>
                    );
                  })}
                </div>
                <CheckLine checked={confirm} onCheckedChange={setConfirm}>
                  I confirm these order details and agree to the order terms.
                </CheckLine>
              </>
            )}
            <div className="flex justify-between gap-3 border-t pt-5">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft />
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={!items.length || (step === 4 && !confirm)}>
                {step === 4 ? "Place order" : "Continue"}
                <ArrowRight />
              </Button>
            </div>
          </form>
        </div>
        <aside className={cn("min-w-0 lg:sticky lg:top-6", variant === 1 && "lg:border-l lg:pl-8")}>
          {variant === 5 ? (
            <Frame>
              <FrameHeader className="flex-row items-center justify-between">
                <FrameTitle>Order summary</FrameTitle>
                <Badge variant="secondary" size="sm">
                  {items.length} items
                </Badge>
              </FrameHeader>
              <FramePanel className="p-5">{summary}</FramePanel>
              <FrameFooter>{totalView}</FrameFooter>
            </Frame>
          ) : variant === 2 ? (
            <div className="overflow-hidden rounded-xl border">
              <div className="flex items-center justify-between border-b p-5">
                <h3 className="font-semibold">Order summary</h3>
                <Badge variant="secondary" size="sm">
                  {items.length} items
                </Badge>
              </div>
              <div className="p-5">{summary}</div>
              <div className="border-t bg-muted/40 p-5">{totalView}</div>
            </div>
          ) : (
            <>
              <h3 className="mb-6 font-semibold">Order summary</h3>
              {summary}
              <div className="mt-6 rounded-xl border border-dashed p-4">{totalView}</div>
            </>
          )}
        </aside>
      </div>
      {variant === 2 && <TrustStrip />}
      <Dialog open={editAddress} onOpenChange={setEditAddress}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit home address</DialogTitle>
            <DialogDescription>Update the address used for this local order.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setEditAddress(false);
            }}
          >
            <CheckoutField
              label="Street address"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
            <CheckoutField
              label="City"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <CheckoutField
              label="Postal code"
              required
              value={zip}
              onChange={(e) => setZip(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Save address
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
