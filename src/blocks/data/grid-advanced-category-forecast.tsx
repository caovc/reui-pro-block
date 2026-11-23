import { useCallback, useId, useMemo, useRef, useState } from "react";
import { Columns3, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Facet } from "./grid-base-common";
import {
  DomainGridSurface,
  useDomainGrid,
  type DomainColumn,
  type ExpandedState,
} from "./grid-advanced-model-grid";
import { PlanBullet } from "./grid-advanced-review-charts";
import { ForecastLineEditor } from "./grid-advanced-category-forecast-editor";
import {
  FORECAST_DEPARTMENTS,
  FORECAST_MONTHS,
  createCategoryForecast,
  filterForecastLines,
  forecastMetrics,
  saveForecastLine,
  setForecastGrowth,
  type ForecastDepartment,
  type ForecastLine,
  type ForecastState,
} from "./grid-advanced-category-forecast-model";
import {
  ReviewActions,
  ReviewSearch,
  ReviewSelect,
  ReviewSummary,
  reviewCsv,
  reviewMoney,
  reviewPercent,
  useReviewHistory,
} from "./grid-advanced-review-ui";
import "./grid-advanced-review.css";

type ForecastRow = {
  id: string;
  name: string;
  kind: "department" | "line" | "share";
  department: ForecastDepartment;
  lines: ForecastLine[];
  line?: ForecastLine;
  children?: ForecastRow[];
};
type ForecastDialog =
  | { view: "edit"; line: ForecastLine; existing: boolean }
  | { view: "month"; lineId: string; month: number };
type Pace = "All lines" | "Below plan" | "At or above plan" | "No plan";

function GrowthControl({
  department,
  value,
  onPreview,
  onCommit,
}: {
  department: ForecastDepartment;
  value: number;
  onPreview: (basisPoints: number) => void;
  onCommit: (basisPoints: number) => void;
}) {
  const labelId = useId();
  return (
    <div className="forecast-growth-control">
      <div>
        <strong id={labelId}>
          {department}
          <span className="sr-only"> growth on 2025</span>
        </strong>
        <output>
          {value > 0 ? "+" : ""}
          {value / 100}%
        </output>
      </div>
      <Slider
        aria-labelledby={labelId}
        aria-valuetext={`${value / 100}% growth on 2025`}
        value={[value / 100]}
        min={-20}
        max={40}
        step={1}
        onValueChange={(values) => onPreview(Math.round(values[0] * 100))}
        onValueCommit={(values) => onCommit(Math.round(values[0] * 100))}
      />
    </div>
  );
}

