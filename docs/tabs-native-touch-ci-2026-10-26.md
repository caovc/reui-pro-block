# Template category Tabs native-touch CI diagnosis — 2026-10-26

Status: private test-contract hardening candidate. The CI root cause remains unconfirmed. No primitive or consumer source is changed.

## Preserved failures

- b131 run 40274377125: 1290 passed, 1 failed. `tests/tabs-overflow.spec.ts:92` observed scrollLeft 0 after CDP touch. Artifact 12630735948 is preserved under `/tmp/bricklane-tabs-touch-ci-audit/original-ci`.
- e5 run 40276229520: 1340 passed, 2 failed; Tabs has the same failure. Artifact 12630464954 and the original failure log are preserved under `/tmp/bricklane-tabs-touch-ci-audit/e5-ci`. The other Dialog failure belongs to Root.
- Both traces create a desktop context (`isMobile:false`, `hasTouch:false`), resize it to 390, complete End/Home focus and scroll-to-start, then enable touch at line 83 and invoke a touch gesture at line 84. Native keyboard input boxes match: first tab x19/y331.0625/w122/h25; last tab x289/y331.0625/w82/h25. The touch CDP command returns successfully in 725.487 ms / 830.631 ms respectively. Subsequent scroll assertions remain 0.
- Screenshots during both gestures retain the same apparent tab-row geometry and first-tab position. They show no overlay or document shift. The original traces do NOT contain the CDP command arguments, boundingBox return, or touchstart/touchmove event records. An exact original hit target, lost-input explanation, focus race, or compositor bug cannot be certified from them.

## Actual implementation review

CodeGraph was used first for shared `src/components/ui/tabs.tsx`, `revealFocusedTab`, and `TemplateGallery`. The real existing REUI/shadcn native Tabs composition is retained. The gallery scrollport has overflow-x:auto, overflow-y:hidden; no custom touch engine is introduced. The primitive has no touch handler. Its focus handler schedules a guarded requestAnimationFrame and reveals the active trigger inside the closest real horizontal scrollport. Shared Tabs remains owned by the Source coordinator.

The stable 59300 production dist has byte-identical Tabs, gallery, gallery CSS and original test sources to BOTH b131 and e5. No build or Vite process was started for this diagnosis.

## Native input evidence

One instrumented baseline using the ORIGINAL mid-test emulation flow delivered trusted touchstart/touchmove/pointercancel/scroll events. Its gesture began at (359,343.5625), hit Dashboard, and scrolled 0→136. The viewport was x16/y323.5625/w358/h40, scrollWidth494, overflow-x:auto / y:hidden, touch-action:auto, fonts loaded. This PASS does not erase either CI failure or prove the initialization change fixes their cause.

The private candidate creates only the phone gallery test context with hasTouch:true and isMobile:true at creation. Desktop and other tests keep their original fixtures. It awaits native FontFaceSet readiness, uses an unforced Playwright trial action to check stability/hit readiness without clicking, derives fresh input coordinates, checks current containment and real overflow, and preserves the same CDP touch gesture (-200/0, speed500). It additionally requires trusted touchstart and touchmove inside the scrollport and attaches their coordinates/scrollLeft timeline even on failure. The original real scrollLeft>0, keyboard focus/selection, focus ring, overflow, real source copy/file/ZIP assertions all remain. A horizontal gesture must also leave page scrollY unchanged. Timeout30s and polling defaults are unchanged; there is no sleep, force, retry, scrollLeft assignment or fallback gesture.

A single full private production run passed 6/6 (8.7s), 1 worker, covering widths1440/1280/390. The phone case observed 1 trusted touchstart, 11 trusted touchmoves and scrollLeft0→136. This is evidence that the candidate enforces a valid native input contract locally, not a proven root-cause fix or a deployment result.

A separate controlled late-font probe held actual woff2 requests behind a promise barrier. Before releasing them, document.fonts.status was loading and scrollWidth477. The actual FontFaceSet promise then resolved loaded, width494; the same current-point trusted CDP touch scrolled0→136 without moving the document. No arbitrary delay was used. This proves the native readiness boundary can cover a real late layout resource. It does not reproduce the CI failure or establish fonts as its cause.

## Gates and limits

- Scoped oxfmt and oxlint pass for the private test.
- No new strict build, Vite, shared output, UI source, route, source-targets, dependency, working-tree source or Git writes.
- The suite retained actual source copy/file/starter ZIP byte checks; no new downloaded starter cold build was requested.
- This patch is a bounded test-contract/observability proposal. The next CI run of this exact patch is required to assess CI behavior; if it fails, the new trusted-input evidence should distinguish delivery, cancellation and scrolling rather than hiding the failure.
- Existing free REUI implementation, original Bricklane assets, license attribution and source collector are untouched. This test-only task makes no new visual-fidelity claim.
