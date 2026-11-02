import { useId, useState } from "react";
import { DialogSurface } from "@/blocks/application/dialog-variants/first-run/free/dialog-surface";
import { SettingsChoice } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { commerceAdditionalProviders } from "./commerce-settings-finance-data";
import type { CommerceSettingsModel } from "./commerce-settings-model";
import "@/blocks/application/dialog-variants/first-run/first-run.css";

/** The free ReUI dialog composition edits only a provider directory entry; no credentials. */
export function CommerceProviderDialog({ model }: { model: CommerceSettingsModel }) {
  const available = commerceAdditionalProviders.filter(
    (entry) => !model.providers.some((provider) => provider.id === entry.id),
  );
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState<string>(available[0]?.id ?? "");
  const [name, setName] = useState<string>(available[0]?.name ?? "");
  const [error, setError] = useState("");
  const id = useId();
  const formId = useId();
  const selected = available.find((entry) => entry.id === providerId);
  function reset() {
    setProviderId(available[0]?.id ?? "");
    setName(available[0]?.name ?? "");
    setError("");
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) reset();
        setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button
          title={!available.length ? "All local demo providers are already added" : undefined}
        >
          Add provider
        </Button>
      </DialogTrigger>
      <DialogSurface
        id={304}
        title="Add demo provider"
        description="Add a payment provider to this local demo."
        footer={
          <>
            <Button variant="outline" onClick={reset}>
              Reset
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" form={formId} disabled={!available.length}>
              Add provider
            </Button>
          </>
        }
      >
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const message = model.addProvider(providerId, name);
            setError(message ?? "");
            if (!message) setOpen(false);
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${id}-provider`}>Provider</FieldLabel>
              <SettingsChoice
                id={`${id}-provider`}
                value={selected?.name ?? ""}
                options={available.map((entry) => entry.name)}
                onChange={(label) => {
                  const provider = available.find((entry) => entry.name === label);
                  if (provider) {
                    setProviderId(provider.id);
                    setName(provider.name);
                  }
                  setError("");
                }}
                describedBy={`${id}-description`}
                disabled={!available.length}
              />
              <FieldDescription id={`${id}-description`}>
                {selected?.description ?? "All local demo providers have already been added."}
              </FieldDescription>
            </Field>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor={`${id}-name`}>Provider display name</FieldLabel>
              <Input
                id={`${id}-name`}
                value={name}
                maxLength={80}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
              />
              {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
            </Field>
          </FieldGroup>
        </form>
      </DialogSurface>
    </Dialog>
  );
}
