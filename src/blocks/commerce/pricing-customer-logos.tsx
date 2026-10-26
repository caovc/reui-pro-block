import { useEffect, useRef, useState, type MouseEvent } from "react";
import { CircleCheck, CircleMinus } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { integrationArtwork, svgImage } from "@/lib/demo-artwork";
import "../reference.css";
import "./pricing-customer-logos.css";

type Period = "monthly" | "annual";
type PlanPricing =
  | { kind: "flat"; monthly: number; annual: number }
  | { kind: "seat"; monthly: number; annual: number }
  | { kind: "quote"; fromMonthly: number };
type Feature = { label: string; included: boolean };
type Plan = {
  name: string;
  pricing: PlanPricing;
  action: string;
  featured?: boolean;
  features: Feature[];
};

const included = (label: string): Feature => ({ label, included: true });
const excluded = (label: string): Feature => ({ label, included: false });
const plans: Plan[] = [
  {
    name: "Basic",
    pricing: { kind: "flat", monthly: 35, annual: 28 },
    action: "Start Trial",
    features: [
      included("2 million events a month"),
      included("12 months of event history"),
      included("1 team seat"),
      included("50 saved dashboards"),
      excluded("Embedded charts"),
      excluded("Single sign-on"),
    ],
  },
  {
    name: "Business",
    pricing: { kind: "seat", monthly: 25, annual: 20 },
    action: "Start Trial",
    featured: true,
    features: [
      included("10 million events a month"),
      included("36 months of event history"),
      included("2 to 20 team seats"),
      included("500 saved dashboards"),
      included("Embedded charts"),
      included("Single sign-on"),
    ],
  },
  {
    name: "Enterprise",
    pricing: { kind: "quote", fromMonthly: 750 },
    action: "Contact Us",
    features: [
      included("Custom event volume"),
      included("Unlimited event history"),
      included("Unlimited team seats"),
      included("Unlimited saved dashboards"),
      included("Embedded charts"),
      included("Single sign-on"),
    ],
  },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Independently drawn grain. No reference canvas pixels or artwork are copied. */
function OriginalGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    let frame = 0;

    const draw = () => {
      const { width, height } = parent.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * ratio);
      canvas.height = Math.ceil(height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      context.fillStyle = getComputedStyle(canvas).color;
      let seed = 17423;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      for (let y = 1; y < height; y += 3) {
        for (let x = 1; x < width; x += 3) {
          const dx = (x / width - 0.5) / 0.8;
          const dy = (y / height - 0.5) / 0.9;
          const envelope = Math.exp(-dx * dx - dy * dy);
          context.globalAlpha = (0.06 + 0.18 * envelope) * (0.35 + random() * 0.65);
          context.beginPath();
          context.arc(x + (random() - 0.5) * 0.4, y + (random() - 0.5) * 0.4, 0.5, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.globalAlpha = 1;
    };
    const scheduleDraw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    const resizeObserver = new ResizeObserver(scheduleDraw);
    resizeObserver.observe(parent);
    const themeObserver = new MutationObserver(scheduleDraw);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    scheduleDraw();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="pcl-grain" aria-hidden="true" />;
}

function placeholderLink(event: MouseEvent<HTMLAnchorElement>) {
  // The public CTAs use '#'; preserve the gallery hash while reproducing their visible result.
  event.preventDefault();
  event.currentTarget.ownerDocument.defaultView?.scrollTo({ top: 0, behavior: "instant" });
}

function PlanPrice({ plan, period }: { plan: Plan; period: Period }) {
  const pricing = plan.pricing;
  const amount = pricing.kind === "quote" ? pricing.fromMonthly : pricing[period];
  const billing =
    pricing.kind === "quote"
      ? "Starting price"
      : period === "monthly"
        ? "Billed monthly"
        : pricing.kind === "flat"
          ? `${currency.format(pricing.annual * 12)} billed yearly`
          : "Billed yearly";

  return (
    <p className="pcl-price" aria-label={`${plan.name} price`}>
      <span className="pcl-amount">{currency.format(amount)}</span>{" "}
      <span className="pcl-price-details">
        <span>{pricing.kind === "seat" ? "per seat / month" : "per month"}</span>{" "}
        <span className="pcl-billing">{billing}</span>
      </span>
    </p>
  );
}

function PricingCard({ plan, period }: { plan: Plan; period: Period }) {
  return (
    <li className="pcl-plan" aria-label={`${plan.name} plan`}>
      <Card className="pcl-card ring-border ring-inset">
        <CardHeader>
          <CardTitle className="pcl-title">
            <h3>
              {plan.name}
              {plan.featured && <span className="sr-only">, Best Value</span>}
            </h3>
          </CardTitle>
          {plan.featured && (
            <Badge variant="success" className="pcl-best-value" aria-hidden="true">
              Best Value
            </Badge>
          )}
        </CardHeader>
        <CardContent className="pcl-rate-and-action">
          <PlanPrice plan={plan} period={period} />
          <Button asChild variant={plan.featured ? "default" : "outline"} className="pcl-action">
            <a href="#" role="button" onClick={placeholderLink}>
              {plan.action}
            </a>
          </Button>
        </CardContent>
        <Separator />
        <CardContent>
          <ul className="pcl-features" aria-label={`${plan.name} features`}>
            {plan.features.map((feature) => (
              <li key={feature.label}>
                <span
                  className={`pcl-feature-icon ${feature.included ? "text-success" : "text-muted-foreground"}`}
                >
                  {feature.included ? (
                    <CircleCheck aria-hidden="true" />
                  ) : (
                    <CircleMinus aria-hidden="true" />
                  )}
                </span>
                <span>
                  {!feature.included && <span className="sr-only">Not included: </span>}
                  {feature.label}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </li>
  );
}

const illustrativeTeams = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"];

function IllustrativeTeams() {
  return (
    <div className="pcl-trust">
      <div className="pcl-trust-caption">
        <Separator />
        <p>Illustrative product teams</p>
        <Separator />
      </div>
      <ul className="pcl-marks" aria-label="Illustrative product team marks">
        {illustrativeTeams.map((name) => (
          <li key={name}>
            <img
              src={svgImage(integrationArtwork(name[0], "#737373"))}
              width={18}
              height={18}
              alt={`Team ${name} original demo mark`}
            />
            <span>{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CustomerLogoPricing() {
  const [period, setPeriod] = useState<Period>("annual");

  return (
    <section className="reui-reference customer-logo-pricing" aria-labelledby="pcl-heading">
      <OriginalGrain />
      <div className="pcl-container">
        <header className="pcl-header">
          <div className="pcl-introduction">
            <h2 id="pcl-heading">Pricing That Scales</h2>
            <p>
              Try Basic or Business free for 14 days,
              <br />
              then scale up as your events grow.
            </p>
          </div>
          <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <TabsList aria-label="Billing period">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annual">
                Annual{" "}
                <Badge variant="success-light" className="pcl-saving">
                  20% Off
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>
        <ul className="pcl-plans" aria-label="Pricing plans">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} period={period} />
          ))}
        </ul>
        <IllustrativeTeams />
      </div>
    </section>
  );
}
