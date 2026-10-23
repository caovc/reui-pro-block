import { integrationArtwork, svgImage } from "@/lib/demo-artwork";

/** Original typographic demo badges; no upstream preview graphics. */
const brands = [
  ["convex", "C", "#795269"],
  ["n8n", "N", "#b65776"],
  ["figma", "F", "#aa6248"],
  ["notion", "N", "#555964"],
  ["cursor", "C", "#66747b"],
  ["resend", "R", "#62605c"],
  ["neon", "N", "#3d8575"],
  ["mintlify", "M", "#56866a"],
  ["anthropic", "A", "#8d7166"],
  ["zoom", "Z", "#4f74a3"],
  ["prisma", "P", "#5b7080"],
  ["supabase", "S", "#448271"],
  ["paypal", "P", "#526d96"],
  ["stripe", "S", "#7968a0"],
  ["vercel", "V", "#56636b"],
  ["linear", "L", "#7379a7"],
  ["planetscale", "P", "#6a766b"],
  ["openai", "O", "#537b70"],
];

export const gridBrandAssets: Record<string, string> = Object.fromEntries(
  brands.map(([key, initial, color]) => [key, svgImage(integrationArtwork(initial, color))]),
);
