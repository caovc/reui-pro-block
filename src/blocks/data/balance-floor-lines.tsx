import { Fragment, useMemo, useState } from "react";
import { ReferenceDot, ReferenceLine } from "recharts";
import { Bell, BellOff, Wallet, Diamond, RefreshCw, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/reui/badge";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldDecrement,
  NumberFieldInput,
  NumberFieldIncrement,
} from "@/components/reui/number-field";
import { toast } from "sonner";
import { ChartStage, PeriodButtons, UpdatedDot, ChangePill, ChartMore } from "./chart-chrome";
import { ReuiTrend, type TrendSeries } from "./trend-foundation";
import {
  TrendActions,
  TrendExpanded,
  TrendLayers,
  TrendStats,
  TrendTitle,
  TrendSplitFrame,
} from "./trend-controls";
import { dates, money, short, usd, sum, change, trendColors as c } from "./trend-data";

export function BalanceTracker() {
  const [period, setPeriod] = useState("3M"),
    [compare, setCompare] = useState(false),
    [color, setColor] = useState(c.purple),
    [revision, setRevision] = useState(0),
    [expanded, setExpanded] = useState(false),
    [layers, setLayers] = useState({
      "High and Low": true,
      "Average Line": false,
      Gridlines: true,
    });
  const data = useMemo(() => {
    const count = period === "1M" ? 22 : period === "3M" ? 66 : period === "YTD" ? 207 : 260;
    const labels = dates(count, "2025-10-16", true);
    const anchors = [
      [0, 23447.11],
      [0.16, 24800],
      [0.45, 26352.07],
      [0.69, 25250],
      [0.86, 23710],
      [1, 24847.83],
    ];
    const all = Array.from({ length: 260 }, (_, i) => {
      if (i < 194) return 22000 + (i / 194) * 1447.11 + Math.sin(i * 0.19) * 420;
      const t = (i - 194) / 65;
      const edge = anchors.findIndex((v) => v[0] >= t);
      const left = anchors[Math.max(0, edge - 1)],
        right = anchors[Math.max(0, edge)];
      const value =
        left[1] +
        (right[1] - left[1]) * (right[0] === left[0] ? 0 : (t - left[0]) / (right[0] - left[0]));
      return i === 194
        ? 23447.11
        : i === 259
          ? 24847.83
          : Math.min(
              26352.07,
              Math.max(23447.11, value + Math.sin(i * 2.34) * 155 * Math.sin(t * Math.PI)),
            );
    });
    const raw = all.slice(-count);
    const offset = 0;
    return raw.map((v, i) => ({
      name: labels[i],
      balance: Number((v - offset + revision * Math.sin(i * 0.7) * 18).toFixed(2)),
      benchmark: Number(((raw[0] - offset) * (1 + (0.0384 * i) / (count - 1))).toFixed(2)),
    }));
  }, [period, revision]);
  const values = data.map((r) => r.balance),
    last = values.at(-1)!,
    first = values[0],
    average = sum(values) / values.length,
    max = Math.max(...values),
    min = Math.min(...values),
    gain = change(last, first);
  let high = values[0],
    drawdown = 0;
  for (const v of values) {
    high = Math.max(high, v);
    drawdown = Math.min(drawdown, (v / high - 1) * 100);
  }
  const best = Math.max(...values.slice(1).map((v, i) => v - values[i]));
  const bestIndex = values.findIndex((v, i) => i > 0 && v - values[i - 1] === best);
  const series: TrendSeries[] = [
    { key: "balance", label: "Market value", color, curve: "linear" },
    ...(compare
      ? [
          {
            key: "benchmark",
            label: "Benchmark",
            color: c.gray,
            dashed: true,
            curve: "linear" as const,
          },
        ]
      : []),
  ];
  const plot = (large = false) => (
    <ReuiTrend
      label="Portfolio balance by trading day"
      data={data}
      series={series}
      format={usd}
      valueFormat={money}
      axisSide="right"
      height={large ? 450 : 300}
      grid={layers.Gridlines}
      domain={[Math.floor(min / 1000) * 1000, Math.ceil(max / 1000) * 1000]}
    >
      {layers["Average Line"] && (
        <ReferenceLine
          yAxisId="left"
          y={average}
          stroke={color}
          strokeDasharray="3 3"
          label={{
            value: `Avg ${usd(average)}`,
            position: "insideTopLeft",
            fontSize: 10,
            fill: color,
          }}
        />
      )}
      {layers["High and Low"] &&
        [max, min].map((v, i) => (
          <ReferenceDot
            key={v}
            yAxisId="left"
            x={data[values.indexOf(v)].name}
            y={v}
            r={3.5}
            fill="var(--background)"
            stroke={color}
            label={{
              value: `${i ? "Low" : "High"} ${money(v)}`,
              position:
                values.indexOf(v) < data.length * 0.15
                  ? "right"
                  : values.indexOf(v) > data.length * 0.85
                    ? "left"
                    : i
                      ? "top"
                      : "bottom",
              offset: 8,
              fontSize: 10,
              fill: color,
            }}
          />
        ))}
    </ReuiTrend>
  );
  return (
    <ChartStage>
      <TrendSplitFrame
        title={<TrendTitle icon={<Wallet />} title="Portfolio Balance" />}
        description="Individual brokerage account"
        toolbar={
          <>
            <PeriodButtons
              options={["1M", "3M", "YTD", "1Y"]}
              value={period}
              onChange={setPeriod}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              aria-pressed={compare}
              onClick={() => setCompare((v) => !v)}
            >
              Compare
            </Button>
            <TrendLayers
              layers={layers}
              onChange={(name, v) => setLayers((s) => ({ ...s, [name]: v }))}
            />
            <TrendActions
              title="portfolio-balance"
              rows={data}
              color={color}
              onColor={setColor}
              onRefresh={() => {
                setRevision((v) => v + 1);
                toast.success("Balance synced");
              }}
              onExpand={() => setExpanded(true)}
            />
          </>
        }
        footer={
          <>
            <UpdatedDot>Daily close · USD</UpdatedDot>
            <span>As of Oct 16 · Synced {revision ? "just now" : "2 min ago"}</span>
          </>
        }
        panels={[
          <Fragment key="plot">
            <div className="px-4 pb-2 pt-5">
              <p className="text-xs text-muted-foreground">Market value</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{money(last)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <ChangePill value={Number(gain.toFixed(2))} />
                <span>
                  {money(last - first)} past {period === "3M" ? "3 months" : period}
                </span>
              </div>
            </div>
            {plot()}
          </Fragment>,
          <TrendStats
            key="stats"
            borderless
            items={[
              {
                label: "Max drawdown",
                value: `${drawdown.toFixed(2)}%`,
                detail: "Peak to subsequent trough",
              },
              {
                label: "Vs benchmark",
                value: `${gain - 3.84 >= 0 ? "+" : ""}${(gain - 3.84).toFixed(2)} pts`,
                detail: "Benchmark +3.84%",
              },
              {
                label: "Average balance",
                value: money(average),
                detail: `${data.length} trading days`,
              },
              { label: "Best day", value: money(best), detail: data[bestIndex]?.name ?? "—" },
            ]}
          />,
        ]}
      />
      <TrendExpanded
        open={expanded}
        onChange={setExpanded}
        title="Portfolio Balance"
        description="Daily close, USD · Benchmark rebased to the opening value"
      >
        {plot(true)}
      </TrendExpanded>
    </ChartStage>
  );
}

export function FloorMonitor() {
  const [period, setPeriod] = useState("90D"),
    [threshold, setThreshold] = useState(2.3),
    [draft, setDraft] = useState(2.3),
    [armed, setArmed] = useState(true),
    [draftArmed, setDraftArmed] = useState(true),
    [dialog, setDialog] = useState(false),
    [layers, setLayers] = useState({ "Top bid": true, "Bid/ask spread": true, Gridlines: true }),
    [revision, setRevision] = useState(0);
  const data = useMemo(() => {
    const count = period === "7D" ? 7 : period === "30D" ? 30 : period === "90D" ? 90 : 365;
    const labels = dates(count);
    const anchors = [
      [0, 2.5],
      [0.22, 2.65],
      [0.47, 2.4],
      [0.62, 2.16],
      [0.82, 2.3],
      [1, 2.418],
    ];
    const all = Array.from({ length: 365 }, (_, i) => {
      if (i < 275) return 2.18 + (i / 275) * 0.32 + Math.sin(i * 0.11) * 0.1;
      const t = (i - 275) / 89;
      const edge = anchors.findIndex((v) => v[0] >= t);
      const left = anchors[Math.max(0, edge - 1)],
        right = anchors[Math.max(0, edge)];
      const value =
        left[1] +
        (right[1] - left[1]) * (right[0] === left[0] ? 0 : (t - left[0]) / (right[0] - left[0]));
      return i === 275
        ? 2.5
        : i === 364
          ? 2.418
          : Math.min(2.65, Math.max(2.16, value + Math.sin(i * 1.7) * 0.026));
    });
    const raw = all.slice(-count);
    const correction = 0;
    return raw.map((value, i) => {
      const floor = Number((value + correction + revision * Math.sin(i) * 0.004).toFixed(3)),
        bid = Number(
          (i === count - 1
            ? floor - 0.063
            : floor * (1 - (0.037 + (0.03 * (Math.sin(i * 0.2) + 1)) / 2))
          ).toFixed(3),
        );
      return {
        name: labels[i],
        floor,
        bid,
        spread: [bid, floor] as [number, number],
        breach: armed && floor < threshold ? floor : null,
        volume: Number((62 + Math.abs(Math.sin(i * 0.7)) * 25).toFixed(1)),
        sales: 23 + (i % 11),
      };
    });
  }, [period, revision, threshold, armed]);
  const last = data.at(-1)!,
    high = Math.max(...data.map((r) => r.floor)),
    avgSpread = sum(data.map((r) => (r.floor / r.bid - 1) * 100)) / data.length,
    volume = sum(data.map((r) => r.volume)),
    sales = sum(data.map((r) => r.sales));
  const gain = change(last.floor, data[0].floor);
  const series: TrendSeries[] = [
    ...(layers["Bid/ask spread"]
      ? [
          {
            key: "spread",
            label: "Bid–ask spread",
            kind: "area" as const,
            color: c.blue,
            stroke: "none",
            opacity: 0.35,
          },
        ]
      : []),
    { key: "floor", label: "Floor", color: c.blue, curve: "linear" },
    ...(layers["Top bid"]
      ? [{ key: "bid", label: "Top bid", color: c.gray, dashed: true, curve: "linear" as const }]
      : []),
    { key: "breach", label: "Below alert", color: c.pink, curve: "linear" },
  ];
  return (
    <ChartStage>
      <TrendSplitFrame
        title={
          <>
            <TrendTitle icon={<Diamond />} title="Floor Price" />
            {armed && (
              <Badge variant="warning-light" className="text-xs">
                Alert {threshold.toFixed(2)} ETH
              </Badge>
            )}
          </>
        }
        description="Lumen Keys · 8,888 items"
        toolbar={
          <>
            <PeriodButtons
              options={["7D", "30D", "90D", "1Y"]}
              value={period}
              onChange={setPeriod}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              aria-label={armed ? "Floor alert armed" : "Floor alert disabled"}
              onClick={() => {
                setDraft(threshold);
                setDraftArmed(armed);
                setDialog(true);
              }}
            >
              {armed ? <Bell /> : <BellOff />} Alert
            </Button>
            <ChartMore
              title="floor-price"
              rows={data.map(({ spread, ...r }) => ({ ...r, spreadETH: spread[1] - spread[0] }))}
            >
              <DropdownMenuItem
                onSelect={() => {
                  setRevision((v) => v + 1);
                  toast.success("Marketplace quotes synced");
                }}
              >
                <RefreshCw />
                Refresh quotes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Chart layers</DropdownMenuLabel>
              {Object.entries(layers).map(([name, checked]) => (
                <DropdownMenuCheckboxItem
                  key={name}
                  checked={checked}
                  onCheckedChange={(v) => setLayers((s) => ({ ...s, [name]: !!v }))}
                >
                  {name}
                </DropdownMenuCheckboxItem>
              ))}
            </ChartMore>
          </>
        }
        footer={
          <>
            <UpdatedDot>6 marketplaces · As of Oct 16</UpdatedDot>
            <span>ETH $3,248.40 · Local demo quotes</span>
          </>
        }
        panels={[
          <Fragment key="plot">
            <div className="flex flex-wrap justify-between gap-3 px-4 pb-2 pt-5">
              <div>
                <p className="text-xs text-muted-foreground">Lowest ask</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {last.floor.toFixed(3)}{" "}
                  <span className="text-base font-normal text-muted-foreground">ETH</span>
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <ChangePill value={Number(gain.toFixed(2))} />
                  {(last.floor - data[0].floor).toFixed(3)} ETH past {period.toLowerCase()}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {money(last.floor * 3248.4)} USD
                </p>
              </div>
              <div className="self-end text-right text-xs">
                <p className="text-muted-foreground">Top bid</p>
                <p className="mt-1 font-medium">{last.bid.toFixed(3)} ETH</p>
                <p className="mt-1 text-muted-foreground">
                  {((last.floor / last.bid - 1) * 100).toFixed(2)}% spread
                </p>
              </div>
            </div>
            <ul
              aria-label="Legend"
              className="flex flex-wrap gap-4 px-4 pt-2 text-xs text-muted-foreground"
            >
              {[
                ["Floor", c.blue],
                ["Top Bid", c.gray],
                ["Spread", c.blue],
                ["Below Alert", c.pink],
              ].map(([label, color]) => (
                <li key={label} className="flex items-center gap-1.5">
                  <span
                    className="h-0.5 w-3"
                    style={{ background: color, opacity: label === "Spread" ? 0.25 : 1 }}
                  />
                  {label}
                </li>
              ))}
            </ul>
            <ReuiTrend
              label="Floor and top bid by day"
              data={data}
              series={series}
              format={(v) => v.toFixed(2)}
              valueFormat={(v) => `${v.toFixed(3)} ETH`}
              axisSide="right"
              height={300}
              grid={layers.Gridlines}
              domain={[
                Math.floor(Math.min(...data.map((r) => r.bid)) * 4) / 4,
                Math.ceil(Math.max(high, armed ? threshold : 0) * 4) / 4,
              ]}
            >
              {armed && (
                <ReferenceLine
                  yAxisId="left"
                  y={threshold}
                  stroke={c.pink}
                  strokeDasharray="4 4"
                  label={{
                    value: `Alert ${threshold.toFixed(2)}`,
                    position: "insideTopLeft",
                    fontSize: 10,
                    fill: c.pink,
                  }}
                />
              )}
            </ReuiTrend>
          </Fragment>,
          <TrendStats
            key="stats"
            borderless
            items={[
              { label: "Volume", value: `${short(volume)} ETH`, detail: usd(volume * 3248.4) },
              {
                label: "Sales",
                value: sales.toLocaleString(),
                detail: `Avg ${(volume / sales).toFixed(3)} ETH`,
              },
              {
                label: "Avg spread",
                value: `${avgSpread.toFixed(2)}%`,
                detail: "Across daily close quotes",
              },
              {
                label: "Off the high",
                value: `${change(last.floor, high).toFixed(2)}%`,
                detail: `High ${high.toFixed(3)} ETH`,
              },
            ]}
          />,
        ]}
      />
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Floor price alert</DialogTitle>
            <DialogDescription>
              Mark quotes below this ETH threshold. This demo stores the alert in the current view.
            </DialogDescription>
          </DialogHeader>
          <NumberField
            value={draft}
            onValueChange={(v) => v !== null && setDraft(v)}
            min={0.1}
            max={10}
            step={0.01}
          >
            <Label>Alert below (ETH)</Label>
            <NumberFieldGroup>
              <NumberFieldDecrement aria-label="Lower alert threshold" />
              <NumberFieldInput aria-label="Alert threshold in ETH" />
              <NumberFieldIncrement aria-label="Raise alert threshold" />
            </NumberFieldGroup>
          </NumberField>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="floor-alert-enabled">Alert enabled</Label>
            <Switch id="floor-alert-enabled" checked={draftArmed} onCheckedChange={setDraftArmed} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setThreshold(draft);
                setArmed(draftArmed);
                setDialog(false);
                toast.success("Floor alert saved");
              }}
            >
              <ArrowDownToLine />
              Save alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChartStage>
  );
}
