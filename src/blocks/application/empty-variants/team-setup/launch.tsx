import { useState } from "react";
import { Check, FileText, Kanban, Upload, UserPlus, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";
import { InviteForm, type LocalMember } from "./invite-form";
import { TeamDialog, TeamStage } from "./support";

type Step = "team" | "directory" | "deliverables" | "brief" | "checkin";

export default function LaunchEmpty() {
  const [open, setOpen] = useState<Step | null>(null);
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [synced, setSynced] = useState(false);
  const [milestone, setMilestone] = useState("");
  const [brief, setBrief] = useState("");
  const [checkin, setCheckin] = useState("");
  const [draft, setDraft] = useState("");
  const [lastAction, setLastAction] = useState("");
  const steps = [
    {
      key: "deliverables" as const,
      title: "Link Deliverables",
      description: milestone || "Keep milestones, owners, and blockers in view.",
      icon: Kanban,
      done: !!milestone,
    },
    {
      key: "brief" as const,
      title: "Open Brief",
      description: brief || "Capture context, decisions, and handoff notes.",
      icon: FileText,
      done: !!brief,
    },
    {
      key: "checkin" as const,
      title: "Start Check-In",
      description: checkin || "Gather the team when a thread needs answers.",
      icon: Users,
      done: !!checkin,
    },
  ];
  const title =
    open === "team"
      ? "Add Core Team"
      : open === "directory"
        ? "Sync Directory"
        : (steps.find((step) => step.key === open)?.title ?? "Team workspace");

  function openStep(step: Step) {
    setDraft(step === "deliverables" ? milestone : step === "brief" ? brief : checkin);
    setOpen(step);
  }

  return (
    <TeamStage id={6}>
      <div className="empty-team-launch">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Launch the Team Workspace</EmptyTitle>
            <EmptyDescription>
              Bring the core team together and sync the roster, so plans and follow-ups stay
              visible.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => openStep("team")}>
              {members.length ? <Check /> : <UserPlus />}
              {members.length ? `Core Team · ${members.length} members` : "Add Core Team"}
            </Button>
            <Button variant="outline" onClick={() => openStep("directory")}>
              {synced ? <Check /> : <Upload />}
              {synced ? "Directory synced locally" : "Sync Directory"}
            </Button>
          </EmptyContent>
        </Empty>
        <div className="empty-team-steps">
          {steps.map((step) => (
            <Item asChild key={step.key}>
              <Button
                variant="ghost"
                className="empty-team-step"
                data-step={step.key}
                onClick={() => openStep(step.key)}
                aria-label={step.title}
              >
                <ItemMedia>
                  <step.icon className="size-4" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{step.title}</ItemTitle>
                  <ItemDescription>{step.description}</ItemDescription>
                </ItemContent>
                {step.done && (
                  <Check
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-label="Completed locally"
                  />
                )}
              </Button>
            </Item>
          ))}
        </div>
        {lastAction && (
          <Alert variant="success" className="mt-5">
            <AlertTitle>Workspace updated locally</AlertTitle>
            <AlertDescription>{lastAction}</AlertDescription>
          </Alert>
        )}
      </div>
      <TeamDialog
        title={title}
        description="This demonstration keeps workspace setup on this page. No invitations are sent and no directory account is connected."
        open={open !== null}
        onOpenChange={(value) => !value && setOpen(null)}
      >
        {open === "team" ? (
          <>
            {members.length > 0 && (
              <div className="empty-team-roster">
                {members.map((member) => (
                  <div key={member.email}>
                    <strong>{member.email}</strong>
                    <Badge variant="secondary">{member.role}</Badge>
                  </div>
                ))}
              </div>
            )}
            <InviteForm
              onAdd={(member) => {
                setMembers((current) => [
                  ...current.filter((entry) => entry.email !== member.email),
                  member,
                ]);
                setLastAction(`Added ${member.email} as ${member.role}.`);
                setOpen(null);
              }}
            />
          </>
        ) : open === "directory" ? (
          <div className="grid gap-4">
            <div className="rounded-lg border p-4 text-sm">
              <strong>Sample team directory</strong>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Preview three sample team members and their roles. This does not request OAuth
                access or run a background sync.
              </p>
            </div>
            <Button
              onClick={() => {
                setMembers((current) => {
                  const sample = [
                    { email: "olivia@example.com", role: "Owner" },
                    { email: "phoenix@example.com", role: "Editor" },
                    { email: "lana@example.com", role: "Reviewer" },
                  ];
                  return [
                    ...current.filter(
                      (member) => !sample.some((entry) => entry.email === member.email),
                    ),
                    ...sample,
                  ];
                });
                setSynced(true);
                setLastAction("Three sample directory members were added to this local workspace.");
                setOpen(null);
              }}
            >
              Sync sample directory
            </Button>
          </div>
        ) : (
          <form
            className="empty-team-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.trim()) return;
              if (open === "deliverables") setMilestone(draft.trim());
              if (open === "brief") setBrief(draft.trim());
              if (open === "checkin") setCheckin(draft.trim());
              setLastAction(`${title} was saved in this preview.`);
              setOpen(null);
            }}
          >
            <label>
              {open === "deliverables"
                ? "Milestone name"
                : open === "brief"
                  ? "Brief notes"
                  : "Check-in question"}
              {open === "deliverables" ? (
                <Input
                  required
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Website launch milestone"
                  maxLength={120}
                />
              ) : (
                <Textarea
                  required
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={
                    open === "brief"
                      ? "Decisions, context, and handoff notes…"
                      : "What is blocking this week's milestone?"
                  }
                  maxLength={500}
                  rows={4}
                />
              )}
            </label>
            <Button type="submit">
              {open === "deliverables"
                ? "Link milestone"
                : open === "brief"
                  ? "Save brief"
                  : "Open local check-in"}
            </Button>
          </form>
        )}
      </TeamDialog>
    </TeamStage>
  );
}
