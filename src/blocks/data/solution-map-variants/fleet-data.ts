import type { Coordinate, DeliveryStop, FleetState, FleetVehicle } from "./fleet-types";

/** 09:30 Seattle/Pacific, fixed so every exported demo starts from the same clock. */
export const DISPATCH_EPOCH = Date.UTC(2026, 9, 26, 16, 30);
export const DEPOT: Coordinate = [-122.3302, 47.6018];
export const DEPOT_NAME = "Pioneer Square depot";
export const MAP_CENTER: Coordinate = [-122.329, 47.617];

const drivers = [
  "Ada Brooks",
  "Milo Reed",
  "Nora Vale",
  "Ravi Shah",
  "Mira Stone",
  "Leo Grant",
  "Lena Moss",
  "Owen Park",
  "Iris Cole",
  "Theo Lane",
  "Zoe Blake",
  "Eli Quinn",
  "June Silva",
  "Arlo Evans",
  "Cleo Hart",
  "Finn Ames",
  "Luca Wells",
  "Sana Noor",
  "Remy Fox",
  "Nina Ray",
  "Hugo Lin",
  "Alma West",
  "Ezra Bell",
  "Tess Moon",
];
export const dispatchMerchants = [
  "Cedar Studio",
  "Northline Books",
  "Union Kitchen",
  "Pineworks Lab",
  "Harbor Supply",
  "Beacon Flowers",
  "Summit Pantry",
  "Lake Union Workshop",
  "Olive Pharmacy",
  "Firstlight Office",
  "Rainier Market",
  "Stonebridge Design",
];
export const dispatchDrivers = drivers;
const activeIndices = [0, 2, 4, 6, 8, 10, 13, 16, 17];
const initialDelivered = [4, 4, 4, 4, 4, 4, 7, 10, 3];
const streets = [
  "Pine Street",
  "Madison Street",
  "Olive Way",
  "Eastlake Avenue",
  "Broadway",
  "5th Avenue",
];

/** Authored Seattle-area coordinates; neither geocoded customers nor copied Pro fixtures. */
function stopPosition(vehicle: number, stop: number): Coordinate {
  const column = (vehicle * 3 + stop * 2) % 7;
  const row = (vehicle + stop * 3) % 9;
  return [-122.347 + column * 0.0051, 47.595 + row * 0.0048];
}

export function createFleetState(): FleetState {
  const vehicles: Record<string, FleetVehicle> = {};
  const stops: Record<string, DeliveryStop> = {};
  for (let index = 0; index < 24; index++) {
    const id = `V${String(index + 1).padStart(2, "0")}`;
    const kind = index % 3 === 2 || index === 13 ? "electric" : "gas";
    const coldBox = index % 5 === 4 || index === 13;
    const activeIndex = activeIndices.indexOf(index);
    const parkedIndex = Array.from({ length: 24 }, (_, i) => i)
      .filter((i) => !activeIndices.includes(i))
      .indexOf(index);
    const count = activeIndex < 0 ? 0 : activeIndex === 7 ? 10 : 9;
    const deliveredCount = activeIndex < 0 ? 0 : initialDelivered[activeIndex];
    const routeIds: string[] = [];
    for (let order = 0; order < count; order++) {
      const stopId = `${id}-S${order + 1}`;
      routeIds.push(stopId);
      const completed = order < deliveredCount;
      const offset = (order - 2) * 24 + (index % 4) * 4;
      stops[stopId] = {
        id: stopId,
        vehicleId: id,
        customer: dispatchMerchants[(index + order) % dispatchMerchants.length],
        address: `${120 + index * 13 + order * 5} ${streets[(index + order) % streets.length]}, Seattle`,
        position: stopPosition(index, order),
        parcels: 1 + ((index + order) % 4),
        cold: coldBox && order % 3 === 0,
        status: completed
          ? "Delivered"
          : index === 0 && order === count - 1
            ? "Failed"
            : order === deliveredCount
              ? "En route"
              : "Pending",
        windowStart: DISPATCH_EPOCH + (offset - 15) * 60_000,
        windowEnd: DISPATCH_EPOCH + (offset + 45) * 60_000,
        serviceMinutes: 3 + (order % 3),
        ...(completed ? { completedAt: DISPATCH_EPOCH - (count - order) * 12 * 60_000 } : {}),
      };
    }
    vehicles[id] = {
      id,
      driver: drivers[index],
      registration: `BL ${410 + index}`,
      kind,
      coldBox,
      body: index % 4 === 0 || coldBox ? "box" : "van",
      status:
        index === 17
          ? "Breakdown"
          : index === 16
            ? "Returning"
            : activeIndex >= 0
              ? "On route"
              : parkedIndex < 8
                ? "At depot"
                : parkedIndex < 12
                  ? "Charging"
                  : "Maintenance",
      depot: DEPOT_NAME,
      capacity: coldBox ? 40 : 36,
      fuel: index === 8 ? 14 : 42 + ((index * 7) % 54),
      maxRange: kind === "electric" ? 180 : 390,
      temperature: coldBox ? (index === 13 ? 48 : 37) : 68,
      position: activeIndex < 0 ? [...DEPOT] : stopPosition(index, Math.max(0, deliveredCount - 1)),
      routeIds,
      controls: {
        mode: "Standard",
        speedLimit: 65,
        reserve: 15,
        targetTemperature: 36,
        chargeLimit: 90,
        idleShutdown: true,
        geofenceAlerts: true,
        driverCoaching: false,
      },
    };
  }
  return {
    now: DISPATCH_EPOCH,
    running: true,
    speed: 20,
    selectedVehicleId: null,
    selectedStopId: null,
    vehicles,
    stops,
    exceptions: [
      {
        id: "fault-v18",
        vehicleId: "V18",
        kind: "breakdown",
        title: "V18 needs roadside support",
        detail:
          "Rear tyre pressure is below the operating threshold. Dispatch can reassign its open stops.",
        createdAt: DISPATCH_EPOCH - 4 * 60_000,
        acknowledged: false,
      },
      {
        id: "range-v09",
        vehicleId: "V09",
        kind: "range",
        title: "V09 reserve is running low",
        detail: "Review remaining route distance or move a delivery to another vehicle.",
        createdAt: DISPATCH_EPOCH - 9 * 60_000,
        acknowledged: false,
      },
      {
        id: "temp-v14",
        vehicleId: "V14",
        kind: "temperature",
        title: "V14 cargo temperature is elevated",
        detail:
          "The reefer sensor reads 48°F. Acknowledge to record a review; this does not resolve the temperature alert.",
        createdAt: DISPATCH_EPOCH - 12 * 60_000,
        acknowledged: false,
      },
    ],
    activity: [
      {
        id: "a0",
        at: DISPATCH_EPOCH,
        title: "Dispatch simulation started",
        detail:
          "24 locally simulated vehicles. Remote street tiles, no real GPS or driver messages.",
      },
    ],
    undo: [],
    sequence: 0,
    feedback: null,
  };
}
