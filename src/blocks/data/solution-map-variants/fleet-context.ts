import { createContext, useContext } from "react";
import type { FleetAction, FleetState } from "./fleet-types";

export type DispatchDialog =
  | { kind: "create" }
  | { kind: "reassign" | "reschedule" | "fail"; stopId: string }
  | { kind: "edit" | "message" | "retire"; vehicleId: string }
  | null;

export type FleetStore = {
  state: FleetState;
  act: (action: FleetAction) => boolean;
};
export const FleetContext = createContext<FleetStore | null>(null);

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) throw new Error("Dispatch views must be inside FleetProvider");
  return context;
}
