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
