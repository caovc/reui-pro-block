import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogSurface } from "./free/dialog-surface";
import { DialogLauncher } from "./support";

const roles = [
  { id: "core", label: "Core member", description: "Project access and daily work." },
  { id: "limited", label: "Limited member", description: "Shared work only." },
  { id: "guest", label: "Guest reviewer", description: "Review shared work." },
  { id: "admin", label: "Workspace admin", description: "Manage workspace settings." },
];
function parseAddresses(value: string) {
  return [
    ...new Set(
      value
        .split(/[\s,;]+/)
        .map((address) => address.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export default function BulkInviteDialog() {
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState("");
  const [roleId, setRoleId] = useState("core");
  const [attempted, setAttempted] = useState(false);
  const [saved, setSaved] = useState<{ recipients: string[]; role: string } | null>(null);
  const recipients = parseAddresses(emails);
  const invalid = recipients.filter((address) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address));
  const selectedRole = roles.find((role) => role.id === roleId)!;
  const error =
    attempted && invalid.length
      ? "Check each email address before saving the invitation draft."
      : null;

  function submitInvites() {
    setAttempted(true);
    if (!recipients.length || invalid.length) return;
    setSaved({ recipients, role: selectedRole.label });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={2}
        title="Invite teammates"
        description="Bring the right people into your workspace."
        icon={<UserPlus />}
        action="Open team invite"
        result={
          saved && (
            <span>
              {saved.recipients.join(", ")} · {saved.role}. Local invitation draft; no email was
              sent and no access was granted.
            </span>
          )
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">Workspace access</span>
            <Badge variant="warning-light">{saved?.role ?? "Core member"}</Badge>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Paste several emails and choose one starting role for the group.
          </p>
        </div>
      </DialogLauncher>
      <DialogSurface
        id={2}
        title={
          <span className="flex flex-wrap items-center gap-2">
            Invite teammates{" "}
            <Badge size="sm" variant="warning-light">
              Workspace access
            </Badge>
          </span>
        }
        description="Add emails and choose the role they start with."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={submitInvites} disabled={!recipients.length}>
              <UserPlus data-icon="inline-start" />
              {recipients.length > 1 ? `Send ${recipients.length} invites` : "Send invite"}
            </Button>
          </>
        }
      >
        <FieldGroup>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="refined-invite-emails">Invite by email</FieldLabel>
            <Input
              id="refined-invite-emails"
              autoComplete="off"
              placeholder="name@company.com"
              maxLength={1200}
              value={emails}
              onChange={(event) => {
                setEmails(event.target.value);
                setAttempted(false);
              }}
              aria-invalid={!!error}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitInvites();
              }}
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="refined-invite-role">Invite as</FieldLabel>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger id="refined-invite-role" className="w-full">
                <SelectValue>{selectedRole.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <span className="flex flex-col gap-1">
                        <span>{role.label}</span>
                        <span className="text-xs text-muted-foreground">{role.description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </DialogSurface>
    </Dialog>
  );
}
