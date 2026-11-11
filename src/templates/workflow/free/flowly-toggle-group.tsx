// ReUI free c-toggle-group-5 uses the shadcn Toggle Group in both libraries.
// https://reui.io/r/{style}/c-toggle-group-5.json
// MIT: Copyright (c) 2023 shadcn and (c) 2025 Keenthemes Inc.
// The full notices are included in project exports.
"use client";

import type { ComponentProps } from "react";
import { ToggleGroup as SharedToggleGroup } from "@/components/ui/toggle-group";

type SharedProps = Extract<ComponentProps<typeof SharedToggleGroup>, { type: "multiple" }>;
type ToggleGroupProps = Omit<SharedProps, "type" | "defaultValue" | "value" | "onValueChange"> & {
  value: string[];
  onValueChange: (value: string[]) => void;
};

function ToggleGroup({ value, onValueChange, ...props }: ToggleGroupProps) {
  return (
    <SharedToggleGroup
      role="group"
      {...props}
      type="multiple"
      value={value}
      // Both libraries expose pressed buttons in this mode. Flowly and Roster
      // control the selection and keep their current choice if it is pressed again.
      onValueChange={(next) => onValueChange(next.slice(-1))}
    />
  );
}

export { ToggleGroup };
export { ToggleGroupItem } from "@/components/ui/toggle-group";
