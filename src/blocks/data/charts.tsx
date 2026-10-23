import { useId, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  Sankey,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownToLine, ChevronDown, CircleHelp, Play, RefreshCw } from "lucide-react";
import type { BlockProps } from "@/data/types";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { BlockHeading, Status } from "./shared";
import { downloadCsv } from "./data-utils";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const base = [
  { a: 186, b: 120 },
  { a: 305, b: 190 },
  { a: 237, b: 170 },
  { a: 173, b: 140 },
  { a: 309, b: 210 },
  { a: 414, b: 290 },
  { a: 357, b: 240 },
  { a: 475, b: 310 },
  { a: 394, b: 280 },
  { a: 486, b: 350 },
  { a: 512, b: 360 },
  { a: 578, b: 410 },
];
const config = {
  a: { label: "Current period", color: colors[0] },
  b: { label: "Previous period", color: colors[1] },
  c: { label: "Forecast", color: colors[2] },
};
const namesByTitle = (name: string) =>
  /Inventory/.test(name)
    ? ["Stock value", "Available SKUs", "Low stock items", "Stock turnover"]
    : /Cron|SLO|Health|Connection/.test(name)
      ? ["Success rate", "Healthy services", "Avg. latency", "Error budget"]
      : /Wallet|Wealth|Balance/.test(name)
        ? ["Total balance", "Investments", "Cash balance", "Net income"]
        : /Order/.test(name)
          ? ["Total orders", "Revenue", "Average order", "Conversion rate"]
          : ["Total revenue", "Active customers", "Growth rate", "Conversion rate"];
