import type { BlockProps } from "@/data/types";
import { SpecComparisonTable } from "./spec-table";
import { TwoProductCompare } from "./two-product";
import { BuyingGuidePicks } from "./buying-guide";

export function ComparisonVariants({ block }: BlockProps) {
  if (block.index === 0) return <SpecComparisonTable />;
  if (block.index === 1) return <TwoProductCompare />;
  if (block.index === 2) return <BuyingGuidePicks />;
  throw new Error(`Unsupported comparison ${block.id}`);
}
