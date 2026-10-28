import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, RotateCw, Send, X } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/reui/code-block/code-block";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { REQUEST_HOSTS, REQUEST_REGIONS } from "./grid-base-api-request-logs-data";
import type { ApiRequest, ReplayDraft, RequestMethod } from "./grid-base-api-request-logs-types";

// Actual free ReUI c-sheet-1 composition and CodeBlock renderer.
// ReUI MIT and supporting shadcn MIT notices remain in the exported project.
const sheetClassName =
  "reui-reference gap-0 overflow-hidden rounded-[14px] bg-background p-0 shadow-xl " +
  "data-[side=right]:inset-y-4 data-[side=right]:right-4 " +
  "data-[side=right]:h-[calc(100dvh-2rem)] " +
  "data-[side=right]:w-[calc(100vw-2rem)] data-[side=right]:border-0 " +
  "data-[side=right]:sm:w-[36rem] data-[side=right]:sm:max-w-[36rem]";

const methods: RequestMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const timestampFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

function timeLabel(timestamp: number) {
  return timestampFormat.format(timestamp);
}

function routeLabel(path: string) {
  return path.split("?")[0] || "/";
}

function statusLabel(status: number) {
  const labels: Record<number, string> = {
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    422: "Unprocessable Content",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  return labels[status] || "HTTP " + status;
}

function statusTone(status: number) {
  return status >= 500 ? "destructive-light" : status >= 400 ? "warning-light" : "success-light";
}

function draftFromRequest(request?: ApiRequest): ReplayDraft {
  return {
    method: request?.method ?? "GET",
    host: request?.host ?? REQUEST_HOSTS[0] ?? "",
    path: request?.path ?? "/",
    region: request?.region ?? REQUEST_REGIONS[0]?.value ?? "",
  };
}

function shellQuote(value: string) {
  return "'" + value.replaceAll("'", "'\\''") + "'";
}

function requestCurl(request: ApiRequest) {
  const lines = [
    "curl -X " + request.method + " " + shellQuote("https://" + request.host + request.path),
  ];
  for (const [name, value] of Object.entries(request.requestHeaders)) {
    if (name.toLowerCase() !== "host") {
      lines.push("-H " + shellQuote(name + ": " + value));
    }
  }
  if (request.requestBody) {
    lines.push("--data-raw " + shellQuote(request.requestBody));
  }
  return lines.join(" \\\n  ");
}

function RequestStatus({ request }: { request: ApiRequest }) {
  return (
    <Badge variant={statusTone(request.status)} className="gap-1 text-xs">
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {request.status} {statusLabel(request.status)}
    </Badge>
  );
}

function DetailRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="space-y-3 py-1">
      {rows.map(([label, value], index) => (
        <div
          key={label + "-" + index}
          className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]"
        >
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function HeaderRows({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers);
  return entries.length ? (
    <DetailRows
      rows={entries.map<[string, ReactNode]>(([name, value]) => [
        name,
        <span key={name} className="font-mono text-xs">
          {value}
        </span>,
      ])}
    />
  ) : (
    <p className="py-2 text-sm text-muted-foreground">No headers recorded.</p>
  );
}

function DetailSection({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="items-center rounded-none py-3 text-xs font-normal text-muted-foreground hover:no-underline">
        {title}
      </AccordionTrigger>
      <AccordionContent className="pb-3">{children}</AccordionContent>
    </AccordionItem>
  );
}

function RequestCode({
  code,
  filename,
  language,
}: {
  code: string;
  filename: string;
  language: string;
}) {
  return (
    <CodeBlock
      code={code}
      language={language}
      label={language + " code"}
      className="min-w-0 rounded-lg"
    >
      <CodeBlockHeader>
        <CodeBlockTitle className="flex-1">{filename}</CodeBlockTitle>
        <CodeBlockCopyButton />
      </CodeBlockHeader>
      <div className="max-h-96 overflow-auto">
        <CodeBlockContent preserveLineBreaks />
      </div>
    </CodeBlock>
  );
}

function Timing({ request }: { request: ApiRequest }) {
  const setup = Math.max(0, request.latency - request.server - request.transfer);
  const denominator = Math.max(1, request.latency);
  const segments = [
    ...(setup > 0 ? [{ name: "Setup", value: setup, offset: 0 }] : []),
    { name: "Server", value: request.server, offset: setup },
    { name: "Transfer", value: request.transfer, offset: setup + request.server },
  ];
  return (
    <>
      <p className="mb-4 text-xs text-muted-foreground">
        {request.latency} ms total
        <span aria-hidden="true"> · </span>
        {Math.round((request.server / denominator) * 100)}% on the server
      </p>
      <ul className="space-y-3">
        {segments.map((segment) => (
          <li
            key={segment.name}
            className="grid grid-cols-[6.5rem_minmax(0,1fr)_4rem] items-center gap-3 sm:grid-cols-[7rem_minmax(0,1fr)_4.5rem]"
          >
            <span className="text-muted-foreground">{segment.name}</span>
            <span
              className="relative h-1.5 overflow-hidden rounded-full bg-muted"
              aria-hidden="true"
            >
              <span
                className="absolute inset-y-0 rounded-full bg-foreground/40"
                style={{
                  left: (segment.offset / denominator) * 100 + "%",
                  width: (segment.value / denominator) * 100 + "%",
                }}
              />
            </span>
            <span className="text-right tabular-nums">{segment.value} ms</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function RecentCalls({
  request,
  requests,
  onRequestChange,
}: {
  request: ApiRequest;
  requests: ApiRequest[];
  onRequestChange: (request: ApiRequest) => void;
}) {
  // This is an endpoint detail projection, independent of the grid controller.
  const calls = requests
    .filter(
      (candidate) =>
        candidate.host === request.host &&
        candidate.method === request.method &&
        routeLabel(candidate.path) === routeLabel(request.path),
    )
    .toSorted((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6);
  const failures = calls.filter((candidate) => candidate.status >= 400).length;
  const latencies = calls.map((candidate) => candidate.latency).toSorted((a, b) => a - b);
  const p95 = latencies.length ? latencies[Math.ceil(latencies.length * 0.95) - 1] : null;
  return (
    <>
      <p className="mb-3 text-xs text-muted-foreground">
        Last {calls.length} calls · {failures} failed
        {p95 !== null && <> · p95 {p95} ms</>}
      </p>
      <ul className="space-y-1">
        {calls.map((candidate) => (
          <li key={candidate.id} className="flex min-h-7 items-center gap-2">
            {candidate.id === request.id ? (
              <span className="min-w-0 flex-1">
                {timeLabel(candidate.timestamp)}
                <Badge variant="outline" size="sm" className="ml-2">
                  Viewing
                </Badge>
              </span>
            ) : (
              <Button
                type="button"
                variant="link"
                className="h-auto min-w-0 flex-1 justify-start p-0 text-sm font-normal text-foreground"
                onClick={() => onRequestChange(candidate)}
              >
                {timeLabel(candidate.timestamp)}
              </Button>
            )}
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs tabular-nums",
                candidate.status >= 500
                  ? "text-destructive"
                  : candidate.status >= 400
                    ? "text-warning-foreground"
                    : "text-success-foreground",
              )}
            >
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
              {candidate.status}
            </span>
            <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">
              {candidate.latency} ms
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function ComposerForm({
  original,
  onBack,
  onCancel,
  onSend,
}: {
  original?: ApiRequest;
  onBack?: () => void;
  onCancel: () => void;
  onSend: (draft: ReplayDraft, original?: ApiRequest) => void;
}) {
  const [draft, setDraft] = useState<ReplayDraft>(() => draftFromRequest(original));
  const [submitted, setSubmitted] = useState(false);
  const [sendError, setSendError] = useState("");
  const pathId = useId();
  const methodId = useId();
  const hostId = useId();
  const regionId = useId();
  const pathRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    pathRef.current?.focus();
  }, []);
  const hosts = [...new Set([...REQUEST_HOSTS, ...(original ? [original.host] : [])])];
  const regions =
    original && !REQUEST_REGIONS.some((region) => region.value === original.region)
      ? [...REQUEST_REGIONS, { value: original.region, label: original.regionName }]
      : REQUEST_REGIONS;
  // Match createReplayRequest's path validation; the model remains the backstop.
  const path = draft.path.trim();
  const invalidPathCharacter = [...path].some(
    (character) =>
      character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127 || character === "#",
  );
  const pathValid = path.startsWith("/") && !path.startsWith("//") && !invalidPathCharacter;
  const valid = !!draft.host && !!draft.region && pathValid;
  function change<K extends keyof ReplayDraft>(field: K, value: ReplayDraft[K]) {
    setSendError("");
    setDraft((current) => ({ ...current, [field]: value }));
  }
  function send() {
    setSubmitted(true);
    if (!valid) {
      pathRef.current?.focus();
      return;
    }
    setSendError("");
    try {
      // Preserve the full original, including raw requestBody, for the root demo model.
      onSend({ ...draft }, original);
    } catch (error: unknown) {
      setSendError(error instanceof Error ? error.message : String(error));
    }
  }
  return (
    <>
      <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12">
        <SheetTitle>{original ? "Replay Request" : "Send Request"}</SheetTitle>
        <SheetDescription className="pt-1">
          {original
            ? "From " + original.id + ", sent " + timeLabel(original.timestamp) + " UTC."
            : "Create a request in this local demonstration."}
        </SheetDescription>
      </SheetHeader>
      <form
        id={pathId + "-form"}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        {sendError && (
          <p role="alert" className="text-sm text-destructive">
            {sendError}
          </p>
        )}
        <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor={methodId}>Method</Label>
            <Select
              value={draft.method}
              onValueChange={(value) => change("method", value as RequestMethod)}
            >
              <SelectTrigger id={methodId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={hostId}>Host</Label>
            <Select value={draft.host} onValueChange={(value) => change("host", value)}>
              <SelectTrigger id={hostId} className="w-full font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hosts.map((host) => (
                  <SelectItem key={host} value={host}>
                    {host}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={pathId}>Path</Label>
          <Input
            ref={pathRef}
            id={pathId}
            className="font-mono text-xs"
            value={draft.path}
            placeholder="/"
            aria-invalid={submitted && !pathValid}
            aria-describedby={pathId + "-description"}
            onChange={(event) => change("path", event.target.value)}
          />
          <p
            id={pathId + "-description"}
            className={cn(
              "text-sm text-muted-foreground",
              submitted && !pathValid && "text-destructive",
            )}
          >
            {submitted && !pathValid
              ? "Enter an absolute request path without spaces or a fragment."
              : "Reaches " + draft.method + " " + routeLabel(draft.path) + "."}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={regionId}>Region</Label>
          <Select value={draft.region} onValueChange={(value) => change("region", value)}>
            <SelectTrigger id={regionId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  <span className="font-mono text-xs">{region.value}</span>
                  <span className="text-xs text-muted-foreground">{region.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            The edge the call leaves from, which sets its round trip.
          </p>
        </div>
      </form>
      <SheetFooter className="shrink-0 flex-row items-center gap-2 border-t bg-muted/40 px-5 py-3">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <div className="flex-1" />
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" form={pathId + "-form"} disabled={!draft.host || !draft.region}>
          <Send /> Send
        </Button>
      </SheetFooter>
    </>
  );
}

export function RequestComposer({
  open,
  onOpenChange,
  original,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  original?: ApiRequest;
  onSend: (draft: ReplayDraft, original?: ApiRequest) => void;
}) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={sheetClassName}
        onOpenAutoFocus={(event) => {
          opener.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
          event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          if (opener.current?.isConnected) {
            event.preventDefault();
            opener.current.focus();
          }
        }}
      >
        {open && (
          <ComposerForm
            key={original?.id ?? "new"}
            original={original}
            onCancel={() => onOpenChange(false)}
            onSend={(draft, source) => {
              onSend(draft, source);
              onOpenChange(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

export function RequestDetails({
  request,
  requests,
  history = requests,
  onRequestChange,
  onReplay,
}: {
  request: ApiRequest | null;
  requests: ApiRequest[];
  history?: ApiRequest[];
  onRequestChange: (request: ApiRequest | null) => void;
  onReplay: (draft: ReplayDraft, original?: ApiRequest) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("overview");
  const opener = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (wasEditing.current && !editing) editRef.current?.focus();
    wasEditing.current = editing;
  }, [editing]);
  function close() {
    setEditing(false);
    setTab("overview");
    onRequestChange(null);
  }
  const index = request ? requests.findIndex((candidate) => candidate.id === request.id) : -1;
  const query = new URLSearchParams(request?.path.split("?").slice(1).join("?") ?? "");
  return (
    <Sheet
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent
        ref={contentRef}
        className={sheetClassName}
        showCloseButton={editing}
        onOpenAutoFocus={(event) => {
          opener.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
          event.preventDefault();
          contentRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          if (opener.current?.isConnected) {
            event.preventDefault();
            opener.current.focus();
          }
        }}
      >
        {request &&
          (editing ? (
            <ComposerForm
              key={request.id + "-replay"}
              original={request}
              onBack={() => setEditing(false)}
              onCancel={close}
              onSend={(draft, original) => {
                onReplay(draft, original);
                setEditing(false);
              }}
            />
          ) : (
            <>
              <SheetHeader className="shrink-0 gap-2 border-b px-5 pt-3 pb-3">
                <div className="flex min-w-0 items-center gap-1">
                  <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
                    {request.id}
                  </span>
                  <CodeBlockCopyButton
                    key={request.id + "-copy"}
                    value={request.id}
                    position="inline"
                    labels={{ copy: "Copy request ID", copied: "Copied request ID" }}
                  />
                  <ButtonGroup className="ml-auto shrink-0" aria-label="Requests">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Previous request"
                      disabled={index <= 0}
                      onClick={() => {
                        if (index > 0) onRequestChange(requests[index - 1]);
                      }}
                    >
                      <ArrowUp />
                    </Button>
                    <ButtonGroupText className="bg-transparent px-2 text-xs font-normal tabular-nums">
                      {index >= 0 ? index + 1 : "—"} of {requests.length}
                    </ButtonGroupText>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Next request"
                      disabled={index < 0 || index >= requests.length - 1}
                      onClick={() => {
                        if (index >= 0 && index < requests.length - 1)
                          onRequestChange(requests[index + 1]);
                      }}
                    >
                      <ArrowDown />
                    </Button>
                  </ButtonGroup>
                  <SheetClose asChild>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Close">
                      <X />
                    </Button>
                  </SheetClose>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="min-w-0 break-all text-lg leading-6">
                    {request.method} {routeLabel(request.path)}
                  </SheetTitle>
                  <RequestStatus request={request} />
                </div>
                <SheetDescription className="flex flex-wrap items-center gap-x-1 text-sm">
                  <span className="font-mono">{request.host}</span>
                  <span aria-hidden="true">·</span>
                  <span>{timeLabel(request.timestamp)} UTC</span>
                </SheetDescription>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onReplay(draftFromRequest(request), request)}
                  >
                    <RotateCw /> Replay
                  </Button>
                  <Button
                    ref={editRef}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    <Send /> Edit &amp; Replay
                  </Button>
                </div>
              </SheetHeader>
              <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
                <div className="shrink-0 border-b px-5">
                  <TabsList variant="line" className="h-10 gap-5 p-0" aria-label="Request details">
                    <TabsTrigger
                      value="overview"
                      className="h-10 rounded-none px-0 group-data-horizontal/tabs:after:bottom-0"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="request"
                      className="h-10 rounded-none px-0 group-data-horizontal/tabs:after:bottom-0"
                    >
                      Request
                    </TabsTrigger>
                    <TabsTrigger
                      value="response"
                      className="h-10 rounded-none px-0 group-data-horizontal/tabs:after:bottom-0"
                    >
                      Response
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                  <TabsContent value="overview" className="m-0">
                    <Accordion type="multiple" defaultValue={["details", "timing", "recent"]}>
                      <DetailSection value="details" title="Details">
                        <DetailRows
                          rows={[
                            [
                              "Size",
                              <>
                                {(request.size / 1024).toFixed(1)} KB{" "}
                                <span className="text-muted-foreground">
                                  {request.responseHeaders["content-type"] ?? ""}
                                </span>
                              </>,
                            ],
                            ["Route", routeLabel(request.path)],
                            [
                              "Edge",
                              <>
                                {request.regionName}{" "}
                                <span className="ml-1 font-mono text-xs text-muted-foreground">
                                  {request.region}
                                </span>
                              </>,
                            ],
                            ["Client", request.client],
                            [
                              "IP",
                              <span key="ip" className="font-mono text-xs">
                                {request.ip}
                              </span>,
                            ],
                          ]}
                        />
                      </DetailSection>
                      <DetailSection value="timing" title="Timing">
                        <Timing request={request} />
                      </DetailSection>
                      <DetailSection value="recent" title="Recent Calls">
                        <RecentCalls
                          request={request}
                          requests={history}
                          onRequestChange={onRequestChange}
                        />
                      </DetailSection>
                    </Accordion>
                  </TabsContent>
                  <TabsContent value="request" className="m-0">
                    <Accordion type="multiple" defaultValue={["query", "headers", "body", "curl"]}>
                      <DetailSection value="query" title="Query">
                        {query.size ? (
                          <DetailRows
                            rows={[...query].map<[string, ReactNode]>(([name, value]) => [
                              name,
                              value,
                            ])}
                          />
                        ) : (
                          <p className="py-2 text-sm text-muted-foreground">No query parameters.</p>
                        )}
                      </DetailSection>
                      <DetailSection value="headers" title="Headers">
                        <HeaderRows headers={request.requestHeaders} />
                      </DetailSection>
                      {request.requestBody && (
                        <DetailSection value="body" title="Body">
                          <RequestCode
                            key={request.id + "-request-body"}
                            code={request.requestBody}
                            filename="request.json"
                            language="json"
                          />
                        </DetailSection>
                      )}
                      <DetailSection value="curl" title="cURL">
                        <RequestCode
                          key={request.id + "-curl"}
                          code={requestCurl(request)}
                          filename="request.sh"
                          language="bash"
                        />
                      </DetailSection>
                    </Accordion>
                  </TabsContent>
                  <TabsContent value="response" className="m-0">
                    <Accordion type="multiple" defaultValue={["headers", "body"]}>
                      <DetailSection value="headers" title="Headers">
                        <HeaderRows headers={request.responseHeaders} />
                      </DetailSection>
                      <DetailSection value="body" title="Body Preview">
                        {request.responseBody ? (
                          <RequestCode
                            key={request.id + "-response"}
                            code={request.responseBody}
                            filename="body.json"
                            language="json"
                          />
                        ) : (
                          <p className="py-2 text-sm text-muted-foreground">
                            No response body recorded.
                          </p>
                        )}
                      </DetailSection>
                    </Accordion>
                  </TabsContent>
                </div>
              </Tabs>
            </>
          ))}
      </SheetContent>
    </Sheet>
  );
}
