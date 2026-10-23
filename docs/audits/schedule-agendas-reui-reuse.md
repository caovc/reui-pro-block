# Schedule 1 / 8: official free component reuse audit

Date: 2026-10-22. Scope: `schedule-agendas.tsx`, its CSS, and its focused tests. Shared UI files were not changed by this work.

## Audit conclusion before migration

The previous `AgendaCalendar` rebuilt a date matrix, month/year option state, roving focus, and Arrow key movement with local arithmetic and `requestAnimationFrame`. ReUI's free **c-calendar-8 Month Year Select** already provides the Select-to-DayPicker composition and native calendar behavior. That duplicate implementation was unnecessary and has been removed.

The previous outer double border, status badge, empty icon circle, and attendee overlap also repeated available component behavior. They now use the actual free Frame/FramePanel, Badge, IconTile, and the AvatarGroup/AvatarGroupCount composition rather than renamed wrapper exports.

## Inspected and installed upstream sources

The following command was actually run in an isolated project at `/tmp/reui-fidelity-review/agendas/audit-install`; it did not mutate the application package or shared UI directory:

```sh
npx shadcn@latest add \
  https://reui.io/r/styles/radix-nova/c-calendar-8.json \
  https://reui.io/r/styles/radix-nova/c-calendar-22.json \
  --cwd /tmp/reui-fidelity-review/agendas/audit-install --yes
```

