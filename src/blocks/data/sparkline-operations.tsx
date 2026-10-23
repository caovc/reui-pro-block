import { useState, type ReactNode } from "react";
import {
  Activity,
  CalendarClock,
  CircleX,
  Database,
  Flame,
  Layers,
  Link,
  PlugZap,
  RefreshCw,
  Target,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
  FrameFooter,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Badge } from "@/components/reui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartStage } from "./chart-chrome";
import { HealthSegments, MiniTrend } from "./sparkline-primitives";
import { sparkTones as c } from "./sparkline-data";

function Legend({ items }: { items: { label: string; color: string; value?: number }[] }) {
  return (
    <dl className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: item.color }} />
          <dt>
            {item.value !== undefined && (
              <strong className="mr-1 font-normal text-foreground">{item.value}</strong>
            )}
            {item.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
function TileHeading({ title, detail, icon }: { title: string; detail: string; icon: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <IconTile variant="frame" size="sm">
        {icon}
      </IconTile>
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
function Tile({
  title,
  detail,
  icon,
  children,
}: {
  title: string;
  detail: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Frame className="min-w-0">
      <FramePanel className="flex h-full flex-col gap-4 p-4">
        <TileHeading title={title} detail={detail} icon={icon} />
        {children}
      </FramePanel>
    </Frame>
  );
}
const cronRates = [
  100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 98, 100, 96, 100, 86.7, 100, 100, 100, 95, 100,
  97, 96, 98, 100,
];
export function CronJobHealth() {
  return (
    <ChartStage>
      <div className="grid w-full max-w-[1280px] gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile title="Active Jobs" detail="5 paused" icon={<Layers />}>
          <p className="text-2xl font-semibold">
            27<span className="ml-1 text-xs font-normal text-muted-foreground">of 32</span>
          </p>
          <div className="mt-auto">
            <MiniTrend
              label="32 jobs: 24 healthy, 3 failing, 5 paused"
              values={Array(32).fill(1)}
              colors={Array.from({ length: 32 }, (_, i) =>
                i < 24 ? c.green : i < 27 ? c.red : c.purple,
              )}
              bars
              domain={[0, 1]}
              height={27}
            />
            <div className="mt-2">
              <Legend
                items={[
                  { label: "Healthy", value: 24, color: c.green },
                  { label: "Failing", value: 3, color: c.red },
                  { label: "Paused", value: 5, color: c.purple },
                ]}
              />
            </div>
          </div>
        </Tile>
        <Tile title="Success Rate" detail="995 of 1,004 runs" icon={<Activity />}>
          <p className="flex flex-wrap items-center gap-2 text-2xl font-semibold">
            99.1%
            <Badge variant="warning-light" className="text-[10px]">
              Below SLO
            </Badge>
          </p>
          <MiniTrend
            label="Success rate by hour"
            values={cronRates}
            area
            color={c.green}
            threshold={99.5}
            height={59}
            domain={[80, 102]}
            names={cronRates.map((_, i) => `${i}:00 UTC`)}
            format={(v) => `${v.toFixed(1)}%`}
            keyboard
          />
          <Legend
            items={[
              { label: "hours in SLO", value: 17, color: c.green },
              { label: "below", value: 7, color: c.amber },
            ]}
          />
        </Tile>
        <Tile title="Failed Runs" detail="across 5 jobs" icon={<CircleX />}>
          <p className="text-2xl font-semibold">9</p>
          <div className="mt-auto space-y-3">
            <p className="flex min-w-0 items-center gap-2 text-[10px]">
              <span className="text-muted-foreground">Worst</span>
              <Database className="size-3 shrink-0" />
              <span className="truncate">Import bank settlement files</span>
              <span className="shrink-0 text-muted-foreground">4 of 9</span>
            </p>
            <HealthSegments
              label="9 failed runs: 7 failed, 2 timed out"
              height={7}
              parts={[
                { label: "Failed", value: 7, color: c.red },
                { label: "Timed Out", value: 2, color: c.amber },
              ]}
            />
            <Legend
              items={[
                { label: "Failed", value: 7, color: c.red },
                { label: "Timed Out", value: 2, color: c.amber },
              ]}
            />
          </div>
        </Tile>
        <Tile title="Next Run" detail="42 runs in the next hour" icon={<CalendarClock />}>
          <p className="text-2xl font-semibold">
            in 5m<span className="ml-1 text-xs font-normal text-muted-foreground">14:25 UTC</span>
          </p>
          <p className="flex flex-wrap items-center gap-1.5 text-[10px]">
            Drain webhook retry queue
            <Badge variant="destructive-light" className="text-[9px]">
              Failing
            </Badge>
          </p>
          <div className="mt-auto space-y-2">
            <Progress
              value={50}
              aria-label="Drain webhook retry queue run interval"
              className="h-1.5 [&_[data-slot=progress-indicator]]:bg-muted-foreground/40"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>
                <span className="text-destructive">⊗ 14:15 Failed</span>
              </span>
              <span>14:25</span>
            </div>
          </div>
        </Tile>
      </div>
    </ChartStage>
  );
}

const budgetLeft = [-42, -20, 15, 18, 28, 36, 52, 60, 63, 65, 70, 76, 80, 83, 88, 91, 94, 96];
const median = [
  82, 81, 80, 79, 78, 79, 77, 78, 76, 77, 76, 75, 74, 75, 74, 73, 74, 73, 72, 73, 73, 72, 70, 68,
  67, 66, 65, 64,
];
const burn = [75, 60, 1, 1, 2, 0.5, 1, 1, 0.8, 2, 1, 2, 40, 1, 3, 1, 2, 3, 4, 7, 1, 12, 24, 18];
const eventDays = [
  0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 2, 3,
];
function FleetTile({
  title,
  detail,
  icon,
  value,
  children,
  footer,
}: {
  title: string;
  detail: string;
  icon: ReactNode;
  value: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Frame className="min-w-0">
      <FrameHeader className="px-3 py-2">
        <div className="flex items-center gap-2">
          <IconTile variant="frame" size="xs">
            {icon}
          </IconTile>
          <div>
            <FrameTitle className="text-xs">{title}</FrameTitle>
            <FrameDescription className="mt-0.5 text-[10px]">{detail}</FrameDescription>
          </div>
        </div>
      </FrameHeader>
      <FramePanel className="space-y-4 px-3 py-4">
        <div className="flex min-h-7 flex-wrap items-center gap-2 text-2xl font-semibold">
          {value}
        </div>
        {children}
      </FramePanel>
      <FrameFooter className="flex flex-row flex-wrap items-center justify-between gap-1.5 px-3 py-2 text-[10px] text-muted-foreground">
        {footer}
      </FrameFooter>
    </Frame>
  );
}
export function SloFleetHealth() {
  const [focus, setFocus] = useState<(number | null)[]>([null, null, null, null]);
  const point = (tile: number) => (index: number | null) =>
    setFocus((state) => state.map((value, i) => (i === tile ? index : value)));
  return (
    <ChartStage>
      <div className="grid w-full max-w-[1280px] gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FleetTile
          title="Meeting Objective"
          detail="SLOs with budget left"
          icon={<Target />}
          value={
            <>
              16<span className="text-xs font-normal text-muted-foreground">of 18</span>
              <Badge variant="outline" className="text-[10px]">
                ↓ 1
              </Badge>
            </>
          }
          footer={
            focus[0] === null ? (
              <>
                <span>Newest miss</span>
                <span className="text-foreground">Ledger write success</span>
                <span>Sep 25</span>
              </>
            ) : (
              <>
                <span>SLO {focus[0] + 1}</span>
                <span className="text-foreground">{budgetLeft[focus[0]]}% budget left</span>
              </>
            )
          }
        >
          <MiniTrend
            label="Budget left by SLO, lowest first"
            values={budgetLeft}
            colors={budgetLeft.map((v) => (v < 0 ? c.red : v < 50 ? c.amber : c.green))}
            pins
            threshold={0}
            height={57}
            domain={[-50, 110]}
            keyboard
            onPoint={point(0)}
            format={(v) => `${v}%`}
          />
          <Legend
            items={[
              { label: "Healthy", value: 12, color: c.green },
              { label: "At Risk", value: 4, color: c.amber },
              { label: "Exhausted", value: 2, color: c.red },
            ]}
          />
        </FleetTile>
        <FleetTile
          title="Median Budget Left"
          detail="Fleet median, last 28 days"
          icon={<Wallet />}
          value={
            <>
              64%
              <Badge variant="outline" className="text-[10px]">
                ↓ 9 pts
              </Badge>
            </>
          }
          footer={
            focus[1] === null ? (
              <>
                <span>Lowest</span>
                <span className="text-foreground">Ledger write success</span>
                <span className="text-destructive">42% over</span>
              </>
            ) : (
              <>
                <span>Sep {focus[1] + 2}</span>
                <span className="text-foreground">{median[focus[1]]}% budget left</span>
              </>
            )
          }
        >
          <MiniTrend
            label="Fleet median budget left"
            values={median.map((v) => v - 73)}
            colors={median.map((_, i) => (i === 27 ? c.green : c.gray))}
            pins
            threshold={0}
            height={57}
            domain={[-14, 14]}
            keyboard
            onPoint={point(1)}
            format={(v) => `${v + 73}%`}
          />
          <Legend
            items={[
              { label: "73% on Sep 22", color: c.gray },
              { label: "64% today", color: c.green },
            ]}
          />
        </FleetTile>
        <FleetTile
          title="Burning Now"
          detail="Hourly fleet peak, last 24h"
          icon={<Flame />}
          value={
            <>
              2<span className="text-xs font-normal text-muted-foreground">alerting</span>
              <Badge variant="destructive-light" className="text-[10px]">
                1 Paging
              </Badge>
              <Badge variant="warning-light" className="text-[10px]">
                1 Ticket
              </Badge>
            </>
          }
          footer={
            focus[2] === null ? (
              <>
                <span>Hottest</span>
                <span className="text-foreground">Webhook delivery success</span>
                <span className="text-destructive">18×</span>
              </>
            ) : (
              <>
                <span>{focus[2]}:00 UTC peak</span>
                <span className="text-foreground">{burn[focus[2]]}×</span>
              </>
            )
          }
        >
          <MiniTrend
            label="Hourly peak burn"
            values={burn.map(Math.log10)}
            colors={burn.map((v) => (v > 14.4 ? c.red : v > 1 ? c.amber : c.gray))}
            pins
            height={57}
            threshold={Math.log10(14.4)}
            domain={[-0.5, 2.1]}
            keyboard
            onPoint={point(2)}
            names={burn.map((_, i) => `${i}:00 UTC`)}
            format={(v) => `${Math.pow(10, v).toFixed(1)}×`}
          />
          <Legend
            items={[
              { label: "5h over page", color: c.red },
              { label: "1h over pace", color: c.amber },
            ]}
          />
        </FleetTile>
        <FleetTile
          title="Budget Events"
          detail="Incidents and changes, 28 days"
          icon={<CalendarClock />}
          value={
            <>
              14
              <Badge variant="outline" className="text-[10px]">
                MTTR 1h 34m
              </Badge>
            </>
          }
          footer={
            focus[3] === null ? (
              <>
                <span>Latest</span>
                <span className="text-foreground">Webhook retry storm</span>
                <span>Ongoing</span>
              </>
            ) : (
              <>
                <span>Sep {focus[3] + 2}</span>
                <span className="text-foreground">{eventDays[focus[3]]} events</span>
              </>
            )
          }
        >
          <MiniTrend
            label="Budget events over 28 days"
            values={eventDays}
            colors={eventDays.map((v, i) =>
              v && [8, 14, 18, 24, 27].includes(i) ? c.red : c.gray,
            )}
            beads
            height={57}
            domain={[-1, 4]}
            keyboard
            onPoint={point(3)}
            format={(v) => `${v} events`}
          />
          <Legend
            items={[
              { label: "Incidents", value: 5, color: c.red },
              { label: "Other", value: 9, color: c.gray },
            ]}
          />
        </FleetTile>
      </div>
    </ChartStage>
  );
}

const rowsByDay = [7.2, 7.5, 7.9, 7.6, 6.8, 6.5, 7.9, 8, 7.9, 8.2, 7.7, 8.2, 7.8, 8.4];
const failures = [0, 1, 0, 0, 1, 1, 0, 1, 0, 3, 2, 0, 2, 7];
export function ConnectionHealth() {
  return (
    <ChartStage>
      <div className="grid w-full max-w-[1150px] gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ConnectionTile
          title="Connection Health"
          period="Now"
          icon={<PlugZap />}
          value={
            <>
              10<span className="text-muted-foreground/40">/13</span>
              <span className="ml-2 text-xs font-normal text-destructive">↓ 2</span>
            </>
          }
          description="12 healthy yesterday"
        >
          <HealthSegments
            label="Connections by health: 10 healthy, 1 degraded, 1 failing, 1 paused"
            height={8}
            parts={[
              { label: "Healthy", value: 10, color: c.green },
              { label: "Degraded", value: 1, color: c.amber },
              { label: "Failing", value: 1, color: c.red },
              { label: "Paused", value: 1, color: c.gray },
            ]}
          />
          <div className="mt-3">
            <Legend
              items={[
                { label: "Healthy", value: 10, color: c.green },
                { label: "Degraded", value: 1, color: c.amber },
                { label: "Failing", value: 1, color: c.red },
                { label: "Paused", value: 1, color: c.gray },
              ]}
            />
          </div>
        </ConnectionTile>
        <ConnectionTile
          title="Linked Datasets"
          period="Now"
          icon={<Link />}
          value={
            <>
              33<span className="text-muted-foreground/40">/49</span>
              <span className="ml-2 text-xs font-normal text-emerald-600">↑ 2</span>
            </>
          }
          description="31 linked last week"
        >
          <HealthSegments
            label="Datasets by sync state: 32 in sync, 1 drifted, 16 unlinked"
            height={8}
            parts={[
              { label: "In sync", value: 32, color: c.purple },
              { label: "Drifted", value: 1, color: c.amber },
              { label: "Unlinked", value: 16, color: c.gray },
            ]}
          />
          <div className="mt-3">
            <Legend
              items={[
                { label: "In sync", value: 32, color: c.purple },
                { label: "Drifted", value: 1, color: c.amber },
                { label: "Unlinked", value: 16, color: c.gray },
              ]}
            />
          </div>
        </ConnectionTile>
        <ConnectionTile
          title="Rows Synced"
          period="14 days"
          icon={<RefreshCw />}
          value={
            <>
              8.4M<span className="ml-2 text-xs font-normal text-emerald-600">↑ 4.4%</span>
            </>
          }
          description="8.1M yesterday"
        >
          <MiniTrend
            label="Rows synced per day, last 14 days"
            values={rowsByDay}
            area
            color={c.green}
            height={78}
            tooltips
            keyboard
            format={(v) => `${v.toFixed(1)}M`}
          />
        </ConnectionTile>
        <ConnectionTile
          title="Failed Syncs"
          period="14 days"
          icon={<TriangleAlert />}
          value={
            <>
              7<span className="ml-2 text-xs font-normal text-destructive">↑ 5</span>
            </>
          }
          description="2 yesterday, 19 in 14 days"
        >
          <MiniTrend
            label="Failed runs per day, last 14 days"
            values={failures}
            colors={failures.map((_, i) => (i === 13 ? c.red : "#edb3b5"))}
            bars
            height={78}
            keyboard
            tooltips
            format={(v) => `${v} failed syncs`}
          />
        </ConnectionTile>
      </div>
    </ChartStage>
  );
}
function ConnectionTile({
  title,
  period,
  icon,
  value,
  description,
  children,
}: {
  title: string;
  period: string;
  icon: ReactNode;
  value: ReactNode;
  description: string;
  children: ReactNode;
}) {
  return (
    <Frame className="min-w-0">
      <FramePanel className="flex h-full flex-col p-4">
        <header className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-xs font-medium">
            <span className="[&>svg]:size-3.5 [&>svg]:text-muted-foreground">{icon}</span>
            {title}
          </h3>
          <span className="text-[10px] text-muted-foreground">{period}</span>
        </header>
        <p className="mt-4 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{description}</p>
        <div className="mt-auto pt-4">{children}</div>
      </FramePanel>
    </Frame>
  );
}
