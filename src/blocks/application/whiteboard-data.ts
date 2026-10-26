import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { BinaryFiles } from "@excalidraw/excalidraw/types";
export type Tool =
  | "select"
  | "hand"
  | "rect"
  | "diamond"
  | "ellipse"
  | "arrow"
  | "line"
  | "draw"
  | "text"
  | "image"
  | "eraser"
  | "frame"
  | "laser"
  | "embeddable";
export type Shape = {
  id: string;
  kind: Tool | "note" | "frame" | "phone";
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  color?: string;
  points?: string;
  image?: string;
  lane?: number;
  story?: number;
  owner?: string;
  presence?: string;
};
export type Scene = {
  shapes: Shape[];
  name: string;
  native?: readonly ExcalidrawElement[];
  files?: BinaryFiles;
};
export const ink = "#34343a";
export const colors = ["#fff0a5", "#c4f3ce", "#c8ddff", "#f8cbcd", "#e6d9ff"];
export const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
export function designScene(): Shape[] {
  const shapes: Shape[] = [
    { id: "goals", kind: "frame", x: 0, y: 0, w: 320, h: 340, text: "Goals" },
    {
      id: "flow",
      kind: "frame",
      x: 416,
      y: 0,
      w: 1084,
      h: 400,
      text: "User Flow",
    },
    {
      id: "checkout",
      kind: "frame",
      x: 0,
      y: 520,
      w: 492,
      h: 392,
      text: "Checkout v2",
    },
    {
      id: "questions",
      kind: "frame",
      x: 588,
      y: 520,
      w: 496,
      h: 296,
      text: "Open Questions",
    },
    {
      id: "decisions",
      kind: "frame",
      x: 1180,
      y: 520,
      w: 320,
      h: 340,
      text: "Decisions",
    },
  ];
  [
    "Mobile: 38% quit\nat the payment step",
    "Goal: 30% payment\ndrop off by Q4",
    "No new PCI scope.\nMetric owner: Priya",
  ].forEach((text, index) =>
    shapes.push({
      id: `goal${index}`,
      kind: "note",
      x: 40,
      y: 40 + index * 92,
      w: 240,
      h: 76,
      text,
      color: colors[index],
    }),
  );
  const nodes = [
    { x: 456, y: 72, w: 120, h: 56, text: "Cart", kind: "rect" },
    { x: 669, y: 72, w: 120, h: 56, text: "Shipping", kind: "rect" },
    { x: 882, y: 40, w: 152, h: 120, text: "Saved\ncard?", kind: "diamond" },
    { x: 1127, y: 72, w: 120, h: 56, text: "Review", kind: "rect" },
    { x: 1340, y: 72, w: 120, h: 56, text: "Done", kind: "rect" },
    { x: 898, y: 253, w: 120, h: 56, text: "Add Card", kind: "rect" },
  ];
  nodes.forEach((node, index) =>
    shapes.push({ ...node, id: `node${index}`, kind: node.kind as Tool }),
  );
  [
    [582.5, 100, 80, 0],
    [795.5, 100, 80, 0],
    [1040.5, 100, 80, 0],
    [1253.5, 100, 80, 0],
    [958, 166.5, 0, 80],
    [1024, 280.5, 163, 0],
    [1187, 280.5, 0, -146.5],
  ].forEach(([x, y, w, h], index) =>
    shapes.push({ id: `arrow${index}`, kind: "arrow", x, y, w, h }),
  );
  shapes.push(
    { id: "no", kind: "text", x: 856, y: 258, w: 60, h: 25, text: "No" },
    { id: "yes", kind: "text", x: 956, y: 159, w: 42, h: 23, text: "Yes" },
    { id: "pay", kind: "text", x: 1134, y: 159, w: 50, h: 23, text: "Pay" },
    {
      id: "exits",
      kind: "note",
      x: 456,
      y: 243,
      w: 240,
      h: 76,
      text: "Most exits happen\non the card form",
      color: colors[3],
    },
    {
      id: "audience",
      kind: "text",
      x: 456,
      y: 335,
      w: 370,
      h: 30,
      text: "Mobile web, signed in shoppers",
    },
    { id: "screen", kind: "phone", x: 40, y: 560, w: 156, h: 312 },
  );
  [
    "Wallet buttons\nabove the card form",
    "Billing copies\nshipping",
    "Card errors are\neasy to miss",
  ].forEach((text, index) =>
    shapes.push({
      id: `screen-note-${index}`,
      kind: "note",
      x: 212,
      y: 560 + index * 92,
      w: 240,
      h: 76,
      text,
      color: [colors[0], colors[2], colors[3]][index],
    }),
  );
  shapes.push({
    id: "screen-badge",
    kind: "note",
    x: 212,
    y: 836,
    w: 56,
    h: 36,
    text: "+3",
    color: colors[4],
  });
  [
    "Express wallets\non web in scope?\nKenji",
    "Keep guest\ncheckout?\nPriya",
    "Card scan on\nAndroid only?\nOmar",
    "Which saved card\nis the default?\nEmma",
  ].forEach((text, index) =>
    shapes.push({
      id: `question-${index}`,
      kind: "note",
      x: 628 + (index % 2) * 216,
      y: 560 + Math.floor(index / 2) * 116,
      w: 200,
      h: 100,
      text,
      color: [colors[0], colors[0], colors[2], colors[4]][index],
    }),
  );
  [
    "Wallet buttons ship\nfirst. Kenji, Oct 8",
    "exp_express_pay\nstays at 10%. Priya",
    "One page review\nstays. Sofia, Oct 2",
  ].forEach((text, index) =>
    shapes.push({
      id: `decision-${index}`,
      kind: "note",
      x: 1220,
      y: 560 + index * 92,
      w: 240,
      h: 76,
      text,
      color: colors[1],
    }),
  );
  return shapes;
}
export function sprintScene(): Shape[] {
  const shapes: Shape[] = [
    {
      id: "sprint-goal",
      kind: "frame",
      x: 0,
      y: 0,
      w: 736,
      h: 156,
      text: "Sprint Goal",
    },
    {
      id: "sprint-risks",
      kind: "frame",
      x: 832,
      y: 0,
      w: 736,
      h: 156,
      text: "Risks",
    },
    {
      id: "goal-delivery",
      kind: "note",
      x: 40,
      y: 40,
      w: 400,
      h: 76,
      text: "Express Pay live for\n10% of web merchants",
      color: "#fffde8",
    },
    {
      id: "goal-demo",
      kind: "note",
      x: 456,
      y: 40,
      w: 240,
      h: 76,
      text: "Demo on Oct 9",
      color: "#fffde8",
    },
    {
      id: "risk-wallet",
      kind: "note",
      x: 872,
      y: 40,
      w: 208,
      h: 76,
      text: "Apple Pay domain\nnot verified",
      color: "#fff1f2",
    },
    {
      id: "risk-legal",
      kind: "note",
      x: 1096,
      y: 40,
      w: 208,
      h: 76,
      text: "Legal review on\nreceipt copy",
      color: "#fff1f2",
    },
    {
      id: "risk-away",
      kind: "note",
      x: 1320,
      y: 40,
      w: 208,
      h: 76,
      text: "Emma away\nOct 5 and 6",
      color: "#fff1f2",
    },
  ];
  const names = ["Express Pay", "Receipts", "Offline Research", "Parked"];
  const cards = [
    [
      { text: "Apple Pay sheet", points: 5, owner: "Omar" },
      { text: "Card fallback", points: 3, owner: "Omar" },
      { text: "Rollout flag 10%", points: 2, owner: "Alex" },
      { text: "Refund path", points: 3, owner: "Omar" },
    ],
    [
      { text: "Email receipt", points: 3, owner: "Sofia" },
      { text: "Reprint receipt", points: 2, owner: "Sofia" },
      { text: "Receipt QR code", points: 3, owner: "Priya" },
    ],
    [
      { text: "Merchant calls", points: 3, owner: "Emma" },
      { text: "Sync conflicts", points: 2, owner: "Emma" },
    ],
    [
      { text: "Split tender", points: 8, owner: "" },
      { text: "Tip presets", points: 3, owner: "" },
    ],
  ];
  names.forEach((text, lane) => {
    shapes.push({
      id: `lane${lane}`,
      kind: "frame",
      x: lane * 416,
      y: 276,
      w: 320,
      h: 432,
      text,
    });
    cards[lane].forEach((card, i) =>
      shapes.push({
        id: `story-${lane}-${i}`,
        kind: "note",
        x: 40 + lane * 416,
        y: 316 + i * 92,
        w: 240,
        h: 76,
        text: `${card.text}\n${card.points} pts`,
        story: card.points,
        lane,
        owner: card.owner,
        color: ["#eef6ff", "#effbf5", "#f5f0ff", "#fff"][lane],
        presence: i === 0 && lane < 2 ? ["Omar", "Sofia"][lane] : undefined,
      }),
    );
  });
  return shapes;
}
