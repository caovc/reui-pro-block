# Pricing 1 — Seat Stepper refinement

Scope: Marketing Pricing 1 only, inspected on 2026-10-26. Named export: `SeatStepperPricing`; stable root: `.seat-stepper-pricing`. The four owned files contain the independent page, scoped styles, three interaction tests and this ledger. Existing routing, source targets, shared components and other pricing entries were not edited. Integration and release are coordinated by the parent session.

## Public reference and observed behavior

- [Public block brief](https://reui.io/blocks/marketing/pricing/pricing-1).
- [Actual public preview](https://reui.io/preview/base/pricing-1), inspected in headless Chromium at 1280×1100 and 390×844.
- The reference joins four tiers in one Card: Free, Pro, Team and Unlimited. Yearly is selected initially. The Pro column has a muted surface and a green popularity badge. The one-column mobile layout preserves every tier and feature.

| Plan      | Monthly      | Yearly       | Observed billing behavior                   |
| --------- | ------------ | ------------ | ------------------------------------------- |
| Free      | Free         | Free         | Open source, MIT licensed                   |
| Pro       | $35          | $28          | Monthly equivalent, selected billing period |
| Team      | $25 per seat | $20 per seat | Starts at 5 seats: $125 / $100              |
| Unlimited | From $750    | From $750    | Fixed yearly contract in both tabs          |

Actual reference actions, rather than only the brief, established these details:

- Monthly → 6 seats gives Team $150; returning to Yearly keeps 6 seats and gives $120. The feature label updates to the selected team-seat count.
- Typed values below/above the range commit to 2/20. Decrement/increment disable at their boundaries. Clearing the input and blurring preserves the previous value. ArrowUp changes 5 to 6.
- Dragging the Seats scrub label 40px right changed 5 to the capped 20 in both the reference and local implementation.
- All 20 feature hints were individually opened and their visible text checked. The local desktop hints match all 20 captured reference messages; the first hint was additionally checked at 390px. Hover, focus and Escape are covered by the retained tests.
- The four CTAs are actual `href="#"` placeholders. They introduce no checkout, plan-selection dialog or toast. Local anchors prevent clearing the gallery hash route and scroll to the top; seats and billing state persist. The public preview's native hash scroll can animate, so intermediate scroll positions are not used as a business-flow assertion.

## Actual official free component reuse

| Official free source / full example                                                                                                                 | Installed implementation                                                | Actual composition in this page                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Number Field source](https://reui.io/r/radix-nova/number-field.json), [complete basic example](https://reui.io/r/radix-nova/c-number-field-1.json) | `src/components/reui/number-field.tsx`                                  | `PlanColumn` directly uses NumberField, ScrubArea, Group, Decrement, Input and Increment. The official Base UI-backed component owns input parsing, stepping, limits, disabled states, keyboard and scrub gestures. |
| [Badge source](https://reui.io/r/radix-nova/badge.json)                                                                                             | `src/components/reui/badge.tsx`                                         | `success-light` yearly savings; `success` featured badge with page-specific gradient and placement.                                                                                                                 |
| [Complete Card example](https://reui.io/r/radix-nova/c-card-1.json)                                                                                 | Existing stock Card / Header / Title / Description / Content and Button | One Card composed with four plan columns and aligned subgrid tracks.                                                                                                                                                |
| [Complete Tabs example](https://reui.io/r/radix-nova/c-tabs-1.json)                                                                                 | Existing stock Tabs / List / Trigger                                    | Controlled monthly/yearly state.                                                                                                                                                                                    |
| [Complete Tooltip example](https://reui.io/r/radix-nova/c-tooltip-1.json)                                                                           | Existing stock Tooltip / Provider / Trigger / Content                   | Each feature uses the actual portal primitive; `.reui-reference` preserves Inter inside the portal.                                                                                                                 |

Bare Card/Button/Tabs/Tooltip are the stock dependencies used by the official free examples; they are not mislabeled as in-house ReUI implementations. No duplicate stepper, tooltip state machine or replacement base control was written. No shared vendor files were modified.

Registry-source SHA256 evidence:

- Number Field: `8235b00f1465983201aed1a9fa206929135ad514553a0f40740f1dc4a64aace4`.
- Basic full example: `c99acd93b81ab073554bab97f22ffa6d4320751dcf7bd5dec71fc74d081dbdd9`.
- Badge: `c534319459b74f4f11bbf8ddcd7aedba98631789aa6d7ffa8a7978ba91760b93`.

Existing installed Number Field resolves upstream icon placeholders to Lucide icons and is repository-formatted; its local SHA256 at audit time is `743abf27d4a56e60c52bc61be96315cfd3b7c09f760f572a830da1e89f5c19fd`. Installed Badge is repository-formatted; local SHA256 is `aa775fdd1638b34a843f5ece24236705d152cc36ea5edce62a62fe5601dde664`. These are distinct source and installed-file hashes, not false byte-identity claims.

The free primitives do not provide this finished four-tier pricing data model, joined subgrid, tier copy or rate calculation. Those are the custom page-level composition. The featured gradient and primitive placement are instance styles; all semantic Badge defaults remain official.

## Five visual checks and measured ledger

Measurements below are matching reference/local default-yearly rectangles after font load, in CSS pixels. The main geometry was also independently checked by the parent session. No synthetic fidelity score is used.

| Element                 | 1280×1100: x / y / width / height | 390×844: x / y / width / height  |
| ----------------------- | --------------------------------- | -------------------------------- |
| Heading                 | 582.09375 / 64 / 115.796875 / 40  | 146.75 / 48 / 96.5 / 36          |
| Billing TabsList        | 538.484375 / 216 / 203.03125 / 32 | 93.484375 / 188 / 203.03125 / 32 |
| Joined Card             | 96 / 288 / 1088 / 480             | 16 / 260 / 358 / 1611            |
| NumberFieldGroup        | 789.75 / 680 / 106 / 32           | 252 / 1342 / 106 / 32            |
| First hint at scrollY 0 | 72 / 430 / 260.71875 / 28         | 5 / 402 / 260.71875 / 28         |

1. **Layout and spacing:** max-width1152 container,40px header/Card gap,44px introduction/tabs gap. Four desktop columns, two above672px and four above1024px; mobile rows share the same single Card outline. Whole section height832 desktop /1919 mobile.
2. **Typography:** the existing OFL Inter subset is reused. Heading36/40 desktop and30/36 mobile; titles16/22 medium; price30/36 semibold with tabular numerals; body14/20. Existing Card subcomponents preserve their actual free-example type and padding.
3. **Palette:** default white background, neutral text/muted tones, muted featured column, emerald savings and a green-to-emerald featured badge. No hardcoded alternate primary theme.
4. **Surfaces and controls:** Card14px radius, CTA10px, badges6px; popularity badge has square top corners. Every Card header/content/CTA rectangle in the initial reference/local measurement matched. The stepper is106×32 and only exists in Team.
5. **Hint placement:** both checked widths match the reference's first-hint rectangle,8px radius,6px12px padding and12/16 Inter. The installed Radix primitive reserves its arrow height differently from the public Base UI preview; instance `sideOffset=-6` and `collisionPadding=5` reconcile placement without replacing the official primitive.

## Validation and limits

Validation uses a separate `git archive` of committed baseline `8362e2c7773c45e6835db44cc802b5a29a5355c4` plus the owned files and a candidate-only index0 wiring. Candidate TypeScript caches are local `.cache` files; shared working-tree routing and vendor modules remain untouched. Browser plugin not available; regular headless Playwright is used under the frontend-testing-debugging workflow.

- Owned oxfmt format/check and oxlint pass.
- Isolated production build passes strict TypeScript and Vite; final targeted TypeScript check also passes.
- Three retained tests verify prices/period preservation, seat limits/empty/keyboard behavior, mobile placeholder links and state retention, and hover/focus/Escape hint behavior plus portal Inter. They passed on the isolated development surface and production bundle. The final placement-only adjustment was followed by a fresh targeted TypeScript check and all three tests passing.
- Both monthly/yearly local screenshots were captured at both widths; default, changed-seat and hint states were compared against the public reference. No pageerror or horizontal overflow in either width. All four local anchors and both boundary states were exercised.
- All20 local desktop hint texts match their individually opened reference equivalents. A40px rightward scrub produces the same capped20 seats in both widths.

Evidence lives outside the repository in `/tmp/bricklane-pricing1-qa/`: reference/after screenshots, raw computed JSON, `reference-interactions.json`, `reference-tooltip-details.json`, `final-local.json`, `local-tooltip-final.json`, build logs and Playwright results. Source/ZIP integration is owned by the parent; no claim of its completion or release success is made here.

Remaining differences/limits: no measured rectangle or copy mismatch remains for the checked states; this is not a pixel-identity claim. Local icons come from the installed MIT Lucide package, rather than extracted reference SVGs, and small glyph-version/antialiasing differences may remain. Declared font fallback names differ, while the loaded Inter font and measured text geometry match. Only Chromium at the two requested widths is verified; other browsers and intermediate widths are not certified. The local hash-route adaptation is intentional. No checkout/backend flow exists in the public placeholder reference or this implementation.

No upstream avatar, paid screenshot, decorative image, logo or extracted SVG is loaded or distributed by this page. It uses installed MIT Lucide icons, official free components with the existing `src/components/reui/REUI-LICENSE.txt`, and the existing Inter OFL file and notice. Text names the referenced library where the actual feature requires it; Bricklane's site identity and shared original mark are unchanged.
