# Schedule 2/3/9: official free component reuse

Audit date: 22 October 2026. The project requirement is to find and actually compose ReUI's free implementations before introducing custom controls. This pass found that the previous Schedule implementation imported stock shadcn primitives and recreated the Frame anatomy, month/year navigation, and time parsing/formatting itself. Those imports alone did not constitute ReUI reuse.

## Actual source and call chains

| Official free source | Installed implementation | Actual consumer |
| --- | --- | --- |
| [Frame registry](https://reui.io/r/radix-nova/frame.json) | `src/components/reui/frame.tsx`, unchanged official file, already installed by the application workstream | `schedule-booking.tsx` uses Frame, FramePanel, FrameHeader, FrameFooter, FrameTitle and FrameDescription for all three blocks. Local duplicate border/background/radius/panel-shadow implementations were removed. |
| [Time Picker registry](https://reui.io/r/radix-nova/time-picker.json) | `src/components/reui/time-picker.tsx`; full official state, parsing, formatting, native form-field and keyboard/column implementation retained. Only its single website icon placeholder is resolved to Lucide ClockIcon. | Range start/end controls run inside TimePicker. RangeTimeChoice reads `useTimePicker().value` and commits via its `setValue`; TimePickerValue supplies displayed text and official hidden form fields carry HH:mm values. All three blocks' time parsing and 12/24-hour formatting use the official exports. |
| [Month Year Select example](https://reui.io/r/radix-nova/c-calendar-8.json) | `src/components/reui/calendar-select.tsx`; controlled adaptation of the actual official Dropdown change-event bridge and DropdownNav composition | BookingCalendar in Schedule 3/9 calls CalendarSelect. DayPicker supplies the month/year options and owns navigation, replacing the separate MONTHS array, manual year list and manual previous/next model. Schedule 1/8's agent also consumes this shared component. |

Exact upstream content hashes, installed hashes and adaptations are in `reui-schedule-provenance.json`. The Frame file was byte-identical to the downloaded official registry content and was not overwritten. ReUI's MIT notice is retained in `src/components/reui/REUI-LICENSE.txt`.

The official Month Year Select example explicitly depends on stock `calendar`, `card` and `select`; the official Time Picker explicitly depends on stock `button`, `input-group` and `popover`. Those dependency files in `src/components/ui` were left untouched. The provenance claim is the actual ReUI free component/example implementation above, not that stock shadcn files have become ReUI components.

## What still needs block-specific code

- The public Schedule 2 preview has a single flat HH:mm Select list. The free TimePicker's ready-made popup provides separate hour/minute/period columns. To preserve the established Pro interaction, the flat view is a custom adapter over the **real official state API and formatter**, rather than a dummy provider around independent state logic.
- Duration presets, recurrence, meeting title/notes, noon availability, local submission and booking summaries are block-specific business composition. ReUI's free time-picker documentation directs a full date/slot/duration/confirmation flow to the Pro Schedule blocks; it does not offer that whole free flow.
- [Date Selector](https://reui.io/components/date-selector.md) was inspected and rejected for this surface: its own guidance says to use Calendar for a single day and Schedule for a day plus time slots. It adds period/operator filtering, not a replacement for this booking calendar.
- Scoped per-block dimensions, responsive stacking, date markings and the already verified labels/confirmation behavior remain consumer styling and data. Free Frame variables and Calendar slots are configured rather than reimplementing their primitives.

No shared `src/components/ui` file or package dependency was changed. No child agent was spawned. The two current AGENTS.md requirements apply to any future delegation; commit/push/deployment for this milestone is coordinated by the parent.

## Validation and release evidence

The migration preserves the measured desktop frames: Schedule 2 is 448×334, Schedule 3 is 512×803, Schedule 9 is 512×472, all at y=80 in a 1280×1000 viewport. Current screenshots are under `/tmp/reui-free-audit/`; pre-migration reference/state captures remain under `/tmp/reui-fidelity-review/`.

Tests keep the original behavior assertions and additionally verify real ReUI Frame slots and TimePicker hidden form values after changing start/end. They also exercise month/year navigation through the official event bridge. The parent coordinates a frozen production run and scoped commit/push after all participating consumers freeze. Shared-workspace TypeScript diagnostics at audit time were outside these files (Gantt/grid/template work); the Schedule/calendar/time-picker files produced no TypeScript diagnostic. The official TimePicker's mixed component/helper exports produce existing-style Fast Refresh lint warnings; the registry logic was not split or rewritten merely to suppress them.

Final local evidence: the range, meeting, booking-state and responsive-render tests passed together; the month/year test then exposed a real pointer interception by the overlaid native nav. After restricting pointer events to its previous/next buttons, that complete month/year test passed (6.6 seconds). Assertions were preserved. A final read-only screenshot pass confirmed the three desktop sizes above, Inter 14px and no page errors; 390px renders have 310px cards and no horizontal document overflow. Images are `schedule-{2,3,9}-after.png` and `schedule-{2,3,9}-after-390.png` under `/tmp/reui-free-audit/`. A complete five-test frozen production run is still the parent's release gate; these split local runs do not claim that gate passed.

Remaining visual limits from the earlier reference comparison remain: the 390px meeting calendar scales to show all seven days, and its icon assets use Lucide substitutions. This migration audits reuse and preserves the previously measured initial states; it does not claim exhaustive pixel identity across every Pro interaction state.

Parent release gate subsequently passed on the frozen production candidate: all **14 combined site/schedule/pricing tests passed (37.3s)**, including the complete five booking tests and three agenda tests. Both actual source ZIP downloads independently built, and four standalone desktop/mobile renders with external HTTPS blocked passed their key interactions. This supersedes the pending gate statement above.
