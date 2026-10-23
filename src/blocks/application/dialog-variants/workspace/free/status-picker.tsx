// Actual official free REUI c-combobox-21. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-combobox-21.json
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
import {
  CircleCheckIcon,
  CircleDotIcon,
  CircleIcon,
  CircleXIcon,
  PauseCircleIcon,
} from "lucide-react";

const statusOptions = [
  { value: "backlog", label: "Backlog", tone: "backlog" },
  { value: "planned", label: "Planned", tone: "planned" },
  { value: "in-progress", label: "In Progress", tone: "inProgress" },
  { value: "paused", label: "Paused", tone: "paused" },
  { value: "completed", label: "Completed", tone: "completed" },
  { value: "cancelled", label: "Cancelled", tone: "cancelled" },
] as const;

type StatusOption = (typeof statusOptions)[number];

function StatusGlyph({ tone, className }: { tone: StatusOption["tone"]; className?: string }) {
  switch (tone) {
    case "backlog":
      return (
        <CircleDotIcon
          className={cn(
            "text-muted-foreground/70! **:text-muted-foreground/70! size-4 shrink-0",
            className,
          )}
        />
      );
    case "planned":
      return (
        <CircleIcon
          className={cn("text-foreground/70! [&_*]:text-foreground/70! size-4 shrink-0", className)}
        />
      );
    case "inProgress":
      return (
        <CircleDotIcon
          className={cn("size-4 shrink-0 text-sky-500! [&_*]:text-sky-500!", className)}
        />
      );
    case "paused":
      return (
        <PauseCircleIcon
          className={cn("size-4 shrink-0 text-amber-500! [&_*]:text-amber-500!", className)}
        />
      );
    case "completed":
      return (
        <CircleCheckIcon
          className={cn("size-4 shrink-0 text-emerald-500! [&_*]:text-emerald-500!", className)}
        />
      );
    case "cancelled":
      return (
        <CircleXIcon
          className={cn(
            "text-muted-foreground! [&_*]:text-muted-foreground! size-4 shrink-0",
            className,
          )}
        />
      );
  }
}

function StatusLabel({ status, className }: { status: StatusOption; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <StatusGlyph tone={status.tone} />
      <span className="truncate">{status.label}</span>
    </span>
  );
}

export function ProjectStatusPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const status = statusOptions.find((item) => item.value === value) ?? statusOptions[0];

  return (
    <Field className="min-w-0">
      <Combobox
        items={statusOptions}
        value={status}
        onValueChange={(item) => item && onChange(item.value)}
        itemToStringValue={(item: StatusOption) => item.label}
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
          <ComboboxValue placeholder="Set status">
            {(selectedStatus: StatusOption | null) =>
              selectedStatus ? (
                <StatusLabel status={selectedStatus} />
              ) : (
                <span className="text-muted-foreground">Set status</span>
              )
            }
          </ComboboxValue>
        </ComboboxTrigger>

        <ComboboxContent className="max-w-(--anchor-width) min-w-(--anchor-width)">
          <ComboboxInput showTrigger={false} placeholder="Change status" className="mb-1" />
          <ComboboxEmpty>No statuses found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.value} value={item}>
                <StatusLabel status={item} />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
