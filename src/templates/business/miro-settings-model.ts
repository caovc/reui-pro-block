import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createMiroPrices,
  initialMiroActivities,
  initialMiroChairs,
  initialMiroProfile,
  initialMiroSettingsInvoices,
  miroAlertTypes,
  miroChairColors,
  miroPaymentTerms,
  miroProcedures,
  miroRoles,
  miroSettingsAsOf,
  miroSettingsSections,
  miroTimeZones,
  type MiroActivity,
  type MiroAlertType,
  type MiroChairColor,
  type MiroInvoiceForSettings,
  type MiroPriceList,
  type MiroProfile,
  type MiroProfileField,
  type MiroSettingsSection,
} from "./miro-settings-data";

export function miroInvoiceSummary(
  invoices: readonly MiroInvoiceForSettings[],
  terms: number,
  asOf: string,
) {
  const today = Date.parse(`${asOf}T00:00:00Z`);
  const open = invoices.filter(
    (invoice) => invoice.status === "open" && Number.isFinite(invoice.amount),
  );
  const overdue = open.filter((invoice) => {
    const issued = Date.parse(`${invoice.issuedAt}T00:00:00Z`);
    return Number.isFinite(issued) && issued + terms * 86_400_000 < today;
  });
  return {
    outstanding: open.reduce((total, invoice) => total + invoice.amount, 0),
    outstandingCount: open.length,
    pastDue: overdue.reduce((total, invoice) => total + invoice.amount, 0),
    pastDueCount: overdue.length,
  };
}
function initialAlerts(): Record<MiroAlertType, boolean> {
  return { booked: true, rescheduled: true, status: true, updated: true, cancelled: true };
}
function profileIssues(profile: MiroProfile): Partial<Record<MiroProfileField, string>> {
  const errors: Partial<Record<MiroProfileField, string>> = {};
  if (!profile.fullName.trim()) errors.fullName = "Enter a full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()))
    errors.email = "Enter a valid email address.";
  if (!/^[a-zA-Z0-9._-]+$/.test(profile.username.trim()))
    errors.username = "Use letters, numbers, dots, underscores or hyphens.";
  if (!miroRoles.includes(profile.role as (typeof miroRoles)[number]))
    errors.role = "Choose a role.";
  if (!miroTimeZones.includes(profile.timeZone as (typeof miroTimeZones)[number]))
    errors.timeZone = "Choose a time zone.";
  if (profile.website.trim()) {
    try {
      if (!new URL(`https://${profile.website.trim()}`).hostname.includes("."))
        errors.website = "Enter a website domain.";
    } catch {
      errors.website = "Enter a website domain.";
    }
  }
  return errors;
}
export interface MiroSettingsModelOptions {
  invoices?: readonly MiroInvoiceForSettings[];
  activities?: readonly MiroActivity[];
  asOf?: string;
}

