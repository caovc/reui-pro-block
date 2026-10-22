import { useId, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Diamond,
  Eraser,
  FileJson,
  Grid2X2,
  Hand,
  ImagePlus,
  Library,
  LockKeyhole,
  Menu,
  Minus,
  MousePointer2,
  PanelRight,
  Pencil,
  Plus,
  Redo2,
  Share2,
  Square,
  Type,
  Undo2,
  X,
} from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import "./whiteboard.css";

type Tool =
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
  | "eraser";
type Shape = {
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
type Scene = { shapes: Shape[]; name: string };
const ink = "#34343a",
  colors = ["#fff0a5", "#c4f3ce", "#c8ddff", "#f8cbcd", "#e6d9ff"];
const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
function designScene(): Shape[] {
  const shapes: Shape[] = [
    { id: "goals", kind: "frame", x: 65, y: 98, w: 270, h: 287, text: "Goals" },
    {
      id: "flow",
      kind: "frame",
      x: 413,
      y: 98,
      w: 910,
      h: 336,
      text: "User Flow",
    },
    {
      id: "checkout",
      kind: "frame",
      x: 65,
      y: 535,
      w: 415,
      h: 330,
      text: "Checkout v2",
    },
    {
      id: "questions",
      kind: "frame",
      x: 560,
      y: 535,
      w: 417,
      h: 250,
      text: "Open Questions",
    },
    {
      id: "decisions",
      kind: "frame",
      x: 1055,
      y: 535,
      w: 270,
      h: 286,
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
      x: 100,
      y: 132 + index * 78,
      w: 200,
      h: 64,
      text,
      color: colors[index],
    }),
  );
  const nodes = [
    { x: 447, y: 159, w: 103, h: 48, text: "Cart", kind: "rect" },
    { x: 627, y: 159, w: 103, h: 48, text: "Shipping", kind: "rect" },
    { x: 808, y: 136, w: 120, h: 94, text: "Saved\ncard?", kind: "diamond" },
    { x: 1011, y: 159, w: 100, h: 48, text: "Review", kind: "rect" },
    { x: 1190, y: 159, w: 100, h: 48, text: "Done", kind: "rect" },
    { x: 819, y: 312, w: 101, h: 48, text: "Add Card", kind: "rect" },
  ];
  nodes.forEach((node, index) =>
    shapes.push({ ...node, id: `node${index}`, kind: node.kind as Tool }),
  );
  [
    [558, 183, 62, 0],
    [739, 183, 62, 0],
    [936, 183, 68, 0],
    [1120, 183, 62, 0],
    [868, 240, 0, 62],
    [925, 336, 135, 0],
    [1060, 336, 0, -120],
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
      x: 447,
      y: 302,
      w: 201,
      h: 64,
      text: "Most exits happen\non the card form",
      color: colors[3],
    },
    {
      id: "audience",
      kind: "text",
      x: 447,
      y: 383,
      w: 370,
      h: 30,
      text: "Mobile web, signed in shoppers",
    },
    { id: "screen", kind: "phone", x: 100, y: 570, w: 130, h: 260 },
  );
  [
    "Wallet buttons\nabove the card form",
    "Billing copies\nshipping",
    "Card errors are\neasy to miss",
  ].forEach((text, index) =>
    shapes.push({
      id: `screen-note-${index}`,
      kind: "note",
      x: 245,
      y: 570 + index * 78,
      w: 200,
      h: 64,
      text,
      color: [colors[0], colors[2], colors[3]][index],
    }),
  );
  shapes.push({
    id: "screen-badge",
    kind: "note",
    x: 245,
    y: 803,
    w: 46,
    h: 30,
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
      x: 595 + (index % 2) * 180,
      y: 570 + Math.floor(index / 2) * 98,
      w: 166,
      h: 84,
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
      x: 1090,
      y: 570 + index * 78,
      w: 200,
      h: 64,
      text,
      color: colors[1],
    }),
  );
  return shapes;
}
function sprintScene(): Shape[] {
  const shapes: Shape[] = [
    {
      id: "sprint-goal",
      kind: "frame",
      x: 35,
      y: 183,
      w: 620,
      h: 140,
      text: "Sprint Goal",
    },
    {
      id: "sprint-risks",
      kind: "frame",
      x: 735,
      y: 183,
      w: 620,
      h: 140,
      text: "Risks",
    },
    {
      id: "goal-delivery",
      kind: "note",
      x: 65,
      y: 218,
      w: 330,
      h: 72,
      text: "Express Pay live for\n10% of web merchants",
      color: "#fffde8",
    },
    {
      id: "goal-demo",
      kind: "note",
      x: 420,
      y: 218,
      w: 190,
      h: 72,
      text: "Demo on Oct 9",
      color: "#fffde8",
    },
    {
      id: "risk-wallet",
      kind: "note",
      x: 765,
      y: 218,
      w: 170,
      h: 72,
      text: "Apple Pay domain\nnot verified",
      color: "#fff1f2",
    },
    {
      id: "risk-legal",
      kind: "note",
      x: 950,
      y: 218,
      w: 170,
      h: 72,
      text: "Legal review on\nreceipt copy",
      color: "#fff1f2",
    },
    {
      id: "risk-away",
      kind: "note",
      x: 1135,
      y: 218,
      w: 170,
      h: 72,
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
      x: 35 + lane * 350,
      y: 417,
      w: 270,
      h: 365,
      text,
    });
    cards[lane].forEach((card, i) =>
      shapes.push({
        id: `story-${lane}-${i}`,
        kind: "note",
        x: 67 + lane * 350,
        y: 450 + i * 78,
        w: 200,
        h: 65,
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
function textLines(shape: Shape) {
  return (shape.text || "").split("\n").map((line, i) => (
    <tspan
      key={i}
      x={shape.kind === "text" ? shape.x : shape.x + shape.w / 2}
      dy={i === 0 ? 0 : 21}
    >
      {line}
    </tspan>
  ));
}
function ShapeView({
  shape,
  selected,
  markerId,
  handwritten = true,
}: {
  shape: Shape;
  selected: boolean;
  markerId: string;
  handwritten?: boolean;
}) {
  const s = shape;
  const common = { stroke: ink, strokeWidth: 1.8, fill: "none" };
  const centerY = s.y + s.h / 2 - ((s.text || "").split("\n").length - 1) * 10;
  return (
    <g data-shape={s.id} className={cn("wb-shape", selected && "wb-selected")}>
      {s.kind === "frame" ? (
        <>
          <rect
            x={s.x}
            y={s.y}
            width={s.w}
            height={s.h}
            rx={10}
            fill="none"
            stroke="#b9b9c0"
            strokeWidth={1.5}
          />
          <text
            x={s.x}
            y={s.y - 12}
            fill="#84848a"
            fontFamily="sans-serif"
            fontSize={handwritten ? 16 : 19}
          >
            {s.text}
          </text>
        </>
      ) : s.kind === "note" ? (
        <rect
          x={s.x}
          y={s.y}
          width={s.w}
          height={s.h}
          rx={12}
          fill={s.color || colors[0]}
          stroke={handwritten ? "none" : "#e5e5ed"}
        />
      ) : s.kind === "phone" ? (
        <g transform={`translate(${s.x} ${s.y})`}>
          <rect
            width={s.w}
            height={s.h}
            rx={18}
            fill="#fff"
            stroke="#1c1c1f"
            strokeWidth={1.5}
          />
          <text x={10} y={34} fontSize={10} fontFamily="sans-serif" fill="#222">
            Checkout
          </text>
          <rect x={10} y={46} width={110} height={39} rx={4} fill="#f4f4f5" />
          <rect x={16} y={53} width={24} height={24} rx={3} fill="#dedee0" />
          <rect x={47} y={55} width={49} height={5} rx={2} fill="#a3a3a7" />
          <rect x={47} y={65} width={34} height={4} rx={2} fill="#d5d5d8" />
          <rect x={10} y={91} width={51} height={22} rx={4} fill="#18181b" />
          <rect x={67} y={91} width={53} height={22} rx={4} fill="#18181b" />
          <path d="M10 125H120" stroke="#dedee0" />
          <rect
            x={10}
            y={134}
            width={110}
            height={23}
            rx={4}
            fill="#fff"
            stroke="#bbb"
          />
          <rect
            x={10}
            y={162}
            width={51}
            height={23}
            rx={4}
            fill="#fff"
            stroke="#bbb"
          />
          <rect
            x={67}
            y={162}
            width={53}
            height={23}
            rx={4}
            fill="#fff"
            stroke="#e85a63"
          />
          <path d="M68 191H104" stroke="#e85a63" strokeWidth={3} />
          <rect x={10} y={230} width={110} height={23} rx={6} fill="#18181b" />
          <rect x={45} y={237} width={40} height={5} rx={2} fill="#fff" />
        </g>
      ) : s.kind === "ellipse" ? (
        <ellipse
          cx={s.x + s.w / 2}
          cy={s.y + s.h / 2}
          rx={Math.max(2, s.w / 2)}
          ry={Math.max(2, s.h / 2)}
          {...common}
          fill={s.color || "#fff"}
        />
      ) : s.kind === "diamond" ? (
        <path
          d={`M${s.x + s.w / 2} ${s.y} Q${s.x + s.w / 2 + 5} ${s.y} ${s.x + s.w} ${s.y + s.h / 2} Q${s.x + s.w} ${s.y + s.h / 2 + 5} ${s.x + s.w / 2} ${s.y + s.h} Q${s.x + s.w / 2 - 5} ${s.y + s.h} ${s.x} ${s.y + s.h / 2} Z`}
          {...common}
          fill={s.color || "#fff"}
        />
      ) : s.kind === "rect" ? (
        <rect
          x={s.x}
          y={s.y}
          width={Math.max(2, s.w)}
          height={Math.max(2, s.h)}
          rx={7}
          {...common}
          fill={s.color || "#fff"}
        />
      ) : s.kind === "line" || s.kind === "arrow" ? (
        <path
          d={`M${s.x} ${s.y}L${s.x + s.w} ${s.y + s.h}`}
          {...common}
          markerEnd={s.kind === "arrow" ? `url(#${markerId})` : undefined}
        />
      ) : s.kind === "draw" ? (
        <polyline
          points={s.points}
          {...common}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : s.kind === "image" && s.image ? (
        <image href={s.image} x={s.x} y={s.y} width={s.w} height={s.h} />
      ) : null}
      {s.text && s.kind !== "frame" && (
        <text
          x={s.kind === "text" ? s.x : s.x + s.w / 2}
          y={s.kind === "text" ? s.y + 19 : centerY + 5}
          textAnchor={s.kind === "text" ? "start" : "middle"}
          fill={ink}
          fontFamily={handwritten ? "Kalam,cursive" : "sans-serif"}
          fontSize={s.kind === "text" ? 18 : handwritten ? 17 : 18}
        >
          {textLines(s)}
        </text>
      )}
      {s.owner && (
        <g pointerEvents="none">
          <circle
            cx={s.x + s.w - 8}
            cy={s.y + 8}
            r={15}
            fill={
              s.owner === "Omar"
                ? "#3d6475"
                : s.owner === "Sofia"
                  ? "#597d95"
                  : "#6f5e70"
            }
          />
          <text
            x={s.x + s.w - 8}
            y={s.y + 12}
            textAnchor="middle"
            fill="white"
            fontFamily="sans-serif"
            fontSize={10}
          >
            {s.owner.slice(0, 2).toUpperCase()}
          </text>
        </g>
      )}
      {s.presence && (
        <g pointerEvents="none">
          <rect
            x={s.x - 5}
            y={s.y - 5}
            width={s.w + 10}
            height={s.h + 10}
            rx={7}
            fill="none"
            stroke="#d1a7df"
            strokeDasharray="7 5"
          />
          <text
            x={s.x + 5}
            y={s.y - 13}
            fill="#8c58a3"
            fontFamily="sans-serif"
            fontSize={14}
          >
            ● {s.presence}
          </text>
        </g>
      )}
      {selected && (
        <rect
          x={s.x - 5}
          y={s.y - 5}
          width={Math.max(10, Math.abs(s.w)) + 10}
          height={Math.max(10, Math.abs(s.h)) + 10}
          fill="none"
          stroke="#7761dd"
          strokeWidth={1.8}
          strokeDasharray="5 3"
          pointerEvents="none"
        />
      )}
    </g>
  );
}
export default function Whiteboard({ block }: BlockProps) {
  const sprint = block.id === "whiteboard-2";
  const uid = useId().replaceAll(":", "");
  const pendingPoint = useRef({ x: 150, y: 150 });
  const [scene, setScene] = useState<Scene>(() => ({
    name: sprint ? "Sprint 42 Planning" : "Checkout Review",
    shapes: sprint ? sprintScene() : designScene(),
  }));
  const [past, setPast] = useState<Scene[]>([]);
  const [future, setFuture] = useState<Scene[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(60);
  const [grid, setGrid] = useState(true);
  const [snap, setSnap] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [panel, setPanel] = useState(true);
  const [panelTab, setPanelTab] = useState(sprint ? "plan" : "frames");
  const [frame, setFrame] = useState(0);
  const [wholeBoard, setWholeBoard] = useState(true);
  const [boardQuery, setBoardQuery] = useState("");
  const [versionName, setVersionName] = useState("");
  const [versions, setVersions] = useState<{ name: string; scene: Scene }[]>(
    [],
  );
  const [textDialog, setTextDialog] = useState(false);
  const [text, setText] = useState("");
  const [shapeColor, setShapeColor] = useState(colors[0]);
  const [shareCopied, setShareCopied] = useState(false);
  const [follow, setFollow] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [cardQuery, setCardQuery] = useState("");
  const [decisions, setDecisions] = useState([
    {
      text: "Keep the sprint scope to 26 points.",
      shapeId: "sprint-goal",
      done: false,
    },
    {
      text: "Saved card checkout ships behind a flag.",
      shapeId: "story-0-2",
      done: false,
    },
  ]);
  const [decision, setDecision] = useState("");
  const [dirty, setDirty] = useState(false);
  const [voting, setVoting] = useState(false);
  const [vote, setVote] = useState("5");
  const [revealed, setRevealed] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const image = useRef<HTMLInputElement>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    id?: string;
    original?: Shape;
    scene: Scene;
    pan?: boolean;
  } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const frames = scene.shapes.filter((s) => s.kind === "frame");
  const selectedShape = scene.shapes.find((s) => s.id === selected);
  const laneMeta = [
    { name: "Express Pay", owner: "Omar Farouk", capacity: 13 },
    { name: "Receipts", owner: "Sofia Marino", capacity: 10 },
    { name: "Offline Research", owner: "Emma Lindgren", capacity: 8 },
    { name: "Parked", owner: "", capacity: 0 },
  ];
  const lanePoints = laneMeta.map((_, lane) =>
    scene.shapes
      .filter((shape) => shape.lane === lane)
      .reduce((sum, shape) => sum + (shape.story || 0), 0),
  );
  const committedPoints = lanePoints
    .slice(0, 3)
    .reduce((sum, points) => sum + points, 0);
  function togglePresent() {
    const next = !presenting;
    setPresenting(next);
    setViewOnly(next);
    setSelected(null);
    setTool("select");
    if (next) {
      setFrame(0);
      setZoom(110);
      setPan({ x: -35, y: 40 });
    } else {
      setZoom(60);
      setPan({ x: 0, y: 0 });
    }
  }
  function addLaneCard(lane: number) {
    const id = stamp();
    const count = scene.shapes.filter((shape) => shape.lane === lane).length;
    updateShapes([
      ...scene.shapes,
      {
        id,
        kind: "note",
        x: 67 + lane * 350,
        y: 450 + count * 78,
        w: 200,
        h: 65,
        text: "New story\n3 pts",
        story: 3,
        lane,
        color: ["#eef6ff", "#effbf5", "#f5f0ff", "#fff"][lane],
      },
    ]);
    setSelected(id);
    setText("New story\n3 pts");
    setTextDialog(true);
  }
  function logSelection() {
    if (!selectedShape) {
      toast.info("Select a card on the canvas first.");
      return;
    }
    setDecisions([
      ...decisions,
      {
        text: selectedShape.text?.replaceAll("\n", " · ") || "Canvas decision",
        shapeId: selectedShape.id,
        done: false,
      },
    ]);
    setPanel(true);
    setPanelTab("decisions");
  }
  function commit(next: Scene) {
    setPast((p) => [...p, scene]);
    setFuture([]);
    setScene(next);
    setDirty(false);
  }
  function updateShapes(next: Shape[]) {
    commit({ ...scene, shapes: next });
  }
  function undo() {
    if (!past.length) return;
    setFuture((f) => [scene, ...f]);
    setScene(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
    setSelected(null);
  }
  function redo() {
    if (!future.length) return;
    setPast((p) => [...p, scene]);
    setScene(future[0]);
    setFuture((f) => f.slice(1));
    setSelected(null);
  }
  function position(event: ReactPointerEvent) {
    const point = svg.current!.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.current!.getScreenCTM()!.inverse());
  }
  function pointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    const p = position(event);
    const target = (event.target as Element)
      .closest("[data-shape]")
      ?.getAttribute("data-shape");
    const item = scene.shapes.find((s) => s.id === target);
    if (tool === "hand") {
      gesture.current = {
        x: event.clientX,
        y: event.clientY,
        scene,
        pan: true,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (viewOnly) return;
    if (tool === "eraser") {
      if (target && item?.kind !== "frame")
        updateShapes(scene.shapes.filter((s) => s.id !== target));
      return;
    }
    if (tool === "text") {
      setSelected(null);
      pendingPoint.current = { x: p.x, y: p.y };
      gesture.current = { x: p.x, y: p.y, scene };
      setText("");
      setTextDialog(true);
      return;
    }
    if (tool === "image") {
      pendingPoint.current = { x: p.x, y: p.y };
      gesture.current = { x: p.x, y: p.y, scene };
      image.current?.click();
      return;
    }
    if (tool === "select") {
      setSelected(item?.kind !== "frame" ? target || null : null);
      if (item && item.kind !== "frame") {
        gesture.current = {
          x: p.x,
          y: p.y,
          id: item.id,
          original: { ...item },
          scene,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      return;
    }
    const id = stamp();
    const shape: Shape = {
      id,
      kind: tool,
      x: p.x,
      y: p.y,
      w: 0,
      h: 0,
      color:
        tool === "rect" || tool === "ellipse" || tool === "diamond"
          ? "#fff"
          : undefined,
      points: tool === "draw" ? `${p.x},${p.y}` : undefined,
    };
    setScene({ ...scene, shapes: [...scene.shapes, shape] });
    setSelected(id);
    gesture.current = { x: p.x, y: p.y, id, scene };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const g = gesture.current;
    if (!g) return;
    if (g.pan) {
      const ratio =
        1400 /
        (event.currentTarget.getBoundingClientRect().width * (zoom / 60));
      setPan((p) => ({
        x: p.x - (event.clientX - g.x) * ratio,
        y: p.y - (event.clientY - g.y) * ratio,
      }));
      g.x = event.clientX;
      g.y = event.clientY;
      return;
    }
    if (!g.id) return;
    const p = position(event);
    let dx = p.x - g.x,
      dy = p.y - g.y;
    if (snap) {
      dx = Math.round(dx / 20) * 20;
      dy = Math.round(dy / 20) * 20;
    }
    setScene((current) => ({
      ...current,
      shapes: current.shapes.map((s) =>
        s.id !== g.id
          ? s
          : g.original
            ? { ...g.original, x: g.original.x + dx, y: g.original.y + dy }
            : s.kind === "draw"
              ? {
                  ...s,
                  points: `${s.points} ${p.x},${p.y}`,
                  w: Math.max(s.w, dx),
                  h: Math.max(s.h, dy),
                }
              : {
                  ...s,
                  x: ["arrow", "line"].includes(s.kind)
                    ? g.x
                    : Math.min(g.x, p.x),
                  y: ["arrow", "line"].includes(s.kind)
                    ? g.y
                    : Math.min(g.y, p.y),
                  w: ["arrow", "line"].includes(s.kind) ? dx : Math.abs(dx),
                  h: ["arrow", "line"].includes(s.kind) ? dy : Math.abs(dy),
                },
      ),
    }));
    setDirty(true);
  }
  function pointerUp() {
    const g = gesture.current;
    if (!g || g.pan) {
      gesture.current = null;
      return;
    }
    if (g.id) {
      if (sprint && g.original?.kind === "note")
        setScene((current) => ({
          ...current,
          shapes: current.shapes.map((shape) =>
            shape.id === g.id
              ? {
                  ...shape,
                  lane: Math.max(
                    0,
                    Math.min(3, Math.floor((shape.x + shape.w / 2 - 35) / 350)),
                  ),
                }
              : shape,
          ),
        }));
      setPast((p) => [...p, g.scene]);
      setFuture([]);
      setDirty(false);
    }
    gesture.current = null;
  }
  function selectFrame(i: number) {
    setWholeBoard(false);
    const next = (i + frames.length) % frames.length;
    setFrame(next);
    const s = frames[next];
    if (s) {
      setPan({ x: s.x - 50, y: s.y - (presenting ? 130 : 80) });
      if (presenting)
        setZoom(Math.min(150, Math.round((1400 * 60) / (s.w + 100))));
    }
  }
  function addNote() {
    const id = stamp();
    updateShapes([
      ...scene.shapes,
      {
        id,
        kind: "note",
        x: 120 + Math.random() * 400 + pan.x,
        y: 140 + Math.random() * 250 + pan.y,
        w: 205,
        h: 110,
        text: sprint ? "New task\n\n3 pts · Unassigned" : "Add your idea here",
        color: shapeColor,
        story: sprint ? 3 : undefined,
      },
    ]);
    setSelected(id);
  }
  function template(type: string) {
    const shapes =
      type === "Sprint planning"
        ? sprintScene()
        : type === "Design review"
          ? designScene()
          : [
              {
                id: stamp(),
                kind: "frame" as const,
                x: 50,
                y: 80,
                w: 1200,
                h: 700,
                text: "Untitled frame",
              },
            ];
    commit({ name: type, shapes });
    setPan({ x: 0, y: 0 });
  }
  function saveVersion() {
    setVersions((v) => [
      {
        name: versionName.trim() || `Version ${v.length + 1}`,
        scene: structuredClone(scene),
      },
      ...v,
    ]);
    setVersionName("");
    toast.success("Version saved in this preview");
  }
  function download(
    content: string | Blob,
    name: string,
    type = "application/json",
  ) {
    const url = URL.createObjectURL(
      typeof content === "string" ? new Blob([content], { type }) : content,
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportSvg() {
    const el = svg.current!.cloneNode(true) as SVGSVGElement;
    el.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    el.setAttribute("width", "1400");
    el.setAttribute("height", "1000");
    el.setAttribute("viewBox", "0 0 1400 1000");
    el.style.background = "#fff";
    return new XMLSerializer().serializeToString(el);
  }
  function exportPng() {
    const blob = new Blob([exportSvg()], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1400;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 1400, 1000);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => b && download(b, `${scene.name}.png`), "image/png");
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error("Unable to render PNG. Export SVG instead.");
    };
    img.src = url;
  }
  const tools: { id: Tool; label: string; icon: typeof Square }[] = [
    { id: "hand", label: "Hand", icon: Hand },
    { id: "select", label: "Selection", icon: MousePointer2 },
    { id: "rect", label: "Rectangle", icon: Square },
    { id: "diamond", label: "Diamond", icon: Diamond },
    { id: "ellipse", label: "Ellipse", icon: Circle },
    { id: "arrow", label: "Arrow", icon: ArrowRight },
    { id: "line", label: "Line", icon: Minus },
    { id: "draw", label: "Draw", icon: Pencil },
    { id: "text", label: "Text", icon: Type },
    { id: "image", label: "Image", icon: ImagePlus },
    { id: "eraser", label: "Eraser", icon: Eraser },
  ];
  return (
    <div className="wb-root" data-presenting={presenting}>
      <header className="wb-header">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate text-sm font-semibold">{scene.name}</h2>
          <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
            <Check className="size-3" />
            {dirty ? "Saving…" : "Saved"}
          </span>
          {sprint && (
            <span className="hidden text-xs text-muted-foreground md:inline">
              Sep 28 to Oct 9
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                aria-label="On this board, 3 here, 1 away"
              >
                <span className="flex">
                  {["AM", "PC", "OR"].map((name) => (
                    <Avatar
                      className="-ml-2 size-6 border-2 border-background first:ml-0"
                      key={name}
                    >
                      <AvatarFallback className="text-[8px]">
                        {name}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <h3 className="mb-3 text-sm font-medium">On this board</h3>
              {[
                "Alex Morgan · You",
                "Priya Chen · Editing",
                "Olivia Rhye · Viewing",
                "Noah Williams · Away",
              ].map((p, i) => (
                <div className="flex items-center gap-2 py-2 text-xs" key={p}>
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      i === 3 ? "bg-muted-foreground" : "bg-chart-3",
                    )}
                  />
                  {p}
                </div>
              ))}
              {sprint && (
                <Button
                  className="mt-3 w-full"
                  size="sm"
                  variant={follow ? "secondary" : "outline"}
                  onClick={() => {
                    setFollow(!follow);
                    setPan(follow ? { x: 0, y: 0 } : { x: 350, y: 60 });
                  }}
                >
                  {follow ? "Stop following Priya" : "Follow Priya’s view"}
                </Button>
              )}
              <p className="mt-3 text-[10px] text-muted-foreground">
                Presence is simulated in this local preview.
              </p>
            </PopoverContent>
          </Popover>
          {sprint ? (
            <Button
              variant={presenting ? "secondary" : "outline"}
              size="sm"
              aria-pressed={presenting}
              onClick={togglePresent}
            >
              <Square data-icon="inline-start" />
              Present
            </Button>
          ) : (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm">
                    <Share2 data-icon="inline-start" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <h3 className="mb-3 text-sm font-medium">Share this board</h3>
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span>View only</span>
                    <Switch
                      checked={viewOnly}
                      onCheckedChange={setViewOnly}
                      aria-label="View only sharing"
                    />
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `${location.href}${location.hash.includes("?") ? "&" : "?"}access=view`,
                        );
                        setShareCopied(true);
                      } catch {
                        toast.error("Copy unavailable");
                      }
                    }}
                  >
                    {shareCopied ? (
                      <Check data-icon="inline-start" />
                    ) : (
                      <Share2 data-icon="inline-start" />
                    )}
                    {shareCopied ? "Link copied" : "Copy preview link"}
                  </Button>
                  <p className="mt-3 text-[10px] text-muted-foreground">
                    Local preview link; no permission changes are sent.
                  </p>
                </PopoverContent>
              </Popover>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <ArrowDownToLine data-icon="inline-start" />
                    <span className="hidden sm:inline">Export</span>
                    <ChevronDown data-icon="inline-end" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onSelect={() =>
                        download(
                          exportSvg(),
                          `${scene.name}.svg`,
                          "image/svg+xml",
                        )
                      }
                    >
                      Export SVG
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={exportPng}>
                      Export PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        download(
                          JSON.stringify(scene, null, 2),
                          `${scene.name}.json`,
                        )
                      }
                    >
                      <FileJson />
                      Save board file
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={sprint ? "Planning panel" : "Board panel"}
            aria-pressed={panel}
            onClick={() => setPanel(!panel)}
          >
            <PanelRight />
          </Button>
        </div>
      </header>
      <div className="wb-workspace">
        <div className="wb-canvas-wrap">
          <div className="wb-topbar">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Board menu">
                  <Menu />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => file.current?.click()}>
                    Open board file
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      download(
                        JSON.stringify(scene, null, 2),
                        `${scene.name}.json`,
                      )
                    }
                  >
                    Save board
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      download(
                        exportSvg(),
                        `${scene.name}.svg`,
                        "image/svg+xml",
                      )
                    }
                  >
                    Export SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={exportPng}>
                    Export PNG
                  </DropdownMenuItem>
                  {sprint && (
                    <DropdownMenuItem
                      onSelect={async () => {
                        const summary = `# ${scene.name}\n\n${laneMeta
                          .map(
                            (lane, index) =>
                              `## ${lane.name} (${lanePoints[index]} pts)\n${scene.shapes
                                .filter((shape) => shape.lane === index)
                                .map(
                                  (shape) =>
                                    `- ${shape.text?.replaceAll("\n", " · ")}`,
                                )
                                .join("\n")}`,
                          )
                          .join("\n\n")}`;
                        try {
                          await navigator.clipboard.writeText(summary);
                          toast.success("Plan copied as Markdown");
                        } catch {
                          download(summary, "sprint-plan.md", "text/markdown");
                        }
                      }}
                    >
                      Copy plan as Markdown
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onSelect={() => {
                      setPanel(true);
                      setPanelTab("templates");
                    }}
                  >
                    Templates
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      commit({ ...scene, shapes: [] });
                      setSelected(null);
                    }}
                    disabled={viewOnly}
                  >
                    Clear canvas
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {presenting ? (
              <div className="flex items-center gap-3 rounded-lg border px-3 py-1 text-xs">
                <span>
                  Presenting · {frames[frame]?.text}, {frame + 1} of{" "}
                  {frames.length}
                </span>
                <Button size="xs" variant="ghost" onClick={togglePresent}>
                  End
                </Button>
              </div>
            ) : (
              <ToggleGroup
                type="single"
                value={tool}
                onValueChange={(value) => value && setTool(value as Tool)}
                className="wb-tools"
                aria-label="Drawing tools"
              >
                {tools.map(({ id, label, icon: Icon }) => (
                  <ToggleGroupItem
                    value={id}
                    key={id}
                    aria-label={label}
                    title={label}
                    disabled={viewOnly && id !== "hand" && id !== "select"}
                  >
                    <Icon />
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
            {sprint ? (
              <div className="flex gap-1 rounded-lg">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Estimate together"
                  disabled={viewOnly}
                  onClick={() => {
                    if (!selectedShape?.story) {
                      toast.info("Select a story card first.");
                      return;
                    }
                    setVote(String(selectedShape.story));
                    setRevealed(false);
                    setVoting(true);
                  }}
                >
                  <Avatar className="size-4">
                    <AvatarFallback className="text-[7px]">5</AvatarFallback>
                  </Avatar>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Add to log"
                  disabled={viewOnly}
                  onClick={logSelection}
                >
                  <Pencil />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="icon"
                aria-label="Shape library"
                onClick={() => {
                  setPanel(true);
                  setPanelTab("library");
                }}
              >
                <Library />
              </Button>
            )}
          </div>
          <svg
            ref={svg}
            className={cn(
              "wb-canvas",
              tool === "hand" && "wb-hand",
              viewOnly && "wb-view-only",
            )}
            viewBox={`${pan.x} ${pan.y} ${(1400 * 60) / zoom} ${(940 * 60) / zoom}`}
            preserveAspectRatio="xMinYMin meet"
            role="application"
            aria-label={`${scene.name} drawing canvas`}
            tabIndex={0}
            onKeyDown={(event) => {
              if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === "z"
              ) {
                event.preventDefault();
                if (!viewOnly) {
                  if (event.shiftKey) redo();
                  else undo();
                }
              } else if (event.key === "Escape") setSelected(null);
              else if (
                !viewOnly &&
                selected &&
                ["Delete", "Backspace"].includes(event.key)
              ) {
                event.preventDefault();
                updateShapes(
                  scene.shapes.filter((shape) => shape.id !== selected),
                );
                setSelected(null);
              } else if (
                !viewOnly &&
                selected &&
                ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                  event.key,
                )
              ) {
                event.preventDefault();
                const amount = event.shiftKey ? 10 : 1;
                updateShapes(
                  scene.shapes.map((shape) =>
                    shape.id === selected
                      ? {
                          ...shape,
                          x:
                            shape.x +
                            (event.key === "ArrowRight"
                              ? amount
                              : event.key === "ArrowLeft"
                                ? -amount
                                : 0),
                          y:
                            shape.y +
                            (event.key === "ArrowDown"
                              ? amount
                              : event.key === "ArrowUp"
                                ? -amount
                                : 0),
                        }
                      : shape,
                  ),
                );
              }
            }}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
            onDoubleClick={(event) => {
              const id = (event.target as Element)
                .closest("[data-shape]")
                ?.getAttribute("data-shape");
              if (id && !viewOnly) {
                setSelected(id);
                setText(scene.shapes.find((s) => s.id === id)?.text || "");
                setTextDialog(true);
              }
            }}
          >
            <defs>
              <pattern
                id={`${uid}-grid`}
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M20 0H0V20"
                  fill="none"
                  stroke="#ebebef"
                  strokeWidth=".8"
                />
              </pattern>
              <marker
                id={`${uid}-arrow`}
                markerWidth="8"
                markerHeight="8"
                refX="6.5"
                refY="4"
                orient="auto"
              >
                <path
                  d="M1 1L7 4L1 7"
                  fill="none"
                  stroke={ink}
                  strokeWidth="1.2"
                />
              </marker>
            </defs>
            <rect
              x={-10000}
              y={-10000}
              width={20000}
              height={20000}
              fill={grid ? `url(#${uid}-grid)` : "#fff"}
            />
            {scene.shapes.map((shape) => (
              <g
                key={shape.id}
                opacity={
                  presenting &&
                  frames[frame] &&
                  !(
                    shape.id === frames[frame].id ||
                    (shape.x >= frames[frame].x &&
                      shape.x < frames[frame].x + frames[frame].w &&
                      shape.y >= frames[frame].y &&
                      shape.y < frames[frame].y + frames[frame].h)
                  )
                    ? 0.14
                    : 1
                }
              >
                <ShapeView
                  shape={
                    sprint &&
                    shape.kind === "frame" &&
                    shape.id.startsWith("lane")
                      ? {
                          ...shape,
                          text: `${shape.text?.split("  ·  ")[0]} · ${scene.shapes.filter((item) => item.kind === "note" && item.lane === Number(shape.id.slice(4))).reduce((sum, item) => sum + (item.story || 0), 0)} pts`,
                        }
                      : shape
                  }
                  markerId={`${uid}-arrow`}
                  handwritten={!sprint}
                  selected={selected === shape.id}
                />
              </g>
            ))}
          </svg>
          {selectedShape && !viewOnly && (
            <div className="wb-selection">
              <span className="text-[10px] text-muted-foreground">
                {selectedShape.kind}
              </span>
              <div className="flex gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    className="size-5 rounded-full border"
                    style={{ background: color }}
                    aria-label={`Use color ${color}`}
                    onClick={() => {
                      setShapeColor(color);
                      updateShapes(
                        scene.shapes.map((s) =>
                          s.id === selected ? { ...s, color } : s,
                        ),
                      );
                    }}
                  />
                ))}
              </div>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setText(selectedShape.text || "");
                  setTextDialog(true);
                }}
              >
                Edit text
              </Button>
              {sprint && selectedShape.story !== undefined && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    setVote(String(selectedShape.story));
                    setRevealed(false);
                    setVoting(true);
                  }}
                >
                  Estimate
                </Button>
              )}
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Delete selected shape"
                onClick={() => {
                  updateShapes(scene.shapes.filter((s) => s.id !== selected));
                  setSelected(null);
                }}
              >
                <X />
              </Button>
            </div>
          )}
          <div className="wb-bottom">
            <div className="wb-bottom-group">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Zoom out"
                onClick={() => setZoom(Math.max(20, zoom - 10))}
              >
                <Minus />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setZoom(60);
                  setPan({ x: 0, y: 0 });
                }}
              >
                {zoom}%
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Zoom in"
                onClick={() => setZoom(Math.min(180, zoom + 10))}
              >
                <Plus />
              </Button>
            </div>
            <div className="wb-bottom-group">
              <Button
                size="icon-sm"
                variant={grid ? "secondary" : "ghost"}
                aria-label="Toggle grid"
                aria-pressed={grid}
                onClick={() => setGrid(!grid)}
              >
                <Grid2X2 />
              </Button>
              <Button
                size="icon-sm"
                variant={snap ? "secondary" : "ghost"}
                aria-label="Snap to grid"
                aria-pressed={snap}
                onClick={() => setSnap(!snap)}
              >
                <MousePointer2 />
              </Button>
              <Button
                size="icon-sm"
                variant={viewOnly ? "secondary" : "ghost"}
                aria-label="View only"
                aria-pressed={viewOnly}
                onClick={() => setViewOnly(!viewOnly)}
              >
                <LockKeyhole />
              </Button>
            </div>
            <div className="wb-bottom-group">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Undo"
                disabled={!past.length}
                onClick={undo}
              >
                <Undo2 />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Redo"
                disabled={!future.length}
                onClick={redo}
              >
                <Redo2 />
              </Button>
            </div>
            <div className="wb-bottom-group ml-auto">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Previous frame"
                disabled={!frames.length}
                onClick={() => selectFrame(frame - 1)}
              >
                <ArrowLeft />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="Choose a frame">
                    {presenting
                      ? frames[frame]?.text
                      : `${frames.length} frames`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    {frames.map((item, index) => (
                      <DropdownMenuItem
                        key={item.id}
                        onSelect={() => selectFrame(index)}
                      >
                        {item.text}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Next frame"
                disabled={!frames.length}
                onClick={() => selectFrame(frame + 1)}
              >
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
        {panel && (
          <aside className="wb-panel">
            <Tabs
              value={panelTab}
              onValueChange={setPanelTab}
              className="gap-0"
            >
              <TabsList
                className={cn(
                  "mx-3 mt-3 flex flex-wrap h-auto",
                  "w-[calc(100%-24px)]",
                )}
              >
                {sprint ? (
                  <>
                    <TabsTrigger value="plan" className="flex-1">
                      Plan
                    </TabsTrigger>
                    <TabsTrigger value="decisions" className="flex-1">
                      Log
                    </TabsTrigger>
                  </>
                ) : (
                  <>
                    <TabsTrigger value="frames">Frames</TabsTrigger>
                    <TabsTrigger value="library">Library</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </>
                )}
              </TabsList>
              <TabsContent value="plan" className="wb-panel-body">
                <Input
                  placeholder="Find a card"
                  aria-label="Find a card"
                  value={cardQuery}
                  onChange={(event) => setCardQuery(event.target.value)}
                />
                <div className="my-4 px-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Committed</span>
                    <strong>{committedPoints} of 31 pts</strong>
                  </div>
                  <div
                    className="my-2 h-1 rounded-full bg-muted"
                    role="progressbar"
                    aria-label="Committed points"
                    aria-valuenow={committedPoints}
                    aria-valuemax={31}
                  >
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{
                        width: `${Math.min(100, (committedPoints / 31) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {lanePoints[3]} pts parked
                  </p>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">Lanes</p>
                {laneMeta.map((lane, index) => (
                  <div className="mb-1" key={lane.name}>
                    <div className="flex items-center gap-2">
                      <Button
                        className="min-w-0 flex-1 justify-start h-auto py-2 text-left"
                        variant="ghost"
                        onClick={() => selectFrame(index + 2)}
                      >
                        <Square className="mr-1 size-4 shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-sm font-normal">
                            {lane.name}
                          </span>
                          <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
                            {lane.owner
                              ? `${lane.owner} · ${lanePoints[index]} of ${lane.capacity} pts`
                              : `${scene.shapes.filter((shape) => shape.lane === index).length} cards · ${lanePoints[index]} pts`}
                          </span>
                        </span>
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label={`Add a card to ${lane.name}`}
                        disabled={viewOnly}
                        onClick={() => addLaneCard(index)}
                      >
                        <Plus />
                      </Button>
                    </div>
                    {cardQuery &&
                      scene.shapes
                        .filter(
                          (shape) =>
                            shape.lane === index &&
                            shape.text
                              ?.toLowerCase()
                              .includes(cardQuery.toLowerCase()),
                        )
                        .map((shape) => (
                          <Button
                            key={shape.id}
                            variant="outline"
                            size="sm"
                            className="mb-2 w-full justify-start text-xs"
                            onClick={() => {
                              setSelected(shape.id);
                              selectFrame(index + 2);
                            }}
                          >
                            {shape.text?.split("\n")[0]}
                          </Button>
                        ))}
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="frames" className="wb-panel-body">
                <Input
                  aria-label="Search board"
                  placeholder="Search board"
                  value={boardQuery}
                  onChange={(event) => setBoardQuery(event.target.value)}
                  className="mb-3"
                />
                <Button
                  variant={wholeBoard ? "secondary" : "ghost"}
                  className="mb-2 h-auto w-full justify-start py-3"
                  onClick={() => {
                    setWholeBoard(true);
                    setPan({ x: 0, y: 0 });
                    setZoom(60);
                  }}
                >
                  <Grid2X2 data-icon="inline-start" />
                  <span className="text-left">
                    <span className="block text-xs font-medium">
                      Whole Board
                    </span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {frames.length} frames ·{" "}
                      {
                        scene.shapes.filter((shape) => shape.kind !== "frame")
                          .length
                      }{" "}
                      items
                    </span>
                  </span>
                </Button>
                {frames
                  .filter((shape) =>
                    shape.text
                      ?.toLowerCase()
                      .includes(boardQuery.toLowerCase()),
                  )
                  .map((s) => {
                    const i = frames.indexOf(s);
                    return (
                      <Button
                        key={s.id}
                        variant={
                          !wholeBoard && i === frame ? "secondary" : "ghost"
                        }
                        className="mb-2 h-auto w-full justify-start py-3"
                        onClick={() => selectFrame(i)}
                      >
                        <Square data-icon="inline-start" />
                        <span className="text-left">
                          <span className="block text-xs font-medium">
                            {s.text}
                          </span>
                          <span className="text-[10px] font-normal text-muted-foreground">
                            {
                              scene.shapes.filter(
                                (shape) =>
                                  shape.kind !== "frame" &&
                                  shape.x >= s.x &&
                                  shape.x < s.x + s.w &&
                                  shape.y >= s.y &&
                                  shape.y < s.y + s.h,
                              ).length
                            }{" "}
                            items
                          </span>
                        </span>
                      </Button>
                    );
                  })}
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  Choose a frame to navigate. Drag with the hand tool to move
                  around the canvas.
                </p>
              </TabsContent>
              <TabsContent value="templates" className="wb-panel-body">
                {["Design review", "Sprint planning", "Blank canvas"].map(
                  (name) => (
                    <Button
                      className="mb-3 w-full justify-start"
                      key={name}
                      variant="outline"
                      onClick={() => template(name)}
                    >
                      <Grid2X2 data-icon="inline-start" />
                      {name}
                    </Button>
                  ),
                )}
              </TabsContent>
              <TabsContent value="history" className="wb-panel-body">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="wb-version">Save a version</FieldLabel>
                    <Input
                      id="wb-version"
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                      placeholder="Before review"
                    />
                    <Button size="sm" onClick={saveVersion}>
                      Save snapshot
                    </Button>
                  </Field>
                </FieldGroup>
                {versions.map((v, i) => (
                  <div className="mt-4 rounded-lg border p-3" key={i}>
                    <p className="mb-2 text-xs font-medium">{v.name}</p>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => commit(structuredClone(v.scene))}
                    >
                      Restore version
                    </Button>
                  </div>
                ))}
                {!versions.length && (
                  <p className="mt-6 text-xs text-muted-foreground">
                    No saved versions yet.
                  </p>
                )}
              </TabsContent>
              <TabsContent value="library" className="wb-panel-body">
                <p className="mb-4 text-xs text-muted-foreground">
                  Reusable shapes for your next idea.
                </p>
                <Button variant="outline" className="w-full" onClick={addNote}>
                  <Plus data-icon="inline-start" />
                  Add sticky note
                </Button>
                <Button
                  className="mt-3 w-full"
                  variant="outline"
                  disabled={!selectedShape}
                  onClick={() => {
                    if (selectedShape)
                      updateShapes([
                        ...scene.shapes,
                        {
                          ...selectedShape,
                          id: stamp(),
                          x: selectedShape.x + 40,
                          y: selectedShape.y + 40,
                        },
                      ]);
                  }}
                >
                  Duplicate selection
                </Button>
              </TabsContent>
              <TabsContent value="decisions" className="wb-panel-body">
                {decisions.map((entry, index) => (
                  <div
                    className="mb-3 rounded-lg border p-3 text-xs"
                    key={`${index}-${entry.shapeId}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <button
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const shape = scene.shapes.find(
                            (item) => item.id === entry.shapeId,
                          );
                          if (shape) {
                            setSelected(shape.id);
                            setPan({ x: shape.x - 150, y: shape.y - 180 });
                          }
                        }}
                      >
                        ↗ Linked to canvas
                      </button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label={`Remove decision ${index + 1}`}
                        onClick={() =>
                          setDecisions(decisions.filter((_, i) => i !== index))
                        }
                      >
                        <X />
                      </Button>
                    </div>
                    <p
                      className={cn(
                        "leading-5",
                        entry.done && "line-through text-muted-foreground",
                      )}
                    >
                      {entry.text}
                    </p>
                    <Button
                      className="mt-2"
                      size="xs"
                      variant="ghost"
                      aria-pressed={entry.done}
                      onClick={() =>
                        setDecisions(
                          decisions.map((item, i) =>
                            i === index ? { ...item, done: !item.done } : item,
                          ),
                        )
                      }
                    >
                      <Check data-icon="inline-start" />
                      {entry.done ? "Done" : "Mark done"}
                    </Button>
                  </div>
                ))}
                <Input
                  aria-label="New decision"
                  placeholder="Record a decision…"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                />
                <Button
                  className="mt-3 w-full"
                  size="sm"
                  disabled={!decision.trim()}
                  onClick={() => {
                    setDecisions([
                      ...decisions,
                      {
                        text: decision,
                        shapeId: selected || "sprint-goal",
                        done: false,
                      },
                    ]);
                    setDecision("");
                  }}
                >
                  Add decision
                </Button>
              </TabsContent>
            </Tabs>
          </aside>
        )}
      </div>
      <Dialog open={voting} onOpenChange={setVoting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planning poker</DialogTitle>
            <DialogDescription>
              {selectedShape?.text?.split("\n")[0] || "Estimate this story"} ·
              Choose story points, then reveal the local ballots.
            </DialogDescription>
          </DialogHeader>
          <ToggleGroup
            type="single"
            value={vote}
            onValueChange={(value) => value && setVote(value)}
            aria-label="Story point estimate"
          >
            {["1", "2", "3", "5", "8", "13"].map((points) => (
              <ToggleGroupItem key={points} value={points}>
                {points}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {revealed && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: "You", value: vote },
                { name: "Omar", value: "5" },
                { name: "Sofia", value: "3" },
                { name: "Priya", value: "5" },
              ].map((ballot) => (
                <div
                  className="rounded-lg border p-3 text-center"
                  key={ballot.name}
                >
                  <p className="text-xl font-semibold">{ballot.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ballot.name}
                  </p>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Other ballots are seeded demo values. No network session is
            connected.
          </p>
          <Button
            onClick={() => {
              if (!revealed) setRevealed(true);
              else {
                updateShapes(
                  scene.shapes.map((shape) =>
                    shape.id === selected
                      ? {
                          ...shape,
                          story: Number(vote),
                          text: shape.text?.replace(/\d+ pts/, `${vote} pts`),
                        }
                      : shape,
                  ),
                );
                setVoting(false);
                setRevealed(false);
              }
            }}
          >
            {revealed ? `Use ${vote} points` : "Reveal votes"}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={textDialog} onOpenChange={setTextDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected ? "Edit shape text" : "Add text to the board"}
            </DialogTitle>
            <DialogDescription>
              Use a line break to create a new line.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            aria-label="Shape text"
            className="min-h-24 rounded-lg border bg-background p-3 text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <Button
            onClick={() => {
              if (selected)
                updateShapes(
                  scene.shapes.map((s) =>
                    s.id === selected ? { ...s, text } : s,
                  ),
                );
              else {
                const p = pendingPoint.current;
                updateShapes([
                  ...scene.shapes,
                  {
                    id: stamp(),
                    kind: "text",
                    x: p.x,
                    y: p.y,
                    w: 280,
                    h: 60,
                    text,
                  },
                ]);
              }
              setTextDialog(false);
              gesture.current = null;
            }}
          >
            Save text
          </Button>
        </DialogContent>
      </Dialog>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const parsed = JSON.parse(await f.text());
            if (
              !Array.isArray(parsed.shapes) ||
              typeof parsed.name !== "string"
            )
              throw new Error();
            commit(parsed);
            setPan({ x: 0, y: 0 });
            toast.success("Board opened");
          } catch {
            toast.error("Choose a board JSON file exported from this preview");
          }
          e.target.value = "";
        }}
      />
      <input
        ref={image}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            const p = pendingPoint.current;
            updateShapes([
              ...scene.shapes,
              {
                id: stamp(),
                kind: "image",
                x: p.x,
                y: p.y,
                w: 300,
                h: 200,
                image: String(reader.result),
              },
            ]);
            gesture.current = null;
          };
          reader.readAsDataURL(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
