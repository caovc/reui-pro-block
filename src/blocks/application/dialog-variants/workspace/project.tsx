import { useRef, useState } from "react";
import { Info, LayoutTemplate, Plus } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DialogSurface } from "../first-run/free/dialog-surface";
import { DialogLauncher } from "../first-run/support";
import { CoverUpload } from "./free/cover-upload";
import { ProjectStatusPicker } from "./free/status-picker";
import { ProjectPriorityPicker } from "./free/priority-picker";
import { ProjectMembersPicker } from "./free/members-picker";
import { ProjectLabelsPicker } from "./free/labels-picker";

type ProjectDraft = {
  name: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  members: string[];
  labels: string[];
  cover: File | null;
  removedCover: boolean;
};
function ProjectHelp({ label, children }: { label: string; children: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon-xs" aria-label={`${label} help`}>
            <Info />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function ProjectCoverDialog() {
  const [open, setOpen] = useState(false);
  const surface = useRef<HTMLDivElement | null>(null);
  const [name, setName] = useState("Atlas Launch System");
  const [key, setKey] = useState("ALS");
  const [summary, setSummary] = useState(
    "Coordinate launch tasks, owner reviews, and delivery checkpoints for the next workspace release.",
  );
  const [status, setStatus] = useState("planned");
  const [priority, setPriority] = useState("medium");
  const [members, setMembers] = useState(["maya", "leo"]);
  const [labels, setLabels] = useState(["feature", "design"]);
  const [cover, setCover] = useState<File | null>(null);
  const [removedCover, setRemovedCover] = useState(false);
  const [saved, setSaved] = useState<ProjectDraft | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={9}
        title="Project workspace"
        description="Start with a focused brief and clear owners."
        icon={<LayoutTemplate />}
        action="Open project form"
        result={
          saved && (
            <span>
              {saved.name} · {saved.key} · {saved.status} · {saved.priority} ·{" "}
              {saved.members.length} owners · {saved.labels.join(", ") || "No labels"} · Cover:{" "}
              {saved.cover?.name ?? (saved.removedCover ? "None" : "Original demo artwork")}. Local
              project draft only; nothing was uploaded or created remotely.
            </span>
          )
        }
      >
        <div className="flex flex-col gap-3">
          <strong className="text-sm">Atlas Launch System</strong>
          <p className="text-sm text-muted-foreground">
            A project cover, clear status, and the right people.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Planned</Badge>
            <Badge variant="secondary">2 owners</Badge>
            <Badge variant="info-light">Feature</Badge>
          </div>
        </div>
      </DialogLauncher>
      <DialogSurface
        id={9}
        onEscapeKeyDown={(event) => {
          if (surface.current?.querySelector('[data-slot="combobox-content"]'))
            event.preventDefault();
        }}
        title="Create Project"
        description="Add a focused project space with a cover, brief, priority, labels, and owners."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={!name.trim() || !members.length}
              onClick={() => {
                setSaved({
                  name: name.trim(),
                  key: key.trim(),
                  summary: summary.trim(),
                  status,
                  priority,
                  members: [...members],
                  labels: [...labels],
                  cover,
                  removedCover,
                });
                setOpen(false);
              }}
            >
              <Plus data-icon="inline-start" />
              Create project
            </Button>
          </>
        }
      >
        <FieldGroup
          ref={(node) => {
            // The free shared DialogSurface stays unchanged. Its content node is the
            // official Portal destination, outside the body's scrolling viewport.
            surface.current = node?.closest<HTMLDivElement>('[data-dialog-entry="9"]') ?? null;
          }}
        >
          <CoverUpload
            onImageChange={(file) => {
              setCover(file);
              setRemovedCover(!file);
            }}
          />
          <div className="workspace-project-name-row">
            <Field>
              <FieldLabel htmlFor="workspace-project-name">Project name</FieldLabel>
              <Input
                id="workspace-project-name"
                value={name}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="workspace-project-key">Key</FieldLabel>
              <Input
                id="workspace-project-key"
                value={key}
                maxLength={12}
                onChange={(event) =>
                  setKey(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))
                }
              />
            </Field>
          </div>
          <Field>
            <div className="flex items-center gap-1">
              <FieldLabel htmlFor="workspace-project-brief">Project brief</FieldLabel>
              <ProjectHelp label="Project brief">
                Describe the outcome, review cadence and delivery context for this project.
              </ProjectHelp>
            </div>
            <Textarea
              id="workspace-project-brief"
              className="min-h-20"
              value={summary}
              maxLength={1200}
              onChange={(event) => setSummary(event.target.value)}
            />
          </Field>
          <div className="workspace-project-properties">
            <Field>
              <FieldLabel htmlFor="workspace-project-status">Status</FieldLabel>
              <ProjectStatusPicker
                id="workspace-project-status"
                value={status}
                onChange={setStatus}
                portalContainer={surface}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="workspace-project-priority">Priority</FieldLabel>
              <ProjectPriorityPicker
                id="workspace-project-priority"
                value={priority}
                onChange={setPriority}
                portalContainer={surface}
              />
            </Field>
            <Field>
              <div className="flex items-center gap-1">
                <FieldLabel htmlFor="workspace-project-members">Assigned</FieldLabel>
                <ProjectHelp label="Assigned">
                  Choose at least one local example owner before creating the draft.
                </ProjectHelp>
              </div>
              <ProjectMembersPicker
                id="workspace-project-members"
                value={members}
                onChange={setMembers}
                portalContainer={surface}
              />
            </Field>
            <Field>
              <div className="flex items-center gap-1">
                <FieldLabel htmlFor="workspace-project-labels">Labels</FieldLabel>
                <ProjectHelp label="Labels">
                  Use labels to group related work. No label clears the local selection.
                </ProjectHelp>
              </div>
              <ProjectLabelsPicker
                id="workspace-project-labels"
                value={labels}
                onChange={setLabels}
                portalContainer={surface}
              />
            </Field>
          </div>
        </FieldGroup>
      </DialogSurface>
    </Dialog>
  );
}
