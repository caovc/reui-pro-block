/**
 * Independent Bricklane observability demo data. These are local fixtures,
 * not records fetched from a monitoring service or the reference application.
 */
export const STRATA_NOW = "2026-10-22T14:00:00.000Z";
export const STRATA_NOW_MS = Date.parse(STRATA_NOW);
export const STRATA_INCIDENT_ID = "checkout-release-350";

export type StrataEnvironment = "Production" | "Staging" | "Sandbox";
export type StrataEnvironmentFilter = "all" | StrataEnvironment;
export const STRATA_ROUTES = [
  "/",
  "/services",
  "/logs",
  "/monitors",
  "/deployments",
  "/deployments/board",
  "/calendar",
  "/sources",
  "/settings",
  "/services/checkout-api",
  "/monitors/api-acme-com",
  "/logs/errors-payments",
  "/calendar/on-call-payments",
] as const;
export const STRATA_AUTH_ROUTES = ["/sign-in", "/sign-up"] as const;
export type StrataRoute = (typeof STRATA_ROUTES)[number] | (typeof STRATA_AUTH_ROUTES)[number];

export interface StrataOwner {
  id: string;
  name: string;
  team: string;
}

export interface StrataService {
  id: string;
  name: string;
  environment: StrataEnvironment;
  cluster: string;
  ownerId: string;
}

export interface StrataPageProps {
  environment: StrataEnvironmentFilter;
  onEnvironmentChange: (environment: StrataEnvironmentFilter) => void;
  onNavigate: (route: StrataRoute) => void;
  pinnedRoutes: readonly StrataRoute[];
  onTogglePin: (route: StrataRoute) => void;
}

export const STRATA_OWNERS: readonly StrataOwner[] = [
  { id: "maya", name: "Maya Ellis", team: "Payments" },
  { id: "owen", name: "Owen Hart", team: "Platform" },
  { id: "leila", name: "Leila Grant", team: "Data" },
  { id: "noah", name: "Noah Bennett", team: "Platform" },
  { id: "sofia", name: "Sofia Reed", team: "Payments" },
  { id: "eli", name: "Eli Morgan", team: "Search" },
  { id: "iris", name: "Iris Chen", team: "Experience" },
  { id: "luca", name: "Luca Hayes", team: "Data" },
  { id: "avery", name: "Avery Brooks", team: "Experience" },
];

export const STRATA_SERVICES: readonly StrataService[] = [
  {
    id: "checkout-api",
    name: "checkout-api",
    environment: "Production",
    cluster: "eu-west-1",
    ownerId: "maya",
  },
  {
    id: "payments-api",
    name: "payments-api",
    environment: "Production",
    cluster: "eu-west-1",
    ownerId: "sofia",
  },
  {
    id: "search-indexer",
    name: "search-indexer",
    environment: "Production",
    cluster: "eu-central-1",
    ownerId: "eli",
  },
  {
    id: "webhook-worker",
    name: "webhook-worker",
    environment: "Production",
    cluster: "eu-west-1",
    ownerId: "noah",
  },
  {
    id: "otel-collector",
    name: "otel-collector",
    environment: "Production",
    cluster: "eu-west-1",
    ownerId: "owen",
  },
  {
    id: "status-renderer",
    name: "status-renderer",
    environment: "Production",
    cluster: "eu-central-1",
    ownerId: "iris",
  },
  {
    id: "email-sender",
    name: "email-sender",
    environment: "Production",
    cluster: "eu-west-1",
    ownerId: "avery",
  },
  {
    id: "search-api",
    name: "search-api",
    environment: "Production",
    cluster: "eu-central-1",
    ownerId: "eli",
  },
  {
    id: "ledger-worker",
    name: "ledger-worker",
    environment: "Production",
    cluster: "eu-west-1",
    ownerId: "leila",
  },
  {
    id: "warehouse-sync",
    name: "warehouse-sync",
    environment: "Production",
    cluster: "eu-central-1",
    ownerId: "luca",
  },
  {
    id: "edge-gateway",
    name: "edge-gateway",
    environment: "Staging",
    cluster: "us-east-1",
    ownerId: "owen",
  },
  {
    id: "sandbox-api",
    name: "sandbox-api",
    environment: "Sandbox",
    cluster: "eu-west-1",
    ownerId: "noah",
  },
];

export function strataOwner(id: string): StrataOwner | undefined {
  return STRATA_OWNERS.find((owner) => owner.id === id);
}

export function strataService(id: string): StrataService | undefined {
  return STRATA_SERVICES.find((service) => service.id === id);
}

export function strataEnvironmentMatches(
  serviceId: string,
  environment: StrataEnvironmentFilter,
): boolean {
  return environment === "all" || strataService(serviceId)?.environment === environment;
}
