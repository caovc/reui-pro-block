import { createContext, useContext } from "react";
import type { ComparisonProductId } from "./data";

export type ComparisonCart = {
  quantities: Partial<Record<ComparisonProductId, number>>;
  update: (id: ComparisonProductId, quantity: number) => void;
  add: (id: ComparisonProductId) => void;
  clear: () => void;
  count: number;
  total: number;
  message: string;
};
export const ComparisonCartContext = createContext<ComparisonCart | null>(null);
export function useComparisonCart() {
  const value = useContext(ComparisonCartContext);
  if (!value) throw new Error("ComparisonCartContext provider is required");
  return value;
}
