import { photos } from "./shared";

export interface ShowcaseProduct {
  id: string;
  name: string;
  category: string;
  secondary?: string;
  description: string;
  price: number;
  compareAt?: number;
  image: string;
  badge?: string;
  stock?: number;
  rating?: number;
  reviews?: number;
  arrival?: string;
  soldOut?: boolean;
  colors?: { name: string; value: string; family: string }[];
}

const jacketColors = [
  { name: "Black", value: "#16181b", family: "Black" },
  { name: "Cognac", value: "#814416", family: "Neutral" },
  { name: "Graphite", value: "#484b55", family: "Black" },
  { name: "Olive", value: "#40551e", family: "Green" },
];
const pufferColors = [
  { name: "Black", value: "#181a1f", family: "Black" },
  { name: "Cloud", value: "#f1f4f8", family: "Neutral" },
  { name: "Navy", value: "#202d65", family: "Blue" },
  { name: "Signal Red", value: "#d80021", family: "Red" },
];
const tankColors = [
  { name: "Chalk", value: "#f6f5f0", family: "Neutral" },
  { name: "Sage", value: "#72927e", family: "Green" },
  { name: "Rose", value: "#dd8196", family: "Red" },
  { name: "Navy", value: "#243567", family: "Blue" },
];
const denimColors = [
  { name: "Light Denim", value: "#cce7f2", family: "Blue" },
  { name: "Washed Blue", value: "#3273df", family: "Blue" },
  { name: "Ecru", value: "#e9e6e1", family: "Neutral" },
  { name: "Black Rinse", value: "#191b1e", family: "Black" },
];

