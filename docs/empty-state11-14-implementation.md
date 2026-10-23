# Empty State 11–14: workspace setup milestone

This independent batch completes the four remaining Empty entries in `empty-variants/workspace-setup/`. It leaves the frozen Empty1–10 and Card portrait migration bytes unchanged. Root coordinates the small application dispatcher and default-source mappings; this batch does not edit the working shared dispatcher, source exporter, package files, global styles, shared free components or branding assets.

## Public reference audit

Each standalone public Radix preview was inspected individually, including the export menu selections and the keyboard-focused Organizations tooltip. The public per-entry Markdown briefs were also read. No Pro source registry or paid media was requested.

| ID  | Reference                                      | Observed public topology and state                                                                                                                                                                                                                                                                                                             | Implemented behavior                                                                                                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | <https://reui.io/preview/radix/empty-state-11> | Routing Signals header, helper and Add signal outside a muted bordered Card with a330px content minimum. Centered routing IconStack, title and description; no button inside the Empty panel. Original Add signal has no handler.                                                                                                              | Preserves initial composition, text and separate header action. Form creates a named local rule with its chosen trigger and destination. Actual Switch pauses/resumes that rule; reset restores the initial Empty.                                                                                                                                  |
| 12  | <https://reui.io/preview/radix/empty-state-12> | Activity Exports heading/copy; three outline radio menus for audience, workspace and date; split Execute action with CSV bundle / PDF brief / Schedule delivery. Divider and centered archive IconStack/Empty. Original menu updates labels but actions only show a ready-to-wire toast.                                                       | Exact filter labels and options control real fixture selection. Execute displays matching records; CSV downloads the actual selected rows. Custom window embeds the actual free calendar29 picker/presets. PDF brief explicitly offers printable HTML for browser Print / Save as PDF. Delivery stores an explicitly local email/frequency draft.   |
| 13  | <https://reui.io/preview/radix/empty-state-13> | File Sources heading/helper and Connector guide, divider, enlarged folder IconStack, centered copy. Four Frame connector tiles: Dropbox, Cloudflare R2, Google Drive and Microsoft OneDrive. Grid follows container width with1/2/4 columns. Original provider links only navigate to hash.                                                    | Uses the actual Frame/FramePanel source and the observed container-responsive topology. Each provider retains a separate named local sample folder; updates and disconnects are real local transitions. The guide explains the absence of OAuth. Original typographic demo marks replace original-site vendor SVG assets under the branding policy. |
| 14  | <https://reui.io/preview/radix/empty-state-14> | Top-aligned Organizations heading, separator and wide Frame. Inside: building IconStack, Enable organizations title/copy/button. Footer help has Info icon and an actual keyboard-accessible tooltip: “Organizations group users, teams, roles, and permissions under one account boundary.” Original Enable is inert and help is a hash link. | Preserves the top alignment, actual FramePanel/FrameFooter, initial text and exact tooltip. Local form creates the entered name/ID and a role matrix; actual checkboxes update local permissions while Owner controls stay fixed. Disable restores Empty; help opens a clearly local explanation.                                                   |

## Actual free-source reuse

All20 official free Empty examples were audited before these batches. Free `c-empty-1/4/8` consume the upstream Empty/Header/Media/Title/Description/Content implementation; REUI's Empty installation points to that upstream component. These entries consume the installed `src/components/ui/empty.tsx` with the same slots rather than redrawing an Empty primitive. Free Card+Empty and action-slot arrangements supply the presentation foundation.

Every entry consumes the complete existing official `src/components/reui/icon-stack.tsx` implementation. It supplies its original layered SVG geometry, strokes, shadow and transformed content overlay. Only the route/archive/folder/building Lucide child changes; no custom replacement illustration is drawn.

Storage and Organizations consume actual official `Frame`, `FramePanel` and `FrameFooter`. The official free `c-frame-1` example was inspected to confirm how those real components compose their panels and footer. Existing actual REUI Badge and Alert source renders local status/feedback. Upstream Button, ButtonGroup, Card, Dialog, DropdownMenu, Checkbox, Switch, Select, Input, Table, Tooltip and Separator are composed where the audited free REUI examples use those primitives.

For the new export date-range capability, the registry CLI returned actual official free `@reui/c-calendar-29` source and `@reui/c-frame-1`. The entire calendar29 preset/calendar composition is reused in owned `free/range-picker.tsx`, preserving Today, Yesterday, Last7days, Last30days, MonthToDate, LastMonth, YearToDate and LastYear calculations, selected range, month navigation and future-date exclusion. Source: <https://reui.io/r/radix-nova/c-calendar-29.json>. The owned file includes provenance and MIT attribution. Required adapters are explicit: named export/initial-range/callback props; a Lucide Calendar glyph for the registry icon adapter; `asChild` for the installed Radix PopoverTrigger; available-height/collision-aware scrolling for390px; and a stable mount-time date. The picker is actual reused source with these documented adaptations, not an independently approximated preset/date implementation.

The existing `src/lib/download.ts` handles true Blob downloads. `svgImage(integrationArtwork(...))` in existing original `demo-artwork.ts` supplies storage marks; that shared source is consumed without edits. Existing MIT license remains in source exports. This batch adds no portrait, image asset, vendor SVG, logo, font, dependency or paid media.

## Confirmed gaps and deliberate differences

