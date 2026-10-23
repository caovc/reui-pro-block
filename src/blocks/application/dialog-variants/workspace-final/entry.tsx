import { useRef, useState } from "react";
import { addDays, format } from "date-fns";
import { LayoutGrid, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DialogLauncher } from "../first-run/support";
import { EntryStatusPicker } from "./free/status-picker";
import { EntryPriorityPicker } from "./free/priority-picker";
import { EntryLabelsPicker } from "./free/labels-picker";
import { EntryAssigneePicker } from "./free/assignee-picker";
import { EntryDatePicker, type DateSelectionValue } from "./free/date-picker";
import { entryTypes } from "./entry-data";

type EntryId = (typeof entryTypes)[number]["id"];
export default function QuickEntryDialog() {
  const [open, setOpen] = useState(false);
  const [referenceNow, setReferenceNow] = useState(() => new Date());
  const [type, setType] = useState<EntryId>("action");
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(
      entryTypes.map((entry) => [
        entry.id,
        { title: String(entry.title), notes: String(entry.notes) },
      ]),
    ),
  );
  const [status, setStatus] = useState("planned");
  const [assignee, setAssignee] = useState("maya");
  const [date, setDate] = useState<DateSelectionValue>(() => ({
    type: "preset",
    id: "tomorrow",
    label: "Tomorrow",
    date: addDays(new Date(), 1),
  }));
  const [priority, setPriority] = useState("medium");
  const [labels, setLabels] = useState(["billing", "beta"]);
  const [saved, setSaved] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSaved, setInviteSaved] = useState<string | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const active = entryTypes.find((entry) => entry.id === type)!;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim());
  function updateDraft(id: string, field: "title" | "notes", value: string) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setReferenceNow(new Date());
        setOpen(next);
      }}
    >
      <DialogLauncher
        id={12}
        title="Quick create entry"
        description="Keep a separate draft for each kind of record."
        icon={<Plus />}
        action="Open quick entry"
        result={
          saved && (
            <span>
              {saved} Local record draft only; nothing was scheduled, published or created remotely.
            </span>
          )
        }
      >
        <p className="text-sm text-muted-foreground">Action · Brief · Nudge · Canvas · Pulse</p>
      </DialogLauncher>
      <DialogContent
        ref={surface}
        className="final-entry-dialog"
        onEscapeKeyDown={(event) => {
          if (surface.current?.querySelector('[data-slot="combobox-content"]'))
            event.preventDefault();
        }}
      >
        <DialogHeader className="px-6 pt-5">
          <DialogTitle>Create entry</DialogTitle>
          <DialogDescription>Create and assign a quick record.</DialogDescription>
        </DialogHeader>
        <Tabs
          value={type}
          onValueChange={(value) => setType(value as EntryId)}
          className="final-entry-tabs"
        >
          <div className="px-6">
            <TabsList className="max-w-full overflow-x-auto">
              {entryTypes.map((entry) => (
                <TabsTrigger value={entry.id} key={entry.id}>
                  {entry.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="final-entry-body">
            {entryTypes.map((entry) => (
              <TabsContent key={entry.id} value={entry.id} className="mt-0">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={`entry-title-${entry.id}`}>Title</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <LayoutGrid />
                      </InputGroupAddon>
                      <InputGroupInput
                        id={`entry-title-${entry.id}`}
                        value={drafts[entry.id].title}
                        placeholder={entry.titleHint}
                        maxLength={160}
                        onChange={(event) => updateDraft(entry.id, "title", event.target.value)}
                      />
                    </InputGroup>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`entry-notes-${entry.id}`}>Notes</FieldLabel>
                    <Textarea
                      id={`entry-notes-${entry.id}`}
                      className="min-h-24"
                      value={drafts[entry.id].notes}
                      placeholder={entry.notesHint}
                      maxLength={2000}
                      onChange={(event) => updateDraft(entry.id, "notes", event.target.value)}
                    />
                  </Field>
                </FieldGroup>
              </TabsContent>
            ))}
            <div className="final-entry-properties">
              <Field>
                <FieldLabel htmlFor="entry-status">Status</FieldLabel>
                <EntryStatusPicker
                  id="entry-status"
                  value={status}
                  onChange={setStatus}
                  portalContainer={surface}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="entry-assignee">Assignee</FieldLabel>
                <EntryAssigneePicker
                  id="entry-assignee"
                  value={assignee}
                  onChange={setAssignee}
                  onInvite={() => setInviteOpen(true)}
                  portalContainer={surface}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="entry-date">Due date</FieldLabel>
                <EntryDatePicker
                  id="entry-date"
                  value={date}
                  onValueChange={setDate}
                  referenceNow={referenceNow}
                  portalContainer={surface}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="entry-priority">Priority</FieldLabel>
                <EntryPriorityPicker
                  id="entry-priority"
                  value={priority}
                  onChange={setPriority}
                  portalContainer={surface}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="entry-labels">Labels</FieldLabel>
                <EntryLabelsPicker
                  id="entry-labels"
                  value={labels}
                  onChange={setLabels}
                  portalContainer={surface}
                />
              </Field>
            </div>
            {inviteOpen && (
              <FieldGroup className="rounded-lg border p-4">
                <Field>
                  <FieldLabel htmlFor="entry-invite-email">Invite email</FieldLabel>
                  <Input
                    id="entry-invite-email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    aria-invalid={!!inviteEmail && !emailValid}
                    placeholder="teammate@example.com"
                  />
                  {!!inviteEmail && !emailValid && (
                    <FieldError>Enter a valid email address.</FieldError>
                  )}
                </Field>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>
                    Dismiss invitation
                  </Button>
                  <Button
                    disabled={!emailValid}
                    onClick={() => {
                      setInviteSaved(inviteEmail.trim().toLowerCase());
                      setInviteOpen(false);
                    }}
                  >
                    Save invitation draft
                  </Button>
                </div>
              </FieldGroup>
            )}
            {inviteSaved && (
              <Alert>
                <AlertTitle>Local invitation draft</AlertTitle>
                <AlertDescription>
                  {inviteSaved}. No email was sent or access granted.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Tabs>
        <DialogFooter className="final-entry-footer">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={!drafts[type].title.trim()}
            onClick={() => {
              setSaved(
                `${active.label}: ${drafts[type].title.trim()} · ${status} · ${assignee} · ${date ? format(date.date, "yyyy-MM-dd") : "No date"} · ${priority} · ${labels.join(", ") || "No label"}.`,
              );
              setOpen(false);
            }}
          >
            {active.action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
