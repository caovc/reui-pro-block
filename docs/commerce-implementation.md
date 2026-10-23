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

## Product Detail and Product Grid: individual public-preview audit

This batch replaces the former shared `SingleProduct` / `ProductCatalog` routes with dedicated modules. Each of the 12 catalog URLs below was opened in a rendered Chromium browser; its actual public iframe URL was read from the catalog DOM. Default full-page screenshots were inspected and compared with local screenshots at **1280 × 1000**. Streaming catalog responses required navigation at the `commit` event; no paid source, registry payload or premium asset was accessed. Lazy images were allowed to load during a second scroll-through pass before evaluating photo regions. The optional public Markdown briefs were used only to cross-check the visible controls.

The local implementation uses shadcn primitives and original React composition. Grid 1 and 2 intentionally share card content and state because the public examples have the same data/anatomy; Grid 2 adds the distinct double-panel frame. Details 2 and 4 share chapter typography, but have different gallery, purchase, reading, contents and package sections. Remaining detail/grid entries each have their own composition. Shared helpers cover gallery controls, color buttons, quantity, bag confirmation, spec rows, stars, local reviews and related items.

New photographs are independently selected free Unsplash files, bundled under `src/blocks/commerce/assets/detail-grid/`; its `ATTRIBUTION.md` records original image URLs and license. Existing free commerce photos are reused. **These photographs do not depict the exact named demo products or exact colorways.** Some gallery views deliberately reuse a photograph with a different crop; hue changes are demo treatments. Product facts, names and short labels follow the visible sample where useful, while body prose, excerpts and review text are independently written. Star fills and distribution numbers are illustrative rather than pixel-exact aggregates.

### product-detail-1 — Size Picker Detail

- Reference: https://reui.io/blocks/ecommerce/product-detail/product-detail-1
- Observed: breadcrumb; left five-image vertical filmstrip beside a large square sneaker photo; right category, title, rating, description, sale price, five colors, EU 39–45 with 44 struck/disabled, size-guide link, full-width bag/wishlist and three dashed service tiles. Four line tabs switch Description, grouped Specs, Shipping & Returns and Reviews. Related products have eight items with a 1/2 page count and arrows.
- Corrections: dedicated sneaker layout restores this anatomy, sold-out size, selected-size tick, size-guide dialog, tab-specific content, related paging and wishlist states. Bag confirmation contains the chosen color and size; review submission validates and appends a local review.
- Verification: **visually reviewed — desktop default and public Specs tab**. Local selected Midnight/EU 42 bag state, disabled 44, grouped specs, size guide and next related page are covered by the persistent test.
- Remaining: the reference gallery contains different shoes/angles; local gallery uses the bundled red sneaker with crop/tint treatments. Related photos repeat and shorter independent descriptions change page height. Local cart/review dialogs add useful demo behavior where public controls were placeholders.

### product-detail-2 — Story Product Page

- Reference: https://reui.io/blocks/ecommerce/product-detail/product-detail-2
- Observed: five-image audio filmstrip, color-only buy area, bullet features, compact bag and heart row, small service line; three alternating photo/copy chapters with numbered rules, hover captions and three specs each. Four compact specification cards follow, then rating distribution beside an autoplay review carousel and review-count link.
- Corrections: separate audio editorial composition, matching chapter sequence and spec-card groups (Audio, Power, Connectivity, Build), Onyx/Sand/Sage states, active gallery, bag confirmation and independently paced review dots. Pause/play controls and an all-reviews dialog make the carousel usable locally.
- Verification: **visually reviewed — desktop default after images loaded**. A public gallery change was exercised. Local gallery selection, Sand in the bag, manual second review and paused state are in the persistent test.
- Remaining: alternate headphone angles and travel photography are substituted/repeated; color changes tint the photo. Original shorter prose reduces vertical rhythm. Native state/timer logic replaces the reference Embla carousel, and avatar portraits are simplified.

