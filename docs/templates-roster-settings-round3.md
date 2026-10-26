# Roster Settings — fidelity milestone (2026-10-26)

Browser plugin / browser skill absent. Used installed Playwright Chromium with networkidle on https://roster-hr.reui.io/settings/{organisation,policies,approval-flows,profile,preferences}. Private reference screenshots are outside the repository. No original avatar, brand or image asset was downloaded for distribution.

## Actual free ReUI / project Pro Blocks reused

- ReUI Frame / FrameHeader / FramePanel for all settings cards (settings-shared.tsx from frozen Pulse m4).
- Existing DomainRecordGrid Pro Block backed by free ReUI DataGrid for editable departments, locations, leave and employment lists.
- Existing TabsBar Pro Block backed by installed ReUI Tabs.
- Free SidebarNavigation composition for expanded Settings children and active page.
- Free NumberField via SettingsNumber for entitlements and carry-over; free Select for fiscal month/day, timezone, approval roles.
- Free ItemGroup / Item / ItemMedia / ItemContent / ItemActions plus IconTile for Preferences, matching reference icon rows.
- Free useFileUpload and Alert for real local photos / errors. Existing global theme store for real light → dark → system cycling.

## Reference pages

- [Organisation](https://roster-hr.reui.io/settings/organisation)
- [Policies](https://roster-hr.reui.io/settings/policies)
- [Approval flows](https://roster-hr.reui.io/settings/approval-flows)
- [Profile](https://roster-hr.reui.io/settings/profile)
- [Preferences](https://roster-hr.reui.io/settings/preferences)

The mobile Preferences reference keeps the 14px text and 40px icon tiles. These dimensions are retained instead of shrinking the content to fit more rows.

## Changes

Replaced the still-mounted old three-field settings form. Five settings pages now render, with per-section saved/draft values owned at the Roster root. Draft and saved state survive sidebar navigation. Company, departments, locations, working week, leave types, carry-over, employment types and approval flows support Save / Discard. Profile supports local photo upload/remove, actual name/title/location save and Reset; saved name, company and photo immediately appear in sidebar across pages.

Reference inspection corrected inherited unfinished assumptions: Department name edits directly in the table; its action menu has only Delete. Preference Clear immediately restores the selected sample dataset. Appearance Change cycles modes immediately, with a mode toast; no extra modal.

Approval role saves update actual request approvers. Clear decisions resets actual Approved/Rejected decisions while preserving organisation roles. Clear people removes local additions / imported updates. Clear hiring restores original columns and clears scheduled interviews. Organisation Restore resets sections and actual approval roles.

## Evidence

- Final strict TypeScript + Vite build PASS (build-delivery.log); final typography-only Vite rebuild PASS (build-final-css.log).
- 8 new Roster/Pulse tests plus 3 existing Echo tests: 11/11 PASS (tests-final.log).
- After final Appearance correction, both mobile navigation tests rerun: 2/2 PASS (test-mode.log).
- Exact final production bundle on port5296: all8 new tests PASS (tests-production.log), all10 desktop/mobile screenshots regenerated against the production bundle, zero console warnings/errors or page errors (production-capture.log/local-qa.json).
- Scope format:check PASS, oxlint zero errors.
- Captured every tab at 1440×1000 and 390×844. Page identity / nonblank / no overlay / no page errors PASS (local-qa.json, local-*.png).
- Main title reference x412/y65 vs local x411.5/y65; measured reference weight500 and letter-spacing -0.5px now also applied. Tab trigger padding2px6 and gap4 were measured and matched. Company frame reference width864/y157 vs local width864/y157; Profile and Preferences frame width672.
- Table reference geometry measured directly: organisation 471.03/259.06/131.91, leave 304.58/304.58/167.52/85.33. Restored proportional columns from these measurements, correct row49/header40, bounded334 scrolling.

## Actual project download verification

The source drawer's **Download project** button on the isolated production candidate produced `roster-template.zip` containing 173 files. The six changed runtime source/style files and all three frozen shared settings dependencies match their release bytes by SHA-256: 9/9 checks passed. The archive contains `REUI-LICENSE.txt` with the full KeenThemes MIT notice, root `LICENSE`, `THIRD_PARTY_NOTICES.md`, and Inter/Archivo font license records.

The downloaded project was extracted outside the repository, linked to the existing installed dependencies, and built using its own generated `npm run build` script (`tsc --noEmit && vite build`, generated `strict: true` tsconfig). It passed without changing generated source or configuration. Its own production server on port5297 passed independent 1440×1000 and 390×844 flows: save organisation name, leave and return, save profile name/local SVG photo, leave and return, verify the sidebar company/name/photo reflects the saved values. Both viewports had zero page/console errors and no document overflow.

Private QA files: `export-check.json`, `export-build.log`, `export-verify.json`, `export-profile-{1440,390}.png`, `export-identity-{1440,390}.png` under `/tmp/bricklane-templates-round3/roster-settings-finish/`. These artifacts are not shipped in the starter or preview site.

## Known limits / follow-up

Roster still lacks saved Person notes, Booked leave and Timesheet sign-off models. Their Clear controls are explicitly disabled until there are actual changes to clear; they do not pretend to erase unsupported data. Existing local additions, approvals and hiring Clear controls become enabled only when those models differ from samples. Settings use in-memory state across sidebar routes; persistence after a browser reload was not added. Reference brand/avatars intentionally replaced with original Bricklane/local artwork. UI primitives are existing installed library implementations, not newly rewritten facsimiles.

Source-targets owner should add roster-settings, roster-settings-list and roster-settings-model to the Roster secondary source targets. This change set depends on the frozen Pulse m4 settings-model/settings-shared/settings.css dependency files and does not edit them. No Git writes performed by this agent.
