# Technician Capacity: first implementation milestone

Status: implementation ready for the parent candidate. No route/catalog/source-target changes, dependency installation, Vite/dev server, build, tsc/strict or ZIP run by this owner. Existing Grouping freezes remain untouched. Root is the only Git publisher.

## Actual free foundation

The main leaf composes the installed official free ReUI `DataGrid`, `DataGridTable`, `DataGridScrollArea`, `DataGridColumnHeader`, native row selection controls and `DataGridPagination`, plus `Frame`, `Badge`, `Alert` and `NumberField`. The existing `useDomainGrid` supplies actual TanStack v9 `useTable`/`dataGridFeatures`; original technician records enter its filtered, sorted, paginated and selected row models. Native start pinning uses `table.setColumnPinning` for select + technician. There is no copied table, external pre-sort/slice controller, duplicate selection model or replacement primitive.

Supporting components follow the free examples: Popover, Tooltip, Sheet, Field, Select, Switch, DropdownMenu, AvatarFallback, ButtonGroup and AlertDialog. Popup focus/keyboard behavior stays with those installed components. All four new implementation modules use static imports so the existing source collector can reach their closure.

Custom code is limited to workshop data/rules, day and utilization renderers, local record mutations and snapshot undo/redo. The free grid has no technician skills, working shifts, booking capacity, leave conflicts or repair-shop utilization ring. The conic ring and tint layers are original CSS; no upstream image, logo, SVG or paid seed/source is included. Existing free MIT/OFL notices must remain in exports.

## Original demo data and scope

Twelve original people, four teams, 565 independently generated bookings across six weeks and one original annual-leave record. Demo today is fixed at 2026-10-16 and the initial two-week shop window begins 2026-10-12, with Sunday omitted. Names, cars, bookings and aggregate values deliberately differ from the public fixture; there is no claim of matching its raw seeds.

The first person is Maya Chen (`tech-1`), a Mechanical mechanic on Mon–Fri. On Fri Oct 16 she has six booked hours of eight, leaving +2h. Her day popup exposes Subaru Outback (2h, In Progress) and Volvo V60 (4h, Scheduled). Her raw booking IDs remain stable through search, team/service/day filters, pagination and numeric utilization sorting. The initial 12-person window totals are 637 booked hours / 856 capacity hours, 248 free hours, utilization rounded to 74%; aggregate free hours do not subtract another person's overtime.

Holiday overrides shifts; off-shift and full leave give zero capacity; zero-capacity utilization is null, shown as an em dash. Booked means exactly capacity, available positive remaining time, overtime negative remaining time. The same calculations drive day figures, header load bars, utilization, next-free labels, booking previews and bulk free-ahead counts. A zero-capacity day with existing work is Overtime (red, negative free hours), not Away; utilization remains null rather than inventing a percentage. Header totals use native filtered records; row utilization uses that person's entire visible date window.

## Working local actions

- Search covers technician name/role/team and raw booking customer, phone, vehicle, plate and service. Team + service capability + day-kind filters are predicates inside the native TanStack model. Native sortable name and numeric utilization headers; page size, page selection and filtered empty state are real.
- Previous/later week rebuild date columns and raw-derived statistics; Today returns to the fixed demo week. The original seed becomes available beyond its booked period rather than inventing appointments by visible row index.
- Add/edit technician; add/edit/move/remove booking; add/edit/remove time off, including atomic multi-person time off; remove selected technicians with confirmation and dependent booking/leave cleanup. All update one raw store.
- Booking validation checks actual date, nonempty customer/car/plate, compatible technician skill, closed shop days and the publicly observed single-appointment 1–8 whole-hour bounds. Assigned work may exceed daily capacity, including an off-shift technician: the form warns and permits saving. Time off retains all existing services and derives overtime from reduced capacity; a multi-person action remains one atomic history change. Shift changes also retain bookings as overtime. A role change that removes a required service capability still asks the user to reassign affected work.
- Every successful mutation, including multi-person deletion, produces one complete store snapshot for Undo/Redo. Visible update notice offers Undo; Ctrl/Cmd+Z and Shift+Ctrl/Cmd+Z work in the grid region and leave form-input editing shortcuts alone.
- View Schedule shows the current two-week days and opens existing bookings/leave for editing. Selection toolbar offers Time Off / Remove / Clear with an actual selected-person free-ahead aggregate.
- Default demo loads synchronously. An optional `loadCapacity(signal)` prop provides real asynchronous loading, validation, error and Retry states with abort handling. The default UI does not expose pretend network/error buttons.

## Geometry targets implemented, not yet browser-verified

Public reference: https://reui.io/preview/base/data-grid-advanced-10?embed=1 . The preceding read-only audit remains at `/tmp/bricklane-grid-advanced-expansion-readonly/advanced10-11-plan.md` with private screenshots/DOM evidence.

