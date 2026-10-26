import { useState, type MouseEvent } from "react";
import {
  Workflow,
  Calendar,
  Code,
  GitBranch,
  Headphones,
  History,
  KeyRound,
  Layers,
  LayoutGrid,
  Lock,
  MessageSquare,
  Package,
  Palette,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  SquareTerminal,
  UserRoundCog,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldScrubArea,
} from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import "../reference.css";
import "./pricing-seat-stepper.css";

type BillingPeriod = "monthly" | "yearly";
type PlanName = "Free" | "Pro" | "Team" | "Unlimited";
type PlanFeature = { label: string; hint: string; icon: LucideIcon; seats?: boolean };
type Plan = {
  name: PlanName;
  description: string;
  startingAt?: boolean;
  monthlyRate: number;
  includes?: string;
  action: string;
  features: PlanFeature[];
};

const plans: Plan[] = [
  {
    name: "Free",
    description: "For side projects, learning and open source work.",
    monthlyRate: 0,
    action: "Start Free",
    features: [
      {
        label: "170 open primitives",
        hint: "Buttons, forms, overlays and data display.",
        icon: Layers,
      },
      {
        label: "shadcn CLI install",
        hint: "Add any component with one shadcn command.",
        icon: SquareTerminal,
      },
      {
        label: "Base UI and Radix",
        hint: "Every component ships for both primitive sets.",
        icon: GitBranch,
      },
      {
        label: "8 theme styles",
        hint: "Every primitive ships in all eight styles.",
        icon: Palette,
      },
      {
        label: "Community forum",
        hint: "Ask questions and share builds with other teams.",
        icon: MessageSquare,
      },
    ],
  },
  {
    name: "Pro",
    description: "For one developer building production apps.",
    monthlyRate: 35,
    includes: "Free, plus",
    action: "Get Pro",
    features: [
      {
        label: "485+ Pro blocks",
        hint: "Dashboards, marketing pages and app shells, with notes.",
        icon: LayoutGrid,
      },
      {
        label: "ReUI MCP server",
        hint: "Lets your coding agent search and install blocks.",
        icon: Zap,
      },
      {
        label: "Agent Skills",
        hint: "Teach your agent ReUI's patterns and conventions.",
        icon: Workflow,
      },
      {
        label: "Future block updates",
        hint: "New blocks arrive as source you review first.",
        icon: RefreshCw,
      },
      {
        label: "Private registry token",
        hint: "Install Pro blocks from the CLI with one token.",
        icon: KeyRound,
      },
    ],
  },
  {
    name: "Team",
    description: "For product teams sharing one block library.",
    monthlyRate: 25,
    includes: "Pro, plus",
    action: "Get Team",
    features: [
      {
        label: "team seats",
        hint: "Add or remove seats as the team changes.",
        icon: Users,
        seats: true,
      },
      {
        label: "Seat management",
        hint: "Invite, remove and reassign seats in one place.",
        icon: UserRoundCog,
      },
      {
        label: "Shared private registry",
        hint: "One token for the whole team's CLI installs.",
        icon: Package,
      },
      {
        label: "Priority support",
        hint: "An engineer replies within one business day.",
        icon: Headphones,
      },
    ],
  },
  {
    name: "Unlimited",
    description: "For companies rolling out ReUI across every team.",
    monthlyRate: 750,
    startingAt: true,
    includes: "Team, plus",
    action: "Contact Us",
    features: [
      {
        label: "Single sign-on",
        hint: "SAML sign-in through your identity provider.",
        icon: Lock,
      },
      {
        label: "Security review",
        hint: "We complete your vendor security questionnaire.",
        icon: ShieldCheck,
      },
      { label: "Audit log", hint: "Every seat change and install, recorded.", icon: History },
      {
        label: "Invoice billing",
        hint: "Pay yearly by invoice instead of card.",
        icon: ReceiptText,
      },
      {
        label: "Custom block requests",
        hint: "We build the blocks your product needs next.",
        icon: Code,
      },
      {
        label: "Onboarding workshop",
        hint: "A live session to set up your team's workflow.",
        icon: Calendar,
      },
    ],
  },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function placeholderLink(event: MouseEvent<HTMLAnchorElement>) {
  // Public plan links are '#'. Keep the gallery's hash route while returning to the top.
  event.preventDefault();
  event.currentTarget.ownerDocument.defaultView?.scrollTo({ top: 0, behavior: "instant" });
}

function PlanColumn({ plan, period }: { plan: Plan; period: BillingPeriod }) {
  const [seats, setSeats] = useState(5);
  const featured = plan.name === "Pro";
  const rate = plan.monthlyRate * (period === "yearly" && !plan.startingAt ? 0.8 : 1);
  const total = rate * (plan.name === "Team" ? seats : 1);

  return (
    <li className={`ssp-plan${featured ? " ssp-featured" : ""}`} aria-label={`${plan.name} plan`}>
      {featured && (
        <Badge variant="success" className="ssp-popular" aria-hidden="true">
          Most Popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle>
          <h3 className="ssp-name">
            {plan.name}
            {featured && <span className="sr-only">, Most Popular</span>}
          </h3>
        </CardTitle>
        <CardDescription className="ssp-description">{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="ssp-rate">
        <p className="ssp-price" aria-label={`${plan.name} price`}>
          {plan.startingAt && <span className="ssp-from">From</span>}
          <span className="ssp-amount">
            {plan.name === "Free" ? "Free" : currency.format(total)}
          </span>
        </p>
        <p className="ssp-billing">
          {plan.name === "Free"
            ? "Open source, MIT licensed"
            : plan.startingAt
              ? "a month, yearly contract"
              : `a month, billed ${period}`}
        </p>
      </CardContent>
      <CardContent className="ssp-inclusions">
        {plan.includes && <p className="ssp-includes">{plan.includes}</p>}
        <ul className="ssp-features">
          {plan.features.map((feature) => (
            <li key={feature.label}>
              <span className="ssp-feature-icon">
                <feature.icon aria-hidden="true" />
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="ssp-feature-label">
                    {feature.seats ? `${seats} ${feature.label}` : feature.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={-6}
                  collisionPadding={5}
                  className="reui-reference ssp-tooltip"
                >
                  {feature.hint}
                </TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardContent className="ssp-actions">
        {plan.name === "Team" && (
          // Official free c-number-field-1 composition; Base UI owns input, limits and scrub gestures.
          <NumberField
            id="ssp-team-seats"
            min={2}
            max={20}
            value={seats}
            onValueChange={(value) => {
              if (value !== null) setSeats(value);
            }}
            className="ssp-seats"
          >
            <NumberFieldScrubArea label="Seats" />
            <NumberFieldGroup className="ssp-seats-group">
              <NumberFieldDecrement aria-label="Decrease" />
              <NumberFieldInput className="ssp-seats-input" />
              <NumberFieldIncrement aria-label="Increase" />
            </NumberFieldGroup>
          </NumberField>
        )}
        <Button asChild variant={featured ? "default" : "secondary"} className="ssp-plan-action">
          <a href="#" role="button" onClick={placeholderLink}>
            {plan.action}
          </a>
        </Button>
      </CardContent>
    </li>
  );
}

export function SeatStepperPricing() {
  const [period, setPeriod] = useState<BillingPeriod>("yearly");

  return (
    <TooltipProvider>
      <section className="reui-reference seat-stepper-pricing" aria-labelledby="ssp-title">
        <div className="ssp-container">
          <header className="ssp-header">
            <div className="ssp-introduction">
              <h2 id="ssp-title">Pricing</h2>
              <p>
                <span>Simple plans for growing teams. Start free, add seats</span>{" "}
                <span>as you grow, and cancel whenever you need to.</span>
              </p>
            </div>
            <Tabs value={period} onValueChange={(value) => setPeriod(value as BillingPeriod)}>
              <TabsList aria-label="Billing period">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">
                  Yearly{" "}
                  <Badge variant="success-light" className="ssp-saving">
                    Save 20%
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </header>
          <Card className="ssp-card">
            <ul className="ssp-plans" aria-label="Pricing plans">
              {plans.map((plan) => (
                <PlanColumn key={plan.name} plan={plan} period={period} />
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </TooltipProvider>
  );
}
