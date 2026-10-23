# Product22 official free Carousel correction

## Scope and actual removed substitutes

This milestone changes only:

- `src/blocks/commerce/product-carousels.tsx` (new official-pattern compositions)
- `src/blocks/commerce/product-detail-grid-shared.tsx` (Gallery/ReviewCarousel/RelatedProducts integration)
- `src/blocks/commerce/product-cards.tsx` (card3 image carousel, card4/card7 product rails)
- `tests/product-carousel.spec.ts` and this ledger

`product-details.tsx` and `product-grids.tsx` retain their existing public component API, product data, assets, color/size/format/capacity states, stock controls and cart actions. The six ProductGrid layouts contain static grids rather than interactive gallery rails and need no carousel substitution. Shared `src/components/ui/carousel.tsx`, package.json and lockfile belong to root and were consumed read-only.

Removed parallel implementations: single-image index swapping, manual `setInterval` review advancement, scrollLeft/native scrollTo paging, viewport-column arithmetic, native snap rail, and manual two-image card toggling. The official Carousel/Embla engine now supplies drag gestures, pointer handling, scroll snap calculation, keyboard ArrowLeft/ArrowRight, reinitialization and original disabled previous/next controls.

## Official free sources actually read and composed

Official sources were read from root's CLI registry audit cache, not Pro blocks or their source. The imported shared Carousel source is the actual stock shadcn implementation installed by root; the composed logic below is taken from REUI's actual free patterns.

| Official source                                                  | Cached upstream source SHA-256                                                        | Actual reused behavior                                                                                                                                                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [c-carousel-9](https://reui.io/r/radix-nova/c-carousel-9.json)   | `e9c97d8298936bd4d45bafba66b6091e189fe89b7d825af5d4c7de9a1978fc5e`                    | Two actual `CarouselApi`s; `onThumbClick` calls mainApi.scrollTo; main select/reInit callback reads selectedScrollSnap and calls thumbApi.scrollTo; listeners removed on cleanup; draggable thumbnail carousel uses containScroll keepSnaps/dragFree. |
| [c-carousel-5](https://reui.io/r/radix-nova/c-carousel-5.json)   | `52b0f1a67eba2e8761dc10ed9c69fcbe2fef6b923917168cc358f1d1c7877ef8`                    | Actual `Autoplay` from embla-carousel-autoplay passed in Carousel.plugins; plugin owns timing, stopping and playing. No independent interval.                                                                                                         |
| [c-carousel-11](https://reui.io/r/radix-nova/c-carousel-11.json) | `8b6d12d7a6b52257395c0eb0d6658b483a96e09544ebbdd8a3cb77a60b29cbdc`                    | Dot count from scrollSnapList, selected state from selectedScrollSnap and select events, dot click uses actual API.scrollTo; select/reInit listeners cleaned up.                                                                                      |
| [c-carousel-8](https://reui.io/r/radix-nova/c-carousel-8.json)   | Previously inspected in prior free-carousel audit; no new upstream hash claimed here. | Inset original CarouselPrevious/CarouselNext placement for quick-buy card photos. Stock controls retain their own scrollPrev/Next and canScroll disabled logic.                                                                                       |

The MIT official code remains attributed; `src/components/reui/REUI-LICENSE.txt` is preserved and included by source ZIP exports. Existing actual free Badge, Frame, Rating and NumberField consumption is unchanged.

## Integration map and necessary adaptations

| Consumer                       | Migration / retained state                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Detail1–6 `ProductGallery`     | Re-export points to `FreeProductGallery`, built from c9. All existing image arrays/alt labels/crop treatments remain; vertical and horizontal thumbnail arrangements plus ebook captions/counters are retained. The active-image data attribute identifies only the selected slide. Main region can receive keyboard focus; thumbnails remain actual labelled buttons. |
| Detail2/4/5/6 featured reviews | Wrapper supplies existing local review data to c5+c11 composition. Actual Autoplay delay remains6500ms; loop enabled. Dot selection stops the actual plugin; Play/Pause controls call plugin.play/stop. Plugin focus/hover/drag interruption is reflected by actual autoplay events. Hidden slide semantics avoid reading inactive reviews.                            |
| Detail1 paged recommendations  | c11 snap state with original Carousel controls. Four product tiles remain grouped per slide, preserving2groups even at390px; local product wishlist/data remain unchanged. Static recommendation grids remain grids.                                                                                                                                                   |
| ProductCard3 quick-buy photos  | Real looping Carousel, original inset previous/next controls, c11 clickable dots. Existing photos, front/alternative alt labels, chosen size, wishlist, size guide and AddToBag behavior persist.                                                                                                                                                                      |
| ProductCard4 Similar Products  | Actual responsive Carousel slidesToScroll auto replaces custom column/page/scroll math. Current/count derive from actual scroll snaps after resize; original controls own boundaries.                                                                                                                                                                                  |
| ProductCard7 Latest Products   | Same engine and controls with arrival tiles; existing per-item cart/wishlist and sold-out states persist.                                                                                                                                                                                                                                                              |

Necessary custom code is limited to product data/rendering, existing geometry/captions, accessible labels and manual review playback policy. Free patterns are generic image demonstrations; they do not contain this catalog, review prose, stock rules or domain controls. Vertical thumbnails are an adaptation of c9 using the existing Carousel orientation API. No available carousel capability was hand-rebuilt.

Remaining fidelity differences: existing free replacement photographs and original local review prose continue to differ from REUI premium previews; actual Embla dragging/animation now replaces instantaneous image swapping; thumbnail opacity/border treatment follows the official c9 selection pattern. Product rails use the engine's responsive snap grouping and content-size measurements. No new premium images/source or dependency installs occurred.

## Verification

- Existing `tests/product-detail-grid.spec.ts`: **32/32 production tests passed** (25.5s), covering all22 ProductCard/Detail/Grid flows and390px layouts, stock/selection/cart behavior and real source ZIP asset inclusion.
- New `tests/product-carousel.spec.ts`: **11/11 production tests passed** (25.1s): main drag/keyboard/thumbnail synchronization; vertical/ebook captions; actual automatic advancement; dot stop with6800ms stable pause; requested playback resume; responsive snap count/boundaries; looping quick-buy controls without losing chosen size/cart; all6 detail gallery widths and unique active image at390px.
- Scoped strict TypeScript and isolated Vite production build pass.
- Actual downloaded ZIPs for ProductDetail2 and ProductCard3 were extracted into separate directories. Each includes product-carousels.tsx, actual Carousel source, Autoplay dependency and attribution; both `npm run build` commands passed independently (899ms/754ms Vite build portions).
- Inspected fresh rendered screenshots: Detail2 vertical gallery, Detail3 six horizontal thumbnails, Detail4 ebook captions, and ProductCard4 next-page rail. Existing public visual audit remains the reference for product-specific structure; this milestone does not claim a fresh visual comparison of all22 public pages.
- Isolated production snapshot path is stored in `/tmp/reui-product-carousel-snapshot.txt`, served on5298. This is verification evidence; root coordinates Git staging/commit/push and verifies Pages deployment. No published claim is made before root's release.