### product-detail-3 — Spec Table Detail

- Reference: https://reui.io/blocks/ecommerce/product-detail/product-detail-3
- Observed: large audio image over six thumbnails; sticky buy column with SKU, maker/rating, colors, checked USB-C/Lightning/3.5 mm tiles, quantity, bag, wishlist and service cards. Below are a two-column overview, a single grouped specification table (In the Box, Audio, Build & Fit, Connectivity), review distribution/list and related items.
- Corrections: explicit six-thumbnail/sticky-buy composition, connector and quantity state carried to the bag subtotal, grouped specification rows, independent overview and local review submission with submitted text visible in the review list.
- Verification: **visually reviewed — desktop default and actual public Lightning selection**. Local three-unit Lightning order totals $1,047; review validation/submission is covered by the persistent test.
- Remaining: headphone photos reuse one free shot with crop/finish treatments. Service-card secondary copy and related-product imagery are simplified; native table borders and star fills differ slightly. Local bag/review dialogs replace placeholder public actions.

### product-detail-4 — Ebook Detail Page

- Reference: https://reui.io/blocks/ecommerce/product-detail/product-detail-4
- Observed: wide book photo, Look Inside counter and five captioned thumbnails; edition tiles, price following the selected edition, delivery/license chips and purchase row. A grey drop-cap opening excerpt precedes three alternating chapters, a 17-chapter/three-part contents grid with reading times, four detail cards and reader reviews. Complete Bundle visibly changes to **$49 / $78 / 37% Off**.
- Corrections: dedicated book composition includes gallery/counter, edition-dependent $19/$29/$49 bag totals, selected package features, independently written readable sample dialog, drop cap, 17 contents entries, detail cards and reader carousel.
- Verification: **visually reviewed — desktop default and actual public Complete Bundle state**. Local Ebook/Bundle totals, Workbook preview selection and sample readability are covered by the persistent test. A real downloaded ZIP was independently built.
- Remaining: book photos are independently selected stacks/library images, not the reference cover/edition artwork. Body/sample prose and reviews are original; exact ebook text is not reproduced. No digital files, real purchase or license delivery is connected.

### product-detail-5 — Compact Buy Box

- Reference: https://reui.io/blocks/ecommerce/product-detail/product-detail-5
- Observed: sticky square coffee gallery and five thumbnails; dense buy area with checkmark features, four colors, three capacity tiles, low-stock/shipping line, capped quantity, Add To Cart and a separate Buy Now/heart row. About and specs sit side-by-side, then rating/featured reviews and an open related row.
- Corrections: dedicated coffee layout, Cream/Charcoal/Sage/Cobalt states, capacity guide and selection, stock-capped quantity with clamping on lower-stock color changes, subtotal-aware bag and demo checkout, matching two-column information and manual/autoplay featured reviews.
- Verification: **visually reviewed — desktop default**; public gallery selection exercised. Persistent local test reaches stock 4, changes to Cobalt stock 2, selects 500 ml and confirms the $178 demo order.
- Remaining: free coffee photographs show cafe drinks rather than the exact pour-over kit; secondary photos and related accessories are proxies. Capacity changes label/package state while the demo unit price stays $89. The explicit Cobalt stock reduction and confirmation dialog are useful local demo additions, not a claim about the public product’s inventory.

### product-detail-6 — Single-Column Detail

- Reference: https://reui.io/blocks/ecommerce/product-detail/product-detail-6
- Observed: narrow centered title/rating, 4:3 backpack gallery and thumbnails, centered price/features/variants/quantity buy area, introductory paragraph and three numbered story chapters. Grouped specs and a rating/recommendation (92%) review area with long quote/progress segments precede a full-width related-products footer.
- Corrections: independent single-column composition restores the centered buy box, three numbered story blocks, capacity guide, color/photo selection, stock cap, grouped specs, 92% recommendation, review segments and related footer. Bag confirmation carries capacity/color/quantity.
- Verification: **visually reviewed — desktop default**; public gallery selection exercised. Persistent test changes to Charcoal/24 L, reaches stock 3, verifies $1,035 total and selects the second review segment.
- Remaining: free fabric/travel backpacks replace the exact leather bags and do not match the named finishes. Story copy and review samples are original. Exact avatar stack is omitted; native review segments/timer replace Embla. Charcoal’s demo stock limit is illustrative.

