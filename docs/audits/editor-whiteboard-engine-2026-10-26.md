# Rich text and whiteboard engine foundation

Scope: five Rich Text Editor Blocks, two Whiteboard Blocks, and the shared engine APIs that Mesh can consume. This is an independent Bricklane implementation. The Mesh Canvas/Documents page integration is a separate following milestone.

## Reference and implementation

Official interactive references:

- https://reui.io/blocks/application/rich-text-editor
- https://reui.io/blocks/application/whiteboard/whiteboard-1
- https://reui.io/blocks/application/whiteboard/whiteboard-2
- https://mesh-whiteboard.reui.io/documents
- https://mesh-whiteboard.reui.io/canvas

The free ReUI library supplies the actual ColorPicker, NumberField and Scrollspy implementations already in this repository. Those are composed with the existing shared controls. ReUI's free library does not supply the complete Pro rich text or whiteboard engines. The missing engine capabilities use MIT Tiptap and Excalidraw, with an independently authored integration and sample content.

The previous rich text implementation used contentEditable, execCommand and HTML snapshots for history. It now uses a Tiptap document schema, native transactions and history. Paragraphs, headings, marks, links, lists, nested tasks, mentions, code blocks and resizable tables are real document nodes. Slash and mention suggestions follow the caret. The block handle, selection menu, table commands, live Contents and outline follow the actual document. The contract review marks participate in native undo/redo. Export HTML uses the schema serialization instead of exporting React NodeView controls.

The previous whiteboard used an SVG renderer and handwritten drawing/history gestures. Both boards now use Excalidraw's real canvas, element model, selection, resize, rotation, drawing, connector bindings, text editing, inspector and history. Saving retains native elements, files and viewport. The native file, SVG and PNG exports use the SDK. Sprint capacity, estimates, lane moves, linked decisions, frame navigation and presentation remain connected to the scene.

The engine APIs accept independent initial content and storage namespaces so templates can reuse this implementation. The existing Mesh document integration is protected by compatibility tests. New Mesh page work remains outside this milestone.

## Measurements and visual corrections

Wiki uses the existing locally licensed Inter face and a 640px document width. Its body is 16px/28px; heading levels are 24px/36px, 20px/32px and 18px/28px. The outline is a compact right rail that expands on hover or keyboard focus. The fixed formatting toolbar is hidden for this fluid variant; selection and table menus remain contextual.

The official board file-export interaction was used to measure geometry and font metadata only. No original scene JSON, image or extracted SVG is distributed. The target note is 240 by 76 native units with 20px text; its physical width at the reference's 60% phone zoom is 144px. The previous inference of 120px from an independently authored 200-unit seed was wrong and was withdrawn. Tests retain the original greater-than-130px readability requirement and also require the exact 144px width, 12px painted text, native editing and panning.

Frame conversion initially resized authored frames to their children. The adapter now preserves the measured independent layout after the SDK conversion. Design uses Excalifont and sketch strokes; Sprint uses Nunito and clean strokes. The canvas follows the host's light/dark theme.

A first-load visual check found a real font-metric problem: conversion ran before Excalifont was ready and cached a label width of 154.951px when the actual font needed 201.559875px. Initial data now waits for the local drawing fonts before creating elements. The regression check compares every seed text element using those two drawing font families against the browser's real Canvas.measureText width, allowing less than 1px error. This catches visible clipping that an editing-only test cannot detect.

## Assets and source delivery

Excalidraw is pinned to 0.18.1. Its font files come from the installed package and are copied to public/excalidraw by postinstall. They are also copied in downloaded starter projects. MIT and OFL notices, including the Tiptap notice, are kept under src/blocks/application/assets/excalidraw; SOURCES.md records the upstream locations. The independently drawn phone illustration replaces the paid preview artwork. No ReUI/KeenThemes logo, original avatar, paid screenshot or extracted artwork is added.

The existing source-target mappings continue to point at editor.tsx and whiteboard.tsx, which are the actual component implementations. The transitive engine modules are included in the source chooser and starter closure. The release checks compare the displayed default source, clipboard and downloaded single file byte for byte. Starter projects include the engine modules, local font setup and notices. Vite's relative base supports deployment below a site subdirectory.

## Validation protocol

Preserve the original strict npm build scripts and Playwright timeouts. Use one browser worker. Run the immutable production output after the final source build, including both desktop and phone sizes. Verify native drawing and resize with undo/redo and reload; real exports and import; table commands; slash/mention/Contents; page locking; review marks; local persistence; NumberField clamps; old Mesh reuse; first-load font metrics; and schema HTML export.

Real starter ZIPs must come from the production UI, install normally with postinstall enabled, pass their strict build, and render independently. If their complete shared source and build configuration hashes are identical, the second ZIP can reuse the shared TypeScript proof only when its Example payload has the same field types. Its separate Example, Vite output, first-load font rendering and desktop/phone interactions still need verification.

Earlier evidence remains diagnostic, not a final release result. The original production run passed 19 cases and its resize test then passed after replacing an array-order assumption with an element-ID comparison. After the font correction, development passed 19/22 and production passed 20/22. Their original traces remain retained. The phone case used excessive swipes; its shorter physical swipe retains the exact 144px/greater-than-130px/readable/edit/pan assertions. Font requests correctly include two first-load HTTP 200 responses and SDK HTTP 304 revalidation; tests require those successful loads, valid status codes and the actual loaded family/weight descriptors.

