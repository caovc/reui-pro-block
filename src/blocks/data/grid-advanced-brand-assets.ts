import { integrationArtwork, svgImage } from "@/lib/demo-artwork";

/** Independently drawn integration badges, not vendor logo reproductions. */
const brands = [
  ["apple", "A", "#66747b"],
  ["spotify", "S", "#648c6d"],
  ["youtube", "Y", "#ac665e"],
  ["x", "X", "#6a6f79"],
  ["docker", "D", "#5c83a2"],
  ["loom", "L", "#8873a6"],
  ["hono", "H", "#b37850"],
  ["redis", "R", "#b16d68"],
  ["googlegemini", "G", "#8572a4"],
  ["google", "G", "#5d84a0"],
  ["slack", "S", "#946d89"],
];

export const advancedBrandAssets: Record<string, string> = Object.fromEntries(
  brands.map(([key, initial, color]) => [key, svgImage(integrationArtwork(initial, color))]),
);

/** Locally authored apparel/footwear studies used by the product KPI demo. */
export function productArtwork(id: number, name: string) {
  const index = (id - 1) % 10;
  const colors = ["#786b58", "#78785c", "#707c87", "#a67b67", "#6e847b"];
  const color = colors[index % colors.length];
  const shape = /pant|trouser/i.test(name)
    ? `
      <path d="M30 21h36l-4 58H49l-1-32-2 32H33Z" fill="${color}"/>
      <path d="M31 29h34M48 29v16" fill="none" stroke="#eee9df" stroke-width="3"/>
    `
    : /runner|approach|slide/i.test(name)
      ? `
      <path d="m20 50 12 4 12-16 11 16 16 8v11H19Z" fill="${color}"/>
      <path d="M19 73h53v6H19Z" fill="#42494d"/>
      <path d="m37 50 13 5m-17 1 17 5" fill="none" stroke="#eee9df"
        stroke-width="3" stroke-linecap="round"/>
    `
      : /boot|trekker/i.test(name)
        ? `
      <path d="M26 28h20l4 23 17 9c5 3 6 8 3 12H20V60l6-8Z" fill="${color}"/>
      <path d="M20 72h51v7H20Z" fill="#42494d"/>
      <path d="m37 42 12 2m-11 6 12 2m-10 6 15 2" fill="none"
        stroke="#eee9df" stroke-width="3" stroke-linecap="round"/>
    `
        : `
      <path d="m31 24 12-4h10l12 4 13 13-10 11-7-6v36H35V42l-7 6-10-11Z" fill="${color}"/>
      <path d="M43 20q5 14 10 0M48 32v46M40 55h16" fill="none"
        stroke="#eee9df" stroke-width="3"/>
    `;
  return svgImage(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="14" fill="#f1eee7"/>
      <ellipse cx="48" cy="81" rx="30" ry="4" fill="#d4d1ca"/>
      ${shape}
    </svg>
  `);
}
