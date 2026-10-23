// Actual official free REUI c-calendar-24. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-calendar-24.json
// Upstream source SHA256: 34ccf9f2c438cb03d2e62965dc8923094ffa6abbf239e7b80b6e6b5217e9d742
// Controlled data/icon/handler adaptations recorded in docs/navbar4-6-implementation.md.
"use client";

import { useId } from "react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";

export function ToolbarDatePicker({
  date,
  onChange,
}: {
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
}) {
  const id = useId();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="group/pick-date w-fit justify-between"
          size="sm"
          aria-label="Dashboard date"
          id={id}
          variant="outline"
        >
          <span className={cn("truncate", !date && "text-muted-foreground")}>
            {date ? format(date, "PPP") : "Pick a date"}
          </span>
          <CalendarIcon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0" aria-label="Dashboard calendar">
        <Calendar mode="single" onSelect={onChange} selected={date} />
      </PopoverContent>
    </Popover>
  );
}
