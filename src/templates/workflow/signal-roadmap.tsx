import { useState } from "react";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Gantt } from "@/components/reui/gantt/gantt";
import { GanttNav } from "@/components/reui/gantt/gantt-nav";
import type { GanttEvent, GanttProposedUpdate } from "@/components/reui/gantt/gantt-types";
import { GanttView } from "@/components/reui/gantt/gantt-view";
import { overlapsSignalReview } from "./signal-model";

const kickoff = new Date("2026-09-28T00:00:00Z");
const roadmapCenter = new Date("2026-10-04T12:00:00Z");
const launch = [{ id: "launch", title: "Launch track" }];
const review = {
  id: "review",
  title: "Security review",
  readOnly: true,
  resourceId: "launch",
  start: new Date("2026-10-05T00:00:00Z"),
  end: new Date("2026-10-09T00:00:00Z"),
};
const original: GanttEvent[] = [
  {
    id: "audit",
    title: "Prepare evidence",
    resourceId: "launch",
    color: "#388878",
    start: kickoff,
    end: new Date("2026-10-03T00:00:00Z"),
  },
  review,
  {
    id: "rollout",
    title: "Pilot rollout",
    resourceId: "launch",
    color: "#5276bf",
    start: new Date("2026-10-13T00:00:00Z"),
    end: new Date("2026-10-19T00:00:00Z"),
  },
];

function allowed({ event, start, end }: GanttProposedUpdate) {
  return event.id !== review.id && start < end && !overlapsSignalReview(start, end, review);
}

export default function SignalRoadmap() {
  const [events, setEvents] = useState(original);
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Launch schedule</FrameTitle>
      </FrameHeader>
      <FramePanel>
        <p className="mb-3 text-sm text-muted-foreground">
          Drag or resize tasks around the locked Security review.
        </p>
        <Gantt
          className="signal-roadmap"
          resources={launch}
          events={events}
          timeZone="UTC"
          defaultDate={roadmapCenter}
          initialCenter={roadmapCenter}
          scrollbars="native"
          treePanel={{ width: 148, minWidth: 130, resizable: false }}
          defaultScale="month"
          canDropEvent={allowed}
          enforceCanDrop
          onEventUpdate={(update) => {
            if (!allowed(update)) return false;
            setEvents((current) =>
              current.map((event) =>
                event.id === update.event.id
                  ? { ...event, start: update.start, end: update.end }
                  : event,
              ),
            );
            return true;
          }}
        >
          <GanttNav />
          <GanttView />
        </Gantt>
      </FramePanel>
    </Frame>
  );
}
