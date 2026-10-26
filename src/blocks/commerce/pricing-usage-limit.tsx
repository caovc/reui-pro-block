import { useId, useState, type MouseEvent, type UIEvent } from "react";
import { Building2, CalendarClock, Check, Minus, User, Users } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  usageFeatureGroups,
  usageHighlight,
  usageInvoice,
  usageMoney,
  usagePlans,
  usageRate,
  type UsagePeriod,
  type UsagePlan,
  type UsagePlanId,
} from "./pricing-usage-limit-data";
import "../reference.css";
import "./pricing-usage-limit.css";

// Actual official free Dialog, Empty, ScrollArea, RadioGroup/Item, Tabs and
// Table compositions, combined with the official Frame, Badge and IconTile.
// Full registry evidence and observed non-collapsible groups are documented
// in docs/pricing-usage-limit-refinement.md. Shared primitives are unchanged.
const planIcons = { basic: User, team: Users, enterprise: Building2 };

function placeholderPlan(event: MouseEvent<HTMLAnchorElement>) {
  // The public links only target '#'. Keep both the local dialog state and
  // gallery hash intact rather than adding a payment or upgrade-success flow.
  event.preventDefault();
}

function PlanAction({ plan, primary = false }: { plan: UsagePlan; primary?: boolean }) {
  return (
    <Button asChild variant={primary ? "default" : "outline"} className="pu8-plan-action">
      <a href="#" aria-label={`${plan.action} for ${plan.name}`} onClick={placeholderPlan}>
        {plan.action}
      </a>
    </Button>
  );
}

