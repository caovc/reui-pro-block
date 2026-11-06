import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Clock,
  CreditCard,
  LogOut,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  Plus,
  Sun,
  UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  useEventCalendarSelector,
  type EventCalendarInstance,
} from "@/components/reui/event-calendar/event-calendar";
import { useGlobalTheme } from "@/components/site/global-theme-store";
import { commitCommerceAccountThemeMode } from "./commerce-account-theme";
import { miroChairColors, type MiroChair, type MiroChairColor } from "./miro-settings-data";
import { miroClinicAsOf } from "./miro-settings-integration";
import {
  miroChairColor,
  type MiroChairBooking,
  type MiroChairEventData,
} from "./miro-chair-board-model";
import "./miro-shell-chrome.css";

export interface MiroSidebarAccountProps {
  account: { name: string; organisation: string; photo?: string };
  onProfile: () => void;
  onNotifications: () => void;
  onBilling: () => void;
  onSignOut?: () => void;
}

/** Native menu state only; the shared theme store remains the sole mode owner. */
export function MiroSidebarAccount({
  account,
  onProfile,
  onNotifications,
  onBilling,
  onSignOut,
}: MiroSidebarAccountProps) {
  const [open, setOpen] = useState(false);
  const { theme } = useGlobalTheme();
  const mode = theme.mode === "light" || theme.mode === "dark" ? theme.mode : "system";
  const initials = account.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  const avatar = (className: string) => (
    <Avatar className={className}>
      <AvatarImage src={account.photo} alt="" />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
  return (
    <SidebarMenu className="miro-account-navigation">
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="miro-account-trigger"
              aria-label={`Open profile for ${account.name}`}
            >
              {avatar("miro-account-avatar")}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            className="reui-reference miro-account-menu"
          >
            <DropdownMenuLabel className="miro-account-summary">
              {avatar("miro-account-summary-avatar")}
              <span>
                <strong>{account.name}</strong>
                <small>{account.organisation}</small>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={onProfile}>
                <UserRound />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onNotifications}>
                <Bell />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onBilling}>
                <CreditCard />
                Billing
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="miro-account-theme-row"
              onSelect={(event) => event.preventDefault()}
            >
              <Palette aria-hidden="true" />
              <span>Theme</span>
              <RadioGroup
                aria-label="Theme"
                value={mode}
                className="miro-account-theme-options"
                onValueChange={(value) => {
                  if (value !== "light" && value !== "dark" && value !== "system") return;
                  commitCommerceAccountThemeMode(value, theme);
                  setOpen(false);
                }}
              >
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <Label key={value} className="miro-account-theme-option">
                    <RadioGroupItem
                      value={value}
                      aria-label={label}
                      onClick={() => setOpen(false)}
                    />
                    <Icon aria-hidden="true" />
                  </Label>
                ))}
              </RadioGroup>
            </DropdownMenuItem>
            {onSignOut && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onSignOut}>
                  <LogOut />
                  Sign Out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function ChairDot({ color }: { color: MiroChairColor }) {
  return (
    <span
      className="miro-chair-dot"
      aria-hidden="true"
      style={{ backgroundColor: miroChairColor({ color }) }}
    />
  );
}

function SidebarSectionHeading({ children, count }: { children: ReactNode; count: ReactNode }) {
  return (
    <div className="miro-sidebar-section-heading">
      <span>{children}</span>
      <span className="miro-sidebar-count">{count}</span>
    </div>
  );
}