export default function CategoryForecast() {
  const history = useReviewHistory(createCategoryForecast);
  const [draftGrowth, setDraftGrowth] = useState<Partial<Record<ForecastDepartment, number>>>({});
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [pace, setPace] = useState<Pace>("All lines");
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [dialog, setDialog] = useState<ForecastDialog | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const viewState = useMemo<ForecastState>(
    () => ({
      ...history.value,
      growthBasisPoints: { ...history.value.growthBasisPoints, ...draftGrowth },
    }),
    [history.value, draftGrowth],
  );
  // Keep a dragged control's population stable until its native commit event.
  const visible = useMemo(
    () => filterForecastLines(history.value, search, departments, pace),
    [history.value, search, departments, pace],
  );
  const total = useMemo(
    () => forecastMetrics(visible, viewState.growthBasisPoints),
    [visible, viewState.growthBasisPoints],
  );
  const maximumMonth = useMemo(
    () =>
      Math.max(
        1,
        ...visible.flatMap((line) =>
          forecastMetrics([line], viewState.growthBasisPoints).months.map(
            (month) => month.forecastCents,
          ),
        ),
      ),
    [visible, viewState.growthBasisPoints],
  );
  const rows = useMemo<ForecastRow[]>(
    () =>
      FORECAST_DEPARTMENTS.flatMap((department) => {
        const lines = visible.filter((line) => line.department === department);
        return lines.length
          ? [
              {
                id: `department-${department}`,
                name: department,
                kind: "department" as const,
                department,
                lines,
                children: [
                  ...lines.map((line): ForecastRow => ({
                    id: line.id,
                    name: line.name,
                    kind: "line",
                    department,
                    lines: [line],
                    line,
                  })),
                  {
                    id: `share-${department}`,
                    name: "Share of visible forecast",
                    kind: "share" as const,
                    department,
                    lines,
                  },
                ],
              },
            ]
          : [];
      }),
    [visible],
  );
  const rowMetrics = useMemo(() => {
    const result = new Map<string, ReturnType<typeof forecastMetrics>>();
    for (const group of rows)
      for (const row of [group, ...(group.children ?? [])])
        result.set(row.id, forecastMetrics(row.lines, viewState.growthBasisPoints));
    return result;
  }, [rows, viewState.growthBasisPoints]);
  const metrics = useCallback((row: ForecastRow) => rowMetrics.get(row.id)!, [rowMetrics]);
  const columns = useMemo<DomainColumn<ForecastRow>[]>(
    () => [
      {
        id: "line",
        header: "Product line / department",
        accessorFn: (row) => (row.kind === "share" ? undefined : row.name),
        size: 260,
        enableHiding: false,
        sortUndefined: "last",
        cell: ({ row }) =>
          row.original.kind === "department" ? (
            <div className="review-group-identity">
              <DataGridTableRowExpand row={row} />
              <strong>{row.original.name}</strong>
              <Badge variant="secondary">{row.original.lines.length}</Badge>
            </div>
          ) : row.original.line ? (
            <div className="review-identity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setDialog({ view: "edit", line: row.original.line!, existing: true });
                }}
              >
                {row.original.name}
              </Button>
              <span>{row.original.line.owner}</span>
            </div>
          ) : (
            <span className="review-share-label">{row.original.name}</span>
          ),
      },
      {
        id: "months",
        header: "2026 monthly forecast · USD",
        columns: FORECAST_MONTHS.map((month, index): DomainColumn<ForecastRow> => ({
          id: `month-${index}`,
          header: month,
          size: 92,
          sortUndefined: "last",
          accessorFn: (row) =>
            row.kind === "share" ? undefined : metrics(row).months[index].forecastCents,
          cell: ({ row }) => {
            const value = metrics(row.original).months[index].forecastCents;
            if (row.original.kind === "share")
              return (
                <span className="review-share-value">
                  {reviewPercent(
                    total.months[index].forecastCents
                      ? (value / total.months[index].forecastCents) * 100
                      : null,
                  )}
                </span>
              );
            if (!row.original.line)
              return <strong className="review-tabular">{reviewMoney(value, "USD", true)}</strong>;
            return (
              <span
                className="forecast-heat-cell"
                style={{
                  backgroundColor: `color-mix(in oklab, var(--chart-1) ${8 + (value / maximumMonth) * 28}%, var(--background))`,
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Inspect ${row.original.name}, ${month} 2026`}
                  onClick={(event) => {
                    opener.current = event.currentTarget;
                    setDialog({ view: "month", lineId: row.original.line!.id, month: index });
                  }}
                >
                  {reviewMoney(value, "USD", true)}
                </Button>
              </span>
            );
          },
        })),
      },
      {
        id: "forecast",
        header: "Annual forecast",
        size: 140,
        sortUndefined: "last",
        accessorFn: (row) => (row.kind === "share" ? undefined : metrics(row).forecastCents),
        cell: ({ row }) =>
          row.original.kind === "share" ? (
            <span className="review-share-value">
              {reviewPercent(
                total.forecastCents
                  ? (metrics(row.original).forecastCents / total.forecastCents) * 100
                  : null,
              )}
            </span>
          ) : (
            <strong className="review-tabular">
              {reviewMoney(metrics(row.original).forecastCents, "USD", true)}
            </strong>
          ),
      },
      {
        id: "plan",
        header: "Annual plan",
        size: 130,
        sortUndefined: "last",
        accessorFn: (row) => (row.kind === "share" ? undefined : metrics(row).planCents),
        cell: ({ row }) =>
          row.original.kind === "share" ? (
            <span className="review-share-value">
              {reviewPercent(
                total.planCents ? (metrics(row.original).planCents / total.planCents) * 100 : null,
              )}
            </span>
          ) : (
            <span className="review-tabular">
              {reviewMoney(metrics(row.original).planCents, "USD", true)}
            </span>
          ),
      },
      {
        id: "outlook",
        header: "Outlook to plan",
        size: 190,
        sortUndefined: "last",
        accessorFn: (row) => (row.kind === "share" ? undefined : metrics(row).attainment),
        cell: ({ row }) =>
          row.original.kind === "share" ? null : (
            <div className="forecast-outlook">
              <div>
                <strong>
                  {metrics(row.original).attainment === null
                    ? "No plan"
                    : reviewPercent(metrics(row.original).attainment)}
                </strong>
                <span>{reviewMoney(metrics(row.original).varianceCents, "USD", true)}</span>
              </div>
              <PlanBullet
                actual={metrics(row.original).forecastCents}
                target={metrics(row.original).planCents}
                label={`${row.original.name}: forecast ${reviewMoney(metrics(row.original).forecastCents)}, plan ${reviewMoney(metrics(row.original).planCents)}`}
              />
            </div>
          ),
      },
    ],
    [metrics, maximumMonth, total],
  );
  const table = useDomainGrid({
    data: rows,
    columns,
    getSubRows: (row) => row.children,
    getRowId: (row) => row.id,
    expanded,
    onExpandedChange: setExpanded,
  });
  const selectedLine =
    dialog?.view === "month" ? history.value.lines.find((line) => line.id === dialog.lineId) : null;
  const selectedMetrics = selectedLine
    ? forecastMetrics([selectedLine], viewState.growthBasisPoints)
    : null;
  const saveLine = (line: ForecastLine) => {
    const result = saveForecastLine(history.value, line);
    if (result.error) return result.error;
    history.commit(() => result.state);
    setDialog(null);
    if (dialog?.view === "edit" && !dialog.existing) {
      setSearch("");
      setDepartments([line.department]);
      setPace("All lines");
      setExpanded(true);
    }
    toast.success("Product line saved");
    return null;
  };
  const commitGrowth = (department: ForecastDepartment, basisPoints: number) => {
    const result = setForecastGrowth(history.value, department, basisPoints);
    if (result.error) return toast.error(result.error);
    history.commit(() => result.state);
    setDraftGrowth((current) => {
      const next = { ...current };
      delete next[department];
      return next;
    });
  };
  return (
    <section
      className="review-board category-forecast-board mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-12"
      aria-label="Category Forecast"
    >
      <DomainGridSurface
        table={table}
        scrollArea="both"
        layout={{
          width: "fixed",
          headerSticky: true,
          columnsResizable: true,
          columnsVisibility: true,
        }}
        renderFrame={(content) => (
          <Frame spacing="sm">
            <FrameHeader className="review-header">
              <div>
                <FrameTitle>
                  <h2>Category Forecast</h2>
                </FrameTitle>
                <FrameDescription>Reforecast 2026 sales against the annual plan.</FrameDescription>
              </div>
              <ReviewActions
                canUndo={history.canUndo}
                onUndo={() => {
                  // A controlled Radix keyboard change can arrive after its commit.
                  // Discard transient previews before exposing the restored model.
                  setDraftGrowth({});
                  history.undo();
                }}
                exportDisabled={!visible.length}
                onExport={() =>
                  reviewCsv(
                    "category-forecast-2026",
                    visible.map((line) => {
                      const value = forecastMetrics([line], viewState.growthBasisPoints);
                      return {
                        ProductLine: line.name,
                        Department: line.department,
                        GrowthPercent: viewState.growthBasisPoints[line.department] / 100,
                        ...Object.fromEntries(
                          value.months.map((month, index) => [
                            `${FORECAST_MONTHS[index]}USD`,
                            month.forecastCents / 100,
                          ]),
                        ),
                        ForecastUSD: value.forecastCents / 100,
                        PlanUSD: value.planCents / 100,
                        VarianceUSD: value.varianceCents / 100,
                      };
                    }),
                  )
                }
              >
                <Button
                  ref={addButton}
                  size="sm"
                  onClick={(event) => {
                    opener.current = event.currentTarget;
                    setDialog({
                      view: "edit",
                      existing: false,
                      line: {
                        id: crypto.randomUUID(),
                        name: "",
                        department:
                          FORECAST_DEPARTMENTS.find((department) =>
                            departments.includes(department),
                          ) ?? "Technology",
                        owner: "Amara Ortiz",
                        priorYearCents: Array(12).fill(0),
                        planCents: Array(12).fill(0),
                      },
                    });
                  }}
                >
                  <Plus aria-hidden="true" />
                  Add product line
                </Button>
              </ReviewActions>
            </FrameHeader>
            <FramePanel className="review-panel">
              <div className="review-toolbar">
                <ReviewSearch
                  label="Search product lines"
                  value={search}
                  onChange={(value) => {
                    setSearch(value);
                    setExpanded(true);
                  }}
                />
                <Facet
                  label="Department"
                  options={[...FORECAST_DEPARTMENTS]}
                  value={departments}
                  onChange={(value) => {
                    setDepartments(value);
                    setExpanded(true);
                  }}
                />
                <ReviewSelect
                  label="Forecast status"
                  value={pace}
                  options={["All lines", "Below plan", "At or above plan", "No plan"]}
                  onChange={(value) => {
                    setPace(value as Pace);
                    setExpanded(true);
                  }}
                />
                <DataGridColumnVisibility
                  table={table}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Columns3 aria-hidden="true" />
                      Columns
                    </Button>
                  }
                />
              </div>
              <div className="forecast-growth-controls" aria-label="Department growth assumptions">
                {FORECAST_DEPARTMENTS.map((department) => (
                  <GrowthControl
                    key={department}
                    department={department}
                    value={viewState.growthBasisPoints[department]}
                    onPreview={(value) =>
                      setDraftGrowth((current) => ({ ...current, [department]: value }))
                    }
                    onCommit={(value) => commitGrowth(department, value)}
                  />
                ))}
              </div>
              <ReviewSummary
                values={[
                  { label: "Product lines", value: visible.length },
                  { label: "2026 forecast", value: reviewMoney(total.forecastCents, "USD", true) },
                  { label: "Annual plan", value: reviewMoney(total.planCents, "USD", true) },
                  { label: "Forecast to plan", value: reviewPercent(total.attainment) },
                  {
                    label: "Growth vs 2025",
                    value: reviewPercent(
                      total.priorYearCents
                        ? (total.forecastCents / total.priorYearCents - 1) * 100
                        : null,
                    ),
                  },
                ]}
              />
              {content}
              <div className="review-footnote">
                <span>Department growth applies to the 2025 monthly baseline.</span>
                <span>Share rows use the currently visible forecast.</span>
              </div>
            </FramePanel>
          </Frame>
        )}
      />
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent
          className="reui-reference review-editor"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = opener.current;
            (target?.isConnected && target.getClientRects().length
              ? target
              : addButton.current
            )?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {dialog?.view === "edit"
                ? dialog.existing
                  ? "Edit product line"
                  : "Add product line"
                : `${dialog ? FORECAST_MONTHS[dialog.month] : ""} 2026 forecast`}
            </DialogTitle>
            <DialogDescription>
              {dialog?.view === "edit"
                ? "Annual values keep their monthly seasonality and sum to the exact entered amount."
                : (selectedLine?.name ?? "Monthly forecast details")}
            </DialogDescription>
          </DialogHeader>
          {dialog?.view === "edit" ? (
            <ForecastLineEditor
              key={dialog.line.id}
              initial={dialog.line}
              existing={dialog.existing}
              onSave={saveLine}
              onCancel={() => setDialog(null)}
            />
          ) : dialog?.view === "month" && selectedLine && selectedMetrics ? (
            <>
              <ReviewSummary
                values={[
                  {
                    label: "2025 sales",
                    value: reviewMoney(selectedMetrics.months[dialog.month].priorYearCents),
                  },
                  {
                    label: "2026 forecast",
                    value: reviewMoney(selectedMetrics.months[dialog.month].forecastCents),
                  },
                  {
                    label: "2026 plan",
                    value: reviewMoney(selectedMetrics.months[dialog.month].planCents),
                  },
                  {
                    label: "Growth assumption",
                    value: `${viewState.growthBasisPoints[selectedLine.department] / 100}%`,
                  },
                ]}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => setDialog({ view: "edit", line: selectedLine, existing: true })}
                >
                  Edit product line
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
