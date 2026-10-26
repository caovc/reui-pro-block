# Flux Settings: actual free layout and interaction review

This is an immutable warm browser milestone. It is not a strict-production, complete-template or runnable-export release. The live working repository, three-template freeze and clean release candidate were not modified. The Release Root coordinates Git, the final portable Radix baseline, production, source exports and deployment.

## Actual changes and reuse

The four inline pages use actual ReUI Frame/Header/Panel, free Item/Content/Title/Description/Actions and IconTile, the existing Pro SettingsFields/SettingsRow/SettingsChoice, and the actual ReUI v9 DataGrid, ColumnHeader, selection, ScrollArea and Pagination. API Integrations now uses the actual FrameFooter and tableLayout.dense; the unsupported bodyCell option and unnecessary hand-built pagination dimensions were removed. Workspace AvatarGroup uses actual free 28px Avatar children. Free Breadcrumb components provide the four-part header, with local authorized avatar and the original Bricklane mark elsewhere. There are no vendor SVGs, paid screenshots, vendor avatars or copied logos in the deliverable.

Parent integration uses the existing five-option Shell: Settings children retain the same native mobile Sheet; the whole Settings header-action slot renders the reference single System Status pill. Only AgentOps with an explicit headerTitle gets a div host so its actual Breadcrumb nav is valid. Other brands and default title markup remain identical. The exact Shell change is also supplied as a narrow patch against future-five-options SHA 3790691ad33cc75f5385d4c2d442e87ba63b49a087f6f47d012ab473d24d6b46. Do not overwrite Mesh's pending headerContent option with this complete file.

## Browser evidence and preserved failures

The first runner bootstrap failed before test execution because a temporary test directory could not resolve @playwright/test. It is retained in main.log. The spec was copied to the already-running candidate's normal module-resolution directory; no package installation occurred.

The first actual original 11-case run was 3 PASS and 8 FAIL in 29.3s. The three passing cases covered native phone child retention/breadcrumb/Escape focus and Default/Serif/Mono/Reset customization with real Select/Columns portals at both widths. All eight failures occurred at the original first Frame geometry check, before their later actions. The measured causes were the 49px instead of 48px header, 14px top padding instead of 16px, and missing phone 1px container border plus 12px instead of 16px horizontal padding. Consumer-only layout corrections made the original eight affected cases pass in 25.1s. Those logs and exact runtime snapshot remain immutable.

Passing the first-Frame check was insufficient. Same-state screenshots and an independent full geometry comparison exposed description line height 21 instead of 20, 24px instead of 28px operators, missing FrameFooter/dense grid configuration and phone Webhook name wrapping. A fresh read-only reference pass collected 106 computed records from the public Webhooks/API pages, with no page errors. Consumer corrections reused the actual free slots and API, without changing shared primitives or test tolerances.

The existing eight tests were strengthened with 18 fixed official Frame boxes, all four dimensions within 0.5px, ten initial API row heights (51px, final 50px), and actual FrameFooter presence. These eight passed once in 25.0s, including all original pointer, keyboard, selection, copy, JSON, sort, page, local toggle, removal and route-reset actions; every console warning/error and pageerror list was empty.

Final screenshot review found phone-only top alignment for Webhook ItemActions and an unnecessary 500 title-weight override. The consumer now uses self-start md:self-auto and the actual free FrameTitle's default 600. Only the original two Webhook cases were rerun, enhanced with all five fixed ItemActions boxes at both widths: 2 PASS in 8.3s, with native actions and empty console errors. The other six were not needlessly rerun after this narrow change. The earlier font/phone three cases predate the final header-action and density refinements, so this is cumulative evidence, not a single all-green final 11-case production run.

## Data behavior and limits

Workspace and Security controls use mounted route-local models and reset on return, as observed in the public demo. API exposes the real original 31-record local dataset, all-record safe JSON export (no credentials), actual row selection/global sorting/pagination, Pause All and individual toggle, actual clipboard and horizontal scroll. Webhooks provides actual local toggles, 5-to-4 removal and route reset; informational actions do not invent backend editors or network effects. Secret rotation is explicitly local preview metadata and does not rewrite health.

Custom code is limited to the four domain schemas/data, callbacks, original icons and measured consumer spacing. ReUI has no template-specific schema for these records. The exact reference API-toggle route-away/back persistence remains an audit gap; no backend persistence is claimed. Plan gates and information-only reference actions remain nontransactional.

## Remaining work

The overall Flux sidebar still needs a separate fidelity pass: full-width active child pills, Runs expansion, sidebar identity/footer menu, notification placement, Quick Links colors and the visible Spending Limit block differ from the reference. Original Bricklane mark and authorized replacement art remain intentional. The visible phone trigger focus ring in test screenshots is the real expected Escape return state and must not be hidden merely to resemble an unfocused reference screenshot.

Required release gates: latest portable Radix baseline integration; original strict main and production run; original complete 11-case runtime/typography verification; actual Source view/copy/single-file/full-ZIP four-way equality and dependency/license closure; a strict exported-app build and real standalone flows; coordinated normal-hook commit/push and confirmed deployment. No installation, bundle, source exporter, global CSS, vendor primitive or Git operation happened in this warm milestone.
