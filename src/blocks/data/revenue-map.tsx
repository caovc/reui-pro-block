import { useMemo, useState } from "react";
import { Copy, Download, Ellipsis, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { downloadCsv } from "./data-utils";
import { mapGridHeight, mapGridWidth, revenueLandRuns } from "./revenue-map-land";
import {
  compactRevenue,
  revenueAccountCount,
  revenueAmount,
  revenueBand,
  revenueBands,
  revenueOverview,
  revenuePeriods,
  revenueSegments,
  revenueShare,
  type RevenuePeriod,
  type RevenueRegion,
  type RevenueRegionId,
  type RevenueSegment,
} from "./revenue-map-model";

function buildLandPaths(runs: (typeof revenueLandRuns)["neutral"]) {
  const dots = [];
  const hitAreas = [];
  for (const [row, start, end] of runs) {
    hitAreas.push(`M${start} ${row}h${end - start + 1}v1h-${end - start + 1}z`);
    for (let column = start; column <= end; column += 1) {
      dots.push(`M${column + 0.12} ${row + 0.5}a.38 .38 0 1 0 .76 0a.38 .38 0 1 0-.76 0z`);
    }
  }
  return { dots: dots.join(""), hitAreas: hitAreas.join("") };
}

const landPaths = Object.fromEntries(
  Object.entries(revenueLandRuns).map(([id, runs]) => [id, buildLandPaths(runs)]),
);

function RegionMap({
  regions,
  title,
  active,
  selected,
  onHighlight,
  onToggle,
}: {
  regions: RevenueRegion[];
  title: string;
  active: RevenueRegionId | null;
  selected: RevenueRegionId | null;
  onHighlight: (region: RevenueRegionId | null) => void;
  onToggle: (region: RevenueRegionId) => void;
}) {
  return (
    <svg
      aria-label={title}
      className="block h-auto w-full"
      role="group"
      viewBox={`0 0 ${mapGridWidth} ${mapGridHeight}`}
    >
      <path
        d={landPaths.neutral.dots}
        fill="var(--color-muted-foreground)"
        fillOpacity={0.32}
        aria-hidden="true"
      />
      {regions.map((region) => {
        const path = landPaths[region.id];
        const pressed = selected === region.id;
        const focused = active === region.id;
        return (
          <g
            key={region.id}
            role="button"
            tabIndex={0}
            aria-label={`${region.label}: ${compactRevenue(region.revenue)}, ${revenueShare(region.share)} of revenue, ${revenueAccountCount(region.accounts)} accounts`}
            aria-pressed={pressed}
            className={cn(
              "cursor-pointer outline-none transition-opacity",
              active && !focused && "opacity-45",
            )}
            onPointerEnter={() => onHighlight(region.id)}
            onPointerLeave={() => onHighlight(null)}
            onFocus={(event) => {
              if (event.currentTarget.matches(":focus-visible")) onHighlight(region.id);
            }}
            onBlur={() => onHighlight(null)}
            onClick={() => onToggle(region.id)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onToggle(region.id);
            }}
          >
            <path
              d={path.dots}
              fill={revenueBand(region.share).color}
              stroke={focused ? revenueBand(region.share).color : undefined}
              strokeWidth={focused ? 0.1 : undefined}
              pointerEvents="none"
            />
            <path d={path.hitAreas} fill="transparent" pointerEvents="fill" />
          </g>
        );
      })}
    </svg>
  );
}

