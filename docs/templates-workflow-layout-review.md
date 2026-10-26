# Workflow native Sidebar review

This batch covers the shared layout used by Flowly, Flux AgentOps, Lucent,
Tempo and Mesh. It does not claim that their individual dashboard cards,
settings pages or every account menu already match the references.

## Actual reuse

- `ReuiSidebar` now renders the real Sidebar Header, Content and Footer.
- The same `SidebarProvider` owns desktop collapse, Cmd/Ctrl+B and the mobile
  Sheet. `SidebarTrigger` supplies the mobile focus-return reference.
- `AppShellInset` supplies the actual SidebarInset. Its scroll mode follows
  the individual template rather than forcing every template into one mode.
- Regular and nested primary navigation use the official free
  `SidebarNavigation`, including its compact dropdown navigation. Permanent
  icon rails use the free `SidebarRailButton` with native SidebarMenu slots.
- Search actually uses the existing Pro Block `SearchPalette`, backed by
  CommandDialog, filtering, keyboard selection and focus restoration. The
  old independent search Dialog and manual filtered-button list are removed.
- The edge handle actually uses the existing `CollapseHandle` Pro Block and
  its native SidebarRail and stylesheet. There is no copied replacement
  glyph or independent collapse state.
- The existing `blocks/reference.css` and `shells.css` are imported as real
  dependencies. Mobile portal consumers use the existing `reui-reference`
  scope; there are no new font-family rules or global focus overrides.

The free `AppShellLayout` convenience wrapper fixes its whole surface to
`h-dvh` with overflow hidden. Lucent and Mesh need document scrolling, so this
batch composes its actual SidebarProvider and AppShellInset components
directly. This is a layout requirement, not another Sidebar implementation.

Tempo's existing task-view slot and the templates' domain-specific extra
navigation remain consumer content. The free navigation adapter accepts
string children, not these arbitrary React controls. Their mobile selection
closes the native Sheet without replacing its focus or state machinery.

## Reference and geometry

Reference entries were opened in Chromium after hydration, at DPR 1, light
mode, 1440 × 1000 and 390 × 844. Screenshots and DOM measurements remain
private in `/tmp/bricklane-templates-layout/workflow-reference/`.

| Entry            | Reference                                                  | Before                                                                               | New shared layout                                                                          |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Flowly dashboard | 63px rail; inset x63/y8, 1369 × 984                        | Hand sidebar 64px; inset 1368 × 1091; document scrolling                             | Real 63px Sidebar; inset 1369 × 984; content scrolls internally                            |
| Flux overview    | 256px sidebar; inset x256/y8, 1176 × 984                   | Inset height 1302; page scrolling; provider only wrapped selected nested navigation  | Real 256px Sidebar; inset 1176 × 984; provider owns all navigation                         |
| Lucent overview  | 256px sidebar; sticky 1000px container; document scrolling | Hand sidebar stretched with the full 1671px document; account drifted below viewport | Sticky native Sidebar; account and lower navigation stay visible during document scrolling |
| Tempo home       | 250px sidebar; 1000px scrolling main pane                  | Hand sidebar 248px; main document height about 1300px                                | Native 250px Sidebar; main pane owns its scrolling                                         |
| Mesh home        | 48px rail plus 1px separation; inset x49                   | Hand rail; inset x48                                                                 | Native rail; inset x49; document scrolling retained                                        |

Flowly's Header/Content/Footer measure 52/852/80px, and Flux's
56/876/52px, matching the reference at the measured desktop viewport. The
actual free Sidebar handles collapsed gaps of 64px for Flux and 48px for
Lucent/Tempo. Flowly and Mesh keep their permanently compact rails.

The previous flex column compressed Flowly's workflow table instead of
allowing the content to scroll. Content children now retain their natural
height. No table rows or assertions were removed to make the viewport fit.

The actual mobile drawers were opened and measured separately: Flowly and
Mesh use 49px icon rails; Flux, Lucent and Tempo use 75vw (292.5px at 390px).
Their references have no close icon, so the shared Sidebar API disables only
that button while retaining Escape, overlay dismissal and focus restoration.
Flowly has no mobile sidebar header; Mesh has a 48px header. The Sheet
consumer explicitly uses its Sidebar width variable so the default Sheet
width cannot override the compact rail.

