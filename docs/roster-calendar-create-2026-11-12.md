# Roster calendar creation checkpoint · 2026-11-12

Status: the final production candidate passed both calendar cases, including the sample-time-zone correction, at desktop and phone widths. The coordinator also completed the Roster source/export case on the final candidate. Sixteen existing functional cases passed on the earlier production candidate; they were not repeated by the Roster developer after the sample-time-zone follow-up. Desktop public-reference differences are recorded below; its phone inspection remains pending. No commit, push or deployment result is claimed by the Roster developer.

## Reproduced problem and change

On the development preview, opening Time, navigating to August 2026, selecting August 14 and submitting an event produced zero matching events in August and one in July. The old consumer discarded the month and year from the free calendar's slot callback and reconstructed the event in July.

The consumer now retains the actual `EventCalendarSlotInfo`, including its date, optional end and all-day state. New events use unique IDs and a root-owned array, so adding another event on the same day does not replace the first one or a sample event. Existing Notes input is stored on the event and displayed in its detail Sheet. Detail dates come from the clicked occurrence. An event titled `New event` opens its details rather than the creation form. The creation form also displays the selected date.

Changes are confined to `roster.tsx`, `roster-calendar.tsx`, the Roster calendar test and the Roster source/export test. The main coordinator separately added the existing calendar implementation to the Roster source choices. No shared component or other template was changed by this developer.

## Actual free component reuse

- Existing official free ReUI `EventCalendar`, `EventCalendarContent` and `EventCalendarNav` still provide rendering, date navigation, month/week/day/agenda views, slots and event interactions.
- The implementation directly consumes the free calendar's `EventCalendarSlotInfo`, `EventCalendarOccurrence`, `CalendarEvent` and `toZoned` APIs. It supplies only the local event data and form callbacks; no date-grid, navigation or interaction engine was recreated.
- Existing project Modal and ReferenceSheet compositions retain their native Dialog/Sheet dependencies. Existing Streams controls retain their native DropdownMenu checkbox items.
- Existing Bricklane branding, local portraits, MIT/OFL and third-party notices remain. No original paid screenshot, avatar or extracted artwork was added.

During the earlier development session, the public reference site and official registry request were blocked by a network CONNECT 403. The resumed executor has the reference domains permitted and enforced, and the desktop reference has now actually rendered over verified TLS. Installed free implementation contracts were inspected directly. The comparison below records observed differences; it does not certify complete original-reference visual fidelity.

## Earlier development evidence

Browser plugin not available; the permitted fallback was installed Playwright with `/usr/bin/chromium` and `.qa/onboarding.playwright.config.ts`. Development URL: `http://127.0.0.1:5173/#/template-preview/roster`.

- A direct development reproduction recorded August event count 0 and July event count 1 for an event created from August 14.
- Baseline desktop 1440×1000 and phone 390×844 screenshots were captured. The dashboard at both widths and the phone August calendar were actually viewed.
- After implementation, the first desktop test reached two visible August 14 events, the correct detail date, the saved notes and the reserved-title event's detail state. Its calendar and notes screenshots were actually viewed. The run then failed because the test's unscoped Close locator matched both the Sheet's footer and native close control. The locator was corrected to the footer; this was a test correction.
- The first phone case and the next development batch stopped at `Loading workspace…`. The second batch also reproduced that loading failure in an existing free-controls case. The coordinator observed the same loading problem across templates. The batch was interrupted and no full browser-suite pass is claimed.
- Strict TypeScript with a temporary configuration including both changed source entries and their transitive dependencies passed with no diagnostics. No standalone or whole-repository build was run by this developer.
- Scoped `oxfmt --check`, `oxlint` and `git diff --check` passed before this checkpoint document was added. The document is included in the final scoped formatting check.
- An independent read-only GPT-6.1 sol xhigh review found no blocking issue. It confirmed the real slot/date/end/allDay contract and the exclusive end calculation using `addDays` on the original zoned date.

Development evidence remains outside the repository under `/tmp/roster-qa/`. Earlier partial and failed runs are retained in `native-v1` and `native-v2`; they must not be described as production evidence.

## Production evidence after the environment resumed

The resumed executor's hostname was verified as `a7516a9949de` before any repository mutation or test. The coordinator's existing production preview at `http://127.0.0.1:5175` returned HTTP 200. The two changed implementation files matched the source test's frozen hashes before the run. The coordinator supplied the already-built candidate; the Roster developer did not rebuild, install dependencies, start another server, or publish content.

