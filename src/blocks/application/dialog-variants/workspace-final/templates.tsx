import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, ChevronDown, FileText, Folder, Info } from "lucide-react";
import { demoAvatar } from "@/lib/demo-artwork";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DialogLauncher } from "../first-run/support";
import { ProjectLabelCards } from "./free/label-cards";
import { projectDateOptions, projectTemplates, resolveProjectDate } from "./template-data";

function ProjectSelect({
  id,
  value,
  options,
  onChange,
  avatars = false,
}: {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  avatars?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {avatars && (
                <Avatar className="size-5">
                  <AvatarImage src={demoAvatar(option)} alt="" />
                  <AvatarFallback>{option.slice(0, 2)}</AvatarFallback>
                </Avatar>
              )}
              {option}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
export default function ProjectTemplatesDialog() {
  const [open, setOpen] = useState(false);
  const [referenceNow, setReferenceNow] = useState(() => new Date());
  const [draft, setDraft] = useState(projectTemplates[0]);
  const [assignee, setAssignee] = useState("Maya Stone");
  const [due, setDue] = useState("Next Friday");
  const [labels, setLabels] = useState(["feature", "billing"]);
  const [saved, setSaved] = useState<string | null>(null);
  const [help, setHelp] = useState<"support" | "templates" | "draft" | null>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setReferenceNow(new Date());
        setOpen(next);
      }}
    >
      <DialogLauncher
        id={13}
        title="Project templates"
        description="Start from a template and refine the project brief."
        icon={<Folder />}
        action="Open project templates"
        result={
          saved && (
            <span>
              {saved} Local project draft only; no remote project or workspace was created.
            </span>
          )
        }
      >
        <div className="flex flex-wrap gap-2">
          {projectTemplates.map((template) => (
            <Badge key={template.id} variant="outline">
              {template.label}
            </Badge>
          ))}
        </div>
      </DialogLauncher>
      <DialogContent className="final-project-dialog" showCloseButton={false}>
        <header className="final-project-topbar">
          <DialogClose asChild>
            <Button variant="ghost">
              <ArrowLeft />
              Back
            </Button>
          </DialogClose>
          <Button variant="outline" onClick={() => setHelp(help === "support" ? null : "support")}>
            Support
          </Button>
        </header>
        <div className="final-project-scroll">
          <div className="final-project-form">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle>Create Project</DialogTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm">
                      <FileText />
                      Select template
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {projectTemplates.map((template) => (
                      <DropdownMenuItem key={template.id} onSelect={() => setDraft(template)}>
                        <span className="flex flex-col gap-1">
                          <span>{template.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setHelp("templates")}>
                      Manage templates
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <DialogDescription>Set details, owner, timing, and labels.</DialogDescription>
            </div>
            {help && (
              <Alert>
                <AlertTitle>
                  {help === "templates"
                    ? "Available local templates"
                    : help === "support"
                      ? "Local project support"
                      : "Project draft"}
                </AlertTitle>
                <AlertDescription>
                  {help === "templates"
                    ? "Bug Report, Feature Request and Chore are editable example starting points. Choosing one replaces name, key, brief, status and priority; owners, timing and labels stay as selected."
                    : help === "support"
                      ? "No support mailbox is connected. Your project draft stays in this browser preview until this page reloads."
                      : "Saving keeps a local project draft and a real resolved due date. No remote record is created."}
                </AlertDescription>
              </Alert>
            )}
            <FieldGroup>
              <div className="final-project-name-row">
                <Field>
                  <FieldLabel htmlFor="template-project-name">Project name</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <Folder />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="template-project-name"
                      value={draft.name}
                      maxLength={100}
                      onChange={(event) =>
                        setDraft((value) => ({ ...value, name: event.target.value }))
                      }
                    />
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="template-project-key">Key</FieldLabel>
                  <Input
                    id="template-project-key"
                    value={draft.key}
                    maxLength={12}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        key: event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
                      }))
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="template-project-summary">Project brief</FieldLabel>
                <Textarea
                  id="template-project-summary"
                  value={draft.summary}
                  className="min-h-20"
                  maxLength={2000}
                  onChange={(event) =>
                    setDraft((value) => ({ ...value, summary: event.target.value }))
                  }
                />
              </Field>
              <div className="final-entry-properties">
                <Field>
                  <FieldLabel htmlFor="template-project-status">Status</FieldLabel>
                  <ProjectSelect
                    id="template-project-status"
                    value={draft.status}
                    options={[
                      "Backlog",
                      "Planned",
                      "In Progress",
                      "Paused",
                      "Completed",
                      "Cancelled",
                    ]}
                    onChange={(status) => setDraft((value) => ({ ...value, status }))}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="template-project-assignee">Assigned</FieldLabel>
                  <ProjectSelect
                    id="template-project-assignee"
                    value={assignee}
                    options={["Maya Stone", "Leo Grant", "Nora Chen", "Samir Park"]}
                    onChange={setAssignee}
                    avatars
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="template-project-due">Due date</FieldLabel>
                  <ProjectSelect
                    id="template-project-due"
                    value={due}
                    options={projectDateOptions}
                    onChange={setDue}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="template-project-priority">Priority</FieldLabel>
                  <ProjectSelect
                    id="template-project-priority"
                    value={draft.priority}
                    options={["No Priority", "Low", "Medium", "High", "Urgent"]}
                    onChange={(priority) => setDraft((value) => ({ ...value, priority }))}
                  />
                </Field>
              </div>
              <Field>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FieldLabel>Labels</FieldLabel>
                  <Badge variant="secondary">{labels.length} selected</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tag the project for planning and reporting.
                </p>
                <ProjectLabelCards value={labels} onChange={setLabels} />
              </Field>
            </FieldGroup>
          </div>
        </div>
        <footer className="final-project-footer">
          <div className="final-project-footer-inner">
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setHelp(help === "draft" ? null : "draft")}
            >
              <Info />
              Project draft
            </Button>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                disabled={!draft.name.trim() || !draft.key.trim()}
                onClick={() => {
                  setSaved(
                    `${draft.name.trim()} · ${draft.key} · ${draft.status} · ${assignee} · ${format(resolveProjectDate(due, referenceNow), "yyyy-MM-dd")} · ${draft.priority} · ${labels.join(", ") || "No labels"}.`,
                  );
                  setOpen(false);
                }}
              >
                Create project
              </Button>
            </div>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
