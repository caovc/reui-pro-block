import { DEPOT, DISPATCH_EPOCH } from "./fleet-data";
import type {
  Coordinate,
  DeliveryStop,
  FleetAction,
  FleetInverse,
  FleetState,
  VehicleControls,
} from "./fleet-types";

export function milesBetween(a: Coordinate, b: Coordinate): number {
  const radians = Math.PI / 180;
  const latitude = (b[1] - a[1]) * radians;
  const longitude = (b[0] - a[0]) * radians;
  const h =
    Math.sin(latitude / 2) ** 2 +
    Math.cos(a[1] * radians) * Math.cos(b[1] * radians) * Math.sin(longitude / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function routeStops(state: FleetState, vehicleId: string): DeliveryStop[] {
  return (state.vehicles[vehicleId]?.routeIds ?? [])
    .map((id) => state.stops[id])
    .filter((stop): stop is DeliveryStop => !!stop);
}

export function openStops(state: FleetState, vehicleId: string): DeliveryStop[] {
  return routeStops(state, vehicleId).filter(
    (stop) => stop.status === "Pending" || stop.status === "En route",
  );
}

export function routeMetrics(state: FleetState, vehicleId: string) {
  const vehicle = state.vehicles[vehicleId];
  const all = routeStops(state, vehicleId);
  const pending = openStops(state, vehicleId);
  let position = vehicle?.position ?? DEPOT;
  let miles = 0;
  let serviceMinutes = 0;
  for (const stop of pending) {
    miles += milesBetween(position, stop.position);
    position = stop.position;
    serviceMinutes += stop.serviceMinutes;
  }
  const pace = Math.min(vehicle?.controls.speedLimit ?? 30, 24);
  const minutes = (miles / Math.max(1, pace)) * 60 + serviceMinutes;
  const remainingRange = ((vehicle?.maxRange ?? 0) * (vehicle?.fuel ?? 0)) / 100;
  return {
    all,
    pending,
    delivered: all.filter((stop) => stop.status === "Delivered").length,
    failed: all.filter((stop) => stop.status === "Failed").length,
    parcels: pending.reduce((sum, stop) => sum + stop.parcels, 0),
    miles,
    minutes,
    eta: state.now + minutes * 60_000,
    remainingRange,
    progress: all.length
      ? all.filter((stop) => stop.status === "Delivered").length / all.length
      : 0,
  };
}

export function vehicleAlerts(state: FleetState, vehicleId: string) {
  return state.exceptions.filter((exception) => exception.vehicleId === vehicleId);
}

export function reassignEligibility(state: FleetState, stopId: string, vehicleId: string) {
  const stop = state.stops[stopId];
  const vehicle = state.vehicles[vehicleId];
  if (!stop || !vehicle)
    return { eligible: false, reason: "Delivery or vehicle is unavailable", miles: 0, minutes: 0 };
  const metrics = routeMetrics(state, vehicleId);
  const distance = milesBetween(vehicle.position, stop.position);
  const minutes =
    (distance / Math.max(1, Math.min(vehicle.controls.speedLimit, 24))) * 60 + metrics.minutes;
  let reason = "Ready to receive this delivery";
  let eligible = true;
  if (!["Pending", "En route"].includes(stop.status)) reason = "Delivery is already closed";
  else if (stop.vehicleId === vehicleId) reason = "Already assigned to this vehicle";
  else if (vehicle.status === "Retired") reason = "Vehicle is retired";
  else if (["Charging", "Maintenance"].includes(vehicle.status)) reason = vehicle.status;
  else if (!vehicle.driver.trim()) reason = "No driver assigned";
  else if (vehicle.status === "Breakdown") reason = "Vehicle needs roadside support";
  else if (stop.cold && !vehicle.coldBox) reason = "Temperature-controlled vehicle required";
  else if (metrics.parcels + stop.parcels > vehicle.capacity)
    reason = "Insufficient parcel capacity";
  else if (metrics.miles + distance > metrics.remainingRange * (1 - vehicle.controls.reserve / 100))
    reason = "Insufficient range above reserve";
  else if (state.now + minutes * 60_000 > stop.windowEnd)
    reason = "Cannot reach delivery within its time window";
  else eligible = true;
  if (reason !== "Ready to receive this delivery") eligible = false;
  return { eligible, reason, miles: distance, minutes };
}

export function rankedCandidates(state: FleetState, stopId: string) {
  return Object.values(state.vehicles)
    .map((vehicle) => ({ vehicle, ...reassignEligibility(state, stopId, vehicle.id) }))
    .sort(
      (a, b) =>
        Number(b.eligible) - Number(a.eligible) ||
        a.minutes - b.minutes ||
        a.vehicle.id.localeCompare(b.vehicle.id),
    );
}

function failure(state: FleetState, message: string): FleetState {
  return {
    ...state,
    sequence: state.sequence + 1,
    feedback: { id: state.sequence + 1, kind: "error", message },
  };
}

function finish(
  state: FleetState,
  changed: Partial<FleetState>,
  message: string,
  inverse: FleetInverse[],
  vehicleId?: string,
  detail = "Local dispatch simulation",
): FleetState {
  const id = state.sequence + 1;
  return {
    ...state,
    ...changed,
    sequence: id,
    feedback: { id, kind: "success", message },
    activity: [
      { id: `a${id}`, at: state.now, vehicleId, title: message, detail },
      ...state.activity,
    ].slice(0, 80),
    undo: inverse.length
      ? [...state.undo, { id, label: message, inverse }].slice(-20)
      : (changed.undo ?? state.undo),
  };
}

function validControls(controls: VehicleControls): boolean {
  return (
    ["Eco", "Standard", "Power"].includes(controls.mode) &&
    Number.isFinite(controls.speedLimit) &&
    controls.speedLimit >= 45 &&
    controls.speedLimit <= 75 &&
    Number.isFinite(controls.reserve) &&
    controls.reserve >= 5 &&
    controls.reserve <= 40 &&
    Number.isFinite(controls.targetTemperature) &&
    controls.targetTemperature >= 33 &&
    controls.targetTemperature <= 41 &&
    Number.isFinite(controls.chargeLimit) &&
    controls.chargeLimit >= 60 &&
    controls.chargeLimit <= 100 &&
    [controls.idleShutdown, controls.geofenceAlerts, controls.driverCoaching].every(
      (value) => typeof value === "boolean",
    )
  );
}

function advanceSimulation(state: FleetState, elapsed: number): FleetState {
  if (!state.running || !Number.isFinite(elapsed) || elapsed <= 0) return state;
  const seconds = Math.min(elapsed, 30) * state.speed;
  const now = state.now + seconds * 1000;
  const vehicles = { ...state.vehicles };
  const stops = { ...state.stops };
  const exceptions = [...state.exceptions];
  for (const vehicle of Object.values(state.vehicles)) {
    if (vehicle.status === "Returning") {
      const distance = milesBetween(vehicle.position, DEPOT);
      const fraction = distance ? Math.min(1, ((seconds / 3600) * 22) / distance) : 1;
      vehicles[vehicle.id] = {
        ...vehicle,
        status: fraction === 1 ? "At depot" : "Returning",
        position: [
          vehicle.position[0] + (DEPOT[0] - vehicle.position[0]) * fraction,
          vehicle.position[1] + (DEPOT[1] - vehicle.position[1]) * fraction,
        ],
      };
      continue;
    }
    if (vehicle.status !== "On route") continue;
    const next = openStops(state, vehicle.id)[0];
    if (!next) {
      vehicles[vehicle.id] = { ...vehicle, status: "Returning" };
      continue;
    }
    const distance = milesBetween(vehicle.position, next.position);
    const pace =
      Math.min(vehicle.controls.speedLimit, 26) * (vehicle.controls.mode === "Eco" ? 0.88 : 1);
    const travelled = Math.min(distance, (seconds / 3600) * pace);
    const fraction = distance > 0 ? travelled / distance : 1;
    const position: Coordinate = [
      vehicle.position[0] + (next.position[0] - vehicle.position[0]) * fraction,
      vehicle.position[1] + (next.position[1] - vehicle.position[1]) * fraction,
    ];
    vehicles[vehicle.id] = {
      ...vehicle,
      position,
      fuel: Math.max(0, vehicle.fuel - (travelled / vehicle.maxRange) * 100),
    };
    if (fraction === 1) {
      stops[next.id] = { ...next, status: "Delivered", completedAt: now };
    } else if (next.status === "Pending") {
      stops[next.id] = { ...next, status: "En route" };
    }
    if (
      now > next.windowEnd &&
      !exceptions.some((item) => item.kind === "late" && item.stopId === next.id)
    ) {
      exceptions.push({
        id: `late-${next.id}`,
        vehicleId: vehicle.id,
        stopId: next.id,
        kind: "late",
        title: `${vehicle.id} delivery window has passed`,
        detail: `${next.customer} is past the planned delivery window.`,
        createdAt: now,
        acknowledged: false,
      });
    }
  }
  return { ...state, now, vehicles, stops, exceptions };
}

function restoreFields<T extends object>(record: T, values: Partial<T>): T {
  const restored = { ...record };
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) Reflect.deleteProperty(restored, key);
    else Reflect.set(restored, key, value);
  }
  return restored;
}

