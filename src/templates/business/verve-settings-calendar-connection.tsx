import { useRef, useState } from "react";
import { SettingsChoice } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DriveSettingsDialog } from "@/templates/collaboration/drive-settings-components";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { verveCalendarProviders, type VerveCalendarModel } from "./verve-settings-calendar-model";

export function VerveCalendarConnection({ model }: { model: VerveCalendarModel }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [returnFocus, setReturnFocus] = useState<HTMLButtonElement | null>(null);
  const disconnecting = useRef(false);
  return (
    <>
      <Button
        ref={trigger}
        type="button"
        variant="outline"
        aria-label={model.connection ? "Manage demo calendar" : "Connect demo calendar"}
        onClick={(event) => {
          setReturnFocus(event.currentTarget);
          model.begin();
          setOpen(true);
        }}
      >
        {model.connection ? "Manage calendar" : "Connect"}
      </Button>
      {model.connection && (
        <AlertDialog
          onOpenChange={(next) => {
            if (next) disconnecting.current = false;
          }}
        >
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" aria-label="Disconnect demo calendar">
              Disconnect
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent
            className="reui-reference"
            onCloseAutoFocus={(event) => {
              const target = disconnecting.current ? trigger.current : null;
              if (target?.isConnected) {
                target.focus();
                if (target.ownerDocument.activeElement === target) event.preventDefault();
              }
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect demo calendar?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes only the saved local connection for {model.connection.account}. No
                external account or calendar will be changed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep connected</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  disconnecting.current = true;
                  model.disconnect();
                }}
              >
                Disconnect locally
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {open && (
        <DriveSettingsDialog
          title={model.connection ? "Manage demo calendar" : "Connect demo calendar"}
          description="Choose a provider and account for this local preview. This does not sign in, request calendar permissions or sync events."
          returnFocus={returnFocus}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="verve-calendar-connection-form">
                Save local connection
              </Button>
            </>
          }
        >
          <form
            id="verve-calendar-connection-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (model.save()) setOpen(false);
            }}
          >
            <FieldGroup>
              <Alert>
                <AlertTitle>Local calendar demo</AlertTitle>
                <AlertDescription>
                  Connection state stays in this preview session. No events are read, created or
                  shared.
                </AlertDescription>
              </Alert>
              <Field data-invalid={Boolean(model.errors.provider)}>
                <FieldLabel htmlFor="verve-calendar-provider">Provider</FieldLabel>
                <SettingsChoice
                  id="verve-calendar-provider"
                  value={model.draft.provider}
                  options={verveCalendarProviders}
                  invalid={Boolean(model.errors.provider)}
                  onChange={(value) =>
                    model.update("provider", value as typeof model.draft.provider)
                  }
                />
                {model.errors.provider && <FieldError>{model.errors.provider}</FieldError>}
              </Field>
              {(
                [
                  { id: "account", label: "Calendar account", type: "email" },
                  { id: "calendar", label: "Calendar name", type: "text" },
                ] as const
              ).map((field) => (
                <Field key={field.id} data-invalid={Boolean(model.errors[field.id])}>
                  <FieldLabel htmlFor={`verve-calendar-${field.id}`}>{field.label}</FieldLabel>
                  <Input
                    id={`verve-calendar-${field.id}`}
                    type={field.type}
                    value={model.draft[field.id]}
                    maxLength={120}
                    onChange={(event) => model.update(field.id, event.target.value)}
                    aria-invalid={Boolean(model.errors[field.id])}
                    aria-describedby={
                      model.errors[field.id] ? `verve-calendar-${field.id}-error` : undefined
                    }
                  />
                  {model.errors[field.id] && (
                    <FieldError id={`verve-calendar-${field.id}-error`}>
                      {model.errors[field.id]}
                    </FieldError>
                  )}
                </Field>
              ))}
            </FieldGroup>
          </form>
        </DriveSettingsDialog>
      )}
    </>
  );
}
