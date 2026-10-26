import { useEffect, useRef, useState } from "react";
import {
  Clock3,
  Fullscreen,
  List,
  Map,
  PanelLeft,
  Pause,
  Play,
  Plus,
  Search,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFleet, type DispatchDialog } from "./fleet-context";
import { FleetProvider } from "./fleet-store";
import { FleetMap, type FleetMapHandle } from "./fleet-map";
import { FleetGrid } from "./fleet-grid";
import { FleetPanel } from "./fleet-panel";
import { FleetCommand } from "./fleet-command";
import { FleetExceptions } from "./fleet-events";
import { VehicleSheet } from "./vehicle-sheet";
import { DispatchActions } from "./stop-actions";
import { useDispatchFocus } from "./fleet-focus";
import { dispatchTime } from "./fleet-model";
import type { Coordinate } from "./fleet-types";
import "../../reference.css";
import "./dispatch-map.css";

function DispatchWorkspace() {
  const { state, act } = useFleet();
  const [view, setView] = useState("map");
  const [fleetOpen, setFleetOpen] = useState(false);
  const [phone, setPhone] = useState(() => matchMedia("(max-width: 767px)").matches);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [exceptionsOpen, setExceptionsOpen] = useState(false);
  const [dialog, setDialog] = useState<DispatchDialog>(null);
  const [placing, setPlacing] = useState(false);
  const [pickedPosition, setPickedPosition] = useState<Coordinate | null>(null);
  const [fullscreenError, setFullscreenError] = useState("");
  const map = useRef<FleetMapHandle>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const focus = useDispatchFocus(
    {
      fleet: fleetOpen && phone && view === "map",
      vehicle: detailsOpen,
      command: commandOpen,
      action: !!dialog && !placing,
      exceptions: exceptionsOpen,
    },
    searchButton,
    placing,
  );
  function openDetails(vehicleId?: string) {
    const resolveOrigin =
      typeof vehicleId === "string"
        ? () =>
            Array.from(document.querySelectorAll<HTMLButtonElement>(".dm-list-stage button")).find(
              (button) => button.getAttribute("aria-label") === `Select ${vehicleId}`,
            ) ?? null
        : undefined;
    focus.capture("vehicle", document.activeElement, resolveOrigin);
    setFleetOpen(false);
    setDetailsOpen(true);
  }
  function openAction(next: DispatchDialog) {
    focus.capture("action");
    setDialog(next);
    setFleetOpen(false);
  }
  useEffect(() => {
    const query = matchMedia("(max-width: 767px)");
    const update = () => setPhone(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => {
          if (!current) focus.capture("command");
          return !current;
        });
      }
      if (event.key === "Escape" && placing) setPlacing(false);
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [placing, focus]);
  const center = (position: Coordinate) => {
    setView("map");
    map.current?.center(position);
  };
  const panel = (
    <FleetPanel
      onDialog={openAction}
      onDetails={openDetails}
      onFit={() => map.current?.fit(true)}
      onCenter={center}
    />
  );
  function closeAction() {
    setDialog(null);
    setPlacing(false);
    setPickedPosition(null);
  }
  return (
    <div className="reui-reference dm-root" data-view={view}>
      <header className="dm-toolbar">
        <div className="dm-brand">
          <BrandMark className="size-7" />
          <strong>Dispatch</strong>
          <Badge variant="outline" size="sm" className="dm-demo-badge">
            Demo
          </Badge>
        </div>
        <Tabs value={view} onValueChange={setView} className="dm-view-tabs">
          <TabsList aria-label="Dispatch view">
            <TabsTrigger value="map">
              <Map />
              Map
            </TabsTrigger>
            <TabsTrigger value="list">
              <List />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="dm-simulation">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={state.running ? "Pause simulation" : "Run simulation"}
                onClick={() => act({ type: "running", value: !state.running })}
              >
                {state.running ? <Pause /> : <Play />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{state.running ? "Pause" : "Resume"} local simulation</TooltipContent>
          </Tooltip>
          <Select
            value={String(state.speed)}
            onValueChange={(value) => act({ type: "speed", value: Number(value) })}
          >
            <SelectTrigger aria-label="Simulation speed" className="dm-speed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="reui-reference">
              {[1, 2, 5, 10, 20, 60, 120].map((speed) => (
                <SelectItem key={speed} value={String(speed)}>
                  {speed}×
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="dm-clock">
            <Clock3 className="size-3.5" />
            <time>{dispatchTime(state.now)}</time>
            <span>PDT</span>
          </span>
        </div>
        <div className="dm-toolbar-actions">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Search dispatch"
                ref={searchButton}
                onClick={() => {
                  focus.capture("command");
                  setCommandOpen(true);
                }}
              >
                <Search />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search dispatch · ⌘K / Ctrl K</TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Review exceptions"
            onClick={() => {
              focus.capture("exceptions");
              setExceptionsOpen(true);
            }}
          >
            <TriangleAlert />
            <span className="dm-exceptions-label">Exceptions</span>
            <Badge variant="warning-light" size="sm">
              {state.exceptions.filter((item) => !item.acknowledged).length}
            </Badge>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="dm-fullscreen"
                aria-label="Toggle fullscreen"
                onClick={async () => {
                  try {
                    if (document.fullscreenElement) await document.exitFullscreen();
                    else if (document.documentElement.requestFullscreen)
                      await document.documentElement.requestFullscreen();
                    else
                      setFullscreenError(
                        "Fullscreen is unavailable in this browser. Dispatch remains usable in this view.",
                      );
                  } catch {
                    setFullscreenError(
                      "Fullscreen permission was declined. Dispatch remains usable in this view.",
                    );
                  }
                }}
              >
                <Fullscreen />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fullscreen</TooltipContent>
          </Tooltip>
          <Button
            size="sm"
            className="dm-new-delivery"
            aria-label="New delivery"
            onClick={() => openAction({ kind: "create" })}
          >
            <Plus />
            <span>New delivery</span>
          </Button>
        </div>
      </header>
      <main className="dm-main">
        <div className="dm-map-stage" hidden={view !== "map"}>
          <FleetMap
            ref={map}
            placing={placing}
            onList={() => setView("list")}
            onVehicle={() => {
              if (phone) focus.capture("fleet");
              setFleetOpen(phone);
            }}
            onCancelPlace={() => setPlacing(false)}
            onPlace={(position) => {
              setPickedPosition(position);
              setPlacing(false);
            }}
          />
          <aside className="dm-desktop-panel" aria-label="Fleet panel">
            {panel}
          </aside>
          <Sheet
            open={fleetOpen && phone && view === "map"}
            onOpenChange={(open) => {
              if (open) focus.capture("fleet");
              setFleetOpen(open);
            }}
          >
            <SheetTrigger asChild>
              <Button
                className="dm-fleet-handle"
                variant="outline"
                size="icon-sm"
                aria-label="Open fleet panel"
              >
                <PanelLeft />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="reui-reference dm-fleet-sheet"
              data-dm-focus-layer="fleet"
              onCloseAutoFocus={(event) => focus.restore("fleet", event)}
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Fleet panel</SheetTitle>
                <SheetDescription>
                  Fleet overview, selected route and delivery actions.
                </SheetDescription>
              </SheetHeader>
              {panel}
            </SheetContent>
          </Sheet>
        </div>
        {view === "list" && (
          <div className="dm-list-stage">
            <FleetGrid onDetails={openDetails} />
          </div>
        )}
        {state.undo.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="dm-undo"
            onClick={() => act({ type: "undo" })}
          >
            <Undo2 />
            Undo last change
          </Button>
        )}
        {fullscreenError && (
          <Alert className="dm-fullscreen-note">
            <AlertTitle>Fullscreen unavailable</AlertTitle>
            <AlertDescription>{fullscreenError}</AlertDescription>
          </Alert>
        )}
      </main>
      <FleetCommand
        open={commandOpen}
        onOpenChange={(open) => {
          if (open) focus.capture("command");
          setCommandOpen(open);
        }}
        onCloseAutoFocus={(event) => focus.restore("command", event)}
        onCenter={center}
        onSelected={() => {
          if (phone) focus.inherit("fleet", "command");
          setFleetOpen(phone);
        }}
      />
      <VehicleSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onDialog={openAction}
        onCloseAutoFocus={(event) => focus.restore("vehicle", event)}
        onCenter={center}
      />
      <DispatchActions
        dialog={dialog}
        onClose={closeAction}
        onCloseAutoFocus={(event) => focus.restore("action", event)}
        placing={placing}
        pickedPosition={pickedPosition}
        onPickMap={() => {
          setView("map");
          setDetailsOpen(false);
          setFleetOpen(false);
          setPlacing(true);
        }}
      />
      <Dialog open={exceptionsOpen} onOpenChange={setExceptionsOpen}>
        <DialogContent
          className="reui-reference dm-exceptions-dialog"
          data-dm-focus-layer="exceptions"
          onCloseAutoFocus={(event) => focus.restore("exceptions", event)}
        >
          <DialogHeader>
            <DialogTitle tabIndex={-1} data-dm-focus-fallback>
              Exceptions
            </DialogTitle>
            <DialogDescription>
              Review local fleet alerts. Acknowledging records a review; it does not repair the
              underlying fault.
            </DialogDescription>
          </DialogHeader>
          <div className="dm-exceptions-scroll">
            <FleetExceptions
              onSelected={() => {
                setExceptionsOpen(false);
                setView("map");
                if (phone) focus.inherit("fleet", "exceptions");
                setFleetOpen(phone);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DispatchMap() {
  return (
    <FleetProvider>
      <DispatchWorkspace />
    </FleetProvider>
  );
}
