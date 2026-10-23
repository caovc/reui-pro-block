import { useState } from "react";
import {
  Bike,
  BriefcaseBusiness,
  ChartNoAxesColumnIncreasing,
  Gem,
  Landmark,
  Wallet,
} from "lucide-react";
import { Frame, FramePanel } from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartStage } from "./chart-chrome";
import { MiniTrend, SparkDelta } from "./sparkline-primitives";
import { sparkSeries, sparkTones as c } from "./sparkline-data";

const portfolios = [
  {
    title: "Main Wallet (USD)",
    value: "$2,435,900",
    change: "+18%",
    amount: "$214,356",
    tone: "#171717",
    down: false,
    icon: Wallet,
  },
  {
    title: "Reserve Fund (USD)",
    value: "$1,980,000",
    change: "−3%",
    amount: "$58,000",
    tone: "#6845ee",
    down: true,
    icon: BriefcaseBusiness,
  },
  {
    title: "Growth Portfolio (USD)",
    value: "$3,245,500",
    change: "+10%",
    amount: "$295,000",
    tone: "#edc30c",
    down: false,
    icon: ChartNoAxesColumnIncreasing,
  },
];
export function WalletBalances() {
  return (
    <ChartStage>
      <Frame className="grid w-full max-w-[950px] gap-1 md:grid-cols-3">
        {portfolios.map((portfolio, i) => (
          <FramePanel
            key={portfolio.title}
            className="relative flex min-w-0 flex-col overflow-hidden p-0"
          >
            <header className="flex items-start gap-3 p-5">
              <IconTile variant="solid" style={{ background: portfolio.tone }}>
                <portfolio.icon />
              </IconTile>
              <div className="min-w-0">
                <h3 className="text-xs text-muted-foreground">{portfolio.title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-base font-semibold">
                  <span>{portfolio.value}</span>
                  <span
                    className="text-xs font-normal"
                    style={{ color: portfolio.down ? c.pink : c.green }}
                  >
                    {portfolio.change} ({portfolio.amount})
                  </span>
                </p>
              </div>
            </header>
            <div className="mt-5">
              <MiniTrend
                label={`${portfolio.title} trend`}
                values={sparkSeries(i, 28, !portfolio.down)}
                color={portfolio.down ? c.pink : c.green}
                dotted
                curve="linear"
                height={80}
              />
            </div>
          </FramePanel>
        ))}
      </Frame>
    </ChartStage>
  );
}

const wealth = [
  {
    title: "Net worth",
    value: "$6.8M",
    delta: "+$185k",
    tone: "up" as const,
    color: c.green,
    brands: false,
    icon: Landmark,
  },
  {
    title: "Portfolio",
    value: "$4.2M",
    delta: "−$96k",
    tone: "down" as const,
    color: c.pink,
    brands: true,
    icon: Wallet,
  },
  {
    title: "Investments",
    value: "+0.14%",
    delta: "+$89k",
    tone: "flat" as const,
    color: c.amber,
    brands: true,
    icon: Gem,
  },
  {
    title: "Cashflow",
    value: "$320k",
    delta: "+$73k",
    tone: "up" as const,
    color: c.green,
    brands: false,
    icon: Wallet,
  },
];
export function WealthOverview() {
  return (
    <ChartStage>
      <Frame className="grid w-full max-w-[500px] gap-1 sm:grid-cols-2">
        {wealth.map((metric, i) => (
          <FramePanel key={metric.title} className="flex min-w-0 flex-col overflow-hidden p-0">
            <header className="px-5 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs text-muted-foreground">{metric.title}</h3>
                {metric.brands ? (
                  <AvatarGroup className="-space-x-1" aria-label={`${metric.title} holdings`}>
                    {["North", "Apex", "Birch"].map((name, j) => (
                      <Avatar key={name} className="size-4" title={name}>
                        <AvatarFallback
                          className="text-[7px]"
                          style={{ color: [c.green, c.blue, c.purple][j] }}
                        >
                          {name[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </AvatarGroup>
                ) : (
                  <span className="text-[10px] text-muted-foreground">1w</span>
                )}
              </div>
              <p className="mt-4 flex flex-wrap items-center gap-2 text-2xl font-semibold">
                <span>{metric.value}</span>
                <SparkDelta direction={metric.tone}>{metric.delta}</SparkDelta>
              </p>
            </header>
            <div className="mt-6">
              <MiniTrend
                label={`${metric.title} trend`}
                values={sparkSeries(i + 2, 28, metric.tone !== "down")}
                color={metric.color}
                curve="linear"
                area
                tooltips
                height={67}
              />
            </div>
          </FramePanel>
        ))}
      </Frame>
    </ChartStage>
  );
}

const distancePeriods = {
  Week: { value: "1,562", seed: 5, count: 48 },
  Month: { value: "6,248", seed: 8, count: 62 },
  Year: { value: "74,891", seed: 11, count: 52 },
};
export function DistanceTracker() {
  const [period, setPeriod] = useState<keyof typeof distancePeriods>("Week");
  const selected = distancePeriods[period];
  return (
    <ChartStage>
      <Frame className="w-full max-w-[552px]">
        <FramePanel className="overflow-hidden p-0">
          <header className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <IconTile variant="solid" className="bg-teal-600">
                <Bike />
              </IconTile>
              <p className="text-2xl font-semibold tabular-nums" aria-live="polite">
                {selected.value}
                <span className="ml-1 font-normal text-muted-foreground/45">km</span>
              </p>
            </div>
            <Tabs
              className="w-full sm:w-auto"
              value={period}
              onValueChange={(value) => setPeriod(value as keyof typeof distancePeriods)}
            >
              <TabsList className="w-full">
                {Object.keys(distancePeriods).map((name) => (
                  <TabsTrigger key={name} value={name}>
                    {name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </header>
          <div role="tabpanel" aria-label={period} className="mt-7">
            <MiniTrend
              label={`${period} distance trend`}
              values={sparkSeries(selected.seed, selected.count)}
              color={c.teal}
              dotted
              curve="linear"
              height={120}
            />
          </div>
        </FramePanel>
      </Frame>
    </ChartStage>
  );
}
