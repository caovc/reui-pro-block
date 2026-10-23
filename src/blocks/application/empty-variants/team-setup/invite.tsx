import { useState } from "react";
import { Check, Copy, UserPlus, Users } from "lucide-react";
import { IconStack } from "@/components/reui/icon-stack";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { useCopyToClipboard } from "./free/use-copy-to-clipboard";
import { InviteForm, type LocalMember } from "./invite-form";
import { TeamDialog, TeamStage } from "./support";

const sampleInviteURL = "https://workspace.example/join/demo-team";

/** Free REUI c-empty-8 member composition, with the public7/9 media differences. */
export default function InviteEmpty({ variant }: { variant: 7 | 9 }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [showLink, setShowLink] = useState(false);
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  function copyInviteLink() {
    if (!navigator.clipboard?.writeText) {
      setShowLink(true);
      return;
    }
    copyToClipboard(sampleInviteURL);
  }

  return (
    <TeamStage id={variant}>
      {members.length ? (
        <div className="empty-team-page">
          <header>
            <div>
              <h1>Workspace invitations</h1>
              <p>{members.length} local invitation drafts · No emails sent</p>
            </div>
            <Button onClick={() => setOpen(true)}>
              <UserPlus />
              Invite members
            </Button>
          </header>
          <div className="empty-team-roster">
            {members.map((member) => (
              <div key={member.email}>
                <Avatar>
                  <AvatarFallback>{member.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <strong>{member.email}</strong>
                <Badge variant="secondary">{member.role}</Badge>
              </div>
            ))}
          </div>
          <div className="empty-team-actions mt-6">
            <Button variant="outline" onClick={copyInviteLink}>
              {isCopied ? <Check /> : <Copy />}
              {isCopied ? "Invite link copied" : "Copy invite link"}
            </Button>
            <Button variant="ghost" onClick={() => setMembers([])}>
              Reset invitations
            </Button>
          </div>
        </div>
      ) : (
        <Empty className="empty-team-invite">
          <EmptyHeader>
            <EmptyMedia>
              {variant === 9 ? (
                <IconStack>
                  <UserPlus className="size-7" strokeWidth={1.5} />
                </IconStack>
              ) : (
                <div className="grid size-14 place-items-center rounded-full border">
                  <Users className="size-6" strokeWidth={1.5} />
                </div>
              )}
            </EmptyMedia>
            <EmptyTitle>Invite the first people in</EmptyTitle>
            <EmptyDescription>
              Bring owners, editors, and reviewers into the workspace with a fast email invite or
              one secure share link.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="empty-team-actions">
              <Button onClick={() => setOpen(true)}>
                <UserPlus />
                Invite members
              </Button>
              <Button variant="outline" onClick={copyInviteLink}>
                {isCopied ? <Check /> : <Copy />}
                {isCopied ? "Invite link copied" : "Copy invite link"}
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      )}
      <TeamDialog
        title="Invite members"
        description="Create a local invitation draft with a role. No email is sent and no access is granted."
        open={open}
        onOpenChange={setOpen}
      >
        <InviteForm
          onAdd={(member) => {
            setMembers((current) => [
              ...current.filter((entry) => entry.email !== member.email),
              member,
            ]);
            setOpen(false);
          }}
        />
        <div className="border-t pt-4">
          <label className="grid gap-2 text-xs text-muted-foreground">
            Example invite URL
            <Input readOnly value={sampleInviteURL} onFocus={(event) => event.target.select()} />
          </label>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            This is an example address. It does not grant workspace access.
          </p>
        </div>
      </TeamDialog>
      <TeamDialog
        title="Example invitation link"
        description="Clipboard access is unavailable. Select and copy this example address manually."
        open={showLink}
        onOpenChange={setShowLink}
      >
        <Input
          readOnly
          aria-label="Example invite URL"
          value={sampleInviteURL}
          onFocus={(event) => event.target.select()}
        />
      </TeamDialog>
      {isCopied && (
        <Alert variant="success" className="mt-6 max-w-sm">
          <AlertTitle>Example link copied</AlertTitle>
          <AlertDescription>
            Local demonstration URL only; no workspace access is granted.
          </AlertDescription>
        </Alert>
      )}
    </TeamStage>
  );
}
