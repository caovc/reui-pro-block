# Comparison 4–6 public visual and interaction audit — 2026-10-26

## Scope and method

This is a read-only audit of the public rendered [Comparison4](https://reui.io/preview/radix/comparison-4), [Comparison5](https://reui.io/preview/radix/comparison-5) and [Comparison6](https://reui.io/preview/radix/comparison-6) previews. It changes no runtime, model, tests, shared component or source mapping. Existing local production-test success is not evidence that these originals look or behave identically.

The recovered Edge extension was used through five agent-owned research tabs, identified by their exact preview URL and fresh rendered heading. Desktop measurements used **1440×1000**; mobile measurements used **390×844**, with actual `innerWidth` checked. A new tab did not inherit the previous tab's viewport override; an initial2552px capture was therefore excluded from the390px measurements. The mobile Comparison5 default geometry below comes from a fresh page at `scrollY=0`, avoiding the earlier Add-to-cart/Switch-induced scroll position. Carousel position samples taken during animation were excluded from settled card-position claims.

Evidence consists of rendered DOM snapshots, inline screenshots, semantic controls/keyboard actions and read-only element bounds/computed style. No hidden application state, network or source inspection was used. No reference screenshot, product photo, decorative image, extracted SVG or paid implementation was saved or distributed. Browser-injected assistant decoration was excluded from the component evidence. After the audit, the viewport override was reset and all five owned research tabs were closed; human and other agents' tabs were not changed.

## Comparison4 — Ranked scorecards

### Actual default composition

Heading: **Ranked by overall score**. There is no observed eyebrow. Supporting copy describes five0–10 dimensions and50hours of testing, followed by a How we score link. A page fraction and two circular arrows sit to the right on desktop and below the wrapped introduction on mobile. **No dot pagination was visible or present among the rendered controls** in these states.

At1440px the outer section is1152px wide at x144; the content region is1088px wide at x176. The first page has three side-by-side cards, each approximately **346.664×421px**, at x180/546.664/913.328, y136. The product thumbnails are **80×80px**. Page1 contains Pro, Max and Elite; page2 contains Wireless, Active and Mini. All six article nodes remain in the DOM; off-page groups are clipped. Counting six article nodes must not be described as six simultaneously visible cards.

At390px a page still contains **three cards**, now **vertically stacked**, rather than becoming a one-card-per-page slider. Settled first-page cards are **350×421px**, x20, y188/625/1062. Page2 has the next three products in the same vertical grouping. This needs ordinary vertical scrolling. The document width remained390px; the other carousel group was clipped rather than widening the document.

Each card has thumbnail/title/category/rating/review count across its upper area; placement and dimensional-win count on one row; a large overall score and full-width overall meter; five smaller dimension meters; then price left and Add to cart right at the bottom. The first product has a **yellow diagonal Top pick ribbon**, not a small horizontal top-pick pill. Other product markers include Flagship, On sale and New. Per-dimension winners use a dark fill and stronger label, with other fills gray. The tied noise-cancellation value is visibly highlighted on both applicable products; displayed wins are not the same as overall rank. The sale product shows a current price with a crossed-out old price. Actual public photography was observed for layout only and must be replaced by original or licensed material.

The following scalar measurements were taken in the settled **390px Pro card**. Desktop cards have the same421px overall height, but these individual offsets were not separately remeasured at desktop width.

| Element          |  Top relative to card | Height / font           |
| ---------------- | --------------------: | ----------------------- |
| Thumbnail        |                  21px | 80×80px                 |
| Product name     |                  30px | 24px line box,16px /600 |
| Category         |                  56px | 16px line box,12px      |
| Numeric rating   |                  76px | 16px line box,12px /500 |
| Rank             |                 121px | 20px line box,14px /600 |
| Wins             |                 124px | 16px line box,12px      |
| Overall score    |                 149px | 30px line box,30px /600 |
| Overall meter    |                 188px | 308×8px                 |
| Dimension meters | 221/249/277/305/333px | Each160×6px             |
| Price            |                 372px | 28px line box,18px /600 |
| Cart button      |                 372px | 28px high               |

The actual rendered meters expose min0, max10 and numeric values to assistive technology. The five breakdown dimensions are Sound, Battery, Noise cancel, Comfort and Value. Independent local score fixtures and actual free Progress/Rating/Badge composition should remain distinct from copying reference imagery or assuming the same business data.

### Actual controls

- Next page changed the fraction from1/2 to2/2, enabled Previous and disabled Next. The first page has the opposite disabled boundary.
- With a page control focused, **ArrowLeft** actually returned2/2→1/2; **ArrowRight** advanced1/2→2/2. These are exercised keyboard results, not an assumption from a carousel dependency.
- Mobile Previous restored the first vertical three-card page from the second. Touch/swipe was **not** exercised and remains pending.
- How we score has `href="#methodology"`. Clicking it changed the URL hash; `document.getElementById("methodology")` was absent before and after, and `scrollY` stayed0. No methodology panel or dialog appeared. The independent implementation may add useful content, but it must not be presented as an already observed original feature.
- Product/review anchors and this block's Cart button were not separately activated in this audit. Their external behavior remains unverified.

## Comparison5 — Focused hero and alternative switcher

### Actual default composition

Eyebrow: **Before you decide**. Heading: **Compare with similar models**. A sentence names the currently focused product and says there are three alternatives. The initial focus is Pro; alternatives are Wireless, Max and Elite.

Desktop content is1088px wide at x176. A large hero card occupies the left and three smaller rival cards stack down the right, with20px between the two columns and12px between rivals. The hero is approximately **657.227×909.930px**, y160; its image is **655.227×524.180px**, a5:4 area. Rival cards are approximately **410.773×306px**, y160/478/796, and each thumbnail is **96×96px**. The rival stack extends slightly farther down than the initial hero.

The hero has an image-overlay You're viewing marker; then name, category links, short tagline, price/rating/reviews, an Included features divider, four boolean feature rows and a full-width cart action. Rival cards have a compact thumbnail/header, category links, price with signed difference versus the hero, rating/reviews, the same four feature rows, Switch to this and Details. Missing features are muted and struck through; included ones have check marks. The original **four features** are active noise cancellation, spatial audio, wireless charging and hi-res audio/LDAC. No13-spec detailed comparison is present inside these four cards in the observed state.

At390px the introduction is followed by the hero and then the three rivals **in one vertical column**. Default hero: **358×677.797px**, x16,y168, image **356×284.797px**. Default rivals: **358×306px**, y865.797/1183.797/1501.797. The hero's cart action is at the end of its normal document flow, not a viewport-fixed checkout bar. The document width remained390px.

Additional mobile hero offsets were measured on the switched Max hero, which had the same677.797px height: name top305.797px relative to card,28px line box/20px font; Included features heading top485.297px,16.5px line box/11px font; four-feature list top513.797px,height95px; Cart top624.797px,height32px. Exact independent price/rating/tagline offsets were **not** separately saved; they must not be invented from these surrounding measurements.

### Actual switching and ordering

Switch was exercised on both desktop and mobile. It updates the hero image/name, descriptive sentence, tagline/features and each rival's price delta. The original hero returns to the alternatives; it does not disappear from the candidate pool.

| Observed transition             | Hero        | Alternatives, in actual order | Signed deltas      |
| ------------------------------- | ----------- | ----------------------------- | ------------------ |
| Initial Pro → Wireless, desktop | Wireless249 | Pro / Max / Elite             | +150 / +250 / +400 |
| Initial Pro → Max, mobile       | Max499      | Pro / Wireless / Elite        | −100 / −250 / +150 |
| That Max → Elite, mobile        | Elite649    | Pro / Wireless / Max          | −250 / −400 / −150 |

These transitions are consistent with a stable candidate order Pro/Wireless/Max/Elite excluding the current focus. They directly rule out a simple in-place swap with the clicked rival slot, or a rule that always inserts the previous hero at the first rival position. They establish the observed four-product pool only, not a generalized algorithm for arbitrary catalogs.

The hero Add to cart was actually clicked. Its text remained Add to cart, and no visible status/toast/cart count appeared. The tab's available console-log capture returned an empty list, both with a cart filter and with the last few log/info/warn/error entries. **A console-only callback was therefore not confirmed.** No lack of visible feedback is treated as proof of an internal implementation or of real cart persistence. Product/category/review/Details hash links were observed but not activated here.

## Comparison6 — Catalog selection and live comparison

### Heading, catalog and default state

Heading: **Build your comparison**; no observed eyebrow. Supporting copy invites selection of up to four headphones and says the lower comparison updates live. Default selection is **Wireless and Pro,2/4**; the other two slots are empty. Clear all appears while at least one item is selected. The catalog contains six products in order Mini, Wireless, Active, Pro, Max, Elite.

At1440px the1088px content has a **three-column, two-row catalog**. Each card is **352×484px**, with a **326×326px** image and16px horizontal/vertical gaps. The first row starts y132; the second y632. Each card shows product/categories, price/rating/reviews and a full-width Compare or Added control; selected products have a separate Added marker. In the rendered DOM the controls are buttons with `aria-pressed`; native accessibility also presents toggle semantics.

At390px the original catalog is **one column**, not two or three. Each card is **358×490px**, x16, with a **332×332px** image and12px vertical gaps. Tops are y184/686/1188/1690/2192/2694. The catalog is3000px high. The header's count and Clear all move below the wrapped description. This is an actual observed phone state, not a guessed breakpoint interpolation.

### Exercised selection, limit, removal and empty state

- Added Mini and Active to the initial two products, reaching4/4. Unselected Max and Elite became **disabled**; all four selected controls remained enabled for removal. This boundary was exercised separately at desktop and390px.
- The slot sequence followed selection order: Wireless, Pro, Mini, Active, even though that differs from catalog order.
- Removing Pro from its slot compacted the remaining sequence to Wireless, Mini, Active and left Slot4 empty. The formerly disabled Add Max control was enabled again.
- Removing Mini and Active left **one selected item**. Its populated slot and the specification groups still rendered, alongside three empty slots. The lower panel is **not gated behind two selected items**.
- With a single selected item, its265g weight had font-weight400. Restoring Pro as a second item made the lower265g value font-weight600. This directly supports the observed objective-winner emphasis; it does not establish every possible tie or numeric metric.
- Clear all changed the counter to0/4 and removed the Clear all control. **Four empty slots remained.** The specification groups were replaced by an empty-state message inviting comparison; the explanatory objective-spec footnote remained. This was exercised at desktop and mobile.

### Actual desktop comparison grid and fields

The desktop label column is **176px**, followed by four product columns of **201.5px** each. Slot cards are approximately **201.5×194px**, with **64×64px** selected thumbnails. Empty slots have a dashed surface and an add-from-catalog instruction. The slot header and specifications remain aligned even with fewer than four selections; empty values are dashes.

The public preview in this audit has **eight specification fields in four groups**, not the local implementation's fuller13-field extension:

| Group   | Field / visible unit | Wireless | Pro      |
| ------- | -------------------- | -------- | -------- |
| Build   | Type                 | Over ear | Over ear |
| Build   | Weight,g             | 265      | 295      |
| Audio   | Noise cancellation   | Yes      | Yes      |
| Audio   | Spatial audio        | No       | Yes      |
| Audio   | Hi-res codec         | aptX     | LDAC     |
| Power   | Battery life,h       | 38       | 50       |
| Power   | Wireless charging    | No       | Yes      |
| Support | Warranty,yr          | 2        | 3        |

This is the actual observed public field list. It is not authorization to silently remove richer independent local data or reinterpret its tests as reference coverage.

### Actual390px comparison presentation — important difference

The original's390px comparison does **not** present the anticipated horizontal-scroll table with a pinned specification column in this observation:

- The four slots stack vertically. The rowgroup is **356px wide and841px high**; individual empty slots are **324×194px**, with12px gaps. Selected thumbnails are still **64×64px**, measured directly on the phone state.
- Its outer parent has `overflow-x:hidden`, `clientWidth=scrollWidth=356` and `scrollLeft=0`. The full document has `scrollWidth=390`, matching the viewport.
- The Type label is **324px wide**, computed `position:static`, `left:auto`. Its row parent's `grid-template-columns` is a single **324px** column.
- The visible screenshot and DOM show Type followed vertically by Over ear / Over ear / dash / dash. Weight similarly lists265 /295 /dash /dash beneath its label; other groups follow the same stacked value presentation.

This may reflect an unexpected responsive presentation; the audit **does not establish the author's intent or classify it as an original bug**. It is simply the actual rendered state at this width. A locally implemented horizontal scroll and pinned spec column can be a useful independent extension, but a local overflow or pinning test must not be used to claim that the public original has that behavior. No nonexistent horizontal scroll gesture was fabricated to fill this evidence gap.

## Evidence limits and handoff

All three requested default desktop/mobile states and the described key state changes were actually inspected. Remaining gaps are explicit: touch/swipe for Comparison4, hash product/review/detail destinations, the internal/cart persistence/console-only behavior in Comparison5, arbitrary switch candidate sets, and every comparison winner/tie case. Widths other than1440 and390 were not audited. Inline screenshots support the visual observations but are not distributed as reusable assets.

The observations and exact dimensions were sent directly to the coordinating session and the Comparison4–6 implementation owner before any later visual work. Shared heading/root changes remain with their designated owner. Subsequent corrections must still actually reuse official free ReUI capabilities, retain original Bricklane/local licensed media and MIT/OFL notices, keep readable oxfmt/oxlint-compliant source, maintain true source-leaf/export consistency and be independently verified/published by the coordinating session. This document itself requires only its scoped formatting check; it contains no implementation change.
