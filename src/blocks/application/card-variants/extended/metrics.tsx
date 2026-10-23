import { useId } from "react";
import {
  ChartNoAxesColumnIncreasing,
  CircleDollarSign,
  CreditCard,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { FramePanel } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription } from "@/components/ui/item";
import { Stage, GridFrame } from "./common";

export function AccountBalances() {
  return (
    <Stage id={25} width={960}>
      <GridFrame>
        {[
          {
            type: "Account",
            name: "Main Wallet",
            balance: "$2,435,900",
            delta: 18,
            amount: "$214,356",
            icon: CreditCard,
            tone: "bg-zinc-950 text-white",
          },
          {
            type: "Account",
            name: "Reserve Fund",
            balance: "$1,980,000",
            delta: -3,
            amount: "$58,000",
            icon: ChartNoAxesColumnIncreasing,
            tone: "bg-info text-white",
          },
          {
            type: "Team",
            name: "Growth Portfolio",
            balance: "$3,245,500",
            delta: 10,
            amount: "$295,000",
            icon: TrendingUp,
            tone: "bg-destructive text-white",
          },
        ].map(({ type, name, balance, delta, amount, icon: Icon, tone }) => (
          <FramePanel className="flex flex-col gap-5" key={name}>
            <Item className="p-0">
              <ItemMedia>
                <IconTile variant="elevated" className={tone}>
                  <Icon />
                </IconTile>
              </ItemMedia>
              <ItemContent>
                <ItemDescription>{type}</ItemDescription>
                <ItemTitle>{name}</ItemTitle>
              </ItemContent>
            </Item>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Balance (USD)</p>
              <p className="flex flex-wrap items-baseline gap-1.5">
                <span className="text-xl font-semibold tracking-tight">{balance}</span>
                <span
                  className={
                    delta >= 0 ? "text-sm text-success-foreground" : "text-sm text-destructive"
                  }
                >
                  {delta > 0 ? "+" : ""}
                  {delta}% ({amount})
                </span>
              </p>
            </div>
          </FramePanel>
        ))}
      </GridFrame>
    </Stage>
  );
}

const sharedMetrics = [
  {
    label: "Total Orders",
    value: "1,246",
    fraction: "",
    delta: "23.08%",
    period: "Annual trend",
    up: true,
  },
  {
    label: "Cumulative Spend",
    value: "$89,378",
    fraction: ".02",
    delta: "3.82%",
    period: "Monthly trend",
    up: true,
  },
  {
    label: "Avg. Order Value(AOV)",
    value: "$68",
    fraction: ".50",
    delta: "0.39%",
    period: "Weekly trend",
    up: false,
  },
  {
    label: "Account Balance",
    value: "$2,345",
    fraction: ".94",
    delta: "1.04%",
    period: "Daily trend",
    up: true,
  },
];
export function SharedKpis() {
  return (
    <Stage id={28} width={944}>
      <GridFrame columns={4}>
        {sharedMetrics.map(({ label, value, fraction, delta, period, up }) => (
          <FramePanel key={label} className="flex min-h-[130px] flex-col gap-7">
            <div>
              <p className="extended-shared-value">
                {value}
                <span className="extended-kpi-fraction">{fraction}</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{label}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={up ? "success-light" : "destructive-light"} size="sm">
                {up ? <TrendingUp /> : <TrendingDown />}
                {delta}
              </Badge>
              <span className="text-xs text-muted-foreground">{period}</span>
            </div>
          </FramePanel>
        ))}
      </GridFrame>
    </Stage>
  );
}

// The public card uses fixed decorative wedges rather than an interactive/data chart.
function DecorativeArea({ index }: { index: number }) {
  const id = useId().replace(/:/g, "");
  const levels = [95, 50, 98, 42, 70];
  const colors = [
    ["#7563f4", "#4a33d9"],
    ["#5b46ea", "#321e99"],
    ["#583bec", "#251854"],
    ["#4130ac", "#1d174b"],
  ];
  const start = levels[index];
  const end = levels[index + 1];
  return (
    <svg
      className="extended-area-art"
      aria-hidden="true"
      viewBox="0 0 100 145"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`extended-area-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={colors[index][0]} />
          <stop offset="1" stopColor={colors[index][1]} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${start - 20} 100,${end - 20} 100,145 0,145`}
        fill="#dedafa"
        fillOpacity=".8"
      />
      <polygon points={`0,${start} 100,${end} 100,145 0,145`} fill={`url(#extended-area-${id})`} />
    </svg>
  );
}
export function KpiAreaCards() {
  return (
    <Stage id={29} width={944}>
      <GridFrame columns={4} className="extended-area-grid">
        {[
          {
            label: "Total Orders",
            value: "1,246",
            fraction: "",
            delta: "239",
            up: true,
            description: "Tracks overall orders placed within the selected timeframe",
            icon: ShoppingBag,
          },
          {
            label: "Cumulative Spend",
            value: "$89,378",
            fraction: ".02",
            delta: "$4K",
            up: false,
            description: "Total amount spent across all transactions to date",
            icon: CreditCard,
          },
          {
            label: "Avg. Order Value(AOV)",
            value: "$68",
            fraction: ".50",
            delta: "$17",
            up: true,
            description: "Average revenue earned per order during reporting period",
            icon: CircleDollarSign,
          },
          {
            label: "Account Balance",
            value: "$31,345",
            fraction: ".21",
            delta: "$3K",
            up: true,
            description: "Current available balance based on latest account activity",
            icon: ChartNoAxesColumnIncreasing,
          },
        ].map(({ label, value, fraction, delta, up, description, icon: Icon }, index) => (
          <FramePanel className="extended-area-cell" key={label}>
            <div className="flex flex-col gap-7 p-4">
              <Icon className="size-5 text-muted-foreground" />
              <div>
                <h3 className="text-sm text-muted-foreground">{label}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <p className="extended-shared-value">
                    {value}
                    <span className="extended-kpi-fraction">{fraction}</span>
                  </p>
                  <Badge variant={up ? "success-light" : "warning-light"} size="sm">
                    {up ? <TrendingUp /> : <TrendingDown />}
                    {delta}
                  </Badge>
                </div>
              </div>
              <p className="text-sm leading-5 text-muted-foreground">{description}</p>
            </div>
            <DecorativeArea index={index} />
          </FramePanel>
        ))}
      </GridFrame>
    </Stage>
  );
}