export function fleetReducer(state: FleetState, action: FleetAction): FleetState {
  switch (action.type) {
    case "tick":
      return advanceSimulation(state, action.elapsed);
    case "running":
      return { ...state, running: action.value };
    case "speed":
      return Number.isFinite(action.value)
        ? { ...state, speed: Math.min(120, Math.max(1, Math.round(action.value))) }
        : state;
    case "select": {
      if (action.vehicleId && !state.vehicles[action.vehicleId]) return state;
      const stop = action.stopId ? state.stops[action.stopId] : null;
      if (stop && stop.vehicleId !== action.vehicleId) return state;
      return { ...state, selectedVehicleId: action.vehicleId, selectedStopId: stop?.id ?? null };
    }
    case "reassign": {
      const eligibility = reassignEligibility(state, action.stopId, action.vehicleId);
      if (!eligibility.eligible) return failure(state, eligibility.reason);
      const stop = state.stops[action.stopId];
      const from = state.vehicles[stop.vehicleId];
      const to = state.vehicles[action.vehicleId];
      return finish(
        state,
        {
          vehicles: {
            ...state.vehicles,
            [from.id]: { ...from, routeIds: from.routeIds.filter((id) => id !== stop.id) },
            [to.id]: { ...to, routeIds: [...to.routeIds, stop.id] },
          },
          stops: { ...state.stops, [stop.id]: { ...stop, vehicleId: to.id } },
          selectedVehicleId: state.selectedVehicleId,
          selectedStopId:
            state.selectedVehicleId === from.id
              ? (from.routeIds.find((id) => id !== stop.id) ?? null)
              : state.selectedStopId,
        },
        `${stop.customer} reassigned to ${to.id}`,
        [
          { entity: "vehicle", id: from.id, values: { routeIds: from.routeIds } },
          { entity: "vehicle", id: to.id, values: { routeIds: to.routeIds } },
          { entity: "stop", id: stop.id, values: { vehicleId: from.id } },
        ],
        to.id,
      );
    }
    case "reschedule": {
      const stop = state.stops[action.stopId];
      if (!stop || !["Pending", "En route"].includes(stop.status))
        return failure(state, "Only open deliveries can be rescheduled");
      if (
        !Number.isFinite(action.windowStart) ||
        !Number.isFinite(action.windowEnd) ||
        action.windowEnd <= action.windowStart ||
        action.windowEnd < state.now
      )
        return failure(state, "Choose a future window with the end after its start");
      return finish(
        state,
        {
          stops: {
            ...state.stops,
            [stop.id]: { ...stop, windowStart: action.windowStart, windowEnd: action.windowEnd },
          },
        },
        "Delivery window updated",
        [
          {
            entity: "stop",
            id: stop.id,
            values: { windowStart: stop.windowStart, windowEnd: stop.windowEnd },
          },
        ],
        stop.vehicleId,
      );
    }
    case "controls": {
      const vehicle = state.vehicles[action.vehicleId];
      if (!vehicle || vehicle.status === "Retired")
        return failure(state, "Vehicle is not available for editing");
      if (!validControls(action.controls))
        return failure(state, "Check the vehicle control limits");
      return finish(
        state,
        {
          vehicles: {
            ...state.vehicles,
            [vehicle.id]: { ...vehicle, controls: { ...action.controls } },
          },
        },
        `${vehicle.id} controls saved`,
        [{ entity: "vehicle", id: vehicle.id, values: { controls: vehicle.controls } }],
        vehicle.id,
      );
    }
    case "edit-vehicle": {
      const vehicle = state.vehicles[action.vehicleId];
      if (!vehicle || vehicle.status === "Retired")
        return failure(state, "Retired vehicles cannot be edited");
      if (
        !action.driver.trim() ||
        !Number.isInteger(action.capacity) ||
        action.capacity < 1 ||
        action.capacity > 80 ||
        action.capacity < routeMetrics(state, vehicle.id).parcels ||
        !action.registration.trim() ||
        !["gas", "electric"].includes(action.kind) ||
        !Number.isFinite(action.fuel) ||
        action.fuel < 0 ||
        action.fuel > 100 ||
        (!action.coldBox && openStops(state, vehicle.id).some((stop) => stop.cold))
      )
        return failure(state, "Enter a driver and capacity large enough for the remaining load");
      return finish(
        state,
        {
          vehicles: {
            ...state.vehicles,
            [vehicle.id]: {
              ...vehicle,
              driver: action.driver.trim(),
              capacity: action.capacity,
              registration: action.registration.trim(),
              kind: action.kind,
              coldBox: action.coldBox,
              fuel: action.fuel,
              maxRange: action.kind === "electric" ? 180 : 390,
            },
          },
        },
        `${vehicle.id} updated`,
        [
          {
            entity: "vehicle",
            id: vehicle.id,
            values: {
              driver: vehicle.driver,
              capacity: vehicle.capacity,
              registration: vehicle.registration,
              kind: vehicle.kind,
              coldBox: vehicle.coldBox,
              fuel: vehicle.fuel,
              maxRange: vehicle.maxRange,
            },
          },
        ],
        vehicle.id,
      );
    }
    case "retire": {
      const vehicle = state.vehicles[action.vehicleId];
      if (!vehicle || vehicle.status === "Retired")
        return failure(state, "Vehicle is already retired");
      if (openStops(state, vehicle.id).length)
        return failure(state, "Reassign every open delivery before retiring this vehicle");
      return finish(
        state,
        { vehicles: { ...state.vehicles, [vehicle.id]: { ...vehicle, status: "Retired" } } },
        `${vehicle.id} retired`,
        [{ entity: "vehicle", id: vehicle.id, values: { status: vehicle.status } }],
        vehicle.id,
      );
    }
    case "complete-stop":
    case "fail-stop": {
      const stop = state.stops[action.stopId];
      if (!stop || !["Pending", "En route"].includes(stop.status))
        return failure(state, "This delivery is already closed");
      if (action.type === "fail-stop" && !action.reason.trim())
        return failure(state, "Add a reason for the failed delivery");
      const failureReason = action.type === "fail-stop" ? action.reason.trim() : undefined;
      const exceptionId = `failed-${stop.id}-${state.sequence + 1}`;
      const changed = {
        ...stop,
        status: action.type === "complete-stop" ? ("Delivered" as const) : ("Failed" as const),
        completedAt: state.now,
        failureReason,
      };
      const exceptions = failureReason
        ? [
            ...state.exceptions,
            {
              id: exceptionId,
              vehicleId: stop.vehicleId,
              stopId: stop.id,
              kind: "failed" as const,
              title: `${stop.customer} delivery failed`,
              detail: failureReason,
              createdAt: state.now,
              acknowledged: false,
            },
          ]
        : state.exceptions;
      return finish(
        state,
        { stops: { ...state.stops, [stop.id]: changed }, exceptions },
        failureReason ? "Delivery marked failed" : "Delivery completed",
        [
          {
            entity: "stop",
            id: stop.id,
            values: {
              status: stop.status,
              completedAt: stop.completedAt,
              failureReason: stop.failureReason,
            },
          },
          ...(failureReason ? [{ entity: "remove-exception" as const, id: exceptionId }] : []),
        ],
        stop.vehicleId,
      );
    }
    case "create-stop": {
      const draft = action.stop;
      const vehicle = state.vehicles[draft.vehicleId];
      if (!vehicle || ["Retired", "Breakdown"].includes(vehicle.status))
        return failure(state, "Choose an available vehicle");
      if (
        !draft.customer.trim() ||
        !draft.address.trim() ||
        !Number.isInteger(draft.parcels) ||
        draft.parcels < 1 ||
        draft.parcels > 20 ||
        !Number.isFinite(draft.windowStart) ||
        !Number.isFinite(draft.windowEnd) ||
        draft.windowEnd <= draft.windowStart ||
        draft.windowEnd < state.now ||
        !draft.position.every(Number.isFinite) ||
        draft.position[0] < -122.5 ||
        draft.position[0] > -122.15 ||
        draft.position[1] < 47.45 ||
        draft.position[1] > 47.8
      )
        return failure(
          state,
          "Enter valid delivery details, Seattle coordinates and a future time window",
        );
      if (draft.cold && !vehicle.coldBox)
        return failure(state, "Temperature-controlled vehicle required");
      if (routeMetrics(state, vehicle.id).parcels + draft.parcels > vehicle.capacity)
        return failure(state, "Insufficient parcel capacity");
      const id = `D-${state.sequence + 1}`;
      return finish(
        state,
        {
          stops: { ...state.stops, [id]: { ...draft, id, status: "Pending" } },
          vehicles: {
            ...state.vehicles,
            [vehicle.id]: { ...vehicle, routeIds: [...vehicle.routeIds, id] },
          },
        },
        "Delivery created",
        [
          { entity: "remove-stop", id },
          { entity: "vehicle", id: vehicle.id, values: { routeIds: vehicle.routeIds } },
        ],
        vehicle.id,
      );
    }
    case "acknowledge": {
      const exception = state.exceptions.find((item) => item.id === action.exceptionId);
      if (!exception || exception.acknowledged) return state;
      return finish(
        state,
        {
          exceptions: state.exceptions.map((item) =>
            item.id === exception.id ? { ...item, acknowledged: true } : item,
          ),
        },
        "Exception acknowledged; vehicle issue remains visible",
        [{ entity: "exception", id: exception.id, values: { acknowledged: false } }],
        exception.vehicleId,
      );
    }
    case "message": {
      if (!state.vehicles[action.vehicleId] || !action.message.trim())
        return failure(state, "Write a message first");
      return finish(
        state,
        {},
        `Local message recorded for ${action.vehicleId}`,
        [],
        action.vehicleId,
        action.message.trim(),
      );
    }
    case "undo": {
      const entry = state.undo.at(-1);
      if (!entry || (action.id !== undefined && action.id !== entry.id))
        return failure(state, "Only the most recent dispatch change can be undone");
      const vehicles = { ...state.vehicles };
      const stops = { ...state.stops };
      let exceptions = [...state.exceptions];
      for (const inverse of entry.inverse) {
        if (inverse.entity === "vehicle" && vehicles[inverse.id])
          vehicles[inverse.id] = restoreFields(vehicles[inverse.id], inverse.values);
        if (inverse.entity === "stop" && stops[inverse.id])
          stops[inverse.id] = restoreFields(stops[inverse.id], inverse.values);
        if (inverse.entity === "remove-stop") delete stops[inverse.id];
        if (inverse.entity === "remove-exception")
          exceptions = exceptions.filter((item) => item.id !== inverse.id);
        if (inverse.entity === "exception")
          exceptions = exceptions.map((item) =>
            item.id === inverse.id ? { ...item, ...inverse.values } : item,
          );
      }
      return finish(
        state,
        {
          vehicles,
          stops,
          exceptions,
          undo: state.undo.slice(0, -1),
          selectedVehicleId:
            state.selectedStopId && stops[state.selectedStopId]
              ? stops[state.selectedStopId].vehicleId
              : state.selectedVehicleId,
          selectedStopId:
            state.selectedStopId && stops[state.selectedStopId] ? state.selectedStopId : null,
        },
        `Undid: ${entry.label}`,
        [],
      );
    }
  }
}

export function dispatchTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(timestamp);
}

export function fleetSummary(state: FleetState) {
  const stops = Object.values(state.stops);
  return {
    vehicles: Object.values(state.vehicles).filter((vehicle) => vehicle.status !== "Retired")
      .length,
    delivered: stops.filter((stop) => stop.status === "Delivered").length,
    total: stops.length,
    exceptions: state.exceptions.filter((item) => !item.acknowledged).length,
    elapsed: Math.max(0, state.now - DISPATCH_EPOCH),
  };
}
