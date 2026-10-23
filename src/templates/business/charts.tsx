import { ReuiStripePattern } from "@/blocks/data/reui-free-chart-primitives";
import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
const colors = ["#ff508d", "#b485ff", "#9290ff", "#ffb23e", "#49ccbd", "#48caff", "#55cda5"];
export function BusinessBars({
  labels,
  large = false,
  multi = false,
  values,
}: {
  labels: string[];
  large?: boolean;
  multi?: boolean;
  values?: number[];
}) {
  const uid = useId().replaceAll(":", "");
  const blue = [41, 36, 62, 27, 52, 22, 67, 45, 17],
    cyan = [75, 89, 40, 58, 82, 70, 42, 77, 34],
    single = [48, 88, 92, 84, 72, 76, 68, 81, 43];
  const data = labels.map((name, i) => ({
    name,
    Blocked: blue[i],
    Watched: cyan[i],
    Units: values?.[i] ?? single[i],
  }));
  return (
    <div className={`bt-rechart bt-chart-bars ${large ? "bt-chart-large" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 0, left: 0, bottom: 0 }}
          barCategoryGap={large ? "8%" : "12%"}
          barGap={2}
        >
          <defs>
            <ReuiStripePattern id={uid} color="#5277f0" />
            {colors.map((color, index) => (
              <ReuiStripePattern key={color} id={`${uid}color${index}`} color={color} />
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            interval={0}
            height={30}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
          />
          {multi ? (
            <>
              <Bar
                dataKey="Blocked"
                fill={`url(#${uid})`}
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
              <Bar
                dataKey="Watched"
                fill="#83d7ee"
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
            </>
          ) : (
            <Bar dataKey="Units" radius={[8, 8, 0, 0]} isAnimationActive={false}>
              {data.map((_, i) => (
                <Cell key={i} fill={large ? `url(#${uid}color${i % 7})` : colors[i % 7]} />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function BusinessArea({ mono = false }: { mono?: boolean }) {
  const uid = useId().replaceAll(":", "");
  const values = mono
    ? [184, 183, 187, 185, 189, 189, 190, 190, 194, 198, 194, 198]
    : [28, 41, 34, 49, 36, 61, 48, 69, 52, 39, 51, 61];
  const data = values.map((n, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    Appointments: n,
    Patients: Math.round(n * 0.35),
  }));
  return (
    <div className="bt-rechart bt-area">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 2, left: 2, bottom: 0 }}>
          <defs>
            <ReuiStripePattern id={uid} color="#edb91f" />
            <linearGradient id={uid + "gray"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7e7e86" stopOpacity=".3" />
              <stop offset="1" stopColor="#7e7e86" stopOpacity="0" />
            </linearGradient>
          </defs>
          {!mono && <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />}
          <YAxis hide domain={mono ? ["dataMin - 2", "dataMax + 2"] : [0, "auto"]} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            hide={mono}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="Appointments"
            stroke={mono ? "#8a8a91" : "#edb91f"}
            fill={`url(#${uid + (mono ? "gray" : "")})`}
            strokeWidth={1.2}
            dot={mono ? { r: 2, fill: "#8a8a91" } : false}
            isAnimationActive={false}
          />
          {!mono && (
            <Area
              type="monotone"
              dataKey="Patients"
              stroke="#21b991"
              fill="#21b99110"
              strokeWidth={1.2}
              isAnimationActive={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
