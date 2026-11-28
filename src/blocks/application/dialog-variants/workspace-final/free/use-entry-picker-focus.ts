import { useRef, type ComponentProps } from "react";
import type { Combobox, ComboboxTrigger } from "@/components/ui/combobox";

type OpenChange = NonNullable<ComponentProps<typeof Combobox>["onOpenChange"]>;
type TriggerKeyDown = NonNullable<ComponentProps<typeof ComboboxTrigger>["onKeyDown"]>;

export function useEntryPickerFocus({ restoreOnSelection = false } = {}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const actionsRef =
    useRef<NonNullable<ComponentProps<typeof Combobox>["actionsRef"]>["current"]>(null);

  const onTriggerKeyDown: TriggerKeyDown = (event) => {
    if (
      event.key === "Escape" &&
      !event.nativeEvent.isComposing &&
      event.currentTarget.getAttribute("aria-expanded") === "true"
    ) {
      // Escape can arrive before the popup moves focus into its input or list.
      event.preventDefault();
      event.stopPropagation();
      actionsRef.current?.close();
    }
  };

  const onOpenChange: OpenChange = (open, { reason }) => {
    const shouldRestore =
      reason === "escape-key" || (restoreOnSelection && reason === "item-press");
    if (!open && shouldRestore && triggerRef.current?.isConnected) {
      // Keep focus inside the parent dialog as its nested popup unmounts.
      triggerRef.current.focus({ preventScroll: true });
    }
  };

  return { triggerRef, actionsRef, onTriggerKeyDown, onOpenChange };
}
