// Actual official free REUI c-toggle-1. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-toggle-1.json
// One controlled Toggle from the free formatting set; label/icon adapted to Compare.
import { GitCompareArrows } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
export function CompareToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Toggle
      variant="outline"
      size="sm"
      aria-label="Compare"
      pressed={value}
      onPressedChange={onChange}
    >
      <GitCompareArrows />
      Compare
    </Toggle>
  );
}
