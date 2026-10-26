import { useState } from "react";
import { toast } from "sonner";
export function useSettingsDraft<T>(initial: T) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  function save() {
    setSaved(structuredClone(draft));
    toast.success("Settings saved");
  }
  function discard() {
    setDraft(structuredClone(saved));
  }
  function restore(value: T) {
    setSaved(structuredClone(value));
    setDraft(structuredClone(value));
  }
  return { saved, draft, setDraft, dirty, save, discard, restore };
}
export const initialPulseSettings = {
  name: "Pulse Support",
  portal: "help.bricklane.example",
  firstDay: "Monday",
  domains: ["atlasfreight.com", "orbitsoftware.dev", "meridianretail.com"],
  color: "#64748b",
  region: "United States",
  language: "English",
  dateFormat: "DD/MM/YYYY",
  shortcuts: true,
  spellcheck: true,
  compact: false,
  signature: true,
};
export type PulseSettingsData = typeof initialPulseSettings;
export type PulseSettingsState = ReturnType<typeof useSettingsDraft<PulseSettingsData>>;
