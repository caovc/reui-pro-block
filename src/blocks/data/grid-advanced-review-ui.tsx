/* eslint-disable react/only-export-components */
import { useCallback, useId, useState, type ReactNode } from "react";
import { Download, Search, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";

export function reviewMoney(cents: number | null, currency = "USD", compact = false): string {
  return cents === null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        notation: compact ? "compact" : "standard",
        maximumFractionDigits: compact ? 1 : 0,
      }).format(cents / 100);
}

export function reviewPercent(value: number | null, digits = 1): string {
  return value === null ? "—" : `${value.toFixed(digits)}%`;
}

export function useReviewHistory<T>(create: () => T) {
  const [history, setHistory] = useState(() => ({ present: create(), past: [] as T[] }));
  const commit = useCallback((update: (value: T) => T) => {
    setHistory((current) => {
      const present = update(current.present);
      return present === current.present
        ? current
        : { present, past: [...current.past.slice(-29), current.present] };
    });
  }, []);
  const undo = useCallback(() => {
    setHistory((current) => {
      const present = current.past.at(-1);
      return present === undefined ? current : { present, past: current.past.slice(0, -1) };
    });
  }, []);
  return { value: history.present, commit, undo, canUndo: history.past.length > 0 };
}

export function ReviewSearch({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <InputGroup className="min-w-0 w-full sm:w-64">
      <InputGroupAddon>
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </InputGroup>
  );
}

export function ReviewSelect({
  label,
  value,
  onChange,
  options,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (string | { value: string; label: string })[];
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="reui-reference">
        <SelectGroup>
          {options.map((item) => {
            const option = typeof item === "string" ? { value: item, label: item } : item;
            return (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function ReviewNumber({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 1000000000,
  step = 1,
  currency,
}: {
  id?: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  currency?: string;
}) {
  return (
    <NumberField
      id={id}
      value={value}
      onValueChange={onChange}
      min={min}
      max={max}
      step={step}
      format={currency ? { style: "currency", currency, maximumFractionDigits: 2 } : undefined}
    >
      <NumberFieldGroup>
        <NumberFieldInput aria-label={label} />
      </NumberFieldGroup>
    </NumberField>
  );
}

export function ReviewField({
  label,
  children,
}: {
  label: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children(id)}
    </Field>
  );
}

export function ReviewFields({ children }: { children: ReactNode }) {
  return <FieldGroup className="review-editor-fields">{children}</FieldGroup>;
}

export function ReviewSummary({ values }: { values: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="review-summary" aria-live="polite">
      {values.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ReviewActions({
  canUndo,
  onUndo,
  onExport,
  exportDisabled = false,
  children,
}: {
  canUndo: boolean;
  onUndo: () => void;
  onExport: () => void;
  exportDisabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="review-actions">
      <Button variant="outline" size="sm" disabled={!canUndo} onClick={onUndo}>
        <Undo2 aria-hidden="true" />
        Undo
      </Button>
      <Button variant="outline" size="sm" disabled={exportDisabled} onClick={onExport}>
        <Download aria-hidden="true" />
        Export
      </Button>
      {children}
    </div>
  );
}

/** CSV escaping includes spreadsheet formula neutralization for user-entered names. */
export function reviewCsv(filename: string, rows: Record<string, string | number | null>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const quote = (value: unknown) => {
    const text = String(value ?? "");
    const literal = typeof value === "string" && /^[\t\r\n =+@-]/.test(text) ? `'${text}` : text;
    return `"${literal.replaceAll('"', '""')}"`;
  };
  const text = [
    headers.map(quote).join(","),
    ...rows.map((row) => headers.map((key) => quote(row[key])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
