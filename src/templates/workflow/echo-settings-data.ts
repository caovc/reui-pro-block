import { useState } from "react";
import type {
  SettingsFieldDefinition,
  SettingsValue,
  SettingsValues,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { demoAvatar } from "@/lib/demo-artwork";

export const echoModels = ["Claude Sonnet 5", "GPT-5.1", "Gemini 3 Pro", "Mistral Large"] as const;
export const echoSettingsSections = [
  "General",
  "Personalization",
  "My Profile",
  "Notifications",
  "Data controls",
  "Security",
  "Billing",
] as const;
export type EchoSettingsSection = (typeof echoSettingsSections)[number];
export const echoProfileAvatar = demoAvatar("Echo account");
export const echoSettingsInitial: SettingsValues = {
  defaultModel: echoModels[0],
  dictation: true,
  nickname: "",
  occupation: "",
  style: "",
  memory: true,
  name: "shadcn",
  email: "m@example.com",
  username: "shadcn",
  role: "Engineering Lead",
  timezone: "UTC-8 (Pacific Time)",
  website: "shadcn.com",
  bio: "Building developer tools at Bricklane. Previously at a design studio.",
  avatar: echoProfileAvatar,
  desktop: true,
  quietStart: "8:00 PM",
  quietEnd: "8:00 AM",
  unread: true,
  dismiss: "10 minutes",
  team: true,
  announcements: false,
  digest: true,
  cadence: "Weekly digest",
  authenticator: true,
  phone: "415 555 0148",
  delivery: "Authenticator first",
  trusted: true,
  billingEmail: "billing@bricklane.example",
  company: "Bricklane Labs",
  country: "United States",
  tax: "US-2048-BRICKLANE",
};
export const echoSectionFields: Record<EchoSettingsSection, string[]> = {
  General: ["defaultModel", "dictation"],
  Personalization: ["nickname", "occupation", "style"],
  "My Profile": ["name", "email", "username", "role", "timezone", "website", "bio", "avatar"],
  Notifications: [
    "desktop",
    "quietStart",
    "quietEnd",
    "unread",
    "dismiss",
    "team",
    "announcements",
    "digest",
    "cadence",
  ],
  "Data controls": [],
  Security: ["authenticator", "phone", "delivery", "trusted"],
  Billing: ["billingEmail", "company", "country", "tax"],
};
export const echoAboutFields: SettingsFieldDefinition[] = [
  { id: "nickname", label: "What to call you", description: "Used when it addresses you." },
  { id: "occupation", label: "What you do", description: "Assumed in every chat." },
  {
    id: "style",
    label: "How to answer",
    description: "Tone, length, and house rules.",
    type: "textarea",
    maxLength: 2000,
  },
];
export const echoProfileFields: SettingsFieldDefinition[] = [
  { id: "name", label: "Full name", description: "Used across the workspace." },
  { id: "email", label: "Email address", description: "Primary sign-in email.", type: "email" },
  { id: "username", label: "Username", description: "Visible in mentions and links.", prefix: "@" },
];
export const echoProfileDetails: SettingsFieldDefinition[] = [
  {
    id: "role",
    label: "Role",
    options: ["Engineering Lead", "Developer", "Designer", "Product Manager"],
  },
  {
    id: "timezone",
    label: "Time zone",
    options: [
      "UTC-8 (Pacific Time)",
      "UTC-5 (Eastern Time)",
      "UTC+0 (London)",
      "UTC+1 (Berlin)",
      "UTC+9 (Tokyo)",
    ],
  },
  { id: "website", label: "Website", prefix: "https://" },
  {
    id: "bio",
    label: "Bio",
    description: "Short profile summary.",
    type: "textarea",
    maxLength: 1000,
  },
];
export const echoBillingFields: SettingsFieldDefinition[] = [
  {
    id: "billingEmail",
    label: "Billing email",
    description: "Where receipts and invoices go.",
    type: "email",
  },
  { id: "company", label: "Company name", description: "Shown on your invoices." },
  {
    id: "country",
    label: "Country",
    options: ["United States", "United Kingdom", "Germany", "Uzbekistan"],
  },
  { id: "tax", label: "Tax ID", prefix: "VAT" },
];
export const echoInitialMemories = [
  "Works on the billing platform, mostly Stripe webhooks and dunning.",
  "Prefers TypeScript examples with no comments unless the logic is subtle.",
  "Reviews are written against the team's checklist, not general advice.",
  "Deploys on Fridays are avoided, so scheduled work lands Thursday.",
  "Uses pnpm, and asks for commands rather than for instructions.",
];
export function useEchoSettingsModel() {
  const [section, setSection] = useState<EchoSettingsSection>("General");
  const [saved, setSaved] = useState<SettingsValues>({ ...echoSettingsInitial });
  const [draft, setDraft] = useState<SettingsValues>({ ...echoSettingsInitial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [profilePrompt, setProfilePrompt] = useState(true);
  const [memories, setMemories] = useState(echoInitialMemories);
  const [sessions, setSessions] = useState(["Safari on iPhone", "Firefox on Windows"]);
  const [plan, setPlan] = useState("Pro");
  const [paymentLast4, setPaymentLast4] = useState("4242");
  const [signedOut, setSignedOut] = useState(false);
  function change(id: string, value: SettingsValue) {
    setDraft((current) => ({ ...current, [id]: value }));
    setErrors((current) => ({ ...current, [id]: "" }));
    setStatus("");
  }
  function immediate(id: string, value: SettingsValue) {
    change(id, value);
    setSaved((current) => ({ ...current, [id]: value }));
  }
  function cancel(active = section) {
    const keys = echoSectionFields[active];
    setDraft((current) => ({
      ...current,
      ...Object.fromEntries(keys.map((key) => [key, saved[key]])),
    }));
    setErrors({});
    setStatus("");
  }
  function save(active = section) {
    const nextErrors: Record<string, string> = {};
    if (active === "My Profile") {
      if (!String(draft.name).trim()) nextErrors.name = "Enter your full name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(draft.email)))
        nextErrors.email = "Enter a valid email address.";
      if (!/^[a-zA-Z0-9_-]+$/.test(String(draft.username)))
        nextErrors.username = "Use letters, numbers, underscores or hyphens.";
    }
    if (active === "Billing" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(draft.billingEmail)))
      nextErrors.billingEmail = "Enter a valid billing email.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return false;
    const keys = echoSectionFields[active];
    setSaved((current) => ({
      ...current,
      ...Object.fromEntries(keys.map((key) => [key, draft[key]])),
    }));
    setStatus(
      active === "Notifications"
        ? "Preferences saved."
        : active === "Billing"
          ? "Billing details updated locally."
          : "Changes saved.",
    );
    return true;
  }
  function resetNotifications() {
    setDraft((current) => ({
      ...current,
      ...Object.fromEntries(
        echoSectionFields.Notifications.map((key) => [key, echoSettingsInitial[key]]),
      ),
    }));
    setStatus("");
  }
  function clearAccount() {
    const cleared: SettingsValues = Object.fromEntries(
      Object.entries(echoSettingsInitial).map(([key, value]) => [
        key,
        typeof value === "boolean" ? false : "",
      ]),
    );
    cleared.name = "Local guest";
    cleared.defaultModel = echoModels[0];
    setSaved(cleared);
    setDraft(cleared);
    setErrors({});
    setStatus("");
    setMemories([]);
    setSessions([]);
    setPlan("Free");
    setPaymentLast4("");
    setProfilePrompt(false);
    setSignedOut(true);
  }
  return {
    section,
    setSection,
    saved,
    draft,
    errors,
    status,
    setStatus,
    change,
    immediate,
    cancel,
    save,
    resetNotifications,
    profilePrompt,
    setProfilePrompt,
    memories,
    setMemories,
    sessions,
    setSessions,
    plan,
    setPlan,
    paymentLast4,
    setPaymentLast4,
    signedOut,
    setSignedOut,
    clearAccount,
  };
}
export type EchoSettingsModel = ReturnType<typeof useEchoSettingsModel>;
