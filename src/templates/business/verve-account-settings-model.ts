import { useEffect, useMemo, useRef, useState } from "react";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  createVerveAccountPreferences,
  createVerveNotifications,
  createVerveProfile,
  createVerveProfilePreferences,
  createVerveWorkspace,
  createVerveWorkspacePreferences,
  type VerveAccountPreferences,
  type VerveAccountSection,
  type VerveNotificationCategory,
  type VerveNotificationChannel,
  type VerveProfile,
  type VerveProfilePreferences,
  type VerveWorkspace,
  type VerveWorkspacePreferences,
} from "./verve-account-settings-data";

type Errors<T> = Partial<Record<keyof T, string>>;
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const different = (a: object, b: object) => JSON.stringify(a) !== JSON.stringify(b);

/** Keep the existing free uploader; only retain a stable saved image and own
 * the received preview URL/read lifetime across conditional page mounts. */
function useImageDraft(onChange: (image: string | null) => void) {
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const version = useRef(0);
  const reader = useRef<FileReader | null>(null);
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => {
      version.current += 1;
      if (reader.current?.readyState === FileReader.LOADING) reader.current.abort();
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);
  function reset() {
    version.current += 1;
    if (reader.current?.readyState === FileReader.LOADING) reader.current.abort();
    reader.current = null;
    for (const url of previews.current) URL.revokeObjectURL(url);
    previews.current.clear();
    setPending(false);
    setError("");
    setRevision((value) => value + 1);
  }
  function change(file: FileWithPreview | null) {
    if (!file) return;
    version.current += 1;
    if (reader.current?.readyState === FileReader.LOADING) reader.current.abort();
    if (file.preview?.startsWith("blob:")) previews.current.add(file.preview);
    if (!(file.file instanceof File)) return;
    const currentVersion = version.current;
    const next = new FileReader();
    reader.current = next;
    setError("");
    setPending(true);
    const fail = () => {
      if (currentVersion !== version.current) return;
      setPending(false);
      setError("The image could not be read. Choose another file.");
    };
    next.onload = () => {
      if (currentVersion !== version.current) return;
      setPending(false);
      if (typeof next.result === "string") onChange(next.result);
      else fail();
    };
    next.onerror = fail;
    try {
      next.readAsDataURL(file.file);
    } catch {
      fail();
    }
  }
  return {
    revision,
    pending,
    error,
    change,
    reset,
    remove: () => {
      reset();
      onChange(null);
    },
  };
}

export interface VerveAccountSettingsOptions {
  initialProfile?: Partial<VerveProfile>;
  onProfileSave?: (profile: VerveProfile) => void;
  onWorkspaceSave?: (workspace: VerveWorkspace) => void;
}

