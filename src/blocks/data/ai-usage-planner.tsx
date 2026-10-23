import { useId, useState } from "react";
import { CalendarDays, CircleHelp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Frame, FrameHeader, FrameTitle, FramePanel, FrameFooter } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldTitle,
  FieldDescription,
} from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MiniTrend } from "./sparkline-primitives";
import { ChartMore } from "./chart-chrome";
import { addons, hostedModels, quoteFor, tokenLabel, tokenStops, usd } from "./ai-usage-model";
import { cn } from "@/lib/utils";

/** Actual free REUI c-slider-10 tick composition + c-slider-11 controlled bubble.
 * Copyright (c) 2025 Keenthemes Inc. MIT; see components/reui/REUI-LICENSE.txt.
 * Nonlinear token stops and graduated band labels are independent extensions.
 */
function TokenRuler({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const millions = tokenStops[value];
  return (
    <div className="relative pt-10 pb-4" data-reui-example="c-slider-10 c-slider-11">
      <div
        className="absolute top-0 rounded border bg-background px-2 py-1 text-xs font-semibold tabular-nums"
        style={{
          left: `${Math.max(8, Math.min(92, (value / 80) * 100))}%`,
          transform: "translateX(-50%)",
        }}
      >
        {tokenLabel(millions)} <span className="font-normal text-muted-foreground">tokens</span>
      </div>
      <span aria-hidden="true" className="flex h-9 w-full items-end justify-between gap-0 px-1">
        {tokenStops.map((_, index) => (
          <span
            key={index}
            className={cn(
              "flex w-0 flex-col items-center justify-end",
              index > value && "opacity-20",
            )}
          >
            <span
              className={cn(
                "w-px bg-foreground h-3",
                index % 5 === 0 && "h-5",
                index % 20 === 0 && "h-8",
              )}
            />
          </span>
        ))}
      </span>
      <Slider
        aria-label="Tokens per month"
        aria-valuetext={`${(millions * 1000000).toLocaleString()} tokens`}
        value={[value]}
        max={80}
        step={1}
        onValueChange={([next]) => onChange(next)}
        className="mt-2"
      />
      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        <span>1M</span>
        <span>10M</span>
        <span>100M</span>
        <span>1B</span>
        <span>10B</span>
      </div>
      <div className="mt-5 grid grid-cols-4 text-center text-xs text-muted-foreground">
        {["List", "−10%", "−20%", "−30%"].map((name, index) => (
          <span key={name}>
            <Badge
              variant={Math.min(3, Math.floor(value / 20)) === index ? "secondary" : "outline"}
            >
              {name}
            </Badge>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function UsagePlanner() {
  const [stop, setStop] = useState(47);
  const [model, setModel] = useState(3);
  const [selected, setSelected] = useState(["Web Search", "Long Context"]);
  const [annual, setAnnual] = useState(false);
  const [day, setDay] = useState(30);
  const [saved, setSaved] = useState(false);
  const id = useId();
  const millions = tokenStops[stop];
  const quote = quoteFor(millions, model, selected, annual);
  const change = () => setSaved(false);
  const trend = Array.from(
    { length: 30 },
    (_, index) => quote.total * ((index + 1) / 30) * (0.97 + Math.sin(index * 1.1) * 0.025),
  );
  trend[29] = quote.total;
  const plan = {
    millions,
    model: hostedModels[model].name,
    addons: selected,
    annual,
    projectedMonthlyUSD: quote.total,
  };
  return (
    <div className="flex min-h-[720px] items-center justify-center p-3 sm:p-6">
      <div className="grid w-full max-w-[1152px] gap-4 lg:grid-cols-[2.15fr_1fr]">
        <Frame>
          <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 py-3">
            <FrameTitle role="heading" aria-level={2} className="flex items-center gap-2">
              Usage Planner <CircleHelp className="size-3.5 text-muted-foreground" />
            </FrameTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <CalendarDays className="size-3" /> Nov 2026
              </Badge>
              <ChartMore title="AI usage plan" rows={[plan]}>
                <DropdownMenuItem
                  onSelect={() => {
                    setStop(47);
                    setModel(3);
                    setSelected(["Web Search", "Long Context"]);
                    setAnnual(false);
                    change();
                  }}
                >
                  Reset plan
                </DropdownMenuItem>
              </ChartMore>
            </div>
          </FrameHeader>
          <FramePanel className="divide-y p-0">
            <section className="p-4 sm:p-5">
              <div className="mb-4 flex justify-between gap-3 text-sm">
                <h2 className="font-medium">Monthly Tokens</h2>
                <span className="text-xs text-muted-foreground">Graduated pricing</span>
              </div>
              <TokenRuler
                value={stop}
                onChange={(next) => {
                  setStop(next);
                  change();
                }}
              />
            </section>
            <section className="p-4 sm:p-5">
              <div className="mb-4 flex justify-between gap-3 text-sm">
                <h2 className="font-medium">Default Model</h2>
                <span className="text-xs text-muted-foreground">Rates per 1M tokens</span>
              </div>
              {/* Actual free c-radio-group-7 FieldLabel/Field/FieldContent/RadioGroupItem cards. */}
              <RadioGroup
                value={String(model)}
                onValueChange={(value) => {
                  setModel(Number(value));
                  change();
                }}
                className="grid gap-2 sm:grid-cols-2"
                aria-label="Default Model"
                data-reui-example="c-radio-group-7"
              >
                {hostedModels.map((item, index) => (
                  <FieldLabel
                    key={item.name}
                    htmlFor={`${id}-${index}`}
                    className="cursor-pointer rounded-lg border p-3 has-[[data-state=checked]]:bg-muted/70"
                  >
                    <Field orientation="horizontal" className="items-start">
                      <RadioGroupItem
                        value={String(index)}
                        id={`${id}-${index}`}
                        aria-label={item.name}
                        className="mt-0.5"
                      />
                      <FieldContent>
                        <FieldTitle className="flex w-full justify-between gap-2 text-xs">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="size-3" />
                            {item.name}
                          </span>
                          <span>{usd(item.rate, 2)}</span>
                        </FieldTitle>
                        <FieldDescription className="flex flex-wrap justify-between gap-1 text-[11px]">
                          <span>{item.note}</span>
                          <span>{item.latency} ms</span>
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </section>
            <section className="p-4 sm:p-5">
              <div className="mb-4 flex justify-between gap-3 text-sm">
                <h2 className="font-medium">Add-ons</h2>
                <span className="text-xs text-muted-foreground">{selected.length} selected</span>
              </div>
              <ToggleGroup
                type="multiple"
                value={selected}
                onValueChange={(next) => {
                  setSelected(next);
                  change();
                }}
                aria-label="Add-ons"
                className="flex flex-wrap justify-start gap-2"
              >
                {addons.map((addon) => (
                  <ToggleGroupItem
                    key={addon.name}
                    value={addon.name}
                    aria-label={addon.name}
                    variant="outline"
                    className="h-8 rounded-md border px-2 text-xs"
                  >
                    {addon.name}
                    <span className="ml-1 text-muted-foreground">
                      {addon.flat ? `${usd(addon.flat)}/mo` : `+${usd(addon.rate, 2)}/1M`}
                    </span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </section>
          </FramePanel>
        </Frame>
        <Frame className="flex flex-col">
          <FrameHeader className="flex flex-row items-center justify-between px-4 py-3">
            <FrameTitle role="heading" aria-level={2}>
              Projected Spend
            </FrameTitle>
            <Badge variant="secondary">−{quote.band}% band</Badge>
          </FrameHeader>
          <FramePanel className="flex-1 space-y-5 p-4">
            <div>
              <p className="text-4xl font-semibold tracking-tight" aria-live="polite">
                {usd(quote.total)}{" "}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="mt-2 text-sm">
                {usd(quote.total / millions, 2)}{" "}
                <span className="text-muted-foreground">per 1M tokens, blended</span>
              </p>
            </div>
            <div className="flex justify-between gap-2 text-xs text-muted-foreground">
              <span className={quote.total > 1500 ? "text-destructive" : ""}>
                {Math.round((quote.total / 1500) * 100)}% of budget
              </span>
              <span>{usd(1500)} cap</span>
            </div>
            <MiniTrend
              values={trend}
              label="Projected running spend"
              height={140}
              color="var(--foreground)"
              area
              keyboard
              onPoint={(point) => setDay((point ?? 29) + 1)}
              format={(value) => usd(value)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nov 1</span>
              <span>
                Nov {day} · {usd(trend[day - 1])}
              </span>
            </div>
            <dl className="space-y-3 border-t pt-4 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{hostedModels[model].name} usage</dt>
                <dd>{usd(quote.raw)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Volume discount</dt>
                <dd className="text-emerald-600">−{usd(quote.discount)}</dd>
              </div>
              {quote.extras.map((extra) => (
                <div key={extra.name} className="flex justify-between">
                  <dt className="text-muted-foreground">{extra.name}</dt>
                  <dd>{usd(extra.amount)}</dd>
                </div>
              ))}
              {annual && (
                <div className="flex justify-between">
                  <dt>Annual discount</dt>
                  <dd>−{usd(quote.annualDiscount)}</dd>
                </div>
              )}
            </dl>
            <label className="flex items-start gap-2 border-t pt-4 text-xs">
              <Switch
                aria-label="Annual commit"
                checked={annual}
                onCheckedChange={(next) => {
                  setAnnual(next);
                  change();
                }}
              />
              <span className="space-y-1">
                <span className="flex items-center gap-2 font-medium">
                  Annual commit <Badge variant="success-light">−12%</Badge>
                </span>
                <span className="block text-muted-foreground">Locked rates for 12 months</span>
              </span>
            </label>
          </FramePanel>
          <FrameFooter className="p-4">
            <Button
              className="w-full"
              onClick={() => {
                setSaved(true);
                toast.success("Plan saved in this demo");
              }}
            >
              {saved ? "Plan saved" : "Save Plan"}
            </Button>
          </FrameFooter>
        </Frame>
      </div>
    </div>
  );
}
