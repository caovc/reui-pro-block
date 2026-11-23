import { Badge } from "@/components/reui/badge";
import type { FluxQueuePriority, FluxQueueStatus } from "./flux-queue-model";

export function FluxQueueStatusBadge({ status }: { status: FluxQueueStatus }) {
  return (
    <Badge
      variant={
        status === "Failed"
          ? "destructive-light"
          : status === "Succeeded"
            ? "success-light"
            : status === "Running"
              ? "info-light"
              : status === "Held"
                ? "warning-light"
                : "secondary"
      }
    >
      {status}
    </Badge>
  );
}
export function FluxQueuePriorityBadge({ priority }: { priority: FluxQueuePriority }) {
  return (
    <Badge variant={priority === "High" ? "warning-light" : "secondary"}>{priority} priority</Badge>
  );
}
