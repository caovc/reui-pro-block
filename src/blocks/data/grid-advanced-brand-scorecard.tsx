import { useRef, useState } from "react";
import { Download, Ellipsis, Plus, SlidersHorizontal, Undo2 } from "lucide-react";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Filters, createFilterQuery, type FilterField } from "@/components/reui/filters/filters";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  reviewAsOf,
  reviewCalls,
  reviewMonths,
  saveMerchBrand,
  saveMerchLine,
  type MerchBrand,
  type MerchMetric,
} from "./grid-advanced-merch-review-model";
import {
  MerchBrandEditor,
  MerchChoice,
  MerchDrivers,
  MerchLineEditor,
  MerchRangeBand,
  MerchSpread,
  MerchStat,
  MerchSummary,
} from "./grid-advanced-merch-review-ui";
import {
  merchMetricLabel,
  merchMoney,
  merchMonthLabel,
  merchPercent,
  useMerchBook,
} from "./grid-advanced-merch-review-state";
import "./grid-advanced-merch-review.css";

type MetricRow = { id: string; metric: MerchMetric };
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
  const rows = merchMetrics
    .filter((metric) => section === "all" || metric.section === section)
    .map((metric) => ({ id: metric.id, metric }));
  const selectedBrand = book.brands.find((brand) => brand.id === detailsId);
  const columns: DomainField<MetricRow>[] = [
    {
      id: "metric",
      title: "Scorecard line",
      value: (row) => row.metric.label,
      size: 185,
      hideable: false,
      render: (row) => (
        <div className="merch-metric-title" data-section={row.metric.section}>
          <span>{row.metric.section}</span>
          <strong>{row.metric.label}</strong>
        </div>
      ),
    },
    {
      id: "portfolio",
      title: "Portfolio reference",
      value: (row) => portfolio[row.metric.id],
      size: 155,
      hideable: false,
      header: () => (
        <div className="merch-portfolio-heading">
          <strong>Portfolio</strong>
          <span>All local brands</span>
        </div>
      ),
      render: (row) => (
        <strong className="tabular-nums">
          {merchMetricLabel(row.metric, portfolio[row.metric.id])}
        </strong>
      ),
    },
    ...brands.map((brand): DomainField<MetricRow> => ({
      id: brand.id,
      title: brand.name,
      size: 195,
      value: (row) => valueOfBrand(brand, row.metric),
      header: () => (
        <div className="merch-brand-heading">
          <div className="flex items-start justify-between gap-2">
            <Button
              variant="ghost"
              className="merch-brand-open"
              style={{ flex: "1 1 0%" }}
              onClick={(event) => {
                opener.current = event.currentTarget;
                setDetailsId(brand.id);
              }}
              aria-label={`Review ${brand.name}`}
            >
              <Avatar className="size-8">
                <AvatarFallback>{brand.initials}</AvatarFallback>
              </Avatar>
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{brand.name}</span>
            </Button>
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
          <div className="my-2 flex items-center justify-between gap-2">
            <Badge size="xs" variant={brand.call === "Review" ? "warning-light" : "secondary"}>
              {brand.call}
            </Badge>
            <span className="text-[10px] font-normal text-muted-foreground">
              Goal {merchPercent(brand.targetMarginBps)}
            </span>
          </div>
          <MerchRangeBand
            lines={book.lines.filter((line) => line.brandId === brand.id)}
            months={observedMonths}
            label={`${brand.name} trading range`}
          />
        </div>
      ),
      render: (row) => {
        const value = valueOfBrand(brand, row.metric);
        const reference = portfolio[row.metric.id];
        const standing = merchStanding(row.metric, value, reference);
        return (
          <div className="merch-brand-value" data-standing={standing}>
            <strong>{merchMetricLabel(row.metric, value)}</strong>
            <span>
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
      id: "spread",
      title: "Visible brand spread",
      value: (row) => {
        const values = brands.flatMap((brand) => {
          const value = valueOfBrand(brand, row.metric);
          return value === null ? [] : [value];
        });
        return values.length ? Math.max(...values) - Math.min(...values) : null;
      },
      size: 180,
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
    <div className="merch-review" data-merch-review="brand-scorecard">
      <Frame>
        <FrameHeader className="flex-wrap gap-3">
          <div>
            <FrameTitle>Brand trading scorecard</FrameTitle>
            <FrameDescription>
              Local brand portfolio · Recorded through {reviewAsOf}
            </FrameDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={!canUndo} onClick={undo}>
              <Undo2 /> Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!book.brands.length}
              onClick={(event) => {
                opener.current = event.currentTarget;
                setLineEditor(true);
              }}
            >
              Add product record
            </Button>
            <Button
              ref={addBrand}
              size="sm"
              onClick={(event) => {
                opener.current = event.currentTarget;
                setEditing({ id: null });
              }}
            >
              <Plus /> Add brand
            </Button>
          </div>
        </FrameHeader>
        <FramePanel>
          <MerchSummary>
            <MerchStat label="All-brand net sales" value={merchMoney(portfolio.netCents)} />
            <MerchStat label="Portfolio gross margin" value={merchPercent(portfolio.marginBps)} />
            <MerchStat label="Stock sell-through" value={merchPercent(portfolio.sellThroughBps)} />
            <MerchStat
              label="Visible brands"
              value={`${brands.length} / ${book.brands.length}`}
              detail="Filters change columns; portfolio remains the full reference."
            />
          </MerchSummary>
        </FramePanel>
      </Frame>
      <div className="merch-toolbar">
        <Input
          aria-label="Search brands"
          placeholder="Search brand names"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <MerchChoice
          id="brand-review-month"
          label="Review month"
          value={month}
          onChange={setMonth}
          options={reviewMonths.map((value) => ({ value, label: merchMonthLabel(value) }))}
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
            ...["Sales", "Margin", "Inventory"].map((value) => ({ value, label: value })),
          ]}
        />
        <Filters
          fields={fields}
          query={query}
          onQueryChange={setQuery}
          variant="advanced"
          advancedMode="popover"
          trigger={
            <Button variant="outline" size="sm">
              <SlidersHorizontal /> Filters
            </Button>
          }
          menuClassName="max-w-[calc(100vw-16px)]"
        />
      </div>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {!brands.length && (
        <Frame>
          <FramePanel className="py-8 text-center">
            <p>No brands match this review.</p>
            <Button
              className="mt-3"
              variant="outline"
              onClick={() => {
                setSearch("");
                setQuery(createFilterQuery());
              }}
            >
              Clear brand filters
            </Button>
          </FramePanel>
        </Frame>
      )}
      <DomainRecordGrid
        data={rows}
        fields={columns}
        getRowId={(row) => row.id}
        scrollArea="horizontal"
        className="merch-brand-grid"
        renderFrame={(content, table) => (
          <Frame className="min-w-0">
            <FrameHeader className="flex-wrap gap-3">
              <div>
                <FrameTitle>{merchMonthLabel(month)} brand comparison</FrameTitle>
                <FrameDescription>
                  Monthly weekly-sales ranges above weighted scorecard readings.
                </FrameDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <DataGridColumnVisibility
                  table={table}
                  trigger={
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal /> Columns
                    </Button>
                  }
                />
                <Button variant="outline" size="sm" onClick={exportReview}>
                  <Download /> Export scorecard
                </Button>
              </div>
            </FrameHeader>
            {content}
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
