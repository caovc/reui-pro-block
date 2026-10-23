import type { BlockProps } from "@/data/types";
import { WishlistSession } from "./wishlist-common";
import { WishlistBoards } from "./wishlist-boards";
import { PriorityWishlist } from "./wishlist-priority";
import { CollectionRailWishlist } from "./wishlist-rail";

export function WishlistCollections({ block }: BlockProps) {
  if (block.index < 3 || block.index > 5)
    throw new Error(`WishlistCollections does not own ${block.id}`);
  return (
    <WishlistSession key={block.id}>
      {block.index === 3 ? (
        <WishlistBoards />
      ) : block.index === 4 ? (
        <PriorityWishlist />
      ) : (
        <CollectionRailWishlist />
      )}
    </WishlistSession>
  );
}
