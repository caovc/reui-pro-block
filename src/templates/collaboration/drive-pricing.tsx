import {
  Check,
  ClipboardCheck,
  Folders,
  HardDrive,
  History,
  LifeBuoy,
  Link,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { drivePlans, type DrivePlan, type DrivePlanId } from "./drive-workspace-model";
import "@/blocks/reference.css";
import "./drive-pricing.css";

const descriptions: Record<DrivePlanId, string> = {
  free: "For trying the studio out on your own.",
  team: "A small studio with shared folders.",
  business: "Client work, with approvals and roles.",
};

type Feature = {
  label: string;
  icon: LucideIcon;
  values: Record<DrivePlanId, string | boolean>;
};

const features: readonly Feature[] = [
  { label: "Seats", icon: Users, values: { free: "3", team: "10", business: "24" } },
  {
    label: "Storage",
    icon: HardDrive,
    values: { free: "1.00 GB", team: "1.00 TB", business: "2.00 TB" },
  },
  { label: "Link sharing", icon: Link, values: { free: true, team: true, business: true } },
  { label: "Version history", icon: History, values: { free: false, team: true, business: true } },
  { label: "Shared drives", icon: Folders, values: { free: false, team: true, business: true } },
  {
    label: "Approval controls",
    icon: ClipboardCheck,
    values: { free: false, team: false, business: true },
  },
  {
    label: "Access reviews",
    icon: ShieldCheck,
    values: { free: false, team: false, business: true },
  },
  {
    label: "Priority support",
    icon: LifeBuoy,
    values: { free: false, team: false, business: true },
  },
];

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "string") {
    return (
      <Badge variant="secondary" className="drive-pricing-value">
        {value}
      </Badge>
    );
  }
  const Icon = value ? Check : X;
  return (
    <span className={value ? "drive-pricing-included" : "drive-pricing-excluded"}>
      <Icon aria-hidden="true" />
      <span className="sr-only">{value ? "Included" : "Not included"}</span>
    </span>
  );
}

function PlanHeader({
  plan,
  currentPlan,
  onPlanChange,
  mobile = false,
}: {
  plan: DrivePlan;
  currentPlan: DrivePlanId;
  onPlanChange: (plan: DrivePlanId) => void;
  mobile?: boolean;
}) {
  return (
    <FrameHeader className="drive-pricing-plan-header" data-plan={plan.id}>
      {mobile ? (
        <div className="drive-pricing-mobile-title-row">
          <FrameTitle className="drive-pricing-plan-name">{plan.name}</FrameTitle>
          <div className="drive-pricing-mobile-badges">
            {plan.id === "team" && <Badge size="sm">Most popular</Badge>}
            {plan.id === currentPlan && (
              <Badge variant="primary-light" size="sm">
                Current
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <>
          {plan.id === "team" && (
            <Badge className="drive-pricing-popular" size="sm">
              Most popular
            </Badge>
          )}
          <FrameTitle className="drive-pricing-plan-name">{plan.name}</FrameTitle>
        </>
      )}
      <FrameDescription className="drive-pricing-plan-description">
        {descriptions[plan.id]}
      </FrameDescription>
      <p className="drive-pricing-price">
        <strong>${plan.monthlyPrice}</strong>
        <span>{plan.id === "free" ? "Forever" : "/ month"}</span>
      </p>
      {!mobile && (
        <p className="drive-pricing-note">
          {plan.id === "free" ? "No card required" : "Billed monthly"}
        </p>
      )}
      <Button
        className="drive-pricing-action"
        disabled={currentPlan === plan.id}
        onClick={() => onPlanChange(plan.id)}
      >
        {currentPlan === plan.id ? "Current plan" : "Switch"}
      </Button>
      {mobile && (
        <p className="drive-pricing-note">
          {plan.id === "free" ? "No card required" : "Billed monthly"}
        </p>
      )}
    </FrameHeader>
  );
}

/** Controlled, non-charging plan selection; host owns per-workspace SPA state. */
export function DrivePricing({
  currentPlan,
  onPlanChange,
}: {
  currentPlan: DrivePlanId;
  onPlanChange: (plan: DrivePlanId) => void;
}) {
  return (
    <section className="reui-reference drive-pricing" aria-labelledby="drive-plans-title">
      <header className="drive-pricing-heading">
        <h1 id="drive-plans-title">Plans</h1>
        <p>Seats and storage change the moment you switch. Nothing is charged in this template.</p>
      </header>
      <Frame dense className="drive-pricing-desktop">
        <FramePanel className="drive-pricing-matrix-panel">
          <div className="drive-pricing-matrix-scroll">
            <div className="drive-pricing-matrix" role="table" aria-label="Plan comparison">
              <div className="drive-pricing-grid drive-pricing-matrix-header" role="row">
                <div className="drive-pricing-intro" role="columnheader">
                  <h2>What each plan includes</h2>
                  <p>
                    Every tier carries everything the tier before it does, so a row ticked for Team
                    is ticked for Business too.
                  </p>
                </div>
                {drivePlans.map((plan) => (
                  <div role="columnheader" data-plan={plan.id} key={plan.id}>
                    <PlanHeader {...{ plan, currentPlan, onPlanChange }} />
                  </div>
                ))}
              </div>
              {features.map(({ label, icon: Icon, values }) => (
                <div className="drive-pricing-grid drive-pricing-feature" role="row" key={label}>
                  <div className="drive-pricing-feature-label" role="rowheader">
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                  {drivePlans.map((plan) => (
                    <div role="cell" data-plan={plan.id} key={plan.id}>
                      <FeatureValue value={values[plan.id]} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </FramePanel>
      </Frame>
      <div className="drive-pricing-mobile">
        {drivePlans.map((plan) => (
          <Frame
            dense
            className="drive-pricing-card"
            data-plan={plan.id}
            role="region"
            aria-label={`${plan.name} plan`}
            key={plan.id}
          >
            <PlanHeader {...{ plan, currentPlan, onPlanChange }} mobile />
            <FramePanel className="drive-pricing-card-features">
              <dl>
                {features.map(({ label, icon: Icon, values }) => (
                  <div className="drive-pricing-mobile-feature" key={label}>
                    <dt>
                      <Icon aria-hidden="true" />
                      {label}
                    </dt>
                    <dd>
                      <FeatureValue value={values[plan.id]} />
                    </dd>
                  </div>
                ))}
              </dl>
            </FramePanel>
          </Frame>
        ))}
      </div>
    </section>
  );
}
