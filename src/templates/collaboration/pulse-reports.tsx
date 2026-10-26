import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Smile,
  Timer,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { Frame, FrameHeader, FrameTitle, FrameDescription } from "@/components/reui/frame";
import { Alert, AlertTitle, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DomainGridSurface,
  useDomainGrid,
  type DomainColumn,
} from "@/blocks/data/grid-advanced-model-grid";
import { FilterBar, matchesRules } from "@/blocks/data/grid-filter-controls";
import { MiniTrend } from "@/blocks/data/sparkline-primitives";
import { Button } from "./shared";
import { agentReports, type AgentReport, type PulseReportState } from "./pulse-report-model";

function statusVariant(status: string) {
  return status === "Improving"
    ? "success-light"
    : status === "Slipping"
      ? "destructive-light"
      : status === "Uneven"
        ? "warning-light"
        : "secondary";
}

export function PulseReports({ model }: { model: PulseReportState }) {
  const data = agentReports.filter(
    (agent) => (!model.coaching || agent.status === "Slipping") && matchesRules(agent, model.rules),
  );
  const columns: DomainColumn<AgentReport>[] = [
    {
      id: "agent",
      accessorKey: "agent",
      header: "Agent",
      size: 298,
      cell: ({ row }) => (
        <div className="ct-report-agent">
          {row.original.note ? (
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`${row.getIsExpanded() ? "Collapse" : "Expand"} coaching note for ${row.original.agent}`}
              aria-expanded={row.getIsExpanded()}
              onClick={() =>
                model.setExpanded({
                  ...(typeof model.expanded === "object" ? model.expanded : {}),
                  [row.original.id]: !row.getIsExpanded(),
                })
              }
            >
              {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
            </Button>
          ) : (
            <span className="w-6 shrink-0" />
          )}
          <span>
            {row.original.agent}
            <small>{row.original.queue} queue</small>
          </span>
        </div>
      ),
      meta: {
        expandedContent: (agent: AgentReport) => {
          if (!agent.note) return null;
          const Icon =
            agent.status === "Improving"
              ? CheckCircle
              : agent.status === "Uneven"
                ? TriangleAlert
                : XCircle;
          return (
            <div className="ct-report-note">
              <Alert
                variant={
                  agent.status === "Improving"
                    ? "success"
                    : agent.status === "Uneven"
                      ? "warning"
                      : "destructive"
                }
              >
                <Icon />
                <AlertTitle>{agent.note[0]}</AlertTitle>
                <AlertDescription>{agent.note[1]}</AlertDescription>
              </Alert>
            </div>
          );
        },
      },
    },
    { id: "team", accessorKey: "team", header: "Team", size: 150 },
    { id: "lead", accessorKey: "lead", header: "Lead", size: 160 },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      size: 118,
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    {
      id: "priority",
      accessorKey: "priority",
      header: "Priority",
      size: 110,
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.priority === "Critical" || row.original.priority === "High"
              ? "destructive-light"
              : row.original.priority === "Medium"
                ? "warning-light"
                : "secondary"
          }
        >
          {row.original.priority}
        </Badge>
      ),
    },
    {
      id: "july",
      accessorKey: "july",
      header: "Jul",
      size: 90,
      cell: ({ row }) => <span className="ct-muted">{row.original.july.toFixed(1)}</span>,
    },
    {
      id: "august",
      accessorKey: "august",
      header: "Aug",
      size: 90,
      cell: ({ row }) => <strong className="font-medium">{row.original.august.toFixed(1)}</strong>,
    },
    {
      id: "delta",
      accessorKey: "delta",
      header: "Delta",
      size: 100,
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>{row.original.delta}</Badge>
      ),
    },
    {
      id: "breaches",
      accessorKey: "breaches",
      header: "Breaches",
      size: 100,
      cell: ({ row }) => <span className="text-destructive">{row.original.breaches}</span>,
    },
    { id: "coached", accessorKey: "coached", header: "Last coached", size: 130 },
  ];
  const table = useDomainGrid({
    data,
    columns,
    getRowId: (agent) => agent.id,
    getSubRows: () => [],
    expanded: model.expanded,
    onExpandedChange: model.setExpanded,
    pagination: model.pagination,
    onPaginationChange: model.setPagination,
  });
  function download(format: "csv" | "json") {
    const fields = [
      "agent",
      "team",
      "lead",
      "status",
      "priority",
      "july",
      "august",
      "delta",
      "breaches",
      "coached",
    ] as const;
    const body =
      format === "json"
        ? JSON.stringify(data, null, 2)
        : [
            fields.join(","),
            ...data.map((agent) =>
              fields.map((field) => `"${String(agent[field]).replaceAll('"', '""')}"`).join(","),
            ),
          ].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([body], { type: format === "json" ? "application/json" : "text/csv;charset=utf-8" }),
    );
    link.download = `bricklane-agent-scorecard.${format}`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return (
    <>
      <div className="ct-heading ct-report-heading">
        <p>Resolution rate, handle time and CSAT over time.</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="ct-report-export">
              <Download />
              Export
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => download("csv")}>Download CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => download("json")}>Download JSON</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="ct-report-kpis">
        {[
          {
            label: "Resolution rate",
            value: "91.0%",
            color: "#00bc82",
            Icon: CheckCircle,
            values: [96, 95, 96, 93.7, 94.5, 93.7, 93.2, 92.4, 93.1, 91, 91.8, 91],
          },
          {
            label: "Median handle time",
            value: "1h 12m",
            color: "#3983ff",
            Icon: Timer,
            values: [110, 105, 111, 97, 102, 97, 94, 87, 93, 76, 82, 72],
          },
          {
            label: "CSAT",
            value: "94.2",
            color: "#ff9500",
            Icon: Smile,
            values: [86, 87.5, 87.4, 88, 88, 90.5, 88.6, 91, 91.3, 92, 92, 94.2],
          },
        ].map(({ label, value, color, Icon, values }) => (
          <Frame key={label} variant="ghost" className="ct-report-kpi">
            <div className="ct-toolbar">
              <Icon size={18} style={{ color }} />
              <h2>{label}</h2>
            </div>
            <div className="ct-between">
              <div>
                <small>Jul – Aug</small>
                <strong>{value}</strong>
              </div>
              <div className="ct-report-trend">
                <MiniTrend
                  values={values}
                  label={label}
                  color={color}
                  height={62}
                  area
                  domain={["dataMin", "dataMax"]}
                />
              </div>
            </div>
          </Frame>
        ))}
      </div>
      <Frame className="ct-report-scorecard" spacing="sm">
        <FrameHeader>
          <div className="ct-between">
            <div>
              <FrameTitle>Agent scorecard</FrameTitle>
              <FrameDescription>
                August against July · resolution rate across 10 agents
              </FrameDescription>
            </div>
            <label className="ct-toolbar">
              Needs coaching only
              <Switch
                checked={model.coaching}
                onCheckedChange={(checked) => {
                  model.setCoaching(checked);
                  model.setPagination({ ...model.pagination, pageIndex: 0 });
                }}
              />
            </label>
          </div>
        </FrameHeader>
        <div className="ct-report-filters">
          <FilterBar
            fields={[
              { key: "agent", label: "Agent" },
              {
                key: "team",
                label: "Team",
                type: "select",
                options: [...new Set(agentReports.map((a) => a.team))],
              },
              {
                key: "status",
                label: "Status",
                type: "select",
                options: ["Improving", "Steady", "Uneven", "Slipping"],
              },
              {
                key: "priority",
                label: "Priority",
                type: "select",
                options: ["None", "Low", "Medium", "High", "Critical"],
              },
            ]}
            rules={model.rules}
            onChange={(rules) => {
              model.setRules(rules);
              model.setPagination({ ...model.pagination, pageIndex: 0 });
            }}
          />
        </div>
        <DomainGridSurface
          table={table}
          className="ct-report-grid"
          paginationControls={{ sizes: [5, 10, 25] }}
        />
      </Frame>
    </>
  );
}
