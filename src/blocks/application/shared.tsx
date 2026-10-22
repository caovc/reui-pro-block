import { useState } from "react";
import {
  Check,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Search,
  ArrowUpRight,
  Command,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import type { BlockMeta } from "@/data/types";
export const people = [
  "Olivia Rhye",
  "Phoenix Baker",
  "Lana Steiner",
  "Demi Wilkinson",
  "Drew Cano",
  "Natali Craig",
];
export function Person({
  name = "Olivia Rhye",
  sub,
  compact = false,
}: {
  name?: string;
  sub?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar className={compact ? "size-7" : "size-9"}>
        <AvatarFallback>
          {name
            .split(" ")
            .map((v) => v[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{name}</div>
        {sub && (
          <div className="truncate text-xs text-muted-foreground">{sub}</div>
        )}
      </div>
    </div>
  );
}
export function Team() {
  return (
    <div className="flex [&>*+*]:-ml-2">
      {people.slice(0, 4).map((p) => (
        <Avatar key={p} className="size-7 border-2 border-background">
          <AvatarFallback className="text-[10px]">
            {p
              .split(" ")
              .map((v) => v[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
export function More() {
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label="More options"
      onClick={() =>
        toast("Options", {
          description: "This item is up to date. No pending actions.",
        })
      }
    >
      <MoreHorizontal />
    </Button>
  );
}
export function Head({
  title,
  description,
  action = "Add new",
  onAction,
}: {
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Button
          size="sm"
          onClick={
            onAction ??
            (() =>
              toast(`${action} is ready`, {
                description: "Your demo workspace has been updated.",
              }))
          }
        >
          <Plus data-icon="inline-start" />
          {action}
        </Button>
      )}
    </div>
  );
}
export function Metric({
  title,
  value,
  change = "12.8%",
  index = 0,
}: {
  title: string;
  value: string;
  change?: string;
  index?: number;
}) {
  return (
    <Card className="gap-3 py-4 shadow-none">
      <CardHeader className="gap-1 px-4">
        <CardDescription className="flex items-center justify-between">
          {title}
          <ArrowUpRight className="size-3.5" />
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex items-end justify-between gap-5">
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground">↗ {change}</span> vs last month
          </p>
          <Spark index={index} />
        </div>
      </CardContent>
    </Card>
  );
}
export function Spark({ index = 0 }: { index?: number }) {
  const values = [21, 17, 29, 23, 35, 26, 40, 35, 44, 29, 52, 47, 61, 55, 70];
  return (
    <svg
      viewBox="0 0 100 40"
      className="h-8 w-24 text-primary"
      aria-label="Trend chart"
    >
      <path
        d={values
          .map(
            (v, i) =>
              `${i ? "L" : "M"}${i * 7},${40 - ((v + (index % 3) * 8) % 70) / 2}`,
          )
          .join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
      <Input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
export function SmallTabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/60 p-1">
      {items.map((v) => (
        <Button
          key={v}
          variant={value === v ? "outline" : "ghost"}
          size="sm"
          onClick={() => onChange(v)}
        >
          {v}
        </Button>
      ))}
    </div>
  );
}
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
        <Command className="size-4" />
      </span>
      {!small && "Acme"}
    </div>
  );
}
export function NewItem({
  label = "Create project",
  onCreate,
}: {
  label?: string;
  onCreate?: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus data-icon="inline-start" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            Add a new item to your workspace.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate?.(name);
            toast.success(`${name} created`);
            setOpen(false);
            setName("");
          }}
          className="flex flex-col gap-5"
        >
          <Field>
            <FieldLabel htmlFor="new-item-name">Name</FieldLabel>
            <Input
              id="new-item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name"
              required
            />
          </Field>
          <Button type="submit">
            <Check data-icon="inline-start" />
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function sectionTitle(block: BlockMeta) {
  return block.name.replace(/ Tiles| Cards| Modal| Sheet| Wizard/, "");
}
export function Status({ children }: { children: string }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </Badge>
  );
}
export {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChevronDown,
  Plus,
  Search,
  X,
  toast,
};
