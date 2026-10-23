import { SlidersHorizontal, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filters,
  flattenFilterRules,
  type FilterQuery as ReuiFilterQuery,
} from "@/components/reui/filters/filters";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import type { ReactTable } from "@tanstack/react-table";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { cn } from "@/lib/utils";

export type FilterField = {
  key: string;
  label: string;
  type?: "text" | "select" | "tags" | "number" | "date";
  options?: string[];
};
export type FilterRule = {
  id: number | string;
  field: string;
  operator: string;
  values: string[];
  negated?: boolean;
};
export const firstRule = (field: string): FilterRule => ({
  id: 1,
  field,
  operator: "contains",
  values: [],
});
const operators = (field: FilterField) =>
  field.type === "number" || field.type === "date"
    ? ["is", "is not", "greater than", "less than", "between"]
    : field.type === "tags"
      ? ["is any of", "is all of", "is none of"]
      : field.type === "select"
        ? ["is", "is not", "is any of", "is none of"]
        : [
            "contains",
            "does not contain",
            "is",
            "is not",
            "starts with",
            "ends with",
            "is empty",
            "is not empty",
          ];
export function matchesRules(record: Record<string, unknown>, rules: FilterRule[]) {
  return rules.every((rule) => {
    const result = (() => {
      const raw = record[rule.field];
      const items = (Array.isArray(raw) ? raw : [raw]).map((x) => String(x ?? "").toLowerCase());
      const values = rule.values.map((v) => v.toLowerCase()).filter((v) => v !== "");
      if (rule.operator === "is empty") return items.every((x) => !x);
      if (rule.operator === "is not empty") return items.some(Boolean);
      if (!values.length) return true;
      const value = values[0];
      const content = items.join(" ");
      switch (rule.operator) {
        case "contains":
          return content.includes(value);
        case "does not contain":
          return !content.includes(value);
        case "starts with":
          return content.startsWith(value);
        case "ends with":
          return content.endsWith(value);
        case "is":
          return values.some((v) => items.includes(v));
        case "is not":
        case "is none of":
          return values.every((v) => !items.includes(v));
        case "is any of":
          return values.some((v) => items.includes(v));
        case "is all of":
          return values.every((v) => items.includes(v));
        case "greater than":
          return Number.isFinite(Number(raw)) ? Number(raw) > Number(value) : String(raw) > value;
        case "less than":
          return Number.isFinite(Number(raw)) ? Number(raw) < Number(value) : String(raw) < value;
        case "between":
          return (
            values.length < 2 ||
            (Number.isFinite(Number(raw))
              ? Number(raw) >= Number(values[0]) && Number(raw) <= Number(values[1])
              : String(raw) >= values[0] && String(raw) <= values[1])
          );
        default:
          return true;
      }
    })();
    return rule.negated ? !result : result;
  });
}
/** Adapter for block-specific field names; all picker, condition, value, chip
 * menu, keyboard and focus behavior is the official free ReUI Filters. */
export function FilterBar({
  fields,
  rules,
  onChange,
  clearLabel = "Clear",
  children,
  className,
}: {
  fields: FilterField[];
  rules: FilterRule[];
  onChange: (rules: FilterRule[]) => void;
  clearLabel?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const schema = fields.map((field) => ({
    id: field.key,
    label: field.label,
    type:
      field.type === "tags"
        ? ("multiselect" as const)
        : field.type === "number"
          ? ("number" as const)
          : field.type === "select"
            ? ("select" as const)
            : ("text" as const),
    options: field.options?.map((value) => ({ value, label: value })),
    operators: operators(field).map((value) => ({
      value,
      label: value,
      arity: value.includes("empty")
        ? ("none" as const)
        : value === "between"
          ? ("range" as const)
          : value.includes(" of")
            ? ("many" as const)
            : ("one" as const),
    })),
  }));
  const query: ReuiFilterQuery = {
    id: "root",
    type: "group",
    combinator: "and",
    rules: rules.map((rule) => ({
      id: String(rule.id),
      type: "rule",
      path: [rule.field],
      operator: rule.operator,
      value:
        rule.operator.includes(" of") || rule.operator === "between" ? rule.values : rule.values[0],
      negated: rule.negated,
    })),
  };
  return (
    <div className={cn("flex flex-wrap items-center gap-2 px-3 py-2", className)}>
      <Filters
        fields={schema}
        query={query}
        onQueryChange={(next) =>
          onChange(
            flattenFilterRules(next).map((rule) => ({
              id: rule.id,
              field: rule.path[0],
              operator: rule.operator,
              values:
                rule.value === undefined
                  ? []
                  : (Array.isArray(rule.value) ? rule.value : [rule.value]).map(String),
              negated: rule.negated,
            })),
          )
        }
        size="default"
        showClear={!!clearLabel}
        labels={{ clear: clearLabel }}
        className="min-w-0 flex-1"
        trigger={
          <Button variant="outline" className="h-8 font-normal">
            <ListFilter />
            Add filter
          </Button>
        }
      />
      {children}
    </div>
  );
}
export function FilteringSettings<T extends object>({
  table,
  onHidden,
  compact,
  onCompact,
  resizable,
  onResizable,
  movable,
  onMovable,
}: {
  table: ReactTable<DataGridFeatures, T>;
  columns: string[];
  hidden: string[];
  onHidden: (v: string[]) => void;
  compact: boolean;
  onCompact: (v: boolean) => void;
  resizable?: boolean;
  onResizable?: (v: boolean) => void;
  movable?: boolean;
  onMovable?: (v: boolean) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="ml-auto h-8 font-normal">
          <SlidersHorizontal />
          Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-4">
        <h3 className="font-medium">Table</h3>
        <div className="flex items-center justify-between gap-3 py-2">
          <span>Density</span>
          <Select
            value={compact ? "compact" : "comfortable"}
            onValueChange={(v) => onCompact(v === "compact")}
          >
            <SelectTrigger aria-label="Density" className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">compact</SelectItem>
              <SelectItem value="comfortable">comfortable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {onResizable && (
          <label className="flex items-center justify-between py-1">
            Resizable columns
            <Switch
              size="sm"
              aria-label="Resizable columns"
              checked={resizable}
              onCheckedChange={onResizable}
            />
          </label>
        )}
        {onMovable && (
          <label className="flex items-center justify-between py-1">
            Movable columns
            <Switch
              size="sm"
              aria-label="Movable columns"
              checked={movable}
              onCheckedChange={onMovable}
            />
          </label>
        )}
        <div className="-mx-4 my-2 border-t" />
        <p className="text-xs text-muted-foreground">Columns</p>
        <DataGridColumnVisibility
          table={table}
          trigger={
            <Button variant="outline" size="sm">
              Display columns
            </Button>
          }
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            table.resetColumnVisibility();
            table.resetColumnOrder();
            table.resetColumnSizing();
            onHidden([]);
            onCompact(true);
            onResizable?.(true);
            onMovable?.(true);
          }}
        >
          Reset view
        </Button>
      </PopoverContent>
    </Popover>
  );
}
