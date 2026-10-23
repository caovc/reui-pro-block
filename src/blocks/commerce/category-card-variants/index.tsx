import type { BlockProps } from "@/data/types";
import { CategoryBrowseGrid } from "./browse-grid";
import { FilterableCollections } from "./filterable-collections";
import { CategoryCarousel } from "./category-carousel";

export function CategoryCardVariants({ block }: BlockProps) {
  if (block.index === 0) return <CategoryBrowseGrid />;
  if (block.index === 1) return <FilterableCollections />;
  if (block.index === 2) return <CategoryCarousel />;
  throw new Error(`Unsupported category card ${block.id}`);
}
