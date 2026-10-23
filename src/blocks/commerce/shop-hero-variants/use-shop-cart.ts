import { useState } from "react";
import { shopProducts, type ShopProduct } from "./data";

export function useShopCart() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const add = (product: ShopProduct) => {
    setQuantities((current) => ({ ...current, [product.id]: (current[product.id] || 0) + 1 }));
    setMessage(`${product.name} added to your cart.`);
  };
  const update = (id: string, quantity: number) => {
    setQuantities((current) => ({ ...current, [id]: quantity }));
    setMessage(quantity ? "Cart quantity updated." : "Product removed from your cart.");
  };
  return {
    quantities,
    add,
    update,
    message,
    count: Object.values(quantities).reduce((sum, value) => sum + value, 0),
    total: shopProducts.reduce(
      (sum, product) => sum + product.price * (quantities[product.id] || 0),
      0,
    ),
  };
}

export type ShopCart = ReturnType<typeof useShopCart>;
