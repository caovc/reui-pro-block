import type { ReactNode } from "react";
import { ArrowDownToLine, ArrowUpRight, Ellipsis, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { downloadCsv } from "./data-utils";

export function Person({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className={small ? "size-6" : "size-8"}>
        <AvatarFallback className="text-[10px]">
          {name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{name}</span>
    </div>
  );
}
export function Status({ value }: { value: string }) {
  const good = /active|paid|complete|healthy|approved|success|ready|online|published/i.test(value);
  return (
    <Badge variant={good ? "secondary" : "outline"} className="gap-1.5 font-normal">
      <span
        className={`size-1.5 rounded-full ${good ? "bg-emerald-500" : /fail|overdue|critical|blocked/i.test(value) ? "bg-rose-500" : "bg-amber-500"}`}
      />
      {value}
    </Badge>
  );
}
export function BlockHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
export function Metric({
  title,
  value,
  change,
  children,
}: {
  title: string;
  value: string;
  change?: string;
  children?: ReactNode;
}) {
  return (
    <Card className="gap-3 py-4 shadow-none">
      <CardHeader className="gap-1 px-4">
        <CardDescription className="text-xs">{title}</CardDescription>
        <CardTitle className="flex items-center justify-between text-2xl font-semibold tracking-tight">
          {value}
          {change && (
            <Badge variant="secondary" className="gap-1 font-normal">
              <ArrowUpRight className="size-3" />
              {change}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      {children && <CardContent className="px-4">{children}</CardContent>}
    </Card>
  );
}
export function AddButton({ label = "Add new", onClick }: { label?: string; onClick: () => void }) {
  return (
    <Button size="sm" onClick={onClick}>
      <Plus data-icon="inline-start" />
      {label}
    </Button>
  );
}
export function ExportButton({ title, rows }: { title: string; rows: Record<string, unknown>[] }) {
  return (
    <Button variant="outline" size="sm" onClick={() => downloadCsv(title, rows)}>
      <ArrowDownToLine data-icon="inline-start" />
      Export
    </Button>
  );
}
export function MoreButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="icon" variant="ghost" aria-label="More actions" onClick={onClick}>
      <Ellipsis />
    </Button>
  );
}
