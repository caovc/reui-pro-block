import { svgImage } from "@/lib/demo-artwork";

/** Original independent shopping / gift-paper still lifes, drawn from basic shapes.
 * No upstream image, traced geometry, product logo or extracted SVG is used.
 */
export function couponCampaignArtwork(member: boolean) {
  return svgImage(
    member
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720">
    <defs>
      <linearGradient id="paper"><stop stop-color="#42424b"/><stop offset="1" stop-color="#292b33"/></linearGradient>
      <linearGradient id="red" x2="1" y2="1"><stop stop-color="#c95b50"/><stop offset="1" stop-color="#a53635"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="10" dy="16" stdDeviation="12" flood-opacity=".27"/></filter>
    </defs>
    <rect width="720" height="720" fill="url(#paper)"/>
    <path d="m0 80 720 430M0 500l580-500M0 610l720-150" stroke="#fff" stroke-opacity=".035" stroke-width="2"/>
    <g transform="rotate(-19 175 177)" filter="url(#shadow)">
      <path d="M44 26h255v247H44Z" fill="#f1d9bc"/>
      <path d="M44 26h255l-14 20H58Z" fill="#e7c49e"/>
      <path d="M107 80c-15 174 151 174 136 0" fill="none" stroke="#9a6459" stroke-width="7"/>
      <rect x="150" y="25" width="34" height="248" fill="#b7544e"/>
    </g>
    <g transform="rotate(23 579 118)" filter="url(#shadow)">
      <path d="M462-45h270v265H462Z" fill="url(#red)"/>
      <path d="M484-22h225v215H484Z" fill="none" stroke="#e49280" stroke-width="2"/>
      <path d="M516 47c-13 140 128 140 114 0" fill="none" stroke="#d4ac84" stroke-width="7"/>
    </g>
    <g transform="rotate(-8 436 500)" filter="url(#shadow)">
      <rect x="288" y="338" width="296" height="308" rx="3" fill="#c35d53"/>
      <path d="M287 338h297l-22 19H309Z" fill="#b14a44"/>
      <path d="M342 381c-16 160 180 160 164 0" fill="none" stroke="#edc7a7" stroke-width="8"/>
      <rect x="328" y="528" width="216" height="72" fill="#e2ae83" opacity=".19"/>
    </g>
    <g transform="rotate(28 55 649)"><rect x="-83" y="548" width="238" height="240" fill="#e8d7c5"/><path d="M-40 586c-10 137 155 137 145 0" fill="none" stroke="#9c7e62" stroke-width="7"/></g>
    <circle cx="618" cy="533" r="29" fill="#d2aa75"/><path d="m601 514 35 39m0-39-35 39" stroke="#f3dfbe" stroke-width="2"/>
  </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720">
    <defs>
      <linearGradient id="back" x2="1" y2="1"><stop stop-color="#d9ddd0"/><stop offset="1" stop-color="#b2c0af"/></linearGradient>
      <linearGradient id="coat" x2="1" y2="1"><stop stop-color="#a76351"/><stop offset="1" stop-color="#854d42"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="10" dy="15" stdDeviation="12" flood-color="#333b30" flood-opacity=".2"/></filter>
    </defs>
    <rect width="720" height="720" fill="url(#back)"/>
    <path d="M0 536h720v184H0Z" fill="#d4c2a4"/>
    <circle cx="537" cy="141" r="111" fill="#e9dfbf"/>
    <path d="M0 12h720M0 48h720m-610 0v488" stroke="#f0eee0" stroke-opacity=".17" stroke-width="6"/>
    <g transform="rotate(-5 362 349)" filter="url(#shadow)">
      <path d="M263 170 205 200 149 412 222 432 250 341 242 611H470L462 341 490 432 563 412 507 200 449 170 402 191H310Z" fill="url(#coat)"/>
      <path d="m263 170 93 119-63 58-29-130m185-47-93 119 64 58 28-130" fill="#d7957a"/>
      <path d="M355 291v315m-81-160h46m75 0h45" stroke="#633d34" stroke-width="4"/>
      <circle cx="374" cy="373" r="5" fill="#573d32"/><circle cx="374" cy="437" r="5" fill="#573d32"/><circle cx="374" cy="501" r="5" fill="#573d32"/>
      <path d="M307 170q50-75 99 0" fill="none" stroke="#6c6652" stroke-width="5"/>
    </g>
    <g transform="rotate(9 568 561)" filter="url(#shadow)"><path d="M478 469h176l-14 190H493Z" fill="#eee5d0"/><path d="M520 492v-54c0-69 88-69 88 0v54" fill="none" stroke="#87785e" stroke-width="8"/><path d="M493 513h146" stroke="#d4c4a7" stroke-width="3"/></g>
    <g transform="rotate(-12 109 586)" filter="url(#shadow)"><path d="M19 509h173l-10 168H31Z" fill="#606e5d"/><path d="M56 529v-43c0-66 99-66 99 0v43" fill="none" stroke="#c4b28d" stroke-width="8"/></g>
  </svg>`,
  );
}
