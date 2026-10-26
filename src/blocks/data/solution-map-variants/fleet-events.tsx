// Composes official free REUI c-timeline-6/10 and c-frame-10. MIT (c) Keenthemes.
// Domain records and actions are original local Dispatch simulation data.
import { Check, ChevronRight, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Frame, FrameHeader, FramePanel } from "@/components/reui/frame";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useFleet } from "./fleet-context";
import { dispatchTime } from "./fleet-model";

export function FleetActivity({ vehicleId }: { vehicleId?: string }) {
  const { state } = useFleet();
  const items = state.activity.filter((item) => !vehicleId || item.vehicleId === vehicleId);
  if (!items.length)
    return <p className="dm-empty-note">No activity recorded for this vehicle yet.</p>;
  return (
    <Timeline value={items.length} className="dm-timeline">
      {items.map((item, index) => (
        <TimelineItem key={item.id} step={index + 1} className="ms-8 pb-5">
          <TimelineHeader>
            <TimelineSeparator className="-left-6" />
            <TimelineTitle className="text-xs font-medium">{item.title}</TimelineTitle>
            <TimelineIndicator className="-left-6 size-5">
              <Check className="size-3" />
            </TimelineIndicator>
          </TimelineHeader>
          <TimelineContent className="mt-1">
            <p className="text-xs text-muted-foreground">{item.detail}</p>
            <TimelineDate className="mb-0 mt-1">{dispatchTime(item.at)} PDT</TimelineDate>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}

export function FleetExceptions({ onSelected }: { onSelected: () => void }) {
  const { state, act } = useFleet();
  return (
    <Timeline value={state.exceptions.length} className="dm-timeline">
      {state.exceptions.map((item, index) => (
        <TimelineItem key={item.id} step={index + 1} className="ms-8 pb-5">
          <TimelineHeader>
            <TimelineSeparator className="-left-6" />
            <TimelineTitle className="text-sm">{item.title}</TimelineTitle>
            <TimelineIndicator className="-left-6 size-5">
              <TriangleAlert className="size-3" />
            </TimelineIndicator>
          </TimelineHeader>
          <TimelineContent className="mt-2">
            <Frame stacked dense spacing="sm">
              <Collapsible defaultOpen className="group/collapsible">
                <CollapsibleTrigger className="flex w-full text-left">
                  <FrameHeader className="flex w-full flex-row items-center gap-2">
                    <Badge size="sm" variant={item.acknowledged ? "outline" : "warning-light"}>
                      {item.acknowledged ? "Acknowledged" : "Needs review"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.vehicleId}</span>
                    <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </FrameHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <FramePanel className="space-y-3">
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          act({ type: "select", vehicleId: item.vehicleId, stopId: item.stopId });
                          onSelected();
                        }}
                      >
                        View {item.vehicleId}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={item.acknowledged}
                        onClick={() => act({ type: "acknowledge", exceptionId: item.id })}
                      >
                        {item.acknowledged ? "Acknowledged" : "Acknowledge"}
                      </Button>
                    </div>
                  </FramePanel>
                </CollapsibleContent>
              </Collapsible>
            </Frame>
            <TimelineDate className="mb-0 mt-1">{dispatchTime(item.createdAt)} PDT</TimelineDate>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
