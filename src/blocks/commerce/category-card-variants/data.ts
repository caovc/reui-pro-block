import {
  Shirt,
  Footprints,
  ShoppingBag,
  Lamp,
  Layers,
  Compass,
  Armchair,
  Grid2X2,
} from "lucide-react";
import { wishlistArtwork } from "../wishlist-artwork";
import {
  productsForCategories,
  type CollectionCategory,
} from "../shop-hero-variants/collection-data";

const seeds = [
  {
    id: "clothing",
    name: "Everyday Clothing",
    categories: ["clothing"],
    description: "Easy layers, honest fabrics. The things you reach for every day.",
    image: wishlistArtwork("coat", "#a49a7c"),
    icon: Shirt,
    tint: "bg-stone-100 dark:bg-stone-900",
    fits: ["Everyday"],
    available: true,
    badge: "New season",
    badgeVariant: "success-light",
  },
  {
    id: "footwear",
    name: "Footwear",
    categories: ["footwear"],
    description: "A well-considered step. Made for the long way home.",
    image: wishlistArtwork("shoe", "#89725d"),
    icon: Footprints,
    tint: "bg-amber-50 dark:bg-amber-950/40",
    fits: ["Travel"],
    available: true,
  },
  {
    id: "accessories",
    name: "Bags & Accessories",
    categories: ["accessories"],
    description: "Useful companions and small details that make a difference.",
    image: wishlistArtwork("bag", "#b4a382"),
    icon: ShoppingBag,
    tint: "bg-orange-50 dark:bg-orange-950/40",
    fits: ["Everyday", "Travel"],
    available: true,
    badge: "Most loved",
    badgeVariant: "warning-light",
  },
  {
    id: "home",
    name: "Objects for Home",
    categories: ["home"],
    description: "Warm light and little rituals. A good place to begin.",
    image: wishlistArtwork("lamp", "#809077"),
    icon: Lamp,
    tint: "bg-emerald-50 dark:bg-emerald-950/40",
    fits: ["Living"],
    available: false,
  },
  {
    id: "everyday",
    name: "The Everyday Edit",
    categories: ["clothing", "accessories"],
    description: "Considered layers and practical companions, together in one edit.",
    image: wishlistArtwork("sweater", "#7c886c"),
    icon: Layers,
    tint: "bg-lime-50 dark:bg-lime-950/40",
    fits: ["Everyday"],
    available: true,
  },
  {
    id: "weekend",
    name: "Weekends Away",
    categories: ["footwear", "accessories"],
    description: "Pack lightly, go further. Small essentials for a change of scene.",
    image: wishlistArtwork("bag", "#7c8072"),
    icon: Compass,
    tint: "bg-sky-50 dark:bg-sky-950/40",
    fits: ["Travel"],
    available: true,
    badge: "Limited edit",
    badgeVariant: "info-light",
  },
  {
    id: "quiet",
    name: "The Quiet Corner",
    categories: ["home", "accessories"],
    description: "Bring a little intention to a favorite corner of your day.",
    image: wishlistArtwork("throw", "#a78c79"),
    icon: Armchair,
    tint: "bg-rose-50 dark:bg-rose-950/40",
    fits: ["Living"],
    available: false,
  },
  {
    id: "all",
    name: "All Considered",
    categories: ["clothing", "footwear", "accessories", "home"],
    description: "The complete Bricklane sample catalog. Nothing extra, all considered.",
    image: wishlistArtwork("speaker", "#7e8795"),
    icon: Grid2X2,
    tint: "bg-violet-50 dark:bg-violet-950/40",
    fits: ["Everyday", "Travel", "Living"],
    available: true,
  },
] as const;

export const categoryCollections = seeds.map((collection, index) => ({
  ...collection,
  categories: [...collection.categories] as CollectionCategory[],
  count: productsForCategories(collection.categories).length,
  order: index,
  badge: "badge" in collection ? collection.badge : null,
  badgeVariant: "badgeVariant" in collection ? collection.badgeVariant : ("outline" as const),
}));
export type CategoryCollection = (typeof categoryCollections)[number];
export const fitOptions = ["Everyday", "Travel", "Living"] as const;
export type CollectionFit = (typeof fitOptions)[number];
export const departmentOptions = [
  { value: "all", label: "All departments" },
  { value: "clothing", label: "Clothing" },
  { value: "footwear", label: "Footwear" },
  { value: "accessories", label: "Bags & Accessories" },
  { value: "home", label: "Home Objects" },
];

export type CollectionFilters = {
  department: string;
  availability: string;
  fits: CollectionFit[];
  featured: boolean;
};
export const initialFilters: CollectionFilters = {
  department: "all",
  availability: "all",
  fits: [],
  featured: false,
};
