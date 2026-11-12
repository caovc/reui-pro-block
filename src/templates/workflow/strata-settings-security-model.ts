import { useState } from "react";

export interface StrataSecurityPolicy {
  twoFactor: string;
  factors: { totp: boolean; passkey: boolean; securityKey: boolean; sms: boolean };
  password: string;
  idle: string;
  sessionLength: string;
  reauthenticate: boolean;
  singleSession: boolean;
}
export interface StrataIdentityProvider {
  id: string;
  name: string;
  url: string;
  status: "Connected" | "Error" | "Not configured" | "Configured locally";
  detail: string;
}
export interface StrataEmailDomain {
  name: string;
  status: "Verified fixture" | "Pending verification";
  record?: string;
}

export const STRATA_SECURITY_OPTIONS = {
  twoFactor: ["Required", "Optional"],
  password: ["Strong, 16 characters", "Standard, 12 characters"],
  idle: ["15 minutes", "30 minutes", "1 hour"],
  sessionLength: ["1 day", "7 days", "30 days"],
} as const;
export function createStrataSecurityPolicy(): StrataSecurityPolicy {
  return {
    twoFactor: "Required",
    factors: { totp: true, passkey: true, securityKey: false, sms: false },
    password: "Strong, 16 characters",
    idle: "30 minutes",
    sessionLength: "7 days",
    reauthenticate: true,
    singleSession: false,
  };
}
export function validateStrataSecurityPolicy(policy: StrataSecurityPolicy) {
  if (policy.twoFactor === "Required" && !Object.values(policy.factors).some(Boolean))
    return "Keep at least one second factor enabled when 2FA is required.";
  for (const name of ["twoFactor", "password", "idle", "sessionLength"] as const)
    if (!(STRATA_SECURITY_OPTIONS[name] as readonly string[]).includes(policy[name]))
      return `Choose a supported ${name} setting.`;
  return "";
}
export function addStrataPendingDomain(domains: readonly StrataEmailDomain[], raw: string) {
  const name = raw.trim().toLowerCase();
  if (!/^(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,63}$/.test(name))
    return { ok: false as const, error: "Enter an email domain such as team.bricklane.test." };
  if (domains.some((domain) => domain.name === name))
    return { ok: false as const, error: "This domain is already listed." };
  return {
    ok: true as const,
    domains: [
      ...domains,
      {
        name,
        status: "Pending verification" as const,
        record: `bricklane-demo-verification-${domains.length + 1}`,
      },
    ],
  };
}
export function validateStrataProviderUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) ? "" : "Use an HTTPS metadata URL.";
  } catch {
    return "Use a valid HTTPS metadata URL.";
  }
}
export function strataDemoScimToken(version: number) {
  return `bl_demo_scim_not_a_secret_${String(version).padStart(4, "0")}`;
}

export function configureStrataProvider(
  providers: readonly StrataIdentityProvider[],
  id: string,
  value: string,
) {
  if (!providers.some((provider) => provider.id === id))
    return { ok: false as const, error: "This provider is not available." };
  const error = validateStrataProviderUrl(value);
  if (error) return { ok: false as const, error };
  return {
    ok: true as const,
    providers: providers.map((provider) =>
      provider.id === id
        ? {
            ...provider,
            url: value.trim(),
            status: "Configured locally" as const,
            detail: "Local draft only. No identity-provider connection was made.",
          }
        : provider,
    ),
  };
}

export function useStrataSettingsSecurityModel() {
  const [saved, setSaved] = useState(createStrataSecurityPolicy);
  const [draft, setDraft] = useState(createStrataSecurityPolicy);
  const [memberView, setMemberView] = useState(false);
  const [tokenVersion, setTokenVersion] = useState(1);
  const [providers, setProviders] = useState<StrataIdentityProvider[]>([
    {
      id: "okta",
      name: "Okta",
      url: "https://identity.bricklane.test/okta/metadata",
      status: "Connected",
      detail: "Fixture: 57 members use this provider.",
    },
    {
      id: "entra",
      name: "Microsoft Entra ID",
      url: "https://identity.bricklane.test/entra/saml",
      status: "Error",
      detail: "Fixture: metadata signature has expired.",
    },
    {
      id: "google",
      name: "Google Workspace",
      url: "https://identity.bricklane.test/google/openid",
      status: "Not configured",
      detail: "No local configuration saved.",
    },
  ]);
  const [domains, setDomains] = useState<StrataEmailDomain[]>([
    { name: "bricklane.test", status: "Verified fixture" },
    { name: "eng.bricklane.test", status: "Verified fixture" },
  ]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const update = <K extends keyof StrataSecurityPolicy>(name: K, value: StrataSecurityPolicy[K]) =>
    setDraft((current) => ({ ...current, [name]: value }));
  const setFactor = (name: keyof StrataSecurityPolicy["factors"], enabled: boolean) =>
    setDraft((current) => ({ ...current, factors: { ...current.factors, [name]: enabled } }));
  const save = () => {
    const error = validateStrataSecurityPolicy(draft);
    if (error) return { ok: false as const, error };
    setSaved(structuredClone(draft));
    return { ok: true as const };
  };
  const discard = () => setDraft(structuredClone(saved));
  const addDomain = (value: string) => {
    const result = addStrataPendingDomain(domains, value);
    if (result.ok) setDomains(result.domains);
    return result;
  };
  const configureProvider = (id: string, url: string) => {
    const result = configureStrataProvider(providers, id, url);
    if (result.ok) setProviders(result.providers);
    return result;
  };
  return {
    draft,
    saved,
    dirty,
    memberView,
    setMemberView,
    providers,
    domains,
    update,
    setFactor,
    save,
    discard,
    addDomain,
    configureProvider,
    token: strataDemoScimToken(tokenVersion),
    rotateToken: () => setTokenVersion((current) => current + 1),
    endpoint: "https://bricklane.test/scim/v2",
  };
}
