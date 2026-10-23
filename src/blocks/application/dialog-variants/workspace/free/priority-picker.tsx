// Actual official free REUI c-combobox-22. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-combobox-22.json
// Adapters: controlled form value/id, Lucide icon adapter; original picker/glyph behavior retained.
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Field } from "@/components/ui/field";
import { MoreHorizontalIcon, TriangleAlertIcon } from "lucide-react";

const priorityOptions = [
  { value: "none", label: "No Priority", tone: "none" },
  { value: "low", label: "Low", tone: "low" },
  { value: "medium", label: "Medium", tone: "medium" },
  { value: "high", label: "High", tone: "high" },
  { value: "urgent", label: "Urgent", tone: "urgent" },
] as const;

type PriorityOption = (typeof priorityOptions)[number];

function LowPriorityIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className={cn("size-4 shrink-0", className)}
    >
      <rect x="3" y="9" width="2.5" height="4" rx="1" fill="currentColor" />
      <rect x="7" y="6" width="2.5" height="7" rx="1" fill="currentColor" opacity="0.28" />
      <rect x="11" y="3" width="2.5" height="10" rx="1" fill="currentColor" opacity="0.28" />
    </svg>
  );
}

function MediumPriorityIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className={cn("size-4 shrink-0", className)}
    >
      <rect x="3" y="9" width="2.5" height="4" rx="1" fill="currentColor" />
      <rect x="7" y="6" width="2.5" height="7" rx="1" fill="currentColor" />
      <rect x="11" y="3" width="2.5" height="10" rx="1" fill="currentColor" opacity="0.28" />
    </svg>
  );
}

function HighPriorityIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className={cn("size-4 shrink-0", className)}
    >
      <rect x="3" y="9" width="2.5" height="4" rx="1" fill="currentColor" />
      <rect x="7" y="6" width="2.5" height="7" rx="1" fill="currentColor" />
      <rect x="11" y="3" width="2.5" height="10" rx="1" fill="currentColor" />
    </svg>
  );
}

function PriorityGlyph({ tone, className }: { tone: PriorityOption["tone"]; className?: string }) {
  switch (tone) {
    case "none":
      return (
        <MoreHorizontalIcon
          className={cn(
            "text-muted-foreground! [&_*]:text-muted-foreground! size-4 shrink-0",
            className,
          )}
        />
      );
    case "low":
      return (
        <LowPriorityIcon className={cn("text-foreground! [&_*]:text-foreground!", className)} />
      );
    case "medium":
      return (
        <MediumPriorityIcon className={cn("text-foreground! [&_*]:text-foreground!", className)} />
      );
    case "high":
      return (
        <HighPriorityIcon className={cn("text-foreground! [&_*]:text-foreground!", className)} />
      );
    case "urgent":
      return (
        <TriangleAlertIcon
          className={cn("size-4 shrink-0 text-yellow-500! [&_*]:text-yellow-500!", className)}
        />
      );
  }
}

function PriorityLabel({ priority, className }: { priority: PriorityOption; className?: string }) {
  const labelClassName = priority.tone === "urgent" ? "text-yellow-500!" : "text-foreground!";

  return (
    <span
      className={cn(
        "text-foreground! flex min-w-0 items-center gap-2",
        priority.tone === "urgent" && "text-yellow-500!",
        className,
      )}
    >
      <PriorityGlyph tone={priority.tone} />
      <span className={cn("truncate", labelClassName)}>{priority.label}</span>
    </span>
  );
}

export function ProjectPriorityPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const priority = priorityOptions.find((item) => item.value === value) ?? priorityOptions[0];

  return (
    <Field className="min-w-0">
      <Combobox
        items={priorityOptions}
        value={priority}
        onValueChange={(item) => item && onChange(item.value)}
        itemToStringValue={(item: PriorityOption) => item.label}
        autoHighlight
      >
        <ComboboxTrigger
          id={id}
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
            />
          }
        >
          <ComboboxValue placeholder="Set priority">
            {(selectedPriority: PriorityOption | null) =>
              selectedPriority ? (
                <PriorityLabel priority={selectedPriority} />
              ) : (
                <span className="text-muted-foreground">Set priority</span>
              )
            }
          </ComboboxValue>
        </ComboboxTrigger>

        <ComboboxContent className="max-w-(--anchor-width) min-w-(--anchor-width)">
          <ComboboxInput showTrigger={false} placeholder="Change priority" className="mb-1" />
          <ComboboxEmpty>No priorities found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.value} value={item}>
                <PriorityLabel priority={item} />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
