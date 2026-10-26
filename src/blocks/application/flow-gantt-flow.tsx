import {
  ReactFlow,
  ReactFlowProvider,
  ViewportPortal,
  NodeToolbar,
  Background,
  MiniMap,
  MarkerType,
  Handle,
  Position,
  BaseEdge,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeProps,
  type EdgeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FlowFidelityNode } from "./flow-fidelity-node";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { MiniAvatar } from "./flow-gantt-avatars";
import { FGSelect } from "./flow-gantt-select";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  ChevronDown,
  CircleHelp,
  CirclePause,
  Copy,
  Download,
  Eye,
  GitBranch,
  Target,
  LayoutGrid,
  Workflow,
  TriangleAlert,
  Hand,
  LockKeyhole,
  Maximize2,
  Minus,
  MoreHorizontal,
  MousePointer2,
  Pause,
  Pencil,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Square,
  Trash2,
  Undo2,
  UnlockKeyhole,
  X,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { seed, graphTitles } from "./flow-gantt-data";
import type { FlowNode, RunState } from "./flow-gantt-data";
import { BrandIcon, RunIcon } from "./flow-gantt-brand";
import type { BlockProps } from "@/data/types";
import "./flow-gantt-refined.css";
import "./flow-fidelity-round2.css";
type Node = FlowNode & {
  kind?: "attachment";
  app?: string;
  category?: string;
  goal?: string;
  aggregation?: string;
  unit?: string;
  better?: string;
  params?: Record<string, string>;
};
type Edge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  correlation?: string;
  attachment?: boolean;
};
type Graph = { nodes: Node[]; edges: Edge[] };
type View = { x: number; y: number; zoom: number };
const owners = ["Ines Marchetti", "Tomas Lindqvist", "Hanna Berg"];
const statusClass = (s: RunState) =>
  s === "Succeeded"
    ? "fg-success"
    : s === "Failed"
      ? "fg-failed"
      : s === "Waiting"
        ? "fg-waiting"
        : s === "Running"
          ? "fg-running"
          : "";
function initialGraph(v: number): Graph {
  const nodes: Node[] = seed(v);
  if (v === 0) {
    const p: Record<string, [number, number, string]> = {
      form: [0, 160, "Webhook"],
      condition: [300, 160, "Condition"],
      enrich: [600, 40, "Data"],
      notify: [600, 280, "Email"],
      deal: [900, 40, "Action"],
    };
    nodes.forEach((n) => {
      [n.x, n.y, n.category] = p[n.id];
    });
  }
  if (v === 1) {
    const p: Record<string, [number, number, string]> = {
      trigger: [320, 0, "Stripe"],
      query: [320, 143, "Neon"],
      model: [320, 286, "Claude"],
      guard: [0, 429, "Custom Code"],
      plan: [320, 429, "Stripe"],
      dispute: [640, 429, "Stripe"],
      slack: [0, 572, "Slack"],
      email: [320, 572, "Resend"],
      assign: [640, 572, "ClickUp"],
    };
    nodes.forEach((n) => {
      [n.x, n.y, n.app] = p[n.id];
    });
  }
  if (v === 2) {
    const p: Record<string, [number, number, string]> = {
      nightly: [0, 196, "Schedule"],
      stripe: [164, 40, "Stripe"],
      paypal: [164, 352, "PayPal"],
      dedupe: [328, 196, "Redis"],
      reconcile: [600, 40, "Ledger"],
      invoices: [840, 40, "Receipt"],
      publish: [536, 352, "Google Cloud"],
      notify: [840, 352, "Slack"],
    };
    nodes.forEach((n) => {
      [n.x, n.y, n.app] = p[n.id];
      n.params =
        n.id === "publish"
          ? { currency: "USD", approver: "finance-lead" }
          : n.id === "reconcile"
            ? { tolerance: "0.01", halt_on_mismatch: "true" }
            : { batch_size: "5000" };
    });
    for (const [id, title, detail, x, y, parent, app] of [
      ["conn-stripe", "stripe_prod", "Connection", 172, 204, "stripe", "Database"],
      ["conn-paypal", "paypal_eu", "Connection", 172, 516, "paypal", "Database"],
      ["test-charge", "unique_charge", "Test", 336, 360, "dedupe", "Check"],
      ["model-ledger", "ledger_v3", "Model", 608, 204, "reconcile", "Model"],
    ] as const)
      nodes.push({
        id,
        title,
        detail,
        x,
        y,
        parent,
        app,
        kind: "attachment",
        owner: owners[1],
        status: "Idle",
        duration: "",
      });
  }
  if (v === 3) {
    const p: Record<string, [number, number]> = {
      returns: [0, 0],
      sms: [0, 170],
      loyalty: [0, 340],
      checkout: [352, 0],
      optin: [352, 170],
      discount: [352, 340],
      north: [704, 170],
      rate: [1056, 85],
      margin: [1056, 255],
    };
    nodes.forEach((n) => {
      [n.x, n.y] = p[n.id];
      n.aggregation = n.detail;
      n.unit = /checkout|discount|rate/.test(n.id)
        ? "Percent"
        : n.id === "margin"
          ? "Currency"
          : "Count";
      n.better = n.id === "discount" ? "Lower is better" : "Higher is better";
    });
  }
  const edges: Edge[] = nodes
    .filter((n) => n.parent)
    .map((n) => ({
      id: `${n.parent}-${n.id}`,
      source: n.parent!,
      target: n.id,
      label: n.branch,
      attachment: n.kind === "attachment",
    }));
  if (v === 2) {
    edges.push({
      id: "paypal-dedupe",
      source: "paypal",
      target: "dedupe",
      label: "384k rows",
    });
    edges.find((e) => e.id === "stripe-dedupe")!.label = "1.2M rows";
    edges.find((e) => e.id === "dedupe-reconcile")!.label = "1.5M rows";
  }
  if (v === 3) {
    for (const id of ["checkout", "discount"])
      edges.push({ id: `${id}-north`, source: id, target: "north" });
    edges.forEach((e) => {
      e.correlation =
        e.source === "checkout"
          ? "0.91"
          : e.source === "optin"
            ? "0.88"
            : e.source === "discount"
              ? "-0.58"
              : e.target === "rate"
                ? "0.97"
                : e.target === "margin"
                  ? "0.84"
                  : undefined;
    });
  }
  return { nodes, edges };
}
function startingView(w: number, h: number, v: number): View {
  if (w < 600) {
    if (v === 1) return { x: (w - 896) / 2, y: (h - 762) / 2, zoom: 1 };
    if (v === 2) return { x: (w - 984 * 0.75) / 2, y: (h - 568 * 0.75) / 2 - 30, zoom: 0.75 };
    if (v === 3) return { x: (w - 1312 * 0.5) / 2, y: (h - 447 * 0.5) / 2, zoom: 0.5 };
    const zoom = Math.min(1, (w - 36) / 1140);
    return { x: (w - 1140 * zoom) / 2, y: (h - 323 * zoom) / 2 - 40 * zoom, zoom };
  }
  if (v === 0) {
    const z = Math.min(1, (w - 64) / 1140, (h - 64) / 323);
    return { x: (w - 1140 * z) / 2, y: (h - 323 * z) / 2 - 40 * z, zoom: z };
  }
  if (v === 1) {
    const z = Math.min(1, (w - 64) / 896, (h - 64) / 762);
    return { x: (w - 896 * z) / 2, y: (h - 762 * z) / 2, zoom: z };
  }
  if (v === 2) {
    const z = Math.min(1, (w - 64) / 984, (h - 64) / 568);
    return { x: 32, y: (h - 568 * z) / 2 - 40 * z, zoom: z };
  }
  const z = Math.min(1, Math.max(0.3, (w - 170) / 1320));
  return { x: 24, y: (h - 447 * z) / 2 - 30, zoom: z };
}
function nodeSize(n: Node, v: number) {
  return v === 2
    ? n.kind === "attachment"
      ? { w: 128, h: 92 }
      : n.id === "publish"
        ? { w: 272, h: 56 }
        : { w: 144, h: 100 }
    : v === 1
      ? { w: 256, h: 79 }
      : v === 3
        ? { w: 256, h: n.id === "north" ? 111 : 107 }
        : { w: 240, h: 83 };
}
const IconButton = ({
  label,
  children,
  onClick,
  disabled = false,
  active = false,
  pressed,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  pressed?: boolean;
}) => (
  <Button
    className={`fg-icon ${active ? "fg-active" : ""}`}
    variant="ghost"
    aria-label={label}
    aria-pressed={pressed}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </Button>
);

