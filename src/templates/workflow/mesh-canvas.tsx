import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileJson, PanelRight, X } from "lucide-react";
import Whiteboard, { type WhiteboardHeaderControls } from "@/blocks/application/whiteboard";
import { ResponsiveAssistantPanel } from "@/blocks/application/shells/responsive-assistant";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { designScene } from "./mesh-canvas-data";
import { MeshHeader } from "./mesh-header";
import { MeshAssistant } from "./mesh-assistant";
import "./mesh-documents.css";

/** The reference changes pane mode at 1120px of actual board workspace. */
function MeshBoardPanelMode({
  compact,
  controls,
}: {
  compact: boolean;
  controls: WhiteboardHeaderControls;
}) {
  const previousMode = useRef<boolean | null>(null);
  const { panelOpen, togglePanel } = controls;
  useLayoutEffect(() => {
    if (previousMode.current === compact) return;
    previousMode.current = compact;
    const open = !compact;
    if (panelOpen !== open) togglePanel();
  }, [compact, panelOpen, togglePanel]);
  return null;
}

/** The full Block owns drawing, transforms, bindings, history and persistence. */
export default function MeshCanvas({ block, onHome }: BlockProps & { onHome: () => void }) {
  const [initialScene] = useState(() => ({
    name: "Route Planner Launch Map",
    shapes: designScene(),
  }));
  const [tab, setTab] = useState("board");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const page = useRef<HTMLDivElement>(null);
  const [compactPanel, setCompactPanel] = useState(true);
  useLayoutEffect(() => {
    const workspace = page.current?.querySelector<HTMLElement>(".wb-workspace");
    if (!workspace) return;
    setCompactPanel(workspace.getBoundingClientRect().width < 1120);
    const observer = new ResizeObserver(([entry]) => {
      setCompactPanel(entry.contentRect.width < 1120);
    });
    observer.observe(workspace);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={page} className="mesh-engine-page mesh-canvas-page">
      <Whiteboard
        block={block}
        initialScene={initialScene}
        storageKey="bricklane:mesh:canvas:v2"
        initialViewOnly={new URLSearchParams(location.search).get("mode") === "view"}
        renderPanel={(content, controls) =>
          compactPanel ? (
            <ResponsiveAssistantPanel
              modal
              title={controls.scene.name}
              description="Frames, library and history."
              onClose={controls.togglePanel}
              className="mesh-board-dialog"
            >
              <div className="mesh-board-dialog-header">
                <div>
                  <p className="mesh-board-dialog-title">{controls.scene.name}</p>
                  <p className="mesh-board-dialog-description">Frames, library and history</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close board panel"
                  onClick={controls.togglePanel}
                >
                  <X />
                </Button>
              </div>
              {content}
            </ResponsiveAssistantPanel>
          ) : (
            content
          )
        }
        renderHeader={(controls) => (
          <>
            <MeshBoardPanelMode compact={compactPanel} controls={controls} />
            <MeshHeader
              title="Canvas"
              status={!controls.ready ? "Loading…" : controls.saving ? "Saving…" : "Saved"}
              onHome={onHome}
              onAskAI={() => setAssistantOpen((open) => !open)}
              assistantOpen={assistantOpen}
              readOnly={controls.viewOnly}
              onReadOnlyChange={controls.setViewOnly}
              navigation={
                <Tabs value={tab} onValueChange={setTab} className="mesh-board-tabs">
                  <TabsList variant="line" aria-label="Canvas views">
                    <TabsTrigger value="board">Board</TabsTrigger>
                    <TabsTrigger value="outline">Outline</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                </Tabs>
              }
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mesh-header-action"
                    aria-label="Export canvas"
                    disabled={!controls.ready}
                  >
                    <Download />
                    <span>Export</span>
                    <ChevronDown className="mesh-export-chevron" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={controls.exportSvg}>Export SVG</DropdownMenuItem>
                  <DropdownMenuItem onSelect={controls.exportPng}>Export PNG</DropdownMenuItem>
                  <DropdownMenuItem onSelect={controls.saveBoard}>
                    <FileJson />
                    Save board file
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Board panel"
                aria-pressed={controls.panelOpen}
                onClick={controls.togglePanel}
              >
                <PanelRight />
              </Button>
            </MeshHeader>
            {assistantOpen && (
              <MeshAssistant
                key="canvas-assistant"
                context={{
                  title: controls.scene.name,
                  kind: "canvas",
                  text: controls.scene.shapes
                    .filter((shape) => shape.text)
                    .map((shape) => shape.text)
                    .join("\n"),
                  sources: controls.scene.shapes
                    .filter((shape) => shape.kind === "frame")
                    .map((shape) => ({
                      id: shape.id,
                      title: shape.text || "Untitled frame",
                      text: controls.scene.shapes
                        .filter(
                          (item) =>
                            item.kind !== "frame" &&
                            item.x >= shape.x &&
                            item.x < shape.x + shape.w &&
                            item.y >= shape.y &&
                            item.y < shape.y + shape.h,
                        )
                        .map((item) => item.text)
                        .filter(Boolean)
                        .join("\n"),
                    })),
                }}
                onClose={() => setAssistantOpen(false)}
              />
            )}
          </>
        )}
      />
    </div>
  );
}