/** A narrow clinic session model; parent passes the real ledger/activity adapters. */
export function useMiroSettingsModel({
  invoices = initialMiroSettingsInvoices,
  activities = initialMiroActivities,
  asOf = miroSettingsAsOf,
}: MiroSettingsModelOptions = {}) {
  const [section, setSectionState] = useState<MiroSettingsSection>("profile");
  const [profileSaved, setProfileSaved] = useState<MiroProfile>(() => ({ ...initialMiroProfile }));
  const [profileDraft, setProfileDraft] = useState<MiroProfile>(() => ({ ...initialMiroProfile }));
  const [profileErrors, setProfileErrors] = useState<Partial<Record<MiroProfileField, string>>>({});
  const [avatarRevision, setAvatarRevision] = useState(0);
  const [avatarPending, setAvatarPending] = useState(false);
  const uploadSequence = useRef(0);
  useEffect(
    () => () => {
      uploadSequence.current += 1;
    },
    [],
  );
  const [hours, setHours] = useState({ opens: 8, closes: 19 });
  const [chairs, setChairs] = useState(() => initialMiroChairs.map((chair) => ({ ...chair })));
  const [pricesSaved, setPricesSaved] = useState(createMiroPrices);
  const [pricesDraft, setPricesDraft] = useState(createMiroPrices);
  const [priceErrors, setPriceErrors] = useState<Record<string, string>>({});
  const [paymentTerms, setPaymentTermsState] = useState(30);
  const [alerts, setAlerts] = useState(initialAlerts);
  const invoiceSummary = useMemo(
    () => miroInvoiceSummary(invoices, paymentTerms, asOf),
    [invoices, paymentTerms, asOf],
  );
  const activityCounts = useMemo(
    () =>
      Object.fromEntries(
        miroAlertTypes.map((alert) => [
          alert.id,
          activities.filter((activity) => activity.type === alert.id).length,
        ]),
      ) as Record<MiroAlertType, number>,
    [activities],
  );
  const bellActivities = useMemo(
    () => activities.filter((activity) => alerts[activity.type]),
    [activities, alerts],
  );
  const profileDirty = JSON.stringify(profileDraft) !== JSON.stringify(profileSaved);
  const pricesDirty = JSON.stringify(pricesDraft) !== JSON.stringify(pricesSaved);
  const hasChanges =
    profileDirty ||
    JSON.stringify(profileSaved) !== JSON.stringify(initialMiroProfile) ||
    hours.opens !== 8 ||
    hours.closes !== 19 ||
    JSON.stringify(chairs) !== JSON.stringify(initialMiroChairs) ||
    JSON.stringify(pricesSaved) !== JSON.stringify(createMiroPrices()) ||
    pricesDirty ||
    paymentTerms !== 30 ||
    Object.values(alerts).some((enabled) => !enabled);
  function setSection(value: string) {
    if (miroSettingsSections.some((item) => item.id === value))
      setSectionState(value as MiroSettingsSection);
  }
  function setProfileField(field: MiroProfileField, value: string) {
    setProfileDraft((current) => ({ ...current, [field]: value }));
    setProfileErrors((current) => ({ ...current, [field]: undefined }));
  }
  function cancelProfile() {
    uploadSequence.current += 1;
    setAvatarPending(false);
    setAvatarRevision((value) => value + 1);
    setProfileDraft({ ...profileSaved });
    setProfileErrors({});
  }
  function saveProfile() {
    if (avatarPending) return false;
    const next = {
      ...profileDraft,
      fullName: profileDraft.fullName.trim(),
      email: profileDraft.email.trim(),
      username: profileDraft.username.trim(),
      website: profileDraft.website.trim(),
    };
    const errors = profileIssues(next);
    setProfileErrors(errors);
    if (Object.values(errors).some(Boolean)) return false;
    setProfileSaved(next);
    setProfileDraft({ ...next });
    setAvatarRevision((value) => value + 1);
    toast.success("Profile saved", { description: "Updated in this local clinic session." });
    return true;
  }
  async function selectAvatar(file: File | null) {
    const token = ++uploadSequence.current;
    if (!file) {
      setAvatarPending(false);
      setProfileDraft((current) => ({ ...current, avatar: "" }));
      return;
    }
    setAvatarPending(true);
    try {
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("Image preview unavailable"));
        reader.onerror = () => reject(new Error("Image preview unavailable"));
        reader.readAsDataURL(file);
      });
      if (uploadSequence.current === token)
        setProfileDraft((current) => ({ ...current, avatar: preview }));
    } catch {
      if (uploadSequence.current === token) toast.error("Image preview unavailable");
    } finally {
      if (uploadSequence.current === token) setAvatarPending(false);
    }
  }
  function setOpeningHour(value: number) {
    if (!Number.isInteger(value) || value < 0 || value > 23) return;
    setHours((current) => ({ opens: value, closes: Math.max(current.closes, value + 1) }));
  }
  function setClosingHour(value: number) {
    if (!Number.isInteger(value) || value <= hours.opens || value > 24) return;
    setHours((current) => (value > current.opens ? { ...current, closes: value } : current));
  }
  function updateChair(id: string, patch: { visible?: boolean; color?: MiroChairColor }) {
    if (patch.color && !miroChairColors.some((color) => color.id === patch.color)) return;
    setChairs((current) =>
      current.map((chair) => (chair.id === id ? { ...chair, ...patch } : chair)),
    );
  }
  function setPrice(id: string, value: number | null) {
    if (!miroProcedures.some((procedure) => procedure.id === id)) return;
    setPricesDraft((current) => ({ ...current, [id]: value }));
    setPriceErrors((current) => ({ ...current, [id]: "" }));
  }
  function savePrices() {
    const errors = Object.fromEntries(
      miroProcedures.flatMap(({ id }) => {
        const value = pricesDraft[id];
        return typeof value !== "number" || !Number.isFinite(value) || value < 0
          ? [[id, "Enter a non-negative price."]]
          : [];
      }),
    );
    setPriceErrors(errors);
    if (Object.keys(errors).length) return false;
    setPricesSaved({ ...pricesDraft });
    toast.success("Prices saved", { description: "Applied to this local clinic price list." });
    return true;
  }
  function resetPrices() {
    setPricesDraft(createMiroPrices());
    setPriceErrors({});
  }
  function setPaymentTerms(value: number) {
    if (miroPaymentTerms.includes(value as (typeof miroPaymentTerms)[number]))
      setPaymentTermsState(value);
  }
  function setAlert(type: MiroAlertType, value: boolean) {
    setAlerts((current) => ({ ...current, [type]: value }));
  }
  function resetDefaults() {
    uploadSequence.current += 1;
    setAvatarPending(false);
    setAvatarRevision((value) => value + 1);
    setProfileSaved({ ...initialMiroProfile });
    setProfileDraft({ ...initialMiroProfile });
    setProfileErrors({});
    setHours({ opens: 8, closes: 19 });
    setChairs(initialMiroChairs.map((chair) => ({ ...chair })));
    setPricesSaved(createMiroPrices());
    setPricesDraft(createMiroPrices());
    setPriceErrors({});
    setPaymentTermsState(30);
    setAlerts(initialAlerts());
    toast.success("Shipped defaults restored", { description: "Local clinic settings only." });
  }
  return {
    section,
    setSection,
    profileSaved,
    profileDraft,
    profileErrors,
    setProfileField,
    profileDirty,
    saveProfile,
    cancelProfile,
    avatarRevision,
    avatarPending,
    selectAvatar,
    hours,
    setOpeningHour,
    setClosingHour,
    chairs,
    updateChair,
    pricesSaved,
    pricesDraft,
    pricesDirty,
    priceErrors,
    setPrice,
    savePrices,
    resetPrices,
    paymentTerms,
    setPaymentTerms,
    invoiceSummary,
    alerts,
    setAlert,
    activityCounts,
    bellActivities,
    hasChanges,
    resetDefaults,
    hasLedgerAdapter: invoices !== initialMiroSettingsInvoices,
    hasActivityAdapter: activities !== initialMiroActivities,
  };
}
export type MiroSettingsModel = ReturnType<typeof useMiroSettingsModel>;
export function miroPriceForProcedure(prices: MiroPriceList, name: string) {
  const procedure = miroProcedures.find((item) => item.name === name);
  return procedure ? (prices[procedure.id] ?? procedure.price) : undefined;
}
