import { useCallback, useRef, useState } from "react";
import type { StrataEnvironment } from "./strata-domain";

export interface StrataWorkspace {
  name: string;
  description: string;
  environment: StrataEnvironment;
  region: string;
}

export type StrataWorkspaceDraft = Pick<StrataWorkspace, "name" | "environment" | "region">;
export type StrataWorkspaceCreateResult =
  | { ok: true; index: number }
  | { ok: false; error: string };

export const STRATA_WORKSPACE_ENVIRONMENTS = [
  "Production",
  "Staging",
  "Sandbox",
] as const satisfies readonly StrataEnvironment[];

// Only these three distinct regions occur in the four observed workspace seeds.
// They are local choices, not a claim about the reference's unopened option list.
export const STRATA_WORKSPACE_REGIONS = ["EU West", "US East", "EU Central"] as const;

export function createStrataWorkspacesFixture(): StrataWorkspace[] {
  return [
    {
      name: "Bricklane Core",
      description: "Production · EU West",
      environment: "Production",
      region: "EU West",
    },
    {
      name: "Bricklane Edge",
      description: "Staging · US East",
      environment: "Staging",
      region: "US East",
    },
    {
      name: "Bricklane Labs",
      description: "Sandbox · EU West",
      environment: "Sandbox",
      region: "EU West",
    },
    {
      name: "Bricklane Data",
      description: "Analytics · EU Central",
      // Analytics is the existing display description, not a shared environment.
      // Production is an independent local default for this legacy seed.
      environment: "Production",
      region: "EU Central",
    },
  ];
}

export function createStrataWorkspace(
  workspaces: readonly StrataWorkspace[],
  draft: StrataWorkspaceDraft,
): { ok: true; index: number; workspace: StrataWorkspace } | { ok: false; error: string } {
  const name = draft.name.trim();
  if (!name) return { ok: false, error: "Enter a workspace name." };
  if (workspaces.some((workspace) => workspace.name.toLowerCase() === name.toLowerCase()))
    return { ok: false, error: "A workspace with this name already exists." };
  if (!STRATA_WORKSPACE_ENVIRONMENTS.some((environment) => environment === draft.environment))
    return { ok: false, error: "Choose a supported environment." };
  if (!STRATA_WORKSPACE_REGIONS.some((region) => region === draft.region))
    return { ok: false, error: "Choose a supported region." };
  return {
    ok: true,
    index: workspaces.length,
    workspace: {
      name,
      environment: draft.environment,
      region: draft.region,
      description: `${draft.environment} · ${draft.region}`,
    },
  };
}

export function useStrataWorkspacesModel() {
  const [state, setState] = useState(() => ({
    workspaces: createStrataWorkspacesFixture(),
    selectedIndex: 0,
  }));
  const current = useRef(state);
  const select = useCallback((index: number) => {
    const previous = current.current;
    if (!Number.isInteger(index) || index < 0 || index >= previous.workspaces.length) return;
    const next = { ...previous, selectedIndex: index };
    current.current = next;
    setState(next);
  }, []);
  const create = useCallback((draft: StrataWorkspaceDraft): StrataWorkspaceCreateResult => {
    const previous = current.current;
    const result = createStrataWorkspace(previous.workspaces, draft);
    if (!result.ok) return result;
    const next = {
      workspaces: [...previous.workspaces, result.workspace],
      selectedIndex: result.index,
    };
    current.current = next;
    setState(next);
    return { ok: true, index: result.index };
  }, []);
  return { ...state, select, create };
}
