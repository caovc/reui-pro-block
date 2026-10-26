import { Fragment, useState } from "react";
import { CircleDollarSign, Globe, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  SettingsChoice,
  SettingsFields,
  SettingsRow,
  type SettingsValue,
  type SettingsValues,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { ColorPicker, ColorPickerSwatches } from "@/components/reui/color-picker";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFileUpload } from "@/hooks/use-file-upload";
import {
  lucentAccentColors,
  lucentCurrencies,
  lucentDateFormats,
  lucentGeneralFields,
  lucentInitialOrigins,
  lucentInitialPreferences,
  lucentInterfacePreferences,
  lucentRegions,
} from "./lucent-preferences-data";
import { LucentOriginsDialog } from "./lucent-origins-dialog";

export function LucentGeneralSettings() {
  const [draft, setDraft] = useState<SettingsValues>({ ...lucentInitialPreferences });
  const [origins, setOrigins] = useState([...lucentInitialOrigins]);
  const [saved, setSaved] = useState<{ values: SettingsValues; origins: string[] } | null>(null);
  const [error, setError] = useState("");
  const [importNotice, setImportNotice] = useState("");
  const [uploadState, upload] = useFileUpload({
    accept: ".txt,.csv,text/plain,text/csv",
    maxSize: 1024 * 1024,
    onFilesAdded: ([file]) => {
      if (file) {
        if (file.preview && file.file instanceof File) URL.revokeObjectURL(file.preview);
        setImportNotice(
          `${file.file.name} selected. File import is not available in this local demo; add origins manually.`,
        );
      }
    },
  });

  function change(id: string, value: SettingsValue) {
    setDraft((current) => ({ ...current, [id]: value }));
    setError("");
  }

  function reset() {
    setDraft({ ...lucentInitialPreferences });
    setSaved(null);
    setOrigins([...lucentInitialOrigins]);
    setError("");
    setImportNotice("");
    upload.clearFiles();
    toast.success("Changes discarded", {
      description: "Workspace preferences restored to defaults.",
    });
  }

  return (
    <form
      className="wf-lucent-general"
      onSubmit={(event) => {
        event.preventDefault();
        if (!String(draft.projectName).trim() || !String(draft.apiEndpoint).trim()) {
          setError("Enter a project name and an API endpoint before saving.");
          return;
        }
        setError("");
        setSaved({ values: { ...draft }, origins: [...origins] });
        toast.success("Settings saved", { description: "Local workspace preferences updated." });
      }}
    >
      <output className="sr-only" aria-live="polite">
        {saved &&
          `Local preferences saved for ${String(saved.values.projectName)} with ${saved.origins.length} allowed origins.`}
      </output>
      <Frame dense spacing="sm" aria-label="General Settings">
        <FrameHeader>
          <FrameTitle>General Settings</FrameTitle>
          <FrameDescription>Core app preferences.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <FieldGroup className="wf-lucent-general-fields">
            {lucentGeneralFields.map((field) => (
              <Fragment key={field.id}>
                <SettingsFields
                  fields={[
                    field.id === "apiEndpoint"
                      ? { ...field, badge: <Badge variant="outline">Required</Badge> }
                      : field,
                  ]}
                  value={draft}
                  onValueChange={change}
                  idPrefix="lucent-general"
                />
                <FieldSeparator />
              </Fragment>
            ))}
            <SettingsRow
              title="Allowed origins"
              description="Define the trusted domains for CORS requests."
            >
              <div className="wf-lucent-origin-actions">
                <LucentOriginsDialog origins={origins} onChange={setOrigins} />
                <Button type="button" variant="outline" onClick={upload.openFileDialog}>
                  <Upload aria-hidden="true" />
                  Import from file
                </Button>
                <input {...upload.getInputProps({ "aria-label": "Import origins file" })} hidden />
              </div>
              {(importNotice || uploadState.errors.length > 0) && (
                <Alert className="wf-lucent-import-notice">
                  <AlertDescription>
                    {uploadState.errors.length ? uploadState.errors.join(" ") : importNotice}
                  </AlertDescription>
                </Alert>
              )}
            </SettingsRow>
            <FieldSeparator />
            <SettingsRow
              title="Accent color"
              badge={<Badge variant="outline">Upgrade to Team</Badge>}
              description="Select a color to represent your brand."
            >
              <ColorPicker
                value={String(draft.accent)}
                onValueChange={(value) => value && change("accent", value)}
                aria-label="Accent color"
              >
                <ColorPickerSwatches shape="circle" colors={lucentAccentColors} />
              </ColorPicker>
            </SettingsRow>
            <FieldSeparator />
            <SettingsRow
              title="Region & currency"
              description="Adjust your regional preferences and currency."
            >
              <div
                className="wf-lucent-region-fields"
                role="group"
                aria-label="Region and currency"
              >
                <div>
                  <label htmlFor="lucent-region">Region</label>
                  <div className="wf-lucent-icon-select">
                    <Globe aria-hidden="true" />
                    <SettingsChoice
                      id="lucent-region"
                      value={String(draft.region)}
                      options={lucentRegions}
                      onChange={(value) => change("region", value)}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lucent-currency">Currency</label>
                  <div className="wf-lucent-icon-select">
                    <CircleDollarSign aria-hidden="true" />
                    <SettingsChoice
                      id="lucent-currency"
                      value={String(draft.currency)}
                      options={lucentCurrencies}
                      onChange={(value) => change("currency", value)}
                    />
                  </div>
                </div>
              </div>
            </SettingsRow>
            <FieldSeparator />
            <SettingsRow
              title="Date display format"
              description="Choose your preferred format for dates."
            >
              <ToggleGroup
                type="single"
                value={String(draft.dateFormat)}
                onValueChange={(value) => value && change("dateFormat", value)}
                aria-label="Date display format"
                onFocusCapture={(event) => {
                  if (
                    event.target instanceof HTMLElement &&
                    event.target.matches('[role="radio"]')
                  ) {
                    const target = event.target;
                    requestAnimationFrame(() => {
                      if (document.activeElement === target) {
                        target.scrollIntoView({ block: "nearest", inline: "nearest" });
                      }
                    });
                  }
                }}
                variant="outline"
                size="sm"
              >
                {lucentDateFormats.map((format) => (
                  <ToggleGroupItem key={format} value={format} aria-label={format}>
                    {format}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </SettingsRow>
            <FieldSeparator />
            <SettingsRow
              title="Interface preferences"
              description="Adjust your editing environment and display options."
            >
              <div className="wf-lucent-interface" role="group" aria-label="Interface preferences">
                {lucentInterfacePreferences.map((preference) => (
                  <div key={preference.id}>
                    <Switch
                      id={`lucent-${preference.id}`}
                      checked={Boolean(draft[preference.id])}
                      onCheckedChange={(checked) => change(preference.id, checked)}
                      aria-describedby={`lucent-${preference.id}-description`}
                    />
                    <div>
                      <label htmlFor={`lucent-${preference.id}`}>{preference.title}</label>
                      <p id={`lucent-${preference.id}-description`}>{preference.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsRow>
          </FieldGroup>
        </FramePanel>
        {error && (
          <Alert variant="destructive" className="wf-lucent-save-error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FrameFooter>
          <Button type="button" variant="outline" onClick={reset}>
            Reset
          </Button>
          <Button type="submit">Save changes</Button>
        </FrameFooter>
      </Frame>
    </form>
  );
}