function PlanCard({ plan, period }: { plan: UsagePlan; period: UsagePeriod }) {
  return (
    <Frame className="pu8-plan-card" data-plan={plan.id}>
      <FrameHeader className="pu8-plan-audience" role="presentation">
        <FrameDescription>{plan.description}</FrameDescription>
      </FrameHeader>
      <FramePanel className="pu8-plan-panel">
        <div className="pu8-card-heading">
          <h3>
            {plan.name}
            {plan.id === "team" && <span className="sr-only">, Most Popular</span>}
          </h3>
          <div className="pu8-card-price">
            <p>
              <span className="pu8-price" data-plan-price={plan.id}>
                {usageMoney(usageRate(plan, period))}
              </span>{" "}
              <span className="pu8-muted">per month</span>
            </p>
            <p className="pu8-card-invoice pu8-muted">
              {period === "yearly" ? usageInvoice(plan, period) : "Billed monthly"}
            </p>
          </div>
        </div>
        <div className="pu8-card-action">
          <PlanAction plan={plan} primary={plan.id === "team"} />
        </div>
        <Separator />
        <div className="pu8-inclusions">
          <p>{plan.includes}</p>
          <ul>
            {plan.highlights.map((key) => (
              <li key={key}>
                <span className="pu8-feature-mark">
                  <Check aria-hidden="true" />
                </span>
                <span className="pu8-highlight">
                  {["bookings", "seats", "calendars", "pages"].includes(key) ? (
                    <>
                      <span className="pu8-quantity">{String(plan.features[key])}</span>
                      {usageHighlight(plan, key).slice(String(plan.features[key]).length)}
                    </>
                  ) : (
                    usageHighlight(plan, key)
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </FramePanel>
      {plan.id === "team" && (
        <Badge variant="success" className="pu8-popular">
          Most Popular
        </Badge>
      )}
    </Frame>
  );
}

function PlanRail({
  selected,
  onSelect,
  period,
}: {
  selected: UsagePlanId;
  onSelect: (value: UsagePlanId) => void;
  period: UsagePeriod;
}) {
  const id = useId();
  return (
    <div className="pu8-plan-rail">
      <p id={`${id}-title`} className="pu8-rail-title">
        Plans
      </p>
      <RadioGroup
        value={selected}
        onValueChange={(value) => onSelect(value as UsagePlanId)}
        aria-labelledby={`${id}-title`}
        className="pu8-radio-group"
      >
        {usagePlans.map((plan) => {
          const Icon = planIcons[plan.id];
          return (
            <Item
              key={plan.id}
              asChild
              size="sm"
              className="pu8-rail-item"
              data-selected={selected === plan.id ? "true" : undefined}
            >
              <label htmlFor={`${id}-${plan.id}`}>
                <RadioGroupItem
                  id={`${id}-${plan.id}`}
                  value={plan.id}
                  aria-label={plan.name}
                  className="sr-only pu8-rail-radio"
                />
                <ItemMedia className="pu8-rail-media">
                  <IconTile variant="elevated" aria-hidden="true">
                    <Icon />
                  </IconTile>
                </ItemMedia>
                <ItemContent className="pu8-rail-copy">
                  <ItemTitle>{plan.name}</ItemTitle>
                  <ItemDescription>{plan.description}</ItemDescription>
                </ItemContent>
                <ItemActions className="pu8-rail-price">
                  {usageMoney(usageRate(plan, period))}
                  <span className="sr-only"> per month</span>
                </ItemActions>
              </label>
            </Item>
          );
        })}
      </RadioGroup>
    </div>
  );
}

function UsageFeatures() {
  return (
    <Frame className="pu8-features">
      <FrameHeader role="presentation">
        <FrameTitle role="heading" aria-level={3}>
          All Features
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="pu8-feature-panel">
        <Table className="pu8-feature-table" aria-label="All plan features">
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="pu8-feature-label">
                <span className="sr-only">Feature</span>
              </TableHead>
              {usagePlans.map((plan) => (
                <TableHead key={plan.id} scope="col" data-plan={plan.id}>
                  {plan.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          {usageFeatureGroups.map((group) => (
            <TableBody key={group.name}>
              <TableRow className="pu8-feature-band">
                <TableHead scope="rowgroup" className="pu8-feature-label">
                  {group.name}
                </TableHead>
                {usagePlans.map((plan) => (
                  <TableCell key={plan.id} data-plan={plan.id} />
                ))}
              </TableRow>
              {group.rows.map((row) => (
                <TableRow key={row.key} data-feature={row.key}>
                  <TableHead scope="row" className="pu8-feature-label">
                    {row.label}
                  </TableHead>
                  {usagePlans.map((plan) => {
                    const value = plan.features[row.key];
                    const Icon = value ? Check : Minus;
                    return (
                      <TableCell key={plan.id} data-plan={plan.id}>
                        {typeof value === "boolean" ? (
                          <span className={value ? "pu8-included" : "pu8-muted"}>
                            <Icon aria-hidden="true" className="pu8-value-icon" />
                            <span className="sr-only">{value ? "Included" : "Not included"}</span>
                          </span>
                        ) : (
                          value
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          ))}
        </Table>
      </FramePanel>
    </Frame>
  );
}

export function UsageLimitPricing() {
  const [open, setOpen] = useState(true);
  const [period, setPeriod] = useState<UsagePeriod>("yearly");
  const [selected, setSelected] = useState<UsagePlanId>("team");
  const [fade, setFade] = useState({ top: false, bottom: true });
  const active = usagePlans.find((plan) => plan.id === selected)!;
  const updateFade = (event: UIEvent<HTMLDivElement>) => {
    const viewport = event.target as HTMLElement;
    if (viewport.dataset.slot !== "scroll-area-viewport") return;
    setFade({
      top: viewport.scrollTop > 0,
      bottom: viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 1,
    });
  };
  return (
    <section className="reui-reference pu8-entry" aria-label="Plan upgrade dialog">
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setFade({ top: false, bottom: true });
        }}
      >
        <Empty className="pu8-empty">
          <EmptyHeader>
            <EmptyMedia>
              <IconTile variant="elevated" aria-hidden="true">
                <CalendarClock />
              </IconTile>
            </EmptyMedia>
            <EmptyTitle>Bookings Running Low</EmptyTitle>
            <EmptyDescription>A paid plan lifts the monthly limit.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <DialogTrigger asChild>
              <Button variant="outline">View Plans</Button>
            </DialogTrigger>
          </EmptyContent>
        </Empty>
        <DialogContent
          className="reui-reference pu8-dialog"
          data-selected-plan={selected}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.target as HTMLElement).focus({ preventScroll: true });
          }}
        >
          <DialogHeader className="pu8-dialog-header">
            <DialogTitle>Pick Your Plan</DialogTitle>
            <DialogDescription>Switch or cancel whenever you need.</DialogDescription>
          </DialogHeader>
          <div className="pu8-scroll-slot">
            <ScrollArea
              className="pu8-scroll-area"
              type="always"
              onScrollCapture={updateFade}
              data-fade-top={fade.top ? "true" : undefined}
              data-fade-bottom={fade.bottom ? "true" : undefined}
            >
              <PlanRail selected={selected} onSelect={setSelected} period={period} />
              <div className="pu8-body">
                <div className="pu8-billing">
                  <Tabs value={period} onValueChange={(value) => setPeriod(value as UsagePeriod)}>
                    <TabsList aria-label="Billing period">
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                      <TabsTrigger value="yearly">
                        Yearly
                        <Badge variant="success-light">2 Months Free</Badge>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="pu8-plan-grid">
                  {usagePlans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} period={period} />
                  ))}
                </div>
                <UsageFeatures />
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="pu8-mobile-footer">
            <div className="pu8-footer-content">
              <p role="status" className="pu8-summary">
                <span className="pu8-summary-name">{active.name}</span>
                <span className="pu8-summary-dot" aria-hidden="true" />
                <span className="pu8-summary-invoice">{usageInvoice(active, period)}</span>
              </p>
              <PlanAction plan={active} primary />
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
