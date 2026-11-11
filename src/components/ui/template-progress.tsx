// ReUI free radix-nova/c-progress-2 uses shadcn's Radix Progress dependency.
// https://reui.io/r/radix-nova/c-progress-2.json
// https://ui.shadcn.com/r/styles/radix-nova/progress.json
// MIT (c) 2023 shadcn; full notice is included in project exports.
"use client";

import type { ComponentProps } from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function Progress({
  children,
  className,
  value,
  max = 100,
  ...props
}: ComponentProps<typeof ProgressPrimitive.Root>) {
  const total = max > 0 ? max : 100;
  const percent =
    typeof value === "number" && value >= 0 && value <= total ? (value / total) * 100 : 0;

  return (
    <ProgressPrimitive.Root
      value={value}
      max={max}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      {/* Keep the template track slot and the indicator's visible width on Radix. */}
      <div
        data-slot="progress-track"
        className="relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted"
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="h-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
