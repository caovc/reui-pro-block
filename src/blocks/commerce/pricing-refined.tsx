import { Fragment, useId, useState, type MouseEvent } from "react";
import {
  ArrowDown,
  Check,
  CircleCheck,
  CircleHelp,
  CircleMinus,
  ListChecks,
  X,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingBrandmarks } from "./pricing-brandmarks";
import "../reference.css";
import "./pricing-refined.css";

type Period = "monthly" | "yearly";
type Feature = { label: string; included: boolean };
type AnalyticsPlan = { name: string; monthly: number; note: string; features: Feature[] };
const feature = (label: string, included = true): Feature => ({ label, included });
const analyticsPlans: AnalyticsPlan[] = [
  {
    name: "Free",
    monthly: 0,
    note: "For side projects and demos",
    features: [
      feature("1 million events a month"),
      feature("5 saved dashboards"),
      feature("30 days of event history"),
      feature("2 team seats"),
      feature("Email support", false),
      feature("Session replays", false),
      feature("Warehouse sync", false),
      feature("SAML single sign-on", false),
    ],
  },
  {
    name: "Team",
    monthly: 12,
    note: "For startups shipping fast",
    features: [
      feature("10 million events a month"),
      feature("Unlimited dashboards"),
      feature("1 year of event history"),
      feature("Up to 10 team seats"),
      feature("Email support"),
      feature("Session replays", false),
      feature("Warehouse sync", false),
      feature("SAML single sign-on", false),
    ],
  },
  {
    name: "Growth",
    monthly: 24,
    note: "For teams that experiment",
    features: [
      feature("50 million events a month"),
      feature("Unlimited dashboards"),
      feature("3 years of event history"),
      feature("Unlimited team seats"),
      feature("Live chat support"),
      feature("Session replays"),
      feature("Warehouse sync"),
      feature("SAML single sign-on", false),
    ],
  },
  {
    name: "Enterprise",
    monthly: 36,
    note: "For regulated companies",
    features: [
      feature("Custom event volume"),
      feature("Unlimited dashboards"),
      feature("Unlimited event history"),
      feature("Unlimited team seats"),
      feature("Named account manager"),
      feature("Session replays"),
      feature("Warehouse sync"),
      feature("SAML single sign-on"),
    ],
  },
];

// The public reference links all point to '#'. Preserve the preview hash route
// while reproducing the placeholder's visible behavior (scroll to the top).
function placeholderLink(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  event.currentTarget.ownerDocument.defaultView?.scrollTo({ top: 0, behavior: "instant" });
}

