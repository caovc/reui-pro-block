import { useState } from "react";
import { Cpu, MemoryStick, HardDrive, Fan, Zap, Layers, Lightbulb, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Frame, FrameHeader, FrameTitle, FramePanel, FrameFooter } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { BarPicker } from "./bar-primitives";
import { MiniTrend } from "./sparkline-primitives";
import HardwareScene from "./ai-usage-hardware-scene";
import { cn } from "@/lib/utils";

const nodes = [
  "lis-alv-01",
  "lis-alv-02",
  "lis-dow-01",
  "por-nor-01",
  "mad-cen-01",
  "mad-cen-02",
  "bar-east-01",
  "par-riv-01",
  "ber-hub-01",
  "ams-core-01",
];
const parts = ["Compute module", "Memory", "Storage", "Blower fan", "Power stage"];
const icons = [Cpu, MemoryStick, HardDrive, Fan, Zap];
const catalog = [
  "ShelfScan",
  "QueueCount",
  "Voxa STT",
  "Aisle Assist 3B",
  "Receipt Reader",
  "Safety Watch",
];
export default function EdgeNodes() {
  const [node, setNode] = useState(nodes[0]),
    [part, setPart] = useState(0),
    [open, setOpen] = useState(true),
    [identify, setIdentify] = useState(false),
    [caps, setCaps] = useState<Record<string, string>>({}),
    [metric, setMetric] = useState("Requests"),
    [tab, setTab] = useState("Usage"),
    [inspector, setInspector] = useState(false),
    [deploy, setDeploy] = useState(false),
    [picked, setPicked] = useState(catalog[4]),
    [deployments, setDeployments] = useState<Record<string, string[]>>({}),
    [settings, setSettings] = useState<Record<string, { enabled: boolean; updates: boolean }>>({});
  const installed = deployments[node] ?? catalog.slice(0, 4);
  const enabled = settings[node]?.enabled ?? true;
  const updates = settings[node]?.updates ?? true;
  const setInstalled = (updater: (current: string[]) => string[]) =>
    setDeployments((current) => ({
      ...current,
      [node]: updater(current[node] ?? catalog.slice(0, 4)),
    }));
  const setEnabled = (value: boolean) =>
    setSettings((current) => ({ ...current, [node]: { enabled: value, updates } }));
  const setUpdates = (value: boolean) =>
    setSettings((current) => ({ ...current, [node]: { enabled, updates: value } }));
  const cap = caps[node] ?? "30 W";
  const index = nodes.indexOf(node),
    offline = index === 9,
    attention = [3, 6, 9].includes(index);
  const watts = Math.round(parseInt(cap) * 0.8),
    heat = 40 + Math.round(watts / 2),
    fan = 1700 + watts * 70;
  const values = Array.from(
    { length: 24 },
    (_, hour) =>
      (metric === "Tokens" ? 32000 : 3200) * (0.3 + (1 + Math.sin(hour * 0.43 + index)) * 0.55),
  );
  const selectPart = (next: number) => {
    setPart(next);
    setInspector(true);
  };
  return (
    <div className="flex min-h-[780px] items-center justify-center p-3 sm:p-6">
      <Frame className="w-full max-w-[1250px]">
        <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <FrameTitle role="heading" aria-level={2}>
                Edge Nodes
              </FrameTitle>
              <p className="mt-1 text-xs text-muted-foreground">10 nodes, 3 need attention</p>
            </div>
            <BarPicker
              label="Node"
              value={node}
              onChange={(value) => {
                setNode(value);
                setInspector(false);
              }}
              options={nodes}
            />
            <Badge variant={attention ? "warning-light" : "success-light"}>
              {offline ? "Offline" : attention ? "Attention" : "Healthy"}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-1" aria-label="Node controls">
            {parts.map((name, i) => {
              const Icon = icons[i];
              return (
                <Button
                  key={name}
                  aria-label={name}
                  aria-pressed={part === i}
                  size="icon-sm"
                  variant={part === i ? "secondary" : "outline"}
                  onClick={() => selectPart(i)}
                >
                  <Icon />
                </Button>
              );
            })}
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Lid open"
              aria-pressed={open}
              onClick={() => setOpen(!open)}
            >
              <Layers />
            </Button>
            <Button
              size="icon-sm"
              variant={identify ? "secondary" : "outline"}
              aria-label="Identify"
              aria-pressed={identify}
              onClick={() => setIdentify(!identify)}
            >
              <Lightbulb />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Reset view"
              onClick={() => {
                setOpen(true);
                setIdentify(false);
                setPart(0);
              }}
            >
              <RotateCcw />
            </Button>
            <BarPicker
              label="Power budget"
              value={cap}
              onChange={(value) => setCaps((current) => ({ ...current, [node]: value }))}
              options={["15 W", "30 W", "45 W", "60 W"]}
            />
            <Button size="sm" disabled={offline} onClick={() => setDeploy(true)}>
              Deploy
            </Button>
          </div>
        </FrameHeader>
        {offline && (
          <div className="px-1 pb-1">
            <Alert variant="warning">
              <AlertTitle>Node is offline</AlertTitle>
              <AlertDescription>
                Deployment is unavailable. Last-known demo telemetry is shown.
              </AlertDescription>
            </Alert>
          </div>
        )}
        <div className="grid gap-1 lg:grid-cols-[2.7fr_1fr]">
          <FramePanel className="flex min-h-[480px] items-center justify-center p-2">
            <HardwareScene
              open={open}
              identify={identify}
              selected={part}
              loads={[80, installed.length * 12, 15, 10]}
              onSelect={selectPart}
              onLid={() => setOpen(!open)}
            />
          </FramePanel>
          <FramePanel className="min-w-0 p-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full justify-start border-b bg-transparent p-0" variant="line">
                {["Usage", "Models", "Power", "Settings"].map((name) => (
                  <TabsTrigger key={name} value={name} className="text-xs">
                    {name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="Usage" className="space-y-6 pt-4">
                <dl className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    ["Requests", `${(82.1 + index * 2).toFixed(1)}K`],
                    ["Tokens", "772.8K"],
                    ["Avoided", "$123"],
                  ].map(([name, value]) => (
                    <div key={name}>
                      <dt className="text-muted-foreground">{name}</dt>
                      <dd className="mt-2 text-lg font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-medium">Last 24 Hours</h2>
                  <div className="flex gap-1">
                    {["Requests", "Tokens"].map((name) => (
                      <Button
                        key={name}
                        size="sm"
                        variant={metric === name ? "secondary" : "ghost"}
                        className="h-6 px-2 text-[11px]"
                        onClick={() => setMetric(name)}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                </div>
                <MiniTrend
                  label={`${node} ${metric.toLowerCase()} per hour`}
                  values={values}
                  area
                  height={140}
                  color="var(--foreground)"
                  keyboard
                  tooltips
                />
                <div className="space-y-4">
                  <h2 className="text-xs font-medium">Top Models</h2>
                  {installed.map((name, i) => (
                    <div key={name} className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>{name}</span>
                        <span className="text-muted-foreground">
                          {["46.8K", "31.2K", "2.3K", "1.8K", "1.2K", "0.7K"][i]}
                        </span>
                      </div>
                      <Progress
                        value={[57, 38, 3, 2, 1, 1][i]}
                        aria-label={`${name} share of requests`}
                        className="h-1 **:data-[slot=progress-indicator]:bg-muted-foreground"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="Models" className="space-y-3 pt-4">
                <h2 className="text-sm font-medium">Deployed models</h2>
                {installed.map((name, i) => (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-2 rounded-lg border p-3 text-xs"
                  >
                    <span>
                      {name}
                      <span className="mt-1 block text-muted-foreground">
                        {["Vision", "Counting", "Speech", "Assistant", "OCR", "Safety"][i]} · Local
                        inference
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs"
                      onClick={() => {
                        setInstalled((values) => values.filter((item) => item !== name));
                        toast.success(`${name} unloaded in demo`);
                      }}
                    >
                      Unload
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={offline}
                  onClick={() => setDeploy(true)}
                >
                  Deploy a model
                </Button>
              </TabsContent>
              <TabsContent value="Power" className="space-y-5 pt-4">
                {[
                  ["Power Draw", `${watts} W of a ${cap} cap`, 80],
                  ["SoC", `${heat} °C`, (heat / 85) * 100],
                  ["Fan", `${fan.toLocaleString()} rpm`, (fan / 7000) * 100],
                  ["NPU", "80% of 200 TOPS", 80],
                ].map(([name, value, progress]) => (
                  <div key={name} className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>{name}</span>
                      <span>{value}</span>
                    </div>
                    <Progress
                      value={Number(progress)}
                      aria-label={String(name)}
                      className="h-1 **:data-[slot=progress-indicator]:bg-muted-foreground"
                    />
                  </div>
                ))}
                <h2 className="text-sm font-medium">Throttle Events</h2>
                <Alert variant={heat > 70 ? "warning" : "success"}>
                  <AlertTitle>{heat > 70 ? "Temperature rising" : "No Throttling"}</AlertTitle>
                  <AlertDescription>
                    Illustrative telemetry derived from the selected power budget.
                  </AlertDescription>
                </Alert>
              </TabsContent>
              <TabsContent value="Settings" className="space-y-5 pt-4">
                <label className="flex items-center justify-between gap-3 text-xs">
                  Accept inference requests
                  <Switch
                    aria-label="Accept inference requests"
                    checked={enabled}
                    onCheckedChange={setEnabled}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs">
                  Automatic model updates
                  <Switch
                    aria-label="Automatic model updates"
                    checked={updates}
                    onCheckedChange={setUpdates}
                  />
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.success(`${node} restarted in local demo`)}
                >
                  Restart node
                </Button>
                <p className="text-xs text-muted-foreground">
                  Changes stay in this preview. No fleet service is contacted.
                </p>
              </TabsContent>
            </Tabs>
          </FramePanel>
        </div>
        <FrameFooter className="flex flex-row flex-wrap justify-between gap-3 p-3 text-xs text-muted-foreground">
          <span>
            {index < 4 ? "Portugal" : "Europe"} · {node} · Bricklane Fleet
          </span>
          <span className={cn(identify && "text-warning-foreground")}>
            SoC {heat}°C　Draw {watts} W　NPU 80%　Up 41d 6h {identify && "· Identify on"}
          </span>
        </FrameFooter>
        <Sheet open={inspector} onOpenChange={setInspector}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{parts[part]}</SheetTitle>
              <SheetDescription>{node} · Local hardware inspector</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 p-4 text-sm">
              <Badge variant="success-light">Operational</Badge>
              <p>
                {
                  [
                    "200 TOPS neural compute module with local model acceleration.",
                    "16 GB unified memory, shared across deployed models.",
                    "512 GB local encrypted model and cache storage.",
                    `Blower running at ${fan.toLocaleString()} rpm under the ${cap} fan curve.`,
                    `Power draw ${watts} W under a ${cap} budget.`,
                  ][part]
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Original illustrative hardware; no reference media or live telemetry.
              </p>
            </div>
          </SheetContent>
        </Sheet>
        <Sheet open={deploy} onOpenChange={setDeploy}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Deploy model</SheetTitle>
              <SheetDescription>Deploy to {node} in this local demonstration.</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 p-4">
              <BarPicker
                label="Model to deploy"
                value={picked}
                onChange={setPicked}
                options={catalog}
              />
              <Alert>
                <AlertTitle>Local deployment</AlertTitle>
                <AlertDescription>
                  The model will appear in this preview's list only.
                </AlertDescription>
              </Alert>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setDeploy(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setInstalled((values) =>
                    values.includes(picked) ? values : [...values, picked],
                  );
                  setDeploy(false);
                  setTab("Models");
                  toast.success(`${picked} deployed in demo`);
                }}
              >
                Deploy model
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Frame>
    </div>
  );
}