### product-grid-1 — Swatch Swap Grid

- Reference: https://reui.io/blocks/ecommerce/product-grid/product-grid-1
- Observed: four outlined shadcn cards in two columns, full-bleed square photo, sale/new pill, hover heart with the third seeded liked. Below: uppercase category, swatches with selected color aligned right, title, two-line description and current/compare price. No heading or cart footer.
- Corrections: dedicated four-card collection; selecting a swatch changes the actual bundled image source and selected name, wishlist states remain independent and the third starts liked. Restored square ratio, card border, category and sale pricing hierarchy.
- Verification: **visually reviewed — desktop default and public Sand swatch change**. Persistent local test asserts the image source changes, selected output reads Sand and hearts remain independent.
- Remaining: free bag photographs are proxies and do not match exact finishes; reference sample imagery itself includes unrelated placeholders. Short independent descriptions and two-decimal currency formatting alter small details. No product-navigation backend is provided.

### product-grid-2 — Stacked Panel Grid

- Reference: https://reui.io/blocks/ecommerce/product-grid/product-grid-2
- Observed: same four-product structure and swatch interaction as Grid 1, enclosed in a subtle grey frame; photo and details occupy separately rounded bordered panels with a visible inset gap.
- Corrections: distinct stacked-panel shell around the shared card content, separate photo/details borders, inset padding/gap, live image swap and seeded wishlist. This intentionally shares only the inner product data/control anatomy with Grid 1.
- Verification: **visually reviewed — desktop default after lazy images loaded and public Sand selection**. Persistent local image-source/name/wishlist checks pass independently for this entry.
- Remaining: photo/finish substitutions, text length, currency decimals and subtle frame shades differ. The free implementation composes shadcn-compatible surfaces instead of retrieving the paid block’s Frame source.

### product-grid-3 — Add-to-Cart Grid

- Reference: https://reui.io/blocks/ecommerce/product-grid/product-grid-3
- Observed: six open, borderless tiles in three columns; square images, upper-left badge, hover/seeded hearts, uppercase category tags, title, five-star rating with review-count link, price and full-width Add to Cart.
- Corrections: separate six-item frameless layout, ratings/review counts, seeded third heart and per-product cart confirmation. Review count opens a local product-specific review panel.
- Verification: **visually reviewed — desktop default after lazy images loaded**. Public cart action was clicked; persistent local test verifies the selected item in the bag and its linked review panel.
- Remaining: bag photo set differs and repeats; rating fill/decimals and review prose are illustrative. The public cart is a placeholder; this demo provides local feedback without a shared server cart.

### product-grid-4 — Numbered Story Grid

- Reference: https://reui.io/blocks/ecommerce/product-grid/product-grid-4
- Observed: six horizontal editorial chapters in two columns. Each has a 01–06/category rule, small square photo with badge/hover heart, title/price row, story sentence and three labeled specifications. No cart or rating row. First wishlist starts liked.
- Corrections: independent six-story layout restores rules, horizontal photo/copy anatomy, three-column spec rows, badge differences and first seeded heart. Mobile retains readable columns without overflow.
- Verification: **visually reviewed — desktop default after lazy images loaded**. Public first wishlist was toggled; persistent local test checks the seeded toggle and all six stories/specs.
- Remaining: existing free home/ceramic/room photos replace the reference’s varied sample placeholders; some are category proxies rather than exact objects. Original shorter story prose and mobile wrapping vary the row height.

