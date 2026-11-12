import { useMemo } from "react";
import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  Database,
  Ellipsis,
  ListFilter,
  Mail,
  Network,
  Plus,
  Search,
  Settings2,
  ShoppingCart,
  Star,
  Wallet,
  Webhook,
} from "lucide-react";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DomainGridSurface,
  domainSelectionColumn,
  useDomainGrid,
  type DomainColumn,
} from "@/blocks/data/grid-advanced-model-grid";
import { StrataHeaderActions } from "./strata-context";
import {
  strataOwner,
  strataService,
  type StrataPageProps,
  type StrataRoute,
} from "./strata-domain";
import {
  selectStrataReleases,
  strataReleaseAge,
  strataReleaseDuration,
  strataReleaseTime,
  summarizeStrataReleases,
  type StrataRelease,
  type StrataReleaseStatus,
  type StrataReleaseTab,
  type StrataReleasesModel,
} from "./strata-releases-model";
import "./strata-releases.css";

export type StrataReleasesProps = StrataPageProps & { model: StrataReleasesModel };
const statusNames: Record<StrataReleaseStatus, string> = {
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
  "rolled-back": "Rolled back",
};
const tabNames: Record<StrataReleaseTab, string> = {
  all: "All",
  live: "Live",
  failed: "Failed",
  "rolled-back": "Rolled back",
};

export function StrataReleaseServiceIcon({ serviceId }: { serviceId: string }) {
  const Icon =
    serviceId === "checkout-api"
      ? ShoppingCart
      : serviceId.includes("payment")
        ? Wallet
        : serviceId.includes("webhook")
          ? Webhook
          : serviceId.includes("search")
            ? Search
            : serviceId.includes("email")
              ? Mail
              : serviceId.includes("edge")
                ? Network
                : Database;
  return <Icon aria-hidden="true" />;
}

export function StrataReleasePageActions({
  route,
  props,
  deployLabel,
}: {
  route: StrataRoute;
  props: StrataReleasesProps;
  deployLabel: string;
}) {
  const pinned = props.pinnedRoutes.includes(route);
  return (
    <StrataHeaderActions>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={pinned}
        onClick={() => props.onTogglePin(route)}
      >
        <Star fill={pinned ? "currentColor" : "none"} />
        <span>{pinned ? "Unpin" : "Pin"}</span>
      </Button>
      <Button size="sm" disabled>
        <Plus />
        {deployLabel}
      </Button>
    </StrataHeaderActions>
  );
}

function ReleaseStatus({ status }: { status: StrataReleaseStatus }) {
  return (
    <Badge
      variant={
        status === "succeeded"
          ? "success-light"
          : status === "failed"
            ? "destructive-light"
            : "secondary"
      }
      className="strata-release-status"
    >
      {status === "running" && (
        <Spinner aria-hidden="true" className="size-3 motion-reduce:animate-none" />
      )}
      {statusNames[status]}
    </Badge>
  );
}

