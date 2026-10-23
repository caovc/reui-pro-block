/** Uses actual official free REUI Badge; the Table-in-Card composition is from
 * free c-trace-13. Independent local server/scope state extends that example;
 * no complete MCP call-audit state machine exists in the audited free patterns.
 * https://reui.io/r/radix-nova/c-trace-13.json
 * MIT, Copyright (c) 2025 Keenthemes Inc. Preserve REUI-LICENSE.txt.
 */
import { useEffect, useState } from "react";
import { Check, Circle, CircleAlert, KeyRound, Plug, Server, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AUDIT_CALLS,
  AUDIT_SERVERS,
  auditCallStatus,
  grantAuditScope,
} from "./agent-activity-model";

const STATUS_LABELS = {
  success: "Succeeded",
  denied: "Denied",
  error: "Failed",
  pending: "In flight",
  requeued: "Re-queued",
} as const;
export default function McpCallAudit({
  servers = AUDIT_SERVERS,
}: {
  servers?: typeof AUDIT_SERVERS;
}) {
  const [visible, setVisible] = useState(2);
  const [filter, setFilter] = useState("all");
  const [granted, setGranted] = useState<readonly string[]>([]);
  useEffect(() => {
    if (visible >= AUDIT_CALLS.length || !servers.length) return;
    const timer = window.setTimeout(() => setVisible((current) => current + 1), 800);
    return () => window.clearTimeout(timer);
  }, [visible, servers.length]);
  const calls = AUDIT_CALLS.slice(0, visible)
    .filter((call) => servers.some((server) => server.id === call.server))
    .filter((call) => filter !== "denied" || auditCallStatus(call, granted) === "denied")
    .sort((a, b) => Number(Boolean(b.deniedScope)) - Number(Boolean(a.deniedScope)));
  const deniedCount = AUDIT_CALLS.slice(0, visible).filter(
    (call) => auditCallStatus(call, granted) === "denied",
  ).length;
  return (
    <div className="mx-auto w-full max-w-2xl py-3" data-agent-activity="audit">
      <Card className="gap-0 overflow-hidden py-0 shadow-none">
        <CardHeader className="gap-3 border-b p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm">MCP call audit</CardTitle>
              <CardDescription className="mt-1 text-xs">
                Workspace settings run <span className="px-1">·</span> BL-2048
              </CardDescription>
            </div>
            <Badge variant="outline">{Math.min(visible, AUDIT_CALLS.length)} calls</Badge>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Tools called by this run, attributed to the server that handled them.
          </p>
          {servers.length > 0 && (
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(value) => value && setFilter(value)}
              variant="outline"
              size="sm"
              aria-label="Audit filter"
            >
              <ToggleGroupItem value="all">All calls</ToggleGroupItem>
              <ToggleGroupItem value="denied">
                Denied only <span className="ms-1 text-muted-foreground">{deniedCount}</span>
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {!servers.length ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Plug />
                </EmptyMedia>
                <EmptyTitle>No Servers Connected</EmptyTitle>
                <EmptyDescription>
                  Connect an MCP server to attribute tool calls to this run.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table className="w-full table-fixed">
              <TableHeader className="max-sm:sr-only">
                <TableRow>
                  <TableHead className="w-31 ps-5 text-xs">Server</TableHead>
                  <TableHead className="text-xs">Tool call</TableHead>
                  <TableHead className="w-27 text-xs">Status</TableHead>
                  <TableHead className="w-22 pe-5 text-right text-xs">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => {
                  const status = auditCallStatus(call, granted);
                  const server = servers.find((entry) => entry.id === call.server);
                  return (
                    <TableRow
                      key={call.id}
                      className="max-sm:flex max-sm:flex-wrap max-sm:gap-x-3 max-sm:gap-y-1 max-sm:px-5 max-sm:py-3"
                    >
                      <TableCell className="align-top whitespace-normal max-sm:w-full max-sm:p-0 sm:ps-5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Server className="size-3 shrink-0 text-muted-foreground" />
                          {server?.label}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-normal max-sm:min-w-0 max-sm:flex-1 max-sm:p-0">
                        <p className="font-mono text-xs break-all">{call.tool}</p>
                        <p className="mt-1 text-xs break-words text-muted-foreground">
                          {call.detail}
                        </p>
                        {call.deniedScope && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                              {call.deniedScope}
                            </code>
                            {status === "denied" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                aria-label={`Grant ${call.deniedScope}`}
                                onClick={() => {
                                  setGranted((current) =>
                                    grantAuditScope(current, call.deniedScope!, AUDIT_CALLS),
                                  );
                                  toast.success(
                                    "Scope recorded locally. Call re-queued; no server permission changed.",
                                  );
                                }}
                              >
                                <KeyRound />
                                Grant
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top max-sm:p-0">
                        <Badge
                          size="sm"
                          variant={
                            status === "success"
                              ? "success-light"
                              : status === "denied"
                                ? "warning-light"
                                : status === "error"
                                  ? "destructive-light"
                                  : status === "requeued"
                                    ? "info-light"
                                    : "outline"
                          }
                        >
                          {status === "pending" ? (
                            <Spinner className="size-3" />
                          ) : status === "success" ? (
                            <Check />
                          ) : status === "error" ? (
                            <X />
                          ) : status === "denied" ? (
                            <CircleAlert />
                          ) : (
                            <Circle />
                          )}
                          {STATUS_LABELS[status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="pe-5 text-right align-top text-xs text-muted-foreground max-sm:w-full max-sm:p-0 max-sm:text-left">
                        {call.duration}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filter === "all" &&
                  visible < AUDIT_CALLS.length &&
                  Array.from({ length: AUDIT_CALLS.length - visible }, (_, index) => (
                    <TableRow key={`pending-${index}`} aria-label="Loading tool call">
                      <TableCell className="ps-5">
                        <Skeleton className="h-3 w-18" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-3 w-4/5" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-3 w-15" />
                      </TableCell>
                      <TableCell className="pe-5">
                        <Skeleton className="ms-auto h-3 w-8" />
                      </TableCell>
                    </TableRow>
                  ))}
                {filter === "denied" && !calls.length && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="p-6 text-center text-sm text-muted-foreground"
                    >
                      No denied calls remain in this local run.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {servers.length > 0 && (
          <footer className="space-y-3 border-t p-5">
            <div className="flex flex-wrap gap-2" aria-label="Server connections">
              {servers.map((server) => (
                <Badge
                  key={server.id}
                  variant={server.state === "Dropped" ? "warning-light" : "outline"}
                >
                  <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                  {server.label}
                  {server.state === "Dropped" ? " · Dropped" : ""}
                </Badge>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Design library received no calls. Timing covers completed calls only; pending tools
              remain in flight.
            </p>
            <p role="status" className="text-xs text-muted-foreground">
              {granted.length
                ? "1 scope recorded locally · its call is re-queued"
                : deniedCount
                  ? `${deniedCount} call needs your permission`
                  : "No permission decisions pending"}
            </p>
          </footer>
        )}
      </Card>
    </div>
  );
}
