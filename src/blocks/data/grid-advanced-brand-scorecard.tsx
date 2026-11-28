import { useRef, useState } from "react";
import {
  Box,
  CalendarDays,
  Download,
  Ellipsis,
  FilePlus2,
  Plus,
  Settings2,
  SlidersHorizontal,
  Undo2,
} from "lucide-react";
import { Frame, FrameDescription, FrameHeader, FrameTitle } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Filters, createFilterQuery, type FilterField } from "@/components/reui/filters/filters";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/templates/workflow/free/flowly-toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BrandScorecardPlot,
  type BrandPlotMode,
  type BrandPlotMetric,
  type BrandPlotPoint,
} from "./grid-advanced-brand-scorecard-plots";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { downloadFile } from "@/lib/download";
import { DEFAULT_FILTER_OPERATORS } from "@/components/reui/filters/filters-operators";
import { DomainRecordGrid, type DomainField } from "@/blocks/data/grid-advanced-model-grid";
import {
  matchesMerchQuery,
  merchCsv,
  merchMetrics,
  merchStanding,
  readMerchLines,
  removeMerchBrand,
  reviewCalls,
  reviewMonths,
  saveMerchBrand,
  saveMerchLine,
  type MerchBrand,
  type MerchLine,
  type MerchMetric,
} from "./grid-advanced-merch-review-model";
import {
  MerchBrandEditor,
  MerchChoice,
  MerchDrivers,
  MerchLineEditor,
  MerchSpread,
} from "./grid-advanced-merch-review-ui";
import {
  merchMetricLabel,
  merchMoney,
  merchMonthLabel,
  merchPercent,
  useMerchBook,
} from "./grid-advanced-merch-review-state";
import { readCategoryPeriod } from "./grid-advanced-category-margin-metrics";
import "./grid-advanced-merch-review.css";
import "./grid-advanced-brand-scorecard.css";

type MetricRow = { id: string; metric: MerchMetric };
// Actual free ReUI c-toggle-group-5 adapter retains native roving focus and pressed state.
const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
function BrandMetricValue({ metric, value }: { metric: MerchMetric; value: number | null }) {
  const full = merchMetricLabel(metric, value);
  return value !== null && metric.unit === "money" ? (
    <span title={full}>
      <strong aria-hidden="true">{compactCurrency.format(value / 100)}</strong>
      <span className="sr-only">{full}</span>
    </span>
  ) : (
    <strong>{full}</strong>
  );
}
const brandPlotMetricLabels: Record<BrandPlotMetric, string> = {
  "weekly-net": "Weekly net sales ranges",
  net: "Net sales",
  margin: "Gross margin",
  discount: "Markdown rate",
};
function monthlyValue(lines: MerchLine[], month: string, metric: BrandPlotMetric) {
  const reading = readMerchLines(lines, month);
  if (!reading.observed) return null;
  return metric === "margin"
    ? reading.marginBps
    : metric === "discount"
      ? reading.grossCents - reading.returnedCents > 0
        ? Math.round((reading.discountCents / (reading.grossCents - reading.returnedCents)) * 10000)
        : null
      : reading.netCents;
}
function brandPlotPoints(
  lines: MerchLine[],
  months: string[],
  mode: BrandPlotMode,
  metric: BrandPlotMetric,
): BrandPlotPoint[] {
  if (mode === "styles")
    return lines.flatMap((line, index) => {
      const reading = readCategoryPeriod([line], months);
      return reading.observed
        ? [
            {
              id: line.id,
              label: `${line.name}${reading.complete ? "" : " (partial recorded period)"}`,
              value: reading.profitCents,
              x: 0.5 + ((index % 3) - 1) * 0.15,
            },
          ]
        : [];
    });
  return months.flatMap((month, index) => {
    const value = monthlyValue(lines, month, metric);
    return value === null
      ? []
      : [{ id: month, label: merchMonthLabel(month), value, x: 0.5 + ((index % 3) - 1) * 0.12 }];
  });
}
function brandPlotDomain(
  lines: MerchLine[],
  months: string[],
  mode: BrandPlotMode,
  metric: BrandPlotMetric,
): [number, number] {
  const values =
    mode === "styles"
      ? brandPlotPoints(lines, months, mode, metric).map((point) => point.value)
      : months.flatMap((month) =>
          [...new Set(lines.map((line) => line.brandId))].flatMap((brandId) => {
            const value = monthlyValue(
              lines.filter((line) => line.brandId === brandId),
              month,
              metric,
            );
            return value === null ? [] : [value];
          }),
        );
  const low = Math.min(0, ...values),
    high = Math.max(0, ...values);
  const pad = Math.max(1, (high - low) * 0.1);
  return [low < 0 ? low - pad : 0, high + pad];
}

