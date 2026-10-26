import { categoryCollections } from "./data";
import { wishlistArtwork } from "../wishlist-artwork";
import {
  collectionCategories,
  collectionProducts,
  productsForCategories,
  type CollectionCategory,
} from "../shop-hero-variants/collection-data";

export const directoryCollections = categoryCollections.map((collection) => ({
  ...collection,
  from: Math.min(...productsForCategories(collection.categories).map((product) => product.price)),
}));
export const uniqueCatalogCount = new Set(collectionProducts.map((product) => product.id)).size;
export const allDepartments = collectionCategories.map((category) => category.id);

const guideSeeds = [
  {
    id: "uniform",
    name: "A good everyday uniform",
    description:
      "Fewer decisions, better mornings. Start with easy layers and a pair that goes everywhere.",
    categories: ["clothing", "footwear"],
    image: wishlistArtwork("sweater", "#829078"),
    badge: "Start here",
  },
  {
    id: "carry",
    name: "Small things, well considered",
    description:
      "The everyday companions that earn their place: a useful bag, a good belt and the little details.",
    categories: ["accessories"],
    image: wishlistArtwork("bag", "#a18f76"),
    badge: "The essentials",
  },
  {
    id: "living",
    name: "A little room to unwind",
    description:
      "Warm light, honest materials and a few favorite rituals. Thoughtful things for the space around you.",
    categories: ["home"],
    image: wishlistArtwork("lamp", "#8f9b7b"),
    badge: "Objects for living",
  },
  {
    id: "weekend",
    name: "The weekend checklist",
    description:
      "A change of scene, a lighter bag. Layers, footwear and useful companions for taking the longer way.",
    categories: ["clothing", "footwear", "accessories"],
    image: wishlistArtwork("shoe", "#88735b"),
    badge: "Out of office",
  },
] as const;
export const collectionGuides = guideSeeds.map((guide) => {
  const categories = [...guide.categories] as CollectionCategory[];
  const products = productsForCategories(categories);
  return {
    ...guide,
    categories,
    count: products.length,
    from: Math.min(...products.map((product) => product.price)),
    checklist: collectionCategories.filter((category) => categories.includes(category.id)),
  };
});

export const seasonalDepartments = directoryCollections.slice(0, 4).map((collection, index) => ({
  ...collection,
  label: ["New season", "The longer way", "Everyday companions", "Objects for living"][index],
}));
