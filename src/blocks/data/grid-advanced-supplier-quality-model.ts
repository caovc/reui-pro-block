/**
 * Bricklane-authored demonstration records and review rules.
 * Public feature brief: /blocks/data-grid/advanced/data-grid-advanced-18.
 * No vendor records, paid block code or preview media are included.
 */
export const QUALITY_AS_OF = "2026-11-23";
export const QUALITY_DIVISIONS = ["Electronics", "Packaging", "Materials", "Components"] as const;
export const QUALITY_TIERS = ["Strategic", "Core", "Trial"] as const;
export const LOT_DISPOSITIONS = ["Accepted", "Review", "Rejected"] as const;
export type QualityDivision = (typeof QUALITY_DIVISIONS)[number];
export type QualityTier = (typeof QUALITY_TIERS)[number];
export type LotDisposition = (typeof LOT_DISPOSITIONS)[number];
export type QualityPeriod = "All inspected lots" | "Last 90 days" | "Last 30 days";
export type InspectionLot = {
  id: string;
  received: string;
  score: number;
  units: number;
  disposition: LotDisposition;
  note: string;
};
export type QualitySupplier = {
  id: string;
  name: string;
  division: QualityDivision;
  tier: QualityTier;
  owner: string;
  lots: InspectionLot[];
  monthlySpendCents: number[];
};
export type QualityMetrics = {
  lots: number;
  units: number;
  acceptedLots: number;
  acceptance: number | null;
  weightedScore: number | null;
  reviewLots: number;
  rejectedLots: number;
  spendCents: number;
  monthlySpendCents: number[];
};
export type QualityFilters = {
  search: string;
  divisions: string[];
  tiers: string[];
  disposition: string[];
  period: QualityPeriod;
};

export const QUALITY_MONTHS = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(Date.UTC(2025, 11 + index, 1));
  return {
    key: date.toISOString().slice(0, 7),
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date),
  };
});

export function createQualitySuppliers(): QualitySupplier[] {
  const names = [
    "Aster Circuit Works",
    "Copperleaf Systems",
    "Northlight Devices",
    "Foldwell Packaging",
    "Papercrest Studio",
    "Harbor Carton Co.",
    "Fieldstone Materials",
    "Larkspur Polymers",
    "Silverpine Alloys",
    "Cedarline Precision",
    "Brookforge Parts",
    "Canopy Fasteners",
  ];
  const owners = ["Amara Ortiz", "Theo Mercer", "Maya Brooks", "Noah Reed"];
  return names.map((name, index): QualitySupplier => ({
    id: `supplier-${index + 1}`,
    name,
    division: QUALITY_DIVISIONS[Math.floor(index / 3)],
    tier: QUALITY_TIERS[index % QUALITY_TIERS.length],
    owner: owners[Math.floor(index / 3)],
    lots: Array.from({ length: 9 }, (_, lot): InspectionLot => {
      const score = 58 + ((index * 11 + lot * 7) % 42);
      const month = lot < 2 ? "08" : lot < 5 ? "10" : "11";
      return {
        id: `lot-${index + 1}-${lot + 1}`,
        received: `2026-${month}-${String(3 + ((index + lot * 2) % 18)).padStart(2, "0")}`,
        score,
        units: 120 + ((index * 53 + lot * 37) % 880),
        disposition: score >= 80 ? "Accepted" : score >= 68 ? "Review" : "Rejected",
        note: lot % 3 === 0 ? "Dimensional inspection completed." : "",
      };
    }),
    monthlySpendCents: QUALITY_MONTHS.map(
      (_, month) => (11800 + index * 1700 + month * 460 + ((index + month) % 4) * 2100) * 100,
    ),
  }));
}