Browser plugin not available; the existing Playwright fallback used `/usr/bin/chromium` with `.qa/onboarding.playwright.config.ts`. The exact production flow was `/#/template-preview/roster` → Time → August 14 slot → two new events → details and notes → Streams filtering → cancel September creation → navigate away and back.

- The complete batch ran with one worker, zero retries and the existing budgets: **18 passed, 1 failed** in 2.1 minutes. The two new calendar cases, eight existing free-controls cases and eight existing settings-file cases all passed. The settings file includes its existing Pulse shared-mobile-navigation regression.
- The new calendar cases passed at 1440×1000 and 390×844. They verified August creation, two same-day events, notes, the `New event` title, Streams filtering, cancellation, retention across navigation, page title, meaningful rendered content, no Vite overlay, no console warnings/errors or page errors, and no horizontal overflow.
- All four production screenshots (`calendar-1440.png`, `notes-1440.png`, `calendar-390.png`, `notes-390.png`) were actually opened and viewed. Both events appear on August 14. Desktop and mobile details show `14 Aug 2026` and the complete saved notes. The phone calendar truncates event titles to the available cell width; the detail Sheet exposes the complete title and text. No clipping of the page or overlapping calendar controls was observed.
- The source/export case failed at the first native `Template source file` click in `fidelity-next-source.helpers.ts:66` after 5 seconds. The failure snapshot shows the listbox already open. An isolated, one-worker, single-case rerun with the original budgets and assertions failed at the same action in 8.6 seconds. Therefore the failure cannot be attributed solely to concurrent browser activity. No timeout, force-click, readiness bypass, helper or shared source UI was changed.
- This source failure occurred before the full DOM-source, real clipboard, single-file download and original ZIP checks. That earlier run did not pass those assertions; the separate final-candidate result is recorded below. The frozen implementation hashes themselves matched. This initial run did not establish the shared selector/highlighter's exact performance or lifecycle cause.
- Scoped `oxfmt --check` on the five Roster-owned files, `oxlint` on the four TypeScript files and `git diff --check` passed on the resumed executor before this production evidence was added. The document is included in the final scoped formatting check.

Production artifacts remain outside the repository under `/tmp/roster-current/production-19/`. The original failure trace and error context remain there. The independent failed source rerun is retained under `/tmp/roster-current/source-isolated/`; neither directory replaces or relabels the earlier development evidence in `/tmp/roster-qa/`.

Key earlier-candidate command: `PREVIEW_URL=http://127.0.0.1:5175 npm test -- --config=.qa/onboarding.playwright.config.ts --workers=1 --retries=0 --output=/tmp/roster-current/production-19 tests/roster-calendar-native.spec.ts tests/roster-free-controls-native.spec.ts tests/templates-roster-settings-round3.spec.ts tests/roster-source-original.spec.ts`.

## Final-candidate verification

The coordinator reported a successful complete default/Base double build and supplied the final preview at `http://127.0.0.1:5175`, including the sample-time-zone correction below. The Roster developer reconfirmed hostname `a7516a9949de` and both frozen implementation hashes, then ran only the two calendar cases with one worker, zero retries and their unchanged budgets. The result was **2 passed in 28.7 seconds** (desktop 14.3 seconds, phone 11.6 seconds).

The final cases verified all earlier calendar flows plus actual sample-bar boundaries: Abena stops July 30, Priya's exclusive August 1 end occupies July 29–31 only, and Marco occupies August 3–6 with August 6 shown in its detail Sheet. Both August 14 additions, saved notes, the reserved `New event` title, Streams filtering, cancellation and retention after navigation passed. Page identity, meaningful rendered content, no Vite overlay, no console warnings/errors or page errors, and no horizontal overflow also passed at 1440×1000 and 390×844.

All eight final screenshots were actually opened and viewed: `samples-july`, `sample-detail`, `calendar` and `notes` at each width. They show the corrected sample ends, the two August 14 additions and complete notes in the detail Sheet. Phone calendar titles truncate within the date cells; their full values remain readable in details. Evidence is retained outside the repository at `/tmp/roster-final-calendar-2026-11-12/`.

Final calendar command: `PREVIEW_URL=http://127.0.0.1:5175 npm test -- --config=.qa/onboarding.playwright.config.ts --workers=1 --retries=0 --output=/tmp/roster-final-calendar-2026-11-12 tests/roster-calendar-native.spec.ts`.

