import type { BlockProps } from "@/data/types";
import { RankedScorecards } from "./ranked-scorecards";
import { AlternativesSwitcher } from "./alternatives-switcher";
import { CompareBuilder } from "./compare-builder";

export function ComparisonFollowups({ block }: BlockProps) {
  if (block.index === 3) return <RankedScorecards />;
  if (block.index === 4) return <AlternativesSwitcher />;
  if (block.index === 5) return <CompareBuilder />;
  throw new Error(`Unsupported comparison followup ${block.id}`);
}
