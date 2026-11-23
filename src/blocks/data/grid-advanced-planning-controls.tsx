import { useId, useState } from "react";
import { AlertCircle, Search, X } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { FinanceSelect } from "./grid-advanced-finance-controls";
import { maxPlanningMoney, planningMonths } from "./grid-advanced-planning-common";

export function PlanningMonth({
  value,
  onChange,
}: {
  value: number;
  onChange: (month: number) => void;
}) {
  return (
    <FinanceSelect
      label="Planning month"
      value={String(value)}
      options={planningMonths.map((label, month) => ({
        label: `${label} 2026`,
        value: String(month),
      }))}
      onChange={(month) => onChange(Number(month))}
    />
  );
}

export function PlanningSearch({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (query: string) => void;
  label: string;
}) {
  return (
    <InputGroup className="min-w-0 sm:max-w-72">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </InputGroup>
  );
}

export function PlanningNumber({
  value,
  onCommit,
  onDraftChange,
  label,
  kind = "money",
  dense = false,
  max,
  nullable = false,
}: {
  value: number | null;
  onCommit: (next: number | null) => boolean | void;
  onDraftChange?: (next: number | null) => void;
  label: string;
  kind?: "money" | "count" | "percent";
  dense?: boolean;
  max?: number;
  nullable?: boolean;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const scale = kind === "count" ? 1 : 100;
  // This is an edit buffer, separate from committed domain state. Undo and
  // month selection replace it; native onValueCommitted owns the transaction.
  if (value !== previousValue) {
    setPreviousValue(value);
    setDraft(value);
  }
  const control = (
    <NumberField
      id={id}
      size="sm"
      value={draft === null ? null : draft / scale}
      min={0}
      max={
        max ?? (kind === "money" ? maxPlanningMoney / 100 : kind === "percent" ? 100 : 1_000_000)
      }
      step={kind === "count" ? 1 : 0.01}
      format={
        kind === "money"
          ? { style: "currency", currency: "USD", maximumFractionDigits: 2 }
          : { maximumFractionDigits: kind === "count" ? 0 : 2 }
      }
      onValueChange={(next) => {
        const amount = next === null ? null : Math.round(next * scale);
        setDraft(amount);
        onDraftChange?.(amount);
      }}
      onValueCommitted={(next) => {
        const amount = next === null ? (nullable ? null : 0) : Math.round(next * scale);
        if (amount === value) {
          setDraft(value);
          return;
        }
        if (onCommit(amount) === false) setDraft(value);
        else setDraft(amount);
      }}
    >
      <NumberFieldGroup>
        {!dense && <NumberFieldDecrement aria-label={`Decrease ${label}`} />}
        <NumberFieldInput aria-label={label} placeholder={nullable ? "Not reported" : "0"} />
        {!dense && <NumberFieldIncrement aria-label={`Increase ${label}`} />}
      </NumberFieldGroup>
    </NumberField>
  );
  return dense ? (
    <div className="w-32 max-w-full">{control}</div>
  ) : (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {control}
    </Field>
  );
}

export function PlanningProblem({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Change not saved</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <AlertAction>
        <Button variant="ghost" size="icon-sm" aria-label="Dismiss notice" onClick={onDismiss}>
          <X />
        </Button>
      </AlertAction>
    </Alert>
  );
}

export function PlanningSummary({
  items,
}: {
  items: { label: string; value: string; detail: string }[];
}) {
  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <CardDescription>{item.label}</CardDescription>
            <CardTitle>{item.value}</CardTitle>
          </CardHeader>
          <CardContent>{item.detail}</CardContent>
        </Card>
      ))}
    </div>
  );
}
