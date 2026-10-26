# Collaboration Sidebar fidelity

2026-10-26. Scope: `collaboration/shared.tsx` and its new `collaboration-layout.css`; the existing Pulse/Roster page models, Settings files, Echo, Drive, shared primitives and global styles are not edited in this batch. Root coordinates Git and deployment.

## Reference and comparison

References: [Roster](https://roster-hr.reui.io/), [Pulse](https://pulse-helpdesk.reui.io/), the official [free Sidebar examples](https://reui.io/components/sidebar) and [Toggle Group](https://reui.io/components/toggle-group). Chromium, DPR 1, light theme, 1440×1000 and 390×844; navigation/network and transitions settled before screenshots. Font assets were checked loaded. Official screenshots are private QA evidence only and are not preview or download assets.

The prior 85-artifact audit is `/tmp/bricklane-templates-round3/collaboration-layout-audit/manifest.json`. New evidence, scripts and browser output are `/tmp/bricklane-templates-round3/collaboration-layout-implementation/`. Candidate `collaboration-layout-a0a` starts from clean commit `a0a4c372dd6a34cbcd8b2e4b5fe7ab406a5733eb`, with only the owned overlay and the coordinated Theme V2 runtime dependencies.

| Largest demonstrated difference | Before                                                                                     | Result                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Outer sidebar collapse          | The hand-built outer aside stayed 255px after Ctrl+B; only its navigation labels collapsed | Actual Sidebar provider changes Roster 256→64px and Pulse 260→62px, including content position                                                                                                         |
| Roster scroll containment       | The long page scrolled the document                                                        | Actual inset is x256/y8, 1176×984 at 1440×1000, document height 1000; its content scrolls internally. Collapsed inset starts x64. Pulse retains its separate document scrolling and sticky 51px header |
| Mobile navigation and focus     | A second manually controlled Sheet duplicated navigation; dismissal left focus on body     | The actual Sidebar responsive drawer is 288px Roster / 292.5px Pulse. Native close, Escape and leaf navigation return focus to the single real SidebarTrigger                                          |

Pulse collapsed content is centered with a 1180px inset including 22px gutters. No extra global scrollbar rule was added. Native mobile close and the Roster notification button have distinct hit boxes. Account controls match the reference compact rows instead of making theme/availability three extra vertical items.

## Actual reuse

- Free `AppShellLayout`, `AppShellInset`, `ReuiSidebar`, Header/Content/Footer slots, `SidebarTrigger`, provider state, `SidebarNavigation`, `SidebarCollection`, and `SidebarWorkspaceSwitcher` replace the manual outer aside, duplicate mobile Sheet and separate collapse state.
- The existing Pro `SearchPalette` is actually mounted with the template's real route callbacks. Ctrl+K, filtering, route selection and focus use its existing command implementation. Hiring and Knowledge Base retain their parent-controlled list queries through actual free InputGroup controls; existing leaf search controls remain authoritative.
- Free Frame/Header/Title/Description/Panel/Footer, Progress, DropdownMenuRadioGroup/DropdownMenuRadioItem, Avatar/Fallback, DropdownMenu, Popover, Dialog, Button and Input provide the promo, menus and forms. Availability uses native menu roving focus and Space activation. A real keyboard-entry probe found that embedding ToggleGroup left it outside the menu collection; native Menu Radio Items now provide the same compact rows with actual Home/ArrowDown/Space access, rather than relying on programmatic focus. The existing `blocks/reference.css` is explicitly imported so its approved `reui-reference` boundary works in portalled mobile Sidebar content.
- Custom CSS is limited to this consumer's measured shell geometry, compact account rows and original artwork presentation. No new font-family, outline, global focus, Tabs or blanket scrollbar overrides are added.

Theme V2 dependencies are coordinated separately with their sole owner: `chrome.tsx` SHA `258780ac2504495213dbcff4004763fa413911e96532683ed8cf5ab56258a15f`; ReUI Sidebar SHA `cd917ef641c5e8c3f69e0baf70078bc6894942ea383b796923822dd6539a061e`; UI Sidebar SHA `d37b265da290de3e93c0cddeb31acc297886c6dc246b7d8c3052e8d09b151c67`. This batch does not own or overwrite those files. Pulse's top workspace switcher uses the approved `collapsed={false}`; Roster's collapsed Settings menu uses `menuClassName="min-w-48"` (192px).

## Behavior and boundaries

Roster's five Settings children, Directory/Import, saved user name/photo/company, requests and imported people remain connected to existing parent state. The account Profile/Preferences items navigate their actual pages. Organization creation and selection are local context state; they do not imply isolated server datasets. Pulse product selection is context state and does not claim to filter its ticket dataset.

Theme controls update the actual global theme store. Local availability updates its selected control and the footer indicator. Sign Out shows a local signed-out screen; Continue demo restores the retained parent objects. Pulse Read more navigates to Knowledge Base; Dismiss persists while navigating this session. Invitations now retain a visible, deduplicated Pending list across reopening, explicitly stating that no email is sent, instead of only showing a success toast.

Pulse's separate account Profile, Preferences and Billing routes are not implemented by the existing local template. Their menu items are visibly disabled with a reason; they are not redirected to an unrelated Settings page or represented by success toasts. Completing those leaves is separate scope. Original dashboard/chart/calendar leaf geometry and data fixtures are preserved rather than claimed corrected here. No original ReUI logo, avatar, illustration or premium source is bundled; Bricklane's original mark, portraits and local artwork remain in use.

## Validation

- Scoped oxfmt check and oxlint pass.
- Nine new layout/behavior cases plus twenty existing Collaboration, Roster Settings and Echo cases pass with one browser worker (29/29, 1.4m). After the final invitation behavior change, its affected case also passes independently. The owned suite passes 9/9 (38.3s) after the native-close hit-box and menu-density adjustments, including the actual Pending invitation flow. The final native keyboard-entry correction passes all three affected account cases (12.5s), opening the actual menu with Enter and moving Home/ArrowDown/Space through its registered native choices.
- Actual Customizer UI checks default Inter, Serif, Mono and Reset at 1440/390. Search text survives changes; mobile Sidebar, account popup and collapsed Settings popup update correctly. Nested popup Escape is checked separately before dismissing the parent Sheet, preserving focus.
- Private Vite candidates use an isolated cache and React dedupe. An initial private-server font 403 caused by an incorrect fs.allow realpath was corrected before final evidence; those early screenshots are not final typography evidence.
- Actual project ZIPs are downloaded through each template detail page's View template source → Download project control. Exact runtime, free component, stylesheet, font, MIT/OFL, theme-store and applyTheme entry verification is recorded in the adjacent private evidence manifest.
- New production/full strict and ZIP strict builds remain queued behind Root's explicit resource gate. They are not claimed passed by this ledger until the allocated validation window completes.

No Git commit, push or successful preview deployment is claimed by this subagent. Root must publish the narrow frozen manifest together with the coordinated Theme dependencies and report deployment status independently.
