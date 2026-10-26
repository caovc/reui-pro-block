import { useState, type MouseEvent, type ReactNode } from "react";
import {
  Activity,
  Archive,
  ArrowUpRight,
  Bell,
  Check,
  Database,
  FileText,
  Headphones,
  Info,
  Layers,
  LayoutDashboard,
  Lock,
  Play,
  PlugZap,
  ShieldCheck,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { demoAvatar } from "@/lib/demo-artwork";
import "../reference.css";
import "./pricing-per-seat.css";

// Composed from the free ReUI c-tabs-1, c-card-1, c-table-1, c-avatar-1,
// c-tooltip-1 and c-separator-1 examples, plus the actual ReUI Badge source.
// Their stock dependencies remain explicit imports. MIT notices are retained
// in components/reui/REUI-LICENSE.txt; the pricing data is independent instance code.
const teamSizes = {
  solo: {
    label: "Solo",
    seats: 1,
    description: "For one founder on one product",
    benefits: ["1 analyst seat", "Private workspace", "Weekly digest email", "Community forum"],
  },
  startup: {
    label: "Startup",
    seats: 5,
    description: "For a first product team",
    benefits: [
      "5 seats on paid plans",
      "Shared workspaces",
      "Editor and viewer roles",
      "Comments on charts",
    ],
  },
  growth: {
    label: "Growth",
    seats: 15,
    description: "For teams running several products",
    benefits: [
      "15 seats on paid plans",
      "A lower seat rate",
      "Workspace per product",
      "Onboarding call",
    ],
  },
  enterprise: {
    label: "Enterprise",
    seats: 40,
    description: "For analytics across the company",
    benefits: [
      "40 seats on paid plans",
      "The lowest seat rate",
      "Invoice billing",
      "Named account manager",
    ],
  },
} as const;
type TeamSize = keyof typeof teamSizes;
type PlanId = "free" | "pro" | "ultimate";
type Plan = {
  id: PlanId;
  name: string;
  description: string;
  listRate: number;
  seatRates: Record<TeamSize, number>;
};
const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Core charts and funnels for a single product.",
    listRate: 0,
    seatRates: { solo: 0, startup: 0, growth: 0, enterprise: 0 },
  },
  {
    id: "pro",
    name: "Pro",
    description: "Session replays, hourly alerts and a year of data.",
    listRate: 28,
    seatRates: { solo: 28, startup: 26, growth: 24, enterprise: 22 },
  },
  {
    id: "ultimate",
    name: "Ultimate",
    description: "Warehouse sync, SSO and replies within a day.",
    listRate: 48,
    seatRates: { solo: 48, startup: 45, growth: 42, enterprise: 39 },
  },
];
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// Every price, per-seat caption and Analyst seats cell shares the selected model.
const analystSeats = (plan: Plan, team: TeamSize) => {
  const count = plan.id === "free" ? 1 : teamSizes[team].seats;
  return `${count} ${count === 1 ? "seat" : "seats"}`;
};
type Feature = {
  label: string;
  icon: typeof Users;
  help: string;
  link?: string;
  count?: string;
  value: (plan: Plan, team: TeamSize) => string | boolean;
};
const byPlan =
  (free: string | boolean, pro: string | boolean, ultimate: string | boolean) => (plan: Plan) =>
    ({ free, pro, ultimate })[plan.id];
const features: Feature[] = [
  {
    label: "Analyst seats",
    icon: Users,
    help: "Viewers who only read shared dashboards never take a seat.",
    value: analystSeats,
  },
  {
    label: "Monthly events",
    icon: Activity,
    help: "A tracked action counts once, whatever number of properties it carries.",
    value: byPlan("50,000", "2 million", "10 million"),
  },
  {
    label: "Data retention",
    icon: Archive,
    help: "Past this window raw events leave the charts and move to archive.",
    link: "Policy",
    value: byPlan("30 days", "12 months", "36 months"),
  },
  {
    label: "Source integrations",
    icon: PlugZap,
    help: "Web, mobile and server libraries, plus imports from ad platforms.",
    count: "140",
    link: "Browse",
    value: () => true,
  },
  {
    label: "Report templates",
    icon: FileText,
    help: "Funnels, cohorts and activation reports you can copy and edit.",
    count: "36",
    link: "Browse",
    value: () => true,
  },
  {
    label: "Saved dashboards",
    icon: LayoutDashboard,
    help: "One dashboard holds any number of charts on a single date range.",
    link: "Examples",
    value: byPlan("3", "50", "500"),
  },
  {
    label: "Alert checks",
    icon: Bell,
    help: "How often a saved metric is tested against its threshold.",
    value: byPlan("Daily", "Hourly", "Every 15 minutes"),
  },
  {
    label: "Session replay",
    icon: Play,
    help: "Watch the visit behind any point on a funnel or a chart.",
    link: "Watch",
    value: byPlan(false, true, true),
  },
  {
    label: "Shared workspaces",
    icon: Layers,
    help: "Needs two or more seats. Everyone edits the same boards.",
    value: (plan, team) => plan.id !== "free" && teamSizes[team].seats > 1,
  },
  {
    label: "Seat management",
    icon: UserRoundCog,
    help: "Needs two or more seats. Invite, remove and reassign in one place.",
    value: (plan, team) => plan.id !== "free" && teamSizes[team].seats > 1,
  },
  {
    label: "Warehouse sync",
    icon: Database,
    help: "Raw events land in your own warehouse every hour.",
    link: "Docs",
    value: (plan) => plan.id === "ultimate",
  },
  {
    label: "Single sign-on",
    icon: Lock,
    help: "Seats are created the first time somebody signs in.",
    link: "Docs",
    value: (plan) => plan.id === "ultimate",
  },
  {
    label: "Support reply time",
    icon: Headphones,
    help: "Counted in business hours from your first message, not the last.",
    value: byPlan("Best effort", "2 days", "1 day"),
  },
];

