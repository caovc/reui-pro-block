import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STORE_MANAGERS, STORE_MARKETS } from "./grid-advanced-store-kpi-data";
import {
  parseAnnualGoal,
  STORE_FORMATS,
  type StoreFormat,
  type StoreRecord,
  type StoreStatus,
} from "./grid-advanced-store-kpi-model";

export function StorePicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StoreForm({
  original,
  initialMarket,
  initialFormat,
  onCancel,
  onSave,
  onReturnFocus,
}: {
  original: StoreRecord | null;
  initialMarket?: string;
  initialFormat?: StoreFormat;
  onCancel: () => void;
  onSave: (record: StoreRecord) => void;
  onReturnFocus: () => void;
}) {
  const id = useId();
  const [name, setName] = useState(original?.name ?? "");
  const [market, setMarket] = useState(original?.market ?? initialMarket ?? "US");
  const [format, setFormat] = useState<StoreFormat>(
    original?.format ?? initialFormat ?? "Standard",
  );
  const [status, setStatus] = useState<StoreStatus>(original?.status ?? "Pre-opening");
  const [manager, setManager] = useState(original?.manager ?? STORE_MANAGERS[0]);
  const [goal, setGoal] = useState(
    original?.annualGoalCents ? String(original.annualGoalCents / 100) : "",
  );
  const [errors, setErrors] = useState<{ name?: string; goal?: string }>({});
  const nameInput = useRef<HTMLInputElement>(null);
  const goalInput = useRef<HTMLInputElement>(null);
  const selectedMarket = STORE_MARKETS.find((entry) => entry.code === market)!;
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className="max-w-md"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onReturnFocus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{original ? "Edit Store" : "New Store"}</DialogTitle>
          <DialogDescription>
            {original ? original.id : "No sales until the doors open."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = parseAnnualGoal(goal);
            const nextErrors = {
              name: name.trim() ? undefined : "Name the store.",
              goal: parsed.error,
            };
            setErrors(nextErrors);
            if (nextErrors.name || nextErrors.goal) {
              (nextErrors.name ? nameInput : goalInput).current?.focus();
              return;
            }
            onSave({
              id: original?.id ?? "bricklane-store-" + crypto.randomUUID(),
              name: name.trim(),
              market,
              marketName: selectedMarket.name,
              region: selectedMarket.region,
              format,
              status,
              manager,
              annualGoalCents: parsed.value,
              opened: original?.opened ?? null,
              facts: original?.facts ?? [],
            });
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor={id + "-name"}>Name</Label>
            <Input
              id={id + "-name"}
              ref={nameInput}
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? id + "-name-error" : undefined}
              placeholder="Harbor Arcade"
            />
            {errors.name && (
              <p role="alert" id={id + "-name-error"} className="text-xs text-destructive">
                {errors.name}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Market</Label>
              <StorePicker
                label="Market"
                value={market}
                options={STORE_MARKETS.map((entry) => ({ value: entry.code, label: entry.name }))}
                onChange={setMarket}
              />
              <p className="text-xs text-muted-foreground">Reports in {selectedMarket.region}.</p>
            </div>
            <div className="grid content-start gap-1.5">
              <Label>Format</Label>
              <StorePicker
                label="Format"
                value={format}
                options={STORE_FORMATS.map((value) => ({ value, label: value }))}
                onChange={(value) => setFormat(value as StoreFormat)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <StorePicker
                label="Status"
                value={status}
                options={(original?.facts.length
                  ? ["Trading", "Refit"]
                  : ["Pre-opening", "Trading", "Refit"]
                ).map((value) => ({ value, label: value }))}
                onChange={(value) => setStatus(value as StoreStatus)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Manager</Label>
              <StorePicker
                label="Manager"
                value={manager}
                options={STORE_MANAGERS.map((value) => ({ value, label: value }))}
                onChange={setManager}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={id + "-goal"}>FY26 Sales Goal</Label>
            <div className="flex items-center rounded-md border pl-3">
              <span aria-hidden="true">$</span>
              <Input
                id={id + "-goal"}
                ref={goalInput}
                inputMode="numeric"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="border-0 shadow-none"
                placeholder="3200000"
                aria-invalid={Boolean(errors.goal)}
                aria-describedby={id + "-goal-help" + (errors.goal ? " " + id + "-goal-error" : "")}
              />
            </div>
            <p id={id + "-goal-help"} className="text-xs text-muted-foreground">
              Net sales for Nov to Oct; pace follows the seasonal mix.
            </p>
            {errors.goal && (
              <p role="alert" id={id + "-goal-error"} className="text-xs text-destructive">
                {errors.goal}
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            {!goal && <span className="mr-auto text-xs text-muted-foreground">No goal yet</span>}
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{original ? "Save Changes" : "Create Store"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
