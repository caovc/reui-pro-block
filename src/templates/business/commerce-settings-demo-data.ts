import type { CommerceDemoDataAction } from "./commerce-settings-general-data";

/** One demo collection at a time: loading must preserve every nonempty collection. */
export function applyCommerceDemoData<T>(
  action: CommerceDemoDataAction,
  current: T[],
  defaults: readonly T[],
): T[] {
  if (action === "clear") return [];
  if (action === "load" && current.length) return current;
  return structuredClone([...defaults]);
}
