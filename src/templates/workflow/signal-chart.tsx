import { useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { downloadFile } from "@/lib/download";
import { signalCsv } from "./signal-model";

function loadImage(url: string) {
  const image = new Image();
  image.src = url;
  return image.decode().then(() => image);
}

async function exportChart(svg: SVGSVGElement, filename: string) {
  const width = Math.round(svg.clientWidth);
  const height = Math.round(svg.clientHeight);
  const background = getComputedStyle(
    svg.closest("[data-slot=frame-panel]") ?? svg,
  ).backgroundColor;
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copy.setAttribute("width", String(width));
  copy.setAttribute("height", String(height));
  const copies = copy.querySelectorAll<SVGElement>("path, line, rect, text, circle");
  for (const [index, element] of [
    ...svg.querySelectorAll("path, line, rect, text, circle"),
  ].entries()) {
    const style = getComputedStyle(element);
    const next = copies[index];
    for (const property of ["fill", "stroke", "font-family", "font-size", "font-weight"]) {
      next.style.setProperty(property, style.getPropertyValue(property));
    }
  }
  const source = new XMLSerializer().serializeToString(copy);
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
  try {
    const chart = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx || !width || !height) throw new Error("Chart is unavailable");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(chart, 0, 0, canvas.width, canvas.height);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function SignalChart({
  id,
  title,
  label,
  series,
  bars = false,
}: {
  id: string;
  title: string;
  label: string;
  series: { name: string; value: number }[];
  bars?: boolean;
}) {
  const region = useRef<HTMLDivElement>(null);
  const [exportError, setExportError] = useState("");
  async function downloadPng() {
    setExportError("");
    try {
      const svg = region.current?.querySelector<SVGSVGElement>("svg.recharts-surface");
      if (!svg) throw new Error("Chart is unavailable");
      await exportChart(svg, `${id}.png`);
    } catch {
      setExportError("Chart image could not be saved. Try again.");
    }
  }
  const Chart = bars ? BarChart : LineChart;
  return (
    <Frame>
      <FrameHeader className="flex-wrap gap-3">
        <FrameTitle>{title}</FrameTitle>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadFile(`${id}.csv`, signalCsv(series, label), "text/csv")}
          >
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => void downloadPng()}>
            Export PNG
          </Button>
        </div>
      </FrameHeader>
      <FramePanel>
        <div ref={region}>
          <ChartContainer className="h-64 w-full" config={{ value: { label, color: "#388878" } }}>
            <Chart
              data={series}
              accessibilityLayer
              margin={{ top: 8, right: 14, left: 2, bottom: 4 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} minTickGap={12} />
              <YAxis width={42} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {bars ? (
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={3}
                  isAnimationActive={false}
                />
              )}
            </Chart>
          </ChartContainer>
        </div>
        {exportError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {exportError}
          </p>
        )}
      </FramePanel>
    </Frame>
  );
}
