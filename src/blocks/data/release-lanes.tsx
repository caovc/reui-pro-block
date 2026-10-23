import { Fragment, useEffect, useState } from "react";
import { ArrowRight, ChevronDown, MoreHorizontal, ShieldCheck, Webhook } from "lucide-react";
import { toast } from "sonner";
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ChartStage } from "./chart-chrome";
import { RunBadge, StageMeter } from "./status-tracker-primitives";
import {
  deploySeeds,
  services,
  tickDeploy,
  versions,
  type DeployRun,
  type Environment,
} from "./status-tracker-data";

type Lane = {
  name: Environment;
  frozen: boolean;
  current: DeployRun;
  deployed: Record<string, string>;
  pending?: Record<string, string>;
};
const baseline = Object.fromEntries(services.map((name) => [name, versions[name].at(-1)!]));
const production = { ...baseline, "payments-api": "v2.41.0" };
const sandbox = {
  ...production,
  "fraud-scorer": "v3.9.0",
  "payouts-scheduler": "v4.12.1",
  reconciliation: "v2.7.1",
  "search-indexer": "v2.3.2",
};
const staging = { ...sandbox, "webhook-dispatcher": "v1.27.0" };
const seeds: Lane[] = [
  {
    name: "Staging",
    frozen: false,
    deployed: staging,
    current: {
      ...deploySeeds[1],
      service: "webhook-dispatcher",
      version: "v1.27.0",
      environment: "Staging",
      actor: "Omar Haddad",
    },
  },
  {
    name: "Sandbox",
    frozen: false,
    deployed: sandbox,
    current: {
      ...deploySeeds[1],
      service: "reconciliation",
      version: "v2.7.1",
      environment: "Sandbox",
      actor: "Sofia Romero",
    },
  },
  { name: "Production", frozen: false, deployed: production, current: { ...deploySeeds[0] } },
];
const commits: Record<string, { sha: string; message: string }> = {
  "webhook-dispatcher": { sha: "7c3e8b1", message: "Sign deliveries with the rotated whsec key" },
  reconciliation: { sha: "f2a6c84", message: "Parse CAMT.053 statements from EU banks" },
  "fraud-scorer": { sha: "d4a7c19", message: "Serve fs-v7 features from the online store" },
};
export default function ReleaseLanes() {
  const [lanes, setLanes] = useState(seeds),
    [matrix, setMatrix] = useState(false),
    [confirm, setConfirm] = useState<{ gate: boolean; target: number; source?: number } | null>(
      null,
    );
  useEffect(() => {
    const timer = setInterval(
      () =>
        setLanes((rows) =>
          rows.map((lane) => {
            if (lane.frozen) return lane;
            const current = tickDeploy(lane.current);
            return {
              ...lane,
              current,
              deployed:
                current.status === "Succeeded"
                  ? { ...lane.deployed, ...lane.pending, [current.service]: current.version }
                  : lane.deployed,
              pending: current.status === "Succeeded" ? undefined : lane.pending,
            };
          }),
        ),
      500,
    );
    return () => clearInterval(timer);
  }, []);
  const ahead = (source: number, target: number) =>
    services.filter((name) => lanes[source].deployed[name] !== lanes[target].deployed[name]);
  function freeze(index: number, value: boolean) {
    setLanes((rows) => rows.map((lane, i) => (i === index ? { ...lane, frozen: value } : lane)));
    toast.success(`${lanes[index].name} deploys ${value ? "frozen" : "resumed"}`, {
      action: {
        label: "Undo",
        onClick: () =>
          setLanes((rows) =>
            rows.map((lane, i) => (i === index ? { ...lane, frozen: !value } : lane)),
          ),
      },
    });
  }
  const candidates = confirm?.source !== undefined ? ahead(confirm.source, confirm.target) : [];
  function promote() {
    if (!confirm) return;
    setLanes((rows) =>
      rows.map((lane, i) => {
        if (i !== confirm.target || lane.frozen) return lane;
        if (confirm.gate)
          return { ...lane, current: { ...lane.current, hold: false, status: "Running" } };
        const source = rows[confirm.source!];
        const changes = Object.fromEntries(candidates.map((name) => [name, source.deployed[name]]));
        const service = candidates[0];
        if (!service) return lane;
        return {
          ...lane,
          pending: changes,
          current: {
            ...source.current,
            id: Date.now(),
            service,
            version: source.deployed[service],
            environment: lane.name,
            actor: "You",
            progress: 0,
            status: "Running",
            strategy: lane.name === "Production" ? "Canary" : "Rolling",
            hold: lane.name === "Production",
          },
        };
      }),
    );
    toast.success(
      confirm.gate
        ? "Canary promoted to full rollout"
        : `Promotion to ${lanes[confirm.target].name} started`,
    );
    setConfirm(null);
  }
  const target = confirm ? lanes[confirm.target] : undefined;
  return (
    <ChartStage>
      <Collapsible open={matrix} onOpenChange={setMatrix} asChild>
        <Frame className="w-full max-w-[1280px]" role="region" aria-label="Environments">
          <FrameHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3">
            <div>
              <FrameTitle role="heading" aria-level={2}>
                Environments
              </FrameTitle>
              <FrameDescription className="mt-1 text-xs">
                8 services across 3 environments
              </FrameDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                Services
                <ChevronDown />
              </Button>
            </CollapsibleTrigger>
          </FrameHeader>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)_24px_minmax(0,1fr)]">
            {lanes.map((lane, i) => {
              const commit = commits[lane.current.service] ?? {
                  sha: "b27fd19",
                  message: "Promoted from the previous environment",
                },
                Icon = i === 2 ? ShieldCheck : Webhook;
              const next = lanes[i + 1],
                aheadCount = next ? ahead(i, i + 1).length : 0;
              const blocked =
                !next ||
                lane.frozen ||
                next.frozen ||
                ["Running", "Waiting"].includes(next.current.status) ||
                aheadCount === 0;
              return (
                <Fragment key={lane.name}>
                  <FramePanel
                    className="flex min-w-0 flex-col gap-4 p-4"
                    data-environment={lane.name}
                  >
                    <header className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{lane.name}</h3>
                        <Badge
                          size="sm"
                          variant={
                            lane.frozen
                              ? "warning-light"
                              : i === 0
                                ? "destructive-light"
                                : "success-light"
                          }
                        >
                          {lane.frozen ? "Frozen" : i === 0 ? "2 failed" : "Healthy"}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-auto size-6"
                              aria-label={`${lane.name} actions`}
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{lane.name}</DropdownMenuLabel>
                            <DropdownMenuGroup>
                              <DropdownMenuItem onSelect={() => freeze(i, !lane.frozen)}>
                                {lane.frozen ? "Resume deploys" : "Freeze deploys"}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        {i === 2
                          ? "prod-us-east-1 · prod-eu-west-1"
                          : `staging-us-east-1 · ${i === 0 ? "On merge" : "Partner testing"}`}
                      </p>
                    </header>
                    <div className="flex flex-col gap-3">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <h4 className="flex min-w-0 items-center gap-2 text-xs font-medium">
                          <Icon className="size-3.5 shrink-0" />
                          <span className="truncate">{lane.current.service}</span>
                        </h4>
                        <RunBadge status={lane.current.status} />
                      </div>
                      <p className="text-xl font-semibold">
                        {lane.current.version}
                        <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                          from {versions[lane.current.service].at(-1)}
                        </span>
                      </p>
                      <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                        <code className="rounded border px-1 text-[10px] text-foreground">
                          {commit.sha}
                        </code>
                        <span className="truncate" title={commit.message}>
                          {commit.message}
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <StageMeter run={lane.current} />
                        </div>
                        {lane.current.status === "Waiting" && (
                          <Button
                            size="sm"
                            className="h-6 px-2 text-[10px]"
                            disabled={lane.frozen}
                            onClick={() => setConfirm({ gate: true, target: i })}
                          >
                            Promote
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Avatar className="size-4">
                          <AvatarFallback className="text-[7px]">
                            {lane.current.actor
                              .split(" ")
                              .map((p) => p[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span>{lane.current.actor}</span>
                        <span>
                          ·{" "}
                          {lane.current.status === "Running"
                            ? "Running"
                            : lane.current.status === "Waiting"
                              ? "Waiting"
                              : `${i + 1}h ago`}
                        </span>
                      </div>
                    </div>
                    <CollapsibleContent>
                      <Separator className="mb-3" />
                      <p className="mb-3 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Services</span>
                        <span>{next ? `${aheadCount} ahead of ${next.name}` : "8 services"}</span>
                      </p>
                      <ul aria-label={`${lane.name} versions`} className="flex flex-col gap-2">
                        {services.map((name) => (
                          <li
                            key={name}
                            className="flex min-w-0 items-center justify-between gap-2 text-[10px]"
                          >
                            <span className="truncate">{name}</span>
                            <span className="flex shrink-0 items-center gap-1">
                              {i === 0 && ["ledger-worker", "notifications"].includes(name) && (
                                <Badge size="sm" variant="destructive-light">
                                  {versions[name][0]} failed
                                </Badge>
                              )}
                              {i === 1 &&
                                ["payouts-scheduler", "reconciliation", "search-indexer"].includes(
                                  name,
                                ) && (
                                  <Badge size="sm" variant="outline">
                                    Held
                                  </Badge>
                                )}
                              <span className="font-mono text-muted-foreground">
                                {lane.deployed[name]}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CollapsibleContent>
                  </FramePanel>
                  {next && (
                    <div className="flex items-center justify-center">
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-6"
                        disabled={blocked}
                        aria-label={`Promote ${lane.name} to ${next.name}, ${blocked ? "unavailable" : `${aheadCount} ahead`}`}
                        onClick={() => setConfirm({ gate: false, source: i, target: i + 1 })}
                      >
                        <ArrowRight className="rotate-90 md:rotate-0" />
                      </Button>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </Frame>
      </Collapsible>
      <AlertDialog open={!!confirm} onOpenChange={(value) => !value && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.gate ? "Promote Canary?" : `Promote to ${target?.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.gate
                ? `${target?.current.service} ${target?.current.version} takes all traffic on prod-us-east-1. Canary 50% passed its checks.`
                : `These versions move from ${confirm?.source !== undefined ? lanes[confirm.source].name : ""} to ${target?.name}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirm?.source !== undefined && (
            <ul className="flex flex-col gap-3">
              {candidates.map((name) => (
                <li
                  key={name}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>{name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {target?.deployed[name]} → {lanes[confirm.source!].deployed[name]}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={promote}>Promote</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ChartStage>
  );
}