The CLI installed both examples and their Calendar, Select, Button, and Card dependencies. The free [Calendar overview](https://reui.io/components/calendar.md), [Month Year Select](https://reui.io/components/calendar/c-calendar-8), [Event List](https://reui.io/components/calendar/c-calendar-22), and [Avatar Group With Count](https://reui.io/components/avatar/c-avatar-11) were read before deciding which capabilities to reuse.

Import normalization confirmed that this repository's existing `ui/calendar.tsx` and `ui/button.tsx` have the same component bodies as the dependencies actually installed by those official examples: only `cn`'s import path differs. `ui/select.tsx` additionally has a `use client` directive. These are explicitly **the upstream examples' stock dependencies**, not newly authored ReUI enhancements, and were not duplicated into another file.

## Actual reuse chain

| Official free source                                 | Local implementation consumed                                                                                            | Actual Schedule call and responsibility                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `c-calendar-8`                                       | `components/reui/calendar-select.tsx` (adapted by the booking workstream) → existing `ui/calendar.tsx` → React DayPicker | `AgendaCalendar` renders `CalendarSelect` with controlled `selected`/`month`, `onSelect`/`onMonthChange`, and the official Dropdown event bridge. DayPicker owns date generation, available months/years, previous/next navigation, selection, and keyboard movement.                                                                                                |
| Calendar dependency of `c-calendar-8`                | `ui/calendar.tsx::CalendarDayButton`                                                                                     | `AgendaDayButton` renders `CalendarDayButton`; its only additions are the schedule's date dots and confirmed visual classes. No second keyboard or date-grid implementation remains.                                                                                                                                                                                 |
| `frame`                                              | `components/reui/frame.tsx::Frame, FramePanel`                                                                           | `ScheduleAgendas` renders both. The upstream component owns borders, inset padding, nested radius calculations, panel background, and shadow. Local CSS keeps only the measured width and block-specific radius/panel-padding variables.                                                                                                                             |
| `badge`                                              | `components/reui/badge.tsx::Badge`                                                                                       | Appointment rows render `Badge variant="focus-light" size="sm"`. Upstream CVA owns the layout, sizing, padding, font, border, and focus behavior. Local CSS only adjusts the reference's purple tone and 5px radius.                                                                                                                                                 |
| `icon-tile`                                          | `components/reui/icon-tile.tsx::IconTile`                                                                                | Empty states render `IconTile variant="solid" radius="full"`. The upstream implementation owns the 40px container, circular shape, glyph sizing mechanism, and alignment; local CSS configures the muted tone and 20px glyph.                                                                                                                                        |
| `c-avatar-11` composition                            | Existing `ui/avatar.tsx::AvatarGroup, AvatarGroupCount` and Avatar primitives                                            | `Attendees` actually composes both group helpers, plus the existing Popover. Upstream group ring/overlap and count styling replace manually painted group/ring wrappers. A `-space-x-1.5` utility matches the reference spacing. This is reuse of the free example composition and stock dependency API, not a claim that local Avatar was newly vendored from ReUI. |
| Stock dependencies required by the official examples | Existing `ui/button.tsx`, `ui/select.tsx`, `ui/popover.tsx`, `ui/scroll-area.tsx`                                        | Retained as actual dependency/control implementations. They are not relabeled as bespoke ReUI components. No parallel copies were added.                                                                                                                                                                                                                             |

The shared `CalendarSelect` was adapted from c-calendar-8's actual Dropdown/DropdownNav source, with controlled props, accessible month/year labels, portal font classes, and custom DayButton slots. During integration its year detection was corrected by its owner for React DayPicker v10, which exposes labels/options rather than the older `name="years"` convention.

## Checked capability gaps

`c-calendar-22` is a complete free sample composition with three fixed sample events, a Calendar, a CardFooter, an Add button, and colored event rows. It does not expose an agenda data API, date/status/category filtering, attendee slots, or the two Pro preview structures. It was installed and inspected; this audit does not falsely claim that its `Pattern()` export is rendered unchanged. Schedule-specific event data/filtering, colored dots, attendee content, and the confirmed two-column/vertical arrangement remain business composition around the reused controls.

The free sources do not supply the exact Schedule 1/8 event datasets. Previously recorded limitations remain: some later June participant lists were not completely observed, and no full-catalog fidelity claim follows from this migration. All participant images now intentionally use original local demoAvatar illustrations, including popover rows; original reference photographs are no longer consumed by Schedule. No creation/detail dialogs were invented for reference actions that produced no state change.

## Source fingerprints

SHA-256 values taken from the retrieved official registry source content:

| Source                                                              | SHA-256                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `c-calendar-8.tsx`                                                  | `a273b5cbbcdf411ceb3c338d7c5f23480637c5a1210646ebfaafa8be166f6206` |
| `c-calendar-22.tsx`                                                 | `064b15817c8d090433ade51d20ef86a2f3178a21b8113186ef98832f166c48eb` |
| `c-avatar-11.tsx` (previously inspected free Base Nova composition) | `18cab53b4bcfe995e2d0bbadf41b328df28c8802c4ccbf4d8f57554c713cf4c3` |
| `frame.tsx`                                                         | `bec56175281721e00b4d872c13ba7828ae1b849d470fa818835fba24f27a5697` |

At audit time the local shared `components/reui/frame.tsx` SHA-256 exactly matched that upstream Frame source. The isolated installed Calendar dependency SHA-256 was `a9a6c881f9287a5f777531219be6c365ac59dc3e8c502cdbddcdb33b370be1e7`; the import-path-normalized local component body is identical. Shared vendor provenance and license ownership remain with the foundation workstream.

## Verification

- `npx tsc -p /tmp/reui-fidelity-review/agendas/tsconfig.json --noEmit`: passed for this component and its dependency graph.
- `npx oxlint src/blocks/application/schedule-agendas.tsx tests/schedule-agendas.spec.ts`: passed.
- `npx playwright test tests/schedule-agendas.spec.ts --workers=1 --output=/tmp/reui-schedule-agendas-migration-playwright-retry`: **3 passed**. Tests cover both agendas, status/category filters, real month/year menus, previous/next navigation, attendee popover/Inter, mobile overflow, and native Arrow/Home/End/Space/Enter behavior.
- One earlier run was interrupted by concurrent development refreshes (blank Notifications-only render and reset navigation state). The focused rerun passed with stable state; this is recorded rather than representing the earlier failures as successful checks.
- Actual isolated routes were rendered at 1440×1000 and 390×844. Reference and latest implementation screenshots were inspected together. Layout, Inter typography, visible copy, palette, calendar cell/dot geometry, local portrait treatment, borders/radii, and mobile behavior were compared.
- At 1440×1000, Schedule 1 remains 896×422 at x272/y80, with 476×67.5 event cards. Schedule 8 remains 384×690.484375 at x528/y80, with 334×55.25 event cards and its scroll area at x553/y563.484375. These measured dimensions match the confirmed public reference.

Temporary source downloads, CLI installation, comparison JSON, and screenshots are under `/tmp/reui-fidelity-review/agendas`. Production publication and git operations are coordinated by the primary agent; this subagent did not commit or push.

## Original artwork policy follow-up

The official free AvatarGroup composition above remains the actual implementation. Its demo photograph content has been replaced by the shared, locally authored `demoAvatar(name)` SVG generator. This changes imagery only, retains accessible names and loading fallbacks, and adds no remote image request. The previous reference-photo mapping/imports were removed; shared legacy files still used by other scopes are tracked in `src/blocks/application/assets/README.md` pending coordinated deletion. Official reference links and MIT/OFL attribution remain intact.
