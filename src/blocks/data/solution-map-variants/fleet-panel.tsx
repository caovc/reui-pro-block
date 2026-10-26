import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  LocateFixed,
  MessageSquare,
  Pencil,
  Route,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { Frame, FrameHeader, FrameTitle, FramePanel, FrameFooter } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ReuiDonut } from "../reui-free-chart-primitives";
import { useFleet, type DispatchDialog } from "./fleet-context";
import { dispatchTime, fleetSummary, openStops, routeMetrics, vehicleAlerts } from "./fleet-model";
import { VehicleStatusBadge } from "./fleet-status";
import type { Coordinate } from "./fleet-types";

export function FleetCard({
  title,
  action,
  children,
  footer,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Frame spacing="sm">
      <FrameHeader className="flex flex-row items-center justify-between">
        <FrameTitle className="text-xs font-medium">{title}</FrameTitle>
        {action}
      </FrameHeader>
      <FramePanel className="p-3">{children}</FramePanel>
      {footer && <FrameFooter className="text-xs">{footer}</FrameFooter>}
    </Frame>
  );
}
export function MetricRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="dm-metric-rows">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

type Props = {
  onDialog: (dialog: DispatchDialog) => void;
  onDetails: () => void;
  onFit: () => void;
  onCenter: (position: Coordinate) => void;
};
export function FleetPanel(props: Props) {
  const { state, act } = useFleet();
  const [active, setActive] = useState<number | null>(null);
  const vehicle = state.selectedVehicleId ? state.vehicles[state.selectedVehicleId] : null;
  const summary = fleetSummary(state);
  const pending = Object.values(state.stops).filter((stop) =>
    ["Pending", "En route"].includes(stop.status),
  );
  if (!vehicle) {
    const failed = Object.values(state.stops).filter((stop) => stop.status === "Failed").length;
    const late = pending.filter((stop) => stop.windowEnd < state.now).length;
    return (
      <div className="dm-fleet-panel" aria-label="Fleet overview">
        <header className="dm-panel-heading">
          <h2>Fleet overview</h2>
          <Badge variant="outline" size="sm">
            {summary.vehicles} vans
          </Badge>
        </header>
        <FleetCard
          title="Today's deliveries"
          action={<span className="text-xs text-muted-foreground">Seattle</span>}
        >
          <div className="dm-today">
            <ReuiDonut
              label={`${summary.delivered} of ${summary.total} deliveries completed`}
              rows={[
                { name: "Delivered", value: summary.delivered, color: "var(--chart-2)" },
                { name: "To go", value: pending.length, color: "var(--muted)" },
                { name: "Failed", value: failed, color: "var(--destructive)" },
              ]}
              active={active}
              onActive={setActive}
              innerRadius={39}
              outerRadius={52}
              className="h-32 w-32 shrink-0"
              center={
                <>
                  <text
                    y="0"
                    textAnchor="middle"
                    fill="var(--foreground)"
                    fontSize="23"
                    fontWeight="600"
                  >
                    {summary.delivered}
                  </text>
                  <text y="17" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">
                    of {summary.total} stops
                  </text>
                </>
              }
            />
            <MetricRows
              rows={[
                ["Delivered", summary.delivered],
                ["Failed", failed],
                ["At risk", late],
                ["To go", pending.length],
              ]}
            />
          </div>
        </FleetCard>
        <FleetCard
          title="Needs attention"
          action={
            <Badge variant="warning-light" size="sm">
              {state.exceptions.filter((item) => !item.acknowledged).length}
            </Badge>
          }
        >
          <div className="dm-attention">
            {state.exceptions
              .filter((item) => !item.acknowledged)
              .map((item) => (
                <Button
                  variant="ghost"
                  key={item.id}
                  onClick={() =>
                    act({ type: "select", vehicleId: item.vehicleId, stopId: item.stopId })
                  }
                >
                  <TriangleAlert className="size-3.5 text-amber-500" />
                  <span>
                    <strong>{item.vehicleId}</strong>
                    <small>{item.title.replace(`${item.vehicleId} `, "")}</small>
                  </span>
                  <ChevronRight className="size-3" />
                </Button>
              ))}
            {!summary.exceptions && (
              <p className="text-xs text-muted-foreground">All exceptions reviewed.</p>
            )}
          </div>
        </FleetCard>
        <FleetCard
          title="Delivery pace"
          action={<span className="text-xs text-muted-foreground">stops / hour</span>}
        >
          <div className="dm-pace">
            {[8, 9, 10, 11, 12, 13].map((hour) => {
              const value = Object.values(state.stops).filter(
                (stop) =>
                  stop.completedAt &&
                  new Intl.DateTimeFormat("en-US", {
                    hour: "numeric",
                    hourCycle: "h23",
                    timeZone: "America/Los_Angeles",
                  }).format(stop.completedAt) === String(hour).padStart(2, "0"),
              ).length;
              return (
                <div key={hour}>
                  <span>{hour}:00</span>
                  <Progress value={Math.min(100, value * 5)} />
                  <strong>{value}</strong>
                </div>
              );
            })}
          </div>
        </FleetCard>
        <FleetCard title="Van status">
          <MetricRows
            rows={["On route", "Returning", "At depot", "Charging", "Maintenance", "Breakdown"].map(
              (status) => [
                status,
                Object.values(state.vehicles).filter((item) => item.status === status).length,
              ],
            )}
          />
        </FleetCard>
        <p className="dm-panel-note">Local simulation · {dispatchTime(state.now)} PDT</p>
      </div>
    );
  }
  const metrics = routeMetrics(state, vehicle.id);
  const stops = metrics.all;
  const stopIndex = Math.max(
    0,
    stops.findIndex((stop) => stop.id === state.selectedStopId),
  );
  const stop = stops[stopIndex];
  const alerts = vehicleAlerts(state, vehicle.id);
  const closed = !stop || !["Pending", "En route"].includes(stop.status);
  const selectStop = (index: number) => {
    if (stops[index]) act({ type: "select", vehicleId: vehicle.id, stopId: stops[index].id });
  };
  return (
    <div className="dm-fleet-panel" aria-label={`${vehicle.id} route panel`}>
      <header className="dm-panel-heading">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to fleet overview"
          onClick={() => act({ type: "select", vehicleId: null })}
        >
          <ArrowLeft />
        </Button>
        <h2>{vehicle.id}</h2>
        <VehicleStatusBadge status={vehicle.status} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto"
              aria-label="More van actions"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="reui-reference">
            <DropdownMenuLabel>{vehicle.id}</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={props.onFit}>
                <Route />
                Fit route
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => props.onDialog({ kind: "message", vehicleId: vehicle.id })}
              >
                <MessageSquare />
                Message driver
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={props.onDetails}>
                <Truck />
                Van details
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => props.onDialog({ kind: "edit", vehicleId: vehicle.id })}
              >
                <Pencil />
                Edit van
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <FleetCard
        title="Route"
        action={
          <span className="text-xs tabular-nums">
            {metrics.delivered} / {stops.length}
          </span>
        }
      >
        <Progress value={metrics.progress * 100} />
        <div className="dm-route-metrics">
          <span>
            <strong>{metrics.miles.toFixed(1)} mi</strong>remaining
          </span>
          <span>
            <strong>{dispatchTime(metrics.eta)}</strong>back at depot
          </span>
          <span>
            <strong>{openStops(state, vehicle.id).length}</strong>stops to go
          </span>
        </div>
      </FleetCard>
      {alerts.map((item) => (
        <Alert variant="warning" key={item.id}>
          <TriangleAlert />
          <AlertTitle className="text-xs">{item.title}</AlertTitle>
          <AlertDescription className="text-xs">{item.detail}</AlertDescription>
        </Alert>
      ))}
      <FleetCard title={vehicle.kind === "electric" ? "Battery & range" : "Fuel & range"}>
        <div className="flex items-baseline justify-between">
          <strong className="text-2xl font-semibold tabular-nums">
            {vehicle.fuel.toFixed(0)}
            <span className="text-sm text-muted-foreground">%</span>
          </strong>
          <span className="text-xs text-muted-foreground">
            {metrics.remainingRange.toFixed(0)} mi range
          </span>
        </div>
        <Progress className="my-3" value={vehicle.fuel} />
        <MetricRows
          rows={[
            ["Remaining load", `${metrics.parcels} / ${vehicle.capacity} parcels`],
            ["Drive mode", vehicle.controls.mode],
            ["Speed limit", `${vehicle.controls.speedLimit} mph`],
          ]}
        />
      </FleetCard>
      <FleetCard
        title="Stops"
        action={
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous stop"
              disabled={!stop || stopIndex === 0}
              onClick={() => selectStop(stopIndex - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next stop"
              disabled={!stop || stopIndex === stops.length - 1}
              onClick={() => selectStop(stopIndex + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        }
      >
        <RadioGroup
          className="dm-stop-picker"
          aria-label="Route stops"
          value={stop?.id ?? ""}
          onValueChange={(id) => act({ type: "select", vehicleId: vehicle.id, stopId: id })}
        >
          {stops.map((item, index) => (
            <label key={item.id} className="dm-stop-choice" data-status={item.status}>
              <RadioGroupItem value={item.id} className="sr-only" />
              <span>{item.status === "Delivered" ? "✓" : index + 1}</span>
              <span className="sr-only">
                {item.customer}, {item.status}
              </span>
            </label>
          ))}
        </RadioGroup>
        {stop ? (
          <div className="dm-stop-details">
            <div className="flex items-center justify-between gap-2">
              <strong>{stop.customer}</strong>
              <Badge
                variant={
                  stop.status === "Delivered"
                    ? "success-light"
                    : stop.status === "Failed"
                      ? "destructive-light"
                      : "outline"
                }
                size="sm"
              >
                {stop.status}
              </Badge>
            </div>
            <p>{stop.address}</p>
            <MetricRows
              rows={[
                ["Window", `${dispatchTime(stop.windowStart)}–${dispatchTime(stop.windowEnd)}`],
                ["Parcels", stop.parcels],
                ["Cold chain", stop.cold ? "Required · ≤41°F" : "Ambient"],
              ]}
            />
            {stop.failureReason && <p className="text-destructive">{stop.failureReason}</p>}
            <div className="dm-stop-actions">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" aria-label="More stop actions">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="reui-reference">
                  <DropdownMenuLabel>{stop.id}</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      disabled={closed}
                      onSelect={() => props.onDialog({ kind: "reschedule", stopId: stop.id })}
                    >
                      Reschedule
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={closed}
                      onSelect={() => props.onDialog({ kind: "reassign", stopId: stop.id })}
                    >
                      Reassign
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => props.onCenter(stop.position)}>
                      <LocateFixed />
                      Center on map
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onSelect={() => props.onDialog({ kind: "message", vehicleId: vehicle.id })}
                    >
                      Message driver
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                disabled={closed}
                onClick={() => props.onDialog({ kind: "fail", stopId: stop.id })}
              >
                Failed
              </Button>
              <Button
                size="sm"
                disabled={closed}
                onClick={() => act({ type: "complete-stop", stopId: stop.id })}
              >
                Delivered
              </Button>
            </div>
          </div>
        ) : (
          <p className="py-4 text-xs text-muted-foreground">
            No deliveries assigned. This van can receive an eligible delivery.
          </p>
        )}
      </FleetCard>
    </div>
  );
}
