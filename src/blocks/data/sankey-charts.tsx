import { useId, useState } from "react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Pause, Play, RotateCcw } from "lucide-react";
import { ChartFrame, ChartMore, ChartStage, ChangePill, PeriodButtons } from "./chart-chrome";
type FlowNode = {
  id: string;
  label: string;
  value: number;
  x: number;
  y: number;
  color: string;
  side?: "left" | "right";
};
type FlowLink = {
  from: string;
  to: string;
  value: number;
  kind: "revenue" | "cost" | "profit" | "journey" | "drop";
};
const green = "#3ab18a",
  red = "#d8342d",
  ink = "var(--foreground)";
function flowPaths(nodes: FlowNode[], links: FlowLink[], unit: number) {
  const fromOffset: Record<string, number> = {},
    toOffset: Record<string, number> = {};
  return links.map((link) => {
    const a = nodes.find((n) => n.id === link.from)!,
      b = nodes.find((n) => n.id === link.to)!;
    const sy = a.y + (fromOffset[a.id] ?? 0),
      ty = b.y + (toOffset[b.id] ?? 0),
      h = link.value * unit;
    fromOffset[a.id] = (fromOffset[a.id] ?? 0) + h;
    toOffset[b.id] = (toOffset[b.id] ?? 0) + h;
    const sx = a.x + 9,
      tx = b.x,
      mx = (sx + tx) / 2;
    return {
      ...link,
      d: `M${sx} ${sy} C${mx} ${sy},${mx} ${ty},${tx} ${ty} L${tx} ${ty + h} C${mx} ${ty + h},${mx} ${sy + h},${sx} ${sy + h} Z`,
      center: `M${sx} ${sy + h / 2} C${mx} ${sy + h / 2},${mx} ${ty + h / 2},${tx} ${ty + h / 2}`,
      source: a,
      target: b,
      sx,
      sy,
      tx,
      ty,
      h,
    };
  });
}
function FlowDiagram({
  nodes,
  links,
  unit,
  selected,
  onSelect,
  mode = "All",
  values = true,
  percent = false,
  pulse = false,
  paused = false,
  revision = 0,
  format = (v: number) => `$${v}M`,
}: {
  nodes: FlowNode[];
  links: FlowLink[];
  unit: number;
  selected: string | null;
  onSelect: (v: string | null) => void;
  mode?: string;
  values?: boolean;
  percent?: boolean;
  pulse?: boolean;
  paused?: boolean;
  revision?: number;
  format?: (v: number) => string;
}) {
  const id = useId().replaceAll(":", "");
  const [hover, setHover] = useState<string | null>(null);
  const focused = hover ?? selected;
  const paths = flowPaths(nodes, links, unit);
  const upstream = new Set<string>(),
    downstream = new Set<string>();
  function visit(node: string, back: boolean, seen: Set<string>) {
    if (seen.has(node)) return;
    seen.add(node);
    links
      .filter((l) => (back ? l.to === node : l.from === node))
      .forEach((l) => visit(back ? l.from : l.to, back, seen));
  }
  if (focused) {
    visit(focused, true, upstream);
    visit(focused, false, downstream);
  }
  const visible = (l: FlowLink) =>
    focused
      ? (upstream.has(l.from) && upstream.has(l.to)) ||
        (downstream.has(l.from) && downstream.has(l.to))
      : mode === "All" ||
        (mode === "Revenue"
          ? l.kind === "revenue"
          : mode === "Costs"
            ? l.kind === "cost"
            : l.kind === "profit");
  return (
    <svg
      viewBox="0 0 1024 445"
      className="block min-w-[680px] w-full"
      role="img"
      aria-label="Flow diagram. Select a node to trace its incoming and outgoing paths."
    >
      <defs>
        {paths.map((p, i) => (
          <linearGradient key={i} id={`${id}-flow-${i}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={p.source.color} stopOpacity={pulse ? 0.13 : 0.28} />
            <stop offset="100%" stopColor={p.target.color} stopOpacity={pulse ? 0.13 : 0.3} />
          </linearGradient>
        ))}
      </defs>
      {paths.map((p, i) => (
        <g
          key={`${p.from}-${p.to}`}
          opacity={visible(p) ? 1 : 0.08}
          onPointerEnter={() => setHover(p.from)}
          onPointerLeave={() => setHover(null)}
        >
          <path d={p.d} fill={`url(#${id}-flow-${i})`} />
          {pulse &&
            Array.from({ length: Math.max(1, Math.ceil(p.value / 1700)) }, (_, j) => (
              <circle
                key={`${revision}-${j}`}
                cx={paused ? (p.sx + p.tx) / 2 : undefined}
                cy={paused ? (p.sy + p.ty + p.h) / 2 : undefined}
                r="1.6"
                fill={
                  p.kind === "drop" ? red : p.kind === "profit" ? green : "var(--muted-foreground)"
                }
                opacity={0.5}
              >
                {!paused && (
                  <animateMotion
                    path={p.center}
                    dur={`${5 + i * 0.2}s`}
                    begin={`${-j * 0.9}s`}
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            ))}
        </g>
      ))}
      {nodes.map((n) => (
        <g
          key={n.id}
          role="button"
          tabIndex={0}
          aria-label={`${n.label}, ${format(n.value)}`}
          onClick={() => onSelect(selected === n.id ? null : n.id)}
          onPointerEnter={() => setHover(n.id)}
          onPointerLeave={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(selected === n.id ? null : n.id);
            }
          }}
          style={{ cursor: "pointer" }}
          opacity={focused && !upstream.has(n.id) && !downstream.has(n.id) ? 0.25 : 1}
        >
          <rect
            x={n.x}
            y={n.y}
            width={pulse ? 4 : 9}
            height={Math.max(3, n.value * unit)}
            rx="1.5"
            fill={n.color}
          />
          {n.label && (
            <text
              x={n.side === "left" ? n.x - 8 : n.x + 17}
              y={n.y + (n.value * unit) / 2 - 4}
              textAnchor={n.side === "left" ? "end" : "start"}
              fill="currentColor"
              fontSize="12"
              paintOrder="stroke"
              stroke="var(--background)"
              strokeWidth="2.8"
            >
              <tspan>{n.label}</tspan>
              {values && (
                <tspan x={n.side === "left" ? n.x - 8 : n.x + 17} dy="15">
                  {format(n.value)}
                  {percent && (
                    <tspan fill="var(--muted-foreground)">
                      {" "}
                      {Math.round((n.value / nodes.find((n) => n.id === "revenue")!.value) * 100)}%
                    </tspan>
                  )}
                </tspan>
              )}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
const revenueNodes: FlowNode[] = [
  {
    id: "subscriptions",
    label: "Subscriptions",
    value: 446,
    x: 128,
    y: 40,
    color: ink,
    side: "left",
  },
  { id: "usage", label: "Usage", value: 151, x: 128, y: 278, color: ink, side: "left" },
  { id: "services", label: "Services", value: 52, x: 128, y: 380, color: ink, side: "left" },
  { id: "revenue", label: "Revenue", value: 649, x: 308, y: 65, color: ink },
  { id: "gross", label: "Gross Profit", value: 474, x: 488, y: 70, color: green },
  { id: "cogs", label: "Cost of Revenue", value: 175, x: 488, y: 322, color: red },
  { id: "operating", label: "Operating Income", value: 142, x: 668, y: 152, color: green },
  { id: "opex", label: "Operating Expenses", value: 332, x: 668, y: 250, color: red },
  { id: "net", label: "Net Income", value: 111, x: 848, y: 70, color: green },
  { id: "tax", label: "Income Tax", value: 31, x: 848, y: 152, color: red },
  { id: "rd", label: "R&D", value: 133, x: 848, y: 216, color: red },
  { id: "sales", label: "Sales & Marketing", value: 149, x: 848, y: 310, color: red },
  { id: "ga", label: "G&A", value: 50, x: 848, y: 402, color: red },
];
const revenueLinks: FlowLink[] = [
  { from: "subscriptions", to: "revenue", value: 446, kind: "revenue" },
  { from: "usage", to: "revenue", value: 151, kind: "revenue" },
  { from: "services", to: "revenue", value: 52, kind: "revenue" },
  { from: "revenue", to: "gross", value: 474, kind: "profit" },
  { from: "revenue", to: "cogs", value: 175, kind: "cost" },
  { from: "gross", to: "operating", value: 142, kind: "profit" },
  { from: "gross", to: "opex", value: 332, kind: "cost" },
  { from: "operating", to: "net", value: 111, kind: "profit" },
  { from: "operating", to: "tax", value: 31, kind: "cost" },
  { from: "opex", to: "rd", value: 133, kind: "cost" },
  { from: "opex", to: "sales", value: 149, kind: "cost" },
  { from: "opex", to: "ga", value: 50, kind: "cost" },
];
function RevenueFlow() {
  const [quarter, setQuarter] = useState("Q3 FY2026");
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState("All");
  const [values, setValues] = useState(true);
  const [percent, setPercent] = useState(true);
  const factor =
    quarter === "Q2 FY2026"
      ? 0.918
      : quarter === "Q1 FY2026"
        ? 0.84
        : quarter === "Q4 FY2026"
          ? 1.08
          : 1;
  const nodes = revenueNodes.map((n) => ({ ...n, value: Math.round(n.value * factor) }));
  const links = revenueLinks.map((l) => ({ ...l, value: Math.round(l.value * factor) }));
  return (
    <ChartStage>
      <ChartFrame
        title={
          <>
            Revenue Flow
            <Badge variant="outline" className="px-1 text-[11px] font-normal">
              {quarter.replace("2026", "26")}
            </Badge>
          </>
        }
        description="Where each dollar of Fieldline revenue goes"
        width="max-w-[1024px]"
        toolbar={
          <>
            <Select value={quarter} onValueChange={setQuarter}>
              <SelectTrigger className="h-7 w-32 text-[13px]" aria-label="Quarter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {["Q1 FY2026", "Q2 FY2026", "Q3 FY2026", "Q4 FY2026"].map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <ChartMore
              title="Revenue flow"
              rows={links.map((l) => ({ from: l.from, to: l.to, amountM: l.value }))}
            >
              <DropdownMenuCheckboxItem checked={values} onCheckedChange={setValues}>
                Show amounts
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={percent} onCheckedChange={setPercent}>
                Show revenue share
              </DropdownMenuCheckboxItem>
            </ChartMore>
          </>
        }
        footer={
          <>
            <span>USD millions · Demo figures, unaudited</span>
            <span>Updated Oct 9, 2026</span>
          </>
        }
      >
        <dl className="grid grid-cols-2 divide-x border-b py-4 md:grid-cols-4">
          {[
            ["Revenue", `$${Math.round(649 * factor)}M`, 8.9, "%"],
            ["Gross Margin", "73.0%", -0.5, " pts"],
            ["Operating Margin", "21.9%", -0.9, " pts"],
            ["Net Income", `$${Math.round(111 * factor)}M`, 3.7, "%"],
          ].map(([k, v, c, u]) => (
            <div key={String(k)} className="px-4">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-1 text-xl font-semibold">{v}</dd>
              <dd className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <ChangePill value={Number(c)} unit={String(u)} />
                vs Q2 FY26
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4">
          <PeriodButtons
            label="Highlight flows"
            value={mode}
            onChange={(v) => {
              setMode(v);
              setSelected(null);
            }}
            options={["All", "Revenue", "Costs", "Profit"]}
          />
          <span className="text-xs text-muted-foreground">
            {selected ? "Click the node again to clear" : "Click a node to trace its flow"}
          </span>
        </div>
        <div className="overflow-auto pb-4">
          <FlowDiagram
            nodes={nodes}
            links={links}
            unit={0.47 / factor}
            selected={selected}
            onSelect={setSelected}
            mode={mode}
            values={values}
            percent={percent}
          />
        </div>
      </ChartFrame>
    </ChartStage>
  );
}
const trialNodes: FlowNode[] = [
  { id: "docs", label: "Docs", value: 8420, x: 125, y: 45, color: ink, side: "left" },
  { id: "referrals", label: "Referrals", value: 5960, x: 125, y: 205, color: ink, side: "left" },
  { id: "newsletter", label: "Newsletter", value: 3870, x: 125, y: 325, color: ink, side: "left" },
  {
    id: "marketplace",
    label: "Marketplace",
    value: 2150,
    x: 125,
    y: 410,
    color: ink,
    side: "left",
  },
  { id: "signup", label: "", value: 20400, x: 315, y: 45, color: ink },
  { id: "onboarded", label: "", value: 13260, x: 505, y: 45, color: ink },
  { id: "skipped", label: "Skipped Setup", value: 7140, x: 505, y: 285, color: red },
  { id: "invited", label: "", value: 7830, x: 695, y: 45, color: ink },
  { id: "solo", label: "Went Solo", value: 5430, x: 695, y: 205, color: red },
  { id: "upgraded", label: "Upgraded", value: 2940, x: 885, y: 45, color: green },
  { id: "notupgraded", label: "Didn't Upgrade", value: 4890, x: 885, y: 130, color: red },
];
const trialLinks: FlowLink[] = [
  { from: "docs", to: "signup", value: 8420, kind: "journey" },
  { from: "referrals", to: "signup", value: 5960, kind: "journey" },
  { from: "newsletter", to: "signup", value: 3870, kind: "journey" },
  { from: "marketplace", to: "signup", value: 2150, kind: "journey" },
  { from: "signup", to: "onboarded", value: 13260, kind: "journey" },
  { from: "signup", to: "skipped", value: 7140, kind: "drop" },
  { from: "onboarded", to: "invited", value: 7830, kind: "journey" },
  { from: "onboarded", to: "solo", value: 5430, kind: "drop" },
  { from: "invited", to: "upgraded", value: 2940, kind: "profit" },
  { from: "invited", to: "notupgraded", value: 4890, kind: "drop" },
];
function TrialJourney() {
  const [period, setPeriod] = useState("30D");
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const factor = period === "7D" ? 0.24 : period === "90D" ? 2.85 : 1;
  const nodes = trialNodes.map((n) => ({ ...n, value: Math.round(n.value * factor) })),
    links = trialLinks.map((l) => ({ ...l, value: Math.round(l.value * factor) }));
  return (
    <ChartStage>
      <ChartFrame
        title={
          <>
            Trial Journey
            <Badge variant="outline" className="px-1 text-[11px] font-normal">
              {Math.round(20400 * factor).toLocaleString()} trials
            </Badge>
          </>
        }
        description="Where new trials convert or drop off"
        width="max-w-[1024px]"
        toolbar={
          <>
            <PeriodButtons
              label="Date range"
              value={period}
              onChange={setPeriod}
              options={["7D", "30D", "90D"]}
            />
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              aria-label="Replay animation"
              onClick={() => {
                setRevision((v) => v + 1);
                setPaused(false);
              }}
            >
              <RotateCcw />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              aria-label={paused ? "Resume flow" : "Pause flow"}
              aria-pressed={paused}
              onClick={() => setPaused((v) => !v)}
            >
              {paused ? <Play /> : <Pause />}
            </Button>
          </>
        }
        footer={
          <>
            <span className="flex gap-4">
              <span>● In Journey</span>
              <span style={{ color: green }}>● Upgraded</span>
              <span style={{ color: red }}>● Dropped Off</span>
            </span>
            <span>Pulse density follows trial volume</span>
          </>
        }
      >
        <div className="grid grid-cols-5 gap-2 px-5 pb-1 pt-5">
          {[
            ["Channels", "4 sources"],
            ["Signed Up", Math.round(20400 * factor).toLocaleString()],
            ["Onboarded", `${Math.round(13260 * factor).toLocaleString()} 65.0%`],
            ["Team Invited", `${Math.round(7830 * factor).toLocaleString()} 59.0%`],
            ["Converted", "14.4%"],
          ].map(([k, v]) => (
            <div key={k} className="text-center">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p
                className="mt-1 text-xs font-medium"
                style={k === "Converted" ? { color: green } : undefined}
              >
                {v}
              </p>
            </div>
          ))}
        </div>
        <div className="overflow-auto pb-5">
          <FlowDiagram
            nodes={nodes}
            links={links}
            unit={0.013 / factor}
            selected={selected}
            onSelect={setSelected}
            pulse
            paused={paused}
            revision={revision}
            format={(v) => v.toLocaleString()}
          />
        </div>
      </ChartFrame>
    </ChartStage>
  );
}
function PipelineLeakage() {
  const [period, setPeriod] = useState("90D");
  const [focus, setFocus] = useState("");
  const [values, setValues] = useState(true);
  const [particles, setParticles] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const factors = period === "30D" ? 0.34 : period === "12M" ? 4.1 : 1;
  const stageNames = ["Leads", "MQL", "SQL", "Demo", "Proposal", "Won"];
  const totals = [3620, 1824, 1095, 751, 439, 176];
  const shades = ["#80dcb5", "#39b58b", "#20785d"];
  const counts = [
    [1640, 1430, 550],
    [870, 672, 282],
    [550, 363, 182],
    [370, 245, 136],
    [213, 145, 81],
    [85, 49, 42],
  ];
  const center = 195;
  const outerHeight = 215;
  const stageX = [20, 170, 320, 470, 620, 770];
  const share = (stage: number, source: number) => (counts[stage][source] / 3620) * outerHeight;
  const boundary = (stage: number, source: number) =>
    center -
    ((totals[stage] / 3620) * outerHeight) / 2 +
    (counts[stage].slice(0, source).reduce((s, n) => s + n, 0) / 3620) * outerHeight;
  return (
    <ChartStage>
      <ChartFrame
        title="Pipeline Leakage"
        description="Deals lost at each stage, by source"
        width="max-w-[768px]"
        plain
        toolbar={
          <>
            <PeriodButtons
              label="Date range"
              value={period}
              onChange={setPeriod}
              options={["30D", "90D", "12M"]}
            />
            <ChartMore
              title="Pipeline leakage"
              rows={stageNames.map((stage, i) => ({
                stage,
                deals: Math.round(totals[i] * factors),
              }))}
            >
              <DropdownMenuCheckboxItem checked={values} onCheckedChange={setValues}>
                Stage totals
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={particles} onCheckedChange={setParticles}>
                Lost deal particles
              </DropdownMenuCheckboxItem>
            </ChartMore>
          </>
        }
        footer={
          <>
            <ToggleGroup
              type="single"
              value={focus}
              onValueChange={setFocus}
              aria-label="Focus a lead source"
              size="sm"
              className="gap-3"
            >
              {["Inbound", "Outbound", "Partner"].map((s, i) => (
                <ToggleGroupItem key={s} value={s} className="h-7 gap-1.5 px-0 text-xs font-normal">
                  <span className="size-1.5 rounded-full" style={{ background: shades[i] }} />
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <span>
              <span style={{ color: red }}>●</span> Lost deals · Through Oct 12, 2026
            </span>
          </>
        }
      >
        <dl className="grid grid-cols-2 divide-x border-y py-4 md:grid-cols-4">
          {[
            [
              "Lead to Won",
              "4.9%",
              <span key="lead-change" className="flex items-center gap-1">
                <ChangePill value={0.6} unit=" pts" />
                <span>vs prior {period}</span>
              </span>,
            ],
            [
              "Leads",
              Math.round(3620 * factors).toLocaleString(),
              <ChangePill key="leads-change" value={1.7} />,
            ],
            [
              "Deals Won",
              Math.round(176 * factors).toLocaleString(),
              <ChangePill key="won-change" value={17} />,
            ],
            ["Biggest Leak", "60%", "Proposal to Won"],
          ].map(([k, v, d]) => (
            <div key={String(k)} className="px-4">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd
                className="mt-2 text-2xl font-semibold"
                style={k === "Biggest Leak" ? { color: red } : undefined}
              >
                {v}
              </dd>
              <dd className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                {d}
              </dd>
            </div>
          ))}
        </dl>
        <div className="overflow-auto border-b p-1">
          <svg
            viewBox="0 0 800 350"
            className="min-w-[570px] w-full"
            role="img"
            aria-label="Deals lost at each stage by source"
          >
            {stageNames.map((s, i) => (
              <g key={s}>
                <text
                  x={45 + i * 141}
                  y="29"
                  fill="var(--muted-foreground)"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {s}
                </text>
                {values && (
                  <text
                    x={45 + i * 141}
                    y="51"
                    fill="currentColor"
                    fontSize="14"
                    textAnchor="middle"
                  >
                    {i === 5 ? "4.9%" : `${Math.round((totals[i] / 3620) * 100)}%`}
                  </text>
                )}
              </g>
            ))}
            {[0, 1, 2].map((source) => (
              <g
                key={source}
                opacity={!focus || focus === ["Inbound", "Outbound", "Partner"][source] ? 1 : 0.15}
              >
                {stageNames.slice(0, -1).map((_, i) => {
                  const x1 = stageX[i],
                    x2 = stageX[i + 1],
                    y1 = boundary(i, source),
                    y2 = boundary(i + 1, source),
                    h1 = share(i, source),
                    h2 = share(i + 1, source),
                    mx = (x1 + x2) / 2;
                  return (
                    <path
                      key={i}
                      d={`M${x1} ${y1} C${mx} ${y1},${mx} ${y2},${x2} ${y2} L${x2} ${y2 + h2} C${mx} ${y2 + h2},${mx} ${y1 + h1},${x1} ${y1 + h1} Z`}
                      fill={shades[source]}
                    />
                  );
                })}
              </g>
            ))}
            {stageX.slice(1).map((x, i) => (
              <g
                key={x}
                onPointerEnter={() => setSelected(i)}
                onPointerLeave={() => setSelected(null)}
              >
                <line
                  x1={x}
                  x2={x}
                  y1={center - ((totals[i + 1] / 3620) * outerHeight) / 2 - 2}
                  y2={center + ((totals[i + 1] / 3620) * outerHeight) / 2 + 2}
                  stroke={i === 4 ? "#d8342d" : "var(--background)"}
                  strokeWidth={i === 4 ? 1.5 : 3}
                />
                <text
                  x={x}
                  y="334"
                  textAnchor="middle"
                  fill={i === 4 ? red : "var(--muted-foreground)"}
                  fontSize="12"
                >
                  -{[50, 40, 31, 42, 60][i]}%
                </text>
                {particles &&
                  Array.from({ length: 12 }, (_, j) => (
                    <circle
                      key={j}
                      cx={x - 35 + ((j * 17) % 70)}
                      cy={
                        center +
                        (j % 2 === 0 ? -1 : 1) *
                          (((totals[i + 1] / 3620) * outerHeight) / 2 + 5 + ((j * 13) % 42))
                      }
                      r={j % 4 === 0 ? 2 : 1}
                      fill={red}
                      opacity={0.12 + (j % 3) * 0.15}
                    />
                  ))}
              </g>
            ))}
            {selected !== null && (
              <g>
                <rect
                  x="320"
                  y="65"
                  width="210"
                  height="28"
                  rx="6"
                  fill="var(--popover)"
                  stroke="var(--border)"
                />
                <text x="425" y="83" textAnchor="middle" fill="currentColor" fontSize="12">
                  {stageNames[selected]} → {stageNames[selected + 1]}:{" "}
                  {Math.round((totals[selected] - totals[selected + 1]) * factors).toLocaleString()}{" "}
                  lost
                </text>
              </g>
            )}
          </svg>
        </div>
      </ChartFrame>
    </ChartStage>
  );
}
export default function SankeyChartBlock({ block }: BlockProps) {
  return block.id === "chart-48" ? (
    <RevenueFlow />
  ) : block.id === "chart-49" ? (
    <TrialJourney />
  ) : (
    <PipelineLeakage />
  );
}
