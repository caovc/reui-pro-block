import { useState } from "react";
import { ChartNoAxesCombined, Eye, Plus } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionRow, EmptyHero, EmptyStage, LocalDialog } from "./first-run/shared";

export default function ReportsEmpty() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [metric, setMetric] = useState("Company overview");
  const [report, setReport] = useState<{ name: string; metric: string; sample: boolean } | null>(
    null,
  );

  return (
    <EmptyStage id={4}>
      <Card className="empty-first-split py-0">
        <CardContent className="empty-first-split-inner px-0">
          <div className="empty-first-split-copy">
            <EmptyHero
              media={
                <div className="grid size-12 place-items-center rounded-xl border bg-muted/60">
                  <ChartNoAxesCombined className="size-6" />
                </div>
              }
              title={report ? "Your report is ready" : "No reports for this workspace"}
              description={
                report
                  ? "Review this local example, or add another report to explore a different view."
                  : "Create your first report to turn tracked companies into one clear view your team can share."
              }
            >
              <ActionRow>
                <Button
                  onClick={() => {
                    setName("");
                    setOpen(true);
                  }}
                >
                  <Plus />
                  Add report
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setReport({
                      name: "Workspace performance",
                      metric: "Company overview",
                      sample: true,
                    })
                  }
                >
                  <Eye />
                  View sample
                </Button>
                {report && (
                  <Button variant="ghost" onClick={() => setReport(null)}>
                    Reset preview
                  </Button>
                )}
              </ActionRow>
            </EmptyHero>
          </div>
          <section
            className="empty-first-preview"
            data-testid="report-preview"
            data-populated={!!report}
            aria-label="Report preview"
          >
            {report && (
              <>
                <Badge variant="secondary">{report.sample ? "Sample report" : "Local draft"}</Badge>
                <h2 className="mt-4">{report.name}</h2>
                <p>{report.metric} · No external company data connected</p>
                <div className="empty-first-preview-list">
                  {[
                    ["Tracked companies", "24"],
                    ["Active opportunities", "12"],
                    ["Review complete", "83%"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </CardContent>
      </Card>
      <LocalDialog
        title="Add report"
        description="Create a local sample report. The displayed metrics are fixtures, not connected workspace data."
        open={open}
        onOpenChange={setOpen}
      >
        <form
          className="empty-first-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            setReport({ name: name.trim(), metric, sample: false });
            setOpen(false);
          }}
        >
          <label>
            Report name
            <Input
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Quarterly workspace review"
            />
          </label>
          <label>
            Report type
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Company overview", "Opportunity pipeline", "Team activity"].map((value) => (
                  <SelectItem value={value} key={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button type="submit">Create report</Button>
        </form>
      </LocalDialog>
    </EmptyStage>
  );
}
