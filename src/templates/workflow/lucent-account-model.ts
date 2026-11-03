import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  SettingsValue,
  SettingsValues,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import { demoAvatar } from "@/lib/demo-artwork";

// Independent Bricklane fixtures replace personal and billing identifiers in
// the reference. No remote profile image or authenticated account is used.
const profileDefaults: SettingsValues = {
  fullName: "Jordan Blake",
  email: "jordan.blake@bricklane.example",
  username: "jordan-blake",
  role: "Platform Lead",
  timezone: "UTC-8 (Pacific Time)",
  website: "jordan.blake.bricklane.example",
  bio: "Edge team. Owns the deploy pipeline and the image registry.",
};

const billingDefaults: SettingsValues = {
  email: "billing@bricklane.example",
  company: "Bricklane DevOps",
  country: "United States",
  taxId: "BL-DEMO-2048",
  cardLast4: "4242",
};

const preferencesDefaults: SettingsValues = {
  desktopNotifications: true,
  quietStart: "8:00 PM",
  quietEnd: "8:00 AM",
  unreadBadge: true,
  autoDismiss: "10 minutes",
  teamCommunication: true,
  productAnnouncements: false,
  digestEmail: true,
  digestCadence: "Every week",
};

const validEmail = (value: SettingsValue | undefined) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function useLucentAccountModel() {
  const [profile, setProfile] = useState<SettingsValues>(() => ({ ...profileDefaults }));
  const [profileSaved, setProfileSaved] = useState<SettingsValues>(() => ({ ...profileDefaults }));
  const [billing, setBilling] = useState<SettingsValues>(() => ({ ...billingDefaults }));
  const [preferences, setPreferences] = useState<SettingsValues>(() => ({
    ...preferencesDefaults,
  }));
  const [plan, setPlan] = useState("Pro");
  const [avatar, setAvatar] = useState<string | undefined>(() => demoAvatar("Jordan Blake"));
  const [savedAvatar, setSavedAvatar] = useState<string | undefined>(avatar);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarPending, setAvatarPending] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarReader = useRef<FileReader | null>(null);
  const avatarRequest = useRef(0);
  const avatarPreviews = useRef(new Set<string>());
  const billingSaved = useRef<SettingsValues>({ ...billingDefaults });
  const preferencesSaved = useRef<SettingsValues>({ ...preferencesDefaults });

  const releaseAvatarPreviews = useCallback(() => {
    for (const preview of avatarPreviews.current) URL.revokeObjectURL(preview);
    avatarPreviews.current.clear();
  }, []);

  // Passive cleanup runs after the old keyed uploader leaves the committed DOM.
  // Saved DataURLs are never tracked or revoked.
  useEffect(() => () => releaseAvatarPreviews(), [avatarVersion, releaseAvatarPreviews]);

  useEffect(
    () => () => {
      avatarRequest.current += 1;
      avatarReader.current?.abort();
      releaseAvatarPreviews();
    },
    [releaseAvatarPreviews],
  );

  const profileInvalid = !String(profile.fullName ?? "").trim() || !validEmail(profile.email);
  const billingInvalid = !validEmail(billing.email);

  function changeProfile(id: string, value: SettingsValue) {
    setProfile((current) => ({ ...current, [id]: value }));
  }

  function changeBilling(id: string, value: SettingsValue) {
    setBilling((current) => ({ ...current, [id]: value }));
  }

  function changePreferences(id: string, value: SettingsValue) {
    setPreferences((current) => ({ ...current, [id]: value }));
  }

  function stopAvatarRead() {
    avatarRequest.current += 1;
    avatarReader.current?.abort();
    avatarReader.current = null;
    setAvatarPending(false);
  }

  function onAvatarFileChange(file: FileWithPreview | null) {
    // Actual free LocalAvatarUpload owns selection, validation and Blob preview.
    // Its explicit Remove callback owns null notifications.
    if (!(file?.file instanceof File)) return;
    if (file.preview?.startsWith("blob:")) avatarPreviews.current.add(file.preview);
    stopAvatarRead();
    const request = avatarRequest.current;
    const reader = new FileReader();
    avatarReader.current = reader;
    setAvatarPending(true);
    setAvatarError("");
    reader.onload = () => {
      if (request !== avatarRequest.current) return;
      avatarReader.current = null;
      setAvatarPending(false);
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
      } else {
        setAvatarError("The image could not be read. Choose another image.");
      }
    };
    reader.onerror = () => {
      if (request !== avatarRequest.current) return;
      avatarReader.current = null;
      setAvatarPending(false);
      setAvatarError("The image could not be read. Choose another image.");
    };
    reader.readAsDataURL(file.file);
  }

  function removeAvatar() {
    stopAvatarRead();
    setAvatarError("");
    setAvatar(undefined);
  }

  function saveProfile() {
    if (profileInvalid || avatarPending || avatarError) return;
    setProfileSaved({ ...profile });
    setSavedAvatar(avatar);
    // Remount so the Blob preview cannot shadow the saved DataURL. The version
    // effect releases tracked object URLs after that DOM replacement commits.
    setAvatarVersion((version) => version + 1);
    toast.success("Profile saved", {
      description: "Your profile was updated in this local preview.",
    });
  }

  function cancelProfile() {
    stopAvatarRead();
    setProfile({ ...profileSaved });
    setAvatar(savedAvatar);
    setAvatarError("");
    setAvatarVersion((version) => version + 1);
    toast.success("Changes discarded", {
      description: "Your profile is back to its saved values.",
    });
  }

  function saveBilling() {
    if (billingInvalid) return;
    billingSaved.current = { ...billing };
    toast.success("Billing updated", {
      description: "Billing details were saved in this local preview.",
    });
  }

  function resetPreferences() {
    setPreferences({ ...preferencesDefaults });
    toast.success("Preferences reset", {
      description: "Default preferences restored in this local preview.",
    });
  }

  function savePreferences() {
    preferencesSaved.current = { ...preferences };
    toast.success("Preferences saved", {
      description: "Your preferences were saved in this local preview.",
    });
  }

  function choosePlan(nextPlan: string) {
    if (!["Free", "Pro", "Team"].includes(nextPlan)) return;
    setPlan(nextPlan);
    toast.success(`${nextPlan} plan selected`, {
      description: "Local preview only. No subscription or payment was changed.",
    });
  }

  function updateDemoCard() {
    setBilling((current) => ({ ...current, cardLast4: "1234" }));
    toast.success("Demo card updated", {
      description: "Local preview only. No payment method was submitted.",
    });
  }

  return {
    profile,
    profileSaved,
    billing,
    preferences,
    plan,
    avatar,
    savedAvatar,
    avatarVersion,
    avatarPending,
    avatarError,
    profileInvalid,
    billingInvalid,
    changeProfile,
    changeBilling,
    changePreferences,
    saveProfile,
    cancelProfile,
    saveBilling,
    resetPreferences,
    savePreferences,
    choosePlan,
    updateDemoCard,
    onAvatarFileChange,
    removeAvatar,
    releaseAvatarPreviews,
  };
}

export type LucentAccountModel = ReturnType<typeof useLucentAccountModel>;
