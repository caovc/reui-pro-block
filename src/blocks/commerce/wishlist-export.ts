import type { WishlistProduct } from "./wishlist-data";

export function saveWishlistJson(title: string, products: WishlistProduct[]) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          title,
          items: products.map(({ id, name, price, finish, stock }) => ({
            id,
            name,
            price,
            finish,
            stock,
          })),
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
