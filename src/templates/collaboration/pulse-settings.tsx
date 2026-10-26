import { useState } from "react";
import { Globe, Languages, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { ColorPicker, ColorPickerSwatches } from "@/components/reui/color-picker";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Switch } from "@/components/ui/switch";
import { SmallTabs } from "@/blocks/application/shared";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Button, Input, Modal } from "./shared";
import { SettingsSection, SettingsRow, SettingsSelect } from "./settings-shared";
import type { PulseSettingsState } from "./settings-model";
import "./pulse-settings.css";

export function PulseSettings({ model }: { model: PulseSettingsState }) {
  const [domainOpen, setDomainOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const { draft, setDraft } = model;
  function addDomains(values: string[]) {
    const domains = values.map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (
      !domains.length ||
      domains.some((value) => !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(value))
    ) {
      setError(
        "Enter valid domains, for example example.com, without https:// or an email address.",
      );
      return false;
    }
    setDraft((current) => ({
      ...current,
      domains: [...new Set([...current.domains, ...domains])],
    }));
    setError("");
    return true;
  }
  const [{ errors }, upload] = useFileUpload({
    accept: ".txt,.csv,text/plain,text/csv",
    maxSize: 1024 * 1024,
    onFilesAdded: async (files) => {
      const file = files[0]?.file;
      if (!(file instanceof File)) return;
      try {
        addDomains((await file.text()).split(/[\r\n,;]+/));
      } catch {
        setError("Unable to read the domain file.");
      }
    },
  });
  return (
    <>
      <div className="ct-heading">
        <p>Desk name, domains, branding and regional defaults.</p>
      </div>
      <form
        className="ct-pulse-settings"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.name.trim() || !/^[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?$/i.test(draft.portal)) {
            setError("Enter a desk name and a valid portal hostname.");
            return;
          }
          setError("");
          model.save();
        }}
      >
        <SettingsSection
          title="General Settings"
          description="How this help desk answers your customers."
          footer={
            <div className="ct-settings-actions">
              <span>{model.dirty ? "Unsaved changes" : "All changes saved"}</span>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  model.discard();
                  setError("");
                  toast.success("Settings restored to the last saved values");
                }}
              >
                Reset
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          }
        >
          <SettingsRow
            title="Help desk name"
            description="Shown on the customer portal and in every outgoing email."
          >
            <Input
              aria-label="Help desk name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
            />
          </SettingsRow>
          <SettingsRow
            title={
              <span>
                Support portal URL <Badge variant="destructive-light">Required</Badge>
              </span>
            }
            description="Where customers go to open and track their tickets."
          >
            <div className="ct-settings-url">
              <span>https://</span>
              <Input
                aria-label="Support portal URL"
                value={draft.portal}
                onChange={(e) =>
                  setDraft({ ...draft, portal: e.target.value.replace(/^https?:\/\//, "") })
                }
                required
              />
            </div>
          </SettingsRow>
          <SettingsRow
            title="First day of week"
            description="Sets the reporting week and the business-hours calendar SLAs count against."
          >
            <SettingsSelect
              label="First day of week"
              value={draft.firstDay}
              options={["Monday", "Sunday", "Saturday"]}
              onChange={(firstDay) => setDraft({ ...draft, firstDay })}
            />
          </SettingsRow>
          <SettingsRow
            title="Allowed email domains"
            description="Only customers writing from these domains can open a ticket."
          >
            <div className="ct-settings-domains">
              {draft.domains.map((domain) => (
                <Badge key={domain} variant="outline">
                  {domain}
                  <button
                    type="button"
                    aria-label={`Remove ${domain}`}
                    onClick={() =>
                      setDraft({ ...draft, domains: draft.domains.filter((d) => d !== domain) })
                    }
                  >
                    <X size={11} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="ct-toolbar justify-end mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError("");
                  setDomain("");
                  setDomainOpen(true);
                }}
              >
                <Plus />
                Add domain
              </Button>
              <Button type="button" variant="outline" onClick={upload.openFileDialog}>
                <Upload />
                Import from file
              </Button>
              <input
                {...upload.getInputProps()}
                className="sr-only"
                aria-label="Import allowed domains"
              />
            </div>
          </SettingsRow>
          <SettingsRow
            title="Brand color"
            description="Colours the customer portal, the chat widget and email headers."
          >
            <ColorPicker
              value={draft.color}
              onValueChange={(color) => color && setDraft({ ...draft, color })}
              aria-label="Accent color"
            >
              <ColorPickerSwatches
                shape="circle"
                colors={[
                  { value: "#64748b", label: "Slate" },
                  { value: "#f43f5e", label: "Rose" },
                  { value: "#f97316", label: "Orange" },
                  { value: "#8b5cf6", label: "Violet" },
                  { value: "#10b981", label: "Emerald" },
                  { value: "#0ea5e9", label: "Sky" },
                ]}
              />
            </ColorPicker>
          </SettingsRow>
          <SettingsRow
            title="Region & language"
            description="Where ticket data is stored, and the language the portal answers in."
          >
            <div className="ct-settings-region">
              <label>
                Region
                <div className="ct-settings-icon-select">
                  <Globe size={16} aria-hidden="true" />
                  <SettingsSelect
                    label="Region"
                    value={draft.region}
                    options={[
                      "United States",
                      "United Kingdom",
                      "European Union",
                      "Australia",
                      "Singapore",
                    ]}
                    onChange={(region) => setDraft({ ...draft, region })}
                  />
                </div>
              </label>
              <label>
                Language
                <div className="ct-settings-icon-select">
                  <Languages size={16} aria-hidden="true" />
                  <SettingsSelect
                    label="Language"
                    value={draft.language}
                    options={["English", "French", "German", "Spanish", "Portuguese"]}
                    onChange={(language) => setDraft({ ...draft, language })}
                  />
                </div>
              </label>
            </div>
          </SettingsRow>
          <SettingsRow
            title="Date display format"
            description="How ticket timestamps and SLA due dates are written."
          >
            <div className="ct-settings-date" onClick={(event) => event.preventDefault()}>
              <SmallTabs
                items={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD"]}
                value={draft.dateFormat}
                onChange={(dateFormat) => setDraft({ ...draft, dateFormat })}
              />
            </div>
          </SettingsRow>
          <SettingsRow
            title="Agent workspace"
            description="How the ticket view behaves for every agent on this desk."
          >
            <div className="ct-settings-switches">
              {(
                [
                  [
                    "shortcuts",
                    "Enable keyboard shortcuts.",
                    "Reply, assign and resolve a ticket without the mouse.",
                  ],
                  [
                    "spellcheck",
                    "Spell-check replies.",
                    "Flag spelling mistakes before a reply reaches a customer.",
                  ],
                  [
                    "compact",
                    "Compact ticket list.",
                    "Fit more tickets on screen during a busy queue.",
                  ],
                  [
                    "signature",
                    "Append agent signature.",
                    "Add the agent's name and title to every outgoing reply.",
                  ],
                ] as const
              ).map(([key, title, description]) => (
                <label key={key}>
                  <Switch
                    aria-label={title}
                    checked={draft[key]}
                    onCheckedChange={(checked) => setDraft({ ...draft, [key]: checked })}
                  />
                  <span>
                    {title}
                    <small>{description}</small>
                  </span>
                </label>
              ))}
            </div>
          </SettingsRow>
        </SettingsSection>
        {(error || errors.length > 0) && !domainOpen && (
          <Alert variant="destructive">
            <AlertDescription>{error || errors.join(" ")}</AlertDescription>
          </Alert>
        )}
      </form>
      <Modal
        title="Add allowed domain"
        description="Anyone with an email address at this domain can open a ticket. Everyone else is turned away at the portal."
        open={domainOpen}
        onClose={() => setDomainOpen(false)}
      >
        <form
          className="ct-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (addDomains([domain])) setDomainOpen(false);
          }}
        >
          <label>
            Domain
            <Input
              aria-label="Domain"
              placeholder="atlasfreight.com"
              autoFocus
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
            />
          </label>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="ct-toolbar justify-end">
            <Button variant="outline" type="button" onClick={() => setDomainOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add domain</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