### product-grid-5 — Quick Size Grid

- Reference: https://reui.io/blocks/ecommerce/product-grid/product-grid-5
- Observed: six 4:5 apparel photos in three columns, always-visible corner hearts/badges, hidden inset translucent quick-buy panel with XS–XL; unavailable sizes struck/disabled. First card begins with M selected; other cards prompt Select Size. Brand/title/price and shipping line sit beneath each photo.
- Corrections: dedicated portrait grid, hover/focus buy panel, first selected M, product-specific sold-out sizes, selection-gated bag action and size in confirmation. Quick-buy panels are also visible on narrow screens for touch usability.
- Verification: **visually reviewed — desktop default and public hover panel**. Persistent local test checks the second card’s unavailable M, disabled action before selection and successful S purchase. Settled local focus-panel and 390px top-of-page screenshots were also visually inspected.
- Remaining: repeated bundled jacket/tee photos replace distinct outfits. Public quick-buy uses radio tiles while this implementation uses accessible pressed buttons. Narrow-screen always-visible controls are a deliberate usability addition.

### product-grid-6 — Shop-the-Look Grid

- Reference: https://reui.io/blocks/ecommerce/product-grid/product-grid-6
- Observed: 2×2 square apparel tiles with cross-fade to a second lifestyle photo; badge upper left, hover Add to List/Cart actions, stacked swatch pill lower right expanding to color dots. Caption contains brand, title, price and Shop The Look/item count; first list item starts Saved.
- Corrections: independent four-look composition with true two-image cross-fade on hover/focus, expanding selected-color pill, seeded list state, cart finish details and a local outfit dialog containing the indicated 3/4/5 items. Narrow-screen actions stay reachable without hover.
- Verification: **visually reviewed — desktop default and actual public cross-fade/expanded pill**. Persistent local test checks settled opacity, keyboard swatch expansion/Olive selection, independent Saved toggle and four-item first-look dialog. Settled local focus-panel and 390px top-of-page screenshots were also visually inspected.
- Remaining: free tee/jacket photos replace the reference’s clothing/lifestyle set and repeat across looks. The expanded color selection applies an illustrative finish treatment rather than exact product/color photography. Local outfit browsing replaces hash links; no backend styling service exists.

### Detail/Grid batch verification and release files

The persistent `tests/product-detail-grid.spec.ts` suite finished **25/25 passed** using a unique output directory (`--output=/tmp/reui-detail-grid-test-final`) to avoid trace-file collisions with other parallel jobs. It covers a meaningful interaction for every entry plus all 12 previews at **390px** with decoded local images, no page exceptions and no horizontal overflow. A separate real-download regression asserts nested images, attribution and new source modules are present in the ZIP. Standalone exports for **Product Detail 4** and **Product Grid 6** were downloaded through the actual website button, extracted and built with strict TypeScript plus Vite. Both include all eight new images and the nested attribution file. Both exported production previews were also opened in Chromium: the ebook Bundle/$49 bag flow and the grid cross-fade/four-item outfit dialog passed with no page exceptions. Commerce-only TypeScript checks passed. Source lint has only the existing-style Fast Refresh advisories for constants exported alongside components.

Files in this batch (no staging/commit performed):

- `src/blocks/commerce/product-details.tsx` — six dedicated detail compositions.
- `src/blocks/commerce/product-grids.tsx` — six grid compositions, with shared inner content only for the two bag-card grids.
- `src/blocks/commerce/product-detail-grid-shared.tsx` — gallery/variant/purchase/review/table helpers.
- `src/blocks/commerce/assets/detail-grid/` — eight independently selected free photos plus attribution.
- `src/blocks/commerce/index.tsx` — only Product Detail/Grid imports and dispatch changed.
- `src/lib/bundle.ts` — parent-requested recursive image/font/notice asset globs; other export/font edits preserved.
- `tests/product-detail-grid.spec.ts` — persistent per-entry interaction/mobile/image and nested ZIP regression coverage.
- `docs/commerce-implementation.md` — this per-entry ledger.

