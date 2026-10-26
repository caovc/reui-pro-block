import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin, Pencil, Truck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { demoAvatar } from "@/lib/demo-artwork";
import { FleetCard, MetricRows } from "./fleet-panel";
import { FleetActivity } from "./fleet-events";
import { dispatchTime, openStops, routeMetrics, vehicleAlerts } from "./fleet-model";
import { useFleet, type DispatchDialog } from "./fleet-context";
import { VehicleArtwork } from "./vehicle-artwork";
import { VehicleControls } from "./vehicle-controls";
import { VehicleStatusBadge } from "./fleet-status";
import type { Coordinate } from "./fleet-types";

export function VehicleSheet({
  open,
  onOpenChange,
  onDialog,
  onCenter,
  onCloseAutoFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDialog: (dialog: DispatchDialog) => void;
  onCenter: (position: Coordinate) => void;
  onCloseAutoFocus: (event: Event) => void;
}) {
  const { state, act } = useFleet();
  const vehicle = state.selectedVehicleId ? state.vehicles[state.selectedVehicleId] : null;
  const vehicles = Object.values(state.vehicles).filter((item) => item.status !== "Retired");
  const index = vehicles.findIndex((item) => item.id === vehicle?.id);
  const metrics = vehicle ? routeMetrics(state, vehicle.id) : null;
  return (
    <Sheet open={open && !!vehicle} onOpenChange={onOpenChange}>
      <SheetContent
        className="reui-reference dm-detail-sheet"
        aria-label="Van details"
        data-dm-focus-layer="vehicle"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {vehicle && metrics && (
          <>
            <SheetHeader className="dm-detail-heading">
              <div className="flex items-center gap-2">
                <Truck className="size-4" />
                <SheetTitle tabIndex={-1} data-dm-focus-fallback>
                  {vehicle.id}
                </SheetTitle>
                <VehicleStatusBadge status={vehicle.status} />
              </div>
              <SheetDescription>Van details · {vehicle.registration}</SheetDescription>
            </SheetHeader>
            <Tabs defaultValue="overview" className="dm-detail-tabs" key={vehicle.id}>
              <div className="dm-detail-tabs-viewport">
                <TabsList variant="line" aria-label="Van detail sections">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
                  <TabsTrigger value="controls">Controls</TabsTrigger>
                  <TabsTrigger value="route">Route</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
              </div>
              <div className="dm-detail-scroll">
                <TabsContent value="overview" className="dm-detail-content">
                  <VehicleArtwork vehicle={vehicle} />
                  {vehicleAlerts(state, vehicle.id).map((alert) => (
                    <Alert variant="warning" key={alert.id}>
                      <Truck />
                      <AlertTitle>{alert.title}</AlertTitle>
                      <AlertDescription>{alert.detail}</AlertDescription>
                    </Alert>
                  ))}
                  <div className="dm-vitals">
                    <FleetCard title={vehicle.kind === "electric" ? "Battery" : "Fuel"}>
                      <strong className="dm-vital-value">
                        {vehicle.fuel.toFixed(0)}
                        <small>%</small>
                      </strong>
                      <Progress value={vehicle.fuel} className="mt-3" />
                    </FleetCard>
                    <FleetCard title="Estimated range">
                      <strong className="dm-vital-value">
                        {metrics.remainingRange.toFixed(0)}
                        <small>mi</small>
                      </strong>
                      <p className="dm-empty-note">
                        Based on remaining {vehicle.kind === "electric" ? "charge" : "fuel"}
                      </p>
                    </FleetCard>
                    <FleetCard title="Cargo capacity">
                      <strong className="dm-vital-value">
                        {metrics.parcels}
                        <small>/ {vehicle.capacity}</small>
                      </strong>
                      <Progress
                        value={(metrics.parcels / vehicle.capacity) * 100}
                        className="mt-3"
                      />
                    </FleetCard>
                    <FleetCard title="Route progress">
                      <strong className="dm-vital-value">
                        {metrics.delivered}
                        <small>/ {metrics.all.length}</small>
                      </strong>
                      <p className="dm-empty-note">Deliveries completed</p>
                    </FleetCard>
                  </div>
                  {vehicle.coldBox && (
                    <FleetCard title="Cargo temperature">
                      <MetricRows
                        rows={[
                          ["Sensor reading", `${vehicle.temperature}°F`],
                          ["Target", `${vehicle.controls.targetTemperature}°F`],
                          [
                            "Cold chain",
                            vehicle.temperature <= 41 ? "Within range" : "Review required",
                          ],
                        ]}
                      />
                    </FleetCard>
                  )}
                </TabsContent>
                <TabsContent value="vehicle" className="dm-detail-content">
                  <Frame spacing="sm">
                    <FrameHeader>
                      <FrameTitle>Vehicle information</FrameTitle>
                    </FrameHeader>
                    <FramePanel>
                      <MetricRows
                        rows={[
                          ["Vehicle", vehicle.id],
                          ["Registration", vehicle.registration],
                          ["Powertrain", vehicle.kind === "electric" ? "Electric" : "Gasoline"],
                          ["Body", vehicle.body === "box" ? "Box van" : "Cargo van"],
                          ["Cold box", vehicle.coldBox ? "Equipped" : "Not equipped"],
                          ["Parcel capacity", vehicle.capacity],
                          ["Depot", vehicle.depot],
                        ]}
                      />
                    </FramePanel>
                  </Frame>
                  <FleetCard title="Assigned driver">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={demoAvatar(vehicle.driver)} alt={vehicle.driver} />
                        <AvatarFallback>
                          {vehicle.driver
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <strong className="text-sm">{vehicle.driver}</strong>
                        <p className="text-xs text-muted-foreground">Local demo driver</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => onDialog({ kind: "message", vehicleId: vehicle.id })}
                      >
                        Message
                      </Button>
                    </div>
                  </FleetCard>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onDialog({ kind: "edit", vehicleId: vehicle.id })}
                      disabled={vehicle.status === "Retired"}
                    >
                      <Pencil />
                      Edit van
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={
                        vehicle.status === "Retired" || openStops(state, vehicle.id).length > 0
                      }
                      onClick={() => onDialog({ kind: "retire", vehicleId: vehicle.id })}
                    >
                      Retire van
                    </Button>
                  </div>
                  {openStops(state, vehicle.id).length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Reassign or close all open deliveries before retiring this van.
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="controls" className="dm-detail-content">
                  <VehicleControls
                    vehicle={vehicle}
                    key={`${vehicle.id}-${JSON.stringify(vehicle.controls)}`}
                  />
                </TabsContent>
                <TabsContent value="route" className="dm-detail-content">
                  <FleetCard title="Route summary">
                    <MetricRows
                      rows={[
                        ["Remaining stops", metrics.pending.length],
                        ["Remaining distance", `${metrics.miles.toFixed(1)} mi`],
                        ["Estimated completion", dispatchTime(metrics.eta)],
                        ["Drive mode", vehicle.controls.mode],
                      ]}
                    />
                  </FleetCard>
                  {metrics.all.length ? (
                    metrics.all.map((stop, position) => (
                      <Frame
                        spacing="sm"
                        key={stop.id}
                        className="dm-route-stop"
                        data-selected={state.selectedStopId === stop.id}
                      >
                        <FramePanel className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="dm-stop-number">{position + 1}</span>
                            <strong className="min-w-0 flex-1 text-sm">{stop.customer}</strong>
                            <Badge size="sm" variant="outline">
                              {stop.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{stop.address}</p>
                          <MetricRows
                            rows={[
                              [
                                "Window",
                                `${dispatchTime(stop.windowStart)}–${dispatchTime(stop.windowEnd)}`,
                              ],
                              ["Parcels", stop.parcels],
                              ["Cold chain", stop.cold ? "Required" : "Ambient"],
                            ]}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                act({ type: "select", vehicleId: vehicle.id, stopId: stop.id });
                                onCenter(stop.position);
                              }}
                            >
                              <MapPin />
                              Locate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!metrics.pending.includes(stop)}
                              onClick={() => onDialog({ kind: "reassign", stopId: stop.id })}
                            >
                              Reassign
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!metrics.pending.includes(stop)}
                              onClick={() => onDialog({ kind: "reschedule", stopId: stop.id })}
                            >
                              Reschedule
                            </Button>
                          </div>
                        </FramePanel>
                      </Frame>
                    ))
                  ) : (
                    <p className="dm-empty-note">No route is assigned to this vehicle.</p>
                  )}
                </TabsContent>
                <TabsContent value="activity" className="dm-detail-content">
                  <FleetActivity vehicleId={vehicle.id} />
                </TabsContent>
              </div>
            </Tabs>
            <footer className="dm-detail-footer">
              <Button
                variant="outline"
                size="sm"
                disabled={index <= 0}
                aria-label="Previous vehicle"
                onClick={() => act({ type: "select", vehicleId: vehicles[index - 1].id })}
              >
                <ChevronLeft />
              </Button>
              <span className="text-xs text-muted-foreground">
                {index >= 0 ? index + 1 : "—"} / {vehicles.length} vans
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={index < 0 || index >= vehicles.length - 1}
                aria-label="Next vehicle"
                onClick={() => act({ type: "select", vehicleId: vehicles[index + 1].id })}
              >
                <ChevronRight />
              </Button>
              <Button
                className="ml-auto"
                size="sm"
                variant="outline"
                onClick={() => onCenter(vehicle.position)}
              >
                <ArrowUpRight />
                Locate van
              </Button>
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
