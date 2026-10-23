import { integrationArtwork } from "@/lib/demo-artwork";

// Original typographic demo badges; these are not official service logos.
export const serviceLogos = [
  ["B", "#b98447"],
  ["T", "#4e8574"],
  ["A", "#6b7195"],
  ["X", "#53555c"],
].map(([initial, color]) => integrationArtwork(initial, color));
