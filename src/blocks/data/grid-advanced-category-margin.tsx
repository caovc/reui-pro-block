import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  CalendarDays,
  ChartColumnIncreasing,
  ChevronRight,
  Download,
  Ellipsis,
  Plus,
  SlidersHorizontal,
  Undo2,
} from "lucide-react";
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
import { DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadFile } from "@/lib/download";
import { useIsMobile } from "@/hooks/use-mobile";
import { DEFAULT_FILTER_OPERATORS } from "@/components/reui/filters/filters-operators";
import {
  DomainRecordGrid,
  type DomainField,
  type DomainTable,
  type ExpandedState,
} from "@/blocks/data/grid-advanced-model-grid";
import {
  matchesMerchQuery,
  merchCsv,
  merchTargetBps,
  readMerchLines,
  reviewAsOf,
  reviewCalls,
  reviewDepartments,
  reviewMonths,
  saveMerchLine,
  type MerchLine,
} from "./grid-advanced-merch-review-model";
import {
  MerchChoice,
  MerchDrivers,
  MerchLineEditor,
  MerchMove,
  MerchStat,
  MerchSummary,
} from "./grid-advanced-merch-review-ui";
import {
  merchMoney,
  merchMonthLabel,
  merchPercent,
  useMerchBook,
} from "./grid-advanced-merch-review-state";
import { ToggleGroup, ToggleGroupItem } from "@/templates/workflow/free/flowly-toggle-group";
import { createCategoryMarginDriverFields } from "./grid-advanced-category-margin-drivers";
import { CategoryMarginOverview } from "./grid-advanced-category-margin-overview";
import { readCategoryPeriod } from "./grid-advanced-category-margin-metrics";
import "./grid-advanced-merch-review.css";
import "./grid-advanced-category-margin.css";

