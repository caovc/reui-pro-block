import { useEffect, useMemo, useRef, useState } from "react";
import { setGlobalTheme, useGlobalTheme } from "@/components/site/global-theme-store";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  createAtlasAccountPreferences,
  createAtlasAccountProfile,
  createAtlasAccountSecurity,
  type AtlasAccountPreferences,
  type AtlasAccountProfile,
  type AtlasAccountSection,
  type AtlasAccountSecurity,
} from "./atlas-account-settings-data";

export type AtlasProfileErrors = Partial<Record<keyof AtlasAccountProfile, string>>;

export function validateAtlasAccountProfile(profile: AtlasAccountProfile): AtlasProfileErrors {
  const errors: AtlasProfileErrors = {};
  if (!profile.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()))
    errors.email = "Enter a valid email address.";
  return errors;
}

export interface AtlasAccountSettingsOptions {
  initialProfile?: Partial<AtlasAccountProfile>;
  onProfileSave?: (profile: AtlasAccountProfile) => void;
  onPreferencesChange?: (preferences: AtlasAccountPreferences) => void;
}

/** Parent-owned local state survives settings section and dashboard navigation.
 * It is intentionally route-stable, unlike the observed reference's reset on
 * route return. No account/auth backend or profile storage is implied. */
export function useAtlasAccountSettingsModel({
  initialProfile,
  onProfileSave,
  onPreferencesChange,
}: AtlasAccountSettingsOptions = {}) {
  const globalTheme = useGlobalTheme();
  const [section, setSection] = useState<AtlasAccountSection>("profile");
  const [savedProfile, setSavedProfile] = useState<AtlasAccountProfile>(() => ({
    ...createAtlasAccountProfile(),
    ...initialProfile,
  }));
  const [draftProfile, setDraftProfile] = useState<AtlasAccountProfile>(() => ({
    ...savedProfile,
  }));
  const [profileErrors, setProfileErrors] = useState<AtlasProfileErrors>({});
  const [security, setSecurity] = useState(createAtlasAccountSecurity);
  const [preferenceState, setPreferenceState] = useState(createAtlasAccountPreferences);
  const [status, setStatus] = useState("");
  const [openGroups, setOpenGroups] = useState({
    signIn: true,
    activity: true,
    general: true,
    display: true,
  });
  const [avatarRevision, setAvatarRevision] = useState(0);
  const [avatarPending, setAvatarPending] = useState(false);
  const uploadVersion = useRef(0);
  const reader = useRef<FileReader | null>(null);
  const previewUrls = useRef(new Set<string>());

  const colorTheme: AtlasAccountPreferences["colorTheme"] =
    globalTheme.theme.mode === "dark"
      ? "Dark"
      : globalTheme.theme.mode === "light"
        ? "Light"
        : "System";
  const preferences = useMemo(
    () => ({ ...preferenceState, colorTheme }),
    [preferenceState, colorTheme],
  );
  const profileDirty = useMemo(
    () => JSON.stringify(draftProfile) !== JSON.stringify(savedProfile),
    [draftProfile, savedProfile],
  );

  function releasePreviews() {
    for (const url of previewUrls.current) URL.revokeObjectURL(url);
    previewUrls.current.clear();
  }
  function abortAvatarRead() {
    uploadVersion.current += 1;
    if (reader.current?.readyState === FileReader.LOADING) reader.current.abort();
    reader.current = null;
    setAvatarPending(false);
  }

  useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      uploadVersion.current += 1;
      if (reader.current?.readyState === FileReader.LOADING) reader.current.abort();
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  function updateProfile<K extends keyof AtlasAccountProfile>(
    key: K,
    value: AtlasAccountProfile[K],
  ) {
    setDraftProfile((current) => ({ ...current, [key]: value }));
    setProfileErrors((current) => ({ ...current, [key]: undefined }));
    setStatus("");
  }

  function removeAvatar() {
    abortAvatarRead();
    updateProfile("avatar", null);
    setAvatarRevision((value) => value + 1);
    releasePreviews();
  }

  function changeAvatar(file: FileWithPreview | null) {
    if (!file) return;
    abortAvatarRead();
    if (file.preview?.startsWith("blob:")) previewUrls.current.add(file.preview);
    if (!(file.file instanceof File)) return;
    const version = uploadVersion.current;
    const nextReader = new FileReader();
    reader.current = nextReader;
    setAvatarPending(true);
    setProfileErrors((current) => ({ ...current, avatar: undefined }));
    nextReader.onload = () => {
      if (version !== uploadVersion.current) return;
      setAvatarPending(false);
      if (typeof nextReader.result === "string") updateProfile("avatar", nextReader.result);
    };
    nextReader.onerror = () => {
      if (version !== uploadVersion.current) return;
      setAvatarPending(false);
      setProfileErrors((current) => ({
        ...current,
        avatar: "This image could not be read. Try another file.",
      }));
    };
    nextReader.readAsDataURL(file.file);
  }

  function cancelProfile() {
    abortAvatarRead();
    setDraftProfile({ ...savedProfile });
    setProfileErrors({});
    setStatus("");
    setAvatarRevision((value) => value + 1);
    releasePreviews();
  }

  function saveProfile() {
    if (avatarPending || profileErrors.avatar) return false;
    const errors = validateAtlasAccountProfile(draftProfile);
    setProfileErrors(errors);
    if (Object.keys(errors).length) {
      setStatus("");
      return false;
    }
    const next: AtlasAccountProfile = {
      ...draftProfile,
      fullName: draftProfile.fullName.trim(),
      email: draftProfile.email.trim(),
      emailVerified: savedProfile.emailVerified && draftProfile.email.trim() === savedProfile.email,
    };
    try {
      onProfileSave?.(next);
    } catch {
      setStatus("The profile could not be saved in this preview. Your edits are still here.");
      return false;
    }
    setSavedProfile(next);
    setDraftProfile({ ...next });
    setAvatarRevision((value) => value + 1);
    releasePreviews();
    setStatus("Profile saved in this preview.");
    return true;
  }

  function updateSecurity<K extends keyof AtlasAccountSecurity>(
    key: K,
    value: AtlasAccountSecurity[K],
  ) {
    setSecurity((current) => ({ ...current, [key]: value }));
    setStatus("Security preference updated in this preview. Sign-in credentials were not changed.");
  }

  function updatePreference<K extends keyof AtlasAccountPreferences>(
    key: K,
    value: AtlasAccountPreferences[K],
  ) {
    const next = { ...preferences, [key]: value };
    setPreferenceState(next);
    if (key === "colorTheme")
      setGlobalTheme({ ...globalTheme.theme, mode: String(value).toLowerCase() }, false);
    onPreferencesChange?.(next);
    setStatus("");
  }

  return {
    section,
    setSection,
    savedProfile,
    draftProfile,
    profileErrors,
    profileDirty,
    updateProfile,
    saveProfile,
    cancelProfile,
    avatarRevision,
    avatarPending,
    changeAvatar,
    removeAvatar,
    security,
    updateSecurity,
    preferences,
    updatePreference,
    openGroups,
    setGroupOpen: (group: keyof typeof openGroups, open: boolean) =>
      setOpenGroups((current) => ({ ...current, [group]: open })),
    status,
    setStatus,
    identity: {
      name: savedProfile.fullName,
      email: savedProfile.email,
      avatar: savedProfile.avatar,
    },
  };
}

export type AtlasAccountSettingsModel = ReturnType<typeof useAtlasAccountSettingsModel>;