export default function RevenueMap() {
  const [segment, setSegment] = useState<RevenueSegment>("all");
  const [period, setPeriod] = useState<RevenuePeriod>("q3");
  const [selected, setSelected] = useState<RevenueRegionId | null>(null);
  const [highlighted, setHighlighted] = useState<RevenueRegionId | null>(null);
  const result = useMemo(() => revenueOverview(segment, period), [segment, period]);
  const segmentName =
    revenueSegments.find((entry) => entry.id === segment)?.label ?? "All Segments";
  const active = highlighted ?? selected;
  const region = result.regions.find((entry) => entry.id === active);

  function clearRegion() {
    setSelected(null);
    setHighlighted(null);
  }

  function toggleRegion(regionId: RevenueRegionId) {
    setSelected((current) => (current === regionId ? null : regionId));
    setHighlighted(null);
  }

  async function copySummary() {
    const summary = [
      `Revenue Map · ${segmentName} · ${result.period.label}`,
      `${revenueAmount(result.revenue)} revenue across ${revenueAccountCount(result.accounts)} accounts`,
      ...result.hotSpots.map(
        (spot) => `${spot.label}: ${revenueAmount(spot.revenue)} (${revenueShare(spot.share)})`,
      ),
      `${revenueAmount(result.revenuePerAccount)} monthly revenue per account`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      toast.success("Summary copied");
    } catch {
      toast.error("Could not copy summary");
    }
  }

  return (
    <section
      className="@container mx-auto flex min-h-svh w-full max-w-[944px] items-center px-6 py-6"
      onKeyDown={(event) => {
        if (event.key === "Escape") clearRegion();
      }}
    >
      <Frame className="min-w-0 flex-1">
        <FrameHeader className="gap-2 @2xl:flex-row @2xl:items-center @2xl:justify-between">
          <div>
            <FrameTitle>
              <h3>Revenue Map</h3>
            </FrameTitle>
            <FrameDescription>
              Revenue by sales region, {segmentName.toLowerCase()}
            </FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="basis-full @2xl:basis-auto">
              <Select
                value={segment}
                onValueChange={(value) => {
                  setSegment(value as RevenueSegment);
                  clearRegion();
                }}
              >
                <SelectTrigger aria-label="Segment" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectGroup>
                    {revenueSegments.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Select
              value={period}
              onValueChange={(value) => {
                setPeriod(value as RevenuePeriod);
                clearRegion();
              }}
            >
              <SelectTrigger aria-label="Period" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {revenuePeriods.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label="More actions">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() =>
                      downloadCsv(
                        "Revenue Map",
                        result.regions.map((item) => ({
                          Region: item.label,
                          Segment: segmentName,
                          Period: result.period.label,
                          Revenue: item.revenue,
                          "Share of revenue": revenueShare(item.share),
                          "Paying accounts": item.accounts,
                        })),
                      )
                    }
                  >
                    <Download /> Download CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void copySummary()}>
                    <Copy /> Copy Summary
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={segment === "all" && period === "q3" && selected === null}
                    onSelect={() => {
                      setSegment("all");
                      setPeriod("q3");
                      clearRegion();
                    }}
                  >
                    <RotateCcw /> Reset View
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </FrameHeader>
        <FramePanel className="flex flex-col gap-6">
          <div className="relative flex flex-col gap-3">
            <div className="flex flex-col gap-0.5 @2xl:pointer-events-none @2xl:absolute @2xl:bottom-0 @2xl:left-0">
              <span className="text-sm font-medium">
                {region?.label ?? `All ${result.regions.length} Regions`}
              </span>
              <strong
                data-revenue-total
                className="text-xl font-semibold tracking-tight tabular-nums"
              >
                {compactRevenue(region?.revenue ?? result.revenue)}
              </strong>
              <span className="text-xs text-muted-foreground">
                {region ? `${revenueShare(region.share)} of revenue` : "Revenue"}
                {" · "}
                {revenueAccountCount(region?.accounts ?? result.accounts)} accounts
              </span>
            </div>
            <RegionMap
              regions={result.regions}
              title={`Revenue by region, ${segmentName}, ${result.period.label}`}
              active={active}
              selected={selected}
              onHighlight={setHighlighted}
              onToggle={toggleRegion}
            />
          </div>
          <div className="grid gap-6 @2xl:grid-cols-2">
            <section aria-label="Hot Spots" className="min-w-0">
              <h4 className="mb-2 text-xs text-muted-foreground">Hot Spots</h4>
              <ItemGroup className="gap-0 has-data-[size=sm]:gap-0">
                {result.hotSpots.map((spot) => (
                  <Item
                    key={spot.id}
                    asChild
                    size="sm"
                    className={cn(
                      "h-8 w-full flex-nowrap gap-2 rounded-md border-0 px-1 py-0 text-left hover:bg-muted",
                      active === spot.id && "bg-muted",
                    )}
                  >
                    <button
                      type="button"
                      aria-pressed={selected === spot.id}
                      onClick={() => toggleRegion(spot.id)}
                    >
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: revenueBand(spot.share).color }}
                        aria-hidden="true"
                      />
                      <ItemContent className="min-w-0">
                        <ItemTitle className="truncate">{spot.label}</ItemTitle>
                      </ItemContent>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {compactRevenue(spot.revenue)}
                      </span>
                      <span className="w-8 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                        {revenueShare(spot.share)}
                      </span>
                    </button>
                  </Item>
                ))}
              </ItemGroup>
            </section>
            <section aria-label="Revenue per Account">
              <h4 className="mb-2 text-xs text-muted-foreground">Revenue per Account</h4>
              <dl className="text-sm tabular-nums">
                <div className="flex justify-between gap-3 py-1.5">
                  <dt className="text-muted-foreground">{result.period.month} revenue</dt>
                  <dd className="font-medium">{revenueAmount(result.monthlyRevenue)}</dd>
                </div>
                <div className="flex justify-between gap-3 py-1.5">
                  <dt className="text-muted-foreground">Paying accounts</dt>
                  <dd className="font-medium">{revenueAccountCount(result.accounts)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t py-1.5">
                  <dt className="text-muted-foreground">Per account, monthly</dt>
                  <dd className="font-semibold">{revenueAmount(result.revenuePerAccount)}</dd>
                </div>
              </dl>
            </section>
          </div>
        </FramePanel>
        <FrameFooter className="gap-2 text-xs text-muted-foreground @2xl:flex-row @2xl:items-center @2xl:justify-between">
          <span>As of Oct 15, 2026</span>
          <div className="grid grid-cols-2 items-center gap-x-2 gap-y-1.5 @min-[300px]:grid-cols-3 @2xl:flex @2xl:flex-wrap">
            <span className="col-span-full">Share of revenue</span>
            {revenueBands.map((band, index) => (
              <span key={band.label} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className={cn(
                    "size-3 rounded-full",
                    index === 0 && "border border-muted-foreground",
                  )}
                  style={{ backgroundColor: index === 0 ? "transparent" : band.color }}
                  aria-hidden="true"
                />
                {band.label}
              </span>
            ))}
          </div>
        </FrameFooter>
      </Frame>
    </section>
  );
}
