import { useCallback, useMemo, useRef, useState } from "react";
import { Columns3, Ellipsis, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Facet } from "./grid-base-common";
import {
  DomainGridSurface,
  useDomainGrid,
  type DomainColumn,
  type ExpandedState,
} from "./grid-advanced-model-grid";
import { MiniTrend } from "./sparkline-primitives";
import { LotDispositionKey, LotSwarm } from "./grid-advanced-review-charts";
import { InspectionEditor, SupplierEditor } from "./grid-advanced-supplier-quality-editors";
import {
  LOT_DISPOSITIONS,
  QUALITY_AS_OF,
  QUALITY_DIVISIONS,
  QUALITY_MONTHS,
  QUALITY_TIERS,
  createQualitySuppliers,
  filterQualitySuppliers,
  qualityLots,
  qualityMetrics,
  saveInspectionLot,
  saveQualitySupplier,
  type InspectionLot,
  type QualityDivision,
  type QualityFilters,
  type QualitySupplier,
} from "./grid-advanced-supplier-quality-model";
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

type QualityRow = {
  id: string;
  name: string;
  division: QualityDivision;
  suppliers: QualitySupplier[];
  supplier?: QualitySupplier;
  children?: QualityRow[];
};
type QualityDialog =
  | { view: "supplier"; supplier: QualitySupplier; existing: boolean }
  | { view: "list"; supplierId: string }
  | { view: "lot"; supplierId: string; lot: InspectionLot; existing: boolean };

