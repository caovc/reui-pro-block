import { useCallback, useRef, useState } from "react";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { downloadDrivePdf } from "../collaboration/drive-settings-downloads";
import {
  verveBillingInitial,
  verveBillingInvoices,
  verveBillingRegions,
  verveMemberAuthentication,
  verveMemberRoles,
  verveMoney,
  verveSettingsDate,
  verveSettingsMembers,
  type VerveBillingDetails,
  type VerveBillingInvoice,
  type VerveMemberAuthentication,
  type VerveMemberRole,
  type VerveSettingsMember,
} from "./verve-settings-people-billing-data";

type VerveCompanyCardDraft = {
  holder: string;
  number: string;
  expiry: string;
  cvc: string;
  zip: string;
  isDefault: boolean;
};

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export function useVervePeopleBillingModel() {
  const nextMember = useRef(10);
  const [members, setMembers] = useState(() =>
    verveSettingsMembers.map((member) => ({ ...member })),
  );
  const [search, setSearchState] = useState("");
  const [roles, setRolesState] = useState<string[]>([]);
  const [billingStatuses, setBillingStatusesState] = useState<string[]>([]);
  const [authentication, setAuthenticationState] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "member", desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteRole, setInviteRole] = useState<VerveMemberRole>("Admin");
  const [inviteAuthentication, setInviteAuthentication] =
    useState<VerveMemberAuthentication>("SSO");
  const [inviteSendEmail, setInviteSendEmail] = useState(true);
  const [inviteError, setInviteError] = useState("");
  const [invitationDrafts, setInvitationDrafts] = useState<
    {
      emails: string[];
      role: VerveMemberRole;
      authentication: VerveMemberAuthentication;
      emailRequested: boolean;
    }[]
  >([]);
  const [billing, setBilling] = useState(() => ({ ...verveBillingInitial }));
  const [billingDraft, setBillingDraft] = useState(() => ({ ...verveBillingInitial }));
  const [billingErrors, setBillingErrors] = useState<
    Partial<Record<keyof VerveBillingDetails, string>>
  >({});
  const [billingOpen, setBillingOpenState] = useState(false);
  const closeBilling = useCallback(() => setBillingOpenState(false), []);
  const [cardEntry, setCardEntry] = useState<"alert" | "details" | null>(null);
  const [cardDraft, setCardDraft] = useState<VerveCompanyCardDraft>({
    holder: "",
    number: "",
    expiry: "",
    cvc: "",
    zip: "",
    isDefault: true,
  });
  const [cardErrors, setCardErrors] = useState<
    Partial<Record<"holder" | "number" | "expiry" | "cvc" | "zip", string>>
  >({});
  const [companyCard, setCompanyCard] = useState<{
    holder: string;
    last4: string;
    expiry: string;
    isDefault: boolean;
  } | null>(null);
  function openCard(entry: "alert" | "details") {
    setCardDraft({ holder: "", number: "", expiry: "", cvc: "", zip: "", isDefault: true });
    setCardErrors({});
    setCardEntry(entry);
  }
  const closeCard = useCallback(() => {
    setCardEntry(null);
    setCardDraft({ holder: "", number: "", expiry: "", cvc: "", zip: "", isDefault: true });
    setCardErrors({});
  }, []);
  function updateCard<K extends keyof VerveCompanyCardDraft>(
    field: K,
    value: VerveCompanyCardDraft[K],
  ) {
    setCardDraft((current) => ({ ...current, [field]: value }));
    if (field !== "isDefault") setCardErrors((current) => ({ ...current, [field]: undefined }));
  }
  function saveCard() {
    const number = cardDraft.number.replaceAll(/\s/g, "");
    const errors: typeof cardErrors = {};
    if (!cardDraft.holder.trim()) errors.holder = "Enter a cardholder name.";
    if (!/^\d{12,19}$/.test(number)) errors.number = "Enter 12 to 19 digits.";
    const expiry = /^(\d{2})\/(\d{2})$/.exec(cardDraft.expiry);
    if (
      !expiry ||
      Number(expiry[1]) < 1 ||
      Number(expiry[1]) > 12 ||
      Number(`20${expiry[2]}`) < 2026 ||
      (expiry[2] === "26" && Number(expiry[1]) < 10)
    )
      errors.expiry = "Enter a future date as MM/YY.";
    if (!/^\d{3,4}$/.test(cardDraft.cvc)) errors.cvc = "Enter 3 or 4 digits.";
    if (!cardDraft.zip.trim()) errors.zip = "Enter a billing postal code.";
    setCardErrors(errors);
    if (Object.keys(errors).length) return false;
    setCompanyCard({
      holder: cardDraft.holder.trim(),
      last4: number.slice(-4),
      expiry: cardDraft.expiry,
      isDefault: cardDraft.isDefault,
    });
    closeCard();
    toast.success("Demo card added", {
      description:
        "Only a local display summary was saved. No real card was stored or payment made.",
    });
    return true;
  }
  function firstPage() {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }
  function setSearch(value: string) {
    setSearchState(value);
    firstPage();
  }
  function setRoles(value: string[]) {
    setRolesState(value);
    firstPage();
  }
  function setBillingStatuses(value: string[]) {
    setBillingStatusesState(value);
    firstPage();
  }
  function setAuthentication(value: string[]) {
    setAuthenticationState(value);
    firstPage();
  }
  function clearFilters() {
    setRoles([]);
    setBillingStatuses([]);
    setAuthentication([]);
  }
  function addInviteToken(value = inviteInput) {
    const email = value.trim().toLowerCase();
    if (!email) return false;
    if (!validEmail(email)) {
      setInviteError("Enter a valid email address.");
      return false;
    }
    if (inviteEmails.includes(email)) {
      setInviteError("This email has already been added.");
      return false;
    }
    setInviteEmails((current) => [...current, email]);
    setInviteInput("");
    setInviteError("");
    return true;
  }
  function sendInvites() {
    if (
      !verveMemberRoles.includes(inviteRole) ||
      !verveMemberAuthentication.includes(inviteAuthentication)
    ) {
      setInviteError("Choose a valid role and authentication method.");
      return false;
    }
    const pending = inviteInput.trim().toLowerCase();
    const emails = [...inviteEmails, ...(pending ? [pending] : [])];
    if (!emails.length || emails.some((email) => !validEmail(email))) {
      setInviteError(!emails.length ? "Enter an email address" : "Enter a valid email address.");
      return false;
    }
    if (
      new Set(emails).size !== emails.length ||
      emails.some((email) => members.some((member) => member.email.toLowerCase() === email))
    ) {
      setInviteError("Remove duplicate or existing member addresses.");
      return false;
    }
    const additions = emails.map((email): VerveSettingsMember => ({
      id: `crm-local-member-${nextMember.current++}`,
      name: email.split("@")[0].replaceAll(/[._-]/g, " "),
      username: email.split("@")[0],
      email,
      role: inviteRole,
      billing: "Pending invoice",
      authentication: inviteAuthentication,
      joined: verveSettingsDate,
    }));
    setMembers((current) => [...current, ...additions]);
    setInvitationDrafts((current) => [
      ...current,
      {
        emails,
        role: inviteRole,
        authentication: inviteAuthentication,
        emailRequested: inviteSendEmail,
      },
    ]);
    firstPage();
    setInviteOpen(false);
    setInviteEmails([]);
    setInviteInput("");
    setInviteError("");
    toast.success("Local invitations added", {
      description: `${emails.length} local records added. No email was sent and no workspace access was changed.`,
    });
    return true;
  }
  function setBillingOpen(open: boolean) {
    if (open) {
      setBillingDraft({ ...billing });
      setBillingErrors({});
    }
    setBillingOpenState(open);
  }
  function updateBilling(field: keyof VerveBillingDetails, value: string) {
    setBillingDraft((current) => ({ ...current, [field]: value }));
    setBillingErrors((current) => ({ ...current, [field]: undefined }));
  }
  function saveBilling() {
    const draft = {
      contact: billingDraft.contact.trim().toLowerCase(),
      legalEntity: billingDraft.legalEntity.trim(),
      region: billingDraft.region,
    };
    const errors: Partial<Record<keyof VerveBillingDetails, string>> = {};
    if (!validEmail(draft.contact)) errors.contact = "Enter a valid billing email.";
    if (!draft.legalEntity) errors.legalEntity = "Enter a legal entity.";
    if (!verveBillingRegions.includes(draft.region as (typeof verveBillingRegions)[number]))
      errors.region = "Choose a region.";
    setBillingErrors(errors);
    if (Object.keys(errors).length) return false;
    setBilling(draft);
    setBillingOpenState(false);
    toast.success("Billing details saved", {
      description: "Local preview only; no account or payment was changed.",
    });
    return true;
  }
  function downloadInvoice(invoice: VerveBillingInvoice) {
    downloadDrivePdf(`${invoice.id}.pdf`, [
      "Bricklane CRM - original demo invoice",
      invoice.id,
      `Period: ${invoice.period}`,
      `Issued: ${invoice.issued}`,
      `Billed to: ${billing.legalEntity}`,
      `Billing contact: ${billing.contact}`,
      `Region: ${billing.region}`,
      `Total: ${verveMoney(invoice.amount)}`,
      `Status: ${invoice.status}`,
      "Demonstration only. No payment or tax document is created.",
    ]);
  }
  function downloadAllInvoices() {
    downloadDrivePdf("bricklane-crm-invoice-history.pdf", [
      "Bricklane CRM - original demo invoice history",
      `Billed to: ${billing.legalEntity}`,
      ...verveBillingInvoices.flatMap((invoice) => [
        invoice.id,
        `${invoice.period} - ${verveMoney(invoice.amount)} - ${invoice.status}`,
      ]),
      "Demonstration only. No payment or tax document is created.",
    ]);
  }
  return {
    cardEntry,
    openCard,
    closeCard,
    cardDraft,
    updateCard,
    cardErrors,
    saveCard,
    companyCard,
    renewalReady: Boolean(companyCard?.isDefault),
    members,
    search,
    setSearch,
    roles,
    setRoles,
    billingStatuses,
    setBillingStatuses,
    authentication,
    setAuthentication,
    clearFilters,
    sorting,
    setSorting,
    pagination,
    setPagination,
    invitationDrafts,
    inviteOpen,
    setInviteOpen,
    inviteEmails,
    setInviteEmails,
    inviteInput,
    setInviteInput,
    inviteRole,
    setInviteRole,
    inviteAuthentication,
    setInviteAuthentication,
    inviteSendEmail,
    setInviteSendEmail,
    inviteError,
    addInviteToken,
    sendInvites,
    billing,
    billingDraft,
    billingErrors,
    billingOpen,
    closeBilling,
    setBillingOpen,
    updateBilling,
    saveBilling,
    downloadInvoice,
    downloadAllInvoices,
  };
}
export type VervePeopleBillingModel = ReturnType<typeof useVervePeopleBillingModel>;
