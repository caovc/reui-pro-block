# Parent integration handoff (not a working-tree patch)

The parent owns `drive.tsx`, the hash adapter and SourceTargets. No current running candidate was edited.

1. Keep the mounted file models and dialogs. Call `useDriveSettingsModel` once at Drive leaf scope; its optional `onProfileNameChange`/`onWorkspaceNameChange` callbacks feed the existing footer name and header workspace switcher text. Keep avatar/logo out of this mounted model.
2. Parse controlled routes in the parent adapter and pass `section`, `memberSlug`, `navigation.href/onNavigate`. A native href is required even when the normal click delegates to React. Preserve globalTheme query settings and real Back/Forward/Refresh. `DriveSettings` has no router globals.
3. Render `DriveSettings` only for the four roots or team member suffix. Pass actual current file records and the existing file-detail opener. The host page key handles route-local draft/media unmount; the model remains mounted outside.
4. Use `DriveLayout activeApplication` appropriate to the parent route, `profileName={model.profile.fullName}`, and the `profileMenu` footer slot. `DriveProfileMenu` is intentionally rendered inside the existing SidebarProvider, calls its real useSidebar only to close mobile after normal route selection, and owns no second Sheet/provider. Default Layout callers remain compatible.
5. Pass controlled `theme/onThemeChange` to DriveProfileMenu from the existing theme model, and real `loginHref/onSignOut`. Do not add a success authentication toast or fabricate network requests. The ordinary root Drive action must still return to files.
6. Wire `pricingHref/onPricing` to the actual pricing route/consumer. Do not fall through to the previous generic modal or two unrelated plan buttons. Independent plan switching remains a separate evidence gap; no checkout/backend is implied.
7. Apply the exact missing dependency `react-phone-number-input: 3.4.18` only in Root's approved dependency window; its license/transitive metadata are in M0 free-registry. Do not replace it with a homemade flag/input.
8. Source preview primary may stay the actual Drive leaf, with secondary entries for DriveSettings, Profile, Workspace, Team/member detail, Billing, model/data/free/options/downloads/menu/layout/CSS and official PhoneInput. The consumer imports an exact first-party SVG at `drive-settings-free/bricklane-logo.svg`; actual collector/ZIP must include it and current canonical ReUI MIT/font OFL/demo artwork attribution. SourceTargets/source collector are parent-owned, not patched here.

Pending test command after approved integration only:

```sh
PREVIEW_URL=http://127.0.0.1:<approved-port> npx playwright test tests/templates-drive-settings.spec.ts --workers=1 --output=/tmp/<unique-drive-settings-output>
```

The spec has 24 actual-main cases, currently unexecuted. It does not start a server. Later focused cases must additionally verify preferences save/Cancel, Phone country input/search/formatting and popup viewport bounds, pagination/sorting, clipboard, local invitation/role/remove/Undo, mobile link touch/keyboard/focus visibility, pricing route and existing file default regressions. TypeScript, production strict, true UI export byte/license audit and standalone exported flows remain required gates.

## Clean f755 private installation checkpoint

The original33-file static proposal and all its evidence remain immutable. This separate clean candidate starts at f755f99c63d3e4d268a46c0eac53102d331e81de, verifies the c7e8af48 Drive leaf baseline, and applies only the two filespace/filebox SourceTargets entries. It does not copy Root working-tree changes or alter shared collaboration/settings.css.

A normal registry install added exact react-phone-number-input3.4.18 and eight transitive locked packages; country-flag-icons resolves to1.6.20. Existing locked package entries are unchanged. Full licenses for all nine additions are retained in assets/drive-phone-LICENSES.txt, including the actual flag license. Original postinstall and prepare scripts ran explicitly after npm add omitted root lifecycle; Husky reports no.git in this clean archive and no shared Git state is changed. The PhoneInput source comment now points to those resolved notices; runtime code is otherwise the frozen proposal.

Installation and static checks do not establish semantic typechecking, production build, browser fidelity or Source/ZIP success. Root must grant a single main compiler window after reviewing this candidate. Help and Notifications remain the old modal/toast and require separate implementation; Personal after-switch Pricing and edited Billing fields after a plan switch remain unobserved and are not guessed.

