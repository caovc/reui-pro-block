import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Download, Ellipsis, Filter, Pin, Search, Trash2, X } from "lucide-react";
import {
  Frame as ReuiFrame,
  FramePanel,
  FrameHeader,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Filters,
  FilterValuePopover,
  createFilterQuery,
  createFilterRule,
  flattenFilterRules,
  type FilterField,
} from "@/components/reui/filters/filters";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { demoAvatar } from "@/lib/demo-artwork";
import { gridBrandAssets } from "./grid-base-assets";
export function Frame({
  title,
  description,
  action,
  children,
  plain = false,
  count,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  plain?: boolean;
  count?: number;
  eyebrow?: string;
}) {
  return (
    <ReuiFrame
      aria-label={`${title} data grid`}
      spacing="sm"
      variant={plain ? "ghost" : "default"}
      className={cn(
        "mx-auto w-full min-w-0 max-w-[1216px] text-sm",
        plain && "gap-0 bg-transparent p-0",
      )}
    >
      <FrameHeader
        className={cn(
          "flex-row flex-wrap items-center justify-between gap-3 px-3 py-2",
          plain && "px-0 pb-4",
        )}
      >
        <div>
          {eyebrow && <FrameDescription className="mb-1 text-xs">{eyebrow}</FrameDescription>}
          <FrameTitle>
            <h2 className={cn("font-semibold", plain && "text-lg")}>
              {title}
              {count !== undefined && (
                <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full border px-1 align-middle text-[10px] font-normal">
                  {count}
                </span>
              )}
            </h2>
          </FrameTitle>
          {description && (
            <FrameDescription className="mt-0.5 text-xs">{description}</FrameDescription>
          )}
        </div>
        {action}
      </FrameHeader>
      <FramePanel
        className={cn(
          "min-w-0 p-0",
          plain && "rounded-none border-0 bg-transparent shadow-none before:hidden",
        )}
      >
        {children}
      </FramePanel>
    </ReuiFrame>
  );
}
export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 border-b px-3 py-2.5">{children}</div>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "Search...",
  label = "Search records",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div className="relative min-w-0 w-60 max-w-full">
      <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
      <Input
        aria-label={label}
        placeholder={placeholder}
        className="h-8 pl-8 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function BrandMark({ name }: { name: string }) {
  const slug = name.toLowerCase().replaceAll(" ", "");
  const src = gridBrandAssets[slug];
  return src ? (
    <img alt="" src={src} className="size-4 shrink-0 object-contain" />
  ) : (
    <span className="flex size-4 shrink-0 items-center justify-center text-xs font-semibold">
      {name[0]}
    </span>
  );
}
export function Identity({
  name,
  detail,
  online,
  compact = false,
  photo = true,
}: {
  name: string;
  detail?: string;
  online?: boolean;
  compact?: boolean;
  photo?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground",
          compact ? "size-6 text-[9px]" : "size-8 text-[11px]",
        )}
      >
        {name
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")}
        {photo && (
          <img
            src={demoAvatar(name)}
            alt=""
            className="absolute inset-0 size-full rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        {online !== undefined && (
          <i
            className={cn(
              "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background",
              online ? "bg-emerald-500" : "bg-amber-400",
            )}
          />
        )}
      </span>
      <div className="min-w-0">
        <div className="font-medium">{name}</div>
        {detail && <div className="text-xs text-muted-foreground">{detail}</div>}
      </div>
    </div>
  );
}
export function Chip({ children, color }: { children: ReactNode; color?: string }) {
  const text = String(children);
  const tone =
    color ||
    (/Active|Won|Ready|Committed|Published|Client/.test(text)
      ? "green"
      : /Pending|Proposal|High|Expiring|In Progress|Invited/.test(text)
        ? "amber"
        : /Urgent|Blocked|Past due|Breached/.test(text)
          ? "red"
          : /Design|review|Evaluation|Enterprise|Admin|Development/.test(text)
            ? "violet"
            : /Fundamental/.test(text)
              ? "amber"
              : "gray");
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-1.5 py-0 text-[11px] font-normal",
        tone === "green" &&
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        tone === "amber" &&
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        tone === "red" && "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
        tone === "violet" &&
          "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
      )}
    >
      {children}
    </Badge>
  );
}
export function Meter({ value, color }: { value: number; color?: string }) {
  return (
    <div className="flex min-w-24 items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full",
            color || (value > 69 ? "bg-emerald-500" : value > 40 ? "bg-amber-500" : "bg-rose-500"),
          )}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">
        {value}%
      </span>
    </div>
  );
}
export function Ring({ value, size = 36 }: { value: number; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 36 36" className="-rotate-90">
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-muted"
        />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${value * 0.942} 94.2`}
          className={
            value > 75 ? "text-emerald-500" : value > 49 ? "text-amber-500" : "text-rose-500"
          }
        />
      </svg>
      {size >= 32 && <span className="absolute text-[9px] font-medium">{value}%</span>}
    </span>
  );
}
export function Facet({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const field = useMemo<FilterField<string[]>>(
    () => ({
      id: "value",
      label,
      type: "select",
      options: options.map((option) => ({ value: option, label: option })),
    }),
    [label, options],
  );
  const rule = useMemo(
    () =>
      createFilterRule<string[]>({ id: "facet", path: ["value"], operator: "is_any_of", value }),
    [value],
  );
  const query = useMemo(() => createFilterQuery([rule]), [rule]);
  return (
    <Filters
      fields={[field]}
      query={query}
      onQueryChange={(next) => onChange(flattenFilterRules(next)[0]?.value ?? [])}
    >
      <FilterValuePopover
        field={field}
        rule={rule}
        operator={{ value: "is_any_of", label: "is any of", arity: "many" }}
        trigger={
          <Button size="sm" variant="outline">
            <Filter className="size-3.5" />
            {label}
            {value.length > 0 && (
              <Badge variant="secondary" className="px-1.5 text-[10px]">
                {value.length}
              </Badge>
            )}
            <ChevronDown className="size-3" />
          </Button>
        }
      />
    </Filters>
  );
}
export function RowMenu({
  name,
  onDelete,
  onPin,
  onView,
}: {
  name: string;
  onDelete: () => void;
  onPin?: () => void;
  onView?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-xs" variant="ghost" aria-label={`Actions for ${name}`}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {onView && <DropdownMenuItem onSelect={onView}>View details</DropdownMenuItem>}
          {onPin && (
            <DropdownMenuItem onSelect={onPin}>
              <Pin />
              Pin / unpin row
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function CreateDialog({
  open,
  onOpenChange,
  title,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setName("");
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Add a record to this preview.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) {
              onCreate(name.trim());
              setName("");
              onOpenChange(false);
            }
          }}
        >
          <label className="grid gap-2 text-sm">
            Name
            <Input
              aria-label="Record name"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function ClearFilters({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="ghost" onClick={onClick}>
      <X className="size-3" />
      Clear
    </Button>
  );
}
export function Export({ rows, name = "records" }: { rows: object[]; name?: string }) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        const keys = Object.keys(rows[0] || {});
        const csv = [
          keys.join(","),
          ...rows.map((row) =>
            keys
              .map(
                (k) =>
                  `"${String((row as Record<string, unknown>)[k] ?? "").replaceAll('"', '""')}"`,
              )
              .join(","),
          ),
        ].join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Download />
      Export review
    </Button>
  );
}
export function TabsBar({
  tabs,
  value,
  onChange,
  counts,
}: {
  tabs: string[];
  value: string;
  onChange: (v: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <Tabs value={value} onValueChange={onChange} className="gap-0">
      <TabsList
        variant="line"
        className="h-auto max-w-full justify-start gap-5 overflow-x-auto rounded-none border-b px-3 py-0"
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="h-10 flex-none px-0 text-sm font-normal">
            {tab}
            {counts?.[tab] !== undefined && (
              <span
                aria-hidden="true"
                className="ml-1 rounded-md bg-muted px-1.5 text-xs text-muted-foreground"
              >
                {counts[tab]}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
