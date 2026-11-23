/** Fictional companies; province coordinates are an original schematic locator. */
export const SCALEUP_YEARS = [2024, 2025, 2026] as const;
export const SCALEUP_PROVINCES = [
  { id: "drenthe", name: "Drenthe", x: 73, y: 31 },
  { id: "flevoland", name: "Flevoland", x: 46, y: 45 },
  { id: "friesland", name: "Friesland", x: 49, y: 14 },
  { id: "gelderland", name: "Gelderland", x: 61, y: 59 },
  { id: "groningen", name: "Groningen", x: 78, y: 12 },
  { id: "limburg", name: "Limburg", x: 69, y: 88 },
  { id: "north-brabant", name: "North Brabant", x: 47, y: 78 },
  { id: "north-holland", name: "North Holland", x: 28, y: 34 },
  { id: "overijssel", name: "Overijssel", x: 72, y: 47 },
  { id: "south-holland", name: "South Holland", x: 25, y: 61 },
  { id: "utrecht", name: "Utrecht", x: 43, y: 57 },
  { id: "zeeland", name: "Zeeland", x: 13, y: 80 },
] as const;
export type ScaleupProvince = (typeof SCALEUP_PROVINCES)[number]["id"];
export const SCALEUP_CHECKS = ["independent", "audited", "recurring"] as const;
export type ScaleupCheck = (typeof SCALEUP_CHECKS)[number];
export const SCREEN_ANSWERS = ["Yes", "No", "N/A"] as const;
export type ScreenAnswer = (typeof SCREEN_ANSWERS)[number];
export type ScaleupFact = {
  year: number;
  revenueCents: number;
  grossProfitCents: number;
  employees: number;
};
export type ScaleupCompany = {
  id: string;
  name: string;
  province: ScaleupProvince;
  sector: string;
  founded: number;
  checks: Record<ScaleupCheck, ScreenAnswer>;
  facts: ScaleupFact[];
};
export type ScaleupMetrics = {
  revenueCents: number | null;
  grossProfitCents: number | null;
  margin: number | null;
  employees: number | null;
  growth: number | null;
  eligible: boolean;
};
export type RankedScaleup = {
  company: ScaleupCompany;
  metrics: ScaleupMetrics;
  provinceRank: number | null;
  overallRank: number | null;
};

export function createScaleupCompanies(): ScaleupCompany[] {
  const names = [
    "Cedar Robotics",
    "Orbit Canals",
    "Larkwell Energy",
    "Northbeam Labs",
    "Fieldline Software",
    "Aster Medical",
    "Harborloop Logistics",
    "Pineglass Analytics",
    "Mossvale Foods",
    "Cloudwoven Systems",
    "Brindle Materials",
    "Canopy Mobility",
    "Juniper Instruments",
    "Lakefront Security",
    "Stonepath Devices",
    "Silverleaf Renewables",
  ];
  return names.map((name, index): ScaleupCompany => {
    const baseRevenue = (1800000 + index * 310000) * 100;
    const annualGrowth = 1.12 + (index % 7) * 0.035;
    return {
      id: `scaleup-${index + 1}`,
      name,
      province: SCALEUP_PROVINCES[index % SCALEUP_PROVINCES.length].id,
      sector: ["Technology", "Industry", "Energy", "Health"][index % 4],
      founded: 2011 + (index % 9),
      checks: {
        independent: "Yes",
        audited: index % 6 === 0 ? "No" : "Yes",
        recurring: index % 5 === 0 ? "N/A" : "Yes",
      },
      facts: Array.from({ length: 6 }, (_, step) => {
        const revenueCents = Math.round(baseRevenue * annualGrowth ** step);
        return {
          year: 2021 + step,
          revenueCents,
          grossProfitCents: Math.round(revenueCents * (0.18 + (index % 5) * 0.035)),
          employees: 8 + index * 3 + step * (2 + (index % 4)),
        };
      }),
    };
  });
}

/** Demo screen: 10+ staff, 20%+ three-year CAGR, and no disqualifying "No" check. */
export function scaleupMetrics(company: ScaleupCompany, year: number): ScaleupMetrics {
  const current = company.facts.find((fact) => fact.year === year);
  const baseline = company.facts.find((fact) => fact.year === year - 3);
  const growth =
    current && baseline && baseline.revenueCents > 0
      ? ((current.revenueCents / baseline.revenueCents) ** (1 / 3) - 1) * 100
      : null;
  return {
    revenueCents: current?.revenueCents ?? null,
    grossProfitCents: current?.grossProfitCents ?? null,
    margin:
      current && current.revenueCents > 0
        ? (current.grossProfitCents / current.revenueCents) * 100
        : null,
    employees: current?.employees ?? null,
    growth,
    eligible: Boolean(
      current &&
      current.employees >= 10 &&
      growth !== null &&
      growth >= 20 - 1e-9 &&
      SCALEUP_CHECKS.every((check) => company.checks[check] !== "No"),
    ),
  };
}