After its separate shared-source UI work, the coordinator reported that the unchanged Roster source/export case passed on the final candidate. This developer read its proof JSON at `/tmp/reui-final-source/roster-source-original-Ros-a148a-ngle-files-and-original-ZIP/roster-source-four-way-proof.json`: both current implementation hashes match the actual DOM source, real clipboard, downloaded single files and unchanged original ZIP members. The original archive contains 258 members and has SHA-256 `006b2bfa84b4ae3cc4fdb55673b6f6d0517d443abcc3ad996996bc034ffd7f13`; the proof records no page errors. The coordinator's four-case source batch finished with two passes and two failures, so no all-source-suite pass is claimed. The Roster developer did not rerun the source browser case in this final calendar window.

The first candidate's two source failures remain valid historical evidence under `/tmp/roster-current/production-19/` and `/tmp/roster-current/source-isolated/`. They are not relabelled as final-candidate failures or removed.

## Public-reference observations

The public `https://roster-hr.reui.io/` returned HTTP 200 and rendered title `Roster` at 1440×1000. Its actual dashboard, calendar and existing Ingrid leave detail screenshots were opened and viewed. The external browser used `/usr/bin/chromium` outside the filesystem sandbox with the inherited `HTTPS_PROXY` (or `HTTP_PROXY`); certificate verification remained enabled. The shared source-gate verification then took the browser window, so no phone-reference result is claimed yet.

No reference event was submitted. The calendar/detail probe blocked all HTTP methods except GET, HEAD and OPTIONS and used only navigation, an existing event, an empty August 14 slot and Escape. The empty-slot action did not produce a dialog within the probe's 10-second observation; this is not evidence of reference creation or date persistence. Private reference screenshots and the probe scripts remain only under `/tmp/roster-current/reference-*` and are not redistributed in source or exports.

| Observed public reference                                                                          | Current local evidence                                                                                                 | Disposition                                                                                                                  |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Calendar appears in Dashboard; Time expands to Time off and Timesheets.                            | Existing local Time opens a full-width Team calendar, and Dashboard also includes the calendar.                        | Existing navigation/layout difference retained; this date-fix batch does not rebuild Time routes.                            |
| Existing Ingrid detail shows `13 Jul - 14 Jul`, All day, 2 calendar days and a compact row layout. | Local detail uses sections, formats dates from the actual clicked occurrence, and supports new-event notes.            | The current section layout is retained; complete visual equivalence is not claimed.                                          |
| Clicking the August 14 empty dashboard slot produced no dialog within 10 seconds.                  | Local August 14 opens a form displaying the selected date; creation, same-day additions and notes pass at both widths. | Local creation is validated independently; reference creation behavior remains unverified and no remote event was submitted. |
| Marco's sample bar spans August 3–6; Abena's sample bar stops July 30.                             | The first production candidate's sample bars span August 3–7 and stop July 31 respectively.                            | The authorized time-zone correction now matches both observed endpoints at both widths; final cases and screenshots passed.  |

## Sample all-day time-zone follow-up

Public comparison exposed that the existing samples used system-local `new Date` while the calendar displays Asia/Shanghai. A system-local midnight is not necessarily a logical midnight in the displayed calendar; an exclusive end at 08:00 in that zone incorrectly occupies the following day.

The follow-up uses the existing `@date-fns/tz` `TZDate` constructor already used by ReUI EventCalendar. All sample starts, exclusive ends and the default anchor are constructed directly in `rosterCalendarTimeZone`. The logical dates and event durations are preserved; no fixed offset or extra day subtraction was introduced. Existing additions still consume the calendar's actual slot dates.

The two calendar cases check rendered event-bar boundaries for Abena (July 27–30), Priya (July 29–31, excluding the August 1 end) and Marco (August 3–6), plus Marco's inclusive end in its detail Sheet. These assertions measure actual rendered boundaries against date cells rather than reproducing the date-construction function. Both final-candidate cases passed. The source test's calendar hash is `3e230c355f5198383081b29a7e649d852b060a1edac57fa75f98efd932308f51`; the root Roster implementation hash remains `614c7c5849c3ed5275a7d4d27412d144eccb7078c6c7af9803425964d3368b39`.

## Remaining checks

The phone public-reference inspection remains pending; local phone behavior is verified. Week/day timed creation, explicit browser time zones, month/year creation boundaries, a final-candidate repeat of the sixteen older functional cases, and a newly downloaded project's independent install/build remain unverified by this developer.

Calendar-local drag positions and stream/view state were retained. This change adds no reload persistence or remote calendar service.
