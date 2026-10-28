import { useRef } from "react";
import { CodeBlockCopyButton } from "@/components/reui/code-block/code-block";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldDescription, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Item, ItemGroup } from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import { SettingsRow } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { FluxWebhookSettings } from "@/templates/workflow/flux-settings-webhooks";
import { verveWebhookEvents } from "./verve-configuration-data";
import type { VerveConfigurationModel } from "./verve-configuration-model";
import "./verve-configuration.css";

export function VerveSettingsWebhooks({ model }: { model: VerveConfigurationModel }) {
  const returnFocus = useRef<HTMLElement | null>(null);
  const openEndpointDialog = () => {
    returnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    model.openEndpointDialog();
  };
  const draft = model.endpointDraft;
  const errors = model.endpointErrors;
  const allSelected = draft.events.length === verveWebhookEvents.length;
  return (
    <section className="vv-config vv-webhooks">
      <FluxWebhookSettings model={model.webhookModel} onAddEndpoint={openEndpointDialog} />
      <p className="vv-config-status" role="status">
        {model.status}
      </p>
      <Sheet open={model.endpointDialogOpen} onOpenChange={model.setEndpointDialogOpen}>
        <SheetContent
          className="reui-reference vv-endpoint-sheet"
          onCloseAutoFocus={(event) => {
            if (returnFocus.current?.isConnected) {
              event.preventDefault();
              returnFocus.current.focus();
            }
          }}
        >
          <SheetHeader>
            <SheetTitle>Add endpoint</SheetTitle>
            <SheetDescription>Add a destination URL and subscribe it to events.</SheetDescription>
          </SheetHeader>
          <form
            id="vv-endpoint-form"
            className="vv-config-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              model.addEndpoint();
            }}
          >
            <FieldGroup>
              <SettingsRow
                id="vv-endpoint-name"
                title="Endpoint name"
                invalid={Boolean(errors.name)}
              >
                <Input
                  id="vv-endpoint-name"
                  placeholder="Pipeline Sync"
                  value={draft.name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "vv-endpoint-name-error" : undefined}
                  onChange={(event) => model.updateEndpointDraft("name", event.target.value)}
                />
                {errors.name && <FieldError id="vv-endpoint-name-error">{errors.name}</FieldError>}
              </SettingsRow>
              <SettingsRow
                id="vv-endpoint-url"
                title="Payload URL"
                invalid={Boolean(errors.hostPath)}
              >
                <InputGroup>
                  <InputGroupAddon>https://</InputGroupAddon>
                  <InputGroupInput
                    id="vv-endpoint-url"
                    placeholder="studio.bricklane.test/webhooks/..."
                    value={draft.hostPath}
                    aria-invalid={Boolean(errors.hostPath)}
                    aria-describedby={errors.hostPath ? "vv-endpoint-url-error" : undefined}
                    onChange={(event) => model.updateEndpointDraft("hostPath", event.target.value)}
                  />
                </InputGroup>
                {errors.hostPath && (
                  <FieldError id="vv-endpoint-url-error">{errors.hostPath}</FieldError>
                )}
              </SettingsRow>
              <SettingsRow title="Subscribed events" invalid={Boolean(errors.events)}>
                <ItemGroup className="vv-event-list" role="group" aria-label="Subscribed events">
                  <Item asChild size="xs">
                    <label className="vv-checkbox-option">
                      <Checkbox
                        checked={allSelected ? true : draft.events.length ? "indeterminate" : false}
                        onCheckedChange={(checked) =>
                          model.updateEndpointDraft(
                            "events",
                            checked === true ? [...verveWebhookEvents] : [],
                          )
                        }
                      />
                      Select all{" "}
                      <span className="vv-config-count">{draft.events.length} selected</span>
                    </label>
                  </Item>
                  {verveWebhookEvents.map((eventName) => (
                    <Item asChild size="xs" key={eventName}>
                      <label className="vv-checkbox-option">
                        <Checkbox
                          checked={draft.events.includes(eventName)}
                          onCheckedChange={(checked) =>
                            model.updateEndpointDraft(
                              "events",
                              checked === true
                                ? [...draft.events, eventName]
                                : draft.events.filter((value) => value !== eventName),
                            )
                          }
                        />
                        <span className="font-mono">{eventName}</span>
                      </label>
                    </Item>
                  ))}
                </ItemGroup>
                {errors.events && <FieldError>{errors.events}</FieldError>}
              </SettingsRow>
              <SettingsRow
                id="vv-endpoint-secret"
                title="Signing secret"
                description="We sign every request with this secret."
                invalid={Boolean(errors.signingSecret)}
              >
                <InputGroup>
                  <InputGroupInput
                    id="vv-endpoint-secret"
                    value={draft.signingSecret}
                    aria-invalid={Boolean(errors.signingSecret)}
                    aria-describedby="vv-endpoint-secret-description"
                    onChange={(event) =>
                      model.updateEndpointDraft("signingSecret", event.target.value)
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <CodeBlockCopyButton
                      value={draft.signingSecret}
                      labels={{ copy: "Copy signing secret", copied: "Signing secret copied" }}
                      position="inline"
                      size="icon-xs"
                    />
                  </InputGroupAddon>
                </InputGroup>
                {errors.signingSecret && <FieldError>{errors.signingSecret}</FieldError>}
              </SettingsRow>
              <SettingsRow
                id="vv-endpoint-enabled"
                className="vv-enable-endpoint"
                title="Enable immediately"
                description="Start delivering events as soon as it is added."
              >
                <Switch
                  id="vv-endpoint-enabled"
                  checked={draft.enabled}
                  aria-describedby="vv-endpoint-enabled-description"
                  onCheckedChange={(checked) => model.updateEndpointDraft("enabled", checked)}
                />
              </SettingsRow>
            </FieldGroup>
            <FieldDescription>
              This preview stores a local configuration. It does not send webhook requests.
            </FieldDescription>
          </form>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => model.setEndpointDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="vv-endpoint-form">
              Add endpoint
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  );
}
