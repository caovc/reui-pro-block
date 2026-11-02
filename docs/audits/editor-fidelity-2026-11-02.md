# Rich text fidelity review — 2026-11-02

Reviewed the five public Base UI previews, their public descriptions and the installed implementation at `3294dc9c9a82c9250493333ad7b0632bd02b09c8`. The implementation continues to use Tiptap's native document model. Passing engine tests alone does not establish visual or interaction fidelity.

## Public references and observed gaps

| Block         | Public reference                                | Observed differences before this change                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document      | https://reui.io/preview/base/rich-text-editor-1 | Bounded Frame, internal page scrolling, compact header, 16px body text, grouped toolbar, inline code, divider, alignment menu, five highlight presets and removal, single-address link popover, existing-link bubble, edit/view modes, clear document, live word/character/read-time footer and shortcut popover. The previous implementation added a second card, Save/Export actions and a selection-formatting/drag UI. |
| Wiki          | https://reui.io/preview/base/rich-text-editor-2 | Fluid page, header history, slash/mention commands, live Contents, table controls and an expandable outline rail. Existing implementation already has the engine and much of this layout; further comparison remains needed for block and table menus.                                                                                                                                                                     |
| Contract      | https://reui.io/preview/base/rich-text-editor-3 | Reduced formatting toolbar, a mode selector, previous/next suggestion, three markup views, a Suggestions margin and narrow-screen dialog. Existing implementation has two native revision pairs but lacks most of this review workflow.                                                                                                                                                                                    |
| Collaboration | https://reui.io/preview/base/rich-text-editor-4 | Compact presence controls, follow controls, online switch, anchored threaded comments, replies, and offline merge. Existing implementation is explicitly a session-only demo; it does not implement the Yjs collaboration workflow.                                                                                                                                                                                        |
| Assistant     | https://reui.io/preview/base/rich-text-editor-5 | Full formatting toolbar, Contents, Ask Assist, markup view, inline proposed changes, streamed trace, previous/next edit, and a bottom review dock. Existing implementation instead has a permanent side panel and appends a generated passage.                                                                                                                                                                             |

Public preview state can persist between visits. The observed Contract markup selection and Assistant pending suggestions are observations, not claims about pristine defaults. No paid source or media was extracted or redistributed.

## First implementation milestone

- Use the actual installed free ReUI `Frame`, `FrameHeader`, `FramePanel` and `FrameFooter` for Document, with internal scrolling and responsive page spacing.
- Replace the generic Document actions with edit/view, copy HTML/text and native clear. Clearing remains in Tiptap history, so Undo restores the document.
- Add a shared formatting toolbar for non-compact Document/Contract/Collaboration/Assistant. Native transactions drive active marks, block type, alignment, history availability and link state. Commands toggle existing schema nodes rather than inserting sample text.
- Compose the actual ReUI `ColorPickerContent` and `ColorPickerSwatches` into the observed five-color highlight palette. Existing keyboard listbox behavior is retained.
- Apply/update/remove links through native marks, retaining selected text and formatting. Existing links expose a native-positioned link bubble in Document. Document no longer uses Wiki's drag handle or text-selection toolbar.
- Use the installed registry Checkbox inside a Tiptap TaskItem React NodeView. Tiptap retains nesting, keyboard behavior, document transactions, history and HTML serialization. The view updates read-only state through the editor's public update subscription.
- Count text from `editor.getText`, including the read time, and provide the shortcut popover.
- Keep Mesh's `compact` path and Wiki toolbar policy intact. Add the new source modules to source-target choices while preserving `editor.tsx` as the default implementation.

## Free component review and custom integration

The official free GitHub tree at `067aa0dc7f8bbfec1cd76fc5ad31f842be5f569a` was checked for rich-text/editor modules; it does not contain a free complete rich-text engine or the five Pro Blocks. Free `c-button-group-12` was inspected for the four alignment controls. The live Pro reference uses a dropdown menu, so the implementation uses the existing menu primitives for that interaction. This is not claimed as a copied complete free editor.

Actual in-house free ReUI reuse: Frame and ColorPicker in this milestone, with the existing Scrollspy still used by Wiki. Shared registry ButtonGroup, Checkbox, DropdownMenu, Popover and Tooltip compose the controls. Native Tiptap bindings, link presentation and TaskItem NodeView are the custom glue needed because the free library does not provide this document integration. Existing MIT/OFL notices and original Bricklane sample content remain in place. No ReUI avatars, logos or screenshots are shipped.

## V2 review corrections

The frozen first candidate removed the Contract mode toggle when swapping toolbars. V2 restores the existing Editing/Suggesting and Ask assistant controls through a toolbar slot, with native input and generation regression cases. This preserves the current capability while the advanced workflow is still pending.

A further live check at 1440×900 and 390×900 confirmed Document uses 16px outer spacing at both widths. The toolbar remains one horizontal scroll row; mobile shows a compact block-type control, hides character count and hides the shortcut label. Desktop page content uses a 768px wrapper with 40px/32px padding; mobile uses 24px/16px padding. H1 is 24px/36px, H2 is 20px/32px, paragraphs have 12px top spacing, and adjacent list items have 4px spacing. V2 uses these observed rules rather than the initial wrapping toolbar and 8px mobile frame margin.

## Verification and remaining work

At handoff, scoped oxfmt and oxlint were run on the private candidate. Production build, native interaction tests, visual comparison and downloaded starter validation are pending the release coordinator's serial queue. No runtime pass or deployment is claimed in this document.

Required acceptance: original editor-engine, editor-table-selection and Mesh engine cases; the new seven editor-fidelity cases; desktop and phone visual comparison; source chooser/copy/single-file consistency; clean downloaded Document and Mesh starter builds and native interactions. Preserve the original test timeout/retry settings and business assertions.

The remaining advanced Contract, Collaboration and Assistant gaps in the table are not closed by this foundation milestone. In particular, a presence row is not a collaboration engine, and a generated paragraph is not a native tracked-edit review workflow.

## Release coordinator acceptance

The handoff status above is historical. The later V5 foundation passed fresh combined strict build, three necessary source cases, two original downloaded-project strict builds, Document5 and Mesh13 native cases, and one separate real-font case. The first actual Document4-pass/1-fail result is retained; native history boundaries corrected that failure without changing received files or the original five assertions. See [the dated acceptance record](../editor-foundation-release-2026-11-02.json) for exact hashes, earlier failures, remaining scope and deployment gates.
