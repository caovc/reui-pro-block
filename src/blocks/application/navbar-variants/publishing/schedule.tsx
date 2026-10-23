// Actual free REUI c-calendar-1 and c-time-picker-1 composition, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-calendar-1.json
// https://reui.io/r/radix-nova/c-time-picker-1.json
// Controlled props, publication labels and future-date validation extend the free Cards.
import { useState } from "react";
import { addDays, format } from "date-fns";
import { TimePicker, TimePickerPanel } from "@/components/reui/time-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { DialogSurface } from "../../dialog-variants/first-run/free/dialog-surface";

export function SchedulePostDialog({
  open,
  onOpenChange,
  onSchedule,
  referenceTime,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSchedule: (date: string) => void;
  referenceTime: number;
}) {
  const [date, setDate] = useState<Date | undefined>(() => addDays(new Date(), 1));
  const [time, setTime] = useState<string | null>("14:30");
  const combined = date && time ? new Date(date) : null;
  if (combined && time) {
    const [hours, minutes] = time.split(":").map(Number);
    combined.setHours(hours, minutes, 0, 0);
  }
  const valid = combined !== null && combined.getTime() > referenceTime;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSurface
        id={207}
        title="Schedule post"
        description="Pick a future local publication time. No remote scheduler is connected."
        footer={
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!valid}
              onClick={() => {
                if (!combined || !valid || combined.getTime() <= Date.now()) return;
                onSchedule(format(combined, "yyyy-MM-dd HH:mm"));
                onOpenChange(false);
              }}
            >
              Schedule local post
            </Button>
          </>
        }
      >
        <div className="publishing-schedule-fields">
          <Field>
            <FieldLabel>Publication date</FieldLabel>
            <Card className="w-fit p-0">
              <CardContent className="p-0">
                <Calendar
                  aria-label="Publication date"
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                />
              </CardContent>
            </Card>
          </Field>
          <Field>
            <FieldLabel>Publication time</FieldLabel>
            <Card className="w-fit py-0">
              <TimePicker value={time} onValueChange={setTime} aria-label="Publication time">
                <TimePickerPanel />
              </TimePicker>
            </Card>
          </Field>
        </div>
        <p className="mt-3 text-xs text-muted-foreground" role="status">
          {combined && valid
            ? `Local schedule: ${format(combined, "yyyy-MM-dd HH:mm")}`
            : "Choose a future date and time."}
        </p>
      </DialogSurface>
    </Dialog>
  );
}
