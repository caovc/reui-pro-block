# Commerce and marketing implementation notes

The public catalog snapshot contains **87 ecommerce entries** in 13 categories and **67 marketing entries** in eight categories. The commerce router resolves all 154 ids to original React implementations built from the installed shadcn Radix primitives, semantic theme tokens, and Lucide icons. No REUI Pro source, premium icon files, or premium images were retrieved.

## Implementation structure

- `catalog.tsx`: category browsers, product tiles and grids, product detail, and product filters. Variants include horizontal numbered product stories, stacked panels, quick size controls, swatch-driven image changes, featured buy boxes, masonry, editorial detail, and a slide-out filter Sheet.
- `transactions.tsx`: checkout progression, demo payment validation, promo discounts, cart quantities/removal/save-for-later, delivery selection, shopping-bag Sheets, wishlist batch actions and restock state, receipt downloads, tracking steps, and local review submission.
- `promotions.tsx`: copyable coupon codes, offer filters, product comparison selection/specifications, ranked score bars, switchable alternatives, review filters/carousels/helpful state, and collection hero layouts.
- `marketing.tsx`: article grids/carousels and readable article detail, FAQ filtering and accordion variants, contact form validation and local confirmation, office/contact-channel surfaces, and workflow/feature comparisons.
- `heroes.tsx`: 16 hero variants, 17 CTA variants, and five explanatory layouts. The reusable mini console has view/range selection, focusable chart bars, notifications, and row details. Signup and conversation actions produce local confirmation states. The code-editor hero is editable, copyable, and resettable.
- `pricing.tsx`: four/three-column plans, billing controls, seat-based repricing, feature tables, and plan-upgrade dialogs with local confirmation.

## What coverage means

Every catalog entry has a working implementation path, but these are **reusable independently authored layout families**, not 154 separately copied Pro implementations. Variant selection uses the category and public catalog index. Public category Markdown descriptions informed the structure and controls; exact source or artwork was never accessed.

Important fidelity differences remain:

- Product/marketing text and sample data are original demo content rather than verbatim REUI samples.
- Product and editorial photographs are bundled free Unsplash photos under `src/blocks/commerce/assets`. Their source URLs and license are recorded in `ATTRIBUTION.md`. They are intentionally different from the premium reference assets.
- WebGL planets, isometric extruded logo scenes, complex animated console artwork, automatic carousel playback, and premium brand art are represented by simpler original CSS/icon/data treatments.
- Several variants share control/component families. In particular, checkout is one state machine with mode-specific fields; product tiles share a card primitive; marketing console surfaces share an interactive console.
- All payments, subscriptions, messages, purchases, alerts and account actions are explicitly local demos. No external service is invoked. Coupon Copy and receipt Download use browser APIs; Print uses the browser’s print dialog.

Do not label this catalog as a pixel-identical redistribution of the official REUI Pro product. The implementation remains useful as an editable open source starting point, with each public reference URL available for direct visual comparison.

## Verification performed

Scoped TypeScript diagnostics are clean. Playwright checked product search/add-to-cart, cart quantity changes/removal/discount application, validated one-page checkout and order confirmation, waitlist confirmation, and plan selection/confirmation. Product grid, checkout, hero, pricing, and FAQ were also measured at a 390px viewport with document width equal to viewport width. These flows produced no page errors. Bundled-image loading and the final product-grid, hero, and pricing screenshots were visually inspected. Exhaustive catalog route smoke testing is handled by the integration test suite.

## Focused fidelity pass

A second pass compared the public title-specific briefs to the implementation and closed several structural/functional gaps:

