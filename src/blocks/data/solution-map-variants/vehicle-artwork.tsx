import { useId } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/reui/badge";
import { useState } from "react";
import { useFleet } from "./fleet-context";
import { routeMetrics } from "./fleet-model";
import type { FleetVehicle } from "./fleet-types";

/** Original Bricklane delivery-van geometry. No reference artwork or vehicle asset is embedded. */
export function VehicleArtwork({ vehicle }: { vehicle: FleetVehicle }) {
  const { state } = useFleet();
  const [view, setView] = useState("iso");
  const [area, setArea] = useState("cargo");
  const titleId = useId();
  const metrics = routeMetrics(state, vehicle.id);
  return (
    <section className="dm-twin" aria-label={`${vehicle.id} vehicle twin`}>
      <div className="dm-twin-toolbar">
        <Tabs value={view} onValueChange={setView}>
          <TabsList aria-label="Vehicle drawing view">
            <TabsTrigger value="iso">Iso</TabsTrigger>
            <TabsTrigger value="plan">2D</TabsTrigger>
          </TabsList>
        </Tabs>
        <Badge size="sm" variant="outline">
          {vehicle.coldBox ? "Cold box" : vehicle.body === "box" ? "Box van" : "Cargo van"}
        </Badge>
      </div>
      <svg viewBox="0 0 360 205" role="img" aria-labelledby={titleId} className="dm-vehicle-art">
        <title id={titleId}>
          {vehicle.id}, original {view === "iso" ? "isometric" : "top-down"} delivery van, {area}{" "}
          highlighted
        </title>
        {view === "iso" ? (
          <>
            <ellipse cx="181" cy="174" rx="130" ry="15" fill="currentColor" opacity=".06" />
            <path d="M43 110 119 64 299 107 222 154Z" fill="var(--muted)" stroke="var(--border)" />
            <path d="M43 110v42l179 42v-40Z" fill="var(--card)" stroke="var(--border)" />
            <path d="m222 154 77-47v42l-77 45Z" fill="var(--secondary)" stroke="var(--border)" />
            <path
              d="m50 106 69-42 107 26-69 42Z"
              fill={area === "cargo" ? "var(--info)" : "var(--card)"}
              fillOpacity={area === "cargo" ? ".16" : "1"}
              stroke="var(--border)"
            />
            <path
              d="m50 106 107 26v42L50 148Z"
              fill={area === "cargo" ? "var(--info)" : "var(--muted)"}
              fillOpacity=".13"
              stroke="var(--border)"
            />
            <path d="m157 132 69-42v42l-69 42Z" fill="var(--muted)" stroke="var(--border)" />
            <path
              d="m226 90 43 11 28 40-69-16Z"
              fill={area === "cab" ? "var(--info)" : "var(--card)"}
              fillOpacity={area === "cab" ? ".3" : "1"}
              stroke="var(--border)"
            />
            <path d="m228 98 35 9 15 22-48-11Z" fill="var(--foreground)" opacity=".55" />
            <path d="m231 129 51 12v22l-51 30Z" fill="var(--card)" stroke="var(--border)" />
            <ellipse
              cx="85"
              cy="159"
              rx="13"
              ry="18"
              transform="rotate(-14 85 159)"
              fill="var(--foreground)"
            />
            <ellipse
              cx="85"
              cy="159"
              rx="6"
              ry="9"
              transform="rotate(-14 85 159)"
              fill="var(--muted-foreground)"
            />
            <ellipse
              cx="221"
              cy="184"
              rx="13"
              ry="18"
              transform="rotate(-14 221 184)"
              fill="var(--foreground)"
            />
            <ellipse
              cx="221"
              cy="184"
              rx="6"
              ry="9"
              transform="rotate(-14 221 184)"
              fill="var(--muted-foreground)"
            />
            <rect
              x="164"
              y="144"
              width="21"
              height="10"
              rx="2"
              fill={area === "fuel" ? "var(--warning)" : "var(--muted-foreground)"}
              opacity=".8"
            />
          </>
        ) : (
          <>
            <rect
              x="44"
              y="56"
              width="273"
              height="107"
              rx="19"
              fill="var(--card)"
              stroke="var(--border)"
              strokeWidth="2"
            />
            <rect
              x="57"
              y="66"
              width="178"
              height="87"
              rx="7"
              fill={area === "cargo" ? "var(--info)" : "var(--muted)"}
              fillOpacity={area === "cargo" ? ".18" : "1"}
              stroke="var(--border)"
            />
            <path
              d="M245 66h34l24 17v52l-24 18h-34Z"
              fill={area === "cab" ? "var(--info)" : "var(--secondary)"}
              fillOpacity=".3"
              stroke="var(--border)"
            />
            <path d="M279 76v67l18-13V88Z" fill="var(--foreground)" opacity=".55" />
            {[77, 267].map((x) => (
              <g key={x}>
                <rect x={x} y="48" width="24" height="10" rx="4" fill="var(--foreground)" />
                <rect x={x} y="161" width="24" height="10" rx="4" fill="var(--foreground)" />
              </g>
            ))}
            <rect
              x="241"
              y="78"
              width="8"
              height="24"
              rx="2"
              fill={area === "fuel" ? "var(--warning)" : "var(--muted-foreground)"}
            />
          </>
        )}
      </svg>
      <ToggleGroup
        type="single"
        value={area}
        onValueChange={(next) => {
          if (next) setArea(next);
        }}
        variant="outline"
        size="sm"
        aria-label="Highlighted vehicle area"
        className="justify-center"
      >
        <ToggleGroupItem value="cab">Cab</ToggleGroupItem>
        <ToggleGroupItem value="cargo">Cargo</ToggleGroupItem>
        <ToggleGroupItem value="fuel">
          {vehicle.kind === "electric" ? "Battery" : "Fuel"}
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="dm-twin-caption">
        {area === "cargo"
          ? `${metrics.parcels} parcels · ${Math.round((metrics.parcels / vehicle.capacity) * 100)}% of cargo capacity`
          : area === "cab"
            ? `${vehicle.driver} · ${vehicle.controls.mode} mode`
            : `${vehicle.fuel.toFixed(0)}% ${vehicle.kind === "electric" ? "charge" : "fuel"} · ${metrics.remainingRange.toFixed(0)} mi estimated range`}
      </p>
    </section>
  );
}
