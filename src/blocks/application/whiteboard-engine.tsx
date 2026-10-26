import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Excalidraw,
  CaptureUpdateAction,
  exportToBlob,
  exportToSvg,
  getSceneVersion,
  serializeAsJSON,
  loadFromBlob,
  restoreElements,
} from "@excalidraw/excalidraw";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  AppState,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { Scene, Tool } from "./whiteboard-data";
import { sceneElements, mergeScene, readScene } from "./whiteboard-elements";
import { toast } from "sonner";
import { prepareWhiteboardFonts } from "./whiteboard-fonts";
import "@excalidraw/excalidraw/index.css";

export type WhiteboardEngineHandle = {
  replaceScene: (scene: Scene) => boolean;
  exportSvg: () => Promise<string>;
  exportPng: () => Promise<Blob>;
  serialize: () => string;
  openFile: () => void;
};
type Props = {
  scene: Scene;
  tool: Tool;
  zoom: number;
  pan: { x: number; y: number };
  grid: boolean;
  snap: boolean;
  viewOnly: boolean;
  storageKey: string;
  onReadyChange?: (ready: boolean) => void;
  onChange: (
    scene: Scene,
    selected: string | null,
    viewport: { zoom: number; x: number; y: number; tool: Tool },
  ) => void;
};
type PreparedScene = {
  restored: boolean;
  source: Scene;
  storageKey: string;
  zoom: number;
  data: ExcalidrawInitialDataState;
};
type PendingSave = {
  elements: readonly ExcalidrawElement[];
  state: AppState;
  files: BinaryFiles;
  storageKey: string;
};

function persistSnapshot(snapshot: PendingSave) {
  try {
    const saved = JSON.parse(
      serializeAsJSON(snapshot.elements, snapshot.state, snapshot.files, "local"),
    );
    saved.appState = {
      ...saved.appState,
      scrollX: snapshot.state.scrollX,
      scrollY: snapshot.state.scrollY,
      zoom: snapshot.state.zoom,
    };
    localStorage.setItem(snapshot.storageKey, JSON.stringify(saved));
  } catch {
    toast.error("Browser storage is full. Export the board to keep your changes.");
  }
}

function prepareInitialScene(props: Props, useStoredScene: boolean): PreparedScene {
  let saved: {
    type?: string;
    elements?: readonly ExcalidrawElement[];
    files?: BinaryFiles;
    appState?: Partial<AppState>;
  } | null = null;
  if (useStoredScene) {
    try {
      saved = JSON.parse(localStorage.getItem(props.storageKey) || "null");
    } catch {
      /* A fresh board stays usable when storage is unavailable. */
    }
  }
  const restored = saved?.type === "excalidraw" && Array.isArray(saved.elements);
  return {
    restored,
    source: props.scene,
    storageKey: props.storageKey,
    zoom: saved?.appState?.zoom?.value ?? props.zoom / 100,
    data:
      restored && saved
        ? {
            elements: restoreElements(saved.elements, null),
            files: saved.files || {},
            appState: {
              ...saved.appState,
              collaborators: new Map(),
              viewBackgroundColor: saved.appState?.viewBackgroundColor || "transparent",
            },
          }
        : {
            elements: sceneElements(props.scene),
            appState: {
              zoom: { value: (props.zoom / 100) as AppState["zoom"]["value"] },
              scrollX: -props.pan.x,
              scrollY: -props.pan.y,
              viewBackgroundColor: "transparent",
              gridSize: 20,
              currentItemFontFamily: props.scene.name.includes("Sprint") ? 6 : 5,
              currentItemRoughness: props.scene.name.includes("Sprint") ? 0 : 1,
            },
          },
  };
}

const toolTypes = { select: "selection", rect: "rectangle", draw: "freedraw" } as const;
const toTool = (tool: string) =>
  ({ selection: "select", rectangle: "rect", freedraw: "draw" }[tool] || tool) as Tool;

