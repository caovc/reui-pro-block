/** Original local billing fixtures. Prices and saved methods never reach a payment service. */
export const commercePlans = [
  { id: "starter", name: "Starter", price: 29, orders: 500, seats: 3, storage: 2 },
  { id: "growth", name: "Growth", price: 59, orders: 2000, seats: 10, storage: 10 },
  { id: "scale", name: "Scale", price: 129, orders: 10000, seats: 30, storage: 50 },
] as const;
export type CommercePlanId = (typeof commercePlans)[number]["id"];
export const commerceDemoPaymentMethods = [
  { id: "visa-4242", name: "Visa ending 4242", expiry: "10 / 2028" },
  { id: "mastercard-4444", name: "Mastercard ending 4444", expiry: "12 / 2029" },
  { id: "amex-0005", name: "American Express ending 0005", expiry: "08 / 2029" },
] as const;
export type CommercePaymentDraft = {
  methodId: string;
  name: string;
  email: string;
};
export const commerceCancellationReasons = [
  "Store is on pause",
  "Budget changed",
  "Trying another plan",
  "Other",
] as const;
export const commerceAdditionalProviders = [
  {
    id: "adyen",
    name: "Adyen",
    description: "Local sample provider for card and wallet checkout.",
  },
  {
    id: "mollie",
    name: "Mollie",
    description: "Local sample provider for European payment methods.",
  },
  {
    id: "square",
    name: "Square",
    description: "Local sample provider for online and in-person sales.",
  },
] as const;
export function createCommercePaymentMethod(): CommercePaymentDraft {
  return { methodId: "visa-4242", name: "Bricklane Store", email: "billing@bricklane.example" };
}
export function validateCommercePaymentMethod(draft: CommercePaymentDraft) {
  const errors: Partial<Record<keyof CommercePaymentDraft, string>> = {};
  if (!commerceDemoPaymentMethods.some((entry) => entry.id === draft.methodId)) {
    errors.methodId = "Choose one of the demo payment methods.";
  }
  if (draft.name.trim().length < 2 || draft.name.trim().length > 80) {
    errors.name = "Enter a billing name between 2 and 80 characters.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
    errors.email = "Enter a valid billing email.";
  }
  return errors;
}
