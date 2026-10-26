import { useState } from "react";
import {
  Check,
  Plus,
  Minus,
  ArrowRight,
  Layers,
  Zap,
  Building2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AnalyticsPricing, AgencyPricing } from "./pricing-refined";
import { SeatStepperPricing } from "./pricing-seat-stepper";
import { PlanComparisonPricing } from "./pricing-plan-comparison";
import { PerSeatPricing } from "./pricing-per-seat";

const plans = [
  {
    name: "Free",
    price: 0,
    note: "A good place to begin.",
    icon: Layers,
    features: ["3 projects", "Basic components", "Community support", "1 workspace member"],
  },
  {
    name: "Starter",
    price: 19,
    note: "For your next good idea.",
    icon: Zap,
    features: [
      "Unlimited projects",
      "All components",
      "Email support",
      "5 workspace members",
      "Custom themes",
    ],
  },
  {
    name: "Team",
    price: 39,
    note: "Good work, together.",
    icon: Sparkles,
    features: [
      "Everything in Starter",
      "Advanced permissions",
      "Priority support",
      "Unlimited members",
      "Shared workspaces",
      "Audit history",
    ],
  },
  {
    name: "Enterprise",
    price: 79,
    note: "Room for every possibility.",
    icon: Building2,
    features: [
      "Everything in Team",
      "Single sign-on",
      "Dedicated success manager",
      "Custom contracts",
      "Unlimited storage",
      "Service agreement",
    ],
  },
];
function GeneralPricing({ block }: BlockProps) {
  const i = block.index,
    [billing, setBilling] = useState("yearly"),
    [seats, setSeats] = useState([5]),
    [selected, setSelected] = useState("Team"),
    [open, setOpen] = useState(i >= 6),
    [confirmed, setConfirmed] = useState(false),
    [details, setDetails] = useState(false);
  const four = [0, 1, 4].includes(i),
    visible = four ? plans : [plans[1], plans[2], plans[3]],
    dark = i === 5;
  const getPrice = (p: (typeof plans)[number]) =>
    Math.round(p.price * (billing === "yearly" ? 0.8 : 1)) *
    (i === 0 && p.name === "Team" ? seats[0] : i === 2 ? seats[0] : 1);
  const toggle = (
    <ToggleGroup
      type="single"
      value={billing}
      onValueChange={(v) => v && setBilling(v)}
      variant="outline"
      className="justify-center"
    >
      <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
      <ToggleGroupItem value="yearly">
        Yearly <Badge variant="secondary">Save 20%</Badge>
      </ToggleGroupItem>
    </ToggleGroup>
  );
  const cards = (
    <div className={cn("grid gap-4 sm:grid-cols-2", four ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
      {visible.map((p) => (
        <div
          key={p.name}
          className={cn(
            "relative flex flex-col rounded-xl border bg-card p-5",
            p.name === "Team" && "border-foreground shadow-sm",
          )}
        >
          <div className="mb-4 flex justify-between">
            <p.icon className="size-5 text-muted-foreground" />
            {p.name === "Team" && <Badge variant="secondary">Most popular</Badge>}
          </div>
          <h3 className="font-semibold">{p.name}</h3>
          <p className="mt-2 min-h-5 text-xs text-muted-foreground">{p.note}</p>
          <div className="my-6 flex items-baseline gap-1">
            <span className="text-3xl font-semibold tracking-tight">${getPrice(p)}</span>
            <span className="text-xs text-muted-foreground">
              /{i === 0 && p.name === "Team" ? "team" : "mo"}
            </span>
          </div>
          {i === 2 && (
            <p className="-mt-4 mb-5 text-xs text-muted-foreground">
              ${Math.round(p.price * (billing === "yearly" ? 0.8 : 1))} per seat × {seats[0]} seats
            </p>
          )}
          <Button
            disabled={i === 2 && p.name === "Starter"}
            variant={p.name === "Team" ? "default" : "outline"}
            onClick={() => {
              setSelected(p.name);
              setConfirmed(false);
              setOpen(true);
            }}
          >
            {i === 2 && p.name === "Starter"
              ? "Your current plan"
              : p.price === 0
                ? "Start for free"
                : p.name === "Enterprise"
                  ? "Talk to us"
                  : "Choose " + p.name}
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Separator className="my-5" />
          <p className="mb-4 text-xs font-medium">
            {p.name === "Free"
              ? "Includes:"
              : `Everything you need to ${p.name === "Starter" ? "get going" : "go further"}:`}
          </p>
          <ul className="flex flex-col gap-3">
            {p.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
              >
                <Check className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
  const featureRows = [
    "Projects",
    "Storage",
    "Team members",
    "API requests",
    "Automations",
    "Version history",
    "Custom themes",
    "Priority support",
    "Shared workspaces",
    "Advanced permissions",
    "Single sign-on",
    "Audit logs",
    "Dedicated success manager",
  ];
  const featureValue = (p: (typeof plans)[number], row: number) => {
    const tier = plans.indexOf(p);
    if (row === 0) return tier === 0 ? "3" : "Unlimited";
    if (row === 1) return ["1 GB", "25 GB", "100 GB", "Unlimited"][tier];
    if (row === 2) return tier === 0 ? "1" : tier === 1 ? "5" : "Unlimited";
    if (row === 3) return ["1,000 / mo", "25,000 / mo", "100,000 / mo", "Custom"][tier];
    if (row === 4) return ["50 / mo", "500 / mo", "5,000 / mo", "Unlimited"][tier];
    if (row === 5) return ["7 days", "30 days", "1 year", "Unlimited"][tier];
    return row === 6 ? tier > 0 : row < 10 ? tier > 1 : tier > 2;
  };
  const comparison = (
    <div className="mt-8 max-h-[620px] overflow-auto rounded-xl border">
      <table className="w-full min-w-[580px] text-left text-xs">
        <thead className="sticky top-0 bg-background">
          <tr className="bg-muted/30">
            <th className="p-4 font-medium">A closer look</th>
            {visible.map((p) => (
              <th className="p-4 font-medium" key={p.name}>
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {featureRows.map((f, j) => (
            <tr className="border-t" key={f}>
              <td className="p-4 text-muted-foreground">{f}</td>
              {visible.map((p) => {
                const value = featureValue(p, j);
                return (
                  <td className="p-4" key={p.name}>
                    {typeof value === "string" ? (
                      <div>
                        {value}
                        {i === 1 && [1, 3, 4].includes(j) && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {j === 1
                              ? "then $0.10 / GB"
                              : j === 3
                                ? "then $0.002 / request"
                                : "then $0.05 / run"}
                          </p>
                        )}
                      </div>
                    ) : value ? (
                      <Check className="size-3.5" aria-label="Included" />
                    ) : (
                      <span className="text-muted-foreground" aria-label="Not included">
                        —
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  const selectedPlan = plans.find((p) => p.name === selected)!;
  const upgrade = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={cn("sm:max-w-3xl", i === 7 && "max-h-[85vh] overflow-auto")}>
        <DialogHeader>
          <DialogTitle>
            {confirmed
              ? "A good choice. You’re all set."
              : i === 7
                ? "A little more room to do good work."
                : "Find the right plan for your next chapter."}
          </DialogTitle>
        </DialogHeader>
        {confirmed ? (
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            <CheckCircle2 className="size-12 text-emerald-600" />
            <h3 className="text-xl font-medium">{selected} selected</h3>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Your demo workspace is now on the {selected} plan. No payment was processed.
            </p>
            <Button onClick={() => setOpen(false)}>Back to your workspace</Button>
          </div>
        ) : (
          <>
            {toggle}
            <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
              <ToggleGroup
                type="single"
                value={selected}
                onValueChange={(v) => v && setSelected(v)}
                className="flex-col items-stretch justify-start"
              >
                {plans.slice(1).map((p) => (
                  <ToggleGroupItem
                    value={p.name}
                    key={p.name}
                    className="h-auto justify-between rounded-lg border p-4 text-left"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-muted-foreground">${getPrice(p)}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <div className="rounded-xl border p-5">
                <selectedPlan.icon className="size-6" />
                <h3 className="mt-4 text-lg font-semibold">{selectedPlan.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{selectedPlan.note}</p>
                <ul className="mt-5 flex flex-col gap-3">
                  {selectedPlan.features.map((f) => (
                    <li className="flex items-center gap-2 text-sm" key={f}>
                      <Check className="size-4" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {i === 7 && comparison}
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">${getPrice(selectedPlan)} / month</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {billing === "yearly"
                    ? "Billed yearly. Save 20%."
                    : "Billed monthly. Change any time."}
                </p>
              </div>
              <Button onClick={() => setConfirmed(true)}>
                Choose {selected}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
  if (i >= 6)
    return (
      <div className="flex min-h-[500px] items-center justify-center p-7">
        <div className="flex w-full max-w-md flex-col gap-5 rounded-xl border p-7">
          <Badge variant="secondary" className="self-start">
            Your workspace
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight">
            {i === 7
              ? "You’re doing good work. Give it room to grow."
              : "The right plan for what comes next."}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            More projects, more possibilities, and a little more room for your team.
          </p>
          {i === 7 && (
            <>
              <div className="flex justify-between text-xs">
                <span>Monthly usage</span>
                <span>980 / 1,000</span>
              </div>
              <Progress value={98} />
            </>
          )}
          <Button
            onClick={() => {
              setOpen(true);
              setConfirmed(false);
            }}
          >
            Explore plans
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
        {upgrade}
      </div>
    );
  return (
    <section className={cn("w-full p-6 sm:p-10", dark && "dark bg-background text-foreground")}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-center gap-5 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Good work. A plan that fits.</h2>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Start where you are. Grow at your own pace. Thoughtful tools for every stage of your
            product.
          </p>
          {i !== 1 && toggle}
          {i === 0 && (
            <div className="flex w-full max-w-xs flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center justify-between text-xs">
                <span>Team size</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Remove one seat"
                    disabled={seats[0] === 1}
                    onClick={() => setSeats([Math.max(1, seats[0] - 1)])}
                  >
                    <Minus />
                  </Button>
                  <span className="min-w-12 text-center" aria-live="polite">
                    {seats[0]} seats
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Add one seat"
                    disabled={seats[0] === 25}
                    onClick={() => setSeats([Math.min(25, seats[0] + 1)])}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
              <Slider
                min={1}
                max={25}
                value={seats}
                onValueChange={setSeats}
                aria-label="Number of seats"
              />
            </div>
          )}
          {i === 2 && (
            <>
              <blockquote className="max-w-lg text-sm leading-6 text-muted-foreground">
                “The right tools gave our team room to focus on the work that actually matters.”
                <p className="mt-2 text-xs">Alex Morgan · Design lead, Acme</p>
              </blockquote>
              <ToggleGroup
                type="single"
                variant="outline"
                value={String(seats[0])}
                onValueChange={(v) => v && setSeats([Number(v)])}
                aria-label="Team size"
                className="max-w-full flex-wrap justify-center"
              >
                {[1, 5, 10, 25, 50].map((n) => (
                  <ToggleGroupItem value={String(n)} key={n}>
                    {n} {n === 1 ? "seat" : "seats"}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </>
          )}
        </div>
        {i === 1 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((p) => (
                <div className="rounded-xl border p-5" key={p.name}>
                  <h3 className="font-medium">{p.name}</h3>
                  <p className="my-4 text-3xl font-semibold">
                    ${p.price}
                    <span className="text-xs font-normal text-muted-foreground"> /mo</span>
                  </p>
                  <Button
                    variant={p.name === "Team" ? "default" : "outline"}
                    onClick={() => {
                      setSelected(p.name);
                      setOpen(true);
                    }}
                  >
                    Choose {p.name}
                  </Button>
                </div>
              ))}
            </div>
            {comparison}
          </>
        ) : (
          cards
        )}
        {i === 2 && comparison}
        {[3, 5].includes(i) && (
          <div className="mt-10 flex flex-wrap justify-center gap-8 text-base font-semibold text-muted-foreground">
            {["Acme", "Layers", "Quotient", "Sisyphus", "Circooles"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        )}
        {i === 4 && (
          <div className="mt-6 flex justify-center gap-5">
            <Button variant="link" onClick={() => setDetails(!details)}>
              Compare plans
            </Button>
            <Button variant="link" onClick={() => setDetails(!details)}>
              Questions? Start here.
            </Button>
          </div>
        )}
        {details && comparison}
        <p className="mt-7 text-center text-xs text-muted-foreground">
          All prices in USD. Demo plans — no billing or payment is connected.
        </p>
        {upgrade}
      </div>
    </section>
  );
}

export function Pricing(props: BlockProps) {
  if (props.block.index === 0) return <SeatStepperPricing />;
  if (props.block.index === 1) return <PlanComparisonPricing />;
  if (props.block.index === 2) return <PerSeatPricing />;
  if (props.block.index === 4) return <AnalyticsPricing />;
  if (props.block.index === 5) return <AgencyPricing />;
  return <GeneralPricing {...props} />;
}
