import { wishlistArtwork } from "../wishlist-artwork";

/** Entirely fictional Bricklane Audio demo models; values are not real product recommendations. */
const seeds = [
  {
    id: "sora",
    name: "Sora One",
    tagline: "The easy everyday listen.",
    price: 129,
    rating: 4.3,
    reviews: 184,
    tone: "#a99678",
    battery: 30,
    weight: 250,
    charging: 2,
    codec: "AAC",
    anc: true,
    multipoint: false,
    wired: true,
    case: false,
    app: false,
    foldable: true,
    hires: false,
  },
  {
    id: "field",
    name: "Field Pro",
    tagline: "A little more room for your music.",
    price: 199,
    rating: 4.7,
    reviews: 328,
    tone: "#667866",
    battery: 45,
    weight: 230,
    charging: 1.5,
    codec: "LDAC",
    anc: true,
    multipoint: true,
    wired: true,
    case: true,
    app: true,
    foldable: true,
    hires: true,
  },
  {
    id: "studio",
    name: "Studio Max",
    tagline: "Considered sound, without compromise.",
    price: 349,
    rating: 4.8,
    reviews: 216,
    tone: "#565f72",
    battery: 60,
    weight: 285,
    charging: 2,
    codec: "aptX HD",
    anc: true,
    multipoint: true,
    wired: true,
    case: true,
    app: true,
    foldable: false,
    hires: true,
  },
  {
    id: "arc",
    name: "Arc Travel",
    tagline: "For taking the longer way.",
    price: 249,
    rating: 4.6,
    reviews: 141,
    tone: "#a17c6e",
    battery: 70,
    weight: 215,
    charging: 1,
    codec: "AAC",
    anc: true,
    multipoint: true,
    wired: true,
    case: true,
    app: true,
    foldable: true,
    hires: false,
  },
  {
    id: "pocket",
    name: "Pocket Lite",
    tagline: "Keep it simple. Take it anywhere.",
    price: 99,
    rating: 4.1,
    reviews: 94,
    tone: "#9c9b86",
    battery: 24,
    weight: 190,
    charging: 1.25,
    codec: "SBC",
    anc: false,
    multipoint: false,
    wired: true,
    case: false,
    app: false,
    foldable: true,
    hires: false,
  },
  {
    id: "reference",
    name: "Reference X",
    tagline: "A closer listen to the little details.",
    price: 429,
    rating: 4.9,
    reviews: 75,
    tone: "#7d6882",
    battery: 50,
    weight: 310,
    charging: 2.5,
    codec: "LDAC",
    anc: true,
    multipoint: true,
    wired: true,
    case: true,
    app: true,
    foldable: false,
    hires: true,
  },
] as const;
export const comparisonProducts = seeds.map((product) => ({
  ...product,
  image: wishlistArtwork("headphones", product.tone),
}));
export type ComparisonProduct = (typeof comparisonProducts)[number];
export type ComparisonProductId = ComparisonProduct["id"];
export const productById = Object.fromEntries(
  comparisonProducts.map((product) => [product.id, product]),
) as Record<ComparisonProductId, ComparisonProduct>;
export const compareMoney = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);

export type SpecKey =
  | "price"
  | "rating"
  | "codec"
  | "anc"
  | "multipoint"
  | "hires"
  | "battery"
  | "weight"
  | "charging"
  | "wired"
  | "case"
  | "app"
  | "foldable";
export type ComparisonSpec = {
  id: SpecKey;
  label: string;
  unit?: string;
  better?: "higher" | "lower";
  hint?: string;
};
export const comparisonGroups: { id: string; name: string; specs: ComparisonSpec[] }[] = [
  {
    id: "essentials",
    name: "The essentials",
    specs: [
      {
        id: "price",
        label: "Price",
        better: "lower",
        hint: "Lower sample price is emphasized. Prices describe fictional demo models.",
      },
      {
        id: "rating",
        label: "Community rating",
        better: "higher",
        hint: "Fictional sample ratings out of five; a higher value is emphasized.",
      },
    ],
  },
  {
    id: "audio",
    name: "Audio & connection",
    specs: [
      {
        id: "codec",
        label: "Wireless codec",
        hint: "A codec carries audio over Bluetooth. Codec names are not ranked as numbers.",
      },
      { id: "anc", label: "Active noise cancellation" },
      { id: "multipoint", label: "Multipoint pairing" },
      { id: "hires", label: "Hi-res wireless audio" },
    ],
  },
  {
    id: "everyday",
    name: "Everyday details",
    specs: [
      {
        id: "battery",
        label: "Battery life",
        unit: "hrs",
        better: "higher",
        hint: "Fictional playback estimates. Longer battery life is emphasized.",
      },
      {
        id: "weight",
        label: "Weight",
        unit: "g",
        better: "lower",
        hint: "The lower sample weight is emphasized.",
      },
      {
        id: "charging",
        label: "Full charge",
        unit: "hrs",
        better: "lower",
        hint: "The shorter sample full-charge time is emphasized.",
      },
      { id: "wired", label: "Wired listening" },
      { id: "case", label: "Travel case included" },
      { id: "app", label: "Companion app" },
      { id: "foldable", label: "Folding design" },
    ],
  },
];
export const comparisonRows = comparisonGroups.flatMap((group) => [
  { id: `group-${group.id}`, group: group.name, spec: null },
  ...group.specs.map((spec) => ({ id: spec.id, group: group.name, spec })),
]);
export type ComparisonRow = (typeof comparisonRows)[number];

/** Typed numeric comparison: ties and text/boolean specs deliberately have no winner. */
export function specWinner(spec: ComparisonSpec, a: ComparisonProduct, b: ComparisonProduct) {
  const left = a[spec.id],
    right = b[spec.id];
  if (!spec.better || typeof left !== "number" || typeof right !== "number" || left === right)
    return null;
  return (spec.better === "higher" ? left > right : left < right) ? a.id : b.id;
}
export const pickFeatures: {
  id: "anc" | "multipoint" | "hires" | "case" | "app" | "foldable";
  label: string;
}[] = [
  { id: "anc", label: "Active noise cancellation" },
  { id: "multipoint", label: "Two-device pairing" },
  { id: "hires", label: "Hi-res wireless audio" },
  { id: "case", label: "Travel case included" },
  { id: "app", label: "Companion app" },
  { id: "foldable", label: "Folding design" },
];
export const editorPicks = [
  {
    id: "sora" as ComparisonProductId,
    label: "Best value",
    variant: "success-light" as const,
    pitch: "A straightforward everyday listen, with the essentials at an easy starting price.",
  },
  {
    id: "field" as ComparisonProductId,
    label: "Editor's choice",
    variant: "info-light" as const,
    pitch:
      "The balanced middle ground: a lighter build, longer listening and useful everyday features.",
  },
  {
    id: "studio" as ComparisonProductId,
    label: "Top premium",
    variant: "focus-light" as const,
    pitch: "More listening time and a considered feature set for the days when music comes first.",
  },
];
