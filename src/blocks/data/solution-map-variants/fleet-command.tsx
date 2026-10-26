import { MapPin, Package, Truck } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/reui/badge";
import { useFleet } from "./fleet-context";
import type { Coordinate } from "./fleet-types";
import { DEPOT, DEPOT_NAME } from "./fleet-data";

export function FleetCommand({
  open,
  onOpenChange,
  onCenter,
  onSelected,
  onCloseAutoFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCenter: (position: Coordinate) => void;
  onSelected: () => void;
  onCloseAutoFocus: (event: Event) => void;
}) {
  const { state, act } = useFleet();
  const vehicles = Object.values(state.vehicles).filter((vehicle) => vehicle.status !== "Retired");
  const deliveries = Object.values(state.stops);
  function select(vehicleId: string, stopId?: string) {
    const position = stopId ? state.stops[stopId].position : state.vehicles[vehicleId].position;
    act({ type: "select", vehicleId, stopId });
    onCenter(position);
    onOpenChange(false);
    onSelected();
  }
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search dispatch"
      description="Find a vehicle, local delivery, or depot. Use arrow keys and Enter to select."
      className="reui-reference dm-command"
      onCloseAutoFocus={onCloseAutoFocus}
    >
      <Command data-dm-focus-layer="command" data-state={open ? "open" : "closed"}>
        <CommandInput placeholder="Search vans, drivers, stops…" data-dm-focus-fallback />
        <CommandList>
          <CommandEmpty>No matching vehicles, deliveries, or depots.</CommandEmpty>
          <CommandGroup heading={`Vehicles · ${vehicles.length}`}>
            {vehicles.map((vehicle) => (
              <CommandItem
                key={vehicle.id}
                value={`vehicle ${vehicle.id} ${vehicle.driver} ${vehicle.registration}`}
                onSelect={() => select(vehicle.id)}
              >
                <Truck />
                <span>{vehicle.id}</span>
                <span className="text-muted-foreground">{vehicle.driver}</span>
                <Badge variant="outline" size="sm" className="ml-auto">
                  {vehicle.status}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={`Deliveries · ${deliveries.length}`}>
            {deliveries.map((stop) => (
              <CommandItem
                key={stop.id}
                value={`delivery ${stop.id} ${stop.customer} ${stop.address}`}
                onSelect={() => select(stop.vehicleId, stop.id)}
              >
                <Package />
                <span>{stop.customer}</span>
                <span className="ml-auto text-xs text-muted-foreground">{stop.vehicleId}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Depots · 1">
            <CommandItem
              value={DEPOT_NAME}
              onSelect={() => {
                onCenter(DEPOT);
                onOpenChange(false);
              }}
            >
              <MapPin />
              {DEPOT_NAME}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