## Drive layout repair after the first production audit

The original clean f755 build finished successfully, but its first 45 browser
cases produced 36 passes and 9 failures. Those results and the immutable production
artifact remain preserved; this repair does not retroactively replace that run.
The repair is prepared against clean parent
`1e578edd95e89a490a30c22381b722e228a9fefb`, without copying shared workspace changes.

The consumer now uses the real ReUI FieldGroup and FieldSeparator between actual
Pro SettingsRow / SettingsFields rows, and retains each field's IDs, values,
callbacks and errors. FrameFooter lays out its actual native 32px action buttons
in a row. The existing ReuiSidebar and AppShellInset composition remains in use.
Pricing uses the same real padded scrolling root as settings. Profile navigation
closes its controlled native DropdownMenu for ordinary selections and retains
normal href behavior for modified clicks.

Team keeps the actual DataGrid provider around its Frame and places the actual
DataGridPagination in FrameFooter. Its dense rows, responsive column visibility,
search/filter toolbar, separator and pagination select follow the measured
reference. Column size weights 300/180/120/50 are inferred from the measured
324/194.39/129.59/54.02 pixel proportions; this is not a claim to know private
upstream source. Workspace Summary is two information rows with a real Separator
and a right-side small Active Badge. Billing Summary uses three equal grid rows
on phones, three columns on desktop, correct typography and native Badge variants.
No card receives a compensating fixed height or spacer.

The existing official avatar upload adapter gains only optional ReactNode
`changeLabel` / `removeLabel` props, defaulting to its original `Change` / `Remove`
strings. Drive passes real Lucide icons with its labels; upload hooks, local Blob
handling, errors, drag/drop, disabled state and callbacks are unchanged. The
original local default portrait remains. The actual PhoneInput receives its
native `Enter phone number` placeholder; its SDK behavior is unchanged.

Fixture corrections preserve the original assertions and tolerances: choosing a
country checks the real phone-number input focus; Escape still checks the country
trigger. Workspace-menu size checks await the native finite animation to settle.
Only the two Customize cases use the actual workspace preview host. Product
behavior is not changed to satisfy those fixture mistakes.

This checkpoint has static formatting, lint, syntax and local-import checks only.
A new strict build, original production cases, settled desktop/phone comparison,
source/clipboard verification and actual downloadable-project verification remain
required. Help/Notifications improvements are a separate prepared milestone and
are not included. Existing Account/Workflow avatar consumers require their
original regression cases because the adapter has a new optional API. Shared
free/Pro defaults, original artwork and complete MIT/OFL notices remain protected.

Team's narrow follow-up preserves the measured compact phone row: role12/16,
actual 4px bullet and actual sm Status Badge in an 18px flex row after a 2px top
margin. Dense edge cells use the existing edgeCell API with 20px first/last insets;
only the Role column has a 2px gap between its two desktop lines. Owner access uses
the measured primary-light Badge classes; Limited and Invited use the warning and
neutral presentation seen in the reference. Presence dots are still a known gap:
membership status is not online presence, so the preview does not invent a mapping
from Active/Suspended to the reference's independently colored presence indicator.
The saved/open-seat Badge retains its existing model and now renders the observed
ArrowDown alongside the already observed over-capacity ArrowUp.

### Pricing and intermediate-width follow-up before the repair build

A personally viewed mobile reference/production pair exposed an additional real
layout gap after the first repair freeze. That freeze remains untouched. A second
candidate replays all its 37 files exactly before this narrow follow-up.

The phone PlanHeader now uses an actual FrameTitle at the left of a real flex row
and native small Badge(s) at the right. The popular phone Badge no longer uses the
desktop ribbon's class or its positioning overrides. Mobile content order is title,
description, price, real Button, note. The measured roles are title18/28,
description14/20 with4px top margin, price30/36 with16px top margin and6px baseline
gap, suffix14/20/500, Button36 with20px top margin, note12/16 with12px top margin.
FrameHeader padding remains24px20px; its expected236px height comes from content,
not a fixed height. The original plan conditions/callbacks remain. The combined
Current plus Most popular state after switching plans was not separately observed.