// Only the existing freely licensed, bundled photographs are used. The public
// reference has different model photography; the visual audit documents this.
export const apparel: ShowcaseProduct[] = [
  {
    id: "leather-biker",
    name: "Leather Biker Jacket",
    category: "Studio Outerwear",
    description: "Polished leather with a sharp stance.",
    price: 248,
    image: photos.jacket,
    badge: "New",
    stock: 8,
    colors: jacketColors,
  },
  {
    id: "gloss-puffer",
    name: "Gloss Puffer Jacket",
    category: "Cold Weather",
    description: "High-shine warmth with a clean fit.",
    price: 148,
    compareAt: 198,
    image: photos.jacket,
    stock: 4,
    colors: pufferColors,
  },
  {
    id: "ribbed-tank",
    name: "Ribbed Tank Set",
    category: "Travel Set",
    description: "Soft tank with tapered pull-on pants.",
    price: 86,
    image: photos.shirt,
    badge: "Trending",
    stock: 12,
    colors: tankColors,
  },
  {
    id: "wide-leg-denim",
    name: "Wide-Leg Denim Set",
    category: "Denim Studio",
    description: "Easy tank styling with wide-leg jeans.",
    price: 132,
    image: photos.shirt,
    stock: 10,
    colors: denimColors,
  },
  {
    id: "cognac-jacket",
    name: "Cognac Crop Jacket",
    category: "Studio Outerwear",
    description: "A warm, polished layer with a considered fit.",
    price: 226,
    image: photos.jacket,
    stock: 7,
    colors: jacketColors,
  },
  {
    id: "sage-utility",
    name: "Sage Utility Set",
    category: "Travel Set",
    description: "Easy utility layers, made to move with you.",
    price: 154,
    image: photos.shirt,
    badge: "New",
    stock: 14,
    colors: tankColors,
  },
  {
    id: "navy-coat",
    name: "Navy Padded Coat",
    category: "Cold Weather",
    description: "A little extra warmth, without the extra weight.",
    price: 186,
    compareAt: 228,
    image: photos.jacket,
    stock: 6,
    colors: pufferColors,
  },
  {
    id: "black-denim",
    name: "Black Rinse Denim",
    category: "Denim Studio",
    description: "A relaxed cut with an everyday point of view.",
    price: 118,
    image: photos.shirt,
    stock: 2,
    colors: denimColors,
  },
];
export const arrivals: ShowcaseProduct[] = apparel.map((p, i) => ({
  ...p,
  name: [
    "Wool Collar Jacket",
    "Gloss Cropped Puffer",
    "Ribbed Flight Set",
    "Wide-Leg Rinse Jean",
    "Cognac Cafe Jacket",
    "Longline Utility Set",
    "Padded City Coat",
    "Slit-Hem Denim",
  ][i],
  arrival: [
    "Added today",
    "Added today",
    "Added yesterday",
    "Added yesterday",
    "May 8 drop",
    "May 8 drop",
    "Back in stock",
    "May 7 drop",
  ][i],
  soldOut: i === 6,
  badge: i === 0 ? "New" : i === 3 ? "Trending" : i === 6 ? "Sold Out" : undefined,
}));
export const devices: ShowcaseProduct[] = [
  {
    id: "auralite",
    name: "Auralite Pods",
    category: "Audio",
    secondary: "Travel",
    description: "Wireless sound, a considered fit, and effortless everyday pairing.",
    price: 148,
    compareAt: 179,
    image: photos.headphones,
    badge: "Low Stock",
    stock: 4,
    rating: 4.7,
    reviews: 418,
  },
  {
    id: "orbit",
    name: "Orbit Watch",
    category: "Wearables",
    secondary: "Health",
    description: "Everyday metrics, thoughtful details, and room for your next goal.",
    price: 214,
    image: photos.lamp,
    badge: "New",
    stock: 12,
    rating: 4.8,
    reviews: 286,
  },
  {
    id: "grain",
    name: "Grain Camera",
    category: "Photography",
    secondary: "Travel",
    description: "A new perspective, wherever the day takes you. Made to go further.",
    price: 428,
    image: photos.headphones,
    badge: "Trending",
    stock: 8,
    rating: 4.9,
    reviews: 306,
  },
  {
    id: "dockline",
    name: "Dockline Charge",
    category: "Mobile",
    secondary: "Charging",
    description: "A clear place for your everyday device, at home on your desk.",
    price: 96,
    image: photos.lamp,
    stock: 20,
    rating: 4.6,
    reviews: 238,
  },
];
export const accessories: ShowcaseProduct[] = [
  {
    id: "studio-case",
    name: "Studio Audio Case",
    category: "Accessories",
    secondary: "Audio",
    description: "A considered home for your everyday sound.",
    price: 35,
    image: photos.headphones,
    badge: "New Drop",
    rating: 4.8,
    reviews: 126,
    arrival: "Ships today",
  },
  {
    id: "travel-cable",
    name: "Travel Cable Duo",
    category: "Cables",
    secondary: "Essentials",
    description: "Less tangle. A little more room for the day.",
    price: 28,
    compareAt: 36,
    image: photos.headphones,
    rating: 4.7,
    reviews: 88,
    arrival: "Travel ready",
  },
  {
    id: "desk-stand",
    name: "Everyday Desk Stand",
    category: "Desk",
    secondary: "Charging",
    description: "A little more order for the everyday.",
    price: 42,
    image: photos.lamp,
    badge: "Low Stock",
    rating: 4.9,
    reviews: 203,
    arrival: "6 left",
  },
  {
    id: "carry-kit",
    name: "Carry Kit With Organizer",
    category: "Travel",
    secondary: "Carry",
    description: "The small essentials, all in one place.",
    price: 39,
    image: photos.bag,
    rating: 4.6,
    reviews: 74,
    arrival: "Ready to use",
  },
];
export const lookbook: ShowcaseProduct[] = apparel.map((p, i) => ({
  ...p,
  name: [
    "Relaxed Studio Set",
    "Gloss Puffer Jacket",
    "Ribbed Tank Set",
    "Black Studio Set",
    "Ivory Studio Coat",
    "Leather Biker Jacket",
    "Side-Slit Tank Set",
    "Stone Studio Trouser",
  ][i],
  secondary: [
    "Studio",
    "Outerwear",
    "Knits",
    "Monochrome",
    "Tailoring",
    "Leather",
    "Tailoring",
    "Studio",
  ][i],
  badge: [0, 4, 6].includes(i) ? "New" : [1, 3].includes(i) ? "Trending" : undefined,
}));
