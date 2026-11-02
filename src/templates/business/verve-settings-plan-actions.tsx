import { useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetClose, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { VerveSettingsSheet } from "./verve-settings-people-billing-surfaces";
import { vervePlanOptions } from "./verve-settings-actions-data";
import { verveMoney } from "./verve-settings-people-billing-data";
import type { VervePeopleBillingModel } from "./verve-settings-people-billing-model";

export function VerveManagePlan({ model }: { model: VervePeopleBillingModel }) {
  const [open, setOpen] = useState(false);
  const action = model.planActions;
  const submit = useRef<HTMLButtonElement | null>(null);
  const cancelling = useRef(false);
  function changeOpen(next: boolean) {
    if (next) action.begin();
    setOpen(next);
  }
  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Manage plan
        </Button>
      </SheetTrigger>
      <VerveSettingsSheet
        title="Manage demo plan"
        description="Change the local plan and seat allowance. No real subscription, renewal or charge is created."
        footer={
          <>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetClose>
            <Button ref={submit} type="submit" form="verve-plan-form">
              {action.status === "Cancelled" ? "Resume demo plan" : "Save demo plan"}
            </Button>
          </>
        }
      >
        <form
          id="verve-plan-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (action.save()) setOpen(false);
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="verve-demo-plan">Plan</FieldLabel>
              <Select
                value={action.draft.selection}
                onValueChange={(value) =>
                  action.update("selection", value as typeof action.draft.selection)
                }
              >
                <SelectTrigger id="verve-demo-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="reui-reference">
                  <SelectGroup>
                    {vervePlanOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                {action.draftOption.name} · {verveMoney(action.draftOption.unitPrice)} per seat per
                month.
              </FieldDescription>
            </Field>
            <Field data-invalid={Boolean(action.error)}>
              <FieldLabel htmlFor="verve-plan-seats-input">Seats</FieldLabel>
              <NumberField
                id="verve-plan-seats"
                value={action.draft.seats}
                onValueChange={(value) => action.update("seats", value)}
                min={1}
                max={1000}
                step={1}
              >
                <NumberFieldGroup>
                  <NumberFieldInput
                    id="verve-plan-seats-input"
                    aria-label="Seats"
                    aria-invalid={Boolean(action.error)}
                    aria-describedby="verve-plan-seat-hint"
                  />
                </NumberFieldGroup>
              </NumberField>
              <FieldDescription id="verve-plan-seat-hint">
                Include at least {model.members.length} current members. The draft does not change
                your saved allowance.
              </FieldDescription>
              {action.error && <FieldError role="alert">{action.error}</FieldError>}
            </Field>
            <p role="status">
              Draft estimate: {verveMoney((action.draft.seats ?? 0) * action.draftOption.unitPrice)}{" "}
              / month.
            </p>
            {action.status !== "Cancelled" && (
              <AlertDialog
                onOpenChange={(next) => {
                  if (next) cancelling.current = false;
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    Cancel demo subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent
                  className="reui-reference"
                  onCloseAutoFocus={(event) => {
                    const target = cancelling.current ? submit.current : null;
                    if (target?.isConnected) {
                      target.focus();
                      if (target.ownerDocument.activeElement === target) event.preventDefault();
                    }
                  }}
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel local demo plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Only this preview changes to Cancelled. Members and saved settings remain
                      available. No real subscription or billing account is affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep plan</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => {
                        cancelling.current = true;
                        action.cancel();
                      }}
                    >
                      Confirm local cancellation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </FieldGroup>
        </form>
      </VerveSettingsSheet>
    </Sheet>
  );
}

export function VerveUsageDetails({ model }: { model: VervePeopleBillingModel }) {
  const plan = model.planActions.plan;
  const metrics = [
    {
      title: "Seats",
      value: model.members.length,
      limit: plan.seats,
      detail: "Current local member records, including pending invitations.",
    },
    {
      title: "Tracked contacts",
      value: plan.contacts,
      limit: plan.contactsLimit,
      detail: "Original demo contact counter; it is not a server usage measurement.",
    },
    {
      title: "Automation credits",
      value: plan.credits,
      limit: plan.creditsLimit,
      detail: "Original demo credit counter; no automation is executed by this panel.",
    },
  ];
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          View usage
        </Button>
      </SheetTrigger>
      <VerveSettingsSheet
        title="Workspace usage"
        description="Local counters and original demo plan limits. Plan changes update allowances; member changes update occupied seats."
        footer={
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </SheetClose>
        }
      >
        <div className="flex flex-col gap-4">
          {metrics.map((metric) => (
            <Frame key={metric.title}>
              <FrameHeader>
                <FrameTitle>{metric.title}</FrameTitle>
              </FrameHeader>
              <FramePanel>
                <p>
                  {metric.value.toLocaleString("en-US")} of {metric.limit.toLocaleString("en-US")}
                </p>
                <Progress
                  aria-label={`${metric.title} usage`}
                  value={Math.min(100, (metric.value / metric.limit) * 100)}
                />
                <p className="mt-2 text-muted-foreground">{metric.detail}</p>
                {metric.value > metric.limit && (
                  <p className="text-destructive">Above this demo plan allowance.</p>
                )}
              </FramePanel>
            </Frame>
          ))}
          <p>
            {plan.name} · {model.planActions.status} · Allocated-seat estimate{" "}
            {verveMoney(model.planActions.monthlyEstimate)} / month.
          </p>
        </div>
      </VerveSettingsSheet>
    </Sheet>
  );
}
