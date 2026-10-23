/** Original, locally authored demo illustrations. No upstream preview media. */
const palettes = [
  ["#f0d9c8", "#6d5147", "#d8a181"],
  ["#dce3d6", "#526654", "#b88b70"],
  ["#dce4eb", "#4f6177", "#e7b69c"],
  ["#eee0d6", "#8b5e52", "#9e6e51"],
  ["#e5dfec", "#695b79", "#c8916e"],
];

function seedNumber(seed: string) {
  return Array.from(seed).reduce((value, letter) => (value * 31 + letter.charCodeAt(0)) >>> 0, 7);
}

export function svgImage(source: string) {
  return `data:image/svg+xml,${encodeURIComponent(source)}`;
}

export function demoAvatar(seed: string) {
  const number = seedNumber(seed);
  const [background, ink, skin] = palettes[number % palettes.length];
  return svgImage(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="24" fill="${background}"/>
      <circle cx="78" cy="18" r="21" fill="${ink}" opacity=".08"/>
      <path d="M12 96v-7c0-21 15-33 36-33s36 12 36 33v7" fill="${ink}"/>
      <rect x="39" y="49" width="18" height="19" rx="8" fill="${skin}"/>
      <ellipse cx="48" cy="38" rx="20" ry="24" fill="${skin}"/>
      <path d="M28 38V28c0-14 9-21 21-21 16 0 23 11 21 25-13 1-20-3-26-10-2 8-8 13-16 16Z" fill="${ink}"/>
      <path d="M43 47q5 4 10 0" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="40" cy="38" r="1.5" fill="${ink}"/>
      <circle cx="56" cy="38" r="1.5" fill="${ink}"/>
    </svg>
  `);
}

/** Abstract dashboard studies used as decorative panels, drawn here from basic geometry. */
export function demoPanel(index: number) {
  const accent = ["#d8a27f", "#9eb3a1", "#9daece", "#b5a0c4", "#ccb773"][index % 5];
  const columns = Array.from({ length: 9 }, (_, column) => {
    const height = 22 + ((index * 19 + column * 31) % 84);
    return `<rect x="${76 + column * 27}" y="${172 - height}" width="17" height="${height}" rx="3" fill="${accent}" opacity="${0.45 + (column % 3) * 0.2}"/>`;
  }).join("\n");
  const rows = Array.from(
    { length: 4 },
    (_, row) => `
    <rect x="75" y="${66 + row * 29}" width="${130 + ((index + row) % 3) * 35}" height="6" rx="3" fill="#494b50"/>
    <circle cx="319" cy="${69 + row * 29}" r="5" fill="${accent}" opacity=".7"/>
  `,
  ).join("\n");
  return svgImage(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220">
      <rect width="360" height="220" rx="14" fill="#202226"/>
      <rect x="1" y="1" width="358" height="218" rx="13" fill="none" stroke="#3c3e43"/>
      <path d="M53 16v188M68 45h273" fill="none" stroke="#3c3e43"/>
      <rect x="17" y="19" width="20" height="20" rx="5" fill="${accent}"/>
      <rect x="75" y="24" width="95" height="7" rx="3.5" fill="#b4b5b9"/>
      <rect x="282" y="20" width="47" height="17" rx="5" fill="${accent}" opacity=".6"/>
      <path d="M21 62h12M21 84h12M21 106h12M21 128h12" stroke="#777a81" stroke-width="4" stroke-linecap="round"/>
      ${index % 2 ? rows : columns}
      <rect x="75" y="190" width="160" height="5" rx="2.5" fill="#494b50"/>
    </svg>
  `);
}

/** Typographic integration badges, independently drawn rather than copied vendor logos. */
export function integrationArtwork(initial: string, color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect width="48" height="48" rx="12" fill="${color}"/>
    <path d="M8 35h32" stroke="#fff" stroke-opacity=".15" stroke-width="2"/>
    <text x="24" y="31" text-anchor="middle" fill="#fff" font-size="22" font-family="sans-serif" font-weight="600">${initial}</text>
  </svg>`;
}
