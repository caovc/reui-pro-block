import {
  SettingsChoice,
  SettingsRow,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DriveApprovers, DriveRichChoice } from "@/templates/collaboration/drive-settings-free";
import { DriveSettingsDialog } from "@/templates/collaboration/drive-settings-components";
import {
  verveKeyOwners,
  verveKeyEnvironments,
  verveKeyExpirations,
  verveKeyScopes,
  verveKeyStacks,
  verveStackDescriptions,
  type VerveKeyStack,
} from "./verve-configuration-data";
import type { VerveConfigurationModel } from "./verve-configuration-model";

export function VerveKeyDialog({
  model,
  returnFocus,
}: {
  model: VerveConfigurationModel;
  returnFocus?: HTMLElement | null;
}) {
  const draft = model.keyDraft;
  const errors = model.keyErrors;
  return (
    <DriveSettingsDialog
      title="Create API Key"
      description="Generate a stack-scoped key with only the permissions it needs."
      onClose={() => model.setKeyDialogOpen(false)}
      returnFocus={returnFocus}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => model.setKeyDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="vv-key-create-form">
            Create Key
          </Button>
        </>
      }
    >
      <form
        id="vv-key-create-form"
        noValidate
        className="vv-config-form"
        onSubmit={(event) => {
          event.preventDefault();
          model.createKey();
        }}
      >
        <FieldGroup>
          <SettingsRow
            id="vv-key-name"
            title="Key name"
            description="Use a service or workflow name."
            invalid={Boolean(errors.name)}
          >
            <Input
              id="vv-key-name"
              placeholder="Pipeline sync worker"
              value={draft.name}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name
                  ? "vv-key-name-description vv-key-name-error"
                  : "vv-key-name-description"
              }
              onChange={(event) => model.updateKeyDraft("name", event.target.value)}
            />
            {errors.name && <FieldError id="vv-key-name-error">{errors.name}</FieldError>}
          </SettingsRow>
          <SettingsRow
            id="vv-key-stack"
            title="Stack"
            description={verveStackDescriptions[draft.stack]}
          >
            <DriveRichChoice
              id="vv-key-stack"
              value={draft.stack}
              options={verveKeyStacks.map(
                (stack) => [stack, verveStackDescriptions[stack]] as const,
              )}
              onChange={(value) => model.updateKeyDraft("stack", value as VerveKeyStack)}
            />
          </SettingsRow>
          <SettingsRow
            id="vv-key-environment"
            title="Environment"
            description={verveKeyEnvironments.find(([value]) => value === draft.environment)?.[1]}
          >
            <DriveRichChoice
              id="vv-key-environment"
              value={draft.environment}
              options={verveKeyEnvironments}
              onChange={(value) => model.updateKeyDraft("environment", value)}
            />
          </SettingsRow>
          <SettingsRow id="vv-key-expiration" title="Expiration">
            <SettingsChoice
              id="vv-key-expiration"
              value={draft.expiration}
              options={verveKeyExpirations}
              onChange={(value) => model.updateKeyDraft("expiration", value)}
            />
          </SettingsRow>
          <SettingsRow
            title="Access owners"
            badge={<span className="vv-config-count">{draft.owners.length} assigned</span>}
            description="People who can view, rotate, or revoke this key."
            invalid={Boolean(errors.owners)}
          >
            <DriveApprovers
              inputLabel="Access owners"
              value={draft.owners}
              onChange={(value) => model.updateKeyDraft("owners", value)}
              members={verveKeyOwners}
            />
            {errors.owners && <FieldError>{errors.owners}</FieldError>}
          </SettingsRow>
          <SettingsRow
            title="Scopes"
            badge={<span className="vv-config-count">{draft.scopes.length} selected</span>}
            invalid={Boolean(errors.scopes)}
          >
            <FieldGroup className="vv-scope-grid">
              {verveKeyScopes.map((scope) => (
                <FieldLabel key={scope}>
                  <Field orientation="horizontal">
                    <Checkbox
                      checked={draft.scopes.includes(scope)}
                      onCheckedChange={(checked) =>
                        model.updateKeyDraft(
                          "scopes",
                          checked === true
                            ? [...draft.scopes, scope]
                            : draft.scopes.filter((value) => value !== scope),
                        )
                      }
                    />
                    <FieldContent>
                      <FieldTitle>{scope}</FieldTitle>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              ))}
            </FieldGroup>
            {errors.scopes && <FieldError>{errors.scopes}</FieldError>}
          </SettingsRow>
        </FieldGroup>
        <FieldDescription>
          Created keys are local dummy credentials and cannot access a service.
        </FieldDescription>
      </form>
    </DriveSettingsDialog>
  );
}