The20 free Empty examples and installed source contain composition/action slots, not domain workflows for routing rules, activity filtering, report generation, email scheduling, storage authorization or organization permissions. Custom code is restricted to those local fixture transitions and layout/copy. The actual free calendar supplies all date-picking UI and presets; domain code only applies its selected dates to rows.

No external rule engine, activity API, email service, storage/OAuth integration or permission backend is connected. Local rules, folders, delivery drafts and permissions last only while the preview is mounted. The UI states these limits where a user takes the corresponding action. CSV is a real local download. PDF brief downloads correctly labelled `.html`, suitable for a browser print dialog; it does not mislabel HTML as PDF or pretend to call a generator. Delivery never sends or schedules email. Provider marks deliberately differ from the reference because original-site media cannot be redistributed; their semantic names, placement, tile count and interactions remain.

The mobile export toolbar wraps and the connector grid follows its actual container. Tables scroll within their own boundaries. Initial overlays stay closed, so gallery thumbnails show the useful original empty composition.

## Verification

- Isolated candidate base: `48495a3df9e62c21269db91605c1777241f0ce93`. Complete `npm run build` (TypeScript + Vite) passed. Candidate: `/var/folders/cq/bm871j297l9bf55pb_q1vysm0000gn/T/reui-empty11-14-candidate-iyia8set`.
- Final suite: `PREVIEW_URL=http://127.0.0.1:5204 npx playwright test tests/empty-workspace-setup.spec.ts --workers=1 --output=/tmp/reui-empty11-14-playwright-final-v2`: **12 passed,16.4s**, standard30second timeout.
- Includes8 initial1440×900/390×900 renders without document overflow or initial dialogs; exact Empty/Card/Frame topologies; real signal trigger/destination and pause/reset; selected audience/workspace filtering with actual CSV bytes; free calendar preset selection affecting results; actual printable HTML; saved local delivery draft; independent storage folders and disconnect; container-based1/2/4 connector columns; keyboard tooltip; organization name/ID and role checkboxes; four actual code defaults and complete ZIP source presence.
- Screenshot review caught a real nested calendar problem despite the first green functional suite: at390px the Popover exceeded available space and clipped the month header above the viewport. The upstream picker now uses Radix's actual available-height variable with12px collision padding, keeps the month header visible, and scrolls the preset list within that boundary. The final suite asserts both top and bottom viewport bounds, and verifies that the initial visible default range can immediately be applied.
- Nine final screenshots: `/tmp/reui-empty11-14-audit/empty-N-{1440,390}.png` plus `empty-12-custom-390.png`. Every initial screenshot was reviewed; the settled calendar screenshot verifies the clipping correction.
- Real browser-downloaded `/tmp/reui-empty11-14-audit/empty-state-14.zip`:255 files,3,514,782bytes. Extracted independently to `/var/folders/cq/bm871j297l9bf55pb_q1vysm0000gn/T/reui-empty14-realzip-9__e3eu5`; its complete `npm run build` passed. Existing installed dependencies were linked for compilation. The actual calendar29 source, IconStack, Frame, Tooltip, Calendar, original artwork helper and MIT license are present.
- The raw official calendar29 registry source audited here has SHA-256 `e75c721013557ee6daa0ed8d05ca5673c4975c699533fb429c0ceb68e7551f51`. The documented adapters above are intentional; this batch does not claim its adapted module is byte-identical to upstream.
- Scoped oxfmt format/check and Oxlint passed. Independent manifest checks confirmed all11 frozen Empty1–5 source files, all10 frozen Empty6–10 source files and all4 Card portrait-migration source files remain unchanged.

## Coordinated integration hunks

The working shared files are deliberately unchanged. Root applies only these narrow changes against their latest content:

1. `application/index.tsx`: add `import WorkspaceSetupEmptyBlock from "./empty-variants/workspace-setup";`; remove the now-unused `EmptyBlock` planning import; replace only the final Empty fallback (after `block.index < 10`) with `<WorkspaceSetupEmptyBlock block={block} />`. The earlier1–5 and6–10 branches stay intact.
2. `src/lib/source-targets.ts`: after the6–10 Empty mapping add the following four actual default source targets; all other owner mappings remain untouched.

```ts
if (block.category === "empty-state" && variant >= 11 && variant <= 14) {
  const modules = ["signals", "exports", "storage", "organizations"];
  return paths(
    "application",
    `empty-variants/workspace-setup/${modules[variant - 11]}`,
    "planning",
  );
}
```

These changes were applied privately in the isolated production candidate used above. No shared source-exporter implementation or package changes are required.

## Export integration condition

The isolated committed `48495a3` baseline still carries13 legacy Schedule/range JPEGs in the whole-Application ZIP. Those older family-wide assets are outside this Empty payload and are already assigned to the coordinated avatar cleanup. The source ZIP build proves runnable source, not media-policy clearance. Root must integrate the separately frozen original-avatar migrations and shared Schedule deletion, then repeat the combined archive media check. The Unsplash replacement portraits/editorial photos and original fleet cover retain their existing explicit attribution. This batch adds no binary media or original-site SVG and does not delete shared resources.

Root integrated verification on the current shared baseline passed22/22 browser checks alongside Sparkline11. The final actual Empty14 UI-downloaded starter contains250files and builds independently;1440/390 renders have no errors, broken images or overflow. The previous13 Schedule/range portrait filenames are absent following coordinated source migration and asset deletion.
