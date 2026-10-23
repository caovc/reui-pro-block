# Auth2/3 official free reuse correction

The previous Auth2 composed three handwritten cards around a custom `setInterval` and index arithmetic. The free library already supplies the corresponding carousel behavior, so this was a migration gap, not a missing feature. Auth3 similarly drew five stars despite the available official Rating implementation.

Before changing either consumer, the official free registry source was fetched and read:

| Free source | Registry JSON SHA256 | Actual use |
| --- | --- | --- |
| [c-carousel-5](https://reui.io/r/radix-nova/c-carousel-5.json) | `7b4c8917f0e36e186554ae5722167f2ba9c3f494c40b7a5f1ac8d756c457207d` | Actual `Autoplay` plugin on upstream `Carousel`/`CarouselContent`/`CarouselItem` |
| [c-carousel-11](https://reui.io/r/radix-nova/c-carousel-11.json) | `83814bfc3f06cc7fd57417a0fc5c6ab57ea3b55171ca9f281dfd4562cf75f65a` | Actual API `selectedScrollSnap`, `select` event and `scrollTo` dots; reInit subscription/cleanup follows free c-carousel-9 |
| [c-carousel-9](https://reui.io/r/radix-nova/c-carousel-9.json) | `59c99e23ad9899d51d4dfaccb5cfff9dcf136b25808573e89cd91bf5b4703ce4` | Read for API lifecycle, with cleanup on reInit/select; paired thumbnail behavior is owned by the separate commerce migration |
| [Rating](https://reui.io/r/radix-nova/rating.json) | Existing attributed official source | Actual read-only five-star fill implementation in Auth3; scoped CSS inherits the reference review panel color |

REUI's free Carousel examples themselves import the stock shadcn Carousel; there is no separate enhanced REUI Carousel primitive to bypass. The source was installed with `npx shadcn@latest add carousel drawer --yes`; existing Button/Drawer were preserved when prompted. The actual Embla implementation now owns drag physics, loop geometry, centered snapping, keyboard arrows, selection and autoplay timing. No renamed wrapper or manually simulated carousel is claimed as reuse.

Consumer extensions are limited to 270px/240px card layouts, existing independent review fixtures, active-neighbor styling, mouse/focus pause and reduced-motion/mobile playback preferences. Actual upstream Avatar replaces the handwritten initials surface and uses existing attributed free demo portraits. Original testimonial text/photos/wordmarks and decorative waves still differ; see the split auth audit. Read-only Rating is actual free source, with no local rewrite.

The dependency batch also includes the stock Radix Nova Drawer required by the parallel AppShell35/36 work. REUI's Drawer examples use this upstream component; the separate enhanced registry endpoint is absent. Its source and `vaul` dependency are prerequisites, not a claim that the AppShell consumer has already completed its own review.

Verification covers real pointer dragging, arrow keys, dot selection, autoplay/reduced-motion/manual pause, original login/reset regressions, five actual Rating filled/empty slots, and the real exported Auth2 starter. Final production results are recorded after the isolated candidate run.

Final isolated production TypeScript/Vite build passed, followed by **85/85 browser tests** (1.2 minutes). The actual UI-downloaded Auth2 starter contains 182 files including Carousel/Autoplay dependencies and notices, builds independently, and renders at1440/390 without errors, broken images or overflow. Card43 also passed its agent-owned actual ZIP build and root-integrated source payload test.
