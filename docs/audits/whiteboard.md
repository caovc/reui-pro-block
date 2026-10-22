# Whiteboard visual and interaction audit

Inspected on 2026-10-22, using the public live previews in the browser. No paid source was retrieved.

| Entry | Public reference | Observed composition and implemented detail | Verification | Remaining differences |
| --- | --- | --- | --- | --- |
| whiteboard-1 | [Design Review Board](https://reui.io/preview/base/whiteboard-1) | Checkout Review header; five frames: Goals, User Flow, Checkout v2, Open Questions, Decisions. Three goal notes, cart/shipping/saved-card branch/review/done diagram, compact checkout phone sketch with annotation cards, four question cards, three green decisions. Open Frames/Library/History panel, board search, whole-board overview, frame navigation, zoom/grid/snap/view-only, shape tools, JSON file import/export, SVG/PNG export. | Desktop browser comparison at 1280×720; production regression for drawing, undo/redo, SVG download. | Native SVG drawing has smooth vector edges and the open Kalam font rather than the reference drawing engine's exact strokes/font. Presence uses initials and local demo state. Whole-board item counts reflect independently composed SVG objects. Advanced multi-selection, object snapping, collaborative sessions and exact reference drawing-engine features are not reproduced. |
| whiteboard-2 | [Sprint Planning Board](https://reui.io/preview/base/whiteboard-2) | Sprint 42 Planning and Sep 28–Oct 9 header; Sprint Goal and Risks above Express Pay, Receipts, Offline Research and Parked frames. Public sample card titles, points and owner initials. Plan/Log sidebar; 26 of 31 committed points and 11 parked initially; lane totals recompute as cards move. Card creation/search, estimation with seeded ballots, linked decision entries with completion/removal, follow-view demo, frame-by-frame present mode and Markdown plan copy. | Desktop public/local browser comparison. Regression changes 5→8 points, drags the card to Parked, checks committed/parked totals, logs the selected card, marks its decision done, adds a receipt card and navigates presentation frames. | Owner portraits are represented by initials. Presence, follow and voting are local demonstrations. Exact freehand editing and reference drawing-engine behavior remain as above. |

Production validation of this batch was performed in an isolated copy of the published baseline plus the whiteboard files, so other concurrently edited families could not affect the result: TypeScript/build succeeded, targeted lint passed, and **101 tests passed**, including all 662 route smoke checks, the planning interaction test and both mobile panning/readability cases. This proves route and tested behavior, not full catalog fidelity. Both entries were also rendered at 1280px and 390px without document overflow or runtime errors. On phones, the canvas preserves readable note sizes and supports panning instead of shrinking the whole scene.

The full catalog audit remains in progress. These two entries have been directly compared; remaining differences above must not be silently relabeled as exact fidelity.

## Saved local production screenshots

| Entry | Desktop | Phone (panel closed) |
| --- | --- | --- |
| Design review | [1280px](screenshots/whiteboard-1-1280.png) | [390px](screenshots/whiteboard-1-390.png) |
| Sprint planning | [1280px](screenshots/whiteboard-2-1280.png) | [390px](screenshots/whiteboard-2-390.png) |
