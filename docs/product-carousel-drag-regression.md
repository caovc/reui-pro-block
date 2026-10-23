# Product gallery drag regression investigation

## Actual free implementation preserved

The product gallery still composes the official free [REUI c-carousel-9](https://reui.io/r/radix-nova/c-carousel-9.json) main/thumbnail API synchronization with the existing stock Carousel and Embla 8.6 engine. No product runtime, shared UI source, dependencies, image assets or playback behavior changed for this fix. The source/pattern provenance remains in `docs/product-carousel-free-reuse.md`.

## Reproduced race and correction

CI observed the thumbnail and keyboard assertions passing, followed by a real pointer drag expecting image 5 but remaining on image 4. Embla changes its selected snap when navigation begins; the previous test treated that metadata update as proof the animation had physically reached the fourth slide. Starting a drag at that moment interrupts the in-flight animation at its current physical position.

A clean HEAD production build on port 5392 reproduced the failure with three workers. Diagnostic-only instrumentation recorded one failing iteration beginning with the selected image at x=952.37 while the gallery began at x=176 and was only 436px wide. Other iterations also began at different intermediate positions. Product images use a decorative scale transform, so the durable precondition measures the actual selected CarouselItem against the carousel viewport rather than the transformed image.

The test now polls for that physical slide alignment within 1px before beginning the same 80%-to-20% pointer gesture with its original 15 movement steps. It still requires the rendered image to become view 5, and additionally checks that thumbnail 5 is selected. There is no fixed sleep, timeout increase, retry, skipped test, synthetic scroll/API invocation or removed drag assertion.

## Production verification

- Clean HEAD isolated Vite production build passed. Verification server: `http://127.0.0.1:5392`.
- Original test, 30 repeats with 3 workers: **28 passed / 2 failed** (2.2m); the two failures retained selected images 3 and 4 after the gesture.
- First corrected run, same limits and concurrency: **27 passed / 3 timed out** (5.5m). All three traces end before the alignment poll/pointer gesture, at focus/keyboard/thumbnail assertions; they hit the unchanged overall 30s test limit during severe browser scheduling slowdown. These are retained failures, not omitted results.
- Confirmation using the exact same corrected bytes and unchanged limits, 30 repeats with 3 workers: **30/30 passed** (2.4m), including the real pointer drag and image/thumbnail5 assertions.
- Scoped oxfmt check and oxlint passed. Full `tests/product-carousel.spec.ts` production suite: **11/11 passed** (27.6s), covering autoplay, real rails, retained cart/size state and all six detail layouts at390px.

Browser plugin is not available in this session; the existing project Playwright Chromium runner performs the rendered checks. Output directories are unique to this investigation and do not share the main CI output folder. Baseline, first corrected and confirmation logs remain at `/tmp/reui-product-drag-{baseline,fixed,confirm}.log`; each corresponding output directory retains failure traces. The production snapshot path is recorded in `/tmp/reui-product-drag-snapshot.txt`.
