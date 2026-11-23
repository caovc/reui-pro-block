import { Badge } from "@/components/reui/badge";
import type { FluxFailureStatus } from "./flux-runs-model";

export function FluxFailureBadge({ status }: { status: FluxFailureStatus }) {
  return (
    <Badge
      variant={
        status === "Failed"
          ? "destructive-light"
          : status === "Retrying"
            ? "warning-light"
            : "secondary"
      }
    >
      {status}
    </Badge>
  );
}
