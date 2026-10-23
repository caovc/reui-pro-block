import {
  CalendarCheck,
  CircleX,
  MessageSquare,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Frame,
  FramePanel,
  FrameHeader,
  FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Stage, GridFrame, People } from "../extended/common";
import "./final-kpis.css";
export function ComplianceStrip() {
  return (
    <Stage id={32} width={976}>
      <Frame>
        <FramePanel className="final-compliance-grid p-0">
          {[
            {
              name: "Passing Controls",
              value: "92% - 42",
              note: "/73 controls",
              icon: ShieldCheck,
              tone: "text-success-foreground",
            },
            {
              name: "Open Tickets",
              value: "22% - 16",
              note: "/74 tickets",
              icon: MessageSquare,
              tone: "text-blue-500",
            },
            {
              name: "Critical Issues",
              value: "5% - 6",
              note: "/107 issues",
              icon: CircleX,
              tone: "text-destructive",
            },
            {
              name: "Verified Findings",
              value: "64% - 68",
              note: "/107",
              icon: CalendarCheck,
              tone: "text-info",
            },
          ].map(({ name, value, note, icon: Icon, tone }) => (
            <div key={name}>
              <h3 className="text-xs font-normal text-muted-foreground">
                {name}
              </h3>
              <p className="mt-5 flex flex-wrap items-center gap-1 text-xs">
                <Icon className={`mr-1 size-3.5 shrink-0 ${tone}`} />
                <span>{value}</span>
                <span className="text-muted-foreground">{note}</span>
              </p>
            </div>
          ))}
          <div className="final-kpi-dots">
            <h3 className="mb-4 text-xs font-normal text-muted-foreground">
              Team
            </h3>
            <People extra={1} />
          </div>
        </FramePanel>
      </Frame>
    </Stage>
  );
}
const periodMetrics = [
  {
    name: "Total Orders",
    bold: "1,246",
    faint: "",
    delta: "23.08%",
    period: "Annual trend",
    up: true,
  },
  {
    name: "Cumulative Spend",
    bold: "$89,378",
    faint: ".02",
    delta: "3.82%",
    period: "Monthly trend",
    up: true,
  },
  {
    name: "Avg. Order Value(AOV)",
    bold: "$68",
    faint: ".50",
    delta: "0.39%",
    period: "Weekly trend",
    up: false,
  },
  {
    name: "Account Balance",
    bold: "$2,345",
    faint: ".94",
    delta: "1.04%",
    period: "Daily trend",
    up: true,
  },
];
export function PeriodTrends() {
  return (
    <Stage id={34} width={804}>
      <div className="final-period-grid">
        {periodMetrics.map(({ name, bold, faint, delta, period, up }) => (
          <Frame key={name}>
            <FrameHeader>
              <FrameTitle className="text-xs font-medium">{name}</FrameTitle>
            </FrameHeader>
            <FramePanel className="flex flex-col gap-3">
              <p className="text-xl font-semibold tracking-tight">
                {bold}
                <span className="text-muted-foreground/35">{faint}</span>
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  size="sm"
                  variant={up ? "success-light" : "destructive-light"}
                >
                  {up ? <TrendingUp /> : <TrendingDown />}
                  {delta}
                </Badge>
                <span className="text-xs text-muted-foreground">{period}</span>
              </div>
            </FramePanel>
          </Frame>
        ))}
      </div>
    </Stage>
  );
}
export function DealInvoiceTiles() {
  return (
    <Stage id={35} width={944}>
      <GridFrame columns={4}>
        {[
          ["Avg. Deal Size", "$14,9M"],
          ["Due Deals", "16"],
          ["Pending Invoices", "$2.7M"],
          ["Active Clients", "36"],
        ].map(([name, value]) => (
          <FramePanel
            key={name}
            className="final-kpi-dots flex min-h-[90px] flex-col gap-3"
          >
            <p className="text-sm text-muted-foreground">{name}</p>
            <p className="text-xl font-semibold tracking-tight">{value}</p>
          </FramePanel>
        ))}
      </GridFrame>
    </Stage>
  );
}
