import type { BlockProps } from "@/data/types";
import { CategoryShopHero } from "./category-shop";
import { DualCollectionHero } from "./dual-collections";

export function CollectionShopHeroes({ block }: BlockProps) {
  if (block.index === 3) return <CategoryShopHero />;
  if (block.index === 4) return <DualCollectionHero />;
  throw new Error(`Unsupported collection hero ${block.id}`);
}
