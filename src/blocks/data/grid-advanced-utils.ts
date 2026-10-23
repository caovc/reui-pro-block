import { createElement, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
export { cn };
export const money = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
export const headClass = "h-8 px-3 text-[13px] font-normal text-muted-foreground";
export const cellClass = "px-3 py-1.5 text-sm";
export function useGridSorting() {
  const [state, setState] = useState<{ key: string; asc: boolean }>({
    key: "",
    asc: true,
  });
  function header(label: string) {
    return createElement(
      "button",
      {
        className: "inline-flex items-center gap-1 hover:text-foreground",
        "aria-label": `Sort by ${label}`,
        onClick: () =>
          setState((s) => ({
            key: label,
            asc: s.key === label ? !s.asc : true,
          })),
      },
      label,
      createElement(ArrowUpDown, {
        className: cn(
          "size-3",
          state.key === label ? "text-foreground" : "text-muted-foreground/60",
        ),
      }),
    );
  }
  function sortRows<T>(rows: T[], value: (row: T, key: string) => string | number): T[] {
    if (!state.key) return rows;
    return [...rows].sort((a, b) => {
      const x = value(a, state.key),
        y = value(b, state.key);
      return (
        (typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y))) * (state.asc ? 1 : -1)
      );
    });
  }
  return { header, sortRows, state };
}