function Pipeline({ row, caption = false }: { row: StrataRelease; caption?: boolean }) {
  const label =
    row.status === "running"
      ? `Canary 50% running, ${row.completedStages} of 6 stages passed`
      : row.status === "failed"
        ? `Failed at Wave 1, ${row.completedStages} of 6 stages passed`
        : `Rollout complete, ${row.completedStages} of 6 stages passed`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="strata-release-pipeline" role="img" aria-label={label} tabIndex={0}>
          <span className="strata-release-stage-track">
            {Array.from({ length: 6 }, (_, index) => (
              <Progress
                key={index}
                value={
                  index < row.completedStages ||
                  (row.status === "failed" && index === row.completedStages)
                    ? 100
                    : row.status === "running" && index === row.completedStages
                      ? 65
                      : 0
                }
                aria-hidden="true"
                data-stage={
                  index < row.completedStages
                    ? "passed"
                    : row.status === "failed" && index === row.completedStages
                      ? "failed"
                      : row.status === "running" && index === row.completedStages
                        ? "current"
                        : "waiting"
                }
              />
            ))}
          </span>
          <span>
            {caption && row.status === "running" ? "Canary 50%" : `${row.completedStages}/6`}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ReleaseAuthor({ authorId }: { authorId: string }) {
  const author = strataOwner(authorId)!;
  return (
    <span className="strata-release-author">
      <Avatar>
        <AvatarFallback>
          {author.name
            .split(" ")
            .map((word) => word[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <span>{author.name}</span>
    </span>
  );
}

function EnvironmentCards({ model, environment }: StrataReleasesProps) {
  const environments = (["Staging", "Sandbox", "Production"] as const).filter(
    (value) => environment === "all" || environment === value,
  );
  return (
    <Frame dense className="strata-release-environments" role="region" aria-label="Environments">
      <FrameHeader className="strata-release-frame-header">
        <div>
          <FrameTitle>Environments</FrameTitle>
          <FrameDescription>{model.serviceCount} services across 3 environments</FrameDescription>
        </div>
        <Button variant="outline" size="sm" disabled>
          Services
          <ChevronDown />
        </Button>
      </FrameHeader>
      <div className="strata-release-environment-grid">
        {environments.map((value, index) => {
          const rows = selectStrataReleases(model.history, { environment: value });
          const current = rows[0];
          const failures = rows.filter((row) => row.status === "failed").length;
          return (
            <div className="strata-release-environment-step" key={value}>
              <FramePanel fit className="strata-release-environment-card">
                <div className="strata-release-environment-heading">
                  <h3>{value}</h3>
                  <Badge variant={failures ? "destructive-light" : "success-light"}>
                    {failures ? `${failures} failed` : "Healthy"}
                  </Badge>
                  <Button variant="ghost" size="icon-sm" disabled aria-label={`${value} actions`}>
                    <Ellipsis />
                  </Button>
                </div>
                <p className="strata-release-environment-cluster">
                  <code>
                    {value === "Production"
                      ? "prod-us-east-1 · prod-eu-central-1"
                      : "staging-us-east-1"}
                  </code>
                  {value !== "Production" && (
                    <span> · {value === "Staging" ? "On merge" : "Partner testing"}</span>
                  )}
                </p>
                {current && (
                  <>
                    <div className="strata-release-environment-service">
                      <StrataReleaseServiceIcon serviceId={current.serviceId} />
                      <span>{strataService(current.serviceId)!.name}</span>
                      <ReleaseStatus status={current.status} />
                    </div>
                    <div className="strata-release-environment-version">
                      <strong>v{current.version}</strong>
                      <span>from v{current.previousVersion}</span>
                    </div>
                    <div className="strata-release-environment-commit">
                      <code>{current.commit}</code>
                      <span title={current.summary}>{current.summary}</span>
                    </div>
                    <Pipeline row={current} caption />
                    <div className="strata-release-environment-footer">
                      <ReleaseAuthor authorId={current.authorId} />
                      <span>·</span>
                      <span>
                        {current.status === "running"
                          ? `Running ${strataReleaseDuration(current.durationSeconds)}`
                          : strataReleaseAge(current.startedAt)}
                      </span>
                    </div>
                  </>
                )}
              </FramePanel>
              {index < environments.length - 1 && (
                <Button
                  className="strata-release-promote"
                  variant="outline"
                  size="icon-sm"
                  disabled
                  aria-label={`Promote ${value} to ${environments[index + 1]}`}
                >
                  <ArrowRight className="strata-release-promote-right" />
                  <ArrowDown className="strata-release-promote-down" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

export function StrataReleases(props: StrataReleasesProps) {
  const { model, environment } = props;
  const scoped = useMemo(
    () => selectStrataReleases(model.history, { environment }),
    [model.history, environment],
  );
  const counts = summarizeStrataReleases(scoped);
  const visible = useMemo(
    () => selectStrataReleases(scoped, { tab: model.historyTab, query: model.historyQuery }),
    [scoped, model.historyTab, model.historyQuery],
  );
  const columns = useMemo<DomainColumn<StrataRelease>[]>(
    () => [
      { ...domainSelectionColumn<StrataRelease>((row) => row.id), size: 36 },
      {
        id: "deploy",
        header: "Deploy",
        accessorFn: (row) => strataService(row.serviceId)!.name,
        size: 204,
        cell: ({ row }) => (
          <div className="strata-release-deploy-cell">
            <div>
              <StrataReleaseServiceIcon serviceId={row.original.serviceId} />
              <span>{strataService(row.original.serviceId)!.name}</span>
            </div>
            <small>
              v{row.original.version}
              <span>·</span>
              {row.original.id}
            </small>
          </div>
        ),
      },
      {
        id: "commit",
        header: "Commit",
        accessorFn: (row) => row.commit,
        size: 194,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="strata-release-commit-cell">
            <code>{row.original.commit}</code>
            <span title={row.original.summary}>{row.original.summary}</span>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        size: 118,
        cell: ({ row }) => <ReleaseStatus status={row.original.status} />,
      },
      {
        id: "pipeline",
        header: () => "Pipeline",
        size: 142,
        enableSorting: false,
        cell: ({ row }) => <Pipeline row={row.original} />,
      },
      {
        id: "duration",
        header: "Duration",
        accessorKey: "durationSeconds",
        size: 112,
        cell: ({ row }) => strataReleaseDuration(row.original.durationSeconds),
      },
      {
        id: "author",
        header: "Author",
        accessorFn: (row) => strataOwner(row.authorId)!.name,
        size: 154,
        cell: ({ row }) => <ReleaseAuthor authorId={row.original.authorId} />,
      },
      {
        id: "started",
        header: "Started",
        accessorKey: "startedAt",
        size: 158,
        cell: ({ row }) => (
          <span className="strata-release-started">
            <time dateTime={new Date(row.original.startedAt).toISOString()}>
              Oct {new Date(row.original.startedAt).getUTCDate()},{" "}
              {strataReleaseTime(row.original.startedAt)}
            </time>
            <small>{strataReleaseAge(row.original.startedAt)}</small>
          </span>
        ),
      },
      {
        id: "actions",
        header: () => null,
        size: 42,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${row.original.id}`}
            disabled
          >
            <Ellipsis />
          </Button>
        ),
      },
    ],
    [],
  );
  const table = useDomainGrid({
    data: visible,
    columns,
    selection: model.selection,
    onSelectionChange: model.setSelection,
    pagination: model.pagination,
    onPaginationChange: model.setPagination,
    sorting: model.historySorting,
    onSortingChange: model.setHistorySorting,
  });
  return (
    <div className="strata-releases" data-strata-page="releases">
      <StrataReleasePageActions route="/deployments" props={props} deployLabel="New Deploy" />
      <h1 className="sr-only">Releases</h1>
      <EnvironmentCards {...props} />
      <Frame dense className="strata-release-history" role="region" aria-label="Deploy history">
        <FrameHeader className="strata-release-frame-header">
          <div>
            <FrameTitle>Deploy History</FrameTitle>
            <FrameDescription>{scoped.length} deploys</FrameDescription>
          </div>
          <Button variant="outline" size="sm" disabled aria-label="Display settings">
            <Settings2 />
            Settings
          </Button>
        </FrameHeader>
        <FramePanel className="strata-release-history-panel">
          <Tabs
            value={model.historyTab}
            onValueChange={(value) => {
              model.setHistoryTab(value as StrataReleaseTab);
              model.setPagination({ ...model.pagination, pageIndex: 0 });
            }}
          >
            <TabsList variant="line" aria-label="Deploy history status">
              {(Object.keys(tabNames) as StrataReleaseTab[]).map((value) => (
                <TabsTrigger key={value} value={value}>
                  {tabNames[value]}
                  <span className="strata-release-tab-count">{counts[value]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={model.historyTab}>
              <div className="strata-release-history-toolbar">
                <InputGroup>
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-label="Search deploys"
                    placeholder="Search deploys or commits…"
                    value={model.historyQuery}
                    onChange={(event) => {
                      model.setHistoryQuery(event.target.value);
                      model.setPagination({ ...model.pagination, pageIndex: 0 });
                    }}
                  />
                </InputGroup>
                <Button variant="outline" size="sm" disabled>
                  <ListFilter />
                  Filter
                </Button>
              </div>
              <DomainGridSurface
                table={table}
                className="strata-release-history-grid"
                scrollArea="horizontal"
                paginationControls={{ noun: "deploys", sizes: [10, 20, 50] }}
              />
            </TabsContent>
          </Tabs>
        </FramePanel>
      </Frame>
    </div>
  );
}