Desktop retains its centered title, top ribbon and note-before-button order.
The measured6px price gap and note8px top margin/16px line-height are restored;
their previous4px margin/20px line-height happened to have the same total height.
The page subtitle uses its measured margin0,max-width672px and14/22.75 typography,
which also naturally restores the phone card's vertical position inside ds-root.
All of these are consumer changes to the existing real ReUI Frame/Title/Description,
Badge and Button; no shared primitive changes or extracted vendor assets are used.

The inline Team role/status row now uses md:hidden to align with the existing
768px useIsMobile visibility of its desktop columns. This avoids losing both
representations between640px and767px. A natural700px production observation is
required after the approved main build, alongside the original390/1440 cases.

### Billing residual corrections after v3 production verification

The v3 original strict build passed and all original47 selected browser cases
passed once. Its settled production comparison exposed remaining Billing visual
differences; those successful functional checks are preserved as v3 evidence and
are not evidence of a fully matched Billing layout. The Alert was2px/8px too short;
Setup was7.25px short at desktop and22px too tall at phone. Measured Plan,
Approvers and Seat Selection rows explain the entire Setup difference.

This narrow consumer proposal restores the actual free warning Alert with native
ShieldCheck, AlertTitle, AlertDescription and AlertAction as direct children, and
actual default32px outline/primary actions. The existing Pro Current Plan row
gets its observed14/20 medium right-aligned price and muted14/20 billing note.
Its small Current Badge uses the measured primary-light classes.

Approvers now consumes the actual official c-combobox-19 pattern fully: native
Avatar16, rounded native Chip with6px gap, native ChipsInput, and actual free Item
rows with Avatar/ItemContent/ItemTitle/ItemDescription in the anchored popup.
Existing controlled IDs, selected values, data and callbacks remain; avatar media
comes exclusively from original local demoAvatar. Option aria-labels preserve the
existing member-name contract. The native chip input is excluded from the Drive
textbox width100%,min-width0,height/min-height32 overrides; its genuine min-w-16
and flex-1 remain, with measured phone16/24 and desktop14/20 typography. It is not
given a compensating container height. Placeholder is the observed Add approvers...

Seat cards now actually compose the official free c-checkbox-9 FieldGroup,
FieldLabel, horizontal Field, Checkbox, FieldContent, FieldTitle and Description.
This also matches the existing real ProjectLabelCards free adapter pattern in the
repository; its unrelated project-label data are not reused or renamed as seats.
The original exclusive nullable seat callback remains. Stable checkbox IDs and
FieldLabel htmlFor provide native label behavior. The floating20px circular
indicator is a Drive-only positioning adaptation of the actual Checkbox, retaining
its native Indicator, focus and keyboard state; no handmade check SVG or event
handler replaces it. The genuine FieldLabel child padding is10px, grid gap12,
content gap4, title14/20/500, description14/20/400. Old bare-Label border,padding16,
strong700 and fake checked-accent presentation are removed. No card is forced to
86px/66px: content and the real free component produce its height.

Official free text-only provenance is archived privately in
/tmp/bricklane-drive-billing-residual-v1/free-c-combobox-19.json and
/tmp/bricklane-drive-seat-free-review/c-checkbox-9.json. The complete required
ReUI MIT and font OFL notices remain part of the source export. No reference
portrait, paid screenshot, logo or extracted SVG is included in runtime/package.

A separate read-only control audit confirmed the RichChoice description selector
also hid the native Select Chevron SVG. That rule is now limited to the selected
description span; the actual native Chevron is preserved and popup descriptions
remain visible. Direct Switches override the reused Pro panel's flex-start only
at desktop768px and above; the observed phone alignment remains flex-start.
Drive-only card title600/description14 tokens and inactive navigation's actual
foreground/60 plus native hover foreground are restored from measured roles.
This is scoped to ds-card / ds-navigation-link, not a global font or SDK change.
The earlier suspected absent USD addon has matching visible DOM geometry and
style in the read-only audit; no width,shrink,padding or replacement-addon patch
is introduced without an established product cause.
