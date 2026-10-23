import { useEffect, useState } from "react";
import { Bell, BookOpen, CreditCard, Plus, Search, ShieldCheck, Webhook } from "lucide-react";
import { toast } from "sonner";
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Item, ItemGroup } from "@/components/ui/item";
import { ChartStage } from "./chart-chrome";
import { RunBadge, StageMeter, TrackerExports, TrackerPicker } from "./status-tracker-primitives";
import {
  deploySeeds,
  services,
  tickDeploy,
  versions,
  type DeployRun,
  type Environment,
  type Strategy,
} from "./status-tracker-data";

const serviceIcons = [CreditCard, BookOpen, Webhook, ShieldCheck, Webhook, Webhook, Search, Bell];
export default function DeployHistory() {
  const [runs, setRuns] = useState(deploySeeds),
    [filter, setFilter] = useState("All"),
    [open, setOpen] = useState(false);
  const [service, setService] = useState("search-indexer"),
    [version, setVersion] = useState("v2.3.2"),
    [environment, setEnvironment] = useState<Environment>("Staging"),
    [strategy, setStrategy] = useState<Strategy>("Rolling"),
    [hold, setHold] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setRuns((rows) => rows.map(tickDeploy)), 500);
    return () => clearInterval(timer);
  }, []);
  const visible = runs.filter((run) => filter === "All" || run.environment === filter);
  function create() {
    const next: DeployRun = {
      id: Math.max(...runs.map((r) => r.id)) + 1,
      service,
      version,
      environment,
      strategy,
      hold: strategy === "Canary" && hold,
      progress: 0,
      status: "Running",
      at: "Sep 29, 14:20",
      actor: "You",
      failureAt:
        version === "v3.5.0" && service === "notifications"
          ? 1.6
          : version === "v1.18.4" && service === "ledger-worker"
            ? 3.6
            : undefined,
    };
    setRuns((rows) => [next, ...rows]);
    setFilter(environment);
    setOpen(false);
    toast.success(`${service} ${version} queued for ${environment}`);
  }
  return (
    <ChartStage>
      <Frame className="w-full max-w-[850px]">
        <FrameHeader className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 md:flex md:flex-row md:justify-between">
          <div>
            <FrameTitle role="heading" aria-level={2}>
              Deploy History
            </FrameTitle>
            <FrameDescription className="mt-1 text-xs">{runs.length} deploys</FrameDescription>
          </div>
          <div className="col-span-2 row-start-2 w-full md:col-auto md:row-auto md:ml-auto md:w-auto">
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={filter}
              onValueChange={(value) => value && setFilter(value)}
              aria-label="Environment"
              className="w-full"
            >
              {["All", "Production", "Staging"].map((name) => (
                <ToggleGroupItem
                  key={name}
                  value={name}
                  aria-label={`${name}, ${name === "All" ? runs.length : runs.filter((run) => run.environment === name).length} deploys`}
                  className="h-7 flex-1 gap-1 px-2 text-xs"
                >
                  {name}
                  <span className="text-muted-foreground">
                    {name === "All"
                      ? runs.length
                      : runs.filter((run) => run.environment === name).length}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="col-start-2 row-start-1 flex items-center gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={() => setOpen(true)}>
              <Plus />
              New deploy
            </Button>
            <TrackerExports
              name="deploy-history"
              rows={visible.map((run) => ({
                id: `DEP-${run.id}`,
                service: run.service,
                version: run.version,
                environment: run.environment,
                status: run.status,
                completedStages: Math.floor(run.progress),
                strategy: run.strategy,
                held: run.hold,
                time: run.at,
              }))}
            />
          </div>
        </FrameHeader>
        <FramePanel className="p-0">
          <ItemGroup role="list" aria-label="Deploy history" className="gap-0 divide-y">
            {visible.map((run) => {
              const Icon = serviceIcons[services.indexOf(run.service)] ?? Webhook;
              return (
                <Item
                  key={run.id}
                  role="listitem"
                  data-deploy-id={run.id}
                  className="grid grid-cols-[minmax(0,1fr)_100px] gap-x-3 gap-y-2 rounded-none px-4 py-3 md:grid-cols-[minmax(0,2fr)_100px_150px_100px]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile variant="frame" size="sm">
                      <Icon />
                    </IconTile>
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-2 text-xs font-medium">
                        <span className="truncate">{run.service}</span>
                        <Badge variant="outline" size="sm" className="hidden md:inline-flex">
                          {run.environment}
                        </Badge>
                      </h3>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        <span className="font-mono">{run.version}</span> · DEP-{run.id}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 row-start-2 flex min-w-0 items-center justify-between gap-3 md:contents">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" size="sm" className="md:hidden">
                        {run.environment}
                      </Badge>
                      <RunBadge status={run.status} />
                    </div>
                    <div className="w-[45%] min-w-0 md:w-full">
                      <StageMeter run={run} />
                    </div>
                  </div>
                  <div className="col-start-2 row-start-1 text-right md:col-auto md:row-auto">
                    <p className="text-[10px]">{run.at}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {run.actor === "You" ? "Just now" : "Demo snapshot"}
                    </p>
                  </div>
                </Item>
              );
            })}
          </ItemGroup>
        </FramePanel>
      </Frame>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              create();
            }}
          >
            <DialogHeader>
              <DialogTitle>New Deploy</DialogTitle>
              <DialogDescription>Ship one release to one environment.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel>Service</FieldLabel>
                <TrackerPicker
                  label="Service"
                  value={service}
                  values={services}
                  onChange={(value) => {
                    setService(value);
                    setVersion(versions[value][0]);
                  }}
                />
              </Field>
              <Field>
                <FieldLabel>Version</FieldLabel>
                <TrackerPicker
                  label="Version"
                  value={version}
                  values={versions[service]}
                  onChange={setVersion}
                />
                <FieldDescription>
                  {environment} runs {versions[service].at(-1)}.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Environment</FieldLabel>
                <TrackerPicker
                  label="Environment"
                  value={environment}
                  values={["Staging", "Production"]}
                  onChange={(v) => setEnvironment(v as Environment)}
                />
              </Field>
              <FieldSet>
                <FieldLegend variant="label">Strategy</FieldLegend>
                <ToggleGroup
                  type="single"
                  value={strategy}
                  onValueChange={(value) => value && setStrategy(value as Strategy)}
                  spacing={0}
                  variant="outline"
                  aria-label="Strategy"
                >
                  {["Canary", "Rolling", "Blue-green"].map((s) => (
                    <ToggleGroupItem value={s} key={s} className="flex-1">
                      {s}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <FieldDescription>
                  {strategy === "Canary"
                    ? "Shifts traffic in steps"
                    : strategy === "Rolling"
                      ? "Replaces pods in waves"
                      : "Switches traffic to a fresh environment"}
                </FieldDescription>
              </FieldSet>
              {strategy === "Canary" && (
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="tracker-hold-deploy">Hold for Promote</FieldLabel>
                  <Switch id="tracker-hold-deploy" checked={hold} onCheckedChange={setHold} />
                </Field>
              )}
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Deploy</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ChartStage>
  );
}
