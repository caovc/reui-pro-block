import { createContext, useContext } from "react";
import type { WishlistProduct } from "./wishlist-data";

export type BagLine = { product: WishlistProduct; quantity: number };
export interface SessionStore {
  bag: Record<string, BagLine>;
  alerts: Record<string, string>;
  notice: string | null;
  add: (products: WishlistProduct[]) => number;
  updateQuantity: (id: string, quantity: number) => void;
  notify: (id: string, email: string) => void;
  clearNotice: () => void;
  showBag: () => void;
}
export const WishlistContext = createContext<SessionStore | null>(null);
export function useWishlistSession() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("Wishlist controls require WishlistSession");
  return value;
}
