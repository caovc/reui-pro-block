// Official free REUI c-calendar-29. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-calendar-29.json
// Actual upstream picker/presets retained. Adapters: callback, Lucide icon, Radix asChild, viewport/collision scroll.
"use client";

import { useId, useState } from "react";
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import type { DateRange } from "react-day-picker";

import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";

export function FreeRangePicker({
  initialRange,
  onChange,
}: {
  initialRange?: DateRange;
  onChange: (range: DateRange | undefined) => void;
}) {
  const id = useId();
  const [today] = useState(() => new Date());
  const yesterday = {
    from: subDays(today, 1),
    to: subDays(today, 1),
  };
  const last7Days = {
    from: subDays(today, 6),
    to: today,
  };
  const last30Days = {
    from: subDays(today, 29),
    to: today,
  };
  const monthToDate = {
    from: startOfMonth(today),
    to: today,
  };
  const lastMonth = {
    from: startOfMonth(subMonths(today, 1)),
    to: endOfMonth(subMonths(today, 1)),
  };
  const yearToDate = {
    from: startOfYear(today),
    to: today,
  };
  const lastYear = {
    from: startOfYear(subYears(today, 1)),
    to: endOfYear(subYears(today, 1)),
  };
  const [month, setMonth] = useState(today);
  const [date, updateDate] = useState<DateRange | undefined>(initialRange ?? last7Days);
  function setDate(value: DateRange | undefined) {
    updateDate(value);
    onChange(value);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="group/pick-date w-60 justify-between"
          id={id}
          aria-label="Choose custom date range"
          variant={"outline"}
        >
          <span className={cn("truncate", date && "text-muted-foreground")}>
            {date?.from
              ? date.to
                ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
                : format(date.from, "LLL dd, y")
              : "Pick a date range"}
          </span>
          <CalendarIcon
            aria-hidden="true"
            className="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className="max-h-[min(70svh,var(--radix-popover-content-available-height))] w-auto overflow-y-auto p-0"
      >
        <Card className="p-0">
          <CardContent className="p-0">
            <div className="flex max-sm:flex-col">
              <div className="relative py-4 max-sm:order-1 max-sm:border-t sm:w-32">
                <div className="h-full sm:border-e">
                  <div className="flex flex-col px-2">
                    <Button
                      className="w-full justify-start"
                      onClick={() => {
                        setDate({
                          from: today,
                          to: today,
                        });
                        setMonth(today);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Today
                    </Button>
                    <Button
                      className="w-full justify-start"
                      onClick={() => {
                        setDate(yesterday);
                        setMonth(yesterday.to);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Yesterday
                    </Button>
                    <Button
                      className="w-full justify-start"
                      onClick={() => {
                        setDate(last7Days);
                        setMonth(last7Days.to);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Last 7 days
                    </Button>
                    <Button
                      className="w-full justify-start"
                      onClick={() => {
                        setDate(last30Days);
                        setMonth(last30Days.to);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Last 30 days
                    </Button>
                    <Button
                      className="w-full justify-start"
                      onClick={() => {
                        setDate(monthToDate);
                        setMonth(monthToDate.to);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Month to date
                    </Button>
                    <Button
                      className="w-full justify-start"
                      onClick={() => {
                        setDate(lastMonth);
                        setMonth(lastMonth.to);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Last month
                    </Button>
                    <Button
                      className="w-full justify-start"
                      onClick={() => {
                        setDate(yearToDate);
                        setMonth(yearToDate.to);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Year to date
                    </Button>
                    <Button
                      className="w-full justify-start"
                      onClick={() => {
                        setDate(lastYear);
                        setMonth(lastYear.to);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Last year
                    </Button>
                  </div>
                </div>
              </div>
              <Calendar
                disabled={[{ after: today }]}
                mode="range"
                month={month}
                onMonthChange={setMonth}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate);
                  }
                }}
                selected={date}
              />
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
