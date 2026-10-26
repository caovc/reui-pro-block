import { DEPOT } from "./fleet-data";
import { routeStops } from "./fleet-model";
import type { Coordinate, FleetState } from "./fleet-types";

/** Independent schematic route geometry, over actual streets; not a routing service. */
export function fleetRouteFeatures(state: FleetState) {
  const selected = state.selectedVehicleId;
  const features = Object.values(state.vehicles)
    .filter((vehicle) => vehicle.routeIds.length && vehicle.status !== "Retired")
    .map((vehicle) => {
      const coordinates: Coordinate[] = [
        DEPOT,
        ...routeStops(state, vehicle.id).map((stop) => stop.position),
        DEPOT,
      ];
      return {
        type: "Feature" as const,
        properties: { id: vehicle.id, selected: vehicle.id === selected },
        geometry: { type: "LineString" as const, coordinates },
      };
    });
  return { type: "FeatureCollection" as const, features };
}

export function fleetBounds(state: FleetState, selectedOnly = false): [Coordinate, Coordinate] {
  const selected =
    selectedOnly && state.selectedVehicleId ? state.vehicles[state.selectedVehicleId] : null;
  const coordinates = selected
    ? [selected.position, ...routeStops(state, selected.id).map((stop) => stop.position), DEPOT]
    : Object.values(state.vehicles)
        .filter((vehicle) => vehicle.status !== "Retired")
        .map((vehicle) => vehicle.position);
  if (coordinates.length === 0) coordinates.push(DEPOT);
  const longitudes = coordinates.map((point) => point[0]);
  const latitudes = coordinates.map((point) => point[1]);
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];
}
