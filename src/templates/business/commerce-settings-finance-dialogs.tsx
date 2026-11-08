import { useId, useState } from "react";
import { DialogSurface } from "@/blocks/application/dialog-variants/first-run/free/dialog-surface";
import { SettingsChoice } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  commerceCancellationReasons,
  commerceDemoPaymentMethods,
  commercePlans,
  type CommercePaymentDraft,
} from "./commerce-settings-finance-data";
import type { CommerceSettingsModel } from "./commerce-settings-model";
import "@/blocks/application/dialog-variants/first-run/first-run.css";

export function CommercePlanDialog({ model }: { model: CommerceSettingsModel }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string>(model.plan.id);
  const [error, setError] = useState("");
  const formId = useId();
  const fieldId = useId();
  const selected = commercePlans.find((entry) => entry.id === draft) ?? model.plan;
  function reset() {
    setDraft(model.plan.id);
    setError("");
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) reset();
        setOpen(value);
      }}
    >
      <DialogTrigger render={<Button />}>Change plan</DialogTrigger>
      <DialogSurface
        id={301}
        title="Change demo plan"
        description="Choose a plan for this local demo."
        footer={
          <>
            <Button variant="outline" onClick={reset}>
              Reset
            </Button>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" form={formId}>
              Save plan
            </Button>
          </>
        }
      >
        <form
          id={formId}
          onSubmit={(event) => {
            event.preventDefault();
            const message = model.savePlan(draft);
            setError(message ?? "");
            if (!message) setOpen(false);
          }}
        >
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor={fieldId}>Demo plan</FieldLabel>
              <SettingsChoice
                id={fieldId}
                value={selected.name}
                options={commercePlans.map((plan) => plan.name)}
                onChange={(name) => {
                  const plan = commercePlans.find((entry) => entry.name === name);
                  if (plan) setDraft(plan.id);
                  setError("");
                }}
                describedBy={`${fieldId}-detail${error ? ` ${fieldId}-error` : ""}`}
                invalid={Boolean(error)}
              />
              <FieldDescription id={`${fieldId}-detail`}>
                ${selected.price} / month · {selected.orders.toLocaleString("en-US")} orders ·{" "}
                {selected.seats} staff seats · {selected.storage} GB media
              </FieldDescription>
              {error && <FieldError id={`${fieldId}-error`}>{error}</FieldError>}
            </Field>
          </FieldGroup>
        </form>
      </DialogSurface>
    </Dialog>
  );
}

export function CommerceCancellationDialog({ model }: { model: CommerceSettingsModel }) {
  const [open, setOpen] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [reason, setReason] = useState<string>(commerceCancellationReasons[0]);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const reasonId = useId();
  const confirmId = useId();
  const cancelled = model.cancellationReason !== null;
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) {
          setResuming(cancelled);
          setReason(commerceCancellationReasons[0]);
          setConfirmed(false);
          setError("");
        }
        setOpen(value);
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        {cancelled ? "Resume plan" : "Cancel plan"}
      </DialogTrigger>
      <DialogSurface
        id={302}
        title={resuming ? "Resume demo plan" : "Cancel demo plan"}
        description={
          resuming
            ? "Restore the active local plan status. No subscription will be charged."
            : "Schedule a local cancellation at the end of the sample billing period, Nov 1, 2026. No real subscription or access changes."
        }
        footer={
          <>
            <DialogClose render={<Button variant="outline" />}>Keep current plan</DialogClose>
            <Button
              variant={resuming ? "default" : "destructive"}
              disabled={!open || (!resuming && !confirmed)}
              onClick={() => {
                if (!open) return;
                if (resuming) {
                  model.resumePlan();
                  setOpen(false);
                  return;
                }
                const message = model.cancelPlan(reason, confirmed);
                setError(message ?? "");
                if (!message) setOpen(false);
              }}
            >
              {resuming ? "Resume plan" : "Confirm cancellation"}
            </Button>
          </>
        }
      >
        {resuming ? (
          <p className="text-sm">
            {model.plan.name} will renew at ${model.plan.price} / month in this local preview.
          </p>
        ) : (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={reasonId}>Cancellation reason</FieldLabel>
              <SettingsChoice
                id={reasonId}
                value={reason}
                options={commerceCancellationReasons}
                onChange={setReason}
              />
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id={confirmId}
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(value === true)}
              />
              <FieldLabel htmlFor={confirmId}>
                Schedule this cancellation in the local preview
              </FieldLabel>
            </Field>
            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        )}
      </DialogSurface>
    </Dialog>
  );
}

export function CommercePaymentMethodDialog({ model }: { model: CommerceSettingsModel }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CommercePaymentDraft>({ ...model.paymentMethod });
  const [errors, setErrors] = useState<Partial<Record<keyof CommercePaymentDraft, string>>>({});
  const formId = useId();
  const id = useId();
  function reset() {
    setDraft({ ...model.paymentMethod });
    setErrors({});
  }
  function change(key: keyof CommercePaymentDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }
  const selected =
    commerceDemoPaymentMethods.find((entry) => entry.id === draft.methodId) ??
    commerceDemoPaymentMethods[0];
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) reset();
        setOpen(value);
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Update</DialogTrigger>
      <DialogSurface
        id={303}
        title="Update demo payment method"
        description="Choose a saved payment method for this local demo."
        footer={
          <>
            <Button variant="outline" onClick={reset}>
              Reset
            </Button>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" form={formId}>
              Save payment method
            </Button>
          </>
        }
      >
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const next = model.savePaymentMethod(draft);
            setErrors(next);
            if (!Object.keys(next).length) setOpen(false);
          }}
        >
          <FieldGroup>
            <Field data-invalid={Boolean(errors.methodId)}>
              <FieldLabel htmlFor={`${id}-method`}>Demo payment method</FieldLabel>
              <SettingsChoice
                id={`${id}-method`}
                value={selected.name}
                options={commerceDemoPaymentMethods.map((entry) => entry.name)}
                onChange={(name) => {
                  const method = commerceDemoPaymentMethods.find((entry) => entry.name === name);
                  if (method) change("methodId", method.id);
                }}
                describedBy={`${id}-expiry${errors.methodId ? ` ${id}-method-error` : ""}`}
                invalid={Boolean(errors.methodId)}
              />
              <FieldDescription id={`${id}-expiry`}>Expires {selected.expiry}</FieldDescription>
              {errors.methodId && (
                <FieldError id={`${id}-method-error`}>{errors.methodId}</FieldError>
              )}
            </Field>
            {(
              [
                ["name", "Billing name"],
                ["email", "Billing email"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} data-invalid={Boolean(errors[key])}>
                <FieldLabel htmlFor={`${id}-${key}`}>{label}</FieldLabel>
                <Input
                  id={`${id}-${key}`}
                  type={key === "email" ? "email" : "text"}
                  autoComplete="off"
                  maxLength={key === "name" ? 80 : 160}
                  value={draft[key]}
                  onChange={(event) => change(key, event.target.value)}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? `${id}-${key}-error` : undefined}
                />
                {errors[key] && <FieldError id={`${id}-${key}-error`}>{errors[key]}</FieldError>}
              </Field>
            ))}
          </FieldGroup>
        </form>
      </DialogSurface>
    </Dialog>
  );
}