type CanvasNode = RFNode<{
  content: React.ReactNode;
  vertical: boolean;
  pipeline: boolean;
  attachment: boolean;
  incoming: boolean;
  outgoing: boolean;
  attachmentSource: boolean;
  root?: boolean;
}>;
type CanvasEdge = RFEdge<{ path: string; content: React.ReactNode; dash?: string }>;
function OfficialNode({ data }: NodeProps<CanvasNode>) {
  const targetStyle =
    data.pipeline && !data.attachment
      ? { left: 40, top: 28 }
      : data.attachment
        ? { top: -4 }
        : undefined;
  const sourceStyle = data.pipeline && !data.attachment ? { right: 40, top: 28 } : undefined;
  return (
    <>
      {!data.root && (
        <Handle
          type="target"
          position={data.vertical ? Position.Top : Position.Left}
          className={data.incoming ? "fg-port-connected" : ""}
          style={targetStyle}
        />
      )}
      {data.content}
      <Handle
        type="source"
        position={data.vertical ? Position.Bottom : Position.Right}
        className={data.outgoing ? "fg-port-connected" : ""}
        style={sourceStyle}
      />
      {data.attachmentSource && (
        <Handle
          id="attachment"
          type="source"
          position={Position.Bottom}
          className="fg-port-connected fg-attachment-port"
          style={{ bottom: -4 }}
        />
      )}
    </>
  );
}
function OfficialEdge({ id, data, markerEnd }: EdgeProps<CanvasEdge>) {
  return (
    <>
      <BaseEdge
        id={id}
        path={data?.path ?? ""}
        markerEnd={markerEnd}
        style={{ stroke: "#b7b7b7", strokeWidth: 1, strokeDasharray: data?.dash }}
      />
      {data?.content}
    </>
  );
}
const nodeTypes = { reui: OfficialNode };
const edgeTypes = { reui: OfficialEdge };
function FieldHelp({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="fg-field-help" aria-label={`About ${label}`}>
          <CircleHelp />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {label === "Title"
          ? "The step name shown on the canvas."
          : label === "Detail"
            ? "A short description of this step."
            : label === "Owner"
              ? "The person responsible for this step."
              : label === "Category"
                ? "The type of action performed by this step."
                : "The connected app used by this step."}
      </TooltipContent>
    </Tooltip>
  );
}
function FlowInspectorShell({
  className,
  title,
  onClose,
  children,
  compact,
}: {
  className: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  compact: boolean;
}) {
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width:600px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width:600px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  if (!mobile)
    return (
      <aside className={className} aria-label={`${title} details`}>
        {children}
      </aside>
    );
  return (
    <Sheet
      open
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <SheetContent
        className={`fg-mobile-sheet ${compact ? "fg-mobile-sheet-compact" : ""}`}
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <div className="fg-mobile-sheet-wrapper">
          <Frame
            dense
            variant="ghost"
            className={`${className} fg-mobile-inspector ${compact ? "" : "fg-mobile-step-inspector"}`}
          >
            {children}
          </Frame>
        </div>
      </SheetContent>
    </Sheet>
  );
}
export default function FlowCanvas(props: BlockProps) {
  return (
    <ReactFlowProvider>
      <FlowEditor {...props} />
    </ReactFlowProvider>
  );
}
function FlowEditor({ block }: BlockProps) {
  const variant = block.index;
  const [graph, setGraph] = useState(() => initialGraph(variant));
  const [saved, setSaved] = useState(() => JSON.stringify(initialGraph(variant)));
  const [past, setPast] = useState<Graph[]>([]);
  const [future, setFuture] = useState<Graph[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const selected = selection.length === 1 ? selection[0] : null;
  function setSelected(id: string | null) {
    setSelection(id ? [id] : []);
  }
  const [inspected, setInspected] = useState<string | null>(
    window.innerWidth < 600 ? null : variant === 2 ? "publish" : variant === 3 ? "north" : null,
  );
  const [editing, setEditing] = useState(variant >= 2);
  const [draft, setDraft] = useState<Node | null>(() =>
    variant >= 2
      ? (initialGraph(variant).nodes.find((n) => n.id === (variant === 2 ? "publish" : "north")) ??
        null)
      : null,
  );
  const [tab, setTab] = useState("Settings");
  const [period, setPeriod] = useState(0);
  const [model, setModel] = useState("Sonnet 5");
  const [testResultsCleared, setTestResultsCleared] = useState(false);
  const [locked, setLocked] = useState(false);
  const [snap, setSnap] = useState(false);
  const [mode, setMode] = useState("Pan");
  const [view, setView] = useState<View>(() =>
    startingView(window.innerWidth, window.innerHeight - 48, variant),
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const [run, setRun] = useState<"idle" | "running" | "paused" | "failed" | "waiting" | "complete">(
    "idle",
  );
  const [runStates, setRunStates] = useState<Record<string, RunState>>({});
  const [cursor, setCursor] = useState(0);
  const canvas = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(graph) !== saved;
  const touched = useRef(false);
  const flowApi = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const dragBefore = useRef<Graph | null>(null);
  const current = graph.nodes.find((n) => n.id === inspected);
  const chosen = graph.nodes.find((n) => n.id === selected);
  const runningNodes = graph.nodes.filter((n) => n.kind !== "attachment");
  const stateFor = (n: Node) => runStates[n.id] ?? n.status;
  const completed = Object.values(runStates).filter(
    (s) => s === "Succeeded" || s === "Skipped" || s === "Failed",
  ).length;
  function durationFor(node: Node) {
    if (variant !== 1) return node.duration;
    if (testResultsCleared) return "No test run yet";
    if (node.id === "model") {
      return model === "Opus 5"
        ? "1,768 tokens · USD 0.050"
        : model === "Haiku 4.5"
          ? "1,905 tokens · USD 0.011"
          : "1,842 tokens · USD 0.031";
    }
    return node.duration;
  }
  function change(next: Graph) {
    setPast((p) => [...p.slice(-39), graph]);
    setFuture([]);
    setGraph(next);
  }
  function undo() {
    const prev = past.at(-1);
    if (!prev) return;
    setFuture((f) => [graph, ...f]);
    setGraph(prev);
    setPast((p) => p.slice(0, -1));
  }
  function redo() {
    const next = future[0];
    if (!next) return;
    setPast((p) => [...p, graph]);
    setGraph(next);
    setFuture((f) => f.slice(1));
  }
  function open(n: Node, edit = variant > 0) {
    setSelected(n.id);
    setInspected(n.id);
    setDraft({
      ...n,
      value: n.value ? [...n.value] : undefined,
      change: n.change ? [...n.change] : undefined,
      params: n.params ? { ...n.params } : undefined,
    });
    setEditing(edit);
    setTab("Settings");
  }
  function add(parent?: Node, insertEdge?: Edge, asBranch = false) {
    const id = `step_${Date.now()}`,
      size = parent ? nodeSize(parent, variant) : { w: 240, h: 83 };
    const n: Node = {
      id,
      title: variant === 3 ? "New metric" : "New step",
      detail: "Not configured yet",
      x: parent ? (variant === 1 ? parent.x : parent.x + size.w + 60) : 320,
      y: parent ? (variant === 1 ? parent.y + 143 : parent.y) : 500,
      parent: parent?.id,
      branch: asBranch ? "New path" : insertEdge?.label,
      owner: owners[0],
      status: "Idle",
      duration: "Not run",
      category: "Action",
      app: variant === 1 ? "Custom Code" : undefined,
      ...(variant === 3
        ? {
            role: "Input",
            value: [0, 0, 0],
            change: [0, 0, 0],
            aggregation: "Sum",
            unit: "Count",
            better: "Higher is better",
          }
        : {}),
    };
    const sizeOfNew = nodeSize(n, variant);
    while (
      graph.nodes.some((other) => {
        const size = nodeSize(other, variant);
        return (
          n.x < other.x + size.w + 16 &&
          n.x + sizeOfNew.w + 16 > other.x &&
          n.y < other.y + size.h + 16 &&
          n.y + sizeOfNew.h + 16 > other.y
        );
      })
    )
      n.y += sizeOfNew.h + 32;
    let edges = [...graph.edges];
    if (insertEdge)
      edges = edges
        .filter((e) => e.id !== insertEdge.id)
        .concat(
          {
            id: `${parent!.id}-${id}`,
            source: parent!.id,
            target: id,
            label: insertEdge.label,
          },
          {
            ...insertEdge,
            id: `${id}-${insertEdge.target}`,
            source: id,
            label: undefined,
          },
        );
    else if (parent)
      edges.push({
        id: `${parent.id}-${id}`,
        source: parent.id,
        target: id,
        label: asBranch ? "New path" : undefined,
      });
    change({ nodes: [...graph.nodes, n], edges });
    if (variant === 1) {
      setTestResultsCleared(true);
      setRunStates(Object.fromEntries([...runningNodes, n].map((node) => [node.id, "Idle"])));
    }
    open(n, true);
    toast.success(variant === 3 ? "Metric created" : "Step created");
  }
  function duplicate(n: Node) {
    const copy = {
      ...n,
      id: `copy_${Date.now()}`,
      title: `${n.title} copy`,
      x: n.x + 32,
      y: n.y + 110,
    };
    change({ nodes: [...graph.nodes, copy], edges: graph.edges });
    open(copy, true);
  }
  function remove(id: string) {
    change({
      nodes: graph.nodes.filter((n) => n.id !== id),
      edges: graph.edges.filter((e) => e.source !== id && e.target !== id),
    });
    setDeleting(null);
    if (inspected === id) setInspected(null);
    if (selected === id) setSelected(null);
  }
  function saveNode() {
    if (!draft || !draft.title.trim()) return;
    const previousGraph = graph;
    const previousResults = runStates;
    const previouslyCleared = testResultsCleared;
    const previousPast = past;
    change({
      nodes: graph.nodes.map((n) =>
        n.id === draft.id
          ? { ...draft }
          : draft.role === "North Star" && n.role === "North Star"
            ? { ...n, role: "Input" }
            : n,
      ),
      edges: graph.edges.map((edge) =>
        variant === 1 && edge.target === draft.id && draft.branch !== undefined
          ? { ...edge, label: draft.branch }
          : edge,
      ),
    });
    setEditing(false);
    if (variant < 2) {
      if (variant === 1) {
        setTestResultsCleared(true);
        setRunStates(Object.fromEntries(runningNodes.map((node) => [node.id, "Idle"])));
      }
      toast.success("Step updated", {
        action: {
          label: "Undo",
          onClick: () => {
            setGraph(previousGraph);
            setRunStates(previousResults);
            setTestResultsCleared(previouslyCleared);
            setPast(previousPast);
            setFuture([]);
          },
        },
      });
    } else toast.success(variant === 3 ? "Metric saved" : "Task saved");
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(graph, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `${block.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function autoLayout() {
    const depths = new Map(graph.nodes.map((n) => [n.id, 0]));
    for (let pass = 0; pass < graph.nodes.length; pass++) {
      let changed = false;
      for (const edge of graph.edges) {
        const next = (depths.get(edge.source) ?? 0) + 1;
        if (next > (depths.get(edge.target) ?? 0)) {
          depths.set(edge.target, next);
          changed = true;
        }
      }
      if (!changed) break;
    }
    const ranks = new Map<number, Node[]>();
    for (const node of graph.nodes) {
      const rank = depths.get(node.id) ?? 0;
      ranks.set(rank, [...(ranks.get(rank) ?? []), node]);
    }
    const width = Math.max(...[...ranks.values()].map((nodes) => nodes.length));
    change({
      ...graph,
      nodes: graph.nodes.map((node) => {
        const rank = depths.get(node.id) ?? 0;
        const nodes = ranks.get(rank)!;
        const lane = nodes.indexOf(node);
        return {
          ...node,
          x: variant === 1 ? ((width - nodes.length) / 2 + lane) * 320 : rank * 320,
          y: variant === 1 ? rank * 143 : ((width - nodes.length) / 2 + lane) * 116,
        };
      }),
    });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (variant === 1 && canvas.current) {
          touched.current = true;
          setView({
            x: (canvas.current.clientWidth - 896) / 2,
            y: (canvas.current.clientHeight - 762) / 2,
            zoom: 1,
          });
        } else fit();
      }),
    );
  }
  function fit() {
    const api = flowApi.current;
    if (!api) return;
    touched.current = true;
    void api.fitView({ padding: 0.1, minZoom: 0.2, maxZoom: 1, duration: 180 });
  }
  function zoomBy(factor: number) {
    const api = flowApi.current;
    if (api) api.zoomTo(Math.max(0.2, Math.min(2, api.getZoom() * factor)), { duration: 120 });
    touched.current = true;
  }
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (!touched.current) setView(startingView(el.clientWidth, el.clientHeight, variant));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [variant]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select,[contenteditable]")) return;
      if (e.key === "Escape") {
        setInspected(null);
        setSelected(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selected &&
        !(variant === 1 && selected === "trigger")
      )
        setDeleting(selected);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const reconcileDone = runStates.reconcile === "Succeeded",
    publishDone = runStates.publish === "Succeeded";
  useEffect(() => {
    if (run !== "running") return;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      const order =
          variant === 2
            ? [
                "nightly",
                "stripe",
                "paypal",
                "dedupe",
                "reconcile",
                "invoices",
                "publish",
                "notify",
              ]
            : graph.nodes.filter((n) => n.kind !== "attachment").map((n) => n.id),
        id = order[cursor];
      if (!id) {
        setRun("complete");
        toast.success(variant === 1 ? "Test complete" : "Run completed");
        return;
      }
      if (variant === 2 && id === "reconcile" && !reconcileDone) {
        setRunStates((s) => ({ ...s, [id]: "Failed" }));
        setRun("failed");
        return;
      }
      if (variant === 2 && id === "publish" && !publishDone) {
        setRunStates((s) => ({ ...s, [id]: "Waiting" }));
        setRun("waiting");
        return;
      }
      setRunStates((s) => ({ ...s, [id]: "Running" }));
      settle = setTimeout(() => {
        setRunStates((s) => ({
          ...s,
          [id]:
            variant === 1 && id === "email"
              ? "Failed"
              : variant === 1 && ["guard", "slack", "dispute", "assign"].includes(id)
                ? "Skipped"
                : "Succeeded",
        }));
        setCursor((c) => c + 1);
      }, 550);
    }, 0);
    return () => {
      clearTimeout(timer);
      clearTimeout(settle);
    };
  }, [run, cursor, variant, graph.nodes, reconcileDone, publishDone]);
  function start() {
    if (variant === 1) {
      // The public agent preview evaluates its local fixture immediately; it does
      // not expose a timed workflow runner or pause/resume state.
      const results = Object.fromEntries(runningNodes.map((node) => [node.id, node.status]));
      setRunStates(results);
      setTestResultsCleared(false);
      const passed = Object.values(results).filter((status) => status === "Succeeded").length;
      const failed = Object.values(results).filter((status) => status === "Failed").length;
      const skipped = Object.values(results).filter((status) => status === "Skipped").length;
      const disconnected = runningNodes.filter(
        (node) => !graph.edges.some((edge) => edge.source === node.id || edge.target === node.id),
      ).length;
      const description = `${passed} passed, ${failed} failed, ${skipped} skipped, ${disconnected} unconnected.`;
      if (failed) toast.error("Test failed", { description });
      else toast.success("Test passed", { description });
      return;
    }
    setRunStates(Object.fromEntries(runningNodes.map((n) => [n.id, "Queued"])));
    setCursor(0);
    setRun("running");
  }
  function approve(id: string) {
    setRunStates((s) => ({ ...s, [id]: "Succeeded" }));
    if (run === "waiting" || run === "failed") {
      setCursor((c) => c + 1);
      setRun("running");
    }
    toast.success(id === "publish" ? "Publication approved" : "Task retry succeeded");
  }
  function connect(target: string, source: string) {
    if (!source || graph.edges.some((e) => e.source === source && e.target === target)) return;
    if (target === source) {
      return;
    }
    const reachable = (id: string, seen = new Set<string>()): boolean => {
      if (id === source) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return graph.edges.filter((e) => e.source === id).some((e) => reachable(e.target, seen));
    };
    if (reachable(target)) {
      toast.error("This connection would create a cycle");
      return;
    }
    change({
      ...graph,
      edges: [...graph.edges, { id: `edge_${Date.now()}`, source, target }],
    });
  }
  function path(e: Edge) {
    const a = graph.nodes.find((n) => n.id === e.source),
      b = graph.nodes.find((n) => n.id === e.target);
    if (!a || !b) return { d: "", x: 0, y: 0 };
    const as = nodeSize(a, variant),
      bs = nodeSize(b, variant);
    if (e.attachment) {
      const x = a.x + as.w / 2,
        y = a.y + as.h + 4,
        tx = b.x + bs.w / 2,
        ty = b.y - 4;
      return { d: `M${x} ${y}V${ty}`, x: (x + tx) / 2, y: (y + ty) / 2 };
    }
    if (variant === 1) {
      const x = a.x + as.w / 2,
        y = a.y + as.h,
        tx = b.x + bs.w / 2,
        ty = b.y,
        my = y + (ty - y) / 2;
      return { d: `M${x} ${y}V${my}H${tx}V${ty}`, x: tx, y: my };
    }
    let x = a.x + as.w,
      y = a.y + as.h / 2,
      tx = b.x,
      ty = b.y + bs.h / 2;
    if (variant === 2) {
      x = a.x + (as.w + 56) / 2 + 4;
      y = a.y + 28;
      tx = b.x + (bs.w - 56) / 2 - 4;
      ty = b.y + 28;
      if (b.id === "publish") tx = b.x - 4;
      if (a.id === "publish") x = a.x + as.w + 4;
    }
    const mid = (x + tx) / 2;
    return {
      d: `M${x} ${y}H${mid}Q${mid} ${y} ${mid} ${y + Math.sign(ty - y) * Math.min(12, Math.abs(ty - y) / 2)}V${ty - Math.sign(ty - y) * Math.min(12, Math.abs(ty - y) / 2)}Q${mid} ${ty} ${mid + Math.sign(tx - x) * Math.min(12, Math.abs(tx - x) / 4)} ${ty}H${tx}`,
      x: mid,
      y: (y + ty) / 2,
    };
  }
  const nodeActions = (n: Node) => (
    <>
      <DropdownMenuItem onSelect={() => open(n, false)}>
        <Eye />
        View details
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => open(n, true)}>
        <Pencil />
        Edit step
      </DropdownMenuItem>
      {variant === 1 ? (
        <>
          <DropdownMenuItem onSelect={() => add(n, undefined, true)}>
            <GitBranch />
            Add branch
          </DropdownMenuItem>
          {n.id !== "trigger" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setDeleting(n.id)}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </>
      ) : (
        <>
          <DropdownMenuItem onSelect={() => duplicate(n)}>
            <Copy />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              navigator.clipboard.writeText(JSON.stringify(n, null, 2));
              toast.success("Copied as JSON");
            }}
          >
            <Copy />
            Copy as JSON
          </DropdownMenuItem>
          {variant === 2 && stateFor(n) === "Failed" && (
            <DropdownMenuItem onSelect={() => approve(n.id)}>
              <RotateCcw />
              Retry task
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDeleting(n.id)}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </>
      )}
    </>
  );
  const renderNode = (n: Node) => {
    const size = nodeSize(n, variant),
      s = stateFor(n),
      isPipeline = variant === 2 && n.id !== "publish",
      value = n.value?.[period],
      isLeaf = !graph.edges.some((e) => e.source === n.id);
    return (
      <ContextMenu key={n.id}>
        <ContextMenuTrigger asChild>
          {variant < 2 ? (
            <FlowFidelityNode
              variant={variant as 0 | 1}
              node={{ ...n, duration: durationFor(n) }}
              status={s}
              selected={selection.includes(n.id)}
              icon={<BrandIcon app={n.app ?? n.category ?? n.title} />}
              data-flow-node={n.id}
              role="button"
              tabIndex={0}
              aria-label={`Select ${n.title}`}
              onClick={(event) => {
                event.stopPropagation();
                setSelected(n.id);
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
                open(n, variant !== 0);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") open(n, variant !== 0);
              }}
            >
              {variant === 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="fg-node-menu"
                      aria-label={`Actions for ${n.title}`}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal
                        style={{ width: 12, height: 12, transform: "rotate(90deg)" }}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="fg-portal">{nodeActions(n)}</DropdownMenuContent>
                </DropdownMenu>
              )}
              {variant === 0 && selected === n.id && (
                <NodeToolbar
                  isVisible
                  position={Position.Top}
                  offset={8}
                  className="fg-node-toolbar"
                >
                  <IconButton label={`Add a step after ${n.title}`} onClick={() => add(n)}>
                    <Plus />
                  </IconButton>
                  <IconButton label={`View ${n.title}`} onClick={() => open(n, false)}>
                    <Eye />
                  </IconButton>
                  <IconButton label={`Edit ${n.title}`} onClick={() => open(n, true)}>
                    <Pencil />
                  </IconButton>
                </NodeToolbar>
              )}
              {variant === 1 && isLeaf && (
                <button
                  className="fg-node-add"
                  aria-label={`Add a step after ${n.title}`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => add(n)}
                >
                  <Plus />
                </button>
              )}
            </FlowFidelityNode>
          ) : (
            <Frame
              dense
              variant="ghost"
              key={n.id}
              role="button"
              tabIndex={0}
              aria-label={`Select ${n.title}`}
              className={`fg-node ${variant === 1 ? "fg-tree-node" : variant === 2 ? (n.kind === "attachment" ? "fg-attachment fg-pipeline-node" : n.id === "publish" ? "fg-approval" : "fg-pipeline-node") : variant === 3 ? "fg-map-node" : ""} ${selection.includes(n.id) ? "fg-selected" : ""}`}
              data-flow-node={n.id}
              style={{ position: "relative", left: 0, top: 0, width: size.w, height: size.h }}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(n.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                open(n, variant !== 0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") open(n, variant !== 0);
              }}
            >
              <FramePanel className="fg-flow-node-panel">
                {isPipeline ? (
                  <>
                    <IconTile
                      variant="frame"
                      size="xl"
                      className={`fg-service-tile ${n.kind ? "" : statusClass(s)}`}
                    >
                      <BrandIcon app={n.app ?? n.title} />
                      {!n.kind && (
                        <span className={`fg-service-state ${statusClass(s)}`}>
                          <RunIcon state={s} />
                        </span>
                      )}
                    </IconTile>
                    <div className="fg-node-name">{n.title}</div>
                    <div className={`fg-node-detail ${s === "Failed" ? "fg-error-detail" : ""}`}>
                      {n.kind
                        ? n.detail
                        : n.id === "nightly"
                          ? "02:00 UTC"
                          : n.id === "reconcile" && s === "Succeeded"
                            ? "Reconciled"
                            : s === "Failed"
                              ? n.detail
                              : n.duration === "Not run"
                                ? n.detail
                                : n.duration}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="fg-node-main">
                      <IconTile
                        variant="outline"
                        size="sm"
                        className="fg-tile"
                        style={
                          n.id === "form" ? { background: "#181818", color: "#fff" } : undefined
                        }
                      >
                        <BrandIcon app={n.app ?? n.category ?? n.role ?? n.title} />
                      </IconTile>
                      <span className="fg-node-copy">
                        <span className="fg-node-name block">{n.title}</span>
                        <span className="fg-node-detail block">
                          {variant === 3 ? n.role : n.detail}
                        </span>
                      </span>
                    </div>
                    {variant === 3 ? (
                      <div className="fg-map-stats">
                        <div className="fg-map-mainvalue">
                          <span>
                            {value !== undefined
                              ? n.unit === "Currency"
                                ? `$${value >= 1000000 ? (value / 1000000).toFixed(1) + "M" : (value / 1000).toFixed(0) + "K"}`
                                : `${value >= 100000 ? (value / 1000).toFixed(1) + "K" : value.toLocaleString()}${n.unit === "Percent" ? "%" : ""}`
                              : `${n.progress ?? 0}%`}
                          </span>
                          {value !== undefined ? (
                            <span className="fg-change">
                              {(n.change?.[period] ?? 0) > 0 ? "+" : ""}
                              {n.change?.[period] ?? 0}%
                            </span>
                          ) : (
                            <>
                              <span className="fg-small-progress">
                                <i style={{ width: `${n.progress}%` }} />
                              </span>
                              <span
                                className={`fg-runbadge ${n.progress === 0 ? "fg-failed" : ""}`}
                                style={
                                  n.progress === 62
                                    ? {
                                        color: "#6d28d9",
                                        background: "#f5efff",
                                        borderColor: "#e8d8ff",
                                      }
                                    : undefined
                                }
                              >
                                {n.progress === 0
                                  ? "Blocked"
                                  : n.progress === 40
                                    ? "To Do"
                                    : "In Progress"}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="fg-map-meta">
                          {value !== undefined ? (
                            <>
                              Past {["7 days", "6 weeks", "12 months"][period]}
                              <span>·</span>
                              {n.aggregation ?? n.detail}
                              {!!n.progress && (
                                <span className="fg-map-goal">
                                  <i>
                                    <b style={{ width: `${n.progress}%` }} />
                                  </i>
                                  {n.progress}%
                                </span>
                              )}
                            </>
                          ) : (
                            n.detail.split(" · ").map((v, i) => (
                              <span key={v}>
                                {i > 0 ? " · " : ""}
                                {v}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    ) : n.id === "publish" && variant === 2 ? (
                      <Button
                        className="fg-button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => approve(n.id)}
                        disabled={s === "Succeeded"}
                      >
                        {s === "Succeeded" ? "Approved" : "Approve"}
                      </Button>
                    ) : (
                      <div className="fg-node-run">
                        {variant === 0 ? (
                          <>
                            <span className="fg-avatar">
                              {n.owner
                                .split(" ")
                                .map((s) => s[0])
                                .join("")}
                            </span>
                            <span>{n.duration}</span>
                            <span className={`fg-runbadge ${statusClass(s)}`}>
                              <RunIcon state={s} />
                              {s === "Succeeded" ? "Success" : s}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className={statusClass(s)}>
                              <RunIcon state={s} />
                            </span>
                            <span>{n.duration.split(" · ")[0]}</span>
                            {n.duration.includes(" · ") && (
                              <>
                                <span>·</span>
                                <span>{n.duration.split(" · ")[1]}</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
                {variant === 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="fg-node-menu"
                        aria-label={`Actions for ${n.title}`}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal
                          style={{
                            width: 12,
                            height: 12,
                            transform: "rotate(90deg)",
                          }}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="fg-portal">
                      {nodeActions(n)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {variant === 0 && selected === n.id && (
                  <NodeToolbar
                    isVisible
                    position={Position.Top}
                    offset={8}
                    className="fg-node-toolbar"
                  >
                    <IconButton label={`Add a step after ${n.title}`} onClick={() => add(n)}>
                      <Plus />
                    </IconButton>
                    <IconButton label={`View ${n.title}`} onClick={() => open(n, false)}>
                      <Eye />
                    </IconButton>
                    <IconButton label={`Edit ${n.title}`} onClick={() => open(n, true)}>
                      <Pencil />
                    </IconButton>
                  </NodeToolbar>
                )}
                {variant === 1 && isLeaf && (
                  <button
                    className="fg-node-add"
                    aria-label={`Add a step after ${n.title}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => add(n)}
                  >
                    <Plus />
                  </button>
                )}
                {variant === 3 && selected === n.id && (
                  <NodeToolbar
                    isVisible
                    position={Position.Top}
                    offset={8}
                    className="fg-node-toolbar"
                  >
                    <IconButton label={`Open ${n.title}`} onClick={() => open(n, true)}>
                      <Pencil />
                    </IconButton>
                    <IconButton label={`Duplicate ${n.title}`} onClick={() => duplicate(n)}>
                      <Copy />
                    </IconButton>
                  </NodeToolbar>
                )}
                {variant === 2 && selected === n.id && (
                  <NodeToolbar
                    isVisible
                    position={Position.Top}
                    offset={8}
                    className="fg-node-toolbar"
                  >
                    <IconButton label={`Open ${n.title}`} onClick={() => open(n, true)}>
                      <Pencil />
                    </IconButton>
                    <IconButton label="Re-run" onClick={() => approve(n.id)}>
                      <RotateCcw />
                    </IconButton>
                    <IconButton
                      label="Skip"
                      onClick={() => setRunStates((s) => ({ ...s, [n.id]: "Skipped" }))}
                    >
                      <Minus />
                    </IconButton>
                    <IconButton label="Duplicate" onClick={() => duplicate(n)}>
                      <Copy />
                    </IconButton>
                  </NodeToolbar>
                )}
              </FramePanel>
            </Frame>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent className="fg-portal min-w-44">
          {variant < 2 ? (
            <>
              {variant === 0 && (
                <ContextMenuItem onSelect={() => add(n)}>Add step after</ContextMenuItem>
              )}
              <ContextMenuItem onSelect={() => open(n, false)}>View details</ContextMenuItem>
              <ContextMenuItem onSelect={() => open(n, true)}>Edit step</ContextMenuItem>
              {variant === 1 && (
                <>
                  <ContextMenuItem onSelect={() => add(n, undefined, true)}>
                    Add branch
                  </ContextMenuItem>
                  {n.id !== "trigger" && (
                    <>
                      <ContextMenuSeparator />
                      <ContextMenuItem onSelect={() => setDeleting(n.id)}>Delete</ContextMenuItem>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <ContextMenuItem onSelect={() => open(n, true)}>Open details</ContextMenuItem>
              {variant === 2 && (
                <>
                  <ContextMenuItem onSelect={() => approve(n.id)}>Re-run task</ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() => setRunStates((s) => ({ ...s, [n.id]: "Skipped" }))}
                  >
                    Skip task
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() => {
                      const id = `attachment_${Date.now()}`;
                      change({
                        nodes: [
                          ...graph.nodes,
                          {
                            ...n,
                            id,
                            kind: "attachment",
                            title: "New connection",
                            detail: "Connection",
                            duration: "",
                            app: "Database",
                            x: n.x + 8,
                            y: n.y + 164,
                            parent: n.id,
                            status: "Idle",
                          },
                        ],
                        edges: [
                          ...graph.edges,
                          { id: `${n.id}-${id}`, source: n.id, target: id, attachment: true },
                        ],
                      });
                    }}
                  >
                    Add attachment
                  </ContextMenuItem>
                </>
              )}
              <ContextMenuItem onSelect={() => duplicate(n)}>Duplicate</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => setDeleting(n.id)}>Delete</ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  };
  const renderEdge = (e: Edge) => {
    const p = path(e);
    return (
      <g key={e.id}>
        {(e.label || e.correlation) && (
          <g transform={`translate(${p.x},${p.y})`}>
            <rect
              x={-Math.max(16, (e.label ?? e.correlation ?? "").length * 3.3 + 5)}
              y="-10"
              width={Math.max(32, (e.label ?? e.correlation ?? "").length * 6.6 + 10)}
              height="20"
              rx="5"
              fill="var(--background)"
              stroke="var(--border)"
            />
            <text
              className="fg-edge-label"
              textAnchor="middle"
              dy="4"
              style={{
                fill: e.correlation?.startsWith("-") ? "#f43f5e" : undefined,
              }}
            >
              {e.label ?? e.correlation}
            </text>
          </g>
        )}
      </g>
    );
  };
  return (
    <div className="fg-flow reui-reference" data-flow-variant={block.id}>
      <header className="fg-header">
        <span className="fg-crumb">{["Workflows", "Agents", "Pipelines", "Maps"][variant]}</span>
        <ChevronRight style={{ width: 12, height: 12, color: "var(--muted-foreground)" }} />
        <h2 className={`fg-title ${variant === 3 ? "fg-map-title" : ""}`}>
          {graphTitles[variant]}
        </h2>
        <div className="fg-headmeta">
          {variant === 2 ? (
            <span>run_3f9a1c</span>
          ) : (
            <span>
              {variant === 3
                ? "3 initiatives, 6 metrics"
                : `${runningNodes.length} steps, ${variant === 1 ? "3 paths" : `${graph.edges.length} connections`}`}
            </span>
          )}
          {variant === 3 && (
            <>
              <span>·</span>
              <span>5 correlations</span>
            </>
          )}
          <span>·</span>
          <MiniAvatar
            name={variant === 1 ? "HB" : variant === 2 ? "TL" : "IM"}
            photo={variant === 0}
          />
          <span>
            {dirty
              ? "Unsaved"
              : variant === 0
                ? "2h ago"
                : variant === 1
                  ? "Draft 4"
                  : variant === 2
                    ? "02:00 UTC"
                    : "Ines Marchetti"}
          </span>
        </div>
        {variant === 3 && (
          <div className="fg-period-tabs">
            {["7 days", "6 weeks", "12 months"].map((p, i) => (
              <button key={p} aria-pressed={period === i} onClick={() => setPeriod(i)}>
                <span className="fg-period-full">{p}</span>
                <span className="fg-period-short">{["7d", "6w", "12m"][i]}</span>
              </button>
            ))}
          </div>
        )}
        {variant === 2 && (
          <div className="fg-status-counts">
            {(["Failed", "Waiting", "Queued", "Succeeded"] as RunState[]).map((s) => (
              <span key={s} className={`fg-runbadge ${statusClass(s)}`} title={s}>
                <RunIcon state={s} />
                {s === "Failed" ? "Failed " : ""}
                {runningNodes.filter((n) => stateFor(n) === s).length}
              </span>
            ))}
          </div>
        )}
        <div className="fg-actions">
          <Popover>
            <PopoverTrigger asChild>
              <Button className="fg-icon" variant="ghost" aria-label="Keyboard shortcuts">
                <CircleHelp />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="fg-portal text-sm w-64">
              <strong>Keyboard shortcuts</strong>
              <p className="mt-3">Delete — remove selected step</p>
              <p>⌘ Z — undo · ⇧ ⌘ Z — redo</p>
              <p>Escape — close inspector</p>
              <p>Drag the canvas to pan</p>
            </PopoverContent>
          </Popover>
          {variant === 1 && (
            <div className="fg-model-select">
              <FGSelect
                aria-label="Model"
                icon={<BrandIcon app="Claude" />}
                value={model}
                onChange={(e) => {
                  const value = e.target.value;
                  const previousModel = model;
                  const previousGraph = graph;
                  const previousResults = runStates;
                  const previouslyCleared = testResultsCleared;
                  const previousPast = past;
                  setModel(value);
                  setRunStates(Object.fromEntries(runningNodes.map((node) => [node.id, "Idle"])));
                  setTestResultsCleared(true);
                  toast.success("Model changed", {
                    description: `Claude ${value}. Last run cleared.`,
                    action: {
                      label: "Undo",
                      onClick: () => {
                        setModel(previousModel);
                        setGraph(previousGraph);
                        setRunStates(previousResults);
                        setTestResultsCleared(previouslyCleared);
                        setPast(previousPast);
                        setFuture([]);
                      },
                    },
                  });
                  change({
                    ...graph,
                    nodes: graph.nodes.map((n) =>
                      n.id === "model" ? { ...n, title: `Claude ${value}` } : n,
                    ),
                  });
                }}
              >
                {["Opus 5", "Sonnet 5", "Haiku 4.5"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </FGSelect>
            </div>
          )}
          <Button
            variant="outline"
            className="fg-button fg-add-button"
            aria-label={variant === 2 ? "Add task" : variant === 3 ? "Add metric" : "Add step"}
            onClick={() => add()}
          >
            <Plus />
            <span className="fg-add-label">
              {variant === 2 ? "Add task" : variant === 3 ? "Add metric" : "Add step"}
            </span>
          </Button>
          {variant === 0 ? (
            <Button
              variant="outline"
              className="fg-button"
              disabled={!dirty}
              onClick={() => {
                setSaved(JSON.stringify(graph));
                toast.success("Workflow updated");
              }}
            >
              <Check />
              Update
            </Button>
          ) : variant !== 3 ? (
            <ButtonGroup className="fg-run-group">
              <Button
                variant="outline"
                className="fg-button"
                onClick={() =>
                  run === "running"
                    ? setRun("paused")
                    : run === "paused"
                      ? setRun("running")
                      : start()
                }
              >
                {run === "running" ? (
                  <Pause />
                ) : (
                  <Play fill={variant === 2 ? "currentColor" : "none"} />
                )}
                {run === "running"
                  ? "Pause"
                  : run === "paused"
                    ? "Resume"
                    : variant === 1
                      ? "Run test"
                      : "Run"}
              </Button>
              {variant === 2 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="fg-icon fg-run-chevron"
                      aria-label="Run options"
                    >
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="fg-portal" align="end">
                    <DropdownMenuItem onSelect={() => add()}>
                      <Plus />
                      Add task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        setRun("idle");
                        setCursor(0);
                      }}
                    >
                      <Square />
                      Stop run
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        const failed = runningNodes.find((n) => stateFor(n) === "Failed");
                        if (failed) approve(failed.id);
                      }}
                    >
                      <RotateCcw />
                      Retry failed task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        setRun("idle");
                        setCursor(0);
                        setRunStates(Object.fromEntries(runningNodes.map((n) => [n.id, "Idle"])));
                      }}
                    >
                      <X />
                      Clear results
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </ButtonGroup>
          ) : null}
          {variant !== 2 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="fg-icon"
                  aria-label={
                    ["Workflow actions", "Agent actions", "Run options", "Map actions"][variant]
                  }
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="fg-portal" align="end">
                {variant === 1 ? (
                  <>
                    <DropdownMenuItem
                      onSelect={() => {
                        setRunStates(
                          Object.fromEntries(runningNodes.map((node) => [node.id, "Idle"])),
                        );
                        setTestResultsCleared(true);
                      }}
                    >
                      Clear results
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        change(initialGraph(1));
                        setModel("Sonnet 5");
                        setRunStates({});
                        setTestResultsCleared(false);
                        setSelected(null);
                        if (canvas.current) {
                          touched.current = true;
                          setView({
                            x: (canvas.current.clientWidth - 896) / 2,
                            y: (canvas.current.clientHeight - 762) / 2,
                            zoom: 1,
                          });
                        }
                      }}
                    >
                      Restore sample
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => navigator.clipboard.writeText(JSON.stringify(graph, null, 2))}
                    >
                      Copy as JSON
                    </DropdownMenuItem>
                  </>
                ) : variant === 0 ? (
                  <>
                    <DropdownMenuLabel>Canvas</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem checked={snap} onCheckedChange={setSnap}>
                      Snap to grid
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        const original = initialGraph(0);
                        change({
                          ...graph,
                          nodes: graph.nodes.map((node) => {
                            const fixture = original.nodes.find((item) => item.id === node.id);
                            return fixture ? { ...node, x: fixture.x, y: fixture.y } : node;
                          }),
                        });
                      }}
                    >
                      Reset layout
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>wf_8k2m4p</DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={() => setSelection(graph.nodes.map((node) => node.id))}
                    >
                      Select all steps
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => navigator.clipboard.writeText(JSON.stringify(graph, null, 2))}
                    >
                      Copy as JSON
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onSelect={exportJson}>
                      <Download />
                      Export JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={fit}>
                      <Maximize2 />
                      Fit to view
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setSnap(!snap)}>
                      <Check style={{ visibility: snap ? "visible" : "hidden" }} />
                      Snap to grid
                    </DropdownMenuItem>
                    {variant === 2 && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setRun("idle");
                          setRunStates({});
                          setCursor(0);
                        }}
                      >
                        <Square />
                        Stop run
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {run === "running" && (
          <div
            className="fg-run-progress"
            style={{ width: `${(completed / runningNodes.length) * 100}%` }}
          />
        )}
      </header>
      <div className={`fg-canvas ${mode === "Select" ? "fg-select-mode" : ""}`} ref={canvas}>
        <ReactFlow<CanvasNode, CanvasEdge>
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodes={graph.nodes.map((n) => ({
            id: n.id,
            type: "reui",
            position: { x: n.x, y: n.y },
            data: {
              content: renderNode(n),
              vertical: variant === 1 || n.kind === "attachment",
              pipeline: variant === 2 && n.id !== "publish",
              attachment: n.kind === "attachment",
              root: variant === 0 ? n.id === "form" : variant === 1 ? n.id === "trigger" : false,
              incoming: graph.edges.some((e) => e.target === n.id),
              outgoing: variant < 2 || graph.edges.some((e) => e.source === n.id && !e.attachment),
              attachmentSource: graph.edges.some((e) => e.source === n.id && e.attachment),
            },
            width: nodeSize(n, variant).w,
            height: nodeSize(n, variant).h,
            style: { width: nodeSize(n, variant).w, height: nodeSize(n, variant).h },
            selected: selection.includes(n.id),
          }))}
          edges={graph.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.attachment ? "attachment" : undefined,
            markerEnd:
              variant === 2 && !e.attachment
                ? { type: MarkerType.ArrowClosed, width: 10, height: 10, color: "#b7b7b7" }
                : undefined,
            type: "reui",
            data: {
              path: path(e).d,
              content: renderEdge(e),
              dash: e.attachment
                ? "2 3"
                : variant === 0 && e.target !== "notify"
                  ? "4 4"
                  : undefined,
            },
          }))}
          viewport={view}
          onViewportChange={setView}
          onMoveStart={() => {
            touched.current = true;
          }}
          onInit={(instance) => {
            flowApi.current = instance;
          }}
          onPaneClick={() => setSelected(null)}
          onNodesChange={(changes) => {
            const selects = changes.filter((c) => c.type === "select");
            if (selects.length) {
              setSelection((previous) => {
                const next = new Set(previous);
                for (const item of selects) {
                  if (item.selected) next.add(item.id);
                  else next.delete(item.id);
                }
                return [...next];
              });
            }
            const moves = changes.filter((c) => c.type === "position");
            if (moves.length)
              setGraph((g) => ({
                ...g,
                nodes: g.nodes.map((n) => {
                  const move = moves.find((m) => m.id === n.id);
                  return move?.position ? { ...n, x: move.position.x, y: move.position.y } : n;
                }),
              }));
          }}
          onNodeDragStart={() => {
            dragBefore.current = graph;
          }}
          onNodeDragStop={() => {
            const before = dragBefore.current;
            if (before) {
              setPast((p) => [...p, before]);
              setFuture([]);
              dragBefore.current = null;
            }
          }}
          onNodeClick={(_, node) => setSelected(node.id)}
          onConnect={(connection) => {
            if (connection.target) connect(connection.target, connection.source);
          }}
          nodesDraggable={!locked}
          nodesConnectable={!locked}
          snapToGrid={snap}
          snapGrid={[24, 24]}
          panOnDrag={mode === "Pan"}
          selectionOnDrag={mode === "Select"}
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          minZoom={0.2}
          maxZoom={2}
          deleteKeyCode={null}
          proOptions={{ hideAttribution: false }}
        >
          {variant === 0 && !current && (
            <MiniMap
              pannable
              zoomable
              position="bottom-right"
              nodeColor="#d0d0d0"
              maskColor="rgba(248,248,248,.7)"
              style={{ width: 200, height: 150, bottom: 0, right: 0 }}
            />
          )}
          <Background gap={variant === 3 ? 14 : 24} size={2} color="var(--fg-canvas-dot)" />
          <ViewportPortal>
            {" "}
            {variant === 1 &&
              graph.edges.map((e) => {
                const p = path(e),
                  n = graph.nodes.find((n) => n.id === e.source)!;
                return (
                  <button
                    key={e.id}
                    className="fg-connector-add"
                    aria-label={e.label ? `Add a step on the ${e.label} path` : "Add a step here"}
                    style={{ left: p.x, top: p.y }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => add(n, e)}
                  >
                    <Plus />
                  </button>
                );
              })}
          </ViewportPortal>
        </ReactFlow>
      </div>
      <div className="fg-controls">
        <IconButton label="Select" active={mode === "Select"} onClick={() => setMode("Select")}>
          <MousePointer2 />
        </IconButton>
        <IconButton label="Pan" active={mode === "Pan"} onClick={() => setMode("Pan")}>
          <Hand />
        </IconButton>
        {variant === 0 && <span className="fg-control-sep" />}
        <IconButton label="Zoom out" onClick={() => zoomBy(1 / 1.2)}>
          <Minus />
        </IconButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="fg-zoom-value"
              aria-label={`Zoom level ${Math.round(view.zoom * 100)}%`}
            >
              {Math.round(view.zoom * 100)}%
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="fg-portal">
            {[0.5, 0.75, 1, 1.25, 1.5].map((z) => (
              <DropdownMenuItem key={z} onSelect={() => setView((v) => ({ ...v, zoom: z }))}>
                {z * 100}%
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onSelect={fit}>Fit to view</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <IconButton label="Zoom in" onClick={() => zoomBy(1.2)}>
          <Plus />
        </IconButton>
        <span className="fg-control-sep" />
        {variant === 0 ? (
          <>
            <IconButton label="Undo" disabled={!past.length} onClick={undo}>
              <Undo2 />
            </IconButton>
            <IconButton label="Redo" disabled={!future.length} onClick={redo}>
              <Redo2 />
            </IconButton>
            <span className="fg-control-sep" />
            <IconButton
              label={locked ? "Unlock canvas" : "Lock canvas"}
              active={locked}
              pressed={locked}
              onClick={() => setLocked(!locked)}
            >
              {locked ? <UnlockKeyhole /> : <LockKeyhole />}
            </IconButton>
          </>
        ) : variant === 1 ? (
          <IconButton label="Tidy tree" onClick={autoLayout}>
            <Workflow />
          </IconButton>
        ) : variant === 2 ? (
          <IconButton
            label="Focus failed task"
            onClick={() => {
              const node = graph.nodes.find((n) => stateFor(n) === "Failed");
              if (node) {
                open(node, true);
                setView((v) => ({ ...v, x: 150 - node.x * v.zoom, y: 150 - node.y * v.zoom }));
              }
            }}
          >
            <TriangleAlert />
          </IconButton>
        ) : (
          <>
            <IconButton
              label="Focus north star"
              onClick={() => {
                const node = graph.nodes.find((n) => n.role === "North Star");
                if (node) open(node, true);
              }}
            >
              <Target />
            </IconButton>
            <IconButton label="Auto layout" onClick={autoLayout}>
              <LayoutGrid />
            </IconButton>
          </>
        )}
      </div>
      {current && (
        <FlowInspectorShell
          className={`fg-inspector ${variant >= 2 ? "fg-floating" : ""}`}
          title={current.title}
          compact={variant >= 2}
          onClose={() => setInspected(null)}
        >
          <div className="fg-inspector-head">
            {variant < 2 && (
              <IconTile variant="outline" size="sm">
                <BrandIcon app={current.app ?? current.category ?? current.title} />
              </IconTile>
            )}
            {variant === 2 && <BrandIcon app={current.app ?? current.title} />}
            <div>
              <strong>{current.title}</strong>
              {variant < 2 && (
                <div className="fg-inspector-sub">
                  <Badge variant="outline" className="fg-flow-kind-badge">
                    {variant === 0 && current.id === "form"
                      ? "Trigger"
                      : (current.app ?? current.category ?? "Action")}
                  </Badge>
                  <span>·</span>
                  <span>{variant === 0 && current.id === "form" ? "trigger" : current.id}</span>
                </div>
              )}
            </div>
            {variant >= 2 && (
              <span
                className={`fg-runbadge ${variant === 3 ? "fg-waiting" : statusClass(stateFor(current))}`}
                style={{ marginLeft: 0, fontWeight: 400 }}
              >
                {current.role ?? stateFor(current)}
              </span>
            )}
            <IconButton
              label={
                window.innerWidth < 600
                  ? "Close"
                  : variant === 3
                    ? "Close metric details"
                    : variant === 2
                      ? "Close task details"
                      : "Close step details"
              }
              onClick={() => setInspected(null)}
            >
              <X />
            </IconButton>
          </div>
          {variant >= 2 && (
            <div className="fg-tabs">
              {["Settings", variant === 3 ? "Links" : "Wiring"].map((t) => (
                <button
                  key={t}
                  aria-selected={tab === t}
                  onClick={() => {
                    setTab(t);
                    if (!draft) setDraft({ ...current });
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <div className="fg-inspector-body">
            {variant >= 2 && tab !== "Settings" ? (
              <>
                {(["incoming", "outgoing"] as const).map((direction) => (
                  <div className="fg-links-section" key={direction}>
                    <p className="fg-detail-title">
                      {variant === 3
                        ? direction === "incoming"
                          ? "DRIVEN BY"
                          : "MOVES"
                        : direction === "incoming"
                          ? "INPUTS"
                          : "OUTPUTS"}
                    </p>
                    {graph.edges
                      .filter((e) =>
                        direction === "incoming"
                          ? e.target === current.id
                          : e.source === current.id,
                      )
                      .map((edge) => (
                        <div className="fg-link-row" key={edge.id}>
                          <span
                            className={`fg-link-correlation ${edge.correlation?.startsWith("-") ? "fg-failed" : "fg-success"}`}
                          >
                            {edge.correlation ??
                              (variant === 3 ? "Not measured" : (edge.label ?? "Dependency"))}
                          </span>
                          <FGSelect
                            aria-label={`Relink ${direction} ${edge.id}`}
                            value={direction === "incoming" ? edge.source : edge.target}
                            onChange={(e) => {
                              const target = e.target.value;
                              if (target === current.id) return;
                              change({
                                ...graph,
                                edges: graph.edges.map((v) =>
                                  v.id === edge.id
                                    ? {
                                        ...v,
                                        [direction === "incoming" ? "source" : "target"]: target,
                                        correlation: undefined,
                                      }
                                    : v,
                                ),
                              });
                            }}
                          >
                            {graph.nodes
                              .filter((n) => n.id !== current.id && !n.kind)
                              .map((n) => (
                                <option key={n.id} value={n.id}>
                                  {n.title}
                                </option>
                              ))}
                          </FGSelect>
                        </div>
                      ))}
                  </div>
                ))}
              </>
            ) : editing || variant >= 2 ? (
              <>
                {!draft ? null : (
                  <>
                    <label htmlFor="fg-step-title">
                      <span className="fg-field-label">
                        Title{variant < 2 && <FieldHelp label="Title" />}
                      </span>
                      <input
                        id="fg-step-title"
                        aria-label="Title"
                        value={draft.title}
                        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      />
                    </label>
                    {variant < 2 && (
                      <label htmlFor="fg-step-detail">
                        <span className="fg-field-label">
                          Detail
                          <FieldHelp label="Detail" />
                        </span>
                        <input
                          aria-label="Detail"
                          id="fg-step-detail"
                          value={draft.detail}
                          onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
                        />
                      </label>
                    )}
                    {variant === 0 && (
                      <label>
                        <span className="fg-field-label">
                          Category
                          <FieldHelp label="Category" />
                        </span>
                        <FGSelect
                          aria-label="Category"
                          value={draft.category ?? "Action"}
                          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                        >
                          {["Webhook", "Condition", "Data", "Email", "Delay", "Action"].map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </FGSelect>
                      </label>
                    )}
                    {variant === 1 && (
                      <label>
                        <span className="fg-field-label">
                          App
                          <FieldHelp label="App" />
                        </span>
                        <FGSelect
                          aria-label="App"
                          value={draft.app ?? "Custom Code"}
                          onChange={(e) => setDraft({ ...draft, app: e.target.value })}
                        >
                          {[
                            "Stripe",
                            "Neon",
                            "Claude",
                            "ClickUp",
                            "Resend",
                            "Slack",
                            "Custom Code",
                          ].map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </FGSelect>
                      </label>
                    )}
                    {variant === 1 &&
                      graph.edges.some((edge) => edge.target === current.id && edge.label) && (
                        <label htmlFor="fg-step-path">
                          <span className="fg-field-label">
                            Path
                            <FieldHelp label="Path" />
                          </span>
                          <input
                            id="fg-step-path"
                            aria-label="Path"
                            value={
                              draft.branch ??
                              graph.edges.find((edge) => edge.target === current.id)?.label ??
                              ""
                            }
                            onChange={(event) => setDraft({ ...draft, branch: event.target.value })}
                          />
                        </label>
                      )}
                    {variant === 0 && (
                      <label>
                        <span className="fg-field-label">
                          Owner
                          <FieldHelp label="Owner" />
                        </span>
                        <FGSelect
                          aria-label="Owner"
                          value={draft.owner}
                          onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
                        >
                          {owners.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </FGSelect>
                      </label>
                    )}
                    {variant === 2 && (
                      <>
                        <label>
                          Service
                          <FGSelect
                            value={draft.app ?? "Google Cloud"}
                            onChange={(e) => setDraft({ ...draft, app: e.target.value })}
                          >
                            {[
                              "Stripe",
                              "PayPal",
                              "Redis",
                              "Ledger",
                              "Google Cloud",
                              "Slack",
                              "Action",
                            ].map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </FGSelect>
                        </label>
                        {Object.entries(draft.params ?? current.params ?? {}).map(
                          ([key, value]) => (
                            <label
                              key={key}
                              className={
                                value === "true" || value === "false" ? "fg-toggle-line" : undefined
                              }
                            >
                              {key}
                              {value === "true" || value === "false" ? (
                                <Switch
                                  aria-label={key}
                                  checked={value === "true"}
                                  onCheckedChange={(checked) =>
                                    setDraft({
                                      ...draft,
                                      params: {
                                        ...draft.params,
                                        [key]: String(checked),
                                      },
                                    })
                                  }
                                />
                              ) : (
                                <input
                                  value={value}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      params: {
                                        ...draft.params,
                                        [key]: e.target.value,
                                      },
                                    })
                                  }
                                />
                              )}
                            </label>
                          ),
                        )}
                      </>
                    )}
                    {variant === 3 && (
                      <>
                        <label>
                          Role
                          <FGSelect
                            value={draft.role ?? "Input"}
                            disabled={draft.role === "North Star"}
                            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                          >
                            {["Input", "North Star", "KPI", "Initiative"].map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </FGSelect>
                          {draft.role === "North Star" && (
                            <small>Promote another metric to hand this role on.</small>
                          )}
                        </label>
                        <div className="fg-detail-grid">
                          <label>
                            Aggregation
                            <FGSelect
                              value={draft.aggregation ?? "Sum"}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  aggregation: e.target.value,
                                })
                              }
                            >
                              {["Sum", "Average", "Last value"].map((r) => (
                                <option key={r}>{r}</option>
                              ))}
                            </FGSelect>
                          </label>
                          <label>
                            Unit
                            <FGSelect
                              value={draft.unit ?? "Count"}
                              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                            >
                              {["Count", "Percent", "Currency"].map((r) => (
                                <option key={r}>{r}</option>
                              ))}
                            </FGSelect>
                          </label>
                        </div>
                        <label>
                          Better when
                          <FGSelect
                            value={draft.better ?? "Higher is better"}
                            onChange={(e) => setDraft({ ...draft, better: e.target.value })}
                          >
                            <option>Higher is better</option>
                            <option>Lower is better</option>
                          </FGSelect>
                        </label>
                        <div className="fg-period-grid">
                          <span className="fg-caption">PERIOD</span>
                          <span className="fg-caption">VALUE</span>
                          <span className="fg-caption">CHANGE %</span>
                          {["Past 7 days", "Past 6 weeks", "Past 12 months"].map((p, i) => (
                            <div key={p} style={{ display: "contents" }}>
                              <label style={{ fontWeight: 500 }}>{p}</label>
                              <input
                                aria-label={`${p} value`}
                                type="number"
                                value={draft.value?.[i] ?? 0}
                                onChange={(e) =>
                                  setDraft({
                                    ...draft,
                                    value: (draft.value ?? [0, 0, 0]).map((v, k) =>
                                      k === i ? Number(e.target.value) : v,
                                    ),
                                  })
                                }
                              />
                              <input
                                aria-label={`${p} change`}
                                type="number"
                                step="any"
                                value={draft.change?.[i] ?? 0}
                                onChange={(e) =>
                                  setDraft({
                                    ...draft,
                                    change: (draft.change ?? [0, 0, 0]).map((v, k) =>
                                      k === i ? Number(e.target.value) : v,
                                    ),
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                        <label>
                          Goal
                          <input
                            placeholder="Leave empty for no goal"
                            value={draft.goal ?? ""}
                            onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
                          />
                        </label>
                        <label>
                          Goal progress %
                          <input
                            disabled
                            type="number"
                            min="0"
                            max="100"
                            value={draft.progress ?? 0}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                progress: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="fg-step-readonly">
                <strong>Step</strong>
                {[
                  ["Detail", current.detail],
                  ...(variant === 1
                    ? [
                        ["App", current.app],
                        [
                          "Next steps",
                          String(graph.edges.filter((e) => e.source === current.id).length),
                        ],
                        ["Last run", durationFor(current)],
                      ]
                    : [
                        ["Category", current.category],
                        ["Owner", current.owner],
                        [
                          "Incoming",
                          String(graph.edges.filter((e) => e.target === current.id).length),
                        ],
                        [
                          "Outgoing",
                          String(graph.edges.filter((e) => e.source === current.id).length),
                        ],
                      ]),
                ].map(([key, value]) => (
                  <div className="fg-detail-line" key={key}>
                    <span>{key}</span>
                    <span>
                      {key === "Owner" ? (
                        <>
                          <MiniAvatar name={String(value)} />
                          {value}
                        </>
                      ) : (
                        value
                      )}
                    </span>
                  </div>
                ))}
                {variant === 0 && <strong className="fg-detail-section">Last run</strong>}
                <div className="fg-detail-line">
                  <span>{variant === 1 ? "Result" : "Status"}</span>
                  <Badge
                    variant={
                      stateFor(current) === "Succeeded"
                        ? "success-light"
                        : stateFor(current) === "Failed"
                          ? "destructive-light"
                          : "outline"
                    }
                  >
                    <RunIcon state={stateFor(current)} />
                    {stateFor(current) === "Succeeded"
                      ? variant === 1
                        ? "Passed"
                        : "Success"
                      : variant === 1 && stateFor(current) === "Idle"
                        ? "Not run"
                        : stateFor(current)}
                  </Badge>
                </div>
                {variant === 0 && (
                  <>
                    <div className="fg-detail-line">
                      <span>Duration</span>
                      <span>{current.duration}</span>
                    </div>
                    <div className="fg-detail-line">
                      <span>Run</span>
                      <span>run_3f9a1c</span>
                    </div>
                  </>
                )}
              </div>
            )}
            {variant === 2 &&
              (stateFor(current) === "Waiting" || stateFor(current) === "Failed") && (
                <div
                  className={`fg-detail-box fg-state-note ${statusClass(stateFor(current))}`}
                  style={{ marginTop: "auto" }}
                >
                  {stateFor(current) === "Failed" ? <X /> : <CirclePause />}
                  <span>
                    {stateFor(current) === "Failed" ? "Duplicate charge id" : "Awaiting Approval"}
                  </span>
                </div>
              )}
          </div>
          <div className="fg-inspector-footer">
            {editing || variant >= 2 ? (
              <>
                <Button
                  className="fg-button"
                  variant="outline"
                  onClick={() => {
                    setDraft({ ...current });
                    if (variant < 2 || window.innerWidth < 600) setInspected(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="fg-button"
                  onClick={saveNode}
                  disabled={
                    variant >= 2 && (!draft || JSON.stringify(draft) === JSON.stringify(current))
                  }
                >
                  {variant === 3 ? "Save metric" : variant === 2 ? "Save task" : "Save step"}
                </Button>
              </>
            ) : (
              <Button
                className="fg-button"
                variant="outline"
                onClick={() => {
                  setDraft({ ...current });
                  setEditing(true);
                }}
              >
                Edit step
              </Button>
            )}
          </div>
        </FlowInspectorShell>
      )}
      <AlertDialog
        open={variant === 1 && !!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent className="fg-portal">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Step?</AlertDialogTitle>
            <AlertDialogDescription>
              {graph.nodes.find((node) => node.id === deleting)?.title} and{" "}
              {
                graph.edges.filter((edge) => edge.source === deleting || edge.target === deleting)
                  .length
              }{" "}
              connections are removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleting && remove(deleting)}>
              Delete Step
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={variant !== 1 && !!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
      >
        <DialogContent className="fg-portal sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this {variant === 3 ? "metric" : "step"}?</DialogTitle>
            <DialogDescription>
              Its connections will also be removed. You can undo this change.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleting && remove(deleting)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {chosen && variant === 2 && stateFor(chosen) === "Failed" && !current && (
        <Button className="fg-button absolute right-6 bottom-6" onClick={() => approve(chosen.id)}>
          <RotateCcw />
          Retry task
        </Button>
      )}
    </div>
  );
}
