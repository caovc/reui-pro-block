import { useId, useRef, useState } from "react";
import { Alert, AlertAction, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FinanceSelect } from "./grid-advanced-finance-controls";
import { SalesMonthChart } from "./grid-advanced-sales-target-cells";
import { salesMoney } from "./grid-advanced-sales-target-view-model";
import {
  TARGET_FORMATS,
  TARGET_MONTHS,
  TARGET_REGIONS,
  type SalesTargetStore,
} from "./grid-advanced-sales-target-model";

const options = <T extends string>(values: readonly T[]) =>
  values.map((value) => ({ value, label: value }));

function SalesAmountField({
  label,
  value,
  empty,
  onChange,
}: {
  label: string;
  value: number;
  empty: boolean;
  onChange: (value: number | null) => void;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NumberField
        id={id}
        value={empty ? null : value / 100}
        min={0}
        max={1000000000}
        step={0.01}
        smallStep={0.01}
        largeStep={100}
        format={{
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }}
        onValueChange={(next) => onChange(next === null ? null : Math.round(next * 100))}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement aria-label={`Decrease ${label}`} />
          <NumberFieldInput aria-label={label} required />
          <NumberFieldIncrement aria-label={`Increase ${label}`} />
        </NumberFieldGroup>
      </NumberField>
    </Field>
  );
}

export function SalesTargetEditor({
  store,
  selectedMonth,
  adding,
  onSave,
  onClose,
  restoreFocus,
  notice,
}: {
  store: SalesTargetStore;
  selectedMonth: string;
  adding: boolean;
  onSave: (next: SalesTargetStore) => string | null;
  onClose: () => void;
  restoreFocus: () => void;
  notice: { message: string; onUndo: () => void } | null;
}) {
  const [draft, setDraft] = useState(store);
  const [dirty, setDirty] = useState(false);
  const [month, setMonth] = useState(selectedMonth);
  const [error, setError] = useState<string | null>(null);
  const [blank, setBlank] = useState<string[]>([]);
  const nameInput = useRef<HTMLInputElement>(null);
  const managerInput = useRef<HTMLInputElement>(null);
  const id = useId();
  const value = dirty ? draft : store;
  const fact = value.facts.find((item) => item.month === month)!;
  const update = (patch: Partial<SalesTargetStore>) => {
    setDraft({ ...value, ...patch });
    setDirty(true);
    setError(null);
  };
  const amount = (key: "actualCents" | "targetCents", next: number | null) => {
    setBlank((current) =>
      next === null
        ? [...new Set([...current, `${month}-${key}`])]
        : current.filter((item) => item !== `${month}-${key}`),
    );
    update({
      facts: value.facts.map((item) =>
        item.month === month ? { ...item, [key]: next ?? 0 } : item,
      ),
    });
  };
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className="st-editor w-full gap-0 sm:max-w-[520px]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
      >
        <SheetHeader className="border-b pr-14">
          <SheetTitle>{adding ? "Add store" : "Store sales"}</SheetTitle>
          <SheetDescription>
            {adding
              ? "Start a store with a complete monthly plan. Unfilled months start at zero."
              : "Edit the monthly actual and target, or update the store profile."}
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (!value.name.trim()) {
              setError("Enter a store name.");
              nameInput.current?.focus();
              return;
            }
            if (!value.manager.trim()) {
              setError("Enter a store manager.");
              managerInput.current?.focus();
              return;
            }
            if (blank.length) {
              setError("Enter both monthly amounts. Use zero when no target is set.");
              return;
            }
            const result = onSave(value);
            setError(result);
            if (!result) setDirty(false);
          }}
        >
          <div className="st-editor-body min-h-0 flex-1 overflow-y-auto p-4">
            {!adding && (
              <div className="st-profile-heading">
                <h2>{store.name}</h2>
                <Badge variant="outline">{store.format}</Badge>
              </div>
            )}
            {notice && !dirty && (
              <Alert variant="success">
                <AlertDescription>{notice.message}</AlertDescription>
                <AlertAction>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      notice.onUndo();
                      setDirty(false);
                      setBlank([]);
                    }}
                  >
                    Undo
                  </Button>
                </AlertAction>
              </Alert>
            )}
            <FieldGroup className="gap-4">
              <FinanceSelect
                field
                label="Reporting month"
                value={month}
                options={TARGET_MONTHS.map((item) => ({ value: item.key, label: item.label }))}
                onChange={setMonth}
                className="w-full"
              />
              <div className="st-editor-amounts">
                <SalesAmountField
                  label="Actual sales"
                  value={fact.actualCents}
                  empty={blank.includes(`${month}-actualCents`)}
                  onChange={(next) => amount("actualCents", next)}
                />
                <SalesAmountField
                  label="Sales target"
                  value={fact.targetCents}
                  empty={blank.includes(`${month}-targetCents`)}
                  onChange={(next) => amount("targetCents", next)}
                />
              </div>
              <FieldDescription>
                USD. Zero target displays “No target” instead of an attainment percentage.
              </FieldDescription>
              <div className="st-editor-variance">
                <span>Monthly variance</span>
                <strong>{salesMoney(fact.actualCents - fact.targetCents)}</strong>
              </div>
              <SalesMonthChart stores={[value]} year={Number(month.slice(0, 4))} month={month} />
              <h3 className="text-sm font-semibold">Store profile</h3>
              <Field>
                <FieldLabel htmlFor={`${id}-name`}>Store name</FieldLabel>
                <Input
                  ref={nameInput}
                  id={`${id}-name`}
                  maxLength={80}
                  value={value.name}
                  onChange={(event) => update({ name: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-manager`}>Store manager</FieldLabel>
                <Input
                  ref={managerInput}
                  id={`${id}-manager`}
                  maxLength={80}
                  value={value.manager}
                  onChange={(event) => update({ manager: event.target.value })}
                />
              </Field>
              <div className="st-editor-amounts">
                <FinanceSelect
                  field
                  label="Region"
                  value={value.region}
                  options={options(TARGET_REGIONS)}
                  onChange={(region) => update({ region })}
                  className="w-full"
                />
                <FinanceSelect
                  field
                  label="Store format"
                  value={value.format}
                  options={options(TARGET_FORMATS)}
                  onChange={(format) => update({ format })}
                  className="w-full"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </FieldGroup>
          </div>
          <SheetFooter className="flex-row flex-wrap border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" disabled={!adding && !dirty}>
              {adding ? "Create store" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
