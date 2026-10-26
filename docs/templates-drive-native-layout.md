# Filespace and Filebox native layout review

This milestone replaces the independent primary rail with the existing ReUI Sidebar composition. It is a layout and navigation correction; the account, workspace and billing forms still need their own reference audit and remain recorded follow-up work.

## Actual reused implementations

- `ReuiSidebar`, `SidebarProvider`, the native Header/Content/Footer/Menu slots, `SidebarRailButton`, `SidebarTrigger` and `AppShellInset` replace the hand-built application aside. Mobile application navigation uses that same Sidebar's Sheet and focus restoration.
- The separate directory drawer uses the existing free Sheet/Trigger/Header/Title/Description and the existing `DriveFolderTree`. It remains distinct from application navigation, as in the reference.
- The free ToggleGroup/ToggleGroupItem replaces the independent list/grid buttons, retaining native arrow-key focus and Space selection.
- Filebox suggested folders use free Item/Media/Content/Title/Description, replacing large hand-built vertical cards. Existing free DataGrid and file models remain in use.

No free Sidebar, Sheet, Item, ToggleGroup or DataGrid primitive was rewritten. The existing high-level SidebarNavigation is for text navigation; its permanent rail slot does not supply this icon-only application layout, so the consumer composes actual free SidebarMenu/Item/RailButton slots instead.

## Browser evidence

Reference: https://filespace-drive.reui.io/starred and https://filebox-drive.reui.io/. Filebox explicitly provides a public demo sign-in; the audit used that supplied demo entry. Browser connector was unavailable, so repository Playwright was used at DPR1, 1440×1000 and 390×844. Original reference screenshots are private audit evidence only and are not distributed with source or downloads.

Desktop native geometry matches the measured reference: primary rail63; inner47; Header52, Content888 and Footer44 at1000px height. The inset is x63/y8/1369×984, its header45px, and the directory pane256px. The primary rail is permanently compact; Ctrl+B does not change its width. The directory pane hides below1024px.

At390px, the inset is390×844 and the header45px. Application navigation opens a63px native Sheet; the toolbar directory entry opens a256px Sheet. Escape returns focus to the respective opener. After directory selection, the Sheet closes; selecting My Drive also clears a stale search and selection. This fixes the previous root-tree special case that only changed the view.

The Filespace toolbar is129px and the file viewport begins at y175 with668px height. Its records scroll internally while the toolbar and document remain stationary. The previous flex compression let the toolbar overlap the header. File type minimum width now allows search, type and the view ToggleGroup to share the measured first row.

Filebox suggested cards are260.75×58 on desktop and172×74 on390px. The mobile card section is240px, placing the file table at y415. The earlier vertical cards used392px and left substantially less room for records. My Drive no longer duplicates itself in the toolbar breadcrumb.

Private evidence: `/tmp/bricklane-templates-layout/drive-reference/`. Drawer screenshots wait for real animation completion and settled x0. Earlier transient animation captures are retained but are not used as fidelity evidence.

## Validation and remaining scope

Seven new browser cases cover both layouts, both mobile drawers, native focus, fixed compact width, bounded inset, inner file scrolling, keyboard view choice, retained selection and suggested-folder navigation. Existing three Filespace cases cover distinct folder/shared records, inherited access changes, version restore and file move metadata. The clean production candidate passed these seven cases and the three existing business cases. Scoped formatting/lint passed. Both actual UI project archives passed source view, Copy, single-file download and ZIP byte/dependency closure checks; standalone strict builds are recorded separately by the release owner.

Bricklane uses its original mark and local avatars. Original paid logos, avatars, screenshots and SVG files are not imported or distributed. A branded filename naturally sorts differently after its original replacement; the file data and ordering implementation are preserved.

Remaining differences are explicit: account/workspace/billing still use the previous generic dialog; the complete native profile menu and those Settings surfaces are not delivered in this milestone. Filebox's storage quota and some seeded folder counts, dates and file metadata differ from the reference; these models are not silently changed as part of a layout fix. Existing grid-view card styling and file-detail surfaces retain their earlier implementation. No claim is made that all Drive pages and interactions are fully reproduced.

Source-target follow-up: both `filespace` and `filebox` should retain `drive` first and include `drive-layout` as a secondary implementation. The release owner applies that narrow change while preserving concurrent source-target work. Normal import traversal must include the new CSS and free components in complete project downloads; both actual UI download checks confirm the new CSS and free component source bytes are included.
