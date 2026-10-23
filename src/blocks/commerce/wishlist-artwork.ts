import { svgImage } from "@/lib/demo-artwork";

/** Original product illustrations drawn from basic geometry for Bricklane's independent demos.
 * No upstream photographs, logos, traced shapes or extracted SVG assets are used.
 */
export type WishlistArt =
  | "coat"
  | "shirt"
  | "sweater"
  | "trouser"
  | "shoe"
  | "bag"
  | "wallet"
  | "speaker"
  | "coffee"
  | "headphones"
  | "lamp"
  | "throw"
  | "tray"
  | "belt"
  | "beanie";
const drawings: Record<WishlistArt, string> = {
  coat: `
    <path d="M220 176 162 208 110 389 177 410 206 323 197 578H403L394 323 423 410 490 389 438 208 380 176 339 196H261Z" fill="url(#material)"/>
    <path d="m220 176 79 103-57 53-25-118m163-38-79 103 57 53 25-118" fill="#fff" opacity=".18"/>
    <path d="M300 280v295m-75-150h48m54 0h48" stroke="#302b27" stroke-opacity=".3" stroke-width="4"/>
    <circle cx="317" cy="350" r="5" fill="#493b32"/>
    <circle cx="317" cy="410" r="5" fill="#493b32"/>
    <circle cx="317" cy="470" r="5" fill="#493b32"/>
  `,
  shirt: `
    <path d="m224 213-66 43-49 103 71 31 32-53 3 226h170l3-226 32 53 71-31-49-103-66-43-39 25h-74Z" fill="url(#material)"/>
    <path d="m224 213 76 66-33 30-40-56m149-40-76 66 33 30 40-56" fill="#fff" opacity=".24"/>
    <path d="M301 280v279m28-194h48v60h-48" fill="none" stroke="#514b43" stroke-opacity=".25" stroke-width="3"/>
    <g fill="#f8f3eb">
    <circle cx="303" cy="336" r="3"/>
    <circle cx="303" cy="390" r="3"/>
    <circle cx="303" cy="444" r="3"/>
    <circle cx="303" cy="498" r="3"/>
    </g>
  `,
  sweater: `
    <path d="m220 219-56 27-60 171 67 26 45-108-4 220h176l-4-220 45 108 67-26-60-171-56-27-37 46h-86Z" fill="url(#material)"/>
    <path d="m220 219 80 86 80-86m-166 309h172M118 398l59 23m246 0 59-23" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="13"/>
    <path d="M238 330v170m22-168v170m22-165v165m24-165v165m24-165v165m24-165v165" stroke="#fff" stroke-opacity=".08" stroke-width="3"/>
  `,
  trouser: `
    <path d="M209 178h182l14 145-42 271h-70l8-219-8-25-8 25 8 219h-70l-42-271Z" fill="url(#material)"/>
    <path d="M211 205h178M296 207v112m-62-79-12 67m145-67 12 67M243 362l17 212m78-212-17 212" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="4"/>
    <path d="M266 181v25m64-25v25" stroke="#4d493f" stroke-width="7"/>
  `,
  shoe: `
    <path d="M126 394c29-8 61-70 115-74 57-5 72 20 103 44 26 20 79 11 110 51 14 18 13 45-13 57-44 21-233 21-300-2-30-10-40-58-15-76Z" fill="url(#material)"/>
    <path d="M115 442c73 36 246 36 340-1v29c-69 35-252 36-324-2Z" fill="#38312c"/>
    <path d="m209 345 96 69 63-25m-166-26 69 52m-55-38 40-17m-20 36 44-18" fill="none" stroke="#ead8c4" stroke-width="5" stroke-linecap="round"/>
    <path d="M129 427q95 41 288 4" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="3" stroke-dasharray="4 7"/>
  `,
  bag: `
    <path d="M155 309h290l-20 255H175Z" fill="url(#material)"/>
    <path d="M232 333v-93c0-88 136-88 136 0v93" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="20"/>
    <path d="M232 333v-93c0-88 136-88 136 0v93" fill="none" stroke="#352f29" stroke-opacity=".3" stroke-width="9"/>
    <path d="M177 349h246m-37 28v142" stroke="#fff" stroke-opacity=".16" stroke-width="4"/>
    <rect x="271" y="355" width="58" height="37" rx="6" fill="#b09a75"/>
  `,
  wallet: `
    <g transform="rotate(-16 300 360)">
    <rect x="166" y="247" width="268" height="217" rx="18" fill="url(#material)"/>
    <path d="M183 276h235M190 302h220m-220 25h220m-220 25h220" stroke="#fff" stroke-opacity=".19" stroke-width="3"/>
    <path d="M182 262h234v188H182Z" fill="none" stroke="#e0c5ac" stroke-opacity=".5" stroke-width="2" stroke-dasharray="3 5"/>
    <rect x="184" y="359" width="232" height="91" rx="9" fill="#241e1a" opacity=".28"/>
    </g>
  `,
  speaker: `
    <rect x="202" y="165" width="196" height="410" rx="20" fill="url(#material)"/>
    <rect x="218" y="181" width="164" height="375" rx="12" fill="#2d302c"/>
    <circle cx="300" cy="270" r="43" fill="#111815"/>
    <circle cx="300" cy="270" r="28" fill="#65706b"/>
    <circle cx="300" cy="432" r="70" fill="#0f1713" stroke="#59645d" stroke-width="7"/>
    <circle cx="300" cy="432" r="42" fill="#384a40"/>
    <circle cx="300" cy="432" r="18" fill="#17251e"/>
  `,
  coffee: `
    <rect x="162" y="199" width="276" height="318" rx="19" fill="url(#material)"/>
    <rect x="183" y="267" width="234" height="151" rx="11" fill="#454a47"/>
    <circle cx="218" cy="233" r="12" fill="#fff" opacity=".8"/>
    <circle cx="270" cy="233" r="7" fill="#2e3b32"/>
    <path d="M300 290v47h73" fill="none" stroke="#dfe0d6" stroke-width="18" stroke-linecap="round"/>
    <path d="M263 361h82l-8 57h-66Z" fill="#f5eee3"/>
    <path d="M344 369c36-10 36 32-4 26" fill="none" stroke="#f5eee3" stroke-width="8"/>
    <rect x="183" y="452" width="234" height="24" rx="5" fill="#5d645f"/>
    <path d="M200 519v26m200-26v26" stroke="#3d413d" stroke-width="17"/>
  `,
  headphones: `
    <path d="M181 400V302c0-179 238-179 238 0v98" fill="none" stroke="#373c36" stroke-width="35"/>
    <path d="M181 312c0-160 238-160 238 0" fill="none" stroke="#747c70" stroke-width="11"/>
    <g fill="url(#material)">
    <rect x="148" y="342" width="88" height="158" rx="38" transform="rotate(-12 192 421)"/>
    <rect x="364" y="342" width="88" height="158" rx="38" transform="rotate(12 408 421)"/>
    </g>
    <path d="M209 358v124m182-124v124" stroke="#111a14" stroke-width="12" stroke-linecap="round"/>
  `,
  lamp: `
    <ellipse cx="302" cy="562" rx="100" ry="21" fill="#484c43"/>
    <path d="m302 543-9-193 84-103" fill="none" stroke="#4b5046" stroke-width="13" stroke-linecap="round"/>
    <circle cx="292" cy="350" r="14" fill="#777d6d"/>
    <path d="m342 189 90 45 3 100-165-83Z" fill="url(#material)"/>
    <path d="m270 251 165 83" stroke="#efe6c5" stroke-width="8"/>
  `,
  throw: `
    <path d="m176 254 205-36 64 296-225 38Z" fill="url(#material)"/>
    <path d="m181 292 207-36m-198 74 206-36m-198 76 207-36m-200 74 207-36m-199 74 207-36m-199 74 207-36" stroke="#fff" stroke-opacity=".19" stroke-width="12"/>
    <path d="m223 548 4 25m19-29 4 25m19-29 4 25m19-29 4 25m19-29 4 25m19-29 4 25m19-29 4 25m19-29 4 25m19-29 4 25" stroke="#a8977e" stroke-width="4"/>
  `,
  tray: `
    <path d="m118 325 281-77 89 185-277 85Z" fill="url(#material)"/>
    <path d="m143 337 242-63 73 143-242 73Z" fill="#ad8258"/>
    <path d="m158 350 213-58m-193 83 204-56m-189 82 205-56m-192 82 206-56m-188 81 200-54" stroke="#61462d" stroke-opacity=".3" stroke-width="3"/>
  `,
  belt: `
    <path d="M166 245c236-62 327 218 101 266-157 34-205-178-58-215" fill="none" stroke="url(#material)" stroke-width="43"/>
    <rect x="140" y="220" width="84" height="69" rx="6" fill="none" stroke="#b4a685" stroke-width="13" transform="rotate(-18 182 254)"/>
    <path d="m180 226 20 60" stroke="#b4a685" stroke-width="7"/>
  `,
  beanie: `
    <path d="M178 414c-14-288 258-288 244 0Z" fill="url(#material)"/>
    <path d="M225 210v202m50-234v234m50-234v234m50-202v202" stroke="#fff" stroke-opacity=".18" stroke-width="7"/>
    <rect x="165" y="401" width="270" height="102" rx="23" fill="url(#material)"/>
    <rect x="270" y="430" width="60" height="42" rx="4" fill="#e0c9a9"/>
  `,
};
export function wishlistArtwork(kind: WishlistArt, tone = "#aa9273") {
  return svgImage(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 720">
      <defs>
      <linearGradient id="back" x2="1" y2="1">
      <stop stop-color="#eee9df"/>
      <stop offset="1" stop-color="#d9ddd4"/>
      </linearGradient>
      <linearGradient id="material" x2="1" y2=".6">
      <stop stop-color="${tone}"/>
      <stop offset="1" stop-color="${tone}" stop-opacity=".76"/>
      </linearGradient>
      <filter id="shadow" x="-30%" y="-20%" width="160%" height="150%">
      <feDropShadow dx="9" dy="19" stdDeviation="16" flood-color="#252a24" flood-opacity=".16"/>
      </filter>
      </defs>
      <rect width="600" height="720" fill="url(#back)"/>
      <circle cx="544" cy="97" r="230" fill="#fff" opacity=".18"/>
      <path d="M0 603h600" stroke="#b4bcad" stroke-opacity=".3"/>
      <ellipse cx="302" cy="606" rx="147" ry="18" fill="#525e4e" opacity=".07"/>
      <g filter="url(#shadow)">
        ${drawings[kind]}
      </g>
      </svg>`,
  );
}
