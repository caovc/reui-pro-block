# AppShell portal font boundary review

## Scope and reuse

The rendered Shell 1 workspace menu, Shell 2 search dialog, and Shell 18 account menu used the site's Geist body font after their native portals moved outside the reference canvas. The public references use Inter. The existing canvas and mobile navigation Sheet already use Inter correctly.

This change adds the existing `reui-reference` scope at the three initial consumer boundaries: `SidebarWorkspaceSwitcher`'s `DropdownMenuContent`, `WorkspaceMenu`'s `DropdownMenuContent`, and `SearchPalette`'s `CommandDialog`. It preserves the actual free ReUI c-sidebar-1 workspace composition and the existing native menu, command dialog, focus restoration, and mobile Sheet. The font correction adds no font asset, local font declaration, global body rule, or primitive font change. The higher-specificity explicit Body font rules continue to win over the reference default.

`SidebarWorkspaceSwitcher` also accepts an optional `collapsed` override for fixed template headers sharing a collapsible sidebar provider. The default still follows the native provider; a single effective collapsed value controls label visibility, menu side, and tooltip. `collapsed={false}` keeps a fixed header expanded without another provider or sidebar state. Native tooltip props are supplied only when the effective state is collapsed.

A separate, explicitly requested three-line `Sidebar` API addition exposes `mobileShowCloseButton?: boolean`, defaulting to `true`, and forwards it only to the existing `SheetContent.showCloseButton`. This lets a template with its own header actions omit the native X where it otherwise overlaps the Add time action. `ReuiSidebar` inherits the prop through `ComponentProps<typeof Sidebar>`; no new wrapper state, CSS hiding, Sheet rewrite, or DOM prop is added. Existing callers retain their visible X.

The same actual free `SidebarNavigation` composition now adds the reference font boundary to its collapsed child-menu portal and accepts optional `menuClassName`. It combines this with the existing `min-w-32`, preserving the default minimum width while allowing template consumers to use `min-w-48`. This uses the existing native menu; it does not rebuild menu interaction or sidebar state.

## Reference and rendered evidence

Public references were opened at `https://reui.io/preview/base/app-shell-{1,2,18}?embed=1`, using fresh light/default contexts and settled fonts. Default local comparisons used 1440×900 and 390×844 at DPR 1.

| Surface           | Public first row/input | Before           | After            |
| ----------------- | ---------------------- | ---------------- | ---------------- |
| Shell 1 workspace | Inter, 14px/20px       | Geist, 14px/20px | Inter, 14px/20px |
| Shell 2 search    | Inter, 14px/20px       | Geist, 14px/20px | Inter, 14px/20px |
| Shell 18 account  | Inter, 14px/20px       | Geist, 14px/20px | Inter, 14px/20px |

All six local before/after pairs retain the measured row/input bounds. Default mobile Sheet typography already matches the reference and was not changed. Original Bricklane marks and local licensed portraits are retained.

The comparison also identified separate fidelity work: Shell 2's search contents and geometry, and Shell 18's account contents and placement. This font batch does not claim those differences are resolved.

## Validation

Browser plugin not available; the repository's regular Playwright workflow was used. Thirteen isolated focused dev browser tests passed at 1440/390: default popup and row fonts, actual Serif/Mono UI selection, Reset while a popup remains open, search query retention, keyboard menu navigation, Escape focus return, nested mobile Sheet dismissal, and native provider collapse/menu side. No page errors occurred in the six screenshot comparisons. An additional actual AppShell 1 collapsed Pipelines test passed: Inter14/20, native ArrowDown/Enter selection of Release Gates, updated breadcrumb, and Escape focus restoration. Scoped oxfmt passed; scoped oxlint reports only the pre-existing effect/fast-refresh warnings.

A temporary browser fixture imported the actual `SidebarProvider` and actual `SidebarWorkspaceSwitcher`, with default and `collapsed={false}` consumers. It verified selected workspace retention, native provider open/close, right/bottom menu placement, visible fixed-header labels, Escape focus return, and absence of an unnecessary tooltip layer. This fixture was outside shipped source and is not a new product route.

A second actual-component fixture exercised `ReuiSidebar → Sidebar → SheetContent` at 390×844 for omitted/default, explicit `true`, and `false`. Default/true retain the native X and click/focus behavior; false removes the X and leaves the header action's center and right-edge hit targets accessible. The action's bounds stay identical in all three modes (189.6875,20,81.8125,32). Escape, overlay, and the native provider keyboard toggle close all three modes and restore the outer trigger focus; console errors and leaked DOM props are absent. The owning template's actual Miro layout verification remains with its owner.

A new actual-navigation fixture confirmed the preserved default 128px menu and explicit 192px minimum after finite native animations settle. Keyboard selection, provider collapse/re-expansion, selected state, Escape focus restoration, and actual Customize UI Inter/Serif/Mono/Reset while the menu remains open passed. Initial fixture failures retained outside the repository identify an incorrectly placed 256px anchor, zero-height harness container, immediate focus sampling, and an animation-scaled bounding box; these were corrected in the harness without changing product geometry or weakening its 128/192 checks.

The first cold dev run retained one initial route-readiness failure (8 pass, 1 fail); the same unrelaxed nine checks then passed on the warmed route. A subsequent run retained another 8/1 failure when a reused controller panel was already closed before the third surface; no font assertion failed, and the cause was not classified as a product defect. The six independent surface/viewport font scenarios were separated into fresh-context tests with the same font, Reset, query, keyboard, Sheet, and focus assertions plus a positive Body font readiness assertion. All 13 passed, followed by the additional real collapsed-navigation test. Timeouts and retries were unchanged. The separate new navigation test initially used the incorrect lowercase Release gates label; it was corrected to the actual Release Gates label, retaining the failed trace. The private dev-only Vite configuration also explicitly allows the symlinked dependency directory to avoid a Geist font-file filesystem 403; this environment configuration is excluded from the release. Production build verification remains queued with the coordinator; dev validation is not reported as production validation.

Actual UI downloads for Shell 1, 2 and 18 each contained 371 files. All three modified runtime files match the candidate bytes in all three ZIPs. Default implementation selection, Copy, single-file download, and changed chrome source Copy/download match actual source. No source routing or implementation-file split was introduced. Downloaded starter strict builds remain queued; byte checks are not reported as compilation.

Local evidence retained outside the repository: `/tmp/appshell-portal-font-comparison-final.json`, `/tmp/appshell-portal-after-proof.json`, `/tmp/appshell-portal-v2-final-dev-tests.log` and `/tmp/appshell-collapsed-nav-final-dev-tests.log`, `/tmp/appshell-switcher-override-proof.log`, and `/tmp/appshell-portal-v2-final-export.log`, `/tmp/appshell-mobile-close-proof.json`, `/tmp/appshell-collapsed-nav-proof-settled.log`, and `/tmp/appshell-nav-font-proof.json`. Before/after screenshots are under the task's `portal-font` visualization folder. The separate theme milestone and its freeze are unchanged.
