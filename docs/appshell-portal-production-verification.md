# AppShell portal and sidebar API production verification

This completes the production gates that were still queued in the earlier [font review](appshell-portal-font-review.md). The three runtime files, browser test, and original review retained their frozen bytes throughout validation. No runtime or test changes followed production verification.

The cumulative template candidate based on ebd53dd passed its normal strict main build, as reported by its owning template coordinator. AppShell independently ran all 14 focused tests against that same immutable production dist at port 6334: 14 passed in 32.6 seconds. This covers default Inter14/20, explicit Serif/Mono selection and Reset, open-search query retention, native menu keyboard selection, provider collapse, nested mobile Sheet dismissal, route/breadcrumb changes and focus return at 1440/390.

Actual UI downloads of Shell 1, 2 and 18 each contained 374 files. All three modified runtime files match the validated candidate. Default implementation selection, Copy and single-file download match actual source; the changed chrome module also matches Copy and single-file download. The packages have 371 byte-identical files; only README, package name and Example variant metadata differ.

The actual Shell 1 package was normally installed in an independent dependency directory: npm install exited 0, added 252 packages and reported no vulnerabilities. Its unchanged npm run build executed tsc --noEmit followed by Vite and exited 0. The two other actual packages passed Vite-only builds; their common runtime bytes justify reusing the representative TypeScript check. This is one strict starter check and two bundle checks, not three independent strict checks.

All three downloaded standalone packages passed actual 1440/390 interaction checks: default Inter14/20, search input or native menu keyboard navigation, Escape and trigger focus return, mobile navigation Sheet dismissal, and desktop provider collapse. Browser console and page errors were absent. Screenshots were taken after finite native animations finished; initial animation-frame captures were retained separately.

The implementation continues to use the actual free ReUI SidebarWorkspaceSwitcher and SidebarNavigation compositions, native Sidebar/Sheet, and existing CommandDialog. The added optional collapsed and menuClassName props configure consumers; mobileShowCloseButton only exposes SheetContent's existing option through Sidebar. No menu reconstruction, extra provider, new sidebar state, CSS hiding of the X, global font rule or font asset was added. Fixed template headers and layout-specific menu width/close placement were gaps in the previously exposed wrapper API.

Generic actual-component fixtures additionally passed the default/false workspace override, default128/explicit192 collapsed menu geometry, actual font customization while a menu remains open, and mobile close default/true/false with Escape/overlay/provider-shortcut focus restoration. The owning template batch separately validates the concrete Miro, Cohort/Roster and workflow consumers.

Shell 2 search semantics/geometry and Shell 18 account contents/placement remain separate fidelity work. This release does not claim every AppShell state visually matches the public reference. Original Bricklane branding and licensed local assets remain in use.

Verification evidence is retained outside the repository in /tmp/appshell-portal-v2-ready-receipt.json, /tmp/appshell-portal-production-tests.log, /tmp/appshell-portal-production-zip-equivalence.json, the three actual ZIP files, install/build logs and standalone JSON receipts. This completed milestone is ready for the coordinator's serial commit and push; commit, push and deployment are distinct subsequent states.
