import { useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  PackageCheck,
  PackageX,
  RefreshCw,
  Snail,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Frame, FramePanel, FrameFooter } from "@/components/reui/frame";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChartStage } from "./chart-chrome";
import { DotBed, MiniTrend, SparkDelta } from "./sparkline-primitives";
import { sparkSeries, sparkTones as c } from "./sparkline-data";

type InventoryPeriod = "Week" | "Month" | "Year";
const inventory = {
  Week: {
    values: ["8,420", "1,245", "640", "1,105"],
    changes: ["+3.4%", "−1.2%", "+2.1%", "0.0%"],
    hints: ["Rising", "Gaps easing", "Moving", "Stable"],
    summary: "12,845 products tracked across categories. 76% currently available in stock.",
  },
  Month: {
    values: ["32.8k", "4,980", "2,310", "4,420"],
    changes: ["+6.8%", "−3.7%", "+4.5%", "−0.8%"],
    hints: ["Ahead", "Easing", "Faster", "Steady"],
    summary: "42,420 SKUs reviewed this month; 78% stayed available through demand spikes.",
  },
  Year: {
    values: ["392k", "58.4k", "27.6k", "51.9k"],
    changes: ["+11.9%", "−8.4%", "+7.2%", "+1.5%"],
    hints: ["Ahead", "Improving", "Faster", "Watch"],
    summary: "478,000 SKU snapshots reconciled this year; availability closed 12 points higher.",
  },
};
const inventoryLabels = ["In Stock", "Out-of-Stock", "Pending Restock", "Slow Movers"];
const inventoryIcons = [PackageCheck, PackageX, RefreshCw, Snail];
export function InventoryHealth() {
  const [period, setPeriod] = useState<InventoryPeriod>("Week"),
    [analytics, setAnalytics] = useState(false);
  const selected = inventory[period];
  return (
    <ChartStage>
      <Frame className="w-full max-w-[1150px]">
        <FramePanel className="relative overflow-hidden p-5">
          <DotBed className="opacity-40 [mask-image:linear-gradient(black,transparent)]" />
          <header className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Catalog Health</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                SKU coverage, replenishment pressure, and aging stock in one pass.
              </p>
            </div>
            <Tabs
              className="w-full sm:w-auto"
              value={period}
              onValueChange={(value) => setPeriod(value as InventoryPeriod)}
            >
              <TabsList className="w-full">
                {Object.keys(inventory).map((name) => (
                  <TabsTrigger value={name} key={name}>
                    {name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </header>
          <div className="relative mt-6 grid divide-y md:grid-cols-4 md:divide-x md:divide-y-0">
            {inventoryLabels.map((label, i) => {
              const Icon = inventoryIcons[i];
              return (
                <div
                  key={label}
                  className="flex min-w-0 items-end justify-between gap-3 px-4 py-3 first:pl-0 last:pr-0"
                >
                  <div>
                    <p className="flex items-center gap-2 whitespace-nowrap text-xs font-medium">
                      <Icon className="size-3.5 text-muted-foreground" />
                      {label}
                    </p>
                    <p className="mt-2 text-xl font-semibold tabular-nums">{selected.values[i]}</p>
                    <p className="mt-1 flex items-center gap-2 whitespace-nowrap text-[10px] text-muted-foreground">
                      <SparkDelta direction={i === 1 ? "down" : i === 3 ? "flat" : "up"}>
                        {selected.changes[i]}
                      </SparkDelta>
                      {selected.hints[i]}
                    </p>
                  </div>
                  <div className="w-24 min-w-0">
                    <MiniTrend
                      label={`${label} trend`}
                      color={c.gray}
                      height={46}
                      values={sparkSeries(
                        i + Object.keys(inventory).indexOf(period) * 3,
                        28,
                        i !== 1,
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </FramePanel>
        <FrameFooter className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <Boxes className="size-3.5" />
            {selected.summary}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setAnalytics(true)}
          >
            Show full analytics
            <ArrowUpRight />
          </Button>
        </FrameFooter>
      </Frame>
      <Dialog open={analytics} onOpenChange={setAnalytics}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catalog analytics · {period}</DialogTitle>
            <DialogDescription>{selected.summary}</DialogDescription>
          </DialogHeader>
          <dl className="divide-y">
            {inventoryLabels.map((label, i) => (
              <div key={label} className="flex justify-between py-3">
                <dt className="text-sm">{label}</dt>
                <dd className="font-semibold">{selected.values[i]}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </ChartStage>
  );
}

const businessMetrics = [
  {
    title: "Total Orders",
    value: "1,246",
    faint: "",
    change: "23.08%",
    period: "Annual trend",
    negative: false,
    scale: 18,
  },
  {
    title: "Cumulative Spend",
    value: "$89.3",
    faint: "k",
    change: "3.82%",
    period: "Monthly trend",
    negative: false,
    scale: 1.1,
  },
  {
    title: "Avg. Order Value",
    value: "$68",
    faint: "",
    change: "0.39%",
    period: "Weekly trend",
    negative: true,
    scale: 1.4,
  },
  {
    title: "Account Balance",
    value: "$2.3",
    faint: "k",
    change: "1.04%",
    period: "Daily trend",
    negative: false,
    scale: 0.04,
  },
];
export function KpiStrip() {
  return (
    <ChartStage>
      <Frame className="w-full max-w-[950px]">
        <FramePanel className="grid divide-y p-0 sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
          {businessMetrics.map((metric, i) => (
            <section key={metric.title} className="relative min-w-0 p-5">
              <div className="absolute right-3 top-4 z-10 w-[43%]">
                <MiniTrend
                  label={`${metric.title} trend`}
                  values={sparkSeries(i, 8).map((v) => v * metric.scale)}
                  tooltips
                  color={c.gray}
                  curve="linear"
                  format={(v) =>
                    i === 0
                      ? Math.round(v).toLocaleString()
                      : i === 1 || i === 3
                        ? `$${v.toFixed(1)}k`
                        : `$${v.toFixed(2)}`
                  }
                  height={45}
                />
              </div>
              <p className="relative mt-0.5 text-xl font-semibold tabular-nums">
                {metric.value}
                <span className="text-muted-foreground/40">{metric.faint}</span>
              </p>
              <h3 className="mt-1 text-xs text-muted-foreground">{metric.title}</h3>
              <div className="mt-5 flex items-center gap-2 text-[10px] text-muted-foreground">
                <SparkDelta direction={metric.negative ? "down" : "up"}>{metric.change}</SparkDelta>
                {metric.period}
              </div>
            </section>
          ))}
        </FramePanel>
      </Frame>
    </ChartStage>
  );
}

export function KpiTrendCards() {
  const metrics = [
    { title: "Revenue", value: "6.238$", color: c.green, icon: CircleDollarSign },
    { title: "New Customers", value: "6.202", color: c.blue, icon: UserPlus },
    { title: "Active Users", value: "18.945", color: c.purple, icon: TrendingUp },
  ];
  return (
    <ChartStage>
      <div className="grid w-full max-w-[1150px] gap-5 md:grid-cols-3">
        {metrics.map((m, i) => (
          <Card key={m.title} className="gap-0 overflow-hidden py-0 shadow-sm">
            <CardContent className="p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <m.icon className="size-4" style={{ color: m.color }} />
                {m.title}
              </h3>
              <div className="mt-7 grid grid-cols-[1fr_45%] items-end gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Last 28 days</p>
                  <p className="mt-1 text-xl font-semibold">{m.value}</p>
                </div>
                <MiniTrend
                  label={`${m.title} daily trend`}
                  values={sparkSeries(i, 28).map((v) =>
                    Math.round(v * (i === 0 ? 9 : i === 1 ? 8 : 25)),
                  )}
                  color={m.color}
                  area
                  height={65}
                  tooltips
                  format={(v) =>
                    m.title === "Revenue" ? `$${v.toLocaleString()}` : v.toLocaleString()
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ChartStage>
  );
}

export function OrderMetrics() {
  const metrics = [
    { title: "Cumulative Orders", value: "1,246", change: "23.08%", down: false },
    { title: "Cumulative Spend", value: "$89.3k", change: "3.82%", down: false },
    { title: "Avg. Order Value", value: "$68.1", change: "0.39%", down: true },
    { title: "Account Balance", value: "$2.3k", change: "1.04%", down: false },
    { title: "Avg. Monthly Income", value: "$271.9k", change: "0.39%", down: true },
  ];
  return (
    <ChartStage>
      <Frame className="w-full max-w-[450px]">
        <FramePanel className="p-0">
          <ul className="divide-y">
            {metrics.map((m, i) => (
              <li key={m.title} className="grid grid-cols-[1fr_40%] items-center gap-4 px-5 py-4">
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-base font-semibold">
                    {m.value}
                    <SparkDelta direction={m.down ? "down" : "up"}>{m.change}</SparkDelta>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{m.title}</p>
                </div>
                <MiniTrend
                  label={`${m.title} trend`}
                  values={sparkSeries(i, 30, !m.down)}
                  color={m.down ? c.pink : c.green}
                  grid
                  curve="linear"
                  height={46}
                />
              </li>
            ))}
          </ul>
        </FramePanel>
      </Frame>
    </ChartStage>
  );
}
