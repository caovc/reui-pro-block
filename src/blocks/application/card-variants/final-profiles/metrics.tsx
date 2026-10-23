import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Stage, GridFrame } from "../extended/common";
import "./final-profiles.css";
export function OutreachCounters() {
  return (
    <Stage id={36} width={944}>
      <GridFrame columns={4}>
        {[
          ["340", "Emails Sent"],
          ["62", "Calls Made"],
          ["18", "Demo Requests"],
          ["71", "Meetings"],
        ].map(([value, label]) => (
          <FramePanel
            key={label}
            className="profile-card-dots profile-card-dots-left flex min-h-[100px] flex-col justify-between gap-5"
          >
            <p className="text-xl font-semibold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </FramePanel>
        ))}
      </GridFrame>
    </Stage>
  );
}
export function CompanySnapshot() {
  return (
    <Stage id={37} width={555}>
      <GridFrame columns={3}>
        {[
          { label: "MRR", value: "$210.5k", icon: CircleDollarSign },
          {
            label: "TTM Gross Revenue",
            value: "$2.4M",
            icon: ChartNoAxesCombined,
          },
          { label: "Customer Base", value: "150-500", icon: Users },
          { label: "Annual Growth Rate", value: "45%", icon: TrendingUp },
          { label: "Avg. Order Value", value: "$320", icon: ShoppingBag },
          { label: "Date Founded", value: "Nov 2018", icon: CalendarDays },
        ].map(({ label, value, icon: Icon }) => (
          <FramePanel key={label} className="flex min-w-0 flex-col gap-4">
            <h3 className="text-sm font-normal text-muted-foreground">
              {label}
            </h3>
            <p className="flex items-center gap-2 text-base font-medium">
              <Icon className="size-4 shrink-0 text-green-600" />
              {value}
            </p>
          </FramePanel>
        ))}
      </GridFrame>
    </Stage>
  );
}
export function ProfileStatStrip() {
  return (
    <Stage id={38} width={400}>
      <Frame>
        <FramePanel className="profile-card-stat-strip p-0">
          {[
            ["$9k+", "Earned"],
            ["4x", "Hired"],
            ["4.93", "Rating"],
            ["106", "Followers"],
          ].map(([value, label], i) => (
            <div key={label} className={i === 3 ? "profile-card-dots" : ""}>
              <p className="text-2xl font-semibold tracking-tight">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </FramePanel>
      </Frame>
    </Stage>
  );
}
export function FitnessStats() {
  return (
    <Stage id={40} width={336}>
      <Frame className="profile-card-fitness-grid">
        {[
          ["72", "bpm", "Heart Rate"],
          ["6.2", "km", "Distance Run"],
          ["480", "kcal", "Calories Burned"],
          ["120", "reps", "Strength Reps"],
        ].map(([value, unit, label]) => (
          <FramePanel key={label} className="flex min-w-0 flex-col gap-5">
            <p className="flex flex-wrap items-baseline gap-0.5">
              <span className="text-[28px] leading-tight tracking-tight">
                {value}
              </span>
              <span className="text-base text-muted-foreground/50">{unit}</span>
            </p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </FramePanel>
        ))}
      </Frame>
    </Stage>
  );
}
