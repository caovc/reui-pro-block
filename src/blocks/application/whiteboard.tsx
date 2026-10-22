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
import { Badge } from "@/components/ui/badge";
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
  kind: Tool | "note" | "frame";
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
};
type Scene = { shapes: Shape[]; name: string };
const ink = "#34343a",
  colors = ["#fff0a5", "#c4f3ce", "#c8ddff", "#f8cbcd", "#e6d9ff"];
const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
function designScene(): Shape[] {
  const shapes: Shape[] = [
    { id: "goals", kind: "frame", x: 30, y: 85, w: 260, h: 280, text: "Goals" },
    {
      id: "flow",
      kind: "frame",
      x: 370,
      y: 85,
      w: 960,
      h: 330,
      text: "User Flow",
    },
    {
      id: "checkout",
      kind: "frame",
      x: 30,
      y: 490,
      w: 720,
      h: 430,
      text: "Checkout v2",
    },
    {
      id: "questions",
      kind: "frame",
      x: 820,
      y: 490,
      w: 510,
      h: 215,
      text: "Open Questions",
    },
    {
      id: "decisions",
      kind: "frame",
      x: 820,
      y: 760,
      w: 510,
      h: 160,
      text: "Decisions",
    },
  ];
  [
    "Mobile: 38% quit\nat the payment step",
    "Goal: 30% payment\ndrop off by Q4",
    "No new PCI scope.\nMetric owner: Priya",
  ].forEach((text, i) =>
    shapes.push({
      id: `goal${i}`,
      kind: "note",
      x: 63,
      y: 118 + i * 73,
      w: 195,
      h: 60,
      text,
      color: colors[i],
    }),
  );
  const nodes = [
    { x: 405, y: 145, w: 100, h: 48, text: "Cart", kind: "rect" },
    { x: 580, y: 145, w: 100, h: 48, text: "Shipping", kind: "rect" },
    { x: 755, y: 122, w: 115, h: 94, text: "Saved\ncard?", kind: "diamond" },
    { x: 950, y: 145, w: 100, h: 48, text: "Review", kind: "rect" },
    { x: 1215, y: 145, w: 95, h: 48, text: "Done", kind: "rect" },
    { x: 765, y: 305, w: 100, h: 48, text: "Add card", kind: "rect" },
  ];
  nodes.forEach((n, i) =>
    shapes.push({ ...n, id: `node${i}`, kind: n.kind as Tool }),
  );
  [
    [510, 170, 65, 0],
    [685, 170, 62, 0],
    [875, 170, 65, 0],
    [1058, 170, 145, 0],
    [812, 220, 0, 75],
    [872, 330, 128, 0],
    [1000, 320, 0, -114],
  ].forEach(([x, y, w, h], i) =>
    shapes.push({ id: `arrow${i}`, kind: "arrow", x, y, w, h }),
  );
  shapes.push(
    { id: "no", kind: "text", x: 830, y: 245, w: 60, h: 25, text: "No" },
    { id: "yes", kind: "text", x: 895, y: 147, w: 42, h: 23, text: "Yes" },
    { id: "pay", kind: "text", x: 1120, y: 147, w: 50, h: 23, text: "Pay" },
    {
      id: "exits",
      kind: "note",
      x: 405,
      y: 300,
      w: 185,
      h: 62,
      text: "Most exits happen\non the card form",
      color: colors[3],
    },
    {
      id: "audience",
      kind: "text",
      x: 405,
      y: 380,
      w: 370,
      h: 30,
      text: "Mobile web, signed in shoppers",
    },
  );
  shapes.push(
    { id: "screen", kind: "rect", x: 90, y: 540, w: 335, h: 315, text: "" },
    {
      id: "screen-title",
      kind: "text",
      x: 118,
      y: 570,
      w: 250,
      h: 35,
      text: "Complete your order",
    },
    {
      id: "screen-input1",
      kind: "rect",
      x: 118,
      y: 628,
      w: 278,
      h: 42,
      text: "Card number",
    },
    {
      id: "screen-input2",
      kind: "rect",
      x: 118,
      y: 692,
      w: 130,
      h: 42,
      text: "MM / YY",
    },
    {
      id: "screen-input3",
      kind: "rect",
      x: 268,
      y: 692,
      w: 128,
      h: 42,
      text: "CVV",
    },
    {
      id: "screen-button",
      kind: "note",
      x: 118,
      y: 775,
      w: 278,
      h: 44,
      text: "Pay $149.00",
      color: colors[1],
    },
    {
      id: "payment-note",
      kind: "note",
      x: 475,
      y: 590,
      w: 220,
      h: 110,
      text: "Keep the summary visible.\nDefault to saved card.\nAllow guest checkout.",
      color: colors[0],
    },
    {
      id: "question-note",
      kind: "note",
      x: 860,
      y: 540,
      w: 420,
      h: 110,
      text: "Can we remove the billing address?\nWhich wallets matter for mobile?\nHow do we measure recovery?",
      color: colors[4],
    },
    {
      id: "decision-note",
      kind: "note",
      x: 860,
      y: 800,
      w: 420,
      h: 75,
      text: "Ship saved card first.\nReview results after two weeks.",
      color: colors[1],
    },
  );
  return shapes;
}
function sprintScene(): Shape[] {
  const shapes: Shape[] = [];
  const lanes = ["Backlog", "This sprint", "In progress", "Ready for review"];
  lanes.forEach((text, i) =>
    shapes.push({
      id: `lane${i}`,
      kind: "frame",
      x: 30 + i * 340,
      y: 115,
      w: 310,
      h: 690,
      text: `${text}  ·  ${[18, 13, 8, 5][i]} pts`,
    }),
  );
  const cards = [
    [
      "Improve the empty state",
      "Add project templates",
      "Review accessibility",
    ],
    ["Saved card checkout", "Invite teammates", "Reduce dashboard load"],
    ["Mobile navigation", "Payment validation"],
    ["Release checklist", "Update API docs"],
  ];
  cards.forEach((items, lane) =>
    items.forEach((text, j) =>
      shapes.push({
        id: `story-${lane}-${j}`,
        kind: "note",
        x: 52 + lane * 340,
        y: 155 + j * 145,
        w: 266,
        h: 120,
        text: `${text}\n\n${[3, 5, 2][j % 3]} pts  ·  ${["Priya", "Alex", "Olivia"][j % 3]}`,
        color: colors[(lane + j) % 5],
        lane,
        story: [3, 5, 2][j % 3],
      }),
    ),
  );
  shapes.push(
    {
      id: "sprint-heading",
      kind: "text",
      x: 35,
      y: 35,
      w: 600,
      h: 42,
      text: "Sprint 24  /  19–30 October",
    },
    {
      id: "sprint-goal",
      kind: "text",
      x: 740,
      y: 40,
      w: 520,
      h: 34,
      text: "Goal: make checkout feel effortless",
    },
  );
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
}: {
  shape: Shape;
  selected: boolean;
  markerId: string;
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
            fontSize={16}
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
        />
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
          fontFamily="Kalam,cursive"
          fontSize={s.kind === "text" ? 18 : 17}
        >
          {textLines(s)}
        </text>
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
    name: sprint ? "Sprint Planning" : "Checkout Review",
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
  const [panel, setPanel] = useState(false);
  const [panelTab, setPanelTab] = useState("frames");
  const [frame, setFrame] = useState(0);
  const [versionName, setVersionName] = useState("");
  const [versions, setVersions] = useState<{ name: string; scene: Scene }[]>(
    [],
  );
  const [textDialog, setTextDialog] = useState(false);
  const [text, setText] = useState("");
  const [shapeColor, setShapeColor] = useState(colors[0]);
  const [shareCopied, setShareCopied] = useState(false);
  const [follow, setFollow] = useState(false);
  const [decisions, setDecisions] = useState([
    "Keep the sprint scope to 26 points.",
    "Saved card checkout ships behind a flag.",
  ]);
  const [decision, setDecision] = useState("");
  const [dirty, setDirty] = useState(false);
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
                    Math.min(3, Math.floor((shape.x + shape.w / 2 - 30) / 340)),
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
    const next = (i + frames.length) % frames.length;
    setFrame(next);
    const s = frames[next];
    if (s) setPan({ x: Math.max(0, s.x - 50), y: Math.max(0, s.y - 80) });
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
    <div className="wb-root">
      <header className="wb-header">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate text-sm font-semibold">{scene.name}</h2>
          <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
            <Check className="size-3" />
            {dirty ? "Saving…" : "Saved"}
          </span>
          {sprint && (
            <Badge variant="outline" className="hidden md:inline-flex">
              Sprint 24
            </Badge>
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
                    download(exportSvg(), `${scene.name}.svg`, "image/svg+xml")
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
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Board panel"
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
          </div>
          <svg
            ref={svg}
            className={cn(
              "wb-canvas",
              tool === "hand" && "wb-hand",
              viewOnly && "wb-view-only",
            )}
            viewBox={`${pan.x} ${pan.y} ${(1400 * 60) / zoom} ${(1000 * 60) / zoom}`}
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
              <ShapeView
                key={shape.id}
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
                selected={selected === shape.id}
              />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPanel(true);
                  setPanelTab("frames");
                }}
              >
                {frames.length} frames
              </Button>
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
          {sprint && (
            <div className="wb-capacity">
              <Badge variant="outline">
                {scene.shapes
                  .filter((s) => s.kind === "note")
                  .reduce((n, s) => n + (s.story || 0), 0)}{" "}
                / 40 points
              </Badge>
              <span>
                {follow
                  ? "Following Priya"
                  : "Drag stories between capacity lanes"}
              </span>
            </div>
          )}
        </div>
        {panel && (
          <aside className="wb-panel">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-xs font-medium">Board panel</h3>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Close board panel"
                onClick={() => setPanel(false)}
              >
                <X />
              </Button>
            </div>
            <Tabs
              value={panelTab}
              onValueChange={setPanelTab}
              className="gap-0"
            >
              <TabsList className="mx-3 mt-3 flex flex-wrap h-auto">
                <TabsTrigger value="frames">Frames</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="library">Library</TabsTrigger>
                {sprint && (
                  <TabsTrigger value="decisions">Decisions</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="frames" className="wb-panel-body">
                {frames.map((s, i) => (
                  <Button
                    key={s.id}
                    variant={i === frame ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => selectFrame(i)}
                  >
                    <Square data-icon="inline-start" />
                    {s.text}
                  </Button>
                ))}
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
                {decisions.map((d, i) => (
                  <div className="mb-3 rounded-lg border p-3 text-xs" key={i}>
                    <span className="mb-1 block text-[10px] text-muted-foreground">
                      Decision {i + 1}
                    </span>
                    {d}
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
                    setDecisions([...decisions, decision]);
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
