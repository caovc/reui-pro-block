# Contact / FAQ rendered-reference refinement — 2026-10-22

This replaces the earlier approximate pass and its outdated behavior claims. All twelve public isolated previews were opened, inspected and operated. The reference is the rendered public DOM, layout metrics and screenshots, not the premium registry source. Blog and MarketingCompare remain in `marketing.tsx` with their previous behavior.

## Official free ReUI composition

The current helper actually imports and renders the unmodified public ReUI implementations installed by the coordinated agent:

- `src/components/reui/frame.tsx`: [official radix-nova Frame registry](https://reui.io/r/radix-nova/frame.json), used as Frame/FramePanel in Contact 1/6 and FAQ 2/6.
- `src/components/reui/icon-tile.tsx`: [official IconTile registry](https://reui.io/r/radix-nova/icon-tile.json), used with its `elevated` variant for all support/channel tiles; only the public size/radius variables extend it to the measured 42px/10px geometry.
- `src/components/reui/badge.tsx`: [official Badge registry](https://reui.io/r/radix-nova/badge.json), used for the small badges with `outline`/`full` variants and measured local context styles.

These are genuine registry implementations, not renamed local approximations. All three supporting registry entries return public HTTP 200 without authentication and have no registry dependencies. Button, Input, Textarea, Select, Tabs and Accordion use the existing shadcn primitives: [ReUI's official installation guide](https://reui.io/docs/get-started) explicitly says stock shadcn components are not ReUI items and retain their bare component names. The corresponding ReUI bare registry entries returned 404 (Input had a transient TLS failure); this is a documented composition boundary, not a claim that those files are ReUI source. No premium block source was fetched.

## Measurement setup

Desktop reference and local: CSS viewport **2552×1322**, browser zoom/visualViewport scale **1**, DPR **2**. Contact6 uses **2552×1275** because that was the captured reference viewport. Mobile reference and local: **390×844**, scale **1**, DPR **1**. Both use Inter and the same light semantic color tokens. Desktop screenshots include the complete viewport; phone screenshots include the whole naturally flowing document.

Each row below gives the measured main container's width × height, reference = local. The x/y coordinates are also identical and are saved in `/tmp/reui-contact-faq-final-comparison.json`. FAQ3 compares its actual max-width content wrapper (the reference section itself spans the viewport); Contact5 compares its visible card. Dimensions alone are not a claim of pixel equivalence.

| ID / public preview | Desktop ref = local | Phone ref = local | Specific calibrated layout | States actually checked | Remaining difference |
| --- | --- | --- | --- | --- | --- |
| [contact-1](https://reui.io/preview/base/contact-1?embed=1) | 672 × 304.25 | 358 × 352.75 | Centered 672px intro; 448px mail frame; 14px/21px mail description; phone intro 30px/37.5px. | Email button clicked: reference has no visible effect; local likewise. | No material layout gap found; glyph rendering can differ. |
| [contact-2](https://reui.io/preview/base/contact-2?embed=1) | 1152 × 723 | 358 × 1461.5 | 1152px 1:1 split; 40px form pane desktop/20px phone; exact eight field families, 32px inputs, 112px details. | Project Type and Timeline option lists/slug display checked; empty and filled submit reset without success UI. | Purple dotted wave is independently drawn; dot density, wave geometry and gradient stops still differ. |
| [contact-3](https://reui.io/preview/base/contact-3?embed=1) | 1152 × 704 | 358 × 1307.5 | 1152px split with 32px gap; 40px desktop/4px phone form padding; Topic and Subject restored; exact public image/overlay. | Topic menu, raw selected slug and form reset checked. Mail/tel targets inspected, not dispatched. | Image matches the public asset; minor Lucide glyph differences remain. |
| [contact-4](https://reui.io/preview/base/contact-4?embed=1) | 1024 × 431 | 358 × 993 | 1024px studio band; three columns to vertical offices; actual Austin/Berlin/Tokyo fields; balanced heading; observed procedural grain. | Talk to us and each directions action checked: reference hash placeholders, no dialog. | Noise is rendered from the observed public SVG filter parameters; antialiasing may vary by engine. |
| [contact-5](https://reui.io/preview/base/contact-5?embed=1) | 1024 × 636 | 358 × 1256.109 | 1024px two-pane card; 32px phone padding; real short form fields; inline wrapping documentation link; no consent checkbox. | Terms/Privacy/docs placeholders and filled/empty submit reset checked. | Native reference submits GET; local resets in place to preserve the SPA preview route. |
| [contact-6](https://reui.io/preview/base/contact-6?embed=1) | 896 × 610 | 358 × 1098 | 896px section; 3 channels in official Frame/FramePanel; 42px elevated IconTile; phone full-width stacked docs actions. | Start chat/community/docs/FAQ placeholders checked; no invented inquiry dialog. | Community brand glyph replaced with a free Lucide GitFork; reference public demo has no rendered brand glyph. |
| [faq-1](https://reui.io/preview/base/faq-1?embed=1) | 1152 × 789 | 390 × 1351 | 1152px sticky-intro/cards split; true 14px topic tabs with 24px gap; balance-wrapped intro; 7/3/2/2 topic counts. | Multiple answers remain open; Licensing/Updates filter and open first item; All restores seven. | Independent long answers preserve measured line density; support glyph is a free Lucide replacement. |
| [faq-2](https://reui.io/preview/base/faq-2?embed=1) | 896 × 710 | 390 × 1114 | 896px 2-column answers; 15px/24px balanced question spans; independent multi-open columns; centered dotted support frame. | Second answer opens without closing first; both columns and review CTA checked. | Independent long answers and Lucide support glyph; no major measured layout gap remains. |
| [faq-3](https://reui.io/preview/base/faq-3?embed=1) | 1024 × 921 | 390 × 1360 | 1024px open-answer grid; six visible answers; 16px/24px weight600 headings; 14px/22.75px body; 60% divider color. | All six answers stay visible; Support Desk and Read Docs retain reference placeholder behavior. | Independent long answers preserve density; free LifeBuoy replaces support glyph. |
| [faq-4](https://reui.io/preview/base/faq-4?embed=1) | 768 × 1026 | 390 × 1158 | 768px bare divider accordion; seven actual question titles; 20px row padding, 24px trigger gap; balanced intro. | Single-open second question closes first; clicking again closes all; team link checked. | Independent long answers, matched default row structure. |
| [faq-5](https://reui.io/preview/base/faq-5?embed=1) | 1152 × 721 | 390 × 1202 | 1152px answer-panel/support-card split; 24px phone panel padding; 24px/32px mobile heading; text-pretty question spans. | Single-open/collapse behavior and support/email placeholders checked. | Independent long answers and free support glyph; no major measured layout gap remains. |
| [faq-6](https://reui.io/preview/base/faq-6?embed=1) | 768 × 828 | 390 × 1120 | 768px joined official Frame with two FramePanels; 8px phone answer gutters; 40%-muted footer; exact action order. | All six answer controls exercised; single-open/collapse and docs/support placeholders checked. | Independent long answers and free support glyph; no major measured layout gap remains. |

## Screenshot pairs

Each pair below has the same CSS viewport, zoom and device scale. Reference DOM measurements are adjacent JSON files; latest local metrics are `*-final-metrics.json`.

| ID | Desktop reference / local | Phone reference / local |
| --- | --- | --- |
| contact-1 | [ref](/tmp/reui-contact-1-reference.png) · [local](/tmp/reui-contact-1-local.png) | [ref](/tmp/reui-contact-1-mobile-reference.png) · [local](/tmp/reui-contact-1-mobile-local.png) |
| contact-2 | [ref](/tmp/reui-contact-2-reference.png) · [local](/tmp/reui-contact-2-local.png) | [ref](/tmp/reui-contact-2-mobile-reference.png) · [local](/tmp/reui-contact-2-mobile-local.png) |
| contact-3 | [ref](/tmp/reui-contact-3-reference.png) · [local](/tmp/reui-contact-3-local.png) | [ref](/tmp/reui-contact-3-mobile-reference.png) · [local](/tmp/reui-contact-3-mobile-local.png) |
| contact-4 | [ref](/tmp/reui-contact-4-reference.png) · [local](/tmp/reui-contact-4-local.png) | [ref](/tmp/reui-contact-4-mobile-reference.png) · [local](/tmp/reui-contact-4-mobile-local.png) |
| contact-5 | [ref](/tmp/reui-contact-5-reference.png) · [local](/tmp/reui-contact-5-local.png) | [ref](/tmp/reui-contact-5-mobile-reference.png) · [local](/tmp/reui-contact-5-mobile-local.png) |
| contact-6 | [ref](/tmp/reui-contact-6-reference.png) · [local](/tmp/reui-contact-6-local.png) | [ref](/tmp/reui-contact-6-mobile-reference.png) · [local](/tmp/reui-contact-6-mobile-local.png) |
| faq-1 | [ref](/tmp/reui-faq-1-reference.png) · [local](/tmp/reui-faq-1-local.png) | [ref](/tmp/reui-faq-1-mobile-reference.png) · [local](/tmp/reui-faq-1-mobile-local.png) |
| faq-2 | [ref](/tmp/reui-faq-2-reference.png) · [local](/tmp/reui-faq-2-local.png) | [ref](/tmp/reui-faq-2-mobile-reference.png) · [local](/tmp/reui-faq-2-mobile-local.png) |
| faq-3 | [ref](/tmp/reui-faq-3-reference.png) · [local](/tmp/reui-faq-3-local.png) | [ref](/tmp/reui-faq-3-mobile-reference.png) · [local](/tmp/reui-faq-3-mobile-local.png) |
| faq-4 | [ref](/tmp/reui-faq-4-reference.png) · [local](/tmp/reui-faq-4-local.png) | [ref](/tmp/reui-faq-4-mobile-reference.png) · [local](/tmp/reui-faq-4-mobile-local.png) |
| faq-5 | [ref](/tmp/reui-faq-5-reference.png) · [local](/tmp/reui-faq-5-local.png) | [ref](/tmp/reui-faq-5-mobile-reference.png) · [local](/tmp/reui-faq-5-mobile-local.png) |
| faq-6 | [ref](/tmp/reui-faq-6-reference.png) · [local](/tmp/reui-faq-6-local.png) | [ref](/tmp/reui-faq-6-mobile-reference.png) · [local](/tmp/reui-faq-6-mobile-local.png) |

Reference interaction state evidence includes `/tmp/reui-faq-1-{multiopen,licensing,updates}-reference.png`, `/tmp/reui-faq-2-open-reference.png`, `/tmp/reui-faq-4-open-reference.png`, and `/tmp/reui-faq-5-open-reference.png`. Local Licensing states are `/tmp/reui-faq-1-licensing-{2552,390}-local.png`.

## Content flow and verification

No section height is hard-coded to obtain the measured bounds, and FAQ text is not line-clamped or hidden. The public art pane minimum height and fixed input/textarea control geometry are retained. Expanded panels, tab changes and phone stacking use normal content flow.

All long FAQ answers use independent wording. Short question titles, field labels and operation labels retain the reference meaning. The 32 accordion answers and six always-visible answers are checked at their actual fixed column widths in desktop and phone. The density audit renders the saved reference answer text with the measured reference-compatible font/width in an off-screen local element, counts DOM Range line rectangles, and compares it with the displayed independent answer. This is a density comparison; the source page's earlier opened states and geometry are separately recorded. `/tmp/reui-faq-rendered-density.json` contains the per-question measurements; the simpler canvas audits are `/tmp/reui-faq-line-audit.json` and `/tmp/reui-faq-mobile-line-audit.json`.

Measured answer density after independent wording (reference/local line counts agree in every entry; text-rectangle height error is 0px):

| Variant | Desktop lines in question order | Phone lines in question order | Maximum line / text-height error |
| --- | --- | --- | --- |
| faq-1 | 3, 3, 3, 3, 2, 3, 3 | 6, 5, 6, 5, 4, 5, 5 | 0 lines / 0px |
| faq-2 | 3, 3, 3, 3, 3, 3 | 3, 4, 3, 4, 4, 4 | 0 lines / 0px |
| faq-3 | 2, 3, 3, 2, 2, 2 | 3, 3, 3, 3, 3, 3 | 0 lines / 0px |
| faq-4 | 3, 4, 3, 3, 3, 3, 3 | 5, 6, 5, 5, 5, 5, 5 | 0 lines / 0px |
| faq-5 | 3, 3, 3, 3, 3, 3 | 6, 6, 6, 5, 6, 6 | 0 lines / 0px |
| faq-6 | 3, 3, 3, 3, 3, 3 | 7, 6, 7, 7, 6, 6 | 0 lines / 0px |

`/tmp/reui-contact-faq-interaction-audit.json` records the final local desktop/phone actions: filled forms and select slug display, submit/reset, FAQ1 filters/reset/multiple-open, FAQ2 independent multiple-open columns, FAQ4/5/6 single-open/collapse, FAQ3 always-open, and placeholder CTAs. The native reference form GET refresh is represented by an in-place reset so the gallery hash route remains intact; no success card, required consent checkbox, office modal or channel dialog is invented.

The latest snapshot sweep reports no page errors and no horizontal document overflow. Scoped oxlint passes. `npx playwright test tests/demos.spec.ts --grep 'FAQ categories' --workers=1` passed against the actual Licensing tab/team-license question. Full workspace TypeScript validation may be affected by concurrent agents; final integration belongs to root.

## Asset and scope limits

Contact3 bundles the same freely accessible [Unsplash image](https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=640&h=440&q=80) as the reference, with the observed layered overlay, at `src/blocks/commerce/assets/contact-abstract.jpg`. Contact2's decorative gradient/wave is independently drawn and remains the largest visible difference. Public proprietary/missing glyphs use free Lucide equivalents; their exact strokes are not claimed to match. Dark theme, all intermediate viewport widths, real email/phone/chat delivery, maps and backend persistence were not audited as part of this comparison.

Owned files ready for the parent to review/commit: `src/blocks/commerce/marketing.tsx`, `marketing-contact-faq.tsx`, `marketing-contact-faq.css`, `marketing-faq-content.ts`, `assets/contact-abstract.jpg`, and this report. Shared official Frame/IconTile/Badge and Inter assets are coordinated dependencies owned by other agents. Nothing was staged or committed by this agent.

## Earlier small mobile overflow follow-up

An earlier authorized task changed only wrapping classes in `promotions.tsx` review-2 and `heroes.tsx` how-it-works-4/5. `npx playwright test tests/mobile-variants.spec.ts --grep 'ecommerce/review|marketing/how-it-works'` passed; 390px and 1440px screenshots are `/tmp/reui-how-it-works-{4,5}-{390,1440}.png` and `/tmp/reui-review-2-{390,1440}.png`. Those files are now outside this Contact/FAQ refinement scope and are left to parent integration.

## Published milestone verification

The coordinator also rebuilt `ce11008` plus only this ten-file scope in `/tmp/reui-marketing-milestone`. The isolated production build passed; all twelve desktop and twelve phone container rectangles equal the captured references, with no page errors or document overflow. The dual-viewport form/FAQ interaction audit and the focused FAQ regression passed. A Contact3 ZIP downloaded through that production UI includes official Frame/IconTile, the bundled Inter font and the public image, and builds independently. Logs: `/tmp/reui-marketing-milestone-{final-build,audit,interactions,tests,export}.log`. These checks cover this milestone and do not certify other concurrent families or exact decorative artwork.
