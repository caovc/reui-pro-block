export type FreightRegion = "Atlantic" | "Central" | "East";
export type FreightTerminal = {
  id: string;
  city: string;
  country: string;
  region: FreightRegion;
  manager: string;
  latitude: number;
  longitude: number;
};
export type FreightLane = {
  id: string;
  origin: string;
  destination: string;
  shipper: string;
  equipment: "Curtainsider" | "Reefer" | "Flatbed";
  contract: "Contract" | "Spot";
  customs: "Domestic" | "EU" | "Customs";
  loads: number;
  distanceKm: number;
  rateCents: number;
  costCents: number;
  active: boolean;
};
export type FreightRateEvent = {
  id: string;
  laneId: string;
  at: string;
  kind: "Opened" | "Edited" | "Repriced" | "Closed";
  previousRateCents: number | null;
  rateCents: number;
  reason: string;
};
export type FreightBook = { lanes: FreightLane[]; history: FreightRateEvent[] };

// Independent Bricklane demo network. These terminals, lane economics, people
// and histories were authored locally; none are transcribed from the Pro seeds.
export const freightTerminals: FreightTerminal[] = [
  {
    id: "OPO",
    city: "Porto",
    country: "Portugal",
    region: "Atlantic",
    manager: "Ines Vale",
    latitude: 41.16,
    longitude: -8.63,
  },
  {
    id: "VLC",
    city: "Valencia",
    country: "Spain",
    region: "Atlantic",
    manager: "Nico Ferrer",
    latitude: 39.47,
    longitude: -0.38,
  },
  {
    id: "BRS",
    city: "Bristol",
    country: "United Kingdom",
    region: "Atlantic",
    manager: "Alex Reed",
    latitude: 51.45,
    longitude: -2.59,
  },
  {
    id: "GNT",
    city: "Ghent",
    country: "Belgium",
    region: "Atlantic",
    manager: "Noor Vos",
    latitude: 51.05,
    longitude: 3.72,
  },
  {
    id: "NTE",
    city: "Nantes",
    country: "France",
    region: "Atlantic",
    manager: "Jules Marin",
    latitude: 47.22,
    longitude: -1.55,
  },
  {
    id: "BSL",
    city: "Basel",
    country: "Switzerland",
    region: "Central",
    manager: "Mira Frei",
    latitude: 47.56,
    longitude: 7.59,
  },
  {
    id: "TRN",
    city: "Turin",
    country: "Italy",
    region: "Central",
    manager: "Elia Riva",
    latitude: 45.07,
    longitude: 7.69,
  },
  {
    id: "LEJ",
    city: "Leipzig",
    country: "Germany",
    region: "Central",
    manager: "Lea Beck",
    latitude: 51.34,
    longitude: 12.37,
  },
  {
    id: "BRQ",
    city: "Brno",
    country: "Czechia",
    region: "East",
    manager: "Adam Novak",
    latitude: 49.2,
    longitude: 16.61,
  },
  {
    id: "GRZ",
    city: "Graz",
    country: "Austria",
    region: "East",
    manager: "Nina Hofer",
    latitude: 47.07,
    longitude: 15.44,
  },
  {
    id: "KRK",
    city: "Krakow",
    country: "Poland",
    region: "East",
    manager: "Ola Nowak",
    latitude: 50.06,
    longitude: 19.94,
  },
  {
    id: "TLL",
    city: "Tallinn",
    country: "Estonia",
    region: "East",
    manager: "Rasmus Kask",
    latitude: 59.44,
    longitude: 24.75,
  },
];
export const freightShippers = [
  "Northbank Foods",
  "Fieldstone Works",
  "Atlas Components",
  "Cedar Retail",
  "Harbor Paper",
  "Linden Medical",
];

export function freightDemoDistance(origin: FreightTerminal, destination: FreightTerminal) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLatitude = radians(destination.latitude - origin.latitude);
  const dLongitude = radians(destination.longitude - origin.longitude);
  const h =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(radians(origin.latitude)) *
      Math.cos(radians(destination.latitude)) *
      Math.sin(dLongitude / 2) ** 2;
  // A demo road-distance estimate, not a routing service or quoted road mileage.
  return Math.max(
    150,
    Math.round((6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 1.22) / 10) * 10,
  );
}

export function createFreightBook(): FreightBook {
  const lanes: FreightLane[] = [];
  let corridor = 0;
  for (let first = 0; first < freightTerminals.length; first++) {
    for (let second = first + 1; second < freightTerminals.length; second++) {
      const serial = corridor++;
      if (serial >= 55) continue;
      const add = (originIndex: number, destinationIndex: number) => {
        const origin = freightTerminals[originIndex];
        const destination = freightTerminals[destinationIndex];
        const identity = originIndex * 19 + destinationIndex * 13;
        const costCents = 121 + (identity % 43);
        const offsets = [-34, -13, 4, 12, 28, 43];
        lanes.push({
          id: `${origin.id}-${destination.id}`,
          origin: origin.id,
          destination: destination.id,
          shipper: freightShippers[identity % freightShippers.length],
          equipment: (["Curtainsider", "Reefer", "Flatbed"] as const)[identity % 3],
          contract: identity % 4 === 0 ? "Spot" : "Contract",
          customs: [origin.id, destination.id].some((id) => id === "BRS" || id === "BSL")
            ? "Customs"
            : origin.country === destination.country
              ? "Domestic"
              : "EU",
          loads: 9 + (identity % 37),
          distanceKm: freightDemoDistance(origin, destination),
          rateCents: costCents + offsets[identity % offsets.length],
          costCents,
          active: true,
        });
      };
      add(first, second);
      if (serial >= 12) add(second, first);
    }
  }
  return {
    lanes,
    history: lanes.map((lane) => ({
      id: `opening-${lane.id}`,
      laneId: lane.id,
      at: "2026-09-21T09:00:00Z",
      kind: "Opened",
      previousRateCents: null,
      rateCents: lane.rateCents,
      reason: "Opening rate for the independent Bricklane demo network",
    })),
  };
}
