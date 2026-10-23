import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
} from "@/components/reui/frame";
import type { ReactNode } from "react";
import { Check, Ellipsis, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/reui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
export function StructureFrame({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Frame
      dense
      role="region"
      aria-label={title}
      className={cn(
        "mx-auto w-full min-w-0 max-w-[1216px] overflow-hidden text-sm",
        className,
      )}
    >
      <FrameHeader className="flex-row flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <FrameTitle>
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          </FrameTitle>
          {subtitle && (
            <FrameDescription className="mt-1 text-xs">
              {subtitle}
            </FrameDescription>
          )}
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </FrameHeader>
      <FramePanel className="min-w-0 [--frame-panel-px:0px] [--frame-panel-py:0px]">
        {children}
      </FramePanel>
    </Frame>
  );
}
export function StructureToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-y px-4 py-3">
      {children}
    </div>
  );
}
export function StructureSearch({
  value,
  onChange,
  placeholder = "Search...",
  label,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div className="relative w-full min-w-0 sm:w-auto sm:flex-1 sm:max-w-80">
      <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label || placeholder}
        placeholder={placeholder}
        className="h-8 pl-8 text-sm"
      />
    </div>
  );
}
export function StructureSelect({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={cn("h-8 min-w-24 text-sm", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function StructureBadge({
  value,
  dot = false,
}: {
  value: string;
  dot?: boolean;
}) {
  const color = /blocked|critical|urgent|exception|flagged|^hold$/i.test(value)
    ? "border-rose-500/15 bg-rose-500/10 text-rose-600 dark:text-rose-400"
    : /review|draft|high|pending|delayed|medium/i.test(value)
      ? "border-amber-500/15 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      : /done|active|ready|settled|shipped|approved|ordered|public/i.test(value)
        ? "border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : /private|customs/i.test(value)
          ? "border-violet-500/15 bg-violet-500/10 text-violet-700 dark:text-violet-400"
          : "border-border bg-muted/40 text-foreground";
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 rounded px-1.5 py-0 text-xs font-normal", color)}
    >
      {dot && <span className="size-1 rounded-full bg-current" />}
      {value}
    </Badge>
  );
}
export function StructurePerson({
  name,
  detail,
}: {
  name: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] text-muted-foreground">
        {name
          .split(" ")
          .map((s) => s[0])
          .join("")
          .slice(0, 2)}
      </span>
      <div>
        <span className="block text-sm">{name}</span>
        {detail && (
          <span className="block text-xs text-muted-foreground">{detail}</span>
        )}
      </div>
    </div>
  );
}
export function StructureMenu({
  label,
  items,
}: {
  label: string;
  items: { label: string; onClick: () => void; disabled?: boolean }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={label}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {items.map((i) => (
            <DropdownMenuItem
              key={i.label}
              disabled={i.disabled}
              onSelect={i.onClick}
            >
              {i.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function StructureMeter({ value }: { value: number }) {
  return (
    <div className="flex min-w-32 items-center gap-3">
      <span className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-5 rounded-full",
              i < Math.round(value / 20)
                ? value >= 80
                  ? "bg-emerald-500"
                  : value < 50
                    ? "bg-rose-500"
                    : "bg-amber-500"
                : "bg-muted",
            )}
          />
        ))}
      </span>
      <span className="text-xs tabular-nums">{value}%</span>
    </div>
  );
}
export function SavedState({
  dirty,
  invalid,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  invalid?: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3">
      <span
        role="status"
        className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          invalid && "text-destructive",
        )}
      >
        <Check className={cn("size-3.5", !dirty && "text-emerald-500")} />
        {invalid
          ? "Fix invalid cells before saving"
          : dirty
            ? "You have unsaved changes"
            : "All changes saved"}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!dirty}
          onClick={onDiscard}
        >
          Discard
        </Button>
        <Button size="sm" disabled={!dirty || invalid} onClick={onSave}>
          Save changes
        </Button>
      </div>
    </footer>
  );
}