Flowly's phone card header retains the real CardAction column, keeping Now
on the right and the health rows visible. Its Invite button now has a real
Lucide icon at compact sizes. The existing controlled dialog accepts an
optional return-focus reference, so Escape returns focus to Invite rather
than leaving focus on the page body.

A deeper original-config exported-project production check found a new
mobile Projects regression: Mesh's header actions extended to x394.84 at a
390px viewport, while the old layout and live reference both stayed at390.
The template's existing Ask AI, Share and New task controls already contain
real SVG icons. A Mesh-only mobile density rule now renders those controls
as28px icon buttons, matching the reference and keeping their accessible
names. No control, horizontal board access or document overflow was hidden.
The added Projects → New task regression also checks the actual task form;
the final three affected mobile tests passed.

Reference navigation typography was measured separately: 14px/20px,
normal inactive labels and 500-weight active labels. Flux has 36px rows;
Lucent and Tempo have 32px rows. Original Bricklane branding and licensed
replacement artwork remain intentional differences.

## Browser and source verification

- The initial native-layout and existing Workflow/Infrastructure regression
  run passed 47/47 against the isolated candidate.
- A further 22/22 run passed native navigation, mobile focus, real source
  view/Copy/download, mobile command search, and actual Customize UI changes
  through Default → Serif → Mono → Reset for all five mobile Sidebars.
- Flux's nested Search popup retained its query while body fonts changed,
  returned focus to its trigger, and left the underlying mobile Sheet open.
- Ten initial desktop/mobile captures reported no page errors, console
  errors or failed HTTP responses. Final captures are refreshed when the
  shared dependency snapshot is finalized.
- A real UI download contained the actual split Shell, CSS, native free
  components and Pro Block dependencies byte-for-byte. The archive retained
  `REUI-LICENSE.txt`, Inter's OFL and the 1615-byte licensed portrait
  attribution. New downloads use the test output directory.

Two earlier command tests failed because isolated dev candidates shared
Vite's default `node_modules/.vite` cache through a dependency symlink.
The private candidate now has its own cacheDir and React dedupe. This was
a verification-environment correction, not a product fix. The original
failure logs remain available. The first full build attempt has no confirmed
completion and is not counted as a pass.

## Pending release gates

The final shared font/API snapshot belongs to the Theme owner. This batch
uses that owner's `SidebarNavigation.menuClassName` consumer API for the
192px collapsed menus, preserving default widths for other consumers.
The source files for those shared adapters are not owned or overwritten
by this batch.

The final TypeScript/production build and downloaded-project build await the
coordinator's serial build window. No push or deployment success is claimed
by the browser-only results above. The final immutable release manifest will
record dependency hashes and the actual final ZIP hash.

## Remaining fidelity work

- Tempo and Mesh need their actual five-section account settings dialogs
  instead of the old generic WorkspaceSettings route. A separate consumer
  batch reuses the controlled Settings Pro Block panel with each template's
  real field schema and explicit save/cancel model.
- Flowly's ten settings routes, Flux's settings routes, Lucent's settings
  page and Echo's seven-section inline account page need distinct consumers.
- Current account/footer actions still include older simplified behavior.
  They must not be described as fully matching the reference menus.
- Tempo's task/report sub-navigation and Lucent's service actions retain
  their existing domain consumers. Their further leaf-level refinement is
  separate from this shared layout migration.
- Echo has an independent layout and is outside this shared Shell batch.
- Card charts, service glyphs and dashboard fixtures have visible remaining
  differences. No original paid screenshots, avatars or extracted SVGs are
  distributed to conceal those differences.

Official references:
[Flowly](https://flowly-app.reui.io/dashboard),
[Flux](https://flux-agentops.reui.io/),
[Lucent](https://lucent-devops.reui.io/),
[Tempo](https://tempo-tasks.reui.io/home),
[Mesh](https://mesh-whiteboard.reui.io/home).
