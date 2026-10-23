import type { ReactNode } from "react";
import { ChevronDown, CalendarDays, RefreshCw, Maximize2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
  FrameFooter,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { ChartMore } from "./chart-chrome";
import { TrendColor } from "./trend-foundation";
export function TrendTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <span className="flex items-center gap-2">
      <IconTile variant="frame" size="sm">
        {icon}
      </IconTile>
      {title}
    </span>
  );
}
export function TrendChoice({
  label,
  value,
  options,
  onChange,
  calendar = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  calendar?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          aria-label={`${label}: ${value}`}
        >
          {calendar && <CalendarDays className="size-3.5" />}
          {value}
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o} value={o}>
              {o}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function TrendLayers({
  layers,
  onChange,
  label = "Display",
}: {
  layers: Record<string, boolean>;
  onChange: (name: string, value: boolean) => void;
  label?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-xs">
          <SlidersHorizontal className="size-3.5" />
          {label}
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Chart layers</DropdownMenuLabel>
        <DropdownMenuGroup>
          {Object.entries(layers).map(([name, checked]) => (
            <DropdownMenuCheckboxItem
              key={name}
              checked={checked}
              onCheckedChange={(v) => onChange(name, !!v)}
            >
              {name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function TrendActions({
  title,
  rows,
  summary,
  onRefresh,
  onExpand,
  color,
  onColor,
}: {
  title: string;
  rows: Record<string, unknown>[];
  summary?: string;
  onRefresh?: () => void;
  onExpand?: () => void;
  color?: string;
  onColor?: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {color && onColor && <TrendColor color={color} onChange={onColor} />}
      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          aria-label="Refresh data"
          onClick={onRefresh}
        >
          <RefreshCw />
        </Button>
      )}
      {onExpand && (
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          aria-label="Expand chart"
          onClick={onExpand}
        >
          <Maximize2 />
        </Button>
      )}
      <ChartMore title={title} rows={rows} summary={summary} />
    </div>
  );
}
export function TrendExpanded({
  open,
  onChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onChange}>
      <DialogContent className="w-[min(1150px,96vw)] sm:max-w-none">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function TrendStats({
  items,
  prominent = false,
  borderless = false,
}: {
  items: { label: string; value: ReactNode; detail: ReactNode }[];
  prominent?: boolean;
  borderless?: boolean;
}) {
  return (
    <dl
      className={
        borderless
          ? "grid grid-cols-2 sm:grid-cols-4"
          : "grid grid-cols-2 divide-x divide-y border-t sm:grid-cols-4 sm:divide-y-0"
      }
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0 space-y-1.5 px-4 py-3">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd
            className={
              prominent
                ? "text-2xl font-semibold tracking-tight"
                : "text-lg font-semibold tracking-tight"
            }
          >
            {item.value}
          </dd>
          <dd className="text-xs text-muted-foreground">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Actual REUI multi-panel Frame composition for separate KPI/plot surfaces. */
export function TrendSplitFrame({
  title,
  description,
  toolbar,
  footer,
  panels,
  width = "max-w-[900px]",
}: {
  title: ReactNode;
  description: ReactNode;
  toolbar: ReactNode;
  footer: ReactNode;
  panels: ReactNode[];
  width?: string;
}) {
  return (
    <Frame className={`w-full ${width}`}>
      <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-3 py-2.5">
        <div className="space-y-1">
          <FrameTitle className="flex flex-wrap items-center gap-2">{title}</FrameTitle>
          <FrameDescription className="text-xs">{description}</FrameDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
      </FrameHeader>
      {panels.map((panel, i) => (
        <FramePanel key={i} className="p-0">
          {panel}
        </FramePanel>
      ))}
      <FrameFooter className="flex flex-row flex-wrap justify-between gap-2 px-3 py-2.5 text-xs text-muted-foreground">
        {footer}
      </FrameFooter>
    </Frame>
  );
}