function BillingTabs({
  period,
  onChange,
  agency = false,
}: {
  period: Period;
  onChange: (value: Period) => void;
  agency?: boolean;
}) {
  return (
    <Tabs value={period} onValueChange={(value) => onChange(value as Period)} className="rp-tabs">
      <TabsList aria-label="Billing period" className="rp-tabs-list">
        <TabsTrigger value="monthly" className="rp-tab">
          Monthly
        </TabsTrigger>
        <TabsTrigger value="yearly" className="rp-tab">
          Yearly{" "}
          <Badge variant="success-light" className="rp-saving">
            {agency ? "2 Months Free" : "Save 25%"}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function FeatureList({ features, agency = false }: { features: Feature[]; agency?: boolean }) {
  return (
    <ul className="rp-features" aria-label="Plan features">
      {features.map((item) => {
        const lead = item.included
          ? item.label.match(
              /^(Up to \d+|\d+(?: (?:million|days|years?|GB|TB))?|Unlimited|Custom)/,
            )?.[0]
          : undefined;
        return (
          <li key={item.label}>
            <span className="rp-feature-icon">
              {agency ? (
                item.included ? (
                  <Check aria-hidden="true" />
                ) : (
                  <X aria-hidden="true" />
                )
              ) : item.included ? (
                <CircleCheck aria-hidden="true" className="rp-included" />
              ) : (
                <CircleMinus aria-hidden="true" className="rp-unavailable" />
              )}
            </span>
            <span>
              {!item.included && <span className="sr-only">Not included: </span>}
              {lead ? (
                <>
                  <strong>{lead}</strong>
                  {item.label.slice(lead.length)}
                </>
              ) : (
                item.label
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const analyticsPrice = (plan: AnalyticsPlan, period: Period) =>
  plan.name === "Enterprise" ? plan.monthly : plan.monthly * (period === "yearly" ? 0.75 : 1);

function HelpTexture() {
  const patternId = useId();
  return (
    <svg className="rp-help-pattern" aria-hidden="true">
      <defs>
        <pattern id={patternId} width="48" height="48" patternUnits="userSpaceOnUse">
          {Array.from({ length: 144 }, (_, index) => (
            <rect
              key={index}
              x={(index % 12) * 4}
              y={Math.floor(index / 12) * 4}
              width="2"
              height="2"
              fill="currentColor"
              opacity={0.12 + ((Math.imul(index + 1, 1103515245) >>> 8) % 420) / 1000}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

function AgencyTexture() {
  const id = useId();
  return (
    <svg className="rp-card-dots" aria-hidden="true">
      <defs>
        <pattern id={`${id}-dots`} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.55" fill="currentColor" />
        </pattern>
        <radialGradient id={`${id}-fade`} cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="white" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="white" stopOpacity="0.3" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-dots)`} mask={`url(#${id}-mask)`} />
    </svg>
  );
}

export function AnalyticsPricing() {
  const [period, setPeriod] = useState<Period>("yearly");
  return (
    <section
      aria-labelledby="analytics-pricing-title"
      className="reui-reference refined-pricing rp-analytics"
    >
      <div className="rp-container">
        <header className="rp-header">
          <div className="rp-introduction">
            <h2 id="analytics-pricing-title">Pricing on Your Terms</h2>
            <p>
              <span>Start free with a million events a month and core analytics,</span>{" "}
              <span>then pay per seat as your team grows.</span>
            </p>
          </div>
          <BillingTabs period={period} onChange={setPeriod} />
        </header>
        <div className="rp-plan-and-help">
          <ul className="rp-plans">
            {analyticsPlans.map((plan) => (
              <li key={plan.name}>
                <Card className="rp-card">
                  <h3>{plan.name}</h3>
                  {plan.name === "Growth" && (
                    <Badge variant="success" className="rp-popular">
                      Most Popular
                    </Badge>
                  )}
                  <div className="rp-analytics-price-group">
                    <p className="rp-price" aria-label={`${plan.name} price`}>
                      <span>${analyticsPrice(plan, period)}</span>{" "}
                      <span className="rp-price-unit">USD</span>
                    </p>
                    <div className="rp-plan-note">
                      <p>{plan.note}</p>
                      <p>
                        {plan.name === "Free"
                          ? "No credit card required"
                          : `Per seat a month, billed ${plan.name === "Enterprise" ? "yearly" : period}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant={plan.name === "Growth" ? "default" : "outline"}
                    className="rp-plan-action"
                  >
                    <a
                      role="button"
                      href="#"
                      onClick={placeholderLink}
                      aria-label={
                        plan.name === "Enterprise"
                          ? "Contact us about Enterprise"
                          : plan.name === "Free"
                            ? "Start Free"
                            : `Choose ${plan.name}`
                      }
                    >
                      {plan.name === "Enterprise"
                        ? "Contact Us"
                        : plan.name === "Free"
                          ? "Start Free"
                          : `Choose ${plan.name}`}
                    </a>
                  </Button>
                  <FeatureList features={plan.features} />
                </Card>
              </li>
            ))}
          </ul>
          {/* Official ReUI c-icon-tile-10 composition: IconTile with its stock Item dependency. */}
          <Card className="rp-help">
            <HelpTexture />
            <ul>
              {[
                {
                  title: "Compare Features",
                  note: "Every plan limit, side by side",
                  icon: ListChecks,
                },
                { title: "Pricing FAQ", note: "Seats, invoices and refunds", icon: CircleHelp },
              ].map((item, index) => (
                <Fragment key={item.title}>
                  {index > 0 && (
                    <li className="rp-help-divider" aria-hidden="true">
                      <Separator orientation="vertical" />
                    </li>
                  )}
                  <li>
                    <Item asChild className="rp-help-link">
                      <a href="#" onClick={placeholderLink}>
                        <ItemMedia className="rp-help-media">
                          <IconTile variant="elevated" aria-hidden="true">
                            <item.icon />
                          </IconTile>
                        </ItemMedia>
                        <ItemContent className="min-w-0 gap-0.5">
                          <ItemTitle>{item.title}</ItemTitle>
                          <ItemDescription>{item.note}</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <ArrowDown className="rp-help-arrow" aria-hidden="true" />
                        </ItemActions>
                      </a>
                    </Item>
                  </li>
                </Fragment>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

type AgencyPlan = {
  name: string;
  monthly: number;
  extra: number;
  seats: number;
  prefix: string;
  features: Feature[];
  tone: string;
};
const agencyPlans: AgencyPlan[] = [
  {
    name: "Basic",
    monthly: 36,
    extra: 6,
    seats: 1,
    prefix: "Includes",
    tone: "from-white/[0.065]",
    features: [
      feature("1 seat included"),
      feature("5 active projects"),
      feature("25 GB of file storage"),
      feature("1 client portal"),
      feature("Time tracking and timesheets"),
      feature("Online invoices and payments"),
      feature("Email support"),
      feature("Timesheet approvals", false),
      feature("Budgets and profit reports", false),
    ],
  },
  {
    name: "Team",
    monthly: 84,
    extra: 12,
    seats: 5,
    prefix: "Everything in Basic, plus",
    tone: "from-teal-300/[0.09]",
    features: [
      feature("5 seats included"),
      feature("Unlimited active projects"),
      feature("250 GB of file storage"),
      feature("10 client portals"),
      feature("Timesheet approvals"),
      feature("Budgets and profit reports"),
      feature("Priority chat support"),
      feature("Custom roles and permissions", false),
      feature("SAML single sign-on", false),
    ],
  },
  {
    name: "Enterprise",
    monthly: 240,
    extra: 18,
    seats: 20,
    prefix: "Everything in Team, plus",
    tone: "from-violet-300/[0.09]",
    features: [
      feature("20 seats included"),
      feature("2 TB of file storage"),
      feature("Unlimited client portals"),
      feature("Custom roles and permissions"),
      feature("SAML single sign-on"),
      feature("Dedicated success manager"),
    ],
  },
];

const agencyRate = (rate: number, period: Period) =>
  period === "yearly" ? (rate * 10) / 12 : rate;

export function AgencyPricing() {
  const [period, setPeriod] = useState<Period>("yearly");
  return (
    <section
      aria-labelledby="agency-pricing-title"
      className="reui-reference refined-pricing rp-agency dark"
    >
      <div className="rp-agency-glow" aria-hidden="true" />
      <div className="rp-container">
        <header className="rp-header">
          <div className="rp-introduction">
            <h2 id="agency-pricing-title">Priced for Your Studio</h2>
            <p>
              <span>One workspace rate, plus seats as you hire.</span>{" "}
              <span>Basic and Team start with 14 days free.</span>
            </p>
          </div>
          <BillingTabs period={period} onChange={setPeriod} agency />
        </header>
        <ul className="rp-plans">
          {agencyPlans.map((plan) => (
            <li key={plan.name}>
              <Card className={`rp-card rp-studio-${plan.name.toLowerCase()}`}>
                <div className="rp-card-wash" aria-hidden="true" />
                <AgencyTexture />
                <div className="rp-card-heading">
                  <h3>{plan.name}</h3>
                  {plan.name === "Team" && (
                    <Badge variant="outline" className="rp-studio-popular">
                      Most Popular
                    </Badge>
                  )}
                </div>
                <div className="rp-workspace-price-group">
                  <div className="rp-workspace-rates">
                    <p className="rp-price" aria-label={`${plan.name} price`}>
                      <span>${agencyRate(plan.monthly, period)}</span>{" "}
                      <span className="rp-price-unit">per month</span>
                    </p>
                    <div className="rp-workspace-billing">
                      <p>
                        {period === "yearly"
                          ? `$${(plan.monthly * 10).toLocaleString("en-US")} billed yearly`
                          : "Billed monthly"}
                      </p>
                      <p>
                        <strong>+ ${agencyRate(plan.extra, period)}</strong> per extra seat / month
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant={plan.name === "Team" ? "default" : "outline"}
                    className="rp-plan-action"
                  >
                    <a
                      role="button"
                      href="#"
                      onClick={placeholderLink}
                      aria-label={
                        plan.name === "Enterprise"
                          ? "Contact Sales for Enterprise"
                          : `Start Trial for ${plan.name}`
                      }
                    >
                      {plan.name === "Enterprise" ? "Contact Sales" : "Start Trial"}
                    </a>
                  </Button>
                </div>
                <Separator className="rp-card-separator" />
                <div className="rp-feature-group">
                  <p>{plan.prefix}</p>
                  <FeatureList features={plan.features} agency />
                </div>
              </Card>
            </li>
          ))}
        </ul>
        <div className="rp-trust">
          <div className="rp-trust-caption">
            <Separator />
            <p>Used by teams at</p>
            <Separator />
          </div>
          <PricingBrandmarks />
        </div>
      </div>
    </section>
  );
}
