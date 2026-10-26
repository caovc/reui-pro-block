import type { ReactNode } from "react";
import {
  Hand,
  LockKeyhole,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  Undo2,
  UnlockKeyhole,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FlowCanvasToolbarProps {
  variant: 0 | 1;
  mode: string;
  onModeChange: (mode: string) => void;
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onZoomChange: (zoom: number) => void;
  onFit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  locked: boolean;
  onLockedChange: (locked: boolean) => void;
  onTidy: () => void;
}

function ToolbarHint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <ToolbarHint label={label}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </Button>
    </ToolbarHint>
  );
}

function ToolbarSeparator() {
  return (
    <Separator
      orientation="vertical"
      decorative={false}
      className="h-4 data-vertical:self-center"
    />
  );
}

/** Uses the free Card/Toggle/Button APIs; simple layout groups retain separate corners. */
export function FlowCanvasToolbar(props: FlowCanvasToolbarProps) {
  const zoomLabel = `${Math.round(props.zoom * 100)}%`;
  return (
    <Card
      size="sm"
      role="group"
      aria-label="Canvas controls"
      className="fg-native-controls flex-row items-center gap-1 p-1"
    >
      <ToggleGroup
        type="single"
        size="sm"
        spacing={0.5}
        value={props.mode}
        onValueChange={(value) => {
          if (value === "Select" || value === "Pan") props.onModeChange(value);
        }}
        aria-label="Canvas mode"
      >
        <ToolbarHint label="Select">
          <ToggleGroupItem
            value="Select"
            aria-label="Select"
            className="px-0 aria-checked:bg-muted"
          >
            <MousePointer2 />
          </ToggleGroupItem>
        </ToolbarHint>
        <ToolbarHint label="Pan">
          <ToggleGroupItem value="Pan" aria-label="Pan" className="px-0 aria-checked:bg-muted">
            <Hand />
          </ToggleGroupItem>
        </ToolbarHint>
      </ToggleGroup>
      <ToolbarSeparator />
      <div role="group" aria-label="Zoom" className="flex items-center gap-0.5">
        <ToolbarButton label="Zoom out" onClick={props.onZoomOut}>
          <Minus />
        </ToolbarButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-12 tabular-nums"
              aria-label={`Zoom level ${zoomLabel}`}
            >
              {zoomLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="fg-portal">
            {[0.5, 0.75, 1, 1.25, 1.5].map((zoom) => (
              <DropdownMenuItem key={zoom} onSelect={() => props.onZoomChange(zoom)}>
                {zoom * 100}%
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onSelect={props.onFit}>Fit to view</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ToolbarButton label="Zoom in" onClick={props.onZoomIn}>
          <Plus />
        </ToolbarButton>
      </div>
      <ToolbarSeparator />
      {props.variant === 0 ? (
        <>
          <div role="group" aria-label="History" className="flex items-center gap-0.5">
            <ToolbarButton label="Undo" onClick={props.onUndo} disabled={!props.canUndo}>
              <Undo2 />
            </ToolbarButton>
            <ToolbarButton label="Redo" onClick={props.onRedo} disabled={!props.canRedo}>
              <Redo2 />
            </ToolbarButton>
          </div>
          <ToolbarSeparator />
          <ToolbarHint label={props.locked ? "Unlock canvas" : "Lock canvas"}>
            <Toggle
              size="sm"
              pressed={props.locked}
              onPressedChange={props.onLockedChange}
              aria-label={props.locked ? "Unlock canvas" : "Lock canvas"}
              className="px-0 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {props.locked ? <UnlockKeyhole /> : <LockKeyhole />}
            </Toggle>
          </ToolbarHint>
        </>
      ) : (
        <ToolbarButton label="Tidy tree" onClick={props.onTidy}>
          <Workflow />
        </ToolbarButton>
      )}
    </Card>
  );
}
