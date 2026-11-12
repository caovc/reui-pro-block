import { useMemo } from "react";
import { Bell, BellOff, Monitor, Search } from "lucide-react";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DomainGridSurface,
  useDomainGrid,
  type DomainColumn,
} from "@/blocks/data/grid-advanced-model-grid";
import { useIsMobile } from "@/hooks/use-mobile";
import { strataService, type StrataEnvironmentFilter } from "./strata-domain";
import {
  selectStrataBoard,
  selectStrataMerges,
  strataBoardStatusLabel,
  strataReleaseTime,
  type StrataBoardDeploy,
  type StrataBoardMerge,
} from "./strata-releases-model";
import {
  StrataReleasePageActions,
  StrataReleaseServiceIcon,
  type StrataReleasesProps,
} from "./strata-releases";
import "./strata-release-board.css";

function SplitTime({ timestamp, utc = false }: { timestamp: number; utc?: boolean }) {
  const text = strataReleaseTime(timestamp);
  return (
    <time
      dateTime={new Date(timestamp).toISOString()}
      className="strata-board-time"
      aria-label={`${text}${utc ? " UTC" : ""}`}
    >
      <span aria-hidden="true">
        {[...text].map((digit, index) => (
          <span key={index} data-colon={digit === ":"}>
            {digit}
          </span>
        ))}
      </span>
      {utc && <small>UTC</small>}
    </time>
  );
}

function UnscheduledTime() {
  return (
    <span className="strata-board-time" role="img" aria-label="Not scheduled">
      <span aria-hidden="true">
        {["", "", ":", "", ""].map((digit, index) => (
          <span key={index} data-colon={digit === ":"}>
            {digit}
          </span>
        ))}
      </span>
    </span>
  );
}

function BoardService({ serviceId }: { serviceId: string }) {
  return (
    <span className="strata-board-service">
      <span className="strata-board-tile-icon">
        <StrataReleaseServiceIcon serviceId={serviceId} />
      </span>
      <span className="strata-board-tile">{strataService(serviceId)!.name}</span>
    </span>
  );
}

