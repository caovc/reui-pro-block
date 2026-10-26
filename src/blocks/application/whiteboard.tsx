import { useEffect, useRef, useState, type ReactNode } from "react";
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
  MoreHorizontal,
  Minus,
  MousePointer2,
  PanelRight,
  Pencil,
  Plus,
  Share2,
  Square,
  Type,
  X,
} from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrement,
  NumberFieldIncrement,
} from "@/components/reui/number-field";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ColorPicker,
  ColorPickerTrigger,
  ColorPickerSwatch,
  ColorPickerContent,
} from "@/components/reui/color-picker";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import "../reference.css";
import "./whiteboard.css";

import { colors, stamp, designScene, sprintScene } from "./whiteboard-data";
import type { Tool, Shape, Scene } from "./whiteboard-data";
import { WhiteboardEngine } from "./whiteboard-engine";
import type { WhiteboardEngineHandle } from "./whiteboard-engine";
import "./whiteboard-engine.css";

export type WhiteboardHeaderControls = {
  scene: Scene;
  ready: boolean;
  saving: boolean;
  viewOnly: boolean;
  setViewOnly: (value: boolean) => void;
  panelOpen: boolean;
  togglePanel: () => void;
  exportSvg: () => Promise<void>;
  exportPng: () => Promise<void>;
  saveBoard: () => void;
};

const originalPanel = (content: ReactNode) => content;