Desktop width target 1216 outer / 1214 table; select49 + technician280 + twelve60 day columns + utilization120 + actions45. Mobile table width1084 with technician150; select and technician remain native pinned columns. Day heat buttons fill the cell height through scoped position/zero-padding rules. Header target56px, compact rows45 desktop/41 mobile, comfortable49. Mobile toolbar uses 32px search + 128px team + 144px service, then days/settings; search expands and focuses the real input. Default pagination is the official responsive component. All visual overrides are confined to the new CSS prefix/leaf classes; no global overflow or hidden scrollbar rule was added.

Day popup target352px, settings288px, floating sheets576px desktop / viewport minus32px mobile, with free grouped menus and destructive confirmation. Actual font sizes/styles are kept on the installed components; `th` medium does not override the native sortable button's normal weight.

The parent has now captured the first production screenshots and run the eight browser cases: six passed and two specifications needed the trace-based corrections below. This does not establish visual completion. This owner has not started Vite/build/tsc or another local browser. The first captured geometry and the narrow static style corrections are recorded below; the parent must rebuild and remeasure them before any corrected-pixel claim.

## Gates completed

- Scoped `npm run format --` on the four implementation modules and owned Node test.
- Scoped `npm run format:check --` and `npm run lint --` (oxlint) pass with no diagnostics.
- `node --test tests/grid-advanced-technician-capacity.test.mjs`: 17/17 pass. Tests exercise UTC/month/DST windows, all five states, original seed integrity, zero capacity/null utilization, booking move/whole-hour/skill/closed-shop rules, unrestricted daily overtime totals, partial leave, atomic multi-person leave that retains existing work, zero-capacity overtime and undo, leave editing/removal, shift edits/cascade deletion, whole-store undo/redo and raw search/aggregate consistency.
- `tests/grid-advanced-technician-capacity.spec.ts`: eight browser integration cases. The first parent production run passed six and failed two; the two trace-based specification corrections below await a parent rerun. Cases cover native pagination/name and numeric sorting; composed filters/search/empty Clear; cross-page native selection; a new eight-hour booking taking Maya's day from 6/8 to 14/8 and Undo; full leave retaining both cars as 6/0 overtime and Undo; editing the existing two-hour booking with keyboard Undo/Redo; date Select options/keyboard/Escape cancellation; and 390px expanding search/native pinned columns/horizontal scroll. Every case records console errors and uncaught page errors. Existing runner timeouts/retries are unchanged; there are no skips or leaf-owner service launches. A passed behavioral test does not establish visual fidelity.

### First production trace diagnosis

The parent preserved the original failed artifacts under `/tmp/bricklane-grid-advanced-five-round1/production-results/grid-advanced-technician-c-0eb67-numeric-utilization-sorting/` and `grid-advanced-technician-c-dbe9b-nd-Escape-cancels-the-Sheet/`. This diagnosis only reads those traces/error contexts and installed free component source; it does not rerun a browser or edit the immutable candidate/dist.

The sortable header test clicked Technician, then expected ascending order immediately. With native `columnsPinnable`, the actual free `DataGridColumnHeader` opens its real menu containing Asc/Desc/Pin. The failure snapshot shows that menu open; its modal accessibility handling hides the underlying region from `getByRole`. The specification now chooses the actual Asc menu action for both Technician and Utilization before asserting the same `aria-sort`, first sorted record and numeric order. It retains pagination assertions and makes no change to header/table implementation.

The date test sent Home, ArrowDown and Enter in consecutive trace calls while the free Radix Select defers roving focus with `setTimeout`. The trigger still showed Fri Oct16 after Enter; observing26 rendered options did not establish that focus had advanced to Saturday. The correction waits for the actual Friday option focus, then after ArrowDown waits for actual Saturday focus before keyboard Enter. It retains the26-option count, omitted Sundays, changed ISO-date label, list Escape/focus return, Sheet Escape and uncommitted-booking assertions. There is no forced focus on the destination, click substitution, arbitrary sleep, timeout/retry increase or product patch. The parent's next authorized run must confirm this diagnosis and the preserved cancellation assertions; the failed original run is not reported as passing.

### First visual capture and narrow leaf corrections

The parent's saved `initial-visual/advanced-10-{1440,390}.png` and `baselines.json` measured Compact rows at51px in both viewports, versus public45px desktop and41px mobile. Desktop table height was565px versus504.734px, and mobile565px versus464.734px. Merely setting row/td height cannot shrink overflowing normal-flow cell content. The actual free dense cell adds12px vertical padding plus a border; the desktop avatar is32px, while the two unbounded text stacks and inline name-button line box previously exceeded those budgets.

