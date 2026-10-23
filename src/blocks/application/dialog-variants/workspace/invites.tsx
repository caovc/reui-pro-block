import { useRef, useState } from "react";
import { Plus, Send, Trash2, Users } from "lucide-react";
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
import { DialogSurface } from "../first-run/free/dialog-surface";
import { DialogLauncher } from "../first-run/support";

const roles = [
  { id: "member", name: "Member", description: "Default collaboration access." },
  { id: "contributor", name: "Contributor", description: "Create and edit assigned work." },
  { id: "reviewer", name: "Reviewer", description: "Comment and approve work." },
  { id: "admin", name: "Admin", description: "Manage people and settings." },
];
type InviteRow = { id: number; email: string; role: string };
const emailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function CollaboratorInviteDialog() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<InviteRow[]>([{ id: 1, email: "", role: "member" }]);
  const nextId = useRef(2);
  const [saved, setSaved] = useState<InviteRow[] | null>(null);
  const nonEmpty = rows.filter((row) => row.email.trim());
  const duplicate = nonEmpty.some(
    (row, index) =>
      nonEmpty.findIndex(
        (entry) => entry.email.trim().toLowerCase() === row.email.trim().toLowerCase(),
      ) !== index,
  );
  const canSave =
    nonEmpty.length > 0 && nonEmpty.every((row) => emailValid(row.email)) && !duplicate;
  function updateRow(id: number, patch: Partial<InviteRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={8}
        title="Invite collaborators"
        description="Choose the right access for each teammate."
        icon={<Users />}
        action="Open collaborator invite"
        result={
          saved && (
            <span>
              {saved
                .map((row) => `${row.email} (${roles.find((role) => role.id === row.role)!.name})`)
                .join(" · ")}
              . Local drafts only; no invitations sent or access granted.
            </span>
          )
        }
      >
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Badge key={role.id} variant="secondary">
              {role.name}
            </Badge>
          ))}
        </div>
      </DialogLauncher>
      <DialogSurface
        id={8}
        title="Invite Collaborators"
        description="Add each person with the access they need."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={!canSave}
              onClick={() => {
                setSaved(
                  nonEmpty.map((row) => ({ ...row, email: row.email.trim().toLowerCase() })),
                );
                setOpen(false);
              }}
            >
              <Send data-icon="inline-start" />
              Send invitations
            </Button>
          </>
        }
      >
        <FieldGroup>
          {rows.map((row, index) => (
            <div className="workspace-dialog-invite-row" key={row.id}>
              <Field data-invalid={!!row.email.trim() && !emailValid(row.email)}>
                <FieldLabel className="sr-only" htmlFor={`collaborator-email-${row.id}`}>
                  Email address for invite {index + 1}
                </FieldLabel>
                <Input
                  id={`collaborator-email-${row.id}`}
                  value={row.email}
                  maxLength={160}
                  placeholder="Enter user email"
                  onChange={(event) => updateRow(row.id, { email: event.target.value })}
                  aria-invalid={!!row.email.trim() && !emailValid(row.email)}
                />
                {row.email.trim() && !emailValid(row.email) && (
                  <FieldError>Enter a valid email address.</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel className="sr-only" htmlFor={`collaborator-role-${row.id}`}>
                  Role for invite {index + 1}
                </FieldLabel>
                <Select value={row.role} onValueChange={(role) => updateRow(row.id, { role })}>
                  <SelectTrigger id={`collaborator-role-${row.id}`} className="w-full">
                    <SelectValue>{roles.find((role) => role.id === row.role)!.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <span className="flex flex-col gap-1">
                            <span>{role.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {role.description}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              {rows.length > 1 && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Remove invite row ${index + 1}`}
                  onClick={() =>
                    setRows((current) => current.filter((entry) => entry.id !== row.id))
                  }
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          ))}
          {duplicate && (
            <FieldError>
              Use a different email for each person so every draft has one clear role.
            </FieldError>
          )}
          <Button
            variant="outline"
            className="self-end"
            disabled={rows.length >= 10}
            onClick={() => {
              const id = nextId.current++;
              setRows((current) => [...current, { id, email: "", role: "member" }]);
            }}
          >
            <Plus data-icon="inline-start" />
            Add new member
          </Button>
        </FieldGroup>
      </DialogSurface>
    </Dialog>
  );
}
