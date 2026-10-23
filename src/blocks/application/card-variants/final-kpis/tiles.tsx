import { useState } from "react";
import type { ComponentProps } from "react";
import {
  Archive,
  Box,
  Boxes,
  ChartColumn,
  Copy,
  Ellipsis,
  Link,
  Package,
  Palette,
  RotateCcw,
  Shield,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react";
import {
  Frame,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import { Stage, GridFrame, ContentLink } from "../extended/common";
import "./final-kpis.css";
type Tile = {
  id: string;
  name: string;
  value: string;
  icon: typeof Box;
  status?: string;
  tone?: ComponentProps<typeof Badge>["variant"];
  trend?: "up" | "down";
};
const logistics: Tile[] = [
  {
    id: "shipments",
    name: "Shipments Today",
    value: "2,140",
    icon: Package,
    status: "+0.1% vs yesterday",
    tone: "info-light",
  },
  {
    id: "on-time",
    name: "On-Time Rate",
    value: "96.7%",
    icon: Truck,
    status: "Consistently improving",
    tone: "success-light",
    trend: "up",
  },
  {
    id: "pending",
    name: "Pending Orders",
    value: "329",
    icon: Archive,
    status: "No significant change",
    tone: "destructive-light",
  },
  {
    id: "returns",
    name: "Returns",
    value: "18",
    icon: RotateCcw,
    status: "-5.8% this week",
    tone: "warning-light",
    trend: "down",
  },
];
const inventory: Tile[] = [
  { id: "orders", name: "New Order", value: "143/pkg", icon: Box },
  { id: "low-stock", name: "Low Stock Alerts", value: "27/items", icon: Boxes },
  { id: "restocked", name: "Restocked", value: "320/items", icon: Archive },
  {
    id: "average-size",
    name: "Avg. Order Size",
    value: "3.2/items",
    icon: ChartColumn,
  },
];
function EditableTiles({ inventoryMode = false }: { inventoryMode?: boolean }) {
  const [tiles, setTiles] = useState(inventoryMode ? inventory : logistics);
  const [editing, setEditing] = useState<Tile | null>(null);
  const [removing, setRemoving] = useState<Tile | null>(null);
  const [removed, setRemoved] = useState<{ tile: Tile; index: number } | null>(
    null,
  );
  const [copied, setCopied] = useState("");
  const id = inventoryMode ? 33 : 30;
  return (
    <Stage id={id} width={944}>
      <GridFrame columns={4}>
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <FramePanel
              key={tile.id}
              data-metric-id={tile.id}
              className={`flex flex-col gap-5 ${inventoryMode ? "final-kpi-dots" : "min-h-[176px]"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <IconTile
                  variant={inventoryMode ? "elevated" : "frame"}
                  size="sm"
                  className={
                    inventoryMode ? "final-gloss bg-zinc-950 text-white" : ""
                  }
                >
                  <Icon />
                </IconTile>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${tile.name} actions`}
                    >
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={() => setEditing(tile)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              `${location.origin}${location.pathname}#/preview/application/card/card-${id}?metric=${tile.id}`,
                            );
                            setCopied(tile.name);
                          } catch {
                            setCopied("Clipboard unavailable");
                          }
                        }}
                      >
                        <Copy />
                        Copy link
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setRemoving(tile)}
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {inventoryMode ? (
                <Item className="p-0">
                  <ItemContent>
                    <ItemTitle>
                      <ContentLink
                        title={tile.name}
                        description={`Local inventory preview · ${tile.value}`}
                      >
                        {tile.name}
                      </ContentLink>
                    </ItemTitle>
                    <ItemDescription className="text-xs">
                      {tile.value}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ) : (
                <>
                  <div>
                    <FrameTitle className="text-xl tracking-tight">
                      {tile.value}
                    </FrameTitle>
                    <FrameDescription className="mt-1 text-xs text-muted-foreground/60">
                      {tile.name}
                    </FrameDescription>
                  </div>
                  <div className="mt-auto">
                    <Badge size="sm" variant={tile.tone}>
                      {tile.trend === "up" ? (
                        <TrendingUp />
                      ) : tile.trend === "down" ? (
                        <TrendingDown />
                      ) : null}
                      {tile.status}
                    </Badge>
                  </div>
                </>
              )}
            </FramePanel>
          );
        })}
      </GridFrame>
      {copied && (
        <p role="status" className="mt-3 text-xs text-muted-foreground">
          {copied === "Clipboard unavailable"
            ? copied
            : `Preview link copied for ${copied}.`}
        </p>
      )}
      {removed && (
        <Alert className="mt-3" variant="info">
          <RotateCcw />
          <AlertTitle>Tile removed from this preview</AlertTitle>
          <AlertDescription>
            {removed.tile.name} can be restored. No remote data was changed.
          </AlertDescription>
          <AlertAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTiles((current) => {
                  const next = [...current];
                  next.splice(removed.index, 0, removed.tile);
                  return next;
                });
                setRemoved(null);
              }}
            >
              Undo removal
            </Button>
          </AlertAction>
        </Alert>
      )}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit metric tile</DialogTitle>
            <DialogDescription>
              Change this local sample; the other tiles stay independent.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              setTiles((current) =>
                current.map((tile) =>
                  tile.id === editing?.id
                    ? {
                        ...tile,
                        name: String(d.get("name")),
                        value: String(d.get("value")),
                        status: inventoryMode
                          ? undefined
                          : String(d.get("status")),
                      }
                    : tile,
                ),
              );
              setEditing(null);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="metric-name">Metric label</FieldLabel>
                <Input
                  id="metric-name"
                  name="name"
                  defaultValue={editing?.name}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="metric-value">Display value</FieldLabel>
                <Input
                  id="metric-value"
                  name="value"
                  defaultValue={editing?.value}
                  required
                />
              </Field>
              {!inventoryMode && (
                <Field>
                  <FieldLabel htmlFor="metric-status">Status text</FieldLabel>
                  <Input
                    id="metric-status"
                    name="status"
                    defaultValue={editing?.status}
                    required
                  />
                </Field>
              )}
            </FieldGroup>
            <Button>Save metric</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removing?.name}?</DialogTitle>
            <DialogDescription>
              This only hides the tile in the current preview. You can undo it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removing) {
                  setRemoved({
                    tile: removing,
                    index: tiles.findIndex((t) => t.id === removing.id),
                  });
                  setTiles((current) =>
                    current.filter((t) => t.id !== removing.id),
                  );
                }
                setRemoving(null);
              }}
            >
              Remove tile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Stage>
  );
}
export function LogisticsKpis() {
  return <EditableTiles />;
}
export function InventoryCounters() {
  return <EditableTiles inventoryMode />;
}
export function AudienceReach() {
  return (
    <Stage id={31} width={960}>
      <div className="final-audience-grid">
        {[
          {
            name: "Account Followers",
            value: "102.9k",
            icon: Link,
            tone: "bg-zinc-950",
            dots: true,
          },
          {
            name: "Avg. Stream Viewers",
            value: "23.7k",
            icon: Palette,
            tone: "bg-indigo-600",
          },
          {
            name: "GitHub Stars",
            value: "93.1k",
            icon: ChartColumn,
            tone: "bg-zinc-950",
            dots: true,
          },
          {
            name: "Weekly Downloads",
            value: "5M+",
            icon: Shield,
            tone: "bg-red-600",
          },
        ].map(({ name, value, icon: Icon, tone, dots }) => (
          <Frame key={name}>
            <FramePanel className="final-kpi-mesh flex flex-col gap-5 bg-muted/20">
              <IconTile
                variant="elevated"
                className={`final-gloss bg-linear-to-br text-white ${tone} ${dots ? "final-gloss-stipple" : ""}`}
              >
                <Icon />
              </IconTile>
              <Item className="p-0">
                <ItemContent>
                  <ItemTitle className="text-3xl font-semibold tracking-tight">
                    {value}
                  </ItemTitle>
                  <ItemDescription>{name}</ItemDescription>
                </ItemContent>
              </Item>
            </FramePanel>
          </Frame>
        ))}
      </div>
    </Stage>
  );
}
