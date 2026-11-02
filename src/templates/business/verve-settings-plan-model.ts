import { useState } from "react";
import { verveBillingPlan } from "./verve-settings-people-billing-data";
import { vervePlanOptions, type VervePlanId } from "./verve-settings-actions-data";

export function useVervePlanModel(memberCount: number) {
  const [selection, setSelection] = useState<VervePlanId>("growth");
  const [seats, setSeats] = useState<number>(verveBillingPlan.seats);
  const [status, setStatus] = useState<"Trial" | "Active" | "Cancelled">("Trial");
  const [draft, setDraft] = useState<{ selection: VervePlanId; seats: number | null }>({
    selection: "growth",
    seats: verveBillingPlan.seats,
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const option = vervePlanOptions.find((item) => item.id === selection)!;
  const plan = { ...verveBillingPlan, ...option, seats };
  const draftOption = vervePlanOptions.find((item) => item.id === draft.selection)!;
  function begin() {
    setDraft({ selection, seats });
    setError("");
  }
  function update<K extends keyof typeof draft>(field: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setError("");
  }
  function save() {
    if (
      draft.seats === null ||
      !Number.isInteger(draft.seats) ||
      draft.seats < memberCount ||
      draft.seats < 1 ||
      draft.seats > 1000
    ) {
      setError(`Choose 1 to 1000 seats, including at least ${memberCount} current members.`);
      return false;
    }
    if (!vervePlanOptions.some((item) => item.id === draft.selection)) {
      setError("Choose a valid demo plan.");
      return false;
    }
    setSelection(draft.selection);
    setSeats(draft.seats);
    setStatus("Active");
    setNotice(
      `${draftOption.name} saved with ${draft.seats} seats in this preview. No subscription or payment was changed.`,
    );
    return true;
  }
  function cancel() {
    setStatus("Cancelled");
    setNotice("The local demo plan is cancelled. No real subscription or payment was changed.");
  }
  return {
    plan,
    status,
    draft,
    draftOption,
    error,
    notice,
    begin,
    update,
    save,
    cancel,
    monthlyEstimate: seats * option.unitPrice,
  };
}
export type VervePlanModel = ReturnType<typeof useVervePlanModel>;
