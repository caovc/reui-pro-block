import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Monitor,
  RotateCcw,
  Smartphone,
  Tablet,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import type { BlockMeta } from "@/data/types";
import { blockKey } from "@/data/catalog";
import { BlockRenderer } from "@/blocks/renderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useGlobalTheme } from "./global-theme-store";
import "./block-preview.css";
const SourcePanel = lazy(() => import("./source-panel").then((m) => ({ default: m.SourcePanel })));
function IconTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
export function PreviewPanel({ block }: { block: BlockMeta; dark: boolean }) {
  const { theme, dark } = useGlobalTheme();
  const previewDark = dark;
  const [tab, setTab] = useState("preview");
  const [device, setDevice] = useState("desktop");
  const [revision, setRevision] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const sourceTrigger = useRef<HTMLButtonElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const [frameReady, setFrameReady] = useState(false);
  const query = new URLSearchParams({
    preset: JSON.stringify(theme),
    theme: previewDark ? "dark" : "light",
  });
  const previewUrl = `${location.pathname}#/preview/${blockKey(block)}?${query}`;
  const [initialUrl] = useState(previewUrl);
  const presetLink = `${location.origin}${location.pathname}#/block/${blockKey(block)}?${query}`;
  const syncTheme = useCallback(() => {
    iframe.current?.contentWindow?.postMessage(
      { type: "reui-preview-theme", theme, dark: previewDark },
      location.origin,
    );
  }, [theme, previewDark]);
  useEffect(() => {
    syncTheme();
  }, [syncTheme]);
  const [canvasWidth, setCanvasWidth] = useState(1100);
  const canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new ResizeObserver(
      (entries) => entries[0].contentRect.width > 0 && setCanvasWidth(entries[0].contentRect.width),
    );
    if (canvas.current) observer.observe(canvas.current);
    return () => observer.disconnect();
  }, [tab]);
  const desired =
    device === "mobile" ? 390 : device === "tablet" ? 768 : Math.max(1000, canvasWidth);
  const scale = Math.max(0.1, Math.min(1, canvasWidth / desired));
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(presetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link");
    }
  }
  return (
    <div className="preview-section">
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        <div className="preview-toolbar">
          <div className="flex items-center gap-3">
            <TabsList className="h-8">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>
            <Badge variant="outline" className="hidden sm:inline-flex">
              {block.id}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {tab === "preview" && (
              <>
                <ToggleGroup
                  type="single"
                  value={device}
                  onValueChange={(value) => value && setDevice(value)}
                  size="sm"
                  className="hidden sm:flex"
                  aria-label="Preview viewport"
                >
                  <ToggleGroupItem value="desktop" aria-label="Desktop viewport">
                    <Monitor />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="tablet" aria-label="Tablet viewport">
                    <Tablet />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="mobile" aria-label="Mobile viewport">
                    <Smartphone />
                  </ToggleGroupItem>
                </ToggleGroup>
                <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />
                <IconTip label="Reset preview">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Reset preview"
                    onClick={() => {
                      setRevision((n) => n + 1);
                      setFrameReady(false);
                    }}
                  >
                    <RotateCcw />
                  </Button>
                </IconTip>
              </>
            )}
            <IconTip label="Copy link">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Copy block link"
                onClick={copyLink}
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </IconTip>
            <IconTip label="Open preview in new tab">
              <Button variant="ghost" size="icon-sm" asChild>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open isolated preview"
                >
                  <ExternalLink />
                </a>
              </Button>
            </IconTip>
          </div>
        </div>
        <div className="preview-workspace">
          <div className="preview-workspace-main">
            <TabsContent value="preview" className="preview-content">
              <div ref={canvas} className="preview-canvas" data-device={device}>
                <div
                  className="preview-frame-wrap"
                  style={{
                    width: desired * scale,
                    height: Math.max(640, 760 * scale),
                  }}
                >
                  <iframe
                    key={`${block.id}-${revision}`}
                    ref={iframe}
                    title={`${block.name} live preview`}
                    src={initialUrl}
                    onLoad={() => {
                      setFrameReady(true);
                      syncTheme();
                    }}
                    style={{
                      width: desired,
                      height: Math.max(760, 640 / scale),
                      transform: `scale(${scale})`,
                    }}
                    className="live-frame"
                  />
                  {!frameReady && (
                    <div className="absolute inset-0 bg-background p-10">
                      <Skeleton className="h-10 w-48" />
                      <Skeleton className="mt-8 h-80 w-full" />
                    </div>
                  )}
                </div>
              </div>
              <div className="preview-status">
                <span>
                  <span className="status-dot" />
                  Interactive preview
                </span>
                <span>
                  {Math.round(desired)} px <span className="hidden sm:inline">· ReUI + React</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  ref={sourceTrigger}
                  onClick={() => setSourceOpen(true)}
                >
                  <Code2 />
                  View code
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="code">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <SourcePanel block={block} dark={dark} theme={theme} />
              </Suspense>
            </TabsContent>
          </div>
        </div>
      </Tabs>
      <Sheet open={sourceOpen} onOpenChange={setSourceOpen}>
        <SheetContent
          className="block-source-sheet"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            sourceTrigger.current?.focus();
          }}
        >
          <SheetHeader>
            <SheetTitle>{block.name}</SheetTitle>
            <SheetDescription>Installation and source code</SheetDescription>
          </SheetHeader>
          <div className="block-source-scroll">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              {sourceOpen && <SourcePanel block={block} dark={dark} theme={theme} />}
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
export function IsolatedPreview({ block }: { block: BlockMeta }) {
  useEffect(() => {
    document.title = `${block.name} — Preview`;
  }, [block.name]);
  return (
    <div className="isolated-preview" data-block-id={block.id}>
      <BlockRenderer block={block} />
    </div>
  );
}