const fields: FilterField[] = [
  {
    id: "name",
    label: "Brand name",
    type: "text",
    operators: DEFAULT_FILTER_OPERATORS.text.filter((operator) =>
      ["contains", "not_contains", "is", "is_not"].includes(operator.value),
    ),
  },
  {
    id: "call",
    label: "Review call",
    type: "select",
    options: reviewCalls.map((value) => ({ value, label: value })),
  },
  {
    id: "margin",
    label: "Gross margin (%)",
    type: "number",
    operators: DEFAULT_FILTER_OPERATORS.number.filter((operator) =>
      ["gt", "gte", "lt", "lte", "eq", "neq"].includes(operator.value),
    ),
  },
];

export default function BrandScorecard() {
  const { book, commit, undo, message, canUndo } = useMerchBook();
  const mobile = useIsMobile(640);
  const [mode, setMode] = useState<BrandPlotMode>("months");
  const [plotMetric, setPlotMetric] = useState<BrandPlotMetric>("weekly-net");
  const [month, setMonth] = useState(reviewMonths.at(-1)!);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(createFilterQuery);
  const [order, setOrder] = useState("name");
  const [section, setSection] = useState("all");
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [lineEditor, setLineEditor] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<MerchBrand | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const addBrand = useRef<HTMLButtonElement>(null);
  const observedMonths = reviewMonths.slice(
    Math.max(0, reviewMonths.indexOf(month) - 11),
    reviewMonths.indexOf(month) + 1,
  );
  const portfolio = readMerchLines(book.lines, month);
  const readingOf = (brand: MerchBrand) =>
    readMerchLines(
      book.lines.filter((line) => line.brandId === brand.id),
      month,
    );
  const valueOfBrand = (brand: MerchBrand, metric: MerchMetric) => {
    const reading = readingOf(brand);
    return reading.observed ? reading[metric.id] : null;
  };
  const brands = book.brands
    .filter((brand) => {
      const reading = readingOf(brand);
      return (
        brand.name.toLowerCase().includes(search.trim().toLowerCase()) &&
        (matchesMerchQuery(
          {
            name: brand.name,
            call: brand.call,
            margin: reading.marginBps === null ? null : reading.marginBps / 100,
          },
          query,
        ) ??
          true)
      );
    })
    .toSorted((a, b) =>
      order === "name"
        ? a.name.localeCompare(b.name)
        : order === "sales"
          ? readingOf(b).netCents - readingOf(a).netCents
          : (readingOf(b).marginBps ?? -Infinity) - (readingOf(a).marginBps ?? -Infinity),
    );
  const plotDomain = brandPlotDomain(book.lines, observedMonths, mode, plotMetric);
  const stylePoints = brandPlotPoints(book.lines, observedMonths, "styles", plotMetric);
  const rows = merchMetrics
    .filter((metric) => section === "all" || metric.section === section)
    .map((metric) => ({ id: metric.id, metric }));
  const selectedBrand = book.brands.find((brand) => brand.id === detailsId);
  const columns: DomainField<MetricRow>[] = [
    {
      id: "metric",
      className: "brand-scorecard-metric-cell",
      title: "Scorecard line",
      value: (row) => row.metric.label,
      size: mobile ? 108 : 382,
      header: () => (
        <div className="brand-scorecard-leading">
          <div className="brand-scorecard-leading__choice">
            {mode === "months" ? (
              <MerchChoice
                id="brand-chart-metric"
                label="Chart metric"
                value={plotMetric}
                onChange={(value) => setPlotMetric(value as BrandPlotMetric)}
                options={Object.entries(brandPlotMetricLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            ) : (
              <span>Profit per product line</span>
            )}
          </div>
          <div className="brand-scorecard-leading__summary">
            <strong>
              Portfolio{" "}
              <span title={merchMoney(portfolio.netCents)}>
                <span aria-hidden="true">{compactCurrency.format(portfolio.netCents / 100)}</span>
                <span className="sr-only">{merchMoney(portfolio.netCents)}</span>
              </span>
            </strong>
            <small>Rows: {merchMonthLabel(month)}</small>
            <div className="brand-scorecard-portfolio-stats">
              <span>
                Gross margin<strong>{merchPercent(portfolio.marginBps)}</strong>
              </span>
              <span>
                Return rate<strong>{merchPercent(portfolio.returnBps)}</strong>
              </span>
              <span>
                Sell-through<strong>{merchPercent(portfolio.sellThroughBps)}</strong>
              </span>
            </div>
          </div>
          <span className="brand-scorecard-leading__call">Next season call</span>
        </div>
      ),
      hideable: false,
      render: (row) => (
        <div className="merch-metric-title" data-section={row.metric.section}>
          <span className="sr-only">{row.metric.section}</span>
          <strong>{row.metric.label}</strong>
        </div>
      ),
    },
    ...brands.map((brand): DomainField<MetricRow> => ({
      id: brand.id,
      className: "brand-scorecard-brand-cell",
      title: brand.name,
      size: 78,
      value: (row) => valueOfBrand(brand, row.metric),
      header: () => (
        <div className="brand-scorecard-brand-heading">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="merch-brand-open"
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setDetailsId(brand.id);
                }}
                aria-label={`Review ${brand.name}`}
              >
                <Avatar className="size-4">
                  <AvatarFallback>{brand.initials}</AvatarFallback>
                </Avatar>
                <span>{brand.name}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{brand.name}</TooltipContent>
          </Tooltip>
          <div className="brand-scorecard-brand-plot">
            <BrandScorecardPlot
              lines={book.lines.filter((line) => line.brandId === brand.id)}
              months={observedMonths}
              mode={mode}
              metric={plotMetric}
              label={brand.name}
              domain={plotDomain}
              points={brandPlotPoints(
                book.lines.filter((line) => line.brandId === brand.id),
                observedMonths,
                mode,
                plotMetric,
              )}
              metricLabel={brandPlotMetricLabels[plotMetric]}
            />
            <span className="brand-scorecard-goal">Goal {merchPercent(brand.targetMarginBps)}</span>
          </div>
          <div className="brand-scorecard-call">
            <Badge size="xs" variant={brand.call === "Review" ? "warning-light" : "secondary"}>
              {brand.call}
            </Badge>{" "}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Actions for ${brand.name}`}
                  onPointerDownCapture={(event) => {
                    opener.current = event.currentTarget;
                  }}
                  onFocusCapture={(event) => {
                    opener.current = event.currentTarget;
                  }}
                  onClick={(event) => {
                    opener.current = event.currentTarget;
                  }}
                >
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing({ id: brand.id })}>
                  Edit brand
                </DropdownMenuItem>
                <DropdownMenuLabel>Set review call</DropdownMenuLabel>
                {reviewCalls.map((call) => (
                  <DropdownMenuItem
                    key={call}
                    onSelect={() =>
                      commit(
                        saveMerchBrand(book, brand.id, { ...brand, call }),
                        `${brand.name}: ${call}.`,
                      )
                    }
                  >
                    {call}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(brand)}>
                  Remove brand
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ),
      render: (row) => {
        const value = valueOfBrand(brand, row.metric);
        const reference = portfolio[row.metric.id];
        const standing = merchStanding(row.metric, value, reference);
        return (
          <div className="merch-brand-value" data-standing={standing}>
            <BrandMetricValue metric={row.metric} value={value} />
            <span className="sr-only">
              {standing === "neutral"
                ? row.metric.better === "neutral"
                  ? "Planning context"
                  : "Portfolio reference"
                : standing === "positive"
                  ? "Favourable vs portfolio"
                  : "Unfavourable vs portfolio"}
            </span>
          </div>
        );
      },
    })),
    {
      id: "portfolio",
      className: "brand-scorecard-portfolio-cell",
      title: "Portfolio reference",
      value: (row) => portfolio[row.metric.id],
      size: 84,
      hideable: false,
      header: () => (
        <div className="brand-scorecard-portfolio-heading">
          <div>
            <strong>Portfolio</strong>
            <span>{book.brands.length} brands</span>
          </div>
          <div className="brand-scorecard-plot-summary">
            {mode === "styles" ? (
              <>
                <span>
                  Product lines<strong>{stylePoints.length}</strong>
                </span>
                <span>
                  At a loss<strong>{stylePoints.filter((point) => point.value < 0).length}</strong>
                </span>
                <span>
                  Best recorded line
                  <strong>
                    {stylePoints.length
                      ? merchMoney(Math.max(...stylePoints.map((point) => point.value)))
                      : "—"}
                  </strong>
                </span>
              </>
            ) : (
              <>
                <span>
                  Plot period<strong>{observedMonths.length} months</strong>
                </span>
                <span>
                  Through<strong>{merchMonthLabel(month)}</strong>
                </span>
                <span>
                  Metric<strong>{brandPlotMetricLabels[plotMetric]}</strong>
                </span>
              </>
            )}
          </div>
          <div />
        </div>
      ),
      render: (row) => (
        <span className="tabular-nums">
          <BrandMetricValue metric={row.metric} value={portfolio[row.metric.id]} />
        </span>
      ),
    },
    {
      id: "spread",
      className: "brand-scorecard-spread-cell",
      title: "Visible brand spread",
      value: (row) => {
        const values = brands.flatMap((brand) => {
          const value = valueOfBrand(brand, row.metric);
          return value === null ? [] : [value];
        });
        return values.length ? Math.max(...values) - Math.min(...values) : null;
      },
      size: 124,
      render: (row) => {
        const values = brands.flatMap((brand) => {
          const value = valueOfBrand(brand, row.metric);
          return value === null ? [] : [value];
        });
        return <MerchSpread metric={row.metric} values={values} />;
      },
    },
  ];
  function exportReview() {
    downloadFile(
      "brand-scorecard.csv",
      merchCsv(
        ["Section", "Metric", "Month", "Portfolio", ...brands.map((brand) => brand.name)],
        rows.map(({ metric }) => [
          metric.section,
          metric.label,
          month,
          portfolio[metric.id],
          ...brands.map((brand) => valueOfBrand(brand, metric)),
        ]),
      ),
      "text/csv",
    );
  }
  return (
    <div className="merch-review brand-scorecard" data-merch-review="brand-scorecard">
      <DomainRecordGrid
        data={rows}
        fields={columns}
        getRowId={(row) => row.id}
        scrollArea="both"
        className="merch-brand-grid"
        renderFrame={(content, table) => (
          <Frame dense className="brand-scorecard-frame">
            <FrameHeader className="brand-scorecard-header">
              <div className="brand-scorecard-title">
                <FrameTitle>Brand trading scorecard</FrameTitle>
                <FrameDescription>
                  {merchMonthLabel(observedMonths[0])} to {merchMonthLabel(month)} ·{" "}
                  {book.brands.length} brands · {book.lines.length} product lines
                </FrameDescription>
              </div>
              <div className="brand-scorecard-search-tools">
                <Input
                  aria-label="Search brands"
                  placeholder="Search brands"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <Filters
                  fields={fields}
                  query={query}
                  onQueryChange={setQuery}
                  variant="advanced"
                  advancedMode="popover"
                  trigger={
                    <Button variant="outline" size="icon-sm" aria-label="Filters">
                      <SlidersHorizontal />
                    </Button>
                  }
                  menuClassName="max-w-[calc(100vw-16px)]"
                />
                <DataGridColumnVisibility
                  table={table}
                  trigger={
                    <Button variant="outline" size="icon-sm" aria-label="Columns">
                      <SlidersHorizontal />
                    </Button>
                  }
                />
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Export scorecard"
                  onClick={exportReview}
                >
                  <Download />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="icon-sm" variant="outline" aria-label="Review options">
                      <Settings2 />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="brand-scorecard-options" align="end">
                    <MerchChoice
                      id="brand-review-month"
                      label="Review month"
                      value={month}
                      onChange={setMonth}
                      options={reviewMonths.map((value) => ({
                        value,
                        label: merchMonthLabel(value),
                      }))}
                    />
                    <MerchChoice
                      id="brand-order"
                      label="Brand order"
                      value={order}
                      onChange={setOrder}
                      options={[
                        { value: "name", label: "Brand name" },
                        { value: "sales", label: "Net sales, highest first" },
                        { value: "margin", label: "Margin, highest first" },
                      ]}
                    />
                    <MerchChoice
                      id="brand-section"
                      label="Scorecard section"
                      value={section}
                      onChange={setSection}
                      options={[
                        { value: "all", label: "All scorecard lines" },
                        ...["Sales", "Margin", "Inventory"].map((value) => ({
                          value,
                          label: value,
                        })),
                      ]}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="brand-scorecard-actions">
                <ToggleGroup
                  className="brand-scorecard-modes"
                  aria-label="Plot view"
                  value={[mode]}
                  onValueChange={(values) => {
                    const selected = values[0];
                    if (selected === "months" || selected === "styles") setMode(selected);
                  }}
                  spacing={0}
                  variant="outline"
                  size="sm"
                >
                  {(["months", "styles"] as const).map((value) => (
                    <ToggleGroupItem key={value} value={value}>
                      {value === "months" ? <CalendarDays /> : <Box />}
                      {value === "months" ? "Months" : "Styles"}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Button
                  ref={addBrand}
                  size="sm"
                  aria-label="Add brand"
                  onClick={(event) => {
                    opener.current = event.currentTarget;
                    setEditing({ id: null });
                  }}
                >
                  <Plus />
                  <span className="brand-scorecard-add-label">Add brand</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Add product record"
                  disabled={!book.brands.length}
                  onClick={(event) => {
                    opener.current = event.currentTarget;
                    setLineEditor(true);
                  }}
                >
                  <FilePlus2 />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Undo"
                  disabled={!canUndo}
                  onClick={undo}
                >
                  <Undo2 />
                </Button>
              </div>
            </FrameHeader>
            {!brands.length && (
              <div className="brand-scorecard-empty">
                <p>No brands match this review.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setQuery(createFilterQuery());
                  }}
                >
                  Clear brand filters
                </Button>
              </div>
            )}
            {content}
            {message && (
              <p role="status" className="brand-scorecard-status">
                {message}
              </p>
            )}
          </Frame>
        )}
      />
      <MerchDrivers
        open={Boolean(selectedBrand)}
        title={selectedBrand?.name ?? "Brand review"}
        lines={book.lines.filter((line) => line.brandId === selectedBrand?.id)}
        month={month}
        months={observedMonths}
        opener={opener}
        onClose={() => setDetailsId(null)}
      >
        {selectedBrand && (
          <MerchChoice
            id="brand-detail-call"
            label="Brand review call"
            value={selectedBrand.call}
            onChange={(call) =>
              commit(
                saveMerchBrand(book, selectedBrand.id, {
                  ...selectedBrand,
                  call: call as MerchBrand["call"],
                }),
                "Brand review call updated.",
              )
            }
            options={reviewCalls.map((value) => ({ value, label: value }))}
          />
        )}
      </MerchDrivers>
      {editing && (
        <MerchBrandEditor
          key={editing.id ?? "new"}
          brand={book.brands.find((brand) => brand.id === editing.id) ?? null}
          opener={opener}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            commit(
              saveMerchBrand(book, editing.id, draft),
              editing.id
                ? "Brand review updated."
                : "Brand created. Add its first product record to start the scorecard.",
            );
            if (!editing.id) {
              setSearch("");
              setQuery(createFilterQuery());
            }
          }}
        />
      )}
      {lineEditor && (
        <MerchLineEditor
          book={book}
          line={null}
          month={month}
          opener={opener}
          onClose={() => setLineEditor(false)}
          onSave={(draft) =>
            commit(
              saveMerchLine(book, null, draft),
              "Added a product record to this brand's review.",
            )
          }
        />
      )}
      <AlertDialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the brand and its local product records. Undo restores both.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removing) return;
                commit(
                  removeMerchBrand(book, removing.id),
                  "Removed the brand and its product records. Undo is available.",
                );
                setRemoving(null);
              }}
            >
              Remove brand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