Previous Product Card files and other coordinators’ pricing/marketing/promotion/hero modules were preserved. All purchases, reviews, inventory, browsing and checkout remain local demo states; exact premium photographs, original prose, exact carousel physics and backend services are not reproduced.

## Official free REUI reuse correction — milestone 1

The user subsequently made **official free REUI implementation reuse first** explicit. The earlier independent compositions above did not satisfy that preference wherever they recreated available primitive behavior. This correction uses actual registry source, not similarly named wrappers. Shared vendor/dependency Git operations belong to the root/coordinator; this agent changed only its Rating integration source and commerce consumers/tests, and did not stage or commit.

### Actual sources and migrations

- **Rating** — official free Radix Nova registry, retrieved with `npx shadcn@latest view @reui/rating`; source `https://reui.io/r/radix-nova/rating.json`. Original content SHA-256 is recorded in `src/components/reui/rating.tsx`. The original small/normal/large variants, fractional fill percentage, hover preview, mouse-leave reset and controlled click callback are preserved. The generated registry `IconPlaceholder` is mechanically resolved to Lucide `Star`; editable star wrappers gain keyboard/ARIA attributes. These are explicitly local accessibility extensions. The former hand-looped fully filled stars in Product Card and Detail/Grid now render through this implementation. The review form's native rating dropdown is replaced by its actual editable Rating, and submitted rating is retained with local review data.
- **Frame / FramePanel** — actual official free implementations installed by the application coordinator at `@/components/reui/frame`; `Frame dense` + direct `FramePanel` now provide Product Card 3/5 containers. Product Grid 2 now uses a real `Frame spacing="default"` containing two direct `FramePanel fit` children instead of custom bordered wrapper divs. Official inherited panel background/border/radius/spacing and dense/adjacency rules now drive the surfaces.
- **NumberField** — official free registry source at `@/components/reui/number-field`, using its original `@base-ui/react/number-field` integration. Detail 3/5/6 quantity controls now compose `NumberField`, `NumberFieldGroup`, `NumberFieldDecrement`, `NumberFieldInput` and `NumberFieldIncrement`. They inherit original keyboard entry/arrow stepping, focus styling, disabled-at-boundary behavior and min/max parsing/clamping. The former bespoke minus/output/plus state renderer is removed. Parent-level inventory state still determines the allowed maximum.
- **Badge** — actual official free implementation at `@/components/reui/badge` replaces the Nova shadcn Badge in the 22 audited entry compositions. Real `radius`, `size`, `success`, `warning`, `destructive` and `success-light` variants are used for sale/status/verified badges; manual badge colors were removed where official variants exist. Semantic token installation is owned by the shared foundation coordinator.

Official vendor code is MIT, Copyright (c) 2025 Keenthemes Inc. Preserve `src/components/reui/REUI-LICENSE.txt` in distribution. Root owns the shared source-export/notice wiring. Frame/IconTile and NumberField/Badge vendor files belong to their coordinators and were consumed without overwriting their implementations.

### Per-entry reuse map

