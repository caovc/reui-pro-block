import { SettingsChoice } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VerveSettingsSheet } from "./verve-settings-people-billing-surfaces";
import {
  verveMemberAuthentication,
  verveMemberBilling,
  verveMemberDate,
  verveMemberRoles,
} from "./verve-settings-people-billing-data";
import type { VerveMemberActionsModel } from "./verve-settings-member-actions-model";

export function VerveMemberActionSurfaces({ model }: { model: VerveMemberActionsModel }) {
  const member = model.member;
  const edit = model.selection?.kind === "edit";
  const deleteMode = model.selection?.kind === "delete";
  return (
    <>
      <Sheet open={model.open && !deleteMode} onOpenChange={(open) => !open && model.close()}>
        <VerveSettingsSheet
          title={edit ? "Edit member" : "Member details"}
          description="Changes affect this local CRM preview only; real access remains unchanged."
          onCloseAutoFocus={model.restoreFocus}
          footer={
            <>
              <SheetClose render={<Button type="button" variant="outline" />}>
                {edit ? "Cancel" : "Close"}
              </SheetClose>
              {edit ? (
                <Button type="submit" form="verve-member-edit-form">
                  Save member
                </Button>
              ) : (
                <Button type="button" onClick={model.edit}>
                  Edit member
                </Button>
              )}
            </>
          }
        >
          {edit ? (
            <form
              id="verve-member-edit-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                model.save();
              }}
            >
              <FieldGroup>
                {(
                  [
                    { id: "name", label: "Full name" },
                    { id: "username", label: "Username" },
                    { id: "email", label: "Email address" },
                  ] as const
                ).map((field) => (
                  <Field key={field.id} data-invalid={Boolean(model.errors[field.id])}>
                    <FieldLabel htmlFor={`verve-member-${field.id}`}>{field.label}</FieldLabel>
                    <Input
                      id={`verve-member-${field.id}`}
                      type={field.id === "email" ? "email" : "text"}
                      value={model.draft[field.id]}
                      maxLength={field.id === "username" ? 80 : 120}
                      onChange={(event) => model.update(field.id, event.target.value)}
                      aria-invalid={Boolean(model.errors[field.id])}
                      aria-describedby={
                        model.errors[field.id] ? `verve-member-${field.id}-error` : undefined
                      }
                    />
                    {model.errors[field.id] && (
                      <FieldError id={`verve-member-${field.id}-error`}>
                        {model.errors[field.id]}
                      </FieldError>
                    )}
                  </Field>
                ))}
                {(
                  [
                    { id: "role", label: "Role", options: verveMemberRoles },
                    { id: "billing", label: "Billing status", options: verveMemberBilling },
                    {
                      id: "authentication",
                      label: "Authentication method",
                      options: verveMemberAuthentication,
                    },
                  ] as const
                ).map((field) => (
                  <Field key={field.id} data-invalid={Boolean(model.errors[field.id])}>
                    <FieldLabel htmlFor={`verve-member-${field.id}`}>{field.label}</FieldLabel>
                    <SettingsChoice
                      id={`verve-member-${field.id}`}
                      value={model.draft[field.id]}
                      options={field.options}
                      invalid={Boolean(model.errors[field.id])}
                      describedBy={
                        model.errors[field.id] ? `verve-member-${field.id}-error` : undefined
                      }
                      onChange={(value) => {
                        if (field.id === "role")
                          model.update("role", value as typeof model.draft.role);
                        else if (field.id === "billing")
                          model.update("billing", value as typeof model.draft.billing);
                        else
                          model.update(
                            "authentication",
                            value as typeof model.draft.authentication,
                          );
                      }}
                    />
                    {model.errors[field.id] && (
                      <FieldError id={`verve-member-${field.id}-error`}>
                        {model.errors[field.id]}
                      </FieldError>
                    )}
                  </Field>
                ))}
              </FieldGroup>
            </form>
          ) : (
            member && (
              <dl className="grid gap-4" aria-label="Member record">
                {[
                  ["Full name", member.name],
                  ["Username", member.username],
                  ["Email address", member.email],
                  ["Role", member.role],
                  ["Billing status", member.billing],
                  ["Authentication", member.authentication],
                  ["Joined", verveMemberDate(member.joined)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            )
          )}
        </VerveSettingsSheet>
      </Sheet>
      <AlertDialog open={model.open && deleteMode} onOpenChange={(open) => !open && model.close()}>
        <AlertDialogContent className="reui-reference" onCloseAutoFocus={model.restoreFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {member?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the member from this local preview. No real account or workspace access
              will be changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field data-invalid={Boolean(model.deleteError)}>
            <FieldLabel htmlFor="verve-member-delete-confirmation">Confirm member email</FieldLabel>
            <Input
              id="verve-member-delete-confirmation"
              value={model.deleteConfirmation}
              onChange={(event) => model.setDeleteConfirmation(event.target.value)}
              autoComplete="off"
              aria-invalid={Boolean(model.deleteError)}
              aria-describedby="verve-member-delete-hint"
            />
            <FieldDescription id="verve-member-delete-hint">
              Enter {member?.email} to confirm.
            </FieldDescription>
            {model.deleteError && <FieldError role="alert">{model.deleteError}</FieldError>}
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                if (!model.remove()) event.preventDefault();
              }}
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