export default function Whiteboard({
  block,
  initialScene,
  storageKey,
  renderHeader,
  renderPanel = originalPanel,
  initialViewOnly = false,
}: BlockProps & {
  initialScene?: Scene;
  storageKey?: string;
  renderHeader?: (controls: WhiteboardHeaderControls) => ReactNode;
  renderPanel?: (
    content: ReactNode,
    controls: Pick<WhiteboardHeaderControls, "scene" | "panelOpen" | "togglePanel">,
  ) => ReactNode;
  initialViewOnly?: boolean;
}) {
  const sprint = block.id === "whiteboard-2";
  const engine = useRef<WhiteboardEngineHandle>(null);
  const [engineReady, setEngineReady] = useState(false);

  const [scene, setScene] = useState<Scene>(
    () =>
      initialScene ?? {
        name: sprint ? "Sprint 42 Planning" : "Checkout Review",
        shapes: sprint ? sprintScene() : designScene(),
      },
  );

  const [tool, setTool] = useState<Tool>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(60);
  const [grid, setGrid] = useState(false);
  const [snap, setSnap] = useState(false);
  const [viewOnly, setViewOnly] = useState(initialViewOnly);
  const [panel, setPanel] = useState(true);
  const [panelTab, setPanelTab] = useState(sprint ? "plan" : "frames");
  const [frame, setFrame] = useState(0);
  const [wholeBoard, setWholeBoard] = useState(true);
  const [boardQuery, setBoardQuery] = useState("");
  const [versionName, setVersionName] = useState("");
  const [versions, setVersions] = useState<{ name: string; scene: Scene }[]>([]);
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

  const canvasWrap = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 672 });
  useEffect(() => {
    const element = canvasWrap.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setCanvasSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

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
  const committedPoints = lanePoints.slice(0, 3).reduce((sum, points) => sum + points, 0);
  function togglePresent() {
    const next = !presenting;
    setPresenting(next);
    setViewOnly(next);
    setSelected(null);
    setTool("select");
    if (next) {
      setFrame(0);
      setZoom(Math.min(110, Math.round((canvasSize.width * 84) / ((frames[0]?.w || 620) + 100))));
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
        x: (scene.shapes.find((shape) => shape.id === `lane${lane}`)?.x ?? lane * 416) + 40,
        y: 316 + count * 92,
        w: 240,
        h: 76,
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
    if (viewOnly || !engineReady || !engine.current?.replaceScene(next)) return;
    setScene(next);
    setDirty(false);
  }
  function updateShapes(next: Shape[]) {
    commit({ ...scene, native: undefined, shapes: next });
  }
  function selectFrame(i: number) {
    setWholeBoard(false);
    const next = (i + frames.length) % frames.length;
    setFrame(next);
    const s = frames[next];
    if (s) {
      setPan({ x: s.x - 50, y: s.y - (presenting ? 130 : 80) });
      if (presenting) setZoom(Math.min(150, Math.round((canvasSize.width * 84) / (s.w + 100))));
    }
  }
  function addNote() {
    const id = stamp();
    updateShapes([
      ...scene.shapes,
      {
        id,
        kind: "note",
        x: 120 + (scene.shapes.length % 6) * 34 + pan.x,
        y: 140 + (scene.shapes.length % 5) * 28 + pan.y,
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
  function download(content: string | Blob, name: string, type = "application/json") {
    const url = URL.createObjectURL(
      typeof content === "string" ? new Blob([content], { type }) : content,
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function exportSvg() {
    return engine.current?.exportSvg() ?? "";
  }
  async function exportPng() {
    const blob = await engine.current?.exportPng();
    if (blob) download(blob, `${scene.name}.png`);
  }
  async function downloadSvg() {
    download(await exportSvg(), `${scene.name}.svg`, "image/svg+xml");
  }
  async function downloadBoard() {
    const content = engine.current?.serialize();
    if (content) download(content, `${scene.name}.excalidraw`);
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
  const togglePanel = () => setPanel(!panel);
  const headerControls: WhiteboardHeaderControls = {
    scene,
    ready: engineReady,
    saving: dirty,
    viewOnly,
    setViewOnly,
    panelOpen: panel,
    togglePanel,
    exportSvg: downloadSvg,
    exportPng,
    saveBoard: downloadBoard,
  };
  return (
    <div className="reui-reference wb-root" data-presenting={presenting} aria-busy={!engineReady}>
      <fieldset className="contents" disabled={!engineReady}>
        {renderHeader ? (
          renderHeader(headerControls)
        ) : (
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
                  <Button variant="ghost" aria-label="On this board, 3 here, 1 away">
                    <span className="flex">
                      {["AM", "PC", "OR"].map((name) => (
                        <Avatar
                          className="-ml-2 size-6 border-2 border-background first:ml-0"
                          key={name}
                        >
                          <AvatarFallback className="text-[8px]">{name}</AvatarFallback>
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
                        <DropdownMenuItem onSelect={downloadSvg}>Export SVG</DropdownMenuItem>
                        <DropdownMenuItem onSelect={exportPng}>Export PNG</DropdownMenuItem>
                        <DropdownMenuItem onSelect={downloadBoard}>
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
        )}
        <div className="wb-workspace">
          <div className="wb-canvas-wrap" ref={canvasWrap}>
            <div className="wb-topbar">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Board menu">
                    <Menu />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={() => engine.current?.openFile()}>
                      Open board file
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={downloadBoard}>Save board</DropdownMenuItem>
                    <DropdownMenuItem onSelect={downloadSvg}>Export SVG</DropdownMenuItem>
                    <DropdownMenuItem onSelect={exportPng}>Export PNG</DropdownMenuItem>
                    {sprint && (
                      <DropdownMenuItem
                        onSelect={async () => {
                          const summary = `# ${scene.name}\n\n${laneMeta
                            .map(
                              (lane, index) =>
                                `## ${lane.name} (${lanePoints[index]} pts)\n${scene.shapes
                                  .filter((shape) => shape.lane === index)
                                  .map((shape) => `- ${shape.text?.replaceAll("\n", " · ")}`)
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
                    Presenting · {frames[frame]?.text}, {frame + 1} of {frames.length}
                  </span>
                  <Button size="xs" variant="ghost" onClick={togglePresent}>
                    End
                  </Button>
                </div>
              ) : (
                <div className="wb-tools-cluster">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="More tools"
                        aria-pressed={["frame", "laser", "embeddable"].includes(tool)}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="reui-reference">
                      <DropdownMenuItem disabled={viewOnly} onSelect={() => setTool("frame")}>
                        Frame
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={viewOnly} onSelect={() => setTool("embeddable")}>
                        Web embed
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setTool("laser")}>
                        Laser pointer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
            <WhiteboardEngine
              ref={engine}
              onReadyChange={setEngineReady}
              scene={scene}
              tool={tool}
              zoom={zoom}
              pan={pan}
              grid={grid}
              snap={snap}
              viewOnly={viewOnly}
              storageKey={storageKey || `bricklane:whiteboard:${block.id}`}
              onChange={(next, selectedId, viewport) => {
                setScene(next);
                setSelected(selectedId);
                setDirty(false);
                setTool(viewport.tool);
                setZoom((old) => (Math.abs(old - viewport.zoom) < 0.1 ? old : viewport.zoom));
                setPan((old) =>
                  Math.abs(old.x - viewport.x) < 0.1 && Math.abs(old.y - viewport.y) < 0.1
                    ? old
                    : { x: viewport.x, y: viewport.y },
                );
              }}
            />
            {selectedShape && !viewOnly && sprint && (
              <div className="wb-selection">
                <span className="text-[10px] text-muted-foreground">{selectedShape.kind}</span>
                <ColorPicker
                  value={selectedShape.color || colors[0]}
                  onValueChange={(color) => {
                    if (!color) return;
                    setShapeColor(color);
                    updateShapes(
                      scene.shapes.map((shape) =>
                        shape.id === selected ? { ...shape, color } : shape,
                      ),
                    );
                  }}
                >
                  <ColorPickerTrigger aria-label="Story card color" size="icon-sm">
                    <ColorPickerSwatch className="size-4 rounded" />
                  </ColorPickerTrigger>
                  <ColorPickerContent />
                </ColorPicker>
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
                <NumberField
                  className="w-32"
                  value={zoom / 100}
                  onValueChange={(value) => value !== null && setZoom(Math.round(value * 100))}
                  min={0.2}
                  max={1.8}
                  step={0.1}
                  format={{ style: "percent", maximumFractionDigits: 0 }}
                  size="sm"
                >
                  <NumberFieldGroup className="border-0 shadow-none focus-within:ring-0">
                    <NumberFieldDecrement aria-label="Zoom out" />
                    <NumberFieldInput aria-label="Zoom percentage" className="w-12 px-0 text-xs" />
                    <NumberFieldIncrement aria-label="Zoom in" />
                  </NumberFieldGroup>
                </NumberField>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Reset zoom and pan"
                  onClick={() => {
                    setZoom(60);
                    setPan({ x: 0, y: 0 });
                  }}
                >
                  Fit
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
                      {presenting ? frames[frame]?.text : `${frames.length} frames`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuGroup>
                      {frames.map((item, index) => (
                        <DropdownMenuItem key={item.id} onSelect={() => selectFrame(index)}>
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
          {panel &&
            renderPanel(
              <aside className="wb-panel">
                <Tabs value={panelTab} onValueChange={setPanelTab} className="gap-0">
                  <TabsList
                    className={cn("mx-3 mt-3 flex flex-wrap h-auto", "w-[calc(100%-24px)]")}
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
                              <span className="block text-sm font-normal">{lane.name}</span>
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
                                shape.text?.toLowerCase().includes(cardQuery.toLowerCase()),
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
                        <span className="block text-xs font-medium">Whole Board</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {frames.length} frames ·{" "}
                          {scene.shapes.filter((shape) => shape.kind !== "frame").length} items
                        </span>
                      </span>
                    </Button>
                    {frames
                      .filter((shape) =>
                        shape.text?.toLowerCase().includes(boardQuery.toLowerCase()),
                      )
                      .map((s) => {
                        const i = frames.indexOf(s);
                        return (
                          <Button
                            key={s.id}
                            variant={!wholeBoard && i === frame ? "secondary" : "ghost"}
                            className="mb-2 h-auto w-full justify-start py-3"
                            onClick={() => selectFrame(i)}
                          >
                            <Square data-icon="inline-start" />
                            <span className="text-left">
                              <span className="block text-xs font-medium">{s.text}</span>
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
                      Choose a frame to navigate. Drag with the hand tool to move around the canvas.
                    </p>
                  </TabsContent>
                  <TabsContent value="templates" className="wb-panel-body">
                    {["Design review", "Sprint planning", "Blank canvas"].map((name) => (
                      <Button
                        className="mb-3 w-full justify-start"
                        key={name}
                        variant="outline"
                        onClick={() => template(name)}
                      >
                        <Grid2X2 data-icon="inline-start" />
                        {name}
                      </Button>
                    ))}
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
                      <p className="mt-6 text-xs text-muted-foreground">No saved versions yet.</p>
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
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      Select objects and use ⌘D / Ctrl+D or the native context menu to duplicate
                      them.
                    </p>
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
                              const shape = scene.shapes.find((item) => item.id === entry.shapeId);
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
                            onClick={() => setDecisions(decisions.filter((_, i) => i !== index))}
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
              </aside>,
              { scene, panelOpen: panel, togglePanel },
            )}
        </div>
        <Dialog open={voting} onOpenChange={setVoting}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Planning poker</DialogTitle>
              <DialogDescription>
                {selectedShape?.text?.split("\n")[0] || "Estimate this story"} · Choose story
                points, then reveal the local ballots.
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
                  <div className="rounded-lg border p-3 text-center" key={ballot.name}>
                    <p className="text-xl font-semibold">{ballot.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{ballot.name}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Other ballots are seeded demo values. No network session is connected.
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
              <DialogTitle>{selected ? "Edit shape text" : "Add text to the board"}</DialogTitle>
              <DialogDescription>Use a line break to create a new line.</DialogDescription>
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
                  updateShapes(scene.shapes.map((s) => (s.id === selected ? { ...s, text } : s)));
                else {
                  const p = { x: pan.x + 150, y: pan.y + 150 };
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
              }}
            >
              Save text
            </Button>
          </DialogContent>
        </Dialog>
      </fieldset>
    </div>
  );
}