/** Search is applied after ranking so a matching company retains its actual rank. */
export function rankScaleups(companies: ScaleupCompany[], year: number): RankedScaleup[] {
  const rows = companies.map((company) => ({ company, metrics: scaleupMetrics(company, year) }));
  const ranked = rows
    .filter((row) => row.metrics.eligible)
    .sort(
      (a, b) =>
        Math.round((b.metrics.growth ?? 0) * 100) - Math.round((a.metrics.growth ?? 0) * 100) ||
        (b.metrics.revenueCents ?? 0) - (a.metrics.revenueCents ?? 0) ||
        a.company.name.localeCompare(b.company.name),
    );
  const provinceCounts = new Map<string, number>();
  const ranks = new Map<string, { provinceRank: number; overallRank: number }>();
  ranked.forEach((row, index) => {
    const provinceRank = (provinceCounts.get(row.company.province) ?? 0) + 1;
    provinceCounts.set(row.company.province, provinceRank);
    ranks.set(row.company.id, { provinceRank, overallRank: index + 1 });
  });
  return rows.map((row) => ({
    ...row,
    provinceRank: ranks.get(row.company.id)?.provinceRank ?? null,
    overallRank: ranks.get(row.company.id)?.overallRank ?? null,
  }));
}

export function filterScaleups(
  rows: RankedScaleup[],
  search: string,
  provinces: string[],
  eligibleOnly: boolean,
): RankedScaleup[] {
  const query = search.trim().toLowerCase();
  return rows.filter(({ company, metrics }) => {
    const province = SCALEUP_PROVINCES.find((item) => item.id === company.province)!;
    return (
      (!query ||
        [company.name, company.sector, province.name].join(" ").toLowerCase().includes(query)) &&
      (!provinces.length || provinces.includes(company.province)) &&
      (!eligibleOnly || metrics.eligible)
    );
  });
}

export function scaleupSummary(rows: RankedScaleup[]) {
  const available = rows.filter((row) => row.metrics.revenueCents !== null);
  const revenueCents = available.reduce((sum, row) => sum + row.metrics.revenueCents!, 0);
  const grossProfitCents = available.reduce((sum, row) => sum + row.metrics.grossProfitCents!, 0);
  return {
    companies: rows.length,
    eligible: rows.filter((row) => row.metrics.eligible).length,
    revenueCents,
    averageRevenueCents: available.length ? revenueCents / available.length : null,
    weightedMargin: revenueCents ? (grossProfitCents / revenueCents) * 100 : null,
    employees: available.reduce((sum, row) => sum + (row.metrics.employees ?? 0), 0),
  };
}

export function setScaleupCheck(
  companies: ScaleupCompany[],
  companyId: string,
  check: ScaleupCheck,
  answer: ScreenAnswer,
): { companies: ScaleupCompany[]; error: string | null } {
  if (!companies.some((company) => company.id === companyId))
    return { companies, error: "This company is no longer available." };
  if (!SCALEUP_CHECKS.includes(check) || !SCREEN_ANSWERS.includes(answer))
    return { companies, error: "Choose Yes, No or N/A for a valid screen check." };
  return {
    companies: companies.map((company) =>
      company.id === companyId
        ? { ...company, checks: { ...company.checks, [check]: answer } }
        : company,
    ),
    error: null,
  };
}

export function saveScaleupCompany(
  companies: ScaleupCompany[],
  company: ScaleupCompany,
): { companies: ScaleupCompany[]; error: string | null } {
  const fail = (error: string) => ({ companies, error });
  if (!company.id || !company.name.trim()) return fail("Enter a company name.");
  if (!SCALEUP_PROVINCES.some((province) => province.id === company.province))
    return fail("Choose a province.");
  if (!company.sector.trim()) return fail("Enter a sector.");
  if (!Number.isInteger(company.founded) || company.founded < 1900 || company.founded > 2026)
    return fail("Enter a founding year from 1900 to 2026.");
  if (SCALEUP_CHECKS.some((check) => !SCREEN_ANSWERS.includes(company.checks[check])))
    return fail("Choose Yes, No or N/A for every screen check.");
  if (
    company.facts.some(
      (fact) =>
        !Number.isInteger(fact.year) ||
        !Number.isSafeInteger(fact.revenueCents) ||
        fact.revenueCents < 0 ||
        !Number.isSafeInteger(fact.grossProfitCents) ||
        fact.grossProfitCents > fact.revenueCents ||
        !Number.isSafeInteger(fact.employees) ||
        fact.employees < 0,
    ) ||
    new Set(company.facts.map((fact) => fact.year)).size !== company.facts.length
  )
    return fail("Enter unique yearly records with valid revenue, gross profit and headcount.");
  if (
    companies.some(
      (item) =>
        item.id !== company.id && item.name.toLowerCase() === company.name.trim().toLowerCase(),
    )
  )
    return fail("This company already exists.");
  const next = { ...company, name: company.name.trim(), sector: company.sector.trim() };
  return {
    companies: companies.some((item) => item.id === company.id)
      ? companies.map((item) => (item.id === company.id ? next : item))
      : [...companies, next],
    error: null,
  };
}
