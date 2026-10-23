import { useState } from "react";
import { Copy, Cpu, MoreHorizontal, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Frame, FrameHeader, FrameTitle, FramePanel, FrameFooter } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/reui/alert";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarPicker } from "./bar-primitives";
import { HealthSegments } from "./sparkline-primitives";
import HardwareScene from "./ai-usage-hardware-scene";
import { cn } from "@/lib/utils";

type ModelConfig = {
  name: string;
  gpus: number[];
  loaded: boolean;
  precision: string;
  context: string;
  parallel: number;
  overflow: string;
  weights: number;
  cache: number;
  tokens: string;
};
const initial: ModelConfig[] = [
  {
    name: "gpt-oss-120b",
    gpus: [0, 1],
    loaded: true,
    precision: "MXFP4",
    context: "32K tokens",
    parallel: 8,
    overflow: "Use Cloud",
    weights: 63.4,
    cache: 9.5,
    tokens: "3.42M",
  },
  {
    name: "gpt-oss-20b",
    gpus: [2],
    loaded: true,
    precision: "MXFP4",
    context: "32K tokens",
    parallel: 8,
    overflow: "Queue",
    weights: 10.4,
    cache: 13.6,
    tokens: "6.81M",
  },
  {
    name: "Mistral Small 3.1",
    gpus: [2],
    loaded: false,
    precision: "MXFP4",
    context: "32K tokens",
    parallel: 4,
    overflow: "Queue",
    weights: 13.4,
    cache: 8,
    tokens: "Idle",
  },
  {
    name: "Gemma 3 27B",
    gpus: [3],
    loaded: true,
    precision: "MXFP4",
    context: "32K tokens",
    parallel: 8,
    overflow: "Queue",
    weights: 21.8,
    cache: 17.2,
    tokens: "1.29M",
  },
];
function memory(model: ModelConfig) {
  const weights =
    model.weights *
    (model.precision === "BF16" ? (model.name === "gpt-oss-120b" ? 233.7 / 63.4 : 3.6) : 1);
  const cache = (((model.cache * parseInt(model.context)) / 32) * model.parallel) / 8;
  return { weights, cache, total: model.loaded ? weights + cache + 3.2 : 0 };
}
export default function LocalModels() {
  const [draft, setDraft] = useState(initial),
    [applied, setApplied] = useState(initial),
    [selected, setSelected] = useState(0),
    [busy, setBusy] = useState(false);
  const model = draft[selected],
    mem = memory(model),
    capacity = model.gpus.length * 48;
  const loads = [0, 1, 2, 3].map((gpu) =>
    draft.reduce(
      (sum, item) => sum + (item.gpus.includes(gpu) ? memory(item).total / item.gpus.length : 0),
      0,
    ),
  );
  const over = loads.some((load) => load > 48),
    dirty = JSON.stringify(draft) !== JSON.stringify(applied);
  const total = loads.reduce((sum, n) => sum + n, 0);
  const update = (patch: Partial<ModelConfig>) =>
    setDraft((values) =>
      values.map((item, index) => (index === selected ? { ...item, ...patch } : item)),
    );
  const payload = JSON.stringify(
    {
      server: "bricklane-gpu-01",
      models: draft.map(({ name, gpus, loaded, precision, context, parallel, overflow }) => ({
        name,
        gpus,
        loaded,
        precision,
        context,
        parallel,
        overflow,
      })),
    },
    null,
    2,
  );
  const download = () => {
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bricklane-local-models.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const apply = () => {
    setBusy(true);
    setTimeout(() => {
      setApplied(draft);
      setBusy(false);
      toast.success("Local configuration applied in demo");
    }, 450);
  };
  return (
    <div className="flex min-h-[760px] items-center justify-center p-3 sm:p-6">
      <Frame className="w-full max-w-[1152px]">
        <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <IconTile>
              <Cpu />
            </IconTile>
            <div>
              <FrameTitle role="heading" aria-level={2}>
                Local Models
              </FrameTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Open weight models on your GPU server
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" aria-label="GPU Memory">
                  {over ? "Over capacity" : `${total.toFixed(1)} / 192 GB`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="space-y-3">
                <h3 className="text-sm font-medium">GPU Memory</h3>
                {loads.map((load, gpu) => (
                  <div key={gpu} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>GPU {gpu}</span>
                      <span>{load.toFixed(1)} / 48 GB</span>
                    </div>
                    <Progress
                      value={Math.min(100, (load / 48) * 100)}
                      aria-label={`GPU ${gpu} memory`}
                      className={cn(
                        "h-1",
                        load > 48 && "**:data-[slot=progress-indicator]:bg-destructive",
                      )}
                    />
                  </div>
                ))}
              </PopoverContent>
            </Popover>
            {over && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft((values) =>
                    values.map((item) => ({
                      ...item,
                      precision: "MXFP4",
                      context: "16K tokens",
                      parallel: 4,
                    })),
                  )
                }
              >
                Fit to GPUs
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  {dirty ? "Pending changes" : "No pending changes"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="space-y-2 text-xs">
                {draft
                  .filter((item, i) => JSON.stringify(item) !== JSON.stringify(applied[i]))
                  .map((item) => (
                    <p key={item.name}>
                      {item.name}: {item.loaded ? item.precision : "Unloaded"}, {item.context},{" "}
                      {item.parallel} parallel
                    </p>
                  ))}
                {!dirty && <p>No pending changes</p>}
              </PopoverContent>
            </Popover>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Copy Config"
              onClick={() =>
                navigator.clipboard
                  .writeText(payload)
                  .then(() => toast.success("Configuration copied"))
              }
            >
              <Copy />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="outline" aria-label="Server actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={download}>
                  <Download />
                  Download Config
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon-sm" variant="outline" aria-label="Restart server">
                  <RotateCcw />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restart GPU server?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This demo simulates a restart. No hardware is contacted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => toast.success("Demo server restarted")}>
                    Restart
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </FrameHeader>
        <div className="grid gap-1 lg:grid-cols-[2fr_1fr]">
          <div className="min-w-0">
            <FramePanel className="p-2">
              <HardwareScene
                server
                loads={loads.map((load) => (load / 48) * 100)}
                selected={model.gpus}
                onSelect={(gpu) =>
                  setSelected(
                    Math.max(
                      0,
                      draft.findIndex((item) => item.gpus.includes(gpu)),
                    ),
                  )
                }
              />
              <p className="flex flex-wrap justify-between gap-2 px-3 pb-3 text-xs text-muted-foreground">
                <span>Click a card to pick its model</span>
                <span>
                  {model.name} · {mem.total.toFixed(1)} GB on GPU {model.gpus.join(" + ")}
                </span>
              </p>
            </FramePanel>
            <FramePanel className="mt-1 space-y-2 p-4" aria-label="Models on this server">
              {draft.map((item, index) => (
                <button
                  key={item.name}
                  aria-pressed={selected === index}
                  onClick={() => setSelected(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left",
                    selected === index && "border-foreground/40 bg-muted/60",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      GPU {item.gpus.join(" + ")} · {item.tokens} tokens today
                    </span>
                  </span>
                  <span className="w-24 shrink-0 text-right text-xs">
                    {item.loaded ? (
                      <>
                        {memory(item).total.toFixed(1)} GB
                        <Progress
                          value={Math.min(
                            100,
                            (memory(item).total / (item.gpus.length * 48)) * 100,
                          )}
                          aria-label={`${item.name} memory`}
                          className="mt-2 h-1"
                        />
                      </>
                    ) : (
                      <Badge variant="outline">Unloaded</Badge>
                    )}
                  </span>
                </button>
              ))}
            </FramePanel>
          </div>
          <FramePanel className="space-y-6 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">{model.name}</h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  Open weight · GPU {model.gpus.join(" + ")}
                </p>
              </div>
              <Switch
                aria-label={`Loaded: ${model.name}`}
                checked={model.loaded}
                onCheckedChange={(loaded) => update({ loaded })}
              />
            </div>
            <div>
              <p className="text-3xl font-semibold">
                {mem.total.toFixed(1)}{" "}
                <span className="text-sm font-normal text-muted-foreground">GB</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                of {capacity} GB on GPU {model.gpus.join(" + ")}
              </p>
            </div>
            <HealthSegments
              label="Weights, KV cache and free memory"
              parts={[
                {
                  label: "Weights",
                  value: model.loaded ? mem.weights : 0,
                  color: "var(--foreground)",
                },
                {
                  label: "KV cache",
                  value: model.loaded ? mem.cache : 0,
                  color: "var(--muted-foreground)",
                },
                { label: "Free", value: Math.max(0, capacity - mem.total), color: "var(--muted)" },
              ]}
            />
            <p className="text-[11px] text-muted-foreground">
              Weights {mem.weights.toFixed(1)} · KV cache {mem.cache.toFixed(1)} · Free{" "}
              {Math.max(0, capacity - mem.total).toFixed(1)}
            </p>
            {over && (
              <Alert variant="destructive">
                <AlertTitle>Doesn't fit on GPUs</AlertTitle>
                <AlertDescription>
                  Reduce precision, context or parallel requests. Apply is disabled until every GPU
                  fits.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              <h3 className="text-xs font-medium">Precision</h3>
              <ToggleGroup
                type="single"
                aria-label="Precision"
                value={model.precision}
                onValueChange={(precision) => precision && update({ precision })}
                variant="outline"
                spacing={0}
                className="w-full"
              >
                {["BF16", "MXFP4"].map((value) => (
                  <ToggleGroupItem key={value} value={value} className="flex-1 text-xs">
                    {value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-medium">Context window</h3>
              <BarPicker
                label="Context window"
                value={model.context}
                onChange={(context) => update({ context })}
                options={["8K tokens", "16K tokens", "32K tokens", "64K tokens", "128K tokens"]}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <h3>Parallel requests</h3>
                <span>{model.parallel}</span>
              </div>
              <Slider
                min={1}
                max={16}
                step={1}
                value={[model.parallel]}
                onValueChange={([parallel]) => update({ parallel })}
                aria-label="Parallel requests"
              />
              <p className="text-xs text-muted-foreground">Each request holds its own KV cache</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-medium">When every slot is busy</h3>
              <ToggleGroup
                type="single"
                aria-label="When every slot is busy"
                value={model.overflow}
                onValueChange={(overflow) => overflow && update({ overflow })}
                variant="outline"
                spacing={0}
              >
                {["Queue", "Use Cloud"].map((value) => (
                  <ToggleGroupItem key={value} value={value} className="text-xs">
                    {value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                {model.overflow === "Use Cloud"
                  ? "Overflow goes to the workspace cloud model"
                  : "Overflow waits in the local queue"}
              </p>
            </div>
          </FramePanel>
        </div>
        <FrameFooter className="flex flex-row flex-wrap items-center justify-between gap-3 p-4">
          <p role="status" className="text-xs text-muted-foreground">
            {busy
              ? "Applying…"
              : dirty
                ? "Review pending changes"
                : "Configuration applied · Demo snapshot"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!dirty || busy}
              onClick={() => setDraft(applied)}
            >
              Discard
            </Button>
            <Button size="sm" disabled={!dirty || over || busy} onClick={apply}>
              Apply
            </Button>
          </div>
        </FrameFooter>
      </Frame>
    </div>
  );
}
