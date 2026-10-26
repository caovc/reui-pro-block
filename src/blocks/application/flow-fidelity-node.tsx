import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { CheckCircle2, Circle, CircleX, Clock3, LoaderCircle, Minus } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import type { BadgeProps } from "@/components/reui/badge";
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { MiniAvatar } from "./flow-gantt-avatars";
import type { FlowNode, RunState } from "./flow-gantt-data";
import "./flow-fidelity-node.css";

export interface FlowFidelityNodeProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  node: FlowNode & { app?: string; category?: string };
  variant: 0 | 1;
  status: RunState;
  icon: ReactNode;
  selected?: boolean;
  children?: ReactNode;
}

const statusVariants: Record<RunState, BadgeProps["variant"]> = {
  Succeeded: "success-light",
  Failed: "destructive-light",
  Waiting: "warning-light",
  Running: "info-light",
  Idle: "outline",
  Queued: "outline",
  Skipped: "outline",
};

function StateIcon({ status }: { status: RunState }) {
  const Icon =
    status === "Succeeded"
      ? CheckCircle2
      : status === "Failed"
        ? CircleX
        : status === "Skipped"
          ? Minus
          : status === "Running"
            ? LoaderCircle
            : status === "Waiting" || status === "Queued"
              ? Clock3
              : Circle;
  return (
    <Icon aria-hidden="true" className={status === "Running" ? "flow-fidelity-spin" : undefined} />
  );
}

/** Graph state and controls remain with the caller; ReUI owns the node surfaces. */
export const FlowFidelityNode = forwardRef<HTMLDivElement, FlowFidelityNodeProps>(
  function FlowFidelityNode(
    { node, variant, status, icon, selected, children, className = "", ...props },
    ref,
  ) {
    const initials = node.owner
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("");
    const durationParts = node.duration.split(" · ");
    const statusLabel =
      status === "Succeeded"
        ? variant === 0
          ? "Success"
          : "Passed"
        : variant === 1 && status === "Idle"
          ? "Not run"
          : status;
    const solidIcon = variant === 0 && (node.id === "form" || node.category === "Webhook");
    return (
      <Frame
        ref={ref}
        variant="default"
        spacing="xs"
        dense
        data-flow-node-variant={variant}
        data-selected={selected || undefined}
        {...props}
        className={`flow-fidelity-node ${className}`}
      >
        {children && <div className="flow-fidelity-node-controls">{children}</div>}
        <FramePanel fit className="shadow-none">
          <FrameHeader className="flow-fidelity-node-body">
            <IconTile variant={solidIcon ? "solid" : "outline"} size="sm">
              {icon}
            </IconTile>
            <div className="flow-fidelity-node-copy">
              <div className="flow-fidelity-node-title">{node.title}</div>
              <p className="flow-fidelity-node-description">{node.detail}</p>
            </div>
          </FrameHeader>
          <FrameFooter className="flow-fidelity-node-footer">
            {variant === 0 ? (
              <>
                <div className="flow-fidelity-node-owner">
                  <MiniAvatar name={initials} />
                  <span className="flow-fidelity-node-duration">{node.duration}</span>
                </div>
                <Badge variant={statusVariants[status]} className="flow-fidelity-node-badge">
                  <StateIcon status={status} />
                  {statusLabel}
                </Badge>
              </>
            ) : (
              <>
                <span
                  className={`flow-fidelity-run-state flow-fidelity-run-${status.toLowerCase()}`}
                >
                  <StateIcon status={status} />
                  <span className="sr-only">{statusLabel}</span>
                </span>
                {durationParts.map((part, index) => (
                  <span className="flow-fidelity-duration-part" key={`${index}-${part}`}>
                    {index > 0 && (
                      <span className="flow-fidelity-duration-dot" aria-hidden="true" />
                    )}
                    <span className="flow-fidelity-node-duration">{part}</span>
                  </span>
                ))}
              </>
            )}
          </FrameFooter>
        </FramePanel>
      </Frame>
    );
  },
);

export default FlowFidelityNode;
