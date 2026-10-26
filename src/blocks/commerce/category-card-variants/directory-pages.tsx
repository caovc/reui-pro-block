import type { BlockProps } from "@/data/types";
import { FeaturedDepartment } from "./featured-department";
import { CollectionGuides } from "./collection-guides";
import { SeasonalCategories } from "./seasonal-categories";

export function CategoryDirectoryVariants({ block }: BlockProps) {
  if (block.index === 3) return <FeaturedDepartment />;
  if (block.index === 4) return <CollectionGuides />;
  if (block.index === 5) return <SeasonalCategories />;
  throw new Error(`Unsupported category directory ${block.id}`);
}
