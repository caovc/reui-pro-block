import { useState, type RefObject } from "react";
import {
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Copy,
  Ellipsis,
  Pause,
  Play,
  ShoppingCart,
  X,
} from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/reui/code-block/code-block";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ReuiTrend } from "@/blocks/data/trend-foundation";
import { STRATA_NOW_MS, strataOwner, strataService, type StrataPageProps } from "./strata-domain";
import { strataCronLabel } from "./strata-cron";
import { formatStrataMonitorDuration, type StrataMonitorsModel } from "./strata-monitors-model";
import { adjacentStrataMonitorId, strataMonitorOverview } from "./strata-monitor-details-model";
import "./strata-monitor-details.css";

const dateTime = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});
const clock = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});
const scheduleLabel = (cron: string) => strataCronLabel(cron).replace(" min", " minutes");
const inTime = (atMs: number) => {
  const minutes = Math.max(0, Math.ceil((atMs - STRATA_NOW_MS) / 60_000));
  return minutes < 60
    ? `in ${minutes}m`
    : minutes < 1440
      ? `in ${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`
      : `in ${Math.floor(minutes / 1440)}d`;
};

export function StrataMonitorDetails({
  model,
  monitorId,
  onSelect,
  onClose,
  returnFocus,
  fallbackFocus,
  onNavigate,
}: {
  model: StrataMonitorsModel;
  monitorId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  returnFocus: RefObject<HTMLElement | null>;
  fallbackFocus: RefObject<HTMLButtonElement | null>;
  onNavigate: StrataPageProps["onNavigate"];
}) {
  const details = monitorId ? strataMonitorOverview(model.monitors, model.checks, monitorId) : null;
  const [copyStatus, setCopyStatus] = useState("");
  const copyId = async () => {
    if (!details) return;
    try {
      await navigator.clipboard.writeText(details.displayId);
      setCopyStatus(`Copied ${details.displayId}`);
    } catch {
      setCopyStatus("Clipboard unavailable");
    }
  };
  const row = details?.row;
  const monitor = row?.monitor;
  const owner = monitor ? strataOwner(monitor.ownerId) : undefined;
  const service = monitor ? strataService(monitor.serviceId) : undefined;
  const previous = monitor ? adjacentStrataMonitorId(model.monitors, monitor.id, -1) : null;
  const next = monitor ? adjacentStrataMonitorId(model.monitors, monitor.id, 1) : null;
  return (
    <Sheet
      open={!!details}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        showCloseButton={false}
        className="strata-monitor-details-sheet"
        onCloseAutoFocus={(event) => {
          const target = returnFocus.current?.isConnected
            ? returnFocus.current
            : fallbackFocus.current;
          if (target?.isConnected) {
            event.preventDefault();
            target.focus({ preventScroll: true });
          }
        }}
      >
        {details && row && monitor && (
          <>
            <SheetHeader>
              <div className="strata-monitor-details-topline">
                <code>{details.displayId}</code>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Copy monitor ID"
                  onClick={copyId}
                >
                  <Copy />
                </Button>
                <ButtonGroup aria-label="Monitors">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Previous monitor"
                    disabled={!previous}
                    onClick={() => {
                      if (previous) onSelect(previous);
                    }}
                  >
                    <ChevronUp />
                  </Button>
                  <span>
                    {details.index + 1} of {model.monitors.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Next monitor"
                    disabled={!next}
                    onClick={() => {
                      if (next) onSelect(next);
                    }}
                  >
                    <ChevronDown />
                  </Button>
                </ButtonGroup>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="More monitor actions">
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        void copyId();
                      }}
                    >
                      Copy monitor ID
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onClose}>Close details</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Close">
                    <X />
                  </Button>
                </SheetClose>
              </div>
              <div className="strata-monitor-details-title">
                <SheetTitle>{monitor.name}</SheetTitle>
                <Badge
                  size="sm"
                  variant={
                    row.health === "Failing"
                      ? "destructive-light"
                      : row.health === "Healthy"
                        ? "success-light"
                        : "outline"
                  }
                >
                  {row.health}
                </Badge>
              </div>
              <SheetDescription className="strata-monitor-details-description">
                <code>{monitor.cron}</code>
                <span aria-hidden="true">·</span>
                <span>{scheduleLabel(monitor.cron)} UTC</span>
                <span aria-hidden="true">·</span>
                <ShoppingCart aria-hidden="true" />
                <span>{service?.name ?? monitor.serviceId}</span>
              </SheetDescription>
              <div className="strata-monitor-details-actions">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button size="sm" disabled>
                        <Play />
                        Run Now
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    External checks are unavailable in this local demo.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => model.setEnabled(monitor.id, !monitor.enabled)}
                    >
                      {monitor.enabled ? <Pause /> : <Play />}
                      {monitor.enabled ? "Pause" : "Resume"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Change this local schedule. No remote monitor is changed.
                  </TooltipContent>
                </Tooltip>
              </div>
            </SheetHeader>
            <Tabs value="overview" className="strata-monitor-details-tabs">
              <TabsList variant="line" aria-label="Monitor details">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="checks" disabled>
                  Checks{" "}
                  <Badge variant="outline" size="sm">
                    {row.checks.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="settings" disabled>
                  Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="strata-monitor-details-body">
                {(details.trailingFailures > 0 || !monitor.enabled) && (
                  <Alert
                    variant={!monitor.enabled ? "default" : "destructive"}
                    className="strata-monitor-details-alert"
                  >
                    <CircleAlert />
                    <AlertTitle>
                      {!monitor.enabled ? "Schedule paused locally" : row.latest?.status}
                    </AlertTitle>
                    <AlertDescription>
                      {!monitor.enabled
                        ? "Future checks are paused in this local demo. Existing check records remain unchanged."
                        : `${details.trailingFailures} failed or timed-out checks in a row${details.failureSince ? ` since ${clock.format(new Date(details.failureSince))} UTC` : ""}.`}
                    </AlertDescription>
                    <AlertAction>
                      <Button variant="outline" size="xs" onClick={() => onNavigate("/logs")}>
                        View Log
                      </Button>
                    </AlertAction>
                  </Alert>
                )}
                <Accordion
                  type="multiple"
                  defaultValue={["schedule", "details", "next", "durations", "request"]}
                >
                  <AccordionItem value="schedule">
                    <AccordionTrigger>Schedule</AccordionTrigger>
                    <AccordionContent>
                      <dl className="strata-monitor-details-cron">
                        {["Minute", "Hour", "Day", "Month", "Weekday"].map((label, index) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>
                              <code>{details.fields[index] ?? "—"}</code>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="details">
                    <AccordionTrigger>Details</AccordionTrigger>
                    <AccordionContent>
                      <dl className="strata-monitor-details-facts">
                        <div>
                          <dt>Checks</dt>
                          <dd>
                            {scheduleLabel(monitor.cron)} <span>UTC</span>
                          </dd>
                        </div>
                        <div>
                          <dt>Next Check</dt>
                          <dd>
                            {details.nextChecks[0] ? (
                              <>
                                {dateTime.format(details.nextChecks[0])} UTC{" "}
                                <span>{inTime(details.nextChecks[0])}</span>
                              </>
                            ) : monitor.enabled ? (
                              "No future check"
                            ) : (
                              "Paused"
                            )}
                          </dd>
                        </div>
                        {monitor.id === "checkout" && (
                          <div>
                            <dt>Concurrency</dt>
                            <dd>
                              Forbid <span>skip if still running</span>
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt>Timeout</dt>
                          <dd>
                            <code>{formatStrataMonitorDuration(monitor.timeoutSeconds)}</code>
                          </dd>
                        </div>
                        {monitor.id === "checkout" && (
                          <>
                            <div>
                              <dt>Retries</dt>
                              <dd>1</dd>
                            </div>
                            <div>
                              <dt>Alerts</dt>
                              <dd>Pages #sre-oncall</dd>
                            </div>
                          </>
                        )}
                        <div>
                          <dt>Target</dt>
                          <dd>
                            {service?.name ?? monitor.serviceId}{" "}
                            <code>
                              {monitor.region === "all"
                                ? `All ${monitor.regions} regions`
                                : monitor.region}
                            </code>
                          </dd>
                        </div>
                        <div>
                          <dt>Environment</dt>
                          <dd>
                            <Badge variant="outline" size="sm">
                              {monitor.environment}
                            </Badge>
                          </dd>
                        </div>
                        <div>
                          <dt>Owner</dt>
                          <dd className="strata-monitor-details-owner">
                            <Avatar>
                              <AvatarFallback>
                                {owner?.name
                                  .split(" ")
                                  .map((name) => name[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {owner?.name}
                            <span>{owner?.team}</span>
                          </dd>
                        </div>
                      </dl>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="next">
                    <AccordionTrigger>Next 5 Checks</AccordionTrigger>
                    <AccordionContent>
                      {details.nextChecks.length ? (
                        <ul className="strata-monitor-details-next">
                          {details.nextChecks.map((at) => (
                            <li key={at}>
                              <time dateTime={new Date(at).toISOString()}>
                                {dateTime.format(at)} UTC
                              </time>
                              <span>{inTime(at)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>{details.scheduleError ?? "No checks scheduled while paused."}</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="durations">
                    <AccordionTrigger>Check Durations</AccordionTrigger>
                    <AccordionContent>
                      <p className="strata-monitor-details-chart-note">
                        Last {row.checks.length} checks · p95 {formatStrataMonitorDuration(row.p95)}{" "}
                        of {formatStrataMonitorDuration(monitor.timeoutSeconds)} timeout
                      </p>
                      {details.durations.length ? (
                        <ReuiTrend
                          label={`${monitor.name}: last ${row.checks.length} check durations`}
                          data={details.durations}
                          series={[
                            {
                              key: "load",
                              label: "Load",
                              color: "#87dfcd",
                              kind: "bar",
                              stack: "duration",
                            },
                            {
                              key: "steps",
                              label: monitor.id === "checkout" ? "Checkout steps" : "Check steps",
                              color: "#28b99e",
                              kind: "bar",
                              stack: "duration",
                              pattern: true,
                            },
                            {
                              key: "confirm",
                              label: "Confirm",
                              color: "#146957",
                              kind: "bar",
                              stack: "duration",
                            },
                          ]}
                          height={230}
                          compact
                          domain={[
                            0,
                            Math.max(
                              monitor.timeoutSeconds,
                              ...details.durations.map((point) => point.total),
                            ),
                          ]}
                          format={formatStrataMonitorDuration}
                        />
                      ) : (
                        <p>No recorded check durations.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="request">
                    <AccordionTrigger>Request</AccordionTrigger>
                    <AccordionContent>
                      <CodeBlock
                        key={monitor.id}
                        code={details.request}
                        language="bash"
                        label={`${monitor.name} request text`}
                        wrap
                      >
                        <CodeBlockHeader>
                          <CodeBlockTitle>
                            {monitor.kind === "command" ? "check.sh" : "request.http"}
                          </CodeBlockTitle>
                          <CodeBlockCopyButton aria-label="Copy code" />
                        </CodeBlockHeader>
                        <CodeBlockContent />
                      </CodeBlock>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
            </Tabs>
            <span className="sr-only" role="status">
              {copyStatus}
            </span>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
