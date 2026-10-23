import { downloadContent } from "./download";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DialogSurface } from "../../dialog-variants/first-run/free/dialog-surface";
import { WorkspaceTrail } from "../first-run/free/trail";
import { PersonAvatar } from "../first-run/free/presence";
import { ToolbarSearch } from "./free/search";
import { ToolbarDatePicker } from "./free/single-date";
import { RefreshSelect } from "./free/refresh-select";
import { CompareToggle } from "./free/compare-toggle";
import { DashboardActions } from "./free/dashboard-actions";
import { PlaceholderPanel, ToolbarNotice, ToolbarScene } from "./support";

export default function AnalyticsToolbarNavbar() {
  const [date, setDate] = useState<Date | undefined>(() => new Date());
  const [compare, setCompare] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState("off");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateLabel = date ? format(date, "yyyy-MM-dd") : "none";
  const link = window.location.href;
  useEffect(() => {
    if (autoRefresh === "off") return;
    const interval = setInterval(
      () => setRefreshCount((current) => current + 1),
      Number(autoRefresh) * 1000,
    );
    return () => clearInterval(interval);
  }, [autoRefresh]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    timer.current = setTimeout(() => {
      setRefreshing(false);
      setRefreshCount((current) => current + 1);
    }, 1200);
  }
  function action(value: string) {
    if (value === "edit")
      setNotice("Dashboard editing selected locally. No remote dashboard was changed.");
    if (value === "embed") setEmbedOpen(true);
    if (value === "csv")
      downloadContent(
        "analytics.csv",
        `date,metric,value,comparison\n${dateLabel},visitors,12480,${compare}\n${dateLabel},sessions,18320,${compare}\n`,
        "text/csv",
      );
    if (value === "png") {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 440;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#fff";
      context.fillRect(0, 0, 800, 440);
      context.fillStyle = "#18181b";
      context.font = "24px sans-serif";
      context.fillText("Bricklane · Analytics demo", 32, 48);
      context.font = "16px sans-serif";
      context.fillText(`${dateLabel} · Original local sample export`, 32, 80);
      [100, 160, 120, 220, 180, 260].forEach((height, index) =>
        context.fillRect(48 + index * 110, 400 - height, 64, height),
      );
      canvas.toBlob((blob) => {
        if (blob) downloadContent("analytics.png", blob);
      });
      setNotice("Exported an original local sample chart, not a live dashboard screenshot.");
    }
  }
  return (
    <ToolbarScene id={6}>
      <header className="toolbar-analytics">
        <div className="toolbar-analytics-row">
          <WorkspaceTrail
            items={[{ label: "Dashboards" }, { label: "Analytics Overview" }]}
            onNavigate={() => setNotice("Dashboards selected locally.")}
          />
          <div className="toolbar-actions">
            <ToolbarSearch onSelect={(file) => setNotice(`Selected ${file} locally.`)} />
            <DashboardActions
              refreshing={refreshing}
              onRefresh={refresh}
              onShare={() => setShareOpen(true)}
              onAction={action}
            />
            <PersonAvatar name="Maya Stone" />
          </div>
        </div>
        <Separator />
        <div className="toolbar-analytics-row">
          <div className="toolbar-actions">
            <ToolbarDatePicker date={date} onChange={setDate} />
            <CompareToggle value={compare} onChange={setCompare} />
          </div>
          <div className="toolbar-actions">
            <span className="text-xs text-muted-foreground">Auto refresh</span>
            <RefreshSelect value={autoRefresh} onChange={setAutoRefresh} />
          </div>
        </div>
      </header>
      <PlaceholderPanel>
        <output className="sr-only" aria-live="polite">
          Date: {dateLabel}. Comparison {compare ? "enabled" : "disabled"}. Local refresh count:{" "}
          {refreshCount}.
        </output>
      </PlaceholderPanel>
      <ToolbarNotice>{notice}</ToolbarNotice>
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogSurface
          id={107}
          title="Share dashboard preview"
          description="This shares only this public local preview URL, not account access."
          footer={
            <Button variant="outline" onClick={() => setShareOpen(false)}>
              Close share
            </Button>
          }
        >
          <Field>
            <FieldLabel htmlFor="navbar-dashboard-link">Preview link</FieldLabel>
            <Input id="navbar-dashboard-link" value={link} readOnly />
          </Field>
          <Button
            className="mt-3"
            size="sm"
            onClick={() => {
              void navigator.clipboard
                .writeText(link)
                .then(() => setNotice("Preview link copied. No access permissions changed."));
            }}
          >
            <Copy data-icon="inline-start" />
            Copy link
          </Button>
        </DialogSurface>
      </Dialog>
      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogSurface
          id={108}
          title="Embed preview"
          description="Example iframe for the public preview page."
          footer={
            <Button variant="outline" onClick={() => setEmbedOpen(false)}>
              Close embed
            </Button>
          }
        >
          <Field>
            <FieldLabel htmlFor="navbar-embed-code">Embed code</FieldLabel>
            <Textarea
              id="navbar-embed-code"
              value={`<iframe src="${link}" title="Bricklane analytics preview"></iframe>`}
              readOnly
            />
          </Field>
        </DialogSurface>
      </Dialog>
    </ToolbarScene>
  );
}
