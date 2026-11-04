/* The official free ReUI DateSelector owns every period, operator and calendar
 * interaction. This consumer only stages and commits a local reporting label. */
import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { DateSelector, formatDateValue, type DateSelectorValue } from "./surge-free/date-selector";

import type { SurgeReportingPeriodModel } from "./surge-reporting-period";

function periodLabel(value: DateSelectorValue): string {
  if (value.period === "day" && value.operator === "between" && value.startDate && value.endDate) {
    const dateFormat =
      value.startDate.getFullYear() === value.endDate.getFullYear() ? "MMM d" : "MMM d, yyyy";
    return `${format(value.startDate, dateFormat)} - ${format(value.endDate, dateFormat)}`;
  }
  const selected = formatDateValue(value);
  if (!selected) return "Select date range";
  return value.operator === "before" || value.operator === "after"
    ? `${value.operator} ${selected}`
    : selected;
}

function selectionIsComplete(value: DateSelectorValue): boolean {
  if (value.period === "day") {
    return Boolean(value.startDate && (value.operator !== "between" || value.endDate));
  }
  if (value.operator === "between") return Boolean(value.rangeStart && value.rangeEnd);
  if (value.year === undefined) return false;
  if (value.period === "month") return value.month !== undefined;
  if (value.period === "quarter") return value.quarter !== undefined;
  if (value.period === "half-year") return value.halfYear !== undefined;
  return true;
}

export function SurgeReportingPeriodControl({ model }: { model: SurgeReportingPeriodModel }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(model.value);
  const [maxYear] = useState(() => Math.max(new Date().getFullYear() + 1, 2026));
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(model.value);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="surge-reporting-trigger"
          title={periodLabel(model.value)}
        >
          <CalendarDays data-icon="inline-start" aria-hidden="true" />
          <span>{periodLabel(model.value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={4}
        className="reui-reference surge-reporting-popover"
        aria-label="Reporting date range"
      >
        <div className="surge-reporting-selector">
          <DateSelector
            value={draft}
            onChange={setDraft}
            label="Date range"
            allowRange
            showInput
            showTwoMonths
            defaultPeriodType="day"
            defaultFilterType="between"
            maxYear={maxYear}
            className="surge-date-selector"
          />
        </div>
        <Separator />
        <div className="surge-reporting-actions">
          <Button
            variant="ghost"
            onClick={() => {
              setDraft(model.value);
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!selectionIsComplete(draft)}
            onClick={() => {
              model.setValue(draft);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
