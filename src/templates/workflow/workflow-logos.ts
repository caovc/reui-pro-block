import { integrationArtwork } from "@/lib/demo-artwork";

// Original typographic badges for the demo's five integrations.
export const workflowLogos = [
  ["L", "#655c85"],
  ["S", "#9a576b"],
  ["N", "#353733"],
  ["L", "#5c6a75"],
  ["D", "#5b7867"],
].map(([initial, color]) => integrationArtwork(initial, color));
