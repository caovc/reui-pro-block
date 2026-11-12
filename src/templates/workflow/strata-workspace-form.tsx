import { useId, useRef, useState, type FormEvent, type RefObject } from "react";
import { BrandGlyph } from "@/components/brand-mark";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StrataEnvironment } from "./strata-domain";
import {
  STRATA_WORKSPACE_ENVIRONMENTS,
  STRATA_WORKSPACE_REGIONS,
  type StrataWorkspaceCreateResult,
  type StrataWorkspaceDraft,
} from "./strata-workspaces-model";
import "./strata-workspace-form.css";

export interface StrataWorkspaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (draft: StrataWorkspaceDraft) => StrataWorkspaceCreateResult;
  ownerName: string;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

function WorkspaceFields({
  onOpenChange,
  onCreate,
  ownerName,
  nameRef,
}: Pick<StrataWorkspaceFormProps, "onOpenChange" | "onCreate" | "ownerName"> & {
  nameRef: RefObject<HTMLInputElement | null>;
}) {
  const id = useId();
  const [draft, setDraft] = useState<StrataWorkspaceDraft>({
    name: "",
    environment: "Production",
    region: "EU West",
  });
  const [error, setError] = useState("");
  const update = <K extends keyof StrataWorkspaceDraft>(key: K, value: StrataWorkspaceDraft[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setError("");
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = onCreate(draft);
    if (result.ok) onOpenChange(false);
    else {
      setError(result.error);
      nameRef.current?.focus({ preventScroll: true });
    }
  };
  return (
    <>
      <form noValidate className="strata-workspace-fields" onSubmit={submit}>
        <DialogHeader className="strata-workspace-heading">
          <DialogTitle>Create a workspace</DialogTitle>
          <DialogDescription>
            A workspace keeps one environment&apos;s services, monitors and alerts together.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="strata-workspace-inputs">
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor={`${id}-name`}>Workspace name</FieldLabel>
            <Input
              ref={nameRef}
              id={`${id}-name`}
              value={draft.name}
              placeholder="Bricklane Payments"
              required
              autoComplete="organization"
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(event) => update("name", event.target.value)}
            />
            {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-environment`}>Environment</FieldLabel>
            <Select
              value={draft.environment}
              onValueChange={(value) => update("environment", value as StrataEnvironment)}
            >
              <SelectTrigger id={`${id}-environment`} aria-label="Environment" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRATA_WORKSPACE_ENVIRONMENTS.map((environment) => (
                  <SelectItem key={environment} value={environment}>
                    {environment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-region`}>Region</FieldLabel>
            <Select value={draft.region} onValueChange={(value) => update("region", value)}>
              <SelectTrigger id={`${id}-region`} aria-label="Region" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRATA_WORKSPACE_REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <footer className="strata-workspace-footer">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Create workspace</Button>
        </footer>
      </form>
      <aside className="strata-workspace-preview" aria-label="Workspace preview">
        <Frame className="strata-workspace-preview-frame">
          <FramePanel fit className="strata-workspace-preview-card">
            <div className="strata-workspace-preview-title">
              <span className="strata-workspace-preview-mark" aria-hidden="true">
                <BrandGlyph />
              </span>
              <div>
                <strong>{draft.name.trim() || "New workspace"}</strong>
                <span>
                  {draft.environment} · {draft.region}
                </span>
              </div>
            </div>
            <dl>
              <div>
                <dt>Environment</dt>
                <dd>{draft.environment}</dd>
              </div>
              <div>
                <dt>Region</dt>
                <dd>{draft.region}</dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>{ownerName}</dd>
              </div>
            </dl>
          </FramePanel>
        </Frame>
      </aside>
    </>
  );
}

export function StrataWorkspaceForm({
  open,
  onOpenChange,
  onCreate,
  ownerName,
  returnFocusRef,
}: StrataWorkspaceFormProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="strata-workspace-dialog"
        onOpenAutoFocus={(event) => {
          previousFocus.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
          if (nameRef.current) {
            event.preventDefault();
            nameRef.current.focus({ preventScroll: true });
          }
        }}
        onCloseAutoFocus={(event) => {
          const targets = [returnFocusRef?.current, previousFocus.current];
          const target = targets.find(
            (element) =>
              element?.isConnected &&
              element.getClientRects().length > 0 &&
              !element.matches(":disabled, [aria-disabled=true], [inert]"),
          );
          if (target) {
            event.preventDefault();
            target.focus({ preventScroll: true });
          }
        }}
      >
        <WorkspaceFields
          onOpenChange={onOpenChange}
          onCreate={onCreate}
          ownerName={ownerName}
          nameRef={nameRef}
        />
      </DialogContent>
    </Dialog>
  );
}
