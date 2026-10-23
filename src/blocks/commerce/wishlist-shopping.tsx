import type { BlockProps } from "@/data/types";
import { BulkActionWishlist } from "./wishlist-bulk";
import { WishlistGrid } from "./wishlist-grid";
import { WishlistSession } from "./wishlist-common";

export function WishlistShopping({ block }: BlockProps) {
  if (block.index > 2) throw new Error(`WishlistShopping does not own ${block.id}`);
  return (
    <WishlistSession key={block.id}>
      {block.index === 0 ? <BulkActionWishlist /> : <WishlistGrid move={block.index === 2} />}
    </WishlistSession>
  );
}
