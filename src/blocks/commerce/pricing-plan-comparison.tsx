import { useState, type MouseEvent } from "react";
import { Archive, ChartColumn, Check, Inbox, Minus, ShieldCheck } from "lucide-react";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  comparisonPlans,
  comparisonSections,
  type ComparisonPlan,
  type ComparisonValue,
} from "./pricing-plan-comparison-data";
import "../reference.css";
import "./pricing-plan-comparison.css";

// Compose the actual official free Card/Table, single ToggleGroup and Popover
// examples with the official IconTile implementation. Registry/source evidence
// is recorded in docs/pricing-plan-comparison-refinement.md; MIT notices remain
// in src/components/reui/REUI-LICENSE.txt and in the downloaded starter.
const sectionIcons = {
  collection: Inbox,
  retention: Archive,
  reporting: ChartColumn,
  access: ShieldCheck,
};
const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function FeatureHint({ label, hint }: { label: string; hint: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="pc2-feature-hint">
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        aria-label={label}
        className="reui-reference pc2-hint-content"
      >
        {hint}
      </PopoverContent>
    </Popover>
  );
}

function FeatureValue({ value }: { value: ComparisonValue }) {
  if (typeof value === "boolean") {
    const Icon = value ? Check : Minus;
    return (
      <span className={value ? "pc2-included" : "pc2-unavailable"}>
        <Icon aria-hidden="true" />
        <span className="sr-only">{value ? "Included" : "Not included"}</span>
      </span>
    );
  }
  if (typeof value === "string") return <span className="pc2-amount">{value}</span>;
  return (
    <span className="pc2-allowance">
      <span>{value.allowance}</span>
      <span className="pc2-rate">{value.rate}</span>
    </span>
  );
}

function planPlaceholder(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  event.currentTarget.ownerDocument.defaultView?.scrollTo({ top: 0, behavior: "instant" });
}

export function PlanComparisonPricing() {
  const [mobilePlan, setMobilePlan] = useState<ComparisonPlan>("pro");
  return (
    <section
      aria-labelledby="plan-comparison-title"
      className="reui-reference pc2-pricing"
      data-pricing-variant="2"
    >
      <div className="pc2-container">
        <header className="pc2-intro">
          <div className="pc2-copy">
            <h2 id="plan-comparison-title">Compare Plans</h2>
            <p>
              <span>Prices are per month, billed yearly. Plans differ in</span>{" "}
              <span>how&nbsp;many events you send and how long you keep them.</span>
            </p>
          </div>
          <ToggleGroup
            type="single"
            value={mobilePlan}
            onValueChange={(value) => value && setMobilePlan(value as ComparisonPlan)}
            spacing={2}
            aria-label="Plan to show"
            className="pc2-plan-picker"
          >
            {comparisonPlans.map((plan) => (
              <ToggleGroupItem key={plan.id} value={plan.id}>
                {plan.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </header>
        <Card className="pc2-card" data-active-plan={mobilePlan}>
          <Table className="pc2-table" aria-label="Compare plan features and usage rates">
            <TableHeader className="pc2-plan-head">
              <TableRow className="pc2-plan-names">
                <TableHead scope="col" className="pc2-label">
                  <span className="sr-only">Feature</span>
                </TableHead>
                {comparisonPlans.map((plan) => (
                  <TableHead key={plan.id} scope="col" data-plan={plan.id} className="pc2-plan">
                    <span className="pc2-plan-summary">
                      <span>{plan.name}</span>
                      <span className="pc2-price">
                        {dollars.format(plan.price)}
                        {"from" in plan && plan.from ? "+" : ""}
                      </span>
                    </span>
                  </TableHead>
                ))}
              </TableRow>
              <TableRow className="pc2-plan-actions">
                <TableHead scope="row" className="pc2-label">
                  <span className="sr-only">Get started</span>
                </TableHead>
                {comparisonPlans.map((plan) => (
                  <TableCell key={plan.id} data-plan={plan.id}>
                    <Button
                      asChild
                      size="sm"
                      variant={plan.id === "team" ? "default" : "outline"}
                      className="pc2-plan-action"
                    >
                      <a
                        href="#"
                        aria-label={
                          plan.id === "unlimited" ? "Contact us about Unlimited" : undefined
                        }
                        onClick={planPlaceholder}
                      >
                        {plan.action}
                      </a>
                    </Button>
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            {comparisonSections.map((section) => {
              const Icon = sectionIcons[section.id];
              return (
                <TableBody key={section.id} data-section={section.id}>
                  <TableRow className="pc2-section-band">
                    <TableHead scope="rowgroup" className="pc2-label">
                      <span className="pc2-section-caption">
                        <IconTile variant="elevated" aria-hidden="true">
                          <Icon />
                        </IconTile>
                        <span className="pc2-section-copy">
                          <span className="pc2-section-name">{section.title}</span>
                          <span className="pc2-section-description">{section.description}</span>
                        </span>
                      </span>
                    </TableHead>
                    {comparisonPlans.map((plan) => (
                      <TableCell key={plan.id} data-plan={plan.id} />
                    ))}
                  </TableRow>
                  {section.rows.map((row) => (
                    <TableRow
                      key={row.label}
                      data-feature={row.label}
                      data-group={!row.values || (row.indent && !row.groupEnd) ? "true" : undefined}
                      className={row.indent ? "pc2-detail-row" : undefined}
                    >
                      <TableHead scope="row" className="pc2-label">
                        {row.hint ? <FeatureHint label={row.label} hint={row.hint} /> : row.label}
                      </TableHead>
                      {comparisonPlans.map((plan, index) => (
                        <TableCell key={plan.id} data-plan={plan.id}>
                          {row.values && <FeatureValue value={row.values[index]} />}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              );
            })}
          </Table>
        </Card>
      </div>
    </section>
  );
}
