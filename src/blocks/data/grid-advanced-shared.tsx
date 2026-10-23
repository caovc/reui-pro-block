import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ArrowDownToLine,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  Columns3,
  Copy,
  Ellipsis,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import {
  useState,
  type ClipboardEventHandler,
  type KeyboardEventHandler,
  type ReactNode,
} from "react";
import { downloadCsv } from "./data-utils";
import { demoAvatar } from "@/lib/demo-artwork";
export {
  ArrowUpDown,
  Badge,
  Button,
  Checkbox,
  ChevronDown,
  ChevronRight,
  Input,
  Plus,
  Search,
  SlidersHorizontal,
};
export function GridFrame({
  title,
  description,
  children,
  actions,
  summary,
  className,
  onKeyDown,
  onPaste,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  summary?: ReactNode;
  className?: string;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  onPaste?: ClipboardEventHandler<HTMLElement>;
}) {
  return (
    <Frame
      dense
      variant="ghost"
      role="region"
      aria-label={title}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      className={cn(
        "mx-auto w-full min-w-0 max-w-[1216px] overflow-hidden rounded-xl border bg-background text-sm text-foreground shadow-xs",
        className,
      )}
    >
      <FramePanel className="overflow-hidden border-0 rounded-none p-0 shadow-none">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-4 py-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {summary}
            {actions}
          </div>
        </header>
        {children}
      </FramePanel>
    </Frame>
  );
}
export function GridSearch({
  value,
  onChange,
  placeholder = "Search...",
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-80">
      <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
      <Input
        aria-label={label || placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-8 text-sm"
      />
    </div>
  );
}
export function Choice({
  value,
  onChange,
  options,
  label,
  className,
  labels,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
  className?: string;
  labels?: Record<string, string>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={cn("h-8 min-w-24 text-sm", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem value={o} key={o} className="text-sm">
            {labels?.[o] ?? o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function GridTabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: (string | { name: string; count: number })[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b px-3" role="tablist">
      {items.map((item) => {
        const name = typeof item === "string" ? item : item.name;
        return (
          <button
            key={name}
            role="tab"
            aria-selected={value === name}
            onClick={() => onChange(name)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 py-2.5 text-sm",
              value === name
                ? "border-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {name}
            {typeof item !== "string" && (
              <span className="rounded bg-muted px-1 text-xs">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
export function TableOptions({
  columns,
  hidden,
  setHidden,
  density,
  setDensity,
  label = "Display",
}: {
  columns: string[];
  hidden: string[];
  setHidden: (v: string[]) => void;
  density?: boolean;
  setDensity?: (v: boolean) => void;
  label?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-sm">
          <Columns3 />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {columns.map((c) => (
            <DropdownMenuCheckboxItem
              key={c}
              checked={!hidden.includes(c)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(v) => setHidden(v ? hidden.filter((x) => x !== c) : [...hidden, c])}
            >
              {c}
            </DropdownMenuCheckboxItem>
          ))}
          {setDensity && (
            <DropdownMenuCheckboxItem checked={density} onCheckedChange={(v) => setDensity(v)}>
              Compact rows
            </DropdownMenuCheckboxItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function ExportRows({ name, rows }: { name: string; rows: Record<string, unknown>[] }) {
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 text-sm"
      onClick={() => downloadCsv(name, rows)}
    >
      <ArrowDownToLine />
      Export
    </Button>
  );
}
export function RowMenu({
  name,
  onDelete,
  onDuplicate,
  onEdit,
}: {
  name: string;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={`Actions for ${name}`} variant="ghost" size="icon-xs">
          <Ellipsis className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {onEdit && <DropdownMenuItem onSelect={onEdit}>Edit details</DropdownMenuItem>}
          {onDuplicate && (
            <DropdownMenuItem onSelect={onDuplicate}>
              <Copy />
              Duplicate
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 />
              Remove
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function AddRecord({
  label,
  title,
  fields,
  onSave,
}: {
  label: string;
  title: string;
  fields: { name: string; label: string; type?: string; value?: string }[];
  onSave: (values: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" className="h-8 text-sm" onClick={() => setOpen(true)}>
        <Plus />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Enter the details to add a record to this preview.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const values = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<
                string,
                string
              >;
              onSave(values);
              setOpen(false);
            }}
            className="space-y-4"
          >
            {fields.map((f) => (
              <label key={f.name} className="block space-y-1.5 text-sm">
                <span>{f.label}</span>
                <Input required name={f.name} type={f.type || "text"} defaultValue={f.value} />
              </label>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function DotBadge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "good" | "warn" | "bad" | "violet" | "muted" | "blue";
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm border-transparent px-1.5 py-0.5 text-xs font-normal",
        tone === "good"
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : tone === "warn"
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            : tone === "bad"
              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
              : tone === "violet"
                ? "bg-violet-500/10 text-violet-700 dark:text-violet-400"
                : tone === "blue"
                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </Badge>
  );
}
export function Meter({
  value,
  color = "bg-emerald-500",
  label,
}: {
  value: number;
  color?: string;
  label?: string;
}) {
  return (
    <div className="min-w-16">
      <div className="mb-1 flex justify-between gap-2 text-xs">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
export function Spark({
  seed = 1,
  color = "#4082ff",
  secondary = false,
}: {
  seed?: number;
  color?: string;
  secondary?: boolean;
}) {
  const vals = Array.from(
    { length: 32 },
    (_, i) => 14 + Math.sin(i * 1.6 + seed) * 3 + Math.cos(i * 0.5 + seed) * 5 - i * 0.12,
  );
  const path = vals.map((v, i) => `${i === 0 ? "M" : "L"}${i * 4},${v}`).join(" ");
  return (
    <svg viewBox="0 0 124 32" className="h-7 w-32" role="img" aria-label="Revenue trend">
      <path d={`${path} L124 30 L0 30 Z`} fill={color} opacity=".08" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
      {secondary && (
        <path
          d={vals.map((v, i) => `${i === 0 ? "M" : "L"}${i * 4},${v * 0.6 + 9}`).join(" ")}
          fill="none"
          stroke="#b3a0fa"
          strokeWidth="1.25"
        />
      )}
    </svg>
  );
}
export function Ring({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg viewBox="0 0 24 24" className="size-4 -rotate-90">
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke={value > 70 ? "#10b981" : value > 30 ? "#f59e0b" : "#fb7185"}
          strokeWidth="2"
          strokeDasharray={`${value * 0.565} 56.5`}
        />
      </svg>
      <span className="text-[13px]">{value}%</span>
    </span>
  );
}
export function TinyAvatar({
  name,
  color = "bg-blue-100 text-blue-700",
  photo = true,
}: {
  name: string;
  color?: string;
  photo?: boolean;
}) {
  return (
    <span
      aria-label={name}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
        color,
      )}
    >
      {photo ? (
        <img alt="" className="size-full rounded-full object-cover" src={demoAvatar(name)} />
      ) : (
        name
          .split(" ")
          .map((x) => x[0])
          .slice(0, 2)
          .join("")
      )}
    </span>
  );
}
export function CheckCell({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={checked}
      onClick={onChange}
      className={cn(
        "rounded p-1",
        checked ? "text-emerald-500" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {checked ? (
        <Check className="size-3.5" />
      ) : (
        <span className="block size-3 rounded-full border border-dashed" />
      )}
    </button>
  );
}

export function NumericField({
  value,
  onValueChange,
  label,
  min,
  max,
  step = 1,
  className,
}: {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <NumberField
      value={value}
      onValueChange={(v) => {
        if (v !== null) onValueChange(v);
      }}
      min={min}
      max={max}
      step={step}
      size="sm"
      className={className}
    >
      <NumberFieldGroup className="h-7">
        <NumberFieldInput aria-label={label} className="text-[13px] text-blue-500" />
      </NumberFieldGroup>
    </NumberField>
  );
}
