import commerce4 from "./assets/product-0.svg";
import commerce5 from "./assets/product-1.svg";
import commerce6 from "./assets/product-2.svg";
import commerce7 from "./assets/product-3.svg";
import commerce8 from "./assets/product-4.svg";
import commerce9 from "./assets/product-5.svg";
import commerce10 from "./assets/product-6.svg";
import commerce11 from "./assets/product-7.svg";
import bag from "./assets/product-4.svg";
import jacket from "./assets/product-6.svg";
import shoes from "./assets/product-3.svg";
import shirt from "./assets/product-1.svg";
export type CatalogProduct = {
  name: string;
  vendor: string;
  category: string;
  stock: number;
  variants: number;
  price: string;
  status: string;
  image: string;
  subtitle?: string;
  description?: string;
  productType?: string;
  collections?: string;
  tags?: string;
  media?: { src: string; name: string }[];
  variantRows?: { color: string; size: string; sku: string; price: string; inventory: string }[];
};
export const catalogSeed: CatalogProduct[] = [
  ["Alpine Down Vest", "Maven & Co.", "Outerwear", 1226, 10, "$173 – $178", "Active", jacket],
  ["Boxy Pocket Tee", "Aster Goods", "Apparel", 1253, 10, "$33 – $37", "Draft", shirt],
  ["Brushed Flannel Shirt", "Field Supply", "Apparel", 1648, 10, "$89 – $95", "Active", shirt],
  ["Canvas Deck Shoe", "Manifest Atelier", "Footwear", 1492, 10, "$95 – $99", "Active", shoes],
  ["Canvas Weekender", "Field Supply", "Bags", 120, 1, "$187", "Active", bag],
  ["Commuter Backpack", "Manifest Atelier", "Bags", 431, 2, "$148 – $151", "Scheduled", bag],
  ["Denim Trucker Jacket", "Aster Goods", "Denim", 1195, 10, "$166 – $170", "Active", jacket],
  ["Everyday Tote", "Manifest Atelier", "Bags", 133, 2, "$89 – $90", "Draft", bag],
].map(([name, vendor, category, stock, variants, price, status, image]) => ({
  name: String(name),
  vendor: String(vendor),
  category: String(category),
  stock: Number(stock),
  variants: Number(variants),
  price: String(price),
  status: String(status),
  variantRows: Array.from({ length: Number(variants) }, (_, index) => ({
    color: ["Black", "Olive", "Navy"][index % 3],
    size: ["XS", "S", "M", "L", "XL"][index % 5],
    sku: `${String(name)
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
    price: String(
      Number(String(price).match(/[0-9.]+/)?.[0] ?? 0) +
        (index % 2 && String(price).includes("–")
          ? Number(String(price).match(/\$([0-9.]+)$/)?.[1] ?? 0) -
            Number(String(price).match(/[0-9.]+/)?.[0] ?? 0)
          : 0),
    ),
    inventory: String(
      Math.floor(Number(stock) / Number(variants)) +
        (index < Number(stock) % Number(variants) ? 1 : 0),
    ),
  })),
  image:
    [commerce4, commerce5, commerce6, commerce7, commerce8, commerce9, commerce10, commerce11][
      Number(stock) === 1226
        ? 0
        : Number(stock) === 1253
          ? 1
          : Number(stock) === 1648
            ? 2
            : Number(stock) === 1492
              ? 3
              : Number(stock) === 120
                ? 4
                : Number(stock) === 431
                  ? 5
                  : Number(stock) === 1195
                    ? 6
                    : 7
    ] || String(image),
}));
