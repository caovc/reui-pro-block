# Schedule fidelity recheck — 2026-10-22

This record supersedes the first pass after the user reported substantial visual and interaction differences. The first pass's successful render tests did not establish fidelity: several entries still used an unrelated host/sidebar layout and invented confirmation cards.

## Rebuilt surfaces

| Entry | Observed public structure and initial size                                                                            | Observed behavior reproduced                                                                                                                                         |
| ----- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | 896×422 calendar/appointment panel, June 10, six actual event records, status dots and attendee avatars               | Status filter and empty state; month/year/day; attendee popover. The reference keeps the June 10 event list when the heading date changes.                           |
| 2     | 448×334 range card, Alex Johnson portrait/header, 09:00–10:00, ten exact duration presets                             | Time menus, presets, Apply changes the original footer to Confirmed, Cancel restores defaults. Removed the invented saved-card replacement.                          |
| 3     | 512×803 meeting card, June 30/10:00/30 min/Every week, runtime timezone text, calendar/scrolling slots above the form | Duration/recurrence, title/description, switches, disabled noon slots. Submit changes the existing button to Scheduled while retaining the form; Cancel resets it.   |
| 8     | 384×690.48 compact agenda, June 9, colored day dots, six category filters, 180px scrolling event list                 | Category/date/month/year selection, actual event lists, attendee popover, keyboard navigation and empty state.                                                       |
| 9     | 512×472 session picker, empty date and five duration choices                                                          | Twelve-hour slots, duration-dependent availability, Reset, Booked footer while keeping the calendar and slots. Removed the invented replacement confirmation screen. |

Desktop frames start at y80. The same Inter Latin variable font as the public preview is bundled locally and applied to both surfaces and portalled controls. Current artwork policy supersedes the earlier portrait comparison: all Schedule portraits now use locally authored `demoAvatar(name)` SVG illustrations, with initials as fallbacks. The Schedule components themselves no longer import or load original preview photographs; application-family source assembly and archives can still include cross-scope legacy resources until coordinated cleanup finishes. Official free component MIT notices and font OFL files remain intact.

Add/event-title controls that produced no change in the real reference were not given invented dialogs. Their observed placeholder behavior is preserved. The final independent screenshot/text comparison caught a loading-state mistake in Range 2: the public preview does have an Alex Johnson portrait. That historical reference observation is retained, but the current Bricklane implementation deliberately uses its original illustrated avatar instead; tests protect visible, embedded SVG artwork. AJ remains a loading/error fallback.

## Evidence and checks

Public references are `https://reui.io/preview/base/schedule-{1,2,3,8,9}`. Before/reference/after and interaction captures are under `/tmp/reui-fidelity-review/`; agenda metrics and screenshots are in its `agendas/` directory. Reference and implementation were inspected together using view_image, at desktop and 390px. Geometry, typography, copy/data, colors, icons, calendars, scrolling and changed states were compared separately from functional checks.

A frozen production snapshot over baseline `b756955` built successfully and passed 13 combined tests (40.9s), including five booking and two agenda regressions, after the final portrait correction. The final empty-state adjustment also passed its focused two-test production rerun. Scoped oxlint passed. Tests now protect observed interactions rather than the first pass's invented confirmation screens. The snapshot avoids state loss from other chats' ongoing Vite hot updates.

## Explicit remaining limits

- At 390px the meeting calendar scales to show seven days, while the reference crops the rightmost days; the session header wraps more cleanly than the reference.
- Lucide substitutes for the original icon family. Full time-menu viewport/animation parity, dark mode, every timezone and every date/year are not certified.
- The same-day range picker rejects reversed/cross-midnight ranges, unlike the reference's unchecked handler.
- June 14–20 agenda participant details and the full year-option range were not completely captured. All named participants, including Nina Patel, now receive deterministic locally authored demo illustrations; they are intentional artwork substitutions, not claims of matching the reference photographs.
- Schedule 4/5/6/7/10 have not received this detailed recheck. These results do not establish complete catalog fidelity.

Implementation: schedule.tsx dispatches to schedule-booking.tsx/css and schedule-agendas.tsx/css. Existing unrelated entries retain their previous implementations. No release or deployment is claimed by this record.

## Official free-component follow-up

The user required actual ReUI free-component reuse. See `reui-schedule-reuse.md`, `reui-schedule-provenance.json` and `audits/schedule-agendas-reui-reuse.md` for upstream hashes and invocation chains. Official Frame/TimePicker, the free c-calendar-8 composition and official Badge/IconTile now replace duplicated foundations. Stock Calendar/Button/Avatar dependencies are named as such. The new calendar removes the handwritten date grid and keyboard navigation rather than merely changing an import. The seven-entry combined production candidate passed 14 tests (37.3s), including native Home/End and real month/year operations; both sampled standalone exports built successfully. Existing icon, mobile adaptation and secondary-data limits remain.

## Original artwork follow-up

Schedule booking and agenda surfaces consume `src/lib/demo-artwork.ts::demoAvatar` for every visible and popover attendee image. The former imported photograph mapping has been removed. Five Schedule-only JPEGs were deleted after checking repository references; eight shared legacy JPEGs were retained temporarily because other block scopes still imported them. See `src/blocks/application/assets/README.md` for that boundary. Source/asset cleanup outside Schedule is coordinated by the primary agent. Component layouts, official free ReUI reuse chains and interactions are unchanged; matching original portraits is intentionally outside the current policy.