function ChairGroup({
  title,
  chairs,
  defaultOpen,
  onChairChange,
}: {
  title: string;
  chairs: readonly MiroChair[];
  defaultOpen: boolean;
  onChairChange: MiroCalendarSidebarProps["onChairChange"];
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="miro-chair-group">
      <CollapsibleTrigger asChild>
        <SidebarMenuButton className="miro-chair-group-trigger" aria-label={title}>
          <ChevronDown />
          <span>{title}</span>
          <span className="miro-sidebar-count">{chairs.length}</span>
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu>
          {chairs.map((chair) => (
            <SidebarMenuItem key={chair.id} className="miro-chair-choice">
              <ChairDot color={chair.color} />
              <Checkbox
                id={`miro-sidebar-${chair.id}`}
                checked={chair.visible}
                onCheckedChange={(checked) =>
                  onChairChange(chair.id, { visible: checked === true })
                }
              />
              <Label htmlFor={`miro-sidebar-${chair.id}`}>{chair.name}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Options for ${chair.name}`}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="start"
                  className="reui-reference miro-chair-options"
                >
                  <DropdownMenuLabel>Chair color</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={chair.color}
                    onValueChange={(value) => {
                      const color = miroChairColors.find((item) => item.id === value);
                      if (color) onChairChange(chair.id, { color: color.id });
                    }}
                  >
                    {miroChairColors.map((color) => (
                      <DropdownMenuRadioItem key={color.id} value={color.id}>
                        <ChairDot color={color.id} />
                        {color.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

export interface MiroCalendarSidebarProps {
  calendar: EventCalendarInstance<MiroChairEventData>;
  chairs: readonly MiroChair[];
  appointments: readonly MiroChairBooking[];
  onCreate: () => void;
  onChairChange: (id: string, patch: { visible?: boolean; color?: MiroChairColor }) => void;
}

/** Date, events and chair visibility all read the parent's existing source models. */
export function MiroCalendarSidebar({
  calendar,
  chairs,
  appointments,
  onCreate,
  onChairChange,
}: MiroCalendarSidebarProps) {
  const date = useEventCalendarSelector((state) => state.date, { calendar });
  const events = useEventCalendarSelector((state) => state.events, { calendar });
  const selectedDay = date.toDateString();
  const upcoming = events
    .filter(
      (event) =>
        event.start.toDateString() === selectedDay &&
        event.data &&
        appointments[event.data.bookingIndex],
    )
    .filter(
      (event) =>
        !event.resourceId || chairs.some((chair) => chair.id === event.resourceId && chair.visible),
    )
    .slice()
    .sort((first, second) => first.start.getTime() - second.start.getTime());
  return (
    <div className="miro-secondary-sidebar miro-calendar-sidebar">
      <div className="miro-secondary-header">
        <strong>Chairs</strong>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="Create booking"
          onClick={onCreate}
        >
          <Plus />
        </Button>
      </div>
      <div className="miro-mini-calendar-wrap">
        <Calendar
          mode="single"
          selected={date}
          month={date}
          onMonthChange={(month) => calendar.api.goTo(month)}
          onSelect={(day) => {
            if (day) calendar.api.goTo(day);
          }}
          className="miro-mini-calendar"
          modifiers={{
            booked: (day) =>
              events.some((event) => event.start.toDateString() === day.toDateString()),
          }}
          modifiersClassNames={{ booked: "miro-calendar-booked" }}
        />
      </div>
      <ScrollArea className="miro-secondary-scroll">
        <SidebarGroup className="miro-sidebar-section">
          <SidebarSectionHeading
            count={`${chairs.filter((chair) => chair.visible).length} of ${chairs.length}`}
          >
            My Chairs
          </SidebarSectionHeading>
          <SidebarGroupContent>
            <ChairGroup
              title="Daily chairs"
              chairs={chairs.slice(0, 5)}
              defaultOpen
              onChairChange={onChairChange}
            />
            {chairs.length > 5 && (
              <ChairGroup
                title="Relief chairs"
                chairs={chairs.slice(5)}
                defaultOpen={false}
                onChairChange={onChairChange}
              />
            )}
            <SidebarMenuButton
              className="miro-show-every-chair"
              disabled={chairs.every((chair) => chair.visible)}
              onClick={() =>
                chairs
                  .filter((chair) => !chair.visible)
                  .forEach((chair) => onChairChange(chair.id, { visible: true }))
              }
            >
              <Plus />
              <span>Show every chair</span>
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="miro-sidebar-section miro-up-next">
          <SidebarSectionHeading count={upcoming.length}>Up Next</SidebarSectionHeading>
          <SidebarGroupContent>
            <SidebarMenu>
              {upcoming.map((event) => {
                const booking = appointments[event.data!.bookingIndex];
                const color = chairs.find((chair) => chair.id === event.resourceId)?.color;
                return (
                  <SidebarMenuItem key={event.id}>
                    <SidebarMenuButton
                      className="miro-up-next-booking"
                      style={
                        {
                          "--miro-booking-color": color
                            ? miroChairColor({ color })
                            : "var(--muted-foreground)",
                        } as CSSProperties
                      }
                      onClick={() => {
                        const occurrence = calendar.api
                          .getOccurrencesForDay(event.start)
                          .find((item) => item.eventId === event.id);
                        if (occurrence) calendar.api.selectEvent(occurrence.key);
                      }}
                    >
                      <strong>{booking.patient}</strong>
                      <small>
                        {event.start.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        to{" "}
                        {event.end.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        · {booking.procedure}
                      </small>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {upcoming.length === 0 && (
                <li className="miro-sidebar-empty">No bookings on this day</li>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </ScrollArea>
    </div>
  );
}

// Existing local open-time demonstration, not a generated availability service.
const openTimeLabels = ["6h 45m", "6h", "7h 15m", "3h", "4h 30m"];
const openSlots = [
  "8:00 AM to 8:30 AM",
  "8:00 AM to 9:00 AM",
  "8:00 AM to 10:15 AM",
  "8:45 AM to 9:15 AM",
  "9:00 AM to 9:30 AM",
];

export function MiroDashboardSidebar({
  chairs,
  onCreate,
  onShowAll,
  onOpenBoard,
}: {
  chairs: readonly MiroChair[];
  onCreate: () => void;
  onShowAll: () => void;
  onOpenBoard: () => void;
}) {
  const date = new Date(`${miroClinicAsOf}T12:00:00`);
  return (
    <div className="miro-secondary-sidebar miro-dashboard-sidebar">
      <div className="miro-secondary-header">
        <strong>Open Time</strong>
        <Clock aria-hidden="true" />
      </div>
      <div className="miro-open-time-summary">
        <div>
          <strong>
            Today · {date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </strong>
          <span className="miro-sidebar-count">18 slots</span>
        </div>
        <p>
          <strong>27h 30m</strong>
          <small>still sellable</small>
        </p>
        <Progress value={50} aria-label="Open time: 27 hours 30 minutes of 55 hours" />
        <small>Across 5 chairs that ran</small>
      </div>
      <ScrollArea className="miro-secondary-scroll">
        <SidebarGroup className="miro-sidebar-section">
          <SidebarSectionHeading count={`5 of ${chairs.length}`}>
            Open by chair
          </SidebarSectionHeading>
          {[
            { title: "Chairs that ran", entries: chairs.slice(0, 5), open: true },
            { title: "Never opened", entries: chairs.slice(5), open: false },
          ].map((group) => (
            <Collapsible key={group.title} defaultOpen={group.open} className="miro-chair-group">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className="miro-chair-group-trigger" aria-label={group.title}>
                  <ChevronDown />
                  <span>{group.title}</span>
                  <span className="miro-sidebar-count">{group.entries.length}</span>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu>
                  {group.entries.map((chair, index) => (
                    <SidebarMenuItem key={chair.id} className="miro-open-chair">
                      <ChairDot color={chair.color} />
                      <span>{chair.name}</span>
                      <span className="miro-sidebar-count">
                        {group.open ? openTimeLabels[index] : "0h"}
                      </span>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </SidebarGroup>
        <SidebarGroup className="miro-sidebar-section">
          <SidebarSectionHeading count={18}>Open slots · 30m+</SidebarSectionHeading>
          <SidebarMenu>
            {chairs.slice(0, 5).map((chair, index) => (
              <SidebarMenuItem key={chair.id}>
                <SidebarMenuButton
                  className="miro-open-slot"
                  onClick={onCreate}
                  style={
                    {
                      "--miro-booking-color": miroChairColor(chair),
                    } as CSSProperties
                  }
                >
                  <strong>{openSlots[index]}</strong>
                  <small>
                    {chair.name} · {index === 1 ? "1h" : index === 2 ? "2h 15m" : "30m"}
                  </small>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <Button variant="ghost" className="miro-show-all-slots" onClick={onShowAll}>
            Show all 18
          </Button>
        </SidebarGroup>
        <div className="miro-open-time-actions">
          <Button onClick={onCreate}>
            <Plus />
            Book the first open slot
          </Button>
          <Button variant="outline" onClick={onOpenBoard}>
            <CalendarDays />
            Open the board on this day
          </Button>
        </div>
      </ScrollArea>
      <div className="miro-open-time-footer">
        <Clock />
        <span>
          <small>Open time</small>27h 30m of 55h
        </span>
      </div>
    </div>
  );
}
