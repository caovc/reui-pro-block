import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Map as MapLibre, Marker, ScaleControl, type GeoJSONSource } from "maplibre-gl";
import { AlertCircle, Layers3, LocateFixed, MapPin, Minus, Plus, RefreshCw } from "lucide-react";
import { prepareMapLibre } from "@/lib/maplibre-runtime";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { DEPOT, DEPOT_NAME, MAP_CENTER } from "./fleet-data";
import { fleetBounds, fleetRouteFeatures } from "./fleet-geo";
import { routeStops, vehicleAlerts } from "./fleet-model";
import { useFleet } from "./fleet-context";
import type { Coordinate } from "./fleet-types";

export type FleetMapHandle = {
  fit: (selectedOnly?: boolean) => void;
  center: (position: Coordinate) => void;
};
type Props = {
  onList: () => void;
  placing: boolean;
  onPlace: (position: Coordinate) => void;
  onVehicle: () => void;
  onCancelPlace: () => void;
};

function markerButton(label: string, kind: "vehicle" | "stop" | "depot") {
  const element = document.createElement("button");
  element.type = "button";
  element.className = `dm-map-marker dm-map-marker-${kind}`;
  element.setAttribute("aria-label", label);
  return element;
}

export const FleetMap = forwardRef<FleetMapHandle, Props>(function FleetMap(props, ref) {
  const { state, act } = useFleet();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibre | null>(null);
  const markers = useRef(
    new globalThis.Map<string, { marker: Marker; element: HTMLButtonElement }>(),
  );
  const latest = useRef({ state, props });
  useEffect(() => {
    latest.current = { state, props };
  }, [state, props]);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [routes, setRoutes] = useState(true);
  const [stopsVisible, setStopsVisible] = useState(true);

  useEffect(() => {
    const update = () => setDark(!!container.current?.closest(".dark"));
    update();
    const observer = new MutationObserver(update);
    let parent: HTMLElement | null = container.current;
    while (parent) {
      observer.observe(parent, { attributes: true, attributeFilter: ["class"] });
      parent = parent.parentElement;
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    setReady(false);
    setError(null);
    let map: MapLibre | null = null;
    let resize: ResizeObserver | null = null;
    let active = true;
    const ownedMarkers = markers.current;
    const failed = (message: string) => {
      if (active) setError(message);
    };
    try {
      prepareMapLibre();
      map = new MapLibre({
        container: element,
        style: `https://tiles.openfreemap.org/styles/${dark ? "dark" : "positron"}`,
        center: MAP_CENTER,
        zoom: 11.8,
        attributionControl: { compact: false },
        renderWorldCopies: false,
        maxZoom: 18,
      });
      mapRef.current = map;
      map.addControl(new ScaleControl({ maxWidth: 100, unit: "imperial" }), "bottom-right");
      map.on("error", (event) => failed(event.error?.message || "Street tiles could not load."));
      map.on("load", () => {
        if (!active || !map) return;
        map.addSource("bricklane-routes", {
          type: "geojson",
          data: fleetRouteFeatures(latest.current.state),
        });
        map.addLayer({
          id: "bricklane-route-lines",
          type: "line",
          source: "bricklane-routes",
          paint: {
            "line-color": dark ? "#f0f0f0" : "#262626",
            "line-width": ["case", ["==", ["get", "selected"], true], 3.5, 1.2],
            "line-opacity": ["case", ["==", ["get", "selected"], true], 0.9, 0.16],
          },
        });
        setReady(true);
        setError(null);
      });
      map.on("click", (event) => {
        if (latest.current.props.placing)
          latest.current.props.onPlace([event.lngLat.lng, event.lngLat.lat]);
      });
      map
        .getCanvas()
        .setAttribute("aria-label", "Seattle dispatch map. Arrow keys pan, plus and minus zoom.");
      resize = new ResizeObserver(() => map?.resize());
      resize.observe(element);
    } catch (cause) {
      failed(cause instanceof Error ? cause.message : "This browser could not create a WebGL map.");
    }
    return () => {
      active = false;
      resize?.disconnect();
      for (const item of ownedMarkers.values()) item.marker.remove();
      ownedMarkers.clear();
      map?.remove();
      if (mapRef.current === map) mapRef.current = null;
    };
  }, [attempt, dark]);

  const fit = useCallback(
    (selectedOnly = false) => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const small = (container.current?.clientWidth ?? 0) < 700;
      map.fitBounds(fleetBounds(latest.current.state, selectedOnly), {
        padding: { top: 70, bottom: 70, left: small ? 35 : 390, right: 70 },
        maxZoom: 14,
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500,
      });
    },
    [ready],
  );
  useImperativeHandle(ref, () => ({
    fit,
    center: (position) => {
      mapRef.current?.easeTo({ center: position, zoom: 14, duration: 0 });
    },
  }));

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("bricklane-routes") as GeoJSONSource | undefined)?.setData(
      fleetRouteFeatures(state),
    );
    if (map.getLayer("bricklane-route-lines"))
      map.setLayoutProperty("bricklane-route-lines", "visibility", routes ? "visible" : "none");
    const visible = new Set<string>();
    const upsert = (
      id: string,
      position: Coordinate,
      label: string,
      text: string,
      kind: "vehicle" | "stop" | "depot",
      selected: boolean,
      click: () => void,
    ) => {
      visible.add(id);
      let item = markers.current.get(id);
      if (!item) {
        const element = markerButton(label, kind);
        const marker = new Marker({ element, anchor: "center" }).setLngLat(position).addTo(map);
        item = { marker, element };
        markers.current.set(id, item);
      }
      item.marker.setLngLat(position);
      item.element.textContent = text;
      item.element.setAttribute("aria-label", label);
      item.element.setAttribute("aria-pressed", String(selected));
      item.element.dataset.selected = String(selected);
      item.element.onclick = (event) => {
        event.stopPropagation();
        click();
      };
    };
    for (const vehicle of Object.values(state.vehicles)) {
      if (!["On route", "Returning", "Breakdown"].includes(vehicle.status)) continue;
      const alert = vehicleAlerts(state, vehicle.id).length ? ", needs attention" : "";
      upsert(
        vehicle.id,
        vehicle.position,
        `${vehicle.id}, ${vehicle.status}${alert}`,
        vehicle.id,
        "vehicle",
        vehicle.id === state.selectedVehicleId,
        () => {
          act({ type: "select", vehicleId: vehicle.id });
          latest.current.props.onVehicle();
        },
      );
    }
    const parked = Object.values(state.vehicles).filter((vehicle) =>
      ["At depot", "Charging", "Maintenance"].includes(vehicle.status),
    ).length;
    upsert(
      "depot",
      DEPOT,
      `${DEPOT_NAME}, ${parked} vehicles parked`,
      `${parked} parked`,
      "depot",
      false,
      props.onList,
    );
    if (state.selectedVehicleId && stopsVisible) {
      routeStops(state, state.selectedVehicleId).forEach((stop, index) => {
        upsert(
          stop.id,
          stop.position,
          `Stop ${index + 1}, ${stop.customer}, ${stop.status}`,
          stop.status === "Delivered" ? "✓" : String(index + 1),
          "stop",
          stop.id === state.selectedStopId,
          () => {
            act({ type: "select", vehicleId: stop.vehicleId, stopId: stop.id });
            latest.current.props.onVehicle();
          },
        );
      });
    }
    for (const [id, item] of markers.current)
      if (!visible.has(id)) {
        item.marker.remove();
        markers.current.delete(id);
      }
  }, [state, ready, routes, stopsVisible, act, props.onList]);

  useEffect(() => {
    if (state.selectedVehicleId) fit(true);
  }, [state.selectedVehicleId, ready, fit]);

  return (
    <section
      className="dm-map"
      aria-label="Fleet map"
      data-map-state={error ? "error" : ready ? "ready" : "loading"}
    >
      <div ref={container} className="dm-map-canvas" />
      {!ready && !error && (
        <div className="dm-map-loading" role="status">
          <Skeleton className="h-12 w-48" />
          <p>Loading Seattle streets…</p>
        </div>
      )}
      {error && (
        <div className="dm-map-unavailable">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <AlertCircle />
              </EmptyMedia>
              <EmptyTitle>Map unavailable</EmptyTitle>
              <EmptyDescription>
                WebGL or remote street tiles could not load. Your fleet and deliveries remain
                available in List view.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setAttempt((value) => value + 1)}>
                <RefreshCw data-icon="inline-start" />
                Retry map
              </Button>
              <Button variant="outline" onClick={props.onList}>
                Open vehicle list
              </Button>
              <details>
                <summary>Connection details</summary>
                <p>{error}</p>
              </details>
            </EmptyContent>
          </Empty>
        </div>
      )}
      {!error && (
        <div className="dm-map-controls" role="group" aria-label="Map controls">
          <div>
            <Button
              size="icon"
              variant="outline"
              aria-label="Zoom in"
              disabled={!ready}
              onClick={() => mapRef.current?.zoomIn()}
            >
              <Plus />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Zoom out"
              disabled={!ready}
              onClick={() => mapRef.current?.zoomOut()}
            >
              <Minus />
            </Button>
          </div>
          <Button
            size="icon"
            variant="outline"
            aria-label="Fit fleet"
            disabled={!ready}
            onClick={() => fit()}
          >
            <LocateFixed />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="outline" aria-label="Layers and legend">
                <Layers3 />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="reui-reference">
              <div className="flex flex-col gap-4">
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="dm-routes">Route lines</FieldLabel>
                  <Switch id="dm-routes" checked={routes} onCheckedChange={setRoutes} />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="dm-stops">Selected route stops</FieldLabel>
                  <Switch id="dm-stops" checked={stopsVisible} onCheckedChange={setStopsVisible} />
                </Field>
                <p className="text-xs text-muted-foreground">
                  Vehicle labels select the shared fleet record. Route lines are independent demo
                  geometry, not turn-by-turn directions.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      {props.placing && !error && (
        <Alert className="dm-place-hint" role="status">
          <MapPin />
          <AlertTitle>Click the map to place the delivery.</AlertTitle>
          <AlertDescription>
            Choose a Seattle location. This demo does not geocode addresses.
            <Button size="sm" variant="outline" onClick={props.onCancelPlace}>
              Cancel placement
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="dm-map-attribution">
        <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">
          OpenFreeMap
        </a>{" "}
        ·{" "}
        <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">
          © OpenMapTiles
        </a>{" "}
        · Data from{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>
      </div>
    </section>
  );
});
