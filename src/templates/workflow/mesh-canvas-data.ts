import { colors, designScene as baseDesignScene } from "@/blocks/application/whiteboard-data";
import type { Shape } from "@/blocks/application/whiteboard-data";
export { colors, stamp, sprintScene } from "@/blocks/application/whiteboard-data";
export type { Shape, Tool, Scene } from "@/blocks/application/whiteboard-data";

const boardLabels: Record<string, string> = {
  checkout: "Driver Screen",
  goal0: "Drivers replan\nstops by hand",
  goal1: "Goal: 30% less\nplanning time",
  goal2: "Adoption: 70% by\n30 days after GA",
  node0: "Start day",
  node1: "See stops",
  node2: "Signal\nok?",
  node3: "Optimise",
  node4: "Drive",
  node5: "Saved map",
  pay: "Go",
  exits: "Drivers undo\nsilent reroutes",
  audience: "Driver app, Route Planner beta",
  "screen-note-0": "Show new ETAs\nwhile dragging",
  "screen-note-1": "Finished stops\nfold to the end",
  "screen-note-2": "Late ETAs are\neasy to miss",
  "question-0": "Dispatcher\noverrides win?\nLeo",
  "question-1": "Undo a reroute\nin one tap?\nMira",
  "question-2": "Will drivers\ntrust reroutes?\nTheo",
  "question-3": "Offline maps\nfit old phones?\nNora",
  "decision-0": "Stops reorder\nby drag. Mira, Fri",
  "decision-1": "Beta: 200 drivers\nfrom Wed 4 Nov",
  "decision-2": "Offline maps ship\nin v1. Nora, Mon",
};

/** Reuse the Blocks layout and engine, with Mesh's independent sample content. */
export function designScene(): Shape[] {
  return baseDesignScene().map((shape) => ({
    ...shape,
    text: boardLabels[shape.id] ?? shape.text,
    color: ["goal1", "goal2", "decision-1"].includes(shape.id) ? colors[2] : shape.color,
  }));
}