function periodStart(period: QualityPeriod): string {
  const date = new Date(`${QUALITY_AS_OF}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (period === "Last 30 days" ? 29 : 89));
  return date.toISOString().slice(0, 10);
}

export function qualityLots(
  supplier: QualitySupplier,
  period: QualityPeriod,
  dispositions: readonly string[] = [],
): InspectionLot[] {
  return supplier.lots.filter(
    (lot) =>
      lot.received <= QUALITY_AS_OF &&
      (period === "All inspected lots" || lot.received >= periodStart(period)) &&
      (!dispositions.length || dispositions.includes(lot.disposition)),
  );
}

/** Acceptance counts lots; score is weighted by their inspected unit counts. */
export function qualityMetrics(
  suppliers: QualitySupplier[],
  period: QualityPeriod = "All inspected lots",
  dispositions: readonly string[] = [],
): QualityMetrics {
  const lots = suppliers.flatMap((supplier) => qualityLots(supplier, period, dispositions));
  const units = lots.reduce((sum, lot) => sum + lot.units, 0);
  const acceptedLots = lots.filter((lot) => lot.disposition === "Accepted").length;
  const monthlySpendCents = QUALITY_MONTHS.map((_, month) =>
    suppliers.reduce((sum, supplier) => sum + (supplier.monthlySpendCents[month] ?? 0), 0),
  );
  return {
    lots: lots.length,
    units,
    acceptedLots,
    acceptance: lots.length ? (acceptedLots / lots.length) * 100 : null,
    weightedScore: units ? lots.reduce((sum, lot) => sum + lot.score * lot.units, 0) / units : null,
    reviewLots: lots.filter((lot) => lot.disposition === "Review").length,
    rejectedLots: lots.filter((lot) => lot.disposition === "Rejected").length,
    spendCents: monthlySpendCents.reduce((sum, value) => sum + value, 0),
    monthlySpendCents,
  };
}

export function filterQualitySuppliers(
  suppliers: QualitySupplier[],
  filters: QualityFilters,
): QualitySupplier[] {
  const search = filters.search.trim().toLowerCase();
  return suppliers.filter((supplier) => {
    const lots = qualityLots(supplier, filters.period);
    return (
      (!search ||
        [supplier.name, supplier.division, supplier.owner, supplier.tier]
          .join(" ")
          .toLowerCase()
          .includes(search)) &&
      (!filters.divisions.length || filters.divisions.includes(supplier.division)) &&
      (!filters.tiers.length || filters.tiers.includes(supplier.tier)) &&
      (!filters.disposition.length ||
        lots.some((lot) => filters.disposition.includes(lot.disposition)))
    );
  });
}

export function saveQualitySupplier(
  suppliers: QualitySupplier[],
  supplier: QualitySupplier,
): { suppliers: QualitySupplier[]; error: string | null } {
  const fail = (error: string) => ({ suppliers, error });
  if (!supplier.id || !supplier.name.trim()) return fail("Enter a supplier name.");
  if (!QUALITY_DIVISIONS.includes(supplier.division)) return fail("Choose a division.");
  if (!QUALITY_TIERS.includes(supplier.tier)) return fail("Choose a supplier tier.");
  if (!supplier.owner.trim()) return fail("Enter a review owner.");
  if (
    supplier.monthlySpendCents.length !== 12 ||
    supplier.monthlySpendCents.some((value) => !Number.isSafeInteger(value) || value < 0) ||
    !Number.isSafeInteger(supplier.monthlySpendCents.reduce((sum, value) => sum + value, 0))
  )
    return fail("Enter twelve nonnegative monthly spend amounts in whole cents.");
  if (
    suppliers.some(
      (item) =>
        item.id !== supplier.id && item.name.toLowerCase() === supplier.name.trim().toLowerCase(),
    )
  )
    return fail("A supplier with this name already exists.");
  const next = { ...supplier, name: supplier.name.trim(), owner: supplier.owner.trim() };
  return {
    suppliers: suppliers.some((item) => item.id === supplier.id)
      ? suppliers.map((item) => (item.id === supplier.id ? next : item))
      : [...suppliers, next],
    error: null,
  };
}

export function saveInspectionLot(
  suppliers: QualitySupplier[],
  supplierId: string,
  lot: InspectionLot,
): { suppliers: QualitySupplier[]; error: string | null } {
  const fail = (error: string) => ({ suppliers, error });
  const supplier = suppliers.find((item) => item.id === supplierId);
  if (!supplier) return fail("This supplier is no longer available.");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(lot.received)
    ? new Date(`${lot.received}T12:00:00Z`)
    : null;
  if (
    !lot.id ||
    !date ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== lot.received ||
    lot.received > QUALITY_AS_OF
  )
    return fail("Enter a valid received date on or before November 23, 2026.");
  if (!Number.isFinite(lot.score) || lot.score < 0 || lot.score > 100)
    return fail("Enter a quality score from 0 to 100.");
  if (!Number.isSafeInteger(lot.units) || lot.units <= 0)
    return fail("Enter a positive whole number of inspected units.");
  if (!LOT_DISPOSITIONS.includes(lot.disposition)) return fail("Choose a disposition.");
  if (
    suppliers.some(
      (item) => item.id !== supplierId && item.lots.some((existing) => existing.id === lot.id),
    )
  )
    return fail("This lot belongs to another supplier.");
  const next = { ...lot, note: lot.note.trim() };
  return {
    suppliers: suppliers.map((item) =>
      item.id !== supplierId
        ? item
        : {
            ...item,
            lots: item.lots.some((existing) => existing.id === lot.id)
              ? item.lots.map((existing) => (existing.id === lot.id ? next : existing))
              : [...item.lots, next],
          },
    ),
    error: null,
  };
}