- **Pricing 1/3** now distinguish a +/- seat stepper with a slider from team-size selection tabs. The per-seat variant shows live per-seat totals, an owned plan state, a customer quote, and all 13 feature rows. The plan-comparison variant includes metered allowance/rate details.
- **Checkout 3/4** now have genuinely different flows. AI credit checkout selects a provider and token pack, reprices the summary, and retains auto top-up/usage alert preferences. Its summary shows credits rather than physical goods. Express checkout displays a saved Visa, requires only CVV, and reveals full card fields on request. Full card entry formats card numbers/expiry as typed.
- **Comparison 1/2/3/6** now start with six removable specification columns, compare two selected products with automatic value/rating/delivery winners and a Swap action, show richer editor-pick specs, and provide a live four-slot comparison builder respectively.
- **Shop Hero 1–8** now have their own compositions: a three-product asymmetric mosaic with a working bag; campaign/product/sale bento; full-bleed deal with an actual ticking countdown and three promo tiles; a four-category editorial grid; two full-image collection stories; a stamped seasonal split; numbered image-thumbnail collection tabs with a reminder state; and a four-tile collection quilt. Collection actions open a browsable product panel and its add controls update a shared local bag.
- Wishlist bulk controls wrap at narrow widths. The per-seat pricing tabs also wrap so the extra team-size options remain within a 390px viewport.

The focused pass was exercised in Playwright, including seat repricing, provider/automation summary, saved-card checkout, comparison winners/slots, live mosaic cart and decrementing sale timer. New/affected surfaces were checked for horizontal overflow at 390px. Scope remains independent implementations with simplified premium artwork and shared component families; it is not a claim of pixel-identical parity.

## Product Card: per-entry live-preview audit

Audit date: **2026-10-22**. Each of the ten catalog reference pages below was opened in a browser. Its visible public iframe URL (`https://reui.io/preview/base/product-card-N?embed=1`) was read from the page and inspected at **1280 × 1000**. The corresponding local preview was captured and visually compared. No Pro source files or premium photo assets were retrieved. IAB was unavailable in the child context and the Playwright connector lacked its Chrome extension, so the project's installed headless Chromium was used for this audit.

“Visually reviewed” below means a comparison of the stated desktop structure/state was actually performed. It **does not mean pixel-identical parity**. The existing bundled free photographs are deliberately reused, sometimes as repeated clothing/device proxies, and remain the largest visual difference. The public preview uses Base primitives while this project uses the installed shadcn Radix Nova theme, so some typography, status badges and control geometry still differ. Temporary reference/local screenshots were kept under `/tmp/reui-product-card-N-reference.png` and `/tmp/reui-product-card-N-final.png`; reference screenshots are not distributed as project assets.

### product-card-1 — Apparel Wishlist Grid

- Reference: https://reui.io/blocks/ecommerce/product-card/product-card-1
- Observed: vertically centered breadcrumb/title above four borderless apparel tiles; portrait 4:5 photos, pinned hearts, category/status line, title, description and compare-at pricing. No search/filter/cart controls. The second tile starts liked; a public wishlist click changed its accessible Add/Remove state.
- Corrections: replaced the mixed generic catalog with apparel-only tiles, centered header and 4:5 photos; removed extraneous catalog/cart controls; restored caption badges, the seeded second heart, compare-at ordering and solid sale badges.
- Remaining: repeated bundled jacket/tee photographs replace the four studio-model shots; some sample names/descriptions and minor font/control details differ.
- Verification: **visually reviewed — desktop default**. Local wishlist toggle and absence of cart actions passed; 390px document/viewport widths were 390/390.

### product-card-2 — Colorway Catalog

- Reference: https://reui.io/blocks/ecommerce/product-card/product-card-2
- Observed: left breadcrumb/title/lede, right Show Filters and sort controls, four rounded outlined cards with full-width photos, category, four swatches and a selected color name, then title/description/pricing. Public filter popover contains Category, Availability, Sale only and color-family chips.
- Corrections: added a dedicated outlined colorway composition, compact horizontal popover fields, availability/sale/category/color-family filtering, sorting, four named swatches per product, selected-color text at the card edge and local wishlist state. Removed the unrelated search box/cart buttons.
- Remaining: swatches apply a visible tint to the bundled photo rather than switching to separate model photographs; filter styling and some sample copy differ.
- Verification: **visually reviewed — desktop default and public filter popover**. Local category narrowing/reset and Cognac color selection passed; mobile 390/390.

### product-card-3 — Quick Buy Card

