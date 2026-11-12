import { STRATA_OWNERS, type StrataEnvironment } from "./strata-domain.ts";

/** Publicly visible integration cards; artwork is authored separately as monograms. */
export const STRATA_SOURCE_PROVIDERS = [
  { id: "neon", name: "Neon", technology: "Postgres" },
  { id: "planetscale", name: "PlanetScale", technology: "MySQL" },
  { id: "supabase", name: "Supabase", technology: "Postgres" },
  { id: "redis", name: "Redis", technology: "Redis 7" },
  { id: "bigquery", name: "BigQuery", technology: "Google Cloud" },
  { id: "stripe", name: "Stripe", technology: "REST API" },
  { id: "github", name: "GitHub", technology: "REST API" },
  { id: "linear", name: "Linear", technology: "GraphQL API" },
  { id: "slack", name: "Slack", technology: "Web API" },
  { id: "google-drive", name: "Google Drive", technology: "Sheets API" },
  { id: "dropbox", name: "Dropbox", technology: "Files API" },
] as const;
export type StrataSourceProvider = (typeof STRATA_SOURCE_PROVIDERS)[number];
export type StrataSourceProviderId = StrataSourceProvider["id"];

export function searchStrataSourceProviders(search: string): readonly StrataSourceProvider[] {
  const query = search.trim().toLowerCase();
  return STRATA_SOURCE_PROVIDERS.filter((provider) =>
    `${provider.name} ${provider.technology}`.toLowerCase().includes(query),
  );
}

export interface StrataNeonDraft {
  name: string;
  environment: StrataEnvironment;
  host: string;
  password: string;
  frequency: "every-15m";
  ownerId: string;
  alertOnFailure: boolean;
}

export function createStrataNeonDraft(): StrataNeonDraft {
  return {
    name: "",
    environment: "Production",
    host: "",
    password: "",
    frequency: "every-15m",
    ownerId: STRATA_OWNERS[0].id,
    alertOnFailure: true,
  };
}

/** Local shape checks only. No DNS, network, authentication, persistence or connection claim. */
export function validateStrataNeonDraft(draft: StrataNeonDraft) {
  const errors: Partial<Record<keyof StrataNeonDraft, string>> = {};
  if (!draft.name.trim()) errors.name = "Enter a source name.";
  const host = draft.host.trim();
  const labels = host.split(".");
  if (
    !host ||
    host.length > 253 ||
    labels.length < 2 ||
    labels.some((label) => !/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label))
  )
    errors.host = "Enter a hostname without a URL, port or credentials.";
  if (!draft.password.trim()) errors.password = "Enter a password for local validation.";
  if (!["Production", "Staging", "Sandbox"].includes(draft.environment))
    errors.environment = "Choose an environment.";
  if (!STRATA_OWNERS.some((owner) => owner.id === draft.ownerId))
    errors.ownerId = "Choose an owner.";
  if (draft.frequency !== "every-15m") errors.frequency = "Choose the available sync frequency.";
  return errors;
}

export interface StrataSourceSetupState {
  step: 1 | 2;
  providerId: StrataSourceProviderId | null;
  search: string;
  neon: StrataNeonDraft;
}

export function createStrataSourceSetup(): StrataSourceSetupState {
  return { step: 1, providerId: null, search: "", neon: createStrataNeonDraft() };
}

/** Only Neon's Configure schema has been observed. Other providers retain selection only. */
export function continueStrataSourceSetup(state: StrataSourceSetupState): StrataSourceSetupState {
  return state.step === 1 && state.providerId === "neon" ? { ...state, step: 2 } : state;
}

export function backStrataSourceSetup(state: StrataSourceSetupState): StrataSourceSetupState {
  return state.step === 2 ? { ...state, step: 1 } : state;
}
