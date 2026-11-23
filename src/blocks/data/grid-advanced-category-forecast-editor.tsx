import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  FORECAST_DEPARTMENTS,
  allocateForecastYear,
  type ForecastDepartment,
  type ForecastLine,
} from "./grid-advanced-category-forecast-model";
import { ReviewField, ReviewFields, ReviewNumber, ReviewSelect } from "./grid-advanced-review-ui";

export function ForecastLineEditor({
  initial,
  existing,
  onSave,
  onCancel,
}: {
  initial: ForecastLine;
  existing: boolean;
  onSave: (line: ForecastLine) => string | null;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [priorYear, setPriorYear] = useState<number | null>(
    initial.priorYearCents.reduce((sum, value) => sum + value, 0) / 100,
  );
  const [plan, setPlan] = useState<number | null>(
    initial.planCents.reduce((sum, value) => sum + value, 0) / 100,
  );
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="review-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (priorYear === null || plan === null) {
          setError("Enter both the prior year's sales and the annual plan.");
          return;
        }
        setError(
          onSave({
            ...draft,
            priorYearCents: allocateForecastYear(
              Math.round(priorYear * 100),
              initial.priorYearCents,
            ),
            planCents: allocateForecastYear(Math.round(plan * 100), initial.planCents),
          }),
        );
      }}
    >
      <ReviewFields>
        <ReviewField label="Product line">
          {(id) => (
            <Input
              id={id}
              autoFocus
              required
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          )}
        </ReviewField>
        <ReviewField label="Planning owner">
          {(id) => (
            <Input
              id={id}
              required
              value={draft.owner}
              onChange={(event) => setDraft({ ...draft, owner: event.target.value })}
            />
          )}
        </ReviewField>
        <ReviewField label="Department">
          {(id) => (
            <ReviewSelect
              id={id}
              label="Department"
              value={draft.department}
              options={FORECAST_DEPARTMENTS}
              onChange={(department) =>
                setDraft({ ...draft, department: department as ForecastDepartment })
              }
            />
          )}
        </ReviewField>
        <ReviewField label="2025 sales (USD)">
          {(id) => (
            <ReviewNumber
              id={id}
              label="2025 sales (USD)"
              value={priorYear}
              onChange={setPriorYear}
              step={0.01}
              currency="USD"
            />
          )}
        </ReviewField>
        <ReviewField label="2026 plan (USD)">
          {(id) => (
            <ReviewNumber
              id={id}
              label="2026 plan (USD)"
              value={plan}
              onChange={setPlan}
              step={0.01}
              currency="USD"
            />
          )}
        </ReviewField>
      </ReviewFields>
      <p className="review-muted review-editor-hint">
        Existing monthly seasonality is preserved. New lines start with an even monthly allocation.
      </p>
      {error && (
        <p className="review-error" role="alert">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{existing ? "Save product line" : "Add product line"}</Button>
      </DialogFooter>
    </form>
  );
}