- Reference: https://reui.io/blocks/ecommerce/product-card/product-card-3
- Observed: one centered approximately 770px outlined card; 440px image/carousel at left, concise copy and discount row at right, generous space above a full-width XS–XL selector, then stacked Add to Bag/Wishlist controls. Selected M has a small check marker. No breadcrumb, quantity stepper, review row or product-detail accordions.
- Corrections: replaced the full product-detail page with a compact two-column buy card; added two image slides, stock tooltip, five equal-width size choices/check marker, full-width bag/wishlist controls and an actual size-guide dialog.
- Remaining: bundled tee/jacket photographs are proxies for the reference's front/side tank-set shots; the local size-guide dialog and bag confirmation are additional demo behavior; prose/control styling differs slightly.
- Verification: **visually reviewed — desktop default**; public carousel/size/cart controls were exercised. Local slide change, XS selection, size-specific bag confirmation and guide opening passed; mobile 390/390.

### product-card-4 — Related Products

- Reference: https://reui.io/blocks/ecommerce/product-card/product-card-4
- Observed: Similar Products header, 1/2 page badge and circular arrows; four of eight outlined apparel cards visible at once; hearts, sale badges and low-stock caption chips; no cart controls. The public Next action changed the page to 2/2.
- Corrections: implemented an eight-item native scroll-snap carousel, viewport-aware page count, disabled end arrows, four desktop columns, outlined product cards, low-stock placement and wishlist state. Removed cart controls and unrelated heading content.
- Remaining: native scroll snapping replaces the reference carousel library; photography, some sample items and subtle transition/card geometry differ.
- Verification: **visually reviewed — desktop first page**. Public and local page advancement were checked; local previous-arrow state passed; mobile 390/390.

### product-card-5 — Featured Product

- Reference: https://reui.io/blocks/ecommerce/product-card/product-card-5
- Observed: approximately 1024px bordered audio-product spotlight, **copy on the left / 600px image on the right**; two image corners are cut; category/stock, rating/review count, sale/price row and three checked benefits; five finish buttons and a Tech Specs link sit above the bottom bag/wishlist row.
- Corrections: replaced the furniture/image-left detail layout with the audio/copy-left composition, cut-corner image treatment, rating/benefit rows, five equal-width finishes/check marker, finish-specific bag feedback and a working specs dialog.
- Remaining: a bundled over-ear headphone photo replaces white earbuds; the polygon cut corners are less rounded than the reference mask; finish selection tints the image instead of supplying five photographs. Specs/dialog content is local demo content.
- Verification: **visually reviewed — desktop default**; public finish/cart controls were exercised. Local Sand selection, bag confirmation and specs dialog state passed; mobile 390/390.

### product-card-6 — Masonry Gallery

- Reference: https://reui.io/blocks/ecommerce/product-card/product-card-6
- Observed: top-aligned breadcrumb, Studio Mosaic heading/count and filter/sort toolbar; eight photos in four masonry columns with mixed ratios. At rest there is no text under the photos. Hover reveals a small inset white details panel with tagged category, status, title, clipped description and price. The public popover has category, signal, price band and sale controls.
- Corrections: expanded the former short three-column catalog to eight photo-only tiles in four mixed-height columns; added inset hover/focus panels, seeded-heart visibility, matching filter categories/signal/price/sale controls and live piece counts.
- Remaining: repeated bundled clothing photos replace the varied reference model imagery; ratio/spacing and transition easing are close structural approximations; hover prose is original.
- Verification: **visually reviewed — desktop default, public filter popover and hover panel**. Local mouse hover and keyboard focus were checked after animation settled (opacity 1 / transform none); the resulting screenshots were inspected. Local New filtering produced two pieces; mobile 390/390.

### product-card-7 — New Arrivals Carousel

- Reference: https://reui.io/blocks/ecommerce/product-card/product-card-7
- Observed: Latest Products header with arrows, four of eight outlined apparel cards, arrival note beside the price, tag/status caption, seeded second heart, and an Add to Cart button revealed over the photo. A public click changed the button to Added; later items include a Sold Out state.
- Corrections: created a distinct arrival carousel with image-hover cart controls, Added feedback, disabled sold-out action, arrival metadata, seeded-heart visibility and responsive scroll navigation. Removed always-visible cart buttons below the text.
- Remaining: native snapping replaces the reference carousel; bundled photos and some item prices/descriptions/arrival samples differ. No inventory or real cart service is connected.
- Verification: **visually reviewed — desktop default and public hover/cart state**. Local hover-add confirmation, next-page navigation and sold-out disablement passed; mobile 390/390.

