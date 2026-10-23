import { useMemo, useState, type CSSProperties } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { IconTile } from "@/components/reui/icon-tile";
import { toast } from "sonner";
import { ChartFrame, ChartStage, ChangePill, UpdatedDot } from "./chart-chrome";
import { ReuiTrend, type TrendSeries } from "./trend-foundation";
import {
  TrendActions,
  TrendChoice,
  TrendExpanded,
  TrendLayers,
  TrendTitle,
} from "./trend-controls";
import { dates, short, sum, trendColors as c } from "./trend-data";
const channels = [
  {
    key: "facebook",
    label: "Facebook",
    color: "#4589e5",
    mark: "f",
    posts: 17,
    impressions: 903400,
    engagements: 30403,
    clicks: 6379,
    change: 0.4,
    rates: [4.19, 2.33, 3.08, 3.33, 3.29, 3.93, 2.76],
  },
  {
    key: "instagram",
    label: "Instagram",
    color: c.orange,
    mark: "◎",
    posts: 21,
    impressions: 1043600,
    engagements: 60349,
    clicks: 3053,
    change: -0.37,
    rates: [6.35, 5.02, 6.33, 5.7, 3.92, 6.19, 7.32],
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    color: "#64748b",
    mark: "in",
    posts: 10,
    impressions: 253000,
    engagements: 10115,
    clicks: 2694,
    change: -0.21,
    rates: [4.62, 3.81, 4.58, 3.57, 4.79, 3.13, 3.59],
  },
];
export default function SocialEngagement() {
  const [period, setPeriod] = useState("Last 7 days"),
    [metric, setMetric] = useState("Engagement rate"),
    [content, setContent] = useState("All content"),
    [enabled, setEnabled] = useState(channels.map((ch) => ch.key)),
    [revision, setRevision] = useState(0),
    [expanded, setExpanded] = useState(false),
    [layers, setLayers] = useState({
      "Previous period": false,
      Gridlines: true,
      "Data points": false,
      "Channel table": true,
    });
  const n =
    period === "Last 24 hours"
      ? 24
      : period === "Last 7 days"
        ? 7
        : period === "Last 30 days"
          ? 30
          : period === "Last 90 days"
            ? 90
            : 12;
  const duration = period === "Last 24 hours" ? 1 / 7 : period === "Last 12 months" ? 52 : n / 7;
  const contentWeight =
    content === "All content" ? 1 : content === "Posts" ? 0.62 : content === "Video" ? 0.38 : 0.24;
  const engagementFactor =
    content === "Video" ? 1.22 : content === "Reels" ? 1.37 : content === "Posts" ? 0.88 : 1;
  const summaries = channels
    .filter((ch) => enabled.includes(ch.key))
    .map((ch) => ({
      ...ch,
      posts: Math.round(ch.posts * duration * contentWeight),
      impressions: Math.round(ch.impressions * duration * contentWeight),
      engagements: Math.round(
        ch.engagements * duration * contentWeight * engagementFactor * (1 + revision * 0.005),
      ),
      clicks: Math.round(ch.clicks * duration * contentWeight),
    }));
  const totalImpressions = sum(summaries.map((ch) => ch.impressions)),
    totalEngagements = sum(summaries.map((ch) => ch.engagements)),
    totalPosts = sum(summaries.map((ch) => ch.posts)),
    totalClicks = sum(summaries.map((ch) => ch.clicks)),
    rate = totalImpressions ? (totalEngagements / totalImpressions) * 100 : 0;
  const labelValue = (v: number) => (metric === "Engagement rate" ? `${v.toFixed(2)}%` : short(v));
  const data = useMemo(() => {
    const names =
      period === "Last 24 hours"
        ? Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`)
        : period === "Last 7 days"
          ? ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"]
          : period === "Last 12 months"
            ? ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"]
            : dates(n);
    return names.map((name, i) => {
      const values: Record<string, number | string> = { name };
      for (const ch of channels) {
        const base = ch.rates[i % 7] * (1 + revision * 0.005) * engagementFactor;
        const bucketFactor =
          period === "Last 24 hours" ? 1 / 24 : period === "Last 12 months" ? 30 : 1;
        const impressions =
          (ch.impressions / 7) * bucketFactor * contentWeight * (1 + Math.sin(i * 0.8) * 0.12);
        const value =
          metric === "Engagement rate"
            ? base
            : metric === "Impressions"
              ? impressions
              : metric === "Engagements"
                ? (impressions * base) / 100
                : (ch.clicks / 7) * bucketFactor * contentWeight * (1 + Math.sin(i * 0.9) * 0.2);
        values[ch.key] = Number(value.toFixed(2));
        values[`${ch.key}Previous`] = Number(
          (value * (metric === "Engagement rate" ? 1.04 : 0.94)).toFixed(2),
        );
      }
      return values as { name: string; [key: string]: string | number };
    });
  }, [period, n, metric, contentWeight, engagementFactor, revision]);
  const series: TrendSeries[] = channels
    .filter((ch) => enabled.includes(ch.key))
    .flatMap((ch) => [
      { key: ch.key, label: ch.label, color: ch.color, dots: layers["Data points"] },
      ...(layers["Previous period"]
        ? [
            {
              key: `${ch.key}Previous`,
              label: `${ch.label} previous`,
              color: ch.color,
              dashed: true,
              opacity: 0.3,
            },
          ]
        : []),
    ]);
  const column = (label: string) =>
    [
      "Channel",
      "Change",
      metric === "Engagement rate"
        ? "Eng. rate"
        : metric === "Link clicks"
          ? "Link clicks"
          : metric,
    ].includes(label)
      ? ""
      : "hidden sm:table-cell";
  const plot = (large = false) =>
    enabled.length === 0 ? (
      <Empty className="min-h-[260px]">
        <EmptyHeader>
          <EmptyTitle>No channels selected</EmptyTitle>
          <EmptyDescription>Choose a channel to compare its performance.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={() => setEnabled(channels.map((ch) => ch.key))}>
            Show all channels
          </Button>
        </EmptyContent>
      </Empty>
    ) : (
      <ReuiTrend
        label="Social channel performance"
        data={data}
        series={series}
        format={labelValue}
        height={large ? 420 : 260}
        domain={[0, "auto"]}
        grid={layers.Gridlines}
      />
    );
  return (
    <ChartStage>
      <ChartFrame
        width="max-w-[1024px]"
        title={<TrendTitle icon={<Share2 />} title="Social Engagement" />}
        description={`${content} · ${period.toLowerCase()}`}
        toolbar={
          <>
            <TrendChoice
              label="Range"
              value={period}
              onChange={setPeriod}
              calendar
              options={[
                "Last 24 hours",
                "Last 7 days",
                "Last 30 days",
                "Last 90 days",
                "Last 12 months",
              ]}
            />
            <TrendChoice
              label="Metric"
              value={metric}
              onChange={setMetric}
              options={["Engagement rate", "Engagements", "Impressions", "Link clicks"]}
            />
            <TrendChoice
              label="Content"
              value={content}
              onChange={setContent}
              options={["All content", "Posts", "Video", "Reels"]}
            />
            <TrendLayers
              layers={layers}
              onChange={(name, v) => setLayers((s) => ({ ...s, [name]: v }))}
            />
            <TrendActions
              title="social-engagement"
              rows={data}
              onRefresh={() => {
                setRevision((v) => v + 1);
                toast.success("Channel totals refreshed");
              }}
              onExpand={() => setExpanded(true)}
            />
          </>
        }
        footer={
          <>
            <UpdatedDot>
              Updated {revision ? "just now" : "2 min ago"} · Closed days · UTC
            </UpdatedDot>
            <span>Rate = engagements / impressions</span>
          </>
        }
      >
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-3 pt-5">
          <div>
            <p className="text-xs text-muted-foreground">{metric}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {labelValue(
                metric === "Engagement rate"
                  ? rate
                  : metric === "Engagements"
                    ? totalEngagements
                    : metric === "Impressions"
                      ? totalImpressions
                      : totalClicks,
              )}
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <ChangePill
                value={metric === "Engagement rate" ? -0.28 : 6.4}
                unit={metric === "Engagement rate" ? " pts" : "%"}
              />
              vs{" "}
              {metric === "Engagement rate"
                ? `${(rate + 0.28).toFixed(2)}%`
                : short(
                    (metric === "Engagements"
                      ? totalEngagements
                      : metric === "Impressions"
                        ? totalImpressions
                        : totalClicks) / 1.064,
                  )}{" "}
              previous
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {channels.map((ch) => (
              <Button
                key={ch.key}
                variant="outline"
                size="sm"
                className="h-6 gap-1.5 bg-muted/25 px-2 text-xs"
                aria-pressed={enabled.includes(ch.key)}
                onClick={() =>
                  setEnabled((s) =>
                    s.includes(ch.key) ? s.filter((key) => key !== ch.key) : [...s, ch.key],
                  )
                }
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: ch.color, opacity: enabled.includes(ch.key) ? 1 : 0.25 }}
                />
                {ch.label}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-6 gap-1.5 px-2 text-xs"
              aria-pressed={layers["Previous period"]}
              onClick={() => setLayers((s) => ({ ...s, "Previous period": !s["Previous period"] }))}
            >
              Previous period
            </Button>
          </div>
        </div>
        {plot()}
        {layers["Channel table"] && (
          <div className="border-t px-3 pb-2">
            <Table
              aria-label="Social channel breakdown"
              className="w-full text-xs sm:min-w-[760px]"
            >
              <TableHeader>
                <TableRow>
                  {[
                    "Channel",
                    "Posts",
                    "Impressions",
                    "Engagements",
                    "Eng. rate",
                    "Link clicks",
                    "Share",
                    "Change",
                  ].map((label) => (
                    <TableHead
                      key={label}
                      className={`${label === "Channel" ? "" : "text-right"} ${column(label)}`}
                    >
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((ch) => (
                  <TableRow key={ch.key}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <IconTile size="xs" variant="soft" style={{ color: ch.color }}>
                          <span className="text-[10px] font-semibold">{ch.mark}</span>
                        </IconTile>
                        {ch.label}
                      </span>
                    </TableCell>
                    <TableCell className={column("Posts") + " text-right"}>{ch.posts}</TableCell>
                    <TableCell className={column("Impressions") + " text-right"}>
                      {short(ch.impressions)}
                    </TableCell>
                    <TableCell className={column("Engagements") + " text-right"}>
                      {ch.engagements.toLocaleString()}
                    </TableCell>
                    <TableCell className={column("Eng. rate") + " text-right"}>
                      {(ch.impressions ? (ch.engagements / ch.impressions) * 100 : 0).toFixed(2)}%
                    </TableCell>
                    <TableCell className={column("Link clicks") + " text-right"}>
                      {ch.clicks.toLocaleString()}
                    </TableCell>
                    <TableCell className={column("Share")}>
                      <span className="flex items-center justify-end gap-2">
                        <Progress
                          value={totalEngagements ? (ch.engagements / totalEngagements) * 100 : 0}
                          className="h-1 w-14 [&_[data-slot=progress-indicator]]:bg-[var(--channel-color)]"
                          style={{ "--channel-color": ch.color } as CSSProperties}
                        />
                        {totalEngagements
                          ? Math.round((ch.engagements / totalEngagements) * 100)
                          : 0}
                        %
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <ChangePill value={ch.change} unit=" pts" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className={column("Posts") + " text-right"}>{totalPosts}</TableCell>
                  <TableCell className={column("Impressions") + " text-right"}>
                    {short(totalImpressions)}
                  </TableCell>
                  <TableCell className={column("Engagements") + " text-right"}>
                    {totalEngagements.toLocaleString()}
                  </TableCell>
                  <TableCell className={column("Eng. rate") + " text-right"}>
                    {rate.toFixed(2)}%
                  </TableCell>
                  <TableCell className={column("Link clicks") + " text-right"}>
                    {totalClicks.toLocaleString()}
                  </TableCell>
                  <TableCell className={column("Share")}>
                    <span className="ml-auto flex h-1.5 w-20 overflow-hidden rounded-full">
                      {summaries.map((ch) => (
                        <span
                          key={ch.key}
                          style={{
                            width: `${totalEngagements ? (ch.engagements / totalEngagements) * 100 : 0}%`,
                            background: ch.color,
                          }}
                        />
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">−0.28 pts</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </ChartFrame>
      <TrendExpanded
        open={expanded}
        onChange={setExpanded}
        title="Social Engagement"
        description={`${metric} · ${content.toLowerCase()} · ${period.toLowerCase()}`}
      >
        {plot(true)}
      </TrendExpanded>
    </ChartStage>
  );
}
