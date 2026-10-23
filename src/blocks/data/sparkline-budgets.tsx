import { useState } from "react";
import { ArrowDownToLine, Copy, ListChecks, MoreHorizontal, Plus, Target } from "lucide-react";
import { toast } from "sonner";
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { ChartStage, PeriodButtons } from "./chart-chrome";
import { BudgetPin } from "./sparkline-budget-plots";
import { MiniTrend } from "./sparkline-primitives";
import { sparkTones as c } from "./sparkline-data";
import { downloadCsv } from "./data-utils";

type Objective = {
  id: string;
  name: string;
  service: string;
  indicator: string;
  target: number;
  window: number;
  left: number;
  delta: number;
};
const initial: Objective[] = [
  {
    id: "ledger",
    name: "Ledger write success",
    service: "ledger-worker",
    indicator: "Availability",
    target: 99.99,
    window: 30,
    left: -42,
    delta: -39,
  },
  {
    id: "sms",
    name: "SMS provider availability",
    service: "notifications",
    indicator: "Availability",
    target: 99.5,
    window: 28,
    left: -20,
    delta: -96,
  },
  {
    id: "index",
    name: "Index freshness",
    service: "search-indexer",
    indicator: "Freshness",
    target: 99,
    window: 7,
    left: 15,
    delta: -43,
  },
  {
    id: "payout",
    name: "Payout batch on time",
    service: "payouts-scheduler",
    indicator: "Timeliness",
    target: 99.5,
    window: 30,
    left: 15,
    delta: -18,
  },
  {
    id: "charge",
    name: "Charge API availability",
    service: "payments-api",
    indicator: "Availability",
    target: 99.95,
    window: 28,
    left: 48,
    delta: -31,
  },
  {
    id: "push",
    name: "Push delivery latency",
    service: "notifications",
    indicator: "Latency",
    target: 99,
    window: 7,
    left: 70,
    delta: 3,
  },
  {
    id: "refund",
    name: "Refund API availability",
    service: "payments-api",
    indicator: "Availability",
    target: 99.9,
    window: 28,
    left: 88,
    delta: 0,
  },
];
const services = [
  "payments-api",
  "ledger-worker",
  "notifications",
  "search-indexer",
  "payouts-scheduler",
];
function history(objective: Objective) {
  return Array.from({ length: 28 }, (_, i) =>
    Math.round(
      objective.left - objective.delta * (1 - i / 27) + Math.sin(i * 0.7) * 2 * (1 - i / 27),
    ),
  );
}
function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-8 w-full text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
function jsonExport(rows: Objective[]) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "slo-budgets.json";
  link.click();
  URL.revokeObjectURL(url);
  toast.success("JSON exported");
}
export default function SloBudgets() {
  const [objectives, setObjectives] = useState(initial),
    [filter, setFilter] = useState("all"),
    [sort, setSort] = useState("Budget left"),
    [open, setOpen] = useState(false);
  const [name, setName] = useState(""),
    [service, setService] = useState(services[0]),
    [indicator, setIndicator] = useState("Availability"),
    [target, setTarget] = useState("99.9%"),
    [window, setWindow] = useState("28 days");
  const attention = objectives.filter((row) => row.left < 25).length;
  const rows = objectives
    .filter((row) => filter === "all" || row.left < 25)
    .sort((a, b) =>
      sort === "Name"
        ? a.name.localeCompare(b.name)
        : sort === "Objective"
          ? b.target - a.target
          : a.left - b.left,
    );
  const allowed = (1 - parseFloat(target) / 100) * parseInt(window) * 86400;
  const estimated = Math.round((1 - 0.00015 / (1 - parseFloat(target) / 100)) * 100);
  function create() {
    if (!name.trim()) return;
    setObjectives((all) => [
      ...all,
      {
        id: `slo-${Date.now()}`,
        name: name.trim(),
        service,
        indicator,
        target: parseFloat(target),
        window: parseInt(window),
        left: estimated,
        delta: 0,
      },
    ]);
    setName("");
    setOpen(false);
    toast.success("SLO created with a local metrics backfill");
  }
  return (
    <ChartStage>
      <Frame className="w-full max-w-[768px]">
        <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <IconTile variant="frame" size="sm">
              <ListChecks />
            </IconTile>
            <div>
              <FrameTitle className="text-sm">Objectives</FrameTitle>
              <FrameDescription className="mt-0.5 text-xs">
                {objectives.length} SLOs · {attention} need attention
              </FrameDescription>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="w-full [&>div]:w-full [&_button]:flex-1 sm:w-auto">
              <PeriodButtons
                label="Filter SLOs"
                options={[`All ${objectives.length}`, `Needs attention ${attention}`]}
                value={
                  filter === "all" ? `All ${objectives.length}` : `Needs attention ${attention}`
                }
                onChange={(value) => setFilter(value.startsWith("All") ? "all" : "attention")}
              />
            </div>
            <div className="w-32">
              <Picker
                label="Sort SLOs"
                value={sort}
                options={["Budget left", "Name", "Objective"]}
                onChange={setSort}
              />
            </div>
            <Button size="sm" className="h-7 text-xs" onClick={() => setOpen(true)}>
              <Plus />
              New SLO
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => downloadCsv("slo-budgets", rows)}>
                    <ArrowDownToLine />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => jsonExport(rows)}>
                    <ArrowDownToLine />
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      void navigator.clipboard
                        .writeText(JSON.stringify(rows, null, 2))
                        .then(() => toast.success("Objective data copied"));
                    }}
                  >
                    <Copy />
                    Copy data
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </FrameHeader>
        <FramePanel className="p-0">
          <ul className="divide-y">
            {rows.map((row) => {
              const values = history(row),
                color = row.left < 0 ? c.red : row.left < 25 ? c.amber : c.green;
              return (
                <li
                  key={row.id}
                  className="grid grid-cols-[80px_60px_minmax(0,1fr)] items-center gap-x-2 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_80px_70px_100px] sm:gap-x-5"
                >
                  <div className="col-span-3 min-w-0 sm:col-span-1">
                    <h3 className="truncate text-sm font-medium" title={row.name}>
                      {row.name}
                    </h3>
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                      {row.service}
                      <span>·</span>
                      {row.target}% over {row.window}d
                    </p>
                  </div>
                  <div>
                    <BudgetPin value={row.left} />
                  </div>
                  <p className="text-xs" style={{ color }}>
                    <strong className="font-medium">{Math.abs(row.left)}%</strong>
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      {row.left < 0 ? "over" : "left"}
                    </span>
                  </p>
                  <HoverCard openDelay={100} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        className="rounded outline-offset-2"
                        aria-label={`Rolling budget ${Math.abs(row.left)}% ${row.left < 0 ? "over budget" : "left"}, ${row.delta > 0 ? "+" : ""}${row.delta} pts over 7 days`}
                      >
                        <MiniTrend
                          label={`${row.name} 28-day budget trend`}
                          values={values}
                          beads
                          colors={values.map((_, i) => (i === 27 ? color : c.gray))}
                          color={color}
                          height={38}
                          domain={[-60, 115]}
                        />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent
                      align="end"
                      className="w-80 max-w-[calc(100vw-2rem)] p-3 text-xs"
                    >
                      {/* Official free c-hover-card-4 panel composition; Radix primitive is shadcn. */}
                      <div className="flex gap-2">
                        <Target className="mt-0.5 size-4 shrink-0" style={{ color }} />
                        <div className="space-y-1">
                          <p className="font-medium">{row.name}</p>
                          <p className="leading-relaxed text-muted-foreground">
                            {Math.abs(row.left)}% {row.left < 0 ? "over budget" : "left"} ·{" "}
                            {row.delta > 0 ? "+" : ""}
                            {row.delta} pts over 7 days
                          </p>
                          <p className="leading-relaxed text-muted-foreground">
                            {row.target}% {row.indicator.toLowerCase()} · rolling {row.window} days
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </li>
              );
            })}
          </ul>
        </FramePanel>
      </Frame>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              create();
            }}
          >
            <DialogHeader>
              <DialogTitle>New SLO</DialogTitle>
              <DialogDescription>Budget backfills from 90 days of metrics.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="new-sparkline-slo-name">Name</Label>
              <Input
                id="new-sparkline-slo-name"
                required
                autoFocus
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Checkout API availability"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service</Label>
                <Picker label="Service" value={service} options={services} onChange={setService} />
              </div>
              <div className="space-y-2">
                <Label>Indicator</Label>
                <Picker
                  label="Indicator"
                  value={indicator}
                  options={["Availability", "Latency", "Freshness", "Timeliness"]}
                  onChange={setIndicator}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Objective</Label>
              <PeriodButtons
                label="Objective"
                value={target}
                options={["99%", "99.5%", "99.9%", "99.95%", "99.99%"]}
                onChange={setTarget}
              />
            </div>
            <div className="space-y-2">
              <Label>Rolling Window</Label>
              <PeriodButtons
                label="Rolling Window"
                value={window}
                options={["7 days", "28 days", "30 days"]}
                onChange={setWindow}
              />
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              Allows{" "}
              <strong className="font-medium text-foreground">
                {Math.floor(allowed / 60)}m {Math.round(allowed % 60)}s
              </strong>{" "}
              of full outage, or about{" "}
              <strong className="font-medium text-foreground">
                {(((1 - parseFloat(target) / 100) * 4200000 * parseInt(window)) / 1000).toFixed(1)}K
                requests
              </strong>{" "}
              failing, every {window}. Backfill estimate:{" "}
              <strong style={{ color: estimated < 0 ? c.red : c.green }}>
                {Math.abs(estimated)}% {estimated < 0 ? "over budget" : "left"}
              </strong>
              .
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                <Plus />
                Create SLO
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ChartStage>
  );
}
