import { useState } from "react";
import {
  Activity,
  Check,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { downloadFile } from "@/lib/download";
import { StrataSettingsSection } from "./strata-settings-shared";
import {
  STRATA_BILLING_PLANS,
  formatStrataBillingMoney,
  strataBillingUsageCsv,
  strataInvoicePdf,
  strataPlanQuote,
  type StrataBillingInvoice,
  type StrataBillingPlan,
  type useStrataSettingsBillingModel,
} from "./strata-settings-billing-model";
import "./strata-settings-leaves.css";

type BillingModel = ReturnType<typeof useStrataSettingsBillingModel>;
const compact = (value: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const date = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));

function BillingPortalAction({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          A connected billing portal is required. This local preview does not process payments or
          modify a real subscription.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanQuote({ plan, model }: { plan: StrataBillingPlan; model: BillingModel }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const quote = strataPlanQuote(plan.id, model.interval);
  const currentPlan = plan.id === model.currentPlan.id;
  const current = currentPlan && model.interval === "monthly";
  const upgrade = plan.monthlyCents > model.currentPlan.monthlyCents;
  return (
    <article className="strata-billing-plan">
      <div className="strata-billing-plan-title">
        <h3>{plan.name}</h3>
        {current && <Badge variant="outline">Current</Badge>}
      </div>
      <p>{plan.description}</p>
      <div className="strata-billing-price">
        <strong>{formatStrataBillingMoney(quote.cents, true)}</strong>
        <span>/ {model.interval === "yearly" ? "year" : "month"}</span>
      </div>
      <small>
        {model.interval === "yearly"
          ? `${formatStrataBillingMoney(quote.monthlyEquivalentCents, true)} a month, ${quote.freeMonths} months free`
          : "Billed monthly"}
      </small>
      <ul>
        {[
          `${plan.seats} seats`,
          `${plan.monitors} monitors`,
          `${compact(plan.apiCalls)} API calls a month`,
          `${plan.storageGb} GB log storage`,
        ].map((feature) => (
          <li key={feature}>
            <Check />
            {feature}
          </li>
        ))}
      </ul>
      {current ? (
        <Button variant="outline" disabled>
          Current Plan
        </Button>
      ) : (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) setSaved(false);
          }}
        >
          <DialogTrigger asChild>
            <Button variant={upgrade ? "default" : "outline"}>
              {currentPlan ? "Switch to Yearly" : upgrade ? "Upgrade" : "Downgrade"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{plan.name} plan quote</DialogTitle>
              <DialogDescription>
                Review a local quote. Your subscription stays on monthly Growth.
              </DialogDescription>
            </DialogHeader>
            <dl className="strata-billing-quote">
              <dt>Interval</dt>
              <dd>{model.interval}</dd>
              <dt>Price before tax</dt>
              <dd>{formatStrataBillingMoney(quote.cents)}</dd>
              <dt>Included seats</dt>
              <dd>{plan.seats}</dd>
              <dt>Included monitors</dt>
              <dd>{plan.monitors}</dd>
            </dl>
            {model.interval === "yearly" && (
              <p className="text-xs text-muted-foreground">
                Billed yearly, with two months free compared with monthly pricing.
              </p>
            )}
            <p role="status" className="text-sm text-muted-foreground">
              {saved
                ? "Quote saved in this preview. No subscription or payment changed."
                : "Save this quote locally; no payment is collected."}
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              <Button
                disabled={saved}
                onClick={() => {
                  model.saveQuote(plan.id);
                  setSaved(true);
                }}
              >
                Save quote
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </article>
  );
}

function InvoiceView({ invoice }: { invoice: StrataBillingInvoice }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`View invoice ${invoice.id}`}>
          <ExternalLink />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{invoice.id}</DialogTitle>
          <DialogDescription>Local invoice preview, not a payment receipt.</DialogDescription>
        </DialogHeader>
        <dl className="strata-billing-quote">
          <dt>Status</dt>
          <dd>{invoice.status}</dd>
          <dt>Date</dt>
          <dd>{date(invoice.date)}</dd>
          <dt>Item</dt>
          <dd>{invoice.description}</dd>
          <dt>Amount</dt>
          <dd>{formatStrataBillingMoney(invoice.cents)}</dd>
        </dl>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button
            onClick={() =>
              downloadFile(`${invoice.id}.pdf`, strataInvoicePdf(invoice), "application/pdf")
            }
          >
            <Download />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StrataSettingsBilling({ model }: { model: BillingModel }) {
  return (
    <section className="strata-settings-billing" aria-label="Billing settings">
      <StrataSettingsSection
        title="Subscription"
        description="BL-SUB-026 · local billing record"
        action={<Badge variant="success-light">Active</Badge>}
        footer={
          <>
            <span>Changes and cancellations require a connected billing portal</span>
            <BillingPortalAction
              label="Cancel Plan"
              title="Cancel subscription"
              description="Cancellation is not applied from this preview."
            />
          </>
        }
      >
        <div className="strata-billing-subscription">
          <div>
            <h2>
              {model.currentPlan.name}
              <Badge variant="outline">Monthly</Badge>
            </h2>
            <p>{model.currentPlan.description}</p>
          </div>
          <div className="strata-billing-price">
            <strong>{formatStrataBillingMoney(model.currentPlan.monthlyCents, true)}</strong>
            <span>per month</span>
          </div>
        </div>
        <dl className="strata-billing-period">
          <div>
            <dt>Renews</dt>
            <dd>{date(model.renewal)}</dd>
            <span>In {model.daysToRenewal} days</span>
          </div>
          <div>
            <dt>Current Period</dt>
            <dd>Oct 1 to Nov 1, 2026</dd>
            <span>Day 22 of 31</span>
          </div>
          <div>
            <dt>Customer Since</dt>
            <dd>Jun 1, 2026</dd>
            <span>BL-ACC-014</span>
          </div>
        </dl>
      </StrataSettingsSection>
      <StrataSettingsSection
        title="Plans"
        description="Fixed prices, shown before tax"
        action={
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            size="sm"
            value={model.interval}
            onValueChange={(value) => {
              if (value === "monthly" || value === "yearly") model.setInterval(value);
            }}
            aria-label="Billing interval"
          >
            <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
            <ToggleGroupItem value="yearly">Yearly</ToggleGroupItem>
          </ToggleGroup>
        }
      >
        <div className="strata-billing-plans">
          {STRATA_BILLING_PLANS.map((plan) => (
            <PlanQuote key={plan.id} plan={plan} model={model} />
          ))}
        </div>
      </StrataSettingsSection>
      <div className="strata-billing-columns">
        <StrataSettingsSection
          title="Usage"
          description="Since Oct 1, against Growth limits"
          footer={
            <>
              <span>Counts update hourly in the fixture</span>
              <Button
                variant="outline"
                onClick={() =>
                  downloadFile(
                    "bricklane-usage-2026-10.csv",
                    strataBillingUsageCsv(),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                <Download />
                Export CSV
              </Button>
            </>
          }
        >
          <div className="strata-billing-usage">
            {model.usage.map((usage, index) => {
              const Icon = [Users, Activity, Zap, FileText][index];
              const near = usage.percent >= 80;
              return (
                <div key={usage.label}>
                  <div>
                    <span>
                      <Icon />
                      {usage.label}
                      {near && <Badge variant="warning-light">Near Limit</Badge>}
                    </span>
                    <span>
                      {compact(usage.used)}
                      {usage.unit ? ` ${usage.unit}` : ""} of {compact(usage.limit)}
                      {usage.unit ? ` ${usage.unit}` : ""}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, usage.percent)}
                    aria-label={`${usage.label}: ${usage.used} of ${usage.limit}`}
                    className={near ? "strata-billing-near-limit" : undefined}
                  />
                </div>
              );
            })}
          </div>
        </StrataSettingsSection>
        <StrataSettingsSection
          title="Payment"
          description="Demo card, receipts and the next charge"
          action={
            <span className="strata-billing-monogram" aria-label="Bricklane demo billing">
              BL
            </span>
          }
          footer={
            <>
              <span>Local billing preview</span>
              <BillingPortalAction
                label="Update Card"
                title="Update payment card"
                description="Real card details are managed in a connected payment portal."
              />
            </>
          }
        >
          <ul className="strata-billing-payment" aria-label="Payment summary">
            <li>
              <span>
                Card<small>Default, expires 12/28</small>
              </span>
              <span>
                <CreditCard />
                Demo card ending 4242
              </span>
            </li>
            <li>
              <span>
                Billing Email<small>Gets every receipt</small>
              </span>
              <span>billing@bricklane.test</span>
            </li>
            <li>
              <span>
                Next Invoice<small>Due Nov 1, 2026, after $25.00 credit</small>
              </span>
              <span>$190.42</span>
            </li>
            <li>
              <span>
                Last Payment<small>Oct 1, 2026, BL-20418</small>
              </span>
              <span>$215.42</span>
            </li>
          </ul>
        </StrataSettingsSection>
      </div>
      <StrataSettingsSection
        title="Invoices"
        description="Latest 6 local billing records"
        footer={
          <>
            <span>Older invoices require a connected billing portal</span>
            <BillingPortalAction
              label="All Invoices"
              title="Billing archive"
              description="This preview includes the six local invoice records shown here."
            />
          </>
        }
      >
        <ul className="strata-billing-invoices" aria-label="Invoices">
          {model.invoices.map((invoice) => (
            <li key={invoice.id}>
              <span>
                <strong>
                  {invoice.id}
                  <Badge
                    variant={
                      invoice.status === "Paid"
                        ? "success-light"
                        : invoice.status === "Open"
                          ? "warning-light"
                          : "secondary"
                    }
                  >
                    {invoice.status}
                  </Badge>
                </strong>
                <small>
                  {invoice.status === "Open" ? "Due " : ""}
                  {date(invoice.date)} · {invoice.description}
                </small>
              </span>
              <div>
                {invoice.status === "Open" && (
                  <BillingPortalAction
                    label="Pay"
                    title={`Pay ${invoice.id}`}
                    description={`This invoice is ${formatStrataBillingMoney(invoice.cents)}. No payment can be submitted in this preview.`}
                  />
                )}
                <InvoiceView invoice={invoice} />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Download ${invoice.id} PDF`}
                  onClick={() =>
                    downloadFile(`${invoice.id}.pdf`, strataInvoicePdf(invoice), "application/pdf")
                  }
                >
                  <Download />
                </Button>
                <strong>{formatStrataBillingMoney(invoice.cents)}</strong>
              </div>
            </li>
          ))}
        </ul>
      </StrataSettingsSection>
      <p className="strata-settings-local-note">
        Local subscription and invoice fixtures. No real charges, plan changes or card updates occur
        here.
      </p>
    </section>
  );
}
