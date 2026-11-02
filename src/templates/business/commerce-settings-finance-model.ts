import { useState } from "react";
import {
  commerceCancellationReasons,
  commercePlans,
  createCommercePaymentMethod,
  validateCommercePaymentMethod,
  type CommercePaymentDraft,
  type CommercePlanId,
} from "./commerce-settings-finance-data";

/** Parent-mounted local demonstration state. No card number, CVC, gateway or subscription API. */
export function useCommerceFinanceModel(announce: (message: string) => void) {
  const [planId, setPlanId] = useState<CommercePlanId>("growth");
  const [cancellationReason, setCancellationReason] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState(createCommercePaymentMethod);
  const plan = commercePlans.find((entry) => entry.id === planId) ?? commercePlans[1];

  function savePlan(nextId: string): string | null {
    const next = commercePlans.find((entry) => entry.id === nextId);
    if (!next) return "Choose a demo plan.";
    setPlanId(next.id);
    announce(`${next.name} selected for this local preview. No subscription was changed.`);
    return null;
  }
  function cancelPlan(reason: string, confirmed: boolean): string | null {
    if (!commerceCancellationReasons.some((entry) => entry === reason)) {
      return "Choose a cancellation reason.";
    }
    if (!confirmed) return "Confirm the local cancellation to continue.";
    setCancellationReason(reason);
    announce("Cancellation scheduled in this local preview. No subscription was cancelled.");
    return null;
  }
  function resumePlan() {
    setCancellationReason(null);
    announce("Plan resumed in this local preview. No subscription was changed.");
  }
  function savePaymentMethod(draft: CommercePaymentDraft) {
    const errors = validateCommercePaymentMethod(draft);
    if (Object.keys(errors).length) return errors;
    setPaymentMethod({
      methodId: draft.methodId,
      name: draft.name.trim(),
      email: draft.email.trim().toLowerCase(),
    });
    announce("Payment method saved in this demo.");
    return errors;
  }
  return {
    plan,
    cancellationReason,
    paymentMethod,
    savePlan,
    cancelPlan,
    resumePlan,
    savePaymentMethod,
  };
}
