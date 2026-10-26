import { useState } from "react";
import { toast } from "sonner";
import {
  driveBillingInitial,
  driveMembersInitial,
  driveProfileInitial,
  driveProfilePreferencesInitial,
  driveWorkspaceInitial,
  driveWorkspacePreferencesInitial,
  type DriveBillingSetup,
  type DriveMemberAccess,
  type DriveProfileDetails,
  type DriveProfilePreferences,
  type DriveWorkspaceDetails,
  type DriveWorkspacePreferences,
} from "./drive-settings-data";

export function useDriveSettingsModel({
  onProfileNameChange,
  onWorkspaceNameChange,
}: {
  onProfileNameChange?: (name: string) => void;
  onWorkspaceNameChange?: (name: string) => void;
} = {}) {
  const [profile, setProfile] = useState(() => ({ ...driveProfileInitial }));
  const [profilePreferences, setProfilePreferences] = useState(() => ({
    ...driveProfilePreferencesInitial,
  }));
  const [workspace, setWorkspace] = useState(() => ({ ...driveWorkspaceInitial }));
  const [workspacePreferences, setWorkspacePreferences] = useState(() => ({
    ...driveWorkspacePreferencesInitial,
  }));
  const [billing, setBilling] = useState(() => ({
    ...driveBillingInitial,
    approverIds: [...driveBillingInitial.approverIds],
  }));
  const [sessionResets, setSessionResets] = useState<Record<string, number>>({});
  const [members, setMembers] = useState(() =>
    driveMembersInitial.map((member) => ({ ...member })),
  );
  function saveProfile(value: DriveProfileDetails) {
    // Media intentionally belongs to the page-local free upload hook, not this snapshot.
    const text = { ...value };
    setProfile(text);
    onProfileNameChange?.(text.fullName);
    toast.success("Profile saved", {
      description: `${text.fullName} · ${text.email}`,
    });
  }
  function saveWorkspace(value: DriveWorkspaceDetails) {
    const text = { ...value };
    setWorkspace(text);
    onWorkspaceNameChange?.(text.workspaceName);
    toast.success("Workspace saved", {
      description: `${text.workspaceName} · ${text.subdomain}.brick.test`,
    });
  }
  function saveProfilePreferences(value: DriveProfilePreferences) {
    setProfilePreferences({ ...value });
    toast.success("Preferences saved", {
      description: `Opens on ${value.landingView} · ${value.language}`,
    });
  }
  function saveWorkspacePreferences(value: DriveWorkspacePreferences) {
    setWorkspacePreferences({ ...value });
    toast.success("Workspace preferences saved", {
      description: `External sharing ${value.externalSharing ? "on" : "off"} · new members open on ${value.landingView}`,
    });
  }
  function saveBilling(value: DriveBillingSetup) {
    setBilling({ ...value, approverIds: [...value.approverIds] });
    toast.success("Billing updated", {
      description: `${value.seatSelection ?? 3} seats, invoices to ${value.invoiceEmail}. Local preview only.`,
    });
  }
  function resetBillingCapacity() {
    setBilling((current) => ({ ...current, seatSelection: null }));
  }
  function changeAccess(id: string, access: DriveMemberAccess) {
    setMembers((current) =>
      current.map((member) => (member.id === id ? { ...member, access } : member)),
    );
    toast.success("Role changed locally", { description: "No real workspace access was changed." });
  }
  function invite(email: string, access: DriveMemberAccess, note: string) {
    const name = email.split("@")[0].replaceAll(/[._-]/g, " ");
    setMembers((current) => [
      ...current,
      {
        id: `local-${crypto.randomUUID()}`,
        name,
        email,
        access,
        role: "Invited member",
        department: "Workspace",
        status: "Invited",
        note,
      },
    ]);
    toast.success("Local invitation added", {
      description: "No email was sent. This record exists only in the preview.",
    });
  }
  function resetSession(id: string) {
    setSessionResets((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    toast.success("Session reset locally", {
      description: "No real browser or account session was changed.",
    });
  }
  return {
    profile,
    profilePreferences,
    workspace,
    workspacePreferences,
    billing,
    members,
    sessionResets,
    resetSession,
    setMembers,
    saveProfile,
    saveWorkspace,
    saveProfilePreferences,
    saveWorkspacePreferences,
    saveBilling,
    resetBillingCapacity,
    changeAccess,
    invite,
  };
}
export type DriveSettingsModel = ReturnType<typeof useDriveSettingsModel>;
