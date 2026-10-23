import { useMemo, useState } from "react";
import { ReferenceDot, ReferenceLine } from "recharts";
import { Landmark, Wallet, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ChartFrame, ChartStage, PeriodButtons, UpdatedDot, ChangePill } from "./chart-chrome";
import { ReuiTrend, type TrendSeries } from "./trend-foundation";
import {
  TrendActions,
  TrendChoice,
  TrendExpanded,
  TrendLayers,
  TrendStats,
  TrendTitle,
  TrendSplitFrame,
} from "./trend-controls";
import {
  dates,
  money,
  usd,
  currencyAxis,
  sum,
  running,
  change,
  trendColors as c,
} from "./trend-data";

const assets = [
  { key: "usdc", label: "USDC", share: 0.411, color: "#39b68d" },
  { key: "usdt", label: "USDT", share: 0.212, color: c.teal },
  { key: "eth", label: "ETH", share: 0.274, color: c.blue },
  { key: "wbtc", label: "WBTC", share: 0.103, color: c.purple },
];
export function LiquidityFlows() {
  const [period, setPeriod] = useState("30D"),
    [enabled, setEnabled] = useState(assets.map((a) => a.key)),
    [revision, setRevision] = useState(0),
    [expanded, setExpanded] = useState(false),
    [layers, setLayers] = useState({ Withdrawn: true, TVL: true, Gridlines: true });
  const all = useMemo(() => {
    // One daily ledger; public 30/91/365-day totals inform segment scales.
    const names = dates(365, "2026-09-30");
    const segments = [
      { days: 274, supplied: 11.18e9, withdrawn: 10.5713e9 },
      { days: 61, supplied: 2.73e9, withdrawn: 2.6209e9 },
      { days: 30, supplied: 1.43e9, withdrawn: 1.3009e9 },
    ];
    let offset = 0;
    return segments.flatMap((segment) => {
      const start = offset;
      offset += segment.days;
      const supplySeed = Array.from(
        { length: segment.days },
        (_, i) => 45 + Math.sin(i * 0.85) * 5 + (i % 30 === 14 ? 34 : 0),
      );
      const withdrawSeed = Array.from(
        { length: segment.days },
        (_, i) => 43 + Math.sin(i * 0.75) * 5 + (i % 30 === 22 ? 32 : 0),
      );
      return supplySeed.map((value, i) => {
        const supplied = (value / sum(supplySeed)) * segment.supplied * (1 + revision * 0.003);
        return {
          name: names[start + i],
          usdc: supplied * 0.411,
          usdt: supplied * 0.212,
          eth: supplied * 0.274,
          wbtc: supplied * 0.103,
          withdrawn: (withdrawSeed[i] / sum(withdrawSeed)) * segment.withdrawn,
        };
      });
    });
  }, [revision]);
  const count = period === "30D" ? 30 : period === "90D" ? 91 : 365;
  const selected = all.slice(-count);
  const selectedShare = sum(assets.filter((a) => enabled.includes(a.key)).map((a) => a.share)),
    totalAllNet = sum(selected.map((r) => r.usdc + r.usdt + r.eth + r.wbtc - r.withdrawn)),
    openingAll = 2.48e9 - totalAllNet;
  const selectedFlows = selected.map((r) => {
    const supplied = sum(
        assets
          .filter((a) => enabled.includes(a.key))
          .map((a) => r[a.key as "usdc" | "usdt" | "eth" | "wbtc"]),
      ),
      withdrawn = -r.withdrawn * selectedShare;
    return { ...r, supplied, withdrawn, net: supplied + withdrawn };
  });
  const cumulative = running(selectedFlows.map((row) => row.net));
  const daily = selectedFlows.map((row, i) => ({
    ...row,
    tvl: openingAll * selectedShare + cumulative[i],
  }));
  const monthlyGroups = new Map<string, typeof daily>();
  for (const row of daily) {
    const month = row.name.split(" ")[0];
    const group = monthlyGroups.get(month) ?? [];
    group.push(row);
    monthlyGroups.set(month, group);
  }
  const groups =
    period === "30D"
      ? daily.map((row) => [row])
      : period === "90D"
        ? Array.from({ length: 13 }, (_, i) => daily.slice(i * 7, i * 7 + 7))
        : Array.from(monthlyGroups.values());
  const rows = groups.map((group) => ({
    name: period === "1Y" ? group[0].name.split(" ")[0] : group[0].name,
    usdc: sum(group.map((row) => row.usdc)),
    usdt: sum(group.map((row) => row.usdt)),
    eth: sum(group.map((row) => row.eth)),
    wbtc: sum(group.map((row) => row.wbtc)),
    supplied: sum(group.map((row) => row.supplied)),
    withdrawn: sum(group.map((row) => row.withdrawn)),
    net: sum(group.map((row) => row.net)),
    tvl: group.at(-1)!.tvl,
  }));
  const exportRows = rows.map((row) =>
    Object.fromEntries([
      ["name", row.name],
      ...assets
        .filter((asset) => enabled.includes(asset.key))
        .map((asset) => [asset.label, row[asset.key as "usdc" | "usdt" | "eth" | "wbtc"]]),
      ["withdrawn", row.withdrawn],
      ["net", row.net],
      ["tvl", row.tvl],
    ]),
  );
  const supplied = sum(daily.map((r) => r.supplied)),
    withdrawn = -sum(daily.map((r) => r.withdrawn)),
    net = supplied - withdrawn,
    last = rows.at(-1)!,
    opening = openingAll * selectedShare,
    peak = Math.max(...daily.map((r) => r.net)),
    peakRow = daily.find((r) => r.net === peak)!;
  const series: TrendSeries[] = [
    ...assets
      .filter((a) => enabled.includes(a.key))
      .map((a) => ({
        key: a.key,
        label: a.label,
        color: a.color,
        kind: "bar" as const,
        stack: "flows",
        width: period === "30D" ? 14 : 28,
      })),
    ...(layers.Withdrawn
      ? [
          {
            key: "withdrawn",
            label: "Withdrawn",
            color: c.pink,
            kind: "bar" as const,
            stack: "flows",
            width: period === "30D" ? 14 : 28,
          },
        ]
      : []),
  ];
  const plot = (large = false) => (
    <div>
      {layers.TVL && (
        <>
          <ReuiTrend
            label="Pool value locked"
            data={rows}
            series={[{ key: "tvl", label: "TVL", color: c.teal, kind: "area", opacity: 0.18 }]}
            format={currencyAxis}
            valueFormat={money}
            height={large ? 150 : 90}
            hideXAxis
            hideYAxis
            grid={false}
          />
        </>
      )}
      <ReuiTrend
        label="Pool supplies and withdrawals"
        data={rows}
        series={series}
        stackOffset="sign"
        format={currencyAxis}
        valueFormat={money}
        height={large ? 340 : 250}
        grid={layers.Gridlines}
      >
        <ReferenceLine yAxisId="left" y={0} stroke="var(--border)" />
      </ReuiTrend>
    </div>
  );
  return (
    <ChartStage>
      <TrendSplitFrame
        width="max-w-[768px]"
        title={<TrendTitle icon={<Landmark />} title="Liquidity Flows" />}
        description="Pool supply and withdrawals"
        toolbar={
          <>
            <PeriodButtons value={period} onChange={setPeriod} options={["30D", "90D", "1Y"]} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs"
                  aria-label={`Assets: ${enabled.length === 4 ? "All assets" : `${enabled.length}/4`}`}
                >
                  {enabled.length === 4 ? "All assets" : `Assets ${enabled.length}/4`}
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Assets in the pool</DropdownMenuLabel>
                <DropdownMenuGroup>
                  {assets.map((asset) => (
                    <DropdownMenuCheckboxItem
                      key={asset.key}
                      checked={enabled.includes(asset.key)}
                      onCheckedChange={() =>
                        setEnabled((s) =>
                          s.includes(asset.key)
                            ? s.filter((key) => key !== asset.key)
                            : [...s, asset.key],
                        )
                      }
                    >
                      {asset.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setEnabled(assets.map((a) => a.key))}>
                    All assets
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <TrendLayers
              layers={layers}
              onChange={(name, value) => setLayers((s) => ({ ...s, [name]: value }))}
            />
            <TrendActions
              title="liquidity-flows"
              rows={exportRows}
              onRefresh={() => {
                setRevision((v) => v + 1);
                toast.success("Pool close synced");
              }}
              onExpand={() => setExpanded(true)}
            />
          </>
        }
        footer={
          <>
            <UpdatedDot>{enabled.length} of 4 assets · USD · Daily close</UpdatedDot>
            <span>Sep 30 · Synced {revision ? "just now" : "2 min ago"}</span>
          </>
        }
        panels={[
          <div key="pool">
            <div className="px-4 pt-5">
              <p className="text-xs text-muted-foreground">Total value locked</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{usd(last.tvl)}</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <ChangePill value={Number(change(last.tvl, opening).toFixed(1))} />
                since {rows[0].name}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {assets
                  .filter((a) => enabled.includes(a.key))
                  .map((a) => (
                    <span key={a.key} className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: a.color }} />
                      {a.label} {(a.share * 100).toFixed(1)}%
                    </span>
                  ))}
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: c.pink }} />
                  Withdrawn
                </span>
                <span>— TVL</span>
              </div>
            </div>
            {plot()}
          </div>,
          <TrendStats
            key="statistics"
            borderless
            items={[
              {
                label: "Supplied",
                value: usd(supplied),
                detail: `${usd(supplied / daily.length)} per day`,
              },
              {
                label: "Withdrawn",
                value: usd(withdrawn),
                detail: `${supplied ? ((withdrawn / supplied) * 100).toFixed(0) : 0}% of supplied`,
              },
              {
                label: "Net flow",
                value: usd(net),
                detail: `Up in ${daily.filter((r) => r.net > 0).length} of ${daily.length} days`,
              },
              { label: "Peak net day", value: peakRow.name, detail: usd(peak) },
            ]}
          />,
        ]}
      />
      <TrendExpanded
        open={expanded}
        onChange={setExpanded}
        title="Liquidity Flows"
        description={`${period} · ${enabled.length} assets selected · Positive supplies and negative withdrawals`}
      >
        {plot(true)}
      </TrendExpanded>
    </ChartStage>
  );
}

