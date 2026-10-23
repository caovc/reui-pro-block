import { useId } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  categoryCollections,
  departmentOptions,
  fitOptions,
  initialFilters,
  type CollectionFit,
  type CollectionFilters,
} from "./data";

/** Actual official c-select-1 Field/SelectGroup/Item composition, with controlled domain values. */
export function CollectionSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <Field className="min-w-0">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

/** Actual c-popover-3 form shell, c-switch-2 descriptive field and native c-toggle-group-5 filters. */
export function CollectionFilterPopover({
  value,
  onChange,
}: {
  value: CollectionFilters;
  onChange: (value: CollectionFilters) => void;
}) {
  const featuredId = useId();
  const active =
    Number(value.department !== "all") +
    Number(value.availability !== "all") +
    value.fits.length +
    Number(value.featured);
  function change(patch: Partial<CollectionFilters>) {
    onChange({ ...value, ...patch });
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontal className="size-4" />
          Filters
          {active > 0 && (
            <Badge variant="secondary" size="sm" data-filter-count>
              {active}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(22rem,calc(100vw-2rem))]" align="start">
        <PopoverHeader>
          <PopoverTitle role="heading" aria-level={3}>
            Find your collection
          </PopoverTitle>
          <PopoverDescription>Filters update this sample catalog immediately.</PopoverDescription>
        </PopoverHeader>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel>Department</FieldLabel>
            <CollectionSelect
              label="Department filter"
              value={value.department}
              onChange={(department) => change({ department })}
              options={departmentOptions}
            />
          </Field>
          <Field>
            <FieldLabel>Availability</FieldLabel>
            <CollectionSelect
              label="Availability filter"
              value={value.availability}
              onChange={(availability) => change({ availability })}
              options={[
                { value: "all", label: "All collections" },
                { value: "available", label: "Available now" },
                { value: "upcoming", label: "Coming soon" },
              ]}
            />
          </Field>
          <Field>
            <FieldLabel>Made for</FieldLabel>
            <ToggleGroup
              type="multiple"
              value={value.fits}
              onValueChange={(fits) => change({ fits: fits as CollectionFit[] })}
              variant="outline"
              size="sm"
              className="w-full flex-wrap justify-start gap-2"
              aria-label="Collection fit filters"
            >
              {fitOptions.map((fit) => (
                <ToggleGroupItem
                  key={fit}
                  value={fit}
                  className="flex-none rounded-md! border! px-2.5!"
                >
                  {fit}
                  <span className="text-[10px] text-muted-foreground">
                    {
                      categoryCollections.filter((collection) =>
                        collection.fits.some((value) => value === fit),
                      ).length
                    }
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <FieldLabel htmlFor={featuredId} className="w-full">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Featured only</FieldTitle>
                <FieldDescription>
                  Collections with a new, most-loved or limited badge.
                </FieldDescription>
              </FieldContent>
              <Switch
                id={featuredId}
                checked={value.featured}
                onCheckedChange={(featured) => change({ featured })}
              />
            </Field>
          </FieldLabel>
        </FieldGroup>
        <Button variant="outline" className="w-full" onClick={() => onChange(initialFilters)}>
          Reset filters
        </Button>
      </PopoverContent>
    </Popover>
  );
}
