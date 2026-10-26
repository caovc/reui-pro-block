/** Independent Bricklane Dispatch fixtures and simulation; no live GPS or driver service. */
export type Coordinate = [longitude: number, latitude: number];
export type VehicleKind = "gas" | "electric";
export type VehicleStatus =
  | "On route"
  | "Returning"
  | "At depot"
  | "Charging"
  | "Maintenance"
  | "Breakdown"
  | "Retired";
export type StopStatus = "Pending" | "En route" | "Delivered" | "Failed";
export type DriveMode = "Eco" | "Standard" | "Power";
export type ExceptionKind = "breakdown" | "late" | "range" | "temperature" | "failed";

export interface VehicleControls {
  mode: DriveMode;
  speedLimit: number;
  reserve: number;
  targetTemperature: number;
  chargeLimit: number;
  idleShutdown: boolean;
  geofenceAlerts: boolean;
  driverCoaching: boolean;
}

export interface FleetVehicle {
  id: string;
  driver: string;
  registration: string;
  kind: VehicleKind;
  coldBox: boolean;
  body: "van" | "box";
  status: VehicleStatus;
  depot: string;
  capacity: number;
  fuel: number;
  maxRange: number;
  temperature: number;
  position: Coordinate;
  routeIds: string[];
  controls: VehicleControls;
}

export interface DeliveryStop {
  id: string;
  vehicleId: string;
  customer: string;
  merchant?: string;
  note?: string;
  address: string;
  position: Coordinate;
  parcels: number;
  cold: boolean;
  status: StopStatus;
  windowStart: number;
  windowEnd: number;
  serviceMinutes: number;
  completedAt?: number;
  failureReason?: string;
}

export interface FleetException {
  id: string;
  vehicleId: string;
  stopId?: string;
  kind: ExceptionKind;
  title: string;
  detail: string;
  createdAt: number;
  acknowledged: boolean;
}

export interface FleetActivity {
  id: string;
  at: number;
  vehicleId?: string;
  title: string;
  detail: string;
}

export type FleetInverse =
  | { entity: "vehicle"; id: string; values: Partial<FleetVehicle> }
  | { entity: "stop"; id: string; values: Partial<DeliveryStop> }
  | { entity: "remove-stop"; id: string }
  | { entity: "remove-exception"; id: string }
  | { entity: "exception"; id: string; values: Partial<FleetException> };

export interface FleetUndo {
  id: number;
  label: string;
  inverse: FleetInverse[];
}

export interface FleetState {
  now: number;
  running: boolean;
  speed: number;
  selectedVehicleId: string | null;
  selectedStopId: string | null;
  vehicles: Record<string, FleetVehicle>;
  stops: Record<string, DeliveryStop>;
  exceptions: FleetException[];
  activity: FleetActivity[];
  undo: FleetUndo[];
  sequence: number;
  feedback: { id: number; kind: "success" | "error"; message: string } | null;
}

export type FleetAction =
  | { type: "tick"; elapsed: number }
  | { type: "running"; value: boolean }
  | { type: "speed"; value: number }
  | { type: "select"; vehicleId: string | null; stopId?: string | null }
  | { type: "reassign"; stopId: string; vehicleId: string }
  | { type: "reschedule"; stopId: string; windowStart: number; windowEnd: number }
  | { type: "complete-stop"; stopId: string }
  | { type: "fail-stop"; stopId: string; reason: string }
  | { type: "create-stop"; stop: Omit<DeliveryStop, "id" | "status"> }
  | { type: "controls"; vehicleId: string; controls: VehicleControls }
  | {
      type: "edit-vehicle";
      vehicleId: string;
      driver: string;
      capacity: number;
      registration: string;
      kind: VehicleKind;
      coldBox: boolean;
      fuel: number;
    }
  | { type: "retire"; vehicleId: string }
  | { type: "acknowledge"; exceptionId: string }
  | { type: "message"; vehicleId: string; message: string }
  | { type: "undo"; id?: number };
