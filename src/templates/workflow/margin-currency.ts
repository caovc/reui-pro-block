const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatMarginMoney(cents: number) {
  return dollars.format(cents / 100);
}

export function marginInputCents(input: FormDataEntryValue | null) {
  const value = Number(input);
  if (input === null || input === "" || !Number.isFinite(value)) {
    throw new Error("Enter a valid dollar amount.");
  }
  const cents = Math.round(value * 100);
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error("Enter a non-negative amount.");
  return cents;
}
