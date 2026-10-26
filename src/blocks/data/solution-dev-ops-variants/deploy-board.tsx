import { useEffect, useReducer, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  CreditCard,
  Database,
  Maximize2,
  Minimize2,
  Search,
  ShieldCheck,
  Webhook,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { IconStack } from "@/components/reui/icon-stack";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { BlockMeta } from "@/data/types";
import {
  createDeployRecords,
  DEPLOY_MERGES,
  DEPLOY_REFERENCE,
  type DeploymentRecord,
} from "./deploy-board-data";
import {
  createDeployBoardState,
  deployBoardReducer,
  deployStatus,
  deployTime,
  filterDeployMerges,
  filterDeployRecords,
  nextDeployWindow,
  type DeployBoardState,
} from "./deploy-board-model";
import { DeployBoardSheet } from "./deploy-board-sheet";
import { SplitFlap } from "./split-flap";
import "../../reference.css";
import "./deploy-board.css";

interface DeployBoardProps {
  block?: BlockMeta;
  initialState?: DeployBoardState;
  onApprove?: (record: DeploymentRecord) => void;
  onRollback?: (record: DeploymentRecord) => void;
  onTrafficChange?: (record: DeploymentRecord) => void;
  onRetry?: (record: DeploymentRecord) => void;
}

function ServiceIcon({ service }: { service: string }) {
  const Icon = service.includes("checkout")
    ? CreditCard
    : service.includes("risk")
      ? ShieldCheck
      : service.includes("catalog")
        ? Search
        : service.includes("inbox")
          ? Bell
          : service.includes("relay")
            ? Webhook
            : Database;
  return <Icon className="size-3.5" aria-hidden="true" />;
}

function StatusTile({ record, value }: { record: DeploymentRecord; value: string }) {
  const variant =
    value.startsWith("Failed") || value === "Blocked"
      ? "destructive-light"
      : value.startsWith("Deployed") || value === "Merged"
        ? "success-light"
        : value.startsWith("Needs") || value.startsWith("Queued")
          ? "warning-light"
          : "secondary";
  return (
    <div className="deploy-status-line">
      <span className="deploy-status-light" data-phase={record.phase} aria-hidden="true" />
      <Badge variant={variant} className="deploy-status-tile">
        <SplitFlap value={value} />
      </Badge>
    </div>
  );
}

function EmptyBoard({ onClear }: { onClear: () => void }) {
  return (
    <Empty className="deploy-empty">
      <EmptyHeader>
        <EmptyMedia>
          <IconStack>
            <Search className="size-5" />
          </IconStack>
        </EmptyMedia>
        <EmptyTitle>No Matching Deploys</EmptyTitle>
        <EmptyDescription>
          No deploy, PR or author on this board matches the filters.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" variant="outline" onClick={onClear}>
          Clear Filters
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export default function DeployBoard({
  initialState,
  onApprove,
  onRollback,
  onTrafficChange,
  onRetry,
}: DeployBoardProps = {}) {
  const [state, dispatch] = useReducer(
    deployBoardReducer,
    initialState,
    (provided) => provided ?? createDeployBoardState(createDeployRecords(), DEPLOY_REFERENCE),
  );
  const [tab, setTab] = useState("deploys");
  const [query, setQuery] = useState("");
  const [environment, setEnvironment] = useState("All envs");
  const [tv, setTv] = useState(false);
  const [sound, setSound] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const callbacks = useRef({ onApprove, onRollback, onTrafficChange, onRetry });
  useEffect(() => {
    callbacks.current = { onApprove, onRollback, onTrafficChange, onRetry };
  }, [onApprove, onRollback, onTrafficChange, onRetry]);
  const noticeToken = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: "tick", seconds: 10 }), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!tv) return;
    const exit = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector('[data-slot="sheet-content"]'))
        setTv(false);
    };
    window.addEventListener("keydown", exit);
    return () => window.removeEventListener("keydown", exit);
  }, [tv]);

  useEffect(() => {
    const notice = state.notice;
    if (!notice || notice.token === noticeToken.current) return;
    noticeToken.current = notice.token;
    const record = state.records.find((item) => item.id === notice.deployId)!;
    const callback =
      notice.kind === "approve"
        ? callbacks.current.onApprove
        : notice.kind === "traffic"
          ? callbacks.current.onTrafficChange
          : notice.kind === "retry"
            ? callbacks.current.onRetry
            : callbacks.current.onRollback;
    callback?.(record);
    toast(notice.title, {
      id: notice.kind === "automatic" ? "bricklane-deploy-automatic" : "bricklane-deploy-write",
      description: notice.description,
      duration: 8000,
      action: notice.undoable
        ? { label: "Undo", onClick: () => dispatch({ type: "undo", token: notice.token }) }
        : undefined,
    });
    if (sound && audio.current) {
      const context = audio.current;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = 180;
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.035);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.04);
    }
  }, [state.notice, state.records, sound]);

  useEffect(() => {
    if (!state.notice) toast.dismiss("bricklane-deploy-write");
  }, [state.notice]);

  useEffect(
    () => () => {
      toast.dismiss("bricklane-deploy-write");
      toast.dismiss("bricklane-deploy-automatic");
      void audio.current?.close();
    },
    [],
  );

  const rows = filterDeployRecords(state.records, query, environment);
  const mergeRows = filterDeployMerges(DEPLOY_MERGES, state.records, query, environment);
  const selectedRecord = state.records.find((record) => record.id === selected) ?? null;
  const clearFilters = () => {
    setQuery("");
    setEnvironment("All envs");
  };
  const openRecord = (record: DeploymentRecord, button: HTMLButtonElement) => {
    opener.current = button;
    setSelected(record.id);
  };
  const fillers = (count: number) =>
    Array.from({ length: Math.max(0, 14 - count) }, (_, index) => (
      <TableRow key={`blank-${index}`} aria-hidden="true" className="deploy-board-filler">
        {Array.from({ length: 6 }, (_, column) => (
          <TableCell key={column} className={column > 0 && column < 5 ? "deploy-desktop-cell" : ""}>
            <span className="deploy-blank-flap" />
          </TableCell>
        ))}
      </TableRow>
    ));

  return (
    <section
      className="deploy-board-stage reui-reference"
      data-tv={tv || undefined}
      aria-label="Deploy board"
    >
      <h1 className="sr-only">Deploy Board</h1>
      <Frame className="deploy-board-frame">
        <FrameHeader className="deploy-board-heading">
          <FrameTitle>Deploy Board</FrameTitle>
          <FrameDescription>Main ships to production every 20 minutes</FrameDescription>
        </FrameHeader>
        <FramePanel className="deploy-board-panel">
          <Tabs value={tab} onValueChange={setTab} className="deploy-board-tabs">
            <div className="deploy-board-toolbar">
              <TabsList variant="line" className="deploy-board-tablist">
                <TabsTrigger value="deploys">
                  Deploys{" "}
                  <Badge variant="outline" size="sm">
                    {rows.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="merges">
                  Merges{" "}
                  <Badge variant="outline" size="sm">
                    {mergeRows.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <div className="deploy-board-filters">
                <InputGroup className="deploy-board-search">
                  <InputGroupInput
                    aria-label="Search the board"
                    placeholder="Search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  {query && (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        aria-label="Clear search"
                        size="icon-xs"
                        onClick={() => setQuery("")}
                      >
                        <X />
                      </InputGroupButton>
                    </InputGroupAddon>
                  )}
                </InputGroup>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger className="deploy-board-environment" aria-label="Environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="reui-reference">
                    {["All envs", "Production", "Staging", "Sandbox"].map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="deploy-board-tools">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle
                      variant="outline"
                      size="sm"
                      aria-label="Board sound"
                      pressed={sound}
                      onPressedChange={(enabled) => {
                        setSound(enabled);
                        if (enabled) {
                          try {
                            audio.current ??= new AudioContext();
                            void audio.current.resume().catch(() => setSound(false));
                          } catch {
                            setSound(false);
                            toast.error("Sound is unavailable in this browser");
                          }
                        }
                      }}
                    >
                      {sound ? <Bell /> : <BellOff />}
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent className="reui-reference">Board sound</TooltipContent>
                </Tooltip>
                <Toggle
                  variant="outline"
                  size="sm"
                  aria-label="TV mode"
                  className="deploy-tv-button"
                  pressed={tv}
                  onPressedChange={setTv}
                >
                  {tv ? <Minimize2 /> : <Maximize2 />}
                </Toggle>
              </div>
              <span className="deploy-next-window">
                Next window {deployTime(nextDeployWindow(state.now))}
              </span>
              <span className="deploy-board-clock">
                <SplitFlap value={deployTime(state.now)} characters />
                <span>UTC</span>
              </span>
            </div>
            <TabsContent value="deploys" className="m-0">
              <Table aria-label="Deploys" className="deploy-board-table">
                <TableHeader>
                  <TableRow>
                    {["Time", "Service", "Version", "Environment", "Region", "Status"].map(
                      (name, index) => (
                        <TableHead
                          key={name}
                          className={index > 0 && index < 5 ? "deploy-desktop-cell" : ""}
                        >
                          {name}
                        </TableHead>
                      ),
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((record) => (
                    <TableRow
                      key={record.id}
                      className="deploy-board-row"
                      data-phase={record.phase}
                    >
                      <TableCell>
                        <button
                          type="button"
                          className="deploy-row-open"
                          aria-label={`Open ${record.id}, ${record.service} ${record.version} to ${record.environment} ${record.region}, ${deployStatus(record)}`}
                          onClick={(event) => openRecord(record, event.currentTarget)}
                        />
                        <SplitFlap value={deployTime(record.windowAt)} characters />
                      </TableCell>
                      <TableCell className="deploy-desktop-cell">
                        <div className="deploy-service">
                          <ServiceIcon service={record.service} />
                          <SplitFlap value={record.service} />
                        </div>
                      </TableCell>
                      <TableCell className="deploy-desktop-cell">
                        <SplitFlap value={record.version} />
                      </TableCell>
                      <TableCell className="deploy-desktop-cell">
                        <SplitFlap value={record.environment} />
                      </TableCell>
                      <TableCell className="deploy-desktop-cell">
                        <div className="deploy-region">
                          <span aria-hidden="true">
                            {record.region === "us-east-1"
                              ? "US"
                              : record.region === "eu-west-1"
                                ? "IE"
                                : "SG"}
                          </span>
                          <SplitFlap value={record.region} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusTile record={record} value={deployStatus(record)} />
                        <span className="deploy-phone-summary">
                          {record.service} {record.version}, {record.environment} {record.region}
                        </span>
                        {record.phase === "Needs approval" && (
                          <span className="deploy-window-countdown">
                            {Math.max(0, Math.ceil((record.windowAt - state.now) / 60_000))} min
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length > 0 && fillers(rows.length)}
                </TableBody>
              </Table>
              {rows.length === 0 && <EmptyBoard onClear={clearFilters} />}
            </TabsContent>
            <TabsContent value="merges" className="m-0">
              <Table aria-label="Merges" className="deploy-board-table">
                <TableHeader>
                  <TableRow>
                    {["Time", "Service", "Version", "Pull request", "Deploy", "Status"].map(
                      (name, index) => (
                        <TableHead
                          key={name}
                          className={index > 0 && index < 5 ? "deploy-desktop-cell" : ""}
                        >
                          {name}
                        </TableHead>
                      ),
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mergeRows.map((item) => {
                    const record = state.records.find((value) => value.id === item.deployId)!;
                    const mergeState =
                      item.state === "Merging" && state.now >= item.mergedAt
                        ? "Merged"
                        : item.state;
                    return (
                      <TableRow key={item.id} className="deploy-board-row">
                        <TableCell>
                          <button
                            type="button"
                            className="deploy-row-open"
                            aria-label={`Open Pull request ${item.id}, ${record.service} ${record.version}, ${mergeState}, ships in ${record.id}`}
                            onClick={(event) => openRecord(record, event.currentTarget)}
                          />
                          <SplitFlap
                            value={item.state === "Blocked" ? "—" : deployTime(item.mergedAt)}
                            characters
                          />
                        </TableCell>
                        <TableCell className="deploy-desktop-cell">
                          <div className="deploy-service">
                            <ServiceIcon service={record.service} />
                            <SplitFlap value={record.service} />
                          </div>
                        </TableCell>
                        <TableCell className="deploy-desktop-cell">
                          <SplitFlap value={record.version} />
                        </TableCell>
                        <TableCell className="deploy-desktop-cell">
                          <span title={`${item.author}, ${item.branch}`}>
                            <SplitFlap value={`#${item.id}`} />
                          </span>
                        </TableCell>
                        <TableCell className="deploy-desktop-cell">
                          <SplitFlap value={record.id} />
                        </TableCell>
                        <TableCell>
                          <StatusTile record={record} value={mergeState} />
                          <span className="deploy-phone-summary">
                            #{item.id} {record.service} · {item.author}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {mergeRows.length > 0 && fillers(mergeRows.length)}
                </TableBody>
              </Table>
              {mergeRows.length === 0 && <EmptyBoard onClear={clearFilters} />}
            </TabsContent>
          </Tabs>
        </FramePanel>
        <FrameFooter className="deploy-board-footer">
          <span>
            <i className="bg-warning" />
            Needs approval <i className="bg-success" />
            Rolling out
          </span>
          <span>
            {tv ? (
              <>
                <kbd>Esc</kbd> Exit TV
              </>
            ) : (
              "All times UTC"
            )}
          </span>
        </FrameFooter>
      </Frame>
      <DeployBoardSheet
        record={selectedRecord}
        records={state.records}
        now={state.now}
        notice={state.notice}
        onClose={() => {
          setSelected(null);
        }}
        onSelect={(id) => {
          setSelected(id);
        }}
        onAction={dispatch}
        returnFocus={() => opener.current?.focus()}
      />
      <p className="sr-only" role="status">
        {state.notice?.description ?? "Bricklane local deployment simulation"}
      </p>
    </section>
  );
}