export const WhiteboardEngine = forwardRef<WhiteboardEngineHandle, Props>(
  function WhiteboardEngine(props, ref) {
    const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
    const file = useRef<HTMLInputElement>(null);
    const host = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState<"light" | "dark">("light");
    useLayoutEffect(() => {
      const updateTheme = () => setTheme(host.current?.closest(".dark") ? "dark" : "light");
      updateTheme();
      const observer = new MutationObserver(updateTheme);
      let ancestor: HTMLElement | null = host.current;
      while (ancestor) {
        observer.observe(ancestor, { attributes: true, attributeFilter: ["class"] });
        ancestor = ancestor.parentElement;
      }
      return () => observer.disconnect();
    }, []);
    const latest = useRef(props);
    useLayoutEffect(() => {
      latest.current = props;
    });
    const [ready, setReady] = useState(false);
    const readyRef = useRef(false);
    const prepared = useRef<PreparedScene | null>(null);
    const centered = useRef(false);
    useLayoutEffect(() => {
      latest.current.onReadyChange?.(false);
    }, []);
    const lastSignature = useRef("");
    const viewportInitialized = useRef(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSave = useRef<PendingSave | null>(null);
    const [initialData] = useState(() =>
      prepareWhiteboardFonts()
        .catch(() => {
          toast.error("Drawing fonts could not load. Check the local font assets and reload.");
        })
        .then(() => {
          const current = latest.current;
          // A board selected during loading takes precedence over the original mount seed.
          const useStored =
            current.storageKey !== props.storageKey || current.scene === props.scene;
          const resolution = prepareInitialScene(current, useStored);
          prepared.current = resolution;
          return resolution.data;
        }),
    );
    useEffect(() => {
      const initial = prepared.current;
      if (!api || !ready || !initial || centered.current) return;
      centered.current = true;
      if (!initial.restored)
        api.scrollToContent(api.getSceneElements(), {
          fitToContent: true,
          minZoom: initial.zoom,
          maxZoom: initial.zoom,
          animate: false,
        });
    }, [api, ready]);
    useEffect(() => {
      if (!api) return;
      const current = api.getAppState();
      const type = toolTypes[props.tool as keyof typeof toolTypes] || props.tool;
      if (current.activeTool.type !== type)
        api.setActiveTool({ type } as Parameters<ExcalidrawImperativeAPI["setActiveTool"]>[0]);
    }, [api, props.tool]);
    useLayoutEffect(() => {
      if (!api || !ready) return;
      if (!viewportInitialized.current) {
        viewportInitialized.current = true;
        return;
      }
      const state = api.getAppState();
      if (
        Math.abs(state.zoom.value * 100 - props.zoom) > 0.1 ||
        Math.abs(state.scrollX + props.pan.x) > 0.1 ||
        Math.abs(state.scrollY + props.pan.y) > 0.1
      )
        api.updateScene({
          appState: {
            zoom: { value: (props.zoom / 100) as AppState["zoom"]["value"] },
            scrollX: -props.pan.x,
            scrollY: -props.pan.y,
          },
          captureUpdate: CaptureUpdateAction.NEVER,
        });
    }, [api, props.zoom, props.pan, ready]);
    useEffect(() => {
      const flush = () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = null;
        const snapshot = pendingSave.current;
        if (!snapshot) return;
        persistSnapshot(snapshot);
        pendingSave.current = null;
      };
      window.addEventListener("pagehide", flush);
      return () => {
        window.removeEventListener("pagehide", flush);
        flush();
      };
    }, []);
    useImperativeHandle(
      ref,
      () => ({
        replaceScene: (scene) => {
          if (!api || !readyRef.current || latest.current.viewOnly) return false;
          api.updateScene({
            elements: mergeScene(api.getSceneElements(), scene),
            captureUpdate: CaptureUpdateAction.IMMEDIATELY,
          });
          if (scene.files) api.addFiles(Object.values(scene.files));
          return true;
        },
        exportSvg: async () => {
          if (!api || !readyRef.current) return "";
          const result = await exportToSvg({
            elements: api.getSceneElements(),
            appState: {
              ...api.getAppState(),
              viewBackgroundColor: "#ffffff",
              exportBackground: true,
              exportWithDarkMode: false,
            },
            files: api.getFiles(),
            exportPadding: 24,
          });
          return new XMLSerializer().serializeToString(result);
        },
        exportPng: async () => {
          if (!api || !readyRef.current) throw new Error("The board is still loading");
          return exportToBlob({
            elements: api.getSceneElements(),
            appState: {
              ...api.getAppState(),
              viewBackgroundColor: "#ffffff",
              exportBackground: true,
              exportWithDarkMode: false,
            },
            files: api.getFiles(),
            mimeType: "image/png",
            exportPadding: 24,
          });
        },
        serialize: () =>
          api && readyRef.current
            ? serializeAsJSON(
                api.getSceneElements(),
                { ...api.getAppState(), name: latest.current.scene.name },
                api.getFiles(),
                "local",
              )
            : "",
        openFile: () => {
          if (readyRef.current && !latest.current.viewOnly) file.current?.click();
        },
      }),
      [api],
    );
    function onChange(elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) {
      if (!readyRef.current) {
        const initial = prepared.current;
        if (!initial || state.isLoading) return;
        const current = latest.current;
        if (initial.source !== current.scene || initial.storageKey !== current.storageKey) {
          if (!api) return;
          const resolution = prepareInitialScene(
            current,
            initial.storageKey !== current.storageKey,
          );
          prepared.current = resolution;
          api.updateScene({
            elements: resolution.data.elements,
            appState: {
              ...api.getAppState(),
              ...resolution.data.appState,
              viewModeEnabled: true,
            },
            captureUpdate: CaptureUpdateAction.NEVER,
          });
          if (resolution.data.files) api.addFiles(Object.values(resolution.data.files));
          return;
        }
        readyRef.current = true;
        setReady(true);
        current.onReadyChange?.(true);
      }
      const selected =
        Object.keys(state.selectedElementIds).find((id) =>
          elements.find((element) => element.id === id && element.type !== "text"),
        ) ||
        Object.keys(state.selectedElementIds)[0] ||
        null;
      const signature = `${getSceneVersion(elements)}:${selected}:${state.zoom.value}:${state.scrollX}:${state.scrollY}:${state.activeTool.type}`;
      if (lastSignature.current === signature) return;
      lastSignature.current = signature;
      const scene = { ...readScene(elements, latest.current.scene.name), files };
      latest.current.onChange(scene, selected, {
        zoom: state.zoom.value * 100,
        x: -state.scrollX,
        y: -state.scrollY,
        tool: toTool(state.activeTool.type),
      });
      pendingSave.current = { elements, state, files, storageKey: latest.current.storageKey };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const snapshot = pendingSave.current;
        if (snapshot) persistSnapshot(snapshot);
        pendingSave.current = null;
        saveTimer.current = null;
      }, 300);
    }
    return (
      <div
        className="bricklane-whiteboard-engine"
        ref={host}
        role="application"
        aria-label={`${props.scene.name} drawing canvas`}
        aria-busy={!ready}
      >
        <Excalidraw
          excalidrawAPI={setApi}
          initialData={initialData}
          onChange={onChange}
          viewModeEnabled={props.viewOnly || !ready}
          gridModeEnabled={props.grid}
          objectsSnapModeEnabled={props.snap}
          theme={theme}
          langCode="en"
          name={props.scene.name}
          isCollaborating={false}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveToActiveFile: false,
              export: false,
              changeViewBackgroundColor: true,
              toggleTheme: false,
            },
            tools: { image: true },
          }}
        />
        {!ready && (
          <div className="wb-engine-loading" role="status">
            Loading board…
          </div>
        )}
        <input
          hidden
          ref={file}
          type="file"
          accept=".excalidraw,.json,application/json"
          aria-label="Open whiteboard file"
          onChange={async (event) => {
            const selected = event.target.files?.[0];
            if (!selected || !api || !readyRef.current || latest.current.viewOnly) return;
            try {
              const data = await loadFromBlob(selected, null, api.getSceneElements());
              api.updateScene({
                elements: data.elements,
                appState: data.appState,
                captureUpdate: CaptureUpdateAction.IMMEDIATELY,
              });
              if (data.files) api.addFiles(Object.values(data.files));
              api.scrollToContent();
              toast.success("Board opened");
            } catch {
              toast.error("Choose a valid Excalidraw board file");
            }
            event.target.value = "";
          }}
        />
      </div>
    );
  },
);
