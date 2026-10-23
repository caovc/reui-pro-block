"use client";

// Adapted from the ReUI free c-calendar-8 Month Year Select example:
// https://reui.io/r/radix-nova/c-calendar-8.json
// Reuses its Select -> DayPicker Dropdown change-event bridge and DropdownNav.
// Adaptations: controlled Calendar props, accessible labels, portal classes,
// consumer DayButton customization, and optional built-in previous/next controls.
// License: ./REUI-LICENSE.txt
import type { ChangeEvent, ChangeEventHandler, ComponentProps } from "react";
import type { DropdownNavProps, DropdownProps } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "cn";

export type CalendarSelectProps = ComponentProps<typeof Calendar> & {
  monthLabel?: string;
  yearLabel?: string;
  portalClassName?: string;
  monthTriggerClassName?: string;
  yearTriggerClassName?: string;
  dropdownNavClassName?: string;
};

export function CalendarSelect({
  monthLabel = "Month",
  yearLabel = "Year",
  portalClassName,
  monthTriggerClassName,
  yearTriggerClassName,
  dropdownNavClassName,
  classNames,
  components,
  labels,
  captionLayout = "dropdown",
  hideNavigation = false,
  ...props
}: CalendarSelectProps) {
  // This is the official c-calendar-8 adapter, rather than a second month/year
  // state model. DayPicker owns the available options and navigation callbacks.
  const handleCalendarChange = (
    value: string | number,
    onChange: ChangeEventHandler<HTMLSelectElement>,
  ) => {
    const event = {
      target: { value: String(value) },
    } as ChangeEvent<HTMLSelectElement>;
    onChange(event);
  };

  return (
    <Calendar
      {...props}
      captionLayout={captionLayout}
      hideNavigation={hideNavigation}
      labels={{
        labelPrevious: () => "Previous month",
        labelNext: () => "Next month",
        ...labels,
      }}
      classNames={{ month_caption: "mx-0", ...classNames }}
      components={{
        Dropdown: (dropdown: DropdownProps) => {
          // DayPicker v9 supplies a name; v10 exposes the accessible label/options.
          const isYear =
            dropdown.name === "years" ||
            Boolean(dropdown["aria-label"]?.toLowerCase().includes("year")) ||
            Boolean(dropdown.options?.some((option) => Number(option.value) > 11));
          return (
            <Select
              value={String(dropdown.value)}
              onValueChange={(value) => {
                if (dropdown.onChange && value !== null)
                  handleCalendarChange(value, dropdown.onChange);
              }}
            >
              <SelectTrigger
                aria-label={isYear ? yearLabel : monthLabel}
                className={cn("first:grow", isYear ? yearTriggerClassName : monthTriggerClassName)}
              >
                <SelectValue>
                  {
                    dropdown.options?.find(
                      (option) => String(option.value) === String(dropdown.value),
                    )?.label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start" className={cn("reui-reference", portalClassName)}>
                {dropdown.options?.map((option) => (
                  <SelectItem
                    disabled={option.disabled}
                    key={option.value}
                    value={String(option.value)}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
        DropdownNav: (navigation: DropdownNavProps) => (
          <div className={cn("flex w-full items-center gap-2", dropdownNavClassName)}>
            {navigation.children}
          </div>
        ),
        ...components,
      }}
    />
  );
}
