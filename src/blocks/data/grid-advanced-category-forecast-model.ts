/** Original Bricklane forecast fixtures; amounts use integer cents. */
export const FORECAST_DEPARTMENTS = ["Technology", "Home", "Outdoors", "Everyday"] as const;
export type ForecastDepartment = (typeof FORECAST_DEPARTMENTS)[number];
export const FORECAST_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
export type ForecastLine = {
  id: string;
  name: string;
  department: ForecastDepartment;
  owner: string;
  priorYearCents: number[];
  planCents: number[];
};
export type ForecastState = {
  lines: ForecastLine[];
  growthBasisPoints: Record<ForecastDepartment, number>;
};
export type ForecastMetrics = {
  priorYearCents: number;
  forecastCents: number;
  planCents: number;
  varianceCents: number;
  attainment: number | null;
  months: { priorYearCents: number; forecastCents: number; planCents: number }[];
};

/** Largest-remainder allocation keeps an entered annual plan exact to the cent. */
export function allocateForecastYear(totalCents: number, weights: readonly number[]): number[] {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0 || weights.length !== 12) return [];
  if (weights.some((value) => !Number.isSafeInteger(value) || value < 0)) return [];
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(weightTotal)) return [];
  const normalized = weightTotal ? weights : Array.from({ length: 12 }, () => 1);
  const divisor = BigInt(weightTotal || 12);
  const exact = normalized.map((weight) => BigInt(totalCents) * BigInt(weight));
  const values = exact.map((value) => Number(value / divisor));
  const remainder = totalCents - values.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, month) => ({ month, fraction: value % divisor }))
    .sort((a, b) =>
      a.fraction === b.fraction ? a.month - b.month : a.fraction > b.fraction ? -1 : 1,
    );
  for (let index = 0; index < remainder; index++) values[order[index].month]++;
  return values;
}

export function createCategoryForecast(): ForecastState {
  const names = [
    "Connected audio",
    "Desk essentials",
    "Travel chargers",
    "Kitchen tools",
    "Soft furnishings",
    "Lighting",
    "Trail equipment",
    "Garden care",
    "Cycling accessories",
    "Pantry staples",
    "Personal care",
    "Stationery",
  ];
  const seasonality = [8, 7, 8, 8, 8, 9, 6, 7, 8, 9, 10, 12];
  return {
    growthBasisPoints: { Technology: 800, Home: 500, Outdoors: 1200, Everyday: 300 },
    lines: names.map((name, index) => ({
      id: `forecast-line-${index + 1}`,
      name,
      department: FORECAST_DEPARTMENTS[Math.floor(index / 3)],
      owner: ["Theo Mercer", "Noah Reed", "Maya Brooks", "Amara Ortiz"][Math.floor(index / 3)],
      priorYearCents: allocateForecastYear((380000 + index * 47000) * 100, seasonality),
      planCents: allocateForecastYear((420000 + index * 51000) * 100, seasonality),
    })),
  };
}

export function forecastMetrics(
  lines: ForecastLine[],
  growth: ForecastState["growthBasisPoints"],
): ForecastMetrics {
  const months = FORECAST_MONTHS.map((_, month) =>
    lines.reduce(
      (result, line) => ({
        priorYearCents: result.priorYearCents + line.priorYearCents[month],
        forecastCents:
          result.forecastCents +
          Number(
            (BigInt(line.priorYearCents[month]) * BigInt(10000 + growth[line.department]) + 5000n) /
              10000n,
          ),
        planCents: result.planCents + line.planCents[month],
      }),
      { priorYearCents: 0, forecastCents: 0, planCents: 0 },
    ),
  );
  const priorYearCents = months.reduce((sum, value) => sum + value.priorYearCents, 0);
  const forecastCents = months.reduce((sum, value) => sum + value.forecastCents, 0);
  const planCents = months.reduce((sum, value) => sum + value.planCents, 0);
  return {
    priorYearCents,
    forecastCents,
    planCents,
    varianceCents: forecastCents - planCents,
    attainment: planCents ? (forecastCents / planCents) * 100 : null,
    months,
  };
}

export function setForecastGrowth(
  state: ForecastState,
  department: ForecastDepartment,
  basisPoints: number,
): { state: ForecastState; error: string | null } {
  if (!FORECAST_DEPARTMENTS.includes(department)) return { state, error: "Choose a department." };
  if (!Number.isInteger(basisPoints) || basisPoints < -2000 || basisPoints > 4000)
    return { state, error: "Growth must be between −20% and 40%." };
  return {
    state: {
      ...state,
      growthBasisPoints: { ...state.growthBasisPoints, [department]: basisPoints },
    },
    error: null,
  };
}

export function saveForecastLine(
  state: ForecastState,
  line: ForecastLine,
): { state: ForecastState; error: string | null } {
  const fail = (error: string) => ({ state, error });
  if (!line.id || !line.name.trim()) return fail("Enter a product line name.");
  if (!FORECAST_DEPARTMENTS.includes(line.department)) return fail("Choose a department.");
  if (!line.owner.trim()) return fail("Enter a planning owner.");
  if (
    state.lines.some(
      (item) => item.id !== line.id && item.name.toLowerCase() === line.name.trim().toLowerCase(),
    )
  )
    return fail("This product line already exists.");
  if (
    [line.priorYearCents, line.planCents].some(
      (values) =>
        values.length !== 12 || values.some((value) => !Number.isSafeInteger(value) || value < 0),
    )
  )
    return fail("Enter twelve nonnegative monthly values in whole cents.");
  const next = { ...line, name: line.name.trim(), owner: line.owner.trim() };
  return {
    state: {
      ...state,
      lines: state.lines.some((item) => item.id === line.id)
        ? state.lines.map((item) => (item.id === line.id ? next : item))
        : [...state.lines, next],
    },
    error: null,
  };
}

export function filterForecastLines(
  state: ForecastState,
  search: string,
  departments: string[],
  pace: "All lines" | "Below plan" | "At or above plan" | "No plan",
): ForecastLine[] {
  const query = search.trim().toLowerCase();
  return state.lines.filter((line) => {
    const metrics = forecastMetrics([line], state.growthBasisPoints);
    return (
      (!query ||
        [line.name, line.department, line.owner].join(" ").toLowerCase().includes(query)) &&
      (!departments.length || departments.includes(line.department)) &&
      (pace === "All lines" ||
        (pace === "No plan"
          ? metrics.attainment === null
          : pace === "Below plan"
            ? metrics.attainment !== null && metrics.attainment < 100
            : metrics.attainment !== null && metrics.attainment >= 100))
    );
  });
}
