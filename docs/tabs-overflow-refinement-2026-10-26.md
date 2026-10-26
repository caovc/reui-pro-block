# Shared Tabs overflow and keyboard visibility

This batch corrects the Templates category scrollbar reported in the user screenshot and checks two existing consumers: AppShell11 Workbench and Grouping3. It extends the installed free ReUI Tabs implementation. Native Radix selection, Arrow/Home/End behavior, disabled states and consumer callbacks remain in use. No independent tab system or hidden-scrollbar replacement was introduced.

## Three observed differences

1. Filled category tabs had an invisible line pseudo-element extending the scroll area. The gallery measured 32px client height against 33px scroll height, producing a vertical scrollbar. The line decoration now exists only for the line variant. The gallery reserves 4px above and below for the existing focus ring without changing its text position or row footprint.
2. The shared horizontal height selector overrode consumers' height utilities. Workbench's 44px bar also forced a 40px child into its smaller content area, while its underline extended below the viewport. The shared default can now be overridden normally; Workbench uses the free trigger's calculated height and places its underline inside its bar.
3. Native focus could select a horizontally clipped tab. The shared trigger now reveals the focused tab inside its nearest actual horizontal scrollport, accounting for its scroll margin. It does not scroll the page vertically. The consumer callback runs first and can prevent the reveal. The existing global keyboard fallback is in the base CSS layer, allowing component focus utilities to apply; native unclassed buttons retain the original 2px outline and 3px offset.

Image review after the first green run caught a remaining Grouping3 focus-ring crop. Its 40px trigger fills its 40px scrollport vertically. A single consumer class change now places its existing focus ring and outline inside the button. The native scroll container, trigger height, text position, border and underline are unchanged. The shared primitive does not force this treatment on other consumers.

## Verification and evidence

The isolated candidate is `/var/folders/cq/bm871j297l9bf55pb_q1vysm0000gn/T/bricklane-tabs-ready-9ddjgju9`, based on `5c6df66d78f54bff481816f578b856bcb3b243ac`. Its exact Grouping1–3 fixture was subsequently published as `828ea14ab783640c1c25c257af8f64013ea2a862`; the fixture files and source hooks were compared with that publication and are excluded from this batch's payload. No whole working-tree build or formatting was used.

- The authorized cold TypeScript project build and Vite build passed. The final Workbench class-only correction then passed a separately authorized Vite build. The later Grouping3 class-only correction uses another authorized Vite build. A second cold build was not run.
- The first production distribution passed 6/6 focused cases, 31/31 Templates and docs-preview cases, and 2/2 cohort cases, with one browser worker and normal timeouts. The stronger Grouping3 ring regression was added after image review; final V2 validation is recorded in its independent freeze manifest.
- Final V2 passed the same 39 cases on the final Vite distribution: 37/37 focused, Templates and docs-preview checks in 59.3s, then 2/2 cohort checks in 2.0s. The stronger regression first failed on V1 with `insetRing: false` and `outlineOffset: 0px`, using the normal assertion timeout. No timeout, retry or existing behavioral assertion was weakened.
- Desktop and 390px gallery containers measure 40/40px client/scroll height. Desktop has no horizontal overflow; the phone retains real horizontal touch scrolling. Text Y remains 342.09375px on desktop and 331.0625px on phone, matching the measured original layout.
- Workbench measures 43/43px client/scroll height inside its 44px bar, with a 36px trigger. Its full 3px keyboard focus ring fits on desktop and phone. The phone retains genuine horizontal overflow and reveals the last focused tab.
- Grouping3 retains its 40/40px container, active state, actual horizontal scrolling and stable page Y after keyboard navigation. Its stronger regression checks the fully visible 3px inset ring, the 1px outline at -1px offset, both vertical edges, unchanged trigger Y and the original horizontal focus margin.
- Inspected final V2 screenshots and measurements at 1440px and 390px confirm loaded Inter at 14px/20px, text top 158px and 230px respectively, unchanged before/after focus; the underline remains at bottom 0px. Phone content remains 325px inside a 294px scrollport, with native scrollLeft 19px after End, and page Y stays 0. These are geometry and focus checks, not a claim of complete public reference fidelity.
- Copy, single-file download and actual starter ZIP contain the exact current `src/components/ui/tabs.tsx` bytes. The real code viewport still scrolls vertically.
- Original failing runs remain in `/tmp/bricklane-tabs-before`, `/tmp/bricklane-tabs-after` and `/tmp/bricklane-tabs-grouping-before`; final logs use `/tmp/bricklane-tabs-final.log`, `/tmp/bricklane-tabs-compatibility.log` and `/tmp/bricklane-tabs-cohorts.log`.
- V2 evidence adds `/tmp/bricklane-tabs-v2-before.log` and its original failure trace, `/tmp/bricklane-tabs-v2-vite.log`, `/tmp/bricklane-tabs-v2-final.log`, `/tmp/bricklane-tabs-v2-cohorts.log`, plus `final-v2-measurements.json` and desktop/phone `final-v2-grouping-*.png` in the audit directory.
- Measurements, callback-contract evidence, fixture comparisons and inspected screenshots are in `/tmp/bricklane-tabs-audit`. Browser measurements use DPR1, loaded fonts and the default light theme. The gallery screenshot is evidence of tab geometry; its thumbnail loading state is not a visual-fidelity claim.

## Visual scope and freeze history

The original six-file freeze and its measurements remain intact in `/tmp/bricklane-tabs-overflow-manifest.json` and `/tmp/bricklane-tabs-overflow-freeze`. It truthfully documented the Grouping3 vertical crop. V2 adds only that consumer's focus classes and strengthens the existing regression; it has its own seven-file manifest and payload. The original screenshots and first green checks are retained as earlier evidence rather than relabeled as final V2 evidence. Public reference matching beyond the three measured entries, vertical Tabs and unrelated portal typography are outside this batch.

## Publication

The release owner coordinates the exact frozen files and serial Git writes. Local validation, commit, push, full CI and Pages deployment are separate states. This audit records local production validation and does not assert deployment success.
