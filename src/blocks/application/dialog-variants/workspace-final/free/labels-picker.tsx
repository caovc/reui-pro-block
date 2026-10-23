// Actual official free REUI c-combobox-26. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-combobox-26.json
// Adapters: controlled form value/id, Lucide icon adapter; original picker/glyph behavior retained.
// Function-child list follows free Combobox guidance for actual typed filtering.
"use client";
import type { ComponentProps } from "react";

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
import { TagIcon } from "lucide-react";

type EmptyLabelOption = {
  type: "none";
  id: "no-label";
  label: string;
  searchText: string;
};

type LabelOption = {
  type: "label";
  id: string;
  portalContainer?: ComponentProps<typeof ComboboxContent>["portalContainer"];
  value: string;
  label: string;
  colorClassName: string;
  searchText: string;
};

type LabelSelectionItem = EmptyLabelOption | LabelOption;

const noLabelOption: EmptyLabelOption = {
  type: "none",
  id: "no-label",
  label: "No label",
  searchText: "No label clear labels remove labels empty",
};

const labelOptions: LabelOption[] = [
  {
    type: "label",
    id: "billing",
    value: "billing",
    label: "Billing",
    colorClassName: "bg-sky-500",
    searchText: "Billing product enhancement capability",
  },
  {
    type: "label",
    id: "beta",
    value: "beta",
    label: "Beta",
    colorClassName: "bg-rose-500",
    searchText: "Beta issue defect problem",
  },
  {
    type: "label",
    id: "support",
    value: "support",
    label: "Support",
    colorClassName: "bg-emerald-500",
    searchText: "Support refinement polish optimization",
  },
  {
    type: "label",
    id: "risk",
    value: "risk",
    label: "Risk",
    colorClassName: "bg-violet-500",
    searchText: "Risk ui ux creative visual",
  },
] as const;

const labelSelectionOptions: LabelSelectionItem[] = [noLabelOption, ...labelOptions];

function TagGlyph({ className }: { className?: string }) {
  return <TagIcon className={cn("size-4 shrink-0", className)} />;
}

function LabelDot({ option }: { option: LabelOption }) {
  return (
    <span
      aria-hidden="true"
      className={cn("size-3 shrink-0 rounded-full", option.colorClassName)}
    />
  );
}

function LabelTriggerSummary({
  selectedLabels,
  placeholder,
}: {
  selectedLabels: LabelOption[];
  placeholder: string;
}) {
  if (!selectedLabels.length) {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <TagGlyph className="text-muted-foreground" />
        <span className="text-muted-foreground truncate">{placeholder}</span>
      </span>
    );
  }

  const visibleLabels = selectedLabels.slice(0, 3);
  const hiddenLabelCount = selectedLabels.length - visibleLabels.length;
  const selectedLabelText = selectedLabels.map((label) => label.label).join(", ");

  if (selectedLabels.length === 1) {
    const [label] = selectedLabels;

    return (
      <span className="flex min-w-0 items-center gap-2">
        <LabelDot option={label} />
        <span className="truncate">{label.label}</span>
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="sr-only">Selected labels: {selectedLabelText}</span>
      {visibleLabels.map((label) => (
        <LabelDot key={label.id} option={label} />
      ))}
      {hiddenLabelCount > 0 ? (
        <span className="text-muted-foreground ml-0.5 text-xs tabular-nums">
          +{hiddenLabelCount}
        </span>
      ) : null}
    </span>
  );
}

function LabelOptionRow({ option }: { option: LabelSelectionItem }) {
  if (option.type === "none") {
    return <span className="truncate">{option.label}</span>;
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <LabelDot option={option} />
      <span className="truncate">{option.label}</span>
    </span>
  );
}

function isLabelSelectionItemEqual(item: LabelSelectionItem, value: LabelSelectionItem) {
  return item.id === value.id;
}

export function EntryLabelsPicker({
  id,
  portalContainer,
  value,
  onChange,
}: {
  id: string;
  portalContainer?: ComponentProps<typeof ComboboxContent>["portalContainer"];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const labels = labelOptions.filter((label) => value.includes(label.id));
  function handleLabelsChange(nextItems: LabelSelectionItem[]) {
    onChange(
      nextItems.some((item) => item.type === "none")
        ? []
        : nextItems
            .filter((item): item is LabelOption => item.type === "label")
            .map((item) => item.id),
    );
  }

  return (
    <Field className="min-w-0">
      <Combobox
        multiple
        items={labelSelectionOptions}
        value={labels}
        onValueChange={handleLabelsChange}
        itemToStringValue={(item: LabelSelectionItem) => item.searchText}
        isItemEqualToValue={isLabelSelectionItemEqual}
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
          <ComboboxValue placeholder="Add label">
            {(selectedLabels: LabelOption[]) => (
              <LabelTriggerSummary selectedLabels={selectedLabels ?? []} placeholder="Add label" />
            )}
          </ComboboxValue>
        </ComboboxTrigger>

        <ComboboxContent
          portalContainer={portalContainer}
          className="max-w-(--anchor-width) min-w-(--anchor-width)"
        >
          <ComboboxInput showTrigger={false} placeholder="Select labels" className="mb-1" />
          <ComboboxEmpty>No labels found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.id} value={item}>
                <LabelOptionRow option={item} />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
