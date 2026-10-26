import { useId, useRef, useState, type MouseEvent, type UIEvent } from "react";
import { Building2, Check, CreditCard, User, Users, X } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "../reference.css";
import "./pricing-upgrade-dialog.css";

// Independent pricing instance composed from the public free ReUI examples:
// c-dialog-3, c-radio-group-17, c-icon-tile-10, c-empty-1, c-tabs-1,
// c-scroll-area-1 and c-separator-1. Existing stock dependencies stay explicit;
// Badge and IconTile are the actual installed free ReUI implementations.
type PlanId = "basic" | "team" | "enterprise";
type Billing = "monthly" | "yearly";
type Plan = {
  id: PlanId;
  name: string;
  description: string;
  icon: typeof User;
  monthly: number;
  yearly: number;
  includes: string;
  features: string[];
  excluded: string[];
};
const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "For solo support",
    icon: User,
    monthly: 18,
    yearly: 15,
    includes: "Includes",
    features: [
      "2 agent seats",
      "1 shared inbox",
      "90 days of ticket history",
      "1 GB of attachment storage",
      "25 help center articles",
      "Saved replies",
      "Ticket tags and filters",
      "Customer contact profiles",
      "Website chat widget",
      "Mobile apps for agents",
      "Email support",
    ],
    excluded: ["Routing and assignment rules", "Team performance reports"],
  },
  {
    id: "team",
    name: "Team",
    description: "For growing teams",
    icon: Users,
    monthly: 54,
    yearly: 45,
    includes: "Everything in Basic, plus",
    features: [
      "10 agent seats",
      "5 shared inboxes",
      "Unlimited ticket history",
      "25 GB of attachment storage",
      "Routing and assignment rules",
      "Response time targets",
      "Agent collision alerts",
      "Private notes and mentions",
      "Customer satisfaction surveys",
      "Team performance reports",
      "Business hours and holidays",
      "Priority chat support",
    ],
    excluded: ["SAML single sign-on", "Dedicated success manager"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large companies",
    icon: Building2,
    monthly: 168,
    yearly: 140,
    includes: "Everything in Team, plus",
    features: [
      "50 agent seats",
      "Unlimited shared inboxes",
      "250 GB of attachment storage",
      "99.9% uptime commitment",
      "Custom roles and permissions",
      "SAML single sign-on",
      "Audit log export",
      "Custom data retention",
      "Regional data hosting",
      "Sandbox workspace",
      "Dedicated success manager",
    ],
    excluded: [],
  },
];
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
function keepPreviewRoute(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "instant" });
}
// Radix supplies the actual viewport scrolling. Its installed twin does not
// expose the Base preview's overflow-edge CSS variables, so adapt only the fade.
function updateScrollFade(event: UIEvent<HTMLDivElement>) {
  const viewport = event.target as HTMLElement;
  if (viewport.parentElement !== event.currentTarget) return;
  event.currentTarget.dataset.scrollStart = String(viewport.scrollTop > 1);
  event.currentTarget.dataset.scrollEnd = String(
    viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 1,
  );
}
function PlanRail({
  selected,
  billing,
  onSelect,
}: {
  selected: PlanId;
  billing: Billing;
  onSelect: (value: PlanId) => void;
}) {
  const id = useId();
  return (
    <RadioGroup
      value={selected}
      onValueChange={(value) => onSelect(value as PlanId)}
      aria-label="Plans"
      orientation="vertical"
      className="pud-plan-rail"
    >
      {plans.map((plan) => (
        <Item
          asChild
          variant="outline"
          size="sm"
          className="pud-plan-item"
          data-selected={selected === plan.id}
          key={plan.id}
        >
          <Label htmlFor={`${id}-${plan.id}`}>
            <RadioGroupItem
              id={`${id}-${plan.id}`}
              value={plan.id}
              aria-label={plan.name}
              className="pud-plan-radio"
            />
            <ItemMedia>
              <IconTile variant="elevated" aria-hidden="true">
                <plan.icon />
              </IconTile>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{plan.name}</ItemTitle>
              <ItemDescription>{plan.description}</ItemDescription>
            </ItemContent>
            <ItemActions className="pud-rail-price">
              {currency.format(plan[billing])}
              <span className="sr-only"> per month</span>
            </ItemActions>
          </Label>
        </Item>
      ))}
    </RadioGroup>
  );
}
function PlanDetails({ plan, billing }: { plan: Plan; billing: Billing }) {
  return (
    <>
      <div className="pud-plan-heading">
        <h3>
          {plan.name}
          {plan.id === "team" && <span className="sr-only">, Most Popular</span>}
        </h3>
        {plan.id === "team" && (
          <Badge variant="outline" aria-hidden="true">
            Most Popular
          </Badge>
        )}
      </div>
      <div className="pud-price-block">
        <p className="pud-main-price">
          <span data-upgrade-price>{currency.format(plan[billing])}</span>
          <span>per month</span>
        </p>
        <p className="pud-savings">
          Yearly billing saves {currency.format((plan.monthly - plan.yearly) * 12)} a year
        </p>
      </div>
      <Separator />
      <p className="pud-includes">{plan.includes}</p>
      <ul className="pud-feature-list">
        {plan.features.map((feature) => (
          <li key={feature}>
            <Check aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
        {plan.excluded.map((feature) => (
          <li key={feature}>
            <X aria-hidden="true" />
            <span>
              <span className="sr-only">Not included: </span>
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
function DetailStack({ selected, billing }: { selected: PlanId; billing: Billing }) {
  return (
    <ScrollArea className="pud-details-scroll">
      <div className="pud-detail-stack">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="pud-plan-panel"
            data-plan={plan.id}
            data-active={selected === plan.id}
            aria-hidden={selected !== plan.id}
            inert={selected !== plan.id}
          >
            <PlanDetails plan={plan} billing={billing} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
export function UpgradePlanPricing() {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState<PlanId>("team");
  const [billing, setBilling] = useState<Billing>("yearly");
  const contentRef = useRef<HTMLDivElement>(null);
  const plan = plans.find((entry) => entry.id === selected)!;
  const action = selected === "enterprise" ? "Contact Sales" : "Start Trial";
  const billed = billing === "yearly" ? plan.yearly * 12 : plan.monthly;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <section
        className="reui-reference pud-entry"
        data-pricing-variant="7"
        aria-label="Plan picker dialog"
      >
        <h2 className="sr-only">Plan picker dialog</h2>
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <IconTile variant="elevated" aria-hidden="true">
                <CreditCard />
              </IconTile>
            </EmptyMedia>
            <EmptyTitle>Upgrade Your Plan</EmptyTitle>
            <EmptyDescription>Compare plans and switch in a minute.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <DialogTrigger asChild>
              <Button variant="outline">View Plans</Button>
            </DialogTrigger>
          </EmptyContent>
        </Empty>
      </section>
      <DialogContent
        ref={contentRef}
        className="reui-reference pud-dialog"
        data-pricing-upgrade-dialog="7"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          contentRef.current?.focus({ preventScroll: true });
        }}
      >
        <DialogHeader>
          <DialogTitle>Choose Your Plan</DialogTitle>
          <DialogDescription>Basic and Team start with 14 days free.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="pud-outer-scroll" type="auto" onScrollCapture={updateScrollFade}>
          <Tabs
            value={billing}
            onValueChange={(value) => setBilling(value as Billing)}
            className="pud-body-grid"
          >
            <div className="pud-plans-label">
              <p>Plans</p>
            </div>
            <ScrollArea className="pud-rail-scroll">
              <PlanRail selected={selected} billing={billing} onSelect={setSelected} />
            </ScrollArea>
            <div className="pud-billing">
              <TabsList aria-label="Billing period">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">
                  Yearly<Badge variant="success-light">2 Months Free</Badge>
                </TabsTrigger>
              </TabsList>
            </div>
            {(["monthly", "yearly"] as const).map((period) => (
              <TabsContent key={period} value={period} className="pud-details-cell">
                <DetailStack selected={selected} billing={period} />
              </TabsContent>
            ))}
          </Tabs>
        </ScrollArea>
        <DialogFooter>
          <p className="pud-summary">
            <span>{plan.name}</span>
            <span className="pud-summary-dot" aria-hidden="true" />
            <span>
              {currency.format(billed)} billed {billing}
            </span>
          </p>
          <Button asChild>
            <a href="#" onClick={keepPreviewRoute} aria-label={`${action} for ${plan.name}`}>
              {action}
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