| Audited entry | Actual official free implementation used in this correction | Product-specific composition retained |
| --- | --- | --- |
| Product Card 1 | Badge | Apparel-only photo grid and wishlist data |
| Product Card 2 | Badge | Catalog filters, swatch finish mapping and sort |
| Product Card 3 | Frame + FramePanel, Badge | Selected size, stock tooltip and local bag state |
| Product Card 4 | Badge | Related-item data and paging state; carousel migration still outstanding below |
| Product Card 5 | Frame + FramePanel, Badge, Rating | Cut-corner media layout, finish data and local specs/bag state |
| Product Card 6 | Badge | Masonry placement and product hover information |
| Product Card 7 | Badge | Arrival/inventory metadata; carousel migration still outstanding |
| Product Card 8 | Badge, Rating | Category/status filters, sort and cart data |
| Product Card 9 | Badge, Rating | Divided accessory collection and delivery metadata |
| Product Card 10 | Badge | Lookbook tile content and informative size chips |
| Product Detail 1 | Badge, Rating (including editable review form) | Shoe variant data, sold-out size and purchase state |
| Product Detail 2 | Badge, Rating | Audio chapters/spec data and finish state |
| Product Detail 3 | Badge, Rating, NumberField | Connector options, grouped specs and inventory |
| Product Detail 4 | Badge, Rating | Ebook edition pricing, original sample and chapter contents |
| Product Detail 5 | Badge, Rating, NumberField | Capacity/color/stock and local checkout state |
| Product Detail 6 | Badge, Rating, NumberField | Bag capacity/stock and single-column chapter data |
| Product Grid 1 | Badge | Named color/photo mapping; its public example specifically uses shadcn Card |
| Product Grid 2 | Frame + FramePanel, Badge | Named color/photo and wishlist state |
| Product Grid 3 | Badge, Rating | Per-product bag data and local review panel |
| Product Grid 4 | Badge | Six numbered product stories/spec data |
| Product Grid 5 | Badge | Per-product available sizes and local quick-buy state |
| Product Grid 6 | Badge | Two-photo cross-fade, palette mapping and outfit data |

This table describes concrete current reuse, not completion of every reusable pattern in the scope. Product-specific data, edition/size compatibility, stock limits, local cart totals and the original catalog page compositions have no equivalent turnkey free eCommerce block in the public free UI registry; they remain application composition over the reused primitives. Ordinary shadcn Card/Tabs/Dialog/Button controls remain where the corresponding official free REUI examples themselves compose those primitives.

### Remaining reuse work, explicitly not a claimed missing capability

The free registry search found **`@reui/c-carousel-8`**, a real free pattern depending on shadcn Card/Carousel. Its source composes `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselNext` and `CarouselPrevious`, with the image overlay/zoom treatment. Therefore the existing native Product Card 4/7 rails and local gallery/review carousel logic are **not** classified as a confirmed library gap. Their migration to the official free carousel pattern is the next correction, pending shared Carousel/Embla dependency coordination. The free `c-breadcrumb-*` examples were also located; the remaining custom breadcrumb composition is being audited rather than called unavailable. Checkout/Cart implementation is held until this reuse correction is concrete, and their next batch must begin with the actual free Stepper/Frame/NumberField/Alert and relevant official patterns.

Photo substitutions and independent prose remain the fidelity differences documented per entry. No premium source/assets or backend integration were introduced.

### Verification of this milestone

A stable temporary production snapshot was built from committed repository state plus the current commerce consumers and coordinated official vendor/UI/CSS/export files; **strict TypeScript + Vite passed**. The complete Detail/Grid suite passed **28/28**, including the prior 25 regressions plus tests of original Rating fractional/hover/click behavior, Frame inherited panel styling and NumberField keyboard/max behavior. An additional **4/4** checks passed for Product Card 3/5/8 flows and all ten Product Card compositions at 390px. Product Card 3/5/8 production screenshots were visually inspected after migration. The live development server had unrelated concurrent HMR/optimized-dependency reload errors, so these results use the stable production preview on port 5295 with unique Playwright output directories.

Ready source scope for root milestone publication: `src/blocks/commerce/product-cards.tsx`, `product-details.tsx`, `product-grids.tsx`, `product-detail-grid-shared.tsx`, coordinated `src/components/reui/rating.tsx`, `tests/product-detail-grid.spec.ts`, and this ledger. No commerce dispatcher edit was made during this correction. Root should include the coordinated free vendor/license/dependency/CSS/source-export foundation, run integration checks, then promptly commit/push and verify Pages as required by AGENTS.md; this agent makes no publication-success claim.
