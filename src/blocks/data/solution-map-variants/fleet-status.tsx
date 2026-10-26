import type { ComponentProps } from "react";
import { Badge } from "@/components/reui/badge";
import { Truck, Zap } from "lucide-react";
import type { FleetVehicle } from "./fleet-types";

export function VehicleStatusBadge({ status }: { status: FleetVehicle["status"] }) {
  const variant: ComponentProps<typeof Badge>["variant"] =
    status === "On route"
      ? "success-light"
      : status === "Breakdown"
        ? "destructive-light"
        : status === "Retired"
          ? "secondary"
          : "warning-light";
  return (
    <Badge size="sm" variant={variant}>
      {status}
    </Badge>
  );
}

export function VehicleKindIcon({ kind }: { kind: FleetVehicle["kind"] }) {
  const Icon = kind === "electric" ? Zap : Truck;
  return <Icon aria-hidden="true" />;
}