type CategoryRow = {
  id: string;
  label: string;
  department: MerchLine["department"];
  scope?: boolean;
  lines: MerchLine[];
  line?: MerchLine;
  children?: CategoryRow[];
};
const filters: FilterField[] = [
  {
    id: "department",
    label: "Department",
    type: "select",
    options: reviewDepartments.map((value) => ({ value, label: value })),
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
  {
    id: "name",
    label: "Product line",
    type: "text",
    operators: DEFAULT_FILTER_OPERATORS.text.filter((operator) =>
      ["contains", "not_contains", "is", "is_not"].includes(operator.value),
    ),
  },
];
const signed = (value: number | null) =>
  value === null ? "—" : `${value > 0 ? "+" : ""}${value} bp`;

function CategoryMarginPinnedActions({
  table,
  mobile,
}: {
  table: DomainTable<CategoryRow>;
  mobile: boolean;
}) {
  const configured = useRef<boolean | null>(null);
  useEffect(() => {
    if (configured.current === mobile) return;
    configured.current = mobile;
    table.setColumnPinning((current) => ({
      ...current,
      start: current.start.filter((id) => id !== "actions"),
      end: [...current.end.filter((id) => id !== "actions"), ...(mobile ? [] : ["actions"])],
    }));
  }, [table, mobile]);
  return null;
}

export default function CategoryMargin() {
  const { book, commit, undo, message, canUndo } = useMerchBook();
  const mobile = useIsMobile(640);
  const [mode, setMode] = useState<"months" | "drivers">("months");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(createFilterQuery);
  const [window, setWindow] = useState("recent12");
  const [month, setMonth] = useState(reviewMonths.at(-1)!);
  const [department, setDepartment] = useState<MerchLine["department"] | null>("Home");
  const [lineId, setLineId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [details, setDetails] = useState<{
    title: string;
    lineIds: string[];
    month: string;
  } | null>(null);
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [removing, setRemoving] = useState<MerchLine | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const months =
    window === "prior12"
      ? reviewMonths.slice(0, 12)
      : reviewMonths.slice(window === "recent6" ? -6 : -12);
  const currentLine = book.lines.find((line) => line.id === lineId);
  const matching = book.lines.filter((line) => {
    const reading = readMerchLines([line], month);
    const brand = book.brands.find((item) => item.id === line.brandId);
    return (
      `${line.name} ${line.department} ${brand?.name}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()) &&
      (matchesMerchQuery(
        {
          name: line.name,
          department: line.department,
          call: line.call,
          margin: reading.marginBps === null ? null : reading.marginBps / 100,
        },
        query,
      ) ??
        true)
    );
  });
  const filtered = matching.filter(
    (line) => (!department || line.department === department) && (!lineId || line.id === lineId),
  );
  const parentLines =
    lineId && department ? matching.filter((line) => line.department === department) : matching;
  const rowFor = (line: MerchLine): CategoryRow => ({
    id: line.id,
    label: line.name,
    department: line.department,
    lines: [line],
    line,
  });
  const rows: CategoryRow[] =
    department && !lineId && filtered.length
      ? [
          {
            id: `scope-${department}`,
            label: department,
            department,
            lines: filtered,
            scope: true,
          },
          ...filtered.map(rowFor),
        ]
      : department || lineId
        ? filtered.map(rowFor)
        : reviewDepartments.flatMap((name) => {
            const lines = filtered.filter((line) => line.department === name);
            return lines.length
              ? [
                  {
                    id: `department-${name}`,
                    label: name,
                    department: name,
                    lines,
                    children: lines.map(rowFor),
                  },
                ]
              : [];
          });
  const total = readMerchLines(filtered, month);
  function inspect(row: CategoryRow, selectedMonth: string, trigger: HTMLElement) {
    opener.current = trigger;
    setDetails({
      title: row.label,
      lineIds: row.lines.map((line) => line.id),
      month: selectedMonth,
    });
  }
  function drill(row: CategoryRow) {
    setDepartment(row.department);
    setLineId(row.line?.id ?? null);
    setExpanded({});
  }
  function goUp() {
    setExpanded({});
    if (lineId) setLineId(null);
    else setDepartment(null);
  }
  const scopeLabel = currentLine?.name ?? department ?? "All departments";
  const parentLabel = lineId ? department : department ? "All departments" : null;
  const backLabel = parentLabel ? `Back up from ${scopeLabel} to ${parentLabel}` : undefined;
  function scopeShare(row: CategoryRow) {
    const reading = readCategoryPeriod(row.lines, months);
    const parent = row.line
      ? book.lines.filter((line) => line.department === row.department)
      : book.lines;
    const parentNet = readCategoryPeriod(parent, months).netCents;
    if (!reading.observed) return "No recorded sales";
    if (parentNet <= 0) return "Share unavailable";
    const label = row.line ? row.department : "All departments";
    return `${merchPercent(Math.round((reading.netCents / parentNet) * 10000))} of ${label}`;
  }
  const moveTone = (value: number | null) =>
    value !== null && value >= 100 ? "up" : value !== null && value <= -100 ? "down" : undefined;
  const fields: DomainField<CategoryRow>[] = [
    {
      id: "scope",
      title: department || lineId ? "Product line" : "Department",
      value: (row) => row.label,
      size: mobile ? 208 : mode === "drivers" ? 264 : 273,
      hideable: false,
      render: (record, _index, nativeRow) => (
        <div className="merch-category-name-row">
          {!record.scope && (nativeRow.getCanExpand() || nativeRow.depth > 0) && (
            <DataGridTableRowExpand row={nativeRow} />
          )}
          <div className="merch-category-name-content">
            <div className="merch-category-name-label">
              {record.scope ? (
                <>
                  <span className="merch-category-scope-label">{record.label}</span>
                  <Button variant="ghost" size="icon-xs" aria-label={backLabel} onClick={goUp}>
                    <ArrowUp />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="merch-category-line-name h-auto min-h-7 justify-start px-1 py-0 text-[0.875rem] font-normal normal-case tracking-normal leading-5"
                  onClick={() => drill(record)}
                >
                  {record.label}
                </Button>
              )}
              {!record.line && !record.scope && (
                <Badge variant="secondary" size="xs">
                  {record.lines.length}
                </Badge>
              )}
              {record.line?.call === "Review" && (
                <Badge size="xs" variant="warning-light">
                  Review
                </Badge>
              )}
            </div>
            <small className="merch-category-share">{scopeShare(record)}</small>
          </div>
        </div>
      ),
    },
    ...(mode === "months"
      ? [
          ...(mobile
            ? []
            : [
                {
                  id: "measure",
                  className: "py-1",
                  title: "Measure",
                  header: () => <span>Measure</span>,
                  value: () => "Margin",
                  hideable: false,
                  size: 84,
                  render: () => (
                    <div className="merch-category-measures">
                      <span>Margin</span>
                      <small>MoM bps</small>
                      <small>YoY bps</small>
                    </div>
                  ),
                } satisfies DomainField<CategoryRow>,
              ]),
          ...months.map((period): DomainField<CategoryRow> => ({
            id: period,
            className: "py-1",
            title: merchMonthLabel(period).slice(0, 3),
            value: (row) => readMerchLines(row.lines, period).marginBps,
            size: mobile ? 60 : 68,
            render: (row) => {
              const reading = readMerchLines(row.lines, period);
              return (
                <Button
                  variant="ghost"
                  className="merch-month-reading h-auto min-w-0 gap-px px-0.5 py-0.5 text-[0.75rem] font-normal normal-case tracking-normal leading-[1.125rem]"
                  data-under-target={
                    (reading.marginBps !== null &&
                      reading.marginBps < (merchTargetBps(row.lines, period) ?? 0)) ||
                    undefined
                  }
                  aria-label={`${row.label}, ${merchMonthLabel(period)} gross margin ${merchPercent(reading.marginBps)}; ${signed(reading.monthMoveBps)} on the month; ${signed(reading.yearMoveBps)} on the year; inspect drivers`}
                  onClick={(event) => inspect(row, period, event.currentTarget)}
                >
                  <span>{merchPercent(reading.marginBps)}</span>
                  <small data-move={moveTone(reading.monthMoveBps)}>
                    <span className="sr-only">Month over month: </span>
                    {signed(reading.monthMoveBps).replace(/ bp$/, "")}
                  </small>
                  <small data-move={moveTone(reading.yearMoveBps)}>
                    <span className="sr-only">Year over year: </span>
                    {signed(reading.yearMoveBps).replace(/ bp$/, "")}
                  </small>
                </Button>
              );
            },
          })),
        ]
      : createCategoryMarginDriverFields<CategoryRow>({
          rows,
          scopeLines: filtered,
          months,
          month,
          mobile,
        })),
    {
      id: "target",
      title: "Margin target",
      value: (row) => merchTargetBps(row.lines, month),
      render: (row) => merchPercent(merchTargetBps(row.lines, month)),
      size: 120,
    },
    {
      id: "net",
      title: "Review month sales",
      value: (row) => readMerchLines(row.lines, month).netCents,
      render: (row) => merchMoney(readMerchLines(row.lines, month).netCents),
      size: 155,
    },
    {
      id: "month-move",
      title: "Monthly move",
      value: (row) => readMerchLines(row.lines, month).monthMoveBps,
      size: 145,
      render: (row) => (
        <MerchMove lines={row.lines} months={months} month={month} label={row.label} />
      ),
    },
    {
      id: "year",
      title: "Year move",
      value: (row) => readMerchLines(row.lines, month).yearMoveBps,
      render: (row) => signed(readMerchLines(row.lines, month).yearMoveBps),
      size: 110,
    },
    {
      id: "offers",
      title: "Promotion calendar",
      value: (row) => row.lines.reduce((count, line) => count + line.promotions.length, 0),
      size: Math.max(210, months.length * 25),
      render: (row) => (
        <div className="merch-promotion-band">
          {months.map((period) => {
            const count = row.lines.reduce(
              (sum, line) => sum + line.promotions.filter((offer) => offer.month === period).length,
              0,
            );
            return (
              <Button
                key={period}
                variant="ghost"
                size="icon-xs"
                className="merch-promo-dot"
                disabled={!count}
                aria-label={`${row.label}, ${merchMonthLabel(period)}: ${count} promotions`}
                data-active={Boolean(count)}
                onClick={(event) => inspect(row, period, event.currentTarget)}
              >
                <span aria-hidden="true" />
              </Button>
            );
          })}
        </div>
      ),
    },
    {
      id: "actions",
      className: "px-2",
      title: "Actions",
      header: () => <span className="sr-only">Actions</span>,
      value: (row) => row.id,
      size: 42,
      hideable: false,
      render: (row) =>
        row.scope ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`Actions for ${row.label}`}
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
              <DropdownMenuItem
                onSelect={() => {
                  setDetails({
                    title: row.label,
                    lineIds: row.lines.map((line) => line.id),
                    month,
                  });
                }}
              >
                Inspect drivers
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => drill(row)}>
                Drill into {row.label}
              </DropdownMenuItem>
              {row.line && (
                <>
                  <DropdownMenuItem onSelect={() => setEditing({ id: row.line!.id })}>
                    Edit product line
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(row.line!)}>
                    Remove product line
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    },
  ];
  const supplementalStart = fields.findIndex((field) => field.id === "target");
  const displayedFields = mobile
    ? [
        ...fields.slice(0, supplementalStart),
        ...fields.filter((field) => field.id === "actions"),
        ...fields.slice(supplementalStart).filter((field) => field.id !== "actions"),
      ]
    : fields;
  function exportMatchingLines() {
    downloadFile(
      "category-margin-review.csv",
      merchCsv(
        [
          "Department",
          "Product line",
          "Review month",
          "Net sales cents",
          "Gross profit cents",
          "Margin bps",
          "Target margin bps",
          "Month move bps",
          "Year move bps",
        ],
        filtered.map((line) => {
          const value = readMerchLines([line], month);
          return [
            line.department,
            line.name,
            month,
            value.netCents,
            value.profitCents,
            value.marginBps,
            line.targetMarginBps,
            value.monthMoveBps,
            value.yearMoveBps,
          ];
        }),
      ),
      "text/csv",
    );
  }
  return (
    <div
      className="merch-review merch-category"
      data-merch-review="category-margin"
      style={
        {
          "--category-scope-width": `${mobile ? 208 : mode === "drivers" ? 264 : 357}px`,
          "--category-month-width": `${mobile ? 60 : 68}px`,
          "--category-driver-sales-width": `${mobile ? 332 : 374}px`,
          "--category-driver-quarter-width": `${mobile ? 136 : 154}px`,
          "--category-driver-stock-width": "173px",
          "--category-driver-plan-width": `${mobile ? 176 : 208}px`,
        } as CSSProperties
      }
    >
      <DomainRecordGrid
        data={rows}
        fields={displayedFields}
        getRowId={(row) => row.id}
        getSubRows={(row) => row.children}
        expanded={expanded}
        onExpandedChange={setExpanded}
        scrollArea={mobile ? "both" : "horizontal"}
        layout={{ cellBorder: true, columnsPinnable: true }}
        className="merch-category-grid"
        beforeTable={
          <div className="merch-category-overview-panel">
            <CategoryMarginOverview
              scopeLabel={scopeLabel}
              parentLabel={parentLabel}
              lines={filtered}
              parentLines={parentLines}
              months={months}
              month={month}
              mode={mode}
            >
              <nav className="merch-drill merch-category-drill" aria-label="Margin drill path">
                {(lineId || (department && !filtered.length)) && (
                  <Button size="icon-xs" variant="ghost" aria-label={backLabel} onClick={goUp}>
                    <ArrowUp />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-auto min-h-5 px-1 py-0.5 text-[0.6875rem] font-normal normal-case tracking-normal leading-4"
                  aria-current={!department && !lineId ? "page" : undefined}
                  onClick={() => {
                    setDepartment(null);
                    setLineId(null);
                    setExpanded({});
                  }}
                >
                  All departments
                </Button>
                {department && (
                  <>
                    <ChevronRight aria-hidden="true" />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto min-h-5 px-1 py-0.5 text-[0.6875rem] font-normal normal-case tracking-normal leading-4"
                      aria-current={!lineId ? "page" : undefined}
                      onClick={() => setLineId(null)}
                    >
                      {department}
                    </Button>
                  </>
                )}
                {currentLine && (
                  <>
                    <ChevronRight aria-hidden="true" />
                    <span aria-current="page">{currentLine.name}</span>
                  </>
                )}
              </nav>
            </CategoryMarginOverview>
          </div>
        }
        renderFrame={(content, table) => (
          <Frame dense spacing="sm" className="merch-category-frame">
            <CategoryMarginPinnedActions table={table} mobile={mobile} />
            <FrameHeader className="merch-category-header">
              <FrameTitle className="merch-category-title">Category margin workbench</FrameTitle>
              <ToggleGroup
                value={[mode]}
                onValueChange={(value) => {
                  const selected = value[0];
                  if (selected === "months" || selected === "drivers") setMode(selected);
                }}
                variant="outline"
                size="sm"
                spacing={0}
                className="merch-category-view"
                aria-label="Margin view"
              >
                <ToggleGroupItem value="months">
                  <CalendarDays /> Months
                </ToggleGroupItem>
                <ToggleGroupItem value="drivers">
                  <ChartColumnIncreasing /> Drivers
                </ToggleGroupItem>
              </ToggleGroup>
              <div className="merch-category-toolbar">
                <Input
                  aria-label="Search category margin"
                  placeholder="Search lines"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Review period"
                      title="Review period"
                    >
                      <CalendarDays />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="merch-category-period">
                    <MerchChoice
                      id="category-month"
                      label="Review month"
                      value={month}
                      onChange={setMonth}
                      options={reviewMonths.map((value) => ({
                        value,
                        label: merchMonthLabel(value),
                      }))}
                    />
                    <MerchChoice
                      id="category-window"
                      label="Month columns"
                      value={window}
                      onChange={setWindow}
                      options={[
                        { value: "recent6", label: "Latest six months" },
                        { value: "recent12", label: "Latest twelve months" },
                        { value: "prior12", label: "Previous twelve months" },
                      ]}
                    />
                    <p className="merch-category-period-label">
                      Review month totals · {merchMonthLabel(month)}
                    </p>
                    <MerchSummary>
                      <MerchStat
                        label="Gross margin"
                        value={merchPercent(total.marginBps)}
                        detail={`${signed(total.monthMoveBps)} month · ${signed(total.yearMoveBps)} year`}
                      />
                      <MerchStat
                        label="Net sales"
                        value={merchMoney(total.netCents)}
                        detail={`${filtered.length} matching product lines`}
                      />
                      <MerchStat label="Gross profit" value={merchMoney(total.profitCents)} />
                      <MerchStat
                        label="Sales to plan"
                        value={merchPercent(total.attainmentBps)}
                        detail={`${merchMoney(total.planVarianceCents)} variance`}
                      />
                    </MerchSummary>
                  </PopoverContent>
                </Popover>
                <Filters
                  fields={filters}
                  query={query}
                  onQueryChange={setQuery}
                  variant="advanced"
                  advancedMode="popover"
                  trigger={
                    <Button variant="outline" size="icon-sm" aria-label="Filters" title="Filters">
                      <SlidersHorizontal />
                    </Button>
                  }
                  menuClassName="max-w-[calc(100vw-16px)]"
                />
                <DataGridColumnVisibility
                  table={table}
                  trigger={
                    <Button variant="outline" size="icon-sm" aria-label="Columns" title="Columns">
                      <SlidersHorizontal />
                    </Button>
                  }
                />
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Export matching lines"
                  title="Export matching lines"
                  onClick={exportMatchingLines}
                >
                  <Download />
                </Button>
                <Button
                  ref={addButton}
                  size="sm"
                  className="merch-category-add"
                  aria-label="Add product line"
                  title="Add product line"
                  onClick={(event) => {
                    opener.current = event.currentTarget;
                    setEditing({ id: null });
                  }}
                  disabled={!book.brands.length}
                >
                  <Plus /> <span>Add line</span>
                </Button>
              </div>
            </FrameHeader>
            <FrameTitle className="sr-only">Monthly gross margin</FrameTitle>
            {content}
            <FramePanel fit className="merch-category-footer">
              <FrameDescription>
                Local trading review · Recorded through {reviewAsOf}
              </FrameDescription>
              {message && <p role="status">{message}</p>}
              <div className="merch-category-footer-actions">
                <Button size="sm" variant="ghost" disabled={!canUndo} onClick={undo}>
                  <Undo2 /> Undo
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(event) => {
                    opener.current = event.currentTarget;
                    setDetails({
                      title: "Matching portfolio",
                      lineIds: filtered.map((line) => line.id),
                      month,
                    });
                  }}
                >
                  Review full scope <ArrowUpRight />
                </Button>
              </div>
            </FramePanel>
          </Frame>
        )}
      />
      <MerchDrivers
        open={Boolean(details)}
        title={details?.title ?? "Trading drivers"}
        lines={book.lines.filter((line) => details?.lineIds.includes(line.id))}
        month={details?.month ?? month}
        months={months}
        opener={opener}
        onClose={() => setDetails(null)}
      />
      {editing && (
        <MerchLineEditor
          key={`${editing.id}-${month}`}
          book={book}
          line={book.lines.find((line) => line.id === editing.id) ?? null}
          month={month}
          opener={opener}
          onClose={() => setEditing(null)}
          onSave={(draft) =>
            commit(
              saveMerchLine(book, editing.id, draft),
              editing.id
                ? "Updated this product line's review month."
                : "Created a product line with its first recorded month.",
            )
          }
        />
      )}
      <AlertDialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes its local trading history. Undo restores the complete line.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removing) return;
                commit(
                  { ...book, lines: book.lines.filter((line) => line.id !== removing.id) },
                  "Product line removed. Undo is available.",
                );
                if (lineId === removing.id) setLineId(null);
                setRemoving(null);
              }}
            >
              Remove product line
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
