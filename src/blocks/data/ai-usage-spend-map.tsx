import { useState } from "react";
import { Network, ArrowUp, Sparkles } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Frame, FrameHeader, FrameTitle, FramePanel, FrameFooter } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChartContainer } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { MiniTrend, HealthSegments } from "./sparkline-primitives";
import { ChartMore } from "./chart-chrome";
import { usd } from "./ai-usage-model";
import { cn } from "@/lib/utils";

type Leaf = { name: string; spend: number; tokens: number; change: number; cap?: number };
const dimensions: Record<string, Leaf[]> = {
  Models: [
    { name: "Claude Sonnet 5", spend: 382, tokens: 63.7, change: 14 },
    { name: "GPT-5.1", spend: 231, tokens: 67.2, change: 6 },
    { name: "Gemini 3 Pro", spend: 166, tokens: 36.9, change: 22 },
    { name: "GPT-5.1 mini", spend: 89, tokens: 129.5, change: -8 },
    { name: "Mistral Large", spend: 63, tokens: 31.5, change: -3 },
  ],
  Teams: [
    { name: "Engineering", spend: 354, tokens: 112.9, change: 12, cap: 600 },
    { name: "Product", spend: 268, tokens: 91.6, change: 18, cap: 400 },
    { name: "Data", spend: 194, tokens: 73.2, change: 8, cap: 330 },
    { name: "Support", spend: 115, tokens: 51.1, change: -5 },
  ],
  Agents: [
    { name: "Code Reviewer", spend: 251, tokens: 74, change: 15 },
    { name: "Research Assistant", spend: 185, tokens: 65, change: 9 },
    { name: "Support Copilot", spend: 151, tokens: 52, change: -4 },
    { name: "Data Analyst", spend: 121, tokens: 45, change: 13 },
    { name: "Doc Writer", spend: 98, tokens: 38, change: 7 },
    { name: "Triage", spend: 74, tokens: 31, change: -2 },
    { name: "Release Notes", spend: 51, tokens: 23.8, change: 2 },
  ],
  "API Keys": [
    { name: "Copilot prod", spend: 661, tokens: 219.8, change: 11, cap: 1000 },
    { name: "Research staging", spend: 184, tokens: 63.2, change: 24, cap: 350 },
    { name: "Playground", spend: 86, tokens: 45.8, change: -12, cap: 200 },
  ],
};

/** c-chart-25 native RadialBar/PolarAngleAxis track; free source MIT. */
function BudgetDial() {
  return (
    <div className="relative mx-auto w-44" data-reui-example="c-chart-25">
      <ChartContainer
        config={{ spent: { label: "Spent", color: "var(--foreground)" } }}
        className="size-44"
      >
        <RadialBarChart
          accessibilityLayer
          data={[{ spent: 931 }]}
          startAngle={225}
          endAngle={-45}
          innerRadius="78%"
          outerRadius="90%"
        >
          <PolarAngleAxis type="number" domain={[0, 1500]} tick={false} />
          <RadialBar
            dataKey="spent"
            fill="var(--foreground)"
            background={{ fill: "var(--muted)" }}
            cornerRadius={8}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-2xl">$931</strong>
        <span className="text-xs text-muted-foreground">of $1,500</span>
      </div>
    </div>
  );
}

