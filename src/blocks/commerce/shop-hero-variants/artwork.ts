import { svgImage } from "@/lib/demo-artwork";

export type ShopArtwork = "weekender" | "daypack" | "tote";

/** Original geometric still lifes for Bricklane. No upstream photos or traced assets. */
export function shopArtwork(kind: ShopArtwork) {
  const palettes = {
    weekender: ["#2f4540", "#708276", "#566351", "#b5865a"],
    daypack: ["#d6dce0", "#b8c3cc", "#354b60", "#a7b3bf"],
    tote: ["#ece7df", "#d0c7b8", "#b89f7a", "#785e43"],
  };
  const [backdrop, surface, material, trim] = palettes[kind];
  const product =
    kind === "weekender"
      ? `
        <path d="M145 350q7-51 61-54h223q48 6 52 54l17 204q-3 35-45 39H172q-39-4-41-39Z" fill="url(#fabric)"/>
        <path d="M231 335v-88q0-80 101-80t101 80v88" fill="none" stroke="${trim}" stroke-width="23"/>
        <path d="M231 335v-88q0-80 101-80t101 80v88" fill="none" stroke="#e2c5a1" stroke-opacity=".3" stroke-width="4"/>
        <path d="M185 313v278m251-276v276" stroke="${trim}" stroke-width="24"/>
        <rect x="214" y="391" width="192" height="139" rx="12" fill="#20372e" opacity=".3"/>
        <path d="M224 409h172m-171 100h172" stroke="#ccd0b8" stroke-opacity=".4" stroke-width="2" stroke-dasharray="4 5"/>
        <path d="m155 358-25 152m348-151 26 151" fill="none" stroke="${trim}" stroke-width="13"/>
        <rect x="291" y="341" width="62" height="29" rx="3" fill="${trim}"/>
        <path d="m302 351 9 9 9-9 9 9 9-9" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
      `
      : kind === "daypack"
        ? `
          <path d="M206 267q0-70 109-70t109 70l22 284q0 31-34 36H218q-34-5-34-36Z" fill="url(#fabric)"/>
          <path d="M291 204v-26q0-28 49-28v54" fill="none" stroke="${trim}" stroke-width="14"/>
          <path d="M209 282q104-51 208 0M217 304q100-39 199 0" fill="none" stroke="${trim}" stroke-opacity=".6" stroke-width="4"/>
          <rect x="214" y="403" width="201" height="148" rx="27" fill="#1e3142"/>
          <path d="M227 426h174m-174 4h174" stroke="${trim}" stroke-width="3"/>
          <path d="M189 291c-67 5-65 187 4 196m244-196c67 5 65 187-4 196" fill="none" stroke="${material}" stroke-width="19"/>
          <rect x="293" y="331" width="42" height="32" rx="4" fill="${trim}"/>
          <path d="m303 341 10 11 11-11" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>
        `
        : `
          <path d="m153 322 325 1-28 265H179Z" fill="url(#fabric)"/>
          <path d="M233 346V234q0-78 81-78t81 78v112" fill="none" stroke="${trim}" stroke-width="20"/>
          <path d="M233 346V234q0-78 81-78t81 78v112" fill="none" stroke="#f1dec2" stroke-opacity=".25" stroke-width="4"/>
          <path d="M177 357h279m-239 31v164m201-164v164" stroke="#f7e8cd" stroke-opacity=".4" stroke-width="3"/>
          <rect x="271" y="374" width="91" height="58" rx="5" fill="${trim}"/>
          <path d="M291 393h50m-50 13h31" stroke="#f4dfc1" stroke-width="3"/>
        `;
  return svgImage(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 760">
      <defs>
        <linearGradient id="back" x2="1" y2="1">
          <stop stop-color="${backdrop}"/><stop offset="1" stop-color="${surface}"/>
        </linearGradient>
        <linearGradient id="fabric" x2="1" y2=".3">
          <stop stop-color="${material}"/><stop offset=".6" stop-color="${material}"/>
          <stop offset="1" stop-color="${trim}"/>
        </linearGradient>
      </defs>
      <rect width="620" height="760" fill="url(#back)"/>
      <path d="M0 589 620 500V760H0Z" fill="${surface}"/>
      <path d="M0 0h176L0 505Zm620 0V523L391 0Z" fill="#fff" opacity=".08"/>
      <ellipse cx="315" cy="606" rx="213" ry="28" fill="#17211b" opacity=".15"/>
      ${product}
      <path d="M37 699h77m-77 10h45" stroke="#fff" opacity=".15" stroke-width="3"/>
    </svg>
  `);
}