export default function ChartBlock({ block }: BlockProps) {
  const [period, setPeriod] = useState("Month");
  const [metric, setMetric] = useState("Overview");
  const [compare, setCompare] = useState(true);
  const [series, setSeries] = useState(["a", "b"]);
  const [color, setColor] = useState(0);
  const [run, setRun] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const uid = useId().replaceAll(":", "");
  const multiplier = period === "Week" ? 0.6 : period === "Year" ? 1.8 : 1;
  const data = base.map((r, i) => ({
    name: period === "Week" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7] : months[i],
    a: Math.round(
      (r.a + block.index * 11 + run * 17) *
        multiplier *
        (metric === "Revenue" ? 2.6 : metric === "Orders" ? 1.3 : 1),
    ),
    b: Math.round((r.b + block.index * 7) * multiplier),
    c: 240 + i * 23,
  }));
  const isBar = block.category === "bar-chart";
  const isPie = block.category === "pie-chart";
  const isRadial = block.category === "radial-chart";
  const isLine = block.category === "line-chart";
  const isComposed = block.category === "composed-chart";
  const isSpark = block.category === "sparkline";
  const isTracker = block.category === "status-tracker";
  const isSlope = block.category === "slope-chart";
  const isSankey = block.category === "sankey-chart";
  const isGeneration = block.id === "chart-16";
  const total = data.reduce((s, r) => s + r.a, 0);
  const header = (
    <BlockHeading
      title={block.name}
      description={
        isGeneration
          ? "Power generation by source · Today"
          : isTracker
            ? "Production · Updated just now"
            : "Monitor performance and compare across periods."
      }
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setRun((r) => r + 1);
          toast.success("Latest data loaded");
        }}
        aria-label="Refresh chart"
      >
        <RefreshCw />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Oct 1 – Oct 31, 2026
            <ChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            {["Week", "Month", "Year"].map((p) => (
              <DropdownMenuItem key={p} onSelect={() => setPeriod(p)}>
                {p}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Export chart data"
        onClick={() => downloadCsv(block.name, data)}
      >
        <ArrowDownToLine />
      </Button>
    </BlockHeading>
  );
  if (isSpark) {
    const titles = namesByTitle(block.name);
    const list = block.id === "chart-25" || block.id === "chart-44";
    const narrow = block.id === "chart-5";
    const values = /Health|Cron|SLO|Connection/.test(block.name)
      ? ["99.98%", "24 / 26", "142 ms", "87.2%"]
      : /Inventory/.test(block.name)
        ? ["$248,590", "1,428", "24", "8.6×"]
        : ["$48,294", "2,420", "18.6%", "3.24%"];
    return (
      <div className="w-full rounded-xl border bg-background p-6">
        <div className="mb-5">{header}</div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="mb-5">
            {["Week", "Month", "Year"].map((p) => (
              <TabsTrigger key={p} value={p}>
                {p}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div
          className={
            list
              ? "flex flex-col divide-y"
              : `grid gap-4 ${narrow ? "md:grid-cols-2" : "md:grid-cols-4"}`
          }
        >
          {titles.slice(0, block.id === "chart-11" ? 1 : 4).map((t, i) => (
            <Card
              key={t}
              className={
                list
                  ? "grid grid-cols-3 items-center rounded-none border-0 py-4 shadow-none"
                  : "gap-2 overflow-hidden shadow-none"
              }
            >
              <CardHeader className="gap-1">
                <CardDescription className="text-xs">{t}</CardDescription>
                <CardTitle className="text-2xl tracking-tight">{values[i]}</CardTitle>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Badge variant="secondary">+{(12.8 + i * 2.4).toFixed(1)}%</Badge>vs. last period
                </div>
              </CardHeader>
              <CardContent className={list ? "col-span-2 pb-0" : "px-0 pb-0"}>
                <ChartContainer config={config} className="h-20 w-full">
                  <AreaChart
                    data={data.map((d, j) => ({
                      ...d,
                      a: Math.round(d.a * (1 + Math.sin(j + i) * 0.3)),
                    }))}
                  >
                    <defs>
                      <linearGradient id={`${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors[i]} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={colors[i]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      dataKey="a"
                      type="monotone"
                      stroke={colors[i]}
                      strokeWidth={1.8}
                      fill={`url(#${uid}-${i})`}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-5 text-[11px] text-muted-foreground">
          Compared with the previous {period.toLowerCase()} · Updated just now
        </p>
      </div>
    );
  }
  if (isTracker) {
    const rows = [
      "api-gateway",
      "payment-worker",
      "email-digest",
      "inventory-sync",
      "analytics-rollup",
    ];
    return (
      <div className="rounded-xl border bg-background p-6">
        {header}
        <div className="my-5 flex items-center justify-between">
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(v) => v && setFilter(v)}
            variant="outline"
            size="sm"
          >
            {["All", "Healthy", "Failed"].map((x) => (
              <ToggleGroupItem value={x} key={x}>
                {x}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button
            size="sm"
            onClick={() => {
              setRun((n) => n + 1);
              toast.success(
                block.id === "chart-38"
                  ? "Release promoted to next environment"
                  : "New deployment queued",
              );
            }}
          >
            <Play /> {block.id === "chart-38" ? "Promote release" : "Run now"}
          </Button>
        </div>
        <div className="divide-y rounded-lg border">
          {rows
            .filter((_, i) => filter === "All" || (filter === "Failed" ? i === 2 : i !== 2))
            .map((name, i) => (
              <div key={name} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                <div className="w-44">
                  <p className="text-xs font-medium">{name}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Every 15 minutes · main</p>
                </div>
                <div className="flex flex-1 items-center gap-[3px]">
                  {Array.from({ length: 40 }, (_, j) => (
                    <button
                      key={j}
                      title={`Run #${2400 + j}: ${(j + i + run) % 13 === 0 ? "Failed" : "Success"} · ${120 + j * 7}ms`}
                      onClick={() => setSelected(j)}
                      className={`h-${block.id === "chart-38" ? "8" : "6"} min-w-1 flex-1 rounded-[3px] ${(j + i + run) % 13 === 0 ? "bg-rose-400" : (j + i) % 9 === 0 ? "bg-amber-300" : "bg-emerald-400"}`}
                      style={{
                        height: block.id === "chart-38" ? 32 : 24,
                        opacity: selected === null || selected === j ? 1 : 0.4,
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <Status value={i === 2 ? "Failed" : "Healthy"} />
                  <span className="text-muted-foreground">{(99.2 + i * 0.15).toFixed(2)}%</span>
                </div>
              </div>
            ))}
        </div>
        {selected !== null && (
          <div className="mt-3 rounded-md bg-muted p-3 text-xs">
            Run #{2400 + selected} · Completed in {120 + selected * 7}ms · Triggered by schedule
          </div>
        )}
        <div className="mt-4 flex justify-between text-[11px] text-muted-foreground">
          <span>Last 40 runs</span>
          <span>Operational status across all services</span>
        </div>
      </div>
    );
  }
  return (
    <Card className="w-full gap-6 shadow-none">
      <CardHeader>{header}</CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-semibold tracking-tight">
                {isGeneration
                  ? "698.3"
                  : isPie
                    ? "$42,680"
                    : isRadial
                      ? "99.97%"
                      : isSlope
                        ? "87.4%"
                        : isSankey
                          ? "$284,500"
                          : total.toLocaleString()}
              </span>
              <Badge variant="secondary">+12.8%</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isGeneration
                ? "GWh generation · 6 sources"
                : isRadial
                  ? "Availability over the last 30 days"
                  : "Compared to the previous period"}
            </p>
          </div>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              {["Week", "Month", "Year"].map((p) => (
                <TabsTrigger key={p} value={p} className="text-xs">
                  {p}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {(block.id === "chart-18" || block.id === "chart-6" || block.id === "chart-24") && (
          <Tabs value={metric} onValueChange={setMetric}>
            <TabsList>
              {["Overview", "Revenue", "Orders"].map((m) => (
                <TabsTrigger value={m} key={m}>
                  {m}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        {isPie ? (
          <div className="grid items-center gap-8 md:grid-cols-2">
            <ChartContainer config={config} className="h-64 w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={[
                    { name: /Browser/.test(block.name) ? "Chrome" : "Subscriptions", value: 480 },
                    { name: /Browser/.test(block.name) ? "Safari" : "One-time", value: 280 },
                    { name: /Browser/.test(block.name) ? "Firefox" : "Enterprise", value: 190 },
                    { name: /Browser/.test(block.name) ? "Edge" : "Other", value: 110 },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={75}
                  outerRadius={105}
                  paddingAngle={3}
                >
                  {colors.slice(0, 4).map((c, i) => (
                    <Cell
                      key={c}
                      fill={c}
                      opacity={selected === null || selected === i ? 1 : 0.3}
                      onClick={() => setSelected(selected === i ? null : i)}
                    />
                  ))}
                  <Label
                    position="center"
                    content={({ viewBox }) =>
                      viewBox && "cx" in viewBox ? (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="currentColor"
                          fontSize="25"
                          fontWeight="600"
                        >
                          1,060
                        </text>
                      ) : (
                        <g />
                      )
                    }
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex flex-col gap-5">
              {[
                /Browser/.test(block.name) ? "Chrome" : "Subscriptions",
                /Browser/.test(block.name) ? "Safari" : "One-time payments",
                /Browser/.test(block.name) ? "Firefox" : "Enterprise",
                "Other",
              ].map((n, i) => (
                <button
                  key={n}
                  onClick={() => setSelected(selected === i ? null : i)}
                  className="flex items-center justify-between gap-8 text-xs"
                >
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: colors[i] }} />
                    {n}
                  </span>
                  <span className="font-medium">{[45.3, 26.4, 17.9, 10.4][i]}%</span>
                </button>
              ))}
            </div>
          </div>
        ) : isRadial ? (
          <div className="grid items-center gap-6 md:grid-cols-2">
            <ChartContainer config={config} className="h-72 w-full">
              <RadialBarChart
                data={[
                  { name: "API", value: 99.97, fill: colors[0] },
                  { name: "Database", value: 95.3, fill: colors[1] },
                  { name: "Worker", value: 87.2, fill: colors[2] },
                ]}
                innerRadius={50}
                outerRadius={130}
                startAngle={90}
                endAngle={450}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <RadialBar dataKey="value" background cornerRadius={8} />
              </RadialBarChart>
            </ChartContainer>
            <div className="flex flex-col gap-5">
              {["API availability", "Database health", "Worker capacity"].map((n, i) => (
                <div key={n} className="flex items-center justify-between border-b pb-4 text-xs">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: colors[i] }} />
                    {n}
                  </span>
                  <div className="text-right">
                    <strong>{[99.97, 95.3, 87.2][i]}%</strong>
                    <p className="mt-1 text-[10px] text-muted-foreground">SLO target: 99.9%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isSankey ? (
          <ChartContainer config={config} className="h-80 w-full">
            <Sankey
              data={{
                nodes: [
                  { name: isSankey && block.id === "chart-49" ? "Organic" : "Product" },
                  { name: "Enterprise" },
                  { name: "Services" },
                  { name: "Revenue" },
                  { name: "Cost of sales" },
                  { name: "Gross profit" },
                  { name: "Operating costs" },
                  { name: "Net income" },
                ],
                links: [
                  { source: 0, target: 3, value: 150 },
                  { source: 1, target: 3, value: 95 },
                  { source: 2, target: 3, value: 40 },
                  { source: 3, target: 4, value: 85 },
                  { source: 3, target: 5, value: 200 },
                  { source: 5, target: 6, value: 70 },
                  { source: 5, target: 7, value: 130 },
                ],
              }}
              nodePadding={35}
              nodeWidth={10}
              margin={{ left: 20, right: 20, top: 15, bottom: 15 }}
              link={{ stroke: colors[color], strokeOpacity: 0.2 }}
              node={{ fill: colors[color] }}
            >
              <Tooltip />
            </Sankey>
          </ChartContainer>
        ) : isSlope ? (
          <ChartContainer config={config} className="h-80 w-full">
            <LineChart
              data={[
                { name: "Baseline", a: 95, b: 83, c: 68, d: 74 },
                { name: "Current", a: 78, b: 91, c: 83, d: 52 },
              ]}
              margin={{ left: 12, right: 12, top: 20, bottom: 5 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis
                domain={[30, 100]}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {["a", "b", "c", "d"].map((k, i) => (
                <Line
                  key={k}
                  dataKey={k}
                  name={["Organic", "Paid search", "Referral", "Direct"][i]}
                  stroke={colors[i]}
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={config} className="h-72 w-full">
            <ComposedChart data={data} margin={{ left: -18, right: 8, top: 15, bottom: 0 }}>
              <defs>
                {[0, 1, 2, 3, 4].map((i) => (
                  <linearGradient key={i} id={`${uid}-area-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors[i]} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={colors[i]} stopOpacity={0.01} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                fontSize={10}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={10} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {isBar ? (
                <>
                  <Bar dataKey="a" fill={colors[color]} radius={[5, 5, 2, 2]} maxBarSize={28} />
                  {compare && (
                    <Bar dataKey="b" fill="var(--muted)" radius={[5, 5, 2, 2]} maxBarSize={28} />
                  )}
                </>
              ) : isLine ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="a"
                    stroke={colors[color]}
                    strokeWidth={2.5}
                    dot={false}
                  />
                  {compare && (
                    <Line
                      type="monotone"
                      dataKey="b"
                      stroke={colors[1]}
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  )}
                </>
              ) : isComposed ? (
                <>
                  <Bar dataKey="a" fill={colors[color]} fillOpacity={0.2} radius={[5, 5, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="c"
                    stroke={colors[color]}
                    strokeWidth={2}
                    dot={false}
                  />
                  <ReferenceLine
                    y={400}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    label={{ value: "Target", position: "insideTopRight", fontSize: 10 }}
                  />
                </>
              ) : isGeneration ? (
                <>
                  {["a", "b", "c"].map((k, i) => (
                    <Area
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stackId="1"
                      stroke={colors[i]}
                      fill={`url(#${uid}-area-${i})`}
                      fillOpacity={0.7}
                    />
                  ))}
                </>
              ) : (
                <>
                  {series.includes("a") && (
                    <Area
                      type="monotone"
                      dataKey="a"
                      stroke={colors[color]}
                      strokeWidth={2}
                      fill={`url(#${uid}-area-${color})`}
                    />
                  )}{" "}
                  {compare && series.includes("b") && (
                    <Area
                      type="monotone"
                      dataKey="b"
                      stroke={colors[1]}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fill={`url(#${uid}-area-1)`}
                    />
                  )}
                </>
              )}
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCompare((v) => !v)}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span className="size-2 rounded-full" style={{ background: colors[color] }} />
            Current period
          </button>
          <button
            onClick={() => setCompare((v) => !v)}
            className={`flex items-center gap-2 text-xs text-muted-foreground ${compare ? "" : "opacity-40"}`}
          >
            <span className="size-2 rounded-full bg-muted-foreground" />
            Previous period
          </button>
        </div>
        <div className="flex items-center gap-2">
          {colors.map((c, i) => (
            <button
              key={c}
              aria-label={`Chart accent ${i + 1}`}
              title={`Accent ${i + 1}`}
              onClick={() => {
                setColor(i);
                setSeries(["a", "b"]);
              }}
              className={`size-3.5 rounded-full ring-offset-background ${color === i ? "ring-1 ring-foreground ring-offset-2" : ""}`}
              style={{ background: c }}
            />
          ))}
          <CircleHelp className="ml-2 size-3.5 text-muted-foreground" />
        </div>
      </CardFooter>
    </Card>
  );
}