function BoardIdleRows({ count }: { count: number }) {
  return (
    <div className="strata-board-idle-rows" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          {Array.from({ length: 6 }, (_, cell) => (
            <span key={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MergeStatus({ row, mobile }: { row: StrataBoardMerge; mobile: boolean }) {
  const label =
    row.status === "merged" ? "Merged" : row.status === "merging" ? "Merging" : "Blocked";
  return (
    <div className="strata-board-status-cell">
      <div className="strata-board-status-line">
        <span className="strata-board-dot" data-status={row.status} aria-hidden="true" />
        <Badge
          variant={
            row.status === "merged"
              ? "success-light"
              : row.status === "blocked"
                ? "warning-light"
                : "secondary"
          }
          className="strata-board-status"
          data-status={row.status}
          title={row.blockedReason}
        >
          {label}
        </Badge>
      </div>
      {mobile && (
        <span
          className="strata-board-row-summary"
          title={`${strataService(row.serviceId)!.name} v${row.version}, #${row.pullRequest} → ${row.deployId}`}
        >
          {strataService(row.serviceId)!.name} v{row.version}, #{row.pullRequest} → {row.deployId}
        </span>
      )}
    </div>
  );
}

function BoardStatus({
  row,
  mobile,
  now,
}: {
  row: StrataBoardDeploy;
  mobile: boolean;
  now: number;
}) {
  const label = strataBoardStatusLabel(row, now);
  return (
    <div className="strata-board-status-cell">
      <div className="strata-board-status-line">
        <span className="strata-board-dot" data-status={row.status} aria-hidden="true" />
        <Badge
          variant={
            row.status === "failed"
              ? "destructive-light"
              : row.status === "deployed"
                ? "success-light"
                : ["approval", "queued"].includes(row.status)
                  ? "warning-light"
                  : "secondary"
          }
          className="strata-board-status"
          data-status={row.status}
        >
          {label}
        </Badge>
        {row.status === "approval" && (
          <span className="strata-board-wait">
            {Math.max(0, Math.ceil((row.scheduledAt - now) / 60000))} min
          </span>
        )}
      </div>
      {mobile && (
        <span
          className="strata-board-row-summary"
          title={`${row.serviceId} v${row.version}, ${row.environment} ${row.region}`}
        >
          {strataService(row.serviceId)!.name} v{row.version}, {row.environment} {row.region}
        </span>
      )}
    </div>
  );
}

/** The free DataGrid owns the table. Split-flap tiles are local presentation only. */
export function StrataReleaseBoard(props: StrataReleasesProps) {
  const { model, environment } = props;
  const mobile = useIsMobile();
  const rows = useMemo(
    () =>
      selectStrataBoard(model.board, {
        environment,
        boardEnvironment: model.boardEnvironment,
        query: model.boardQuery,
      }),
    [model.board, environment, model.boardEnvironment, model.boardQuery],
  );
  const scoped = selectStrataBoard(model.board, {
    environment,
    boardEnvironment: model.boardEnvironment,
  });
  const mergeRows = useMemo(
    () =>
      selectStrataMerges(model.merges, {
        environment,
        boardEnvironment: model.boardEnvironment,
        query: model.boardQuery,
      }),
    [model.merges, environment, model.boardEnvironment, model.boardQuery],
  );
  const scopedMerges = selectStrataMerges(model.merges, {
    environment,
    boardEnvironment: model.boardEnvironment,
  });
  const columns = useMemo<DomainColumn<StrataBoardDeploy>[]>(
    () => [
      {
        id: "time",
        header: () => "TIME",
        size: mobile ? 76 : 90,
        enableSorting: false,
        cell: ({ row }) => <SplitTime timestamp={row.original.scheduledAt} />,
      },
      {
        id: "service",
        header: () => "SERVICE",
        size: 220,
        enableSorting: false,
        cell: ({ row }) => <BoardService serviceId={row.original.serviceId} />,
      },
      {
        id: "version",
        header: () => "VERSION",
        size: 102,
        enableSorting: false,
        cell: ({ row }) => <span className="strata-board-tile">v{row.original.version}</span>,
      },
      {
        id: "environment",
        header: () => "ENVIRONMENT",
        accessorKey: "environment",
        size: 130,
        enableSorting: false,
        cell: ({ row }) => <span className="strata-board-tile">{row.original.environment}</span>,
      },
      {
        id: "region",
        header: () => "REGION",
        accessorKey: "region",
        size: 186,
        enableSorting: false,
        cell: ({ row }) => <span className="strata-board-tile">{row.original.region}</span>,
      },
      {
        id: "status",
        header: () => "STATUS",
        size: mobile ? 276 : 400,
        enableSorting: false,
        cell: ({ row }) => <BoardStatus row={row.original} mobile={mobile} now={model.clockMs} />,
      },
    ],
    [mobile, model.clockMs],
  );
  const table = useDomainGrid({
    data: rows,
    columns,
    alwaysHidden: mobile ? ["service", "version", "environment", "region"] : [],
  });
  const mergeColumns = useMemo<DomainColumn<StrataBoardMerge>[]>(
    () => [
      {
        id: "time",
        header: () => "TIME",
        size: mobile ? 76 : 90,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.scheduledAt === null ? (
            <UnscheduledTime />
          ) : (
            <SplitTime timestamp={row.original.scheduledAt} />
          ),
      },
      {
        id: "service",
        header: () => "SERVICE",
        size: 220,
        enableSorting: false,
        cell: ({ row }) => <BoardService serviceId={row.original.serviceId} />,
      },
      {
        id: "version",
        header: () => "VERSION",
        size: 102,
        enableSorting: false,
        cell: ({ row }) => <span className="strata-board-tile">v{row.original.version}</span>,
      },
      {
        id: "pull-request",
        header: () => "PULL REQUEST",
        size: 130,
        enableSorting: false,
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="strata-board-tile"
                tabIndex={0}
                aria-label={`Pull request ${row.original.pullRequest}, ${row.original.branch}`}
              >
                #{row.original.pullRequest}
              </span>
            </TooltipTrigger>
            <TooltipContent>{row.original.branch}</TooltipContent>
          </Tooltip>
        ),
      },
      {
        id: "deploy",
        header: () => "DEPLOY",
        size: 160,
        enableSorting: false,
        cell: ({ row }) => <span className="strata-board-tile">{row.original.deployId}</span>,
      },
      {
        id: "status",
        header: () => "STATUS",
        size: mobile ? 276 : 426,
        enableSorting: false,
        cell: ({ row }) => <MergeStatus row={row.original} mobile={mobile} />,
      },
    ],
    [mobile],
  );
  const mergeTable = useDomainGrid({
    data: mergeRows,
    columns: mergeColumns,
    alwaysHidden: mobile ? ["service", "version", "pull-request", "deploy"] : [],
  });
  return (
    <div className="strata-release-board" data-strata-page="release-board">
      <StrataReleasePageActions route="/deployments/board" props={props} deployLabel="New deploy" />
      <h1 className="sr-only">Deploy board</h1>
      <Frame dense className="strata-board-frame" role="region" aria-label="Deploy board">
        <FrameHeader>
          <FrameTitle>Deploy Board</FrameTitle>
          <FrameDescription>Main ships to production every 20 minutes</FrameDescription>
        </FrameHeader>
        <FramePanel className="strata-board-panel">
          <Tabs
            value={model.boardTab}
            onValueChange={(value) => {
              if (value === "deploys" || value === "merges") model.setBoardTab(value);
            }}
          >
            <div className="strata-board-toolbar">
              <TabsList variant="line" aria-label="Board activity">
                <TabsTrigger value="deploys">
                  Deploys<span className="strata-release-tab-count">{scoped.length}</span>
                </TabsTrigger>
                <TabsTrigger value="merges">
                  Merges<span className="strata-release-tab-count">{scopedMerges.length}</span>
                </TabsTrigger>
              </TabsList>
              <div className="strata-board-filters">
                <InputGroup>
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Search"
                    aria-label="Search the board"
                    value={model.boardQuery}
                    onChange={(event) => model.setBoardQuery(event.target.value)}
                  />
                </InputGroup>
                <Select
                  value={model.boardEnvironment}
                  onValueChange={(value) =>
                    model.setBoardEnvironment(value as StrataEnvironmentFilter)
                  }
                >
                  <SelectTrigger aria-label="Board environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All envs</SelectItem>
                    {["Production", "Staging", "Sandbox"].map((value) => (
                      <SelectItem value={value} key={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Board sound"
                      aria-pressed={!model.muted}
                      onClick={() => model.setMuted(!model.muted)}
                    >
                      {model.muted ? <BellOff /> : <Bell />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {model.muted ? "Enable board sounds" : "Mute board sounds"}
                  </TooltipContent>
                </Tooltip>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled
                  aria-label="TV mode"
                  className="strata-board-tv"
                >
                  <Monitor />
                </Button>
              </div>
              <div className="strata-board-clock">
                <span>Next window {strataReleaseTime(model.nextWindow)}</span>
                <SplitTime timestamp={model.clockMs} utc />
              </div>
            </div>
            <TabsContent value="deploys" className="strata-board-deploys">
              <DomainGridSurface
                table={table}
                className="strata-board-grid"
                layout={{ width: "fixed" }}
              />
              {!model.boardQuery && scoped.length === 12 && <BoardIdleRows count={2} />}
            </TabsContent>
            <TabsContent value="merges" className="strata-board-merges">
              <DomainGridSurface
                table={mergeTable}
                className="strata-board-grid"
                layout={{ width: "fixed" }}
              />
              {!model.boardQuery && scopedMerges.length === model.merges.length && (
                <BoardIdleRows count={Math.max(0, 14 - scopedMerges.length)} />
              )}
            </TabsContent>
          </Tabs>
        </FramePanel>
        <FrameFooter className="strata-board-footer">
          <div>
            <span>
              <i data-status="approval" />
              Needs approval
            </span>
            <span>
              <i data-status="rolling" />
              Rolling out
            </span>
          </div>
          <span>All times UTC</span>
        </FrameFooter>
      </Frame>
    </div>
  );
}
