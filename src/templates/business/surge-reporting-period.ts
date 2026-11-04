/* Bricklane consumer state: a local reporting label, independent of report data.
 * The first range covers 30 inclusive calendar days ending at today's local date. */
import { useState } from "react";
import { startOfDay, subDays } from "date-fns";
import type { DateSelectorValue } from "./surge-free/date-selector";

function initialReportingPeriod(): DateSelectorValue {
  const endDate = startOfDay(new Date());
  return {
    period: "day",
    operator: "between",
    startDate: subDays(endDate, 29),
    endDate,
  };
}

export function useSurgeReportingPeriod() {
  const [value, setValue] = useState<DateSelectorValue>(initialReportingPeriod);
  return { value, setValue };
}

export type SurgeReportingPeriodModel = ReturnType<typeof useSurgeReportingPeriod>;
