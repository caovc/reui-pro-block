import { Activity, Layers, Clock, CircleAlert } from "lucide-react";
import { MiniTrend } from "@/blocks/data/sparkline-primitives";
const metricData = {
  Week: [
    ["58,247", "8.2%"],
    ["38", "2"],
    ["214ms", "18ms"],
    ["0.14%", "0.03"],
  ],
  Month: [
    ["251,580", "6.4%"],
    ["41", "5"],
    ["221ms", "31ms"],
    ["0.11%", "0.06"],
  ],
  Year: [
    ["2,852,270", "31.7%"],
    ["44", "12"],
    ["236ms", "96ms"],
    ["0.19%", "0.02"],
  ],
};
const names = ["Runs completed", "Active pipelines", "Median latency", "Error rate"];
const values = [
  [42, 45, 43, 49, 47, 54, 58],
  [43, 43, 47, 46, 51, 50, 55],
  [59, 56, 58, 52, 54, 49, 50],
  [55, 51, 54, 48, 51, 46, 47],
];
export function ConsoleMetrics({ period }: { period: string }) {
  const metrics = metricData[period as keyof typeof metricData] || metricData.Week;
  return (
    <div className="ct-console-stats">
      {metrics.map(([value, delta], index) => {
        const Icon = [Activity, Layers, Clock, CircleAlert][index];
        return (
          <div key={names[index]}>
            <small>
              <Icon size={12} />
              {names[index]}
            </small>
            <strong>
              {value}
              <em>
                {index > 1 ? "↘" : "↗"} {delta}
              </em>
            </strong>
            <MiniTrend
              values={values[index]}
              label={`${names[index]} ${period.toLowerCase()} trend`}
              color="#eddf00"
              height={32}
              domain={[0, 100]}
            />
          </div>
        );
      })}
    </div>
  );
}
export function ConsoleThroughput() {
  return (
    <>
      <div className="ct-console-throughput-summary">
        {[
          ["612", "Peak"],
          ["347", "Mean"],
          ["198", "Now"],
        ].map(([value, label]) => (
          <span key={label}>
            <b>{value}</b>
            <small>{label}</small>
          </span>
        ))}
      </div>
      <MiniTrend
        values={[
          195, 170, 151, 145, 144, 154, 192, 275, 355, 435, 485, 505, 490, 535, 575, 612, 590, 550,
          465, 390, 325, 280, 235, 207,
        ]}
        label="Runs started per hour, last 24 hours"
        color="#eddf00"
        height={228}
        area
        tooltips
        names={Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, "0")}:00`)}
      />
      <div className="ct-console-chart-times">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </>
  );
}
