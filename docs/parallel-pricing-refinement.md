# Pricing 5/6 fidelity recheck — 2026-10-22

This supersedes the first pass. Actual clicks revealed that its plan-selection, FAQ and comparison dialogs were invented. The public reference uses placeholder anchors, so those dialogs and their state have been removed. Local anchors preserve the preview route and reproduce the visible scroll-to-top behavior.

## Corrections verified against the public previews

- Bundled the same Inter Latin variable font, including its license; corrected type sizes, line heights and tracking instead of accepting Geist as a default difference.
- Corrected container thresholds (672/896/1152px), four/two/one analytics columns, three/one studio columns, 14px card radii, inset outlines, mobile 24px gaps, semantic green, badges and help-row geometry.
- Studio now uses min-height:100svh and vertical centering. Corrected neutral/teal/violet washes, measured dot texture and its fading treatment.
- Replaced plain customer labels with official public brand marks, retaining original source URLs and ownership notices in pricing-brandmarks.tsx.
- Preserved the observed monthly/yearly prices and annual totals. Actual reference and local links were clicked; no new dialogs, toasts or purchase flows are added.

## Measured evidence

Desktop viewport: 1280×1100. Mobile: 390×844. Reference and final screenshot pairs were inspected with view_image. Copy, hierarchy, typography, palette, spacing, borders, icons, texture, brand artwork, responsive continuation and changed billing states were compared.

| Element              | Reference and implementation   |
| -------------------- | ------------------------------ |
| Pricing 5 heading    | x458.078125 y48, 363.8125×40   |
| Pricing 5 first card | x96 y264, 260×472.75           |
| Pricing 5 help card  | x96 y752.75, 1088×88.25        |
| Pricing 6 heading    | x459.5 y102.625, 360.984375×40 |
| Pricing 6 first card | x96 y322.625, 346.65625×569.75 |

Mobile full-page dimensions also match the captured references: Pricing 5 is 390×2476; Pricing 6 is 390×2103. This is evidence about the measured elements, not a claim of pixel identity.

Evidence, actual-click logs, raw computed measurements, before/reference/after screenshots and remaining pixel differences are retained in `/tmp/reui-fidelity-review/pricing/REPORT.md` and `final-verification.json`. Raw pixel differences are concentrated in independent icons, brand artwork versions/antialiasing and generated grain; no synthetic fidelity score is used.

## Validation and limits

The dedicated tests were rewritten to assert actual rates, placeholder behavior, route retention, no dialogs/toasts, scroll-to-top and no mobile overflow. Both passed, as did scoped oxlint and the parent's frozen production run.

Reference interactions were checked on desktop for both pages and mobile for Pricing 5. Pricing 6 mobile monthly/yearly images and metrics were successfully captured at the start of this recheck; later remote navigations failed. Its three links were actually clicked on desktop. A fresh reference-mobile click pass is not claimed. The local mobile matrix passed.

This recheck covers Pricing 5/6 only. It does not certify the other six pricing entries, dark-mode parity or the full catalog. These changes remain local until a release explicitly includes them.

## Official free ReUI reuse audit and migration

The prior refinement used stock Badge plus manually rebuilt icon/list-row styles. Those duplicate basics have now been replaced with actual official implementations and composition. Official registry documentation distinguishes `@reui/*` components from their bare stock dependencies; the following table preserves that distinction.

| Official source                                                                                            | Local implementation                                                                             | Actual call site                                                                         |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| [ReUI Badge registry](https://reui.io/r/radix-nova/badge.json)                                             | `src/components/reui/badge.tsx`, byte-identical official source                                  | `pricing-refined.tsx:3`; BillingTabs `success-light`, Growth `success`, studio `outline` |
| [ReUI IconTile registry](https://reui.io/r/radix-nova/icon-tile.json)                                      | `src/components/reui/icon-tile.tsx`, existing shared source, unchanged except provenance comment | `pricing-refined.tsx:4`; help-row elevated/default IconTile at line95                    |
| [Official IconTile List Row example](https://reui.io/r/radix-nova/c-icon-tile-10.json)                     | Actual composition of IconTile with Item/Media/Content/Title/Description/Actions                 | `pricing-refined.tsx:91–95`                                                              |
| [Stock Item dependency required by that ReUI example](https://ui.shadcn.com/r/styles/radix-nova/item.json) | New `src/components/ui/item.tsx`; only separator import changed to installed path                | `pricing-refined.tsx:7` and help-row composition                                         |

Source SHA256 checks:

- Badge: `c534319459b74f4f11bbf8ddcd7aedba98631789aa6d7ffa8a7978ba91760b93` (local identical).
- IconTile official source: `83f4253dfef982d5a372c63c3cc744e06fc45c75f48c7aaa72b2a3e3b009e3ac`; local `33e26f0d4c1a76cf490c2fe486d571a3a520d80df0f22e2e5090948d678ce61c` differs only by the initial source URL comment.
- Stock Item official source: `6bab466798ad5bca030df773464cbe6c9dcc1dcc863d99e7091f75cd8d14a5eb`; installed local `60f295ce7e9405c686627b00012579b8d944c456163145f18c84392e11a74104` differs only by the separator installation import.

Removed duplicated Badge geometry/typography and light/dark semantic colors; the official implementation consumes the existing shared official tokens in `src/index.css`. Removed the handwritten icon tile, inset pseudo-element and SVG sizing. Removed manual Item row geometry, hover, copy layout and typography. The public reference's actual tile is40×40 with18px glyph and8px radius; the official elevated/default variant supplies those values. Only reference-specific media centering, title/description gap, minimum width and a scoped correction for the gallery anchor focus rule remain.

Button/Card/Tabs/Separator remain honest stock dependencies, as used by official free `c-button-1`, `c-card-1`, `c-tabs-1`, `c-separator-1` examples; they are not described as ReUI primitive implementations. No new misleading wrappers or renamed stock components were created. Shared Badge/IconTile were reused without overwriting concurrent work.

The checked free components do not supply a complete Pricing5/6 block or its plan data model. Responsive pricing composition, rate calculation, Pro-specific type/layout, badge gradient/shadow, independently generated dot/grain effects and brand arrangement remain custom instance work. Their role is to compose and extend available official primitives rather than replace them.

Post-migration QA: both retained pricing flow tests and scoped oxlint pass. Both local pages were recaptured at1280×1100 and390×844 in both billing states, with every local placeholder clicked, route preserved, no dialogs/toasts, no pageerrors or horizontal overflow. Main heading/card/help geometry above is unchanged. A fresh public Pricing5 desktop pass verified the actual official row hover/focus and Enter activation against local; the first tile now matches x121/y776.875/40×40 exactly. Primitive computed evidence and source equality are in `/tmp/reui-fidelity-review/pricing/official-reuse/primitive-verification.json` and `provenance.json`.

Milestone source changes: `src/blocks/commerce/pricing-refined.tsx`, `src/blocks/commerce/pricing-refined.css`, added `src/components/ui/item.tsx`; this report updated. Tests were retained unchanged for this migration. Source is frozen for the coordinating parent to run production/ZIP verification and publish. This section does not claim commit, push or deployed-preview success.
