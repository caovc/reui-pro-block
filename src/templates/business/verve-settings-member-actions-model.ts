import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { verveSettingsDate, type VerveSettingsMember } from "./verve-settings-people-billing-data";
import {
  blankVerveMember,
  validateVerveMember,
  type VerveImportRow,
  type VerveMemberDraft,
  type VerveMemberErrors,
} from "./verve-settings-actions-data";

type MemberAction = "view" | "edit" | "delete";
export function useVerveMemberActions({
  members,
  setMembers,
  allocateId,
  firstPage,
}: {
  members: VerveSettingsMember[];
  setMembers: Dispatch<SetStateAction<VerveSettingsMember[]>>;
  allocateId: () => string;
  firstPage: () => void;
}) {
  const [selection, setSelection] = useState<{
    kind: MemberAction;
    snapshot: VerveSettingsMember;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<VerveMemberDraft>({ ...blankVerveMember });
  const [errors, setErrors] = useState<VerveMemberErrors>({});
  const [deleteError, setDeleteError] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [notice, setNotice] = useState("");
  const opener = useRef<HTMLElement | null>(null);
  const openerIdentity = useRef<{ id: string; kind: MemberAction } | null>(null);
  const section = useRef<HTMLElement | null>(null);
  const member = members.find((item) => item.id === selection?.snapshot.id) ?? selection?.snapshot;
  const close = useCallback(() => setOpen(false), []);
  function begin(member: VerveSettingsMember, kind: MemberAction, trigger: HTMLElement) {
    opener.current = trigger;
    section.current = trigger.closest("section");
    openerIdentity.current = { id: member.id, kind };
    setSelection({ kind, snapshot: { ...member } });
    setDraft({ ...member });
    setErrors({});
    setDeleteError("");
    setDeleteConfirmation("");
    setOpen(true);
  }
  function edit() {
    if (!member) return;
    setDraft({ ...member });
    setErrors({});
    setSelection({ kind: "edit", snapshot: { ...member } });
  }
  function update<K extends keyof VerveMemberDraft>(field: K, value: VerveMemberDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }
  function save() {
    if (!member || !members.some((item) => item.id === member.id)) return false;
    const result = validateVerveMember(draft, members, member.id);
    setErrors(result.errors);
    if (Object.keys(result.errors).length) return false;
    setMembers((current) =>
      current.map((item) => (item.id === member.id ? { ...item, ...result.value } : item)),
    );
    setNotice(`${result.value.name} updated locally. No real access was changed.`);
    firstPage();
    close();
    return true;
  }
  function remove() {
    if (!member || deleteConfirmation !== member.email) {
      setDeleteError("Enter the member email to confirm removal.");
      return false;
    }
    if (member.role === "Admin" && members.filter((item) => item.role === "Admin").length === 1) {
      setDeleteError("Keep at least one administrator in this local workspace.");
      return false;
    }
    setMembers((current) => current.filter((item) => item.id !== member.id));
    setNotice(
      `${member.name} removed from this local preview. Real workspace access is unchanged.`,
    );
    firstPage();
    close();
    return true;
  }
  function importRows(rows: readonly VerveImportRow[]) {
    if (!rows.length) return "Choose a CSV with at least one valid member.";
    const prior = [...members];
    for (const row of rows) {
      const result = validateVerveMember(row.draft, prior);
      if (row.issues.length || Object.keys(result.errors).length)
        return "Resolve invalid or duplicate rows before importing.";
      prior.push({ ...result.value, id: `validation-${prior.length}`, joined: verveSettingsDate });
    }
    const additions = rows.map((row) => ({
      ...row.draft,
      id: allocateId(),
      joined: verveSettingsDate,
    }));
    setMembers((current) => [...current, ...additions]);
    setNotice(
      `${additions.length} members imported locally. No invitations or access changes were sent.`,
    );
    firstPage();
    return null;
  }
  function restoreFocus(event: Event) {
    const identity = openerIdentity.current;
    const replacement = identity
      ? Array.from(
          section.current?.querySelectorAll<HTMLButtonElement>("button[data-member-id]") ?? [],
        ).find(
          (button) =>
            button.dataset.memberId === identity.id &&
            button.dataset.memberAction === identity.kind,
        )
      : undefined;
    const target = opener.current?.isConnected
      ? opener.current
      : (replacement ??
        section.current?.querySelector<HTMLInputElement>('input[aria-label="Search members"]'));
    if (!target?.isConnected) return;
    target.focus();
    if (target.ownerDocument.activeElement === target) event.preventDefault();
  }
  return {
    selection,
    member,
    open,
    begin,
    close,
    edit,
    draft,
    errors,
    update,
    save,
    remove,
    deleteError,
    deleteConfirmation,
    setDeleteConfirmation,
    notice,
    importRows,
    restoreFocus,
  };
}
export type VerveMemberActionsModel = ReturnType<typeof useVerveMemberActions>;