export default function SpendMap() {
  const [dimension, setDimension] = useState("Models");
  const [selected, setSelected] = useState("Claude Sonnet 5");
  const [metric, setMetric] = useState("Cost");
  const [day, setDay] = useState(18);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const rows = [...dimensions[dimension]].sort((a, b) =>
    metric === "Cost" ? b.spend - a.spend : b.tokens - a.tokens,
  );
  const leaf = rows.find((row) => row.name === selected) ?? rows[0];
  const daily = Array.from({ length: 18 }, (_, index) => 0.5 + (Math.sin(index * 1.14) + 1) * 0.45);
  const weight = daily.reduce((sum, n) => sum + n, 0);
  const values = daily.map((n) => (n / weight) * leaf.spend);
  const cap = leaf.cap ? (((leaf.spend / 18) * 30) / leaf.cap) * 100 : null;
  const respond = (prompt: string) => {
    setQuestion("");
    setAnswer(
      prompt.toLowerCase().includes("save")
        ? `For ${leaf.name}, route short tasks to a smaller model and cache repeated prompts. This is a local demonstration, not a live recommendation.`
        : `${leaf.name} accounts for ${Math.round((leaf.spend / 931) * 100)}% of spend. Its ${leaf.change > 0 ? "increase" : "decrease"} follows the illustrative run mix. Daily samples sum to ${usd(leaf.spend)}.`,
    );
  };
  return (
    <div className="flex min-h-[720px] items-center justify-center p-3 sm:p-6">
      <div className="grid w-full max-w-[1250px] gap-4 lg:grid-cols-[2.65fr_1fr]">
        <Frame>
          <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <IconTile>
                <Network />
              </IconTile>
              <div>
                <FrameTitle role="heading" aria-level={2}>
                  Spend Map
                </FrameTitle>
                <p className="mt-1 text-xs text-muted-foreground">Nov 1 to 18, split four ways</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={metric}
                onValueChange={(value) => value && setMetric(value)}
                aria-label="Measure"
                variant="outline"
                spacing={0}
              >
                {["Cost", "Tokens"].map((value) => (
                  <ToggleGroupItem key={value} value={value} className="h-7 px-2 text-xs">
                    {value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <ChartMore title="AI spend map" rows={rows} />
            </div>
          </FrameHeader>
          <FramePanel className="p-4">
            <div className="relative grid min-h-[470px] items-center gap-5 md:grid-cols-[0.85fr_1fr_1.3fr] [&>div]:relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 1000 470"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 hidden size-full text-border md:block"
              >
                {[70, 180, 290, 400].map((y, i) => (
                  <path
                    key={y}
                    d={`M210 235 C280 235,280 ${y},370 ${y}`}
                    fill="none"
                    stroke={
                      Object.keys(dimensions)[i] === dimension
                        ? "var(--foreground)"
                        : "currentColor"
                    }
                  />
                ))}
                {rows.map((row, i) => (
                  <path
                    key={row.name}
                    d={`M610 ${70 + Object.keys(dimensions).indexOf(dimension) * 110} C680 ${70 + Object.keys(dimensions).indexOf(dimension) * 110},680 ${((i + 0.5) / rows.length) * 470},750 ${((i + 0.5) / rows.length) * 470}`}
                    fill="none"
                    stroke={leaf.name === row.name ? "var(--foreground)" : "currentColor"}
                  />
                ))}
              </svg>
              <div className="text-center">
                <BudgetDial />
                <p className="font-medium">Bricklane Labs</p>
                <p className="mt-2 text-xs text-muted-foreground">Day 18 / 30</p>
                <Badge variant="warning-light" className="mt-3">
                  Projected $1,552
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-1" aria-label="Spend dimensions">
                {Object.entries(dimensions).map(([name, leaves]) => (
                  <button
                    key={name}
                    aria-label={`${name} ${leaves.length} ${leaves[0].name}`}
                    aria-pressed={dimension === name}
                    onClick={() => {
                      setDimension(name);
                      setSelected(leaves[0].name);
                      setAnswer("");
                    }}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors hover:bg-muted/60",
                      dimension === name && "border-foreground/40 bg-muted/70",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-medium">
                      <span>{name}</span>
                      <span className="text-muted-foreground">{leaves.length}</span>
                    </div>
                    <div className="my-2">
                      <HealthSegments
                        parts={leaves.map((item, i) => ({
                          label: item.name,
                          value: item.spend,
                          color:
                            i === 0 && name === dimension
                              ? "var(--foreground)"
                              : `color-mix(in oklab,var(--foreground) ${35 - i * 4}%,transparent)`,
                        }))}
                        label={`${name} share of spend`}
                      />
                    </div>
                    <div className="flex justify-between gap-2 text-[10px] text-muted-foreground">
                      <span className="truncate">{leaves[0].name}</span>
                      <span>{Math.round((leaves[0].spend / 931) * 100)}%</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="space-y-2" aria-label={`${dimension} items`}>
                {rows.map((item) => (
                  <button
                    key={item.name}
                    aria-pressed={leaf.name === item.name}
                    onClick={() => {
                      setSelected(item.name);
                      setAnswer("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left hover:bg-muted/60",
                      leaf.name === item.name && "border-foreground/40 bg-muted/70",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">{item.name}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {metric === "Cost" ? usd(item.spend) : `${item.tokens}M`} ·{" "}
                        {Math.round((item.spend / 931) * 100)}%
                      </span>
                    </span>
                    <Badge
                      variant={
                        item.cap && (item.spend / 18) * 30 > item.cap ? "warning-light" : "outline"
                      }
                      size="xs"
                    >
                      {item.cap ? "Cap tracked" : `${item.change > 0 ? "+" : ""}${item.change}%`}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </FramePanel>
          <FrameFooter className="flex flex-row justify-between gap-2 p-3 text-[11px] text-muted-foreground">
            <span>
              {rows.length} {dimension.toLowerCase()} · Top 2 hold{" "}
              {Math.round(((rows[0].spend + rows[1].spend) / 931) * 100)}% of spend
            </span>
            <span>Updated Nov 18</span>
          </FrameFooter>
        </Frame>
        <Frame>
          <FrameHeader className="px-4 py-3">
            <FrameTitle role="heading" aria-level={2} className="flex items-center gap-2">
              <IconTile>
                <Sparkles />
              </IconTile>
              {leaf.name}
            </FrameTitle>
          </FrameHeader>
          <FramePanel className="space-y-5 p-4">
            <div className="flex justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Month to date</p>
                <p className="mt-2 text-3xl font-semibold">{usd(leaf.spend)}</p>
              </div>
              <div className="text-right text-xs">
                <p className="text-muted-foreground">Projected</p>
                <p className="mt-2 font-semibold">{usd((leaf.spend / 18) * 30)}</p>
              </div>
            </div>
            <MiniTrend
              values={values}
              label={`${leaf.name} daily spend`}
              height={100}
              color="var(--foreground)"
              area
              keyboard
              onPoint={(point) => setDay((point ?? 17) + 1)}
              format={(v) => usd(v, 2)}
            />
            <Slider
              min={1}
              max={18}
              value={[day]}
              onValueChange={([v]) => setDay(v)}
              aria-label={`${leaf.name} spend by day`}
            />
            <p className="text-xs text-muted-foreground">
              Nov {day} · {usd(values[day - 1], 2)}
            </p>
            {cap ? (
              <div className="space-y-2">
                <Progress
                  value={Math.min(100, cap)}
                  aria-label="Projected share of cap"
                  className="h-1"
                />
                <p className="text-xs text-muted-foreground">
                  {Math.round(cap)}% of {usd(leaf.cap!)} cap, projected
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No monthly cap set</p>
            )}
            <dl className="grid grid-cols-2 gap-4 border-t pt-4 text-xs">
              {[
                ["Tokens", `${leaf.tokens}M`],
                ["Runs", Math.round(leaf.tokens * 61.5).toLocaleString()],
                ["Per run", usd(leaf.spend / (leaf.tokens * 61.5), 3)],
                ["Cache hits", "58%"],
              ].map(([name, value]) => (
                <div key={name}>
                  <dt className="text-muted-foreground">{name}</dt>
                  <dd className="mt-2 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </FramePanel>
          <FramePanel className="mt-1 space-y-3 p-4">
            <p className="text-xs text-muted-foreground">Ask Bricklane</p>
            <p role="status" className="min-h-16 text-xs leading-5">
              {answer || `Explore why ${leaf.name}'s spend changed, or find ways to save.`}
            </p>
            <div className="flex flex-wrap gap-2">
              {["Why the change?", "Where to save?"].map((prompt) => (
                <Button
                  key={prompt}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => respond(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (question.trim()) respond(question);
              }}
            >
              <Input
                aria-label="Question about this spend"
                placeholder="Ask about this spend"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="text-xs"
              />
              <Button size="icon" aria-label="Send question" disabled={!question.trim()}>
                <ArrowUp />
              </Button>
            </form>
          </FramePanel>
        </Frame>
      </div>
    </div>
  );
}
