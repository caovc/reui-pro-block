import { CreditCard, Database, Sparkles } from "lucide-react";

export const apiServices = [
  { id: "openai", name: "OpenAI", icon: Sparkles, path: "/v1/models", count: 3 },
  { id: "stripe", name: "Stripe", icon: CreditCard, path: "/v1/customers", count: 12 },
  { id: "supabase", name: "Supabase", icon: Database, path: "/rest/v1/projects", count: 6 },
] as const;

export type ApiServiceId = (typeof apiServices)[number]["id"];
export const designSections = ["Patterns", "Tokens", "Icons", "Motion"] as const;
export type DesignSection = (typeof designSections)[number];
export const syncSources = ["shadcn", "Cursor", "Paper"] as const;
export type SyncSource = (typeof syncSources)[number];