const inflows = [538, 558, 578, 689, 588, 609, 617, 636, 644, 665, 672, 693];
const outflows = [578, 613, 558, 619, 558, 564, 647, 576, 669, 575, 572, 653];
const cashMonths = [
  "Oct 2025",
  "Nov",
  "Dec",
  "Jan 2026",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
];
function FlowSources({
  title,
  total,
  groups,
  color,
}: {
  title: string;
  total: number;
  groups: [string, number][];
  color: string;
}) {
  return (
    <div className="min-w-0 px-4 py-4">
      <div className="flex items-center justify-between gap-3 text-xs">
        <strong>{title}</strong>
        <strong>{usd(total)}</strong>
      </div>
      <div className="my-3 flex h-1.5 overflow-hidden rounded-full">
        {groups.map(([label, share], i) => (
          <span
            key={label}
            style={{ width: `${share * 100}%`, background: color, opacity: 1 - i * 0.23 }}
          />
        ))}
      </div>
      <div className="space-y-2">
        {groups.map(([label, share], i) => (
          <div key={label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-1.5 rounded-full"
                style={{ background: color, opacity: 1 - i * 0.23 }}
              />
              {label}
            </span>
            <span>
              {usd(total * share)}{" "}
              <span className="ml-2 text-muted-foreground">{Math.round(share * 100)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
export function CashflowTrend() {
  const [range, setRange] = useState("12 months"),
    [granularity, setGranularity] = useState("Monthly"),
    [view, setView] = useState("Flows"),
    [revision, setRevision] = useState(0),
    [expanded, setExpanded] = useState(false),
    [layers, setLayers] = useState({
      "Cash balance": true,
      "Reserve floor": true,
      "Net flow": true,
      Gridlines: true,
      Breakdown: true,
    });
  const all = inflows.map((v, i) => ({
    name: cashMonths[i],
    inflow: v * 1000 + revision * 2000,
    outflow: -outflows[i] * 1000,
    net: (v - outflows[i]) * 1000 + revision * 2000,
  }));
  const count = range === "3 months" ? 3 : range === "6 months" ? 6 : 12,
    start = 12 - count,
    opening = 1700000 + sum(all.slice(0, start).map((r) => r.net));
  const selected = all.slice(start);
  const buckets =
    granularity === "Monthly"
      ? selected
      : Array.from({ length: count / 3 }, (_, i) => {
          const group = selected.slice(i * 3, i * 3 + 3);
          return {
            name: ["Q4 2025", "Q1 2026", "Q2 2026", "Q3 2026"][start / 3 + i],
            inflow: sum(group.map((r) => r.inflow)),
            outflow: sum(group.map((r) => r.outflow)),
            net: sum(group.map((r) => r.net)),
          };
        });
  const balances = running(buckets.map((row) => row.net)).map((net) => opening + net);
  const rows = buckets.map((r, i) => {
    const prior = i === 0 ? opening : balances[i - 1];
    const balance = balances[i];
    return {
      ...r,
      balance,
      bridge: [Math.min(prior, balance), Math.max(prior, balance)] as [number, number],
    };
  });
  const closing = rows.at(-1)!.balance,
    inflow = sum(rows.map((r) => r.inflow)),
    outflow = -sum(rows.map((r) => r.outflow)),
    net = inflow - outflow,
    burn = outflow / count,
    low = Math.min(...rows.map((r) => r.balance)),
    lowRow = rows.find((r) => r.balance === low)!;
  const bridge = [
    ...rows,
    {
      name: "Close",
      bridge: [Math.min(opening, closing), Math.max(opening, closing)] as [number, number],
      net,
      balance: closing,
    },
  ];
  const plot = (large = false) => (
    <div>
      <ul
        aria-label="Cash flow legend"
        className="flex flex-wrap gap-4 px-4 pt-4 text-xs text-muted-foreground"
      >
        {(view === "Flows"
          ? [
              ["Cash in", c.teal],
              ["Cash out", c.pink],
              ["Net flow", "#45464e"],
              ["Cash balance", c.purple],
            ]
          : [
              ["Increase", c.teal],
              ["Decrease", c.pink],
              ["Net change", c.purple],
              [`Opening ${usd(opening)}`, c.gray],
            ]
        ).map(([label, color]) => (
          <li key={label} className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-xs" style={{ background: color }} />
            {label}
          </li>
        ))}
        {layers["Reserve floor"] && <li>Reserve $1.5M</li>}
      </ul>
      {view === "Flows" && layers["Cash balance"] && (
        <ReuiTrend
          label="Closing cash balance"
          data={rows}
          series={[
            {
              key: "balance",
              label: "Closing balance",
              kind: "area",
              color: c.purple,
              opacity: 0.3,
            },
          ]}
          height={large ? 190 : 120}
          hideXAxis
          format={currencyAxis}
          valueFormat={money}
          grid={layers.Gridlines}
          domain={[Math.min(1400000, low - 100000), Math.max(2200000, closing + 100000)]}
        >
          {layers["Reserve floor"] && (
            <ReferenceLine
              yAxisId="left"
              y={1500000}
              stroke={c.gray}
              strokeDasharray="4 4"
              label={{
                value: "Reserve $1.5M",
                position: "insideTopLeft",
                fontSize: 10,
                fill: c.gray,
              }}
            />
          )}
          <ReferenceDot
            yAxisId="left"
            x={lowRow.name}
            y={low}
            r={3.5}
            fill={c.purple}
            label={{ value: `Low ${usd(low)}`, position: "top", fontSize: 10, fill: c.purple }}
          />
        </ReuiTrend>
      )}
      {view === "Flows" ? (
        <ReuiTrend
          label="Operating cash inflows and outflows"
          data={rows}
          series={[
            {
              key: "inflow",
              label: "Cash in",
              kind: "bar",
              color: c.teal,
              stack: "flow",
              width: granularity === "Monthly" ? 24 : 48,
            },
            {
              key: "outflow",
              label: "Cash out",
              kind: "bar",
              color: c.pink,
              stack: "flow",
              width: granularity === "Monthly" ? 24 : 48,
            },
            ...(layers["Net flow"]
              ? [{ key: "net", label: "Net flow", color: "#45464e", stroke: "none", dots: true }]
              : []),
          ]}
          stackOffset="sign"
          format={currencyAxis}
          valueFormat={money}
          height={large ? 340 : 240}
          grid={layers.Gridlines}
        >
          <ReferenceLine yAxisId="left" y={0} stroke="var(--border)" />
        </ReuiTrend>
      ) : (
        <ReuiTrend
          label="Cash balance waterfall bridge"
          data={bridge}
          series={[
            {
              key: "bridge",
              label: "Balance bridge",
              kind: "bar",
              color: c.purple,
              width: granularity === "Monthly" ? 26 : 48,
              cellColors: bridge.map((r, i) =>
                i === bridge.length - 1 ? c.purple : r.net >= 0 ? c.teal : c.pink,
              ),
            },
            {
              key: "balance",
              label: "Closing balance",
              color: c.gray,
              curve: "stepAfter",
              opacity: 0.4,
            },
          ]}
          format={(value) =>
            Math.abs(value - opening) < 1
              ? usd(opening)
              : `${value > opening ? "+" : "-"}${currencyAxis(Math.abs(value - opening))}`
          }
          valueFormat={money}
          height={large ? 440 : 350}
          grid={layers.Gridlines}
          domain={[
            Math.min(opening - 400000, low - 100000),
            Math.max(opening + 400000, closing + 100000),
          ]}
          tooltipExtra={(row) => (
            <div className="rounded-b-lg border bg-popover px-3 py-2 text-xs">
              Net flow {money(Number(row.net))}
            </div>
          )}
        >
          <ReferenceLine yAxisId="left" y={opening} stroke={c.gray} />
          {layers["Reserve floor"] && (
            <ReferenceLine
              yAxisId="left"
              y={1500000}
              stroke={c.gray}
              strokeDasharray="4 4"
              label={{
                value: "Reserve $1.5M",
                position: "insideTopRight",
                fontSize: 10,
                fill: c.gray,
              }}
            />
          )}
        </ReuiTrend>
      )}
    </div>
  );
  return (
    <ChartStage>
      <ChartFrame
        width="max-w-[1024px]"
        title={<TrendTitle icon={<Wallet />} title="Cash Flow" />}
        description={`${selected[0].name} – ${selected.at(-1)!.name} · Operating cashflow`}
        toolbar={
          <>
            <TrendChoice
              label="Range"
              value={range}
              onChange={setRange}
              options={["3 months", "6 months", "12 months"]}
            />
            <TrendChoice
              label="Granularity"
              value={granularity}
              onChange={setGranularity}
              options={["Monthly", "Quarterly"]}
            />
            <TrendChoice
              label="Chart view"
              value={view}
              onChange={setView}
              options={["Flows", "Waterfall"]}
            />
            <TrendLayers
              layers={layers}
              onChange={(name, value) => setLayers((s) => ({ ...s, [name]: value }))}
            />
            <TrendActions
              title="cashflow-trend"
              rows={rows.map(({ bridge, ...r }) => ({
                ...r,
                bridgeStart: bridge[0],
                bridgeEnd: bridge[1],
              }))}
              onRefresh={() => {
                setRevision((v) => v + 1);
                toast.success("Cash report refreshed");
              }}
              onExpand={() => setExpanded(true)}
            />
          </>
        }
      >
        <div className="[&>dl]:grid-cols-1 sm:[&>dl]:grid-cols-4">
          <TrendStats
            prominent
            items={[
              {
                label: "Closing cash",
                value: usd(closing),
                detail: (
                  <>
                    <ChangePill value={Number(change(closing, opening).toFixed(1))} />
                    from {usd(opening)}
                  </>
                ),
              },
              {
                label: "Net cash flow",
                value: usd(net),
                detail: `${usd(net + 830000)} vs prior −$830K`,
              },
              {
                label: "Gross burn / month",
                value: usd(burn),
                detail: `${(closing / burn).toFixed(1)} months covered`,
              },
              {
                label: "Low point",
                value: usd(low),
                detail: `${lowRow.name} · ${usd(low - 1500000)} above reserve`,
              },
            ]}
          />
        </div>
        {plot()}
        {layers.Breakdown && (
          <div className="grid grid-cols-1 divide-y border-t sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <FlowSources
              title="Cash in"
              total={inflow}
              groups={[
                ["Subscriptions", 0.894],
                ["Services", 0.095],
                ["Interest", 0.011],
              ]}
              color={c.teal}
            />
            <FlowSources
              title="Cash out"
              total={outflow}
              groups={[
                ["Payroll", 0.575],
                ["Overhead and tax", 0.233],
                ["Vendors", 0.192],
              ]}
              color={c.pink}
            />
          </div>
        )}
      </ChartFrame>
      <TrendExpanded
        open={expanded}
        onChange={setExpanded}
        title="Cash Flow"
        description={`${range} · ${granularity} · ${view} · Derived from the same monthly ledger`}
      >
        {plot(true)}
      </TrendExpanded>
    </ChartStage>
  );
}
