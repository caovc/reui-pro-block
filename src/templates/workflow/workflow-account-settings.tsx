import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/reui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SettingsFields,
  SettingsPanel,
  SettingsRow,
  type SettingsFieldDefinition,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { settingsSections } from "@/blocks/application/dialog-variants/workspace/settings-data";
import { LocalAvatarUpload } from "@/blocks/application/dialog-variants/workspace/free/avatar-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createWorkflowAccountSnapshot,
  workflowAccountDescriptions,
  workflowAccountFields,
  workflowAccountOptions,
  workflowProfileFields,
  type WorkflowAccountKind,
  type WorkflowAccountSection,
  type WorkflowAccountSnapshot,
} from "./workflow-account-settings-data";
import "@/blocks/reference.css";
import "@/blocks/application/dialog-variants/workspace/workspace.css";
import "./workflow-account-settings.css";

export type WorkflowAccountIdentity = { name: string; avatar?: string };
export type WorkflowAccountSettingsProps = {
  kind: WorkflowAccountKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSection?: WorkflowAccountSection;
  onIdentityChange?: (identity: WorkflowAccountIdentity) => void;
  className?: string;
};

function copySnapshot(snapshot: WorkflowAccountSnapshot): WorkflowAccountSnapshot {
  return { ...snapshot, values: { ...snapshot.values } };
}
function initialModels() {
  return {
    tempo: createWorkflowAccountSnapshot("tempo"),
    mesh: createWorkflowAccountSnapshot("mesh"),
  };
}
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** Keep mounted: each template owns an independent local saved snapshot. */
export function WorkflowAccountSettings({
  kind,
  open,
  onOpenChange,
  initialSection = "profile",
  onIdentityChange,
  className,
}: WorkflowAccountSettingsProps) {
  const [saved, setSaved] = useState(initialModels);
  const [status, setStatus] = useState("");
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn("workspace-settings-shell wf-account-shell reui-reference", className)}
          data-workflow-account={kind}
        >
          {open && (
            <WorkflowAccountForm
              key={`${kind}-${initialSection}`}
              kind={kind}
              snapshot={saved[kind]}
              initialSection={initialSection}
              onCancel={() => onOpenChange(false)}
              onSave={(snapshot) => {
                setSaved((current) => ({ ...current, [kind]: snapshot }));
                onIdentityChange?.({
                  name: String(snapshot.values.fullName),
                  avatar: snapshot.avatar,
                });
                setStatus("Account settings saved locally for this session.");
                onOpenChange(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </>
  );
}

function WorkflowAccountForm({
  kind,
  snapshot,
  initialSection,
  onCancel,
  onSave,
}: {
  kind: WorkflowAccountKind;
  snapshot: WorkflowAccountSnapshot;
  initialSection: WorkflowAccountSection;
  onCancel: () => void;
  onSave: (snapshot: WorkflowAccountSnapshot) => void;
}) {
  const [draft, setDraft] = useState(() => copySnapshot(snapshot));
  const [section, setSection] = useState<WorkflowAccountSection>(initialSection);
  const [pending, setPending] = useState({ avatar: false, logo: false });
  const [mediaError, setMediaError] = useState("");
  const mediaRequests = useRef({ avatar: 0, logo: 0 });
  const activeReaders = useRef<{ avatar: FileReader | null; logo: FileReader | null }>({
    avatar: null,
    logo: null,
  });
  useEffect(() => {
    const readers = activeReaders.current;
    return () => {
      readers.avatar?.abort();
      readers.logo?.abort();
    };
  }, []);
  const profile = workflowProfileFields(kind);
  const idPrefix = `workflow-account-${kind}`;

  function change(id: string, value: string | boolean) {
    setDraft((current) => ({ ...current, values: { ...current.values, [id]: value } }));
  }
  function changeMedia(media: "avatar" | "logo", value?: string) {
    setDraft((current) => ({ ...current, [media]: value }));
  }
  function removeMedia(media: "avatar" | "logo") {
    mediaRequests.current[media] += 1;
    activeReaders.current[media]?.abort();
    setPending((current) => ({ ...current, [media]: false }));
    changeMedia(media, undefined);
  }
  function selectMedia(media: "avatar" | "logo", file: FileWithPreview | null) {
    // The upload adapter reports null after Remove; its explicit remove callback owns that action.
    if (!(file?.file instanceof File)) return;
    const request = ++mediaRequests.current[media];
    setPending((current) => ({ ...current, [media]: true }));
    setMediaError("");
    activeReaders.current[media]?.abort();
    const reader = new FileReader();
    activeReaders.current[media] = reader;
    reader.onload = () => {
      if (request !== mediaRequests.current[media]) return;
      if (typeof reader.result === "string") changeMedia(media, reader.result);
      setPending((current) => ({ ...current, [media]: false }));
    };
    reader.onerror = () => {
      if (request !== mediaRequests.current[media]) return;
      setMediaError("The image could not be read. Choose another image.");
      setPending((current) => ({ ...current, [media]: false }));
    };
    reader.readAsDataURL(file.file);
  }
  function validateFields(fields: readonly SettingsFieldDefinition[]) {
    return fields.map((field) => ({
      ...field,
      error:
        field.type === "email" && !validEmail(String(draft.values[field.id] ?? ""))
          ? "Enter a valid email address."
          : undefined,
      badge:
        field.id === "plan" ? (
          <Badge variant="secondary" size="sm" aria-hidden="true">
            Current
          </Badge>
        ) : field.id === "email" ? (
          <Badge
            variant={draft.values.email === snapshot.values.email ? "success-light" : "secondary"}
            size="sm"
            aria-hidden="true"
          >
            {draft.values.email === snapshot.values.email ? "Verified" : "Unverified draft"}
          </Badge>
        ) : (
          field.badge
        ),
    }));
  }
  function renderFields(config: readonly SettingsFieldDefinition[]) {
    return validateFields(config).map((field) => {
      const choices = workflowAccountOptions(kind, field.id);
      if (!choices.length)
        return (
          <SettingsFields
            key={field.id}
            fields={[field]}
            value={draft.values}
            onValueChange={change}
            idPrefix={idPrefix}
          />
        );
      const id = `${idPrefix}-${field.id}`;
      return (
        <SettingsRow
          key={field.id}
          id={id}
          title={field.label}
          description={field.description}
          badge={field.badge}
        >
          <Select
            value={String(draft.values[field.id] ?? "")}
            onValueChange={(next) => change(field.id, next)}
          >
            <SelectTrigger
              id={id}
              className="w-full"
              aria-describedby={field.description ? `${id}-description` : undefined}
            >
              <SelectValue>{String(draft.values[field.id] ?? "")}</SelectValue>
            </SelectTrigger>
            <SelectContent
              className="wf-account-options reui-reference"
              position="popper"
              align="start"
            >
              <SelectGroup>
                {choices.map((option) => (
                  <SelectItem value={option.label} key={option.label}>
                    <span className="wf-account-option">
                      <span>{option.label}</span>
                      <small>{option.description}</small>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsRow>
      );
    });
  }
  const invalid =
    !String(draft.values.fullName).trim() ||
    ["email", "billingEmail", ...(kind === "tempo" ? ["supportEmail"] : [])].some(
      (id) => !validEmail(String(draft.values[id] ?? "")),
    );
  const sections = settingsSections.map((entry) => ({
    ...entry,
    description: workflowAccountDescriptions[kind][entry.id],
    icon: <entry.icon data-icon="inline-start" />,
    children:
      entry.id === "profile" ? (
        <>
          <SettingsRow
            title="Profile Photo"
            description={
              kind === "mesh" ? "Shown on boards and docs." : "Shown in comments and mentions."
            }
          >
            <LocalAvatarUpload
              key={`${kind}-avatar`}
              label="Upload profile photo"
              defaultAvatar={draft.avatar}
              onDefaultRemove={() => removeMedia("avatar")}
              onFileChange={(file) => selectMedia("avatar", file)}
            />
          </SettingsRow>
          {renderFields(profile.identity)}
          <SettingsRow
            className="wf-account-public-row"
            title={
              <>
                Public Details
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground"
                        aria-label="About public details"
                      >
                        <Info className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="reui-reference">
                      Role, time zone, and website show on your public profile.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            }
            description={kind === "mesh" ? "Shown with your name." : "Shown across Bricklane."}
          >
            <div className="wf-account-public-details">{renderFields(profile.details)}</div>
          </SettingsRow>
          {renderFields([profile.bio])}
        </>
      ) : (
        <>
          {entry.id === "workspace" && (
            <SettingsRow
              title="Workspace Logo"
              description={
                kind === "mesh"
                  ? "Used on invite and summary emails."
                  : "Used in navigation and shared links."
              }
            >
              <LocalAvatarUpload
                key={`${kind}-logo`}
                className="workspace-settings-logo"
                label="Upload workspace logo"
                defaultAvatar={draft.logo}
                onDefaultRemove={() => removeMedia("logo")}
                onFileChange={(file) => selectMedia("logo", file)}
              />
            </SettingsRow>
          )}
          {renderFields(workflowAccountFields(kind, entry.id))}
        </>
      ),
  }));

  return (
    <SettingsPanel
      sections={sections}
      section={section}
      onSectionChange={(next) => setSection(next as WorkflowAccountSection)}
      value={draft.values}
      onValueChange={change}
      onCancel={onCancel}
      idPrefix={idPrefix}
      saveDisabled={invalid || pending.avatar || pending.logo}
      onSave={(values) => onSave(copySnapshot({ ...draft, values }))}
      renderHeader={(active) => (
        <DialogHeader className="workspace-settings-header">
          <DialogTitle>{active.title}</DialogTitle>
          <DialogDescription>{active.description}</DialogDescription>
        </DialogHeader>
      )}
      renderFooter={(actions) => (
        <DialogFooter className="workspace-settings-footer">
          {mediaError && (
            <p role="alert" className="wf-account-media-error">
              {mediaError}
            </p>
          )}
          {(pending.avatar || pending.logo) && (
            <span role="status" className="wf-account-pending">
              Preparing image…
            </span>
          )}
          {actions}
        </DialogFooter>
      )}
    />
  );
}