/** Caller-owned preview state. No backend/auth or browser persistence. */
export function useVerveAccountSettingsModel({
  initialProfile,
  onProfileSave,
  onWorkspaceSave,
}: VerveAccountSettingsOptions = {}) {
  const [section, setSection] = useState<VerveAccountSection>("profile");
  const [profile, setProfile] = useState<VerveProfile>(() => ({
    ...createVerveProfile(),
    ...initialProfile,
  }));
  const [profileDraft, setProfileDraft] = useState(() => ({ ...profile }));
  const [profileErrors, setProfileErrors] = useState<Errors<VerveProfile>>({});
  const [profilePreferences, setProfilePreferences] = useState(createVerveProfilePreferences);
  const [preferences, setPreferences] = useState(createVerveAccountPreferences);
  const [preferenceDraft, setPreferenceDraft] = useState(() => ({ ...preferences }));
  const [emailBulkDraft, setEmailBulkDraft] = useState<boolean | null>(null);
  const [notifications, setNotifications] = useState(createVerveNotifications);
  const [notificationCategory, setNotificationCategory] =
    useState<VerveNotificationCategory>("deals");
  const [workspace, setWorkspace] = useState(createVerveWorkspace);
  const [workspaceDraft, setWorkspaceDraft] = useState(() => ({ ...workspace }));
  const [workspaceErrors, setWorkspaceErrors] = useState<Errors<VerveWorkspace>>({});
  const [workspacePreferences, setWorkspacePreferences] = useState(createVerveWorkspacePreferences);
  const [status, setStatus] = useState("");
  const profileImage = useImageDraft((avatar) => {
    setProfileDraft((current) => ({ ...current, avatar }));
    setStatus("");
  });
  const workspaceImage = useImageDraft((logo) => {
    setWorkspaceDraft((current) => ({ ...current, logo }));
    setStatus("");
  });
  const profileDirty = different(profile, profileDraft);
  const preferencesDirty = different(preferences, preferenceDraft) || emailBulkDraft !== null;
  const workspaceDirty = different(workspace, workspaceDraft);
  const allEmailsEnabled = useMemo(
    () => Object.values(notifications).every((rows) => rows.every((row) => row.channels.email)),
    [notifications],
  );

  function updateProfile<K extends keyof VerveProfile>(key: K, value: VerveProfile[K]) {
    setProfileDraft((current) => ({ ...current, [key]: value }));
    setProfileErrors((current) => ({ ...current, [key]: undefined }));
    setStatus("");
  }
  function cancelProfile() {
    profileImage.reset();
    setProfileDraft({ ...profile });
    setProfileErrors({});
    setStatus("");
  }
  function saveProfile() {
    if (profileImage.pending || profileImage.error) return false;
    const errors: Errors<VerveProfile> = {};
    if (!profileDraft.fullName.trim()) errors.fullName = "Enter your full name.";
    if (!validEmail(profileDraft.email)) errors.email = "Enter a valid email address.";
    setProfileErrors(errors);
    if (Object.keys(errors).length) {
      setStatus("");
      return false;
    }
    const next = {
      ...profileDraft,
      fullName: profileDraft.fullName.trim(),
      email: profileDraft.email.trim(),
      emailVerified: profile.emailVerified && profileDraft.email.trim() === profile.email,
    };
    try {
      onProfileSave?.(next);
    } catch {
      setStatus("The profile could not be saved. Your edits are still here.");
      return false;
    }
    setProfile(next);
    setProfileDraft({ ...next });
    profileImage.reset();
    setStatus("Profile saved in this preview.");
    return true;
  }
  function updateProfilePreference<K extends keyof VerveProfilePreferences>(
    key: K,
    value: VerveProfilePreferences[K],
  ) {
    setProfilePreferences((current) => ({ ...current, [key]: value }));
    setStatus("Profile preference updated in this preview.");
  }
  function updatePreference<K extends keyof VerveAccountPreferences>(
    key: K,
    value: VerveAccountPreferences[K],
  ) {
    setPreferenceDraft((current) => ({ ...current, [key]: value }));
    setStatus("");
  }
  function savePreferences() {
    setPreferences({ ...preferenceDraft });
    if (emailBulkDraft !== null) {
      setNotifications(
        (current) =>
          Object.fromEntries(
            Object.entries(current).map(([category, rows]) => [
              category,
              rows.map((row) => ({ ...row, channels: { ...row.channels, email: emailBulkDraft } })),
            ]),
          ) as typeof current,
      );
    }
    setEmailBulkDraft(null);
    setStatus("Preferences saved in this preview.");
  }
  function cancelPreferences() {
    setPreferenceDraft({ ...preferences });
    setEmailBulkDraft(null);
    setStatus("");
  }
  function updateNotification(
    category: VerveNotificationCategory,
    id: string,
    channel: VerveNotificationChannel,
    enabled: boolean,
  ) {
    setNotifications((current) => ({
      ...current,
      [category]: current[category].map((row) =>
        row.id === id ? { ...row, channels: { ...row.channels, [channel]: enabled } } : row,
      ),
    }));
    setStatus("Notification preference updated in this preview.");
  }
  function updateWorkspace<K extends keyof VerveWorkspace>(key: K, value: VerveWorkspace[K]) {
    setWorkspaceDraft((current) => ({ ...current, [key]: value }));
    setWorkspaceErrors((current) => ({ ...current, [key]: undefined }));
    setStatus("");
  }
  function saveWorkspace() {
    if (workspaceImage.pending || workspaceImage.error) return false;
    const errors: Errors<VerveWorkspace> = {};
    if (!workspaceDraft.workspaceName.trim()) errors.workspaceName = "Enter a workspace name.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(workspaceDraft.subdomain))
      errors.subdomain = "Use lowercase letters, numbers and single hyphens.";
    if (!validEmail(workspaceDraft.supportEmail))
      errors.supportEmail = "Enter a valid support email.";
    setWorkspaceErrors(errors);
    if (Object.keys(errors).length) {
      setStatus("");
      return false;
    }
    const next = {
      ...workspaceDraft,
      workspaceName: workspaceDraft.workspaceName.trim(),
      supportEmail: workspaceDraft.supportEmail.trim(),
    };
    try {
      onWorkspaceSave?.(next);
    } catch {
      setStatus("The workspace could not be saved. Your edits are still here.");
      return false;
    }
    setWorkspace(next);
    setWorkspaceDraft({ ...next });
    workspaceImage.reset();
    setStatus("Workspace saved in this preview.");
    return true;
  }
  function updateWorkspacePreference<K extends keyof VerveWorkspacePreferences>(
    key: K,
    value: VerveWorkspacePreferences[K],
  ) {
    setWorkspacePreferences((current) => ({ ...current, [key]: value }));
    setStatus("Workspace preference updated in this preview.");
  }
  return {
    section,
    setSection,
    profile,
    profileDraft,
    profileErrors,
    profileDirty,
    profileImage,
    updateProfile,
    cancelProfile,
    saveProfile,
    profilePreferences,
    updateProfilePreference,
    preferences,
    preferenceDraft,
    preferencesDirty,
    updatePreference,
    savePreferences,
    cancelPreferences,
    emailBulkDraft,
    setEmailBulkDraft,
    allEmailsEnabled,
    notifications,
    notificationCategory,
    setNotificationCategory,
    updateNotification,
    workspace,
    workspaceDraft,
    workspaceErrors,
    workspaceDirty,
    workspaceImage,
    updateWorkspace,
    saveWorkspace,
    workspacePreferences,
    updateWorkspacePreference,
    status,
    setStatus,
    identity: { name: profile.fullName, email: profile.email, avatar: profile.avatar },
  };
}
export type VerveAccountSettingsModel = ReturnType<typeof useVerveAccountSettingsModel>;