### product-card-8 — Rated Product Grid

- Reference: https://reui.io/blocks/ecommerce/product-card/product-card-8
- Observed: Device Drops breadcrumb/header/live device count and filter/sort controls; four padded, outlined tech cards with inner 6:7 images, two category tags/status badge, clamped description, five-star/review row, current/compare-at price and black full-width cart action. The first heart starts liked. Public filters contain Category, Status and Sale Only.
- Corrections: replaced the mixed apparel/home catalog with a dedicated device-card composition, inner image padding, ratings/review counts, status/tag rows, first liked heart, category/status/sale filters, Highest Rated sorting and per-card cart feedback.
- Remaining: the existing headphone/lamp photographs are generic device proxies, not the reference earbuds/watch/camera/phone set; descriptions and badge palette are approximate. The mismatched demo-photo identities are explicitly not a claim of exact product reproduction.
- Verification: **visually reviewed — desktop default and public filter popover**. Local Audio filtering, reset, rating sort (Grain Camera first) and cart confirmation passed; mobile 390/390.

### product-card-9 — Four-Column Catalog

- Reference: https://reui.io/blocks/ecommerce/product-card/product-card-9
- Observed: left breadcrumb/title/lede and right Browse All; four open columns divided by vertical rules, square photos with a large **bottom-right** curve, tag/status caption, larger bold product title, star/review row, price and delivery note, full-width Add to Cart. **There are no wishlist controls.** The reference sample content is vape accessories.
- Corrections: rebuilt the divided layout, moved the rounded image corner to bottom right, restored full-width cart controls/delivery notes, removed hearts and added a usable Browse All dialog.
- Remaining: this independent demo intentionally uses the already bundled audio/carry accessory sample content and images rather than the reference's vape products. Names, headline and photography therefore differ; border/spacing and review-star fill are approximations. Browse All opens a local dialog instead of a placeholder collection link.
- Verification: **visually reviewed — desktop structure**, with the content substitution explicitly recorded. Public cart controls were inspected/exercised. Local cart confirmation, browsing and absence of wishlist controls passed; mobile 390/390.

### product-card-10 — Fashion Lookbook Grid

- Reference: https://reui.io/blocks/ecommerce/product-card/product-card-10
- Observed: Fashion Studio breadcrumb/header/lede and Browse All; eight full-bleed rounded photo tiles in four columns/two rows. A two-line title rests at lower left, New/Trending badges sit at upper right. Hover swaps the title for an inset blurred panel containing category text, description, circular size chips, divider and price row. No cart or wishlist controls. Reference images were allowed to finish loading before the hover screenshot was evaluated.
- Corrections: replaced the short generic fashion row with eight closely joined portrait tiles, two-line titles, amber/red status emphasis and an inset glass hover/focus panel with the observed size/divider/price anatomy. Added keyboard reveal and a local Browse All catalog dialog; removed cart/heart controls.
- Remaining: repeated bundled jacket/tee photos replace the fashion-model shoots, and sample descriptions/prices differ. Sizes are informative chips, not a connected purchase flow. The local browsing dialog and keyboard focus ring are deliberate demo/accessibility additions.
- Verification: **visually reviewed — desktop default and actual hover panel**. Local mouse hover and focus were checked after transition completion and screenshots compared; browsing showed eight items and no cart/wishlist actions. Mobile 390/390.

### Product Card batch verification and release files

All ten local previews rendered without a page exception. Ten focused interaction flows passed, and all ten examples measured **390px document width / 390px viewport width**. The product module passed scoped TypeScript diagnostics and lint checks during this batch. Later integration changes made by other coordinators still require the normal root build/release checks.

Files for this batch:

- `src/blocks/commerce/product-cards.tsx` — ten explicit entry compositions and shared controls.
- `src/blocks/commerce/product-data.ts` — bounded demo datasets using existing bundled photographs.
- `src/blocks/commerce/index.tsx` — Product Card now routes to the dedicated module; Product Grid retains its existing module.
- `docs/commerce-implementation.md` — this audit ledger and the remaining fidelity differences.
