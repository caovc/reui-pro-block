import { Children, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePanelRef } from "react-resizable-panels";
import { AppShellLayout } from "@/components/reui/layout";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useSidebar } from "@/components/ui/sidebar";
import "./echo-resizable-layout.css";

// Actual ReUI c-resizable-1 composition, using the same project primitives as
// Pro ChatWorkspace. The SidebarProvider remains the only collapse/Sheet owner.
export function EchoResizableLayout({ children }: { children: ReactNode }) {
  return (
    <AppShellLayout>
      <EchoResizableContent>{children}</EchoResizableContent>
    </AppShellLayout>
  );
}

function EchoResizableContent({ children }: { children: ReactNode }) {
  const { isMobile, open, setOpen, toggleSidebar } = useSidebar();
  const panel = usePanelRef();
  const expandedSize = useRef(248);
  // The panel default is a mount-only value; the Sidebar still owns open state.
  const [initialSize] = useState(() => (open ? 248 : 48));
  const wasMobile = useRef(isMobile);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [sidebar, ...main] = Children.toArray(children);

  useLayoutEffect(() => {
    if (isMobile) {
      wasMobile.current = true;
      pointerStart.current = null;
      return;
    }
    if (!panel.current) return;
    if (wasMobile.current) {
      if (open) panel.current.resize(`${expandedSize.current}px`);
      else panel.current.collapse();
      wasMobile.current = false;
    } else if (open) {
      panel.current.expand();
    } else {
      panel.current.collapse();
    }
  }, [isMobile, open, panel]);

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      disabled={isMobile}
      className="echo-resizable-layout"
    >
      <ResizablePanel
        id="echo-sidebar-panel"
        panelRef={panel}
        defaultSize={`${initialSize}px`}
        minSize="210px"
        maxSize="360px"
        collapsedSize="48px"
        collapsible
        className="echo-resizable-sidebar"
        onResize={(size) => {
          // The same Sidebar component stays mounted on both sides of the
          // breakpoint. Its mobile Sheet is a Portal outside the hidden panel.
          if (isMobile || wasMobile.current || size.inPixels <= 0) return;
          const nextOpen = size.inPixels > 48.5;
          if (nextOpen) expandedSize.current = size.inPixels;
          if (nextOpen !== open) setOpen(nextOpen);
        }}
      >
        {sidebar}
      </ResizablePanel>
      <ResizableHandle
        title="Drag to resize. Click to collapse."
        className="echo-resizable-handle"
        onPointerDownCapture={(event) => {
          pointerStart.current = { x: event.clientX, y: event.clientY };
        }}
        onClick={(event) => {
          const start = pointerStart.current;
          pointerStart.current = null;
          // This only distinguishes a click from a drag. Width, pointer
          // resizing and keyboard steps belong entirely to the native engine.
          if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 2) {
            toggleSidebar();
          }
        }}
      />
      <ResizablePanel id="echo-main-panel" minSize="0px" className="echo-resizable-main">
        {main}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
