export type LegacyAutoFocusHandler = (event: Event) => void;

/** Bridges Radix-style focus callbacks to Base UI's focus-target callbacks. */
export function toBaseInitialFocus(handler?: LegacyAutoFocusHandler) {
  if (!handler) return undefined;
  return () => {
    const event = new Event("focus", { cancelable: true });
    handler(event);
    return event.defaultPrevented ? false : undefined;
  };
}

export function toBaseFinalFocus(handler?: LegacyAutoFocusHandler) {
  if (!handler) return undefined;
  return () => {
    const event = new Event("focus", { cancelable: true });
    handler(event);
    return event.defaultPrevented ? false : undefined;
  };
}
