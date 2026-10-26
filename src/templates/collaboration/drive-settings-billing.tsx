// Actual free ReUI Alert slots and c-checkbox-9 Field-card composition.
// Copyright (c) 2025 Keenthemes Inc, MIT; src/components/reui/REUI-LICENSE.txt.
// https://reui.io/r/radix-nova/c-checkbox-9.json
import { useState } from "react";
import { ArrowDown, ArrowUp, Download, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  SettingsFields,
  SettingsRow,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { DriveApprovers, DriveRichChoice } from "./drive-settings-free";
import { driveDigestOptions } from "./drive-settings-options";
import { driveBillingControlsInitial } from "./drive-settings-data";
import { DriveSettingsCard, DriveSettingsDialog } from "./drive-settings-components";
import { downloadDrivePdf } from "./drive-settings-downloads";
import type { DriveSettingsModel } from "./drive-settings-model";
import { getDrivePlan, type DrivePlan } from "./drive-workspace-model";

const initialApprovals = [
  {
    id: "admin-priya",
    title: "Admin seat for Priya Patel",
    detail:
      "Studio Operations. Invited in April and still holding an Admin seat that nobody confirmed.",
    by: "Mira Stone · Apr 18, 2026",
  },
  {
    id: "annual-24",
    title: "Annual renewal, 24 seats",
    amount: "$1,788",
    detail:
      "Above the approval threshold, so it waits for the billing owner rather than charging the card.",
    by: "Alex Rivera · May 2, 2026",
  },
  {
    id: "restore-elijah",
    title: "Restore Elijah Morgan",
    detail:
      "Suspended in March. Client Delivery asked for the seat back for the Northwind handover.",
    by: "Sana Qureshi · May 11, 2026",
  },
];
const invoices = [
  { id: "BL-2026-04", month: "Apr 2026", issued: "Apr 28, 2026", amount: 149, status: "Paid" },
  { id: "BL-2026-03", month: "Mar 2026", issued: "Mar 28, 2026", amount: 149, status: "Paid" },
  { id: "BL-2026-02", month: "Feb 2026", issued: "Feb 28, 2026", amount: 198, status: "Refunded" },
  { id: "BL-2026-01", month: "Jan 2026", issued: "Jan 28, 2026", amount: 149, status: "Paid" },
  { id: "BL-2025-12", month: "Dec 2025", issued: "Dec 28, 2025", amount: 149, status: "Paid" },
];
export function DriveBillingSettings({
  model,
  pricingHref,
  onPricing,
  currentPlan = getDrivePlan("free"),
}: {
  model: DriveSettingsModel;
  pricingHref: string;
  onPricing: () => void;
  currentPlan?: DrivePlan;
}) {
  const [setup, setSetup] = useState(() => ({
    ...model.billing,
    approverIds: [...model.billing.approverIds],
  }));
  const [controls, setControls] = useState(() => ({ ...driveBillingControlsInitial }));
  const [dismissed, setDismissed] = useState(false);
  const [approvals, setApprovals] = useState(initialApprovals);
  const [dialog, setDialog] = useState<"approvals" | "invoices" | null>(null);
  const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null);
  const [decision, setDecision] = useState("");
  const plan = currentPlan;
  const seats = model.billing.seatSelection ?? plan.seats;
  const open = (kind: "approvals" | "invoices", trigger: HTMLElement) => {
    setReturnFocus(trigger);
    setDialog(kind);
  };
  const pricing = (
    <Button asChild variant="outline">
      <a
        href={pricingHref}
        onClick={(event) => {
          if (
            event.button === 0 &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey
          ) {
            event.preventDefault();
            onPricing();
          }
        }}
      >
        Manage plan
      </a>
    </Button>
  );
  return (
    <>
      {!dismissed && approvals.length > 0 && (
        <Alert variant="warning" className="ds-access-review">
          <ShieldCheck aria-hidden="true" />
          <AlertTitle>Access review</AlertTitle>
          <AlertDescription>
            {approvals.length} requests are waiting on the billing owner.
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" onClick={() => setDismissed(true)}>
              Dismiss
            </Button>
            <Button onClick={(event) => open("approvals", event.currentTarget)}>Review</Button>
          </AlertAction>
        </Alert>
      )}
      <DriveSettingsCard
        title="Billing Setup"
        description="Plan, seats, and invoices."
        footer={
          <>
            {pricing}
            <Button onClick={() => model.saveBilling(setup)}>Save changes</Button>
          </>
        }
      >
        <SettingsRow
          title="Current Plan"
          badge={
            <Badge variant="primary-light" size="sm">
              Current
            </Badge>
          }
          description={`${plan.name}. ${seats} seats.`}
        >
          <div className="ds-plan-price">
            <strong>
              ${plan.monthlyPrice} <span>/ workspace</span>
            </strong>
            <p>Billed monthly</p>
          </div>
        </SettingsRow>
        <SettingsFields
          fields={[
            {
              id: "billingOwner",
              controlId: "drive-billing-owner",
              label: "Billing Owner",
              description: "Primary approver for plan changes.",
              type: "email",
            },
          ]}
          value={{ billingOwner: setup.billingOwner }}
          onValueChange={(id, value) => setSetup((current) => ({ ...current, [id]: value }))}
        />
        <SettingsRow title="Invoice Approvers" description="Users who approve plan changes.">
          <DriveApprovers
            members={model.members}
            value={setup.approverIds}
            onChange={(approverIds) => setSetup((current) => ({ ...current, approverIds }))}
          />
        </SettingsRow>
        <SettingsFields
          fields={[
            {
              id: "invoiceEmail",
              controlId: "drive-billing-email",
              label: "Invoice Email",
              type: "email",
            },
            { id: "costCenter", controlId: "drive-billing-cost-center", label: "Cost Center" },
          ]}
          value={{ invoiceEmail: setup.invoiceEmail, costCenter: setup.costCenter }}
          onValueChange={(id, value) => setSetup((current) => ({ ...current, [id]: value }))}
        />
        <SettingsRow title="Seat Selection" description="Set team capacity.">
          {/* Actual free c-checkbox-9 composition; local floating native indicator. */}
          <FieldGroup className="ds-seat-options">
            {([16, 24, 40] as const).map((seat) => (
              <FieldLabel
                key={seat}
                htmlFor={`drive-billing-seat-${seat}`}
                className="ds-seat-card"
              >
                <Field orientation="horizontal" className="relative h-full w-full">
                  <Checkbox
                    id={`drive-billing-seat-${seat}`}
                    className="absolute -top-2 -right-2 size-5 rounded-full border-none shadow-none"
                    aria-label={`${seat} seats`}
                    checked={setup.seatSelection === seat}
                    onCheckedChange={(checked) =>
                      setSetup((current) => ({ ...current, seatSelection: checked ? seat : null }))
                    }
                  />
                  <FieldContent className="min-w-0 gap-1">
                    <FieldTitle>{seat} seats</FieldTitle>
                    <FieldDescription>
                      {seat === 16
                        ? "Best for your current team size and smooth growth"
                        : seat === 24
                          ? "Gives your team room for future growth"
                          : "Supports the next hiring cycle with 16 open seats"}
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            ))}
          </FieldGroup>
        </SettingsRow>
      </DriveSettingsCard>
      <DriveSettingsCard
        title="Billing Controls"
        description="Approval and renewal rules."
        footer={
          <>
            <Button variant="outline" onClick={(event) => open("approvals", event.currentTarget)}>
              Review approvals{" "}
              <Badge variant="secondary" size="sm">
                {approvals.length}
              </Badge>
            </Button>
            <Button asChild variant="outline">
              <a
                href={pricingHref}
                onClick={(event) => {
                  if (
                    event.button === 0 &&
                    !event.metaKey &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey
                  ) {
                    event.preventDefault();
                    onPricing();
                  }
                }}
              >
                Review plans
              </a>
            </Button>
          </>
        }
      >
        <SettingsRow
          id="drive-billing-auto-seats"
          title="Auto-Add Seats"
          description="Add seats when invites exceed your cap."
        >
          <Switch
            id="drive-billing-auto-seats"
            checked={controls.autoAddSeats}
            onCheckedChange={(autoAddSeats) =>
              setControls((current) => ({ ...current, autoAddSeats }))
            }
          />
        </SettingsRow>
        <SettingsRow
          id="drive-billing-po"
          title="Purchase Order Required"
          description="Hold invoice changes until a PO is present."
        >
          <Switch
            id="drive-billing-po"
            checked={controls.purchaseOrderRequired}
            onCheckedChange={(purchaseOrderRequired) =>
              setControls((current) => ({ ...current, purchaseOrderRequired }))
            }
          />
        </SettingsRow>
        <SettingsRow
          id="drive-billing-threshold"
          title="Approval Threshold"
          description="Invoices above this need approval."
        >
          <InputGroup>
            <InputGroupAddon>$</InputGroupAddon>
            <InputGroupInput
              id="drive-billing-threshold"
              inputMode="decimal"
              value={controls.approvalThreshold}
              onChange={(event) =>
                setControls((current) => ({ ...current, approvalThreshold: event.target.value }))
              }
            />
            <InputGroupAddon align="inline-end">USD</InputGroupAddon>
          </InputGroup>
        </SettingsRow>
        <SettingsRow id="drive-billing-reminders" title="Invoice Reminders">
          <DriveRichChoice
            id="drive-billing-reminders"
            value={controls.reminders}
            options={driveDigestOptions}
            onChange={(reminders) => setControls((current) => ({ ...current, reminders }))}
          />
        </SettingsRow>
      </DriveSettingsCard>
      <DriveSettingsCard
        title="Billing Summary"
        description="Plan, seats, and invoice."
        className="ds-summary-card"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() =>
                downloadDrivePdf("statement.pdf", [
                  "BRICKLANE DRIVE - LOCAL PREVIEW STATEMENT",
                  "No payment, approval, or invoice was issued.",
                  `Workspace: ${model.workspace.workspaceName}`,
                  `Plan: ${plan.name} - $${plan.monthlyPrice} monthly`,
                  `Seat capacity: ${seats}`,
                  "Seat usage: 12",
                  `Billing owner: ${model.billing.billingOwner}`,
                  `Invoice email: ${model.billing.invoiceEmail}`,
                  `Cost center: ${model.billing.costCenter}`,
                  "Next example invoice: May 28, 2026",
                  `Amount: USD ${plan.monthlyPrice.toFixed(2)}`,
                ])
              }
            >
              Download statement
            </Button>
            <Button variant="outline" onClick={(event) => open("invoices", event.currentTarget)}>
              Review invoices
            </Button>
          </>
        }
      >
        <div className="ds-summary-grid">
          <section>
            <p className="ds-summary-label">Monthly spend</p>
            <p className="ds-summary-meta">{plan.name} plan</p>
            <p className="ds-summary-value">
              ${plan.monthlyPrice}{" "}
              <Badge variant="success-light" size="sm">
                Current
              </Badge>
            </p>
            <p className="ds-summary-description">
              Base workspace plan before seat growth or annual billing changes.
            </p>
          </section>
          <section>
            <p className="ds-summary-label">Seat usage</p>
            <p className="ds-summary-meta">12 of {seats} seats</p>
            <p className="ds-summary-value">
              12{" "}
              <Badge variant={seats < 12 ? "warning-light" : "secondary"} size="sm">
                {seats < 12 ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}
                {seats < 12 ? `${12 - seats} over` : `${seats - 12} open`}
              </Badge>
            </p>
            <p className="ds-summary-description">
              {seats < 12
                ? `${12 - seats} more people than this plan seats. Add seats or move up a tier.`
                : `${seats - 12} of ${seats} seats are still unassigned.`}
            </p>
          </section>
          <section>
            <p className="ds-summary-label">Next invoice</p>
            <p className="ds-summary-meta">May 28, 2026</p>
            <p className="ds-summary-value">
              ${plan.monthlyPrice}{" "}
              <Badge variant="warning-light" size="sm">
                PO ready
              </Badge>
            </p>
            <p className="ds-summary-description">
              Approvers, reminders, and the PO rule are already attached.
            </p>
          </section>
        </div>
      </DriveSettingsCard>
      {dialog === "approvals" && (
        <DriveSettingsDialog
          title="Approvals"
          description={`${approvals.length} waiting on the billing owner.`}
          onClose={() => setDialog(null)}
          returnFocus={returnFocus}
        >
          <p className="ds-muted">
            Local preview only. These decisions do not change real seats or charge a card.
          </p>
          {approvals.map((approval) => (
            <article className="ds-approval" key={approval.id}>
              <strong>{approval.title}</strong>
              {"amount" in approval && <Badge variant="outline">{approval.amount}</Badge>}
              <p>{approval.detail}</p>
              <p className="ds-muted">{approval.by}</p>
              <div>
                {["Deny", "Approve"].map((label) => (
                  <Button
                    key={label}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setApprovals((current) =>
                        current.filter((entry) => entry.id !== approval.id),
                      );
                      setDecision(
                        `${approval.title}: ${label.toLowerCase()} recorded in the local preview.`,
                      );
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </article>
          ))}
          <p role="status">{decision}</p>
        </DriveSettingsDialog>
      )}
      {dialog === "invoices" && (
        <DriveSettingsDialog
          title="Invoices"
          description="Statements for this workspace, newest first."
          onClose={() => setDialog(null)}
          returnFocus={returnFocus}
        >
          {invoices.map((invoice) => (
            <article className="ds-invoice" key={invoice.id}>
              <div>
                <strong>{invoice.id}</strong>
                <Badge
                  variant={invoice.status === "Paid" ? "success-light" : "secondary"}
                  size="sm"
                >
                  {invoice.status}
                </Badge>
                <p className="ds-muted">
                  {invoice.month} · issued {invoice.issued}
                </p>
              </div>
              <strong>${invoice.amount}</strong>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Download invoice ${invoice.id}`}
                onClick={() =>
                  downloadDrivePdf(`${invoice.id}.pdf`, [
                    "BRICKLANE DRIVE - LOCAL EXAMPLE INVOICE",
                    "Not a payment receipt or a real invoice.",
                    invoice.id,
                    `Issued: ${invoice.issued}`,
                    `Amount: USD ${invoice.amount}`,
                    `Example status: ${invoice.status}`,
                    `Workspace: ${model.workspace.workspaceName}`,
                  ])
                }
              >
                <Download />
              </Button>
            </article>
          ))}
        </DriveSettingsDialog>
      )}
    </>
  );
}
