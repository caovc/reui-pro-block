import { useRef, useState } from "react";
import { differenceInMonths, format, parseISO } from "date-fns";
import { BriefcaseBusiness, CalendarDays, MapPin, UserRound, UserRoundCheck } from "lucide-react";
import { Frame, FramePanel } from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import {
  Timeline,
  TimelineContent,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
} from "@/components/reui/timeline";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { TinyAvatar } from "@/blocks/data/grid-advanced-shared";
import { Button, toast } from "./shared";
import { Tone } from "./fidelity";
import type { CohortPerson } from "./cohort-people";
import { cohortProfileData } from "./cohort-person-profile-data";
import "./cohort-person-detail.css";

const demoDate = new Date(2026, 6, 30, 12);
const displayDate = (date: string) => format(parseISO(date), "d MMM yyyy");
function compactTenure(start: string) {
  const months = Math.max(0, differenceInMonths(demoDate, parseISO(start)));
  if (!months) return "New";
  return [months >= 12 ? `${Math.floor(months / 12)}y` : "", months % 12 ? `${months % 12}m` : ""]
    .filter(Boolean)
    .join(" ");
}
function PersonPhoto({ person }: { person: CohortPerson }) {
  return person.photo ? (
    <img src={person.photo} alt="" className="cohort-person-photo" />
  ) : (
    <TinyAvatar name={person.name} photo={!person.photoRemoved} />
  );
}
export function CohortPersonDetail({
  person,
  people,
  onClose,
  onSaveNote,
  onTimesheet,
}: {
  person: CohortPerson;
  people: CohortPerson[];
  onClose: () => void;
  onSaveNote: (note: string) => void;
  onTimesheet: () => void;
}) {
  const [note, setNote] = useState(person.notes);
  const content = useRef<HTMLDivElement>(null);
  const profile = cohortProfileData(person);
  const manager = people.find((candidate) => candidate.id === person.manager);
  const directReports = people.filter((candidate) => candidate.manager === person.id).length;
  const used = profile.allowance ? Math.round((profile.taken / profile.allowance) * 100) : 0;
  const activities = profile.activities.length
    ? profile.activities
    : [
        {
          title: "Joined the company",
          description: `${person.title} in ${person.department}, based in ${person.location}.`,
          actorId: manager?.externalEmployeeId || person.externalEmployeeId,
          date: person.start,
          kind: "joined" as const,
        },
      ];
  const sectionTitle = (text: string) => <h3 className="cohort-profile-section-title">{text}</h3>;
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        ref={content}
        className="bt-floating-sheet cohort-person-detail"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          content.current
            ?.querySelector<HTMLElement>('[data-slot="sheet-close"]')
            ?.focus({ preventScroll: true });
        }}
      >
        <SheetHeader className="cohort-profile-header">
          <div className="cohort-profile-id">
            <UserRound size={13} /> {person.externalEmployeeId}
          </div>
          <div className="cohort-profile-title-row">
            <div className="cohort-profile-title">
              <SheetTitle>{person.name}</SheetTitle>
              <span>•</span>
              <span>{person.title}</span>
            </div>
            <Tone
              tone={
                person.status === "Active"
                  ? "green"
                  : person.status === "On leave"
                    ? "amber"
                    : "neutral"
              }
            >
              {person.status}
            </Tone>
          </div>
          <SheetDescription className="cohort-profile-location">
            <MapPin size={13} />
            {person.location}
            <span>•</span>
            {person.department}
          </SheetDescription>
        </SheetHeader>
        <div className="cohort-profile-scroll">
          <Frame variant="ghost" dense stacked className="cohort-profile-sections">
            {manager && (
              <FramePanel className="cohort-profile-section">
                {sectionTitle("Reports to")}
                {/* Official free c-item-4 media/content/actions composition, with HR fields. */}
                <Item className="cohort-profile-manager" size="sm">
                  <ItemMedia variant="image">
                    <PersonPhoto person={manager} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{manager.name}</ItemTitle>
                    <ItemDescription>
                      <UserRound size={12} /> {manager.title}
                      <span>•</span>
                      {manager.location}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Tone tone="neutral">{manager.department}</Tone>
                  </ItemActions>
                </Item>
              </FramePanel>
            )}
            <FramePanel className="cohort-profile-section">
              {sectionTitle("Contract")}
              <div className="cohort-profile-contract">
                <div>
                  <strong>{profile.employment}</strong>
                  <p>
                    {person.department}
                    <span>•</span>
                    {compactTenure(person.start)}
                  </p>
                </div>
                <b>{profile.hours}h</b>
              </div>
              <div className="cohort-profile-person-since">
                <PersonPhoto person={person} />
                <strong>{person.name}</strong>
                <span>•</span>
                <span>since {displayDate(person.start)}</span>
              </div>
            </FramePanel>
            <FramePanel className="cohort-profile-section">
              {sectionTitle("Leave")}
              <Item className="cohort-profile-leave" size="sm">
                <ItemMedia>
                  <CalendarDays size={16} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {Math.max(0, profile.allowance - profile.taken)} days remaining
                  </ItemTitle>
                  <ItemDescription>
                    Annual allowance<span>•</span>
                    {profile.allowance} days
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Tone tone={profile.away ? "amber" : "green"}>
                    {profile.away ? "Away today" : "At work"}
                  </Tone>
                </ItemActions>
              </Item>
              {/* Actual official free c-progress-8 independent colour composition. */}
              <Progress
                aria-label="Annual leave used"
                value={used}
                className="cohort-profile-leave-meter"
              />
              <div className="cohort-profile-leave-caption">
                <span>
                  Taken {profile.taken} {profile.taken === 1 ? "day" : "days"}
                  <span>•</span>
                  {used}%
                </span>
                <span>{profile.carried} carried over</span>
              </div>
            </FramePanel>
            <FramePanel className="cohort-profile-section">
              {sectionTitle("Details")}
              <dl className="cohort-profile-details">
                {[
                  ["Start date", displayDate(person.start)],
                  ["Tenure", compactTenure(person.start)],
                  ["Review", profile.review],
                  ["Direct reports", directReports || "None"],
                  ...(profile.onboarding === undefined
                    ? []
                    : [["Onboarding", `${profile.onboarding}% complete`]]),
                  ["Employee ID", person.externalEmployeeId],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd className={label === "Employee ID" ? "cohort-profile-code" : undefined}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </FramePanel>
            <FramePanel className="cohort-profile-section">
              {sectionTitle("Internal note")}
              <Textarea
                aria-label={`Internal note for ${person.name}`}
                placeholder="Add a note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="cohort-profile-note"
              />
              <div className="cohort-profile-note-actions">
                <span>Visible to HR only.</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={note === person.notes}
                  onClick={() => {
                    onSaveNote(note);
                    toast.success("Note saved");
                  }}
                >
                  Save note
                </Button>
              </div>
            </FramePanel>
            <FramePanel className="cohort-profile-section">
              {sectionTitle("Activity")}
              <Timeline value={0} className="cohort-profile-activity">
                {activities.map((activity, index) => {
                  const actor = people.find(
                    (candidate) => candidate.externalEmployeeId === activity.actorId,
                  );
                  const Icon =
                    activity.kind === "leave"
                      ? CalendarDays
                      : activity.kind === "joined"
                        ? BriefcaseBusiness
                        : UserRoundCheck;
                  return (
                    <TimelineItem key={`${activity.date}-${index}`} step={index + 1}>
                      <TimelineSeparator />
                      <TimelineIndicator asChild>
                        <IconTile size="xs" radius="full" variant="soft" data-kind={activity.kind}>
                          <Icon />
                        </IconTile>
                      </TimelineIndicator>
                      <TimelineContent>
                        <strong>{activity.title}</strong>
                        <p>{activity.description}</p>
                        <div className="cohort-profile-activity-author">
                          {actor && <PersonPhoto person={actor} />}
                          <span>{actor?.name || person.name}</span>
                          <span>•</span>
                          <span>{displayDate(activity.date)}</span>
                        </div>
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </FramePanel>
          </Frame>
        </div>
        <SheetFooter className="cohort-profile-footer">
          <Button variant="outline" size="sm" onClick={onTimesheet}>
            Timesheet
          </Button>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
