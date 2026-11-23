import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  QUALITY_AS_OF,
  QUALITY_DIVISIONS,
  QUALITY_TIERS,
  LOT_DISPOSITIONS,
  type InspectionLot,
  type LotDisposition,
  type QualityDivision,
  type QualitySupplier,
  type QualityTier,
} from "./grid-advanced-supplier-quality-model";
import { ReviewField, ReviewFields, ReviewNumber, ReviewSelect } from "./grid-advanced-review-ui";

export function SupplierEditor({
  initial,
  existing,
  onSave,
  onCancel,
}: {
  initial: QualitySupplier;
  existing: boolean;
  onSave: (supplier: QualitySupplier) => string | null;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [spend, setSpend] = useState<number | null>(initial.monthlySpendCents[11] / 100);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="review-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (spend === null || !Number.isFinite(spend)) {
          setError("Enter the supplier's November spend.");
          return;
        }
        setError(
          onSave({
            ...draft,
            monthlySpendCents: draft.monthlySpendCents.map((value, month) =>
              month === 11 ? Math.round(spend * 100) : value,
            ),
          }),
        );
      }}
    >
      <ReviewFields>
        <ReviewField label="Supplier name">
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
        <ReviewField label="Review owner">
          {(id) => (
            <Input
              id={id}
              required
              value={draft.owner}
              onChange={(event) => setDraft({ ...draft, owner: event.target.value })}
            />
          )}
        </ReviewField>
        <ReviewField label="Division">
          {(id) => (
            <ReviewSelect
              id={id}
              label="Division"
              value={draft.division}
              options={QUALITY_DIVISIONS}
              onChange={(value) => setDraft({ ...draft, division: value as QualityDivision })}
            />
          )}
        </ReviewField>
        <ReviewField label="Supplier tier">
          {(id) => (
            <ReviewSelect
              id={id}
              label="Supplier tier"
              value={draft.tier}
              options={QUALITY_TIERS}
              onChange={(value) => setDraft({ ...draft, tier: value as QualityTier })}
            />
          )}
        </ReviewField>
        <ReviewField label="November spend (USD)">
          {(id) => (
            <ReviewNumber
              id={id}
              label="November spend (USD)"
              value={spend}
              onChange={setSpend}
              step={0.01}
              currency="USD"
            />
          )}
        </ReviewField>
      </ReviewFields>
      {error && (
        <p className="review-error" role="alert">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{existing ? "Save supplier" : "Add supplier"}</Button>
      </DialogFooter>
    </form>
  );
}

export function InspectionEditor({
  initial,
  existing,
  onSave,
  onCancel,
}: {
  initial: InspectionLot;
  existing: boolean;
  onSave: (lot: InspectionLot) => string | null;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [score, setScore] = useState<number | null>(initial.score);
  const [units, setUnits] = useState<number | null>(initial.units);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="review-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (score === null || units === null) {
          setError("Enter both the inspection score and unit count.");
          return;
        }
        setError(onSave({ ...draft, score, units }));
      }}
    >
      <ReviewFields>
        <ReviewField label="Received date">
          {(id) => (
            <Input
              id={id}
              type="date"
              required
              max={QUALITY_AS_OF}
              value={draft.received}
              onChange={(event) => setDraft({ ...draft, received: event.target.value })}
            />
          )}
        </ReviewField>
        <ReviewField label="Disposition">
          {(id) => (
            <ReviewSelect
              id={id}
              label="Disposition"
              value={draft.disposition}
              options={LOT_DISPOSITIONS}
              onChange={(value) => setDraft({ ...draft, disposition: value as LotDisposition })}
            />
          )}
        </ReviewField>
        <ReviewField label="Quality score">
          {(id) => (
            <ReviewNumber
              id={id}
              label="Quality score"
              value={score}
              onChange={setScore}
              min={0}
              max={100}
              step={0.1}
            />
          )}
        </ReviewField>
        <ReviewField label="Inspected units">
          {(id) => (
            <ReviewNumber
              id={id}
              label="Inspected units"
              value={units}
              onChange={setUnits}
              min={0}
              max={1000000000}
            />
          )}
        </ReviewField>
        <ReviewField label="Inspection note">
          {(id) => (
            <Textarea
              id={id}
              value={draft.note}
              maxLength={1000}
              onChange={(event) => setDraft({ ...draft, note: event.target.value })}
            />
          )}
        </ReviewField>
      </ReviewFields>
      {error && (
        <p className="review-error" role="alert">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{existing ? "Save review" : "Add inspection"}</Button>
      </DialogFooter>
    </form>
  );
}
