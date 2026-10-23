import type { BlockProps } from "@/data/types";
import { SeasonalLookbookHero } from "./lookbook";
import { CollectionSwitcherHero } from "./collection-switcher";
import { CollectionQuiltHero } from "./collection-quilt";

export function ReleaseShopHeroes({ block }: BlockProps) {
  if (block.index === 5) return <SeasonalLookbookHero />;
  if (block.index === 6) return <CollectionSwitcherHero />;
  if (block.index === 7) return <CollectionQuiltHero />;
  throw new Error(`Unsupported release hero ${block.id}`);
}