function SupplierMenu({
  supplier,
  onOpen,
  onCapture,
}: {
  supplier: QualitySupplier;
  onOpen: (view: "supplier" | "new-lot") => void;
  onCapture: (element: HTMLButtonElement | null) => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <DropdownMenu onOpenChange={(open) => open && onCapture(trigger.current)}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={trigger}
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${supplier.name}`}
        >
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="reui-reference" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onOpen("supplier")}>Edit supplier</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onOpen("new-lot")}>Add inspection</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function SupplierQualityBoard() {
  const history = useReviewHistory(createQualitySuppliers);
  const [filters, setFilters] = useState<QualityFilters>({
    search: "",
    divisions: [],
    tiers: [],
    disposition: [],
    period: "All inspected lots",
  });
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [dialog, setDialog] = useState<QualityDialog | null>(null);
  const opener = useRef<HTMLElement | SVGElement | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const visible = useMemo(
    () => filterQualitySuppliers(history.value, filters),
    [history.value, filters],
  );
  const summary = useMemo(
    () => qualityMetrics(visible, filters.period, filters.disposition),
    [visible, filters.period, filters.disposition],
  );
  const rows = useMemo<QualityRow[]>(
    () =>
      QUALITY_DIVISIONS.flatMap((division) => {
        const suppliers = visible.filter((supplier) => supplier.division === division);
        return suppliers.length
          ? [
              {
                id: `division-${division}`,
                name: division,
                division,
                suppliers,
                children: suppliers.map((supplier) => ({
                  id: supplier.id,
                  name: supplier.name,
                  division,
                  suppliers: [supplier],
                  supplier,
                })),
              },
            ]
          : [];
      }),
    [visible],
  );
  const changeFilters = (next: Partial<QualityFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setExpanded(true);
  };
  const openLot = useCallback(
    (supplierId: string, lot: InspectionLot, target?: HTMLElement | SVGElement) => {
      if (target) opener.current = target;
      setDialog({ view: "lot", supplierId, lot: { ...lot }, existing: true });
    },
    [],
  );
  const newLot = useCallback(
    (supplierId: string) =>
      setDialog({
        view: "lot",
        supplierId,
        existing: false,
        lot: {
          id: `lot-${crypto.randomUUID().slice(0, 8)}`,
          received: QUALITY_AS_OF,
          score: 85,
          units: 100,
          disposition: "Review",
          note: "",
        },
      }),
    [],
  );
  const metrics = useCallback(
    (row: QualityRow) => qualityMetrics(row.suppliers, filters.period, filters.disposition),
    [filters.period, filters.disposition],
  );
  const columns = useMemo<DomainColumn<QualityRow>[]>(
    () => [
      {
        id: "supplier",
        header: "Supplier / division",
        accessorFn: (row) => row.name,
        size: 270,
        enableHiding: false,
        cell: ({ row }) =>
          row.original.supplier ? (
            <div className="review-identity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setDialog({ view: "supplier", supplier: row.original.supplier!, existing: true });
                }}
              >
                {row.original.name}
              </Button>
              <span>{row.original.supplier.owner}</span>
            </div>
          ) : (
            <div className="review-group-identity">
              <DataGridTableRowExpand row={row} />
              <strong>{row.original.name}</strong>
              <Badge variant="secondary">{row.original.suppliers.length}</Badge>
            </div>
          ),
      },
      {
        id: "tier",
        header: "Tier",
        accessorFn: (row) => row.supplier?.tier ?? "",
        size: 100,
        cell: ({ row }) =>
          row.original.supplier ? (
            <Badge variant="outline">{row.original.supplier.tier}</Badge>
          ) : null,
      },
      {
        id: "lots",
        header: "Lots",
        accessorFn: (row) => metrics(row).lots,
        size: 80,
        cell: ({ row }) =>
          row.original.supplier ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Inspections for ${row.original.name}`}
              onClick={(event) => {
                opener.current = event.currentTarget;
                setDialog({ view: "list", supplierId: row.original.supplier!.id });
              }}
            >
              {metrics(row.original).lots}
            </Button>
          ) : (
            <strong>{metrics(row.original).lots}</strong>
          ),
      },
      {
        id: "score",
        accessorFn: (row) => metrics(row).weightedScore ?? -1,
        header: ({ column }) => (
          <div className="review-score-header">
            <DataGridColumnHeader column={column} title="Inspection score" />
            <div aria-hidden="true">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        ),
        meta: { headerTitle: "Inspection score" },
        size: 280,
        cell: ({ row }) =>
          row.original.supplier ? (
            <LotSwarm
              lots={qualityLots(row.original.supplier, filters.period, filters.disposition)}
              onOpen={(lot, target) => openLot(row.original.supplier!.id, lot, target)}
            />
          ) : (
            <span className="review-group-value">
              {metrics(row.original).weightedScore?.toFixed(1) ?? "—"}
              <small>weighted mean</small>
            </span>
          ),
      },
      {
        id: "acceptance",
        header: "Acceptance",
        accessorFn: (row) => metrics(row).acceptance ?? -1,
        size: 120,
        cell: ({ row }) => (
          <div className="review-number-cell">
            <strong>{reviewPercent(metrics(row.original).acceptance)}</strong>
            <small>
              {metrics(row.original).acceptedLots} of {metrics(row.original).lots} lots
            </small>
          </div>
        ),
      },
      {
        id: "spend",
        header: "12-mo spend",
        accessorFn: (row) => metrics(row).spendCents,
        size: 140,
        cell: ({ row }) => (
          <strong className="review-tabular">
            {reviewMoney(metrics(row.original).spendCents, "USD", true)}
          </strong>
        ),
      },
      {
        id: "trend",
        header: "Spend trend",
        accessorFn: (row) => metrics(row).spendCents,
        size: 160,
        cell: ({ row }) => (
          <MiniTrend
            values={metrics(row.original).monthlySpendCents}
            label={`${row.original.name} monthly spend`}
            names={QUALITY_MONTHS.map((month) => month.label)}
            height={38}
            color="var(--chart-1)"
            tooltips
            keyboard
            format={(value) => reviewMoney(value, "USD", true)}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        size: 64,
        cell: ({ row }) =>
          row.original.supplier ? (
            <SupplierMenu
              supplier={row.original.supplier}
              onCapture={(target) => {
                opener.current = target;
              }}
              onOpen={(view) =>
                view === "supplier"
                  ? setDialog({
                      view: "supplier",
                      supplier: row.original.supplier!,
                      existing: true,
                    })
                  : newLot(row.original.supplier!.id)
              }
            />
          ) : null,
      },
    ],
    [metrics, filters.period, filters.disposition, openLot, newLot],
  );
  const table = useDomainGrid({
    data: rows,
    columns,
    getSubRows: (row) => row.children,
    getRowId: (row) => row.id,
    expanded,
    onExpandedChange: setExpanded,
  });
  const selectedSupplier =
    dialog && dialog.view !== "supplier"
      ? history.value.find((supplier) => supplier.id === dialog.supplierId)
      : null;
  const saveSupplier = (supplier: QualitySupplier) => {
    const result = saveQualitySupplier(history.value, supplier);
    if (result.error) return result.error;
    history.commit(() => result.suppliers);
    setDialog(null);
    if (dialog?.view === "supplier" && !dialog.existing)
      changeFilters({ search: "", divisions: [supplier.division], tiers: [], disposition: [] });
    toast.success("Supplier saved");
    return null;
  };
  const saveLot = (lot: InspectionLot) => {
    if (dialog?.view !== "lot") return "Choose a supplier first.";
    const result = saveInspectionLot(history.value, dialog.supplierId, lot);
    if (result.error) return result.error;
    history.commit(() => result.suppliers);
    setDialog(null);
    toast.success(dialog.existing ? "Inspection review saved" : "Inspection added");
    return null;
  };
  return (
    <section
      className="review-board supplier-quality-board mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-12"
      aria-label="Supplier Quality Board"
    >
      <DomainGridSurface
        table={table}
        scrollArea="both"
        layout={{
          width: "fixed",
          headerSticky: true,
          columnsResizable: true,
          columnsVisibility: true,
          columnsPinnable: true,
        }}
        renderFrame={(content) => (
          <Frame spacing="sm">
            <FrameHeader className="review-header">
              <div>
                <FrameTitle>
                  <h2>Supplier Quality Board</h2>
                </FrameTitle>
                <FrameDescription>
                  Review inspections, supplier acceptance and spending.
                </FrameDescription>
              </div>
              <ReviewActions
                canUndo={history.canUndo}
                exportDisabled={!visible.length}
                onUndo={history.undo}
                onExport={() =>
                  reviewCsv(
                    "supplier-quality",
                    visible.map((supplier) => {
                      const value = metrics({
                        id: supplier.id,
                        name: supplier.name,
                        division: supplier.division,
                        suppliers: [supplier],
                        supplier,
                      });
                      return {
                        Supplier: supplier.name,
                        Division: supplier.division,
                        Tier: supplier.tier,
                        InspectedLots: value.lots,
                        AcceptedLots: value.acceptedLots,
                        AcceptancePercent: value.acceptance,
                        WeightedQualityScore: value.weightedScore,
                        TwelveMonthSpendUSD: value.spendCents / 100,
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
                      view: "supplier",
                      existing: false,
                      supplier: {
                        id: crypto.randomUUID(),
                        name: "",
                        division:
                          QUALITY_DIVISIONS.find((division) =>
                            filters.divisions.includes(division),
                          ) ?? "Electronics",
                        tier: "Trial",
                        owner: "Amara Ortiz",
                        lots: [],
                        monthlySpendCents: Array(12).fill(0),
                      },
                    });
                  }}
                >
                  <Plus aria-hidden="true" />
                  Add supplier
                </Button>
              </ReviewActions>
            </FrameHeader>
            <FramePanel className="review-panel">
              <div className="review-toolbar">
                <ReviewSearch
                  label="Search suppliers"
                  value={filters.search}
                  onChange={(search) => changeFilters({ search })}
                />
                <Facet
                  label="Division"
                  options={[...QUALITY_DIVISIONS]}
                  value={filters.divisions}
                  onChange={(divisions) => changeFilters({ divisions })}
                />
                <Facet
                  label="Tier"
                  options={[...QUALITY_TIERS]}
                  value={filters.tiers}
                  onChange={(tiers) => changeFilters({ tiers })}
                />
                <Facet
                  label="Lot disposition"
                  options={[...LOT_DISPOSITIONS]}
                  value={filters.disposition}
                  onChange={(disposition) => changeFilters({ disposition })}
                />
                <ReviewSelect
                  label="Inspection period"
                  value={filters.period}
                  options={["All inspected lots", "Last 90 days", "Last 30 days"]}
                  onChange={(period) =>
                    changeFilters({ period: period as QualityFilters["period"] })
                  }
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
              <ReviewSummary
                values={[
                  { label: "Suppliers", value: visible.length },
                  { label: "Inspected lots", value: summary.lots },
                  { label: "Accepted lots", value: reviewPercent(summary.acceptance) },
                  { label: "Weighted quality", value: summary.weightedScore?.toFixed(1) ?? "—" },
                  { label: "12-month spend", value: reviewMoney(summary.spendCents, "USD", true) },
                ]}
              />
              {content}
              <div className="review-footnote">
                <LotDispositionKey />
                <span>Acceptance counts lots. Quality scores are weighted by inspected units.</span>
                <span>Spend: Dec 2025–Nov 2026.</span>
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
              {dialog?.view === "supplier"
                ? dialog.existing
                  ? "Edit supplier"
                  : "Add supplier"
                : dialog?.view === "list"
                  ? "Supplier inspections"
                  : dialog?.view === "lot" && dialog.existing
                    ? "Review inspection"
                    : "Add inspection"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.view === "supplier"
                ? "Keep ownership, division and the current month's spend up to date."
                : (selectedSupplier?.name ?? "Inspection details")}
            </DialogDescription>
          </DialogHeader>
          {dialog?.view === "supplier" ? (
            <SupplierEditor
              key={dialog.supplier.id}
              initial={dialog.supplier}
              existing={dialog.existing}
              onSave={saveSupplier}
              onCancel={() => setDialog(null)}
            />
          ) : dialog?.view === "lot" ? (
            <InspectionEditor
              key={dialog.lot.id}
              initial={dialog.lot}
              existing={dialog.existing}
              onSave={saveLot}
              onCancel={() => setDialog(null)}
            />
          ) : dialog?.view === "list" && selectedSupplier ? (
            <div className="review-inspection-list">
              <ul>
                {selectedSupplier.lots
                  .toSorted((a, b) => b.received.localeCompare(a.received))
                  .map((lot) => (
                    <li key={lot.id}>
                      <div>
                        <strong>
                          {lot.received} · {lot.score}/100
                        </strong>
                        <span>
                          {lot.units.toLocaleString()} units · {lot.disposition}
                        </span>
                        {lot.note && <p>{lot.note}</p>}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Review ${lot.id}`}
                        onClick={() => openLot(selectedSupplier.id, lot)}
                      >
                        Review
                      </Button>
                    </li>
                  ))}
              </ul>
              {!selectedSupplier.lots.length && (
                <p className="review-muted">No inspections have been recorded for this supplier.</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  Close
                </Button>
                <Button onClick={() => newLot(selectedSupplier.id)}>Add inspection</Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
