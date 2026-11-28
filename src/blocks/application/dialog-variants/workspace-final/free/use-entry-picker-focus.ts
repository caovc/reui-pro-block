import { useRef, type ComponentProps } from "react";
import type { Combobox } from "@/components/ui/combobox";

type OpenChange = NonNullable<ComponentProps<typeof Combobox>["onOpenChange"]>;

export function useEntryPickerFocus({ restoreOnSelection = false } = {}) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const onOpenChange: OpenChange = (open, { reason }) => {
    const shouldRestore =
      reason === "escape-key" || (restoreOnSelection && reason === "item-press");
    if (!open && shouldRestore && triggerRef.current?.isConnected) {
      // Keep focus inside the parent dialog as its nested popup unmounts.
      triggerRef.current.focus({ preventScroll: true });
    }
  };

  return { triggerRef, onOpenChange };
}