The name and utilization stacks now use explicit flex columns with14px/12px line heights and2px separation, and the existing name Button removes its transparent border. The content stack is28px, so it fits the mobile41px cell naturally; the desktop32px avatar fits45px. The pre-existing49px Comfortable setting remains available. There is no fixed-height content wrapper, hidden row text, font-size reduction, table renderer replacement or density controller change. The original first browser case now checks45px, switches to49px Comfortable and back; the existing phone case checks41px. Case count stays eight, with unchanged timeouts/retries. Those new geometry assertions have not run.

At identical first-row states, the saved screenshots exposed a hue error: Booked8/8 at(515,220) was local `#ffe1d8` versus public `#ccf2e5`; Available6/8 at(700,220) was `#fff2f3` versus `#ebfaf5`; Holiday at(450,220) was `#fff0f2` versus `#fdf6e3`. The public DOM records Oklab alpha backgrounds. Leaf CSS now mixes the existing emerald500 at20%/8%, red600 at9%, muted at70% and yellow500 at11% with transparent in Oklab, preserving semantic tokens, underlying row interaction and theme behavior. This replaces the Oklch hue interpolation against background that turned the green/yellow fills pink. Bookings, leave, overtime classification and fixture values are unchanged; new pixels await the parent's rebuild.

Phone Frame was x12/w366 versus public x16/w358, while desktop x112/y48/w1216 matched. Parent identified the common preview-wrapper gutter across all five new entries and reserved its coordinated integration fix. No4px compensation or shared wrapper change is added to this leaf, and the leaf spec does not prematurely assert a wrapper change that has not landed.

## Narrow parent integration required

1. Import default `TechnicianCapacity` from `./grid-advanced-technician-capacity` and map **exact ID `data-grid-advanced-10`** in `grid-advanced.tsx`. Preserve an explicit variant9 case; do not let new IDs fall through to ServiceVisits. No synthetic IDs14–21.
2. Add the exact ID → `grid-advanced-technician-capacity.tsx` implementation-first entry in `src/lib/source-targets.ts`; secondary files are static imports. Parent alone owns catalog/router/source changes.
3. Main source Copy/single-file must be byte-identical to the actual main leaf; panels/data/CSS remain available in source selection and ZIP closure. Preserve actual free grid and supporting dependencies, theme/fonts/notices. This owner has not generated or tested ZIP.
4. Parent runtime priorities: native selection/pinning/filter-sort-pagination; Maya Fri16 booking edit and Undo; one partial/full leave retaining existing bookings as overtime and its removal/Undo; add technician; deletion cascade+Undo; mobile search/focus+scroll; optional loader loading/error/retry; empty query Clear. Candidate strict/production/source/ZIP/CI belong to Root's assigned windows.

## Remaining fidelity and verification limits

The seed and totals are intentionally original. Booking Day and Time Off From/Through now use the existing free-example Select composition, matching the public `data-slot=select-trigger` / `role=combobox` date lists. CodeGraph plus file inventory confirms DateSelector is not installed; the available Calendar/Popover would implement a different public control here. Native `type=date` was removed. The list spans 30 calendar days from demo today, excludes Sundays, marks booking holidays closed and preserves an existing out-of-window ISO day for editing. Formatting uses UTC and selection stores ISO strings directly, with no local-midnight conversion. The optional date-header detail currently uses free Tooltip, because only header load information was verified, not a paid or unobserved header editor. The add-person demo starts with editable Mechanic/Mechanical/Mon–Fri defaults instead of an unfilled role/team prompt. Day-kind filtering both selects people with matching days and dims their other cells; the public filter's exact dimming policy was not previously observed. These are explicit review points, not claims of exact public parity.

All booking/time-off CRUD and loaders need browser validation despite pure math coverage. No external persistence, message sending or backend integration is implied.

## Public interaction correction before candidate build

The first draft unnecessarily blocked time off over existing work and capped a technician's day at sixteen hours. These were local assumptions, not public requirements, and have been removed before candidate integration. Fresh private headless UI evidence is in `/tmp/bricklane-grid-advanced-expansion-readonly/capacity-date-*` and `capacity-boundary-*` (JSON/PNG); all browsers closed in finally, with no local server/build.

Public Time Off submission retained Elena's three bookings and changed Fri16 to Overtime /6h of0h/−6h. Public Booking's actual supporting number input has min1, max8, step1 per appointment. Entering10 clamped the appointment to8; saving produced13h of8h/−5h. The same editor also allowed save after full-day time off, explicitly explaining the off-shift work remains overtime, and the technician picker kept Off options selectable. Thus the domain keeps bookings and applies current capacity to both rendering and warnings. Header/ring zero-capacity cases retain an undefined percentage and describe the actual hours accessibly.

These public submissions validated only the remote local demo states. The new local date/select and overtime UI still require parent candidate browser QA; domain tests now assert the corrected policy rather than the old refusal. The local optional half-hour partial-leave field is an original extension; individual service bookings follow the observed whole-hour bounds.
