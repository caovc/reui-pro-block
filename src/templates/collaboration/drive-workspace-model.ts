import { useState } from "react";
import { toast } from "sonner";

export type DrivePlanId = "free" | "team" | "business";

export type DrivePlan = {
  id: DrivePlanId;
  name: string;
  monthlyPrice: number;
  seats: number;
  storageLabel: string;
};

export const drivePlans: readonly DrivePlan[] = [
  { id: "free", name: "Free", monthlyPrice: 0, seats: 3, storageLabel: "1.00 GB" },
  { id: "team", name: "Team", monthlyPrice: 49, seats: 10, storageLabel: "1.00 TB" },
  { id: "business", name: "Business", monthlyPrice: 149, seats: 24, storageLabel: "2.00 TB" },
];

export function getDrivePlan(id: DrivePlanId): DrivePlan {
  return drivePlans.find((plan) => plan.id === id) ?? drivePlans[0]!;
}

export type DriveWorkspace = {
  id: string;
  name: string;
  plan: DrivePlanId;
  mark: "brick" | "teal" | "amber";
};

const initialWorkspaces: readonly DriveWorkspace[] = [
  { id: "bricklane", name: "Bricklane", plan: "free", mark: "brick" },
  { id: "northwind", name: "Northwind Studio", plan: "team", mark: "teal" },
  { id: "personal", name: "Personal", plan: "free", mark: "amber" },
];

/** Mount once in Drive's host; SPA navigation retains state, refresh resets the demo. */
export function useDriveWorkspaceModel() {
  const [workspaces, setWorkspaces] = useState<DriveWorkspace[]>(() =>
    initialWorkspaces.map((workspace) => ({ ...workspace })),
  );
  const [selectedId, setSelectedId] = useState("bricklane");
  const [globalPlanId, setGlobalPlanId] = useState<DrivePlanId>("free");
  const currentWorkspace = workspaces.find((workspace) => workspace.id === selectedId)!;
  const currentPlan = getDrivePlan(globalPlanId);

  function selectWorkspace(id: string) {
    if (workspaces.some((workspace) => workspace.id === id)) {
      setSelectedId(id);
    }
  }

  function changeCurrentPlan(plan: DrivePlanId) {
    if (globalPlanId === plan) return;
    const nextPlan = getDrivePlan(plan);
    setGlobalPlanId(plan);
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === selectedId ? { ...workspace, plan } : workspace,
      ),
    );
    toast.success(`Switched to ${nextPlan.name}`, {
      description: `${nextPlan.storageLabel} of storage, ${nextPlan.seats} seats.`,
    });
  }

  /** Keep Settings' saved form snapshot separate; rename only the active menu entry. */
  function renameCurrentWorkspace(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === selectedId ? { ...workspace, name: trimmedName } : workspace,
      ),
    );
  }

  /** Local preview extension: reference Create submission was not exercised. */
  function createWorkspace(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const workspace: DriveWorkspace = {
      id: crypto.randomUUID(),
      name: trimmedName,
      plan: "free",
      mark: "brick",
    };
    setWorkspaces((current) => [...current, workspace]);
    setSelectedId(workspace.id);
  }

  return {
    workspaces,
    selectedId,
    currentWorkspace,
    currentPlan,
    selectWorkspace,
    changeCurrentPlan,
    renameCurrentWorkspace,
    createWorkspace,
  };
}
