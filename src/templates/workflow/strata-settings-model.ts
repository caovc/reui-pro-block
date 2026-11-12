import { useState } from "react";
import { demoAvatar } from "../../lib/demo-artwork.ts";
export {
  STRATA_SETTINGS_TABS,
  readStrataSettingsTab,
  strataSettingsQuery,
} from "./strata-settings-routing.ts";
export type { StrataSettingsTab } from "./strata-settings-routing.ts";

export const strataGeneralDefaults = {
  landing: "Overview",
  dateFormat: "MM/DD/YYYY",
  firstDay: "Monday",
  refresh: true,
  markdown: true,
  colorTheme: "System",
  timestamps: "UTC",
  reduceMotion: false,
  tooltips: true,
};
export type StrataGeneralSettings = typeof strataGeneralDefaults;

export const strataProfileDefaults = {
  name: "Maya Ellis",
  email: "maya@bricklane.test",
  username: "maya",
  team: "Platform",
  timeZone: "UTC-8 (Pacific Time)",
  website: "bricklane.example",
  bio: "Platform on-call at Bricklane. I look after deploys, clusters and alert rules.",
  photo: demoAvatar("Maya Ellis"),
};
export type StrataProfile = typeof strataProfileDefaults;

export function validateStrataProfile(profile: StrataProfile): string | null {
  if (!profile.name.trim()) return "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return "Enter a valid email address.";
  if (!/^[a-zA-Z0-9_-]{2,40}$/.test(profile.username))
    return "Use 2–40 letters, numbers, underscores or hyphens for your username.";
  if (profile.website.trim()) {
    try {
      const address = new URL(`https://${profile.website}`);
      if (
        address.username ||
        address.password ||
        !address.hostname.includes(".") ||
        /\s/.test(profile.website)
      )
        return "Enter a website address without its https:// prefix.";
    } catch {
      return "Enter a valid website address.";
    }
  }
  return null;
}

export function useStrataSettingsModel() {
  const [general, setGeneral] = useState({ ...strataGeneralDefaults });
  const [profile, setProfile] = useState({ ...strataProfileDefaults });
  const [savedProfile, setSavedProfile] = useState({ ...strataProfileDefaults });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState("");
  function changeGeneral<K extends keyof StrataGeneralSettings>(
    key: K,
    value: StrataGeneralSettings[K],
  ) {
    setGeneral((current) => ({ ...current, [key]: value }));
  }
  function changeProfile<K extends keyof StrataProfile>(key: K, value: StrataProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setProfileError(null);
    setProfileNotice("");
  }
  function saveProfile() {
    const error = validateStrataProfile(profile);
    setProfileError(error);
    if (error) return false;
    const next = {
      ...profile,
      name: profile.name.trim(),
      email: profile.email.trim(),
      website: profile.website.trim(),
    };
    setSavedProfile(next);
    setProfile(next);
    setProfileNotice("Profile changes saved in this demo.");
    return true;
  }
  function discardProfile() {
    setProfile({ ...savedProfile });
    setProfileError(null);
    setProfileNotice("");
  }
  return {
    general,
    changeGeneral,
    profile,
    savedProfile,
    changeProfile,
    profileError,
    profileNotice,
    saveProfile,
    discardProfile,
  };
}
