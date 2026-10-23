import { wishlistArtwork } from "../wishlist-artwork";
import {
  collectionCategories,
  productsForCategories,
  type CollectionCategory,
} from "./collection-data";

export type ReleasePhase = "live" | "new" | "limited" | "upcoming";

export const seasonalCategories: CollectionCategory[] = ["clothing", "accessories"];
export const seasonalPieces = productsForCategories(seasonalCategories);
export const archiveOffers = seasonalPieces.slice(0, 12).map((product) => ({
  ...product,
  discount: 40,
  salePrice: Math.round(product.price * 60) / 100,
}));

export const dropCollections: {
  id: string;
  name: string;
  eyebrow: string;
  title: string;
  description: string;
  categories: CollectionCategory[];
  phase: ReleasePhase;
  status: string;
  image: string;
}[] = [
  {
    id: "everyday",
    name: "The Everyday Edit",
    eyebrow: "Collection 03 · Small runs, long stories",
    title: "Made for the everyday.",
    description:
      "Easy layers and useful companions. A considered edit for all the places a day can take you.",
    categories: ["clothing", "accessories"],
    phase: "live",
    status: "Available now",
    image: wishlistArtwork("coat", "#8e9279"),
  },
  {
    id: "living",
    name: "Objects for Living",
    eyebrow: "The quiet collection · At home, considered",
    title: "Make room for the good things.",
    description:
      "Honest materials, warm light and little rituals. Objects that bring a little more ease to your space.",
    categories: ["home"],
    phase: "new",
    status: "Just arrived",
    image: wishlistArtwork("lamp", "#8d906f"),
  },
  {
    id: "long-way",
    name: "The Longer Way",
    eyebrow: "The next chapter · A new collection",
    title: "Take the longer way.",
    description:
      "Everyday footwear for the routes you know and the ones you have yet to find. Preview the next drop.",
    categories: ["footwear"],
    phase: "upcoming",
    status: "Friday · 8 AM PT",
    image: wishlistArtwork("shoe", "#71624f"),
  },
];

const quiltPhases: ReleasePhase[] = ["new", "upcoming", "limited", "live"];
const quiltStatuses = [
  "The new season",
  "Next drop · Friday",
  "Small-batch favorites",
  "Back in stock",
];

export const quiltCollections = collectionCategories.map((category, index) => {
  const products = productsForCategories([category.id]);
  return {
    ...category,
    phase: quiltPhases[index],
    status: quiltStatuses[index],
    count: products.length,
    from: Math.min(...products.map((product) => product.price)),
    to: Math.max(...products.map((product) => product.price)),
  };
});

export function offerPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}
