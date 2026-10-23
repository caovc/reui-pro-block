import { useState } from "react";
import type { CSSProperties } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Database,
  FileText,
  Folder,
  Layers,
  MapPin,
  Package,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Frame,
  FramePanel,
  FrameHeader,
  FrameFooter,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CardStage, FramedGrid, LocalLink, Actions } from "./common";
const metrics = [
  {
    value: "$28.5k",
    trend: "23.08%",
    label: "Annual trend",
    report: "Full Sales Report",
    icon: Database,
    color: "#2b9f43",
  },
  {
    value: "2.3k",
    trend: "12%",
    label: "More Signups",
    report: "Full Customer Report",
    icon: Folder,
    color: "#5138ee",
  },
  {
    value: "84%",
    trend: "18.4%",
    label: "Conversion Lift",
    report: "Full Growth Report",
    icon: BarChart3,
    color: "#df1d42",
  },
  {
    value: "1.2k",
    trend: "9.7%",
    label: "Active Runs",
    report: "Full Activity Report",
    icon: Activity,
    color: "#bc1bd5",
  },
];
export function KpiReports() {
  const [report, setReport] = useState<(typeof metrics)[number] | null>(null);
  return (
    <CardStage variant={4}>
      <div className="refined-kpi-grid">
        {metrics.map((m) => (
          <Frame
            variant="ghost"
            key={m.report}
            className="refined-kpi"
            style={{ "--kpi-color": m.color } as CSSProperties}
          >
            <FramePanel className="refined-kpi-main">
              <IconTile variant="elevated">
                <m.icon />
              </IconTile>
              <div className="refined-kpi-value">
                <Button
                  variant="link"
                  className="h-auto p-0 text-inherit text-[length:inherit] font-[inherit]"
                  onClick={() => setReport(m)}
                >
                  {m.value}
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-white/75">
                <Badge className="gap-1 rounded-md bg-black/10 px-1 text-[10px] font-normal text-white hover:bg-black/10">
                  <TrendingUp />
                  {m.trend}
                </Badge>
                <span>{m.label}</span>
              </div>
            </FramePanel>
            <FrameFooter className="!border-0 !bg-transparent !p-0">
              <Button
                variant="link"
                className="refined-kpi-footer h-auto justify-between rounded-none text-xs text-white"
                onClick={() => setReport(m)}
              >
                {m.report}
                <ArrowRight />
              </Button>
            </FrameFooter>
          </Frame>
        ))}
      </div>
      <Dialog
        open={!!report}
        onOpenChange={(open) => {
          if (!open) setReport(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{report?.report}</DialogTitle>
            <DialogDescription>Sample report details for this local preview.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border p-5">
            <p className="text-3xl font-semibold">{report?.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {report?.trend} · {report?.label}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const data = new Blob(
                [`Report,Value,Trend\n${report?.report},${report?.value},${report?.trend}\n`],
                { type: "text/csv" },
              );
              const url = URL.createObjectURL(data);
              const a = document.createElement("a");
              a.href = url;
              a.download = "sample-report.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export sample CSV
          </Button>
        </DialogContent>
      </Dialog>
    </CardStage>
  );
}

const services = [
  {
    title: "Database Server",
    status: "Online",
    time: "Last backup 10 mins ago",
    icon: Database,
    color: "var(--card-success)",
  },
  {
    title: "Storage Bucket",
    status: "Synced",
    time: "Last backup 10 mins ago",
    icon: Folder,
    color: "var(--card-info)",
  },
  {
    title: "Analytics Engine",
    status: "Idle",
    time: "Last run 1 day ago",
    icon: BarChart3,
    color: "var(--card-violet)",
  },
];
export function ServiceStatus() {
  return (
    <CardStage variant={8}>
      <FramedGrid columns={3}>
        {services.map(({ title, status, time, icon: Icon, color }) => (
          <FramePanel key={title} className="refined-pattern">
            <div className="flex items-center gap-3">
              <IconTile variant="elevated">
                <Icon />
              </IconTile>
              <div className="min-w-0">
                <FrameTitle>
                  <LocalLink
                    title={title}
                    description={`${status} · ${time}. This is sample service status, with no connected monitoring backend.`}
                  >
                    {title}
                  </LocalLink>
                </FrameTitle>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px]">
                  <span className="flex items-center gap-1" style={{ color }}>
                    <span className="size-1.5 rounded-full bg-current" />
                    {status}
                  </span>
                  <span className="text-muted-foreground">{time}</span>
                </div>
              </div>
            </div>
          </FramePanel>
        ))}
      </FramedGrid>
    </CardStage>
  );
}

type Report = {
  id: number;
  date: string;
  title: string;
  description: string;
  tags: string[];
  tint: string;
};
const initialReports: Report[] = [
  {
    id: 1,
    date: "AUG 22, 2025",
    title: "Monthly Revenue Insights and Market Performance",
    description:
      "Analyze revenue changes and growth patterns across multiple regions. Get detailed performance metrics to refine strategies and identify opportunities.",
    tags: ["Finances", "Insights", "Report"],
    tint: "color-mix(in oklab,var(--card-info) 25%,var(--background))",
  },
  {
    id: 2,
    date: "JUL 10, 2025",
    title: "User Engagement and Retention Analysis Report",
    description:
      "Review user activity, retention rates, and engagement trends to optimize onboarding and feature adoption for a better customer experience.",
    tags: ["Users", "Retention", "Growth"],
    tint: "color-mix(in oklab,var(--card-success) 23%,var(--background))",
  },
  {
    id: 3,
    date: "JUN 05, 2025",
    title: "Product Development Roadmap and Feature Update",
    description:
      "Stay informed on upcoming features, release timelines, and progress updates to align development goals with market needs and user demands.",
    tags: ["Product", "Roadmap", "Update"],
    tint: "color-mix(in oklab,var(--muted-foreground) 16%,var(--background))",
  },
];
const tagIcons: Record<string, typeof FileText> = {
  Finances: BarChart3,
  Insights: Layers,
  Report: FileText,
  Users,
  Retention: Shield,
  Growth: TrendingUp,
  Product: Package,
  Roadmap: MapPin,
  Update: Activity,
};
export function ReportUpdates() {
  const [reports, setReports] = useState(initialReports);
  const [editing, setEditing] = useState<Report | null>(null);
  return (
    <CardStage variant={10}>
      <div className="refined-report-grid">
        {reports.map((r) => (
          <Frame key={r.id} style={{ background: r.tint }}>
            <FrameHeader className="flex h-8 items-center justify-between px-2 flex-row">
              <time className="text-xs">{r.date}</time>
              <Actions
                label={r.title}
                onEdit={() => setEditing(r)}
                onDuplicate={() =>
                  setReports([
                    ...reports,
                    {
                      ...r,
                      id: Math.max(...reports.map((v) => v.id)) + 1,
                      title: `${r.title} (copy)`,
                    },
                  ])
                }
              />
            </FrameHeader>
            <FramePanel className="flex flex-col gap-3">
              <div>
                <FrameTitle>
                  <LocalLink title={r.title} description={r.description}>
                    {r.title}
                  </LocalLink>
                </FrameTitle>
              </div>
              <div className="flex flex-col gap-3">
                <FrameDescription className="!text-sm">{r.description}</FrameDescription>
                <Separator />
                <div className="flex flex-wrap gap-1.5">
                  {r.tags.map((tag) => {
                    const Icon = tagIcons[tag];
                    return (
                      <Badge
                        variant="secondary"
                        className="gap-1 px-1 text-[10px] font-normal"
                        key={tag}
                      >
                        <Icon />
                        {tag}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </FramePanel>
          </Frame>
        ))}
      </div>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit report</DialogTitle>
            <DialogDescription>Changes are kept in this local preview.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                setReports(
                  reports.map((r) =>
                    r.id === editing.id
                      ? {
                          ...r,
                          title: String(data.get("title")),
                          description: String(data.get("description")),
                        }
                      : r,
                  ),
                );
                setEditing(null);
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="report-title">Report title</FieldLabel>
                  <Input id="report-title" name="title" required defaultValue={editing.title} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="report-description">Description</FieldLabel>
                  <Textarea
                    id="report-description"
                    name="description"
                    required
                    defaultValue={editing.description}
                  />
                </Field>
              </FieldGroup>
              <Button>Save report</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </CardStage>
  );
}
