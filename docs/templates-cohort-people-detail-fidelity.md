# Cohort People: profile and editor fidelity

Official reference: https://reui.io/templates/cohort and https://cohort-hr.reui.io/people.

This milestone separates the employee **View profile** and **Edit person** sheets. The directory's internal reporting-tree identity remains separate from the displayed external employee ID. Import is a later milestone.

## Reference and visual checks

The reference was explored after its demo login completed and the People route reached network idle. Local and reference states use Chromium, DPR 1, light appearance, 1440 × 1000 and 390 × 844 viewports. The private comparison set contains 65 earlier exploration screenshots plus this milestone's reference field/geometry captures and implementation screenshots; no reference screenshots or portraits are distributed.

Three substantive differences were corrected:

- View previously opened the editing form. It now has the reference's employee header, Reports to, Contract, Leave, Details, Internal note and Activity sections, with an independently scrolling body and fixed Timesheet/Close footer.
- View is 480 px wide and Edit is 512 px on desktop. Both are 358 px wide at 390 px, with 16 px viewport margins. The editor retains the correct photo, name, title, manager, department, location, employment and start-date fields, Reset and Save actions. Notes belong to View.
- Generic Frame/Item typography originally accumulated approximately 18 px of vertical drift. Consumer-level header, section and item line heights now match the measured reference section boundaries. The editor's mobile spacing was also measured; the complete start-date control stays reachable above its fixed footer.

The View header is 117 px high; its first five section heights are 101 / 135 / 151 / 201 / 181 px in the desktop reference state. The new sheets contain no Tabs: measured tablist count is zero. Their client and scroll widths match, with no document horizontal overflow. No shared Tabs, global focus rules or global scrollbar suppression were changed.

## Actual ReUI reuse

- Official free **Frame / FramePanel** compose the profile sections.
- Official free **c-item-4** media/content/actions composition renders the manager and leave summary, using the existing Item implementation.
- Official free **Timeline** and **IconTile** render the dated activity feed.
- Official free **c-progress-8** Progress composition renders leave usage.
- Official free **c-combobox-23** controlled trigger, search, list and empty-state composition is adapted to the current reporting tree. It uses internal IDs and original Bricklane avatars; filtering continues to exclude the person and their descendants.
- The existing official free **useFileUpload** handles image selection/type/size validation. FileReader stores a local data URL so a saved image survives navigation; generation guards prevent stale reads from replacing another employee's photo.
- Existing ReUI-backed Sheet, Input, Select, Tooltip, Textarea, Button and Badge infrastructure is retained. No parallel hand-written sheet, picker, upload hook or progress implementation was added. Start date retains the native date input observed in the reference rather than adding a different calendar flow.

The Manager popup is mounted inside its Radix Sheet via the existing Combobox `portalContainer` capability. Escape closes the popup before the editor. Decorative option avatars are hidden from accessible names so each employee is announced once.

Custom work is limited to the HR data model, per-person textual metadata, saved notes, reporting-tree eligibility, profile composition and scoped geometry. There is no free component that supplies this application data or the complete employee profile.

## Behavior and data

Saved notes are employee-specific, remain after closing and reopening, and survive Dashboard navigation and employee renaming. Save note is disabled while unchanged. Photo upload, save, removal and reset were exercised through the actual controls. Edit has a real searchable Manager field and preserves the existing cycle prevention; Reset restores saved values.

The row menu retains the reference demo's Change manager notification. The separate Edit Manager control actually changes the reporting relationship. Timesheet closes View and navigates to the existing Timesheets page rather than displaying a placeholder notification.

The 21 employee fixtures retain their own contract hours, allowance/taken/carried leave, away status, review/onboarding status and dated activities. Metadata and activity authors resolve through external employee IDs, so renaming does not silently assign another employee's data. Direct reports derive from the current local tree. Newly created employees receive a new external ID independently of their internal UUID.

Reference demo data is mutable. Amara's archived reference state (Complete 100%, 3 carried days) is used consistently; the later 21-profile crawl exposed a different review/carry state. The original 21-person local directory is preserved instead of importing the reference demo's subsequently added records. Demo tenure uses 30 July 2026, matching the existing template date.

Small remaining visual differences: the profile header text and activity rows can differ by approximately 2–3 px while their section boundaries match; icon glyphs use the permitted Lucide set and employee portraits intentionally use original artwork. Help content explains the fields without claiming to quote unverified reference wording.

## Validation and actual project export

- Isolated candidate starts from commit `303cc13c0a80a73a89327072f1e72a49b4a5cd61` with only this milestone's owned source/test overlay.
- `npm run build` passes TypeScript project build and the production Vite build.
- Scoped oxfmt check and oxlint pass.
- 12/12 browser tests pass: the prior eight Cohort regression tests and four new profile/editor tests. Only the prior People creation test's now-obsolete combined View/Edit expectations were updated.
- At both 1440 and 390, the measured View/Edit sheets have the expected geometry, zero console/page errors and no document horizontal overflow.
- **Download project was clicked in the actual template details UI.** The resulting ZIP has 167 entries and SHA-256 `933532199692297928612ad6191741db7908c86e1a0e4bec31c873bec2210041`.
- All six runtime files and 13 free component/theme/license dependencies match the strict candidate's exact bytes in that ZIP. The exported Example imports both the global theme store and `applyTheme`, and the global store imports the theme implementation.
- The downloaded project independently passes `tsc --noEmit && vite build`. Its built app passes six desktop/mobile interaction states: saved note, editor Reset plus Manager search/selection, and saved identity/note plus real Timesheets navigation at both viewport widths. Four primary interaction screenshots and two help-tooltip screenshots were captured with zero console/page errors or document overflow.

The exported project includes ReUI MIT and Inter OFL notices, the original artwork attribution record and the dependency manifest. It uses local Bricklane artwork rather than ReUI/KeenThemes branding, original-site portraits or copied decorative assets. Export validation reuses the installed dependency tree via a local symlink; it does not claim a fresh package installation.

Private QA directory: `/tmp/bricklane-templates-round3/business/cohort-people-a/`. Evidence includes `geometry.json`, `render.json`, `tests-release.log`, `source-verify.json`, production build logs, the UI download receipt and exported-app interaction captures.
