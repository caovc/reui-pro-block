import type { ShopArtwork } from "./artwork";

export type ShopProduct = {
  id: string;
  name: string;
  detail: string;
  price: number;
  previous?: number;
  status?: string;
  artwork: ShopArtwork;
};

export const shopProducts: ShopProduct[] = [
  {
    id: "weekender",
    name: "Sundown Weekender",
    detail: "48-hour duffel",
    price: 224,
    status: "New",
    artwork: "weekender",
  },
  {
    id: "daypack",
    name: "Wayfarer Daypack",
    detail: "Everyday 18L",
    price: 148,
    previous: 185,
    status: "20% Off",
    artwork: "daypack",
  },
  {
    id: "tote",
    name: "Saddle Tote",
    detail: "Waxed canvas",
    price: 98,
    artwork: "tote",
  },
];

export const shopMoney = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
