import { wishlistArtwork, type WishlistArt } from "../wishlist-artwork";

export type CollectionCategory = "clothing" | "footwear" | "accessories" | "home";
export type CollectionProduct = {
  id: string;
  name: string;
  category: CollectionCategory;
  detail: string;
  price: number;
  image: string;
};

type ProductSeed = { name: string; detail: string; price: number; art: WishlistArt };
const seeds: Record<CollectionCategory, ProductSeed[]> = {
  clothing: [
    { name: "Linen Field Shirt", detail: "European linen · relaxed fit", price: 80, art: "shirt" },
    { name: "Everyday Knit", detail: "Cotton and merino · midweight", price: 108, art: "sweater" },
    { name: "Studio Coat", detail: "Brushed cotton · unlined", price: 178, art: "coat" },
    { name: "Straight-Leg Trouser", detail: "Organic cotton twill", price: 96, art: "trouser" },
    { name: "Ribbed Beanie", detail: "Soft merino · one size", price: 38, art: "beanie" },
  ],
  footwear: [
    { name: "Everyday Derby", detail: "Leather upper · stitched sole", price: 148, art: "shoe" },
    { name: "Weekend Sneaker", detail: "Suede upper · natural rubber", price: 128, art: "shoe" },
    { name: "Studio Lace-Up", detail: "Soft leather · cushioned footbed", price: 164, art: "shoe" },
    { name: "Canvas Walker", detail: "Cotton canvas · lightweight", price: 88, art: "shoe" },
    { name: "Daily Loafer", detail: "Supple leather · slip-on", price: 156, art: "shoe" },
  ],
  accessories: [
    { name: "Market Tote", detail: "Heavy canvas · roomy interior", price: 58, art: "bag" },
    { name: "Pocket Wallet", detail: "Vegetable-tanned leather", price: 48, art: "wallet" },
    { name: "Everyday Belt", detail: "Full-grain leather · brass buckle", price: 64, art: "belt" },
    { name: "Travel Tote", detail: "Waxed canvas · reinforced handles", price: 98, art: "bag" },
    {
      name: "Folded Card Case",
      detail: "Four card slots · slim profile",
      price: 35,
      art: "wallet",
    },
  ],
  home: [
    { name: "Reading Lamp", detail: "Adjustable shade · warm light", price: 124, art: "lamp" },
    { name: "Woven Throw", detail: "Cotton and wool · generous size", price: 86, art: "throw" },
    { name: "Oak Serving Tray", detail: "Solid oak · oiled finish", price: 42, art: "tray" },
    { name: "Studio Speaker", detail: "Compact cabinet · rich sound", price: 168, art: "speaker" },
    {
      name: "Morning Coffee Maker",
      detail: "Countertop brewer · simple controls",
      price: 188,
      art: "coffee",
    },
  ],
};

const colors = [
  { name: "Sand", tone: "#b7a382" },
  { name: "Forest", tone: "#677764" },
  { name: "Ink", tone: "#536174" },
];

/** Sixty independent demo pieces; category/style counts are derived, never decorative constants. */
export const collectionProducts: CollectionProduct[] = Object.entries(seeds).flatMap(
  ([category, products]) =>
    products.flatMap((product, index) =>
      colors.map((color) => ({
        id: `${category}-${index}-${color.name.toLowerCase()}`,
        name: `${product.name} · ${color.name}`,
        category: category as CollectionCategory,
        detail: product.detail,
        price: product.price,
        image: wishlistArtwork(product.art, color.tone),
      })),
    ),
);

export const collectionCategories: { id: CollectionCategory; name: string; image: string }[] = [
  { id: "clothing", name: "Clothing", image: wishlistArtwork("coat", "#a4967b") },
  { id: "footwear", name: "Footwear", image: wishlistArtwork("shoe", "#786350") },
  { id: "accessories", name: "Bags & Accessories", image: wishlistArtwork("bag", "#b5a080") },
  { id: "home", name: "Home Objects", image: wishlistArtwork("lamp", "#75826b") },
];

export function productsForCategories(categories: readonly CollectionCategory[]) {
  return collectionProducts.filter((product) => categories.includes(product.category));
}

export const collectionStories = [
  {
    id: "everyday",
    categories: ["clothing", "accessories"] as CollectionCategory[],
    badge: "The Spring Edit",
    eyebrow: "Considered, from the start",
    title: "For the everyday.",
    description:
      "Easy layers and useful companions. The pieces that quietly become your favorites.",
    image: wishlistArtwork("sweater", "#727d65"),
    imageAlt: "Original forest knitwear still life",
    rating: 4.8,
    reviews: 248,
    cta: "Shop the everyday edit",
  },
  {
    id: "living",
    categories: ["home"] as CollectionCategory[],
    badge: "Objects for Living",
    eyebrow: "A little room for good things",
    title: "Make yourself at home.",
    description:
      "Warm light, honest materials, and small rituals. Thoughtful things for the spaces you live in.",
    image: wishlistArtwork("lamp", "#a19773"),
    imageAlt: "Original reading lamp still life",
    rating: 4.9,
    reviews: 186,
    cta: "Shop objects for living",
  },
];

export function collectionPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}
