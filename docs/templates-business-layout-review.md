# Business template layout: actual ReUI sidebar migration

Reviewed 2026-10-26. Scope: the shared layout used by Cohort, Atlas, Surge, Manifest, Verve and Miro. Business page models, Cohort People/Time controllers, shared vendor UI and global styles are outside this change.

## Reference evidence

Public browser references: [Cohort](https://cohort-hr.reui.io/), [Atlas](https://atlas-admin.reui.io/), [Surge](https://surge-commerce.reui.io/), [Manifest](https://manifest-commerce.reui.io/), [Verve](https://verve-crm.reui.io/) and [Miro](https://miro-clinic.reui.io/). Cohort and Manifest were entered through their prefilled demonstration login. Reference navigation was loaded through `networkidle`.

Private screenshots, DOM measurements and browser scripts are in `/tmp/bricklane-templates-round3/business-layout-qa/`. Reference and local views use light mode, 1440×1000 desktop / 390×844 mobile, DPR 1 and browser scale 1. These QA images are not distributed as site assets. The Browser plugin/skill was unavailable in this agent's session; the authorized independent headless Playwright fallback was used.

## Audit: what was and was not reused

Before this change, `NavItems` genuinely used the project's official free `SidebarNavigation` adaptation. The surrounding layout did not: it used a hand-written `aside`, separate mobile `Sheet`, separate collapse state, a `SidebarProvider` rendered as `display: contents`, and CSS that removed a collapsed sidebar entirely. Calling that a full ReUI sidebar composition would have been inaccurate.

The implementation now actually composes:

- `ReuiSidebar`, including its real `SidebarHeader`, `SidebarContent` and `SidebarFooter` slots.
- The same `SidebarProvider`, `useSidebar`, `SidebarInset` and `SidebarTrigger` dependency used by those official free examples. Provider state owns desktop collapse, native mobile Sheet, keyboard toggle and trigger focus restoration.
- `SidebarNavigation` from the actual MIT ReUI c-sidebar-1/2/3 adaptation, including compact nested menus and mobile leaf selection.
- `SidebarWorkspaceSwitcher` for Atlas and `SidebarCollection` for Atlas Favorites and Cohort departments.
- The actual free `SidebarRailButton` composition for Verve and Miro application rails. Their mobile drawers retain the same real `ReuiSidebar` rail beside the contextual pane.
- The existing AppShell `CollapseHandle` Pro Block, which uses the actual `SidebarRail`, with its original `shells.css`; the old permanent footer Collapse row is removed. Only the sidebar container receives the original shell reference scope, with consumer geometry and inherited font preserved.
- The project's existing AppShell `SearchPalette` Pro Block, with the template's actual navigation routes. Search and Cmd/Ctrl+K now open the same working command dialog; choosing a result navigates to that view.

Official public registry sources inspected: [c-sidebar-1](https://reui.io/r/radix-nova/c-sidebar-1.json), [c-sidebar-2](https://reui.io/r/radix-nova/c-sidebar-2.json), [c-sidebar-3](https://reui.io/r/radix-nova/c-sidebar-3.json). Their source includes Provider/Inset/Trigger and Header/Content structures; the existing project adapter retains the actual free implementation and its MIT attribution. Stock `ui/sidebar` is its dependency, not relabelled evidence of reuse.

## Concrete layout corrections

| Reference comparison                                                                             | Result in this scope                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cohort and Atlas expanded sidebar: 256px.                                                        | Real sidebar spacer/container owns 256px; Header/Content/Footer no longer depend on an unrelated hand-written aside.                                                                                  |
| Commerce topbar spans the viewport at 51px; sidebar starts underneath at 260px wide.             | Topbar and SidebarInset are composed in a workspace/columns layout. The old pseudo-element letter mark is removed in favor of the local Bricklane mark.                                               |
| Verve has a 63px application rail, 200px inner sidebar and inset workspace with a shared topbar. | Real ReUI rail and secondary sidebar retain separate responsibilities; collapsing the inner sidebar leaves the application rail.                                                                      |
| Miro has a 48px rail and 302px contextual sidebar.                                               | The contextual `aside` prop is placed inside the actual sidebar Content; primary application navigation stays in the rail. Mobile includes both usable application navigation and contextual content. |
| Compact widths differ by template.                                                               | Actual provider state uses Cohort 66px, Atlas 48px, Commerce 62px; Verve/Miro inner sidebar collapses off canvas while retaining its rail.                                                            |
| Reference navigation is 32px in Cohort/Atlas/Commerce and 26px in Verve.                         | Template consumer density now matches those measured heights instead of forcing every template to 34px.                                                                                               |
| Cohort/Verve/Miro use bounded workspaces; Atlas/Commerce retain document scrolling.              | Framed workspaces keep a scrollable main pane and an independently scrollable sidebar Content. Header/Footer remain outside the sidebar scroller.                                                     |
| Mobile navigation uses one sidebar, with nested group expansion and leaf selection.              | The same actual ReUI sidebar renders its native Sheet; a group expands without closing it, while leaf selection and footer navigation close it.                                                       |
| Collapsed Settings menu typography.                                                              | Reference/local measured 14px font, 20px line-height, 4px 6px padding and 28px menuitem height. Native menu grouping and keyboard behavior are retained.                                              |

The adapter lives in `business-layout.css`. It preserves official slots and scrolling behavior while overriding obsolete family grid/display rules that otherwise set the real SidebarInset to `display: contents`. It does not clear the component styles and then rebuild the sidebar with arbitrary divs.

## Interaction fixes

- Removed separate mobile and desktop navigation state machines. Existing `Shell`, `NavItems`, `aside`, `footer`, `account` and `navGroups` APIs remain available to page owners.
- Grouped Cohort Settings and Time navigation keeps parent-owned page state. Compact groups use their real ReUI menus.
- Account footer opens a real account menu with actual Profile/Settings routes. Mobile footer actions also close the sidebar.
- A reproduced resize bug showed multiple simultaneously mounted `SidebarTrigger`s competing for the dependency's shared trigger ref. The consumer now mounts one real trigger per state: Cohort header, collapsed rail workspace topbar, or mobile Open menu. Other desktop sidebar toggles use the existing AppShell `CollapseHandle` / actual `SidebarRail` and do not compete for the trigger ref. Escape restores focus after a desktop-collapse → mobile-resize sequence.
- Commerce navigation uses the actual free `SidebarNavigation` group labels for Store and System; parent navigation state and grouped children remain supported.
- Mobile width matches measured reference drawers: Cohort 288px and the other families 75vw (292.5px at a 390px viewport), instead of a uniform 320px. Verve and Miro retain one visible 48px native application rail beside their contextual content. A test caught the old family `display:none!important` rule hiding that rail; a scoped consumer override and visibility assertion now prevent the regression.
- Search uses the existing working Pro Block command palette rather than displaying a nonfunctional shortcut beside a simple top-level filter.

## Settings block audit and ownership boundary

At this batch’s baseline, `forms.tsx` `SettingsBlock` accepts only `block`. Its save handlers display toasts and do not expose controlled values or a parent `onSave`. `AccountSettingsDialog` has genuine local draft/saved values and uploads, but exposes no `open`, `onOpenChange`, `value` or `onSave`; it owns its demonstration launcher. Dropping either into the template would not connect the template's existing account/company state.

The separate Settings owner is extracting a controlled panel API. This layout batch does not edit either block file, claim a completed settings migration, or replace working Cohort settings state with a fake success. `SettingsPage` outside Cohort remains a follow-up for that controlled block integration. A future parent-owned sign-out action also needs an explicit Shell callback; this batch does not pretend a local route change signs out an account.

## Branding, assets and downloads

Bricklane's original mark, local original demo avatars and replacement decorative artwork are retained. No ReUI/KeenThemes logo, original paid screenshot, reference avatar or extracted reference SVG is introduced. ReUI MIT and font OFL notices remain required.

Reusing the actual AppShell SearchPalette also makes that module's licensed local asset imports reachable to the source collector. Its image directory attribution must accompany exported assets. The collector owner was given this exact narrow requirement; this agent does not modify the shared collector. Source/copy/ZIP validation uses the actual detail UI download, not a hand-built substitute.

## Validation record

- Final private development layout suite: **16/16 passed**, one worker. Covers all six template geometries, exact mobile widths, rail visibility, real navigation, collapse/provider shortcuts, focus restoration, command search and native horizontal tab focus/overflow. Atlas Workspace and Miro Search/account portals follow actual global Customize Default → Serif → Mono → Reset at 390px. Eight popup screenshots remain in the private test output.
- After integrating the separate immutable Theme v2 runtime patch, the **3 affected steps passed**: Miro mobile without a native Close button, Cohort's 192px collapsed Settings menu through real Preferences navigation and resize focus restoration, and Miro nested popup font/reset behavior. The temporary Miro padding workaround was removed; the consumer uses the native owner's optional `mobileShowCloseButton` API. Cohort uses its optional `menuClassName` API to match the measured reference width.
- Prior production layout + existing business behavior regressions: **32/32 passed**, one worker. Includes CRUD, People, Time, CRM quota and clinic calendar flows. These production checks ran before the final edge-handle/mobile/font refinements and are not represented as final-source production validation.
- Document width at both 768px and 1024px matched each viewport for all six templates. At 390px Cohort Preferences retains horizontal tabs (scrollWidth 552, clientWidth 332), while scrollHeight equals clientHeight (37px); focusing the last actual tab button scrolls it into view. No global Tabs or focus workaround was added.
- Final actual detail-UI downloads: **six ZIPs, each 176 entries / 38 TS/TSX/CSS files compared byte-for-byte**. The real source view and Copy result also match the actual shared module. Both original imported block stylesheets and all three immutable Theme v2 runtime files match the candidate bytes/hashes. Each ZIP contains 18 assets: 11 original SVGs, six licensed photos and one Inter font. The seven block assets and **1615-byte ATTRIBUTION.md** match the candidate bytes; unrelated Commerce notes are absent. MIT/OFL notices and `useGlobalTheme` / `applyTheme` in the actual exported Example remain present.
- The first font test correctly failed when Business did not load the existing block reference stylesheet; importing `@/blocks/reference.css` fixes the actual Inter scope without introducing a new font rule. Separate Theme-owner portal wrappers are private integration dependencies and are excluded from this batch's owned manifest.
- The source collector attribution fix is another external immutable dependency: `/tmp/bricklane-engines/assets-only/assets-only.patch`. This batch does not write shared `source.ts`.
- Scoped oxfmt and oxlint: **passed**. The earlier candidate cold strict build passed, but the final-source production build and strict exported-project build are **pending the root session's coordinated resource queue**. No new cold build was started without its slot; no pending check is represented as passed.

Private final evidence: `business-layout-qa/release-zips/download.json`, `audit.json`, `mobile-font-layout-v1-final/`, `font-v2-affected/` and `native-rail-visual/` under `/tmp/bricklane-templates-round3/`. The owning runtime dependency is `/tmp/appshell-portal-font-v2-release.json`; its three runtime files are not owned or modified by this layout batch.

## Remaining scope limits

This is a shared layout migration, not a claim that every business chart, data row, editor, account setting or contextual panel is pixel-identical. Existing leaf content and server-backed functionality are not invented to fill reference differences. Screenshots and measurements distinguish corrected layout geometry from those remaining page-owner tasks. No global focus outline or vendor Tabs override is part of this change.

## Exact follow-ups for page owners

The Surge/Manifest reference Inventory group contains Stock ledger (`/inventory`), Reorder queue (`/inventory/reorder`) and Purchase orders (`/inventory/purchase-orders`). Customers contains All customers (`/customers`) and Groups (`/customers/groups`). Settings contains General, Team, Payments, Notifications, Billing, Locations and Suppliers under `/settings`. Existing Commerce leaf pages only expose top-level views; adding those names in the shared shell alone would route them to incorrect content. The shared `navGroups` API is preserved so the Commerce page owner can add genuine views.

Miro's local Open Time header currently renders a decorative clock; the reference add-time control still needs a real leaf-owned interaction. This layout consumer uses the separate owner's native `mobileShowCloseButton={false}` option for Miro, retaining Escape/overlay dismissal and eliminating the overlapping Close icon without a local padding hack. No shared Sidebar implementation is edited by this batch.
