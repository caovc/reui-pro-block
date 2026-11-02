import { parseRecordsCSV } from "@/blocks/application/empty-variants/first-run/csv";
import {
  verveMemberAuthentication,
  verveMemberBilling,
  verveMemberRoles,
  type VerveSettingsMember,
} from "./verve-settings-people-billing-data";

export type VerveMemberDraft = Omit<VerveSettingsMember, "id" | "joined">;
export type VerveMemberErrors = Partial<Record<keyof VerveMemberDraft, string>>;
export const blankVerveMember: VerveMemberDraft = {
  name: "",
  username: "",
  email: "",
  role: "Account Executive",
  billing: "Active",
  authentication: "SSO",
};
export function validateVerveMember(
  draft: VerveMemberDraft,
  members: readonly VerveSettingsMember[],
  exceptId?: string,
): { value: VerveMemberDraft; errors: VerveMemberErrors } {
  const value = {
    ...draft,
    name: draft.name.trim(),
    username: draft.username.trim(),
    email: draft.email.trim().toLowerCase(),
  };
  const errors: VerveMemberErrors = {};
  if (!value.name || value.name.length > 120) errors.name = "Enter a name of 1 to 120 characters.";
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(value.username))
    errors.username = "Use 1 to 80 letters, numbers, dots, underscores or hyphens.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))
    errors.email = "Enter a valid email address.";
  if (
    members.some((member) => member.id !== exceptId && member.email.toLowerCase() === value.email)
  )
    errors.email = "A member with this email already exists.";
  if (
    members.some(
      (member) =>
        member.id !== exceptId && member.username.toLowerCase() === value.username.toLowerCase(),
    )
  )
    errors.username = "A member with this username already exists.";
  if (!verveMemberRoles.includes(value.role)) errors.role = "Choose a valid role.";
  if (!verveMemberBilling.includes(value.billing))
    errors.billing = "Choose a valid billing status.";
  if (!verveMemberAuthentication.includes(value.authentication))
    errors.authentication = "Choose a valid authentication method.";
  const current = members.find((member) => member.id === exceptId);
  if (
    current?.role === "Admin" &&
    value.role !== "Admin" &&
    members.filter((member) => member.role === "Admin").length === 1
  )
    errors.role = "Keep at least one administrator in this local workspace.";
  return { value, errors };
}

/** Invites keep distinct legal email addresses while sharing Edit/CSV username rules.
 * Only the generated username changes; the original member fields are preserved. */
export function withUniqueVerveInviteUsername(
  member: VerveSettingsMember,
  existing: readonly VerveSettingsMember[],
): VerveSettingsMember {
  const stem = member.username.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || "member";
  let next = { ...member, username: stem };
  let suffix = 1;
  while (validateVerveMember(next, existing).errors.username) {
    suffix += 1;
    const tail = `-${suffix}`;
    next = { ...next, username: `${stem.slice(0, 80 - tail.length)}${tail}` };
  }
  return next;
}

export type VerveImportRow = { id: string; draft: VerveMemberDraft; issues: string[] };
const importHeaders = ["name", "username", "email", "role", "billing", "authentication"];
export const verveMemberCsvSample = [
  "name,username,email,role,billing,authentication",
  "Rowan Blake,rowan.blake,rowan@crm.bricklane.example,RevOps,Active,Two-factor",
].join("\n");
/** CSV grammar is reused unchanged; this adapter validates CRM domain fields. */
export function previewVerveMemberImport(
  text: string,
  members: readonly VerveSettingsMember[],
): VerveImportRow[] {
  const [head, ...rows] = parseRecordsCSV(text, { maxColumns: 6, maxRecords: 200 });
  const headers = head.map((value) => value.trim().toLowerCase());
  if (
    new Set(headers).size !== headers.length ||
    headers.some((header) => !importHeaders.includes(header))
  )
    throw new Error("Use unique columns: name, username, email, role, billing, authentication.");
  if (!headers.includes("name") || !headers.includes("email"))
    throw new Error("Include name and email columns.");
  const prior = [...members];
  return rows.map((values, index) => {
    const record = Object.fromEntries(
      headers.map((header, position) => [header, values[position]]),
    );
    const draft = {
      ...blankVerveMember,
      ...record,
      username: record.username || record.email.split("@")[0],
    } as VerveMemberDraft;
    const result = validateVerveMember(draft, prior);
    const issues = Object.values(result.errors);
    prior.push({ ...result.value, id: `csv-preview-${index}`, joined: "2026-10-22" });
    return { id: `csv-row-${index + 2}`, draft: result.value, issues };
  });
}

/** Original local demo plan policies, not inferred private ReUI billing formulas. */
export const vervePlanOptions = [
  { id: "starter", name: "Verve Starter", unitPrice: 19, contactsLimit: 25000, creditsLimit: 500 },
  { id: "growth", name: "Verve Growth", unitPrice: 39, contactsLimit: 250000, creditsLimit: 5000 },
  { id: "scale", name: "Verve Scale", unitPrice: 69, contactsLimit: 1000000, creditsLimit: 20000 },
] as const;
export type VervePlanId = (typeof vervePlanOptions)[number]["id"];
