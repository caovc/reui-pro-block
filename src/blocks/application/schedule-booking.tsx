import { useRef, useState, type ComponentProps, type ReactNode } from "react";
import { CircleCheck, CircleDot, Clock, Ellipsis, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import rangePortrait from "./assets/range-alex-johnson.jpg";
import { CalendarDayButton } from "@/components/ui/calendar";
import { CalendarSelect } from "@/components/reui/calendar-select";
import {
  Frame,
  FramePanel,
  FrameHeader,
  FrameFooter,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import {
  TimePicker,
  TimePickerValue,
  useTimePicker,
  parseTimeValue,
  formatTimeValue,
  DEFAULT_TIME_PICKER_I18N,
} from "@/components/reui/time-picker";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import "../reference.css";
import "./schedule-booking.css";

const REFERENCE_DAY = new Date(2026, 5, 30);
// The free ReUI TimePicker owns time parsing and formatting. The block adds
// only duration arithmetic and the Pro preview's flat HH:mm Select view.
const timeValue = (minutes: number) =>
  formatTimeValue({
    hour: Math.floor(minutes / 60),
    minute: minutes % 60,
    second: 0,
  });
const toMinutes = (value: string) => {
  const time = parseTimeValue(value);
  return time ? time.hour * 60 + time.minute : 0;
};
const time12 = (value: string, capital = true, leadingZero = true) => {
  const time = parseTimeValue(value);
  if (!time) return "";
  return DEFAULT_TIME_PICKER_I18N.functions.formatValue(time, {
    hourCycle: 12,
    granularity: "minute",
    periodPosition: "end",
    labels: {
      ...DEFAULT_TIME_PICKER_I18N.labels,
      am: capital ? "AM" : "am",
      pm: capital ? "PM" : "pm",
    },
    formatSegment: (part, unit) =>
      unit === "hour" && !leadingZero
        ? String(part)
        : DEFAULT_TIME_PICKER_I18N.functions.formatSegment(part, unit),
  });
};
const durationText = (minutes: number) =>
  minutes < 60 ? `${minutes} min` : `${minutes / 60} ${minutes === 60 ? "hour" : "hours"}`;

function Choice({
  label,
  value,
  options,
  onChange,
  disabled = false,
  valueNode,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  valueNode?: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuWidth, setMenuWidth] = useState<number>();
  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      onOpenChange={(open) => {
        if (open && triggerRef.current)
          setMenuWidth(triggerRef.current.getBoundingClientRect().width + 1);
      }}
    >
      <SelectTrigger ref={triggerRef} className="sr-trigger" aria-label={label}>
        <SelectValue>{valueNode}</SelectValue>
      </SelectTrigger>
      <SelectContent
        className="reui-reference schedule-reference-menu"
        style={{ minWidth: menuWidth }}
      >
        <SelectGroup className="p-0">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function RangeTimeChoice({
  label,
  options,
}: {
  label: string;
  options: { value: string; label: string }[];
}) {
  const picker = useTimePicker();
  return (
    <Choice
      label={label}
      value={picker.value ?? ""}
      options={options}
      onChange={picker.setValue}
      valueNode={<TimePickerValue />}
    />
  );
}

function BookingCalendar({
  selected,
  onSelect,
  kind,
}: {
  selected?: Date;
  onSelect: (value: Date | undefined) => void;
  kind: "meeting" | "session";
}) {
  const [month, setMonth] = useState(new Date(2026, 5, 1));
  const Day = (props: ComponentProps<typeof CalendarDayButton>) => (
    <CalendarDayButton {...props} className="sr-calendar-day" />
  );
  return (
    <div className={`sr-calendar-panel sr-calendar-${kind}`}>
      <CalendarSelect
        className="sr-calendar"
        mode="single"
        month={month}
        onMonthChange={setMonth}
        selected={selected}
        onSelect={onSelect}
        today={REFERENCE_DAY}
        startMonth={new Date(2020, 0)}
        endMonth={new Date(2040, 11)}
        portalClassName="schedule-reference-menu"
        monthTriggerClassName="sr-trigger sr-month-select"
        yearTriggerClassName="sr-trigger sr-year-select"
        dropdownNavClassName="sr-calendar-dropdowns"
        components={{ DayButton: Day }}
        formatters={{
          formatWeekdayName: (day) => day.toLocaleDateString("en-US", { weekday: "short" }),
          formatMonthDropdown: (day) => day.toLocaleDateString("en-US", { month: "long" }),
        }}
        classNames={{
          month_caption: "sr-calendar-caption",
          nav: "sr-calendar-nav",
          button_previous: "sr-nav",
          button_next: "sr-nav",
          month: "sr-calendar-month",
          months: "sr-calendar-months",
          month_grid: "sr-calendar-grid",
          weekdays: "sr-calendar-weekdays",
          weekday: "sr-calendar-weekday",
          week: "sr-calendar-week",
          day: "sr-calendar-cell",
          today: "sr-calendar-today",
        }}
      />
    </div>
  );
}

export function TimeRangePicker() {
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [confirmed, setConfirmed] = useState(false);
  const total = toMinutes(end) - toMinutes(start);
  const presets = [15, 30, 60, 120, 180, 240, 300, 360, 420, 480];
  const options = Array.from({ length: 96 }, (_, index) => ({
    value: timeValue(index * 15),
    label: time12(timeValue(index * 15)),
  }));
  const reset = () => {
    setStart("09:00");
    setEnd("10:00");
    setConfirmed(false);
  };
  return (
    <div className="reui-reference schedule-reference sr-page">
      <Frame className="sr-frame sr-range" role="region" aria-label="Time range picker">
        <FrameHeader className="sr-range-header">
          <Avatar>
            <AvatarImage src={rangePortrait} alt="Alex Johnson" />
            <AvatarFallback>AJ</AvatarFallback>
          </Avatar>
          <div>
            <FrameTitle className="sr-person-name">Alex Johnson</FrameTitle>
            <FrameDescription className="sr-muted sr-person-role">
              Founder &amp; CEO
            </FrameDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="sr-more" aria-label="Session options">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="reui-reference schedule-reference-menu" align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void navigator.clipboard.writeText(location.href)}>
                Copy Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </FrameHeader>
        <FramePanel fit className="sr-range-body sr-inner">
          <div className="sr-range-times">
            <label className="sr-field">
              <span>Start time</span>
              <TimePicker
                value={start}
                onValueChange={(value) => {
                  if (value) setStart(value);
                  setConfirmed(false);
                }}
                hourCycle={12}
                minuteStep={15}
                name="start-time"
              >
                <RangeTimeChoice label="Start time" options={options} />
              </TimePicker>
            </label>
            <label className="sr-field">
              <span>End time</span>
              <TimePicker
                value={end}
                onValueChange={(value) => {
                  if (value) setEnd(value);
                  setConfirmed(false);
                }}
                hourCycle={12}
                minuteStep={15}
                name="end-time"
              >
                <RangeTimeChoice label="End time" options={options} />
              </TimePicker>
            </label>
          </div>
          <div className="sr-field sr-duration-field">
            <span>Duration</span>
            <div className="sr-presets">
              {presets.map((minutes) => (
                <Button
                  key={minutes}
                  className="sr-button sr-small"
                  variant={total === minutes ? "default" : "outline"}
                  aria-pressed={total === minutes}
                  disabled={toMinutes(start) + minutes >= 1440}
                  onClick={() => {
                    setEnd(timeValue(toMinutes(start) + minutes));
                    setConfirmed(false);
                  }}
                >
                  {durationText(minutes)}
                </Button>
              ))}
            </div>
          </div>
        </FramePanel>
        <FrameFooter className="sr-range-footer">
          <div className="sr-footer-note" aria-live="polite">
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Selected duration information">
                  <Info />
                </button>
              </TooltipTrigger>
              <TooltipContent className="reui-reference">
                Duration is calculated from your start and end times.
              </TooltipContent>
            </Tooltip>
            <span>
              {confirmed ? (
                <>
                  Confirmed:{" "}
                  <strong>
                    {time12(start)} to {time12(end)}
                  </strong>
                </>
              ) : (
                <>
                  Selected duration: <strong>{total > 0 ? durationText(total) : "0 min"}</strong>
                </>
              )}
            </span>
          </div>
          <div className="sr-actions">
            <Button variant="outline" className="sr-button" onClick={reset}>
              Cancel
            </Button>
            <Button className="sr-button" disabled={total <= 0} onClick={() => setConfirmed(true)}>
              Apply
            </Button>
          </div>
        </FrameFooter>
      </Frame>
    </div>
  );
}

const MEETING_DURATIONS = [15, 30, 45, 60, 90, 120];
const RECURRENCES = ["Does not repeat", "Every day", "Every week", "Every 2 weeks", "Every month"];
export function MeetingScheduler() {
  const [date, setDate] = useState<Date | undefined>(REFERENCE_DAY);
  const [slot, setSlot] = useState("10:00");
  const [duration, setDuration] = useState("30");
  const [recurrence, setRecurrence] = useState("Every week");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [waiting, setWaiting] = useState(true);
  const [recording, setRecording] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const reset = () => {
    setDate(REFERENCE_DAY);
    setSlot("10:00");
    setDuration("30");
    setRecurrence("Every week");
    setTitle("");
    setDescription("");
    setWaiting(true);
    setRecording(false);
    setScheduled(false);
  };
  const slots = Array.from({ length: 25 }, (_, index) => timeValue(8 * 60 + index * 30));
  return (
    <div className="reui-reference schedule-reference sr-page">
      <Frame className="sr-frame sr-meeting" role="region" aria-label="Meeting scheduler">
        <FrameHeader className="sr-meeting-header">
          <FrameTitle role="heading" aria-level={2}>
            Schedule Meeting
          </FrameTitle>
          <FrameDescription>{zone}</FrameDescription>
        </FrameHeader>
        <FramePanel fit className="sr-inner sr-meeting-inner">
          <div className="sr-calendar-row">
            <BookingCalendar
              kind="meeting"
              selected={date}
              onSelect={(value) => {
                setDate(value);
                setScheduled(false);
              }}
            />
            <div className="sr-meeting-slots">
              <h3>
                {date
                  ? `${date.toLocaleDateString("en-US", { weekday: "long" })}, ${date.getDate()}`
                  : "Pick a date"}
              </h3>
              <ScrollArea className="sr-slot-scroll" type="always" aria-label="Meeting times">
                <div className="sr-slot-items">
                  {slots.map((value) => (
                    <Button
                      key={value}
                      className="sr-button sr-small"
                      variant={slot === value ? "default" : "outline"}
                      disabled={value === "12:00" || value === "12:30" || !date}
                      aria-pressed={slot === value}
                      onClick={() => {
                        setSlot(value);
                        setScheduled(false);
                      }}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <div className="sr-meeting-form">
            <div className="sr-meeting-selects">
              <label className="sr-field">
                <span>Duration</span>
                <Choice
                  label="Duration"
                  value={duration}
                  options={MEETING_DURATIONS.map((value) => ({
                    value: String(value),
                    label: durationText(value),
                  }))}
                  onChange={(value) => {
                    setDuration(value);
                    setScheduled(false);
                  }}
                />
              </label>
              <label className="sr-field">
                <span>Recurrence</span>
                <Choice
                  label="Recurrence"
                  value={recurrence}
                  options={RECURRENCES.map((value) => ({
                    value,
                    label: value,
                  }))}
                  onChange={(value) => {
                    setRecurrence(value);
                    setScheduled(false);
                  }}
                />
              </label>
            </div>
            <label className="sr-field">
              <span>Title</span>
              <Input
                className="sr-input"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setScheduled(false);
                }}
                placeholder="e.g. Weekly standup"
              />
            </label>
            <label className="sr-field">
              <span>Description</span>
              <Textarea
                className="sr-input sr-description"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setScheduled(false);
                }}
                placeholder="Add agenda or notes..."
              />
            </label>
            <div className="sr-switches">
              <label>
                <ShieldCheck />
                <span>Waiting room</span>
                <Switch
                  checked={waiting}
                  onCheckedChange={(value) => {
                    setWaiting(value);
                    setScheduled(false);
                  }}
                  aria-label="Waiting room"
                />
              </label>
              <label>
                <CircleDot />
                <span>Auto-record</span>
                <Switch
                  checked={recording}
                  onCheckedChange={(value) => {
                    setRecording(value);
                    setScheduled(false);
                  }}
                  aria-label="Auto-record"
                />
              </label>
            </div>
          </div>
          <FrameFooter className="sr-meeting-footer">
            <Button className="sr-button" variant="outline" onClick={reset}>
              Cancel
            </Button>
            <Button
              className="sr-button"
              disabled={!date || !slot || scheduled}
              onClick={() => setScheduled(true)}
            >
              {scheduled ? "Scheduled" : "Schedule meeting"}
            </Button>
          </FrameFooter>
        </FramePanel>
      </Frame>
    </div>
  );
}

export function SessionBooking() {
  const [date, setDate] = useState<Date>();
  const [duration, setDuration] = useState(30);
  const [slot, setSlot] = useState("");
  const [booked, setBooked] = useState(false);
  const slots = Array.from({ length: Math.floor(480 / duration) }, (_, index) =>
    timeValue(540 + index * duration),
  );
  const reset = () => {
    setDate(undefined);
    setSlot("");
    setBooked(false);
  };
  return (
    <div className="reui-reference schedule-reference sr-page">
      <Frame className="sr-frame sr-session" role="region" aria-label="Session booking">
        <FrameHeader className="sr-session-header">
          <FrameTitle role="heading" aria-level={2}>
            Schedule a session
          </FrameTitle>
          <div className="sr-session-durations" aria-label="Session duration">
            {[15, 30, 45, 60, 90].map((value) => (
              <Button
                className="sr-button sr-tiny"
                key={value}
                variant={duration === value ? "default" : "outline"}
                aria-pressed={duration === value}
                onClick={() => {
                  setDuration(value);
                  setSlot("");
                  setBooked(false);
                }}
              >
                {value}m
              </Button>
            ))}
          </div>
        </FrameHeader>
        <FramePanel fit className="sr-inner sr-calendar-row sr-session-inner">
          <BookingCalendar
            kind="session"
            selected={date}
            onSelect={(value) => {
              setDate(value);
              setSlot("");
              setBooked(false);
            }}
          />
          <div className="sr-session-slots">
            <h3>
              {date
                ? `${date.getDate()} ${date.toLocaleDateString("en-US", { weekday: "short" })}`
                : "Pick a date"}
            </h3>
            {date ? (
              <ScrollArea
                className="sr-slot-scroll"
                type="auto"
                aria-label="Available session times"
              >
                <div className="sr-slot-items">
                  {slots.map((value) => (
                    <Button
                      key={value}
                      className="sr-button sr-small"
                      variant={slot === value ? "default" : "outline"}
                      aria-pressed={slot === value}
                      disabled={booked}
                      onClick={() => {
                        setSlot(value);
                        setBooked(false);
                      }}
                    >
                      {time12(value, false, false)}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="sr-session-empty">
                <Clock />
                <p>Select a date to see available times</p>
              </div>
            )}
          </div>
        </FramePanel>
        <FrameFooter className="sr-session-footer">
          <p className="sr-footer-note" aria-live="polite">
            <CircleCheck className={booked ? "sr-success" : ""} />
            <span>
              {booked && date ? (
                <>
                  Booked:{" "}
                  <strong>
                    {date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    · {time12(slot, false, false)} ({duration}m)
                  </strong>
                </>
              ) : slot ? (
                "Ready, confirm to book"
              ) : (
                "Choose a date and time to book"
              )}
            </span>
          </p>
          <div className="sr-actions">
            {date && !booked && (
              <Button className="sr-button sr-small" variant="ghost" onClick={reset}>
                Reset
              </Button>
            )}
            <Button
              className="sr-button sr-small"
              disabled={!date || !slot || booked}
              onClick={() => setBooked(true)}
            >
              {booked ? "Booked" : "Book session"}
            </Button>
          </div>
        </FrameFooter>
      </Frame>
    </div>
  );
}
