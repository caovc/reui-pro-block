# Dialog9 official Portal containment correction

This narrow batch changes only `workspace/project.tsx` and the four existing free status/priority/members/labels adapters, plus its independent test/ledger/manifest. Final11/12/13/14/16, shared UI, routing, source mappings and package files are untouched.

## Prior behavior and actual official reuse

The published project form used Radix Dialog `modal={false}` following the official free REUI Combobox-in-Dialog17 example. That made BaseUI popups clickable, but omitted normal modal background protection. The earlier final12 batch added and verified a typed optional Portal destination in the official upstream Combobox wrapper.

Before this change, the current five sources, frozen final12 consumer and actual installed `@base-ui/react/combobox/portal/ComboboxPortal.d.ts` were read. The [official Base UI Combobox Portal API](https://base-ui.com/react/components/combobox#portal) confirms `container` accepts an HTMLElement, ShadowRoot or React RefObject and defaults to body placement. This batch consumes that existing real API; it does not introduce a manual menu, overlay or focus trap.

Existing actual official REUI free sources remain the source of behavior:

- Status: c-combobox21, original glyphs, filtering and options.
- Priority: c-combobox22, original free bar geometry and options.
- Members: c-combobox24, original actual multiple-selection/AvatarGroup/clear mechanics, observed eight-member fixtures with locally generated original demo avatars.
- Labels: c-combobox26, original summary/dots/multiple/no-label mechanics.
- Cover: unchanged c-file-upload10, actual official useFileUpload validation, drag/drop and real File callback.
- Modal: unchanged c-dialog3/c-dialog6 DialogSurface composition and actual upstream Radix Dialog semantics.

Each picker gains only optional `portalContainer`, typed from existing `ComboboxContent` props and forwarded to the installed component. Omitted values still use the same default body Portal. Project removes modal=false. A standard FieldGroup DOM ref resolves its nearest `data-dialog-entry=9` real DialogContent as destination. This preserves the frozen shared surface and places portals outside its scrolling body. The stable selector is local to this entry and is tested. Escape prevents the outer dialog from consuming a submenu's dismissal while the official popup handles it; the next Escape closes the project normally.

## Verification

- Independent production candidate: `/var/folders/cq/bm871j297l9bf55pb_q1vysm0000gn/T/reui-dialog9-modal-production-mdupzwca`. Production build passed. Shared Portal API dependency was copied from the exact previously frozen final payload; it is not edited or part of this batch.
- `tests/dialog-project-modal.spec.ts`6 focused tests + previous workspace15: **21/21 passed26.0s**, one worker, standard30s per case, retries unchanged.
- Enhanced final6 focused tests: **6/6 passed11.7s**, including popup bounds entirely inside the existing clipped DialogContent at1440/390. No custom overflow workaround was necessary.
- Actual overlay and body pointer protection; all four popup destination descendants; mouse open/close; keyboard Paused/Urgent selection; first Escape closes submenu and retains dialog; second closes outer; twenty Tab steps remain inside; launcher focus restoration; viewport bounds; multi-member/label clear and create gating; key normalization; real cover File; actual source ZIP assertions.
- Separate screenshots at `/tmp/reui-dialog9-modal-audit` wait for actual animations and image decoding. Both1440/390 initial modal scenes inspected locally.
- Actual downloaded project ZIP:285 files,3,508,629 bytes, old ScheduleJPEG0. Extracted `/tmp/reui-dialog9-modal-realzip-7nnthc`; independent build and actual1440/390 Completed selection/no errors/no document overflow verified. Final exact results are in manifest.
- Scoped oxfmt/oxlint clean. Working-tree full tsc initially showed an unrelated unused Box import in external `templates/workflow/lucent.tsx`; the isolated production candidate passed its own type/build checks. No external source was changed to hide that diagnostic.

## Scope and remaining differences

No new public-original browser interaction was performed because the human is actively using Edge. This is a verified functional correction of the previously audited project layout, not a claim of new pixel-perfect reference evidence. Original artwork, fake data, local-only saved drafts and the known cover-preview reset on reopening remain as previously disclosed. Dialog9 has no date field; final12 date behavior and its frozen source are unchanged. All MIT/OFL provenance and actual source leaf/default ZIP behavior remain intact. Root owns coordinated Git/publish work.
