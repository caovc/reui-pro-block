# Flow 1–2 fidelity review, round 2

Reviewed on 2026-10-26 against the public rendered previews at
[Flow 1](https://reui.io/preview/base/flow-1?embed=1) and
[Flow 2](https://reui.io/preview/base/flow-2?embed=1), using fresh pages at
1440 × 900 and 390 × 900. This is an independent implementation with original
Bricklane branding and local generated avatars. Public reference captures remain
outside the repository and are not distributed in the product or starter.

## Findings and corrections

| Reference evidence                                                                                                                                                                  | Previous mismatch                                                                                                                  | Correction                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Flow 1 nodes use a bordered surface, footer, icon tile and status badge.                                                                                                            | Frame and IconTile were imported, but legacy CSS erased their surfaces and rebuilt approximations. Status chips were custom spans. | A Flow-only leaf now actually consumes free ReUI Frame, FramePanel, FrameHeader, FrameFooter, IconTile and Badge. Documented spacing variables configure the real components; native borders, radius, background and shadow survive.                                           |
| Flow 1 nodes measure 240 × 83; Flow 2 nodes measure 256 × 79. Flow 2 footer text is 12/16 with 14px status icons and 4px separators.                                                | Approximate footer composition and spacing.                                                                                        | Corrected leaf dimensions, type, footer background, separators and native 6px graph ports.                                                                                                                                                                                     |
| Flow 1 workflow menu contains Canvas, Snap to grid, Reset layout, wf_8k2m4p, Select all steps and Copy as JSON. Node context menu contains Add step after, View details, Edit step. | Generic export/fit/duplicate/delete actions differed.                                                                              | Restored the observed menus and functioning selection/clipboard actions.                                                                                                                                                                                                       |
| Flow 2 Run test produces an immediate failed fixture result and stays enabled; no timed Pause/Resume workflow appears.                                                              | An invented timed run ended with Test complete.                                                                                    | Removed that simulation for Flow 2. The fixture reports 4 passed, 1 failed, 4 skipped, 0 unconnected, retaining the bounced email and skipped branches. Flow 3's separate runner remains unchanged in this batch.                                                              |
| Changing the model clears all last-run results. Toast Undo restores the previous model and its complete last run. Opus and Haiku have distinct token/cost values.                   | Model changes left stale results and reused the Sonnet metrics.                                                                    | Added model-dependent fixture metrics, cleared-state rendering and a full toast Undo snapshot.                                                                                                                                                                                 |
| Saving a Flow 2 step clears all results and leaves readonly details open; saving Flow 1 preserves run metadata. Cancel closes the entire inspector on desktop and phone.            | Cancel returned to details on desktop; results were not cleared on Flow 2 save.                                                    | Corrected save/cancel and toast Undo behavior, retaining the native desktop panel/mobile Sheet.                                                                                                                                                                                |
| Agent actions: Clear results, Restore sample, Copy as JSON. Restore sample resets model/graph/viewport while keeping an open readonly inspector.                                    | Generic canvas/run actions differed.                                                                                               | Implemented the observed actions and sample viewport. Tidy also restores the sample's 100% viewport.                                                                                                                                                                           |
| Add branch creates a New step with New path immediately. Cancel leaves it in the graph. Only labeled incoming paths expose a Path field.                                            | No matching conditional Path editor.                                                                                               | Added branch metadata, conditional Path editing and edge-label saving.                                                                                                                                                                                                         |
| The trigger ignores Delete. Other agent steps show a Delete Step? AlertDialog with the number of connections and a destructive action button.                                       | Generic Dialog confirmation, unguarded keyboard deletion and a default confirmation action.                                        | Corrected menu availability, guarded the trigger Delete/Backspace shortcut and consumed AlertDialogAction destructive variant. Real selected-trigger Delete, confirmation styling and cancellation are verified; final deletion notification wording is not claimed identical. |

## Free ReUI reuse and custom boundary

The new node leaf uses the repository's official MIT ReUI implementations of
Frame, FramePanel, FrameHeader, FrameFooter, IconTile and Badge, including their
actual styles. This corrects the earlier nominal reuse hidden by legacy CSS.
Existing native ButtonGroup, menus, Sheet, Select, Tooltip and AlertDialog
dependencies remain in use. The `ui/` import directory alone is not evidence of a
duplicate implementation: these primitives are part of the free dependency
boundary already used by ReUI.

ReactFlow continues to own panning, zooming, selection, dragging, ports and edges.
Custom code is limited to independently authored graph fixtures, local state and
run outcomes, original brand/avatar artwork, graph-specific layout and wiring.
There is no free ReUI component providing this complete application graph.
Existing MIT/OFL and material attribution files are retained.

## Source and release boundary

Owned files are `flow-gantt-flow.tsx`, the new `flow-fidelity-node.tsx` and CSS,
`flow-fidelity-round2.css`, the new `flow-fidelity-round2.spec.ts`, this report,
and one narrowly updated Flow 2 assertion in `flow-gantt-refinement.spec.ts`.
No Gantt/Timeline, workflows, shared stylesheet or source-target mapping is edited.
The existing Flow implementation target already points to `flow-gantt-flow.tsx`;
recursive source traversal follows its new relative TSX/CSS imports.

With the publisher's explicit coordination, the old Flow 2 expectation in
`tests/flow-gantt-refinement.spec.ts` is updated from `Test complete` to the
observed `Test failed` and the exact fixture count. Diff inspection against
`368dd9f` confirms that the Gantt/Timeline cases and their existing native modal
exit/drag synchronization checks are unchanged.

## Validation and limits

Browser plugin not available; regular installed Playwright was used without
adding dependencies. A clean candidate was assembled from Git baseline
`0fc5cb2849012ce9062e98023fc3fb0d0a20004a` plus only the owned source files,
excluding other chats' working changes. Strict TypeScript and Vite production
build passed. The focused suite has 16 cases covering component surfaces,
desktop/mobile sizing, immediate run results, model changes/Undo, menus,
save/cancel, branch Path, viewport restore, clipboard and deletion cancellation.

Reference evidence: `/tmp/flow-r2-reference-20261026/README.md` and
`/tmp/flow-r2-last-reference.json`. Development QA evidence:
`/tmp/flow-r2-local-qa.json`, `/tmp/flow-r2-final-tests.log`. Production preview at
port 5322 passed all 16 cases in 12.7 seconds
(`/tmp/flow-r2-static-tests.log`). All four fresh default-view checks had meaningful
content, the intended URL/title, no framework overlay, no horizontal overflow and
no page errors or console warnings/errors.

The final production build at port 5324 passed all 35 cases (the focused 16 plus
all 19 existing Flow/Gantt regressions) in 21.8 seconds:
`/tmp/flow-r2-final-production-v2-tests.log`. Final representative viewport checks
are in `/tmp/flow-r2-final-local-qa.json`. The first final-candidate test attempt
started before its production build finished, so its early pages lacked the
compiled app; that orchestration error was corrected before the full rerun.
A newly added style check also initially used an upstream-only class name and
was corrected to the installed component's public `data-variant` attribute.
No product code or timeout was weakened to pass these checks.

The actual Code tab's Download starter and Download source file controls were
used. The default source was `flow-gantt-flow.tsx`; its single-file download and
the ZIP copy match the implementation byte-for-byte. The ZIP also contains both
new node files, integration CSS, generated demo artwork, the free ReUI MIT
notice, repository license, third-party notices and Inter OFL notice. Extracted
starter strict TypeScript/Vite build passed. Its production preview at port 5323
rendered all nine nodes and the correct failed-test result at both 1440 and 390,
without console errors, warnings, overflow or overlays. Evidence:
`/tmp/flow-r2-starter-inventory.json`, `/tmp/flow-r2-starter-build.log` and
`/tmp/flow-r2-starter-qa.json`. After the keyboard/confirmation corrections, the
actual UI download/clipboard loop and extracted starter build were repeated
from the final production candidate. All source copies and required notices
still match; final evidence is under `/tmp/flow-r2-final-source-roundtrip.log`,
`/tmp/flow-r2-final-starter-inventory.json`,
`/tmp/flow-r2-final-starter-build.log` and
`/tmp/flow-r2-final-starter-qa.json`. The final starter runs at port 5325 and
verified the trigger keyboard guard at both widths as well. The initial port
5323 artifacts and six-file freeze remain preserved separately.

Known limits: original replacement avatars/glyphs intentionally differ from paid
artwork. The initial Flow 1 fit differs by approximately half a screen pixel on
desktop and 0.002 of zoom on phone. JSON uses the independently authored graph
schema; byte-identical official exports are not claimed. Toast Undo is verified;
complete keyboard-history restoration of model/run metadata, custom rearranged
graph layout, final deletion toast, Flow 3–4, and browsers other than Chromium
remain outside this first batch. This review does not claim pixel identity or
completion of all four Flow blocks.
