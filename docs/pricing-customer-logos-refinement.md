# Pricing 4 — Customer Logo Pricing refinement

Inspected on2026-10-26. Scope is Marketing Pricing4 only. Named export: `CustomerLogoPricing`; root selector: `.customer-logo-pricing`. This batch adds only the page, its scoped CSS, two focused interaction tests and this ledger. Pricing1–3, Pricing5/6 and their brandmarks, shared UI, live routing, source targets and other blocks remain untouched.

## Public reference and actual actions

- [Public block brief](https://reui.io/blocks/marketing/pricing/pricing-4).
- [Public rendered preview](https://reui.io/preview/base/pricing-4), opened in headless Chromium at1440×1100,1280×1100 and390×844.
- Both Monthly and Annual were clicked at all three widths, followed by all three CTA anchors. Screenshots and computed styles were captured after the same Inter font finished loading.

| Plan       | Monthly                              | Annual (default)                    | Pricing semantics                                              |
| ---------- | ------------------------------------ | ----------------------------------- | -------------------------------------------------------------- |
| Basic      | $35 per month; Billed monthly        | $28 per month; $336 billed yearly   | Flat price; annual rate ×12 determines its displayed total     |
| Business   | $25 per seat / month; Billed monthly | $20 per seat / month; Billed yearly | Per-seat price; no invented seat picker or computed team total |
| Enterprise | $750 per month; Starting price       | $750 per month; Starting price      | Quote floor, unaffected by billing tabs                        |

The six feature rows in every tier match the observed reference. Basic includes2million monthly events,12months history,1seat and50dashboards; Embedded charts and Single sign-on are visibly unavailable and receive accessible “Not included” text. Business includes10million events,36months history,2to20seats,500dashboards and both remaining features. Enterprise uses Custom/Unlimited limits and includes both features. Trial copy explicitly offers14days for Basic/Business.

The Basic/Business “Start Trial” and Enterprise “Contact Us” controls are actual `href="#"` anchors in the reference. Actual clicks produce no payment, successful purchase state, confirmation dialog or toast. Local anchors prevent clearing the gallery hash route and return to the top, retaining the chosen period. The tests exercise all three anchors while Monthly is selected and then return to Annual.

## Actual official free reuse

The free source and complete examples were inspected before implementation, rather than replacing available controls with custom mechanisms.

| Official free implementation / complete example                               | Existing local module                      | Actual use                                                                                                                          |
| ----------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| [ReUI Badge](https://reui.io/r/radix-nova/badge.json)                         | `src/components/reui/badge.tsx`            | `success-light` Annual savings and `success` Best Value; the latter only adds page-specific positioning/gradient/shadow             |
| [Complete Card example](https://reui.io/r/radix-nova/c-card-1.json)           | `src/components/ui/card.tsx`, `button.tsx` | Actual Card/Header/Title/Content and Button composition, adapted to the measured plan header, rate, CTA, separator and feature rows |
| [Complete Tabs example](https://reui.io/r/radix-nova/c-tabs-1.json)           | `src/components/ui/tabs.tsx`               | Actual Tabs/List/Trigger, controlled by Monthly/Annual state                                                                        |
| [Complete Separator example](https://reui.io/r/radix-nova/c-separator-1.json) | `src/components/ui/separator.tsx`          | Actual dividers inside all three cards and the illustrative-team caption                                                            |

Card/Button/Tabs/Separator are the bare stock dependencies used by those official ReUI free examples; they are not mislabeled as in-house ReUI primitives. Badge is the genuine in-house implementation, not stock Badge under an alias. No shared component was edited and no substitute base control or interaction state machine was introduced.

SHA256 of fetched official source bodies:

- Badge: `c534319459b74f4f11bbf8ddcd7aedba98631789aa6d7ffa8a7978ba91760b93`.
- Full Card example: `8bea860b37b3645c4f469ec45920e27e7546868532e4acb3ec9ae8bbafb97f8d`.
- Full Tabs example: `cbfe3e727aeae0df0cbf65a7358070b64457d6cb6850e65a3b128ad5fc07044e`.
- Full Separator example: `786fba5114107d61c1c7062b9e6e09326dbd283fbb2f741e9fe7b1360eb53406`.

Installed vendor source is repository-formatted; these official-source hashes are not claims of byte-identical installed files. The actual imports and call sites are in `PricingCard` and `CustomerLogoPricing`.

The free examples do not supply the finished pricing data model, flat/seat/quote policy, page subgrid, section-wide grain or illustrative-team artwork. Those are page-level custom composition around the official primitives. Existing free component MIT notices and Inter OFL are retained; this batch adds no external asset dependency.

## Five visual checks

1. **Layout:** full-viewport-height centered section, max-width1152 content,48px block padding,40px section gaps; one mobile column and three columns at896px. Desktop Card rows use actual CSS subgrid around the Card parts.
2. **Typography:** existing OFL Inter; heading36/40 desktop and30/36 mobile, card titles18/24.75 semibold, prices36/40 semibold with tabular numerals, detail/features14/20. The price and its two-line billing block share the reference's last-baseline alignment.
3. **Palette and surfaces:** original white/neutral primary theme,14px Card corners and inset outline,10px CTA corners; actual official emerald savings/Best Value Badge variants. Best Value overlaps the Business card by10px.
4. **Spacing and alignment:** all three cards are423.75px high at the inspected widths; feature rows have20px gaps and included/minus icons match the observed roles. The3CTA controls, tabs, badges and Card subparts were paired with their reference equivalents.
5. **Intentional original media:** the brand row is explicitly “Illustrative product teams” and uses six local Alpha–Foxtrot letter tiles generated by shared original `integrationArtwork`/`svgImage`. The neutral wordmark row retains its outer layout band. Grain is independently drawn from a seeded3px dot grid, not sampled or extracted from the reference canvas.

## Matching geometry ledger

The default-Annual reference and local rectangles below match in CSS pixels. At each width24paired rectangles—heading, TabsList/triggers, both badges, all Cards/Header/Title/Content and three CTA anchors—have zero position/size differences. This is measured geometry evidence, not a synthetic fidelity percentage or a claim that substituted artwork is pixel-identical.

| Element          | 1440×1100 x/y/w/h                   | 1280×1100 x/y/w/h                   | 390×844 x/y/w/h                |
| ---------------- | ----------------------------------- | ----------------------------------- | ------------------------------ |
| Heading          | 560.890625/175.625/318.21875/40     | 480.890625/175.625/318.21875/40     | 62.40625/48/265.1875/36        |
| TabsList         | 621.34375/323.625/197.296875/32     | 541.34375/323.625/197.296875/32     | 96.34375/184/197.296875/32     |
| Basic Card       | 176/395.625/346.65625/423.75        | 96/395.625/346.65625/423.75         | 16/256/358/423.75              |
| Business Card    | 546.65625/395.625/346.671875/423.75 | 466.65625/395.625/346.671875/423.75 | 16/703.75/358/423.75           |
| Enterprise Card  | 917.328125/395.625/346.65625/423.75 | 837.328125/395.625/346.65625/423.75 | 16/1151.5/358/423.75           |
| Basic CTA        | 192/518.375/314.65625/32            | 112/518.375/314.65625/32            | 32/378.75/326/32               |
| Best Value Badge | 804.6875/385.625/72.640625/20       | 724.6875/385.625/72.640625/20       | 285.359375/693.75/72.640625/20 |

Whole section height is1100px at both desktop widths and1761.25px at390px. No horizontal overflow, broken original images or pageerror was observed. The generated local canvas covers the entire section and contains painted pixels; all six original image data URIs load.

## Validation and remaining differences

A separate `git archive` candidate was created from the committed HEAD, overlaid only with this batch's new implementation/test files and a candidate-only index3 wiring. It uses independent `.cache` TypeScript build info and Vite caches and a dedicated localhost port; no shared working-tree build, broad format operation or Git write was performed.

- Owned `npm run format`, `format:check` and `lint` pass.
- Focused candidate TypeScript project checking passes.
- Two retained Playwright cases pass (1440px and390px): annual/monthly flat and seat rates, unchanged quote floor, feature availability, all CTA placeholder behavior/state retention, six original local marks, canvas dimensions and containment.
- Annual and Monthly screenshots were captured at all three widths and compared against the actual reference; raw geometry pairs are retained. Browser plugin not available; regular headless Playwright is used under the frontend-testing-debugging workflow.

Evidence: `/tmp/bricklane-pricing4-qa/reference.json`, `after.json`, `geometry-pairs.json`, fetched free registry JSONs, nine reference captures, six local captures and `test-results/`. Candidate baseline/path and final owned-file hashes are recorded in `/tmp/bricklane-pricing4-release-manifest.json`. Final coordinated production/source/ZIP integration and release are owned by the parent session; they are not claimed complete here.

Remaining differences are intentional media substitutions: the six original neutral team tiles, illustrative caption and independently generated grain differ from the reference's vendor logos and canvas realization. They preserve structure without implying customer endorsement or distributing upstream artwork. Loaded Inter metrics match; fallback-family declaration strings differ. Minor MIT Lucide version/antialiasing differences may remain. Only Chromium at the three stated widths is inspected, and only1440/390 have retained flow tests. Intermediate widths, other browsers and full dark-theme parity are not certified by this pass. No original SVG paths, avatars, paid screenshots or upstream logo assets are loaded or bundled by this page.
