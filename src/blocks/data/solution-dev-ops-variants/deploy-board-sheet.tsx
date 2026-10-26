import { useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  GitCommitHorizontal,
  GitPullRequest,
  LoaderCircle,
  RotateCcw,
  X,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/reui/alert";
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import {
  Timeline,
  TimelineItem,
  TimelineHeader,
  TimelineTitle,
  TimelineDate,
  TimelineIndicator,
  TimelineSeparator,
  TimelineContent,
} from "@/components/reui/timeline";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { useCopyToClipboard } from "@/blocks/application/empty-variants/team-setup/free/use-copy-to-clipboard";
import { demoAvatar } from "@/lib/demo-artwork";
import { cn } from "@/lib/utils";
import { CanaryLever } from "./canary-lever";
import { DEPLOY_CHECKS, type DeploymentRecord } from "./deploy-board-data";
import { deployTime, type DeployAction, type DeployNotice } from "./deploy-board-model";

export function DeployStatusBadge({
  record,
  className,
}: {
  record: DeploymentRecord;
  className?: string;
}) {
  const variant =
    record.phase === "Failed"
      ? "destructive-light"
      : record.phase === "Deployed"
        ? "success-light"
        : record.phase === "Needs approval" || record.phase === "Queued"
          ? "warning-light"
          : "secondary";
  return (
    <Badge variant={variant} size="sm" className={className}>
      {record.phase}
    </Badge>
  );
}

function CopyRecordValue({ value, label }: { value: string; label: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={isCopied ? `Copied ${label}` : `Copy ${label}`}
      onClick={() => copyToClipboard(value)}
    >
      {isCopied ? <Check /> : <Copy />}
    </Button>
  );
}

export function DeployBoardSheet({
  record,
  records,
  now,
  notice,
  onClose,
  onSelect,
  onAction,
  returnFocus,
}: {
  record: DeploymentRecord | null;
  records: DeploymentRecord[];
  now: number;
  notice: DeployNotice | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onAction: (action: DeployAction) => void;
  returnFocus: () => void;
}) {
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const rollbackOpener = useRef<HTMLElement | null>(null);
  const [cancelledFor, setCancelledFor] = useState<string | null>(null);
  const index = records.findIndex((item) => item.id === record?.id);
  const requestRollback = () => {
    rollbackOpener.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setCancelledFor(null);
    setRollbackOpen(true);
  };
  const closeSheet = () => {
    setRollbackOpen(false);
    setCancelledFor(null);
    onClose();
  };
  return (
    <Sheet
      open={record !== null}
      onOpenChange={(open) => {
        if (!open) closeSheet();
      }}
    >
      <SheetContent
        className="deploy-board-sheet reui-reference"
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus();
        }}
      >
        {record && (
          <>
            <SheetHeader className="deploy-detail-header">
              <div className="deploy-detail-topline">
                <div className="flex items-center gap-1 font-mono text-xs">
                  {record.id}
                  <CopyRecordValue value={record.id} label="deploy ID" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-xs text-muted-foreground">
                    {index + 1} of {records.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Previous"
                    disabled={index <= 0}
                    onClick={() => onSelect(records[index - 1].id)}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Next"
                    disabled={index >= records.length - 1}
                    onClick={() => onSelect(records[index + 1].id)}
                  >
                    <ChevronDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close"
                    ref={closeButton}
                    onClick={closeSheet}
                  >
                    <X />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-base">
                  {record.service} {record.version}
                </SheetTitle>
                <DeployStatusBadge record={record} />
              </div>
              <SheetDescription>
                {record.environment} {record.region} · from {record.previousVersion}
              </SheetDescription>
              <div className="deploy-detail-primary">
                {record.phase === "Needs approval" ? (
                  <>
                    <Button size="sm" onClick={() => onAction({ type: "approve", id: record.id })}>
                      <Check />
                      Approve
                    </Button>
                    <span>Second approval, as release manager</span>
                  </>
                ) : record.phase === "Failed" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction({ type: "retry", id: record.id })}
                    >
                      <RotateCcw />
                      Retry
                    </Button>
                    <span>{record.failure}</span>
                  </>
                ) : record.phase === "Rolling out" || record.phase === "Deployed" ? (
                  <>
                    <Button size="sm" variant="outline" onClick={requestRollback}>
                      <RotateCcw />
                      Roll Back
                    </Button>
                    <span>Returns traffic to {record.previousVersion}</span>
                  </>
                ) : (
                  <span>
                    {record.phase === "Rolled back"
                      ? `Rolled back at ${deployTime(record.completedAt ?? record.changedAt)}`
                      : record.phase === "Checks"
                        ? "Checks running"
                        : `Ships in the ${deployTime(record.windowAt)} window`}
                  </span>
                )}
              </div>
            </SheetHeader>
            {notice?.undoable && notice.deployId === record.id && (
              <div className="px-5 pb-3">
                <Alert variant="info">
                  <AlertTitle>{notice.title}</AlertTitle>
                  <AlertDescription>{notice.description}</AlertDescription>
                  <AlertAction>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAction({ type: "undo", token: notice.token })}
                    >
                      Undo
                    </Button>
                  </AlertAction>
                </Alert>
              </div>
            )}
            <Tabs defaultValue="overview" key={record.id} className="deploy-detail-tabs">
              <TabsList variant="line" className="deploy-detail-tablist">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {record.environment === "Production" && (
                  <TabsTrigger value="rollout">Rollout</TabsTrigger>
                )}
                <TabsTrigger value="checks">Checks</TabsTrigger>
                <TabsTrigger value="changes">Changes</TabsTrigger>
                <TabsTrigger value="log">Log</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="deploy-detail-scroll">
                <Frame spacing="sm">
                  <FrameHeader>
                    <FrameTitle>Deploy</FrameTitle>
                    <FrameDescription>
                      {record.environment} release, {record.service}
                    </FrameDescription>
                  </FrameHeader>
                  <FramePanel className="space-y-5">
                    <div className="flex items-center gap-3">
                      <IconTile variant="frame" size="lg">
                        <GitCommitHorizontal />
                      </IconTile>
                      <div>
                        <p className="font-medium">{record.service}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.environment} · {record.id}
                        </p>
                      </div>
                    </div>
                    <dl className="deploy-detail-facts">
                      <div>
                        <dt>Author</dt>
                        <dd>{record.author}</dd>
                      </div>
                      <div>
                        <dt>Pull requests</dt>
                        <dd>{record.pullRequests.map((number) => `#${number}`).join(", ")}</dd>
                      </div>
                      <div>
                        <dt>Region</dt>
                        <dd>{record.region}</dd>
                      </div>
                      <div>
                        <dt>Window</dt>
                        <dd>{deployTime(record.windowAt)} UTC</dd>
                      </div>
                      <div>
                        <dt>Traffic</dt>
                        <dd>{record.target ? `${record.target}%` : "None yet"}</dd>
                      </div>
                      <div>
                        <dt>Step</dt>
                        <dd>{record.phase === "Rolling out" ? "Canary" : record.phase}</dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
                      <span className="flex items-center gap-1 font-mono">
                        <GitCommitHorizontal />
                        {record.commit}
                        <CopyRecordValue value={record.commit} label="commit SHA" />
                      </span>
                      <span>
                        {record.previousVersion} → {record.version}
                      </span>
                    </div>
                  </FramePanel>
                </Frame>
                {record.approvals.length > 0 && (
                  <Frame spacing="sm">
                    <FrameHeader>
                      <FrameTitle>Approvals</FrameTitle>
                      <FrameDescription>
                        {record.approvals.filter((approval) => approval.approvedAt !== null).length}{" "}
                        of 2 approved, code owner first
                      </FrameDescription>
                    </FrameHeader>
                    <FramePanel>
                      <ul className="space-y-4">
                        {record.approvals.map((approval) => (
                          <li key={approval.role} className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarImage src={demoAvatar(approval.name)} alt="" />
                              <AvatarFallback>{approval.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm">{approval.name}</p>
                              <p className="text-xs text-muted-foreground">{approval.role}</p>
                            </div>
                            <span
                              className={cn(
                                "text-xs",
                                approval.approvedAt === null
                                  ? "text-muted-foreground"
                                  : "text-success-foreground",
                              )}
                            >
                              {approval.approvedAt === null
                                ? "Waiting"
                                : `Approved ${deployTime(approval.approvedAt)}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </FramePanel>
                  </Frame>
                )}
                {record.phase === "Needs approval" && (
                  <p className="px-1 text-xs text-muted-foreground">
                    Window opens {deployTime(record.windowAt)}, in{" "}
                    {Math.max(0, Math.ceil((record.windowAt - now) / 60_000))} min
                  </p>
                )}
              </TabsContent>
              {record.environment === "Production" && (
                <TabsContent value="rollout" className="deploy-detail-scroll">
                  <CanaryLever
                    record={record}
                    onTraffic={(value) => onAction({ type: "traffic", id: record.id, value })}
                    onRollback={requestRollback}
                  />
                  {cancelledFor === record.id && (
                    <p role="status" className="sr-only">
                      Rollback cancelled, holding at {record.target} percent
                    </p>
                  )}
                </TabsContent>
              )}
              <TabsContent value="checks" className="deploy-detail-scroll">
                <Frame spacing="sm">
                  <FrameHeader>
                    <FrameTitle>Checks</FrameTitle>
                    <FrameDescription>
                      {record.checks} of 9 passed · attempt {record.attempts}
                    </FrameDescription>
                  </FrameHeader>
                  <FramePanel className="p-0">
                    <ul>
                      {DEPLOY_CHECKS.map(([name, duration], position) => (
                        <li key={name}>
                          <Item className="rounded-none px-4 py-3">
                            <ItemContent>
                              <ItemTitle className="text-sm font-normal">
                                {position < record.checks ? (
                                  <Check className="size-4 text-success" />
                                ) : (
                                  <LoaderCircle className="size-4 text-muted-foreground" />
                                )}
                                {name}
                              </ItemTitle>
                            </ItemContent>
                            <span className="text-xs text-muted-foreground">
                              {position < record.checks ? duration : "Pending"}
                            </span>
                          </Item>
                        </li>
                      ))}
                    </ul>
                  </FramePanel>
                </Frame>
              </TabsContent>
              <TabsContent value="changes" className="deploy-detail-scroll">
                <Frame spacing="sm">
                  <FrameHeader>
                    <FrameTitle>Changes</FrameTitle>
                    <FrameDescription>
                      {record.previousVersion} → {record.version}
                    </FrameDescription>
                  </FrameHeader>
                  <FramePanel className="p-0">
                    {record.pullRequests.map((number, position) => (
                      <Item key={number} className="rounded-none border-b px-4 py-4 last:border-0">
                        <ItemContent>
                          <ItemTitle>
                            <GitPullRequest className="size-4" />#{number}{" "}
                            {position
                              ? "Harden release diagnostics"
                              : `Improve ${record.service} resilience`}
                          </ItemTitle>
                          <ItemDescription>{record.author} · reviewed · main</ItemDescription>
                        </ItemContent>
                      </Item>
                    ))}
                  </FramePanel>
                </Frame>
              </TabsContent>
              <TabsContent value="log" className="deploy-detail-scroll">
                <Frame spacing="sm">
                  <FrameHeader>
                    <FrameTitle>Release Log</FrameTitle>
                    <FrameDescription>Events for {record.id}</FrameDescription>
                  </FrameHeader>
                  <FramePanel>
                    <Timeline value={record.log.length}>
                      {[...record.log].reverse().map((entry, position) => (
                        <TimelineItem key={`${entry.at}-${position}`} step={position + 1}>
                          <TimelineHeader>
                            <TimelineSeparator />
                            <TimelineDate>{deployTime(entry.at)} UTC</TimelineDate>
                            <TimelineTitle>{entry.text}</TimelineTitle>
                            <TimelineIndicator
                              className={entry.tone === "error" ? "border-destructive" : ""}
                            />
                          </TimelineHeader>
                          <TimelineContent>
                            {record.service} · {record.version}
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </FramePanel>
                </Frame>
              </TabsContent>
            </Tabs>
            <AlertDialog open={rollbackOpen} onOpenChange={setRollbackOpen}>
              <AlertDialogContent
                className="reui-reference"
                onCloseAutoFocus={(event) => {
                  // This controlled dialog also opens from native Slider callbacks,
                  // so it has no single AlertDialogTrigger to restore automatically.
                  event.preventDefault();
                  const opener = rollbackOpener.current;
                  if (
                    opener?.isConnected &&
                    !opener.matches(":disabled,[data-disabled],[aria-disabled='true']")
                  ) {
                    opener.focus();
                    return;
                  }
                  // Confirmed rollback can remove or disable the original opener.
                  closeButton.current?.focus();
                }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Roll back {record.service} {record.version}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {record.environment} {record.region} sends {record.target}% of traffic back to{" "}
                    {record.previousVersion}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setCancelledFor(record.id)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onAction({ type: "rollback", id: record.id });
                    }}
                  >
                    Roll Back
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