// The reference's literal hash links only scroll to the top. Keep that action
// inside the gallery without replacing its hash route or inventing checkout UI.
function placeholderLink(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function Placeholder({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <a href="#" onClick={placeholderLink} className={className} aria-label={label}>
      {children}
    </a>
  );
}
function TeamChooser({
  team,
  onChange,
  mobile = false,
}: {
  team: TeamSize;
  onChange: (team: TeamSize) => void;
  mobile?: boolean;
}) {
  return (
    <div className={mobile ? "psp-team-mobile" : "psp-team-desktop"}>
      <h3 className={mobile ? "sr-only" : undefined}>Choose your team size</h3>
      <Tabs value={team} onValueChange={(value) => onChange(value as TeamSize)}>
        <TabsList aria-label="Choose your team size">
          {Object.entries(teamSizes).map(([id, option]) => (
            <TabsTrigger key={id} value={id}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(teamSizes).map(([id, option]) => (
          <TabsContent value={id} key={id}>
            <p className="psp-team-description">{option.description}</p>
            {!mobile && (
              <ul className="psp-team-benefits">
                {option.benefits.map((benefit, index) => (
                  <li key={benefit} className={index === 0 ? "psp-first-benefit" : undefined}>
                    <Check aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
function Price({ plan, team, mobile = false }: { plan: Plan; team: TeamSize; mobile?: boolean }) {
  const seats = teamSizes[team].seats;
  const current = plan.seatRates[team] * seats;
  const regular = plan.listRate * seats;
  return (
    <div className="psp-price" data-plan-price={plan.id}>
      <p className="psp-price-line">
        {regular > current && (
          <>
            <span className="sr-only">Regular price </span>
            <s>{currency.format(regular)}</s>
            <span className="sr-only">, now </span>
          </>
        )}
        <span className="psp-price-number">{currency.format(current)}</span>
        <span className="psp-price-period">{plan.id === "free" ? "Forever" : "a month"}</span>
      </p>
      {!mobile && <PriceNote plan={plan} team={team} />}
    </div>
  );
}
function PriceNote({ plan, team }: { plan: Plan; team: TeamSize }) {
  return (
    <p className="psp-price-note">
      {plan.id === "free"
        ? "No card needed"
        : `${currency.format(plan.seatRates[team])} a seat, billed yearly`}
    </p>
  );
}
function PlanAction({ plan }: { plan: Plan }) {
  if (plan.id === "free")
    return (
      <Button asChild size="lg" className="psp-plan-action">
        <a role="button" href="#" onClick={placeholderLink}>
          Start Free
        </a>
      </Button>
    );
  return (
    <Button
      size="lg"
      variant={plan.id === "pro" ? "outline" : "default"}
      className="psp-plan-action"
      disabled
    >
      {plan.id === "pro" ? "Included in your package" : "Current Package"}
    </Button>
  );
}
function FeatureLabel({ feature, mobile = false }: { feature: Feature; mobile?: boolean }) {
  const label = (
    <>
      <feature.icon aria-hidden="true" />
      <span>{feature.label}</span>
      {feature.count && <Badge variant="outline">{feature.count}</Badge>}
    </>
  );
  if (mobile)
    return feature.link ? (
      <Placeholder
        className="psp-feature-label psp-mobile-feature-link"
        label={`${feature.label}, ${feature.link.toLowerCase()}`}
      >
        {label}
        <ArrowUpRight aria-hidden="true" />
      </Placeholder>
    ) : (
      <span className="psp-feature-label">{label}</span>
    );
  return (
    <div className="psp-feature-label">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className="psp-help"
            aria-label={`About ${feature.label}`}
          >
            <Info aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="reui-reference psp-tooltip" side="top" sideOffset={4}>
          {feature.help}
        </TooltipContent>
      </Tooltip>
      {feature.link && (
        <Button asChild variant="link" size="xs" className="psp-row-link">
          <a role="button" href="#" onClick={placeholderLink}>
            {feature.link}
            <ArrowUpRight aria-hidden="true" />
          </a>
        </Button>
      )}
    </div>
  );
}
function FeatureValue({ value, mobile = false }: { value: string | boolean; mobile?: boolean }) {
  if (typeof value === "boolean")
    return (
      <span className="psp-feature-state">
        {value ? (
          <Check className="psp-included" aria-hidden="true" />
        ) : (
          <X className="psp-excluded" aria-hidden="true" />
        )}
        <span className="sr-only">{value ? "Included" : "Not included"}</span>
      </span>
    );
  return mobile ? (
    <span className="psp-mobile-value">
      {value}
      <Check className="psp-included" aria-hidden="true" />
    </span>
  ) : (
    <Badge variant="secondary" className="psp-value-badge">
      {value}
    </Badge>
  );
}
function DesktopPlans({ team, onChange }: { team: TeamSize; onChange: (team: TeamSize) => void }) {
  return (
    <Card className="psp-desktop-card">
      <CardContent>
        <Table aria-label="Compare pricing plans">
          <colgroup>
            <col className="psp-feature-column" />
            {plans.map((plan) => (
              <col key={plan.id} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow className="psp-plan-titles">
              <TableCell rowSpan={4} className="psp-team-cell">
                <TeamChooser team={team} onChange={onChange} />
              </TableCell>
              {plans.map((plan) => (
                <TableHead
                  scope="col"
                  key={plan.id}
                  className={plan.id === "ultimate" ? "psp-ultimate" : undefined}
                >
                  {plan.id === "ultimate" && (
                    <Badge variant="success" className="psp-best">
                      Best Value
                    </Badge>
                  )}
                  {plan.name}
                </TableHead>
              ))}
            </TableRow>
            <TableRow className="psp-plan-descriptions">
              {plans.map((plan) => (
                <TableCell
                  key={plan.id}
                  className={plan.id === "ultimate" ? "psp-ultimate" : undefined}
                >
                  <p>{plan.description}</p>
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="psp-plan-prices">
              {plans.map((plan) => (
                <TableCell
                  key={plan.id}
                  className={plan.id === "ultimate" ? "psp-ultimate" : undefined}
                >
                  <Price plan={plan} team={team} />
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="psp-plan-actions">
              {plans.map((plan) => (
                <TableCell
                  key={plan.id}
                  className={plan.id === "ultimate" ? "psp-ultimate" : undefined}
                >
                  <PlanAction plan={plan} />
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((feature) => (
              <TableRow key={feature.label}>
                <TableHead scope="row">
                  <FeatureLabel feature={feature} />
                </TableHead>
                {plans.map((plan) => (
                  <TableCell
                    key={plan.id}
                    className={plan.id === "ultimate" ? "psp-ultimate" : undefined}
                  >
                    <FeatureValue value={feature.value(plan, team)} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
function MobilePlans({ team, onChange }: { team: TeamSize; onChange: (team: TeamSize) => void }) {
  return (
    <div className="psp-mobile-plans">
      <TeamChooser team={team} onChange={onChange} mobile />
      <div className="psp-mobile-cards">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={
              plan.id === "ultimate" ? "psp-mobile-card psp-current-card" : "psp-mobile-card"
            }
            aria-label={`${plan.name} plan`}
          >
            <CardHeader>
              <CardTitle role="heading" aria-level={3}>
                {plan.name}
                {plan.id === "ultimate" && <Badge variant="success">Best Value</Badge>}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="psp-mobile-purchase">
              <Price plan={plan} team={team} mobile />
              <div className="psp-mobile-action">
                <PlanAction plan={plan} />
                <PriceNote plan={plan} team={team} />
              </div>
            </CardContent>
            <CardContent className="psp-mobile-features">
              <Separator />
              <ul>
                {features.map((feature) => (
                  <li key={feature.label}>
                    <FeatureLabel feature={feature} mobile />
                    <FeatureValue value={feature.value(plan, team)} mobile />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
export function PerSeatPricing() {
  const [team, setTeam] = useState<TeamSize>("startup");
  return (
    <section className="reui-reference psp" data-pricing-variant="3" aria-label="Per-seat pricing">
      <h2 className="sr-only">Pricing</h2>
      <div className="psp-container">
        <figure className="psp-endorsement">
          <p className="psp-eyebrow">Used by 1,284 product teams</p>
          <blockquote>
            “Our funnel review went from a week to a morning.
            <br /> Adding seats never meant a new contract.”
          </blockquote>
          <figcaption>
            <Avatar>
              <AvatarImage src={demoAvatar("Nora Vale")} alt="Nora Vale" />
              <AvatarFallback>NV</AvatarFallback>
            </Avatar>
            <div>
              <strong>Nora Vale</strong>
              <p>
                Head of Growth at <Placeholder>Fernhill</Placeholder>
              </p>
            </div>
          </figcaption>
        </figure>
        <TooltipProvider>
          <DesktopPlans team={team} onChange={setTeam} />
          <MobilePlans team={team} onChange={setTeam} />
        </TooltipProvider>
        <footer className="psp-footer">
          <p>
            <span>
              <Lock aria-hidden="true" />
              Encrypted card checkout
            </span>
            <Placeholder>
              <ShieldCheck aria-hidden="true" />
              30-day refunds
            </Placeholder>
          </p>
          <p className="psp-tax">
            Local sales tax is added at checkout, where your country requires it.
          </p>
        </footer>
      </div>
    </section>
  );
}
