import { Fragment, useId, useState, type FormEvent } from "react";
import { CircleDollarSign, Database, Globe, Link, RotateCcw, Trash2, Upload } from "lucide-react";
import {
  SettingsChoice,
  SettingsFields,
  SettingsRow,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { ColorPicker, ColorPickerSwatches } from "@/components/reui/color-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  commerceBrandColors,
  commerceCurrencies,
  commerceDateFormats,
  commerceGeneralFields,
  commerceRegions,
  commerceStorefrontPreferences,
  commerceTimezones,
  type CommerceDemoDataAction,
} from "./commerce-settings-general-data";
import type { CommerceGeneralSettingsModel } from "./commerce-settings-general-model";
import "@/blocks/reference.css";
import "./commerce-settings-general.css";

function CommerceLogoURL({ model }: { model: CommerceGeneralSettingsModel }) {
  const [open, setOpen] = useState(false);
  const [url, setURL] = useState("");
  const [error, setError] = useState("");
  const inputId = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React portal events still bubble through the outer General form.
    event.stopPropagation();
    const result = model.importLogoURL(url);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setURL(model.draft.logo.startsWith("https://") ? model.draft.logo : "");
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Link aria-hidden="true" />
          Import from URL
        </Button>
      </DialogTrigger>
      <DialogContent className="reui-reference csg-logo-url-dialog">
        <DialogHeader>
          <DialogTitle>Import logo from URL</DialogTitle>
          <DialogDescription>
            Preview an image you own or have permission to use. This only changes the local store
            preview.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <Field>
            <FieldLabel htmlFor={inputId}>Image URL</FieldLabel>
            <Input
              id={inputId}
              type="url"
              required
              value={url}
              placeholder="https://your-domain.example/logo.png"
              onChange={(event) => {
                setURL(event.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={`${inputId}-help${error ? ` ${inputId}-error` : ""}`}
            />
            <FieldDescription id={`${inputId}-help`}>
              Use HTTPS. ReUI and KeenThemes preview assets are excluded.
            </FieldDescription>
            {error && <FieldError id={`${inputId}-error`}>{error}</FieldError>}
          </Field>
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim()}>
              Use image URL
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Inline General page; the parent owns navigation, this model and real demo-data mutations. */
export function CommerceGeneralSettings({
  model,
  onDemoDataAction,
}: {
  model: CommerceGeneralSettingsModel;
  onDemoDataAction?: (action: CommerceDemoDataAction) => void;
}) {
  const { draft, change } = model;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    model.save();
  }

  return (
    <section
      className="commerce-general-page reui-reference"
      aria-labelledby="commerce-general-heading"
    >
      <h1 id="commerce-general-heading">General</h1>
      <form onSubmit={submit} noValidate>
        <Frame dense className="csg-frame">
          <FrameHeader>
            <FrameTitle>Store profile</FrameTitle>
            <FrameDescription>Name, domain, branding, and regional defaults.</FrameDescription>
          </FrameHeader>
          <FramePanel className="csg-panel" fit>
            <FieldGroup className="csg-fields">
              {commerceGeneralFields.map((field, index) => (
                <Fragment key={field.id}>
                  {index > 0 && <FieldSeparator />}
                  <SettingsFields
                    fields={[{ ...field, error: model.errors[field.id as "name" | "domain"] }]}
                    value={draft}
                    onValueChange={(key, value) => {
                      if (key === "name" || key === "domain") change(key, String(value));
                    }}
                  />
                </Fragment>
              ))}
              <FieldSeparator />
              <SettingsRow
                id="commerce-general-timezone"
                title="Timezone"
                description="Used for order timestamps, reports, and scheduling."
              >
                <SettingsChoice
                  id="commerce-general-timezone"
                  value={draft.timezone}
                  options={commerceTimezones}
                  onChange={(value) => change("timezone", value)}
                  describedBy="commerce-general-timezone-description"
                />
              </SettingsRow>
              <FieldSeparator />
              <SettingsRow
                title="Store logo"
                description="Shown in the storefront header, checkout, and emails."
              >
                <div className="csg-logo-controls">
                  {draft.logo && (
                    <img
                      className="csg-logo-preview"
                      src={draft.logo}
                      alt="Store logo preview"
                      onError={model.reportLogoLoadError}
                    />
                  )}
                  <div className="csg-logo-actions">
                    <input
                      {...model.upload.getInputProps({ "aria-label": "Choose store logo" })}
                      className="sr-only"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={model.upload.openFileDialog}
                      disabled={model.pending}
                    >
                      <Upload aria-hidden="true" />
                      {model.pending ? "Reading logo…" : "Upload logo"}
                    </Button>
                    <CommerceLogoURL model={model} />
                  </div>
                </div>
                {(model.errors.logo || model.uploadErrors.length > 0) && (
                  <FieldError>{model.errors.logo || model.uploadErrors.join(" ")}</FieldError>
                )}
              </SettingsRow>
              <FieldSeparator />
              <SettingsRow
                title="Brand color"
                description="Select a color to represent your store."
              >
                <ColorPicker
                  value={draft.brandColor}
                  onValueChange={(value) => value && change("brandColor", value)}
                  aria-label="Brand color"
                  i18n={{ labels: { swatches: "Brand color" } }}
                >
                  <ColorPickerSwatches
                    colors={commerceBrandColors}
                    shape="circle"
                    className="csg-brand-colors"
                  />
                </ColorPicker>
              </SettingsRow>
              <FieldSeparator />
              <SettingsRow
                title="Region & currency"
                description="Adjust your regional preferences and store currency."
              >
                <FieldSet className="csg-regional-fields" aria-label="Region and currency">
                  <FieldLegend className="sr-only">Region and currency</FieldLegend>
                  <FieldDescription className="sr-only">
                    Regional and financial formatting preferences.
                  </FieldDescription>
                  <Field>
                    <FieldLabel htmlFor="commerce-general-region">Region</FieldLabel>
                    <div className="csg-icon-choice">
                      <Globe aria-hidden="true" />
                      <SettingsChoice
                        id="commerce-general-region"
                        value={draft.region}
                        options={commerceRegions}
                        onChange={(value) => change("region", value)}
                      />
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="commerce-general-currency">Currency</FieldLabel>
                    <div className="csg-icon-choice">
                      <CircleDollarSign aria-hidden="true" />
                      <SettingsChoice
                        id="commerce-general-currency"
                        value={draft.currency}
                        options={commerceCurrencies}
                        onChange={(value) => change("currency", value)}
                      />
                    </div>
                  </Field>
                </FieldSet>
              </SettingsRow>
              <FieldSeparator />
              <SettingsRow
                title="Date display format"
                description="Choose how dates appear in the admin and on receipts."
              >
                <div className="csg-date-scroll">
                  <ToggleGroup
                    type="single"
                    value={draft.dateFormat}
                    onValueChange={(value) => {
                      const format = commerceDateFormats.find((entry) => entry === value);
                      if (format) change("dateFormat", format);
                    }}
                    variant="outline"
                    size="sm"
                    spacing={2}
                    aria-label="Date display format"
                    className="csg-date-options"
                  >
                    {commerceDateFormats.map((format) => (
                      <ToggleGroupItem key={format} value={format}>
                        {format}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </SettingsRow>
              <FieldSeparator />
              <SettingsRow
                title="Storefront preferences"
                description="Control how prices and the storefront are displayed."
              >
                <FieldSet className="csg-storefront-fields" aria-label="Storefront preferences">
                  <FieldLegend className="sr-only">Storefront preferences</FieldLegend>
                  <FieldDescription className="sr-only">
                    Configure storefront visibility and display options.
                  </FieldDescription>
                  {commerceStorefrontPreferences.map((preference) => {
                    const id = `commerce-general-${preference.id}`;
                    return (
                      <Field key={id} orientation="horizontal" className="csg-storefront-option">
                        <Switch
                          id={id}
                          checked={draft[preference.id]}
                          onCheckedChange={(value) => change(preference.id, value)}
                          aria-describedby={`${id}-description`}
                        />
                        <FieldContent>
                          <FieldLabel htmlFor={id}>{preference.title}</FieldLabel>
                          <FieldDescription id={`${id}-description`}>
                            {preference.description}
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    );
                  })}
                </FieldSet>
              </SettingsRow>
            </FieldGroup>
          </FramePanel>
          <FrameFooter>
            <Button type="button" variant="outline" onClick={model.reset}>
              Reset
            </Button>
            <Button type="submit" disabled={model.pending}>
              Save changes
            </Button>
          </FrameFooter>
        </Frame>
      </form>
      <p className="sr-only" role="status">
        {model.status}
      </p>
      {onDemoDataAction && (
        <Frame dense className="csg-frame csg-demo-frame">
          <FrameHeader>
            <FrameTitle>Demo data</FrameTitle>
            <FrameDescription>Sample data, held for this session</FrameDescription>
          </FrameHeader>
          <FramePanel fit className="csg-demo-content">
            <p>
              Loading keeps anything you have created yourself: it fills only the sections that are
              still empty.
            </p>
            <div className="csg-demo-actions">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onDemoDataAction("load")}
              >
                <Database aria-hidden="true" />
                Load demo data
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onDemoDataAction("reset")}
              >
                <RotateCcw aria-hidden="true" />
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onDemoDataAction("clear")}
              >
                <Trash2 aria-hidden="true" />
                Clear
              </Button>
            </div>
          </FramePanel>
        </Frame>
      )}
    </section>
  );
}