The slash failure exposed a real caret synchronization issue: a DOM keyup selection mirror rerendered the host before Tiptap synchronized the native selection. Tiptap's selectionUpdate now owns selection, and its transaction event owns formatting/history toolbar state, including stored marks that change without a selection move. Outline anchors are heading schema attributes updated by a native transaction outside user history, rather than direct ProseMirror DOM mutations. Same-sequence before/after logs and a keyboard-bold toolbar regression accompany this change. No timeout was raised or content assertion weakened.

A separate controlled slow-font experiment reproduced a lost accepted edit: before font release the host counter increased from 33 to 34 items, but initialization then replaced it with the original scene. The repaired engine exposes readiness only after fonts and the real initial scene have applied. External editing controls remain disabled with a semantic loading status, native editing stays in view mode, and the imperative replaceScene method also rejects early mutations. Parent commits do not accept a rejected mutation. Deferred initialization reads the latest selected scene and storage namespace. Controlled harness cases cover selecting Board B during loading in both the same and a different namespace, early rejection, and successful persisted edits after readiness.

Focused development gates passed for those loading cases, real text metrics, the native inspector, and slash/mention/Contents. The keyboard formatting and schema-anchor follow-up passed its two targeted cases. These are local focused results; the final strict and complete production round belong in the release manifest.

## Selection follow-up evidence

The frozen e5-based production run completed with 23 passes and two failures. Its unchanged keyboard-formatting tests exposed a second synchronization gap: a fresh browser click had already placed the DOM caret at position 751 while the native editor state still held position 1. A subsequent native selection update cleared the newly toggled stored mark. Public SDK event observations preserve the failed sequence and its corrected sequence.

A stable EditorProps object now synchronizes a valid same-editor TextSelection from the DOM before native keymaps run. The handler returns false so the native command runs once. It skips composition, legacy IME events, read-only views, NodeSelection, AllSelection, CellSelection, foreign editor selections and non-editable NodeView DOM. An unmappable position is a no-op, with no guessed fallback position. Selection-only transactions stay outside user undo history.

Private development checks passed the two unchanged failed cases; real keyboard bold, italic and underline on/off with undo/redo; mouse-drag selection with contextual bold on/off; and backward keyboard selection with preserved direction. Nine controlled public-SDK guard checks preserved state and emitted no transaction. Those direct guard checks are not a claim of testing an operating system IME. Those release gates were still pending at the selection diagnosis freeze. Their subsequent results are recorded below; earlier focused successes were not substituted for them.

## Final local release validation

The clean candidate based on c0903d4d4bdfaf0a1384df64fd299b7e84f327cc passed the unchanged `npm run build` command. Its immutable production output passed all 25 selected Playwright cases in one run, with one worker, zero retries and the original 30-second case timeout. Both previously failed editor cases passed. The complete format check passed for 1,256 files. Scoped oxlint reported zero errors and two existing refs warnings in deferred initialization callbacks.

A subsequent CSS-only visual correction retained both the preset shapes entry and the SDK's separate native Library entry. The native desktop entry moves clear of the parent toolbar; the engine releases its stacking context while the native sidebar is mounted, allowing its Close button to receive real clicks. The native Library, Close and parent Add sticky note operations passed at 1440, 1024 and 390px against the new Vite production output. All TypeScript and package bytes remained identical to the strict-build candidate. The original 25-case result belongs to the preceding CSS snapshot; it was not relabeled as a second run. The SDK's aria shortcut label is not evidence that key 0 opens Library: the actual SDK maps 0 to Eraser. No keyboard behavior was remapped.

Both refreshed ZIPs came from the real production download buttons. The displayed source, copied text and downloaded single files matched the actual implementation. Each archive contains 404 members. Their 401 shared files are byte-identical; only Example, package name and README differ. Example has the same seven field types in both. All 341 source members match the actual 342-member collector closure after removing its generated entry. Asset hashes and font/license setup were also checked.

The first ZIP completed normal `npm install`, including the actual font-copy postinstall, and passed its unchanged `tsc --noEmit && vite build` script. The second uses a physical copy of that installed dependency tree after exact dependency, override, configuration and shared-source comparisons, and passed its own Vite build. It did not claim a second install or TypeScript run. Both independent outputs passed 1440 and 390px checks below separate URL subdirectories: real editor edits, undo/redo and reload; real board pan and reload; local drawing fonts with successful first requests and loaded descriptors; less-than-1px error for every fixture drawing-text width; and no external font request or page error. The original native creation, selection, resize, undo/redo and reload test also passed unchanged against the independent whiteboard starter.

The latest coordinator changes through e25a1907dc068e645f0c71ed36910dcf81a8c70c have no intersection with the application source closure. Package, collector and exporter bytes are unchanged; the application source-target choices remain the editor and whiteboard implementation modules. Commit, push and CI/Pages deployment are recorded by the release coordinator. Local validation is not a claim of successful deployment.

## Remaining scope

This milestone establishes genuine reusable engines. It does not certify complete visual or feature parity for every Pro Template. Mesh's document picker/CRUD and full Canvas page chrome remain in the following integration. Additional work includes further toolbar refinements, the independent phone drawing, the existing Fit control's reset behavior, and further advanced style/frame-preservation checks on custom sidebar mutations. Presence, comments, sharing and assistant UI use local demo state; no multiplayer service or server permission system is configured.

The initial font preload covers the two Latin drawing families used by these fixtures. Other imported font families and scripts remain managed by the SDK. A failed local font request currently reports an error and uses the existing best-effort fallback; this milestone does not claim an unconditional no-fallback guarantee or automatic retry after a rejected preload.
