import { useState } from "react";
import { Check, Clock3 } from "lucide-react";
import { IconTile } from "@/components/reui/icon-tile";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DialogSurface } from "./free/dialog-surface";
import { DialogLauncher, FooterHelp } from "./support";

const presets = [
  { minutes: 30, label: "30 min" },
  { minutes: 120, label: "2 hours" },
  { minutes: 240, label: "4 hours" },
  { minutes: 480, label: "8 hours" },
  { minutes: 720, label: "12 hours" },
  { minutes: 1440, label: "1 day" },
];
const timeOptions = Array.from(
  { length: 48 },
  (_, index) => `${Math.floor(index / 2)}`.padStart(2, "0") + (index % 2 ? ":30" : ":00"),
);
function timeMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
function timeLabel(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return `${String(hour % 12 || 12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}
function durationMinutes(start: string, end: string) {
  const difference = timeMinutes(end) - timeMinutes(start);
  return difference <= 0 ? difference + 1440 : difference;
}

export default function DurationDialog() {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("02:00");
  const [end, setEnd] = useState("02:30");
  const [saved, setSaved] = useState<{ start: string; end: string; minutes: number } | null>(null);
  const duration = durationMinutes(start, end);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={1}
        title="Duration picker"
        description="Choose a time span for your next session."
        icon={<Clock3 />}
        action="Open duration picker"
        result={
          saved && (
            <span>
              {timeLabel(saved.start)} → {timeLabel(saved.end)} · {saved.minutes} minutes. Local
              duration only; no event was scheduled.
            </span>
          )
        }
      >
        <div className="refined-dialog-duration-summary">
          <div>
            <span>Start time</span>
            <strong>{timeLabel(saved?.start ?? start)}</strong>
          </div>
          <div>
            <span>End time</span>
            <strong>{timeLabel(saved?.end ?? end)}</strong>
          </div>
          <Badge variant="secondary">{saved?.minutes ?? duration} minutes</Badge>
        </div>
      </DialogLauncher>
      <DialogSurface
        id={1}
        title="Select duration"
        description="Pick a start and end time or use a quick preset."
        media={
          <IconTile variant="frame">
            <Clock3 />
          </IconTile>
        }
        footer={
          <>
            <FooterHelp label="Quick presets update the end time.">
              Presets keep your start time and move the end. An end at or before the start is the
              following day.
            </FooterHelp>
            <div className="refined-dialog-actions">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  setSaved({ start, end, minutes: duration });
                  setOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </>
        }
      >
        <FieldGroup>
          <div className="refined-dialog-time-fields">
            {[
              { id: "start", label: "Start time", value: start, setValue: setStart },
              { id: "end", label: "End time", value: end, setValue: setEnd },
            ].map((field) => (
              <Field key={field.id}>
                <FieldLabel htmlFor={`refined-duration-${field.id}`}>
                  {field.label}{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Select value={field.value} onValueChange={field.setValue}>
                  <SelectTrigger id={`refined-duration-${field.id}`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {timeLabel(time)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            ))}
          </div>
          <Field>
            <FieldLabel>Quick duration</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              className="refined-dialog-presets"
              aria-label="Quick duration presets"
              value={String(duration)}
              onValueChange={(value) => {
                if (!value) return;
                const slot = ((timeMinutes(start) + Number(value)) % 1440) / 30;
                setEnd(timeOptions[slot]);
              }}
            >
              {presets.map((preset) => (
                <ToggleGroupItem value={String(preset.minutes)} key={preset.minutes}>
                  {duration === preset.minutes && <Check data-icon="inline-start" />}
                  {preset.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        </FieldGroup>
      </DialogSurface>
    </Dialog>
  );
}
