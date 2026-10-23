# AppShell Sidebar / Layout migration

## Corrected foundation

The previous implementation reused individual ReUI Tree, Frame and IconTile components but still built its navigation columns and layout by hand. That did not meet the project's free-component-first requirement.

All 36 AppShell routes now render through the free Sidebar composition's `SidebarProvider` and `SidebarInset`. Navigation columns use the Sidebar dependency installed by the official free examples. The adapted compositions live in `src/components/reui/sidebar.tsx` and `src/components/reui/layout.tsx`.

## Official free sources inspected before migration

| Official example                                                                  | Reused implementation / application                                                                                                                    |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [c-sidebar-1: Workspace Switcher](https://reui.io/components/sidebar/c-sidebar-1) | Sidebar Group → Menu → MenuItem → MenuButton, count badges, separate keyboard-reachable row actions; shared workspace navigation, projects and members |
| [c-sidebar-2: Icon Rail](https://reui.io/components/sidebar/c-sidebar-2)          | Provider/Inset shell composition, shared open/mobile state, collapsible icon mode, edge rail, trigger, accessible names and tooltips                   |
| [c-sidebar-3: Docs Navigation](https://reui.io/components/sidebar/c-sidebar-3)    | Collapsible group label/content and MenuSub/MenuSubButton; shared nested navigation and disclosure sections                                            |
| [c-sidebar-4: Inspector Panel](https://reui.io/components/sidebar/c-sidebar-4)    | Inspected for right-side companion panels; existing context content now uses the Sidebar foundation where applicable                                   |
| [c-sidebar-5: Filter & Loading](https://reui.io/components/sidebar/c-sidebar-5)   | Inspected for filtering/state ownership; order-query state is owned above the responsive panel so dismissal does not reset the filter                  |
| [c-tabs-1](https://reui.io/components/tabs/c-tabs-1)                              | Tabs/List/Trigger composition replaces the shared hand-written tablist; arrow, Home and End keys use the native Tabs implementation                    |

The examples are public registry items at `https://reui.io/r/radix-nova/c-sidebar-N.json`. Their `sidebar` registry dependency comes from `https://ui.shadcn.com/r/styles/radix-nova/sidebar.json`. The project uses this dependency as part of the ReUI free examples' actual composition, rather than building an unrelated sidebar from buttons. ReUI's MIT notice remains in `src/components/reui/REUI-LICENSE.txt`; the dependency's shadcn MIT notice remains in `THIRD_PARTY_NOTICES.md`.

## Removed duplicate behavior

- Shared sidebars no longer duplicate children into an independent Sheet. The Sidebar's responsive branch renders the mobile navigation.
- Desktop collapse, edge rail, header controls and Ctrl/Cmd+B read the same provider state. Existing shells that change labels read that state through `useShellSidebarState`.
- Workspace/project/member navigation uses the official menu and disclosure components instead of hand-written button lists and conditional submenus.
- AppShell 22, 31, 35 and 36 use the responsive Sidebar directly; AppShell 34's order queue uses the same foundation and retains search after dismissal.
- Mobile navigation restores the opening trigger with `preventScroll`, and shows complete labels even after a desktop collapse. Selecting a nested page opens its parent when the desktop sidebar is expanded again.
- Application rails paired with a separate navigation panel keep separate mobile state, so opening the application picker does not open two dialogs.
- Spacer widths now match their panel widths, including floating margins and the Fleet Center's 12px gutter. Official desktop containers are positioned inside each preview, rather than against the catalog's viewport.

## Extensions and visual constraints

The free examples provide navigation and layout behavior, not each Pro block's complete product screen. Local code still supplies the 36 sets of workspace data, product-specific panels, resizing handles, hero composition, glass treatment, pixel masks, skeleton geometry and action demonstrations. Deep operational and observability trees continue to reuse the actual free ReUI Tree.

The Sidebar dependency adds project-level mobile title/class/width options and explicit focus return, and sizes its desktop container relative to its own panel. The hero shell uses a 1024px responsive breakpoint matching its header. Hidden/mobile tooltips do not mount a dismiss layer, so the first Escape closes the Sheet. These are adaptations for embedded previews and multi-panel layouts. They retain the original state, collapse, gap, Sheet, menu, tooltip and keyboard implementations.

Branding is Bricklane's original artwork. AppShell 22 uses the existing original generated robot cover. Reference-site decorative media is not loaded or distributed; the original six-image scene sequence is therefore not claimed as reproduced.

## Validation

Validation covers all 36 routes at 1280px and 390px, actual Sidebar/Inset presence and on-screen panel geometry, collapse/menu synchronization, desktop-to-phone transitions, keyboard row actions, mobile focus containment and return, retained order search, existing tree/drag/chat/board/assistant interactions, and an independently built downloaded starter. Release evidence is recorded after the final frozen candidate passes.

Frozen candidate base: `48495a3`. Production build and 48 browser checks passed, including the 72 route/viewport steps and the separate 36-shell foundation inspection. The actual AppShell 22 download contains 240 files, including Sidebar/Layout, `use-mobile`, MIT notices and the original cover; the final downloaded starter independently passed TypeScript and Vite production builds. Formatting passes; oxlint reports no errors (existing mixed component/export fast-refresh warnings remain).

## Follow-up: painted collapse geometry and AppShell 1 details

User screenshots exposed a missed distinction: the Sidebar state and its spacer changed correctly, but `!w-64` kept AppShell 1's painted panel at 256px. Its account avatar consequently centered inside the wrong column, and the edge rail inherited a second horizontal translation. The earlier state-only collapse checks did not detect this visual failure.

The correction removes competing fixed-width utilities and per-variant CSS overrides from the shared consumers. Widths now come from Sidebar tokens; floating layouts also retain their explicit collapsed gutter. The shared wrapper derives its compact class from the same Provider when no explicit value is passed. Geometry assertions cover the painted panel, spacer, content start and restored expanded width across 25 icon-collapsible shells.

AppShell 1 now actually reuses c-sidebar-1's workspace switcher composition, with a full-row MenuButton, workspace initials, selection check, and a local create-workspace flow. Its resource list uses the free Collapsible Group/Menu/row-action composition. Header and account footer use the free Header/Footer slots, and the account card remains centered on the icon axis after collapse. Menu placement changes to the right of the compact rail. Bricklane's original mark and licensed local portraits are retained.

The edge control still uses the free SidebarRail behavior. Its two-segment hover chevron, label and 28px hit target are local styling needed to match the public Pro preview; the free Rail supplies a full-height boundary strip rather than this centered treatment. The rail sits outside scroll clipping. Production validation additionally caught CSS minification removing `translate: none`, so the adaptation replaces the Rail’s inherited half-width translation utilities with zero translation and verifies its final bounding box and keyboard hit target in the production build.

Reference: public AppShell 1 preview at `https://reui.io/preview/base/app-shell-1?embed=1`, inspected at 1280×900. The corresponding brand/artwork intentionally differs under the project's original-branding requirement. This correction does not certify pixel equality for all 36 product screens.

The follow-up production suite passed 48 tests in 39.6 seconds, including the 25-shell collapse/restore geometry loop, AppShell 1 at 1280px and 1718px, the actual catalog iframe, the workspace create/select flow, all 36 desktop/mobile routes and existing product interactions. Console/error inspection was clean. A final phone check reserves a separate header hit area for the Sheet close button. The actual AppShell 1 UI download contains 269 files and independently passed TypeScript and Vite production compilation. Production-specific rail geometry is verified; visual comparison is still scoped to the reported AppShell 1 states.

The account card also reuses c-sidebar-1’s actual AccountMenu composition. A fresh public-reference check corrected its previously mixed workspace/account contents: identity header, Profile, Billing & Usage, Preferences, support/API entries, Theme radio submenu, and Sign Out. The submenu supports keyboard Right/Left navigation and live Light/Dark/System selection; account actions are explicitly local demonstrations because the preview has no authenticated account, billing backend or application API. Those product actions remain custom demo handlers rather than a claim of a working service integration.

Final frozen follow-up: **49/49 production browser tests passed in 47.8 seconds** after the account-menu and phone-header corrections, with no assertion or timeout relaxation. `oxfmt --check` passes for all 16 owned files; oxlint reports no errors. The final UI-exported AppShell 1 starter was rebuilt independently and exercised at desktop/mobile sizes, including actual 48px collapse, account actions, and non-overlapping close/switch controls.
