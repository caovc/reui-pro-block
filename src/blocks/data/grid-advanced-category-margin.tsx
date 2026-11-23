import { useRef, useState } from "react";
import {
  ArrowUpRight,
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
import { DEFAULT_FILTER_OPERATORS } from "@/components/reui/filters/filters-operators";
import {
  DomainRecordGrid,
  type DomainField,
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
import "./grid-advanced-merch-review.css";

type CategoryRow = {
  id: string;
  label: string;
  department: string;
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

export default function CategoryMargin() {
  const { book, commit, undo, message, canUndo } = useMerchBook();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(createFilterQuery);
  const [window, setWindow] = useState("recent6");
  const [month, setMonth] = useState(reviewMonths.at(-1)!);
  const [department, setDepartment] = useState<string | null>(null);
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
  const filtered = book.lines.filter((line) => {
    const reading = readMerchLines([line], month);
    const brand = book.brands.find((item) => item.id === line.brandId);
    return (
      (!department || line.department === department) &&
      (!lineId || line.id === lineId) &&
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
  const rowFor = (line: MerchLine): CategoryRow => ({
    id: line.id,
    label: line.name,
    department: line.department,
    lines: [line],
    line,
  });
  const rows: CategoryRow[] =
    department || lineId
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
  const fields: DomainField<CategoryRow>[] = [
    {
      id: "scope",
      title: "Department / product line",
      value: (row) => row.label,
      size: 245,
      hideable: false,
      render: (record, _index, nativeRow) => (
        <div className="flex min-w-0 items-center gap-1">
          <DataGridTableRowExpand row={nativeRow} />
          <Button
            variant="ghost"
            size="sm"
            className="min-w-0 justify-start px-1"
            onClick={() => drill(record)}
          >
            {record.label}
          </Button>
          {!record.line && (
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
      ),
    },
    ...months.map((period): DomainField<CategoryRow> => ({
      id: period,
      title: merchMonthLabel(period),
      value: (row) => readMerchLines(row.lines, period).marginBps,
      size: 125,
      render: (row) => {
        const reading = readMerchLines(row.lines, period);
        return (
          <Button
            variant="ghost"
            className="merch-month-reading"
            data-under-target={
              (reading.marginBps !== null &&
                reading.marginBps < (merchTargetBps(row.lines, period) ?? 0)) ||
              undefined
            }
            aria-label={`${row.label}, ${merchMonthLabel(period)} gross margin ${merchPercent(reading.marginBps)}; inspect drivers`}
            onClick={(event) => inspect(row, period, event.currentTarget)}
          >
            <span>{merchPercent(reading.marginBps)}</span>
            <small data-negative={(reading.monthMoveBps ?? 0) < 0 || undefined}>
              {signed(reading.monthMoveBps)}
            </small>
          </Button>
        );
      },
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
      title: "Actions",
      value: (row) => row.id,
      size: 90,
      hideable: false,
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
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
                setDetails({ title: row.label, lineIds: row.lines.map((line) => line.id), month });
              }}
            >
              Inspect drivers
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => drill(row)}>Drill into {row.label}</DropdownMenuItem>
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
  return (
    <div className="merch-review" data-merch-review="category-margin">
      <Frame className="min-w-0">
        <FrameHeader className="flex-wrap gap-3">
          <div>
            <FrameTitle>Category margin workbench</FrameTitle>
            <FrameDescription>
              Local trading review · Recorded through {reviewAsOf}
            </FrameDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={!canUndo} onClick={undo}>
              <Undo2 /> Undo
            </Button>
            <Button
              ref={addButton}
              size="sm"
              onClick={(event) => {
                opener.current = event.currentTarget;
                setEditing({ id: null });
              }}
              disabled={!book.brands.length}
            >
              <Plus /> Add product line
            </Button>
          </div>
        </FrameHeader>
        <FramePanel>
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
        </FramePanel>
      </Frame>
      <div className="merch-toolbar">
        <Input
          aria-label="Search category margin"
          placeholder="Search product, department or brand"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <MerchChoice
          id="category-month"
          label="Review month"
          value={month}
          onChange={setMonth}
          options={reviewMonths.map((value) => ({ value, label: merchMonthLabel(value) }))}
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
        <Filters
          fields={filters}
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
      <nav className="merch-drill" aria-label="Margin drill path">
        <Button
          size="sm"
          variant="ghost"
          aria-current={!department && !lineId ? "page" : undefined}
          onClick={() => {
            setDepartment(null);
            setLineId(null);
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
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <DomainRecordGrid
        data={rows}
        fields={fields}
        getRowId={(row) => row.id}
        getSubRows={(row) => row.children}
        expanded={expanded}
        onExpandedChange={setExpanded}
        scrollArea="horizontal"
        renderFrame={(content, table) => (
          <Frame className="min-w-0">
            <FrameHeader className="flex-wrap gap-3">
              <div>
                <FrameTitle>Monthly gross margin</FrameTitle>
                <FrameDescription>
                  Revenue-weighted department totals; expand a row or follow its drill path.
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
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
                    )
                  }
                >
                  <Download /> Export matching lines
                </Button>
              </div>
            </FrameHeader>
            {content}
            <FramePanel className="flex flex-wrap items-center justify-between gap-3 border-t py-3 text-sm">
              <span>Promotion dots open the recorded offers and trading drivers.</span>
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
