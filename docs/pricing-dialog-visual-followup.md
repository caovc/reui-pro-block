# Pricing dialog visual follow-up

This is a separate consumer visual batch after the immutable Pricing4/7/8 implementation payload. The earlier functional and major-rectangle checks did not prove complete visual fidelity. A fresh public/local comparison used the same Team/Yearly entry, light theme, DPR1, 1440×1100 and390×844, with fonts loaded and native finite animations complete.

## Confirmed differences and corrections

| Entry                        | Before                                                                                      | Corrected behavior                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Pricing7 closed EmptyTitle   | Local normal tracking made the title125.03125px wide; reference tracking-.35px/119.078125px | Remove the consumer override and retain the actual free EmptyTitle tracking-tight behavior                                             |
| Pricing7 plan IconTile       | The independent CSS translate property still moved media2px after transform:none            | Use translate:0 on the existing ItemMedia composition; all three centers match the reference                                           |
| Pricing7 active/focused Tabs | Consumer shadow replaced the real component ring and changed the elevation spread           | Remove the redundant active override; retain the free Tabs state bridge, native3px ring and -1px spread                                |
| Pricing8 popular Badge       | 100deg sRGB gradient and black shadow differed from the reference                           | Extend the actual free success Badge with semantic green500→emerald700 oklch gradient, border-box origin and emerald900/25 dual shadow |
| Pricing8 mobile plan rail    | Description line-height16px differed from18px and media retained a2px translation           | Remove the density override and use the real ItemMedia translate:0 alignment; native description typography remains                    |
| Pricing8 ScrollArea          | Local track8px/thumb5px and custom muted thumb differed from10px/7px and the native color   | Remove redundant width/color overrides; actual free ScrollArea still owns real scrolling                                               |

The actual ReUI Badge, IconTile and Frame remain in use; the complete free Dialog, RadioGroup, Item, Empty, Tabs, Table and ScrollArea compositions retain their real dependencies. No component mechanism was replaced. The popular Badge skin is an explicit Pro presentation extension, rather than a claim that the free default already matches it. No media, upstream SVG, font or license files change.

## Evidence and validation

Pricing7 has one new regression covering both widths. Exactly the same test failed against the original5391 candidate, with14 soft assertions exposing the three differences, and passed against5397. It measures title tracking/width, media centers and real selected/focused native ring/elevation. Opened/closed, hover, keyboard plan/billing, CTA route retention, Close focus return and reopening were also checked.

Pricing8 has one new regression covering both widths. Exactly the same test failed against5528 on the old gradient and passed against5538. It measures the semantic Badge skin,18px description and media centers, native scrollbar geometry/color, actual scrolling to the support row and fixed header/footer. Two existing targeted interaction checks also passed, including all six mobile plan/billing states. All16 feature-row rectangles remain unchanged. The standard30s timeouts were retained.

Only scoped format/lint and browser checks ran for this batch. No production build, new ZIP strict build, Git commit, push or deployment success is claimed here. Final integrated source/copy/file/actual ZIP validation and publication remain assigned to the single Root release window. Existing implementation freezes and their original candidates/manifests remain unchanged.

## Shared and remaining differences

The unlayered global focus fallback in src/index.css overrode the official Tabs outline. A layer-only probe restores width1px but leaves offset3px. The separately authorised Source/Tabs owner handles the shared rule layer and explicit native Tabs offset; this consumer batch does not change any global rule or add local outline workarounds. Native pointer focus-visible matching also differed in fresh contexts and has not been attributed to CSS layer order. The visual tests deliberately do not claim that this consumer patch repairs it.

Pricing4 main geometry and typography matched38 measured rectangles at both widths. Its original illustrative marks/caption and independently drawn grain are intentional permitted-material differences. No third independent bug was invented. Safari, unmeasured intermediate widths, dark-theme parity and every possible hover/focus timing are not certified. Do not mark the full Pricing category visually complete.

## Later cumulative integration validation

The initial owner validation above was subsequently extended without changing its frozen payload. On Root commit `02cd8e8`, a Vite-only production build and 11 focused checks passed in 21.3 seconds with one worker. These included Root’s native readiness v2 test, both new visual regressions and two corrected CSS source, clipboard, file and actual ZIP checks. Both actual 220-file starters were bundled with Vite and passed their 1440/390 visual tests, matching full-site geometry and critical billing, selection and dialog flows.

On the newer committed `b131706` baseline, the exact five frozen paths were rebased into a clean archive. The Vite-only build and four narrow visual/source checks passed in 7.1 seconds. Both newly downloaded ZIPs have all 220 entry bytes identical to the independently verified `02cd8e8` packages, so their existing bundle and render evidence was reused. No main TypeScript build or ZIP strict check was repeated for these CSS changes. Shared Tabs and focus fixes are already present in these baselines; this consumer patch does not rewrite those primitives or claim that the previously observed pointer modality discrepancy is resolved.

These are local verification results. Root alone handles commit, push and new CI/Pages confirmation; successful deployment is not implied.
