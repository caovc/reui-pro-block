import { useId, useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDomainGrid, type DomainColumn } from "./grid-advanced-model-grid";
import {
  formatHrValue,
  hrGroups,
  hrOwners,
  hrUnits,
  monthLabel,
  type HrKpi,
} from "./grid-advanced-hr-data";

export function HrChoice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function HrNumber({
  label,
  value,
  onChange,
  max = 1000000000,
  step = 1,
  min = 0,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  max?: number;
  step?: number;
  min?: number;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <NumberField id={id} value={value} min={min} max={max} step={step} onValueChange={onChange}>
        <NumberFieldGroup>
          <NumberFieldDecrement aria-label={`Decrease ${label}`} />
          <NumberFieldInput aria-label={label} placeholder="Not reported" />
          <NumberFieldIncrement aria-label={`Increase ${label}`} />
        </NumberFieldGroup>
      </NumberField>
    </div>
  );
}

function HrHistory({ kpi }: { kpi: HrKpi }) {
  const data = useMemo(
    () =>
      Object.entries(kpi.series)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, values]) => ({ id: month, month, ...values })),
    [kpi],
  );
  const columns = useMemo<DomainColumn<(typeof data)[number]>[]>(
    () => [
      {
        id: "month",
        accessorKey: "month",
        header: "Month",
        size: 120,
        cell: ({ row }) => monthLabel(row.original.month),
      },
      {
        id: "target",
        accessorKey: "target",
        header: "Target",
        size: 110,
        cell: ({ row }) => formatHrValue(row.original.target, kpi.unit),
      },
      {
        id: "actual",
        accessorKey: "actual",
        header: "Actual",
        size: 110,
        cell: ({ row }) => formatHrValue(row.original.actual, kpi.unit),
      },
    ],
    [kpi.unit],
  );
  const table = useDomainGrid({ data, columns });
  return (
    <DataGrid
      table={table}
      recordCount={data.length}
      tableLayout={{ width: "fixed", rowBorder: true, headerBorder: true }}
      tableClassNames={{ bodyRow: "h-8", headerRow: "h-8" }}
    >
      <DataGridContainer className="rounded-lg border">
        <DataGridScrollArea orientation="horizontal">
          <DataGridTable />
        </DataGridScrollArea>
      </DataGridContainer>
    </DataGrid>
  );
}

export function HrKpiEditor({
  kpi,
  month,
  creating,
  onClose,
  onSave,
}: {
  kpi: HrKpi;
  month: string;
  creating: boolean;
  onClose: () => void;
  onSave: (value: HrKpi) => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(kpi));
  const [error, setError] = useState("");
  function field<K extends keyof HrKpi>(key: K, value: HrKpi[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }
  function measurement(key: "target" | "actual", value: number | null) {
    setDraft((previous) => ({
      ...previous,
      series: {
        ...previous.series,
        [month]: {
          ...(previous.series[month] ?? { target: null, actual: null }),
          [key]: value,
        },
      },
    }));
  }
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="hr-scorecard-sheet">
        <SheetHeader className="border-b p-5 pr-12">
          <SheetTitle>{creating ? "Add KPI" : "Edit KPI"}</SheetTitle>
          <SheetDescription>
            Define a measure and update {monthLabel(month)}. Blank actual means not reported.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.label.trim()) {
              setError("KPI name is required.");
              return;
            }
            onSave({ ...draft, label: draft.label.trim() });
          }}
        >
          <Tabs defaultValue="Definition" className="min-h-0 flex-1 gap-0">
            <TabsList variant="line" className="mx-4 h-11 gap-3">
              {["Definition", "History", "Notes"].map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="min-h-0 flex-1 overflow-y-auto border-t p-5">
              {error && (
                <p role="alert" className="mb-4 text-sm text-destructive">
                  {error}
                </p>
              )}
              <TabsContent value="Definition" className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hr-kpi-name">KPI name</Label>
                  <Input
                    id="hr-kpi-name"
                    required
                    value={draft.label}
                    onChange={(event) => field("label", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hr-kpi-description">Definition</Label>
                  <Textarea
                    id="hr-kpi-description"
                    value={draft.description}
                    onChange={(event) => field("description", event.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Group</Label>
                    <HrChoice
                      label="Group"
                      value={draft.group}
                      options={hrGroups}
                      onChange={(value) => field("group", value as HrKpi["group"])}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unit</Label>
                    <HrChoice
                      label="Unit"
                      value={draft.unit}
                      options={hrUnits}
                      onChange={(value) => field("unit", value as HrKpi["unit"])}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Owner</Label>
                  <HrChoice
                    label="Owner"
                    value={draft.owner}
                    options={hrOwners}
                    onChange={(value) => field("owner", value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Direction</Label>
                    <HrChoice
                      label="Direction"
                      value={draft.direction === "higher" ? "Higher is better" : "Lower is better"}
                      options={["Higher is better", "Lower is better"]}
                      onChange={(value) =>
                        field("direction", value.startsWith("Higher") ? "higher" : "lower")
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>YTD rollup</Label>
                    <HrChoice
                      label="YTD rollup"
                      value={draft.rollup === "sum" ? "Sum" : "Average"}
                      options={["Average", "Sum"]}
                      onChange={(value) => field("rollup", value === "Sum" ? "sum" : "average")}
                    />
                  </div>
                </div>
                <fieldset className="grid grid-cols-2 gap-4 border-t pt-5">
                  <legend className="pr-2 text-sm font-medium">{monthLabel(month)}</legend>
                  <HrNumber
                    label="Target"
                    value={draft.series[month]?.target ?? null}
                    step={0.1}
                    onChange={(value) => measurement("target", value)}
                  />
                  <HrNumber
                    label="Actual"
                    value={draft.series[month]?.actual ?? null}
                    step={0.1}
                    onChange={(value) => measurement("actual", value)}
                  />
                </fieldset>
              </TabsContent>
              <TabsContent value="History" className="space-y-3">
                <h3 className="font-medium">Monthly measurements</h3>
                <p className="text-xs text-muted-foreground">
                  Earlier measurements remain independent of the current month.
                </p>
                <HrHistory kpi={draft} />
              </TabsContent>
              <TabsContent value="Notes" className="space-y-2">
                <Label htmlFor="hr-kpi-notes">Owner notes</Label>
                <Textarea
                  id="hr-kpi-notes"
                  className="min-h-40"
                  value={draft.notes}
                  onChange={(event) => field("notes", event.target.value)}
                  placeholder="Document a definition, exception or follow-up…"
                />
              </TabsContent>
            </div>
          </Tabs>
          <div className="flex items-center justify-between border-t p-4">
            <span className="text-xs text-muted-foreground">Local demo</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {creating ? <Plus /> : <Check />}
                {creating ? "Add KPI" : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
