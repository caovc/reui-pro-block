# Navbar6 whole free Dashboard Actions migration

This closes the concrete free-source reuse gap found during the Navbar7–9 audit. Public original rendered visual comparison remains pending. Root explicitly authorized only the existing analytics consumer, a new free52 adapter and independent test/ledger/manifest after the preceding batch was frozen. Navbar1–5/7–9, other toolbars source, shared UI, router/source-targets and packages are unchanged.

## Source audit and actual correction

The full official ButtonGroup index identified [c-button-group-52 Dashboard Actions](https://reui.io/components/button-group/c-button-group-52): one complete joined Refresh, Share and More strip, with Edit dashboard, Export CSV and Export PNG. Its actual source was read using `npx shadcn@latest view @reui/c-button-group-52` before editing the latest current analytics source and helpers. The existing implementation genuinely used free13 for its export menu, but manually composed the surrounding Refresh/Share controls even though this matching complete free52 capability was available.

New `free/dashboard-actions.tsx` retains the **whole actual upstream free52** ButtonGroup/ButtonGroupSeparator/Button and DropdownMenu/Group/Item/Separator tree, original button variants/sizes, native grouped borders, menu width/alignment/offset and icon mapping. MIT/source URL/original SHA remain in the source header. IconPlaceholder is mechanically resolved to Lucide. Existing callbacks are lifted through props; the real refresh state disables its button and animates the real icon. Existing accessible labels are retained, and the previously working Embed action is added as a native menu item after a separator.

`analytics.tsx` now consumes this full implementation. Separate Share/free13 menu and lower-row manual Refresh elements are removed from the consumer; Refresh joins the actual free52 upper-row strip. Auto refresh remains on the lower row. Old free13 adapter source is left untouched as required by the frozen scope, but it is no longer imported by this consumer. This is actual source/behavior reuse, not an import/name-only claim.

State and handler declarations from the component start through its JSX return are **byte-for-byte unchanged** from archive base `671e3967513921f3496d28984114e3dcef01f28e`: prefix SHA256 `5fae1f60fe11caa037e1675e005892764b191c7c33120c94582bebbfe62fc0b2`. Date, Compare, refresh counter, manual timer, auto-refresh interval, query selection, real CSV/PNG, share/embed URL, edit notice and cleanup callbacks are preserved. Only imports and action-control JSX change. Existing real free Calendar24/Toggle1/Select5/Command5/REUI primitives are retained.

## Source and verification

Default source stays the actual `toolbars/analytics.tsx` leaf. Its new adapter is a static import, so the existing source walker includes the actual free52 source and native ButtonGroup dependency automatically. No router/source-target hook changes are needed.

- Isolated candidate `/var/folders/cq/bm871j297l9bf55pb_q1vysm0000gn/T/reui-navbar6-actions-production-1jhpgi77`: strict TypeScript + production build PASS.
- New5 focused cases plus unchanged17 Navbar4–6 regressions: **22/22 production PASS23.5s**,1worker, standard30s case limit, no timeout/retry modifications.
- Actual native joined group at1440/390, unique grouped Refresh/Share/More controls and separator, refresh disabled/rerendered counter, keyboard menu focus/CSV activation, date22+Compare true in actual CSV, clipboard share, edit, actual PNG signature, retained Embed, default source/copy/single-file/full ZIP exact bytes all verified.
- Four local screenshots at `/tmp/reui-navbar6-actions-audit`; inspected upper-row grouped controls at1440 and open menu at390. Local scenes have no horizontal overflow. These are not original comparisons.
- Actual UI-downloaded `navbar-6-source.zip`: **336 files,3,576,531 bytes**. Extracted `/tmp/reui-navbar6-actions-realzip-JhCu5K`; independent build PASS. Actual standalone1440/390 grouped refresh showed computed icon animation `spin`, incremented its real local count, and retained Calendar22 + Compare CSV state. Zero page errors/horizontal overflow. Exact logs/SHA in manifest.
- Scoped oxfmt/oxlint passed. All pre-existing frozen Navbar7–9 payload bytes are rechecked unchanged at freeze. Root coordinates serial Git/CI/Pages; no child Git writes.

## Remaining differences

The available whole free52 capability is now actually reused. This does not complete the missing original Navbar6 desktop/mobile/open-state visual audit: exact original geometry, placement, typography and copy remain unverified. The complete strip moves manual Refresh into the upper grouped row; that placement follows this free source and requires later original comparison. Existing original demo artwork, local sample data/refreshes and original generated PNG export remain. No remote dashboard request, screenshot export or access permission change is claimed. The retained Embed row is an intentional extension beyond free52's three menu actions. Other frozen source is unchanged.
